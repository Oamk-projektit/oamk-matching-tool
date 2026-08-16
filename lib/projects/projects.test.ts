import { describe, expect, it } from 'vitest'
import { ValidationError } from '@/lib/validation'
import { normalizeProjectWeights } from '@/lib/validation/domain'
import { parseCreateProject, parseUpdateProject } from '@/lib/projects/parse'
import {
  assertCanCreateProject,
  assertCanManageProject,
  canViewProject,
} from '@/lib/projects/service'
import { ApiHttpError } from '@/lib/api/auth'
import {
  DEFAULT_PROJECT_WEIGHTS,
  PROJECT_WEIGHT_TOTAL,
  isValidProjectWeights,
  sumProjectWeights,
} from '@/types/domain'

describe('project create', () => {
  it('creates a company_project with defaults and weights summing to 100', () => {
    const parsed = parseCreateProject({
      title: 'Campus portal',
      description: 'Rebuild UI',
      projectType: 'company_project',
      minimumStudyCredits: 60,
      requiredLanguage: 'fi',
      department: 'Informaatioteknologia',
      workMode: 'hybrid',
      remoteAllowed: true,
      positions: 2,
    })

    expect(parsed.title).toBe('Campus portal')
    expect(parsed.projectType).toBe('company_project')
    expect(parsed.status).toBe('draft')
    expect(parsed.positions).toBe(2)
    expect(parsed.weights).toEqual(DEFAULT_PROJECT_WEIGHTS)
    expect(sumProjectWeights(parsed.weights!)).toBe(PROJECT_WEIGHT_TOTAL)
    expect(isValidProjectWeights(DEFAULT_PROJECT_WEIGHTS)).toBe(true)
  })

  it('allows internship project type', () => {
    const parsed = parseCreateProject({
      title: 'Summer internship',
      description: 'Backend duties',
      projectType: 'internship',
    })
    expect(parsed.projectType).toBe('internship')
  })

  it('allows only company (or admin) to create', () => {
    expect(() => assertCanCreateProject('company')).not.toThrow()
    expect(() => assertCanCreateProject('admin')).not.toThrow()
    expect(() => assertCanCreateProject('student')).toThrow(ApiHttpError)
    expect(() => assertCanCreateProject('teacher')).toThrow(ApiHttpError)
  })
})

describe('project draft and publish', () => {
  it('defaults new projects to draft', () => {
    const parsed = parseCreateProject({
      title: 'Draft only',
      description: '',
      projectType: 'company_project',
    })
    expect(parsed.status).toBe('draft')
  })

  it('accepts explicit draft status', () => {
    const parsed = parseCreateProject({
      title: 'Explicit draft',
      description: '',
      projectType: 'company_project',
      status: 'draft',
    })
    expect(parsed.status).toBe('draft')
  })

  it('publishes via update status', () => {
    const parsed = parseUpdateProject({ status: 'published' })
    expect(parsed.status).toBe('published')
    expect(parsed.title).toBeUndefined()
  })
})

describe('project permissions', () => {
  it('blocks editing another company project', () => {
    expect(() =>
      assertCanManageProject({
        role: 'company',
        projectCompanyId: 'c1',
        callerCompanyId: 'c2',
      })
    ).toThrow(ApiHttpError)

    try {
      assertCanManageProject({
        role: 'company',
        projectCompanyId: 'c1',
        callerCompanyId: 'c2',
      })
    } catch (error) {
      expect(error).toBeInstanceOf(ApiHttpError)
      expect((error as ApiHttpError).status).toBe(403)
    }
  })

  it('allows owning company to manage', () => {
    expect(() =>
      assertCanManageProject({
        role: 'company',
        projectCompanyId: 'c1',
        callerCompanyId: 'c1',
      })
    ).not.toThrow()
  })

  it('allows teacher and admin to view drafts but not manage as company', () => {
    expect(
      canViewProject({
        role: 'teacher',
        projectStatus: 'draft',
        projectCompanyId: 'c1',
        callerCompanyId: null,
      })
    ).toBe(true)

    expect(() =>
      assertCanManageProject({
        role: 'teacher',
        projectCompanyId: 'c1',
        callerCompanyId: null,
      })
    ).toThrow(ApiHttpError)
  })
})

describe('project weights', () => {
  it('rejects weights that do not sum to 100', () => {
    expect(() =>
      normalizeProjectWeights({
        ...DEFAULT_PROJECT_WEIGHTS,
        skills: DEFAULT_PROJECT_WEIGHTS.skills + 1,
      })
    ).toThrow(ValidationError)
  })

  it('accepts custom weights that sum to 100', () => {
    const custom = {
      studyCredits: 30,
      requiredCourses: 25,
      recommendedCourses: 0,
      skills: 20,
      language: 10,
      availability: 10,
      interests: 5,
      degreeProgramme: 0,
    }
    expect(normalizeProjectWeights(custom)).toEqual(custom)
  })
})

describe('optional requirement arrays', () => {
  it('allows empty recommended skills', () => {
    const parsed = parseCreateProject({
      title: 'No recommended skills',
      description: '',
      projectType: 'company_project',
      recommendedSkillIds: [],
    })
    expect(parsed.recommendedSkillIds).toEqual([])
  })

  it('allows empty project interests', () => {
    const parsed = parseCreateProject({
      title: 'No interests',
      description: '',
      projectType: 'company_project',
      interestIds: [],
    })
    expect(parsed.interestIds).toEqual([])
  })

  it('allows omitting recommended skills and interests', () => {
    const parsed = parseCreateProject({
      title: 'Omitting optionals',
      description: '',
      projectType: 'company_project',
    })
    expect(parsed.recommendedSkillIds).toEqual([])
    expect(parsed.interestIds).toEqual([])
  })
})

describe('student project visibility', () => {
  it('students see only published projects', () => {
    expect(
      canViewProject({
        role: 'student',
        projectStatus: 'published',
        projectCompanyId: 'c1',
        callerCompanyId: null,
      })
    ).toBe(true)

    expect(
      canViewProject({
        role: 'student',
        projectStatus: 'draft',
        projectCompanyId: 'c1',
        callerCompanyId: null,
      })
    ).toBe(false)

    expect(
      canViewProject({
        role: 'student',
        projectStatus: 'closed',
        projectCompanyId: 'c1',
        callerCompanyId: null,
      })
    ).toBe(false)

    expect(
      canViewProject({
        role: 'student',
        projectStatus: 'archived',
        projectCompanyId: 'c1',
        callerCompanyId: null,
      })
    ).toBe(false)
  })

  it('owning company can view own drafts', () => {
    expect(
      canViewProject({
        role: 'company',
        projectStatus: 'draft',
        projectCompanyId: 'c1',
        callerCompanyId: 'c1',
      })
    ).toBe(true)

    expect(
      canViewProject({
        role: 'company',
        projectStatus: 'draft',
        projectCompanyId: 'c1',
        callerCompanyId: 'c2',
      })
    ).toBe(false)
  })
})
