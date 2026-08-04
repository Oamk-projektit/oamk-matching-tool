import {
  ApiHttpError,
  handleRouteError,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import { markNotificationRead } from '@/lib/notifications/service'

type RouteContext = { params: Promise<{ id: string }> }

/** Canonical path: PATCH /api/notifications/:id/read */
export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid notification id')
    }

    const notification = await markNotificationRead(
      ctx.supabase,
      ctx.profileId,
      id
    )
    return jsonData(notification)
  } catch (error) {
    return handleRouteError(error)
  }
}
