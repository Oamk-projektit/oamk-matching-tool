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
  ErrorState,
  LoadingState,
} from '@/components/ui'
import { ApiClientError, api } from '@/lib/api/client'
import { useTranslations } from '@/lib/i18n'

function AdminDashboardContent() {
  const { t } = useTranslations()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projectCount, setProjectCount] = useState<number | null>(null)
  const [studentCount, setStudentCount] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [projects, students] = await Promise.all([
        api.listProjects(),
        api.listStudents(),
      ])
      setProjectCount(projects.length)
      setStudentCount(students.length)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('admin.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <span className="inline-block rounded-full bg-foreground text-background px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide">
            {t('roles.admin')}
          </span>
          <h1 className="mt-3 text-3xl font-bold text-foreground mb-2">
            {t('admin.dashboardTitle')}
          </h1>
          <p className="text-foreground-muted">{t('admin.dashboardDescription')}</p>
        </div>

        {loading && <LoadingState message={t('common.loading')} />}

        {!loading && error && (
          <ErrorState message={error} onRetry={load} retryLabel={t('common.retry')} />
        )}

        {!loading && !error && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-foreground/20">
              <CardHeader>
                <CardTitle>{t('admin.dashboard.projectsCardTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-foreground">{projectCount}</p>
                <p className="mt-1 text-sm text-foreground-muted">
                  {t('admin.dashboard.projectsCardDescription')}
                </p>
                <Link href="/teacher/projects" className="mt-4 inline-block">
                  <Button variant="primary">{t('admin.dashboard.reviewProjects')}</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.dashboard.studentsCardTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-foreground">{studentCount}</p>
                <p className="mt-1 text-sm text-foreground-muted">
                  {t('admin.dashboard.studentsCardDescription')}
                </p>
                <Link href="/teacher/students" className="mt-4 inline-block">
                  <Button variant="outline">{t('admin.dashboard.viewStudents')}</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.dashboard.auditCardTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mt-1 text-sm text-foreground-muted">
                  {t('admin.dashboard.auditCardDescription')}
                </p>
                <Link href="/teacher/audit" className="mt-4 inline-block">
                  <Button variant="outline">{t('admin.dashboard.viewAudit')}</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AdminDashboardContent />
    </RoleGuard>
  )
}
