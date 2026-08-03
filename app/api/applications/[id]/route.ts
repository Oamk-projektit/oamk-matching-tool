import {
  ApiHttpError,
  handleRouteError,
  parseJsonBody,
  requireAuth,
} from '@/lib/api/auth'
import { jsonOk } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import {
  parseUpdateApplicationStatus,
  updateApplicationStatus,
} from '@/lib/applications/service'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid application id')
    }

    const { status } = parseUpdateApplicationStatus(
      await parseJsonBody(request)
    )
    const application = await updateApplicationStatus(
      ctx.supabase,
      id,
      status,
      { userId: ctx.user.id, role: ctx.role }
    )
    return jsonOk(application)
  } catch (error) {
    return handleRouteError(error)
  }
}
