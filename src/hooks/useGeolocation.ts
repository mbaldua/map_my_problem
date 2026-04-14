'use client'

import { useState, useEffect } from 'react'
import { getCurrentLocation } from '@/lib/geo'
import type { LatLng } from '@/types'

type GeolocationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; coords: LatLng; accuracy: number }
  | { status: 'error'; error: GeolocationPositionError | Error }

/**
 * Hook that requests the user's current position using the browser
 * Geolocation API. Returns current state and a `retry` function.
 *
 * Usage:
 * ```ts
 * const { status, coords } = useGeolocation()
 * if (status === 'success') // use coords.lat / coords.lng
 * ```
 */
export function useGeolocation(autoRequest = true): GeolocationState & { retry: () => void } {
  const [state, setState] = useState<GeolocationState>({ status: 'idle' })

  const request = () => {
    setState({ status: 'loading' })

    getCurrentLocation()
      .then(({ coords, accuracy }) => {
        setState({ status: 'success', coords, accuracy })
      })
      .catch((error: GeolocationPositionError | Error) => {
        setState({ status: 'error', error })
      })
  }

  useEffect(() => {
    if (autoRequest) request()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { ...state, retry: request }
}
