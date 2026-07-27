# Installation Guide

## Prerequisites

- Google Chrome 116+
- Node.js 18+
- npm 9+
- API keys for the sources you want to use (see [API_SETUP.md](./API_SETUP.md))

## 1. Install dependencies

```bash
cd /path/to/content-hunter-ai-pro
npm install
npm run server:install
```

## 2. Configure the backend

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and add at least the keys for features you need:

- `OPENAI_API_KEY` — AI Assistant
- `YOUTUBE_API_KEY` — YouTube search & trending
- `NEWS_API_KEY` — News search & headlines
- `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` — Reddit search & hot posts
- `RSS_FEEDS` — optional comma-separated public feed URLs

## 3. Start the API server

```bash
npm run server
```

The API listens on `http://localhost:8787` by default. Confirm with:

```bash
curl http://localhost:8787/api/health
```

## 4. Build the extension

```bash
npm run icons   # generate brand icons if needed
npm run build
```

This produces a loadable package in `dist/`.

## 5. Load in Chrome

1. Navigate to `chrome://extensions`
2. Toggle **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist` directory

## 6. First-run settings

1. Click the extension icon to open the popup
2. Open **Dashboard** (side panel)
3. Go to **Settings**
4. Confirm **API Base URL** is `http://localhost:8787` (or your deployed URL)
5. Click **Test Backend**
6. Optionally add Firebase web config for authentication

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Backend unreachable | Ensure `npm run server` is running; check CORS / firewall |
| Empty search results | Verify corresponding API keys in `server/.env` |
| AI fails | Set `OPENAI_API_KEY` and restart the server |
| Firebase login fails | Add Firebase web config in Settings; enable Email/Google providers in Firebase Console |
| Side panel blank | Rebuild (`npm run build`) and click **Reload** on `chrome://extensions` |

## Uninstall

Remove the extension from `chrome://extensions`. Local IndexedDB data is cleared when the extension is removed.
