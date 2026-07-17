import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Renderer (the dashboard UI) is built as a normal Vite/React SPA and loaded
// by Electron's BrowserWindow either from the dev server (npm run dev) or
// from dist/index.html in production. The main/preload processes are
// compiled separately by tsc (see tsconfig.electron.json / npm run build:electron).
export default defineConfig({
  root: '.',
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5183,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
