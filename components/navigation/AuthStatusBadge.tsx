'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Cloud, Check, Sparkles, User as UserIcon } from 'lucide-react'

export default function AuthStatusBadge({ className = '' }: { className?: string }) {
  const { user, isGuest, openAuthModal, loading } = useAuth()

  if (loading) {
    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs ${className}`}>
        <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
        <span className="text-[10px] font-mono">Syncing...</span>
      </div>
    )
  }

  if (user) {
    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs shadow-sm ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <Cloud size={12} className="text-emerald-400 shrink-0" />
        <span className="text-[10px] font-mono font-medium truncate max-w-[120px]">
          {user.email ? user.email.split('@')[0] : 'Synced'}
        </span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={openAuthModal}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-purple-600/20 to-indigo-600/20 hover:from-purple-600/30 hover:to-indigo-600/30 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer ${className}`}
    >
      <Cloud size={12} className="text-purple-400 shrink-0" />
      <span className="text-[10px] tracking-tight">Cloud Sync</span>
    </button>
  )
}
