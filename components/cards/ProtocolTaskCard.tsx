'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { format } from 'date-fns'
import { DailyProtocolTask, Modality, ProtocolStep, Protocol, UserModalityHabit } from '@/lib/types'
import { Check, CheckCircle2, X, Clock, AlertTriangle, Activity, ChevronDown, ChevronUp, ChevronRight, Microscope, Bookmark, User, Info, CalendarDays, RotateCcw, Sliders, Star, Sparkles, Archive, Trash2, ExternalLink, Edit3, SkipForward } from 'lucide-react'
import GeekMode from './GeekMode'
import PersonalizeModalityModal from '../modals/PersonalizeModalityModal'
import { DosageDetailModal } from '../modals/DosageDetailModal'
import CustomizeModalityOutcomesModal from '../modals/CustomizeModalityOutcomesModal'
import { addToBench, moveModalityToBench, eliminateModality, getBenchItem, saveOutcomeObservation, getTaskOutcomeObservations, upsertBenchItemOverride, updateTaskExecutionDetails, reconcileModalityScheduleAndFutureTasks } from '@/lib/data'
import { ELIMINATION_REASON_OPTIONS } from '../views/ExpandedModalityDetailBanner'
import { ModalityExecutionGuide } from '../modals/ModalityExecutionGuide'
import { getModalityVideoInfo } from '@/lib/data/modalityVideos'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { UserBenchItem, OutcomeDimension, UserProfile, DailyWellbeingCheckin } from '@/lib/types'
import { getOutcomeColorConfig, getNeutralOutcomeColorConfig } from '@/lib/utils/outcomeColors'
import { getRecentOutcomeSnapshot } from '@/lib/utils/outcomeRecency'
import OutcomePill from '@/components/outcomes/OutcomePill'
import StrengthExecutionLog from '../execution/StrengthExecutionLog'
import FastingExecutionLog from '../execution/FastingExecutionLog'
import ThermalExecutionLog from '../execution/ThermalExecutionLog'
import BreathworkExecutionLog from '../execution/BreathworkExecutionLog'
import CardioExecutionLog from '../execution/CardioExecutionLog'
import SupplementExecutionLog from '../execution/SupplementExecutionLog'
import NutritionMacroExecutionLog from '../execution/NutritionMacroExecutionLog'
import RedLightExecutionLog from '../execution/RedLightExecutionLog'
import CGMExecutionLog from '../execution/CGMExecutionLog'
import BlueLightDimmingExecutionLog from '../execution/BlueLightDimmingExecutionLog'
import SunlightCircadianExecutionLog from '../execution/SunlightCircadianExecutionLog'
import SleepHygieneExecutionLog from '../execution/SleepHygieneExecutionLog'
import HydrationElectrolyteExecutionLog from '../execution/HydrationElectrolyteExecutionLog'
import BiometricPhlebotomyExecutionLog from '../execution/BiometricPhlebotomyExecutionLog'
import PeptideExecutionLog from '../execution/PeptideExecutionLog'
import CompletedExecutionSummary from '../execution/CompletedExecutionSummary'
import ManageTaskModal from '../modals/ManageTaskModal'
import { DosageBadgeButton } from '../ui/DosageBadgeButton'
import { HabitAnalyticsModal } from '../modals/HabitAnalyticsModal'
import MedicalDisclaimerBanner from '../ui/MedicalDisclaimerBanner'
import { saveInjectionSiteLog } from '@/lib/peptides/reconstitutionEngine'
import { useTemperatureUnit } from '@/lib/utils/useTemperatureUnit'
import { isPreLoggableOutcome, hasAnyPreLoggableOutcome, getOutcomePhaseType } from '@/lib/utils/outcomePhaseRules'
import { getPeakOnsetGuidance } from '@/lib/utils/peakOnsetGuidance'
import { getCircadianConfig } from '@/lib/utils/circadianConfig'
import { resolveOptimalTimingSlot } from '@/lib/data/resolveOptimalTiming'
import { getModalityArchetype } from '@/lib/data/modalityArchetypes'
import dynamic from 'next/dynamic'

const CyclicSighingApplet = dynamic(() => import('../applets/CyclicSighingApplet'), {
  ssr: false
})

const Breathing478Applet = dynamic(() => import('../applets/Breathing478Applet'), {
  ssr: false
})

const BoxBreathingApplet = dynamic(() => import('../applets/BoxBreathingApplet'), {
  ssr: false
})

const HyperventilationApplet = dynamic(() => import('../applets/HyperventilationApplet'), {
  ssr: false
})

const CoherentBreathingApplet = dynamic(() => import('../applets/CoherentBreathingApplet'), {
  ssr: false
})

