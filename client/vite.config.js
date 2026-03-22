import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@strudel')) return 'strudel';
          if (id.includes('@codemirror') || id.includes('/codemirror/')) return 'codemirror';
          if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
          if (id.includes('lucide-react')) return 'ui-vendor';
          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
