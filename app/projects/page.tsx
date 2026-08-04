'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Select,
  Tag,
} from '@/components/ui'
import { useStudentOnlyGuard } from '@/lib/auth/useStudentOnlyGuard'
import { useTranslations } from '@/lib/i18n'
import { api, ApiClientError } from '@/lib/api/client'
import { formatDate } from '@/lib/format'
import type { Project, ProjectType } from '@/types/domain'

export default function ProjectsPage() {
  useStudentOnlyGuard()
  const { t, locale } = useTranslations()

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [projectType, setProjectType] = useState<'' | ProjectType>('')

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.listProjects({
        q: search.trim() || undefined,
        projectType: projectType || undefined,
      })
      setProjects(data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('projects.errorMessage'))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, projectType])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void fetchProjects()
    }, 300)
    return () => window.clearTimeout(handle)
  }, [fetchProjects])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-3xl font-bold text-foreground">{t('projects.title')}</h1>
      <p className="mb-6 text-foreground-muted">{t('projects.description')}</p>

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('projects.filters.searchLabel')}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('projects.filters.searchPlaceholder')}
          />
          <Select
            label={t('projects.filters.typeLabel')}
            value={projectType}
            onChange={(e) => setProjectType(e.target.value as '' | ProjectType)}
            options={[
              { value: '', label: t('projects.filters.allTypes') },
              { value: 'company_project', label: t('projects.types.company_project') },
              { value: 'internship', label: t('projects.types.internship') },
            ]}
          />
        </div>
      </Card>

      {loading && <LoadingState message={t('projects.loadingMessage')} />}

      {!loading && error && <ErrorState message={error} onRetry={fetchProjects} />}

      {!loading && !error && projects.length === 0 && (
        <EmptyState title={t('projects.empty.title')} description={t('projects.empty.description')} />
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold text-foreground">{project.title}</h2>
                  <Tag variant="primary">{t(`projects.types.${project.projectType}`)}</Tag>
                </div>
                <p className="mb-3 line-clamp-2 text-sm text-foreground-muted">
                  {project.description}
                </p>
                <p className="text-sm text-foreground-secondary">
                  {project.applicationDeadline
                    ? t('projects.card.deadline', { date: formatDate(project.applicationDeadline, locale) })
                    : t('projects.card.noDeadline')}
                </p>
                {project.department && (
                  <p className="mt-1 text-sm text-foreground-secondary">
                    {t('projects.card.department', { department: project.department })}
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
