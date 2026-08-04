import type { ApiErrorCode, ApiFieldError } from '@/types/api'

/** HTTP-shaped API error used by route handlers and permission helpers. */
export class ApiHttpError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly details?: ApiFieldError[]

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    details?: ApiFieldError[]
  ) {
    super(message)
    this.name = 'ApiHttpError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const HTTP_STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  DATABASE_ERROR: 503,
  SERVICE_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
}

/** Map unknown failures to a safe client-facing ApiHttpError (no secrets). */
export function toSafeApiError(error: unknown): ApiHttpError {
  if (error instanceof ApiHttpError) return error

  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  ) {
    const code = (error as { code: string }).code
    // PostgREST / Postgres unique violation
    if (code === '23505' || code === 'PGRST116') {
      return new ApiHttpError(
        409,
        'CONFLICT',
        code === 'PGRST116' ? 'Resource not found' : 'Resource conflict'
      )
    }
  }

  console.error(error)
  return new ApiHttpError(500, 'INTERNAL_ERROR', 'Unexpected server error')
}
