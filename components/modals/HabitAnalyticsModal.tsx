'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { 
  X, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Activity, 
  Brain, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Info,
  Microscope,
  CalendarDays,
  CalendarRange,
  ScrollText,
  Check,
  Zap,
  Layers
} from 'lucide-react'
import { Modality } from '@/lib/types'
import { getModalityCompletionHistory, ModalityCompletionHistoryResult, toggleHabitGraduation } from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { getOutcomeColorConfig } from '@/lib/utils/outcomeColors'
import { useTemperatureUnit } from '@/lib/utils/useTemperatureUnit'
import CompletedExecutionSummary from '../execution/CompletedExecutionSummary'

export type AnalyticsCalendarView = '3day' | 'week' | 'month' | 'multimonth'

interface HabitAnalyticsModalProps {
  isOpen: boolean
  onClose: () => void
  modality: Modality
  initialStreakDays?: number
  targetDays?: number
  isAutomated?: boolean
  onGraduationChange?: (isAutomated: boolean) => void
}

export function HabitAnalyticsModal({
  isOpen,
  onClose,
  modality,
  initialStreakDays = 0,
  targetDays = 66,
  isAutomated: initialIsAutomated = false,
  onGraduationChange
}: HabitAnalyticsModalProps) {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [historyData, setHistoryData] = useState<ModalityCompletionHistoryResult | null>(null)
  const [isAutomated, setIsAutomated] = useState(initialIsAutomated)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showScienceExplainer, setShowScienceExplainer] = useState(false)
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | null>(null)
  const [showTimesOverlay, setShowTimesOverlay] = useState(true)
  const [showShiftsOverlay, setShowShiftsOverlay] = useState(true)
  
  // View selector state: '3day' | 'week' | 'month' | 'multimonth'
  const [calendarView, setCalendarView] = useState<AnalyticsCalendarView>('week')
  const [threeDayOffset, setThreeDayOffset] = useState<number>(0)
  const [weekOffset, setWeekOffset] = useState<number>(0)
  const [monthOffset, setMonthOffset] = useState<number>(0)

  const { formatText: formatTemp } = useTemperatureUnit()

  const allowedOutcomeIds = useMemo(() => {
    if (!modality) return null
    let functionalOutcomes = modality.functional_outcomes_to_track || []
    if (typeof functionalOutcomes === 'string') {
      const cleaned = (functionalOutcomes as string).replace(/^{|}$/g, '')
      functionalOutcomes = cleaned ? cleaned.split(',') : []
    }
    const impactKeys = modality.functional_impacts ? Object.keys(modality.functional_impacts) : []
    const modOutcomes = [
      modality.primary_outcome,
      ...(modality.secondary_outcomes || []),
      ...functionalOutcomes,
      ...impactKeys
    ].filter(Boolean)
    
    const ids = new Set<string>()
    modOutcomes.forEach((o: any) => {
      const str = String(typeof o === 'string' ? o : o.id || o.name || '').toLowerCase().trim()
      if (str) {
        ids.add(str)
        ids.add(str.replace(/_/g, ' '))
        ids.add(str.replace(/\s+/g, '_'))
      }
    })

    if (ids.size === 0) {
      const nameLower = (modality.display_name || modality.name || '').toLowerCase()
      const catLower = (modality.category || '').toLowerCase()
      if (nameLower.includes('magnesium') || catLower.includes('sleep') || catLower.includes('nervous system')) {
        ['calmness', 'stress', 'sleep_quality', 'sleep_latency', 'waking_restedness'].forEach(k => {
          ids.add(k)
          ids.add(k.replace(/_/g, ' '))
        })
      } else if (nameLower.includes('cold') || nameLower.includes('sauna') || catLower.includes('thermal')) {
        ['focus', 'energy', 'calmness', 'stress', 'soreness', 'mood'].forEach(k => {
          ids.add(k)
          ids.add(k.replace(/_/g, ' '))
        })
      } else if (catLower.includes('exercise') || catLower.includes('fitness') || catLower.includes('physical')) {
        ['energy', 'soreness', 'strength', 'endurance', 'mood'].forEach(k => {
          ids.add(k)
          ids.add(k.replace(/_/g, ' '))
        })
      }
    }
    
    if (typeof window !== 'undefined' && modality.id) {
      try {
        const raw = localStorage.getItem(`levl_modality_outcomes_${modality.id}`)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            parsed.forEach((id: string) => {
              const str = String(id).toLowerCase().trim()
              if (str) {
                ids.add(str)
                ids.add(str.replace(/_/g, ' '))
                ids.add(str.replace(/\s+/g, '_'))
              }
            })
          }
        }
      } catch (e) {}
    }

    return ids.size > 0 ? ids : null
  }, [modality])

  const trackedOutcomesList = useMemo(() => {
    if (!historyData || !historyData.outcomeShifts) return []
    let shifts = historyData.outcomeShifts
    if (allowedOutcomeIds && allowedOutcomeIds.size > 0) {
      return shifts.filter(s => {
        const idLower = s.outcomeId.toLowerCase().trim()
        const nameLower = s.outcomeName.toLowerCase().trim()
        return (
          allowedOutcomeIds.has(idLower) || 
          allowedOutcomeIds.has(idLower.replace(/_/g, ' ')) ||
          allowedOutcomeIds.has(nameLower) ||
          allowedOutcomeIds.has(nameLower.replace(/\s+/g, '_'))
        )
      }).sort((a, b) => b.sampleCount - a.sampleCount)
    }
    return [...shifts].sort((a, b) => b.sampleCount - a.sampleCount)
  }, [historyData, allowedOutcomeIds])

  useEffect(() => {
    if (trackedOutcomesList.length > 0 && !selectedOutcomeId) {
      setSelectedOutcomeId(trackedOutcomesList[0].outcomeId)
    }
  }, [trackedOutcomesList, selectedOutcomeId])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setIsAutomated(initialIsAutomated)
  }, [initialIsAutomated])

  useEffect(() => {
    if (!isOpen || !modality) return
    async function loadHistory() {
      setLoading(true)
      const localUserId = getLocalUserId()
      const data = await getModalityCompletionHistory(localUserId, modality.id, targetDays)
      setHistoryData(data)
      setLoading(false)
    }
    loadHistory()
  }, [isOpen, modality, targetDays])

  if (!isOpen || !mounted) return null

  const effectiveStreak = Math.max(initialStreakDays, historyData?.totalCompletedDays || 0)
  const pct = isAutomated ? 100 : Math.min(100, Math.round((effectiveStreak / targetDays) * 100))

  // Helper to filter outcomes for a specific day's records
  const getDayOutcomes = (rawOutcomes: any[] | undefined) => {
    if (!rawOutcomes || rawOutcomes.length === 0) return []
    if (!allowedOutcomeIds || allowedOutcomeIds.size === 0) return rawOutcomes
    return rawOutcomes.filter((o: any) => {
      const oId = String(o.outcomeId || '').toLowerCase().trim()
      const oName = String(o.outcomeName || '').toLowerCase().trim()
      return (
        allowedOutcomeIds.has(oId) || 
        allowedOutcomeIds.has(oId.replace(/_/g, ' ')) ||
        allowedOutcomeIds.has(oName) ||
        allowedOutcomeIds.has(oName.replace(/\s+/g, '_'))
      )
    })
  }

  // 3-Day View Data
  const getThreeDayDays = (offset: number) => {
    const centerDate = addDays(new Date(), offset * 3)
    const daysArr = [subDays(centerDate, 1), centerDate, addDays(centerDate, 1)]
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const label = `${format(daysArr[0], 'EEE, MMM d')} – ${format(daysArr[2], 'EEE, MMM d, yyyy')}`

    const days = daysArr.map(d => {
      const dateStr = format(d, 'yyyy-MM-dd')
      const details = historyData?.completionDetailsMap[dateStr]
      const isDayToday = dateStr === todayStr
      const dayOutcomes = getDayOutcomes(details?.outcomes)

      return {
        dateStr,
        dayNum: d.getDate(),
        weekday: format(d, 'EEEE'),
        monthName: format(d, 'MMM'),
        relativeTag: isDayToday ? 'Today' : format(d, 'EEEE'),
        isToday: isDayToday,
        isCompleted: historyData?.completedDates.includes(dateStr) || false,
        completedAt: details?.completedAt,
        outcomes: dayOutcomes,
        executionDetails: details?.executionDetails
      }
    })
    return { label, days }
  }

  // 7-Day Week View Data
  const getWeekDays = (offset: number) => {
    const baseDate = addDays(new Date(), offset * 7)
    const start = startOfWeek(baseDate, { weekStartsOn: 0 })
    const end = endOfWeek(baseDate, { weekStartsOn: 0 })
    const daysArr = eachDayOfInterval({ start, end })
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const label = `Week of ${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`

    const days = daysArr.map(d => {
      const dateStr = format(d, 'yyyy-MM-dd')
      const details = historyData?.completionDetailsMap[dateStr]
      const dayOutcomes = getDayOutcomes(details?.outcomes)

      return {
        dateStr,
        dayNum: d.getDate(),
        weekdayShort: format(d, 'EEE').toUpperCase(),
        weekdayFull: format(d, 'EEEE'),
        monthName: format(d, 'MMM'),
        isToday: dateStr === todayStr,
        isCompleted: historyData?.completedDates.includes(dateStr) || false,
        completedAt: details?.completedAt,
        outcomes: dayOutcomes,
        executionDetails: details?.executionDetails
      }
    })
    return { label, days, completedCount: days.filter(d => d.isCompleted).length }
  }

  // Month View Data
  const getMonthCalendarDays = (offset: number) => {
    const target = new Date()
    target.setMonth(target.getMonth() + offset)
    const year = target.getFullYear()
    const month = target.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDayOfWeek = firstDay.getDay()
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const days: any[] = []

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, 1 - i - 1)
      const dateStr = format(d, 'yyyy-MM-dd')
      days.push({ 
        dateStr, 
        dayNum: d.getDate(), 
        isToday: dateStr === todayStr, 
        isCurrentMonth: false, 
        isCompleted: historyData?.completedDates.includes(dateStr) || false, 
        outcomes: getDayOutcomes(historyData?.completionDetailsMap[dateStr]?.outcomes), 
        completedAt: historyData?.completionDetailsMap[dateStr]?.completedAt 
      })
    }
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(year, month, day)
      const dateStr = format(d, 'yyyy-MM-dd')
      days.push({ 
        dateStr, 
        dayNum: day, 
        isToday: dateStr === todayStr, 
        isCurrentMonth: true, 
        isCompleted: historyData?.completedDates.includes(dateStr) || false, 
        outcomes: getDayOutcomes(historyData?.completionDetailsMap[dateStr]?.outcomes), 
        completedAt: historyData?.completionDetailsMap[dateStr]?.completedAt 
      })
    }
    const endDayOfWeek = lastDay.getDay()
    if (endDayOfWeek < 6) {
      for (let i = 1; i <= 6 - endDayOfWeek; i++) {
        const d = new Date(year, month + 1, i)
        const dateStr = format(d, 'yyyy-MM-dd')
        days.push({ 
          dateStr, 
          dayNum: d.getDate(), 
          isToday: dateStr === todayStr, 
          isCurrentMonth: false, 
          isCompleted: historyData?.completedDates.includes(dateStr) || false, 
          outcomes: getDayOutcomes(historyData?.completionDetailsMap[dateStr]?.outcomes), 
          completedAt: historyData?.completionDetailsMap[dateStr]?.completedAt 
        })
      }
    }
    return { label: target.toLocaleDateString([], { month: 'long', year: 'numeric' }), days }
  }

  const selectedDetails = selectedDate ? historyData?.completionDetailsMap[selectedDate] : null

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Maximum Desktop Screen Real Estate Container */}
      <div className="relative w-[96vw] max-w-6xl xl:max-w-7xl max-h-[94vh] flex flex-col bg-slate-950 border border-indigo-500/30 rounded-2xl shadow-[0_0_60px_rgba(99,102,241,0.25)] overflow-hidden text-white">
        
        {/* Top Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/90 border-b border-indigo-500/20 flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                {modality.category || 'Modality Protocol'}
              </span>
              {isAutomated && (
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  🌿 Automatic Habit
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight truncate">
              {modality.display_name || modality.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Historical Analysis & Habit Automaticity Hub
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/15 transition-colors shrink-0 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Automaticity Score Card */}
          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles className="text-indigo-400 w-5 h-5 shrink-0" />
                <span className="font-extrabold text-sm sm:text-base text-white">Habit Automaticity Progress</span>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/40 px-3 py-1 rounded-full">
                {isAutomated ? '100% Automatic' : `${pct}% Automatic (${effectiveStreak}/${targetDays} Days)`}
              </span>
            </div>
            <div className="w-full h-3 bg-black/60 border border-white/10 rounded-full overflow-hidden p-0.5">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/10 text-xs">
              <span className="text-slate-400">{isAutomated ? '🌿 Graduated to Automatic Habits' : `Target: ~${targetDays} Days to 100% Automaticity`}</span>
              <button
                onClick={async () => {
                  const localUserId = getLocalUserId()
                  const updated = await toggleHabitGraduation(localUserId, modality.id, 'manual')
                  const found = updated.find(h => h.modality_id === modality.id)
                  const nextState = found ? found.is_automated : !isAutomated
                  setIsAutomated(nextState)
                  if (onGraduationChange) onGraduationChange(nextState)
                }}
                className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${isAutomated ? 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20' : 'bg-indigo-500/20 border-indigo-400 text-indigo-200 hover:bg-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]'}`}
              >
                {isAutomated ? 'Move Back to Active Tasks' : '🌿 Move to Automatic Habits'}
              </button>
            </div>
          </div>

          {/* Historical Execution Analysis Section */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-5">
            
            {/* Top Toolbar: View Selector & Overlay Controls */}
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-white/10 pb-3">
              
              {/* Segmented View Mode Selector */}
              <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 gap-1 text-xs">
                <button 
                  type="button" 
                  onClick={() => setCalendarView('3day')} 
                  className={`px-3 py-1.5 rounded-lg font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${calendarView === '3day' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                  title="3-Day View: Comprehensive multi-variable day panels"
                >
                  <CalendarDays size={14} /> 
                  <span>3-Day</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setCalendarView('week')} 
                  className={`px-3 py-1.5 rounded-lg font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${calendarView === 'week' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                  title="7-Day Week View: Weekly historical breakdown"
                >
                  <CalendarRange size={14} /> 
                  <span>7-Day Week</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setCalendarView('month')} 
                  className={`px-3 py-1.5 rounded-lg font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${calendarView === 'month' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                  title="Month Matrix: 35-day grid"
                >
                  <CalendarIcon size={14} /> 
                  <span>Month Matrix</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setCalendarView('multimonth')} 
                  className={`px-3 py-1.5 rounded-lg font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${calendarView === 'multimonth' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                  title="Multi-Month View: 3-month vertical cascade"
                >
                  <ScrollText size={14} /> 
                  <span>Multi-Month</span>
                </button>
              </div>

              {/* Overlay Toggle Buttons & Outcome Dropdown */}
              <div className="flex items-center gap-2 flex-wrap">
                <button 
                  type="button"
                  onClick={() => setShowTimesOverlay(!showTimesOverlay)} 
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${showTimesOverlay ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400'}`}
                >
                  <Clock size={12} />
                  <span>🕒 Times</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setShowShiftsOverlay(!showShiftsOverlay)} 
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${showShiftsOverlay ? 'bg-purple-500/20 border-purple-400 text-purple-300' : 'bg-white/5 border-white/10 text-slate-400'}`}
                >
                  <Activity size={12} />
                  <span>⚡ Outcome Shifts</span>
                </button>
                {showShiftsOverlay && trackedOutcomesList.length > 0 && (
                  <select 
                    value={selectedOutcomeId || ''} 
                    onChange={(e) => setSelectedOutcomeId(e.target.value)} 
                    className="bg-purple-950/80 border border-purple-500/40 text-purple-200 font-bold text-[11px] rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
                  >
                    {trackedOutcomesList.map(out => (
                      <option key={out.outcomeId} value={out.outcomeId} className="bg-slate-900 text-white">
                        {out.outcomeName} ({out.sampleCount} / {effectiveStreak} days logged)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* VIEW 1: 3-DAY SPLIT VIEW (ALL TEXT, OUTCOMES, DOSAGES VISIBLE WITHOUT CLICKING) */}
            {calendarView === '3day' && (() => {
              const { label, days } = getThreeDayDays(threeDayOffset)
              return (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setThreeDayOffset(prev => prev - 1)} className="px-3 py-1.5 bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1">
                        <ChevronLeft size={14} /> Prev 3 Days
                      </button>
                      <span className="font-extrabold text-sm text-white px-2 font-mono">{label}</span>
                      <button onClick={() => setThreeDayOffset(prev => prev + 1)} disabled={threeDayOffset >= 0} className="px-3 py-1.5 bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-30">
                        Next 3 Days <ChevronRight size={14} />
                      </button>
                      {threeDayOffset !== 0 && (
                        <button onClick={() => setThreeDayOffset(0)} className="text-xs text-indigo-400 hover:underline font-bold ml-1 cursor-pointer">Current</button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {days.map(day => {
                      const formattedTime = day.completedAt 
                        ? new Date(day.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : null

                      const isDaySelected = selectedDate === day.dateStr

                      return (
                        <div
                          key={day.dateStr}
                          onClick={() => setSelectedDate(isDaySelected ? null : day.dateStr)}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-4 relative ${
                            day.isCompleted
                              ? 'bg-gradient-to-b from-emerald-950/20 via-slate-950/80 to-slate-950 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.12)]'
                              : day.isToday
                              ? 'bg-slate-950/90 border-indigo-500/40'
                              : 'bg-slate-950/40 border-white/10'
                          } ${isDaySelected ? 'ring-2 ring-white scale-[1.01]' : ''}`}
                        >
                          {/* Header: Date + Relative Pill */}
                          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                            <div>
                              <span className="font-black text-base text-white block">{day.monthName} {day.dayNum}, {day.weekday}</span>
                              <span className="text-[11px] font-mono text-slate-400">{day.dateStr}</span>
                            </div>
                            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                              day.isToday ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' :
                              day.isCompleted ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                              'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {day.relativeTag}
                            </span>
                          </div>

                          {/* Execution Status & Timestamp */}
                          <div className="space-y-1.5">
                            {day.isCompleted ? (
                              <div className="flex items-center justify-between gap-2 bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl">
                                <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                                  <CheckCircle2 size={16} className="text-emerald-400" /> Completed Session
                                </span>
                                {formattedTime && (
                                  <span className="text-xs font-mono font-bold text-slate-200 bg-black/60 px-2 py-0.5 rounded border border-white/10">
                                    🕒 {formattedTime}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="bg-slate-900/60 border border-white/5 p-2.5 rounded-xl text-xs text-slate-400 font-medium">
                                ⚪ No execution logged for this date
                              </div>
                            )}
                          </div>

                          {/* Prescribed Dosage & Logged Execution Parameters */}
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                              <Microscope size={12} /> Dosage & Parameters
                            </span>
                            
                            <div className="bg-black/50 border border-white/10 rounded-xl p-3 space-y-1.5 text-xs">
                              {modality.dose_or_exposure && (
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-slate-400 text-[11px]">Prescribed Target:</span>
                                  <span className="font-mono font-bold text-emerald-300 text-right">
                                    {formatTemp(modality.dose_or_exposure)} {modality.timing_summary ? `(${modality.timing_summary})` : ''}
                                  </span>
                                </div>
                              )}

                              {day.executionDetails?.custom_dose && (
                                <div className="flex items-start justify-between gap-2 pt-1 border-t border-white/5">
                                  <span className="text-slate-400 text-[11px]">Logged Dose:</span>
                                  <span className="font-mono font-bold text-emerald-400">{formatTemp(day.executionDetails.custom_dose)}</span>
                                </div>
                              )}

                              {day.executionDetails?.duration && (
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-slate-400 text-[11px]">Duration:</span>
                                  <span className="font-mono font-bold text-white">{day.executionDetails.duration} mins</span>
                                </div>
                              )}

                              {day.executionDetails?.temperature && (
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-slate-400 text-[11px]">Temperature:</span>
                                  <span className="font-mono font-bold text-white">{formatTemp(`${day.executionDetails.temperature}°${day.executionDetails.temperature_unit || 'F'}`)}</span>
                                </div>
                              )}

                              {day.executionDetails?.notes && (
                                <div className="pt-1 border-t border-white/5 text-[11px] text-slate-300 italic">
                                  &quot;{day.executionDetails.notes}&quot;
                                </div>
                              )}
                            </div>
                          </div>

                          {/* ALL Tracked Outcome Shifts for this Day */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-purple-300">
                              <span className="flex items-center gap-1"><Activity size={12} /> All Tracked Outcome Shifts</span>
                              <span className="text-slate-400 font-normal">({day.outcomes?.length || 0} Logged)</span>
                            </div>

                            {day.outcomes && day.outcomes.length > 0 ? (
                              <div className="space-y-1.5">
                                {day.outcomes.map((out: any, oIdx: number) => {
                                  const preVal = out.preValue
                                  const postVal = out.postValue
                                  const preCfg = preVal !== undefined ? getOutcomeColorConfig(preVal, out.directionality) : null
                                  const postCfg = postVal !== undefined ? getOutcomeColorConfig(postVal, out.directionality) : null
                                  const delta = (preVal !== undefined && postVal !== undefined) ? Math.round((postVal - preVal) * 10) / 10 : null

                                  return (
                                    <div key={oIdx} className="bg-purple-950/30 border border-purple-500/30 p-2.5 rounded-xl flex items-center justify-between gap-2">
                                      <span className="font-bold text-white text-xs">{out.outcomeName}</span>
                                      
                                      <div className="flex items-center gap-1.5 font-mono font-extrabold text-xs">
                                        {preVal !== undefined ? (
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${preCfg?.badgeBg} ${preCfg?.textColor}`}>
                                            Pre: {preVal}
                                          </span>
                                        ) : (
                                          <span className="text-slate-500 text-[10px]">Pre: --</span>
                                        )}

                                        <span className="text-slate-500 text-[10px]">➔</span>

                                        {postVal !== undefined ? (
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${postCfg?.badgeBg} ${postCfg?.textColor}`}>
                                            Post: {postVal}
                                          </span>
                                        ) : (
                                          <span className="text-slate-500 text-[10px]">Post: --</span>
                                        )}

                                        {delta !== null && (
                                          <span className={`ml-1 text-[11px] font-bold ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            ({delta >= 0 ? `+${delta}` : delta})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-500 italic p-2 bg-black/30 rounded-lg border border-white/5">
                                No outcome ratings submitted for this date.
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* VIEW 2: 7-DAY WEEK VIEW (ALL OUTCOMES, DOSAGES, TIMES VISIBLE DIRECTLY) */}
            {calendarView === 'week' && (() => {
              const { label, days, completedCount } = getWeekDays(weekOffset)
              return (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setWeekOffset(prev => prev - 1)} className="px-3 py-1.5 bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1">
                        <ChevronLeft size={14} /> Prev Week
                      </button>
                      <span className="font-extrabold text-sm text-white px-2 font-mono">{label}</span>
                      <button onClick={() => setWeekOffset(prev => prev + 1)} disabled={weekOffset >= 0} className="px-3 py-1.5 bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-30">
                        Next Week <ChevronRight size={14} />
                      </button>
                      {weekOffset !== 0 && (
                        <button onClick={() => setWeekOffset(0)} className="text-xs text-indigo-400 hover:underline font-bold ml-1 cursor-pointer">Current Week</button>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800/60 px-3 py-1 rounded-full">
                      {completedCount} / 7 Days Complete
                    </span>
                  </div>

                  {/* 7 Responsive Full Column Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
                    {days.map(day => {
                      const formattedTime = day.completedAt 
                        ? new Date(day.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : null

                      const isDaySelected = selectedDate === day.dateStr

                      return (
                        <div
                          key={day.dateStr}
                          onClick={() => setSelectedDate(isDaySelected ? null : day.dateStr)}
                          className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between min-h-[260px] space-y-3 cursor-pointer ${
                            day.isCompleted
                              ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:border-emerald-300'
                              : day.isToday
                              ? 'bg-indigo-950/30 border-indigo-400/50 hover:border-indigo-300'
                              : 'bg-slate-950/40 border-white/10 hover:border-white/20'
                          } ${isDaySelected ? 'ring-2 ring-white scale-[1.02] z-10' : ''}`}
                        >
                          {/* Top: Day & Date Header */}
                          <div className="space-y-1 border-b border-white/10 pb-2">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-black tracking-wider text-slate-300 uppercase">
                                {day.weekdayShort}
                              </span>
                              {day.isToday && (
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                                  Today
                                </span>
                              )}
                            </div>
                            <div className="text-lg font-black text-white font-mono leading-tight">
                              {day.monthName} {day.dayNum}
                            </div>
                          </div>

                          {/* Middle 1: Status & Time */}
                          <div className="space-y-1">
                            {day.isCompleted ? (
                              <div className="space-y-1">
                                <div className="text-[11px] font-black text-emerald-400 flex items-center gap-1">
                                  <Check size={13} className="stroke-[3]" /> Completed
                                </div>
                                {formattedTime && (
                                  <div className="text-[10px] font-mono text-slate-200 bg-black/60 px-1.5 py-0.5 rounded border border-white/10 truncate">
                                    🕒 {formattedTime}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-medium block">
                                — Not Logged
                              </span>
                            )}
                          </div>

                          {/* Middle 2: Dosage & Parameters */}
                          <div className="space-y-1 pt-1 border-t border-white/5">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                              Prescribed Dose
                            </span>
                            <div className="text-[11px] font-mono font-bold text-slate-200 bg-black/40 p-1.5 rounded-lg border border-white/5 leading-snug line-clamp-2">
                              {formatTemp(day.executionDetails?.custom_dose || modality.dose_or_exposure || 'Standard Dose')}
                            </div>
                          </div>

                          {/* Bottom: ALL Tracked Outcome Shifts */}
                          <div className="space-y-1.5 pt-1 border-t border-white/5 flex-1 flex flex-col justify-end">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-purple-300 block">
                              Outcome Shifts ({day.outcomes?.length || 0})
                            </span>
                            
                            {day.outcomes && day.outcomes.length > 0 ? (
                              <div className="space-y-1">
                                {day.outcomes.map((out: any, oIdx: number) => {
                                  const preVal = out.preValue
                                  const postVal = out.postValue
                                  const delta = (preVal !== undefined && postVal !== undefined) ? Math.round((postVal - preVal) * 10) / 10 : null

                                  return (
                                    <div key={oIdx} className="bg-purple-950/40 border border-purple-500/30 px-1.5 py-1 rounded-lg text-[10px] flex items-center justify-between gap-1">
                                      <span className="font-bold text-white truncate max-w-[80px]">{out.outcomeName}</span>
                                      <span className="font-mono text-emerald-300 font-extrabold shrink-0">
                                        {preVal !== undefined && postVal !== undefined ? `${preVal}➔${postVal}` : ''}
                                        {delta !== null && (
                                          <span className={`ml-1 ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            ({delta >= 0 ? `+${delta}` : delta})
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-600 italic block">
                                No outcome ratings
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* VIEW 3 & 4: SINGLE MONTH MATRIX & MULTI-MONTH CASCADE */}
            {(calendarView === 'month' || calendarView === 'multimonth') && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  {calendarView === 'month' ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setMonthOffset(prev => prev - 1)} className="px-3 py-1.5 bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1">
                        <ChevronLeft size={14} /> Prev Month
                      </button>
                      <span className="font-extrabold text-sm text-white px-2 font-mono">{getMonthCalendarDays(monthOffset).label}</span>
                      <button onClick={() => setMonthOffset(prev => prev + 1)} disabled={monthOffset >= 0} className="px-3 py-1.5 bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-30">
                        Next Month <ChevronRight size={14} />
                      </button>
                      {monthOffset !== 0 && (
                        <button onClick={() => setMonthOffset(0)} className="text-xs text-indigo-400 hover:underline font-bold ml-1 cursor-pointer">Today</button>
                      )}
                    </div>
                  ) : (
                    <span className="font-extrabold text-xs text-purple-300 flex items-center gap-1.5">
                      📜 3-Month Vertical Scroll Matrix
                    </span>
                  )}
                </div>

                <div className={`space-y-6 ${calendarView === 'multimonth' ? 'max-h-[500px] overflow-y-auto pr-1 custom-scrollbar' : ''}`}>
                  {(calendarView === 'multimonth' ? [monthOffset - 2, monthOffset - 1, monthOffset] : [monthOffset]).map(mOffset => {
                    const monthData = getMonthCalendarDays(mOffset)

                    return (
                      <div key={mOffset} className="space-y-2">
                        {calendarView === 'multimonth' && (
                          <div className="text-xs font-black uppercase tracking-wider text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-3 py-1.5 rounded-lg flex items-center justify-between">
                            <span>{monthData.label}</span>
                            <span className="text-xs text-slate-400 font-mono font-normal">
                              {monthData.days.filter((d: any) => d.isCurrentMonth && d.isCompleted).length} Sessions Logged
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
                          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(dayName => (
                            <div key={dayName} className="text-[11px] font-extrabold tracking-wider text-slate-400 py-1.5 border-b border-white/5">
                              {dayName}
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
                          {monthData.days.map((day: any) => {
                            const formattedTime = day.completedAt 
                              ? new Date(day.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(' ', '')
                              : null

                            const activeOutcomeObj = trackedOutcomesList.find(o => o.outcomeId === selectedOutcomeId) || trackedOutcomesList[0]
                            const matchedObs = day.outcomes?.find((o: any) => 
                              o.outcomeId === selectedOutcomeId || 
                              (activeOutcomeObj && o.outcomeName.toLowerCase() === activeOutcomeObj.outcomeName.toLowerCase())
                            )

                            const preVal = matchedObs?.preValue
                            const postVal = matchedObs?.postValue
                            const hasShift = preVal !== undefined && postVal !== undefined
                            const delta = hasShift ? Math.round((postVal! - preVal!) * 10) / 10 : null

                            const preCfg = preVal !== undefined ? getOutcomeColorConfig(preVal, matchedObs?.directionality || 'higher_is_better') : null
                            const postCfg = postVal !== undefined ? getOutcomeColorConfig(postVal, matchedObs?.directionality || 'higher_is_better') : null

                            return (
                              <button
                                key={day.dateStr}
                                onClick={() => setSelectedDate(day.dateStr === selectedDate ? null : day.dateStr)}
                                title={`${day.dateStr}${day.isCompleted ? ' - Completed' : ''}`}
                                className={`min-h-[64px] sm:min-h-[74px] p-1.5 rounded-xl flex flex-col items-center justify-between text-xs font-mono font-bold transition-all relative cursor-pointer border ${
                                  !day.isCurrentMonth ? 'opacity-30 border-transparent bg-white/2 text-slate-600' :
                                  day.isCompleted
                                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)] hover:scale-105'
                                    : day.isToday
                                    ? 'bg-indigo-500/10 border-indigo-400 text-indigo-300'
                                    : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300'
                                } ${selectedDate === day.dateStr ? 'ring-2 ring-white scale-105 z-10' : ''}`}
                              >
                                <div className="w-full flex items-center justify-between text-[11px]">
                                  <span>{day.dayNum}</span>
                                  {day.isCompleted && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                                  )}
                                </div>

                                <div className="w-full flex flex-col items-center gap-0.5 mt-1">
                                  {showTimesOverlay && formattedTime && day.isCompleted && (
                                    <span className="text-[9px] font-mono leading-none text-indigo-300 bg-indigo-950/90 border border-indigo-500/40 px-1 py-0.5 rounded w-full truncate text-center">
                                      {formattedTime}
                                    </span>
                                  )}

                                  {showShiftsOverlay && hasShift && (
                                    <div className="w-full flex items-center justify-center gap-0.5 text-[9px] font-mono font-extrabold bg-black/80 border border-purple-500/40 rounded py-0.5 px-0.5 shadow-md">
                                      <span className={`px-1 py-0.2 rounded text-[8px] ${preCfg?.badgeBg} ${preCfg?.textColor}`}>
                                        {preVal}
                                      </span>
                                      <span className="text-slate-400 text-[8px]">➔</span>
                                      <span className={`px-1 py-0.2 rounded text-[8px] ${postCfg?.badgeBg} ${postCfg?.textColor}`}>
                                        {postVal}
                                      </span>
                                      {delta !== null && (
                                        <span className={`text-[8px] font-bold ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                          ({delta >= 0 ? `+${delta}` : delta})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Selected Date Detail Drawer (Active on Click) */}
            {selectedDate && (
              <div className="mt-3 p-4 sm:p-5 bg-slate-900/95 border border-indigo-500/30 rounded-2xl text-xs space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between text-slate-300 font-bold border-b border-white/10 pb-3 flex-wrap gap-2">
                  <span className="text-white font-mono text-sm sm:text-base">📅 Inspected Date: {selectedDate}</span>
                  <span className={historyData?.completedDates.includes(selectedDate) ? 'text-emerald-400 font-extrabold' : 'text-slate-500'}>
                    {historyData?.completedDates.includes(selectedDate) ? '✓ Completed Session' : 'Not Executed'}
                  </span>
                </div>

                {selectedDetails?.completedAt && (
                  <p className="text-slate-300 flex items-center gap-1.5 font-mono text-xs">
                    <Clock size={14} className="text-indigo-400" />
                    <span>Completion Timestamp: {new Date(selectedDetails.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </p>
                )}

                {/* Outcome Observations Tracked on Selected Date */}
                {(() => {
                  const filteredOutcomes = getDayOutcomes(selectedDetails?.outcomes)

                  return (
                    <div className="space-y-2.5 pt-1 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-purple-300">
                        <span>⚡ Outcome Observations Tracked on {selectedDate}</span>
                        <span className="text-slate-400 font-normal">({filteredOutcomes.length} Logged)</span>
                      </div>

                      {filteredOutcomes.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                          {filteredOutcomes.map((out: any, idx: number) => {
                            const preVal = out.preValue
                            const postVal = out.postValue
                            const preCfg = preVal !== undefined ? getOutcomeColorConfig(preVal, out.directionality) : null
                            const postCfg = postVal !== undefined ? getOutcomeColorConfig(postVal, out.directionality) : null
                            const delta = (preVal !== undefined && postVal !== undefined) ? Math.round((postVal - preVal) * 10) / 10 : null

                            return (
                              <div key={idx} className="bg-black/60 border border-white/10 p-3 rounded-xl flex items-center justify-between gap-2">
                                <span className="font-bold text-white text-xs">{out.outcomeName}</span>
                                
                                <div className="flex items-center gap-1.5 font-mono font-extrabold text-xs">
                                  {preVal !== undefined ? (
                                    <span className={`px-2 py-0.5 rounded text-xs ${preCfg?.badgeBg} ${preCfg?.textColor}`}>
                                      Pre: {preVal}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 text-xs">Pre: --</span>
                                  )}

                                  <span className="text-slate-400 text-xs">➔</span>

                                  {postVal !== undefined ? (
                                    <span className={`px-2 py-0.5 rounded text-xs ${postCfg?.badgeBg} ${postCfg?.textColor}`}>
                                      Post: {postVal}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 text-xs">Post: --</span>
                                  )}

                                  {delta !== null && (
                                    <span className={`text-xs font-bold ml-1 ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                      ({delta >= 0 ? `+${delta}` : delta})
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic py-1">
                          No outcome observation ratings were recorded on this date.
                        </p>
                      )}
                    </div>
                  )
                })()}

                {/* Logged Dosage & Precision Execution Parameters for Selected Date */}
                {(modality.dose_or_exposure || modality.timing_summary || selectedDetails?.executionDetails) && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Microscope size={14} className="text-emerald-400 shrink-0" />
                      <span>Logged Dosage & Execution Parameters</span>
                    </div>

                    {modality.dose_or_exposure && (
                      <div className="bg-black/60 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between text-xs flex-wrap gap-2">
                        <span className="text-slate-300 font-semibold">Prescribed Protocol Dose:</span>
                        <span className="font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30 font-mono">
                          {formatTemp(modality.dose_or_exposure)} {modality.timing_summary ? `(${modality.timing_summary})` : ''}
                        </span>
                      </div>
                    )}

                    {selectedDetails?.executionDetails && (
                      <CompletedExecutionSummary 
                        modalityType={modality.modality_type || ''} 
                        loggingType={modality.logging_type || ''} 
                        details={selectedDetails.executionDetails} 
                        onEdit={() => {}} 
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tracked Outcome Shift Progress Bars */}
          {trackedOutcomesList.length > 0 && (
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-white">
                  <Activity className="text-purple-400 w-5 h-5" />
                  <span>Cumulative Tracked Outcome Shifts (Pre ➔ Post Response)</span>
                </div>
                <span className="text-xs text-slate-400">
                  Average shifts across {historyData?.totalCompletedDays || 0} completed days
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {trackedOutcomesList.map(out => {
                  const isPositive = out.avgDelta > 0
                  return (
                    <div key={out.outcomeId} className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-white text-sm">{out.outcomeName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{out.avgPre}/10 ➔ {out.avgPost}/10</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${isPositive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'}`}>
                            {isPositive ? `+${out.avgDelta}` : out.avgDelta} shift
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden flex items-center p-0.5 border border-white/10">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                          style={{ width: `${Math.min(100, Math.max(10, (out.avgPost / 10) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* AI Multi-Variable Stack Synergy Synthesis */}
          <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-purple-300 border-b border-purple-500/20 pb-2">
              <Brain className="text-purple-400 w-5 h-5 shrink-0" />
              <span>AI Multi-Variable Stack Synergy Synthesis</span>
            </div>

            {(() => {
              const shifts = historyData?.outcomeShifts || []
              const totalCompletions = historyData?.completedDates?.length || 0

              if (totalCompletions <= 1 || shifts.length === 0) {
                return (
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Initial completion logged for <strong className="text-white">{modality.display_name || modality.name}</strong>. Multi-day stack synergy and average outcome shifts will synthesize automatically as more sessions are recorded.
                  </p>
                )
              }

              const validShifts = shifts.filter(s => s.avgDelta !== 0)
              const topShift = validShifts[0] || shifts[0]
              const avgShiftVal = topShift ? (topShift.avgDelta > 0 ? `+${topShift.avgDelta.toFixed(1)}` : topShift.avgDelta.toFixed(1)) : '+0.0'

              return (
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Based on <strong className="text-white">{totalCompletions} completed sessions</strong>, doing <strong className="text-white">{modality.display_name || modality.name}</strong> yields an average 
                  <span className="text-emerald-400 font-bold"> {avgShiftVal} pt shift in {topShift?.outcomeName || 'tracked outcomes'}</span> over baseline.
                </p>
              )
            })()}

            {/* Co-Administered Stack Context Box */}
            {historyData && historyData.coAdministeredModalities.length > 0 ? (
              <div className="p-3.5 bg-black/50 border border-purple-500/20 rounded-xl text-xs space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 block">
                  ⚡ Co-Administered Stack Context:
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Notice: This modality is co-administered with active protocols in your stack: {' '}
                  <span className="text-purple-300 font-bold">
                    {historyData.coAdministeredModalities.slice(0, 4).join(', ')}
                  </span>. 
                  Observed shifts represent multi-variable stack synergy rather than single-agent isolation.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-black/50 border border-white/10 rounded-xl text-xs text-slate-400">
                Stack Synergy Context: No co-administered protocols logged on completion days. Outcome shifts represent single-agent response.
              </div>
            )}
          </div>

          {/* 66-Day Neuroscience & Flexibility Rationale Accordion */}
          <div className="border border-white/10 rounded-2xl overflow-hidden bg-slate-900/40">
            <button
              onClick={() => setShowScienceExplainer(!showScienceExplainer)}
              className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-2 text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Info size={16} className="text-indigo-400 shrink-0" />
                <span>Why ~66 Days to Automaticity? (Neuroplasticity Science & Rationale)</span>
              </div>
              {showScienceExplainer ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showScienceExplainer && (
              <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-300 space-y-3 border-t border-white/10 pt-3 animate-in fade-in">
                <div className="space-y-1">
                  <h4 className="font-bold text-white">🧠 The UCL Phillippa Lally Automaticity Study:</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Research from University College London (Lally et al., European Journal of Social Psychology) demonstrates 
                    that reaching peak behavioral automaticity takes an average of <strong>66 days</strong> (range: 18 to 254 days), 
                    depending on behavioral complexity and neuroplastic adaptation.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-emerald-400">🌿 The Non-Linear Habit Principle (Skipped Days Rationale):</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Crucially, the Lally study proved that <strong>missing an occasional day does NOT derail habit formation momentum</strong> or reset your automaticity score to zero. 
                    Consistency over time—rather than unbroken perfection—drives long-term basal ganglia encoding.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
