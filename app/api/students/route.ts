import {
  handleRouteError,
  parseJsonBody,
  requireAuth,
  requireRole,
  ApiHttpError,
} from '@/lib/api/auth'
import { jsonOk } from '@/lib/api/response'
import { parseCreateStudent } from '@/lib/students/parse'
import { createStudent, listStudents } from '@/lib/students/service'

export async function GET() {
  try {
    const ctx = await requireAuth()
    requireRole(ctx, ['teacher', 'admin'], 'Only teachers and admins can list students')
    const data = await listStudents(ctx.supabase)
    return jsonOk({ data, meta: { count: data.length } })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAuth()
    if (ctx.role !== 'student' && ctx.role !== 'admin') {
      throw new ApiHttpError(
        403,
        'FORBIDDEN',
        'Only students (or admins) can create student profiles'
      )
    }

    const body = parseCreateStudent(await parseJsonBody(request))
    const student = await createStudent(ctx.supabase, ctx.user.id, body)
    return jsonOk(student, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
