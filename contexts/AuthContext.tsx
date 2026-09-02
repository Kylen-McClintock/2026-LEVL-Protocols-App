'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import { linkGuestDataToAuthUser } from '@/lib/auth/linkGuestData'

const LOCAL_USER_ID_KEY = 'levl_local_user_id'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isGuest: boolean
  localUserId: string
  signInWithGoogle: (customRedirect?: string) => Promise<{ error: AuthError | null }>
  signInWithMagicLink: (email: string, customRedirect?: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  openAuthModal: () => void
  closeAuthModal: () => void
  isAuthModalOpen: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Returns the exact public or local callback URL for Supabase Auth
 */
function getAuthRedirectUrl(customRedirect?: string): string {
  if (typeof window === 'undefined') return ''
  if (customRedirect) {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(customRedirect)}`
  }
  return `${window.location.origin}/auth/callback`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [localUserId, setLocalUserId] = useState<string>('')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Initialize or fetch current active user
  useEffect(() => {
    // 1. Get current local user ID from localStorage or generate one
    let storedId = ''
    try {
      storedId = localStorage.getItem(LOCAL_USER_ID_KEY) || ''
      if (!storedId) {
        storedId = uuidv4()
        localStorage.setItem(LOCAL_USER_ID_KEY, storedId)
      }
    } catch (e) {
      storedId = uuidv4()
    }
    setLocalUserId(storedId)

    if (!supabase) {
      setLoading(false)
      return
    }

    // 2. Clean hash fragments from address bar if present after redirect
    if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token')) {
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      } catch (e) {}
    }

    // 3. Safety fallback timer so iOS/slow networks never stay in loading state forever
    const safetyTimer = setTimeout(() => {
      setLoading(false)
    }, 1500)

    // 4. Check active session
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        clearTimeout(safetyTimer)
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          try {
            const prevId = localStorage.getItem(LOCAL_USER_ID_KEY)
            const cachedGuestId = localStorage.getItem('levl_prev_guest_id')
            const targetGuestId = (prevId && prevId !== session.user.id) ? prevId : cachedGuestId
            if (targetGuestId && targetGuestId !== session.user.id) {
              await linkGuestDataToAuthUser(targetGuestId, session.user).catch(() => {})
            }
            if (prevId && prevId !== session.user.id) {
              localStorage.setItem('levl_prev_guest_id', prevId)
            }
            localStorage.setItem(LOCAL_USER_ID_KEY, session.user.id)
          } catch (err) {}
          setLocalUserId(session.user.id)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('levl_auth_user_changed', { detail: session.user.id }))
          }
        }
      })
      .catch((err) => {
        console.warn('Supabase auth session check failed:', err)
      })
      .finally(() => {
        clearTimeout(safetyTimer)
        setLoading(false)
      })

    // 5. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          try {
            const previousGuestId = localStorage.getItem(LOCAL_USER_ID_KEY)
            const cachedGuestId = localStorage.getItem('levl_prev_guest_id')
            const targetGuestId = (previousGuestId && previousGuestId !== newSession.user.id) ? previousGuestId : cachedGuestId
            if (targetGuestId && targetGuestId !== newSession.user.id) {
              // Automatically migrate guest data to the authenticated account
              await linkGuestDataToAuthUser(targetGuestId, newSession.user).catch(() => {})
            }

            if (previousGuestId && previousGuestId !== newSession.user.id) {
              localStorage.setItem('levl_prev_guest_id', previousGuestId)
            }

            localStorage.setItem(LOCAL_USER_ID_KEY, newSession.user.id)
          } catch (err) {}

          setLocalUserId(newSession.user.id)
          setIsAuthModalOpen(false)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('levl_auth_user_changed', { detail: newSession.user.id }))
          }
        }
      }
    )

    return () => {
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [])

  // 1-Tap Google Sign-In
  const signInWithGoogle = useCallback(async (customRedirect?: string) => {
    if (!supabase) return { error: null }
    const redirectTo = getAuthRedirectUrl(customRedirect)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || undefined
      }
    })
    return { error }
  }, [])

  // 1-Click Magic Link
  const signInWithMagicLink = useCallback(async (email: string, customRedirect?: string) => {
    if (!supabase) return { error: null }
    const redirectTo = getAuthRedirectUrl(customRedirect)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo || undefined,
        shouldCreateUser: true
      }
    })
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setSession(null)
    // Generate new guest ID for a clean guest slate
    const newGuestId = uuidv4()
    localStorage.setItem(LOCAL_USER_ID_KEY, newGuestId)
    setLocalUserId(newGuestId)
  }, [])

  const openAuthModal = () => setIsAuthModalOpen(true)
  const closeAuthModal = () => setIsAuthModalOpen(false)

  const isGuest = !user

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isGuest,
        localUserId,
        signInWithGoogle,
        signInWithMagicLink,
        signOut,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
