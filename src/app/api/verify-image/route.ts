/**
 * POST /api/verify-image — Call A
 *
 * Fast validation gate. Fires after photo is confirmed, runs while user
 * is on the category selection screen.
 *
 * Input:  { image: base64string, category: IssueCategory }
 * Output: VerifyImageResult
 *
 * Model: Gemini 1.5 Flash (target <1s)
 * Timeout: 4s — fail open on timeout
 *
 * See: docs/gemini-image-verification.md
 */

import { NextResponse, type NextRequest } from 'next/server'
import { flashModel, imagePart, callGeminiJSON } from '@/lib/gemini'
import { preprocessImage, base64ToBuffer } from '@/lib/image-preprocess'
import type { IssueCategory } from '@/types'

export interface VerifyImageResult {
  is_civic_issue: boolean
  confidence: number                            // 0–1
  detected_category: IssueCategory | 'other' | 'unclear'
  image_quality: 'good' | 'too_dark' | 'too_blurry' | 'too_far' | 'unclear'
  rejection_reason: 'not_civic_issue' | 'inappropriate_content' | null
}

const VERIFY_PROMPT = `
You are a civic issue classifier for an Indian city reporting app.
Analyse the image and return ONLY a JSON object with this exact schema — no markdown, no prose.

{
  "is_civic_issue": boolean,         // true if the image shows a real civic problem visible in a public/residential area
  "confidence": number,              // 0.0 to 1.0
  "detected_category": string,       // one of: "water_logging", "uncleanliness", "traffic", "other", "unclear"
  "image_quality": string,           // one of: "good", "too_dark", "too_blurry", "too_far", "unclear"
  "rejection_reason": string | null  // "not_civic_issue" | "inappropriate_content" | null
}

Rules:
- is_civic_issue = false for: selfies, food, animals, indoor scenes, blank walls, text-only, memes
- is_civic_issue = true for: waterlogged roads, garbage/waste on streets, traffic jams, potholes, broken drains, damaged roads, overflowing bins, open manholes, signal failures
- Indian context: kachra (garbage), naali (drain), pani (water) — understand South Asian urban settings
- image_quality "too_far": the problem is not the main subject (subject is >50% of frame distance)
- Be generous: a blurry photo of a real civic problem is still is_civic_issue = true
- rejection_reason is only set when is_civic_issue = false
`.trim()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { image: string; category?: IssueCategory }

    if (!body.image) {
      return NextResponse.json({ error: 'image is required' }, { status: 400 })
    }

    // Preprocess: strip EXIF, resize, convert to JPEG
    const buffer = base64ToBuffer(body.image)
    const processed = await preprocessImage(buffer)

    const result = await callGeminiJSON<VerifyImageResult>(
      flashModel,
      VERIFY_PROMPT,
      [imagePart(processed.base64, processed.mimeType)],
      4000  // 4s timeout — fail open
    )

    return NextResponse.json(result)

  } catch (err) {
    // Fail open — never block a report because Gemini is unavailable
    console.error('[verify-image] Gemini call failed:', err)
    return NextResponse.json({
      is_civic_issue: true,
      confidence: 0,
      detected_category: 'unclear',
      image_quality: 'unclear',
      rejection_reason: null,
    } satisfies VerifyImageResult)
  }
}
