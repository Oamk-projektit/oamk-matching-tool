import { handleRouteError, requireAuth } from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { markAllNotificationsRead } from '@/lib/notifications/service'

/** Canonical path: POST /api/notifications/mark-all-read */
export async function POST() {
  try {
    const ctx = await requireAuth()
    const updated = await markAllNotificationsRead(ctx.supabase, ctx.profileId)
    return jsonData({ updated })
  } catch (error) {
    return handleRouteError(error)
  }
}
