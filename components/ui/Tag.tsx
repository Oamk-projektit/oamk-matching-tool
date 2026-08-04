import React from 'react'

export type TagVariant = 'default' | 'primary' | 'muted'

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant
  children: React.ReactNode
}

const variantStyles: Record<TagVariant, string> = {
  default: 'bg-surface-muted text-foreground border border-border',
  primary: 'bg-primary-soft text-primary border border-primary/20',
  muted: 'bg-transparent text-foreground-muted border border-border-soft',
}

/** Small pill used for skills, courses and other short keyword tags. */
export const Tag: React.FC<TagProps> = ({
  variant = 'default',
  className = '',
  children,
  ...props
}) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
