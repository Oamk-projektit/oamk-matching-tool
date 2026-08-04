import { describe, expect, it } from 'vitest'
import { ValidationError } from '@/lib/validation'
import { ApiHttpError } from '@/lib/api/auth'
import {
  buildMatchSnapshotFromRow,
  computeAlgorithmRank,
  mapSelectionDecision,
  parseCreateSelectionDecision,
} from '@/lib/selections/parse'
import {
  assertApplicationEligibleForSelection,
  assertCanManageProjectSelections,
  assertCanViewApplicationDecision,
  assertCanViewProjectSelections,
} from '@/lib/selections/service'
import { SELECTION_AUDIT_ACTIONS } from '@/types/domain'
import { DEFAULT_PROJECT_WEIGHTS } from '@/types/domain'

const PROJECT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const PROJECT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const STUDENT_A = '11111111-1111-4111-8111-111111111111'
const STUDENT_B = '22222222-2222-4222-8222-222222222222'
const APP_A = '33333333-3333-4333-8333-333333333333'
const COMPANY_A = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const COMPANY_B = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'

describe('parseCreateSelectionDecision', () => {
  it('parses a successful selection payload', () => {
    const parsed = parseCreateSelectionDecision({
      studentId: STUDENT_A,
      applicationId: APP_A,
      decision: 'selected',
      reason: 'Strong React fit',
    })
    expect(parsed).toEqual({
      studentId: STUDENT_A,
      applicationId: APP_A,
      decision: 'selected',
      reason: 'Strong React fit',
    })
  })

  it('rejects invalid decision values', () => {
    expect(() =>
      parseCreateSelectionDecision({
        studentId: STUDENT_A,
        applicationId: APP_A,
        decision: 'maybe',
      })
    ).toThrow(ValidationError)
  })
})

describe('selection eligibility and ownership', () => {
  it('allows owning company to manage selections', () => {
    expect(() =>
      assertCanManageProjectSelections({
        role: 'company',
        projectCompanyId: COMPANY_A,
        callerCompanyId: COMPANY_A,
      })
    ).not.toThrow()
  })

  it('blocks another company from selecting on a foreign project', () => {
    expect(() =>
      assertCanManageProjectSelections({
        role: 'company',
        projectCompanyId: COMPANY_A,
        callerCompanyId: COMPANY_B,
      })
    ).toThrow(ApiHttpError)
  })

  it('rejects students who did not apply (student/application mismatch)', () => {
    expect(() =>
      assertApplicationEligibleForSelection({
        applicationProjectId: PROJECT_A,
        applicationStudentId: STUDENT_A,
        applicationStatus: 'submitted',
        requestProjectId: PROJECT_A,
        requestStudentId: STUDENT_B,
      })
    ).toThrow(ApiHttpError)
  })

  it('rejects withdrawn applications', () => {
    expect(() =>
      assertApplicationEligibleForSelection({
        applicationProjectId: PROJECT_A,
        applicationStudentId: STUDENT_A,
        applicationStatus: 'withdrawn',
        requestProjectId: PROJECT_A,
        requestStudentId: STUDENT_A,
      })
    ).toThrow(ApiHttpError)
  })

  it('rejects applications for a different project', () => {
    expect(() =>
      assertApplicationEligibleForSelection({
        applicationProjectId: PROJECT_A,
        applicationStudentId: STUDENT_A,
        applicationStatus: 'submitted',
        requestProjectId: PROJECT_B,
        requestStudentId: STUDENT_A,
      })
    ).toThrow(ApiHttpError)
  })

  it('rejects selecting an already-selected student when flagged', () => {
    expect(() =>
      assertApplicationEligibleForSelection({
        applicationProjectId: PROJECT_A,
        applicationStudentId: STUDENT_A,
        applicationStatus: 'selected',
        requestProjectId: PROJECT_A,
        requestStudentId: STUDENT_A,
        alreadySelectedForProject: true,
      })
    ).toThrow(ApiHttpError)
  })

  it('allows a valid selection candidate', () => {
    expect(() =>
      assertApplicationEligibleForSelection({
        applicationProjectId: PROJECT_A,
        applicationStudentId: STUDENT_A,
        applicationStatus: 'shortlisted',
        requestProjectId: PROJECT_A,
        requestStudentId: STUDENT_A,
      })
    ).not.toThrow()
  })
})

