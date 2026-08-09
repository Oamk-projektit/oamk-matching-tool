'use client'

/**
 * Client-side role gate for pages that must only render for specific
 * `profiles.role` values (e.g. `/teacher/*`, `/admin/*` oversight pages).
 *
 * Route-level authentication **and** role gates for `/company/*`,
 * `/teacher/*`, `/admin/*` are enforced by `middleware.ts`; this
 * component only narrows further by role on the client as a UX layer.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingState } from '@/components/ui'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useTranslations } from '@/lib/i18n'
import type { UserRole } from '@/types/domain'

const ROLE_HOME: Record<UserRole, string> = {
  student: '/dashboard',
  company: '/company/dashboard',
  teacher: '/teacher/dashboard',
  admin: '/admin/dashboard',
}

export interface RoleGuardProps {
  /** Roles allowed to view the wrapped page. */
  allowedRoles: UserRole[]
  /** Where to send a signed-in user whose role isn't allowed. Defaults to their own dashboard. */
  fallbackHref?: string
  /** Where to send an unauthenticated user. Defaults to '/login'. */
  loginHref?: string
  children: React.ReactNode
}

/** Renders `children` only for `allowedRoles`; otherwise redirects and shows a loading state. */
export function RoleGuard({
  allowedRoles,
  fallbackHref,
  loginHref = '/login',
  children,
}: RoleGuardProps) {
  const { role, loading } = useAuth()
  const { t } = useTranslations()
  const router = useRouter()

  const isAllowed = !!role && allowedRoles.includes(role)

  useEffect(() => {
    if (loading) return
    if (!role) {
      router.replace(loginHref)
      return
    }
    if (!isAllowed) {
      router.replace(fallbackHref ?? ROLE_HOME[role])
    }
    // Re-run only when the resolved auth state changes, not when the caller
    // passes a fresh `allowedRoles` array literal on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, role, isAllowed])

  if (loading || !isAllowed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <LoadingState message={t('common.checkingAccess')} />
      </div>
    )
  }

  return <>{children}</>
}
