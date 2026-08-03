/**
 * Canonical domain types for OAMK Matching Tool.
 * Shared by API handlers, matching engine, and (later) frontend services.
 * No UI / React code belongs here.
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
  /** Integer score in range 0–100 */
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
