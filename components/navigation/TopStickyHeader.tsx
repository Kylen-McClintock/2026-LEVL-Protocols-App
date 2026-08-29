'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Plus, Cloud, Sparkles, CheckCircle2, ShieldCheck, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import QuickActionHubModal from '@/components/modals/QuickActionHubModal'

interface TaskStats {
  completed: number
  total: number
}

export default function TopStickyHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isGuest, openAuthModal, loading: authLoading } = useAuth()

  const [isVisible, setIsVisible] = useState(true)
  const [stats, setStats] = useState<TaskStats>({ completed: 0, total: 0 })
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false)
  const lastScrollYRef = useRef(0)

  // 1. Scroll-Direction Dynamic Visibility (Hide on Scroll Down, Reveal on Scroll Up)
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === 'undefined') return
      const currentScrollY = window.scrollY

      if (currentScrollY <= 20) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollYRef.current + 10 && currentScrollY > 70) {
        // Scrolling Down -> Hide header
        setIsVisible(false)
      } else if (currentScrollY < lastScrollYRef.current - 8) {
        // Scrolling Up -> Reveal header
        setIsVisible(true)
      }

      lastScrollYRef.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 2. Hydrate & Listen for Task Progress Updates
  useEffect(() => {
    const readCachedStats = () => {
      try {
        const raw = localStorage.getItem('levl_today_stats')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (typeof parsed.completed === 'number' && typeof parsed.total === 'number') {
            setStats(parsed)
          }
        }
      } catch (e) {}
    }

    readCachedStats()

    const handleStatsUpdate = (e: any) => {
      if (e.detail && typeof e.detail.completed === 'number' && typeof e.detail.total === 'number') {
        setStats(e.detail)
        try {
          localStorage.setItem('levl_today_stats', JSON.stringify(e.detail))
        } catch (err) {}
      }
    }

    window.addEventListener('levl_today_tasks_stats', handleStatsUpdate)
    return () => window.removeEventListener('levl_today_tasks_stats', handleStatsUpdate)
  }, [])

  const percentCompleted = stats.total > 0 ? Math.min(100, Math.round((stats.completed / stats.total) * 100)) : 0

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 md:hidden transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } bg-slate-950/85 backdrop-blur-xl border-b border-levl-border/80 shadow-lg shadow-black/20`}
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 10px)'
        }}
      >
        {/* Top Edge Gradient Completion Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-slate-800/40 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 transition-all duration-500 ease-out shadow-[0_0_8px_rgba(56,189,248,0.7)]"
            style={{ width: `${percentCompleted}%` }}
          />
        </div>

        <div className="flex items-center justify-between px-3.5 py-2.5">
          {/* Left: Logo & Cloud Sync Status */}
          <div className="flex items-center gap-2">
            <Link href="/today" className="shrink-0 flex items-center">
              <img
                src="/logo.png"
                alt="LEVL"
                className="h-6 w-auto object-contain"
              />
            </Link>

            {/* Cloud Sync Indicator */}
            {authLoading ? (
              <button
                onClick={openAuthModal}
                title="Checking Cloud Connection..."
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-slate-400 text-[10px] font-mono hover:bg-slate-800 transition-all cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
                <span className="hidden sm:inline">Connecting</span>
              </button>
            ) : user ? (
              <button
                onClick={() => router.push('/settings#cloud-sync')}
                title="Synced to Supabase Cloud - Tap for Profile & Settings"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono hover:bg-emerald-500/20 transition-all cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Synced</span>
              </button>
            ) : (
              <button
                onClick={openAuthModal}
                title="Guest Mode (Local Only) - Tap to Enable Cloud Sync"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-mono hover:bg-amber-500/20 transition-all cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="hidden sm:inline">Local</span>
              </button>
            )}
          </div>

          {/* Center: Completion Counter */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800/90 text-white shadow-inner">
              <span className="text-xs font-semibold tracking-tight">
                {stats.completed} / {stats.total}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                Done
              </span>
              {stats.total > 0 && stats.completed === stats.total && (
                <CheckCircle2 size={12} className="text-emerald-400 ml-0.5" />
              )}
            </div>
          </div>

          {/* Right: Quick Action (+) Trigger */}
          <div className="flex items-center">
            <button
              onClick={() => setIsQuickActionOpen(true)}
              aria-label="Quick Actions & Create Modality"
              className="w-8 h-8 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white flex items-center justify-center shadow-md shadow-sky-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={16} className="stroke-[2.5]" />
            </button>
          </div>
        </div>
      </header>

      {/* Global Quick Action Hub Modal */}
      <QuickActionHubModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
      />
    </>
  )
}
