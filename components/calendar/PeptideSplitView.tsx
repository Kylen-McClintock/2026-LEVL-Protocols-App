'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DailyProtocolTask, UserProfile, DailyWellbeingCheckin, Modality } from '@/lib/types'
import { format, isSameDay } from 'date-fns'
import {
  Dna,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Flame,
  AlertCircle,
  Plus,
  ExternalLink,
  Sliders,
  FileText,
  Camera,
  Scale,
  Calendar,
  Layers,
  TrendingUp,
  Info,
  ChevronRight,
  X,
  Upload,
  Eye,
  Bot,
  AlertTriangle,
  HeartPulse,
  LineChart,
  ThermometerSnowflake
} from 'lucide-react'
import {
  extractPeptideCycles,
  computeWeeklyPKCurves,
  correlatePeptideBiomarkers,
  isPeptideModality,
  getCanonicalPeptideKey,
  PeptideCycleSummary,
  PeptideBiomarkerCorrelation,
  PKDataPoint
} from '@/lib/peptides/peptideCycleEngine'
import FridgeVialInventoryCard from '@/components/peptides/FridgeVialInventoryCard'
import PeptideTitrationPlanner from '@/components/peptides/PeptideTitrationPlanner'
import {
  analyzePeptideProtocolEffectiveness,
  NOf1EffectivenessReport
} from '@/lib/peptides/peptideEffectivenessEngine'
import { getAllBiomarkerMeasurements } from '@/lib/data/bloodworkData'
import { BiomarkerMeasurementRecord } from '@/lib/aging-models/bioAgeTypes'
import {
  BodyCompositionRecord,
  loadPhysiqueRecords,
  savePhysiqueRecordToDB,
  compressPhysiqueImage
} from '@/lib/storage/physiqueStorage'
import ManageTaskModal from '@/components/modals/ManageTaskModal'
import ShareablePeptideReportModal from '@/components/modals/ShareablePeptideReportModal'
import ProtocolActionModal from '@/components/modals/ProtocolActionModal'
import ProtocolTaskCard, { DedupedTask } from '@/components/cards/ProtocolTaskCard'
import CycleIntelligenceCard from '@/components/peptides/CycleIntelligenceCard'
import { evaluatePeptideCycleIntelligence } from '@/lib/peptides/peptideCycleIntelligenceEngine'
import { getColorForProtocol } from '@/lib/utils/categories'
import { getOutcomeDimensions, updateDailyTaskStatus, updateUserProfile, getOutcomeObservationsHistory } from '@/lib/data'
import { OutcomeDimension } from '@/lib/types'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'

interface PeptideSplitViewProps {
  tasks: DailyProtocolTask[]
  weekDays: Date[]
  userProfile?: UserProfile | null
  wellbeingLogs?: DailyWellbeingCheckin[]
}

