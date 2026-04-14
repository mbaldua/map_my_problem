'use client'

/**
 * IssuePin — renders a single colour-coded marker on the Leaflet map.
 *
 * Uses Leaflet DivIcon so we can style pins with Tailwind/CSS rather than
 * relying on default Leaflet marker images.
 *
 * Pin colours are defined in MAP_CONFIG.PIN_COLORS (one per category + resolved state).
 * See: docs/ui-specs.md — Map View Pin Behaviour
 */

import { useEffect, useRef } from 'react'
import type { Map as LeafletMap, Marker } from 'leaflet'
import { MAP_CONFIG } from '@/config/map'
import type { IssueWithMeta } from '@/types'

interface IssuePinProps {
  map: LeafletMap
  issue: IssueWithMeta
  onClick?: () => void
}

export function IssuePin({ map, issue, onClick }: IssuePinProps) {
  const markerRef = useRef<Marker | null>(null)

  useEffect(() => {
    // Leaflet is only available in the browser (this component is inside a
    // dynamic import with ssr:false parent, so this is safe)
    import('leaflet').then((L) => {
      const color =
        issue.status === 'resolved'
          ? MAP_CONFIG.PIN_COLORS.resolved
          : MAP_CONFIG.PIN_COLORS[issue.category]

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            width: 28px; height: 28px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -30],
      })

      const marker = L.marker([issue.lat, issue.lng], { icon }).addTo(map)

      if (onClick) {
        marker.on('click', onClick)
      }

      markerRef.current = marker
    })

    return () => {
      markerRef.current?.remove()
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, issue.id, issue.lat, issue.lng, issue.category, issue.status])

  // This component controls a Leaflet marker imperatively — no JSX output
  return null
}
