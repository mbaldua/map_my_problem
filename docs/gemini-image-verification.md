# Gemini Image Verification — Spec & Architecture

## What it does
Two-call pipeline that runs in the background during the report flow.
Validates the image, auto-generates a description, and checks for duplicates —
with zero added latency from the user's perspective.

---

## Two API calls, not one

### Call A — Validation (fast gate)
**Model:** Gemini 1.5 Flash
**Fires:** immediately after user confirms photo (before category screen)
**Runs during:** category selection screen (~3–8 seconds of user time)
**Timeout:** 4s — fail open if exceeded

**Does:**
- Is this actually a civic issue? (hard block on selfies, food, random objects)
- Image quality check (too dark, too blurry, too far away)
- Suggest most likely category from image
- Confidence score

**Returns:**
```json
{
  "is_civic_issue": true,
  "confidence": 0.91,
  "detected_category": "water_logging",
  "image_quality": "good",
  "rejection_reason": null
}
```

### Call B — Enrichment (background)
**Model:** Gemini 1.5 Flash (Pro only if duplicate image comparison needed)
**Fires:** immediately after user selects category
**Runs during:** location confirmation screen (~10–15 seconds of user interaction)
**Timeout:** 10s — fail open if exceeded

**Does:**
- Generate description paragraph from image
- Generate suggested questions for the user (based on visual evidence)
- Compare against potential duplicate (if geo-check found one nearby)

**Returns:**
```json
{
  "description": "Waterlogged road near a residential area with approximately 15–20 cm of standing water. A drainage outlet appears blocked by debris on the left side.",
  "suggested_questions": [
    "How long has this water been here?",
    "Does this happen every monsoon or is this new?",
    "Is the nearby drain blocked?"
  ],
  "category_matches": true,
  "has_sensitive_content": false,
  "is_duplicate": false,
  "duplicate_issue_id": null
}
```

---

## Timing diagram

```
User taps Report
│
Camera opens (user shooting photo — 5–30s)
│
Photo confirmed
├── START Call A (Flash, target <1s)
├── START DB geo-check for duplicates (parallel, instant)
│
User on Category screen (3–8s of reading)
│   Call A resolves → store result
│   ↓ if is_civic_issue = false → show rejection before they can proceed
│   ↓ if category mismatch → show suggestion (user can override)
│
Category selected
├── START Call B (Flash, target <3s)
│
User on Location screen — dragging pin (10–15s)
│   Call B resolves in background
│
Location confirmed
│
Note screen opens
└── description pre-filled from Call B
    suggested_questions shown as tappable chips
    (if Call B failed → screen opens empty, same as today)
```

---

## Duplicate detection — three layers

### Layer 1 — PostGIS geo query (always runs, free)
On submission:
```sql
SELECT id, category, title, image_urls
FROM issues
WHERE ST_DWithin(location, ST_Point($lng, $lat)::geography, 100)
  AND category = $category
  AND status = 'open'
  AND created_at > now() - interval '7 days'
LIMIT 3;
```
If match found → show existing report thumbnail, ask user to confirm or proceed.

### Layer 2 — Gemini image comparison (only if Layer 1 found a match)
Send both images to Gemini Pro:
*"Do these two photos show the same physical location and problem?"*
Handles the case where two people photographed the same issue from different angles.

### Layer 3 — Semantic vector matching (v2, future)
Gemini embeddings → pgvector similarity search.
Too complex for now but the right long-term answer.

---

## What Gemini infers vs. what it asks the user

Gemini cannot know how long a problem has existed — but it reads visual evidence:
- Watermarks / stain lines → prolonged standing water
- Algae or moss growth → long-term issue
- Debris accumulation → not a fresh spill
- Abandoned vehicles → severe flooding

From these, it generates *questions for the user*, not answers:
`suggested_questions` are Gemini's way of saying "I can see the problem but I need context
the image doesn't show." These appear as tappable chips in the Note step.

---

## Image preprocessing (before any Gemini call)

1. **Strip EXIF** — photos contain GPS coordinates, device info.
   Extract lat/lng for our use, then strip before sending to Gemini.
2. **Resize to 1024px max** — sufficient for classification, faster API call,
   lower token count.
3. **Convert to JPEG** — HEIC/WebP converted for consistent handling.

Library: `sharp` (server-side only, Node.js)

---

## Failure handling

| Failure | Behaviour |
|---|---|
| Call A times out / errors | Skip validation, proceed with report |
| Call A rejects image | Show clear message, let user retake |
| Call B times out / errors | Note screen opens empty (same as today) |
| Category mismatch from Call A | Suggest correction, user can override |
| Duplicate found | Show existing report, user chooses |
| Gemini down entirely | Full fail-open, report submits normally |

**Rule:** Gemini is never on the critical path. A bad Gemini response must never block a legitimate report.

---

## Privacy

- Gemini never receives user ID or PII
- EXIF stripped before API call
- Image resized (not full-res) sent to Google servers
- Civic documentation (public issue photos) is legitimate use — faces in background are acceptable
- If `has_sensitive_content: true` returned → warn user before submission

---

## API endpoints

```
POST /api/verify-image
  Body: { image: base64string, category: IssueCategory }
  Returns: Call A response

POST /api/describe-image
  Body: { image: base64string, category: IssueCategory, potential_duplicate_url?: string }
  Returns: Call B response
```

Both are Next.js Route Handlers. `GEMINI_API_KEY` is server-side only — never in the browser.

---

## Model selection

| Call | Model | Reason |
|---|---|---|
| Call A (validation) | Gemini 1.5 Flash | Binary classification, fast, structured prompt sufficient |
| Call B (description) | Gemini 1.5 Flash | Descriptive text generation, Flash handles well |
| Call B (duplicate compare) | Gemini 1.5 Pro | Nuanced visual comparison of two images needs it |

Run Pro only when there is a specific reason (duplicate image comparison).
A well-engineered Flash prompt with explicit JSON schema outperforms a lazy Pro prompt.

---

## Env var needed
```
GEMINI_API_KEY=your-key-here   # Google AI Studio → free tier
```

Get key at: https://aistudio.google.com/app/apikey
