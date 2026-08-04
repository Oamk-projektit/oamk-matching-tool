/**
 * UI i18n config (BCP 47 locales). Separate from domain AppLanguage (FI/EN).
 */
export const locales = ['fi', 'en'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'fi'

export const localeCookieName = 'NEXT_LOCALE'

export const localeLabels: Record<Locale, string> = {
  fi: 'Suomi',
  en: 'English',
}

export function isLocale(value: unknown): value is Locale {
  return value === 'fi' || value === 'en'
}
