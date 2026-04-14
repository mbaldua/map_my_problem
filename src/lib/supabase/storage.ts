/**
 * Supabase Storage helpers for issue image uploads.
 *
 * Bucket: `issue-images`
 * Path convention: {user_id}/{issue_id}/{filename}
 *
 * Upload flow in ReportFlow:
 * 1. User picks/snaps photos (File[]) in PhotoCapture
 * 2. On submit, call uploadIssueImages() — returns public URLs
 * 3. Store URLs in issues.image_urls[]
 */

import { createClient } from './client'

const BUCKET = 'issue-images'

/**
 * Upload one or more photos for an issue.
 * Returns an array of public URLs in the same order as the input files.
 */
export async function uploadIssueImages(
  userId: string,
  issueId: string,
  files: File[]
): Promise<string[]> {
  const supabase = createClient()
  const urls: string[] = []

  for (const file of files) {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${userId}/${issueId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (error) throw new Error(`Image upload failed: ${error.message}`)

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    urls.push(data.publicUrl)
  }

  return urls
}

/**
 * Delete all images for an issue (e.g. when an issue is deleted).
 * Paths must be in the format: {user_id}/{issue_id}/{filename}
 */
export async function deleteIssueImages(paths: string[]): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(BUCKET).remove(paths)
  if (error) throw new Error(`Image deletion failed: ${error.message}`)
}

/**
 * Extract the storage path from a full public URL.
 * Needed when deleting images — Supabase remove() expects the path, not the URL.
 */
export function extractStoragePath(publicUrl: string): string {
  // URL format: https://<project>.supabase.co/storage/v1/object/public/issue-images/<path>
  const marker = `/object/public/${BUCKET}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) throw new Error(`Unexpected storage URL format: ${publicUrl}`)
  return publicUrl.slice(idx + marker.length)
}
