import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/upload': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/query': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
});
