'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { RoleGuard } from '@/components/auth/RoleGuard'
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Select,
  StatusBadge,
  Tag,
} from '@/components/ui'
import { ApiClientError, api } from '@/lib/api/client'
import { formatDate } from '@/lib/format'
import { useTranslations } from '@/lib/i18n'
import type { Project, ProjectStatus, ProjectType } from '@/types/domain'

const STATUS_OPTIONS: ProjectStatus[] = ['draft', 'published', 'closed', 'archived']
const TYPE_OPTIONS: ProjectType[] = ['company_project', 'internship']

function TeacherProjectsContent() {
  const { t, locale } = useTranslations()
  const searchParams = useSearchParams()
  const showCompaniesOwnNotice = searchParams.get('notice') === 'companies-own-projects'

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<ProjectStatus | ''>('')
  const [projectType, setProjectType] = useState<ProjectType | ''>('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.listProjects({
        status: status || undefined,
        projectType: projectType || undefined,
        q: search.trim() || undefined,
      })
      setProjects(data)
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : t('teacher.projectsLoadError')
      )
    } finally {
      setLoading(false)
    }
  }, [status, projectType, search, t])

  useEffect(() => {
    void load()
  }, [load])

  function projectTypeLabel(value: ProjectType): string {
    return t(`teacher.projectType.${value}`)
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('teacher.projectsTitle')}
          </h1>
          <p className="text-foreground-muted">{t('teacher.projectsDescription')}</p>
        </div>

        {showCompaniesOwnNotice && (
          <Alert variant="info">{t('teacher.projectsCompaniesOwnNotice')}</Alert>
        )}

        <Card>
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label={t('teacher.filters.statusLabel')}
              value={status}
              onChange={(event) => setStatus(event.target.value as ProjectStatus | '')}
              options={[
                { value: '', label: t('teacher.filters.statusAll') },
                ...STATUS_OPTIONS.map((value) => ({
                  value,
                  label: t(`teacher.projectStatus.${value}`),
                })),
              ]}
            />
            <Select
              label={t('teacher.filters.typeLabel')}
              value={projectType}
              onChange={(event) => setProjectType(event.target.value as ProjectType | '')}
              options={[
                { value: '', label: t('teacher.filters.typeAll') },
                ...TYPE_OPTIONS.map((value) => ({
                  value,
                  label: projectTypeLabel(value),
                })),
              ]}
            />
            <Input
              label={t('teacher.filters.searchLabel')}
              placeholder={t('teacher.filters.searchPlaceholder')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </Card>

        {loading && <LoadingState message={t('common.loading')} />}

        {!loading && error && (
          <ErrorState message={error} onRetry={load} retryLabel={t('common.retry')} />
        )}

        {!loading && !error && projects.length === 0 && (
          <EmptyState
            title={t('teacher.projectsEmptyTitle')}
            description={t('teacher.projectsEmptyDescription')}
          />
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold text-foreground">
                      {project.title}
                    </h2>
                    <StatusBadge
                      status={project.status}
                      label={t(`teacher.projectStatus.${project.status}`)}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Tag variant="primary">{projectTypeLabel(project.projectType)}</Tag>
                    {project.department && <Tag>{project.department}</Tag>}
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm text-foreground-secondary">
                    {project.description}
                  </p>
                  <p className="mt-3 text-sm text-foreground-muted">
                    {t('teacher.projectCard.positions', { count: project.positions })}
                  </p>
                  <p className="text-sm text-foreground-muted">
                    {project.applicationDeadline
                      ? t('teacher.projectCard.deadline', {
                          date: formatDate(project.applicationDeadline, locale),
                        })
                      : t('teacher.projectCard.noDeadline')}
                  </p>
                </div>
                <Link href={`/teacher/projects/${project.id}`} className="mt-4">
                  <Button variant="outline" className="w-full">
                    {t('common.viewDetails')}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function TeacherProjectsPage() {
  return (
    <RoleGuard allowedRoles={['teacher', 'admin']}>
      <TeacherProjectsContent />
    </RoleGuard>
  )
}
