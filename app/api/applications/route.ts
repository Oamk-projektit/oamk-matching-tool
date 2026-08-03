import {
  ApiHttpError,
  handleRouteError,
  parseJsonBody,
  requireAuth,
} from '@/lib/api/auth'
import { jsonOk } from '@/lib/api/response'
import {
  createApplication,
  parseCreateApplication,
} from '@/lib/applications/service'

export async function POST(request: Request) {
  try {
    const ctx = await requireAuth()
    if (ctx.role !== 'student' && ctx.role !== 'admin') {
      throw new ApiHttpError(403, 'FORBIDDEN', 'Only students can apply')
    }

    const { data: student, error } = await ctx.supabase
      .from('students')
      .select('id')
      .eq('user_id', ctx.user.id)
      .maybeSingle()

    if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
    if (!student) {
      throw new ApiHttpError(
        404,
        'NOT_FOUND',
        'Create a student profile before applying'
      )
    }

    const body = parseCreateApplication(await parseJsonBody(request))
    const application = await createApplication(
      ctx.supabase,
      student.id,
      body
    )
    return jsonOk(application, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
