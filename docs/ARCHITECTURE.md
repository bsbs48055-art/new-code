# Architecture

## Overview

Content Hunter AI Pro follows a clean, layered architecture:

```
Chrome Extension (MV3)
  ├── Popup UI          → quick search / navigation
  ├── Side Panel UI     → full dashboard (React 19)
  ├── Background SW     → alarms, notifications, side panel behavior
  ├── Chrome Storage    → settings + Firebase web config
  └── IndexedDB (Dexie) → ideas, history, exports, response cache

Express API (Node)
  ├── Routes            → validation (Zod), orchestration
  ├── Services          → YouTube, Reddit, News, Trends, RSS, OpenAI
  └── Config            → env-based secrets (never shipped to Chrome)
```

## Design principles

- **SOLID** — services are single-purpose; UI depends on abstractions (`api/*`, `services/*`)
- **Type-safe** — shared TypeScript domain types in `src/types`
- **Secure by default** — secrets only on the server; client holds public Firebase web config
- **Compliant** — official APIs + allowlisted RSS only; no scraping bypasses
- **Local-first** — saved ideas/history work offline; network calls are cached

## Folder map

```
src/
  components/   UI primitives + layout + charts + search cards
  pages/        Route-level screens
  popup/        Popup entry
  dashboard/    Dashboard shell / router
  sidepanel/    Side panel entry
  hooks/        Theme + bootstrap
  services/     IndexedDB, export, ideas, chrome storage
  api/          HTTP client + research/AI facades
  store/        Zustand stores
  utils/        Constants + helpers
  types/        Domain types
  styles/       Tailwind + glass theme
  background/   Service worker
  content/      Reserved (unused in manifest)
  firebase/     Auth helpers
server/
  src/config|middleware|routes|services
```

## Data flow

1. UI collects filters → `api/research` or `api/ai`
2. `api/client` checks IndexedDB cache (GET) → else `fetch` backend
3. Express validates input → calls provider service(s) → returns normalized DTOs
4. UI renders charts/cards; optional auto-save to IndexedDB
5. Export services generate CSV/Excel/JSON/TXT/PDF client-side

## Caching & offline

- Response cache keyed by query string with TTL from Settings
- Background alarms broadcast maintenance messages for cache pruning
- Ideas / folders / collections / history always available offline

## Theming

CSS variables drive light/dark glassmorphism. `useTheme` syncs `.dark` on `documentElement` with Settings (`light` | `dark` | `system`).
