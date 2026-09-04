'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Plus, Cloud, Sparkles, CheckCircle2, ShieldCheck, User, Clock, ListOrdered, CalendarDays, Activity, Columns, Calendar, LayoutGrid, ChevronDown, Check, Zap, Bookmark } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import QuickActionHubModal from '@/components/modals/QuickActionHubModal'

interface TaskStats {
  completed: number
  total: number
}

type HeaderCalendarView = 'today' | 'pulse' | '3day' | 'week' | 'month'
type HeaderLayoutView = 'chronological' | 'protocol'

export default function TopStickyHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isGuest, openAuthModal, loading: authLoading } = useAuth()

  const [isVisible, setIsVisible] = useState(true)
  const [stats, setStats] = useState<TaskStats>({ completed: 0, total: 0 })
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false)
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false)
  const [activeCalendarView, setActiveCalendarView] = useState<HeaderCalendarView>('today')
  const [activeLayoutView, setActiveLayoutView] = useState<HeaderLayoutView>('chronological')
  const lastScrollYRef = useRef(0)
  const viewDropdownRef = useRef<HTMLDivElement>(null)

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
        setIsViewDropdownOpen(false)
      } else if (currentScrollY < lastScrollYRef.current - 8) {
        // Scrolling Up -> Reveal header
        setIsVisible(true)
      }

      lastScrollYRef.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 2. Click outside dropdown to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(e.target as Node)) {
        setIsViewDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  // 3. Hydrate & Listen for Task Progress Updates & View Mode Events
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
        const cachedView = localStorage.getItem('levl_active_view_modes')
        if (cachedView) {
          const parsedView = JSON.parse(cachedView)
          if (parsedView.calendarViewMode) setActiveCalendarView(parsedView.calendarViewMode)
          if (parsedView.viewMode) setActiveLayoutView(parsedView.viewMode)
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

    const handleViewModeChange = (e: any) => {
      if (e.detail) {
        if (e.detail.calendarViewMode) setActiveCalendarView(e.detail.calendarViewMode)
        if (e.detail.viewMode) setActiveLayoutView(e.detail.viewMode)
        try {
          localStorage.setItem('levl_active_view_modes', JSON.stringify({
            calendarViewMode: e.detail.calendarViewMode || activeCalendarView,
            viewMode: e.detail.viewMode || activeLayoutView
          }))
        } catch (err) {}
      }
    }

    window.addEventListener('levl_today_tasks_stats', handleStatsUpdate)
    window.addEventListener('levl_view_mode_change', handleViewModeChange)
    return () => {
      window.removeEventListener('levl_today_tasks_stats', handleStatsUpdate)
      window.removeEventListener('levl_view_mode_change', handleViewModeChange)
    }
  }, [activeCalendarView, activeLayoutView])

  const handleSelectView = (calendarMode: HeaderCalendarView, layoutMode?: HeaderLayoutView) => {
    setActiveCalendarView(calendarMode)
    if (layoutMode) setActiveLayoutView(layoutMode)
    setIsViewDropdownOpen(false)

    if (pathname !== '/today') {
      router.push('/today')
    }

    window.dispatchEvent(new CustomEvent('levl_set_view_mode', {
      detail: {
        calendarViewMode: calendarMode,
        viewMode: layoutMode || activeLayoutView
      }
    }))
  }

  const is100Percent = stats.total > 0 && stats.completed === stats.total
  const percentCompleted = stats.total > 0 ? Math.min(100, Math.round((stats.completed / stats.total) * 100)) : 0

  // Determine current active view label and icon
  const currentViewDetails = React.useMemo(() => {
    if (pathname !== '/today') {
      if (pathname.startsWith('/explore')) return { label: 'Explore', icon: <Sparkles size={12} className="text-purple-400" /> }
      if (pathname.startsWith('/schedule')) return { label: 'Schedule', icon: <Calendar size={12} className="text-teal-400" /> }
      if (pathname.startsWith('/tracking')) return { label: 'Insights', icon: <Activity size={12} className="text-cyan-400" /> }
      if (pathname.startsWith('/profile') || pathname.startsWith('/settings')) return { label: 'Profile', icon: <User size={12} className="text-slate-400" /> }
    }

    if (activeCalendarView === 'pulse') return { label: 'Daily Pulse', icon: <Activity size={12} className="text-indigo-400" /> }
    if (activeCalendarView === '3day') return { label: '3-Day View', icon: <Columns size={12} className="text-teal-400" /> }
    if (activeCalendarView === 'week') return { label: '7-Day Week', icon: <Calendar size={12} className="text-teal-400" /> }
    if (activeCalendarView === 'month') return { label: 'Month Matrix', icon: <LayoutGrid size={12} className="text-cyan-400" /> }
    
    // Today Timeline mode
    if (activeLayoutView === 'protocol') {
      return { label: 'Protocols', icon: <ListOrdered size={12} className="text-purple-400" /> }
    }
    return { label: 'Time Blocks', icon: <Clock size={12} className="text-purple-400" /> }
  }, [pathname, activeCalendarView, activeLayoutView])

  return (
    <>
      <header
        className={`fixed top-0 left-0 md:left-64 right-0 z-[9999] transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } bg-slate-950/85 backdrop-blur-xl border-b border-levl-border/80 shadow-lg shadow-black/20`}
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 10px)'
        }}
      >
        {/* Top Edge Gradient Completion Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-slate-800/40 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              is100Percent
                ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 shadow-[0_0_16px_rgba(52,211,153,0.9)] animate-pulse'
                : 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(56,189,248,0.7)]'
            }`}
            style={{ width: `${percentCompleted}%` }}
          />
        </div>

        <div className="flex items-center justify-between px-3.5 py-2.5">
          {/* Left: Logo & Cloud Sync Status */}
          <div className="flex items-center gap-2">
            <Link href="/today" className="shrink-0 flex items-center md:hidden">
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

          {/* Center: View Selector Dropdown (No x/y badge, completely in front of all app elements) */}
          <div className="flex items-center justify-center relative z-[9999]" ref={viewDropdownRef}>
            <button
              type="button"
              onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 shadow-lg text-white transition-all cursor-pointer active:scale-95"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {currentViewDetails.icon}
                <span className="text-xs font-bold tracking-tight">
                  {currentViewDetails.label}
                </span>
              </div>
              <ChevronDown size={11} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isViewDropdownOpen ? 'rotate-180 text-purple-400' : ''}`} />
            </button>

            {/* Floating Popover Dropdown Menu (Guaranteed in front of all page elements) */}
            {isViewDropdownOpen && (
              <div 
                className="absolute top-full mt-2 w-60 p-2 rounded-2xl bg-slate-950 border border-slate-700 shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl z-[100000] animate-in fade-in zoom-in-95 duration-150"
                style={{ left: '50%', transform: 'translateX(-50%)' }}
              >
                {/* Section 1: Daily Layout Mode */}
                <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Daily Timeline Layout
                </div>
                <div className="space-y-0.5 mb-2">
                  <button
                    type="button"
                    onClick={() => handleSelectView('today', 'chronological')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeCalendarView === 'today' && activeLayoutView === 'chronological'
                        ? 'bg-purple-600 text-white shadow-sm font-extrabold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={13} className={activeCalendarView === 'today' && activeLayoutView === 'chronological' ? 'text-white' : 'text-purple-400'} />
                      <span>Time Blocks</span>
                    </div>
                    {activeCalendarView === 'today' && activeLayoutView === 'chronological' && <Check size={13} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectView('today', 'protocol')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeCalendarView === 'today' && activeLayoutView === 'protocol'
                        ? 'bg-purple-600 text-white shadow-sm font-extrabold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ListOrdered size={13} className={activeCalendarView === 'today' && activeLayoutView === 'protocol' ? 'text-white' : 'text-purple-400'} />
                      <span>Protocols</span>
                    </div>
                    {activeCalendarView === 'today' && activeLayoutView === 'protocol' && <Check size={13} />}
                  </button>
                </div>

                <div className="h-[1px] bg-slate-800/80 my-1" />

                {/* Section 2: Calendar & Multi-Day Views */}
                <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Calendar & Cadence Views
                </div>
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => handleSelectView('pulse')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeCalendarView === 'pulse'
                        ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Activity size={13} className={activeCalendarView === 'pulse' ? 'text-white' : 'text-indigo-400'} />
                      <span>Daily Pulse</span>
                    </div>
                    {activeCalendarView === 'pulse' && <Check size={13} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectView('3day')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeCalendarView === '3day'
                        ? 'bg-teal-600 text-white shadow-sm font-extrabold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Columns size={13} className={activeCalendarView === '3day' ? 'text-white' : 'text-teal-400'} />
                      <span>3-Day View</span>
                    </div>
                    {activeCalendarView === '3day' && <Check size={13} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectView('week')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeCalendarView === 'week'
                        ? 'bg-teal-600 text-white shadow-sm font-extrabold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className={activeCalendarView === 'week' ? 'text-white' : 'text-teal-400'} />
                      <span>7-Day Week</span>
                    </div>
                    {activeCalendarView === 'week' && <Check size={13} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectView('month')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeCalendarView === 'month'
                        ? 'bg-cyan-600 text-white shadow-sm font-extrabold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <LayoutGrid size={13} className={activeCalendarView === 'month' ? 'text-white' : 'text-cyan-400'} />
                      <span>Month Matrix</span>
                    </div>
                    {activeCalendarView === 'month' && <Check size={13} />}
                  </button>
                </div>

                {/* Section 3: Navigation Hubs */}
                <div className="pt-1 mt-1 border-t border-slate-800/80 space-y-0.5">
                  <Link
                    href="/schedule"
                    onClick={() => setIsViewDropdownOpen(false)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-300 hover:bg-amber-950/60 hover:text-white transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Zap size={13} className="text-amber-400 shrink-0" />
                      <span>Master Schedule</span>
                    </div>
                    <span className="text-[9px] uppercase font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                      Rhythms
                    </span>
                  </Link>

                  <Link
                    href="/bench"
                    onClick={() => setIsViewDropdownOpen(false)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold text-purple-300 hover:bg-purple-950/60 hover:text-white transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Bookmark size={13} className="text-purple-400 shrink-0" />
                      <span>Protocol Bench</span>
                    </div>
                    <span className="text-[9px] uppercase font-bold text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30">
                      Saved
                    </span>
                  </Link>
                </div>
              </div>
            )}
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
