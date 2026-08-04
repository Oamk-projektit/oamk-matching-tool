import type {
  Application,
  ApplicationStatus,
  Project,
  UserRole,
} from '@/types/domain'
import type { CreateApplicationRequest } from '@/types/api'
import {
  assertApplicationStatus,
  requireObject,
} from '@/lib/validation/domain'
import { isUuid, ValidationError } from '@/lib/validation'
import { ApiHttpError } from '@/lib/api/auth'

/** Statuses that still allow student withdrawal. */
export const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = [
  'submitted',
  'under_review',
  'shortlisted',
]

/** Company may set processing statuses; final selected goes through selection API. */
export const COMPANY_ALLOWED_STATUSES: ApplicationStatus[] = [
  'under_review',
  'shortlisted',
  'not_selected',
]

export const APPLICATION_AUDIT_ACTIONS = [
  'application_created',
  'application_status_changed',
  'application_withdrawn',
] as const

export function parseCreateApplication(body: unknown): CreateApplicationRequest {
  const raw = requireObject(body)
  // studentId is never accepted from the body — identity comes from the session.
  if (raw.studentId !== undefined) {
    throw new ValidationError('studentId must not be provided', [
      {
        field: 'studentId',
        message:
          'Applications can only be submitted for the authenticated student',
      },
    ])
  }
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

export function assertCanSubmitApplication(role: UserRole): void {
  if (role === 'student') return
  throw new ApiHttpError(403, 'FORBIDDEN', 'Only students can apply')
}

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

export function assertApplicationIsActive(
  status: ApplicationStatus,
  action: 'withdraw' | 'process' = 'withdraw'
): void {
  if (status === 'withdrawn') {
    throw new ApiHttpError(
      400,
      'VALIDATION_ERROR',
      action === 'process'
        ? 'Withdrawn applications cannot be processed for selection'
        : 'Application is already withdrawn'
    )
  }
  if (action === 'withdraw' && !ACTIVE_APPLICATION_STATUSES.includes(status)) {
    throw new ApiHttpError(
      400,
      'VALIDATION_ERROR',
      'Only active applications can be withdrawn'
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
