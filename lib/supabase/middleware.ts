import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from '@/lib/supabase/env'

export type SessionUpdateResult = {
  response: NextResponse
  user: User | null
  /** Cookie-bound SSR client; null when public env is missing. */
  supabase: ReturnType<typeof createServerClient> | null
}

/**
 * Refreshes the Supabase Auth session from cookies and returns a response
 * that forwards any updated auth cookies to the browser.
 */
export async function updateSession(
  request: NextRequest
): Promise<SessionUpdateResult> {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const url = getSupabaseUrl()
  const key = getSupabasePublishableKey()

  if (!url || !key) {
    return { response, user: null, supabase: null }
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  // getUser validates JWT with Supabase Auth (do not use getSession here).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user, supabase }
}
