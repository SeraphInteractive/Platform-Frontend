import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const targetUrl = env.VITE_API_URL || 'https://api.seraphinteractive.com';
  const proxyTarget = targetUrl.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      open: false,
      host: true,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/health': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    resolve: {
      alias: {
        '@platform/internal-logic': resolve(__dirname, '../vote-internals/src/index.ts'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-query': ['@tanstack/react-query'],
          },
        },
      },
    },
  };
});
