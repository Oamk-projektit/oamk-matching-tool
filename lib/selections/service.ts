import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ApplicationStatus,
  SelectionDecision,
  SelectionDecisionValue,
  UserRole,
} from '@/types/domain'
import type { CreateSelectionDecisionRequest } from '@/types/api'
import { ApiHttpError, isStaff } from '@/lib/api/auth'
import {
  buildMatchSnapshotFromRow,
  computeAlgorithmRank,
  mapSelectionDecision,
} from '@/lib/selections/parse'
import { notifySelectionDecision } from '@/lib/notifications/emit'

type Actor = {
  profileId: string
  role: UserRole
  companyId: string | null
}

export function assertCanManageProjectSelections(params: {
  role: UserRole
  projectCompanyId: string
  callerCompanyId: string | null
}): void {
  if (params.role === 'admin') return
  if (
    params.role === 'company' &&
    params.callerCompanyId !== null &&
    params.callerCompanyId === params.projectCompanyId
  ) {
    return
  }
  throw new ApiHttpError(
    403,
    'FORBIDDEN',
    'Only the owning company (or admin) can manage selections'
  )
}

export function assertCanViewProjectSelections(params: {
  role: UserRole
  projectCompanyId: string
  callerCompanyId: string | null
}): void {
  if (isStaff(params.role)) return
  if (
    params.role === 'company' &&
    params.callerCompanyId !== null &&
    params.callerCompanyId === params.projectCompanyId
  ) {
    return
  }
  throw new ApiHttpError(
    403,
    'FORBIDDEN',
    'Cannot view selections for this project'
  )
}

export function assertCanViewApplicationDecision(params: {
  role: UserRole
  studentProfileId: string
  callerProfileId: string
  projectCompanyId: string
  callerCompanyId: string | null
}): void {
  if (isStaff(params.role)) return
  if (params.studentProfileId === params.callerProfileId) return
  if (
    params.role === 'company' &&
    params.callerCompanyId !== null &&
    params.callerCompanyId === params.projectCompanyId
  ) {
    return
  }
  throw new ApiHttpError(
    403,
    'FORBIDDEN',
    'Students may only view their own selection decision'
  )
}

export function assertApplicationEligibleForSelection(params: {
  applicationProjectId: string
  applicationStudentId: string
  applicationStatus: ApplicationStatus
  requestProjectId: string
  requestStudentId: string
  alreadySelectedForProject?: boolean
}): void {
  if (params.applicationProjectId !== params.requestProjectId) {
    throw new ApiHttpError(
      400,
      'VALIDATION_ERROR',
      'Application does not belong to this project'
    )
  }
  if (params.applicationStudentId !== params.requestStudentId) {
    throw new ApiHttpError(
      400,
      'VALIDATION_ERROR',
      'studentId does not match the application'
    )
  }
  if (params.applicationStatus === 'withdrawn') {
    throw new ApiHttpError(
      409,
      'CONFLICT',
      'Withdrawn applications cannot be decided'
    )
  }
  if (params.alreadySelectedForProject) {
    throw new ApiHttpError(
      409,
      'CONFLICT',
      'Student is already selected for this project'
    )
  }
}

function mapCapacityError(message: string): never {
  if (/allows at most|positions/i.test(message)) {
    throw new ApiHttpError(
      409,
      'CONFLICT',
      'No free positions left on this project'
    )
  }
  if (/withdrawn/i.test(message)) {
    throw new ApiHttpError(
      409,
      'CONFLICT',
      'Withdrawn applications cannot be decided'
    )
  }
  throw new ApiHttpError(500, 'INTERNAL_ERROR', message)
}

async function loadProjectCompanyId(
  supabase: SupabaseClient,
  projectId: string
): Promise<{ companyId: string; title: string; positions: number } | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, company_id, title, positions')
    .eq('id', projectId)
    .maybeSingle()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  if (!data) return null
  return {
    companyId: data.company_id,
    title: data.title,
    positions: data.positions,
  }
}

async function loadApplicationContext(
  supabase: SupabaseClient,
  applicationId: string
) {
  const { data, error } = await supabase
    .from('applications')
    .select(
      `
      id,
      project_id,
      student_id,
      status,
      students ( profile_id ),
      projects ( company_id, title, positions )
    `
    )
    .eq('id', applicationId)
    .maybeSingle()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  if (!data) return null

  const student = Array.isArray(data.students) ? data.students[0] : data.students
  const project = Array.isArray(data.projects) ? data.projects[0] : data.projects

  return {
    id: data.id as string,
    projectId: data.project_id as string,
    studentId: data.student_id as string,
    status: data.status as ApplicationStatus,
    studentProfileId: (student?.profile_id as string) ?? '',
    projectCompanyId: (project?.company_id as string) ?? '',
    projectTitle: (project?.title as string) ?? '',
    positions: (project?.positions as number) ?? 0,
  }
}

