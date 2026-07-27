# Content Hunter AI Pro

Premium AI-powered content research Chrome Extension for creators.

Discover trending topics, keywords, hashtags, viral patterns, audience insights, and content opportunities using **official APIs** and **publicly available feeds** — never by scraping sites that prohibit it or bypassing platform protections.

## Features

- **Search engine** — keyword, category, country, language, date range, platform, sort by engagement / growth / popularity / newest
- **Sources** — YouTube Data API, Google Trends, Reddit API, News API, RSS feeds
- **Explorers** — Keyword Explorer, Hashtag Explorer, Topic Clusters, Trending
- **AI Assistant** — 22 generators (titles, hooks, calendars, outlines, captions, SEO scores, and more) via OpenAI
- **Analytics** — search volume, trend curves, growth, competition, interest by country/time, seasonality, related queries/topics
- **Save system** — favorites, collections, folders, tags, notes (IndexedDB)
- **Exports** — CSV, Excel, JSON, TXT, PDF
- **Settings** — theme, language, default country/platform, auto-save, notifications, Firebase login
- **Performance** — Vite build, lazy UI patterns, IndexedDB caching, background alarms, offline-friendly local data

## Tech stack

Manifest V3 · React 19 · TypeScript · Vite · Tailwind CSS · Shadcn-style UI · Framer Motion · Zustand · Dexie · Recharts · Firebase Auth · Node.js / Express backend

## Quick start

```bash
# Extension
npm install
npm run icons
npm run build

# Backend (required for live research + AI)
cp server/.env.example server/.env
# Edit server/.env with your API keys
npm run server:install
npm run server
```

Load the extension in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select the `dist/` folder

Open the popup, then use **Dashboard** to launch the side panel research suite.

## Documentation

| Guide | Description |
| --- | --- |
| [docs/INSTALLATION.md](docs/INSTALLATION.md) | Install & load the unpacked extension |
| [docs/BUILD.md](docs/BUILD.md) | Build, watch, and package |
| [docs/API_SETUP.md](docs/API_SETUP.md) | Obtain & configure all API keys |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploy the backend & publish the extension |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Clean architecture overview |

## Compliance

Content Hunter AI Pro:

- Uses official documented APIs and publisher-permitted RSS feeds only
- Does **not** scrape websites that prohibit scraping
- Does **not** bypass CAPTCHAs, rate limits, or platform protections
- Does **not** automate reposting of copyrighted content
- Keeps secret API keys on the Express server (`server/.env`), not inside the Chrome package

You are responsible for complying with each provider’s Terms of Service and applicable law.

## License

MIT — see [LICENSE](LICENSE).
