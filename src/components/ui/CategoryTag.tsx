import { clsx } from 'clsx'
import type { IssueCategory } from '@/types'

const CATEGORY_META: Record<IssueCategory, { label: string; emoji: string; colorClass: string }> =
  {
    water_logging: {
      label: 'Water Logging',
      emoji: '💧',
      colorClass: 'bg-blue-100 text-blue-700',
    },
    uncleanliness: {
      label: 'Uncleanliness',
      emoji: '🗑️',
      colorClass: 'bg-amber-100 text-amber-700',
    },
    traffic: {
      label: 'Traffic',
      emoji: '🚗',
      colorClass: 'bg-red-100 text-red-700',
    },
  }

interface CategoryTagProps {
  category: IssueCategory
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Small coloured badge showing the issue category with an emoji.
 * Used on IssueCard, IssueDetail, and Gallery carousel cards.
 */
export function CategoryTag({ category, size = 'md', className }: CategoryTagProps) {
  const { label, emoji, colorClass } = CATEGORY_META[category]

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-pill font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        colorClass,
        className
      )}
    >
      <span role="img" aria-hidden="true">{emoji}</span>
      {label}
    </span>
  )
}

/** Utility: get display label for a category. */
export function getCategoryLabel(category: IssueCategory): string {
  return CATEGORY_META[category].label
}
