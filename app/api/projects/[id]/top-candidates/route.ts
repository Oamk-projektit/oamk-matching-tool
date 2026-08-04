import {
  ApiHttpError,
  handleRouteError,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import { assertCanAccessProjectMatches } from '@/lib/matching/load-inputs'
import { listTopCandidatesForProject } from '@/lib/matching/service'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Top 3 (default) shortlist for a project.
 * Visible only to owning company, teacher, and admin.
 * Students always receive 403 — no peer scores or ranks.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id: projectId } = await context.params
    if (!isUuid(projectId)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid project id')
    }

    // Explicit student block (also covered by assertCanAccessProjectMatches).
    if (ctx.role === 'student') {
      throw new ApiHttpError(
        403,
        'FORBIDDEN',
        'Students cannot view top candidates or peer rankings'
      )
    }

    await assertCanAccessProjectMatches(ctx.supabase, projectId, {
      userId: ctx.user.id,
      role: ctx.role,
    })

    const url = new URL(request.url)
    const limitRaw = url.searchParams.get('limit')
    let limit = 3
    if (limitRaw !== null) {
      const parsed = Number(limitRaw)
      if (!Number.isInteger(parsed) || parsed < 1) {
        throw new ApiHttpError(
          400,
          'VALIDATION_ERROR',
          'limit must be a positive integer'
        )
      }
      limit = Math.min(parsed, 10)
    }

    const data = await listTopCandidatesForProject(
      ctx.supabase,
      projectId,
      limit
    )
    return jsonData(data, {
      count: data.length,
      projectId,
      limit,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
