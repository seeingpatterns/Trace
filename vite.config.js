import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 5174, // Psychpaper이 5173 사용 중
  },
  build: {
    outDir: 'dist',
  },
});
