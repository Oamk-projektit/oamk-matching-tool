import type {
  ProjectWeights,
  ScoreBreakdown,
  SelectionDecision,
  SelectionDecisionValue,
  SelectionMatchSnapshot,
} from '@/types/domain'
import type { CreateSelectionDecisionRequest } from '@/types/api'
import { requireObject } from '@/lib/validation/domain'
import { isUuid, ValidationError } from '@/lib/validation'
import { DEFAULT_PROJECT_WEIGHTS } from '@/types/domain'

export function parseCreateSelectionDecision(
  body: unknown
): CreateSelectionDecisionRequest {
  const raw = requireObject(body)

  if (!isUuid(raw.studentId)) {
    throw new ValidationError('studentId must be a UUID', [
      { field: 'studentId', message: 'Must be a UUID' },
    ])
  }
  if (!isUuid(raw.applicationId)) {
    throw new ValidationError('applicationId must be a UUID', [
      { field: 'applicationId', message: 'Must be a UUID' },
    ])
  }
  if (raw.decision !== 'selected' && raw.decision !== 'not_selected') {
    throw new ValidationError('decision must be selected or not_selected', [
      { field: 'decision', message: 'Must be selected or not_selected' },
    ])
  }

  let reason: string | null | undefined
  if (raw.reason === undefined) {
    reason = undefined
  } else if (raw.reason === null) {
    reason = null
  } else if (typeof raw.reason === 'string') {
    const trimmed = raw.reason.trim()
    reason = trimmed.length > 0 ? trimmed : null
  } else {
    throw new ValidationError('reason must be a string or null', [
      { field: 'reason', message: 'Must be a string or null' },
    ])
  }

  return {
    studentId: raw.studentId,
    applicationId: raw.applicationId,
    decision: raw.decision as SelectionDecisionValue,
    reason,
  }
}

type SelectionRow = {
  id: string
  project_id: string
  student_id: string
  application_id: string
  decision: string
  decided_by: string
  reason: string | null
  decided_at: string
  match_id?: string | null
  match_snapshot?: unknown
  weights_snapshot?: unknown
  algorithm_rank?: number | null
}

function asScoreBreakdown(value: unknown): ScoreBreakdown {
  const raw =
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const num = (key: keyof ScoreBreakdown) =>
    typeof raw[key] === 'number' ? (raw[key] as number) : 0
  return {
    studyCredits: num('studyCredits'),
    requiredCourses: num('requiredCourses'),
    recommendedCourses: num('recommendedCourses'),
    skills: num('skills'),
    language: num('language'),
    availability: num('availability'),
    interests: num('interests'),
    degreeProgramme: num('degreeProgramme'),
  }
}

function asWeights(value: unknown): ProjectWeights | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const keys = Object.keys(DEFAULT_PROJECT_WEIGHTS) as (keyof ProjectWeights)[]
  const out = { ...DEFAULT_PROJECT_WEIGHTS }
  for (const key of keys) {
    if (typeof raw[key] === 'number') out[key] = raw[key] as number
  }
  return out
}

function asMatchSnapshot(value: unknown): SelectionMatchSnapshot | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const stringArray = (key: string) =>
    Array.isArray(raw[key])
      ? (raw[key] as unknown[]).filter((x): x is string => typeof x === 'string')
      : undefined
  return {
    totalScore: typeof raw.totalScore === 'number' ? raw.totalScore : 0,
    scoreBreakdown: asScoreBreakdown(raw.scoreBreakdown),
    explanation: typeof raw.explanation === 'string' ? raw.explanation : '',
    matchedCourses: stringArray('matchedCourses'),
    missingRequiredCourses: stringArray('missingRequiredCourses'),
    matchedSkills: stringArray('matchedSkills'),
    missingRequiredSkills: stringArray('missingRequiredSkills'),
  }
}

export function mapSelectionDecision(row: SelectionRow): SelectionDecision {
  return {
    id: row.id,
    projectId: row.project_id,
    studentId: row.student_id,
    applicationId: row.application_id,
    decision: row.decision as SelectionDecisionValue,
    decidedBy: row.decided_by,
    reason: row.reason,
    decidedAt: row.decided_at,
    matchId: row.match_id ?? null,
    matchSnapshot: asMatchSnapshot(row.match_snapshot),
    weightsSnapshot: asWeights(row.weights_snapshot),
    algorithmRank: row.algorithm_rank ?? null,
  }
}

/**
 * 1-based rank for a student among project matches.
 * Higher totalScore ranks first; ties broken by studentId ascending.
 */
export function computeAlgorithmRank(
  studentId: string,
  matches: { studentId: string; totalScore: number }[]
): number | null {
  if (matches.length === 0) return null
  const sorted = [...matches].sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
    return a.studentId.localeCompare(b.studentId)
  })
  const index = sorted.findIndex((m) => m.studentId === studentId)
  return index >= 0 ? index + 1 : null
}

export function buildMatchSnapshotFromRow(row: {
  id: string
  total_score: number
  score_breakdown: unknown
  explanation: string
  matched_courses?: string[] | null
  missing_required_courses?: string[] | null
  matched_skills?: string[] | null
  missing_required_skills?: string[] | null
  weights_snapshot?: unknown
}): {
  matchId: string
  matchSnapshot: SelectionMatchSnapshot
  weightsSnapshot: ProjectWeights | null
} {
  const breakdownRaw =
    row.score_breakdown && typeof row.score_breakdown === 'object'
      ? (row.score_breakdown as Record<string, unknown>)
      : {}

  // DB may store snake_case or camelCase depending on writer.
  const camelBreakdown: ScoreBreakdown = {
    studyCredits:
      (breakdownRaw.studyCredits as number) ??
      (breakdownRaw.study_credits as number) ??
      0,
    requiredCourses:
      (breakdownRaw.requiredCourses as number) ??
      (breakdownRaw.required_courses as number) ??
      0,
    recommendedCourses:
      (breakdownRaw.recommendedCourses as number) ??
      (breakdownRaw.recommended_courses as number) ??
      0,
    skills: (breakdownRaw.skills as number) ?? 0,
    language: (breakdownRaw.language as number) ?? 0,
    availability: (breakdownRaw.availability as number) ?? 0,
    interests: (breakdownRaw.interests as number) ?? 0,
    degreeProgramme:
      (breakdownRaw.degreeProgramme as number) ??
      (breakdownRaw.degree_programme as number) ??
      0,
  }

  return {
    matchId: row.id,
    matchSnapshot: {
      totalScore: row.total_score,
      scoreBreakdown: camelBreakdown,
      explanation: row.explanation,
      matchedCourses: row.matched_courses ?? [],
      missingRequiredCourses: row.missing_required_courses ?? [],
      matchedSkills: row.matched_skills ?? [],
      missingRequiredSkills: row.missing_required_skills ?? [],
    },
    weightsSnapshot: asWeights(row.weights_snapshot),
  }
}
