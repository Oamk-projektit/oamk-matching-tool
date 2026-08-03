import { describe, expect, it } from 'vitest'
import {
  assertEmail,
  assertRequiredName,
  normalizeWeights,
  ValidationError,
} from '@/lib/validation'
import { parseCreateStudent } from '@/lib/students/parse'
import { parseCreateOpportunity } from '@/lib/opportunities/parse'

describe('validation', () => {
  it('requires name and valid email', () => {
    expect(assertRequiredName(' Aino ')).toBe('Aino')
    expect(assertEmail('Aino@Students.oamk.fi')).toBe(
      'aino@students.oamk.fi'
    )
    expect(() => assertEmail('nope')).toThrow(ValidationError)
  })

  it('requires weights to sum to 1', () => {
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

describe('request parsers', () => {
  it('parses create student payload', () => {
    const parsed = parseCreateStudent({
      name: 'Aino Virtanen',
      email: 'aino@students.oamk.fi',
      credits: 120,
      skills: ['React', 'React'],
      project_preferences: ['project'],
    })
    expect(parsed.skills).toEqual(['React'])
    expect(parsed.language).toBe('FI')
  })

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
