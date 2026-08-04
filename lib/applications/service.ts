import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Application,
  ApplicationStatus,
  ScoreBreakdown,
  UserRole,
} from '@/types/domain'
import type { ApplicantListItem, ApplicationWithProject } from '@/types/api'
import { ApiHttpError, isStaff } from '@/lib/api/auth'
import {
  assertApplicationIsActive,
  assertApplicationWindow,
  assertCompanyStatusTransition,
  mapApplication,
} from '@/lib/applications/parse'
import { getProjectDetailById } from '@/lib/projects/service'

export async function createApplication(
  supabase: SupabaseClient,
  studentId: string,
  input: { projectId: string; message?: string | null }
): Promise<Application> {
  const project = await getProjectDetailById(supabase, input.projectId)
  if (!project) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'Project not found')
  }

  assertApplicationWindow(project)

  const { data, error } = await supabase
    .from('applications')
    .insert({
      student_id: studentId,
      project_id: input.projectId,
      message: input.message ?? null,
      status: 'submitted',
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ApiHttpError(
        409,
        'CONFLICT',
        'Application already exists for this project'
      )
    }
    throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  }

  return mapApplication(data)
}

export async function getApplicationById(
  supabase: SupabaseClient,
  id: string
): Promise<
  | (Application & {
      projectCompanyId: string
      studentProfileId: string
      projectTitle: string
    })
  | null
> {
  const { data, error } = await supabase
    .from('applications')
    .select(
      `
      id,
      project_id,
      student_id,
      status,
      message,
      submitted_at,
      updated_at,
      projects ( company_id, title ),
      students ( profile_id )
    `
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  if (!data) return null

  const project = Array.isArray(data.projects) ? data.projects[0] : data.projects
  const student = Array.isArray(data.students) ? data.students[0] : data.students

  return {
    ...mapApplication(data),
    projectCompanyId: project?.company_id ?? '',
    projectTitle: project?.title ?? '',
    studentProfileId: student?.profile_id ?? '',
  }
}

export async function listStudentApplications(
  supabase: SupabaseClient,
  studentId: string
): Promise<ApplicationWithProject[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(
      `
      id,
      project_id,
      student_id,
      status,
      message,
      submitted_at,
      updated_at,
      projects ( id, title, project_type, status, application_deadline )
    `
    )
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false })

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)

  return (data ?? []).map((row) => {
    const project = Array.isArray(row.projects) ? row.projects[0] : row.projects
    return {
      ...mapApplication(row),
      project: {
        id: project?.id ?? row.project_id,
        title: project?.title ?? '',
        projectType: (project?.project_type ??
          'company_project') as ApplicationWithProject['project']['projectType'],
        status: (project?.status ??
          'published') as ApplicationWithProject['project']['status'],
        applicationDeadline: project?.application_deadline ?? null,
      },
    }
  })
}

export async function withdrawApplication(
  supabase: SupabaseClient,
  id: string,
  actor: { profileId: string; role: UserRole }
): Promise<Application> {
  const existing = await getApplicationById(supabase, id)
  if (!existing) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'Application not found')
  }

  if (
    actor.role !== 'admin' &&
    existing.studentProfileId !== actor.profileId
  ) {
    throw new ApiHttpError(
      403,
      'FORBIDDEN',
      'Only the applying student can withdraw'
    )
  }

  if (existing.status === 'withdrawn') {
    return existing
  }

  assertApplicationIsActive(existing.status, 'withdraw')

  const { data, error } = await supabase
    .from('applications')
    .update({ status: 'withdrawn' })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return mapApplication(data)
}

export async function updateApplicationStatus(
  supabase: SupabaseClient,
  id: string,
  status: ApplicationStatus,
  actor: {
    profileId: string
    role: UserRole
    companyId: string | null
  }
): Promise<Application> {
  const existing = await getApplicationById(supabase, id)
  if (!existing) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'Application not found')
  }

  if (status === 'withdrawn') {
    return withdrawApplication(supabase, id, {
      profileId: actor.profileId,
      role: actor.role,
    })
  }

  if (existing.status === 'withdrawn') {
    assertApplicationIsActive(existing.status, 'process')
  }

  if (status === 'selected') {
    throw new ApiHttpError(
      400,
      'VALIDATION_ERROR',
      'Final selection must go through the selection API'
    )
  }

  const isOwnerCompany =
    actor.role === 'company' &&
    actor.companyId !== null &&
    actor.companyId === existing.projectCompanyId
  const isAdmin = actor.role === 'admin'

  if (!isOwnerCompany && !isAdmin) {
    throw new ApiHttpError(
      403,
      'FORBIDDEN',
      'Cannot update this application status'
    )
  }

  if (isOwnerCompany) {
    assertCompanyStatusTransition(status)
  }

  const { data, error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return mapApplication(data)
}

export async function listApplicantsForProject(
  supabase: SupabaseClient,
  projectId: string
): Promise<ApplicantListItem[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(
      `
      id,
      project_id,
      student_id,
      status,
      message,
      submitted_at,
      updated_at,
      students (
        id,
        degree_programme,
        department,
        study_credits,
        profiles ( display_name, email )
      )
    `
    )
    .eq('project_id', projectId)

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)

  const items: ApplicantListItem[] = []

  for (const row of data ?? []) {
    const studentRel = Array.isArray(row.students)
      ? row.students[0]
      : row.students
    if (!studentRel) continue

    const profileRel = Array.isArray(studentRel.profiles)
      ? studentRel.profiles[0]
      : studentRel.profiles

    const { data: match } = await supabase
      .from('matches')
      .select('total_score, explanation, score_breakdown')
      .eq('student_id', row.student_id)
      .eq('project_id', projectId)
      .maybeSingle()

    items.push({
      application: {
        id: row.id,
        status: row.status as Application['status'],
        message: row.message,
        submittedAt: row.submitted_at,
      },
      student: {
        id: studentRel.id,
        degreeProgramme: studentRel.degree_programme,
        department: studentRel.department,
        studyCredits: studentRel.study_credits,
      },
      profile: {
        displayName: profileRel?.display_name ?? '',
        email: profileRel?.email ?? '',
      },
      match: match
        ? {
            totalScore: match.total_score as number,
            explanation: (match.explanation as string) ?? '',
            scoreBreakdown: (match.score_breakdown ?? {}) as ScoreBreakdown,
          }
        : null,
    })
  }

  items.sort((a, b) => {
    const scoreA = a.match?.totalScore ?? -1
    const scoreB = b.match?.totalScore ?? -1
    if (scoreB !== scoreA) return scoreB - scoreA
    return b.application.submittedAt.localeCompare(a.application.submittedAt)
  })

  return items
}

export function assertCanViewApplicants(params: {
  role: UserRole
  projectCompanyId: string
  callerCompanyId: string | null
}): void {
  if (isStaff(params.role) || params.role === 'admin') return
  if (
    params.role === 'company' &&
    params.callerCompanyId === params.projectCompanyId
  ) {
    return
  }
  throw new ApiHttpError(
    403,
    'FORBIDDEN',
    'Only project company, teachers, or admins can view applicants'
  )
}

export function assertCanViewApplication(params: {
  role: UserRole
  studentProfileId: string
  projectCompanyId: string
  callerProfileId: string
  callerCompanyId: string | null
}): void {
  if (isStaff(params.role) || params.role === 'admin') return
  if (params.studentProfileId === params.callerProfileId) return
  if (
    params.role === 'company' &&
    params.callerCompanyId === params.projectCompanyId
  ) {
    return
  }
  throw new ApiHttpError(403, 'FORBIDDEN', 'Cannot view this application')
}
