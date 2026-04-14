'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getBoundingBox } from '@/lib/geo'
import type { IssueWithMeta, LatLng, IssueCategory, RadiusKm, FeedSort } from '@/types'

interface UseIssuesOptions {
  center: LatLng | null
  radiusKm: RadiusKm
  category?: IssueCategory | 'all'
  sort?: FeedSort
  limit?: number
}

interface UseIssuesResult {
  issues: IssueWithMeta[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Fetches issues from Supabase within the given radius and category filter.
 * Uses a bounding box pre-filter on lat/lng for DB efficiency, then
 * further filters client-side with Haversine if needed.
 *
 * TODO: Replace bounding-box client-filter with PostGIS ST_DWithin once
 *       the PostGIS extension is enabled on the Supabase project.
 */
export function useIssues({
  center,
  radiusKm,
  category = 'all',
  sort = 'proximity',
  limit = 50,
}: UseIssuesOptions): UseIssuesResult {
  const [issues, setIssues] = useState<IssueWithMeta[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchIssues = useCallback(async () => {
    if (!center) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const bbox = getBoundingBox(center, radiusKm)

      // TODO: Replace with PostGIS ST_DWithin for accurate geo filtering
      let query = supabase
        .from('issues')
        .select(`
          id, user_id, category, title, description,
          lat, lng, address, image_urls, upvotes, status, created_at
        `)
        .gte('lat', bbox.sw.lat)
        .lte('lat', bbox.ne.lat)
        .gte('lng', bbox.sw.lng)
        .lte('lng', bbox.ne.lng)
        .limit(limit)

      if (category !== 'all') {
        query = query.eq('category', category)
      }

      // Server-side sort where possible
      if (sort === 'recent') {
        query = query.order('created_at', { ascending: false })
      } else if (sort === 'hot') {
        query = query.order('upvotes', { ascending: false })
      }
      // 'proximity' is sorted client-side after fetching

      const { data, error: dbError } = await query

      if (dbError) throw new Error(dbError.message)

      // TODO: Enrich with distance_km, local_upvotes, comment_count
      const enriched: IssueWithMeta[] = (data ?? [])

      setIssues(enriched)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load issues')
    } finally {
      setIsLoading(false)
    }
  }, [center, radiusKm, category, sort, limit])

  useEffect(() => {
    fetchIssues()
  }, [fetchIssues])

  return { issues, isLoading, error, refetch: fetchIssues }
}
