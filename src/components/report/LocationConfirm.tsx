'use client'

/**
 * Step 3 of the report wizard — location confirmation.
 *
 * Shows a mini Leaflet map with a draggable pin.
 * Pre-fills the user's current location; they can drag to adjust street accuracy.
 * Reverse geocodes the final pin position via Nominatim.
 *
 * See: docs/ui-specs.md — Section 4 (Step 3: Location Confirm)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, ArrowRight } from 'lucide-react'
import { reverseGeocode } from '@/lib/geocoding'
import type { LatLng } from '@/types'

// Leaflet CSS
import 'leaflet/dist/leaflet.css'

interface LocationConfirmProps {
  initialLocation: LatLng | null
  onConfirm: (location: LatLng, address: string | null) => void
}

export function LocationConfirm({ initialLocation, onConfirm }: LocationConfirmProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null)
  const isInitializingRef = useRef(false)

  const [location, setLocation] = useState<LatLng | null>(initialLocation)
  const [address, setAddress] = useState<string | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)

  const geocode = useCallback(async (coords: LatLng) => {
    setIsGeocoding(true)
    const addr = await reverseGeocode(coords)
    setAddress(addr)
    setIsGeocoding(false)
  }, [])

  // Initialise mini-map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || isInitializingRef.current) return
    isInitializingRef.current = true

    const center = initialLocation ?? { lat: 19.076, lng: 72.8777 }

    import('leaflet').then((L) => {
      if (!mapContainerRef.current || mapRef.current) return

      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: 17,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      }).addTo(map)

      // Draggable pin
      const marker = L.marker([center.lat, center.lng], { draggable: true }).addTo(map)

      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng()
        const newCoords = { lat, lng }
        setLocation(newCoords)
        geocode(newCoords)
      })

      mapRef.current = map
      markerRef.current = marker
      isInitializingRef.current = false

      if (initialLocation) {
        geocode(initialLocation)
      }
    })

    return () => {
      isInitializingRef.current = false
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-6 pb-3">
        <h2 className="text-xl font-semibold text-gray-800">Confirm location</h2>
        <p className="text-sm text-gray-500 mt-1">Drag the pin to adjust if needed.</p>
      </div>

      {/* Mini map */}
      <div ref={mapContainerRef} className="flex-1 min-h-[280px]" />

      {/* Address strip */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-start gap-2">
        <MapPin size={18} className="text-brand-primary mt-0.5 shrink-0" />
        <p className="text-sm text-gray-700">
          {isGeocoding ? (
            <span className="animate-pulse text-gray-400">Locating…</span>
          ) : address ? (
            address
          ) : (
            <span className="text-gray-400">Location not resolved</span>
          )}
        </p>
      </div>

      {/* Confirm button */}
      <div className="px-4 pb-6">
        <button
          onClick={() => location && onConfirm(location, address)}
          disabled={!location}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-primary py-3 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Confirm &amp; Continue
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
