'use client'

import { useEffect, useState, useMemo, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  updateTaskExecutionDetails
} from '@/lib/data'
import { DailyProtocolTask, Modality, OutcomeDimension, UserProfile, UserBenchItem, DailyWellbeingCheckin as WellbeingType } from '@/lib/types'
import { 
  format, parseISO, addDays, subDays, addMonths, subMonths, 
  isBefore, startOfDay, startOfWeek, endOfWeek, eachDayOfInterval, 
  isSameMonth, isSameDay 
} from 'date-fns'
import { 
  Activity, Check, ChevronDown, ChevronLeft, ChevronRight, 
  ChevronUp, Clock, Layers, ListOrdered, Plus, Slash, Sparkles, Stethoscope, X, Zap, RefreshCw 
} from 'lucide-react'

import ProtocolTaskCard, { DedupedTask } from '@/components/cards/ProtocolTaskCard'
import { triggerHaptic } from '@/lib/utils/haptics'
import { safeLocalStorageSet } from '@/lib/utils/storage'
import { PulsedModalityCard } from '@/components/cards/PulsedModalityCard'
import ProactiveDiagnosticCard from '@/components/cards/ProactiveDiagnosticCard'
import DailyWellbeingCheckin from '@/components/score/DailyWellbeingCheckin'
import { DailyLongevityTipBanner } from '@/components/banners/DailyLongevityTipBanner'
import { AdaptiveRecommendationBanner } from '@/components/banners/AdaptiveRecommendationBanner'
import { LongevityCoachInputBar } from '@/components/ai/LongevityCoachInputBar'
import { DailyHistoricalDebriefHeader } from '@/components/cards/DailyHistoricalDebriefHeader'
import { ViewSelectorHeader, CalendarViewMode, LayoutOrientation, MainCategory, SUB_CATEGORIES_MAP, CategoryFiltersBar } from '@/components/ui/ViewSelectorHeader'
import { ThreeDaySplitView } from '@/components/views/ThreeDaySplitView'
import { SevenDayWeekView } from '@/components/views/SevenDayWeekView'
import { MonthMatrixView } from '@/components/views/MonthMatrixView'
import DailyVerticalPulseView from '@/components/calendar/DailyVerticalPulseView'
import ExploreCard from '@/components/cards/ExploreCard'
import ProtocolOverviewHeaderCard from '@/components/cards/ProtocolOverviewHeaderCard'
import AdHocLoggerModal from '@/components/modals/AdHocLoggerModal'
import EnrollProtocolModal from '@/components/modals/EnrollProtocolModal'
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
import { getCircadianConfig, getAdaptiveCircadianConfig, isCurrentCircadianSlot, buildDynamicCircadianGradientCSS, CHRONOLOGICAL_CIRCADIAN_SLOTS } from '@/lib/utils/circadianConfig'
import { resolveOptimalTimingSlot, parseMultiDoseTimingSlots, MultiDoseSlot } from '@/lib/data/resolveOptimalTiming'
import AdaptiveSleepTriageCard from '@/components/today/AdaptiveSleepTriageCard'
import { OutcomeLensView } from '@/components/outcomes/OutcomeLensView'
import { OutcomeOptimizationModal } from '@/components/modals/OutcomeOptimizationModal'
import { OutcomeOptimizationState, AntagonisticClash } from '@/lib/outcomes/outcomeOptimizationEngine'

