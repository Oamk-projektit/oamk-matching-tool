import { describe, expect, it } from 'vitest'
import { ValidationError } from '@/lib/validation'
import { ApiHttpError } from '@/lib/api/auth'
import {
  parseCreateStudent,
  parseUpdateStudent,
  parseAddStudentCourse,
  parseAddStudentSkill,
  parseAddStudentInterest,
  mapStudentDetail,
  toCompanyStudentView,
} from '@/lib/students/parse'
import {
  assertCanUpdateStudent,
  assertCanViewStudent,
  assertOwnsStudentOrAdmin,
  shapeStudentForViewer,
} from '@/lib/students/service'
import { buildCourseSearchFilter, mapCourseRow } from '@/lib/courses/service'

const COURSE_A = '11111111-1111-4111-8111-111111111111'
const COURSE_B = '22222222-2222-4222-8222-222222222222'
const SKILL_A = '33333333-3333-4333-8333-333333333333'
const INTEREST_A = '44444444-4444-4444-8444-444444444444'

const sampleDetail = mapStudentDetail({
  id: 's0000000-0000-4000-8000-000000000001',
  profile_id: 'p0000000-0000-4000-8000-000000000001',
  degree_programme: 'Tietotekniikka',
  department: 'ICT',
  study_credits: 120,
  availability_start: '2026-09-01',
  availability_end: '2026-12-15',
  preferred_project_types: ['company_project', 'internship'],
  created_at: '2026-08-01T10:00:00.000Z',
  updated_at: '2026-08-01T10:00:00.000Z',
  student_courses: [{ course_id: COURSE_A }],
  student_skills: [{ skill_id: SKILL_A }],
  student_interests: [{ interest_id: INTEREST_A }],
})

describe('student profile validation', () => {
  it('parses full create payload including study metadata', () => {
    const parsed = parseCreateStudent({
      degreeProgramme: 'Tietotekniikka',
      department: 'ICT',
      studyCredits: 120,
      availabilityStart: '2026-09-01',
      availabilityEnd: '2026-12-15',
      preferredProjectTypes: ['company_project', 'internship'],
      courseIds: [COURSE_A],
      skillIds: [SKILL_A],
      interestIds: [INTEREST_A],
    })
    expect(parsed).toMatchObject({
      degreeProgramme: 'Tietotekniikka',
      department: 'ICT',
      studyCredits: 120,
      availabilityStart: '2026-09-01',
      availabilityEnd: '2026-12-15',
    })
    expect(parsed.preferredProjectTypes).toEqual([
      'company_project',
      'internship',
    ])
  })

  it('rejects negative study credits', () => {
    expect(() => parseCreateStudent({ studyCredits: -1 })).toThrow(
      ValidationError
    )
    expect(() => parseUpdateStudent({ studyCredits: -5 })).toThrow(
      ValidationError
    )
    try {
      parseCreateStudent({ studyCredits: -1 })
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError)
      expect((error as ValidationError).fields).toEqual([
        { field: 'studyCredits', message: 'Must be a non-negative integer' },
      ])
    }
  })

  it('rejects non-integer study credits', () => {
    expect(() => parseCreateStudent({ studyCredits: 12.5 })).toThrow(
      ValidationError
    )
  })

  it('rejects invalid availability dates', () => {
    expect(() =>
      parseCreateStudent({ availabilityStart: '01-09-2026' })
    ).toThrow(ValidationError)
    expect(() =>
      parseUpdateStudent({ availabilityEnd: 'not-a-date' })
    ).toThrow(ValidationError)
  })

  it('deduplicates course, skill, and interest ids on create', () => {
    const parsed = parseCreateStudent({
      courseIds: [COURSE_A, COURSE_A, COURSE_B],
      skillIds: [SKILL_A, SKILL_A],
      interestIds: [INTEREST_A, INTEREST_A],
    })
    expect(parsed.courseIds).toEqual([COURSE_A, COURSE_B])
    expect(parsed.skillIds).toEqual([SKILL_A])
    expect(parsed.interestIds).toEqual([INTEREST_A])
  })

  it('deduplicates preferred project types', () => {
    const parsed = parseCreateStudent({
      preferredProjectTypes: [
        'internship',
        'company_project',
        'internship',
      ],
    })
    expect(parsed.preferredProjectTypes).toEqual([
      'internship',
      'company_project',
    ])
  })

  it('rejects invalid preferred project types', () => {
    expect(() =>
      parseCreateStudent({ preferredProjectTypes: ['thesis'] })
    ).toThrow(ValidationError)
  })

  it('parses partial updates without requiring omitted fields', () => {
    const parsed = parseUpdateStudent({
      department: 'Business',
      studyCredits: 0,
    })
    expect(parsed).toEqual({ department: 'Business', studyCredits: 0 })
    expect(parsed.courseIds).toBeUndefined()
  })
})

