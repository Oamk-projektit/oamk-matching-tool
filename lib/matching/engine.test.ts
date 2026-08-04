import { describe, expect, it } from 'vitest'
import {
  computeMatch,
  creditsScore,
  languageScore,
  rankMatches,
  ratioScore,
  scheduleScore,
  splitRequired,
} from '@/lib/matching/engine'
import { DEFAULT_MATCHING_WEIGHTS } from '@/types/legacy'

const studentBase = {
  id: 'b0000000-0000-4000-8000-000000000011',
  credits: 160,
  language: 'FI' as const,
  availability: 'Full-time',
  completed_courses: ['Web-ohjelmointi', 'Tietokannat'],
  skills: ['React', 'TypeScript', 'SQL'],
}

const opportunityBase = {
  id: 'c0000000-0000-4000-8000-000000000001',
  name: 'Campus portal renewal',
  required_courses: ['Web-ohjelmointi'],
  required_skills: ['React', 'TypeScript'],
  required_language: 'FI' as const,
  schedule: 'Flexible',
  minimum_credits: 60,
  weights: DEFAULT_MATCHING_WEIGHTS,
}

describe('matching helpers', () => {
  it('splits required lists deterministically', () => {
    expect(
      splitRequired(['React', 'Python'], ['react', 'SQL'])
    ).toEqual({
      matched: ['React'],
      missing: ['Python'],
    })
  })

  it('computes ratio and language scores', () => {
    expect(ratioScore(2, 4)).toBe(0.5)
    expect(ratioScore(0, 0)).toBe(1)
    expect(languageScore('FI', 'FI')).toBe(1)
    expect(languageScore('FI', 'EN')).toBe(0)
  })

  it('scores schedule and credits', () => {
    expect(scheduleScore('Full-time', 'Full-time')).toBe(1)
    expect(scheduleScore(null, 'Flexible')).toBe(0.5)
    expect(creditsScore(120, 60)).toBe(1)
    expect(creditsScore(30, 60)).toBe(0.5)
  })
})

describe('computeMatch', () => {
  it('returns a high score for a strong profile fit', () => {
    const result = computeMatch(studentBase, opportunityBase)
    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(result.matched_skills).toEqual(['React', 'TypeScript'])
    expect(result.missing_skills).toEqual([])
    expect(result.matched_courses).toEqual(['Web-ohjelmointi'])
    expect(result.explanation.length).toBeGreaterThan(10)
    expect(result.recommendation.length).toBeGreaterThan(5)
  })

  it('is deterministic for identical inputs', () => {
    const a = computeMatch(studentBase, opportunityBase)
    const b = computeMatch(studentBase, opportunityBase)
    expect(a).toEqual(b)
  })

  it('can emit Finnish explanations', () => {
    const fi = computeMatch(
      studentBase,
      opportunityBase,
      opportunityBase.weights,
      'fi'
    )
    expect(fi.explanation).toContain('Vahva')
    expect(fi.recommendation.length).toBeGreaterThan(5)
  })

  it('returns a low score when requirements are missing', () => {
    const weak = computeMatch(
      {
        ...studentBase,
        credits: 20,
        completed_courses: [],
        skills: [],
        language: 'EN',
      },
      {
        ...opportunityBase,
        required_courses: ['Pilvipalvelut'],
        required_skills: ['Docker', 'AWS'],
        required_language: 'FI',
        minimum_credits: 100,
        schedule: 'Full-time',
      }
    )
    expect(weak.score).toBeLessThan(40)
    expect(weak.missing_skills).toEqual(['Docker', 'AWS'])
    expect(weak.missing_courses).toEqual(['Pilvipalvelut'])
  })

  it('ranks by score then opportunity id', () => {
    const ranked = rankMatches([
      {
        student_id: 's',
        opportunity_id: 'b',
        score: 50,
        matched_courses: [],
        missing_courses: [],
        matched_skills: [],
        missing_skills: [],
        explanation: '',
        recommendation: '',
      },
      {
        student_id: 's',
        opportunity_id: 'a',
        score: 90,
        matched_courses: [],
        missing_courses: [],
        matched_skills: [],
        missing_skills: [],
        explanation: '',
        recommendation: '',
      },
      {
        student_id: 's',
        opportunity_id: 'c',
        score: 90,
        matched_courses: [],
        missing_courses: [],
        matched_skills: [],
        missing_skills: [],
        explanation: '',
        recommendation: '',
      },
    ])
    expect(ranked.map((m) => m.opportunity_id)).toEqual(['a', 'c', 'b'])
  })
})
