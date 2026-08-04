'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Button, Card, EmptyState, ErrorState, LoadingState } from '@/components/ui'
import { ApiClientError, api } from '@/lib/api/client'
import { useTranslations } from '@/lib/i18n'
import type { Student } from '@/types/domain'

function TeacherStudentsContent() {
  const { t } = useTranslations()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.listStudents()
      setStudents(data)
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : t('teacher.studentsLoadError')
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
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('teacher.studentsTitle')}
          </h1>
          <p className="text-foreground-muted">{t('teacher.studentsDescription')}</p>
        </div>

        {loading && <LoadingState message={t('common.loading')} />}

        {!loading && error && (
          <ErrorState message={error} onRetry={load} retryLabel={t('common.retry')} />
        )}

        {!loading && !error && students.length === 0 && (
          <EmptyState
            title={t('teacher.studentsEmptyTitle')}
            description={t('teacher.studentsEmptyDescription')}
          />
        )}

        {!loading && !error && students.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => (
              <Card key={student.id} className="flex flex-col justify-between">
                <div className="space-y-2">
                  <StudentField
                    label={t('teacher.studentCard.degreeProgramme')}
                    value={student.degreeProgramme}
                    fallback={t('common.notProvided')}
                  />
                  <StudentField
                    label={t('teacher.studentCard.department')}
                    value={student.department}
                    fallback={t('common.notProvided')}
                  />
                  <StudentField
                    label={t('teacher.studentCard.studyCredits')}
                    value={String(student.studyCredits)}
                  />
                </div>
                <Link href={`/teacher/students/${student.id}`} className="mt-4">
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

function StudentField({
  label,
  value,
  fallback,
}: {
  label: string
  value: string | null
  fallback?: string
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
        {label}
      </p>
      <p className="text-sm text-foreground">{value ?? fallback ?? '\u2014'}</p>
    </div>
  )
}

export default function TeacherStudentsPage() {
  return (
    <RoleGuard allowedRoles={['teacher', 'admin']}>
      <TeacherStudentsContent />
    </RoleGuard>
  )
}
