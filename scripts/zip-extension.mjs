import { createWriteStream } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');
const releaseDir = resolve(root, 'release');
mkdirSync(releaseDir, { recursive: true });

const out = resolve(releaseDir, 'content-hunter-ai-pro.zip');
execSync(`cd "${dist}" && zip -r "${out}" .`, { stdio: 'inherit' });
console.log('Packaged', out);
