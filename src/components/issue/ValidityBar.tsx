'use client'

/**
 * ValidityBar — shows total upvotes, local upvotes, downvotes, and a
 * credibility score derived from the ratio of local to total votes.
 *
 * Credibility tiers (docs/ux-flow.md — Flow 6):
 *   High   → ≥ 50% local votes
 *   Medium → 25–49% local votes
 *   Low    → < 25% local votes (possible spam/misreport)
 *
 * Hidden when total upvotes = 0.
 */

import { useVote } from '@/hooks/useVote'
import { clsx } from 'clsx'
import type { IssueWithMeta } from '@/types'

interface ValidityBarProps {
  issue: IssueWithMeta
}

type Credibility = 'high' | 'medium' | 'low'

function getCredibility(localUpvotes: number, totalUpvotes: number): Credibility {
  if (totalUpvotes === 0) return 'low'
  const ratio = localUpvotes / totalUpvotes
  if (ratio >= 0.5) return 'high'
  if (ratio >= 0.25) return 'medium'
  return 'low'
}

const CREDIBILITY_META: Record<Credibility, { label: string; barClass: string; textClass: string }> = {
  high:   { label: 'High',   barClass: 'bg-green-500', textClass: 'text-green-600' },
  medium: { label: 'Medium', barClass: 'bg-amber-400', textClass: 'text-amber-600' },
  low:    { label: 'Low',    barClass: 'bg-red-400',   textClass: 'text-red-600' },
}

export function ValidityBar({ issue }: ValidityBarProps) {
  const { upvotes, userVote, vote } = useVote({
    issueId: issue.id,
    initialUpvotes: issue.upvotes,
  })

  const localUpvotes = issue.local_upvotes ?? 0
  const credibility = getCredibility(localUpvotes, upvotes)
  const { label, barClass, textClass } = CREDIBILITY_META[credibility]

  // Hide if no votes yet
  if (upvotes === 0 && localUpvotes === 0) return null

  const localPct = upvotes > 0 ? Math.min(100, Math.round((localUpvotes / upvotes) * 100)) : 0

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
      {/* Counts row */}
      <div className="flex items-center gap-4 text-sm">
        <button
          onClick={() => vote('up')}
          className={clsx(
            'flex items-center gap-1 font-medium',
            userVote === 'up' ? 'text-brand-primary' : 'text-gray-600 hover:text-brand-primary'
          )}
          aria-label="Upvote"
        >
          ▲ {upvotes} total
        </button>

        <span className="text-gray-300">|</span>

        <span className="flex items-center gap-1 text-gray-600">
          🏠 {localUpvotes} local
        </span>

        <span className="text-gray-300">|</span>

        <button
          onClick={() => vote('down')}
          className={clsx(
            'flex items-center gap-1 text-xs',
            userVote === 'down' ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
          )}
          aria-label="Downvote"
        >
          {/* TODO: display downvote count from votes table */}
          ▼
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all', barClass)}
            style={{ width: `${localPct}%` }}
          />
        </div>
        <span className={clsx('text-xs font-semibold', textClass)}>
          {label}
        </span>
      </div>
    </div>
  )
}
