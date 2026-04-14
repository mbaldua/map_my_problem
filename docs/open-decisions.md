# Open Decisions — Map My Problems

These are unresolved design/product questions. Each has a **default** baked into the code so the app works now. Change the default by updating the relevant config/constant when the decision is made.

---

## 1. Anonymous First Post

**Question:** Allow a fully anonymous post (no phone OTP) for a user's very first report?

**Default in code:** Phone OTP required for all posts.

**Where to change:** `src/config/auth.ts` → `ALLOW_ANONYMOUS_FIRST_POST: false`

---

## 2. Duplicate Issue Handling

**Question:** If multiple people report the same location/issue, do we cluster them into one pin or show each separately?

**Default in code:** Show each separately. Clustering is opt-in via map zoom (number badge on overlapping pins).

**Where to change:** `src/config/map.ts` → `CLUSTER_DUPLICATE_ISSUES: false`

---

## 3. Default Feed Sort

**Question:** Should the default sort in Feed View be "Near Me" or "Most Upvoted Today"?

**Default in code:** "Near Me" (proximity sort).

**Where to change:** `src/config/feed.ts` → `DEFAULT_FEED_SORT: 'proximity'`
Options: `'proximity' | 'hot' | 'recent'`

---

## 4. Onboarding

**Question:** Zero onboarding (drop straight into map) vs 2-screen explainer on first launch?

**Default in code:** Zero onboarding — user lands directly on the map.

**Where to change:** `src/config/onboarding.ts` → `SHOW_ONBOARDING: false`

---

## 5. Photo Requirement

**Question:** Should at least 1 photo be required to submit a report, or make it optional?

**Default in code:** Photo required (1 minimum).

**Where to change:** `src/config/report.ts` → `REQUIRE_PHOTO: true`

---

## Status

| # | Decision | Default | Decided? |
|---|---|---|---|
| 1 | Anonymous first post | No (OTP required) | ❌ |
| 2 | Duplicate clustering | No (show separately) | ❌ |
| 3 | Default feed sort | Near Me | ❌ |
| 4 | Onboarding | Off | ❌ |
| 5 | Photo required | Yes | ❌ |
