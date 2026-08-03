import {
  ApiHttpError,
  handleRouteError,
  isStaff,
  parseJsonBody,
  requireAuth,
} from '@/lib/api/auth'
import { jsonOk } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import { parseUpdateStudent } from '@/lib/students/parse'
import { getStudentById, updateStudent } from '@/lib/students/service'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid student id')
    }

    const student = await getStudentById(ctx.supabase, id)
    if (!student) throw new ApiHttpError(404, 'NOT_FOUND', 'Student not found')

    if (!isStaff(ctx.role) && student.user_id !== ctx.user.id) {
      throw new ApiHttpError(403, 'FORBIDDEN', 'Cannot view this student')
    }

    return jsonOk(student)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid student id')
    }

    const existing = await getStudentById(ctx.supabase, id)
    if (!existing) throw new ApiHttpError(404, 'NOT_FOUND', 'Student not found')

    if (ctx.role !== 'admin' && existing.user_id !== ctx.user.id) {
      throw new ApiHttpError(403, 'FORBIDDEN', 'Cannot update this student')
    }

    const body = parseUpdateStudent(await parseJsonBody(request))
    const student = await updateStudent(ctx.supabase, id, body)
    return jsonOk(student)
  } catch (error) {
    return handleRouteError(error)
  }
}
