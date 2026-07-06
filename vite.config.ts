import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Social Media Studio Pro build configuration.
//
// This project is built as a Manifest V3 Chrome Extension with several
// independent HTML "pages" (popup, side panel, options) that all share the
// same React dashboard UI, plus a background service worker that owns the
// upload queue, scheduler, and platform API integrations.
//
// The `public/` directory (manifest.json, icons, _locales) is copied to
// `dist/` verbatim by Vite. The content script is bundled separately as a
// classic (non-module) IIFE script by `scripts/build-content-script.mjs`
// because Manifest V3 content scripts declared in `manifest.json` cannot be
// ES modules.
export default defineConfig(({ mode }) => ({
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@background': resolve(__dirname, 'src/background'),
    },
  },
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '1.0.0'),
    __DEV__: mode === 'development',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: mode === 'development',
    target: 'esnext',
    minify: mode === 'production' ? 'esbuild' : false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        options: resolve(__dirname, 'options.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'background' ? 'background/index.js' : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/chunk-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
}));
