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
  StatusBadge,
} from '@/components/ui'
import { api, ApiClientError } from '@/lib/api/client'
import { useTranslations } from '@/lib/i18n'
import type { ApplicantListItem } from '@/types/api'
import type { ProjectDetail } from '@/types/api'
import type { ScoreBreakdown } from '@/types/domain'

const BREAKDOWN_KEYS: (keyof ScoreBreakdown)[] = [
  'studyCredits',
  'requiredCourses',
  'recommendedCourses',
  'skills',
  'language',
  'availability',
  'interests',
  'degreeProgramme',
]

function ApplicantsContent({ projectId }: { projectId: string }) {
  const { t } = useTranslations()

  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [applicants, setApplicants] = useState<ApplicantListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [projectData, applicantsResult] = await Promise.all([
        api.getProject(projectId),
        api.listApplicants(projectId),
      ])
      setProject(projectData)
      setApplicants(applicantsResult.items)
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : t('company.applicants.loadError')
      )
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  async function handleShortlist(applicationId: string) {
    setActioningId(applicationId)
    setActionError(null)
    try {
      await api.shortlistApplication(applicationId)
      await load()
    } catch (err) {
      setActionError(
        err instanceof ApiClientError
          ? err.message
          : t('company.applicants.actionError')
      )
    } finally {
      setActioningId(null)
    }
  }

  async function handleUnshortlist(applicationId: string) {
    setActioningId(applicationId)
    setActionError(null)
    try {
      await api.unshortlistApplication(applicationId)
      await load()
    } catch (err) {
      setActionError(
        err instanceof ApiClientError
          ? err.message
          : t('company.applicants.actionError')
      )
    } finally {
      setActioningId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <LoadingState message={t('company.applicants.loading')} />
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <ErrorState message={error ?? t('company.applicants.loadError')} onRetry={load} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/company/projects/${projectId}`}
          className="mb-4 inline-block text-sm text-primary hover:underline"
        >
          {t('company.applicants.backToProject')}
        </Link>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('company.applicants.title')}
            </h1>
            <p className="mt-1 text-foreground-muted">{project.title}</p>
          </div>
          <Link href={`/company/projects/${projectId}/top`}>
            <Button variant="outline">
              {t('company.applicants.topCandidatesLink')}
            </Button>
          </Link>
        </div>

        {actionError && (
          <Alert variant="error" className="mb-4">
            {actionError}
          </Alert>
        )}

        {applicants.length === 0 ? (
          <EmptyState
            title={t('company.applicants.emptyTitle')}
            description={t('company.applicants.emptyDescription')}
          />
        ) : (
          <div className="space-y-3">
            {applicants.map((item, index) => {
              const canShortlist =
                item.application.status === 'submitted' ||
                item.application.status === 'under_review'
              const canUnshortlist = item.application.status === 'shortlisted'
              const isDecided =
                item.application.status === 'selected' ||
                item.application.status === 'not_selected' ||
                item.application.status === 'withdrawn'

              return (
                <Card key={item.application.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-[240px] flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground-muted">
                          #{index + 1}
                        </span>
                        <p className="text-lg font-semibold text-foreground">
                          {item.profile.displayName}
                        </p>
                        <StatusBadge status={item.application.status} />
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
                        {item.match ? (
                          <ProgressBar
                            value={item.match.totalScore}
                            tone="match"
                            label={t('company.applicants.matchScoreLabel')}
                          />
                        ) : (
                          <p className="text-sm text-foreground-muted">
                            {t('company.applicants.noMatchYet')}
                          </p>
                        )}
                      </div>

                      {item.match && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium text-primary">
                            {t('company.applicants.breakdownLabel')}
                          </summary>
                          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-foreground-secondary sm:grid-cols-4">
                            {BREAKDOWN_KEYS.map((key) => (
                              <li key={key}>
                                {t(`company.projectForm.weight${
                                  key.charAt(0).toUpperCase() + key.slice(1)
                                }`)}
                                : {item.match?.scoreBreakdown[key] ?? 0}/
                                {project.weights[key]}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {canShortlist && (
                        <Button
                          size="sm"
                          onClick={() => handleShortlist(item.application.id)}
                          isLoading={actioningId === item.application.id}
                        >
                          {t('company.applicants.shortlistAction')}
                        </Button>
                      )}
                      {canUnshortlist && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUnshortlist(item.application.id)}
                          isLoading={actioningId === item.application.id}
                        >
                          {t('company.applicants.unshortlistAction')}
                        </Button>
                      )}
                      {!isDecided && (
                        <Link
                          href={`/company/projects/${projectId}/selections?applicationId=${item.application.id}&studentId=${item.student.id}`}
                        >
                          <Button size="sm" variant="outline" className="w-full">
                            {t('company.applicants.openSelectionAction')}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CompanyApplicantsPage() {
  const params = useParams<{ id: string }>()
  return (
    <RoleGuard allowedRoles={['company']}>
      <ApplicantsContent projectId={params.id} />
    </RoleGuard>
  )
}
