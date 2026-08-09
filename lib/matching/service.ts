/**
 * Matching persistence and orchestration.
 * Scoring stays in calculate-match; this module loads inputs and upserts results.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Match, PreferredLanguage } from '@/types/domain'
import type { TopMatchItem } from '@/types/api'
import { ApiHttpError } from '@/lib/api/auth'
import { isUuid, ValidationError } from '@/lib/validation'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateMatch } from '@/lib/matching/calculate-match'
import { rankMatches, topCandidates } from '@/lib/matching/rank-matches'
import type { CalculatedMatch, MatchLocale } from '@/lib/matching/types'
import {
  assertCanAccessProjectMatches,
  listPublishedProjectIds,
  listStudentIdsForProjectMatching,
  loadMatchProject,
  loadMatchStudent,
} from '@/lib/matching/load-inputs'

type MatchRow = {
  id: string
  project_id: string
  student_id: string
  total_score: number
  score_breakdown: Match['scoreBreakdown']
  matched_courses: string[]
  missing_required_courses: string[]
  matched_skills: string[]
  missing_required_skills: string[]
  explanation: string
  weights_snapshot: Match['weightsSnapshot']
  calculated_at: string
}

export function mapMatchRow(row: MatchRow): Match {
  return {
    id: row.id,
    projectId: row.project_id,
    studentId: row.student_id,
    totalScore: row.total_score,
    scoreBreakdown: row.score_breakdown,
    matchedCourses: row.matched_courses ?? [],
    missingRequiredCourses: row.missing_required_courses ?? [],
    matchedSkills: row.matched_skills ?? [],
    missingRequiredSkills: row.missing_required_skills ?? [],
    explanation: row.explanation ?? '',
    weightsSnapshot: row.weights_snapshot,
    calculatedAt: row.calculated_at,
  }
}

export function calculatedToPersistPayload(match: CalculatedMatch) {
  return {
    student_id: match.studentId,
    project_id: match.projectId,
    total_score: match.totalScore,
    score_breakdown: match.scoreBreakdown,
    matched_courses: match.matchedRequiredCourses,
    missing_required_courses: match.missingRequiredCourses,
    matched_skills: match.matchedRequiredSkills,
    missing_required_skills: match.missingRequiredSkills,
    explanation: match.explanation,
    weights_snapshot: match.weightsSnapshot,
    calculated_at: match.calculatedAt,
  }
}

export function parseRunMatchesBody(body: unknown): {
  projectIds?: string[]
  locale: MatchLocale
} {
  if (body === undefined || body === null || body === '') {
    return { locale: 'en' }
  }
  if (typeof body !== 'object') {
    throw new ValidationError('Body must be an object', [
      { field: 'body', message: 'Must be an object' },
    ])
  }
  const raw = body as Record<string, unknown>
  let locale: MatchLocale = 'en'
  if (raw.locale !== undefined) {
    if (raw.locale !== 'en' && raw.locale !== 'fi') {
      throw new ValidationError('locale must be en or fi', [
        { field: 'locale', message: 'Must be en or fi' },
      ])
    }
    locale = raw.locale
  }

  const idsRaw = raw.projectIds ?? raw.project_ids
  if (idsRaw === undefined) return { locale }
  if (!Array.isArray(idsRaw)) {
    throw new ValidationError('projectIds must be an array', [
      { field: 'projectIds', message: 'Must be an array of UUIDs' },
    ])
  }
  const projectIds = idsRaw.map((id, index) => {
    if (!isUuid(id)) {
      throw new ValidationError(`projectIds[${index}] must be a UUID`, [
        { field: `projectIds[${index}]`, message: 'Must be a UUID' },
      ])
    }
    return id as string
  })
  return { projectIds, locale }
}

async function upsertCalculatedMatch(
  admin: SupabaseClient,
  match: CalculatedMatch
): Promise<Match> {
  const { data, error } = await admin
    .from('matches')
    .upsert(calculatedToPersistPayload(match), {
      onConflict: 'student_id,project_id',
    })
    .select('*')
    .single()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return mapMatchRow(data as MatchRow)
}

export async function runMatchingForStudent(
  supabase: SupabaseClient,
  studentId: string,
  projectIds?: string[],
  locale: PreferredLanguage = 'en'
): Promise<Match[]> {
  const student = await loadMatchStudent(supabase, studentId)
  if (!student) throw new ApiHttpError(404, 'NOT_FOUND', 'Student not found')

  const ids = await listPublishedProjectIds(supabase, projectIds)
  const computed: CalculatedMatch[] = []

  for (const projectId of ids) {
    const project = await loadMatchProject(supabase, projectId)
    if (!project) continue
    computed.push(calculateMatch(student, project, project.weights, locale))
  }

  const ranked = rankMatches(computed)
  const admin = createAdminClient()
  const persisted: Match[] = []
  for (const match of ranked) {
    persisted.push(await upsertCalculatedMatch(admin, match))
  }

  return persisted.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
    return a.projectId.localeCompare(b.projectId)
  })
}

export async function runMatchingForProject(
  supabase: SupabaseClient,
  projectId: string,
  locale: PreferredLanguage = 'en'
): Promise<Match[]> {
  const project = await loadMatchProject(supabase, projectId)
  if (!project) throw new ApiHttpError(404, 'NOT_FOUND', 'Project not found')

  const studentIds = await listStudentIdsForProjectMatching(supabase, projectId)
  const computed: CalculatedMatch[] = []

  for (const studentId of studentIds) {
    const student = await loadMatchStudent(supabase, studentId)
    if (!student) continue
    computed.push(calculateMatch(student, project, project.weights, locale))
  }

  const ranked = rankMatches(computed)
  const admin = createAdminClient()
  const persisted: Match[] = []
  for (const match of ranked) {
    persisted.push(await upsertCalculatedMatch(admin, match))
  }

  return persisted.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
    return a.studentId.localeCompare(b.studentId)
  })
}

export async function listMatchesForStudent(
  supabase: SupabaseClient,
  studentId: string,
  limit = 10
): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('student_id', studentId)
    .order('total_score', { ascending: false })
    .limit(limit)

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return (data ?? []).map((row) => mapMatchRow(row as MatchRow))
}

export async function listMatchesForProject(
  supabase: SupabaseClient,
  projectId: string
): Promise<Match[]> {
  const project = await loadMatchProject(supabase, projectId)
  if (!project) throw new ApiHttpError(404, 'NOT_FOUND', 'Project not found')

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('project_id', projectId)
    .order('total_score', { ascending: false })

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return (data ?? []).map((row) => mapMatchRow(row as MatchRow))
}

export async function listTopCandidatesForProject(
  supabase: SupabaseClient,
  projectId: string,
  limit = 3
): Promise<TopMatchItem[]> {
  const project = await loadMatchProject(supabase, projectId)
  if (!project) throw new ApiHttpError(404, 'NOT_FOUND', 'Project not found')

  const safeLimit = Math.min(Math.max(limit, 1), 10)
  const matches = await listMatchesForProject(supabase, projectId)
  const ranked = topCandidates(
    matches.map((match) => ({
      studentId: match.studentId,
      projectId: match.projectId,
      totalScore: match.totalScore,
      scoreBreakdown: match.scoreBreakdown,
      matchedRequirements: [],
      missingRequirements: [],
      matchedRequiredCourses: match.matchedCourses,
      missingRequiredCourses: match.missingRequiredCourses,
      matchedRecommendedCourses: [],
      missingRecommendedCourses: [],
      matchedRequiredSkills: match.matchedSkills,
      missingRequiredSkills: match.missingRequiredSkills,
      matchedRecommendedSkills: [],
      missingRecommendedSkills: [],
      matchedInterests: [],
      missingInterests: [],
      language: { ratio: 0, matched: false },
      availability: { ratio: 0, status: 'unknown' as const },
      weightsSnapshot: match.weightsSnapshot,
      explanation: match.explanation,
      calculatedAt: match.calculatedAt,
      ratios: {
        studyCredits: 0,
        requiredCourses: 0,
        recommendedCourses: 0,
        skills: 0,
        language: 0,
        availability: 0,
        interests: 0,
        degreeProgramme: 0,
      },
    })),
    safeLimit
  )

  const items: TopMatchItem[] = []
  for (const rankedMatch of ranked) {
    const match = matches.find((m) => m.studentId === rankedMatch.studentId)!
    const { data: studentRow, error: studentError } = await supabase
      .from('students')
      .select('id, degree_programme, study_credits, profiles ( display_name, email )')
      .eq('id', rankedMatch.studentId)
      .maybeSingle()

    if (studentError) {
      throw new ApiHttpError(500, 'INTERNAL_ERROR', studentError.message)
    }

    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id')
      .eq('project_id', projectId)
      .eq('student_id', rankedMatch.studentId)
      .maybeSingle()

    if (appError) {
      throw new ApiHttpError(500, 'INTERNAL_ERROR', appError.message)
    }

    const profile = studentRow?.profiles as
      | { display_name?: string; email?: string }
      | { display_name?: string; email?: string }[]
      | null
    const profileRow = Array.isArray(profile) ? profile[0] : profile

    items.push({
      rank: rankedMatch.rank,
      match,
      student: {
        id: studentRow?.id ?? rankedMatch.studentId,
        degreeProgramme: studentRow?.degree_programme ?? null,
        studyCredits: studentRow?.study_credits ?? 0,
      },
      profile: {
        displayName: profileRow?.display_name ?? '',
        email: profileRow?.email ?? '',
      },
      applicationId: application?.id ?? null,
    })
  }

  return items
}

export { assertCanAccessProjectMatches }
