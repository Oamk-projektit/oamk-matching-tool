'use client'

import React, { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/ui'
import { useTranslations } from '@/lib/i18n'
import { api, ApiClientError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/format'
import type { Notification } from '@/types/domain'

export default function NotificationsPage() {
  const { t, locale } = useTranslations()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const result = await api.listNotifications()
      setNotifications(result.items)
      setUnreadCount(result.unreadCount)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('notifications.errorMessage'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
     
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleMarkRead(id: string) {
    setActionError(null)
    setPendingId(id)
    try {
      await api.markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : t('notifications.errorMessage'))
    } finally {
      setPendingId(null)
    }
  }

  async function handleMarkAllRead() {
    setActionError(null)
    setMarkingAll(true)
    try {
      await api.markAllNotificationsRead()
      const now = new Date().toISOString()
      setNotifications((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })))
      setUnreadCount(0)
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : t('notifications.errorMessage'))
    } finally {
      setMarkingAll(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <LoadingState message={t('notifications.loadingMessage')} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState message={error} onRetry={load} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('notifications.title')}</h1>
          <p className="text-foreground-muted">{t('notifications.description')}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={handleMarkAllRead} isLoading={markingAll}>
            {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      {actionError && (
        <Alert variant="error" className="mb-4">
          {actionError}
        </Alert>
      )}

      {notifications.length === 0 ? (
        <EmptyState
          title={t('notifications.empty.title')}
          description={t('notifications.empty.description')}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const isUnread = !notification.readAt
            return (
              <Card key={notification.id} className={isUnread ? 'border-primary/40 bg-primary-soft/40' : ''}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <p className="font-semibold text-foreground">{notification.title}</p>
                      {isUnread && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                          {t('notifications.unread')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground-secondary">{notification.body}</p>
                    <p className="mt-1 text-xs text-foreground-muted">
                      {formatDateTime(notification.createdAt, locale)}
                    </p>
                  </div>
                  {isUnread && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkRead(notification.id)}
                      isLoading={pendingId === notification.id}
                    >
                      {t('notifications.markRead')}
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
