#!/usr/bin/env node
/**
 * Zips the built `dist/` folder into a Chrome Web Store-ready archive.
 * Requires the system `zip` utility (preinstalled on macOS/Linux; on
 * Windows, use WSL or "Pack extension" in chrome://extensions instead).
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const distDir = resolve(root, 'dist');
const outDir = resolve(root, 'dist-zip');
const outFile = resolve(outDir, 'social-media-studio-pro.zip');

if (!existsSync(distDir)) {
  console.error('dist/ not found. Run "npm run build" first.');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const result = spawnSync('zip', ['-r', outFile, '.'], { cwd: distDir, stdio: 'inherit' });

if (result.error || result.status !== 0) {
  console.error(
    'Could not run the "zip" command. Install zip, or use chrome://extensions → "Pack extension" on the dist/ folder instead.',
  );
  process.exit(1);
}

console.log(`Packaged extension: ${outFile}`);
