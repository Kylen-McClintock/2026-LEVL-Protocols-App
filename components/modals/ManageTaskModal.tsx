'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday
} from 'date-fns'
import {
  X,
  CalendarDays,
  Trash2,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Calendar as CalendarIcon,
  AlertTriangle,
  Lock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Sliders,
  BookOpen,
  ExternalLink,
  Target,
  FileText,
  Info,
  Activity
} from 'lucide-react'
import { DedupedTask } from '@/components/cards/ProtocolTaskCard'
import {
  updateModalityScheduleConfig,
  getModalityScheduleConfig,
  deriveAutomaticScheduleConfig,
  ModalityScheduleConfig,
  deleteTask,
  updateTaskExecutionDetails,
  upsertBenchItemOverride,
  reconcileModalityScheduleAndFutureTasks
} from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { getCircadianTipForModality } from '@/lib/utils/circadianTimingTips'
import { resolveRecommendedDose, ProtocolDoseContext } from '@/lib/utils/resolveRecommendedDose'
import { resolvePubMedCitation } from '@/lib/tracking/scientificCitations'
import { UserProfile } from '@/lib/types'
import { isPeptideModality } from '@/lib/peptides/peptideCycleEngine'
import PeptideTitrationPlanner from '@/components/peptides/PeptideTitrationPlanner'
import { ModalityAICoachBar } from '@/components/ai/ModalityAICoachBar'