export default function PeptideSplitView({
  tasks,
  weekDays,
  userProfile,
  wellbeingLogs = []
}: PeptideSplitViewProps) {
  const router = useRouter()

  // Correlative Layer Overlays (Identical UX to ExerciseSplitView)
  const [showIntelligenceOverlay, setShowIntelligenceOverlay] = useState(true)
  const [showBiomarkersOverlay, setShowBiomarkersOverlay] = useState(true)
  const [showPKCurvesOverlay, setShowPKCurvesOverlay] = useState(true)
  const [showWellbeingOverlay, setShowWellbeingOverlay] = useState(true)
  const [showBodyCompOverlay, setShowBodyCompOverlay] = useState(false)

  // Modals & Drawers State
  const [selectedCycle, setSelectedCycle] = useState<PeptideCycleSummary | null>(null)
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<DailyProtocolTask | null>(null)
  const [managingTask, setManagingTask] = useState<DailyProtocolTask | null>(null)
  const [showShareableReport, setShowShareableReport] = useState(false)
  const [showAiCoachModal, setShowAiCoachModal] = useState(false)
  const [selectedProtocolForCoach, setSelectedProtocolForCoach] = useState<{ id: string; name: string } | null>(null)
  const [showFridgeModal, setShowFridgeModal] = useState(false)
  const [showTitrationModal, setShowTitrationModal] = useState(false)
  const [allOutcomes, setAllOutcomes] = useState<OutcomeDimension[]>([])

  // Local User Profile & Preferences State
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(userProfile || null)
  const [observations, setObservations] = useState<any[]>([])

  // Biomarkers & Lab Records
  const [biomarkers, setBiomarkers] = useState<BiomarkerMeasurementRecord[]>([])

  // Body Composition & Progress Photos State
  const [bodyRecords, setBodyRecords] = useState<BodyCompositionRecord[]>([])
  const [showBodyCompModal, setShowBodyCompModal] = useState(false)
  const [newWeight, setNewWeight] = useState('')
  const [newMusclePct, setNewMusclePct] = useState('')
  const [newBodyFatPct, setNewBodyFatPct] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null)
  const [photoPose, setPhotoPose] = useState<BodyCompositionRecord['photo_pose']>('front')
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false)
  const [activePhotoModalRecord, setActivePhotoModalRecord] = useState<BodyCompositionRecord | null>(null)

  useEffect(() => {
    if (userProfile) setCurrentProfile(userProfile)
  }, [userProfile])

  // Load Biomarker measurements, Outcomes, Body records, and Outcome observations on mount
  useEffect(() => {
    const userId = currentProfile?.id || currentProfile?.local_user_id || 'local_user'
    getAllBiomarkerMeasurements(userId).then(records => {
      if (records) setBiomarkers(records)
    })
    loadPhysiqueRecords().then(records => {
      if (records) setBodyRecords(records)
    })
    getOutcomeDimensions().then(res => {
      if (res) setAllOutcomes(res)
    })

    // Load recent outcome observations from localStorage cache and DB
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`levl_outcome_obs_${userId}`)
        if (cached) setObservations(JSON.parse(cached))
      } catch (e) {}
    }

    const startStr = format(weekDays[0] || new Date(), 'yyyy-MM-dd')
    const endStr = format(weekDays[weekDays.length - 1] || new Date(), 'yyyy-MM-dd')
    getOutcomeObservationsHistory(userId, startStr, endStr).then(res => {
      if (res && res.length > 0) setObservations(res)
    })
  }, [currentProfile, weekDays])

  // Extract synthesized Peptide Cycles from tasks
  const cycles = useMemo(() => {
    return extractPeptideCycles(tasks, weekDays, userProfile)
  }, [tasks, weekDays, userProfile])

  // Map correlated biomarkers for each cycle
  const biomarkersByCycle = useMemo(() => {
    const map: Record<string, PeptideBiomarkerCorrelation[]> = {}
    cycles.forEach(c => {
      map[c.modalityId] = correlatePeptideBiomarkers(c, biomarkers)
    })
    return map
  }, [cycles, biomarkers])

  // Map N-of-1 protocol effectiveness reports
  const effectivenessReports = useMemo(() => {
    const uniqueProtocols = new Map<string, string>()
    cycles.forEach(c => uniqueProtocols.set(c.protocolId, c.protocolName))

    const reports: NOf1EffectivenessReport[] = []
    uniqueProtocols.forEach((pName, pId) => {
      reports.push(analyzePeptideProtocolEffectiveness(pId, pName, tasks, wellbeingLogs))
    })
    return reports
  }, [cycles, tasks, wellbeingLogs])

  // 1-Click Action to Enable Recommended Outcome Tracking
  const handleEnableOutcomeTracking = async (outcomeKey: string, outcomeLabel: string) => {
    const localUserId = currentProfile?.local_user_id || currentProfile?.id || (typeof window !== 'undefined' ? getLocalUserId() : 'local_user')
    const existingPrefs = currentProfile?.outcome_preference_scores || {}
    const updatedPrefs = {
      ...existingPrefs,
      [outcomeKey]: 10,
      [outcomeLabel]: 10,
      [`morning:${outcomeKey}`]: 10,
      [`nightly:${outcomeKey}`]: 10
    }

    const updatedProfile: UserProfile = {
      ...(currentProfile || {
        id: localUserId,
        local_user_id: localUserId,
        longevity_personalization_coefficient: 1.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }),
      outcome_preference_scores: updatedPrefs
    }
    setCurrentProfile(updatedProfile)

    try {
      await updateUserProfile(localUserId, {
        outcome_preference_scores: updatedPrefs
      })
    } catch (err) {
      console.warn('Notice enabling outcome tracking in user profile:', err)
    }
  }

  // Compute Comprehensive Cycle Intelligence & Stack Optimization Report
  const intelligenceReport = useMemo(() => {
    return evaluatePeptideCycleIntelligence({
      tasks,
      weekDays,
      userProfile: currentProfile,
      wellbeingLogs,
      biomarkers,
      bodyRecords,
      outcomeDimensions: allOutcomes,
      observations,
      cycles
    })
  }, [tasks, weekDays, currentProfile, wellbeingLogs, biomarkers, bodyRecords, allOutcomes, observations, cycles])

  // Compute Active Pulses (Strictly peptides, deduplicated per day and canonical key)
  const pulseTasks = useMemo(() => {
    const rawPeptides = tasks.filter(isPeptideModality)
    const seen = new Set<string>()
    const deduped: DailyProtocolTask[] = []

    rawPeptides.forEach(t => {
      const m = t.loose_modality || t.protocol_step?.modality
      const rawId = t.modality_id || m?.id || t.id
      const rawName = m?.name || t.protocol_step?.modality?.name || ''
      const canonKey = getCanonicalPeptideKey(rawId, rawName)
      const dateKey = `${t.scheduled_date || 'nodate'}_${canonKey}`

      if (!seen.has(dateKey)) {
        seen.add(dateKey)
        deduped.push(t)
      }
    })

    return deduped
  }, [tasks])

  const completedPulsesCount = pulseTasks.filter(t => t.status === 'completed').length
  const scheduledPulsesCount = pulseTasks.length
  const overallAdherencePct = scheduledPulsesCount > 0
    ? Math.round((completedPulsesCount / scheduledPulsesCount) * 100)
    : 100

  // Active Protocols List with deterministic protocol colors for schedule color coding
  const activeProtocols = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string; count: number }>()
    pulseTasks.forEach(task => {
      const mod = task.loose_modality || task.protocol_step?.modality
      const rawId = task.modality_id || mod?.id || task.id
      const rawName = mod?.name || task.protocol_step?.modality?.name || ''
      const canonKey = getCanonicalPeptideKey(rawId, rawName)
      const matchingCycle = cycles.find(c => c.modalityId.toLowerCase() === canonKey.toLowerCase())
      
      const pName = task.protocol_step?.protocol?.name || matchingCycle?.protocolName || (task.loose_modality as any)?.protocolTags?.[0]?.protocol_name || 'Peptide Protocol'
      const pId = task.user_protocol_instance_id || task.protocol_step?.protocol_id || pName
      const color = (task.protocol_step?.protocol as any)?.color_hex || getColorForProtocol(pName)

      if (!map.has(pName)) {
        map.set(pName, { id: pId, name: pName, color, count: 0 })
      }
      map.get(pName)!.count += 1
    })
    return Array.from(map.values())
  }, [pulseTasks, cycles])

  // Handle task status toggle
  const handleToggleTaskStatus = async (task: DailyProtocolTask, e: React.MouseEvent) => {
    e.stopPropagation()
    const isCompleted = task.status === 'completed'
    try {
      await updateDailyTaskStatus(task.id, isCompleted ? 'pending' : 'completed')
      router.refresh()
    } catch (err) {
      console.error('Error toggling task completion:', err)
    }
  }

  // Handle Photo & Body Composition Save
  const handleSaveBodyComp = async () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const newRecord: BodyCompositionRecord = {
      id: `physique_${Date.now()}`,
      date: todayStr,
      weight_lbs: newWeight ? parseFloat(newWeight) : undefined,
      skeletal_muscle_mass_pct: newMusclePct ? parseFloat(newMusclePct) : undefined,
      body_fat_pct: newBodyFatPct ? parseFloat(newBodyFatPct) : undefined,
      photo_url: uploadedPhotoUrl || undefined,
      photo_pose: photoPose,
      notes: newNotes || undefined
    }

    await savePhysiqueRecordToDB(newRecord)
    const updated = await loadPhysiqueRecords()
    setBodyRecords(updated)

    // Reset Form
    setShowBodyCompModal(false)
    setNewWeight('')
    setNewMusclePct('')
    setNewBodyFatPct('')
    setNewNotes('')
    setUploadedPhotoUrl(null)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsCompressingPhoto(true)
    try {
      const compressed = await compressPhysiqueImage(file)
      setUploadedPhotoUrl(compressed)
    } catch (err) {
      console.error('Error compressing physique photo:', err)
    } finally {
      setIsCompressingPhoto(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 1. Executive 4-KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center gap-3.5 backdrop-blur-md">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 shadow-md">
            <Dna size={22} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Active Bioactive Cycles
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-white font-mono">
                {cycles.length}
              </span>
              <span className="text-[10px] text-cyan-400 font-bold">In Stack</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center gap-3.5 backdrop-blur-md">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 shadow-md">
            <Clock size={22} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Scheduled Pulses
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-purple-300 font-mono">
                {scheduledPulsesCount}
              </span>
              <span className="text-[10px] text-slate-400">This Window</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center gap-3.5 backdrop-blur-md">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-md">
            <ShieldCheck size={22} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Cycle Adherence
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
                {overallAdherencePct}%
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">{completedPulsesCount} Logged</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center gap-3.5 backdrop-blur-md">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-md">
            <Activity size={22} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Receptor Resensitization
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-sm sm:text-base font-black text-amber-300 font-mono">
                {cycles.some(c => c.isWashoutActive) ? 'Washout Active' : 'Optimal'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Correlative Layer Toggle Toolbar & Clinician Export */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Layers size={13} className="text-cyan-400" />
            <span>Cycle Overlays:</span>
          </span>

          <button
            onClick={() => setShowIntelligenceOverlay(!showIntelligenceOverlay)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              showIntelligenceOverlay
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            <Sparkles size={13} />
            <span>Cycle Intelligence</span>
          </button>

          <button
            onClick={() => setShowBiomarkersOverlay(!showBiomarkersOverlay)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              showBiomarkersOverlay
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            <Activity size={13} />
            <span>Labs &amp; Biomarkers</span>
          </button>

          <button
            onClick={() => setShowPKCurvesOverlay(!showPKCurvesOverlay)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              showPKCurvesOverlay
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            <LineChart size={13} />
            <span>PK Model Curves</span>
          </button>

          <button
            onClick={() => setShowWellbeingOverlay(!showWellbeingOverlay)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              showWellbeingOverlay
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            <Sparkles size={13} />
            <span>N-of-1 Wellbeing</span>
          </button>

          <button
            onClick={() => setShowBodyCompOverlay(!showBodyCompOverlay)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              showBodyCompOverlay
                ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            <Scale size={13} />
            <span>Body Comp &amp; Photos</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFridgeModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 border border-cyan-500/30 transition-colors cursor-pointer shadow-sm"
          >
            <ThermometerSnowflake size={13} />
            <span>Fridge Stock</span>
          </button>

          <button
            onClick={() => setShowTitrationModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-emerald-500/30 transition-colors cursor-pointer shadow-sm"
          >
            <TrendingUp size={13} />
            <span>Dose Titration</span>
          </button>

          <button
            onClick={() => setShowShareableReport(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-900/30 transition-all cursor-pointer"
          >
            <FileText size={14} />
            <span>Clinician Report</span>
          </button>

          <button
            onClick={() => setShowBodyCompModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
          >
            <Camera size={13} />
            <span>Log Physique</span>
          </button>
        </div>
      </div>

      {/* 2.5 Weekly Peptide Split & Scheduling Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-cyan-400" />
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">
              Peptide Protocol Split Matrix (7-Day Schedule)
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Click task to inspect full modality &amp; clinical PK curve</span>
        </div>

        {/* Active Protocols Color Legend */}
        {activeProtocols.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-0.5 pb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Layers size={11} className="text-cyan-400" />
              <span>Protocols:</span>
            </span>
            {activeProtocols.map(p => (
              <span
                key={p.name}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border transition-all"
                style={{
                  backgroundColor: `${p.color}15`,
                  borderColor: `${p.color}45`,
                  color: p.color
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span>{p.name}</span>
                <span className="text-[9px] opacity-70 font-mono">({p.count})</span>
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5">
          {weekDays.map((dayDate, dayIdx) => {
            const dayStr = format(dayDate, 'yyyy-MM-dd')
            const dayName = format(dayDate, 'EEE')
            const dayNumber = format(dayDate, 'd')
            const isCurrentDay = isSameDay(dayDate, new Date())

            // Tasks on this day (deduplicated by canonical peptide key)
            const rawDayTasks = pulseTasks.filter(t => t.scheduled_date === dayStr)
            const seenDayKeys = new Set<string>()
            const dayTasks: DailyProtocolTask[] = []

            rawDayTasks.forEach(task => {
              const mod = task.loose_modality || task.protocol_step?.modality
              const rawId = task.modality_id || mod?.id || task.id
              const rawName = mod?.name || task.protocol_step?.modality?.name || ''
              const canonKey = getCanonicalPeptideKey(rawId, rawName)

              if (!seenDayKeys.has(canonKey)) {
                seenDayKeys.add(canonKey)
                dayTasks.push(task)
              }
            })

            const dayCheckin = wellbeingLogs.find(w => w.checkin_date === dayStr)

            return (
              <div
                key={dayStr}
                className={`p-3 rounded-2xl border flex flex-col justify-between min-h-[160px] transition-all backdrop-blur-md ${
                  isCurrentDay
                    ? 'bg-slate-900/90 border-cyan-500/50 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-xs font-black uppercase ${isCurrentDay ? 'text-cyan-400' : 'text-slate-400'}`}>
                      {dayName}
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      {dayNumber}
                    </span>
                  </div>

                  {isCurrentDay && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-cyan-500/20 text-cyan-300 font-black tracking-widest uppercase">
                      TODAY
                    </span>
                  )}
                </div>

                {/* Day Task Pills */}
                <div className="space-y-2 my-2 flex-1">
                  {dayTasks.length > 0 ? (
                    dayTasks.map(task => {
                      const mod = task.loose_modality || task.protocol_step?.modality
                      const rawId = task.modality_id || mod?.id || task.id
                      const rawName = mod?.name || task.protocol_step?.modality?.name || ''
                      const canonKey = getCanonicalPeptideKey(rawId, rawName)
                      const isCompleted = task.status === 'completed'
                      const matchingCycle = cycles.find(
                        c => c.modalityId.toLowerCase() === canonKey.toLowerCase()
                      )
                      const protocolName = task.protocol_step?.protocol?.name || matchingCycle?.protocolName || (task.loose_modality as any)?.protocolTags?.[0]?.protocol_name || 'Peptide Protocol'
                      const protocolColor = (task.protocol_step?.protocol as any)?.color_hex || getColorForProtocol(protocolName)

                      return (
                        <div
                          key={task.id}
                          onClick={() => {
                            setSelectedTaskForModal(task)
                            if (matchingCycle) setSelectedCycle(matchingCycle)
                          }}
                          className={`p-2 rounded-xl border text-xs cursor-pointer transition-all space-y-1.5 group ${
                            isCompleted
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                              : 'text-slate-200 shadow-sm hover:border-opacity-100'
                          }`}
                          style={{
                            borderLeft: `3.5px solid ${protocolColor}`,
                            borderColor: isCompleted ? '#10B98160' : `${protocolColor}40`,
                            backgroundColor: isCompleted ? 'rgba(6, 78, 59, 0.35)' : `${protocolColor}0d`
                          }}
                        >
                          {/* Protocol Badge with Color Dot */}
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-wide uppercase truncate max-w-[125px]"
                              style={{
                                backgroundColor: `${protocolColor}20`,
                                color: protocolColor,
                                border: `1px solid ${protocolColor}40`
                              }}
                              title={protocolName}
                            >
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: protocolColor }} />
                              <span className="truncate">{protocolName}</span>
                            </span>

                            <button
                              onClick={e => handleToggleTaskStatus(task, e)}
                              className={`p-1 rounded-md transition-colors ${
                                isCompleted
                                  ? 'text-emerald-400 bg-emerald-500/20'
                                  : 'text-slate-500 hover:text-cyan-400 hover:bg-white/10'
                              }`}
                              title={isCompleted ? 'Mark pending' : 'Mark completed'}
                            >
                              <CheckCircle2 size={13} />
                            </button>
                          </div>

                          {/* Modality Title */}
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-extrabold truncate text-[11px] block leading-tight text-white group-hover:text-cyan-300 transition-colors">
                              {mod?.name || 'Peptide Dose'}
                            </span>
                          </div>

                          {/* Dose and Timing */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span className="truncate">
                              {task.execution_details?.dosage || 'Protocol dose'}
                            </span>
                            <span className="capitalize text-slate-300">
                              {(task.timing_slot || 'morning').replace('_', ' ')}
                            </span>
                          </div>

                          {/* Concept 1: Cycle Progression & Phase Bar (Mobile & Desktop First) */}
                          {matchingCycle && (
                            <div className="w-full space-y-1 mt-1.5 pt-1.5 border-t border-white/5">
                              <div className="flex items-center justify-between text-[9.5px] font-mono leading-none">
                                <span className="text-slate-400 font-bold tracking-tight">
                                  W{Math.min(Math.ceil(matchingCycle.cycleLengthDays / 7), Math.max(1, Math.ceil((matchingCycle.activeDaysCompleted || 1) / 7)))} · Day {matchingCycle.activeDaysCompleted || 1}/{matchingCycle.cycleLengthDays}
                                </span>
                                <span className="font-extrabold text-cyan-400">
                                  {Math.max(1, matchingCycle.progressPct)}%
                                </span>
                              </div>

                              {/* Progress Track */}
                              <div className="w-full bg-slate-800/90 h-1.5 rounded-full overflow-hidden flex">
                                <div
                                  className="h-full rounded-full transition-all duration-500 shadow-sm"
                                  style={{
                                    width: `${Math.max(6, Math.min(100, matchingCycle.progressPct || 1))}%`,
                                    background: isCompleted
                                      ? 'linear-gradient(to right, #06B6D4, #10B981)'
                                      : `linear-gradient(to right, ${protocolColor}, #06B6D4)`
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="h-full flex items-center justify-center py-4">
                      <span className="text-[10px] text-slate-600 font-mono">Rest / Off-Cycle</span>
                    </div>
                  )}
                </div>

                {/* Optional Day Wellbeing Footer */}
                {showWellbeingOverlay && dayCheckin && (
                  <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 text-purple-300">
                      <Sparkles size={10} />
                      <span>Energy: {dayCheckin.energy_0_10 ?? '—'}/10</span>
                    </span>
                    <span className="text-cyan-300">
                      Sleep: {dayCheckin.subjective_sleep_0_10 ?? '—'}/10
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. Cycle Intelligence & Stack Optimization Layer */}
      {showIntelligenceOverlay && cycles.length > 0 && (
        <CycleIntelligenceCard
          report={intelligenceReport}
          onAddOutcomeSlider={handleEnableOutcomeTracking}
          onOpenScheduleModal={modId => {
            const task = pulseTasks.find(
              t =>
                (t.modality_id || t.loose_modality?.id || t.protocol_step?.modality?.id)?.toLowerCase() ===
                modId.toLowerCase()
            )
            if (task) setManagingTask(task)
          }}
        />
      )}

      {/* 4. Active Cycle Cards with Deep Timeline & Pharmacokinetics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Dna size={14} className="text-cyan-400" />
            <span>Active Bioactive Cycles &amp; Receptor Recovery</span>
          </h3>
          <span className="text-xs text-slate-400">
            {cycles.length} Active in Stack
          </span>
        </div>

        {cycles.length > 0 ? (
          <div className="space-y-4">
            {cycles.map(cycle => {
              const pkPoints = computeWeeklyPKCurves(pulseTasks, weekDays, cycle)
              const correlatedBiomarkers = biomarkersByCycle[cycle.modalityId] || []

              return (
                <div
                  key={cycle.modalityId}
                  className="p-5 sm:p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-black shadow-2xl backdrop-blur-xl space-y-5"
                >
                  {/* Card Header & Controls */}
                  <div className="flex items-start justify-between flex-wrap gap-3 border-b border-white/10 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="text-base sm:text-lg font-black text-white">
                          {cycle.modalityName}
                        </h4>
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${cycle.phaseColor}`}>
                          {cycle.phaseLabel}
                        </span>
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                          {cycle.regulatoryStatus}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400">
                        Protocol: <strong className="text-slate-200">{cycle.protocolName}</strong> • Started:{' '}
                        <span className="text-slate-300 font-mono">{cycle.startDate}</span>
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const task = pulseTasks.find(
                            t =>
                              (t.modality_id || t.loose_modality?.id || t.protocol_step?.modality?.id)?.toLowerCase() ===
                              cycle.modalityId.toLowerCase()
                          )
                          if (task) setManagingTask(task)
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Customize schedule, dose, or cadences"
                      >
                        <Sliders size={13} className="text-cyan-400" />
                        <span>Schedule Tools</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedProtocolForCoach({ id: cycle.protocolId, name: cycle.protocolName })
                          setShowAiCoachModal(true)
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-xs font-bold text-indigo-300 border border-indigo-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Bot size={13} />
                        <span>AI Protocol Coach</span>
                      </button>

                      <button
                        onClick={() => setSelectedCycle(cycle)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-xs font-bold text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Evidence &amp; Specs</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 1. Cycle Timeline & Progress */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-black/40 border border-white/5">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Cycle Progression</span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-lg font-black text-white font-mono">
                          Day {cycle.activeDaysCompleted}
                        </span>
                        <span className="text-xs text-slate-400">of {cycle.cycleLengthDays} Days</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                          style={{ width: `${cycle.progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Adherence &amp; Dosing</span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-lg font-black text-cyan-400 font-mono">
                          {cycle.adherencePct}%
                        </span>
                        <span className="text-xs text-slate-400">
                          {cycle.totalDosesCompleted} / {cycle.totalDosesScheduled} Doses
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 truncate">
                        Spec: {cycle.dosageSpec} ({cycle.timingSlot})
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Reconstitution &amp; Vial Life</span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-lg font-black text-amber-300 font-mono">
                          ~{cycle.vialDaysRemaining || 28} Days
                        </span>
                        <span className="text-xs text-slate-400">Remaining</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Store 2°C–8°C refrigerated post-mixing
                      </p>
                    </div>
                  </div>

                  {/* 2. Pharmacokinetic (PK) Model Curve */}
                  {showPKCurvesOverlay && (
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <LineChart size={15} className="text-cyan-400" />
                          <span className="text-xs font-bold text-slate-200">
                            Estimated Active Biological Concentration (PK Decay Simulation)
                          </span>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono">
                          {cycle.halfLifeLabel} • {cycle.pkConfidence}
                        </span>
                      </div>

                      {/* 7-Day PK Bar Graph */}
                      <div className="grid grid-cols-7 gap-2 pt-2">
                        {pkPoints.map((point, idx) => (
                          <div key={point.date} className="flex flex-col items-center gap-1.5">
                            <div className="w-full bg-slate-800/80 h-16 rounded-xl flex items-end p-1 relative overflow-hidden group">
                              <div
                                className={`w-full rounded-lg transition-all ${
                                  point.doseLoggedToday
                                    ? 'bg-gradient-to-t from-emerald-500 to-cyan-400 shadow-md shadow-cyan-900/40'
                                    : 'bg-gradient-to-t from-cyan-900/60 to-cyan-500/60'
                                }`}
                                style={{ height: `${point.estimatedRelativeLevel}%` }}
                              />
                              {point.doseLoggedToday && (
                                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-black" />
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">
                              {point.dayLabel}
                            </span>
                          </div>
                        ))}
                      </div>

                      <p className="text-[10px] text-slate-500 leading-relaxed italic">
                        * Pharmacokinetic Model Approximation: Exponential elimination decay modeled via C(t) = C₀ · e^(-kₑ · t) based on published clinical half-life data. Designed to visualize metabolic clearance and avoid false precision.
                      </p>
                    </div>
                  )}

                  {/* 3. Correlated Blood Biomarkers Overlay */}
                  {showBiomarkersOverlay && correlatedBiomarkers.length > 0 && (
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity size={15} className="text-emerald-400" />
                          <span className="text-xs font-bold text-slate-200">
                            Correlated Bloodwork &amp; Clinical Biomarkers
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Pre-Cycle Baseline vs Intra-Cycle
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {correlatedBiomarkers.map(biom => (
                          <div
                            key={biom.biomarkerId}
                            className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-white">
                                {biom.biomarkerName}
                              </span>
                              {biom.deltaPercent !== null && (
                                <span
                                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                                    biom.deltaPercent > 0
                                      ? 'bg-cyan-500/20 text-cyan-300'
                                      : 'bg-purple-500/20 text-purple-300'
                                  }`}
                                >
                                  {biom.deltaPercent > 0 ? `+${biom.deltaPercent}%` : `${biom.deltaPercent}%`}
                                </span>
                              )}
                            </div>

                            <p className="text-[10px] text-slate-400 line-clamp-1">
                              {biom.clinicalRelevance}
                            </p>

                            <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-slate-300">
                              <span>Base: {biom.preCycleBaseline ? `${biom.preCycleBaseline.value} ${biom.unit}` : 'N/A'}</span>
                              <span className="text-cyan-400">
                                Active: {biom.intraCycleActive ? `${biom.intraCycleActive.value} ${biom.unit}` : 'Pending'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
            <Dna size={32} className="text-cyan-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">No Peptide Cycles in Active Stack</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Explore the peptide catalog to enroll in evidence-based stacks (e.g. Wolverine Stack, CJC/Ipamorelin, Epitalon, or MOTS-c) and monitor their biological trajectory.
              </p>
            </div>
            <button
              onClick={() => router.push('/explore')}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus size={14} />
              <span>Explore Peptide Protocols</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. Modality & Cycle Deep Detail Drawer Modal (Full Modality & Expandable View) */}
      {(selectedCycle || selectedTaskForModal) && (() => {
        const activeCycle = selectedCycle || (() => {
          if (!selectedTaskForModal) return null
          const mod = selectedTaskForModal.loose_modality || selectedTaskForModal.protocol_step?.modality
          const rawId = selectedTaskForModal.modality_id || mod?.id || selectedTaskForModal.id
          const rawName = mod?.name || selectedTaskForModal.protocol_step?.modality?.name || ''
          const canonKey = getCanonicalPeptideKey(rawId, rawName)
          return cycles.find(c => c.modalityId.toLowerCase() === canonKey.toLowerCase()) || null
        })()

        const activeTask = selectedTaskForModal || (() => {
          if (!activeCycle) return null
          return pulseTasks.find(t => {
            const mod = t.loose_modality || t.protocol_step?.modality
            const rawId = t.modality_id || mod?.id || t.id
            const rawName = mod?.name || t.protocol_step?.modality?.name || ''
            return getCanonicalPeptideKey(rawId, rawName) === activeCycle.modalityId
          }) || null
        })()

        const protocolName = activeTask?.protocol_step?.protocol?.name || activeCycle?.protocolName || (activeTask?.loose_modality as any)?.protocolTags?.[0]?.protocol_name || 'Peptide Protocol'
        const protocolColor = (activeTask?.protocol_step?.protocol as any)?.color_hex || getColorForProtocol(protocolName)

        const closeModal = () => {
          setSelectedCycle(null)
          setSelectedTaskForModal(null)
        }

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
            onClick={closeModal}
          >
            <div
              className="relative w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl p-4 sm:p-6 space-y-5 max-h-[92vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header with Protocol Color Coding */}
              <div className="flex items-start justify-between border-b border-white/10 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-white">
                      {activeCycle?.modalityName || activeTask?.loose_modality?.name || 'Peptide Modality'}
                    </h3>
                    {activeCycle && (
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${activeCycle.phaseColor}`}>
                        {activeCycle.phaseLabel}
                      </span>
                    )}
                  </div>
                  
                  {/* Protocol Pill */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border"
                      style={{
                        backgroundColor: `${protocolColor}20`,
                        borderColor: `${protocolColor}50`,
                        color: protocolColor
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: protocolColor }} />
                      <span>{protocolName}</span>
                    </span>
                    {activeCycle && (
                      <span className="text-xs text-slate-400 font-mono">
                        • Evidence: <strong className="text-slate-200">{activeCycle.evidenceLevel}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 1. Full Interactive ProtocolTaskCard (defaultExpanded={true}) */}
              {activeTask && (
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2 shadow-inner">
                  <ProtocolTaskCard
                    task={{
                      ...activeTask,
                      scheduled_date: activeTask.scheduled_date || format(new Date(), 'yyyy-MM-dd'),
                      rawTask: activeTask
                    } as any}
                    userProfile={userProfile}
                    recentTasks={tasks}
                    allOutcomes={allOutcomes}
                    defaultExpanded={true}
                    onStatusChange={async (taskId, newStatus) => {
                      const mappedStatus = (newStatus === 'eliminated' ? 'skipped' : newStatus) as DailyProtocolTask['status']
                      await updateDailyTaskStatus(taskId, mappedStatus)
                      closeModal()
                      router.refresh()
                    }}
                    onOpenRescheduleModal={t => {
                      closeModal()
                      setManagingTask(t)
                    }}
                  />
                </div>
              )}

              {/* 2. Dosing & Administration Specs & Guidelines */}
              {activeCycle && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={13} className="text-cyan-400" />
                    <span>Dosing &amp; Administration Protocols</span>
                  </h4>
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 text-xs text-slate-300 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                      <p>
                        <strong className="text-white">Dosage Spec:</strong> {activeCycle.dosageSpec} ({activeCycle.timingSlot})
                      </p>
                      <p className="font-mono text-cyan-300">
                        <strong>Half-Life:</strong> {activeCycle.halfLifeLabel}
                      </p>
                    </div>
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Administration Guidelines:</span>
                      {activeCycle.administrationTips.map((tip, idx) => (
                        <p key={idx} className="text-slate-400 flex items-center gap-1.5">
                          <span className="text-cyan-400">•</span>
                          <span>{tip}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Scientific Evidence, Regulatory & Contraindications */}
              {activeCycle && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    <span>Scientific Evidence &amp; Safety Profile</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Regulatory Status:</span>
                      <p className="text-slate-200 font-medium">{activeCycle.regulatoryStatus}</p>
                      <a
                        href={activeCycle.pubmedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline pt-1"
                      >
                        <span>View PubMed Clinical Studies</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase flex items-center gap-1">
                        <AlertTriangle size={12} />
                        <span>Contraindications &amp; Precautions:</span>
                      </span>
                      {activeCycle.contraindications.map((contra, idx) => (
                        <p key={idx} className="text-[11px] text-amber-200/90 leading-tight">
                          • {contra}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Modal Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10 flex-wrap gap-2">
                <button
                  onClick={() => {
                    closeModal()
                    setShowShareableReport(true)
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText size={14} className="text-cyan-400" />
                  <span>Generate Clinical Report</span>
                </button>

                <button
                  onClick={() => {
                    if (activeTask) {
                      setManagingTask(activeTask)
                      closeModal()
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Sliders size={14} />
                  <span>Open Schedule Customizer</span>
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* 6. Body Composition & Progress Photo Modal */}
      {showBodyCompModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-cyan-400" />
                <h3 className="text-sm font-extrabold text-white">Log Body Composition &amp; Physique Photo</h3>
              </div>
              <button
                onClick={() => setShowBodyCompModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Weight (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={e => setNewWeight(e.target.value)}
                  placeholder="175.5"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Muscle Mass %</label>
                <input
                  type="number"
                  step="0.1"
                  value={newMusclePct}
                  onChange={e => setNewMusclePct(e.target.value)}
                  placeholder="42.0"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Body Fat %</label>
                <input
                  type="number"
                  step="0.1"
                  value={newBodyFatPct}
                  onChange={e => setNewBodyFatPct(e.target.value)}
                  placeholder="14.5"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Photo Upload Area */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase block">Progress Photo (Compressed &amp; Secure in IndexedDB)</label>
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-4 text-center hover:border-cyan-500/50 transition-colors">
                {uploadedPhotoUrl ? (
                  <div className="relative inline-block">
                    <img src={uploadedPhotoUrl} alt="Preview" className="h-36 rounded-xl object-cover" />
                    <button
                      onClick={() => setUploadedPhotoUrl(null)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer space-y-1 block">
                    <Upload size={20} className="text-cyan-400 mx-auto" />
                    <span className="text-xs text-slate-300 font-bold block">
                      {isCompressingPhoto ? 'Compressing...' : 'Click to Upload Progress Photo'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">PNG, JPG up to 15MB (Auto-compressed to ~120KB)</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBodyCompModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBodyComp}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Schedule Customizer Modal (Reusing LEVL's ManageTaskModal) */}
      {managingTask && (
        <ManageTaskModal
          task={{
            ...managingTask,
            scheduled_date: managingTask.scheduled_date || format(new Date(), 'yyyy-MM-dd'),
            rawTask: managingTask
          } as any}
          isOpen={true}
          onClose={() => setManagingTask(null)}
          onSaveSuccess={() => {
            setManagingTask(null)
            router.refresh()
          }}
        />
      )}

      {/* 8. Shareable Clinician Protocol Report Modal */}
      <ShareablePeptideReportModal
        isOpen={showShareableReport}
        onClose={() => setShowShareableReport(false)}
        cycles={cycles}
        effectivenessReports={effectivenessReports}
        biomarkersByCycle={biomarkersByCycle}
        bodyRecords={bodyRecords}
        intelligenceReport={intelligenceReport}
        userName={userProfile?.display_name || 'Patient'}
      />

      {/* 9. AI Protocol Coach Modal */}
      {showAiCoachModal && selectedProtocolForCoach && (
        <ProtocolActionModal
          protocolName={selectedProtocolForCoach.name}
          groupTasks={pulseTasks as any}
          isOpen={true}
          onClose={() => setShowAiCoachModal(false)}
          onSuccess={() => {
            setShowAiCoachModal(false)
            router.refresh()
          }}
        />
      )}

      {/* 10. Fridge Stock & Vial Inventory Modal */}
      {showFridgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <ThermometerSnowflake size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Reconstituted Fridge Inventory</h3>
                  <p className="text-xs text-slate-400">Track active liquid fill volumes &amp; 28-day sterile stability</p>
                </div>
              </div>
              <button
                onClick={() => setShowFridgeModal(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {cycles.length > 0 ? (
                cycles.map((cycle) => (
                  <FridgeVialInventoryCard
                    key={cycle.modalityId || cycle.protocolId}
                    modalityKey={cycle.modalityId || cycle.protocolId}
                    modalityName={cycle.modalityName}
                  />
                ))
              ) : (
                <FridgeVialInventoryCard
                  modalityKey="bpc_157_subq"
                  modalityName="BPC-157 SubQ"
                />
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                onClick={() => setShowFridgeModal(false)}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Longitudinal Dose Titration & Step-Up Ramp Modal */}
      {showTitrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Dose Titration &amp; Step-Up Planner</h3>
                  <p className="text-xs text-slate-400">Configure multi-phase progressive step escalations across cycle weeks</p>
                </div>
              </div>
              <button
                onClick={() => setShowTitrationModal(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {cycles.length > 0 ? (
                cycles.map((cycle) => {
                  const parsedDose = parseFloat(cycle.dosageSpec) || 250
                  const isMg = cycle.dosageSpec.toLowerCase().includes('mg')
                  return (
                    <PeptideTitrationPlanner
                      key={cycle.modalityId || cycle.protocolId}
                      modalityKey={cycle.modalityId || cycle.protocolId}
                      modalityName={cycle.modalityName}
                      currentDoseAmount={parsedDose}
                      doseUnit={isMg ? 'mg' : 'mcg'}
                    />
                  )
                })
              ) : (
                <PeptideTitrationPlanner
                  modalityKey="tirzepatide"
                  modalityName="Tirzepatide GLP-1/GIP"
                  currentDoseAmount={2.5}
                  doseUnit="mg"
                />
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                onClick={() => setShowTitrationModal(false)}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
