import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'stream', 'util', 'crypto'],
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
  server: {
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  define: {
    // Anchor / web3.js expect these globals in browser
    'process.env.BROWSER': JSON.stringify(true),
  },
});
