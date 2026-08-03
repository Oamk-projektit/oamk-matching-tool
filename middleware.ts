import { type NextRequest, NextResponse } from 'next/server'

// Pages that don't require authentication
const publicPages = ['/', '/login', '/register', '/teacher/login', '/style-guide']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public pages to be accessed without authentication
  if (publicPages.some(page => pathname === page || pathname.startsWith(page))) {
    return NextResponse.next()
  }

  // API routes handle their own auth and return JSON errors.
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Get session from cookies (JWT stored as 'sb-auth-token')
  const authToken = request.cookies.get('sb-auth-token')?.value

  if (!authToken) {
    // Redirect to login for student pages or teacher pages
    if (pathname.startsWith('/teacher')) {
      return NextResponse.redirect(new URL('/teacher/login', request.url))
    }
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// Configure which routes should use the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
