import React from 'react'

export type BadgeVariant = 'pending' | 'approved' | 'matched' | 'default'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  children: React.ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  pending: 'bg-warning-soft text-warning',
  approved: 'bg-success-soft text-success',
  matched: 'bg-primary-soft text-primary',
  default: 'bg-surface-muted text-foreground-secondary',
}

/**
 * @deprecated Prefer `StatusBadge` for ApplicationStatus/ProjectStatus values.
 * Kept as a thin, backward-compatible wrapper using the same design tokens.
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  className = '',
  children,
  ...props
}) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
