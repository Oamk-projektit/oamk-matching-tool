import React from 'react'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'pending' | 'approved' | 'matched' | 'default'
  children: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  className = '',
  children,
  ...props
}) => {
  const variantStyles = {
    pending: 'bg-[#f59e0b] text-white',
    approved: 'bg-[#22c55e] text-white',
    matched: 'bg-[#005EB8] text-white',
    default: 'bg-[#e0e0e0] text-[#171717]',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
