import { describe, expect, it } from 'vitest'
import {
  canManageProject,
  canViewProjectApplicants,
} from '@/lib/permissions/projects'
import { canManageStudent, canViewMatch } from '@/lib/permissions/students'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type QueryResult = { data: unknown; error: null }

function createFakeClient(handlers: {
  profiles?: Record<string, string>
  companyUsers?: Record<string, string>
  projects?: Record<string, string>
  students?: Record<string, string>
  matches?: Record<
    string,
    { student_id: string; project_id: string }
  >
}): SupabaseClient<Database> {
  const from = (table: string) => ({
    select: () => ({
      eq: (column: string, value: string) => ({
        maybeSingle: async (): Promise<QueryResult> => {
          if (table === 'profiles' && column === 'id') {
            const role = handlers.profiles?.[value]
            return { data: role ? { role } : null, error: null }
          }
          if (table === 'company_users' && column === 'profile_id') {
            const companyId = handlers.companyUsers?.[value]
            return {
              data: companyId ? { company_id: companyId } : null,
              error: null,
            }
          }
          if (table === 'projects' && column === 'id') {
            const companyId = handlers.projects?.[value]
            return {
              data: companyId ? { company_id: companyId } : null,
              error: null,
            }
          }
          if (table === 'students' && column === 'id') {
            const profileId = handlers.students?.[value]
            return {
              data: profileId ? { profile_id: profileId } : null,
              error: null,
            }
          }
          if (table === 'matches' && column === 'id') {
            const match = handlers.matches?.[value]
            return {
              data: match
                ? {
                    id: value,
                    student_id: match.student_id,
                    project_id: match.project_id,
                  }
                : null,
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

describe('async permission helpers', () => {
  it('allows company membership for own project and blocks other company', async () => {
    const supabase = createFakeClient({
      profiles: {
        p_company: 'company',
        p_other: 'company',
        p_student: 'student',
        p_teacher: 'teacher',
      },
      companyUsers: {
        p_company: 'co1',
        p_other: 'co2',
      },
      projects: {
        pr1: 'co1',
      },
    })

    await expect(canManageProject(supabase, 'p_company', 'pr1')).resolves.toBe(
      true
    )
    await expect(canManageProject(supabase, 'p_other', 'pr1')).resolves.toBe(
      false
    )
    await expect(canManageProject(supabase, 'p_student', 'pr1')).resolves.toBe(
      false
    )
    await expect(canManageProject(supabase, 'p_teacher', 'pr1')).resolves.toBe(
      false
    )

    await expect(
      canViewProjectApplicants(supabase, 'p_teacher', 'pr1')
    ).resolves.toBe(true)
    await expect(
      canViewProjectApplicants(supabase, 'p_student', 'pr1')
    ).resolves.toBe(false)
  })

  it('allows a student to manage only their own student row', async () => {
    const supabase = createFakeClient({
      profiles: {
        p1: 'student',
        p2: 'student',
        admin: 'admin',
      },
      students: {
        s1: 'p1',
        s2: 'p2',
      },
    })

    await expect(canManageStudent(supabase, 'p1', 's1')).resolves.toBe(true)
    await expect(canManageStudent(supabase, 'p1', 's2')).resolves.toBe(false)
    await expect(canManageStudent(supabase, 'admin', 's2')).resolves.toBe(true)
  })

  it('lets a student view only their own match', async () => {
    const supabase = createFakeClient({
      profiles: {
        p1: 'student',
        p2: 'student',
        teacher: 'teacher',
      },
      students: {
        s1: 'p1',
        s2: 'p2',
      },
      projects: {
        pr1: 'co1',
      },
      companyUsers: {},
      matches: {
        m1: { student_id: 's1', project_id: 'pr1' },
      },
    })

    await expect(canViewMatch(supabase, 'p1', 'm1')).resolves.toBe(true)
    await expect(canViewMatch(supabase, 'p2', 'm1')).resolves.toBe(false)
    await expect(canViewMatch(supabase, 'teacher', 'm1')).resolves.toBe(true)
  })
})
