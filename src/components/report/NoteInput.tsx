'use client'

/**
 * Step 4 (optional) — note / description input.
 *
 * Description is pre-filled by Gemini (Call B) if available.
 * Suggested questions appear as tappable chips — tap to append to note.
 * Sensitive content warning shown if Gemini flagged faces/plates.
 *
 * See: docs/ui-specs.md — Section 4 (Step 4: Note)
 *      docs/gemini-image-verification.md
 */

import { useState } from 'react'
import { Sparkles, AlertTriangle } from 'lucide-react'
import { REPORT_CONFIG } from '@/config/report'

interface NoteInputProps {
  initialValue?: string
  suggestedQuestions?: string[]
  hasSensitiveContent?: boolean
  onSubmit: (description: string) => void
  isSubmitting?: boolean
}

export function NoteInput({
  initialValue = '',
  suggestedQuestions = [],
  hasSensitiveContent = false,
  onSubmit,
  isSubmitting,
}: NoteInputProps) {
  const [text, setText] = useState(initialValue)
  const isAiGenerated = initialValue.length > 0
  const remaining = REPORT_CONFIG.MAX_DESCRIPTION_LENGTH - text.length

  function appendQuestion(q: string) {
    const separator = text.trim() ? '\n' : ''
    setText((prev) =>
      (prev + separator + q + ' ').slice(0, REPORT_CONFIG.MAX_DESCRIPTION_LENGTH)
    )
  }

  return (
    <div className="flex flex-col h-full px-4 pt-5 gap-4">

      {/* Sensitive content warning */}
      {hasSensitiveContent && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
          <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            Your photo may contain visible faces or licence plates. Make sure you&apos;re comfortable sharing it publicly.
          </p>
        </div>
      )}

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, REPORT_CONFIG.MAX_DESCRIPTION_LENGTH))}
          placeholder="Describe the issue…"
          rows={5}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-brand-primary resize-none"
        />

        {/* AI badge — shown when description was auto-generated */}
        {isAiGenerated && text === initialValue && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-brand-primary/10 px-2 py-0.5">
            <Sparkles size={10} className="text-brand-primary" />
            <span className="text-[10px] font-medium text-brand-primary">AI draft</span>
          </div>
        )}

        <span className={`absolute bottom-2.5 right-3 text-xs ${remaining <= 20 ? 'text-red-500' : 'text-gray-400'}`}>
          {text.length} / {REPORT_CONFIG.MAX_DESCRIPTION_LENGTH}
        </span>
      </div>

      {/* Suggested questions as tappable chips */}
      {suggestedQuestions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-gray-400">Tap to add context:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => appendQuestion(q)}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600 hover:border-brand-primary hover:text-brand-primary transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="mt-auto flex flex-col gap-3 pb-6">
        <button
          onClick={() => onSubmit(text)}
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-brand-primary py-3.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting…' : 'Submit Report'}
        </button>
        <button
          onClick={() => onSubmit('')}
          disabled={isSubmitting}
          className="w-full rounded-2xl border border-gray-200 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
        >
          Skip &amp; Submit
        </button>
      </div>
    </div>
  )
}
