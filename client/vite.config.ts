import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // In dev the SPA runs on :3000 and the API on :8080. Proxying /api keeps the
  // browser on a single origin, so the signed auth cookie behaves in dev
  // exactly as it does in production (where Express serves both).
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            motion: ['motion'],
          },
        },
      },
    },
  };
});
