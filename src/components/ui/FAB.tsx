'use client'

import { Camera } from 'lucide-react'

interface FABProps {
  onClick: () => void
  label?: string
}

/**
 * Floating Action Button — "Report an Issue".
 * Fixed bottom-right, always above the Area Pulse sheet.
 */
export function FAB({ onClick, label = 'Report' }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-24 right-5 z-[950] flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3.5 text-white shadow-fab active:scale-95 transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
    >
      <Camera size={18} strokeWidth={2.5} />
      <span className="text-sm font-bold tracking-wide">{label}</span>
    </button>
  )
}
