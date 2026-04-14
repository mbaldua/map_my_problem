'use client'

/**
 * IssueDetail — full detail view of a single issue.
 *
 * Layout:
 *   - Full-width photo (swipeable if multiple)
 *   - Category tag + Status badge
 *   - Location + posted time
 *   - ValidityBar (local vs total votes)
 *   - Description
 *   - ChatSection (discussion thread)
 *
 * See: docs/ui-specs.md — Section 5 (Issue Detail + Chat)
 *      docs/ux-flow.md  — Flow 6 (Issue Detail Page)
 */

import { useState } from 'react'
import Image from 'next/image'
import { MapPin, Clock, Share2, MoreHorizontal } from 'lucide-react'
import { CategoryTag } from '@/components/ui/CategoryTag'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ValidityBar } from './ValidityBar'
import { ChatSection } from './ChatSection'
import type { IssueWithMeta } from '@/types'

interface IssueDetailProps {
  issue: IssueWithMeta
}

export function IssueDetail({ issue }: IssueDetailProps) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const photos = issue.image_urls

  return (
    <article className="flex flex-col bg-white min-h-screen">
      {/* Photo carousel */}
      {photos.length > 0 ? (
        <div className="relative aspect-[4/3] w-full bg-gray-100">
          <Image
            src={photos[photoIndex]}
            alt={`Issue photo ${photoIndex + 1}`}
            fill
            className="object-cover"
            priority
          />

          {/* Multiple photos — dot navigation */}
          {photos.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPhotoIndex(i)}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i === photoIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-[4/3] w-full bg-gray-100 flex items-center justify-center text-6xl">
          {issue.category === 'water_logging' ? '💧' : issue.category === 'uncleanliness' ? '🗑️' : '🚗'}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-4 px-4 py-4">
        {/* Category + Status row */}
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryTag category={issue.category} />
          <StatusBadge status={issue.status} />

          {/* Actions — right-aligned */}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => navigator.share?.({ url: window.location.href })}
              aria-label="Share"
              className="rounded-full p-2 hover:bg-gray-100 transition-colors"
            >
              <Share2 size={18} className="text-gray-500" />
            </button>
            <button aria-label="More options" className="rounded-full p-2 hover:bg-gray-100 transition-colors">
              <MoreHorizontal size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Location + time */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
          {issue.address && (
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {issue.address}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {formatRelativeTime(issue.created_at)}
          </span>
        </div>

        {/* ValidityBar */}
        <ValidityBar issue={issue} />

        {/* Description */}
        {issue.description && (
          <p className="text-sm text-gray-700 leading-relaxed">{issue.description}</p>
        )}
      </div>

      {/* Divider */}
      <div className="h-2 bg-gray-50" />

      {/* Discussion */}
      <ChatSection issueId={issue.id} />
    </article>
  )
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hrs ago`
  return `${Math.floor(hours / 24)} days ago`
}
