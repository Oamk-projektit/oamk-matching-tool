import type { HealthResponse } from '@/types/api'
import {
  createAdminClient,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from '@/lib/supabase/admin'
import { jsonOk } from '@/lib/api/response'

/**
 * TOMMI — health endpoint (#140 / deploy readiness)
 * Cheap by default; `?deep=1` pings the database with the service role.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const deep = url.searchParams.get('deep') === '1'

  const body: HealthResponse = {
    status: 'ok',
    service: 'oamk-matching-tool',
    timestamp: new Date().toISOString(),
    supabase: isSupabaseConfigured() ? 'configured' : 'missing',
  }

  if (!deep) {
    return jsonOk(body)
  }

  if (!isSupabaseAdminConfigured()) {
    body.database = 'skipped'
    body.status = body.supabase === 'missing' ? 'degraded' : 'ok'
    return jsonOk(body)
  }

  try {
    const admin = createAdminClient()
    const { error } = await admin.from('profiles').select('id').limit(1)
    if (error) {
      body.database = 'error'
      body.database_error = error.message
      body.status = 'degraded'
    } else {
      body.database = 'ok'
    }
  } catch (error) {
    body.database = 'error'
    body.database_error =
      error instanceof Error ? error.message : 'Unknown database error'
    body.status = 'degraded'
  }

  return jsonOk(body)
}
