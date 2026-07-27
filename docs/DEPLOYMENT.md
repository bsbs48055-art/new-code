# Deployment Guide

## Backend deployment

Deploy the `server/` folder as a Node.js service (Railway, Render, Fly.io, Google Cloud Run, AWS ECS, a VPS, etc.).

### Steps

1. Upload / clone the repository
2. `cd server && npm install --omit=dev`
3. Set environment variables from `.env.example`
4. Start: `npm start` (or use a process manager)
5. Put TLS termination in front of the service
6. Note the public HTTPS URL, e.g. `https://api.yourdomain.com`

### Recommended production env

```env
NODE_ENV=production
PORT=8787
CORS_ORIGIN=chrome-extension://YOUR_EXTENSION_ID
OPENAI_API_KEY=...
YOUTUBE_API_KEY=...
NEWS_API_KEY=...
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USER_AGENT=ContentHunterAIPro/1.0
RSS_FEEDS=...
```

Update the extension **Settings → API Base URL** to your production URL (or ship a build-time default).

### Health checks

Configure your host to probe `GET /api/health`.

## Extension packaging

```bash
npm run package
```

Upload `release/content-hunter-ai-pro.zip` to the Chrome Web Store Developer Dashboard.

### Chrome Web Store checklist

- Privacy policy URL (describe local IndexedDB, Firebase auth, and which APIs you call)
- Single purpose description: AI-assisted content research via official APIs
- Screenshots of Dashboard, Search, Keyword Explorer, AI Assistant
- Confirm host permissions match your backend domain
- Do not request broad scraping permissions

### Host permissions

For production, tighten `public/manifest.json` `host_permissions` from `https://*/*` to your API origin only, e.g.:

```json
"host_permissions": [
  "https://api.yourdomain.com/*"
]
```

Then rebuild.

## Updates

1. Bump `version` in `public/manifest.json` and root `package.json`
2. `npm run package`
3. Upload a new store version
4. Redeploy backend if API routes changed

## Monitoring

- Log Express errors (morgan + process logs)
- Track OpenAI / YouTube quota usage in provider dashboards
- Alert on `/api/health` failures
