import {
  ApiHttpError,
  getCallerStudentId,
  handleRouteError,
  parseJsonBody,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import {
  assertCanSubmitApplication,
  parseCreateApplication,
} from '@/lib/applications/parse'
import { createApplication } from '@/lib/applications/service'

export async function POST(request: Request) {
  try {
    const ctx = await requireAuth()
    assertCanSubmitApplication(ctx.role)

    const studentId = await getCallerStudentId(ctx.supabase, ctx.profileId)
    if (!studentId) {
      throw new ApiHttpError(
        404,
        'NOT_FOUND',
        'Create a student profile before applying'
      )
    }

    const body = parseCreateApplication(await parseJsonBody(request))
    // studentId always comes from the authenticated session, never the body.
    const application = await createApplication(ctx.supabase, studentId, body)
    return jsonData(application, {}, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
