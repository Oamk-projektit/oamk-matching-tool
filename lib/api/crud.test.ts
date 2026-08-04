import { describe, expect, it } from 'vitest'
import { ValidationError } from '@/lib/validation'
import { normalizeCatalogLabel, displayCatalogLabel } from '@/lib/catalogs/normalize'
import {
  parseCreateStudent,
  parseUpdateStudent,
  parseAddStudentCourse,
  parseAddStudentSkill,
} from '@/lib/students/parse'
import {
  assertCanUpdateStudent,
  assertOwnsStudentOrAdmin,
} from '@/lib/students/service'
import { parseCreateProject, parseUpdateProject } from '@/lib/projects/parse'
import {
  assertCanManageProject,
  canViewProjectDraft,
} from '@/lib/projects/service'
import {
  assertApplicationWindow,
  parseCreateApplication,
  parseUpdateApplicationStatus,
} from '@/lib/applications/parse'
import { ApiHttpError } from '@/lib/api/auth'
import { normalizeProjectWeights } from '@/lib/validation/domain'
import { DEFAULT_PROJECT_WEIGHTS } from '@/types/domain'

describe('student create / update', () => {
  it('parses student create payload', () => {
    const parsed = parseCreateStudent({
      degreeProgramme: 'Tietotekniikka',
      studyCredits: 120,
      preferredProjectTypes: ['company_project', 'internship', 'company_project'],
      courseIds: ['11111111-1111-4111-8111-111111111111'],
      skillIds: ['22222222-2222-4222-8222-222222222222'],
    })
    expect(parsed.degreeProgramme).toBe('Tietotekniikka')
    expect(parsed.studyCredits).toBe(120)
    expect(parsed.preferredProjectTypes).toEqual([
      'company_project',
      'internship',
    ])
    expect(parsed.courseIds).toHaveLength(1)
  })

  it('parses partial student update', () => {
    const parsed = parseUpdateStudent({ studyCredits: 140 })
    expect(parsed.studyCredits).toBe(140)
    expect(parsed.courseIds).toBeUndefined()
  })

  it('allows own profile update and blocks other student', () => {
    expect(() =>
      assertCanUpdateStudent({
        role: 'student',
        profileId: 'p1',
        studentProfileId: 'p1',
      })
    ).not.toThrow()

    expect(() =>
      assertCanUpdateStudent({
        role: 'student',
        profileId: 'p1',
        studentProfileId: 'p2',
      })
    ).toThrow(ApiHttpError)

    try {
      assertCanUpdateStudent({
        role: 'student',
        profileId: 'p1',
        studentProfileId: 'p2',
      })
    } catch (error) {
      expect(error).toBeInstanceOf(ApiHttpError)
      expect((error as ApiHttpError).status).toBe(403)
    }
  })
})

describe('courses', () => {
  it('parses course link with completion metadata', () => {
    const parsed = parseAddStudentCourse({
      courseId: '33333333-3333-4333-8333-333333333333',
      completionStatus: 'completed',
      grade: '5',
      verified: true,
    })
    expect(parsed.completionStatus).toBe('completed')
    expect(parsed.grade).toBe('5')
    expect(parsed.verified).toBe(true)
  })

  it('rejects duplicate course id in uuid array via student create', () => {
    const id = '33333333-3333-4333-8333-333333333333'
    const parsed = parseCreateStudent({ courseIds: [id, id] })
    expect(parsed.courseIds).toEqual([id])
  })

  it('blocks managing another student course links', () => {
    expect(() =>
      assertOwnsStudentOrAdmin({
        role: 'student',
        profileId: 'a',
        studentProfileId: 'b',
      })
    ).toThrow(ApiHttpError)
  })
})

describe('skills / interests normalization', () => {
  it('normalizes labels for uniqueness', () => {
    expect(normalizeCatalogLabel('  React   Native ')).toBe('react native')
    expect(displayCatalogLabel('  React   Native ')).toBe('React Native')
  })

  it('parses skill by name', () => {
    const parsed = parseAddStudentSkill({ name: '  TypeScript  ' })
    expect(parsed.name).toBe('TypeScript')
  })
})