describe('student catalog link validation', () => {
  it('requires a course UUID when linking a course', () => {
    expect(() => parseAddStudentCourse({ courseId: 'nope' })).toThrow(
      ValidationError
    )
  })

  it('parses course link with completion metadata', () => {
    const parsed = parseAddStudentCourse({
      courseId: COURSE_A,
      completionStatus: 'in_progress',
      completedAt: null,
      grade: '4',
      verified: false,
    })
    expect(parsed.courseId).toBe(COURSE_A)
    expect(parsed.completionStatus).toBe('in_progress')
  })

  it('rejects invalid completion status', () => {
    expect(() =>
      parseAddStudentCourse({
        courseId: COURSE_A,
        completionStatus: 'done',
      })
    ).toThrow(ValidationError)
  })

  it('requires skillId or name when linking a skill', () => {
    expect(() => parseAddStudentSkill({})).toThrow(ValidationError)
    expect(() => parseAddStudentSkill({ name: '   ' })).toThrow(
      ValidationError
    )
  })

  it('parses skill by id or normalized name', () => {
    expect(parseAddStudentSkill({ skillId: SKILL_A }).skillId).toBe(SKILL_A)
    expect(parseAddStudentSkill({ name: '  Finnish  ' }).name).toBe('Finnish')
  })

  it('requires interestId or name when linking an interest', () => {
    expect(() => parseAddStudentInterest({})).toThrow(ValidationError)
  })

  it('parses interest by id or name', () => {
    expect(
      parseAddStudentInterest({ interestId: INTEREST_A }).interestId
    ).toBe(INTEREST_A)
    expect(parseAddStudentInterest({ name: 'AI' }).name).toBe('AI')
  })
})

describe('student access control', () => {
  it('allows a student to update only their own profile', () => {
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
  })

  it('allows admin update and blocks teacher/company mutation', () => {
    expect(() =>
      assertCanUpdateStudent({
        role: 'admin',
        profileId: 'admin',
        studentProfileId: 'p2',
      })
    ).not.toThrow()

    for (const role of ['teacher', 'company'] as const) {
      expect(() =>
        assertCanUpdateStudent({
          role,
          profileId: 'other',
          studentProfileId: 'p2',
        })
      ).toThrow(ApiHttpError)
    }
  })

  it('blocks managing another student catalog links', () => {
    expect(() =>
      assertOwnsStudentOrAdmin({
        role: 'student',
        profileId: 'a',
        studentProfileId: 'b',
      })
    ).toThrow(ApiHttpError)

    expect(() =>
      assertOwnsStudentOrAdmin({
        role: 'admin',
        profileId: 'admin',
        studentProfileId: 'b',
      })
    ).not.toThrow()
  })

  it('allows owner, teacher, and admin full view access', () => {
    expect(
      assertCanViewStudent({
        role: 'student',
        profileId: 'p1',
        studentProfileId: 'p1',
      })
    ).toBe('full')

    expect(
      assertCanViewStudent({
        role: 'teacher',
        profileId: 't1',
        studentProfileId: 'p1',
      })
    ).toBe('full')

    expect(
      assertCanViewStudent({
        role: 'admin',
        profileId: 'a1',
        studentProfileId: 'p1',
      })
    ).toBe('full')
  })

  it('grants company a redacted view only for own applicants', () => {
    expect(
      assertCanViewStudent({
        role: 'company',
        profileId: 'c1',
        studentProfileId: 'p1',
        appliedToCallerProject: true,
      })
    ).toBe('company')

    expect(() =>
      assertCanViewStudent({
        role: 'company',
        profileId: 'c1',
        studentProfileId: 'p1',
        appliedToCallerProject: false,
      })
    ).toThrow(ApiHttpError)
  })

  it('does not expose private identifiers in company student view', () => {
    const shaped = shapeStudentForViewer(sampleDetail, 'company')
    expect(shaped).toEqual(
      toCompanyStudentView(sampleDetail)
    )
    expect(shaped).toEqual({
      id: sampleDetail.id,
      degreeProgramme: 'Tietotekniikka',
      department: 'ICT',
      studyCredits: 120,
      preferredProjectTypes: ['company_project', 'internship'],
    })
    expect(shaped).not.toHaveProperty('profileId')
    expect(shaped).not.toHaveProperty('availabilityStart')
    expect(shaped).not.toHaveProperty('availabilityEnd')
    expect(shaped).not.toHaveProperty('courseIds')
    expect(shaped).not.toHaveProperty('skillIds')
    expect(shaped).not.toHaveProperty('interestIds')
  })

  it('returns full detail for owning student / staff', () => {
    expect(shapeStudentForViewer(sampleDetail, 'full')).toEqual(sampleDetail)
  })
})

describe('course catalog search', () => {
  it('maps DB course rows to camelCase', () => {
    expect(
      mapCourseRow({
        id: COURSE_A,
        code: 'TT00AA11',
        name_fi: 'Web-ohjelmointi',
        name_en: 'Web Programming',
        credits: 5,
        department: 'ICT',
        active: true,
      })
    ).toEqual({
      id: COURSE_A,
      code: 'TT00AA11',
      nameFi: 'Web-ohjelmointi',
      nameEn: 'Web Programming',
      credits: 5,
      department: 'ICT',
      active: true,
    })
  })

  it('builds search filter for code, fi/en names, and department', () => {
    const filter = buildCourseSearchFilter('Web')
    expect(filter).toContain('code.ilike.%Web%')
    expect(filter).toContain('name_fi.ilike.%Web%')
    expect(filter).toContain('name_en.ilike.%Web%')
    expect(filter).toContain('department.ilike.%Web%')
  })

  it('sanitizes PostgREST wildcards and returns null for empty search', () => {
    expect(buildCourseSearchFilter('  %_,  ')).toBeNull()
    expect(buildCourseSearchFilter('')).toBeNull()
    expect(buildCourseSearchFilter('ICT%')).toBe(
      'code.ilike.%ICT%,name_fi.ilike.%ICT%,name_en.ilike.%ICT%,department.ilike.%ICT%'
    )
  })
})
