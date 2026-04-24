/**
 * Server-side image preprocessing before sending to Gemini.
 *
 * - Strips EXIF metadata (contains GPS, device info)
 * - Resizes to max 1024px (sufficient for classification, lower token cost)
 * - Converts HEIC/WebP to JPEG for consistent handling
 * - Returns base64 string + mime type ready for Gemini inlineData
 *
 * Uses sharp — Node.js only, never import this in client components.
 */

import sharp from 'sharp'

const MAX_DIMENSION = 1024
const OUTPUT_MIME   = 'image/jpeg'

export interface ProcessedImage {
  base64: string
  mimeType: string
  width: number
  height: number
}

/**
 * Process a raw image Buffer (from multipart form or WA webhook).
 * Strips EXIF, resizes, converts to JPEG, returns base64.
 */
export async function preprocessImage(input: Buffer): Promise<ProcessedImage> {
  const processed = await sharp(input)
    .rotate()                          // auto-rotate from EXIF orientation before stripping
    .resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: 'inside',                   // preserve aspect ratio, never upscale
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })            // consistent format, strip all metadata by default
    .toBuffer({ resolveWithObject: true })

  return {
    base64: processed.data.toString('base64'),
    mimeType: OUTPUT_MIME,
    width: processed.info.width,
    height: processed.info.height,
  }
}

/**
 * Convert a base64 string (from the browser) to a Buffer for preprocessing.
 * Strips the data URL prefix if present (e.g. "data:image/jpeg;base64,...").
 */
export function base64ToBuffer(base64: string): Buffer {
  const data = base64.includes(',') ? base64.split(',')[1] : base64
  return Buffer.from(data, 'base64')
}
