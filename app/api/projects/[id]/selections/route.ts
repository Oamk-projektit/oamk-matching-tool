import {
  ApiHttpError,
  getCallerCompanyId,
  handleRouteError,
  parseJsonBody,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import { parseCreateSelectionDecision } from '@/lib/selections/parse'
import {
  createOrUpdateSelection,
  listProjectSelections,
} from '@/lib/selections/service'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid project id')
    }

    const companyId = await getCallerCompanyId(ctx.supabase, ctx.profileId)
    const data = await listProjectSelections(ctx.supabase, id, {
      profileId: ctx.profileId,
      role: ctx.role,
      companyId,
    })
    return jsonData(data, { count: data.length })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid project id')
    }

    const body = parseCreateSelectionDecision(await parseJsonBody(request))
    const companyId = await getCallerCompanyId(ctx.supabase, ctx.profileId)
    const decision = await createOrUpdateSelection(ctx.supabase, id, body, {
      profileId: ctx.profileId,
      role: ctx.role,
      companyId,
    })
    return jsonData(decision, {}, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
