import type { Notification } from '@/types/domain'

export type NotificationType =
  | 'application_received'
  | 'application_status_changed'
  | 'match_ready'

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

export function mapNotificationRow(row: {
  id: string
  recipient_user_id: string
  type: string
  content: string
  read: boolean
  created_at: string
}): Notification {
  return {
    id: row.id,
    recipient_user_id: row.recipient_user_id,
    type: row.type,
    content: row.content,
    read: row.read,
    created_at: row.created_at,
  }
}
