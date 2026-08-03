import type { SupabaseClient } from '@supabase/supabase-js'
import type { MatchResult } from '@/types/domain'
import { ApiHttpError } from '@/lib/api/auth'
import { isUuid, ValidationError } from '@/lib/validation'
import { getStudentById } from '@/lib/students/service'
import {
  getOpportunityById,
  listOpportunities,
} from '@/lib/opportunities/service'
import { computeMatch, rankMatches } from '@/lib/matching/engine'
import { mapMatchRow } from '@/lib/applications/service'
import { createAdminClient } from '@/lib/supabase/admin'

export function parseRunMatchesBody(body: unknown): {
  opportunity_ids?: string[]
} {
  if (body === undefined || body === null || body === '') return {}
  if (typeof body !== 'object') {
    throw new ValidationError('Body must be an object', [
      { field: 'body', message: 'Must be an object' },
    ])
  }
  const raw = body as Record<string, unknown>
  if (raw.opportunity_ids === undefined) return {}
  if (!Array.isArray(raw.opportunity_ids)) {
    throw new ValidationError('opportunity_ids must be an array', [
      { field: 'opportunity_ids', message: 'Must be an array of UUIDs' },
    ])
  }
  const ids = raw.opportunity_ids.map((id, index) => {
    if (!isUuid(id)) {
      throw new ValidationError(`opportunity_ids[${index}] must be a UUID`, [
        {
          field: `opportunity_ids[${index}]`,
          message: 'Must be a UUID',
        },
      ])
    }
    return id
  })
  return { opportunity_ids: ids }
}

export async function runMatchingForStudent(
  supabase: SupabaseClient,
  studentId: string,
  opportunityIds?: string[]
): Promise<MatchResult[]> {
  const student = await getStudentById(supabase, studentId)
  if (!student) throw new ApiHttpError(404, 'NOT_FOUND', 'Student not found')

  let opportunities = await listOpportunities(supabase)
  if (opportunityIds && opportunityIds.length > 0) {
    const allowed = new Set(opportunityIds)
    opportunities = opportunities.filter((o) => allowed.has(o.id))
  }

  const computed = rankMatches(
    opportunities.map((opportunity) => computeMatch(student, opportunity))
  )

  // Persist with service role so students can store own match results
  // even when RLS write policies are staff-oriented.
  const admin = createAdminClient()

  const persisted: MatchResult[] = []
  for (const match of computed) {
    const { data, error } = await admin
      .from('matches')
      .upsert(
        {
          student_id: match.student_id,
          opportunity_id: match.opportunity_id,
          score: match.score,
          matched_courses: match.matched_courses,
          missing_courses: match.missing_courses,
          matched_skills: match.matched_skills,
          missing_skills: match.missing_skills,
          explanation: match.explanation,
          recommendation: match.recommendation,
        },
        { onConflict: 'student_id,opportunity_id' }
      )
      .select('*')
      .single()

    if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
    persisted.push(mapMatchRow(data))
  }

  return persisted.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.opportunity_id.localeCompare(b.opportunity_id)
  })
}

export async function listMatchesForStudent(
  supabase: SupabaseClient,
  studentId: string,
  limit = 10
): Promise<MatchResult[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('student_id', studentId)
    .order('score', { ascending: false })
    .limit(limit)

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return (data ?? []).map(mapMatchRow)
}

export async function listMatchesForOpportunity(
  supabase: SupabaseClient,
  opportunityId: string
): Promise<MatchResult[]> {
  const opportunity = await getOpportunityById(supabase, opportunityId)
  if (!opportunity) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'Opportunity not found')
  }

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .order('score', { ascending: false })

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return (data ?? []).map(mapMatchRow)
}
