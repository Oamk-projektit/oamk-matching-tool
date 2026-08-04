import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

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

function isPublicPage(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true
  // Style guide assets under the same path prefix are not expected; keep exact.
  return false
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { response, user } = await updateSession(request)

  // API routes authenticate inside handlers; still refresh cookies above.
  if (pathname.startsWith('/api')) {
    return response
  }

  if (isPublicPage(pathname)) {
    return response
  }

  if (!user) {
    const redirect = loginRedirect(request, pathname)
    // Preserve refreshed cookies on the redirect response.
    response.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie)
    })
    return redirect
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
