import React, { useId } from 'react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Every field needs a visible label; it is programmatically linked via htmlFor/id. */
  label: string
  options: SelectOption[]
  error?: string
  helperText?: string
  /** Rendered as a disabled first option when no value should be pre-selected. */
  placeholder?: string
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  helperText,
  placeholder,
  id,
  className = '',
  required,
  value,
  defaultValue,
  ...props
}) => {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const errorId = `${selectId}-error`
  const helperId = `${selectId}-helper`
  // Only fall back to an empty uncontrolled default when the caller doesn't already
  // control the value, so we never pass both `value` and `defaultValue` to <select>.
  const isControlled = value !== undefined
  const resolvedDefaultValue =
    !isControlled && defaultValue === undefined && placeholder ? '' : defaultValue

  return (
    <div className="w-full">
      <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && (
          <span className="text-error" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      <select
        id={selectId}
        required={required}
        value={value}
        defaultValue={isControlled ? undefined : resolvedDefaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={`w-full rounded-md border bg-surface px-3 py-2 text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-foreground-disabled ${
          error ? 'border-error' : 'border-border'
        } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-error" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1.5 text-sm text-foreground-muted">
          {helperText}
        </p>
      )}
    </div>
  )
}
