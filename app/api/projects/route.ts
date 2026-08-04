import {
  ApiHttpError,
  getCallerCompanyId,
  handleRouteError,
  parseJsonBody,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { assertProjectStatus, assertProjectType } from '@/lib/validation/domain'
import { parseCreateProject } from '@/lib/projects/parse'
import { createProject, listProjects } from '@/lib/projects/service'
import type { ProjectStatus, ProjectType } from '@/types/domain'

export async function GET(request: Request) {
  try {
    const ctx = await requireAuth()
    const url = new URL(request.url)
    const projectTypeParam = url.searchParams.get('projectType')
    const statusParam = url.searchParams.get('status')
    const q = url.searchParams.get('q') ?? undefined

    let projectType: ProjectType | undefined
    let status: ProjectStatus | undefined
    if (projectTypeParam) projectType = assertProjectType(projectTypeParam)
    if (statusParam) status = assertProjectStatus(statusParam)

    const companyId = await getCallerCompanyId(ctx.supabase, ctx.profileId)
    const data = await listProjects(ctx.supabase, {
      role: ctx.role,
      callerCompanyId: companyId,
      projectType,
      status,
      q,
    })
    return jsonData(data, { count: data.length })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAuth()
    if (ctx.role !== 'company' && ctx.role !== 'admin') {
      throw new ApiHttpError(
        403,
        'FORBIDDEN',
        'Only company users (or admins) can create projects'
      )
    }

    const raw = await parseJsonBody(request)
    const body = parseCreateProject(raw)
    let companyId = await getCallerCompanyId(ctx.supabase, ctx.profileId)

    if (!companyId && ctx.role === 'admin') {
      const rawObj =
        raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
      if (typeof rawObj.companyId === 'string') {
        companyId = rawObj.companyId
      }
    }

    if (!companyId) {
      throw new ApiHttpError(
        400,
        'VALIDATION_ERROR',
        'Caller is not linked to a company'
      )
    }

    const project = await createProject(ctx.supabase, companyId, body)
    return jsonData(project, {}, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
