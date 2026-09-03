'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, isToday, isSameDay } from 'date-fns'
import { 
  Sparkles, 
  Dumbbell, 
  HeartPulse, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  Zap, 
  ArrowRight, 
  Layers, 
  Activity, 
  ShieldAlert, 
  Check, 
  Flame, 
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { DailyProtocolTask, UserProfile } from '@/lib/types'
import { calculateDailyPulseBalance, applyTimingOptimization, TimingOptimizationSuggestion } from '@/lib/calendar/pulseOptimizationEngine'
import { calculateDynamicFastedWindow } from '@/lib/calendar/waveformMapper'
import PulsingPhilosophyGuide from './PulsingPhilosophyGuide'

interface DailyVerticalPulseViewProps {
  tasks: DailyProtocolTask[]
  selectedDate: Date
  weekDays: Date[]
  userProfile?: UserProfile | null
  onSelectDate: (d: Date) => void
  onTaskUpdated?: () => void
}

export default function DailyVerticalPulseView({
  tasks,
  selectedDate,
  weekDays,
  userProfile,
  onSelectDate,
  onTaskUpdated
}: DailyVerticalPulseViewProps) {
  const router = useRouter()
  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  const [applyingSuggestionId, setApplyingSuggestionId] = useState<string | null>(null)
  const [appliedSuccessId, setAppliedSuccessId] = useState<string | null>(null)

  // 1. Calculate Daily Pulse Balance & Timing Optimizations
  const pulseBalance = useMemo(() => {
    return calculateDailyPulseBalance(tasks, dateStr)
  }, [tasks, dateStr])

  // 2. Calculate day tasks & dynamic fasted window
  const dayTasks = useMemo(() => {
    return tasks.filter(t => t.scheduled_date === dateStr)
  }, [tasks, dateStr])

  const fastedCalc = useMemo(() => {
    return calculateDynamicFastedWindow(dayTasks)
  }, [dayTasks])

  // 3. Handle Auto-Optimization action
  const handleApplySuggestion = async (suggestion: TimingOptimizationSuggestion) => {
    setApplyingSuggestionId(suggestion.id)
    try {
      const success = await applyTimingOptimization(suggestion.taskId, suggestion.recommendedSlot)
      if (success) {
        setAppliedSuccessId(suggestion.id)
        setTimeout(() => setAppliedSuccessId(null), 3000)
        if (onTaskUpdated) onTaskUpdated()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setApplyingSuggestionId(null)
    }
  }

  // Helper to map timing slots to rough hours
  const getSlotHour = (slot?: string): number => {
    if (!slot) return 9
    const s = slot.toLowerCase()
    if (s.includes('waking') || s.includes('early')) return 6
    if (s.includes('morning') || s.includes('routine')) return 8
    if (s.includes('supplement')) return 8.5
    if (s.includes('midday') || s.includes('noon') || s.includes('lunch')) return 12
    if (s.includes('afternoon') || s.includes('post_workout')) return 14
    if (s.includes('evening') || s.includes('dinner')) return 18
    if (s.includes('pre_bed') || s.includes('bed') || s.includes('night')) return 21
    return 10
  }

  return (
    <div className="space-y-6">
      {/* 1. EDUCATIONAL LONGEVITY PULSING PHILOSOPHY GUIDE */}
      <PulsingPhilosophyGuide />

      {/* 2. 7-DAY SELECTOR STRIP */}
      <div className="p-2 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {weekDays.map(day => {
            const isSelected = isSameDay(day, selectedDate)
            const dStr = format(day, 'yyyy-MM-dd')
            const dayPulse = calculateDailyPulseBalance(tasks, dStr)
            const isCurrentToday = isToday(day)

            return (
              <button
                key={dStr}
                type="button"
                onClick={() => onSelectDate(day)}
                className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-between gap-1 cursor-pointer select-none min-h-[72px] ${
                  isSelected
                    ? 'bg-gradient-to-b from-indigo-900/60 to-purple-950/70 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                    {format(day, 'EEE')}
                  </span>
                  {isCurrentToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  )}
                </div>

                <span className={`text-sm sm:text-base font-black ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                  {format(day, 'd')}
                </span>

                {/* Mini Pulse Ratio Indicator */}
                <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden flex border border-white/10">
                  <div
                    style={{ width: `${dayPulse.growthPercentage}%` }}
                    className="bg-purple-500 h-full"
                    title={`Growth: ${dayPulse.growthPercentage}%`}
                  />
                  <div
                    style={{ width: `${dayPulse.recoveryPercentage}%` }}
                    className="bg-emerald-400 h-full"
                    title={`Recovery: ${dayPulse.recoveryPercentage}%`}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. GROWTH VS. RECOVERY MODE BAROMETER */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-black border border-white/10 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Activity size={13} className="text-cyan-400" />
                <span>{format(selectedDate, 'EEEE, MMMM d')} Biological Pulse</span>
              </span>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 ${pulseBalance.archetypeColor}`}>
                {pulseBalance.archetype}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {pulseBalance.archetypeSubtitle}
            </p>
          </div>

          {/* Quick jump to today action */}
          <button
            type="button"
            onClick={() => router.push(`/today?date=${dateStr}`)}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <span>Open in Today</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* The Dual-Spectrum Biological Balance Dial */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-extrabold font-mono">
            <span className="text-purple-400 flex items-center gap-1.5">
              <Dumbbell size={14} />
              <span>🟣 Growth Mode: {pulseBalance.growthPercentage}%</span>
            </span>
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span>🟢 Recovery Mode: {pulseBalance.recoveryPercentage}%</span>
              <HeartPulse size={14} />
            </span>
          </div>

          <div className="relative h-4 rounded-full bg-slate-950 p-0.5 border border-white/15 overflow-hidden shadow-inner flex">
            {/* Growth Gradient Bar */}
            <div
              style={{ width: `${pulseBalance.growthPercentage}%` }}
              className="h-full rounded-l-full bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-400 transition-all duration-500 relative"
            />
            {/* Recovery Gradient Bar */}
            <div
              style={{ width: `${pulseBalance.recoveryPercentage}%` }}
              className="h-full rounded-r-full bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-500 transition-all duration-500 relative"
            />
            {/* Center Dynamic Pivot Dot */}
            <div 
              style={{ left: `calc(${pulseBalance.growthPercentage}% - 6px)` }}
              className="absolute top-0 bottom-0 w-3 rounded-full bg-white shadow-[0_0_10px_#ffffff] z-10 transition-all duration-500"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>mTORC1 Anabolism &amp; Tension ({pulseBalance.growthAUC} AUC)</span>
            <span>AMPK Clearance &amp; Vagus ({pulseBalance.recoveryAUC} AUC)</span>
          </div>
        </div>
      </div>

      {/* 4. AUTO-SUGGESTIONS & CHRONO-HARMONY INTERFERENCE ALERT */}
      {pulseBalance.suggestions.length > 0 ? (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-rose-950/30 border border-amber-500/40 shadow-xl space-y-3.5 animate-in fade-in">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-amber-300">
              <AlertTriangle size={17} className="animate-pulse text-amber-400" />
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-200">
                Chrono-Timing Auto-Suggestions ({pulseBalance.suggestions.length})
              </h4>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Optimization Available
            </span>
          </div>

          <div className="space-y-2.5">
            {pulseBalance.suggestions.map(s => (
              <div key={s.id} className="p-3.5 rounded-xl bg-black/50 border border-amber-500/20 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>{s.title}</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                    Modality: {s.modalityName}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {s.mechanismExplanation}
                </p>

                <div className="pt-1 flex items-center justify-end">
                  <button
                    type="button"
                    disabled={applyingSuggestionId === s.id}
                    onClick={() => handleApplySuggestion(s)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-extrabold shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {appliedSuccessId === s.id ? (
                      <>
                        <Check size={13} className="text-slate-950 font-black" />
                        <span>Harmonized!</span>
                      </>
                    ) : (
                      <>
                        <Zap size={13} className={applyingSuggestionId === s.id ? 'animate-spin' : ''} />
                        <span>{s.actionLabel}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>
            <strong>100% Chrono-Harmonized:</strong> All growth and recovery modalities are cleanly partitioned across the 24-hour cycle with zero biological interference.
          </span>
        </div>
      )}

      {/* 5. DRIVERS BREAKDOWN: GROWTH VS RECOVERY LISTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GROWTH DRIVERS */}
        <div className="p-4 sm:p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
              <Dumbbell size={14} className="text-purple-400" />
              <span>Growth Drivers ({pulseBalance.growthDrivers.length})</span>
            </h4>
            <span className="text-[10px] font-mono text-purple-300">
              mTORC1 Anabolism
            </span>
          </div>

          {pulseBalance.growthDrivers.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center italic">
              No anabolic growth modalities scheduled today.
            </p>
          ) : (
            <div className="space-y-2">
              {pulseBalance.growthDrivers.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-black/40 border border-purple-500/20 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">{item.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {item.timing.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>{item.dose}</span>
                    <span className="text-purple-300/80 font-medium text-[10px]">{item.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECOVERY DRIVERS */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
              <HeartPulse size={14} className="text-emerald-400" />
              <span>Recovery Drivers ({pulseBalance.recoveryDrivers.length})</span>
            </h4>
            <span className="text-[10px] font-mono text-emerald-300">
              AMPK &amp; Vagus
            </span>
          </div>

          {pulseBalance.recoveryDrivers.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center italic">
              No active recovery protocols scheduled today.
            </p>
          ) : (
            <div className="space-y-2">
              {pulseBalance.recoveryDrivers.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/20 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">{item.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {item.timing.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>{item.dose}</span>
                    <span className="text-emerald-300/80 font-medium text-[10px]">{item.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. EXPANDED VERTICAL 24-HOUR CIRCADIAN TIMELINE */}
      <div className="p-4 sm:p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h4 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
            <Clock size={16} className="text-cyan-400" />
            <span>Vertical 24-Hour Circadian Timeline ({format(selectedDate, 'EEE, MMM d')})</span>
          </h4>
          <span className="text-xs text-slate-400 font-mono">
            {dayTasks.length} modalities mapped
          </span>
        </div>

        {/* 24-Hour Vertical Rail (5 AM to 11 PM) */}
        <div className="relative border-l-2 border-white/10 ml-4 sm:ml-8 pl-4 sm:pl-6 space-y-6">
          {dayTasks.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No modalities scheduled for this date. Use Explore or Bench to schedule tasks.
            </div>
          ) : (
            dayTasks
              .slice()
              .sort((a, b) => getSlotHour(a.timing_slot) - getSlotHour(b.timing_slot))
              .map(task => {
                const name = (task.protocol_step?.modality?.name || task.loose_modality?.name || (task as any).modality?.name || 'Protocol Task')
                const dose = task.execution_details?.custom_dose || task.protocol_step?.dose_text || (task.protocol_step?.modality as any)?.dose_or_exposure || 'Standard Dose'
                const hour = getSlotHour(task.timing_slot)
                const isGrowth = name.toLowerCase().includes('lift') || name.toLowerCase().includes('resistance') || name.toLowerCase().includes('strength') || name.toLowerCase().includes('creatine') || name.toLowerCase().includes('protein') || name.toLowerCase().includes('hiit')
                const isRecovery = name.toLowerCase().includes('sauna') || name.toLowerCase().includes('cold') || name.toLowerCase().includes('plunge') || name.toLowerCase().includes('breath') || name.toLowerCase().includes('walk') || name.toLowerCase().includes('sleep') || name.toLowerCase().includes('magnesium')

                return (
                  <div key={task.id} className="relative group">
                    {/* Circle Anchor on Vertical Line */}
                    <div className={`absolute -left-[23px] sm:-left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-md ${
                      isGrowth ? 'bg-purple-500' : isRecovery ? 'bg-emerald-400' : 'bg-cyan-400'
                    }`} />

                    {/* Modality Card */}
                    <div className={`p-4 rounded-xl border transition-all ${
                      isGrowth 
                        ? 'bg-purple-950/20 border-purple-500/30 hover:border-purple-500/50' 
                        : isRecovery 
                        ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50' 
                        : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                    }`}>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{name}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            isGrowth 
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                              : isRecovery 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                              : 'bg-white/10 text-slate-300 border-white/15'
                          }`}>
                            {isGrowth ? '🟣 Growth Mode (mTOR)' : isRecovery ? '🟢 Recovery Mode (AMPK)' : 'Baseline'}
                          </span>
                        </div>

                        <span className="text-[11px] font-mono text-cyan-300 font-bold">
                          {task.timing_slot ? task.timing_slot.replace(/_/g, ' ').toUpperCase() : 'ANYTIME'}
                        </span>
                      </div>

                      <div className="mt-1.5 text-xs text-slate-300 flex items-center justify-between flex-wrap gap-2">
                        <span>Dose / Protocol: <strong className="text-white">{dose}</strong></span>
                        {task.status === 'completed' && (
                          <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                            <CheckCircle2 size={12} /> Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
          )}
        </div>
      </div>
    </div>
  )
}
