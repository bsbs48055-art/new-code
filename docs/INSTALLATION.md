# Installation Guide

## Prerequisites

- Node.js 18+ and npm (Node 22 recommended)
- Google Chrome 116+ (for Side Panel API support)

## 1. Build the extension

```bash
npm install
npm run build
```

This produces a `dist/` folder containing the complete, unpacked extension (manifest, background service worker, popup/side panel/options pages, icons, and content script).

## 2. Load it into Chrome

1. Open `chrome://extensions` in Chrome.
2. Toggle **Developer mode** on (top-right corner).
3. Click **Load unpacked**.
4. Select the `dist/` folder produced in step 1.
5. Social Media Studio Pro should now appear in your extensions list and toolbar.

## 3. Open the dashboard

- Click the extension's toolbar icon to open the **popup** (quick status + shortcut into the full dashboard).
- Click **Open Dashboard** in the popup, or click the extension icon a second time, to open the **Side Panel** — the main dashboard with all features.
- Right-click the extension icon → **Options** (or click **Settings** in the popup) to open the full-page **Settings** surface.

## 4. Connect your platforms

Before you can publish anything, you need to:

1. Register your own developer apps with Google (YouTube), Facebook, and/or TikTok — see **[API_SETUP.md](API_SETUP.md)**. This is required because the extension intentionally ships with **no bundled API credentials**; every user connects their own apps and their own accounts.
2. Enter the resulting App ID / Client Key values in **Settings → Platform Apps**.
3. Click **Connect** next to each platform in **Settings → Platform Connections**. This opens each platform's own official login/consent screen — the extension never sees your password.

## 5. (Optional) Run the local helper server

TikTok's OAuth token exchange and Facebook's long-lived token exchange both require a confidential "client secret" that must never ship inside a browser extension. For those two flows, this project includes a small optional local server:

```bash
npm run server:install
cp server/.env.example server/.env
# edit server/.env with your TikTok/Facebook app secrets
npm run server
```

YouTube does not need this server — it works out of the box once you've added your Google OAuth Client ID to `public/manifest.json` (see API_SETUP.md) and rebuilt.

## Reloading after changes

After making code changes, run `npm run build` again, then click the refresh icon on the extension's card in `chrome://extensions` (or use `npm run dev` for an auto-rebuilding watch mode, then manually reload the extension in Chrome after each rebuild — Chrome does not currently hot-reload MV3 extensions automatically).

## Uninstalling / resetting local data

Removing the extension from `chrome://extensions` deletes all of its local IndexedDB/`chrome.storage` data (upload history, profiles, templates, settings, encrypted tokens). Use **Settings → Backup & Restore → Export Backup** first if you want to keep a copy.
