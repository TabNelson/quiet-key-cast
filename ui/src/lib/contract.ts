import { BrowserProvider, Contract, JsonRpcProvider, JsonRpcProvider } from "ethers";
import { RATING_SYSTEM_ADDRESS } from "@/abi/RatingSystemAddresses";
import RatingSystemArtifact from "@/abi/EncryptedRatingSystem.json";
import { batchDecrypt, getFHEVMInstance } from "./fhevm";

// Extract ABI from Hardhat artifact
const ABI = (RatingSystemArtifact as any).abi;

export interface RatingEntry {
  id: number;
  subject: string;
  timestamp: number;
  submitter: string;
  isActive: boolean;
}

// Check if contract is deployed on current network
export function isContractDeployed(chainId?: number): boolean {
  const id = chainId ?? 31337;
  let address: string;
  
  if (id === 31337) {
    address = RATING_SYSTEM_ADDRESS.localhost;
  } else if (id === 11155111) {
    address = RATING_SYSTEM_ADDRESS.sepolia;
  } else {
    return false; // Unsupported network
  }
  
  const isDeployed = address && address !== "0x0000000000000000000000000000000000000000";
  
  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('[Contract] ChainId:', id, 'Address:', address, 'IsDeployed:', isDeployed);
  }
  
  return isDeployed;
}

// Get contract address for current network (returns zero address if not deployed)
export function getContractAddress(chainId?: number): string {
  const id = chainId ?? 31337;
  if (id === 31337) {
    return RATING_SYSTEM_ADDRESS.localhost || "0x0000000000000000000000000000000000000000";
  }
  if (id === 11155111) {
    return RATING_SYSTEM_ADDRESS.sepolia || "0x0000000000000000000000000000000000000000";
  }
  return "0x0000000000000000000000000000000000000000";
}

export function getRatingSystemContract(
  provider: BrowserProvider | JsonRpcProvider,
  chainId?: number
) {
  const address = getContractAddress(chainId);
  
  // Double check: ensure address is not zero address
  if (!address || address === "0x0000000000000000000000000000000000000000" || !isContractDeployed(chainId)) {
    throw new Error(
      `EncryptedRatingSystem contract address not configured for chainId ${chainId ?? 31337}.\n` +
      `Please deploy the contract first: npm run deploy:${chainId === 11155111 ? 'sepolia' : 'local'}`
    );
  }
  return new Contract(address, ABI, provider);
}

export async function hasUserSubmitted(
  provider: BrowserProvider | JsonRpcProvider,
  userAddress: string,
  chainId?: number
): Promise<boolean> {
  if (!isContractDeployed(chainId)) {
    return false;
  }
  try {
    const contract = getRatingSystemContract(provider, chainId);
    return await contract.hasSubmitted(userAddress);
  } catch (error: any) {
    console.error("Error checking submission status:", error);
    throw new Error(
      `Failed to check submission status: ${error.message || "Unknown error"}\n` +
      "Please ensure you're connected to the correct network."
    );
  }
}

export async function hasSubmittedForSubject(
  provider: BrowserProvider | JsonRpcProvider,
  userAddress: string,
  subject: string,
  chainId?: number
): Promise<boolean> {
  if (!isContractDeployed(chainId)) {
    return false;
  }
  
  const address = getContractAddress(chainId);
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    return false;
  }
  
  try {
    const contract = getRatingSystemContract(provider, chainId);
    const result = await contract.hasSubmittedForSubject(userAddress, subject);
    return result;
  } catch (error: any) {
    // Check if error is due to invalid contract address, empty data, or missing revert data
    if (error.message?.includes("could not decode result data") || 
        error.message?.includes("BAD_DATA") ||
        error.message?.includes("missing revert data") ||
        error.code === "BAD_DATA" ||
        error.code === "CALL_EXCEPTION") {
      // This is normal if contract state hasn't been updated yet after a transaction
      // or if the user hasn't submitted yet, or if the contract function doesn't exist
      console.debug("[hasSubmittedForSubject] Contract returned empty/missing data (may be normal if user hasn't submitted or contract not fully deployed):", {
        address,
        error: error.message,
        code: error.code
      });
      return false;
    }
    console.error("[hasSubmittedForSubject] Error checking subject submission status:", error);
    // Don't throw error, just return false to prevent UI errors
    return false;
  }
}

