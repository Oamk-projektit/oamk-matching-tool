/**
 * Deterministic match scoring.
 *
 * Formula (documented):
 *   For each criterion c with integer weight w_c (sum_c w_c = 100) and ratio r_c ∈ [0,1]:
 *     contribution_c = round(w_c * r_c)     // integer, half-up via Math.round
 *   totalScore = clamp(0, 100, sum_c contribution_c)
 *
 * Same inputs always yield the same ratios, breakdown, and totalScore.
 * Weights are snapshotted by the caller; changing project weights later does not
 * rewrite historical rows (DB stores weights_snapshot at calculation time).
 */

import {
  AVAILABILITY_UNKNOWN_RATIO,
  CREDITS_FLOOR_RATIO,
  CEFR_LEVEL_ORDER,
  DEFAULT_MATCHING_WEIGHTS,
  SKILLS_RECOMMENDED_BLEND,
  SKILLS_REQUIRED_BLEND,
} from '@/lib/matching/constants'
import { normalizeCefrLevel, normalizeLabel } from '@/lib/matching/normalize'
import type {
  AvailabilityOutcome,
  CalculatedMatch,
  CriterionRatios,
  LanguageOutcome,
  ListSplit,
  MatchLocale,
  MatchProjectInput,
  MatchStudentInput,
} from '@/lib/matching/types'
import { explainMatch } from '@/lib/matching/explain-match'
import {
  isValidProjectWeights,
  PROJECT_WEIGHT_TOTAL,
  sumProjectWeights,
  type ProjectWeights,
  type ScoreBreakdown,
} from '@/types/domain'
import { ValidationError } from '@/lib/validation'

export class InvalidMatchingWeightsError extends ValidationError {
  constructor(message: string, field = 'weights') {
    super(message, [{ field, message }])
    this.name = 'InvalidMatchingWeightsError'
  }
}

/** Validate integer weights: non-negative and sum exactly 100. */
export function assertValidWeights(weights: ProjectWeights): void {
  const entries = Object.entries(weights) as [keyof ProjectWeights, number][]
  for (const [key, value] of entries) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new InvalidMatchingWeightsError(
        `Weight "${key}" must be a non-negative finite number`,
        `weights.${key}`
      )
    }
    if (!Number.isInteger(value)) {
      throw new InvalidMatchingWeightsError(
        `Weight "${key}" must be an integer percentage`,
        `weights.${key}`
      )
    }
  }
  const sum = sumProjectWeights(weights)
  if (sum !== PROJECT_WEIGHT_TOTAL || !isValidProjectWeights(weights)) {
    throw new InvalidMatchingWeightsError(
      `Weights must sum to ${PROJECT_WEIGHT_TOTAL} (got ${sum})`,
      'weights'
    )
  }
}

export function splitRequired(
  required: string[],
  possessed: string[]
): ListSplit {
  const have = new Set(possessed.map(normalizeLabel))
  const matched: string[] = []
  const missing: string[] = []
  for (const item of required) {
    if (have.has(normalizeLabel(item))) matched.push(item)
    else missing.push(item)
  }
  return { matched, missing }
}

/** Ratio in [0,1]. Empty required list → full score. Never divides by zero. */
export function ratioScore(matchedCount: number, requiredCount: number): number {
  if (requiredCount <= 0) return 1
  if (matchedCount <= 0) return 0
  return matchedCount / requiredCount
}

/**
 * Study credits:
 * - no minimum → 1
 * - student meets/exceeds → 1
 * - below → studentCredits / minimum (clamped), never divide by zero
 */
export function creditsScore(
  studentCredits: number,
  minimumCredits: number
): number {
  if (!Number.isFinite(studentCredits) || studentCredits < 0) return 0
  if (!Number.isFinite(minimumCredits) || minimumCredits <= 0) return 1
  if (studentCredits >= minimumCredits) return 1
  const ratio = studentCredits / minimumCredits
  return Math.max(CREDITS_FLOOR_RATIO, Math.min(1, ratio))
}

