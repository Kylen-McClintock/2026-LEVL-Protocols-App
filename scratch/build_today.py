import os

today_code = """'use client'

import { useEffect, useState, useMemo, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  saveOutcomeObservation
} from '@/lib/data'
import { DailyProtocolTask, Modality, OutcomeDimension, UserProfile, UserBenchItem, DailyWellbeingCheckin as WellbeingType } from '@/lib/types'
import { format, parseISO, addDays, subDays, isBefore, startOfDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { 
  Activity, Check, ChevronDown, ChevronLeft, ChevronRight, 
  ChevronUp, Clock, Layers, ListOrdered, Plus, Slash, Sparkles, Stethoscope, X, Zap 
} from 'lucide-react'

import ProtocolTaskCard, { DedupedTask } from '@/components/cards/ProtocolTaskCard'
import { PulsedModalityCard } from '@/components/cards/PulsedModalityCard'
import ProactiveDiagnosticCard from '@/components/cards/ProactiveDiagnosticCard'
import DailyWellbeingCheckin from '@/components/score/DailyWellbeingCheckin'
import { DailyLongevityTipBanner } from '@/components/banners/DailyLongevityTipBanner'
import { DailyHistoricalDebriefHeader } from '@/components/cards/DailyHistoricalDebriefHeader'
import { ViewSelectorHeader, CalendarViewMode, LayoutOrientation, MainCategory, SUB_CATEGORIES_MAP } from '@/components/ui/ViewSelectorHeader'
import { ThreeDaySplitView } from '@/components/views/ThreeDaySplitView'
import { SevenDayWeekView } from '@/components/views/SevenDayWeekView'
import { MonthMatrixView } from '@/components/views/MonthMatrixView'
import ExploreCard from '@/components/cards/ExploreCard'
import ProtocolOverviewHeaderCard from '@/components/cards/ProtocolOverviewHeaderCard'
import AdHocLoggerModal from '@/components/modals/AdHocLoggerModal'
import EnrollProtocolModal from '@/components/modals/EnrollProtocolModal'
import { SmartRescheduleModal } from '@/components/modals/SmartRescheduleModal'
import CustomizeModalityOutcomesModal from '@/components/modals/CustomizeModalityOutcomesModal'

import { calculateDailyEfficacySummary } from '@/lib/data/historicalAnalysis'
import { getScoredLongevityTips } from '@/lib/ranking/tipPersonalization'
import { getMacroCategory } from '@/lib/utils/categories'
import { getOutcomeColorConfig } from '@/lib/utils/outcomeColors'

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
  'midday',
  'afternoon',
  'evening',
  'evening_supplement_stack',
  'post_meal',
  'wind_down',
  'bedtime',
  'anytime'
]

interface MultiDoseSlot {
  doseNumber: number
  totalDoses: number
  label: string
  slot: string
}

function parseMultiDoseTimingSlots(timingStr?: string): MultiDoseSlot[] {
  if (!timingStr) return []
  const lower = timingStr.toLowerCase().trim()
  
  if (lower.includes('2x/day (morning & midday)') || lower.includes('2x/day (morning and midday)') || lower.includes('morning & midday')) {
    return [
      { doseNumber: 1, totalDoses: 2, label: 'Dose 1 (Morning)', slot: 'morning' },
      { doseNumber: 2, totalDoses: 2, label: 'Dose 2 (Midday)', slot: 'midday' }
    ]
  }
  if (lower.includes('2x/day (morning & evening)') || lower.includes('2x/day (morning and evening)') || lower.includes('morning & evening')) {
    return [
      { doseNumber: 1, totalDoses: 2, label: 'Dose 1 (Morning)', slot: 'morning' },
      { doseNumber: 2, totalDoses: 2, label: 'Dose 2 (Evening)', slot: 'evening' }
    ]
  }
  if (lower.includes('3x/day') || lower.includes('3x daily')) {
    return [
      { doseNumber: 1, totalDoses: 3, label: 'Dose 1 (Morning)', slot: 'morning' },
      { doseNumber: 2, totalDoses: 3, label: 'Dose 2 (Midday)', slot: 'midday' },
      { doseNumber: 3, totalDoses: 3, label: 'Dose 3 (Evening)', slot: 'evening' }
    ]
  }
  return []
}

function TodayPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [tasks, setTasks] = useState<DailyProtocolTask[]>([])
  const [allOutcomes, setAllOutcomes] = useState<OutcomeDimension[]>([])
  const [loading, setLoading] = useState(true)

  const currentDate = useMemo(() => {
    if (dateParam) {
      try {
        return parseISO(dateParam)
      } catch (e) {
        return new Date()
      }
    }
    return new Date()
  }, [dateParam])

  const dateStr = format(currentDate, 'yyyy-MM-dd')
  const isPastDate = isBefore(startOfDay(currentDate), startOfDay(new Date()))
  const isFutureTimeline = isBefore(startOfDay(new Date()), startOfDay(currentDate))
  const isCurrentDay = dateStr === format(new Date(), 'yyyy-MM-dd')

  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('today')
  const [viewMode, setViewMode] = useState<'chronological' | 'protocol'>('chronological')
  const [completionMode, setCompletionMode] = useState<'outcome' | 'fast'>('outcome')

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
  const [benchItems, setBenchItems] = useState<UserBenchItem[]>([])
  const [dismissedTipIds, setDismissedTipIds] = useState<string[]>([])
  const [topRecommendation, setTopRecommendation] = useState<Modality | null>(null)
  const [wellbeingCheckin, setWellbeingCheckin] = useState<WellbeingType | null>(null)

  const [isAdHocModalOpen, setIsAdHocModalOpen] = useState(false)
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [rescheduleTask, setRescheduleTask] = useState<DailyProtocolTask | null>(null)
  const [rescheduleModality, setRescheduleModality] = useState<Modality | null>(null)
  const [isReschedulePastMissed, setIsReschedulePastMissed] = useState(false)

  const [showCustomizeOutcomesModal, setShowCustomizeOutcomesModal] = useState(false)
  const [relevantOutcomes, setRelevantOutcomes] = useState<OutcomeDimension[]>([])
  const [activeModality, setActiveModality] = useState<Modality | null>(null)

  const [completionToast, setCompletionToast] = useState<{ id: string; name: string; dose?: string } | null>(null)
  const [recentlyCompletedIds, setRecentlyCompletedIds] = useState<Set<string>>(new Set())
  const [outcomesRefreshKey, setOutcomesRefreshKey] = useState<number>(0)

  // Tracking panel for protocol groups
  const [activeGroupTrackKey, setActiveGroupTrackKey] = useState<string | null>(null)
  const [groupTrackValues, setGroupTrackValues] = useState<Record<string, number>>({})
  const [touchedGroupOutcomes, setTouchedGroupOutcomes] = useState<Record<string, boolean>>({})
  const [isSavingGroupTrack, setIsSavingGroupTrack] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('levl_completion_mode') as 'outcome' | 'fast'
      if (savedMode) setCompletionMode(savedMode)
    }
  }, [])

  const handleCompletionModeChange = (mode: 'outcome' | 'fast') => {
    setCompletionMode(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('levl_completion_mode', mode)
    }
  }

  const navigateToDate = (targetDate: Date) => {
    const dStr = format(targetDate, 'yyyy-MM-dd')
    router.push(`/today?date=${dStr}`)
  }

  const refreshTodayTasks = async () => {
    const localUserId = getLocalUserId()
    const currentTasks = await getDailyProtocolTasks(localUserId, dateStr)
    setTasks(currentTasks)
  }

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const localUserId = getLocalUserId()
        const userProfile = await getOrCreateUserProfile(localUserId)
        if (!userProfile || !userProfile.display_name) {
          router.push('/onboarding')
          return
        }
        setProfile(userProfile)

        const [currentTasks, outcomes, protocols, bench, todayCheckin] = await Promise.all([
          getDailyProtocolTasks(localUserId, dateStr),
          getOutcomeDimensions(),
          getProtocols(),
          getBenchItems(localUserId),
          getDailyWellbeingCheckin(localUserId, dateStr)
        ])

        setTasks(currentTasks)
        setAllOutcomes(outcomes)
        setAvailableProtocols(protocols.map((p: any) => ({ id: p.id, name: p.name })))
        setBenchItems(bench)
        setWellbeingCheckin(todayCheckin || null)
      } catch (err) {
        console.error('Error loading Today data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [dateStr, router])

  // Multi-day task loader for 3day, week, and month views
  useEffect(() => {
    if (calendarViewMode === 'today') return

    async function loadMultiDay() {
      const localUserId = getLocalUserId()
      let datesToLoad: string[] = []

      if (calendarViewMode === '3day') {
        const d1 = subDays(currentDate, 1)
        const d2 = currentDate
        const d3 = addDays(currentDate, 1)
        datesToLoad = [format(d1, 'yyyy-MM-dd'), format(d2, 'yyyy-MM-dd'), format(d3, 'yyyy-MM-dd')]
      } else if (calendarViewMode === 'week') {
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
  }, [calendarViewMode, currentDate, outcomesRefreshKey])

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

    // Optimistic UI update
    setTasks(prev => prev.map(t => {
      if (t.id === id || uuidSet.has(t.id)) {
        const finalDetails = executionDetails !== undefined ? executionDetails : t.execution_details
        return { 
          ...t, 
          status: status as any, 
          status_reason: reason, 
          completed_at: completedAt || new Date().toISOString(), 
          execution_metrics: executionMetrics || t.execution_metrics, 
          execution_details: finalDetails 
        }
      }
      return t
    }))

    for (const uuid of targetUuids) {
      const existingTask = tasks.find(t => t.id === uuid)
      const finalDetails = executionDetails !== undefined ? executionDetails : existingTask?.execution_details
      await updateDailyTaskStatus(uuid, status, reason, undefined, completedAt, executionMetrics, finalDetails)
    }

    if (status === 'completed') {
      const completedTask = tasks.find(t => t.id === id || t.id === baseId)
      const modName = completedTask?.loose_modality?.name || completedTask?.protocol_step?.modality?.name || 'Modality'
      const dose = completedTask?.loose_modality?.dose_or_exposure || completedTask?.protocol_step?.modality?.dose_or_exposure
      setCompletionToast({ id: baseId, name: modName, dose })
      setRecentlyCompletedIds(prev => new Set(prev).add(id).add(baseId))
      setTimeout(() => {
        setCompletionToast(null)
      }, 4000)
    }
  }

  const handleWellbeingSave = async (
    mood: number, 
    energy: number, 
    stress: number, 
    sleep?: number, 
    sleepScore?: number, 
    customOutcomes?: Record<string, any>, 
    lastFoodTime?: string
  ) => {
    const localUserId = getLocalUserId()
    const saved = await saveDailyWellbeingCheckin(localUserId, dateStr, mood, energy, stress, sleep, sleepScore, lastFoodTime, customOutcomes)
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

  const handleOpenRescheduleModal = (task: DailyProtocolTask) => {
    setRescheduleTask(task)
    const mod = task.loose_modality || task.protocol_step?.modality || null
    setRescheduleModality(mod)
    setIsReschedulePastMissed(isPastDate)
    setIsRescheduleModalOpen(true)
  }

  const handleExecuteReschedule = async (newDate: string) => {
    if (!rescheduleTask || !profile) return
    const localUserId = profile.local_user_id
    const modalityId = rescheduleTask.modality_id || rescheduleTask.protocol_step?.modality_id
    if (modalityId) {
      await createDailyTask(localUserId, newDate, modalityId)
      await updateDailyTaskStatus(rescheduleTask.id, 'skipped', 'Rescheduled')
      await refreshTodayTasks()
    }
    setIsRescheduleModalOpen(false)
    setRescheduleTask(null)
    setRescheduleModality(null)
  }

  const handleMoveToBench = async (task: DailyProtocolTask) => {
    if (!profile) return
    const mId = task.modality_id || task.protocol_step?.modality_id
    if (mId) {
      const localUserId = profile.local_user_id
      const { moveModalityToBench } = await import('@/lib/data')
      await moveModalityToBench(localUserId, mId, task.id)
      await refreshTodayTasks()
      const bItems = await getBenchItems(localUserId)
      setBenchItems(bItems)
    }
  }

  const handleEliminateEntirely = async (task: DailyProtocolTask, reason?: string, selectedReasons?: string[]) => {
    if (!profile) return
    const mId = task.modality_id || task.protocol_step?.modality_id
    if (mId) {
      const localUserId = profile.local_user_id
      const { eliminateModality } = await import('@/lib/data')
      await eliminateModality(localUserId, mId, task.id, reason, selectedReasons)
      await refreshTodayTasks()
      const bItems = await getBenchItems(localUserId)
      setBenchItems(bItems)
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

  // Multi-dose splitting
  const dedupedTasks = useMemo(() => {
    const result: DedupedTask[] = []

    tasks.forEach(task => {
      const timingSummary = task.loose_modality?.timing_summary || task.protocol_step?.modality?.timing_summary || ''
      const slots = parseMultiDoseTimingSlots(timingSummary)

      if (slots.length > 0) {
        slots.forEach(s => {
          const splitTask: DedupedTask = {
            ...task,
            id: `${task.id}-split-${s.doseNumber}`,
            timing_slot: s.slot,
            status: task.status,
            execution_details: {
              ...task.execution_details,
              split_dose_label: s.label,
              split_dose_number: s.doseNumber,
              split_dose_total: s.totalDoses
            }
          }
          result.push(splitTask)
        })
      } else {
        result.push(task)
      }
    })

    return result
  }, [tasks])

  const benchedOrEliminatedModalityIds = useMemo(() => {
    const set = new Set<string>()
    benchItems.forEach(b => {
      if (b.status === 'benched' || b.status === 'eliminated') {
        set.add(b.modality_id)
      }
    })
    return set
  }, [benchItems])

  const isTaskMatchingCategoryFilter = (task: DedupedTask): boolean => {
    if (selectedMainCategories.includes('all') || selectedMainCategories.length === 0) return true

    const modalityCat = (task.loose_modality?.category || task.protocol_step?.modality?.category || '').toLowerCase()
    const modalityName = (task.loose_modality?.name || task.protocol_step?.modality?.name || (task as any).name || '').toLowerCase()
    const stepName = ((task.protocol_step as any)?.step_name || task.protocol_step?.instructions || '').toLowerCase()
    const combinedText = `${modalityCat} ${modalityName} ${stepName}`

    return selectedMainCategories.some(cat => {
      const subItems = SUB_CATEGORIES_MAP[cat] || []
      const activeSubIds = selectedSubCategories.filter(id => subItems.some(sub => sub.id === id))

      if (activeSubIds.length === 0) {
        if (cat === 'fitness') return combinedText.includes('fitness') || combinedText.includes('exercise') || combinedText.includes('workout') || combinedText.includes('cardio') || combinedText.includes('strength') || combinedText.includes('sauna') || combinedText.includes('cold')
        if (cat === 'nutrition') return combinedText.includes('nutrition') || combinedText.includes('supplement') || combinedText.includes('fast') || combinedText.includes('food') || combinedText.includes('diet')
        if (cat === 'sleep') return combinedText.includes('sleep') || combinedText.includes('circadian') || combinedText.includes('light') || combinedText.includes('wind down')
        if (cat === 'mind') return combinedText.includes('mind') || combinedText.includes('nervous') || combinedText.includes('breath') || combinedText.includes('meditat') || combinedText.includes('nsdr')
        if (cat === 'other') return combinedText.includes('skin') || combinedText.includes('hair') || combinedText.includes('biomarker') || combinedText.includes('lab')
        return true
      }

      return activeSubIds.some(subId => {
        if (subId === 'cardio') return combinedText.includes('cardio') || combinedText.includes('zone 2') || combinedText.includes('run') || combinedText.includes('walk') || combinedText.includes('hiit')
        if (subId === 'strength') return combinedText.includes('strength') || combinedText.includes('lift') || combinedText.includes('resistance') || combinedText.includes('pushup') || combinedText.includes('squat')
        if (subId === 'flexibility') return combinedText.includes('stretch') || combinedText.includes('flexibility') || combinedText.includes('yoga') || combinedText.includes('mobility')
        if (subId === 'thermal') return combinedText.includes('sauna') || combinedText.includes('cold') || combinedText.includes('plunge') || combinedText.includes('thermal') || combinedText.includes('ice')
        if (subId === 'supplements') return combinedText.includes('supplement') || combinedText.includes('pill') || combinedText.includes('magnesium') || combinedText.includes('creatine') || combinedText.includes('omega') || combinedText.includes('vitamin')
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
      const filtered = taskList.filter(task => {
        const mId = task.modality_id || task.protocol_step?.modality_id || ''
        if (
          task.status === 'contraindicated' ||
          task.status_reason === 'Moved to Bench' ||
          (mId && benchedOrEliminatedModalityIds.has(mId))
        ) {
          return false
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

          if (!matchesProtocol) return false
        }

        const dedupedEquivalent: DedupedTask = {
          ...task,
          timing_slot: task.timing_slot || task.protocol_step?.timing_slot || 'anytime'
        }

        if (!isTaskMatchingCategoryFilter(dedupedEquivalent)) return false

        return true
      })

      result[dKey] = filtered
    })

    return result
  }, [multiDayTasks, benchedOrEliminatedModalityIds, selectedProtocolFilter, selectedMainCategories, selectedSubCategories])

  const { routineTasks, allCompletedTasks, allSnoozedTasks, allSkippedTasks, infrequentTasks } = useMemo(() => {
    const routine: DedupedTask[] = []
    const completedTop: DedupedTask[] = []
    const snoozedTop: DedupedTask[] = []
    const skippedTop: DedupedTask[] = []
    const infrequent: DedupedTask[] = []

    dedupedTasks.forEach(task => {
      if (!isTaskMatchingCategoryFilter(task)) return

      const modality = task.protocol_step?.modality || task.loose_modality
      const cat = modality ? getMacroCategory(modality.category) : 'Other'

      if (cat === 'Diagnostics & Tracking') {
        infrequent.push(task)
        return
      }

      const isCompleted = task.status === 'completed'
      const isRecentlyCompleted = recentlyCompletedIds.has(task.id)
      const isSnoozed = task.status === 'snoozed'
      const isSkipped = task.status === 'skipped' || task.status === 'not_today' || !!task.status_reason

      if (isCompleted) {
        completedTop.push(task)
        if (showCompletedInline || isRecentlyCompleted) {
          routine.push(task)
        }
      } else if (isSnoozed) {
        snoozedTop.push(task)
        if (showSnoozedInline) {
          routine.push(task)
        }
      } else if (isSkipped) {
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
  }, [dedupedTasks, selectedMainCategories, selectedSubCategories, showCompletedInline, showSnoozedInline, showSkippedInline, recentlyCompletedIds])

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
        groupKey = task.timing_slot || task.protocol_step?.timing_slot || 'anytime'
      }
      if (!groups[groupKey]) groups[groupKey] = []
      groups[groupKey].push(task)
    })

    const entries = Object.entries(groups).sort(([groupA], [groupB]) => {
      let idxA = TIME_BLOCKS.indexOf(groupA)
      let idxB = TIME_BLOCKS.indexOf(groupB)
      if (idxA === -1) idxA = 99
      if (idxB === -1) idxB = 99
      return completedSortOrder === 'asc' ? idxA - idxB : idxB - idxA
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

  const chronologicalGroups = useMemo(() => {
    const groups: Record<string, DedupedTask[]> = {}
    routineTasks.forEach(task => {
      const slot = task.timing_slot || task.protocol_step?.timing_slot || 'anytime'

      if (!groups[slot]) groups[slot] = []
      groups[slot].push(task)
    })

    return groups
  }, [routineTasks])

  const sortedChronologicalGroups = Object.entries(chronologicalGroups).sort(([groupA], [groupB]) => {
    const idxA = TIME_BLOCKS.indexOf(groupA)
    const idxB = TIME_BLOCKS.indexOf(groupB)
    if (idxA === -1 && idxB === -1) return groupA.localeCompare(groupB)
    if (idxA === -1) return 1
    if (idxB === -1) return -1
    return idxA - idxB
  })

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
    if (lowerName.includes('metabolic') || lowerName.includes('midday') || lowerName.includes('afternoon') || lowerName.includes('lunch')) return 50
    if (lowerName.includes('standalone') || lowerName.includes('individual')) return 100
    if (lowerName.includes('evening') || lowerName.includes('dinner')) return 150
    if (lowerName.includes('post-meal') || lowerName.includes('post meal') || lowerName.includes('postprandial')) return 170
    if (lowerName.includes('wind down') || lowerName.includes('bedtime') || lowerName.includes('sleep') || lowerName.includes('cortisol')) return 200

    let minIdx = 999
    groupTasks.forEach(task => {
      const slot = (task.timing_slot || task.protocol_step?.timing_slot || task.loose_modality?.default_timing_slot || 'anytime').toLowerCase()
      let idx = TIME_BLOCKS.findIndex(b => slot.includes(b) || b.includes(slot))
      if (idx === -1) {
        if (slot.includes('morning') || slot.includes('wake') || slot.includes('sunlight')) idx = 1
        else if (slot.includes('midday') || slot.includes('afternoon') || slot.includes('lunch')) idx = 4
        else if (slot.includes('evening') || slot.includes('dinner')) idx = 10
        else if (slot.includes('post_meal') || slot.includes('post-meal') || slot.includes('post meal') || slot.includes('postprandial')) idx = 13
        else if (slot.includes('bed') || slot.includes('sleep') || slot.includes('wind_down')) idx = 15
        else idx = 18
      }
      if (idx < minIdx) minIdx = idx
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
    return getScoredLongevityTips(profile, wellbeingCheckin || undefined, tasks, dismissedTipIds)
  }, [profile, wellbeingCheckin, tasks, dismissedTipIds])

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
    if (calendarViewMode === '3day') {
      return `${format(parseISO(threeDates[0]), 'MMM d')} – ${format(parseISO(threeDates[2]), 'MMM d, yyyy')}`
    }
    if (calendarViewMode === 'week') {
      return `${format(parseISO(weekDates[0]), 'MMM d')} – ${format(parseISO(weekDates[6]), 'MMM d, yyyy')}`
    }
    return format(currentDate, 'MMMM yyyy')
  }, [calendarViewMode, currentDate, threeDates, weekDates])

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

  const renderTimelineBlocks = () => {
    return activeGroups.map(([groupName, groupTasks]) => {
      return (
        <div key={groupName} className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                {viewMode === 'chronological' ? formatSlotName(groupName) : groupName}
              </span>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                {groupTasks.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStartGroupTracking(groupName, groupTasks)}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Activity size={13} /> {activeGroupTrackKey === groupName ? 'Close Tracking' : 'Track Group'}
              </button>
              <button
                type="button"
                onClick={() => handleCompleteGroup(groupName, groupTasks)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Check size={13} /> Complete All
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

          {/* Modality Task Cards */}
          <div className="space-y-3">
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
                    onSaveCustomOutcomes={handleSaveCustomOutcomes}
                    onOutcomesSaved={handleOutcomesSaved}
                    outcomesRefreshKey={outcomesRefreshKey}
                    onOpenRescheduleModal={handleOpenRescheduleModal}
                    completionMode={completionMode}
                  />
                )
              })}
          </div>
        </div>
      )
    })
  }

  if (loading && !profile) {
    return (
      <div className="flex h-screen items-center justify-center animate-pulse text-levl-text-secondary">
        Loading your stack...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
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

      {/* Main Container */}
      <div className={`mx-auto px-4 sm:px-6 pt-4 sm:pt-6 ${calendarViewMode === 'today' ? 'max-w-4xl' : 'max-w-7xl'}`}>
        
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

        {/* Daily Longevity Tip Banner */}
        <DailyLongevityTipBanner 
          scoredTips={scoredTips}
          onAddToToday={async (modalityId: string) => {
            if (profile) {
              await createDailyTask(profile.local_user_id, dateStr, modalityId)
              await refreshTodayTasks()
            }
          }}
          onDismiss={(tipId: string) => setDismissedTipIds(prev => [...prev, tipId])}
        />

        {/* Daily Wellbeing Check-in */}
        <div className="my-4">
          <DailyWellbeingCheckin 
            onSave={handleWellbeingSave} 
            initialData={wellbeingCheckin}
            profile={profile}
            allOutcomes={allOutcomes}
            date={currentDate}
            isCurrentDay={isCurrentDay}
            isCollapsedByDefault={isPastDate}
          />
        </div>

        {/* Daily Historical Debrief Header & Snapshot when viewing past dates */}
        {isPastDate && (
          <div className="my-6">
            <DailyHistoricalDebriefHeader
              summary={dailyEfficacySummary}
              tasks={tasks}
              selectedIsolatedOutcome={selectedIsolatedOutcome}
              onSelectIsolatedOutcome={setSelectedIsolatedOutcome}
            />
          </div>
        )}

        {/* Top View Selector Navigation Bar & Dynamic Date Header */}
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
        />

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
            onSelectDate={(dStr: string) => router.push(`/today?date=${dStr}`)}
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
            onSelectDate={(dStr: string) => router.push(`/today?date=${dStr}`)}
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
            onSelectDate={(dStr: string) => router.push(`/today?date=${dStr}`)}
            onMoveToBench={handleMoveToBench}
            onEliminateEntirely={handleEliminateEntirely}
          />
        )}

        {/* Primary Timeline & Today Section */}
        {calendarViewMode === 'today' && (
          <>
            {/* Primary Timeline Header Toolbar */}
            <div className="flex items-center justify-between w-full my-4 px-1 gap-2">
              <button 
                type="button"
                onClick={() => navigateToDate(subDays(currentDate, 1))}
                className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
                aria-label="Previous day"
                title="Previous day (Yesterday)"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex items-center gap-2.5 sm:gap-3 text-center flex-wrap justify-center">
                {!isCurrentDay && (
                  <button 
                    type="button"
                    onClick={() => navigateToDate(new Date())}
                    className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-800/80 text-emerald-300 hover:text-emerald-200 font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
                  >
                    Jump to Today
                  </button>
                )}

                <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  {format(currentDate, 'EEEE, MMM d, yyyy')}
                </span>

                {dedupedTasks.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                    {progressPercent}% Complete
                  </span>
                )}
              </div>

              <button 
                type="button"
                onClick={() => navigateToDate(addDays(currentDate, 1))}
                className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
                aria-label="Next day"
                title="Next day (Tomorrow)"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Completed Modalities Section */}
            {allCompletedTasks.length > 0 && (
              <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-950/20 overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all duration-300">
                <div className="w-full flex items-center justify-between p-3.5 bg-emerald-500/10 border-b border-emerald-500/20">
                  <button 
                    type="button"
                    onClick={() => setIsCompletedSectionExpanded(!isCompletedSectionExpanded)}
                    className="flex items-center gap-2.5 cursor-pointer flex-1 text-left"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)] shrink-0">
                      <Check size={13} strokeWidth={3} />
                    </div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Completed Modalities
                    </h2>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold shrink-0">
                      {allCompletedTasks.length}
                    </span>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsCompletedSectionExpanded(!isCompletedSectionExpanded)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium px-2 py-1 cursor-pointer"
                    >
                      <span>{isCompletedSectionExpanded ? 'Hide' : 'Show All'}</span>
                      {isCompletedSectionExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {isCompletedSectionExpanded && (
                  <div className="p-4 space-y-4 bg-black/40 animate-in fade-in slide-in-from-top-2">
                    {sortedCompletedGroups.map(([groupKey, tasksInGroup]) => (
                      <div key={groupKey} className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-white/10 pb-1">
                          <span>{completedSortBy === 'chronological' ? (viewMode === 'chronological' ? formatSlotName(groupKey) : groupKey) : 'Completed Log'}</span>
                          <span className="text-[10px] text-gray-500 font-normal">({tasksInGroup.length})</span>
                        </div>
                        <div className="space-y-3 pt-1">
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
                                onSaveCustomOutcomes={handleSaveCustomOutcomes}
                                onOutcomesSaved={handleOutcomesSaved}
                                outcomesRefreshKey={outcomesRefreshKey}
                                completionMode={completionMode}
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
              <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-950/20 overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all duration-300">
                <div className="w-full flex items-center justify-between p-3.5 bg-amber-500/10 border-b border-amber-500/20">
                  <button 
                    type="button"
                    onClick={() => setIsSnoozedSectionExpanded(!isSnoozedSectionExpanded)}
                    className="flex items-center gap-2.5 cursor-pointer flex-1 text-left"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)] shrink-0">
                      <Clock size={13} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Snoozed Modalities
                    </h2>
                    <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold shrink-0">
                      {allSnoozedTasks.length}
                    </span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setIsSnoozedSectionExpanded(!isSnoozedSectionExpanded)}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium px-2 py-1 cursor-pointer"
                  >
                    <span>{isSnoozedSectionExpanded ? 'Hide' : 'Show All'}</span>
                    {isSnoozedSectionExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {isSnoozedSectionExpanded && (
                  <div className="p-4 space-y-3 bg-black/40 animate-in fade-in slide-in-from-top-2">
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
                          onSaveCustomOutcomes={handleSaveCustomOutcomes}
                          onOutcomesSaved={handleOutcomesSaved}
                          outcomesRefreshKey={outcomesRefreshKey}
                          completionMode={completionMode}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Skipped Modalities Section */}
            {allSkippedTasks.length > 0 && (
              <div className="mb-6 rounded-xl border border-slate-500/30 bg-slate-950/20 overflow-hidden shadow-[0_0_20px_rgba(148,163,184,0.1)] transition-all duration-300">
                <div className="w-full flex items-center justify-between p-3.5 bg-slate-500/10 border-b border-slate-500/20">
                  <button 
                    type="button"
                    onClick={() => setIsSkippedSectionExpanded(!isSkippedSectionExpanded)}
                    className="flex items-center gap-2.5 cursor-pointer flex-1 text-left"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-500/20 border border-slate-500/40 text-slate-400 flex items-center justify-center font-bold shadow-[0_0_8px_rgba(148,163,184,0.3)] shrink-0">
                      <Slash size={13} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Skipped & Satisfied Modalities
                    </h2>
                    <span className="text-xs bg-slate-500/20 text-slate-300 border border-slate-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold shrink-0">
                      {allSkippedTasks.length}
                    </span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setIsSkippedSectionExpanded(!isSkippedSectionExpanded)}
                    className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1 font-medium px-2 py-1 cursor-pointer"
                  >
                    <span>{isSkippedSectionExpanded ? 'Hide' : 'Show All'}</span>
                    {isSkippedSectionExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {isSkippedSectionExpanded && (
                  <div className="p-4 space-y-3 bg-black/40 animate-in fade-in slide-in-from-top-2">
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
                          onSaveCustomOutcomes={handleSaveCustomOutcomes}
                          onOutcomesSaved={handleOutcomesSaved}
                          outcomesRefreshKey={outcomesRefreshKey}
                          completionMode={completionMode}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )}

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

            {/* Timeline Layout Mode Toggle Bar */}
            <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl mb-4 backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider pl-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" /> Timeline Layout:
                </span>
              </div>

              <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('chronological')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'chronological'
                      ? 'bg-purple-600 text-white shadow-md border border-purple-400/30 font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock size={13} />
                  <span>Time Blocks</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('protocol')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'protocol'
                      ? 'bg-purple-600 text-white shadow-md border border-purple-400/30 font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ListOrdered size={13} />
                  <span>Protocols</span>
                </button>
              </div>
            </div>

            {/* Main Daily Timeline / Uncompleted Modalities */}
            {isPastDate ? (
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
                    <div className="p-4 space-y-8 bg-black/40 animate-in fade-in slide-in-from-top-2">
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
                      <p className="font-bold text-white text-base">You don't have any protocols scheduled for today.</p>
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
                  renderTimelineBlocks()
                )}
              </div>
            )}

            {/* Next Best Action (Momentum UI) */}
            {topRecommendation && progressPercent >= 70 && (
              <div className="mt-8 pt-8 border-t border-white/5">
                <details className="group glass-card rounded-xl border border-white/5 overflow-hidden">
                  <summary className="p-4 cursor-pointer list-none flex items-center justify-between">
                    <div className="flex flex-col">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles size={20} className="text-levl-accent" />
                        Next Best Action
                      </h2>
                      <p className="text-sm text-levl-text-secondary mt-1 group-open:hidden">
                        You've crushed your habits today! Keep up the momentum...
                      </p>
                      <p className="text-sm text-levl-text-secondary mt-1 hidden group-open:block">
                        Based on your goals, this is the #1 next best action you can take.
                      </p>
                    </div>
                    <div className="text-white/50 group-open:rotate-180 transition-transform">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </summary>
                  
                  <div className="p-4 pt-0 border-t border-white/5 mt-4">
                    <ExploreCard 
                      modality={topRecommendation}
                      userProfile={profile}
                      onAddToBench={async (id) => {
                        const localUserId = getLocalUserId()
                        const { addToBench } = await import('@/lib/data')
                        await addToBench(localUserId, id)
                        setTopRecommendation(null)
                      }}
                      onAddToToday={async (id) => {
                        const localUserId = getLocalUserId()
                        await createDailyTask(localUserId, dateStr, id)
                        setTopRecommendation(null)
                        await refreshTodayTasks()
                      }}
                    />
                  </div>
                </details>
              </div>
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
"""

with open('app/today/page.tsx', 'w') as f:
    f.write(today_code)

print('Updated app/today/page.tsx!')
