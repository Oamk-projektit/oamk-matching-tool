/**
 * ============================================================================
 * LEGACY RUNTIME CONTRACT — Tommi
 * ============================================================================
 *
 * Temporary shapes kept for matching weight defaults, older shared helpers,
 * and parser unit tests. Live HTTP uses `types/domain.ts` / `types/api.ts`;
 * `/api/opportunities` returns 410 Gone.
 *
 * Canonical source of truth: `types/domain.ts`, `types/api.ts`, `docs/API.md`.
 * Do not extend this file — migrate callers to the canonical models instead.
 */

export type UserRole = 'student' | 'teacher' | 'admin'

export type AppLanguage = 'FI' | 'EN'

export type OpportunityType = 'project' | 'internship'

export type ApplicationStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

export interface MatchingWeights {
  courses: number
  skills: number
  language: number
  schedule: number
  credits: number
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  courses: 0.3,
  skills: 0.4,
  language: 0.1,
  schedule: 0.1,
  credits: 0.1,
}

export interface Profile {
  id: string
  user_id: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  user_id: string
  name: string
  email: string
  degree_program: string | null
  credits: number
  language: AppLanguage
  availability: string | null
  completed_courses: string[]
  skills: string[]
  interests: string[]
  project_preferences: OpportunityType[]
  created_at: string
  updated_at: string
}

export interface Opportunity {
  id: string
  teacher_id: string
  name: string
  description: string | null
  type: OpportunityType
  required_courses: string[]
  recommended_courses: string[]
  minimum_credits: number
  required_language: AppLanguage
  schedule: string | null
  duration: string | null
  required_skills: string[]
  student_slots: number
  weights: MatchingWeights
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  student_id: string
  opportunity_id: string
  status: ApplicationStatus
  message: string | null
  created_at: string
  updated_at: string
}

export interface MatchResult {
  id: string
  student_id: string
  opportunity_id: string
  score: number
  matched_courses: string[]
  missing_courses: string[]
  matched_skills: string[]
  missing_skills: string[]
  explanation: string
  recommendation: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  recipient_user_id: string
  type: string
  content: string
  read: boolean
  created_at: string
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'GONE'
  | 'INTERNAL_ERROR'

export interface ApiFieldError {
  field: string
  message: string
}

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    message: string
    details?: ApiFieldError[]
  }
}

export interface ListMeta {
  count: number
  [key: string]: string | number | undefined
}

export interface ListResponse<T> {
  data: T[]
  meta: ListMeta
}

export interface HealthResponse {
  status: 'ok' | 'degraded'
  service: string
  timestamp: string
  supabase: 'configured' | 'missing'
  database?: 'ok' | 'error' | 'skipped'
  database_error?: string
}

export interface MeResponse {
  user_id: string
  email: string | null
  role: UserRole
  student_id: string | null
}

export interface CreateStudentRequest {
  name: string
  email: string
  degree_program?: string | null
  credits?: number
  language?: AppLanguage
  availability?: string | null
  completed_courses?: string[]
  skills?: string[]
  interests?: string[]
  project_preferences?: OpportunityType[]
}

export type UpdateStudentRequest = Partial<CreateStudentRequest>

export type StudentResponse = Student

export interface CreateOpportunityRequest {
  name: string
  description?: string | null
  type: OpportunityType
  required_courses?: string[]
  recommended_courses?: string[]
  minimum_credits?: number
  required_language?: AppLanguage
  schedule?: string | null
  duration?: string | null
  required_skills?: string[]
  student_slots?: number
  weights?: MatchingWeights
}

export type UpdateOpportunityRequest = Partial<CreateOpportunityRequest>

export type OpportunityResponse = Opportunity

export interface CreateApplicationRequest {
  opportunity_id: string
  message?: string | null
}

export type ApplicationResponse = Application

export interface ApplicationWithOpportunity extends Application {
  opportunity: Pick<
    Opportunity,
    'id' | 'name' | 'type' | 'schedule' | 'duration'
  >
}

export interface ApplicantListItem {
  application: Pick<Application, 'id' | 'status' | 'message' | 'created_at'>
  student: Pick<Student, 'id' | 'name' | 'email' | 'degree_program' | 'credits'>
  match: Pick<MatchResult, 'score' | 'explanation'> | null
}

export interface RunMatchesRequest {
  opportunity_ids?: string[]
  locale?: 'en' | 'fi'
}

export type MatchResultResponse = MatchResult

export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus
}

export interface NotificationListMeta extends ListMeta {
  unread_count: number
}
