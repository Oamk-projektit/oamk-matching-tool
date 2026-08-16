import { describe, expect, it } from 'vitest'
import {
  enrichAuditEvent,
  type AuditNameLookups,
} from '@/lib/audit/service'
import type { AuditEvent } from '@/types/domain'

const event: AuditEvent = {
  id: 'audit-1',
  actorProfileId: 'actor-1',
  actorDisplayName: null,
  action: 'project_updated',
  entityType: 'project',
  entityId: 'project-1',
  entityDisplayName: null,
  oldValues: { title: 'Previous project name' },
  newValues: { title: 'Current project name' },
  createdAt: '2026-08-16T14:05:00.000Z',
}

function lookups(): AuditNameLookups {
  return {
    profiles: new Map([['actor-1', 'Manual QA Company 1']]),
    projects: new Map([['project-1', 'Manual QA – AI & Machine Learning']]),
    students: new Map(),
    companies: new Map(),
  }
}

describe('audit event enrichment', () => {
  it('resolves project and actor display names from batched lookups', () => {
    const enriched = enrichAuditEvent(event, lookups())
    expect(enriched.entityDisplayName).toBe(
      'Manual QA – AI & Machine Learning'
    )
    expect(enriched.actorDisplayName).toBe('Manual QA Company 1')
  })

  it('uses the audit snapshot when a project no longer exists', () => {
    const missingProject = lookups()
    missingProject.projects.clear()
    expect(enrichAuditEvent(event, missingProject).entityDisplayName).toBe(
      'Current project name'
    )
  })

  it('shows both student and project names for a selection event', () => {
    const selectionEvent: AuditEvent = {
      ...event,
      entityType: 'selection_decision',
      newValues: { project_id: 'project-1', student_id: 'student-1' },
    }
    const selectionLookups = lookups()
    selectionLookups.students.set('student-1', 'Manual QA Student 1')

    expect(
      enrichAuditEvent(selectionEvent, selectionLookups).entityDisplayName
    ).toBe('Manual QA Student 1 · Manual QA – AI & Machine Learning')
  })
})