export async function getUserEntry(
  provider: BrowserProvider | JsonRpcProvider,
  userAddress: string,
  chainId?: number
): Promise<RatingEntry | null> {
  if (!isContractDeployed(chainId)) {
    return null;
  }
  try {
    const contract = getRatingSystemContract(provider, chainId);
    const submitted = await contract.hasSubmitted(userAddress);
    if (!submitted) return null;
    // Note: Users can only have one active rating at a time
    // We'll need to find their active entry
    const entryCount = await contract.getEntryCount();
    for (let i = 0; i < entryCount; i++) {
      const entry = await contract.getEntry(i);
      if (entry.submitter === userAddress && entry.isActive) {
        return {
          id: i,
          subject: entry.subject,
          timestamp: Number(entry.timestamp),
          submitter: entry.submitter,
          isActive: entry.isActive,
        };
      }
    }
    return null;
  } catch (error: any) {
    console.error("Error getting user entry:", error);
    return null;
  }
}

export async function getActiveEntryCount(
  provider: BrowserProvider | JsonRpcProvider,
  chainId?: number
): Promise<number> {
  if (!isContractDeployed(chainId)) {
    return 0;
  }
  
  const address = getContractAddress(chainId);
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    return 0;
  }
  
  try {
    console.log("[getActiveEntryCount] Calling contract.getActiveEntryCount()...", { address, chainId });
    const contract = getRatingSystemContract(provider, chainId);
    const count = await contract.getActiveEntryCount();
    const countNumber = Number(count);
    console.log("[getActiveEntryCount] ✅ Success! Raw count:", count, "Converted:", countNumber);
    return countNumber;
  } catch (error: any) {
    console.warn("[getActiveEntryCount] Direct call failed, trying getEncryptedGlobalStats() as fallback...", {
      message: error.message,
      code: error.code
    });
    
    // Fallback: Try using getEncryptedGlobalStats() which also returns the count
    // This method returns (euint32 encryptedSum, uint32 count) where count is _globalEntryCount
    try {
      console.log("[getActiveEntryCount] Attempting fallback via getEncryptedGlobalStats()...");
      const contract = getRatingSystemContract(provider, chainId);
      const stats = await contract.getEncryptedGlobalStats();
      const count = Number(stats.count);
      console.log("[getActiveEntryCount] ✅ Fallback successful! Count from getEncryptedGlobalStats:", count);
      return count;
    } catch (fallbackError: any) {
      console.warn("[getActiveEntryCount] ❌ Both methods failed:", {
        directError: error.message,
        fallbackError: fallbackError.message,
        directCode: error.code,
        fallbackCode: fallbackError.code
      });
      
      // Check if error is due to invalid contract address or empty data
      if (error.message?.includes("could not decode result data") || 
          error.message?.includes("BAD_DATA") ||
          error.code === "BAD_DATA" ||
          fallbackError.message?.includes("could not decode result data") ||
          fallbackError.message?.includes("BAD_DATA") ||
          fallbackError.code === "BAD_DATA") {
        // This is normal if there are no entries yet or contract state hasn't updated
        // The auto-decrypt function will handle getting the count from getEncryptedGlobalStats
        console.debug("[getActiveEntryCount] Contract returned empty data - this is normal if no entries yet");
        return 0;
      }
      
      // For other errors, still return 0 to prevent crashes
      console.warn("[getActiveEntryCount] Returning 0 due to errors");
      return 0;
    }
  }
}

