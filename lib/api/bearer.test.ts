import { describe, expect, it } from 'vitest'
import { extractBearerToken } from '@/lib/api/bearer'

describe('extractBearerToken', () => {
  it('parses a normal Bearer header', () => {
    expect(extractBearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi')
  })

  it('is case-insensitive and trims', () => {
    expect(extractBearerToken('  bearer   token-value  ')).toBe('token-value')
  })

  it('returns null for missing or invalid values', () => {
    expect(extractBearerToken(null)).toBeNull()
    expect(extractBearerToken(undefined)).toBeNull()
    expect(extractBearerToken('Basic xyz')).toBeNull()
    expect(extractBearerToken('Bearer')).toBeNull()
    expect(extractBearerToken('Bearer   ')).toBeNull()
  })
})
