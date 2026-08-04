import { describe, expect, it, beforeEach } from 'vitest'
import {
  getEmailOutbox,
  resetEmailOutbox,
  simulateNotificationEmail,
} from '@/lib/notifications/email-stub'
import { createSharedApiClient, SharedApiError } from '@/lib/shared/api-client'

describe('email stub (#138/#146)', () => {
  beforeEach(() => {
    resetEmailOutbox()
  })

  it('records simulated outbound mail', () => {
    simulateNotificationEmail({
      toUserId: 'user-1',
      type: 'application_received',
      content: 'Someone applied',
    })
    expect(getEmailOutbox()).toHaveLength(1)
    expect(getEmailOutbox()[0]?.subject).toContain('application_received')
  })
})

describe('shared api client (#143)', () => {
  it('calls health without auth header', async () => {
    const fetchImpl: typeof fetch = async (input) => {
      expect(String(input)).toBe('http://localhost:3000/api/health')
      return new Response(
        JSON.stringify({
          data: {
            status: 'ok',
            service: 'oamk-matching-tool',
            database: 'connected',
            timestamp: '2026-08-03T00:00:00.000Z',
          },
          meta: {},
        }),
        { status: 200 }
      )
    }

    const client = createSharedApiClient({
      baseUrl: 'http://localhost:3000',
      fetchImpl,
    })
    const health = await client.health()
    expect(health.data.status).toBe('ok')
    expect(health.data.database).toBe('connected')
  })

  it('throws SharedApiError on 401', async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        }),
        { status: 401 }
      )

    const client = createSharedApiClient({ fetchImpl })
    await expect(client.me()).rejects.toBeInstanceOf(SharedApiError)
  })
})
