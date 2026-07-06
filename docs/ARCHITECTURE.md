# Architecture

## High-level overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Chrome Extension                         │
│                                                                   │
│  ┌───────────┐   ┌───────────┐   ┌───────────┐                  │
│  │  Popup    │   │Side Panel │   │  Options  │   UI surfaces     │
│  │(quick view)│  │(dashboard)│   │(settings) │   (React, shared  │
│  └─────┬─────┘   └─────┬─────┘   └─────┬─────┘    components)   │
│        │  chrome.runtime.sendMessage    │                        │
│        └───────────────┼────────────────┘                        │
│                         ▼                                        │
│              ┌─────────────────────┐                             │
│              │ Background Service  │  MV3 service worker         │
│              │ Worker              │  (ephemeral — can restart)  │
│              │  - Upload Queue     │                             │
│              │  - Scheduler        │                             │
│              │  - Platform Adapters│                             │
│              │  - Notifications    │                             │
│              └──────────┬──────────┘                             │
│                         │                                        │
│         ┌───────────────┼───────────────┐                        │
│         ▼               ▼               ▼                        │
│  ┌───────────┐   ┌───────────┐   ┌───────────┐                  │
│  │ YouTube   │   │ Facebook  │   │  TikTok   │  Platform adapters│
│  │  adapter  │   │  adapter  │   │  adapter  │  (official APIs)  │
│  └─────┬─────┘   └─────┬─────┘   └─────┬─────┘                  │
└────────┼───────────────┼───────────────┼─────────────────────────┘
         ▼               ▼               ▼
  YouTube Data/       Facebook          TikTok Content
  Analytics API       Graph API         Posting API
