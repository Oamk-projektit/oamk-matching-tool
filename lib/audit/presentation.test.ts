import { describe, expect, it } from 'vitest'
import {
  getAuditChanges,
  getAuditEventTranslationKey,
} from '@/lib/audit/presentation'

describe('audit presentation', () => {
  it('maps project events to canonical translation keys', () => {
    expect(getAuditEventTranslationKey('project_updated')).toBe(
      'audit.events.projectUpdated'
    )
    expect(getAuditEventTranslationKey('project_created')).toBe(
      'audit.events.projectCreated'
    )
  })

  it('uses a safe title for an unknown event', () => {
    expect(getAuditEventTranslationKey('future_event')).toBe(
      'audit.events.unknown'
    )
  })

  it('only describes reliable changed fields', () => {
    expect(
      getAuditChanges({
        oldValues: {
          status: 'draft',
          application_deadline: '2026-08-20',
          description: 'Old description',
        },
        newValues: {
          status: 'published',
          application_deadline: '2026-08-31',
          description: 'New description',
        },
      })
    ).toEqual([
      { field: 'status', before: 'draft', after: 'published' },
      {
        field: 'applicationDeadline',
        before: '2026-08-20',
        after: '2026-08-31',
      },
    ])
  })
})