import {
  ApiHttpError,
  getCallerCompanyId,
  handleRouteError,
  parseJsonBody,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import { parseUpdateApplicationStatus } from '@/lib/applications/parse'
import { updateApplicationStatus } from '@/lib/applications/service'

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
    const companyId = await getCallerCompanyId(ctx.supabase, ctx.profileId)
    const application = await updateApplicationStatus(
      ctx.supabase,
      id,
      status,
      {
        profileId: ctx.profileId,
        role: ctx.role,
        companyId,
      }
    )
    return jsonData(application)
  } catch (error) {
    return handleRouteError(error)
  }
}
