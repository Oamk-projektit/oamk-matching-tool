import type { SupabaseClient } from '@supabase/supabase-js'
import type { Application, MatchResult } from '@/types/domain'
import type { ApplicantListItem, ApplicationWithOpportunity } from '@/types/api'
import { ApiHttpError } from '@/lib/api/auth'
import { isUuid, ValidationError } from '@/lib/validation'
import { getStudentById } from '@/lib/students/service'

type ApplicationRow = {
  id: string
  student_id: string
  opportunity_id: string
  status: string
  message: string | null
  created_at: string
  updated_at: string
}

function mapApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    student_id: row.student_id,
    opportunity_id: row.opportunity_id,
    status: row.status as Application['status'],
    message: row.message,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function parseCreateApplication(body: unknown): {
  opportunity_id: string
  message: string | null
} {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Body must be an object', [
      { field: 'body', message: 'Must be an object' },
    ])
  }
  const raw = body as Record<string, unknown>
  if (!isUuid(raw.opportunity_id)) {
    throw new ValidationError('opportunity_id must be a UUID', [
      { field: 'opportunity_id', message: 'Must be a UUID' },
    ])
  }
  return {
    opportunity_id: raw.opportunity_id,
    message:
      raw.message === undefined || raw.message === null
        ? null
        : String(raw.message),
  }
}

export async function createApplication(
  supabase: SupabaseClient,
  studentId: string,
  input: { opportunity_id: string; message: string | null }
): Promise<Application> {
  const { data: opportunity, error: oppError } = await supabase
    .from('opportunities')
    .select('id')
    .eq('id', input.opportunity_id)
    .maybeSingle()

  if (oppError) throw new ApiHttpError(500, 'INTERNAL_ERROR', oppError.message)
  if (!opportunity) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'Opportunity not found')
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      student_id: studentId,
      opportunity_id: input.opportunity_id,
      message: input.message,
      status: 'pending',
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ApiHttpError(
        409,
        'CONFLICT',
        'Application already exists for this opportunity'
      )
    }
    throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  }

  return mapApplication(data)
}

export async function listMyApplications(
  supabase: SupabaseClient,
  studentId: string
): Promise<ApplicationWithOpportunity[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(
      `
      id,
      student_id,
      opportunity_id,
      status,
      message,
      created_at,
      updated_at,
      opportunities ( id, name, type, schedule, duration )
    `
    )
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)

  return (data ?? []).map((row) => {
    const opp = Array.isArray(row.opportunities)
      ? row.opportunities[0]
      : row.opportunities
    return {
      ...mapApplication(row as ApplicationRow),
      opportunity: {
        id: opp?.id ?? row.opportunity_id,
        name: opp?.name ?? '',
        type: opp?.type ?? 'project',
        schedule: opp?.schedule ?? null,
        duration: opp?.duration ?? null,
      },
    }
  })
}

export async function listApplicantsForOpportunity(
  supabase: SupabaseClient,
  opportunityId: string
): Promise<ApplicantListItem[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(
      `
      id,
      student_id,
      opportunity_id,
      status,
      message,
      created_at,
      updated_at
    `
    )
    .eq('opportunity_id', opportunityId)

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)

  const items: ApplicantListItem[] = []

  for (const row of data ?? []) {
    const student = await getStudentById(supabase, row.student_id)
    if (!student) continue

    const { data: match } = await supabase
      .from('matches')
      .select('score, explanation')
      .eq('student_id', row.student_id)
      .eq('opportunity_id', opportunityId)
      .maybeSingle()

    items.push({
      application: {
        id: row.id,
        status: row.status as Application['status'],
        message: row.message,
        created_at: row.created_at,
      },
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        degree_program: student.degree_program,
        credits: student.credits,
      },
      match: match
        ? {
            score: match.score as number,
            explanation: match.explanation as string,
          }
        : null,
    })
  }

  items.sort((a, b) => {
    const scoreA = a.match?.score ?? -1
    const scoreB = b.match?.score ?? -1
    if (scoreB !== scoreA) return scoreB - scoreA
    return b.application.created_at.localeCompare(a.application.created_at)
  })

  return items
}

export function mapMatchRow(row: {
  id: string
  student_id: string
  opportunity_id: string
  score: number
  matched_courses: string[] | null
  missing_courses: string[] | null
  matched_skills: string[] | null
  missing_skills: string[] | null
  explanation: string
  recommendation: string
  created_at: string
  updated_at: string
}): MatchResult {
  return {
    id: row.id,
    student_id: row.student_id,
    opportunity_id: row.opportunity_id,
    score: row.score,
    matched_courses: row.matched_courses ?? [],
    missing_courses: row.missing_courses ?? [],
    matched_skills: row.matched_skills ?? [],
    missing_skills: row.missing_skills ?? [],
    explanation: row.explanation,
    recommendation: row.recommendation,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}
