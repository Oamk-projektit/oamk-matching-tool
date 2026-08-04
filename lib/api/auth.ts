/**
 * Auth helpers for API routes.
 * Roles follow the locked projects-model contract (includes `company`).
 */

import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import type { User, SupabaseClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import type { UserRole } from '@/types/domain'
import type { ApiErrorCode, ApiFieldError } from '@/types/api'
import { createClient } from '@/lib/supabase/server'
import { requireSupabasePublicEnv } from '@/lib/supabase/env'
import { ValidationError } from '@/lib/validation'
import { jsonError } from '@/lib/api/response'
import { extractBearerToken } from '@/lib/api/bearer'

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

export type AuthContext = {
  user: User
  role: UserRole
  /** Same as `user.id` — `profiles.id` = `auth.users.id`. */
  profileId: string
  supabase: SupabaseClient
}

function roleFromMetadata(user: User): UserRole {
  const raw = user.user_metadata?.role
  if (
    raw === 'student' ||
    raw === 'company' ||
    raw === 'teacher' ||
    raw === 'admin'
  ) {
    return raw
  }
  return 'student'
}

function isKnownRole(role: unknown): role is UserRole {
  return (
    role === 'student' ||
    role === 'company' ||
    role === 'teacher' ||
    role === 'admin'
  )
}

/**
 * Ensures a profiles row exists for the authenticated user.
 * Canonical schema: `profiles.id` = `auth.users.id`.
 */
export async function ensureProfile(
  supabase: SupabaseClient,
  user: User
): Promise<UserRole> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  }

  if (isKnownRole(profile?.role)) {
    return profile.role
  }

  const role = roleFromMetadata(user)
  const displayName =
    (typeof user.user_metadata?.display_name === 'string' &&
      user.user_metadata.display_name) ||
    user.email ||
    'User'
  const preferredLanguage =
    user.user_metadata?.preferred_language === 'en' ? 'en' : 'fi'

  const { error: upsertError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      role,
      display_name: displayName,
      email: user.email ?? `${user.id}@users.local`,
      preferred_language: preferredLanguage,
    },
    { onConflict: 'id' }
  )

  if (upsertError) {
    throw new ApiHttpError(500, 'INTERNAL_ERROR', upsertError.message)
  }

  return role
}

function createBearerClient(accessToken: string): SupabaseClient {
  let url: string
  let key: string
  try {
    ;({ url, key } = requireSupabasePublicEnv())
  } catch {
    throw new ApiHttpError(
      500,
      'INTERNAL_ERROR',
      'Supabase environment is not configured'
    )
  }

  return createSupabaseJsClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

/**
 * Resolves the caller from either:
 * 1. `Authorization: Bearer <access_token>` (Postman / mobile / scripts), or
 * 2. Supabase Auth cookies (browser SSR session).
 */
export async function requireAuth(): Promise<AuthContext> {
  const headerStore = await headers()
  const bearer = extractBearerToken(headerStore.get('authorization'))

  if (bearer) {
    const supabase = createBearerClient(bearer)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(bearer)

    if (error || !user) {
      throw new ApiHttpError(401, 'UNAUTHORIZED', 'Invalid or expired token')
    }

    const role = await ensureProfile(supabase, user)
    return { user, role, profileId: user.id, supabase }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new ApiHttpError(401, 'UNAUTHORIZED', 'Authentication required')
  }

  const role = await ensureProfile(supabase, user)
  return { user, role, profileId: user.id, supabase }
}

export function requireRole(
  ctx: AuthContext,
  allowed: UserRole[],
  message = 'Insufficient permissions'
): void {
  if (!allowed.includes(ctx.role)) {
    throw new ApiHttpError(403, 'FORBIDDEN', message)
  }
}

export function isStaff(role: UserRole): boolean {
  return role === 'teacher' || role === 'admin'
}

export function handleRouteError(error: unknown) {
  if (error instanceof ValidationError) {
    return jsonError(400, 'VALIDATION_ERROR', error.message, error.fields)
  }
  if (error instanceof ApiHttpError) {
    return jsonError(error.status, error.code, error.message, error.details)
  }
  console.error(error)
  return jsonError(500, 'INTERNAL_ERROR', 'Unexpected server error')
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new ValidationError('Invalid JSON body', [
      { field: 'body', message: 'Must be valid JSON' },
    ])
  }
}

/** Resolves the caller's company membership (MVP: one company per profile). */
export async function getCallerCompanyId(
  supabase: SupabaseClient,
  profileId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return data?.company_id ?? null
}

/** Resolves the caller's student row id when present. */
export async function getCallerStudentId(
  supabase: SupabaseClient,
  profileId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('students')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return data?.id ?? null
}
