'use client'

import { useAppStore } from '@/store/appStore'
import { MAP_CONFIG } from '@/config/map'
import type { RadiusKm } from '@/types'

/**
 * Convenience hook that exposes the selected radius and a setter.
 * Reads from and writes to the global Zustand store so any component
 * that consumes this hook stays in sync.
 *
 * Usage:
 * ```ts
 * const { radius, setRadius } = useRadius()
 * ```
 */
export function useRadius(): { radius: RadiusKm; setRadius: (r: RadiusKm) => void } {
  const radius = useAppStore((s) => s.radiusKm)
  const setRadius = useAppStore((s) => s.setRadiusKm)

  return { radius, setRadius }
}

/** Returns the list of available radius options (from map config). */
export function useRadiusOptions(): RadiusKm[] {
  return MAP_CONFIG.RADIUS_OPTIONS
}
