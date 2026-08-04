import { ApiHttpError, handleRouteError, requireAuth } from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import {
  assertOwnsStudentOrAdmin,
  getStudentDetailById,
  removeStudentCourse,
} from '@/lib/students/service'

type RouteContext = { params: Promise<{ id: string; courseId: string }> }

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id, courseId } = await context.params
    if (!isUuid(id) || !isUuid(courseId)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid id')
    }

    const student = await getStudentDetailById(ctx.supabase, id)
    if (!student) throw new ApiHttpError(404, 'NOT_FOUND', 'Student not found')

    assertOwnsStudentOrAdmin({
      role: ctx.role,
      profileId: ctx.profileId,
      studentProfileId: student.profileId,
    })

    await removeStudentCourse(ctx.supabase, id, courseId)
    return jsonData({ removed: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
