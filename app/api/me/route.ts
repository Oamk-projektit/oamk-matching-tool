import {
  getCallerCompanyId,
  getCallerStudentId,
  handleRouteError,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'

/**
 * Returns the authenticated profile plus linked student/company ids.
 * Role comes from `profiles` (via requireAuth), never from the request body.
 */
export async function GET() {
  try {
    const ctx = await requireAuth()

    const [studentId, companyId] = await Promise.all([
      getCallerStudentId(ctx.supabase, ctx.profileId),
      getCallerCompanyId(ctx.supabase, ctx.profileId),
    ])

    return jsonData({
      profile: ctx.profile,
      studentId,
      companyId,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
