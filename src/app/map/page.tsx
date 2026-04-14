'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { SlidersHorizontal, MapPin } from 'lucide-react'
import { FAB } from '@/components/ui/FAB'
import { RadiusPill } from '@/components/ui/RadiusPill'
import { AreaPulse } from '@/components/map/AreaPulse'
import { useIssues } from '@/hooks/useIssues'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useAppStore } from '@/store/appStore'
import { ReportFlow } from '@/components/report/ReportFlow'
import type { IssueWithMeta, IssueCategory } from '@/types'

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-gray-100" />,
})

export default function MapPage() {
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<IssueWithMeta | null>(null)
  const [neighborhood, setNeighborhood] = useState<string | null>(null)

  const radiusKm = useAppStore((s) => s.radiusKm)
  const activeCategory = useAppStore((s) => s.activeCategory)
  const setUserLocation = useAppStore((s) => s.setUserLocation)
  const userLocation = useAppStore((s) => s.userLocation)

  const geo = useGeolocation()

  useEffect(() => {
    if (geo.status === 'success') {
      setUserLocation(geo.coords)
      // Reverse geocode for neighborhood name
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${geo.coords.lat}&lon=${geo.coords.lng}&format=json`
      )
        .then((r) => r.json())
        .then((data) => {
          const addr = data.address
          setNeighborhood(
            addr.suburb ?? addr.neighbourhood ?? addr.city_district ?? addr.city ?? null
          )
        })
        .catch(() => null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.status])

  const { issues, isLoading } = useIssues({
    center: userLocation,
    radiusKm,
    category: activeCategory ?? 'all',
  })

  return (
    // Full-bleed root — map fills the entire viewport
    <div className="fixed inset-0 overflow-hidden">

      {/* ── Map (full bleed) ─────────────────────────────── */}
      <MapView
        issues={issues}
        userLocation={userLocation}
        onPinClick={(issue) => setSelectedIssue(issue)}
      />

      {/* ── Top overlay ──────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 z-[900] pointer-events-none">
        {/* Gradient fade so pills are readable over any map tile */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/30 to-transparent h-28 pointer-events-none" />

        <div className="relative px-4 pt-safe-top pt-4 pointer-events-auto">
          {/* Location pill + filter button */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-white/60">
              <MapPin size={13} className="text-brand-primary shrink-0" />
              <span className="text-xs font-semibold text-gray-800 leading-none">
                {neighborhood ?? (geo.status === 'loading' ? 'Locating…' : 'Near you')}
              </span>
            </div>

            <button
              aria-label="Filter issues"
              className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-sm border border-white/60 hover:bg-white transition-colors"
            >
              <SlidersHorizontal size={17} className="text-gray-700" />
            </button>
          </div>

          {/* Radius pills */}
          <RadiusPill />
        </div>
      </div>

      {/* ── FAB ──────────────────────────────────────────── */}
      <FAB onClick={() => setIsReportOpen(true)} />

      {/* ── Area Pulse bottom sheet ───────────────────────── */}
      <div className="absolute bottom-0 inset-x-0 z-[900]">
        <AreaPulse
          summary={null}
          isLoading={isLoading}
          onCategoryClick={(cat: IssueCategory) =>
            useAppStore.getState().setActiveCategory(cat)
          }
        />
      </div>

      {/* ── Pin preview sheet ─────────────────────────────── */}
      {selectedIssue && (
        <div
          className="absolute inset-x-0 bottom-0 z-[1000] bg-white rounded-t-3xl shadow-2xl px-5 pt-3 pb-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="mx-auto w-10 h-1 bg-gray-200 rounded-full mb-4" />

          <div className="flex items-start justify-between gap-3 mb-1">
            <p className="font-semibold text-gray-900 text-sm leading-snug">
              {selectedIssue.title ?? selectedIssue.category.replace('_', ' ')}
            </p>
            <button
              onClick={() => setSelectedIssue(null)}
              className="shrink-0 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          </div>

          {selectedIssue.address && (
            <p className="text-xs text-gray-400 mb-4">{selectedIssue.address}</p>
          )}

          <a
            href={`/issue/${selectedIssue.id}`}
            className="block text-center rounded-2xl bg-brand-primary text-white py-3 text-sm font-semibold"
          >
            View Issue
          </a>
        </div>
      )}

      {/* ── Report modal ──────────────────────────────────── */}
      {isReportOpen && (
        <div className="fixed inset-0 z-[1100] bg-white">
          <ReportFlow onClose={() => setIsReportOpen(false)} />
        </div>
      )}
    </div>
  )
}