export async function isGlobalStatsFinalized(
  provider: BrowserProvider | JsonRpcProvider,
  chainId?: number
): Promise<boolean> {
  if (!isContractDeployed(chainId)) {
    return false;
  }
  
  const address = getContractAddress(chainId);
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    return false;
  }
  
  try {
    const contract = getRatingSystemContract(provider, chainId);
    return await contract.isGlobalStatsFinalized();
  } catch (error: any) {
    // Check if error is due to invalid contract address
    if (error.message?.includes("could not decode result data") || 
        error.message?.includes("BAD_DATA") ||
        error.code === "BAD_DATA") {
      console.warn("Contract may not be deployed at address:", address);
      return false;
    }
    console.error("Error checking global stats finalized:", error);
    return false;
  }
}

export async function getGlobalStats(
  provider: BrowserProvider | JsonRpcProvider,
  chainId?: number
): Promise<{ average: number; count: number; finalized: boolean }> {
  if (!isContractDeployed(chainId)) {
    return { average: 0, count: 0, finalized: false };
  }
  
  const address = getContractAddress(chainId);
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    return { average: 0, count: 0, finalized: false };
  }
  
  try {
    const contract = getRatingSystemContract(provider, chainId);
    
    // First get active count (this should work even if stats aren't finalized)
    let activeCount = 0;
    try {
      activeCount = Number(await contract.getActiveEntryCount());
      console.log('[getGlobalStats] Active entry count:', activeCount);
    } catch (countError: any) {
      console.warn('[getGlobalStats] Failed to get active entry count:', countError);
      // Continue even if this fails
    }
    
    // Check if stats are finalized
    let finalized = false;
    try {
      finalized = await contract.isGlobalStatsFinalized();
      console.log('[getGlobalStats] Stats finalized:', finalized);
    } catch (finalizedError: any) {
      console.warn('[getGlobalStats] Failed to check if finalized:', finalizedError);
      // If we can't check, assume not finalized and return active count
      return { average: 0, count: activeCount, finalized: false };
    }

    if (!finalized) {
      return { average: 0, count: activeCount, finalized: false };
    }

    // Stats are finalized, get the actual stats
    const stats = await contract.getGlobalStats();
    return {
      average: Number(stats.averageRating),
      count: Number(stats.totalCount),
      finalized: true,
    };
  } catch (error: any) {
    // Check if error is due to invalid contract address or contract not deployed
    if (error.message?.includes("could not decode result data") || 
        error.message?.includes("BAD_DATA") ||
        error.code === "BAD_DATA" ||
        error.message?.includes("not configured")) {
      console.warn("Contract may not be deployed at address:", address);
      return { average: 0, count: 0, finalized: false };
    }
    console.error("Error getting global stats:", error);
    return { average: 0, count: 0, finalized: false };
  }
}

export async function requestGlobalStats(
  provider: BrowserProvider,
  chainId?: number
) {
  if (!isContractDeployed(chainId)) {
    throw new Error(
      `EncryptedRatingSystem contract address not configured for chainId ${chainId ?? 31337}.\n` +
      `Please deploy the contract first: npm run deploy:${chainId === 11155111 ? 'sepolia' : 'local'}`
    );
  }
  const signer = await provider.getSigner();
  const contract = getRatingSystemContract(provider, chainId).connect(signer);
  return await contract.requestGlobalStats();
}

