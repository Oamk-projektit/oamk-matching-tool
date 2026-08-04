import {
  ApiHttpError,
  handleRouteError,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
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

    const [data, unreadCount] = await Promise.all([
      listNotifications(ctx.supabase, ctx.profileId, { unreadOnly, limit }),
      countUnread(ctx.supabase, ctx.profileId),
    ])

    return jsonData(data, { count: data.length, unreadCount })
  } catch (error) {
    return handleRouteError(error)
  }
}
