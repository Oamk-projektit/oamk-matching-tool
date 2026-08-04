import type { SupabaseClient } from '@supabase/supabase-js'
import type { Notification } from '@/types/legacy'
import { ApiHttpError } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  mapNotificationRow,
  type NotificationType,
} from '@/lib/notifications/messages'
import { simulateNotificationEmail } from '@/lib/notifications/email-stub'

export async function createNotification(input: {
  recipientUserId: string
  type: NotificationType
  content: string
}): Promise<Notification> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('notifications')
    .insert({
      recipient_user_id: input.recipientUserId,
      type: input.type,
      content: input.content,
      read: false,
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
  supabase: SupabaseClient,
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number }
): Promise<Notification[]> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100)
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('recipient_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (options?.unreadOnly) {
    query = query.eq('read', false)
  }

  const { data, error } = await query
  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return (data ?? []).map(mapNotificationRow)
}

export async function countUnread(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_user_id', userId)
    .eq('read', false)

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return count ?? 0
}

export async function markNotificationRead(
  supabase: SupabaseClient,
  userId: string,
  notificationId: string
): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('recipient_user_id', userId)
    .select('*')
    .maybeSingle()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  if (!data) throw new ApiHttpError(404, 'NOT_FOUND', 'Notification not found')
  return mapNotificationRow(data)
}

export async function markAllNotificationsRead(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('recipient_user_id', userId)
    .eq('read', false)
    .select('id')

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return data?.length ?? 0
}
