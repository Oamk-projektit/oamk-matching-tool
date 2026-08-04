/**
 * Unit tests for the deterministic projects-model matching engine (Prompt 5).
 */

import { describe, expect, it } from 'vitest'
import {
  assertValidWeights,
  availabilityScore,
  calculateMatch,
  creditsScore,
  InvalidMatchingWeightsError,
  languageScore,
  ratioScore,
  splitRequired,
} from '@/lib/matching/calculate-match'
import { explainMatch } from '@/lib/matching/explain-match'
import { canViewProjectMatchLists } from '@/lib/matching/load-inputs'
import { rankMatches, topCandidates } from '@/lib/matching/rank-matches'
import type {
  CalculatedMatch,
  MatchProjectInput,
  MatchStudentInput,
} from '@/lib/matching/types'
import { DEFAULT_PROJECT_WEIGHTS, type ProjectWeights } from '@/types/domain'

const FIXED_AT = '2026-08-04T12:00:00.000Z'

const baseStudent: MatchStudentInput = {
  id: 's0000000-0000-4000-8000-000000000001',
  studyCredits: 160,
  degreeProgramme: 'Tietotekniikka',
  department: 'ICT',
  languages: ['fi'],
  availabilityStart: '2026-09-01',
  availabilityEnd: '2026-12-15',
  courses: ['Web-ohjelmointi', 'Tietokannat'],
  skills: ['React', 'TypeScript', 'SQL', 'Finnish'],
  interests: ['Web development', 'UI design'],
}

const baseProject: MatchProjectInput = {
  id: 'p0000000-0000-4000-8000-000000000001',
  title: 'Campus portal renewal',
  minimumStudyCredits: 60,
  requiredLanguage: 'fi',
  minimumLanguageLevel: null,
  projectStart: '2026-09-15',
  projectEnd: '2026-12-01',
  workMode: 'hybrid',
  remoteAllowed: true,
  department: 'ICT',
  requiredCourses: ['Web-ohjelmointi'],
  recommendedCourses: ['Tietokannat'],
  requiredSkills: ['React', 'TypeScript'],
  recommendedSkills: ['SQL'],
  interests: ['Web development'],
  weights: DEFAULT_PROJECT_WEIGHTS,
}

function match(
  student: MatchStudentInput = baseStudent,
  project: MatchProjectInput = baseProject,
  weights: ProjectWeights = project.weights
) {
  return calculateMatch(student, project, weights, 'en', FIXED_AT)
}

describe('weight validation', () => {
  it('accepts default weights summing to 100', () => {
    expect(() => assertValidWeights(DEFAULT_PROJECT_WEIGHTS)).not.toThrow()
  })

  it('rejects wrong weight sum', () => {
    const bad: ProjectWeights = {
      ...DEFAULT_PROJECT_WEIGHTS,
      skills: DEFAULT_PROJECT_WEIGHTS.skills + 1,
    }
    expect(() => assertValidWeights(bad)).toThrow(InvalidMatchingWeightsError)
  })

  it('rejects negative weights', () => {
    const bad: ProjectWeights = {
      ...DEFAULT_PROJECT_WEIGHTS,
      language: -1,
      interests: DEFAULT_PROJECT_WEIGHTS.interests + 1,
    }
    expect(() => assertValidWeights(bad)).toThrow(InvalidMatchingWeightsError)
  })

  it('allows project-specific valid weights', () => {
    const custom: ProjectWeights = {
      studyCredits: 30,
      requiredCourses: 25,
      recommendedCourses: 5,
      skills: 20,
      language: 10,
      availability: 5,
      interests: 0,
      degreeProgramme: 5,
    }
    expect(() => assertValidWeights(custom)).not.toThrow()
    const result = match(baseStudent, { ...baseProject, weights: custom }, custom)
    expect(result.weightsSnapshot).toEqual(custom)
    expect(result.totalScore).toBeGreaterThanOrEqual(0)
    expect(result.totalScore).toBeLessThanOrEqual(100)
  })
})

