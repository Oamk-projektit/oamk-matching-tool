import { describe, expect, it } from 'vitest'
import { ApiClientError, createApiClient } from '@/lib/api/client'

describe('projects-model api client', () => {
  it('unwraps the { data, meta } envelope for me()', async () => {
    const fetchImpl: typeof fetch = async (input, init) => {
      expect(String(input)).toBe('http://localhost:3000/api/me')
      expect(init?.credentials).toBe('include')
      return new Response(
        JSON.stringify({
          data: {
            profile: {
              id: 'profile-1',
              role: 'student',
              displayName: 'Ada Lovelace',
              email: 'ada@example.com',
              preferredLanguage: 'en',
              createdAt: '2026-08-01T00:00:00.000Z',
              updatedAt: '2026-08-01T00:00:00.000Z',
            },
            studentId: 'student-1',
            companyId: null,
          },
          meta: {},
        }),
        { status: 200 }
      )
    }

    const client = createApiClient({
      baseUrl: 'http://localhost:3000',
      fetchImpl,
    })

    const me = await client.me()
    expect(me.profile.displayName).toBe('Ada Lovelace')
    expect(me.studentId).toBe('student-1')
    expect(me.companyId).toBeNull()
  })

  it('throws ApiClientError with status/code/message/details on 403', async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          error: {
            code: 'FORBIDDEN',
            message: 'Students cannot view top candidates or peer rankings',
            details: [{ field: 'role', message: 'student is not allowed' }],
          },
        }),
        { status: 403 }
      )

    const client = createApiClient({ fetchImpl })

    await expect(client.me()).rejects.toBeInstanceOf(ApiClientError)

    try {
      await client.me()
      throw new Error('expected client.me() to reject')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiClientError)
      const apiError = error as ApiClientError
      expect(apiError.status).toBe(403)
      expect(apiError.code).toBe('FORBIDDEN')
      expect(apiError.message).toBe(
        'Students cannot view top candidates or peer rankings'
      )
      expect(apiError.details).toEqual([
        { field: 'role', message: 'student is not allowed' },
      ])
    }
  })
})
