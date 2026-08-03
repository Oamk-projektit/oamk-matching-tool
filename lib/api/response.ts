import { NextResponse } from 'next/server'
import type { ApiErrorBody, ApiErrorCode, ApiFieldError } from '@/types/api'

export function jsonOk<T>(data: T, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 })
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
