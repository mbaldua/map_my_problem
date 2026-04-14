'use client'

/**
 * /gallery — Gallery view (standalone horizontal swipe carousel).
 *
 * Shows all nearby issues as full-width swipeable photo cards.
 * Filters: category, radius, sort order.
 *
 * See: docs/ui-specs.md — Section 3 (Gallery — Horizontal Swipe Carousel)
 *      docs/ux-flow.md  — Flow 4 (Category Gallery)
 */

import { useRouter } from 'next/navigation'
import { ChevronLeft, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { GalleryCarousel } from '@/components/gallery/GalleryCarousel'
import { RadiusPill } from '@/components/ui/RadiusPill'
import { useIssues } from '@/hooks/useIssues'
import { useAppStore } from '@/store/appStore'
import { FEED_CONFIG } from '@/config/feed'
import type { IssueCategory, FeedSort } from '@/types'

const CATEGORY_FILTERS = FEED_CONFIG.FILTER_OPTIONS.categories

export default function GalleryPage() {
  const router = useRouter()

  const userLocation = useAppStore((s) => s.userLocation)
  const radiusKm = useAppStore((s) => s.radiusKm)

  const [activeCategory, setActiveCategory] = useState<IssueCategory | 'all'>('all')
  const [sort, setSort] = useState<FeedSort>('recent')

  const { issues, isLoading } = useIssues({
    center: userLocation,
    radiusKm,
    category: activeCategory,
    sort,
  })

  return (
    <div className="flex flex-col h-dvh bg-brand-surface">
      {/* Top bar */}
      <header className="flex items-center gap-2 px-3 py-3 bg-white border-b border-gray-100">
        <button
          onClick={() => router.back()}
          className="rounded-full p-1.5 hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft size={22} className="text-gray-600" />
        </button>
        <h1 className="text-base font-semibold text-gray-900 flex-1">Gallery</h1>
        <button aria-label="Sort and filter" className="rounded-full p-1.5 hover:bg-gray-100 transition-colors">
          <SlidersHorizontal size={20} className="text-gray-600" />
        </button>
      </header>

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-none">
        {CATEGORY_FILTERS.map((cat) => {
          const isActive = activeCategory === cat
          const label =
            cat === 'all' ? 'All' :
            cat === 'water_logging' ? 'Water' :
            cat === 'uncleanliness' ? 'Unclean' : 'Traffic'
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-pill px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Radius pills */}
      <div className="bg-white border-b border-gray-100">
        <RadiusPill />
      </div>

      {/* Sort pills */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2">
        {(['recent', 'hot', 'proximity'] as FeedSort[]).map((s) => {
          const label = s === 'recent' ? 'Recent' : s === 'hot' ? 'Most Upvoted' : 'Near Me'
          return (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`shrink-0 rounded-pill px-3 py-1 text-xs font-medium transition-colors ${
                sort === s ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Carousel */}
      <div className="flex-1 overflow-hidden pt-4">
        <GalleryCarousel
          issues={issues}
          isLoading={isLoading}
          onStickyFooterClick={() => router.push('/report')}
        />
      </div>
    </div>
  )
}
