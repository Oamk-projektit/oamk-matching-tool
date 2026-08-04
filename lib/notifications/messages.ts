import type { Notification, NotificationType as DomainNotificationType } from '@/types/domain'
import type { Tables } from '@/types/database'

export type NotificationType =
  | DomainNotificationType
  | 'application_received'
  | 'application_status_changed'
  | 'match_ready'
  | 'selection_decided'
  | 'project_published'

type NotificationRow = Tables<'notifications'>

export function buildApplicationReceivedContent(input: {
  studentName: string
  opportunityName: string
}): string {
  return `${input.studentName} applied to "${input.opportunityName}".`
}

export function buildApplicationStatusContent(input: {
  opportunityName: string
  status: string
}): string {
  return `Your application to "${input.opportunityName}" is now ${input.status}.`
}

export function buildMatchReadyContent(input: {
  count: number
}): string {
  const n = input.count
  return `Matching finished: ${n} opportunit${n === 1 ? 'y' : 'ies'} scored for you.`
}

export function mapNotificationRow(row: NotificationRow): Notification {
  const type = row.type as DomainNotificationType
  return {
    id: row.id,
    profileId: row.profile_id,
    type,
    language: row.language === 'en' ? 'en' : 'fi',
    title: row.title,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
  }
}
