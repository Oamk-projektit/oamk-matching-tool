import {
  ApiHttpError,
  getCallerCompanyId,
  handleRouteError,
  parseJsonBody,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import { parseUpdateProject } from '@/lib/projects/parse'
import {
  assertCanManageProject,
  canViewProject,
  deleteProject,
  getProjectDetailById,
  updateProject,
} from '@/lib/projects/service'

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
    if (
      !canViewProject({
        role: ctx.role,
        projectStatus: project.status,
        projectCompanyId: project.companyId,
        callerCompanyId: companyId,
      })
    ) {
      throw new ApiHttpError(404, 'NOT_FOUND', 'Project not found')
    }

    return jsonData(project)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid project id')
    }

    const existing = await getProjectDetailById(ctx.supabase, id)
    if (!existing) throw new ApiHttpError(404, 'NOT_FOUND', 'Project not found')

    const companyId = await getCallerCompanyId(ctx.supabase, ctx.profileId)
    assertCanManageProject({
      role: ctx.role,
      projectCompanyId: existing.companyId,
      callerCompanyId: companyId,
    })

    const body = parseUpdateProject(await parseJsonBody(request))
    const project = await updateProject(ctx.supabase, id, body)
    return jsonData(project)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid project id')
    }

    const existing = await getProjectDetailById(ctx.supabase, id)
    if (!existing) throw new ApiHttpError(404, 'NOT_FOUND', 'Project not found')

    const companyId = await getCallerCompanyId(ctx.supabase, ctx.profileId)
    assertCanManageProject({
      role: ctx.role,
      projectCompanyId: existing.companyId,
      callerCompanyId: companyId,
    })

    await deleteProject(ctx.supabase, id)
    return new Response(null, { status: 204 })
  } catch (error) {
    return handleRouteError(error)
  }
}