function formatSlotName(str: string): string {
  if (!str) return 'Anytime'
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const TIME_BLOCKS = [
  'waking',
  'morning_routine',
  'morning',
  'morning_supplement_stack',
  'first_meal',
  'midday',
  'midday_stack',
  'afternoon',
  'late_afternoon',
  'pre_meal',
  'post_meal',
  'evening',
  'evening_supplement_stack',
  'wind_down',
  'pre_bed',
  'bedtime',
  'anytime'
]

function getTimeBlockOrder(slot: string): number {
  if (!slot) return 50
  const s = slot.toLowerCase().trim()
  if (s.includes('wake') || s.includes('sunrise') || s.includes('dawn')) return 0
  if (s.includes('morning_routine')) return 1
  if (s.includes('morning_supplement') || s.includes('fasted_am') || s.includes('am_stack') || s.includes('am stack')) return 3
  if (s.includes('first_meal') || s.includes('breakfast') || s.includes('first meal') || s.includes('meal_1')) return 4
  if (s.includes('morning') || s.includes('am')) return 2
  if (s.includes('midday_stack') || s.includes('lunch_stack')) return 6
  if (s.includes('midday') || s.includes('noon') || s.includes('lunch')) return 5
  if (s.includes('afternoon') || s.includes('workout') || s.includes('training')) return 7
  if (s.includes('late_afternoon')) return 8
  if (s.includes('pre_meal') || s.includes('pre-meal') || s.includes('pre meal')) return 9
  if (s.includes('post_meal') || s.includes('postprandial') || s.includes('post meal') || s.includes('post-meal')) return 10
  if (s.includes('evening_supplement') || s.includes('dinner_stack') || s.includes('pm_stack') || s.includes('pm stack')) return 12
  if (s.includes('evening') || s.includes('dinner') || s.includes('dusk')) return 11
  if (s.includes('wind_down') || s.includes('winddown') || s.includes('wind down') || s.includes('wind-down') || s.includes('wind')) return 13
  if (s.includes('pre_bed') || s.includes('pre-bed') || s.includes('pre bed')) return 14
  if (s.includes('bed') || s.includes('night') || s.includes('sleep') || s.includes('overnight')) return 15
  if (s.includes('anytime')) return 99
  return 50
}


function parseLocalDate(dStr?: string | null): Date {
  if (!dStr) return new Date()
  const clean = dStr.split('T')[0]
  const [y, m, d] = clean.split('-').map(Number)
  if (y && m && d) {
    return new Date(y, m - 1, d, 12, 0, 0)
  }
  return new Date()
}

function TodayPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const modalityParam = searchParams.get('modality')
  const protocolParam = searchParams.get('protocol')
  const nameParam = searchParams.get('name')

  const { user: authUser, localUserId: authUserId, loading: authLoading } = useAuth()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // SWR Instant Local Hydration (0ms initial render)
  const initialDateStr = dateParam || format(new Date(), 'yyyy-MM-dd')
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('levl_cached_user_profile')
        if (cached) return JSON.parse(cached)
      } catch (e) {}
    }
    return null
  })
  const [tasks, setTasks] = useState<DailyProtocolTask[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`levl_cached_tasks_${initialDateStr}`)
        if (cached) return JSON.parse(cached)
      } catch (e) {}
    }
    return []
  })
  const [benchItems, setBenchItems] = useState<UserBenchItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('levl_cached_bench_items')
        if (cached) return JSON.parse(cached)
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
      const cachedTasks = localStorage.getItem(`levl_cached_tasks_${initialDateStr}`)
      if (cachedTasks) {
        try {
          const parsed = JSON.parse(cachedTasks)
          if (Array.isArray(parsed) && parsed.length > 0) return false
        } catch (e) {}
      }
    }
    return true
  })
  const [isDateSwitching, setIsDateSwitching] = useState(false)

  // Next Best Action deferred lazy mount state & sentinel
  const [shouldMountNBA, setShouldMountNBA] = useState(false)
  const nbaSentinelRef = useRef<HTMLDivElement | null>(null)

  const hasLoadedInitialCatalogRef = useRef(false)
  const activeDateReqIdRef = useRef(0)

  const [activeDate, setActiveDate] = useState<Date>(() => {
    if (dateParam) {
      return parseLocalDate(dateParam)
    }
    return new Date()
  })

  // Synchronize activeDate if URL searchParams change externally (e.g. browser back/forward buttons)
  useEffect(() => {
    if (dateParam) {
      const parsed = parseLocalDate(dateParam)
      setActiveDate(parsed)
    } else {
      setActiveDate(new Date())
    }
  }, [dateParam])

  const currentDate = activeDate
  const dateStr = format(currentDate, 'yyyy-MM-dd')
  const isPastDate = isBefore(startOfDay(currentDate), startOfDay(new Date()))
  const isFutureTimeline = isBefore(startOfDay(new Date()), startOfDay(currentDate))
  const isCurrentDay = dateStr === format(new Date(), 'yyyy-MM-dd')

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

  // Outcome Vectors Lens Modal States
  const [inspectingOutcomeState, setInspectingOutcomeState] = useState<OutcomeOptimizationState | null>(null)
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false)

  const [selectedProtocolFilter, setSelectedProtocolFilter] = useState<string>('all')
  const [selectedMainCategories, setSelectedMainCategories] = useState<MainCategory[]>(['all'])
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([])
  const [selectedIsolatedOutcome, setSelectedIsolatedOutcome] = useState<string | null>(null)

  const [completedSortBy, setCompletedSortBy] = useState<'chronological' | 'completed_time'>('chronological')
  const [completedSortOrder, setCompletedSortOrder] = useState<'asc' | 'desc'>('asc')

  const [isCompletedSectionExpanded, setIsCompletedSectionExpanded] = useState<boolean>(false)
  const [isUncompletedSectionExpanded, setIsUncompletedSectionExpanded] = useState<boolean>(false)
  const [isSnoozedSectionExpanded, setIsSnoozedSectionExpanded] = useState<boolean>(false)
  const [isSkippedSectionExpanded, setIsSkippedSectionExpanded] = useState<boolean>(false)
  const [isPulsedSectionExpanded, setIsPulsedSectionExpanded] = useState<boolean>(false)
  const [isProactiveSectionExpanded, setIsProactiveSectionExpanded] = useState<boolean>(false)

  const [showCompletedInline, setShowCompletedInline] = useState<boolean>(false)
  const [showSnoozedInline, setShowSnoozedInline] = useState<boolean>(false)
  const [showSkippedInline, setShowSkippedInline] = useState<boolean>(false)

  const [layoutOrientation, setLayoutOrientation] = useState<LayoutOrientation>('columns')
  const [multiDayTasks, setMultiDayTasks] = useState<Record<string, DailyProtocolTask[]>>({})

  const [availableProtocols, setAvailableProtocols] = useState<{ id: string; name: string; colorHex?: string }[]>([])
  const [dismissedTipIds, setDismissedTipIds] = useState<string[]>([])
  const [wellbeingCheckin, setWellbeingCheckin] = useState<WellbeingType | null>(null)
  const userActualWakeTime = wellbeingCheckin?.actual_wake_time || wellbeingCheckin?.custom_outcomes_jsonb?._actual_wake_time || undefined
  const userActualSleepMinutes = wellbeingCheckin?.actual_sleep_minutes ?? wellbeingCheckin?.custom_outcomes_jsonb?._actual_sleep_minutes
  const userSubjectiveSleep = wellbeingCheckin?.subjective_sleep_0_10

  const [isSleepTriageDismissed, setIsSleepTriageDismissed] = useState(false)

  const isTriageStoredDismissed = typeof window !== 'undefined' && (
    localStorage.getItem(`levl_sleep_triage_${dateStr}`) === 'dismissed' ||
    localStorage.getItem(`levl_sleep_triage_${dateStr}`) === 'applied'
  )

  const shouldShowSleepTriage = !isPastDate && !isSleepTriageDismissed && !isTriageStoredDismissed && (
    (userActualSleepMinutes != null && userActualSleepMinutes < 390) ||
    (userSubjectiveSleep != null && userSubjectiveSleep <= 4)
  )
  const [show100Celebration, setShow100Celebration] = useState<boolean>(false)

  // Referral / Instant Kickstart progressive profiling banner state
  const [isGuestBannerDismissed, setIsGuestBannerDismissed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('levl_guest_banner_dismissed') === 'true'
      } catch (e) {}
    }
    return false
  })

  const guestKickstartProtocol = useMemo(() => {
    if (typeof window === 'undefined') return null
    try {
      const isKickstarted = localStorage.getItem('levl_guest_instant_kickstart') === 'true' || !!localStorage.getItem('levl_referral_source')
      if (!isKickstarted) return null
      return localStorage.getItem('levl_active_protocol') || 'Cellular Dermal Matrix Protocol'
    } catch (e) {
      return null
    }
  }, [])

  const showGuestKickstartBanner = !!guestKickstartProtocol && !isGuestBannerDismissed && (typeof window !== 'undefined' ? localStorage.getItem('levl_onboarding_completed') !== 'true' : true)

  const [isAdHocModalOpen, setIsAdHocModalOpen] = useState(false)
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
      const savedMode = localStorage.getItem('levl_completion_mode') as 'outcome' | 'fast'
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
    const url = dStr === todayFormatted ? '/today' : `/today?date=${dStr}`
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
    setCollapsedGroups({})
    if (isProtocol) {
      setViewMode('protocol')
      setSelectedProtocolFilter('all')
    } else {
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

    // 2. If it's a protocol, set viewMode to protocol
    if (protocolParam) {
      setViewMode('protocol')
      setSelectedProtocolFilter('all')
    } else {
      setSelectedProtocolFilter('all')
      setSelectedMainCategories(['all'])
      setSelectedSubCategories([])
      setSelectedIsolatedOutcome(null)
    }

    // 3. Uncollapse all groups to ensure target card is mounted
    setCollapsedGroups({})
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
    if (authLoading) return

    async function loadData() {
      const reqId = ++activeDateReqIdRef.current
      const localUserId = authUserId || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '') || getLocalUserId()
      window.dispatchEvent(new CustomEvent('levl_sync_start'))

      try {
        if (!hasLoadedInitialCatalogRef.current) {
          if (!tasks || tasks.length === 0) {
            setLoading(true)
          }
          const userProfile = await getOrCreateUserProfile(localUserId)

          const hasCompletedOnboarding = typeof window !== 'undefined' && localStorage.getItem('levl_onboarding_completed') === 'true'

          if (!hasCompletedOnboarding) {
            router.replace('/onboarding')
            return
          }

          if (!userProfile) {
            router.push('/onboarding')
            return
          }
          const [currentTasks, outcomes, protocols, bench, todayCheckin] = await Promise.all([
            getDailyProtocolTasks(localUserId, dateStr),
            getOutcomeDimensions(),
            getProtocols(),
            getBenchItems(localUserId),
            getDailyWellbeingCheckin(localUserId, dateStr)
          ])

          if (reqId !== activeDateReqIdRef.current) return

          setProfile(userProfile)
          setTasks(currentTasks)
          setAllOutcomes(outcomes)
          setAvailableProtocols(protocols.map((p: any) => ({ id: p.id, name: p.name })))
          setBenchItems(bench)
          setWellbeingCheckin(todayCheckin || null)
          if (typeof window !== 'undefined') {
            safeLocalStorageSet('levl_cached_user_profile', JSON.stringify(userProfile))
            safeLocalStorageSet('levl_cached_tasks_' + dateStr, JSON.stringify(currentTasks))
            if (bench) safeLocalStorageSet('levl_cached_bench_items', JSON.stringify(bench))
          }
          hasLoadedInitialCatalogRef.current = true
        } else {
          // Fast in-place transition without unmounting DOM tree
          setIsDateSwitching(true)
          // Immediate SWR hydration from localStorage for target date
          let hasCached = false
          if (typeof window !== 'undefined') {
            try {
              const cached = localStorage.getItem(`levl_cached_tasks_${dateStr}`)
              if (cached) {
                const parsed = JSON.parse(cached)
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setTasks(parsed)
                  hasCached = true
                }
              }
            } catch (e) {}
          }
          if (!hasCached) {
            setLoading(true)
          }
          const [currentTasks, todayCheckin] = await Promise.all([
            getDailyProtocolTasks(localUserId, dateStr),
            getDailyWellbeingCheckin(localUserId, dateStr)
          ])

          if (reqId !== activeDateReqIdRef.current) return

          setTasks(currentTasks)
          setWellbeingCheckin(todayCheckin || null)
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
    loadData()

    const handleAuthChange = () => {
      hasLoadedInitialCatalogRef.current = false
      loadData()
    }
    window.addEventListener('levl_auth_user_changed', handleAuthChange)
    return () => {
      window.removeEventListener('levl_auth_user_changed', handleAuthChange)
    }
  }, [dateStr, router, authLoading, authUserId])

  // Multi-day task loader for 3day, week, and month views
  useEffect(() => {
    if (calendarViewMode === 'today' || authLoading) return

    async function loadMultiDay() {
      const localUserId = authUserId || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '') || getLocalUserId()
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
        const start = startOfWeek(startOfDay(currentDate), { weekStartsOn: 1 })
        const end = endOfWeek(addDays(start, 35), { weekStartsOn: 1 })
        datesToLoad = eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'))
      }

      if (datesToLoad.length > 0) {
        const result = await getMultiDayProtocolTasks(localUserId, datesToLoad[0], datesToLoad[datesToLoad.length - 1])
        setMultiDayTasks(result)
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

    const baseId = id.includes('-split-') ? id.split('-split-')[0] : id
    targetUuids.push(baseId)
    uuidSet.add(baseId)

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

    // Optimistic UI update
    setTasks(prev => prev.map(t => {
      if (t.id === id || uuidSet.has(t.id)) {
        const finalDetails = executionDetails !== undefined ? executionDetails : t.execution_details
        return { 
          ...t, 
          status: status as any, 
          status_reason: reason, 
          completed_at: effectiveCompletedAt || (status === 'completed' ? new Date().toISOString() : undefined), 
          execution_metrics: executionMetrics || t.execution_metrics, 
          execution_details: finalDetails 
        }
      }
      return t
    }))

    // Check if this completion achieves 100% adherence for the day
    const willBeCompleted = status === 'completed'
    const pendingOtherTasks = tasks.filter(t => t.id !== id && !uuidSet.has(t.id) && t.status === 'pending')
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
      const completedTask = tasks.find(t => t.id === id || t.id === baseId)
      const modName = completedTask?.loose_modality?.name || completedTask?.protocol_step?.modality?.name || 'Modality'
      const dose = completedTask?.loose_modality?.dose_or_exposure || completedTask?.protocol_step?.modality?.dose_or_exposure
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

    // Asynchronous background persistence (does not block instant UI responsiveness)
    ;(async () => {
      try {
        for (const uuid of targetUuids) {
          const existingTask = tasks.find(t => t.id === uuid)
          const finalDetails = executionDetails !== undefined ? executionDetails : existingTask?.execution_details
          await updateDailyTaskStatus(uuid, status, reason, undefined, effectiveCompletedAt, executionMetrics, finalDetails)
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
      const targetMod = allModalities.find(m => m.id === mId)
      const modName = targetMod?.display_name || targetMod?.name || 'Modality'
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
      const modName = task.protocol_step?.modality?.display_name || task.protocol_step?.modality?.name || task.loose_modality?.display_name || task.loose_modality?.name || 'Modality'
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
        task.execution_details?.custom_timing || 
        task.custom_timing || 
        benchItem?.custom_timing || 
        task.timing_slot ||
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
        const customTimingStr = task.execution_details?.custom_timing || (modalityId ? benchItems.find(b => b.modality_id.toLowerCase() === modalityId)?.custom_timing : undefined)
        const resolvedSlot = isSplitTask && task.timing_slot && task.timing_slot !== 'anytime'
          ? task.timing_slot
          : resolveOptimalTimingSlot(modality, task.protocol_step, task.timing_slot, profile, customTimingStr)
        
        if (!protoMap.has(protoKey)) {
          protoMap.set(protoKey, {
            ...task,
            timing_slot: resolvedSlot
          })
        } else {
          const existing = protoMap.get(protoKey)!
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
      const customTimingStr = task.execution_details?.custom_timing || (modalityId ? benchItems.find(b => b.modality_id.toLowerCase() === modalityId)?.custom_timing : undefined)
      const resolvedSlot = isSplitTask && task.timing_slot && task.timing_slot !== 'anytime'
        ? task.timing_slot
        : resolveOptimalTimingSlot(modality, task.protocol_step, task.timing_slot, profile, customTimingStr)

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
          lineages: initialLineages
        })
      } else {
        const existing = map.get(dedupeKey)!
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
        if (cat === 'peptides') return combinedText.includes('peptide') || combinedText.includes('bpc') || combinedText.includes('tb500') || combinedText.includes('tb-500') || combinedText.includes('cjc') || combinedText.includes('ipamorelin') || combinedText.includes('semax') || combinedText.includes('selank') || combinedText.includes('tirzepatide') || combinedText.includes('subq')
        if (cat === 'fitness') return combinedText.includes('fitness') || combinedText.includes('exercise') || combinedText.includes('workout') || combinedText.includes('cardio') || combinedText.includes('strength') || combinedText.includes('sauna') || combinedText.includes('cold') || combinedText.includes('physical') || combinedText.includes('training')
        if (cat === 'nutrition') {
          if (
            modalityCat.includes('sleep') || 
            modalityCat.includes('breath') || 
            modalityName.includes('mouth tape') || 
            modalityName.includes('mouth tap') || 
            modalityName.includes('4-7-8') ||
            modalityName.includes('dark & cool')
          ) return false
          return combinedText.includes('nutrition') || combinedText.includes('supplement') || combinedText.includes('fast') || combinedText.includes('food') || combinedText.includes('diet') || combinedText.includes('meal') || combinedText.includes('protein') || combinedText.includes('vitamin') || combinedText.includes('biochemistry')
        }
        if (cat === 'sleep') return combinedText.includes('sleep') || combinedText.includes('circadian') || combinedText.includes('light') || combinedText.includes('wind down') || combinedText.includes('bed') || combinedText.includes('night')
        if (cat === 'mind') return combinedText.includes('mind') || combinedText.includes('nervous') || combinedText.includes('breath') || combinedText.includes('meditat') || combinedText.includes('nsdr') || combinedText.includes('vagal') || combinedText.includes('neurology') || combinedText.includes('autonomic')
        if (cat === 'other') return combinedText.includes('skin') || combinedText.includes('hair') || combinedText.includes('biomarker') || combinedText.includes('lab') || combinedText.includes('diagnostics') || combinedText.includes('hygiene') || combinedText.includes('dental')
        return true
      }

      return activeSubIds.some(subId => {
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
        if (subId === 'supplements') {
          if (
            modalityCat.includes('sleep') || 
            modalityCat.includes('breath') || 
            modalityCat.includes('circadian') || 
            modalityCat.includes('exercise') || 
            modalityCat.includes('physical') ||
            modalityCat.includes('habit') || 
            modalityName.includes('mouth tape') || 
            modalityName.includes('mouth tap') || 
            modalityName.includes('dark & cool') || 
            modalityName.includes('4-7-8') || 
            modalityName.includes('screen') ||
            modalityName.includes('floss') ||
            modalityName.includes('gargl')
          ) return false
          return combinedText.includes('supplement') || combinedText.includes('pill') || combinedText.includes('magnesium') || combinedText.includes('creatine') || combinedText.includes('omega') || combinedText.includes('vitamin')
        }
        if (subId === 'fasting') return combinedText.includes('fast')
        if (subId === 'whole_foods') return combinedText.includes('food') || combinedText.includes('diet') || combinedText.includes('meal') || combinedText.includes('protein') || combinedText.includes('glucose')
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

          if (!matchesProtocol) return
        }

        const modality = task.protocol_step?.modality || task.loose_modality
        const benchItem = mId ? benchItems.find(b => b.modality_id?.toLowerCase().trim() === mId) : null
        const effectiveTiming = 
          task.execution_details?.custom_timing || 
          task.custom_timing || 
          benchItem?.custom_timing || 
          task.timing_slot ||
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
            if (isTaskMatchingCategoryFilter(splitTask as DedupedTask)) {
              activeList.push(splitTask)
            }
          })
        } else {
          const dedupedEquivalent: DedupedTask = {
            ...task,
            timing_slot: task.timing_slot || task.protocol_step?.timing_slot || 'anytime'
          }
          if (isTaskMatchingCategoryFilter(dedupedEquivalent)) {
            activeList.push(task)
          }
        }
      })

      result[dKey] = activeList
    })

    return result
  }, [multiDayTasks, benchedOrEliminatedModalityIds, selectedProtocolFilter, selectedMainCategories, selectedSubCategories])

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
      if (!isTaskMatchingCategoryFilter(task)) return

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
        if (showCompletedInline || isRecentlyCompleted) {
          routine.push(task)
        }
      } else if (isSnoozed) {
        snoozedTop.push(task)
        if (showSnoozedInline || (task.timing_slot && task.timing_slot !== 'anytime')) {
          routine.push(task)
        }
      } else if (isSkipped) {
        // Never show benched or eliminated modalities in the skipped section!
        if (task.status_reason?.toLowerCase().includes('eliminated') || (mId && benchedOrEliminatedModalityIds.has(mId))) {
          return
        }
        // If viewing a future date, never show benched modalities in the skipped section (only on the day it was skipped)
        const isBenchedReason = task.status_reason?.toLowerCase().includes('bench')
        if (isFutureTimeline && isBenchedReason) {
          return
        }
        skippedTop.push(task)
        if (showSkippedInline) {
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
  }, [dedupedTasks, selectedMainCategories, selectedSubCategories, showCompletedInline, showSnoozedInline, showSkippedInline, recentlyCompletedIds, benchedOrEliminatedModalityIds, isFutureTimeline])

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
        const modality = task.protocol_step?.modality || task.loose_modality
        const isSplitTask = Boolean(task.execution_details?.split_dose_number || task.id.includes('-split-'))
        groupKey = (isSplitTask && task.timing_slot && task.timing_slot !== 'anytime')
          ? task.timing_slot
          : (task.timing_slot && task.timing_slot !== 'anytime'
            ? task.timing_slot
            : resolveOptimalTimingSlot(modality, task.protocol_step, task.timing_slot))
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
  }, [allCompletedTasks, completedSortBy, completedSortOrder, viewMode])

  // Sync completion stats into localStorage and dispatch event
  useEffect(() => {
    if (dedupedTasks.length > 0) {
      const completedCount = allCompletedTasks.length
      const totalCount = dedupedTasks.length
      const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

      const statsPayload = { completed: completedCount, total: totalCount, percentage }

      if (isCurrentDay) {
        try {
          localStorage.setItem('levl_today_stats', JSON.stringify(statsPayload))
        } catch (e) {}
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('levl_today_tasks_stats', { detail: statsPayload }))
      }
    }
  }, [dedupedTasks.length, allCompletedTasks.length, isCurrentDay])

  const chronologicalGroups = useMemo(() => {
    const groups: Record<string, DedupedTask[]> = {}
    routineTasks.forEach(task => {
      const modality = task.protocol_step?.modality || task.loose_modality
      const isSplitTask = Boolean(task.execution_details?.split_dose_number || task.id.includes('-split-'))
      
      // If task is a split task, or already has a concrete assigned timing_slot, RESPECT IT!
      // Do NOT recalculate and override it into an arbitrary block!
      const slot = (isSplitTask && task.timing_slot && task.timing_slot !== 'anytime')
        ? task.timing_slot
        : (task.timing_slot && task.timing_slot !== 'anytime'
          ? task.timing_slot
          : resolveOptimalTimingSlot(modality, task.protocol_step, task.timing_slot, profile, task.execution_details?.custom_timing))

      if (!groups[slot]) groups[slot] = []
      groups[slot].push({
        ...task,
        timing_slot: slot
      })
    })

    return groups
  }, [routineTasks, profile, benchItems])

  const sortedChronologicalGroups = useMemo(() => {
    const rawEntries = Object.entries(chronologicalGroups)
    if (rawEntries.length === 0) return []

    // Separate anytime group from fixed time slots
    const anytimeEntry = rawEntries.find(([group]) => group.toLowerCase().includes('anytime'))
    const timedEntries = rawEntries
      .filter(([group]) => !group.toLowerCase().includes('anytime'))
      .sort(([groupA], [groupB]) => {
        const orderA = getTimeBlockOrder(groupA)
        const orderB = getTimeBlockOrder(groupB)
        if (orderA !== orderB) return orderA - orderB
        return groupA.localeCompare(groupB)
      })

    if (!anytimeEntry) return timedEntries

    // If not current day (past/future date), place anytime after morning blocks (or near top)
    if (!isCurrentDay) {
      const morningLastIdx = timedEntries.findIndex(([g]) => {
        const o = getTimeBlockOrder(g)
        return o > 4 // after morning slots (0..4)
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
    routineTasks.forEach(task => {
      const parentProtocolName = task.lineages?.[0]?.protocol_name || task.protocol_step?.protocol?.name || (task as any).user_protocol_instance?.protocol?.name
      const groupName = parentProtocolName || 'Standalone & Individual Modalities'
      
      if (!groups[groupName]) groups[groupName] = []
      groups[groupName].push(task)
    })
    return groups
  }, [routineTasks])

  const getGroupTimeIndex = (groupName: string, groupTasks: DedupedTask[]) => {
    const lowerName = groupName.toLowerCase()
    
    if (lowerName.includes('huberman morning') || lowerName.includes('morning sunlight') || lowerName.includes('morning routine')) return 10
    if (lowerName.includes('morning') || lowerName.includes('wake')) return 20
    if (lowerName.includes('first meal') || lowerName.includes('first_meal') || lowerName.includes('breakfast')) return 30
    if (lowerName.includes('metabolic') || lowerName.includes('midday') || lowerName.includes('afternoon') || lowerName.includes('lunch')) return 50
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

  // Fallback static gradient stops
  const fallbackCircadianGradientCSS = useMemo(() => {
    const groupKeys = activeGroups.map(([groupName]) => groupName)
    return buildDynamicCircadianGradientCSS(groupKeys)
  }, [activeGroups])

  const [measuredCircadianGradientCSS, setMeasuredCircadianGradientCSS] = useState<string>('')

  // Dynamically calculate the spine gradient stops directly from the real, measured DOM boundaries of each time block
  const recalculateSpineGradient = useCallback(() => {
    if (!timelineContainerRef.current) return
    const container = timelineContainerRef.current
    const totalHeight = container.offsetHeight
    if (totalHeight <= 0 || activeGroups.length === 0) return

    const colorStops: { color: string; pct: number }[] = []

    const isBlueFamily = (hex: string) => ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#2563eb', '#3b82f6', '#5b9bd5'].includes(hex.toLowerCase())
    const isOrangeFamily = (hex: string) => ['#f97316', '#ea580c', '#f87e38', '#f88a20', '#f7c275', '#f59e0b', '#d97706', '#fbbf24'].includes(hex.toLowerCase())
    const isDarkBlueFamily = (hex: string) => ['#1d4ed8', '#1e40af', '#2563eb', '#1e3a8a', '#172554', '#0b132b', '#231a45', '#1b1536'].includes(hex.toLowerCase())

    activeGroups.forEach(([groupName], i) => {
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
        topPct = (i / activeGroups.length) * 100
        bottomPct = ((i + 1) / activeGroups.length) * 100
      }

      const nextGroupName = i < activeGroups.length - 1 ? activeGroups[i + 1][0] : null
      const nextCfg = nextGroupName ? getCircadianConfig(nextGroupName) : null
      const nextPrimary = nextCfg ? nextCfg.skyColorHex : null

      const isTransitioningToSunset = nextPrimary && (
        (isBlueFamily(primary) && isOrangeFamily(nextPrimary)) ||
        (isBlueFamily(primary) && (nextGroupName === 'pre_meal' || nextGroupName === 'post_meal' || nextGroupName === 'evening' || nextGroupName === 'late_afternoon'))
      )

      if (i === 0) {
        const firstIdx = CHRONOLOGICAL_CIRCADIAN_SLOTS.indexOf(cfg.key)
        if (firstIdx > 2) {
          colorStops.push({ color: '#D97706', pct: 0 })
          colorStops.push({ color: '#F59E0B', pct: Math.min(Number((bottomPct * 0.25).toFixed(1)), 4) })
          colorStops.push({ color: '#38BDF8', pct: Math.min(Number((bottomPct * 0.5).toFixed(1)), 8) })
        } else if (['waking', 'morning_routine', 'morning', 'morning_supplement_stack', 'first_meal'].includes(cfg.key)) {
          colorStops.push({ color: '#D97706', pct: 0 })
          colorStops.push({ color: '#F59E0B', pct: Math.min(Number((bottomPct * 0.35).toFixed(1)), 8) })
          colorStops.push({ color: '#FBBF24', pct: Math.min(Number((bottomPct * 0.7).toFixed(1)), 16) })
        } else {
          const startCol = cfg.startColorHex || primary
          colorStops.push({ color: startCol, pct: 0 })
        }
        colorStops.push({ color: primary, pct: Math.max(0, Number((bottomPct - 1.0).toFixed(1))) })
      } else if (cfg.key === 'pre_meal' || cfg.key === 'post_meal') {
        colorStops.push({ color: '#F87E38', pct: Math.min(100, Number((topPct + 0.5).toFixed(1))) })
        colorStops.push({ color: '#F87E38', pct: Math.max(0, Number((bottomPct - 0.5).toFixed(1))) })
      } else if (cfg.key === 'evening') {
        colorStops.push({ color: '#DF5558', pct: Math.min(100, Number((topPct + 0.5).toFixed(1))) })
        colorStops.push({ color: '#DF5558', pct: Math.max(0, Number((bottomPct - 0.5).toFixed(1))) })
      } else if (cfg.key === 'evening_supplement_stack') {
        colorStops.push({ color: '#A52D6A', pct: Math.min(100, Number((topPct + 0.5).toFixed(1))) })
        colorStops.push({ color: '#A52D6A', pct: Math.max(0, Number((bottomPct - 0.5).toFixed(1))) })
      } else if (cfg.key === 'wind_down') {
        colorStops.push({ color: '#50236B', pct: Math.min(100, Number((topPct + 0.5).toFixed(1))) })
        colorStops.push({ color: '#50236B', pct: Math.max(0, Number((bottomPct - 0.5).toFixed(1))) })
      } else if (cfg.key === 'pre_bed') {
        colorStops.push({ color: '#231A45', pct: Math.min(100, Number((topPct + 0.5).toFixed(1))) })
        colorStops.push({ color: '#231A45', pct: Math.max(0, Number((bottomPct - 0.5).toFixed(1))) })
      } else if (i === activeGroups.length - 1) {
        colorStops.push({ color: cfg.startColorHex || primary, pct: Math.min(100, Number((topPct + 0.5).toFixed(1))) })
        const lastIdx = CHRONOLOGICAL_CIRCADIAN_SLOTS.indexOf(cfg.key)
        if (lastIdx !== -1 && lastIdx < CHRONOLOGICAL_CIRCADIAN_SLOTS.length - 2) {
          const remainingKeys = CHRONOLOGICAL_CIRCADIAN_SLOTS.slice(lastIdx + 1)
          const remCount = remainingKeys.length
          remainingKeys.forEach((remKey, rIdx) => {
            const remCfg = getCircadianConfig(remKey)
            const pct = bottomPct + ((rIdx + 1) / (remCount + 1)) * (100 - bottomPct)
            colorStops.push({ color: remCfg.skyColorHex, pct: Number(pct.toFixed(1)) })
          })
          colorStops.push({ color: '#0B132B', pct: 100 })
        } else {
          colorStops.push({ color: primary, pct: Number(((topPct + 100) / 2).toFixed(1)) })
          colorStops.push({ color: cfg.endColorHex || '#0B132B', pct: 100 })
        }
      } else {
        colorStops.push({ color: primary, pct: Math.min(100, Number((topPct + 1.0).toFixed(1))) })
        colorStops.push({ color: primary, pct: Math.max(0, Number((bottomPct - 1.0).toFixed(1))) })
      }

      // Atmospheric golden sunset bridge between daytime blue and sunset orange/coral
      if (nextPrimary && isBlueFamily(primary) && (isOrangeFamily(nextPrimary) || nextGroupName === 'pre_meal' || nextGroupName === 'post_meal' || nextGroupName === 'evening')) {
        colorStops.push({ color: '#F59E0B', pct: Number(bottomPct.toFixed(1)) })
      } else if (nextCfg) {
        // Gap-bridging for skipped intermediate time blocks
        const currIdx = CHRONOLOGICAL_CIRCADIAN_SLOTS.indexOf(cfg.key)
        const nextIdx = CHRONOLOGICAL_CIRCADIAN_SLOTS.indexOf(nextCfg.key)

        if (currIdx !== -1 && nextIdx !== -1 && nextIdx > currIdx + 1) {
          const skippedKeys = CHRONOLOGICAL_CIRCADIAN_SLOTS.slice(currIdx + 1, nextIdx)
          const distinctSkippedColors: string[] = []
          skippedKeys.forEach(k => {
            const col = getCircadianConfig(k).skyColorHex
            if (!distinctSkippedColors.includes(col) && col.toLowerCase() !== primary.toLowerCase() && col.toLowerCase() !== nextCfg.skyColorHex.toLowerCase()) {
              distinctSkippedColors.push(col)
            }
          })

          if (distinctSkippedColors.length > 0) {
            const seamCenter = bottomPct
            const windowStart = Math.max(topPct + 1, seamCenter - 3.0)
            const windowEnd = seamCenter // Never bleed into next block
            const count = distinctSkippedColors.length
            distinctSkippedColors.forEach((color, sIdx) => {
              const pct = windowStart + ((sIdx + 1) / (count + 1)) * (windowEnd - windowStart)
              colorStops.push({ color, pct: Number(pct.toFixed(1)) })
            })
          }
        }
      }
    })

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
  }, [activeGroups])

  useEffect(() => {
    recalculateSpineGradient()
    const timer = setTimeout(recalculateSpineGradient, 100)
    return () => clearTimeout(timer)
  }, [activeGroups, tasks.length, viewMode, calendarViewMode, recalculateSpineGradient])

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
    if (ignitedGroupKeys.size === 0) {
      if (activeGroups.length > 0) return getCircadianConfig(activeGroups[0][0]).skyColorHex
      return '#F59E0B'
    }
    for (let i = activeGroups.length - 1; i >= 0; i--) {
      const gName = activeGroups[i][0]
      if (ignitedGroupKeys.has(gName)) {
        return getCircadianConfig(gName).skyColorHex
      }
    }
    return '#F59E0B'
  }, [ignitedGroupKeys, activeGroups])

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
    return Boolean(localStorage.getItem('levl_daily_tip_acted_' + dateStr))
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

  const getModalityIcon = (mod: any) => {
    if (!mod) return '✨'
    const cat = (mod.category || '').toLowerCase()
    const type = (mod.modality_type || '').toLowerCase()
    const name = (mod.display_name || mod.name || '').toLowerCase()

    if (cat.includes('breath') || type.includes('breath') || name.includes('breath') || name.includes('sigh') || name.includes('4-7-8')) return '🫁'
    if (cat.includes('sleep') || name.includes('mouth tape') || name.includes('mouth tap') || name.includes('sleep') || name.includes('bed') || name.includes('dark & cool') || name.includes('blue light') || name.includes('screen')) return '🌙'
    if (cat.includes('fast') || type.includes('fast') || name.includes('fast')) return '⏱️'
    if (cat.includes('sauna') || cat.includes('cold') || cat.includes('thermal') || type.includes('heat') || type.includes('cold')) return '❄️'
    if (cat.includes('exercise') || cat.includes('physical') || cat.includes('strength') || cat.includes('cardio') || type.includes('exercise')) return '⚡'
    if (cat.includes('peptide') || type.includes('peptide') || name.includes('bpc') || name.includes('cjc') || name.includes('ipamorelin')) return '💉'
    if (cat.includes('supplement') || cat.includes('nutraceutical') || type === 'supplement') return '💊'
    return '✨'
  }

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

  const isGroupCollapsed = (groupName: string, groupTasks: DailyProtocolTask[]) => {
    if (collapsedGroups[groupName] !== undefined) {
      return collapsedGroups[groupName]
    }
    // Default to collapsed if it's a supplement stack with 3+ modalities
    const isSupp = isSupplementGroup(groupName, groupTasks)
    return isSupp && groupTasks.length >= 3
  }

  const toggleGroupCollapse = (groupName: string, groupTasks: DailyProtocolTask[]) => {
    const current = isGroupCollapsed(groupName, groupTasks)
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !current
    }))
  }

  const renderTimelineBlocks = () => {
    return activeGroups.map(([groupName, groupTasks]) => {
      const isProtocolGroup = viewMode === 'protocol'
      const matchedProtocol = isProtocolGroup 
        ? availableProtocols.find((p: any) => p.name === groupName || p.id === groupTasks[0]?.protocol_step?.protocol_id) || groupTasks[0]?.protocol_step?.protocol
        : null
      const isCollapsed = isGroupCollapsed(groupName, groupTasks)
      const completedCount = groupTasks.filter(t => t.status === 'completed').length

      if (isProtocolGroup && groupName !== 'Standalone & Individual Modalities') {
        const protoId = matchedProtocol?.id || groupTasks[0]?.protocol_step?.protocol_id || ''
        const protoSlug = groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        return (
          <div 
            key={groupName} 
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

              {isCollapsed ? (
                <div 
                  onClick={() => toggleGroupCollapse(groupName, groupTasks)}
                  className="bg-slate-900/60 border border-purple-500/20 hover:border-purple-500/40 rounded-2xl p-3.5 space-y-3 cursor-pointer transition-all hover:bg-slate-900/80 shadow-md group"
                >
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {groupTasks.map((t) => {
                      const mod = t.loose_modality || t.protocol_step?.modality
                      const name = mod?.display_name || mod?.name || 'Modality'
                      const bench = benchItems.find(b => b.modality_id === (t.modality_id || mod?.id))
                      const dose = t.execution_details?.custom_dose || bench?.custom_dose || t.protocol_step?.dose_text || (t.protocol_step?.dose_amount ? `${t.protocol_step.dose_amount}${t.protocol_step.dose_unit || ''}` : '') || mod?.dose_or_exposure || ''
                      const isDone = t.status === 'completed'
                      const icon = getModalityIcon(mod)

                      return (
                        <span 
                          key={t.id}
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                            isDone 
                              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                              : 'bg-black/40 border-white/10 text-slate-200 group-hover:border-purple-500/30'
                          }`}
                        >
                          {isDone ? (
                            <Check size={11} className="text-emerald-400 stroke-[3] shrink-0" />
                          ) : (
                            <span className="text-[10px] opacity-70">{icon}</span>
                          )}
                          <span className={isDone ? 'line-through opacity-80' : 'text-white'}>{name}</span>
                          {dose && (
                            <span className={`text-[10px] font-mono font-normal ${isDone ? 'text-emerald-400/80' : 'text-purple-300/90'}`}>
                              • {dose}
                            </span>
                          )}
                        </span>
                      )
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-purple-400/90 group-hover:text-purple-300 font-semibold pt-1 border-t border-white/5">
                    <span className="flex items-center gap-1">
                      <span>▾ Tap to view full cards & dosages ({groupTasks.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {completedCount === groupTasks.length ? '✓ All Done' : `${groupTasks.length - completedCount} Remaining`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className={completionMode === 'fast' ? "space-y-1.5" : "space-y-3"}>
                  {groupTasks
                    .sort((a, b) => (a.protocol_step?.display_order || 0) - (b.protocol_step?.display_order || 0))
                    .map(task => {
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
                          onOpenRescheduleModal={handleOpenRescheduleModal}
                          completionMode={completionMode}
                          isRecentlyCompleted={recentlyCompletedIds.has(task.id) || recentlyCompletedIds.has(task.id.split('-split-')[0])}
                          isProtocolGroupView={true}
                          protocolGroupName={groupName}
                          isIgnited={true}
                        />
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        )
      }

      // Default Chronological Time Blocks rendering with Circadian Sky Beacons
      const circadian = getAdaptiveCircadianConfig(groupName, userActualWakeTime, profile?.ideal_wake_time || '06:30')
      const CircadianIcon = circadian.icon
      const isNow = isCurrentDay && isCurrentCircadianSlot(groupName)
      const isIgnited = ignitedGroupKeys.has(groupName)
      const isAnytime = groupName === 'anytime'

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
          <div className={`flex items-center justify-between ${isAnytime ? 'border-b border-dashed border-white/10 pb-2' : 'border-b border-white/10 pb-2.5'} flex-wrap gap-2`}>
            <button
              type="button"
              onClick={() => toggleGroupCollapse(groupName, groupTasks)}
              className="flex items-center gap-2 sm:gap-2.5 text-left group cursor-pointer focus:outline-none"
            >
              {/* Circadian Sky Beacon Icon */}
              <div 
                ref={(el) => { beaconRefs.current[groupName] = el }}
                className={`${isAnytime ? 'w-6 h-6 rounded-lg' : 'w-9 h-9 rounded-2xl'} border flex items-center justify-center shrink-0 transition-all duration-500 ${
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
                <CircadianIcon size={isAnytime ? 12 : 17} strokeWidth={isIgnited ? 2.2 : 1.7} />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className={`${isAnytime ? 'text-[11px] sm:text-xs font-bold tracking-normal' : 'text-sm font-extrabold tracking-wider'} uppercase transition-colors ${
                    isIgnited ? (isAnytime ? 'text-slate-300 group-hover:text-purple-300' : 'text-white group-hover:text-purple-200') : 'text-slate-400 group-hover:text-slate-200'
                  }`}>
                    {isAnytime ? 'Anytime / Flexible' : formatSlotName(groupName)}
                  </span>
                  {isNow && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>Live Window</span>
                    </span>
                  )}
                  <span className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-mono font-bold transition-colors ${
                    isIgnited ? (isAnytime ? 'bg-purple-950/50 text-purple-300 border border-purple-800/40' : 'bg-slate-800/90 text-slate-300') : 'bg-slate-900 text-slate-500'
                  }`}>
                    {completedCount > 0 ? `${completedCount}/${groupTasks.length}` : groupTasks.length}
                  </span>
                </div>
                <span className={`${isAnytime ? 'text-[10px] text-slate-500' : 'text-[11px]'} font-medium transition-colors ${
                  isIgnited && !isAnytime ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {isAnytime ? 'Flexible window • Complete anytime today' : <>{circadian.timeRange} • <span className="text-slate-600">{circadian.circadianPhase}</span></>}
                </span>
              </div>

              <ChevronDown 
                size={isAnytime ? 13 : 16} 
                className={`transition-transform duration-200 ml-1 ${
                  isIgnited ? 'text-slate-400 group-hover:text-white' : 'text-slate-600'
                } ${isCollapsed ? '-rotate-90' : ''}`} 
              />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
              <button
                type="button"
                onClick={() => handleStartGroupTracking(groupName, groupTasks)}
                className={`font-semibold flex items-center gap-1 cursor-pointer px-2 py-1 rounded-lg transition-colors ${
                  isAnytime 
                    ? 'text-[11px] text-slate-400 hover:text-purple-300 hover:bg-white/5' 
                    : 'text-xs text-purple-400 hover:text-purple-300 hover:bg-white/5'
                }`}
              >
                <Activity size={isAnytime ? 12 : 13} /> {activeGroupTrackKey === groupName ? 'Close' : 'Track'}
              </button>
              <button
                type="button"
                onClick={() => handleCompleteGroup(groupName, groupTasks)}
                className={`font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  isAnytime 
                    ? 'text-[11px] text-emerald-400/90 hover:text-emerald-300 px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20' 
                    : 'text-xs text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30'
                }`}
              >
                <Check size={isAnytime ? 12 : 13} strokeWidth={2.5} /> Complete All
              </button>
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

          {/* Collapsed Supplement Tray Preview OR Expanded Modality Task Cards */}
          {isCollapsed ? (
            <div 
              onClick={() => toggleGroupCollapse(groupName, groupTasks)}
              className="bg-slate-900/60 border border-purple-500/20 hover:border-purple-500/40 rounded-2xl p-3.5 sm:p-4 space-y-3 cursor-pointer transition-all hover:bg-slate-900/80 shadow-md group"
            >
              {/* Capsule Chips Wrap */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {groupTasks.map((t) => {
                  const mod = t.loose_modality || t.protocol_step?.modality
                  const name = mod?.display_name || mod?.name || 'Modality'
                  const bench = benchItems.find(b => b.modality_id === (t.modality_id || mod?.id))
                  const dose = t.execution_details?.custom_dose || bench?.custom_dose || t.protocol_step?.dose_text || (t.protocol_step?.dose_amount ? `${t.protocol_step.dose_amount}${t.protocol_step.dose_unit || ''}` : '') || mod?.dose_or_exposure || ''
                  const isDone = t.status === 'completed'
                  const icon = getModalityIcon(mod)

                  return (
                    <span 
                      key={t.id}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                        isDone 
                          ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                          : 'bg-black/40 border-white/10 text-slate-200 group-hover:border-purple-500/30'
                      }`}
                    >
                      {isDone ? (
                        <Check size={11} className="text-emerald-400 stroke-[3] shrink-0" />
                      ) : (
                        <span className="text-[10px] opacity-70">{icon}</span>
                      )}
                      <span className={isDone ? 'line-through opacity-80' : 'text-white'}>{name}</span>
                      {dose && (
                        <span className={`text-[10px] font-mono font-normal ${isDone ? 'text-emerald-400/80' : 'text-purple-300/90'}`}>
                          • {dose}
                        </span>
                      )}
                    </span>
                  )
                })}
              </div>

              {/* Bottom Subtle Tap To Expand Bar */}
              <div className="flex items-center justify-between text-[11px] text-purple-400/90 group-hover:text-purple-300 font-semibold pt-1 border-t border-white/5">
                <span className="flex items-center gap-1">
                  <span>▾ Tap to view full cards & dosages ({groupTasks.length})</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {completedCount === groupTasks.length ? '✓ All Done' : `${groupTasks.length - completedCount} Remaining`}
                </span>
              </div>
            </div>
          ) : (
            <div className={completionMode === 'fast' ? "space-y-1.5" : "space-y-3"}>
              {groupTasks
                .sort((a, b) => (a.protocol_step?.display_order || 0) - (b.protocol_step?.display_order || 0))
                .map(task => {
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
                      onOpenRescheduleModal={handleOpenRescheduleModal}
                      completionMode={completionMode}
                      isRecentlyCompleted={recentlyCompletedIds.has(task.id) || recentlyCompletedIds.has(task.id.split('-split-')[0])}
                      isProtocolGroupView={viewMode === 'protocol'}
                      protocolGroupName={viewMode === 'protocol' ? groupName : undefined}
                      isIgnited={isIgnited}
                    />
                  )
                })}
            </div>
          )}
        </div>
      )
    })
  }

  if (!isMounted) {
    return <div className="min-h-screen bg-slate-950" />
  }

  return (
    <div 
      onTouchStart={handlePullTouchStart}
      onTouchMove={handlePullTouchMove}
      onTouchEnd={handlePullTouchEnd}
      className="min-h-screen bg-slate-950 text-slate-100 pb-24 relative"
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 border bg-slate-950/95 border-slate-700">
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
      <div className={`mx-auto px-3 sm:px-6 pt-4 sm:pt-6 ${calendarViewMode === 'today' ? 'max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl' : 'max-w-7xl'}`}>
        
        {/* Protocol Filter Header if specific protocol filtered */}
        {selectedProtocolFilter !== 'all' && (
          <div className="mb-4">
            <ProtocolOverviewHeaderCard 
              protocolName={availableProtocols.find((p: any) => p.id === selectedProtocolFilter)?.name || 'Protocol'}
              groupTasks={routineTasks.filter(t => t.protocol_step?.protocol_id === selectedProtocolFilter || (t as any).user_protocol_instance?.protocol_id === selectedProtocolFilter)}
              allOutcomes={allOutcomes}
              onCompleteAll={() => {}}
              onTrackGroup={() => {}}
              isTrackingActive={false}
            />
          </div>
        )}

        {/* 1. TOP VIEW SELECTOR NAVIGATION BAR (Always at Top) */}
        <ViewSelectorHeader
          viewMode={calendarViewMode}
          onViewModeChange={setCalendarViewMode}
          dateTitle={dateTitle}
          selectedProtocolFilter={selectedProtocolFilter}
          onProtocolFilterChange={setSelectedProtocolFilter}
          availableProtocols={availableProtocols}
          selectedMainCategories={selectedMainCategories}
          selectedSubCategories={selectedSubCategories}
          onToggleMainCategory={handleToggleMainCategory}
          onToggleSubCategory={handleToggleSubCategory}
          layoutOrientation={layoutOrientation}
          onToggleLayoutOrientation={setLayoutOrientation}
          onEnrollClick={() => setIsEnrollModalOpen(true)}
          completionMode={completionMode}
          onCompletionModeChange={handleCompletionModeChange}
          showCategoryFilters={calendarViewMode !== 'today' && calendarViewMode !== 'pulse'}
        />

        {/* 2. PRIMARY DATE NAVIGATION TOOLBAR (Always at Top, unified across Today, 3-Day, Week, and Month Views) */}
        <div className="flex items-center justify-between w-full my-4 px-1 gap-2">
          <button 
            type="button"
            onClick={handlePreviousBatch}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
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
                className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-800/80 text-emerald-300 hover:text-emerald-200 font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
              >
                {jumpButtonLabel}
              </button>
            )}

            <span className={`text-sm sm:text-base font-extrabold text-white tracking-tight transition-opacity duration-150 ${isDateSwitching ? 'opacity-60' : 'opacity-100'}`}>
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
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
            aria-label={nextButtonTooltip}
            title={nextButtonTooltip}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* If Today view is loading / calibrating, display the dedicated Calibration screen with rotating Circadian Ring */}
        {calendarViewMode === 'today' && (loading || (!tasks.length && isDateSwitching)) ? (
          <div className="py-20 sm:py-28 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-300">
            {/* Circadian Rotating Ring */}
            <div className="relative flex items-center justify-center">
              {/* Outer Ambient Circadian Aura */}
              <div 
                className="absolute w-44 h-44 rounded-full blur-2xl opacity-40 animate-pulse pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, #F59E0B 0%, #38BDF8 25%, #A52D6A 70%, transparent 100%)'
                }}
              />
              
              {/* Rotating Conic Ring (Matches ending color with beginning morning color #D97706) */}
              <div 
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-full p-[5px] animate-[spin_4s_linear_infinite] shadow-[0_0_35px_rgba(245,158,11,0.25)]"
                style={{
                  background: 'conic-gradient(from 0deg, #D97706 0%, #F59E0B 3%, #FBBF24 6%, #38BDF8 10%, #0284C7 30%, #2563EB 48%, #F59E0B 58%, #F87E38 66%, #DF5558 76%, #A52D6A 84%, #50236B 90%, #231A45 94%, #0B132B 98%, #D97706 100%)'
                }}
              >
                {/* Inner Cutout Disc */}
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center p-3 border border-white/10 shadow-inner">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-900 via-slate-950 to-black flex items-center justify-center shadow-inner">
                    <Sparkles className="text-amber-400 animate-pulse" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Calibration Copy */}
            <div className="space-y-2 max-w-md px-4">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {userFirstName === 'Your' ? 'Calibrating Your Protocol' : `Calibrating ${userFirstName}'s Protocol`}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                Aligning circadian biological vectors, scheduled modalities &amp; outcomes
              </p>
            </div>
          </div>
        ) : (
          <>
        {/* Progressive Profiling Banner for Referral / Guest Instant Kickstart */}
        {showGuestKickstartBanner && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-indigo-950/70 to-slate-900/90 border border-purple-500/40 shadow-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
                <Sparkles size={18} />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-white">
                    {guestKickstartProtocol ? `Tracking: ${guestKickstartProtocol}` : 'Instant Protocol Kickstart Active'}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-teal-300 bg-teal-950/60 border border-teal-500/30 px-2 py-0.5 rounded-full">
                    Free Direct Access
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your daily schedule is live with evidence-based skin cycling and modalities. Complete your full profile anytime to personalize circadian sleep times, fasting windows, and multi-protocol synergies.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => router.push('/onboarding')}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95 whitespace-nowrap cursor-pointer"
              >
                Personalize Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsGuestBannerDismissed(true)
                  if (typeof window !== 'undefined') {
                    try { localStorage.setItem('levl_guest_banner_dismissed', 'true') } catch (e) {}
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Dismiss banner"
              >
                <X size={15} />
              </button>
            </div>
          </div>
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

        {/* 3-Wide Daily Quick-Log Hotkeys Bar */}
        {calendarViewMode === 'today' && (
          <QuickHotkeyGrid
            date={dateStr}
            localUserId={authUserId || profile?.local_user_id || getLocalUserId()}
            userProfile={profile}
          />
        )}

        {/* Infradian & Menstrual Cycle Adaptive Protocol Banner (When enabled for Female < 52) */}
        {calendarViewMode === 'today' && infradianStatus && infradianStatus.enabled && (
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

        {/* Multi-Day Calendar View Renders */}
        {calendarViewMode === '3day' && (
          <ThreeDaySplitView
            tasksByDate={filteredMultiDayTasks}
            threeDates={threeDates}
            currentDateStr={dateStr}
            selectedProtocolFilter={selectedProtocolFilter}
            selectedIsolatedOutcome={selectedIsolatedOutcome}
            layoutOrientation={layoutOrientation}
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
        {calendarViewMode === 'today' && (
          <>
            {/* 3. Daily Historical Debrief Header & Snapshot when viewing past dates */}
            {isPastDate && (
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
            <div className="mb-6">
              <DailyWellbeingCheckin 
                onSave={handleWellbeingSave} 
                initialData={wellbeingCheckin}
                profile={profile}
                allOutcomes={allOutcomes}
                date={currentDate}
                isCurrentDay={isCurrentDay}
                isCollapsedByDefault={isPastDate}
                recentTasks={tasks}
                section="morning_anytime"
              />
            </div>

            {/* 4b. Adaptive Sleep Recovery Protocol Triage Card */}
            {shouldShowSleepTriage && (
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
            {!isTipActedUpon && (
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
                  isCollapsedByDefault={isPastDate}
                />
              </div>
            )}

            {/* Full-Width AI Longevity Coach Input Bar */}
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

            {/* Completed, Snoozed, & Skipped Modalities Group (Zero Space Between Them) */}
            {(() => {
              const activeStatusSections: ('completed' | 'snoozed' | 'skipped')[] = []
              if (allCompletedTasks.length > 0) activeStatusSections.push('completed')
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

            {/* Modality Category Filter Row (Desktop only; on mobile it is in the top header half-width dropdown) */}
            <div className="hidden md:block">
              <CategoryFiltersBar
                selectedMainCategories={selectedMainCategories}
                selectedSubCategories={selectedSubCategories}
                onToggleMainCategory={handleToggleMainCategory}
                onToggleSubCategory={handleToggleSubCategory}
                viewMode={calendarViewMode}
                layoutOrientation={layoutOrientation}
                onToggleLayoutOrientation={setLayoutOrientation}
              />
            </div>

            {/* Timeline Layout Mode & Completion Mode Toggle Bar (Single Non-Scrolling Row) */}
            <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 p-1 sm:p-2 rounded-2xl mb-3 backdrop-blur-md shadow-sm gap-1 sm:gap-2">
              {/* Left: Timeline Layout Mode (Time Blocks vs Protocols vs Outcome Lens) */}
              <div className="flex items-center">
                <div className="flex items-center bg-black/60 p-0.5 rounded-xl border border-white/10 gap-0.5 text-[10px] sm:text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('chronological')}
                    className={`px-1.5 sm:px-2.5 py-1 rounded-lg font-bold text-[10px] sm:text-xs tracking-tight transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                      viewMode === 'chronological'
                        ? 'bg-purple-600 text-white shadow-sm border border-purple-400/30 font-extrabold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Clock size={11} className="shrink-0" />
                    <span>Time<span className="hidden min-[380px]:inline"> Blocks</span></span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('protocol')}
                    className={`px-1.5 sm:px-2.5 py-1 rounded-lg font-bold text-[10px] sm:text-xs tracking-tight transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                      viewMode === 'protocol'
                        ? 'bg-purple-600 text-white shadow-sm border border-purple-400/30 font-extrabold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ListOrdered size={11} className="shrink-0" />
                    <span>Protocols</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('outcomes')}
                    className={`px-1.5 sm:px-2.5 py-1 rounded-lg font-bold text-[10px] sm:text-xs tracking-tight transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                      viewMode === 'outcomes'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm border border-purple-400/40 font-extrabold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="View modalities grouped and scored by functional outcome vectors (Skin Clarity, Focus, Sleep, Longevity)"
                  >
                    <Sparkles size={11} className="shrink-0 text-amber-300" />
                    <span>Outcome Lens</span>
                  </button>
                </div>
              </div>

              {/* Right: Completion Mode (Track Outcomes vs Fast Mode) */}
              <div className="flex items-center">
                <div className="flex items-center bg-black/60 p-0.5 rounded-xl border border-white/10 gap-0.5 text-[10px] sm:text-xs shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleCompletionModeChange('outcome')}
                    className={`px-1.5 sm:px-2.5 py-1 rounded-lg font-bold text-[10px] sm:text-xs tracking-tight transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                      completionMode === 'outcome'
                        ? 'bg-purple-600 text-white shadow-sm border border-purple-400/30 font-extrabold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Track Outcomes: deep metric tracking with sliders"
                  >
                    <Activity size={11} className={`shrink-0 ${completionMode === 'outcome' ? 'text-purple-200' : 'text-slate-400'}`} />
                    <span><span className="hidden min-[400px]:inline">Track </span>Outcomes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCompletionModeChange('fast')}
                    className={`px-1.5 sm:px-2.5 py-1 rounded-lg font-bold text-[10px] sm:text-xs tracking-tight transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                      completionMode === 'fast'
                        ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Fast Mode: 1-click instant completion"
                  >
                    <Zap size={11} className={`shrink-0 ${completionMode === 'fast' ? 'text-slate-950 fill-slate-950' : 'text-amber-400'}`} />
                    <span>Fast<span className="hidden min-[380px]:inline"> Mode</span></span>
                  </button>
                </div>
              </div>
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
                {activeGroups.length === 0 ? (
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
                ) : (
                  <div 
                    ref={timelineContainerRef}
                    className="relative space-y-8"
                  >
                    {/* Background Dim Ambient Ghost Track (20% Ambient Circadian Glow) */}
                    <div 
                      className="absolute -left-1.5 sm:-left-2 top-2 bottom-6 w-[3px] rounded-full opacity-20 pointer-events-none" 
                      style={{ background: circadianGradientCSS }}
                    />

                    {/* Revealing Circadian Sky Gradient Spine (Masks true vertical gradient matching each block as user scrolls) */}
                    <div 
                      className="absolute -left-1.5 sm:-left-2 top-2 w-[3px] rounded-full overflow-hidden transition-[height] duration-75 ease-out pointer-events-none"
                      style={{ height: `${spineHeight}px` }}
                    >
                      {/* Inner Full-Height Gradient Line (Pinned to timeline height, masked by outer overflow-hidden) */}
                      <div 
                        className="w-full"
                        style={{ 
                          height: timelineContainerRef.current ? `${timelineContainerRef.current.offsetHeight}px` : '1200px',
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
      </>
    )}

      </div>

      {/* Modals */}
      {profile && (
        <AdHocLoggerModal 
          isOpen={isAdHocModalOpen}
          onClose={() => setIsAdHocModalOpen(false)}
          localUserId={profile.local_user_id}
          benchItems={benchItems}
          todayTasks={tasks}
          dateStr={dateStr}
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
