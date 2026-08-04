'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { RoleGuard } from '@/components/auth/RoleGuard'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  LoadingState,
  StatusBadge,
  Tag,
} from '@/components/ui'
import { useAuth } from '@/lib/auth/AuthProvider'
import { api, ApiClientError } from '@/lib/api/client'
import { useTranslations } from '@/lib/i18n'
import type { ProjectDetail } from '@/types/api'
import type { Course, Interest, Skill } from '@/types/domain'

function formatDate(value: string | null, locale: string): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(locale)
}

function ProjectDetailContent({ projectId }: { projectId: string }) {
  const { t, locale } = useTranslations()
  const { companyId } = useAuth()

  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [interests, setInterests] = useState<Interest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [data, courseList, skillList, interestList] = await Promise.all([
        api.getProject(projectId),
        api.listCourses(),
        api.listSkills(),
        api.listInterests(),
      ])
      setProject(data)
      setCourses(courseList)
      setSkills(skillList)
      setInterests(interestList)
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : t('company.projectDetail.loadError')
      )
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const courseName = useMemo(() => {
    const map = new Map(courses.map((c) => [c.id, locale === 'fi' ? c.nameFi : c.nameEn]))
    return (id: string) => map.get(id) ?? id
  }, [courses, locale])
  const skillName = useMemo(() => {
    const map = new Map(skills.map((s) => [s.id, locale === 'fi' ? s.nameFi : s.nameEn]))
    return (id: string) => map.get(id) ?? id
  }, [skills, locale])
  const interestName = useMemo(() => {
    const map = new Map(
      interests.map((i) => [i.id, locale === 'fi' ? i.nameFi : i.nameEn])
    )
    return (id: string) => map.get(id) ?? id
  }, [interests, locale])

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <LoadingState message={t('company.projectDetail.loading')} />
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <ErrorState
            message={error ?? t('company.projectDetail.notFound')}
            onRetry={load}
          />
        </div>
      </div>
    )
  }

  const isOwner = project.companyId === companyId

  if (!isOwner) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <ErrorState
            title={t('company.projectDetail.notFound')}
            message={t('company.projectDetail.notOwnerMessage')}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/company/projects"
          className="mb-4 inline-block text-sm text-primary hover:underline"
        >
          {t('company.projectDetail.backToProjects')}
        </Link>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">
                {project.title}
              </h1>
              <StatusBadge
                status={project.status}
                label={t(`company.projectStatus.${project.status}`)}
              />
            </div>
            <p className="mt-1 text-foreground-muted">
              {t(
                `company.projectForm.projectType${
                  project.projectType === 'internship'
                    ? 'Internship'
                    : 'CompanyProject'
                }`
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/company/projects/${project.id}/edit`}>
              <Button variant="secondary">
                {t('company.projectDetail.editLink')}
              </Button>
            </Link>
            <Link href={`/company/projects/${project.id}/applicants`}>
              <Button variant="outline">
                {t('company.projectDetail.applicantsLink')}
              </Button>
            </Link>
            <Link href={`/company/projects/${project.id}/top`}>
              <Button variant="outline">
                {t('company.projectDetail.topCandidatesLink')}
              </Button>
            </Link>
            <Link href={`/company/projects/${project.id}/selections`}>
              <Button variant="outline">
                {t('company.projectDetail.selectionsLink')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('company.projectDetail.overviewTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="whitespace-pre-wrap text-foreground">
                {project.description || t('company.projectDetail.noDescription')}
              </p>
              <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                <div>
                  <p className="text-foreground-secondary">
                    {t('company.projectDetail.positionsLabel')}
                  </p>
                  <p className="font-medium text-foreground">
                    {project.positions}
                  </p>
                </div>
                <div>
                  <p className="text-foreground-secondary">
                    {t('company.projectDetail.workModeLabel')}
                  </p>
                  <p className="font-medium text-foreground">
                    {t(`company.projectForm.workMode${
                      project.workMode.charAt(0).toUpperCase() +
                      project.workMode.slice(1)
                    }`)}
                  </p>
                </div>
                <div>
                  <p className="text-foreground-secondary">
                    {t('company.projectDetail.locationLabel')}
                  </p>
                  <p className="font-medium text-foreground">
                    {project.location || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-foreground-secondary">
                    {t('company.projectDetail.departmentLabel')}
                  </p>
                  <p className="font-medium text-foreground">
                    {project.department || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-foreground-secondary">
                    {t('company.projectDetail.minimumCreditsLabel')}
                  </p>
                  <p className="font-medium text-foreground">
                    {project.minimumStudyCredits}
                  </p>
                </div>
                <div>
                  <p className="text-foreground-secondary">
                    {t('company.projectDetail.requiredLanguageLabel')}
                  </p>
                  <p className="font-medium text-foreground">
                    {project.requiredLanguage === 'fi'
                      ? t('company.projectForm.languageFi')
                      : t('company.projectForm.languageEn')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('company.projectDetail.scheduleTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-foreground-secondary">
                    {t('company.projectForm.applicationStartLabel')}
                  </p>
                  <p className="font-medium text-foreground">
                    {formatDate(project.applicationStart, locale)}
                  </p>
                </div>
                <div>
                  <p className="text-foreground-secondary">
                    {t('company.projectForm.applicationDeadlineLabel')}
                  </p>
                  <p className="font-medium text-foreground">
                    {formatDate(project.applicationDeadline, locale)}
                  </p>
                </div>
                <div>
                  <p className="text-foreground-secondary">
                    {t('company.projectForm.projectStartLabel')}
                  </p>
                  <p className="font-medium text-foreground">
                    {formatDate(project.projectStart, locale)}
                  </p>
                </div>
                <div>
                  <p className="text-foreground-secondary">
                    {t('company.projectForm.projectEndLabel')}
                  </p>
                  <p className="font-medium text-foreground">
                    {formatDate(project.projectEnd, locale)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t('company.projectDetail.requirementsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="mb-1.5 text-foreground-secondary">
                  {t('company.projectDetail.requiredCoursesLabel')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.requiredCourseIds.length === 0 && (
                    <span className="text-foreground-muted">—</span>
                  )}
                  {project.requiredCourseIds.map((id) => (
                    <Tag key={id}>{courseName(id)}</Tag>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-foreground-secondary">
                  {t('company.projectDetail.recommendedCoursesLabel')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.recommendedCourseIds.length === 0 && (
                    <span className="text-foreground-muted">—</span>
                  )}
                  {project.recommendedCourseIds.map((id) => (
                    <Tag key={id} variant="muted">
                      {courseName(id)}
                    </Tag>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-foreground-secondary">
                  {t('company.projectDetail.requiredSkillsLabel')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.requiredSkillIds.length === 0 && (
                    <span className="text-foreground-muted">—</span>
                  )}
                  {project.requiredSkillIds.map((id) => (
                    <Tag key={id}>{skillName(id)}</Tag>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-foreground-secondary">
                  {t('company.projectDetail.recommendedSkillsLabel')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.recommendedSkillIds.length === 0 && (
                    <span className="text-foreground-muted">—</span>
                  )}
                  {project.recommendedSkillIds.map((id) => (
                    <Tag key={id} variant="muted">
                      {skillName(id)}
                    </Tag>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-foreground-secondary">
                  {t('company.projectDetail.interestsLabel')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.interestIds.length === 0 && (
                    <span className="text-foreground-muted">—</span>
                  )}
                  {project.interestIds.map((id) => (
                    <Tag key={id} variant="primary">
                      {interestName(id)}
                    </Tag>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t('company.projectDetail.weightsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-foreground-secondary">
                    {t('company.projectForm.weightStudyCredits')}
                  </p>
                  <p className="font-medium text-foreground">
                    {project.weights.studyCredits}
                  </p>
                </div>
                <div>
                  <p className="text-foreground-secondary">
                    {t('company.projectForm.weightRequiredCourses')}
                  </p>
                  <p className="font-medium text-foreground">
                    {project.weights.requiredCourses}
                  </p>
                </div>
                <div>
                  <p className="text-foreground-secondary">
                    {t('company.projectForm.weightRecommendedCourses')}
                  </p>
                  <p className="font-medium text-foreground">
                    {project.weights.recommendedCourses}
                  </p>
                </div>
                <div>
                  <p className="text-foreground-secondary">
                    {t('company.projectForm.weightSkills')}
                  </p>
                  <p className="font-medium text-foreground">
                    {project.weights.skills}
                  </p>
                </div>
                <div>
                  <p className="text-foreground-secondary">
                    {t('company.projectForm.weightLanguage')}
                  </p>
                  <p className="font-medium text-foreground">
                    {project.weights.language}
                  </p>
                </div>
                <div>
                  <p className="text-foreground-secondary">
                    {t('company.projectForm.weightAvailability')}
                  </p>
                  <p className="font-medium text-foreground">
                    {project.weights.availability}
                  </p>
                </div>
                <div>
                  <p className="text-foreground-secondary">
                    {t('company.projectForm.weightInterests')}
                  </p>
                  <p className="font-medium text-foreground">
                    {project.weights.interests}
                  </p>
                </div>
                <div>
                  <p className="text-foreground-secondary">
                    {t('company.projectForm.weightDegreeProgramme')}
                  </p>
                  <p className="font-medium text-foreground">
                    {project.weights.degreeProgramme}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function CompanyProjectDetailPage() {
  const params = useParams<{ id: string }>()
  return (
    <RoleGuard allowedRoles={['company']}>
      <ProjectDetailContent projectId={params.id} />
    </RoleGuard>
  )
}
