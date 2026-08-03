/**
 * API request/response contracts for OAMK Matching Tool.
 * Keep in sync with docs/API.md. No UI logic here.
 */

import type {
  Application,
  ApplicationStatus,
  AppLanguage,
  MatchResult,
  MatchingWeights,
  Opportunity,
  OpportunityType,
  Student,
} from './domain'

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
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
  status: 'ok'
  service: string
  timestamp: string
  supabase: 'configured' | 'missing'
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
}

export type MatchResultResponse = MatchResult

export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus
}
