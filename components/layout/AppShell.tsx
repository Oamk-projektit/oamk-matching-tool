'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button, LoadingState, Tag } from '@/components/ui'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useTranslations } from '@/lib/i18n'
import { getNavLinks } from '@/lib/navigation/links'

export interface AppShellProps {
  children: React.ReactNode
  /** Page heading rendered next to `primaryAction`, above `children`. */
  title?: string
  /** e.g. a "Create project" button, rendered next to `title`. */
  primaryAction?: React.ReactNode
}

/**
 * Dashboard-style page shell: role-aware sidebar (desktop) / collapsible
 * link list (mobile), plus a constrained content column with an optional
 * title + primary action row. The global top bar (`Navbar`) already covers
 * logo, language, role badge and logout, so this shell focuses on
 * in-app navigation and page layout.
 *
 * Unauthenticated users are redirected by middleware before this renders;
 * while the session/profile is still resolving we just show a loading state.
 */
export function AppShell({ children, title, primaryAction }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { t } = useTranslations()
  const { loading, role, profile, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const links = getNavLinks(role)

  async function handleLogout() {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return <LoadingState message={t('common.loading')} className="min-h-[60vh]" />
  }

  function linkClassName(href: string): string {
    const active = pathname === href
    return `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? 'bg-primary-soft text-primary'
        : 'text-foreground-secondary hover:bg-surface-muted hover:text-foreground'
    }`
  }

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:flex-row lg:px-8">
      {links.length > 0 && (
        <>
          {/* Mobile: hamburger collapsing to a link list. */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-expanded={mobileNavOpen}
              className="flex w-full items-center justify-between rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground"
            >
              {t('common.menu')}
              <svg
                className={`h-4 w-4 transition-transform ${mobileNavOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {mobileNavOpen && (
              <nav className="mt-2 space-y-1 rounded-md border border-border bg-surface p-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={linkClassName(link.href)}
                  >
                    {t(link.labelKey)}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Desktop: persistent sidebar. */}
          <aside className="hidden shrink-0 lg:block lg:w-56">
            <div className="sticky top-6 flex flex-col gap-4">
              <nav className="space-y-1">
                {links.map((link) => (
                  <Link key={link.href} href={link.href} className={linkClassName(link.href)}>
                    {t(link.labelKey)}
                  </Link>
                ))}
              </nav>

              {profile && (
                <div className="rounded-md border border-border-soft bg-surface p-3">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {profile.displayName}
                  </p>
                  {role && (
                    <Tag variant="primary" className="mt-1">
                      {t(`roles.${role}`)}
                    </Tag>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full justify-center"
                    onClick={handleLogout}
                  >
                    {t('common.logout')}
                  </Button>
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      <div className="min-w-0 flex-1">
        {(title || primaryAction) && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            {title && (
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
            )}
            {primaryAction && <div className="shrink-0">{primaryAction}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
