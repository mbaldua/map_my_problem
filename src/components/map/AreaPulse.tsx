'use client'

/**
 * AreaPulse — collapsible bottom sheet that summarises local issue activity.
 *
 * Collapsed state: single-line summary strip.
 * Expanded state: per-category counts, top issue, local confirmations, trend.
 *
 * See: docs/ux-flow.md — Flow 3 (Area Pulse)
 *      docs/ui-specs.md — Section 2 (Area Pulse)
 */

import { useState } from 'react'
import { ChevronUp, ChevronDown, MapPin, TrendingUp } from 'lucide-react'
import { clsx } from 'clsx'
import { CategoryTag } from '@/components/ui/CategoryTag'
import type { AreaPulseSummary, IssueCategory } from '@/types'

interface AreaPulseProps {
  summary: AreaPulseSummary | null
  isLoading?: boolean
  onCategoryClick?: (category: IssueCategory) => void
  onIssueClick?: (issueId: string) => void
}

const CATEGORY_BARS: IssueCategory[] = ['water_logging', 'uncleanliness', 'traffic']
const BAR_COLORS: Record<IssueCategory, string> = {
  water_logging: 'bg-blue-500',
  uncleanliness: 'bg-amber-500',
  traffic:       'bg-red-500',
}

export function AreaPulse({
  summary,
  isLoading,
  onCategoryClick,
  onIssueClick,
}: AreaPulseProps) {
  const [expanded, setExpanded] = useState(false)

  const totalIssues = summary
    ? Object.values(summary.counts).reduce((a, b) => a + b, 0)
    : 0

  const dominantCategory = summary
    ? (Object.entries(summary.counts).sort(([, a], [, b]) => b - a)[0]?.[0] as IssueCategory | undefined)
    : undefined

  const maxCount = summary ? Math.max(...Object.values(summary.counts), 1) : 1

  // ── Collapsed strip ───────────────────────────────────────────────────────
  const collapsedBar = (
    <button
      className="w-full flex items-center justify-between px-4 py-3 text-sm"
      onClick={() => setExpanded(true)}
      aria-label="Expand area summary"
    >
      <span className="text-gray-600">
        {isLoading ? (
          <span className="animate-pulse">Loading area summary…</span>
        ) : summary && totalIssues > 0 ? (
          <>
            <strong>{totalIssues}</strong> issues near you this week
            {dominantCategory && (
              <> · Most: <CategoryTag category={dominantCategory} size="sm" /></>
            )}
          </>
        ) : (
          'No activity near you yet'
        )}
      </span>
      <ChevronUp size={18} className="text-gray-400 shrink-0" />
    </button>
  )

  // ── Expanded panel ────────────────────────────────────────────────────────
  const expandedPanel = (
    <div className="px-4 pt-2 pb-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <MapPin size={15} />
          <span>{summary?.neighborhood ?? 'Your area'}</span>
          <span className="text-gray-400 font-normal">— Last 7 days</span>
        </div>
        <button onClick={() => setExpanded(false)} aria-label="Collapse">
          <ChevronDown size={18} className="text-gray-400" />
        </button>
      </div>

      {/* Category bars */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 rounded bg-gray-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {CATEGORY_BARS.map((cat) => {
            const count = summary?.counts[cat] ?? 0
            const widthPct = Math.round((count / maxCount) * 100)
            return (
              <button
                key={cat}
                className="w-full flex items-center gap-3 text-left"
                onClick={() => onCategoryClick?.(cat)}
              >
                <CategoryTag category={cat} size="sm" className="w-28 shrink-0" />
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className={clsx('h-full rounded-full transition-all', BAR_COLORS[cat])}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="w-6 text-xs text-gray-500 text-right">{count}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Top issue */}
      {summary?.top_issue && (
        <button
          className="w-full text-left text-sm text-brand-primary font-medium"
          onClick={() => onIssueClick?.(summary.top_issue!.id)}
        >
          Trending: &ldquo;{summary.top_issue.title ?? summary.top_issue.category}&rdquo;
        </button>
      )}

      {/* Local confirmations + trend */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        {summary?.local_confirmations != null && summary.local_confirmations > 0 && (
          <span>🏠 {summary.local_confirmations} locals confirmed this week</span>
        )}
        {summary?.trend_multiplier != null && summary.trend_multiplier > 1 && (
          <span className="flex items-center gap-0.5 text-amber-600">
            <TrendingUp size={12} />
            {summary.trend_multiplier}× more than last week
          </span>
        )}
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-t-2xl shadow-card border-t border-gray-100">
      {/* Drag handle */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 rounded-full bg-gray-300" />
      </div>

      {expanded ? expandedPanel : collapsedBar}
    </div>
  )
}
