'use client'

import { useEffect, useState, useMemo, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { 
  getOrCreateUserProfile, 
  getDailyProtocolTasks, 
  getMultiDayProtocolTasks,
  updateDailyTaskStatus, 
  saveDailyWellbeingCheckin, 
  getDailyWellbeingCheckin,
  getOutcomeDimensions,
  getProtocols,
  getBenchItems,
  createDailyTask,
  saveOutcomeObservation,
  addModalityOrProtocolToToday,
  getModalities,
  addToBench,
  upsertBenchItemOverride,
  updateTaskExecutionDetails,
  normalizeUserProfile,
  getModalityScheduleConfig
} from '@/lib/data'
import { DailyProtocolTask, Modality, OutcomeDimension, UserProfile, UserBenchItem, DailyWellbeingCheckin as WellbeingType } from '@/lib/types'
import { 
  format, parseISO, addDays, subDays, addMonths, subMonths, 
  isBefore, startOfDay, startOfWeek, endOfWeek, eachDayOfInterval, 
  isSameMonth, isSameDay, startOfMonth, endOfMonth 
} from 'date-fns'
import { 
  Activity, Check, ChevronDown, ChevronLeft, ChevronRight, 
  ChevronUp, Clock, Layers, ListOrdered, Plus, Slash, Sparkles, Stethoscope, X, Zap, RefreshCw,
  Columns, Rows, ChevronsUpDown, Moon, Sun, ArrowRight, ExternalLink, Search, Scale, Shield, ShieldAlert, ShieldCheck,
  Flame, SkipForward, SlidersHorizontal
} from 'lucide-react'

import { evaluateDailyBandwidth, DailyBandwidthMode, BandwidthEvaluation } from '@/lib/adaptive/dailyBandwidthEngine'
import AdaptiveRoutineAdjustmentModal from '@/components/modals/AdaptiveRoutineAdjustmentModal'
import DashboardLayoutModal from '@/components/modals/DashboardLayoutModal'
import { useHomeWidgets, useFocusRules, useCardBadges } from '@/lib/utils/layoutSettings'

import ProtocolTaskCard, { DedupedTask } from '@/components/cards/ProtocolTaskCard'
import ProtocolAvatar from '@/components/ui/ProtocolAvatar'
import { getProtocolVisualTheme } from '@/lib/utils/protocolThemes'
import { triggerHaptic } from '@/lib/utils/haptics'
import { safeLocalStorageSet, safeLocalStorageGet } from '@/lib/utils/storage'
import { PulsedModalityCard } from '@/components/cards/PulsedModalityCard'
import ProactiveDiagnosticCard from '@/components/cards/ProactiveDiagnosticCard'
import DailyWellbeingCheckin from '@/components/score/DailyWellbeingCheckin'
import { DailyLongevityTipBanner } from '@/components/banners/DailyLongevityTipBanner'
import { AdaptiveRecommendationBanner } from '@/components/banners/AdaptiveRecommendationBanner'
import { LongevityCoachInputBar } from '@/components/ai/LongevityCoachInputBar'
import { DailyHistoricalDebriefHeader } from '@/components/cards/DailyHistoricalDebriefHeader'
import { ViewSelectorHeader, CalendarViewMode, LayoutOrientation, MainCategory, SUB_CATEGORIES_MAP, CategoryFiltersBar, FilterLens } from '@/components/ui/ViewSelectorHeader'
import ModalityIcon from '@/components/ui/ModalityIcon'
import { ThreeDaySplitView } from '@/components/views/ThreeDaySplitView'
import { SevenDayWeekView } from '@/components/views/SevenDayWeekView'
import { MonthMatrixView } from '@/components/views/MonthMatrixView'
import DailyVerticalPulseView from '@/components/calendar/DailyVerticalPulseView'
import { useTheme } from '@/lib/utils/useTheme'
import ExploreCard from '@/components/cards/ExploreCard'
import ProtocolOverviewHeaderCard from '@/components/cards/ProtocolOverviewHeaderCard'
import AdHocLoggerModal from '@/components/modals/AdHocLoggerModal'
import EnrollProtocolModal from '@/components/modals/EnrollProtocolModal'
import StackHealthOptimizerModal from '@/components/modals/StackHealthOptimizerModal'
import { auditRoutineStackHealth } from '@/lib/synergy/routineStackHealthEngine'
import { SmartRescheduleModal, RescheduleActionType } from '@/components/modals/SmartRescheduleModal'
import CustomizeModalityOutcomesModal from '@/components/modals/CustomizeModalityOutcomesModal'
import CreateCustomModalityModal, { CustomModalityInitialData } from '@/components/modals/CreateCustomModalityModal'
import QuickHotkeyGrid from '@/components/quicklog/QuickHotkeyGrid'
import { InfradianAdaptiveBanner } from '@/components/banners/InfradianAdaptiveBanner'
import { calculateInfradianStatus } from '@/lib/tracking/infradianEngine'

import { calculateDailyEfficacySummary } from '@/lib/data/historicalAnalysis'
import { getScoredLongevityTips } from '@/lib/ranking/tipPersonalization'
import { getMacroCategory } from '@/lib/utils/categories'
import { getOutcomeColorConfig } from '@/lib/utils/outcomeColors'
import { getModalityMacroType } from '@/lib/utils/modalityColors'
import { getCircadianConfig, getAdaptiveCircadianConfig, isCurrentCircadianSlot, isCircadianSlotPast, buildDynamicCircadianGradientCSS, CHRONOLOGICAL_CIRCADIAN_SLOTS, isLateNightCarryoverWindow } from '@/lib/utils/circadianConfig'
import { supabase } from '@/lib/supabase/client'
import { resolveOptimalTimingSlot, resolveSlotFromTimingString, parseMultiDoseTimingSlots, MultiDoseSlot } from '@/lib/data/resolveOptimalTiming'
import { 
  canonicalizeTimingSlot, 
  getTimeBlockOrder, 
  compareTimingSlots, 
  formatSlotName, 
  CANONICAL_TIMING_SLOTS 
} from '@/lib/utils/timingSlots'
import AdaptiveSleepTriageCard from '@/components/today/AdaptiveSleepTriageCard'
import { OutcomeLensView } from '@/components/outcomes/OutcomeLensView'
import { OutcomeOptimizationModal } from '@/components/modals/OutcomeOptimizationModal'
import { Outcome8020SpotlightCard } from '@/components/outcomes/Outcome8020SpotlightCard'
import NewUserWelcomeHub from '@/components/onboarding/NewUserWelcomeHub'
import SampleDayPreviewTimeline from '@/components/today/SampleDayPreviewTimeline'
import { OutcomeOptimizationState, AntagonisticClash } from '@/lib/outcomes/outcomeOptimizationEngine'
import { BlocksViewContainer, getStoredDisplayMode } from '@/components/blocks'

export function normalizeChronologicalTimeBlock(slot: string): string {
  return canonicalizeTimingSlot(slot)
}

const TIME_BLOCKS = CANONICAL_TIMING_SLOTS


function parseLocalDate(dStr?: string | null): Date {
  if (!dStr) return new Date()
  const clean = dStr.split('T')[0]
  const [y, m, d] = clean.split('-').map(Number)
  if (y && m && d) {
    return new Date(y, m - 1, d, 12, 0, 0)
  }
  return new Date()
}

interface SupplementCompactRowProps {
  task: DedupedTask
  modality?: Modality
  modalityName: string
  benchItem?: UserBenchItem
  onStatusChange: (taskId: string, status: string) => void
  onOpenRescheduleModal?: (task: DedupedTask) => void
  onOpenDetails: () => void
  completionMode: string
}

function SupplementCompactRow({
  task,
  modality,
  modalityName,
  benchItem,
  onStatusChange,
  onOpenRescheduleModal,
  onOpenDetails,
  completionMode
}: SupplementCompactRowProps) {
  const isDone = task.status === 'completed'
  const dose = task.execution_details?.custom_dose || benchItem?.custom_dose || task.protocol_step?.dose_text || (task.protocol_step?.dose_amount ? `${task.protocol_step.dose_amount}${task.protocol_step.dose_unit || ''}` : '') || modality?.dose_or_exposure || ''

  return (
    <div
      onClick={onOpenDetails}
      className={`flex items-center justify-between gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border transition-all cursor-pointer group select-none min-w-0 overflow-hidden ${
        isDone
          ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-950/30'
          : 'bg-slate-900/70 border-white/10 hover:border-purple-500/40 hover:bg-slate-900/90 shadow-sm'
      }`}
    >
      {/* Left: Icon & Name & Dose */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
        <ModalityIcon modality={modality} modalityName={modalityName} size={16} className={`shrink-0 ${isDone ? 'opacity-60' : 'opacity-100'}`} glow={!isDone} />

        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
          <span className={`text-xs sm:text-[13px] font-bold truncate transition-colors min-w-0 ${
            isDone ? 'line-through text-slate-400' : 'text-white group-hover:text-purple-200'
          }`}>
            {modalityName}
          </span>
          {dose && (
            <span 
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 truncate max-w-[85px] sm:max-w-[120px] ${
                isDone 
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400/90' 
                  : 'bg-purple-950/50 border-purple-800/40 text-purple-300'
              }`}
              title={dose}
            >
              {dose}
            </span>
          )}
        </div>
      </div>

      {/* Right: Skip/Push & Green Complete Buttons (Matching ProtocolTaskCard!) */}
      <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
        {isDone ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              triggerHaptic('selection')
              onStatusChange(task.id, 'pending')
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-emerald-500 text-slate-950 scale-105 shadow-[0_0_12px_rgba(16,185,129,0.8)] cursor-pointer active:scale-90 touch-manipulation transition-transform"
            title="Mark as pending (Undo)"
            aria-label="Undo completion"
          >
            <Check size={14} strokeWidth={3} />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                triggerHaptic('selection')
                if (onOpenRescheduleModal) onOpenRescheduleModal(task)
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-black/40 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 active:scale-90 transition-all cursor-pointer touch-manipulation shrink-0"
              title="Snooze, reschedule, or skip supplement"
              aria-label="Skip or push supplement"
            >
              <SkipForward size={12} className="ml-0.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                triggerHaptic('success')
                onStatusChange(task.id, 'completed')
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-emerald-500/20 border border-emerald-500/60 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 hover:shadow-[0_0_10px_rgba(16,185,129,0.5)] active:scale-90 transition-all cursor-pointer touch-manipulation shrink-0"
              title="Complete supplement instantly"
              aria-label="Complete supplement"
            >
              <Check size={14} strokeWidth={2.5} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function TodayPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const modalityParam = searchParams.get('modality')
  const protocolParam = searchParams.get('protocol')
  const nameParam = searchParams.get('name')

  const { user: authUser, localUserId: authUserId, loading: authLoading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const isLight = theme === 'light'
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Helper to extract cached wake time for 0ms initial render
  const cachedWakeTime = useMemo(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('levl_cached_user_profile')
        if (cached) return normalizeUserProfile(JSON.parse(cached))?.ideal_wake_time || null
      } catch (e) {}
    }
    return null
  }, [])

  // SWR Instant Local Hydration (0ms initial render):
  // If accessing without date param between midnight and 3h before wake time, prioritize yesterday
  const initialEffectiveDate = useMemo(() => {
    if (dateParam) return parseLocalDate(dateParam)
    if (isLateNightCarryoverWindow(new Date(), cachedWakeTime)) {
      return subDays(new Date(), 1)
    }
    return new Date()
  }, [dateParam, cachedWakeTime])

  const initialDateStr = format(initialEffectiveDate, 'yyyy-MM-dd')
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('levl_cached_user_profile')
        if (cached) return normalizeUserProfile(JSON.parse(cached))
      } catch (e) {}
    }
    return null
  })
  const [tasks, setTasks] = useState<DailyProtocolTask[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`levl_cached_tasks_${initialDateStr}`)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed)) {
            return parsed.map((t: any) => {
              const isEnrolled = Boolean(t.protocol_step_id || t.user_protocol_instance_id || t.execution_details?.enrolled_protocol_id)
              if (!isEnrolled) {
                t.lineages = []
                t.protocol_step = undefined
              }
              return t
            })
          }
        }
      } catch (e) {}
    }
    return []
  })
  const [benchItems, setBenchItems] = useState<UserBenchItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('levl_cached_bench_items')
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed)) {
            return parsed.map((item: any) => {
              if (!item.protocol_id) {
                item.protocolTags = []
              }
              return item
            })
          }
        }
      } catch (e) {}
    }
    return []
  })

  const [allModalities, setAllModalities] = useState<Modality[]>([])
  const [allOutcomes, setAllOutcomes] = useState<OutcomeDimension[]>([])

  const userFirstName = useMemo(() => {
    // Helper to validate and clean a candidate first name
    const isValidName = (name?: string | null): string | null => {
      if (!name || typeof name !== 'string') return null
      const clean = name.trim()
      if (!clean) return null
      // Discard placeholder/default words that are not user names
      if (/^(protocol|protocol optimizer|protocol user|user|guest|anonymous|your|null|undefined)$/i.test(clean)) {
        return null
      }
      const firstWord = clean.split(/\s+/)[0]
      if (/^(protocol|protocol optimizer|protocol user|user|guest|anonymous|your|null|undefined)$/i.test(firstWord)) {
        return null
      }
      return firstWord.charAt(0).toUpperCase() + firstWord.slice(1)
    }

    // 1. Check direct profile fields
    const fromProfileFirst = isValidName((profile as any)?.first_name)
    if (fromProfileFirst) return fromProfileFirst

    const fromProfileDisplay = isValidName(profile?.display_name)
    if (fromProfileDisplay) return fromProfileDisplay

    const fromProfileName = isValidName((profile as any)?.name)
    if (fromProfileName) return fromProfileName

    // 2. Check authUser metadata
    const fromAuthFirst = isValidName(authUser?.user_metadata?.first_name)
    if (fromAuthFirst) return fromAuthFirst

    const fromAuthFull = isValidName(authUser?.user_metadata?.full_name)
    if (fromAuthFull) return fromAuthFull

    const fromAuthName = isValidName(authUser?.user_metadata?.name)
    if (fromAuthName) return fromAuthName

    // 3. Check authUser email prefix (e.g. kylenmcclintock@... -> Kylen)
    if (authUser?.email) {
      const emailPrefix = authUser.email.split('@')[0]
      const token = emailPrefix.split(/[._\d-]/)[0]
      const fromEmail = isValidName(token)
      if (fromEmail) return fromEmail
    }

    // 4. Check cached profile in localStorage
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('levl_cached_user_profile')
        if (cached) {
          const parsed = JSON.parse(cached)
          const fromCachedFirst = isValidName(parsed.first_name)
          if (fromCachedFirst) return fromCachedFirst
          const fromCachedDisplay = isValidName(parsed.display_name)
          if (fromCachedDisplay) return fromCachedDisplay
          const fromCachedName = isValidName(parsed.name)
          if (fromCachedName) return fromCachedName
        }

        const localId = authUserId || localStorage.getItem('levl_local_user_id')
        if (localId) {
          const rawUserProf = localStorage.getItem(`levl_user_profile_${localId}`)
          if (rawUserProf) {
            const parsed = JSON.parse(rawUserProf)
            const fromProfDisplay = isValidName(parsed.display_name)
            if (fromProfDisplay) return fromProfDisplay
          }
        }
      } catch (e) {}
    }

    return 'Your'
  }, [profile, authUser, authUserId])

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const cachedTasks = safeLocalStorageGet(`levl_cached_tasks_${initialDateStr}`)
      if (cachedTasks !== null) return false
    }
    return false
  })
  const [isDateSwitching, setIsDateSwitching] = useState(false)

  // Next Best Action deferred lazy mount state & sentinel
  const [shouldMountNBA, setShouldMountNBA] = useState(false)
  const nbaSentinelRef = useRef<HTMLDivElement | null>(null)

  const hasLoadedInitialCatalogRef = useRef(false)
  const activeDateReqIdRef = useRef(0)
  const lastLoadedUserIdRef = useRef<string | null>(null)
  const tasksDateCacheRef = useRef<Map<string, DailyProtocolTask[]>>(new Map())
  const multiDayCacheRef = useRef<Map<string, Record<string, DailyProtocolTask[]>>>(new Map())
  const activeMultiDayReqIdRef = useRef(0)
  const loadDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)



  const [activeDate, setActiveDate] = useState<Date>(initialEffectiveDate)

  // Synchronize activeDate if URL searchParams change externally (e.g. browser back/forward buttons)
  useEffect(() => {
    if (dateParam) {
      const parsed = parseLocalDate(dateParam)
      setActiveDate(parsed)
    } else {
      if (isLateNightCarryoverWindow(new Date(), profile?.ideal_wake_time || cachedWakeTime)) {
        setActiveDate(subDays(new Date(), 1))
      } else {
        setActiveDate(new Date())
      }
    }
  }, [dateParam, profile?.ideal_wake_time, cachedWakeTime])

  const currentDate = activeDate
  const dateStr = format(currentDate, 'yyyy-MM-dd')
  const isPastDate = isBefore(startOfDay(currentDate), startOfDay(new Date()))
  const isFutureTimeline = isBefore(startOfDay(new Date()), startOfDay(currentDate))
  const isCurrentDay = dateStr === format(new Date(), 'yyyy-MM-dd')

  // Late-night carryover window detection (12:00 AM until 3 hours before wake time)
  const isLateNightTime = isLateNightCarryoverWindow(new Date(), profile?.ideal_wake_time || cachedWakeTime)
  const isViewingYesterdayLateNight = isLateNightTime && isSameDay(activeDate, subDays(new Date(), 1))

  // Always anchor viewport strictly at the top of the day view on load and date switch (unless navigating to a specific modality or protocol)
  useEffect(() => {
    if (typeof window !== 'undefined' && !modalityParam && !protocolParam) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    setShouldMountNBA(false)
  }, [dateStr, modalityParam, protocolParam])

  // Lazy mount Next Best Action only when user scrolls near the bottom of their day
  useEffect(() => {
    if (shouldMountNBA || isPastDate || tasks.length === 0 || loading || isDateSwitching) return
    const sentinel = nbaSentinelRef.current
    if (!sentinel) return

    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            setShouldMountNBA(true)
            observer.disconnect()
          }
        },
        { rootMargin: '300px' }
      )
      observer.observe(sentinel)
      return () => observer.disconnect()
    } else {
      setShouldMountNBA(true)
    }
  }, [shouldMountNBA, isPastDate, tasks.length, loading, isDateSwitching])

  // Asynchronously fetch catalog for deferred widgets (NBA, Explore) without blocking page load
  useEffect(() => {
    let isMounted = true
    const timer = setTimeout(() => {
      getModalities().then(mods => {
        if (isMounted && mods && mods.length > 0) {
          setAllModalities(mods)
        }
      })
    }, 300)
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [])

  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('today')
  const [viewMode, setViewMode] = useState<'chronological' | 'protocol' | 'outcomes'>('chronological')
  const [completionMode, setCompletionMode] = useState<'outcome' | 'fast'>('outcome')

  const switchToDailyPulse = useCallback(() => {
    setCalendarViewMode('pulse')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('levl_view_mode_change', {
        detail: { calendarViewMode: 'pulse', viewMode }
      }))
    }
  }, [viewMode])

  // Outcome Vectors Lens Modal States
  const [inspectingOutcomeState, setInspectingOutcomeState] = useState<OutcomeOptimizationState | null>(null)
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false)

  const [selectedProtocolFilter, setSelectedProtocolFilter] = useState<string>('all')
  const [selectedMainCategories, setSelectedMainCategories] = useState<MainCategory[]>(['all'])
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([])
  const [selectedIsolatedOutcome, setSelectedIsolatedOutcome] = useState<string | null>(null)

  const [filterLens, setFilterLens] = useState<FilterLens>('category')
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>([])
  const [isStackHealthModalOpen, setIsStackHealthModalOpen] = useState(false)
  const [expandedSupplementBlocks, setExpandedSupplementBlocks] = useState<Record<string, boolean>>({})
  const [expandedSupplementId, setExpandedSupplementId] = useState<string | null>(null)

  // Listen for Quick Action Hub opening Routine Stack Health & Conflict Optimizer
  useEffect(() => {
    const handleOpenStackHealth = () => setIsStackHealthModalOpen(true)
    window.addEventListener('levl_open_stack_health', handleOpenStackHealth)
    if (searchParams?.get('openStackHealth') === 'true') {
      setIsStackHealthModalOpen(true)
    }
    return () => window.removeEventListener('levl_open_stack_health', handleOpenStackHealth)
  }, [searchParams])

  // Bidirectional View Mode sync with TopStickyHeader
  useEffect(() => {
    const handleSetViewMode = (e: any) => {
      if (e.detail) {
        if (e.detail.viewMode && (e.detail.viewMode === 'chronological' || e.detail.viewMode === 'protocol')) {
          setViewMode(e.detail.viewMode)
        }
        if (e.detail.calendarViewMode) {
          setCalendarViewMode(e.detail.calendarViewMode)
        }
      }
    }
    window.addEventListener('levl_set_view_mode', handleSetViewMode)
    return () => window.removeEventListener('levl_set_view_mode', handleSetViewMode)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('levl_view_mode_change', {
        detail: { viewMode, calendarViewMode }
      }))
    }
  }, [viewMode, calendarViewMode])

  const [completedSortBy, setCompletedSortBy] = useState<'chronological' | 'completed_time'>('chronological')
  const [completedSortOrder, setCompletedSortOrder] = useState<'asc' | 'desc'>('asc')

  // Interface Visual Display Mode: 'classic' | 'blocks'
  const [displayMode, setDisplayMode] = useState<'classic' | 'blocks'>(() => getStoredDisplayMode())

  useEffect(() => {
    const handleDisplayModeChange = (e: any) => {
      if (e.detail?.mode && (e.detail.mode === 'classic' || e.detail.mode === 'blocks')) {
        setDisplayMode(e.detail.mode)
      }
    }
    window.addEventListener('levl_display_mode_change', handleDisplayModeChange)
    return () => window.removeEventListener('levl_display_mode_change', handleDisplayModeChange)
  }, [])

  const [isCompletedSectionExpanded, setIsCompletedSectionExpanded] = useState<boolean>(false)
  const [isUncompletedSectionExpanded, setIsUncompletedSectionExpanded] = useState<boolean>(false)
  const [isSnoozedSectionExpanded, setIsSnoozedSectionExpanded] = useState<boolean>(false)
  const [isSkippedSectionExpanded, setIsSkippedSectionExpanded] = useState<boolean>(false)
  const [isPulsedSectionExpanded, setIsPulsedSectionExpanded] = useState<boolean>(false)
  const [isProactiveSectionExpanded, setIsProactiveSectionExpanded] = useState<boolean>(false)

  const [showCompletedInline, setShowCompletedInline] = useState<boolean>(false)
  const [showSnoozedInline, setShowSnoozedInline] = useState<boolean>(false)
  const [showSkippedInline, setShowSkippedInline] = useState<boolean>(false)

  // Focus Mode (Super Simple View) State: collapses AI coach, current state, tips, hotkeys & hides completed/skipped modalities
  const [isFocusMode, setIsFocusMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('levl_focus_mode_active') === 'true'
      } catch (e) {}
    }
    return false
  })

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => {
      const next = !prev
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('levl_focus_mode_active', next ? 'true' : 'false')
        } catch (e) {}
      }
      return next
    })
  }, [])

  // Dashboard Layout & Additions Preferences Modal & Dynamic Config
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState<boolean>(false)
  const { widgets: homeWidgets } = useHomeWidgets(profile || undefined)
  const { rules: focusRules } = useFocusRules(profile || undefined)
  const { badges: cardBadges } = useCardBadges(profile || undefined)

  // Daily Bandwidth & Adaptive Routine Governor State
  const [dailyBandwidthMode, setDailyBandwidthMode] = useState<DailyBandwidthMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`levl_bandwidth_mode_${initialDateStr}`) as DailyBandwidthMode
      if (saved === 'survival_80_20' || saved === 'peak_surge') return saved
      if (localStorage.getItem(`levl_8020_protected_${initialDateStr}`) === 'true') return 'survival_80_20'
    }
    return 'standard'
  })
  const [isAdaptiveModalOpen, setIsAdaptiveModalOpen] = useState(false)
  const [adaptiveEvaluation, setAdaptiveEvaluation] = useState<BandwidthEvaluation | null>(null)
  const [isShieldActive, setIsShieldActive] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`levl_8020_protected_${initialDateStr}`) === 'true'
    }
    return false
  })

  // Synchronize Adherence Shield and Daily Bandwidth Mode state whenever dateStr changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isShield = localStorage.getItem(`levl_8020_protected_${dateStr}`) === 'true'
      setIsShieldActive(isShield)
      const savedMode = localStorage.getItem(`levl_bandwidth_mode_${dateStr}`) as DailyBandwidthMode
      if (savedMode === 'survival_80_20' || savedMode === 'peak_surge') {
        setDailyBandwidthMode(savedMode)
      } else if (isShield) {
        setDailyBandwidthMode('survival_80_20')
      } else {
        setDailyBandwidthMode('standard')
      }
    }
  }, [dateStr])

  // Listen for Adherence Shield & Bandwidth Mode lifecycle events
  useEffect(() => {
    const handleShieldActivated = (e: any) => {
      if (e.detail?.date === dateStr || !e.detail?.date) {
        setIsShieldActive(true)
        setDailyBandwidthMode('survival_80_20')
      }
    }
    const handleShieldDeactivated = (e: any) => {
      if (e.detail?.date === dateStr || !e.detail?.date) {
        setIsShieldActive(false)
        setDailyBandwidthMode('standard')
      }
    }
    const handleBandwidthChanged = (e: any) => {
      if (e.detail?.date === dateStr || !e.detail?.date) {
        const mode = e.detail?.mode || (localStorage.getItem(`levl_bandwidth_mode_${dateStr}`) as DailyBandwidthMode) || 'standard'
        setDailyBandwidthMode(mode)
        setIsShieldActive(mode === 'survival_80_20')
      }
    }
    window.addEventListener('levl_adherence_shield_activated', handleShieldActivated)
    window.addEventListener('levl_adherence_shield_deactivated', handleShieldDeactivated)
    window.addEventListener('levl_bandwidth_mode_changed', handleBandwidthChanged)
    return () => {
      window.removeEventListener('levl_adherence_shield_activated', handleShieldActivated)
      window.removeEventListener('levl_adherence_shield_deactivated', handleShieldDeactivated)
      window.removeEventListener('levl_bandwidth_mode_changed', handleBandwidthChanged)
    }
  }, [dateStr])

  const [layoutOrientation, setLayoutOrientation] = useState<LayoutOrientation>('columns')
  const [multiDayTasks, setMultiDayTasks] = useState<Record<string, DailyProtocolTask[]>>({})
  const [availableProtocols, setAvailableProtocols] = useState<{ id: string; name: string; colorHex?: string }[]>([])
  const [dismissedTipIds, setDismissedTipIds] = useState<string[]>([])

  const [wellbeingCheckin, setWellbeingCheckin] = useState<WellbeingType | null>(null)
  const userActualWakeTime = wellbeingCheckin?.actual_wake_time || wellbeingCheckin?.custom_outcomes_jsonb?._actual_wake_time || undefined
  const userActualSleepMinutes = wellbeingCheckin?.actual_sleep_minutes ?? wellbeingCheckin?.custom_outcomes_jsonb?._actual_sleep_minutes
  const userSubjectiveSleep = wellbeingCheckin?.subjective_sleep_0_10

  // Open Adaptive Routine Governor Modal
  const handleOpenAdaptiveGovernor = useCallback((targetMode?: DailyBandwidthMode) => {
    const loggedReadiness = (wellbeingCheckin as any)?.wearable_readiness_score 
      ?? (wellbeingCheckin as any)?.custom_outcomes_jsonb?.wearable_readiness_score 
      ?? (wellbeingCheckin as any)?.custom_outcomes_jsonb?._wearable_readiness 
      ?? null

    const evalResult = evaluateDailyBandwidth({
      wearableReadiness: loggedReadiness,
      todayTasks: tasks,
      subjectiveSleep: wellbeingCheckin?.subjective_sleep_0_10 ?? null,
      actualSleepMinutes: (wellbeingCheckin as any)?.actual_sleep_minutes ?? (wellbeingCheckin as any)?.custom_outcomes_jsonb?._actual_sleep_minutes ?? null,
      subjectiveEnergy: wellbeingCheckin?.energy_0_10 ?? null,
      forcedMode: targetMode || null
    })

    setAdaptiveEvaluation(evalResult)
    setIsAdaptiveModalOpen(true)
  }, [wellbeingCheckin, tasks])

  // Listen for external open modal events (e.g. from DailyWellbeingCheckin)
  useEffect(() => {
    const handleOpenModalEvent = (e: any) => {
      const target = e.detail?.targetMode as DailyBandwidthMode | undefined
      handleOpenAdaptiveGovernor(target)
    }
    window.addEventListener('levl_open_adaptive_modal', handleOpenModalEvent)
    return () => window.removeEventListener('levl_open_adaptive_modal', handleOpenModalEvent)
  }, [handleOpenAdaptiveGovernor])

  // Continuous Live Stack Health & Biochemical Conflict Audit
  const routineAudit = useMemo(() => {
    return auditRoutineStackHealth(tasks, allModalities, profile, wellbeingCheckin)
  }, [tasks, allModalities, profile, wellbeingCheckin])

  const [isSleepTriageDismissed, setIsSleepTriageDismissed] = useState(false)

  const isTriageStoredDismissed = typeof window !== 'undefined' && (
    safeLocalStorageGet(`levl_sleep_triage_${dateStr}`) === 'dismissed' ||
    safeLocalStorageGet(`levl_sleep_triage_${dateStr}`) === 'applied'
  )

  const shouldShowSleepTriage = !isPastDate && !isSleepTriageDismissed && !isTriageStoredDismissed && (
    (userActualSleepMinutes != null && userActualSleepMinutes < 390) ||
    (userSubjectiveSleep != null && userSubjectiveSleep <= 4)
  )
  const [show100Celebration, setShow100Celebration] = useState<boolean>(false)

  // Guest Mode progressive profiling & onboarding card state
  const [showGuestOnboardingCard, setShowGuestOnboardingCard] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = safeLocalStorageGet('levl_onboarding_completed') === 'true'
      const dismissed = safeLocalStorageGet('levl_guest_banner_dismissed') === 'true'
      setShowGuestOnboardingCard(!completed && !dismissed)
    }
  }, [])

  const handleDismissGuestCard = useCallback(() => {
    setShowGuestOnboardingCard(false)
    safeLocalStorageSet('levl_guest_banner_dismissed', 'true')
  }, [])

  const isNewGuestUser = useMemo(() => {
    if (typeof window === 'undefined') return false
    const completed = safeLocalStorageGet('levl_onboarding_completed') === 'true'
    return !completed && (!tasks || tasks.length === 0)
  }, [tasks])

  const guestKickstartProtocol = useMemo(() => {
    if (typeof window === 'undefined') return null
    return safeLocalStorageGet('levl_active_protocol') || null
  }, [])

  const [isAdHocModalOpen, setIsAdHocModalOpen] = useState(false)
  const [asNeededSlot, setAsNeededSlot] = useState<string | undefined>(undefined)
  const [asNeededModalityId, setAsNeededModalityId] = useState<string | undefined>(undefined)

  const resolveTaskModality = useCallback((task: DailyProtocolTask | null | undefined, fallbackModalityId?: string): Modality | undefined => {
    if (task?.loose_modality) return task.loose_modality
    if (task?.protocol_step?.modality) return task.protocol_step.modality
    const rawId = task?.modality_id || task?.protocol_step?.modality_id || fallbackModalityId
    if (rawId && allModalities.length > 0) {
      const rawLower = rawId.toLowerCase().trim()
      const rawUnderscore = rawLower.replace(/-/g, '_')
      const rawDash = rawLower.replace(/_/g, '-')
      const found = allModalities.find(m => {
        const mId = m.id?.toLowerCase().trim()
        const mSlug = m.slug?.toLowerCase().trim()
        return mId === rawLower || mId === rawUnderscore || mId === rawDash ||
               mSlug === rawLower || mSlug === rawUnderscore || mSlug === rawDash
      })
      if (found) return found
    }
    if (rawId && benchItems.length > 0) {
      const bench = benchItems.find(b => b.modality_id === rawId || (b as any).id === rawId)
      if (bench?.modality) return bench.modality
    }
    return undefined
  }, [allModalities, benchItems])

  const resolveTaskModalityName = useCallback((task: DailyProtocolTask | null | undefined, fallbackModalityId?: string): string => {
    const mod = resolveTaskModality(task, fallbackModalityId)
    if (mod?.display_name) return mod.display_name
    if (mod?.name) return mod.name

    const rawId = task?.modality_id || task?.protocol_step?.modality_id || fallbackModalityId
    if (rawId && allModalities.length > 0) {
      const rawLower = rawId.toLowerCase().trim()
      const rawUnderscore = rawLower.replace(/-/g, '_')
      const rawDash = rawLower.replace(/_/g, '-')
      const found = allModalities.find(m => {
        const mId = m.id?.toLowerCase().trim()
        const mSlug = m.slug?.toLowerCase().trim()
        return mId === rawLower || mId === rawUnderscore || mId === rawDash ||
               mSlug === rawLower || mSlug === rawUnderscore || mSlug === rawDash
      })
      if (found?.display_name) return found.display_name
      if (found?.name) return found.name
    }

    if (rawId && benchItems.length > 0) {
      const bench = benchItems.find(b => b.modality_id === rawId || (b as any).id === rawId)
      if (bench?.modality?.display_name) return bench.modality.display_name
      if (bench?.modality?.name) return bench.modality.name
    }

    if (task?.execution_details?.custom_name) return task.execution_details.custom_name
    if (task?.execution_details?.modality_name) return task.execution_details.modality_name
    if ((task?.protocol_step as any)?.title) return (task?.protocol_step as any).title
    if ((task?.protocol_step as any)?.name) return (task?.protocol_step as any).name

    if (rawId) {
      return rawId
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
    }

    return 'Protocol Task'
  }, [resolveTaskModality, allModalities, benchItems])

  const isTaskSupplement = useCallback((task: DedupedTask): boolean => {
    // 1. Explicit supplement timing slot check
    const rawSlot = (task.timing_slot || task.protocol_step?.timing_slot || '').toLowerCase()
    if (
      rawSlot === 'morning_supplement_stack' ||
      rawSlot === 'evening_supplement_stack' ||
      rawSlot === 'midday_stack' ||
      rawSlot.includes('supplement') ||
      rawSlot.includes('stack')
    ) {
      return true
    }

    // 2. Modality category check using resolveTaskModality (queries allModalities + benchItems)
    const mod = resolveTaskModality(task)
    if (mod) {
      const cat = (mod.category || '').toLowerCase()
      const type = (mod.modality_type || '').toLowerCase()
      if (
        cat.includes('supplement') ||
        cat.includes('nutraceutical') ||
        cat.includes('peptide') ||
        type === 'supplement'
      ) {
        return true
      }
    }

    // 3. Modality name or custom category check
    const customCat = (task.execution_details?.custom_category || '').toLowerCase()
    if (customCat.includes('supplement') || customCat.includes('peptide')) {
      return true
    }

    return false
  }, [resolveTaskModality])

  const asNeededQuickPills = useMemo(() => {
    const fromBench = benchItems
      .filter(b => {
        const customTiming = (b.custom_timing || '').toLowerCase()
        const notes = (b.notes || '').toLowerCase()
        const sched = getModalityScheduleConfig(b.modality_id, b.modality)
        return (
          sched?.schedule_mode === 'as_needed' ||
          customTiming.includes('as needed') ||
          customTiming.includes('as-needed') ||
          customTiming.includes('prn') ||
          customTiming.includes('spontaneous') ||
          notes.includes('as needed')
        )
      })
      .map(b => ({
        id: b.modality_id,
        name: b.modality?.display_name || b.modality?.name || resolveTaskModalityName(null, b.modality_id)
      }))

    if (fromBench.length > 0) return fromBench.slice(0, 6)

    // Curated spontaneous / as-needed staples (no scheduled workout dump)
    return [
      { id: 'electrolytes', name: 'Electrolytes' },
      { id: 'cold_plunge', name: 'Cold Plunge' },
      { id: 'sauna', name: 'Sauna' },
      { id: 'melatonin', name: 'Melatonin' },
      { id: 'breathwork', name: 'Box Breathing' }
    ]
  }, [benchItems])
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [studioModalData, setStudioModalData] = useState<{
    isOpen: boolean
    initialData: CustomModalityInitialData | null
  }>({
    isOpen: false,
    initialData: null
  })
  const [rescheduleTask, setRescheduleTask] = useState<DailyProtocolTask | null>(null)
  const [rescheduleModality, setRescheduleModality] = useState<Modality | null>(null)
  const [isReschedulePastMissed, setIsReschedulePastMissed] = useState(false)

  const [showCustomizeOutcomesModal, setShowCustomizeOutcomesModal] = useState(false)
  const [relevantOutcomes, setRelevantOutcomes] = useState<OutcomeDimension[]>([])
  const [activeModality, setActiveModality] = useState<Modality | null>(null)

  const [completionToast, setCompletionToast] = useState<{ id: string; name: string; dose?: string } | null>(null)
  const [actionFeedback, setActionFeedback] = useState<{ type: 'bench' | 'eliminate'; message: string } | null>(null)
  const [recentlyCompletedIds, setRecentlyCompletedIds] = useState<Set<string>>(new Set())
  const [outcomesRefreshKey, setOutcomesRefreshKey] = useState<number>(0)

  // Tracking panel for protocol groups
  const [activeGroupTrackKey, setActiveGroupTrackKey] = useState<string | null>(null)
  const [groupTrackValues, setGroupTrackValues] = useState<Record<string, number>>({})
  const [touchedGroupOutcomes, setTouchedGroupOutcomes] = useState<Record<string, boolean>>({})
  const [isSavingGroupTrack, setIsSavingGroupTrack] = useState(false)

  // Scroll-Driven Circadian Spine & Icon Ignition Engine
  const timelineContainerRef = useRef<HTMLDivElement | null>(null)
  const previousSectionRef = useRef<HTMLDivElement | null>(null)
  const groupHeaderRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const beaconRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [spineHeight, setSpineHeight] = useState<number>(0)
  const [ignitedGroupKeys, setIgnitedGroupKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    let animationFrameId: number

    const updateScrollSpine = () => {
      if (!timelineContainerRef.current) return
      const containerRect = timelineContainerRef.current.getBoundingClientRect()
      // Trigger horizon is at 45% of viewport height (natural reading eye level)
      const triggerHorizon = window.innerHeight * 0.45

      // Calculate how far down the timeline container the horizon has reached:
      const relativeTravel = triggerHorizon - containerRect.top
      const totalHeight = containerRect.height

      // Spine starts revealing when container enters horizon, up to totalHeight
      const activeHeight = Math.max(0, Math.min(relativeTravel, totalHeight))
      setSpineHeight(activeHeight)

      // Check each time-of-day block beacon center position:
      // Only ignite when the scroll photon physically reaches that exact circle/sun beacon center
      const newlyIgnited = new Set<string>()
      Object.entries(beaconRefs.current).forEach(([key, el]) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        // Guard against zero-size or unrendered/collapsed beacons
        if (rect.width === 0 && rect.height === 0) return
        const beaconCenterY = rect.top + rect.height / 2
        if (beaconCenterY <= triggerHorizon + 12) {
          newlyIgnited.add(key)
        }
      })

      setIgnitedGroupKeys(newlyIgnited)
    }

    const onScrollOrResize = () => {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(updateScrollSpine)
    }

    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize, { passive: true })

    // Initial run
    updateScrollSpine()

    return () => {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [tasks.length, calendarViewMode, viewMode])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = safeLocalStorageGet('levl_completion_mode') as 'outcome' | 'fast'
      if (savedMode) setCompletionMode(savedMode)
    }
  }, [])

  const handleCompletionModeChange = (mode: 'outcome' | 'fast') => {
    setCompletionMode(mode)
    if (typeof window !== 'undefined') {
      safeLocalStorageSet('levl_completion_mode', mode)
    }
  }

  const navigateToDate = (targetDate: Date) => {
    setActiveDate(targetDate)
    const todayFormatted = format(new Date(), 'yyyy-MM-dd')
    const dStr = format(targetDate, 'yyyy-MM-dd')
    const isLateNight = isLateNightCarryoverWindow(new Date(), profile?.ideal_wake_time || cachedWakeTime)
    // If user explicitly chooses today during late night carryover, set ?date= so URL doesn't revert to yesterday
    const url = (dStr === todayFormatted && !isLateNight) ? '/today' : `/today?date=${dStr}`
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', url)
    }
  }

  const infradianStatus = useMemo(() => {
    return calculateInfradianStatus(profile, dateStr)
  }, [profile, dateStr])

  // Mobile Pull to Refresh State
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const pullTouchStartRef = useRef<number | null>(null)

  const handlePullTouchStart = (e: React.TouchEvent) => {
    if (typeof window !== 'undefined' && window.scrollY <= 0) {
      pullTouchStartRef.current = e.touches[0].clientY
    }
  }

  const handlePullTouchMove = (e: React.TouchEvent) => {
    if (pullTouchStartRef.current === null || isRefreshing) return
    const currentY = e.touches[0].clientY
    const deltaY = currentY - pullTouchStartRef.current

    if (deltaY > 0 && typeof window !== 'undefined' && window.scrollY <= 0) {
      const dampened = Math.min(80, deltaY * 0.4)
      setPullDistance(dampened)
    }
  }

  const handlePullTouchEnd = async () => {
    if (pullTouchStartRef.current === null) return
    if (pullDistance >= 45 && !isRefreshing) {
      setIsRefreshing(true)
      triggerHaptic('light')
      await refreshTodayTasks()
      setTimeout(() => {
        setIsRefreshing(false)
        setPullDistance(0)
      }, 400)
    } else {
      setPullDistance(0)
    }
    pullTouchStartRef.current = null
  }

  const refreshTodayTasks = async () => {
    window.dispatchEvent(new CustomEvent('levl_sync_start'))
    const localUserId = authUserId || getLocalUserId()
    try {
      const [currentTasks, bench] = await Promise.all([
        getDailyProtocolTasks(localUserId, dateStr),
        getBenchItems(localUserId)
      ])
      setTasks(currentTasks)
      if (bench) setBenchItems(bench)
      if (typeof window !== 'undefined') {
        safeLocalStorageSet('levl_cached_tasks_' + dateStr, JSON.stringify(currentTasks))
        if (bench) safeLocalStorageSet('levl_cached_bench_items', JSON.stringify(bench))
      }
    } finally {
      window.dispatchEvent(new CustomEvent('levl_sync_end'))
    }
  }

  const handleScrollToModality = (nameOrId: string, isProtocol = false) => {
    if (!nameOrId || typeof window === 'undefined') return
    const clean = nameOrId.toLowerCase().trim()

    // 1. Uncollapse any groups that might hide the target
    if (isProtocol) {
      setViewMode('protocol')
      setSelectedProtocolFilter('all')
      const targetGroup = Object.keys(protocolGroups).find(g => {
        const gLow = g.toLowerCase()
        return gLow.includes(clean) || clean.includes(gLow)
      })
      if (targetGroup) {
        setCollapsedGroups({ [targetGroup]: false })
      } else {
        setCollapsedGroups({})
      }
    } else {
      setCollapsedGroups({})
      setSelectedProtocolFilter('all')
      setSelectedMainCategories(['all'])
      setSelectedSubCategories([])
      setSelectedIsolatedOutcome(null)
      setIsCompletedSectionExpanded(true)
      setIsSnoozedSectionExpanded(true)
      setIsSkippedSectionExpanded(true)
    }

    // 2. Retry up to 15 times (1.5s total) to account for React re-render & DOM hydration
    let attempts = 0
    const tryScroll = () => {
      attempts++
      let el: HTMLElement | null = null

      if (isProtocol) {
        // Try finding protocol group container first
        const protoSlug = clean.replace(/[^a-z0-9]+/g, '-')
        const protoSelector = `[data-protocol-id="${clean}"], [data-protocol-name*="${clean}"], [id="protocol-group-${protoSlug}"], [id*="protocol-group-${clean}"]`
        el = document.querySelector(protoSelector) as HTMLElement | null
      }

      if (!el) {
        // Find task card by data attributes
        const selector = `[data-modality-id="${clean}"], [data-modality-name*="${clean}"], [data-protocol-id="${clean}"], [data-protocol-name*="${clean}"], [id*="${clean}"]`
        el = document.querySelector(selector) as HTMLElement | null
      }

      if (!el) {
        // Fallback: search task cards for text content match
        const allCards = document.querySelectorAll('[id^="task-card-"]')
        for (const card of Array.from(allCards)) {
          if (card.textContent?.toLowerCase().includes(clean)) {
            el = card as HTMLElement
            break
          }
        }
      }

      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const ringColor = isProtocol ? 'ring-purple-400' : 'ring-emerald-400'
        const shadowColor = isProtocol ? 'shadow-[0_0_40px_rgba(168,85,247,0.9)]' : 'shadow-[0_0_40px_rgba(52,211,153,0.9)]'
        el.classList.add(
          'ring-4',
          ringColor,
          shadowColor,
          'scale-[1.02]',
          'transition-all',
          'duration-500',
          'z-30'
        )
        setTimeout(() => {
          el?.classList.remove(
            'ring-4',
            ringColor,
            shadowColor,
            'scale-[1.02]',
            'z-30'
          )
        }, 3500)
      } else if (attempts < 15) {
        setTimeout(tryScroll, 100)
      }
    }

    setTimeout(tryScroll, 120)
  }

  // Deep-linking: Automatically scroll to and highlight modality or protocol from URL params (e.g. from Explore or Bench "In Today's Plan")
  useEffect(() => {
    if (!modalityParam && !protocolParam) return

    // 1. Ensure Calendar View is Today
    if (calendarViewMode !== 'today') {
      setCalendarViewMode('today')
    }

    // 2. If it's a protocol, set viewMode to protocol and uncollapse it
    if (protocolParam) {
      setViewMode('protocol')
      setSelectedProtocolFilter('all')
      const pClean = protocolParam.toLowerCase().trim()
      const targetGroup = Object.keys(protocolGroups).find(g => {
        const gLow = g.toLowerCase()
        return gLow.includes(pClean) || pClean.includes(gLow)
      })
      if (targetGroup) {
        setCollapsedGroups({ [targetGroup]: false })
      } else {
        setCollapsedGroups({})
      }
    } else {
      setSelectedProtocolFilter('all')
      setSelectedMainCategories(['all'])
      setSelectedSubCategories([])
      setSelectedIsolatedOutcome(null)
      setCollapsedGroups({})
    }

    // 3. Expand status sections
    setIsCompletedSectionExpanded(true)
    setIsSnoozedSectionExpanded(true)
    setIsSkippedSectionExpanded(true)

    // 4. Check if target item is already present in tasks; if not (e.g. freshly added in Explore), fetch fresh
    const target = (modalityParam || protocolParam || '').toLowerCase()
    const nameClean = (nameParam || '').toLowerCase()
    const itemExists = tasks.some(t => {
      const mId = (t.modality_id || t.protocol_step?.modality_id || '').toLowerCase()
      const mName = (t.protocol_step?.modality?.display_name || t.protocol_step?.modality?.name || t.loose_modality?.display_name || t.loose_modality?.name || '').toLowerCase()
      const pId = (t.protocol_step?.protocol_id || t.lineages?.[0]?.protocol_id || '').toLowerCase()
      const pName = (t.protocol_step?.protocol?.name || t.lineages?.[0]?.protocol_name || '').toLowerCase()
      return (
        (modalityParam && (mId === target || mName.includes(target) || (nameClean && mName.includes(nameClean)))) ||
        (protocolParam && (pId === target || pName.includes(target) || (nameClean && pName.includes(nameClean))))
      )
    })

    if (!itemExists) {
      refreshTodayTasks()
    }

    // 5. Scroll and illuminate the target card/group
    handleScrollToModality(modalityParam || protocolParam || nameParam || '', !!protocolParam)
  }, [modalityParam, protocolParam, nameParam, dateStr])

  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e?.detail) {
        setProfile(e.detail)
      }
    }
    const handleTaskOrModalityUpdate = () => {
      refreshTodayTasks()
    }
    window.addEventListener('levl_profile_updated', handleProfileUpdate)
    window.addEventListener('levl_modality_created', handleTaskOrModalityUpdate)
    window.addEventListener('levl_task_status_changed', handleTaskOrModalityUpdate)
    window.addEventListener('levl_bench_updated', handleTaskOrModalityUpdate)
    window.addEventListener('levl_schedule_updated', handleTaskOrModalityUpdate)
    window.addEventListener('levl_tasks_updated', handleTaskOrModalityUpdate)
    return () => {
      window.removeEventListener('levl_profile_updated', handleProfileUpdate)
      window.removeEventListener('levl_modality_created', handleTaskOrModalityUpdate)
      window.removeEventListener('levl_task_status_changed', handleTaskOrModalityUpdate)
      window.removeEventListener('levl_bench_updated', handleTaskOrModalityUpdate)
      window.removeEventListener('levl_schedule_updated', handleTaskOrModalityUpdate)
      window.removeEventListener('levl_tasks_updated', handleTaskOrModalityUpdate)
    }
  }, [dateStr, authUserId])

  useEffect(() => {
    // 1. Resolve local user ID synchronously to start fetching immediately
    const localUserId = authUserId || (typeof window !== 'undefined' ? (safeLocalStorageGet('levl_local_user_id') || getLocalUserId()) : null)

    // Only block if we truly don't have ANY localUserId yet and auth is actively resolving
    if (!localUserId && authLoading) return

    const effectiveUserId = localUserId || 'guest_default'

    // If auth state resolved a different user than what was previously loaded, force full re-fetch
    if (lastLoadedUserIdRef.current && lastLoadedUserIdRef.current !== effectiveUserId) {
      hasLoadedInitialCatalogRef.current = false
    }

    // 0ms SWR Memory/LocalStorage Hydration for Target Date
    const memCached = tasksDateCacheRef.current.get(dateStr)
    if (memCached && memCached.length > 0) {
      setTasks(memCached)
      setLoading(false)
      setIsDateSwitching(false)
    } else if (typeof window !== 'undefined') {
      try {
        const rawLocal = localStorage.getItem(`levl_cached_tasks_${dateStr}`)
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTasks(parsed)
            tasksDateCacheRef.current.set(dateStr, parsed)
            setLoading(false)
            setIsDateSwitching(false)
          }
        }
      } catch (e) {}
    }

    async function loadData() {
      const reqId = ++activeDateReqIdRef.current
      lastLoadedUserIdRef.current = effectiveUserId
      window.dispatchEvent(new CustomEvent('levl_sync_start'))

      try {
        const hasCached = tasksDateCacheRef.current.has(dateStr) || (typeof window !== 'undefined' && localStorage.getItem(`levl_cached_tasks_${dateStr}`) !== null)
        if (!hasCached && (!tasks || tasks.length === 0)) {
          setLoading(true)
        }

        if (!hasLoadedInitialCatalogRef.current) {
          // 1. Fetch profile and tasks first to unlock the UI immediately
          const [userProfile, currentTasks] = await Promise.all([
            getOrCreateUserProfile(effectiveUserId),
            getDailyProtocolTasks(effectiveUserId, dateStr)
          ])

          if (reqId !== activeDateReqIdRef.current) return

          const fallbackProfile: UserProfile = {
            id: effectiveUserId,
            local_user_id: effectiveUserId,
            sleep_schedule: { wake_time: '07:00', bed_time: '23:00' },
            outcome_preference_scores: {},
            biological_metrics: {}
          } as any
          const effectiveProfile = userProfile || fallbackProfile

          setProfile(effectiveProfile)
          setTasks(currentTasks)
          tasksDateCacheRef.current.set(dateStr, currentTasks)
          setLoading(false)
          setIsDateSwitching(false)
          hasLoadedInitialCatalogRef.current = true

          if (typeof window !== 'undefined') {
            safeLocalStorageSet('levl_cached_user_profile', JSON.stringify(userProfile))
            safeLocalStorageSet('levl_cached_tasks_' + dateStr, JSON.stringify(currentTasks))
          }

          // 2. Fetch secondary catalog, bench & outcomes asynchronously in background
          Promise.all([
            getOutcomeDimensions(),
            getProtocols(),
            getBenchItems(effectiveUserId),
            getDailyWellbeingCheckin(effectiveUserId, dateStr)
          ]).then(([outcomes, protocols, bench, todayCheckin]) => {
            if (reqId !== activeDateReqIdRef.current) return
            if (outcomes) setAllOutcomes(outcomes)
            if (protocols) setAvailableProtocols(protocols.map((p: any) => ({ id: p.id, name: p.name })))
            if (bench) setBenchItems(bench)
            if (todayCheckin) setWellbeingCheckin(todayCheckin)
            if (typeof window !== 'undefined' && bench) {
              safeLocalStorageSet('levl_cached_bench_items', JSON.stringify(bench))
            }
          }).catch(console.error)
        } else {
          // In-place fast transition
          const [currentTasks, todayCheckin] = await Promise.all([
            getDailyProtocolTasks(effectiveUserId, dateStr),
            getDailyWellbeingCheckin(effectiveUserId, dateStr)
          ])

          if (reqId !== activeDateReqIdRef.current) return

          setTasks(currentTasks)
          tasksDateCacheRef.current.set(dateStr, currentTasks)
          setWellbeingCheckin(todayCheckin || null)
          setLoading(false)
          setIsDateSwitching(false)
          if (typeof window !== 'undefined') {
            safeLocalStorageSet('levl_cached_tasks_' + dateStr, JSON.stringify(currentTasks))
          }
        }
      } catch (err) {
        console.error('Error loading Today data:', err)
      } finally {
        if (reqId === activeDateReqIdRef.current) {
          setLoading(false)
          setIsDateSwitching(false)
          window.dispatchEvent(new CustomEvent('levl_sync_end'))
        }
      }
    }

    if (loadDebounceTimerRef.current) {
      clearTimeout(loadDebounceTimerRef.current)
    }
    loadDebounceTimerRef.current = setTimeout(() => {
      loadData()
    }, 40)

    const handleAuthChange = (e: any) => {
      const incomingUserId = e?.detail || authUserId || getLocalUserId()
      if (incomingUserId && lastLoadedUserIdRef.current === incomingUserId) {
        refreshTodayTasks()
        return
      }
      hasLoadedInitialCatalogRef.current = false
      if (loadDebounceTimerRef.current) clearTimeout(loadDebounceTimerRef.current)
      loadDebounceTimerRef.current = setTimeout(() => {
        loadData()
      }, 40)
    }

    window.addEventListener('levl_auth_user_changed', handleAuthChange)
    return () => {
      if (loadDebounceTimerRef.current) clearTimeout(loadDebounceTimerRef.current)
      window.removeEventListener('levl_auth_user_changed', handleAuthChange)
    }
  }, [dateStr, authUserId])

  // Multi-day task loader for 3day, week, and month views
  useEffect(() => {
    if (calendarViewMode === 'today' || authLoading) return

    async function loadMultiDay() {
      const localUserId = authUserId || safeLocalStorageGet('levl_local_user_id') || getLocalUserId()
      let datesToLoad: string[] = []

      if (calendarViewMode === '3day') {
        const d1 = subDays(currentDate, 1)
        const d2 = currentDate
        const d3 = addDays(currentDate, 1)
        datesToLoad = [format(d1, 'yyyy-MM-dd'), format(d2, 'yyyy-MM-dd'), format(d3, 'yyyy-MM-dd')]
      } else if (calendarViewMode === 'week' || calendarViewMode === 'pulse') {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 })
        const end = endOfWeek(currentDate, { weekStartsOn: 1 })
        datesToLoad = eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'))
      } else if (calendarViewMode === 'month') {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        const start = startOfWeek(monthStart, { weekStartsOn: 0 })
        const end = endOfWeek(monthEnd, { weekStartsOn: 0 })
        datesToLoad = eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'))
      }

      if (datesToLoad.length > 0) {
        const startDate = datesToLoad[0]
        const endDate = datesToLoad[datesToLoad.length - 1]
        const cacheKey = `${localUserId}_${calendarViewMode}_${startDate}_${endDate}`

        // 0ms SWR instant hydration from in-memory cache or localStorage
        const memCached = multiDayCacheRef.current.get(cacheKey)
        if (memCached && Object.keys(memCached).length > 0) {
          setMultiDayTasks(prev => ({ ...prev, ...memCached }))
        } else if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem(`levl_cached_multiday_${cacheKey}`)
            if (raw) {
              const parsed = JSON.parse(raw)
              if (parsed && Object.keys(parsed).length > 0) {
                setMultiDayTasks(prev => ({ ...prev, ...parsed }))
                multiDayCacheRef.current.set(cacheKey, parsed)
              }
            }
          } catch (e) {}
        }

        const reqId = ++activeMultiDayReqIdRef.current
        const result = await getMultiDayProtocolTasks(localUserId, startDate, endDate)
        if (reqId !== activeMultiDayReqIdRef.current) return

        if (result && Object.keys(result).length > 0) {
          multiDayCacheRef.current.set(cacheKey, result)
          setMultiDayTasks(prev => ({ ...prev, ...result }))
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(`levl_cached_multiday_${cacheKey}`, JSON.stringify(result))
            } catch (e) {}
          }
        }
      }
    }

    loadMultiDay()
  }, [calendarViewMode, currentDate, outcomesRefreshKey, authLoading, authUserId])

  const handleStatusChange = async (
    id: string, 
    status: string, 
    reason?: string, 
    completedAt?: string, 
    executionMetrics?: any, 
    executionDetails?: any
  ) => {
    const localUserId = getLocalUserId()
    const targetUuids: string[] = []
    const uuidSet = new Set<string>()

    const isSplit = id.includes('-split-')
    const splitNumber = isSplit ? parseInt(id.split('-split-')[1], 10) : 0
    const baseId = isSplit ? id.split('-split-')[0] : id

    // Resolve target task and modality from tasks or dedupedTasks
    const refTask = tasks.find(t => t.id === id || t.id === baseId) || dedupedTasks.find(t => t.id === id || t.id === baseId)
    const targetModalityId = (
      refTask?.modality_id || 
      refTask?.protocol_step?.modality_id || 
      refTask?.protocol_step?.modality?.id || 
      refTask?.loose_modality?.id || 
      ''
    ).trim().toLowerCase()

    // 1. Gather all IDs from original_tasks if deduped
    if ((refTask as any)?.original_tasks) {
      (refTask as any).original_tasks.forEach((ot: any) => {
        if (ot.id) {
          const rawId = ot.id.includes('-split-') ? ot.id.split('-split-')[0] : ot.id
          targetUuids.push(rawId)
          uuidSet.add(rawId)
        }
      })
    }

    // 2. Also check dedupedTasks for any matching entry
    const dedupedMatch = dedupedTasks.find(t => 
      t.id === id || 
      t.id === baseId || 
      (targetModalityId && (t.modality_id || t.protocol_step?.modality_id || t.loose_modality?.id || '').toLowerCase() === targetModalityId)
    )
    if (dedupedMatch?.original_tasks) {
      dedupedMatch.original_tasks.forEach(ot => {
        if (ot.id) {
          const rawId = ot.id.includes('-split-') ? ot.id.split('-split-')[0] : ot.id
          targetUuids.push(rawId)
          uuidSet.add(rawId)
        }
      })
    }

    // 3. Find all matching task instances for this modality on this scheduled date
    const normTargetMod = targetModalityId.replace(/-/g, '_')
    const matchingTasks = tasks.filter(t => {
      if (t.id === id || t.id === baseId || uuidSet.has(t.id)) return true
      if (normTargetMod) {
        const tMid = (t.modality_id || t.protocol_step?.modality_id || t.protocol_step?.modality?.id || t.loose_modality?.id || '').trim().toLowerCase().replace(/-/g, '_')
        if (tMid && tMid === normTargetMod) return true
      }
      if (refTask?.protocol_step_id && t.protocol_step_id && t.protocol_step_id === refTask.protocol_step_id) return true
      return false
    })

    matchingTasks.forEach(t => {
      targetUuids.push(t.id)
      uuidSet.add(t.id)
    })
    targetUuids.push(baseId)
    uuidSet.add(baseId)
    if (id) uuidSet.add(id)

    // Handle multi-dose split tracking
    let splitCompletedDoses: number[] | undefined = undefined
    if (isSplit && splitNumber > 0) {
      const existingCompletedDoses: number[] = refTask?.execution_details?.completed_doses || (refTask?.status === 'completed' ? [1, 2] : [])
      if (status === 'completed') {
        splitCompletedDoses = Array.from(new Set([...existingCompletedDoses, splitNumber]))
      } else if (status === 'pending') {
        splitCompletedDoses = existingCompletedDoses.filter(d => d !== splitNumber)
      }
    }

    // Anchor completion timestamp to selected historical day if backfilling past days
    let effectiveCompletedAt = completedAt
    if (status === 'completed') {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const targetDateStr = dateStr || todayStr

      if (effectiveCompletedAt) {
        const parsedDate = new Date(effectiveCompletedAt)
        if (!isNaN(parsedDate.getTime())) {
          const parsedDateStr = format(parsedDate, 'yyyy-MM-dd')
          if (parsedDateStr !== targetDateStr) {
            const [y, m, d] = targetDateStr.split('-').map(Number)
            const anchored = new Date(y, m - 1, d, parsedDate.getHours(), parsedDate.getMinutes(), parsedDate.getSeconds())
            effectiveCompletedAt = anchored.toISOString()
          }
        }
      } else {
        if (targetDateStr === todayStr) {
          effectiveCompletedAt = new Date().toISOString()
        } else {
          const now = new Date()
          const [y, m, d] = targetDateStr.split('-').map(Number)
          const histDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds())
          effectiveCompletedAt = histDate.toISOString()
        }
      }
    } else if (status !== 'completed' && !completedAt) {
      effectiveCompletedAt = undefined
    }

    // Clear recently completed markers and completion toast immediately when undoing / resetting to pending
    if (status !== 'completed') {
      setRecentlyCompletedIds(prev => {
        const next = new Set(prev)
        targetUuids.forEach(u => next.delete(u))
        next.delete(id)
        next.delete(baseId)
        return next
      })
      setCompletionToast(null)
    }

    // Optimistic UI update: If modality was eliminated, remove it immediately from today tasks
    if (status === 'contraindicated' || reason?.toLowerCase().includes('eliminated')) {
      const realId = id.includes('-split-') ? id.split('-split-')[0] : id
      const eliminatedTask = tasks.find(t => t.id === id || t.id === realId || uuidSet.has(t.id))
      const mId = (
        eliminatedTask?.modality_id || 
        eliminatedTask?.protocol_step?.modality_id || 
        eliminatedTask?.protocol_step?.modality?.id || 
        eliminatedTask?.loose_modality?.id || 
        ''
      ).trim().toLowerCase()

      setTasks(prev => prev.filter(t => {
        const taskMid = (
          t.modality_id || 
          t.protocol_step?.modality_id || 
          t.protocol_step?.modality?.id || 
          t.loose_modality?.id || 
          ''
        ).trim().toLowerCase()
        if (mId && taskMid === mId) return false
        if (t.id === id || t.id === realId || uuidSet.has(t.id)) return false
        return true
      }))
      if (mId) {
        setBenchItems(prev => [
          ...prev.filter(b => b.modality_id?.toLowerCase().trim() !== mId),
          { id: 'temp_' + mId, modality_id: mId, status: 'eliminated', local_user_id: localUserId, pinned: false, added_at: new Date().toISOString(), personal_notes: reason }
        ])
      }
      return
    }

    // Optimistic UI update across all matching tasks
    const updatedTasks = tasks.map(t => {
      if (uuidSet.has(t.id)) {
        let taskExecutionDetails = executionDetails !== undefined ? executionDetails : t.execution_details
        if (splitCompletedDoses !== undefined) {
          taskExecutionDetails = {
            ...(taskExecutionDetails || {}),
            completed_doses: splitCompletedDoses
          }
        } else if (status === 'pending' && taskExecutionDetails?.completed_doses) {
          const { completed_doses, ...rest } = taskExecutionDetails
          taskExecutionDetails = rest
        }

        const effectiveStatus = (splitCompletedDoses !== undefined)
          ? (splitCompletedDoses.length > 0 ? (status === 'completed' ? 'completed' : 'partial') : 'pending')
          : status

        return { 
          ...t, 
          status: effectiveStatus as any, 
          status_reason: reason, 
          completed_at: effectiveCompletedAt || (status === 'completed' ? new Date().toISOString() : undefined), 
          execution_metrics: executionMetrics || t.execution_metrics, 
          execution_details: taskExecutionDetails 
        }
      }
      return t
    })

    setTasks(updatedTasks)

    // Synchronously update in-memory SWR cache and localStorage so background cycles see fresh state
    tasksDateCacheRef.current.set(dateStr, updatedTasks)
    if (typeof window !== 'undefined') {
      safeLocalStorageSet('levl_cached_tasks_' + dateStr, JSON.stringify(updatedTasks))
    }

    // Check if this completion achieves 100% adherence for the day
    const willBeCompleted = status === 'completed'
    const pendingOtherTasks = updatedTasks.filter(t => {
      if (t.id === id || uuidSet.has(t.id)) return false
      if (t.status !== 'pending') return false
      if (isShieldActive && (t.status_reason?.toLowerCase().includes('80/20') || t.execution_details?.adaptive_muted)) return false
      return true
    })
    const achieves100Percent = willBeCompleted && pendingOtherTasks.length === 0 && tasks.length > 0

    // Tactile feedback on mobile devices (transfers to native iOS & Android apps via triggerHaptic)
    if (achieves100Percent) {
      triggerHaptic('success')
      setShow100Celebration(true)
      setTimeout(() => setShow100Celebration(false), 5000)
    } else {
      triggerHaptic(willBeCompleted ? 'light' : 'selection')
    }

    if (status === 'completed') {
      const completedTask = tasks.find(t => t.id === id || t.id === baseId || uuidSet.has(t.id))
      const modName = resolveTaskModalityName(completedTask)
      const dose = completedTask?.execution_details?.custom_dose || completedTask?.loose_modality?.dose_or_exposure || completedTask?.protocol_step?.modality?.dose_or_exposure
      setCompletionToast({ id: baseId, name: modName, dose })
      setRecentlyCompletedIds(prev => new Set(prev).add(id).add(baseId))

      // Green completed confirmation animation flashes on card for 0.5s, then task transitions to Completed Modalities
      setTimeout(() => {
        setRecentlyCompletedIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          next.delete(baseId)
          return next
        })
      }, 500)

      setTimeout(() => {
        setCompletionToast(null)
      }, 4000)
    }

    // Asynchronous background persistence across all affected rows in Supabase
    ;(async () => {
      try {
        const uniqueUuids = Array.from(new Set(targetUuids)).filter(
          u => u && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(u)
        )
        for (const uuid of uniqueUuids) {
          const existingTask = tasks.find(t => t.id === uuid)
          let finalDetails = executionDetails !== undefined ? executionDetails : existingTask?.execution_details
          if (splitCompletedDoses !== undefined) {
            finalDetails = { ...(finalDetails || {}), completed_doses: splitCompletedDoses }
          } else if (status === 'pending' && finalDetails?.completed_doses) {
            const { completed_doses, ...rest } = finalDetails
            finalDetails = rest
          }

          const effectiveStatus = (splitCompletedDoses !== undefined)
            ? (splitCompletedDoses.length > 0 ? (status === 'completed' ? 'completed' : 'partial') : 'pending')
            : status

          await updateDailyTaskStatus(uuid, effectiveStatus, reason, undefined, effectiveCompletedAt, executionMetrics, finalDetails)
        }
      } catch (err) {
        console.error('Error saving task status to database:', err)
      }
    })()
  }

  const handleWellbeingSave = async (
    mood: number, 
    energy: number, 
    stress: number, 
    sleep?: number, 
    sleepScore?: number, 
    customOutcomes?: Record<string, any>, 
    lastFoodTime?: string,
    actualBedtime?: string,
    actualWakeTime?: string,
    actualSleepMinutes?: number,
    sleepSource?: string
  ) => {
    const enrichedOutcomes = {
      ...(customOutcomes || {}),
      ...(actualBedtime ? { _actual_bedtime: actualBedtime } : {}),
      ...(actualWakeTime ? { _actual_wake_time: actualWakeTime } : {}),
      ...(actualSleepMinutes != null ? { _actual_sleep_minutes: actualSleepMinutes } : {}),
      ...(sleepSource ? { _sleep_source: sleepSource } : {})
    }

    // Optimistic in-memory update so child cards and live viewers update instantly
    const optimistic: WellbeingType = {
      id: wellbeingCheckin?.id || `checkin_${dateStr}`,
      local_user_id: getLocalUserId(),
      checkin_date: dateStr,
      mood_0_10: mood,
      energy_0_10: energy,
      stress_0_10: stress,
      subjective_sleep_0_10: sleep,
      sleep_score_0_100: sleepScore,
      actual_bedtime: actualBedtime,
      actual_wake_time: actualWakeTime,
      actual_sleep_minutes: actualSleepMinutes,
      sleep_source: sleepSource as any,
      last_food_time: lastFoodTime,
      custom_outcomes_jsonb: enrichedOutcomes,
      created_at: (wellbeingCheckin as any)?.created_at || (customOutcomes?._morning_logged_at) || `${dateStr}T08:00:00.000Z`,
      updated_at: new Date().toISOString()
    }
    setWellbeingCheckin(optimistic)

    const localUserId = getLocalUserId()
    const saved = await saveDailyWellbeingCheckin(localUserId, dateStr, mood, energy, stress, sleep, sleepScore, lastFoodTime, enrichedOutcomes)
    setWellbeingCheckin(saved)
  }

  const openTracker = (modality: Modality, sessionId: string, phase?: string) => {
    setActiveModality(modality)
    const mOutcomes = allOutcomes.filter(o => (modality.functional_outcomes_to_track || []).includes(o.id))
    setRelevantOutcomes(mOutcomes.length > 0 ? mOutcomes : allOutcomes.slice(0, 3))
    setShowCustomizeOutcomesModal(false)
  }

  const handleSaveCustomOutcomes = (modalityId: string, outcomeIds: string[]) => {
    setTasks(prev => prev.map(t => {
      const mId = t.modality_id || t.protocol_step?.modality_id
      if (mId === modalityId) {
        return {
          ...t,
          loose_modality: t.loose_modality ? { ...t.loose_modality, functional_outcomes_to_track: outcomeIds } : t.loose_modality,
          protocol_step: t.protocol_step ? {
            ...t.protocol_step,
            modality: t.protocol_step.modality ? { ...t.protocol_step.modality, functional_outcomes_to_track: outcomeIds } : t.protocol_step.modality
          } : t.protocol_step
        }
      }
      return t
    }))
  }

  const handleOutcomesSaved = (taskId: string) => {
    setOutcomesRefreshKey(prev => prev + 1)
  }

  const handleUpdateOutcomeTarget = async (outcomeId: string, newTarget: number, newEffort: number) => {
    if (!profile) return
    const updatedScores = {
      ...(profile.outcome_preference_scores || {}),
      [outcomeId]: newTarget,
      [`${outcomeId}_effort`]: newEffort
    }
    const updatedProfile = {
      ...profile,
      outcome_preference_scores: updatedScores
    }
    setProfile(updatedProfile)
    try {
      const { updateUserProfile } = await import('@/lib/data')
      await updateUserProfile(profile.local_user_id, { outcome_preference_scores: updatedScores })
    } catch (err) {
      console.error('Failed to save outcome target preference:', err)
    }
  }

  const handleAutoFixClash = async (clash: AntagonisticClash) => {
    const taskToShift = tasks.find(t => {
      const mId = t.modality_id || t.protocol_step?.modality_id
      return mId === clash.modalityA.id || mId === clash.modalityB.id
    })
    if (taskToShift) {
      const newSlot = clash.outcomeId.toLowerCase().includes('sleep') ? 'morning' : 'evening'
      await updateTaskExecutionDetails(taskToShift.id, { timing_slot: newSlot })
      await refreshTodayTasks()
    }
  }

  const handleOpenRescheduleModal = (task: DailyProtocolTask) => {
    setRescheduleTask(task)
    const mod = task.loose_modality || task.protocol_step?.modality || null
    setRescheduleModality(mod)
    setIsReschedulePastMissed(isPastDate)
    setIsRescheduleModalOpen(true)
  }

  const handleExecuteReschedule = async (
    action: RescheduleActionType, 
    customDateStr?: string, 
    newTimingSlot?: string
  ) => {
    if (!rescheduleTask || !profile) return
    const localUserId = profile.local_user_id
    const modalityId = rescheduleTask.modality_id || rescheduleTask.protocol_step?.modality_id
    const targetTaskId = rescheduleTask.id
    const slotToUse = newTimingSlot || 'evening'
    const cleanSlotName = slotToUse.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

    if (action === 'move_to_bench') {
      const taskToBench = rescheduleTask
      setIsRescheduleModalOpen(false)
      setRescheduleTask(null)
      setRescheduleModality(null)
      if (taskToBench) {
        handleMoveToBench(taskToBench)
      }
      return
    }

    if (action === 'eliminate_entirely') {
      const taskToEliminate = rescheduleTask
      setIsRescheduleModalOpen(false)
      setRescheduleTask(null)
      setRescheduleModality(null)
      if (taskToEliminate) {
        handleEliminateEntirely(taskToEliminate, 'Eliminated from schedule options')
      }
      return
    }

    // 1. INSTANT OPTIMISTIC UI STATE UPDATE (0ms delay)
    let updatedStatus: any = 'skipped'
    let updatedReason: string = 'Skipped'
    let updatedSlot = rescheduleTask.timing_slot

    if (action === 'snooze_later_today') {
      // Keep task active/pending in the newly selected time slot so it appears in that time block immediately
      updatedStatus = 'pending'
      updatedReason = `Moved to ${cleanSlotName}`
      updatedSlot = slotToUse
    } else if (action === 'skip_session') {
      updatedStatus = 'skipped'
      updatedReason = 'Skipped'
    } else if (action === 'slide_forward') {
      updatedStatus = 'skipped'
      updatedReason = 'Rescheduled to Tomorrow'
    } else if (action === 'swap_rest_day') {
      updatedStatus = 'skipped'
      updatedReason = 'Swapped with Rest Day'
    } else if (action === 'custom_date' && customDateStr) {
      updatedStatus = 'skipped'
      updatedReason = `Rescheduled to ${customDateStr}`
    }

    setTasks(prev => prev.map(t => {
      if (t.id === targetTaskId || t.id.startsWith(targetTaskId + '-split-')) {
        return {
          ...t,
          status: updatedStatus,
          status_reason: updatedReason,
          timing_slot: updatedSlot,
          execution_details: {
            ...(t.execution_details || {}),
            custom_timing: action === 'snooze_later_today' ? cleanSlotName : (t.execution_details?.custom_timing)
          }
        }
      }
      return t
    }))

    // Tactile haptic feedback
    triggerHaptic('medium')

    // Instantly close modal so user experiences instant 0ms latency
    setIsRescheduleModalOpen(false)
    setRescheduleTask(null)
    setRescheduleModality(null)

    // 2. Asynchronous background persistence
    ;(async () => {
      try {
        if (action === 'snooze_later_today') {
          await updateDailyTaskStatus(
            targetTaskId, 
            'pending', 
            `Moved to ${cleanSlotName}`, 
            undefined, 
            undefined, 
            undefined, 
            {
              ...(rescheduleTask.execution_details || {}),
              custom_timing: cleanSlotName
            }, 
            slotToUse
          )
          if (modalityId) {
            await upsertBenchItemOverride(
              localUserId,
              modalityId,
              rescheduleTask.execution_details?.custom_dose || '',
              cleanSlotName,
              rescheduleTask.execution_details?.notes
            )
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('levl_schedule_updated'))
            window.dispatchEvent(new CustomEvent('levl_tasks_updated'))
          }
        } else if (action === 'skip_session') {
          await updateDailyTaskStatus(targetTaskId, 'skipped', 'Skipped')
        } else if (action === 'slide_forward') {
          const tomorrow = format(addDays(parseLocalDate(dateStr), 1), 'yyyy-MM-dd')
          if (modalityId) {
            await createDailyTask(localUserId, tomorrow, modalityId)
          }
          await updateDailyTaskStatus(targetTaskId, 'skipped', 'Rescheduled to Tomorrow')
        } else if (action === 'swap_rest_day') {
          const targetDate = format(addDays(parseLocalDate(dateStr), 2), 'yyyy-MM-dd')
          if (modalityId) {
            await createDailyTask(localUserId, targetDate, modalityId)
          }
          await updateDailyTaskStatus(targetTaskId, 'skipped', 'Swapped with Rest Day')
        } else if (action === 'custom_date' && customDateStr) {
          if (modalityId) {
            await createDailyTask(localUserId, customDateStr, modalityId)
          }
          await updateDailyTaskStatus(targetTaskId, 'skipped', `Rescheduled to ${customDateStr}`)
        }
      } catch (err) {
        console.error('Error executing reschedule action in background:', err)
      }
    })()
  }

  const handleMoveTaskToSlot = async (taskId: string, targetSlotKey: string, targetTaskId?: string) => {
    const localUserId = authUserId || profile?.local_user_id || getLocalUserId()
    const baseId = taskId.includes('-split-') ? taskId.split('-split-')[0] : taskId
    const task = tasks.find(t => 
      t.id === taskId || 
      t.id === baseId || 
      t.id.startsWith(baseId + '-split-') ||
      (t.modality_id && (t.modality_id === taskId || t.modality_id === baseId)) ||
      (t.protocol_step?.modality_id && (t.protocol_step.modality_id === taskId || t.protocol_step.modality_id === baseId)) ||
      (t.protocol_step?.modality?.id && (t.protocol_step.modality.id === taskId || t.protocol_step.modality.id === baseId)) ||
      (t.protocol_step?.modality?.slug && (t.protocol_step.modality.slug === taskId || t.protocol_step.modality.slug === baseId)) ||
      (t.loose_modality?.id && (t.loose_modality.id === taskId || t.loose_modality.id === baseId)) ||
      (t.execution_details?.modality_name && t.execution_details.modality_name.toLowerCase() === taskId.toLowerCase())
    )
    if (!task) return

    const cleanSlotName = targetSlotKey
      .split('_')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    const modalityId = 
      task.protocol_step?.modality_id || 
      task.protocol_step?.modality?.id || 
      task.modality_id || 
      task.loose_modality?.id

    // 1. Optimistic UI update across today's state
    setTasks(prev => {
      const updated = prev.map(t => {
        const matchId = 
          t.id === taskId || 
          t.id === baseId || 
          t.id.startsWith(baseId + '-split-') ||
          (modalityId && (
            t.modality_id === modalityId || 
            t.protocol_step?.modality_id === modalityId ||
            t.protocol_step?.modality?.id === modalityId ||
            t.loose_modality?.id === modalityId
          ))
        if (matchId) {
          return {
            ...t,
            timing_slot: targetSlotKey,
            protocol_step: t.protocol_step ? {
              ...t.protocol_step,
              timing_slot: targetSlotKey
            } : undefined,
            execution_details: {
              ...(t.execution_details || {}),
              custom_timing: cleanSlotName
            }
          }
        }
        return t
      })

      // If reordering relative to a target task, move item in array
      if (targetTaskId && targetTaskId !== taskId) {
        const movedIdx = updated.findIndex(t => t.id === taskId || t.id.startsWith(taskId + '-split-'))
        if (movedIdx !== -1) {
          const [movedItem] = updated.splice(movedIdx, 1)
          const targetIdx = updated.findIndex(t => 
            t.id === targetTaskId || 
            t.modality_id === targetTaskId || 
            t.protocol_step?.modality_id === targetTaskId
          )
          if (targetIdx !== -1) {
            updated.splice(targetIdx, 0, movedItem)
          } else {
            updated.push(movedItem)
          }
        }
      }

      return updated
    })

    // 2. Optimistic update of user bench items for future-day hydration
    if (modalityId) {
      setBenchItems(prev => prev.map(b => {
        if (b.modality_id === modalityId) {
          return {
            ...b,
            custom_timing: cleanSlotName
          }
        }
        return b
      }))
    }

    triggerHaptic('selection')

    // 3. Background database persistence
    ;(async () => {
      try {
        await updateDailyTaskStatus(
          baseId,
          task.status || 'pending',
          `Moved to ${cleanSlotName}`,
          undefined,
          task.completed_at,
          task.execution_metrics,
          {
            ...(task.execution_details || {}),
            custom_timing: cleanSlotName
          },
          targetSlotKey
        )

        if (modalityId && localUserId) {
          // Save bench item override for future-day sync
          await upsertBenchItemOverride(
            localUserId,
            modalityId,
            task.execution_details?.custom_dose || '',
            cleanSlotName,
            task.execution_details?.notes
          )

          // Update any scheduled future tasks in Supabase for this modality
          try {
            if (supabase) {
              await supabase
                .from('daily_protocol_tasks')
                .update({
                  timing_slot: targetSlotKey,
                  execution_details: {
                    ...(task.execution_details || {}),
                    custom_timing: cleanSlotName
                  }
                })
                .eq('local_user_id', localUserId)
                .eq('modality_id', modalityId)
                .gte('task_date', dateStr)
            }
          } catch {
            // Ignore future-day bulk update error
          }
        }
      } catch (err) {
        console.error('Failed to persist task move to slot:', err)
      }
    })()
  }

  const handleMoveToBench = async (taskOrModalityId: DailyProtocolTask | string) => {
    if (!profile) return
    const localUserId = profile.local_user_id
    let mId: string | undefined
    let taskId: string | undefined

    if (typeof taskOrModalityId === 'string') {
      mId = taskOrModalityId
    } else if (taskOrModalityId && typeof taskOrModalityId === 'object') {
      mId = taskOrModalityId.modality_id || taskOrModalityId.protocol_step?.modality_id
      taskId = taskOrModalityId.id
    }

    if (mId) {
      const modName = resolveTaskModalityName(typeof taskOrModalityId === 'object' ? taskOrModalityId : null, mId)
      setActionFeedback({
        type: 'bench',
        message: `Moved "${modName}" to Bench`
      })

      // 0.5-second visual confirmation before removing task card from view
      await new Promise(r => setTimeout(r, 500))

      setTasks(prev => prev.filter(t => (t.modality_id || t.protocol_step?.modality_id) !== mId))
      setBenchItems(prev => [
        ...prev.filter((b: any) => b.modality_id !== mId), 
        { 
          id: 'temp_' + mId, 
          modality_id: mId, 
          status: 'benched', 
          local_user_id: localUserId, 
          pinned: false, 
          added_at: new Date().toISOString() 
        }
      ])

      try {
        const { moveModalityToBench, getBenchItems } = await import('@/lib/data')
        await moveModalityToBench(localUserId, mId, taskId)
        const bItems = await getBenchItems(localUserId)
        setBenchItems(bItems)
      } catch (err) {
        console.error('Error benching modality:', err)
        await refreshTodayTasks()
      } finally {
        setTimeout(() => setActionFeedback(null), 1500)
      }
    }
  }

  const handleEliminateEntirely = async (task: DailyProtocolTask, reason?: string, selectedReasons?: string[]) => {
    if (!profile) return
    const mId = task.modality_id || task.protocol_step?.modality_id
    if (mId) {
      const localUserId = profile.local_user_id
      const modName = resolveTaskModalityName(task)
      setActionFeedback({
        type: 'eliminate',
        message: `Eliminated "${modName}" from Schedule (Still in Library)`
      })

      // 0.5-second visual confirmation before removing task card from view
      await new Promise(r => setTimeout(r, 500))

      setTasks(prev => prev.filter(t => (t.modality_id || t.protocol_step?.modality_id) !== mId))
      setBenchItems(prev => [
        ...prev.filter((b: any) => b.modality_id !== mId), 
        { 
          id: 'temp_' + mId, 
          modality_id: mId, 
          status: 'eliminated', 
          local_user_id: localUserId, 
          pinned: false, 
          added_at: new Date().toISOString() 
        }
      ])

      try {
        const { eliminateModality, getBenchItems } = await import('@/lib/data')
        await eliminateModality(localUserId, mId, reason || 'User eliminated modality', task.id, selectedReasons || [])
        const bItems = await getBenchItems(localUserId)
        setBenchItems(bItems)
      } catch (err) {
        console.error('Error eliminating modality:', err)
        await refreshTodayTasks()
      } finally {
        setTimeout(() => setActionFeedback(null), 2000)
      }
    }
  }

  const handleToggleMainCategory = (cat: MainCategory) => {
    setSelectedMainCategories(prev => {
      if (cat === 'all') return ['all']
      const withoutAll = prev.filter(c => c !== 'all')
      if (withoutAll.includes(cat)) {
        const next = withoutAll.filter(c => c !== cat)
        return next.length === 0 ? ['all'] : next
      } else {
        return [...withoutAll, cat]
      }
    })
  }

  const handleToggleSubCategory = (subId: string) => {
    setSelectedSubCategories(prev => 
      prev.includes(subId) ? prev.filter(s => s !== subId) : [...prev, subId]
    )
  }

  const benchedOrEliminatedModalityIds = useMemo(() => {
    const set = new Set<string>()
    benchItems.forEach(b => {
      if (b.status === 'benched' || b.status === 'eliminated') {
        if (b.modality_id) set.add(b.modality_id.toLowerCase().trim())
      }
    })
    return set
  }, [benchItems])

  // Multi-dose splitting and Modality Deduplication with Lineage Aggregation
  const dedupedTasks = useMemo(() => {
    // Filter out eliminated / contraindicated tasks from active Today view
    const activeTasks = tasks.filter(task => {
      const modality = task.protocol_step?.modality || task.loose_modality
      const mId = (
        task.modality_id || 
        task.protocol_step?.modality_id || 
        task.protocol_step?.modality?.id || 
        modality?.id || 
        ''
      ).trim().toLowerCase()
      if (task.status === 'contraindicated') return false
      if (task.status_reason?.toLowerCase().includes('eliminated')) return false
      if (mId && benchedOrEliminatedModalityIds.has(mId)) return false
      return true
    })

    // 1. Expand multi-dose tasks if applicable
    const expandedTasks: DailyProtocolTask[] = []
    
    activeTasks.forEach(task => {
      const modality = task.protocol_step?.modality || task.loose_modality
      const mId = modality?.id || task.modality_id || ''
      const benchItem = mId ? benchItems.find(b => b.modality_id === mId) : null
      
      const effectiveTiming = 
        task.timing_slot ||
        task.execution_details?.custom_timing || 
        task.custom_timing || 
        benchItem?.custom_timing || 
        modality?.default_timing_slot ||
        modality?.timing_summary || 
        modality?.frequency || 
        ''
      const effectiveDose = 
        task.execution_details?.custom_dose || 
        task.custom_dose || 
        benchItem?.custom_dose || 
        modality?.dose_or_exposure || 
        ''
      const isSupplement = (modality?.category || '').toLowerCase().includes('supplement') || (modality?.modality_type || '').toLowerCase() === 'supplement'
      let slots = parseMultiDoseTimingSlots(effectiveTiming, isSupplement)
      if ((!slots || slots.length < 2) && effectiveDose) {
        slots = parseMultiDoseTimingSlots(effectiveDose, isSupplement)
      }

      if (slots && slots.length >= 2) {
        const completedDoses: number[] = task.execution_details?.completed_doses || (task.status === 'completed' ? Array.from({ length: slots.length }, (_, i) => i + 1) : [])

        slots.forEach(s => {
          const isThisDoseDone = completedDoses.includes(s.doseNumber)
          const splitTask: DailyProtocolTask = {
            ...task,
            id: `${task.id}-split-${s.doseNumber}`,
            timing_slot: s.slot,
            status: isThisDoseDone ? 'completed' : (task.status === 'completed' ? 'pending' : task.status),
            execution_details: {
              ...task.execution_details,
              custom_timing: s.slot,
              original_custom_timing: effectiveTiming,
              split_dose_label: s.label,
              split_dose_info: `Dose ${s.doseNumber} of ${s.totalDoses}`,
              split_dose_number: s.doseNumber,
              split_dose_total: s.totalDoses
            }
          }
          expandedTasks.push(splitTask)
        })
      } else {
        expandedTasks.push(task)
      }
    })

    // If viewing by Protocol: DEDUPLICATE within each protocol so repeated database rows don't show twice
    if (viewMode === 'protocol') {
      const protoMap = new Map<string, DedupedTask>()
      expandedTasks.forEach(task => {
        const modality = task.protocol_step?.modality || task.loose_modality
        const pId = (
          task.lineages?.[0]?.protocol_id ||
          task.protocol_step?.protocol_id ||
          (task as any).user_protocol_instance?.protocol_id ||
          task.protocol_step?.protocol?.name ||
          (task as any).user_protocol_instance?.protocol?.name ||
          'standalone'
        ).trim().toLowerCase()

        const modalityId = (
          task.modality_id || 
          task.protocol_step?.modality_id || 
          modality?.id || 
          modality?.slug || 
          ''
        ).trim().toLowerCase()

        const modalityName = (
          modality?.name || 
          modality?.display_name || 
          (task as any).name || 
          ''
        ).trim().toLowerCase()

        const modalityKey = modalityId || modalityName || task.id
        const splitNumber = task.execution_details?.split_dose_number || 0
        const protoKey = `${pId}_${modalityKey}_split_${splitNumber}`
        const isSplitTask = Boolean(task.execution_details?.split_dose_number || task.id.includes('-split-'))
        const customTimingStr = task.execution_details?.custom_timing || (modalityId ? benchItems.find(b => b.modality_id && b.modality_id.toLowerCase() === modalityId)?.custom_timing : undefined)
        const resolvedSlot = task.timing_slot || (customTimingStr ? resolveSlotFromTimingString(customTimingStr) : '') || resolveOptimalTimingSlot(modality, task.protocol_step, task.timing_slot, profile, customTimingStr)
        
        if (!protoMap.has(protoKey)) {
          protoMap.set(protoKey, {
            ...task,
            timing_slot: resolvedSlot,
            original_tasks: [task]
          })
        } else {
          const existing = protoMap.get(protoKey)!
          if (!existing.original_tasks) existing.original_tasks = [existing]
          existing.original_tasks.push(task)
          if (task.timing_slot && task.timing_slot !== existing.timing_slot) {
            existing.timing_slot = task.timing_slot
          }
          if (task.status === 'completed' && existing.status !== 'completed') {
            existing.status = 'completed'
            existing.completed_at = task.completed_at
          }
          if (task.execution_details && !existing.execution_details) {
            existing.execution_details = task.execution_details
          }
        }
      })
      return Array.from(protoMap.values())
    }

    // In Chronological / Time Blocks view, DEDUPLICATE by normalized modality (id or name + split dose) and merge lineages!
    const map = new Map<string, DedupedTask>()

    expandedTasks.forEach(task => {
      const modality = task.protocol_step?.modality || task.loose_modality
      const splitNumber = task.execution_details?.split_dose_number || 0
      const modalityId = (task.modality_id || modality?.id || modality?.slug || '').trim().toLowerCase()
      const modalityName = (modality?.name || modality?.display_name || (task as any).name || '').trim().toLowerCase()
      const baseKey = modalityId || modalityName || task.id
      const dedupeKey = splitNumber > 0 ? `${baseKey}-split-${splitNumber}` : baseKey
      const isSplitTask = Boolean(task.execution_details?.split_dose_number || task.id.includes('-split-'))
      const customTimingStr = task.execution_details?.custom_timing || (modalityId ? benchItems.find(b => b.modality_id && b.modality_id.toLowerCase() === modalityId)?.custom_timing : undefined)
      const resolvedSlot = task.timing_slot || (customTimingStr ? resolveSlotFromTimingString(customTimingStr) : '') || resolveOptimalTimingSlot(modality, task.protocol_step, task.timing_slot, profile, customTimingStr)

      if (!map.has(dedupeKey)) {
        const initialLineages: Array<{ protocol_id?: string; protocol_name: string; color_hex?: string; protocol_type?: string }> = []
        if (task.lineages && task.lineages.length > 0) {
          initialLineages.push(...task.lineages)
        } else if (task.protocol_step?.protocol) {
          initialLineages.push({
            protocol_id: task.protocol_step.protocol.id,
            protocol_name: task.protocol_step.protocol.name,
            color_hex: (task.protocol_step.protocol as any).color_hex || '#A855F7'
          })
        } else if ((task as any).user_protocol_instance?.protocol) {
          initialLineages.push({
            protocol_id: (task as any).user_protocol_instance.protocol.id,
            protocol_name: (task as any).user_protocol_instance.protocol.name,
            color_hex: (task as any).user_protocol_instance.protocol.color_hex || '#A855F7'
          })
        }

        map.set(dedupeKey, {
          ...task,
          timing_slot: resolvedSlot,
          lineages: initialLineages,
          original_tasks: [task]
        })
      } else {
        const existing = map.get(dedupeKey)!
        if (!existing.original_tasks) existing.original_tasks = [existing]
        existing.original_tasks.push(task)
        if (!existing.lineages) existing.lineages = []

        const newLin: Array<{ protocol_id?: string; protocol_name: string; color_hex?: string; protocol_type?: string }> = []
        if (task.lineages && task.lineages.length > 0) {
          newLin.push(...task.lineages)
        } else if (task.protocol_step?.protocol) {
          newLin.push({
            protocol_id: task.protocol_step.protocol.id,
            protocol_name: task.protocol_step.protocol.name,
            color_hex: (task.protocol_step.protocol as any).color_hex || '#A855F7'
          })
        } else if ((task as any).user_protocol_instance?.protocol) {
          newLin.push({
            protocol_id: (task as any).user_protocol_instance.protocol.id,
            protocol_name: (task as any).user_protocol_instance.protocol.name,
            color_hex: (task as any).user_protocol_instance.protocol.color_hex || '#A855F7'
          })
        }

        newLin.forEach(l => {
          if (!existing.lineages!.some(el => (l.protocol_id && el.protocol_id === l.protocol_id) || el.protocol_name === l.protocol_name)) {
            existing.lineages!.push(l)
          }
        })

        if (task.timing_slot && task.timing_slot !== existing.timing_slot) {
          existing.timing_slot = task.timing_slot
        }

        if (task.status === 'completed' && existing.status !== 'completed') {
          existing.status = 'completed'
          existing.completed_at = task.completed_at
        }
      }
    })

    return Array.from(map.values())
  }, [tasks, benchItems, viewMode, profile, benchedOrEliminatedModalityIds])

  const isTaskMatchingCategoryFilter = (task: DedupedTask): boolean => {
    if (selectedMainCategories.includes('all') || selectedMainCategories.length === 0) return true

    const modalityCat = (task.loose_modality?.category || task.protocol_step?.modality?.category || '').toLowerCase()
    const modalityType = (task.loose_modality?.modality_type || task.protocol_step?.modality?.modality_type || '').toLowerCase()
    const modalityName = (task.loose_modality?.name || task.protocol_step?.modality?.name || (task as any).name || '').toLowerCase()
    const stepName = ((task.protocol_step as any)?.step_name || '').toLowerCase()
    const combinedText = `${modalityCat} ${modalityType} ${modalityName} ${stepName}`

    return selectedMainCategories.some(cat => {
      const subItems = SUB_CATEGORIES_MAP[cat] || []
      const activeSubIds = selectedSubCategories.filter(id => subItems.some(sub => sub.id === id))

      if (activeSubIds.length === 0) {
        if (cat === 'supplements') {
          return getModalityMacroType(task) === 'supplements' || combinedText.includes('supplement') || combinedText.includes('pill') || combinedText.includes('capsule') || combinedText.includes('tablet') || combinedText.includes('vitamin') || combinedText.includes('mineral')
        }
        if (cat === 'peptides') return getModalityMacroType(task) === 'peptides' || combinedText.includes('peptide') || combinedText.includes('bpc') || combinedText.includes('tb500') || combinedText.includes('tb-500') || combinedText.includes('cjc') || combinedText.includes('ipamorelin') || combinedText.includes('semax') || combinedText.includes('selank') || combinedText.includes('tirzepatide') || combinedText.includes('subq')
        if (cat === 'fitness') return getModalityMacroType(task) === 'fitness' || combinedText.includes('fitness') || combinedText.includes('exercise') || combinedText.includes('workout') || combinedText.includes('cardio') || combinedText.includes('strength') || combinedText.includes('physical') || combinedText.includes('training')
        if (cat === 'nutrition') {
          if (
            modalityCat.includes('sleep') || 
            modalityCat.includes('breath') || 
            modalityName.includes('mouth tape') || 
            modalityName.includes('mouth tap') || 
            modalityName.includes('4-7-8') ||
            modalityName.includes('dark & cool')
          ) return false
          // Exclude dedicated supplements since Supplements is now its own top-level category!
          if (getModalityMacroType(task) === 'supplements') return false
          return combinedText.includes('nutrition') || combinedText.includes('fast') || combinedText.includes('food') || combinedText.includes('diet') || combinedText.includes('meal') || combinedText.includes('protein') || combinedText.includes('biochemistry')
        }
        if (cat === 'sleep') return getModalityMacroType(task) === 'sleep' || combinedText.includes('sleep') || combinedText.includes('circadian') || combinedText.includes('light') || combinedText.includes('wind down') || combinedText.includes('bed') || combinedText.includes('night')
        if (cat === 'mind') return getModalityMacroType(task) === 'mind' || combinedText.includes('mind') || combinedText.includes('nervous') || combinedText.includes('breath') || combinedText.includes('meditat') || combinedText.includes('nsdr') || combinedText.includes('vagal') || combinedText.includes('neurology') || combinedText.includes('autonomic')
        if (cat === 'other') return getModalityMacroType(task) === 'thermal' || getModalityMacroType(task) === 'diagnostics' || combinedText.includes('skin') || combinedText.includes('hair') || combinedText.includes('biomarker') || combinedText.includes('lab') || combinedText.includes('diagnostics') || combinedText.includes('hygiene') || combinedText.includes('dental')
        return true
      }

      return activeSubIds.some(subId => {
        if (subId === 'longevity_nad') return combinedText.includes('nmn') || combinedText.includes('nad') || combinedText.includes('fisetin') || combinedText.includes('quercetin') || combinedText.includes('resveratrol') || combinedText.includes('spermidine') || combinedText.includes('metformin') || combinedText.includes('rapamycin')
        if (subId === 'nootropics') return combinedText.includes('theanine') || combinedText.includes('caffeine') || combinedText.includes('lion') || combinedText.includes('bacopa') || combinedText.includes('tyrosine') || combinedText.includes('ashwagandha') || combinedText.includes('apigenin')
        if (subId === 'mitochondrial') return combinedText.includes('coq10') || combinedText.includes('creatine') || combinedText.includes('carnitine') || combinedText.includes('alpha lipoic') || combinedText.includes('pqq')
        if (subId === 'vitamins_minerals') return combinedText.includes('vitamin') || combinedText.includes('mineral') || combinedText.includes('magnesium') || combinedText.includes('zinc') || combinedText.includes('omega') || combinedText.includes('d3') || combinedText.includes('k2')
        if (subId === 'injury_joint_repair' || subId === 'tissue_repair') return combinedText.includes('bpc') || combinedText.includes('tb-500') || combinedText.includes('tb500') || combinedText.includes('wolverine') || combinedText.includes('tissue') || combinedText.includes('repair') || combinedText.includes('joint') || combinedText.includes('tendon') || combinedText.includes('ligament') || combinedText.includes('kpv')
        if (subId === 'fat_loss_metabolism' || subId === 'metabolic_glp1') return combinedText.includes('tirzepatide') || combinedText.includes('semaglutide') || combinedText.includes('retatrutide') || combinedText.includes('glp') || combinedText.includes('aod') || combinedText.includes('mots') || combinedText.includes('tesamorelin') || combinedText.includes('lipolysis')
        if (subId === 'muscle_recovery' || subId === 'gh_secretagogues') return combinedText.includes('cjc') || combinedText.includes('ipamorelin') || combinedText.includes('sermorelin') || combinedText.includes('igf') || combinedText.includes('ghrp') || combinedText.includes('growth hormone') || combinedText.includes('secretagogue') || combinedText.includes('muscle') || combinedText.includes('strength')
        if (subId === 'focus_brain_mood' || subId === 'nootropics_brain') return combinedText.includes('semax') || combinedText.includes('selank') || combinedText.includes('dihexa') || combinedText.includes('cerebrolysin') || combinedText.includes('p21') || combinedText.includes('focus') || combinedText.includes('brain') || combinedText.includes('mood') || combinedText.includes('flow')
        if (subId === 'skin_aesthetics') return combinedText.includes('ghk') || combinedText.includes('copper') || combinedText.includes('skin') || combinedText.includes('collagen') || combinedText.includes('dermatology') || combinedText.includes('red light')
        if (subId === 'immunity_gut') return combinedText.includes('ta1') || combinedText.includes('ta-1') || combinedText.includes('thymosin') || combinedText.includes('kpv') || combinedText.includes('bpc') || combinedText.includes('gut') || combinedText.includes('immune') || combinedText.includes('barrier')
        if (subId === 'libido_vitality') return combinedText.includes('pt141') || combinedText.includes('pt-141') || combinedText.includes('bremelanotide') || combinedText.includes('kisspeptin') || combinedText.includes('oxytocin') || combinedText.includes('libido') || combinedText.includes('sexual')
        if (subId === 'cellular_longevity' || subId === 'longevity_biologics') return combinedText.includes('epithalon') || combinedText.includes('epitalon') || combinedText.includes('ghk') || combinedText.includes('mots') || combinedText.includes('ss-31') || combinedText.includes('foxo4') || combinedText.includes('thymalin') || combinedText.includes('longevity')
        if (subId === 'cardio') return combinedText.includes('cardio') || combinedText.includes('zone 2') || combinedText.includes('run') || combinedText.includes('walk') || combinedText.includes('hiit')
        if (subId === 'strength') return combinedText.includes('strength') || combinedText.includes('lift') || combinedText.includes('resistance') || combinedText.includes('pushup') || combinedText.includes('squat')
        if (subId === 'flexibility') return combinedText.includes('stretch') || combinedText.includes('flexibility') || combinedText.includes('yoga') || combinedText.includes('mobility')
        if (subId === 'thermal') return combinedText.includes('sauna') || combinedText.includes('cold') || combinedText.includes('plunge') || combinedText.includes('thermal') || combinedText.includes('ice')
        if (subId === 'fasting') return combinedText.includes('fast')
        if (subId === 'whole_foods') return combinedText.includes('food') || combinedText.includes('diet') || combinedText.includes('meal') || combinedText.includes('protein') || combinedText.includes('glucose')
        if (subId === 'hydration') return combinedText.includes('hydration') || combinedText.includes('water') || combinedText.includes('electrolyte') || combinedText.includes('salt')
        if (subId === 'hygiene') return combinedText.includes('hygiene') || combinedText.includes('cool bedroom') || combinedText.includes('darkness')
        if (subId === 'circadian') return combinedText.includes('circadian') || combinedText.includes('sunlight') || combinedText.includes('light') || combinedText.includes('blue light')
        if (subId === 'wind_down') return combinedText.includes('wind down') || combinedText.includes('evening') || combinedText.includes('journal')
        if (subId === 'nervous_system') return combinedText.includes('nervous') || combinedText.includes('vagus') || combinedText.includes('parasympathetic')
        if (subId === 'breathwork') return combinedText.includes('breath') || combinedText.includes('sigh') || combinedText.includes('box breathing') || combinedText.includes('4-7-8') || combinedText.includes('hyperventilation')
        if (subId === 'meditation') return combinedText.includes('meditat') || combinedText.includes('mindful') || combinedText.includes('nsdr')
        if (subId === 'skin') return combinedText.includes('skin') || combinedText.includes('hair') || combinedText.includes('red light') || combinedText.includes('dermatology')
        if (subId === 'biomarkers') return combinedText.includes('biomarker') || combinedText.includes('lab') || combinedText.includes('blood') || combinedText.includes('cgm')
        if (subId === 'environmental') return combinedText.includes('air') || combinedText.includes('water filter') || combinedText.includes('mold')
        return false
      })
    })
  }

  const isTaskMatchingOutcomesFilter = (task: DedupedTask): boolean => {
    if (selectedOutcomes.length === 0) return true
    const modality = task.loose_modality || task.protocol_step?.modality
    if (!modality) return true

    const normSelected = selectedOutcomes.map(s => s.toLowerCase().trim())
    
    // Check primary_outcome
    const prim = (modality.primary_outcome || '').toLowerCase()
    if (prim && normSelected.some(s => prim.includes(s) || s.includes(prim))) return true

    // Check secondary_outcomes
    const secondaries = (modality.secondary_outcomes || []).map(s => s.toLowerCase())
    if (secondaries.some(sec => normSelected.some(s => sec.includes(s) || s.includes(sec)))) return true

    // Check functional_outcomes_to_track
    const functional = (modality.functional_outcomes_to_track || []).map(s => s.toLowerCase().replace(/_/g, ' '))
    if (functional.some(func => normSelected.some(s => func.includes(s) || s.includes(func)))) return true

    // Fallback: description & name
    const combinedText = `${modality.name} ${modality.brief_description || ''}`.toLowerCase()
    if (normSelected.some(s => combinedText.includes(s))) return true

    return false
  }

  const isTaskMatchingActiveFilter = (task: DedupedTask): boolean => {
    if (filterLens === 'outcomes') {
      return isTaskMatchingOutcomesFilter(task)
    }
    return isTaskMatchingCategoryFilter(task)
  }

  const filteredMultiDayTasks = useMemo(() => {
    const result: Record<string, DailyProtocolTask[]> = {}

    Object.entries(multiDayTasks).forEach(([dKey, taskList]) => {
      const activeList: DailyProtocolTask[] = []

      taskList.forEach(task => {
        const mId = (
          task.modality_id || 
          task.protocol_step?.modality_id || 
          task.protocol_step?.modality?.id || 
          task.loose_modality?.id || 
          ''
        ).trim().toLowerCase()
        if (
          task.status === 'contraindicated' ||
          task.status_reason === 'Moved to Bench' ||
          task.status_reason?.toLowerCase().includes('eliminated') ||
          (mId && benchedOrEliminatedModalityIds.has(mId))
        ) {
          return
        }

        if (selectedProtocolFilter && selectedProtocolFilter !== 'all') {
          const target = selectedProtocolFilter.toLowerCase()
          const matchesProtocol = 
            (task.lineages || []).some(l => 
              (l.protocol_id && l.protocol_id.toLowerCase() === target) ||
              (l.protocol_name && l.protocol_name.toLowerCase() === target) ||
              (l.protocol_name && l.protocol_name.toLowerCase().includes(target))
            ) ||
            (task.protocol_step?.protocol_id && task.protocol_step.protocol_id.toLowerCase() === target) ||
            (task.protocol_step?.protocol?.id && task.protocol_step.protocol.id.toLowerCase() === target) ||
            (task.protocol_step?.protocol?.name && task.protocol_step.protocol.name.toLowerCase().includes(target)) ||
            ((task as any).user_protocol_instance?.protocol_id && (task as any).user_protocol_instance.protocol_id.toLowerCase() === target) ||
            ((task as any).user_protocol_instance?.protocol?.name && (task as any).user_protocol_instance.protocol.name.toLowerCase().includes(target))

          if (!matchesProtocol) {
            return
          }
        }

        // Multi-dose split sessions expansion
        const effectiveTiming = (task.execution_details?.custom_timing || task.timing_slot || task.protocol_step?.timing_slot || '').trim()
        const multiSlots = parseMultiDoseTimingSlots(effectiveTiming)

        if (multiSlots.length > 1) {
          const completedDoses = Array.isArray(task.execution_details?.completed_split_doses)
            ? task.execution_details.completed_split_doses
            : []

          multiSlots.forEach(s => {
            const isThisDoseDone = completedDoses.includes(s.doseNumber)
            const splitTask: DailyProtocolTask = {
              ...task,
              id: `${task.id}-split-${s.doseNumber}`,
              timing_slot: s.slot,
              status: isThisDoseDone ? 'completed' : (task.status === 'completed' ? 'pending' : task.status),
              execution_details: {
                ...task.execution_details,
                custom_timing: s.slot,
                original_custom_timing: effectiveTiming,
                split_dose_label: s.label,
                split_dose_info: `Dose ${s.doseNumber} of ${s.totalDoses}`,
                split_dose_number: s.doseNumber,
                split_dose_total: s.totalDoses
              }
            }
            if (isTaskMatchingActiveFilter(splitTask as DedupedTask)) {
              activeList.push(splitTask)
            }
          })
        } else {
          const dedupedEquivalent: DedupedTask = {
            ...task,
            timing_slot: task.timing_slot || task.protocol_step?.timing_slot || 'anytime'
          }
          if (isTaskMatchingActiveFilter(dedupedEquivalent)) {
            activeList.push(task)
          }
        }
      })

      result[dKey] = activeList
    })

    return result
  }, [multiDayTasks, benchedOrEliminatedModalityIds, selectedProtocolFilter, selectedMainCategories, selectedSubCategories, filterLens, selectedOutcomes])

  const allAvailableTasks = useMemo(() => {
    const list = [...tasks]
    const seen = new Set(tasks.map(t => t.id))
    Object.values(multiDayTasks).forEach(arr => {
      arr.forEach(t => {
        if (!seen.has(t.id)) {
          seen.add(t.id)
          list.push(t)
        }
      })
    })
    return list
  }, [tasks, multiDayTasks])

  const { routineTasks, allCompletedTasks, allSnoozedTasks, allSkippedTasks, infrequentTasks } = useMemo(() => {
    const routine: DedupedTask[] = []
    const completedTop: DedupedTask[] = []
    const snoozedTop: DedupedTask[] = []
    const skippedTop: DedupedTask[] = []
    const infrequent: DedupedTask[] = []

    dedupedTasks.forEach(task => {
      if (!isTaskMatchingActiveFilter(task)) return

      const modality = resolveTaskModality(task) || task.protocol_step?.modality || task.loose_modality
      const mId = (
        task.modality_id || 
        task.protocol_step?.modality_id || 
        task.protocol_step?.modality?.id || 
        modality?.id || 
        ''
      ).trim().toLowerCase()

      // Filter out orphan/corrupt records with no modality, no step, and no custom name
      const hasValidModalityOrTitle = Boolean(
        modality || 
        task.protocol_step?.modality || 
        task.loose_modality || 
        task.execution_details?.custom_name || 
        task.execution_details?.modality_name || 
        (task.protocol_step as any)?.title ||
        (task.modality_id && task.modality_id.trim() !== '')
      )
      if (!hasValidModalityOrTitle) return

      const rawNormalizedId = mId.replace(/_/g, '-')
      const rawUnderscoreId = mId.replace(/-/g, '_')
      if (
        task.status === 'contraindicated' || 
        task.status_reason?.toLowerCase().includes('eliminated') || 
        (mId && (
          benchedOrEliminatedModalityIds.has(mId) || 
          benchedOrEliminatedModalityIds.has(rawNormalizedId) || 
          benchedOrEliminatedModalityIds.has(rawUnderscoreId)
        ))
      ) {
        return
      }

      const cat = modality ? getMacroCategory(modality.category) : 'Other'

      if (cat === 'Diagnostics & Tracking') {
        infrequent.push(task)
        return
      }

      const isCompleted = task.status === 'completed'
      const isRecentlyCompleted = recentlyCompletedIds.has(task.id)
      const isSnoozed = task.status === 'snoozed'
      const isSkipped = task.status === 'skipped' || task.status === 'not_today' || (!isCompleted && !isSnoozed && task.status === 'missed')

      if (isCompleted) {
        completedTop.push(task)
        if ((!isFocusMode || focusRules.keepCompleted) && (showCompletedInline || cardBadges.showCompletedInline || isRecentlyCompleted)) {
          routine.push(task)
        }
      } else if (isSnoozed) {
        snoozedTop.push(task)
        if (!isFocusMode && (showSnoozedInline || (task.timing_slot && task.timing_slot !== 'anytime'))) {
          routine.push(task)
        }
      } else if (isSkipped) {
        // Never show benched or eliminated modalities in the skipped section!
        if (
          task.status_reason?.toLowerCase().includes('eliminated') || 
          (mId && (
            benchedOrEliminatedModalityIds.has(mId) || 
            benchedOrEliminatedModalityIds.has(rawNormalizedId) || 
            benchedOrEliminatedModalityIds.has(rawUnderscoreId)
          ))
        ) {
          return
        }
        // If viewing a future date, never show benched modalities in the skipped section (only on the day it was skipped)
        const isBenchedReason = task.status_reason?.toLowerCase().includes('bench')
        if (isFutureTimeline && isBenchedReason) {
          return
        }
        skippedTop.push(task)
        if (!isFocusMode && showSkippedInline) {
          routine.push(task)
        }
      } else {
        routine.push(task)
      }
    })

    return { 
      routineTasks: routine, 
      allCompletedTasks: completedTop, 
      allSnoozedTasks: snoozedTop,
      allSkippedTasks: skippedTop,
      infrequentTasks: infrequent 
    }
  }, [dedupedTasks, selectedMainCategories, selectedSubCategories, showCompletedInline, cardBadges, showSnoozedInline, showSkippedInline, recentlyCompletedIds, benchedOrEliminatedModalityIds, isFutureTimeline, filterLens, selectedOutcomes, isFocusMode, focusRules, resolveTaskModality])

  const sortedCompletedGroups = useMemo(() => {
    if (allCompletedTasks.length === 0) return []

    if (completedSortBy === 'completed_time') {
      const sortedTasks = [...allCompletedTasks].sort((a, b) => {
        const timeA = a.completed_at ? new Date(a.completed_at).getTime() : 0
        const timeB = b.completed_at ? new Date(b.completed_at).getTime() : 0
        return completedSortOrder === 'asc' ? timeA - timeB : timeB - timeA
      })
      return [['Completed Log', sortedTasks]] as Array<[string, DedupedTask[]]>
    }

    const groups: Record<string, DedupedTask[]> = {}
    allCompletedTasks.forEach(task => {
      let groupKey = 'anytime'
      if (viewMode === 'protocol') {
        groupKey = task.lineages?.[0]?.protocol_name || task.protocol_step?.protocol?.name || 'Custom / Unassigned'
      } else {
        const modality = resolveTaskModality(task)
        const isSplitTask = Boolean(task.execution_details?.split_dose_number || task.id.includes('-split-'))
        const rawGroupKey = (isSplitTask && task.timing_slot && task.timing_slot !== 'anytime')
          ? task.timing_slot
          : (task.timing_slot && task.timing_slot !== 'anytime'
            ? task.timing_slot
            : resolveOptimalTimingSlot(modality, task.protocol_step, task.timing_slot))
        groupKey = normalizeChronologicalTimeBlock(rawGroupKey)
      }
      if (!groups[groupKey]) groups[groupKey] = []
      groups[groupKey].push(task)
    })

    const entries = Object.entries(groups).sort(([groupA], [groupB]) => {
      const orderA = getTimeBlockOrder(groupA)
      const orderB = getTimeBlockOrder(groupB)
      return completedSortOrder === 'asc' ? orderA - orderB : orderB - orderA
    })

    entries.forEach(([, tasksInGroup]) => {
      tasksInGroup.sort((a, b) => {
        const timeA = a.completed_at ? new Date(a.completed_at).getTime() : 0
        const timeB = b.completed_at ? new Date(b.completed_at).getTime() : 0
        return completedSortOrder === 'asc' ? timeA - timeB : timeB - timeA
      })
    })

    return entries
  }, [allCompletedTasks, completedSortBy, completedSortOrder, viewMode, resolveTaskModality])

  // Sync completion stats into localStorage and dispatch event
  useEffect(() => {
    if (dedupedTasks.length > 0) {
      const completedCount = allCompletedTasks.length

      // If 80/20 Adherence Shield is active, tasks muted or deferred due to 80/20 are excluded from target denominator
      const activeDenominatorTasks = isShieldActive
        ? dedupedTasks.filter(t => !t.status_reason?.toLowerCase().includes('80/20') && !t.execution_details?.adaptive_muted)
        : dedupedTasks

      const totalCount = activeDenominatorTasks.length
      const percentage = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : (completedCount > 0 ? 100 : 0)

      const statsPayload = { completed: completedCount, total: totalCount, percentage, isShieldProtected: isShieldActive }

      if (isCurrentDay) {
        try {
          localStorage.setItem('levl_today_stats', JSON.stringify(statsPayload))
        } catch (e) {}
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('levl_today_tasks_stats', { detail: statsPayload }))
      }
    }
  }, [dedupedTasks.length, allCompletedTasks.length, isCurrentDay, isShieldActive])

  const chronologicalGroups = useMemo(() => {
    const groups: Record<string, DedupedTask[]> = {}
    routineTasks.forEach(task => {
      const modality = resolveTaskModality(task)
      const isSplitTask = Boolean(task.execution_details?.split_dose_number || task.id.includes('-split-'))
      
      // If task is a split task, or already has a concrete assigned timing_slot, RESPECT IT!
      // Do NOT recalculate and override it into an arbitrary block!
      const rawSlot = (isSplitTask && task.timing_slot && task.timing_slot !== 'anytime')
        ? task.timing_slot
        : (task.timing_slot && task.timing_slot !== 'anytime'
          ? task.timing_slot
          : resolveOptimalTimingSlot(modality, task.protocol_step, task.timing_slot, profile, task.execution_details?.custom_timing))

      const slot = normalizeChronologicalTimeBlock(rawSlot)

      if (!groups[slot]) groups[slot] = []
      groups[slot].push({
        ...task,
        timing_slot: rawSlot
      })
    })

    return groups
  }, [routineTasks, profile, benchItems, resolveTaskModality])

  const sortedChronologicalGroups = useMemo(() => {
    const rawEntries = Object.entries(chronologicalGroups).filter(([_, tasks]) => tasks && tasks.length > 0)
    if (rawEntries.length === 0) return []

    // Separate anytime group from fixed time slots
    const anytimeEntry = rawEntries.find(([group]) => group.toLowerCase().includes('anytime'))
    const timedEntries = rawEntries
      .filter(([group]) => !group.toLowerCase().includes('anytime'))
      .sort(([groupA], [groupB]) => compareTimingSlots(groupA, groupB))

    if (!anytimeEntry) return timedEntries

    // If not current day (past/future date), place anytime after morning blocks (or near top)
    if (!isCurrentDay) {
      const morningLastIdx = timedEntries.findIndex(([g]) => {
        const o = getTimeBlockOrder(g)
        return o > 3 // after morning slots (0..3)
      })
      const insertAt = morningLastIdx !== -1 ? morningLastIdx : timedEntries.length
      const result = [...timedEntries]
      result.splice(insertAt, 0, anytimeEntry)
      return result
    }

    // On current day: find the current live circadian slot or highest passed slot
    const currentHour = new Date().getHours()
    let currentSlotIdx = -1

    timedEntries.forEach(([group], idx) => {
      if (isCurrentCircadianSlot(group, currentHour)) {
        currentSlotIdx = idx
      }
    })

    // If no exact match (e.g. between defined windows), find the latest passed slot
    if (currentSlotIdx === -1) {
      for (let i = timedEntries.length - 1; i >= 0; i--) {
        const cfg = getCircadianConfig(timedEntries[i][0])
        if (currentHour >= cfg.startHour && cfg.startHour <= cfg.endHour) {
          currentSlotIdx = i
          break
        }
      }
    }

    // Insert anytime immediately after the current/live cluster, never splitting a stack from its parent
    let insertIdx = currentSlotIdx !== -1 ? currentSlotIdx + 1 : (timedEntries.length > 0 ? 1 : 0)

    // If the next slot is a paired stack or routine (e.g. evening_supplement_stack or morning_supplement_stack), advance past it
    while (insertIdx < timedEntries.length) {
      const nextGroup = timedEntries[insertIdx][0].toLowerCase()
      if (nextGroup.includes('supplement_stack') || nextGroup.includes('stack') || nextGroup.includes('routine')) {
        insertIdx++
      } else {
        break
      }
    }

    const result = [...timedEntries]
    result.splice(insertIdx, 0, anytimeEntry)
    return result
  }, [chronologicalGroups, isCurrentDay])

  const protocolGroups = useMemo(() => {
    const groups: Record<string, DedupedTask[]> = {}
    dedupedTasks.forEach(task => {
      if (!isTaskMatchingActiveFilter(task)) return

      const modality = task.protocol_step?.modality || task.loose_modality
      const mId = (
        task.modality_id || 
        task.protocol_step?.modality_id || 
        task.protocol_step?.modality?.id || 
        modality?.id || 
        ''
      ).trim().toLowerCase()
      if (task.status === 'contraindicated' || task.status_reason?.toLowerCase().includes('eliminated') || (mId && benchedOrEliminatedModalityIds.has(mId))) {
        return
      }

      const cat = modality ? getMacroCategory(modality.category) : 'Other'
      if (cat === 'Diagnostics & Tracking') return

      const parentProtocolName = task.lineages?.[0]?.protocol_name || task.protocol_step?.protocol?.name || (task as any).user_protocol_instance?.protocol?.name
      const groupName = parentProtocolName || 'Standalone & Individual Modalities'
      
      if (!groups[groupName]) groups[groupName] = []
      groups[groupName].push(task)
    })
    return groups
  }, [dedupedTasks, selectedMainCategories, selectedSubCategories, benchedOrEliminatedModalityIds, filterLens, selectedOutcomes])

  const getGroupTimeIndex = (groupName: string, groupTasks: DedupedTask[]) => {
    const lowerName = groupName.toLowerCase()
    
    if (lowerName.includes('huberman morning') || lowerName.includes('morning sunlight') || lowerName.includes('morning routine')) return 10
    if (lowerName.includes('morning') || lowerName.includes('wake')) return 20
    if (lowerName.includes('first meal') || lowerName.includes('first_meal') || lowerName.includes('breakfast')) return 30
    if (lowerName.includes('afternoon')) return 60
    if (lowerName.includes('metabolic') || lowerName.includes('midday') || lowerName.includes('lunch') || lowerName.includes('solar_noon')) return 50
    if (lowerName.includes('standalone') || lowerName.includes('individual')) return 100
    if (lowerName.includes('pre-meal') || lowerName.includes('pre meal')) return 130
    if (lowerName.includes('post-meal') || lowerName.includes('post meal') || lowerName.includes('postprandial')) return 140
    if (lowerName.includes('evening') || lowerName.includes('dinner')) return 150
    if (lowerName.includes('wind down') || lowerName.includes('wind_down') || lowerName.includes('wind-down') || lowerName.includes('winddown')) return 180
    if (lowerName.includes('pre-bed') || lowerName.includes('pre_bed')) return 190
    if (lowerName.includes('bedtime') || lowerName.includes('sleep') || lowerName.includes('night') || lowerName.includes('cortisol')) return 200

    let minIdx = 999
    groupTasks.forEach(task => {
      const slot = (task.timing_slot || task.protocol_step?.timing_slot || task.loose_modality?.default_timing_slot || 'anytime').toLowerCase()
      const order = getTimeBlockOrder(slot)
      if (order < minIdx) minIdx = order
    })
    return minIdx * 10
  }

  const sortedProtocolGroups = Object.entries(protocolGroups).sort(([groupA, tasksA], [groupB, tasksB]) => {
    const timeIdxA = getGroupTimeIndex(groupA, tasksA)
    const timeIdxB = getGroupTimeIndex(groupB, tasksB)
    if (timeIdxA !== timeIdxB) return timeIdxA - timeIdxB
    return groupA.localeCompare(groupB)
  })

  const activeGroups = viewMode === 'chronological' ? sortedChronologicalGroups : sortedProtocolGroups

  const { pastGroups, activeTimelineGroups } = useMemo(() => {
    if (viewMode !== 'chronological' || !isCurrentDay) {
      return { 
        pastGroups: [] as [string, DedupedTask[]][], 
        activeTimelineGroups: sortedChronologicalGroups 
      }
    }

    const past: [string, DedupedTask[]][] = []
    const active: [string, DedupedTask[]][] = []

    sortedChronologicalGroups.forEach(([gName, gTasks]) => {
      if (!gTasks || gTasks.length === 0) return
      const isAnytime = gName.toLowerCase().includes('anytime')
      const isPast = !isAnytime && isCircadianSlotPast(
        gName,
        new Date(),
        0.0,
        userActualWakeTime,
        profile?.ideal_wake_time || '06:30'
      )

      if (isPast) {
        past.push([gName, gTasks])
      } else {
        active.push([gName, gTasks])
      }
    })

    return { pastGroups: past, activeTimelineGroups: active }
  }, [viewMode, isCurrentDay, sortedChronologicalGroups, userActualWakeTime, profile?.ideal_wake_time])

  const [isAllPastExpanded, setIsAllPastExpanded] = useState(false)
  const [expandedPastBlocks, setExpandedPastBlocks] = useState<Record<string, boolean>>({})

  const toggleAllPastBlocks = () => {
    const nextVal = !isAllPastExpanded
    setIsAllPastExpanded(nextVal)
    const nextBlocks: Record<string, boolean> = {}
    pastGroups.forEach(([gName]) => {
      nextBlocks[gName] = nextVal
    })
    setExpandedPastBlocks(nextBlocks)
  }

  const togglePastBlock = (gName: string) => {
    setExpandedPastBlocks(prev => {
      const current = prev[gName] ?? isAllPastExpanded
      return { ...prev, [gName]: !current }
    })
  }

  const pastTotalCount = useMemo(() => {
    return pastGroups.reduce((acc, [, tasks]) => acc + tasks.length, 0)
  }, [pastGroups])

  const pastCompletedCount = useMemo(() => {
    return pastGroups.reduce((acc, [, tasks]) => acc + tasks.filter(t => t.status === 'completed').length, 0)
  }, [pastGroups])

  // Fallback static gradient stops
  const fallbackCircadianGradientCSS = useMemo(() => {
    if (viewMode === 'chronological') {
      const keys = activeTimelineGroups.length > 0 
        ? activeTimelineGroups.map(([g]) => g) 
        : activeGroups.map(([g]) => g)
      return buildDynamicCircadianGradientCSS(keys)
    }
    const groupKeys = activeGroups.map(([groupName]) => groupName)
    return buildDynamicCircadianGradientCSS(groupKeys)
  }, [viewMode, activeTimelineGroups, activeGroups])

  const [measuredCircadianGradientCSS, setMeasuredCircadianGradientCSS] = useState<string>('')

  // Dynamically calculate the spine gradient stops directly from the real, measured DOM boundaries of each time block
  const recalculateSpineGradient = useCallback(() => {
    if (!timelineContainerRef.current) return
    const container = timelineContainerRef.current
    const totalHeight = container.offsetHeight
    if (totalHeight <= 0) return

    const colorStops: { color: string; pct: number }[] = []

    const isBlueFamily = (hex: string) => ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#2563eb', '#3b82f6', '#5b9bd5'].includes(hex.toLowerCase())
    const isSunsetFamily = (hex: string) => ['#f87e38', '#df5558', '#f97316', '#ea580c'].includes(hex.toLowerCase())

    if (viewMode === 'chronological') {
      let prevBottomPct = 0

      // 1. "Previous" summary section at the top of the chronological timeline
      if (pastGroups.length > 0) {
        const prevEl = previousSectionRef.current
        const prevHeight = prevEl ? prevEl.offsetHeight : 54
        prevBottomPct = Math.max(1.5, Math.min(25, (prevHeight / totalHeight) * 100))

        const firstPastCfg = getCircadianConfig(pastGroups[0][0])
        colorStops.push({ color: firstPastCfg.startColorHex || firstPastCfg.skyColorHex, pct: 0 })

        if (pastGroups.length > 1) {
          pastGroups.forEach(([pName], pIdx) => {
            const pCfg = getCircadianConfig(pName)
            const pPct = (pIdx / Math.max(1, pastGroups.length - 1)) * (prevBottomPct - 1.0)
            colorStops.push({ color: pCfg.skyColorHex, pct: Number(pPct.toFixed(1)) })
          })
        } else {
          colorStops.push({ color: firstPastCfg.skyColorHex, pct: Number((prevBottomPct - 1.0).toFixed(1)) })
        }

        // Bridge from Previous section into the first active block
        const firstActive = activeTimelineGroups[0] ? getCircadianConfig(activeTimelineGroups[0][0]) : null
        if (firstActive) {
          const lastPast = getCircadianConfig(pastGroups[pastGroups.length - 1][0])
          if (isBlueFamily(lastPast.skyColorHex) && (isSunsetFamily(firstActive.skyColorHex) || firstActive.key === 'pre_meal' || firstActive.key === 'post_meal' || firstActive.key === 'evening')) {
            colorStops.push({ color: '#F59E0B', pct: Number(prevBottomPct.toFixed(1)) })
          } else {
            colorStops.push({ color: firstActive.startColorHex || firstActive.skyColorHex, pct: Number(prevBottomPct.toFixed(1)) })
          }
        }
      }

      // 2. Active and Upcoming chronological time blocks
      if (activeTimelineGroups.length === 0) {
        if (colorStops.length === 0) {
          colorStops.push({ color: '#10B981', pct: 0 })
          colorStops.push({ color: '#059669', pct: 100 })
        } else {
          colorStops.push({ color: '#0B132B', pct: 100 })
        }
      } else {
        activeTimelineGroups.forEach(([groupName], i) => {
          const el = groupHeaderRefs.current[groupName]
          const cfg = getCircadianConfig(groupName)
          const primary = cfg.skyColorHex

          let topPct = 0
          let bottomPct = 100

          if (el) {
            const topPx = el.offsetTop
            const heightPx = el.offsetHeight
            topPct = Math.max(0, Math.min(100, (topPx / totalHeight) * 100))
            bottomPct = Math.max(0, Math.min(100, ((topPx + heightPx) / totalHeight) * 100))
          } else {
            const baseTop = pastGroups.length > 0 ? prevBottomPct : 0
            const available = 100 - baseTop
            topPct = baseTop + (i / activeTimelineGroups.length) * available
            bottomPct = baseTop + ((i + 1) / activeTimelineGroups.length) * available
          }

          const nextGroupName = i < activeTimelineGroups.length - 1 ? activeTimelineGroups[i + 1][0] : null
          const nextCfg = nextGroupName ? getCircadianConfig(nextGroupName) : null
          const nextPrimary = nextCfg ? nextCfg.skyColorHex : null

          // Ensure the block's start is painted
          if (i === 0 && pastGroups.length === 0) {
            colorStops.push({ color: cfg.startColorHex || primary, pct: 0 })
          }

          // Solid hold across the measured block body
          colorStops.push({ color: primary, pct: Math.min(100, Number((topPct + 0.5).toFixed(1))) })
          colorStops.push({ color: primary, pct: Math.max(0, Number((bottomPct - 0.5).toFixed(1))) })

          // Seamless chromatic seam transitions between blocks
          if (nextPrimary) {
            if (isBlueFamily(primary) && (isSunsetFamily(nextPrimary) || nextGroupName === 'pre_meal' || nextGroupName === 'post_meal' || nextGroupName === 'evening')) {
              colorStops.push({ color: '#F59E0B', pct: Number(bottomPct.toFixed(1)) })
            } else if (cfg.key === 'evening' && (nextGroupName === 'evening_supplement_stack' || nextGroupName === 'wind_down')) {
              colorStops.push({ color: '#A52D6A', pct: Number(bottomPct.toFixed(1)) })
            } else if (cfg.key === 'wind_down' && nextGroupName === 'pre_bed') {
              colorStops.push({ color: '#312154', pct: Number(bottomPct.toFixed(1)) })
            } else if (nextCfg?.startColorHex && nextCfg.startColorHex !== primary) {
              colorStops.push({ color: nextCfg.startColorHex, pct: Number(bottomPct.toFixed(1)) })
            }
          }

          // Tail transition for the final active block of the day
          if (i === activeTimelineGroups.length - 1) {
            if (bottomPct < 98) {
              const midTailPct = (bottomPct + 100) / 2
              colorStops.push({ color: cfg.endColorHex || '#231A45', pct: Number(midTailPct.toFixed(1)) })
              colorStops.push({ color: '#0B132B', pct: 100 })
            } else {
              colorStops.push({ color: cfg.endColorHex || '#0B132B', pct: 100 })
            }
          }
        })
      }
    } else {
      // Protocol Mode
      if (sortedProtocolGroups.length === 0) return

      sortedProtocolGroups.forEach(([groupName, groupTasks], i) => {
        const el = groupHeaderRefs.current[groupName]
        const theme = getProtocolVisualTheme(groupName, groupTasks)
        const primary = theme.primaryColorHex || '#8B5CF6'

        let topPct = (i / sortedProtocolGroups.length) * 100
        let bottomPct = ((i + 1) / sortedProtocolGroups.length) * 100

        if (el) {
          const topPx = el.offsetTop
          const heightPx = el.offsetHeight
          topPct = Math.max(0, Math.min(100, (topPx / totalHeight) * 100))
          bottomPct = Math.max(0, Math.min(100, ((topPx + heightPx) / totalHeight) * 100))
        }

        if (i === 0) {
          colorStops.push({ color: primary, pct: 0 })
        }
        colorStops.push({ color: primary, pct: Math.min(100, Number((topPct + 0.5).toFixed(1))) })
        colorStops.push({ color: primary, pct: Math.max(0, Number((bottomPct - 0.5).toFixed(1))) })

        if (i === sortedProtocolGroups.length - 1) {
          colorStops.push({ color: primary, pct: 100 })
        }
      })
    }

    colorStops.sort((a, b) => a.pct - b.pct)
    const uniqueStops: { color: string; pct: number }[] = []
    colorStops.forEach((s) => {
      if (
        uniqueStops.length === 0 ||
        uniqueStops[uniqueStops.length - 1].pct !== s.pct ||
        uniqueStops[uniqueStops.length - 1].color !== s.color
      ) {
        uniqueStops.push(s)
      }
    })

    if (uniqueStops.length > 0) {
      const css = `linear-gradient(to bottom, ${uniqueStops.map((s) => `${s.color} ${s.pct}%`).join(', ')})`
      setMeasuredCircadianGradientCSS(css)
    }
  }, [viewMode, pastGroups, activeTimelineGroups, sortedProtocolGroups])

  useEffect(() => {
    recalculateSpineGradient()
    const timer = setTimeout(recalculateSpineGradient, 100)
    return () => clearTimeout(timer)
  }, [
    activeGroups, 
    activeTimelineGroups, 
    pastGroups.length, 
    isAllPastExpanded, 
    expandedPastBlocks, 
    tasks.length, 
    viewMode, 
    calendarViewMode, 
    recalculateSpineGradient
  ])

  useEffect(() => {
    if (!timelineContainerRef.current || typeof ResizeObserver === 'undefined') return
    let rafId: number
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        recalculateSpineGradient()
      })
    })
    ro.observe(timelineContainerRef.current)
    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
    }
  }, [recalculateSpineGradient])

  const circadianGradientCSS = measuredCircadianGradientCSS || fallbackCircadianGradientCSS

  // Get active tip color for the leading photon spark
  const latestIgnitedSkyColor = useMemo(() => {
    if (viewMode === 'chronological') {
      const groupsToCheck = activeTimelineGroups.length > 0 ? activeTimelineGroups : activeGroups
      if (ignitedGroupKeys.size === 0) {
        if (groupsToCheck.length > 0) return getCircadianConfig(groupsToCheck[0][0]).skyColorHex
        return '#F59E0B'
      }
      for (let i = groupsToCheck.length - 1; i >= 0; i--) {
        const gName = groupsToCheck[i][0]
        if (ignitedGroupKeys.has(gName)) {
          return getCircadianConfig(gName).skyColorHex
        }
      }
      if (groupsToCheck.length > 0) return getCircadianConfig(groupsToCheck[0][0]).skyColorHex
      return '#F59E0B'
    } else {
      if (ignitedGroupKeys.size === 0) {
        if (sortedProtocolGroups.length > 0) {
          const theme = getProtocolVisualTheme(sortedProtocolGroups[0][0], sortedProtocolGroups[0][1])
          return theme.primaryColorHex || '#8B5CF6'
        }
        return '#8B5CF6'
      }
      for (let i = sortedProtocolGroups.length - 1; i >= 0; i--) {
        const gName = sortedProtocolGroups[i][0]
        if (ignitedGroupKeys.has(gName)) {
          const theme = getProtocolVisualTheme(gName, sortedProtocolGroups[i][1])
          return theme.primaryColorHex || '#8B5CF6'
        }
      }
      return '#8B5CF6'
    }
  }, [viewMode, ignitedGroupKeys, activeTimelineGroups, activeGroups, sortedProtocolGroups])

  const totalWeight = dedupedTasks.reduce((acc, t) => {
    const opt = t.protocol_step?.optionality || 'required'
    if (opt === 'experimental' || opt === 'situational' || opt === 'as_needed') return acc
    return acc + (opt === 'required' ? 2 : 1)
  }, 0)

  const completedWeight = dedupedTasks.reduce((acc, t) => {
    if (t.status !== 'completed') return acc
    const opt = t.protocol_step?.optionality || 'required'
    if (opt === 'experimental' || opt === 'situational' || opt === 'as_needed') return acc
    return acc + (opt === 'required' ? 2 : 1)
  }, 0)

  const progressPercent = totalWeight === 0 ? 0 : Math.round((completedWeight / totalWeight) * 100)

  const dailyEfficacySummary = useMemo(() => {
    return calculateDailyEfficacySummary(dateStr, tasks, wellbeingCheckin)
  }, [dateStr, tasks, wellbeingCheckin])

  const scoredTips = useMemo(() => {
    const checkinProps = wellbeingCheckin ? {
      energy: wellbeingCheckin.energy_0_10,
      stress: wellbeingCheckin.stress_0_10,
      sleep_quality: wellbeingCheckin.subjective_sleep_0_10,
      mood: wellbeingCheckin.mood_0_10
    } : undefined
    return getScoredLongevityTips(profile, checkinProps, tasks, dismissedTipIds, dateStr)
  }, [profile, wellbeingCheckin, tasks, dismissedTipIds, dateStr])

  const isTipActedUpon = useMemo(() => {
    if (typeof window === 'undefined') return false
    return Boolean(safeLocalStorageGet('levl_daily_tip_acted_' + dateStr))
  }, [dateStr, dismissedTipIds])

  const threeDates = useMemo(() => {
    const d1 = subDays(currentDate, 1)
    const d2 = currentDate
    const d3 = addDays(currentDate, 1)
    return [format(d1, 'yyyy-MM-dd'), format(d2, 'yyyy-MM-dd'), format(d3, 'yyyy-MM-dd')]
  }, [currentDate])

  const weekDates = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    const end = endOfWeek(currentDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'))
  }, [currentDate])

  const dateTitle = useMemo(() => {
    if (calendarViewMode === 'today') {
      return format(currentDate, 'EEEE, MMMM d')
    }
    if (calendarViewMode === 'pulse') {
      return `Daily Pulse · ${format(currentDate, 'EEEE, MMMM d')}`
    }
    if (calendarViewMode === '3day') {
      return `${format(parseLocalDate(threeDates[0]), 'MMM d')} – ${format(parseLocalDate(threeDates[2]), 'MMM d, yyyy')}`
    }
    if (calendarViewMode === 'week') {
      return `${format(parseLocalDate(weekDates[0]), 'MMM d')} – ${format(parseLocalDate(weekDates[6]), 'MMM d, yyyy')}`
    }
    return format(currentDate, 'MMMM yyyy')
  }, [calendarViewMode, currentDate, threeDates, weekDates])

  const handlePreviousBatch = () => {
    if (calendarViewMode === '3day') {
      navigateToDate(subDays(currentDate, 3))
    } else if (calendarViewMode === 'week') {
      navigateToDate(subDays(currentDate, 7))
    } else if (calendarViewMode === 'month') {
      navigateToDate(subMonths(currentDate, 1))
    } else {
      navigateToDate(subDays(currentDate, 1))
    }
  }

  const handleNextBatch = () => {
    if (calendarViewMode === '3day') {
      navigateToDate(addDays(currentDate, 3))
    } else if (calendarViewMode === 'week') {
      navigateToDate(addDays(currentDate, 7))
    } else if (calendarViewMode === 'month') {
      navigateToDate(addMonths(currentDate, 1))
    } else {
      navigateToDate(addDays(currentDate, 1))
    }
  }

  const prevButtonTooltip = useMemo(() => {
    if (calendarViewMode === '3day') return 'Previous 3 days'
    if (calendarViewMode === 'week') return 'Previous week'
    if (calendarViewMode === 'month') return 'Previous month'
    return 'Previous day (Yesterday)'
  }, [calendarViewMode])

  const nextButtonTooltip = useMemo(() => {
    if (calendarViewMode === '3day') return 'Next 3 days'
    if (calendarViewMode === 'week') return 'Next week'
    if (calendarViewMode === 'month') return 'Next month'
    return 'Next day (Tomorrow)'
  }, [calendarViewMode])

  const isCurrentPeriod = useMemo(() => {
    const today = new Date()
    if (calendarViewMode === 'today' || calendarViewMode === 'pulse') {
      return isSameDay(currentDate, today)
    }
    if (calendarViewMode === '3day') {
      const todayStr = format(today, 'yyyy-MM-dd')
      return threeDates.includes(todayStr)
    }
    if (calendarViewMode === 'week') {
      const todayStr = format(today, 'yyyy-MM-dd')
      return weekDates.includes(todayStr)
    }
    if (calendarViewMode === 'month') {
      return isSameMonth(currentDate, today)
    }
    return true
  }, [calendarViewMode, currentDate, threeDates, weekDates])

  const jumpButtonLabel = useMemo(() => {
    if (calendarViewMode === 'week') return 'Jump to This Week'
    if (calendarViewMode === 'month') return 'Jump to This Month'
    return 'Jump to Today'
  }, [calendarViewMode])

  const navBarTitle = useMemo(() => {
    if (calendarViewMode === 'today') {
      return format(currentDate, 'EEEE, MMM d, yyyy')
    }
    if (calendarViewMode === 'pulse') {
      return `Daily Pulse · ${format(currentDate, 'EEEE, MMM d, yyyy')}`
    }
    if (calendarViewMode === '3day') {
      return `${format(parseLocalDate(threeDates[0]), 'MMM d')} – ${format(parseLocalDate(threeDates[2]), 'MMM d, yyyy')}`
    }
    if (calendarViewMode === 'week') {
      return `${format(parseLocalDate(weekDates[0]), 'MMM d')} – ${format(parseLocalDate(weekDates[6]), 'MMM d, yyyy')}`
    }
    if (calendarViewMode === 'month') {
      return format(currentDate, 'MMMM yyyy')
    }
    return format(currentDate, 'EEEE, MMM d, yyyy')
  }, [calendarViewMode, currentDate, threeDates, weekDates])

  const multiDayStats = useMemo(() => {
    if (calendarViewMode === 'today' || calendarViewMode === 'pulse') return null
    let total = 0
    let completed = 0
    Object.values(filteredMultiDayTasks).forEach(tasks => {
      tasks.forEach(t => {
        total++
        if (t.status === 'completed') completed++
      })
    })
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, pct }
  }, [calendarViewMode, filteredMultiDayTasks])

  const handleStartGroupTracking = (groupName: string, groupTasks: DedupedTask[]) => {
    setActiveGroupTrackKey(activeGroupTrackKey === groupName ? null : groupName)
    const initialValues: Record<string, number> = {}
    groupTasks.forEach(t => {
      const m = t.loose_modality || t.protocol_step?.modality
      const mOutcomes = allOutcomes.filter(o => (m?.functional_outcomes_to_track || []).includes(o.id))
      mOutcomes.forEach(o => {
        if (initialValues[o.id] === undefined) initialValues[o.id] = 5
      })
    })
    setGroupTrackValues(initialValues)
    setTouchedGroupOutcomes({})
  }

  const handleCompleteGroup = async (groupName: string, groupTasks: DedupedTask[]) => {
    const d = new Date()
    const nowIso = d.toISOString()
    for (const t of groupTasks) {
      if (t.status !== 'completed') {
        await handleStatusChange(t.id, 'completed', undefined, nowIso)
      }
    }
    if (viewMode === 'protocol') {
      setCollapsedGroups(prev => ({ ...prev, [groupName]: true }))
    }
  }

  const handleCompleteMultipleTasks = async (targetTasks: DedupedTask[]) => {
    const d = new Date()
    const nowIso = d.toISOString()
    for (const t of targetTasks) {
      if (t.status !== 'completed') {
        await handleStatusChange(t.id, 'completed', undefined, nowIso)
      }
    }
  }

  const handleSaveGroupTracking = async (groupTasks: DedupedTask[], markComplete: boolean) => {
    if (!profile) return
    setIsSavingGroupTrack(true)
    try {
      const localUserId = profile.local_user_id
      for (const [outcomeId, val] of Object.entries(groupTrackValues)) {
        if (touchedGroupOutcomes[outcomeId]) {
          for (const task of groupTasks) {
            await saveOutcomeObservation(localUserId, outcomeId, 'post', val, dateStr, task.id)
          }
        }
      }
      if (markComplete) {
        await handleCompleteGroup(activeGroupTrackKey || '', groupTasks)
      }
      setActiveGroupTrackKey(null)
      setOutcomesRefreshKey(prev => prev + 1)
    } finally {
      setIsSavingGroupTrack(false)
    }
  }

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [collapsedProtocolCards, setCollapsedProtocolCards] = useState<Record<string, boolean>>({})

  const isSupplementGroup = (gName: string, gTasks: DailyProtocolTask[]) => {
    const gLower = gName.toLowerCase()
    // Explicit supplement stack groups
    if (
      gLower === 'morning_supplement_stack' || 
      gLower === 'evening_supplement_stack' || 
      gLower.includes('supplement_stack') || 
      gLower.includes('supplement stack')
    ) {
      return true
    }
    // NEVER treat diurnal circadian blocks, bedtime, routines, or general protocol groups as a supplement tray
    if (
      gLower.includes('bedtime') || 
      gLower.includes('sleep') || 
      gLower.includes('wind_down') || 
      gLower.includes('wind down') || 
      gLower.includes('pre_bed') || 
      gLower.includes('routine') || 
      gLower.includes('waking') || 
      gLower.includes('midday') || 
      gLower.includes('afternoon') || 
      gLower.includes('evening') ||
      gLower.includes('anytime')
    ) {
      return false
    }
    const suppCount = gTasks.filter(t => {
      const mod = t.loose_modality || t.protocol_step?.modality
      const cat = (mod?.category || '').toLowerCase()
      const type = (mod?.modality_type || '').toLowerCase()
      return cat.includes('supplement') || cat.includes('nutraceutical') || type === 'supplement'
    }).length
    return gTasks.length > 0 && suppCount === gTasks.length
  }

  // Distinct protocols belonging to the user scheduled for Today (routine + completed)
  const userProtocolsInToday = useMemo(() => {
    const map = new Map<string, string>()
    tasks.forEach(t => {
      const pName = t.lineages?.[0]?.protocol_name || t.protocol_step?.protocol?.name || (t as any).user_protocol_instance?.protocol?.name
      const pId = t.lineages?.[0]?.protocol_id || t.protocol_step?.protocol_id || (t as any).user_protocol_instance?.protocol_id
      if (pName && pName !== 'Standalone & Individual Modalities') {
        map.set(pName.toLowerCase(), pName)
      } else if (pId && pId !== 'standalone') {
        map.set(pId.toLowerCase(), pId)
      }
    })
    return Array.from(map.values())
  }, [tasks])

  const totalUserProtocolCount = useMemo(() => {
    const activeGroupCount = sortedProtocolGroups.filter(([name]) => name !== 'Standalone & Individual Modalities').length
    return Math.max(userProtocolsInToday.length, activeGroupCount)
  }, [userProtocolsInToday.length, sortedProtocolGroups])

  const isProtocolCardCollapsed = (groupName: string, groupTasks: DailyProtocolTask[]) => {
    if (collapsedProtocolCards[groupName] !== undefined) {
      return collapsedProtocolCards[groupName]
    }
    const completedCount = groupTasks.filter(t => t.status === 'completed').length
    const isAllCompleted = completedCount === groupTasks.length && groupTasks.length > 0
    if (!isAllCompleted) return false

    // Default for completed protocols:
    // If total user protocols > 3 (where view starts collapsed), collapse to minimal name row
    if (totalUserProtocolCount > 3) {
      return true
    }
    return false
  }

  const toggleProtocolCardCollapse = (groupName: string) => {
    setCollapsedProtocolCards(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }))
  }

  const isGroupCollapsed = (groupName: string, groupTasks: DailyProtocolTask[]) => {
    if (collapsedGroups[groupName] !== undefined) {
      return collapsedGroups[groupName]
    }
    // In Today view, if user has more than 3 protocols, collapse by default when viewing by protocol
    if (viewMode === 'protocol') {
      const completedCount = groupTasks.filter(t => t.status === 'completed').length
      const isAllCompleted = completedCount === groupTasks.length && groupTasks.length > 0
      if (isAllCompleted) {
        // "When an entire protocol is completed it should be mostly collapsed when in protocol view mode."
        return true
      }
      if (totalUserProtocolCount > 3) {
        return true
      }
    }
    // Default to collapsed if it's a supplement stack with 3+ modalities
    const isSupp = isSupplementGroup(groupName, groupTasks)
    if (isSupp && groupTasks.length >= 3) {
      return true
    }

    // In Chronological View on the current day:
    // Auto-collapse time blocks that have passed by >= 1.5 hours so the user is not intimidated by earlier missed tasks
    if (isCurrentDay && viewMode === 'chronological') {
      const isPast = isCircadianSlotPast(
        groupName,
        new Date(),
        1.0,
        userActualWakeTime,
        profile?.ideal_wake_time || '06:30'
      )
      if (isPast) {
        return true
      }
    }

    return false
  }

  const toggleGroupCollapse = (groupName: string, groupTasks: DailyProtocolTask[]) => {
    const current = isGroupCollapsed(groupName, groupTasks)
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !current
    }))
  }

  const areAnyProtocolsExpanded = useMemo(() => {
    return sortedProtocolGroups.some(([name, gTasks]) => {
      const completedCount = gTasks.filter(t => t.status === 'completed').length
      const isAllCompleted = completedCount === gTasks.length && gTasks.length > 0
      if (isAllCompleted) {
        return !isProtocolCardCollapsed(name, gTasks)
      }
      return !isGroupCollapsed(name, gTasks)
    })
  }, [sortedProtocolGroups, isGroupCollapsed, isProtocolCardCollapsed])

  const handleToggleAllProtocolCollapse = () => {
    const shouldCollapse = areAnyProtocolsExpanded
    const nextCollapsedGroups: Record<string, boolean> = { ...collapsedGroups }
    const nextCollapsedCards: Record<string, boolean> = { ...collapsedProtocolCards }

    sortedProtocolGroups.forEach(([name, gTasks]) => {
      const completedCount = gTasks.filter(t => t.status === 'completed').length
      const isAllCompleted = completedCount === gTasks.length && gTasks.length > 0

      if (shouldCollapse) {
        // "in collapse all mode just show the protocol name when completed."
        if (isAllCompleted) {
          nextCollapsedCards[name] = true
        }
        nextCollapsedGroups[name] = true
      } else {
        // "When in expand all show the protocol with collapsed modalities if the entire protocol was completed."
        if (isAllCompleted) {
          nextCollapsedCards[name] = false
          nextCollapsedGroups[name] = true // Modalities stay collapsed as chips!
        } else {
          nextCollapsedCards[name] = false
          nextCollapsedGroups[name] = false // Incomplete protocols expand fully
        }
      }
    })

    setCollapsedGroups(nextCollapsedGroups)
    setCollapsedProtocolCards(nextCollapsedCards)
  }

  const areAnyTimeBlocksExpanded = useMemo(() => {
    return activeGroups.some(([name, gTasks]) => !isGroupCollapsed(name, gTasks))
  }, [activeGroups, isGroupCollapsed])

  const handleToggleAllTimeBlocksCollapse = () => {
    const shouldCollapse = areAnyTimeBlocksExpanded
    const nextState: Record<string, boolean> = { ...collapsedGroups }
    activeGroups.forEach(([name]) => {
      nextState[name] = shouldCollapse
    })
    setCollapsedGroups(nextState)
  }

  const renderTimelineBlocks = () => {
    const renderCard = (task: DedupedTask, pGroupName?: string, isGroupIgnited: boolean = true) => {
      const resolvedMod = resolveTaskModality(task)
      const taskWithMod: DedupedTask = {
        ...task,
        loose_modality: task.loose_modality || resolvedMod
      }
      const mId = taskWithMod.modality_id || taskWithMod.protocol_step?.modality_id || resolvedMod?.id || ''
      const benchItem = benchItems.find(b => b.modality_id === mId)
      return (
        <ProtocolTaskCard 
          key={task.id} 
          task={taskWithMod} 
          onStatusChange={handleStatusChange} 
          onTrackOutcomes={openTracker}
          initialBenchItem={benchItem}
          recentTasks={tasks}
          allOutcomes={allOutcomes}
          userProfile={profile}
          wellbeingCheckin={wellbeingCheckin}
          onSaveCustomOutcomes={handleSaveCustomOutcomes}
          onOutcomesSaved={handleOutcomesSaved}
          outcomesRefreshKey={outcomesRefreshKey}
          onOpenRescheduleModal={handleOpenRescheduleModal}
          completionMode={completionMode}
          isRecentlyCompleted={recentlyCompletedIds.has(task.id) || recentlyCompletedIds.has(task.id.split('-split-')[0])}
          isProtocolGroupView={viewMode === 'protocol'}
          protocolGroupName={pGroupName}
          isIgnited={isGroupIgnited}
        />
      )
    }

    if (viewMode === 'protocol') {
      return sortedProtocolGroups.map(([groupName, groupTasks]) => {
        const matchedProtocol = availableProtocols.find((p: any) => p.name === groupName || p.id === groupTasks[0]?.protocol_step?.protocol_id) || groupTasks[0]?.protocol_step?.protocol
        const isCollapsed = isGroupCollapsed(groupName, groupTasks)
        const totalCount = groupTasks.length
        const completedCount = groupTasks.filter(t => t.status === 'completed').length
        const isAllCompleted = completedCount === totalCount && totalCount > 0
        const isCardCollapsed = isAllCompleted && isProtocolCardCollapsed(groupName, groupTasks)

        if (groupName !== 'Standalone & Individual Modalities') {
          // In Focus Mode, hide completely finished protocols if keepCompleted rule is not active
          if (isFocusMode && !focusRules.keepCompleted && isAllCompleted) {
            return null
          }

          const protoId = matchedProtocol?.id || groupTasks[0]?.protocol_step?.protocol_id || ''
          const protoSlug = groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-')

          const sortedGroupTasks = [...groupTasks].sort((a, b) => {
            const orderA = a.protocol_step?.display_order ?? 999
            const orderB = b.protocol_step?.display_order ?? 999
            if (orderA !== orderB) return orderA - orderB

            const slotA = getTimeBlockOrder((a.timing_slot || a.protocol_step?.timing_slot || a.loose_modality?.default_timing_slot || 'anytime').toLowerCase())
            const slotB = getTimeBlockOrder((b.timing_slot || b.protocol_step?.timing_slot || b.loose_modality?.default_timing_slot || 'anytime').toLowerCase())
            if (slotA !== slotB) return slotA - slotB

            return (a.protocol_step?.modality?.name || a.loose_modality?.name || '').localeCompare(
              b.protocol_step?.modality?.name || b.loose_modality?.name || ''
            )
          })

          // In Focus Mode, hide completed, snoozed, and skipped tasks within the protocol
          const tasksToRender = isFocusMode && !focusRules.keepCompleted
            ? sortedGroupTasks.filter(t => t.status !== 'completed' && t.status !== 'skipped' && t.status !== 'not_today')
            : sortedGroupTasks

          if (isFocusMode && !focusRules.keepCompleted && tasksToRender.length === 0) {
            return null
          }

          const visualTheme = getProtocolVisualTheme(matchedProtocol || groupName, groupTasks)

          // When in collapse all mode (or collapsed), completed protocol renders minimal single-line bar
          if (isCardCollapsed) {
            return (
              <div 
                key={groupName} 
                ref={(el) => { groupHeaderRefs.current[groupName] = el }}
                id={`protocol-group-${protoSlug}`}
                data-protocol-id={protoId}
                data-protocol-name={groupName.toLowerCase()}
                onClick={() => toggleProtocolCardCollapse(groupName)}
                className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-purple-500/20 hover:border-purple-500/40 shadow-xl mb-4 relative overflow-hidden backdrop-blur-md transition-all duration-300 cursor-pointer group hover:bg-slate-900/70"
              >
                {/* Top Edge Signature Protocol Gradient Ribbon */}
                <div 
                  className="h-[2.5px] w-full absolute top-0 left-0 transition-opacity duration-300 opacity-80 group-hover:opacity-100" 
                  style={{ background: visualTheme.accentBorderCSS }} 
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                      <Check size={12} className="text-emerald-400 stroke-[3]" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-white truncate">
                      {groupName}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 shrink-0">
                      {completedCount}/{totalCount}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                </div>
              </div>
            )
          }

          return (
            <div 
              key={groupName} 
              ref={(el) => { groupHeaderRefs.current[groupName] = el }}
              id={`protocol-group-${protoSlug}`}
              data-protocol-id={protoId}
              data-protocol-name={groupName.toLowerCase()}
              className="p-4 sm:p-5 rounded-3xl bg-slate-950/70 border border-purple-500/30 shadow-2xl space-y-4 mb-6 relative overflow-hidden backdrop-blur-md transition-all duration-500"
            >
              {/* Ambient subtle glow */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Protocol Overview Card with Description */}
              <ProtocolOverviewHeaderCard
                protocolName={groupName}
                protocolInfo={matchedProtocol as any}
                groupTasks={groupTasks}
                allOutcomes={allOutcomes}
                onCompleteAll={() => handleCompleteGroup(groupName, groupTasks)}
                onTrackGroup={() => handleStartGroupTracking(groupName, groupTasks)}
                isTrackingActive={activeGroupTrackKey === groupName}
                isFutureTimeline={isFutureTimeline}
                onCollapseProtocol={isAllCompleted ? () => toggleProtocolCardCollapse(groupName) : undefined}
              />

              {/* Group Tracking Slider Panel */}
              {activeGroupTrackKey === groupName && (
                <div className="p-4 bg-slate-900/90 border border-purple-500/40 rounded-xl space-y-4 animate-in fade-in shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity size={14} /> Group Tracking: {groupName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveGroupTrackKey(null)}
                      className="text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(groupTrackValues).map(([outcomeId, val]) => {
                      const outcome = allOutcomes.find(o => o.id === outcomeId)
                      if (!outcome) return null
                      const colorCfg = getOutcomeColorConfig(val, outcome.directionality)
                      return (
                        <div key={outcomeId} className="p-3 bg-black/40 border border-white/10 rounded-lg space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white">{outcome.name}</span>
                            <span className={`font-mono font-bold px-2 py-0.5 rounded ${colorCfg.badgeBg} ${colorCfg.textColor}`}>
                              {val} / 10
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={val}
                            onChange={(e) => {
                              const nVal = Number(e.target.value)
                              setGroupTrackValues(prev => ({ ...prev, [outcomeId]: nVal }))
                              setTouchedGroupOutcomes(prev => ({ ...prev, [outcomeId]: true }))
                            }}
                            className="w-full cursor-pointer"
                            style={{ accentColor: colorCfg.accentHex }}
                          />
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleSaveGroupTracking(groupTasks, true)}
                      disabled={isSavingGroupTrack}
                      className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check size={14} /> Save & Mark Group Complete
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveGroupTracking(groupTasks, false)}
                      disabled={isSavingGroupTrack}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Save Only
                    </button>
                  </div>
                </div>
              )}

              {/* Enclosed Protocol Modalities with Collapse Header */}
              <div className="pt-2 pl-2 sm:pl-3 border-l-2 border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <button
                    type="button"
                    onClick={() => toggleGroupCollapse(groupName, groupTasks)}
                    className="text-[11px] font-extrabold uppercase tracking-wider text-purple-300 hover:text-purple-200 flex items-center gap-1.5 cursor-pointer focus:outline-none"
                  >
                    <ChevronDown 
                      size={14} 
                      className={`transition-transform duration-200 ${isCollapsed ? '-rotate-90 text-purple-400' : 'text-purple-300'}`} 
                    />
                    <span>Protocol Modalities ({groupTasks.length})</span>
                  </button>
                  <span className="text-[10px] font-mono text-purple-300/70">
                    {completedCount}/{groupTasks.length} Completed
                  </span>
                </div>

                {!isCollapsed && (
                  <div className={completionMode === 'fast' ? "space-y-1.5" : "space-y-3"}>
                    {tasksToRender.map(task => renderCard(task, groupName, true))}
                  </div>
                )}
              </div>
            </div>
          )
        }

        // Standalone & Individual Modalities in Protocol Mode
        return (
          <div 
            key={groupName} 
            ref={(el) => { groupHeaderRefs.current[groupName] = el }}
            className="p-4 rounded-3xl bg-slate-950/70 border border-white/10 space-y-3 mb-6"
          >
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <span className="text-xs font-bold uppercase text-slate-300">
                {groupName}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {completedCount}/{groupTasks.length} Completed
              </span>
            </div>
            <div className={completionMode === 'fast' ? "space-y-1.5" : "space-y-3"}>
              {groupTasks.map(task => renderCard(task, groupName, true))}
            </div>
          </div>
        )
      })
    }

    // Chronological Mode
    return (
      <>
        {/* Unified "Previous" Section (One header, strictly 2-row items, NO preview trays) */}
        {pastGroups.length > 0 && (
          <div 
            ref={previousSectionRef}
            className="mb-4 sm:mb-6 rounded-2xl border border-purple-500/25 bg-slate-900/60 overflow-hidden backdrop-blur-md shadow-lg"
          >
            {/* "Previous" Header */}
            <button
              type="button"
              onClick={toggleAllPastBlocks}
              className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-slate-900/90 hover:bg-slate-800/90 border-b border-white/5 flex items-center justify-between cursor-pointer select-none transition-colors group text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-300 group-hover:text-purple-200">
                  Previous
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                  {pastCompletedCount}/{pastTotalCount} Logged
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-400 group-hover:text-purple-300">
                <span>{isAllPastExpanded ? 'Collapse All' : 'Catch Up All'}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isAllPastExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* List of Previous Time Blocks */}
            <div className="divide-y divide-white/5">
              {pastGroups.map(([gName, gTasks]) => {
                if (!gTasks || gTasks.length === 0) return null
                const gCircadian = getAdaptiveCircadianConfig(gName, userActualWakeTime, profile?.ideal_wake_time || '06:30')
                const gCompleted = gTasks.filter(t => t.status === 'completed').length
                const isBlockExpanded = expandedPastBlocks[gName] ?? isAllPastExpanded

                return (
                  <div key={gName} className="p-3 sm:p-3.5 hover:bg-white/[0.02] transition-colors">
                    {/* 2-Row Time Block Item (Clicking anywhere within those rows brings up those modalities) */}
                    <div 
                      onClick={() => togglePastBlock(gName)}
                      className="cursor-pointer select-none group/past-row"
                    >
                      {/* Top Row: Time Block Name & Time Range */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-xs font-extrabold uppercase text-slate-200 group-hover/past-row:text-white transition-colors">
                            {formatSlotName(gName)}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">
                            • {gCircadian.timeRange}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Row: (x logged / y total) and text "Catch Up" with expandable chevron */}
                      <div className="flex items-center justify-between mt-1 text-[11px]">
                        <span className="font-mono text-slate-400">
                          ({gCompleted} logged / {gTasks.length} total)
                        </span>
                        <span className="flex items-center gap-1 font-bold text-purple-400 group-hover/past-row:text-purple-300 transition-colors">
                          <span>Catch Up</span>
                          <ChevronDown size={13} className={`transition-transform duration-200 ${isBlockExpanded ? 'rotate-180 text-purple-300' : ''}`} />
                        </span>
                      </div>
                    </div>

                    {/* Expanded Modalities for this Previous Time Block */}
                    {isBlockExpanded && (
                      <div className="pt-3 mt-2 border-t border-white/5 space-y-2">
                        {(() => {
                          const nonSuppPast = gTasks.filter(t => !isTaskSupplement(t))
                          const suppPast = gTasks.filter(t => isTaskSupplement(t))

                          return (
                            <>
                              {nonSuppPast.map(t => renderCard(t, undefined, false))}
                              {suppPast.length > 0 && (
                                <div className={`grid gap-2 pt-1 ${
                                  suppPast.length === 1 
                                    ? 'grid-cols-1' 
                                    : suppPast.length === 2 
                                      ? 'grid-cols-1 sm:grid-cols-2' 
                                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                                }`}>
                                  {suppPast.map(t => {
                                    if (expandedSupplementId === t.id) {
                                      return (
                                        <div key={t.id} className="col-span-full">
                                          {renderCard(t, undefined, false)}
                                        </div>
                                      )
                                    }
                                    const mod = resolveTaskModality(t)
                                    const name = resolveTaskModalityName(t)
                                    const bench = benchItems.find(b => b.modality_id === (t.modality_id || mod?.id))
                                    return (
                                      <SupplementCompactRow
                                        key={t.id}
                                        task={t}
                                        modality={mod}
                                        modalityName={name}
                                        benchItem={bench}
                                        onStatusChange={handleStatusChange}
                                        onOpenRescheduleModal={handleOpenRescheduleModal}
                                        onOpenDetails={() => setExpandedSupplementId(prev => prev === t.id ? null : t.id)}
                                        completionMode={completionMode}
                                      />
                                    )
                                  })}
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Active and Upcoming Chronological Time Blocks */}
        {activeTimelineGroups.map(([groupName, groupTasks]) => {
          if (!groupTasks || groupTasks.length === 0) return null
          const circadian = getAdaptiveCircadianConfig(groupName, userActualWakeTime, profile?.ideal_wake_time || '06:30')
          const CircadianIcon = circadian.icon
          const isNow = isCurrentDay && isCurrentCircadianSlot(groupName)
          const isIgnited = ignitedGroupKeys.has(groupName)
          const isAnytime = groupName === 'anytime'
          const isCollapsed = isGroupCollapsed(groupName, groupTasks)
          const totalCount = groupTasks.length
          const completedCount = groupTasks.filter(t => t.status === 'completed').length

          return (
            <div 
              key={groupName} 
              ref={(el) => { groupHeaderRefs.current[groupName] = el }}
              className={`relative ${
                isAnytime 
                  ? (completionMode === 'fast' ? 'ml-1 sm:ml-2 pl-2 sm:pl-2.5 border-l-2 border-dashed border-purple-500/25 bg-purple-950/10 rounded-2xl p-2 sm:p-2.5 space-y-2 my-2' : 'ml-1 sm:ml-2 pl-2 sm:pl-2.5 border-l-2 border-dashed border-purple-500/25 bg-purple-950/10 rounded-2xl p-2.5 sm:p-3 space-y-2.5 my-3')
                  : (completionMode === 'fast' ? 'pl-1.5 sm:pl-2.5 space-y-2' : 'pl-1.5 sm:pl-2.5 space-y-3')
              } group/circadian-block`}
            >
              {/* Consolidated 2-Row Time Block Header */}
              <div className={`flex flex-col gap-1 sm:gap-1.5 ${isAnytime ? 'border-b border-dashed border-white/10 pb-2' : 'border-b border-white/10 pb-2 sm:pb-2.5'}`}>
                {/* Row 1: Identity & Collapse Trigger */}
                <div 
                  onClick={() => toggleGroupCollapse(groupName, groupTasks)}
                  className="w-full flex items-center justify-between gap-2 text-left group cursor-pointer focus:outline-none select-none py-0.5"
                >
                  {/* Left: Circadian Sky Beacon Icon & Title & Badges */}
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                    {/* Circadian Sky Beacon Icon */}
                    <div 
                      ref={(el) => { beaconRefs.current[groupName] = el }}
                      className={`${isAnytime ? 'w-6 h-6 rounded-lg' : 'w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl'} border flex items-center justify-center shrink-0 transition-all duration-500 ${
                        isIgnited
                          ? `${circadian.badgeBorder} ${circadian.badgeText} ${circadian.glowShadow} scale-100 opacity-100 ${isNow ? circadian.activeRing : ''}`
                          : 'bg-slate-950/60 border-slate-800 text-slate-500/70 scale-95 opacity-40 shadow-none'
                      }`}
                      style={{
                        background: isIgnited ? circadian.badgeGradientCSS : undefined,
                        boxShadow: isIgnited
                          ? (isNow 
                              ? `0 0 22px ${circadian.skyColorHex}99, inset 0 0 10px ${circadian.skyColorHex}33` 
                              : (isAnytime ? `0 0 8px ${circadian.skyColorHex}25` : `0 0 14px ${circadian.skyColorHex}40`))
                          : undefined
                      }}
                    >
                      <CircadianIcon size={isAnytime ? 12 : 16} strokeWidth={isIgnited ? 2.2 : 1.7} />
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      {/* Full Slot Name - Never Cut Off */}
                      <span className={`${isAnytime ? 'text-[11px] sm:text-xs font-bold tracking-normal' : 'text-xs sm:text-sm font-black tracking-wider'} uppercase transition-colors whitespace-nowrap shrink-0 ${
                        isIgnited
                          ? (isAnytime ? 'text-slate-300 group-hover:text-purple-300' : 'text-white group-hover:text-purple-200') 
                          : 'text-slate-200 group-hover:text-white'
                      }`}>
                        {isAnytime ? 'Anytime / Flexible' : formatSlotName(groupName)}
                      </span>

                      {/* Live Pill */}
                      {isNow && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span>Live</span>
                        </span>
                      )}

                      {/* Completed / Total Pill */}
                      <span className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 transition-colors ${
                        completedCount === groupTasks.length && groupTasks.length > 0
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                          : isIgnited
                            ? (isAnytime ? 'bg-purple-950/50 text-purple-300 border border-purple-800/40' : 'bg-slate-800/90 text-slate-200 border border-white/10') 
                            : 'bg-slate-900 text-slate-400 border border-white/5'
                      }`}>
                        {completedCount}/{groupTasks.length}
                      </span>
                    </div>
                  </div>

                  {/* Right: Expand/Collapse Chevron at Far Right Edge */}
                  <div className="flex items-center pl-2 shrink-0 text-slate-400 group-hover:text-white transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                      <ChevronDown 
                        size={16} 
                        className={`transition-transform duration-200 ${
                          isIgnited ? 'text-slate-300 group-hover:text-white' : 'text-slate-500'
                        } ${isCollapsed ? '-rotate-90' : ''}`} 
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Circadian Context (Left) & Action Controls (Right) */}
                <div className="flex items-center justify-between gap-2 pl-8 sm:pl-11 pt-0.5">
                  {/* Left: Time Range & Biological Window Context */}
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
                    {isAnytime ? (
                      <span className="text-[10px] sm:text-[11px] text-slate-500">
                        Flexible window • Complete anytime today
                      </span>
                    ) : (
                      <>
                        <span className={`font-semibold shrink-0 ${isIgnited ? 'text-slate-300' : 'text-slate-400'}`}>
                          {circadian.timeRange}
                        </span>

                        {circadian.pulseBadge && (
                          <>
                            <span className="text-slate-600 text-[10px] select-none shrink-0">•</span>
                            <span 
                              onClick={(e) => {
                                e.stopPropagation()
                                switchToDailyPulse()
                              }}
                              role="button"
                              tabIndex={0}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-105 shrink-0 ${circadian.pulseBadge.badgeBg} ${circadian.pulseBadge.badgeBorder} ${circadian.pulseBadge.badgeText}`}
                              style={circadian.pulseBadge.badgeGradientCSS ? { background: circadian.pulseBadge.badgeGradientCSS } : undefined}
                            >
                              <span 
                                className="w-1.5 h-1.5 rounded-full shrink-0" 
                                style={{ 
                                  background: circadian.pulseBadge.dotGradientCSS || undefined,
                                  backgroundColor: !circadian.pulseBadge.dotGradientCSS ? (circadian.pulseBadge.dotColor || '#10B981') : undefined 
                                }} 
                              />
                              <span className="truncate max-w-[100px] sm:max-w-none">{circadian.pulseBadge.label}</span>
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {/* Right: Action Buttons (Right side of Row 2) */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setAsNeededSlot(groupName)
                        setAsNeededModalityId(undefined)
                        setIsAdHocModalOpen(true)
                      }}
                      className="font-bold flex items-center gap-1 cursor-pointer px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all active:scale-95 shrink-0 shadow-sm"
                      title={`Log an As Needed modality for ${formatSlotName(groupName)}`}
                    >
                      <Plus size={11} className="stroke-[2.5]" />
                      <span className="hidden sm:inline">As Needed</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartGroupTracking(groupName, groupTasks)}
                      className={`font-semibold flex items-center gap-1 cursor-pointer px-2 py-0.5 sm:py-1 rounded-lg transition-colors ${
                        isAnytime 
                          ? 'text-[10px] sm:text-[11px] text-slate-400 hover:text-purple-300 hover:bg-white/5' 
                          : 'text-[10px] sm:text-xs text-purple-400 hover:text-purple-300 hover:bg-white/5'
                      }`}
                    >
                      <Activity size={isAnytime ? 11 : 12} /> {activeGroupTrackKey === groupName ? 'Close' : 'Track'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCompleteGroup(groupName, groupTasks)}
                      className={`font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                        isAnytime 
                          ? 'text-[10px] sm:text-[11px] text-emerald-400/90 hover:text-emerald-300 px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20' 
                          : 'text-[10px] sm:text-xs text-emerald-400 hover:text-emerald-300 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30'
                      }`}
                    >
                      <Check size={isAnytime ? 11 : 12} strokeWidth={2.5} /> 
                      <span className="hidden sm:inline">Complete All</span>
                      <span className="sm:hidden">All</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Group Tracking Slider Panel */}
              {activeGroupTrackKey === groupName && (
                <div className="p-4 bg-slate-900/90 border border-purple-500/40 rounded-xl space-y-4 animate-in fade-in shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity size={14} /> Group Tracking: {groupName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveGroupTrackKey(null)}
                      className="text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(groupTrackValues).map(([outcomeId, val]) => {
                      const outcome = allOutcomes.find(o => o.id === outcomeId)
                      if (!outcome) return null
                      const colorCfg = getOutcomeColorConfig(val, outcome.directionality)
                      return (
                        <div key={outcomeId} className="p-3 bg-black/40 border border-white/10 rounded-lg space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white">{outcome.name}</span>
                            <span className={`font-mono font-bold px-2 py-0.5 rounded ${colorCfg.badgeBg} ${colorCfg.textColor}`}>
                              {val} / 10
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={val}
                            onChange={(e) => {
                              const nVal = Number(e.target.value)
                              setGroupTrackValues(prev => ({ ...prev, [outcomeId]: nVal }))
                              setTouchedGroupOutcomes(prev => ({ ...prev, [outcomeId]: true }))
                            }}
                            className="w-full cursor-pointer"
                            style={{ accentColor: colorCfg.accentHex }}
                          />
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleSaveGroupTracking(groupTasks, true)}
                      disabled={isSavingGroupTrack}
                      className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check size={14} /> Save & Mark Group Complete
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveGroupTracking(groupTasks, false)}
                      disabled={isSavingGroupTrack}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Save Only
                    </button>
                  </div>
                </div>
              )}

              {/* Active Block Tasks */}
              {!isCollapsed && (
                <div className={completionMode === 'fast' ? "space-y-1.5 pt-1" : "space-y-3 pt-1"}>
                  {(() => {
                    const sortedTasks = [...groupTasks].sort(
                      (a, b) => (a.protocol_step?.display_order || 0) - (b.protocol_step?.display_order || 0)
                    )

                    const nonSuppTasks = sortedTasks.filter(t => !isTaskSupplement(t))
                    const suppTasks = sortedTasks.filter(t => isTaskSupplement(t))
                    const allSuppsCompleted = suppTasks.length > 0 && suppTasks.every(t => t.status === 'completed')
                    const suppCompletedCount = suppTasks.filter(t => t.status === 'completed').length
                    
                    // If 3 or less supplements, visible by default; if 4 or more, collapsed by default
                    const defaultSuppExpanded = suppTasks.length <= 3
                    const isSuppStackExpanded = expandedSupplementBlocks[groupName] ?? defaultSuppExpanded

                    return (
                      <>
                        {/* Non-Supplement Modalities (Habits, Exercise, Sunlight, etc.) */}
                        {nonSuppTasks.map(t => renderCard(t, undefined, isIgnited))}

                        {/* Supplement Stacking */}
                        {suppTasks.length > 0 && (
                          <div className="pt-1.5">
                            {/* If 2+ supplements: 1-Row Nested Supplement Stack Header */}
                            {suppTasks.length >= 2 && (
                              <div 
                                onClick={() => setExpandedSupplementBlocks(prev => ({ ...prev, [groupName]: !isSuppStackExpanded }))}
                                className="p-2 sm:p-2.5 rounded-xl bg-purple-950/25 hover:bg-purple-950/40 border border-purple-500/25 transition-all cursor-pointer select-none flex items-center justify-between group my-1"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-5 h-5 rounded-md bg-purple-900/50 border border-purple-500/30 flex items-center justify-center text-[11px] shrink-0 text-purple-300">
                                    💊
                                  </span>
                                  <span className="text-xs font-bold text-purple-200 group-hover:text-white transition-colors truncate">
                                    {formatSlotName(groupName)} Supplements ({suppTasks.length})
                                  </span>
                                  <span className="text-[10px] text-purple-300/70 font-mono shrink-0">
                                    • {suppCompletedCount}/{suppTasks.length} Taken
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                  {allSuppsCompleted ? (
                                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <Check size={11} strokeWidth={2.5} /> All Taken
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleCompleteMultipleTasks(suppTasks)}
                                      className="text-[10px] font-bold text-purple-200 hover:text-white bg-purple-900/60 hover:bg-purple-800 border border-purple-500/40 px-2.5 py-0.5 rounded-md transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                                    >
                                      <Check size={11} strokeWidth={2.5} /> Take All
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setExpandedSupplementBlocks(prev => ({ ...prev, [groupName]: !isSuppStackExpanded }))}
                                    className="p-1 text-purple-400 group-hover:text-purple-200 cursor-pointer"
                                  >
                                    <ChevronDown size={14} className={`transition-transform duration-200 ${isSuppStackExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* When Expanded or Single Supp: render compact supplement rows next to each other */}
                            {(suppTasks.length === 1 || isSuppStackExpanded) && (
                              <div className={`grid gap-2 pt-1 animate-in fade-in ${
                                suppTasks.length === 1 
                                  ? 'grid-cols-1' 
                                  : suppTasks.length === 2 
                                    ? 'grid-cols-1 sm:grid-cols-2' 
                                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                              }`}>
                                {suppTasks.map(t => {
                                  if (expandedSupplementId === t.id) {
                                    return (
                                      <div key={t.id} className="col-span-full">
                                        {renderCard(t, undefined, isIgnited)}
                                      </div>
                                    )
                                  }
                                  const mod = resolveTaskModality(t)
                                  const name = resolveTaskModalityName(t)
                                  const bench = benchItems.find(b => b.modality_id === (t.modality_id || mod?.id))
                                  return (
                                    <SupplementCompactRow
                                      key={t.id}
                                      task={t}
                                      modality={mod}
                                      modalityName={name}
                                      benchItem={bench}
                                      onStatusChange={handleStatusChange}
                                      onOpenRescheduleModal={handleOpenRescheduleModal}
                                      onOpenDetails={() => setExpandedSupplementId(prev => prev === t.id ? null : t.id)}
                                      completionMode={completionMode}
                                    />
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          )
        })}
      </>
    )
  }

  if (!isMounted) {
    return <div className="min-h-screen bg-levl-bg" />
  }

  return (
    <div 
      onTouchStart={handlePullTouchStart}
      onTouchMove={handlePullTouchMove}
      onTouchEnd={handlePullTouchEnd}
      className="min-h-screen bg-levl-bg text-levl-text-primary pb-24 relative"
    >
      {/* Pull to Refresh Visual Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="fixed top-2 left-0 right-0 z-40 flex justify-center pointer-events-none transition-all duration-200"
          style={{ transform: `translateY(${pullDistance}px)` }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/95 border border-purple-500/40 text-purple-300 text-xs font-bold shadow-2xl backdrop-blur-md animate-in fade-in">
            <RefreshCw size={13} className={`text-purple-400 ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 4}deg)` }} />
            <span className="text-[11px]">{isRefreshing ? 'Refreshing stack...' : pullDistance >= 45 ? 'Release to refresh' : 'Pull to refresh'}</span>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {completionToast && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[60] flex items-center gap-3 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/40 shrink-0">
            <Check size={18} strokeWidth={3} />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Completed!</span>
              {completionToast.dose && <span className="text-[10px] text-emerald-400 font-normal">({completionToast.dose})</span>}
            </div>
            <div className="text-xs text-emerald-300/80 font-medium">{completionToast.name}</div>
          </div>
        </div>
      )}

      {/* Action Feedback Toast (.5s Confirmation for Bench & Eliminate) */}
      {actionFeedback && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 border bg-slate-950/95 border-slate-700">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 border ${
            actionFeedback.type === 'eliminate'
              ? 'bg-red-500/20 text-red-400 border-red-500/40'
              : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
          }`}>
            <Check size={18} strokeWidth={3} />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{actionFeedback.type === 'eliminate' ? 'Eliminated from Schedule' : 'Moved to Bench'}</span>
            </div>
            <div className={`text-xs font-medium ${actionFeedback.type === 'eliminate' ? 'text-red-300/90' : 'text-purple-300/90'}`}>
              {actionFeedback.message}
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div 
        className={`mx-auto px-3 sm:px-6 pt-4 sm:pt-6 transition-all duration-300 ${
          calendarViewMode === 'today'
            ? displayMode === 'blocks'
              ? 'max-w-4xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1500px]'
              : 'max-w-4xl'
            : 'max-w-7xl'
        }`}
      >
        
        {/* Protocol Filter Header if specific protocol filtered */}
        {selectedProtocolFilter !== 'all' && !isFocusMode && (
          <div className="mb-4">
            <ProtocolOverviewHeaderCard 
              protocolName={availableProtocols.find((p: any) => p.id === selectedProtocolFilter)?.name || 'Protocol'}
              groupTasks={dedupedTasks.filter(t => (t.protocol_step?.protocol_id === selectedProtocolFilter || (t as any).user_protocol_instance?.protocol_id === selectedProtocolFilter) && isTaskMatchingActiveFilter(t))}
              allOutcomes={allOutcomes}
              onCompleteAll={() => {}}
              onTrackGroup={() => {}}
              isTrackingActive={false}
            />
          </div>
        )}

        {/* Unified Category & Outcomes Filter at Top (Today, 3-Day, Week, and Month Views) */}
        {calendarViewMode !== 'pulse' && (isFocusMode ? focusRules.keepCategoryFilters : (homeWidgets.categoryFilters !== false)) && (
          <CategoryFiltersBar
            selectedMainCategories={selectedMainCategories}
            selectedSubCategories={selectedSubCategories}
            onToggleMainCategory={handleToggleMainCategory}
            onToggleSubCategory={handleToggleSubCategory}
            viewMode={calendarViewMode}
            layoutOrientation={layoutOrientation}
            onToggleLayoutOrientation={setLayoutOrientation}
            filterLens={filterLens}
            onToggleFilterLens={setFilterLens}
            selectedOutcomes={selectedOutcomes}
            onToggleOutcome={(outcomeName) => {
              setSelectedOutcomes(prev =>
                prev.includes(outcomeName) ? prev.filter(o => o !== outcomeName) : [...prev, outcomeName]
              )
            }}
            onClearOutcomes={() => setSelectedOutcomes([])}
            availableOutcomes={allOutcomes.map(o => o.name)}
            userProfile={profile}
            allOutcomeDimensions={allOutcomes}
            selectedProtocolFilter={selectedProtocolFilter}
            onProtocolFilterChange={setSelectedProtocolFilter}
            availableProtocols={availableProtocols}
            onEnrollClick={() => setIsEnrollModalOpen(true)}
          />
        )}

        {/* 2. PRIMARY DATE NAVIGATION TOOLBAR (Always at Top, unified across Today, 3-Day, Week, and Month Views) */}
        <div className="flex items-center justify-between w-full my-4 px-1 gap-2">
          <button 
            type="button"
            onClick={handlePreviousBatch}
            className={`p-2 rounded-xl border transition-all shadow-sm cursor-pointer active:scale-95 shrink-0 ${
              isLight
                ? 'bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border-slate-200 shadow-sm'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
            }`}
            aria-label={prevButtonTooltip}
            title={prevButtonTooltip}
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2.5 sm:gap-3 text-center flex-wrap justify-center">
            {!isCurrentPeriod && (
              <button 
                type="button"
                onClick={() => navigateToDate(new Date())}
                className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer active:scale-95 border ${
                  isLight
                    ? 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300 text-emerald-800'
                    : 'bg-emerald-950/80 hover:bg-emerald-900/80 border-emerald-800/80 text-emerald-300 hover:text-emerald-200'
                }`}
              >
                {jumpButtonLabel}
              </button>
            )}

            <span className={`text-sm sm:text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'} tracking-tight transition-opacity duration-150 ${isDateSwitching ? 'opacity-60' : 'opacity-100'}`}>
              {navBarTitle}
            </span>

            {calendarViewMode === 'today' && dedupedTasks.length > 0 && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-all duration-500 flex items-center gap-1.5 ${
                progressPercent === 100
                  ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-emerald-500/25 border border-emerald-400/80 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400/40 animate-pulse'
                  : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              }`}>
                {progressPercent === 100 ? (
                  <>
                    <Sparkles size={12} className="text-amber-300 animate-spin" style={{ animationDuration: '3s' }} />
                    <span>100% Complete</span>
                  </>
                ) : (
                  <span>{progressPercent}% Complete</span>
                )}
              </span>
            )}

            {/* Focus Mode (Super Simple View) Toggle Button */}
            {calendarViewMode === 'today' && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection')
                  toggleFocusMode()
                }}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 border ${
                  isFocusMode
                    ? isLight
                      ? 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300 text-emerald-800'
                      : 'bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300'
                    : isLight
                    ? 'bg-white/90 hover:bg-white border-slate-200 text-slate-700 hover:text-slate-900'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white'
                }`}
                title={isFocusMode ? "Focus Mode ON (Super Simple View) — Click to show all tools & completed tasks" : "Focus Mode OFF — Click to collapse tools and focus on pending modalities"}
                aria-label="Toggle Focus Mode"
              >
                <Zap size={13} className={isFocusMode ? "fill-emerald-400 text-emerald-400 animate-pulse" : isLight ? "text-slate-500" : "text-slate-400"} />
                <span>Focus</span>
              </button>
            )}

            {/* Consolidated Dashboard & Layout Button */}
            {calendarViewMode === 'today' && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection')
                  setIsLayoutModalOpen(true)
                }}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 border ${
                  isLayoutModalOpen
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                    : isLight
                    ? 'bg-white/90 hover:bg-white border-slate-200 text-slate-700 hover:text-slate-900'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white'
                }`}
                title="Customize Theme, Density, Typography, Widgets & Focus Rules"
                aria-label="Open Layout Preferences"
              >
                <SlidersHorizontal size={13} className={isLayoutModalOpen ? "text-white" : "text-purple-400"} />
                <span>Layout</span>
              </button>
            )}

            {/* Survival Mode (80/20 Routine) Active Pill */}
            {calendarViewMode === 'today' && (dailyBandwidthMode === 'survival_80_20' || isShieldActive) && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection')
                  handleOpenAdaptiveGovernor('survival_80_20')
                }}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/40 text-amber-300"
                title="Survival Mode (80/20 Routine Active) — Click to review changes, why they were made, or adjust your routine"
                aria-label="Open Survival Mode Routine Adjustments"
              >
                <Shield size={13} className="text-amber-400 fill-amber-400/20 animate-pulse" />
                <span>Survival</span>
              </button>
            )}

            {/* Peak Mode (High Readiness Expansion) Active Pill */}
            {calendarViewMode === 'today' && dailyBandwidthMode === 'peak_surge' && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection')
                  handleOpenAdaptiveGovernor('peak_surge')
                }}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/40 text-cyan-300"
                title="Peak Mode Active — Click to review added high-capacity adaptations, why they were added, or adjust your routine"
                aria-label="Open Peak Mode Routine Adjustments"
              >
                <Flame size={13} className="text-cyan-400 fill-cyan-400/20 animate-pulse" />
                <span>Peak</span>
              </button>
            )}



            {calendarViewMode !== 'today' && calendarViewMode !== 'pulse' && multiDayStats && multiDayStats.total > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)] flex items-center gap-1">
                <span>{multiDayStats.completed}/{multiDayStats.total}</span>
                <span className="text-emerald-400/70 font-semibold">({multiDayStats.pct}%)</span>
              </span>
            )}
          </div>

          <button 
            type="button"
            onClick={handleNextBatch}
            className={`p-2 rounded-xl border transition-all shadow-sm cursor-pointer active:scale-95 shrink-0 ${
              isLight
                ? 'bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border-slate-200 shadow-sm'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
            }`}
            aria-label={nextButtonTooltip}
            title={nextButtonTooltip}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Enticing Guest Mode 3-Door Launchpad Hub */}
        {showGuestOnboardingCard && !isFocusMode && (
          <NewUserWelcomeHub
            onOpenEnrollModal={() => setIsEnrollModalOpen(true)}
            onDismiss={handleDismissGuestCard}
            userFirstName={userFirstName}
          />
        )}

        {/* 100% Protocol Completion Micro-Celebration Banner */}
        {show100Celebration && (
          <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-slate-950/80 border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.25)] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)] shrink-0">
                <Sparkles size={16} className="text-emerald-300 animate-pulse" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                  <span>100% Daily Protocol Completed!</span>
                  <span className="text-[9px] font-mono text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded font-bold uppercase">
                    All Pathways Active
                  </span>
                </h4>
                <p className="text-[10px] text-emerald-200/80 truncate">
                  Every scheduled longevity modality has been checked off for today. Exceptional biological consistency!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShow100Celebration(false)}
              className="p-1 rounded-lg text-emerald-400/60 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* BLOCKS MODE RENDERING */}
        {calendarViewMode === 'today' && displayMode === 'blocks' && (
          <div className="mb-8">
            <BlocksViewContainer
              tasks={dedupedTasks.map(task => {
                const resolvedMod = resolveTaskModality(task)
                return {
                  ...task,
                  loose_modality: task.loose_modality || resolvedMod
                }
              })}
              benchItems={benchItems}
              userProfile={profile}
              isFocusMode={isFocusMode}
              allOutcomes={allOutcomes}
              allModalities={allModalities}
              wellbeingCheckin={wellbeingCheckin}
              date={dateStr}
              localUserId={authUserId || profile?.local_user_id || getLocalUserId()}
              onStatusChange={handleStatusChange}
              onOpenRescheduleModal={handleOpenRescheduleModal}
              onMoveToBench={async (modalityId) => {
                await handleMoveToBench(modalityId)
              }}
              onSaveCustomOutcomes={handleSaveCustomOutcomes}
              onAddActivity={(slotKey) => {
                setAsNeededSlot(slotKey)
                setAsNeededModalityId(undefined)
                setIsAdHocModalOpen(true)
              }}
              onMoveTaskToSlot={handleMoveTaskToSlot}
              onAddToToday={async (modalityId: string) => {
                if (profile) {
                  await addModalityOrProtocolToToday(profile.local_user_id, dateStr, modalityId)
                  await refreshTodayTasks()
                }
              }}
              streakDays={0}
            />
          </div>
        )}

        {/* 3-Wide Daily Quick-Log Hotkeys Bar */}
        {calendarViewMode === 'today' && displayMode !== 'blocks' && (isFocusMode ? focusRules.keepHotkeys : homeWidgets.quickHotkeys) && (
          <QuickHotkeyGrid
            date={dateStr}
            localUserId={authUserId || profile?.local_user_id || getLocalUserId()}
            userProfile={profile}
            showInfradian={isFocusMode ? focusRules.keepInfradian : homeWidgets.infradian}
          />
        )}

        {/* As Needed Quick-Tap Strip (Single Row: "As Needed: + Log" and "Search") */}
        {calendarViewMode === 'today' && displayMode !== 'blocks' && !isFocusMode && homeWidgets.asNeeded && (
          <div className="mb-4 -mt-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none py-1 px-1">
            <div className="flex items-center gap-1.5 shrink-0 text-amber-400 font-extrabold text-[11px] uppercase tracking-wider pl-0.5">
              <Zap size={13} className="text-amber-400" />
              <span>As Needed:</span>
            </div>

            {/* Prominent + Button in single row to immediately search and log */}
            <button
              type="button"
              onClick={() => {
                setAsNeededSlot(undefined)
                setAsNeededModalityId(undefined)
                setIsAdHocModalOpen(true)
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 shadow-sm shadow-amber-500/15 active:scale-95"
              title="Search and log any As Needed modality"
            >
              <Plus size={13} className="stroke-[3]" />
              <span>Log</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAsNeededSlot(undefined)
                setAsNeededModalityId(undefined)
                setIsAdHocModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0"
              title="Search all modalities"
            >
              <Search size={11} />
              <span>Search</span>
            </button>
          </div>
        )}

        {/* Infradian & Menstrual Cycle Adaptive Protocol Banner (Strictly for Female Users < 52 who opted in) */}
        {calendarViewMode === 'today' &&
          displayMode !== 'blocks' &&
          profile?.biological_sex?.toLowerCase() === 'female' &&
          Boolean(profile?.age && profile.age < 52) &&
          Boolean(profile?.infradian_cycle_enabled) &&
          (isFocusMode ? focusRules.keepInfradian : homeWidgets.infradian) &&
          infradianStatus &&
          infradianStatus.enabled && (
          <div className="mb-6">
            <InfradianAdaptiveBanner
              status={infradianStatus}
              localUserId={authUserId || profile?.local_user_id || getLocalUserId()}
              userProfile={profile}
              targetDate={dateStr}
              onAddModalityToToday={async (modalityName: string) => {
                if (profile) {
                  await addModalityOrProtocolToToday(profile.local_user_id, dateStr, modalityName)
                  await refreshTodayTasks()
                }
              }}
              onStatusUpdated={() => {
                refreshTodayTasks()
              }}
            />
          </div>
        )}

        {/* Loading spinner when switching to multi-day views while data fetches */}
        {calendarViewMode !== 'today' && calendarViewMode !== 'pulse' && Object.keys(multiDayTasks).length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center space-y-3 animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
            <span className="text-xs font-bold text-slate-400">
              Loading {calendarViewMode === '3day' ? '3-day split' : calendarViewMode === 'week' ? '7-day week matrix' : 'month matrix'}...
            </span>
          </div>
        )}

        {/* Daily Pulse View (Growth vs Recovery Barometer & Auto-Harmonize) */}
        {calendarViewMode === 'pulse' && (
          <div className="animate-in fade-in duration-200 mb-8">
            <DailyVerticalPulseView
              tasks={allAvailableTasks}
              selectedDate={currentDate}
              weekDays={weekDates.map(d => parseLocalDate(d))}
              userProfile={profile}
              onSelectDate={(d: Date) => navigateToDate(d)}
              onTaskUpdated={() => refreshTodayTasks()}
            />
          </div>
        )}

        {/* Multi-Day Timeline Layout Mode Toggle Bar (Time Blocks vs Protocols + Side-by-Side vs Stack) */}
        {(calendarViewMode === '3day' || calendarViewMode === 'week' || calendarViewMode === 'month') && (
          <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 p-1 sm:p-2 rounded-2xl mb-3 backdrop-blur-md shadow-sm gap-1 sm:gap-2">
            {/* Left: Timeline Layout Mode (Time Blocks vs Protocols) */}
            <div className="flex items-center">
              <div className="flex items-center bg-black/60 p-0.5 rounded-xl border border-white/10 gap-0.5 text-[10px] sm:text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('chronological')}
                  className={`px-2 sm:px-3 py-1 rounded-lg font-bold text-[10px] sm:text-xs tracking-tight transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    viewMode === 'chronological'
                      ? 'bg-purple-600 text-white shadow-sm border border-purple-400/30 font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock size={11} className="shrink-0" />
                  <span>Time Blocks</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('protocol')}
                  className={`px-2 sm:px-3 py-1 rounded-lg font-bold text-[10px] sm:text-xs tracking-tight transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    viewMode === 'protocol'
                      ? 'bg-purple-600 text-white shadow-sm border border-purple-400/30 font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ListOrdered size={11} className="shrink-0" />
                  <span>Protocols</span>
                </button>
              </div>
            </div>

            {/* Right: Layout Orientation (Side-by-Side vs Stack) */}
            <div className="flex items-center bg-black/60 p-0.5 rounded-xl border border-white/10 gap-0.5 text-[10px] sm:text-xs">
              <button
                type="button"
                onClick={() => setLayoutOrientation('columns')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg font-bold text-[10px] sm:text-xs transition-all flex items-center gap-1 cursor-pointer ${
                  layoutOrientation === 'columns'
                    ? 'bg-teal-600 text-white shadow-sm border border-teal-400/30 font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Side-by-Side View"
              >
                <Columns size={11} className="shrink-0" />
                <span className="hidden sm:inline">Side-by-Side</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutOrientation('stack')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg font-bold text-[10px] sm:text-xs transition-all flex items-center gap-1 cursor-pointer ${
                  layoutOrientation === 'stack'
                    ? 'bg-teal-600 text-white shadow-sm border border-teal-400/30 font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Vertical Stacked View"
              >
                <Rows size={11} className="shrink-0" />
                <span className="hidden sm:inline">Stack</span>
              </button>
            </div>
          </div>
        )}

        {/* Multi-Day Calendar View Renders */}
        {calendarViewMode === '3day' && (
          <ThreeDaySplitView
            tasksByDate={filteredMultiDayTasks}
            threeDates={threeDates}
            currentDateStr={dateStr}
            selectedProtocolFilter={selectedProtocolFilter}
            selectedIsolatedOutcome={selectedIsolatedOutcome}
            layoutOrientation={layoutOrientation}
            viewMode={viewMode === 'protocol' ? 'protocol' : 'chronological'}
            userProfile={profile}
            onSelectDate={(dStr: string) => {
              navigateToDate(parseLocalDate(dStr))
              setCalendarViewMode('today')
            }}
            onTaskStatusChange={handleStatusChange}
            onOpenDosageModal={(mod: any) => setActiveModality(mod)}
            onOpenRescheduleModal={handleOpenRescheduleModal}
            onMoveToBench={handleMoveToBench}
            onEliminateEntirely={handleEliminateEntirely}
          />
        )}

        {calendarViewMode === 'week' && (
          <SevenDayWeekView
            tasksByDate={filteredMultiDayTasks}
            weekDates={weekDates}
            currentDateStr={dateStr}
            selectedProtocolFilter={selectedProtocolFilter}
            selectedIsolatedOutcome={selectedIsolatedOutcome}
            layoutOrientation={layoutOrientation}
            viewMode={viewMode === 'protocol' ? 'protocol' : 'chronological'}
            userProfile={profile}
            onSelectDate={(dStr: string) => {
              navigateToDate(parseLocalDate(dStr))
              setCalendarViewMode('today')
            }}
            onTaskStatusChange={handleStatusChange}
            onOpenDosageModal={(mod: any) => setActiveModality(mod)}
            onOpenRescheduleModal={handleOpenRescheduleModal}
            onMoveToBench={handleMoveToBench}
            onEliminateEntirely={handleEliminateEntirely}
          />
        )}

        {calendarViewMode === 'month' && (
          <MonthMatrixView
            tasksByDate={filteredMultiDayTasks}
            currentDateStr={dateStr}
            selectedProtocolFilter={selectedProtocolFilter}
            selectedIsolatedOutcome={selectedIsolatedOutcome}
            layoutOrientation={layoutOrientation}
            viewMode={viewMode === 'protocol' ? 'protocol' : 'chronological'}
            userProfile={profile}
            onSelectDate={(dStr: string) => {
              navigateToDate(parseLocalDate(dStr))
              setCalendarViewMode('today')
            }}
            onMoveToBench={handleMoveToBench}
            onEliminateEntirely={handleEliminateEntirely}
          />
        )}

        {/* Primary Timeline & Today Section */}
        {calendarViewMode === 'today' && displayMode !== 'blocks' && (
          <>
            {/* Late-Night Window Notification Banner */}
            {isViewingYesterdayLateNight && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-indigo-950/70 to-slate-950 border border-purple-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center shrink-0 text-purple-300 shadow-inner">
                    <Moon size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-xs sm:text-sm">🌙 Late-Night Wind Down Mode</span>
                      <span className="text-[10px] text-purple-200 bg-purple-500/25 px-2.5 py-0.5 rounded-full font-semibold border border-purple-400/30 font-mono">
                        Showing Yesterday ({format(activeDate, 'EEE, MMM d')})
                      </span>
                    </div>
                    <p className="text-xs text-purple-200/80 mt-1">
                      It's after midnight and before your wake-up window. We've loaded yesterday so you can finish your evening routine and log your evening check-in.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => navigateToDate(new Date())}
                    className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 border border-purple-400/40 px-3.5 py-1.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Switch to Today</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* 3. Daily Historical Debrief Header & Snapshot when viewing past dates */}
            {isPastDate && !isFocusMode && (
              <div className="mb-6">
                <DailyHistoricalDebriefHeader
                  summary={dailyEfficacySummary}
                  tasks={tasks}
                  selectedIsolatedOutcome={selectedIsolatedOutcome}
                  onSelectIsolatedOutcome={setSelectedIsolatedOutcome}
                />
              </div>
            )}

            {/* 4. Daily Wellbeing Check-in: Morning & Daytime */}
            {(isFocusMode ? focusRules.keepWellbeing : homeWidgets.wellbeing) && (
              <div className="mb-6">
                <DailyWellbeingCheckin 
                  onSave={handleWellbeingSave} 
                  initialData={wellbeingCheckin}
                  profile={profile}
                  allOutcomes={allOutcomes}
                  date={currentDate}
                  isCurrentDay={isCurrentDay}
                  isCollapsedByDefault={true}
                  forceCollapseTier={isFocusMode ? 'minimal' : undefined}
                  recentTasks={tasks}
                  section="morning_anytime"
                />
              </div>
            )}

            {/* 4b. Adaptive Sleep Recovery Protocol Triage Card */}
            {shouldShowSleepTriage && (isFocusMode ? focusRules.keepSleepTriage : homeWidgets.sleepTriage) && (
              <AdaptiveSleepTriageCard
                actualSleepMinutes={userActualSleepMinutes || 0}
                subjectiveSleep={userSubjectiveSleep ?? 5}
                dateStr={dateStr}
                localUserId={authUserId || profile?.local_user_id || getLocalUserId()}
                todayTasks={tasks}
                onApplied={() => {
                  refreshTodayTasks()
                }}
                onDismiss={() => {
                  setIsSleepTriageDismissed(true)
                }}
              />
            )}

            {/* 5. Daily Longevity Tip Banner (Hidden once added to today, benched, or skipped) */}
            {!isTipActedUpon && (isFocusMode ? focusRules.keepTip : homeWidgets.longevityTip) && (
              <div className="mb-4">
                <DailyLongevityTipBanner 
                  scoredTips={scoredTips}
                  allModalities={allModalities}
                  userProfile={profile}
                  dateStr={dateStr}
                  onAddToToday={async (modalityOrProtocolId: string) => {
                    if (typeof window !== 'undefined') {
                      safeLocalStorageSet('levl_daily_tip_acted_' + dateStr, 'true')
                    }
                    if (profile) {
                      await addModalityOrProtocolToToday(profile.local_user_id, dateStr, modalityOrProtocolId)
                      await refreshTodayTasks()
                    }
                  }}
                  onAddToBench={async (modalityId: string) => {
                    if (typeof window !== 'undefined') {
                      safeLocalStorageSet('levl_daily_tip_acted_' + dateStr, 'true')
                    }
                    await handleMoveToBench(modalityId)
                  }}
                  onDismiss={(tipId: string) => {
                    if (typeof window !== 'undefined') {
                      safeLocalStorageSet('levl_daily_tip_acted_' + dateStr, 'true')
                    }
                    setDismissedTipIds(prev => [...prev, tipId])
                  }}
                  isCollapsedByDefault={true}
                />
              </div>
            )}

            {/* Full-Width AI Longevity Coach Input Bar */}
            {(isFocusMode ? focusRules.keepAICoach : homeWidgets.aiCoach) && (
              <div className="mb-6">
                <LongevityCoachInputBar
                  userProfile={profile}
                  todayTasks={tasks}
                  currentTipHeadline={!isTipActedUpon && scoredTips && scoredTips.length > 0 ? scoredTips[0].tip.headline : undefined}
                  onAddToToday={async (nameOrId: string) => {
                    if (profile) {
                      const res = await addModalityOrProtocolToToday(profile.local_user_id, dateStr, nameOrId)
                      await refreshTodayTasks()
                      return res
                    }
                    return { success: false }
                  }}
                  onScrollToModality={handleScrollToModality}
                  onOpenModalityStudio={(name: string, aiSuggestions?: any) => {
                    let doseAmount = ''
                    let doseUnit = 'mg'
                    if (aiSuggestions?.suggestedDose) {
                      const parts = aiSuggestions.suggestedDose.trim().split(/\s+/)
                      if (parts.length >= 2) {
                        doseAmount = parts[0]
                        doseUnit = parts.slice(1).join(' ')
                      } else {
                        doseAmount = parts[0]
                      }
                    }

                    setStudioModalData({
                      isOpen: true,
                      initialData: {
                        name,
                        doseAmount,
                        doseUnit,
                        timingSlot: aiSuggestions?.suggestedTiming || 'morning_supplement_stack',
                        cadenceMode: aiSuggestions?.suggestedScheduleMode === 'rest_interval' ? 'interval' : (aiSuggestions?.suggestedDays?.length ? 'days_of_week' : 'daily'),
                        selectedDays: aiSuggestions?.suggestedDays || ['Mon', 'Wed', 'Fri'],
                        restIntervalDays: aiSuggestions?.suggestedRestIntervalDays ?? 1,
                        startTab: 'dosing'
                      }
                    })
                  }}
                />
              </div>
            )}

            {/* Completed, Snoozed, & Skipped Modalities Group (Zero Space Between Them) */}
            {(() => {
              if (isFocusMode) {
                if (allCompletedTasks.length === 0 && allSkippedTasks.length === 0) return null
                return (
                  <div className="mb-6 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 animate-in fade-in">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <span className="truncate">
                        <strong className="text-white font-semibold">Focus Mode:</strong> {allCompletedTasks.length} completed{allSkippedTasks.length > 0 ? `, ${allSkippedTasks.length} skipped` : ''} modalities hidden
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFocusMode()}
                      className="text-emerald-400 hover:text-emerald-300 font-bold text-xs underline underline-offset-2 transition-colors cursor-pointer shrink-0 ml-2"
                    >
                      Exit Focus
                    </button>
                  </div>
                )
              }

              const activeStatusSections: ('completed' | 'snoozed' | 'skipped')[] = []
              if (allCompletedTasks.length > 0 && viewMode !== 'protocol') activeStatusSections.push('completed')
              if (allSnoozedTasks.length > 0) activeStatusSections.push('snoozed')
              if (allSkippedTasks.length > 0) activeStatusSections.push('skipped')

              if (activeStatusSections.length === 0) return null

              const getStatusSectionClasses = (sectionName: 'completed' | 'snoozed' | 'skipped') => {
                const index = activeStatusSections.indexOf(sectionName)
                if (index === -1) return ''
                const isFirst = index === 0
                const isLast = index === activeStatusSections.length - 1

                if (isFirst && isLast) {
                  return 'rounded-xl'
                }
                if (isFirst) {
                  return 'rounded-t-xl rounded-b-none border-b-0'
                }
                if (isLast) {
                  return 'rounded-b-xl rounded-t-none border-t-0'
                }
                return 'rounded-none border-t-0 border-b-0'
              }

              const isCompletedLast = activeStatusSections.indexOf('completed') === activeStatusSections.length - 1
              const isSnoozedLast = activeStatusSections.indexOf('snoozed') === activeStatusSections.length - 1

              return (
                <div className="mb-6 flex flex-col space-y-0">
                  {/* Completed Modalities Section */}
                  {allCompletedTasks.length > 0 && (
                    <div className={`overflow-hidden border border-emerald-500/30 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all duration-300 ${getStatusSectionClasses('completed')}`}>
                      <div className={`w-full flex items-center justify-between p-3 sm:p-3.5 bg-emerald-500/10 gap-2 ${isCompletedSectionExpanded || !isCompletedLast ? 'border-b border-emerald-500/20' : ''}`}>
                        <button 
                          type="button"
                          onClick={() => setIsCompletedSectionExpanded(!isCompletedSectionExpanded)}
                          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer flex-1 min-w-0 text-left"
                        >
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)] shrink-0">
                            <Check size={13} strokeWidth={3} />
                          </div>
                          <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider whitespace-nowrap truncate">
                            Completed Modalities
                          </h2>
                          <span className="text-[11px] sm:text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 sm:px-2.5 py-0.5 rounded-full font-mono font-bold shrink-0">
                            {allCompletedTasks.length}
                          </span>
                        </button>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setIsCompletedSectionExpanded(!isCompletedSectionExpanded)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium px-1.5 sm:px-2 py-1 cursor-pointer shrink-0"
                          >
                            <span>{isCompletedSectionExpanded ? 'Hide' : 'Show All'}</span>
                            {isCompletedSectionExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {isCompletedSectionExpanded && (
                        <div className={`p-4 space-y-4 bg-black/40 animate-in fade-in slide-in-from-top-2 ${!isCompletedLast ? 'border-b border-emerald-500/20' : ''}`}>
                          {sortedCompletedGroups.map(([groupKey, tasksInGroup]) => (
                            <div key={groupKey} className="space-y-3">
                              <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-white/10 pb-1">
                                <span>{completedSortBy === 'chronological' ? (viewMode === 'chronological' ? formatSlotName(groupKey) : groupKey) : 'Completed Log'}</span>
                                <span className="text-[10px] text-gray-500 font-normal">({tasksInGroup.length})</span>
                              </div>
                              <div className={completionMode === 'fast' ? "space-y-1.5 pt-1" : "space-y-3 pt-1"}>
                                {tasksInGroup.map(task => {
                                  const mId = task.modality_id || task.protocol_step?.modality_id || ''
                                  const benchItem = benchItems.find(b => b.modality_id === mId)
                                  return (
                                    <ProtocolTaskCard 
                                      key={task.id} 
                                      task={task} 
                                      onStatusChange={handleStatusChange} 
                                      onTrackOutcomes={openTracker} 
                                      initialBenchItem={benchItem}
                                      recentTasks={tasks}
                                      allOutcomes={allOutcomes}
                                      userProfile={profile}
                                      wellbeingCheckin={wellbeingCheckin}
                                      onSaveCustomOutcomes={handleSaveCustomOutcomes}
                                      onOutcomesSaved={handleOutcomesSaved}
                                      outcomesRefreshKey={outcomesRefreshKey}
                                      completionMode={completionMode}
                                      isProtocolGroupView={viewMode === 'protocol'}
                                      protocolGroupName={viewMode === 'protocol' ? groupKey : undefined}
                                      isIgnited={true}
                                    />
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Snoozed Modalities Section */}
                  {allSnoozedTasks.length > 0 && (
                    <div className={`overflow-hidden border border-amber-500/30 bg-amber-950/20 shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all duration-300 ${getStatusSectionClasses('snoozed')}`}>
                      <div className={`w-full flex items-center justify-between p-3 sm:p-3.5 bg-amber-500/10 gap-2 ${isSnoozedSectionExpanded || !isSnoozedLast ? 'border-b border-amber-500/20' : ''}`}>
                        <button 
                          type="button"
                          onClick={() => setIsSnoozedSectionExpanded(!isSnoozedSectionExpanded)}
                          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer flex-1 min-w-0 text-left"
                        >
                          <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)] shrink-0">
                            <Clock size={13} strokeWidth={2.5} />
                          </div>
                          <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider whitespace-nowrap truncate">
                            Snoozed Modalities
                          </h2>
                          <span className="text-[11px] sm:text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 sm:px-2.5 py-0.5 rounded-full font-mono font-bold shrink-0">
                            {allSnoozedTasks.length}
                          </span>
                        </button>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setIsSnoozedSectionExpanded(!isSnoozedSectionExpanded)}
                            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium px-1.5 sm:px-2 py-1 cursor-pointer shrink-0"
                          >
                            <span>{isSnoozedSectionExpanded ? 'Hide' : 'Show All'}</span>
                            {isSnoozedSectionExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {isSnoozedSectionExpanded && (
                        <div className={`${completionMode === 'fast' ? "p-3 space-y-1.5" : "p-4 space-y-3"} bg-black/40 animate-in fade-in ${!isSnoozedLast ? 'border-b border-amber-500/20' : ''}`}>
                          {allSnoozedTasks.map(task => {
                            const mId = task.modality_id || task.protocol_step?.modality_id || ''
                            const benchItem = benchItems.find(b => b.modality_id === mId)
                            return (
                              <ProtocolTaskCard 
                                key={task.id} 
                                task={task} 
                                onStatusChange={handleStatusChange} 
                                onTrackOutcomes={openTracker}
                                initialBenchItem={benchItem}
                                recentTasks={tasks}
                                allOutcomes={allOutcomes}
                                userProfile={profile}
                                wellbeingCheckin={wellbeingCheckin}
                                onSaveCustomOutcomes={handleSaveCustomOutcomes}
                                onOutcomesSaved={handleOutcomesSaved}
                                outcomesRefreshKey={outcomesRefreshKey}
                                completionMode={completionMode}
                                isProtocolGroupView={viewMode === 'protocol'}
                                protocolGroupName={viewMode === 'protocol' ? (task.lineages?.[0]?.protocol_name || task.protocol_step?.protocol?.name) : undefined}
                              />
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Skipped Modalities Section */}
                  {allSkippedTasks.length > 0 && (
                    <div className={`overflow-hidden border border-slate-500/30 bg-slate-950/20 shadow-[0_0_20px_rgba(148,163,184,0.1)] transition-all duration-300 ${getStatusSectionClasses('skipped')}`}>
                      <div className={`w-full flex items-center justify-between p-3 sm:p-3.5 bg-slate-500/10 gap-2 ${isSkippedSectionExpanded ? 'border-b border-slate-500/20' : ''}`}>
                        <button 
                          type="button"
                          onClick={() => setIsSkippedSectionExpanded(!isSkippedSectionExpanded)}
                          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer flex-1 min-w-0 text-left"
                        >
                          <div className="w-6 h-6 rounded-full bg-slate-500/20 border border-slate-500/40 text-slate-400 flex items-center justify-center font-bold shadow-[0_0_8px_rgba(148,163,184,0.3)] shrink-0">
                            <Slash size={13} strokeWidth={2.5} />
                          </div>
                          <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider whitespace-nowrap truncate">
                            Skipped Modalities
                          </h2>
                          <span className="text-[11px] sm:text-xs bg-slate-500/20 text-slate-300 border border-slate-500/30 px-2 sm:px-2.5 py-0.5 rounded-full font-mono font-bold shrink-0">
                            {allSkippedTasks.length}
                          </span>
                        </button>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setIsSkippedSectionExpanded(!isSkippedSectionExpanded)}
                            className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1 font-medium px-1.5 sm:px-2 py-1 cursor-pointer shrink-0"
                          >
                            <span>{isSkippedSectionExpanded ? 'Hide' : 'Show All'}</span>
                            {isSkippedSectionExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {isSkippedSectionExpanded && (
                        <div className={`${completionMode === 'fast' ? "p-3 space-y-1.5" : "p-4 space-y-3"} bg-black/40 animate-in fade-in`}>
                          {allSkippedTasks.map(task => {
                            const mId = task.modality_id || task.protocol_step?.modality_id || ''
                            const benchItem = benchItems.find(b => b.modality_id === mId)
                            return (
                              <ProtocolTaskCard 
                                key={task.id} 
                                task={task} 
                                onStatusChange={handleStatusChange} 
                                onTrackOutcomes={openTracker}
                                initialBenchItem={benchItem}
                                recentTasks={tasks}
                                allOutcomes={allOutcomes}
                                userProfile={profile}
                                wellbeingCheckin={wellbeingCheckin}
                                onSaveCustomOutcomes={handleSaveCustomOutcomes}
                                onOutcomesSaved={handleOutcomesSaved}
                                outcomesRefreshKey={outcomesRefreshKey}
                                completionMode={completionMode}
                                isProtocolGroupView={viewMode === 'protocol'}
                                protocolGroupName={viewMode === 'protocol' ? (task.lineages?.[0]?.protocol_name || task.protocol_step?.protocol?.name) : undefined}
                              />
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Proactive Diagnostics Section */}
            {infrequentTasks.length > 0 && (
              <div className="mb-6 rounded-xl border border-blue-500/30 bg-blue-950/20 overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-300">
                <div className="w-full flex items-center justify-between p-3.5 bg-blue-500/10 border-b border-blue-500/20">
                  <button 
                    type="button"
                    onClick={() => setIsProactiveSectionExpanded(!isProactiveSectionExpanded)}
                    className="flex items-center gap-2.5 cursor-pointer flex-1 text-left"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold shadow-[0_0_8px_rgba(59,130,246,0.3)] shrink-0">
                      <Stethoscope size={13} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Proactive Longevity Diagnostics
                    </h2>
                    <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold shrink-0">
                      {infrequentTasks.length}
                    </span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setIsProactiveSectionExpanded(!isProactiveSectionExpanded)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium px-2 py-1 cursor-pointer"
                  >
                    <span>{isProactiveSectionExpanded ? 'Hide' : 'Show All'}</span>
                    {isProactiveSectionExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {isProactiveSectionExpanded && (
                  <div className="p-4 space-y-3 bg-black/40 animate-in fade-in slide-in-from-top-2">
                    {infrequentTasks.map(task => (
                      <ProactiveDiagnosticCard 
                        key={task.id} 
                        task={task} 
                        onStatusChange={handleStatusChange} 
                        onTrackOutcomes={openTracker}
                        userProfile={profile}
                        allOutcomes={allOutcomes}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 80/20 Outcome Spotlight Bar (Ultra-minimalist collapsed by default, expandable for Next Best Action & Friction Buster) */}
            {filterLens === 'outcomes' && selectedOutcomes.length > 0 && !isFocusMode && (
              <div className="mb-3 sm:mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <Outcome8020SpotlightCard
                  selectedOutcomeIds={selectedOutcomes}
                  allModalities={allModalities}
                  todayTasks={tasks}
                  userProfile={profile}
                  allOutcomes={allOutcomes}
                  onOpenTuneModal={(outcomeState) => {
                    setInspectingOutcomeState(outcomeState)
                    setIsOutcomeModalOpen(true)
                  }}
                  onAddModalityToToday={async (modalityId) => {
                    if (profile) {
                      await addModalityOrProtocolToToday(profile.local_user_id, dateStr, modalityId)
                      await refreshTodayTasks()
                    }
                  }}
                  onBenchModality={async (modalityId) => {
                    await handleMoveToBench(modalityId)
                  }}
                  onAutoFixClash={handleAutoFixClash}
                />
              </div>
            )}


            {/* Timeline Layout Mode & Completion Mode Toggle Bar (Single Non-Scrolling Row) */}
            <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 p-1 sm:p-1.5 md:p-2.5 rounded-2xl mb-2 sm:mb-3 backdrop-blur-md shadow-sm gap-1 sm:gap-2 md:gap-4">
              {/* Left: Timeline Layout Mode (Time Blocks vs Protocols) */}
              <div className="flex items-center">
                <div className="flex items-center bg-black/60 p-0.5 md:p-1 rounded-xl border border-white/10 gap-0.5 text-[10px] sm:text-xs md:text-sm">
                  <button
                    type="button"
                    onClick={() => setViewMode('chronological')}
                    className={`px-1.5 sm:px-2.5 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl font-bold text-[10px] sm:text-xs md:text-sm tracking-tight transition-all flex items-center gap-1 md:gap-2 cursor-pointer shrink-0 ${
                      viewMode === 'chronological'
                        ? 'bg-purple-600 text-white shadow-sm border border-purple-400/30 font-extrabold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Clock size={12} className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 shrink-0" />
                    <span>Time<span className="hidden min-[380px]:inline"> Blocks</span></span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('protocol')}
                    className={`px-1.5 sm:px-2.5 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl font-bold text-[10px] sm:text-xs md:text-sm tracking-tight transition-all flex items-center gap-1 md:gap-2 cursor-pointer shrink-0 ${
                      viewMode === 'protocol'
                        ? 'bg-purple-600 text-white shadow-sm border border-purple-400/30 font-extrabold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ListOrdered size={12} className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 shrink-0" />
                    <span>Protocols</span>
                  </button>
                </div>

                {/* Desktop-Only Expand/Collapse for Protocol View */}
                {viewMode === 'protocol' && sortedProtocolGroups.length > 1 && (
                  <button
                    type="button"
                    onClick={handleToggleAllProtocolCollapse}
                    className="hidden sm:inline-flex ml-1.5 sm:ml-2 md:ml-3 text-xs md:text-sm font-bold md:font-extrabold text-purple-300 hover:text-white px-2.5 md:px-3.5 py-1 md:py-2 rounded-lg md:rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-700/50 transition-all cursor-pointer shadow-sm shrink-0 items-center gap-1.5 active:scale-95"
                    title={areAnyProtocolsExpanded ? 'Collapse all protocol cards' : 'Expand all protocol cards'}
                  >
                    <ChevronsUpDown size={14} className="text-purple-400" />
                    <span>{areAnyProtocolsExpanded ? 'Collapse All' : 'Expand All'}</span>
                  </button>
                )}

                {/* Desktop-Only Expand/Collapse for Time Block View */}
                {viewMode === 'chronological' && activeGroups.length > 1 && (
                  <button
                    type="button"
                    onClick={handleToggleAllTimeBlocksCollapse}
                    className="hidden sm:inline-flex ml-1.5 sm:ml-2 md:ml-3 text-xs md:text-sm font-bold md:font-extrabold text-purple-300 hover:text-white px-2.5 md:px-3.5 py-1 md:py-2 rounded-lg md:rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-700/50 transition-all cursor-pointer shadow-sm shrink-0 items-center gap-1.5 active:scale-95"
                    title={areAnyTimeBlocksExpanded ? 'Collapse all time blocks' : 'Expand all time blocks'}
                  >
                    <ChevronsUpDown size={14} className="text-purple-400" />
                    <span>{areAnyTimeBlocksExpanded ? 'Collapse All' : 'Expand All'}</span>
                  </button>
                )}
              </div>

              {/* Right: Completion Mode (Track Outcomes vs Fast Mode) */}
              <div className="flex items-center">
                <div className="flex items-center bg-black/60 p-0.5 md:p-1 rounded-xl border border-white/10 gap-0.5 text-[10px] sm:text-xs md:text-sm shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleCompletionModeChange('outcome')}
                    className={`px-1.5 sm:px-2.5 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl font-bold text-[10px] sm:text-xs md:text-sm tracking-tight transition-all flex items-center gap-1 md:gap-2 cursor-pointer shrink-0 ${
                      completionMode === 'outcome'
                        ? 'bg-purple-600 text-white shadow-sm border border-purple-400/30 font-extrabold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Track Outcomes: deep metric tracking with sliders"
                  >
                    <Activity size={12} className={`w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 shrink-0 ${completionMode === 'outcome' ? 'text-purple-200' : 'text-slate-400'}`} />
                    <span><span className="hidden min-[400px]:inline">Track </span>Outcomes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCompletionModeChange('fast')}
                    className={`px-1.5 sm:px-2.5 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl font-bold text-[10px] sm:text-xs md:text-sm tracking-tight transition-all flex items-center gap-1 md:gap-2 cursor-pointer shrink-0 ${
                      completionMode === 'fast'
                        ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Fast Mode: 1-click instant completion"
                  >
                    <Zap size={12} className={`w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 shrink-0 ${completionMode === 'fast' ? 'text-slate-950 fill-slate-950' : 'text-amber-400'}`} />
                    <span>Fast<span className="hidden min-[380px]:inline"> Mode</span></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile-Only Secondary Sub-Header: Context Count & Clean Expand/Collapse Toggle */}
            <div className="sm:hidden flex items-center justify-between px-1.5 py-1 mb-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span className="font-extrabold uppercase tracking-wider text-[11px] text-slate-300">
                  {viewMode === 'protocol' ? `${sortedProtocolGroups.length} Protocols` : `${activeGroups.length} Circadian Windows`}
                </span>
              </div>

              {viewMode === 'protocol' && sortedProtocolGroups.length > 1 && (
                <button
                  type="button"
                  onClick={handleToggleAllProtocolCollapse}
                  className="text-[11px] font-bold text-purple-300 hover:text-white px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <ChevronsUpDown size={12} className="text-purple-400" />
                  <span>{areAnyProtocolsExpanded ? 'Collapse All' : 'Expand All'}</span>
                </button>
              )}

              {viewMode === 'chronological' && activeGroups.length > 1 && (
                <button
                  type="button"
                  onClick={handleToggleAllTimeBlocksCollapse}
                  className="text-[11px] font-bold text-purple-300 hover:text-white px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <ChevronsUpDown size={12} className="text-purple-400" />
                  <span>{areAnyTimeBlocksExpanded ? 'Collapse All' : 'Expand All'}</span>
                </button>
              )}
            </div>

            {/* Main Daily Timeline / Uncompleted Modalities / Outcome Lens */}
            {viewMode === 'outcomes' ? (
              <OutcomeLensView
                tasks={routineTasks}
                activeModalities={allModalities}
                outcomeDimensions={allOutcomes}
                userProfile={profile}
                benchItems={benchItems}
                allOutcomes={allOutcomes}
                wellbeingCheckin={wellbeingCheckin}
                completionMode={completionMode}
                onStatusChange={handleStatusChange}
                onTrackOutcomes={openTracker}
                onSaveCustomOutcomes={handleSaveCustomOutcomes}
                onOutcomesSaved={handleOutcomesSaved}
                onOpenRescheduleModal={handleOpenRescheduleModal}
                outcomesRefreshKey={outcomesRefreshKey}
                onInspectOutcome={(state) => {
                  setInspectingOutcomeState(state)
                  setIsOutcomeModalOpen(true)
                }}
                onAutoFixClash={handleAutoFixClash}
              />
            ) : isPastDate ? (
              routineTasks.length > 0 && (
                <div className="mb-6 rounded-xl border border-slate-700/60 bg-slate-900/40 overflow-hidden shadow-lg transition-all duration-300">
                  <div className="w-full flex items-center justify-between p-3.5 bg-slate-800/40 border-b border-slate-700/40">
                    <button
                      type="button"
                      onClick={() => setIsUncompletedSectionExpanded(!isUncompletedSectionExpanded)}
                      className="flex items-center gap-2.5 cursor-pointer flex-1 text-left"
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-700/50 border border-slate-600 text-slate-300 flex items-center justify-center font-bold shrink-0">
                        <Clock size={13} strokeWidth={2.5} />
                      </div>
                      <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Uncompleted / Missed Modalities
                      </h2>
                      <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-0.5 rounded-full font-mono font-bold shrink-0">
                        {routineTasks.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsUncompletedSectionExpanded(!isUncompletedSectionExpanded)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium px-2 py-1 cursor-pointer shrink-0"
                    >
                      <span>{isUncompletedSectionExpanded ? 'Hide' : 'Show All'}</span>
                      {isUncompletedSectionExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                  {isUncompletedSectionExpanded && (
                    <div className="p-4 space-y-8 bg-black/40 animate-in fade-in slide-in-from-top-2 relative pl-5 before:absolute before:left-2 before:top-4 before:bottom-6 before:w-[3px] before:rounded-full before:bg-gradient-to-b before:from-amber-400 before:via-cyan-400 before:via-blue-500 before:via-orange-500 before:via-purple-500 before:to-indigo-600 before:opacity-85">
                      {renderTimelineBlocks()}
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="space-y-8">
                {(!tasks.length && (loading || isDateSwitching)) ? (
                  <div className="space-y-6 animate-pulse">
                    <div className="flex items-center justify-between px-2 py-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                          <Sparkles size={12} className="text-purple-400 animate-spin" style={{ animationDuration: '3s' }} />
                        </div>
                        <span className="text-xs font-bold text-slate-300">
                          {userFirstName === 'Your' ? 'Aligning Daily Protocol...' : `Aligning ${userFirstName}'s Protocol...`}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">Syncing schedule</span>
                    </div>

                    {['Morning Stack', 'Afternoon Stack', 'Evening Stack'].map((blockTitle) => (
                      <div key={blockTitle} className="space-y-3 p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <div className="h-4 w-28 bg-slate-800 rounded-md" />
                          <div className="h-3 w-16 bg-slate-800/60 rounded-md" />
                        </div>
                        <div className="space-y-2.5">
                          <div className="h-20 bg-slate-950/60 border border-slate-800/60 rounded-xl" />
                          <div className="h-20 bg-slate-950/60 border border-slate-800/60 rounded-xl" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activeGroups.length === 0 ? (
                  dedupedTasks.length > 0 ? (
                    <div className="text-center p-8 bg-slate-950/60 border border-emerald-500/30 rounded-2xl text-gray-400 text-sm space-y-4 shadow-xl backdrop-blur-md animate-in fade-in">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <Check size={24} strokeWidth={3} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-white text-base">All Scheduled Modalities Completed!</p>
                        <p className="text-xs text-slate-400">
                          {isFocusMode 
                            ? "All scheduled modalities for today are complete. Exit Focus Mode to review completed logs or bio-signals." 
                            : "You have completed every scheduled task for today."}
                        </p>
                      </div>
                      {isFocusMode && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={toggleFocusMode}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <Zap size={13} className="text-emerald-400" />
                            <span>Exit Focus Mode</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    (showGuestOnboardingCard || safeLocalStorageGet('levl_onboarding_completed') !== 'true') ? (
                      <SampleDayPreviewTimeline
                        onEnrollClick={() => setIsEnrollModalOpen(true)}
                        onOpenCoachClick={() => router.push('/coach')}
                      />
                    ) : (
                      <div className="text-center p-8 bg-slate-950/60 border border-white/10 rounded-2xl text-gray-400 text-sm space-y-4 shadow-xl backdrop-blur-md">
                        <div className="space-y-1">
                          <p className="font-bold text-white text-base">You don&apos;t have any protocols scheduled for today.</p>
                          <p className="text-xs text-slate-400">Enroll in an active protocol or log an ad-hoc session to start building your daily timeline.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
                          <button 
                            onClick={() => setIsEnrollModalOpen(true)}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl transition-all font-bold text-xs shadow-lg shadow-purple-900/40 cursor-pointer"
                          >
                            <Sparkles size={16} /> + Enroll in Protocol
                          </button>
                          <button 
                            onClick={() => setIsAdHocModalOpen(true)}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-xl transition-colors font-bold text-xs cursor-pointer"
                          >
                            <Plus size={16} /> Log Extra Activity
                          </button>
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <div 
                    ref={timelineContainerRef}
                    className="relative space-y-8"
                  >
                    {/* Background Ambient Ghost Track (Shows full circadian spectrum preview across entire day) */}
                    <div 
                      className="absolute -left-1.5 sm:-left-2 top-2 bottom-6 w-[3px] rounded-full opacity-40 dark:opacity-45 pointer-events-none transition-opacity duration-300" 
                      style={{ 
                        background: circadianGradientCSS,
                        boxShadow: '0 0 6px rgba(255, 255, 255, 0.08)'
                      }}
                    />

                    {/* Revealing Circadian Sky Gradient Spine (Masks true vertical gradient matching each block as user scrolls) */}
                    <div 
                      className="absolute -left-1.5 sm:-left-2 top-2 w-[3px] rounded-full overflow-hidden transition-[height] duration-75 ease-out pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.25)]"
                      style={{ height: `${spineHeight}px` }}
                    >
                      {/* Inner Full-Height Gradient Line (Pinned to timeline height, masked by outer overflow-hidden) */}
                      <div 
                        className="w-full"
                        style={{ 
                          height: timelineContainerRef.current ? `${timelineContainerRef.current.offsetHeight}px` : '100%',
                          background: circadianGradientCSS
                        }}
                      />
                    </div>

                    {/* Leading Edge Photon Spark (Lights up the tip with the exact sky color of the latest reached time block) */}
                    {spineHeight > 0 && (
                      <div 
                        className="absolute -left-[10px] sm:-left-[12px] w-2.5 h-2.5 rounded-full pointer-events-none transition-all duration-75 ease-out -translate-y-1/2"
                        style={{ 
                          top: `calc(${spineHeight}px + 8px)`,
                          backgroundColor: latestIgnitedSkyColor,
                          boxShadow: `0 0 8px #fff, 0 0 16px ${latestIgnitedSkyColor}`
                        }}
                      />
                    )}

                    {renderTimelineBlocks()}
                  </div>
                )}
              </div>
            )}

            {/* 5. Dedicated Evening Check-in (~3 hours before bedtime) */}
            <div className="mt-6 mb-4">
              <DailyWellbeingCheckin 
                onSave={handleWellbeingSave} 
                initialData={wellbeingCheckin}
                profile={profile}
                allOutcomes={allOutcomes}
                date={currentDate}
                isCurrentDay={isCurrentDay}
                isCollapsedByDefault={isPastDate}
                recentTasks={tasks}
                section="nightly"
              />
            </div>

            {/* Bottom 80/20 Stack Simplification & Adaptive Recommendation Banner (Deferred Lazy Mount) */}
            {tasks.length > 0 && !isPastDate && !loading && !isDateSwitching && (
              <div ref={nbaSentinelRef} className="mt-8 pt-6 border-t border-white/10">
                {shouldMountNBA && allModalities.length > 0 ? (
                  <AdaptiveRecommendationBanner
                    tasks={tasks}
                    allModalities={allModalities}
                    userProfile={profile}
                    streakDays={0}
                    benchItems={benchItems}
                    onAddToToday={async (modalityId: string) => {
                      if (profile) {
                        await addModalityOrProtocolToToday(profile.local_user_id, dateStr, modalityId)
                        await refreshTodayTasks()
                      }
                    }}
                    onMoveToBench={async (modalityId: string) => {
                      await handleMoveToBench(modalityId)
                    }}
                  />
                ) : (
                  <div className="py-6 flex items-center justify-center text-xs text-slate-500 font-mono">
                    <span className="flex items-center gap-1.5 opacity-60">
                      <Sparkles size={12} className="text-purple-400" />
                      <span>Scroll to view Next Best Action &amp; Stack Insights</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </div>

      {/* Modals */}
      {profile && (
        <AdHocLoggerModal 
          isOpen={isAdHocModalOpen}
          onClose={() => {
            setIsAdHocModalOpen(false)
            setAsNeededSlot(undefined)
            setAsNeededModalityId(undefined)
          }}
          localUserId={profile.local_user_id}
          benchItems={benchItems}
          todayTasks={tasks}
          dateStr={dateStr}
          initialTimingSlot={asNeededSlot}
          initialModalityId={asNeededModalityId}
          onOpenStackHealth={() => setIsStackHealthModalOpen(true)}
          onLogged={async () => {
            await refreshTodayTasks()
            const bItems = await getBenchItems(profile.local_user_id)
            setBenchItems(bItems)
          }}
        />
      )}

      <EnrollProtocolModal 
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onProtocolEnrolled={refreshTodayTasks}
        dateStr={dateStr}
      />

      <SmartRescheduleModal
        isOpen={isRescheduleModalOpen}
        onClose={() => {
          setIsRescheduleModalOpen(false)
          setRescheduleTask(null)
          setRescheduleModality(null)
        }}
        task={rescheduleTask}
        modality={rescheduleModality}
        isPastMissedTask={isReschedulePastMissed}
        onExecuteReschedule={handleExecuteReschedule}
      />

      {showCustomizeOutcomesModal && (
        <CustomizeModalityOutcomesModal
          isOpen={showCustomizeOutcomesModal}
          onClose={() => setShowCustomizeOutcomesModal(false)}
          allOutcomes={allOutcomes}
          currentOutcomeIds={relevantOutcomes.map(o => o.id)}
          userProfile={profile}
          onSaveOutcomes={(modalityId: string, selectedOutcomeIds: string[]) => {
            const list = allOutcomes.filter(o => selectedOutcomeIds.includes(o.id))
            setRelevantOutcomes(list)
            setShowCustomizeOutcomesModal(false)
          }}
        />
      )}

      {studioModalData.isOpen && (
        <CreateCustomModalityModal
          isOpen={studioModalData.isOpen}
          onClose={() => setStudioModalData(prev => ({ ...prev, isOpen: false }))}
          initialData={studioModalData.initialData}
          onCreated={async () => {
            await refreshTodayTasks()
            if (profile) {
              const bItems = await getBenchItems(profile.local_user_id)
              setBenchItems(bItems)
            }
          }}
        />
      )}

      {isOutcomeModalOpen && inspectingOutcomeState && (
        <OutcomeOptimizationModal
          isOpen={isOutcomeModalOpen}
          onClose={() => {
            setIsOutcomeModalOpen(false)
            setInspectingOutcomeState(null)
          }}
          outcomeState={inspectingOutcomeState}
          userProfile={profile}
          todayTasks={tasks}
          onUpdateTarget={handleUpdateOutcomeTarget}
          onAutoFixClash={async (clashId) => {
            const clash = inspectingOutcomeState.clashes.find(c => c.id === clashId)
            if (clash) {
              await handleAutoFixClash(clash)
              setIsOutcomeModalOpen(false)
              setInspectingOutcomeState(null)
            }
          }}
        />
      )}

      {/* Routine Stack Health & Biochemical Conflict Optimizer Modal */}
      <StackHealthOptimizerModal
        isOpen={isStackHealthModalOpen}
        onClose={() => setIsStackHealthModalOpen(false)}
        activeTasks={tasks}
        allModalities={allModalities}
        userProfile={profile}
        wellbeingCheckin={wellbeingCheckin}
        onOptimizationsApplied={async () => {
          await refreshTodayTasks()
        }}
      />

      {/* Adaptive Routine Adjustment Modal (80/20 Governor & Peak Surge) */}
      {adaptiveEvaluation && (
        <AdaptiveRoutineAdjustmentModal
          isOpen={isAdaptiveModalOpen}
          onClose={() => setIsAdaptiveModalOpen(false)}
          evaluation={adaptiveEvaluation}
          todayTasks={tasks}
          dateStr={dateStr}
          localUserId={authUserId || profile?.local_user_id || getLocalUserId()}
          onApplied={async (appliedCount, mode) => {
            setDailyBandwidthMode(mode)
            setIsShieldActive(mode === 'survival_80_20')
            await refreshTodayTasks()
          }}
        />
      )}

      {/* Dashboard Layout, Density, Appearance & Focus Preferences Modal */}
      <DashboardLayoutModal
        isOpen={isLayoutModalOpen}
        onClose={() => setIsLayoutModalOpen(false)}
        userProfile={profile || undefined}
        currentDisplayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
      />
    </div>
  )
}

export default function TodayPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center animate-pulse text-levl-text-secondary">Loading...</div>}>
      <TodayPageContent />
    </Suspense>
  )
}
