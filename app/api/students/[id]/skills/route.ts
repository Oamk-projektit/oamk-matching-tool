import {
  ApiHttpError,
  handleRouteError,
  parseJsonBody,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { isUuid } from '@/lib/validation'
import { parseAddStudentSkill } from '@/lib/students/parse'
import {
  addStudentSkill,
  assertOwnsStudentOrAdmin,
  getStudentDetailById,
  resolveSkillId,
} from '@/lib/students/service'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth()
    const { id } = await context.params
    if (!isUuid(id)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Invalid student id')
    }

    const student = await getStudentDetailById(ctx.supabase, id)
    if (!student) throw new ApiHttpError(404, 'NOT_FOUND', 'Student not found')

    assertOwnsStudentOrAdmin({
      role: ctx.role,
      profileId: ctx.profileId,
      studentProfileId: student.profileId,
    })

    const body = parseAddStudentSkill(await parseJsonBody(request))
    const skillId = await resolveSkillId(ctx.supabase, body)
    const link = await addStudentSkill(ctx.supabase, id, skillId)
    return jsonData(link, {}, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
