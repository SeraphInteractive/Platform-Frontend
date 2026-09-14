import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://35.192.18.39',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@platform/internal-logic': resolve(__dirname, '../vote-internals/src/index.ts'),
    },
  },
});
