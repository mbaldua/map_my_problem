'use client'

import { clsx } from 'clsx'
import { useRadius, useRadiusOptions } from '@/hooks/useRadius'
import type { RadiusKm } from '@/types'

interface RadiusPillProps {
  onChange?: (radius: RadiusKm) => void
}

export function RadiusPill({ onChange }: RadiusPillProps) {
  const { radius, setRadius } = useRadius()
  const options = useRadiusOptions()

  function handleSelect(r: RadiusKm) {
    setRadius(r)
    onChange?.(r)
  }

  return (
    <div
      role="group"
      aria-label="Select radius"
      className="flex gap-1.5 overflow-x-auto scrollbar-none"
    >
      {options.map((r) => {
        const isActive = r === radius
        return (
          <button
            key={r}
            onClick={() => handleSelect(r)}
            aria-pressed={isActive}
            className={clsx(
              'shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150',
              isActive
                ? 'bg-brand-primary text-white shadow-sm'
                : 'bg-white/90 backdrop-blur-sm text-gray-600 border border-white/60 shadow-sm hover:bg-white'
            )}
          >
            {r} km
          </button>
        )
      })}
    </div>
  )
}
