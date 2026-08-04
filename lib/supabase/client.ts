import { createBrowserClient } from '@supabase/ssr'
import { requireSupabasePublicEnv } from '@/lib/supabase/env'

/**
 * Browser Supabase client (publishable/anon key, RLS applies).
 */
export const createClient = () => {
  const { url, key } = requireSupabasePublicEnv()
  return createBrowserClient(url, key)
}
