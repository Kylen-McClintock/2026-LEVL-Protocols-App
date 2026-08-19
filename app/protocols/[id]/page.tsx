'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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
  getDailyWellbeingHistory
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
  ListOrdered
} from 'lucide-react'
import { ExpandedModalityDetailBanner } from '@/components/views/ExpandedModalityDetailBanner'
import { DosageDetailModal } from '@/components/modals/DosageDetailModal'
import ManageTaskModal from '@/components/modals/ManageTaskModal'
import ScheduleModalityModal from '@/components/modals/ScheduleModalityModal'
import CustomizeModalityOutcomesModal from '@/components/modals/CustomizeModalityOutcomesModal'
import PeptideEffectivenessCard from '@/components/peptides/PeptideEffectivenessCard'
import { getOutcomeColorConfig, getNeutralOutcomeColorConfig } from '@/lib/utils/outcomeColors'

const formatSlotName = (str: string) => {
  if (!str) return 'Daily'
  return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

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

  const [expandedModalityId, setExpandedModalityId] = useState<string | null>(null)
  const [dosageModalModality, setDosageModalModality] = useState<any | null>(null)
  const [scheduleModalModality, setScheduleModalModality] = useState<any | null>(null)
  const [isSynthesisFlowExpanded, setIsSynthesisFlowExpanded] = useState<boolean>(false)

  // Customize Outcomes Modal state
  const [customizeOutcomesModality, setCustomizeOutcomesModality] = useState<any | null>(null)
  const [customOutcomesMap, setCustomOutcomesMap] = useState<Record<string, string[]>>({})

  // INLINE outcome tracking state (Matching Today View inline tracking panel)
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

  const currentDateStr = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const localUserId = getLocalUserId()

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
  }, [protocolId])

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
      // SAVE BASELINE OBSERVATIONS (WITHOUT COMPLETING TASK)
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

    // SAVE AFTER OBSERVATIONS & COMPLETE TASK
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
          className="mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all"
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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 selection:bg-purple-500/30">
      
      {/* Top Header Toolbar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 cursor-pointer"
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
      <main className="max-w-5xl mx-auto px-4 py-6 sm:px-6 space-y-6">

        {/* HERO PROTOCOL FOCUS CARD */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/40 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={16} /> Protocol Deep Dive & Focus View
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {protocol.name}
            </h1>
            {protocol.description && (
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
                {protocol.description}
              </p>
            )}
          </div>

          {/* Key Longevity Metadata Pills */}
          <div className="flex items-center gap-2.5 flex-wrap pt-1 text-xs">
            {protocol.primary_goal && (
              <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-teal-300">
                <Target size={14} className="text-teal-400" />
                <span className="font-semibold">Goal: {protocol.primary_goal}</span>
              </div>
            )}
            {protocol.difficulty_level && (
              <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-amber-300">
                <Zap size={14} className="text-amber-400" />
                <span className="font-semibold">Difficulty: {protocol.difficulty_level}</span>
              </div>
            )}
            {protocol.evidence_level && (
              <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-blue-300">
                <ShieldCheck size={14} className="text-blue-400" />
                <span className="font-semibold">Evidence: {protocol.evidence_level}</span>
              </div>
            )}
          </div>

          {/* Scientific Rationale Banner */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 text-xs sm:text-sm text-purple-200 flex items-start gap-3 leading-relaxed">
            <Info size={18} className="text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-purple-300 font-bold block mb-0.5">Scientific Protocol Rationale:</strong>
              <span>
                {protocol.rationale || protocol.notes || `Prescribed protocol stack authored by ${authorName}. Designed to extend longevity healthspan through target biological pathway modulation.`}
              </span>
            </div>
          </div>
        </div>

        {/* N-of-1 EFFECTIVENESS & LONGITUDINAL ANALYSIS (For Peptide Protocols) */}
        {(protocol.steps?.some((s: any) => s.modality?.category === 'peptide' || s.modality?.peptide_metadata?.is_peptide) || protocol.id.includes('bpc') || protocol.id.includes('cjc')) && (
          <PeptideEffectivenessCard
            protocolId={protocol.id}
            protocolName={protocol.name}
            tasks={todayTasks}
            checkins={checkins}
          />
        )}

        {/* PROTOCOL SYNTHESIS & SEQUENTIAL EXECUTION FLOW (Collapsed by Default) */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border border-purple-500/40 rounded-2xl overflow-hidden shadow-xl transition-all">
          <button
            type="button"
            onClick={() => setIsSynthesisFlowExpanded(!isSynthesisFlowExpanded)}
            className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-purple-950/20 hover:bg-purple-950/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <ListOrdered size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  <span>Protocol Synthesis & Sequential Execution Flow</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                    {evaluatedSteps.length} Modalities
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Daily timing schedule & synergistic pathway interactions across this protocol
                </p>
              </div>
            </div>

            <div className="text-purple-300 flex items-center gap-1.5 text-xs font-bold shrink-0">
              <span>{isSynthesisFlowExpanded ? 'Hide Flow' : 'Show Sequential Flow'}</span>
              {isSynthesisFlowExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>

          {isSynthesisFlowExpanded && (
            <div className="p-4 sm:p-5 border-t border-purple-500/30 space-y-3 bg-slate-950/80 animate-in fade-in slide-in-from-top-2">
              {evaluatedSteps.map(({ step, modality }: any, idx: number) => {
                const stepName = modality?.display_name || modality?.name || step.instructions || `Step ${idx + 1}`
                const stepTiming = step.timing_slot ? formatSlotName(step.timing_slot) : modality?.timing_summary || 'Daily'
                const stepDose = step.dosage || step.dosage_value || modality?.dose_or_exposure || 'Standard dose'
                const stepNotes = step.instructions || modality?.instructions || modality?.brief_description || ''

                return (
                  <div key={idx} className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3.5 space-y-2 hover:border-purple-500/40 transition-all">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center font-bold font-mono text-xs shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-extrabold text-white">
                          {stepName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="bg-slate-950 border border-slate-800 text-purple-300 px-2.5 py-0.5 rounded-md font-mono text-[11px]">
                          ⏰ {stepTiming}
                        </span>
                        <span className="bg-slate-950 border border-slate-800 text-teal-300 px-2.5 py-0.5 rounded-md font-mono text-[11px]">
                          💊 {stepDose}
                        </span>
                      </div>
                    </div>

                    {stepNotes && (
                      <p className="text-xs text-slate-300 leading-relaxed font-sans pl-8 border-l-2 border-purple-500/30 my-1">
                        {stepNotes}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ENROLLMENT & STATUS BREAKDOWN SUMMARY BAR */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              <Layers size={16} className="text-purple-400" />
              <span>Protocol Enrollment & Completion Status</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">
              {evaluatedSteps.length} Total Modalities
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Completed Today</span>
              <span className="text-xl font-extrabold text-emerald-300 font-mono mt-1">{completedCount}</span>
            </div>

            <div className="bg-blue-950/40 border border-blue-500/30 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Active / Pending</span>
              <span className="text-xl font-extrabold text-blue-300 font-mono mt-1">{activeCount - completedCount}</span>
            </div>

            <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">On Bench</span>
              <span className="text-xl font-extrabold text-amber-300 font-mono mt-1">{benchedCount}</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Not In Stack</span>
              <span className="text-xl font-extrabold text-slate-300 font-mono mt-1">{notEnrolledCount}</span>
            </div>
          </div>
        </div>

        {/* MODALITY BREAKDOWN CARDS */}
        <div className="space-y-4 pt-2">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Activity size={16} className="text-teal-400" /> Prescribed Protocol Modalities ({evaluatedSteps.length})
          </h2>

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
                      <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug flex-1">
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
                      
                      {/* UNIFIED INLINE OUTCOME TRACKER PANEL (EXACT TODAY VIEW LOGGING FLOW) */}
                      {isCompletingThisTask && (
                        <div className="bg-black/70 border border-purple-500/40 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in shadow-xl text-xs mt-4">
                          
                          {/* Header & Phase Switcher Tabs */}
                          <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider">
                                <Activity size={16} className="text-purple-400" /> Outcome Observations
                              </div>

                              {/* Phase Tabs: Before Modality | After Modality */}
                              <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-white/15">
                                <button
                                  type="button"
                                  onClick={() => setActiveOutcomePhase('pre')}
                                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${activeOutcomePhase === 'pre' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                                >
                                  Before Modality
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveOutcomePhase('post')}
                                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${activeOutcomePhase === 'post' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                                >
                                  After Modality
                                </button>
                              </div>

                              {activeOutcomePhase === 'post' && (
                                <div className="flex items-center gap-2 bg-black/60 border border-emerald-500/40 rounded-xl px-3 py-1 text-xs font-semibold text-emerald-300">
                                  <Clock size={14} />
                                  <span>NOW Completed: {format(new Date(), 'hh:mm a')}</span>
                                </div>
                              )}
                            </div>

                            {/* Edit Tracked Outcomes Button */}
                            <button
                              type="button"
                              onClick={() => setCustomizeOutcomesModality(modality)}
                              className="text-xs font-bold text-gray-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Sliders size={14} /> Edit Tracked Outcomes
                            </button>
                          </div>

                          {/* Outcome Sliders List */}
                          <div className="space-y-3">
                            {trackedOutcomes.map(outcome => {
                              const preVal = preValues[outcome.id]
                              const postVal = postValues[outcome.id]
                              const isPreTouched = touchedPre[outcome.id]
                              const isPostTouched = touchedPost[outcome.id]

                              const isCurrentPhaseTouched = activeOutcomePhase === 'pre' ? isPreTouched : isPostTouched
                              const currentVal = activeOutcomePhase === 'pre' ? (preVal ?? 5) : (postVal ?? preVal ?? 5)
                              const effectiveBaseline = preVal !== undefined ? preVal : 5

                              const preColor = getOutcomeColorConfig(effectiveBaseline, outcome.directionality)
                              const postColor = getOutcomeColorConfig(currentVal, outcome.directionality)
                              const colorCfg = isCurrentPhaseTouched ? postColor : getNeutralOutcomeColorConfig()
                              const isLowerBetter = outcome.directionality === 'lower_is_better'
                              const netShift = currentVal - effectiveBaseline

                              return (
                                <div key={outcome.id} className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
                                  <div className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-white font-bold">{outcome.name}</span>
                                      
                                      {/* Display Before Baseline rating pill & shift badge when logging after modality */}
                                      {activeOutcomePhase === 'post' && preVal !== undefined && (
                                        <div className="flex items-center gap-1">
                                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-0.5 ${preColor.badgeBg}`}>
                                            ⚡ Baseline: {preVal}/10
                                          </span>
                                          {isPostTouched && (
                                            <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded border ${netShift >= 0 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-red-500/20 border-red-500/40 text-red-300'}`}>
                                              {netShift >= 0 ? `+${netShift}` : netShift} Shift
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${colorCfg.badgeBg}`}>
                                        {isCurrentPhaseTouched ? colorCfg.qualityLabel : 'Unset'}
                                      </span>
                                      <span className={`font-mono font-bold text-xs ${colorCfg.textColor}`}>
                                        {isCurrentPhaseTouched ? `${currentVal}/10` : 'Unset'}
                                      </span>
                                    </div>
                                  </div>

                                  <input 
                                    type="range" 
                                    min="0" 
                                    max="10" 
                                    value={currentVal} 
                                    onChange={(e) => {
                                      const num = parseInt(e.target.value)
                                      if (activeOutcomePhase === 'pre') {
                                        setPreValues(prev => ({ ...prev, [outcome.id]: num }))
                                        setTouchedPre(prev => ({ ...prev, [outcome.id]: true }))
                                      } else {
                                        setPostValues(prev => ({ ...prev, [outcome.id]: num }))
                                        setTouchedPost(prev => ({ ...prev, [outcome.id]: true }))
                                      }
                                    }} 
                                    className="w-full cursor-pointer" 
                                    style={{ accentColor: colorCfg.accentHex }}
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

                          {/* Optional Notes Input */}
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

                          {/* Action Buttons: Save Baseline OR Save Observations & Complete */}
                          <div className="flex items-center gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => handleSaveInlineOutcomes(todayTask, step, modality)}
                              disabled={isSavingOutcomes}
                              className={`flex-1 py-3 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95 ${
                                activeOutcomePhase === 'pre' 
                                  ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/40' 
                                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
                              }`}
                            >
                              <Check size={16} className="stroke-[3]" />
                              <span>
                                {isSavingOutcomes
                                  ? (activeOutcomePhase === 'pre' ? 'Saving Baseline...' : 'Saving...')
                                  : (activeOutcomePhase === 'pre' ? '⚡ Save Baseline Observations' : '✓ Save Observations & Complete')
                                }
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCompletingTaskId(null)}
                              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>

                        </div>
                      )}

                      {/* RICH EXPANDED MODALITY DETAIL BANNER (UNTOUCHED) */}
                      <ExpandedModalityDetailBanner
                        task={todayTask || ({ loose_modality: modality, modality_id: modalityId, protocol_step: step } as any)}
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

      {/* Modality Dosage Personalization Modal */}
      {dosageModalModality && (
        <ManageTaskModal
          isOpen={!!dosageModalModality}
          onClose={() => setDosageModalModality(null)}
          modality={dosageModalModality}
          userProfile={profile}
          onSaveSuccess={() => {
            setDosageModalModality(null)
            window.location.reload()
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
            const localUserId = getLocalUserId()
            const updatedTasks = await getDailyProtocolTasks(localUserId, currentDateStr)
            setTodayTasks(updatedTasks)
          }}
        />
      )}

    </div>
  )
}