describe('algorithm rank is informational only', () => {
  it('computes 1-based ranks by score without forcing #1 selection', () => {
    const rank = computeAlgorithmRank(STUDENT_B, [
      { studentId: STUDENT_A, totalScore: 95 },
      { studentId: STUDENT_B, totalScore: 70 },
    ])
    expect(rank).toBe(2)
    // Company may still select STUDENT_B — rank is stored, not enforced.
    expect(rank).not.toBe(1)
  })

  it('returns null when the student has no match row among inputs', () => {
    expect(
      computeAlgorithmRank(STUDENT_A, [
        { studentId: STUDENT_B, totalScore: 80 },
      ])
    ).toBeNull()
  })

  it('builds a frozen match snapshot for the decision record', () => {
    const built = buildMatchSnapshotFromRow({
      id: 'm1111111-1111-4111-8111-111111111111',
      total_score: 85,
      score_breakdown: { ...DEFAULT_PROJECT_WEIGHTS, skills: 20 },
      explanation: 'Strong skill overlap',
      matched_courses: ['Web'],
      missing_required_courses: [],
      matched_skills: ['React'],
      missing_required_skills: [],
      weights_snapshot: DEFAULT_PROJECT_WEIGHTS,
    })
    expect(built.matchSnapshot.totalScore).toBe(85)
    expect(built.weightsSnapshot).toEqual(DEFAULT_PROJECT_WEIGHTS)
    expect(built.matchId).toBe('m1111111-1111-4111-8111-111111111111')
  })
})

describe('decision visibility', () => {
  it('lets a student view only their own decision', () => {
    expect(() =>
      assertCanViewApplicationDecision({
        role: 'student',
        studentProfileId: 'p-student',
        callerProfileId: 'p-student',
        projectCompanyId: COMPANY_A,
        callerCompanyId: null,
      })
    ).not.toThrow()

    expect(() =>
      assertCanViewApplicationDecision({
        role: 'student',
        studentProfileId: 'p-student',
        callerProfileId: 'p-other',
        projectCompanyId: COMPANY_A,
        callerCompanyId: null,
      })
    ).toThrow(ApiHttpError)
  })

  it('lets company/teacher/admin view project selections', () => {
    expect(() =>
      assertCanViewProjectSelections({
        role: 'teacher',
        projectCompanyId: COMPANY_A,
        callerCompanyId: null,
      })
    ).not.toThrow()

    expect(() =>
      assertCanViewProjectSelections({
        role: 'company',
        projectCompanyId: COMPANY_A,
        callerCompanyId: COMPANY_A,
      })
    ).not.toThrow()

    expect(() =>
      assertCanViewProjectSelections({
        role: 'company',
        projectCompanyId: COMPANY_A,
        callerCompanyId: COMPANY_B,
      })
    ).toThrow(ApiHttpError)
  })
})

describe('audit action vocabulary', () => {
  it('covers shortlist, selection, change, and reason-change events', () => {
    expect(SELECTION_AUDIT_ACTIONS).toEqual(
      expect.arrayContaining([
        'application_shortlisted',
        'application_unshortlisted',
        'selection_selected',
        'selection_not_selected',
        'selection_changed',
        'selection_reason_changed',
      ])
    )
  })

  it('maps selection rows including snapshots and algorithm rank', () => {
    const mapped = mapSelectionDecision({
      id: 'sel-1',
      project_id: PROJECT_A,
      student_id: STUDENT_B,
      application_id: APP_A,
      decision: 'selected',
      decided_by: 'company-profile',
      reason: 'Culture fit',
      decided_at: '2026-08-04T12:00:00.000Z',
      match_id: 'match-1',
      match_snapshot: {
        totalScore: 70,
        scoreBreakdown: DEFAULT_PROJECT_WEIGHTS,
        explanation: 'ok',
      },
      weights_snapshot: DEFAULT_PROJECT_WEIGHTS,
      algorithm_rank: 2,
    })
    expect(mapped.decision).toBe('selected')
    expect(mapped.algorithmRank).toBe(2)
    expect(mapped.matchSnapshot?.totalScore).toBe(70)
    expect(mapped.weightsSnapshot).toEqual(DEFAULT_PROJECT_WEIGHTS)
  })
})

describe('capacity overflow signal', () => {
  it('documents conflict semantics for filled positions via eligibility helper', () => {
    // Capacity is enforced in the service + DB trigger; this unit asserts the
    // already-selected guard path used before insert.
    try {
      assertApplicationEligibleForSelection({
        applicationProjectId: PROJECT_A,
        applicationStudentId: STUDENT_A,
        applicationStatus: 'submitted',
        requestProjectId: PROJECT_A,
        requestStudentId: STUDENT_A,
        alreadySelectedForProject: true,
      })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiHttpError)
      expect((error as ApiHttpError).status).toBe(409)
      expect((error as ApiHttpError).message).toMatch(/already selected/i)
    }
  })
})
