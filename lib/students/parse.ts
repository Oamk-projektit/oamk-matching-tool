import type { Student } from '@/types/domain'
import type {
  AddStudentCourseRequest,
  AddStudentInterestRequest,
  AddStudentSkillRequest,
  CreateStudentRequest,
  StudentDetail,
  UpdateStudentRequest,
} from '@/types/api'
import {
  assertCompletionStatus,
  assertNonNegativeInt,
  assertOptionalDate,
  assertOptionalString,
  normalizeProjectTypeArray,
  normalizeUuidArray,
  requireObject,
} from '@/lib/validation/domain'
import { isUuid, ValidationError } from '@/lib/validation'
import { displayCatalogLabel } from '@/lib/catalogs/normalize'

export function parseCreateStudent(body: unknown): CreateStudentRequest {
  const raw = requireObject(body)
  return {
    degreeProgramme: assertOptionalString(raw.degreeProgramme, 'degreeProgramme') ?? null,
    department: assertOptionalString(raw.department, 'department') ?? null,
    studyCredits: assertNonNegativeInt(raw.studyCredits, 'studyCredits', 0),
    availabilityStart:
      assertOptionalDate(raw.availabilityStart, 'availabilityStart') ?? null,
    availabilityEnd:
      assertOptionalDate(raw.availabilityEnd, 'availabilityEnd') ?? null,
    preferredProjectTypes: normalizeProjectTypeArray(
      raw.preferredProjectTypes,
      'preferredProjectTypes'
    ),
    courseIds: normalizeUuidArray(raw.courseIds, 'courseIds'),
    skillIds: normalizeUuidArray(raw.skillIds, 'skillIds'),
    interestIds: normalizeUuidArray(raw.interestIds, 'interestIds'),
  }
}

export function parseUpdateStudent(body: unknown): UpdateStudentRequest {
  const raw = requireObject(body)
  const out: UpdateStudentRequest = {}

  if (raw.degreeProgramme !== undefined) {
    out.degreeProgramme = assertOptionalString(
      raw.degreeProgramme,
      'degreeProgramme'
    ) as string | null
  }
  if (raw.department !== undefined) {
    out.department = assertOptionalString(
      raw.department,
      'department'
    ) as string | null
  }
  if (raw.studyCredits !== undefined) {
    out.studyCredits = assertNonNegativeInt(raw.studyCredits, 'studyCredits')
  }
  if (raw.availabilityStart !== undefined) {
    out.availabilityStart = assertOptionalDate(
      raw.availabilityStart,
      'availabilityStart'
    ) as string | null
  }
  if (raw.availabilityEnd !== undefined) {
    out.availabilityEnd = assertOptionalDate(
      raw.availabilityEnd,
      'availabilityEnd'
    ) as string | null
  }
  if (raw.preferredProjectTypes !== undefined) {
    out.preferredProjectTypes = normalizeProjectTypeArray(
      raw.preferredProjectTypes,
      'preferredProjectTypes'
    )
  }
  if (raw.courseIds !== undefined) {
    out.courseIds = normalizeUuidArray(raw.courseIds, 'courseIds')
  }
  if (raw.skillIds !== undefined) {
    out.skillIds = normalizeUuidArray(raw.skillIds, 'skillIds')
  }
  if (raw.interestIds !== undefined) {
    out.interestIds = normalizeUuidArray(raw.interestIds, 'interestIds')
  }

  return out
}

export function parseAddStudentCourse(body: unknown): AddStudentCourseRequest {
  const raw = requireObject(body)
  if (!isUuid(raw.courseId)) {
    throw new ValidationError('courseId must be a UUID', [
      { field: 'courseId', message: 'Must be a UUID' },
    ])
  }
  return {
    courseId: raw.courseId,
    completionStatus:
      raw.completionStatus === undefined
        ? 'completed'
        : assertCompletionStatus(raw.completionStatus),
    completedAt:
      assertOptionalDate(raw.completedAt, 'completedAt') ?? null,
    grade: assertOptionalString(raw.grade, 'grade') ?? null,
    verified: raw.verified === undefined ? false : Boolean(raw.verified),
  }
}

export function parseAddStudentSkill(body: unknown): AddStudentSkillRequest {
  const raw = requireObject(body)
  const out: AddStudentSkillRequest = {}
  if (raw.skillId !== undefined) {
    if (!isUuid(raw.skillId)) {
      throw new ValidationError('skillId must be a UUID', [
        { field: 'skillId', message: 'Must be a UUID' },
      ])
    }
    out.skillId = raw.skillId
  }
  if (raw.name !== undefined) {
    if (typeof raw.name !== 'string' || !raw.name.trim()) {
      throw new ValidationError('name must be a non-empty string', [
        { field: 'name', message: 'Required' },
      ])
    }
    out.name = displayCatalogLabel(raw.name)
  }
  if (!out.skillId && !out.name) {
    throw new ValidationError('skillId or name is required', [
      { field: 'skillId', message: 'Provide skillId or name' },
    ])
  }
  return out
}

export function parseAddStudentInterest(
  body: unknown
): AddStudentInterestRequest {
  const raw = requireObject(body)
  const out: AddStudentInterestRequest = {}
  if (raw.interestId !== undefined) {
    if (!isUuid(raw.interestId)) {
      throw new ValidationError('interestId must be a UUID', [
        { field: 'interestId', message: 'Must be a UUID' },
      ])
    }
    out.interestId = raw.interestId
  }
  if (raw.name !== undefined) {
    if (typeof raw.name !== 'string' || !raw.name.trim()) {
      throw new ValidationError('name must be a non-empty string', [
        { field: 'name', message: 'Required' },
      ])
    }
    out.name = displayCatalogLabel(raw.name)
  }
  if (!out.interestId && !out.name) {
    throw new ValidationError('interestId or name is required', [
      { field: 'interestId', message: 'Provide interestId or name' },
    ])
  }
  return out
}

type StudentRow = {
  id: string
  profile_id: string
  degree_programme: string | null
  department: string | null
  study_credits: number
  availability_start: string | null
  availability_end: string | null
  preferred_project_types: string[] | null
  created_at: string
  updated_at: string
  student_courses?: { course_id: string }[] | null
  student_skills?: { skill_id: string }[] | null
  student_interests?: { interest_id: string }[] | null
}

export const STUDENT_SELECT = `
  id,
  profile_id,
  degree_programme,
  department,
  study_credits,
  availability_start,
  availability_end,
  preferred_project_types,
  created_at,
  updated_at,
  student_courses(course_id),
  student_skills(skill_id),
  student_interests(interest_id)
`

export function mapStudentRow(row: StudentRow): Student {
  return {
    id: row.id,
    profileId: row.profile_id,
    degreeProgramme: row.degree_programme,
    department: row.department,
    studyCredits: row.study_credits,
    availabilityStart: row.availability_start,
    availabilityEnd: row.availability_end,
    preferredProjectTypes: (row.preferred_project_types ?? []) as Student['preferredProjectTypes'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapStudentDetail(row: StudentRow): StudentDetail {
  return {
    ...mapStudentRow(row),
    courseIds: (row.student_courses ?? []).map((c) => c.course_id),
    skillIds: (row.student_skills ?? []).map((s) => s.skill_id),
    interestIds: (row.student_interests ?? []).map((i) => i.interest_id),
  }
}

/** Company-safe subset — no private contact fields. */
export function toCompanyStudentView(student: Student) {
  return {
    id: student.id,
    degreeProgramme: student.degreeProgramme,
    department: student.department,
    studyCredits: student.studyCredits,
    preferredProjectTypes: student.preferredProjectTypes,
  }
}
