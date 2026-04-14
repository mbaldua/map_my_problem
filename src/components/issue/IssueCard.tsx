import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Clock, MessageCircle } from 'lucide-react'
import { CategoryTag } from '@/components/ui/CategoryTag'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDistance } from '@/lib/geo'
import type { IssueWithMeta } from '@/types'

interface IssueCardProps {
  issue: IssueWithMeta
  /** Show distance label. Only available when user location is known. */
  showDistance?: boolean
}

/**
 * Compact issue card used in the Feed view and as a bottom-sheet preview
 * when tapping a map pin.
 *
 * See: docs/ui-specs.md — "Issue Card in feed / carousel"
 */
export function IssueCard({ issue, showDistance }: IssueCardProps) {
  const thumbnail = issue.image_urls[0]

  return (
    <Link
      href={`/issue/${issue.id}`}
      className="flex gap-3 rounded-2xl bg-white p-3 shadow-card hover:shadow-md transition-shadow"
    >
      {/* Thumbnail */}
      {thumbnail ? (
        <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden">
          <Image src={thumbnail} alt="" fill className="object-cover" />
        </div>
      ) : (
        <div className="h-20 w-20 shrink-0 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
          {issue.category === 'water_logging' ? '💧' : issue.category === 'uncleanliness' ? '🗑️' : '🚗'}
        </div>
      )}

      {/* Details */}
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryTag category={issue.category} size="sm" />
          <StatusBadge status={issue.status} />
        </div>

        {issue.title && (
          <p className="text-sm font-medium text-gray-800 truncate">{issue.title}</p>
        )}

        {issue.address && (
          <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
            <MapPin size={11} />
            {issue.address}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto">
          <span className="flex items-center gap-0.5">
            <Clock size={11} />
            {formatRelativeTime(issue.created_at)}
          </span>
          {issue.comment_count != null && (
            <span className="flex items-center gap-0.5">
              <MessageCircle size={11} />
              {issue.comment_count}
            </span>
          )}
          <span>▲ {issue.upvotes}</span>
          {showDistance && issue.distance_km != null && (
            <span>{formatDistance(issue.distance_km)}</span>
          )}
        </div>
      </div>
    </Link>
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
