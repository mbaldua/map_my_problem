# Map My Problems — Claude Context

## What this is
Hyperlocal civic issue reporting PWA. Reddit-style but for real-world problems.
Users snap a photo, tag the category, location auto-detected → pin appears on shared neighbourhood map.

## Core design rule
**Zero friction to report.** Every UX decision is evaluated against this. Camera opens the moment the user taps Report.

## Issue categories (v1 only)
- Water Logging (`water_logging`)
- Uncleanliness (`uncleanliness`)
- Traffic (`traffic`)

## Report flow (photo-first)
Photo → Category tag → Location confirm → Optional note → Submit

## Tech stack
- Next.js 16 (App Router, Turbopack)
- Tailwind CSS
- Leaflet.js + CartoDB Positron tiles (NOT OSM default — too noisy)
- Supabase (PostgreSQL + PostGIS + Auth + Storage + Realtime)
- Zustand (global store, persisted)
- Lucide React icons

## Key files to know
- `src/app/map/page.tsx` — main screen, full-bleed map with floating overlay chrome
- `src/components/report/ReportFlow.tsx` — step orchestrator
- `src/store/appStore.ts` — global state (radius, category filter, user, report draft)
- `src/config/` — all feature flags, change here not in components
- `src/lib/supabase/database.types.ts` — typed DB schema
- `supabase/migrations/` — run these in Supabase SQL editor in order (001→004)
- `docs/open-decisions.md` — unresolved product questions, each maps to a config flag

## Database
Tables: `users`, `issues`, `comments`, `votes`
RPC functions: `get_issues_within_radius`, `get_local_upvote_count`, `get_area_pulse`
Storage bucket: `issue-images` (NOT `issue-photos`)

## Auth
Phone OTP via Supabase Auth. Anonymous viewing allowed, auth required to post.
Protected routes handled by `src/proxy.ts` (Next.js 16 renamed middleware → proxy).

## Leaflet gotchas
- All map components must use `next/dynamic` with `ssr: false`
- StrictMode double-init: always use `isInitializingRef` guard before `L.map()`
- leaflet.heat is a pre-ESM plugin — set `window.L = L` before loading it, load via script tag

## What's built but not yet wired
- Phone OTP auth UI exists (`src/app/auth/page.tsx`), not connected end-to-end
- Issue pins render on map but real Supabase data not flowing yet (useIssues returns [] until auth + PostGIS confirmed)
- Issue detail + comments (`src/components/issue/`) — components done, not linked from map pins
- Gallery carousel — built, not linked from nav
- Upvoting / ValidityBar — components and hook built, not wired to UI

## Commands
```bash
npm run dev     # dev server at localhost:3000
npm run build   # production build
npm run lint    # ESLint
```

## Env vars needed
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY (server-only, future use)
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_NOMINATIM_BASE_URL (optional, defaults to OSM Nominatim)
