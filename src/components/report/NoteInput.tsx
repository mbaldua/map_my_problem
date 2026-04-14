'use client'

/**
 * Step 4 (optional) — note / description input.
 *
 * Single text area with a 200-character limit.
 * Two CTAs: [Submit Report] and [Skip & Submit].
 *
 * See: docs/ui-specs.md — Section 4 (Step 4: Note)
 */

import { useState } from 'react'
import { REPORT_CONFIG } from '@/config/report'

interface NoteInputProps {
  initialValue?: string
  onSubmit: (description: string) => void
  isSubmitting?: boolean
}

export function NoteInput({ initialValue = '', onSubmit, isSubmitting }: NoteInputProps) {
  const [text, setText] = useState(initialValue)
  const remaining = REPORT_CONFIG.MAX_DESCRIPTION_LENGTH - text.length

  return (
    <div className="flex flex-col h-full px-4 pt-6 gap-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Add details</h2>
        <p className="text-sm text-gray-500 mt-1">Optional — a note helps others understand the issue.</p>
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, REPORT_CONFIG.MAX_DESCRIPTION_LENGTH))}
          placeholder="e.g. Road flooded near signal, no drainage since morning"
          rows={5}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-brand-primary resize-none"
        />
        <span
          className={`absolute bottom-3 right-3 text-xs ${
            remaining <= 20 ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          {text.length} / {REPORT_CONFIG.MAX_DESCRIPTION_LENGTH}
        </span>
      </div>

      <div className="mt-auto flex flex-col gap-3 pb-6">
        <button
          onClick={() => onSubmit(text)}
          disabled={isSubmitting}
          className="w-full rounded-xl bg-brand-primary py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting…' : 'Submit Report'}
        </button>
        <button
          onClick={() => onSubmit('')}
          disabled={isSubmitting}
          className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          Skip &amp; Submit
        </button>
      </div>
    </div>
  )
}
