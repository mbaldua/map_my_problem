'use client'

/**
 * GalleryCarousel — horizontal swipe carousel of issue cards.
 *
 * Full-width cards that the user flicks through left to right.
 * Each card is dominated by the issue photo with minimal text overlay.
 *
 * See: docs/ui-specs.md — Section 3 (Gallery — Horizontal Swipe Carousel)
 *      docs/ux-flow.md  — Flow 4 (Category Gallery)
 *
 * Props:
 *   issues       — the filtered, sorted issue list to display
 *   onViewIssue  — navigate to issue detail
 *   onVote       — upvote handler (optimistic)
 *   emptyAction  — CTA shown when no issues in radius (e.g. "Report Now")
 *   stickyFooter — extra button at the bottom of each card
 *                  (used in report flow: "None of these? Report New →")
 */

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Clock, ArrowRight } from 'lucide-react'
import { CategoryTag } from '@/components/ui/CategoryTag'
import { useVote } from '@/hooks/useVote'
import type { IssueWithMeta } from '@/types'

interface GalleryCarouselProps {
  issues: IssueWithMeta[]
  isLoading?: boolean
  stickyFooterLabel?: string
  onStickyFooterClick?: () => void
}

export function GalleryCarousel({
  issues,
  isLoading,
  stickyFooterLabel,
  onStickyFooterClick,
}: GalleryCarouselProps) {
  const [index, setIndex] = useState(0)

  // Touch / drag state for swipe detection
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.touches[0].clientX)
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX === null) return
    const delta = touchStartX - e.changedTouches[0].clientX
    if (Math.abs(delta) > 50) {
      if (delta > 0) goNext()
      else goPrev()
    }
    setTouchStartX(null)
  }

  function goNext() {
    setIndex((i) => Math.min(i + 1, issues.length - 1))
  }

  function goPrev() {
    setIndex((i) => Math.max(i - 1, 0))
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-4">
        <div className="aspect-[3/4] w-full rounded-2xl bg-gray-200 animate-pulse" />
        <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
        <div className="h-4 w-full rounded bg-gray-100 animate-pulse" />
      </div>
    )
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <span className="text-5xl">📍</span>
        <p className="text-gray-600 font-medium">No reports near you yet.</p>
        <p className="text-sm text-gray-400">Be the first to document an issue in your area.</p>
        {onStickyFooterClick && (
          <button
            onClick={onStickyFooterClick}
            className="flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white"
          >
            Report Now
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    )
  }

  const issue = issues[index]

  return (
    <div className="flex flex-col h-full">
      {/* Card */}
      <div
        className="flex-1 relative mx-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="rounded-2xl overflow-hidden shadow-card h-full flex flex-col bg-white">
          {/* Photo — 70% of card height */}
          <div className="relative" style={{ flex: '7' }}>
            {issue.image_urls[0] ? (
              <Link href={`/issue/${issue.id}`} className="block relative h-full">
                <Image
                  src={issue.image_urls[0]}
                  alt=""
                  fill
                  className="object-cover"
                  priority
                />
              </Link>
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-6xl">
                {issue.category === 'water_logging' ? '💧' : issue.category === 'uncleanliness' ? '🗑️' : '🚗'}
              </div>
            )}
          </div>

          {/* Info — remaining 30% */}
          <div className="flex-[3] flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <CategoryTag category={issue.category} size="sm" />
              <span className="text-xs text-gray-400 flex items-center gap-0.5">
                <MapPin size={11} />
                {issue.address ?? 'Unknown location'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-0.5">
                <Clock size={11} />
                {formatRelativeTime(issue.created_at)}
              </span>
              {issue.local_upvotes != null && (
                <span>🏠 {issue.local_upvotes} locals</span>
              )}
              <span>▲ {issue.upvotes}</span>
            </div>

            {issue.description && (
              <p className="text-sm text-gray-700 line-clamp-2">{issue.description}</p>
            )}

            <div className="flex gap-2 mt-auto">
              <Link
                href={`/issue/${issue.id}`}
                className="flex-1 rounded-lg border border-gray-200 py-2 text-xs font-medium text-center text-gray-600 hover:bg-gray-50"
              >
                View Discussion
              </Link>
              <VoteButton issue={issue} />
            </div>
          </div>
        </div>
      </div>

      {/* Dot indicator */}
      <div className="flex justify-center gap-1.5 py-3">
        {issues.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? 'w-4 bg-brand-primary' : 'w-1.5 bg-gray-300'
            }`}
            aria-label={`Issue ${i + 1}`}
          />
        ))}
      </div>

      {/* Optional sticky footer (used in report flow) */}
      {stickyFooterLabel && onStickyFooterClick && (
        <div className="px-4 pb-4">
          <button
            onClick={onStickyFooterClick}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-primary py-3 text-sm font-semibold text-white"
          >
            {stickyFooterLabel}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Upvote button ─────────────────────────────────────────────────────────────

function VoteButton({ issue }: { issue: IssueWithMeta }) {
  const { upvotes, userVote, vote } = useVote({
    issueId: issue.id,
    initialUpvotes: issue.upvotes,
  })

  return (
    <button
      onClick={() => vote('up')}
      className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
        userVote === 'up'
          ? 'border-brand-primary bg-blue-50 text-brand-primary'
          : 'border-gray-200 text-gray-600 hover:border-brand-primary hover:text-brand-primary'
      }`}
    >
      ▲ Confirm ({upvotes})
    </button>
  )
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
