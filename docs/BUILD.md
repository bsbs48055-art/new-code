# Build Guide

## Build system overview

The extension is built with **Vite 6**, targeting multiple independent HTML entry points (`popup.html`, `sidepanel.html`, `options.html`) plus the background service worker (`src/background/index.ts`), all sharing the same React/TypeScript codebase under `src/`.

Manifest V3 content scripts cannot be ES modules, so the content script (`src/content-scripts/accountDetector.ts`) is bundled separately as a classic IIFE using **esbuild**, via `scripts/build-content-script.mjs`, which runs as a second step after the main Vite build.

`public/manifest.json`, `public/icons/`, and `public/_locales/` are copied verbatim into `dist/` by Vite's built-in `publicDir` handling.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run build` | Type-checks, builds all HTML pages + background worker with Vite, then bundles the content script with esbuild. Output: `dist/`. |
| `npm run dev` | Same as build, but in watch mode (development, unminified, with sourcemaps). You still need to manually reload the extension in `chrome://extensions` after each rebuild. |
| `npm run typecheck` | Runs `tsc --noEmit` across the whole project. |
| `npm run lint` / `npm run lint:fix` | ESLint (TypeScript + React Hooks rules). |
| `npm run format` | Prettier, formats `src/**/*.{ts,tsx,css}`. |
| `npm run clean` | Removes `dist/`. |
| `npm run package` | Clean build, then zips `dist/` into `dist-zip/social-media-studio-pro.zip` (Chrome Web Store-ready). Requires the system `zip` utility. |
| `npm run server` | Starts the optional local helper server (see API_SETUP.md). |
| `npm run server:install` | Installs the helper server's own dependencies (`server/package.json` is a separate, independent Node project). |

## Path aliases

`tsconfig.json` and `vite.config.ts` both define these aliases so imports stay readable regardless of nesting depth:

- `@/*` → `src/*`
- `@shared/*` → `src/shared/*`
- `@ui/*` → `src/ui/*`
- `@background/*` → `src/background/*`

The content script build (esbuild) intentionally avoids these aliases and uses relative imports instead, since it's a standalone bundle built outside of Vite's resolver configuration.

## Verifying a production build

```bash
npm run build
```

should complete with zero TypeScript errors and produce a `dist/` folder with:

```
dist/
├── manifest.json
├── icons/{16,32,48,128}.png
├── _locales/en/messages.json
├── popup.html, sidepanel.html, options.html
├── assets/*.js, *.css      # shared React/vendor chunks
├── background/index.js     # service worker (ES module)
└── content-scripts/accountDetector.js   # classic IIFE script
```

Load `dist/` as an unpacked extension (see INSTALLATION.md) to smoke-test it. The project has also been verified to load and run cleanly end-to-end (background service worker start, all three UI surfaces rendering without console errors, full upload-staging→enqueue→queue-processing flow) using Chrome for Testing + Puppeteer's `enableExtensions` API in CI-style headless automation.

## Packaging for the Chrome Web Store

```bash
npm run package
```

This produces `dist-zip/social-media-studio-pro.zip`, ready to upload to the Chrome Web Store Developer Dashboard. Before publishing:

1. Replace the placeholder `oauth2.client_id` in `public/manifest.json` with your real Google OAuth Client ID (see API_SETUP.md) — this must match the **published** extension's ID, which differs from your local unpacked ID, so you'll typically do a first upload to reserve the Web Store item ID, then update the OAuth client's authorized ID and rebuild.
2. Review `manifest.json`'s `host_permissions` and `permissions` — the Chrome Web Store review process scrutinizes broad permissions, so keep only what you need for the platforms you actually support.
3. Fill in real Web Store listing assets (screenshots, promotional images) — the generated `docs/assets/logo.png` can be a starting point for a promotional tile.
