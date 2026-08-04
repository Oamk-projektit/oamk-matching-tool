'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Alert,
  Button,
  Card,
  FormSection,
  Input,
  LoadingState,
  Tag,
} from '@/components/ui'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useStudentOnlyGuard } from '@/lib/auth/useStudentOnlyGuard'
import { useTranslations } from '@/lib/i18n'
import { api, ApiClientError } from '@/lib/api/client'
import { localizedName } from '@/lib/format'
import type { StudentDetail } from '@/types/api'
import type { Course, Interest, ProjectType, Skill } from '@/types/domain'

interface FormState {
  degreeProgramme: string
  department: string
  studyCredits: string
  availabilityStart: string
  availabilityEnd: string
  preferredProjectTypes: ProjectType[]
}

const EMPTY_FORM: FormState = {
  degreeProgramme: '',
  department: '',
  studyCredits: '',
  availabilityStart: '',
  availabilityEnd: '',
  preferredProjectTypes: [],
}

function studentToForm(student: StudentDetail): FormState {
  return {
    degreeProgramme: student.degreeProgramme ?? '',
    department: student.department ?? '',
    studyCredits: String(student.studyCredits ?? 0),
    availabilityStart: student.availabilityStart ?? '',
    availabilityEnd: student.availabilityEnd ?? '',
    preferredProjectTypes: student.preferredProjectTypes,
  }
}

const PROJECT_TYPE_OPTIONS: ProjectType[] = ['company_project', 'internship']

