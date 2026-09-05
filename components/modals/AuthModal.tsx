'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  X, Mail, ArrowRight, ShieldCheck, CheckCircle2, Sparkles, 
  AlertCircle, RefreshCw, Send, Check
} from 'lucide-react'

export default function AuthModal() {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    signInWithGoogle, 
    signInWithMagicLink 
  } = useAuth()
  
  const [email, setEmail] = useState('')
  const [isSent, setIsSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isAuthModalOpen) return null

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    const { error } = await signInWithMagicLink(email.trim())
    setLoading(false)

    if (error) {
      setErrorMsg(error.message || 'Failed to send login link. Please try again or use Google sign in.')
    } else {
      setIsSent(true)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setErrorMsg(null)
    const { error } = await signInWithGoogle()
    if (error) {
      setErrorMsg(error.message || 'Failed to initiate Google sign in.')
      setLoading(false)
    }
  }

  const handleClose = () => {
    setErrorMsg(null)
    setIsSent(false)
    setEmail('')
    closeAuthModal()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-950/95 border border-purple-500/30 shadow-2xl space-y-6 text-white overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isSent ? 'Check Your Inbox' : 'Sign In & Cloud Sync'}
            </h2>
            <p className="text-xs text-slate-400">
              {isSent 
                ? `1-click sign-in link sent to ${email}` 
                : 'Sync your stacks, streaks, and check-ins across your phone and computer.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={15} className="shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!isSent ? (
          <div className="space-y-4">
            {/* Primary Action: 1-Tap Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-lg cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">or sign in with email</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* 1-Click Magic Link Form */}
            <form onSubmit={handleSendMagicLink} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  autoFocus
                  required
                  className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>Send 1-Click Sign-In Link</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Sent Confirmation View */
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200 text-center py-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Send size={24} className="translate-x-0.5" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">Magic Link Dispatched!</h3>
              <p className="text-xs text-slate-300 leading-relaxed px-2">
                We sent a 1-click login link to <span className="text-emerald-400 font-mono font-bold">{email}</span>.
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed px-4">
                Tap the link in your email on your phone or computer to instantly sign in and sync your protocols.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSendMagicLink}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                <span>Resend link</span>
              </button>

              <button
                type="button"
                onClick={() => { setIsSent(false); setErrorMsg(null); }}
                className="text-xs text-slate-400 hover:text-white transition-colors py-1 cursor-pointer"
              >
                ← Use a different email
              </button>
            </div>
          </div>
        )}

        {/* Security & Privacy Footer */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
          <span>Encrypted Cloud Sync • No Passwords Required</span>
        </div>
      </div>
    </div>
  )
}
