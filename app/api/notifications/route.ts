import {
  ApiHttpError,
  handleRouteError,
  requireAuth,
} from '@/lib/api/auth'
import { jsonOk } from '@/lib/api/response'
import {
  countUnread,
  listNotifications,
} from '@/lib/notifications/service'

export async function GET(request: Request) {
  try {
    const ctx = await requireAuth()
    const url = new URL(request.url)
    const unreadOnly = url.searchParams.get('unread') === 'true'
    const limitRaw = url.searchParams.get('limit')
    let limit = 50
    if (limitRaw !== null) {
      const parsed = Number(limitRaw)
      if (!Number.isInteger(parsed) || parsed < 1) {
        throw new ApiHttpError(
          400,
          'VALIDATION_ERROR',
          'limit must be a positive integer'
        )
      }
      limit = parsed
    }

    const [data, unread_count] = await Promise.all([
      listNotifications(ctx.supabase, ctx.user.id, { unreadOnly, limit }),
      countUnread(ctx.supabase, ctx.user.id),
    ])

    return jsonOk({
      data,
      meta: { count: data.length, unread_count },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
