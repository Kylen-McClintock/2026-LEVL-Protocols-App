import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DailyProtocolTask, UserProfile, DailyWellbeingCheckin } from '@/lib/types'
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth, startOfWeek, endOfWeek, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight, Activity, CalendarDays, BarChart2, X, Dumbbell, Flame, Dna, Sparkles, Zap, Layers } from 'lucide-react'
import { BiologicalVector, generateWaveforms, getDailyIntent, getWindowIntent, WaveformEvent, SCIENTIFIC_VECTOR_REGISTRY, calculateDynamicFastedWindow } from '@/lib/calendar/waveformMapper'
import CadenceTracks from './CadenceTracks'
import MonthHeatmapView from './MonthHeatmapView'
import ExerciseSplitView from './ExerciseSplitView'
import FastingSplitView from './FastingSplitView'
import PeptideSplitView from './PeptideSplitView'
import DailyVerticalPulseView from './DailyVerticalPulseView'

type DomainLens = 'all' | 'exercise' | 'fasting' | 'peptides'

type Props = {
  tasks: DailyProtocolTask[]
  currentDate: Date
  userProfile?: UserProfile | null
  wellbeingLogs?: DailyWellbeingCheckin[]
  onNextMonth: () => void
  onPrevMonth: () => void
}

const getPixelOffset = (hour: number) => {
  if (hour < 5) return (hour / 5) * 40
  return 40 + (hour - 5) * 40
}

