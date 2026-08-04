import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { UserRole } from '@/types/domain'
import { ApiHttpError } from '@/lib/api/errors'
import { isAdmin, isTeacherOrAdmin } from '@/lib/permissions/roles'
import { canViewProjectApplicants } from '@/lib/permissions/projects'

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

/**
 * A student may manage their own student row; admin may manage any.
 * Teachers have oversight read paths elsewhere, not profile mutation here.
 */
export async function canManageStudent(
  supabase: DbClient,
  profileId: string,
  studentId: string
): Promise<boolean> {
  const role = await loadProfileRole(supabase, profileId)
  if (!role) return false
  if (isAdmin({ role })) return true

  const { data, error } = await supabase
    .from('students')
    .select('profile_id')
    .eq('id', studentId)
    .maybeSingle()

  if (error) {
    throw new ApiHttpError(503, 'DATABASE_ERROR', 'Failed to load student')
  }
  return data?.profile_id === profileId
}

/**
 * Students see only their own match rows.
 * Company (own project), teacher, and admin may view project match lists.
 */
export async function canViewMatch(
  supabase: DbClient,
  profileId: string,
  matchId: string
): Promise<boolean> {
  const role = await loadProfileRole(supabase, profileId)
  if (!role) return false

  const { data: match, error } = await supabase
    .from('matches')
    .select('id, student_id, project_id')
    .eq('id', matchId)
    .maybeSingle()

  if (error) {
    throw new ApiHttpError(503, 'DATABASE_ERROR', 'Failed to load match')
  }
  if (!match) return false

  if (isTeacherOrAdmin({ role })) return true

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('profile_id')
    .eq('id', match.student_id)
    .maybeSingle()

  if (studentError) {
    throw new ApiHttpError(503, 'DATABASE_ERROR', 'Failed to load student')
  }

  if (student?.profile_id === profileId) return true

  return canViewProjectApplicants(supabase, profileId, match.project_id)
}

export async function assertCanManageStudent(
  supabase: DbClient,
  profileId: string,
  studentId: string
): Promise<void> {
  if (!(await canManageStudent(supabase, profileId, studentId))) {
    throw new ApiHttpError(403, 'FORBIDDEN', 'Cannot manage this student')
  }
}
