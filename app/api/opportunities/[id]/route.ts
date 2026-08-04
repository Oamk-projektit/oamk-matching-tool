import {
  ApiHttpError,
  handleRouteError,
  parseJsonBody,
  requireAuth,
} from '@/lib/api/auth'
import { jsonOk } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import { parseUpdateOpportunity } from '@/lib/opportunities/parse'
import {
  deleteOpportunity,
  getOpportunityById,
  updateOpportunity,
} from '@/lib/opportunities/service'

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
    return jsonOk(opportunity)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid opportunity id')
    }

    const existing = await getOpportunityById(ctx.supabase, id)
    if (!existing) {
      throw new ApiHttpError(404, 'NOT_FOUND', 'Opportunity not found')
    }
    if (ctx.role !== 'admin' && existing.teacher_id !== ctx.user.id) {
      throw new ApiHttpError(403, 'FORBIDDEN', 'Cannot update this opportunity')
    }

    const body = parseUpdateOpportunity(await parseJsonBody(request))
    const opportunity = await updateOpportunity(ctx.supabase, id, body)
    return jsonOk(opportunity)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid opportunity id')
    }

    const existing = await getOpportunityById(ctx.supabase, id)
    if (!existing) {
      throw new ApiHttpError(404, 'NOT_FOUND', 'Opportunity not found')
    }
    if (ctx.role !== 'admin' && existing.teacher_id !== ctx.user.id) {
      throw new ApiHttpError(403, 'FORBIDDEN', 'Cannot delete this opportunity')
    }

    await deleteOpportunity(ctx.supabase, id)
    return new Response(null, { status: 204 })
  } catch (error) {
    return handleRouteError(error)
  }
}
