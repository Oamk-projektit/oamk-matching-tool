import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { requireSupabasePublicEnv } from '@/lib/supabase/env'

/**
 * Browser Supabase client (anon/publishable key only, RLS applies).
 * Never import or embed the service role key here.
 */
export const createClient = () => {
  const { url, key } = requireSupabasePublicEnv()
  return createBrowserClient<Database>(url, key)
}
