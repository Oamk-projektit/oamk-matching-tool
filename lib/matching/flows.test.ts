/**
 * ============================================================================
 * TOMMI — Offline usage-path assertions (#144 / #145 logic without UI)
 * ============================================================================
 * Complements live smoke scripts when Supabase is unavailable.
 */

import { describe, expect, it } from 'vitest'
import { computeMatch, rankMatches } from '@/lib/matching/engine'
import {
  DEMO_MATCHES,
  DEMO_OPPORTUNITIES,
  DEMO_STUDENTS,
} from '@/lib/shared/demo-fixtures'

describe('student path logic (#144)', () => {
  it('ranks Aino matches with top result being campus portal-level fit', () => {
    const student = DEMO_STUDENTS[0]!
    const computed = rankMatches(
      DEMO_OPPORTUNITIES.map((o) => computeMatch(student, o))
    )
    expect(computed[0]?.score).toBeGreaterThanOrEqual(80)
    expect(computed[0]?.opportunity_id).toBe(DEMO_OPPORTUNITIES[0]?.id)
  })

  it('keeps seed demo matches ordered high → low', () => {
    const scores = DEMO_MATCHES.map((m) => m.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })
})

describe('teacher path logic (#145)', () => {
  it('exposes applicants sort key via match scores', () => {
    const byScore = [...DEMO_MATCHES].sort((a, b) => b.score - a.score)
    expect(byScore[0]!.score).toBeGreaterThan(byScore.at(-1)!.score)
  })

  it('includes both project and internship opportunities for staff browse', () => {
    const types = new Set(DEMO_OPPORTUNITIES.map((o) => o.type))
    expect(types.has('project')).toBe(true)
    expect(types.has('internship')).toBe(true)
  })
})
