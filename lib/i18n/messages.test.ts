import { describe, expect, it } from 'vitest'
import { defaultLocale, getMessages, translate } from '@/lib/i18n'

describe('i18n', () => {
  it('defaults to Finnish', () => {
    expect(defaultLocale).toBe('fi')
    expect(getMessages('fi').home.ctaStudent).toBe('Olen opiskelija')
  })

  it('translates dotted keys', () => {
    const messages = getMessages('en')
    expect(translate(messages, 'nav.matches')).toBe('My Matches')
  })

  it('falls back to key when missing', () => {
    const messages = getMessages('fi')
    expect(translate(messages, 'missing.key')).toBe('missing.key')
  })
})
