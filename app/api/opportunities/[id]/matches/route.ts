import {
  ApiHttpError,
  handleRouteError,
  requireAuth,
} from '@/lib/api/auth'
import { jsonOk } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import { listMatchesForOpportunity } from '@/lib/matching/service'
import { getOpportunityById } from '@/lib/opportunities/service'

type RouteContext = { params: Promise<{ id: string }> }

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
        'Only the opportunity owner can view matches'
      )
    }

    const data = await listMatchesForOpportunity(ctx.supabase, id)
    return jsonOk({ data, meta: { count: data.length } })
  } catch (error) {
    return handleRouteError(error)
  }
}