/**
 * Language: student working languages vs project requiredLanguage.
 * UI preferredLanguage is never consulted here.
 * Optional CEFR floor: if set and student has the language but level is unknown,
 * still pass presence check (MVP has no per-language level on students).
 */
export function languageScore(
  studentLanguages: MatchStudentInput['languages'],
  requiredLanguage: MatchProjectInput['requiredLanguage'],
  minimumLanguageLevel: string | null = null
): LanguageOutcome {
  const have = new Set(studentLanguages)
  const matched = have.has(requiredLanguage)
  if (!matched) return { ratio: 0, matched: false }

  const floor = normalizeCefrLevel(minimumLanguageLevel)
  if (floor && CEFR_LEVEL_ORDER[floor] !== undefined) {
    // MVP: no student CEFR field — presence of the language satisfies the floor.
    // Reserved for future level comparison without changing the API shape.
  }
  return { ratio: 1, matched: true }
}

function parseIsoDate(value: string | null | undefined): number | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const ms = Date.parse(trimmed)
  return Number.isFinite(ms) ? ms : null
}

/**
 * Availability / schedule:
 * - missing dates on either side → unknown (0.5)
 * - student window fully covers project window → 1
 * - partial overlap → overlap / projectDuration
 * - no overlap → 0
 * Work mode: remote/hybrid always compatible; onsite without remoteAllowed
 * slightly reduces score when student has no onsite signal (neutral 1.0 —
 * student model has no work-mode preference in MVP).
 */
export function availabilityScore(
  student: Pick<MatchStudentInput, 'availabilityStart' | 'availabilityEnd'>,
  project: Pick<
    MatchProjectInput,
    'projectStart' | 'projectEnd' | 'workMode' | 'remoteAllowed'
  >
): AvailabilityOutcome {
  const sStart = parseIsoDate(student.availabilityStart)
  const sEnd = parseIsoDate(student.availabilityEnd)
  const pStart = parseIsoDate(project.projectStart)
  const pEnd = parseIsoDate(project.projectEnd)

  let dateRatio: number
  let status: AvailabilityOutcome['status']

  if (sStart === null || sEnd === null || pStart === null || pEnd === null) {
    dateRatio = AVAILABILITY_UNKNOWN_RATIO
    status = 'unknown'
  } else if (sEnd < sStart || pEnd < pStart) {
    dateRatio = 0
    status = 'none'
  } else {
    const overlapStart = Math.max(sStart, pStart)
    const overlapEnd = Math.min(sEnd, pEnd)
    const projectDuration = pEnd - pStart
    if (projectDuration <= 0) {
      dateRatio = sStart <= pStart && sEnd >= pEnd ? 1 : AVAILABILITY_UNKNOWN_RATIO
      status = dateRatio === 1 ? 'full' : 'unknown'
    } else if (overlapEnd < overlapStart) {
      dateRatio = 0
      status = 'none'
    } else {
      const overlap = overlapEnd - overlapStart
      dateRatio = Math.min(1, overlap / projectDuration)
      if (dateRatio >= 1) status = 'full'
      else if (dateRatio > 0) status = 'partial'
      else status = 'none'
    }
  }

  // Work-mode nudge: fully remote projects are always schedule-compatible.
  let modeFactor = 1
  if (project.workMode === 'onsite' && project.remoteAllowed === false) {
    modeFactor = 1 // no student preference field yet
  }

  const ratio = Math.max(0, Math.min(1, dateRatio * modeFactor))
  return { ratio, status }
}

/** Interests: empty project list → full score. */
export function interestsScore(
  studentInterests: string[],
  projectInterests: string[]
): ListSplit & { ratio: number } {
  const split = splitRequired(projectInterests, studentInterests)
  return {
    ...split,
    ratio: ratioScore(split.matched.length, projectInterests.length),
  }
}

