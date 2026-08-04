import {
  getCallerCompanyId,
  getCallerStudentId,
  handleRouteError,
  requireAuth,
} from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import type { Profile } from '@/types/domain'

/**
 * Returns the authenticated profile plus linked student/company ids.
 */
export async function GET() {
  try {
    const ctx = await requireAuth()

    const { data: profileRow, error } = await ctx.supabase
      .from('profiles')
      .select(
        'id, role, display_name, email, preferred_language, created_at, updated_at'
      )
      .eq('id', ctx.profileId)
      .single()

    if (error) {
      throw error
    }

    const profile: Profile = {
      id: profileRow.id,
      role: profileRow.role,
      displayName: profileRow.display_name,
      email: profileRow.email,
      preferredLanguage: profileRow.preferred_language,
      createdAt: profileRow.created_at,
      updatedAt: profileRow.updated_at,
    }

    const [studentId, companyId] = await Promise.all([
      getCallerStudentId(ctx.supabase, ctx.profileId),
      getCallerCompanyId(ctx.supabase, ctx.profileId),
    ])

    return jsonData({
      profile,
      studentId,
      companyId,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
