import { formatDate, formatDateTime } from '@/lib/format'
import type { Locale } from '@/lib/i18n'
import {
  getAuditChanges,
  getAuditEventTranslationKey,
  type AuditChange,
} from '@/lib/audit/presentation'
import type { AuditEvent } from '@/types/domain'

type Translate = (
  key: string,
  vars?: Record<string, string | number>
) => string

function entityFallback(entityType: string, t: Translate): string {
  const keys: Record<string, string> = {
    project: 'audit.entities.deletedProject',
    application: 'audit.entities.deletedApplication',
    student: 'audit.entities.deletedStudent',
    company: 'audit.entities.deletedCompany',
    profile: 'audit.entities.deletedUser',
    user: 'audit.entities.deletedUser',
  }
  return t(keys[entityType] ?? 'audit.entities.deletedEntity')
}

function changeValue(
  event: AuditEvent,
  change: AuditChange,
  value: string,
  locale: Locale,
  t: Translate
): string {
  if (change.field === 'applicationDeadline') return formatDate(value, locale)
  if (change.field === 'decision') return t(`audit.values.${value}`)
  if (change.field === 'status') {
    const group = event.entityType === 'project' ? 'projectStatus' : 'applicationStatus'
    return t(`teacher.${group}.${value}`)
  }
  return value
}

export function AuditEventCard({
  event,
  locale,
  t,
}: {
  event: AuditEvent
  locale: Locale
  t: Translate
}) {
  const changes = getAuditChanges(event)
  const actorName = event.actorProfileId
    ? event.actorDisplayName ?? t('audit.unknownActor')
    : t('audit.systemActor')

  return (
    <article className="rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-semibold text-foreground">
        {t(getAuditEventTranslationKey(event.action))}
      </h2>
      <p className="mt-1 break-words text-base font-medium text-foreground-secondary">
        {event.entityDisplayName ?? entityFallback(event.entityType, t)}
      </p>

      {changes.length > 0 && (
        <dl className="mt-4 space-y-3 border-l-2 border-primary pl-3">
          {changes.map((change) => (
            <div key={change.field}>
              <dt className="text-sm font-medium text-foreground-secondary">
                {t(`audit.changes.${change.field}`)}
              </dt>
              <dd className="mt-0.5 break-words text-sm text-foreground">
                {changeValue(event, change, change.before, locale, t)}
                <span aria-hidden="true"> → </span>
                <span className="sr-only">{t('audit.changes.to')}</span>
                {changeValue(event, change, change.after, locale, t)}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-4 flex flex-col gap-0.5 text-sm text-foreground-muted sm:flex-row sm:flex-wrap sm:gap-x-2">
        <span className="font-medium text-foreground-secondary">{actorName}</span>
        <span aria-hidden="true" className="hidden sm:inline">·</span>
        <time dateTime={event.createdAt}>
          {formatDateTime(event.createdAt, locale)}
        </time>
      </div>

      <details className="mt-4 border-t border-border-soft pt-3 text-sm">
        <summary className="cursor-pointer font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          {t('audit.showTechnicalDetails')}
        </summary>
        <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 rounded bg-surface-muted p-3 text-xs text-foreground-muted">
          <dt>{t('audit.technical.event')}</dt>
          <dd className="break-all font-mono">{event.action}</dd>
          <dt>{t('audit.technical.entityType')}</dt>
          <dd className="break-all font-mono">{event.entityType}</dd>
          <dt>{t('audit.technical.entityId')}</dt>
          <dd className="break-all font-mono">{event.entityId}</dd>
          <dt>{t('audit.technical.actorId')}</dt>
          <dd className="break-all font-mono">
            {event.actorProfileId ?? t('audit.technical.notAvailable')}
          </dd>
          <dt>{t('audit.technical.timestamp')}</dt>
          <dd className="break-all font-mono">{event.createdAt}</dd>
        </dl>
      </details>
    </article>
  )
}