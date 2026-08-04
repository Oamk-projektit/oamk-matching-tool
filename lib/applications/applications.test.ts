import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ValidationError } from '@/lib/validation'
import { ApiHttpError } from '@/lib/api/auth'
import {
  APPLICATION_AUDIT_ACTIONS,
  assertApplicationIsActive,
  assertApplicationWindow,
  assertCanSubmitApplication,
  assertCompanyStatusTransition,
  parseCreateApplication,
} from '@/lib/applications/parse'
import {
  assertCanViewApplicants,
  createApplication,
  withdrawApplication,
} from '@/lib/applications/service'
import { getProjectDetailById } from '@/lib/projects/service'

vi.mock('@/lib/projects/service', () => ({
  getProjectDetailById: vi.fn(),
}))

const getProjectDetailByIdMock = vi.mocked(getProjectDetailById)

const PROJECT_ID = '66666666-6666-4666-8666-666666666666'
const STUDENT_ID = '77777777-7777-4777-8777-777777777777'
const APP_ID = '88888888-8888-4888-8888-888888888888'
const PROFILE_ID = '99999999-9999-4999-8999-999999999999'

function publishedProject(
  overrides: Partial<{
    status: 'draft' | 'published' | 'closed' | 'archived'
    applicationStart: string | null
    applicationDeadline: string | null
  }> = {}
) {
  return {
    id: PROJECT_ID,
    companyId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    title: 'Campus portal',
    description: 'Rebuild UI',
    projectType: 'company_project' as const,
    status: 'published' as const,
    positions: 2,
    applicationStart: '2026-01-01',
    applicationDeadline: '2026-12-31',
    projectStart: null,
    projectEnd: null,
    workMode: 'hybrid' as const,
    location: null,
    remoteAllowed: true,
    minimumStudyCredits: 0,
    requiredLanguage: 'fi' as const,
    department: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    weights: {
      studyCredits: 10,
      requiredCourses: 20,
      recommendedCourses: 10,
      skills: 25,
      language: 10,
      availability: 10,
      interests: 10,
      degreeProgramme: 5,
    },
    requiredCourseIds: [],
    recommendedCourseIds: [],
    requiredSkillIds: [],
    recommendedSkillIds: [],
    interestIds: [],
    ...overrides,
  }
}

function applicationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: APP_ID,
    project_id: PROJECT_ID,
    student_id: STUDENT_ID,
    status: 'submitted',
    message: 'Interested',
    submitted_at: '2026-06-01T10:00:00.000Z',
    updated_at: '2026-06-01T10:00:00.000Z',
    ...overrides,
  }
}

