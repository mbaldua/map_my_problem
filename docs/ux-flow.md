# UX Flow — Map My Problems

## Design Principle
**Zero resistance to report.** Every extra tap, form field, or decision point is a reason someone gives up. The reporting flow must feel lighter than tweeting.

---

## Flow 1: First-Time Visitor

```
Open App / Visit URL
        |
        v
Location Permission Prompt
  [Allow]        [Deny]
     |               |
     v               v
Map centered     Ask user to
on user's        manually drop
location         a pin
        \           /
         v         v
        Home Screen (Map View)
        - Pins of nearby issues visible
        - "Report an Issue" button (prominent, floating)
        - Optional: quick onboarding tooltip (skip-able)
```

**Key decisions:**
- If location denied, show a city-level map. Don't block the user.
- Onboarding: max 2 tooltip screens, skippable. Don't gate content behind it.

---

## Flow 2: Reporting an Issue (Core Flow — Target: under 60 seconds)

```
Tap "Report an Issue" (FAB button)
        |
        v
Step 1: Pick Category
  [Water Logging]  [Uncleanliness]  [Traffic]
  (large icons, full screen, easy tap targets)
        |
        v
Step 2: Take / Upload Photo
  Camera opens directly → snap photo
  OR tap "Upload" to pick from gallery
  (preview shown immediately)
        |
        v
Step 3: Confirm Location
  Mini-map with pin on current location
  User can drag pin to adjust (street accuracy)
  Address shown in text below map
        |
        v
Step 4 (Optional): Add a note
  Single text field — "Describe the issue (optional)"
  Placeholder: "e.g. Road flooded near signal, no drainage since morning"
  Max 200 characters
        |
        v
[Submit Report]
        |
        v
Auth Check:
  Logged in? → Submit directly
  Not logged in? →
    "Quick verify with phone to post"
    Enter phone → OTP → Done
    (save session, don't ask again)
        |
        v
Success Screen
  "Report submitted! Others in your area can see it."
  [View on Map]   [Report Another]
```

**Key decisions:**
- Steps 1-3 happen BEFORE asking for auth. User does the work first, auth is last.
- Camera opens directly in Step 2 — don't make them tap again to open camera.
- Location is pre-filled. Adjusting it is optional, not required.
- "Add a note" is Step 4, after photo — reverse of typical forms. Reduces abandonment.

---

## Flow 3: Area Pulse — Location Summary (NEW)

Before a user reports or browses, they can get a quick "what's happening near me" digest.

```
Home Screen — Radius Selector (top bar)
  [1 km]  [3 km]  [5 km]  [10 km]  ← toggleable pill
        |
        v
Area Pulse Panel (collapsible bottom sheet or sidebar card)
  ┌─────────────────────────────────────────┐
  │  📍 Bandra West — Last 7 days           │
  │                                         │
  │  🔵 Water Logging    ████████░░  14     │
  │  🟠 Uncleanliness    ██████░░░░  9      │
  │  🔴 Traffic          ████░░░░░░  6      │
  │                                         │
  │  Most Active: Carter Road junction      │
  │  Trending: "Drain blocked near station" │
  │  [▲ 38 locals confirmed this week]      │
  └─────────────────────────────────────────┘
        |
   Tap any row → filters map/feed to that category + radius
   Tap trending issue → goes to Issue Detail
```

**What the summary shows:**
- Issue count by category within selected radius
- Top issue (most upvoted or most commented) in the area
- "Locals confirmed" count — geo-validated votes only (see Flow 7)
- Spark trend: "↑ 3x more reports than last week" if spike detected

**Key decisions:**
- Summary updates live when radius pill is changed
- "Locals confirmed" is a distinct, prominent number — not the same as total upvotes
- Summary is a passive informational layer, not a gate — user can ignore it and go straight to map

---

## Flow 4: Category Gallery — Browse Before You Report (NEW)

Before posting, a user can see all images reported in their area for the same category. Serves two purposes: reduces duplicates, and gives confidence that reporting works.

```
[Report an Issue] → Step 1: Pick Category
        |
        v
After category selection, before camera:
  ┌──────────────────────────────────────┐
  │  💧 Water Logging near you           │
  │  14 reports in last 7 days           │
  │                                      │
  │  [📷][📷][📷][📷]  ← photo grid     │
  │  [📷][📷][📷][📷]                   │
  │                                      │
  │  [View All]        [Report New ➜]   │
  └──────────────────────────────────────┘
```

**User paths from here:**
- Sees their exact issue already reported → taps it → goes to issue detail → upvotes + comments instead of duplicate post
- Doesn't see their issue → taps "Report New" → continues to Step 2 (camera)

**Gallery view (standalone, also accessible from home):**
```
Gallery Tab / Screen
  ├── Filter bar: [All] [Water] [Unclean] [Traffic]
  ├── Radius selector: [1km] [3km] [5km]
  ├── Sort: [Recent] [Most Upvoted] [Near Me]
  │
  └── Horizontal swipe carousel (full-width cards)
        Each card shows:
        - Full-width photo (dominant, ~70% screen height)
        - Category tag + location + time overlay
        - Local vote count + total upvotes
        - Brief description (if added)
        - [View Discussion]  [▲ Confirm] actions
        Swipe left/right to navigate
        Tap photo → full-screen view
        Dot indicator shows position in set
```
→ Visual detail in ui-specs.md Section 3

**Key decisions:**
- Gallery shown as a "preview step" in the report flow, not a hard block
- "Report New" is always reachable — don't force users to scroll through gallery
- Images are geo-filtered to selected radius automatically

---

## Flow 5 (updated): Browsing Issues (Discovery)

