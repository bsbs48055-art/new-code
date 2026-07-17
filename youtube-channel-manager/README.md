# YouTube Channel Manager

A Windows desktop app for creators who manage **several YouTube channels**,
each signed in on its **own Chrome profile**. Link every channel to its
Chrome profile once, point it at a folder of videos, and click **Run
Upload** — the app drives a real Chrome window through YouTube's normal
upload flow for you, one channel (and one video) at a time.

> **How it works, in one paragraph:** Chrome stores every profile's login
> session (cookies, etc.) in a folder on your disk. This app detects those
> profile folders, clones the relevant bits into its own private, sandboxed
> copy (so it never touches or risks corrupting your real Chrome data), and
> then uses [Playwright](https://playwright.dev) to launch your real,
> installed Chrome against that sandboxed copy — already logged in — and
> clicks through the same "Create → Upload video" flow you'd use by hand.

## What you get

- **Auto-detects Chrome (and Edge/Brave) profiles** already on your PC —
  no re-entering passwords, no API keys, no Google Cloud console setup.
- **One "channel" per Chrome profile.** Add as many channels as you have
  profiles.
- **Attach a folder per channel.** Drop videos into it; optional sidecar
  files (`video.json`, `video.title.txt`, `video.tags.txt`, `channel.json`
  defaults, ...) control title/description/tags/playlist/privacy. See
  [`examples/`](examples/README.md).
- **Run Upload** walks the queue for that channel, uploading one video at a
  time with a pause in between (configurable), the same way a careful human
  would.
- Tracks what's already been uploaded so re-running a channel only
  processes new files, unless you explicitly ask it to re-upload.
- Live activity log per channel, and a **Test / Log in** button that opens
  a visible browser window so you can confirm (or complete) the login
  before running unattended.
- Packages into a normal **Windows installer (`.exe`)** via `electron-builder`
  — no command line needed for the person actually using it.

## Important things to know before you use this

- This automates the **real YouTube Studio web UI** in a real Chrome
  window — it is not using YouTube's official upload API, so there is no
  developer account or API quota to set up. The trade-off is that it
  depends on YouTube's current page layout; if YouTube redesigns the
  upload flow, the automation in
  [`src/main/uploader/youtubeUpload.js`](src/main/uploader/youtubeUpload.js)
  may need small selector updates (it already has several fallback
  strategies per step to reduce how often that happens).
- It never stores, asks for, or transmits your Google password — it only
  reuses a login session that already exists in a Chrome profile you
  picked, or lets you log in by hand inside a dedicated automation window.
- Only use this on **channels you own or are authorized to manage**, and
  only upload **content you have the rights to publish**. Respect
  [YouTube's Terms of Service](https://www.youtube.com/t/terms) and
  Community Guidelines — this tool automates clicking, it doesn't bypass
  any of YouTube's protections, checks, or policies.
- Google Chrome must be installed on the PC (the app drives your real
  Chrome install, it does not download its own copy of Chromium — this
  keeps the installer small and means the automated browser looks and
  behaves exactly like your normal Chrome).

## Getting the installer

You have two options:

### Option A — Download a pre-built installer (recommended)

If this repo's GitHub Actions workflow has run
(`.github/workflows/build-youtube-channel-manager.yml`), go to the repo's
**Actions** tab → latest **"Build YouTube Channel Manager (Windows)"** run →
download the `youtube-channel-manager-windows` artifact. Inside you'll find:

- `YouTube Channel Manager Setup <version>.exe` — a normal installer
  (Start Menu shortcut, uninstaller, etc.)
- `YouTube Channel Manager <version>.exe` — a portable build that runs
  without installing anything.

### Option B — Build it yourself on Windows

```bash
cd youtube-channel-manager
npm install
npm run dist
```

The installer and portable `.exe` will be written to `release/`. (Building
the Windows installer requires running this on Windows, or on CI as above —
`electron-builder`'s NSIS target isn't reliably producible from Linux/macOS
without Wine.)

To just try the app without packaging it:

```bash
npm install
npm start
```

## Using the app

1. **Open the app.** If you have no channels yet, click **"+ Add your
   first channel"**.
2. **Name the channel** (anything you like, e.g. "My Gaming Channel").
3. **Link a Chrome profile.** The dropdown lists every Chrome (and Edge/
   Brave) profile detected on this PC, including the Google account each
   one is signed in as (if visible). Pick the profile that's already
   logged in to this channel's YouTube account. If you'd rather log in
   fresh inside a profile the app manages itself, choose **"No linked
   profile"**.
4. **Choose a content folder** — the folder where this channel's videos
   live. See [`examples/README.md`](examples/README.md) for how to add
   custom titles/descriptions/tags/thumbnails per video.
5. Click **Save Channel**.
6. Click **Test / Log in** once to open a real browser window for that
   channel and confirm you land on YouTube Studio already signed in. If
   not, log in by hand in that window — the login is saved for next time.
7. Click **Run Upload**. The app will upload every pending video in the
   folder, in order, filling in title/description/tags/playlist/privacy
   from your metadata files (or sensible defaults), and mark each one as
   uploaded once done.
8. Repeat for your other channels — each has its own isolated browser
   profile, so you can safely add every channel you manage and run them
   independently (or at the same time; see **Settings → Channels running
   at the same time**).

### Settings

- **Headless** — hide the browser windows while running. Leave this off
  until you've watched a full run succeed at least once per channel.
- **Channels running at the same time** — how many channels can upload
  concurrently. Keep this low (1-2) on modest hardware; each running
  channel is a full Chrome window.
- **Pause between uploads** — a polite delay between videos within the
  same channel.
- **Custom Chrome executable path** — only needed if the app can't
  auto-detect your Chrome install.

## Project layout

```
youtube-channel-manager/
├── src/
│   ├── main/                     Electron main process (Node.js)
│   │   ├── index.js               App bootstrap / window creation
│   │   ├── ipcHandlers.js          IPC endpoints used by the UI
│   │   ├── store.js                Persisted settings/channels/upload history
│   │   ├── chromeProfiles.js       Detects installed Chrome/Edge/Brave profiles
│   │   ├── folderScanner.js        Scans a content folder for videos + metadata
│   │   └── uploader/
│   │       ├── profileSandbox.js   Clones a Chrome profile into a private sandbox
│   │       ├── youtubeUpload.js    Playwright script that drives the upload flow
│   │       └── automationRunner.js Per-channel run queue, concurrency, events
│   ├── preload/preload.js         contextBridge-exposed API for the renderer
│   └── renderer/                  Plain HTML/CSS/JS UI (no framework/bundler needed)
├── examples/                      Sample content-folder metadata files
└── .github/workflows/             CI job that builds the Windows installer
```

## Troubleshooting

- **"This Chrome profile is not logged in..."** — open that channel with
  **Test / Log in**, sign in to the Google account by hand in the window
  that opens, then run again (or use **Refresh** in the channel editor to
  re-sync the profile after logging in inside your real Chrome instead).
- **A step fails partway through an upload** — the activity log names the
  exact step (e.g. "Could not find the video title field"). YouTube likely
  changed that part of its UI; see
  [`youtubeUpload.js`](src/main/uploader/youtubeUpload.js) to update the
  relevant selector.
- **Nothing happens when you click Run** — make sure the content folder
  actually contains video files (`.mp4`, `.mov`, `.mkv`, `.avi`, `.webm`,
  `.m4v`, `.flv`, `.wmv`, `.mpg`, `.mpeg`) that haven't already been marked
  uploaded (tick "Re-upload videos already marked as uploaded" to force it).

## License

MIT.
