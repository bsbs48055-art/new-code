# API Setup Guide

Social Media Studio Pro ships with **zero bundled API credentials**. Every user (or team) registers their own developer applications with Google, Facebook, and TikTok, and connects their own accounts through each platform's official OAuth login. This section walks through each platform.

---

## YouTube (Google Cloud / YouTube Data & Analytics APIs)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project (or reuse one).
2. **APIs & Services → Library**: enable **YouTube Data API v3** and **YouTube Analytics API**.
3. **APIs & Services → OAuth consent screen**: configure it (External or Internal), add scopes:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/yt-analytics.readonly`
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Chrome Extension**.
   - Item ID: your extension's ID (visible at `chrome://extensions` once loaded unpacked — it stays stable across rebuilds as long as you don't move the `dist/` folder, or you can pin it with a `key` in `manifest.json` generated from a `.pem` — see Chrome's ["Keep consistent extension IDs"](https://developer.chrome.com/docs/extensions/reference/manifest/key) doc if you need reproducible IDs across machines).
5. Copy the generated **Client ID** into `public/manifest.json`:

   ```json
   "oauth2": {
     "client_id": "XXXXXXXXXX.apps.googleusercontent.com",
     "scopes": [ /* already filled in */ ]
   }
   ```

6. Rebuild (`npm run build`) and reload the extension. Click **Connect** next to YouTube in Settings.

No local helper server is needed for YouTube — `chrome.identity.getAuthToken` handles the entire OAuth flow using Chrome's built-in account chooser.

---

## Facebook (Graph API, Page publishing)

1. Go to [Facebook for Developers](https://developers.facebook.com/apps/) and create a new app (type: "Business" or "Consumer", whichever the console offers for Login + Pages APIs).
2. Add the **Facebook Login** product. Under its settings, add your extension's redirect URI as a valid OAuth redirect URI:
   - Get this value from Chrome by evaluating `chrome.identity.getRedirectURL()` in your extension's background console, or construct it as `https://<extension-id>.chromiumapp.org/`.
3. Request the following permissions (Business Verification / App Review is required for anyone other than the app's own admins/testers to use them in Live mode):
   - `pages_show_list`
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `publish_video`
4. Copy your **App ID** into **Settings → Platform Apps → Facebook App ID** inside the extension.
5. (Optional but recommended) To get 60-day Page tokens instead of ~1-2 hour ones, set up the local helper server (see below) with your **App Secret** — the extension will automatically use it during the connect flow if reachable.
6. Click **Connect** next to Facebook in Settings. You'll be asked to authorize the app and pick which Page(s) you manage; the extension publishes to the first Page returned unless you set a specific **Facebook Page ID** in Settings.

**Note:** while your app is in Facebook's "Development" mode, only app admins/developers/testers can connect and publish. Moving to "Live" mode for public use requires Facebook's App Review process for the permissions above.

---

## TikTok (Content Posting API)

1. Go to the [TikTok Developer Portal](https://developers.tiktok.com/) and create an app.
2. Add the **Login Kit** and **Content Posting API** products.
3. Add your extension's redirect URI (`https://<extension-id>.chromiumapp.org/`) to the app's allowed redirect URIs.
4. Request scopes: `user.info.basic`, `video.upload`, `video.publish`.
5. Copy the **Client Key** into **Settings → Platform Apps → TikTok Client Key** inside the extension.
6. TikTok's token exchange endpoint requires the app's confidential **Client Secret** — this cannot safely live inside a browser extension, so it belongs in the **local helper server** (see below). Copy the **Client Secret** into `server/.env`.
7. Start the helper server (`npm run server`) and make sure **Settings → Platform Apps → Local helper server URL** points at it (defaults to `http://localhost:8787`).
8. Click **Connect** next to TikTok in Settings.

**Important limitation:** TikTok's Content Posting API only allows unaudited apps to publish to the developer's own sandboxed TikTok account (or accounts explicitly added as testers). Publishing on behalf of arbitrary public users requires TikTok's app audit/review process. This extension implements the full, correct API integration either way — the limitation is on TikTok's platform policy, not the code.

---

## The optional local helper server

`server/` is a small, independent Node/Express project (see `server/package.json`) with exactly two responsibilities:

1. **TikTok OAuth token exchange/refresh** (`POST /oauth/tiktok/token`, `POST /oauth/tiktok/refresh`) — required, since TikTok's token endpoint mandates a client secret.
2. **Facebook long-lived token exchange** (`POST /oauth/facebook/exchange`) — optional; without it, Facebook connections still work but expire in ~1-2 hours instead of ~60 days.

### Setup

```bash
npm run server:install
cp server/.env.example server/.env
```

Edit `server/.env`:

```ini
PORT=8787
FACEBOOK_APP_SECRET=your-facebook-app-secret
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
ALLOWED_ORIGINS=chrome-extension://<your-extension-id>
```

Then:

```bash
npm run server
```

You should see:

```
Social Media Studio Pro helper server listening on http://localhost:8787
```

Verify it's healthy: `curl http://localhost:8787/health`.

### Why a separate server at all?

Chrome extensions are fully client-side, distributed as a static bundle that anyone can unzip and inspect. Any secret embedded in that bundle (a client secret, a private API key) is effectively public. Both TikTok's and Facebook's OAuth token endpoints require such a secret for the *token exchange* step — so that single network call is delegated to a server you run and control, where the secret lives in a git-ignored `.env` file instead of the extension bundle. Every other part of the OAuth flow (the authorization redirect, PKCE challenge, and all subsequent API calls using the resulting access token) happens directly from the extension, with no server in the loop.

If you don't need TikTok and are fine with short-lived Facebook connections, you can skip running this server entirely.

---

## AI Tools (optional)

The AI-assisted generators (title/description/tag/hashtag/hook/caption/analysis) work with **any OpenAI-compatible chat-completions endpoint** — OpenAI itself, Azure OpenAI, or a self-hosted gateway. Add your endpoint, model name, and API key in **Settings → AI Tools**. The key is encrypted at rest and only ever sent directly from your browser to the endpoint you configured — it never passes through this project's helper server or any third party.