export function TimePickerWithAmPmToggle({
  value,
  onChange,
  onCommit
}: {
  value: string
  onChange: (newTime24: string) => void
  onCommit?: (newTime24: string) => void
}) {
  const [showQuickDropdown, setShowQuickDropdown] = useState(false)
  const nativeInputRef = useRef<HTMLInputElement>(null)

  const [rawH, rawM] = (value || '12:00').split(':')
  const h24 = parseInt(rawH || '12', 10)
  const m = (rawM || '00').slice(0, 2)

  const period = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 || 12
  const formattedDisplay12 = `${String(h12).padStart(2, '0')}:${m}`

  const [typedText, setTypedText] = useState(formattedDisplay12)
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (!isTyping) {
      setTypedText(formattedDisplay12)
    }
  }, [formattedDisplay12, isTyping])

  const commitTime = (new24: string) => {
    onChange(new24)
    if (onCommit) onCommit(new24)
  }

  const toggleAmPm = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const newH24 = period === 'AM' ? (h24 + 12) % 24 : (h24 - 12 + 24) % 24
    const new24 = `${String(newH24).padStart(2, '0')}:${m}`
    commitTime(new24)
  }

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val && val.includes(':')) {
      commitTime(val)
    }
  }

  const handleManualBlur = () => {
    setIsTyping(false)
    const cleaned = typedText.trim().replace(/[^0-9:]/g, '')
    let newH = h12
    let newM = m

    if (cleaned.includes(':')) {
      const [hPart, mPart] = cleaned.split(':')
      const ph = parseInt(hPart, 10)
      const pm = parseInt(mPart, 10)
      if (!isNaN(ph) && ph >= 1 && ph <= 12) newH = ph
      if (!isNaN(pm) && pm >= 0 && pm <= 59) newM = String(pm).padStart(2, '0')
    } else {
      const num = parseInt(cleaned, 10)
      if (!isNaN(num)) {
        if (num >= 1 && num <= 12) {
          newH = num
        } else if (num >= 100 && num <= 1259) {
          const ph = Math.floor(num / 100)
          const pm = num % 100
          if (ph >= 1 && ph <= 12) newH = ph
          if (pm >= 0 && pm <= 59) newM = String(pm).padStart(2, '0')
        }
      }
    }

    let finalH24 = newH
    if (period === 'PM' && finalH24 < 12) finalH24 += 12
    if (period === 'AM' && finalH24 === 12) finalH24 = 0
    commitTime(`${String(finalH24).padStart(2, '0')}:${newM}`)
  }

  const adjustMinutes = (deltaMins: number, e: React.MouseEvent) => {
    e.stopPropagation()
    let totalMinutes = h24 * 60 + parseInt(m, 10) + deltaMins
    if (totalMinutes < 0) totalMinutes += 1440
    totalMinutes = totalMinutes % 1440
    const newH = Math.floor(totalMinutes / 60)
    const newMin = totalMinutes % 60
    commitTime(`${String(newH).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`)
  }

  const applyOffsetFromNow = (offsetMins: number) => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - offsetMins)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    commitTime(`${hh}:${mm}`)
    setShowQuickDropdown(false)
  }

  const setDirectHour = (targetH12: number) => {
    let targetH24 = targetH12
    if (period === 'PM' && targetH24 < 12) targetH24 += 12
    if (period === 'AM' && targetH24 === 12) targetH24 = 0
    commitTime(`${String(targetH24).padStart(2, '0')}:${m}`)
  }

  const setDirectMinute = (targetMin: number) => {
    commitTime(`${String(h24).padStart(2, '0')}:${String(targetMin).padStart(2, '0')}`)
  }

  return (
    <div className="relative flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
      {/* Quick Stepper -15m */}
      <button
        type="button"
        onClick={(e) => adjustMinutes(-15, e)}
        className="text-[10px] font-bold px-1.5 py-1 rounded-md bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-white/10 transition-colors cursor-pointer select-none active:scale-95 shrink-0"
        title="15 minutes earlier"
      >
        -15m
      </button>

      {/* Main Interactive Time Display & Native Input Trigger */}
      <div className="relative flex items-center bg-black/70 border border-emerald-500/40 rounded-lg px-2 py-0.5 shadow-inner">
        <input 
          type="text" 
          inputMode="numeric"
          value={isTyping ? typedText : formattedDisplay12}
          onFocus={() => setIsTyping(true)}
          onChange={(e) => setTypedText(e.target.value)}
          onBlur={handleManualBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleManualBlur()
            }
          }}
          className="bg-transparent text-sm font-black text-white font-mono focus:outline-none w-12 text-center"
          title="Type time (e.g. 8:30 or 11:15)"
        />

        {/* Native Mobile Time Picker Button (Opens iOS wheel / Android dialog) */}
        <div className="relative ml-0.5 flex items-center">
          <input
            ref={nativeInputRef}
            type="time"
            value={value || '12:00'}
            onChange={handleNativeChange}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer [color-scheme:dark] z-10"
            title="Open system time picker"
          />
          <span className="text-emerald-400/80 hover:text-emerald-300 text-xs cursor-pointer pointer-events-none">
            <Clock size={13} />
          </span>
        </div>
      </div>

      {/* Quick Stepper +15m */}
      <button
        type="button"
        onClick={(e) => adjustMinutes(15, e)}
        className="text-[10px] font-bold px-1.5 py-1 rounded-md bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-white/10 transition-colors cursor-pointer select-none active:scale-95 shrink-0"
        title="15 minutes later"
      >
        +15m
      </button>

      {/* AM / PM Toggle Pill */}
      <button
        type="button"
        onClick={toggleAmPm}
        className="text-[11px] font-black px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all cursor-pointer select-none shrink-0 active:scale-95"
        title="Click to toggle AM / PM"
      >
        {period}
      </button>

      {/* Quick Menu Popover Toggle */}
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setShowQuickDropdown(!showQuickDropdown)
          }}
          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
            showQuickDropdown 
              ? 'bg-emerald-500 text-slate-950 border-emerald-400' 
              : 'bg-black/60 text-emerald-400 hover:text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/20'
          }`}
          title="Open quick time presets & dial"
        >
          <Sliders size={13} />
        </button>

        {showQuickDropdown && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-slate-950/95 backdrop-blur-xl border border-emerald-500/50 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] p-3 z-50 animate-in fade-in zoom-in-95 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Clock size={12} /> Quick Time Selector
              </span>
              <span className="text-xs font-mono font-bold text-white bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/40">
                {formattedDisplay12} {period}
              </span>
            </div>

            {/* Quick Relative Time Presets */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                Relative Presets
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyOffsetFromNow(0)}
                  className="px-2 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 transition-colors"
                >
                  ⚡ Right Now
                </button>
                <button
                  type="button"
                  onClick={() => applyOffsetFromNow(15)}
                  className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-200 text-[11px] font-semibold border border-white/10 transition-colors"
                >
                  -15m ago
                </button>
                <button
                  type="button"
                  onClick={() => applyOffsetFromNow(30)}
                  className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-200 text-[11px] font-semibold border border-white/10 transition-colors"
                >
                  -30m ago
                </button>
                <button
                  type="button"
                  onClick={() => applyOffsetFromNow(60)}
                  className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-200 text-[11px] font-semibold border border-white/10 transition-colors"
                >
                  -1h ago
                </button>
                <button
                  type="button"
                  onClick={() => applyOffsetFromNow(120)}
                  className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-200 text-[11px] font-semibold border border-white/10 transition-colors"
                >
                  -2h ago
                </button>
                <button
                  type="button"
                  onClick={() => applyOffsetFromNow(240)}
                  className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-200 text-[11px] font-semibold border border-white/10 transition-colors"
                >
                  -4h ago
                </button>
              </div>
            </div>

            {/* Quick Hour Grid */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                Hour ({period})
              </span>
              <div className="grid grid-cols-6 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((hNum) => {
                  const isSelected = h12 === hNum
                  return (
                    <button
                      key={hNum}
                      type="button"
                      onClick={() => setDirectHour(hNum)}
                      className={`py-1 rounded-md text-xs font-mono font-bold transition-all ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                          : 'bg-white/5 text-gray-300 hover:bg-white/15 hover:text-white border border-white/5'
                      }`}
                    >
                      {hNum}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quick Minute Grid */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                Minutes
              </span>
              <div className="grid grid-cols-4 gap-1">
                {[0, 15, 30, 45].map((minVal) => {
                  const isSelected = parseInt(m, 10) === minVal
                  return (
                    <button
                      key={minVal}
                      type="button"
                      onClick={() => setDirectMinute(minVal)}
                      className={`py-1 rounded-md text-xs font-mono font-bold transition-all ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                          : 'bg-white/5 text-gray-300 hover:bg-white/15 hover:text-white border border-white/5'
                      }`}
                    >
                      :{String(minVal).padStart(2, '0')}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Native Wheel Trigger */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
              <span className="text-[10px] text-gray-400 font-semibold">Native System Clock:</span>
              <input
                type="time"
                value={value || '12:00'}
                onChange={handleNativeChange}
                className="bg-slate-900 border border-emerald-500/40 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none [color-scheme:dark] cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Extended type for our UI which might have multiple lineages if deduplicated
export type DedupedTask = DailyProtocolTask & {
  lineages?: { protocol_name: string; protocol_type?: string; color_hex?: string }[]
  original_tasks?: DailyProtocolTask[]
}

const PROTOCOL_COLORS = [
  '#A855F7', // Purple
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
]

// Simple deterministic string hasher for colors
function getColorForProtocol(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return PROTOCOL_COLORS[Math.abs(hash) % PROTOCOL_COLORS.length]
}

type ProtocolTaskCardProps = {
  task: DedupedTask
  onStatusChange: (id: string, status: string, reason?: string, completedAt?: string, executionMetrics?: any, executionDetails?: any) => void
  onTrackOutcomes?: (modality: Modality, sessionId: string, phase?: string) => void
  insightOverride?: any
  initialBenchItem?: UserBenchItem | null
  recentTasks?: DailyProtocolTask[]
  isRecentlyCompleted?: boolean
  allOutcomes?: OutcomeDimension[]
  userProfile?: UserProfile | null
  wellbeingCheckin?: DailyWellbeingCheckin | null
  onSaveCustomOutcomes?: (modalityId: string, outcomeIds: string[]) => void
  onOutcomesSaved?: (taskId: string) => void
  onOpenRescheduleModal?: (task: DailyProtocolTask) => void
  outcomesRefreshKey?: number
  completionMode?: 'outcome' | 'fast'
  defaultExpanded?: boolean
  isProtocolGroupView?: boolean
  protocolGroupName?: string
}

export default function ProtocolTaskCard({ 
  task, 
  onStatusChange, 
  onTrackOutcomes, 
  insightOverride, 
  initialBenchItem, 
  recentTasks, 
  isRecentlyCompleted,
  allOutcomes = [],
  userProfile,
  wellbeingCheckin,
  onSaveCustomOutcomes,
  onOutcomesSaved,
  outcomesRefreshKey,
  onOpenRescheduleModal,
  completionMode = 'outcome',
  defaultExpanded = false,
  isProtocolGroupView = false,
  protocolGroupName
}: ProtocolTaskCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [showSkipReason, setShowSkipReason] = useState(false)
  const [skipReason, setSkipReason] = useState('')
  const [showEliminateReason, setShowEliminateReason] = useState(false)
  const [eliminateReason, setEliminateReason] = useState('')
  const [showGeekMode, setShowGeekMode] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [showCustomizeOutcomesModal, setShowCustomizeOutcomesModal] = useState(false)
  const [showHabitAnalyticsModal, setShowHabitAnalyticsModal] = useState(false)

  // Inline outcome slider tracking states
  const [showInlineOutcomes, setShowInlineOutcomes] = useState(false)
  const [activeOutcomePhase, setActiveOutcomePhase] = useState<'pre' | 'post'>('post')
  const [inlinePreValues, setInlinePreValues] = useState<Record<string, number>>({})
  const [inlinePostValues, setInlinePostValues] = useState<Record<string, number>>({})
  const [touchedPreOutcomes, setTouchedPreOutcomes] = useState<Record<string, boolean>>({})
  const [touchedPostOutcomes, setTouchedPostOutcomes] = useState<Record<string, boolean>>({})
  const [outcomeNotes, setOutcomeNotes] = useState('')
  const [baselineOutcomesMap, setBaselineOutcomesMap] = useState<Record<string, number>>({})
  const [taskObs, setTaskObs] = useState<any[]>([])
  const [isSavingOutcomes, setIsSavingOutcomes] = useState(false)
  const [outcomesSavedDone, setOutcomesSavedDone] = useState(false)
  const [isEditingOutcomes, setIsEditingOutcomes] = useState(false)
  const [editPreValues, setEditPreValues] = useState<Record<string, number>>({})
  const [editPostValues, setEditPostValues] = useState<Record<string, number>>({})
  const [isSavingEditOutcomes, setIsSavingEditOutcomes] = useState(false)
  const [isHabitAutomated, setIsHabitAutomated] = useState(false)
  const [habitRecord, setHabitRecord] = useState<UserModalityHabit | null>(null)
  const [showBreathworkApplet, setShowBreathworkApplet] = useState(false)
  const [show478Applet, setShow478Applet] = useState(false)
  const [showBoxApplet, setShowBoxApplet] = useState(false)
  const [showHyperApplet, setShowHyperApplet] = useState(false)
  const [showCoherentApplet, setShowCoherentApplet] = useState(false)
  const lastCheckClickTimeRef = useRef<number>(0)

  const cardModalityId = task.modality_id || task.protocol_step?.modality_id || task.loose_modality?.id

  useEffect(() => {
    if (cardModalityId) {
      const localUserId = getLocalUserId()
      import('@/lib/data').then(m => m.getUserModalityHabits(localUserId)).then(habits => {
        const found = habits.find(h => h.modality_id === cardModalityId || h.modality?.slug === cardModalityId || h.modality?.id === cardModalityId)
        if (found) {
          setIsHabitAutomated(found.is_automated)
          setHabitRecord(found)
        } else {
          setIsHabitAutomated(false)
          setHabitRecord(null)
        }
      })
    }
  }, [cardModalityId, task.status, isRecentlyCompleted])

  // Fetch task outcome observations when expanded or completed
  useEffect(() => {
    if (expanded || task.status === 'completed') {
      const userId = getLocalUserId()
      getTaskOutcomeObservations(userId, task.id, task.scheduled_date).then(obs => {
        if (obs && obs.length > 0) {
          setTaskObs(obs)
          const baseMap: Record<string, number> = {}
          const preInit: Record<string, number> = {}
          const postInit: Record<string, number> = {}
          const touchedPre: Record<string, boolean> = {}
          const touchedPost: Record<string, boolean> = {}

          obs.forEach((o: any) => {
            if (o.notes && !outcomeNotes) setOutcomeNotes(o.notes)
            if (o.phase === 'pre') {
              baseMap[o.outcome_id] = o.value_0_10
              preInit[o.outcome_id] = o.value_0_10
              touchedPre[o.outcome_id] = true
            } else if (o.phase === 'post') {
              postInit[o.outcome_id] = o.value_0_10
              touchedPost[o.outcome_id] = true
            }
          })

          setBaselineOutcomesMap(baseMap)
          setInlinePreValues(preInit)
          setInlinePostValues(postInit)
          setTouchedPreOutcomes(touchedPre)
          setTouchedPostOutcomes(touchedPost)
        } else {
          setTaskObs([])
          setBaselineOutcomesMap({})
          setInlinePreValues({})
          setInlinePostValues({})
          setTouchedPreOutcomes({})
          setTouchedPostOutcomes({})
        }
      })
    }
  }, [task.id, task.status, expanded, outcomesRefreshKey])
  
  const [showPersonalizeModal, setShowPersonalizeModal] = useState(false)
  const [benchItem, setBenchItem] = useState<UserBenchItem | null>(initialBenchItem || null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [benched, setBenched] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isJustCompletedInline = isRecentlyCompleted && !outcomesSavedDone

  // Execution Metrics
  const getInitialCompletedTime = (t: typeof task) => {
    const timeSource = t.completed_at || (t.status === 'completed' ? t.created_at : null)
    if (timeSource) {
      const d = new Date(timeSource)
      if (!isNaN(d.getTime())) {
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      }
    }
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  const [completedTime, setCompletedTime] = useState(() => getInitialCompletedTime(task))

  useEffect(() => {
    const timeSource = task.completed_at || (task.status === 'completed' ? task.created_at : null)
    if (timeSource) {
      const d = new Date(timeSource)
      if (!isNaN(d.getTime())) {
        const formatted = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
        setCompletedTime(formatted)
      }
    }
  }, [task.status, task.completed_at, task.created_at])
  
  // Initialize from existing DB state
  const [executionDetails, setExecutionDetails] = useState<any>(() => {
    if (task.execution_details) return task.execution_details
    
    const modalityName = (task.protocol_step?.modality?.name || task.loose_modality?.name || '').toLowerCase()
    if (modalityName.includes('fast')) {
      let duration: number | '' = ''
      let fastType = ''
      
      if (modalityName.includes('12:12')) duration = 12
      else if (modalityName.includes('16:8')) duration = 16
      else if (modalityName.includes('18:6')) duration = 18
      else if (modalityName.includes('20:4') || modalityName.includes('omad')) duration = 20
      else if (modalityName.includes('24')) duration = 24
      else if (modalityName.includes('36')) duration = 36
      else if (modalityName.includes('48')) duration = 48
      else if (modalityName.includes('72')) duration = 72

      if (modalityName.includes('water')) fastType = 'Water Only'
      else if (modalityName.includes('bone broth')) fastType = 'Bone Broth'
      else if (modalityName.includes('fat')) fastType = 'Fat Fast'
      else if (modalityName.includes('dry')) fastType = 'Dry Fast'
      else if (modalityName.includes('juice')) fastType = 'Juice Fast'

      return { duration, fast_type: fastType, start_time: '', end_time: '', ketones: '', glucose: '' }
    }
    
    return { sets: [] }
  })
  const [isEditingExecution, setIsEditingExecution] = useState(false)

  const handleExplicitComplete = (useNow: boolean = false) => {
    setIsProcessing(true)
    const baseDateStr = task.scheduled_date
    let logDate = new Date()
    if (baseDateStr) {
      const [y, m, d] = baseDateStr.split('-').map(Number)
      if (y && m && d) {
        logDate = new Date(y, m - 1, d)
      }
    }
    if (!useNow && completedTime) {
      const [hours, minutes] = completedTime.split(':')
      logDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
    } else if (useNow) {
      const now = new Date()
      logDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0)
    }
    
    let metrics: any = undefined
    if (executionDetails.duration || executionDetails.distance) {
      metrics = {}
      if (executionDetails.duration) metrics.duration_mins = parseFloat(executionDetails.duration)
      if (executionDetails.distance) metrics.distance = parseFloat(executionDetails.distance)
    }

    setExpanded(true)
    onStatusChange(task.id, 'completed', undefined, logDate.toISOString(), metrics, executionDetails)
    setIsEditingExecution(false)
    setIsProcessing(false)
  }

  const handlePersonalizeClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsProcessing(true)
    const localUserId = getLocalUserId()
    const item = await getBenchItem(localUserId, task.modality_id || task.protocol_step?.modality_id || '')
    setBenchItem(item)
    setIsProcessing(false)
    setShowPersonalizeModal(true)
  }

  const [actionModalType, setActionModalType] = useState<'bench' | 'eliminate' | null>(null)
  const [actionSuccess, setActionSuccess] = useState<'bench' | 'eliminate' | null>(null)
  const [selectedEliminationReasons, setSelectedEliminationReasons] = useState<string[]>([])

  const toggleEliminationReason = (label: string) => {
    setSelectedEliminationReasons(prev =>
      prev.includes(label) ? prev.filter(r => r !== label) : [...prev, label]
    )
  }

  const handleConfirmAction = async () => {
    setIsProcessing(true)
    const localUserId = getLocalUserId()
    const mId = task.modality_id || task.protocol_step?.modality_id || ''

    if (actionModalType === 'eliminate') {
      setActionSuccess('eliminate')
      await eliminateModality(localUserId, mId, eliminateReason || 'User eliminated modality', task.id, selectedEliminationReasons)
      // 0.5-second visual confirmation before closing
      await new Promise(r => setTimeout(r, 500))
      setIsProcessing(false)
      setActionSuccess(null)
      setActionModalType(null)
      onStatusChange(task.id, 'contraindicated', eliminateReason || 'User eliminated modality')
    } else if (actionModalType === 'bench') {
      setActionSuccess('bench')
      await moveModalityToBench(localUserId, mId, task.id)
      if (eliminateReason || selectedEliminationReasons.length > 0) {
        const { supabase } = await import('@/lib/supabase/client')
        if (supabase) {
          await supabase.from('user_bench_items').update({ personal_notes: eliminateReason, elimination_reasons: selectedEliminationReasons }).eq('local_user_id', localUserId).eq('modality_id', mId)
        }
      }
      // 0.5-second visual confirmation before closing
      await new Promise(r => setTimeout(r, 500))
      setIsProcessing(false)
      setActionSuccess(null)
      setActionModalType(null)
      setBenched(true)
      onStatusChange(task.id, 'skipped', 'Moved to Bench')
    }
  }

  const modality = task.protocol_step?.modality || task.loose_modality
  if (!modality) return null

  const isPeptideOrRiskyModality = useMemo(() => {
    const cat = (modality?.category || '').toLowerCase()
    const name = (modality?.name || modality?.display_name || '').toLowerCase()
    if (name.includes('collagen')) return false
    return (
      cat.includes('peptide') ||
      cat.includes('hormone') ||
      cat.includes('injectable') ||
      cat.includes('pharmaceutical') ||
      cat.includes('senolytic') ||
      cat.includes('secretagogue') ||
      name.includes('bpc') ||
      name.includes('tb-500') ||
      name.includes('tb500') ||
      name.includes('mots-c') ||
      name.includes('cjc') ||
      name.includes('ipamorelin') ||
      name.includes('epithalon') ||
      name.includes('ghk-cu') ||
      name.includes('semaglutide') ||
      name.includes('tirzepatide') ||
      name.includes('rapamycin') ||
      name.includes('metformin') ||
      name.includes('fisetin') ||
      name.includes('retatrutide') ||
      name.includes('kpv') ||
      name.includes('thymosin') ||
      name.includes('tesamorelin') ||
      name.includes('sermorelin') ||
      name.includes('aod-9604') ||
      name.includes('subq') ||
      name.includes('sauna') ||
      name.includes('cold plunge') ||
      name.includes('ice bath')
    )
  }, [modality])

  const isCompleted = task.status === 'completed'
  const isSkipped = task.status === 'skipped'
  const isSnoozed = task.status === 'snoozed'

  const userPriorityMap = useMemo(() => {
    const map = new Map<string, { isPriority: boolean; label: string; score: number }>()
    if (!userProfile) return map

    const prefs = userProfile.outcome_preference_scores || {}
    const goals = (userProfile.primary_goals || []).map(g => g.toLowerCase())

    allOutcomes.forEach(o => {
      const nameLower = o.name.toLowerCase()
      const score = prefs[o.id] ?? prefs[nameLower] ?? 0
      const matchesGoal = goals.some(g => nameLower.includes(g) || g.includes(nameLower))

      if (score >= 8 || matchesGoal) {
        map.set(o.id, {
          isPriority: true,
          label: score >= 9 ? '⭐ Top User Focus' : '⭐ User Goal',
          score: Math.max(score, matchesGoal ? 8 : 0)
        })
      }
    })
    return map
  }, [allOutcomes, userProfile])

  // Modality Archetype & Specialized Trait Resolution
  const modalityKey = (modality.slug || modality.id || modality.name || '').toLowerCase()
  const archetypeProfile = useMemo(() => getModalityArchetype(modality), [modality])
  const {
    archetype,
    lockedExerciseName,
    lockedCardioType,
    specializedTraits
  } = archetypeProfile

  const isThermal = archetype === 'thermal'
  const isBreathwork = archetype === 'breathwork'
  const isCardio = archetype === 'cardio'
  const isStrength = archetype === 'strength'
  const isFasting = archetype === 'fasting'
  const isNutritionMacro = archetype === 'nutrition_macro'
  const isRedLight = archetype === 'red_light'
  const isCGM = archetype === 'cgm'
  const isBlueLightDimming = archetype === 'blue_light_dimming'
  const isSunlight = archetype === 'sunlight'
  const isSleepHygiene = archetype === 'sleep'
  const isHydration = archetype === 'hydration'
  const isPhlebotomy = archetype === 'phlebotomy'
  const isPeptide = archetype === 'peptide'
  const isSupplement = archetype === 'supplement'
  const isSport = archetype === 'sport'

  const hasPrecisionLogUI = archetype !== 'general'

  // Precision execution log default expansion determination (~40% open, ~60% collapsed)
  const isPrecisionLogOpenByDefault = useMemo(() => {
    // EXPANDED by default (~40% - High-variance, dynamic session metrics where users configure sets, temps, HR, mcg):
    // 1. Strength & Resistance (Sets, reps, load, RPE)
    // 2. Cardio & Aerobic & Sports (Duration, HR zones, distance, pace)
    // 3. Thermal Stress (Sauna & Cold plunge exact temp, duration, Søberg warm-up)
    // 4. Peptides & Biologics (Microgram dose, injection site, route)
    // 5. Breathwork & Mindfulness / NSDR (Rounds, hold duration, minutes)
    // 6. Fasting Windows & Live Timers (Fast start/end, target hours)
    // 7. Targeted Macro Nutrition (Exact grams of protein/carbs/fat)
    // 8. Phlebotomy & Diagnostics (Volume mL, ferritin, blood pressure)
    if (
      isStrength ||
      isCardio ||
      isSport ||
      isThermal ||
      isPeptide ||
      isBreathwork ||
      isFasting ||
      isNutritionMacro ||
      isPhlebotomy
    ) {
      return true
    }

    // COLLAPSED by default (~60% - Low-friction, standard daily habits with compact dose pill + 1-click complete):
    // 1. Oral Supplements & Nootropics (Creatine, Magnesium, D3+K2, Omega-3, NMN, etc.)
    // 2. Hydration & Electrolytes (Morning water, LMNT salt)
    // 3. Sunlight & Circadian Light Exposure (Morning sunlight, optical flow)
    // 4. Blue Light Blockers & Screen Curfew (Amber glasses, digital sunset)
    // 5. Sleep Sanctuary & Bedroom Environment (Mouth tape, 66°F room)
    // 6. Photobiomodulation / Red Light Panels (Standard panel routine)
    // 7. CGM & Passive Glucose Tracking (Baseline checks)
    // 8. General Modalities
    return false
  }, [
    isStrength,
    isCardio,
    isSport,
    isThermal,
    isPeptide,
    isBreathwork,
    isFasting,
    isNutritionMacro,
    isPhlebotomy
  ])

  const [isPrecisionLogExpanded, setIsPrecisionLogExpanded] = useState<boolean>(isPrecisionLogOpenByDefault)

  useEffect(() => {
    setIsPrecisionLogExpanded(isPrecisionLogOpenByDefault)
  }, [isPrecisionLogOpenByDefault, task.id])

  const peakWindowText = useMemo(() => {
    const name = (modality.display_name || modality.name || '').toLowerCase()
    const cat = (modality.category || '').toLowerCase()

    if (name.includes('caffeine') || name.includes('coffee') || name.includes('espresso')) {
      return '⏱️ Peak effect window: ~30–45m'
    }
    if (name.includes('sauna') || name.includes('heat exposure')) {
      return '⏱️ Peak effect window: ~15–30m'
    }
    if (name.includes('cold plunge') || name.includes('ice bath') || name.includes('cold shower')) {
      return '⏱️ Peak effect window: ~10–20m'
    }
    if (name.includes('alpha-gpc') || name.includes('l-theanine') || name.includes('modafinil') || name.includes('nootropic') || name.includes('creatine')) {
      return '⏱️ Peak effect window: ~30–60m'
    }
    if (name.includes('magnesium') || name.includes('apigenin') || name.includes('gaba') || name.includes('melatonin')) {
      return '⏱️ Peak effect window: ~30–45m'
    }
    if (cat.includes('nutrition') || cat.includes('supplement')) {
      return '⏱️ Peak effect window: ~30–45m'
    }
    return null
  }, [modality])

  const currentRelevantOutcomes = useMemo(() => {
    let functionalOutcomes = modality.functional_outcomes_to_track || []
    if (typeof functionalOutcomes === 'string') {
      const cleaned = (functionalOutcomes as string).replace(/^{|}$/g, '')
      functionalOutcomes = cleaned ? cleaned.split(',') : []
    }

    // Include outcomes from functional_impacts keys if present
    const impactKeys = modality.functional_impacts ? Object.keys(modality.functional_impacts) : []

    const mappedOutcomeIds = [
      modality.primary_outcome, 
      ...(modality.secondary_outcomes || []),
      ...functionalOutcomes,
      ...impactKeys
    ].filter(Boolean) as string[]

    const normalizedKeys = mappedOutcomeIds.map(s => s.toLowerCase().trim().replace(/\s+/g, '_'))
    let list = allOutcomes.filter(o => 
      normalizedKeys.includes(o.id.toLowerCase()) || 
      normalizedKeys.includes(o.id.toLowerCase().replace(/_/g, ' ')) ||
      normalizedKeys.includes(o.name.toLowerCase()) ||
      normalizedKeys.includes(o.name.toLowerCase().replace(/\s+/g, '_'))
    )

    // Smart fallback if no mapped outcomes exist
    if (list.length === 0) {
      const nameLower = (modality.display_name || modality.name || '').toLowerCase()
      const catLower = (modality.category || '').toLowerCase()

      // 2. Specific biological category fallbacks using valid database outcome IDs
      if (
        nameLower.includes('cold plunge') || 
        nameLower.includes('sauna') || 
        nameLower.includes('ice bath') || 
        nameLower.includes('thermal') ||
        catLower.includes('thermal') ||
        catLower.includes('recovery')
      ) {
        list = allOutcomes.filter(o => ['focus', 'energy', 'calmness', 'stress', 'soreness', 'mood'].includes(o.id))
      } else if (
        nameLower.includes('resistance') || 
        nameLower.includes('strength') || 
        nameLower.includes('cardio') || 
        nameLower.includes('hiit') || 
        nameLower.includes('workout') || 
        nameLower.includes('lifting') || 
        catLower.includes('exercise') ||
        catLower.includes('fitness')
      ) {
        list = allOutcomes.filter(o => ['energy', 'soreness', 'strength', 'endurance', 'mood'].includes(o.id))
      } else if (
        nameLower.includes('breath') || 
        nameLower.includes('meditation') || 
        nameLower.includes('mindful') || 
        nameLower.includes('yoga') ||
        catLower.includes('mindfulness')
      ) {
        list = allOutcomes.filter(o => ['stress', 'calmness', 'anxiety', 'focus', 'mood'].includes(o.id))
      } else if (nameLower.includes('hyaluronic') || nameLower.includes('skin') || catLower.includes('skin')) {
        list = allOutcomes.filter(o => ['skin_clarity', 'joint_comfort', 'soreness'].includes(o.id))
      } else if (nameLower.includes('joint') || catLower.includes('joint')) {
        list = allOutcomes.filter(o => ['joint_comfort', 'pain', 'soreness'].includes(o.id))
      } else if (catLower.includes('sleep') || nameLower.includes('sleep')) {
        list = allOutcomes.filter(o => ['sleep_quality', 'sleep_latency'].includes(o.id))
      } else if (catLower.includes('cognitive') || nameLower.includes('focus') || nameLower.includes('brain') || nameLower.includes('caffeine')) {
        list = allOutcomes.filter(o => ['focus', 'mental_clarity', 'brain_fog', 'energy', 'productivity', 'motivation'].includes(o.id))
      } else if (catLower.includes('fast') || nameLower.includes('fast')) {
        list = allOutcomes.filter(o => ['mental_clarity', 'focus', 'energy', 'satiety', 'digestive_comfort', 'brain_fog'].includes(o.id))
      } else {
        // General fallback for all acute modalities: Energy, Focus, Stress, Mood
        list = allOutcomes.filter(o => ['energy', 'focus', 'stress', 'mood'].includes(o.id))
      }
    }

    // EXCLUDE ALL SLEEP-RELATED OUTCOMES FROM INDIVIDUAL ACUTE MODALITIES!
    // (Sleep outcomes are tracked exclusively in the Morning Check-in top section)
    list = list.filter(o => {
      const idLower = o.id.toLowerCase()
      const nameLower = o.name.toLowerCase()
      const catLower = (o.category || '').toLowerCase()
      return !idLower.includes('sleep') && !nameLower.includes('sleep') && !catLower.includes('sleep')
    })

    return [...list].sort((a, b) => {
      const aP = userPriorityMap.get(a.id)?.score || 0
      const bP = userPriorityMap.get(b.id)?.score || 0
      return bP - aP
    })
  }, [modality, allOutcomes, userPriorityMap])

  const hasPreLoggableOutcomes = useMemo(() => {
    return hasAnyPreLoggableOutcome(currentRelevantOutcomes)
  }, [currentRelevantOutcomes])

  const hasBaselineLogged = useMemo(() => {
    return Object.keys(baselineOutcomesMap).length > 0 || (taskObs && taskObs.some(o => o.phase === 'pre'))
  }, [baselineOutcomesMap, taskObs])

  const baselineSummaryText = useMemo(() => {
    if (!hasBaselineLogged) return null
    const entries = Object.entries(baselineOutcomesMap)
    if (entries.length === 0 && taskObs) {
      const preObs = taskObs.filter(o => o.phase === 'pre')
      return preObs.map(o => {
        const found = allOutcomes.find(ao => ao.id === o.outcome_id)
        return `${found?.name || o.outcome_id} ${o.value_0_10}/10`
      }).join(' • ')
    }
    return entries.map(([id, val]) => {
      const found = allOutcomes.find(o => o.id === id)
      return `${found?.name || id} ${val}/10`
    }).join(' • ')
  }, [hasBaselineLogged, baselineOutcomesMap, taskObs, allOutcomes])

  const renderBaselineTrigger = () => {
    if (!hasPreLoggableOutcomes) return null

    if (hasBaselineLogged) {
      return (
        <div className="flex items-center justify-between p-2.5 bg-purple-950/40 border border-purple-500/40 rounded-xl text-xs mb-3 shadow-sm">
          <div className="flex items-center gap-2 text-purple-200 font-semibold truncate min-w-0">
            <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
            <span className="text-[11px] truncate font-mono">Baseline: {baselineSummaryText}</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowInlineOutcomes(true)
              setActiveOutcomePhase('pre')
            }}
            className="text-[10px] font-bold text-purple-300 hover:text-white px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 rounded-md transition-colors shrink-0 ml-2 cursor-pointer border border-purple-500/30 flex items-center gap-1"
          >
            <Edit3 size={10} /> Edit Baseline
          </button>
        </div>
      )
    }

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setShowInlineOutcomes(true)
          setActiveOutcomePhase('pre')
        }}
        className="w-full py-2.5 px-3 mb-3 bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 hover:border-purple-400/50 text-purple-200 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer group shadow-sm"
      >
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-purple-400 group-hover:scale-110 transition-transform" />
          <span>⚡ Log Pre-Session Baseline (Before)</span>
        </div>
        <span className="text-[10px] text-purple-300/70 font-mono">Optional pre-checkin →</span>
      </button>
    )
  }

  const visibleOutcomes = useMemo(() => {
    if (activeOutcomePhase === 'pre') {
      return currentRelevantOutcomes.filter(o => isPreLoggableOutcome(o.id))
    }
    return currentRelevantOutcomes
  }, [activeOutcomePhase, currentRelevantOutcomes])

  const handleSkipOutcomesClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setOutcomesSavedDone(true)
    setShowInlineOutcomes(false)
    onStatusChange(task.id, 'completed')
    if (onOutcomesSaved) {
      onOutcomesSaved(task.id)
    }
  }

  const handleTrackOutcomesClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded(true)
    setShowInlineOutcomes(true)
    setActiveOutcomePhase('pre')
  }

  const handleSaveInlineOutcomes = async (forceComplete?: boolean) => {
    setIsSavingOutcomes(true)
    try {
      const localUserId = getLocalUserId()
      const dateStr = task.scheduled_date || format(new Date(), 'yyyy-MM-dd')
      const batchInputs: any[] = []

      const targetModalityId = task.modality_id || task.protocol_step?.modality_id || modality.id || ''

      for (const [outcomeId, val] of Object.entries(inlinePreValues)) {
        if (touchedPreOutcomes[outcomeId]) {
          batchInputs.push({
            localUserId,
            outcomeId,
            phase: 'pre',
            value: val,
            checkinDate: dateStr,
            taskId: task.id,
            modalityId: targetModalityId,
            notes: outcomeNotes || undefined
          })
        }
      }

      for (const [outcomeId, val] of Object.entries(inlinePostValues)) {
        if (touchedPostOutcomes[outcomeId]) {
          batchInputs.push({
            localUserId,
            outcomeId,
            phase: 'post',
            value: val,
            checkinDate: dateStr,
            taskId: task.id,
            modalityId: targetModalityId,
            notes: outcomeNotes || undefined
          })
        }
      }

      if (batchInputs.length > 0) {
        const { saveBatchOutcomeObservations } = await import('@/lib/data')
        await saveBatchOutcomeObservations(batchInputs)
      }

      const freshObs = await getTaskOutcomeObservations(localUserId, task.id, dateStr)
      if (freshObs) {
        setTaskObs(freshObs)
        const baseMap: Record<string, number> = {}
        freshObs.forEach((o: any) => {
          if (o.phase === 'pre') {
            baseMap[o.outcome_id] = o.value_0_10
          }
        })
        setBaselineOutcomesMap(prev => ({ ...prev, ...baseMap }))
      }
      setOutcomesSavedDone(true)
      setShowInlineOutcomes(false)
      
      // ONLY complete task if saving post outcomes or forced via checkmark click
      const shouldComplete = forceComplete || activeOutcomePhase !== 'pre'

      if (shouldComplete) {
        const loggedOutcomes = currentRelevantOutcomes.map(out => {
          const preVal = editPreValues[out.id] ?? inlinePreValues[out.id] ?? baselineOutcomesMap[out.id]
          const postVal = editPostValues[out.id] ?? inlinePostValues[out.id]
          return {
            outcomeId: out.id,
            outcomeName: out.name,
            directionality: out.directionality || 'higher_is_better',
            preValue: preVal !== undefined ? Number(preVal) : undefined,
            postValue: postVal !== undefined ? Number(postVal) : undefined
          }
        }).filter(o => o.preValue !== undefined || o.postValue !== undefined)

        const rawDetails = (executionDetails && Object.keys(executionDetails).length > 0) ? executionDetails : task.execution_details || {}
        const effectiveDetails = {
          ...rawDetails,
          logged_outcomes: loggedOutcomes
        }
        let metrics: any = undefined
        if (effectiveDetails?.duration || effectiveDetails?.distance) {
          metrics = {}
          if (effectiveDetails.duration) metrics.duration_mins = parseFloat(effectiveDetails.duration)
          if (effectiveDetails.distance) metrics.distance = parseFloat(effectiveDetails.distance)
        }
        if (isPeptide) {
          const site = effectiveDetails?.injection_site || 'abdomen_lower_right'
          saveInjectionSiteLog(modalityKey, site)
        }
        onStatusChange(task.id, 'completed', undefined, new Date().toISOString(), metrics, effectiveDetails)
      }

      if (onOutcomesSaved) {
        onOutcomesSaved(task.id)
      }
    } catch (err) {
      console.error('Error saving inline outcomes:', err)
    } finally {
      setIsSavingOutcomes(false)
    }
  }

  const handleSaveEditOutcomes = async () => {
    setIsSavingEditOutcomes(true)
    try {
      const localUserId = getLocalUserId()
      const dateStr = task.scheduled_date || format(new Date(), 'yyyy-MM-dd')
      const batchInputs: any[] = []

      const targetModalityId = task.modality_id || task.protocol_step?.modality_id || modality.id || ''

      for (const outcome of currentRelevantOutcomes) {
        const preVal = editPreValues[outcome.id] ?? inlinePreValues[outcome.id] ?? baselineOutcomesMap[outcome.id]
        const postVal = editPostValues[outcome.id] ?? inlinePostValues[outcome.id]

        if (preVal !== undefined) {
          batchInputs.push({
            localUserId,
            outcomeId: outcome.id,
            phase: 'pre',
            value: preVal,
            checkinDate: dateStr,
            taskId: task.id,
            modalityId: targetModalityId
          })
        }
        if (postVal !== undefined) {
          batchInputs.push({
            localUserId,
            outcomeId: outcome.id,
            phase: 'post',
            value: postVal,
            checkinDate: dateStr,
            taskId: task.id,
            modalityId: targetModalityId
          })
        }
      }

      if (batchInputs.length > 0) {
        const { saveBatchOutcomeObservations } = await import('@/lib/data')
        await saveBatchOutcomeObservations(batchInputs)
      }

      const freshObs = await getTaskOutcomeObservations(localUserId, task.id, dateStr)
      if (freshObs) {
        setTaskObs(freshObs)
        const baseMap: Record<string, number> = {}
        const postMap: Record<string, number> = {}
        const touchedMap: Record<string, boolean> = {}

        freshObs.forEach((o: any) => {
          if (o.phase === 'pre') {
            baseMap[o.outcome_id] = o.value_0_10
          } else if (o.phase === 'post') {
            postMap[o.outcome_id] = o.value_0_10
            touchedMap[o.outcome_id] = true
          }
        })

        setBaselineOutcomesMap(baseMap)
        setInlinePostValues(prev => ({ ...postMap, ...prev }))
        setTouchedPostOutcomes(prev => ({ ...touchedMap, ...prev }))
      }

      const loggedOutcomes = currentRelevantOutcomes.map(out => {
        const preVal = editPreValues[out.id] ?? inlinePreValues[out.id] ?? baselineOutcomesMap[out.id]
        const postVal = editPostValues[out.id] ?? inlinePostValues[out.id]
        return {
          outcomeId: out.id,
          outcomeName: out.name,
          directionality: out.directionality || 'higher_is_better',
          preValue: preVal !== undefined ? Number(preVal) : undefined,
          postValue: postVal !== undefined ? Number(postVal) : undefined
        }
      }).filter(o => o.preValue !== undefined || o.postValue !== undefined)

      const rawDetails = (executionDetails && Object.keys(executionDetails).length > 0) ? executionDetails : task.execution_details || {}
      const effectiveDetails = {
        ...rawDetails,
        logged_outcomes: loggedOutcomes
      }
      let metrics: any = undefined
      if (effectiveDetails?.duration || effectiveDetails?.distance) {
        metrics = {}
        if (effectiveDetails.duration) metrics.duration_mins = parseFloat(effectiveDetails.duration)
        if (effectiveDetails.distance) metrics.distance = parseFloat(effectiveDetails.distance)
      }
      onStatusChange(task.id, 'completed', undefined, undefined, metrics, effectiveDetails)

      setIsEditingOutcomes(false)
    } catch (err) {
      console.error('Error saving updated observations:', err)
    } finally {
      setIsSavingEditOutcomes(false)
    }
  }

  const handleSkipSubmit = () => {
    onStatusChange(task.id, 'skipped', skipReason)
    setShowSkipReason(false)
  }

  // Find lineages (either from deduped array or single protocol step)
  const lineages = task.lineages || []
  if (lineages.length === 0 && task.protocol_step?.protocol) {
    lineages.push({ 
      protocol_name: task.protocol_step.protocol.name, 
      protocol_type: task.protocol_step.protocol.protocol_type,
      color_hex: getColorForProtocol(task.protocol_step.protocol.name)
    })
  } else if (lineages.length > 0) {
    lineages.forEach(l => {
      if (!l.color_hex) l.color_hex = getColorForProtocol(l.protocol_name)
    })
  }

  // When viewed under a protocol umbrella in Today:
  // Instead of re-listing the same protocol umbrella name on every card,
  // display the correct time block in the same smaller less prominent font.
  const effectiveSlot = useMemo(() => {
    return resolveOptimalTimingSlot(
      modality, 
      task.protocol_step, 
      task.timing_slot || (task as any).execution_details?.timing_slot || task.execution_details?.custom_timing
    )
  }, [modality, task.protocol_step, task.timing_slot, (task as any).execution_details?.timing_slot, task.execution_details?.custom_timing])

  const circadian = useMemo(() => getCircadianConfig(effectiveSlot), [effectiveSlot])
  const CircadianIcon = circadian?.icon || Clock

  const timeBlockLabel = useMemo(() => {
    if (task.execution_details?.split_dose_label) {
      return task.execution_details.split_dose_label
    }
    return circadian?.label || effectiveSlot.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }, [task.execution_details?.split_dose_label, circadian?.label, effectiveSlot])

  const displayLineages = useMemo(() => {
    if (!isProtocolGroupView || !protocolGroupName) return lineages
    const umbrellaLower = protocolGroupName.toLowerCase().trim()
    return lineages.filter(l => l.protocol_name.toLowerCase().trim() !== umbrellaLower)
  }, [isProtocolGroupView, protocolGroupName, lineages])

  const { formatText: formatTemp } = useTemperatureUnit()

  // Display strings fallbacks (Execution Details -> Bench Item -> Protocol Step -> Modality)
  const rawCustomDose = task.execution_details?.custom_dose || benchItem?.custom_dose
  const rawBaseDose = task.protocol_step?.dose_text || (task.protocol_step?.dose_amount ? `${task.protocol_step.dose_amount} ${task.protocol_step.dose_unit || ''}` : modality.dose_or_exposure)
  const customDose = rawCustomDose ? formatTemp(rawCustomDose) : rawCustomDose
  const baseDose = rawBaseDose ? formatTemp(rawBaseDose) : rawBaseDose
  
  const customTiming = task.execution_details?.custom_timing || benchItem?.custom_timing
  const customTimingBadge = task.execution_details?.split_dose_label || customTiming
  const cleanTimingBadge = customTimingBadge
    ? customTimingBadge.replace(/^Dose \d+\s*\(/i, '').replace(/\)$/, '').replace(/^Dose \d+:\s*/i, '').trim()
    : ''
  const baseTiming = task.protocol_step?.timing_slot || modality.timing_summary
  
  const displayFreq = task.protocol_step?.frequency_rule || modality.frequency

  const isFlexible = displayFreq && displayFreq.includes('-') && displayFreq.toLowerCase().includes('weekly')
  let isMetOrDoneYesterday = false

  if (isFlexible && recentTasks && recentTasks.length > 0) {
    const taskDate = new Date(task.scheduled_date + 'T00:00:00')
    const yesterday = new Date(taskDate)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    const targetMatches = displayFreq.match(/(\d+)-/)
    const minTarget = targetMatches ? parseInt(targetMatches[1], 10) : 0

    const matchingCompletions = recentTasks.filter(t => 
      (t.modality_id === task.modality_id || t.protocol_step?.modality_id === task.protocol_step?.modality_id) &&
      ['completed', 'partial'].includes(t.status)
    )

    const didYesterday = matchingCompletions.some(t => t.scheduled_date === yesterdayStr)
    const hitTarget = minTarget > 0 && matchingCompletions.length >= minTarget

    if (didYesterday || hitTarget) {
      isMetOrDoneYesterday = true
    }
  }

  const currentDateObj = new Date()
  const year = currentDateObj.getFullYear()
  const month = String(currentDateObj.getMonth() + 1).padStart(2, '0')
  const day = String(currentDateObj.getDate()).padStart(2, '0')
  const localDateStr = `${year}-${month}-${day}`
  const taskDateOnly = (task.scheduled_date || '').slice(0, 10)
  const isFutureTask = taskDateOnly > localDateStr

  // Helper for completed summary text
  const getCompletedSummaryText = () => {
    if (task.execution_details && Object.keys(task.execution_details).length > 0) {
      const d = task.execution_details
      if (d.custom_dose) return formatTemp(d.custom_dose)

      // Cardio & Endurance
      if (d.duration && d.distance && d.avg_hr) return `${d.duration}m • ${d.distance} mi @ ${d.avg_hr} bpm`
      if (d.duration && d.avg_hr) return `${d.duration}m @ ${d.avg_hr} bpm`
      if (d.duration && d.distance) return `${d.duration}m • ${d.distance} mi`
      if (d.duration && d.cardio_type && !d.cardio_type.includes('Select')) return `${d.duration}m • ${d.cardio_type}`
      if (d.distance && d.avg_hr) return `${d.distance} mi @ ${d.avg_hr} bpm`

      // Thermal
      if (d.duration && d.temperature) return formatTemp(`${d.duration}m @ ${d.temperature}°${d.temperature_unit || 'F'}`)
      if (d.exposure_type && d.duration) return `${d.exposure_type.replace('_', ' ')} • ${d.duration}m`
      if (d.round_details && d.round_details.length > 0) return `${d.round_details.length} rounds logged`

      // Strength
      if (d.sets && d.sets.length > 0) {
        const allSame = d.sets.every((s: any) => s.weight === d.sets[0].weight && s.reps === d.sets[0].reps)
        if (allSame) return `${d.sets.length} sets @ ${d.sets[0].weight}lbs × ${d.sets[0].reps} reps`
        return `${d.sets.length} sets logged`
      }

      // Fasting
      if (d.duration && d.fast_type) return `${d.duration}h Fast (${d.fast_type})`
      if (d.duration && (isFasting || (modality.modality_type || '').includes('fast'))) return `${d.duration} Hours Fasted`

      // Breathwork
      if (d.duration && d.protocol_type) return `${d.duration}m • ${d.protocol_type}`
      if (d.max_retention_sec) return `Max Hold ${d.max_retention_sec}s`

      // Generic duration fallback
      if (d.duration) return `${d.duration} mins logged`
    }
    return customDose || baseDose || ''
  }

  const completedSummaryText = getCompletedSummaryText()
  
  const getCompletedDisplayContext = (): string | null => {
    if (!task.completed_at && task.status !== 'completed') return null
    const timeSource = task.completed_at || (task.status === 'completed' ? task.created_at : null)
    if (!timeSource) return null

    try {
      const cDate = new Date(timeSource)
      if (isNaN(cDate.getTime())) return null

      const timeStr = cDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd')

      const taskDate = task.scheduled_date || format(cDate, 'yyyy-MM-dd')

      if (taskDate === todayStr) {
        return `Completed today at ${timeStr}`
      } else if (taskDate === yesterdayStr) {
        return `Completed yesterday at ${timeStr}`
      } else {
        const formattedDate = format(new Date(taskDate.replace(/-/g, '/')), 'EEE, MMM d')
        return `Completed ${formattedDate} at ${timeStr}`
      }
    } catch (e) {
      return null
    }
  }

  const completedDisplayContext = getCompletedDisplayContext()

  // Mobile Touch Swipe Gesture State
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const isHorizontalSwipeRef = useRef<boolean | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (task.status !== 'pending' || isFutureTask) return
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    isHorizontalSwipeRef.current = null
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || task.status !== 'pending' || isFutureTask) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y

    // Determine swipe direction on first 6px movement
    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        isHorizontalSwipeRef.current = Math.abs(deltaX) > Math.abs(deltaY)
      }
    }

    if (isHorizontalSwipeRef.current === false) return

    // Apply smooth dampening past 90px
    let clamped = deltaX
    if (Math.abs(deltaX) > 90) {
      const excess = Math.abs(deltaX) - 90
      clamped = Math.sign(deltaX) * (90 + excess * 0.25)
    }
    setDragOffset(clamped)
  }

  const handleTouchEnd = () => {
    if (!touchStartRef.current || task.status !== 'pending' || isFutureTask) {
      setDragOffset(0)
      setIsDragging(false)
      touchStartRef.current = null
      return
    }

    const SWIPE_THRESHOLD = 65 // px

    if (dragOffset >= SWIPE_THRESHOLD) {
      // Swiped Right -> Complete
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(15) } catch (e) {}
      }
      onStatusChange(task.id, 'completed')
    } else if (dragOffset <= -SWIPE_THRESHOLD) {
      // Swiped Left -> Reschedule / Snooze
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(15) } catch (e) {}
      }
      if (onOpenRescheduleModal) {
        onOpenRescheduleModal(task)
      } else {
        onStatusChange(task.id, 'snoozed')
      }
    }

    setDragOffset(0)
    setIsDragging(false)
    touchStartRef.current = null
    isHorizontalSwipeRef.current = null
  }

  return (
    <div className={`relative overflow-hidden rounded-xl select-none ${isSupplement ? 'ml-0.5 sm:ml-1' : ''}`}>
      {/* Background Underlayers revealed during swipe */}
      {task.status === 'pending' && !isFutureTask && (
        <div className="absolute inset-0 flex items-center justify-between pointer-events-none rounded-xl overflow-hidden">
          {/* Complete Underlayer (Right Swipe) */}
          <div 
            className="h-full bg-emerald-600/90 flex items-center px-4 gap-2 text-white font-black text-xs transition-opacity shadow-inner"
            style={{ 
              opacity: dragOffset > 10 ? Math.min(1, dragOffset / 40) : 0,
              width: `${Math.max(0, dragOffset)}px`
            }}
          >
            <Check size={18} strokeWidth={3} className="shrink-0" />
            <span className="truncate">Complete</span>
          </div>

          {/* Reschedule Underlayer (Left Swipe) */}
          <div 
            className="h-full bg-amber-600/90 flex items-center justify-end px-4 gap-2 text-white font-black text-xs transition-opacity ml-auto shadow-inner"
            style={{ 
              opacity: dragOffset < -10 ? Math.min(1, Math.abs(dragOffset) / 40) : 0,
              width: `${Math.max(0, -dragOffset)}px`
            }}
          >
            <span className="truncate">Reschedule</span>
            <Clock size={18} className="shrink-0" />
          </div>
        </div>
      )}

      {/* Main Card Content with Touch Handlers */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          transform: `translateX(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
        className={`rounded-xl overflow-hidden transition-colors duration-500 ease-in-out border ${
          isRecentlyCompleted
            ? 'bg-emerald-900/50 border-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-[1.01] animate-pulse ring-2 ring-emerald-500/50'
            : isCompleted 
              ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
              : isSnoozed
              ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
              : 'bg-white/5 border-white/5 hover:bg-white/10'
        } `}>
      
      {/* SNOOZED MINIMALIST HEADER */}
      {isSnoozed && !isCompleted ? (
        <div className={`${isSupplement ? 'p-2.5 sm:px-3 sm:py-2.5' : 'p-3.5'} flex items-center justify-between gap-3 cursor-pointer`} onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <Clock size={13} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-amber-100/90 truncate">
                  {modality.display_name || modality.name}
                </h3>
                <span className="text-xs font-mono font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
                  ⏰ Snoozed
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, 'pending'); }}
              className="text-xs font-bold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
            >
              <RotateCcw size={12} />
              Undo
            </button>
            <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="text-gray-400 hover:text-white p-1">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      ) : isCompleted ? (
        <div className={`${isSupplement ? 'p-2.5 sm:px-3 sm:py-2.5' : 'p-3.5'} flex items-center justify-between gap-3 cursor-pointer`} onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <Check size={14} strokeWidth={3} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-white/90 line-through decoration-emerald-500/50 decoration-2 truncate">
                  {modality.display_name || modality.name}
                </h3>
                {completedSummaryText && (
                  <span 
                    className="text-xs font-mono font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full truncate max-w-[200px] sm:max-w-[340px] inline-block align-middle" 
                    title={completedSummaryText}
                  >
                    {completedSummaryText}
                  </span>
                )}
              </div>
              {completedDisplayContext && (
                <p className="text-[10px] text-emerald-400/80 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap font-medium">
                  <span>✓ {completedDisplayContext}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, 'pending'); }}
              className="text-xs text-levl-text-secondary hover:text-white px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors font-medium"
            >
              Undo
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} 
              className="text-gray-400 hover:text-white p-1"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      ) : (
        /* PENDING & OTHER STATUSES HEADER */
        <div className={`${isSupplement ? 'p-3 sm:px-4 sm:py-3 gap-1.5' : 'p-4 sm:p-5 gap-3'} flex flex-col relative cursor-pointer`} onClick={() => setExpanded(!expanded)}>
        
        {/* Under Protocol View: Show Time Block instead of redundant parent protocol. In Chronological view: Show Lineage Badges */}
        {(isProtocolGroupView || displayLineages.length > 0) && (
          <div className={`flex flex-wrap items-center ${isSupplement ? 'gap-1 mb-0.5' : 'gap-1.5 mb-1'}`}>
            {/* When under protocol view, display the correct time block here in the same smaller less prominent font */}
            {isProtocolGroupView && (
              <span
                className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border flex items-center gap-1 shadow-sm"
                style={{
                  backgroundColor: `${circadian?.skyColorHex || '#A855F7'}1A`, // 10% opacity
                  color: circadian?.skyColorHex || '#A855F7',
                  borderColor: `${circadian?.skyColorHex || '#A855F7'}33` // 20% opacity
                }}
                title={`Scheduled Time Block: ${timeBlockLabel}`}
              >
                <CircadianIcon size={9} className="shrink-0" />
                <span>{timeBlockLabel}</span>
              </span>
            )}

            {/* Other lineages (if any exist that are not the current umbrella protocol) */}
            {displayLineages.map((lineage, idx) => {
              const protoTargetId = (lineage as any).protocol_id || task.protocol_step?.protocol_id || lineage.protocol_name
              return (
                <Link 
                  key={idx}
                  href={`/protocols/${encodeURIComponent(protoTargetId)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border hover:brightness-125 hover:scale-105 transition-all cursor-pointer flex items-center gap-1 group"
                  style={{
                    backgroundColor: `${lineage.color_hex}1A`, // 10% opacity
                    color: lineage.color_hex,
                    borderColor: `${lineage.color_hex}33` // 20% opacity
                  }}
                  title={`View full ${lineage.protocol_name} protocol focus view`}
                >
                  <span>{lineage.protocol_name}</span>
                  <ExternalLink size={9} className="opacity-70 group-hover:opacity-100" />
                </Link>
              )
            })}
          </div>
        )}

        {/* Line 1: Full-Width Modality Name & Top-Right Expand Chevron */}
        <div className={`${isSupplement ? 'mb-1' : 'mb-2.5'} flex items-start justify-between gap-2`}>
          <h3 className="font-extrabold text-base sm:text-lg leading-tight text-white flex items-center gap-2 flex-wrap min-w-0 flex-1">
            {modality.display_name || modality.name}
            {isRecentlyCompleted && (
              <span className="text-xs font-extrabold text-emerald-300 bg-emerald-950/90 border border-emerald-500/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200 shadow-[0_0_12px_rgba(16,185,129,0.6)]">
                <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" />
                <span>Completed!</span>
              </span>
            )}
            {insightOverride?.patch_jsonb?.insight_type === 'hyper_responder' && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-levl-accent bg-levl-accent/10 border border-levl-accent/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                ⚡ Hyper-Responder
              </span>
            )}
            {insightOverride?.patch_jsonb?.insight_type === 'non_responder' && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                🧊 Non-Responder
              </span>
            )}
            {insightOverride?.patch_jsonb?.insight_type === 'negative_correlation' && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                ⚠️ Negative Impact
              </span>
            )}
          </h3>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer -mr-1 -mt-0.5"
            title={expanded ? "Collapse details" : "Expand details"}
            aria-label="Toggle card details"
          >
            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${expanded ? 'rotate-180 text-white' : ''}`} />
          </button>
        </div>

        {/* Line 2: Dosage + Badges (Left) & Details / Actions (Right) */}
        <div className={`flex items-center justify-between ${isSupplement ? 'gap-2 pt-0' : 'gap-3 pt-0.5'} flex-wrap`}>
          <div className={`flex flex-wrap items-center ${isSupplement ? 'gap-1' : 'gap-1.5'} flex-1 min-w-0`}>
            <DosageBadgeButton
              modality={modality}
              userProfile={userProfile}
              task={task}
              benchItem={benchItem}
              existingTiming={task.execution_details?.custom_timing || benchItem?.custom_timing}
              onOpenCustomizeOutcomes={() => setShowCustomizeOutcomesModal(true)}
              onSavePersonalization={async (customDose, customTiming, notes) => {
                const localUserId = getLocalUserId()
                const fromDate = task?.scheduled_date || format(new Date(), 'yyyy-MM-dd')
                await reconcileModalityScheduleAndFutureTasks(localUserId, modality.id, {
                  customDose,
                  customTiming,
                  notes,
                  fromDate,
                  protocolStepId: task?.protocol_step_id || undefined,
                  scheduleConfig: task?.execution_details?.schedule_config
                })
                window.location.reload()
              }}
              protocolContext={
                lineages.length > 0
                  ? lineages.map((l, i) => ({
                      protocolName: l.protocol_name,
                      colorHex: l.color_hex,
                      doseAmount: task.protocol_step?.dose_amount,
                      doseUnit: task.protocol_step?.dose_unit,
                      doseText: task.protocol_step?.dose_text
                    }))
                  : (task.protocol_step?.protocol ? {
                      protocolName: task.protocol_step.protocol.name,
                      colorHex: (task.protocol_step.protocol as any).color_hex || getColorForProtocol(task.protocol_step.protocol.name),
                      doseAmount: task.protocol_step?.dose_amount,
                      doseUnit: task.protocol_step?.dose_unit,
                      doseText: task.protocol_step?.dose_text
                    } : null)
              }
            />

            {isPeptide && (
              <span className="text-[10px] font-bold bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                <span>💉</span>
                <span>{task.protocol_step?.dose_amount === 2500 ? '100 Units (1.0 mL)' : task.protocol_step?.dose_amount === 100 || task.protocol_step?.dose_amount === 200 || task.protocol_step?.dose_amount === 250 ? '10 Units (0.10 mL)' : 'SubQ Syringe'}</span>
              </span>
            )}

            {task.execution_details?.split_dose_info ? (
              <span className="text-[10px] font-bold bg-purple-950/70 text-purple-200 border border-purple-500/40 px-2 py-0.5 rounded flex items-center gap-1.5 truncate max-w-[260px] sm:max-w-[380px]" title={`⚡ ${task.execution_details.split_dose_info} • ${cleanTimingBadge || customTimingBadge}`}>
                <span className="shrink-0 text-purple-300">⚡ {task.execution_details.split_dose_info}</span>
                {cleanTimingBadge && (
                  <>
                    <span className="text-purple-500/50 font-normal">•</span>
                    <User size={10} className="shrink-0 text-purple-300" />
                    <span className="truncate">{cleanTimingBadge}</span>
                  </>
                )}
              </span>
            ) : customTimingBadge ? (
              <>
                <span className="text-[10px] bg-levl-accent/20 text-white border border-levl-accent/40 px-1.5 py-0.5 rounded flex items-center gap-1 truncate max-w-[200px] sm:max-w-[320px]" title={customTimingBadge}>
                  <User size={10} className="shrink-0" /> ⏱️ <span className="truncate">{cleanTimingBadge || customTimingBadge}</span>
                </span>
                {baseTiming && (
                  <span className="text-[10px] bg-black/40 text-gray-500 line-through px-1.5 py-0.5 rounded border border-white/5 truncate max-w-[160px] sm:max-w-[220px]" title={baseTiming}>
                    ⏱️ {baseTiming}
                  </span>
                )}
              </>
            ) : (
              baseTiming && (
                <span className="text-[10px] bg-white/5 text-gray-300 px-1.5 py-0.5 rounded border border-white/5 truncate max-w-[200px] sm:max-w-[320px]" title={baseTiming}>
                  ⏱️ {baseTiming}
                </span>
              )
            )}

            {displayFreq && (
              <div className="flex gap-1.5">
                <span className="text-[10px] bg-white/5 text-gray-300 px-1.5 py-0.5 rounded border border-white/5">
                  🔄 {displayFreq}
                </span>
                {isFlexible && isMetOrDoneYesterday && (
                  <span className="text-[10px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded uppercase tracking-wide">
                    OPTIONAL TODAY
                  </span>
                )}
                {isFlexible && !isMetOrDoneYesterday && (
                  <span className="text-[10px] bg-levl-text-secondary/10 text-levl-text-secondary px-1.5 py-0.5 rounded border border-levl-text-secondary/20">
                    Flexible
                  </span>
                )}
              </div>
            )}
            {task.protocol_step?.optionality && task.protocol_step.optionality !== 'required' && (
              <span className="text-[10px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded uppercase tracking-wide">
                {task.protocol_step.optionality.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">

            {task.status === 'pending' ? (
              <div className="flex gap-1.5 items-center">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (onOpenRescheduleModal) onOpenRescheduleModal(task);
                    else setShowSkipReason(true); 
                  }}
                  disabled={isFutureTask}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-black/40 border border-white/10 text-levl-text-secondary hover:text-white hover:bg-white/10 hover:border-white/20 active:scale-90 active:opacity-80 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer shrink-0 touch-manipulation"
                  title="Snooze, reschedule, or skip session"
                >
                  <SkipForward size={13} className="ml-0.5" />
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (task.status === 'completed') {
                      onStatusChange(task.id, 'pending');
                    } else if (completionMode === 'fast') {
                      // FAST MODE: complete instantly without expanding inline outcome sliders
                      const effectiveDetails = (executionDetails && Object.keys(executionDetails).length > 0) ? executionDetails : task.execution_details
                      let metrics: any = undefined
                      if (effectiveDetails?.duration || effectiveDetails?.distance) {
                        metrics = {}
                        if (effectiveDetails.duration) metrics.duration_mins = parseFloat(effectiveDetails.duration)
                        if (effectiveDetails.distance) metrics.distance = parseFloat(effectiveDetails.distance)
                      }
                      if (isPeptide) {
                        const site = effectiveDetails?.injection_site || 'abdomen_lower_right'
                        saveInjectionSiteLog(modalityKey, site)
                      }
                      onStatusChange(task.id, 'completed', undefined, new Date().toISOString(), metrics, effectiveDetails);
                    } else {
                      // TRACKED OUTCOME MODE:
                      // If inline outcomes are ALREADY showing or if checkmark is clicked twice, complete immediately independent of how many outcomes have been tracked!
                      const now = Date.now();
                      const isDoubleTap = now - lastCheckClickTimeRef.current < 1500;
                      lastCheckClickTimeRef.current = now;

                      if (showInlineOutcomes || isDoubleTap) {
                        handleSaveInlineOutcomes(true);
                      } else if (currentRelevantOutcomes.length > 0) {
                        setExpanded(true);
                        setShowInlineOutcomes(true);
                        setActiveOutcomePhase('post');
                      } else {
                        const effectiveDetails = (executionDetails && Object.keys(executionDetails).length > 0) ? executionDetails : task.execution_details
                        let metrics: any = undefined
                        if (effectiveDetails?.duration || effectiveDetails?.distance) {
                          metrics = {}
                          if (effectiveDetails.duration) metrics.duration_mins = parseFloat(effectiveDetails.duration)
                          if (effectiveDetails.distance) metrics.distance = parseFloat(effectiveDetails.distance)
                        }
                        if (isPeptide) {
                          const site = effectiveDetails?.injection_site || 'abdomen_lower_right'
                          saveInjectionSiteLog(modalityKey, site)
                        }
                        onStatusChange(task.id, 'completed', undefined, new Date().toISOString(), metrics, effectiveDetails);
                      }
                    }
                  }}
                  disabled={isFutureTask}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 active:opacity-85 touch-manipulation disabled:opacity-20 disabled:cursor-not-allowed ${
                    isRecentlyCompleted || (task.status as string) === 'completed'
                      ? 'bg-emerald-500 text-slate-950 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.9)]'
                      : showInlineOutcomes
                      ? 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/50 hover:bg-emerald-500 hover:text-black animate-pulse'
                      : 'bg-levl-accent/20 border border-levl-accent text-levl-accent hover:bg-levl-accent hover:text-white'
                  }`}
                  title={isFutureTask ? "Cannot complete future tasks" : completionMode === 'fast' ? "Complete modality instantly (Fast Mode)" : showInlineOutcomes ? "Click again to complete session" : "Click once to track outcomes, or click twice to complete"}
                >
                  <Check size={14} strokeWidth={isRecentlyCompleted || (task.status as string) === 'completed' ? 3 : 2} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold uppercase tracking-wider text-levl-text-secondary">
                  {task.id.startsWith('habit_task_') 
                    ? (task.status === 'completed' ? '✓ Habit (Default)' : 'Skipped Today') 
                    : task.status}
                </span>
                {task.status_reason && (
                  <span className="text-[10px] text-gray-500 mt-0.5">Reason: {task.status_reason}</span>
                )}
                {task.id.startsWith('habit_task_') ? (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onStatusChange(task.id, task.status === 'completed' ? 'not_today' : 'completed'); 
                    }} 
                    className={`text-[10px] font-bold px-2.5 py-1 rounded border transition-all mt-1 cursor-pointer ${
                      task.status === 'completed'
                        ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                    }`}
                  >
                    {task.status === 'completed' ? 'Skip Today' : 'Mark Done'}
                  </button>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, 'pending'); }} className="text-[10px] text-levl-accent mt-1 underline">
                    Undo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Live Warning Example */}
        {task.protocol_step?.safety_notes && (
          <div className="mt-2 text-[10px] text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded flex gap-1 items-start">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span>{task.protocol_step.safety_notes}</span>
          </div>
        )}

        {/* Skip Reason Input (Inline) */}
        {showSkipReason && (
          <div className="mt-3 bg-black/40 p-3 rounded-lg border border-white/10 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <p className="text-xs text-gray-300 mb-2">Why are you skipping?</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={skipReason}
                onChange={e => setSkipReason(e.target.value)}
                placeholder="e.g. No access today"
                className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-levl-accent"
                autoFocus
              />
              <button 
                onClick={handleSkipSubmit}
                className="bg-white/10 text-white px-3 py-1 rounded text-xs hover:bg-white/20 transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        )}
      </div>
    )}

      {/* Expanded view details */}
      {expanded && !showSkipReason && !showEliminateReason && (
        <div className="px-4 pb-4 pt-2 border-t border-white/5 animate-in slide-in-from-top-2">
          
          {/* SKIPPED REASON BANNER */}
          {(task.status === 'skipped' || task.status === 'not_today' || task.status_reason || (task as any).ai_coach_reason) && (
            <div className="mb-4 p-3.5 bg-slate-900/80 border border-slate-500/30 rounded-xl text-xs space-y-1 animate-in fade-in shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  {(task as any).ai_coach_reason ? <Sparkles size={14} className="text-purple-400" /> : <Info size={14} className="text-slate-400" />}
                  {(task as any).ai_coach_reason ? 'AI Coach Derived Reason' : 'Skipped Reason'}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                  {task.status === 'not_today' ? 'Skipped Today' : task.status}
                </span>
              </div>
              <p className="text-slate-200 text-xs font-medium leading-relaxed pt-0.5">
                {task.status_reason || (task as any).ai_coach_reason || (task.status === 'not_today' ? 'Skipped by user for today' : 'Modality not active for today')}
              </p>
            </div>
          )}

          {insightOverride && (
            <div className={`mb-4 p-3 rounded-lg border text-xs leading-relaxed ${
              insightOverride.patch_jsonb.insight_type === 'hyper_responder' ? 'bg-levl-accent/5 border-levl-accent/20 text-levl-accent' :
              insightOverride.patch_jsonb.insight_type === 'negative_correlation' ? 'bg-red-500/5 border-red-500/20 text-red-400' :
              'bg-white/5 border-white/10 text-gray-300'
            }`}>
              <div className="font-bold uppercase tracking-wider text-[10px] mb-1 opacity-70 flex items-center gap-1">
                <Microscope size={12} /> N-of-1 Biology Insight
              </div>
              {insightOverride.patch_jsonb.text}
              <div className="text-[9px] mt-2 opacity-50">
                Confidence: {insightOverride.confidence}% • Based on N={insightOverride.patch_jsonb.sampleSize} days of your tracking
              </div>
            </div>
          )}

          {!isJustCompletedInline && (
            <p className="text-xs text-gray-400 mb-3">{modality.brief_description}</p>
          )}

          {/* BASELINE PRE-SESSION TRIGGER (Placed directly above execution logger) */}
          {task.status === 'pending' && !isFutureTask && !showInlineOutcomes && renderBaselineTrigger()}

          {/* PENDING PRECISION EXECUTION LOGGER DIRECTLY ON EXPANDED CARD */}
          {task.status === 'pending' && !isFutureTask && hasPrecisionLogUI && !showInlineOutcomes && (
            isPrecisionLogExpanded ? (
              <div className="mb-4 space-y-3">
                <div className="p-3.5 bg-slate-950/90 border border-cyan-500/30 rounded-xl space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                      <Activity size={14} className="text-cyan-400" /> Precision Execution Log
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {modality.display_name || modality.name}
                      </span>
                      {!isPrecisionLogOpenByDefault && (
                        <button
                          type="button"
                          onClick={() => setIsPrecisionLogExpanded(false)}
                          className="text-[10px] font-bold text-slate-400 hover:text-white px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer border border-white/10"
                        >
                          <span>Hide Details</span>
                          <ChevronUp size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Render the specialized UI */}
                  {isThermal && <ThermalExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isBreathwork && <BreathworkExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isCardio && (
                    <CardioExecutionLog 
                      value={executionDetails} 
                      onChange={setExecutionDetails} 
                      lockedCardioType={lockedCardioType}
                      specializedTraits={specializedTraits}
                    />
                  )}
                  {isStrength && (
                    <StrengthExecutionLog 
                      value={executionDetails} 
                      onChange={setExecutionDetails} 
                      lockedExerciseName={lockedExerciseName}
                      specializedTraits={specializedTraits}
                    />
                  )}
                  {isFasting && (
                    <FastingExecutionLog 
                      value={executionDetails} 
                      onChange={setExecutionDetails} 
                      isMultiDay={
                        modalityKey.includes('16:8') || modalityKey.includes('18:6') || modalityKey.includes('time-restricted') || modalityKey.includes('trf')
                          ? false 
                          : true
                      }
                    />
                  )}
                  {isNutritionMacro && <NutritionMacroExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isRedLight && <RedLightExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isCGM && <CGMExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isBlueLightDimming && <BlueLightDimmingExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isSunlight && <SunlightCircadianExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isSleepHygiene && <SleepHygieneExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isHydration && <HydrationElectrolyteExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isPhlebotomy && <BiometricPhlebotomyExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isPeptide && (
                    <PeptideExecutionLog 
                      value={executionDetails} 
                      onChange={setExecutionDetails} 
                      modality={modality} 
                      modalityKey={modalityKey} 
                      defaultDoseMcg={task.protocol_step?.dose_amount || 250} 
                    />
                  )}
                  {isSupplement && <SupplementExecutionLog value={executionDetails} onChange={setExecutionDetails} />}

                  {/* COMPLETE & LOG SESSION ACTION BUTTON */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-emerald-500/20 flex-wrap">
                    <div className="hidden sm:flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                      <Sparkles size={14} className="text-emerald-400 shrink-0" />
                      <span>Log precision metrics &amp; launch outcome tracking</span>
                    </div>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={async (e) => {
                        e.stopPropagation()
                        setIsProcessing(true)
                        try {
                          const baseDateStr = task.scheduled_date
                          let logDate = new Date()
                          if (baseDateStr) {
                            const [y, m, d] = baseDateStr.split('-').map(Number)
                            if (y && m && d) {
                              logDate = new Date(y, m - 1, d)
                            }
                          }
                          const now = new Date()
                          logDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0)

                          let metrics: any = undefined
                          if (executionDetails?.duration || executionDetails?.distance) {
                            metrics = {}
                            if (executionDetails.duration) metrics.duration_mins = parseFloat(executionDetails.duration)
                            if (executionDetails.distance) metrics.distance = parseFloat(executionDetails.distance)
                          }
                          if (isPeptide && executionDetails?.injection_site) {
                            saveInjectionSiteLog(modalityKey, executionDetails.injection_site)
                          }
                          await updateTaskExecutionDetails(task.id, executionDetails)
                          
                          if (currentRelevantOutcomes.length > 0) {
                            setShowInlineOutcomes(true)
                            setActiveOutcomePhase('post')
                          } else {
                            onStatusChange(task.id, 'completed', undefined, logDate.toISOString(), metrics, executionDetails)
                          }
                        } catch(err) {
                          console.error('Error saving execution details:', err)
                        } finally {
                          setIsProcessing(false)
                        }
                      }}
                      className="w-full sm:w-auto h-10 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <CheckCircle2 size={16} strokeWidth={2.5} />
                      <span>Complete Session &amp; Rate Outcomes</span>
                      <ChevronRight size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* COLLAPSED PRECISION LOG PANEL: Compact quick action bar with expand toggle */
              <div className="mb-4 space-y-2">
                <div className="p-3 bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 transition-all">
                  <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                    <span className="font-medium text-slate-400">Target Dose:</span>
                    <span className="font-bold text-white font-mono bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/10">
                      {customDose || modality.dose_or_exposure || 'Standard Protocol Session'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsPrecisionLogExpanded(true)}
                      className="flex-1 sm:flex-initial text-[11px] font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Activity size={13} className="text-cyan-400" />
                      <span>+ Log Specific Details</span>
                      <ChevronDown size={12} className="text-slate-400" />
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={async (e) => {
                        e.stopPropagation()
                        setIsProcessing(true)
                        try {
                          const baseDateStr = task.scheduled_date
                          let logDate = new Date()
                          if (baseDateStr) {
                            const [y, m, d] = baseDateStr.split('-').map(Number)
                            if (y && m && d) {
                              logDate = new Date(y, m - 1, d)
                            }
                          }
                          const now = new Date()
                          logDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0)

                          if (currentRelevantOutcomes.length > 0) {
                            setShowInlineOutcomes(true)
                            setActiveOutcomePhase('post')
                          } else {
                            onStatusChange(task.id, 'completed', undefined, logDate.toISOString(), undefined, executionDetails)
                          }
                        } catch(err) {
                          console.error('Error completing session:', err)
                        } finally {
                          setIsProcessing(false)
                        }
                      }}
                      className="flex-1 sm:flex-initial h-9 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_16px_rgba(16,185,129,0.35)] transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <CheckCircle2 size={15} strokeWidth={2.5} />
                      <span>{currentRelevantOutcomes.length > 0 ? 'Complete & Rate' : 'Complete (1-Click)'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
          
          {/* COMPLETED DOSAGE & EXECUTION SUMMARY BANNER */}
          {task.status === 'completed' && (
            <div className="mb-4 space-y-2">
              {/* Actual Completed Dose + Prescribed Target Dose */}
              <div className="p-3.5 bg-black/40 rounded-xl border border-emerald-500/30 flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs sm:text-sm">
                    <Microscope size={15} className="text-emerald-400 shrink-0" />
                    <span>Completed Dose: {completedSummaryText || modality.dose_or_exposure || 'Standard Protocol Session'}</span>
                  </div>
                  {modality.dose_or_exposure && completedSummaryText !== modality.dose_or_exposure && (
                    <div className="text-[11px] text-slate-400 font-mono pl-5">
                      Prescribed Target: {modality.dose_or_exposure} {modality.timing_summary ? `(${modality.timing_summary})` : ''}
                    </div>
                  )}
                </div>
                {hasPrecisionLogUI && (
                  <button
                    type="button"
                    onClick={() => setIsEditingExecution(!isEditingExecution)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border ${
                      isEditingExecution 
                        ? 'bg-purple-600/30 text-purple-300 border-purple-500/40' 
                        : 'text-gray-300 hover:text-white bg-white/10 hover:bg-white/15 border-white/15'
                    }`}
                  >
                    <Edit3 size={12} /> {isEditingExecution ? 'Cancel Edit' : (task.execution_details ? 'Edit Precision Metrics' : '+ Log Precision Metrics')}
                  </button>
                )}
              </div>

              {/* Custom Precision Execution Summary (When not editing) */}
              {task.execution_details && !isEditingExecution && (
                <CompletedExecutionSummary 
                  modalityType={modality.modality_type || 'default'}
                  loggingType={modality.logging_type || 'boolean'} 
                  details={task.execution_details} 
                />
              )}

              {/* INLINE PRECISION METRICS EDITOR (When isEditingExecution is true) */}
              {isEditingExecution && hasPrecisionLogUI && (
                <div className="p-4 bg-slate-950/90 border border-purple-500/40 rounded-xl space-y-4 animate-in fade-in shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                      <Edit3 size={14} className="text-purple-400" /> Edit Precision Execution Metrics
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {modality.display_name || modality.name}
                    </span>
                  </div>

                  {/* Render the specialized UI */}
                  {isThermal && <ThermalExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isBreathwork && <BreathworkExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isCardio && (
                    <CardioExecutionLog 
                      value={executionDetails} 
                      onChange={setExecutionDetails} 
                      lockedCardioType={lockedCardioType}
                      specializedTraits={specializedTraits}
                    />
                  )}
                  {isStrength && (
                    <StrengthExecutionLog 
                      value={executionDetails} 
                      onChange={setExecutionDetails} 
                      lockedExerciseName={lockedExerciseName}
                      specializedTraits={specializedTraits}
                    />
                  )}
                  {isFasting && (
                    <FastingExecutionLog 
                      value={executionDetails} 
                      onChange={setExecutionDetails} 
                      isMultiDay={
                        (modality.name || '').toLowerCase().includes('16:8') || 
                        (modality.name || '').toLowerCase().includes('18:6') || 
                        (modality.name || '').toLowerCase().includes('time-restricted') || 
                        (modality.name || '').toLowerCase().includes('trf')
                          ? false 
                          : true
                      }
                    />
                  )}
                  {isNutritionMacro && <NutritionMacroExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isRedLight && <RedLightExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isCGM && <CGMExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isBlueLightDimming && <BlueLightDimmingExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isSunlight && <SunlightCircadianExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isSleepHygiene && <SleepHygieneExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isHydration && <HydrationElectrolyteExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isPhlebotomy && <BiometricPhlebotomyExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isPeptide && (
                    <PeptideExecutionLog 
                      value={executionDetails} 
                      onChange={setExecutionDetails} 
                      modality={modality} 
                      modalityKey={modalityKey} 
                      defaultDoseMcg={task.protocol_step?.dose_amount || 250} 
                    />
                  )}
                  {isSupplement && <SupplementExecutionLog value={executionDetails} onChange={setExecutionDetails} />}

                  {/* Save / Cancel Action Bar */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsEditingExecution(false)}
                      className="px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer border border-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={async () => {
                        setIsProcessing(true)
                        try {
                          let metrics: any = undefined
                          if (executionDetails?.duration || executionDetails?.distance) {
                            metrics = {}
                            if (executionDetails.duration) metrics.duration_mins = parseFloat(executionDetails.duration)
                            if (executionDetails.distance) metrics.distance = parseFloat(executionDetails.distance)
                          }
                          if (isPeptide && executionDetails?.injection_site) {
                            saveInjectionSiteLog(modalityKey, executionDetails.injection_site)
                          }
                          await updateTaskExecutionDetails(task.id, executionDetails)
                          const logDate = task.completed_at || new Date().toISOString()
                          onStatusChange(task.id, 'completed', undefined, logDate, metrics, executionDetails)
                          setIsEditingExecution(false)
                        } catch(err) {
                          console.error('Error saving updated metrics:', err)
                        } finally {
                          setIsProcessing(false)
                        }
                      }}
                      className="px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 rounded-lg shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} /> Save Precision Metrics
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* UNIFIED INLINE OUTCOME TRACKER PANEL */}
          {showInlineOutcomes && currentRelevantOutcomes.length > 0 && (
            <div className="mb-4 bg-black/60 border border-purple-500/30 rounded-xl p-4 space-y-4 animate-in fade-in shadow-xl">
              
              {/* Header Bar: Title & Customize Tracked Outcomes */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                    <Activity size={15} className="text-purple-400" /> Outcome Observations
                  </div>
                  {!hasPreLoggableOutcomes && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                      Session Evaluation
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowCustomizeOutcomesModal(true)}
                  className="text-[11px] font-bold text-gray-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders size={13} /> Edit Tracked Outcomes
                </button>
              </div>

              {/* Controls Bar: Full Width Phase Tabs (Split 50/50) & Full Width Completed Time Picker */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
                {/* Phase Tabs: 50/50 full width on mobile, auto width on desktop */}
                {hasPreLoggableOutcomes && (
                  <div className="w-full sm:w-auto grid grid-cols-2 gap-1 bg-black/60 p-1 rounded-xl border border-white/15">
                    <button
                      type="button"
                      onClick={() => setActiveOutcomePhase('pre')}
                      className={`w-full py-2 sm:py-1 px-3.5 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${activeOutcomePhase === 'pre' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                      Before Modality
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveOutcomePhase('post')}
                      className={`w-full py-2 sm:py-1 px-3.5 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${activeOutcomePhase === 'post' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                      After Modality
                    </button>
                  </div>
                )}

                {/* Time Completed: Full width on mobile, auto on desktop */}
                {activeOutcomePhase === 'post' && (
                  <div className="w-full sm:w-auto flex items-center justify-between gap-3 bg-black/60 border border-emerald-500/40 rounded-xl px-3.5 py-1.5 text-sm font-semibold shadow-sm">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date()
                          const hh = String(now.getHours()).padStart(2, '0')
                          const mm = String(now.getMinutes()).padStart(2, '0')
                          const nowTime = `${hh}:${mm}`
                          const baseDateStr = task.scheduled_date
                          let d = new Date()
                          if (baseDateStr) {
                            const [y, mon, day] = baseDateStr.split('-').map(Number)
                            if (y && mon && day) {
                              d = new Date(y, mon - 1, day)
                            }
                          }
                          d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0)
                          setCompletedTime(nowTime)
                          if (task.status === 'completed') {
                            onStatusChange(task.id, 'completed', undefined, d.toISOString(), undefined, executionDetails)
                          }
                        }}
                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                        title="Click to reset completion time to current time (NOW)"
                      >
                        <Clock size={15} />
                        <span className="text-xs uppercase font-bold text-emerald-400/90 underline decoration-dotted">Now</span>
                      </button>
                      <span className="text-emerald-200 font-bold text-xs">Completed:</span>
                    </div>
                    <TimePickerWithAmPmToggle
                      value={completedTime}
                      onChange={(new24) => setCompletedTime(new24)}
                      onCommit={(new24) => {
                        if (task.status === 'completed' && new24) {
                          const [h, m] = new24.split(':')
                          const baseDateStr = task.scheduled_date
                          let d = new Date()
                          if (baseDateStr) {
                            const [y, mon, day] = baseDateStr.split('-').map(Number)
                            if (y && mon && day) {
                              d = new Date(y, mon - 1, day)
                            }
                          }
                          d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0)
                          onStatusChange(task.id, 'completed', undefined, d.toISOString(), undefined, executionDetails)
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Peak Onset & Best Time to Record Outcomes Guidance Banner */}
              {(() => {
                const guidance = getPeakOnsetGuidance(modality)
                return (
                  <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-2.5 text-xs text-slate-300 backdrop-blur-sm shadow-sm">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock size={13} />
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-white">Best time to record outcomes:</span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30">
                          {guidance.bestTimeToLog}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {guidance.subtitle}
                      </p>
                    </div>
                  </div>
                )
              })()}

              {/* Precision Execution Log within Outcome Tracker */}
              {activeOutcomePhase === 'post' && hasPrecisionLogUI && (
                <div className="p-3.5 bg-slate-950/90 border border-cyan-500/30 rounded-xl space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                      <Activity size={14} className="text-cyan-400" /> Session Execution Numbers
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {modality.display_name || modality.name}
                    </span>
                  </div>

                  {isThermal && <ThermalExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isBreathwork && <BreathworkExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isCardio && (
                    <CardioExecutionLog 
                      value={executionDetails} 
                      onChange={setExecutionDetails} 
                      lockedCardioType={lockedCardioType}
                      specializedTraits={specializedTraits}
                    />
                  )}
                  {isStrength && (
                    <StrengthExecutionLog 
                      value={executionDetails} 
                      onChange={setExecutionDetails} 
                      lockedExerciseName={lockedExerciseName}
                      specializedTraits={specializedTraits}
                    />
                  )}
                  {isFasting && (
                    <FastingExecutionLog 
                      value={executionDetails} 
                      onChange={setExecutionDetails} 
                      isMultiDay={
                        modalityKey.includes('16:8') || modalityKey.includes('18:6') || modalityKey.includes('time-restricted') || modalityKey.includes('trf')
                          ? false 
                          : true
                      }
                    />
                  )}
                  {isNutritionMacro && <NutritionMacroExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isRedLight && <RedLightExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isCGM && <CGMExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isBlueLightDimming && <BlueLightDimmingExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isSunlight && <SunlightCircadianExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isSleepHygiene && <SleepHygieneExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isHydration && <HydrationElectrolyteExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isPhlebotomy && <BiometricPhlebotomyExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                  {isPeptide && (
                    <PeptideExecutionLog 
                      value={executionDetails} 
                      onChange={setExecutionDetails} 
                      modality={modality} 
                      modalityKey={modalityKey} 
                      defaultDoseMcg={task.protocol_step?.dose_amount || 250} 
                    />
                  )}
                  {isSupplement && <SupplementExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                </div>
              )}

              {/* Sliders List */}
              <div className="space-y-4">
                {visibleOutcomes.map(outcome => {
                  const recentSnap = getRecentOutcomeSnapshot(outcome.id, wellbeingCheckin, (taskObs as any) || [], 2, recentTasks)
                  const recentDefault = recentSnap.isRecent ? recentSnap.value : 5

                  const preVal = inlinePreValues[outcome.id] ?? baselineOutcomesMap[outcome.id]
                  const postVal = inlinePostValues[outcome.id]
                  const baselineVal = baselineOutcomesMap[outcome.id] ?? inlinePreValues[outcome.id]
                  const effectiveBaseline = baselineVal !== undefined ? baselineVal : recentDefault

                  const isPreTouched = touchedPreOutcomes[outcome.id] || baselineOutcomesMap[outcome.id] !== undefined
                  const isPostTouched = touchedPostOutcomes[outcome.id]

                  const isCurrentPhaseTouched = activeOutcomePhase === 'pre' ? isPreTouched : isPostTouched
                  const currentVal = activeOutcomePhase === 'pre' ? (preVal ?? effectiveBaseline) : (postVal ?? effectiveBaseline)

                  const preColor = getOutcomeColorConfig(effectiveBaseline, outcome.directionality)
                  const postColor = getOutcomeColorConfig(currentVal, outcome.directionality)
                  const colorCfg = isCurrentPhaseTouched ? postColor : getNeutralOutcomeColorConfig()
                  const isLowerBetter = outcome.directionality === 'lower_is_better'
                  const userPriority = userPriorityMap.get(outcome.id)
                  const netShift = currentVal - effectiveBaseline
                  const canPreLog = isPreLoggableOutcome(outcome.id)
                  const phaseType = getOutcomePhaseType(outcome.id)

                  return (
                    <div key={outcome.id} className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-white font-bold">{outcome.name}</span>
                          {activeOutcomePhase === 'pre' && !isPreTouched && recentSnap.isRecent && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border bg-amber-500/20 border-amber-500/40 text-amber-300 flex items-center gap-0.5" title={`Defaulted to your most recent rating (${recentSnap.source === 'anytime_checkin' ? 'Anytime Check-in' : recentSnap.source === 'morning_checkin' ? 'Morning Check-in' : 'Recent Modality'}) from ${recentSnap.timeAgoMinutes ?? 0}m ago`}>
                              ⚡ Recent ({recentSnap.timeAgoMinutes ?? 0}m ago)
                            </span>
                          )}
                          
                          {activeOutcomePhase === 'post' && (
                            <div className="flex items-center gap-1">
                              {canPreLog ? (
                                <>
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-0.5 ${preColor.badgeBg}`}>
                                    ⚡ Baseline: {effectiveBaseline}/10
                                  </span>
                                  {isPostTouched && (
                                    <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded border ${netShift >= 0 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-red-500/20 border-red-500/40 text-red-300'}`}>
                                      {netShift >= 0 ? `+${netShift}` : netShift} Shift
                                    </span>
                                  )}
                                </>
                              ) : phaseType === 'intra_session' ? (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-blue-500/20 border-blue-500/40 text-blue-300">
                                  ⚡ Intra-Session Performance
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-purple-500/20 border-purple-500/40 text-purple-300">
                                  ⚡ Point-in-Time Rating
                                </span>
                              )}
                            </div>
                          )}

                          {recentSnap.isRecent && !isCurrentPhaseTouched && (
                            <span className="text-[8px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-mono font-medium">
                              Recent ({recentSnap.timeAgoMinutes}m ago)
                            </span>
                          )}

                          {userPriority && (
                            <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Star size={9} fill="currentColor" /> {userPriority.label}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (activeOutcomePhase === 'pre') {
                              const nextTouched = !touchedPreOutcomes[outcome.id]
                              setTouchedPreOutcomes(prev => ({ ...prev, [outcome.id]: nextTouched }))
                              if (nextTouched && inlinePreValues[outcome.id] === undefined) {
                                setInlinePreValues(prev => ({ ...prev, [outcome.id]: currentVal }))
                              }
                            } else {
                              const nextTouched = !touchedPostOutcomes[outcome.id]
                              setTouchedPostOutcomes(prev => ({ ...prev, [outcome.id]: nextTouched }))
                              if (nextTouched && inlinePostValues[outcome.id] === undefined) {
                                setInlinePostValues(prev => ({ ...prev, [outcome.id]: currentVal }))
                              }
                            }
                          }}
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all group"
                          title="Click to confirm this value without sliding"
                        >
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${isCurrentPhaseTouched ? colorCfg.badgeBg : 'bg-white/5 border-white/15 text-slate-400 group-hover:border-white/30'}`}>
                            {isCurrentPhaseTouched ? colorCfg.qualityLabel : 'Unconfirmed (Tap)'}
                          </span>
                          <span className={`font-mono font-bold text-xs ${isCurrentPhaseTouched ? colorCfg.textColor : 'text-slate-400'}`}>
                            {currentVal}/10
                          </span>
                        </button>
                      </div>

                      {/* Visual Gradient Track showing exact Pre to Post Outcome Shift (ONLY for pre-loggable outcomes) */}
                      {activeOutcomePhase === 'post' && canPreLog && (
                        <div className="relative w-full h-2.5 bg-white/10 rounded-full overflow-hidden my-1 shadow-inner">
                          <div 
                            className="absolute h-full rounded-full transition-all shadow-md"
                            style={{
                              left: `${Math.min(effectiveBaseline, currentVal) * 10}%`,
                              width: `${Math.max(2, Math.abs(currentVal - effectiveBaseline) * 10)}%`,
                              background: currentVal >= effectiveBaseline 
                                ? `linear-gradient(to right, ${preColor.accentHex}, ${postColor.accentHex})`
                                : `linear-gradient(to right, ${postColor.accentHex}, ${preColor.accentHex})`
                            }}
                          />
                          <div 
                            className="absolute top-0 bottom-0 w-1 rounded-full z-10 shadow-[0_0_8px_rgba(255,255,255,0.7)] border-r border-black/40"
                            style={{ 
                              left: `calc(${effectiveBaseline * 10}% - 2px)`,
                              backgroundColor: preColor.accentHex 
                            }}
                            title={`Baseline: ${effectiveBaseline}/10 (${preColor.qualityLabel})`}
                          />
                        </div>
                      )}
                      
                      <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        value={currentVal} 
                        onChange={(e) => {
                          const num = parseInt(e.target.value)
                          if (activeOutcomePhase === 'pre') {
                            setInlinePreValues(prev => ({ ...prev, [outcome.id]: num }))
                            setTouchedPreOutcomes(prev => ({ ...prev, [outcome.id]: true }))
                          } else {
                            setInlinePostValues(prev => ({ ...prev, [outcome.id]: num }))
                            setTouchedPostOutcomes(prev => ({ ...prev, [outcome.id]: true }))
                          }
                        }} 
                        onPointerDown={() => {
                          if (activeOutcomePhase === 'pre') {
                            if (!touchedPreOutcomes[outcome.id]) {
                              setTouchedPreOutcomes(prev => ({ ...prev, [outcome.id]: true }))
                              if (inlinePreValues[outcome.id] === undefined) {
                                setInlinePreValues(prev => ({ ...prev, [outcome.id]: currentVal }))
                              }
                            }
                          } else {
                            if (!touchedPostOutcomes[outcome.id]) {
                              setTouchedPostOutcomes(prev => ({ ...prev, [outcome.id]: true }))
                              if (inlinePostValues[outcome.id] === undefined) {
                                setInlinePostValues(prev => ({ ...prev, [outcome.id]: currentVal }))
                              }
                            }
                          }
                        }}
                        onClick={() => {
                          if (activeOutcomePhase === 'pre') {
                            if (!touchedPreOutcomes[outcome.id]) {
                              setTouchedPreOutcomes(prev => ({ ...prev, [outcome.id]: true }))
                              if (inlinePreValues[outcome.id] === undefined) {
                                setInlinePreValues(prev => ({ ...prev, [outcome.id]: currentVal }))
                              }
                            }
                          } else {
                            if (!touchedPostOutcomes[outcome.id]) {
                              setTouchedPostOutcomes(prev => ({ ...prev, [outcome.id]: true }))
                              if (inlinePostValues[outcome.id] === undefined) {
                                setInlinePostValues(prev => ({ ...prev, [outcome.id]: currentVal }))
                              }
                            }
                          }
                        }}
                        className="w-full cursor-pointer touch-manipulation" 
                        style={{ accentColor: colorCfg.accentHex }}
                        title={isCurrentPhaseTouched ? `Rating: ${currentVal}/10 (Confirmed)` : 'Click dot to confirm 5/10, or drag to adjust'}
                      />
                      
                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-gray-400">
                        <span className={isLowerBetter ? 'text-emerald-400' : 'text-red-400'}>
                          0: {isLowerBetter ? 'Best (None)' : 'Poor (Low)'}
                        </span>
                        <span className={isLowerBetter ? 'text-red-400' : 'text-emerald-400'}>
                          10: {isLowerBetter ? 'Worst (Severe)' : 'Peak (Best)'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Minimalist Full-Width Optional Notes Input */}
              <div className="pt-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                  Optional Notes
                </label>
                <input
                  type="text"
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="e.g. Felt extra calm after 15m session, water at 55°F"
                  className="w-full bg-black/50 border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleSaveInlineOutcomes(activeOutcomePhase !== 'pre')}
                  disabled={isSavingOutcomes}
                  className="flex-1 px-3 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center text-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Check size={15} className="shrink-0" />
                  <span className="text-center leading-snug">{isSavingOutcomes ? (activeOutcomePhase === 'pre' ? 'Saving Baseline...' : 'Saving...') : (activeOutcomePhase === 'pre' ? 'Save Baseline Observations' : 'Save Observations & Complete')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowInlineOutcomes(false)}
                  className="px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-gray-200 hover:text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  Close
                </button>
              </div>

            </div>
          )}

          {/* INLINE OUTCOME TRACKER FOR COMPLETED TASK */}
          {task.status === 'completed' && currentRelevantOutcomes.length > 0 && (
            <div className="mb-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 space-y-4 animate-in fade-in shadow-lg shadow-emerald-500/5">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                  <Activity size={15} /> {isJustCompletedInline ? 'How Do You Feel?' : 'Outcome Observations'}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Larger, spacious Completed Time Field */}
                  <div className="flex items-center gap-2 bg-black/60 border border-emerald-500/40 rounded-xl px-3 py-1.5 text-sm font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date()
                        const hh = String(now.getHours()).padStart(2, '0')
                        const mm = String(now.getMinutes()).padStart(2, '0')
                        const nowTime = `${hh}:${mm}`
                        const baseDateStr = task.scheduled_date
                        let d = new Date()
                        if (baseDateStr) {
                          const [y, mon, day] = baseDateStr.split('-').map(Number)
                          if (y && mon && day) {
                            d = new Date(y, mon - 1, day)
                          }
                        }
                        d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0)
                        setCompletedTime(nowTime)
                        if (task.status === 'completed') {
                          onStatusChange(task.id, 'completed', undefined, d.toISOString(), undefined, executionDetails)
                        }
                      }}
                      className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                      title="Click to reset completion time to current time (NOW)"
                    >
                      <Clock size={16} />
                      <span className="text-xs uppercase font-bold text-emerald-400/90 underline decoration-dotted">Now</span>
                    </button>
                    <span className="text-emerald-200 font-bold text-xs">Completed:</span>
                    <TimePickerWithAmPmToggle
                      value={completedTime}
                      onChange={(new24) => setCompletedTime(new24)}
                      onCommit={(new24) => {
                        if (task.status === 'completed' && new24) {
                          const [h, m] = new24.split(':')
                          const baseDateStr = task.scheduled_date
                          let d = new Date()
                          if (baseDateStr) {
                            const [y, mon, day] = baseDateStr.split('-').map(Number)
                            if (y && mon && day) {
                              d = new Date(y, mon - 1, day)
                            }
                          }
                          d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0)
                          onStatusChange(task.id, 'completed', undefined, d.toISOString(), undefined, executionDetails)
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowCustomizeOutcomesModal(true)}
                      className="text-xs font-bold text-gray-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sliders size={14} /> Edit Tracked Outcomes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingOutcomes(!isEditingOutcomes)}
                      className="text-xs font-bold text-emerald-300 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Edit3 size={14} /> {isEditingOutcomes ? 'Cancel Editing' : '✏ Edit Observations'}
                    </button>
                  </div>

                  {peakWindowText && (
                    <span className="text-xs font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1 font-semibold">
                      {peakWindowText}
                    </span>
                  )}
                </div>
              </div>

              {(() => {
                const hasPostObs = taskObs.some(o => o.phase === 'post') || Object.keys(touchedPostOutcomes).some(k => touchedPostOutcomes[k])
                const showInteractiveEdit = isEditingOutcomes || !hasPostObs

                return showInteractiveEdit ? (
                /* EDITING VIEW IN COMPLETED MODALITIES SECTION */
                <div className="space-y-4 bg-black/40 p-4 rounded-xl border border-emerald-500/30">
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Log / Edit After Ratings</span>
                  </h4>
                  {currentRelevantOutcomes.map(outcome => {
                    const preVal = editPreValues[outcome.id] ?? inlinePreValues[outcome.id] ?? baselineOutcomesMap[outcome.id]
                    const postVal = editPostValues[outcome.id] ?? inlinePostValues[outcome.id]

                    const isPreRecorded = preVal !== undefined
                    const isPostRecorded = postVal !== undefined

                    const displayPreVal = preVal ?? 5
                    const displayPostVal = postVal ?? 5

                    const preCfg = isPreRecorded ? getOutcomeColorConfig(displayPreVal, outcome.directionality) : getNeutralOutcomeColorConfig()
                    const postCfg = isPostRecorded ? getOutcomeColorConfig(displayPostVal, outcome.directionality) : getNeutralOutcomeColorConfig()

                    return (
                      <div key={outcome.id} className="bg-black/60 p-3.5 rounded-xl border border-white/10 space-y-4">
                        <span className="text-xs font-bold text-white block border-b border-white/10 pb-1">
                          {outcome.name}
                        </span>
                        
                        {/* Before Slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-purple-300 font-bold text-[11px]">Before (Baseline) Rating</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${preCfg.badgeBg}`}>
                                {isPreRecorded ? preCfg.qualityLabel : 'Unset (No Baseline)'}
                              </span>
                              <span className={`font-mono font-bold text-xs ${preCfg.textColor}`}>
                                {isPreRecorded ? `${displayPreVal}/10` : 'Unset'}
                              </span>
                            </div>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="10" 
                            value={displayPreVal} 
                            onChange={(e) => setEditPreValues(prev => ({ ...prev, [outcome.id]: parseInt(e.target.value) }))} 
                            onPointerDown={() => {
                              if (editPreValues[outcome.id] === undefined) {
                                setEditPreValues(prev => ({ ...prev, [outcome.id]: displayPreVal }))
                              }
                            }}
                            onClick={() => {
                              if (editPreValues[outcome.id] === undefined) {
                                setEditPreValues(prev => ({ ...prev, [outcome.id]: displayPreVal }))
                              }
                            }}
                            className="w-full cursor-pointer touch-manipulation" 
                            style={{ accentColor: preCfg.accentHex }}
                            title={isPreRecorded ? `Baseline: ${displayPreVal}/10 (Confirmed)` : 'Click dot to confirm baseline, or drag to adjust'}
                          />
                        </div>

                        {/* After Slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-emerald-300 font-bold text-[11px]">After (Post-Modality) Rating</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${postCfg.badgeBg}`}>
                                {isPostRecorded ? postCfg.qualityLabel : 'Unset'}
                              </span>
                              <span className={`font-mono font-bold text-xs ${postCfg.textColor}`}>
                                {isPostRecorded ? `${displayPostVal}/10` : 'Unset'}
                              </span>
                            </div>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="10" 
                            value={displayPostVal} 
                            onChange={(e) => setEditPostValues(prev => ({ ...prev, [outcome.id]: parseInt(e.target.value) }))} 
                            onPointerDown={() => {
                              if (editPostValues[outcome.id] === undefined) {
                                setEditPostValues(prev => ({ ...prev, [outcome.id]: displayPostVal }))
                              }
                            }}
                            onClick={() => {
                              if (editPostValues[outcome.id] === undefined) {
                                setEditPostValues(prev => ({ ...prev, [outcome.id]: displayPostVal }))
                              }
                            }}
                            className="w-full cursor-pointer touch-manipulation" 
                            style={{ accentColor: postCfg.accentHex }}
                            title={isPostRecorded ? `Post: ${displayPostVal}/10 (Confirmed)` : 'Click dot to confirm rating, or drag to adjust'}
                          />
                        </div>
                      </div>
                    )
                  })}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveEditOutcomes}
                      disabled={isSavingEditOutcomes}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Check size={15} /> {isSavingEditOutcomes ? 'Saving Changes...' : 'Save Updated Observations'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingOutcomes(false)}
                      className="px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-gray-200 hover:text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* READ-ONLY / SUMMARY VIEW IN COMPLETED MODALITIES SECTION */
                <div className="space-y-4">
                  {currentRelevantOutcomes.map(outcome => {
                    const preObs = taskObs.find(o => o.outcome_id === outcome.id && o.phase === 'pre')
                    const postObs = taskObs.find(o => o.outcome_id === outcome.id && o.phase === 'post')
                    
                    const preVal = preObs ? preObs.value_0_10 : baselineOutcomesMap[outcome.id]
                    const postVal = postObs ? postObs.value_0_10 : (touchedPostOutcomes[outcome.id] ? inlinePostValues[outcome.id] : undefined)

                    const isLowerBetter = outcome.directionality === 'lower_is_better'

                    if (preVal !== undefined && postVal !== undefined) {
                      const delta = postVal - preVal
                      const isImprovement = isLowerBetter ? delta < 0 : delta > 0
                      const deltaText = delta === 0 ? '0' : `${delta > 0 ? '+' : ''}${delta}`
                      const minVal = Math.min(preVal, postVal)
                      const maxVal = Math.max(preVal, postVal)
                      const leftPct = (minVal / 10) * 100
                      const widthPct = Math.max(((maxVal - minVal) / 10) * 100, 3)
                      const prePct = (preVal / 10) * 100
                      const postPct = (postVal / 10) * 100

                      return (
                        <div key={outcome.id} className="bg-black/50 p-4 rounded-xl border border-emerald-500/30 space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-white font-bold">{outcome.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isImprovement ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 
                              delta === 0 ? 'bg-gray-500/20 text-gray-300 border-gray-500/40' : 
                              'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}>
                              Before {preVal} ➔ After {postVal} ({deltaText} Shift)
                            </span>
                          </div>

                          <div className="relative w-full h-8 flex items-center my-1">
                            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden relative">
                              <div 
                                className={`absolute h-full rounded-full transition-all duration-300 ${
                                  isImprovement ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 
                                  delta === 0 ? 'bg-gray-400' : 
                                  'bg-gradient-to-r from-amber-500 to-rose-500'
                                }`}
                                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                              />
                            </div>

                            <div 
                              className="absolute -top-1 flex flex-col items-center transform -translate-x-1/2 z-10"
                              style={{ left: `${prePct}%` }}
                            >
                              <span className="text-[9px] font-bold font-mono text-purple-300 bg-purple-950/90 border border-purple-500/50 px-1.5 py-0.5 rounded shadow">
                                Before {preVal}
                              </span>
                              <div className="w-3.5 h-3.5 rounded-full bg-purple-400 border-2 border-white shadow-md mt-0.5" />
                            </div>

                            <div 
                              className="absolute -top-1 flex flex-col items-center transform -translate-x-1/2 z-10"
                              style={{ left: `${postPct}%` }}
                            >
                              <span className="text-[9px] font-bold font-mono text-emerald-300 bg-emerald-950/90 border border-emerald-500/50 px-1.5 py-0.5 rounded shadow">
                                After {postVal}
                              </span>
                              <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-md mt-0.5" />
                            </div>
                          </div>

                          <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-gray-400">
                            <span>0: {isLowerBetter ? 'Best (None)' : 'Poor (Low)'}</span>
                            <span>10: {isLowerBetter ? 'Worst (Severe)' : 'Peak (Best)'}</span>
                          </div>
                        </div>
                      )
                    }

                    if (postVal !== undefined) {
                      const colorCfg = getOutcomeColorConfig(postVal, outcome.directionality)
                      return (
                        <div key={outcome.id} className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-white font-bold">{outcome.name}</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${colorCfg.badgeBg}`}>
                                {colorCfg.qualityLabel}
                              </span>
                              <span className={`font-mono font-bold text-xs ${colorCfg.textColor}`}>{postVal}/10</span>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${colorCfg.bgColor}`} 
                              style={{ width: `${(postVal / 10) * 100}%` }} 
                            />
                          </div>
                          <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-gray-400">
                            <span>0: {isLowerBetter ? 'Best (None)' : 'Poor (Low)'}</span>
                            <span>10: {isLowerBetter ? 'Worst (Severe)' : 'Peak (Best)'}</span>
                          </div>
                        </div>
                      )
                    }

                    if (preVal !== undefined) {
                      return (
                        <div key={outcome.id} className="bg-black/40 p-3.5 rounded-xl border border-purple-500/20 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-white font-bold">{outcome.name}</span>
                              <span className="text-[9px] font-bold text-purple-300 bg-purple-500/20 border border-purple-500/40 px-1.5 py-0.5 rounded-full">
                                ⚡ Baseline: {preVal}/10
                              </span>
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 bg-gray-500/10 border border-gray-500/20 px-2 py-0.5 rounded-full">
                              Post-Outcome Unrecorded
                            </span>
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden relative">
                            <div 
                              className="h-full bg-purple-500/60" 
                              style={{ width: `${(preVal / 10) * 100}%` }} 
                            />
                          </div>
                          <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-gray-400">
                            <span>0: {isLowerBetter ? 'Best (None)' : 'Poor (Low)'}</span>
                            <span>10: {isLowerBetter ? 'Worst (Severe)' : 'Peak (Best)'}</span>
                          </div>
                        </div>
                      )
                    }

                    return null
                  })}
                </div>
              )
            })()}
            </div>
          )}

          {!isJustCompletedInline && modality.functional_impacts && Object.keys(modality.functional_impacts).some(k => modality.functional_impacts![k].score > 5) && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {Object.entries(modality.functional_impacts)
                .filter(([_, impact]) => impact.score > 5)
                .sort((a, b) => b[1].score - a[1].score)
                .map(([outcome, impact]) => (
                  <OutcomePill
                    key={outcome}
                    outcome={outcome}
                    score={impact.score}
                    size="sm"
                  />
                ))
              }
            </div>
          )}
          {(task.modality_id === 'box_breathing' || modality?.id?.includes('box')) ? (
            <div className="mb-3.5 w-full">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowBoxApplet(true)
                }}
                className="w-full py-4 px-6 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-3 cursor-pointer border border-cyan-400/40 transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <Sparkles size={18} fill="currentColor" className="shrink-0 text-cyan-200" />
                <span className="truncate sm:whitespace-normal">Start Box Breathing (Navy SEAL Method) • 4 Min</span>
              </button>
            </div>
          ) : (task.modality_id === 'cyclic_hyperventilation' || modality?.id?.includes('hyperventilation')) ? (
            <div className="mb-3.5 w-full">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowHyperApplet(true)
                }}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center justify-center gap-3 cursor-pointer border border-amber-400/40 transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <Sparkles size={18} fill="currentColor" className="shrink-0 text-amber-200" />
                <span className="truncate sm:whitespace-normal">Start Cyclic Hyperventilation (Wim Hof) • 10 Min</span>
              </button>
            </div>
          ) : (task.modality_id === 'coherent_breathing' || modality?.id?.includes('coherent')) ? (
            <div className="mb-3.5 w-full">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowCoherentApplet(true)
                }}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-emerald-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_25px_rgba(59,130,246,0.4)] flex items-center justify-center gap-3 cursor-pointer border border-blue-400/40 transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <Sparkles size={18} fill="currentColor" className="shrink-0 text-blue-200" />
                <span className="truncate sm:whitespace-normal">Start Coherent 5.5s Breathing (Max HRV) • 10 Min</span>
              </button>
            </div>
          ) : (task.modality_id === 'breathing_4_7_8' || 
             modality?.name?.toLowerCase().includes('4-7-8') || 
             modality?.id?.includes('4_7_8')) ? (
            <div className="mb-3.5 w-full">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShow478Applet(true)
                }}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-700 via-blue-600 to-emerald-600 hover:from-purple-600 hover:to-emerald-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_25px_rgba(124,58,237,0.4)] flex items-center justify-center gap-3 cursor-pointer border border-purple-400/40 transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <Sparkles size={18} fill="currentColor" className="shrink-0 text-purple-200" />
                <span className="truncate sm:whitespace-normal">Start 4-7-8 Relaxing Breathwork • 5 Min</span>
              </button>
            </div>
          ) : (
            (modality?.name?.toLowerCase().includes('breath') || 
             modality?.name?.toLowerCase().includes('sigh') || 
             modality?.category?.toLowerCase().includes('breath') ||
             task.modality_id?.includes('sighing')) && (
              <div className="mb-3.5 w-full">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowBreathworkApplet(true)
                  }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_25px_rgba(37,99,235,0.4)] flex items-center justify-center gap-3 cursor-pointer border border-blue-400/40 transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Sparkles size={18} fill="currentColor" className="shrink-0 text-blue-200" />
                  <span className="truncate sm:whitespace-normal">Start Cyclic Sighing (Physiological Sigh) • 5 Min</span>
                </button>
              </div>
            )
          )}

          {/* Quick & Main Actions (For all tasks except immediate inline outcome tracking prompt) */}
          {!isJustCompletedInline && (
            <>
              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowManageModal(true); }}
                  className="flex-1 h-9 text-xs font-bold flex items-center justify-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 px-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <CalendarDays size={13} className="text-purple-400" /> Schedule
                </button>
                {task.status !== 'completed' && (
                  <>
                    <button 
                      onClick={() => onStatusChange(task.id, 'partial')}
                      className="flex-1 h-9 text-xs font-bold flex items-center justify-center gap-1.5 bg-amber-950/30 hover:bg-amber-900/50 border border-amber-500/30 text-amber-300 px-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      <Clock size={13} className="text-amber-400" /> Partial
                    </button>
                    <button 
                      onClick={() => onStatusChange(task.id, 'not_today')}
                      className="flex-1 h-9 text-xs font-bold flex items-center justify-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-400 px-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      <X size={13} className="text-slate-400" /> Skip Today
                    </button>
                  </>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); setActionModalType('bench'); }}
                  disabled={isProcessing || benched}
                  className={`flex-1 h-9 text-xs font-bold flex items-center justify-center gap-1.5 border px-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 ${
                    benched 
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' 
                      : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-200'
                  }`}
                >
                  <Bookmark size={13} className="text-cyan-400" /> Bench
                </button>
              </div>

              {/* EXPANDABLE STEP-BY-STEP EXECUTION GUIDE & TIMESTAMPED VIDEO DEMO */}
              {(() => {
                const instructions = task.protocol_step?.instructions || (task as any).instructions || modality?.instructions || ''
                const vidInfo = getModalityVideoInfo(modality?.id || task.modality_id, modality?.category, modality?.display_name || modality?.name)
                return (
                  <ModalityExecutionGuide
                    instructions={instructions}
                    youtubeVideoId={vidInfo?.youtubeVideoId}
                    videoStartSeconds={vidInfo?.videoStartSeconds}
                    videoTitle={vidInfo?.videoTitle}
                    modalityName={modality?.display_name || modality?.name}
                    briefDescription={modality?.brief_description || modality?.headline_benefit}
                    doseOrExposure={modality?.dose_or_exposure}
                    timingSummary={modality?.timing_summary}
                    defaultOpen={false}
                  />
                )
              })()}

              {/* Main Actions */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button 
                  onClick={handlePersonalizeClick}
                  disabled={isProcessing}
                  className="border text-xs sm:text-sm font-bold h-9 rounded-xl flex items-center justify-center gap-1.5 transition-colors bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white disabled:opacity-50 cursor-pointer"
                >
                  <Activity size={14} /> Personalize
                </button>

                <button 
                  onClick={(e) => { e.stopPropagation(); setShowGeekMode(!showGeekMode); }}
                  className={`border text-xs sm:text-sm font-bold h-9 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    showGeekMode 
                      ? 'bg-levl-purple text-white border-levl-purple shadow-md' 
                      : 'bg-levl-purple/10 border-levl-purple/30 text-purple-300 hover:bg-levl-purple hover:text-white'
                  }`}
                >
                  <Info size={14} /> Geek Mode
                </button>
              </div>

              {/* Habit Automaticity Progress Box (Placed directly UNDER Personalize & Geek Mode) */}
              {modality && (
                <div 
                  onClick={() => setShowHabitAnalyticsModal(true)}
                  className="mb-4 bg-indigo-950/40 border border-indigo-500/30 hover:border-indigo-400/60 rounded-xl p-3.5 space-y-3 cursor-pointer transition-all hover:bg-indigo-950/60 shadow-[0_0_15px_rgba(99,102,241,0.15)] group"
                >
                  {(() => {
                    const rawStreak = habitRecord?.streak_days || 0
                    const streakDays = (task.status === 'completed' || isRecentlyCompleted) ? Math.max(1, rawStreak) : rawStreak
                    const targetDays = habitRecord?.target_streak_days || 66
                    const pct = isHabitAutomated ? 100 : Math.min(100, Math.round((streakDays / targetDays) * 100))

                    return (
                      <>
                        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-white group-hover:text-indigo-300 transition-colors">
                            <Sparkles size={14} className="text-indigo-400 shrink-0" />
                            <span>Habit Automaticity Progress</span>
                            <span className="text-[10px] text-indigo-400 underline font-normal ml-1">
                              (Click for Historical Analysis)
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold shrink-0">
                            {isHabitAutomated ? '100% Automatic' : `${pct}% Automatic (${streakDays}/${targetDays} Days)`}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-black/60 border border-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-white/5">
                          <span className="text-[10px] text-gray-400 leading-tight">
                            {isHabitAutomated 
                              ? '🌿 Graduated to Automatic Habits' 
                              : `Target: ~${targetDays} Days to 100% Automaticity`}
                          </span>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation()
                              const localUserId = getLocalUserId()
                              const { toggleHabitGraduation } = await import('@/lib/data')
                              const updated = await toggleHabitGraduation(localUserId, modality.id, 'manual')
                              const found = updated.find(h => h.modality_id === modality.id)
                              if (found) {
                                setIsHabitAutomated(found.is_automated)
                                setHabitRecord(found)
                              } else {
                                setIsHabitAutomated(!isHabitAutomated)
                              }
                            }}
                            className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto ${
                              isHabitAutomated
                                ? 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20'
                                : 'bg-indigo-500/20 border-indigo-400 text-indigo-200 hover:bg-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                            }`}
                          >
                            {isHabitAutomated ? 'Move Back to Active Tasks' : '🌿 Move to Automatic Habits'}
                          </button>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}

              {/* Collapsible Medical Disclaimer (Directly on expanded card for peptides and risky modalities) */}
              {isPeptideOrRiskyModality && (
                <div className="mb-3" onClick={e => e.stopPropagation()}>
                  <MedicalDisclaimerBanner
                    modalityCategory={modality?.category}
                    modalityName={modality?.display_name || modality?.name}
                  />
                </div>
              )}

              {/* Render Habit Analytics Modal */}
              {modality && (
                <HabitAnalyticsModal
                  isOpen={showHabitAnalyticsModal}
                  onClose={() => setShowHabitAnalyticsModal(false)}
                  modality={modality}
                  initialStreakDays={(task.status === 'completed' || isRecentlyCompleted) ? Math.max(1, habitRecord?.streak_days || 0) : (habitRecord?.streak_days || 0)}
                  targetDays={habitRecord?.target_streak_days || 66}
                  isAutomated={isHabitAutomated}
                  onGraduationChange={(nextState: boolean) => setIsHabitAutomated(nextState)}
                />
              )}
            </>
          )}

          {showGeekMode && (
            <div className="border-t border-white/5 pt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
              <GeekMode modality={modality} />
              
              <div className="flex items-center gap-2 pt-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    setActionModalType('bench')
                  }}
                  className="flex-1 text-xs flex items-center justify-center gap-1.5 bg-purple-950/80 border border-purple-700/60 text-purple-200 px-3 py-2 rounded-xl hover:bg-purple-900 transition-colors font-bold cursor-pointer"
                  title="Move modality to Bench with custom confirmation"
                >
                  <Archive size={14} /> Move to Bench
                </button>

                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    setActionModalType('eliminate')
                  }}
                  className="flex-1 text-xs flex items-center justify-center gap-1.5 bg-red-950/80 border border-red-700/60 text-red-200 px-3 py-2 rounded-xl hover:bg-red-900 transition-colors font-bold cursor-pointer"
                  title="Eliminates from active schedule. Still available in Library anytime."
                >
                  <Trash2 size={14} /> Eliminate (Kept in Library)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full-Screen Action Confirmation Takeover Modal (Bench or Eliminate) */}
      {actionModalType && mounted && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
          onClick={(e) => {
            e.stopPropagation()
            if (e.target === e.currentTarget) setActionModalType(null)
          }}
        >
          <div 
            className={`relative w-full max-w-lg bg-slate-950 border ${actionModalType === 'eliminate' ? 'border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.25)]' : 'border-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.25)]'} rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col my-auto max-h-[90vh] overflow-hidden space-y-4`}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-2xl border shrink-0 ${actionModalType === 'eliminate' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'}`}>
                  {actionModalType === 'eliminate' ? <Trash2 size={22} /> : <Archive size={22} />}
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white leading-tight">
                    {actionModalType === 'eliminate' ? `Eliminate "${modality.display_name || modality.name}"?` : `Move "${modality.display_name || modality.name}" to Bench?`}
                  </h4>
                  <p className={`text-xs font-medium ${actionModalType === 'eliminate' ? 'text-red-300/90' : 'text-purple-300/90'}`}>
                    {actionModalType === 'eliminate' ? 'Active Schedule Removal • Still Available in Library' : 'Saved on Bench for Future Use'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setActionModalType(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="space-y-4 overflow-y-auto pr-1 flex-1 pb-2">
              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300 leading-relaxed">
                <p>
                  {actionModalType === 'eliminate' ? (
                    <>Eliminating <strong className="text-white">{modality.display_name || modality.name}</strong> removes it completely from your active daily timeline and schedule.</>
                  ) : (
                    <>Moving <strong className="text-white">{modality.display_name || modality.name}</strong> to your Bench removes it from your active daily timeline while keeping it safely saved on your personal Bench.</>
                  )}
                </p>
                <p className="text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  💡 <strong className="text-teal-300">Don't worry:</strong> {actionModalType === 'eliminate' ? 'This modality will remain saved in your Protocol Library to re-add at any time.' : 'You can re-add this benched modality to your schedule anytime.'}
                </p>
              </div>

              {/* Multi-Select Common Reasons (0 to All) */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider block">
                  Why are you {actionModalType === 'eliminate' ? 'eliminating' : 'benching'} this modality? (Select 0 or more)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ELIMINATION_REASON_OPTIONS.map((opt) => {
                    const isSelected = selectedEliminationReasons.includes(opt.label)
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleEliminationReason(opt.label)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs font-semibold transition-all cursor-pointer active:scale-95 touch-manipulation ${
                          isSelected
                            ? actionModalType === 'eliminate'
                              ? 'bg-red-950/90 border-red-500 text-white ring-1 ring-red-500/60 shadow-md'
                              : 'bg-purple-950/90 border-purple-500 text-white ring-1 ring-purple-500/60 shadow-md'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate pr-1">
                          <span>{opt.icon}</span>
                          <span className="truncate">{opt.label}</span>
                        </span>
                        {isSelected && (
                          <span className={`w-4 h-4 rounded-full text-white flex items-center justify-center shrink-0 ${actionModalType === 'eliminate' ? 'bg-red-500' : 'bg-purple-500'}`}>
                            <Check size={10} />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom Note Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 block">
                  Additional Notes or Explanation (Optional)
                </label>
                <textarea 
                  value={eliminateReason}
                  onChange={e => setEliminateReason(e.target.value)}
                  placeholder="e.g. Taking a break for travel; switching to Berberine..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/80"
                />
              </div>
            </div>

            {/* Action Toolbar (Sticky at bottom of modal to ensure buttons are NEVER covered) */}
            <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-800 bg-slate-950 shrink-0">
              {/* Full Width Primary Action with 0.5s confirmation feedback */}
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isProcessing || actionSuccess !== null}
                className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50 active:scale-95 touch-manipulation ${
                  actionSuccess
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400'
                    : actionModalType === 'eliminate'
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                }`}
              >
                {actionSuccess === 'eliminate' ? (
                  <>
                    <Check size={16} className="stroke-[3]" /> Eliminated (Saved in Library)
                  </>
                ) : actionSuccess === 'bench' ? (
                  <>
                    <Check size={16} className="stroke-[3]" /> Moved to Bench
                  </>
                ) : actionModalType === 'eliminate' ? (
                  <>
                    <Trash2 size={15} /> Confirm Elimination (Kept in Library)
                  </>
                ) : (
                  <>
                    <Archive size={15} /> Confirm Move to Bench
                  </>
                )}
              </button>

              {/* Side-by-Side Cancel & Secondary Alternative */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer text-center active:scale-95 touch-manipulation"
                >
                  Cancel
                </button>

                {actionModalType === 'eliminate' ? (
                  <button
                    type="button"
                    onClick={() => setActionModalType('bench')}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-purple-950/90 hover:bg-purple-900 text-purple-200 font-bold text-xs border border-purple-700/80 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 touch-manipulation"
                  >
                    <Archive size={14} /> Move to Bench Instead
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActionModalType('eliminate')}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-red-950/90 hover:bg-red-900 text-red-200 font-bold text-xs border border-red-700/80 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 touch-manipulation"
                  >
                    <Trash2 size={14} /> Eliminate (Kept in Library) Instead
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Unified Master Dosage & Schedule Studio Modal */}
      {(showPersonalizeModal || showManageModal) && (
        <ManageTaskModal
          isOpen={showPersonalizeModal || showManageModal}
          onClose={() => {
            setShowPersonalizeModal(false)
            setShowManageModal(false)
          }}
          task={task}
          modality={modality}
          benchItem={benchItem}
          userProfile={userProfile}
          onSaveSuccess={() => {
            setShowPersonalizeModal(false)
            setShowManageModal(false)
            window.location.reload()
          }}
        />
      )}

      {/* Customize Modality Outcomes Modal */}
      {showCustomizeOutcomesModal && (
        <CustomizeModalityOutcomesModal
          isOpen={showCustomizeOutcomesModal}
          onClose={() => setShowCustomizeOutcomesModal(false)}
          modality={modality}
          allOutcomes={allOutcomes}
          currentOutcomeIds={Array.from(new Set([
            modality.primary_outcome,
            ...(modality.secondary_outcomes || []),
            ...(modality.functional_outcomes_to_track || [])
          ].filter(Boolean) as string[]))}
          onSaveOutcomes={(mId, selectedOutcomeIds) => {
            if (onSaveCustomOutcomes) {
              onSaveCustomOutcomes(mId, selectedOutcomeIds)
            }
          }}
        />
      )}
      {/* Cyclic Sighing Fullscreen Interactive Applet */}
      {showBreathworkApplet && (
        <CyclicSighingApplet 
          isOpen={showBreathworkApplet}
          onClose={() => setShowBreathworkApplet(false)}
          modalityName={modality?.name || 'Cyclic Sighing (Physiological Sigh)'}
          taskId={task.id}
          onComplete={() => {
            onStatusChange(task.id, 'completed')
            setShowBreathworkApplet(false)
          }}
        />
      )}
      {/* 4-7-8 Sacred Lotus Fullscreen Interactive Applet */}
      {show478Applet && (
        <Breathing478Applet 
          isOpen={show478Applet}
          onClose={() => setShow478Applet(false)}
          modalityName={modality?.name || '4-7-8 Relaxing Breathwork'}
          taskId={task.id}
          onComplete={() => {
            onStatusChange(task.id, 'completed')
            setShow478Applet(false)
          }}
        />
      )}
      {/* Box Breathing Quantum Tesseract Interactive Applet */}
      {showBoxApplet && (
        <BoxBreathingApplet
          isOpen={showBoxApplet}
          onClose={() => setShowBoxApplet(false)}
          modalityName={modality?.name || 'Box Breathing (Navy SEAL Focus)'}
          taskId={task.id}
          onComplete={() => {
            onStatusChange(task.id, 'completed')
            setShowBoxApplet(false)
          }}
        />
      )}
      {/* Cyclic Hyperventilation Plasma Engine Interactive Applet */}
      {showHyperApplet && (
        <HyperventilationApplet
          isOpen={showHyperApplet}
          onClose={() => setShowHyperApplet(false)}
          modalityName={modality?.name || 'Cyclic Hyperventilation (Wim Hof Energy)'}
          taskId={task.id}
          onComplete={() => {
            onStatusChange(task.id, 'completed')
            setShowHyperApplet(false)
          }}
        />
      )}
      {/* Coherent 5.5s Liquid Cymatic Interactive Applet */}
      {showCoherentApplet && (
        <CoherentBreathingApplet
          isOpen={showCoherentApplet}
          onClose={() => setShowCoherentApplet(false)}
          modalityName={modality?.name || 'Coherent 5.5s Breathing (Max HRV)'}
          taskId={task.id}
          onComplete={() => {
            onStatusChange(task.id, 'completed')
            setShowCoherentApplet(false)
          }}
        />
      )}
      </div>
    </div>
  )
}
