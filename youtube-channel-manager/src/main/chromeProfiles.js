'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Returns candidate "User Data" root directories for Chrome / Chrome-based
 * browsers on the current platform. Chrome stores one sub-folder per
 * profile ("Default", "Profile 1", "Profile 2", ...) inside this root, and
 * a "Local State" JSON file that describes every profile (display name,
 * associated Google account, avatar, last-used timestamp, etc).
 */
function getUserDataRoots() {
  const home = os.homedir();
  const platform = process.platform;
  const roots = [];

  if (platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    roots.push(
      { browser: 'Google Chrome', dir: path.join(localAppData, 'Google', 'Chrome', 'User Data') },
      { browser: 'Chrome Beta', dir: path.join(localAppData, 'Google', 'Chrome Beta', 'User Data') },
      { browser: 'Microsoft Edge', dir: path.join(localAppData, 'Microsoft', 'Edge', 'User Data') },
      { browser: 'Brave', dir: path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data') }
    );
  } else if (platform === 'darwin') {
    roots.push(
      { browser: 'Google Chrome', dir: path.join(home, 'Library', 'Application Support', 'Google', 'Chrome') },
      { browser: 'Microsoft Edge', dir: path.join(home, 'Library', 'Application Support', 'Microsoft Edge') },
      { browser: 'Brave', dir: path.join(home, 'Library', 'Application Support', 'BraveSoftware', 'Brave-Browser') }
    );
  } else {
    roots.push(
      { browser: 'Google Chrome', dir: path.join(home, '.config', 'google-chrome') },
      { browser: 'Chromium', dir: path.join(home, '.config', 'chromium') },
      { browser: 'Microsoft Edge', dir: path.join(home, '.config', 'microsoft-edge') },
      { browser: 'Brave', dir: path.join(home, '.config', 'BraveSoftware', 'Brave-Browser') }
    );
  }

  return roots.filter((r) => fs.existsSync(r.dir));
}

function readJsonSafe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

/**
 * Scans every known browser's "User Data" root and returns a flat list of
 * profiles, each with enough information for the UI to let the user pick
 * "which Chrome profile is this YouTube channel logged into".
 */
function listChromeProfiles() {
  const roots = getUserDataRoots();
  const profiles = [];

  for (const root of roots) {
    const localStatePath = path.join(root.dir, 'Local State');
    const localState = readJsonSafe(localStatePath);
    const infoCache = localState && localState.profile && localState.profile.info_cache;

    if (infoCache) {
      for (const [folderName, info] of Object.entries(infoCache)) {
        const profileDir = path.join(root.dir, folderName);
        if (!fs.existsSync(profileDir)) continue;

        profiles.push({
          id: `${root.browser}::${folderName}`,
          browser: root.browser,
          userDataRoot: root.dir,
          folderName,
          profileDir,
          displayName: info.name || info.shortcut_name || folderName,
          googleAccount: info.user_name || info.gaia_name || null,
          avatarIcon: info.avatar_icon || null,
          isSignedIn: Boolean(info.user_name),
          lastUsedTime: statMTime(profileDir)
        });
      }
    } else if (fs.existsSync(path.join(root.dir, 'Default'))) {
      // Fallback for browsers without a readable Local State (rare/older
      // installs) - at least surface the "Default" profile.
      const profileDir = path.join(root.dir, 'Default');
      profiles.push({
        id: `${root.browser}::Default`,
        browser: root.browser,
        userDataRoot: root.dir,
        folderName: 'Default',
        profileDir,
        displayName: `${root.browser} (Default)`,
        googleAccount: null,
        avatarIcon: null,
        isSignedIn: false,
        lastUsedTime: statMTime(profileDir)
      });
    }
  }

  profiles.sort((a, b) => (b.lastUsedTime || 0) - (a.lastUsedTime || 0));
  return profiles;
}

function statMTime(dirPath) {
  try {
    return fs.statSync(dirPath).mtimeMs;
  } catch {
    return 0;
  }
}

module.exports = { listChromeProfiles, getUserDataRoots };
