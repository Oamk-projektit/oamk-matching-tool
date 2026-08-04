'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  LoadingState,
  ProgressBar,
} from '@/components/ui'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useStudentOnlyGuard } from '@/lib/auth/useStudentOnlyGuard'
import { useTranslations } from '@/lib/i18n'
import { api, ApiClientError } from '@/lib/api/client'
import type { StudentDetail } from '@/types/api'
import type { Match } from '@/types/domain'

const COMPLETION_FIELD_COUNT = 9

function computeCompletion(student: StudentDetail): number {
  let filled = 0
  if (student.degreeProgramme) filled += 1
  if (student.department) filled += 1
  if (student.studyCredits > 0) filled += 1
  if (student.availabilityStart) filled += 1
  if (student.availabilityEnd) filled += 1
  if (student.preferredProjectTypes.length > 0) filled += 1
  if (student.courseIds.length > 0) filled += 1
  if (student.skillIds.length > 0) filled += 1
  if (student.interestIds.length > 0) filled += 1
  return Math.round((filled / COMPLETION_FIELD_COUNT) * 100)
}

export default function DashboardPage() {
  useStudentOnlyGuard()
  const { t } = useTranslations()
  const { profile, studentId, loading: authLoading } = useAuth()

  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [applicationsCount, setApplicationsCount] = useState(0)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [applications, matchList, studentDetail] = await Promise.all([
        api.listMyApplications().catch(() => []),
        studentId ? api.getMatchesForStudent(studentId).catch(() => []) : Promise.resolve([]),
        studentId ? api.getStudent(studentId).catch(() => null) : Promise.resolve(null),
      ])
      setApplicationsCount(applications.length)
      setMatches(matchList)
      setStudent(studentDetail)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('dashboard.errorMessage'))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId])

  useEffect(() => {
    if (authLoading) return
     
    void load()
  }, [authLoading, load])

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <LoadingState message={t('dashboard.loadingMessage')} />
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

  const completion = student ? computeCompletion(student) : 0
  const hasProfile = Boolean(student)
  const isComplete = completion === 100

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-3xl font-bold text-foreground">
        {t('dashboard.welcome', { name: profile?.displayName ?? '' })}
      </h1>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardContent className="text-center">
            <p className="text-3xl font-bold text-primary">{applicationsCount}</p>
            <p className="mt-1 text-sm text-foreground-muted">
              {t('dashboard.stats.applications')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-3xl font-bold text-primary">{matches.length}</p>
            <p className="mt-1 text-sm text-foreground-muted">
              {t('dashboard.stats.matches')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('dashboard.completion.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProgressBar value={completion} label={t('dashboard.completion.label', { percent: completion })} />
          <p className="text-sm text-foreground-muted">
            {!hasProfile
              ? t('dashboard.completion.noProfileDescription')
              : isComplete
                ? t('dashboard.completion.completeDescription')
                : t('dashboard.completion.incompleteDescription')}
          </p>
          <Link href={hasProfile ? '/profile/edit' : '/profile/edit'}>
            <Button variant={isComplete ? 'secondary' : 'primary'}>
              {hasProfile
                ? t('dashboard.primaryCtaCompleteProfile')
                : t('dashboard.primaryCtaCreateProfile')}
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('dashboard.actions.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            <li className="flex items-center justify-between py-3">
              <span className="text-foreground">
                {hasProfile ? t('dashboard.actions.completeProfile') : t('dashboard.actions.createProfile')}
              </span>
              <Link href="/profile/edit" className="text-sm font-semibold text-primary hover:underline">
                {t('common.viewDetails')}
              </Link>
            </li>
            <li className="flex items-center justify-between py-3">
              <span className="text-foreground">{t('dashboard.actions.browseProjects')}</span>
              <Link href="/projects" className="text-sm font-semibold text-primary hover:underline">
                {t('common.viewDetails')}
              </Link>
            </li>
            <li className="flex items-center justify-between py-3">
              <span className="text-foreground">{t('dashboard.actions.viewApplications')}</span>
              <Link href="/applications" className="text-sm font-semibold text-primary hover:underline">
                {t('common.viewDetails')}
              </Link>
            </li>
            <li className="flex items-center justify-between py-3">
              <span className="text-foreground">{t('dashboard.actions.viewMatches')}</span>
              <Link href="/matches" className="text-sm font-semibold text-primary hover:underline">
                {t('common.viewDetails')}
              </Link>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
