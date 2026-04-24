/**
 * POST /api/describe-image — Call B
 *
 * Enrichment call. Fires after category is selected, runs while user is
 * on the location confirmation screen (10–15s of interaction time).
 *
 * Input:  { image: base64string, category: IssueCategory, duplicate_image_url?: string }
 * Output: DescribeImageResult
 *
 * Model: Gemini 1.5 Flash for description + questions
 *        Gemini 1.5 Pro for duplicate image comparison (only when duplicate_image_url provided)
 * Timeout: 10s
 *
 * See: docs/gemini-image-verification.md
 */

import { NextResponse, type NextRequest } from 'next/server'
import { flashModel, proModel, imagePart, callGeminiJSON } from '@/lib/gemini'
import { preprocessImage, base64ToBuffer } from '@/lib/image-preprocess'
import type { IssueCategory } from '@/types'

export interface DescribeImageResult {
  description: string                  // 1–2 sentence auto-generated description
  suggested_questions: string[]        // Questions for the user based on visual evidence
  category_matches: boolean            // Does image match the selected category?
  has_sensitive_content: boolean       // Faces, licence plates prominent in frame
  is_duplicate: boolean                // Only set when duplicate_image_url provided
  duplicate_issue_id: string | null    // Passed back from request if duplicate confirmed
}

const CATEGORY_LABELS: Record<IssueCategory, string> = {
  water_logging: 'water logging / flooding / blocked drain',
  uncleanliness: 'garbage / uncleanliness / overflowing bin',
  traffic: 'traffic issue / road damage / signal failure',
}

function buildDescribePrompt(category: IssueCategory): string {
  return `
You are helping document a civic issue report for an Indian city app.
The user has tagged this image as: "${CATEGORY_LABELS[category]}".

Analyse the image and return ONLY a JSON object with this exact schema — no markdown, no prose.

{
  "description": string,              // 1–2 sentences describing what you see. Be specific: mention location cues, severity, visible scale. Write as if describing for a municipal official who hasn't seen the photo. Plain English, no jargon.
  "suggested_questions": string[],    // 2–3 follow-up questions the user should answer to add useful context. Base these on what the image CANNOT tell you (duration, frequency, impact). Examples: "How long has this water been here?", "Does this happen every monsoon?"
  "category_matches": boolean,        // Does the image actually match the tagged category?
  "has_sensitive_content": boolean    // true if faces or vehicle licence plates are prominently visible and identifiable
}

Rules for description:
- Mention the type of problem, visible severity, and any relevant surroundings
- If water: estimate depth if visible, note any blocked drain or overflow point
- If garbage: note accumulation size, whether bin is present, proximity to homes
- If traffic: note what is blocking, road condition, approximate congestion
- Do NOT mention the user or say "the user reports" — describe only what you see
- Indian context: common issues include naali overflow, kachra dumping, pothole flooding

Rules for suggested_questions:
- Only ask what the image genuinely cannot answer
- Keep questions short and specific (under 10 words each)
- Do not ask obvious questions the image already answers
`.trim()
}

const DUPLICATE_PROMPT = `
You are comparing two photos of reported civic issues.
Return ONLY a JSON object — no markdown, no prose.

{
  "is_same_location": boolean,   // true if both photos show the same physical spot
  "is_same_issue": boolean,      // true if both show the same specific problem
  "confidence": number           // 0.0 to 1.0
}

Be conservative — only return is_same_location: true if you are confident.
Different angles of the same street corner count as same location.
`.trim()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      image: string
      category: IssueCategory
      duplicate_image_url?: string
      duplicate_issue_id?: string
    }

    if (!body.image || !body.category) {
      return NextResponse.json({ error: 'image and category are required' }, { status: 400 })
    }

    // Preprocess new image
    const buffer = base64ToBuffer(body.image)
    const processed = await preprocessImage(buffer)

    // Run description generation (Flash)
    const descriptionPromise = callGeminiJSON<Omit<DescribeImageResult, 'is_duplicate' | 'duplicate_issue_id'>>(
      flashModel,
      buildDescribePrompt(body.category),
      [imagePart(processed.base64, processed.mimeType)],
      10000
    )

    // Run duplicate comparison (Pro) only if a potential duplicate was found by geo-check
    let duplicateResult: { is_same_location: boolean; is_same_issue: boolean } | null = null

    if (body.duplicate_image_url) {
      try {
        // Fetch and preprocess the existing issue's image for comparison
        const existingRes = await fetch(body.duplicate_image_url)
        const existingBuffer = Buffer.from(await existingRes.arrayBuffer())
        const existingProcessed = await preprocessImage(existingBuffer)

        duplicateResult = await callGeminiJSON(
          proModel,
          DUPLICATE_PROMPT,
          [
            imagePart(processed.base64, processed.mimeType),
            imagePart(existingProcessed.base64, existingProcessed.mimeType),
          ],
          8000
        )
      } catch {
        // Duplicate comparison is best-effort — don't fail the whole call
        duplicateResult = null
      }
    }

    const description = await descriptionPromise
    const isDuplicate = duplicateResult?.is_same_location === true && duplicateResult?.is_same_issue === true

    return NextResponse.json({
      ...description,
      is_duplicate: isDuplicate,
      duplicate_issue_id: isDuplicate ? (body.duplicate_issue_id ?? null) : null,
    } satisfies DescribeImageResult)

  } catch (err) {
    console.error('[describe-image] Gemini call failed:', err)
    // Fail open — return empty enrichment, report flow continues normally
    return NextResponse.json({
      description: '',
      suggested_questions: [],
      category_matches: true,
      has_sensitive_content: false,
      is_duplicate: false,
      duplicate_issue_id: null,
    } satisfies DescribeImageResult)
  }
}
