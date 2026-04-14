/**
 * Onboarding configuration for Map My Problems.
 *
 * Open Decision #4: Onboarding
 * See: docs/open-decisions.md → Section 4
 */

export const ONBOARDING_CONFIG = {
  /**
   * When true, a 2-screen explainer is shown on first launch before the map.
   * When false (default), the user lands directly on the map — zero friction.
   *
   * Default: false
   * Open Decision: docs/open-decisions.md #4
   */
  SHOW_ONBOARDING: false,

  /**
   * localStorage key used to track whether the user has seen onboarding.
   * If SHOW_ONBOARDING is false, this key is never written.
   */
  STORAGE_KEY: 'mmp_onboarding_seen',

  /**
   * Splash animation duration in milliseconds.
   * See: docs/ui-specs.md — Section 1 (Splash/Entry Screen)
   * Duration: ~3–4 seconds, skippable on tap.
   */
  SPLASH_DURATION_MS: 3500,

  /**
   * On return visits (STORAGE_KEY already set), skip splash entirely
   * and go directly to the last known map position.
   */
  SKIP_SPLASH_ON_RETURN: true,
} as const

export type OnboardingConfig = typeof ONBOARDING_CONFIG