/**
 * Degree programme vs project department (projects have no degreeProgramme column).
 * Empty project department → full score. Exact normalized match on student
 * degreeProgramme or department → 1; else 0.
 */
export function degreeProgrammeScore(
  student: Pick<MatchStudentInput, 'degreeProgramme' | 'department'>,
  projectDepartment: string | null
): number {
  if (!projectDepartment || !normalizeLabel(projectDepartment)) return 1
  const target = normalizeLabel(projectDepartment)
  const degree = student.degreeProgramme
    ? normalizeLabel(student.degreeProgramme)
    : ''
  const dept = student.department ? normalizeLabel(student.department) : ''
  if (degree === target || dept === target) return 1
  return 0
}

/**
 * Skills criterion blends required (heavy) and recommended (light).
 * Empty both → 1.
 */
export function skillsRatio(
  requiredSplit: ListSplit,
  recommendedSplit: ListSplit,
  requiredCount: number,
  recommendedCount: number
): number {
  if (requiredCount <= 0 && recommendedCount <= 0) return 1
  const required = ratioScore(requiredSplit.matched.length, requiredCount)
  const recommended = ratioScore(
    recommendedSplit.matched.length,
    recommendedCount
  )
  if (requiredCount <= 0) return recommended
  if (recommendedCount <= 0) return required
  return (
    SKILLS_REQUIRED_BLEND * required + SKILLS_RECOMMENDED_BLEND * recommended
  )
}

