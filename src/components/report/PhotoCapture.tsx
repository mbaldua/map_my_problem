'use client'

/**
 * Step 1 of the report wizard — photo first.
 *
 * Camera input auto-triggers on mount (mobile) so the user goes straight
 * from tapping "Report" to the camera viewfinder — zero extra taps.
 * Gallery upload is a secondary option shown below.
 *
 * See: docs/ui-specs.md — Section 4 (Step 2: Photo Capture)
 */

import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, X, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { REPORT_CONFIG } from '@/config/report'

interface PhotoCaptureProps {
  photos: File[]
  onPhotosChange: (photos: File[]) => void
  onNext: () => void
}

export function PhotoCapture({ photos, onPhotosChange, onNext }: PhotoCaptureProps) {
  const [previews, setPreviews] = useState<string[]>(
    photos.map((f) => URL.createObjectURL(f))
  )
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // Auto-open camera on first mount (only if no photos yet)
  useEffect(() => {
    if (photos.length === 0) {
      // Small delay to let the modal finish animating in
      const t = setTimeout(() => cameraInputRef.current?.click(), 300)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFiles(files: FileList | null) {
    if (!files) return
    const remaining = REPORT_CONFIG.MAX_PHOTOS - photos.length
    const newFiles = Array.from(files).slice(0, remaining).filter((f) => {
      if (f.size > REPORT_CONFIG.MAX_PHOTO_SIZE_BYTES) {
        alert(`"${f.name}" is too large. Max size is 10 MB.`)
        return false
      }
      return true
    })
    if (!newFiles.length) return
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f))
    setPreviews((prev) => [...prev, ...newPreviews])
    onPhotosChange([...photos, ...newFiles])
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(previews[index])
    setPreviews(previews.filter((_, i) => i !== index))
    onPhotosChange(photos.filter((_, i) => i !== index))
  }

  const canAddMore = photos.length < REPORT_CONFIG.MAX_PHOTOS
  const canContinue = REPORT_CONFIG.REQUIRE_PHOTO
    ? photos.length >= REPORT_CONFIG.MIN_PHOTOS
    : true

  // Hidden file inputs
  const fileInputs = (
    <>
      <input
        ref={cameraInputRef}
        type="file"
        accept={REPORT_CONFIG.ACCEPTED_IMAGE_TYPES.join(',')}
        capture="environment"
        className="sr-only"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept={REPORT_CONFIG.ACCEPTED_IMAGE_TYPES.join(',')}
        multiple
        className="sr-only"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }}
      />
    </>
  )

  // ── Empty state — large camera tap target ────────────────────────────────────

  if (photos.length === 0) {
    return (
      <div className="flex flex-col h-full">
        {fileInputs}

        {/* Big camera tap target */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <div className="w-20 h-20 rounded-full bg-brand-primary/10 flex items-center justify-center">
            <Camera size={36} className="text-brand-primary" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-gray-800">Tap to take a photo</p>
            <p className="text-sm text-gray-400 mt-0.5">Point at the problem</p>
          </div>
        </button>

        {/* Gallery option */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <ImagePlus size={17} />
            Choose from gallery
          </button>
        </div>
      </div>
    )
  }

  // ── Has photos — grid + add more ────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full px-4 pt-5 gap-4">
      {fileInputs}

      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-2">
        {previews.map((src, i) => (
          <div key={src} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
            <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" unoptimized />
            <button
              onClick={() => removePhoto(i)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white"
              aria-label="Remove photo"
            >
              <X size={13} />
            </button>
          </div>
        ))}

        {/* Add more tile */}
        {canAddMore && (
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:border-brand-primary transition-colors"
          >
            <Camera size={22} className="text-gray-400" />
            <span className="text-xs text-gray-400">Add</span>
          </button>
        )}
      </div>

      {/* Gallery link */}
      {canAddMore && (
        <button
          onClick={() => galleryInputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-primary transition-colors"
        >
          <ImagePlus size={14} />
          Choose from gallery
        </button>
      )}

      {/* Continue */}
      <button
        onClick={onNext}
        disabled={!canContinue}
        className="mt-auto mb-6 flex items-center justify-center gap-2 rounded-2xl bg-brand-primary py-3.5 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Looks good — continue
        <ArrowRight size={16} />
      </button>
    </div>
  )
}
