// refactor: optimize frontend component structure  // improve user experience  // optimize component rendering
import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { getContractAddress, isContractDeployed, CONTRACT_ABI } from '../config/contracts';
import { useZamaInstance } from './useZamaInstance';
import { useState } from 'react';
import { toast } from 'sonner';

export interface Election {
  title: string;
  description: string;
  candidateCount: bigint;
  candidateNames: string[];
  endTime: bigint;
  isActive: boolean;
  isFinalized: boolean;
  admin: string;
  totalVoters: bigint;
}

export function useElectionContract() {
  const chainId = useChainId();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { zamaInstance, encrypt, decrypt, isLoading: zamaLoading } = useZamaInstance();
  // Loading state for async operations
  const [isLoading, setIsLoading] = useState(false);

  // Get contract info for current network
  // Get contract address for current network
  const contractAddress = getContractAddress(chainId);
  // Check if contract is deployed on current network
  const contractDeployed = isContractDeployed(chainId);

  // Get election count
  const getElectionCount = async (): Promise<number> => {
    if (!publicClient || !contractDeployed) return 0;
    try {
    try {
    try {
    try {
      console.error('Error creating election:', error);
      toast.error(error?.message || 'Failed to create election');
      setIsLoading(false);
      return false;
    }
  };

  // Cast vote
  const castVote = async (electionId: number, candidateIndex: number) => {
    if (!walletClient || !address || !zamaInstance || !contractDeployed) {
      toast.error('Please connect your wallet and wait for encryption to initialize');
      return false;
    }

    setIsLoading(true);
    // Reset loading state on error
    // Reset loading state on error
    // Reset loading state on error
    try {
      // Encrypt the vote (candidate index + 1, e.g., 1, 2, 3)
      const voteValue = candidateIndex + 1;

      if (!encrypt) {
        throw new Error('Encryption not ready');
      }

      const encryptedInput = await encrypt(contractAddress, address, voteValue);

      // Check if we're on localhost network (chainId 31337)
      const isLocalhost = chainId === 31337;

      if (isLocalhost) {
        // For localhost, skip gas estimation and use high gas limit
        // FHE operations on localhost often fail gas estimation
        console.log("Calling vote on localhost network (skipping gas estimation)");
        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'vote',
          args: [BigInt(electionId), encryptedInput.handles[0], encryptedInput.inputProof],
          gas: 1000000n, // High gas limit for FHE operations
        });
        await publicClient!.waitForTransactionReceipt({ hash });
      } else {
        // For other networks, use normal gas estimation
        const { request } = await publicClient!.simulateContract({
          address: contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'vote',
          args: [BigInt(electionId), encryptedInput.handles[0], encryptedInput.inputProof],
          account: address,
        });

        const hash = await walletClient.writeContract(request);
        await publicClient!.waitForTransactionReceipt({ hash });
      }

      toast.success('Vote cast successfully!');
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error creating election:', error);
      toast.error(error?.message || 'Failed to create election');
      setIsLoading(false);
      return false;
    }
  };

  // End election (anyone can call after end time)
  const endElection = async (electionId: number) => {
    if (!walletClient || !address || !contractDeployed) {
      toast.error('Please connect your wallet or contract not deployed');
      return false;
    }

    setIsLoading(true);
    // Reset loading state on error
    // Reset loading state on error
    // Reset loading state on error
    try {
      const isLocalhost = chainId === 31337;

      if (isLocalhost) {
        // For localhost, skip gas estimation
        console.log("Ending election on localhost network (skipping gas estimation)");
        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'endElection',
          args: [BigInt(electionId)],
          gas: 1000000n,
        });
        await publicClient!.waitForTransactionReceipt({ hash });
      } else {
        const { request } = await publicClient!.simulateContract({
          address: contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'endElection',
          args: [BigInt(electionId)],
          account: address,
        });

        const hash = await walletClient.writeContract(request);
        await publicClient!.waitForTransactionReceipt({ hash });
      }

      toast.success('Election ended successfully!');
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error creating election:', error);
      toast.error(error?.message || 'Failed to create election');
      setIsLoading(false);
      return false;
    }
  };

  // Request election finalization (decrypt results)
  const finalizeElection = async (electionId: number) => {
    if (!walletClient || !address || !contractDeployed) {
      toast.error('Please connect your wallet or contract not deployed');
      return false;
    }

    setIsLoading(true);
    // Reset loading state on error
    // Reset loading state on error
    // Reset loading state on error
    try {
      const isLocalhost = chainId === 31337;

      if (isLocalhost) {
        // For localhost, skip gas estimation
        console.log("Requesting finalization on localhost network (skipping gas estimation)");
        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'finalizeElection',
          args: [BigInt(electionId)],
          gas: 2000000n,
        });
        await publicClient!.waitForTransactionReceipt({ hash });
      } else {
        const { request } = await publicClient!.simulateContract({
          address: contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'finalizeElection',
          args: [BigInt(electionId)],
          account: address,
        });

        const hash = await walletClient.writeContract(request);
        await publicClient!.waitForTransactionReceipt({ hash });
      }

      toast.success('Finalization requested! Results will be available after decryption.');
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error creating election:', error);
      toast.error(error?.message || 'Failed to create election');
      setIsLoading(false);
      return false;
    }
  };

  // Get decrypted vote sum (only available after finalization)
  const getDecryptedVoteSum = async (electionId: number): Promise<number | null> => {
    if (!publicClient || !contractDeployed) {
      return null;
    }

    try {
      const decryptedSum = await publicClient.readContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'getDecryptedVoteSum',
        args: [BigInt(electionId)],
      }) as bigint;

      return Number(decryptedSum);
    } catch (error) {
      console.error('Error getting decrypted sum:', error);
      return null;
    }
  };

  return {
    getElectionCount,
    getElection,
    hasUserVoted,
    createElection,
    castVote,
    endElection,
    finalizeElection,
    getDecryptedVoteSum,
    contractDeployed,
    // Combined loading state
    // Combined loading state
    // Combined loading state
    isLoading: isLoading || zamaLoading,
  };
}

