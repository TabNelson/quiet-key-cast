import { StrictMode } from 'react'
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { config } from './config/wagmi';
import App from "./App.tsx";
import "./index.css";

// Configure QueryClient to handle connection errors gracefully
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry on connection errors for localhost
      retry: (failureCount, error: any) => {
        // Don't retry if it's a connection refused error
        if (error?.message?.includes('ERR_CONNECTION_REFUSED') || 
            error?.message?.includes('localhost:8545')) {
          return false;
        }
        // Retry other errors up to 3 times
        return failureCount < 3;
      },
      // Increase staleTime to reduce unnecessary queries
      staleTime: 1000 * 60, // 1 minute
      // Don't refetch on window focus if we're on localhost and connection fails
      refetchOnWindowFocus: (query) => {
        // Check if the error is a connection error
        if (query.state.error?.message?.includes('ERR_CONNECTION_REFUSED')) {
          return false;
        }
        return true;
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider theme={lightTheme({ borderRadius: 'large' })}>
          <App />
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </StrictMode>
);
