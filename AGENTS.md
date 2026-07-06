# AGENTS.md

## Cursor Cloud specific instructions

This repo is **Social Media Studio Pro**: a Chrome Manifest V3 extension (TypeScript + React 18 + Vite 6, IndexedDB via Dexie) plus an **optional** local Node/Express OAuth helper server in `server/`. There is no application backend, database, or cache — all persistence is in-browser. Standard scripts live in root `package.json` and `server/package.json`; see `README.md` and `docs/` for details.

The update script already runs `npm install` (root) and `npm --prefix server install`, so dependencies are ready. Notes below are the non-obvious caveats.

### Building / loading the extension (important gotcha)
- The extension loads from the `dist/` folder, which is git-ignored and NOT committed — you must build it before loading in Chrome.
- `npm run dev` (`vite build --watch`) uses `emptyOutDir`, which **wipes `dist/` on every rebuild and does NOT bundle the content script**. The manifest references `content-scripts/accountDetector.js`, so after `npm run dev` (or any Vite rebuild) you must also run `npm run build:content-script` to regenerate that file, or Chrome will complain about a missing content script.
- For a complete, loadable build in one shot, prefer `npm run build` (runs typecheck + vite build + content-script bundle). Use `npm run dev` only for iterative Vite work, re-running `npm run build:content-script` as needed.

### Loading in Chrome (cloud VM)
- Chrome's GTK "Load unpacked" file-picker can be unreliable via automated clicks. The robust path is to launch Chrome with the extension preloaded:
  `google-chrome --user-data-dir=/tmp/chrome-test-profile --load-extension=/workspace/dist`
- The unpacked extension ID is deterministic from the absolute path. For `/workspace/dist` it is `gndjidfncanlhlonpcabokbdhnikglpn`. Open the full dashboard at `chrome-extension://gndjidfncanlhlonpcabokbdhnikglpn/sidepanel.html` (also available as popup.html / options.html surfaces).
- Most features (dashboard, profiles, SEO tools, upload queue, local storage) work fully offline. Actual publishing/analytics needs your own Google/Facebook/TikTok OAuth apps (see `docs/API_SETUP.md`); none are bundled.

### Helper server (`server/`) — optional
- Runs with `npm run server` (needs no `.env`; `PORT` defaults to 8787). Health check: `curl http://localhost:8787/health`.
- Only needed for TikTok publishing and long-lived Facebook tokens (secrets go in `server/.env`, copied from `server/.env.example`). Skip it for YouTube-only or short-lived Facebook testing.

### Lint / typecheck / test
- `npm run lint` and `npm run typecheck` both pass clean. There is **no automated test suite / `test` script** in this repo.
