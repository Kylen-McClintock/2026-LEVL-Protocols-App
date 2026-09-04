'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Sparkles, CheckCircle2, Pill, Calendar, Clock, ArrowRight, 
  Check, Loader2, BookOpen, Sliders
} from 'lucide-react'
import { 
  createCustomModality, 
  addModalityOrProtocolToToday, 
  addToBench, 
  reconcileModalityScheduleAndFutureTasks, 
  upsertBenchItemOverride,
  ModalityScheduleConfig 
} from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { CustomModalityInitialData } from '@/components/modals/CreateCustomModalityModal'

export interface ModalityInitiationCardProps {
  callId?: string
  modality?: any
  initialData?: CustomModalityInitialData & {
    briefDescription?: string
    brief_description?: string
    doseOptions?: string[]
    dose_options?: string[]
  }
  onInitiateSuccess?: (modality: any) => void
  onOpenStudio?: (data: CustomModalityInitialData) => void
}

export default function ModalityInitiationCard({
  callId,
  modality,
  initialData,
  onInitiateSuccess,
  onOpenStudio
}: ModalityInitiationCardProps) {
  const router = useRouter()
  const { user } = useAuth()

  // Base identifiers & descriptors
  const modName = modality?.name || initialData?.name || 'New Modality'
  const category = modality?.category || initialData?.category || 'Supplements'
  const headlineBenefit = modality?.headline_benefit || initialData?.headlineBenefit || 'Targeted longevity & healthspan optimization'
  const briefDescription = 
    initialData?.briefDescription || 
    initialData?.brief_description || 
    modality?.brief_description || 
    modality?.headline_benefit || 
    initialData?.headlineBenefit ||
    'Evidence-based longevity intervention drafted by your AI Longevity Coach to enhance cellular health and physiological performance.'
  const instructions = modality?.instructions || initialData?.instructions || ''

  // 1. Interactive Dosage Options
  const rawSuggestedDose = modality?.dose_or_exposure || (initialData?.doseAmount ? `${initialData.doseAmount} ${initialData.doseUnit || 'mg'}` : '10 mg')
  
  // Extract number and unit
  const doseMatch = rawSuggestedDose.match(/^(\d+(?:\.\d+)?)\s*(.*)$/)
  const parsedNum = doseMatch ? parseFloat(doseMatch[1]) : 10
  const parsedUnit = doseMatch && doseMatch[2] ? doseMatch[2].trim() : (initialData?.doseUnit || 'mg')

  // Generate 3 clean selectable dosage chips
  const providedOptions = initialData?.doseOptions || initialData?.dose_options
  const defaultDosePresets: string[] = providedOptions && providedOptions.length > 0
    ? providedOptions
    : [
        `${Math.round(parsedNum * 0.5 * 10) / 10} ${parsedUnit}`,
        `${parsedNum} ${parsedUnit}`,
        `${Math.round(parsedNum * 2 * 10) / 10} ${parsedUnit}`
      ]

  const [selectedDose, setSelectedDose] = useState<string>(
    defaultDosePresets.includes(rawSuggestedDose) ? rawSuggestedDose : defaultDosePresets[1] || rawSuggestedDose
  )
  const [isCustomDose, setIsCustomDose] = useState<boolean>(false)
  const [customDoseInput, setCustomDoseInput] = useState<string>('')

  // 2. Interactive Cadence Options
  type CadencePreset = 'daily' | 'every_other_day' | 'mon_wed_fri' | 'three_per_week' | 'weekdays'
  const [cadencePreset, setCadencePreset] = useState<CadencePreset>(() => {
    if (initialData?.cadenceMode === 'interval' && initialData.restIntervalDays === 1) return 'every_other_day'
    if (initialData?.cadenceMode === 'days_of_week') {
      const days = initialData.selectedDays || []
      if (days.length === 3 && days.includes('Mon') && days.includes('Wed') && days.includes('Fri')) return 'mon_wed_fri'
      if (days.length === 5 && !days.includes('Sat') && !days.includes('Sun')) return 'weekdays'
    }
    return 'daily'
  })

  // 3. Interactive Circadian Timing Options
  type TimingPreset = 'morning' | 'midday' | 'evening' | 'bedtime' | 'split_am_pm'
  const [timingPreset, setTimingPreset] = useState<TimingPreset>(() => {
    const rawTiming = (initialData?.timingSlot || modality?.default_timing_slot || 'morning').toLowerCase()
    if (rawTiming.includes(',') || rawTiming.includes('&') || rawTiming.includes('split') || initialData?.splitCount === 2) {
      return 'split_am_pm'
    }
    if (rawTiming.includes('bed') || rawTiming.includes('pre_bed')) return 'bedtime'
    if (rawTiming.includes('evening') || rawTiming.includes('night')) return 'evening'
    if (rawTiming.includes('midday') || rawTiming.includes('afternoon') || rawTiming.includes('lunch')) return 'midday'
    return 'morning'
  })

  // State for submission & success
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInitiated, setIsInitiated] = useState(false)
  const [initiatedModality, setInitiatedModality] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Labels for display
  const CADENCE_LABELS: Record<CadencePreset, string> = {
    daily: 'Daily Anchor',
    every_other_day: 'Every Other Day',
    mon_wed_fri: 'Mon / Wed / Fri',
    three_per_week: '3x / Week',
    weekdays: 'Weekdays (Mon–Fri)'
  }

  const TIMING_LABELS: Record<TimingPreset, string> = {
    morning: 'Morning Stack',
    midday: 'Midday Stack',
    evening: 'Evening Stack',
    bedtime: 'Bedtime',
    split_am_pm: '2x Daily (AM & PM Split)'
  }

  const handleInitiate = async () => {
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const localUserId = user?.id || getLocalUserId()
      if (!localUserId) {
        throw new Error('User identifier not available. Please sign in or refresh.')
      }

      // 1. Resolve final dose string
      const finalDose = isCustomDose && customDoseInput.trim() 
        ? customDoseInput.trim() 
        : selectedDose

      // 2. Resolve timing string
      let primaryTiming = 'morning_supplement_stack'
      const isSupplement = category.toLowerCase().includes('supplement')
      if (timingPreset === 'morning') primaryTiming = isSupplement ? 'morning_supplement_stack' : 'morning'
      else if (timingPreset === 'midday') primaryTiming = isSupplement ? 'midday_stack' : 'midday'
      else if (timingPreset === 'evening') primaryTiming = isSupplement ? 'evening_supplement_stack' : 'evening'
      else if (timingPreset === 'bedtime') primaryTiming = 'bedtime'
      else if (timingPreset === 'split_am_pm') {
        primaryTiming = isSupplement 
          ? 'morning_supplement_stack,evening_supplement_stack' 
          : 'morning,evening'
      }

      // 3. Resolve Cadence Config
      let scheduleConfig: ModalityScheduleConfig
      if (cadencePreset === 'daily') {
        scheduleConfig = {
          schedule_mode: 'days_of_week',
          days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          timing_slot: primaryTiming,
          skip_policy: 'fixed'
        }
      } else if (cadencePreset === 'every_other_day') {
        scheduleConfig = {
          schedule_mode: 'rest_interval',
          rest_days_between: 1,
          timing_slot: primaryTiming,
          skip_policy: 'fixed'
        }
      } else if (cadencePreset === 'three_per_week') {
        scheduleConfig = {
          schedule_mode: 'rest_interval',
          rest_days_between: 2,
          timing_slot: primaryTiming,
          skip_policy: 'fixed'
        }
      } else if (cadencePreset === 'mon_wed_fri') {
        scheduleConfig = {
          schedule_mode: 'days_of_week',
          days_of_week: ['Mon', 'Wed', 'Fri'],
          timing_slot: primaryTiming,
          skip_policy: 'fixed'
        }
      } else {
        // weekdays
        scheduleConfig = {
          schedule_mode: 'days_of_week',
          days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          timing_slot: primaryTiming,
          skip_policy: 'fixed'
        }
      }

      // 4. Create or reuse modality record
      let activeMod = modality
      if (!activeMod?.id || activeMod.id.startsWith('custom_draft_temp')) {
        activeMod = await createCustomModality(localUserId, {
          name: modName.trim(),
          category,
          brief_description: briefDescription,
          default_timing_slot: primaryTiming,
          dose_or_exposure: finalDose
        })
      }

      if (!activeMod?.id) {
        throw new Error('Failed to create modality in database')
      }

      // 5. Schedule to Today
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      await addModalityOrProtocolToToday(localUserId, todayStr, activeMod.id)

      // 6. Reconcile full 30-day schedule & rest days
      await reconcileModalityScheduleAndFutureTasks(localUserId, activeMod.id, {
        scheduleConfig,
        fromDate: todayStr,
        customDose: finalDose,
        customTiming: primaryTiming,
        notes: instructions.trim() || undefined
      })

      // 7. Add to Protocol Bench
      await addToBench(localUserId, activeMod.id)
      await upsertBenchItemOverride(
        localUserId,
        activeMod.id,
        finalDose,
        primaryTiming,
        instructions.trim() || undefined
      )

      // 8. Dispatch synchronization events
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('levl_modality_created', { detail: activeMod }))
        window.dispatchEvent(new CustomEvent('levl_task_status_changed'))
        window.dispatchEvent(new CustomEvent('levl_bench_updated'))
        window.dispatchEvent(new CustomEvent('levl_schedule_updated'))
      }

      setInitiatedModality(activeMod)
      setIsInitiated(true)
      setIsSubmitting(false)

      if (onInitiateSuccess) {
        onInitiateSuccess(activeMod)
      }
    } catch (err: any) {
      console.error('Error initiating modality:', err)
      setErrorMsg(err.message || 'Failed to initiate modality.')
      setIsSubmitting(false)
    }
  }

  const handleOpenStudio = () => {
    if (!onOpenStudio) return
    const finalDose = isCustomDose && customDoseInput.trim() ? customDoseInput.trim() : selectedDose
    onOpenStudio({
      id: modality?.id,
      name: modName,
      category,
      headlineBenefit,
      instructions,
      doseAmount: finalDose,
      doseUnit: parsedUnit,
      timingSlot: timingPreset,
      cadenceMode: cadencePreset === 'daily' ? 'daily' : cadencePreset === 'every_other_day' ? 'interval' : 'days_of_week',
      selectedDays: cadencePreset === 'mon_wed_fri' ? ['Mon', 'Wed', 'Fri'] : cadencePreset === 'weekdays' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] : ['Mon', 'Wed', 'Fri'],
      restIntervalDays: cadencePreset === 'every_other_day' ? 1 : 2,
      scheduleToToday: true,
      saveToBench: true
    })
  }

  return (
    <div className="mt-4 max-w-xl w-full bg-slate-950/95 border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl space-y-4 transition-all duration-300">
      {/* Top Header Badge & Category */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300">
              {category}
            </span>
            
            {isInitiated ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/40 px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.25)]">
                <CheckCircle2 size={11} /> Initiated & Scheduled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                <Sparkles size={11} className="text-amber-400" /> AI Draft Proposal
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            {modName}
          </h3>
        </div>

        <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 shadow-inner">
          <Sparkles size={18} />
        </div>
      </div>

      {/* Comprehensive Brief Description & Mechanism Box */}
      <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800/90 space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
          <BookOpen size={12} /> Biological Mechanism & Longevity Purpose
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-normal">
          {briefDescription}
        </p>

        {headlineBenefit && headlineBenefit !== briefDescription && (
          <div className="text-[11px] text-slate-400 flex items-baseline gap-1 pt-0.5">
            <span className="font-semibold text-purple-300/90 shrink-0">Target Benefit:</span>
            <span>{headlineBenefit}</span>
          </div>
        )}

        {instructions && (
          <div className="text-[11px] text-amber-300 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20 mt-1 flex items-start gap-1.5">
            <span className="font-bold text-amber-400 shrink-0">Protocol Note:</span>
            <span className="leading-snug">{instructions}</span>
          </div>
        )}
      </div>

      {!isInitiated ? (
        <>
          {/* 1. Selectable Dosage Buttons */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Pill size={12} className="text-amber-400" /> Select Dosage Amount
              </span>
              {isCustomDose && (
                <button 
                  type="button" 
                  onClick={() => setIsCustomDose(false)}
                  className="text-[10px] text-purple-400 hover:text-purple-300 font-medium underline cursor-pointer"
                >
                  Presets
                </button>
              )}
            </div>

            {!isCustomDose ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {defaultDosePresets.map(preset => {
                  const isActive = selectedDose === preset
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSelectedDose(preset)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-900/40 ring-2 ring-purple-500/30'
                          : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-purple-500/40 hover:text-white'
                      }`}
                    >
                      {isActive && <Check size={12} className="text-white" />}
                      <span>{preset}</span>
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomDose(true)
                    setCustomDoseInput(selectedDose)
                  }}
                  className="py-1.5 px-2.5 rounded-xl text-xs font-semibold border border-dashed border-slate-700 bg-slate-900/50 text-slate-400 hover:text-white hover:border-purple-500/40 transition-all cursor-pointer"
                >
                  Custom
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customDoseInput}
                  onChange={e => setCustomDoseInput(e.target.value)}
                  placeholder="e.g. 15 mg, 500 mcg, 20 mins"
                  className="flex-1 bg-slate-900 border border-purple-500/40 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsCustomDose(false)}
                  className="py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Set
                </button>
              </div>
            )}
          </div>

          {/* 2. Selectable Cadence Schedule Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar size={12} className="text-sky-400" /> Cadence Schedule
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['daily', 'every_other_day', 'mon_wed_fri', 'three_per_week', 'weekdays'] as CadencePreset[]).map(preset => {
                const isActive = cadencePreset === preset
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCadencePreset(preset)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-900/40 ring-2 ring-sky-500/30'
                        : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-sky-500/40 hover:text-white'
                    }`}
                  >
                    {isActive && <Check size={12} className="text-white" />}
                    <span>{CADENCE_LABELS[preset]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3. Selectable Circadian Timing Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock size={12} className="text-purple-400" /> Circadian Timing Slot
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['morning', 'midday', 'evening', 'bedtime', 'split_am_pm'] as TimingPreset[]).map(preset => {
                const isActive = timingPreset === preset
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTimingPreset(preset)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-900/40 ring-2 ring-indigo-500/30'
                        : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-indigo-500/40 hover:text-white'
                    }`}
                  >
                    {isActive && <Check size={12} className="text-white" />}
                    <span>{TIMING_LABELS[preset]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {errorMsg && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Primary Action Button: Initiate Modality */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <button
              type="button"
              onClick={handleInitiate}
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-extrabold shadow-lg shadow-purple-900/40 hover:shadow-purple-700/60 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] border border-purple-400/30"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin text-purple-200" />
                  <span>Initiating & Scheduling Across 30 Days...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} className="text-purple-200" />
                  <span>Initiate Modality</span>
                </>
              )}
            </button>

            {onOpenStudio && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleOpenStudio}
                  className="text-[11px] text-slate-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <Sliders size={11} />
                  <span>Dial in advanced studio parameters (biomarker correlations, pulse cycles)</span>
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Confirmed State */
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 space-y-3 shadow-inner">
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
            <CheckCircle2 size={17} className="text-emerald-400 shrink-0" />
            <span>Modality Successfully Initiated & Scheduled!</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1">
            <div className="p-2 rounded-lg bg-slate-900/90 border border-emerald-500/20">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Confirmed Dose</span>
              <span className="text-xs font-bold text-white mt-0.5 block">
                {isCustomDose && customDoseInput ? customDoseInput : selectedDose}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/90 border border-emerald-500/20">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cadence</span>
              <span className="text-xs font-bold text-white mt-0.5 block">
                {CADENCE_LABELS[cadencePreset]}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/90 border border-emerald-500/20">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Circadian Timing</span>
              <span className="text-xs font-bold text-white mt-0.5 block">
                {TIMING_LABELS[timingPreset]}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Active tasks have been generated on your Today timeline and synchronized across future schedule dates.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => router.push('/today')}
              className="flex-1 py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-900/30 cursor-pointer"
            >
              <span>View on Today Timeline</span>
              <ArrowRight size={13} />
            </button>

            <button
              type="button"
              onClick={() => router.push('/bench')}
              className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>Protocol Bench</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
