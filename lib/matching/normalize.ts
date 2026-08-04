/**
 * Deterministic label normalization for courses, skills, and interests.
 * No semantic / AI similarity — exact match after normalize (+ documented aliases).
 */

import { LANGUAGE_SKILL_ALIASES } from '@/lib/matching/constants'
import type { PreferredLanguage } from '@/types/domain'

/** Trim, collapse whitespace, lowercase. */
export function normalizeLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Normalize a list while preserving first-seen original labels for display. */
export function normalizeLabelSet(values: string[]): Set<string> {
  return new Set(values.map(normalizeLabel).filter(Boolean))
}

/**
 * Map a skill label to a working language when it matches a documented alias.
 * Returns null when the label is not a known language skill alias.
 */
export function languageFromSkillAlias(
  skillLabel: string
): PreferredLanguage | null {
  const key = normalizeLabel(skillLabel)
  return LANGUAGE_SKILL_ALIASES[key] ?? null
}

/**
 * Derive working languages from structured skill labels only.
 * Does not use UI preferredLanguage.
 */
export function languagesFromSkills(skills: string[]): PreferredLanguage[] {
  const found = new Set<PreferredLanguage>()
  for (const skill of skills) {
    const lang = languageFromSkillAlias(skill)
    if (lang) found.add(lang)
  }
  return [...found].sort()
}

export function normalizeCefrLevel(level: string | null | undefined): string | null {
  if (!level) return null
  const normalized = normalizeLabel(level).replace(/[^a-z0-9]/g, '')
  return normalized || null
}
