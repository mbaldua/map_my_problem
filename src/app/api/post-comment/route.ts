/**
 * POST /api/post-comment
 *
 * Server-side comment posting — uses service role key so it works
 * without client auth. Auth will be enforced here in a later milestone.
 *
 * Body (JSON):
 *   issue_id   — string (UUID)
 *   body       — string
 *   parent_id  — string | null (for replies)
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !key) throw new Error('Supabase service role env vars missing')
  return createClient<Database>(url, key)
}

export async function POST(request: NextRequest) {
  try {
    const { issue_id, body, parent_id } = await request.json()

    if (!issue_id || !body?.trim()) {
      return NextResponse.json({ error: 'issue_id and body are required' }, { status: 400 })
    }

    const supabase = getAdminClient()

    const { data, error } = await supabase
      .from('comments')
      .insert({
        issue_id,
        user_id: null,
        body: body.trim(),
        parent_id: parent_id ?? null,
        upvotes: 0,
      })
      .select('id, issue_id, user_id, body, parent_id, upvotes, created_at')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to post comment'
    console.error('[post-comment]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
