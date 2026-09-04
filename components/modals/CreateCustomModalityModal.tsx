'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, Sparkles, Plus, Clock, Pill, BookOpen, Bookmark, Calendar, 
  Check, ArrowRight, ArrowLeft, Layers, ShieldCheck, Flame, 
  Moon, Dumbbell, Brain, Activity, Droplets, Sun, Wind, Tag, FileText, CheckCircle2 
} from 'lucide-react'
import { 
  createCustomModality, 
  updateModalityDraft,
  addModalityOrProtocolToToday, 
  addToBench, 
  reconcileModalityScheduleAndFutureTasks, 
  upsertBenchItemOverride,
  ModalityScheduleConfig 
} from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import ModalityIcon from '@/components/ui/ModalityIcon'
import { assessModalityOrProtocol, ICON_COLOR_PRESETS, AVAILABLE_ICONS } from '@/lib/utils/iconAssessmentEngine'

export interface CustomModalityInitialData {
  id?: string
  name?: string
  category?: string
  headlineBenefit?: string
  instructions?: string
  sourceUrl?: string
  doseAmount?: string
  doseUnit?: string
  adminContext?: string
  timingSlot?: string
  splitCount?: 1 | 2 | 3
  splitEveningSlot?: string
  cadenceMode?: 'daily' | 'days_of_week' | 'interval' | 'pulse'
  selectedDays?: string[]
  restIntervalDays?: number
  pulseWeeksOn?: number
  pulseWeeksOff?: number
  selectedOutcomes?: string[]
  scheduleToToday?: boolean
  saveToBench?: boolean
  startTab?: 'basics' | 'dosing' | 'cadence'
}

interface CreateCustomModalityModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: (modality: any) => void
  initialData?: CustomModalityInitialData | null
}

