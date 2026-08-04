import React from 'react'

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** e.g. "Loading projects..." — shown to sighted users and announced to assistive tech. */
  message?: string
}

/** Accessible loading indicator; announces its message via role="status". */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  className = '',
  ...props
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 py-12 text-center ${className}`}
      {...props}
    >
      <svg
        className="h-8 w-8 animate-spin text-primary"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
        />
      </svg>
      <p className="text-sm text-foreground-muted">{message}</p>
    </div>
  )
}
