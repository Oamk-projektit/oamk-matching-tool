'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingState,
  ProgressBar,
} from '@/components/ui'
import { useStudentOnlyGuard } from '@/lib/auth/useStudentOnlyGuard'
import { useTranslations } from '@/lib/i18n'
import { api, ApiClientError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/format'
import type { SelectionDecision } from '@/types/domain'

export default function ApplicationDecisionPage() {
  useStudentOnlyGuard()
  const params = useParams<{ id: string }>()
  const applicationId = params.id
  const { t, locale } = useTranslations()

  const [decision, setDecision] = useState<SelectionDecision | null>(null)
  const [projectTitle, setProjectTitle] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [noDecision, setNoDecision] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setNoDecision(false)
    try {
      const data = await api.getApplicationDecision(applicationId)
      setDecision(data)
      try {
        const project = await api.getProject(data.projectId)
        setProjectTitle(project.title)
      } catch {
        /* best-effort project title lookup */
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) {
        setNoDecision(true)
      } else {
        setError(err instanceof ApiClientError ? err.message : t('applications.decision.errorMessage'))
      }
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId])

  useEffect(() => {
     
    void load()
  }, [load])

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <LoadingState message={t('applications.decision.loadingMessage')} />
      </div>
    )
  }

  if (noDecision) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          title={t('applications.decision.noDecisionTitle')}
          description={t('applications.decision.noDecisionDescription')}
        />
        <div className="mt-4 text-center">
          <Link href="/applications" className="text-sm font-semibold text-primary hover:underline">
            {t('applications.decision.back')}
          </Link>
        </div>
      </div>
    )
  }

  if (error || !decision) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState message={error ?? t('applications.decision.errorMessage')} onRetry={load} />
      </div>
    )
  }

  const isSelected = decision.decision === 'selected'

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/applications" className="mb-4 inline-block text-sm font-semibold text-primary hover:underline">
        ← {t('applications.decision.back')}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{projectTitle ?? t('applications.decision.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`rounded-md border px-4 py-3 text-sm font-semibold ${
              isSelected
                ? 'border-success/20 bg-success-soft text-success'
                : 'border-error/20 bg-error-soft text-error'
            }`}
          >
            {isSelected ? t('applications.decision.statusSelected') : t('applications.decision.statusNotSelected')}
          </div>

          <div>
            <p className="text-sm text-foreground-muted">{t('applications.decision.decidedAtLabel', {
              date: formatDateTime(decision.decidedAt, locale),
            })}</p>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-foreground">{t('applications.decision.reasonLabel')}</p>
            <p className="text-foreground-secondary">{decision.reason || t('applications.decision.noReason')}</p>
          </div>

          {decision.matchSnapshot && (
            <div className="space-y-3 border-t border-border pt-4">
              <ProgressBar
                value={decision.matchSnapshot.totalScore}
                tone="match"
                label={t('applications.decision.scoreLabel')}
              />
              {decision.matchSnapshot.explanation && (
                <div>
                  <p className="mb-1 text-sm font-medium text-foreground">
                    {t('applications.decision.explanationLabel')}
                  </p>
                  <p className="text-sm text-foreground-secondary">{decision.matchSnapshot.explanation}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
