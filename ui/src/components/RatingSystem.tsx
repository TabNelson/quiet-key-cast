import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Star, TrendingUp, Users, Shield, RefreshCw, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';

// Import FHEVM utilities and contract functions
import { getFHEVMInstance, encryptRating } from '@/lib/fhevm';
import { useFhevm } from '@/hooks/useFhevm';
import {
  getContractAddress,
  isContractDeployed,
  submitRating,
  updateRating,
  deleteRating,
  requestGlobalStats,
  requestSubjectStats,
  getGlobalStats,
  getSubjectStats,
  getActiveEntryCount,
  getSubjectEntryCount,
  hasSubmittedForSubject,
  mockDecryptGlobalStats,
  mockDecryptSubjectStats,
  allowUserToDecrypt
} from '@/lib/contract';
import { BrowserProvider, Contract } from 'ethers';
import RatingSystemArtifact from '@/abi/EncryptedRatingSystem.json';
import ExportDialog from './ExportDialog';

const RatingSystem = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [rating, setRating] = useState<number>(5);
  const [subject, setSubject] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [globalStats, setGlobalStats] = useState<{ average: number; count: number; finalized: boolean } | null>(null);
  const [leadershipStats, setLeadershipStats] = useState<{ average: number; count: number; finalized: boolean } | null>(null);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [isLoadingStatistics, setIsLoadingStatistics] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState<boolean>(false);
  const [userHasSubmitted, setUserHasSubmitted] = useState<boolean>(false);

  // Decrypted data (like secret-vault-check)
  const [decryptedGlobalTotal, setDecryptedGlobalTotal] = useState<bigint>(0n);
  const [decryptedGlobalCount, setDecryptedGlobalCount] = useState<bigint>(0n);
  const [decryptedLeadershipTotal, setDecryptedLeadershipTotal] = useState<bigint>(0n);
  const [decryptedLeadershipCount, setDecryptedLeadershipCount] = useState<bigint>(0n);
  const isDecryptingRef = useRef(false);

  // Initialize FHEVM
  const fhe = useFhevm(chainId);

  // Check if contract is deployed on current network
  const contractDeployed = isContractDeployed(chainId);
  
  const contractAddress = getContractAddress(chainId);
  const ABI = (RatingSystemArtifact as any).abi;
  
  // Get contract address
  const getCurrentContractAddress = () => {
    try {
      return getContractAddress(chainId);
    } catch (error) {
      return "0x0000000000000000000000000000000000000000";
    }
  };

  // Auto-decrypt aggregates (like secret-vault-check)
  useEffect(() => {
    const run = async () => {
      if (!contractDeployed || !contractAddress || !fhe.isReady || !address || contractAddress === "0x0000000000000000000000000000000000000000") {
        return;
      }
      
      // Prevent concurrent decryption
      if (isDecryptingRef.current) {
        return;
      }
      
      isDecryptingRef.current = true;
      
      try {
        console.log("[AutoDecrypt] 🔍 Reading handles from contract...");
        
        const provider = new BrowserProvider((window as any).ethereum);
        const contract = new Contract(contractAddress, ABI, provider);
        
        // Read global encrypted stats
        let globalStatsResult;
        let globalTotalHandle = "0x";
        let globalCountValue = 0;
        
        try {
          globalStatsResult = await contract.getEncryptedGlobalStats();
          globalTotalHandle = String(globalStatsResult[0]); // encryptedSum (euint32)
          globalCountValue = Number(globalStatsResult[1]); // count (uint32) - already decrypted!
        } catch (error: any) {
          console.warn("[AutoDecrypt] Failed to get global stats (may be normal if no entries):", error.message);
          // Continue with default values
        }
        
        // Read leadership encrypted stats
        let leadershipStatsResult;
        let leadershipTotalHandle = "0x";
        let leadershipCountValue = 0;
        
        try {
          leadershipStatsResult = await contract.getEncryptedSubjectStats('Leadership');
          leadershipTotalHandle = String(leadershipStatsResult[0]); // encryptedSum (euint32)
          leadershipCountValue = Number(leadershipStatsResult[1]); // count (uint32) - already decrypted!
        } catch (error: any) {
          console.warn("[AutoDecrypt] Failed to get leadership stats (may be normal if no entries):", error.message);
          // Continue with default values
        }
        
        console.log("[AutoDecrypt] Handles from contract:", {
          globalTotalHandle: globalTotalHandle?.slice(0, 20) + "...",
          globalCount: globalCountValue,
          leadershipTotalHandle: leadershipTotalHandle?.slice(0, 20) + "...",
          leadershipCount: leadershipCountValue
        });
        
        // Helper to validate handle
        const isValidHandle = (handle: string): boolean => {
          return !!(handle && 
                 handle !== "0x" && 
                 handle.length >= 66 &&
                 handle !== "0x0000000000000000000000000000000000000000000000000000000000000000" &&
                 /^0x[0-9a-fA-F]{64}$/.test(handle));
        };
        
        // Collect handles to decrypt
        const handlesToDecrypt: { handle: string; contractAddress: string; type: string }[] = [];
        
        if (isValidHandle(globalTotalHandle)) {
          handlesToDecrypt.push({ handle: globalTotalHandle, contractAddress, type: 'globalTotal' });
        }
        
        if (isValidHandle(leadershipTotalHandle)) {
          handlesToDecrypt.push({ handle: leadershipTotalHandle, contractAddress, type: 'leadershipTotal' });
        }
        
        // Set counts (these are already decrypted uint32 values)
        setDecryptedGlobalCount(BigInt(globalCountValue));
        setDecryptedLeadershipCount(BigInt(leadershipCountValue));
        setActiveCount(globalCountValue);
        
        if (handlesToDecrypt.length === 0) {
          console.warn("[AutoDecrypt] No valid handles to decrypt");
          return;
        }
        
        console.log("[AutoDecrypt] ✨ Batch decrypting", handlesToDecrypt.length, "handles...");
        
        // Batch decrypt totals
        const results = await fhe.decryptMultiple(
          handlesToDecrypt.map(h => ({ handle: h.handle, contractAddress: h.contractAddress })),
          address
        );
        
        console.log("[AutoDecrypt] ✅ Batch decryption complete!", results);
        
        // Apply results
        for (const item of handlesToDecrypt) {
          const value = results[item.handle];
          if (value !== undefined) {
            const bigValue = BigInt(value);
            if (item.type === 'globalTotal') {
              setDecryptedGlobalTotal(bigValue);
              console.log("[AutoDecrypt] ✅ Global total:", value);
            } else if (item.type === 'leadershipTotal') {
              setDecryptedLeadershipTotal(bigValue);
              console.log("[AutoDecrypt] ✅ Leadership total:", value);
            }
          }
        }
        
        console.log("[AutoDecrypt] 🎉 All values displayed successfully!");
      } catch (error: any) {
        console.error("[AutoDecrypt] ❌ Decryption error:", error);
        
        // If authorization error, try to grant permission automatically
        if (error.message?.includes("not authorized") || error.message?.includes("not authorized to user decrypt")) {
          console.log("[AutoDecrypt] 🔑 Authorization error detected, attempting to grant permission...");
          
          try {
            if (!window.ethereum || !address) return;
            
            const provider = new BrowserProvider((window as any).ethereum);
            const predefinedSubjects = ["Leadership", "Team Performance", "Service Quality", "Innovation", "Communication"];
            
            // Grant permission for all predefined subjects
            await allowUserToDecrypt(provider, address, predefinedSubjects, Number(chainId));
            
            console.log("[AutoDecrypt] ✅ Permission granted! Retrying decryption...");
            toast.success("Decryption permission granted! Please refresh the page.");
            
            // Retry after a short delay
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } catch (grantError: any) {
            console.error("[AutoDecrypt] ❌ Failed to grant permission:", grantError);
            
            // Check if function doesn't exist (contract not deployed or old version)
            if (grantError.message?.includes("is not a function") || 
                grantError.message?.includes("doesn't support automatic permission") ||
                grantError.message?.includes("needs to be redeployed")) {
              toast.warning(
                "⚠️ Contract not deployed or outdated version\n\n" +
                "Please ensure the new contract is deployed to Sepolia testnet.\n\n" +
                "Deployment steps:\n" +
                "1. Get Sepolia testnet ETH (at least 0.01 ETH)\n" +
                "2. Run: npm run deploy:sepolia\n" +
                "3. Update the address in ui/src/abi/RatingSystemAddresses.ts",
                { 
                  duration: 8000,
                  style: { whiteSpace: 'pre-line', maxWidth: '500px' }
                }
              );
            } else {
              toast.error("Failed to grant decryption permission. Please try again.");
            }
          }
        }
      } finally {
        isDecryptingRef.current = false;
      }
    };
    
    run();
  }, [contractDeployed, contractAddress, fhe.isReady, address, chainId, fhe.decryptMultiple, fhe.instance]);

  // Load contract data on mount and when account/chain changes
  // Only load basic data first, delay FHEVM-dependent operations
  useEffect(() => {
    if (isConnected && address && contractDeployed) {
      loadBasicContractData();
      checkUserSubmission();
    } else if (isConnected && address && !contractDeployed) {
      // Reset state when contract is not deployed
      setActiveCount(0);
      setGlobalStats(null);
      setLeadershipStats(null);
      setUserHasSubmitted(false);
    }
  }, [isConnected, address, chainId, contractDeployed]);

  const loadBasicContractData = async () => {
    try {
      if (!window.ethereum) return;

      const provider = new BrowserProvider(window.ethereum);
      const chainId = await provider.getNetwork().then(network => network.chainId);

      // Try to load active count (this may fail if no entries yet, which is OK)
      // The auto-decrypt function will handle getting the count from getEncryptedGlobalStats
      try {
        const count = await getActiveEntryCount(provider, Number(chainId));
        if (count > 0) {
          setActiveCount(count);
        }
      } catch (countError: any) {
        // It's OK if this fails - auto-decrypt will handle it
        console.debug('[loadBasicContractData] Could not get active count (may be normal):', countError.message);
      }

      // Set empty stats initially
      setGlobalStats(null);
      setLeadershipStats(null);
    } catch (error: any) {
      console.error('Error loading basic contract data:', error);
      // Don't show error for BAD_DATA - it's normal if no entries yet
      if (!error.message?.includes('initSDK') &&
          !error.message?.includes('FHEVM') &&
          !error.message?.includes('relayer-sdk') &&
          !error.message?.includes('BAD_DATA') &&
          !error.message?.includes('could not decode')) {
        toast.error('Failed to load basic contract data');
      }
    }
  };

  const loadContractData = async () => {
    try {
      if (!window.ethereum) {
        setIsLoadingStatistics(false);
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const chainId = await provider.getNetwork().then(network => network.chainId);

      // Check if contract is deployed before attempting to load
      if (!isContractDeployed(Number(chainId))) {
        setGlobalStats({ average: 0, count: 0, finalized: false });
        setLeadershipStats({ average: 0, count: 0, finalized: false });
        setStatsLoaded(true);
        setIsLoadingStatistics(false);
        return;
      }

      // First, try to get active count directly (this should always work)
      console.log('[loadContractData] Getting active entry count...', { chainId: Number(chainId) });
      try {
        const activeCount = await getActiveEntryCount(provider, Number(chainId));
        console.log('[loadContractData] ✅ Active entry count received:', activeCount);
        if (activeCount > 0) {
          setActiveCount(activeCount);
          console.log('[loadContractData] ✅ Active count set to:', activeCount);
        } else {
          console.warn('[loadContractData] ⚠️ Active count is 0 - this might be normal if no entries yet or transaction not confirmed');
          setActiveCount(0);
        }
      } catch (countError: any) {
        console.error('[loadContractData] ❌ Failed to get active count:', countError);
        // Continue anyway
        setActiveCount(0);
      }

      // Load global stats (requires FHEVM)
      console.log('[loadContractData] Loading global stats...');
      const globalData = await getGlobalStats(provider, Number(chainId));
      console.log('[RatingSystem] Global stats loaded:', globalData);
      setGlobalStats(globalData);
      
      // Update activeCount from global stats if it's higher (stats might have more accurate count)
      if (globalData.count > 0) {
        console.log('[loadContractData] Updating activeCount from global stats:', globalData.count);
        setActiveCount(globalData.count);
      }

      // Load leadership stats (requires FHEVM)
      console.log('[loadContractData] Loading leadership stats...');
      const leadershipData = await getSubjectStats(provider, 'Leadership', Number(chainId));
      console.log('[RatingSystem] Leadership stats loaded:', leadershipData);
      setLeadershipStats(leadershipData);
      setStatsLoaded(true);
      
      // Always set loading to false after data is loaded
      setIsLoadingStatistics(false);
      
      console.log('[loadContractData] ✅ Statistics loaded successfully');

    } catch (error: any) {
      console.error('Error loading FHEVM contract data:', error);
      
      // Set default values on error to prevent UI issues
      setGlobalStats({ average: 0, count: 0, finalized: false });
      setLeadershipStats({ average: 0, count: 0, finalized: false });
      setStatsLoaded(true);
      setIsLoadingStatistics(false);
      
      // Don't show error to user for FHEVM-related issues or BAD_DATA errors
      if (!error.message?.includes('initSDK') &&
          !error.message?.includes('FHEVM') &&
          !error.message?.includes('relayer-sdk') &&
          !error.message?.includes('BAD_DATA') &&
          !error.message?.includes('could not decode')) {
        toast.error('Failed to load contract data');
      }
    }
  };

  const handleLoadStatistics = useCallback(async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoadingStatistics(true);
    await loadContractData();
  }, [isConnected, loadContractData]);

  const checkUserSubmission = async () => {
    try {
      if (!window.ethereum || !address) return;

      const provider = new BrowserProvider(window.ethereum);
      const chainId = await provider.getNetwork().then(network => network.chainId);

      // Check if user has submitted for leadership (as an example)
      const hasSubmitted = await hasSubmittedForSubject(provider, address, 'Leadership', Number(chainId));
      setUserHasSubmitted(hasSubmitted);
    } catch (error: any) {
      console.error('Error checking user submission:', error);
      // Don't show error to user for FHEVM-related issues
      if (!error.message?.includes('initSDK') &&
          !error.message?.includes('FHEVM') &&
          !error.message?.includes('relayer-sdk')) {
        toast.error('Failed to check user submission');
      }
    }
  };

  const predefinedSubjects = [
    'Leadership',
    'Team Performance',
    'Customer Service',
    'Product Quality',
    'Work Environment',
    'Company Culture',
    'Management',
    'Communication',
    'Innovation',
    'Work-Life Balance'
  ];

  const handleSubmitRating = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!subject) {
      toast.error('Please select a subject to rate');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current chainId first
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      console.log('[handleSubmitRating] Starting submission...', {
        chainId,
        address,
        subject,
        rating
      });

      // Check if FHEVM is ready
      if (!fhe.isReady) {
        throw new Error("FHEVM is not ready. Please wait for initialization.");
      }
      
      const contractAddress = getCurrentContractAddress();
      console.log('[handleSubmitRating] Contract address:', contractAddress);

      if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error("Contract address not configured. Please deploy the contract first.");
      }

      // Encrypt the rating using fhe.encrypt (like secret-vault-check)
      // Note: On Sepolia, this will trigger MetaMask signature request
      console.log('[handleSubmitRating] Starting encryption (MetaMask may prompt for signature)...');
      toast.info('Encrypting your rating... (Please approve MetaMask signature if prompted)');
      
      const encrypted = await fhe.encrypt(contractAddress, address, rating);
      const handles = encrypted.handles;
      const inputProof = encrypted.inputProof;
      
      console.log('[handleSubmitRating] Encryption successful, handles:', handles.length);

      // Submit to contract
      console.log('[handleSubmitRating] Submitting to contract...');
      toast.info('Submitting encrypted rating to blockchain...');
      const tx = await submitRating(provider, handles[0], inputProof, subject, chainId);

      // Wait for confirmation
      toast.info('Waiting for transaction confirmation...');
      const receipt = await tx.wait();
      console.log('[handleSubmitRating] Transaction confirmed:', {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        status: receipt.status
      });

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      toast.success('Rating submitted successfully!');

      // Wait a bit for contract state to update (especially on local network)
      // Local networks sometimes need a moment for state to sync
      console.log('[handleSubmitRating] Waiting for contract state to update...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Increased to 2 seconds

      // Refresh basic data first (this includes activeCount)
      console.log('[handleSubmitRating] Refreshing basic contract data...');
      await loadBasicContractData();
      
      // Wait a bit more and check again
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadBasicContractData();
      
      await checkUserSubmission();

      // If stats are already loaded, refresh them too
      if (statsLoaded) {
        console.log('[handleSubmitRating] Refreshing statistics...');
        await loadContractData();
      }
      
      console.log('[handleSubmitRating] ✅ Submission complete!');

    } catch (error: any) {
      console.error('Error submitting rating:', error);

      // Handle specific error types
      if (error.message?.includes('Already submitted for this subject')) {
        toast.error('You have already submitted a rating for this subject. Please choose a different subject or update your existing rating.');
      } else if (error.message?.includes('user rejected')) {
        toast.error('Transaction was rejected by user.');
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('Insufficient funds to pay for gas. Please add more ETH to your wallet.');
      } else if (error.message?.includes('initSDK') ||
                 error.message?.includes('FHEVM') ||
                 error.message?.includes('relayer-sdk') ||
                 error.message?.includes('Cannot read properties of undefined')) {
        // FHEVM SDK initialization errors - show user-friendly message
        toast.error('FHEVM encryption service is not available. Please try again later or contact support.');
      } else {
        toast.error(`Failed to submit rating: ${error.message || "Unknown error"}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestGlobalStats = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (isLoadingStats) {
      toast.info('Statistics request already in progress...');
      return;
    }

    setIsLoadingStats(true);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      // Check if we're on localhost (chainId 31337) for mock decryption
      if (chainId === 31337) {
        console.log('[handleRequestGlobalStats] Using mock decryption for localhost');
        toast.info('Decrypting global statistics (local test mode)...');
        const result = await mockDecryptGlobalStats(provider, chainId);
        toast.success(`Global statistics decrypted! Average: ${result.average}/10, Count: ${result.count}`);
      } else {
        // Real network - request decryption via oracle
        console.log('[handleRequestGlobalStats] Requesting decryption via oracle for network:', chainId);
        toast.info('Requesting global statistics decryption...');
        const tx = await requestGlobalStats(provider, chainId);
        await tx.wait();
        toast.success('Global statistics decryption requested! Results will be available shortly.');
      }

      // Refresh data
      await loadContractData();

    } catch (error: any) {
      console.error('Error requesting global stats:', error);
      if (error.message?.includes('initSDK') ||
          error.message?.includes('FHEVM') ||
          error.message?.includes('relayer-sdk') ||
          error.message?.includes('Cannot read properties of undefined')) {
        toast.error('FHEVM encryption service is not available. Please try again later.');
      } else {
        toast.error(`Failed to request global statistics: ${error.message || "Unknown error"}`);
      }
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleRequestSubjectStats = async (subjectName: string) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoadingStats(true);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      // Check if we're on localhost (chainId 31337) for mock decryption
      if (chainId === 31337) {
        console.log('[handleRequestSubjectStats] Using mock decryption for localhost');
        toast.info(`Decrypting ${subjectName} statistics (local test mode)...`);
        const result = await mockDecryptSubjectStats(provider, subjectName, chainId);
        toast.success(`${subjectName} statistics decrypted! Average: ${result.average}/10, Count: ${result.count}`);
      } else {
        // Real network - request decryption via oracle
        console.log('[handleRequestSubjectStats] Requesting decryption via oracle for network:', chainId);
        toast.info(`Requesting ${subjectName} statistics decryption...`);
        const tx = await requestSubjectStats(provider, subjectName, chainId);
        await tx.wait();
        toast.success(`${subjectName} statistics decryption requested! Results will be available shortly.`);
      }

      // Refresh data
      await loadContractData();

    } catch (error: any) {
      console.error('Error requesting subject stats:', error);
      if (error.message?.includes('initSDK') ||
          error.message?.includes('FHEVM') ||
          error.message?.includes('relayer-sdk') ||
          error.message?.includes('Cannot read properties of undefined')) {
        toast.error('FHEVM encryption service is not available. Please try again later.');
      } else {
        toast.error(`Failed to request ${subjectName} statistics: ${error.message || "Unknown error"}`);
      }
    } finally {
      setIsLoadingStats(false);
    }
  };

  const renderStars = useCallback((rating: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <button
            key={star}
            onClick={interactive ? () => setRating(star) : undefined}
            className={`text-2xl ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''} ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
            disabled={!interactive}
          >
            ★
          </button>
        ))}
      </div>
    );
  }, []);

  const networkName = useMemo(() =>
    chainId === 11155111 ? 'Sepolia' : chainId === 31337 ? 'Localhost' : `Chain ID ${chainId}`,
    [chainId]
  );

  return (
    <div className="responsive-container py-8 sm:py-12 spacing-responsive">
      {/* Show message if contract is not deployed */}
      {isConnected && !contractDeployed && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Contract Not Deployed</p>
              <p>
                The EncryptedRatingSystem contract is not deployed on {networkName} (Chain ID: {chainId}).
              </p>
              <p className="text-sm mt-2">
                To deploy the contract, run:
              </p>
              <code className="block bg-muted p-2 rounded text-sm mt-2">
                npm run deploy:{chainId === 11155111 ? 'sepolia' : 'local'}
              </code>
              <p className="text-sm mt-2">
                Alternatively, switch to a network where the contract is deployed.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Rating Submission Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Submit Your Rating
          </CardTitle>
          <CardDescription>
            Rate anonymously using fully homomorphic encryption. Your individual rating remains private.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isConnected && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Please connect your wallet to submit ratings and view statistics.
              </AlertDescription>
            </Alert>
          )}

          <div className="form-responsive">
            <div>
              <Label htmlFor="subject" className="text-responsive">What are you rating?</Label>
              <Select
                value={subject}
                onValueChange={setSubject}
                disabled={!isConnected || (isConnected && !contractDeployed)}
              >
                <SelectTrigger className="responsive-card">
                  <SelectValue placeholder="Select a subject..." />
                </SelectTrigger>
                <SelectContent>
                  {predefinedSubjects.map((subj) => (
                    <SelectItem key={subj} value={subj}>
                      {subj}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-responsive">Rating (1-10)</Label>
              <div className="mt-2">
                <div className="stars-responsive">
                  {renderStars(rating, isConnected && contractDeployed)}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2 text-center sm:text-left">
                  Selected rating: {rating}/10
                </p>
              </div>
            </div>

            <Button
              onClick={handleSubmitRating}
              disabled={!isConnected || !subject || isSubmitting || (isConnected && !contractDeployed)}
              className="btn-responsive"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Encrypting & Submitting...' : 'Submit Encrypted Rating'}
            </Button>

            {isSubmitting && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Processing your rating...</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  This may take a moment as your rating is encrypted and submitted to the blockchain.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Global Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Global Statistics
            </CardTitle>
            <CardDescription>
              Aggregated ratings across all subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Display decrypted data (like secret-vault-check) */}
            {decryptedGlobalCount > 0n ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <Badge variant="outline" className="self-start sm:self-auto text-xs">
                    {decryptedGlobalTotal.toString()}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm text-muted-foreground">Count:</span>
                  <Badge variant="outline" className="self-start sm:self-auto text-xs">
                    {decryptedGlobalCount.toString()}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm text-muted-foreground">Average Rating:</span>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    {decryptedGlobalCount > 0n && (
                      <>
                        <div className="flex justify-center sm:justify-start">
                          {renderStars(Number(decryptedGlobalTotal) / Number(decryptedGlobalCount))}
                        </div>
                        <Badge variant="secondary" className="self-center sm:self-auto text-xs">
                          {(Number(decryptedGlobalTotal) / Number(decryptedGlobalCount)).toFixed(2)}/10
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    disabled={fhe.loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                  </Button>
                  <ExportDialog
                    globalStats={globalStats}
                    leadershipStats={leadershipStats}
                    decryptedGlobalTotal={decryptedGlobalTotal}
                    decryptedGlobalCount={decryptedGlobalCount}
                    decryptedLeadershipTotal={decryptedLeadershipTotal}
                    decryptedLeadershipCount={decryptedLeadershipCount}
                  />
                </div>
                {fhe.loading && (
                  <p className="text-xs text-muted-foreground text-center">
                    ⏳ Initializing FHEVM...
                  </p>
                )}
              </div>
            ) : !statsLoaded ? (
              <div className="text-center py-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-muted-foreground font-medium">
                      {fhe.loading ? 'Initializing FHEVM encryption service...' : 'Loading encrypted statistics...'}
                    </p>
                  </div>
                  {fhe.loading && (
                    <p className="text-xs text-muted-foreground">
                      Setting up secure connection to FHEVM relayer...
                    </p>
                  )}
                  {!fhe.isReady && !fhe.loading && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        FHEVM service not available.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Statistics will load automatically when the service becomes available.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No ratings submitted yet. Be the first to submit a rating!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subject Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Leadership Ratings
            </CardTitle>
            <CardDescription>
              Average rating for Leadership category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Display decrypted data (like secret-vault-check) */}
            {decryptedLeadershipCount > 0n ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <Badge variant="outline" className="self-start sm:self-auto text-xs">
                    {decryptedLeadershipTotal.toString()}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm text-muted-foreground">Count:</span>
                  <Badge variant="outline" className="self-start sm:self-auto text-xs">
                    {decryptedLeadershipCount.toString()}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm text-muted-foreground">Average Rating:</span>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    {decryptedLeadershipCount > 0n && (
                      <>
                        <div className="flex justify-center sm:justify-start">
                          {renderStars(Number(decryptedLeadershipTotal) / Number(decryptedLeadershipCount))}
                        </div>
                        <Badge variant="secondary" className="self-center sm:self-auto text-xs">
                          {(Number(decryptedLeadershipTotal) / Number(decryptedLeadershipCount)).toFixed(2)}/10
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No leadership ratings yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* How It Works Section */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            Understanding the privacy-preserving rating system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">1. Encrypt & Submit</h3>
              <p className="text-sm text-muted-foreground">
                Your rating is encrypted on your device using FHEVM before submission.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">2. Compute on Encrypted Data</h3>
              <p className="text-sm text-muted-foreground">
                Smart contracts perform calculations on encrypted data without decryption.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">3. View Aggregated Results</h3>
              <p className="text-sm text-muted-foreground">
                Only aggregated statistics are decrypted and made public.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RatingSystem;


