import { describe, expect, it } from 'vitest'
import {
  DEMO_MATCHES,
  DEMO_OPPORTUNITIES,
  DEMO_STUDENTS,
  DEMO_USERS,
} from '@/lib/shared/demo-fixtures'
import { computeMatch } from '@/lib/matching/engine'

describe('demo fixtures (#147 SHARED)', () => {
  it('keeps Aino linked to seed user id', () => {
    expect(DEMO_STUDENTS[0]?.user_id).toBe(DEMO_USERS.aino.id)
    expect(DEMO_OPPORTUNITIES[0]?.teacher_id).toBe(DEMO_USERS.teacher.id)
  })

  it('includes high/medium/low match examples', () => {
    const scores = DEMO_MATCHES.map((m) => m.score).sort((a, b) => b - a)
    expect(scores[0]).toBeGreaterThanOrEqual(80)
    expect(scores[1]).toBeGreaterThanOrEqual(50)
    expect(scores[1]).toBeLessThan(80)
    expect(scores[2]).toBeLessThan(40)
  })

  it('produces a strong live score for Aino vs campus portal', () => {
    const student = DEMO_STUDENTS[0]!
    const opportunity = DEMO_OPPORTUNITIES[0]!
    const result = computeMatch(student, opportunity)
    expect(result.score).toBeGreaterThanOrEqual(80)
  })
})
