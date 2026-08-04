/**
 * MVP privacy contract — consolidated assertions on the real permission/assert
 * helpers used across API routes. No mock HTTP servers: these call the actual
 * pure/async functions from lib/permissions, lib/students, lib/projects,
 * lib/selections, and lib/matching, using fake Supabase clients only where a
 * function needs one (same fake-client pattern as lib/permissions/permissions.test.ts).
 */
import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { ApiHttpError } from '@/lib/api/auth'
import { assertCanUpdateStudent, assertCanViewStudent } from '@/lib/students/service'
import {
  assertCanManageProject,
  canViewProject,
  canViewProjectDraft,
} from '@/lib/projects/service'
import { assertCanViewApplicationDecision } from '@/lib/selections/service'
import {
  assertCanAccessProjectMatches,
  canViewProjectMatchLists,
} from '@/lib/matching/load-inputs'
import { calculateMatch } from '@/lib/matching/calculate-match'
import { mapMatchRow } from '@/lib/matching/service'
import { DEFAULT_PROJECT_WEIGHTS } from '@/types/domain'
import type { MatchProjectInput, MatchStudentInput } from '@/lib/matching/types'

const STUDENT_A = '11111111-1111-4111-8111-111111111111'
const STUDENT_B = '22222222-2222-4222-8222-222222222222'
const PROJECT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const COMPANY_A = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const COMPANY_B = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'