```
Home Screen
        |
    [Map View] ←default→ [Feed View]  (toggle top right)
        |                       |
        v                       v
   Map with              Vertical card list
   color-coded           sorted by: Recent / Nearby / Hot
   pins:
   🔵 Water Logging
   🟠 Uncleanliness
   🔴 Traffic
        |
   Tap a pin
        |
        v
   Issue Preview Card (bottom sheet)
   - Photo thumbnail
   - Category tag
   - Location / address
   - Time posted ("2 hrs ago")
   - Upvote count + comment count
   [View Full Issue]
        |
        v
   Issue Detail Page (see Flow 4)
```

**Filters (accessible via filter icon):**
- Category: All / Water / Unclean / Traffic
- Distance: 1 km / 5 km / 10 km
- Time: Today / This Week / All
- Status: Open / Resolved

**Key decisions:**
- Map is the default view — it makes locality feel real and tangible
- Feed view is for people who want to scroll (familiar pattern)
- Bottom sheet preview prevents full page loads for casual browsing

---

## Flow 6: Issue Detail Page

```
Issue Detail
├── Full-size photo (swipeable if multiple)
├── Category tag + Status badge (Open / Resolved)
├── Location: "Near Linking Road, Bandra West"
├── Posted by: "Anonymous" or "User123" + time
├── Description (if added)
├── "Share" button
│
├── Validity Bar  ← NEW
│   ┌─────────────────────────────────────────────┐
│   │  ▲ 47 total  |  🏠 31 locals  |  ▼ 4       │
│   │  ████████████████░░░░  Credibility: High    │
│   └─────────────────────────────────────────────┘
│
└── Chat / Discussion Section (see Flow 7)
```

**Validity Bar explained:**
- **Total upvotes** — anyone anywhere
- **Local upvotes** — geo-verified users within selected radius (weighted higher)
- **Downvotes** — "this seems incorrect" signal (shown separately, not subtracted)
- **Credibility score** — derived from ratio of locals to total voters + report age
  - High: >50% local votes
  - Medium: 25–50% local
  - Low: <25% local (may indicate spam/misreport)

---

## Flow 7: Geo-Validated Chat & Voting (NEW)

The key insight: **a vote from someone who lives near the issue is worth more than a vote from someone 50 km away.** This is the trust layer.

```
User opens Issue Detail
        |
        v
System checks user's current location vs issue location
        |
   Within radius?        Outside radius?
        |                      |
        v                      v
  🏠 "Local" badge       No badge shown
  on their profile        Vote still counts
  in this discussion      but not as "local"
```

**Chat section structure:**
```
Discussion
├── Sort: [Top]  [New]  [Locals First]  ← NEW sort option
│
├── Comment Card
│   ├── 🏠 Local  •  "Ravi K."  •  2 hrs ago   ← geo badge
│   ├── "This has been happening every monsoon,
│   │    the drain near the signal is blocked"
│   ├── [▲ 12]  [▼ 1]  [Reply]
│   └── Nested reply (1 level)
│
├── Comment Card (non-local)
│   ├── "Priya S."  •  5 hrs ago             ← no badge
│   ├── "Same issue near Dadar too"
│   └── [▲ 3]  [▼ 0]  [Reply]
│
└── [Add to discussion...]  (requires auth)
```

**Geo-validation rules:**
- Local = within same radius the user has selected (default 5 km from issue pin)
- Location checked at time of vote/comment, not stored permanently
- User can see "X locals have confirmed this" as a trust signal
- Locals First sort surfaces geo-verified voices at the top

**Downvote behavior:**
- Downvote = "I'm near here and this doesn't look right / already resolved"
- If downvotes from locals > upvotes from locals → issue flagged for review
- Downvote reason prompt (optional): [Already Fixed] [Wrong Location] [Not an Issue]

**Key decisions:**
- Location is checked silently in the background — no extra prompt
- Users who denied location permission can still vote, just without the Local badge
- "Locals First" sort is available but not the default (default: Top)

---

## Flow 8: Upvoting (updated)

```
User sees issue (map or feed)
        |
Tap [▲ Upvote]
        |
   Logged in?
     Yes → Vote registered (instant, optimistic UI)
           System checks location silently
           If within radius → counted as Local vote → 🏠 badge shown
           If outside radius → counted as general vote → no badge
     No  → "Verify phone to vote" → OTP → vote registered
```

---

## Flow 9: Marking Issue as Resolved

```
Issue Reporter or Admin visits issue
        |
Sees [Mark as Resolved] option (only visible to them)
        |
Taps it → Confirmation: "Is this issue resolved?"
        |
        v
Status changes to ✅ Resolved
Issue stays visible (historical record)
Pin changes color to grey on map
```

---

## Screen Map (All Screens)

```
Home (Map View)
  ├── Area Pulse Panel (radius-based summary)
  └── Radius Selector pill
Home (Feed View)
  └── Issue Detail
        ├── Validity Bar (local vs total votes)
        └── Chat / Discussion (geo-badged comments)
Gallery View
  ├── Filter: Category + Radius + Sort
  └── Issue Detail
Report Flow
  ├── Step 1: Category
  ├── Step 1b: Category Gallery preview (NEW)
  ├── Step 2: Photo
  ├── Step 3: Location
  ├── Step 4: Note (optional)
  └── Success
Auth
  ├── Phone Entry
  └── OTP Verify
Profile (minimal)
  ├── My Reports
  └── Logout
```

---

## What We're NOT Building in MVP

- Search by address / keyword
- Notifications (push or in-app)
- Admin moderation dashboard
- Reputation / karma system
- Sharing to WhatsApp / social (can add as one-liner later)
- Tagging other users
- Image filters or editing
- Multiple languages
