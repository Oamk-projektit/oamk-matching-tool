import {
  ApiHttpError,
  getCallerCompanyId,
  handleRouteError,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import { mapApplication } from '@/lib/applications/parse'
import {
  shortlistApplication,
  unshortlistApplication,
} from '@/lib/selections/service'
import {
  notifyApplicationShortlisted,
  notifyApplicationStatusChanged,
} from '@/lib/notifications/emit'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid application id')
    }

    const companyId = await getCallerCompanyId(ctx.supabase, ctx.profileId)
    const result = await shortlistApplication(ctx.supabase, id, {
      profileId: ctx.profileId,
      role: ctx.role,
      companyId,
    })

    if (result.changed) {
      await notifyApplicationShortlisted({
        studentProfileId: result.studentProfileId,
        applicationId: id,
        projectTitle: result.projectTitle,
      }).catch(() => undefined)
    }

    return jsonData(mapApplication(result.application), {}, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid application id')
    }

    const companyId = await getCallerCompanyId(ctx.supabase, ctx.profileId)
    const result = await unshortlistApplication(ctx.supabase, id, {
      profileId: ctx.profileId,
      role: ctx.role,
      companyId,
    })

    if (result.changed) {
      await notifyApplicationStatusChanged({
        studentProfileId: result.studentProfileId,
        applicationId: id,
        projectTitle: result.projectTitle,
        status: 'under_review',
      }).catch(() => undefined)
    }

    return jsonData(mapApplication(result.application))
  } catch (error) {
    return handleRouteError(error)
  }
}
