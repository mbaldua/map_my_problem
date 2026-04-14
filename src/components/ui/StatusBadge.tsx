import { clsx } from 'clsx'
import type { IssueStatus } from '@/types'

const STATUS_META: Record<IssueStatus, { label: string; colorClass: string }> = {
  open:         { label: 'Open',         colorClass: 'bg-green-100 text-green-700' },
  resolved:     { label: 'Resolved',     colorClass: 'bg-gray-100 text-gray-500' },
  under_review: { label: 'Under Review', colorClass: 'bg-amber-100 text-amber-700' },
}

interface StatusBadgeProps {
  status: IssueStatus
  className?: string
}

/**
 * Pill badge showing the lifecycle status of an issue.
 * Displayed on IssueDetail and IssueCard.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, colorClass } = STATUS_META[status]

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}
