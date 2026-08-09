import {
  ApiHttpError,
  getCallerStudentId,
  handleRouteError,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { listMatchesForStudent } from '@/lib/matching/service'

/**
 * Student-safe match list for the authenticated caller.
 * Prefer this over guessing `/api/matches/:studentId`.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireAuth()
    const studentId = await getCallerStudentId(ctx.supabase, ctx.profileId)
    if (!studentId) {
      throw new ApiHttpError(404, 'NOT_FOUND', 'Student profile not found')
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
    return jsonData(data, { count: data.length, studentId })
  } catch (error) {
    return handleRouteError(error)
  }
}
