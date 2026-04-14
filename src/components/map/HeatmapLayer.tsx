'use client'

/**
 * HeatmapLayer — adds / removes a Leaflet.heat overlay on the map.
 *
 * leaflet.heat is a legacy UMD plugin that patches the global window.L.
 * We load it via a <script> tag to guarantee it runs after window.L is set,
 * avoiding Turbopack's module-evaluation-at-bundle-time issue with dynamic imports.
 *
 * See: docs/ui-specs.md — Map Heatmap Overlay
 */

import { useEffect, useRef, useState } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import { MAP_CONFIG } from '@/config/map'
import { useAppStore } from '@/store/appStore'
import type { IssueWithMeta } from '@/types'

interface HeatmapLayerProps {
  map: LeafletMap
  issues: IssueWithMeta[]
  enabled: boolean
}

/** Load leaflet.heat via script tag (only once) and resolve when ready. */
function loadLeafletHeat(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as Record<string, unknown>).L && (window as Record<string, unknown> & { L: Record<string, unknown> }).L.heatLayer) {
      resolve()
      return
    }
    const existing = document.getElementById('leaflet-heat-script')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      return
    }
    const script = document.createElement('script')
    script.id = 'leaflet-heat-script'
    script.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js'
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

export function HeatmapLayer({ map, issues, enabled }: HeatmapLayerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatLayerRef = useRef<any>(null)
  const activeCategory = useAppStore((s) => s.activeCategory)
  const [pluginReady, setPluginReady] = useState(false)

  // Load the plugin once on mount
  useEffect(() => {
    import('leaflet').then((L) => {
      // Expose L globally so leaflet.heat can patch it
      ;(window as Record<string, unknown>).L = L
      loadLeafletHeat().then(() => setPluginReady(true))
    })
  }, [])

  useEffect(() => {
    if (!pluginReady) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L

    // Remove existing layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    if (!enabled || !issues.length) return

    const maxUpvotes = Math.max(...issues.map((i) => i.upvotes), 1)
    const filteredIssues = activeCategory
      ? issues.filter((i) => i.category === activeCategory)
      : issues

    const points = filteredIssues.map((i) => [
      i.lat,
      i.lng,
      Math.min(1, (i.upvotes + 1) / (maxUpvotes + 1)),
    ] as [number, number, number])

    const gradient = activeCategory
      ? { 0.4: 'white', 1.0: MAP_CONFIG.HEATMAP_COLORS[activeCategory] }
      : { 0.4: 'white', 0.65: '#FF9800', 1.0: '#F44336' }

    heatLayerRef.current = L.heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: MAP_CONFIG.HEATMAP_FADE_ZOOM,
      gradient,
    }).addTo(map)

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current)
        heatLayerRef.current = null
      }
    }
  }, [pluginReady, map, issues, enabled, activeCategory])

  return null
}
