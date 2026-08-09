/**
 * Auth helpers for API routes.
 * Roles follow the locked projects-model contract (includes `company`).
 *
 * Source of truth:
 * - `auth.users` for authentication identity
 * - `profiles.role` for authorization (never trust request body role)
 */

import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import type { User, SupabaseClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import type { UserRole, Profile } from '@/types/domain'
import type { Database } from '@/types/database'
import { createClient } from '@/lib/supabase/server'
import { requireSupabasePublicEnv } from '@/lib/supabase/env'
import { ValidationError } from '@/lib/validation'
import { ApiHttpError } from '@/lib/api/errors'
import { handleApiError } from '@/lib/api/response'
import { extractBearerToken } from '@/lib/api/bearer'
import { hasRole, isStaffRole } from '@/lib/permissions/roles'

export { ApiHttpError } from '@/lib/api/errors'

export type TypedSupabaseClient = SupabaseClient<Database>

export type AuthContext = {
  user: User
  role: UserRole
  /** Same as `user.id` — `profiles.id` = `auth.users.id`. */
  profileId: string
  profile: Profile
  supabase: TypedSupabaseClient
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
 * Signup-safe role from Auth user_metadata only.
 * Teacher/admin must never be bootstrapped from client-controlled metadata;
 * those accounts come from seed, admin, or service_role only.
 */
export function roleFromMetadata(user: User): UserRole {
  const raw = user.user_metadata?.role
  return raw === 'student' || raw === 'company' ? raw : 'student'
}

function mapProfileRow(row: {
  id: string
  role: string
  display_name: string
  email: string
  preferred_language: string
  created_at: string
  updated_at: string
}): Profile {
  if (!isKnownRole(row.role)) {
    throw new ApiHttpError(500, 'INTERNAL_ERROR', 'Invalid profile role in database')
  }
  return {
    id: row.id,
    role: row.role,
    displayName: row.display_name,
    email: row.email,
    preferredLanguage: row.preferred_language === 'en' ? 'en' : 'fi',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Ensures a profiles row exists for the authenticated user.
 * DB trigger `handle_new_user` normally creates it; this is an idempotent fallback.
 * Role is taken from an existing row — never elevated from a client body.
 * On first insert only, metadata may seed `student` or `company` (default student).
 */
export async function ensureProfile(
  supabase: TypedSupabaseClient,
  user: User
): Promise<Profile> {
  const { data: existing, error } = await supabase
    .from('profiles')
    .select(
      'id, role, display_name, email, preferred_language, created_at, updated_at'
    )
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    throw new ApiHttpError(503, 'DATABASE_ERROR', 'Failed to load profile')
  }

  if (existing) {
    return mapProfileRow(existing)
  }

  const role = roleFromMetadata(user)
  const displayName =
    (typeof user.user_metadata?.display_name === 'string' &&
      user.user_metadata.display_name) ||
    user.email ||
    'User'
  const preferredLanguage =
    user.user_metadata?.preferred_language === 'en' ? 'en' : 'fi'

  const { data: inserted, error: upsertError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        role,
        display_name: displayName,
        email: user.email ?? `${user.id}@users.local`,
        preferred_language: preferredLanguage,
      },
      { onConflict: 'id' }
    )
    .select(
      'id, role, display_name, email, preferred_language, created_at, updated_at'
    )
    .single()

  if (upsertError || !inserted) {
    throw new ApiHttpError(503, 'DATABASE_ERROR', 'Failed to initialize profile')
  }

  return mapProfileRow(inserted)
}

function createBearerClient(accessToken: string): TypedSupabaseClient {
  let url: string
  let key: string
  try {
    ;({ url, key } = requireSupabasePublicEnv())
  } catch {
    throw new ApiHttpError(
      503,
      'SERVICE_UNAVAILABLE',
      'Supabase environment is not configured'
    )
  }

  return createSupabaseJsClient<Database>(url, key, {
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

async function resolveAuthClient(): Promise<{
  user: User
  supabase: TypedSupabaseClient
}> {
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
    return { user, supabase }
  }

  let supabase: TypedSupabaseClient
  try {
    supabase = await createClient()
  } catch {
    throw new ApiHttpError(
      503,
      'SERVICE_UNAVAILABLE',
      'Supabase environment is not configured'
    )
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new ApiHttpError(401, 'UNAUTHORIZED', 'Authentication required')
  }

  return { user, supabase }
}

/** Require a signed-in auth user (no profile load). */
export async function requireUser(): Promise<{
  user: User
  supabase: TypedSupabaseClient
}> {
  return resolveAuthClient()
}

/** Load the caller's profile, or null when unauthenticated. */
export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const { user, supabase } = await resolveAuthClient()
    return await ensureProfile(supabase, user)
  } catch (error) {
    if (error instanceof ApiHttpError && error.status === 401) return null
    throw error
  }
}

/** Require authenticated user + profiles row (role from DB). */
export async function requireProfile(): Promise<AuthContext> {
  const { user, supabase } = await resolveAuthClient()
  const profile = await ensureProfile(supabase, user)
  return {
    user,
    role: profile.role,
    profileId: user.id,
    profile,
    supabase,
  }
}

/**
 * Resolves the caller from Bearer token or Auth cookies.
 * Prefer `requireProfile()` for new code.
 */
export async function requireAuth(): Promise<AuthContext> {
  return requireProfile()
}

export function requireRole(
  ctx: AuthContext,
  allowed: UserRole[],
  message = 'Insufficient permissions'
): void {
  if (!hasRole(ctx.profile, allowed)) {
    throw new ApiHttpError(403, 'FORBIDDEN', message)
  }
}

export function isStaff(role: UserRole): boolean {
  return isStaffRole(role)
}

/** @deprecated Prefer `handleApiError` from `@/lib/api/response` */
export function handleRouteError(error: unknown) {
  if (error instanceof ValidationError) {
    return handleApiError(error)
  }
  return handleApiError(error)
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
  supabase: TypedSupabaseClient,
  profileId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) {
    throw new ApiHttpError(503, 'DATABASE_ERROR', 'Failed to load company membership')
  }
  return data?.company_id ?? null
}

/** Resolves the caller's student row id when present. */
export async function getCallerStudentId(
  supabase: TypedSupabaseClient,
  profileId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('students')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) {
    throw new ApiHttpError(503, 'DATABASE_ERROR', 'Failed to load student profile')
  }
  return data?.id ?? null
}
