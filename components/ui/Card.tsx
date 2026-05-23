import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const Card: React.FC<CardProps> = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`bg-white border border-[#e0e0e0] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<CardProps> = ({ className = '', children, ...props }) => (
  <div className={`mb-4 pb-4 border-b border-[#e0e0e0] ${className}`} {...props}>
    {children}
  </div>
)

export const CardTitle: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => <h2 className={`text-xl font-semibold text-[#171717] ${className}`}>{children}</h2>

export const CardContent: React.FC<CardProps> = ({ className = '', children, ...props }) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
)
