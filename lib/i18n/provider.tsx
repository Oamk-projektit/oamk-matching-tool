'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  type Locale,
} from './config'
import { getMessages, translate, type Messages } from './messages'

type I18nContextValue = {
  locale: Locale
  messages: Messages
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale
  try {
    const fromStorage = window.localStorage.getItem(localeCookieName)
    if (isLocale(fromStorage)) return fromStorage
  } catch {
    /* ignore */
  }
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${localeCookieName}=`))
  const cookieValue = match?.split('=')[1]
  if (isLocale(cookieValue)) return cookieValue
  return defaultLocale
}

function persistLocale(locale: Locale) {
  try {
    window.localStorage.setItem(localeCookieName, locale)
  } catch {
    /* ignore */
  }
  const maxAge = 60 * 60 * 24 * 365
  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`
  document.documentElement.lang = locale
}

export function I18nProvider({
  children,
  initialLocale = defaultLocale,
}: {
  children: React.ReactNode
  initialLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    const stored = readStoredLocale()
    document.documentElement.lang = stored
    if (stored === initialLocale) return
    const id = window.setTimeout(() => setLocaleState(stored), 0)
    return () => window.clearTimeout(id)
  }, [initialLocale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    persistLocale(next)
  }, [])

  const messages = useMemo(() => getMessages(locale), [locale])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(messages, key, vars),
    [messages]
  )

  const value = useMemo(
    () => ({ locale, messages, setLocale, t }),
    [locale, messages, setLocale, t]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return ctx
}

/** Convenience: `t('nav.projects')` */
export function useTranslations() {
  const { t, locale, setLocale } = useI18n()
  return { t, locale, setLocale }
}
