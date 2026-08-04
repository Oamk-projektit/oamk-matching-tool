import {
  ApiHttpError,
  handleRouteError,
  requireAuth,
  requireRole,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import type { AuditEvent } from '@/types/domain'

function mapAuditEvent(row: {
  id: string
  actor_profile_id: string | null
  action: string
  entity_type: string
  entity_id: string
  old_values: unknown
  new_values: unknown
  created_at: string
}): AuditEvent {
  return {
    id: row.id,
    actorProfileId: row.actor_profile_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    oldValues:
      row.old_values && typeof row.old_values === 'object'
        ? (row.old_values as Record<string, unknown>)
        : null,
    newValues:
      row.new_values && typeof row.new_values === 'object'
        ? (row.new_values as Record<string, unknown>)
        : null,
    createdAt: row.created_at,
  }
}

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

    const { data, error } = await ctx.supabase
      .from('audit_events')
      .select(
        'id, actor_profile_id, action, entity_type, entity_id, old_values, new_values, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
    }

    const events = (data ?? []).map(mapAuditEvent)
    return jsonData(events, { count: events.length })
  } catch (error) {
    return handleRouteError(error)
  }
}
