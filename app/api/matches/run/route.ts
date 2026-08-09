import {
  ApiHttpError,
  getCallerStudentId,
  handleRouteError,
  isStaff,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { isUuid, ValidationError } from '@/lib/validation'
import {
  parseRunMatchesBody,
  runMatchingForStudent,
} from '@/lib/matching/service'

/**
 * Run matching for the authenticated student (own profile).
 * Teachers/admins may pass `{ "studentId": "<uuid>" }` instead
 * (or use `POST /api/matches/run/:studentId`). Companies should use
 * `POST /api/projects/:id/matches`.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireAuth()

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

    const { projectIds, locale } = parseRunMatchesBody(rawBody)

    let studentId = await getCallerStudentId(ctx.supabase, ctx.profileId)

    if (!studentId) {
      const raw =
        rawBody && typeof rawBody === 'object'
          ? (rawBody as Record<string, unknown>)
          : {}
      const fromBody = raw.studentId ?? raw.student_id
      if (typeof fromBody !== 'string' || !isUuid(fromBody)) {
        throw new ApiHttpError(
          400,
          'VALIDATION_ERROR',
          'studentId is required when the caller has no student profile'
        )
      }
      if (!isStaff(ctx.role)) {
        throw new ApiHttpError(
          403,
          'FORBIDDEN',
          'Cannot run matching for another student'
        )
      }
      studentId = fromBody
    }

    const data = await runMatchingForStudent(
      ctx.supabase,
      studentId,
      projectIds,
      locale
    )

    return jsonData(data, { count: data.length, studentId })
  } catch (error) {
    return handleRouteError(error)
  }
}
