import {
  ApiHttpError,
  handleRouteError,
  isStaff,
  requireAuth,
} from '@/lib/api/auth'
import { jsonOk } from '@/lib/api/response'
import { isUuid, ValidationError } from '@/lib/validation'
import { getStudentById } from '@/lib/students/service'
import {
  parseRunMatchesBody,
  runMatchingForStudent,
} from '@/lib/matching/service'

type RouteContext = { params: Promise<{ studentId: string }> }

export async function POST(request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { studentId } = await context.params
    if (!isUuid(studentId)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid student id')
    }

    const student = await getStudentById(ctx.supabase, studentId)
    if (!student) throw new ApiHttpError(404, 'NOT_FOUND', 'Student not found')

    if (!isStaff(ctx.role) && student.user_id !== ctx.user.id) {
      throw new ApiHttpError(
        403,
        'FORBIDDEN',
        'Cannot run matching for this student'
      )
    }

    const text = await request.text()
    let rawBody: unknown = {}
    if (text.trim()) {
      try {
        rawBody = JSON.parse(text)
      } catch {
        throw new ValidationError('Invalid JSON body', [
          { field: 'body', message: 'Must be valid JSON' },
        ])
      }
    }

    const { opportunity_ids } = parseRunMatchesBody(rawBody)
    const data = await runMatchingForStudent(
      ctx.supabase,
      studentId,
      opportunity_ids
    )

    return jsonOk({
      data,
      meta: { count: data.length, student_id: studentId },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
