import {
  ApiHttpError,
  getCallerStudentId,
  handleRouteError,
  parseJsonBody,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { parseCreateApplication } from '@/lib/applications/parse'
import { createApplication } from '@/lib/applications/service'

export async function POST(request: Request) {
  try {
    const ctx = await requireAuth()
    if (ctx.role !== 'student') {
      throw new ApiHttpError(403, 'FORBIDDEN', 'Only students can apply')
    }

    const studentId = await getCallerStudentId(ctx.supabase, ctx.profileId)
    if (!studentId) {
      throw new ApiHttpError(
        404,
        'NOT_FOUND',
        'Create a student profile before applying'
      )
    }

    const body = parseCreateApplication(await parseJsonBody(request))
    const application = await createApplication(ctx.supabase, studentId, body)
    return jsonData(application, {}, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
