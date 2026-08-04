import {
  ApiHttpError,
  handleRouteError,
  isStaff,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import { loadMatchStudent } from '@/lib/matching/load-inputs'
import { listMatchesForStudent } from '@/lib/matching/service'

type RouteContext = { params: Promise<{ studentId: string }> }

export async function GET(request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { studentId } = await context.params
    if (!isUuid(studentId)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid student id')
    }

    const student = await loadMatchStudent(ctx.supabase, studentId)
    if (!student) throw new ApiHttpError(404, 'NOT_FOUND', 'Student not found')

    // Students may only read their own matches (no peer scores/ranks).
    if (!isStaff(ctx.role) && student.profileId !== ctx.user.id) {
      throw new ApiHttpError(
        403,
        'FORBIDDEN',
        'Cannot view matches for this student'
      )
    }

    const url = new URL(request.url)
    const limitRaw = url.searchParams.get('limit')
    let limit = 10
    if (limitRaw !== null) {
      const parsed = Number(limitRaw)
      if (!Number.isInteger(parsed) || parsed < 1) {
        throw new ApiHttpError(
          400,
          'VALIDATION_ERROR',
          'limit must be a positive integer'
        )
      }
      limit = Math.min(parsed, 50)
    }

    const data = await listMatchesForStudent(ctx.supabase, studentId, limit)
    return jsonData(data, { count: data.length })
  } catch (error) {
    return handleRouteError(error)
  }
}
