import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Notification } from '@/types/domain'
import { ApiHttpError } from '@/lib/api/errors'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  mapNotificationRow,
  type NotificationType,
} from '@/lib/notifications/messages'
import { simulateNotificationEmail } from '@/lib/notifications/email-stub'

type DbClient = SupabaseClient<Database>

export async function createNotification(input: {
  recipientUserId: string
  type: NotificationType
  content: string
  title?: string
  language?: 'fi' | 'en'
}): Promise<Notification> {
  const admin = createAdminClient()
  const title = input.title ?? input.type.replace(/_/g, ' ')
  const { data, error } = await admin
    .from('notifications')
    .insert({
      profile_id: input.recipientUserId,
      type: input.type,
      language: input.language ?? 'fi',
      title,
      body: input.content,
    })
    .select('*')
    .single()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)

  // TOMMI (#138/#146): simulate email delivery without SMTP
  simulateNotificationEmail({
    toUserId: input.recipientUserId,
    type: input.type,
    content: input.content,
  })

  return mapNotificationRow(data)
}

export async function listNotifications(
  supabase: DbClient,
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number }
): Promise<Notification[]> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100)
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (options?.unreadOnly) {
    query = query.is('read_at', null)
  }

  const { data, error } = await query
  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return (data ?? []).map(mapNotificationRow)
}

export async function countUnread(
  supabase: DbClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', userId)
    .is('read_at', null)

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return count ?? 0
}

export async function markNotificationRead(
  supabase: DbClient,
  userId: string,
  notificationId: string
): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('profile_id', userId)
    .select('*')
    .maybeSingle()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  if (!data) throw new ApiHttpError(404, 'NOT_FOUND', 'Notification not found')
  return mapNotificationRow(data)
}

export async function markAllNotificationsRead(
  supabase: DbClient,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('profile_id', userId)
    .is('read_at', null)
    .select('id')

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return data?.length ?? 0
}