// Helper to format timing_slot strings "morning_supplement_stack" -> "Morning Supplement Stack"
const formatSlotName = (str: string) => {
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const TIME_BLOCKS = [
  'morning',
  'morning_supplement_stack',
  'first_meal',
  'midday',
  'pre_workout_stack',
  'afternoon',
  'post_workout_stack',
  'with_meal',
  'evening',
  'evening_supplement_stack',
  'pre_bed',
  'anytime'
]

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// Helper to extract day of week from date string
const getInitialAnchorDay = (anchorDateStr?: string): string => {
  if (anchorDateStr) {
    try {
      const cleanDate = anchorDateStr.split('T')[0]
      const parts = cleanDate.split('-')
      if (parts.length === 3) {
        const yr = parseInt(parts[0], 10)
        const mo = parseInt(parts[1], 10) - 1
        const dy = parseInt(parts[2], 10)
        const d = new Date(yr, mo, dy, 12, 0, 0)
        const jsDay = d.getDay()
        return DAYS_OF_WEEK[jsDay === 0 ? 6 : jsDay - 1]
      }
    } catch (e) {}
  }
  return 'Mon'
}

interface MultiWeekSchedule {
  week1: string[]
  week2: string[]
  isAlternating: boolean
  combinedDays: string[]
}

// Pure helper to compute multi-week calendar schedules from an anchor day and rest interval
const computeMultiWeekSchedule = (
  restDays: number,
  anchorDay: string = 'Mon',
  isRolling: boolean = true
): MultiWeekSchedule => {
  const anchorIdx = DAYS_OF_WEEK.indexOf(anchorDay) !== -1 ? DAYS_OF_WEEK.indexOf(anchorDay) : 0
  const interval = restDays + 1

  if (interval >= 7) {
    return {
      week1: [anchorDay],
      week2: [anchorDay],
      isAlternating: false,
      combinedDays: [anchorDay]
    }
  }

  if (interval === 1) {
    return {
      week1: [...DAYS_OF_WEEK],
      week2: [...DAYS_OF_WEEK],
      isAlternating: false,
      combinedDays: [...DAYS_OF_WEEK]
    }
  }

  if (!isRolling) {
    const fixedDays: string[] = []
    for (let i = 0; i < 7; i += interval) {
      const dayIdx = (anchorIdx + i) % 7
      fixedDays.push(DAYS_OF_WEEK[dayIdx])
    }
    const sorted = DAYS_OF_WEEK.filter(d => fixedDays.includes(d))
    return {
      week1: sorted,
      week2: sorted,
      isAlternating: false,
      combinedDays: sorted
    }
  }

  const week1Set = new Set<string>()
  const week2Set = new Set<string>()
  const combinedSet = new Set<string>()

  for (let cycleIndex = 0; cycleIndex < 14; cycleIndex += interval) {
    const absoluteDay = (anchorIdx + cycleIndex) % 14
    if (absoluteDay < 7) {
      week1Set.add(DAYS_OF_WEEK[absoluteDay])
      combinedSet.add(DAYS_OF_WEEK[absoluteDay])
    } else {
      week2Set.add(DAYS_OF_WEEK[absoluteDay - 7])
      combinedSet.add(DAYS_OF_WEEK[absoluteDay - 7])
    }
  }

  const week1Arr = DAYS_OF_WEEK.filter(d => week1Set.has(d))
  const week2Arr = DAYS_OF_WEEK.filter(d => week2Set.has(d))
  const combinedArr = DAYS_OF_WEEK.filter(d => combinedSet.has(d))
  const isAlternating = week1Arr.join(',') !== week2Arr.join(',')

  return {
    week1: week1Arr,
    week2: week2Arr,
    isAlternating,
    combinedDays: combinedArr
  }
}

interface Props {
  isOpen: boolean
  onClose: () => void
  task?: DedupedTask | null
  modality?: any | null
  benchItem?: any | null
  userProfile?: UserProfile | null
  onSaveSuccess: () => void
}

export default function ManageTaskModal({ isOpen, onClose, task, modality: directModality, benchItem, userProfile, onSaveSuccess }: Props) {
  const modality = task?.protocol_step?.modality || task?.loose_modality || benchItem?.modality || directModality
  const modalityKey = task?.modality_id || task?.protocol_step_id || benchItem?.modality_id || modality?.id || task?.id || 'modality'
  const currentSlot = task?.timing_slot || task?.protocol_step?.timing_slot || 'afternoon'

  // Existing schedule config or intelligent automatic defaults from modality metadata
  const userSavedConfig = task?.execution_details?.schedule_config || getModalityScheduleConfig(modalityKey)
  const autoConfig = useMemo(() => {
    return deriveAutomaticScheduleConfig(modality, task?.protocol_step, task || undefined)
  }, [modality, task])
  
  const existingConfig = userSavedConfig || autoConfig

  // 1. Cadence & Schedule States
  const [scheduleMode, setScheduleMode] = useState<'days_of_week' | 'rest_interval' | 'specific_dates'>(
    existingConfig?.schedule_mode || 'days_of_week'
  )
  const [restDaysBetween, setRestDaysBetween] = useState<number>(
    existingConfig?.rest_days_between !== undefined ? existingConfig.rest_days_between : 1
  )
  const [anchorDay, setAnchorDay] = useState<string>(() => {
    return existingConfig?.anchor_day || getInitialAnchorDay(task?.scheduled_date)
  })
  const [isRollingRotation, setIsRollingRotation] = useState<boolean>(() => {
    return existingConfig?.is_rolling_rotation !== undefined ? existingConfig.is_rolling_rotation : true
  })
  const [selectedDays, setSelectedDays] = useState<string[]>(() => {
    if (existingConfig?.days_of_week && existingConfig.days_of_week.length > 0) {
      return existingConfig.days_of_week
    }
    return autoConfig?.days_of_week && autoConfig.days_of_week.length > 0 ? autoConfig.days_of_week : DAYS_OF_WEEK
  })
  const [skipPolicy, setSkipPolicy] = useState<'fixed' | 'roll_forward' | 'shift_sequence'>(
    existingConfig?.skip_policy || 'roll_forward'
  )
  const [selectedSlot, setSelectedSlot] = useState(() => task?.timing_slot || existingConfig?.timing_slot || currentSlot)
  const [applyToFuture, setApplyToFuture] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // 2. Multi-Dose Splitter States (1x, 2x AM/PM, 3x TID)
  const [dosesPerDay, setDosesPerDay] = useState<number>(() => {
    const rawTiming = task?.execution_details?.custom_timing || task?.protocol_step?.dose_text || ''
    if (rawTiming.includes('3x') || rawTiming.includes('TID') || rawTiming.includes('Dose 3')) return 3
    if (rawTiming.includes('2x') || rawTiming.includes('BID') || rawTiming.includes('Dose 2') || rawTiming.includes('AM/PM')) return 2
    return 1
  })
  const [dose1Timing, setDose1Timing] = useState<string>('morning')
  const [dose2Timing, setDose2Timing] = useState<string>('pre_bed')
  const [dose3Timing, setDose3Timing] = useState<string>('evening')

  // 3. Custom Dosage & Multi-Parameter Targets
  const initialDoseStr = task?.execution_details?.custom_dose || task?.protocol_step?.dose_text || modality?.dose_or_exposure || ''
  const [customDose, setCustomDose] = useState<string>(() => {
    if (initialDoseStr.includes('@')) return initialDoseStr.split('@')[0].trim()
    return initialDoseStr
  })
  const [secondaryParam, setSecondaryParam] = useState<string>(() => {
    if (initialDoseStr.includes('@')) return initialDoseStr.split('@').slice(1).join('@').trim()
    return ''
  })
  const [personalNotes, setPersonalNotes] = useState<string>(task?.execution_details?.notes || '')

  // 4. Extended & Pulsed Cadence States
  const [showExtendedPulsed, setShowExtendedPulsed] = useState<boolean>(() => {
    return !!existingConfig?.interval_preset || !!existingConfig?.specific_dates?.length || (existingConfig?.rest_days_between !== undefined && existingConfig.rest_days_between > 3)
  })
  const [intervalPreset, setIntervalPreset] = useState<string>(() => {
    if (existingConfig?.interval_preset) return existingConfig.interval_preset
    if (existingConfig?.rest_days_between !== undefined) {
      if (existingConfig.rest_days_between >= 26 && existingConfig.rest_days_between <= 31) return 'monthly'
      if (existingConfig.rest_days_between >= 12 && existingConfig.rest_days_between <= 15) return 'bi_weekly'
      if (existingConfig.rest_days_between >= 80 && existingConfig.rest_days_between <= 95) return 'quarterly'
      if (existingConfig.rest_days_between >= 170 && existingConfig.rest_days_between <= 190) return 'bi_annually'
      if (existingConfig.rest_days_between >= 350) return 'annually'
    }
    return ''
  })
  const [customIntervalDays, setCustomIntervalDays] = useState<number>(() => existingConfig?.custom_interval_days || 14)
  const [specificDates, setSpecificDates] = useState<string[]>(() => existingConfig?.specific_dates || [])
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date())
  const [calendarPickerOpen, setCalendarPickerOpen] = useState<boolean>(() => !!existingConfig?.specific_dates?.length)

  // 5. Literature Range & Protocol Context Resolver
  const activeProtocolContext = useMemo((): ProtocolDoseContext | undefined => {
    const proto = task?.protocol_step?.protocol
    if (!proto) return undefined
    return {
      protocolId: proto.id,
      protocolName: proto.name,
      doseText: task?.protocol_step?.dose_text,
      fullProtocolInstructions: task?.protocol_step?.instructions,
      sourceUrl: (proto as any)?.source_material_url || (task?.protocol_step as any)?.source_url
    }
  }, [task])

  const resolvedDose = useMemo(() => {
    if (!modality) return null
    return resolveRecommendedDose(modality, userProfile, activeProtocolContext)
  }, [modality, userProfile, activeProtocolContext])

  // Compute live multi-week schedule for rest intervals
  const multiWeekSchedule = useMemo(() => {
    return computeMultiWeekSchedule(restDaysBetween, anchorDay, isRollingRotation)
  }, [restDaysBetween, anchorDay, isRollingRotation])

  // Contextual Presets & Category Rationale
  const modalityNameCat = `${modality?.name || ''} ${modality?.category || ''}`.toLowerCase()
  const isSauna = modalityNameCat.includes('sauna') || modalityNameCat.includes('heat')
  const isCold = modalityNameCat.includes('cold') || modalityNameCat.includes('plunge') || modalityNameCat.includes('ice')
  const isCardio = modalityNameCat.includes('fitness') || modalityNameCat.includes('cardio') || modalityNameCat.includes('exercise') || modalityNameCat.includes('hiit') || modalityNameCat.includes('vo2') || modalityNameCat.includes('zone') || modalityNameCat.includes('run') || modalityNameCat.includes('walk')

  let secondaryLabel = 'Synergy / Admin Vehicle'
  let secondaryPlaceholder = 'e.g. SubQ Fasted / With 1 tbsp EVOO'
  let secondaryPresets: string[] = ['Fasted AM', 'With Fat Meal', 'Pre-Bed Fasted', 'SubQ Abdomen']

  if (isSauna) {
    secondaryLabel = 'Target Temperature'
    secondaryPlaceholder = 'e.g. 174°F+ / 80°C+'
    secondaryPresets = ['174°F+ (80°C+)', '185°F (85°C)', '195°F (90°C)', '160°F (71°C)']
  } else if (isCold) {
    secondaryLabel = 'Target Water Temp'
    secondaryPlaceholder = 'e.g. 50°F–55°F / 10°C–13°C'
    secondaryPresets = ['50°F–55°F (10°C–13°C)', '45°F–50°F (7°C–10°C)', '38°F–42°F (3°C–5°C)']
  } else if (isCardio) {
    secondaryLabel = 'Target Intensity / HR Zone'
    secondaryPlaceholder = 'e.g. Zone 2 (60-70% HRmax) or Zone 5 (4x4 Intervals)'
    secondaryPresets = ['Zone 2 (60-70% HRmax)', 'Zone 5 (4x4 Intervals)', 'RPE 7-8/10 (Vigorous)', 'Zone 3-4 (Tempo)']
  }

  const circadianTip = getCircadianTipForModality(modality?.name, modality?.category)
  const prescribedDoseText = task?.protocol_step?.dose_text || modality?.dose_or_exposure || ''
  const prescribedProtocolName = task?.protocol_step?.protocol?.name || 'Assigned Protocol'

  if (!isOpen || !modality) return null

  // Day toggle handlers
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) return
      setSelectedDays(selectedDays.filter(d => d !== day))
    } else {
      setSelectedDays([...selectedDays, day])
    }
  }

  const resetEveryday = () => setSelectedDays([...DAYS_OF_WEEK])
  const setMonWedFri = () => setSelectedDays(['Mon', 'Wed', 'Fri'])
  const setTueFri = () => setSelectedDays(['Tue', 'Fri'])
  const setWeekdays = () => setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])

  const handleSelectRestInterval = (days: number) => {
    setRestDaysBetween(days)
    setIntervalPreset('')
    setScheduleMode('rest_interval')
  }

  const handleSelectPreset = (presetKey: string, restDays: number) => {
    setIntervalPreset(presetKey)
    setRestDaysBetween(restDays)
    setScheduleMode('rest_interval')
  }

  const handleCustomDaysChange = (days: number) => {
    const val = Math.max(1, days)
    setCustomIntervalDays(val)
    setRestDaysBetween(val - 1)
    setIntervalPreset('custom_days')
    setScheduleMode('rest_interval')
  }

  const toggleSpecificDate = (dateStr: string) => {
    if (specificDates.includes(dateStr)) {
      setSpecificDates(specificDates.filter(d => d !== dateStr))
    } else {
      setSpecificDates([...specificDates, dateStr].sort())
    }
    setScheduleMode('specific_dates')
    setIntervalPreset('specific_dates')
  }

  const handleSelectAnchorDay = (day: string) => setAnchorDay(day)

  const getEffectiveFormattedDose = () => {
    const main = customDose.trim()
    if (secondaryParam && secondaryParam.trim()) {
      return `${main} @ ${secondaryParam.trim()}`
    }
    return main
  }

  const handleApplyPresetDose = (doseText: string) => {
    if (doseText.includes('@')) {
      const parts = doseText.split('@')
      setCustomDose(parts[0].trim())
      setSecondaryParam(parts.slice(1).join('@').trim())
    } else {
      setCustomDose(doseText.trim())
    }
  }

  const handleSave = async () => {
    setIsProcessing(true)
    const localUserId = getLocalUserId()

    const daysToSave = scheduleMode === 'rest_interval'
      ? multiWeekSchedule.combinedDays
      : selectedDays

    let timingFormatted = selectedSlot
    if (dosesPerDay === 2) {
      timingFormatted = `2x Daily: Dose 1 (${dose1Timing}) + Dose 2 (${dose2Timing})`
    } else if (dosesPerDay === 3) {
      timingFormatted = `3x Daily: Dose 1 (${dose1Timing}) + Dose 2 (${dose2Timing}) + Dose 3 (${dose3Timing})`
    }

    const customTimingString = `${daysToSave.length}x/wk • ${timingFormatted}`

    const config: ModalityScheduleConfig = {
      schedule_mode: scheduleMode,
      days_of_week: daysToSave,
      rest_days_between: restDaysBetween,
      interval_preset: (intervalPreset || undefined) as any,
      custom_interval_days: intervalPreset === 'custom_days' ? customIntervalDays : undefined,
      specific_dates: scheduleMode === 'specific_dates' ? specificDates : undefined,
      anchor_day: anchorDay,
      anchor_date: task?.scheduled_date || new Date().toISOString(),
      is_rolling_rotation: isRollingRotation,
      skip_policy: skipPolicy,
      timing_slot: dosesPerDay > 1 ? dose1Timing : selectedSlot
    }

    const finalFormattedDose = getEffectiveFormattedDose()
    const fromDate = task?.scheduled_date || format(new Date(), 'yyyy-MM-dd')
    const effectiveModalityId = modality?.id || task?.modality_id || ''

    if (applyToFuture && effectiveModalityId) {
      await reconcileModalityScheduleAndFutureTasks(localUserId, effectiveModalityId, {
        customDose: finalFormattedDose,
        customTiming: customTimingString,
        notes: personalNotes,
        scheduleConfig: config,
        fromDate,
        protocolStepId: task?.protocol_step_id || undefined
      })
    } else {
      // 1. Update schedule config & cadence
      await updateModalityScheduleConfig(localUserId, modalityKey, config, false)

      // 2. Update execution details / dosage & notes
      if (task?.id) {
        const realId = task.id.includes('-split-') ? task.id.split('-split-')[0] : task.id
        await updateTaskExecutionDetails(realId, {
          custom_dose: finalFormattedDose,
          custom_timing: customTimingString,
          notes: personalNotes,
          schedule_config: config
        })
      }
    }

    setIsProcessing(false)
    onSaveSuccess()
  }

  const executeDelete = async () => {
    setIsProcessing(true)
    const localUserId = getLocalUserId()
    if (task?.id) {
      await deleteTask(localUserId, task.id, applyToFuture)
    }
    setIsProcessing(false)
    onSaveSuccess()
  }

  // Calendar calculations for specific date picker
  const monthStart = startOfMonth(calendarMonth)
  const monthEnd = endOfMonth(calendarMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: gridStart, end: gridEnd })

  // Literature spectrum helper
  const minLit = resolvedDose?.literatureRange?.min ?? 1
  const maxLit = resolvedDose?.literatureRange?.max ?? 10
  const doseUnit = resolvedDose?.unit || ''

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-xl md:max-w-4xl lg:max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[92vh] min-h-0 my-auto text-white">
        {/* Sticky Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-950/50 shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white leading-tight truncate">
                  {modality.display_name || modality.name}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                  {modality.category || 'protocol'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                {modality.brief_description || modality.headline_benefit || 'Custom Protocol Schedule & Dosage'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body with Desktop 2-Column Grid */}
        <div className="p-4 sm:p-6 md:p-7 space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0 text-xs">
          {/* ACTIVE CONTEXT PRESCRIPTION BANNER (Full Width) */}
          {prescribedDoseText && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-cyan-500/30 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Target size={12} />
                  <span>Prescribed Protocol Dosing</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {prescribedProtocolName}
                </span>
              </div>
              <p className="text-sm sm:text-base font-black text-white leading-snug">
                {prescribedDoseText}
              </p>
            </div>
          )}

          {/* AI Modality & Protocol Synergy Coach Bar (Full Width) */}
          <ModalityAICoachBar
            modalityName={modality?.name || 'Protocol Modality'}
            modalityDetails={modality}
            protocolName={prescribedProtocolName}
            currentDose={customDose}
            currentTiming={selectedSlot}
            userProfile={userProfile}
            onApplyDose={(dose) => setCustomDose(dose)}
            onApplyTiming={(timing) => {
              const lower = timing.toLowerCase()
              if (lower.includes('morning') || lower.includes('wake') || lower.includes('am')) setSelectedSlot('morning')
              else if (lower.includes('bed') || lower.includes('sleep') || lower.includes('night')) setSelectedSlot('pre_bed')
              else if (lower.includes('midday') || lower.includes('noon') || lower.includes('lunch')) setSelectedSlot('midday')
              else if (lower.includes('evening') || lower.includes('dinner') || lower.includes('pm')) setSelectedSlot('evening')
              else if (lower.includes('meal') || lower.includes('food')) setSelectedSlot('with_meal')
              else setSelectedSlot('morning')
            }}
            onApplyMultiDose={(count, s1, s2, s3) => {
              setDosesPerDay(count)
              if (s1) setDose1Timing(s1)
              if (s2) setDose2Timing(s2)
              if (s3) setDose3Timing(s3)
            }}
            onApplyCadence={(mode, days, restDays, strategy) => {
              setScheduleMode(mode)
              if (days && days.length > 0) setSelectedDays(days)
              if (restDays !== undefined && restDays !== null) setRestDaysBetween(restDays)
              if (strategy) {
                if (strategy === 'strict_fixed') setSkipPolicy('fixed')
                else if (strategy === 'cascade_shift') setSkipPolicy('shift_sequence')
                else setSkipPolicy('roll_forward')
              }
            }}
            onAppendNotes={(note) => {
              setPersonalNotes(prev => prev ? `${prev}\n\n${note}` : note)
            }}
          />

          {/* 2-Column Responsive Desktop Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* LEFT COLUMN: Cadence, Scheduling & Adaptation Strategy */}
            <div className="space-y-6">
              {/* SECTION 1: Cadence & Scheduling Strategy (LEVL BLUE STYLING) */}
              <div className="space-y-3">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-cyan-400" />
                  <span>1. Cadence &amp; Scheduling Strategy</span>
                </label>

                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-2xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setScheduleMode('days_of_week')}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      scheduleMode === 'days_of_week'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold shadow-md shadow-cyan-500/25 border border-cyan-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <CalendarIcon size={14} />
                    <span>Days of Week</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScheduleMode('rest_interval')}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      scheduleMode === 'rest_interval' || scheduleMode === 'specific_dates'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold shadow-md shadow-cyan-500/25 border border-cyan-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <ShieldCheck size={14} />
                    <span>Recovery Rest &amp; Pulsed</span>
                  </button>
                </div>

                {/* Mode A: 7-Day Selector (LEVL BLUE STYLED) */}
                {scheduleMode === 'days_of_week' ? (
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                        <span>🗓️ Active Scheduled Days ({selectedDays.length}/7):</span>
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={setTueFri}
                          className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                        >
                          Tue/Fri (2x/wk)
                        </button>
                        <button
                          type="button"
                          onClick={setMonWedFri}
                          className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                        >
                          Mon/Wed/Fri
                        </button>
                        <button
                          type="button"
                          onClick={setWeekdays}
                          className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                        >
                          5 on / 2 off
                        </button>
                        <button
                          type="button"
                          onClick={resetEveryday}
                          className="text-[10px] font-bold text-slate-400 hover:text-white underline cursor-pointer"
                        >
                          Everyday
                        </button>
                      </div>
                    </div>

                    {/* Day Buttons with LEVL Blue styling */}
                    <div className="grid grid-cols-7 gap-1.5">
                      {DAYS_OF_WEEK.map((day, idx) => {
                        const isSelected = selectedDays.includes(day)
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`h-9 rounded-xl font-extrabold text-xs flex items-center justify-center transition-all cursor-pointer select-none active:scale-95 ${
                              isSelected
                                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black shadow-md shadow-cyan-500/30 border border-cyan-400/40'
                                : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                            }`}
                            title={`Toggle ${day}`}
                          >
                            {DAY_LABELS[idx]}
                          </button>
                        )
                      })}
                    </div>

                    <p className="text-[10px] text-slate-500 italic">
                      {selectedDays.length === 7
                        ? 'Scheduled everyday across the weekly calendar.'
                        : `Scheduled on ${selectedDays.join(', ')} (${selectedDays.length} days/week).`}
                    </p>
                  </div>
                ) : (
                  /* Mode B: Recovery Rest Interval with Dynamic Anchor, Progression Toggle & Calendar Picker */
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3.5 animate-in fade-in">
                    {/* 1. Quick Rest Days Selector */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-300 block">
                        ⏱️ Rest Days Between Sessions:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          { days: 0, label: '0 Days', sub: 'Everyday' },
                          { days: 1, label: '1 Day Rest', sub: 'Every 2nd Day' },
                          { days: 2, label: '2 Days Rest', sub: 'Every 3rd Day' },
                          { days: 3, label: '3 Days Rest', sub: 'Every 4th Day' },
                          { days: 6, label: 'Weekly', sub: '6 Days Rest (1x/Wk)' }
                        ].map(opt => (
                          <button
                            key={opt.days}
                            type="button"
                            onClick={() => handleSelectRestInterval(opt.days)}
                            className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                              scheduleMode === 'rest_interval' && !intervalPreset && restDaysBetween === opt.days
                                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold shadow-md ring-1 ring-cyan-500/40'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <span className="block font-black text-xs">{opt.label}</span>
                            <span className="block text-[9px] text-slate-500">{opt.sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Anchor Starting Day Selector */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <span>🚀 Start / Anchor Day:</span>
                        </span>
                        <span className="text-[10px] text-cyan-400 font-bold">
                          Starts on {anchorDay}
                        </span>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5">
                        {DAYS_OF_WEEK.map((day, idx) => {
                          const isAnchor = anchorDay === day
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => handleSelectAnchorDay(day)}
                              className={`h-8 rounded-xl font-extrabold text-xs flex items-center justify-center transition-all cursor-pointer select-none active:scale-95 ${
                                isAnchor
                                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 font-black ring-1 ring-white/30'
                                  : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                              }`}
                              title={`Anchor start day on ${day}`}
                            >
                              {DAY_LABELS[idx]}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* 3. Rolling Rotation vs Lock Weekly Toggle */}
                    <div className="pt-1">
                      <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                        <button
                          type="button"
                          onClick={() => setIsRollingRotation(true)}
                          className={`p-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
                            isRollingRotation
                              ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 font-bold shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <RefreshCw size={13} className={isRollingRotation ? 'text-cyan-400 animate-spin-slow' : ''} />
                          <span className="font-bold">Rolling Rotation</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsRollingRotation(false)}
                          className={`p-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
                            !isRollingRotation
                              ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 font-bold shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Lock size={13} className={!isRollingRotation ? 'text-cyan-400' : ''} />
                          <span className="font-bold">Lock Weekly</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 pl-1">
                        {isRollingRotation 
                          ? '🔄 Continuous rolling rotation maintains strict rest intervals across calendar weeks (days shift over time).' 
                          : '🔒 Weekly lock repeats the exact same days every week for fixed weekly routines.'}
                      </p>
                    </div>

                    {/* 4. Live Multi-Week Progression Preview */}
                    <div className="p-3 bg-black/50 rounded-2xl border border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-bold flex items-center gap-1.5">
                          <span>🗓️ Cadence Summary:</span>
                        </span>
                        <span className="text-cyan-400 font-extrabold text-[10px]">
                          {scheduleMode === 'specific_dates'
                            ? `${specificDates.length} Specific Dates`
                            : restDaysBetween > 6
                            ? `Every ${restDaysBetween + 1} Days`
                            : isRollingRotation && multiWeekSchedule.isAlternating
                            ? '2-Week Repeating Cycle'
                            : 'Weekly Repeating'}
                        </span>
                      </div>

                      {/* Week 1 Row */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5 font-mono">
                          <span>{isRollingRotation && multiWeekSchedule.isAlternating ? 'Week 1:' : 'Active Days:'} {multiWeekSchedule.week1.join(', ')}</span>
                          <span className="text-slate-500">{multiWeekSchedule.week1.length} sessions</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {DAYS_OF_WEEK.map((d, idx) => {
                            const isActive = multiWeekSchedule.week1.includes(d)
                            return (
                              <div
                                key={`w1-${d}`}
                                className={`h-6 rounded-lg text-[10px] font-black flex items-center justify-center transition-all ${
                                  isActive
                                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black shadow-sm'
                                    : 'bg-white/5 text-slate-600'
                                }`}
                              >
                                {DAY_LABELS[idx]}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Week 2 Row */}
                      {isRollingRotation && multiWeekSchedule.isAlternating && (
                        <div className="space-y-1 pt-1.5 border-t border-white/5 animate-in fade-in slide-in-from-top-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5 font-mono">
                            <span className="text-cyan-400">Week 2: {multiWeekSchedule.week2.join(', ')}</span>
                            <span className="text-slate-500">{multiWeekSchedule.week2.length} sessions</span>
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                            {DAYS_OF_WEEK.map((d, idx) => {
                              const isActive = multiWeekSchedule.week2.includes(d)
                              return (
                                <div
                                  key={`w2-${d}`}
                                  className={`h-6 rounded-lg text-[10px] font-black flex items-center justify-center transition-all ${
                                    isActive
                                      ? 'bg-cyan-400 text-black font-black shadow-sm'
                                      : 'bg-white/5 text-slate-600'
                                  }`}
                                >
                                  {DAY_LABELS[idx]}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 5. Collapsible Extended Pulsed & Interactive Calendar Date Picker */}
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => setShowExtendedPulsed(!showExtendedPulsed)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white flex items-center justify-between text-xs font-bold transition-all cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles size={13} className="text-cyan-400" />
                          <span>Other Pulsed Cadences &amp; Custom Calendar Dates...</span>
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-cyan-400">
                          {intervalPreset ? (
                            <span className="bg-cyan-500/20 px-2 py-0.5 rounded-md border border-cyan-500/30 font-mono text-[10px]">
                              {intervalPreset.replace('_', ' ').toUpperCase()}
                            </span>
                          ) : null}
                          {showExtendedPulsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </span>
                      </button>

                      {showExtendedPulsed && (
                        <div className="mt-2.5 p-3 rounded-2xl bg-black/60 border border-white/10 space-y-3 animate-in fade-in">
                          {/* Presets Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {[
                              { key: 'bi_weekly', label: 'Bi-Weekly', sub: 'Every 2 Wks (13d Rest)', restDays: 13 },
                              { key: 'monthly', label: 'Monthly', sub: 'Every 30 Days (29d Rest)', restDays: 29 },
                              { key: 'quarterly', label: 'Quarterly', sub: 'Every 90 Days (89d Rest)', restDays: 89 }
                            ].map(preset => (
                              <button
                                key={preset.key}
                                type="button"
                                onClick={() => handleSelectPreset(preset.key, preset.restDays)}
                                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                                  intervalPreset === preset.key
                                    ? 'bg-cyan-500/25 border-cyan-500 text-cyan-300 font-bold shadow-md ring-1 ring-cyan-500/40'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                <span className="block font-black text-[11px] leading-tight">{preset.label}</span>
                                <span className="block text-[9px] text-slate-500 leading-tight mt-0.5">{preset.sub}</span>
                              </button>
                            ))}
                          </div>

                          {/* Custom Days Input */}
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-3">
                            <div>
                              <span className="text-[11px] font-bold text-white block">Custom Interval (Days):</span>
                              <span className="text-[10px] text-slate-400">Sets session every N days</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-900 border border-white/10 rounded-xl p-1">
                              <button
                                type="button"
                                onClick={() => handleCustomDaysChange(customIntervalDays - 1)}
                                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                              >
                                <Minus size={13} />
                              </button>
                              <input
                                type="number"
                                min="1"
                                max="730"
                                value={customIntervalDays}
                                onChange={(e) => handleCustomDaysChange(parseInt(e.target.value) || 1)}
                                className="w-12 bg-transparent text-center text-xs font-black text-cyan-400 focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-500 pr-1">Days</span>
                              <button
                                type="button"
                                onClick={() => handleCustomDaysChange(customIntervalDays + 1)}
                                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Interactive Calendar Date Picker */}
                          <div className="pt-2 border-t border-white/5 space-y-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCalendarPickerOpen(!calendarPickerOpen)
                                if (!calendarPickerOpen) {
                                  setScheduleMode('specific_dates')
                                  setIntervalPreset('specific_dates')
                                }
                              }}
                              className={`w-full py-2 px-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                                scheduleMode === 'specific_dates'
                                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-extrabold shadow-sm'
                                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <CalendarIcon size={14} className="text-cyan-400" />
                                <span>Pick Specific Future Dates on Calendar</span>
                              </span>
                              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30 font-mono">
                                {specificDates.length} Selected
                              </span>
                            </button>

                            {calendarPickerOpen && (
                              <div className="p-3 bg-slate-950 rounded-2xl border border-white/10 space-y-2 animate-in fade-in">
                                <div className="flex items-center justify-between px-1">
                                  <button
                                    type="button"
                                    onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                                  >
                                    <ChevronLeft size={15} />
                                  </button>
                                  <span className="font-extrabold text-xs text-white">
                                    {format(calendarMonth, 'MMMM yyyy')}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                                  >
                                    <ChevronRight size={15} />
                                  </button>
                                </div>

                                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500">
                                  {DAY_LABELS.map((lbl, i) => (
                                    <div key={i}>{lbl}</div>
                                  ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                  {calendarDays.map((day) => {
                                    const dateStr = format(day, 'yyyy-MM-dd')
                                    const isCurrentMonth = isSameMonth(day, calendarMonth)
                                    const isSelected = specificDates.includes(dateStr)
                                    const isTodayDate = isToday(day)

                                    return (
                                      <button
                                        key={dateStr}
                                        type="button"
                                        onClick={() => toggleSpecificDate(dateStr)}
                                        className={`h-7 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center cursor-pointer select-none ${
                                          isSelected
                                            ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black shadow-md shadow-cyan-500/30 ring-1 ring-white/40'
                                            : isCurrentMonth
                                            ? isTodayDate
                                              ? 'bg-white/10 border border-cyan-500 text-cyan-400'
                                              : 'bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white'
                                            : 'bg-transparent text-slate-700 hover:text-slate-500'
                                        }`}
                                        title={dateStr}
                                      >
                                        {format(day, 'd')}
                                      </button>
                                    )
                                  })}
                                </div>

                                {/* Selected Date Chips */}
                                {specificDates.length > 0 && (
                                  <div className="pt-2 border-t border-white/5 space-y-1.5">
                                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                                      <span>Selected Pulse Dates ({specificDates.length}):</span>
                                      <button
                                        type="button"
                                        onClick={() => setSpecificDates([])}
                                        className="text-red-400 hover:underline cursor-pointer"
                                      >
                                        Clear all
                                      </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto custom-scrollbar">
                                      {specificDates.map(d => (
                                        <span
                                          key={d}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono"
                                        >
                                          <span>{d}</span>
                                          <button
                                            type="button"
                                            onClick={() => toggleSpecificDate(d)}
                                            className="hover:text-white cursor-pointer ml-0.5"
                                          >
                                            ×
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: Real-World Adaptation */}
              <div className="space-y-3">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Zap size={13} className="text-cyan-400" />
                  <span>2. Real-World Adaptation (If Skipped / Missed)</span>
                </label>

                <div className="space-y-2">
                  {[
                    {
                      id: 'roll_forward',
                      title: 'Roll Forward (Move to next available day)',
                      badge: 'Recommended',
                      desc: 'If missed or skipped, automatically moves this session to tomorrow / next available day so you never lose progress.'
                    },
                    {
                      id: 'fixed',
                      title: 'Fixed Calendar Days',
                      badge: 'Strict Cadence',
                      desc: 'If missed, marks it skipped for the day. Your next session stays locked to its regular planned calendar cadence.'
                    },
                    {
                      id: 'shift_sequence',
                      title: 'Cascade Shift (Shift Entire Sequence)',
                      badge: 'Rotational Sequence',
                      desc: 'Shifts all upcoming protocol sessions forward by 1 day so your step-by-step sequence stays strictly intact.'
                    }
                  ].map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setSkipPolicy(opt.id as any)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        skipPolicy === opt.id
                          ? 'bg-cyan-950/30 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                          : 'bg-slate-950/40 border-white/5 hover:border-white/10 hover:bg-slate-950/70'
                      }`}
                    >
                      <div className="pt-0.5">
                        <input
                          type="radio"
                          name="skipPolicy"
                          checked={skipPolicy === opt.id}
                          onChange={() => setSkipPolicy(opt.id as any)}
                          className="accent-cyan-500 w-4 h-4 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white text-xs">{opt.title}</span>
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">{opt.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 3: Multi-Session Frequency & Timing Slots */}
              <div className="space-y-3">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock size={13} className="text-cyan-400" />
                  <span>3. Daily Session Frequency &amp; Timing Slots</span>
                </label>

                {/* Circadian Recommendation Pill */}
                {circadianTip && (
                  <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-xs flex items-start gap-2.5">
                    <Sparkles size={15} className="text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block text-[11px] font-extrabold mb-0.5">AI Circadian Timing Recommendation:</strong>
                      <p className="opacity-90 leading-snug text-[11px]">{circadianTip}</p>
                    </div>
                  </div>
                )}

                {/* Doses per day buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { count: 1, label: '1x Daily', sub: 'Single Session' },
                    { count: 2, label: '2x Daily', sub: 'Split AM / PM' },
                    { count: 3, label: '3x Daily', sub: 'TID with Meals' }
                  ].map(d => (
                    <button
                      key={d.count}
                      type="button"
                      onClick={() => setDosesPerDay(d.count)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        dosesPerDay === d.count
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="block font-black text-xs">{d.label}</span>
                      <span className="block text-[9px] text-slate-500">{d.sub}</span>
                    </button>
                  ))}
                </div>

                {/* Timing Block Pickers */}
                {dosesPerDay === 1 ? (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Execution Window:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TIME_BLOCKS.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            selectedSlot === slot
                              ? 'bg-cyan-500/20 border-cyan-500 text-white font-bold shadow-md'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Clock size={12} className={selectedSlot === slot ? 'text-cyan-400' : 'text-slate-500'} />
                          <span className="truncate text-[11px]">{formatSlotName(slot)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-cyan-400 block uppercase">Dose 1 Timing:</span>
                      <select
                        value={dose1Timing}
                        onChange={e => setDose1Timing(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:border-cyan-500"
                      >
                        {TIME_BLOCKS.map(slot => (
                          <option key={slot} value={slot}>{formatSlotName(slot)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-cyan-400 block uppercase">Dose 2 Timing:</span>
                      <select
                        value={dose2Timing}
                        onChange={e => setDose2Timing(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:border-cyan-500"
                      >
                        {TIME_BLOCKS.map(slot => (
                          <option key={slot} value={slot}>{formatSlotName(slot)}</option>
                        ))}
                      </select>
                    </div>

                    {dosesPerDay === 3 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-cyan-400 block uppercase">Dose 3 Timing:</span>
                        <select
                          value={dose3Timing}
                          onChange={e => setDose3Timing(e.target.value)}
                          className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:border-cyan-500"
                        >
                          {TIME_BLOCKS.map(slot => (
                            <option key={slot} value={slot}>{formatSlotName(slot)}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Dosage, Literature Spectrum, Titration & Evidence */}
            <div className="space-y-6">
              {/* SECTION 4: Interactive Literature Range Spectrum & Multi-Parameter Custom Dosage */}
              <div className="space-y-3">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sliders size={13} className="text-cyan-400" />
                  <span>4. Literature Range Spectrum &amp; Custom Targets</span>
                </label>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                  {/* Literature Range Bar */}
                  {resolvedDose?.literatureRange && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span className="font-semibold text-white">Literature Range:</span>
                        <span className="font-mono font-bold text-cyan-400">
                          {minLit} {doseUnit} – {maxLit} {doseUnit}
                        </span>
                      </div>

                      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden relative border border-white/10 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 rounded-full opacity-90"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Recommended Marker Row Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {resolvedDose?.starterDose && (
                      <button
                        type="button"
                        onClick={() => handleApplyPresetDose(`${resolvedDose.starterDose!.value} ${doseUnit}`)}
                        className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-400 text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>Starter</span>
                        </div>
                        <span className="block font-mono font-bold text-xs text-white mt-0.5">
                          {resolvedDose.starterDose.value} {doseUnit}
                        </span>
                      </button>
                    )}

                    {resolvedDose?.personalizedTargetDose && (
                      <button
                        type="button"
                        onClick={() => handleApplyPresetDose(`${resolvedDose.personalizedTargetDose!.value} ${doseUnit}`)}
                        className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-bold">
                          <div className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span>Personal Target</span>
                        </div>
                        <span className="block font-mono font-bold text-xs text-white mt-0.5">
                          {resolvedDose.personalizedTargetDose.value} {doseUnit}
                        </span>
                      </button>
                    )}

                    {prescribedDoseText && (
                      <button
                        type="button"
                        onClick={() => handleApplyPresetDose(prescribedDoseText)}
                        className="p-2.5 rounded-xl bg-slate-900/90 border border-purple-500/30 hover:border-purple-400 text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-1.5 text-purple-400 text-[10px] font-bold">
                          <div className="w-2 h-2 rounded-full bg-purple-400" />
                          <span className="truncate">{prescribedProtocolName}</span>
                        </div>
                        <span className="block font-mono font-bold text-xs text-white mt-0.5 truncate">
                          {prescribedDoseText}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Multi-Parameter Inputs */}
                  <div className="pt-2 border-t border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                        Multi-Parameter Custom Target
                      </span>
                      <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                        {getEffectiveFormattedDose() || 'Standard'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-300 block uppercase">
                          Primary Exposure / Dose:
                        </span>
                        <input
                          type="text"
                          value={customDose}
                          onChange={e => setCustomDose(e.target.value)}
                          placeholder="e.g. 23 mins or 2.5 mg SubQ"
                          className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:border-cyan-500 font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-300 block uppercase">
                          {secondaryLabel}:
                        </span>
                        <input
                          type="text"
                          value={secondaryParam}
                          onChange={e => setSecondaryParam(e.target.value)}
                          placeholder={secondaryPlaceholder}
                          className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:border-cyan-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Secondary Presets */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">Presets:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {secondaryPresets.map(pre => (
                          <button
                            key={pre}
                            type="button"
                            onClick={() => setSecondaryParam(pre)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                              secondaryParam === pre
                                ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                                : 'bg-white/5 border-white/5 text-slate-300 hover:text-white'
                            }`}
                          >
                            {pre}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* OPTIONAL PEPTIDE TITRATION STEP-UP PLANNER */}
                {(isPeptideModality(task as any) ||
                  modality?.category === 'Peptide' ||
                  modalityKey.toLowerCase().includes('subq') ||
                  modalityKey.toLowerCase().includes('peptide') ||
                  modalityKey.toLowerCase().includes('bpc') ||
                  modalityKey.toLowerCase().includes('tirzepatide') ||
                  modalityKey.toLowerCase().includes('semaglutide') ||
                  modalityKey.toLowerCase().includes('ghk') ||
                  modalityKey.toLowerCase().includes('cjc') ||
                  modalityKey.toLowerCase().includes('ipamorelin')) && (
                  <div className="pt-2">
                    <PeptideTitrationPlanner
                      modalityKey={modalityKey}
                      modalityName={modality?.name || 'Peptide Bioactive'}
                      currentDoseAmount={parseFloat(customDose) || 250}
                      doseUnit={doseUnit || 'mcg'}
                      onApplyDose={(newDose, unit) => {
                        setCustomDose(`${newDose} ${unit}`)
                      }}
                    />
                  </div>
                )}
              </div>

              {/* SECTION 5: Evidence Dossier & Personal Protocol Notes */}
              <div className="space-y-3">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText size={13} className="text-cyan-400" />
                  <span>5. Protocol Details &amp; Personal Notes</span>
                </label>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                  {/* PubMed study link if available */}
                  {(modality as any)?.pubmed_url || activeProtocolContext?.sourceUrl ? (
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                        <BookOpen size={13} />
                        <span>Scientific Evidence &amp; Study Data</span>
                      </span>
                      <a
                        href={
                          (modality as any)?.pubmed_url && (modality as any).pubmed_url !== 'https://pubmed.ncbi.nlm.nih.gov/'
                            ? (modality as any).pubmed_url
                            : activeProtocolContext?.sourceUrl && activeProtocolContext.sourceUrl !== 'https://pubmed.ncbi.nlm.nih.gov/'
                            ? activeProtocolContext.sourceUrl
                            : resolvePubMedCitation((modality as any)?.id || task?.modality_id, (modality as any)?.name || (modality as any)?.display_name || task?.loose_modality?.name || task?.protocol_step?.modality?.name).pubMedUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        <span>Source Material &amp; PubMed</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  ) : null}

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-300 block uppercase">
                      Personal Protocol Log &amp; Notes:
                    </span>
                    <textarea
                      rows={3}
                      value={personalNotes}
                      onChange={e => setPersonalNotes(e.target.value)}
                      placeholder="e.g. SubQ abdomen, reconstituted with 2ml BAC water."
                      className="w-full p-3 bg-slate-950 border border-white/10 rounded-2xl text-xs text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6: Scope Checkbox */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={applyToFuture}
                    onChange={e => setApplyToFuture(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-white text-xs block">
                      Apply to all upcoming instances of this modality
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Synchronizes this schedule, dosage, and skip adaptation policy across your active protocol calendar.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        {showDeleteConfirm ? (
          <div className="p-4 sm:p-5 border-t border-red-500/40 bg-red-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 shrink-0">
            <div className="flex items-center gap-2 text-red-200 text-xs">
              <AlertTriangle size={17} className="text-red-400 shrink-0" />
              <span>
                <strong>Remove from schedule?</strong> {applyToFuture ? 'All upcoming instances will be removed.' : 'Only this single instance will be removed.'}
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isProcessing}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold transition-colors cursor-pointer text-xs"
              >
                No, Keep
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition-all shadow-lg shadow-red-950 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
              >
                <Trash2 size={15} />
                <span>{isProcessing ? 'Removing...' : 'Yes, Remove'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isProcessing}
              className="px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 flex items-center gap-1.5 font-bold transition-colors cursor-pointer disabled:opacity-50"
              title="Remove from schedule"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline text-xs">Remove</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 font-bold transition-colors cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black rounded-xl transition-all shadow-lg shadow-cyan-900/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
              >
                <CheckCircle2 size={15} />
                <span>{isProcessing ? 'Saving...' : 'Save Schedule & Sync'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