export default function EditProfilePage() {
  useStudentOnlyGuard()
  const { t, locale } = useTranslations()
  const { studentId, loading: authLoading, refreshMe } = useAuth()

  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [interests, setInterests] = useState<Interest[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<{ studyCredits?: string }>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [courseQuery, setCourseQuery] = useState('')
  const [courseResults, setCourseResults] = useState<Course[]>([])
  const [courseSearching, setCourseSearching] = useState(false)
  const [courseActionError, setCourseActionError] = useState<string | null>(null)
  const [pendingCourseId, setPendingCourseId] = useState<string | null>(null)

  const [skillQuery, setSkillQuery] = useState('')
  const [skillActionError, setSkillActionError] = useState<string | null>(null)
  const [skillBusy, setSkillBusy] = useState(false)

  const [interestQuery, setInterestQuery] = useState('')
  const [interestActionError, setInterestActionError] = useState<string | null>(null)
  const [interestBusy, setInterestBusy] = useState(false)

  async function loadAll() {
    setLoading(true)
    setLoadError(null)
    try {
      const [courseList, skillList, interestList, studentDetail] = await Promise.all([
        api.listCourses(),
        api.listSkills(),
        api.listInterests(),
        studentId ? api.getStudent(studentId) : Promise.resolve(null),
      ])
      setCourses(courseList)
      setSkills(skillList)
      setInterests(interestList)
      setStudent(studentDetail)
      setForm(studentDetail ? studentToForm(studentDetail) : EMPTY_FORM)
    } catch (err) {
      setLoadError(err instanceof ApiClientError ? err.message : t('profile.errorMessage'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
     
    void loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, studentId])

  // Debounced course search.
  useEffect(() => {
    if (!studentId) return
    const query = courseQuery.trim()
    if (query.length < 2) {
       
      setCourseResults([])
      return
    }
    setCourseSearching(true)
    const handle = window.setTimeout(async () => {
      try {
        const results = await api.listCourses({ search: query })
        setCourseResults(results)
      } catch {
        setCourseResults([])
      } finally {
        setCourseSearching(false)
      }
    }, 300)
    return () => window.clearTimeout(handle)
  }, [courseQuery, studentId])

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses])
  const skillMap = useMemo(() => new Map(skills.map((s) => [s.id, s])), [skills])
  const interestMap = useMemo(() => new Map(interests.map((i) => [i.id, i])), [interests])

  const addedCourseIds = new Set(student?.courseIds ?? [])
  const filteredCourseResults = courseResults.filter((c) => !addedCourseIds.has(c.id))

  const skillMatches = useMemo(() => {
    const query = skillQuery.trim().toLowerCase()
    if (!query) return []
    const added = new Set(student?.skillIds ?? [])
    return skills
      .filter((s) => !added.has(s.id) && localizedName(s, locale).toLowerCase().includes(query))
      .slice(0, 8)
  }, [skillQuery, skills, student?.skillIds, locale])

  const skillExactMatch = skills.some(
    (s) => localizedName(s, locale).toLowerCase() === skillQuery.trim().toLowerCase()
  )

  const interestMatches = useMemo(() => {
    const query = interestQuery.trim().toLowerCase()
    if (!query) return []
    const added = new Set(student?.interestIds ?? [])
    return interests
      .filter((i) => !added.has(i.id) && localizedName(i, locale).toLowerCase().includes(query))
      .slice(0, 8)
  }, [interestQuery, interests, student?.interestIds, locale])

  const interestExactMatch = interests.some(
    (i) => localizedName(i, locale).toLowerCase() === interestQuery.trim().toLowerCase()
  )

  function togglePreferredType(type: ProjectType) {
    setForm((prev) => ({
      ...prev,
      preferredProjectTypes: prev.preferredProjectTypes.includes(type)
        ? prev.preferredProjectTypes.filter((t2) => t2 !== type)
        : [...prev.preferredProjectTypes, type],
    }))
  }

  function validate(): boolean {
    const errors: { studyCredits?: string } = {}
    const credits = Number(form.studyCredits)
    if (form.studyCredits !== '' && (!Number.isFinite(credits) || credits < 0)) {
      errors.studyCredits = t('profile.validation.studyCreditsInvalid')
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError(null)
    setSaveSuccess(null)
    if (!validate()) return

    const payload = {
      degreeProgramme: form.degreeProgramme.trim() || null,
      department: form.department.trim() || null,
      studyCredits: form.studyCredits === '' ? 0 : Number(form.studyCredits),
      availabilityStart: form.availabilityStart || null,
      availabilityEnd: form.availabilityEnd || null,
      preferredProjectTypes: form.preferredProjectTypes,
    }

    setSaving(true)
    try {
      if (!studentId) {
        await api.createStudent(payload)
        await refreshMe()
        setSaveSuccess(t('profile.createSuccess'))
        await loadAll()
      } else {
        const updated = await api.updateStudent(studentId, payload)
        setStudent(updated)
        setSaveSuccess(t('profile.saveSuccess'))
      }
    } catch (err) {
      setSaveError(
        err instanceof ApiClientError
          ? err.message
          : studentId
            ? t('profile.saveError')
            : t('profile.createError')
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleAddCourse(courseId: string) {
    if (!studentId) return
    setCourseActionError(null)
    setPendingCourseId(courseId)
    try {
      await api.addStudentCourse(studentId, { courseId })
      const updated = await api.getStudent(studentId)
      setStudent(updated)
      setCourseQuery('')
      setCourseResults([])
    } catch (err) {
      setCourseActionError(
        err instanceof ApiClientError ? err.message : t('profile.addCourseError')
      )
    } finally {
      setPendingCourseId(null)
    }
  }

  async function handleRemoveCourse(courseId: string) {
    if (!studentId) return
    setCourseActionError(null)
    try {
      await api.removeStudentCourse(studentId, courseId)
      const updated = await api.getStudent(studentId)
      setStudent(updated)
    } catch (err) {
      setCourseActionError(
        err instanceof ApiClientError ? err.message : t('profile.removeCourseError')
      )
    }
  }

  async function handleAddSkill(opts: { skillId?: string; name?: string }) {
    if (!studentId) return
    setSkillActionError(null)
    setSkillBusy(true)
    try {
      await api.addStudentSkill(studentId, opts)
      const [updated, skillList] = await Promise.all([
        api.getStudent(studentId),
        api.listSkills(),
      ])
      setStudent(updated)
      setSkills(skillList)
      setSkillQuery('')
    } catch (err) {
      setSkillActionError(
        err instanceof ApiClientError ? err.message : t('profile.addSkillError')
      )
    } finally {
      setSkillBusy(false)
    }
  }

  async function handleRemoveSkill(skillId: string) {
    if (!studentId) return
    setSkillActionError(null)
    try {
      await api.removeStudentSkill(studentId, skillId)
      const updated = await api.getStudent(studentId)
      setStudent(updated)
    } catch (err) {
      setSkillActionError(
        err instanceof ApiClientError ? err.message : t('profile.removeSkillError')
      )
    }
  }

  async function handleAddInterest(opts: { interestId?: string; name?: string }) {
    if (!studentId) return
    setInterestActionError(null)
    setInterestBusy(true)
    try {
      await api.addStudentInterest(studentId, opts)
      const [updated, interestList] = await Promise.all([
        api.getStudent(studentId),
        api.listInterests(),
      ])
      setStudent(updated)
      setInterests(interestList)
      setInterestQuery('')
    } catch (err) {
      setInterestActionError(
        err instanceof ApiClientError ? err.message : t('profile.addInterestError')
      )
    } finally {
      setInterestBusy(false)
    }
  }

  async function handleRemoveInterest(interestId: string) {
    if (!studentId) return
    setInterestActionError(null)
    try {
      await api.removeStudentInterest(studentId, interestId)
      const updated = await api.getStudent(studentId)
      setStudent(updated)
    } catch (err) {
      setInterestActionError(
        err instanceof ApiClientError ? err.message : t('profile.removeInterestError')
      )
    }
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <LoadingState message={t('profile.loadingMessage')} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">{t('profile.editTitle')}</h1>
        {studentId && (
          <Link href="/profile" className="text-sm font-semibold text-primary hover:underline">
            {t('profile.backToProfile')}
          </Link>
        )}
      </div>

      {loadError && (
        <Alert variant="error" className="mb-4">
          {loadError}
        </Alert>
      )}
      {saveError && (
        <Alert variant="error" className="mb-4">
          {saveError}
        </Alert>
      )}
      {saveSuccess && (
        <Alert variant="success" className="mb-4">
          {saveSuccess}
        </Alert>
      )}

      <Card>
        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          <FormSection
            title={t('profile.sections.basicInfo')}
            description={t('profile.sections.basicInfoDescription')}
          >
            <Input
              label={t('profile.fields.degreeProgramme')}
              value={form.degreeProgramme}
              onChange={(e) => setForm((p) => ({ ...p, degreeProgramme: e.target.value }))}
            />
            <Input
              label={t('profile.fields.department')}
              value={form.department}
              onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
            />
            <Input
              label={t('profile.fields.studyCredits')}
              type="number"
              min={0}
              value={form.studyCredits}
              onChange={(e) => setForm((p) => ({ ...p, studyCredits: e.target.value }))}
              error={fieldErrors.studyCredits}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('profile.fields.availabilityStart')}
                type="date"
                value={form.availabilityStart}
                onChange={(e) => setForm((p) => ({ ...p, availabilityStart: e.target.value }))}
              />
              <Input
                label={t('profile.fields.availabilityEnd')}
                type="date"
                value={form.availabilityEnd}
                onChange={(e) => setForm((p) => ({ ...p, availabilityEnd: e.target.value }))}
              />
            </div>
            <div>
              <p className="mb-1.5 block text-sm font-medium text-foreground">
                {t('profile.fields.preferredProjectTypes')}
              </p>
              <div className="flex flex-wrap gap-4">
                {PROJECT_TYPE_OPTIONS.map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={form.preferredProjectTypes.includes(type)}
                      onChange={() => togglePreferredType(type)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    {t(`profile.projectTypes.${type}`)}
                  </label>
                ))}
              </div>
            </div>
          </FormSection>

          <Button type="submit" isLoading={saving}>
            {studentId
              ? saving
                ? t('common.saving')
                : t('profile.saveButton')
              : saving
                ? t('common.saving')
                : t('profile.createButton')}
          </Button>
        </form>
      </Card>

      {!studentId && (
        <Alert variant="info" className="mt-6">
          {t('profile.courses.createFirstHint')}
        </Alert>
      )}

      {studentId && student && (
        <>
          <Card className="mt-6">
            <FormSection
              title={t('profile.sections.courses')}
              description={t('profile.sections.coursesDescription')}
            >
              {courseActionError && <Alert variant="error">{courseActionError}</Alert>}
              <div className="flex flex-wrap gap-2">
                {student.courseIds.length === 0 && (
                  <p className="text-sm text-foreground-muted">{t('profile.courses.empty')}</p>
                )}
                {student.courseIds.map((id) => {
                  const course = courseMap.get(id)
                  return (
                    <span key={id} className="inline-flex items-center gap-1">
                      <Tag>{course ? `${course.code} · ${localizedName(course, locale)}` : id}</Tag>
                      <button
                        type="button"
                        onClick={() => handleRemoveCourse(id)}
                        aria-label={t('common.remove')}
                        className="text-xs text-foreground-muted hover:text-error"
                      >
                        ✕
                      </button>
                    </span>
                  )
                })}
              </div>
              <div className="relative">
                <Input
                  label={t('profile.courses.searchLabel')}
                  placeholder={t('profile.courses.searchPlaceholder')}
                  value={courseQuery}
                  onChange={(e) => setCourseQuery(e.target.value)}
                />
                {courseQuery.trim().length >= 2 && (
                  <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-border bg-surface">
                    {courseSearching && (
                      <p className="p-3 text-sm text-foreground-muted">{t('common.loading')}</p>
                    )}
                    {!courseSearching && filteredCourseResults.length === 0 && (
                      <p className="p-3 text-sm text-foreground-muted">{t('profile.courses.noResults')}</p>
                    )}
                    {!courseSearching &&
                      filteredCourseResults.map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center justify-between gap-3 border-b border-border-soft px-3 py-2 last:border-b-0"
                        >
                          <span className="text-sm text-foreground">
                            {course.code} · {localizedName(course, locale)}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            isLoading={pendingCourseId === course.id}
                            onClick={() => handleAddCourse(course.id)}
                          >
                            {t('common.add')}
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </FormSection>
          </Card>

          <Card className="mt-6">
            <FormSection
              title={t('profile.sections.skills')}
              description={t('profile.sections.skillsDescription')}
            >
              {skillActionError && <Alert variant="error">{skillActionError}</Alert>}
              <div className="flex flex-wrap gap-2">
                {student.skillIds.length === 0 && (
                  <p className="text-sm text-foreground-muted">{t('profile.skills.empty')}</p>
                )}
                {student.skillIds.map((id) => {
                  const skill = skillMap.get(id)
                  return (
                    <span key={id} className="inline-flex items-center gap-1">
                      <Tag variant="primary">{skill ? localizedName(skill, locale) : id}</Tag>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(id)}
                        aria-label={t('common.remove')}
                        className="text-xs text-foreground-muted hover:text-error"
                      >
                        ✕
                      </button>
                    </span>
                  )
                })}
              </div>
              <div className="relative">
                <Input
                  label={t('profile.skills.addLabel')}
                  placeholder={t('profile.skills.addPlaceholder')}
                  value={skillQuery}
                  onChange={(e) => setSkillQuery(e.target.value)}
                />
                {skillQuery.trim().length > 0 && (
                  <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-border bg-surface">
                    {skillMatches.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between gap-3 border-b border-border-soft px-3 py-2 last:border-b-0"
                      >
                        <span className="text-sm text-foreground">{localizedName(skill, locale)}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          isLoading={skillBusy}
                          onClick={() => handleAddSkill({ skillId: skill.id })}
                        >
                          {t('common.add')}
                        </Button>
                      </div>
                    ))}
                    {!skillExactMatch && (
                      <div className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="text-sm text-foreground">
                          &ldquo;{skillQuery.trim()}&rdquo;
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          isLoading={skillBusy}
                          onClick={() => handleAddSkill({ name: skillQuery.trim() })}
                        >
                          {t('profile.skills.addButton')}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </FormSection>
          </Card>

          <Card className="mt-6">
            <FormSection
              title={t('profile.sections.interests')}
              description={t('profile.sections.interestsDescription')}
            >
              {interestActionError && <Alert variant="error">{interestActionError}</Alert>}
              <div className="flex flex-wrap gap-2">
                {student.interestIds.length === 0 && (
                  <p className="text-sm text-foreground-muted">{t('profile.interests.empty')}</p>
                )}
                {student.interestIds.map((id) => {
                  const interest = interestMap.get(id)
                  return (
                    <span key={id} className="inline-flex items-center gap-1">
                      <Tag>{interest ? localizedName(interest, locale) : id}</Tag>
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(id)}
                        aria-label={t('common.remove')}
                        className="text-xs text-foreground-muted hover:text-error"
                      >
                        ✕
                      </button>
                    </span>
                  )
                })}
              </div>
              <div className="relative">
                <Input
                  label={t('profile.interests.addLabel')}
                  placeholder={t('profile.interests.addPlaceholder')}
                  value={interestQuery}
                  onChange={(e) => setInterestQuery(e.target.value)}
                />
                {interestQuery.trim().length > 0 && (
                  <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-border bg-surface">
                    {interestMatches.map((interest) => (
                      <div
                        key={interest.id}
                        className="flex items-center justify-between gap-3 border-b border-border-soft px-3 py-2 last:border-b-0"
                      >
                        <span className="text-sm text-foreground">{localizedName(interest, locale)}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          isLoading={interestBusy}
                          onClick={() => handleAddInterest({ interestId: interest.id })}
                        >
                          {t('common.add')}
                        </Button>
                      </div>
                    ))}
                    {!interestExactMatch && (
                      <div className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="text-sm text-foreground">
                          &ldquo;{interestQuery.trim()}&rdquo;
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          isLoading={interestBusy}
                          onClick={() => handleAddInterest({ name: interestQuery.trim() })}
                        >
                          {t('profile.interests.addButton')}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </FormSection>
          </Card>
        </>
      )}
    </div>
  )
}
