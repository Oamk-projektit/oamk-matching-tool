'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from './Button'

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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const studentLinks = [
    { href: '/projects', label: 'Projects' },
    { href: '/matches', label: 'My Matches' },
    { href: '/profile', label: 'Profile' },
  ]

  const teacherLinks = [
    { href: '/teacher/projects', label: 'My Projects' },
    { href: '/teacher/add-project', label: 'New Project' },
  ]

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/dashboard', label: 'Manage Users' },
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
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-[#005EB8]" />
            <span className="font-semibold text-lg text-[#171717] hidden sm:inline">OAMK Matching</span>
            <span className="font-semibold text-lg text-[#171717] sm:hidden">OAMK</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[#171717] hover:text-[#005EB8] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-[#666666]">
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-[#f5f5f5] rounded"
            onClick={toggleMobileMenu}
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-[#e0e0e0]">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-[#171717] hover:bg-[#f5f5f5]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <button
                onClick={() => {
                  onLogout?.()
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left px-4 py-2 text-[#ef4444] hover:bg-[#f5f5f5]"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