describe('projects', () => {
  it('creates project with weights summing to 100', () => {
    const parsed = parseCreateProject({
      title: 'Campus portal',
      description: 'Rebuild UI',
      projectType: 'company_project',
      minimumStudyCredits: 60,
      requiredSkillIds: ['44444444-4444-4444-8444-444444444444'],
      recommendedSkillIds: ['55555555-5555-4555-8555-555555555555'],
      weights: { ...DEFAULT_PROJECT_WEIGHTS },
    })
    expect(parsed.projectType).toBe('company_project')
    expect(parsed.weights?.skills).toBe(25)
    expect(parsed.recommendedSkillIds).toHaveLength(1)
  })

  it('rejects invalid project weights', () => {
    expect(() =>
      normalizeProjectWeights({
        ...DEFAULT_PROJECT_WEIGHTS,
        skills: 50,
      })
    ).toThrow(ValidationError)
  })

  it('blocks editing another company project', () => {
    expect(() =>
      assertCanManageProject({
        role: 'company',
        projectCompanyId: 'c1',
        callerCompanyId: 'c2',
      })
    ).toThrow(ApiHttpError)

    expect(() =>
      assertCanManageProject({
        role: 'company',
        projectCompanyId: 'c1',
        callerCompanyId: 'c1',
      })
    ).not.toThrow()
  })

  it('hides draft projects from students', () => {
    expect(
      canViewProjectDraft({
        role: 'student',
        projectStatus: 'draft',
        projectCompanyId: 'c1',
        callerCompanyId: null,
      })
    ).toBe(false)

    expect(
      canViewProjectDraft({
        role: 'student',
        projectStatus: 'published',
        projectCompanyId: 'c1',
        callerCompanyId: null,
      })
    ).toBe(true)

    expect(
      canViewProjectDraft({
        role: 'student',
        projectStatus: 'closed',
        projectCompanyId: 'c1',
        callerCompanyId: null,
      })
    ).toBe(false)

    expect(
      canViewProjectDraft({
        role: 'company',
        projectStatus: 'draft',
        projectCompanyId: 'c1',
        callerCompanyId: 'c1',
      })
    ).toBe(true)
  })

  it('parses project update partial body', () => {
    const parsed = parseUpdateProject({ status: 'published', positions: 3 })
    expect(parsed.status).toBe('published')
    expect(parsed.positions).toBe(3)
  })
})

describe('applications', () => {
  const published = {
    status: 'published' as const,
    applicationStart: '2026-01-01',
    applicationDeadline: '2026-12-31',
  }

  it('parses create application', () => {
    const parsed = parseCreateApplication({
      projectId: '66666666-6666-4666-8666-666666666666',
      message: 'Interested',
    })
    expect(parsed.projectId).toBe('66666666-6666-4666-8666-666666666666')
  })

  it('allows apply within window', () => {
    expect(() =>
      assertApplicationWindow(published, new Date('2026-06-01T12:00:00.000Z'))
    ).not.toThrow()
  })

  it('blocks apply outside application window', () => {
    expect(() =>
      assertApplicationWindow(published, new Date('2025-06-01T12:00:00.000Z'))
    ).toThrow(ApiHttpError)

    expect(() =>
      assertApplicationWindow(published, new Date('2027-01-01T12:00:00.000Z'))
    ).toThrow(ApiHttpError)
  })

  it('blocks apply to non-published project', () => {
    expect(() =>
      assertApplicationWindow({
        status: 'draft',
        applicationStart: null,
        applicationDeadline: null,
      })
    ).toThrow(ApiHttpError)
  })

  it('parses company status update and withdraw status', () => {
    expect(parseUpdateApplicationStatus({ status: 'under_review' }).status).toBe(
      'under_review'
    )
    expect(parseUpdateApplicationStatus({ status: 'withdrawn' }).status).toBe(
      'withdrawn'
    )
  })
})
