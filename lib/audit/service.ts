import type { SupabaseClient } from '@supabase/supabase-js'
import { ApiHttpError } from '@/lib/api/auth'
import type { AuditEvent } from '@/types/domain'

type AuditRow = {
  id: string
  actor_profile_id: string | null
  action: string
  entity_type: string
  entity_id: string
  old_values: unknown
  new_values: unknown
  created_at: string
}

export type AuditNameLookups = {
  profiles: Map<string, string>
  projects: Map<string, string>
  students: Map<string, string>
  companies: Map<string, string>
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null
}

function stringValue(
  values: Record<string, unknown> | null,
  key: string
): string | null {
  const value = values?.[key]
  return typeof value === 'string' && value.trim() ? value : null
}

function unique(values: Array<string | null>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

function relatedId(event: AuditEvent, key: string): string | null {
  return stringValue(event.newValues, key) ?? stringValue(event.oldValues, key)
}

export function resolveAuditEntityName(
  event: AuditEvent,
  lookups: AuditNameLookups
): string | null {
  const snapshotName =
    stringValue(event.newValues, 'title') ??
    stringValue(event.oldValues, 'title') ??
    stringValue(event.newValues, 'display_name') ??
    stringValue(event.oldValues, 'display_name') ??
    stringValue(event.newValues, 'name') ??
    stringValue(event.oldValues, 'name')

  if (event.entityType === 'project') {
    return lookups.projects.get(event.entityId) ?? snapshotName
  }
  if (event.entityType === 'student') {
    return lookups.students.get(event.entityId) ?? snapshotName
  }
  if (event.entityType === 'company') {
    return lookups.companies.get(event.entityId) ?? snapshotName
  }
  if (event.entityType === 'profile' || event.entityType === 'user') {
    return lookups.profiles.get(event.entityId) ?? snapshotName
  }
  if (
    event.entityType === 'application' ||
    event.entityType === 'match' ||
    event.entityType === 'selection_decision'
  ) {
    const projectId = relatedId(event, 'project_id')
    const studentId = relatedId(event, 'student_id')
    const projectName = projectId && lookups.projects.get(projectId)
    const studentName = studentId && lookups.students.get(studentId)
    if (studentName && projectName) return `${studentName} · ${projectName}`
    return studentName || projectName || null
  }
  if (event.entityType === 'notification') {
    return snapshotName
  }
  return snapshotName
}

export function enrichAuditEvent(
  event: AuditEvent,
  lookups: AuditNameLookups
): AuditEvent {
  return {
    ...event,
    actorDisplayName:
      (event.actorProfileId && lookups.profiles.get(event.actorProfileId)) ?? null,
    entityDisplayName: resolveAuditEntityName(event, lookups),
  }
}

function mapAuditEvent(row: AuditRow): AuditEvent {
  return {
    id: row.id,
    actorProfileId: row.actor_profile_id,
    actorDisplayName: null,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityDisplayName: null,
    oldValues: objectValue(row.old_values),
    newValues: objectValue(row.new_values),
    createdAt: row.created_at,
  }
}

function throwQueryError(error: { message: string } | null): void {
  if (error) throw new ApiHttpError(500, 'INTERNAL_ERROR', error.message)
}

export async function listAuditEvents(
  supabase: SupabaseClient,
  limit: number
): Promise<AuditEvent[]> {
  const { data, error } = await supabase
    .from('audit_events')
    .select(
      'id, actor_profile_id, action, entity_type, entity_id, old_values, new_values, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  throwQueryError(error)
  const events = ((data ?? []) as AuditRow[]).map(mapAuditEvent)

  const profileIds = unique([
    ...events.map((event) => event.actorProfileId),
    ...events
      .filter((event) => event.entityType === 'profile' || event.entityType === 'user')
      .map((event) => event.entityId),
  ])
  const projectIds = unique(
    events.flatMap((event) => [
      event.entityType === 'project' ? event.entityId : null,
      relatedId(event, 'project_id'),
    ])
  )
  const studentIds = unique(
    events.flatMap((event) => [
      event.entityType === 'student' ? event.entityId : null,
      relatedId(event, 'student_id'),
    ])
  )
  const companyIds = unique(
    events.map((event) =>
      event.entityType === 'company' ? event.entityId : null
    )
  )

  const [profileResult, projectResult, studentResult, companyResult] =
    await Promise.all([
      profileIds.length
        ? supabase.from('profiles').select('id, display_name').in('id', profileIds)
        : Promise.resolve({ data: [], error: null }),
      projectIds.length
        ? supabase.from('projects').select('id, title').in('id', projectIds)
        : Promise.resolve({ data: [], error: null }),
      studentIds.length
        ? supabase
            .from('students')
            .select('id, profiles ( display_name )')
            .in('id', studentIds)
        : Promise.resolve({ data: [], error: null }),
      companyIds.length
        ? supabase.from('companies').select('id, name').in('id', companyIds)
        : Promise.resolve({ data: [], error: null }),
    ])

  throwQueryError(profileResult.error)
  throwQueryError(projectResult.error)
  throwQueryError(studentResult.error)
  throwQueryError(companyResult.error)

  const lookups: AuditNameLookups = {
    profiles: new Map(
      (profileResult.data ?? []).map((row) => [row.id, row.display_name])
    ),
    projects: new Map(
      (projectResult.data ?? []).map((row) => [row.id, row.title])
    ),
    students: new Map(
      (studentResult.data ?? []).flatMap((row) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
        return profile?.display_name ? [[row.id, profile.display_name]] : []
      })
    ),
    companies: new Map(
      (companyResult.data ?? []).map((row) => [row.id, row.name])
    ),
  }

  return events.map((event) => enrichAuditEvent(event, lookups))
}