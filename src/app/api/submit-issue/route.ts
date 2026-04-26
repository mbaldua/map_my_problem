/**
 * POST /api/submit-issue
 *
 * Server-side submission — uses the Supabase service role key so it works
 * without client auth. Auth will be enforced here in a later milestone.
 *
 * Accepts multipart/form-data:
 *   photos[]   — one or more image files
 *   category   — IssueCategory string
 *   lat        — number
 *   lng        — number
 *   address    — string (optional)
 *   description — string (optional)
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { REPORT_CONFIG } from '@/config/report'
import type { IssueCategory } from '@/types'

// Service role client — bypasses RLS. Never expose to the browser.
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !key) throw new Error('Supabase service role env vars missing')
  return createClient<Database>(url, key)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const category  = formData.get('category') as IssueCategory
    const lat       = parseFloat(formData.get('lat') as string)
    const lng       = parseFloat(formData.get('lng') as string)
    const address   = formData.get('address') as string | null
    const description = formData.get('description') as string | null
    const photos    = formData.getAll('photos') as File[]

    if (!category || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'category, lat, lng are required' }, { status: 400 })
    }

    const supabase = getAdminClient()
    const imageUrls: string[] = []

    // Upload photos
    for (const photo of photos) {
      const ext = photo.name.split('.').pop() ?? 'jpg'
      const path = `anon/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const buffer = Buffer.from(await photo.arrayBuffer())

      const { error: uploadError } = await supabase.storage
        .from(REPORT_CONFIG.STORAGE_BUCKET)
        .upload(path, buffer, { contentType: photo.type })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from(REPORT_CONFIG.STORAGE_BUCKET)
        .getPublicUrl(path)

      imageUrls.push(data.publicUrl)
    }

    // Insert issue row (user_id null = anonymous for now)
    const { data: issue, error: insertError } = await supabase
      .from('issues')
      .insert({
        user_id: null,
        category,
        lat,
        lng,
        address: address || null,
        image_urls: imageUrls,
        description: description || null,
        upvotes: 0,
        status: 'open',
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ id: issue.id })

  } catch (err) {
    console.error('[submit-issue]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Submission failed' },
      { status: 500 }
    )
  }
}
