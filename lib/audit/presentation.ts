import type { AuditEvent } from '@/types/domain'

export const AUDIT_EVENT_TRANSLATION_KEYS: Record<string, string> = {
  project_created: 'audit.events.projectCreated',
  project_updated: 'audit.events.projectUpdated',
  project_published: 'audit.events.projectPublished',
  application_created: 'audit.events.applicationCreated',
  application_updated: 'audit.events.applicationUpdated',
  application_status_changed: 'audit.events.applicationStatusChanged',
  application_withdrawn: 'audit.events.applicationWithdrawn',
  application_shortlisted: 'audit.events.applicationShortlisted',
  application_unshortlisted: 'audit.events.applicationUnshortlisted',
  match_saved: 'audit.events.matchSaved',
  match_updated: 'audit.events.matchUpdated',
  selection_decided: 'audit.events.selectionDecided',
  selection_selected: 'audit.events.selectionSelected',
  selection_not_selected: 'audit.events.selectionNotSelected',
  selection_changed: 'audit.events.selectionChanged',
  selection_reason_changed: 'audit.events.selectionReasonChanged',
  notification_created: 'audit.events.notificationCreated',
}

export function getAuditEventTranslationKey(action: string): string {
  return AUDIT_EVENT_TRANSLATION_KEYS[action] ?? 'audit.events.unknown'
}

export type AuditChangeField =
  | 'status'
  | 'applicationDeadline'
  | 'decision'

export interface AuditChange {
  field: AuditChangeField
  before: string
  after: string
}

const DISPLAYED_CHANGE_FIELDS: Array<{
  source: string
  field: AuditChangeField
}> = [
  { source: 'status', field: 'status' },
  { source: 'application_deadline', field: 'applicationDeadline' },
  { source: 'decision', field: 'decision' },
]

function displayValue(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  return value
}

export function getAuditChanges(
  event: Pick<AuditEvent, 'oldValues' | 'newValues'>
): AuditChange[] {
  if (!event.oldValues || !event.newValues) return []

  return DISPLAYED_CHANGE_FIELDS.flatMap(({ source, field }) => {
    const before = displayValue(event.oldValues?.[source])
    const after = displayValue(event.newValues?.[source])
    if (!before || !after || before === after) return []
    return [{ field, before, after }]
  })
}