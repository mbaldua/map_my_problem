# UI Specifications — Map My Problems

## How to Read This Document

Each section describes a screen or UI element in terms of:
- **Visual structure** — layout, hierarchy, dominant elements
- **Motion / Animation** — how it moves or transitions
- **States** — what the user sees in different conditions
- **Components** — the individual UI pieces

---

## 1. Splash / Entry Screen

### Vision
The app opens with an animated globe slowly rotating. As the user's location resolves, the camera zooms in — continent → country → state → city — like a Google Earth flyover, landing on the user's locality with a soft pulse on the pin drop.

### Animation Sequence
```
[Globe rotating slowly — dark space background]
        |
        v
Location resolves in background (Geolocation API)
        |
        v
Camera zooms: Earth → India → Maharashtra → Mumbai → Bandra
        |
        v
Pin drops on user's neighborhood
Soft ripple animation on pin
        |
        v
Fade into Home Screen (Map View)
```

### Visual Details
- Background: deep space / dark navy — globe is the hero
- Globe: stylized flat design (simplified continents, flat colors — easier to build, loads faster)
- Zoom is smooth and continuous, not jump cuts
- Final pin drop has a 3-ring ripple effect (like a raindrop)
- Duration: ~3–4 seconds total, skippable on tap

### States
| State | What the user sees |
|---|---|
| Location resolving | Globe rotates, subtle "locating..." text |
| Location found | Zoom begins immediately |
| Location denied | Zoom stops at country level, prompts manual city pick |
| Slow connection | Globe stays at country level, brief loader |

### Notes
- This animation runs only on first launch or fresh visit
- On return visits: skip splash, go directly to last known location on map
- The zoom sequence is the brand moment — it communicates "this is about YOUR place"

---

## 2. Home Screen — Map View

### Visual Structure
```
┌─────────────────────────────────────────┐
│  [≡ Menu]    Map My Problems   [Filter] │  ← top bar (minimal)
├─────────────────────────────────────────┤
│  [1km] [3km] [5km] [10km]               │  ← radius pills (sticky)
│─────────────────────────────────────────│
│                                         │
│         F U L L   M A P                 │
│                                         │
│   🔵  🔴     🟠                         │  ← category pins
│       🔵🔵                              │
│              🟠                         │
│                                         │
│  [heat overlay visible per category]    │  ← see Heatmap section
│                                         │
├─────────────────────────────────────────┤
│  ↑ drag  [Area Pulse — collapsed]       │  ← bottom sheet handle
└──────────────────────�───────────────────┘
                       [📷 Report]         ← FAB, bottom right
```

### Map Heatmap Overlay
Instead of only showing individual pins, the map renders a **density heatmap layer** underneath the pins:

- Each category has its own heat color:
  - Water Logging → **blue gradient** (light sky → deep blue at hotspots)
  - Uncleanliness → **orange/amber gradient**
  - Traffic → **red gradient**
- Heat intensity increases with number of reports and upvotes in that zone
- When all categories are visible → heatmap blends the three colors, hottest zones show highest overlap
- When a single category is filtered → only that color's heatmap shows
- Heatmap fades when zoomed in past street level (pins become more useful at that scale)
- Heatmap intensifies when zoomed out (ward / city level — shows problem zones)
- **Toggle:** Heatmap is user-controlled via a [🌡 Heatmap] toggle button on the map (top-left corner). Off by default, user enables it to see density view.

### Pin Behavior
- Individual pins shown at street zoom level
- Pins cluster into a number badge at city/ward zoom level
- Tap a cluster → zooms in to separate them
- Tap a pin → bottom sheet slides up with issue preview

### Area Pulse (Bottom Sheet — collapsed by default)
- Collapsed state: shows one-line summary — "14 issues near you this week · 🔵 Most: Water Logging"
- Dragging up expands to full summary panel (see ux-flow.md Flow 3)

---

## 3. Gallery — Horizontal Swipe Carousel

### Vision
The gallery is not a grid. It is a **horizontal swipe experience** — full-width cards that the user flicks through left to right. Each card is dominated by the photo, with minimal text overlay. Feels like flipping through evidence, not browsing a catalog.

### Layout
```
← swipe to navigate →

┌─────────────────────────────────────────┐
│                                         │
│                                         │
│           F U L L   P H O T O          │  ← 70% of screen height
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  🔵 Water Logging                       │
│  📍 Near Carter Rd, Bandra              │
│  🕒 2 hours ago  ·  🏠 12 locals  ▲ 38 │
│                                         │
│  "Drain completely blocked, water       │
│   since yesterday morning"              │
│                                         │
│  [View Discussion]      [▲ Confirm]     │
└─────────────────────────────────────────┘

         •  •  ●  •  •              ← dot indicator (position in stack)
```

### Behavior
- Default sort: Most recent first
- Filter pills above the carousel: [All] [Water] [Unclean] [Traffic]
- Swipe left → next issue, swipe right → previous
- Tap photo → full-screen photo view (pinch to zoom)
- Tap "View Discussion" → opens Issue Detail with chat (see Section 5)
- Dot indicator shows position in the current filtered set (e.g., 3 of 14)
- **When shown inside Report Flow (pre-report preview):** same carousel, but with a sticky "None of these? Report New →" button at the bottom

