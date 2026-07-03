**Phase 4 — Implementation Plan (divided into 5 parts)**

Overview
- Goal: Improve offline/mobile support, UX performance, PWA capabilities, and synchronization for field reps.

Parts

Part 1 — PWA & Offline Support
- What: Convert app to a Progressive Web App (service worker, manifest) and enable offline caching of static assets and API responses needed for order capture.
- Files/areas: `public/manifest.json`, service worker (`public/sw.js` or Workbox integration), client caching logic in `app/*`.
- Acceptance: App can load and capture orders while offline; queued orders sync when back online.
- Estimate: 6–12 hours.

Part 2 — Local Storage Sync & Conflict Resolution
- What: Implement localDB (IndexedDB via Dexie) for storing drafts and unsent orders, with sync logic and conflict resolution strategy.
- Files/areas: `lib/localSync.ts`, client-side pages for sync status.
- Acceptance: Offline orders persist and sync without data loss; conflicts surfaced to user.
- Estimate: 6–12 hours.

Part 3 — Mobile UI Improvements
- What: Improve touch targets, responsive layout, reduced bundle sizes, and optimize for low-bandwidth. Add an install prompt for PWA.
- Files/areas: `app/*` components and styles, possible code-splitting.
- Acceptance: Good usability on small screens and faster load times.
- Estimate: 4–8 hours.

Part 4 — Background Sync & Retry Logic
- What: Implement background sync for queued orders and robust retry/backoff for failed network calls.
- Files/areas: service worker sync, `lib/syncWorker.ts`, client monitoring.
- Acceptance: Lost connectivity handled gracefully and operations retried reliably.
- Estimate: 4–8 hours.

Part 5 — Device & Data Export/Import
- What: Allow reps to export/import data for audits or offline transfers (CSV/JSON), and add device registration to track offline devices.
- Files/areas: `app/reps/export/*`, `app/api/reps/export/route.ts`.
- Acceptance: Exported datasets are correct and import restores state safely.
- Estimate: 3–6 hours.
