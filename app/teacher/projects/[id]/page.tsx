'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { RoleGuard } from '@/components/auth/RoleGuard'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingState,
  ProgressBar,
  StatusBadge,
  Tag,
} from '@/components/ui'
import {
  ApiClientError,
  api,
  type ApplicantsResult,
  type TopCandidatesResult,
} from '@/lib/api/client'
import { formatDate, formatDateTime } from '@/lib/format'
import { useTranslations } from '@/lib/i18n'
import type { ProjectDetail } from '@/types/api'
import type { SelectionDecision } from '@/types/domain'

interface LoadedState {
  project: ProjectDetail
  applicants: ApplicantsResult
  topCandidates: TopCandidatesResult
  selections: SelectionDecision[]
}

function TeacherProjectDetailContent() {
  const { t, locale } = useTranslations()
  const params = useParams<{ id: string }>()
  const projectId = params.id

  const [state, setState] = useState<LoadedState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const [project, applicants, topCandidates, selections] = await Promise.all([
        api.getProject(projectId),
        api.listApplicants(projectId),
        api.listTopCandidates(projectId),
        api.listSelections(projectId),
      ])
      setState({ project, applicants, topCandidates, selections })
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) {
        setNotFound(true)
      } else {
        setError(
          err instanceof ApiClientError ? err.message : t('teacher.projectDetail.loadError')
        )
      }
    } finally {
      setLoading(false)
    }
  }, [projectId, t])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Link
          href="/teacher/projects"
          className="inline-block text-sm text-primary hover:underline"
        >
          {'\u2190'} {t('teacher.projectDetail.backToProjects')}
        </Link>

        {loading && <LoadingState message={t('common.loading')} />}

        {!loading && notFound && (
          <EmptyState
            title={t('teacher.projectDetail.notFoundTitle')}
            description={t('teacher.projectDetail.notFoundDescription')}
          />
        )}

        {!loading && !notFound && error && (
          <ErrorState message={error} onRetry={load} retryLabel={t('common.retry')} />
        )}

        {!loading && !notFound && !error && state && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{state.project.title}</h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge
                    status={state.project.status}
                    label={t(`teacher.projectStatus.${state.project.status}`)}
                  />
                  <Tag variant="primary">
                    {t(`teacher.projectType.${state.project.projectType}`)}
                  </Tag>
                  {state.project.department && <Tag>{state.project.department}</Tag>}
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('teacher.projectDetail.detailsTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('teacher.projectDetail.descriptionLabel')}
                  </p>
                  <p className="mt-1 text-sm text-foreground-secondary whitespace-pre-wrap">
                    {state.project.description}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailField
                    label={t('teacher.projectDetail.positionsLabel')}
                    value={String(state.project.positions)}
                  />
                  <DetailField
                    label={t('teacher.projectDetail.workModeLabel')}
                    value={t(`teacher.workMode.${state.project.workMode}`)}
                  />
                  <DetailField
                    label={t('teacher.projectDetail.locationLabel')}
                    value={state.project.location ?? t('common.notProvided')}
                  />
                  <DetailField
                    label={t('teacher.projectDetail.minimumCreditsLabel')}
                    value={String(state.project.minimumStudyCredits)}
                  />
                  <DetailField
                    label={t('teacher.projectDetail.languageLabel')}
                    value={state.project.requiredLanguage.toUpperCase()}
                  />
                  <DetailField
                    label={t('teacher.projectDetail.applicationWindowLabel')}
                    value={`${formatDate(state.project.applicationStart, locale)} \u2013 ${formatDate(
                      state.project.applicationDeadline,
                      locale
                    )}`}
                  />
                  <DetailField
                    label={t('teacher.projectDetail.projectWindowLabel')}
                    value={`${formatDate(state.project.projectStart, locale)} \u2013 ${formatDate(
                      state.project.projectEnd,
                      locale
                    )}`}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('teacher.projectDetail.applicantsTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                {state.applicants.items.length === 0 ? (
                  <p className="text-sm text-foreground-muted">
                    {t('teacher.projectDetail.applicantsEmpty')}
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {state.applicants.items.map((item) => (
                      <li key={item.application.id} className="py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-foreground">
                              {item.profile.displayName}
                            </p>
                            <p className="text-sm text-foreground-muted">
                              {item.profile.email}
                              {item.student.degreeProgramme
                                ? ` \u00b7 ${item.student.degreeProgramme}`
                                : ''}
                              {item.student.department
                                ? ` \u00b7 ${item.student.department}`
                                : ''}
                            </p>
                            <p className="text-xs text-foreground-muted">
                              {t('teacher.projectDetail.submittedOn', {
                                date: formatDate(item.application.submittedAt, locale),
                              })}
                            </p>
                          </div>
                          <StatusBadge
                            status={item.application.status}
                            label={t(`teacher.applicationStatus.${item.application.status}`)}
                          />
                        </div>
                        {item.match && (
                          <div className="mt-2 max-w-xs">
                            <ProgressBar
                              value={item.match.totalScore}
                              tone="match"
                              label={t('teacher.projectDetail.matchScore')}
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('teacher.projectDetail.topCandidatesTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-foreground-muted">
                  {t('teacher.projectDetail.topCandidatesHint')}
                </p>
                {state.topCandidates.items.length === 0 ? (
                  <p className="text-sm text-foreground-muted">
                    {t('teacher.projectDetail.topCandidatesEmpty')}
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {state.topCandidates.items.map((item) => (
                      <li
                        key={`${item.rank}-${item.student.id}`}
                        className="flex flex-wrap items-center justify-between gap-3 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                            #{item.rank}
                          </span>
                          <div>
                            <p className="font-medium text-foreground">
                              {item.profile.displayName}
                            </p>
                            <p className="text-sm text-foreground-muted">
                              {item.profile.email}
                            </p>
                          </div>
                        </div>
                        <div className="w-full max-w-xs sm:w-48">
                          <ProgressBar value={item.match.totalScore} tone="match" showPercentage />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('teacher.projectDetail.selectionsTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                {state.selections.length === 0 ? (
                  <p className="text-sm text-foreground-muted">
                    {t('teacher.projectDetail.selectionsEmpty')}
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {state.selections.map((selection) => (
                      <li key={selection.id} className="py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <StatusBadge
                            status={selection.decision}
                            label={t(`teacher.applicationStatus.${selection.decision}`)}
                          />
                          <span className="text-xs text-foreground-muted">
                            {formatDateTime(selection.decidedAt, locale)}
                          </span>
                        </div>
                        {selection.reason && (
                          <p className="mt-1 text-sm text-foreground-secondary">
                            {t('teacher.projectDetail.reasonLabel')}: {selection.reason}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground-secondary">{value}</p>
    </div>
  )
}

export default function TeacherProjectDetailPage() {
  return (
    <RoleGuard allowedRoles={['teacher', 'admin']}>
      <TeacherProjectDetailContent />
    </RoleGuard>
  )
}
