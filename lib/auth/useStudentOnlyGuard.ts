'use client'

/**
 * Redirects company/teacher users away from student-only pages to their own
 * dashboard. Unauthenticated visitors are already handled by `middleware.ts`;
 * students pass through untouched.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

const OTHER_ROLE_HOME: Record<string, string> = {
  company: '/company/dashboard',
  teacher: '/teacher/dashboard',
}

export function useStudentOnlyGuard(): void {
  const router = useRouter()
  const { role, loading } = useAuth()

  useEffect(() => {
    if (loading || !role) return
    const home = OTHER_ROLE_HOME[role]
    if (home) {
      router.replace(home)
    }
  }, [loading, role, router])
}