```

All persistent state — upload tasks, publishing profiles, templates, activity logs, analytics snapshots, staged file blobs — lives in **IndexedDB** (via Dexie), which is shared across every extension context (background, popup, side panel, options) for the same extension origin. Lightweight, frequently-read preferences (theme, notification toggles, encrypted OAuth tokens) live in `chrome.storage.local`.

## Why a service worker owns the queue

Manifest V3 background scripts are service workers: Chrome can suspend and restart them at any time (e.g. after ~30s of inactivity). Because of this, `src/background/uploadEngine/UploadQueue.ts` treats **IndexedDB as the source of truth**, not in-memory state:

- Every task's status/progress/byte-offset is written to `uploadTasks` after each meaningful step.
- Resumable upload sessions (YouTube, Facebook, TikTok) persist their session URL/ID on the task record (`resumableSessionUrl`), so a paused or interrupted upload can resume from the last confirmed byte offset even if the worker restarted in between.
- `chrome.alarms` (`ALARM_QUEUE_TICK`, once per minute) acts as a safety-net poll on top of event-driven ticks (triggered immediately after enqueue/resume/service-worker-start), so the queue keeps moving even if the worker was asleep when something became due.

## Platform adapter pattern

`src/background/platforms/PlatformAdapter.ts` defines a single interface (`connect`, `disconnect`, `getAuthState`, `upload`, `fetchAnalytics`) that `youtube/`, `facebook/`, and `tiktok/` each implement. `src/background/uploadEngine/UploadQueue.ts` and the message handlers in `src/background/index.ts` are written entirely against this interface via `getPlatformAdapter(platform)` — adding a fourth platform means adding one new adapter module and one registry entry, with zero changes to queue/scheduling/UI logic.

Each adapter's `upload()` method:

1. Obtains a valid access token (refreshing if needed).
2. Initiates or resumes a chunked/resumable upload session using that platform's official protocol.
3. Reports progress via a callback (`{ bytesUploaded, totalBytes }`), which the queue engine turns into a percentage + ETA.
4. Respects an `AbortSignal` for pause/cancel — an `AbortError` is distinguished from a real failure so paused tasks re-queue instead of failing permanently.
5. Throws `NonRetryableUploadError` for errors that should never be retried (bad credentials, permanently invalid request) versus a plain `Error` for transient failures, which the queue retries with exponential backoff up to `maxAttempts`.

## Security model

- **No passwords are ever requested or stored.** All authentication is OAuth via `chrome.identity` (Google's native token flow for YouTube; `launchWebAuthFlow` + PKCE for Facebook/TikTok).
- **OAuth access/refresh tokens are encrypted at rest** with AES-GCM (`src/shared/security/crypto.ts`) before being written to `chrome.storage.local`; the symmetric key itself is generated per-install and stored locally (see the caveats documented in that file — this defends against casual inspection, not a fully compromised device).
- **Confidential client secrets never ship in the extension bundle.** TikTok's token exchange and Facebook's long-lived token exchange are delegated to the optional local helper server (`server/`), which keeps secrets in a git-ignored `.env` file.
- **No telemetry, no analytics collection about you.** The only network calls this extension makes are: (a) directly to the official platform APIs you've connected, (b) to your own configured AI provider endpoint if you've set one up, and (c) to your own local helper server if you're running one.
- **The content script is read-only and informational only** (`src/content-scripts/accountDetector.ts`) — it reads a visible display name from the DOM to show "you're browsing as X" in the dashboard, and never reads cookies, session tokens, or automates page interactions.

## Data flow: staging → queue → publish

1. **Upload page** (`src/ui/pages/Upload.tsx`) + `useStagedUploads` hook: dropped files/folders are classified, their binary content is written to the `blobs` IndexedDB table (`src/shared/db/blobStore.ts`), and a lightweight `MediaFileRef` (name/size/mimeType/`blobKey`) plus probed technical metadata (`src/shared/utils/mediaProbe.ts`) is kept in React state for editing.
2. On **"Add to queue"**, the UI sends an `ENQUEUE_TASKS` message (`src/shared/messaging.ts`) to the background worker with one `EnqueueTaskInput` per (file × destination platform).
3. `src/background/uploadEngine/taskFactory.ts` applies publishing-profile defaults, performs duplicate detection (fingerprint = filename + size), and writes fully-formed `UploadTask` records to IndexedDB.
4. `UploadQueue.tick()` picks up `queued` tasks (respecting `uploadConcurrency` and `priority`) and calls the matching platform adapter's `upload()`.
5. Progress/status changes are written to IndexedDB and also broadcast (`QUEUE_UPDATED`) so any open UI can react instantly — but the UI's live queries (via `dexie-react-hooks`' `useLiveQuery`) already update reactively from the IndexedDB writes themselves, since Dexie's multi-tab support propagates changes across all extension contexts sharing the same origin.
6. On completion/failure, an activity log entry and a `chrome.notifications` desktop notification are created (subject to the user's notification preferences), and — if the task has a recurrence rule — `SchedulerService.spawnNextOccurrenceIfNeeded` enqueues the next scheduled occurrence.

## Folder import mapping

`src/shared/utils/fileUtils.ts#mapFolderImport` classifies every file in a dropped/selected folder by extension and filename convention:

| File | Role |
| --- | --- |
| `*.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`, `.m4v` | Video |
| `*.jpg/.jpeg/.png/.gif/.webp` (without a thumbnail-hint name) | Image |
| Same image extensions, but named like `thumb*`, `thumbnail*`, `cover*`, `poster*` | Thumbnail candidate |
| `*.srt`, `.vtt` | Subtitle |
| `description.txt` | Shared description text, applied to all staged items from that folder |
| `tags.txt` | Shared tags (comma or newline separated) |
| `schedule.csv` | Per-file scheduling/title overrides (`fileName,publishAt,platform,title` columns) |
| `metadata.json` | Arbitrary structured metadata, parsed and attached to the import result |
| anything else | Left in `unmatched`, ignored by the staging UI |

If exactly one thumbnail candidate is found, it's applied to every staged item (`strategy: 'custom'`). If multiple are found, one is picked at random per item (`strategy: 'random-from-folder'`), per the "random thumbnail from folder" requirement.