const CATEGORIES = [
  { name: 'Supplements', icon: Pill, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { name: 'Peptides', icon: Sparkles, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { name: 'Thermal', icon: Flame, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  { name: 'Fitness', icon: Dumbbell, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  { name: 'Sleep', icon: Moon, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  { name: 'Nootropics', icon: Brain, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { name: 'Nutrition', icon: Droplets, color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
  { name: 'Mindfulness', icon: Wind, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { name: 'Light Therapy', icon: Sun, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  { name: 'Other', icon: Layers, color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' }
]

const DOSE_UNITS = ['mg', 'g', 'mcg', 'IU', 'mins', 'tbsp', 'drops', 'ml', 'units', 'scoops', 'capsules']

const ADMIN_CONTEXTS = [
  'With fatty meal',
  'Empty stomach upon waking',
  'Pre-workout (30-45m)',
  'Post-workout with protein',
  '90m after waking (caffeine delay)',
  '30m before bedtime',
  'Split morning & evening'
]

const TIMING_SLOTS = [
  { value: 'waking', label: 'Waking (First 30m)' },
  { value: 'morning_routine', label: 'Morning Routine' },
  { value: 'morning', label: 'Morning' },
  { value: 'morning_supplement_stack', label: 'Morning Supplement Stack' },
  { value: 'first_meal', label: 'First Meal / Breakfast' },
  { value: 'midday', label: 'Midday / Lunch' },
  { value: 'midday_stack', label: 'Midday Stack' },
  { value: 'afternoon', label: 'Afternoon / Workout' },
  { value: 'late_afternoon', label: 'Late Afternoon' },
  { value: 'post_meal', label: 'Post Meal' },
  { value: 'evening', label: 'Evening / Dinner' },
  { value: 'evening_supplement_stack', label: 'Evening Supplement Stack' },
  { value: 'wind_down', label: 'Evening Wind-Down' },
  { value: 'bedtime', label: 'Bedtime (30m before sleep)' },
  { value: 'anytime', label: 'Anytime' }
]

const DAYS_OF_WEEK = [
  { short: 'Mon', label: 'M' },
  { short: 'Tue', label: 'T' },
  { short: 'Wed', label: 'W' },
  { short: 'Thu', label: 'T' },
  { short: 'Fri', label: 'F' },
  { short: 'Sat', label: 'S' },
  { short: 'Sun', label: 'S' }
]

const OUTCOME_TARGETS = [
  { id: 'energy', label: 'Energy & Vitality' },
  { id: 'sleep_quality', label: 'Sleep & REM Depth' },
  { id: 'muscle_mass', label: 'Muscle & Strength' },
  { id: 'cognitive_performance', label: 'Focus & Cognition' },
  { id: 'stress_resilience', label: 'Stress & Autonomic Tone' },
  { id: 'cardiovascular_health', label: 'Cardiovascular / VO2' },
  { id: 'overall_longevity', label: 'Long-term Healthspan' }
]

type StudioTab = 'basics' | 'dosing' | 'cadence'

export default function CreateCustomModalityModal({
  isOpen,
  onClose,
  onCreated,
  initialData
}: CreateCustomModalityModalProps) {
  const { localUserId: authUserId } = useAuth()
  const localUserId = authUserId || getLocalUserId()

  const [activeTab, setActiveTab] = useState<StudioTab>(initialData?.startTab || 'basics')

  // Tab 1: Basics
  const [name, setName] = useState(initialData?.name || '')
  const [category, setCategory] = useState(initialData?.category || 'Supplements')
  const [headlineBenefit, setHeadlineBenefit] = useState(initialData?.headlineBenefit || '')
  const [instructions, setInstructions] = useState(initialData?.instructions || '')
  const [sourceUrl, setSourceUrl] = useState(initialData?.sourceUrl || '')

  // Tab 2: Dosing & Timing
  const [doseAmount, setDoseAmount] = useState(initialData?.doseAmount || '')
  const [doseUnit, setDoseUnit] = useState(initialData?.doseUnit || 'mg')
  const [adminContext, setAdminContext] = useState(initialData?.adminContext || '')
  const [timingSlot, setTimingSlot] = useState(initialData?.timingSlot || 'morning_supplement_stack')
  const [splitCount, setSplitCount] = useState<1 | 2 | 3>(initialData?.splitCount || 1)
  const [splitEveningSlot, setSplitEveningSlot] = useState(initialData?.splitEveningSlot || 'evening_supplement_stack')

  // Tab 3: Cadence & Outcomes
  const [cadenceMode, setCadenceMode] = useState<'daily' | 'days_of_week' | 'interval' | 'pulse'>(initialData?.cadenceMode || 'daily')
  const [selectedDays, setSelectedDays] = useState<string[]>(initialData?.selectedDays || ['Mon', 'Wed', 'Fri'])
  const [restIntervalDays, setRestIntervalDays] = useState(initialData?.restIntervalDays ?? 1) // Every other day
  const [pulseWeeksOn, setPulseWeeksOn] = useState(initialData?.pulseWeeksOn ?? 2)
  const [pulseWeeksOff, setPulseWeeksOff] = useState(initialData?.pulseWeeksOff ?? 2)
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>(initialData?.selectedOutcomes || ['energy'])

  // Routing
  const [scheduleToToday, setScheduleToToday] = useState(initialData?.scheduleToToday ?? true)
  const [saveToBench, setSaveToBench] = useState(initialData?.saveToBench ?? true)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Icon & Color Assessment State
  const [assessedIcon, setAssessedIcon] = useState<string>('Target')
  const [assessedColor, setAssessedColor] = useState<string>('#38BDF8')
  const [isExistingMatch, setIsExistingMatch] = useState<boolean>(false)
  const [matchReason, setMatchReason] = useState<string>('')
  const [userCustomizedIcon, setUserCustomizedIcon] = useState<boolean>(false)

  // Real-time assessment of icon and color
  useEffect(() => {
    if (userCustomizedIcon) return
    const assessment = assessModalityOrProtocol({
      name,
      category,
      description: headlineBenefit || instructions,
      outcomes: selectedOutcomes,
      type: 'modality'
    })
    setAssessedIcon(assessment.iconName)
    setAssessedColor(assessment.colorHex)
    setIsExistingMatch(assessment.isExistingMatch)
    setMatchReason(assessment.matchReason)
  }, [name, category, headlineBenefit, instructions, selectedOutcomes, userCustomizedIcon])

  // Hydrate fields whenever initialData changes and modal opens
  useEffect(() => {
    if (initialData && isOpen) {
      if (initialData.name) setName(initialData.name)
      if (initialData.category) setCategory(initialData.category)
      if (initialData.headlineBenefit) setHeadlineBenefit(initialData.headlineBenefit)
      if (initialData.instructions) setInstructions(initialData.instructions)
      if (initialData.sourceUrl) setSourceUrl(initialData.sourceUrl)
      if (initialData.doseAmount !== undefined) setDoseAmount(initialData.doseAmount)
      if (initialData.doseUnit) setDoseUnit(initialData.doseUnit)
      if (initialData.adminContext !== undefined) setAdminContext(initialData.adminContext)
      if (initialData.timingSlot) setTimingSlot(initialData.timingSlot)
      if (initialData.splitCount) setSplitCount(initialData.splitCount)
      if (initialData.splitEveningSlot) setSplitEveningSlot(initialData.splitEveningSlot)
      if (initialData.cadenceMode) setCadenceMode(initialData.cadenceMode)
      if (initialData.selectedDays && initialData.selectedDays.length > 0) setSelectedDays(initialData.selectedDays)
      if (initialData.restIntervalDays !== undefined) setRestIntervalDays(initialData.restIntervalDays)
      if (initialData.pulseWeeksOn !== undefined) setPulseWeeksOn(initialData.pulseWeeksOn)
      if (initialData.pulseWeeksOff !== undefined) setPulseWeeksOff(initialData.pulseWeeksOff)
      if (initialData.selectedOutcomes) setSelectedOutcomes(initialData.selectedOutcomes)
      if (initialData.scheduleToToday !== undefined) setScheduleToToday(initialData.scheduleToToday)
      if (initialData.saveToBench !== undefined) setSaveToBench(initialData.saveToBench)
      if (initialData.startTab) setActiveTab(initialData.startTab)
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? (prev.length > 1 ? prev.filter(d => d !== day) : prev)
        : [...prev, day]
    )
  }

  const toggleOutcome = (outcomeId: string) => {
    setSelectedOutcomes(prev =>
      prev.includes(outcomeId)
        ? prev.filter(o => o !== outcomeId)
        : [...prev, outcomeId]
    )
  }

  // Format combined dose string
  const formattedDoseString = () => {
    const rawAmt = doseAmount.trim()
    if (!rawAmt) return ''
    let res = `${rawAmt}${doseUnit ? ' ' + doseUnit : ''}`
    if (adminContext) {
      res += ` (${adminContext})`
    }
    if (splitCount > 1) {
      res += ` • ${splitCount}x daily split`
    }
    return res
  }

  const handleNextTab = () => {
    if (activeTab === 'basics') {
      if (!name.trim()) {
        setErrorMsg('Please enter a modality name.')
        return
      }
      setErrorMsg('')
      setActiveTab('dosing')
    } else if (activeTab === 'dosing') {
      setActiveTab('cadence')
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!name.trim()) {
      setActiveTab('basics')
      setErrorMsg('Please enter a modality name.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const finalDose = formattedDoseString()
      const primaryTiming = splitCount === 2 ? `${timingSlot},${splitEveningSlot}` : timingSlot

      let createdMod: any = null

      // If editing/fine-tuning an existing draft modality
      if (initialData?.id) {
        createdMod = await updateModalityDraft(initialData.id, {
          name: name.trim(),
          display_name: name.trim(),
          category,
          dose_or_exposure: finalDose || undefined,
          default_timing_slot: primaryTiming,
          brief_description: headlineBenefit.trim() || instructions.trim() || 'Custom user-created protocol modality',
          headline_benefit: headlineBenefit.trim() || undefined,
          instructions: instructions.trim() || undefined,
          source_url: sourceUrl.trim() || undefined,
          icon: assessedIcon,
          icon_name: assessedIcon,
          color_hex: assessedColor
        })
      }

      // If new, create in database
      if (!createdMod) {
        createdMod = await createCustomModality(localUserId, {
          name: name.trim(),
          category,
          dose_or_exposure: finalDose || undefined,
          default_timing_slot: primaryTiming,
          brief_description: headlineBenefit.trim() || instructions.trim() || 'Custom user-created protocol modality',
          icon: assessedIcon,
          icon_name: assessedIcon,
          color_hex: assessedColor
        })
      }

      if (!createdMod) {
        throw new Error('Failed to create modality in database')
      }

      // Build schedule config
      const scheduleConfig: ModalityScheduleConfig = {
        schedule_mode: cadenceMode === 'days_of_week' 
          ? 'days_of_week' 
          : (cadenceMode === 'interval' ? 'rest_interval' : 'days_of_week'),
        days_of_week: cadenceMode === 'days_of_week' 
          ? selectedDays 
          : (cadenceMode === 'daily' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : undefined),
        rest_days_between: cadenceMode === 'interval' ? restIntervalDays : undefined,
        timing_slot: primaryTiming,
        skip_policy: 'fixed'
      }

      // 1. Add to Today if scheduled
      if (scheduleToToday) {
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        await addModalityOrProtocolToToday(localUserId, todayStr, createdMod.id)

        // Always reconcile schedule, update custom dose and circadian timing slot across all active future dates
        await reconcileModalityScheduleAndFutureTasks(localUserId, createdMod.id, {
          scheduleConfig,
          fromDate: todayStr,
          customDose: finalDose,
          customTiming: primaryTiming,
          notes: instructions.trim() || undefined
        })
      }

      // 2. Add to Protocol Bench
      if (saveToBench) {
        await addToBench(localUserId, createdMod.id)
        await upsertBenchItemOverride(
          localUserId, 
          createdMod.id, 
          finalDose, 
          primaryTiming, 
          instructions.trim() || undefined
        )
      }

      // Notify other views
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('levl_modality_created', { detail: createdMod }))
        window.dispatchEvent(new CustomEvent('levl_task_status_changed'))
        window.dispatchEvent(new CustomEvent('levl_bench_updated'))
        window.dispatchEvent(new CustomEvent('levl_schedule_updated'))
      }

      setSuccessMsg('Modality created and scheduled successfully!')
      if (onCreated) onCreated(createdMod)

      setTimeout(() => {
        setIsSubmitting(false)
        setSuccessMsg('')
        onClose()
      }, 700)
    } catch (err: any) {
      console.error('Error in custom modality studio:', err)
      setErrorMsg(err.message || 'An error occurred while saving your custom modality.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-950/80 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <Sparkles size={17} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">
                  {initialData?.id ? 'Dial In Modality Studio' : 'Create Custom Modality'}
                </h2>
                <p className="text-xs text-slate-400">
                  {initialData?.id ? 'Fine-tune dosing, circadian timing, and cadence recurrence' : 'Configure dosing, circadian timing, and cadence recurrence'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 p-1 bg-slate-950 border border-slate-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('basics')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'basics'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>1. Basics</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dosing')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'dosing'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>2. Dosing & Timing</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cadence')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'cadence'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>3. Cadence & Goals</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} />
              {successMsg}
            </div>
          )}

          {/* TAB 1: BASICS & CATEGORY */}
          {activeTab === 'basics' && (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Modality Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tongkat Ali 400mg, Zone 2 Ruck Walk, Red Light (660nm)"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>

              {/* Category Grid */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon
                    const isSelected = category === cat.name
                    return (
                      <button
                        type="button"
                        key={cat.name}
                        onClick={() => setCategory(cat.name)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500/20 border-sky-500/60 text-white shadow-md shadow-sky-500/10'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <Icon size={16} className={isSelected ? 'text-sky-300' : 'text-slate-400'} />
                        <span className="text-xs font-medium truncate">{cat.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Smart Icon & Visual Identity Assessment */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3 relative overflow-hidden shadow-inner">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Icon & Color Assessment</span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border flex items-center gap-1 ${
                    isExistingMatch 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  }`}>
                    {isExistingMatch ? '⚡ Matched Existing Icon' : '✨ Assigned New Distinct Icon'}
                  </span>
                </div>

                <div className="flex items-center gap-3.5 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                  {/* Glowing live icon preview */}
                  <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center border border-white/10 shrink-0 shadow-inner">
                    <ModalityIcon customIcon={assessedIcon} customColor={assessedColor} size={26} glow={true} isIgnited={true} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">{assessedIcon}</span>
                      <span className="w-3 h-3 rounded-full border border-white/30 shrink-0 shadow-sm" style={{ backgroundColor: assessedColor }} />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{matchReason || 'Intelligently assessed from title and physiological category.'}</p>
                  </div>

                  {userCustomizedIcon && (
                    <button
                      type="button"
                      onClick={() => setUserCustomizedIcon(false)}
                      className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold underline shrink-0 cursor-pointer"
                    >
                      Reset Auto
                    </button>
                  )}
                </div>

                {/* Color Swatches */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Accent Color Theme
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ICON_COLOR_PRESETS.map((p) => {
                      const isSelected = assessedColor === p.hex
                      return (
                        <button
                          type="button"
                          key={p.hex}
                          onClick={() => {
                            setAssessedColor(p.hex)
                            setUserCustomizedIcon(true)
                          }}
                          className={`w-6 h-6 rounded-lg transition-transform cursor-pointer border ${
                            isSelected ? 'scale-125 border-white ring-2 ring-white/30 z-10' : 'border-transparent hover:scale-110 opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: p.hex }}
                          title={p.label}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Change Icon Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Assigned Icon
                  </label>
                  <select
                    value={assessedIcon}
                    onChange={(e) => {
                      setAssessedIcon(e.target.value)
                      setUserCustomizedIcon(true)
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <optgroup label="Existing System Glyphs">
                      {AVAILABLE_ICONS.filter(i => i.category === 'existing').map(i => (
                        <option key={i.name} value={i.name}>{i.label} - {i.description}</option>
                      ))}
                    </optgroup>
                    <optgroup label="New Distinct Icons">
                      {AVAILABLE_ICONS.filter(i => i.category === 'new').map(i => (
                        <option key={i.name} value={i.name}>{i.label} - {i.description}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Headline Benefit */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Primary Headline Benefit
                </label>
                <input
                  type="text"
                  value={headlineBenefit}
                  onChange={(e) => setHeadlineBenefit(e.target.value)}
                  placeholder="e.g. Optimizes free testosterone and sustained daytime energy"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>

              {/* Instructions & Synergy Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Administration & Synergy Instructions
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Cycle 5 days on / 2 days off. Take with dietary fat for optimal bioavailability."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none transition-all resize-none"
                />
              </div>

              {/* PubMed Link */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  PubMed / Research Citation URL (Optional)
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://pubmed.ncbi.nlm.nih.gov/..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* TAB 2: DOSING & TIMING */}
          {activeTab === 'dosing' && (
            <div className="space-y-5">
              {/* Dose Quantity & Units */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Dose Quantity & Unit
                </label>
                <div className="flex gap-2 mb-2.5">
                  <input
                    type="text"
                    value={doseAmount}
                    onChange={(e) => setDoseAmount(e.target.value)}
                    placeholder="e.g. 400, 2.5, 20"
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  />
                  <div className="w-28 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white flex items-center justify-center font-mono font-semibold">
                    {doseUnit}
                  </div>
                </div>

                {/* Unit Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {DOSE_UNITS.map((u) => (
                    <button
                      type="button"
                      key={u}
                      onClick={() => setDoseUnit(u)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                        doseUnit === u
                          ? 'bg-sky-500 text-white font-bold shadow-sm'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Administration Context */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Administration Context / Rule
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {ADMIN_CONTEXTS.map((ctx) => (
                    <button
                      type="button"
                      key={ctx}
                      onClick={() => setAdminContext(adminContext === ctx ? '' : ctx)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                        adminContext === ctx
                          ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-medium'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {ctx}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={adminContext}
                  onChange={(e) => setAdminContext(e.target.value)}
                  placeholder="Or type custom rule (e.g. with 500ml water)"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>

              {/* Circadian Timing Slot */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Circadian Timing Slot
                </label>
                <select
                  value={timingSlot}
                  onChange={(e) => setTimingSlot(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-all cursor-pointer"
                >
                  {TIMING_SLOTS.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Multi-Dose Split Sessions */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Daily Frequency & Split Dosing
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSplitCount(1)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      splitCount === 1
                        ? 'bg-sky-500/20 border-sky-500/60 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    1x Daily (Single)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitCount(2)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      splitCount === 2
                        ? 'bg-sky-500/20 border-sky-500/60 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    2x Daily (Split)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitCount(3)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      splitCount === 3
                        ? 'bg-sky-500/20 border-sky-500/60 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    3x Daily (TID)
                  </button>
                </div>

                {splitCount === 2 && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Second Dose Timing Slot:
                    </label>
                    <select
                      value={splitEveningSlot}
                      onChange={(e) => setSplitEveningSlot(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    >
                      {TIMING_SLOTS.map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CADENCE, SCHEDULE & GOALS */}
          {activeTab === 'cadence' && (
            <div className="space-y-5">
              {/* Cadence Recurrence Pattern */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Schedule Cadence Pattern
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {[
                    { id: 'daily', label: 'Every Day' },
                    { id: 'days_of_week', label: 'Specific Days' },
                    { id: 'interval', label: 'Rest Interval' },
                    { id: 'pulse', label: 'Cycle / Pulse' }
                  ].map((pat) => (
                    <button
                      type="button"
                      key={pat.id}
                      onClick={() => setCadenceMode(pat.id as any)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition-all text-center cursor-pointer ${
                        cadenceMode === pat.id
                          ? 'bg-sky-500/20 border-sky-500/60 text-white font-semibold shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pat.label}
                    </button>
                  ))}
                </div>

                {/* Days of week selector */}
                {cadenceMode === 'days_of_week' && (
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="text-xs text-slate-300 font-medium">Select Active Days:</div>
                    <div className="flex gap-1.5">
                      {DAYS_OF_WEEK.map((d) => {
                        const isSelected = selectedDays.includes(d.short)
                        return (
                          <button
                            type="button"
                            key={d.short}
                            onClick={() => toggleDay(d.short)}
                            className={`flex-1 h-9 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {d.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Rest interval selector */}
                {cadenceMode === 'interval' && (
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="text-xs text-slate-300 font-medium">Rest Days Between Sessions:</div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4].map((n) => (
                        <button
                          type="button"
                          key={n}
                          onClick={() => setRestIntervalDays(n)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            restIntervalDays === n
                              ? 'bg-sky-500 text-white'
                              : 'bg-slate-900 border border-slate-800 text-slate-400'
                          }`}
                        >
                          Every {n + 1} Days
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pulsed Cycle */}
                {cadenceMode === 'pulse' && (
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="text-xs text-slate-300 font-medium">Cycle Protocol:</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                        2 Weeks Active
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                        2 Weeks Washout
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Target Longevity Outcomes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Target Longevity Outcomes
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {OUTCOME_TARGETS.map((out) => {
                    const isSelected = selectedOutcomes.includes(out.id)
                    return (
                      <button
                        type="button"
                        key={out.id}
                        onClick={() => toggleOutcome(out.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {out.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Routing Checkboxes */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 cursor-pointer hover:bg-slate-950/80 transition-all">
                  <input
                    type="checkbox"
                    checked={scheduleToToday}
                    onChange={(e) => setScheduleToToday(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-slate-900 border-slate-700"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-white flex items-center gap-1.5">
                      <Calendar size={13} className="text-sky-400" />
                      Schedule on Active Calendar Days (Starting Today)
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Creates tasks on your Today dashboard and future scheduled days
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 cursor-pointer hover:bg-slate-950/80 transition-all">
                  <input
                    type="checkbox"
                    checked={saveToBench}
                    onChange={(e) => setSaveToBench(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-slate-900 border-slate-700"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-white flex items-center gap-1.5">
                      <Bookmark size={13} className="text-amber-400" />
                      Pin to Protocol Bench
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Saves this modality to your active bench for quick access
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-5 py-3.5 border-t border-slate-800/80 bg-slate-950/90 shrink-0 flex items-center justify-between">
          <div>
            {activeTab !== 'basics' && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'cadence' ? 'dosing' : 'basics')}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={14} />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {activeTab !== 'cadence' ? (
              <button
                type="button"
                onClick={handleNextTab}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                Continue
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting || !name.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Check size={14} />
                    {initialData?.id ? 'Update & Schedule Modality' : 'Create Modality'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
