'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { RoleGuard } from '@/components/auth/RoleGuard'
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  Select,
  StatusBadge,
  Textarea,
} from '@/components/ui'
import { api, ApiClientError } from '@/lib/api/client'
import { useTranslations } from '@/lib/i18n'
import type { ApplicantListItem, ProjectDetail } from '@/types/api'
import type { SelectionDecision, SelectionDecisionValue } from '@/types/domain'

interface RankedApplicant extends ApplicantListItem {
  rank: number | null
}

function rankApplicants(items: ApplicantListItem[]): RankedApplicant[] {
  const withScore = items
    .filter((i) => i.match !== null)
    .map((i) => ({ id: i.student.id, score: i.match!.totalScore }))
    .sort((a, b) =>
      b.score !== a.score ? b.score - a.score : a.id.localeCompare(b.id)
    )
  const rankById = new Map(withScore.map((entry, index) => [entry.id, index + 1]))
  return items.map((item) => ({
    ...item,
    rank: rankById.get(item.student.id) ?? null,
  }))
}

function SelectionsContent({ projectId }: { projectId: string }) {
  const { t, locale } = useTranslations()
  const searchParams = useSearchParams()

  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [applicants, setApplicants] = useState<RankedApplicant[]>([])
  const [selections, setSelections] = useState<SelectionDecision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [applicationId, setApplicationId] = useState('')
  const [decision, setDecision] = useState<SelectionDecisionValue>('selected')
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [projectData, applicantsResult, selectionsResult] =
        await Promise.all([
          api.getProject(projectId),
          api.listApplicants(projectId),
          api.listSelections(projectId),
        ])
      setProject(projectData)
      setApplicants(rankApplicants(applicantsResult.items))
      setSelections(selectionsResult)
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : t('company.selections.loadError')
      )
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const preselect = searchParams.get('applicationId')
    if (preselect) setApplicationId(preselect)
  }, [searchParams])

  const applicationOptions = useMemo(
    () =>
      applicants
        .filter((a) => a.application.status !== 'withdrawn')
        .map((a) => ({
          value: a.application.id,
          label: `${a.profile.displayName} — ${
            a.match ? `${a.match.totalScore}%` : t('company.applicants.noMatchYet')
          } (${t(`company.applicationStatus.${a.application.status}`)})`,
        })),
    [applicants, t]
  )

  const selectedApplicant = applicants.find(
    (a) => a.application.id === applicationId
  )

  const studentNameById = useMemo(() => {
    const map = new Map(applicants.map((a) => [a.student.id, a.profile.displayName]))
    return (id: string) => map.get(id) ?? id
  }, [applicants])

  function openConfirm() {
    setSubmitError(null)
    setReasonError(null)
    if (!applicationId || !selectedApplicant) {
      setSubmitError(t('company.selections.applicationRequired'))
      return
    }
    if (decision === 'selected' && !reason.trim()) {
      setReasonError(t('company.selections.reasonRequired'))
      return
    }
    setConfirmOpen(true)
  }

  async function handleConfirm() {
    if (!selectedApplicant) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await api.createSelection(projectId, {
        studentId: selectedApplicant.student.id,
        applicationId: selectedApplicant.application.id,
        decision,
        reason: reason.trim() ? reason.trim() : null,
      })
      setConfirmOpen(false)
      setApplicationId('')
      setReason('')
      setDecision('selected')
      await load()
    } catch (err) {
      setSubmitError(
        err instanceof ApiClientError
          ? err.message
          : t('company.selections.submitError')
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <LoadingState message={t('company.selections.loading')} />
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <ErrorState
            message={error ?? t('company.selections.loadError')}
            onRetry={load}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/company/projects/${projectId}`}
          className="mb-4 inline-block text-sm text-primary hover:underline"
        >
          {t('company.selections.backToProject')}
        </Link>

        <h1 className="text-3xl font-bold text-foreground">
          {t('company.selections.title')}
        </h1>
        <p className="mt-1 mb-6 text-foreground-muted">{project.title}</p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('company.selections.newSelectionTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {submitError && <Alert variant="error">{submitError}</Alert>}

            {applicationOptions.length === 0 ? (
              <p className="text-sm text-foreground-muted">
                {t('company.selections.noApplicants')}
              </p>
            ) : (
              <>
                <Select
                  label={t('company.selections.applicationLabel')}
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  options={applicationOptions}
                  placeholder={t('company.selections.applicationPlaceholder')}
                />

                {selectedApplicant && (
                  <Alert variant="info">
                    {selectedApplicant.rank
                      ? t('company.selections.algorithmRankInfo', {
                          rank: selectedApplicant.rank,
                        })
                      : t('company.selections.algorithmRankNone')}
                  </Alert>
                )}

                <Select
                  label={t('company.selections.decisionLabel')}
                  value={decision}
                  onChange={(e) =>
                    setDecision(e.target.value as SelectionDecisionValue)
                  }
                  options={[
                    {
                      value: 'selected',
                      label: t('company.selections.decisionSelected'),
                    },
                    {
                      value: 'not_selected',
                      label: t('company.selections.decisionNotSelected'),
                    },
                  ]}
                />

                <Textarea
                  label={t('company.selections.reasonLabel')}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('company.selections.reasonPlaceholder')}
                  required={decision === 'selected'}
                  error={reasonError ?? undefined}
                  helperText={
                    decision === 'selected'
                      ? undefined
                      : t('company.selections.reasonOptionalHelper')
                  }
                />

                <div className="flex justify-end">
                  <Button onClick={openConfirm} disabled={!applicationId}>
                    {t('company.selections.submit')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <h2 className="mb-3 text-xl font-semibold text-foreground">
          {t('company.selections.historyTitle')}
        </h2>

        {selections.length === 0 ? (
          <EmptyState
            title={t('company.selections.emptyTitle')}
            description={t('company.selections.emptyDescription')}
          />
        ) : (
          <div className="space-y-3">
            {selections.map((s) => (
              <Card key={s.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">
                        {studentNameById(s.studentId)}
                      </p>
                      <StatusBadge
                        status={s.decision}
                        label={t(`company.applicationStatus.${s.decision}`)}
                      />
                    </div>
                    {s.reason && (
                      <p className="mt-1 text-sm text-foreground-secondary">
                        {t('company.selections.reasonLabel')}: {s.reason}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-foreground-muted">
                      {t('company.selections.decidedAtLabel')}:{' '}
                      {new Date(s.decidedAt).toLocaleString(locale)}
                    </p>
                  </div>
                  <p className="text-sm text-foreground-muted">
                    {s.algorithmRank
                      ? t('company.selections.algorithmRankInfo', {
                          rank: s.algorithmRank,
                        })
                      : t('company.selections.algorithmRankNone')}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}

        <ConfirmationDialog
          isOpen={confirmOpen}
          title={t('company.selections.confirmTitle')}
          message={
            selectedApplicant
              ? t(
                  decision === 'selected'
                    ? 'company.selections.confirmMessageSelect'
                    : 'company.selections.confirmMessageReject',
                  { name: selectedApplicant.profile.displayName }
                )
              : ''
          }
          confirmLabel={t('company.selections.confirmSelectLabel')}
          cancelLabel={t('company.selections.cancel')}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmOpen(false)}
          isConfirming={submitting}
          variant={decision === 'not_selected' ? 'danger' : 'default'}
        />
      </div>
    </div>
  )
}

export default function CompanySelectionsPage() {
  const params = useParams<{ id: string }>()
  return (
    <RoleGuard allowedRoles={['company']}>
      <SelectionsContent projectId={params.id} />
    </RoleGuard>
  )
}
