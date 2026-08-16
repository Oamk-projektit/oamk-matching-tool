import {
  handleRouteError,
  requireAuth,
  requireRole,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { listAuditEvents } from '@/lib/audit/service'

/**
 * Teacher/admin audit history.
 * RLS already restricts SELECT on audit_events to teacher/admin.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireAuth()
    requireRole(
      ctx,
      ['teacher', 'admin'],
      'Only teachers and admins can read audit history'
    )

    const url = new URL(request.url)
    const limitRaw = url.searchParams.get('limit')
    let limit = 100
    if (limitRaw !== null) {
      const parsed = Number(limitRaw)
      if (Number.isInteger(parsed) && parsed >= 1) {
        limit = Math.min(parsed, 200)
      }
    }

    const events = await listAuditEvents(ctx.supabase, limit)
    return jsonData(events, { count: events.length })
  } catch (error) {
    return handleRouteError(error)
  }
}
