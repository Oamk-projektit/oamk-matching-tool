'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { RoleGuard } from '@/components/auth/RoleGuard'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/ui'
import { useAuth } from '@/lib/auth/AuthProvider'
import { api } from '@/lib/api/client'
import { useTranslations } from '@/lib/i18n'
import type { Project } from '@/types/domain'

function CompanyDashboardContent() {
  const { t } = useTranslations()
  const { companyId } = useAuth()

  const [projects, setProjects] = useState<Project[]>([])
  const [applicantCount, setApplicantCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const all = await api.listProjects()
      const own = all.filter((p) => p.companyId === companyId)
      setProjects(own)

      const results = await Promise.all(
        own.map((p) =>
          api
            .listApplicants(p.id)
            .then((r) => r.count)
            .catch(() => 0)
        )
      )
      setApplicantCount(results.reduce((sum, n) => sum + n, 0))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('company.dashboard.loadError')
      )
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  useEffect(() => {
    void load()
  }, [load])

  const publishedCount = projects.filter((p) => p.status === 'published').length
  const draftCount = projects.filter((p) => p.status === 'draft').length

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('company.dashboard.title')}
            </h1>
            <p className="mt-1 text-foreground-muted">
              {t('company.dashboard.subtitle')}
            </p>
          </div>
          <Link href="/company/projects/new">
            <Button>{t('company.dashboard.createProjectCta')}</Button>
          </Link>
        </div>

        {loading && <LoadingState message={t('company.dashboard.loading')} />}

        {!loading && error && (
          <ErrorState message={error} onRetry={load} />
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>{t('company.dashboard.statsProjects')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">
                    {projects.length}
                  </p>
                  <p className="mt-1 text-sm text-foreground-muted">
                    {t('company.dashboard.statsProjectsBreakdown', {
                      published: publishedCount,
                      draft: draftCount,
                    })}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('company.dashboard.statsApplicants')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">
                    {applicantCount ?? 0}
                  </p>
                  <p className="mt-1 text-sm text-foreground-muted">
                    {t('company.dashboard.statsApplicantsDescription')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('company.dashboard.quickLinksTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link
                    href="/company/projects"
                    className="block text-sm font-medium text-primary hover:underline"
                  >
                    {t('company.dashboard.viewProjectsCta')}
                  </Link>
                  <Link
                    href="/company/profile"
                    className="block text-sm font-medium text-primary hover:underline"
                  >
                    {t('company.dashboard.viewProfileCta')}
                  </Link>
                </CardContent>
              </Card>
            </div>

            {projects.length === 0 && (
              <div className="mt-6">
                <EmptyState
                  title={t('company.dashboard.noProjectsYet')}
                  description={t('company.dashboard.noProjectsDescription')}
                  action={
                    <Link href="/company/projects/new">
                      <Button>{t('company.dashboard.createProjectCta')}</Button>
                    </Link>
                  }
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function CompanyDashboardPage() {
  return (
    <RoleGuard allowedRoles={['company']}>
      <CompanyDashboardContent />
    </RoleGuard>
  )
}