// ---------------------------------------------------------------------------
// 1. Student A cannot update student B's profile.
// ---------------------------------------------------------------------------
describe('privacy: students cannot update each other', () => {
  it('blocks student A from updating student B via assertCanUpdateStudent', () => {
    expect(() =>
      assertCanUpdateStudent({
        role: 'student',
        profileId: STUDENT_A,
        studentProfileId: STUDENT_B,
      })
    ).toThrow(ApiHttpError)

    expect(() =>
      assertCanUpdateStudent({
        role: 'student',
        profileId: STUDENT_A,
        studentProfileId: STUDENT_A,
      })
    ).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// 2. Students cannot view Top 3 / project match lists.
// ---------------------------------------------------------------------------
describe('privacy: Top 3 candidates are never visible to students', () => {
  it('denies the student role at the pure canViewProjectMatchLists gate', () => {
    expect(canViewProjectMatchLists('student')).toBe(false)
    expect(canViewProjectMatchLists('company')).toBe(true)
    expect(canViewProjectMatchLists('teacher')).toBe(true)
    expect(canViewProjectMatchLists('admin')).toBe(true)
  })

  it('rejects a student calling assertCanAccessProjectMatches for a real project', async () => {
    const supabase = createFakeMatchClient({
      projects: { [PROJECT_A]: COMPANY_A },
      companyUsers: {},
    })

    await expect(
      assertCanAccessProjectMatches(supabase, PROJECT_A, {
        userId: STUDENT_A,
        role: 'student',
      })
    ).rejects.toThrow(ApiHttpError)
  })

  it('allows the owning company but blocks a foreign company from Top 3 access', async () => {
    const supabase = createFakeMatchClient({
      projects: { [PROJECT_A]: COMPANY_A },
      companyUsers: { 'profile-a': COMPANY_A, 'profile-b': COMPANY_B },
    })

    await expect(
      assertCanAccessProjectMatches(supabase, PROJECT_A, {
        userId: 'profile-a',
        role: 'company',
      })
    ).resolves.toEqual({ companyId: COMPANY_A })

    await expect(
      assertCanAccessProjectMatches(supabase, PROJECT_A, {
        userId: 'profile-b',
        role: 'company',
      })
    ).rejects.toThrow(ApiHttpError)
  })
})

// ---------------------------------------------------------------------------
// 3. Company A cannot manage company B's project.
// ---------------------------------------------------------------------------
describe('privacy: a company cannot manage another company project', () => {
  it('allows the owning company (or admin) and blocks a foreign company', () => {
    expect(() =>
      assertCanManageProject({
        role: 'company',
        projectCompanyId: COMPANY_A,
        callerCompanyId: COMPANY_A,
      })
    ).not.toThrow()

    expect(() =>
      assertCanManageProject({
        role: 'company',
        projectCompanyId: COMPANY_A,
        callerCompanyId: COMPANY_B,
      })
    ).toThrow(ApiHttpError)

    expect(() =>
      assertCanManageProject({
        role: 'admin',
        projectCompanyId: COMPANY_A,
        callerCompanyId: null,
      })
    ).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// 4. Draft projects are hidden from students.
// ---------------------------------------------------------------------------
describe('privacy: draft projects never leak to students', () => {
  it('hides drafts (and any non-published project) from the student role', () => {
    expect(
      canViewProjectDraft({
        role: 'student',
        projectStatus: 'draft',
        projectCompanyId: COMPANY_A,
        callerCompanyId: null,
      })
    ).toBe(false)

    expect(
      canViewProjectDraft({
        role: 'student',
        projectStatus: 'published',
        projectCompanyId: COMPANY_A,
        callerCompanyId: null,
      })
    ).toBe(true)
  })

  it('lets the owning company and staff see their own draft', () => {
    expect(
      canViewProject({
        role: 'company',
        projectStatus: 'draft',
        projectCompanyId: COMPANY_A,
        callerCompanyId: COMPANY_A,
      })
    ).toBe(true)

    expect(
      canViewProject({
        role: 'company',
        projectStatus: 'draft',
        projectCompanyId: COMPANY_A,
        callerCompanyId: COMPANY_B,
      })
    ).toBe(false)

    expect(
      canViewProject({
        role: 'teacher',
        projectStatus: 'draft',
        projectCompanyId: COMPANY_A,
        callerCompanyId: null,
      })
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 5. A student may only view their own selection decision.
// ---------------------------------------------------------------------------
describe('privacy: a student sees only their own selection decision', () => {
  it('allows the decided-on student and blocks every other student', () => {
    expect(() =>
      assertCanViewApplicationDecision({
        role: 'student',
        studentProfileId: STUDENT_A,
        callerProfileId: STUDENT_A,
        projectCompanyId: COMPANY_A,
        callerCompanyId: null,
      })
    ).not.toThrow()

    expect(() =>
      assertCanViewApplicationDecision({
        role: 'student',
        studentProfileId: STUDENT_A,
        callerProfileId: STUDENT_B,
        projectCompanyId: COMPANY_A,
        callerCompanyId: null,
      })
    ).toThrow(ApiHttpError)
  })

  it('still allows the owning company and staff to view the decision', () => {
    expect(() =>
      assertCanViewApplicationDecision({
        role: 'company',
        studentProfileId: STUDENT_A,
        callerProfileId: 'company-caller',
        projectCompanyId: COMPANY_A,
        callerCompanyId: COMPANY_A,
      })
    ).not.toThrow()

    expect(() =>
      assertCanViewApplicationDecision({
        role: 'teacher',
        studentProfileId: STUDENT_A,
        callerProfileId: 'teacher-caller',
        projectCompanyId: COMPANY_A,
        callerCompanyId: null,
      })
    ).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// 6. A company without an applicant cannot view a student.
// ---------------------------------------------------------------------------
describe('privacy: a company cannot view a student who never applied to it', () => {
  it('requires appliedToCallerProject before granting the redacted company view', () => {
    expect(
      assertCanViewStudent({
        role: 'company',
        profileId: COMPANY_A,
        studentProfileId: STUDENT_A,
        appliedToCallerProject: true,
      })
    ).toBe('company')

    expect(() =>
      assertCanViewStudent({
        role: 'company',
        profileId: COMPANY_A,
        studentProfileId: STUDENT_A,
        appliedToCallerProject: false,
      })
    ).toThrow(ApiHttpError)

    expect(() =>
      assertCanViewStudent({
        role: 'company',
        profileId: COMPANY_A,
        studentProfileId: STUDENT_A,
      })
    ).toThrow(ApiHttpError)
  })
})

// ---------------------------------------------------------------------------
// 7. The student-facing match payload never carries rank or peer fields.
// ---------------------------------------------------------------------------
describe('privacy: student match payload has no rank or peer data', () => {
  const student: MatchStudentInput = {
    id: STUDENT_A,
    studyCredits: 160,
    degreeProgramme: 'Tietotekniikka',
    department: 'ICT',
    languages: ['fi'],
    availabilityStart: '2026-09-01',
    availabilityEnd: '2026-12-15',
    courses: ['Web-ohjelmointi'],
    skills: ['React', 'TypeScript'],
    interests: ['Web development'],
  }

  const project: MatchProjectInput = {
    id: PROJECT_A,
    title: 'Campus portal renewal',
    minimumStudyCredits: 60,
    requiredLanguage: 'fi',
    minimumLanguageLevel: null,
    projectStart: '2026-09-15',
    projectEnd: '2026-12-01',
    workMode: 'hybrid',
    remoteAllowed: true,
    department: 'ICT',
    requiredCourses: ['Web-ohjelmointi'],
    recommendedCourses: [],
    requiredSkills: ['React'],
    recommendedSkills: [],
    interests: [],
    weights: DEFAULT_PROJECT_WEIGHTS,
  }

  it('never exposes rank on the raw calculated match (same pattern as calculate-match.test.ts)', () => {
    const result = calculateMatch(student, project, DEFAULT_PROJECT_WEIGHTS, 'en')
    expect(result).not.toHaveProperty('rank')
    expect('rank' in result).toBe(false)
  })

  it('never exposes rank or another student id on the mapped student-facing Match row', () => {
    const mapped = mapMatchRow({
      id: 'match-1',
      project_id: project.id,
      student_id: student.id,
      total_score: 88,
      score_breakdown: {
        studyCredits: 10,
        requiredCourses: 20,
        recommendedCourses: 10,
        skills: 25,
        language: 10,
        availability: 10,
        interests: 10,
        degreeProgramme: 5,
      },
      matched_courses: ['Web-ohjelmointi'],
      missing_required_courses: [],
      matched_skills: ['React'],
      missing_required_skills: [],
      explanation: 'Strong fit',
      weights_snapshot: DEFAULT_PROJECT_WEIGHTS,
      calculated_at: '2026-08-04T12:00:00.000Z',
    })

    expect(mapped).not.toHaveProperty('rank')
    // Top 3 items also carry `student`/`profile` fields for other applicants —
    // the student-facing Match row must never gain those either.
    expect(mapped).not.toHaveProperty('student')
    expect(mapped).not.toHaveProperty('profile')
    expect(Object.keys(mapped).sort()).toEqual(
      [
        'id',
        'projectId',
        'studentId',
        'totalScore',
        'scoreBreakdown',
        'matchedCourses',
        'missingRequiredCourses',
        'matchedSkills',
        'missingRequiredSkills',
        'explanation',
        'weightsSnapshot',
        'calculatedAt',
      ].sort()
    )
  })
})

// ---------------------------------------------------------------------------
// 8. Service role key never ships in the client bundle.
// ---------------------------------------------------------------------------
describe('privacy: service role key stays out of the client bundle', () => {
  const adminPath = path.join(process.cwd(), 'lib', 'supabase', 'admin.ts')
  const clientPath = path.join(process.cwd(), 'lib', 'supabase', 'client.ts')

  it('has both the admin (server-only) and client (browser) Supabase modules', () => {
    expect(fs.existsSync(adminPath)).toBe(true)
    expect(fs.existsSync(clientPath)).toBe(true)
  })

  it('marks the admin client as server-only and gates it behind requireSupabaseAdminEnv', () => {
    const adminSource = fs.readFileSync(adminPath, 'utf8')
    expect(adminSource).toMatch(/^\s*import\s+['"]server-only['"]/m)
    expect(adminSource).toMatch(/requireSupabaseAdminEnv/)
  })

  it('never imports the service-role env accessor from the browser client', () => {
    const clientSource = fs.readFileSync(clientPath, 'utf8')
    expect(clientSource).not.toMatch(/requireSupabaseAdminEnv/)
    expect(clientSource).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/)
    expect(clientSource).not.toMatch(/getSupabaseServiceRoleKey/)
    // The browser client must only ever request the publishable/anon key.
    expect(clientSource).toMatch(/requireSupabasePublicEnv/)
  })
})

// ---------------------------------------------------------------------------
// Test helper: minimal fake Supabase client for the two tables that
// assertCanAccessProjectMatches / loadMatchProject / getCompanyIdForProfile
// touch. Mirrors the fake-client pattern in lib/permissions/permissions.test.ts.
// ---------------------------------------------------------------------------
type QueryResult = { data: unknown; error: null }

function createFakeMatchClient(handlers: {
  projects: Record<string, string>
  companyUsers: Record<string, string>
}): SupabaseClient<Database> {
  const from = (table: string) => ({
    select: () => ({
      eq: (column: string, value: string) => ({
        maybeSingle: async (): Promise<QueryResult> => {
          if (table === 'projects' && column === 'id') {
            const companyId = handlers.projects[value]
            return {
              data: companyId
                ? {
                    id: value,
                    company_id: companyId,
                    status: 'published',
                    title: 'Fake project',
                    minimum_study_credits: 0,
                    required_language: 'fi',
                    project_start: null,
                    project_end: null,
                    work_mode: 'hybrid',
                    remote_allowed: true,
                    department: null,
                    project_weights: null,
                    project_required_courses: [],
                    project_recommended_courses: [],
                    project_required_skills: [],
                    project_recommended_skills: [],
                    project_interests: [],
                  }
                : null,
              error: null,
            }
          }
          if (table === 'company_users' && column === 'profile_id') {
            const companyId = handlers.companyUsers[value]
            return {
              data: companyId ? { company_id: companyId } : null,
              error: null,
            }
          }
          return { data: null, error: null }
        },
      }),
    }),
  })

  return { from } as unknown as SupabaseClient<Database>
}
