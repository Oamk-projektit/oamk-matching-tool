import React from 'react'

export interface FormSectionProps extends React.HTMLAttributes<HTMLElement> {
  title: string
  description?: string
  children: React.ReactNode
}

/** Groups related form fields under a title and short explanation, per DESIGN.md form structure. */
export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  className = '',
  children,
  ...props
}) => {
  return (
    <section className={`space-y-4 ${className}`} {...props}>
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && <p className="mt-1 text-sm text-foreground-muted">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
