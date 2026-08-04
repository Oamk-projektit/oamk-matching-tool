import { describe, expect, it } from 'vitest'
import {
  buildApplicationReceivedContent,
  buildApplicationStatusContent,
  buildMatchReadyContent,
} from '@/lib/notifications/messages'
import { parseUpdateApplicationStatus } from '@/lib/applications/parse'
import { ValidationError } from '@/lib/validation'

describe('notification messages', () => {
  it('builds application received text', () => {
    expect(
      buildApplicationReceivedContent({
        studentName: 'Aino Virtanen',
        opportunityName: 'Campus portal renewal',
      })
    ).toBe('Aino Virtanen applied to "Campus portal renewal".')
  })

  it('builds status and match-ready text', () => {
    expect(
      buildApplicationStatusContent({
        opportunityName: 'Web team internship',
        status: 'accepted',
      })
    ).toBe('Your application to "Web team internship" is now accepted.')

    expect(buildMatchReadyContent({ count: 1 })).toBe(
      'Matching finished: 1 opportunity scored for you.'
    )
    expect(buildMatchReadyContent({ count: 3 })).toBe(
      'Matching finished: 3 opportunities scored for you.'
    )
  })
})

describe('parseUpdateApplicationStatus', () => {
  it('accepts valid statuses', () => {
    expect(parseUpdateApplicationStatus({ status: 'under_review' })).toEqual({
      status: 'under_review',
    })
  })

  it('rejects invalid status', () => {
    expect(() => parseUpdateApplicationStatus({ status: 'nope' })).toThrow(
      ValidationError
    )
  })
})
