import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserRole } from '@/types/domain'
import type { Student, StudentCourse } from '@/types/domain'
import type {
  AddStudentCourseRequest,
  CreateStudentRequest,
  StudentDetail,
  UpdateStudentRequest,
} from '@/types/api'
import { ApiHttpError, isStaff } from '@/lib/api/auth'
import {
  mapStudentDetail,
  mapStudentRow,
  STUDENT_SELECT,
  toCompanyStudentView,
} from '@/lib/students/parse'

async function replaceStudentLinks(
  supabase: SupabaseClient,
  studentId: string,
  data: {
    courseIds?: string[]
    skillIds?: string[]
    interestIds?: string[]
  }
) {
  if (data.courseIds) {
    const { error: delErr } = await supabase
      .from('student_courses')
      .delete()
      .eq('student_id', studentId)
    if (delErr) throw new ApiHttpError(500, 'INTERNAL_ERROR', delErr.message)
    if (data.courseIds.length > 0) {
      const { error } = await supabase.from('student_courses').insert(
        data.courseIds.map((course_id) => ({
          student_id: studentId,
          course_id,
          completion_status: 'completed',
        }))
      )
      if (error) {
        if (error.code === '23505') {
          throw new ApiHttpError(409, 'CONFLICT', 'Duplicate student course')
        }
        throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
      }
    }
  }

  if (data.skillIds) {
    const { error: delErr } = await supabase
      .from('student_skills')
      .delete()
      .eq('student_id', studentId)
    if (delErr) throw new ApiHttpError(500, 'INTERNAL_ERROR', delErr.message)
    if (data.skillIds.length > 0) {
      const { error } = await supabase.from('student_skills').insert(
        data.skillIds.map((skill_id) => ({
          student_id: studentId,
          skill_id,
        }))
      )
      if (error) {
        if (error.code === '23505') {
          throw new ApiHttpError(409, 'CONFLICT', 'Duplicate student skill')
        }
        throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
      }
    }
  }

  if (data.interestIds) {
    const { error: delErr } = await supabase
      .from('student_interests')
      .delete()
      .eq('student_id', studentId)
    if (delErr) throw new ApiHttpError(500, 'INTERNAL_ERROR', delErr.message)
    if (data.interestIds.length > 0) {
      const { error } = await supabase.from('student_interests').insert(
        data.interestIds.map((interest_id) => ({
          student_id: studentId,
          interest_id,
        }))
      )
      if (error) {
        if (error.code === '23505') {
          throw new ApiHttpError(409, 'CONFLICT', 'Duplicate student interest')
        }
        throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
      }
    }
  }
}

export async function getStudentDetailById(
  supabase: SupabaseClient,
  id: string
): Promise<StudentDetail | null> {
  const { data, error } = await supabase
    .from('students')
    .select(STUDENT_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  if (!data) return null
  return mapStudentDetail(data)
}

export async function getStudentById(
  supabase: SupabaseClient,
  id: string
): Promise<Student | null> {
  const detail = await getStudentDetailById(supabase, id)
  if (!detail) return null
  return {
    id: detail.id,
    profileId: detail.profileId,
    educationFieldCode: detail.educationFieldCode,
    degreeProgrammeCode: detail.degreeProgrammeCode,
    specializationCode: detail.specializationCode,
    degreeProgramme: detail.degreeProgramme,
    department: detail.department,
    studyCredits: detail.studyCredits,
    availabilityStart: detail.availabilityStart,
    availabilityEnd: detail.availabilityEnd,
    preferredProjectTypes: detail.preferredProjectTypes,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
  }
}

export async function listStudents(
  supabase: SupabaseClient
): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select(STUDENT_SELECT)
    .order('created_at', { ascending: true })

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return (data ?? []).map(mapStudentRow)
}

