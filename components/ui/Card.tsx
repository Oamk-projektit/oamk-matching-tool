import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const Card: React.FC<CardProps> = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`rounded-lg border border-border bg-surface p-6 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<CardProps> = ({ className = '', children, ...props }) => (
  <div className={`mb-4 border-b border-border pb-4 ${className}`} {...props}>
    {children}
  </div>
)

export const CardTitle: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => <h2 className={`text-xl font-semibold text-foreground ${className}`}>{children}</h2>

export const CardContent: React.FC<CardProps> = ({ className = '', children, ...props }) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
)
