import React from 'react'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  /** e.g. a Button telling the user what to do next. */
  action?: React.ReactNode
  icon?: React.ReactNode
}

/** Tells the user what happened and what to do next, per DESIGN.md empty state guidance. */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center ${className}`}
      {...props}
    >
      {icon && <div className="mb-4 text-foreground-muted">{icon}</div>}
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-foreground-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
