/**
 * Pure matching-engine types. No React, routes, or DB clients.
 *
 * Criterion set and weight shape follow the locked shared contract
 * (`types/domain.ts` / `docs/API.md`), including `degreeProgramme`.
 */

import type {
  PreferredLanguage,
  ProjectWeights,
  ScoreBreakdown,
  WorkMode,
} from '@/types/domain'

export type MatchLocale = PreferredLanguage

/** Student snapshot consumed by the engine (already denormalized labels/ids). */
export interface MatchStudentInput {
  id: string
  studyCredits: number
  degreeProgramme: string | null
  department: string | null
  /** Working languages (skill-derived). Not UI preferredLanguage. */
  languages: PreferredLanguage[]
  availabilityStart: string | null
  availabilityEnd: string | null
  courses: string[]
  skills: string[]
  interests: string[]
}

/** Project snapshot consumed by the engine. */
export interface MatchProjectInput {
  id: string
  title: string
  minimumStudyCredits: number
  requiredLanguage: PreferredLanguage
  /** Optional CEFR-style floor when present; ignored when null. */
  minimumLanguageLevel: string | null
  projectStart: string | null
  projectEnd: string | null
  workMode: WorkMode
  remoteAllowed: boolean
  department: string | null
  requiredCourses: string[]
  recommendedCourses: string[]
  requiredSkills: string[]
  recommendedSkills: string[]
  interests: string[]
  weights: ProjectWeights
}

export type CriterionKey = keyof ScoreBreakdown

export interface CriterionRatios {
  studyCredits: number
  requiredCourses: number
  recommendedCourses: number
  skills: number
  language: number
  availability: number
  interests: number
  degreeProgramme: number
}

export interface ListSplit {
  matched: string[]
  missing: string[]
}

export interface AvailabilityOutcome {
  /** Ratio in [0, 1]. */
  ratio: number
  /** Human-readable compatibility label for explanations. */
  status: 'full' | 'partial' | 'none' | 'unknown'
}

export interface LanguageOutcome {
  ratio: number
  matched: boolean
}

/** Full deterministic match result returned by the engine. */
export interface CalculatedMatch {
  studentId: string
  projectId: string
  totalScore: number
  scoreBreakdown: ScoreBreakdown
  matchedRequirements: string[]
  missingRequirements: string[]
  matchedRequiredCourses: string[]
  missingRequiredCourses: string[]
  matchedRecommendedCourses: string[]
  missingRecommendedCourses: string[]
  matchedRequiredSkills: string[]
  missingRequiredSkills: string[]
  matchedRecommendedSkills: string[]
  missingRecommendedSkills: string[]
  matchedInterests: string[]
  missingInterests: string[]
  language: LanguageOutcome
  availability: AvailabilityOutcome
  weightsSnapshot: ProjectWeights
  explanation: string
  calculatedAt: string
  /** Criterion ratios before weighting (0–1). Useful for tests/audit. */
  ratios: CriterionRatios
}

export interface RankedMatch extends CalculatedMatch {
  rank: number
}
