/**
 * /issue/[id] — Issue detail page.
 *
 * Server Component: fetches the issue row from Supabase on the server,
 * then passes it to the <IssueDetail> client component for interactive rendering.
 *
 * See: docs/ui-specs.md — Section 5 (Issue Detail + Chat)
 *      docs/ux-flow.md  — Flow 6 (Issue Detail Page)
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { IssueDetail } from '@/components/issue/IssueDetail'
import type { Metadata } from 'next'
import type { IssueWithMeta } from '@/types'

interface PageProps {
  params: { id: string }
}

// Generate dynamic OG meta per issue
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase
    .from('issues')
    .select('title, category, address')
    .eq('id', params.id)
    .single()

  if (!data) return { title: 'Issue Not Found' }

  const title = data.title ?? `${data.category} report`
  return {
    title,
    description: data.address ? `Reported near ${data.address}` : undefined,
  }
}

export default async function IssueDetailPage({ params }: PageProps) {
  const supabase = createClient()

  // TODO: Use a view or RPC that also returns comment_count and local_upvotes
  const { data, error } = await supabase
    .from('issues')
    .select(`
      id, user_id, category, title, description,
      lat, lng, address, image_urls, upvotes, status, created_at
    `)
    .eq('id', params.id)
    .single()

  if (error || !data) {
    notFound()
  }

  const issue: IssueWithMeta = data as IssueWithMeta

  return (
    <div className="flex flex-col min-h-dvh bg-white">
      {/* Back navigation */}
      <header className="flex items-center gap-2 px-3 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
        <Link href="/map" className="rounded-full p-1.5 hover:bg-gray-100 transition-colors">
          <ChevronLeft size={22} className="text-gray-600" />
        </Link>
        <span className="text-sm font-medium text-gray-800">Issue Detail</span>
      </header>

      <IssueDetail issue={issue} />
    </div>
  )
}
