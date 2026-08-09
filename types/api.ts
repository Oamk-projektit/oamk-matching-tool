/**
 * ============================================================================
 * SHARED CONTRACT — Tommi + Venla
 * ============================================================================
 *
 * Canonical HTTP request/response shapes for `/api/*`.
 * Keep in sync with `docs/API.md`. No React / UI code here.
 *
 * Runtime note: live handlers use the projects model (`types/domain.ts`).
 * Legacy `/api/opportunities` routes return 410 Gone.
 */

import type {
  Application,
  ApplicationStatus,
  Course,
  CourseCompletionStatus,
  Interest,
  Match,
  Notification,
  PreferredLanguage,
  Profile,
  Project,
  ProjectStatus,
  ProjectType,
  ProjectWeights,
  ScoreBreakdown,
  SelectionDecision,
  SelectionDecisionValue,
  Skill,
  Student,
  StudentCourse,
  UserRole,
  WorkMode,
} from './domain'

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'GONE'
  | 'DATABASE_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'

export interface ApiFieldError {
  field: string
  message: string
}

/** Uniform error envelope for all `/api/*` routes. */
export interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    message: string
    details?: ApiFieldError[]
  }
}

/**
 * Uniform success envelope.
 * Single resources: `data` is the object. Lists: `data` is an array.
 */
export interface ApiSuccess<T, M extends object = Record<string, never>> {
  data: T
  meta: M
}

export interface ListMeta {
  count: number
}

export type ListResponse<T> = ApiSuccess<T[], ListMeta>

export interface HealthData {
  status: 'ok'
  service: string
  database: 'connected'
  timestamp: string
}

export type HealthResponse = ApiSuccess<HealthData>

export interface MeData {
  profile: Profile
  studentId: string | null
  companyId: string | null
}

export type MeResponse = ApiSuccess<MeData>

export interface CreateStudentRequest {
  degreeProgramme?: string | null
  department?: string | null
  studyCredits?: number
  availabilityStart?: string | null
  availabilityEnd?: string | null
  preferredProjectTypes?: ProjectType[]
  courseIds?: string[]
  skillIds?: string[]
  interestIds?: string[]
}

export type UpdateStudentRequest = Partial<CreateStudentRequest>

export interface StudentDetail extends Student {
  courseIds: string[]
  skillIds: string[]
  interestIds: string[]
}

/** Limited student fields for company applicants (no private extras). */
export type StudentCompanyView = Pick<
  Student,
  'id' | 'degreeProgramme' | 'department' | 'studyCredits' | 'preferredProjectTypes'
>

export type StudentResponse = ApiSuccess<Student>
export type StudentDetailResponse = ApiSuccess<StudentDetail>
export type StudentListResponse = ListResponse<Student>

export interface AddStudentCourseRequest {
  courseId: string
  completionStatus?: CourseCompletionStatus
  completedAt?: string | null
  grade?: string | null
  verified?: boolean
}

export type StudentCourseResponse = ApiSuccess<StudentCourse>
export type StudentCourseListResponse = ListResponse<StudentCourse>

export interface AddStudentSkillRequest {
  /** Catalog skill id, or omit and pass `name` to find-or-create. */
  skillId?: string
  name?: string
}

export interface AddStudentInterestRequest {
  interestId?: string
  name?: string
}

export interface CreateProjectRequest {
  title: string
  description: string
  projectType: ProjectType
  status?: ProjectStatus
  positions?: number
  applicationStart?: string | null
  applicationDeadline?: string | null
  projectStart?: string | null
  projectEnd?: string | null
  workMode?: WorkMode
  location?: string | null
  remoteAllowed?: boolean
  minimumStudyCredits?: number
  requiredLanguage?: PreferredLanguage
  department?: string | null
  requiredCourseIds?: string[]
  recommendedCourseIds?: string[]
  requiredSkillIds?: string[]
  recommendedSkillIds?: string[]
  interestIds?: string[]
  weights?: ProjectWeights
}

export type UpdateProjectRequest = Partial<CreateProjectRequest>

export type ProjectResponse = ApiSuccess<Project>
export type ProjectListResponse = ListResponse<Project>

export interface ProjectDetail extends Project {
  weights: ProjectWeights
  requiredCourseIds: string[]
  recommendedCourseIds: string[]
  requiredSkillIds: string[]
  recommendedSkillIds: string[]
  interestIds: string[]
}

export type ProjectDetailResponse = ApiSuccess<ProjectDetail>

export interface CreateApplicationRequest {
  projectId: string
  message?: string | null
}

export type ApplicationResponse = ApiSuccess<Application>
export type ApplicationListResponse = ListResponse<Application>

export interface ApplicationWithProject extends Application {
  project: Pick<
    Project,
    'id' | 'title' | 'projectType' | 'status' | 'applicationDeadline'
  >
}

export type MyApplicationsResponse = ListResponse<ApplicationWithProject>

/**
 * Applicant row for company / teacher / admin.
 * Students must never receive this ranking payload.
 */
export interface ApplicantListItem {
  application: Pick<
    Application,
    'id' | 'status' | 'message' | 'submittedAt'
  >
  student: Pick<Student, 'id' | 'degreeProgramme' | 'department' | 'studyCredits'>
  profile: Pick<Profile, 'displayName' | 'email'>
  match: Pick<Match, 'totalScore' | 'explanation' | 'scoreBreakdown'> | null
}

export interface ApplicantsMeta extends ListMeta {
  /** Present when the caller may see ranked shortlists (company/teacher/admin). */
  topN?: number
}

export type ApplicantsResponse = ApiSuccess<ApplicantListItem[], ApplicantsMeta>

export interface RunMatchesRequest {
  projectIds?: string[]
  locale?: PreferredLanguage
}

export type MatchResponse = ApiSuccess<Match>
export type MatchListResponse = ListResponse<Match>

/**
 * Student-safe match view: own score only, no peer rankings.
 * Criteria weights may be included for transparency.
 */
export interface StudentMatchView {
  match: Match
  weights: ProjectWeights
  project: Pick<Project, 'id' | 'title' | 'projectType'>
}

export type StudentMatchResponse = ApiSuccess<StudentMatchView>
export type StudentMatchListResponse = ListResponse<StudentMatchView>

/**
 * Top-N shortlist for a project. Visible only to company, teacher, admin.
 */
export interface TopMatchItem {
  rank: number
  match: Match
  student: Pick<Student, 'id' | 'degreeProgramme' | 'studyCredits'>
  profile: Pick<Profile, 'displayName' | 'email'>
  applicationId: string | null
}

export interface TopMatchesMeta extends ListMeta {
  projectId: string
  limit: number
}

export type TopMatchesResponse = ApiSuccess<TopMatchItem[], TopMatchesMeta>

export interface CreateSelectionDecisionRequest {
  studentId: string
  applicationId: string
  decision: SelectionDecisionValue
  reason?: string | null
}

export type SelectionDecisionResponse = ApiSuccess<SelectionDecision>
export type SelectionDecisionListResponse = ListResponse<SelectionDecision>

export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus
}

export interface NotificationsMeta extends ListMeta {
  unreadCount: number
}

export type NotificationListResponse = ApiSuccess<
  Notification[],
  NotificationsMeta
>
export type NotificationResponse = ApiSuccess<Notification>

export type CourseListResponse = ListResponse<Course>
export type SkillListResponse = ListResponse<Skill>
export type InterestListResponse = ListResponse<Interest>

export type { ScoreBreakdown, UserRole }
