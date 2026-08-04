'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { RoleGuard } from '@/components/auth/RoleGuard'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingState,
  Tag,
} from '@/components/ui'
import { ApiClientError, api } from '@/lib/api/client'
import { formatDate, localizedName } from '@/lib/format'
import { useTranslations } from '@/lib/i18n'
import type { StudentDetail } from '@/types/api'
import type { Course, Interest, Skill } from '@/types/domain'

interface LoadedState {
  student: StudentDetail
  courses: Course[]
  skills: Skill[]
  interests: Interest[]
}

function TeacherStudentDetailContent() {
  const { t, locale } = useTranslations()
  const params = useParams<{ id: string }>()
  const studentId = params.id

  const [state, setState] = useState<LoadedState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const [student, courses, skills, interests] = await Promise.all([
        api.getStudent(studentId),
        api.listCourses(),
        api.listSkills(),
        api.listInterests(),
      ])
      setState({ student, courses, skills, interests })
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) {
        setNotFound(true)
      } else {
        setError(
          err instanceof ApiClientError ? err.message : t('teacher.studentDetail.loadError')
        )
      }
    } finally {
      setLoading(false)
    }
  }, [studentId, t])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/teacher/students"
          className="inline-block text-sm text-primary hover:underline"
        >
          {'\u2190'} {t('teacher.studentDetail.backToStudents')}
        </Link>

        {loading && <LoadingState message={t('common.loading')} />}

        {!loading && notFound && (
          <EmptyState title={t('teacher.studentDetail.notFoundTitle')} />
        )}

        {!loading && !notFound && error && (
          <ErrorState message={error} onRetry={load} retryLabel={t('common.retry')} />
        )}

        {!loading && !notFound && !error && state && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {state.student.degreeProgramme ?? t('common.notProvided')}
              </h1>
              <p className="mt-1 text-sm text-foreground-muted">
                {state.student.department ?? t('common.notProvided')}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('teacher.studentsTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t('teacher.studentCard.studyCredits')}
                  value={String(state.student.studyCredits)}
                />
                <Field
                  label={t('teacher.studentDetail.availability')}
                  value={`${formatDate(state.student.availabilityStart, locale)} \u2013 ${formatDate(
                    state.student.availabilityEnd,
                    locale
                  )}`}
                />
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-foreground">
                    {t('teacher.studentDetail.preferredProjectTypes')}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {state.student.preferredProjectTypes.length === 0 ? (
                      <span className="text-sm text-foreground-muted">
                        {t('common.notProvided')}
                      </span>
                    ) : (
                      state.student.preferredProjectTypes.map((value) => (
                        <Tag key={value} variant="primary">
                          {t(`teacher.projectType.${value}`)}
                        </Tag>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('teacher.studentDetail.courses')}</CardTitle>
              </CardHeader>
              <CardContent>
                <TagList
                  ids={state.student.courseIds}
                  lookup={state.courses}
                  labelFor={(course) => `${course.code} \u2013 ${localizedName(course, locale)}`}
                  emptyLabel={t('teacher.studentDetail.noCourses')}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('teacher.studentDetail.skills')}</CardTitle>
              </CardHeader>
              <CardContent>
                <TagList
                  ids={state.student.skillIds}
                  lookup={state.skills}
                  labelFor={(skill) => localizedName(skill, locale)}
                  emptyLabel={t('teacher.studentDetail.noSkills')}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('teacher.studentDetail.interests')}</CardTitle>
              </CardHeader>
              <CardContent>
                <TagList
                  ids={state.student.interestIds}
                  lookup={state.interests}
                  labelFor={(interest) => localizedName(interest, locale)}
                  emptyLabel={t('teacher.studentDetail.noInterests')}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground-secondary">{value}</p>
    </div>
  )
}

function TagList<T extends { id: string }>({
  ids,
  lookup,
  labelFor,
  emptyLabel,
}: {
  ids: string[]
  lookup: T[]
  labelFor: (item: T) => string
  emptyLabel: string
}) {
  if (ids.length === 0) {
    return <p className="text-sm text-foreground-muted">{emptyLabel}</p>
  }
  const byId = new Map(lookup.map((item) => [item.id, item]))
  return (
    <div className="flex flex-wrap gap-2">
      {ids.map((id) => {
        const item = byId.get(id)
        return (
          <Tag key={id}>{item ? labelFor(item) : id}</Tag>
        )
      })}
    </div>
  )
}

export default function TeacherStudentDetailPage() {
  return (
    <RoleGuard allowedRoles={['teacher', 'admin']}>
      <TeacherStudentDetailContent />
    </RoleGuard>
  )
}
