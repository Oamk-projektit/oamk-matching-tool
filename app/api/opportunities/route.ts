import {
  handleRouteError,
  parseJsonBody,
  requireAuth,
  requireRole,
} from '@/lib/api/auth'
import { jsonOk } from '@/lib/api/response'
import { assertOpportunityType } from '@/lib/validation'
import { parseCreateOpportunity } from '@/lib/opportunities/parse'
import {
  createOpportunity,
  listOpportunities,
} from '@/lib/opportunities/service'
import type { OpportunityType } from '@/types/domain'

export async function GET(request: Request) {
  try {
    const ctx = await requireAuth()
    const url = new URL(request.url)
    const typeParam = url.searchParams.get('type')
    const q = url.searchParams.get('q') ?? undefined

    let type: OpportunityType | undefined
    if (typeParam) {
      type = assertOpportunityType(typeParam, 'type')
    }

    const data = await listOpportunities(ctx.supabase, { type, q })
    return jsonOk({ data, meta: { count: data.length } })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAuth()
    requireRole(
      ctx,
      ['teacher', 'admin'],
      'Only teachers and admins can create opportunities'
    )

    const body = parseCreateOpportunity(await parseJsonBody(request))
    const opportunity = await createOpportunity(
      ctx.supabase,
      ctx.user.id,
      body
    )
    return jsonOk(opportunity, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
