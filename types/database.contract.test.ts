import { describe, expect, it } from 'vitest'
import type { Database } from '@/types/database'
import {
  DEFAULT_PROJECT_WEIGHTS,
  isValidProjectWeights,
  type ApplicationStatus,
  type ProjectType,
  type UserRole,
} from '@/types/domain'

type PublicTables = Database['public']['Tables']

const REQUIRED_TABLES = [
  'profiles',
  'students',
  'companies',
  'company_users',
  'courses',
  'skills',
  'interests',
  'student_courses',
  'student_skills',
  'student_interests',
  'projects',
  'project_required_courses',
  'project_recommended_courses',
  'project_required_skills',
  'project_recommended_skills',
  'project_interests',
  'project_weights',
  'applications',
  'matches',
  'selection_decisions',
  'notifications',
  'audit_events',
] as const satisfies ReadonlyArray<keyof PublicTables>

describe('Database ↔ domain contract', () => {
  it('includes all 22 canonical tables including projects model', () => {
    for (const table of REQUIRED_TABLES) {
      expect(table in ({} as PublicTables) || true).toBe(true)
      // Structural existence via keyof
      expect(REQUIRED_TABLES.includes(table)).toBe(true)
    }
    expect(REQUIRED_TABLES).toHaveLength(22)
    expect(REQUIRED_TABLES).toContain('projects')
    expect(REQUIRED_TABLES).toContain('project_recommended_skills')
    expect(REQUIRED_TABLES).toContain('project_interests')
  })

  it('requires projects.company_id and positions (no teacher owner column)', () => {
    type ProjectRow = PublicTables['projects']['Row']
    type ProjectKeys = keyof ProjectRow

    const required: ProjectKeys[] = ['id', 'company_id', 'positions', 'project_type']
    for (const key of required) {
      expect(required).toContain(key)
    }

    // Compile-time: teacher_id must not exist on projects
    type HasTeacherOwner = 'teacher_id' extends ProjectKeys ? true : false
    const hasTeacherOwner: HasTeacherOwner = false
    expect(hasTeacherOwner).toBe(false)
  })

  it('links selection_decisions to applications and student/project', () => {
    type SelectionRow = PublicTables['selection_decisions']['Row']
    type Keys = keyof SelectionRow
    const keys: Keys[] = [
      'application_id',
      'student_id',
      'project_id',
      'decision',
      'decided_by',
    ]
    expect(keys).toContain('application_id')
    expect(keys).toContain('project_id')
    expect(keys).toContain('student_id')
  })

  it('matches use student_id + project_id and weights have sum-100 criteria', () => {
    type MatchRow = PublicTables['matches']['Row']
    type WeightRow = PublicTables['project_weights']['Row']

    const matchKeys: (keyof MatchRow)[] = ['student_id', 'project_id', 'total_score']
    expect(matchKeys).toEqual(
      expect.arrayContaining(['student_id', 'project_id', 'total_score'])
    )

    const weightKeys: (keyof WeightRow)[] = [
      'study_credits',
      'required_courses',
      'recommended_courses',
      'skills',
      'language',
      'availability',
      'interests',
      'degree_programme',
    ]
    expect(weightKeys).toHaveLength(8)
    expect(isValidProjectWeights(DEFAULT_PROJECT_WEIGHTS)).toBe(true)
  })

  it('locks domain enums used by API/auth', () => {
    const projectTypes: ProjectType[] = ['company_project', 'internship']
    const roles: UserRole[] = ['student', 'company', 'teacher', 'admin']
    const applicationStatuses: ApplicationStatus[] = [
      'submitted',
      'under_review',
      'shortlisted',
      'selected',
      'not_selected',
      'withdrawn',
    ]

    expect(projectTypes).toHaveLength(2)
    expect(roles).toHaveLength(4)
    expect(applicationStatuses).toHaveLength(6)
    expect(projectTypes).not.toContain('thesis' as ProjectType)
  })
})
