/**
 * Server-side environment validation for Supabase / app config.
 * Never log or return secret values.
 */

export class EnvConfigError extends Error {
  readonly missing: string[]

  constructor(missing: string[]) {
    const list = missing.join(', ')
    super(
      `Missing required environment variable(s): ${list}. Copy .env.example to .env.local and fill in values from the Supabase project settings.`
    )
    this.name = 'EnvConfigError'
    this.missing = missing
  }
}

export function getSupabaseUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  return url || undefined
}

/**
 * Browser / user-scoped API key (RLS applies).
 * Prefers legacy anon key name; accepts Dashboard publishable key as alias.
 */
export function getSupabasePublishableKey(): string | undefined {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  return key || undefined
}

export function getSupabaseServiceRoleKey(): string | undefined {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  return key || undefined
}

export function getAppUrl(): string {
  return (
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    'http://localhost:3000'
  )
}

export function getInternalApiSecret(): string | undefined {
  const secret = process.env.INTERNAL_API_SECRET?.trim()
  return secret || undefined
}

export function requireSupabasePublicEnv(): {
  url: string
  key: string
} {
  const missing: string[] = []
  const url = getSupabaseUrl()
  const key = getSupabasePublishableKey()
  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!key) {
    missing.push(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)'
    )
  }
  if (missing.length > 0) {
    throw new EnvConfigError(missing)
  }
  return { url: url!, key: key! }
}

export function requireSupabaseAdminEnv(): {
  url: string
  serviceRoleKey: string
} {
  const missing: string[] = []
  const url = getSupabaseUrl()
  const serviceRoleKey = getSupabaseServiceRoleKey()
  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (missing.length > 0) {
    throw new EnvConfigError(missing)
  }
  return { url: url!, serviceRoleKey: serviceRoleKey! }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey())
}

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey())
}
