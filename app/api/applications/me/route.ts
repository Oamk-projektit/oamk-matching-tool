import {
  ApiHttpError,
  getCallerStudentId,
  handleRouteError,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { listStudentApplications } from '@/lib/applications/service'

/** Convenience: own applications for the authenticated student. */
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

    const studentId = await getCallerStudentId(ctx.supabase, ctx.profileId)
    if (!studentId) {
      return jsonData([], { count: 0 })
    }

    const data = await listStudentApplications(ctx.supabase, studentId)
    return jsonData(data, { count: data.length })
  } catch (error) {
    return handleRouteError(error)
  }
}
