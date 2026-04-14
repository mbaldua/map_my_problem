/**
 * Nominatim (OpenStreetMap) reverse geocoding helpers.
 *
 * Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/
 * - Do not exceed 1 request/second.
 * - Include a meaningful User-Agent / Referer header.
 * - For production apps with heavy traffic, self-host or use a paid provider.
 */

import type { LatLng } from '@/types'

const BASE_URL =
  process.env.NEXT_PUBLIC_NOMINATIM_BASE_URL ?? 'https://nominatim.openstreetmap.org'

interface NominatimReverseResult {
  place_id: number
  display_name: string
  address: {
    road?: string
    neighbourhood?: string
    suburb?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
    [key: string]: string | undefined
  }
}

/**
 * Reverse geocode a lat/lng pair into a human-readable address string.
 * Returns null if the request fails or Nominatim returns no result.
 */
export async function reverseGeocode(coords: LatLng): Promise<string | null> {
  try {
    const url = new URL(`${BASE_URL}/reverse`)
    url.searchParams.set('lat', coords.lat.toString())
    url.searchParams.set('lon', coords.lng.toString())
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('addressdetails', '1')

    const res = await fetch(url.toString(), {
      headers: {
        // Nominatim policy: identify your app
        'User-Agent': 'MapMyProblems/0.1 (https://mapmyproblems.app)',
        'Accept-Language': 'en',
      },
    })

    if (!res.ok) return null

    const data: NominatimReverseResult = await res.json()

    return buildShortAddress(data)
  } catch {
    // Network error or JSON parse failure — fail silently
    return null
  }
}

/**
 * Build a short, human-friendly address from a Nominatim reverse result.
 * Format: "Near {road}, {suburb/neighbourhood}"
 */
function buildShortAddress(result: NominatimReverseResult): string {
  const { road, neighbourhood, suburb, city } = result.address

  const parts: string[] = []

  if (road) parts.push(road)
  if (neighbourhood || suburb) parts.push((neighbourhood ?? suburb)!)
  else if (city) parts.push(city)

  if (parts.length === 0) return result.display_name

  return `Near ${parts.join(', ')}`
}
