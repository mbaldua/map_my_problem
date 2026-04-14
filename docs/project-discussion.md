# Map My Problems — Project Discussion & Feasibility

## Concept

A Reddit-inspired civic issue reporting platform focused on local problems. Users visit the site/app, their location is auto-detected via geolocation, and they can post image-based reports of issues in their locality.

**Core Problem Categories (v1):**
- Water logging
- Uncleanliness / garbage
- Traffic issues

---

## What We Need to Build (Input Requirements)

### 1. User Side Inputs

| Input | How | Notes |
|---|---|---|
| Location | Browser Geolocation API (auto) | Fallback: manual pin on map |
| Issue Category | Tap/click selection | Water logging / Uncleanliness / Traffic |
| Image | Camera capture or file upload | Minimum 1 image, max 3-5 |
| Title | Short text field | Optional — auto-generate from category + location? |
| Description | Text area | Optional — reduce friction |
| Identity | Anonymous or registered | Key UX decision (see below) |

### 2. System Inputs (Backend Requirements)

| Requirement | Tech Options |
|---|---|
| User auth | Anonymous posts / Google OAuth / Phone OTP |
| Image storage | Cloudinary, AWS S3 + CloudFront, Supabase Storage |
| Database | PostgreSQL + PostGIS (for geo queries) |
| Geolocation reverse-geocode | Google Maps API / OpenStreetMap Nominatim (free) |
| Map rendering | Mapbox, Google Maps JS SDK, Leaflet (open source) |
| Realtime comments | Supabase Realtime / Socket.io / Firebase |
| Hosting | Vercel (frontend) + Railway/Supabase (backend) |
| Push notifications | FCM (Firebase) for mobile / Web Push API |

---

## Core Features (MVP)

### Feed / Map View
- Issues displayed as pins on a map (primary) and as cards in a list (secondary)
- Filter by: category, recency, upvotes, proximity
- Color-coded pins per issue type

### Issue Post
- Auto-detects current location
- User picks category → snaps/uploads photo → optionally adds note → submit
- One-tap flow: minimize friction is the #1 priority

### Discussion Thread (Reddit-style)
- Nested comments under each issue
- Upvote/downvote
- Link sharing

### Upvoting
- Community validation — more upvotes = higher visibility
- Could alert local authorities (future)

---

## Key Design Decisions to Make

### 1. Authentication Model
| Option | Friction | Accountability | Recommendation |
|---|---|---|---|
| Fully anonymous | Zero | Low — spam risk | OK for viewing |
| Phone OTP | Low | High | Best for posting |
| Google/Social login | Low | Medium | Good fallback |

**Suggested:** View anonymously, Phone OTP to post (reduces fake reports).

### 2. Web App vs Native App vs PWA
| Option | Pros | Cons |
|---|---|---|
| Web (responsive) | No install, instant access | Camera/geo limited on some browsers |
| PWA | Works offline, installable | Slightly complex setup |
| Native (React Native) | Best camera + geo access | App store approval delay, more effort |

**Suggested:** Start with a PWA (Progressive Web App) — installable, works on browser, accesses camera and GPS natively.

### 3. Scope of Locality
- Hyperlocal: 1–5 km radius (ward/neighborhood level)
- City-wide: zoom out view
- **Suggested:** Default to 5 km radius, allow zoom out

---

## Tech Stack Recommendation

```
Frontend:    Next.js (React) — PWA enabled
Styling:     Tailwind CSS
Map:         Leaflet.js + OpenStreetMap (free, no API cost)
Backend:     Supabase (DB + Auth + Storage + Realtime) — saves infra complexity
Database:    PostgreSQL with PostGIS extension (via Supabase)
Images:      Supabase Storage (or Cloudinary for transforms)
Geocoding:   Nominatim (OpenStreetMap) — free
Hosting:     Vercel (frontend) + Supabase (backend)
```

**Why Supabase?** It bundles DB, auth, file storage, and realtime in one service — ideal for a civic app MVP with minimal ops overhead.

---

## Database Schema (Rough Draft)

```sql
-- Users
users (id, phone, created_at, display_name)

-- Issues / Posts
issues (
  id, user_id, category, title, description,
  lat, lng, address,        -- geolocation
  image_urls[],             -- array of image URLs
  upvotes, status,          -- open / resolved / under_review
  created_at
)

-- Comments
comments (id, issue_id, user_id, body, parent_id, upvotes, created_at)

-- Votes
votes (id, user_id, issue_id, type)  -- up/down
```

---

## Feasibility Assessment

| Dimension | Assessment |
|---|---|
| Technical complexity | Medium — well-solved stack, no novel engineering |
| Cost (MVP) | Low — Supabase free tier + Vercel free tier covers early traffic |
| Legal / Privacy | Medium — geolocation data, image EXIF stripping needed |
| Moderation | Needs a plan — community flagging + admin dashboard |
| Time to MVP | 4–8 weeks solo, 2–3 weeks with 2 devs |

---

## Open Questions

1. Should issue status be updated by admins only, or can the original poster mark as resolved?
2. Do we notify local municipal bodies automatically, or is that a v2 feature?
3. Should users earn reputation/badges (like Reddit karma) for reporting issues?
4. How do we handle duplicate reports for the same issue (clustering on map)?
5. Language / localization support needed?

---

## Next Steps

- [ ] Finalize auth model
- [ ] Decide on PWA vs native
- [ ] Wireframe the "post an issue" flow (must be under 3 taps)
- [ ] Set up Supabase project + Next.js skeleton
- [ ] Define MVP feature cutoff
