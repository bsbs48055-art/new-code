# API Setup Guide

All **secret** API keys live in `server/.env`. The Chrome extension never ships provider secrets.

Copy the template:

```bash
cp server/.env.example server/.env
```

## OpenAI

1. Create an account at [platform.openai.com](https://platform.openai.com/)
2. Create an API key
3. Set:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

Used by: AI Assistant, topic clustering (when available), audience analysis.

## YouTube Data API

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project
3. Enable **YouTube Data API v3**
4. Create an API key (Application restriction optional; restrict by IP for production servers)
5. Set:

```env
YOUTUBE_API_KEY=...
```

Used by: Search (YouTube), Trending (YouTube).

## News API

1. Register at [newsapi.org](https://newsapi.org/)
2. Copy your API key
3. Set:

```env
NEWS_API_KEY=...
```

Note: Free developer plans may restrict production browser usage; this project calls News API from the **server**, which is the correct pattern.

## Reddit API

1. Visit [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. Create an app → type **script** (or web app)
3. Note client ID and secret
4. Set:

```env
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USER_AGENT=ContentHunterAIPro/1.0 by YourRedditUsername
```

Used by: Search (Reddit), Trending (Reddit). Authentication uses official OAuth client-credentials.

## Google Trends

No API key required. The server uses the `google-trends-api` package to query publicly available Trends endpoints. Respect rate limits; the backend caches via the extension’s IndexedDB for repeated identical queries.

## RSS feeds

Add publisher-permitted feed URLs:

```env
RSS_FEEDS=https://feeds.bbci.co.uk/news/technology/rss.xml,https://www.reddit.com/r/technology/.rss
```

Only allowlisted feeds are fetched. Do not point this at sites that prohibit automated access outside published feeds.

## Firebase (optional — extension auth)

Firebase credentials used in the extension are the **public web config**, stored via Chrome Storage from Settings:

- API Key
- Auth Domain
- Project ID
- App ID

In Firebase Console:

1. Create a project
2. Add a Web app
3. Enable **Email/Password** and/or **Google** sign-in
4. Paste the web config into **Settings → Firebase Authentication**

Do **not** put Firebase Admin secrets in the extension.

## Verify configuration

```bash
npm run server
curl http://localhost:8787/api/health
```

The health payload lists any missing optional keys under `missingKeys`.

## Security checklist

- Never commit `server/.env`
- Restrict production API keys by IP / referrer where supported
- Put the Express API behind HTTPS
- Use rate limiting (enabled by default)
- Rotate keys if exposed
