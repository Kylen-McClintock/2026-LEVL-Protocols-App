'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { linkGuestDataToAuthUser } from '@/lib/auth/linkGuestData'
import { Loader2 } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function handleAuth() {
      const code = searchParams.get('code')
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (error) {
        setErrorMsg(errorDescription || error)
        setTimeout(() => router.replace('/today'), 2500)
        return
      }

      if (code && supabase) {
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            console.error('Error exchanging code for session:', exchangeError)
            setErrorMsg(exchangeError.message)
            setTimeout(() => router.replace('/today'), 2500)
            return
          }

          if (data?.session?.user) {
            const guestId = typeof window !== 'undefined' ? (localStorage.getItem('levl_local_user_id') || localStorage.getItem('levl_prev_guest_id') || '') : ''
            if (guestId && guestId !== data.session.user.id) {
              await linkGuestDataToAuthUser(guestId, data.session.user)
            }
            if (typeof window !== 'undefined') {
              localStorage.setItem('levl_local_user_id', data.session.user.id)
              window.dispatchEvent(new CustomEvent('levl_auth_user_changed', { detail: data.session.user.id }))
            }
          }
        } catch (err: any) {
          console.error('Auth callback exception:', err)
        }
      }

      const next = searchParams.get('next') || '/today'
      router.replace(next)
    }

    handleAuth()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="p-8 rounded-3xl bg-slate-900 border border-purple-500/30 shadow-2xl max-w-sm w-full space-y-4">
        <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto" />
        <h2 className="text-lg font-bold text-white">
          {errorMsg ? 'Authentication Notice' : 'Synchronizing Account...'}
        </h2>
        <p className="text-xs text-slate-400">
          {errorMsg ? errorMsg : 'Linking your protocol stack, custom hotkeys, and daily progress.'}
        </p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
