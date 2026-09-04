'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { 
  getProtocolByIdWithSteps, 
  getDailyProtocolTasks, 
  getBenchItems, 
  getOrCreateUserProfile,
  updateDailyTaskStatus,
  moveModalityToBench,
  addProtocolToToday,
  getProtocolsWithSteps,
  getOutcomeDimensions,
  saveOutcomeObservation,
  getTaskOutcomeObservations,
  getDailyWellbeingHistory,
  benchEntireProtocol,
  eliminateEntireProtocol
} from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { DailyProtocolTask, UserProfile, OutcomeDimension, DailyWellbeingCheckin } from '@/lib/types'
import { format, subDays } from 'date-fns'
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Layers, 
  ShieldCheck, 
  Activity, 
  Plus, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Info, 
  AlertCircle,
  Zap,
  Target,
  Sliders,
  Archive,
  Trash2,
  X,
  ExternalLink,
  BookOpen,
  Calendar,
  ChevronRight
} from 'lucide-react'
import { ExpandedModalityDetailBanner } from '@/components/views/ExpandedModalityDetailBanner'
import { DosageDetailModal } from '@/components/modals/DosageDetailModal'
import ManageTaskModal from '@/components/modals/ManageTaskModal'
import ScheduleModalityModal from '@/components/modals/ScheduleModalityModal'
import CustomizeModalityOutcomesModal from '@/components/modals/CustomizeModalityOutcomesModal'
import PeptideEffectivenessCard from '@/components/peptides/PeptideEffectivenessCard'
import { getOutcomeColorConfig, getNeutralOutcomeColorConfig } from '@/lib/utils/outcomeColors'
import { 
  getSkinCyclePhaseForDate, 
  SKIN_CYCLE_PHASES, 
  SkinCyclePhase 
} from '@/lib/calendar/skinCyclingEngine'

