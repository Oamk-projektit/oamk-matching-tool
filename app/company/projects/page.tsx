'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { RoleGuard } from '@/components/auth/RoleGuard'
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from '@/components/ui'
import { useAuth } from '@/lib/auth/AuthProvider'
import { api } from '@/lib/api/client'
import { useTranslations } from '@/lib/i18n'
import type { Project } from '@/types/domain'

function statusLabel(t: (key: string) => string, status: Project['status']) {
  return t(`company.projectStatus.${status}`)
}

function CompanyProjectsContent() {
  const { t, locale } = useTranslations()
  const { companyId } = useAuth()

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const all = await api.listProjects()
      setProjects(
        all
          .filter((p) => p.companyId === companyId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      )
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('company.projects.loadError')
      )
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('company.projects.title')}
            </h1>
            <p className="mt-1 text-foreground-muted">
              {t('company.projects.description')}
            </p>
          </div>
          <Link href="/company/projects/new">
            <Button>{t('company.projects.newProjectCta')}</Button>
          </Link>
        </div>

        {loading && <LoadingState message={t('company.projects.loading')} />}

        {!loading && error && <ErrorState message={error} onRetry={load} />}

        {!loading && !error && projects.length === 0 && (
          <EmptyState
            title={t('company.projects.emptyTitle')}
            description={t('company.projects.emptyDescription')}
            action={
              <Link href="/company/projects/new">
                <Button>{t('company.projects.newProjectCta')}</Button>
              </Link>
            }
          />
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="space-y-3">
            {projects.map((project) => (
              <Card key={project.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/company/projects/${project.id}`}
                        className="text-lg font-semibold text-foreground hover:text-primary"
                      >
                        {project.title}
                      </Link>
                      <StatusBadge
                        status={project.status}
                        label={statusLabel(t, project.status)}
                      />
                    </div>
                    <p className="mt-1 text-sm text-foreground-muted">
                      {t(`company.projectForm.projectType${
                        project.projectType === 'internship'
                          ? 'Internship'
                          : 'CompanyProject'
                      }`)}
                      {' · '}
                      {t('company.projects.positionsCount', {
                        count: project.positions,
                      })}
                      {project.department ? ` · ${project.department}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-foreground-muted">
                      {t('company.projects.createdAt', {
                        date: new Date(project.createdAt).toLocaleDateString(
                          locale
                        ),
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/company/projects/${project.id}`}>
                      <Button variant="secondary" size="sm">
                        {t('company.projects.viewLink')}
                      </Button>
                    </Link>
                    <Link href={`/company/projects/${project.id}/edit`}>
                      <Button variant="secondary" size="sm">
                        {t('company.projects.editLink')}
                      </Button>
                    </Link>
                    <Link href={`/company/projects/${project.id}/applicants`}>
                      <Button variant="outline" size="sm">
                        {t('company.projects.applicantsLink')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CompanyProjectsPage() {
  return (
    <RoleGuard allowedRoles={['company']}>
      <CompanyProjectsContent />
    </RoleGuard>
  )
}