export async function submitRating(
  provider: BrowserProvider,
  encryptedHandle: string,
  inputProof: string,
  subject: string,
  chainId?: number
) {
  if (!isContractDeployed(chainId)) {
    throw new Error(
      `EncryptedRatingSystem contract address not configured for chainId ${chainId ?? 31337}.\n` +
      `Please deploy the contract first: npm run deploy:${chainId === 11155111 ? 'sepolia' : 'local'}`
    );
  }

  if (!subject || subject.trim().length === 0) {
    throw new Error("Subject cannot be empty");
  }
  if (subject.length > 100) {
    throw new Error("Subject is too long (max 100 characters)");
  }

  // Import ethers dynamically to avoid issues
  const { ethers } = await import("ethers");

  // Convert parameters to the correct format for contract call
  const contractAddress = getContractAddress(chainId);
  const signer = await provider.getSigner();

  // Create contract instance using ethers (like secret-vault-check)
  const contract = new ethers.Contract(
    contractAddress,
    ABI,
    signer
  );

  try {
    console.log("[submitRating] Submitting to contract with params:", {
      encryptedHandle: encryptedHandle.slice(0, 20) + "...",
      inputProofLength: inputProof.length,
      subject,
      contractAddress
    });

    // Call submitRating with correct parameter types
    const tx = await contract.submitRating(
      encryptedHandle as `0x${string}`, // bytes32
      inputProof as `0x${string}`,       // bytes
      subject                             // string
    );

    console.log("Transaction submitted:", tx.hash);
    return tx;
  } catch (error: any) {
    console.error("Error submitting rating:", error);

    // Parse common errors
    if (error.message?.includes("Already submitted for this subject")) {
      throw new Error("You have already submitted a rating for this subject. Please choose a different subject or update your existing rating.");
    } else if (error.message?.includes("user rejected")) {
      throw new Error("Transaction was rejected by user.");
    } else if (error.message?.includes("insufficient funds")) {
      throw new Error("Insufficient funds to pay for gas. Please add more ETH to your wallet.");
    } else {
      throw new Error(`Failed to submit rating: ${error.message || "Unknown error"}`);
    }
  }
}

export async function updateRating(
  provider: BrowserProvider,
  encryptedHandle: string,
  inputProof: string,
  newSubject: string,
  chainId?: number
) {
  if (!isContractDeployed(chainId)) {
    throw new Error(
      `EncryptedRatingSystem contract address not configured for chainId ${chainId ?? 31337}.\n` +
      `Please deploy the contract first: npm run deploy:${chainId === 11155111 ? 'sepolia' : 'local'}`
    );
  }
  try {
    if (!newSubject || newSubject.trim().length === 0) {
      throw new Error("Subject cannot be empty");
    }
    if (newSubject.length > 100) {
      throw new Error("Subject is too long (max 100 characters)");
    }

    const signer = await provider.getSigner();
    const contract = getRatingSystemContract(provider, chainId).connect(signer);
    const tx = await contract.updateRating(encryptedHandle, inputProof, newSubject);

    console.log("Update transaction submitted:", tx.hash);
    return tx;
  } catch (error: any) {
    console.error("Error updating rating:", error);

    // Parse common errors
    if (error.message?.includes("No entry to update")) {
      throw new Error("You don't have a rating entry to update. Please submit a rating first.");
    } else if (error.message?.includes("user rejected")) {
      throw new Error("Transaction was rejected by user.");
    } else if (error.message?.includes("insufficient funds")) {
      throw new Error("Insufficient funds to pay for gas. Please add more ETH to your wallet.");
    } else {
      throw new Error(`Failed to update rating: ${error.message || "Unknown error"}`);
    }
  }
}

export async function deleteRating(
  provider: BrowserProvider,
  chainId?: number
) {
  if (!isContractDeployed(chainId)) {
    throw new Error(
      `EncryptedRatingSystem contract address not configured for chainId ${chainId ?? 31337}.\n` +
      `Please deploy the contract first: npm run deploy:${chainId === 11155111 ? 'sepolia' : 'local'}`
    );
  }
  try {
    const signer = await provider.getSigner();
    const contract = getRatingSystemContract(provider, chainId).connect(signer);
    const tx = await contract.deleteRating();

    console.log("Delete transaction submitted:", tx.hash);
    return tx;
  } catch (error: any) {
    console.error("Error deleting rating:", error);

    // Parse common errors
    if (error.message?.includes("No entry to delete")) {
      throw new Error("You don't have a rating entry to delete.");
    } else if (error.message?.includes("user rejected")) {
      throw new Error("Transaction was rejected by user.");
    } else if (error.message?.includes("insufficient funds")) {
      throw new Error("Insufficient funds to pay for gas. Please add more ETH to your wallet.");
    } else {
      throw new Error(`Failed to delete rating: ${error.message || "Unknown error"}`);
    }
  }
}

