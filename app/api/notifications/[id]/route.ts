import {
  ApiHttpError,
  handleRouteError,
  requireAuth,
} from '@/lib/api/auth'
import { jsonOk } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import { markNotificationRead } from '@/lib/notifications/service'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid notification id')
    }

    const notification = await markNotificationRead(
      ctx.supabase,
      ctx.user.id,
      id
    )
    return jsonOk(notification)
  } catch (error) {
    return handleRouteError(error)
  }
}