function clampScore(value: number): number {
  if (!Number.isFinite(value) || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function contribution(weight: number, ratio: number): number {
  const raw = weight * Math.max(0, Math.min(1, ratio))
  if (!Number.isFinite(raw) || Number.isNaN(raw)) return 0
  return Math.round(raw)
}

function buildBreakdown(
  weights: ProjectWeights,
  ratios: CriterionRatios
): ScoreBreakdown {
  return {
    studyCredits: contribution(weights.studyCredits, ratios.studyCredits),
    requiredCourses: contribution(
      weights.requiredCourses,
      ratios.requiredCourses
    ),
    recommendedCourses: contribution(
      weights.recommendedCourses,
      ratios.recommendedCourses
    ),
    skills: contribution(weights.skills, ratios.skills),
    language: contribution(weights.language, ratios.language),
    availability: contribution(weights.availability, ratios.availability),
    interests: contribution(weights.interests, ratios.interests),
    degreeProgramme: contribution(
      weights.degreeProgramme,
      ratios.degreeProgramme
    ),
  }
}

function sumBreakdown(breakdown: ScoreBreakdown): number {
  return (
    breakdown.studyCredits +
    breakdown.requiredCourses +
    breakdown.recommendedCourses +
    breakdown.skills +
    breakdown.language +
    breakdown.availability +
    breakdown.interests +
    breakdown.degreeProgramme
  )
}

function buildRequirements(input: {
  missingRequiredCourses: string[]
  missingRequiredSkills: string[]
  languageMatched: boolean
  requiredLanguage: string
  availabilityStatus: AvailabilityOutcome['status']
  creditsOk: boolean
  minimumCredits: number
  matchedRequiredCourses: string[]
  matchedRequiredSkills: string[]
  languageOk: boolean
  availabilityOk: boolean
}): { matchedRequirements: string[]; missingRequirements: string[] } {
  const matchedRequirements: string[] = []
  const missingRequirements: string[] = []

  if (input.creditsOk) matchedRequirements.push('studyCredits')
  else missingRequirements.push(`studyCredits>=${input.minimumCredits}`)

  for (const c of input.matchedRequiredCourses) {
    matchedRequirements.push(`course:${c}`)
  }
  for (const c of input.missingRequiredCourses) {
    missingRequirements.push(`course:${c}`)
  }
  for (const s of input.matchedRequiredSkills) {
    matchedRequirements.push(`skill:${s}`)
  }
  for (const s of input.missingRequiredSkills) {
    missingRequirements.push(`skill:${s}`)
  }
  if (input.languageOk) matchedRequirements.push(`language:${input.requiredLanguage}`)
  else missingRequirements.push(`language:${input.requiredLanguage}`)

  if (input.availabilityOk) matchedRequirements.push('availability')
  else if (input.availabilityStatus === 'none') {
    missingRequirements.push('availability')
  }

  return { matchedRequirements, missingRequirements }
}

/**
 * Compute a deterministic match. `calculatedAt` may be injected for tests;
 * production callers should omit it (defaults to Date.now ISO).
 */
export function calculateMatch(
  student: MatchStudentInput,
  project: MatchProjectInput,
  weights: ProjectWeights = project.weights ?? DEFAULT_MATCHING_WEIGHTS,
  locale: MatchLocale = 'en',
  calculatedAt: string = new Date().toISOString()
): CalculatedMatch {
  assertValidWeights(weights)

  const requiredCourses = splitRequired(project.requiredCourses, student.courses)
  const recommendedCourses = splitRequired(
    project.recommendedCourses,
    student.courses
  )
  const requiredSkills = splitRequired(project.requiredSkills, student.skills)
  const recommendedSkills = splitRequired(
    project.recommendedSkills,
    student.skills
  )
  const interests = interestsScore(student.interests, project.interests)
  const language = languageScore(
    student.languages,
    project.requiredLanguage,
    project.minimumLanguageLevel
  )
  const availability = availabilityScore(student, project)
  const creditsRatio = creditsScore(
    student.studyCredits,
    project.minimumStudyCredits
  )
  const degreeRatio = degreeProgrammeScore(student, project.department)

  const ratios: CriterionRatios = {
    studyCredits: creditsRatio,
    requiredCourses: ratioScore(
      requiredCourses.matched.length,
      project.requiredCourses.length
    ),
    recommendedCourses: ratioScore(
      recommendedCourses.matched.length,
      project.recommendedCourses.length
    ),
    skills: skillsRatio(
      requiredSkills,
      recommendedSkills,
      project.requiredSkills.length,
      project.recommendedSkills.length
    ),
    language: language.ratio,
    availability: availability.ratio,
    interests: interests.ratio,
    degreeProgramme: degreeRatio,
  }

  const scoreBreakdown = buildBreakdown(weights, ratios)
  const totalScore = clampScore(sumBreakdown(scoreBreakdown))

  const creditsOk = creditsRatio >= 1
  const languageOk = language.matched

  const { matchedRequirements, missingRequirements } = buildRequirements({
    missingRequiredCourses: requiredCourses.missing,
    missingRequiredSkills: requiredSkills.missing,
    languageMatched: language.matched,
    requiredLanguage: project.requiredLanguage,
    availabilityStatus: availability.status,
    creditsOk,
    minimumCredits: project.minimumStudyCredits,
    matchedRequiredCourses: requiredCourses.matched,
    matchedRequiredSkills: requiredSkills.matched,
    languageOk,
    availabilityOk: availability.status !== 'none',
  })

  const resultWithoutExplanation: Omit<CalculatedMatch, 'explanation'> = {
    studentId: student.id,
    projectId: project.id,
    totalScore,
    scoreBreakdown,
    matchedRequirements,
    missingRequirements,
    matchedRequiredCourses: requiredCourses.matched,
    missingRequiredCourses: requiredCourses.missing,
    matchedRecommendedCourses: recommendedCourses.matched,
    missingRecommendedCourses: recommendedCourses.missing,
    matchedRequiredSkills: requiredSkills.matched,
    missingRequiredSkills: requiredSkills.missing,
    matchedRecommendedSkills: recommendedSkills.matched,
    missingRecommendedSkills: recommendedSkills.missing,
    matchedInterests: interests.matched,
    missingInterests: interests.missing,
    language,
    availability,
    weightsSnapshot: { ...weights },
    calculatedAt,
    ratios,
  }

  return {
    ...resultWithoutExplanation,
    explanation: explainMatch(resultWithoutExplanation, locale),
  }
}
