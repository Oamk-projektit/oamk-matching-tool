'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from './Button'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useTranslations } from '@/lib/i18n'

interface NavbarProps {
  isAuthenticated?: boolean
  userRole?: 'student' | 'teacher' | 'admin'
  onLogout?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  isAuthenticated = false,
  userRole = 'student',
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t } = useTranslations()

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const studentLinks = [
    { href: '/projects', label: t('nav.projects') },
    { href: '/matches', label: t('nav.matches') },
    { href: '/profile', label: t('nav.profile') },
  ]

  const teacherLinks = [
    { href: '/teacher/projects', label: t('nav.myProjects') },
    { href: '/teacher/add-project', label: t('nav.newProject') },
  ]

  const adminLinks = [
    { href: '/admin/dashboard', label: t('nav.dashboard') },
    { href: '/admin/dashboard', label: t('nav.manageUsers') },
  ]

  const getLinks = () => {
    if (!isAuthenticated) return []
    if (userRole === 'teacher') return teacherLinks
    if (userRole === 'admin') return adminLinks
    return studentLinks
  }

  const links = getLinks()

  return (
    <nav className="bg-white border-b border-[#e0e0e0] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-[#005EB8]" />
            <span className="font-semibold text-lg text-[#171717] hidden sm:inline">
              {t('common.appName')}
            </span>
            <span className="font-semibold text-lg text-[#171717] sm:hidden">OAMK</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {links.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className="text-[#171717] hover:text-[#005EB8] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <LanguageSwitcher compact />
            {isAuthenticated ? (
              <>
                <span className="text-sm text-[#666666]">
                  {t(`roles.${userRole}`)}
                </span>
                <Button variant="outline" size="sm" onClick={onLogout}>
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
            )}
          </div>

          <button
            type="button"
            className="md:hidden p-2 hover:bg-[#f5f5f5] rounded"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label="Menu"
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
          <div className="md:hidden pb-4 border-t border-[#e0e0e0]">
            {links.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className="block px-4 py-2 text-[#171717] hover:bg-[#f5f5f5]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {!isAuthenticated && (
              <>
                <Link
                  href="/login"
                  className="block px-4 py-2 text-[#171717] hover:bg-[#f5f5f5]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('common.login')}
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-2 text-[#171717] hover:bg-[#f5f5f5]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('common.register')}
                </Link>
              </>
            )}

            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  onLogout?.()
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left px-4 py-2 text-[#ef4444] hover:bg-[#f5f5f5]"
              >
                {t('common.logout')}
              </button>
            )}

            <div className="mt-2 border-t border-[#e0e0e0]">
              <LanguageSwitcher />
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