describe('credits scoring', () => {
  it('gives full score when project has no minimum', () => {
    expect(creditsScore(0, 0)).toBe(1)
    expect(creditsScore(10, 0)).toBe(1)
  })

  it('gives full score when student meets requirement', () => {
    expect(creditsScore(60, 60)).toBe(1)
    expect(creditsScore(160, 60)).toBe(1)
  })

  it('scales when student is below requirement', () => {
    expect(creditsScore(30, 60)).toBe(0.5)
    const result = match(
      { ...baseStudent, studyCredits: 30 },
      { ...baseProject, minimumStudyCredits: 60 }
    )
    expect(result.ratios.studyCredits).toBe(0.5)
    expect(result.scoreBreakdown.studyCredits).toBe(5) // 10 * 0.5
  })

  it('never divides by zero', () => {
    expect(creditsScore(50, 0)).toBe(1)
    expect(Number.isNaN(creditsScore(50, 0))).toBe(false)
  })
})

describe('courses', () => {
  it('splits required lists case-insensitively', () => {
    expect(splitRequired(['React', 'Python'], ['react', 'SQL'])).toEqual({
      matched: ['React'],
      missing: ['Python'],
    })
  })

  it('penalizes missing required course', () => {
    const result = match(
      { ...baseStudent, courses: ['Tietokannat'] },
      baseProject
    )
    expect(result.missingRequiredCourses).toEqual(['Web-ohjelmointi'])
    expect(result.matchedRequiredCourses).toEqual([])
    expect(result.ratios.requiredCourses).toBe(0)
  })

  it('tracks missing recommended course separately', () => {
    const result = match(
      { ...baseStudent, courses: ['Web-ohjelmointi'] },
      baseProject
    )
    expect(result.matchedRequiredCourses).toEqual(['Web-ohjelmointi'])
    expect(result.missingRecommendedCourses).toEqual(['Tietokannat'])
    expect(result.ratios.recommendedCourses).toBe(0)
  })

  it('gives full course ratios for empty optional lists', () => {
    const result = match(baseStudent, {
      ...baseProject,
      requiredCourses: [],
      recommendedCourses: [],
    })
    expect(result.ratios.requiredCourses).toBe(1)
    expect(result.ratios.recommendedCourses).toBe(1)
    expect(ratioScore(0, 0)).toBe(1)
  })
})

describe('skills', () => {
  it('scores partial required skill overlap', () => {
    const result = match(
      { ...baseStudent, skills: ['React', 'Finnish'] },
      baseProject
    )
    expect(result.matchedRequiredSkills).toEqual(['React'])
    expect(result.missingRequiredSkills).toEqual(['TypeScript'])
    expect(result.ratios.skills).toBeGreaterThan(0)
    expect(result.ratios.skills).toBeLessThan(1)
  })
})

describe('language', () => {
  it('fails when student lacks required working language', () => {
    expect(languageScore(['en'], 'fi').matched).toBe(false)
    const result = match(
      { ...baseStudent, languages: ['en'], skills: ['React', 'TypeScript'] },
      baseProject
    )
    expect(result.language.matched).toBe(false)
    expect(result.ratios.language).toBe(0)
    expect(result.scoreBreakdown.language).toBe(0)
  })

  it('does not treat empty languages as a match', () => {
    const result = match({ ...baseStudent, languages: [] }, baseProject)
    expect(result.language.matched).toBe(false)
  })
})

describe('availability', () => {
  it('fails when windows do not overlap', () => {
    const outcome = availabilityScore(
      { availabilityStart: '2025-01-01', availabilityEnd: '2025-02-01' },
      {
        projectStart: '2026-09-15',
        projectEnd: '2026-12-01',
        workMode: 'hybrid',
        remoteAllowed: true,
      }
    )
    expect(outcome.status).toBe('none')
    expect(outcome.ratio).toBe(0)

    const result = match(
      {
        ...baseStudent,
        availabilityStart: '2025-01-01',
        availabilityEnd: '2025-02-01',
      },
      baseProject
    )
    expect(result.availability.status).toBe('none')
    expect(result.ratios.availability).toBe(0)
  })
})

