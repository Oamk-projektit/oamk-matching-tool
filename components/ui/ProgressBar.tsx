import React from 'react'

export type ProgressBarTone = 'match' | 'primary'

/** Matching score thresholds — keep in sync with DESIGN.md "Matching score colors". */
export const MATCH_HIGH_THRESHOLD = 70
export const MATCH_MEDIUM_THRESHOLD = 40

export interface ProgressBarProps {
  /** 0-100 */
  value: number
  label?: string
  /** 'match' colors the bar by high/medium/low match thresholds; 'primary' always uses the brand color. */
  tone?: ProgressBarTone
  showPercentage?: boolean
  className?: string
}

interface MatchLevel {
  barClass: string
  textClass: string
  text: string
}

function getMatchLevel(value: number): MatchLevel {
  if (value >= MATCH_HIGH_THRESHOLD) {
    return { barClass: 'bg-success', textClass: 'text-success', text: 'High match' }
  }
  if (value >= MATCH_MEDIUM_THRESHOLD) {
    return { barClass: 'bg-warning', textClass: 'text-warning', text: 'Potential match' }
  }
  return { barClass: 'bg-foreground-muted', textClass: 'text-foreground-muted', text: 'Low match' }
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  tone = 'primary',
  showPercentage = true,
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(value)))
  const match = tone === 'match' ? getMatchLevel(clamped) : null
  const valueText = match ? `${clamped} percent, ${match.text}` : `${clamped} percent`

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
          {label && <span className="font-medium text-foreground">{label}</span>}
          {showPercentage && (
            <span className={`font-medium ${match ? match.textClass : 'text-foreground-secondary'}`}>
              {match ? `${clamped}% · ${match.text}` : `${clamped}%`}
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={valueText}
        aria-label={label ? undefined : 'Progress'}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-muted"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${match ? match.barClass : 'bg-primary'}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
