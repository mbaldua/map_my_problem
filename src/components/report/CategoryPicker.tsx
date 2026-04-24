'use client'

/**
 * Step 2 of the report wizard — tag the category after seeing the photo.
 *
 * Shows the first photo as a thumbnail so the user tags what they just shot.
 * Large tap targets, advances immediately on selection.
 *
 * See: docs/ui-specs.md — Section 4 (Step 1: Category Picker)
 */

import { useState } from 'react'
import Image from 'next/image'
import { Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import type { IssueCategory } from '@/types'
import type { VerifyImageResult } from '@/app/api/verify-image/route'

const CATEGORIES: {
  value: IssueCategory
  label: string
  emoji: string
  color: string
  description: string
}[] = [
  {
    value: 'water_logging',
    label: 'Water Logging',
    emoji: '💧',
    color: 'border-blue-400 bg-blue-50',
    description: 'Flooding, waterlogged roads, blocked drains',
  },
  {
    value: 'uncleanliness',
    label: 'Uncleanliness',
    emoji: '🗑️',
    color: 'border-amber-400 bg-amber-50',
    description: 'Garbage, overflowing bins, dirty streets',
  },
  {
    value: 'traffic',
    label: 'Traffic',
    emoji: '🚗',
    color: 'border-red-400 bg-red-50',
    description: 'Accidents, signal failures, road damage',
  },
]

interface CategoryPickerProps {
  selectedPhoto: File | null
  verifyResult: VerifyImageResult | null
  onSelect: (category: IssueCategory) => void
}

export function CategoryPicker({ selectedPhoto, verifyResult, onSelect }: CategoryPickerProps) {
  const [selected, setSelected] = useState<IssueCategory | null>(null)
  const photoUrl = selectedPhoto ? URL.createObjectURL(selectedPhoto) : null

  const suggestedCategory = verifyResult?.detected_category as IssueCategory | undefined
  const isValidSuggestion = suggestedCategory &&
    ['water_logging', 'uncleanliness', 'traffic'].includes(suggestedCategory)

  function handleSelect(category: IssueCategory) {
    setSelected(category)
    setTimeout(() => onSelect(category), 150)
  }

  return (
    <div className="flex flex-col px-4 pt-5 gap-4">

      {/* Photo thumbnail — reinforces what they're tagging */}
      {photoUrl && (
        <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-gray-100">
          <Image src={photoUrl} alt="Your photo" fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}

      {/* Gemini suggestion pill */}
      {isValidSuggestion && (
        <div className="flex items-center gap-1.5 text-xs text-brand-primary">
          <Sparkles size={12} />
          <span>
            Looks like <strong>
              {CATEGORIES.find(c => c.value === suggestedCategory)?.label}
            </strong> — tap to confirm
          </span>
        </div>
      )}

      {!isValidSuggestion && (
        <p className="text-xs text-gray-400 -mb-1">What kind of problem is this?</p>
      )}

      <div className="flex flex-col gap-3">
        {CATEGORIES.map(({ value, label, emoji, color, description }) => (
          <button
            key={value}
            onClick={() => handleSelect(value)}
            className={clsx(
              'flex items-center gap-4 rounded-2xl border-2 px-4 py-4 text-left transition-all duration-150 active:scale-[0.98]',
              selected === value
                ? `${color} scale-[0.98]`
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <span className="text-3xl" role="img" aria-label={label}>{emoji}</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
