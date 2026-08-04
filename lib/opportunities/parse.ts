import type { MatchingWeights, Opportunity } from '@/types/legacy'
import { DEFAULT_MATCHING_WEIGHTS } from '@/types/legacy'
import type {
  CreateOpportunityRequest,
  UpdateOpportunityRequest,
} from '@/types/legacy'
import {
  assertLanguage,
  assertNonNegativeInt,
  assertOpportunityType,
  assertRequiredName,
  normalizeStringArray,
  normalizeWeights,
  ValidationError,
} from '@/lib/validation'

function assertPositiveSlots(value: unknown, fallback = 1): number {
  const n = assertNonNegativeInt(value, 'student_slots', fallback)
  if (n < 1) {
    throw new ValidationError('student_slots must be at least 1', [
      { field: 'student_slots', message: 'Must be >= 1' },
    ])
  }
  return n
}

export function parseCreateOpportunity(body: unknown): CreateOpportunityRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Body must be an object', [
      { field: 'body', message: 'Must be an object' },
    ])
  }
  const raw = body as Record<string, unknown>
  return {
    name: assertRequiredName(raw.name),
    description:
      raw.description === undefined || raw.description === null
        ? null
        : String(raw.description),
    type: assertOpportunityType(raw.type),
    required_courses: normalizeStringArray(
      raw.required_courses,
      'required_courses'
    ),
    recommended_courses: normalizeStringArray(
      raw.recommended_courses,
      'recommended_courses'
    ),
    minimum_credits: assertNonNegativeInt(
      raw.minimum_credits,
      'minimum_credits',
      0
    ),
    required_language:
      raw.required_language === undefined
        ? 'FI'
        : assertLanguage(raw.required_language, 'required_language'),
    schedule:
      raw.schedule === undefined || raw.schedule === null
        ? null
        : String(raw.schedule).trim() || null,
    duration:
      raw.duration === undefined || raw.duration === null
        ? null
        : String(raw.duration).trim() || null,
    required_skills: normalizeStringArray(
      raw.required_skills,
      'required_skills'
    ),
    student_slots: assertPositiveSlots(raw.student_slots, 1),
    weights: normalizeWeights(raw.weights),
  }
}

export function parseUpdateOpportunity(body: unknown): UpdateOpportunityRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Body must be an object', [
      { field: 'body', message: 'Must be an object' },
    ])
  }
  const raw = body as Record<string, unknown>
  const out: UpdateOpportunityRequest = {}

  if (raw.name !== undefined) out.name = assertRequiredName(raw.name)
  if (raw.description !== undefined) {
    out.description =
      raw.description === null ? null : String(raw.description)
  }
  if (raw.type !== undefined) out.type = assertOpportunityType(raw.type)
  if (raw.required_courses !== undefined) {
    out.required_courses = normalizeStringArray(
      raw.required_courses,
      'required_courses'
    )
  }
  if (raw.recommended_courses !== undefined) {
    out.recommended_courses = normalizeStringArray(
      raw.recommended_courses,
      'recommended_courses'
    )
  }
  if (raw.minimum_credits !== undefined) {
    out.minimum_credits = assertNonNegativeInt(
      raw.minimum_credits,
      'minimum_credits'
    )
  }
  if (raw.required_language !== undefined) {
    out.required_language = assertLanguage(
      raw.required_language,
      'required_language'
    )
  }
  if (raw.schedule !== undefined) {
    out.schedule =
      raw.schedule === null ? null : String(raw.schedule).trim() || null
  }
  if (raw.duration !== undefined) {
    out.duration =
      raw.duration === null ? null : String(raw.duration).trim() || null
  }
  if (raw.required_skills !== undefined) {
    out.required_skills = normalizeStringArray(
      raw.required_skills,
      'required_skills'
    )
  }
  if (raw.student_slots !== undefined) {
    out.student_slots = assertPositiveSlots(raw.student_slots)
  }
  if (raw.weights !== undefined) out.weights = normalizeWeights(raw.weights)

  return out
}

type OpportunityRow = {
  id: string
  teacher_id: string
  name: string
  description: string | null
  type: string
  minimum_credits: number
  required_language: string
  schedule: string | null
  duration: string | null
  student_slots: number
  created_at: string
  updated_at: string
  opportunity_required_courses?: { course_name: string }[] | null
  opportunity_recommended_courses?: { course_name: string }[] | null
  opportunity_required_skills?: { skill_name: string }[] | null
  opportunity_weights?:
    | {
        weight_courses: number
        weight_skills: number
        weight_language: number
        weight_schedule: number
        weight_credits: number
      }
    | {
        weight_courses: number
        weight_skills: number
        weight_language: number
        weight_schedule: number
        weight_credits: number
      }[]
    | null
}

export const OPPORTUNITY_SELECT = `
  id,
  teacher_id,
  name,
  description,
  type,
  minimum_credits,
  required_language,
  schedule,
  duration,
  student_slots,
  created_at,
  updated_at,
  opportunity_required_courses(course_name),
  opportunity_recommended_courses(course_name),
  opportunity_required_skills(skill_name),
  opportunity_weights(
    weight_courses,
    weight_skills,
    weight_language,
    weight_schedule,
    weight_credits
  )
`

function mapWeights(
  raw: OpportunityRow['opportunity_weights']
): MatchingWeights {
  const row = Array.isArray(raw) ? raw[0] : raw
  if (!row) return { ...DEFAULT_MATCHING_WEIGHTS }
  return {
    courses: Number(row.weight_courses),
    skills: Number(row.weight_skills),
    language: Number(row.weight_language),
    schedule: Number(row.weight_schedule),
    credits: Number(row.weight_credits),
  }
}

export function mapOpportunityRow(row: OpportunityRow): Opportunity {
  return {
    id: row.id,
    teacher_id: row.teacher_id,
    name: row.name,
    description: row.description,
    type: row.type as Opportunity['type'],
    required_courses: (row.opportunity_required_courses ?? []).map(
      (c) => c.course_name
    ),
    recommended_courses: (row.opportunity_recommended_courses ?? []).map(
      (c) => c.course_name
    ),
    minimum_credits: row.minimum_credits,
    required_language: row.required_language as Opportunity['required_language'],
    schedule: row.schedule,
    duration: row.duration,
    required_skills: (row.opportunity_required_skills ?? []).map(
      (s) => s.skill_name
    ),
    student_slots: row.student_slots,
    weights: mapWeights(row.opportunity_weights),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}
