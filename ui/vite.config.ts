import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    // COOP/COEP headers are required for FHEVM WebAssembly SharedArrayBuffer
    // but they can cause CORS issues with external resources in development.
    // In production, these are required for security. In development, we can disable them
    // to avoid console errors while still maintaining FHEVM functionality.
    headers: mode === 'production' ? {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    } : {},
  },
  plugins: [
    react(), 
    nodePolyfills({
      // Enable polyfills for Node.js modules
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Polyfill specific modules
      include: ['util', 'stream', 'crypto', 'buffer'],
    }),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  optimizeDeps: {
    exclude: ['@zama-fhe/relayer-sdk', '@zama-fhe/relayer-sdk/bundle'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
}));
