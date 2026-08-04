'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  LoadingState,
  ProgressBar,
  Tag,
} from '@/components/ui'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useStudentOnlyGuard } from '@/lib/auth/useStudentOnlyGuard'
import { useTranslations } from '@/lib/i18n'
import { api, ApiClientError } from '@/lib/api/client'
import { formatDate, localizedName } from '@/lib/format'
import type { ApplicationWithProject, ProjectDetail } from '@/types/api'
import type { Course, Interest, Skill } from '@/types/domain'

export default function ProjectDetailPage() {
  useStudentOnlyGuard()
  const params = useParams<{ id: string }>()
  const projectId = params.id
  const { t, locale } = useTranslations()
  const { studentId } = useAuth()

  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [interests, setInterests] = useState<Interest[]>([])
  const [existingApplication, setExistingApplication] = useState<ApplicationWithProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [message, setMessage] = useState('')
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [applySuccess, setApplySuccess] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const [projectDetail, courseList, skillList, interestList, applications] = await Promise.all([
        api.getProject(projectId),
        api.listCourses(),
        api.listSkills(),
        api.listInterests(),
        api.listMyApplications().catch(() => []),
      ])
      setProject(projectDetail)
      setCourses(courseList)
      setSkills(skillList)
      setInterests(interestList)
      setExistingApplication(applications.find((a) => a.projectId === projectId) ?? null)
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) {
        setNotFound(true)
      } else {
        setError(err instanceof ApiClientError ? err.message : t('projects.detail.errorMessage'))
      }
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
     
    void load()
  }, [load])

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses])
  const skillMap = useMemo(() => new Map(skills.map((s) => [s.id, s])), [skills])
  const interestMap = useMemo(() => new Map(interests.map((i) => [i.id, i])), [interests])

  async function handleApply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setApplyError(null)
    setApplying(true)
    try {
      const application = await api.createApplication({
        projectId,
        message: message.trim() || null,
      })
      setApplySuccess(true)
      setExistingApplication({
        ...application,
        project: {
          id: project!.id,
          title: project!.title,
          projectType: project!.projectType,
          status: project!.status,
          applicationDeadline: project!.applicationDeadline,
        },
      })
    } catch (err) {
      setApplyError(err instanceof ApiClientError ? err.message : t('projects.detail.applyError'))
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <LoadingState message={t('projects.detail.loadingMessage')} />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState
          title={t('projects.detail.notFoundTitle')}
          message={t('projects.detail.notFoundDescription')}
        />
        <div className="mt-4 text-center">
          <Link href="/projects" className="text-sm font-semibold text-primary hover:underline">
            {t('projects.detail.back')}
          </Link>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState message={error ?? t('projects.detail.errorMessage')} onRetry={load} />
      </div>
    )
  }

  const requiredCourses = project.requiredCourseIds.map((id) => courseMap.get(id)).filter(Boolean) as Course[]
  const recommendedCourses = project.recommendedCourseIds.map((id) => courseMap.get(id)).filter(Boolean) as Course[]
  const requiredSkills = project.requiredSkillIds.map((id) => skillMap.get(id)).filter(Boolean) as Skill[]
  const recommendedSkills = project.recommendedSkillIds.map((id) => skillMap.get(id)).filter(Boolean) as Skill[]
  const relatedInterests = project.interestIds.map((id) => interestMap.get(id)).filter(Boolean) as Interest[]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/projects" className="mb-4 inline-block text-sm font-semibold text-primary hover:underline">
        ← {t('projects.detail.back')}
      </Link>

      <Card className="mb-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Tag variant="primary">{t(`projects.types.${project.projectType}`)}</Tag>
          {project.department && <Tag>{project.department}</Tag>}
        </div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">{project.title}</h1>
        <p className="whitespace-pre-line text-foreground-secondary">{project.description}</p>

        <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-foreground-muted">{t('projects.detail.positions')}</p>
            <p className="text-foreground">{project.positions}</p>
          </div>
          <div>
            <p className="text-sm text-foreground-muted">{t('projects.detail.workMode')}</p>
            <p className="text-foreground">{t(`projects.detail.workModes.${project.workMode}`)}</p>
          </div>
          {project.location && (
            <div>
              <p className="text-sm text-foreground-muted">{t('projects.detail.location')}</p>
              <p className="text-foreground">{project.location}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-foreground-muted">{t('projects.detail.remoteAllowed')}</p>
            <p className="text-foreground">{project.remoteAllowed ? t('common.yes') : t('common.no')}</p>
          </div>
          <div>
            <p className="text-sm text-foreground-muted">{t('projects.detail.minimumStudyCredits')}</p>
            <p className="text-foreground">{project.minimumStudyCredits}</p>
          </div>
          <div>
            <p className="text-sm text-foreground-muted">{t('projects.detail.requiredLanguage')}</p>
            <p className="text-foreground">{project.requiredLanguage === 'fi' ? 'Suomi' : 'English'}</p>
          </div>
          <div>
            <p className="text-sm text-foreground-muted">{t('projects.detail.applicationDeadline')}</p>
            <p className="text-foreground">{formatDate(project.applicationDeadline, locale)}</p>
          </div>
          <div>
            <p className="text-sm text-foreground-muted">{t('projects.detail.projectDates')}</p>
            <p className="text-foreground">
              {formatDate(project.projectStart, locale)} – {formatDate(project.projectEnd, locale)}
            </p>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('projects.detail.weightsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-foreground-muted">{t('projects.detail.weightsDescription')}</p>
          {(Object.keys(project.weights) as Array<keyof typeof project.weights>).map((key) => (
            <ProgressBar
              key={key}
              value={project.weights[key]}
              label={t(`projects.detail.weights.${key}`)}
            />
          ))}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('projects.detail.requiredSkills')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {requiredSkills.length === 0 && <p className="text-sm text-foreground-muted">{t('projects.detail.noneListed')}</p>}
          {requiredSkills.map((s) => (
            <Tag key={s.id} variant="primary">{localizedName(s, locale)}</Tag>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('projects.detail.recommendedSkills')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {recommendedSkills.length === 0 && <p className="text-sm text-foreground-muted">{t('projects.detail.noneListed')}</p>}
          {recommendedSkills.map((s) => (
            <Tag key={s.id}>{localizedName(s, locale)}</Tag>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('projects.detail.requiredCourses')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {requiredCourses.length === 0 && <p className="text-sm text-foreground-muted">{t('projects.detail.noneListed')}</p>}
          {requiredCourses.map((c) => (
            <Tag key={c.id} variant="primary">{c.code} · {localizedName(c, locale)}</Tag>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('projects.detail.recommendedCourses')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {recommendedCourses.length === 0 && <p className="text-sm text-foreground-muted">{t('projects.detail.noneListed')}</p>}
          {recommendedCourses.map((c) => (
            <Tag key={c.id}>{c.code} · {localizedName(c, locale)}</Tag>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('projects.detail.interests')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {relatedInterests.length === 0 && <p className="text-sm text-foreground-muted">{t('projects.detail.noneListed')}</p>}
          {relatedInterests.map((i) => (
            <Tag key={i.id}>{localizedName(i, locale)}</Tag>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('projects.detail.applyTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {existingApplication || applySuccess ? (
            <Alert variant="success">
              {t('projects.detail.alreadyAppliedDescription', {
                date: formatDate(existingApplication?.submittedAt, locale),
              })}
              <div className="mt-3">
                <Link href="/applications" className="text-sm font-semibold underline">
                  {t('projects.detail.viewApplications')}
                </Link>
              </div>
            </Alert>
          ) : !studentId ? (
            <Alert variant="info">{t('projects.detail.loginToApplyHint')}</Alert>
          ) : (
            <form onSubmit={handleApply} className="space-y-4">
              {applyError && <Alert variant="error">{applyError}</Alert>}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {t('projects.detail.applyMessageLabel')}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('projects.detail.applyMessagePlaceholder')}
                  rows={4}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground placeholder:text-foreground-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <Button type="submit" isLoading={applying}>
                {applying ? t('projects.detail.applying') : t('projects.detail.applyButton')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
