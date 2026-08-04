'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { ProjectForm, type ProjectFormValues } from '@/components/company/ProjectForm'
import { Card, ErrorState, LoadingState } from '@/components/ui'
import { api, ApiClientError } from '@/lib/api/client'
import { useTranslations } from '@/lib/i18n'
import type { ProjectDetail } from '@/types/api'

function EditProjectContent({ projectId }: { projectId: string }) {
  const { t } = useTranslations()
  const router = useRouter()

  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await api.getProject(projectId)
      setProject(data)
    } catch (err) {
      setLoadError(
        err instanceof ApiClientError
          ? err.message
          : t('company.projectForm.loadError')
      )
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSubmit(values: ProjectFormValues) {
    setSubmitting(true)
    setServerError(null)
    try {
      const updated = await api.updateProject(projectId, values)
      router.push(`/company/projects/${updated.id}`)
    } catch (err) {
      setServerError(
        err instanceof ApiClientError
          ? err.message
          : t('company.projectForm.submitError')
      )
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-1 text-3xl font-bold text-foreground">
          {t('company.projectForm.editTitle')}
        </h1>
        <p className="mb-6 text-foreground-muted">
          {t('company.projectForm.editDescription')}
        </p>

        {loading && <LoadingState message={t('company.projectForm.loading')} />}
        {!loading && loadError && (
          <ErrorState message={loadError} onRetry={load} />
        )}
        {!loading && !loadError && project && (
          <Card>
            <ProjectForm
              mode="edit"
              initialProject={project}
              submitting={submitting}
              serverError={serverError}
              onSubmit={handleSubmit}
              onCancel={() => router.push(`/company/projects/${projectId}`)}
            />
          </Card>
        )}
      </div>
    </div>
  )
}

export default function EditCompanyProjectPage() {
  const params = useParams<{ id: string }>()
  return (
    <RoleGuard allowedRoles={['company']}>
      <EditProjectContent projectId={params.id} />
    </RoleGuard>
  )
}
