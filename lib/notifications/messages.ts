import type {
  Notification,
  NotificationType,
  PreferredLanguage,
  SelectionDecisionValue,
} from '@/types/domain'
import type { Tables } from '@/types/database'

type NotificationRow = Tables<'notifications'>

export type NotificationTemplateContext = {
  projectTitle?: string
  studentName?: string
  status?: string
  decision?: SelectionDecisionValue
  deadline?: string
}

type LocalizedCopy = { title: string; body: string }

const TEMPLATES: Record<
  NotificationType,
  (ctx: NotificationTemplateContext, lang: PreferredLanguage) => LocalizedCopy
> = {
  application_received: (ctx, lang) =>
    lang === 'fi'
      ? {
          title: 'Uusi hakemus',
          body: `${ctx.studentName ?? 'Opiskelija'} haki projektiin "${ctx.projectTitle ?? ''}".`,
        }
      : {
          title: 'New application',
          body: `${ctx.studentName ?? 'A student'} applied to "${ctx.projectTitle ?? ''}".`,
        },

  new_application_for_company: (ctx, lang) =>
    TEMPLATES.application_received(ctx, lang),

  application_status_changed: (ctx, lang) =>
    lang === 'fi'
      ? {
          title: 'Hakemuksen tila muuttui',
          body: `Hakemuksesi projektiin "${ctx.projectTitle ?? ''}" on nyt: ${ctx.status ?? ''}.`,
        }
      : {
          title: 'Application status updated',
          body: `Your application to "${ctx.projectTitle ?? ''}" is now ${ctx.status ?? ''}.`,
        },

  application_shortlisted: (ctx, lang) =>
    lang === 'fi'
      ? {
          title: 'Pääsit shortlistalle',
          body: `Hakemuksesi projektiin "${ctx.projectTitle ?? ''}" on shortlistattu.`,
        }
      : {
          title: 'You were shortlisted',
          body: `Your application to "${ctx.projectTitle ?? ''}" was shortlisted.`,
        },

  student_selected: (ctx, lang) =>
    lang === 'fi'
      ? {
          title: 'Sinut valittiin',
          body: `Sinut valittiin projektiin "${ctx.projectTitle ?? ''}".`,
        }
      : {
          title: 'You were selected',
          body: `You were selected for "${ctx.projectTitle ?? ''}".`,
        },

  student_not_selected: (ctx, lang) =>
    lang === 'fi'
      ? {
          title: 'Ei valittu',
          body: `Sinua ei valittu projektiin "${ctx.projectTitle ?? ''}".`,
        }
      : {
          title: 'Not selected',
          body: `You were not selected for "${ctx.projectTitle ?? ''}".`,
        },

  selection_decided: (ctx, lang) =>
    ctx.decision === 'not_selected'
      ? TEMPLATES.student_not_selected(ctx, lang)
      : TEMPLATES.student_selected(ctx, lang),

  selection_completed_for_teacher: (ctx, lang) =>
    lang === 'fi'
      ? {
          title: 'Valinta tehty',
          body: `Yritys teki valinnan projektiin "${ctx.projectTitle ?? ''}".`,
        }
      : {
          title: 'Selection completed',
          body: `A company completed a selection for "${ctx.projectTitle ?? ''}".`,
        },

  project_updated: (ctx, lang) =>
    lang === 'fi'
      ? {
          title: 'Projekti päivitetty',
          body: `Projekti "${ctx.projectTitle ?? ''}" päivitettiin.`,
        }
      : {
          title: 'Project updated',
          body: `Project "${ctx.projectTitle ?? ''}" was updated.`,
        },

  project_published: (ctx, lang) =>
    lang === 'fi'
      ? {
          title: 'Uusi projekti julkaistu',
          body: `Projekti "${ctx.projectTitle ?? ''}" on julkaistu.`,
        }
      : {
          title: 'New project published',
          body: `Project "${ctx.projectTitle ?? ''}" has been published.`,
        },

  application_deadline_approaching: (ctx, lang) =>
    lang === 'fi'
      ? {
          title: 'Hakuajan päättyminen lähestyy',
          body: `Projektin "${ctx.projectTitle ?? ''}" haku päättyy ${ctx.deadline ?? 'pian'}.`,
        }
      : {
          title: 'Application deadline approaching',
          body: `Applications for "${ctx.projectTitle ?? ''}" close ${ctx.deadline ?? 'soon'}.`,
        },

  match_ready: (ctx, lang) =>
    lang === 'fi'
      ? {
          title: 'Match-tulos valmis',
          body: `Matchausprojektille "${ctx.projectTitle ?? ''}" on valmis.`,
        }
      : {
          title: 'Match ready',
          body: `Matching for "${ctx.projectTitle ?? ''}" is ready.`,
        },
}

/** UI preferred_language drives notification locale — not project language or skills. */
export function buildNotificationCopy(
  type: NotificationType,
  language: PreferredLanguage,
  context: NotificationTemplateContext = {}
): LocalizedCopy {
  const builder = TEMPLATES[type]
  return builder(context, language)
}

/** @deprecated Prefer buildNotificationCopy with preferred_language. */
export function buildApplicationReceivedContent(input: {
  studentName: string
  opportunityName: string
}): string {
  return buildNotificationCopy('application_received', 'en', {
    studentName: input.studentName,
    projectTitle: input.opportunityName,
  }).body
}

/** @deprecated Prefer buildNotificationCopy. */
export function buildApplicationStatusContent(input: {
  opportunityName: string
  status: string
}): string {
  return buildNotificationCopy('application_status_changed', 'en', {
    projectTitle: input.opportunityName,
    status: input.status,
  }).body
}

/** @deprecated Prefer buildNotificationCopy. */
export function buildMatchReadyContent(input: { count: number }): string {
  const n = input.count
  return `Matching finished: ${n} opportunit${n === 1 ? 'y' : 'ies'} scored for you.`
}

export function mapNotificationRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    profileId: row.profile_id,
    type: row.type as NotificationType,
    language: row.language === 'en' ? 'en' : 'fi',
    title: row.title,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
    idempotencyKey: row.idempotency_key ?? null,
  }
}

export function buildIdempotencyKey(parts: {
  type: NotificationType
  profileId: string
  entityId: string
}): string {
  return `${parts.type}:${parts.profileId}:${parts.entityId}`
}
