import type { SupabaseClient } from '@supabase/supabase-js'
import type { Student } from '@/types/legacy'
import type { CreateStudentRequest, UpdateStudentRequest } from '@/types/legacy'
import { ApiHttpError } from '@/lib/api/auth'
import { mapStudentRow, STUDENT_SELECT } from '@/lib/students/parse'

async function replaceChildren(
  supabase: SupabaseClient,
  studentId: string,
  data: {
    completed_courses?: string[]
    skills?: string[]
    interests?: string[]
    project_preferences?: string[]
  }
) {
  if (data.completed_courses) {
    const { error: delErr } = await supabase
      .from('student_courses')
      .delete()
      .eq('student_id', studentId)
    if (delErr) throw new ApiHttpError(500, 'INTERNAL_ERROR', delErr.message)
    if (data.completed_courses.length > 0) {
      const { error } = await supabase.from('student_courses').insert(
        data.completed_courses.map((course_name) => ({
          student_id: studentId,
          course_name,
        }))
      )
      if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
    }
  }

  if (data.skills) {
    const { error: delErr } = await supabase
      .from('student_skills')
      .delete()
      .eq('student_id', studentId)
    if (delErr) throw new ApiHttpError(500, 'INTERNAL_ERROR', delErr.message)
    if (data.skills.length > 0) {
      const { error } = await supabase.from('student_skills').insert(
        data.skills.map((skill_name) => ({
          student_id: studentId,
          skill_name,
        }))
      )
      if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
    }
  }

  if (data.interests) {
    const { error: delErr } = await supabase
      .from('student_interests')
      .delete()
      .eq('student_id', studentId)
    if (delErr) throw new ApiHttpError(500, 'INTERNAL_ERROR', delErr.message)
    if (data.interests.length > 0) {
      const { error } = await supabase.from('student_interests').insert(
        data.interests.map((interest_name) => ({
          student_id: studentId,
          interest_name,
        }))
      )
      if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
    }
  }

  if (data.project_preferences) {
    const { error: delErr } = await supabase
      .from('student_project_preferences')
      .delete()
      .eq('student_id', studentId)
    if (delErr) throw new ApiHttpError(500, 'INTERNAL_ERROR', delErr.message)
    if (data.project_preferences.length > 0) {
      const { error } = await supabase.from('student_project_preferences').insert(
        data.project_preferences.map((preference) => ({
          student_id: studentId,
          preference,
        }))
      )
      if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
    }
  }
}

export async function getStudentById(
  supabase: SupabaseClient,
  id: string
): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .select(STUDENT_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  if (!data) return null
  return mapStudentRow(data)
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
  userId: string,
  input: CreateStudentRequest
): Promise<Student> {
  const { data: existing } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', userId)
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
      user_id: userId,
      name: input.name,
      email: input.email,
      degree_program: input.degree_program ?? null,
      credits: input.credits ?? 0,
      language: input.language ?? 'FI',
      availability: input.availability ?? null,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ApiHttpError(409, 'CONFLICT', 'Student profile already exists')
    }
    throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  }

  await replaceChildren(supabase, data.id, {
    completed_courses: input.completed_courses ?? [],
    skills: input.skills ?? [],
    interests: input.interests ?? [],
    project_preferences: input.project_preferences ?? [],
  })

  const student = await getStudentById(supabase, data.id)
  if (!student) {
    throw new ApiHttpError(500, 'INTERNAL_ERROR', 'Failed to load created student')
  }
  return student
}

export async function updateStudent(
  supabase: SupabaseClient,
  id: string,
  input: UpdateStudentRequest
): Promise<Student> {
  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch.name = input.name
  if (input.email !== undefined) patch.email = input.email
  if (input.degree_program !== undefined) {
    patch.degree_program = input.degree_program
  }
  if (input.credits !== undefined) patch.credits = input.credits
  if (input.language !== undefined) patch.language = input.language
  if (input.availability !== undefined) patch.availability = input.availability

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from('students').update(patch).eq('id', id)
    if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  }

  await replaceChildren(supabase, id, {
    completed_courses: input.completed_courses,
    skills: input.skills,
    interests: input.interests,
    project_preferences: input.project_preferences,
  })

  const student = await getStudentById(supabase, id)
  if (!student) throw new ApiHttpError(404, 'NOT_FOUND', 'Student not found')
  return student
}
