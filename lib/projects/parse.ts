import type {
  CreateProjectRequest,
  ProjectDetail,
  UpdateProjectRequest,
} from '@/types/api'
import type { Project, ProjectWeights } from '@/types/domain'
import { DEFAULT_PROJECT_WEIGHTS } from '@/types/domain'
import {
  assertOptionalDate,
  assertOptionalString,
  assertNonNegativeInt,
  assertPositiveInt,
  assertPreferredLanguage,
  assertProjectStatus,
  assertProjectType,
  assertWorkMode,
  normalizeProjectWeights,
  normalizeUuidArray,
  requireNonEmptyString,
  requireObject,
} from '@/lib/validation/domain'

export function parseCreateProject(body: unknown): CreateProjectRequest {
  const raw = requireObject(body)
  return {
    title: requireNonEmptyString(raw.title, 'title'),
    description:
      raw.description === undefined || raw.description === null
        ? ''
        : String(raw.description),
    projectType: assertProjectType(raw.projectType),
    status:
      raw.status === undefined ? 'draft' : assertProjectStatus(raw.status),
    positions: assertPositiveInt(raw.positions, 'positions', 1),
    applicationStart:
      assertOptionalDate(raw.applicationStart, 'applicationStart') ?? null,
    applicationDeadline:
      assertOptionalDate(raw.applicationDeadline, 'applicationDeadline') ??
      null,
    projectStart: assertOptionalDate(raw.projectStart, 'projectStart') ?? null,
    projectEnd: assertOptionalDate(raw.projectEnd, 'projectEnd') ?? null,
    workMode:
      raw.workMode === undefined ? 'hybrid' : assertWorkMode(raw.workMode),
    location: assertOptionalString(raw.location, 'location') ?? null,
    remoteAllowed:
      raw.remoteAllowed === undefined ? true : Boolean(raw.remoteAllowed),
    minimumStudyCredits: assertNonNegativeInt(
      raw.minimumStudyCredits,
      'minimumStudyCredits',
      0
    ),
    requiredLanguage:
      raw.requiredLanguage === undefined
        ? 'fi'
        : assertPreferredLanguage(raw.requiredLanguage),
    department: assertOptionalString(raw.department, 'department') ?? null,
    requiredCourseIds: normalizeUuidArray(
      raw.requiredCourseIds,
      'requiredCourseIds'
    ),
    recommendedCourseIds: normalizeUuidArray(
      raw.recommendedCourseIds,
      'recommendedCourseIds'
    ),
    requiredSkillIds: normalizeUuidArray(
      raw.requiredSkillIds,
      'requiredSkillIds'
    ),
    recommendedSkillIds: normalizeUuidArray(
      raw.recommendedSkillIds,
      'recommendedSkillIds'
    ),
    interestIds: normalizeUuidArray(raw.interestIds, 'interestIds'),
    weights: normalizeProjectWeights(raw.weights),
  }
}

export function parseUpdateProject(body: unknown): UpdateProjectRequest {
  const raw = requireObject(body)
  const out: UpdateProjectRequest = {}

  if (raw.title !== undefined) {
    out.title = requireNonEmptyString(raw.title, 'title')
  }
  if (raw.description !== undefined) {
    out.description =
      raw.description === null ? '' : String(raw.description)
  }
  if (raw.projectType !== undefined) {
    out.projectType = assertProjectType(raw.projectType)
  }
  if (raw.status !== undefined) {
    out.status = assertProjectStatus(raw.status)
  }
  if (raw.positions !== undefined) {
    out.positions = assertPositiveInt(raw.positions, 'positions')
  }
  if (raw.applicationStart !== undefined) {
    out.applicationStart = assertOptionalDate(
      raw.applicationStart,
      'applicationStart'
    ) as string | null
  }
  if (raw.applicationDeadline !== undefined) {
    out.applicationDeadline = assertOptionalDate(
      raw.applicationDeadline,
      'applicationDeadline'
    ) as string | null
  }
  if (raw.projectStart !== undefined) {
    out.projectStart = assertOptionalDate(
      raw.projectStart,
      'projectStart'
    ) as string | null
  }
  if (raw.projectEnd !== undefined) {
    out.projectEnd = assertOptionalDate(
      raw.projectEnd,
      'projectEnd'
    ) as string | null
  }
  if (raw.workMode !== undefined) out.workMode = assertWorkMode(raw.workMode)
  if (raw.location !== undefined) {
    out.location = assertOptionalString(raw.location, 'location') as
      | string
      | null
  }
  if (raw.remoteAllowed !== undefined) {
    out.remoteAllowed = Boolean(raw.remoteAllowed)
  }
  if (raw.minimumStudyCredits !== undefined) {
    out.minimumStudyCredits = assertNonNegativeInt(
      raw.minimumStudyCredits,
      'minimumStudyCredits'
    )
  }
  if (raw.requiredLanguage !== undefined) {
    out.requiredLanguage = assertPreferredLanguage(raw.requiredLanguage)
  }
  if (raw.department !== undefined) {
    out.department = assertOptionalString(raw.department, 'department') as
      | string
      | null
  }
  if (raw.requiredCourseIds !== undefined) {
    out.requiredCourseIds = normalizeUuidArray(
      raw.requiredCourseIds,
      'requiredCourseIds'
    )
  }
  if (raw.recommendedCourseIds !== undefined) {
    out.recommendedCourseIds = normalizeUuidArray(
      raw.recommendedCourseIds,
      'recommendedCourseIds'
    )
  }
  if (raw.requiredSkillIds !== undefined) {
    out.requiredSkillIds = normalizeUuidArray(
      raw.requiredSkillIds,
      'requiredSkillIds'
    )
  }
  if (raw.recommendedSkillIds !== undefined) {
    out.recommendedSkillIds = normalizeUuidArray(
      raw.recommendedSkillIds,
      'recommendedSkillIds'
    )
  }
  if (raw.interestIds !== undefined) {
    out.interestIds = normalizeUuidArray(raw.interestIds, 'interestIds')
  }
  if (raw.weights !== undefined) {
    out.weights = normalizeProjectWeights(raw.weights)
  }

  return out
}

