import React from 'react'
import type { ApplicationStatus, ProjectStatus } from '@/types/domain'

type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface StatusConfig {
  label: string
  tone: StatusTone
}

const STATUS_CONFIG: Record<ApplicationStatus | ProjectStatus, StatusConfig> = {
  // ApplicationStatus
  submitted: { label: 'Submitted', tone: 'info' },
  under_review: { label: 'Under review', tone: 'warning' },
  shortlisted: { label: 'Shortlisted', tone: 'info' },
  selected: { label: 'Selected', tone: 'success' },
  not_selected: { label: 'Not selected', tone: 'error' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
  // ProjectStatus
  draft: { label: 'Draft', tone: 'neutral' },
  published: { label: 'Published', tone: 'success' },
  closed: { label: 'Closed', tone: 'warning' },
  archived: { label: 'Archived', tone: 'neutral' },
}

const toneStyles: Record<StatusTone, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  error: 'bg-error-soft text-error',
  info: 'bg-info-soft text-info',
  neutral: 'bg-surface-muted text-foreground-secondary',
}

function toFallbackLabel(status: string): string {
  return status
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Any ApplicationStatus or ProjectStatus value. Unknown strings fall back to a neutral pill. */
  status: ApplicationStatus | ProjectStatus | (string & {})
  /** Overrides the default human-readable label. */
  label?: string
}

/**
 * Labeled, colored pill for ApplicationStatus/ProjectStatus values.
 * Status is always communicated through text, never through color alone.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
  ...props
}) => {
  const config = STATUS_CONFIG[status as ApplicationStatus | ProjectStatus]
  const tone = config?.tone ?? 'neutral'
  const text = label ?? config?.label ?? toFallbackLabel(status)

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneStyles[tone]} ${className}`}
      {...props}
    >
      {text}
    </span>
  )
}
