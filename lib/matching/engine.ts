import type {
  AppLanguage,
  MatchingWeights,
  Opportunity,
  Student,
} from '@/types/domain'
import { DEFAULT_MATCHING_WEIGHTS } from '@/types/domain'

export function normalizeLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function splitRequired(
  required: string[],
  possessed: string[]
): { matched: string[]; missing: string[] } {
  const have = new Set(possessed.map(normalizeLabel))
  const matched: string[] = []
  const missing: string[] = []
  for (const item of required) {
    if (have.has(normalizeLabel(item))) matched.push(item)
    else missing.push(item)
  }
  return { matched, missing }
}

export function ratioScore(matchedCount: number, requiredCount: number): number {
  if (requiredCount <= 0) return 1
  return matchedCount / requiredCount
}

export function languageScore(
  studentLanguage: AppLanguage,
  requiredLanguage: AppLanguage
): number {
  return studentLanguage === requiredLanguage ? 1 : 0
}

export function scheduleScore(
  availability: string | null | undefined,
  schedule: string | null | undefined
): number {
  const a = availability ? normalizeLabel(availability) : ''
  const s = schedule ? normalizeLabel(schedule) : ''
  if (!a || !s) return 0.5
  if (a === s) return 1
  if (a.includes(s) || s.includes(a)) return 0.75
  if (a.includes('flex') || s.includes('flex')) return 0.7
  return 0
}

export function creditsScore(
  studentCredits: number,
  minimumCredits: number
): number {
  if (minimumCredits <= 0) return 1
  return Math.min(1, studentCredits / minimumCredits)
}

export type ComputedMatch = {
  student_id: string
  opportunity_id: string
  score: number
  matched_courses: string[]
  missing_courses: string[]
  matched_skills: string[]
  missing_skills: string[]
  explanation: string
  recommendation: string
}

export type MatchStudentInput = Pick<
  Student,
  'id' | 'credits' | 'language' | 'availability' | 'completed_courses' | 'skills'
>

export type MatchOpportunityInput = Pick<
  Opportunity,
  | 'id'
  | 'required_courses'
  | 'required_skills'
  | 'required_language'
  | 'schedule'
  | 'minimum_credits'
  | 'weights'
  | 'name'
>

function buildExplanation(input: {
  score: number
  matchedCourses: string[]
  missingCourses: string[]
  matchedSkills: string[]
  missingSkills: string[]
  languageOk: boolean
  creditsOk: boolean
}): string {
  const parts: string[] = []
  if (input.score >= 80) parts.push('Strong overall fit for this opportunity.')
  else if (input.score >= 50)
    parts.push('Partial fit with some gaps to address.')
  else parts.push('Limited overlap with the opportunity requirements.')

  if (input.matchedSkills.length > 0) {
    parts.push(`Matched skills: ${input.matchedSkills.join(', ')}.`)
  }
  if (input.missingSkills.length > 0) {
    parts.push(`Missing skills: ${input.missingSkills.join(', ')}.`)
  }
  if (input.matchedCourses.length > 0) {
    parts.push(`Matched courses: ${input.matchedCourses.join(', ')}.`)
  }
  if (input.missingCourses.length > 0) {
    parts.push(`Missing courses: ${input.missingCourses.join(', ')}.`)
  }
  if (!input.languageOk) parts.push('Language preference does not match.')
  if (!input.creditsOk) parts.push('Credit requirement is not fully met.')

  return parts.join(' ')
}

function buildRecommendation(input: {
  missingCourses: string[]
  missingSkills: string[]
  languageOk: boolean
  creditsOk: boolean
  minimumCredits: number
  studentCredits: number
}): string {
  const tips: string[] = []
  if (input.missingCourses.length > 0) {
    tips.push(`Complete: ${input.missingCourses.join(', ')}.`)
  }
  if (input.missingSkills.length > 0) {
    tips.push(`Build skills in: ${input.missingSkills.join(', ')}.`)
  }
  if (!input.languageOk) {
    tips.push('Align language preference with the opportunity requirement.')
  }
  if (!input.creditsOk) {
    tips.push(
      `Reach at least ${input.minimumCredits} credits (currently ${input.studentCredits}).`
    )
  }
  if (tips.length === 0) {
    return 'Ready to apply; review the opportunity description and schedule.'
  }
  return tips.join(' ')
}

/**
 * Deterministic matching: same inputs always produce the same score and text.
 */
export function computeMatch(
  student: MatchStudentInput,
  opportunity: MatchOpportunityInput,
  weights: MatchingWeights = opportunity.weights ?? DEFAULT_MATCHING_WEIGHTS
): ComputedMatch {
  const courses = splitRequired(
    opportunity.required_courses,
    student.completed_courses
  )
  const skills = splitRequired(opportunity.required_skills, student.skills)

  const courseRatio = ratioScore(
    courses.matched.length,
    opportunity.required_courses.length
  )
  const skillRatio = ratioScore(
    skills.matched.length,
    opportunity.required_skills.length
  )
  const lang = languageScore(student.language, opportunity.required_language)
  const schedule = scheduleScore(student.availability, opportunity.schedule)
  const credits = creditsScore(student.credits, opportunity.minimum_credits)

  const raw =
    weights.courses * courseRatio +
    weights.skills * skillRatio +
    weights.language * lang +
    weights.schedule * schedule +
    weights.credits * credits

  const score = Math.max(0, Math.min(100, Math.round(raw * 100)))

  const languageOk = lang === 1
  const creditsOk = credits >= 1

  return {
    student_id: student.id,
    opportunity_id: opportunity.id,
    score,
    matched_courses: courses.matched,
    missing_courses: courses.missing,
    matched_skills: skills.matched,
    missing_skills: skills.missing,
    explanation: buildExplanation({
      score,
      matchedCourses: courses.matched,
      missingCourses: courses.missing,
      matchedSkills: skills.matched,
      missingSkills: skills.missing,
      languageOk,
      creditsOk,
    }),
    recommendation: buildRecommendation({
      missingCourses: courses.missing,
      missingSkills: skills.missing,
      languageOk,
      creditsOk,
      minimumCredits: opportunity.minimum_credits,
      studentCredits: student.credits,
    }),
  }
}

export function rankMatches(matches: ComputedMatch[]): ComputedMatch[] {
  return [...matches].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.opportunity_id.localeCompare(b.opportunity_id)
  })
}