async function countSelected(
  supabase: SupabaseClient,
  projectId: string,
  excludeApplicationId?: string
): Promise<number> {
  let query = supabase
    .from('selection_decisions')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('decision', 'selected')

  if (excludeApplicationId) {
    query = query.neq('application_id', excludeApplicationId)
  }

  const { count, error } = await query
  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return count ?? 0
}

async function loadMatchContext(
  supabase: SupabaseClient,
  projectId: string,
  studentId: string
) {
  const { data: matches, error } = await supabase
    .from('matches')
    .select(
      `
      id,
      student_id,
      total_score,
      score_breakdown,
      explanation,
      matched_courses,
      missing_required_courses,
      matched_skills,
      missing_required_skills,
      weights_snapshot
    `
    )
    .eq('project_id', projectId)

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)

  const rows = matches ?? []
  const own = rows.find((m) => m.student_id === studentId)
  const rank = computeAlgorithmRank(
    studentId,
    rows.map((m) => ({
      studentId: m.student_id as string,
      totalScore: m.total_score as number,
    }))
  )

  if (!own) {
    return {
      matchId: null as string | null,
      matchSnapshot: null,
      weightsSnapshot: null,
      algorithmRank: rank,
    }
  }

  const built = buildMatchSnapshotFromRow({
    id: own.id as string,
    total_score: own.total_score as number,
    score_breakdown: own.score_breakdown,
    explanation: own.explanation as string,
    matched_courses: own.matched_courses as string[] | null,
    missing_required_courses: own.missing_required_courses as string[] | null,
    matched_skills: own.matched_skills as string[] | null,
    missing_required_skills: own.missing_required_skills as string[] | null,
    weights_snapshot: own.weights_snapshot,
  })

  return {
    matchId: built.matchId,
    matchSnapshot: built.matchSnapshot,
    weightsSnapshot: built.weightsSnapshot,
    algorithmRank: rank,
  }
}

export async function createOrUpdateSelection(
  supabase: SupabaseClient,
  projectId: string,
  input: CreateSelectionDecisionRequest,
  actor: Actor
): Promise<SelectionDecision> {
  const project = await loadProjectCompanyId(supabase, projectId)
  if (!project) throw new ApiHttpError(404, 'NOT_FOUND', 'Project not found')

  assertCanManageProjectSelections({
    role: actor.role,
    projectCompanyId: project.companyId,
    callerCompanyId: actor.companyId,
  })

  const application = await loadApplicationContext(supabase, input.applicationId)
  if (!application) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'Application not found')
  }

  const { data: existingDecision } = await supabase
    .from('selection_decisions')
    .select('id, decision')
    .eq('application_id', input.applicationId)
    .maybeSingle()

  // Pre-check capacity for clearer API errors (DB trigger is the hard guard).
  if (
    input.decision === 'selected' &&
    existingDecision?.decision !== 'selected'
  ) {
    const selected = await countSelected(
      supabase,
      projectId,
      input.applicationId
    )
    if (selected >= project.positions) {
      throw new ApiHttpError(
        409,
        'CONFLICT',
        'No free positions left on this project'
      )
    }
  }

  assertApplicationEligibleForSelection({
    applicationProjectId: application.projectId,
    applicationStudentId: application.studentId,
    applicationStatus: application.status,
    requestProjectId: projectId,
    requestStudentId: input.studentId,
    alreadySelectedForProject:
      input.decision === 'selected' &&
      existingDecision?.decision === 'selected' &&
      // Re-selecting the same application updates the decision — not a conflict.
      false,
  })

  const matchCtx = await loadMatchContext(
    supabase,
    projectId,
    input.studentId
  )

  const payload = {
    project_id: projectId,
    student_id: input.studentId,
    application_id: input.applicationId,
    decision: input.decision,
    decided_by: actor.profileId,
    reason: input.reason ?? null,
    decided_at: new Date().toISOString(),
    match_id: matchCtx.matchId,
    match_snapshot: (matchCtx.matchSnapshot ?? null) as never,
    weights_snapshot: (matchCtx.weightsSnapshot ?? null) as never,
    algorithm_rank: matchCtx.algorithmRank,
  }

  let row
  if (existingDecision) {
    const { data, error } = await supabase
      .from('selection_decisions')
      .update(payload)
      .eq('id', existingDecision.id)
      .select('*')
      .single()
    if (error) mapCapacityError(error.message)
    row = data
  } else {
    const { data, error } = await supabase
      .from('selection_decisions')
      .insert(payload)
      .select('*')
      .single()
    if (error) mapCapacityError(error.message)
    row = data
  }

  const applicationStatus: ApplicationStatus =
    input.decision === 'selected' ? 'selected' : 'not_selected'

  const { error: appError } = await supabase
    .from('applications')
    .update({ status: applicationStatus })
    .eq('id', input.applicationId)

  if (appError) {
    throw new ApiHttpError(500, 'INTERNAL_ERROR', appError.message)
  }

  const decision = mapSelectionDecision(row)

  // Notifications must not reverse the persisted decision on email failure.
  await notifySelectionDecision({
    studentProfileId: application.studentProfileId,
    projectId,
    projectTitle: application.projectTitle,
    decision: input.decision,
    applicationId: input.applicationId,
    selectionId: decision.id,
  }).catch(() => undefined)

  return decision
}

