import { ApiHttpError, handleRouteError, requireAuth } from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import { getCourseById } from '@/lib/courses/service'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid course id')
    }

    const course = await getCourseById(ctx.supabase, id)
    if (!course) throw new ApiHttpError(404, 'NOT_FOUND', 'Course not found')
    return jsonData(course)
  } catch (error) {
    return handleRouteError(error)
  }
}
