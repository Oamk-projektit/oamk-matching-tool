import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PROJECT_WEIGHTS,
  PROJECT_WEIGHT_TOTAL,
  isValidProjectWeights,
  sumProjectWeights,
  type ProjectWeights,
} from './domain'

describe('ProjectWeights invariants', () => {
  it('DEFAULT_PROJECT_WEIGHTS sums to 100', () => {
    expect(sumProjectWeights(DEFAULT_PROJECT_WEIGHTS)).toBe(PROJECT_WEIGHT_TOTAL)
    expect(isValidProjectWeights(DEFAULT_PROJECT_WEIGHTS)).toBe(true)
  })

  it('rejects weights that do not sum to 100', () => {
    const bad: ProjectWeights = {
      ...DEFAULT_PROJECT_WEIGHTS,
      skills: DEFAULT_PROJECT_WEIGHTS.skills + 1,
    }
    expect(sumProjectWeights(bad)).toBe(101)
    expect(isValidProjectWeights(bad)).toBe(false)
  })

  it('accepts a redistributed valid set', () => {
    const weights: ProjectWeights = {
      studyCredits: 15,
      requiredCourses: 25,
      recommendedCourses: 5,
      skills: 20,
      language: 10,
      availability: 10,
      interests: 10,
      degreeProgramme: 5,
    }
    expect(isValidProjectWeights(weights)).toBe(true)
  })
})
