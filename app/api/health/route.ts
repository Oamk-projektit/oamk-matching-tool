import type { HealthData } from '@/types/api'
import {
  createAdminClient,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from '@/lib/supabase/admin'
import { EnvConfigError } from '@/lib/supabase/env'
import { apiSuccess, apiError } from '@/lib/api/response'

/**
 * GET /api/health — liveness + optional database connectivity.
 * Never returns table contents, keys, or SQL internals.
 */
export async function GET() {
  const timestamp = new Date().toISOString()

  if (!isSupabaseConfigured()) {
    return apiError(
      'SERVICE_UNAVAILABLE',
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY). Copy .env.example to .env.local.',
      503
    )
  }

  if (!isSupabaseAdminConfigured()) {
    return apiError(
      'SERVICE_UNAVAILABLE',
      'Missing SUPABASE_SERVICE_ROLE_KEY required for database health checks.',
      503
    )
  }

  try {
    const admin = createAdminClient()
    // Cheap existence probe — no row payloads returned to the client.
    const { error } = await admin.from('profiles').select('id').limit(1)

    if (error) {
      return apiError(
        'DATABASE_ERROR',
        'Database is not available',
        503
      )
    }

    const data: HealthData = {
      status: 'ok',
      service: 'oamk-matching-tool',
      database: 'connected',
      timestamp,
    }
    return apiSuccess(data)
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return apiError('SERVICE_UNAVAILABLE', error.message, 503)
    }
    return apiError('DATABASE_ERROR', 'Database is not available', 503)
  }
}
