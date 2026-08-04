import {
  ApiHttpError,
  getCallerCompanyId,
  handleRouteError,
  parseJsonBody,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import { parseUpdateStudent } from '@/lib/students/parse'
import {
  assertCanUpdateStudent,
  assertCanViewStudent,
  companyHasApplicant,
  getStudentDetailById,
  shapeStudentForViewer,
  updateStudent,
} from '@/lib/students/service'

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

    let appliedToCallerProject = false
    if (ctx.role === 'company') {
      const companyId = await getCallerCompanyId(ctx.supabase, ctx.profileId)
      if (companyId) {
        appliedToCallerProject = await companyHasApplicant(
          ctx.supabase,
          id,
          companyId
        )
      }
    }

    const access = assertCanViewStudent({
      role: ctx.role,
      profileId: ctx.profileId,
      studentProfileId: student.profileId,
      appliedToCallerProject,
    })

    return jsonData(shapeStudentForViewer(student, access))
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

    const existing = await getStudentDetailById(ctx.supabase, id)
    if (!existing) throw new ApiHttpError(404, 'NOT_FOUND', 'Student not found')

    assertCanUpdateStudent({
      role: ctx.role,
      profileId: ctx.profileId,
      studentProfileId: existing.profileId,
    })

    const body = parseUpdateStudent(await parseJsonBody(request))
    const student = await updateStudent(ctx.supabase, id, body)
    return jsonData(student)
  } catch (error) {
    return handleRouteError(error)
  }
}
