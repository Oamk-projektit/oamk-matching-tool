'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  FormSection,
  Input,
  Select,
  Textarea,
} from '@/components/ui'
import { MultiSelectField } from '@/components/company/MultiSelectField'
import { api } from '@/lib/api/client'
import { useTranslations } from '@/lib/i18n'
import {
  DEFAULT_PROJECT_WEIGHTS,
  PROJECT_WEIGHT_TOTAL,
  sumProjectWeights,
  type ProjectWeights,
} from '@/types/domain'
import type { CreateProjectRequest, ProjectDetail } from '@/types/api'
import type {
  Course,
  Interest,
  PreferredLanguage,
  ProjectStatus,
  ProjectType,
  Skill,
  WorkMode,
} from '@/types/domain'

export type ProjectFormValues = CreateProjectRequest

const DEFAULT_VALUES: ProjectFormValues = {
  title: '',
  description: '',
  projectType: 'company_project',
  status: 'draft',
  positions: 1,
  applicationStart: null,
  applicationDeadline: null,
  projectStart: null,
  projectEnd: null,
  workMode: 'hybrid',
  location: '',
  remoteAllowed: true,
  minimumStudyCredits: 0,
  requiredLanguage: 'fi',
  department: '',
  requiredCourseIds: [],
  recommendedCourseIds: [],
  requiredSkillIds: [],
  recommendedSkillIds: [],
  interestIds: [],
  weights: { ...DEFAULT_PROJECT_WEIGHTS },
}

function projectToFormValues(project: ProjectDetail): ProjectFormValues {
  return {
    title: project.title,
    description: project.description,
    projectType: project.projectType,
    status: project.status,
    positions: project.positions,
    applicationStart: project.applicationStart,
    applicationDeadline: project.applicationDeadline,
    projectStart: project.projectStart,
    projectEnd: project.projectEnd,
    workMode: project.workMode,
    location: project.location ?? '',
    remoteAllowed: project.remoteAllowed,
    minimumStudyCredits: project.minimumStudyCredits,
    requiredLanguage: project.requiredLanguage,
    department: project.department ?? '',
    requiredCourseIds: project.requiredCourseIds,
    recommendedCourseIds: project.recommendedCourseIds,
    requiredSkillIds: project.requiredSkillIds,
    recommendedSkillIds: project.recommendedSkillIds,
    interestIds: project.interestIds,
    weights: project.weights,
  }
}

interface FieldErrors {
  title?: string
  positions?: string
  minimumStudyCredits?: string
  weights?: string
}

export interface ProjectFormProps {
  mode: 'create' | 'edit'
  initialProject?: ProjectDetail
  submitting: boolean
  serverError?: string | null
  onSubmit: (values: ProjectFormValues) => void | Promise<void>
  onCancel: () => void
}

const WEIGHT_KEYS: (keyof ProjectWeights)[] = [
  'studyCredits',
  'requiredCourses',
  'recommendedCourses',
  'skills',
  'language',
  'availability',
  'interests',
  'degreeProgramme',
]

