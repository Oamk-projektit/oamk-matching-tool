import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { requireSupabasePublicEnv } from '@/lib/supabase/env'

/**
 * Cookie-scoped Supabase client for Server Components and Route Handlers.
 * Runs as the signed-in user (RLS applies). For privileged ops use admin.ts.
 */
export const createClient = async () => {
  const { url, key } = requireSupabasePublicEnv()
  const cookieStore = await cookies()

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as CookieOptions)
          )
        } catch {
          // Called from a Server Component where cookies are read-only.
          // Safe to ignore when middleware refreshes the session.
        }
      },
    },
  })
}