// Get subject-specific statistics
export async function getSubjectStats(
  provider: BrowserProvider | JsonRpcProvider,
  subject: string,
  chainId?: number
): Promise<{ average: number; count: number; finalized: boolean }> {
  if (!isContractDeployed(chainId)) {
    return { average: 0, count: 0, finalized: false };
  }
  
  const address = getContractAddress(chainId);
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    return { average: 0, count: 0, finalized: false };
  }
  
  try {
    const contract = getRatingSystemContract(provider, chainId);
    const finalized = await contract.isSubjectStatsFinalized(subject);
    if (!finalized) return { average: 0, count: 0, finalized: false };
    const stats = await contract.getSubjectStats(subject);
    return {
      average: Number(stats.averageRating),
      count: Number(stats.count),
      finalized: true,
    };
  } catch (error: any) {
    // Check if error is due to invalid contract address or contract not deployed
    if (error.message?.includes("could not decode result data") || 
        error.message?.includes("BAD_DATA") ||
        error.code === "BAD_DATA" ||
        error.message?.includes("not configured")) {
      console.warn("Contract may not be deployed at address:", address);
      return { average: 0, count: 0, finalized: false };
    }
    console.error("Error getting subject stats:", error);
    return { average: 0, count: 0, finalized: false };
  }
}

export async function requestSubjectStats(
  provider: BrowserProvider,
  subject: string,
  chainId?: number
) {
  if (!isContractDeployed(chainId)) {
    throw new Error(
      `EncryptedRatingSystem contract address not configured for chainId ${chainId ?? 31337}.\n` +
      `Please deploy the contract first: npm run deploy:${chainId === 11155111 ? 'sepolia' : 'local'}`
    );
  }
  const signer = await provider.getSigner();
  const contract = getRatingSystemContract(provider, chainId).connect(signer);
  return await contract.requestSubjectStats(subject);
}

export async function getSubjectEntryCount(
  provider: BrowserProvider | JsonRpcProvider,
  subject: string,
  chainId?: number
): Promise<number> {
  if (!isContractDeployed(chainId)) {
    return 0;
  }
  try {
    const contract = getRatingSystemContract(provider, chainId);
    return Number(await contract.getSubjectEntryCount(subject));
  } catch (error: any) {
    console.error("Error getting subject entry count:", error);
    return 0;
  }
}

