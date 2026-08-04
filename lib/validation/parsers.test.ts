import { describe, expect, it } from 'vitest'
import {
  assertEmail,
  assertRequiredName,
  normalizeWeights,
  ValidationError,
} from '@/lib/validation'
import { parseCreateOpportunity } from '@/lib/opportunities/parse'
import { normalizeCatalogLabel } from '@/lib/catalogs/normalize'
import { normalizeProjectWeights } from '@/lib/validation/domain'
import { DEFAULT_PROJECT_WEIGHTS } from '@/types/domain'

describe('validation (legacy helpers)', () => {
  it('requires name and valid email', () => {
    expect(assertRequiredName(' Aino ')).toBe('Aino')
    expect(assertEmail('Aino@Students.oamk.fi')).toBe(
      'aino@students.oamk.fi'
    )
    expect(() => assertEmail('nope')).toThrow(ValidationError)
  })

  it('requires legacy weights to sum to 1', () => {
    expect(() =>
      normalizeWeights({
        courses: 0.5,
        skills: 0.5,
        language: 0.5,
        schedule: 0,
        credits: 0,
      })
    ).toThrow(ValidationError)
  })
})

describe('catalog / project validation', () => {
  it('normalizes skill labels', () => {
    expect(normalizeCatalogLabel('SQL  Server')).toBe('sql server')
  })

  it('requires project weights to sum to 100', () => {
    expect(normalizeProjectWeights(DEFAULT_PROJECT_WEIGHTS)).toEqual(
      DEFAULT_PROJECT_WEIGHTS
    )
    expect(() =>
      normalizeProjectWeights({ ...DEFAULT_PROJECT_WEIGHTS, language: 0 })
    ).toThrow(ValidationError)
  })
})

describe('legacy opportunity parser', () => {
  it('parses create opportunity payload', () => {
    const parsed = parseCreateOpportunity({
      name: 'Portal',
      type: 'project',
      required_skills: ['React'],
      student_slots: 2,
    })
    expect(parsed.type).toBe('project')
    expect(parsed.weights?.skills).toBe(0.4)
  })
})
