/**
 * Shared Supabase public env resolution.
 * Prefers the new publishable key; falls back to legacy anon key name.
 */

export function getSupabaseUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  return url || undefined
}

/**
 * Browser / user-scoped API key (RLS applies).
 * Dashboard “Publishable key” or legacy “anon” JWT.
 */
export function getSupabasePublishableKey(): string | undefined {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  return key || undefined
}

export function requireSupabasePublicEnv(): {
  url: string
  key: string
} {
  const url = getSupabaseUrl()
  const key = getSupabasePublishableKey()
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    )
  }
  return { url, key }
}
