/**
 * Load denormalized student/project snapshots for the pure matching engine.
 * DB access lives here; scoring stays in calculate-match.ts.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { ApiHttpError } from '@/lib/api/auth'
import { languagesFromSkills } from '@/lib/matching/normalize'
import type {
  MatchProjectInput,
  MatchStudentInput,
} from '@/lib/matching/types'
import {
  DEFAULT_PROJECT_WEIGHTS,
  type PreferredLanguage,
  type ProjectWeights,
  type WorkMode,
} from '@/types/domain'

function mapWeights(row: Record<string, unknown> | null): ProjectWeights {
  if (!row) return { ...DEFAULT_PROJECT_WEIGHTS }
  return {
    studyCredits: Number(row.study_credits),
    requiredCourses: Number(row.required_courses),
    recommendedCourses: Number(row.recommended_courses),
    skills: Number(row.skills),
    language: Number(row.language),
    availability: Number(row.availability),
    interests: Number(row.interests),
    degreeProgramme: Number(row.degree_programme),
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null
  if (Array.isArray(value)) {
    const first = value[0]
    if (!first || typeof first !== 'object') return null
    return first as Record<string, unknown>
  }
  return value as Record<string, unknown>
}

function courseLabel(row: unknown): string {
  const nested = asRecord(asRecord(row)?.courses ?? null)
  if (!nested) return ''
  return (
    String(nested.name_fi ?? '') ||
    String(nested.name_en ?? '') ||
    String(nested.code ?? '') ||
    ''
  )
}

function skillLabel(row: unknown): string {
  const nested = asRecord(asRecord(row)?.skills ?? null)
  if (!nested) return ''
  return (
    String(nested.name_en ?? '') ||
    String(nested.name_fi ?? '') ||
    String(nested.normalized_name ?? '') ||
    ''
  )
}

function interestLabel(row: unknown): string {
  const nested = asRecord(asRecord(row)?.interests ?? null)
  if (!nested) return ''
  return (
    String(nested.name_en ?? '') ||
    String(nested.name_fi ?? '') ||
    String(nested.normalized_name ?? '') ||
    ''
  )
}

function labelsFromJoin(
  rows: unknown,
  labelFn: (row: unknown) => string
): string[] {
  if (!Array.isArray(rows)) return []
  return rows.map(labelFn).filter(Boolean)
}

export async function loadMatchStudent(
  supabase: SupabaseClient,
  studentId: string
): Promise<(MatchStudentInput & { profileId: string }) | null> {
  const { data, error } = await supabase
    .from('students')
    .select(
      `
      id,
      profile_id,
      degree_programme,
      department,
      study_credits,
      availability_start,
      availability_end,
      student_courses ( courses ( name_fi, name_en, code ) ),
      student_skills ( skills ( name_fi, name_en, normalized_name ) ),
      student_interests ( interests ( name_fi, name_en, normalized_name ) )
    `
    )
    .eq('id', studentId)
    .maybeSingle()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  if (!data) return null

  const courses = labelsFromJoin(data.student_courses, courseLabel)
  const skills = labelsFromJoin(data.student_skills, skillLabel)
  const interests = labelsFromJoin(data.student_interests, interestLabel)

  // Working languages from documented skill aliases only — never UI language.
  const languages = languagesFromSkills(skills)

  return {
    id: data.id,
    profileId: data.profile_id,
    studyCredits: data.study_credits ?? 0,
    degreeProgramme: data.degree_programme,
    department: data.department,
    languages,
    availabilityStart: data.availability_start,
    availabilityEnd: data.availability_end,
    courses,
    skills,
    interests,
  }
}

export async function loadMatchProject(
  supabase: SupabaseClient,
  projectId: string
): Promise<(MatchProjectInput & { companyId: string; status: string }) | null> {
  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      id,
      company_id,
      title,
      status,
      minimum_study_credits,
      required_language,
      project_start,
      project_end,
      work_mode,
      remote_allowed,
      department,
      project_weights ( * ),
      project_required_courses ( courses ( name_fi, name_en, code ) ),
      project_recommended_courses ( courses ( name_fi, name_en, code ) ),
      project_required_skills ( skills ( name_fi, name_en, normalized_name ) ),
      project_recommended_skills ( skills ( name_fi, name_en, normalized_name ) ),
      project_interests ( interests ( name_fi, name_en, normalized_name ) )
    `
    )
    .eq('id', projectId)
    .maybeSingle()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  if (!data) return null

  const weightsRow = Array.isArray(data.project_weights)
    ? data.project_weights[0]
    : data.project_weights

  return {
    id: data.id,
    companyId: data.company_id,
    status: data.status,
    title: data.title,
    minimumStudyCredits: data.minimum_study_credits ?? 0,
    requiredLanguage: data.required_language as PreferredLanguage,
    minimumLanguageLevel: null,
    projectStart: data.project_start,
    projectEnd: data.project_end,
    workMode: data.work_mode as WorkMode,
    remoteAllowed: Boolean(data.remote_allowed),
    department: data.department,
    requiredCourses: labelsFromJoin(
      data.project_required_courses,
      courseLabel
    ),
    recommendedCourses: labelsFromJoin(
      data.project_recommended_courses,
      courseLabel
    ),
    requiredSkills: labelsFromJoin(data.project_required_skills, skillLabel),
    recommendedSkills: labelsFromJoin(
      data.project_recommended_skills,
      skillLabel
    ),
    interests: labelsFromJoin(data.project_interests, interestLabel),
    weights: mapWeights(
      (weightsRow as Record<string, unknown> | null | undefined) ?? null
    ),
  }
}

export async function listPublishedProjectIds(
  supabase: SupabaseClient,
  projectIds?: string[]
): Promise<string[]> {
  let query = supabase.from('projects').select('id').eq('status', 'published')
  if (projectIds && projectIds.length > 0) {
    query = query.in('id', projectIds)
  }
  const { data, error } = await query
  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return (data ?? []).map((row) => row.id as string)
}

export async function listStudentIdsForProjectMatching(
  supabase: SupabaseClient,
  projectId: string
): Promise<string[]> {
  // Prefer applicants; if none, match all students (demo / cold start).
  const { data: apps, error: appError } = await supabase
    .from('applications')
    .select('student_id')
    .eq('project_id', projectId)

  if (appError) throw new ApiHttpError(500, 'INTERNAL_ERROR', appError.message)
  if (apps && apps.length > 0) {
    return [...new Set(apps.map((a) => a.student_id as string))]
  }

  const { data: students, error } = await supabase.from('students').select('id')
  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return (students ?? []).map((s) => s.id as string)
}

export async function getCompanyIdForProfile(
  supabase: SupabaseClient,
  profileId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return data?.company_id ?? null
}

/** Top 3 / project match lists: company, teacher, admin only — never students. */
export function canViewProjectMatchLists(role: string): boolean {
  return role === 'company' || role === 'teacher' || role === 'admin'
}

export async function assertCanAccessProjectMatches(
  supabase: SupabaseClient,
  projectId: string,
  ctx: { userId: string; role: string }
): Promise<{ companyId: string }> {
  const project = await loadMatchProject(supabase, projectId)
  if (!project) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'Project not found')
  }

  if (!canViewProjectMatchLists(ctx.role)) {
    throw new ApiHttpError(
      403,
      'FORBIDDEN',
      'Top candidates and project match lists are restricted to company, teacher, and admin'
    )
  }

  if (ctx.role === 'admin' || ctx.role === 'teacher') {
    return { companyId: project.companyId }
  }

  const companyId = await getCompanyIdForProfile(supabase, ctx.userId)
  if (!companyId || companyId !== project.companyId) {
    throw new ApiHttpError(
      403,
      'FORBIDDEN',
      'Cannot view matches for this project'
    )
  }
  return { companyId: project.companyId }
}
