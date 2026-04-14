/**
 * Map configuration for Map My Problems.
 *
 * Open Decision #2: Duplicate Issue Clustering
 * See: docs/open-decisions.md → Section 2
 */

import type { LatLng, RadiusKm } from '@/types'

export const MAP_CONFIG = {
  /**
   * Default center coordinates for the map when geolocation is unavailable.
   * Falls back to Mumbai, India.
   */
  DEFAULT_CENTER: { lat: 19.076, lng: 72.8777 } satisfies LatLng,

  /**
   * Default map zoom level (Leaflet zoom scale 1–18).
   * 14 ≈ neighbourhood level.
   */
  DEFAULT_ZOOM: 14,

  /**
   * Minimum and maximum zoom levels allowed on the map.
   */
  MIN_ZOOM: 10,
  MAX_ZOOM: 19,

  /**
   * Available radius options shown as selectable pills.
   * Drives the `RadiusPill` component and all geo-filtered queries.
   */
  RADIUS_OPTIONS: [1, 3, 5, 10] as RadiusKm[],

  /**
   * The radius (km) selected by default on first load.
   * See docs: "Default to 5 km radius, allow zoom out"
   */
  DEFAULT_RADIUS_KM: 5 as RadiusKm,

  /**
   * When true, multiple pins at the same location are merged into a
   * cluster badge showing the count. Tapping a cluster zooms in.
   *
   * When false, each issue has its own individual pin (default).
   *
   * Default: false
   * Open Decision: docs/open-decisions.md #2
   */
  CLUSTER_DUPLICATE_ISSUES: false,

  /**
   * Zoom threshold below which pins switch to cluster badges.
   * Only relevant when CLUSTER_DUPLICATE_ISSUES = true.
   */
  CLUSTER_ZOOM_THRESHOLD: 14,

  /**
   * Heatmap overlay is off by default. User enables it via the
   * [Heatmap] toggle button on the map.
   */
  HEATMAP_DEFAULT_ON: false,

  /**
   * Zoom level at which the heatmap begins to fade out (pins take over).
   */
  HEATMAP_FADE_ZOOM: 15,

  /**
   * Colors used for the heatmap gradient per category.
   */
  HEATMAP_COLORS: {
    water_logging: '#2196F3',
    uncleanliness: '#FF9800',
    traffic:       '#F44336',
  },

  /**
   * Pin colors per category — used for Leaflet DivIcon markers.
   */
  PIN_COLORS: {
    water_logging: '#2196F3',
    uncleanliness: '#FF9800',
    traffic:       '#F44336',
    resolved:      '#9E9E9E',
  },

  /**
   * Tile layer URL for OpenStreetMap.
   * Attribution is required by OSM license.
   */
  // CartoDB Positron — light, minimal, no visual noise. Far cleaner than OSM default.
  TILE_URL: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  TILE_ATTRIBUTION:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
} as const

export type MapConfig = typeof MAP_CONFIG
