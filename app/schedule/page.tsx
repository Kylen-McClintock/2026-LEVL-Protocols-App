'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar as CalendarIcon, Clock, Activity, CalendarDays, Bookmark, Target, TrendingUp, HelpCircle, Scale } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { getProtocolTasksHistory, getOrCreateUserProfile, getDailyWellbeingHistory, getModalities } from '@/lib/data'
import { DailyProtocolTask, UserProfile, DailyWellbeingCheckin, Modality } from '@/lib/types'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, addWeeks, subWeeks } from 'date-fns'
import BiologicalRhythmDashboard from '@/components/calendar/BiologicalRhythmDashboard'
import StackHealthOptimizerModal from '@/components/modals/StackHealthOptimizerModal'

export default function SchedulePage() {
  const { localUserId: authUserId, loading: authLoading } = useAuth()
  const [tasks, setTasks] = useState<DailyProtocolTask[]>([])
  const [allModalities, setAllModalities] = useState<Modality[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [wellbeingLogs, setWellbeingLogs] = useState<DailyWellbeingCheckin[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isStackHealthOpen, setIsStackHealthOpen] = useState(false)

  useEffect(() => {
    async function loadData() {
      const localUserId = authUserId || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '') || getLocalUserId()
      
      // Phase 1: Fetch active week for instant UI render (< 50ms)
      const weekStartStr = format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const weekEndStr = format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      
      const [fetchedProfile, weekData, logs, mods] = await Promise.all([
        getOrCreateUserProfile(localUserId),
        getProtocolTasksHistory(localUserId, weekStartStr, weekEndStr),
        getDailyWellbeingHistory(localUserId, weekStartStr, weekEndStr),
        getModalities()
      ])

      setProfile(fetchedProfile)
      setTasks(weekData)
      setWellbeingLogs(logs)
      if (mods) setAllModalities(mods)
      setLoading(false)

      // Phase 2: Asynchronously expand to full month window in background
      const monthStartStr = format(startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const monthEndStr = format(endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }), 'yyyy-MM-dd')

      if (monthStartStr !== weekStartStr || monthEndStr !== weekEndStr) {
        getProtocolTasksHistory(localUserId, monthStartStr, monthEndStr)
          .then(monthData => {
            if (monthData && monthData.length > 0) {
              setTasks(prevTasks => {
                const map = new Map<string, DailyProtocolTask>()
                monthData.forEach(t => map.set(t.id, t))
                prevTasks.forEach(t => map.set(t.id, t))
                return Array.from(map.values())
              })
            }
          })
          .catch(console.error)
      }
    }

    loadData()

    const handleAuthChange = () => {
      loadData()
    }
    window.addEventListener('levl_auth_user_changed', handleAuthChange)
    return () => {
      window.removeEventListener('levl_auth_user_changed', handleAuthChange)
    }
  }, [currentDate, authUserId])

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1))
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1))

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pt-8 pb-28">
      <header className="mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <CalendarIcon size={28} className="text-levl-accent" /> 
              <span>Master Biological Schedule &amp; Split Matrix</span>
            </h1>
            <p className="text-levl-text-secondary text-xs sm:text-sm mt-1">
              Unified biological timeline: Master protocol pulse, exercise &amp; hypertrophy splits, fasting windows, and peptide cycles.
            </p>
          </div>

          {/* Quick Hub Navigation Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => setIsStackHealthOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Audit Stack Health & Optimize Conflicts"
            >
              <Scale size={13} className="text-amber-400" /> Stack Health
            </button>
            <Link
              href="/guide#schedule"
              className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-600/50 text-purple-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              title="View Fasting & Schedule Guide"
            >
              <HelpCircle size={13} className="text-purple-400" /> Guide
            </Link>
            <Link
              href="/bench"
              className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Bookmark size={13} /> Bench
            </Link>
            <Link
              href="/tracking"
              className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Target size={13} /> Insights
            </Link>
            <Link
              href="/aging"
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Activity size={13} /> Bio-Age
            </Link>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-500 animate-pulse">
          Loading master biological schedule &amp; split matrix...
        </div>
      ) : (
        <BiologicalRhythmDashboard 
          tasks={tasks} 
          currentDate={currentDate}
          userProfile={profile}
          wellbeingLogs={wellbeingLogs}
          onNextMonth={nextWeek}
          onPrevMonth={prevWeek}
        />
      )}

      {/* Stack Health & Conflict Optimizer Modal */}
      <StackHealthOptimizerModal
        isOpen={isStackHealthOpen}
        onClose={() => setIsStackHealthOpen(false)}
        activeTasks={tasks}
        allModalities={allModalities}
        userProfile={profile}
        onOptimizationsApplied={() => {
          // Re-trigger auth user change event to reload schedule
          window.dispatchEvent(new CustomEvent('levl_auth_user_changed'))
        }}
      />
    </div>
  )
}
