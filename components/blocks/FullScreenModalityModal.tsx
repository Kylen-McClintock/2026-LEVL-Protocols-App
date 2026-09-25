'use client'

import React, { useState, useRef, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  SkipForward,
  Bookmark,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Activity,
  Microscope,
  Info,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Plus,
  ShieldAlert,
  Zap,
  Scale,
  ExternalLink,
  Flame,
  Snowflake,
  HeartPulse,
  Dna,
  Coffee,
  Syringe,
  CheckCircle2,
  ArrowDown
} from 'lucide-react'
import { DedupedTask } from '@/components/cards/ProtocolTaskCard'
import { Modality, OutcomeDimension, UserProfile, UserBenchItem, DailyWellbeingCheckin } from '@/lib/types'
import ModalityIcon from '@/components/ui/ModalityIcon'
import { getModalityMacroType, MODALITY_COLOR_THEMES, getDaylightCategoryStyle } from '@/lib/utils/modalityColors'
import { useTheme } from '@/lib/utils/useTheme'
import { getSimplifiedModalityName, BlocksVisualStyle } from './blocksUtils'
import { LEVL_TOKENS, getThemeClasses } from '@/lib/theme/designTokens'
import ModalityLongevityDrawer from '@/components/cards/ModalityLongevityDrawer'
import GeekMode from '@/components/cards/GeekMode'
import PreFlightSpacingNudgeBanner from '@/components/cards/PreFlightSpacingNudgeBanner'
import MedicalDisclaimerBanner from '@/components/ui/MedicalDisclaimerBanner'
import { LONGEVITY_VECTORS_METADATA } from '@/lib/data/longevityKnowledgeBase'

import { saveOutcomeObservation, getCachedModalitiesSync, updateTaskExecutionDetails, getTaskOutcomeObservations } from '@/lib/data'
import { triggerHaptic } from '@/lib/utils/haptics'
import { getOutcomeColorConfig, getNeutralOutcomeColorConfig } from '@/lib/utils/outcomeColors'
import { isPreLoggableOutcome } from '@/lib/utils/outcomePhaseRules'
import { getPeakOnsetGuidance } from '@/lib/utils/peakOnsetGuidance'
import { getModalityArchetype } from '@/lib/data/modalityArchetypes'
import { detectPreFlightSpacingNudge } from '@/lib/synergy/preFlightSpacingNudge'
import { evaluateStackFit } from '@/lib/synergy/stackFitEngine'
import { saveInjectionSiteLog } from '@/lib/peptides/reconstitutionEngine'

// Precision execution logs
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
import BiometricPhlebotomyExecutionLog from '../execution/BiometricPhlebotomyExecutionLog'
import PeptideExecutionLog from '../execution/PeptideExecutionLog'
import CompletedExecutionSummary from '../execution/CompletedExecutionSummary'
import { isInjectableSubQPeptide, resolvePeptideTargetDoseMcg } from '@/lib/peptides/reconstitutionEngine'

// Dynamically load interactive applets
const CyclicSighingApplet = dynamic(() => import('../applets/CyclicSighingApplet'), { ssr: false })
const Breathing478Applet = dynamic(() => import('../applets/Breathing478Applet'), { ssr: false })
const BoxBreathingApplet = dynamic(() => import('../applets/BoxBreathingApplet'), { ssr: false })
const HyperventilationApplet = dynamic(() => import('../applets/HyperventilationApplet'), { ssr: false })
const CoherentBreathingApplet = dynamic(() => import('../applets/CoherentBreathingApplet'), { ssr: false })
const YogaNidraApplet = dynamic(() => import('../applets/YogaNidraApplet'), { ssr: false })
const RedLightMaskApplet = dynamic(() => import('../applets/RedLightMaskApplet'), { ssr: false })
const ColdPlungeApplet = dynamic(() => import('../applets/ColdPlungeApplet'), { ssr: false })
const GlucoseWalkApplet = dynamic(() => import('../applets/GlucoseWalkApplet'), { ssr: false })
const SaunaSessionApplet = dynamic(() => import('../applets/SaunaSessionApplet'), { ssr: false })
const HIITNorwegian4x4Applet = dynamic(() => import('../applets/HIITNorwegian4x4Applet'), { ssr: false })
const Zone2CardioApplet = dynamic(() => import('../applets/Zone2CardioApplet'), { ssr: false })

// Dynamically load DosageDetailModal & ModalityCompareModal
const DosageDetailModal = dynamic(() => import('@/components/modals/DosageDetailModal').then(m => m.DosageDetailModal), { ssr: false })
const ModalityCompareModal = dynamic(() => import('@/components/modals/ModalityCompareModal'), { ssr: false })

interface FullScreenModalityModalProps {
  task: DedupedTask
  modality?: Modality | null
  benchItem?: UserBenchItem | null
  benchItems?: UserBenchItem[]
  allTasks?: DedupedTask[]
  userProfile?: UserProfile | null
  allOutcomes?: OutcomeDimension[]
  allModalities?: Modality[]
  wellbeingCheckin?: DailyWellbeingCheckin | null
  visualStyle: BlocksVisualStyle
  date?: string
  localUserId?: string
  onClose: () => void
  onStatusChange: (
    taskId: string,
    status: string,
    reason?: string,
    completedAt?: string,
    executionMetrics?: any,
    executionDetails?: any
  ) => void
  onMoveToBench?: (modalityId: string) => void
  onOpenRescheduleModal?: (task: DedupedTask) => void
  onSaveCustomOutcomes?: (modalityId: string, outcomeIds: string[]) => void
}

/**
 * Parses duration strings like "3 mins", "20 mins", "15 sec" into total seconds.
 */
function parseDurationToSeconds(durationStr?: string, defaultSec = 180): number {
  if (!durationStr) return defaultSec
  const lower = durationStr.toLowerCase()
  const matchMin = lower.match(/(\d+)\s*(?:min|m\b)/)
  if (matchMin) return parseInt(matchMin[1], 10) * 60
  const matchSec = lower.match(/(\d+)\s*(?:sec|s\b)/)
  if (matchSec) return parseInt(matchSec[1], 10)
  const matchNum = lower.match(/(\d+)/)
  if (matchNum) return parseInt(matchNum[1], 10) * 60
  return defaultSec
}

/**
 * Plays a soothing 528 Hz harmonic chime on countdown completion.
 */
function playGentleChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(528, ctx.currentTime)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.6)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 1.6)
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}

function parsePracticeSteps(instructions: string) {
  if (!instructions) return []
  const lines = instructions.split(/\n+/).map((s) => s.trim()).filter(Boolean)
  
  if (lines.length >= 2) {
    return lines.map((line, idx) => {
      const match = line.match(/^(?:Step\s*\d+[:.-]?|\d+[\.)])\s*(.*)$/i)
      const content = match ? match[1] : line
      const colonSplit = content.split(/—|:\s+/)
      if (colonSplit.length > 1) {
        return {
          title: colonSplit[0].trim(),
          description: colonSplit.slice(1).join(': ').trim()
        }
      }
      return {
        title: `Phase ${idx + 1}`,
        description: content
      }
    })
  }

  return [
    {
      title: 'Protocol Execution',
      description: instructions
    }
  ]
}

