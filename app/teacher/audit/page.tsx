'use client'

/**
 * No `/api/audit` route exists yet (checked `app/api/**`). Sensitive actions
 * are already recorded server-side into the `audit_events` table (see
 * `types/domain.ts` `AuditEvent`), but there is no read endpoint to expose
 * them to the UI yet. This page probes `/api/audit` defensively so it starts
 * working the moment that route ships, and otherwise shows an honest
 * "not exposed yet" state instead of inventing fake rows.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/ui'
import { formatDateTime } from '@/lib/format'
import { useTranslations } from '@/lib/i18n'
import type { AuditEvent } from '@/types/domain'
import { RoleGuard } from '@/components/auth/RoleGuard'

type AuditPageStatus = 'loading' | 'not-exposed' | 'error' | 'ok'

function TeacherAuditContent() {
  const { t, locale } = useTranslations()
  const [status, setStatus] = useState<AuditPageStatus>('loading')
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setStatus('loading')
    setErrorMessage(null)
    try {
      const response = await fetch('/api/audit', { credentials: 'include' })
      if (response.status === 404) {
        setStatus('not-exposed')
        return
      }
      const text = await response.text()
      const body = text ? (JSON.parse(text) as { data?: AuditEvent[] }) : null
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      setEvents(body?.data ?? [])
      setStatus('ok')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('teacher.auditLoadError'))
      setStatus('error')
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('teacher.auditTitle')}
          </h1>
          <p className="text-foreground-muted">{t('teacher.auditDescription')}</p>
        </div>

        {status === 'loading' && <LoadingState message={t('common.loading')} />}

        {status === 'not-exposed' && (
          <EmptyState
            title={t('teacher.auditNotExposedTitle')}
            description={t('teacher.auditNotExposedDescription')}
          />
        )}

        {status === 'error' && (
          <ErrorState
            message={errorMessage ?? t('teacher.auditLoadError')}
            onRetry={load}
            retryLabel={t('common.retry')}
          />
        )}

        {status === 'ok' && events.length === 0 && (
          <EmptyState
            title={t('teacher.auditEmptyTitle')}
            description={t('teacher.auditEmptyDescription')}
          />
        )}

        {status === 'ok' && events.length > 0 && (
          <Card>
            <ul className="divide-y divide-border">
              {events.map((event) => (
                <li key={event.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-foreground">{event.action}</span>
                    <span className="text-xs text-foreground-muted">
                      {formatDateTime(event.createdAt, locale)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground-muted">
                    {event.entityType} · {event.entityId}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function TeacherAuditPage() {
  return (
    <RoleGuard allowedRoles={['teacher', 'admin']}>
      <TeacherAuditContent />
    </RoleGuard>
  )
}
