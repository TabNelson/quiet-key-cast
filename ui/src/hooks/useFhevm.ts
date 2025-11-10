import { useState, useEffect, useCallback, useRef } from "react";
import { initializeFHEVM, encryptRating, resetFHEVMInstance, batchDecrypt } from "../lib/fhevm";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/bundle";
import { BrowserProvider } from "ethers";

export function useFhevm(chainId?: number) {
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to classify errors
  const classifyError = (err: any): Error => {
    const message = err?.message || 'Unknown error occurred';

    if (message.includes('Network request failed') || message.includes('fetch')) {
      return new Error('Network connection failed. Please check your internet connection and try again.');
    }

    if (message.includes('relayer') || message.includes('Relayer')) {
      return new Error('FHEVM relayer service is temporarily unavailable. Please try again in a few moments.');
    }

    if (message.includes('timeout') || message.includes('Timeout')) {
      return new Error('Request timed out. The operation may take longer than usual.');
    }

    if (message.includes('insufficient funds') || message.includes('gas')) {
      return new Error('Insufficient funds for transaction. Please add more ETH to your wallet.');
    }

    // Return original error if we can't classify it
    return err instanceof Error ? err : new Error(message);
  };

  // Initialize FHEVM with retry logic
  useEffect(() => {
    let mounted = true;

    const init = async (attemptNumber = 1) => {
      console.log(`[useFhevm] Init attempt ${attemptNumber}/${maxRetries + 1}, chainId:`, chainId);
      setLoading(true);

      if (!chainId) {
        console.log("[useFhevm] No chainId, skipping initialization");
        setLoading(false);
        setError(null);
        return;
      }

      // Only support local network and Sepolia
      if (chainId !== 31337 && chainId !== 11155111) {
        console.error("[useFhevm] Unsupported network:", chainId);
        const networkError = new Error(`Unsupported network. Please switch to local network (31337) or Sepolia (11155111). Current network: ${chainId}`);
        setError(networkError);
        setLoading(false);
        return;
      }

      try {
        setError(null);
        console.log("[useFhevm] Starting FHEVM initialization, chainId:", chainId);

        const fhevmInstance = await initializeFHEVM(chainId);

        if (mounted) {
          setInstance(fhevmInstance);
          setLoading(false);
          setRetryCount(0); // Reset retry count on success
          console.log("[useFhevm] ✅ FHEVM initialized successfully");

          // Clear any pending retry timeout
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
          }
        } else {
          console.log("[useFhevm] Component unmounted, skipping state update");
        }
      } catch (err: any) {
        console.error(`[useFhevm] ❌ FHEVM initialization failed (attempt ${attemptNumber}):`, err);

        const classifiedError = classifyError(err);
        console.error("[useFhevm] Classified error:", classifiedError.message);

        if (mounted) {
          // Check if we should retry
          const shouldRetry = attemptNumber <= maxRetries && (
            err.message?.includes('Network request failed') ||
            err.message?.includes('relayer') ||
            err.message?.includes('timeout') ||
            err.message?.includes('fetch')
          );

          if (shouldRetry) {
            const delay = Math.min(1000 * Math.pow(2, attemptNumber - 1), 10000); // Exponential backoff, max 10s
            console.log(`[useFhevm] Retrying in ${delay}ms...`);

            setRetryCount(attemptNumber);
            retryTimeoutRef.current = setTimeout(() => {
              if (mounted) {
                init(attemptNumber + 1);
              }
            }, delay);
          } else {
            setError(classifiedError);
            setLoading(false);
            setRetryCount(0);
          }
        }
      }
    };

    init();

    return () => {
      console.log("[useFhevm] Cleanup, chainId:", chainId);
      mounted = false;

      // Clear any pending retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [chainId]);

  // Reset instance on network change
  useEffect(() => {
    return () => {
      resetFHEVMInstance();
    };
  }, [chainId]);

  // Encryption function
  const encrypt = useCallback(
    async (contractAddress: string, userAddress: string, rating: number) => {
      if (!instance) {
        throw new Error("FHEVM instance not initialized");
      }
      return encryptRating(instance, contractAddress, userAddress, rating);
    },
    [instance]
  );

  // Batch decryption function (multiple values with one signature)
  const decryptMultiple = useCallback(
    async (handles: { handle: string; contractAddress: string }[], userAddress: string) => {
      if (!instance) {
        throw new Error("FHEVM instance not initialized");
      }
      
      // Get signer from window.ethereum
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      return batchDecrypt(instance, handles, userAddress, signer, chainId);
    },
    [instance, chainId]
  );

  return {
    instance,
    loading,
    error,
    isReady: !!instance && !loading && !error,
    retryCount,
    maxRetries,
    encrypt,
    decryptMultiple,
  };
}


