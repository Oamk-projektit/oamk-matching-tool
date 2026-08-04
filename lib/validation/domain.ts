import type {
  ApplicationStatus,
  CourseCompletionStatus,
  PreferredLanguage,
  ProjectStatus,
  ProjectType,
  ProjectWeights,
  WorkMode,
} from '@/types/domain'
import {
  DEFAULT_PROJECT_WEIGHTS,
  isValidProjectWeights,
} from '@/types/domain'
import { isNonEmptyString, isUuid, ValidationError } from '@/lib/validation'

export function assertProjectType(
  value: unknown,
  field = 'projectType'
): ProjectType {
  if (value === 'company_project' || value === 'internship') return value
  throw new ValidationError(`${field} must be company_project or internship`, [
    { field, message: 'Must be company_project or internship' },
  ])
}

export function assertProjectStatus(
  value: unknown,
  field = 'status'
): ProjectStatus {
  if (
    value === 'draft' ||
    value === 'published' ||
    value === 'closed' ||
    value === 'archived'
  ) {
    return value
  }
  throw new ValidationError(`${field} is invalid`, [
    { field, message: 'Must be draft, published, closed, or archived' },
  ])
}

export function assertWorkMode(value: unknown, field = 'workMode'): WorkMode {
  if (value === 'onsite' || value === 'hybrid' || value === 'remote') return value
  throw new ValidationError(`${field} must be onsite, hybrid, or remote`, [
    { field, message: 'Must be onsite, hybrid, or remote' },
  ])
}

export function assertPreferredLanguage(
  value: unknown,
  field = 'requiredLanguage'
): PreferredLanguage {
  if (value === 'fi' || value === 'en') return value
  throw new ValidationError(`${field} must be fi or en`, [
    { field, message: 'Must be fi or en' },
  ])
}

export function assertApplicationStatus(
  value: unknown,
  field = 'status'
): ApplicationStatus {
  const allowed: ApplicationStatus[] = [
    'submitted',
    'under_review',
    'shortlisted',
    'selected',
    'not_selected',
    'withdrawn',
  ]
  if (typeof value === 'string' && allowed.includes(value as ApplicationStatus)) {
    return value as ApplicationStatus
  }
  throw new ValidationError(`${field} is invalid`, [
    { field, message: `Must be one of: ${allowed.join(', ')}` },
  ])
}

export function assertCompletionStatus(
  value: unknown,
  field = 'completionStatus'
): CourseCompletionStatus {
  if (value === 'planned' || value === 'in_progress' || value === 'completed') {
    return value
  }
  throw new ValidationError(`${field} is invalid`, [
    { field, message: 'Must be planned, in_progress, or completed' },
  ])
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

export function assertPositiveInt(
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
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new ValidationError(`${field} must be a positive integer`, [
      { field, message: 'Must be a positive integer' },
    ])
  }
  return value
}

/** Accepts `YYYY-MM-DD` or null/undefined. */
export function assertOptionalDate(
  value: unknown,
  field: string
): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError(`${field} must be YYYY-MM-DD`, [
      { field, message: 'Must be YYYY-MM-DD' },
    ])
  }
  return value
}

export function assertOptionalString(
  value: unknown,
  field: string
): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') {
    throw new ValidationError(`${field} must be a string`, [
      { field, message: 'Must be a string' },
    ])
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function normalizeUuidArray(value: unknown, field: string): string[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    throw new ValidationError(`${field} must be an array`, [
      { field, message: 'Must be an array of UUIDs' },
    ])
  }
  const ids = value.map((item, index) => {
    if (!isUuid(item)) {
      throw new ValidationError(`${field}[${index}] must be a UUID`, [
        { field: `${field}[${index}]`, message: 'Must be a UUID' },
      ])
    }
    return item
  })
  return [...new Set(ids)]
}

export function normalizeProjectTypeArray(
  value: unknown,
  field: string
): ProjectType[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    throw new ValidationError(`${field} must be an array`, [
      { field, message: 'Must be an array' },
    ])
  }
  return [...new Set(value.map((item) => assertProjectType(item, field)))]
}

export function normalizeProjectWeights(value: unknown): ProjectWeights {
  if (value === undefined || value === null) {
    return { ...DEFAULT_PROJECT_WEIGHTS }
  }
  if (typeof value !== 'object') {
    throw new ValidationError('weights must be an object', [
      { field: 'weights', message: 'Must be an object' },
    ])
  }
  const raw = value as Record<string, unknown>
  const keys: (keyof ProjectWeights)[] = [
    'studyCredits',
    'requiredCourses',
    'recommendedCourses',
    'skills',
    'language',
    'availability',
    'interests',
    'degreeProgramme',
  ]
  const weights = { ...DEFAULT_PROJECT_WEIGHTS }
  for (const key of keys) {
    if (raw[key] === undefined) continue
    const n = raw[key]
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) {
      throw new ValidationError(`weights.${key} must be a non-negative integer`, [
        { field: `weights.${key}`, message: 'Must be a non-negative integer' },
      ])
    }
    weights[key] = n
  }
  if (!isValidProjectWeights(weights)) {
    throw new ValidationError('weights must sum to 100', [
      {
        field: 'weights',
        message: `Sum is ${Object.values(weights).reduce((a, b) => a + b, 0)}, expected 100`,
      },
    ])
  }
  return weights
}

export function requireObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Body must be an object', [
      { field: 'body', message: 'Must be an object' },
    ])
  }
  return body as Record<string, unknown>
}

export function requireNonEmptyString(
  value: unknown,
  field: string
): string {
  if (!isNonEmptyString(value)) {
    throw new ValidationError(`${field} is required`, [
      { field, message: 'Required' },
    ])
  }
  return value.trim()
}
