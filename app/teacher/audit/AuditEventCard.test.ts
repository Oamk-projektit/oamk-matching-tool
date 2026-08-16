import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import fi from '@/messages/fi.json'
import { translate } from '@/lib/i18n'
import type { AuditEvent } from '@/types/domain'
import { AuditEventCard } from './AuditEventCard'

const projectId = '84000000-0000-4000-8000-000000000001'
const actorId = 'a0000000-0000-4000-8000-000000000003'

function renderEvent(overrides: Partial<AuditEvent> = {}) {
  const event: AuditEvent = {
    id: 'audit-1',
    actorProfileId: actorId,
    actorDisplayName: 'Manual QA Company 1',
    action: 'project_updated',
    entityType: 'project',
    entityId: projectId,
    entityDisplayName: 'Manual QA – AI & Machine Learning',
    oldValues: { status: 'draft' },
    newValues: { status: 'published' },
    createdAt: '2026-08-16T14:05:00.000Z',
    ...overrides,
  }

  return renderToStaticMarkup(
    createElement(AuditEventCard, {
      event,
      locale: 'fi',
      t: (key, vars) => translate(fi, key, vars),
    })
  )
}

describe('AuditEventCard', () => {
  it('renders a localized project update with entity and actor names', () => {
    const html = renderEvent()
    expect(html).toContain('Projektia päivitettiin')
    expect(html).toContain('Manual QA – AI &amp; Machine Learning')
    expect(html).toContain('Manual QA Company 1')
    expect(html).toContain('Luonnos')
    expect(html).toContain('Julkaistu')
  })

  it('renders project creation with the canonical title', () => {
    expect(renderEvent({ action: 'project_created' })).toContain(
      'Projekti luotiin'
    )
  })

  it('shows a system actor when actor id is absent', () => {
    expect(
      renderEvent({ actorProfileId: null, actorDisplayName: null })
    ).toContain('Järjestelmä')
  })

  it('uses a safe title for unknown events', () => {
    const html = renderEvent({ action: 'future_event' })
    expect(html).toContain('Järjestelmätapahtuma')
    expect(html).not.toContain(
      '<h2 class="text-lg font-semibold text-foreground">future_event</h2>'
    )
  })

  it('keeps identifiers inside a closed technical details disclosure', () => {
    const html = renderEvent()
    expect(html).toContain('<details class=')
    expect(html).not.toContain('<details open')
    expect(html).toContain('Näytä tekniset tiedot')
    expect(html).toContain(projectId)
    expect(html.indexOf(projectId)).toBeGreaterThan(html.indexOf('<details'))
  })
})