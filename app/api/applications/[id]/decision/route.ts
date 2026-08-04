import {
  ApiHttpError,
  getCallerCompanyId,
  handleRouteError,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import { getApplicationDecision } from '@/lib/selections/service'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid application id')
    }

    const companyId = await getCallerCompanyId(ctx.supabase, ctx.profileId)
    const decision = await getApplicationDecision(ctx.supabase, id, {
      profileId: ctx.profileId,
      role: ctx.role,
      companyId,
    })

    if (!decision) {
      throw new ApiHttpError(404, 'NOT_FOUND', 'No selection decision yet')
    }

    return jsonData(decision)
  } catch (error) {
    return handleRouteError(error)
  }
}
