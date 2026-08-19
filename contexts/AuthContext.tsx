'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import { linkGuestDataToAuthUser } from '@/lib/auth/linkGuestData'
import { 
  isPasskeySupported, 
  getStoredPasskey, 
  getRegisteredAccountPasskey,
  registerBiometricPasskey, 
  authenticateWithBiometrics, 
  StoredPasskeyData 
} from '@/lib/auth/passkeyEngine'

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
  signInWithPasskey: () => Promise<{ success: boolean; error?: string }>
  registerCurrentDevicePasskey: () => Promise<{ success: boolean; error?: string }>
  hasRegisteredPasskey: boolean
  isPasskeyAvailable: boolean
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
  const [hasRegisteredPasskey, setHasRegisteredPasskey] = useState(false)
  const [isPasskeyAvailable, setIsPasskeyAvailable] = useState(false)

  // Initialize or fetch current active user
  useEffect(() => {
    // Check WebAuthn biometric passkey availability
    isPasskeySupported().then(avail => {
      setIsPasskeyAvailable(avail)
      setHasRegisteredPasskey(!!getStoredPasskey())
    })

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

          // If a passkey exists on this device, update its identity to the real email account
          const stored = getStoredPasskey()
          if (stored) {
            localStorage.setItem('levl_passkey_data', JSON.stringify({
              ...stored,
              userId: newSession.user.id,
              userEmail: newSession.user.email || stored.userEmail,
              userName: (newSession.user as any)?.user_metadata?.full_name || stored.userName
            }))
            setHasRegisteredPasskey(true)
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signInWithOtp = useCallback(async (email: string) => {
    if (!supabase) return { error: null }
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: origin ? `${origin}/today` : undefined,
        shouldCreateUser: true
      }
    })
    return { error }
  }, [])

  const verifyOtp = useCallback(async (email: string, token: string) => {
    if (!supabase) return { error: null }
    
    // First attempt standard email verification
    let { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })

    // Fallback: try signup verification type if email type rejected token
    if (error) {
      const retry = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      })
      if (!retry.error && retry.data?.user) {
        data = retry.data
        error = null
      }
    }

    if (!error && data?.user) {
      setUser(data.user)
      setSession(data.session)
      setIsAuthModalOpen(false)
    }

    return { error }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return { error: null }
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: origin ? `${origin}/today` : undefined
      }
    })
    return { error }
  }, [])

  // Biometric Passkey Login (Face ID / Touch ID / Android Biometrics)
  const signInWithPasskey = useCallback(async () => {
    const registered = getRegisteredAccountPasskey()
    if (!registered) {
      return { 
        success: false, 
        error: 'Please sign in with Google or Email first to register biometric unlock on this device.' 
      }
    }

    const res = await authenticateWithBiometrics(registered)
    if (res.success && res.passkey) {
      // Reconnect session with verified passkey account
      localStorage.setItem(LOCAL_USER_ID_KEY, res.passkey.userId)
      setLocalUserId(res.passkey.userId)
      setHasRegisteredPasskey(true)

      // Create a virtual user representation if Supabase session is offline
      if (!user) {
        setUser({
          id: res.passkey.userId,
          email: res.passkey.userEmail,
          user_metadata: { full_name: res.passkey.userName }
        } as any)
      }

      setIsAuthModalOpen(false)
      return { success: true }
    }
    return { success: false, error: res.error }
  }, [user])

  // Register Passkey for current logged in user
  const registerCurrentDevicePasskey = useCallback(async () => {
    if (!user || !user.email) {
      return { success: false, error: 'Please sign in with Google or your email first.' }
    }

    const activeId = user.id
    const activeEmail = user.email
    const activeName = (user as any)?.user_metadata?.full_name || user.email.split('@')[0] || 'LEVL Member'

    const res = await registerBiometricPasskey(activeId, activeEmail, activeName)
    if (res.success) {
      setHasRegisteredPasskey(true)
    }
    return res
  }, [user])

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setSession(null)
    setHasRegisteredPasskey(false)
    localStorage.removeItem('levl_passkey_data')
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
        signInWithPasskey,
        registerCurrentDevicePasskey,
        hasRegisteredPasskey,
        isPasskeyAvailable,
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
