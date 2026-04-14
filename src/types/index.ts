/**
 * Shared TypeScript types for Map My Problems.
 * Mirrors the Supabase DB schema defined in docs/project-discussion.md.
 */

// ─── Enums / Literals ─────────────────────────────────────────────────────────

/** The three civic issue categories supported in v1. */
export type IssueCategory = 'water_logging' | 'uncleanliness' | 'traffic'

/** Lifecycle status of an issue. */
export type IssueStatus = 'open' | 'resolved' | 'under_review'

/** Vote direction — used for both issue votes and comment votes. */
export type VoteType = 'up' | 'down'

/** Feed sort order. Matches config/feed.ts options. */
export type FeedSort = 'proximity' | 'hot' | 'recent'

/** Radius options (km) shown in the radius pill selector. */
export type RadiusKm = 1 | 3 | 5 | 10

// ─── Database Row Types ───────────────────────────────────────────────────────

/**
 * Represents a row in the `users` table.
 * Auth is handled by Supabase; this table stores public profile info.
 */
export interface User {
  id: string               // UUID — matches auth.users.id
  phone: string | null     // E.164 format, e.g. "+919876543210"
  display_name: string | null
  created_at: string       // ISO 8601 timestamp
}

/**
 * Represents a row in the `issues` table.
 * PostGIS is used server-side; lat/lng are stored as regular floats for simplicity.
 */
export interface Issue {
  id: string               // UUID
  user_id: string | null   // null for anonymous posts (future: ALLOW_ANONYMOUS_FIRST_POST)
  category: IssueCategory
  title: string | null     // Optional — auto-generated from category + location if absent
  description: string | null  // Max 200 chars (see config/report.ts)
  lat: number
  lng: number
  address: string | null   // Reverse-geocoded via Nominatim
  image_urls: string[]     // Array of Supabase Storage public URLs
  upvotes: number          // Denormalised count — source of truth is `votes` table
  status: IssueStatus
  created_at: string       // ISO 8601 timestamp
}

/**
 * Issue enriched with computed fields added at query time.
 * Used in UI components.
 */
export interface IssueWithMeta extends Issue {
  distance_km?: number         // Distance from user's current location
  local_upvotes?: number       // Upvotes from users within the active radius
  comment_count?: number       // Denormalised for feed display
  author?: Pick<User, 'id' | 'display_name'>
}

/**
 * Represents a row in the `comments` table.
 * MVP supports 1 level of nesting (parent_id points to a top-level comment).
 */
export interface Comment {
  id: string
  issue_id: string
  user_id: string | null
  body: string
  parent_id: string | null    // null = top-level comment; string = reply
  upvotes: number
  created_at: string
}

/**
 * Comment enriched with author info and geo badge.
 */
export interface CommentWithMeta extends Comment {
  author?: Pick<User, 'id' | 'display_name'>
  is_local?: boolean          // True if commenter was within radius at time of comment
  replies?: CommentWithMeta[] // Populated client-side for display (1 level deep)
}

/**
 * Represents a row in the `votes` table.
 * One row per (user_id, issue_id) pair — UPSERT on change.
 */
export interface Vote {
  id: string
  user_id: string
  issue_id: string
  type: VoteType
}

// ─── UI / App State Types ─────────────────────────────────────────────────────

/** Geo coordinates used throughout the app. */
export interface LatLng {
  lat: number
  lng: number
}

/** Result returned by the browser Geolocation API (wrapped). */
export interface GeolocationResult {
  coords: LatLng
  accuracy: number   // metres
}

/** State shape for the multi-step report wizard. */
export interface ReportDraft {
  category: IssueCategory | null
  photos: File[]
  location: LatLng | null
  address: string | null
  description: string
}

/** Aggregated summary shown in the Area Pulse bottom sheet. */
export interface AreaPulseSummary {
  radius_km: RadiusKm
  neighborhood: string | null
  counts: Record<IssueCategory, number>
  top_issue: IssueWithMeta | null
  local_confirmations: number
  trend_multiplier: number | null  // e.g. 3 = "3x more than last week"
}
