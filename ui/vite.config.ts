import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      // Required by FHEVM SDK for WebAssembly SharedArrayBuffer
      // Note: These headers may cause CORS warnings for third-party requests (e.g., Coinbase metrics)
      // These warnings are expected and don't affect FHEVM functionality
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
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
      include: ["util", "stream", "crypto", "buffer"],
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: "globalThis",
    "process.env": {},
  },
  optimizeDeps: {
    exclude: ["@zama-fhe/relayer-sdk", "@zama-fhe/relayer-sdk/bundle"],
    esbuildOptions: {
      target: "esnext",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate FHEVM SDK into its own chunk
          fhevm: ['@zama-fhe/relayer-sdk'],
          // Separate large libraries
          vendor: ['ethers', 'wagmi', 'viem'],
          // UI library chunk
          ui: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-select'],
        },
      },
    },
    // Enable source maps for production debugging but minimize
    sourcemap: false,
    // Aggressive minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
}));
