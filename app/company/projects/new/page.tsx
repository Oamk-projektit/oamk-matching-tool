'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { ProjectForm, type ProjectFormValues } from '@/components/company/ProjectForm'
import { Card } from '@/components/ui'
import { api, ApiClientError } from '@/lib/api/client'
import { useTranslations } from '@/lib/i18n'

function NewCompanyProjectContent() {
  const { t } = useTranslations()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  async function handleSubmit(values: ProjectFormValues) {
    setSubmitting(true)
    setServerError(null)
    try {
      const project = await api.createProject(values)
      router.push(`/company/projects/${project.id}`)
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
          {t('company.projectForm.createTitle')}
        </h1>
        <p className="mb-6 text-foreground-muted">
          {t('company.projectForm.createDescription')}
        </p>

        <Card>
          <ProjectForm
            mode="create"
            submitting={submitting}
            serverError={serverError}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/company/projects')}
          />
        </Card>
      </div>
    </div>
  )
}

export default function NewCompanyProjectPage() {
  return (
    <RoleGuard allowedRoles={['company']}>
      <NewCompanyProjectContent />
    </RoleGuard>
  )
}
