import type { SelectionDecisionValue } from '@/types/domain'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotificationIdempotent } from '@/lib/notifications/service'

/**
 * Side-effect helpers for domain events.
 * All functions swallow notification/email failures so callers can ignore them
 * without rolling back selection or application status changes.
 */

async function listTeacherProfileIds(): Promise<string[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('profiles')
      .select('id')
      .eq('role', 'teacher')
    return (data ?? []).map((row) => row.id as string)
  } catch {
    return []
  }
}

export async function notifySelectionDecision(input: {
  studentProfileId: string
  projectId: string
  projectTitle: string
  decision: SelectionDecisionValue
  applicationId: string
  selectionId: string
}): Promise<void> {
  const studentType =
    input.decision === 'selected' ? 'student_selected' : 'student_not_selected'

  await createNotificationIdempotent({
    recipientUserId: input.studentProfileId,
    type: studentType,
    entityId: input.selectionId,
    context: {
      projectTitle: input.projectTitle,
      decision: input.decision,
    },
  })

  if (input.decision === 'selected') {
    const teachers = await listTeacherProfileIds()
    await Promise.all(
      teachers.map((teacherId) =>
        createNotificationIdempotent({
          recipientUserId: teacherId,
          type: 'selection_completed_for_teacher',
          entityId: `${input.selectionId}:${teacherId}`,
          context: { projectTitle: input.projectTitle },
        }).catch(() => undefined)
      )
    )
  }
}

export async function notifyApplicationShortlisted(input: {
  studentProfileId: string
  applicationId: string
  projectTitle: string
}): Promise<void> {
  await createNotificationIdempotent({
    recipientUserId: input.studentProfileId,
    type: 'application_shortlisted',
    entityId: input.applicationId,
    context: { projectTitle: input.projectTitle },
  })
}

export async function notifyApplicationStatusChanged(input: {
  studentProfileId: string
  applicationId: string
  projectTitle: string
  status: string
}): Promise<void> {
  await createNotificationIdempotent({
    recipientUserId: input.studentProfileId,
    type: 'application_status_changed',
    entityId: `${input.applicationId}:${input.status}`,
    context: {
      projectTitle: input.projectTitle,
      status: input.status,
    },
  })
}

export async function notifyNewApplicationForCompany(input: {
  companyOwnerProfileIds: string[]
  applicationId: string
  projectTitle: string
  studentName: string
}): Promise<void> {
  await Promise.all(
    input.companyOwnerProfileIds.map((profileId) =>
      createNotificationIdempotent({
        recipientUserId: profileId,
        type: 'new_application_for_company',
        entityId: input.applicationId,
        context: {
          projectTitle: input.projectTitle,
          studentName: input.studentName,
        },
      }).catch(() => undefined)
    )
  )
}