function createInsertClient(result: {
  data?: Record<string, unknown> | null
  error?: { code?: string; message: string } | null
}): SupabaseClient {
  return {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: async () => ({
            data: result.data ?? null,
            error: result.error ?? null,
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient
}

function createWithdrawClient(params: {
  existing: Record<string, unknown>
  update?: Record<string, unknown>
}): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === 'applications') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  ...params.existing,
                  projects: { company_id: 'co1', title: 'Portal' },
                  students: { profile_id: PROFILE_ID },
                },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({
                  data: params.update ?? {
                    ...params.existing,
                    status: 'withdrawn',
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      return {}
    },
  } as unknown as SupabaseClient
}

describe('application workflow', () => {
  beforeEach(() => {
    getProjectDetailByIdMock.mockReset()
  })

  it('creates a successful application for a published project in window', async () => {
    getProjectDetailByIdMock.mockResolvedValue(publishedProject())
    const row = applicationRow()
    const supabase = createInsertClient({ data: row })

    const created = await createApplication(supabase, STUDENT_ID, {
      projectId: PROJECT_ID,
      message: 'Interested',
    })

    expect(created.status).toBe('submitted')
    expect(created.projectId).toBe(PROJECT_ID)
    expect(created.studentId).toBe(STUDENT_ID)
    expect(created.message).toBe('Interested')
  })

  it('rejects duplicate application to the same project', async () => {
    getProjectDetailByIdMock.mockResolvedValue(publishedProject())
    const supabase = createInsertClient({
      error: { code: '23505', message: 'duplicate key' },
    })

    try {
      await createApplication(supabase, STUDENT_ID, { projectId: PROJECT_ID })
      expect.unreachable('should reject duplicate')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiHttpError)
      expect((error as ApiHttpError).status).toBe(409)
      expect((error as ApiHttpError).code).toBe('CONFLICT')
    }
  })

  it('blocks apply to unpublished project', () => {
    expect(() =>
      assertApplicationWindow({
        status: 'draft',
        applicationStart: null,
        applicationDeadline: null,
      })
    ).toThrow(ApiHttpError)

    expect(() =>
      assertApplicationWindow({
        status: 'closed',
        applicationStart: '2026-01-01',
        applicationDeadline: '2026-12-31',
      })
    ).toThrow(ApiHttpError)
  })

  it('blocks apply outside the application window', () => {
    const published = {
      status: 'published' as const,
      applicationStart: '2026-01-01',
      applicationDeadline: '2026-12-31',
    }

    expect(() =>
      assertApplicationWindow(published, new Date('2025-06-01T12:00:00.000Z'))
    ).toThrow(ApiHttpError)

    expect(() =>
      assertApplicationWindow(published, new Date('2027-01-01T12:00:00.000Z'))
    ).toThrow(ApiHttpError)

    expect(() =>
      assertApplicationWindow(published, new Date('2026-06-01T12:00:00.000Z'))
    ).not.toThrow()
  })

  it('blocks applying on behalf of another student', () => {
    expect(() => assertCanSubmitApplication('company')).toThrow(ApiHttpError)
    expect(() => assertCanSubmitApplication('teacher')).toThrow(ApiHttpError)
    expect(() => assertCanSubmitApplication('admin')).toThrow(ApiHttpError)
    expect(() => assertCanSubmitApplication('student')).not.toThrow()

    expect(() =>
      parseCreateApplication({
        projectId: PROJECT_ID,
        studentId: '11111111-1111-4111-8111-111111111111',
        message: 'spoof',
      })
    ).toThrow(ValidationError)

    const parsed = parseCreateApplication({
      projectId: PROJECT_ID,
      message: 'ok',
    })
    expect(parsed).toEqual({ projectId: PROJECT_ID, message: 'ok' })
    expect('studentId' in parsed).toBe(false)
  })

  it('allows the applying student to withdraw an active application', async () => {
    const supabase = createWithdrawClient({
      existing: applicationRow(),
      update: applicationRow({ status: 'withdrawn' }),
    })

    const withdrawn = await withdrawApplication(supabase, APP_ID, {
      profileId: PROFILE_ID,
      role: 'student',
    })

    expect(withdrawn.status).toBe('withdrawn')
  })

  it('blocks another company from reading applicants', () => {
    expect(() =>
      assertCanViewApplicants({
        role: 'company',
        projectCompanyId: 'company-a',
        callerCompanyId: 'company-b',
      })
    ).toThrow(ApiHttpError)

    expect(() =>
      assertCanViewApplicants({
        role: 'company',
        projectCompanyId: 'company-a',
        callerCompanyId: 'company-a',
      })
    ).not.toThrow()

    expect(() =>
      assertCanViewApplicants({
        role: 'teacher',
        projectCompanyId: 'company-a',
        callerCompanyId: null,
      })
    ).not.toThrow()
  })

  it('blocks processing a withdrawn application toward selection', () => {
    expect(() =>
      assertApplicationIsActive('withdrawn', 'process')
    ).toThrow(ApiHttpError)

    try {
      assertApplicationIsActive('withdrawn', 'process')
    } catch (error) {
      expect((error as ApiHttpError).message).toMatch(/withdrawn/i)
    }

    expect(() => assertCompanyStatusTransition('selected')).toThrow(ApiHttpError)
  })

  it('emits the expected application audit action names', () => {
    expect(APPLICATION_AUDIT_ACTIONS).toEqual([
      'application_created',
      'application_status_changed',
      'application_withdrawn',
      'application_shortlisted',
      'application_unshortlisted',
    ])
  })
})
