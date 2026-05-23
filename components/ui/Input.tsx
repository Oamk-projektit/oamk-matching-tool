import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#171717] mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 border rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-transparent ${
          error ? 'border-[#ef4444]' : 'border-[#e0e0e0]'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-[#ef4444] text-sm mt-1">{error}</p>}
      {helperText && !error && <p className="text-[#666666] text-sm mt-1">{helperText}</p>}
    </div>
  )
}