export default function BiologicalRhythmDashboard({ tasks, currentDate, userProfile, wellbeingLogs = [], onNextMonth, onPrevMonth }: Props) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate)
  
  // Initialize activeLens from URL query param (?tab=exercise) or localStorage
  const [activeLens, setActiveLens] = useState<DomainLens>(() => {
    if (typeof window !== 'undefined') {
      const param = new URLSearchParams(window.location.search).get('tab') as DomainLens
      if (param && ['all', 'exercise', 'fasting', 'peptides'].includes(param)) {
        return param
      }
      const saved = localStorage.getItem('levl_schedule_active_lens') as DomainLens
      if (saved && ['all', 'exercise', 'fasting', 'peptides'].includes(saved)) {
        return saved
      }
    }
    return 'all'
  })

  // Function to switch active lens and persist to URL and localStorage
  const handleSelectLens = (lens: DomainLens) => {
    setActiveLens(lens)
    if (typeof window !== 'undefined') {
      localStorage.setItem('levl_schedule_active_lens', lens)
      const url = new URL(window.location.href)
      if (lens === 'all') {
        url.searchParams.delete('tab')
      } else {
        url.searchParams.set('tab', lens)
      }
      window.history.replaceState(null, '', url.toString())
    }
  }
  
  // Interactive Modal State
  const [selectedVectorData, setSelectedVectorData] = useState<{
    vector: string;
    waveforms: WaveformEvent[];
    allDayWaveforms: WaveformEvent[];
  } | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
  
  // Group tasks by day for the weekly view
  const tasksByDay = useMemo(() => {
    const map = new Map<string, DailyProtocolTask[]>()
    weekDays.forEach(day => map.set(format(day, 'yyyy-MM-dd'), []))
    
    tasks.forEach(task => {
      if (task.scheduled_date && map.has(task.scheduled_date)) {
        // Check custom schedule_config days_of_week
        const modKey = task.modality_id || task.protocol_step_id || task.id
        let schedConfig: any = task.execution_details?.schedule_config
        if (!schedConfig && typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem(`levl_modality_sched_${modKey}`)
            if (raw) schedConfig = JSON.parse(raw)
          } catch (e) {}
        }

        if (schedConfig) {
          if (schedConfig.schedule_mode === 'specific_dates' || (Array.isArray(schedConfig.specific_dates) && schedConfig.specific_dates.length > 0)) {
            if (!schedConfig.specific_dates.includes(task.scheduled_date)) {
              if (task.status !== 'completed') return
            }
          } else if (schedConfig.schedule_mode === 'rest_interval' && schedConfig.is_rolling_rotation !== false && schedConfig.rest_days_between !== undefined) {
            const anchorStr = (schedConfig.anchor_date || task.scheduled_date || '').split('T')[0]
            if (anchorStr) {
              const d1 = new Date(anchorStr + 'T12:00:00')
              const d2 = new Date(task.scheduled_date + 'T12:00:00')
              const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
              const step = schedConfig.rest_days_between + 1
              if (diffDays >= 0 && diffDays % step !== 0) {
                if (task.status !== 'completed') return
              }
            }
          } else if (Array.isArray(schedConfig.days_of_week) && schedConfig.days_of_week.length > 0) {
            const dayName = format(new Date(task.scheduled_date + 'T12:00:00'), 'EEE') // e.g. "Mon"
            const match = schedConfig.days_of_week.map((d: string) => d.toLowerCase().slice(0, 3))
            if (!match.includes(dayName.toLowerCase().slice(0, 3))) {
              if (task.status !== 'completed') return
            }
          }
        }

        const dayList = map.get(task.scheduled_date)!
        // Deduplicate
        const mId = task.modality_id || task.loose_modality?.id || task.protocol_step?.modality_id || task.id
        if (mId && dayList.some(t => (t.modality_id || t.loose_modality?.id || t.protocol_step?.modality_id || t.id) === mId)) {
          return 
        }
        dayList.push(task)
      }
    })
    return map
  }, [tasks, weekDays])

  // Compute Weekly Stats
  const weekIntent = getDailyIntent(tasks.filter(t => {
    const d = new Date(t.scheduled_date + 'T00:00:00')
    return d >= weekStart && d <= weekEnd
  }))
  
  const getVectorColor = (vector: BiologicalVector) => {
    switch (vector) {
      case 'mTOR_Growth': return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      case 'AMPK_Clearance': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
      case 'Sympathetic_Load': return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'Parasympathetic_Recovery': return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'Senolytic_Clearance': return 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/50'
      default: return 'bg-white/10 text-gray-300 border-white/20'
    }
  }

  const getIntentColor = (intentStr: string) => {
    if (intentStr === 'Growth') return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
    if (intentStr === 'Clearance') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
    if (intentStr === 'Performance') return 'bg-red-500/20 text-red-400 border-red-500/50'
    if (intentStr === 'Recovery') return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
    if (intentStr.includes('Senolytic')) return 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/50'
    if (intentStr === 'Hybrid') return 'bg-levl-purple/20 text-levl-purple border-levl-purple/50'
    return 'bg-white/5 text-gray-400 border-white/10'
  }

  const getVectorColorHex = (v: string) => {
    if (v === 'mTOR_Growth') return 'bg-orange-500'
    if (v === 'AMPK_Clearance') return 'bg-emerald-500'
    if (v === 'Sympathetic_Load') return 'bg-red-500'
    if (v === 'Parasympathetic_Recovery') return 'bg-blue-500'
    if (v === 'Senolytic_Clearance') return 'bg-fuchsia-500'
    return 'bg-gray-500'
  }

  const getVectorColorConfig = (v: string) => {
    switch (v) {
      case 'mTOR_Growth':
        return {
          textColor: 'text-orange-400',
          gradientFrom: 'from-orange-500/90',
          badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
        }
      case 'AMPK_Clearance':
        return {
          textColor: 'text-emerald-400',
          gradientFrom: 'from-emerald-400/90',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        }
      case 'Sympathetic_Load':
        return {
          textColor: 'text-red-400',
          gradientFrom: 'from-red-500/90',
          badgeBg: 'bg-red-500/20 text-red-300 border-red-500/30'
        }
      case 'Parasympathetic_Recovery':
        return {
          textColor: 'text-blue-400',
          gradientFrom: 'from-blue-500/90',
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
        }
      case 'Senolytic_Clearance':
        return {
          textColor: 'text-fuchsia-400',
          gradientFrom: 'from-fuchsia-500/90',
          badgeBg: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30'
        }
      default:
        return {
          textColor: 'text-gray-400',
          gradientFrom: 'from-gray-400/90',
          badgeBg: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
        }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Master Domain Lens Switcher Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/80 pt-1">
        <button
          onClick={() => handleSelectLens('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border shrink-0 ${
            activeLens === 'all'
              ? 'bg-levl-accent text-black font-extrabold border-levl-accent shadow-md'
              : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Zap size={14} />
          <span>⚡ All Protocols (Master Pulse)</span>
        </button>

        <button
          onClick={() => handleSelectLens('exercise')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border shrink-0 ${
            activeLens === 'exercise'
              ? 'bg-orange-500 text-black font-extrabold border-orange-400 shadow-md'
              : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Dumbbell size={14} />
          <span>🏋️‍♂️ Exercise &amp; Split</span>
        </button>

        <button
          onClick={() => handleSelectLens('fasting')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border shrink-0 ${
            activeLens === 'fasting'
              ? 'bg-teal-500 text-black font-extrabold border-teal-400 shadow-md'
              : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Flame size={14} />
          <span>🥗 Nutrition &amp; Fasting</span>
        </button>

        <button
          onClick={() => handleSelectLens('peptides')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border shrink-0 ${
            activeLens === 'peptides'
              ? 'bg-fuchsia-500 text-black font-extrabold border-fuchsia-400 shadow-md'
              : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Dna size={14} />
          <span>🧬 Peptide Cycles</span>
        </button>
      </div>

      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onPrevMonth} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-white/10 rounded-lg">
            <CalendarDays size={16} className="text-levl-accent" />
            <span className="font-bold text-sm">
              {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
            </span>
          </div>
          <button onClick={onNextMonth} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-6">
          {activeLens === 'all' && (
            <div className="text-sm">
              <span className="text-gray-400 mr-2">Week focus:</span>
              <span className={`font-bold px-3 py-1 rounded-full text-xs border ${getIntentColor(weekIntent)}`}>
                {weekIntent}
              </span>
            </div>
          )}
          
          {activeLens === 'all' && (
            <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
              <button 
                onClick={() => setViewMode('daily')}
                className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer ${viewMode === 'daily' ? 'bg-levl-surface-highlight text-white shadow font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                Daily Pulse
              </button>
              <button 
                onClick={() => setViewMode('weekly')}
                className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer ${viewMode === 'weekly' ? 'bg-levl-surface-highlight text-white shadow font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                Weekly Rhythm
              </button>
              <button 
                onClick={() => setViewMode('monthly')}
                className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer ${viewMode === 'monthly' ? 'bg-levl-surface-highlight text-white shadow font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                Monthly Heatmap
              </button>
            </div>
          )}
        </div>
      </div>

      {activeLens === 'exercise' ? (
        <ExerciseSplitView 
          tasks={tasks}
          weekDays={weekDays}
          userProfile={userProfile}
          wellbeingLogs={wellbeingLogs}
        />
      ) : activeLens === 'fasting' ? (
        <FastingSplitView
          tasks={tasks}
          weekDays={weekDays}
          userProfile={userProfile}
          localUserId={userProfile?.local_user_id}
        />
      ) : activeLens === 'peptides' ? (
        <PeptideSplitView
          tasks={tasks}
          weekDays={weekDays}
          userProfile={userProfile}
          wellbeingLogs={wellbeingLogs}
        />
      ) : viewMode === 'daily' ? (
        <DailyVerticalPulseView
          tasks={tasks}
          selectedDate={selectedDate}
          weekDays={weekDays}
          userProfile={userProfile}
          onSelectDate={(d) => setSelectedDate(d)}
        />
      ) : viewMode === 'weekly' ? (
        <div className="glass-card rounded-xl border border-white/10 overflow-hidden bg-black/20">
          {/* Main Grid: Days of Week */}
          <div className="grid grid-cols-[120px_repeat(7,1fr)] border-b border-white/10">
            {/* Corner */}
            <div className="p-4 border-r border-white/10 bg-black/40">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Biological Vectors</span>
            </div>
            {/* Days Header */}
            {weekDays.map(day => (
              <div 
                key={day.toISOString()} 
                onClick={() => {
                  setSelectedDate(day)
                  setViewMode('daily')
                }}
                className={`p-4 text-center border-r border-white/10 cursor-pointer hover:bg-white/5 transition-colors ${isToday(day) ? 'bg-levl-accent/10' : ''}`}
              >
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{format(day, 'EEE')}</div>
                <div className={`text-sm font-bold ${isToday(day) ? 'text-levl-accent' : 'text-white'}`}>{format(day, 'd')}</div>
              </div>
            ))}
          </div>

          {/* Daily Intent Row */}
          <div className="grid grid-cols-[120px_repeat(7,1fr)] border-b border-white/10">
            <div className="p-4 border-r border-white/10 bg-black/40 flex items-center">
              <div>
                <div className="text-[10px] font-bold text-white uppercase tracking-wider">Daily Intent</div>
                <div className="text-[10px] text-gray-500">(Primary)</div>
              </div>
            </div>
            {weekDays.map(day => {
              const dayTasks = tasksByDay.get(format(day, 'yyyy-MM-dd')) || []
              const intent = getDailyIntent(dayTasks)
              return (
                <div key={day.toISOString()} className="p-3 border-r border-white/10 flex items-center justify-center">
                  <div className={`w-full py-2 px-2 text-center rounded border text-xs font-bold ${getIntentColor(intent)}`}>
                    {intent}
                  </div>
                </div>
              )
            })}
          </div>
          {/* Color Legend */}
          <div className="px-4 py-2 bg-black/60 border-b border-white/10 flex flex-wrap gap-4 text-[10px] uppercase font-bold text-gray-400">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-orange-500 rounded-sm"/> mTOR Growth</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-levl-accent rounded-sm"/> AMPK Clearance</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-red-500 rounded-sm"/> Sympathetic Load</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"/> Parasym. Recovery</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-fuchsia-500 rounded-sm"/> Senolytic</div>
          </div>

          {/* Vertical 24-Hour Timeline */}
          <div className="flex border-b border-white/10 relative bg-black/40 h-[800px] group">
            {/* Left Y-Axis (Hours) */}
            <div className="w-[80px] md:w-[120px] flex-shrink-0 border-r border-white/10 relative z-20 bg-black/80">
              <div className="h-[40px] border-b border-white/5 p-2 text-right text-[10px] text-gray-500 font-bold bg-white/5 flex items-center justify-end">
                12-5 AM
              </div>
              {Array.from({ length: 19 }).map((_, i) => {
                const hour = i + 5 // 5 AM to 11 PM
                const isAM = hour < 12
                const displayHour = hour === 12 ? 12 : hour > 12 ? hour - 12 : hour
                const isBedtime = hour >= 22

                return (
                  <div key={i} className={`h-[40px] border-b border-white/5 relative p-1 md:p-2 flex flex-col justify-center items-end ${isBedtime ? 'bg-levl-purple/5' : ''}`}>
                    {isBedtime && hour === 22 && (
                      <div className="absolute left-0 right-0 top-0.5 text-center text-[8px] uppercase tracking-wider text-levl-purple/80 font-bold">Bedtime</div>
                    )}
                    <span className="text-[10px] text-gray-500 font-bold leading-none block text-right">
                      {!isBedtime && `${displayHour}:00 ${isAM ? 'AM' : 'PM'}`}
                    </span>
                  </div>
                )
              })}
            </div>
            
            {/* Day Columns */}
            <div className="flex-1 grid grid-cols-7 relative">
              {/* Background grid lines & Dynamic Glucose-Cleared Fasted State Band */}
              <div className="absolute inset-0 grid grid-cols-7 z-0">
                {weekDays.map((day, col) => {
                  const dayStr = format(day, 'yyyy-MM-dd')
                  const dayTasks = tasks.filter(t => t.scheduled_date === dayStr)
                  const fastedCalc = calculateDynamicFastedWindow(dayTasks)
                  const endLabelHour = Math.floor(fastedCalc.fastedEndHour)

                  return (
                    <div key={col} className="border-r border-white/10 relative">
                      <div className="h-[40px] border-b border-white/[0.03] bg-[#14122b]/50"></div>
                      {Array.from({ length: 19 }).map((_, row) => {
                        const hour = row + 5
                        const isFastingWindow = hour < fastedCalc.fastedEndHour || hour >= Math.floor(fastedCalc.fastedStartHour)
                        const isBedtime = hour >= 22

                        const startLabelHour = Math.floor(fastedCalc.fastedStartHour)

                        return (
                          <div 
                            key={row} 
                            className={`h-[40px] border-b border-white/[0.03] relative transition-colors ${
                              isFastingWindow 
                                ? 'bg-[#161433]/80 border-x border-indigo-500/25 cursor-pointer hover:bg-indigo-950/90' 
                                : isBedtime 
                                  ? 'bg-levl-purple/10' 
                                  : 'bg-amber-500/[0.02]'
                            }`}
                            onClick={() => {
                              if (isFastingWindow) {
                                const fastingCitation = SCIENTIFIC_VECTOR_REGISTRY.fasting?.[0]?.citation
                                setSelectedVectorData({
                                  vector: 'AMPK_Clearance',
                                  waveforms: [{
                                    taskId: `fasting_overlay_${col}`,
                                    modalityName: fastedCalc.hasActiveFastingProtocol 
                                      ? 'Time-Restricted Fasting (16:8 Protocol)' 
                                      : 'Overnight Fasted State (Postprandial Clearing)',
                                    vector: 'AMPK_Clearance',
                                    startTime: new Date(day.getFullYear(), day.getMonth(), day.getDate() - 1, Math.floor(fastedCalc.fastedStartHour), 0, 0),
                                    peakTime: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 6, 0, 0),
                                    endTime: new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(fastedCalc.fastedEndHour), 0, 0),
                                    peakDelayHours: 16,
                                    durationHours: (24 - fastedCalc.fastedStartHour) + fastedCalc.fastedEndHour,
                                    intensity: 0.8,
                                    color: 'bg-levl-accent',
                                    is_macro_pulse: true,
                                    citation: fastingCitation ? {
                                      ...fastingCitation,
                                      summary: fastedCalc.summary + ' ' + fastingCitation.summary
                                    } : undefined
                                  }],
                                  allDayWaveforms: []
                                })
                              }
                            }}
                          />
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              {weekDays.map(day => {
                // Get ALL tasks for the week to check for bleed-overs
                // but for rendering, we process the intersection logic
                const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0)
                const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59)
                
                // Global deduplication to prevent multi-day bleedovers from duplicating
                const deduplicatedTasks = Array.from(tasksByDay.values()).flat().filter((task, index, self) => {
                  const mIdA = task.loose_modality?.id || task.protocol_step?.modality_id || task.id
                  return index === self.findIndex((t) => {
                    const mIdB = t.loose_modality?.id || t.protocol_step?.modality_id || t.id
                    return mIdA === mIdB && t.scheduled_date === task.scheduled_date
                  })
                })

                // We use all deduplicated tasks here to catch multi-day bleedovers
                const allWaveforms = generateWaveforms(deduplicatedTasks)
                
                // Inject Baseline Sleep for every day in the view
                weekDays.forEach(d => {
                  const baseTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 22, 0, 0) // 10 PM
                  allWaveforms.push({
                    taskId: `baseline_sleep_${d.toISOString()}`,
                    modalityName: 'Baseline Sleep',
                    vector: 'Parasympathetic_Recovery',
                    startTime: baseTime,
                    peakTime: new Date(baseTime.getTime() + 1 * 60 * 60 * 1000),
                    endTime: new Date(baseTime.getTime() + 8 * 60 * 60 * 1000), // 8 hours (6 AM next day)
                    peakDelayHours: 2,
                    durationHours: 8,
                    intensity: 1.0, // 100% Baseline intensity
                    color: 'bg-blue-500', 
                    is_macro_pulse: true
                  })
                })
                
                // 1. Filter to waveforms that intersect this day
                const dayWaveforms = allWaveforms
                  .filter(w => w.endTime > dayStart && w.startTime < dayEnd)
                  .map(w => {
                    const originalDurationHours = (w.endTime.getTime() - w.startTime.getTime()) / (1000 * 60 * 60)
                    const renderW = { ...w, originalDurationHours } as WaveformEvent & { originalDurationHours: number }
                    
                    // Clamp start time to 12:00 AM if it started yesterday
                    if (renderW.startTime < dayStart) {
                      renderW.startTime = new Date(dayStart)
                    }
                    // We don't strictly need to clamp endTime because height math uses day bounds anyway
                    return renderW
                  })

                // 2. Extract decoupled Modality Name labels (only for tasks that start today)
                const tasksStartingToday = dayWaveforms
                  .filter(w => w.startTime >= dayStart && w.startTime <= dayEnd)
                
                // Group labels by start hour so we can stack them if they overlap perfectly
                const labelsByHour = new Map<number, string[]>()
                tasksStartingToday.forEach(w => {
                  const hour = w.startTime.getHours() + (w.startTime.getMinutes() / 60)
                  if (!labelsByHour.has(hour)) labelsByHour.set(hour, [])
                  if (!labelsByHour.get(hour)!.includes(w.modalityName)) {
                    labelsByHour.get(hour)!.push(w.modalityName)
                  }
                })

                // 3. Group waveforms purely by Biological Vector
                const vectorGroups = new Map<string, WaveformEvent[]>()
                dayWaveforms.forEach(w => {
                  if (!w.is_macro_pulse && w.intensity < 0.5) return // filter minor micro-habits
                  if (!vectorGroups.has(w.vector)) {
                    vectorGroups.set(w.vector, [])
                  }
                  vectorGroups.get(w.vector)!.push(w)
                })

                // Transform into Vector Lanes
                const vectorLanes = Array.from(vectorGroups.entries()).map(([vector, wfs]) => {
                  const startHour = Math.min(...wfs.map(w => w.startTime.getHours() + (w.startTime.getMinutes() / 60)))
                  // Use originalDurationHours to detect truly long continuous protocols (like a 3-day fast or Rapamycin)
                  const isLong = wfs.some((w: any) => w.originalDurationHours > 24)
                  
                  // Combine duration for the purpose of overlap clustering
                  const endRaw = Math.max(...wfs.map(w => w.endTime.getTime()))
                  const endHour = Math.min(24, (endRaw - dayStart.getTime()) / (1000 * 60 * 60))
                  const durationHours = endHour - startHour

                  return { vector, waveforms: wfs, startHour, durationHours, isLong }
                })

                // Separate long (>24h) and short (<=24h) Vector Lanes
                const longLanes = vectorLanes.filter(l => l.isLong)
                const shortLanes = vectorLanes.filter(l => !l.isLong)
                
                // Sort short lanes for overlap clustering
                shortLanes.sort((a, b) => a.startHour - b.startHour)

                const clusters: typeof shortLanes[] = []
                let currentCluster: typeof shortLanes = []
                let clusterEnd = 0
                
                shortLanes.forEach(lane => {
                  if (currentCluster.length === 0 || lane.startHour < clusterEnd) {
                    currentCluster.push(lane)
                    clusterEnd = Math.max(clusterEnd, lane.startHour + lane.durationHours)
                  } else {
                    clusters.push(currentCluster)
                    currentCluster = [lane]
                    clusterEnd = lane.startHour + lane.durationHours
                  }
                })
                if (currentCluster.length > 0) clusters.push(currentCluster)

                const positionedShortLanes: any[] = []
                clusters.forEach(cluster => {
                  const cols: typeof shortLanes[] = []
                  cluster.forEach(lane => {
                    let placed = false
                    for (let i = 0; i < cols.length; i++) {
                      const last = cols[i][cols[i].length - 1]
                      if (lane.startHour >= last.startHour + last.durationHours) {
                        cols[i].push(lane)
                        placed = true
                        positionedShortLanes.push({ ...lane, colIndex: i, colCount: 0 })
                        break
                      }
                    }
                    if (!placed) {
                      cols.push([lane])
                      positionedShortLanes.push({ ...lane, colIndex: cols.length - 1, colCount: 0 })
                    }
                  })
                  positionedShortLanes.forEach(pl => {
                    if (cluster.find(l => l.vector === pl.vector)) {
                      pl.colCount = cols.length
                    }
                  })
                })

                // Y-Axis pixel mapping
                const getPixelOffset = (hour: number) => {
                  if (hour < 5) return (hour / 5) * 40
                  return 40 + (hour - 5) * 40
                }

                return (
                  <div key={day.toISOString()} className="relative border-r border-transparent z-10">
                    {/* Render Long Vectors as thin racing stripes on the left edge */}
                    <div className="absolute left-0 top-0 bottom-0 flex z-0 gap-[1px]">
                      {longLanes.map((lane, i) => {
                        return (
                          <div 
                            key={`long-${i}`} 
                            className={`w-1.5 h-full ${getVectorColorHex(lane.vector)} opacity-80 shadow-lg cursor-pointer hover:w-2 transition-all`}
                            title={`${lane.vector} (Long Duration) - Click for details`}
                            onClick={() => setSelectedVectorData({
                              vector: lane.vector,
                              waveforms: lane.waveforms,
                              allDayWaveforms: dayWaveforms
                            })}
                          ></div>
                        )
                      })}
                    </div>

                    {/* Render Short Vector Lanes */}
                    {positionedShortLanes.map((lane, i) => {
                      const topOffset = getPixelOffset(lane.startHour)
                      const endPixel = getPixelOffset(lane.startHour + lane.durationHours)
                      // Using 800px total height as clip
                      const height = Math.min(800 - topOffset, Math.max(20, endPixel - topOffset))

                      // X-Axis Overlap mapping
                      const longLanesOffset = longLanes.length > 0 ? (longLanes.length * 8) : 4 // pad from left
                      const widthPercent = 100 / lane.colCount
                      const leftPercent = lane.colIndex * widthPercent

                      return (
                        <div 
                          key={`lane-${i}`} 
                          className="absolute overflow-hidden cursor-pointer hover:ring-2 ring-white/50 transition-all z-10"
                          style={{ 
                            top: `${topOffset}px`, 
                            height: `${height}px`,
                            left: `calc(${leftPercent}% + ${longLanesOffset}px)`,
                            width: `calc(${widthPercent}% - ${longLanesOffset + 4}px)`,
                            minWidth: '20px'
                          }}
                          onClick={() => setSelectedVectorData({
                            vector: lane.vector,
                            waveforms: lane.waveforms,
                            allDayWaveforms: dayWaveforms
                          })}
                          title={`Click for ${lane.vector} details`}
                        >
                          {/* Inside the Vector Lane, we render all waveforms that belong to this vector. 
                              They will naturally overlap vertically and their opacities will compound to show intensity. */}
                          {lane.waveforms.map((w: WaveformEvent, j: number) => {
                            const wStartHour = w.startTime.getHours() + (w.startTime.getMinutes() / 60)
                            const durationHours = (w.endTime.getTime() - w.startTime.getTime()) / (1000 * 60 * 60)
                            const wEndHour = wStartHour + durationHours
                            
                            const wTop = getPixelOffset(wStartHour) - topOffset
                            const wEnd = getPixelOffset(wEndHour) - topOffset
                            const wHeight = Math.max(20, wEnd - wTop)
                            
                             const getVectorRGB = (v: string) => {
                               if (v === 'mTOR_Growth') return '249, 115, 22'
                               if (v === 'AMPK_Clearance') return '16, 185, 129'
                               if (v === 'Sympathetic_Load') return '239, 68, 68'
                               if (v === 'Parasympathetic_Recovery') return '59, 130, 246'
                               if (v === 'Senolytic_Clearance') return '217, 70, 239'
                               return '156, 163, 175'
                             }

                             const peakPct = Math.max(5, Math.min(90, Math.round(((w.peakDelayHours || 1) / (w.durationHours || 12)) * 100)))
                             const rgb = getVectorRGB(w.vector)
                             const maxAlpha = Math.min(0.95, Math.max(0.5, w.intensity || 0.8))

                             return (
                               <div 
                                 key={`wf-${j}`} 
                                 className="absolute left-0 right-0 rounded-md border border-white/10 shadow-sm overflow-hidden"
                                 style={{ 
                                   top: `${wTop}px`, 
                                   height: `${wHeight}px`,
                                   background: `linear-gradient(180deg, rgba(${rgb}, 0.2) 0%, rgba(${rgb}, ${maxAlpha}) ${peakPct}%, rgba(${rgb}, 0.05) 100%)`
                                 }}
                               >
                                 {/* Peak Line Indicator */}
                                 <div 
                                   className="absolute left-0 right-0 h-[1px] bg-white/40 shadow-[0_0_4px_rgba(255,255,255,0.8)]" 
                                   style={{ top: `${peakPct}%` }}
                                   title={`Peak Impact (${Math.round(w.intensity * 100)}%)`}
                                 />
                                 {/* Obvious Start Cap on Card */}
                                 {(w.vector === 'AMPK_Clearance' || w.modalityName.toLowerCase().includes('fast')) && (
                                   <div className="absolute top-0.5 inset-x-0.5 z-20 flex justify-center pointer-events-none">
                                     <span className="text-[7px] font-extrabold text-emerald-200 bg-emerald-950/90 border border-emerald-400/60 px-1 py-0.2 rounded-full shadow-md tracking-wider whitespace-nowrap truncate max-w-full">
                                       🟢 ONSET {format(w.startTime, 'h:mm a')}
                                     </span>
                                   </div>
                                 )}
                                 {/* Obvious End Cap on Card */}
                                 {(w.vector === 'AMPK_Clearance' || w.modalityName.toLowerCase().includes('fast')) && (
                                   <div className="absolute bottom-0.5 inset-x-0.5 z-20 flex justify-center pointer-events-none">
                                     <span className="text-[7px] font-extrabold text-indigo-200 bg-indigo-950/90 border border-indigo-400/60 px-1 py-0.2 rounded-full shadow-md tracking-wider whitespace-nowrap truncate max-w-full">
                                       🍽️ END {format(w.endTime, 'h:mm a')}
                                     </span>
                                   </div>
                                 )}
                               </div>
                             )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              {/* Top-Layer High-Contrast Fasting Start & End Badges (Rendered ABOVE all vector cards) */}
              <div className="absolute inset-0 grid grid-cols-7 pointer-events-none z-40">
                {weekDays.map((day, col) => {
                  const dayStr = format(day, 'yyyy-MM-dd')
                  const dayTasks = tasks.filter(t => t.scheduled_date === dayStr)
                  const fastedCalc = calculateDynamicFastedWindow(dayTasks)
                  
                  const startTopPixel = getPixelOffset(fastedCalc.fastedStartHour)
                  const endTopPixel = getPixelOffset(fastedCalc.fastedEndHour)

                  const openFastingModal = () => {
                    const fastingCitation = SCIENTIFIC_VECTOR_REGISTRY.fasting?.[0]?.citation
                    setSelectedVectorData({
                      vector: 'AMPK_Clearance',
                      waveforms: [{
                        taskId: `fasting_top_badge_${col}`,
                        modalityName: fastedCalc.hasActiveFastingProtocol 
                          ? 'Time-Restricted Fasting (16:8 Protocol)' 
                          : 'Overnight Fasted State (Postprandial Clearing)',
                        vector: 'AMPK_Clearance',
                        startTime: new Date(day.getFullYear(), day.getMonth(), day.getDate() - 1, Math.floor(fastedCalc.fastedStartHour), 0, 0),
                        peakTime: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 6, 0, 0),
                        endTime: new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(fastedCalc.fastedEndHour), 0, 0),
                        peakDelayHours: 16,
                        durationHours: (24 - fastedCalc.fastedStartHour) + fastedCalc.fastedEndHour,
                        intensity: 0.8,
                        color: 'bg-levl-accent',
                        is_macro_pulse: true,
                        citation: fastingCitation ? {
                          ...fastingCitation,
                          summary: fastedCalc.summary + ' ' + fastingCitation.summary
                        } : undefined
                      }],
                      allDayWaveforms: []
                    })
                  }

                  const displayStartHour = Math.floor(fastedCalc.fastedStartHour - 12 > 0 ? fastedCalc.fastedStartHour - 12 : fastedCalc.fastedStartHour)
                  const displayStartMin = Math.round((fastedCalc.fastedStartHour % 1) * 60).toString().padStart(2, '0')
                  const startDisplay = `${displayStartHour}:${displayStartMin} PM`
                  const endDisplay = `${Math.floor(fastedCalc.fastedEndHour)}:00 AM`

                  return (
                    <div key={`top-badge-col-${col}`} className="relative h-full">
                      {/* Fasted Start Top-Layer Badge */}
                      <div 
                        className="absolute inset-x-0.5 flex items-center justify-center z-50 pointer-events-auto"
                        style={{ top: `${Math.min(760, Math.max(10, startTopPixel - 12))}px` }}
                      >
                        <button
                          onClick={openFastingModal}
                          className="w-full text-[7.5px] font-extrabold text-emerald-200 bg-[#042417] border-2 border-emerald-400 px-1 py-1 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.95)] tracking-tight uppercase truncate hover:scale-105 transition-all flex items-center justify-center gap-1 cursor-pointer border-solid"
                          title="Click to inspect Fasted State & Autophagy evidence"
                        >
                          🟢 FASTED START
                        </button>
                      </div>

                      {/* Fasted End Top-Layer Badge */}
                      <div 
                        className="absolute inset-x-0.5 flex items-center justify-center z-50 pointer-events-auto"
                        style={{ top: `${Math.min(760, Math.max(10, endTopPixel - 12))}px` }}
                      >
                        <button
                          onClick={openFastingModal}
                          className="w-full text-[7.5px] font-extrabold text-indigo-200 bg-[#0f0c33] border-2 border-indigo-400 px-1 py-1 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.95)] tracking-tight uppercase truncate hover:scale-105 transition-all flex items-center justify-center gap-1 cursor-pointer border-solid"
                          title="Click to inspect Fasted State & Autophagy evidence"
                        >
                          🍽️ FAST ENDS
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Cadence Tracks */}
          <CadenceTracks 
            tasks={tasks}
            startDate={weekStart}
            endDate={weekEnd}
          />
        </div>
      ) : (
        <MonthHeatmapView tasks={tasks} currentDate={currentDate} />
      )}

      {/* Interactive Vector Modal */}
      {selectedVectorData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setSelectedVectorData(null)} 
          />
          <div className="relative w-full max-w-lg bg-[#0F1115] border border-white/10 rounded-xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedVectorData(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className={`w-4 h-4 rounded-sm ${getVectorColorHex(selectedVectorData.vector)}`} />
              <h2 className="text-xl font-bold text-white tracking-wide">
                {selectedVectorData.vector.replace('_', ' ')}
              </h2>
            </div>

            <div className="space-y-4">
              {(() => {
                const uniqueWaveforms = Array.from(new Map(selectedVectorData.waveforms.map(w => [w.modalityName, w])).values())
                  .sort((a, b) => {
                    if (a.modalityName === 'Baseline Sleep') return -1
                    if (b.modalityName === 'Baseline Sleep') return 1
                    return 0
                  })
                
                const hasBaselineSleep = uniqueWaveforms.some(w => w.modalityName === 'Baseline Sleep')

                return uniqueWaveforms.map((w, idx) => {
                  const durationHours = w.durationHours || (w.endTime.getTime() - w.startTime.getTime()) / (1000 * 60 * 60)
                  const peakDelayHours = w.peakDelayHours || 1
                  const peakTime = new Date(w.startTime.getTime() + peakDelayHours * 60 * 60 * 1000)
                  
                  const peakDelayDisplay = peakDelayHours < 1
                    ? `${Math.round(peakDelayHours * 60)} min`
                    : `${Math.round(peakDelayHours * 10) / 10} hrs`

                  const durationDisplay = durationHours > 24 
                    ? `${Math.round(durationHours / 24)} days`
                    : `${Math.round(durationHours * 10) / 10} hrs`
                  
                  const peakPct = Math.max(5, Math.min(90, Math.round((peakDelayHours / durationHours) * 100)))

                  const isIndented = hasBaselineSleep && w.modalityName !== 'Baseline Sleep'
                  
                  const baseTaskId = w.taskId.split('_')[0]
                  const otherVectors = selectedVectorData.allDayWaveforms
                    .filter(aw => aw.taskId.split('_')[0] === baseTaskId && aw.vector !== selectedVectorData.vector)
                    .map(aw => aw.vector.replace('_', ' '))

                  const currentVector = w.vector || selectedVectorData.vector
                  const vCfg = getVectorColorConfig(currentVector)

                  return (
                    <div key={idx} className={`relative ${isIndented ? 'ml-6' : ''}`}>
                      {isIndented && (
                        <div className="absolute -left-4 top-0 bottom-0 w-px bg-white/10" />
                      )}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-white">{w.modalityName}</h3>
                          <div className="flex items-center gap-2">
                            {w.taskId.startsWith('baseline') ? (
                              <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">Baseline</span>
                            ) : (
                              <span className={`text-[10px] font-mono border px-2 py-0.5 rounded ${vCfg.badgeBg}`}>
                                Logged Time
                              </span>
                            )}
                            <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-gray-300">
                              {w.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* 3-Stage Visual Biological Timeline */}
                        <div className="mt-3 bg-black/40 border border-white/10 rounded-lg p-3">
                          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1.5 flex justify-between">
                            <span>Onset → Peak → Return to Baseline Timeline</span>
                            <span className={`${vCfg.textColor} font-mono font-bold`}>{durationDisplay} Active Window</span>
                          </div>

                          {/* Segmented Timeline Progress Bar */}
                          <div className="relative h-3 bg-white/5 rounded-full overflow-hidden flex my-2 border border-white/10">
                            {/* Onset Phase */}
                            <div 
                              className={`h-full bg-gradient-to-r from-white/10 ${vCfg.gradientFrom}`} 
                              style={{ width: `${peakPct}%` }}
                              title={`Onset Phase (${peakDelayDisplay})`}
                            />
                            {/* Peak Point */}
                            <div 
                              className="w-2 h-full bg-white shadow-[0_0_8px_rgba(255,255,255,1)] z-10"
                              title={`Peak Impact at ${peakTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            />
                            {/* Return to Baseline Phase */}
                            <div 
                              className={`h-full flex-1 bg-gradient-to-r ${vCfg.gradientFrom} to-white/5`} 
                              title="Return to Baseline Phase"
                            />
                          </div>

                          {/* Text Stage Labels */}
                          <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] border-t border-white/10 pt-2">
                            <div>
                              <div className="text-gray-500 font-bold">1. Onset Phase</div>
                              <div className="text-gray-300 font-mono mt-0.5">{peakDelayDisplay} to Peak</div>
                            </div>
                            <div className="text-center">
                              <div className={`${vCfg.textColor} font-bold`}>2. Peak Impact</div>
                              <div className="text-white font-mono mt-0.5">
                                {peakTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({Math.round(w.intensity * 100)}%)
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-gray-500 font-bold">3. Return to Baseline</div>
                              <div className="text-gray-300 font-mono mt-0.5">{durationDisplay} Total Window</div>
                            </div>
                          </div>
                        </div>

                        {(w.vector === 'AMPK_Clearance' || w.modalityName.toLowerCase().includes('fast')) && (
                          <div className="mt-3 bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-3 space-y-3">
                            <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                              <span>⚡ Activity-Based Fasting Triggers & Kinetics</span>
                              <span className="font-mono text-emerald-400">AMPK Autophagy</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              {/* What Starts the Fast */}
                              <div className="bg-black/40 p-3 rounded-md border border-white/5 space-y-1">
                                <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                                  🟢 What Starts the Fast
                                </div>
                                <div className="text-white font-bold text-xs mt-1">Logged Last Meal / Food</div>
                                <div className="text-[11px] text-gray-300 leading-snug">
                                  • Postprandial Clearing: 3.5h base (accelerated by 1h via post-meal walk &amp; 45m via berberine).
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono pt-1 border-t border-white/5 pt-1">
                                  Trigger: Insulin drops &lt; 5 μIU/mL &amp; hepatic glycogen depletes.
                                </div>
                              </div>

                              {/* What Breaks the Fast */}
                              <div className="bg-black/40 p-3 rounded-md border border-white/5 space-y-1">
                                <div className="text-[10px] uppercase font-bold text-indigo-400 flex items-center gap-1">
                                  🍽️ What Breaks the Fast
                                </div>
                                <div className="text-white font-bold text-xs mt-1">First Meal / Caloric Ingestion</div>
                                <div className="text-[11px] text-gray-300 leading-snug">
                                  • Caloric Intake (&gt;15-50 kcal) or Leucine / Glucose influx.
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono pt-1 border-t border-white/5 pt-1">
                                  Trigger: Akt/mTORC1 activation &amp; Sestrin2 sensing suppresses AMPK autophagy.
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {w.citation && (
                          <div className="mt-3 bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 flex items-center gap-1">
                                🔬 Sourced Scientific Evidence
                              </span>
                              <a 
                                href={w.citation.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[10px] font-mono text-levl-accent hover:underline flex items-center gap-1 z-50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                PubMed ({w.citation.pmid}) ↗
                              </a>
                            </div>
                            <div className="text-xs font-bold text-white mb-0.5">{w.citation.title}</div>
                            <div className="text-[10px] text-gray-400 font-mono mb-2">{w.citation.journal} ({w.citation.year})</div>
                            <div className="text-[11px] text-gray-300 leading-relaxed bg-black/30 p-2 rounded border border-white/5">
                              {w.citation.summary}
                            </div>
                          </div>
                        )}

                        {otherVectors.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-white/10">
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">Also Initiates</div>
                            <div className="flex flex-wrap gap-2">
                              {Array.from(new Set(otherVectors)).map((vec, vIdx) => (
                                <span key={vIdx} className="text-[10px] px-2 py-1 bg-white/10 rounded-md text-gray-300">
                                  {vec}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
