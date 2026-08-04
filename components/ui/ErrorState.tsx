import React from 'react'
import { Button } from './Button'

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  /** Use plain language, e.g. "Projects could not be loaded. Try again." */
  message: string
  retryLabel?: string
  onRetry?: () => void
}

/** Communicates failures in plain language, per DESIGN.md error state guidance. */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  retryLabel = 'Try again',
  onRetry,
  className = '',
  ...props
}) => {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center rounded-lg border border-border bg-surface px-6 py-12 text-center ${className}`}
      {...props}
    >
      <svg
        className="mb-4 h-8 w-8 text-error"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-1-9a1 1 0 1 1 2 0v3a1 1 0 1 1-2 0V9Zm1 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          clipRule="evenodd"
        />
      </svg>
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-foreground-muted">{message}</p>
      {onRetry && (
        <div className="mt-5">
          <Button variant="secondary" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
