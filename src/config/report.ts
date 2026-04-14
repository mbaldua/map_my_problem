/**
 * Report flow configuration for Map My Problems.
 *
 * Open Decision #5: Photo Requirement
 * See: docs/open-decisions.md → Section 5
 */

export const REPORT_CONFIG = {
  /**
   * When true, the user must attach at least 1 photo to submit a report.
   * When false, photos are optional.
   *
   * Default: true (photo required)
   * Open Decision: docs/open-decisions.md #5
   */
  REQUIRE_PHOTO: true,

  /**
   * Minimum number of photos required when REQUIRE_PHOTO = true.
   */
  MIN_PHOTOS: 1,

  /**
   * Maximum number of photos a user may attach to a single report.
   * Matches the design spec range of 3–5.
   */
  MAX_PHOTOS: 5,

  /**
   * Maximum file size (bytes) for each uploaded photo.
   * Default: 10 MB.
   */
  MAX_PHOTO_SIZE_BYTES: 10 * 1024 * 1024,

  /**
   * Accepted image MIME types for the file input.
   */
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const,

  /**
   * Maximum character length for the optional description note (Step 4).
   * See: docs/ux-flow.md → Flow 2
   */
  MAX_DESCRIPTION_LENGTH: 200,

  /**
   * Supabase Storage bucket name for issue photos.
   */
  STORAGE_BUCKET: 'issue-images',

  /**
   * Steps in the report wizard (in order).
   * Photo is first — camera opens immediately. Category is tagged after seeing the photo.
   */
  STEPS: ['photo', 'category', 'location', 'note'] as const,

  /**
   * Number of nearby same-category issues to preview in the gallery
   * step shown between Step 1 (category) and Step 2 (photo).
   * See: docs/ux-flow.md → Flow 4
   */
  GALLERY_PREVIEW_COUNT: 8,
} as const

export type ReportConfig = typeof REPORT_CONFIG
export type ReportStep = typeof REPORT_CONFIG.STEPS[number]
