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

function TeacherDashboardContent() {
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
      setError(
        err instanceof ApiClientError ? err.message : t('teacher.dashboard.loadError')
      )
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
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('teacher.dashboardTitle')}
          </h1>
          <p className="text-foreground-muted">{t('teacher.dashboardDescription')}</p>
        </div>

        {loading && <LoadingState message={t('common.loading')} />}

        {!loading && error && (
          <ErrorState message={error} onRetry={load} retryLabel={t('common.retry')} />
        )}

        {!loading && !error && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle>{t('teacher.dashboard.projectsCardTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">{projectCount}</p>
                <p className="mt-1 text-sm text-foreground-muted">
                  {t('teacher.dashboard.projectsCardDescription')}
                </p>
                <Link href="/teacher/projects" className="mt-4 inline-block">
                  <Button variant="primary">
                    {t('teacher.dashboard.reviewProjects')}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('teacher.dashboard.studentsCardTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-foreground">{studentCount}</p>
                <p className="mt-1 text-sm text-foreground-muted">
                  {t('teacher.dashboard.studentsCardDescription')}
                </p>
                <Link href="/teacher/students" className="mt-4 inline-block">
                  <Button variant="outline">
                    {t('teacher.dashboard.viewStudents')}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('teacher.dashboard.auditCardTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mt-1 text-sm text-foreground-muted">
                  {t('teacher.dashboard.auditCardDescription')}
                </p>
                <Link href="/teacher/audit" className="mt-4 inline-block">
                  <Button variant="outline">{t('teacher.dashboard.viewAudit')}</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TeacherDashboardPage() {
  return (
    <RoleGuard allowedRoles={['teacher']}>
      <TeacherDashboardContent />
    </RoleGuard>
  )
}