export async function createStudent(
  supabase: SupabaseClient,
  profileId: string,
  input: CreateStudentRequest
): Promise<StudentDetail> {
  const { data: existing } = await supabase
    .from('students')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (existing) {
    throw new ApiHttpError(
      409,
      'CONFLICT',
      'Student profile already exists for this user'
    )
  }

  const { data, error } = await supabase
    .from('students')
    .insert({
      profile_id: profileId,
      education_field_code: input.educationFieldCode ?? null,
      degree_programme_code: input.degreeProgrammeCode ?? null,
      specialization_code: input.specializationCode ?? null,
      degree_programme: input.degreeProgramme ?? null,
      department: input.department ?? null,
      study_credits: input.studyCredits ?? 0,
      availability_start: input.availabilityStart ?? null,
      availability_end: input.availabilityEnd ?? null,
      preferred_project_types: input.preferredProjectTypes ?? [],
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ApiHttpError(409, 'CONFLICT', 'Student profile already exists')
    }
    throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  }

  try {
    await replaceStudentLinks(supabase, data.id, {
      courseIds: input.courseIds ?? [],
      skillIds: input.skillIds ?? [],
      interestIds: input.interestIds ?? [],
    })
  } catch (linkError) {
    await supabase.from('students').delete().eq('id', data.id)
    throw linkError
  }

  const student = await getStudentDetailById(supabase, data.id)
  if (!student) {
    throw new ApiHttpError(500, 'INTERNAL_ERROR', 'Failed to load created student')
  }
  return student
}

export async function updateStudent(
  supabase: SupabaseClient,
  id: string,
  input: UpdateStudentRequest
): Promise<StudentDetail> {
  const patch: Record<string, unknown> = {}
  if (input.educationFieldCode !== undefined) {
    patch.education_field_code = input.educationFieldCode
  }
  if (input.degreeProgrammeCode !== undefined) {
    patch.degree_programme_code = input.degreeProgrammeCode
  }
  if (input.specializationCode !== undefined) {
    patch.specialization_code = input.specializationCode
  }
  if (input.degreeProgramme !== undefined) {
    patch.degree_programme = input.degreeProgramme
  }
  if (input.department !== undefined) patch.department = input.department
  if (input.studyCredits !== undefined) patch.study_credits = input.studyCredits
  if (input.availabilityStart !== undefined) {
    patch.availability_start = input.availabilityStart
  }
  if (input.availabilityEnd !== undefined) {
    patch.availability_end = input.availabilityEnd
  }
  if (input.preferredProjectTypes !== undefined) {
    patch.preferred_project_types = input.preferredProjectTypes
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from('students').update(patch).eq('id', id)
    if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  }

  await replaceStudentLinks(supabase, id, {
    courseIds: input.courseIds,
    skillIds: input.skillIds,
    interestIds: input.interestIds,
  })

  const student = await getStudentDetailById(supabase, id)
  if (!student) throw new ApiHttpError(404, 'NOT_FOUND', 'Student not found')
  return student
}

export function assertCanUpdateStudent(params: {
  role: UserRole
  profileId: string
  studentProfileId: string
}): void {
  if (params.role === 'admin') return
  if (params.studentProfileId === params.profileId) return
  throw new ApiHttpError(403, 'FORBIDDEN', 'Cannot update this student')
}

export function assertCanViewStudent(params: {
  role: UserRole
  profileId: string
  studentProfileId: string
  appliedToCallerProject?: boolean
}): 'full' | 'company' {
  if (isStaff(params.role) || params.studentProfileId === params.profileId) {
    return 'full'
  }
  if (params.role === 'company' && params.appliedToCallerProject) {
    return 'company'
  }
  throw new ApiHttpError(403, 'FORBIDDEN', 'Cannot view this student')
}

export function shapeStudentForViewer(
  student: StudentDetail,
  access: 'full' | 'company'
): StudentDetail | ReturnType<typeof toCompanyStudentView> {
  if (access === 'full') return student
  return toCompanyStudentView(student)
}

export async function companyHasApplicant(
  supabase: SupabaseClient,
  studentId: string,
  companyId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('applications')
    .select('id, projects!inner(company_id)')
    .eq('student_id', studentId)
    .eq('projects.company_id', companyId)
    .limit(1)

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return (data?.length ?? 0) > 0
}

