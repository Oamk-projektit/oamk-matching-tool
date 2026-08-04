'use client'

/**
 * Client-side auth/session context.
 *
 * Wraps the Supabase browser client (`@/lib/supabase/client`) for
 * sign-in/sign-up/sign-out, and the projects-model API client
 * (`@/lib/api/client`) for `GET /api/me` (role, studentId, companyId).
 *
 * Role is always sourced from the `/api/me` response (backed by
 * `profiles.role` in the database), never trusted from client-only state.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { ApiClientError, api } from '@/lib/api/client'
import type { MeData } from '@/types/api'
import type { PreferredLanguage, Profile, UserRole } from '@/types/domain'

export interface SignUpInput {
  email: string
  password: string
  displayName: string
  role: Extract<UserRole, 'student' | 'company'>
  preferredLanguage: PreferredLanguage
}

export interface AuthContextValue {
  /** Raw Supabase auth user (identity only — no role/profile data). */
  user: User | null
  /** `profiles` row for the signed-in user, loaded via `GET /api/me`. */
  profile: Profile | null
  role: UserRole | null
  studentId: string | null
  companyId: string | null
  /** True while the initial session/profile is being resolved. */
  loading: boolean
  error: string | null
  /** Re-fetches `GET /api/me`. Returns `null` when unauthenticated. */
  refreshMe: () => Promise<MeData | null>
  /** Resolves with the freshly loaded `/api/me` data on success. */
  signIn: (email: string, password: string) => Promise<MeData | null>
  /**
   * Resolves with `/api/me` data once a session exists, or `null` when the
   * Supabase project requires email confirmation before a session is issued.
   */
  signUp: (input: SignUpInput) => Promise<MeData | null>
  signOut: (onSignedOut?: () => void) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  if (supabaseRef.current == null) {
    supabaseRef.current = createClient()
  }

  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const clearProfile = useCallback(() => {
    setProfile(null)
    setStudentId(null)
    setCompanyId(null)
  }, [])

  const refreshMe = useCallback(async (): Promise<MeData | null> => {
    try {
      const me = await api.me()
      setProfile(me.profile)
      setStudentId(me.studentId)
      setCompanyId(me.companyId)
      setError(null)
      return me
    } catch (err) {
      clearProfile()
      // 401 just means "not signed in" — not a surfaced application error.
      if (err instanceof ApiClientError && err.status === 401) {
        setError(null)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      }
      return null
    }
  }, [clearProfile])

  useEffect(() => {
    const supabase = supabaseRef.current!
    let active = true

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!active) return
      setUser(session?.user ?? null)
      if (session?.user) {
        await refreshMe()
      }
      if (active) setLoading(false)
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        void refreshMe()
      } else {
        clearProfile()
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
    // Intentionally run once: `refreshMe`/`clearProfile` are stable via useCallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn = useCallback(
    async (email: string, password: string): Promise<MeData | null> => {
      setError(null)
      const supabase = supabaseRef.current!
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        throw signInError
      }
      setUser(data.user ?? null)
      return refreshMe()
    },
    [refreshMe]
  )

  const signUp = useCallback(
    async (input: SignUpInput): Promise<MeData | null> => {
      setError(null)
      const supabase = supabaseRef.current!
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            role: input.role,
            display_name: input.displayName,
            preferred_language: input.preferredLanguage,
          },
        },
      })
      if (signUpError) {
        setError(signUpError.message)
        throw signUpError
      }
      setUser(data.user ?? null)
      // No session yet (e.g. email confirmation required) — nothing to fetch.
      if (!data.session) return null
      return refreshMe()
    },
    [refreshMe]
  )

  const signOut = useCallback(
    async (onSignedOut?: () => void) => {
      const supabase = supabaseRef.current!
      await supabase.auth.signOut()
      setUser(null)
      clearProfile()
      setError(null)
      onSignedOut?.()
    },
    [clearProfile]
  )

  const role = profile?.role ?? null

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      role,
      studentId,
      companyId,
      loading,
      error,
      refreshMe,
      signIn,
      signUp,
      signOut,
    }),
    [
      user,
      profile,
      role,
      studentId,
      companyId,
      loading,
      error,
      refreshMe,
      signIn,
      signUp,
      signOut,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
