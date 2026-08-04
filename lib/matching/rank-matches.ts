/**
 * Deterministic ranking for match results.
 *
 * Tie-break order (documented):
 * 1. totalScore descending
 * 2. studentId ascending (stable, UUID lexicographic)
 * 3. projectId ascending
 *
 * Top-N shortlists use the same order so equal scores never shuffle.
 */

import type { CalculatedMatch, RankedMatch } from '@/lib/matching/types'

export function compareMatches(a: CalculatedMatch, b: CalculatedMatch): number {
  if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
  const byStudent = a.studentId.localeCompare(b.studentId)
  if (byStudent !== 0) return byStudent
  return a.projectId.localeCompare(b.projectId)
}

export function rankMatches(matches: CalculatedMatch[]): CalculatedMatch[] {
  return [...matches].sort(compareMatches)
}

/** Assign 1-based ranks after sorting. Ties keep sequential ranks by tie-break. */
export function rankMatchesWithPosition(
  matches: CalculatedMatch[]
): RankedMatch[] {
  return rankMatches(matches).map((match, index) => ({
    ...match,
    rank: index + 1,
  }))
}

/** Top N candidates for company / teacher / admin shortlists. */
export function topCandidates(
  matches: CalculatedMatch[],
  limit = 3
): RankedMatch[] {
  const safeLimit = Math.max(0, Math.min(limit, matches.length))
  return rankMatchesWithPosition(matches).slice(0, safeLimit)
}
