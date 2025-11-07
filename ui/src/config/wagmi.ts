import { createConfig } from 'wagmi';
import { hardhat, sepolia } from 'wagmi/chains';
import { http } from 'viem';

// Use basic config without WalletConnect for local development
// For localhost, we configure transport with minimal retry to prevent connection errors
// When Hardhat node is not running, wagmi will fallback to MetaMask provider
// due to multiInjectedProviderDiscovery: true
export const config = createConfig({
  chains: [hardhat, sepolia],
  transports: {
    // Configure localhost transport with minimal retry
    // If connection fails, wagmi will use MetaMask's provider automatically
    [hardhat.id]: http('http://localhost:8545', {
      retryCount: 0, // Don't retry if connection fails
      timeout: 2000, // Short timeout to fail fast
    }),
    [sepolia.id]: http(),
  },
  // Enable injected provider discovery - this allows wagmi to use MetaMask
  // even when the configured transport (localhost:8545) is not available
  multiInjectedProviderDiscovery: true,
  ssr: false,
});
