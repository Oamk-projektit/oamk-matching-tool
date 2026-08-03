import type { HealthResponse } from '@/types/api'
import { isSupabaseConfigured } from '@/lib/supabase/admin'
import { jsonOk } from '@/lib/api/response'

export async function GET() {
  const body: HealthResponse = {
    status: 'ok',
    service: 'oamk-matching-tool',
    timestamp: new Date().toISOString(),
    supabase: isSupabaseConfigured() ? 'configured' : 'missing',
  }

  return jsonOk(body)
}
