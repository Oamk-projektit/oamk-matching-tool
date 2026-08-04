/**
 * MVP end-to-end happy path, documented as executable assertions on the real
 * pure functions behind each step. This is not a live HTTP smoke test — see
 * scripts/flow-student.mjs / scripts/flow-teacher.mjs for that — it pins down
 * the parse/compute/rule contracts that the happy path depends on:
 *
 *   student profile -> project (weights=100) -> application -> algorithm rank
 *   -> selection decision -> audit action -> notification -> idempotency
 */
import { describe, expect, it } from 'vitest'
import { ValidationError } from '@/lib/validation'
import { parseCreateStudent } from '@/lib/students/parse'
import { parseCreateProject } from '@/lib/projects/parse'
import { parseCreateApplication } from '@/lib/applications/parse'
import {
  computeAlgorithmRank,
  parseCreateSelectionDecision,
} from '@/lib/selections/parse'
import {
  buildIdempotencyKey,
  buildNotificationCopy,
} from '@/lib/notifications/messages'
import {
  DEFAULT_PROJECT_WEIGHTS,
  PROJECT_WEIGHT_TOTAL,
  SELECTION_AUDIT_ACTIONS,
  sumProjectWeights,
  type ProjectWeights,
} from '@/types/domain'

const PROJECT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const STUDENT_1 = '11111111-1111-4111-8111-111111111111'
const STUDENT_2 = '22222222-2222-4222-8222-222222222222'
const APPLICATION_ID = '33333333-3333-4333-8333-333333333333'
const COURSE_A = '44444444-4444-4444-8444-444444444444'
const SKILL_A = '55555555-5555-4555-8555-555555555555'

describe('happy path 1/8 — student creates a profile', () => {
  it('parseCreateStudent accepts degree, credits, availability, and catalog links', () => {
    const parsed = parseCreateStudent({
      degreeProgramme: 'Tietotekniikka',
      department: 'ICT',
      studyCredits: 120,
      availabilityStart: '2026-09-01',
      availabilityEnd: '2026-12-15',
      preferredProjectTypes: ['company_project'],
      courseIds: [COURSE_A],
      skillIds: [SKILL_A],
    })

    expect(parsed).toMatchObject({
      degreeProgramme: 'Tietotekniikka',
      department: 'ICT',
      studyCredits: 120,
      availabilityStart: '2026-09-01',
      availabilityEnd: '2026-12-15',
    })
    expect(parsed.courseIds).toEqual([COURSE_A])
    expect(parsed.skillIds).toEqual([SKILL_A])
  })
})

describe('happy path 2/8 — company publishes a project with valid weights', () => {
  it('parseCreateProject defaults to weights summing to exactly 100', () => {
    const parsed = parseCreateProject({
      title: 'Campus portal renewal',
      description: 'Rebuild the student-facing portal',
      projectType: 'company_project',
      minimumStudyCredits: 60,
      requiredLanguage: 'fi',
      positions: 1,
    })

    expect(parsed.weights).toEqual(DEFAULT_PROJECT_WEIGHTS)
    expect(sumProjectWeights(parsed.weights!)).toBe(PROJECT_WEIGHT_TOTAL)
  })

  it('accepts custom weights as long as they still sum to 100', () => {
    const customWeights: ProjectWeights = {
      studyCredits: 20,
      requiredCourses: 20,
      recommendedCourses: 10,
      skills: 20,
      language: 10,
      availability: 10,
      interests: 5,
      degreeProgramme: 5,
    }
    expect(sumProjectWeights(customWeights)).toBe(PROJECT_WEIGHT_TOTAL)

    const parsed = parseCreateProject({
      title: 'Custom weighted project',
      description: '',
      projectType: 'company_project',
      weights: customWeights,
    })
    expect(parsed.weights).toEqual(customWeights)
  })
})

describe('happy path 3/8 — student applies to the project', () => {
  it('parseCreateApplication accepts the project id and an optional message', () => {
    const parsed = parseCreateApplication({
      projectId: PROJECT_ID,
      message: 'I would love to work on this.',
    })
    expect(parsed).toEqual({
      projectId: PROJECT_ID,
      message: 'I would love to work on this.',
    })
  })

  it('never trusts a client-supplied studentId — identity comes from the session', () => {
    expect(() =>
      parseCreateApplication({ projectId: PROJECT_ID, studentId: STUDENT_1 })
    ).toThrow(ValidationError)
  })
})

describe('happy path 4/8 — algorithm produces an informational rank', () => {
  it('rank #2 remains eligible for selection — the company decides, not the algorithm', () => {
    const rank = computeAlgorithmRank(STUDENT_2, [
      { studentId: STUDENT_1, totalScore: 95 },
      { studentId: STUDENT_2, totalScore: 70 },
    ])
    expect(rank).toBe(2)

    // Selecting the #2 candidate must be allowed by the parser/eligibility layer;
    // rank is stored for audit only and never gates the decision itself.
    const decision = parseCreateSelectionDecision({
      studentId: STUDENT_2,
      applicationId: APPLICATION_ID,
      decision: 'selected',
      reason: 'Best culture fit despite a lower algorithm score',
    })
    expect(decision.decision).toBe('selected')
    expect(decision.studentId).toBe(STUDENT_2)
  })
})

describe('happy path 5/8 — company records a selection decision with a reason', () => {
  it('parseCreateSelectionDecision parses a selected decision with a reason', () => {
    const parsed = parseCreateSelectionDecision({
      studentId: STUDENT_1,
      applicationId: APPLICATION_ID,
      decision: 'selected',
      reason: 'Strong React and TypeScript fit',
    })
    expect(parsed).toEqual({
      studentId: STUDENT_1,
      applicationId: APPLICATION_ID,
      decision: 'selected',
      reason: 'Strong React and TypeScript fit',
    })
  })
})

describe('happy path 6/8 — the decision is captured in the audit vocabulary', () => {
  it('SELECTION_AUDIT_ACTIONS documents both shortlist and selection events', () => {
    expect(SELECTION_AUDIT_ACTIONS).toContain('selection_selected')
    expect(SELECTION_AUDIT_ACTIONS).toContain('application_shortlisted')
  })
})

describe('happy path 7/8 — the student is notified in their preferred language', () => {
  it('renders student_selected in both Finnish and English', () => {
    const fi = buildNotificationCopy('student_selected', 'fi', {
      projectTitle: 'Campus portal renewal',
    })
    expect(fi.title).toBe('Sinut valittiin')
    expect(fi.body).toContain('Campus portal renewal')

    const en = buildNotificationCopy('student_selected', 'en', {
      projectTitle: 'Campus portal renewal',
    })
    expect(en.title).toBe('You were selected')
    expect(en.body).toContain('Campus portal renewal')

    // Same template, different UI language — never derived from project or skill language.
    expect(fi.body).not.toBe(en.body)
  })
})

describe('happy path 8/8 — the notification is idempotent', () => {
  it('produces the same idempotency key for the same event, and a different one otherwise', () => {
    const keyA = buildIdempotencyKey({
      type: 'student_selected',
      profileId: STUDENT_1,
      entityId: APPLICATION_ID,
    })
    const keyB = buildIdempotencyKey({
      type: 'student_selected',
      profileId: STUDENT_1,
      entityId: APPLICATION_ID,
    })
    expect(keyA).toBe(keyB)

    const keyOtherStudent = buildIdempotencyKey({
      type: 'student_selected',
      profileId: STUDENT_2,
      entityId: APPLICATION_ID,
    })
    expect(keyOtherStudent).not.toBe(keyA)
  })
})
