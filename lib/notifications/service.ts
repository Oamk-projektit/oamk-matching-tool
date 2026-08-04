import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type {
  Notification,
  NotificationType,
  PreferredLanguage,
} from '@/types/domain'
import { ApiHttpError } from '@/lib/api/errors'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildIdempotencyKey,
  buildNotificationCopy,
  mapNotificationRow,
  type NotificationTemplateContext,
} from '@/lib/notifications/messages'
import { deliverNotificationEmail } from '@/lib/notifications/email'

type DbClient = SupabaseClient<Database>

async function loadPreferredLanguage(
  admin: DbClient,
  profileId: string
): Promise<PreferredLanguage> {
  const { data } = await admin
    .from('profiles')
    .select('preferred_language, email')
    .eq('id', profileId)
    .maybeSingle()
  return data?.preferred_language === 'en' ? 'en' : 'fi'
}

async function loadProfileEmail(
  admin: DbClient,
  profileId: string
): Promise<string | null> {
  const { data } = await admin
    .from('profiles')
    .select('email')
    .eq('id', profileId)
    .maybeSingle()
  return data?.email ?? null
}

export async function createNotification(input: {
  recipientUserId: string
  type: NotificationType
  content?: string
  title?: string
  language?: PreferredLanguage
  context?: NotificationTemplateContext
  idempotencyKey?: string | null
  /** When true, skip email (still creates in-app row). */
  skipEmail?: boolean
}): Promise<Notification> {
  const admin = createAdminClient()
  const language =
    input.language ??
    (await loadPreferredLanguage(admin, input.recipientUserId))

  const copy = buildNotificationCopy(input.type, language, input.context ?? {})
  const title = input.title ?? copy.title
  const body = input.content ?? copy.body
  const idempotencyKey =
    input.idempotencyKey === undefined
      ? null
      : input.idempotencyKey

  const { data, error } = await admin
    .from('notifications')
    .insert({
      profile_id: input.recipientUserId,
      type: input.type,
      language,
      title,
      body,
      idempotency_key: idempotencyKey,
    })
    .select('*')
    .single()

  if (error) {
    // Idempotent replay: return the existing row instead of failing.
    if (error.code === '23505' && idempotencyKey) {
      const { data: existing, error: existingError } = await admin
        .from('notifications')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()
      if (existingError || !existing) {
        throw new ApiHttpError(409, 'CONFLICT', 'Duplicate notification')
      }
      return mapNotificationRow(existing)
    }
    throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  }

  if (!input.skipEmail) {
    const email = await loadProfileEmail(admin, input.recipientUserId)
    // Email failure must never undo the persisted notification / domain write.
    await deliverNotificationEmail({
      toProfileId: input.recipientUserId,
      toEmail: email,
      subject: `[OAMK Matching] ${title}`,
      body,
      type: input.type,
    })
  }

  return mapNotificationRow(data)
}

export async function createNotificationIdempotent(input: {
  recipientUserId: string
  type: NotificationType
  entityId: string
  context?: NotificationTemplateContext
  language?: PreferredLanguage
}): Promise<Notification> {
  return createNotification({
    recipientUserId: input.recipientUserId,
    type: input.type,
    context: input.context,
    language: input.language,
    idempotencyKey: buildIdempotencyKey({
      type: input.type,
      profileId: input.recipientUserId,
      entityId: input.entityId,
    }),
  })
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