// Mock decryption for localhost network only
// Uses userDecryptHandleBytes32 from @fhevm/mock-utils (like secret-vault-check)
export async function mockDecryptGlobalStats(
  provider: BrowserProvider,
  chainId?: number
): Promise<{ average: number; count: number }> {
  const id = chainId ?? 31337;
  if (id !== 31337) {
    throw new Error("Mock decryption is only available on localhost network (chainId 31337)");
  }

  try {
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    const contract = getRatingSystemContract(provider, chainId).connect(signer);
    const contractAddress = getContractAddress(chainId);

    // Check if already finalized
    const isFinalized = await contract.isGlobalStatsFinalized();
    if (isFinalized) {
      const stats = await contract.getGlobalStats();
      return {
        average: Number(stats.averageRating),
        count: Number(stats.totalCount),
      };
    }

    // Get encrypted stats
    const stats = await contract.getEncryptedGlobalStats();
    const encryptedTotal = stats.encryptedSum;
    const count = Number(stats.count);

    if (count === 0) {
      throw new Error("No active entries to decrypt");
    }

    console.log("[mockDecryptGlobalStats] Starting mock decryption for global stats...");
    console.log("[mockDecryptGlobalStats] Encrypted total handle:", encryptedTotal);
    console.log("[mockDecryptGlobalStats] Active count:", count);

    // Convert handle to correct format
    let handleToDecrypt = String(encryptedTotal);
    if (handleToDecrypt.startsWith("0x")) {
      // Already in hex format
    } else if (typeof encryptedTotal === "bigint") {
      handleToDecrypt = "0x" + encryptedTotal.toString(16).padStart(64, '0');
    } else {
      // Try to convert to hex
      handleToDecrypt = "0x" + String(encryptedTotal).padStart(64, '0');
    }

    // Validate handle format
    if (!handleToDecrypt || handleToDecrypt === "0x" || handleToDecrypt.length !== 66) {
      throw new Error(`Invalid handle format: ${handleToDecrypt}`);
    }

    // Import userDecryptHandleBytes32 from @fhevm/mock-utils
    const { userDecryptHandleBytes32 } = await import("@fhevm/mock-utils");
    const rpcProvider = new JsonRpcProvider("http://localhost:8545");

    console.log("[mockDecryptGlobalStats] Decrypting handle using userDecryptHandleBytes32...");
    
    // Decrypt using userDecryptHandleBytes32 (no Ethereum request needed)
    const decryptedTotal = await userDecryptHandleBytes32(
      rpcProvider,
      signer,
      contractAddress,
      handleToDecrypt,
      userAddress
    );

    console.log("[mockDecryptGlobalStats] Decrypted total:", decryptedTotal);

    const totalValue = Number(decryptedTotal);
    const average = Math.floor(totalValue / count);

    console.log(`[mockDecryptGlobalStats] Result: total=${totalValue}, count=${count}, average=${average}`);

    // Trigger callback manually to finalize stats
    const requestId = 1; // Mock request ID
    const averageBytes = "0x" + average.toString(16).padStart(8, '0'); // Convert to hex bytes (uint32)

    console.log("[mockDecryptGlobalStats] Triggering callback with average:", average);
    const tx = await contract.globalStatsCallback(requestId, averageBytes, []);
    await tx.wait();

    console.log("[mockDecryptGlobalStats] ✅ Mock decryption completed successfully");

    return { average, count };
  } catch (error: any) {
    console.error("[mockDecryptGlobalStats] ❌ Mock decryption failed:", error);

    throw new Error(`Mock decryption failed: ${error.message || "Unknown error"}`);
  }
}

