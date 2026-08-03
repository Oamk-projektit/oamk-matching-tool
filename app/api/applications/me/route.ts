import {
  ApiHttpError,
  handleRouteError,
  requireAuth,
} from '@/lib/api/auth'
import { jsonOk } from '@/lib/api/response'
import { listMyApplications } from '@/lib/applications/service'

export async function GET() {
  try {
    const ctx = await requireAuth()
    if (ctx.role !== 'student' && ctx.role !== 'admin') {
      throw new ApiHttpError(
        403,
        'FORBIDDEN',
        'Only students can list own applications'
      )
    }

    const { data: student, error } = await ctx.supabase
      .from('students')
      .select('id')
      .eq('user_id', ctx.user.id)
      .maybeSingle()

    if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
    if (!student) {
      throw new ApiHttpError(404, 'NOT_FOUND', 'Student profile not found')
    }

    const data = await listMyApplications(ctx.supabase, student.id)
    return jsonOk({ data, meta: { count: data.length } })
  } catch (error) {
    return handleRouteError(error)
  }
}
