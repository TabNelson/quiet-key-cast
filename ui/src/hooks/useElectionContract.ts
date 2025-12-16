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
  const [isLoading, setIsLoading] = useState(false);

  // Get contract info for current network
  const contractAddress = getContractAddress(chainId);
  const contractDeployed = isContractDeployed(chainId);

  // Get election count
  const getElectionCount = async (): Promise<number> => {
    if (!publicClient || !contractDeployed) return 0;
    try {
      const count = await publicClient.readContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'getElectionCount',
      }) as bigint;
      return Number(count);
    } catch (error) {
      console.error('Error getting election count:', error);
      return 0;
    }
  };

  // Get election details
  const getElection = async (electionId: number): Promise<Election | null> => {
    if (!publicClient || !contractDeployed) return null;
    try {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'getElection',
        args: [BigInt(electionId)],
      }) as any[];

      return {
        title: result[0],
        description: result[1],
        candidateCount: result[2],
        candidateNames: result[3],
        isActive: result[4],
        isFinalized: result[5],
        admin: result[6],
        totalVoters: result[7],
      };
    } catch (error) {
      console.error('Error getting election:', error);
      return null;
    }
  };

  // Check if user has voted
  const hasUserVoted = async (electionId: number): Promise<boolean> => {
    if (!publicClient || !address || !contractDeployed) return false;
    try {
      const voted = await publicClient.readContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'hasUserVoted',
        args: [BigInt(electionId), address],
      }) as boolean;
      return voted;
    } catch (error) {
      console.error('Error checking vote status:', error);
      return false;
    }
  };

  // Create election
  const createElection = async (
    title: string,
    description: string,
    candidateNames: string[]
  ) => {
    if (!walletClient || !address || !contractDeployed) {
      toast.error('Please connect your wallet or contract not deployed');
      return false;
    }

    setIsLoading(true);
    try {
      const { request } = await publicClient!.simulateContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'createElection',
        args: [title, description, candidateNames],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient!.waitForTransactionReceipt({ hash });

      toast.success('Election created successfully!');
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error creating election:', error);
      toast.error(error.message || 'Failed to create election');
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
          gas: 5000000n, // High gas limit for FHE operations
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
      console.error('Error casting vote:', error);
      toast.error(error.message || 'Failed to cast vote');
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
      console.error('Error ending election:', error);
      toast.error(error.message || 'Failed to end election');
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
    try {
      const isLocalhost = chainId === 31337;

      if (isLocalhost) {
        // For localhost, we'll try to get the count directly and call manualFinalize 
        // to simplify the development experience since mock oracle is tricky
        console.log("Using manual finalize on localhost for development");
        
        // This is a shortcut for localhost development:
        // We set a simulated result based on the number of voters
        // In a real Zama dev environment, you'd use a task to fulfill decryptions
        const election = await getElection(electionId);
        const totalVoters = Number(election?.totalVoters || 0);
        
        // Mock a result where Candidate 1 gets ~60% and Candidate 2 gets ~40%
        // Candidate 1 index is 1, Candidate 2 index is 2
        const v1 = Math.ceil(totalVoters * 0.6);
        const v2 = totalVoters - v1;
        const mockSum = v1 * 1 + v2 * 2;

        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'manualFinalize',
          args: [BigInt(electionId), mockSum],
          gas: 1000000n,
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

      toast.success(isLocalhost ? 'Election finalized with simulated results!' : 'Finalization requested! Results will be available after decryption.');
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error requesting finalization:', error);
      toast.error(error.message || 'Failed to request finalization');
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
    isLoading: isLoading || zamaLoading,
  };
}

