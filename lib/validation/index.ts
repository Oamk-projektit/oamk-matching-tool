import type {
  AppLanguage,
  MatchingWeights,
  OpportunityType,
  UserRole,
} from '@/types/domain'
import { DEFAULT_MATCHING_WEIGHTS } from '@/types/domain'
import type { ApiFieldError } from '@/types/api'

export class ValidationError extends Error {
  readonly fields: ApiFieldError[]

  constructor(message: string, fields: ApiFieldError[] = []) {
    super(message)
    this.name = 'ValidationError'
    this.fields = fields
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  )
}

export function assertLanguage(value: unknown, field = 'language'): AppLanguage {
  if (value === 'FI' || value === 'EN') return value
  throw new ValidationError(`${field} must be FI or EN`, [
    { field, message: 'Must be FI or EN' },
  ])
}

export function assertOpportunityType(
  value: unknown,
  field = 'type'
): OpportunityType {
  if (value === 'project' || value === 'internship') return value
  throw new ValidationError(`${field} must be project or internship`, [
    { field, message: 'Must be project or internship' },
  ])
}

export function assertUserRole(value: unknown, field = 'role'): UserRole {
  if (value === 'student' || value === 'teacher' || value === 'admin') {
    return value
  }
  throw new ValidationError(`${field} must be student, teacher, or admin`, [
    { field, message: 'Invalid role' },
  ])
}

export function normalizeStringArray(
  value: unknown,
  field: string
): string[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    throw new ValidationError(`${field} must be an array`, [
      { field, message: 'Must be an array of strings' },
    ])
  }
  const items = value.map((item, index) => {
    if (!isNonEmptyString(item)) {
      throw new ValidationError(`${field}[${index}] must be a non-empty string`, [
        { field: `${field}[${index}]`, message: 'Must be a non-empty string' },
      ])
    }
    return item.trim()
  })
  return [...new Set(items)]
}

export function normalizeOpportunityTypeArray(
  value: unknown,
  field: string
): OpportunityType[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    throw new ValidationError(`${field} must be an array`, [
      { field, message: 'Must be an array' },
    ])
  }
  return [...new Set(value.map((item) => assertOpportunityType(item, field)))]
}

export function assertNonNegativeInt(
  value: unknown,
  field: string,
  fallback?: number
): number {
  if (value === undefined || value === null) {
    if (fallback !== undefined) return fallback
    throw new ValidationError(`${field} is required`, [
      { field, message: 'Required' },
    ])
  }
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new ValidationError(`${field} must be a non-negative integer`, [
      { field, message: 'Must be a non-negative integer' },
    ])
  }
  return value
}

export function assertEmail(value: unknown, field = 'email'): string {
  if (!isNonEmptyString(value) || !EMAIL_RE.test(value.trim())) {
    throw new ValidationError(`${field} must be a valid email`, [
      { field, message: 'Invalid email' },
    ])
  }
  return value.trim().toLowerCase()
}

export function assertRequiredName(value: unknown, field = 'name'): string {
  if (!isNonEmptyString(value)) {
    throw new ValidationError(`${field} is required`, [
      { field, message: 'Required' },
    ])
  }
  return value.trim()
}

export function normalizeWeights(value: unknown): MatchingWeights {
  if (value === undefined || value === null) {
    return { ...DEFAULT_MATCHING_WEIGHTS }
  }
  if (typeof value !== 'object') {
    throw new ValidationError('weights must be an object', [
      { field: 'weights', message: 'Must be an object' },
    ])
  }
  const raw = value as Record<string, unknown>
  const keys: (keyof MatchingWeights)[] = [
    'courses',
    'skills',
    'language',
    'schedule',
    'credits',
  ]
  const weights = { ...DEFAULT_MATCHING_WEIGHTS }
  for (const key of keys) {
    if (raw[key] === undefined) continue
    const n = raw[key]
    if (typeof n !== 'number' || Number.isNaN(n) || n < 0) {
      throw new ValidationError(`weights.${key} must be a non-negative number`, [
        { field: `weights.${key}`, message: 'Must be a non-negative number' },
      ])
    }
    weights[key] = n
  }
  const sum = keys.reduce((acc, key) => acc + weights[key], 0)
  if (Math.abs(sum - 1) > 0.001) {
    throw new ValidationError('weights must sum to 1.0', [
      { field: 'weights', message: `Sum is ${sum}, expected 1.0` },
    ])
  }
  return weights
}
