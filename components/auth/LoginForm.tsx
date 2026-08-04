'use client'

import React, { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Alert, Button, Card, Input } from '@/components/ui'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useTranslations } from '@/lib/i18n'
import type { UserRole } from '@/types/domain'

const ROLE_HOME: Record<UserRole, string> = {
  student: '/dashboard',
  company: '/company/dashboard',
  teacher: '/teacher/dashboard',
  admin: '/admin/dashboard',
}

interface FieldErrors {
  email?: string
  password?: string
}

export interface LoginFormProps {
  /** Overrides the default student-facing title, e.g. for `/teacher/login`. */
  title?: string
  /** Overrides the default student-facing description. */
  description?: string
  /** Extra note shown below the title, e.g. "Teacher and admin accounts are created by OAMK staff." */
  helperText?: string
  /** Hides the "Don't have an account? Register" link — teachers/admins don't self-register. */
  hideRegisterLink?: boolean
}

export function LoginForm({
  title,
  description,
  helperText,
  hideRegisterLink = false,
}: LoginFormProps = {}) {
  const { t } = useTranslations()
  const router = useRouter()
  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function validate(): boolean {
    const errors: FieldErrors = {}
    if (!email.trim()) errors.email = t('auth.errors.emailRequired')
    if (!password) errors.password = t('auth.errors.passwordRequired')
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      const me = await signIn(email.trim(), password)
      const target = me ? ROLE_HOME[me.profile.role] : '/'
      router.push(target)
      router.refresh()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : t('auth.errors.loginFailed')
      )
      setSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-bold text-foreground mb-1">
        {title ?? t('auth.login.title')}
      </h1>
      <p className={`text-foreground-muted ${helperText ? 'mb-1' : 'mb-6'}`}>
        {description ?? t('auth.login.description')}
      </p>
      {helperText && (
        <p className="text-sm text-foreground-muted mb-6">{helperText}</p>
      )}

      {formError && (
        <Alert variant="error" className="mb-4">
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label={t('auth.login.emailLabel')}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
        />
        <Input
          label={t('auth.login.passwordLabel')}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
        />

        <Button type="submit" className="w-full" isLoading={submitting}>
          {submitting ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>
      </form>

      {!hideRegisterLink && (
        <p className="mt-6 text-sm text-foreground-muted">
          {t('auth.login.noAccount')}{' '}
          <Link href="/register" className="text-primary hover:underline">
            {t('auth.login.registerLink')}
          </Link>
        </p>
      )}
    </Card>
  )
}
