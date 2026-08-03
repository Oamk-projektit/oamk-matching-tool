import { handleRouteError, requireAuth } from '@/lib/api/auth'
import { jsonOk } from '@/lib/api/response'

/**
 * Returns the authenticated user, role, and linked student id when present.
 */
export async function GET() {
  try {
    const ctx = await requireAuth()

    const { data: student } = await ctx.supabase
      .from('students')
      .select('id')
      .eq('user_id', ctx.user.id)
      .maybeSingle()

    return jsonOk({
      user_id: ctx.user.id,
      email: ctx.user.email ?? null,
      role: ctx.role,
      student_id: student?.id ?? null,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
