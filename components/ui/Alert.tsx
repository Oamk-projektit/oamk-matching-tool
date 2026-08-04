import React from 'react'

export type AlertVariant = 'error' | 'success' | 'info' | 'warning'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
  children: React.ReactNode
}

const variantStyles: Record<AlertVariant, string> = {
  error: 'bg-error-soft text-error border-error/20',
  success: 'bg-success-soft text-success border-success/20',
  info: 'bg-info-soft text-info border-info/20',
  warning: 'bg-warning-soft text-warning border-warning/20',
}

/** Inline banner for form-level and page-level messages (errors, confirmations, hints). */
export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      role="alert"
      className={`rounded-md border px-4 py-3 text-sm ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
