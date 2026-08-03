import type { SupabaseClient } from '@supabase/supabase-js'
import type { MatchingWeights, Opportunity, OpportunityType } from '@/types/domain'
import type {
  CreateOpportunityRequest,
  UpdateOpportunityRequest,
} from '@/types/api'
import { ApiHttpError } from '@/lib/api/auth'
import {
  mapOpportunityRow,
  OPPORTUNITY_SELECT,
} from '@/lib/opportunities/parse'

async function replaceOpportunityChildren(
  supabase: SupabaseClient,
  opportunityId: string,
  data: {
    required_courses?: string[]
    recommended_courses?: string[]
    required_skills?: string[]
    weights?: MatchingWeights
  }
) {
  if (data.required_courses) {
    const { error: delErr } = await supabase
      .from('opportunity_required_courses')
      .delete()
      .eq('opportunity_id', opportunityId)
    if (delErr) throw new ApiHttpError(500, 'INTERNAL_ERROR', delErr.message)
    if (data.required_courses.length > 0) {
      const { error } = await supabase.from('opportunity_required_courses').insert(
        data.required_courses.map((course_name) => ({
          opportunity_id: opportunityId,
          course_name,
        }))
      )
      if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
    }
  }

  if (data.recommended_courses) {
    const { error: delErr } = await supabase
      .from('opportunity_recommended_courses')
      .delete()
      .eq('opportunity_id', opportunityId)
    if (delErr) throw new ApiHttpError(500, 'INTERNAL_ERROR', delErr.message)
    if (data.recommended_courses.length > 0) {
      const { error } = await supabase
        .from('opportunity_recommended_courses')
        .insert(
          data.recommended_courses.map((course_name) => ({
            opportunity_id: opportunityId,
            course_name,
          }))
        )
      if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
    }
  }

  if (data.required_skills) {
    const { error: delErr } = await supabase
      .from('opportunity_required_skills')
      .delete()
      .eq('opportunity_id', opportunityId)
    if (delErr) throw new ApiHttpError(500, 'INTERNAL_ERROR', delErr.message)
    if (data.required_skills.length > 0) {
      const { error } = await supabase.from('opportunity_required_skills').insert(
        data.required_skills.map((skill_name) => ({
          opportunity_id: opportunityId,
          skill_name,
        }))
      )
      if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
    }
  }

  if (data.weights) {
    const { error } = await supabase.from('opportunity_weights').upsert(
      {
        opportunity_id: opportunityId,
        weight_courses: data.weights.courses,
        weight_skills: data.weights.skills,
        weight_language: data.weights.language,
        weight_schedule: data.weights.schedule,
        weight_credits: data.weights.credits,
      },
      { onConflict: 'opportunity_id' }
    )
    if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  }
}

export async function getOpportunityById(
  supabase: SupabaseClient,
  id: string
): Promise<Opportunity | null> {
  const { data, error } = await supabase
    .from('opportunities')
    .select(OPPORTUNITY_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  if (!data) return null
  return mapOpportunityRow(data)
}

export async function listOpportunities(
  supabase: SupabaseClient,
  filters?: { type?: OpportunityType; q?: string }
): Promise<Opportunity[]> {
  let query = supabase
    .from('opportunities')
    .select(OPPORTUNITY_SELECT)
    .order('created_at', { ascending: false })

  if (filters?.type) {
    query = query.eq('type', filters.type)
  }
  if (filters?.q) {
    const safe = filters.q.replace(/[%_,]/g, ' ').trim()
    if (safe) {
      query = query.or(`name.ilike.%${safe}%,description.ilike.%${safe}%`)
    }
  }

  const { data, error } = await query
  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  return (data ?? []).map(mapOpportunityRow)
}

export async function createOpportunity(
  supabase: SupabaseClient,
  teacherId: string,
  input: CreateOpportunityRequest
): Promise<Opportunity> {
  const { data, error } = await supabase
    .from('opportunities')
    .insert({
      teacher_id: teacherId,
      name: input.name,
      description: input.description ?? null,
      type: input.type,
      minimum_credits: input.minimum_credits ?? 0,
      required_language: input.required_language ?? 'FI',
      schedule: input.schedule ?? null,
      duration: input.duration ?? null,
      student_slots: input.student_slots ?? 1,
    })
    .select('id')
    .single()

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)

  await replaceOpportunityChildren(supabase, data.id, {
    required_courses: input.required_courses ?? [],
    recommended_courses: input.recommended_courses ?? [],
    required_skills: input.required_skills ?? [],
    weights: input.weights,
  })

  const opportunity = await getOpportunityById(supabase, data.id)
  if (!opportunity) {
    throw new ApiHttpError(
      500,
      'INTERNAL_ERROR',
      'Failed to load created opportunity'
    )
  }
  return opportunity
}

export async function updateOpportunity(
  supabase: SupabaseClient,
  id: string,
  input: UpdateOpportunityRequest
): Promise<Opportunity> {
  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch.name = input.name
  if (input.description !== undefined) patch.description = input.description
  if (input.type !== undefined) patch.type = input.type
  if (input.minimum_credits !== undefined) {
    patch.minimum_credits = input.minimum_credits
  }
  if (input.required_language !== undefined) {
    patch.required_language = input.required_language
  }
  if (input.schedule !== undefined) patch.schedule = input.schedule
  if (input.duration !== undefined) patch.duration = input.duration
  if (input.student_slots !== undefined) {
    patch.student_slots = input.student_slots
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase
      .from('opportunities')
      .update(patch)
      .eq('id', id)
    if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  }

  await replaceOpportunityChildren(supabase, id, {
    required_courses: input.required_courses,
    recommended_courses: input.recommended_courses,
    required_skills: input.required_skills,
    weights: input.weights,
  })

  const opportunity = await getOpportunityById(supabase, id)
  if (!opportunity) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'Opportunity not found')
  }
  return opportunity
}

export async function deleteOpportunity(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error, count } = await supabase
    .from('opportunities')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
  if (count === 0) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'Opportunity not found')
  }
}
