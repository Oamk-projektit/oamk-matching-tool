/**
 * Small locale-aware formatting helpers shared by student-facing pages.
 * Pure functions only — no React/hooks here.
 */

import type { Locale } from '@/lib/i18n/config'

const DATE_LOCALE: Record<Locale, string> = {
  fi: 'fi-FI',
  en: 'en-GB',
}

/** Formats an ISO date/date-time string as a short locale date, or a fallback dash when absent. */
export function formatDate(value: string | null | undefined, locale: Locale): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

/** Formats an ISO date-time string including time of day. */
export function formatDateTime(value: string | null | undefined, locale: Locale): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** Picks the FI/EN display name for catalog items (Course, Skill, Interest). */
export function localizedName(
  item: { nameFi: string; nameEn: string },
  locale: Locale
): string {
  return locale === 'fi' ? item.nameFi : item.nameEn
}
