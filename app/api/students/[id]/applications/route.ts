import {
  ApiHttpError,
  handleRouteError,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import {
  assertOwnsStudentOrAdmin,
  getStudentDetailById,
} from '@/lib/students/service'
import { listStudentApplications } from '@/lib/applications/service'
import { isStaff } from '@/lib/api/auth'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid student id')
    }

    const student = await getStudentDetailById(ctx.supabase, id)
    if (!student) throw new ApiHttpError(404, 'NOT_FOUND', 'Student not found')

    if (!isStaff(ctx.role)) {
      assertOwnsStudentOrAdmin({
        role: ctx.role,
        profileId: ctx.profileId,
        studentProfileId: student.profileId,
      })
    }

    const data = await listStudentApplications(ctx.supabase, id)
    return jsonData(data, { count: data.length })
  } catch (error) {
    return handleRouteError(error)
  }
}