export function ProjectForm({
  mode,
  initialProject,
  submitting,
  serverError,
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  const { t, locale } = useTranslations()

  const [values, setValues] = useState<ProjectFormValues>(() =>
    initialProject ? projectToFormValues(initialProject) : DEFAULT_VALUES
  )
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const [courses, setCourses] = useState<Course[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [interests, setInterests] = useState<Interest[]>([])
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [catalogLoading, setCatalogLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function loadCatalogs() {
      setCatalogLoading(true)
      try {
        const [courseList, skillList, interestList] = await Promise.all([
          api.listCourses(),
          api.listSkills(),
          api.listInterests(),
        ])
        if (!active) return
        setCourses(courseList.filter((c) => c.active))
        setSkills(skillList)
        setInterests(interestList)
        setCatalogError(null)
      } catch (err) {
        if (!active) return
        setCatalogError(
          err instanceof Error ? err.message : t('company.projectForm.catalogError')
        )
      } finally {
        if (active) setCatalogLoading(false)
      }
    }
    void loadCatalogs()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const courseOptions = useMemo(
    () =>
      courses.map((c) => ({
        id: c.id,
        label: locale === 'fi' ? c.nameFi : c.nameEn,
        sublabel: c.code,
      })),
    [courses, locale]
  )
  const skillOptions = useMemo(
    () =>
      skills.map((s) => ({
        id: s.id,
        label: locale === 'fi' ? s.nameFi : s.nameEn,
      })),
    [skills, locale]
  )
  const interestOptions = useMemo(
    () =>
      interests.map((i) => ({
        id: i.id,
        label: locale === 'fi' ? i.nameFi : i.nameEn,
      })),
    [interests, locale]
  )

  const weightSum = sumProjectWeights(values.weights ?? DEFAULT_PROJECT_WEIGHTS)
  const weightsValid = weightSum === PROJECT_WEIGHT_TOTAL

  function setField<K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function setWeight(key: keyof ProjectWeights, raw: string) {
    const parsed = Number(raw)
    const safe = Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0
    setValues((prev) => ({
      ...prev,
      weights: { ...(prev.weights ?? DEFAULT_PROJECT_WEIGHTS), [key]: safe },
    }))
  }

  function validate(): boolean {
    const errors: FieldErrors = {}
    if (!values.title.trim()) {
      errors.title = t('company.projectForm.titleRequired')
    }
    if (!Number.isInteger(values.positions) || (values.positions ?? 0) < 1) {
      errors.positions = t('company.projectForm.positionsInvalid')
    }
    if (
      values.minimumStudyCredits !== undefined &&
      (!Number.isInteger(values.minimumStudyCredits) ||
        values.minimumStudyCredits < 0)
    ) {
      errors.minimumStudyCredits = t(
        'company.projectForm.minimumStudyCreditsInvalid'
      )
    }
    if (!weightsValid) {
      errors.weights = t('company.projectForm.weightSumError', {
        sum: weightSum,
      })
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate()) return
    await onSubmit({
      ...values,
      location: values.location?.trim() ? values.location.trim() : null,
      department: values.department?.trim() ? values.department.trim() : null,
    })
  }

  const projectTypeOptions = [
    {
      value: 'company_project',
      label: t('company.projectForm.projectTypeCompanyProject'),
    },
    { value: 'internship', label: t('company.projectForm.projectTypeInternship') },
  ]

  const statusOptions: { value: ProjectStatus; label: string }[] = [
    { value: 'draft', label: t('company.projectForm.statusDraft') },
    { value: 'published', label: t('company.projectForm.statusPublished') },
    { value: 'closed', label: t('company.projectForm.statusClosed') },
    { value: 'archived', label: t('company.projectForm.statusArchived') },
  ]

  const workModeOptions: { value: WorkMode; label: string }[] = [
    { value: 'onsite', label: t('company.projectForm.workModeOnsite') },
    { value: 'hybrid', label: t('company.projectForm.workModeHybrid') },
    { value: 'remote', label: t('company.projectForm.workModeRemote') },
  ]

  const languageOptions: { value: PreferredLanguage; label: string }[] = [
    { value: 'fi', label: t('company.projectForm.languageFi') },
    { value: 'en', label: t('company.projectForm.languageEn') },
  ]

  const weightLabels: Record<keyof ProjectWeights, string> = {
    studyCredits: t('company.projectForm.weightStudyCredits'),
    requiredCourses: t('company.projectForm.weightRequiredCourses'),
    recommendedCourses: t('company.projectForm.weightRecommendedCourses'),
    skills: t('company.projectForm.weightSkills'),
    language: t('company.projectForm.weightLanguage'),
    availability: t('company.projectForm.weightAvailability'),
    interests: t('company.projectForm.weightInterests'),
    degreeProgramme: t('company.projectForm.weightDegreeProgramme'),
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {serverError && <Alert variant="error">{serverError}</Alert>}
      {catalogError && <Alert variant="warning">{catalogError}</Alert>}

      <FormSection
        title={t('company.projectForm.sectionBasics')}
        description={t('company.projectForm.sectionBasicsDescription')}
      >
        <Input
          label={t('company.projectForm.titleLabel')}
          required
          value={values.title}
          onChange={(e) => setField('title', e.target.value)}
          error={fieldErrors.title}
        />
        <Textarea
          label={t('company.projectForm.descriptionLabel')}
          value={values.description}
          onChange={(e) => setField('description', e.target.value)}
          rows={5}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label={t('company.projectForm.projectTypeLabel')}
            value={values.projectType}
            onChange={(e) =>
              setField('projectType', e.target.value as ProjectType)
            }
            options={projectTypeOptions}
          />
          <Select
            label={t('company.projectForm.statusLabel')}
            value={values.status}
            onChange={(e) =>
              setField('status', e.target.value as ProjectStatus)
            }
            options={statusOptions}
            helperText={t('company.projectForm.statusHelper')}
          />
        </div>
        <Input
          label={t('company.projectForm.positionsLabel')}
          type="number"
          min={1}
          step={1}
          required
          value={values.positions ?? 1}
          onChange={(e) => setField('positions', Number(e.target.value))}
          error={fieldErrors.positions}
        />
      </FormSection>

      <FormSection
        title={t('company.projectForm.sectionSchedule')}
        description={t('company.projectForm.sectionScheduleDescription')}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('company.projectForm.applicationStartLabel')}
            type="date"
            value={values.applicationStart ?? ''}
            onChange={(e) =>
              setField('applicationStart', e.target.value || null)
            }
          />
          <Input
            label={t('company.projectForm.applicationDeadlineLabel')}
            type="date"
            value={values.applicationDeadline ?? ''}
            onChange={(e) =>
              setField('applicationDeadline', e.target.value || null)
            }
          />
          <Input
            label={t('company.projectForm.projectStartLabel')}
            type="date"
            value={values.projectStart ?? ''}
            onChange={(e) => setField('projectStart', e.target.value || null)}
          />
          <Input
            label={t('company.projectForm.projectEndLabel')}
            type="date"
            value={values.projectEnd ?? ''}
            onChange={(e) => setField('projectEnd', e.target.value || null)}
          />
        </div>
      </FormSection>

      <FormSection
        title={t('company.projectForm.sectionLogistics')}
        description={t('company.projectForm.sectionLogisticsDescription')}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label={t('company.projectForm.workModeLabel')}
            value={values.workMode}
            onChange={(e) => setField('workMode', e.target.value as WorkMode)}
            options={workModeOptions}
          />
          <Input
            label={t('company.projectForm.locationLabel')}
            value={values.location ?? ''}
            onChange={(e) => setField('location', e.target.value)}
          />
          <Input
            label={t('company.projectForm.minimumStudyCreditsLabel')}
            type="number"
            min={0}
            step={1}
            value={values.minimumStudyCredits ?? 0}
            onChange={(e) =>
              setField('minimumStudyCredits', Number(e.target.value))
            }
            error={fieldErrors.minimumStudyCredits}
          />
          <Select
            label={t('company.projectForm.requiredLanguageLabel')}
            value={values.requiredLanguage}
            onChange={(e) =>
              setField('requiredLanguage', e.target.value as PreferredLanguage)
            }
            options={languageOptions}
          />
          <Input
            label={t('company.projectForm.departmentLabel')}
            value={values.department ?? ''}
            onChange={(e) => setField('department', e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={values.remoteAllowed ?? true}
            onChange={(e) => setField('remoteAllowed', e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          {t('company.projectForm.remoteAllowedLabel')}
        </label>
      </FormSection>

      <FormSection
        title={t('company.projectForm.sectionRequirements')}
        description={t('company.projectForm.sectionRequirementsDescription')}
      >
        {catalogLoading ? (
          <p className="text-sm text-foreground-muted">
            {t('company.projectForm.catalogLoading')}
          </p>
        ) : (
          <>
            <MultiSelectField
              label={t('company.projectForm.requiredCoursesLabel')}
              options={courseOptions}
              selectedIds={values.requiredCourseIds ?? []}
              onChange={(ids) => setField('requiredCourseIds', ids)}
              searchLabel={t('company.projectForm.searchCoursesLabel')}
              searchPlaceholder={t('company.projectForm.searchPlaceholder')}
              noResultsLabel={t('company.projectForm.noResults')}
            />
            <MultiSelectField
              label={t('company.projectForm.recommendedCoursesLabel')}
              options={courseOptions}
              selectedIds={values.recommendedCourseIds ?? []}
              onChange={(ids) => setField('recommendedCourseIds', ids)}
              searchLabel={t('company.projectForm.searchCoursesLabel')}
              searchPlaceholder={t('company.projectForm.searchPlaceholder')}
              noResultsLabel={t('company.projectForm.noResults')}
            />
            <MultiSelectField
              label={t('company.projectForm.requiredSkillsLabel')}
              options={skillOptions}
              selectedIds={values.requiredSkillIds ?? []}
              onChange={(ids) => setField('requiredSkillIds', ids)}
              searchLabel={t('company.projectForm.searchSkillsLabel')}
              searchPlaceholder={t('company.projectForm.searchPlaceholder')}
              noResultsLabel={t('company.projectForm.noResults')}
            />
            <MultiSelectField
              label={t('company.projectForm.recommendedSkillsLabel')}
              options={skillOptions}
              selectedIds={values.recommendedSkillIds ?? []}
              onChange={(ids) => setField('recommendedSkillIds', ids)}
              searchLabel={t('company.projectForm.searchSkillsLabel')}
              searchPlaceholder={t('company.projectForm.searchPlaceholder')}
              noResultsLabel={t('company.projectForm.noResults')}
            />
            <MultiSelectField
              label={t('company.projectForm.interestsLabel')}
              options={interestOptions}
              selectedIds={values.interestIds ?? []}
              onChange={(ids) => setField('interestIds', ids)}
              searchLabel={t('company.projectForm.searchInterestsLabel')}
              searchPlaceholder={t('company.projectForm.searchPlaceholder')}
              noResultsLabel={t('company.projectForm.noResults')}
            />
          </>
        )}
      </FormSection>

      <FormSection
        title={t('company.projectForm.sectionWeights')}
        description={t('company.projectForm.weightsDescription')}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {WEIGHT_KEYS.map((key) => (
            <Input
              key={key}
              label={weightLabels[key]}
              type="number"
              min={0}
              max={100}
              step={1}
              value={(values.weights ?? DEFAULT_PROJECT_WEIGHTS)[key]}
              onChange={(e) => setWeight(key, e.target.value)}
            />
          ))}
        </div>
        <Alert variant={weightsValid ? 'success' : 'warning'}>
          {t('company.projectForm.weightSum', { sum: weightSum })}
        </Alert>
        {fieldErrors.weights && (
          <p className="text-sm text-error" role="alert">
            {fieldErrors.weights}
          </p>
        )}
      </FormSection>

      <div className="flex justify-end gap-3 border-t border-border pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          {t('company.projectForm.cancel')}
        </Button>
        <Button type="submit" isLoading={submitting} disabled={!weightsValid}>
          {submitting
            ? t('company.projectForm.saving')
            : mode === 'create'
              ? t('company.projectForm.createSubmit')
              : t('company.projectForm.updateSubmit')}
        </Button>
      </div>
    </form>
  )
}
