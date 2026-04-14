/**
 * Feed configuration for Map My Problems.
 *
 * Open Decision #3: Default Feed Sort
 * See: docs/open-decisions.md → Section 3
 */

import type { FeedSort } from '@/types'

export const FEED_CONFIG = {
  /**
   * Sort order applied to the Feed/Gallery view on first load.
   *
   * Options:
   *   'proximity' — nearest issues first (Near Me)
   *   'hot'       — most upvoted today
   *   'recent'    — newest first
   *
   * Default: 'proximity'
   * Open Decision: docs/open-decisions.md #3
   */
  DEFAULT_FEED_SORT: 'proximity' as FeedSort,

  /**
   * Number of issues fetched per page in the feed / carousel.
   */
  PAGE_SIZE: 20,

  /**
   * Time window (days) used for the "hot" sort — counts upvotes within this window.
   */
  HOT_WINDOW_DAYS: 1,

  /**
   * Filter options available in the gallery / feed filter bar.
   */
  FILTER_OPTIONS: {
    categories: ['all', 'water_logging', 'uncleanliness', 'traffic'] as const,
    time:       ['today', 'this_week', 'all'] as const,
    status:     ['open', 'resolved', 'all'] as const,
  },
} as const

export type FeedConfig = typeof FEED_CONFIG
