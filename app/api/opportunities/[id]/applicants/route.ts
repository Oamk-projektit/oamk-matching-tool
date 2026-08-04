import {
  ApiHttpError,
  handleRouteError,
  requireAuth,
} from '@/lib/api/auth'
import { isUuid } from '@/lib/validation'
import { getOpportunityById } from '@/lib/opportunities/service'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Legacy opportunities applicants route.
 * Prefer `GET /api/projects/:id/applicants` after the projects-model migration.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid opportunity id')
    }

    const opportunity = await getOpportunityById(ctx.supabase, id)
    if (!opportunity) {
      throw new ApiHttpError(404, 'NOT_FOUND', 'Opportunity not found')
    }
    if (ctx.role !== 'admin' && opportunity.teacher_id !== ctx.user.id) {
      throw new ApiHttpError(
        403,
        'FORBIDDEN',
        'Only the opportunity owner can view applicants'
      )
    }

    throw new ApiHttpError(
      404,
      'NOT_FOUND',
      'Legacy opportunities applicants API retired — use GET /api/projects/:id/applicants'
    )
  } catch (error) {
    return handleRouteError(error)
  }
}
