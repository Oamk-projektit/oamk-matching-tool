import type { SupabaseClient } from '@supabase/supabase-js'
import type { Course } from '@/types/domain'
import { ApiHttpError } from '@/lib/api/auth'

type CourseRow = {
  id: string
  code: string
  name_fi: string
  name_en: string
  credits: number
  department: string | null
  active: boolean
}

export function mapCourseRow(row: CourseRow): Course {
  return {
    id: row.id,
    code: row.code,
    nameFi: row.name_fi,
    nameEn: row.name_en,
    credits: row.credits,
    department: row.department,
    active: row.active,
  }
}

/**
 * Search courses by code, Finnish name, English name, or department.
 * Empty search returns active courses (capped).
 */
export async function listCourses(
  supabase: SupabaseClient,
  options?: { search?: string; limit?: number }
): Promise<Course[]> {
  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 200)
  const search = options?.search?.trim()

  let query = supabase
    .from('courses')
    .select('id, code, name_fi, name_en, credits, department, active')
    .eq('active', true)
    .order('code', { ascending: true })
    .limit(limit)

  if (search) {
    const safe = search.replace(/[%_,]/g, ' ').trim()
    if (safe) {
      query = query.or(
        `code.ilike.%${safe}%,name_fi.ilike.%${safe}%,name_en.ilike.%${safe}%,department.ilike.%${safe}%`
      )
    }
  }

  const { data, error } = await query
  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return (data ?? []).map((row) => mapCourseRow(row as CourseRow))
}

export async function getCourseById(
  supabase: SupabaseClient,
  id: string
): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('id, code, name_fi, name_en, credits, department, active')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  if (!data) return null
  return mapCourseRow(data as CourseRow)
}

export async function listSkills(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('skills')
    .select('id, name_fi, name_en, normalized_name')
    .order('normalized_name', { ascending: true })

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return (data ?? []).map((row) => ({
    id: row.id as string,
    nameFi: row.name_fi as string,
    nameEn: row.name_en as string,
    normalizedName: row.normalized_name as string,
  }))
}

export async function listInterests(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('interests')
    .select('id, name_fi, name_en, normalized_name')
    .order('normalized_name', { ascending: true })

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return (data ?? []).map((row) => ({
    id: row.id as string,
    nameFi: row.name_fi as string,
    nameEn: row.name_en as string,
    normalizedName: row.normalized_name as string,
  }))
}
