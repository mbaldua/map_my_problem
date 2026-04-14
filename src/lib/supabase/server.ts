/**
 * Server-side Supabase client (App Router).
 *
 * Use this in Server Components, Route Handlers, and Server Actions.
 * It reads / writes cookies via the Next.js `cookies()` API so that the
 * user's auth session is forwarded from browser to server automatically.
 *
 * This file must NOT be imported in Client Components — use
 * `@/lib/supabase/client` there.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll is called from Server Components where cookies are read-only.
            // The session will still work if a middleware refreshes it.
          }
        },
      },
    }
  )
}
