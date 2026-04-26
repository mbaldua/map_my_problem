/**
 * Global app state — managed with Zustand.
 *
 * Keeps UI-level state that needs to be shared across components:
 *  - Selected map radius
 *  - Active category filter
 *  - Auth / session info
 *  - Report wizard draft
 *
 * Server state (issues, comments) is intentionally NOT stored here;
 * it lives in the hooks (useIssues, etc.) which own fetch logic.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MAP_CONFIG } from '@/config/map'
import { FEED_CONFIG } from '@/config/feed'
import type {
  RadiusKm,
  IssueCategory,
  FeedSort,
  LatLng,
  ReportDraft,
  User,
} from '@/types'

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AppState {
  // Map / radius
  radiusKm: RadiusKm
  setRadiusKm: (r: RadiusKm) => void

  // Category filter (null = all categories)
  activeCategory: IssueCategory | null
  setActiveCategory: (c: IssueCategory | null) => void

  // Feed sort
  feedSort: FeedSort
  setFeedSort: (s: FeedSort) => void

  // User's last known location (cached so map doesn't jump on re-render)
  userLocation: LatLng | null
  setUserLocation: (loc: LatLng | null) => void

  // Heatmap toggle (user preference, persisted)
  heatmapEnabled: boolean
  toggleHeatmap: () => void

  // Auth state
  currentUser: User | null
  setCurrentUser: (user: User | null) => void

  // Report wizard draft (ephemeral — cleared on submit or cancel)
  reportDraft: ReportDraft
  setReportDraftField: <K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) => void
  resetReportDraft: () => void
}

// ─── Initial Values ───────────────────────────────────────────────────────────

const INITIAL_REPORT_DRAFT: ReportDraft = {
  category: null,
  photos: [],
  location: null,
  address: null,
  description: '',
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Map / radius
      radiusKm: MAP_CONFIG.DEFAULT_RADIUS_KM,
      setRadiusKm: (r) => set({ radiusKm: r }),

      // Category filter
      activeCategory: null,
      setActiveCategory: (c) => set({ activeCategory: c }),

      // Feed sort
      feedSort: FEED_CONFIG.DEFAULT_FEED_SORT,
      setFeedSort: (s) => set({ feedSort: s }),

      // User location — NOT persisted (location can change)
      userLocation: null,
      setUserLocation: (loc) => set({ userLocation: loc }),

      // Heatmap toggle
      heatmapEnabled: MAP_CONFIG.HEATMAP_DEFAULT_ON,
      toggleHeatmap: () => set((s) => ({ heatmapEnabled: !s.heatmapEnabled })),

      // Auth
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),

      // Report draft (ephemeral — not persisted across sessions)
      reportDraft: INITIAL_REPORT_DRAFT,
      setReportDraftField: (key, value) =>
        set((s) => ({ reportDraft: { ...s.reportDraft, [key]: value } })),
      resetReportDraft: () => set({ reportDraft: INITIAL_REPORT_DRAFT }),
    }),
    {
      name: 'mmp-app-store',
      // Persist preferences + last known location (so map doesn't flash to default city)
      partialize: (state) => ({
        radiusKm: state.radiusKm,
        feedSort: state.feedSort,
        heatmapEnabled: state.heatmapEnabled,
        activeCategory: state.activeCategory,
        userLocation: state.userLocation,
      }),
    }
  )
)
