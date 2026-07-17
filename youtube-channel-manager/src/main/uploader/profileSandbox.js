'use strict';

const fs = require('fs-extra');
const path = require('path');
const { app } = require('electron');

// Files/directories inside a Chrome profile that are large, purely cache,
// or can hold OS-level file locks while the real browser is running. None
// of these are required to keep a website (e.g. YouTube) logged in, so we
// skip them when cloning a profile into our own automation sandbox. This
// keeps the clone small, fast, and safe to copy even while the user's real
// Chrome window is open.
const SKIP_NAMES = new Set([
  'Cache',
  'Code Cache',
  'GPUCache',
  'DawnCache',
  'DawnGraphiteCache',
  'DawnWebGPUCache',
  'GrShaderCache',
  'ShaderCache',
  'GraphiteDawnCache',
  'Media Cache',
  'Service Worker',
  'Crashpad',
  'component_crx_cache',
  'extensions_crx_cache',
  'CrashpadMetrics-active.pma',
  'SingletonLock',
  'SingletonSocket',
  'SingletonCookie',
  'lockfile',
  'LOCK',
  'RunningChromeVersion'
]);

const SKIP_EXTENSIONS = new Set(['.tmp', '.log']);

function shouldSkip(itemPath) {
  const base = path.basename(itemPath);
  if (SKIP_NAMES.has(base)) return true;
  if (SKIP_EXTENSIONS.has(path.extname(base))) return true;
  return false;
}

function getAutomationProfilesRoot() {
  return path.join(app.getPath('userData'), 'automation-profiles');
}

function getSandboxDir(channelId) {
  return path.join(getAutomationProfilesRoot(), channelId);
}

/**
 * Clones the login-relevant parts of a real Chrome profile into a
 * dedicated sandbox directory that Playwright will launch as its own
 * persistent context. The clone is a standalone copy - it never touches
 * the user's real Chrome profile, so it's safe to run even while the real
 * Chrome browser is open, and nothing the automation does can corrupt the
 * original profile.
 *
 * Resulting layout matches what Chrome expects for a single-profile
 * `--user-data-dir`:
 *   <sandboxDir>/Local State
 *   <sandboxDir>/Default/...
 */
async function syncProfileIntoSandbox(sourceProfileDir, userDataRoot, channelId) {
  const sandboxDir = getSandboxDir(channelId);
  await fs.ensureDir(sandboxDir);

  const sourceLocalState = path.join(userDataRoot, 'Local State');
  if (await fs.pathExists(sourceLocalState)) {
    await fs.copy(sourceLocalState, path.join(sandboxDir, 'Local State'), { overwrite: true });
  }

  const destProfileDir = path.join(sandboxDir, 'Default');
  await fs.emptyDir(destProfileDir);
  await fs.copy(sourceProfileDir, destProfileDir, {
    overwrite: true,
    errorOnExist: false,
    filter: (src) => !shouldSkip(src)
  });

  return sandboxDir;
}

/**
 * Ensures a sandbox profile directory exists for a channel that has no
 * linked "real" Chrome profile (a brand new, empty automation profile that
 * the user logs into manually the first time they run it).
 */
async function ensureBlankSandbox(channelId) {
  const sandboxDir = getSandboxDir(channelId);
  await fs.ensureDir(path.join(sandboxDir, 'Default'));
  return sandboxDir;
}

async function removeSandbox(channelId) {
  const sandboxDir = getSandboxDir(channelId);
  await fs.remove(sandboxDir);
}

module.exports = {
  getSandboxDir,
  syncProfileIntoSandbox,
  ensureBlankSandbox,
  removeSandbox
};