const formatSlotName = (str: string) => {
  if (!str) return 'Daily'
  return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const getPhaseIcon = (timingSlot: string) => {
  const slot = (timingSlot || '').toLowerCase()
  if (slot.includes('wake') || slot.includes('morning') || slot.includes('sunrise') || slot.includes('fasted')) return '🌅'
  if (slot.includes('afternoon') || slot.includes('midday') || slot.includes('meal') || slot.includes('workout')) return '☀️'
  if (slot.includes('evening') || slot.includes('sunset') || slot.includes('wind_down')) return '🌙'
  if (slot.includes('bed') || slot.includes('night') || slot.includes('sleep')) return '🛌'
  return '⚡'
}

const PROTOCOL_BENCH_REASONS = [
  'Currently on a break / cycling off',
  'Traveling / limited hardware or gear',
  'Want to test other protocols first',
  'Too many active daily tasks right now',
  'Financial / supplement refill timing',
  'Seasonal adjustment'
]

const PROTOCOL_ELIMINATION_REASONS = [
  'Experiencing adverse effects / side effects',
  'Medical / prescription contraindication',
  'Did not feel noticeable benefits',
  'Too time intensive / complex daily routine',
  'Dislike modality taste / texture / delivery method',
  'Replaced by an improved alternative'
]

function getOutcomesForModality(modality: any, allOutcomes: OutcomeDimension[]): OutcomeDimension[] {
  if (!allOutcomes || allOutcomes.length === 0) return []
  const modOutcomeKeys = modality?.functional_outcomes_to_track || modality?.secondary_outcomes || []
  if (modOutcomeKeys.length > 0) {
    const matched = allOutcomes.filter(o => modOutcomeKeys.includes(o.id) || modOutcomeKeys.includes(o.name))
    if (matched.length > 0) return matched.slice(0, 5)
  }
  return allOutcomes.filter(o => o.is_default_wellbeing).slice(0, 4)
}

export default function ProtocolFocusPage() {
  const { localUserId: authUserId, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const rawId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || ''
  const protocolId = decodeURIComponent(rawId)

  const [protocol, setProtocol] = useState<any | null>(null)
  const [todayTasks, setTodayTasks] = useState<DailyProtocolTask[]>([])
  const [benchItems, setBenchItems] = useState<any[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [allOutcomes, setAllOutcomes] = useState<OutcomeDimension[]>([])
  const [checkins, setCheckins] = useState<DailyWellbeingCheckin[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [mounted, setMounted] = useState(false)

  // Collapsible view toggles (Collapsed by default so modalities are prominent)
  const [isRationaleExpanded, setIsRationaleExpanded] = useState<boolean>(false)
  const [isTimelineExpanded, setIsTimelineExpanded] = useState<boolean>(false)

  // Protocol-Level Action Modal (Bench or Eliminate Entire Protocol)
  const [actionModalType, setActionModalType] = useState<'bench' | 'eliminate' | null>(null)
  const [selectedEliminationReasons, setSelectedEliminationReasons] = useState<string[]>([])
  const [eliminateReason, setEliminateReason] = useState<string>('')
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false)

  // Modality Level States
  const [expandedModalityId, setExpandedModalityId] = useState<string | null>(null)
  const [dosageModalModality, setDosageModalModality] = useState<any | null>(null)
  const [scheduleModalModality, setScheduleModalModality] = useState<any | null>(null)

  // Customize Outcomes Modal state
  const [customizeOutcomesModality, setCustomizeOutcomesModality] = useState<any | null>(null)
  const [customOutcomesMap, setCustomOutcomesMap] = useState<Record<string, string[]>>({})

  // INLINE outcome tracking state
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)
  const [activeOutcomePhase, setActiveOutcomePhase] = useState<'pre' | 'post'>('post')
  
  // Stored observations
  const [preValues, setPreValues] = useState<Record<string, number>>({})
  const [postValues, setPostValues] = useState<Record<string, number>>({})
  const [touchedPre, setTouchedPre] = useState<Record<string, boolean>>({})
  const [touchedPost, setTouchedPost] = useState<Record<string, boolean>>({})
  const [outcomeNotes, setOutcomeNotes] = useState<string>('')
  const [isSavingOutcomes, setIsSavingOutcomes] = useState<boolean>(false)
  const [completionToast, setCompletionToast] = useState<{ id: string; name: string } | null>(null)

  // 4-Day Dermatological Skin Cycling & Referral Acquisition state
  const todaySkinPhase = useMemo(() => getSkinCyclePhaseForDate(new Date()), [])
  const [selectedSkinCycleTab, setSelectedSkinCycleTab] = useState<number>(todaySkinPhase.dayNumber)
  const [referralSource, setReferralSource] = useState<string | null>(null)
  const [influencerName, setInfluencerName] = useState<string | null>(null)

  const currentDateStr = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const ref = urlParams.get('ref')
      const inf = urlParams.get('influencer')
      if (ref) {
        setReferralSource(ref)
        try { localStorage.setItem('levl_referral_source', ref) } catch (e) {}
      } else {
        try {
          const storedRef = localStorage.getItem('levl_referral_source')
          if (storedRef) setReferralSource(storedRef)
        } catch (e) {}
      }
      if (inf) {
        setInfluencerName(inf)
        try { localStorage.setItem('levl_referral_influencer', inf) } catch (e) {}
      } else {
        try {
          const storedInf = localStorage.getItem('levl_referral_influencer')
          if (storedInf) setInfluencerName(storedInf)
        } catch (e) {}
      }
    }
  }, [])

  const reloadData = async () => {
    const localUserId = authUserId || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '') || getLocalUserId()
    const [tasks, bench] = await Promise.all([
      getDailyProtocolTasks(localUserId, currentDateStr),
      getBenchItems(localUserId)
    ])
    setTodayTasks(tasks)
    setBenchItems(bench)
  }

  useEffect(() => {
    if (authLoading) return

    async function loadData() {
      setIsLoading(true)
      const localUserId = authUserId || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '') || getLocalUserId()

      // 1. Fetch protocol with joined steps
      let protoData = await getProtocolByIdWithSteps(protocolId)
      if (!protoData) {
        const allProtos = await getProtocolsWithSteps()
        protoData = allProtos.find(p => 
          p.id === protocolId || 
          (p.name && p.name.toLowerCase() === protocolId.toLowerCase()) ||
          (p.slug && p.slug.toLowerCase() === protocolId.toLowerCase())
        )
      }
      setProtocol(protoData)

      // 2. Fetch today tasks, bench items, profile, outcome dimensions & 90-day checkin history
      const [tasks, bench, userProf, outcomes, checkinHistory] = await Promise.all([
        getDailyProtocolTasks(localUserId, currentDateStr),
        getBenchItems(localUserId),
        getOrCreateUserProfile(localUserId),
        getOutcomeDimensions(),
        getDailyWellbeingHistory(localUserId, format(subDays(new Date(), 90), 'yyyy-MM-dd'), currentDateStr)
      ])

      setTodayTasks(tasks)
      setBenchItems(bench)
      setProfile(userProf)
      setAllOutcomes(outcomes)
      setCheckins(checkinHistory || [])
      setIsLoading(false)
    }

    if (protocolId) {
      loadData()
    }

    const handleAuthChange = () => {
      if (protocolId) loadData()
    }
    window.addEventListener('levl_auth_user_changed', handleAuthChange)
    return () => {
      window.removeEventListener('levl_auth_user_changed', handleAuthChange)
    }
  }, [protocolId, authLoading, authUserId])

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const localUserId = getLocalUserId()
    await updateDailyTaskStatus(taskId, newStatus as any)
    const updatedTasks = await getDailyProtocolTasks(localUserId, currentDateStr)
    setTodayTasks(updatedTasks)
  }

  const handleStartInlineCompletion = async (step: any, modality: any, todayTask?: DailyProtocolTask, initialPhase: 'pre' | 'post' = 'post') => {
    const localUserId = getLocalUserId()
    let taskId = todayTask?.id

    if (!taskId) {
      if (protocol?.id) {
        await addProtocolToToday(localUserId, currentDateStr, protocol.id)
      }
      const updatedTasks = await getDailyProtocolTasks(localUserId, currentDateStr)
      setTodayTasks(updatedTasks)
      const realTask = updatedTasks.find(t => t.modality_id === (modality.id || step.modality_id) || t.protocol_step_id === step.id)
      if (realTask) taskId = realTask.id
    }

    if (!taskId) return

    setExpandedModalityId(modality.id || step.id)
    setCompletingTaskId(taskId)
    setActiveOutcomePhase(initialPhase)
    setOutcomeNotes('')

    // Fetch existing baseline observations for this task if present
    try {
      const existingObs = await getTaskOutcomeObservations(localUserId, taskId)
      const initPre: Record<string, number> = {}
      const initPost: Record<string, number> = {}
      const initTouchedPre: Record<string, boolean> = {}
      const initTouchedPost: Record<string, boolean> = {}

      existingObs.forEach(obs => {
        if (obs.phase === 'pre') {
          initPre[obs.outcome_id] = obs.value_0_10
          initTouchedPre[obs.outcome_id] = true
        } else if (obs.phase === 'post') {
          initPost[obs.outcome_id] = obs.value_0_10
          initTouchedPost[obs.outcome_id] = true
        }
      })

      setPreValues(initPre)
      setPostValues(initPost)
      setTouchedPre(initTouchedPre)
      setTouchedPost(initTouchedPost)
    } catch (e) {
      console.warn('Could not fetch existing observations:', e)
    }
  }

  const handleSaveInlineOutcomes = async (todayTask: any, step: any, modality: any) => {
    setIsSavingOutcomes(true)
    const localUserId = getLocalUserId()
    let taskId = todayTask?.id || completingTaskId

    if (!taskId) {
      setIsSavingOutcomes(false)
      return
    }

    const modOutcomes = getTrackedOutcomes(modality)
    const promises: Promise<any>[] = []

    if (activeOutcomePhase === 'pre') {
      modOutcomes.forEach(outcome => {
        if (touchedPre[outcome.id] && preValues[outcome.id] !== undefined) {
          promises.push(
            saveOutcomeObservation(
              localUserId,
              outcome.id,
              'pre',
              preValues[outcome.id],
              currentDateStr,
              taskId,
              undefined,
              outcomeNotes || undefined
            )
          )
        }
      })
      if (promises.length > 0) await Promise.all(promises)
      setIsSavingOutcomes(false)
      setCompletingTaskId(null)
      return
    }

    await updateDailyTaskStatus(taskId, 'completed', undefined, undefined, format(new Date(), 'yyyy-MM-dd HH:mm:ss'))
    const updatedTasks = await getDailyProtocolTasks(localUserId, currentDateStr)
    setTodayTasks(updatedTasks)

    modOutcomes.forEach(outcome => {
      if (touchedPost[outcome.id] && postValues[outcome.id] !== undefined) {
        promises.push(
          saveOutcomeObservation(
            localUserId,
            outcome.id,
            'post',
            postValues[outcome.id],
            currentDateStr,
            taskId,
            undefined,
            outcomeNotes || undefined
          )
        )
      }
    })

    if (promises.length > 0) {
      await Promise.all(promises)
    }

    setIsSavingOutcomes(false)
    setCompletingTaskId(null)
    setCompletionToast({ id: taskId, name: modality?.name || modality?.display_name || 'Modality' })
  }

  const getTrackedOutcomes = (modality: any): OutcomeDimension[] => {
    const customList = customOutcomesMap[modality.id]
    if (customList && customList.length > 0) {
      return allOutcomes.filter(o => customList.includes(o.id))
    }
    return getOutcomesForModality(modality, allOutcomes)
  }

  const handleAddToToday = async (modalityId: string) => {
    const localUserId = getLocalUserId()
    if (protocol?.id) {
      await addProtocolToToday(localUserId, currentDateStr, protocol.id)
    }
    const updatedTasks = await getDailyProtocolTasks(localUserId, currentDateStr)
    setTodayTasks(updatedTasks)
  }

  const handleMoveToBench = async (modalityId: string) => {
    const localUserId = getLocalUserId()
    await moveModalityToBench(localUserId, modalityId)
    const updatedBench = await getBenchItems(localUserId)
    setBenchItems(updatedBench)
  }

  const toggleEliminationReason = (label: string) => {
    setSelectedEliminationReasons(prev =>
      prev.includes(label) ? prev.filter(r => r !== label) : [...prev, label]
    )
  }

  // Protocol-Level Actions: Add All, Bench Entire Protocol, Eliminate Entire Protocol
  const handleAddEntireProtocolToToday = async () => {
    if (!protocol) return
    setIsProcessingAction(true)
    const localUserId = getLocalUserId()
    await addProtocolToToday(localUserId, currentDateStr, protocol.id)
    await reloadData()
    setIsProcessingAction(false)
  }

  const handleInstantKickstart = async () => {
    if (!protocol) return
    setIsProcessingAction(true)
    const localUserId = getLocalUserId()
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('levl_guest_instant_kickstart', 'true')
        localStorage.setItem('levl_active_protocol', protocol.name || protocol.id)
        if (referralSource) localStorage.setItem('levl_referral_source', referralSource)
        if (influencerName) localStorage.setItem('levl_referral_influencer', influencerName)
      } catch (e) {}
    }
    await addProtocolToToday(localUserId, currentDateStr, protocol.id)
    router.push('/today')
  }

  const handleConfirmProtocolAction = async () => {
    if (!protocol) return
    setIsProcessingAction(true)
    const localUserId = getLocalUserId()
    const modalityIds = (protocol.steps || protocol.protocol_steps || [])
      .map((s: any) => s.modality_id || s.modality?.id)
      .filter(Boolean)

    if (actionModalType === 'eliminate') {
      await eliminateEntireProtocol(
        localUserId,
        protocol.id,
        modalityIds,
        eliminateReason || 'User eliminated entire protocol',
        selectedEliminationReasons
      )
    } else if (actionModalType === 'bench') {
      await benchEntireProtocol(
        localUserId,
        protocol.id,
        modalityIds,
        eliminateReason || 'Moved Entire Protocol to Bench',
        selectedEliminationReasons
      )
    }

    await reloadData()
    setIsProcessingAction(false)
    setActionModalType(null)
    setEliminateReason('')
    setSelectedEliminationReasons([])
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-purple-400 animate-pulse font-mono text-sm">
          <Activity size={20} className="animate-spin" />
          <span>Loading Protocol Focus Details...</span>
        </div>
      </div>
    )
  }

  if (!protocol) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center space-y-4">
        <AlertCircle size={40} className="text-amber-400" />
        <h1 className="text-xl font-bold text-white">Protocol Not Found</h1>
        <p className="text-sm text-slate-400 text-center max-w-md">
          Could not locate details for protocol identifier <code className="text-purple-300 bg-slate-900 px-2 py-0.5 rounded font-mono">{protocolId}</code>.
        </p>
        <Link
          href="/today"
          className="mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <ArrowLeft size={16} /> Return to Today View
        </Link>
      </div>
    )
  }

  const steps = protocol.steps || protocol.protocol_steps || []
  const benchedModalityIds = new Set(benchItems.map(b => b.modality_id))
  
  // Categorize steps by user enrollment status
  const evaluatedSteps = steps.map((step: any) => {
    const mod = step.modality || {}
    const mId = step.modality_id || mod.id
    
    // Check if task scheduled for today
    const todayTask = todayTasks.find(t => 
      t.modality_id === mId || 
      t.protocol_step_id === step.id ||
      t.protocol_step?.modality_id === mId ||
      (t.loose_modality && t.loose_modality.id === mId)
    )

    const isBenched = mId && benchedModalityIds.has(mId)
    const isCompleted = todayTask?.status === 'completed'
    const isPendingToday = todayTask && todayTask.status !== 'completed'

    let statusType: 'completed' | 'pending' | 'benched' | 'not_enrolled' = 'not_enrolled'
    if (isCompleted) statusType = 'completed'
    else if (isPendingToday) statusType = 'pending'
    else if (isBenched) statusType = 'benched'

    return {
      step,
      modality: mod,
      modalityId: mId,
      todayTask,
      statusType
    }
  })

  const activeCount = evaluatedSteps.filter((s: any) => s.statusType === 'completed' || s.statusType === 'pending').length
  const completedCount = evaluatedSteps.filter((s: any) => s.statusType === 'completed').length
  const benchedCount = evaluatedSteps.filter((s: any) => s.statusType === 'benched').length
  const notEnrolledCount = evaluatedSteps.filter((s: any) => s.statusType === 'not_enrolled').length
  const isEntirelyActive = evaluatedSteps.length > 0 && activeCount === evaluatedSteps.length

  const authorName = protocol.source_label || protocol.author_name || protocol.name || 'Protocol'
  const isBryanJohnson = authorName.toLowerCase().includes('blueprint') || authorName.toLowerCase().includes('bryan johnson')
  const isPatrick = authorName.toLowerCase().includes('patrick') || authorName.toLowerCase().includes('rhonda')
  const isAttia = authorName.toLowerCase().includes('attia') || authorName.toLowerCase().includes('peter')
  const isHuberman = authorName.toLowerCase().includes('huberman')

  let authorBadgeBgClass = 'bg-purple-950/80 border-purple-500/50 text-purple-300'
  if (isPatrick) {
    authorBadgeBgClass = 'bg-pink-950/80 border-pink-500/50 text-pink-300'
  } else if (isAttia) {
    authorBadgeBgClass = 'bg-blue-950/80 border-blue-500/50 text-blue-300'
  } else if (isHuberman) {
    authorBadgeBgClass = 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 selection:bg-purple-500/30">
      
      {/* Top Header Toolbar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 sm:px-6">
        <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 cursor-pointer active:scale-95"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full border text-[11px] font-bold font-mono ${authorBadgeBgClass}`}>
              {authorName}
            </span>
          </div>
        </div>
      </header>

      {/* Main Focus Container */}
      <main className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 py-5 sm:px-6 space-y-5">

        {/* Inbound Referral Attribution Banner */}
        {referralSource && (
          <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/40 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300 flex items-center justify-center shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-300 font-medium">Curated via</span>
                  <strong className="text-purple-300 font-bold capitalize">
                    {referralSource === 'longevityreviews' ? 'LongevityReviews.org' : referralSource.replace(/_/g, ' ')}
                  </strong>
                  {influencerName && (
                    <>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300">Shared by <strong className="text-teal-300">@{influencerName}</strong></span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  Zero signup friction: Try this protocol instantly on your live calendar feed.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleInstantKickstart}
              disabled={isProcessingAction}
              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-teal-500 hover:from-purple-500 hover:to-teal-400 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>Instant Launch</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* COMPACT HERO PROTOCOL FOCUS CARD */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/40 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Row: Title & Primary Metadata Pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={14} /> Protocol Deep Dive
              </div>

              {/* Modality Count Chip */}
              <span className="text-[11px] font-mono font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                {evaluatedSteps.length} Modalities
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {protocol.name}
            </h1>
          </div>

          {/* PROTOCOL-LEVEL QUICK ACTIONS BAR (Easy to Add, Bench, or Eliminate Entire Protocol) */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap pt-1 border-t border-white/5">
            {/* 1-Click Instant Kickstart Button */}
            <button
              type="button"
              onClick={handleInstantKickstart}
              disabled={isProcessingAction}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 hover:from-purple-500 hover:to-teal-400 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-purple-900/40 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Zap size={14} className="text-amber-300" />
              <span>Start Tracking Free (1-Click)</span>
            </button>

            {isEntirelyActive ? (
              <button
                type="button"
                onClick={() => router.push(`/today?protocol=${encodeURIComponent(protocol.id || protocol.name)}&name=${encodeURIComponent(protocol.name)}`)}
                className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.15)] cursor-pointer active:scale-95 transition-all"
                title="View protocol in Today"
              >
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Added to today</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAddEntireProtocolToToday}
                disabled={isProcessingAction}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Plus size={14} strokeWidth={3} />
                <span>Add to Today</span>
              </button>
            )}

            {/* Bench Entire Protocol */}
            <button
              type="button"
              onClick={() => {
                setEliminateReason('')
                setSelectedEliminationReasons([])
                setActionModalType('bench')
              }}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-amber-950/50 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
              title="Pause all modalities in this protocol and store on bench"
            >
              <Archive size={14} />
              <span>Bench Entire Protocol</span>
            </button>

            {/* Eliminate Entire Protocol */}
            <button
              type="button"
              onClick={() => {
                setEliminateReason('')
                setSelectedEliminationReasons([])
                setActionModalType('eliminate')
              }}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 ml-auto sm:ml-0"
              title="Eliminate and remove all modalities from this protocol"
            >
              <Trash2 size={14} />
              <span>Eliminate Entire Protocol</span>
            </button>
          </div>

          {/* COMPACT SEGMENTED PROGRESS STRIP */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <Layers size={13} className="text-purple-400" />
                <span>Enrollment Status:</span>
              </span>
              <div className="flex items-center gap-3 text-slate-400">
                <span className="text-emerald-400 font-bold">{completedCount} Done</span>
                <span>•</span>
                <span className="text-blue-400 font-bold">{activeCount - completedCount} Active</span>
                <span>•</span>
                <span className="text-amber-400 font-bold">{benchedCount} Benched</span>
                <span>•</span>
                <span className="text-slate-400">{notEnrolledCount} Not Saved</span>
              </div>
            </div>

            {/* Visual Mini Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
              <div 
                className="bg-emerald-500 transition-all duration-300"
                style={{ width: `${evaluatedSteps.length ? (completedCount / evaluatedSteps.length) * 100 : 0}%` }}
                title={`${completedCount} Completed`}
              />
              <div 
                className="bg-blue-500 transition-all duration-300"
                style={{ width: `${evaluatedSteps.length ? ((activeCount - completedCount) / evaluatedSteps.length) * 100 : 0}%` }}
                title={`${activeCount - completedCount} Active Today`}
              />
              <div 
                className="bg-amber-500 transition-all duration-300"
                style={{ width: `${evaluatedSteps.length ? (benchedCount / evaluatedSteps.length) * 100 : 0}%` }}
                title={`${benchedCount} on Bench`}
              />
            </div>
          </div>

          {/* COLLAPSIBLE PROTOCOL DETAILS & SCIENTIFIC RATIONALE (Collapsed by Default) */}
          <div className="border border-purple-500/20 bg-purple-950/10 rounded-2xl overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsRationaleExpanded(!isRationaleExpanded)}
              className="w-full flex items-center justify-between p-3.5 text-left hover:bg-purple-950/30 transition-colors cursor-pointer text-xs font-bold text-purple-300"
            >
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-purple-400" />
                <span>Protocol Details &amp; Scientific Rationale</span>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-purple-400">
                <span>{isRationaleExpanded ? 'Hide Details' : 'View Details'}</span>
                {isRationaleExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {isRationaleExpanded && (
              <div className="p-4 border-t border-purple-500/20 space-y-4 bg-slate-950/80 text-xs sm:text-sm animate-in fade-in">
                {protocol.description && (
                  <p className="text-slate-300 leading-relaxed">
                    {protocol.description}
                  </p>
                )}

                {/* Metadata Badges */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {protocol.primary_goal && (
                    <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl flex items-center gap-1.5 text-teal-300">
                      <Target size={13} className="text-teal-400" />
                      <span>Goal: {protocol.primary_goal}</span>
                    </div>
                  )}
                  {protocol.difficulty_level && (
                    <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl flex items-center gap-1.5 text-amber-300">
                      <Zap size={13} className="text-amber-400" />
                      <span>Difficulty: {protocol.difficulty_level}</span>
                    </div>
                  )}
                  {protocol.evidence_level && (
                    <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl flex items-center gap-1.5 text-blue-300">
                      <ShieldCheck size={13} className="text-blue-400" />
                      <span>Evidence: {protocol.evidence_level}</span>
                    </div>
                  )}
                </div>

                {/* Scientific Rationale */}
                <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200 space-y-1">
                  <strong className="text-purple-300 font-bold block">Target Biological Mechanism &amp; Rationale:</strong>
                  <p className="leading-relaxed">
                    {protocol.rationale || protocol.notes || `Prescribed protocol stack authored by ${authorName}. Designed to extend longevity healthspan through target biological pathway modulation.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* INTERACTIVE 4-DAY DERMATOLOGICAL SKIN CYCLING MATRIX */}
        {(protocol.id === 'cellular_dermal_matrix' || protocol.slug === 'cellular-dermal-matrix' || protocol.name?.toLowerCase().includes('dermal matrix') || protocol.name?.toLowerCase().includes('skin cycling')) && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
            {/* Header & Dynamic Today Indicator */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="p-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold font-mono">
                    🧬 Dynamic Rotation Engine
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    Today is Day {todaySkinPhase.dayNumber} ({todaySkinPhase.name})
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight pt-1">
                  4-Night Dermatological Skin Cycling Matrix
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  Separates potent actives across a repeating 4-night circadian cycle. Prevents chemical deactivation between low-pH acids and GHK-Cu copper peptides while accelerating cellular turnover.
                </p>
              </div>

              <div className="text-right hidden sm:block">
                <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Cadence</span>
                <span className="text-xs font-bold text-teal-300">Continuous 4-Day Loop</span>
              </div>
            </div>

            {/* 4 Clickable Day Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {SKIN_CYCLE_PHASES.map((phase) => {
                const isSelected = selectedSkinCycleTab === phase.dayNumber
                const isToday = todaySkinPhase.dayNumber === phase.dayNumber
                return (
                  <button
                    key={phase.dayNumber}
                    type="button"
                    onClick={() => setSelectedSkinCycleTab(phase.dayNumber)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? `bg-slate-800/90 ${phase.colorBorder} ${phase.colorGlow} ring-1 ring-white/10`
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    {isToday && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-emerald-500 text-slate-950 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-sm">
                          Today
                        </span>
                      </div>
                    )}
                    <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                      Night {phase.dayNumber}
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-white truncate mt-0.5">
                      {phase.name.replace(' Night', '')}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-1">
                      {phase.phaseKey === 'collagen_matrix' ? 'GHK-Cu + Red Light' : phase.phaseKey === 'retinoid' ? 'Tretinoin' : phase.phaseKey === 'exfoliation' ? 'AHA / BHA' : 'Lipid Barrier'}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Active Selected Phase Details */}
            {(() => {
              const activePhase = SKIN_CYCLE_PHASES.find(p => p.dayNumber === selectedSkinCycleTab) || SKIN_CYCLE_PHASES[0]
              return (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-start justify-between gap-3 flex-wrap border-b border-white/5 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold font-mono ${activePhase.colorBadge}`}>
                          {activePhase.badge}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">Night {activePhase.dayNumber} of 4</span>
                      </div>
                      <h3 className="text-base font-extrabold text-white mt-1.5">
                        {activePhase.eveningFocus}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {activePhase.rationale}
                      </p>
                    </div>
                  </div>

                  {/* Evening Layering Sequence */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Prescribed Evening Layering Sequence (Order Matters)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {activePhase.layeringSequence.map((stepStr, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-xs text-slate-200 font-medium leading-snug">
                            {stepStr.replace(/^\d+\.\s*/, '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Clinical Rules & Warnings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                      <strong className="font-bold flex items-center gap-1.5 text-amber-300">
                        ⚡ Bare-Skin Photobiomodulation Rule
                      </strong>
                      <p className="text-[11px] leading-relaxed text-amber-200/90">
                        Always use the Red &amp; NIR LED Mask on completely clean, bare skin before applying serums or lotions. Lipids and creams refract light photons and reduce tissue fluence.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-200 space-y-1">
                      <strong className="font-bold flex items-center gap-1.5 text-purple-300">
                        🧪 Chemical Compatibility Rule
                      </strong>
                      <p className="text-[11px] leading-relaxed text-purple-200/90">
                        GHK-Cu copper peptides are scheduled on Nights 3 &amp; 4. They are strictly separated from acidic exfoliants (Night 1) and retinoids (Night 2) to preserve copper chelation stability.
                      </p>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* N-of-1 EFFECTIVENESS & LONGITUDINAL ANALYSIS (For Peptide Protocols) */}
        {(protocol.steps?.some((s: any) => s.modality?.category === 'peptide' || s.modality?.peptide_metadata?.is_peptide) || protocol.id.includes('bpc') || protocol.id.includes('cjc')) && (
          <PeptideEffectivenessCard
            protocolId={protocol.id}
            protocolName={protocol.name}
            tasks={todayTasks}
            checkins={checkins}
          />
        )}

        {/* DAILY ROUTINE TIMELINE (Redesigned & Collapsed by Default) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all">
          <button
            type="button"
            onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
            className="w-full flex items-center justify-between p-4 sm:p-4.5 text-left hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-800 text-purple-300 border border-white/5">
                <Calendar size={17} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  <span>Daily Routine Timeline</span>
                  <span className="text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                    {evaluatedSteps.length} Steps
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Circadian schedule &amp; sequence across all {evaluatedSteps.length} modalities
                </p>
              </div>
            </div>

            <div className="p-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 transition-all shrink-0">
              <ChevronDown size={18} className={`transition-transform duration-200 ${isTimelineExpanded ? 'rotate-180 text-purple-400' : 'text-slate-400'}`} />
            </div>
          </button>

          {isTimelineExpanded && (
            <div className="p-4 sm:p-5 border-t border-slate-800 space-y-3 bg-slate-950/60 animate-in fade-in slide-in-from-top-2">
              <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-purple-500 before:to-amber-500">
                {evaluatedSteps.map(({ step, modality }: any, idx: number) => {
                  const stepName = modality?.display_name || modality?.name || step.instructions || `Step ${idx + 1}`
                  const stepTiming = step.timing_slot ? formatSlotName(step.timing_slot) : modality?.timing_summary || 'Daily'
                  const stepDose = step.dosage || step.dosage_value || modality?.dose_or_exposure || 'Standard dose'
                  const stepNotes = step.instructions || modality?.instructions || modality?.brief_description || ''
                  const phaseIcon = getPhaseIcon(step.timing_slot || modality?.timing_summary || '')

                  return (
                    <div key={idx} className="relative group">
                      {/* Chronological Timeline Node */}
                      <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-slate-950 border-2 border-purple-400 flex items-center justify-center font-mono font-bold text-[10px] text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                        {idx + 1}
                      </div>

                      <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3.5 space-y-2 hover:border-purple-500/40 transition-all">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-sm font-extrabold text-white">
                            {stepName}
                          </span>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="bg-slate-950 border border-slate-800 text-purple-300 px-2.5 py-0.5 rounded-lg font-mono text-[11px] flex items-center gap-1">
                              <span>{phaseIcon}</span>
                              <span>{stepTiming}</span>
                            </span>
                            <span className="bg-slate-950 border border-slate-800 text-teal-300 px-2.5 py-0.5 rounded-lg font-mono text-[11px]">
                              💊 {stepDose}
                            </span>
                          </div>
                        </div>

                        {stepNotes && (
                          <p className="text-xs text-slate-300 leading-relaxed font-sans pl-3 border-l-2 border-purple-500/30 my-1">
                            {stepNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* PRESCRIBED PROTOCOL MODALITIES (Prominent & Near the Top) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity size={16} className="text-teal-400" /> Prescribed Protocol Modalities ({evaluatedSteps.length})
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              Click any card to personalize dosing or schedule
            </span>
          </div>

          <div className="space-y-3">
            {evaluatedSteps.map(({ step, modality, modalityId, todayTask, statusType }: any, index: number) => {
              const isExpanded = expandedModalityId === (modalityId || step.id)
              const isCompletingThisTask = completingTaskId === (todayTask?.id || step.id)
              const modName = modality?.name || step.instructions || `Step ${index + 1}`
              const modDose = step.dose_text || modality?.dose_or_exposure || 'Standard Dose'
              const modTiming = step.timing_slot || step.frequency || modality?.frequency || 'Daily'
              const trackedOutcomes = getTrackedOutcomes(modality)

              return (
                <div 
                  key={step.id || index}
                  className={`bg-slate-900 border rounded-2xl transition-all shadow-md overflow-hidden ${
                    statusType === 'completed'
                      ? 'border-emerald-500/50 bg-emerald-950/10'
                      : statusType === 'pending'
                      ? 'border-blue-500/50 bg-slate-900'
                      : statusType === 'benched'
                      ? 'border-amber-500/40 bg-slate-900/60'
                      : 'border-slate-800 bg-slate-900/40 opacity-85'
                  }`}
                >
                  {/* Card Header Row (Click anywhere to expand) */}
                  <div 
                    onClick={() => setExpandedModalityId(isExpanded ? null : (modalityId || step.id))}
                    className="p-4 sm:p-5 cursor-pointer hover:bg-slate-800/40 transition-colors space-y-2.5 group"
                  >
                    {/* Row 1: Full-Width Modality Name & Status Badge */}
                    <div className="flex items-start justify-between gap-3 w-full">
                      <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug flex-1">
                        {modName}
                      </h3>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {statusType === 'completed' && (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 size={13} /> Completed Today
                          </span>
                        )}
                        {statusType === 'pending' && (
                          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Clock size={13} /> Active Today
                          </span>
                        )}
                        {statusType === 'benched' && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Layers size={13} /> On Bench
                          </span>
                        )}
                        {statusType === 'not_enrolled' && (
                          <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-1 rounded-full text-xs font-bold">
                            Not Currently Saved
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Dosing & Timing Info + Right Side Actions */}
                    <div className="flex items-center justify-between gap-4 pt-0.5 flex-wrap">
                      <div className="flex items-center gap-3 text-xs text-slate-300 font-mono flex-wrap">
                        <span className="text-teal-300 font-semibold">{modDose}</span>
                        <span>•</span>
                        <span className="text-purple-300 font-semibold">{modTiming}</span>
                        {step.stack_group && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 lowercase">{step.stack_group.replace(/_/g, ' ')}</span>
                          </>
                        )}
                      </div>

                      {/* Action Buttons on Right Side */}
                      <div className="flex items-center gap-2 shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
                        {statusType === 'not_enrolled' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddToToday(modalityId)
                            }}
                            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                          >
                            <Plus size={14} /> Add to Today
                          </button>
                        )}

                        {statusType === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartInlineCompletion(step, modality, todayTask, 'post')
                            }}
                            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                          >
                            <Check size={14} className="stroke-[3]" /> Log Complete
                          </button>
                        )}

                        {/* Standard Simple Down Arrow */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedModalityId(isExpanded ? null : (modalityId || step.id))
                          }}
                          className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                          title={isExpanded ? 'Collapse card' : 'Expand card'}
                        >
                          <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-purple-400' : 'text-slate-400'}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content Section */}
                  {isExpanded && modality && (
                    <div className="p-4 sm:p-5 pt-0 border-t border-slate-800/80 animate-in fade-in space-y-4">
                      
                      {/* INLINE OUTCOME LOGGING PANEL */}
                      {isCompletingThisTask && (
                        <div className="bg-slate-950 border border-purple-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl animate-in fade-in">
                          <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2">
                              <Sparkles size={16} className="text-purple-400" />
                              <span className="font-extrabold text-sm text-white">
                                Log Experience: {modName}
                              </span>
                            </div>
                            
                            {/* Pre / Post Tabs */}
                            <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
                              <button
                                type="button"
                                onClick={() => setActiveOutcomePhase('pre')}
                                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                  activeOutcomePhase === 'pre'
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                Pre-Session
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveOutcomePhase('post')}
                                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                  activeOutcomePhase === 'post'
                                    ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                Post-Session
                              </button>
                            </div>
                          </div>

                          {/* Outcome Sliders */}
                          <div className="space-y-4">
                            {trackedOutcomes.map((outcome) => {
                              const val = activeOutcomePhase === 'pre' 
                                ? (preValues[outcome.id] ?? 5) 
                                : (postValues[outcome.id] ?? 5)
                              const isTouched = activeOutcomePhase === 'pre' 
                                ? touchedPre[outcome.id] 
                                : touchedPost[outcome.id]
                              const colorCfg = getOutcomeColorConfig(val, outcome.directionality)

                              return (
                                <div key={outcome.id} className="space-y-1.5">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-200">{outcome.name}</span>
                                    <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${colorCfg.badgeBg}`}>
                                      {isTouched ? `${val}/10` : 'Not Rated (5)'}
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={10}
                                    step={1}
                                    value={val}
                                    onChange={(e) => {
                                      const num = parseInt(e.target.value, 10)
                                      if (activeOutcomePhase === 'pre') {
                                        setPreValues(prev => ({ ...prev, [outcome.id]: num }))
                                        setTouchedPre(prev => ({ ...prev, [outcome.id]: true }))
                                      } else {
                                        setPostValues(prev => ({ ...prev, [outcome.id]: num }))
                                        setTouchedPost(prev => ({ ...prev, [outcome.id]: true }))
                                      }
                                    }}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                  />
                                </div>
                              )
                            })}
                          </div>

                          {/* Subjective Notes */}
                          <div className="space-y-1 pt-1">
                            <label className="text-[11px] font-bold text-slate-400">Notes / Subjective Observations (Optional)</label>
                            <input
                              type="text"
                              value={outcomeNotes}
                              onChange={(e) => setOutcomeNotes(e.target.value)}
                              placeholder="e.g. Felt noticeably calm, no GI discomfort..."
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          {/* Inline Action Buttons */}
                          <div className="flex items-center justify-between pt-2">
                            <button
                              type="button"
                              onClick={() => setCompletingTaskId(null)}
                              className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl cursor-pointer"
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSaveInlineOutcomes(todayTask, step, modality)}
                              disabled={isSavingOutcomes}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
                            >
                              <Check size={14} strokeWidth={3} />
                              <span>{activeOutcomePhase === 'pre' ? 'Save Pre-Check' : 'Complete & Save Log'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Detailed Modality Banner Component */}
                      <ExpandedModalityDetailBanner
                        task={{
                          id: todayTask?.id || `preview_${modalityId}`,
                          local_user_id: getLocalUserId(),
                          date: currentDateStr,
                          modality_id: modalityId,
                          protocol_step_id: step.id,
                          status: statusType === 'not_enrolled' ? 'pending' : statusType,
                          timing_slot: step.timing_slot,
                          custom_dose: todayTask?.custom_dose || step.dose_text,
                          protocol_step: {
                            ...step,
                            protocol: protocol
                          },
                          loose_modality: modality
                        } as any}
                        onClose={() => setExpandedModalityId(null)}
                        onTaskStatusChange={(tId, status) => {
                          if (status === 'completed') {
                            handleStartInlineCompletion(step, modality, todayTask, 'post')
                          } else {
                            handleStatusChange(tId, status)
                          }
                        }}
                        onOpenDosageModal={() => setDosageModalModality(modality)}
                        onOpenRescheduleModal={() => setScheduleModalModality(modality)}
                        onMoveToBench={(task: DailyProtocolTask) => handleMoveToBench(task.modality_id || task.loose_modality?.id || modalityId)}
                        onEliminateEntirely={() => {}}
                      />

                    </div>
                  )}

                </div>
              )
            })}
          </div>
        </div>

      </main>

      {/* Completion Toast with Undo Option */}
      {completionToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/95 border border-emerald-500/40 text-white px-4 py-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            <Check size={14} strokeWidth={3} />
          </div>
          <div className="text-xs">
            <span className="font-bold text-emerald-300">{completionToast.name}</span> completed
          </div>
          <button 
            onClick={() => {
              if (completionToast.id) {
                handleStatusChange(completionToast.id, 'pending')
              }
              setCompletionToast(null)
            }}
            className="ml-2 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            Undo
          </button>
        </div>
      )}

      {/* FULL-SCREEN TAKEOVER MODAL: BENCH OR ELIMINATE ENTIRE PROTOCOL */}
      {actionModalType && mounted && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActionModalType(null)
          }}
        >
          <div 
            className={`relative w-full max-w-lg bg-slate-950 border ${
              actionModalType === 'eliminate' 
                ? 'border-rose-500/50 shadow-[0_0_50px_rgba(244,63,94,0.25)]' 
                : 'border-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.25)]'
            } rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col my-auto max-h-[90vh] overflow-hidden space-y-4`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl border shrink-0 ${
                  actionModalType === 'eliminate' 
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                    : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                }`}>
                  {actionModalType === 'eliminate' ? <Trash2 size={22} /> : <Archive size={22} />}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {actionModalType === 'eliminate' 
                      ? `Eliminate "${protocol.name}" Entirely?` 
                      : `Move "${protocol.name}" to Bench?`}
                  </h3>
                  <p className={`text-xs font-medium ${actionModalType === 'eliminate' ? 'text-rose-300/90' : 'text-purple-300/90'}`}>
                    {actionModalType === 'eliminate' 
                      ? `Removes all ${evaluatedSteps.length} modalities from active schedule` 
                      : `Pauses all ${evaluatedSteps.length} modalities and saves to bench`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActionModalType(null)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Reason Content */}
            <div className="space-y-4 overflow-y-auto pr-1 flex-1 py-1">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                💡 <strong className="text-teal-300">Don&apos;t worry:</strong> {actionModalType === 'eliminate' 
                  ? 'You can re-add this protocol from the Protocol Library anytime.' 
                  : 'You can restore this benched protocol back to your schedule anytime with 1 click.'}
              </div>

              {/* Reasons Checkbox Grid */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Why are you {actionModalType === 'eliminate' ? 'eliminating' : 'benching'} this protocol? (Select 0 or more)
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {(actionModalType === 'eliminate' ? PROTOCOL_ELIMINATION_REASONS : PROTOCOL_BENCH_REASONS).map((label) => {
                    const isSelected = selectedEliminationReasons.includes(label)
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleEliminationReason(label)}
                        className={`w-full p-2.5 rounded-xl border text-left text-xs flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? actionModalType === 'eliminate'
                              ? 'bg-rose-500/15 border-rose-500/60 text-white'
                              : 'bg-purple-500/15 border-purple-500/60 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{label}</span>
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                          isSelected 
                            ? actionModalType === 'eliminate' ? 'bg-rose-500 border-rose-400 text-white' : 'bg-purple-500 border-purple-400 text-white'
                            : 'border-slate-700 bg-slate-800'
                        }`}>
                          {isSelected && <Check size={10} strokeWidth={3} />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Freeform Personal Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Personal Notes / Biometric Feedback (Optional)
                </label>
                <textarea
                  value={eliminateReason}
                  onChange={(e) => setEliminateReason(e.target.value)}
                  placeholder="e.g., Bloodwork marker changes, cycling off for 8 weeks..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setActionModalType(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmProtocolAction}
                disabled={isProcessingAction}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all shadow-lg cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5 ${
                  actionModalType === 'eliminate'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/30'
                    : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/30'
                }`}
              >
                {actionModalType === 'eliminate' ? <Trash2 size={14} /> : <Archive size={14} />}
                <span>
                  {isProcessingAction 
                    ? 'Updating...' 
                    : actionModalType === 'eliminate' 
                    ? 'Confirm Protocol Elimination' 
                    : 'Confirm Move to Bench'}
                </span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modality Dosage Personalization Modal */}
      {dosageModalModality && (
        <ManageTaskModal
          isOpen={!!dosageModalModality}
          onClose={() => setDosageModalModality(null)}
          modality={dosageModalModality}
          userProfile={profile}
          onSaveSuccess={() => {
            setDosageModalModality(null)
            reloadData()
          }}
        />
      )}

      {/* Customize Modality Outcomes Modal */}
      {customizeOutcomesModality && (
        <CustomizeModalityOutcomesModal
          isOpen={!!customizeOutcomesModality}
          onClose={() => setCustomizeOutcomesModality(null)}
          modality={customizeOutcomesModality}
          allOutcomes={allOutcomes}
          currentOutcomeIds={getTrackedOutcomes(customizeOutcomesModality).map(o => o.id)}
          userProfile={profile}
          onSaveOutcomes={(modId: string, selectedOutcomeIds: string[]) => {
            setCustomOutcomesMap(prev => ({
              ...prev,
              [modId]: selectedOutcomeIds
            }))
            setCustomizeOutcomesModality(null)
          }}
        />
      )}

      {/* Schedule Modality Modal */}
      {scheduleModalModality && (
        <ScheduleModalityModal
          isOpen={!!scheduleModalModality}
          onClose={() => setScheduleModalModality(null)}
          modality={scheduleModalModality}
          onSuccess={async () => {
            await reloadData()
          }}
        />
      )}

    </div>
  )
}
