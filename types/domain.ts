/**
 * ============================================================================
 * SHARED CONTRACT — Tommi + Venla
 * ============================================================================
 *
 * Canonical domain models for DB, API and frontend services.
 * Locked before the projects-model schema migration.
 *
 * Rules:
 * - camelCase field names in TypeScript and JSON API (`docs/API.md`).
 * - DB columns remain snake_case; map at the repository boundary.
 * - No React components, hooks, or view-specific styles in this file.
 * - Do not duplicate parallel models in mock-only shapes.
 *
 * Runtime note: current `/api/opportunities` routes still use `types/legacy.ts`
 * until the migration phase rewires handlers to these models.
 */

/** Canonical app roles — source of truth: `profiles.role` */
export type UserRole = 'student' | 'company' | 'teacher' | 'admin'

export type PreferredLanguage = 'fi' | 'en'

/**
 * MVP project kinds stored on `projects.project_type`.
 * Thesis topics are out of the first MVP.
 */
export type ProjectType = 'company_project' | 'internship'

export type ProjectStatus =
  | 'draft'
  | 'published'
  | 'closed'
  | 'archived'

export type WorkMode = 'onsite' | 'hybrid' | 'remote'

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'selected'
  | 'not_selected'
  | 'withdrawn'

export type SelectionDecisionValue = 'selected' | 'not_selected'

export type NotificationType =
  | 'application_received'
  | 'application_status_changed'
  | 'match_ready'
  | 'selection_decided'
  | 'project_published'

/**
 * Matching weights for a project. Integer percentages; must sum to 100.
 */
export interface ProjectWeights {
  studyCredits: number
  requiredCourses: number
  recommendedCourses: number
  skills: number
  language: number
  availability: number
  interests: number
  degreeProgramme: number
}

export const DEFAULT_PROJECT_WEIGHTS: ProjectWeights = {
  studyCredits: 10,
  requiredCourses: 20,
  recommendedCourses: 10,
  skills: 25,
  language: 10,
  availability: 10,
  interests: 10,
  degreeProgramme: 5,
}

export const PROJECT_WEIGHT_TOTAL = 100

export function sumProjectWeights(weights: ProjectWeights): number {
  return (
    weights.studyCredits +
    weights.requiredCourses +
    weights.recommendedCourses +
    weights.skills +
    weights.language +
    weights.availability +
    weights.interests +
    weights.degreeProgramme
  )
}

export function isValidProjectWeights(weights: ProjectWeights): boolean {
  return sumProjectWeights(weights) === PROJECT_WEIGHT_TOTAL
}

export interface Profile {
  id: string
  role: UserRole
  displayName: string
  email: string
  preferredLanguage: PreferredLanguage
  createdAt: string
  updatedAt: string
}

export type CompanyUserRole = 'owner' | 'member'

export interface Company {
  id: string
  name: string
  businessId: string | null
  description: string | null
  website: string | null
  createdAt: string
  updatedAt: string
}

export interface CompanyUser {
  id: string
  companyId: string
  profileId: string
  companyRole: CompanyUserRole
  createdAt: string
}

export interface Student {
  id: string
  profileId: string
  degreeProgramme: string | null
  department: string | null
  studyCredits: number
  availabilityStart: string | null
  availabilityEnd: string | null
  preferredProjectTypes: ProjectType[]
  createdAt: string
  updatedAt: string
}

export interface Course {
  id: string
  code: string
  nameFi: string
  nameEn: string
  credits: number
  department: string | null
  active: boolean
}

export type CourseCompletionStatus = 'planned' | 'in_progress' | 'completed'

/** Student ↔ course link with optional completion metadata. */
export interface StudentCourse {
  id: string
  studentId: string
  courseId: string
  completionStatus: CourseCompletionStatus
  completedAt: string | null
  grade: string | null
  verified: boolean
  createdAt: string
}

export interface Skill {
  id: string
  nameFi: string
  nameEn: string
  normalizedName: string
}

export interface Interest {
  id: string
  nameFi: string
  nameEn: string
  normalizedName: string
}

/**
 * Canonical table for company projects and internships.
 * Thesis topics are not in the first MVP.
 */
export interface Project {
  id: string
  companyId: string
  title: string
  description: string
  projectType: ProjectType
  status: ProjectStatus
  positions: number
  applicationStart: string | null
  applicationDeadline: string | null
  projectStart: string | null
  projectEnd: string | null
  workMode: WorkMode
  location: string | null
  remoteAllowed: boolean
  minimumStudyCredits: number
  requiredLanguage: PreferredLanguage
  department: string | null
  createdAt: string
  updatedAt: string
}

export interface Application {
  id: string
  projectId: string
  studentId: string
  status: ApplicationStatus
  message: string | null
  submittedAt: string
  updatedAt: string
}

/** Per-criterion contribution to the total match score (0–100 scale). */
export interface ScoreBreakdown {
  studyCredits: number
  requiredCourses: number
  recommendedCourses: number
  skills: number
  language: number
  availability: number
  interests: number
  degreeProgramme: number
}

/**
 * Deterministic matching result. The algorithm never auto-selects a student;
 * companies make the final `SelectionDecision`.
 */
export interface Match {
  id: string
  projectId: string
  studentId: string
  totalScore: number
  scoreBreakdown: ScoreBreakdown
  matchedCourses: string[]
  missingRequiredCourses: string[]
  matchedSkills: string[]
  missingRequiredSkills: string[]
  explanation: string
  weightsSnapshot: ProjectWeights
  calculatedAt: string
}

/**
 * Company's final student choice for a project.
 * Matching rankings inform, but do not decide.
 */
export interface SelectionDecision {
  id: string
  projectId: string
  studentId: string
  applicationId: string
  decision: SelectionDecisionValue
  decidedBy: string
  reason: string | null
  decidedAt: string
}

export interface Notification {
  id: string
  profileId: string
  type: NotificationType
  language: PreferredLanguage
  title: string
  body: string
  readAt: string | null
  createdAt: string
}

/** Append-only audit row for sensitive actions. */
export interface AuditEvent {
  id: string
  actorProfileId: string | null
  action: string
  entityType: string
  entityId: string
  payload: Record<string, unknown>
  createdAt: string
}
