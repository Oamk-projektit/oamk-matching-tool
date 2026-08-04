import 'server-only'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import {
  getAppUrl as resolveAppUrl,
  isSupabaseAdminConfigured as adminConfigured,
  isSupabaseConfigured as publicConfigured,
  requireSupabaseAdminEnv,
} from '@/lib/supabase/env'

/**
 * Service-role Supabase client for privileged server work only.
 *
 * Rules:
 * - Never import from Client Components or shared browser bundles.
 * - Do not use to bypass RLS for ordinary user operations.
 * - Reserve for health checks, migrations/jobs, and explicit admin tasks.
 */
export function createAdminClient() {
  const { url, serviceRoleKey } = requireSupabaseAdminEnv()

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

export function isSupabaseConfigured(): boolean {
  return publicConfigured()
}

export function isSupabaseAdminConfigured(): boolean {
  return adminConfigured()
}

/**
 * Canonical app base URL (server). Prefer `APP_URL`; fall back to the
 * legacy `NEXT_PUBLIC_APP_URL` so existing `.env.local` files keep working.
 */
export function getAppUrl(): string {
  return resolveAppUrl()
}
