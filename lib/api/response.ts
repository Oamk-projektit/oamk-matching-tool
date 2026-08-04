import { NextResponse } from 'next/server'
import type { ApiErrorBody, ApiErrorCode, ApiFieldError } from '@/types/api'
import { ValidationError } from '@/lib/validation'
import { EnvConfigError } from '@/lib/supabase/env'
import {
  ApiHttpError,
  HTTP_STATUS_BY_CODE,
  toSafeApiError,
} from '@/lib/api/errors'

/** Raw JSON response (legacy routes). Prefer `apiSuccess` / `jsonData` for new APIs. */
export function jsonOk<T>(data: T, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 })
}

/** Uniform success envelope `{ data, meta }` for projects-model routes. */
export function jsonData<T, M extends object = Record<string, never>>(
  data: T,
  meta?: M,
  init?: { status?: number }
) {
  return NextResponse.json(
    { data, meta: (meta ?? {}) as M },
    { status: init?.status ?? 200 }
  )
}

export function jsonError(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: ApiFieldError[]
) {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {}),
    },
  }
  return NextResponse.json(body, { status })
}

/** Preferred success helper name (alias of `jsonData`). */
export function apiSuccess<T, M extends object = Record<string, never>>(
  data: T,
  meta?: M,
  init?: { status?: number }
) {
  return jsonData(data, meta, init)
}

/** Preferred error helper — status derived from code when omitted. */
export function apiError(
  code: ApiErrorCode,
  message: string,
  status?: number,
  details?: ApiFieldError[]
) {
  return jsonError(
    status ?? HTTP_STATUS_BY_CODE[code] ?? 500,
    code,
    message,
    details
  )
}

/**
 * Map thrown errors to a safe JSON response.
 * Never includes stack traces, SQL internals, or env/secret values.
 */
export function handleApiError(error: unknown) {
  if (error instanceof ValidationError) {
    return apiError('VALIDATION_ERROR', error.message, 400, error.fields)
  }
  if (error instanceof EnvConfigError) {
    return apiError('SERVICE_UNAVAILABLE', error.message, 503)
  }
  if (error instanceof ApiHttpError) {
    return apiError(error.code, error.message, error.status, error.details)
  }
  const safe = toSafeApiError(error)
  return apiError(safe.code, safe.message, safe.status, safe.details)
}

/** @deprecated Prefer `handleApiError` */
export function handleRouteError(error: unknown) {
  return handleApiError(error)
}
