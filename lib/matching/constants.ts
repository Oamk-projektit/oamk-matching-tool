/**
 * Matching defaults and documented scoring constants.
 *
 * Prompt-5 sketch used six fractional criteria (credits 30 / required courses 25 /
 * skills 20 / language 10 / schedule 10 / interests 5). The locked API contract
 * instead uses eight integer weights that must sum to 100 and includes
 * `recommendedCourses` + `degreeProgramme` (`DEFAULT_PROJECT_WEIGHTS`).
 *
 * This engine follows the locked contract so API, DB CHECK, and snapshots stay aligned.
 */

import {
  DEFAULT_PROJECT_WEIGHTS,
  PROJECT_WEIGHT_TOTAL,
  type ProjectWeights,
} from '@/types/domain'

export { DEFAULT_PROJECT_WEIGHTS, PROJECT_WEIGHT_TOTAL }

/** Re-export for callers that import defaults from matching/constants. */
export const DEFAULT_MATCHING_WEIGHTS: ProjectWeights = DEFAULT_PROJECT_WEIGHTS

/**
 * When both required and recommended skills exist, required drives most of the
 * skills criterion. Missing required skills hurt more than missing recommended.
 */
export const SKILLS_REQUIRED_BLEND = 0.8
export const SKILLS_RECOMMENDED_BLEND = 0.2

/** Neutral availability when either side lacks dates. */
export const AVAILABILITY_UNKNOWN_RATIO = 0.5

/** Credits scale floor so a near-miss is not scored as absolute zero. */
export const CREDITS_FLOOR_RATIO = 0

/**
 * Documented skill-name aliases → working language codes.
 * Used only for structured label matching — never UI preferredLanguage.
 */
export const LANGUAGE_SKILL_ALIASES: Record<string, 'fi' | 'en'> = {
  fi: 'fi',
  finnish: 'fi',
  suomi: 'fi',
  'suomen kieli': 'fi',
  en: 'en',
  english: 'en',
  englanti: 'en',
  'english language': 'en',
}

/**
 * Optional CEFR ordering when `minimumLanguageLevel` is set on a project.
 * Unknown levels are ignored (no penalty beyond language presence).
 */
export const CEFR_LEVEL_ORDER: Record<string, number> = {
  a1: 1,
  a2: 2,
  b1: 3,
  b2: 4,
  c1: 5,
  c2: 6,
}
