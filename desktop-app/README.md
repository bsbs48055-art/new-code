# TikTok Multi Uploader (Desktop)

A Windows/macOS/Linux desktop app with a dashboard for publishing one video to **several TikTok accounts you own**, from a single click — through TikTok's own official **Content Posting API**, not by automating tiktok.com.

## Why it works this way

TikTok does not allow third-party apps to "reuse" an already-logged-in Chrome profile/session to post videos — the only sanctioned way to publish on someone's behalf is TikTok's [Content Posting API](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post), where **each account explicitly signs in and grants permission via OAuth**. Anything that instead drives a real TikTok account through the login page and web UI with saved cookies/sessions (browser automation, "profile hijacking", etc.) violates TikTok's Terms of Service and routinely gets accounts banned — so this app deliberately does not do that, even though it was the original ask.

What you get instead is the same day-to-day workflow — one dashboard, add each of your TikTok accounts once, then pick a video and blast it to all (or some) of them — but built on the durable, ToS-compliant path:

- **You connect each account yourself**, once, via TikTok's real login page opened in your system browser. This app never sees or stores your TikTok password.
- Publishing goes through `/v2/post/publish/video/init/` (TikTok's official upload+publish endpoint), the same API used by professional scheduling tools like Later, Buffer, Hootsuite, etc.
- Access tokens are encrypted at rest with your OS's secure keychain (Windows Credential Manager / macOS Keychain / Linux Secret Service).

**Trade-off you should know about up front:** TikTok requires every developer app to pass an audit before it can publish *publicly* through the API. Until your app is audited, posts go out as **"Only me" (private)** — see [docs/API_SETUP.md](../docs/API_SETUP.md) for what that means in practice and how to request an audit.

## Features

- **Dashboard** — connected accounts, upload stats, recent activity at a glance.
- **Accounts** — connect/remove TikTok accounts via OAuth; see each account's posting status (audited vs. private-only).
- **Upload** — pick a video, write a caption, toggle comments/duet/stitch, choose privacy, select which accounts to post to, and post to all of them with one click. Accounts are processed one at a time with a configurable delay in between.
- **Activity log** — a live, local log of every connection and upload attempt, including TikTok's own error messages when something fails.
- **Settings** — plug in your own TikTok Developer app credentials (Client Key/Secret), tune the delay between accounts, and change the local OAuth redirect port.

## Quick start (run from source)

```bash
cd desktop-app
npm install
npm run dev            # starts the Vite dev server for the dashboard UI
npm run dev:electron   # in a second terminal: builds + launches the Electron shell against it
```

Or build once and just run it:

```bash
npm run build
npm start
```

## Building the installable `.exe`

electron-builder's Windows NSIS installer needs to run on (or emulate) Windows, so the easiest way to get a real `.exe` is:

1. **On a Windows machine:**

   ```powershell
   cd desktop-app
   npm install
   npm run dist:win
   ```

   This produces `desktop-app/release/TikTok Multi Uploader-Setup-<version>.exe` (installer) and a portable `.exe` that needs no installation.

2. **Or let GitHub Actions build it for you** — this repo includes [`.github/workflows/build-desktop-app.yml`](../.github/workflows/build-desktop-app.yml), which builds both `.exe` files on a `windows-latest` runner and uploads them as a downloadable workflow artifact on every push to `main` (and can be triggered manually from the Actions tab).

## Before you can upload anything

1. Register your own TikTok Developer app and turn on the Login Kit + Content Posting API products — see [docs/API_SETUP.md](../docs/API_SETUP.md). This app ships with **zero bundled TikTok credentials** by design.
2. Paste your app's Client Key and Client Secret into **Settings**.
3. Go to **Accounts → Connect TikTok account** for each TikTok account you want to publish to (this opens TikTok's real sign-in page in your browser).
4. Go to **Upload**, pick a video, write a caption, choose accounts, and post.

## Project structure

```
desktop-app/
├── electron/                 Main process (Node) — this is what has file-system/network access
│   ├── main.ts                 App bootstrap, BrowserWindow creation
│   ├── preload.ts               contextBridge — the only bridge between renderer and main
│   ├── types.ts                  Shared types + IPC channel names
│   ├── services/
│   │   ├── secureStore.ts         Encrypted-at-rest local JSON store (accounts, tokens, settings)
│   │   ├── oauthServer.ts          Loopback HTTP server that captures TikTok's OAuth redirect
│   │   ├── tiktokAuth.ts            PKCE + authorize URL + token exchange/refresh + creator info
│   │   ├── tiktokUploader.ts        Content Posting API: init → chunked upload → publish status
│   │   └── logger.ts                In-memory + forwarded-to-renderer activity log
│   └── ipc/                     One ipcMain.handle() module per feature area
├── src/                       Renderer — the React dashboard UI (sandboxed, no Node access)
│   ├── pages/                    Dashboard, Accounts, Upload, Logs, Settings
│   ├── components/                Sidebar, etc.
│   └── state/store.ts              Zustand store that talks to `window.api` (from preload.ts)
├── build/                     App icon(s)
└── electron-builder.yml       Packaging config (NSIS installer + portable exe for Windows)
```

## Security notes

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` — the renderer (dashboard UI) never has direct Node.js or file-system access; every privileged action goes through the explicit, typed IPC surface in `preload.ts`.
- The TikTok Client Secret and every account's access/refresh tokens are encrypted with Electron's `safeStorage` (OS keychain-backed) before being written to disk.
- The OAuth authorization step always opens your real, default system browser (`shell.openExternal`) — TikTok's login page is never embedded inside an app-controlled window, so this app never has access to your typed TikTok password.
- Content Security Policy is set in `index.html` to block loading arbitrary remote scripts into the dashboard.
