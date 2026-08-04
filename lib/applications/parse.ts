import type { Application, ApplicationStatus, Project } from '@/types/domain'
import type { CreateApplicationRequest } from '@/types/api'
import {
  assertApplicationStatus,
  requireObject,
} from '@/lib/validation/domain'
import { isUuid, ValidationError } from '@/lib/validation'
import { ApiHttpError } from '@/lib/api/auth'

export function parseCreateApplication(body: unknown): CreateApplicationRequest {
  const raw = requireObject(body)
  if (!isUuid(raw.projectId)) {
    throw new ValidationError('projectId must be a UUID', [
      { field: 'projectId', message: 'Must be a UUID' },
    ])
  }
  return {
    projectId: raw.projectId,
    message:
      raw.message === undefined || raw.message === null
        ? null
        : String(raw.message),
  }
}

export function parseUpdateApplicationStatus(body: unknown): {
  status: ApplicationStatus
} {
  const raw = requireObject(body)
  return { status: assertApplicationStatus(raw.status) }
}

/** Company may set processing statuses; final selected goes through selection API. */
export const COMPANY_ALLOWED_STATUSES: ApplicationStatus[] = [
  'under_review',
  'shortlisted',
  'not_selected',
]

export function assertCompanyStatusTransition(
  status: ApplicationStatus
): void {
  if (!COMPANY_ALLOWED_STATUSES.includes(status)) {
    throw new ApiHttpError(
      400,
      'VALIDATION_ERROR',
      'Company may set under_review, shortlisted, or not_selected; use selection API for final selected'
    )
  }
}

/**
 * Pure rule: student may apply only to published projects within the application window.
 */
export function assertApplicationWindow(
  project: Pick<
    Project,
    'status' | 'applicationStart' | 'applicationDeadline'
  >,
  now: Date = new Date()
): void {
  if (project.status !== 'published') {
    throw new ApiHttpError(
      400,
      'VALIDATION_ERROR',
      'Can only apply to published projects'
    )
  }

  const today = toDateOnly(now)

  if (project.applicationStart) {
    const start = project.applicationStart
    if (today < start) {
      throw new ApiHttpError(
        400,
        'VALIDATION_ERROR',
        'Application period has not started'
      )
    }
  }

  if (project.applicationDeadline) {
    const deadline = project.applicationDeadline
    if (today > deadline) {
      throw new ApiHttpError(
        400,
        'VALIDATION_ERROR',
        'Application deadline has passed'
      )
    }
  }
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10)
}

type ApplicationRow = {
  id: string
  project_id: string
  student_id: string
  status: string
  message: string | null
  submitted_at: string
  updated_at: string
}

export function mapApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    projectId: row.project_id,
    studentId: row.student_id,
    status: row.status as ApplicationStatus,
    message: row.message,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
  }
}
