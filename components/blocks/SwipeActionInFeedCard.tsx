'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Check,
  X,
  Clock,
  SkipForward,
  Sliders,
  Sparkles,
  Archive,
  Trash2,
  ArrowRight,
  Zap,
  RefreshCw,
  Activity,
  ChevronDown,
  ChevronUp,
  Star,
  Target,
  Pill
} from 'lucide-react'
import { DedupedTask, TimePickerWithAmPmToggle } from '@/components/cards/ProtocolTaskCard'
import { Modality, OutcomeDimension, UserProfile, UserBenchItem } from '@/lib/types'
import { getSimplifiedModalityName } from './blocksUtils'
import { useTheme } from '@/lib/utils/useTheme'
import { DosageDetailModal } from '@/components/modals/DosageDetailModal'
import { getOutcomeColorConfig, getNeutralOutcomeColorConfig } from '@/lib/utils/outcomeColors'
import { isPreLoggableOutcome, hasAnyPreLoggableOutcome, getOutcomePhaseType } from '@/lib/utils/outcomePhaseRules'
import { getPeakOnsetGuidance } from '@/lib/utils/peakOnsetGuidance'
import { getRecentOutcomeSnapshot } from '@/lib/utils/outcomeRecency'
import { getModalityArchetype } from '@/lib/data/modalityArchetypes'
import {
  isInjectableSubQPeptide,
  resolvePeptideTargetDoseMcg,
  saveInjectionSiteLog
} from '@/lib/peptides/reconstitutionEngine'
import { addToBench, eliminateModality, getTaskOutcomeObservations, saveBatchOutcomeObservations } from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'

// Precision execution log components
import StrengthExecutionLog from '../execution/StrengthExecutionLog'
import ThermalExecutionLog from '../execution/ThermalExecutionLog'
import CardioExecutionLog from '../execution/CardioExecutionLog'
import BreathworkExecutionLog from '../execution/BreathworkExecutionLog'
import NSDRExecutionLog from '../execution/NSDRExecutionLog'
import FastingExecutionLog from '../execution/FastingExecutionLog'
import NutritionMacroExecutionLog from '../execution/NutritionMacroExecutionLog'
import RedLightExecutionLog from '../execution/RedLightExecutionLog'
import CGMExecutionLog from '../execution/CGMExecutionLog'
import BlueLightDimmingExecutionLog from '../execution/BlueLightDimmingExecutionLog'
import SunlightCircadianExecutionLog from '../execution/SunlightCircadianExecutionLog'
import SleepHygieneExecutionLog from '../execution/SleepHygieneExecutionLog'
import CaffeineCutoffExecutionLog from '../execution/CaffeineCutoffExecutionLog'
import HydrationElectrolyteExecutionLog from '../execution/HydrationElectrolyteExecutionLog'
import PeptideExecutionLog from '../execution/PeptideExecutionLog'
import SupplementExecutionLog from '../execution/SupplementExecutionLog'
import TopicalSkincareExecutionLog from '../execution/TopicalSkincareExecutionLog'
import BiometricPhlebotomyExecutionLog from '../execution/BiometricPhlebotomyExecutionLog'

interface SwipeActionInFeedCardProps {
  actionType: 'complete' | 'skip_snooze'
  task: DedupedTask
  modality?: Modality | null
  benchItem?: UserBenchItem | null
  allOutcomes?: OutcomeDimension[]
  userProfile?: UserProfile | null
  onClose: () => void
  onComplete: (
    taskId: string,
    outcomes?: Record<string, number>,
    customDose?: string,
    completedAt?: string,
    notes?: string,
    executionDetails?: Record<string, any>,
    preOutcomes?: Record<string, number>
  ) => void
  onSkip: (taskId: string, reason?: string) => void
  onSnooze: (taskId: string, snoozeSlotOrMinutes: string | number) => void
  onMoveToBench?: (modalityId: string) => void
  onEliminate?: (task: DedupedTask, reason?: string) => void
}

