'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { RoleGuard } from '@/components/auth/RoleGuard'
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ProgressBar,
} from '@/components/ui'
import { api, ApiClientError } from '@/lib/api/client'
import { useTranslations } from '@/lib/i18n'
import type { TopMatchItem } from '@/types/api'

function TopCandidatesContent({ projectId }: { projectId: string }) {
  const { t } = useTranslations()

  const [items, setItems] = useState<TopMatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.listTopCandidates(projectId)
      setItems(result.items)
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : t('company.top.loadError')
      )
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/company/projects/${projectId}/applicants`}
          className="mb-4 inline-block text-sm text-primary hover:underline"
        >
          {t('company.top.backToApplicants')}
        </Link>

        <h1 className="text-3xl font-bold text-foreground">
          {t('company.top.title')}
        </h1>
        <Alert variant="warning" className="mt-3 mb-6">
          {t('company.top.privateNotice')}
        </Alert>

        {loading && <LoadingState message={t('company.top.loading')} />}
        {!loading && error && <ErrorState message={error} onRetry={load} />}

        {!loading && !error && items.length === 0 && (
          <EmptyState
            title={t('company.top.emptyTitle')}
            description={t('company.top.emptyDescription')}
          />
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.student.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-[240px] flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                        {item.rank}
                      </span>
                      <p className="text-lg font-semibold text-foreground">
                        {item.profile.displayName}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-foreground-muted">
                      {item.profile.email}
                    </p>
                    <p className="mt-1 text-sm text-foreground-secondary">
                      {t('company.applicants.degreeProgrammeLabel')}:{' '}
                      {item.student.degreeProgramme ?? '—'}
                      {' · '}
                      {t('company.applicants.studyCreditsLabel')}:{' '}
                      {item.student.studyCredits}
                    </p>
                    <div className="mt-3 max-w-sm">
                      <ProgressBar
                        value={item.match.totalScore}
                        tone="match"
                        label={t('company.applicants.matchScoreLabel')}
                      />
                    </div>
                    {item.match.explanation && (
                      <p className="mt-2 text-sm text-foreground-muted">
                        {item.match.explanation}
                      </p>
                    )}
                  </div>
                  {item.applicationId && (
                    <Link
                      href={`/company/projects/${projectId}/selections?applicationId=${item.applicationId}&studentId=${item.student.id}`}
                    >
                      <Button variant="outline" size="sm">
                        {t('company.applicants.openSelectionAction')}
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CompanyTopCandidatesPage() {
  const params = useParams<{ id: string }>()
  return (
    <RoleGuard allowedRoles={['company']}>
      <TopCandidatesContent projectId={params.id} />
    </RoleGuard>
  )
}
