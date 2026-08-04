'use client'

import React, { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Alert, Button, Card, Input, Select } from '@/components/ui'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useTranslations } from '@/lib/i18n'
import type { PreferredLanguage, UserRole } from '@/types/domain'

const ROLE_HOME: Record<UserRole, string> = {
  student: '/dashboard',
  company: '/company/dashboard',
  teacher: '/teacher/dashboard',
  admin: '/admin/dashboard',
}

type RegisterableRole = Extract<UserRole, 'student' | 'company'>

interface FieldErrors {
  displayName?: string
  email?: string
  password?: string
}

const MIN_PASSWORD_LENGTH = 8

export function RegisterForm() {
  const { t } = useTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signUp } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<RegisterableRole>(
    searchParams.get('role') === 'company' ? 'company' : 'student'
  )
  const [preferredLanguage, setPreferredLanguage] =
    useState<PreferredLanguage>('fi')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  function validate(): boolean {
    const errors: FieldErrors = {}
    if (!displayName.trim()) {
      errors.displayName = t('auth.errors.displayNameRequired')
    }
    if (!email.trim()) errors.email = t('auth.errors.emailRequired')
    if (!password) {
      errors.password = t('auth.errors.passwordRequired')
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = t('auth.errors.passwordTooShort')
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setCheckEmail(false)
    if (!validate()) return

    setSubmitting(true)
    try {
      const me = await signUp({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        role,
        preferredLanguage,
      })
      if (!me) {
        // Supabase project requires email confirmation before a session exists.
        setCheckEmail(true)
        setSubmitting(false)
        return
      }
      router.push(ROLE_HOME[me.profile.role])
      router.refresh()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : t('auth.errors.registerFailed')
      )
      setSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-bold text-foreground mb-1">
        {t('auth.register.title')}
      </h1>
      <p className="text-foreground-muted mb-6">
        {t('auth.register.description')}
      </p>

      {formError && (
        <Alert variant="error" className="mb-4">
          {formError}
        </Alert>
      )}
      {checkEmail && (
        <Alert variant="success" className="mb-4">
          {t('auth.register.checkEmail')}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label={t('auth.register.displayNameLabel')}
          autoComplete="name"
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          error={fieldErrors.displayName}
        />
        <Input
          label={t('auth.register.emailLabel')}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
        />
        <Input
          label={t('auth.register.passwordLabel')}
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          helperText={
            fieldErrors.password
              ? undefined
              : t('auth.errors.passwordTooShort')
          }
        />
        <Select
          label={t('auth.register.roleLabel')}
          value={role}
          onChange={(event) => setRole(event.target.value as RegisterableRole)}
          options={[
            { value: 'student', label: t('auth.register.roleStudent') },
            { value: 'company', label: t('auth.register.roleCompany') },
          ]}
        />
        <Select
          label={t('auth.register.languageLabel')}
          value={preferredLanguage}
          onChange={(event) =>
            setPreferredLanguage(event.target.value as PreferredLanguage)
          }
          options={[
            { value: 'fi', label: t('auth.register.languageFi') },
            { value: 'en', label: t('auth.register.languageEn') },
          ]}
        />

        <Button type="submit" className="w-full" isLoading={submitting}>
          {submitting
            ? t('auth.register.submitting')
            : t('auth.register.submit')}
        </Button>
      </form>

      <p className="mt-6 text-sm text-foreground-muted">
        {t('auth.register.hasAccount')}{' '}
        <Link href="/login" className="text-primary hover:underline">
          {t('auth.register.loginLink')}
        </Link>
      </p>
    </Card>
  )
}
