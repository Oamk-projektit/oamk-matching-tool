import { handleRouteError, requireAuth } from '@/lib/api/auth'
import { jsonOk } from '@/lib/api/response'
import { markAllNotificationsRead } from '@/lib/notifications/service'

export async function POST() {
  try {
    const ctx = await requireAuth()
    const updated = await markAllNotificationsRead(ctx.supabase, ctx.user.id)
    return jsonOk({ updated })
  } catch (error) {
    return handleRouteError(error)
  }
}
