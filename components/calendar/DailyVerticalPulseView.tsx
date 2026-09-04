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
  ExternalLink,
  ShieldCheck,
  Moon,
  Sun,
  Droplets,
  Thermometer,
  BookOpen,
  Info,
  Timer,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { DailyProtocolTask, UserProfile } from '@/lib/types'
import { 
  calculateDailyPulseBalance, 
  applyTimingOptimization, 
  TimingOptimizationSuggestion,
  calculateDayPhasesAndTransitions,
  getTaskDecimalHour,
  formatHourToTimeStr,
  TimelineTransitionMarker,
  CriticalModalityEvaluation,
  ChronoGuardrailStatus,
  assessProtocolForDeepOptimizations,
  resolveModalityMechanism,
  resolveModeKickoffMechanism,
  ModalityMechanismDetail,
  ProtocolOptimizationFinding,
  isPulseRelevantModality,
  deduplicatePulseTasks,
  classifyModalityVector
} from '@/lib/calendar/pulseOptimizationEngine'
import { calculateDynamicFastedWindow } from '@/lib/calendar/waveformMapper'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import PulsingPhilosophyGuide from './PulsingPhilosophyGuide'
import ModalityMechanismModal from '@/components/modals/ModalityMechanismModal'
import ProtocolOptimizationModal from '@/components/modals/ProtocolOptimizationModal'
import ModalityIcon from '@/components/ui/ModalityIcon'

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
  const [activeOptimizationTab, setActiveOptimizationTab] = useState<'growth' | 'recovery' | 'guardrails'>('growth')
  const [expandedModalityId, setExpandedModalityId] = useState<string | null>(null)

  // Interactive Modals State
  const [selectedMechanismDetail, setSelectedMechanismDetail] = useState<ModalityMechanismDetail | null>(null)
  const [isMechanismModalOpen, setIsMechanismModalOpen] = useState(false)
  const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState(false)
  const [verticalModeFilter, setVerticalModeFilter] = useState<'all' | 'growth' | 'recovery' | 'transitions'>('all')

  // Concise Timeline Expansion State (collapsed by default)
  const [expandedTimelineKeys, setExpandedTimelineKeys] = useState<Set<string>>(new Set())

  const toggleTimelineKey = (key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setExpandedTimelineKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  // 1. Calculate Daily Pulse Balance & Timing Optimizations
  const pulseBalance = useMemo(() => {
    return calculateDailyPulseBalance(tasks, dateStr)
  }, [tasks, dateStr])

  // 2. Calculate day tasks & dynamic fasted window:
  // Strictly filter to genuine Growth & Recovery modalities and deduplicate to prevent 5+ duplicate rows!
  const dayTasks = useMemo(() => {
    const rawDayTasks = tasks.filter(t => t.scheduled_date === dateStr)
    const relevantTasks = rawDayTasks.filter(isPulseRelevantModality)
    return deduplicatePulseTasks(relevantTasks)
  }, [tasks, dateStr])

  const fastedCalc = useMemo(() => {
    return calculateDynamicFastedWindow(dayTasks)
  }, [dayTasks])

  // 3. Calculate Day Phases, Dynamic Transitions, and Critical Modalities
  const dayPhasesAndTransitions = useMemo(() => {
    return calculateDayPhasesAndTransitions(dayTasks, userProfile, dateStr)
  }, [dayTasks, userProfile, dateStr])

  // 4. Handle Auto-Optimization action
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

  // 5. Build unified chronological timeline stream combining tasks and phase transitions
  type TimelineEntry = 
    | { type: 'transition'; marker: TimelineTransitionMarker; hour: number }
    | { type: 'task'; task: DailyProtocolTask; hour: number }

  const timelineEntries = useMemo(() => {
    const entries: TimelineEntry[] = []

    // Add all transition markers
    dayPhasesAndTransitions.transitions.forEach(marker => {
      entries.push({ type: 'transition', marker, hour: marker.hour })
    })

    // Add all tasks
    dayTasks.forEach(task => {
      entries.push({ type: 'task', task, hour: getTaskDecimalHour(task) })
    })

    // Sort chronologically. If times match closely, transition markers are placed first to bracket the phase
    entries.sort((a, b) => {
      if (Math.abs(a.hour - b.hour) < 0.05) {
        return a.type === 'transition' ? -1 : 1
      }
      return a.hour - b.hour
    })

    return entries
  }, [dayTasks, dayPhasesAndTransitions])

  // 6. Deep protocol optimization findings
  const optimizationFindings = useMemo(() => {
    return assessProtocolForDeepOptimizations(dayTasks, userProfile, dateStr)
  }, [dayTasks, userProfile, dateStr])

  // 7. Filtered Timeline Entries based on mode filter
  const filteredTimelineEntries = useMemo(() => {
    if (verticalModeFilter === 'all') return timelineEntries

    return timelineEntries.filter(entry => {
      if (verticalModeFilter === 'transitions') {
        return entry.type === 'transition'
      }

      if (entry.type === 'transition') {
        if (verticalModeFilter === 'growth') {
          return entry.marker.type === 'growth_onset' || entry.marker.type === 'post_strain_window' || entry.marker.type === 'morning_activation'
        }
        if (verticalModeFilter === 'recovery') {
          return entry.marker.type === 'recovery_onset' || entry.marker.type === 'sleep_onset'
        }
        return true
      }

      // It's a task: classify using classifyModalityVector
      const classification = classifyModalityVector(entry.task)
      if (classification.type === 'irrelevant') return false

      if (verticalModeFilter === 'growth') return classification.type === 'growth'
      if (verticalModeFilter === 'recovery') return classification.type === 'recovery'
      return true
    })
  }, [timelineEntries, verticalModeFilter])

  const handleOpenTaskMechanism = (task: DailyProtocolTask) => {
    const detail = resolveModalityMechanism(task)
    setSelectedMechanismDetail(detail)
    setIsMechanismModalOpen(true)
  }

  const handleOpenTransitionMechanism = (marker: TimelineTransitionMarker) => {
    const isGrowth = marker.type === 'growth_onset'
    const isRecovery = marker.type === 'recovery_onset'
    const mode = isGrowth ? 'growth' : isRecovery ? 'recovery' : 'transition'
    const detail = resolveModeKickoffMechanism(mode, marker.triggerText, marker.timeFormatted)
    setSelectedMechanismDetail(detail)
    setIsMechanismModalOpen(true)
  }

  // Helper to check if a task satisfies one of the critical modalities
  const findCriticalModalityMatch = (task: DailyProtocolTask): { mode: 'growth' | 'recovery'; spec: CriticalModalityEvaluation } | null => {
    const name = (task.protocol_step?.modality?.name || task.loose_modality?.name || (task as any).modality?.name || '').toLowerCase()
    const cat = (task.protocol_step?.modality?.category || task.loose_modality?.category || '').toLowerCase()

    for (const spec of dayPhasesAndTransitions.criticalModalities.growth) {
      if (spec.matcherKeywords.some(kw => name.includes(kw) || cat.includes(kw))) {
        return { mode: 'growth', spec }
      }
    }
    for (const spec of dayPhasesAndTransitions.criticalModalities.recovery) {
      if (spec.matcherKeywords.some(kw => name.includes(kw) || cat.includes(kw))) {
        return { mode: 'recovery', spec }
      }
    }
    return null
  }

  const passingGuardrailsCount = dayPhasesAndTransitions.guardrails.filter(g => g.status === 'passed').length

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

          {/* Action Header Group */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsOptimizationModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Zap size={13} className="text-slate-950 fill-current" />
              <span>Assess Protocol to Further Optimize</span>
              {optimizationFindings.filter(f => f.status === 'recommended').length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-black/25 text-slate-950 font-black text-[10px]">
                  {optimizationFindings.filter(f => f.status === 'recommended').length}
                </span>
              )}
            </button>

            {/* Quick jump to today action */}
            <button
              type="button"
              onClick={() => router.push(`/today?date=${dateStr}`)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Open in Today</span>
              <ArrowRight size={13} />
            </button>
          </div>
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

        {/* CIRCADIAN MODE TRANSITION SUMMARY PILLS (INTERACTIVE CLICK-TO-EXPLORE) */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              const detail = resolveModeKickoffMechanism('growth', dayPhasesAndTransitions.growthTriggerText, dayPhasesAndTransitions.growthStartTimeFormatted)
              setSelectedMechanismDetail(detail)
              setIsMechanismModalOpen(true)
            }}
            className="p-3 rounded-xl bg-purple-950/20 hover:bg-purple-950/40 border border-purple-500/30 hover:border-purple-500/60 transition-all flex items-center justify-between gap-2 cursor-pointer text-left group shadow-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-purple-300 block">
                    Growth Mode Begins
                  </span>
                  <span className="text-[9px] font-mono text-purple-400/80 bg-purple-500/10 px-1 rounded border border-purple-500/20">
                    Click to explore ➔
                  </span>
                </div>
                <span className="text-xs font-bold text-white truncate block group-hover:text-purple-200 mt-0.5">
                  {dayPhasesAndTransitions.growthTriggerText}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-mono font-black text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                {dayPhasesAndTransitions.growthStartTimeFormatted}
              </span>
              <ChevronRight size={14} className="text-purple-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              const detail = resolveModeKickoffMechanism('recovery', dayPhasesAndTransitions.recoveryTriggerText, dayPhasesAndTransitions.recoveryStartTimeFormatted)
              setSelectedMechanismDetail(detail)
              setIsMechanismModalOpen(true)
            }}
            className="p-3 rounded-xl bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex items-center justify-between gap-2 cursor-pointer text-left group shadow-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-300 block">
                    Recovery Mode Begins
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400/80 bg-emerald-500/10 px-1 rounded border border-emerald-500/20">
                    Click to explore ➔
                  </span>
                </div>
                <span className="text-xs font-bold text-white truncate block group-hover:text-emerald-200 mt-0.5">
                  {dayPhasesAndTransitions.recoveryTriggerText}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-mono font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                {dayPhasesAndTransitions.recoveryStartTimeFormatted}
              </span>
              <ChevronRight size={14} className="text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* 4. CRITICAL MODALITIES TO CONSIDER WHEN OPTIMIZING FOR BOTH */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-md overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center text-cyan-400">
                <Sparkles size={16} />
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Critical Modalities for Dual Optimization
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Evidence-Based Protocol Stack
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              How to maximize muscular and structural <strong>Growth</strong> without blunting cellular and somatic <strong>Recovery</strong>.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center p-1 bg-black/60 rounded-xl border border-white/10 text-xs font-bold shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveOptimizationTab('growth')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeOptimizationTab === 'growth'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Dumbbell size={13} />
              <span>Growth ({dayPhasesAndTransitions.criticalModalities.growthCoveragePercentage}%)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveOptimizationTab('recovery')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeOptimizationTab === 'recovery'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HeartPulse size={13} />
              <span>Recovery ({dayPhasesAndTransitions.criticalModalities.recoveryCoveragePercentage}%)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveOptimizationTab('guardrails')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeOptimizationTab === 'guardrails'
                  ? 'bg-amber-600 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck size={13} />
              <span>Guardrails ({passingGuardrailsCount}/3)</span>
            </button>
          </div>
        </div>

        {/* TAB 1: GROWTH MODE OPTIMIZATION STACK */}
        {activeOptimizationTab === 'growth' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-3 text-xs text-purple-200 leading-relaxed">
              <Info size={16} className="text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong>Growth Mode Directive:</strong> Drive maximal mechanotransduction (p70S6K) and muscle protein synthesis during diurnal hours. Anchor with progressive mechanical loading, leucine-rich amino acid pulses, and satellite cell hydration.
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {dayPhasesAndTransitions.criticalModalities.growth.map(mod => {
                const isExpanded = expandedModalityId === mod.id

                return (
                  <div 
                    key={mod.id} 
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      mod.isScheduledToday
                        ? 'bg-purple-950/20 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                        : 'bg-black/40 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white">{mod.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-purple-300 border border-purple-500/30">
                            {mod.category}
                          </span>
                        </div>
                      </div>

                      {/* Today's Schedule Status Badge */}
                      {mod.isScheduledToday ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shrink-0">
                          <Check size={11} className="stroke-[3]" />
                          <span>Active ({mod.matchedTiming})</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10 shrink-0">
                          Not Scheduled Today
                        </span>
                      )}
                    </div>

                    {/* Exact Parameters (Mandatory Dosing Specs) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-black/50 border border-white/5 space-y-0.5">
                        <span className="text-[10px] font-mono text-purple-300 uppercase font-bold block">
                          Exact Dosing / Strain
                        </span>
                        <span className="text-slate-200 font-medium">{mod.exactDose}</span>
                      </div>

                      <div className="p-2 rounded-lg bg-black/50 border border-white/5 space-y-0.5">
                        <span className="text-[10px] font-mono text-purple-300 uppercase font-bold block">
                          Duration &amp; Cadence
                        </span>
                        <span className="text-slate-200 font-medium">{mod.durationAndFrequency}</span>
                      </div>
                    </div>

                    {/* Administration Notes */}
                    <div className="text-[11px] text-slate-300 bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                      <strong className="text-purple-300">Synergy &amp; Administration: </strong>
                      <span>{mod.administrationNotes}</span>
                    </div>

                    {/* Expandable Biological Mechanism & Verified PubMed Link */}
                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <a
                        href={mod.pubMedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 font-mono font-bold flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink size={12} />
                        <span>PubMed: {mod.citationText} (PMID: {mod.pmid})</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => setExpandedModalityId(isExpanded ? null : mod.id)}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Less' : 'Mechanism'}</span>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="p-3 rounded-lg bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 animate-in fade-in space-y-1.5">
                        <strong className="font-bold text-white block">Molecular Mechanism:</strong>
                        <p className="leading-relaxed">{mod.biologicalMechanism}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TAB 2: RECOVERY MODE OPTIMIZATION STACK */}
        {activeOptimizationTab === 'recovery' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3 text-xs text-emerald-200 leading-relaxed">
              <Info size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong>Recovery Mode Directive:</strong> Activate hepatic AMPK, macroautophagy (ULK1), and vagal parasympathetic down-regulation. Cease caloric intake $\ge$3h before bed and protect deep Stage 3 Slow-Wave Sleep from late stimulants or thermal stress.
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {dayPhasesAndTransitions.criticalModalities.recovery.map(mod => {
                const isExpanded = expandedModalityId === mod.id

                return (
                  <div 
                    key={mod.id} 
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      mod.isScheduledToday
                        ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : 'bg-black/40 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white">{mod.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-emerald-300 border border-emerald-500/30">
                            {mod.category}
                          </span>
                        </div>
                      </div>

                      {/* Today's Schedule Status Badge */}
                      {mod.isScheduledToday ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shrink-0">
                          <Check size={11} className="stroke-[3]" />
                          <span>Active ({mod.matchedTiming})</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10 shrink-0">
                          Not Scheduled Today
                        </span>
                      )}
                    </div>

                    {/* Exact Parameters (Mandatory Dosing Specs) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-black/50 border border-white/5 space-y-0.5">
                        <span className="text-[10px] font-mono text-emerald-300 uppercase font-bold block flex items-center gap-1">
                          {mod.temperature && <Thermometer size={10} />}
                          <span>{mod.temperature ? 'Dose & Temp' : 'Exact Protocol / Dose'}</span>
                        </span>
                        <span className="text-slate-200 font-medium">
                          {mod.temperature ? `${mod.temperature} • ${mod.exactDose}` : mod.exactDose}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-black/50 border border-white/5 space-y-0.5">
                        <span className="text-[10px] font-mono text-emerald-300 uppercase font-bold block">
                          Duration &amp; Cadence
                        </span>
                        <span className="text-slate-200 font-medium">{mod.durationAndFrequency}</span>
                      </div>
                    </div>

                    {/* Administration Notes */}
                    <div className="text-[11px] text-slate-300 bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                      <strong className="text-emerald-300">Synergy &amp; Administration: </strong>
                      <span>{mod.administrationNotes}</span>
                    </div>

                    {/* Expandable Biological Mechanism & Verified PubMed Link */}
                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <a
                        href={mod.pubMedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 font-mono font-bold flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink size={12} />
                        <span>PubMed: {mod.citationText} (PMID: {mod.pmid})</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => setExpandedModalityId(isExpanded ? null : mod.id)}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Less' : 'Mechanism'}</span>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 animate-in fade-in space-y-1.5">
                        <strong className="font-bold text-white block">Molecular Mechanism:</strong>
                        <p className="leading-relaxed">{mod.biologicalMechanism}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TAB 3: CHRONO-SPACING GUARDRAILS */}
        {activeOptimizationTab === 'guardrails' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200 leading-relaxed">
              <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Chrono-Interference Guardrails:</strong> When combining growth and recovery on the same day, chronological timing errors can neutralize beneficial adaptations (e.g. cold water immersion within 4 hours after lifting blunts mTORC1 phosphorylation).
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {dayPhasesAndTransitions.guardrails.map(rail => {
                const isWarning = rail.status === 'warning'
                const isPassed = rail.status === 'passed'

                return (
                  <div 
                    key={rail.id}
                    className={`p-4 rounded-xl border space-y-3 ${
                      isWarning
                        ? 'bg-amber-950/25 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : isPassed
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-black/40 border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-extrabold text-white leading-tight">
                        {rail.title}
                      </span>
                      <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full border shrink-0 ${
                        isWarning
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                          : isPassed
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-white/5 text-slate-400 border-white/10'
                      }`}>
                        {rail.statusLabel}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {rail.description}
                    </p>

                    <div className="p-2 rounded-lg bg-black/50 border border-white/5 text-[11px] text-slate-300">
                      <strong className={isWarning ? 'text-amber-300' : 'text-emerald-300'}>
                        Guidance: 
                      </strong>{' '}
                      <span>{rail.recommendation}</span>
                    </div>

                    <div className="pt-1">
                      <a
                        href={rail.pubMedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono font-bold flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink size={11} />
                        <span>Evidence: {rail.citation}</span>
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. AUTO-SUGGESTIONS & CHRONO-HARMONY INTERFERENCE ALERT */}
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

      {/* 6. EXPANDED VERTICAL 24-HOUR CIRCADIAN TIMELINE WITH GROWTH/RECOVERY ONSETS & TRANSITIONS */}
      <div className="p-4 sm:p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-wrap gap-2">
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
              <Clock size={16} className="text-cyan-400" />
              <span>Vertical 24-Hour Day Timeline ({format(selectedDate, 'EEE, MMM d')})</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Live mapping of Growth Mode onsets, Recovery Mode onsets, and biological transitions.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const growthOnset = dayPhasesAndTransitions.transitions.find(t => t.type === 'growth_onset')
                if (growthOnset) {
                  handleOpenTransitionMechanism(growthOnset)
                } else {
                  const detail = resolveModeKickoffMechanism('growth', 'Morning Circadian Activation & Feeding', dayPhasesAndTransitions.growthStartTimeFormatted)
                  setSelectedMechanismDetail(detail)
                  setIsMechanismModalOpen(true)
                }
              }}
              className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02]"
              title="Click to view Growth Kickoff Mechanism"
            >
              <span>⚡ Growth Begins: {dayPhasesAndTransitions.growthStartTimeFormatted}</span>
              <Info size={11} className="text-purple-400" />
            </button>
            <button
              type="button"
              onClick={() => {
                const recoveryOnset = dayPhasesAndTransitions.transitions.find(t => t.type === 'recovery_onset')
                if (recoveryOnset) {
                  handleOpenTransitionMechanism(recoveryOnset)
                } else {
                  const detail = resolveModeKickoffMechanism('recovery', 'Evening Decompression & Fasting Window', dayPhasesAndTransitions.recoveryStartTimeFormatted)
                  setSelectedMechanismDetail(detail)
                  setIsMechanismModalOpen(true)
                }
              }}
              className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02]"
              title="Click to view Recovery Kickoff Mechanism"
            >
              <span>🌙 Recovery Begins: {dayPhasesAndTransitions.recoveryStartTimeFormatted}</span>
              <Info size={11} className="text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Growth / Recovery Vertical Filter Bar */}
        <div className="flex items-center gap-1.5 p-1.5 bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
          {[
            { id: 'all', label: `All Modalities & Events (${timelineEntries.length})`, icon: '📋' },
            { id: 'growth', label: '🟣 Growth Mode Modalities', icon: '⚡' },
            { id: 'recovery', label: '🟢 Recovery Mode Modalities', icon: '🌙' },
            { id: 'transitions', label: '🔄 Mode Kick-Offs & Transitions', icon: '⚡' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setVerticalModeFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                verticalModeFilter === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-500/20 border border-purple-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Circadian Phase Rail Overview Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {dayPhasesAndTransitions.phases.map(phase => (
            <div 
              key={phase.id}
              className={`p-3 rounded-xl border bg-gradient-to-br ${phase.bgGradient} ${phase.borderGlow} space-y-1`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className={`font-bold ${phase.textAccent}`}>{phase.title}</span>
                <span className="text-slate-400 font-medium">
                  {phase.startTimeFormatted}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                {phase.description}
              </p>
            </div>
          ))}
        </div>

        {/* 24-Hour Continuous Vertical Rail */}
        <div className="relative border-l-2 border-white/15 ml-4 sm:ml-8 pl-4 sm:pl-7 space-y-7">
          {filteredTimelineEntries.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No modalities or transitions found matching this filter for {format(selectedDate, 'EEE, MMM d')}.
            </div>
          ) : (
            filteredTimelineEntries.map((entry, idx) => {
              // -------------------------------------------------------------
              // CASE A: BIOLOGICAL TRANSITION MARKER ON THE VERTICAL TIMELINE
              // -------------------------------------------------------------
              if (entry.type === 'transition') {
                const marker = entry.marker
                const isGrowthOnset = marker.type === 'growth_onset'
                const isRecoveryOnset = marker.type === 'recovery_onset'
                const isPostLift = marker.type === 'post_strain_window'
                const isMorning = marker.type === 'morning_activation'
                const isExpanded = expandedTimelineKeys.has(marker.id)

                return (
                  <div key={marker.id} className="relative group pt-0.5 pb-0.5">
                    {/* Glowing Circular Anchor on the Vertical Rail */}
                    <div className={`absolute -left-[23px] sm:-left-[35px] top-3.5 w-5 h-5 rounded-full border-2 border-slate-950 flex items-center justify-center shadow-lg z-10 ${
                      isGrowthOnset
                        ? 'bg-purple-500 text-slate-950 shadow-[0_0_15px_#a855f7]'
                        : isRecoveryOnset
                        ? 'bg-emerald-400 text-slate-950 shadow-[0_0_15px_#34d399]'
                        : isPostLift
                        ? 'bg-indigo-500 text-white shadow-[0_0_12px_#6366f1]'
                        : isMorning
                        ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_#fbbf24]'
                        : 'bg-teal-500 text-slate-950'
                    }`}>
                      <span className="text-[10px] font-black">
                        {isGrowthOnset ? '⚡' : isRecoveryOnset ? '🌙' : isPostLift ? '⚡' : isMorning ? '🌅' : '🌙'}
                      </span>
                    </div>

                    {/* Transition Card - Concise by default, interactive inspect button to toggle details */}
                    <div 
                      onClick={() => toggleTimelineKey(marker.id)}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all relative overflow-hidden cursor-pointer hover:scale-[1.006] active:scale-[0.995] group/card ${
                      isGrowthOnset
                        ? 'bg-gradient-to-br from-purple-950/60 via-slate-900 to-indigo-950/40 border-purple-500/50 hover:border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                        : isRecoveryOnset
                        ? 'bg-gradient-to-br from-emerald-950/60 via-slate-900 to-teal-950/40 border-emerald-500/50 hover:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                        : isPostLift
                        ? 'bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/40 hover:border-indigo-400'
                        : isMorning
                        ? 'bg-gradient-to-br from-amber-950/35 via-slate-900 to-slate-900 border-amber-500/30 hover:border-amber-400'
                        : 'bg-gradient-to-br from-teal-950/30 via-slate-900 to-slate-900 border-teal-500/30 hover:border-teal-400'
                    }`}>
                      {/* Top Header Row - Compact & Concise */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <span className={`text-xs sm:text-sm font-black tracking-wide uppercase truncate ${
                            isGrowthOnset ? 'text-purple-100' : isRecoveryOnset ? 'text-emerald-100' : 'text-white'
                          }`}>
                            {marker.title}
                          </span>
                          <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${marker.badgeColor}`}>
                            {marker.badgeText}
                          </span>
                          <span className="text-xs font-mono font-black text-cyan-300 bg-white/5 px-2 py-0.5 rounded border border-white/10 shrink-0">
                            {marker.timeFormatted}
                          </span>
                        </div>

                        {/* Inspect & Expand Chevron Button */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => toggleTimelineKey(marker.id, e)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                              isExpanded
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <span>Inspect</span>
                            <ChevronDown 
                              size={13} 
                              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-cyan-300' : 'text-slate-400'}`} 
                            />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Rich Detail Body */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                          {/* Trigger Context Pill */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-300">
                            <span className="text-slate-400 font-mono text-[11px]">Trigger:</span>
                            <strong className="text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">
                              {marker.triggerText}
                            </strong>
                          </div>

                          {/* Biological Mechanism Description */}
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {marker.biologicalMechanism}
                          </p>

                          {/* Key Actions Checklist */}
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                              Phase Optimization Directives:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px]">
                              {marker.keyActions.map((action, aIdx) => (
                                <div key={aIdx} className="p-1.5 rounded-lg bg-black/40 border border-white/5 flex items-start gap-1.5">
                                  <span className={`font-bold text-xs ${
                                    isGrowthOnset ? 'text-purple-400' : isRecoveryOnset ? 'text-emerald-400' : 'text-amber-400'
                                  }`}>✓</span>
                                  <span className="text-slate-300">{action}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Critical Modalities to Consider Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[10px] font-mono text-slate-400">Critical Modalities:</span>
                            {marker.criticalModalitiesToConsider.map((cm, cIdx) => (
                              <span 
                                key={cIdx}
                                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                                  isGrowthOnset
                                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                    : isRecoveryOnset
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    : 'bg-white/5 text-slate-300 border-white/10'
                                }`}
                              >
                                {cm}
                              </span>
                            ))}
                          </div>

                          {/* Interactive Deep-Dive Modal Trigger */}
                          <div 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenTransitionMechanism(marker)
                            }}
                            className="pt-2 border-t border-white/10 flex items-center justify-between text-xs hover:opacity-90 cursor-pointer"
                          >
                            <span className="text-[11px] text-cyan-300 font-bold flex items-center gap-1.5 group-hover/card:text-cyan-200 transition-colors">
                              <Sparkles size={12} className="text-cyan-400" />
                              <span>Open kickoff mechanism & mode-shift modal ➔</span>
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                              {isGrowthOnset ? 'mTOR / Hypertrophy' : isRecoveryOnset ? 'AMPK / Autophagy' : 'Circadian Rhythm'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              }

              // -------------------------------------------------------------
              // CASE B: PROTOCOL TASK ON THE VERTICAL TIMELINE
              // -------------------------------------------------------------
              const task = entry.task
              const modalityObj = task.protocol_step?.modality || task.loose_modality || (task as any).modality
              const name = (modalityObj?.name || 'Protocol Task')
              const dose = task.execution_details?.custom_dose || task.protocol_step?.dose_text || (modalityObj as any)?.dose_or_exposure || 'Standard Dose'
              const slot = task.timing_slot || 'anytime'
              const timeStr = task.scheduled_time || formatHourToTimeStr(entry.hour)
              const isExpanded = expandedTimelineKeys.has(task.id)

              const classification = classifyModalityVector(task)
              const isGrowth = classification.type === 'growth'
              const isRecovery = classification.type === 'recovery'

              const criticalMatch = findCriticalModalityMatch(task)

              return (
                <div key={task.id} className="relative group">
                  {/* Task Anchor Node on the Vertical Rail */}
                  <div className={`absolute -left-[20px] sm:-left-[32px] top-3.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-md transition-transform group-hover:scale-125 ${
                    isGrowth 
                      ? 'bg-purple-500 shadow-[0_0_8px_#a855f7]' 
                      : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  }`} />

                  {/* Modality Card - Concise by default, Inspect button to expand */}
                  <div 
                    onClick={() => toggleTimelineKey(task.id)}
                    className={`p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer hover:scale-[1.006] active:scale-[0.995] group/taskcard ${
                    isGrowth 
                      ? 'bg-purple-950/20 border-purple-500/30 hover:border-purple-400 hover:bg-purple-950/30 shadow-sm' 
                      : 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/30 shadow-sm'
                  }`}>
                    {/* Header Row: Concise By Default */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        {modalityObj && (
                          <ModalityIcon modality={modalityObj} size={18} className="shrink-0" />
                        )}
                        <span className="text-xs font-black text-white truncate">{name}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                          isGrowth 
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 font-bold' 
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold'
                        }`}>
                          {isGrowth ? '🟣 Growth' : '🟢 Recovery'}
                        </span>

                        {/* Merged Protocol Lineages Badges */}
                        {task.lineages && task.lineages.length > 0 && (
                          <div className="flex items-center gap-1">
                            {task.lineages.map((lin, lIdx) => (
                              <span 
                                key={lIdx} 
                                style={{ borderColor: `${lin.color_hex || '#A855F7'}60`, color: lin.color_hex || '#C084FC' }}
                                className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/5 border shrink-0"
                              >
                                {lin.protocol_name}
                              </span>
                            ))}
                          </div>
                        )}

                        {criticalMatch && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 shrink-0">
                            <Sparkles size={9} />
                            <span>Critical</span>
                          </span>
                        )}

                        <span className="text-xs font-mono font-bold text-cyan-300 shrink-0">
                          {timeStr}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10 shrink-0">
                          {slot.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>

                      {/* Inspect & Expand Chevron Button */}
                      <div className="flex items-center gap-1 shrink-0">
                        {task.status === 'completed' && !isExpanded && (
                          <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mr-1 shrink-0">
                            <CheckCircle2 size={11} /> Done
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => toggleTimelineKey(task.id, e)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                            isExpanded
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                              : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>Inspect</span>
                          <ChevronDown 
                            size={13} 
                            className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-cyan-300' : 'text-slate-400'}`} 
                          />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details Section */}
                    {isExpanded && (
                      <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="text-xs text-slate-300 flex items-center justify-between flex-wrap gap-2">
                          <span>Dose / Protocol: <strong className="text-white">{dose}</strong></span>
                          {task.status === 'completed' && (
                            <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <CheckCircle2 size={12} /> Completed
                            </span>
                          )}
                        </div>

                        {/* Interactive Click prompt for Mechanism Modal */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenTaskMechanism(task)
                          }}
                          className="pt-2 border-t border-white/5 flex items-center justify-between text-xs hover:opacity-90 cursor-pointer"
                        >
                          <span className={`text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                            isGrowth 
                              ? 'text-purple-300 group-hover/taskcard:text-purple-200' 
                              : isRecovery 
                              ? 'text-emerald-300 group-hover/taskcard:text-emerald-200' 
                              : 'text-cyan-300 group-hover/taskcard:text-cyan-200'
                          }`}>
                            <Info size={12} />
                            <span>Open deep-dive {isGrowth ? 'Growth' : isRecovery ? 'Recovery' : 'Cellular'} mechanism modal ➔</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Molecular Rationale
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 7. MODALITY MECHANISM DEEP-DIVE MODAL */}
      <ModalityMechanismModal
        isOpen={isMechanismModalOpen && !!selectedMechanismDetail}
        detail={selectedMechanismDetail}
        onClose={() => {
          setIsMechanismModalOpen(false)
          setSelectedMechanismDetail(null)
        }}
      />

      {/* 8. PROTOCOL OPTIMIZATION & CHRONO-ASSESSMENT MODAL */}
      {isOptimizationModalOpen && (
        <ProtocolOptimizationModal
          isOpen={isOptimizationModalOpen}
          onClose={() => setIsOptimizationModalOpen(false)}
          findings={optimizationFindings}
          localUserId={getLocalUserId()}
          dateStr={dateStr}
          growthPercentage={pulseBalance.growthPercentage}
          recoveryPercentage={pulseBalance.recoveryPercentage}
          onOptimizationApplied={() => {
            if (onTaskUpdated) onTaskUpdated()
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('levl_protocol_updated'))
            }
          }}
        />
      )}
    </div>
  )
}
