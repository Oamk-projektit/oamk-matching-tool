/**
 * Build human-readable match explanations from the same breakdown used for scoring.
 * No discriminatory or person-unrelated rationale.
 */

import type { CalculatedMatch, MatchLocale } from '@/lib/matching/types'
import type { ScoreBreakdown } from '@/types/domain'

type ExplainInput = Omit<CalculatedMatch, 'explanation'>

function topPositiveCriteria(
  breakdown: ScoreBreakdown,
  weights: ExplainInput['weightsSnapshot'],
  limit = 3
): (keyof ScoreBreakdown)[] {
  const keys = Object.keys(breakdown) as (keyof ScoreBreakdown)[]
  return keys
    .filter((key) => breakdown[key] > 0 && weights[key] > 0)
    .sort((a, b) => {
      if (breakdown[b] !== breakdown[a]) return breakdown[b] - breakdown[a]
      return a.localeCompare(b)
    })
    .slice(0, limit)
}

const CRITERION_LABELS: Record<
  keyof ScoreBreakdown,
  { en: string; fi: string }
> = {
  studyCredits: { en: 'study credits', fi: 'opintopisteet' },
  requiredCourses: { en: 'required courses', fi: 'vaaditut kurssit' },
  recommendedCourses: {
    en: 'recommended courses',
    fi: 'suositellut kurssit',
  },
  skills: { en: 'skills', fi: 'taidot' },
  language: { en: 'language', fi: 'kieli' },
  availability: { en: 'availability', fi: 'aikataulu' },
  interests: { en: 'interests', fi: 'kiinnostukset' },
  degreeProgramme: { en: 'degree programme', fi: 'tutkinto-ohjelma' },
}

function labelOf(key: keyof ScoreBreakdown, locale: MatchLocale): string {
  return CRITERION_LABELS[key][locale]
}

function developmentSuggestion(input: ExplainInput, locale: MatchLocale): string {
  const tips: string[] = []

  if (locale === 'fi') {
    if (input.missingRequiredCourses.length > 0) {
      tips.push(`Suorita vaaditut kurssit: ${input.missingRequiredCourses.join(', ')}.`)
    }
    if (input.missingRequiredSkills.length > 0) {
      tips.push(`Kehitä vaadittuja taitoja: ${input.missingRequiredSkills.join(', ')}.`)
    }
    if (!input.language.matched) {
      tips.push('Vahvista projektin vaatimaa työkieltä (ei UI-kielivalintaa).')
    }
    if (input.availability.status === 'none') {
      tips.push('Sovita saatavuutesi projektin aikatauluun.')
    }
    if (input.ratios.studyCredits < 1) {
      tips.push('Kerää lisää opintopisteitä täyttääksesi vähimmäisvaatimuksen.')
    }
    if (tips.length === 0) {
      return 'Profiili vastaa hyvin vaatimuksia; tarkista vielä projektin kuvaus ennen hakemista.'
    }
    return tips.join(' ')
  }

  if (input.missingRequiredCourses.length > 0) {
    tips.push(
      `Complete required courses: ${input.missingRequiredCourses.join(', ')}.`
    )
  }
  if (input.missingRequiredSkills.length > 0) {
    tips.push(
      `Build required skills: ${input.missingRequiredSkills.join(', ')}.`
    )
  }
  if (!input.language.matched) {
    tips.push(
      'Strengthen the project working language (not the UI language setting).'
    )
  }
  if (input.availability.status === 'none') {
    tips.push('Align your availability with the project schedule.')
  }
  if (input.ratios.studyCredits < 1) {
    tips.push('Earn more study credits to meet the minimum requirement.')
  }
  if (tips.length === 0) {
    return 'Profile fits well; review the project description before applying.'
  }
  return tips.join(' ')
}

export function explainMatch(input: ExplainInput, locale: MatchLocale = 'en'): string {
  const parts: string[] = []
  const top = topPositiveCriteria(input.scoreBreakdown, input.weightsSnapshot)

  if (locale === 'fi') {
    if (input.totalScore >= 80) {
      parts.push('Vahva kokonaissopivuus tähän projektiin.')
    } else if (input.totalScore >= 50) {
      parts.push('Osittainen sopivuus; joitain puutteita kannattaa täydentää.')
    } else {
      parts.push('Vähäinen vastaavuus projektin vaatimuksiin.')
    }

    if (top.length > 0) {
      parts.push(
        `Vahvimmat kriteerit: ${top.map((k) => labelOf(k, 'fi')).join(', ')}.`
      )
    }
    if (input.missingRequiredCourses.length > 0) {
      parts.push(
        `Puuttuvat pakolliset kurssit: ${input.missingRequiredCourses.join(', ')}.`
      )
    }
    if (input.missingRequiredSkills.length > 0) {
      parts.push(
        `Puuttuvat pakolliset taidot: ${input.missingRequiredSkills.join(', ')}.`
      )
    }
    parts.push(
      input.language.matched
        ? 'Kielivaatimus täyttyy.'
        : 'Kielivaatimus ei täyty.'
    )
    if (input.availability.status === 'full') {
      parts.push('Aikataulu sopii täysin.')
    } else if (input.availability.status === 'partial') {
      parts.push('Aikataulu sopii osittain.')
    } else if (input.availability.status === 'none') {
      parts.push('Aikataulu ei sovi.')
    } else {
      parts.push('Aikataulutieto on puutteellinen; neutraali arvio.')
    }
    parts.push(developmentSuggestion(input, 'fi'))
    return parts.join(' ')
  }

  if (input.totalScore >= 80) {
    parts.push('Strong overall fit for this project.')
  } else if (input.totalScore >= 50) {
    parts.push('Partial fit with some gaps to address.')
  } else {
    parts.push('Limited overlap with the project requirements.')
  }

  if (top.length > 0) {
    parts.push(
      `Strongest criteria: ${top.map((k) => labelOf(k, 'en')).join(', ')}.`
    )
  }
  if (input.missingRequiredCourses.length > 0) {
    parts.push(
      `Missing required courses: ${input.missingRequiredCourses.join(', ')}.`
    )
  }
  if (input.missingRequiredSkills.length > 0) {
    parts.push(
      `Missing required skills: ${input.missingRequiredSkills.join(', ')}.`
    )
  }
  parts.push(
    input.language.matched
      ? 'Language requirement met.'
      : 'Language requirement not met.'
  )
  if (input.availability.status === 'full') {
    parts.push('Schedule is fully compatible.')
  } else if (input.availability.status === 'partial') {
    parts.push('Schedule is partially compatible.')
  } else if (input.availability.status === 'none') {
    parts.push('Schedule is not compatible.')
  } else {
    parts.push('Schedule data is incomplete; neutral assessment.')
  }
  parts.push(developmentSuggestion(input, 'en'))
  return parts.join(' ')
}
