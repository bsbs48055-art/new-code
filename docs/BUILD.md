# Build Guide

## Development (watch mode)

Rebuilds the extension on file changes:

```bash
npm run dev
```

Reload the unpacked extension in Chrome after each rebuild when testing Manifest / background changes. UI-only changes usually only need a side panel refresh.

## Production build

```bash
npm run typecheck
npm run build
```

Output: `dist/` containing:

- `manifest.json`
- `popup.html` / `sidepanel.html`
- `background/index.js`
- hashed asset bundles
- icons

## Package ZIP for distribution

```bash
npm run package
```

Creates `release/content-hunter-ai-pro.zip` suitable for Chrome Web Store upload or private distribution.

## Scripts reference

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite watch build (development) |
| `npm run build` | Typecheck + production Vite build |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run clean` | Remove `dist/` |
| `npm run package` | Clean, build, zip |
| `npm run icons` | Regenerate PNG icons |
| `npm run server` | Start Express API |
| `npm run server:dev` | Start API with `--watch` |
| `npm run server:install` | Install server dependencies |

## Backend build notes

The server is plain Node ESM (no compile step). Deploy `server/` with its `package.json` and `.env`.

## Quality checks before release

```bash
npm run typecheck
npm run lint
npm run build
npm run server:install
# start server and hit /api/health
```