type ProjectRow = {
  id: string
  company_id: string
  title: string
  description: string
  project_type: string
  status: string
  positions: number
  application_start: string | null
  application_deadline: string | null
  project_start: string | null
  project_end: string | null
  work_mode: string
  location: string | null
  remote_allowed: boolean
  minimum_study_credits: number
  required_language: string
  department: string | null
  created_at: string
  updated_at: string
  project_weights?:
    | {
        study_credits: number
        required_courses: number
        recommended_courses: number
        skills: number
        language: number
        availability: number
        interests: number
        degree_programme: number
      }
    | {
        study_credits: number
        required_courses: number
        recommended_courses: number
        skills: number
        language: number
        availability: number
        interests: number
        degree_programme: number
      }[]
    | null
  project_required_courses?: { course_id: string }[] | null
  project_recommended_courses?: { course_id: string }[] | null
  project_required_skills?: { skill_id: string }[] | null
  project_recommended_skills?: { skill_id: string }[] | null
  project_interests?: { interest_id: string }[] | null
}

export const PROJECT_SELECT = `
  id,
  company_id,
  title,
  description,
  project_type,
  status,
  positions,
  application_start,
  application_deadline,
  project_start,
  project_end,
  work_mode,
  location,
  remote_allowed,
  minimum_study_credits,
  required_language,
  department,
  created_at,
  updated_at,
  project_weights (
    study_credits,
    required_courses,
    recommended_courses,
    skills,
    language,
    availability,
    interests,
    degree_programme
  ),
  project_required_courses ( course_id ),
  project_recommended_courses ( course_id ),
  project_required_skills ( skill_id ),
  project_recommended_skills ( skill_id ),
  project_interests ( interest_id )
`

export function mapWeights(
  row:
    | ProjectRow['project_weights']
    | {
        study_credits: number
        required_courses: number
        recommended_courses: number
        skills: number
        language: number
        availability: number
        interests: number
        degree_programme: number
      }
    | null
    | undefined
): ProjectWeights {
  const single = Array.isArray(row) ? row[0] : row
  if (!single) return { ...DEFAULT_PROJECT_WEIGHTS }
  return {
    studyCredits: single.study_credits,
    requiredCourses: single.required_courses,
    recommendedCourses: single.recommended_courses,
    skills: single.skills,
    language: single.language,
    availability: single.availability,
    interests: single.interests,
    degreeProgramme: single.degree_programme,
  }
}

export function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    companyId: row.company_id,
    title: row.title,
    description: row.description,
    projectType: row.project_type as Project['projectType'],
    status: row.status as Project['status'],
    positions: row.positions,
    applicationStart: row.application_start,
    applicationDeadline: row.application_deadline,
    projectStart: row.project_start,
    projectEnd: row.project_end,
    workMode: row.work_mode as Project['workMode'],
    location: row.location,
    remoteAllowed: row.remote_allowed,
    minimumStudyCredits: row.minimum_study_credits,
    requiredLanguage: row.required_language as Project['requiredLanguage'],
    department: row.department,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapProjectDetail(row: ProjectRow): ProjectDetail {
  return {
    ...mapProjectRow(row),
    weights: mapWeights(row.project_weights),
    requiredCourseIds: (row.project_required_courses ?? []).map(
      (c) => c.course_id
    ),
    recommendedCourseIds: (row.project_recommended_courses ?? []).map(
      (c) => c.course_id
    ),
    requiredSkillIds: (row.project_required_skills ?? []).map((s) => s.skill_id),
    recommendedSkillIds: (row.project_recommended_skills ?? []).map(
      (s) => s.skill_id
    ),
    interestIds: (row.project_interests ?? []).map((i) => i.interest_id),
  }
}

export function weightsToSnake(weights: ProjectWeights) {
  return {
    study_credits: weights.studyCredits,
    required_courses: weights.requiredCourses,
    recommended_courses: weights.recommendedCourses,
    skills: weights.skills,
    language: weights.language,
    availability: weights.availability,
    interests: weights.interests,
    degree_programme: weights.degreeProgramme,
  }
}
