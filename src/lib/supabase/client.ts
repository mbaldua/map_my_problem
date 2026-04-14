/**
 * Browser-side Supabase client.
 *
 * Use this in Client Components ('use client') and browser-only code.
 * For Server Components / Route Handlers, use `@/lib/supabase/server` instead.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Copy .env.local.example to .env.local and fill in your project credentials.'
  )
}

/**
 * Singleton browser Supabase client, typed against the Database schema.
 * @supabase/ssr handles cookie-based session persistence automatically.
 */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
