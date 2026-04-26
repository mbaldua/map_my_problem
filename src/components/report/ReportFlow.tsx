'use client'

/**
 * ReportFlow — multi-step report wizard.
 *
 * Step order (photo-first):
 *   1. Photo    — camera auto-opens; Call A fires in background
 *   2. Category — tag what you shot; Call A result shown here
 *   3. Location — confirm/drag pin; Call B fires in background
 *   4. Note     — pre-filled from Call B; submit
 *
 * See: docs/ux-flow.md — Flow 2
 *      docs/gemini-image-verification.md
 */

import { useState, useRef, useCallback } from 'react'
import { X, ChevronLeft } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useGeolocation } from '@/hooks/useGeolocation'
import { PhotoCapture } from './PhotoCapture'
import { CategoryPicker } from './CategoryPicker'
import { LocationConfirm } from './LocationConfirm'
import { NoteInput } from './NoteInput'
import type { VerifyImageResult } from '@/app/api/verify-image/route'
import type { DescribeImageResult } from '@/app/api/describe-image/route'
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

/** Convert a File to base64 string for the API. */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ReportFlow({ onClose }: ReportFlowProps) {
  const [step, setStep] = useState<Step>('photo')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Gemini Call A result — available by the time user finishes picking category
  const [verifyResult, setVerifyResult] = useState<VerifyImageResult | null>(null)
  // Gemini Call B result — available by the time user finishes location confirm
  const [describeResult, setDescribeResult] = useState<DescribeImageResult | null>(null)
  // Track in-flight calls so we don't fire duplicates
  const verifyInFlight = useRef(false)
  const describeInFlight = useRef(false)

  const reportDraft = useAppStore((s) => s.reportDraft)
  const setField = useAppStore((s) => s.setReportDraftField)
  const resetDraft = useAppStore((s) => s.resetReportDraft)

  const geo = useGeolocation()
  const userLocation: LatLng | null = geo.status === 'success' ? geo.coords : null

  const currentIndex = STEP_ORDER.indexOf(step)

  // ── Call A — fires after photo confirmed ────────────────────────────────────

  const runVerify = useCallback(async (photo: File) => {
    if (verifyInFlight.current) return
    verifyInFlight.current = true
    try {
      const base64 = await fileToBase64(photo)
      const res = await fetch('/api/verify-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      })
      if (res.ok) setVerifyResult(await res.json())
    } catch {
      // fail open — verifyResult stays null
    } finally {
      verifyInFlight.current = false
    }
  }, [])

  // ── Call B — fires after category selected ──────────────────────────────────

  const runDescribe = useCallback(async (photo: File, category: IssueCategory) => {
    if (describeInFlight.current) return
    describeInFlight.current = true
    try {
      const base64 = await fileToBase64(photo)
      const res = await fetch('/api/describe-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, category }),
      })
      if (res.ok) setDescribeResult(await res.json())
    } catch {
      // fail open — describeResult stays null
    } finally {
      describeInFlight.current = false
    }
  }, [])

  // ── Step navigation ─────────────────────────────────────────────────────────

  function handlePhotosConfirmed(photos: File[]) {
    setField('photos', photos)
    // Fire Call A immediately — runs while user is on category screen
    if (photos[0]) runVerify(photos[0])
    setStep('category')
  }

  function handleCategorySelect(category: IssueCategory) {
    setField('category', category)
    // Fire Call B immediately — runs while user is on location screen
    if (reportDraft.photos[0]) runDescribe(reportDraft.photos[0], category)
    setStep('location')
  }

  function handleLocationConfirmed(location: LatLng, address: string | null) {
    setField('location', location)
    setField('address', address)
    setStep('note')
  }

  function goBack() {
    if (currentIndex > 0) setStep(STEP_ORDER[currentIndex - 1])
    else onClose()
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  // Submits via server-side Route Handler (no client auth required for now).
  // Auth will be enforced in /api/submit-issue in a later milestone.

  async function handleSubmit(description: string) {
    if (!reportDraft.category || !reportDraft.location) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const formData = new FormData()
      formData.append('category', reportDraft.category)
      formData.append('lat', String(reportDraft.location.lat))
      formData.append('lng', String(reportDraft.location.lng))
      if (reportDraft.address) formData.append('address', reportDraft.address)
      if (description) formData.append('description', description)
      reportDraft.photos.forEach((photo) => formData.append('photos', photo))

      const res = await fetch('/api/submit-issue', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error ?? 'Submission failed')

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
            onNext={handlePhotosConfirmed}
          />
        )}

        {step === 'category' && (
          <CategoryPicker
            selectedPhoto={reportDraft.photos[0] ?? null}
            verifyResult={verifyResult}
            onSelect={handleCategorySelect}
          />
        )}

        {step === 'location' && (
          <LocationConfirm
            initialLocation={userLocation}
            onConfirm={handleLocationConfirmed}
          />
        )}

        {step === 'note' && (
          <NoteInput
            initialValue={describeResult?.description ?? ''}
            suggestedQuestions={describeResult?.suggested_questions ?? []}
            hasSensitiveContent={describeResult?.has_sensitive_content ?? false}
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
