/**
 * Gemini client — server-side only.
 *
 * Uses @google/generative-ai with Gemini 1.5 Flash for all calls.
 * Gemini 1.5 Pro is used only for duplicate image comparison.
 *
 * See: docs/gemini-image-verification.md
 */

import { GoogleGenerativeAI, type Part } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set. Add it to .env.local.')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export const flashModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
export const proModel   = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

/** Build a Gemini image Part from a base64 string and mime type. */
export function imagePart(base64: string, mimeType: string): Part {
  return {
    inlineData: { data: base64, mimeType },
  }
}

/**
 * Call Gemini and parse the JSON response.
 * Strips markdown code fences that Gemini sometimes wraps around JSON.
 */
export async function callGeminiJSON<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: typeof flashModel,
  prompt: string,
  parts: Part[],
  timeoutMs = 8000
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const result = await model.generateContent([prompt, ...parts])
    const text = result.response.text().trim()

    // Strip markdown code fences if present
    const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    return JSON.parse(json) as T
  } finally {
    clearTimeout(timer)
  }
}