describe('calculateMatch overall', () => {
  it('returns a high score for a perfect fit', () => {
    const result = match()
    expect(result.totalScore).toBeGreaterThanOrEqual(90)
    expect(result.missingRequiredCourses).toEqual([])
    expect(result.missingRequiredSkills).toEqual([])
    expect(result.language.matched).toBe(true)
    expect(result.totalScore).toBeLessThanOrEqual(100)
    expect(result.weightsSnapshot).toEqual(DEFAULT_PROJECT_WEIGHTS)
    expect(result.calculatedAt).toBe(FIXED_AT)
  })

  it('returns a low score for a completely unsuitable profile', () => {
    const result = match(
      {
        id: 's-bad',
        studyCredits: 0,
        degreeProgramme: null,
        department: null,
        languages: [],
        availabilityStart: '2020-01-01',
        availabilityEnd: '2020-02-01',
        courses: [],
        skills: [],
        interests: [],
      },
      baseProject
    )
    expect(result.totalScore).toBeLessThan(40)
    expect(result.totalScore).toBeGreaterThanOrEqual(0)
    expect(result.missingRequiredCourses.length).toBeGreaterThan(0)
    expect(result.missingRequiredSkills.length).toBeGreaterThan(0)
  })

  it('keeps totalScore within 0–100 and free of NaN', () => {
    const result = match()
    expect(Number.isNaN(result.totalScore)).toBe(false)
    expect(result.totalScore).toBeGreaterThanOrEqual(0)
    expect(result.totalScore).toBeLessThanOrEqual(100)
    for (const value of Object.values(result.scoreBreakdown)) {
      expect(Number.isNaN(value)).toBe(false)
      expect(value).toBeGreaterThanOrEqual(0)
    }
  })

  it('is deterministic for identical inputs', () => {
    const a = match()
    const b = match()
    expect(a).toEqual(b)
  })

  it('snapshots weights so later weight changes do not alter prior result objects', () => {
    const weights: ProjectWeights = { ...DEFAULT_PROJECT_WEIGHTS }
    const result = match(baseStudent, { ...baseProject, weights }, weights)
    weights.skills = 99
    expect(result.weightsSnapshot.skills).toBe(DEFAULT_PROJECT_WEIGHTS.skills)
  })
})

describe('explanations', () => {
  it('aligns explanation with breakdown gaps', () => {
    const result = match(
      {
        ...baseStudent,
        courses: [],
        skills: ['Finnish'],
        languages: ['en'],
      },
      baseProject
    )
    expect(result.explanation).toContain('Missing required courses')
    expect(result.explanation).toContain('Missing required skills')
    expect(result.explanation).toContain('Language requirement not met')
    const rebuilt = explainMatch(
      (({ explanation, ...rest }) => {
        void explanation
        return rest
      })(result),
      'en'
    )
    expect(rebuilt).toBe(result.explanation)
  })
})

describe('ranking and Top 3', () => {
  function stub(partial: Partial<CalculatedMatch> & Pick<CalculatedMatch, 'studentId' | 'totalScore'>): CalculatedMatch {
    const base = match()
    return {
      ...base,
      ...partial,
      projectId: partial.projectId ?? baseProject.id,
    }
  }

  it('orders by score then studentId deterministically', () => {
    const ranked = rankMatches([
      stub({ studentId: 's-b', totalScore: 80 }),
      stub({ studentId: 's-a', totalScore: 90 }),
      stub({ studentId: 's-c', totalScore: 80 }),
    ])
    expect(ranked.map((m) => m.studentId)).toEqual(['s-a', 's-b', 's-c'])
  })

  it('returns at most three top candidates with stable tie-break', () => {
    const top = topCandidates(
      [
        stub({ studentId: 's-d', totalScore: 70 }),
        stub({ studentId: 's-a', totalScore: 90 }),
        stub({ studentId: 's-b', totalScore: 90 }),
        stub({ studentId: 's-c', totalScore: 85 }),
      ],
      3
    )
    expect(top).toHaveLength(3)
    expect(top.map((m) => m.studentId)).toEqual(['s-a', 's-b', 's-c'])
    expect(top.map((m) => m.rank)).toEqual([1, 2, 3])
  })
})

describe('Top 3 privacy', () => {
  it('denies students from project match lists and top candidates', () => {
    expect(canViewProjectMatchLists('student')).toBe(false)
    expect(canViewProjectMatchLists('company')).toBe(true)
    expect(canViewProjectMatchLists('teacher')).toBe(true)
    expect(canViewProjectMatchLists('admin')).toBe(true)
  })
})
