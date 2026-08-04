import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  apiSuccess,
  apiError,
  handleApiError,
} from '@/lib/api/response'
import { ApiHttpError } from '@/lib/api/errors'
import { ValidationError } from '@/lib/validation'
import { EnvConfigError } from '@/lib/supabase/env'
import {
  isTeacherOrAdmin,
  isCompany,
  isStudent,
  isAdmin,
} from '@/lib/permissions/roles'
import { assertCanManageProject } from '@/lib/projects/service'

async function readJson(response: Response) {
  return response.json()
}

describe('API response helpers', () => {
  it('builds a success envelope', async () => {
    const res = apiSuccess({ ok: true }, { count: 1 })
    expect(res.status).toBe(200)
    await expect(readJson(res)).resolves.toEqual({
      data: { ok: true },
      meta: { count: 1 },
    })
  })

  it('builds an error envelope without leaking internals', async () => {
    const res = apiError('FORBIDDEN', 'Nope', 403)
    expect(res.status).toBe(403)
    const body = await readJson(res)
    expect(body).toEqual({
      error: { code: 'FORBIDDEN', message: 'Nope' },
    })
    expect(JSON.stringify(body)).not.toMatch(/stack|password|service.role/i)
  })

  it('maps ValidationError and EnvConfigError safely', async () => {
    const validation = handleApiError(
      new ValidationError('bad', [{ field: 'x', message: 'required' }])
    )
    expect(validation.status).toBe(400)
    await expect(readJson(validation)).resolves.toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    })

    const env = handleApiError(new EnvConfigError(['NEXT_PUBLIC_SUPABASE_URL']))
    expect(env.status).toBe(503)
    const envBody = await readJson(env)
    expect(envBody.error.code).toBe('SERVICE_UNAVAILABLE')
    expect(envBody.error.message).toContain('NEXT_PUBLIC_SUPABASE_URL')
    expect(envBody.error.message).not.toContain('eyJ')
  })

  it('maps ApiHttpError and unknown errors', async () => {
    const forbidden = handleApiError(
      new ApiHttpError(403, 'FORBIDDEN', 'Insufficient permissions')
    )
    expect(forbidden.status).toBe(403)

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const unexpected = handleApiError(new Error('secret connection string'))
    expect(unexpected.status).toBe(500)
    const body = await readJson(unexpected)
    expect(body.error.message).toBe('Unexpected server error')
    expect(body.error.message).not.toContain('secret')
    spy.mockRestore()
  })
})

describe('role helpers', () => {
  it('classifies teacher/admin and rejects student company elevation', () => {
    expect(isTeacherOrAdmin({ role: 'teacher' })).toBe(true)
    expect(isTeacherOrAdmin({ role: 'admin' })).toBe(true)
    expect(isTeacherOrAdmin({ role: 'student' })).toBe(false)
    expect(isCompany({ role: 'company' })).toBe(true)
    expect(isCompany({ role: 'student' })).toBe(false)
    expect(isStudent({ role: 'student' })).toBe(true)
    expect(isAdmin({ role: 'admin' })).toBe(true)
  })
})

describe('project management permissions (sync asserts)', () => {
  it('allows owning company and admin; blocks other company and student', () => {
    expect(() =>
      assertCanManageProject({
        role: 'company',
        projectCompanyId: 'c1',
        callerCompanyId: 'c1',
      })
    ).not.toThrow()

    expect(() =>
      assertCanManageProject({
        role: 'admin',
        projectCompanyId: 'c1',
        callerCompanyId: null,
      })
    ).not.toThrow()

    expect(() =>
      assertCanManageProject({
        role: 'company',
        projectCompanyId: 'c1',
        callerCompanyId: 'c2',
      })
    ).toThrow(ApiHttpError)

    expect(() =>
      assertCanManageProject({
        role: 'student',
        projectCompanyId: 'c1',
        callerCompanyId: null,
      })
    ).toThrow(ApiHttpError)

    expect(() =>
      assertCanManageProject({
        role: 'teacher',
        projectCompanyId: 'c1',
        callerCompanyId: null,
      })
    ).toThrow(ApiHttpError)
  })
})

describe('admin client bundling guard', () => {
  it('marks admin client as server-only', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'lib/supabase/admin.ts'),
      'utf8'
    )
    expect(source).toMatch(/import ['"]server-only['"]/)
    expect(source).toMatch(/SUPABASE_SERVICE_ROLE_KEY|requireSupabaseAdminEnv/)
    expect(source).not.toMatch(/NEXT_PUBLIC_SUPABASE_SERVICE/)
  })

  it('keeps browser client free of service role', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'lib/supabase/client.ts'),
      'utf8'
    )
    expect(source).not.toMatch(/SERVICE_ROLE/)
    expect(source).toMatch(/requireSupabasePublicEnv|ANON|PUBLISHABLE/)
  })
})

describe('health route', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('returns 503 when public supabase env is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    const { GET } = await import('@/app/api/health/route')
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.error.code).toBe('SERVICE_UNAVAILABLE')
  })

  it('returns connected envelope when database probe succeeds', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://example.supabase.local'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-test-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-test-key'

    vi.doMock('@/lib/supabase/admin', () => ({
      isSupabaseConfigured: () => true,
      isSupabaseAdminConfigured: () => true,
      createAdminClient: () => ({
        from: () => ({
          select: () => ({
            limit: async () => ({ data: [{ id: 'x' }], error: null }),
          }),
        }),
      }),
    }))

    const { GET } = await import('@/app/api/health/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      data: {
        status: 'ok',
        service: 'oamk-matching-tool',
        database: 'connected',
      },
      meta: {},
    })
    expect(body.data.timestamp).toEqual(expect.any(String))
  })

  it('returns 503 when database probe fails', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://example.supabase.local'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-test-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-test-key'

    vi.doMock('@/lib/supabase/admin', () => ({
      isSupabaseConfigured: () => true,
      isSupabaseAdminConfigured: () => true,
      createAdminClient: () => ({
        from: () => ({
          select: () => ({
            limit: async () => ({
              data: null,
              error: { message: 'connection refused' },
            }),
          }),
        }),
      }),
    }))

    const { GET } = await import('@/app/api/health/route')
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.error.code).toBe('DATABASE_ERROR')
    expect(JSON.stringify(body)).not.toContain('connection refused')
  })
})
