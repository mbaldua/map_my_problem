'use client'

/**
 * MapView — full-screen Leaflet map wrapper.
 *
 * Leaflet requires browser APIs (window, document) so this component is
 * loaded via next/dynamic with ssr: false from parent pages.
 *
 * See: docs/ui-specs.md — Section 2 (Home Screen — Map View)
 */

import { useEffect, useRef, useState } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import { useAppStore } from '@/store/appStore'
import { MAP_CONFIG } from '@/config/map'
import { IssuePin } from './IssuePin'
import { HeatmapLayer } from './HeatmapLayer'
import type { IssueWithMeta, LatLng } from '@/types'

// Leaflet CSS must be imported at the component level (bundler handles it)
import 'leaflet/dist/leaflet.css'

interface MapViewProps {
  issues: IssueWithMeta[]
  userLocation: LatLng | null
  onPinClick?: (issue: IssueWithMeta) => void
}

export default function MapView({ issues, userLocation, onPinClick }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<LeafletMap | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  const heatmapEnabled = useAppStore((s) => s.heatmapEnabled)

  // Guard against StrictMode double-invocation: track whether init has started
  const isInitializingRef = useRef(false)

  // Initialise Leaflet map on mount
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current || isInitializingRef.current) return
    isInitializingRef.current = true

    // Leaflet is imported dynamically to avoid SSR issues
    import('leaflet').then((L) => {
      // Cleanup may have fired while import was in-flight
      if (!mapRef.current || leafletMapRef.current) return

      const center = userLocation ?? MAP_CONFIG.DEFAULT_CENTER

      const map = L.map(mapRef.current, {
        center: [center.lat, center.lng],
        zoom: MAP_CONFIG.DEFAULT_ZOOM,
        minZoom: MAP_CONFIG.MIN_ZOOM,
        maxZoom: MAP_CONFIG.MAX_ZOOM,
        zoomControl: false, // Custom positioning
      })

      L.tileLayer(MAP_CONFIG.TILE_URL, {
        attribution: MAP_CONFIG.TILE_ATTRIBUTION,
      }).addTo(map)

      // Reposition zoom controls to top-right
      L.control.zoom({ position: 'topright' }).addTo(map)

      leafletMapRef.current = map
      isInitializingRef.current = false
      setIsMapReady(true)
    })

    return () => {
      isInitializingRef.current = false
      leafletMapRef.current?.remove()
      leafletMapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pan to user location when it becomes available
  useEffect(() => {
    if (leafletMapRef.current && userLocation) {
      leafletMapRef.current.setView(
        [userLocation.lat, userLocation.lng],
        MAP_CONFIG.DEFAULT_ZOOM,
        { animate: true }
      )
    }
  }, [userLocation])

  return (
    <div className="relative w-full h-full">
      {/* Leaflet mount point */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Heatmap layer — rendered as a Leaflet layer (handled inside component) */}
      {isMapReady && leafletMapRef.current && (
        <HeatmapLayer
          map={leafletMapRef.current}
          issues={issues}
          enabled={heatmapEnabled}
        />
      )}

      {/* Issue pins */}
      {isMapReady && leafletMapRef.current &&
        issues.map((issue) => (
          <IssuePin
            key={issue.id}
            map={leafletMapRef.current!}
            issue={issue}
            onClick={() => onPinClick?.(issue)}
          />
        ))
      }

      {/* Heatmap toggle — accessible via filter panel (not inline on map) */}
    </div>
  )
}
