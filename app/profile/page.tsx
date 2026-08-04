'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingState,
  Tag,
} from '@/components/ui'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useStudentOnlyGuard } from '@/lib/auth/useStudentOnlyGuard'
import { useTranslations } from '@/lib/i18n'
import { api, ApiClientError } from '@/lib/api/client'
import { localizedName } from '@/lib/format'
import type { StudentDetail } from '@/types/api'
import type { Course, Interest, Skill } from '@/types/domain'

export default function ProfilePage() {
  useStudentOnlyGuard()
  const { t, locale } = useTranslations()
  const { profile, studentId, loading: authLoading } = useAuth()

  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [interests, setInterests] = useState<Interest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!studentId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [studentDetail, courseList, skillList, interestList] = await Promise.all([
        api.getStudent(studentId),
        api.listCourses(),
        api.listSkills(),
        api.listInterests(),
      ])
      setStudent(studentDetail)
      setCourses(courseList)
      setSkills(skillList)
      setInterests(interestList)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('profile.errorMessage'))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId])

  useEffect(() => {
    if (authLoading) return
     
    void load()
  }, [authLoading, load])

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <LoadingState message={t('profile.loadingMessage')} />
      </div>
    )
  }

  if (!studentId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          title={t('profile.noProfile.title')}
          description={t('profile.noProfile.description')}
          action={
            <Link href="/profile/edit">
              <Button>{t('profile.noProfile.cta')}</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState message={error} onRetry={load} />
      </div>
    )
  }

  if (!student) return null

  const courseMap = new Map(courses.map((c) => [c.id, c]))
  const skillMap = new Map(skills.map((s) => [s.id, s]))
  const interestMap = new Map(interests.map((i) => [i.id, i]))

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">{t('profile.title')}</h1>
        <Link href="/profile/edit">
          <Button variant="secondary">{t('profile.editButton')}</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('profile.sections.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-foreground-muted">{t('profile.fields.degreeProgramme')}</p>
            <p className="text-foreground">{student.degreeProgramme || t('common.notProvided')}</p>
          </div>
          <div>
            <p className="text-sm text-foreground-muted">{t('profile.fields.department')}</p>
            <p className="text-foreground">{student.department || t('common.notProvided')}</p>
          </div>
          <div>
            <p className="text-sm text-foreground-muted">{t('profile.fields.studyCredits')}</p>
            <p className="text-foreground">{student.studyCredits}</p>
          </div>
          <div>
            <p className="text-sm text-foreground-muted">{t('profile.fields.preferredProjectTypes')}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {student.preferredProjectTypes.length === 0 && (
                <span className="text-foreground">{t('common.notProvided')}</span>
              )}
              {student.preferredProjectTypes.map((type) => (
                <Tag key={type} variant="primary">
                  {t(`profile.projectTypes.${type}`)}
                </Tag>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-foreground-muted">{t('profile.fields.availabilityStart')}</p>
            <p className="text-foreground">{student.availabilityStart || t('common.notProvided')}</p>
          </div>
          <div>
            <p className="text-sm text-foreground-muted">{t('profile.fields.availabilityEnd')}</p>
            <p className="text-foreground">{student.availabilityEnd || t('common.notProvided')}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('profile.sections.courses')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {student.courseIds.length === 0 && (
              <p className="text-sm text-foreground-muted">{t('profile.courses.empty')}</p>
            )}
            {student.courseIds.map((id) => {
              const course = courseMap.get(id)
              return (
                <Tag key={id}>
                  {course ? `${course.code} · ${localizedName(course, locale)}` : id}
                </Tag>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('profile.sections.skills')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {student.skillIds.length === 0 && (
              <p className="text-sm text-foreground-muted">{t('profile.skills.empty')}</p>
            )}
            {student.skillIds.map((id) => {
              const skill = skillMap.get(id)
              return <Tag key={id} variant="primary">{skill ? localizedName(skill, locale) : id}</Tag>
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('profile.sections.interests')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {student.interestIds.length === 0 && (
              <p className="text-sm text-foreground-muted">{t('profile.interests.empty')}</p>
            )}
            {student.interestIds.map((id) => {
              const interest = interestMap.get(id)
              return <Tag key={id}>{interest ? localizedName(interest, locale) : id}</Tag>
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('profile.sections.language')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground-muted">
            {t('profile.languageNote', {
              language: profile?.preferredLanguage === 'fi' ? 'Suomi' : 'English',
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
