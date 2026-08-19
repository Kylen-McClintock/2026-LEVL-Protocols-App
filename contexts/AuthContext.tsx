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
  signInWithOtp: (email: string) => Promise<{ error: AuthError | null }>
  verifyOtp: (email: string, token: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  openAuthModal: () => void
  closeAuthModal: () => void
  isAuthModalOpen: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [localUserId, setLocalUserId] = useState<string>('')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Initialize or fetch current active user
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Get current local user ID from localStorage or generate one
    let storedId = localStorage.getItem(LOCAL_USER_ID_KEY)
    if (!storedId) {
      storedId = uuidv4()
      localStorage.setItem(LOCAL_USER_ID_KEY, storedId)
    }
    setLocalUserId(storedId)

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        localStorage.setItem(LOCAL_USER_ID_KEY, session.user.id)
        setLocalUserId(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          const previousGuestId = localStorage.getItem(LOCAL_USER_ID_KEY)
          if (previousGuestId && previousGuestId !== newSession.user.id) {
            // Automatically migrate guest data to the authenticated account
            await linkGuestDataToAuthUser(previousGuestId, newSession.user)
          }

          localStorage.setItem(LOCAL_USER_ID_KEY, newSession.user.id)
          setLocalUserId(newSession.user.id)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signInWithOtp = useCallback(async (email: string) => {
    if (!supabase) return { error: null }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        shouldCreateUser: true
      }
    })
    return { error }
  }, [])

  const verifyOtp = useCallback(async (email: string, token: string) => {
    if (!supabase) return { error: null }
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })
    if (!error && data.user) {
      setUser(data.user)
      setSession(data.session)
      setIsAuthModalOpen(false)
    }
    return { error }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return { error: null }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
      }
    })
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
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
        signInWithOtp,
        verifyOtp,
        signInWithGoogle,
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