export async function listProjectSelections(
  supabase: SupabaseClient,
  projectId: string,
  actor: Actor
): Promise<SelectionDecision[]> {
  const project = await loadProjectCompanyId(supabase, projectId)
  if (!project) throw new ApiHttpError(404, 'NOT_FOUND', 'Project not found')

  assertCanViewProjectSelections({
    role: actor.role,
    projectCompanyId: project.companyId,
    callerCompanyId: actor.companyId,
  })

  const { data, error } = await supabase
    .from('selection_decisions')
    .select('*')
    .eq('project_id', projectId)
    .order('decided_at', { ascending: false })

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return (data ?? []).map(mapSelectionDecision)
}

export async function getApplicationDecision(
  supabase: SupabaseClient,
  applicationId: string,
  actor: {
    profileId: string
    role: UserRole
    companyId: string | null
  }
): Promise<SelectionDecision | null> {
  const application = await loadApplicationContext(supabase, applicationId)
  if (!application) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'Application not found')
  }

  assertCanViewApplicationDecision({
    role: actor.role,
    studentProfileId: application.studentProfileId,
    callerProfileId: actor.profileId,
    projectCompanyId: application.projectCompanyId,
    callerCompanyId: actor.companyId,
  })

  const { data, error } = await supabase
    .from('selection_decisions')
    .select('*')
    .eq('application_id', applicationId)
    .maybeSingle()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  if (!data) return null
  return mapSelectionDecision(data)
}

export async function shortlistApplication(
  supabase: SupabaseClient,
  applicationId: string,
  actor: Actor
) {
  const application = await loadApplicationContext(supabase, applicationId)
  if (!application) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'Application not found')
  }

  assertCanManageProjectSelections({
    role: actor.role,
    projectCompanyId: application.projectCompanyId,
    callerCompanyId: actor.companyId,
  })

  if (application.status === 'withdrawn') {
    throw new ApiHttpError(
      409,
      'CONFLICT',
      'Withdrawn applications cannot be shortlisted'
    )
  }
  if (application.status === 'selected') {
    throw new ApiHttpError(
      409,
      'CONFLICT',
      'Selected applications cannot be shortlisted'
    )
  }

  if (application.status === 'shortlisted') {
    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single()
    return {
      application: data,
      studentProfileId: application.studentProfileId,
      projectTitle: application.projectTitle,
      changed: false,
    }
  }

  const { data, error } = await supabase
    .from('applications')
    .update({ status: 'shortlisted' })
    .eq('id', applicationId)
    .select('*')
    .single()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)

  return {
    application: data,
    studentProfileId: application.studentProfileId,
    projectTitle: application.projectTitle,
    changed: true,
  }
}

export async function unshortlistApplication(
  supabase: SupabaseClient,
  applicationId: string,
  actor: Actor
) {
  const application = await loadApplicationContext(supabase, applicationId)
  if (!application) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'Application not found')
  }

  assertCanManageProjectSelections({
    role: actor.role,
    projectCompanyId: application.projectCompanyId,
    callerCompanyId: actor.companyId,
  })

  if (application.status !== 'shortlisted') {
    throw new ApiHttpError(
      409,
      'CONFLICT',
      'Application is not shortlisted'
    )
  }

  const { data, error } = await supabase
    .from('applications')
    .update({ status: 'under_review' })
    .eq('id', applicationId)
    .select('*')
    .single()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)

  return {
    application: data,
    studentProfileId: application.studentProfileId,
    projectTitle: application.projectTitle,
    changed: true,
  }
}

export type { SelectionDecisionValue }
