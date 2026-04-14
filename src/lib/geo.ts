/**
 * Geolocation helpers and distance calculations.
 * All distance math uses the Haversine formula (great-circle distance).
 */

import type { LatLng, GeolocationResult } from '@/types'

const EARTH_RADIUS_KM = 6371

/** Convert degrees to radians. */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Calculate the great-circle distance between two coordinates using Haversine.
 * Returns the distance in kilometres.
 */
export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

/**
 * Returns true if point `b` is within `radiusKm` of point `a`.
 */
export function isWithinRadius(a: LatLng, b: LatLng, radiusKm: number): boolean {
  return haversineDistanceKm(a, b) <= radiusKm
}

/**
 * Format a distance in km for display.
 * Returns "350 m" for sub-kilometre distances, "1.4 km" otherwise.
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`
  }
  return `${km.toFixed(1)} km`
}

/**
 * Get the user's current location via the browser Geolocation API.
 * Returns a promise that resolves with coords or rejects with a GeolocationPositionError.
 */
export function getCurrentLocation(options?: PositionOptions): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          accuracy: position.coords.accuracy,
        })
      },
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 30_000,
        ...options,
      }
    )
  })
}

/**
 * Returns an approximate bounding box (SW and NE corners) around a center
 * point for a given radius in km. Useful for quick DB pre-filtering before
 * applying exact Haversine distance.
 */
export function getBoundingBox(
  center: LatLng,
  radiusKm: number
): { sw: LatLng; ne: LatLng } {
  const latDelta = radiusKm / EARTH_RADIUS_KM * (180 / Math.PI)
  const lngDelta = latDelta / Math.cos(toRad(center.lat))

  return {
    sw: { lat: center.lat - latDelta, lng: center.lng - lngDelta },
    ne: { lat: center.lat + latDelta, lng: center.lng + lngDelta },
  }
}