export default function FullScreenModalityModal({
  task,
  modality: initialModality,
  benchItem,
  benchItems = [],
  allTasks = [],
  userProfile,
  allOutcomes = [],
  allModalities = [],
  wellbeingCheckin,
  visualStyle,
  date,
  localUserId,
  onClose,
  onStatusChange,
  onMoveToBench,
  onOpenRescheduleModal,
  onSaveCustomOutcomes
}: FullScreenModalityModalProps) {
  // 4-Card Horizontal Flow:
  // 0 = Session (Hero, Dosing, Pre-flight Spacing, Pre-Session Baseline Drawer, Start Session Launcher, Instructions, Utilities)
  // 1 = Outcomes (Peak Onset Guidance, Acute Shift Pre vs Post Delta, Clean 0-10 Sliders, 30-day History, Next-Day Tracker, Notes)
  // 2 = Protocol (Complete Protocol Hierarchy, Sequence, StackFit Synergies & Co-Factors, Compare & Substitutes, Safety Disclaimers)
  // 3 = Science (8 Canonical Biological Longevity Vectors, Biomarkers, Hallmarks of Aging, Calico Models, GeekMode RCTs)
  const [activeTab, setActiveTab] = useState<0 | 1 | 2 | 3>(0)
  const [activeApplet, setActiveApplet] = useState<string | null>(null)
  const [isDosageModalOpen, setIsDosageModalOpen] = useState(false)
  const [compareTargetModality, setCompareTargetModality] = useState<Modality | null>(null)
  const [isCustomizeOutcomesOpen, setIsCustomizeOutcomesOpen] = useState(false)
  const [isEditingExecution, setIsEditingExecution] = useState(false)

  // Pre-Session Baseline Drawer State (Full-width, collapsed until pressed)
  const [isPreBaselineOpen, setIsPreBaselineOpen] = useState(false)

  // Full-Screen Countdown Timer State
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false)
  const [timerTotalDuration, setTimerTotalDuration] = useState(180)
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState(180)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  const isCompleted = task.status === 'completed'

  // Touch gesture handling for horizontal carousel
  const touchStartXRef = useRef(0)
  const touchStartYRef = useRef(0)
  const [dragOffset, setDragOffset] = useState(0)

  // 1. CANONICAL MODALITY HYDRATION
  const modality: Modality | null = useMemo(() => {
    const rawId = task.modality_id || task.protocol_step?.modality_id || initialModality?.id || initialModality?.slug
    const catalog = allModalities && allModalities.length > 0 ? allModalities : getCachedModalitiesSync()
    let found: Modality | undefined = undefined
    if (rawId && catalog.length > 0) {
      const rawLower = rawId.toLowerCase().trim()
      const rawUnder = rawLower.replace(/-/g, '_')
      const rawDash = rawLower.replace(/_/g, '-')
      found = catalog.find(m => {
        const mId = m.id?.toLowerCase().trim()
        const mSlug = m.slug?.toLowerCase().trim()
        const mName = m.name?.toLowerCase().trim()
        return mId === rawLower || mId === rawUnder || mId === rawDash ||
               mSlug === rawLower || mSlug === rawUnder || mSlug === rawDash ||
               mName === rawLower
      })
    }
    if (found) {
      return {
        ...found,
        ...(initialModality || {}),
        ...(task.protocol_step?.modality || {}),
        ...(task.loose_modality || {})
      }
    }
    if (benchItem?.modality) {
      return {
        ...benchItem.modality,
        ...(initialModality || {})
      }
    }
    return initialModality || null
  }, [task, initialModality, allModalities, benchItem])

  // Modality Archetype & Specialized Execution Traits
  const { isLight: themeIsLight } = useTheme()
  const isDaylight = themeIsLight
  const daylightCategory = useMemo(() => getDaylightCategoryStyle(modality), [modality])
  const themeTokens = useMemo(() => LEVL_TOKENS[isDaylight ? 'light' : 'dark'], [isDaylight])
  const themeClasses = useMemo(() => getThemeClasses(isDaylight), [isDaylight])

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
  const isSport = archetype === 'sport'

  const hasPrecisionLogUI = archetype !== 'general' || isCaffeineCutoff

  // Execution details state
  const [executionDetails, setExecutionDetails] = useState<any>(() => {
    return task.execution_details || {}
  })

  // Tracked outcome dimensions (from modality configuration or defaults)
  // SPECIAL CLINICAL STANDARD: Caffeine cutoff modality does NOT have tracked outcomes assigned by default!
  const [trackedDimensions, setTrackedDimensions] = useState<string[]>(() => {
    // 1. User manual bench item customization takes precedence
    if (benchItem?.custom_outcomes && benchItem.custom_outcomes.length > 0) {
      return benchItem.custom_outcomes
    }
    // 2. Caffeine cutoff has zero default outcomes (too many sleep variables)
    if (isCaffeineCutoff) {
      return []
    }
    if (modality?.functional_outcomes_to_track && modality.functional_outcomes_to_track.length > 0) {
      return modality.functional_outcomes_to_track
    }
    return ['Mood', 'Energy', 'Stress', 'Alertness']
  })

  // Full Outcome Dimension objects that match trackedDimensions
  const activeOutcomeDimensions: OutcomeDimension[] = useMemo(() => {
    return trackedDimensions.map((name) => {
      const match = allOutcomes.find(
        (o) => o.name.toLowerCase() === name.toLowerCase() || o.id.toLowerCase() === name.toLowerCase()
      )
      if (match) return match
      const lower = name.toLowerCase()
      const isLowerBetter = lower.includes('stress') || lower.includes('fatigue') || lower.includes('soreness') || lower.includes('anxiety')
      return {
        id: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: name,
        category: 'functional',
        directionality: isLowerBetter ? 'lower_is_better' : 'higher_is_better',
        description: `Subjective ${name} rating`
      } as OutcomeDimension
    })
  }, [trackedDimensions, allOutcomes])

  // Post-session outcome slider values
  const [sliderValues, setSliderValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    const existing = task.execution_details?.outcome_ratings || {}
    activeOutcomeDimensions.forEach((o) => {
      init[o.id] = existing[o.id] ?? existing[o.name] ?? 5
    })
    return init
  })

  const [touchedOutcomes, setTouchedOutcomes] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    const existing = task.execution_details?.outcome_ratings || {}
    Object.keys(existing).forEach((k) => {
      init[k] = true
    })
    return init
  })

  // Outcomes view toggle: 'post' (default) vs 'pre' (pre-session baseline)
  const [outcomesViewMode, setOutcomesViewMode] = useState<'post' | 'pre'>('post')

  // Progressive disclosure states for Card 3 (Protocol Synergies & Spacing Warnings)
  const [expandedSynergies, setExpandedSynergies] = useState<Record<number, boolean>>({})
  const [expandedConflicts, setExpandedConflicts] = useState<Record<number, boolean>>({})

  // Progressive disclosure states for Card 4 (Science, Biomarkers & Functional Impacts)
  const [isBiomarkersExpanded, setIsBiomarkersExpanded] = useState<boolean>(false)
  const [isHallmarksExpanded, setIsHallmarksExpanded] = useState<boolean>(false)
  const [isFunctionalImpactsExpanded, setIsFunctionalImpactsExpanded] = useState<boolean>(false)

  // Memoized hallmarks of aging list
  const hallmarksList = useMemo(() => {
    if (!modality?.hallmarks_of_aging_impact) return []
    if (Array.isArray(modality.hallmarks_of_aging_impact)) {
      return modality.hallmarks_of_aging_impact
    }
    return []
  }, [modality])

  // Memoized subjective functional outcomes list
  const functionalEntries = useMemo(() => {
    if (!modality?.functional_impacts) return []
    return Object.entries(modality.functional_impacts)
      .filter(([key]) => {
        const normKey = key.toLowerCase().replace(/[-\s]/g, '_').trim()
        return !LONGEVITY_VECTORS_METADATA[normKey]
      })
      .sort((a, b) => (b[1].score ?? 0) - (a[1].score ?? 0))
  }, [modality])

  // Helper: Carries over baseline data from task details, wellbeing checkin, or baseline ratings
  const resolveBaselineForOutcome = (outcome: OutcomeDimension): { value: number; isTouched: boolean; source: 'pre_log' | 'wellbeing' | 'none' } => {
    // 1. Check task.execution_details?.pre_outcome_ratings / pre_session_ratings / baseline_ratings
    const preExisting =
      task.execution_details?.pre_outcome_ratings ||
      task.execution_details?.pre_session_ratings ||
      task.execution_details?.baseline_ratings ||
      {}
    if (preExisting[outcome.id] !== undefined) {
      return { value: Number(preExisting[outcome.id]), isTouched: true, source: 'pre_log' }
    }
    if (preExisting[outcome.name] !== undefined) {
      return { value: Number(preExisting[outcome.name]), isTouched: true, source: 'pre_log' }
    }

    // 2. Carry over from daily wellbeing checkin if present!
    if (wellbeingCheckin) {
      const lower = outcome.name.toLowerCase()
      const idLower = outcome.id.toLowerCase()

      if ((lower === 'mood' || idLower.includes('mood')) && wellbeingCheckin.mood_0_10 !== undefined && wellbeingCheckin.mood_0_10 !== null) {
        return { value: Number(wellbeingCheckin.mood_0_10), isTouched: true, source: 'wellbeing' }
      }
      if ((lower === 'energy' || idLower.includes('energy')) && wellbeingCheckin.energy_0_10 !== undefined && wellbeingCheckin.energy_0_10 !== null) {
        return { value: Number(wellbeingCheckin.energy_0_10), isTouched: true, source: 'wellbeing' }
      }
      if ((lower === 'stress' || idLower.includes('stress')) && wellbeingCheckin.stress_0_10 !== undefined && wellbeingCheckin.stress_0_10 !== null) {
        return { value: Number(wellbeingCheckin.stress_0_10), isTouched: true, source: 'wellbeing' }
      }
      if ((lower.includes('sleep') || idLower.includes('sleep')) && wellbeingCheckin.subjective_sleep_0_10 !== undefined && wellbeingCheckin.subjective_sleep_0_10 !== null) {
        return { value: Number(wellbeingCheckin.subjective_sleep_0_10), isTouched: true, source: 'wellbeing' }
      }
      if (wellbeingCheckin.custom_outcomes_jsonb) {
        if (wellbeingCheckin.custom_outcomes_jsonb[outcome.id] !== undefined) {
          return { value: Number(wellbeingCheckin.custom_outcomes_jsonb[outcome.id]), isTouched: true, source: 'wellbeing' }
        }
        if (wellbeingCheckin.custom_outcomes_jsonb[outcome.name] !== undefined) {
          return { value: Number(wellbeingCheckin.custom_outcomes_jsonb[outcome.name]), isTouched: true, source: 'wellbeing' }
        }
      }
    }

    return { value: 5, isTouched: false, source: 'none' }
  }

  // Pre-session baseline slider values (with automatic carryover from check-in & task)
  const [preSliderValues, setPreSliderValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    activeOutcomeDimensions.forEach((o) => {
      const { value } = resolveBaselineForOutcome(o)
      init[o.id] = value
    })
    return init
  })

  const [preTouchedOutcomes, setPreTouchedOutcomes] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    activeOutcomeDimensions.forEach((o) => {
      const { isTouched } = resolveBaselineForOutcome(o)
      init[o.id] = isTouched
    })
    return init
  })

  const [baselineSources, setBaselineSources] = useState<Record<string, 'pre_log' | 'wellbeing' | 'none'>>(() => {
    const init: Record<string, 'pre_log' | 'wellbeing' | 'none'> = {}
    activeOutcomeDimensions.forEach((o) => {
      const { source } = resolveBaselineForOutcome(o)
      init[o.id] = source
    })
    return init
  })

  // Hydrate pre-session baseline from remote observations if recorded
  useEffect(() => {
    if (!localUserId || !task.id) return
    let isCancelled = false
    getTaskOutcomeObservations(localUserId, task.id, date).then((obs) => {
      if (isCancelled || !obs || obs.length === 0) return
      const preObs = obs.filter((o: any) => o.phase === 'pre')
      if (preObs.length > 0) {
        setPreSliderValues((prev) => {
          const next = { ...prev }
          preObs.forEach((o: any) => {
            if (o.outcome_id && o.value_0_10 !== undefined) {
              next[o.outcome_id] = o.value_0_10
            }
          })
          return next
        })
        setPreTouchedOutcomes((prev) => {
          const next = { ...prev }
          preObs.forEach((o: any) => {
            if (o.outcome_id) next[o.outcome_id] = true
          })
          return next
        })
        setBaselineSources((prev) => {
          const next = { ...prev }
          preObs.forEach((o: any) => {
            if (o.outcome_id) next[o.outcome_id] = 'pre_log'
          })
          return next
        })
      }
    }).catch(console.error)
    return () => { isCancelled = true }
  }, [localUserId, task.id, date])

  const [customNotes, setCustomNotes] = useState(task.execution_details?.custom_notes || '')
  const [isSavingOutcomes, setIsSavingOutcomes] = useState(false)
  const [outcomesSavedFeedback, setOutcomesSavedFeedback] = useState(false)

  // Handle post-session slider adjustment
  const handleSliderChange = (id: string, val: number) => {
    setSliderValues((prev) => ({ ...prev, [id]: val }))
    setTouchedOutcomes((prev) => ({ ...prev, [id]: true }))
  }

  // Handle pre-session baseline adjustment
  const handlePreSliderChange = (id: string, val: number) => {
    setPreSliderValues((prev) => ({ ...prev, [id]: val }))
    setPreTouchedOutcomes((prev) => ({ ...prev, [id]: true }))
    setBaselineSources((prev) => ({ ...prev, [id]: 'pre_log' }))

    // Auto-persist pre baseline to task execution details & outcome observations
    const updatedPreRatings = {
      ...(executionDetails?.pre_outcome_ratings || {}),
      [id]: val
    }
    const updatedDetails = {
      ...(executionDetails || {}),
      pre_outcome_ratings: updatedPreRatings
    }
    setExecutionDetails(updatedDetails)
    if (task.id) {
      updateTaskExecutionDetails(task.id, updatedDetails).catch(console.error)
    }
    if (localUserId) {
      saveOutcomeObservation(
        localUserId,
        id,
        'pre',
        val,
        date,
        task.id,
        undefined,
        undefined
      ).catch(console.error)
    }
  }

  // Save observations explicitly
  const handleSaveObservations = async () => {
    setIsSavingOutcomes(true)
    const savedValues: Record<string, number> = {}
    Object.entries(sliderValues).forEach(([id, val]) => {
      if (touchedOutcomes[id]) {
        savedValues[id] = val
      }
    })

    if (Object.keys(savedValues).length > 0 && localUserId) {
      for (const [outcomeId, score] of Object.entries(savedValues)) {
        try {
          await saveOutcomeObservation(
            localUserId,
            outcomeId,
            'post',
            score,
            date,
            task.id,
            undefined,
            customNotes || undefined
          )
        } catch (e) {
          console.error('Error saving outcome observation in full-screen modal:', e)
        }
      }
    }

    const updatedExecDetails = {
      ...(executionDetails || {}),
      ...(Object.keys(savedValues).length > 0 ? { outcome_ratings: savedValues } : {}),
      ...(customNotes ? { custom_notes: customNotes } : {})
    }
    setExecutionDetails(updatedExecDetails)
    if (task.id) {
      await updateTaskExecutionDetails(task.id, updatedExecDetails)
    }

    setIsSavingOutcomes(false)
    setOutcomesSavedFeedback(true)
    setTimeout(() => setOutcomesSavedFeedback(false), 3000)
  }

  const macroType = getModalityMacroType(modality)
  const theme = MODALITY_COLOR_THEMES[macroType] || MODALITY_COLOR_THEMES.other
  const hex = theme.colorHex

  const fullName =
    task.execution_details?.custom_name ||
    task.execution_details?.modality_name ||
    modality?.display_name ||
    modality?.name ||
    task.protocol_step?.protocol?.name ||
    'Protocol Modality'
  const simplifiedName = getSimplifiedModalityName(modality, task)
  const protocolName = task.lineages?.[0]?.protocol_name || task.protocol_step?.protocol?.name || 'Standalone Routine'
  const dose =
    task.execution_details?.custom_dose ||
    benchItem?.custom_dose ||
    modality?.dose_or_exposure ||
    task.protocol_step?.dose_text ||
    ''

  // Determine interactive breathwork / NSDR / red light launchers
  const modLower = fullName.toLowerCase()
  const has478 = modLower.includes('4-7-8') || modLower.includes('478')
  const hasCyclicSigh = modLower.includes('cyclic sigh') || modLower.includes('physiological sigh')
  const hasBoxBreathing = modLower.includes('box breath')
  const hasHyperventilation = modLower.includes('hyperventilation') || modLower.includes('tummo') || modLower.includes('wim hof')
  const hasCoherent = modLower.includes('coherent') || modLower.includes('resonance')
  const hasYogaNidra = modLower.includes('yoga nidra') || modLower.includes('nsdr')
  const hasRedLight = modLower.includes('red light')
  const hasColdPlunge = modLower.includes('cold plunge') || modLower.includes('ice bath') || modLower.includes('cold water immersion') || modLower.includes('cryotherapy') || modLower.includes('deliberate cold')
  const hasGlucoseWalk = modLower.includes('glucose walk') || modLower.includes('post-meal walk') || modLower.includes('postprandial walk') || modLower.includes('post meal walk') || modLower.includes('glucose disposal')
  const hasSauna = modLower.includes('sauna') || modLower.includes('hyperthermic conditioning')
  const has4x4HIIT = modLower.includes('4x4') || modLower.includes('vo2 max') || modLower.includes('norwegian') || modLower.includes('hiit') || modLower.includes('sprint intervals')
  const hasZone2 = (modLower.includes('zone 2') || modLower.includes('zone_2') || modLower.includes('aerobic base') || modLower.includes('steady-state cardio') || modLower.includes('steady state cardio')) && !has4x4HIIT

  const hasSpecializedApplet = has478 || hasCyclicSigh || hasBoxBreathing || hasHyperventilation || hasCoherent || hasYogaNidra || hasRedLight || hasColdPlunge || hasGlucoseWalk || hasSauna || has4x4HIIT || hasZone2

  // Pre-Flight Spacing & Interference Alerts
  const preFlightNudge = useMemo(() => {
    if (!allTasks || allTasks.length === 0) return null
    return detectPreFlightSpacingNudge(task, allTasks, userProfile)
  }, [task, allTasks, userProfile])

  // Protocol sequence & position
  const protocolTasks = useMemo(() => {
    if (!allTasks) return []
    const currentProtoId = task.protocol_step?.protocol_id || task.lineages?.[0]?.protocol_id
    const currentProtoName = task.protocol_step?.protocol?.name || task.lineages?.[0]?.protocol_name
    if (!currentProtoId && !currentProtoName) return [task]
    return allTasks.filter(t => {
      const tProtoId = t.protocol_step?.protocol_id || t.lineages?.[0]?.protocol_id
      const tProtoName = t.protocol_step?.protocol?.name || t.lineages?.[0]?.protocol_name
      return (currentProtoId && tProtoId === currentProtoId) || (currentProtoName && tProtoName === currentProtoName)
    })
  }, [allTasks, task])

  const protocolStepIndex = useMemo(() => {
    const idx = protocolTasks.findIndex(t => t.id === task.id)
    return idx >= 0 ? idx + 1 : 1
  }, [protocolTasks, task])

  // StackFit Synergies & Co-Factors Engine
  const todayModalities = useMemo(() => {
    return (allTasks || [])
      .map(t => t.protocol_step?.modality || t.loose_modality)
      .filter((m): m is Modality => Boolean(m))
  }, [allTasks])

  const benchModalitiesList = useMemo(() => {
    return (benchItems || [])
      .map(b => b.modality)
      .filter((m): m is Modality => Boolean(m))
  }, [benchItems])

  const stackFitResult = useMemo(() => {
    if (!modality) return null
    return evaluateStackFit(modality, todayModalities, benchModalitiesList, userProfile)
  }, [modality, todayModalities, benchModalitiesList, userProfile])

  // Category alternatives for Compare & Bench Substitutes
  const categoryAlternatives: Modality[] = useMemo(() => {
    if (!modality || !allModalities || allModalities.length === 0) return []
    return allModalities
      .filter(m => m.id !== modality.id && (m.category === modality.category || m.modality_type === modality.modality_type))
      .slice(0, 3)
  }, [modality, allModalities])

  // Clinical biomarkers targeted derived from functional_impacts
  const targetedBiomarkers = useMemo<string[]>(() => {
    const set = new Set<string>()
    if (modality?.functional_impacts) {
      Object.values(modality.functional_impacts).forEach((impact: any) => {
        if (Array.isArray(impact?.biomarkers)) {
          impact.biomarkers.forEach((b: string) => set.add(b))
        }
      })
    }
    if (set.size > 0) return Array.from(set)
    return ['ApoB', 'hs-CRP', 'Fasting Insulin', 'VO2 Max', 'HRV', 'AMPK / mTOR', 'NAD+']
  }, [modality])

  // Swipe gesture listeners
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
    touchStartYRef.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const diffX = e.touches[0].clientX - touchStartXRef.current
    const diffY = e.touches[0].clientY - touchStartYRef.current
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setDragOffset(diffX)
    }
  }

  const handleTouchEnd = () => {
    const threshold = 60
    if (dragOffset < -threshold) {
      if (activeTab < 3) setActiveTab((prev) => (prev + 1) as 0 | 1 | 2 | 3)
    } else if (dragOffset > threshold) {
      if (activeTab > 0) setActiveTab((prev) => (prev - 1) as 0 | 1 | 2 | 3)
      else onClose()
    }
    setDragOffset(0)
  }

  // Handle completion toggle
  const handleToggleComplete = async () => {
    if (isCompleted) {
      onStatusChange(task.id, 'pending', undefined, undefined, undefined, executionDetails)
    } else {
      const savedValues: Record<string, number> = {}
      Object.entries(sliderValues).forEach(([id, val]) => {
        if (touchedOutcomes[id]) {
          savedValues[id] = val
        }
      })

      if (Object.keys(savedValues).length > 0 && localUserId) {
        for (const [outcomeId, score] of Object.entries(savedValues)) {
          try {
            await saveOutcomeObservation(
              localUserId,
              outcomeId,
              'post',
              score,
              date,
              task.id,
              undefined,
              customNotes || undefined
            )
          } catch (e) {
            console.error('Error saving outcome observation in full-screen modal:', e)
          }
        }
      }

      const updatedExecDetails = {
        ...(executionDetails || {}),
        ...(Object.keys(savedValues).length > 0 ? { outcome_ratings: savedValues } : {}),
        ...(customNotes ? { custom_notes: customNotes } : {})
      }

      if (isPeptide && executionDetails?.injection_site) {
        saveInjectionSiteLog((modality?.slug || modality?.id || '').toLowerCase(), executionDetails.injection_site)
      }

      onStatusChange(task.id, 'completed', undefined, undefined, undefined, updatedExecDetails)
    }
  }

  // Launch Full-Screen Timer Handler
  const handleLaunchTimer = () => {
    if (isPeptide) return
    const totalSec = parseDurationToSeconds(modality?.duration, isThermal ? 180 : 300)
    setTimerTotalDuration(totalSec)
    setTimerSecondsRemaining(totalSec)
    setIsTimerRunning(false)
    setIsTimerModalOpen(true)
  }

  // Timer Tick Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isTimerModalOpen && isTimerRunning && timerSecondsRemaining > 0) {
      interval = setInterval(() => {
        setTimerSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false)
            playGentleChime()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerModalOpen, isTimerRunning, timerSecondsRemaining])

  const peakGuidance = getPeakOnsetGuidance(modality)

  // Acute Session Baseline Check: Count how many pre-baselines are recorded
  const preBaselineRecordedCount = useMemo(() => {
    return Object.keys(preTouchedOutcomes).filter(k => preTouchedOutcomes[k]).length
  }, [preTouchedOutcomes])

  // Format MM:SS for countdown timer
  const formatTimerTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <>
      <div className={`fixed inset-0 z-50 flex flex-col ${isDaylight ? 'bg-[#F7F9F7] text-[#475569]' : 'bg-slate-950/95 text-white'} backdrop-blur-2xl overflow-hidden animate-in fade-in duration-200`}>
        {/* Top Header Bar */}
        <div
          className={`w-full shrink-0 flex items-center justify-between px-3 sm:px-6 py-3 border-b ${isDaylight ? 'border-[#E1E8E3] bg-[#F7F9F7]/95 text-[#475569]' : 'border-white/10 bg-slate-950/80 text-white'} backdrop-blur-xl`}
          style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
        >
          {/* Back to Today Button */}
          <button
            onClick={onClose}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isDaylight ? 'bg-[#EFF3F0] hover:bg-[#E1E8E3] text-[#475569]' : 'bg-white/10 hover:bg-white/20 text-white'} font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95`}
          >
            <ArrowLeft size={14} />
            <span>Today</span>
          </button>

          {/* 4-Tab Segmented Switcher */}
          <div className={`flex items-center p-1 rounded-full ${isDaylight ? 'bg-white/60 border border-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] backdrop-blur-md' : 'bg-black/60 border border-white/10 backdrop-blur-md'} shadow-inner`}>
            {(['Session', 'Outcomes', 'Protocol', 'Science'] as const).map((tabName, idx) => (
              <button
                key={tabName}
                onClick={() => setActiveTab(idx as 0 | 1 | 2 | 3)}
                className={`px-2.5 sm:px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                  activeTab === idx
                    ? isDaylight
                      ? 'bg-gradient-to-r from-purple-500/20 via-purple-600/25 to-indigo-500/20 text-purple-950 font-black border border-purple-400/50 shadow-[0_2px_10px_rgba(105,84,200,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                      : 'bg-purple-500/30 text-purple-100 font-bold border border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.3)] backdrop-blur-md'
                    : isDaylight
                    ? 'text-[#526661] hover:text-[#1e293b] hover:bg-white/50 border border-transparent font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent font-medium'
                }`}
              >
                {tabName}
              </button>
            ))}
          </div>

          {/* Right Header Area: Activity Details label in Daylight + Close Button */}
          <div className="flex items-center gap-2">
            {isDaylight && (
              <span className="text-[11px] font-bold tracking-wider text-[#526661] uppercase hidden md:inline">
                Activity Details
              </span>
            )}
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full ${isDaylight ? 'bg-[#EFF3F0] hover:bg-[#E1E8E3] text-[#526661] hover:text-[#475569]' : 'bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white'} flex items-center justify-center transition-all cursor-pointer`}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Desktop Side Floating Arrow Buttons */}
        <button
          onClick={() => {
            if (activeTab === 0) onClose()
            else setActiveTab((prev) => (prev - 1) as 0 | 1 | 2 | 3)
          }}
          className={`hidden md:flex fixed left-5 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full ${isDaylight ? 'bg-white/95 hover:bg-[#6954C8] text-[#475569] hover:text-white border-[#E1E8E3]' : 'bg-slate-900/80 hover:bg-purple-600 text-white border-white/20'} border items-center justify-center shadow-lg transition-all cursor-pointer hover:scale-110 active:scale-95 backdrop-blur-md`}
          title={activeTab === 0 ? 'Return to Today' : 'Previous page'}
        >
          <ChevronLeft size={22} />
        </button>

        <button
          onClick={() => {
            if (activeTab < 3) setActiveTab((prev) => (prev + 1) as 0 | 1 | 2 | 3)
            else onClose()
          }}
          className={`hidden md:flex fixed right-5 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full ${isDaylight ? 'bg-white/95 hover:bg-[#6954C8] text-[#475569] hover:text-white border-[#E1E8E3]' : 'bg-slate-900/80 hover:bg-purple-600 text-white border-white/20'} border items-center justify-center shadow-lg transition-all cursor-pointer hover:scale-110 active:scale-95 backdrop-blur-md`}
          title={activeTab < 3 ? 'Next page' : 'Return to Today'}
        >
          <ChevronRight size={22} />
        </button>

        {/* Main Content Area (Swipeable Carousel) */}
        <div
          className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 max-w-4xl mx-auto w-full pb-12"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* ========================================================================= */}
          {/* CARD 1: SESSION & LIVE ACTION */}
          {/* ========================================================================= */}
          {activeTab === 0 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Hero Block Header (Daylight vs Dark Neon) */}
              {isDaylight ? (
                <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E1E8E3] shadow-sm relative overflow-hidden">
                  {/* Concentric rings line-art sculptural motif */}
                  <svg className="absolute -top-6 -right-6 w-36 sm:w-44 h-36 sm:h-44 pointer-events-none stroke-[#E1E8E3]" viewBox="0 0 100 100" fill="none">
                    <circle cx="55" cy="50" r="42" strokeWidth="0.8" />
                    <circle cx="55" cy="50" r="32" strokeWidth="0.8" />
                    <circle cx="55" cy="50" r="22" strokeWidth="0.8" />
                  </svg>

                  {/* Category Pill & Icon */}
                  <div className="flex items-center gap-2 relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${daylightCategory.iconContainerClass}`}>
                      <ModalityIcon modality={modality} size={16} glow={false} />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EFF3F0] text-[#475569]">
                      {daylightCategory.label}
                    </span>
                  </div>

                  {/* Protocol Attribution */}
                  <div className="text-[11px] font-bold tracking-wider uppercase text-[#526661] mt-3 relative z-10">
                    {protocolName ? protocolName.toUpperCase() : 'LEVL PROTOCOL'}
                  </div>

                  {/* Prominent Title (Deep Botanical Ink #475569 - High Contrast) */}
                  <h1 className="text-3xl sm:text-4xl font-black text-[#475569] tracking-tight leading-tight mt-1 relative z-10">
                    {fullName}.
                  </h1>

                  {/* Subtitle / Headline Benefit */}
                  <p className="text-sm sm:text-base text-[#526661] mt-2 font-normal leading-relaxed max-w-lg relative z-10">
                    {modality?.headline_benefit || modality?.brief_description || 'Strength, mobility, and a daily rhythm.'}
                  </p>

                  {/* Divider */}
                  <div className="border-t border-[#E1E8E3] my-4" />

                  {/* Prescription Stack: Dosage & Schedule Vertically Stacked */}
                  <div className="flex flex-col gap-3 py-1">
                    <div>
                      <div className="text-xs font-semibold text-[#526661] dark:text-slate-400 mb-1">
                        {isPeptide || isSupplement || dose ? 'Dose / Amount' : 'Duration'}
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-[#475569] dark:text-white flex items-center gap-2 flex-wrap">
                        <span>{dose || modality?.duration || modality?.dose_or_exposure || '45–60 min'}</span>
                        <button
                          type="button"
                          onClick={() => setIsDosageModalOpen(true)}
                          className="text-xs font-semibold text-[#6954C8] hover:text-[#5944B6] dark:text-purple-400 dark:hover:text-purple-300 underline ml-1 cursor-pointer shrink-0"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-[#E1E8E3] dark:border-white/10">
                      <div className="text-xs font-semibold text-[#526661] dark:text-slate-400 mb-1">Schedule</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-bold text-[#475569] dark:text-white">
                          {modality?.frequency || 'Every day'}
                        </span>
                        <span className="text-xs font-medium text-[#526661] dark:text-slate-300 bg-[#EFF3F0] dark:bg-white/10 px-2 py-0.5 rounded-md">
                          {task.timing_slot ? `Window: ${task.timing_slot.replace('_', ' ')}` : 'Before first meal'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#E1E8E3] my-4" />

                  {/* Action Buttons Row */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                    {/* Primary Action Button */}
                    {isPeptide ? (
                      <button
                        onClick={handleToggleComplete}
                        className={`w-full sm:flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
                          isDaylight
                            ? 'bg-gradient-to-r from-purple-500/25 via-indigo-500/30 to-purple-500/25 hover:from-purple-500/35 hover:to-indigo-500/40 border border-purple-400/60 text-purple-950 shadow-[0_4px_20px_rgba(105,84,200,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                            : 'bg-[#6954C8] hover:bg-[#5944B6] text-white shadow-sm'
                        }`}
                      >
                        <Check size={18} strokeWidth={2.5} />
                        <span>{isCompleted ? 'Completed' : 'Record SubQ Injection'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (has478) setActiveApplet('478')
                          else if (hasCyclicSigh) setActiveApplet('cyclicsigh')
                          else if (hasBoxBreathing) setActiveApplet('box')
                          else if (hasHyperventilation) setActiveApplet('hyperventilation')
                          else if (hasCoherent) setActiveApplet('coherent')
                          else if (hasYogaNidra) setActiveApplet('yoganidra')
                          else if (hasRedLight) setActiveApplet('redlight')
                          else if (hasColdPlunge) setActiveApplet('coldplunge')
                          else if (hasGlucoseWalk) setActiveApplet('glucosewalk')
                          else if (hasSauna) setActiveApplet('sauna')
                          else if (has4x4HIIT) setActiveApplet('hiit4x4')
                          else if (hasZone2) setActiveApplet('zone2')
                          else handleLaunchTimer()
                        }}
                        className={`w-full sm:flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
                          isDaylight
                            ? 'bg-gradient-to-r from-purple-500/25 via-indigo-500/30 to-purple-500/25 hover:from-purple-500/35 hover:to-indigo-500/40 border border-purple-400/60 text-purple-950 shadow-[0_4px_20px_rgba(105,84,200,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                            : 'bg-[#6954C8] hover:bg-[#5944B6] text-white shadow-sm'
                        }`}
                      >
                        <Play size={18} className={isDaylight ? 'fill-purple-950 text-purple-950' : 'fill-white text-white'} />
                        <span>Start session</span>
                      </button>
                    )}

                    {/* Secondary Action Button */}
                    <button
                      onClick={handleToggleComplete}
                      className={`w-full sm:flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 border transition-all cursor-pointer active:scale-98 ${
                        isCompleted
                          ? isDaylight
                            ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/25 to-emerald-500/20 text-emerald-950 border-emerald-400/50 shadow-[0_2px_12px_rgba(16,185,129,0.15)] backdrop-blur-md'
                            : 'bg-[#E6F3EB] text-[#2B725C] border-[#2B725C]/30 shadow-sm'
                          : isDaylight
                          ? 'bg-white/80 hover:bg-white text-[#475569] border-[#E1E8E3] shadow-sm backdrop-blur-sm'
                          : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                      }`}
                    >
                      <Check size={18} strokeWidth={isCompleted ? 3 : 2} className={isCompleted ? (isDaylight ? 'text-emerald-700' : 'text-[#2B725C]') : 'text-[#475569]'} />
                      <span>{isCompleted ? 'Completed' : 'Mark done'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="p-5 sm:p-6 rounded-3xl border shadow-xl relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${hex}30 0%, rgba(15, 23, 42, 0.9) 100%)`,
                    borderColor: `${hex}60`,
                    boxShadow: `0 10px 40px ${hex}20`
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border"
                        style={{
                          background: `linear-gradient(135deg, ${hex}DD, ${hex}99)`,
                          borderColor: 'rgba(255,255,255,0.4)'
                        }}
                      >
                        <ModalityIcon modality={modality} size={30} glow={true} />
                      </div>
                      <div>
                        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{fullName}</h1>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                            {theme.label}
                          </span>
                          {protocolName && (
                            <span className="text-[11px] font-medium text-purple-300 flex items-center gap-1">
                              <Layers size={11} /> {protocolName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Big Complete Status Toggle Block */}
                    <button
                      onClick={handleToggleComplete}
                      className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                        isCompleted
                          ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                      }`}
                    >
                      <Check size={16} strokeWidth={isCompleted ? 3 : 2} />
                      <span>{isCompleted ? 'Completed' : 'Mark Done'}</span>
                    </button>
                  </div>

                  {/* Dose & Timing Pill Highlights */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/10 text-xs">
                    {dose ? (
                      <button
                        onClick={() => setIsDosageModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-black/50 hover:bg-black/80 border border-white/15 hover:border-amber-400 font-mono font-bold text-amber-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 group"
                        title="Click to adjust dosage, timing, or protocol parameters"
                      >
                        <Sliders size={13} className="text-amber-400 group-hover:rotate-45 transition-transform" />
                        <span>Dose: {dose}</span>
                        <span className="text-[10px] text-amber-400/80 font-sans ml-1 underline font-semibold">Edit</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsDosageModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-dashed border-amber-500/40 font-mono text-amber-300 flex items-center gap-1.5 transition-all cursor-pointer text-xs"
                      >
                        <Plus size={13} />
                        <span>Set Custom Dose</span>
                      </button>
                    )}

                    {modality?.frequency && (
                      <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-300">
                        Freq: {modality.frequency}
                      </div>
                    )}

                    {modality?.duration && !isPeptide && (
                      <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-300">
                        Duration: {modality.duration}
                      </div>
                    )}

                    {isPeptide && (
                      <div className="px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold flex items-center gap-1.5 shadow-sm">
                        <Syringe size={13} className="text-cyan-400" />
                        <span>SubQ Syringe Injection</span>
                      </div>
                    )}

                    {modality?.temperature && (
                      <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-cyan-300">
                        Temp: {modality.temperature}
                      </div>
                    )}

                    {task.timing_slot && (
                      <button
                        onClick={() => setIsDosageModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-purple-400 text-slate-300 hover:text-white capitalize flex items-center gap-1 transition-all cursor-pointer"
                        title="Click to change timing window"
                      >
                        <Clock size={12} className="text-purple-400" />
                        <span>Window: {task.timing_slot.replace('_', ' ')}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Pre-Flight Spacing & Interference Alerts */}
              {preFlightNudge && (
                <PreFlightSpacingNudgeBanner
                  nudge={preFlightNudge}
                  task={task}
                  onOpenReschedule={(t) => onOpenRescheduleModal?.(t as DedupedTask)}
                />
              )}

              {/* PRE-SESSION BASELINE DRAWER */}
              <div className={`rounded-2xl border ${isDaylight ? 'border-[#E1E8E3] bg-white shadow-sm' : 'border-white/15 bg-slate-900/90 shadow-lg'} overflow-hidden transition-all`}>
                <button
                  type="button"
                  onClick={() => setIsPreBaselineOpen(!isPreBaselineOpen)}
                  className={`w-full flex items-center justify-between p-4 ${isDaylight ? 'hover:bg-[#EFF3F0]/60' : 'bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent hover:bg-white/5'} transition-all cursor-pointer`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${isDaylight ? 'bg-[#E6F3EB] text-[#2B725C] border border-[#2B725C]/20' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'} flex items-center justify-center shrink-0`}>
                      <Activity size={18} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>
                          {isDaylight ? 'How are you feeling?' : 'Pre-Session Baseline Check'}
                        </span>
                        {preBaselineRecordedCount > 0 && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDaylight ? 'bg-[#E6F3EB] text-[#2B725C] border border-[#2B725C]/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'} flex items-center gap-1`}>
                            <Check size={11} /> {preBaselineRecordedCount} Recorded
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${isDaylight ? 'text-[#526661]' : 'text-slate-400'} mt-0.5`}>
                        {isPreBaselineOpen
                          ? 'Rate your acute state before beginning session'
                          : isDaylight
                          ? 'Optional pre-session check-in'
                          : preBaselineRecordedCount > 0
                          ? 'Tap to view or update your pre-session baseline'
                          : 'Tap to record how you feel before starting'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold hidden sm:inline ${isDaylight ? 'text-[#526661]' : 'text-amber-300'}`}>
                      {isPreBaselineOpen ? 'Collapse' : isDaylight ? 'Pre-session check-in' : 'Record Baseline'}
                    </span>
                    {isPreBaselineOpen ? (
                      <ChevronUp size={18} className={isDaylight ? 'text-[#526661]' : 'text-slate-400'} />
                    ) : (
                      <ChevronDown size={18} className={isDaylight ? 'text-[#526661]' : 'text-slate-400'} />
                    )}
                  </div>
                </button>

                {isPreBaselineOpen && (
                  <div className={`p-4 sm:p-5 border-t ${isDaylight ? 'border-[#E1E8E3] bg-[#EFF3F0]/40' : 'border-white/10 bg-black/40'} space-y-4 animate-in fade-in duration-200`}>
                    <p className={`text-xs ${isDaylight ? 'text-[#526661]' : 'text-slate-300'} leading-relaxed`}>
                      Rate your current acute baseline before starting. LEVL calculates post-session deltas (e.g. Stress -4, Alertness +3) to personalize your optimal protocol dosing.
                    </p>

                    <div className="space-y-4">
                      {activeOutcomeDimensions
                        .filter((o) => isPreLoggableOutcome(o.id))
                        .map((outcome) => {
                          const val = preSliderValues[outcome.id] ?? 5
                          const isTouched = preTouchedOutcomes[outcome.id]
                          const colorCfg = isTouched
                            ? getOutcomeColorConfig(val, outcome.directionality)
                            : getNeutralOutcomeColorConfig()
                          const isLowerBetter = outcome.directionality === 'lower_is_better'

                          return (
                            <div
                              key={outcome.id}
                              className={`space-y-2 ${isDaylight ? 'bg-white border-[#E1E8E3] shadow-sm' : 'bg-white/5 border-white/5'} p-3.5 rounded-xl border`}
                            >
                              <div className="flex justify-between items-center text-xs sm:text-sm">
                                <span className={`${isDaylight ? 'text-[#475569]' : 'text-white'} font-bold`}>{outcome.name}</span>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`font-mono font-bold px-2 py-0.5 rounded-lg border ${
                                      isTouched
                                        ? isDaylight
                                          ? `${colorCfg.textColor} bg-[#EFF3F0] border-[#E1E8E3]`
                                          : `${colorCfg.textColor} bg-white/10 border-white/20`
                                        : isDaylight
                                        ? 'text-[#526661] bg-[#EFF3F0] border-[#E1E8E3]'
                                        : 'text-slate-400 bg-white/5 border-white/10'
                                    }`}
                                  >
                                    {val}/10
                                  </span>
                                </div>
                              </div>

                              <input
                                type="range"
                                min="0"
                                max="10"
                                step="1"
                                value={val}
                                onChange={(e) => handlePreSliderChange(outcome.id, parseInt(e.target.value, 10))}
                                onPointerDown={() => {
                                  if (!isTouched) {
                                    setPreTouchedOutcomes((prev) => ({ ...prev, [outcome.id]: true }))
                                  }
                                }}
                                className="w-full cursor-pointer touch-manipulation"
                                style={{ accentColor: colorCfg.accentHex }}
                              />

                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                <span className={isLowerBetter ? (isDaylight ? 'text-[#2B725C]' : 'text-emerald-400') : (isDaylight ? 'text-[#526661]' : 'text-slate-400')}>
                                  0: {isLowerBetter ? 'None / Baseline' : 'Low / Poor'}
                                </span>
                                <span className={isLowerBetter ? (isDaylight ? 'text-[#526661]' : 'text-slate-400') : (isDaylight ? 'text-[#2B725C]' : 'text-emerald-400')}>
                                  10: {isLowerBetter ? 'Severe' : 'Peak'}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* "The Practice" Section Header / Divider */}
              <div className="flex items-center justify-between pt-1 pb-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDaylight ? 'text-[#475569]' : 'text-slate-400'}`}>
                  The practice
                </span>
                <div className={`w-7 h-7 rounded-full ${isDaylight ? 'bg-[#EFF3F0] text-[#526661] border border-[#E1E8E3]' : 'bg-white/10 text-slate-300'} flex items-center justify-center shadow-sm`}>
                  <ArrowDown size={14} />
                </div>
              </div>

              {/* PRIMARY INTERACTIVE SESSION LAUNCHER ("Start Session" Full-Screen) */}
              {isPeptide ? (
                <div className={`p-4 sm:p-5 rounded-3xl ${isDaylight ? 'bg-white border border-[#E1E8E3] shadow-sm' : 'bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-950 border border-cyan-500/40 shadow-2xl'} space-y-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl ${isDaylight ? 'bg-[#EAF5FA] text-[#236F92] border border-[#236F92]/20' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]'} flex items-center justify-center`}>
                        <Syringe size={18} />
                      </div>
                      <div>
                        <h3 className={`text-sm font-black ${isDaylight ? 'text-[#475569]' : 'text-white'} uppercase tracking-wider flex items-center gap-2`}>
                          <span>Active SubQ Administration Guide</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md ${isDaylight ? 'bg-[#EAF5FA] text-[#236F92] border border-[#236F92]/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'} font-mono font-bold`}>
                            U-100 Standard • SubQ
                          </span>
                        </h3>
                        <p className={`text-[11px] ${isDaylight ? 'text-[#526661]' : 'text-cyan-200/80'}`}>
                          Precision syringe drawing guide &amp; anatomical injection site rotation
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${isDaylight ? 'bg-[#EFF3F0] text-[#475569] border border-[#E1E8E3]' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'} shadow-sm`}>
                        {dose || modality?.dose_or_exposure || `${resolvePeptideTargetDoseMcg(task, modality)} mcg`}
                      </span>
                    </div>
                  </div>

                  {/* If completed and not editing, show summary, otherwise show active syringe guide */}
                  {isCompleted && !isEditingExecution && executionDetails && Object.keys(executionDetails).length > 0 ? (
                    <CompletedExecutionSummary
                      modalityType={modality?.modality_type || modality?.category || ''}
                      loggingType={archetype || 'peptide'}
                      details={executionDetails}
                      onEdit={() => setIsEditingExecution(true)}
                    />
                  ) : (
                    /* Visual Syringe Drawing Guide + Site Rotation Engine */
                    <div className="pt-1">
                      <PeptideExecutionLog
                        value={executionDetails}
                        onChange={setExecutionDetails}
                        modality={modality}
                        modalityKey={(modality?.slug || modality?.id || '').toLowerCase()}
                        defaultDoseMcg={resolvePeptideTargetDoseMcg(task, modality)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className={`p-5 rounded-3xl ${isDaylight ? 'bg-white border border-[#E1E8E3] shadow-sm' : 'bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900 border border-purple-500/30 shadow-xl'} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl ${isDaylight ? 'bg-[#F0EDFB] text-[#6954C8] border border-[#6954C8]/20' : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'} flex items-center justify-center`}>
                        <Play size={16} />
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>Interactive Session Execution</h3>
                        <p className={`text-[11px] ${isDaylight ? 'text-[#526661]' : 'text-purple-200/80'}`}>Launch full-screen immersive guide or session timer</p>
                      </div>
                    </div>

                    {modality?.duration && (
                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${isDaylight ? 'bg-[#F0EDFB] text-[#6954C8] border border-[#6954C8]/30' : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'}`}>
                        {modality.duration}
                      </span>
                    )}
                  </div>

                  <div className="pt-2">
                    {has478 ? (
                      <button
                        onClick={() => setActiveApplet('478')}
                        className={`w-full py-3.5 rounded-2xl active:scale-98 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          isDaylight
                            ? 'bg-gradient-to-r from-purple-500/25 via-indigo-500/30 to-purple-500/25 hover:from-purple-500/35 hover:to-indigo-500/40 text-purple-950 border border-purple-400/60 shadow-[0_4px_20px_rgba(105,84,200,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                            : 'bg-[#6954C8] hover:bg-[#5944B6] text-white shadow-lg'
                        }`}
                      >
                        <Play size={18} /> Launch 4-7-8 Breathing Pacer
                      </button>
                    ) : hasCyclicSigh ? (
                      <button
                        onClick={() => setActiveApplet('cyclicsigh')}
                        className={`w-full py-3.5 rounded-2xl active:scale-98 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          isDaylight
                            ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/30 to-emerald-500/25 hover:from-emerald-500/35 hover:to-teal-500/35 text-emerald-950 border border-emerald-400/60 shadow-[0_4px_20px_rgba(16,185,129,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                            : 'bg-[#2B725C] hover:bg-[#23604d] text-white shadow-lg'
                        }`}
                      >
                        <Play size={18} /> Launch Cyclic Sighing Session
                      </button>
                    ) : hasBoxBreathing ? (
                      <button
                        onClick={() => setActiveApplet('box')}
                        className={`w-full py-3.5 rounded-2xl active:scale-98 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          isDaylight
                            ? 'bg-gradient-to-r from-cyan-500/25 via-sky-500/30 to-cyan-500/25 hover:from-cyan-500/35 hover:to-sky-500/35 text-cyan-950 border border-cyan-400/60 shadow-[0_4px_20px_rgba(6,182,212,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                            : 'bg-[#236F92] hover:bg-[#1d5c7a] text-white shadow-lg'
                        }`}
                      >
                        <Play size={18} /> Launch Box Breathing Pacer
                      </button>
                    ) : hasHyperventilation ? (
                      <button
                        onClick={() => setActiveApplet('hyperventilation')}
                        className={`w-full py-3.5 rounded-2xl active:scale-98 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          isDaylight
                            ? 'bg-gradient-to-r from-amber-500/25 via-orange-500/30 to-amber-500/25 hover:from-amber-500/35 hover:to-orange-500/35 text-amber-950 border border-amber-400/60 shadow-[0_4px_20px_rgba(245,158,11,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                            : 'bg-[#8A610E] hover:bg-[#73510c] text-white shadow-lg'
                        }`}
                      >
                        <Play size={18} /> Launch Cyclic Hyperventilation
                      </button>
                    ) : hasCoherent ? (
                      <button
                        onClick={() => setActiveApplet('coherent')}
                        className={`w-full py-3.5 rounded-2xl active:scale-98 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          isDaylight
                            ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/30 to-emerald-500/25 hover:from-emerald-500/35 hover:to-teal-500/35 text-emerald-950 border border-emerald-400/60 shadow-[0_4px_20px_rgba(16,185,129,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                            : 'bg-[#2B725C] hover:bg-[#23604d] text-white shadow-lg'
                        }`}
                      >
                        <Play size={18} /> Launch Coherent Breathing (6 BPM)
                      </button>
                    ) : hasYogaNidra ? (
                      <button
                        onClick={() => setActiveApplet('yoganidra')}
                        className={`w-full py-3.5 rounded-2xl active:scale-98 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          isDaylight
                            ? 'bg-gradient-to-r from-purple-500/25 via-indigo-500/30 to-purple-500/25 hover:from-purple-500/35 hover:to-indigo-500/40 text-purple-950 border border-purple-400/60 shadow-[0_4px_20px_rgba(105,84,200,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                            : 'bg-[#6954C8] hover:bg-[#5944B6] text-white shadow-lg'
                        }`}
                      >
                        <Play size={18} /> Launch Guided NSDR / Yoga Nidra
                      </button>
                    ) : hasRedLight ? (
                      <button
                        onClick={() => setActiveApplet('redlight')}
                        className={`w-full py-3.5 rounded-2xl active:scale-98 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          isDaylight
                            ? 'bg-gradient-to-r from-rose-500/25 via-red-500/30 to-rose-500/25 hover:from-rose-500/35 hover:to-red-500/35 text-rose-950 border border-rose-400/60 shadow-[0_4px_20px_rgba(244,63,94,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                            : 'bg-[#BA3E50] hover:bg-[#9d3443] text-white shadow-lg'
                        }`}
                      >
                        <Play size={18} /> Launch Red Light Mask Timer
                      </button>
                    ) : hasColdPlunge ? (
                      <button
                        onClick={() => setActiveApplet('coldplunge')}
                        className={`w-full py-3.5 rounded-2xl active:scale-98 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          isDaylight
                            ? 'bg-gradient-to-r from-cyan-500/25 via-blue-500/30 to-cyan-500/25 hover:from-cyan-500/35 hover:to-blue-500/35 text-cyan-950 border border-cyan-400/60 shadow-[0_4px_20px_rgba(6,182,212,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                            : 'bg-gradient-to-r from-[#0284C7] to-[#0369A1] hover:brightness-110 text-white shadow-lg shadow-cyan-900/40'
                        }`}
                      >
                        <Play size={18} /> Launch Cold Plunge Experience
                      </button>
                    ) : hasGlucoseWalk ? (
                      <button
                        onClick={() => setActiveApplet('glucosewalk')}
                        className={`w-full py-3.5 rounded-2xl active:scale-98 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          isDaylight
                            ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/30 to-emerald-500/25 hover:from-emerald-500/35 hover:to-teal-500/35 text-emerald-950 border border-emerald-400/60 shadow-[0_4px_20px_rgba(16,185,129,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                            : 'bg-gradient-to-r from-[#059669] to-[#047857] hover:brightness-110 text-white shadow-lg shadow-emerald-900/40'
                        }`}
                      >
                        <Play size={18} /> Launch Glucose Disposal Walk
                      </button>
                    ) : hasSauna ? (
                      <button
                        onClick={() => setActiveApplet('sauna')}
                        className={`w-full py-3.5 rounded-2xl active:scale-98 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          isDaylight
                            ? 'bg-gradient-to-r from-amber-500/25 via-orange-500/30 to-amber-500/25 hover:from-amber-500/35 hover:to-orange-500/35 text-amber-950 border border-amber-400/60 shadow-[0_4px_20px_rgba(245,158,11,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                            : 'bg-gradient-to-r from-[#D97706] to-[#B45309] hover:brightness-110 text-white shadow-lg shadow-amber-900/40'
                        }`}
                      >
                        <Play size={18} /> Launch Sauna Conditioning Session
                      </button>
                    ) : has4x4HIIT ? (
                      <button
                        onClick={() => setActiveApplet('hiit4x4')}
                        className={`w-full py-3.5 rounded-2xl active:scale-98 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          isDaylight
                            ? 'bg-gradient-to-r from-red-500/25 via-orange-500/30 to-red-500/25 hover:from-red-500/35 hover:to-orange-500/35 text-red-950 border border-red-400/60 shadow-[0_4px_20px_rgba(239,68,68,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                            : 'bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:brightness-110 text-white shadow-lg shadow-red-900/40'
                        }`}
                      >
                        <Play size={18} /> Launch Norwegian 4x4 Interval Coach
                      </button>
                    ) : hasZone2 ? (
                      <button
                        onClick={() => setActiveApplet('zone2')}
                        className={`w-full py-3.5 rounded-2xl active:scale-98 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          isDaylight
                            ? 'bg-gradient-to-r from-cyan-500/25 via-blue-500/30 to-cyan-500/25 hover:from-cyan-500/35 hover:to-blue-500/35 text-cyan-950 border border-cyan-400/60 shadow-[0_4px_20px_rgba(6,182,212,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                            : 'bg-gradient-to-r from-[#0284C7] to-[#1D4ED8] hover:brightness-110 text-white shadow-lg shadow-cyan-900/40'
                        }`}
                      >
                        <Play size={18} /> Launch Zone 2 Aerobic Base
                      </button>
                    ) : (
                      <button
                        onClick={handleLaunchTimer}
                        className={`w-full py-3.5 rounded-2xl active:scale-98 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          isDaylight
                            ? 'bg-gradient-to-r from-purple-500/25 via-indigo-500/30 to-purple-500/25 hover:from-purple-500/35 hover:to-indigo-500/40 text-purple-950 border border-purple-400/60 shadow-[0_4px_20px_rgba(105,84,200,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                            : 'bg-gradient-to-r from-[#6954C8] to-[#5944B6] hover:brightness-110 text-white shadow-lg'
                        }`}
                      >
                        <Play size={18} /> Launch Full-Screen Session Timer
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Modality Brief Description */}
              {modality?.brief_description && (
                <div className={`p-4 sm:p-5 rounded-2xl ${isDaylight ? 'bg-white border border-[#E1E8E3] shadow-sm' : 'bg-slate-900/90 border border-white/10 shadow-md'} space-y-1.5`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isDaylight ? 'text-[#6954C8]' : 'text-purple-400'} flex items-center gap-1.5`}>
                    <Info size={14} /> Description
                  </h3>
                  <p className={`text-sm ${isDaylight ? 'text-[#475569]' : 'text-slate-200'} leading-relaxed`}>{modality.brief_description}</p>
                </div>
              )}

              {/* Headline Benefit & Expanded Why */}
              {(modality?.headline_benefit || modality?.expanded_why) && (
                <div className={`p-4 sm:p-5 rounded-2xl ${isDaylight ? 'bg-white border border-[#E1E8E3] shadow-sm' : 'bg-purple-950/30 border border-purple-500/20 shadow-md'} space-y-2`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isDaylight ? 'text-[#6954C8]' : 'text-purple-300'} flex items-center gap-1.5`}>
                    <Sparkles size={14} className={isDaylight ? 'text-[#6954C8]' : 'text-purple-400'} /> Clinical Target &amp; Impact
                  </h3>
                  {modality.headline_benefit && (
                    <p className={`text-sm font-semibold ${isDaylight ? 'text-[#475569]' : 'text-purple-100'} leading-relaxed`}>
                      {modality.headline_benefit}
                    </p>
                  )}
                  {modality.expanded_why && (
                    <p className={`text-xs ${isDaylight ? 'text-[#526661]' : 'text-slate-300'} leading-relaxed whitespace-pre-line pt-1 border-t ${isDaylight ? 'border-[#E1E8E3]' : 'border-purple-500/20'}`}>
                      {modality.expanded_why}
                    </p>
                  )}
                </div>
              )}

              {/* The Practice Section Header & Step Cards */}
              {isDaylight ? (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-[#475569] tracking-tight">The practice</h2>
                    <div className="w-7 h-7 rounded-full bg-white border border-[#E1E8E3] flex items-center justify-center text-[#526661] shadow-xs">
                      <ArrowDown size={14} />
                    </div>
                  </div>

                  {modality?.instructions ? (
                    <div className="space-y-2.5">
                      {parsePracticeSteps(modality.instructions).map((step, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-white border border-[#E1E8E3] shadow-sm flex items-start gap-3.5">
                          <div className="w-7 h-7 rounded-full bg-[#EFF3F0] text-[#475569] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[#E1E8E3]">
                            {idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-[#475569] mb-0.5">{step.title}</div>
                            <p className="text-xs text-[#526661] leading-relaxed whitespace-pre-line">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Biomarkers & evidence Collapsible Accordion (Matching Daylight spec) */}
                  <div className="rounded-2xl border border-[#E1E8E3] bg-white shadow-sm overflow-hidden transition-all">
                    <button
                      type="button"
                      onClick={() => setIsBiomarkersExpanded(!isBiomarkersExpanded)}
                      className="w-full flex items-center justify-between p-4 hover:bg-[#EFF3F0]/60 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#E6F3EB] text-[#2B725C] border border-[#2B725C]/20 flex items-center justify-center shrink-0">
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#475569]">Biomarkers &amp; evidence</div>
                          <div className="text-xs text-[#526661]">
                            {targetedBiomarkers.length > 0
                              ? `${targetedBiomarkers.length} verified clinical targets`
                              : '8 Longevity Vectors & clinical evidence'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#526661] hidden sm:inline">
                          {isBiomarkersExpanded ? 'Collapse' : 'View science'}
                        </span>
                        {isBiomarkersExpanded ? (
                          <ChevronUp size={18} className="text-[#526661]" />
                        ) : (
                          <ChevronDown size={18} className="text-[#526661]" />
                        )}
                      </div>
                    </button>

                    {isBiomarkersExpanded && (
                      <div className="p-4 sm:p-5 border-t border-[#E1E8E3] bg-[#EFF3F0]/40 space-y-4 animate-in fade-in duration-150">
                        {targetedBiomarkers.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-bold text-[#475569]">Targeted Clinical Biomarkers:</div>
                            <div className="flex flex-wrap gap-1.5">
                              {targetedBiomarkers.map((bm: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded-xl bg-white border border-[#E1E8E3] text-[#475569] text-xs font-mono font-bold shadow-xs"
                                >
                                  {bm}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setActiveTab(3)}
                            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#EFF3F0] text-[#6954C8] font-bold text-xs border border-[#E1E8E3] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <span>Explore 8 Longevity Vectors &amp; PubMed studies</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Dark Mode Core Instructions Block */
                modality?.instructions && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/10 shadow-md">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
                      <Info size={14} /> Core Instructions &amp; Execution
                    </h3>
                    <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{modality.instructions}</p>
                  </div>
                )
              )}

              {/* PRECISION EXECUTION LOGGERS (Sets for workouts, thermal temps, cardio distance/HR, etc.) */}
              {hasPrecisionLogUI && !isPeptide && (
                <div className="space-y-3">
                  {isCompleted && !isEditingExecution && executionDetails && Object.keys(executionDetails).length > 0 ? (
                    <div className="relative">
                      <CompletedExecutionSummary
                        modalityType={modality?.modality_type || modality?.category || ''}
                        loggingType={archetype || ''}
                        details={executionDetails}
                        onEdit={() => setIsEditingExecution(true)}
                      />
                    </div>
                  ) : (
                    <div className={`p-4 sm:p-5 rounded-2xl ${isDaylight ? 'bg-white border border-[#E1E8E3] shadow-sm' : 'bg-slate-950/90 border border-cyan-500/30 shadow-lg'} space-y-3`}>
                      <div className={`flex items-center justify-between border-b ${isDaylight ? 'border-[#E1E8E3]' : 'border-white/10'} pb-2`}>
                        <span className={`text-xs font-black uppercase tracking-wider ${isDaylight ? 'text-[#236F92]' : 'text-cyan-300'} flex items-center gap-1.5`}>
                          <Activity size={14} className={isDaylight ? 'text-[#236F92]' : 'text-cyan-400'} /> Precision Execution Log
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] ${isDaylight ? 'text-[#526661]' : 'text-slate-400'} font-mono`}>
                            {modality?.display_name || modality?.name}
                          </span>
                          {isCompleted && isEditingExecution && (
                            <button
                              type="button"
                              onClick={() => setIsEditingExecution(false)}
                              className={`text-[10px] font-bold ${isDaylight ? 'text-[#526661] hover:text-[#475569] bg-[#EFF3F0] hover:bg-[#E1E8E3]' : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10'} px-2 py-0.5 rounded-lg transition-colors`}
                            >
                              Done Editing
                            </button>
                          )}
                        </div>
                      </div>

                      {isStrength && (
                        <StrengthExecutionLog
                          value={executionDetails}
                          onChange={setExecutionDetails}
                          lockedExerciseName={lockedExerciseName}
                          specializedTraits={specializedTraits}
                        />
                      )}
                      {isThermal && <ThermalExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                      {isCardio && (
                        <CardioExecutionLog
                          value={executionDetails}
                          onChange={setExecutionDetails}
                          lockedCardioType={lockedCardioType}
                          specializedTraits={specializedTraits}
                        />
                      )}
                      {isBreathwork && <BreathworkExecutionLog value={executionDetails} onChange={setExecutionDetails} />}
                      {isNSDR && (
                        <NSDRExecutionLog
                          value={executionDetails}
                          onChange={setExecutionDetails}
                          onOpenFullscreen={() => setActiveApplet('yoganidra')}
                        />
                      )}
                      {isFasting && (
                        <FastingExecutionLog
                          value={executionDetails}
                          onChange={setExecutionDetails}
                          isMultiDay={
                            (modality?.slug || '').includes('16:8') || (modality?.slug || '').includes('18:6')
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
                          date={date}
                          localUserId={localUserId}
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
                          modalityKey={(modality?.slug || modality?.id || '').toLowerCase()}
                          defaultDoseMcg={task.protocol_step?.dose_amount || 250}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Modality Action 2x2 Grid */}
              <div className="space-y-2">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDaylight ? 'text-[#526661]' : 'text-slate-400'}`}>Modality Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => setIsDosageModalOpen(true)}
                    className={`p-3.5 rounded-2xl ${isDaylight ? 'bg-white hover:bg-[#EFF3F0] border-[#E1E8E3] hover:border-[#6954C8]/40 shadow-sm' : 'bg-slate-900/90 hover:bg-slate-800 border-white/10 hover:border-cyan-500/40'} border text-left transition-all active:scale-95 group cursor-pointer`}
                  >
                    <Sliders size={16} className={`${isDaylight ? 'text-[#6954C8]' : 'text-cyan-400'} mb-1.5 group-hover:scale-110 transition-transform`} />
                    <div className={`text-xs font-bold ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>Schedule &amp; Dose</div>
                    <div className={`text-[10px] ${isDaylight ? 'text-[#526661]' : 'text-slate-400'}`}>Timing, splits &amp; dose</div>
                  </button>

                  <button
                    onClick={() => onOpenRescheduleModal?.(task)}
                    className={`p-3.5 rounded-2xl ${isDaylight ? 'bg-white hover:bg-[#EFF3F0] border-[#E1E8E3] hover:border-[#8A610E]/40 shadow-sm' : 'bg-slate-900/90 hover:bg-slate-800 border-white/10 hover:border-amber-500/40'} border text-left transition-all active:scale-95 group cursor-pointer`}
                  >
                    <Clock size={16} className={`${isDaylight ? 'text-[#8A610E]' : 'text-amber-400'} mb-1.5 group-hover:scale-110 transition-transform`} />
                    <div className={`text-xs font-bold ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>Snooze / Reschedule</div>
                    <div className={`text-[10px] ${isDaylight ? 'text-[#526661]' : 'text-slate-400'}`}>Shift time or day</div>
                  </button>

                  <button
                    onClick={() => modality?.id && onMoveToBench?.(modality.id)}
                    className={`p-3.5 rounded-2xl ${isDaylight ? 'bg-white hover:bg-[#EFF3F0] border-[#E1E8E3] hover:border-[#6954C8]/40 shadow-sm' : 'bg-slate-900/90 hover:bg-slate-800 border-white/10 hover:border-purple-500/40'} border text-left transition-all active:scale-95 group cursor-pointer`}
                  >
                    <Bookmark size={16} className={`${isDaylight ? 'text-[#6954C8]' : 'text-purple-400'} mb-1.5 group-hover:scale-110 transition-transform`} />
                    <div className={`text-xs font-bold ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>Move to Bench</div>
                    <div className={`text-[10px] ${isDaylight ? 'text-[#526661]' : 'text-slate-400'}`}>Rest or substitute</div>
                  </button>

                  <button
                    onClick={() => onStatusChange(task.id, 'skipped', 'Skipped by user')}
                    className={`p-3.5 rounded-2xl ${isDaylight ? 'bg-white hover:bg-[#EFF3F0] border-[#E1E8E3] hover:border-[#BA3E50]/40 shadow-sm' : 'bg-slate-900/90 hover:bg-slate-800 border-white/10 hover:border-rose-500/40'} border text-left transition-all active:scale-95 group cursor-pointer`}
                  >
                    <SkipForward size={16} className={`${isDaylight ? 'text-[#BA3E50]' : 'text-rose-400'} mb-1.5 group-hover:scale-110 transition-transform`} />
                    <div className={`text-xs font-bold ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>Skip for Today</div>
                    <div className={`text-[10px] ${isDaylight ? 'text-[#526661]' : 'text-slate-400'}`}>Log without penalty</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CARD 2: SUBJECTIVE OUTCOMES & RECOVERY */}
          {/* ========================================================================= */}
          {activeTab === 1 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className={`flex items-center justify-between border-b ${isDaylight ? 'border-[#E1E8E3]' : 'border-white/10'} pb-3`}>
                <div>
                  <h2 className={`text-lg font-black ${isDaylight ? 'text-[#475569]' : 'text-white'} flex items-center gap-2`}>
                    <Activity size={18} className={isDaylight ? 'text-[#2B725C]' : 'text-emerald-400'} /> Subjective Outcomes &amp; Recovery
                  </h2>
                  <p className={`text-xs ${isDaylight ? 'text-[#526661]' : 'text-slate-400'}`}>Rate biological &amp; experiential impact on a 0–10 scale</p>
                </div>

                <button
                  onClick={() => setIsCustomizeOutcomesOpen(!isCustomizeOutcomesOpen)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-xl ${isDaylight ? 'bg-[#EFF3F0] hover:bg-[#E1E8E3] border-[#E1E8E3] text-[#475569]' : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'} border flex items-center gap-1.5 transition-all cursor-pointer`}
                >
                  <Plus size={13} />
                  <span>{isCustomizeOutcomesOpen ? 'Done' : 'Add Dimensions'}</span>
                </button>
              </div>

              {/* OUTCOMES VIEW MODE TOGGLE (Pre-Session / Baseline on LEFT, Post-Session Outcomes on RIGHT) */}
              <div className={`p-1 rounded-2xl ${isDaylight ? 'bg-white/60 border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-md' : 'bg-black/50 border-white/10 backdrop-blur-md'} border flex items-center gap-1.5 shadow-inner`}>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic()
                    setOutcomesViewMode('pre')
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    outcomesViewMode === 'pre'
                      ? isDaylight
                        ? 'bg-gradient-to-r from-purple-500/20 via-purple-600/25 to-indigo-500/20 text-purple-950 font-black border border-purple-400/50 shadow-[0_4px_16px_rgba(105,84,200,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                        : 'bg-purple-500/30 text-purple-100 font-bold border border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.3)] backdrop-blur-md'
                      : isDaylight
                      ? 'text-[#526661] hover:text-[#1e293b] hover:bg-white/50 border border-transparent'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Clock size={14} className={outcomesViewMode === 'pre' ? (isDaylight ? 'text-purple-700' : 'text-purple-200') : (isDaylight ? 'text-[#6954C8]' : 'text-purple-400')} />
                  <span>Pre-Session / Baseline</span>
                  {preBaselineRecordedCount > 0 && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                      outcomesViewMode === 'pre'
                        ? isDaylight ? 'bg-purple-500/20 text-purple-950 border border-purple-400/30' : 'bg-black/40 text-purple-200 border border-purple-400/30'
                        : isDaylight ? 'bg-white/80 text-[#6954C8] border border-[#6954C8]/20' : 'bg-black/30 text-purple-200'
                    }`}>
                      {preBaselineRecordedCount} saved
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic()
                    setOutcomesViewMode('post')
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    outcomesViewMode === 'post'
                      ? isDaylight
                        ? 'bg-gradient-to-r from-emerald-500/20 via-teal-600/25 to-emerald-500/20 text-emerald-950 font-black border border-emerald-400/50 shadow-[0_4px_16px_rgba(16,185,129,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                        : 'bg-emerald-500/30 text-emerald-100 font-bold border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] backdrop-blur-md'
                      : isDaylight
                      ? 'text-[#526661] hover:text-[#1e293b] hover:bg-white/50 border border-transparent'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <CheckCircle2 size={14} className={outcomesViewMode === 'post' ? (isDaylight ? 'text-emerald-700' : 'text-emerald-200') : (isDaylight ? 'text-[#2B725C]' : 'text-emerald-400')} />
                  <span>Post-Session Outcomes</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    outcomesViewMode === 'post'
                      ? isDaylight ? 'bg-emerald-500/20 text-emerald-950 border border-emerald-400/30' : 'bg-black/40 text-emerald-200 border border-emerald-400/30'
                      : isDaylight ? 'bg-white/80 text-[#2B725C] border border-[#2B725C]/20' : 'bg-black/30 text-emerald-200'
                  }`}>
                    Default
                  </span>
                </button>
              </div>

              {/* POST-SESSION VIEW (DEFAULT) */}
              {outcomesViewMode === 'post' && (
                <div className="space-y-6">
                  {/* Peak Onset & Optimal Recording Time Banner */}
                  {peakGuidance && (
                    <div className={`p-3.5 rounded-2xl border flex items-start gap-3 text-xs backdrop-blur-sm shadow-md ${
                      isDaylight
                        ? 'bg-purple-500/10 border-purple-400/30 text-[#475569] shadow-[0_2px_12px_rgba(105,84,200,0.06)]'
                        : 'bg-purple-950/40 border-purple-500/30 text-slate-300'
                    }`}>
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isDaylight ? 'bg-purple-500/15 border border-purple-400/30 text-purple-900' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}>
                        <Clock size={14} />
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-extrabold ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>Optimal recording window:</span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            isDaylight ? 'bg-purple-500/15 text-purple-950 border border-purple-400/30' : 'bg-purple-500/20 text-purple-200 border border-purple-400/30'
                          }`}>
                            {peakGuidance.bestTimeToLog}
                          </span>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${isDaylight ? 'text-[#526661]' : 'text-slate-300'}`}>
                          {peakGuidance.subtitle}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ACUTE SESSION SHIFT: PRE VS POST COMPARISON DELTA CARD */}
                  {preBaselineRecordedCount > 0 ? (
                    <div className={`p-4 rounded-2xl border shadow-lg space-y-3 ${
                      isDaylight
                        ? 'bg-white border-[#E1E8E3] shadow-sm'
                        : 'bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-purple-950/40 border border-emerald-500/30'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles size={15} className={isDaylight ? 'text-[#2B725C]' : 'text-emerald-400'} />
                          <span className={`text-xs font-black uppercase tracking-wider ${isDaylight ? 'text-[#2B725C]' : 'text-emerald-300'}`}>
                            Acute Session Shift (Baseline → Post)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOutcomesViewMode('pre')}
                          className={`text-[10px] font-bold underline cursor-pointer ${isDaylight ? 'text-[#6954C8] hover:text-[#5944B6]' : 'text-purple-300 hover:text-white'}`}
                        >
                          Edit Baseline
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {trackedDimensions.map((dimName) => {
                          const match = activeOutcomeDimensions.find(
                            (o) => o.name.toLowerCase() === dimName.toLowerCase() || o.id.toLowerCase() === dimName.toLowerCase()
                          )
                          const id = match?.id || dimName.toLowerCase().replace(/[^a-z0-9]/g, '_')
                          const isPreRecorded = preTouchedOutcomes[id]
                          if (!isPreRecorded) return null

                          const preVal = preSliderValues[id] ?? 5
                          const postVal = sliderValues[id] ?? 5
                          const diff = postVal - preVal
                          const isLowerBetter = match?.directionality === 'lower_is_better'
                          const isImprovement = isLowerBetter ? diff < 0 : diff > 0

                          return (
                            <div key={id} className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                              isDaylight ? 'bg-[#EFF3F0] border-[#E1E8E3]' : 'bg-black/40 border-white/10'
                            }`}>
                              <span className={`text-[11px] font-bold truncate ${isDaylight ? 'text-[#475569]' : 'text-slate-300'}`}>{match?.name || dimName}</span>
                              <div className="flex items-baseline justify-between mt-1">
                                <span className={`text-xs font-mono ${isDaylight ? 'text-[#526661]' : 'text-slate-400'}`}>
                                  {preVal} → <strong className={isDaylight ? 'text-[#475569]' : 'text-white'}>{postVal}</strong>
                                </span>
                                <span
                                  className={`text-[11px] font-mono font-bold ${
                                    diff === 0
                                      ? isDaylight ? 'text-[#6E7E78]' : 'text-slate-400'
                                      : isImprovement
                                      ? isDaylight ? 'text-[#2B725C]' : 'text-emerald-400'
                                      : isDaylight ? 'text-[#D97706]' : 'text-amber-400'
                                  }`}
                                >
                                  {diff > 0 ? `+${diff}` : `${diff}`} pts
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                      isDaylight
                        ? 'bg-[#EFF3F0] border-[#E1E8E3] text-[#526661]'
                        : 'bg-slate-900/60 border-white/10 text-slate-400'
                    }`}>
                      <span>Direct post-session rating (no baseline logged yet)</span>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic()
                          setOutcomesViewMode('pre')
                        }}
                        className={`text-[11px] font-bold underline cursor-pointer ${
                          isDaylight ? 'text-[#6954C8] hover:text-[#5944B6]' : 'text-purple-400 hover:text-purple-300'
                        }`}
                      >
                        Set Pre-Session Baseline →
                      </button>
                    </div>
                  )}

                  {/* Dimension Customizer (Toggle which outcomes to track) */}
                  {isCustomizeOutcomesOpen && (
                    <div className={`p-4 rounded-2xl border space-y-2 animate-in fade-in duration-150 ${
                      isDaylight ? 'bg-[#EFF3F0] border-[#E1E8E3]' : 'bg-black/40 border-white/10'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isDaylight ? 'text-[#526661]' : 'text-slate-400'}`}>
                        Select outcome dimensions to track for {simplifiedName}:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(allOutcomes.length > 0
                          ? allOutcomes.map((o) => o.name)
                          : ['Mood', 'Energy', 'Stress', 'Alertness', 'Sleep Quality', 'Focus', 'Physical Recovery', 'Cognitive Calm']
                        ).map((dim) => {
                          const isTracked = trackedDimensions.includes(dim)
                          return (
                            <button
                              key={dim}
                              onClick={() => {
                                const updated = isTracked
                                  ? trackedDimensions.filter((d) => d !== dim)
                                  : [...trackedDimensions, dim]
                                setTrackedDimensions(updated)
                                if (modality?.id && onSaveCustomOutcomes) {
                                  onSaveCustomOutcomes(modality.id, updated)
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                isTracked
                                  ? isDaylight
                                    ? 'bg-emerald-500/15 border border-emerald-400/40 text-emerald-950 font-bold shadow-xs'
                                    : 'bg-emerald-500/25 border border-emerald-500/50 text-emerald-200'
                                  : isDaylight
                                  ? 'bg-white border border-[#E1E8E3] text-[#526661] hover:text-[#475569]'
                                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                              }`}
                            >
                              {isTracked ? '✓ ' : '+ '}
                              {dim}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* CANONICAL OUTCOME SLIDERS (0-10, Clean UI Without Synthetic Badges) */}
                  <div className="space-y-4">
                    {activeOutcomeDimensions.length === 0 && (
                      <div className={`p-4 rounded-2xl border space-y-2 ${
                        isDaylight ? 'bg-[#FFFBEB] border-amber-300 text-amber-900' : 'bg-amber-950/20 border border-amber-500/30 text-amber-200'
                      }`}>
                        <div className={`flex items-center gap-2 font-bold text-sm ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>
                          <Coffee size={16} className="text-amber-500" />
                          <span>No Acute Tracked Outcomes Assigned by Default</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${isDaylight ? 'text-[#526661]' : 'text-slate-300'}`}>
                          Caffeine cutoff timing does not track acute outcome sliders by default because nocturnal sleep architecture depends on multi-factorial circadian and physiological variables (screen light, dinner timing, stress).
                        </p>
                        <p className={`text-xs leading-relaxed font-semibold ${isDaylight ? 'text-[#8A610E]' : 'text-amber-300/90'}`}>
                          ✓ Your daily caffeine amount and cutoff timing are recorded in the Precision Execution Log (Card 1) and automatically synchronized with your Evening Check-in.
                        </p>
                      </div>
                    )}
                    {activeOutcomeDimensions.map((outcome) => {
                      const val = sliderValues[outcome.id] ?? 5
                      const isTouched = touchedOutcomes[outcome.id]
                      const preVal = preSliderValues[outcome.id] ?? 5
                      const isPreRecorded = preTouchedOutcomes[outcome.id]
                      const diff = val - preVal
                      const colorCfg = isTouched
                        ? getOutcomeColorConfig(val, outcome.directionality)
                        : getNeutralOutcomeColorConfig()
                      const isLowerBetter = outcome.directionality === 'lower_is_better'
                      const isImprovement = isLowerBetter ? diff < 0 : diff > 0

                      return (
                        <div
                          key={outcome.id}
                          className={`space-y-2.5 p-4 rounded-2xl border transition-all shadow-sm ${
                            isDaylight
                              ? 'bg-white border-[#E1E8E3] hover:border-[#6954C8]/30'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-bold text-sm tracking-tight ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>{outcome.name}</span>
                              {isPreRecorded && (
                                <span
                                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                    diff === 0
                                      ? isDaylight ? 'bg-[#EFF3F0] text-[#526661] border-[#E1E8E3]' : 'bg-white/5 text-slate-400 border-white/10'
                                      : isImprovement
                                      ? isDaylight ? 'bg-[#E6F3EB] text-[#2B725C] border-[#2B725C]/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                      : isDaylight ? 'bg-[#FFFBEB] text-[#D97706] border-[#D97706]/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  }`}
                                >
                                  Base: {preVal} → {val} ({diff > 0 ? `+${diff}` : diff} pts)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg border ${
                                  isTouched
                                    ? isDaylight
                                      ? 'text-[#6954C8] bg-[#F0EDFB] border-[#6954C8]/30'
                                      : `${colorCfg.textColor} bg-white/10 border-white/20`
                                    : isDaylight
                                    ? 'text-[#526661] bg-[#EFF3F0] border-[#E1E8E3]'
                                    : 'text-slate-400 bg-white/5 border-white/10'
                                }`}
                              >
                                {val}/10
                              </span>
                            </div>
                          </div>

                          {/* Continuous 0-10 Range Slider */}
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="1"
                            value={val}
                            onChange={(e) => handleSliderChange(outcome.id, parseInt(e.target.value, 10))}
                            onPointerDown={() => {
                              if (!isTouched) {
                                setTouchedOutcomes((prev) => ({ ...prev, [outcome.id]: true }))
                              }
                            }}
                            className="w-full cursor-pointer touch-manipulation accent-emerald-500"
                            style={{ accentColor: colorCfg.accentHex }}
                          />

                          {/* Directionality & Polarity Reference */}
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                            <span className={isLowerBetter ? isDaylight ? 'text-[#2B725C]' : 'text-emerald-400' : isDaylight ? 'text-[#6E7E78]' : 'text-slate-400'}>
                              0: {isLowerBetter ? 'None / Minimal' : 'Low / Poor'}
                            </span>
                            <span className={isLowerBetter ? isDaylight ? 'text-[#6E7E78]' : 'text-slate-400' : isDaylight ? 'text-[#2B725C]' : 'text-emerald-400'}>
                              10: {isLowerBetter ? 'Severe' : 'Peak / Optimal'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Delayed Next-Day Follow-Up Tracker (e.g. for Evening/Sleep Modalities) */}
                  {(isThermal || isSleepHygiene || isBlueLightDimming || modLower.includes('magnesium') || modLower.includes('glycine')) && (
                    <div className={`p-3.5 rounded-2xl border flex items-start gap-3 text-xs ${
                      isDaylight
                        ? 'bg-[#EEF2FF] border-[#4F46E5]/30 text-[#475569]'
                        : 'bg-indigo-950/30 border border-indigo-500/30 text-indigo-200'
                    }`}>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isDaylight ? 'bg-white text-[#4F46E5] border border-[#4F46E5]/30' : 'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        <Clock size={13} />
                      </div>
                      <div>
                        <span className={`font-bold block ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>Next-Morning Recovery Tracker</span>
                        <p className={`text-[11px] mt-0.5 ${isDaylight ? 'text-[#526661]' : 'text-slate-300'}`}>
                          Sleep architecture and overnight HRV recovery impacts will sync during tomorrow morning&apos;s wellbeing check-in.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Session Notes Textarea */}
                  <div className="space-y-1.5 pt-1">
                    <label className={`text-[11px] font-bold uppercase tracking-wider ${isDaylight ? 'text-[#526661]' : 'text-slate-400'}`}>
                      Session Notes &amp; Observations
                    </label>
                    <textarea
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="Record execution sensation, physical fatigue, cognitive clarity, or personal notes..."
                      rows={2}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-colors resize-none ${
                        isDaylight
                          ? 'bg-white border-[#E1E8E3] text-[#475569] placeholder-[#9CA3AF] focus:border-[#6954C8]'
                          : 'bg-black/40 border-white/10 text-slate-200 placeholder-slate-500 focus:border-purple-400'
                      }`}
                    />
                  </div>

                  {/* Save Observations Button */}
                  <button
                    type="button"
                    onClick={handleSaveObservations}
                    disabled={isSavingOutcomes}
                    className={`w-full py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
                      outcomesSavedFeedback
                        ? isDaylight
                          ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/30 to-emerald-500/25 hover:from-emerald-500/35 hover:to-teal-500/35 border border-emerald-400/60 text-emerald-950 shadow-[0_4px_20px_rgba(16,185,129,0.2),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                        : isDaylight
                        ? 'bg-gradient-to-r from-purple-500/20 via-indigo-500/25 to-purple-500/20 hover:from-purple-500/30 hover:to-indigo-500/35 border border-purple-400/60 text-purple-950 shadow-[0_4px_20px_rgba(105,84,200,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg'
                    }`}
                  >
                    {isSavingOutcomes ? (
                      <span>Saving Observations...</span>
                    ) : outcomesSavedFeedback ? (
                      <>
                        <Check size={16} />
                        <span>Observations Saved!</span>
                      </>
                    ) : (
                      <span>Save Post-Session Observations</span>
                    )}
                  </button>
                </div>
              )}

              {/* PRE-SESSION / BASELINE VIEW */}
              {outcomesViewMode === 'pre' && (
                <div className="space-y-6">
                  {/* Dimension Customizer (Toggle which outcomes to track) */}
                  {isCustomizeOutcomesOpen && (
                    <div className={`p-4 rounded-2xl border space-y-2 animate-in fade-in duration-150 ${
                      isDaylight ? 'bg-[#EFF3F0] border-[#E1E8E3]' : 'bg-black/40 border-white/10'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isDaylight ? 'text-[#526661]' : 'text-slate-400'}`}>
                        Select outcome dimensions to track for {simplifiedName}:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(allOutcomes.length > 0
                          ? allOutcomes.map((o) => o.name)
                          : ['Mood', 'Energy', 'Stress', 'Alertness', 'Sleep Quality', 'Focus', 'Physical Recovery', 'Cognitive Calm']
                        ).map((dim) => {
                          const isTracked = trackedDimensions.includes(dim)
                          return (
                            <button
                              key={dim}
                              onClick={() => {
                                const updated = isTracked
                                  ? trackedDimensions.filter((d) => d !== dim)
                                  : [...trackedDimensions, dim]
                                setTrackedDimensions(updated)
                                if (modality?.id && onSaveCustomOutcomes) {
                                  onSaveCustomOutcomes(modality.id, updated)
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                isTracked
                                  ? isDaylight
                                    ? 'bg-emerald-500/15 border border-emerald-400/40 text-emerald-950 font-bold shadow-xs'
                                    : 'bg-emerald-500/25 border border-emerald-500/50 text-emerald-200'
                                  : isDaylight
                                  ? 'bg-white border border-[#E1E8E3] text-[#526661] hover:text-[#475569]'
                                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                              }`}
                            >
                              {isTracked ? '✓ ' : '+ '}
                              {dim}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Baseline Outcome Sliders */}
                  <div className="space-y-4">
                    {activeOutcomeDimensions.map((outcome) => {
                      const preVal = preSliderValues[outcome.id] ?? 5
                      const isPreTouched = preTouchedOutcomes[outcome.id]
                      const source = baselineSources[outcome.id] || 'none'
                      const colorCfg = isPreTouched
                        ? getOutcomeColorConfig(preVal, outcome.directionality)
                        : getNeutralOutcomeColorConfig()
                      const isLowerBetter = outcome.directionality === 'lower_is_better'

                      return (
                        <div
                          key={outcome.id}
                          className={`space-y-2.5 p-4 rounded-2xl border transition-all shadow-sm ${
                            isDaylight
                              ? 'bg-white border-[#E1E8E3] hover:border-[#6954C8]/30'
                              : 'bg-white/5 border-white/10 hover:border-purple-500/30'
                          }`}
                        >
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-bold text-sm tracking-tight ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>{outcome.name}</span>
                              {source === 'wellbeing' ? (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium border ${
                                  isDaylight
                                    ? 'bg-[#ECFEFF] text-[#0891B2] border-[#0891B2]/30'
                                    : 'text-cyan-300 bg-cyan-950/50 border-cyan-500/30'
                                }`}>
                                  ✓ From Daily Wellbeing Check-in
                                </span>
                              ) : source === 'pre_log' ? (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium border ${
                                  isDaylight
                                    ? 'bg-[#F0EDFB] text-[#6954C8] border-[#6954C8]/30'
                                    : 'text-purple-300 bg-purple-950/50 border-purple-500/30'
                                }`}>
                                  ✓ Logged Pre-Session Baseline
                                </span>
                              ) : (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                                  isDaylight
                                    ? 'bg-[#EFF3F0] text-[#526661] border-[#E1E8E3]'
                                    : 'text-slate-400 bg-white/5 border-white/10'
                                }`}>
                                  Default Baseline (Touch to customize)
                                </span>
                              )}
                            </div>

                            <span
                              className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg border ${
                                isPreTouched
                                  ? isDaylight
                                    ? 'text-[#6954C8] bg-[#F0EDFB] border-[#6954C8]/30'
                                    : `${colorCfg.textColor} bg-white/10 border-white/20`
                                  : isDaylight
                                  ? 'text-[#526661] bg-[#EFF3F0] border-[#E1E8E3]'
                                  : 'text-slate-400 bg-white/5 border-white/10'
                              }`}
                            >
                              {preVal}/10
                            </span>
                          </div>

                          {/* Continuous 0-10 Range Slider for Baseline */}
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="1"
                            value={preVal}
                            onChange={(e) => handlePreSliderChange(outcome.id, parseInt(e.target.value, 10))}
                            className="w-full cursor-pointer touch-manipulation accent-purple-500"
                            style={{ accentColor: colorCfg.accentHex }}
                          />

                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                            <span className={isLowerBetter ? isDaylight ? 'text-[#2B725C]' : 'text-emerald-400' : isDaylight ? 'text-[#6E7E78]' : 'text-slate-400'}>
                              0: {isLowerBetter ? 'None / Minimal' : 'Low / Poor'}
                            </span>
                            <span className={isLowerBetter ? isDaylight ? 'text-[#6E7E78]' : 'text-slate-400' : isDaylight ? 'text-[#2B725C]' : 'text-emerald-400'}>
                              10: {isLowerBetter ? 'Severe' : 'Peak / Optimal'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Return to Post-Session Outcomes Button */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic()
                      setOutcomesViewMode('post')
                    }}
                    className={`w-full py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
                      isDaylight
                        ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/30 to-emerald-500/25 hover:from-emerald-500/35 hover:to-teal-500/35 border border-emerald-400/60 text-emerald-950 shadow-[0_4px_20px_rgba(16,185,129,0.2),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    <span>Done • View Post-Session Outcomes</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* CARD 3: PROTOCOL ECOSYSTEM, STACK SYNERGIES & SAFETY */}
          {/* ========================================================================= */}
          {activeTab === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className={`flex items-center justify-between border-b ${isDaylight ? 'border-[#E1E8E3]' : 'border-white/10'} pb-3`}>
                <div>
                  <h2 className={`text-lg font-black ${isDaylight ? 'text-[#475569]' : 'text-white'} flex items-center gap-2`}>
                    <Layers size={18} className={isDaylight ? 'text-[#6954C8]' : 'text-purple-400'} /> Protocol Ecosystem &amp; Synergies
                  </h2>
                  <p className={`text-xs ${isDaylight ? 'text-[#526661]' : 'text-slate-400'}`}>Position in complete protocol, stack synergies &amp; alternatives</p>
                </div>
              </div>

              {/* Part of the Complete Protocol Card */}
              <div className={`p-5 rounded-3xl ${isDaylight ? 'bg-white border border-[#E1E8E3] shadow-sm' : 'bg-slate-900/90 border border-purple-500/30 shadow-lg'} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl ${isDaylight ? 'bg-[#F0EDFB] text-[#6954C8] border border-[#6954C8]/20' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'} flex items-center justify-center`}>
                      <Layers size={16} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>{protocolName}</h3>
                      <p className={`text-[11px] ${isDaylight ? 'text-[#526661]' : 'text-slate-400'}`}>
                        Step {protocolStepIndex} of {Math.max(protocolTasks.length, 1)} in this protocol sequence
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${isDaylight ? 'bg-[#F0EDFB] text-[#6954C8] border border-[#6954C8]/30' : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'}`}>
                    Active Stack
                  </span>
                </div>

                <div className={`p-3.5 rounded-2xl ${isDaylight ? 'bg-[#EFF3F0]/60 border border-[#E1E8E3] text-[#475569]' : 'bg-black/40 border border-white/10 text-slate-300'} text-xs leading-relaxed`}>
                  <span className={`font-bold ${isDaylight ? 'text-[#475569]' : 'text-white'} block mb-1`}>Ecosystem &amp; Timing Rationale:</span>
                  {task.protocol_step?.instructions ||
                    modality?.brief_description ||
                    'Sequenced intentionally to avoid biological interference and maximize synergy with neighboring modalities.'}
                </div>
              </div>

              {/* StackFit Synergies & Co-Factors Card */}
              <div className={`p-5 rounded-3xl border shadow-lg space-y-4 ${
                isDaylight
                  ? 'bg-white border-[#E1E8E3] text-[#475569] shadow-sm'
                  : 'bg-slate-900/90 border-emerald-500/30 text-white shadow-lg'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isDaylight
                        ? 'bg-[#E6F3EB] text-[#2B725C] border border-[#2B725C]/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>StackFit Synergies &amp; Co-Factors</h3>
                      <p className={`text-[11px] ${isDaylight ? 'text-[#526661]' : 'text-slate-400'}`}>Biochemical interactions with today&apos;s stack</p>
                    </div>
                  </div>

                  {stackFitResult && (
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        stackFitResult.badge.color === 'emerald'
                          ? isDaylight
                            ? 'bg-[#E6F3EB] text-[#2B725C] border-[#2B725C]/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : stackFitResult.badge.color === 'amber'
                          ? isDaylight
                            ? 'bg-[#FFFBEB] text-[#D97706] border-[#D97706]/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : isDaylight
                          ? 'bg-[#F0EDFB] text-[#6954C8] border-[#6954C8]/30'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      }`}
                    >
                      {stackFitResult.badge.title}
                    </span>
                  )}
                </div>

                {stackFitResult && stackFitResult.synergies.length > 0 ? (
                  <div className="space-y-2.5">
                    {stackFitResult.synergies.map((syn, idx) => {
                      const isExpanded = !!expandedSynergies[idx]
                      return (
                        <div
                          key={idx}
                          className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
                            isDaylight
                              ? 'border-[#E1E8E3] bg-[#EFF3F0]/60'
                              : 'border-emerald-500/30 bg-emerald-950/20'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedSynergies((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                            className={`w-full p-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                              isDaylight ? 'hover:bg-[#EFF3F0]' : 'hover:bg-emerald-900/20'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                isDaylight
                                  ? 'bg-[#E6F3EB] border border-[#2B725C]/30 text-[#2B725C]'
                                  : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                              }`}>
                                <Sparkles size={13} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`text-xs font-bold truncate ${isDaylight ? 'text-[#2B725C]' : 'text-emerald-300'}`}>
                                    {syn.headline}
                                  </span>
                                  <span className={`text-[10px] font-mono font-bold shrink-0 ${isDaylight ? 'text-[#526661]' : 'text-slate-400'}`}>
                                    with {syn.matchedModalityName}
                                  </span>
                                </div>
                                {!isExpanded && (
                                  <p className={`text-[11px] line-clamp-1 mt-0.5 ${isDaylight ? 'text-[#526661]' : 'text-slate-400'}`}>
                                    {syn.actionableTip ? `💡 ${syn.actionableTip}` : syn.rationale}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className={`shrink-0 ${isDaylight ? 'text-[#2B725C]' : 'text-emerald-400'}`}>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className={`p-3.5 pt-0 border-t space-y-2 text-xs leading-relaxed animate-in fade-in duration-150 ${
                              isDaylight ? 'border-[#E1E8E3] text-[#526661]' : 'border-emerald-500/20 text-slate-300'
                            }`}>
                              <p className={`pt-2 ${isDaylight ? 'text-[#475569]' : 'text-slate-200'}`}>{syn.rationale}</p>
                              {syn.actionableTip && (
                                <p className={`text-[11px] font-semibold p-2.5 rounded-xl border ${
                                  isDaylight
                                    ? 'bg-[#E6F3EB] border-[#2B725C]/30 text-[#2B725C]'
                                    : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                                }`}>
                                  💡 Tip: {syn.actionableTip}
                                </p>
                              )}
                              {syn.pubmedUrl && (
                                <a
                                  href={syn.pubmedUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-1 text-[10px] underline pt-0.5 ${
                                    isDaylight ? 'text-[#6954C8] hover:text-[#5944B6]' : 'text-purple-300 hover:text-white'
                                  }`}
                                >
                                  <span>Verified PubMed Literature</span>
                                  <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className={`p-3.5 rounded-2xl border text-xs ${
                    isDaylight
                      ? 'bg-[#EFF3F0] border-[#E1E8E3] text-[#526661]'
                      : 'bg-black/40 border border-white/10 text-slate-400'
                  }`}>
                    No pharmacological conflicts detected with today&apos;s active protocol stack.
                  </div>
                )}

                {/* Stack Conflicts / Mechanism Spacing Warnings */}
                {stackFitResult && stackFitResult.conflicts.length > 0 && (
                  <div className={`space-y-2 pt-2 border-t ${isDaylight ? 'border-[#E1E8E3]' : 'border-white/10'}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isDaylight ? 'text-[#8A610E]' : 'text-amber-400'}`}>
                      <ShieldAlert size={12} /> Mechanism Spacing Warnings
                    </span>
                    <div className="space-y-2">
                      {stackFitResult.conflicts.map((conf, idx) => {
                        const isExpanded = !!expandedConflicts[idx]
                        return (
                          <div
                            key={idx}
                            className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
                              isDaylight
                                ? 'border-amber-300 bg-[#FFFBEB]'
                                : 'border-amber-500/30 bg-amber-950/20'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setExpandedConflicts((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                              className={`w-full p-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                                isDaylight ? 'hover:bg-amber-100/50' : 'hover:bg-amber-900/20'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                  isDaylight
                                    ? 'bg-amber-200/80 border border-amber-400 text-amber-800'
                                    : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                                }`}>
                                  <ShieldAlert size={13} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`text-xs font-bold truncate ${isDaylight ? 'text-amber-900' : 'text-amber-300'}`}>
                                      {conf.headline}
                                    </span>
                                    <span className={`text-[10px] font-mono shrink-0 ${isDaylight ? 'text-amber-800/80' : 'text-slate-400'}`}>
                                      with {conf.matchedModalityName}
                                    </span>
                                  </div>
                                  {!isExpanded && (
                                    <p className={`text-[11px] line-clamp-1 mt-0.5 ${isDaylight ? 'text-amber-800/90' : 'text-amber-200/70'}`}>
                                      {conf.mitigationRecommendation || conf.rationale}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className={`shrink-0 ${isDaylight ? 'text-amber-700' : 'text-amber-400'}`}>
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                            </button>

                            {isExpanded && (
                              <div className={`p-3.5 pt-0 border-t space-y-2 text-xs leading-relaxed animate-in fade-in duration-150 ${
                                isDaylight ? 'border-amber-200 text-amber-950' : 'border-amber-500/20 text-slate-300'
                              }`}>
                                <p className={`pt-2 ${isDaylight ? 'text-amber-950' : 'text-slate-200'}`}>{conf.rationale}</p>
                                {conf.mitigationRecommendation && (
                                  <p className={`text-[11px] font-semibold p-2.5 rounded-xl border ${
                                    isDaylight
                                      ? 'bg-white border-amber-300 text-amber-900'
                                      : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                                  }`}>
                                    Action: {conf.mitigationRecommendation}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Compare & Bench Substitutes Card */}
              <div className={`p-5 rounded-3xl border shadow-lg space-y-4 ${
                isDaylight
                  ? 'bg-white border-[#E1E8E3] text-[#475569] shadow-sm'
                  : 'bg-slate-900/90 border-cyan-500/30 text-white shadow-lg'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isDaylight
                        ? 'bg-[#ECFEFF] text-[#0891B2] border border-[#0891B2]/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      <Scale size={16} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>Compare &amp; Bench Substitutes</h3>
                      <p className={`text-[11px] ${isDaylight ? 'text-[#526661]' : 'text-slate-400'}`}>Explore comparable interventions and swap modalities</p>
                    </div>
                  </div>
                </div>

                {categoryAlternatives.length > 0 ? (
                  <div className="space-y-2.5">
                    {categoryAlternatives.map((alt) => (
                      <div
                        key={alt.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                          isDaylight
                            ? 'bg-[#EFF3F0] border-[#E1E8E3] hover:border-[#0891B2]/40'
                            : 'bg-black/40 border border-white/10 hover:border-cyan-500/40'
                        }`}
                      >
                        <div>
                          <h4 className={`text-xs font-bold ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>{alt.display_name || alt.name}</h4>
                          <p className={`text-[10px] mt-0.5 line-clamp-1 ${isDaylight ? 'text-[#526661]' : 'text-slate-400'}`}>
                            {alt.brief_description || alt.headline_benefit || 'Alternative protocol modality'}
                          </p>
                        </div>
                        <button
                          onClick={() => setCompareTargetModality(alt)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                            isDaylight
                              ? 'bg-[#ECFEFF] hover:bg-[#CFFAFE] border-[#0891B2]/40 text-[#0891B2]'
                              : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200'
                          }`}
                        >
                          <Scale size={13} />
                          <span>Compare</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`p-3.5 rounded-2xl border text-xs ${
                    isDaylight
                      ? 'bg-[#EFF3F0] border-[#E1E8E3] text-[#526661]'
                      : 'bg-black/40 border border-white/10 text-slate-400'
                  }`}>
                    No direct category alternatives found in current catalog.
                  </div>
                )}
              </div>

              {/* Risks & Medical Guardrails */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Medical Guardrails</h3>
                <MedicalDisclaimerBanner defaultExpanded={false} modalityName={fullName} />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CARD 4: BIOLOGICAL VECTORS, AGING MODELS & DEEP SCIENCE */}
          {/* ========================================================================= */}
          {activeTab === 3 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className={`flex items-center justify-between border-b ${isDaylight ? 'border-[#E1E8E3]' : 'border-white/10'} pb-3`}>
                <div>
                  <h2 className={`text-lg font-black ${isDaylight ? 'text-[#475569]' : 'text-white'} flex items-center gap-2`}>
                    <Microscope size={18} className={isDaylight ? 'text-[#0891B2]' : 'text-cyan-400'} /> Biological Vectors &amp; Geek Science
                  </h2>
                  <p className={`text-xs ${isDaylight ? 'text-[#526661]' : 'text-slate-400'}`}>
                    8 Canonical Longevity Vectors, Hallmarks of Aging &amp; Clinical RCTs
                  </p>
                </div>
              </div>

              {/* 8 Canonical Longevity Vectors Drawer (Collapsed Basic Preview by Default) */}
              {modality ? (
                <ModalityLongevityDrawer modality={modality} defaultExpanded={false} />
              ) : (
                <div className={`p-6 rounded-2xl border text-center text-sm ${
                  isDaylight ? 'bg-white border-[#E1E8E3] text-[#526661]' : 'bg-slate-900 border-white/10 text-slate-400'
                }`}>
                  Longevity profile loading or not attached to this item.
                </div>
              )}

              {/* Targeted Clinical Biomarkers Preview Card */}
              {targetedBiomarkers.length > 0 && (
                <div className={`rounded-3xl border overflow-hidden shadow-lg transition-all duration-200 ${
                  isDaylight
                    ? 'bg-white border-[#E1E8E3] text-[#475569] shadow-sm'
                    : 'bg-slate-900/90 border-purple-500/30 text-white shadow-lg'
                }`}>
                  <button
                    type="button"
                    onClick={() => setIsBiomarkersExpanded(!isBiomarkersExpanded)}
                    className={`w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                      isDaylight ? 'hover:bg-[#EFF3F0]' : 'hover:bg-purple-900/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isDaylight
                          ? 'bg-[#F0EDFB] text-[#6954C8] border border-[#6954C8]/30'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}>
                        <Dna size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-bold ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>Targeted Clinical Biomarkers</h3>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            isDaylight
                              ? 'bg-[#F0EDFB] text-[#6954C8] border-[#6954C8]/30'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                          }`}>
                            {targetedBiomarkers.length} Markers
                          </span>
                        </div>
                        {!isBiomarkersExpanded && (
                          <div className="flex items-center gap-1.5 overflow-hidden mt-1">
                            {targetedBiomarkers.slice(0, 3).map((bm: string, idx: number) => (
                              <span key={idx} className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold shrink-0 ${
                                isDaylight
                                  ? 'bg-[#F0EDFB] border-[#6954C8]/25 text-[#6954C8]'
                                  : 'bg-purple-500/15 border-purple-500/30 text-purple-200'
                              }`}>
                                {bm}
                              </span>
                            ))}
                            {targetedBiomarkers.length > 3 && (
                              <span className={`text-[10px] font-bold shrink-0 ${isDaylight ? 'text-[#6954C8]' : 'text-purple-300'}`}>
                                +{targetedBiomarkers.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`shrink-0 ${isDaylight ? 'text-[#6954C8]' : 'text-purple-400'}`}>
                      {isBiomarkersExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {isBiomarkersExpanded && (
                    <div className={`p-4 sm:p-5 pt-0 border-t space-y-2 animate-in fade-in duration-150 ${
                      isDaylight ? 'border-[#E1E8E3]' : 'border-purple-500/20'
                    }`}>
                      <p className={`text-xs pt-2 leading-relaxed ${isDaylight ? 'text-[#526661]' : 'text-slate-300'}`}>
                        Clinical blood, imaging, and physiological endpoints monitored or shifted by {simplifiedName}:
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {targetedBiomarkers.map((bm: string, idx: number) => (
                          <span
                            key={idx}
                            className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-bold ${
                              isDaylight
                                ? 'bg-[#F0EDFB] border-[#6954C8]/25 text-[#6954C8]'
                                : 'bg-purple-500/15 border-purple-500/30 text-purple-200'
                            }`}
                          >
                            {bm}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Hallmarks of Aging Preview Card */}
              {hallmarksList.length > 0 && (
                <div className={`rounded-3xl border overflow-hidden shadow-lg transition-all duration-200 ${
                  isDaylight
                    ? 'bg-white border-[#E1E8E3] text-[#475569] shadow-sm'
                    : 'bg-slate-900/90 border-indigo-500/30 text-white shadow-lg'
                }`}>
                  <button
                    type="button"
                    onClick={() => setIsHallmarksExpanded(!isHallmarksExpanded)}
                    className={`w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                      isDaylight ? 'hover:bg-[#EFF3F0]' : 'hover:bg-indigo-900/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isDaylight
                          ? 'bg-[#EEF2FF] text-[#4F46E5] border border-[#4F46E5]/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        <Zap size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-bold ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>Hallmarks of Aging Targeted</h3>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            isDaylight
                              ? 'bg-[#EEF2FF] text-[#4F46E5] border-[#4F46E5]/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                          }`}>
                            {hallmarksList.length} Hallmarks
                          </span>
                        </div>
                        {!isHallmarksExpanded && (
                          <div className="flex items-center gap-1.5 overflow-hidden mt-1">
                            {hallmarksList.slice(0, 3).map((h: string, idx: number) => (
                              <span key={idx} className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold shrink-0 ${
                                isDaylight
                                  ? 'bg-[#EEF2FF] border-[#4F46E5]/25 text-[#4F46E5]'
                                  : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-200'
                              }`}>
                                {h}
                              </span>
                            ))}
                            {hallmarksList.length > 3 && (
                              <span className={`text-[10px] font-bold shrink-0 ${isDaylight ? 'text-[#4F46E5]' : 'text-indigo-300'}`}>
                                +{hallmarksList.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`shrink-0 ${isDaylight ? 'text-[#4F46E5]' : 'text-indigo-400'}`}>
                      {isHallmarksExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {isHallmarksExpanded && (
                    <div className={`p-4 sm:p-5 pt-0 border-t space-y-2 animate-in fade-in duration-150 ${
                      isDaylight ? 'border-[#E1E8E3]' : 'border-indigo-500/20'
                    }`}>
                      <p className={`text-xs pt-2 leading-relaxed ${isDaylight ? 'text-[#526661]' : 'text-slate-300'}`}>
                        Primary cellular aging phenotypes and pathways mitigated by this intervention:
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {hallmarksList.map((h: string, idx: number) => (
                          <span
                            key={idx}
                            className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-bold ${
                              isDaylight
                                ? 'bg-[#EEF2FF] border-[#4F46E5]/25 text-[#4F46E5]'
                                : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-200'
                            }`}
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Daily Functional Outcomes & Clinical Impacts Preview Card */}
              {functionalEntries.length > 0 && (
                <div className={`rounded-3xl border overflow-hidden shadow-lg transition-all duration-200 ${
                  isDaylight
                    ? 'bg-white border-[#E1E8E3] text-[#475569] shadow-sm'
                    : 'bg-slate-900/90 border-emerald-500/30 text-white shadow-lg'
                }`}>
                  <button
                    type="button"
                    onClick={() => setIsFunctionalImpactsExpanded(!isFunctionalImpactsExpanded)}
                    className={`w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                      isDaylight ? 'hover:bg-[#EFF3F0]' : 'hover:bg-emerald-900/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isDaylight
                          ? 'bg-[#E6F3EB] text-[#2B725C] border border-[#2B725C]/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        <Activity size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-bold ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>Daily Functional Outcomes &amp; Performance</h3>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            isDaylight
                              ? 'bg-[#E6F3EB] text-[#2B725C] border-[#2B725C]/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          }`}>
                            {functionalEntries.length} Outcomes
                          </span>
                        </div>
                        {!isFunctionalImpactsExpanded && (
                          <div className="flex items-center gap-1.5 overflow-hidden mt-1">
                            {functionalEntries.slice(0, 3).map(([outcome, impact]) => (
                              <span key={outcome} className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold shrink-0 ${
                                isDaylight
                                  ? 'bg-[#E6F3EB] text-[#2B725C] border border-[#2B725C]/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                {outcome}: {impact.score}/10
                              </span>
                            ))}
                            {functionalEntries.length > 3 && (
                              <span className={`text-[10px] font-bold shrink-0 ${isDaylight ? 'text-[#2B725C]' : 'text-emerald-400'}`}>
                                +{functionalEntries.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`shrink-0 ${isDaylight ? 'text-[#2B725C]' : 'text-emerald-400'}`}>
                      {isFunctionalImpactsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {isFunctionalImpactsExpanded && (
                    <div className={`p-4 sm:p-5 pt-0 border-t space-y-3 pt-3 animate-in fade-in duration-150 ${
                      isDaylight ? 'border-[#E1E8E3]' : 'border-emerald-500/20'
                    }`}>
                      <p className={`text-xs leading-relaxed ${isDaylight ? 'text-[#526661]' : 'text-slate-300'}`}>
                        Quantified acute experiential shifts and biological performance mapped from clinical literature:
                      </p>
                      <div className="space-y-3">
                        {functionalEntries.map(([outcome, impact]) => (
                          <div key={outcome} className={`p-3.5 rounded-2xl border space-y-2 ${
                            isDaylight
                              ? 'bg-[#EFF3F0] border-[#E1E8E3]'
                              : 'bg-black/40 border-emerald-500/20'
                          }`}>
                            <div className="flex justify-between items-center">
                              <span className={`text-xs font-bold ${isDaylight ? 'text-[#2B725C]' : 'text-emerald-300'}`}>{outcome}</span>
                              <span className={`text-[10px] border px-2 py-0.5 rounded-full font-mono font-bold ${
                                isDaylight
                                  ? 'bg-[#E6F3EB] text-[#2B725C] border-[#2B725C]/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}>
                                {impact.score}/10 Impact
                              </span>
                            </div>
                            {impact.studies && impact.studies.length > 0 ? (
                              <div className={`space-y-1.5 pt-1 border-t ${isDaylight ? 'border-[#E1E8E3]' : 'border-white/5'}`}>
                                {impact.studies.map((study, idx) => (
                                  <div key={idx} className="text-xs">
                                    <a
                                      href={study.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`inline-flex items-center gap-1 font-medium ${
                                        isDaylight ? 'text-[#0891B2] hover:text-[#0e7490]' : 'text-cyan-300 hover:text-cyan-200'
                                      }`}
                                    >
                                      <span>{study.title}</span>
                                      <ExternalLink size={10} className="shrink-0" />
                                    </a>
                                    {study.notes && (
                                      <p className={`text-[10px] italic mt-0.5 ${isDaylight ? 'text-[#526661]' : 'text-slate-400'}`}>{study.notes}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className={`text-[10px] italic ${isDaylight ? 'text-[#6E7E78]' : 'text-slate-500'}`}>Impact score mapped from consensus literature.</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Geek Mode: Molecular Mechanisms & Clinical Citations */}
              {modality ? (
                <GeekMode
                  modality={modality}
                  hideLongevityDrawer={true}
                  hideHallmarks={true}
                  hideFunctionalImpacts={true}
                />
              ) : (
                <div className={`p-6 rounded-2xl border text-center text-sm ${
                  isDaylight ? 'bg-white border-[#E1E8E3] text-[#526661]' : 'bg-slate-900 border-white/10 text-slate-400'
                }`}>
                  Geek Mode profile loading or not attached.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FULL-SCREEN IMMERSIVE COUNTDOWN TIMER MODAL */}
      {isTimerModalOpen && !isPeptide && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-between bg-slate-950/98 backdrop-blur-3xl text-white p-6 sm:p-10 animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="w-full max-w-xl flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${hex}DD, ${hex}99)`,
                  borderColor: 'rgba(255,255,255,0.4)'
                }}
              >
                <ModalityIcon modality={modality} size={22} glow={true} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight">{fullName}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  {modality?.temperature && (
                    <span className="text-cyan-300 font-bold">{modality.temperature}</span>
                  )}
                  {dose && <span>• {dose}</span>}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setIsTimerRunning(false)
                setIsTimerModalOpen(false)
              }}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Central Circular Progress Timer */}
          <div className="flex flex-col items-center justify-center my-auto relative">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-slate-800"
                  strokeWidth="6"
                  fill="transparent"
                />
                {/* Active Animated Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  stroke={hex}
                  strokeWidth="6"
                  strokeDasharray={276.46}
                  strokeDashoffset={
                    276.46 * (1 - (timerTotalDuration > 0 ? timerSecondsRemaining / timerTotalDuration : 0))
                  }
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white">
                  {formatTimerTime(timerSecondsRemaining)}
                </span>
                <span className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">
                  {timerSecondsRemaining === 0 ? 'Session Complete' : isTimerRunning ? 'Elapsed / In Session' : 'Paused'}
                </span>
              </div>
            </div>

            {/* Quick Adjustment Pills */}
            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={() => setTimerSecondsRemaining((prev) => Math.max(0, prev - 30))}
                className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                -30s
              </button>
              <button
                onClick={() => setTimerSecondsRemaining((prev) => prev + 30)}
                className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                +30s
              </button>
              <button
                onClick={() => {
                  setIsTimerRunning(false)
                  setTimerSecondsRemaining(timerTotalDuration)
                }}
                className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>
          </div>

          {/* Bottom Guidance & Finish Session Controls */}
          <div className="w-full max-w-xl space-y-4 pb-4">
            {/* Contextual Tip */}
            {isThermal && modLower.includes('cold') ? (
              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 text-center">
                ❄️ <strong>Søberg Principle:</strong> Avoid hot showers immediately after cold plunge to allow endogenous thermogenesis and brown fat activation.
              </div>
            ) : isThermal && modLower.includes('sauna') ? (
              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 text-center">
                🔥 <strong>Heat Shock Induction:</strong> 174°F+ sauna sessions activate HSP70 and promote vascular nitric oxide release.
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`flex-1 py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl active:scale-98 ${
                  isTimerRunning
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <Pause size={20} />
                    <span>Pause Timer</span>
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    <span>{timerSecondsRemaining === timerTotalDuration ? 'Start Countdown' : 'Resume Timer'}</span>
                  </>
                )}
              </button>

              <button
                onClick={async () => {
                  setIsTimerRunning(false)
                  setIsTimerModalOpen(false)
                  if (!isCompleted) {
                    await handleToggleComplete()
                  }
                  // Auto-advance to Card 2 (Outcomes) for immediate subjective shift tracking
                  setActiveTab(1)
                }}
                className="py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-bold text-sm sm:text-base text-white flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer active:scale-98 shrink-0"
              >
                <Check size={20} />
                <span>Finish &amp; Log Outcomes</span>
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
          task={task}
          benchItem={benchItem}
          userProfile={userProfile}
          onSavePersonalization={async () => {
            setIsDosageModalOpen(false)
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('levl_schedule_updated'))
              window.dispatchEvent(new CustomEvent('levl_tasks_updated'))
            }
          }}
        />
      )}

      {/* Modality Comparison & Substitute Swap Modal */}
      {compareTargetModality && modality && (
        <ModalityCompareModal
          isOpen={true}
          onClose={() => setCompareTargetModality(null)}
          exploringModality={compareTargetModality}
          activeModality={modality}
          activeSource="today"
          userProfile={userProfile}
        />
      )}

      {/* Interactive Breathwork / NSDR / Red Light Applet Modals */}
      {activeApplet === '478' && (
        <Breathing478Applet
          isOpen={true}
          onClose={() => setActiveApplet(null)}
          onComplete={() => {
            setActiveApplet(null)
            handleToggleComplete()
            setActiveTab(1)
          }}
        />
      )}

      {activeApplet === 'cyclicsigh' && (
        <CyclicSighingApplet
          isOpen={true}
          onClose={() => setActiveApplet(null)}
          onComplete={() => {
            setActiveApplet(null)
            handleToggleComplete()
            setActiveTab(1)
          }}
        />
      )}

      {activeApplet === 'box' && (
        <BoxBreathingApplet
          isOpen={true}
          onClose={() => setActiveApplet(null)}
          onComplete={() => {
            setActiveApplet(null)
            handleToggleComplete()
            setActiveTab(1)
          }}
        />
      )}

      {activeApplet === 'hyperventilation' && (
        <HyperventilationApplet
          isOpen={true}
          onClose={() => setActiveApplet(null)}
          onComplete={() => {
            setActiveApplet(null)
            handleToggleComplete()
            setActiveTab(1)
          }}
        />
      )}

      {activeApplet === 'coherent' && (
        <CoherentBreathingApplet
          isOpen={true}
          onClose={() => setActiveApplet(null)}
          onComplete={() => {
            setActiveApplet(null)
            handleToggleComplete()
            setActiveTab(1)
          }}
        />
      )}

      {activeApplet === 'yoganidra' && (
        <YogaNidraApplet
          isOpen={true}
          onClose={() => setActiveApplet(null)}
          onComplete={() => {
            setActiveApplet(null)
            handleToggleComplete()
            setActiveTab(1)
          }}
        />
      )}

      {activeApplet === 'redlight' && (
        <RedLightMaskApplet
          isOpen={true}
          onClose={() => setActiveApplet(null)}
          onComplete={() => {
            setActiveApplet(null)
            handleToggleComplete()
            setActiveTab(1)
          }}
        />
      )}

      {activeApplet === 'coldplunge' && (
        <ColdPlungeApplet
          isOpen={true}
          onClose={() => setActiveApplet(null)}
          modalityName={fullName}
          taskId={task.id}
          onComplete={() => {
            setActiveApplet(null)
            handleToggleComplete()
            setActiveTab(1)
          }}
        />
      )}

      {activeApplet === 'glucosewalk' && (
        <GlucoseWalkApplet
          isOpen={true}
          onClose={() => setActiveApplet(null)}
          modalityName={fullName}
          taskId={task.id}
          onComplete={() => {
            setActiveApplet(null)
            handleToggleComplete()
            setActiveTab(1)
          }}
        />
      )}

      {activeApplet === 'sauna' && (
        <SaunaSessionApplet
          isOpen={true}
          onClose={() => setActiveApplet(null)}
          modalityName={fullName}
          taskId={task.id}
          onComplete={() => {
            setActiveApplet(null)
            handleToggleComplete()
            setActiveTab(1)
          }}
        />
      )}

      {activeApplet === 'hiit4x4' && (
        <HIITNorwegian4x4Applet
          isOpen={true}
          onClose={() => setActiveApplet(null)}
          modalityName={fullName}
          taskId={task.id}
          onComplete={() => {
            setActiveApplet(null)
            handleToggleComplete()
            setActiveTab(1)
          }}
        />
      )}

      {activeApplet === 'zone2' && (
        <Zone2CardioApplet
          isOpen={true}
          onClose={() => setActiveApplet(null)}
          modalityName={fullName}
          taskId={task.id}
          onComplete={() => {
            setActiveApplet(null)
            handleToggleComplete()
            setActiveTab(1)
          }}
        />
      )}
    </>
  )
}
