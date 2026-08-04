/**
 * Shared request validation helpers for API route handlers.
 * Projects-model validators live in `lib/validation/domain.ts`.
 */

import { ValidationError } from '@/lib/validation'
import type { ApiFieldError } from '@/types/api'
import {
  isUuid,
  isNonEmptyString,
} from '@/lib/validation'

export { ValidationError, isUuid, isNonEmptyString }

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new ValidationError('Invalid JSON body', [
      { field: 'body', message: 'Must be valid JSON' },
    ])
  }
}

export function requireUuid(value: unknown, field: string): string {
  if (!isUuid(value)) {
    throw new ValidationError(`${field} must be a UUID`, [
      { field, message: 'Must be a UUID' },
    ])
  }
  return value
}

export function fieldError(field: string, message: string): ApiFieldError {
  return { field, message }
}