// Mock decryption for subject stats on localhost network only
// Uses userDecryptHandleBytes32 from @fhevm/mock-utils (like secret-vault-check)
export async function mockDecryptSubjectStats(
  provider: BrowserProvider,
  subject: string,
  chainId?: number
): Promise<{ average: number; count: number }> {
  const id = chainId ?? 31337;
  if (id !== 31337) {
    throw new Error("Mock decryption is only available on localhost network (chainId 31337)");
  }

  try {
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    const contract = getRatingSystemContract(provider, chainId).connect(signer);
    const contractAddress = getContractAddress(chainId);

    // Check if already finalized
    const isFinalized = await contract.isSubjectStatsFinalized(subject);
    if (isFinalized) {
      const stats = await contract.getSubjectStats(subject);
      return {
        average: Number(stats.averageRating),
        count: Number(stats.count),
      };
    }

    // Get encrypted subject stats
    const stats = await contract.getEncryptedSubjectStats(subject);
    const encryptedTotal = stats.encryptedSum;
    const count = Number(stats.count);

    if (count === 0) {
      throw new Error(`No entries for subject: ${subject}`);
    }

    console.log(`[mockDecryptSubjectStats] Starting mock decryption for subject "${subject}"...`);
    console.log("[mockDecryptSubjectStats] Encrypted total handle:", encryptedTotal);
    console.log("[mockDecryptSubjectStats] Entry count:", count);

    // Convert handle to correct format
    let handleToDecrypt = String(encryptedTotal);
    if (handleToDecrypt.startsWith("0x")) {
      // Already in hex format
    } else if (typeof encryptedTotal === "bigint") {
      handleToDecrypt = "0x" + encryptedTotal.toString(16).padStart(64, '0');
    } else {
      // Try to convert to hex
      handleToDecrypt = "0x" + String(encryptedTotal).padStart(64, '0');
    }

    // Validate handle format
    if (!handleToDecrypt || handleToDecrypt === "0x" || handleToDecrypt.length !== 66) {
      throw new Error(`Invalid handle format: ${handleToDecrypt}`);
    }

    // Import userDecryptHandleBytes32 from @fhevm/mock-utils
    const { userDecryptHandleBytes32 } = await import("@fhevm/mock-utils");
    const rpcProvider = new JsonRpcProvider("http://localhost:8545");

    console.log("[mockDecryptSubjectStats] Decrypting handle using userDecryptHandleBytes32...");
    
    // Decrypt using userDecryptHandleBytes32 (no Ethereum request needed)
    const decryptedTotal = await userDecryptHandleBytes32(
      rpcProvider,
      signer,
      contractAddress,
      handleToDecrypt,
      userAddress
    );

    console.log("[mockDecryptSubjectStats] Decrypted total:", decryptedTotal);

    const totalValue = Number(decryptedTotal);
    const average = Math.floor(totalValue / count);

    console.log(`[mockDecryptSubjectStats] Result for "${subject}": total=${totalValue}, count=${count}, average=${average}`);

    // Trigger callback manually to finalize stats
    const requestId = 1; // Mock request ID
    const averageBytes = "0x" + average.toString(16).padStart(8, '0'); // Convert to hex bytes (uint32)

    console.log("[mockDecryptSubjectStats] Triggering callback with average:", average);
    const tx = await contract.subjectStatsCallback(requestId, averageBytes, []);
    await tx.wait();

    console.log("[mockDecryptSubjectStats] ✅ Mock subject decryption completed successfully");

    return { average, count };
  } catch (error: any) {
    console.error("[mockDecryptSubjectStats] ❌ Mock subject decryption failed:", error);

    throw new Error(`Mock subject decryption failed: ${error.message || "Unknown error"}`);
  }
}

/**
 * Allow user to decrypt aggregate data
 * This function grants permission to decrypt encrypted statistics
 */
export async function allowUserToDecrypt(
  provider: BrowserProvider,
  userAddress: string,
  subjects: string[],
  chainId?: number
) {
  if (!isContractDeployed(chainId)) {
    throw new Error(
      `EncryptedRatingSystem contract address not configured for chainId ${chainId ?? 31337}.\n` +
      `Please deploy the contract first: npm run deploy:${chainId === 11155111 ? 'sepolia' : 'local'}`
    );
  }

  try {
    const signer = await provider.getSigner();
    const contract = getRatingSystemContract(provider, chainId).connect(signer);
    
    console.log("[allowUserToDecrypt] Granting decryption permission...", {
      userAddress,
      subjects,
      chainId
    });

    // Check if function exists in contract
    if (!contract.allowUserToDecrypt) {
      throw new Error(
        "allowUserToDecrypt function not found in contract. " +
        "The contract needs to be redeployed with the updated code. " +
        "Please contact the administrator to redeploy the contract."
      );
    }

    const tx = await contract.allowUserToDecrypt(userAddress, subjects);
    console.log("[allowUserToDecrypt] Transaction submitted:", tx.hash);
    
    await tx.wait();
    console.log("[allowUserToDecrypt] ✅ Permission granted successfully");
    
    return tx;
  } catch (error: any) {
    console.error("Error granting decryption permission:", error);
    
    // Provide helpful error message
    if (error.message?.includes("is not a function") || error.message?.includes("not found in contract")) {
      throw new Error(
        "This contract version doesn't support automatic permission granting. " +
        "The contract needs to be redeployed with the updated code. " +
        "For now, you can only decrypt data if you have submitted a rating."
      );
    }
    
    throw new Error(`Failed to grant decryption permission: ${error.message || "Unknown error"}`);
  }
}
