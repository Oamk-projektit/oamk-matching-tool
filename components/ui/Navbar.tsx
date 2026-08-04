'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from './Button'
import { Tag } from './Tag'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useTranslations } from '@/lib/i18n'
import { useAuth } from '@/lib/auth/AuthProvider'
import { getNavLinks } from '@/lib/navigation/links'

/** Global top bar. Auth state and role links come from `useAuth()` — no props needed. */
export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t } = useTranslations()
  const { user, role, loading, signOut } = useAuth()

  const isAuthenticated = !!user
  const links = isAuthenticated ? getNavLinks(role) : []

  const toggleMobileMenu = () => setMobileMenuOpen((open) => !open)

  async function handleLogout() {
    await signOut()
    window.location.href = '/login'
  }

  return (
    <nav className="bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-primary" />
            <span className="font-semibold text-lg text-foreground hidden sm:inline">
              {t('common.appName')}
            </span>
            <span className="font-semibold text-lg text-foreground sm:hidden">OAMK</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground-secondary hover:text-primary transition-colors"
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <LanguageSwitcher compact />
            {!loading &&
              (isAuthenticated ? (
                <>
                  {role && <Tag variant="primary">{t(`roles.${role}`)}</Tag>}
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    {t('common.logout')}
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline" size="sm">
                      {t('common.login')}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary" size="sm">
                      {t('common.register')}
                    </Button>
                  </Link>
                </>
              ))}
          </div>

          <button
            type="button"
            className="md:hidden p-2 hover:bg-surface-muted rounded"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label={t('common.menu')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-border">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-foreground hover:bg-surface-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t(link.labelKey)}
              </Link>
            ))}

            {!loading && !isAuthenticated && (
              <>
                <Link
                  href="/login"
                  className="block px-4 py-2 text-foreground hover:bg-surface-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('common.login')}
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-2 text-foreground hover:bg-surface-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('common.register')}
                </Link>
              </>
            )}

            {!loading && isAuthenticated && (
              <div className="flex items-center justify-between px-4 py-2">
                {role && <Tag variant="primary">{t(`roles.${role}`)}</Tag>}
                <button
                  type="button"
                  onClick={() => {
                    void handleLogout()
                    setMobileMenuOpen(false)
                  }}
                  className="text-sm font-semibold text-error hover:underline"
                >
                  {t('common.logout')}
                </button>
              </div>
            )}

            <div className="mt-2 border-t border-border">
              <LanguageSwitcher />
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