type StudentCourseRow = {
  id: string
  student_id: string
  course_id: string
  completion_status: string
  completed_at: string | null
  grade: string | null
  verified: boolean
  created_at: string
}

function mapStudentCourse(row: StudentCourseRow): StudentCourse {
  return {
    id: row.id,
    studentId: row.student_id,
    courseId: row.course_id,
    completionStatus: row.completion_status as StudentCourse['completionStatus'],
    completedAt: row.completed_at,
    grade: row.grade,
    verified: row.verified,
    createdAt: row.created_at,
  }
}

export async function addStudentCourse(
  supabase: SupabaseClient,
  studentId: string,
  input: AddStudentCourseRequest
): Promise<StudentCourse> {
  const { data, error } = await supabase
    .from('student_courses')
    .insert({
      student_id: studentId,
      course_id: input.courseId,
      completion_status: input.completionStatus ?? 'completed',
      completed_at: input.completedAt ?? null,
      grade: input.grade ?? null,
      verified: input.verified ?? false,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ApiHttpError(
        409,
        'CONFLICT',
        'Course already linked to this student'
      )
    }
    throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  }

  return mapStudentCourse(data as StudentCourseRow)
}

export async function removeStudentCourse(
  supabase: SupabaseClient,
  studentId: string,
  courseId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('student_courses')
    .delete()
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .select('id')

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  if (!data || data.length === 0) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'Student course not found')
  }
}

export async function addStudentSkill(
  supabase: SupabaseClient,
  studentId: string,
  skillId: string
): Promise<{ studentId: string; skillId: string }> {
  const { error } = await supabase.from('student_skills').insert({
    student_id: studentId,
    skill_id: skillId,
  })

  if (error) {
    if (error.code === '23505') {
      throw new ApiHttpError(
        409,
        'CONFLICT',
        'Skill already linked to this student'
      )
    }
    throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  }

  return { studentId, skillId }
}

export async function removeStudentSkill(
  supabase: SupabaseClient,
  studentId: string,
  skillId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('student_skills')
    .delete()
    .eq('student_id', studentId)
    .eq('skill_id', skillId)
    .select('id')

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  if (!data || data.length === 0) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'Student skill not found')
  }
}

export async function addStudentInterest(
  supabase: SupabaseClient,
  studentId: string,
  interestId: string
): Promise<{ studentId: string; interestId: string }> {
  const { error } = await supabase.from('student_interests').insert({
    student_id: studentId,
    interest_id: interestId,
  })

  if (error) {
    if (error.code === '23505') {
      throw new ApiHttpError(
        409,
        'CONFLICT',
        'Interest already linked to this student'
      )
    }
    throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  }

  return { studentId, interestId }
}

export async function removeStudentInterest(
  supabase: SupabaseClient,
  studentId: string,
  interestId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('student_interests')
    .delete()
    .eq('student_id', studentId)
    .eq('interest_id', interestId)
    .select('id')

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  if (!data || data.length === 0) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'Student interest not found')
  }
}

export async function resolveSkillId(
  supabase: SupabaseClient,
  input: { skillId?: string; name?: string }
): Promise<string> {
  if (input.skillId) return input.skillId
  const { data, error } = await supabase.rpc('find_or_create_skill', {
    p_name: input.name,
  })
  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return data as string
}

export async function resolveInterestId(
  supabase: SupabaseClient,
  input: { interestId?: string; name?: string }
): Promise<string> {
  if (input.interestId) return input.interestId
  const { data, error } = await supabase.rpc('find_or_create_interest', {
    p_name: input.name,
  })
  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return data as string
}

export function assertOwnsStudentOrAdmin(params: {
  role: UserRole
  profileId: string
  studentProfileId: string
}): void {
  if (params.role === 'admin') return
  if (params.studentProfileId === params.profileId) return
  throw new ApiHttpError(
    403,
    'FORBIDDEN',
    'Students may only manage their own catalog links'
  )
}
