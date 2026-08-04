import type { Locale } from './config'
import en from '@/messages/en.json'
import fi from '@/messages/fi.json'

export type Messages = typeof fi

const catalogs: Record<Locale, Messages> = {
  fi,
  en,
}

export function getMessages(locale: Locale): Messages {
  return catalogs[locale]
}

type NestedValue = string | { [key: string]: NestedValue }

function getByPath(obj: NestedValue, path: string): string | undefined {
  const parts = path.split('.')
  let current: NestedValue | undefined = obj
  for (const part of parts) {
    if (current == null || typeof current === 'string') return undefined
    current = current[part]
  }
  return typeof current === 'string' ? current : undefined
}

/** Resolve dotted key, e.g. `nav.projects`. Falls back to key if missing. */
export function translate(
  messages: Messages,
  key: string,
  vars?: Record<string, string | number>
): string {
  const raw = getByPath(messages as NestedValue, key) ?? key
  if (!vars) return raw
  return Object.entries(vars).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    raw
  )
}
