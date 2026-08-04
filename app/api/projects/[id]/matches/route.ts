import {
  ApiHttpError,
  handleRouteError,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { isUuid, ValidationError } from '@/lib/validation'
import { assertCanAccessProjectMatches } from '@/lib/matching/load-inputs'
import {
  listMatchesForProject,
  parseRunMatchesBody,
  runMatchingForProject,
} from '@/lib/matching/service'

type RouteContext = { params: Promise<{ id: string }> }

/** Company / teacher / admin: list stored matches for a project. */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id: projectId } = await context.params
    if (!isUuid(projectId)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid project id')
    }

    await assertCanAccessProjectMatches(ctx.supabase, projectId, {
      userId: ctx.user.id,
      role: ctx.role,
    })

    const data = await listMatchesForProject(ctx.supabase, projectId)
    return jsonData(data, { count: data.length, projectId })
  } catch (error) {
    return handleRouteError(error)
  }
}

/**
 * Company / teacher / admin: run matching for this project.
 * Does not change application status or create selection decisions.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id: projectId } = await context.params
    if (!isUuid(projectId)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid project id')
    }

    await assertCanAccessProjectMatches(ctx.supabase, projectId, {
      userId: ctx.user.id,
      role: ctx.role,
    })

    const text = await request.text()
    let rawBody: unknown = {}
    if (text.trim()) {
      try {
        rawBody = JSON.parse(text)
      } catch {
        throw new ValidationError('Invalid JSON body', [
          { field: 'body', message: 'Must be valid JSON' },
        ])
      }
    }

    const { locale } = parseRunMatchesBody(rawBody)
    const data = await runMatchingForProject(ctx.supabase, projectId, locale)
    return jsonData(data, { count: data.length, projectId })
  } catch (error) {
    return handleRouteError(error)
  }
}
