'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Alert,
  Button,
  Card,
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from '@/components/ui'
import { useStudentOnlyGuard } from '@/lib/auth/useStudentOnlyGuard'
import { useTranslations } from '@/lib/i18n'
import { api, ApiClientError } from '@/lib/api/client'
import { formatDate } from '@/lib/format'
import type { ApplicationWithProject } from '@/types/api'

const WITHDRAWABLE_STATUSES = new Set(['submitted', 'under_review', 'shortlisted'])
const DECIDED_STATUSES = new Set(['selected', 'not_selected'])

export default function ApplicationsPage() {
  useStudentOnlyGuard()
  const { t, locale } = useTranslations()

  const [applications, setApplications] = useState<ApplicationWithProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [withdrawTarget, setWithdrawTarget] = useState<ApplicationWithProject | null>(null)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.listMyApplications()
      setApplications(data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('applications.errorMessage'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
     
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleWithdraw() {
    if (!withdrawTarget) return
    setWithdrawing(true)
    setWithdrawError(null)
    try {
      await api.withdrawApplication(withdrawTarget.id)
      setApplications((prev) =>
        prev.map((a) => (a.id === withdrawTarget.id ? { ...a, status: 'withdrawn' } : a))
      )
      setNotice(t('applications.withdraw.success'))
      setWithdrawTarget(null)
    } catch (err) {
      setWithdrawError(err instanceof ApiClientError ? err.message : t('applications.withdraw.error'))
    } finally {
      setWithdrawing(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <LoadingState message={t('applications.loadingMessage')} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState message={error} onRetry={load} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-3xl font-bold text-foreground">{t('applications.title')}</h1>
      <p className="mb-6 text-foreground-muted">{t('applications.description')}</p>

      {notice && (
        <Alert variant="success" className="mb-4">
          {notice}
        </Alert>
      )}

      {applications.length === 0 ? (
        <EmptyState
          title={t('applications.empty.title')}
          description={t('applications.empty.description')}
          action={
            <Link href="/projects">
              <Button>{t('applications.empty.cta')}</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <Card key={application.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Link
                      href={`/projects/${application.project.id}`}
                      className="text-lg font-semibold text-foreground hover:text-primary"
                    >
                      {application.project.title}
                    </Link>
                    <StatusBadge status={application.status} />
                  </div>
                  <p className="text-sm text-foreground-muted">
                    {t('applications.submittedAt', { date: formatDate(application.submittedAt, locale) })}
                  </p>
                  {application.message && (
                    <p className="mt-2 text-sm text-foreground-secondary">
                      <span className="font-medium">{t('applications.messageLabel')}:</span>{' '}
                      {application.message}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  {DECIDED_STATUSES.has(application.status) && (
                    <Link href={`/applications/${application.id}/decision`}>
                      <Button variant="secondary" size="sm">
                        {t('applications.viewDecision')}
                      </Button>
                    </Link>
                  )}
                  {WITHDRAWABLE_STATUSES.has(application.status) && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setWithdrawError(null)
                        setWithdrawTarget(application)
                      }}
                    >
                      {t('applications.withdraw.button')}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmationDialog
        isOpen={Boolean(withdrawTarget)}
        title={t('applications.withdraw.confirmTitle')}
        message={
          <>
            {withdrawError && (
              <Alert variant="error" className="mb-3">
                {withdrawError}
              </Alert>
            )}
            {t('applications.withdraw.confirmMessage')}
          </>
        }
        confirmLabel={t('applications.withdraw.confirmButton')}
        cancelLabel={t('applications.withdraw.cancelButton')}
        variant="danger"
        isConfirming={withdrawing}
        onConfirm={handleWithdraw}
        onCancel={() => setWithdrawTarget(null)}
      />
    </div>
  )
}