### States
| State | What shows |
|---|---|
| Has nearby issues | Carousel loads, starting from most recent |
| No issues in radius | Single card: "No reports near you yet. Be the first." + [Report Now] |
| Loading | Skeleton card with shimmer animation |

---

## 4. Report Flow — Screen by Screen

### Step 1: Category Picker
```
┌─────────────────────────────────────────┐
│  ←   What's the issue?                  │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │         │  │         │  │         │ │
│  │   💧    │  │   🗑️    │  │   🚗    │ │
│  │         │  │         │  │         │ │
│  │  Water  │  │ Unclean │  │ Traffic │ │
│  │ Logging │  │         │  │         │ │
│  └─────────┘  └─────────┘  └─────────┘ │
│                                         │
│  Large tap targets, full-width cards    │
│  Tap → brief scale animation → next    │
│                                         │
└─────────────────────────────────────────┘
```

### Step 1b: Gallery Preview (pre-report)
- Carousel loads (see Section 3 above)
- Sticky CTA at bottom: [Report New Issue →]
- User can swipe through a few images, then proceed

### Step 2: Photo Capture
```
┌─────────────────────────────────────────┐
│  ←   Add a photo                        │
├─────────────────────────────────────────┤
│                                         │
│         [ Camera Viewfinder ]           │
│              (full screen)              │
│                                         │
│                                         │
│         [        📷        ]            │  ← shutter button
│  [ 🖼 Upload ]          [ 🔦 Flash ]    │
│                                         │
└─────────────────────────────────────────┘
```
- Camera opens by default
- Upload from gallery is available but secondary (smaller button)
- After snap: preview screen with [Use this] / [Retake]

### Step 3: Location Confirm
```
┌─────────────────────────────────────────┐
│  ←   Confirm location                   │
├─────────────────────────────────────────┤
│                                         │
│         [ Mini Map — pin centered ]     │
│         Drag pin to adjust              │
│                                         │
├─────────────────────────────────────────┤
│  📍 Near Carter Road, Bandra West       │
│     Mumbai 400050                       │
├─────────────────────────────────────────┤
│         [ Confirm & Continue ]          │
└─────────────────────────────────────────┘
```

### Step 4: Note (Optional)
```
┌─────────────────────────────────────────┐
│  ←   Add details  (optional)            │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Describe the issue...           │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                           0 / 200       │
│                                         │
│         [ Submit Report ]               │
│         [ Skip & Submit  ]              │
└─────────────────────────────────────────┘
```

---

## 5. Issue Detail + Chat

### Visual Structure
```
┌─────────────────────────────────────────┐
│  ←                          [⋯ More]   │
├─────────────────────────────────────────┤
│                                         │
│        Full-width photo                 │
│        (swipeable if multiple)          │
│                                         │
├─────────────────────────────────────────┤
│  🔵 Water Logging  ·  Open             │
│  📍 Carter Road, Bandra  ·  2 hrs ago  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ▲ 47 total  🏠 31 local  ▼ 4  │   │  ← Validity Bar
│  │  ████████████████░░  High       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  "Drain near the signal completely      │
│   blocked, water since yesterday"       │
│                                         │
├─────────────────────────────────────────┤
│  Discussion  (24 comments)              │
│  Sort: [Top ▾]  [New]  [Locals First]  │
│─────────────────────────────────────────│
│                                         │
│  🏠 Ravi K.  ·  2h                     │  ← Local badge
│  "This happens every monsoon. The        │
│   MCGM drain cleaning hasn't happened   │
│   in 3 years on this stretch."          │
│  ▲ 12  ▼ 0  Reply                      │
│                                         │
│    ↳ Priya S.  ·  1h                   │  ← nested reply
│    "Same with the junction 200m ahead"  │
│    ▲ 4  Reply                           │
│                                         │
│  Anon User  ·  5h                       │  ← no local badge
│  "Is this Bandra West or East?"         │
│  ▲ 0  ▼ 2  Reply                       │
│                                         │
├─────────────────────────────────────────┤
│  [ Add to discussion...              ]  │  ← sticky input
└─────────────────────────────────────────┘
```

### Chat Rules (Reddit-style)
- Top-level comments are full-width cards
- Replies are indented once (1 level max in MVP)
- Upvote / Downvote on both comments and the issue itself
- Local badge (🏠) shows automatically if commenter is within radius — no user action needed
- "Locals First" sort: local comments float up regardless of upvotes
- Comment input is sticky at the bottom — always reachable without scrolling
- Deleted comments show "[comment removed]" placeholder (keeps thread structure intact)

---

## 6. Component States Reference

| Component | Empty | Loading | Error |
|---|---|---|---|
| Map | City-level, no pins | Skeleton shimmer over map | "Could not load map" + retry |
| Gallery carousel | "No reports near you" card | Shimmer card | "Failed to load" card |
| Chat | "Be the first to comment" | 3 skeleton comment rows | "Couldn't load comments" + retry |
| Validity Bar | Hidden (0 votes) | Thin grey bar | Not shown |
| Area Pulse | "No activity near you yet" | Shimmer rows | Silently hidden |
