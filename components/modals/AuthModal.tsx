'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { X, Mail, ArrowRight, ShieldCheck, CheckCircle2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react'

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, signInWithOtp, verifyOtp, signInWithGoogle } = useAuth()
  
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isAuthModalOpen) return null

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    const { error } = await signInWithOtp(email.trim())
    setLoading(false)

    if (error) {
      setErrorMsg(error.message || 'Failed to send login code. Please try again.')
    } else {
      setStep('otp')
      setSuccessMsg(`We sent a 6-digit login code and magic link to ${email}`)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim() || token.trim().length < 6) {
      setErrorMsg('Please enter the 6-digit code sent to your email.')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    const { error } = await verifyOtp(email.trim(), token.trim())
    setLoading(false)

    if (error) {
      setErrorMsg(error.message || 'Invalid or expired code. Please try again or request a new code.')
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
    setSuccessMsg(null)
    setStep('email')
    setToken('')
    closeAuthModal()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-950/95 border border-purple-500/30 shadow-2xl space-y-6 text-white overflow-hidden">
        {/* Glow orb */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Zero Friction
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {step === 'email' ? 'Sync Your Protocol Data' : 'Enter 6-Digit Code'}
            </h2>
            <p className="text-xs text-slate-400">
              {step === 'email' 
                ? 'Save streaks, custom stacks, and biomarkers across all your devices.' 
                : `We sent an instant verification code to ${email}`}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
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

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 'email' ? (
          <div className="space-y-4">
            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">or with email</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <>
                    <span>Send Login Code</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* OTP Verification Form */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                6-Digit Login Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                autoFocus
                required
                className="w-full bg-black/60 border border-purple-500/40 rounded-xl py-3 text-center text-xl font-mono font-black tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || token.length < 6}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {loading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Verify &amp; Enter</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ← Change Email
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
              >
                Resend Code
              </button>
            </div>
          </form>
        )}

        {/* Footer Security Note */}
        <div className="pt-2 text-[10px] text-slate-500 flex items-center justify-center gap-1.5 border-t border-white/5">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>No passwords needed. Encrypted &amp; private.</span>
        </div>
      </div>
    </div>
  )
}
