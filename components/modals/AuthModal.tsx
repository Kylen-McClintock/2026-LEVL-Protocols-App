'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import GoogleSignInButton from '@/components/ui/GoogleSignInButton'
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
            {/* Primary Action: Native 1-Tap Google Sign In */}
            <GoogleSignInButton
              text="continue_with"
              onSuccess={handleClose}
              onError={(err) => setErrorMsg(err)}
            />

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
