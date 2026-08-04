import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserRole, Project, ProjectStatus, ProjectType } from '@/types/domain'
import type {
  CreateProjectRequest,
  ProjectDetail,
  UpdateProjectRequest,
} from '@/types/api'
import { ApiHttpError, isStaff } from '@/lib/api/auth'
import {
  mapProjectDetail,
  mapProjectRow,
  PROJECT_SELECT,
  weightsToSnake,
} from '@/lib/projects/parse'

export function assertCanManageProject(params: {
  role: UserRole
  projectCompanyId: string
  callerCompanyId: string | null
}): void {
  if (params.role === 'admin') return
  if (
    params.role === 'company' &&
    params.callerCompanyId &&
    params.callerCompanyId === params.projectCompanyId
  ) {
    return
  }
  throw new ApiHttpError(403, 'FORBIDDEN', 'Cannot manage this project')
}

export function canViewProjectDraft(params: {
  role: UserRole
  projectStatus: ProjectStatus
  projectCompanyId: string
  callerCompanyId: string | null
}): boolean {
  if (params.projectStatus !== 'draft') return true
  if (isStaff(params.role)) return true
  if (
    params.role === 'company' &&
    params.callerCompanyId === params.projectCompanyId
  ) {
    return true
  }
  return false
}

export async function getProjectDetailById(
  supabase: SupabaseClient,
  id: string
): Promise<ProjectDetail | null> {
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  if (!data) return null
  return mapProjectDetail(data as Parameters<typeof mapProjectDetail>[0])
}

export async function listProjects(
  supabase: SupabaseClient,
  options: {
    role: UserRole
    callerCompanyId: string | null
    projectType?: ProjectType
    status?: ProjectStatus
    q?: string
  }
): Promise<Project[]> {
  let query = supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .order('created_at', { ascending: false })

  if (options.projectType) {
    query = query.eq('project_type', options.projectType)
  }
  if (options.status) {
    query = query.eq('status', options.status)
  } else if (options.role === 'student') {
    // Drafts never visible to students
    query = query.neq('status', 'draft')
  }

  if (options.q) {
    const safe = options.q.replace(/[%_,]/g, ' ').trim()
    if (safe) {
      query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`)
    }
  }

  const { data, error } = await query
  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)

  const rows = (data ?? []).map((row) =>
    mapProjectRow(row as Parameters<typeof mapProjectRow>[0])
  )

  // Extra filter: students only published (and closed for visibility)
  if (options.role === 'student') {
    return rows.filter(
      (p) => p.status === 'published' || p.status === 'closed'
    )
  }

  // Company: own projects (all statuses) + others' published
  if (options.role === 'company') {
    return rows.filter(
      (p) =>
        p.companyId === options.callerCompanyId ||
        p.status === 'published' ||
        p.status === 'closed'
    )
  }

  return rows
}

export async function createProject(
  supabase: SupabaseClient,
  companyId: string,
  input: CreateProjectRequest
): Promise<ProjectDetail> {
  const weights = input.weights!
  const { data: projectId, error } = await supabase.rpc('create_project_bundle', {
    payload: {
      company_id: companyId,
      title: input.title,
      description: input.description,
      project_type: input.projectType,
      status: input.status ?? 'draft',
      positions: input.positions ?? 1,
      application_start: input.applicationStart ?? null,
      application_deadline: input.applicationDeadline ?? null,
      project_start: input.projectStart ?? null,
      project_end: input.projectEnd ?? null,
      work_mode: input.workMode ?? 'hybrid',
      location: input.location ?? null,
      remote_allowed: input.remoteAllowed ?? true,
      minimum_study_credits: input.minimumStudyCredits ?? 0,
      required_language: input.requiredLanguage ?? 'fi',
      department: input.department ?? null,
      weights: weightsToSnake(weights),
      required_course_ids: input.requiredCourseIds ?? [],
      recommended_course_ids: input.recommendedCourseIds ?? [],
      required_skill_ids: input.requiredSkillIds ?? [],
      recommended_skill_ids: input.recommendedSkillIds ?? [],
      interest_ids: input.interestIds ?? [],
    },
  })

  if (error) {
    if (error.message?.includes('forbidden')) {
      throw new ApiHttpError(403, 'FORBIDDEN', 'Cannot create project for this company')
    }
    throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  }

  const detail = await getProjectDetailById(supabase, projectId as string)
  if (!detail) {
    throw new ApiHttpError(500, 'INTERNAL_ERROR', 'Failed to load created project')
  }
  return detail
}

export async function updateProject(
  supabase: SupabaseClient,
  id: string,
  input: UpdateProjectRequest
): Promise<ProjectDetail> {
  const patch: Record<string, unknown> = {}
  if (input.title !== undefined) patch.title = input.title
  if (input.description !== undefined) patch.description = input.description
  if (input.projectType !== undefined) patch.project_type = input.projectType
  if (input.status !== undefined) patch.status = input.status
  if (input.positions !== undefined) patch.positions = input.positions
  if (input.applicationStart !== undefined) {
    patch.application_start = input.applicationStart
  }
  if (input.applicationDeadline !== undefined) {
    patch.application_deadline = input.applicationDeadline
  }
  if (input.projectStart !== undefined) patch.project_start = input.projectStart
  if (input.projectEnd !== undefined) patch.project_end = input.projectEnd
  if (input.workMode !== undefined) patch.work_mode = input.workMode
  if (input.location !== undefined) patch.location = input.location
  if (input.remoteAllowed !== undefined) {
    patch.remote_allowed = input.remoteAllowed
  }
  if (input.minimumStudyCredits !== undefined) {
    patch.minimum_study_credits = input.minimumStudyCredits
  }
  if (input.requiredLanguage !== undefined) {
    patch.required_language = input.requiredLanguage
  }
  if (input.department !== undefined) patch.department = input.department

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from('projects').update(patch).eq('id', id)
    if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  }

  const reqPayload: Record<string, unknown> = {}
  if (input.weights !== undefined) {
    reqPayload.weights = weightsToSnake(input.weights)
  }
  if (input.requiredCourseIds !== undefined) {
    reqPayload.required_course_ids = input.requiredCourseIds
  }
  if (input.recommendedCourseIds !== undefined) {
    reqPayload.recommended_course_ids = input.recommendedCourseIds
  }
  if (input.requiredSkillIds !== undefined) {
    reqPayload.required_skill_ids = input.requiredSkillIds
  }
  if (input.recommendedSkillIds !== undefined) {
    reqPayload.recommended_skill_ids = input.recommendedSkillIds
  }
  if (input.interestIds !== undefined) {
    reqPayload.interest_ids = input.interestIds
  }

  if (Object.keys(reqPayload).length > 0) {
    const { error } = await supabase.rpc('replace_project_requirements', {
      p_project_id: id,
      payload: reqPayload,
    })
    if (error) {
      if (error.message?.includes('forbidden')) {
        throw new ApiHttpError(403, 'FORBIDDEN', 'Cannot update project requirements')
      }
      throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
    }
  }

  const detail = await getProjectDetailById(supabase, id)
  if (!detail) throw new ApiHttpError(404, 'NOT_FOUND', 'Project not found')
  return detail
}

export async function deleteProject(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
}
