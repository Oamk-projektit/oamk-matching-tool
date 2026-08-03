import type { OpportunityType, Student } from '@/types/domain'
import type { CreateStudentRequest, UpdateStudentRequest } from '@/types/api'
import {
  assertEmail,
  assertLanguage,
  assertNonNegativeInt,
  assertRequiredName,
  normalizeOpportunityTypeArray,
  normalizeStringArray,
  ValidationError,
} from '@/lib/validation'

export function parseCreateStudent(body: unknown): CreateStudentRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Body must be an object', [
      { field: 'body', message: 'Must be an object' },
    ])
  }
  const raw = body as Record<string, unknown>
  return {
    name: assertRequiredName(raw.name),
    email: assertEmail(raw.email),
    degree_program:
      raw.degree_program === undefined || raw.degree_program === null
        ? null
        : String(raw.degree_program).trim() || null,
    credits: assertNonNegativeInt(raw.credits, 'credits', 0),
    language:
      raw.language === undefined
        ? 'FI'
        : assertLanguage(raw.language),
    availability:
      raw.availability === undefined || raw.availability === null
        ? null
        : String(raw.availability).trim() || null,
    completed_courses: normalizeStringArray(
      raw.completed_courses,
      'completed_courses'
    ),
    skills: normalizeStringArray(raw.skills, 'skills'),
    interests: normalizeStringArray(raw.interests, 'interests'),
    project_preferences: normalizeOpportunityTypeArray(
      raw.project_preferences,
      'project_preferences'
    ),
  }
}

export function parseUpdateStudent(body: unknown): UpdateStudentRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Body must be an object', [
      { field: 'body', message: 'Must be an object' },
    ])
  }
  const raw = body as Record<string, unknown>
  const out: UpdateStudentRequest = {}

  if (raw.name !== undefined) out.name = assertRequiredName(raw.name)
  if (raw.email !== undefined) out.email = assertEmail(raw.email)
  if (raw.degree_program !== undefined) {
    out.degree_program =
      raw.degree_program === null
        ? null
        : String(raw.degree_program).trim() || null
  }
  if (raw.credits !== undefined) {
    out.credits = assertNonNegativeInt(raw.credits, 'credits')
  }
  if (raw.language !== undefined) out.language = assertLanguage(raw.language)
  if (raw.availability !== undefined) {
    out.availability =
      raw.availability === null
        ? null
        : String(raw.availability).trim() || null
  }
  if (raw.completed_courses !== undefined) {
    out.completed_courses = normalizeStringArray(
      raw.completed_courses,
      'completed_courses'
    )
  }
  if (raw.skills !== undefined) {
    out.skills = normalizeStringArray(raw.skills, 'skills')
  }
  if (raw.interests !== undefined) {
    out.interests = normalizeStringArray(raw.interests, 'interests')
  }
  if (raw.project_preferences !== undefined) {
    out.project_preferences = normalizeOpportunityTypeArray(
      raw.project_preferences,
      'project_preferences'
    )
  }

  return out
}

type StudentRow = {
  id: string
  user_id: string
  name: string
  email: string
  degree_program: string | null
  credits: number
  language: string
  availability: string | null
  created_at: string
  updated_at: string
  student_courses?: { course_name: string }[] | null
  student_skills?: { skill_name: string }[] | null
  student_interests?: { interest_name: string }[] | null
  student_project_preferences?: { preference: string }[] | null
}

export const STUDENT_SELECT = `
  id,
  user_id,
  name,
  email,
  degree_program,
  credits,
  language,
  availability,
  created_at,
  updated_at,
  student_courses(course_name),
  student_skills(skill_name),
  student_interests(interest_name),
  student_project_preferences(preference)
`

export function mapStudentRow(row: StudentRow): Student {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    email: row.email,
    degree_program: row.degree_program,
    credits: row.credits,
    language: row.language as Student['language'],
    availability: row.availability,
    completed_courses: (row.student_courses ?? []).map((c) => c.course_name),
    skills: (row.student_skills ?? []).map((s) => s.skill_name),
    interests: (row.student_interests ?? []).map((i) => i.interest_name),
    project_preferences: (row.student_project_preferences ?? []).map(
      (p) => p.preference as OpportunityType
    ),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}
