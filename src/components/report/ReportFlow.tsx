'use client'

/**
 * ReportFlow — multi-step report wizard.
 *
 * New step order (photo-first):
 *   1. Photo  — camera opens, snap the problem
 *   2. Category — tag what you just photographed
 *   3. Location — confirm / drag pin
 *   4. Note (optional) — add context, then submit
 *
 * See: docs/ux-flow.md — Flow 2
 */

import { useState } from 'react'
import { X, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/appStore'
import { useGeolocation } from '@/hooks/useGeolocation'
import { PhotoCapture } from './PhotoCapture'
import { CategoryPicker } from './CategoryPicker'
import { LocationConfirm } from './LocationConfirm'
import { NoteInput } from './NoteInput'
import { REPORT_CONFIG } from '@/config/report'
import type { IssueCategory, LatLng } from '@/types'

type Step = 'photo' | 'category' | 'location' | 'note' | 'success'
const STEP_ORDER: Step[] = ['photo', 'category', 'location', 'note']

const STEP_LABELS: Record<Step, string> = {
  photo:    'Add a photo',
  category: "What's the issue?",
  location: 'Confirm location',
  note:     'Add details',
  success:  '',
}

interface ReportFlowProps {
  onClose: () => void
}

export function ReportFlow({ onClose }: ReportFlowProps) {
  const [step, setStep] = useState<Step>('photo')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const reportDraft = useAppStore((s) => s.reportDraft)
  const setField = useAppStore((s) => s.setReportDraftField)
  const resetDraft = useAppStore((s) => s.resetReportDraft)
  const currentUser = useAppStore((s) => s.currentUser)

  const geo = useGeolocation()
  const userLocation: LatLng | null = geo.status === 'success' ? geo.coords : null

  const currentIndex = STEP_ORDER.indexOf(step)

  function goBack() {
    if (currentIndex > 0) setStep(STEP_ORDER[currentIndex - 1])
    else onClose()
  }

  async function handleSubmit(description: string) {
    if (!reportDraft.category || !reportDraft.location) return

    if (!currentUser) {
      alert('Please sign in with your phone number to submit a report.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const supabase = createClient()
      const imageUrls: string[] = []

      for (const photo of reportDraft.photos) {
        const ext = photo.name.split('.').pop() ?? 'jpg'
        const path = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from(REPORT_CONFIG.STORAGE_BUCKET)
          .upload(path, photo, { contentType: photo.type })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from(REPORT_CONFIG.STORAGE_BUCKET)
          .getPublicUrl(path)

        imageUrls.push(publicUrl)
      }

      const { error: insertError } = await supabase.from('issues').insert({
        user_id: currentUser.id,
        category: reportDraft.category,
        lat: reportDraft.location.lat,
        lng: reportDraft.location.lng,
        address: reportDraft.address,
        image_urls: imageUrls,
        description: description || null,
        upvotes: 0,
        status: 'open',
      })

      if (insertError) throw insertError

      resetDraft()
      setStep('success')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit report')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-5 bg-white">
        <div className="text-6xl">✅</div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Report submitted!</h2>
          <p className="text-sm text-gray-500 mt-1">Others in your area can now see it.</p>
        </div>
        <button
          onClick={() => { resetDraft(); onClose() }}
          className="rounded-2xl bg-brand-primary px-8 py-3 text-sm font-semibold text-white"
        >
          View on Map
        </button>
      </div>
    )
  }

  // ── Main shell ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-white">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <button
          onClick={goBack}
          className="p-1.5 -ml-1 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          {currentIndex === 0 ? <X size={20} /> : <ChevronLeft size={20} />}
        </button>

        <span className="flex-1 text-sm font-semibold text-gray-800">
          {STEP_LABELS[step]}
        </span>

        {/* Progress dots */}
        <div className="flex gap-1.5" aria-label={`Step ${currentIndex + 1} of ${STEP_ORDER.length}`}>
          {STEP_ORDER.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < currentIndex
                  ? 'w-3 bg-brand-primary'
                  : i === currentIndex
                  ? 'w-4 bg-brand-primary'
                  : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        {step === 'photo' && (
          <PhotoCapture
            photos={reportDraft.photos}
            onPhotosChange={(photos) => setField('photos', photos)}
            onNext={() => setStep('category')}
          />
        )}
        {step === 'category' && (
          <CategoryPicker
            selectedPhoto={reportDraft.photos[0] ?? null}
            onSelect={(cat: IssueCategory) => {
              setField('category', cat)
              setStep('location')
            }}
          />
        )}
        {step === 'location' && (
          <LocationConfirm
            initialLocation={userLocation}
            onConfirm={(loc, addr) => {
              setField('location', loc)
              setField('address', addr)
              setStep('note')
            }}
          />
        )}
        {step === 'note' && (
          <NoteInput
            initialValue={reportDraft.description}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      {/* Error banner */}
      {submitError && (
        <div className="px-4 py-2.5 bg-red-50 border-t border-red-100 text-sm text-red-600">
          {submitError}
        </div>
      )}
    </div>
  )
}
