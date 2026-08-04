import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { UserRole } from '@/types/domain'
import { ApiHttpError } from '@/lib/api/errors'
import { isAdmin, isCompany, isTeacherOrAdmin } from '@/lib/permissions/roles'

type DbClient = SupabaseClient<Database>

async function loadProfileRole(
  supabase: DbClient,
  profileId: string
): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', profileId)
    .maybeSingle()

  if (error) {
    throw new ApiHttpError(503, 'DATABASE_ERROR', 'Failed to load profile role')
  }
  const role = data?.role
  if (
    role === 'student' ||
    role === 'company' ||
    role === 'teacher' ||
    role === 'admin'
  ) {
    return role
  }
  return null
}

async function loadCallerCompanyId(
  supabase: DbClient,
  profileId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) {
    throw new ApiHttpError(
      503,
      'DATABASE_ERROR',
      'Failed to load company membership'
    )
  }
  return data?.company_id ?? null
}

async function loadProjectCompanyId(
  supabase: DbClient,
  projectId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('company_id')
    .eq('id', projectId)
    .maybeSingle()

  if (error) {
    throw new ApiHttpError(503, 'DATABASE_ERROR', 'Failed to load project')
  }
  return data?.company_id ?? null
}

/**
 * Company members of the owning company, or admin, may manage a project.
 * Teachers never own or manage projects in MVP.
 */
export async function canManageProject(
  supabase: DbClient,
  profileId: string,
  projectId: string
): Promise<boolean> {
  const role = await loadProfileRole(supabase, profileId)
  if (!role) return false
  if (isAdmin({ role })) return true
  if (!isCompany({ role })) return false

  const [callerCompanyId, projectCompanyId] = await Promise.all([
    loadCallerCompanyId(supabase, profileId),
    loadProjectCompanyId(supabase, projectId),
  ])

  return Boolean(
    callerCompanyId &&
      projectCompanyId &&
      callerCompanyId === projectCompanyId
  )
}

/**
 * Owning company, teachers, and admins may view applicants / Top-N lists.
 * Students must not.
 */
export async function canViewProjectApplicants(
  supabase: DbClient,
  profileId: string,
  projectId: string
): Promise<boolean> {
  const role = await loadProfileRole(supabase, profileId)
  if (!role) return false
  if (isTeacherOrAdmin({ role })) return true
  if (!isCompany({ role })) return false

  const [callerCompanyId, projectCompanyId] = await Promise.all([
    loadCallerCompanyId(supabase, profileId),
    loadProjectCompanyId(supabase, projectId),
  ])

  return Boolean(
    callerCompanyId &&
      projectCompanyId &&
      callerCompanyId === projectCompanyId
  )
}

export async function assertCanManageProject(
  supabase: DbClient,
  profileId: string,
  projectId: string
): Promise<void> {
  if (!(await canManageProject(supabase, profileId, projectId))) {
    throw new ApiHttpError(403, 'FORBIDDEN', 'Cannot manage this project')
  }
}
