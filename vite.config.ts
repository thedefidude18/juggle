import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    host: true, // This allows access from network
    strictPort: true, // This ensures it uses the specified port
    watch: {
      usePolling: true,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  build: {
    sourcemap: true,
    outDir: 'dist',
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
