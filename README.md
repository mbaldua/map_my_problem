# Map My Problems

Hyperlocal civic issue reporting — residents snap a photo of a problem near them (water logging, garbage, traffic) and it appears as a pin on a shared neighbourhood map.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Fill in your Supabase URL and keys (see Environment Variables below)

# 3. Run the dev server
npm run dev
```

App runs at **http://localhost:3000**

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Environment Variables

Copy `.env.local.example` → `.env.local` and fill in:

| Variable | Where to get it | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API → Project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API → Publishable key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API → Secret key | Server-only, future admin use |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local | Yes |
| `NEXT_PUBLIC_NOMINATIM_BASE_URL` | `https://nominatim.openstreetmap.org` (default) | No |

---

## Supabase Setup

Run the migration files in order in your Supabase **SQL Editor**:

```
supabase/migrations/001_initial_schema.sql   # Tables, triggers, PostGIS
supabase/migrations/002_rls_policies.sql     # Row Level Security
supabase/migrations/003_storage.sql          # issue-images storage bucket
supabase/migrations/004_geo_queries.sql      # PostGIS RPC functions
```

Then in Supabase dashboard:
- **Auth → Providers → Phone** — enable Phone OTP (Twilio or similar)

---

## Config Flags

All tuneable behaviour lives in `src/config/`. Change a single value to flip behaviour — no hunting through components.

### `src/config/report.ts`
| Flag | Default | What it controls |
|---|---|---|
| `REQUIRE_PHOTO` | `true` | Whether a photo is mandatory to submit |
| `MIN_PHOTOS` | `1` | Minimum photos when REQUIRE_PHOTO is true |
| `MAX_PHOTOS` | `5` | Maximum photos per report |
| `MAX_PHOTO_SIZE_BYTES` | `10485760` (10 MB) | Per-file size limit |
| `MAX_DESCRIPTION_LENGTH` | `200` | Character limit on the optional note |
| `STORAGE_BUCKET` | `issue-images` | Supabase Storage bucket name |

### `src/config/map.ts`
| Flag | Default | What it controls |
|---|---|---|
| `DEFAULT_CENTER` | Mumbai `{lat: 19.076, lng: 72.8777}` | Map center when geolocation is unavailable |
| `DEFAULT_ZOOM` | `14` | Starting zoom level (neighbourhood level) |
| `DEFAULT_RADIUS_KM` | `5` | Radius selected on first load |
| `RADIUS_OPTIONS` | `[1, 3, 5, 10]` | Available radius pills |
| `CLUSTER_DUPLICATE_ISSUES` | `false` | Merge overlapping pins into a count badge |
| `HEATMAP_DEFAULT_ON` | `false` | Whether heatmap is on by default |
| `HEATMAP_FADE_ZOOM` | `15` | Zoom level where heatmap fades out |
| `TILE_URL` | CartoDB Positron | Map tile provider URL |

### `src/config/feed.ts`
| Flag | Default | What it controls |
|---|---|---|
| `DEFAULT_FEED_SORT` | `proximity` | Default sort: `proximity`, `hot`, or `recent` |
| `HOT_SCORE_DECAY_HOURS` | `24` | How quickly upvotes decay for "hot" sort |

### `src/config/auth.ts`
| Flag | Default | What it controls |
|---|---|---|
| `ALLOW_ANONYMOUS_FIRST_POST` | `false` | Let users post once without signing in |

### `src/config/onboarding.ts`
| Flag | Default | What it controls |
|---|---|---|
| `SHOW_ONBOARDING` | `false` | Show 2-screen explainer on first launch |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── map/page.tsx        # Home — full-bleed map
│   ├── report/page.tsx     # Standalone report page
│   ├── issue/[id]/page.tsx # Issue detail
│   ├── gallery/page.tsx    # Horizontal swipe gallery
│   └── auth/page.tsx       # Phone OTP login
│
├── components/
│   ├── map/                # MapView, IssuePin, HeatmapLayer, AreaPulse
│   ├── report/             # ReportFlow (orchestrator) + 4 step components
│   ├── issue/              # IssueCard, IssueDetail, ValidityBar, ChatSection
│   ├── gallery/            # GalleryCarousel
│   └── ui/                 # FAB, RadiusPill, CategoryTag, StatusBadge
│
├── config/                 # All feature flags (see Config Flags above)
├── hooks/                  # useGeolocation, useIssues, useVote, useRadius
├── lib/
│   ├── supabase/           # client.ts, server.ts, storage.ts, database.types.ts
│   ├── geo.ts              # Haversine distance, bounding box helpers
│   └── geocoding.ts        # Nominatim reverse geocode
├── store/appStore.ts       # Zustand global store (radius, category, auth, draft)
└── types/index.ts          # TypeScript types mirroring DB schema
```

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | PWA-ready, server components, Vercel deploy |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Map | Leaflet.js + CartoDB Positron | Free, no API key, clean tiles |
| Backend | Supabase | DB + Auth + Storage + Realtime in one |
| Database | PostgreSQL + PostGIS | Geo queries (`ST_DWithin`) |
| State | Zustand + persist | Lightweight, works with Next.js |
| Icons | Lucide React | Consistent, tree-shakeable |

---

## Open Decisions

Unresolved product questions with defaults already in code — see [`docs/open-decisions.md`](docs/open-decisions.md).

Each decision maps 1:1 to a config flag above. Flip the flag when the decision is made.
