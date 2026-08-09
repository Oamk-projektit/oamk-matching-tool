import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import type { UserRole } from '@/types/domain'

// Only exact matches below are public. Everything else — including all
// `/company/*`, `/teacher/*` (except `/teacher/login`), `/admin/*`, and
// `/dashboard` routes — is protected by default and requires a session.
const PUBLIC_EXACT = new Set([
  '/',
  '/login',
  '/register',
  '/teacher/login',
  '/style-guide',
])

const ROLE_HOME: Record<UserRole, string> = {
  student: '/dashboard',
  company: '/company/dashboard',
  teacher: '/teacher/dashboard',
  admin: '/admin/dashboard',
}

function isPublicPage(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true
  return false
}

function isKnownRole(role: unknown): role is UserRole {
  return (
    role === 'student' ||
    role === 'company' ||
    role === 'teacher' ||
    role === 'admin'
  )
}

/** Prefix role gates — mirrors client `RoleGuard` (defense in depth). */
function allowedRolesForPath(pathname: string): UserRole[] | null {
  if (pathname.startsWith('/company')) return ['company']
  if (pathname.startsWith('/admin')) return ['admin']
  if (pathname.startsWith('/teacher') && pathname !== '/teacher/login') {
    return ['teacher', 'admin']
  }
  return null
}

function loginRedirect(request: NextRequest, pathname: string): NextResponse {
  if (pathname.startsWith('/teacher')) {
    return NextResponse.redirect(new URL('/teacher/login', request.url))
  }
  if (pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.redirect(new URL('/login', request.url))
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie)
  })
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { response, user, supabase } = await updateSession(request)

  // API routes authenticate inside handlers; still refresh cookies above.
  if (pathname.startsWith('/api')) {
    return response
  }

  if (isPublicPage(pathname)) {
    return response
  }

  if (!user) {
    const redirect = loginRedirect(request, pathname)
    copyCookies(response, redirect)
    return redirect
  }

  const requiredRoles = allowedRolesForPath(pathname)
  if (requiredRoles && supabase) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = profile?.role
    if (isKnownRole(role) && !requiredRoles.includes(role)) {
      const redirect = NextResponse.redirect(
        new URL(ROLE_HOME[role], request.url)
      )
      copyCookies(response, redirect)
      return redirect
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
