'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/ui'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { api, ApiClientError } from '@/lib/api/client'
import { useTranslations } from '@/lib/i18n'
import type { AuditEvent } from '@/types/domain'
import { AuditEventCard } from './AuditEventCard'

type AuditPageStatus = 'loading' | 'error' | 'ok'

function TeacherAuditContent() {
  const { t, locale } = useTranslations()
  const [status, setStatus] = useState<AuditPageStatus>('loading')
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setStatus('loading')
    setErrorMessage(null)
    try {
      const data = await api.listAuditEvents(100)
      setEvents(data)
      setStatus('ok')
    } catch (err) {
      setErrorMessage(
        err instanceof ApiClientError
          ? err.message
          : t('teacher.auditLoadError')
      )
      setStatus('error')
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('teacher.auditTitle')}
          </h1>
          <p className="text-foreground-muted">{t('teacher.auditDescription')}</p>
        </div>

        {status === 'loading' && <LoadingState message={t('common.loading')} />}

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
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event.id}>
                <AuditEventCard event={event} locale={locale} t={t} />
              </li>
            ))}
            </ul>
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
