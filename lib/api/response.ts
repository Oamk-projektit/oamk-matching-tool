import { NextResponse } from 'next/server'
import type { ApiErrorBody, ApiErrorCode, ApiFieldError } from '@/types/api'

/** Raw JSON response (legacy routes / health). Prefer `jsonData` for new APIs. */
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
