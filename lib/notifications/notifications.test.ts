import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildIdempotencyKey,
  buildNotificationCopy,
  buildApplicationReceivedContent,
  buildApplicationStatusContent,
  buildMatchReadyContent,
} from '@/lib/notifications/messages'
import {
  FailingEmailProvider,
  deliverNotificationEmail,
  getEmailOutbox,
  resetEmailOutbox,
  resetEmailProvider,
  setEmailProvider,
  StubEmailProvider,
} from '@/lib/notifications/email'
import { SELECTION_AUDIT_ACTIONS } from '@/types/domain'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => {
    throw new Error('admin client should be mocked per test')
  }),
}))

describe('FI/EN notification templates', () => {
  it('localizes student selection messages from preferred_language', () => {
    expect(
      buildNotificationCopy('student_selected', 'fi', {
        projectTitle: 'Campus portal',
      })
    ).toEqual({
      title: 'Sinut valittiin',
      body: 'Sinut valittiin projektiin "Campus portal".',
    })

    expect(
      buildNotificationCopy('student_selected', 'en', {
        projectTitle: 'Campus portal',
      })
    ).toEqual({
      title: 'You were selected',
      body: 'You were selected for "Campus portal".',
    })
  })

  it('localizes shortlist and not-selected messages', () => {
    expect(
      buildNotificationCopy('application_shortlisted', 'fi', {
        projectTitle: 'Web internship',
      }).title
    ).toBe('Pääsit shortlistalle')

    expect(
      buildNotificationCopy('student_not_selected', 'en', {
        projectTitle: 'Web internship',
      }).body
    ).toContain('not selected')
  })

  it('keeps UI language separate from project language / skills', () => {
    // preferred_language=en even when project requiredLanguage would be fi
    const copy = buildNotificationCopy('new_application_for_company', 'en', {
      studentName: 'Aino',
      projectTitle: 'Portal',
    })
    expect(copy.title).toBe('New application')
    expect(copy.body).toContain('Aino')
  })

  it('preserves legacy English helpers', () => {
    expect(
      buildApplicationReceivedContent({
        studentName: 'Aino Virtanen',
        opportunityName: 'Campus portal renewal',
      })
    ).toBe('Aino Virtanen applied to "Campus portal renewal".')

    expect(
      buildApplicationStatusContent({
        opportunityName: 'Web team internship',
        status: 'shortlisted',
      })
    ).toContain('shortlisted')

    expect(buildMatchReadyContent({ count: 1 })).toContain('1 opportunity')
  })
})

describe('notification idempotency keys', () => {
  it('builds a stable key that prevents duplicate emits', () => {
    const a = buildIdempotencyKey({
      type: 'student_selected',
      profileId: 'p1',
      entityId: 'sel-1',
    })
    const b = buildIdempotencyKey({
      type: 'student_selected',
      profileId: 'p1',
      entityId: 'sel-1',
    })
    const c = buildIdempotencyKey({
      type: 'student_selected',
      profileId: 'p1',
      entityId: 'sel-2',
    })
    expect(a).toBe(b)
    expect(a).not.toBe(c)
  })
})

describe('email provider isolation', () => {
  beforeEach(() => {
    resetEmailOutbox()
    resetEmailProvider()
  })

  it('records stub deliveries without throwing', async () => {
    setEmailProvider(new StubEmailProvider())
    const result = await deliverNotificationEmail({
      toProfileId: 'p1',
      subject: 'Test',
      body: 'Hello',
      type: 'student_selected',
    })
    expect(result.ok).toBe(true)
    expect(getEmailOutbox()).toHaveLength(1)
  })

  it('swallows provider failures so domain writes are not rolled back', async () => {
    setEmailProvider(new FailingEmailProvider())
    const result = await deliverNotificationEmail({
      toProfileId: 'p1',
      subject: 'Test',
      body: 'Hello',
      type: 'student_selected',
    })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/Simulated email/)
  })
})

describe('audit vocabulary for notifications domain', () => {
  it('exposes selection audit actions for history assertions', () => {
    expect(SELECTION_AUDIT_ACTIONS).toContain('selection_selected')
    expect(SELECTION_AUDIT_ACTIONS).toContain('selection_reason_changed')
  })
})
