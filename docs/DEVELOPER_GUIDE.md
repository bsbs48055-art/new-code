# Developer Guide

This guide covers common extension points. Read [ARCHITECTURE.md](ARCHITECTURE.md) first for the big picture.

## Adding a new dashboard page

1. Create `src/ui/pages/YourPage.tsx` (see any existing page for the general shape — a `.card` per section, `useLiveQuery`/hooks for data, `useToastStore` for feedback).
2. Register the route in `src/ui/App.tsx`:
   ```tsx
   <Route path="/your-page" element={<YourPage />} />
   ```
3. Add a sidebar entry in `src/ui/components/Sidebar.tsx`'s `NAV_ITEMS` array (pick an icon from `lucide-react`).

## Adding a new platform adapter

1. Create `src/background/platforms/yourplatform/` with:
   - `types.ts` — request/response shapes for that platform's API.
   - `yourplatformAuth.ts` — `connectYourPlatform()`, `disconnectYourPlatform()`, and a `getValidYourPlatformToken()` helper (see `youtube/youtubeAuth.ts` for the `chrome.identity.getAuthToken` pattern, or `tiktok/tiktokAuth.ts` for the `launchWebAuthFlow` + PKCE pattern).
   - `yourplatformUploader.ts` — the actual chunked/resumable upload call(s), matching the `PlatformAdapter['upload']` signature.
   - `index.ts` — assembles the above into a `PlatformAdapter` object.
2. Register it in `src/background/platforms/registry.ts`.
3. Add the new `PlatformId` to `src/shared/types/index.ts` (`PlatformId`, `PLATFORM_LABELS`) — TypeScript will then flag every switch/map that needs updating (SEO limits, category maps, UI platform pickers, etc.).
4. If OAuth requires a confidential secret, add a route to `server/src/routes/` and document it in `docs/API_SETUP.md`.

## Adding a new AI generator

`src/shared/utils/aiClient.ts` exports a single `aiClient` object with one method per generator, all built on the shared `callChatCompletion(systemPrompt, userPrompt)` helper. To add a new one:

```ts
async generateSomethingNew(ctx: ContentContext): Promise<string[]> {
  const text = await callChatCompletion(
    'System prompt describing the assistant persona.',
    `User prompt referencing ctx.topic, ctx.platform, etc.`,
  );
  return splitNumberedList(text);
}
```

Then add a button for it in `src/ui/pages/AITools.tsx`'s `GENERATORS` array and a `case` in the `run()` switch.

## Working with the upload queue

- Never mutate `UploadTask` records directly from the UI — always go through `sendToBackground(MESSAGE_TYPES.X, payload)` (see `src/shared/messaging.ts`), so the background worker (the single source of truth for in-flight `AbortController`s) stays consistent.
- Reading queue/history data from the UI should go through `useLiveQuery` against `db.uploadTasks` directly (see `src/ui/pages/Queue.tsx`) — no separate Redux/Zustand mirror is needed since Dexie's live queries already react to writes from any extension context.
- If you add a new `UploadStatus`, update: `src/shared/types/index.ts`, the CSS badge classes in `src/ui/styles/globals.css` (`.badge-<status>`), and `StatusBadge`'s label map in `src/ui/components/Badge.tsx`.

## Code style & conventions

- Every exported function/class has a docblock explaining *why*, not just *what* — avoid comments that just restate the code.
- Prefer small, focused modules under `src/shared/` for anything used by both the background worker and the UI (types, constants, DB access, pure utility functions). The background worker and UI bundles are built separately by Vite, but both can import from `@shared/*` freely since it contains no DOM-only or service-worker-only code at the top level of shared modules (platform-specific code lives under `background/platforms/`, DOM-specific code under `ui/`).
- Run `npm run typecheck && npm run lint` before committing — both are configured to fail the build on real errors (warnings are advisory).

## Testing changes end-to-end

There's no automated test suite bundled (out of scope for the initial build), but the recommended manual loop is:

1. `npm run build`
2. Reload the extension in `chrome://extensions`.
3. Open the side panel and exercise the relevant page.
4. Check the background service worker's console (`chrome://extensions` → the extension's card → **service worker** link) for errors — this is where upload/queue/scheduler logs appear.

For CI or scripted verification, Chrome for Testing + Puppeteer's `enableExtensions` launch option can load the unpacked `dist/` folder and drive it headlessly (this is how the initial build of this project was smoke-tested): see the [Puppeteer Chrome Extensions guide](https://pptr.dev/guides/chrome-extensions). Note that the classic `--load-extension` CLI flag no longer works on branded Chrome (137+) and requires either Chrome for Testing/Chromium, or Puppeteer's newer `enableExtensions`/`installExtension` API.
