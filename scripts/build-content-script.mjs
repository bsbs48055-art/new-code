#!/usr/bin/env node
/**
 * Bundles the content script(s) as classic (non-module) IIFE scripts using
 * esbuild, since Manifest V3 `content_scripts` entries declared in
 * manifest.json cannot be ES modules. This runs as a second build step
 * after the main Vite build (which handles the HTML pages and the
 * background service worker, which *can* be ES modules).
 */

import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

await build({
  entryPoints: [resolve(root, 'src/content-scripts/accountDetector.ts')],
  outfile: resolve(root, 'dist/content-scripts/accountDetector.js'),
  bundle: true,
  format: 'iife',
  target: 'chrome116',
  minify: process.env.NODE_ENV === 'production',
  sourcemap: process.env.NODE_ENV !== 'production',
});

console.log('Built content script: dist/content-scripts/accountDetector.js');
