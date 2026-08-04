import {
  ApiHttpError,
  getCallerCompanyId,
  handleRouteError,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import {
  assertCanViewApplication,
  getApplicationById,
} from '@/lib/applications/service'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid application id')
    }

    const application = await getApplicationById(ctx.supabase, id)
    if (!application) {
      throw new ApiHttpError(404, 'NOT_FOUND', 'Application not found')
    }

    const companyId = await getCallerCompanyId(ctx.supabase, ctx.profileId)
    assertCanViewApplication({
      role: ctx.role,
      studentProfileId: application.studentProfileId,
      projectCompanyId: application.projectCompanyId,
      callerProfileId: ctx.profileId,
      callerCompanyId: companyId,
    })

    return jsonData({
      id: application.id,
      projectId: application.projectId,
      studentId: application.studentId,
      status: application.status,
      message: application.message,
      submittedAt: application.submittedAt,
      updatedAt: application.updatedAt,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