export default function SwipeActionInFeedCard({
  actionType,
  task,
  modality,
  benchItem,
  allOutcomes = [],
  userProfile,
  onClose,
  onComplete,
  onSkip,
  onSnooze,
  onMoveToBench,
  onEliminate
}: SwipeActionInFeedCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)
  const isOutOfViewRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const { theme } = useTheme()
  const isDaylight = theme === 'light'

  // Completion Time: defaults to NOW on mount without needing to click in
  const getInitialTimeString = () => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }
  const [completedTime, setCompletedTime] = useState<string>(getInitialTimeString)

  // Outcome Phase State (Before vs After)
  const [activeOutcomePhase, setActiveOutcomePhase] = useState<'pre' | 'post'>('post')
  const [isBestTimeExpanded, setIsBestTimeExpanded] = useState(false)
  const [isOutcomeExecutionExpanded, setIsOutcomeExecutionExpanded] = useState(false)

  // Execution Details state for precision logs
  const [executionDetails, setExecutionDetails] = useState<any>(() => {
    return task.execution_details || {}
  })

  // Baseline & Post-session outcome state (0-10 scale)
  const [baselineOutcomesMap, setBaselineOutcomesMap] = useState<Record<string, number>>({})
  const [inlinePreValues, setInlinePreValues] = useState<Record<string, number>>({})
  const [inlinePostValues, setInlinePostValues] = useState<Record<string, number>>({})
  const [touchedPreOutcomes, setTouchedPreOutcomes] = useState<Record<string, boolean>>({})
  const [touchedPostOutcomes, setTouchedPostOutcomes] = useState<Record<string, boolean>>({})
  const [taskObs, setTaskObs] = useState<any[]>([])
  const [outcomeNotes, setOutcomeNotes] = useState<string>('')
  const [isSavingOutcomes, setIsSavingOutcomes] = useState(false)
  const [outcomesSavedDone, setOutcomesSavedDone] = useState(false)

  // Robust Dose adjustment & DosageDetailModal popup
  const defaultDose = task.execution_details?.custom_dose || benchItem?.custom_dose || modality?.dose_or_exposure || ''
  const [doseInput, setDoseInput] = useState(defaultDose)
  const [isDosageModalOpen, setIsDosageModalOpen] = useState(false)

  const [skipReason, setSkipReason] = useState('Skipped for today')
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Modality Archetype & Specialized Trait Resolution
  const modalityKey = (modality?.slug || modality?.id || modality?.name || '').toLowerCase()
  const archetypeProfile = useMemo(() => getModalityArchetype(modality), [modality])
  const {
    archetype,
    lockedExerciseName,
    lockedCardioType,
    specializedTraits
  } = archetypeProfile

  const isThermal = archetype === 'thermal'
  const isBreathwork = archetype === 'breathwork'
  const isNSDR = archetype === 'nsdr'
  const isCardio = archetype === 'cardio'
  const isStrength = archetype === 'strength'
  const isFasting = archetype === 'fasting'
  const isNutritionMacro = archetype === 'nutrition_macro'
  const isRedLight = archetype === 'red_light'
  const isCGM = archetype === 'cgm'
  const isBlueLightDimming = archetype === 'blue_light_dimming'
  const isSunlight = archetype === 'sunlight'
  const isCaffeineCutoff =
    archetype === 'caffeine_cutoff' ||
    modality?.id === 'walker_caffeine_cutoff' ||
    modality?.id === 'caffeine_cutoff' ||
    (modality?.slug || '').includes('caffeine_cutoff') ||
    (modality?.slug || '').includes('caffeine-cutoff') ||
    (modality?.name || '').toLowerCase().includes('caffeine cutoff') ||
    (task.execution_details?.custom_name || '').toLowerCase().includes('caffeine cutoff')

  const isSleepHygiene = archetype === 'sleep' && !isCaffeineCutoff
  const isHydration = archetype === 'hydration'
  const isPhlebotomy = archetype === 'phlebotomy'
  const isPeptide = isInjectableSubQPeptide(modality, task)
  const isSupplement = archetype === 'supplement'
  const isSkincare =
    archetype === 'skincare' ||
    (modality?.category || '').toLowerCase().includes('skin') ||
    (modality?.modality_type || '').toLowerCase().includes('topical') ||
    /\b(topical|serum|cream|lotion|tretinoin|skincare|cleanser|moisturizer|sunscreen)\b/i.test(
      `${modalityKey} ${modality?.name || ''}`.toLowerCase()
    )

  const hasPrecisionLogUI = archetype !== 'general' || isCaffeineCutoff

  // Load existing observations and baseline for this task on mount
  useEffect(() => {
    const localUserId = getLocalUserId()
    const dateStr = task.scheduled_date || new Date().toISOString().split('T')[0]
    getTaskOutcomeObservations(localUserId, task.id, dateStr).then((obs) => {
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
      } else if (task.execution_details?.logged_outcomes) {
        const baseMap: Record<string, number> = {}
        const postInit: Record<string, number> = {}
        const touchedPost: Record<string, boolean> = {}
        if (Array.isArray(task.execution_details.logged_outcomes)) {
          task.execution_details.logged_outcomes.forEach((lo: any) => {
            if (lo.preValue !== undefined) baseMap[lo.outcomeId] = lo.preValue
            if (lo.postValue !== undefined) {
              postInit[lo.outcomeId] = lo.postValue
              touchedPost[lo.outcomeId] = true
            }
          })
        }
        setBaselineOutcomesMap(baseMap)
        setInlinePostValues(postInit)
        setTouchedPostOutcomes(touchedPost)
      }
    })
  }, [task.id, task.scheduled_date])

  const handleMoveToBench = async () => {
    try {
      setIsActionLoading(true)
      const localUserId = getLocalUserId()
      const mId = modality?.id || task.modality_id || task.protocol_step?.modality_id
      if (!mId) return

      if (onMoveToBench) {
        onMoveToBench(mId)
      } else {
        await addToBench(localUserId, mId)
      }

      onSkip(task.id, `Moved to Bench (${skipReason})`)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('levl_schedule_updated'))
        window.dispatchEvent(new CustomEvent('levl_tasks_updated'))
      }
      onClose()
    } catch (err) {
      console.error('Error moving to bench:', err)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleEliminate = async () => {
    try {
      setIsActionLoading(true)
      const localUserId = getLocalUserId()
      const mId = modality?.id || task.modality_id || task.protocol_step?.modality_id
      if (!mId) return

      if (onEliminate) {
        onEliminate(task, skipReason)
      } else {
        await eliminateModality(localUserId, mId, `Eliminated from Schedule (${skipReason})`, task.id, [skipReason])
      }

      onSkip(task.id, `Eliminated from Schedule (${skipReason})`)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('levl_schedule_updated'))
        window.dispatchEvent(new CustomEvent('levl_tasks_updated'))
      }
      onClose()
    } catch (err) {
      console.error('Error eliminating modality:', err)
    } finally {
      setIsActionLoading(false)
    }
  }

  const simplifiedName = getSimplifiedModalityName(modality, task)

  // Extract relevant outcome dimensions using standardized multi-tier resolution
  const relevantOutcomes = useMemo(() => {
    let outcomeIds: string[] = []

    // 1. User custom outcomes if configured on bench
    if (benchItem?.custom_outcomes && Array.isArray(benchItem.custom_outcomes) && benchItem.custom_outcomes.length > 0) {
      outcomeIds = benchItem.custom_outcomes
    } else {
      // 2. Modality specific functional outcomes & impacts
      let functionalOutcomes = modality?.functional_outcomes_to_track || []
      if (typeof functionalOutcomes === 'string') {
        const cleaned = (functionalOutcomes as string).replace(/^{|}$/g, '')
        functionalOutcomes = cleaned ? cleaned.split(',') : []
      }
      const impactKeys = modality?.functional_impacts ? Object.keys(modality.functional_impacts) : []
      outcomeIds = [
        modality?.primary_outcome,
        ...(modality?.secondary_outcomes || []),
        ...functionalOutcomes,
        ...impactKeys
      ].filter(Boolean) as string[]
    }

    const normalizedKeys = outcomeIds.map((s) => s.toLowerCase().trim().replace(/\s+/g, '_'))
    let list = allOutcomes.filter((o) =>
      normalizedKeys.includes(o.id.toLowerCase()) ||
      normalizedKeys.includes(o.id.toLowerCase().replace(/_/g, ' ')) ||
      normalizedKeys.includes(o.name.toLowerCase()) ||
      normalizedKeys.includes(o.name.toLowerCase().replace(/\s+/g, '_'))
    )

    // Fallback to high-signal outcomes based on modality type
    if (list.length === 0) {
      const nameLower = (
        simplifiedName ||
        modality?.display_name ||
        modality?.name ||
        ''
      ).toLowerCase()
      const catLower = (modality?.category || '').toLowerCase()

      if (
        nameLower.includes('cold') ||
        nameLower.includes('sauna') ||
        nameLower.includes('thermal') ||
        catLower.includes('recovery')
      ) {
        list = allOutcomes.filter((o) => ['focus', 'energy', 'calmness', 'stress', 'soreness', 'joint_comfort', 'mood'].includes(o.id))
      } else if (
        nameLower.includes('workout') ||
        nameLower.includes('lifting') ||
        nameLower.includes('push') ||
        nameLower.includes('pull') ||
        nameLower.includes('legs') ||
        catLower.includes('exercise')
      ) {
        list = allOutcomes.filter((o) => ['strength', 'energy', 'soreness', 'joint_comfort', 'focus', 'mood'].includes(o.id))
      } else if (catLower.includes('sleep') || nameLower.includes('sleep') || nameLower.includes('bed')) {
        list = allOutcomes.filter((o) => ['sleep_quality', 'calmness', 'recovery', 'stress'].includes(o.id))
      } else {
        list = allOutcomes.filter((o) => ['energy', 'focus', 'calmness', 'mood'].includes(o.id))
      }
    }

    return list.slice(0, 5)
  }, [modality, benchItem, allOutcomes, simplifiedName])

  const hasPreLoggableOutcomes = useMemo(() => {
    return relevantOutcomes.some((o) => isPreLoggableOutcome(o.id))
  }, [relevantOutcomes])

  const visibleOutcomes = useMemo(() => {
    if (activeOutcomePhase === 'pre') {
      return relevantOutcomes.filter((o) => isPreLoggableOutcome(o.id))
    }
    return relevantOutcomes
  }, [activeOutcomePhase, relevantOutcomes])

  // User Priority Map calculation
  const userPriorityMap = useMemo(() => {
    const map = new Map<string, { isPriority: boolean; label: string; score: number }>()
    if (!userProfile) return map

    const prefs = (userProfile.outcome_preference_scores as Record<string, number>) || {}
    const goals = (userProfile.primary_goals || []).map((f: string) => f.toLowerCase())

    allOutcomes.forEach((o) => {
      const nameLower = o.name.toLowerCase()
      const score = prefs[o.id] ?? prefs[nameLower] ?? 0
      const matchesGoal = goals.some((g) => nameLower.includes(g) || g.includes(nameLower))

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

  // Helper for completed summary text in Session Execution Numbers
  const getCompletedSummaryText = () => {
    const d = executionDetails && Object.keys(executionDetails).length > 0 ? executionDetails : task.execution_details
    if (d && Object.keys(d).length > 0) {
      if (d.custom_dose) return d.custom_dose
      if (d.duration && d.distance && d.avg_hr) return `${d.duration}m • ${d.distance} mi @ ${d.avg_hr} bpm`
      if (d.duration && d.avg_hr) return `${d.duration}m @ ${d.avg_hr} bpm`
      if (d.duration && d.distance) return `${d.duration}m • ${d.distance} mi`
      if (d.duration && d.cardio_type && !d.cardio_type.includes('Select')) return `${d.duration}m • ${d.cardio_type}`
      if (d.distance && d.avg_hr) return `${d.distance} mi @ ${d.avg_hr} bpm`
      if (d.duration && d.temperature) return `${d.duration}m @ ${d.temperature}°${d.temperature_unit || 'F'}`
      if (d.exposure_type && d.duration) return `${d.exposure_type.replace('_', ' ')} • ${d.duration}m`
      if (d.round_details && d.round_details.length > 0) return `${d.round_details.length} rounds logged`
      if (d.sets && d.sets.length > 0) {
        const allSame = d.sets.every((s: any) => s.weight === d.sets[0].weight && s.reps === d.sets[0].reps)
        if (allSame) return `${d.sets.length} sets @ ${d.sets[0].weight}lbs × ${d.sets[0].reps} reps`
        return `${d.sets.length} sets logged`
      }
      if (d.duration && d.fast_type) return `${d.duration}h Fast (${d.fast_type})`
      if (d.duration && (isFasting || (modality?.modality_type || '').includes('fast'))) return `${d.duration} Hours Fasted`
      if (d.brainwave_state_reached || d.preset_type || (d.duration && (isNSDR || (modality?.name || '').toLowerCase().includes('nsdr') || (modality?.name || '').toLowerCase().includes('nidra')))) {
        const stateStr = d.brainwave_state_reached === 'theta' ? 'Theta State' : d.brainwave_state_reached === 'alpha' ? 'Alpha State' : 'Deep Rest'
        return `${d.duration || 20}m NSDR (${stateStr})`
      }
      if (d.duration && d.protocol_type) return `${d.duration}m • ${d.protocol_type}`
      if (d.max_retention_sec) return `Max Hold ${d.max_retention_sec}s`
      if (d.duration) return `${d.duration} mins logged`
    }
    return doseInput || defaultDose || ''
  }

  const completedSummaryText = getCompletedSummaryText()

  // Save observations and execute task completion (or save baseline)
  const handleSaveInlineOutcomes = async (forceComplete?: boolean) => {
    setIsSavingOutcomes(true)
    try {
      const localUserId = getLocalUserId()
      const dateStr = task.scheduled_date || new Date().toISOString().split('T')[0]
      const batchInputs: any[] = []
      const targetModalityId = modality?.id || task.modality_id || task.protocol_step?.modality_id || ''

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
        setBaselineOutcomesMap((prev) => ({ ...prev, ...baseMap }))
      }

      const shouldComplete = forceComplete || activeOutcomePhase !== 'pre'

      if (shouldComplete) {
        const loggedOutcomes = relevantOutcomes.map((out) => {
          const preVal = inlinePreValues[out.id] ?? baselineOutcomesMap[out.id]
          const postVal = inlinePostValues[out.id]
          return {
            outcomeId: out.id,
            outcomeName: out.name,
            directionality: out.directionality || 'higher_is_better',
            preValue: preVal !== undefined ? Number(preVal) : undefined,
            postValue: postVal !== undefined ? Number(postVal) : undefined
          }
        }).filter((o) => o.preValue !== undefined || o.postValue !== undefined)

        const finalDose = doseInput !== defaultDose ? doseInput : (doseInput || undefined)
        const postRatings = Object.keys(touchedPostOutcomes).some((k) => touchedPostOutcomes[k])
          ? Object.keys(touchedPostOutcomes).reduce((acc, id) => {
              if (touchedPostOutcomes[id]) {
                acc[id] = inlinePostValues[id] ?? 5
              }
              return acc
            }, {} as Record<string, number>)
          : undefined

        const preRatings = Object.keys(touchedPreOutcomes).some((k) => touchedPreOutcomes[k])
          ? Object.keys(touchedPreOutcomes).reduce((acc, id) => {
              if (touchedPreOutcomes[id]) {
                acc[id] = inlinePreValues[id] ?? 5
              }
              return acc
            }, {} as Record<string, number>)
          : undefined

        let d = new Date()
        const baseDateStr = task.scheduled_date
        if (baseDateStr) {
          const [y, mon, day] = baseDateStr.split('-').map(Number)
          if (y && mon && day) {
            d = new Date(y, mon - 1, day)
          }
        }
        const [h, m] = completedTime.split(':')
        if (h !== undefined && m !== undefined) {
          d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0)
        }
        const completedAtIso = d.toISOString()

        const rawDetails = (executionDetails && Object.keys(executionDetails).length > 0) ? executionDetails : task.execution_details || {}
        const effectiveDetails = {
          ...rawDetails,
          ...(finalDose ? { custom_dose: finalDose } : {}),
          logged_outcomes: loggedOutcomes
        }

        if (isPeptide) {
          const site = effectiveDetails?.injection_site || 'abdomen_lower_right'
          saveInjectionSiteLog(modalityKey, site)
        }

        onComplete(
          task.id,
          postRatings,
          finalDose,
          completedAtIso,
          outcomeNotes.trim() || undefined,
          effectiveDetails,
          preRatings
        )
      } else {
        // Saved baseline observations!
        setOutcomesSavedDone(true)
        setTimeout(() => setOutcomesSavedDone(false), 2500)
        setActiveOutcomePhase('post')
      }
    } catch (err) {
      console.error('Error saving inline outcomes in feed card:', err)
    } finally {
      setIsSavingOutcomes(false)
    }
  }

  // 1. Intersection Observer for Scroll-Away 5-Second Timer
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry.isIntersecting) {
          // Scrolled completely out of view -> Start 5s countdown
          isOutOfViewRef.current = true
          setSecondsRemaining(5)
        } else {
          // Scrolled back into view -> Cancel countdown immediately
          isOutOfViewRef.current = false
          setSecondsRemaining(null)
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // 2. Countdown handler when out of view
  useEffect(() => {
    if (secondsRemaining === null) return

    if (secondsRemaining <= 0) {
      // 5s elapsed while out of view -> auto-action
      if (actionType === 'complete') {
        handleSaveInlineOutcomes(true)
      } else {
        onSkip(task.id, skipReason)
      }
      return
    }

    timerRef.current = setTimeout(() => {
      if (isOutOfViewRef.current) {
        setSecondsRemaining((prev) => (prev !== null ? prev - 1 : null))
      }
    }, 1000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [secondsRemaining, actionType, task.id, doseInput, defaultDose, inlinePostValues, inlinePreValues, completedTime, outcomeNotes, skipReason, executionDetails])

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 my-2 transition-all duration-300 border shadow-2xl relative animate-in fade-in zoom-in-95 ${
        isDaylight
          ? actionType === 'complete'
            ? 'bg-emerald-50/95 border-emerald-300 text-slate-800 shadow-emerald-900/10'
            : 'bg-amber-50/95 border-amber-300 text-slate-800 shadow-amber-900/10'
          : actionType === 'complete'
          ? 'bg-gradient-to-br from-emerald-950/95 via-slate-950/98 to-slate-900 border-emerald-500/40 shadow-emerald-950/40 text-white'
          : 'bg-gradient-to-br from-amber-950/95 via-slate-950/98 to-slate-900 border-amber-500/40 shadow-amber-950/40 text-white'
      }`}
    >
      {/* 5-Second Countdown Visual Progress Bar */}
      {secondsRemaining !== null && (
        <div className="w-full bg-black/20 dark:bg-white/10 rounded-full h-1.5 overflow-hidden mb-3">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              actionType === 'complete' ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, (secondsRemaining / 5) * 100))}%` }}
          />
        </div>
      )}

      {/* Top Header */}
      <div className={`flex items-center justify-between gap-2 border-b pb-2.5 mb-3 ${isDaylight ? 'border-slate-200' : 'border-white/10'}`}>
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              actionType === 'complete'
                ? isDaylight ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : isDaylight ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}
          >
            {actionType === 'complete' ? <Check size={14} strokeWidth={3} /> : <Clock size={14} strokeWidth={2.5} />}
          </div>
          <span className={`text-xs sm:text-sm font-bold truncate ${isDaylight ? 'text-slate-900' : 'text-white'}`}>
            {actionType === 'complete' ? `Complete ${simplifiedName}` : `Skip or Snooze ${simplifiedName}`}
          </span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          title="Cancel and close"
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isDaylight ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-600 hover:text-slate-900' : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white'
          }`}
        >
          <X size={14} />
        </button>
      </div>

      {/* COMPLETE VIEW */}
      {actionType === 'complete' && (
        <div className="space-y-3">
          {/* Phase Tabs: Before Modality vs After Modality (on the same page like classic) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
            {hasPreLoggableOutcomes && (
              <div className={`w-full sm:w-auto grid grid-cols-2 gap-1 p-1 rounded-xl border ${
                isDaylight ? 'bg-slate-100 border-slate-200' : 'bg-black/60 border-white/15'
              }`}>
                <button
                  type="button"
                  onClick={() => setActiveOutcomePhase('pre')}
                  className={`w-full py-2 sm:py-1 px-3.5 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                    activeOutcomePhase === 'pre'
                      ? 'bg-purple-600 text-white shadow-md'
                      : isDaylight ? 'text-slate-500 hover:text-slate-900' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Before Modality
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOutcomePhase('post')}
                  className={`w-full py-2 sm:py-1 px-3.5 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                    activeOutcomePhase === 'post'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : isDaylight ? 'text-slate-500 hover:text-slate-900' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  After Modality
                </button>
              </div>
            )}

            {/* Time Completed Picker & Dose selector */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5 flex-1 min-w-0">
              {/* Dose Customizer */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${isDaylight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Dose:
                </span>
                {modality ? (
                  <button
                    type="button"
                    onClick={() => setIsDosageModalOpen(true)}
                    className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 group max-w-[140px] truncate ${
                      isDaylight
                        ? 'bg-white hover:bg-slate-50 border-emerald-300 text-emerald-800'
                        : 'bg-black/50 hover:bg-black/80 border-white/15 text-emerald-300'
                    }`}
                    title="Click to customize dosage or parameters"
                  >
                    <Sliders size={12} className="text-emerald-400 group-hover:rotate-45 transition-transform shrink-0" />
                    <span className="truncate">{doseInput || 'Customize'}</span>
                  </button>
                ) : (
                  <input
                    type="text"
                    value={doseInput}
                    onChange={(e) => setDoseInput(e.target.value)}
                    placeholder="e.g. 5g or 20 mins"
                    className={`px-2 py-0.5 text-xs rounded-xl border outline-none font-mono w-24 ${
                      isDaylight
                        ? 'bg-white border-slate-300 text-slate-800'
                        : 'bg-black/40 border-white/10 text-white focus:border-emerald-500/50'
                    }`}
                  />
                )}
              </div>

              {/* Time Completed */}
              {activeOutcomePhase === 'post' && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date()
                      const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
                      setCompletedTime(nowTime)
                    }}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                    title="Reset to current time"
                  >
                    <Clock size={13} />
                    <span className="text-[10px] uppercase font-bold text-emerald-400 underline decoration-dotted">Now</span>
                  </button>
                  <TimePickerWithAmPmToggle
                    value={completedTime}
                    onChange={(new24) => setCompletedTime(new24)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Peak Onset Guidance & Session Execution Numbers (Side-by-side or stacked) */}
          {activeOutcomePhase === 'post' && (() => {
            const guidance = getPeakOnsetGuidance(modality)
            const isSuppOrPeptide = (modality?.category || '').toLowerCase().includes('supplement') || (modality?.category || '').toLowerCase().includes('peptide')
            const targetLabel = isSuppOrPeptide ? 'Target Dose' : 'Session Target'

            return (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* 1. Best Time to Record (1 row collapsed by default) */}
                  <div className={`rounded-xl border overflow-hidden transition-all shadow-sm ${
                    isDaylight ? 'border-purple-200 bg-purple-50/80' : 'border-purple-500/30 bg-purple-950/30'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setIsBestTimeExpanded(!isBestTimeExpanded)}
                      className={`w-full h-10 px-3 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                        isDaylight ? 'hover:bg-purple-100/60' : 'hover:bg-purple-950/60'
                      }`}
                      title={guidance.subtitle}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                        <div className={`p-1 rounded-lg shrink-0 ${
                          isDaylight ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          <Clock size={13} />
                        </div>
                        <span className={`text-xs font-bold truncate ${isDaylight ? 'text-purple-900' : 'text-purple-200'}`}>
                          {guidance.bestTimeToLog}
                        </span>
                      </div>
                      <div className={`flex items-center gap-1 text-xs shrink-0 pl-1 ${isDaylight ? 'text-purple-600' : 'text-purple-400'}`}>
                        <span className="text-[10px] opacity-75 hidden xs:inline">{isBestTimeExpanded ? 'Hide' : 'Info'}</span>
                        {isBestTimeExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </div>
                    </button>
                    {isBestTimeExpanded && (
                      <div className={`px-3 pb-2.5 pt-1 text-[11px] border-t leading-relaxed animate-in fade-in ${
                        isDaylight ? 'text-purple-900 border-purple-200' : 'text-purple-200/90 border-purple-500/20'
                      }`}>
                        <span className={`font-semibold block mb-0.5 ${isDaylight ? 'text-purple-800' : 'text-purple-300'}`}>
                          Peak Biomarker / Onset Window:
                        </span>
                        {guidance.subtitle}
                      </div>
                    )}
                  </div>

                  {/* 2. Session Execution Numbers */}
                  {hasPrecisionLogUI ? (
                    <div className={`rounded-xl border overflow-hidden transition-all shadow-sm ${
                      isDaylight ? 'border-cyan-300 bg-cyan-50/70' : 'border-cyan-500/30 bg-slate-950/80'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setIsOutcomeExecutionExpanded(!isOutcomeExecutionExpanded)}
                        className={`w-full h-10 px-3 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                          isDaylight ? 'hover:bg-cyan-100/60' : 'hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                          <div className={`p-1 rounded-lg shrink-0 ${
                            isDaylight ? 'bg-cyan-100 text-cyan-700 border border-cyan-300' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            <Activity size={13} />
                          </div>
                          <span className={`text-xs font-bold shrink-0 whitespace-nowrap ${isDaylight ? 'text-cyan-900' : 'text-cyan-300'}`}>
                            Session Execution Numbers
                          </span>
                          {completedSummaryText && (
                            <span className={`text-[10px] font-mono truncate ${isDaylight ? 'text-cyan-700' : 'text-slate-400'}`}>
                              ({completedSummaryText})
                            </span>
                          )}
                        </div>
                        <div className={`flex items-center gap-1 text-xs shrink-0 pl-1 ${isDaylight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                          <span className="text-[10px] opacity-75 hidden xs:inline">{isOutcomeExecutionExpanded ? 'Hide' : '+ Log'}</span>
                          {isOutcomeExecutionExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className={`rounded-xl border h-10 px-3 flex items-center justify-between gap-2 overflow-hidden shadow-sm ${
                      isDaylight ? 'border-emerald-200 bg-emerald-50/80' : 'border-emerald-500/30 bg-emerald-950/20'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                        <div className={`p-1 rounded-lg shrink-0 ${
                          isDaylight ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {isSuppOrPeptide ? <Pill size={13} /> : <Target size={13} />}
                        </div>
                        <span className={`text-xs font-medium shrink-0 ${isDaylight ? 'text-emerald-800' : 'text-emerald-300/80'}`}>
                          {targetLabel}:
                        </span>
                        <span className={`text-xs font-bold truncate font-mono ${isDaylight ? 'text-emerald-900' : 'text-emerald-200'}`}>
                          {doseInput || defaultDose || 'Standard Protocol'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Session Execution Form */}
                {hasPrecisionLogUI && isOutcomeExecutionExpanded && (
                  <div className={`p-3.5 border rounded-xl space-y-3 shadow-lg animate-in fade-in ${
                    isDaylight ? 'bg-white border-cyan-300' : 'bg-slate-950/90 border-cyan-500/30'
                  }`}>
                    <div className={`flex items-center justify-between border-b pb-2 ${isDaylight ? 'border-slate-200' : 'border-white/10'}`}>
                      <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${isDaylight ? 'text-cyan-800' : 'text-cyan-300'}`}>
                        <Activity size={14} className={isDaylight ? 'text-cyan-600' : 'text-cyan-400'} /> Session Execution Numbers
                      </span>
                      <span className={`text-[10px] font-mono ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {modality?.display_name || modality?.name}
                      </span>
                    </div>

                    {isThermal && <ThermalExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                    {isBreathwork && <BreathworkExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                    {isNSDR && <NSDRExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
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
                    {isCaffeineCutoff && (
                      <CaffeineCutoffExecutionLog
                        value={executionDetails}
                        onChange={setExecutionDetails}
                        date={task.scheduled_date}
                        localUserId={getLocalUserId()}
                        idealBedtime={userProfile?.ideal_bedtime || '22:30'}
                      />
                    )}
                    {isHydration && <HydrationElectrolyteExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                    {isPhlebotomy && <BiometricPhlebotomyExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                    {isPeptide && (
                      <PeptideExecutionLog 
                        value={executionDetails} 
                        onChange={setExecutionDetails} 
                        modality={modality} 
                        modalityKey={modalityKey} 
                        defaultDoseMcg={resolvePeptideTargetDoseMcg(task, modality)} 
                      />
                    )}
                    {isSupplement && <SupplementExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                    {isSkincare && <TopicalSkincareExecutionLog value={executionDetails} onChange={setExecutionDetails} modality={modality} />}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Standardized 0-10 Outcome Sliders (Before vs After) */}
          {visibleOutcomes.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1">
                  <Sparkles size={11} />
                  <span>
                    {activeOutcomePhase === 'pre'
                      ? 'Pre-Session Baseline (0–10 Scale)'
                      : 'Outcomes Tracking & Shifts (0–10 Scale)'}
                  </span>
                </span>
                <span className={`text-[10px] ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {activeOutcomePhase === 'pre' ? 'Rate pre-workout state' : 'Tap badge or slide to rate'}
                </span>
              </div>

              <div className="space-y-2.5">
                {visibleOutcomes.map((outcome) => {
                  const recentSnap = getRecentOutcomeSnapshot(outcome.id, null, (taskObs as any) || [], 2, undefined)
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
                    <div
                      key={outcome.id}
                      className={`p-3 rounded-xl border space-y-2 transition-all ${
                        isDaylight ? 'bg-white/95 border-slate-200 shadow-sm' : 'bg-black/40 border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className={`font-bold ${isDaylight ? 'text-slate-900' : 'text-white'}`}>
                            {outcome.name}
                          </span>

                          {activeOutcomePhase === 'pre' && !isPreTouched && recentSnap.isRecent && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border bg-amber-500/20 border-amber-500/40 text-amber-300 flex items-center gap-0.5">
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
                                    <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded border ${
                                      netShift >= 0 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-red-500/20 border-red-500/40 text-red-400'
                                    }`}>
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

                          {recentSnap.isRecent && !isCurrentPhaseTouched && activeOutcomePhase === 'post' && (
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

                        {/* Tap-to-confirm pill button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (activeOutcomePhase === 'pre') {
                              const nextTouched = !touchedPreOutcomes[outcome.id]
                              setTouchedPreOutcomes((prev) => ({ ...prev, [outcome.id]: nextTouched }))
                              if (nextTouched && inlinePreValues[outcome.id] === undefined) {
                                setInlinePreValues((prev) => ({ ...prev, [outcome.id]: currentVal }))
                              }
                            } else {
                              const nextTouched = !touchedPostOutcomes[outcome.id]
                              setTouchedPostOutcomes((prev) => ({ ...prev, [outcome.id]: nextTouched }))
                              if (nextTouched && inlinePostValues[outcome.id] === undefined) {
                                setInlinePostValues((prev) => ({ ...prev, [outcome.id]: currentVal }))
                              }
                            }
                          }}
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all group shrink-0"
                          title="Click to confirm this rating without sliding"
                        >
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                              isCurrentPhaseTouched
                                ? colorCfg.badgeBg
                                : isDaylight
                                ? 'bg-slate-100 border-slate-200 text-slate-500 group-hover:border-slate-300'
                                : 'bg-white/5 border-white/15 text-slate-400 group-hover:border-white/30'
                            }`}
                          >
                            {isCurrentPhaseTouched ? colorCfg.qualityLabel : 'Unconfirmed (Tap)'}
                          </span>
                          <span
                            className={`font-mono font-bold text-xs ${
                              isCurrentPhaseTouched ? colorCfg.textColor : isDaylight ? 'text-slate-600' : 'text-slate-400'
                            }`}
                          >
                            {currentVal}/10
                          </span>
                        </button>
                      </div>

                      {/* Visual Gradient Track showing exact Pre to Post Shift */}
                      {activeOutcomePhase === 'post' && canPreLog && (
                        <div className="relative w-full h-2.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden my-1 shadow-inner">
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

                      {/* 0-10 Range Slider */}
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={currentVal}
                        onChange={(e) => {
                          const num = parseInt(e.target.value, 10)
                          if (activeOutcomePhase === 'pre') {
                            setInlinePreValues((prev) => ({ ...prev, [outcome.id]: num }))
                            setTouchedPreOutcomes((prev) => ({ ...prev, [outcome.id]: true }))
                          } else {
                            setInlinePostValues((prev) => ({ ...prev, [outcome.id]: num }))
                            setTouchedPostOutcomes((prev) => ({ ...prev, [outcome.id]: true }))
                          }
                        }}
                        onPointerDown={() => {
                          if (activeOutcomePhase === 'pre') {
                            if (!touchedPreOutcomes[outcome.id]) {
                              setTouchedPreOutcomes((prev) => ({ ...prev, [outcome.id]: true }))
                              if (inlinePreValues[outcome.id] === undefined) {
                                setInlinePreValues((prev) => ({ ...prev, [outcome.id]: currentVal }))
                              }
                            }
                          } else {
                            if (!touchedPostOutcomes[outcome.id]) {
                              setTouchedPostOutcomes((prev) => ({ ...prev, [outcome.id]: true }))
                              if (inlinePostValues[outcome.id] === undefined) {
                                setInlinePostValues((prev) => ({ ...prev, [outcome.id]: currentVal }))
                              }
                            }
                          }
                        }}
                        className="w-full cursor-pointer touch-manipulation h-1.5 rounded-lg appearance-none bg-slate-200 dark:bg-white/10"
                        style={{ accentColor: colorCfg.accentHex }}
                      />

                      {/* Directionality Labels */}
                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        <span className={isLowerBetter ? 'text-emerald-500' : 'text-red-500'}>
                          0: {isLowerBetter ? 'Best (None)' : 'Poor (Low)'}
                        </span>
                        <span className={isLowerBetter ? 'text-red-500' : 'text-emerald-500'}>
                          10: {isLowerBetter ? 'Worst (Severe)' : 'Peak (Best)'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Optional Notes Input */}
              <div className="pt-1">
                <label className={`text-[10px] uppercase font-bold block mb-1 ${isDaylight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Optional Notes
                </label>
                <input
                  type="text"
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="e.g. Felt extra calm after session, 3 sets @ RPE 8"
                  className={`w-full border rounded-xl px-3 py-1.5 text-xs outline-none transition-colors ${
                    isDaylight
                      ? 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500'
                      : 'bg-black/50 border-white/15 text-white placeholder:text-slate-500 focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Bottom Confirmation Bar */}
          <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t mt-2 ${isDaylight ? 'border-slate-200' : 'border-white/10'}`}>
            <div className="flex items-center gap-1.5 text-[11px] font-medium">
              {secondsRemaining !== null ? (
                <div className="flex items-center gap-1 text-emerald-500 font-bold animate-pulse">
                  <span>Auto-completing in {secondsRemaining}s...</span>
                  <span className={`text-[10px] font-normal ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
                    (scroll back to pause)
                  </span>
                </div>
              ) : (
                <div className={`flex items-center gap-1.5 ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span className="inline-block animate-bounce">↓</span>
                  <span>Scroll away to auto-complete in 5s</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveInlineOutcomes(activeOutcomePhase !== 'pre')}
                disabled={isSavingOutcomes}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Check size={14} strokeWidth={3} />
                <span>
                  {isSavingOutcomes
                    ? activeOutcomePhase === 'pre' ? 'Saving Baseline...' : 'Saving...'
                    : activeOutcomePhase === 'pre'
                    ? (outcomesSavedDone ? 'Baseline Saved ✓' : 'Save Baseline Observations')
                    : 'Save Observations & Complete'}
                </span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  isDaylight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-white/10 hover:bg-white/15 border-white/20 text-slate-200'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Canonical Dosage & Scheduling Configuration Modal */}
      {isDosageModalOpen && modality && (
        <DosageDetailModal
          isOpen={true}
          onClose={() => setIsDosageModalOpen(false)}
          modality={modality}
          userProfile={userProfile}
          task={task}
          benchItem={benchItem}
          onSelectDose={(newDoseText) => {
            setDoseInput(newDoseText)
            setIsDosageModalOpen(false)
          }}
          onSavePersonalization={(customDose) => {
            setDoseInput(customDose)
            setIsDosageModalOpen(false)
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('levl_schedule_updated'))
              window.dispatchEvent(new CustomEvent('levl_tasks_updated'))
            }
          }}
        />
      )}

      {/* SKIP / SNOOZE VIEW */}
      {actionType === 'skip_snooze' && (
        <div className="space-y-3">
          {/* Quick Snooze Presets */}
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${isDaylight ? 'text-amber-700' : 'text-amber-400/80'}`}>
              Snooze / Reschedule
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                onClick={() => onSnooze(task.id, 30)}
                className={`px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 active:scale-95 ${
                  isDaylight
                    ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                }`}
              >
                <Clock size={12} className={isDaylight ? 'text-amber-600' : 'text-amber-400'} />
                <span>+30 min</span>
              </button>
              <button
                onClick={() => onSnooze(task.id, 60)}
                className={`px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 active:scale-95 ${
                  isDaylight
                    ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                }`}
              >
                <Clock size={12} className={isDaylight ? 'text-amber-600' : 'text-amber-400'} />
                <span>+1 hour</span>
              </button>
              <button
                onClick={() => onSnooze(task.id, 'evening')}
                className={`px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 active:scale-95 ${
                  isDaylight
                    ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                }`}
              >
                <span>Tonight</span>
              </button>
              <button
                onClick={() => onSnooze(task.id, 'tomorrow')}
                className={`px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 active:scale-95 ${
                  isDaylight
                    ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                }`}
              >
                <span>Tomorrow</span>
              </button>
            </div>
          </div>

          {/* Skip Action with Reason & Adaptive Sub-Actions */}
          <div className={`pt-2.5 border-t space-y-2.5 ${isDaylight ? 'border-slate-200' : 'border-white/10'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDaylight ? 'text-slate-600' : 'text-slate-400'}`}>
                Or Skip for Today
              </span>
              <span className={`text-[9px] font-medium ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
                Select reason to explore smart adjustments
              </span>
            </div>

            {/* Quick Reason Chips / Pills */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'Too busy', label: 'Too busy', icon: '⚡' },
                { id: 'Too frequent', label: 'Too frequent', icon: '🔄' },
                { id: 'Not helpful', label: 'Not helpful', icon: '📉' },
                { id: 'Not feeling well', label: 'Not feeling well', icon: '🤒' },
                { id: 'Travel / Schedule conflict', label: 'Travel / Conflict', icon: '✈️' },
                { id: 'Rest day substitution', label: 'Rest day', icon: '🏖️' },
                { id: 'Skipped for today', label: 'Just skip', icon: '⏭️' },
              ].map((reason) => {
                const isSelected = skipReason === reason.id
                return (
                  <button
                    key={reason.id}
                    type="button"
                    onClick={() => {
                      setSkipReason(reason.id)
                      // Pause auto-countdown if an adaptive reason is picked
                      if (['Too busy', 'Too frequent', 'Not helpful'].includes(reason.id)) {
                        setSecondsRemaining(null)
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                      isSelected
                        ? isDaylight
                          ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-sm'
                          : 'bg-white text-slate-900 border-white shadow-md'
                        : isDaylight
                        ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                    }`}
                  >
                    <span>{reason.icon}</span>
                    <span>{reason.label}</span>
                  </button>
                )
              })}
            </div>

            {/* ADAPTIVE ACTION TRAY FOR 'Too busy' */}
            {skipReason === 'Too busy' && (
              <div className={`p-3 rounded-2xl border space-y-2 animate-in fade-in slide-in-from-top-1 ${
                isDaylight
                  ? 'bg-[#FFFBEB] border-[#D97706]/30 text-[#475569]'
                  : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span className="text-amber-500">⚡</span>
                    <span className={isDaylight ? 'text-[#D97706]' : 'text-amber-300'}>Too busy today?</span>
                  </div>
                  <span className={`text-[10px] font-semibold ${isDaylight ? 'text-[#78350F]' : 'text-amber-200/70'}`}>
                    Choose an action:
                  </span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isDaylight ? 'text-[#526661]' : 'text-slate-300'}`}>
                  Short on time? Reduce the duration or dose, bench this modality for later, or eliminate it from your routine:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsDosageModalOpen(true)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
                      isDaylight
                        ? 'bg-[#ECFEFF] hover:bg-[#CFFAFE] text-[#0891B2] border-[#0891B2]/40'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40'
                    }`}
                  >
                    <Sliders size={13} className={isDaylight ? 'text-[#0891B2]' : 'text-cyan-400'} />
                    <span>Change Dosing</span>
                  </button>

                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={handleMoveToBench}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
                      isDaylight
                        ? 'bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] border-[#D97706]/40'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    <Archive size={13} className={isDaylight ? 'text-[#D97706]' : 'text-amber-400'} />
                    <span>Move to Bench</span>
                  </button>

                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={handleEliminate}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
                      isDaylight
                        ? 'bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#E11D48] border-[#E11D48]/40'
                        : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    <Trash2 size={13} className={isDaylight ? 'text-[#E11D48]' : 'text-rose-400'} />
                    <span>Eliminate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSkip(task.id, 'Too busy')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      isDaylight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-white/10 hover:bg-white/15 text-slate-300 border-white/20'
                    }`}
                  >
                    <SkipForward size={13} />
                    <span>Skip Today Only</span>
                  </button>
                </div>
              </div>
            )}

            {/* ADAPTIVE ACTION TRAY FOR 'Too frequent' */}
            {skipReason === 'Too frequent' && (
              <div className={`p-3 rounded-2xl border space-y-2 animate-in fade-in slide-in-from-top-1 ${
                isDaylight
                  ? 'bg-[#ECFEFF] border-[#0891B2]/30 text-[#475569]'
                  : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span className="text-cyan-500">🔄</span>
                    <span className={isDaylight ? 'text-[#0891B2]' : 'text-cyan-300'}>Too frequent?</span>
                  </div>
                  <span className={`text-[10px] font-semibold ${isDaylight ? 'text-[#155E75]' : 'text-cyan-200/70'}`}>
                    Choose an action:
                  </span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isDaylight ? 'text-[#526661]' : 'text-slate-300'}`}>
                  Cadence feels overwhelming? You can adjust the weekly frequency, rest day intervals, or dosage:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsDosageModalOpen(true)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
                      isDaylight
                        ? 'bg-white hover:bg-[#CFFAFE] text-[#0891B2] border-[#0891B2]/40'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40'
                    }`}
                  >
                    <Sliders size={13} className={isDaylight ? 'text-[#0891B2]' : 'text-cyan-400'} />
                    <span>Change Dosing / Frequency</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSkip(task.id, 'Too frequent')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      isDaylight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-white/10 hover:bg-white/15 text-slate-300 border-white/20'
                    }`}
                  >
                    <SkipForward size={13} />
                    <span>Skip Today Only</span>
                  </button>
                </div>
              </div>
            )}

            {/* ADAPTIVE ACTION TRAY FOR 'Not helpful' */}
            {skipReason === 'Not helpful' && (
              <div className={`p-3 rounded-2xl border space-y-2 animate-in fade-in slide-in-from-top-1 ${
                isDaylight
                  ? 'bg-[#FFF1F2] border-[#E11D48]/30 text-[#475569]'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span className="text-rose-500">📉</span>
                    <span className={isDaylight ? 'text-[#E11D48]' : 'text-rose-300'}>Not helpful?</span>
                  </div>
                  <span className={`text-[10px] font-semibold ${isDaylight ? 'text-[#9F1239]' : 'text-rose-200/70'}`}>
                    Choose an action:
                  </span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isDaylight ? 'text-[#526661]' : 'text-slate-300'}`}>
                  Not getting the expected clinical payoff? Recalibrate the dose/timing, move to bench while trying alternatives, or eliminate from your stack:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsDosageModalOpen(true)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
                      isDaylight
                        ? 'bg-[#ECFEFF] hover:bg-[#CFFAFE] text-[#0891B2] border-[#0891B2]/40'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40'
                    }`}
                  >
                    <Sliders size={13} className={isDaylight ? 'text-[#0891B2]' : 'text-cyan-400'} />
                    <span>Change Dosing</span>
                  </button>

                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={handleMoveToBench}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
                      isDaylight
                        ? 'bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] border-[#D97706]/40'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    <Archive size={13} className={isDaylight ? 'text-[#D97706]' : 'text-amber-400'} />
                    <span>Move to Bench</span>
                  </button>

                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={handleEliminate}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
                      isDaylight
                        ? 'bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#E11D48] border-[#E11D48]/40'
                        : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    <Trash2 size={13} className={isDaylight ? 'text-[#E11D48]' : 'text-rose-400'} />
                    <span>Eliminate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSkip(task.id, 'Not helpful')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      isDaylight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-white/10 hover:bg-white/15 text-slate-300 border-white/20'
                    }`}
                  >
                    <SkipForward size={13} />
                    <span>Skip Today Only</span>
                  </button>
                </div>
              </div>
            )}

            {/* Standard Dropdown & Skip Button for Non-Adaptive Reasons */}
            {!['Too busy', 'Too frequent', 'Not helpful'].includes(skipReason) && (
              <div className="flex items-center gap-2 pt-0.5">
                <select
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  className={`border rounded-lg px-2.5 py-1.5 text-xs outline-none flex-1 ${
                    isDaylight
                      ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
                      : 'bg-black/40 border-white/10 text-slate-200'
                  }`}
                >
                  <option value="Skipped for today">Skipped for today</option>
                  <option value="Too busy">Too busy</option>
                  <option value="Too frequent">Too frequent</option>
                  <option value="Not helpful">Not helpful</option>
                  <option value="Not feeling well">Not feeling well</option>
                  <option value="Travel / Schedule conflict">Travel / Schedule conflict</option>
                  <option value="Rest day substitution">Rest day substitution</option>
                </select>

                <button
                  type="button"
                  onClick={() => onSkip(task.id, skipReason)}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-xs transition-all active:scale-95 shrink-0 cursor-pointer"
                >
                  <SkipForward size={13} />
                  <span>Skip</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Countdown status */}
          <div className={`pt-2 flex items-center justify-between text-[11px] font-medium ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
            {secondsRemaining !== null ? (
              <div className="flex items-center gap-1 text-amber-500 font-bold animate-pulse">
                <span>Auto-skipping in {secondsRemaining}s...</span>
                <span className={`text-[10px] font-normal ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
                  (scroll back to pause)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="inline-block animate-bounce">↓</span>
                <span>Scroll away to auto-skip in 5s</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
