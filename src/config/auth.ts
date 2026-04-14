/**
 * Auth configuration for Map My Problems.
 *
 * Open Decision #1: Anonymous First Post
 * See: docs/open-decisions.md → Section 1
 *
 * Default: Phone OTP required for all posts (ALLOW_ANONYMOUS_FIRST_POST = false).
 * Change this to `true` to let users submit their very first report without
 * signing in. Subsequent posts will still require OTP.
 */

export const AUTH_CONFIG = {
  /**
   * When true, a user may submit their first report without completing
   * phone OTP verification. All subsequent posts require auth.
   *
   * Default: false (OTP required for every post)
   * Open Decision: docs/open-decisions.md #1
   */
  ALLOW_ANONYMOUS_FIRST_POST: false,

  /**
   * OTP code length (digits).
   */
  OTP_LENGTH: 6,

  /**
   * Time in seconds before a sent OTP expires.
   * Must match the Supabase project's OTP expiry setting.
   */
  OTP_EXPIRY_SECONDS: 300,

  /**
   * If true, the app stores an auth session in localStorage so the user
   * stays logged in across page refreshes. Set to false to use sessionStorage.
   */
  PERSIST_SESSION: true,
} as const

export type AuthConfig = typeof AUTH_CONFIG
