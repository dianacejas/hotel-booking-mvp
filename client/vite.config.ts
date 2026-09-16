import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dev server proxies every /api request to the Express backend,
// so the frontend only ever talks to its own origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});