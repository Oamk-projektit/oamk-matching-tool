import { ApiHttpError, handleRouteError, requireAuth } from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import { withdrawApplication } from '@/lib/applications/service'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid application id')
    }

    const application = await withdrawApplication(ctx.supabase, id, {
      profileId: ctx.profileId,
      role: ctx.role,
    })
    return jsonData(application)
  } catch (error) {
    return handleRouteError(error)
  }
}
