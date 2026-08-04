import {
  ApiHttpError,
  getCallerCompanyId,
  handleRouteError,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import { getProjectDetailById } from '@/lib/projects/service'
import {
  assertCanViewApplicants,
  listApplicantsForProject,
} from '@/lib/applications/service'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid project id')
    }

    const project = await getProjectDetailById(ctx.supabase, id)
    if (!project) throw new ApiHttpError(404, 'NOT_FOUND', 'Project not found')

    const companyId = await getCallerCompanyId(ctx.supabase, ctx.profileId)
    assertCanViewApplicants({
      role: ctx.role,
      projectCompanyId: project.companyId,
      callerCompanyId: companyId,
    })

    const data = await listApplicantsForProject(ctx.supabase, id)
    return jsonData(data, { count: data.length, topN: 3 })
  } catch (error) {
    return handleRouteError(error)
  }
}
