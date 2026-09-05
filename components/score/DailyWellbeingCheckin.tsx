'use client'

import { useState, useEffect, useMemo } from 'react'
import { DailyWellbeingCheckin as WellbeingType, UserProfile, OutcomeDimension } from '@/lib/types'
import { isFuture, isPast, isSameDay, format } from 'date-fns'
import { getOutcomeColorConfig, getNeutralOutcomeColorConfig } from '@/lib/utils/outcomeColors'
import { getRecentOutcomeSnapshot, getLatestOutcomeLiveState, OutcomeLiveState } from '@/lib/utils/outcomeRecency'
import { Moon, Sliders, ChevronUp, ChevronDown, Leaf, Clock, Utensils, Coffee, Smartphone, Sun, Sunrise, Sparkles, ArrowUpRight, ArrowDownRight, ArrowDown, Radio, Activity, FileText, CloudSun, RefreshCw, Briefcase, Users, Target, CheckCircle2, Zap } from 'lucide-react'
import CustomizeCheckinOutcomesModal from '@/components/modals/CustomizeCheckinOutcomesModal'
import QuickOutcomeUpdateModal from '@/components/modals/QuickOutcomeUpdateModal'
import { safeLocalStorageSet } from '@/lib/utils/storage'
import UnifiedVoiceBar, { ParsedVoiceCheckinData } from '@/components/voice/UnifiedVoiceBar'
import MindfulReflectionPrompt from '@/components/mindfulness/MindfulReflectionPrompt'
import { getStoredCustomOutcomes } from '@/lib/data'
import { fetchCurrentWeather, getCachedWeather, LocalWeatherData } from '@/lib/services/weatherService'
import { ExternalConfounderData } from '@/lib/types'

function calculateHoursBeforeBedFromTime(timeStr: string, idealBedtime: string = '22:30'): number {
  const [h, m] = timeStr.split(':').map(Number)
  const [bedH, bedM] = idealBedtime.split(':').map(Number)
  
  let eventMins = (h || 0) * 60 + (m || 0)
  let bedMins = (bedH || 22) * 60 + (bedM || 30)

  if (bedMins <= eventMins) {
    bedMins += 24 * 60
  }

  const diffMins = bedMins - eventMins
  const diffHours = Math.max(0, Math.round((diffMins / 60) * 2) / 2)
  return diffHours
}

function parseTimeToMinutes(t: string): number {
  if (!t || !t.includes(':')) return 0
  const [h, m] = t.split(':').map(Number)
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m)
}

function formatMinutesToTime(totalMins: number): string {
  let normalized = Math.round(totalMins) % (24 * 60)
  if (normalized < 0) normalized += 24 * 60
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function formatMinutesToDuration(totalMins: number): string {
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function formatTimeTo12h(timeStr: string): string {
  if (!timeStr || !timeStr.includes(':')) return timeStr
  const [hStr, mStr] = timeStr.split(':')
  let h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`
}

function computeSleepMinutes(bedStr: string, wakeStr: string): number {
  const bM = parseTimeToMinutes(bedStr)
  const wM = parseTimeToMinutes(wakeStr)
  let diff = wM - bM
  if (diff <= 0) diff += 24 * 60
  return diff
}

function TimingExposureCard({
  title,
  icon,
  value,
  onChange,
  type,
  idealBedtime = '22:30',
  theme = 'indigo'
}: {
  title: string
  icon: string
  value: string
  onChange: (val: string) => void
  type: 'caffeine' | 'screen' | 'meal'
  idealBedtime?: string
  theme?: 'indigo' | 'rose'
}) {
  const isExplicitHours = value !== 'skip' && !value.startsWith('time:') && !isNaN(parseFloat(value))
  const [inputMode, setInputMode] = useState<'hours' | 'time'>(isExplicitHours ? 'hours' : 'time')
  const defaultExactTime = type === 'meal' ? '19:30' : type === 'caffeine' ? '14:00' : '21:30'
  const [exactTimeVal, setExactTimeVal] = useState(
    value.startsWith('time:') 
      ? value.replace('time:', '') 
      : defaultExactTime
  )

  useEffect(() => {
    if (value.startsWith('time:')) {
      setInputMode('time')
      setExactTimeVal(value.replace('time:', ''))
    } else if (value !== 'skip' && !isNaN(parseFloat(value))) {
      setInputMode('hours')
    } else {
      setInputMode('time')
    }
  }, [value])

  const currentHours = useMemo(() => {
    if (value === 'skip' || value === 'none') return null
    if (value.startsWith('time:')) {
      return calculateHoursBeforeBedFromTime(value.replace('time:', ''), idealBedtime)
    }
    const parsed = parseFloat(value)
    return isNaN(parsed) ? null : parsed
  }, [value, idealBedtime])

  const riskBadge = useMemo(() => {
    if (value === 'skip') return null
    if (value === 'none') {
      return { text: 'Optimal (None / Cut off early)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' }
    }
    if (currentHours === null) return null

    if (type === 'caffeine') {
      if (currentHours >= 10) return { text: `${currentHours}h before bed • 🟢 Optimal Clearance`, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' }
      if (currentHours >= 7) return { text: `${currentHours}h before bed • 🟡 Moderate Clearance`, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' }
      return { text: `${currentHours}h before bed • 🔴 High Sleep Disruption Risk`, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30 font-bold' }
    }

    if (type === 'screen') {
      if (currentHours >= 2.0) return { text: `${currentHours}h before bed • 🟢 Optimal (Melatonin Intact)`, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' }
      if (currentHours >= 1.0) return { text: `${currentHours}h before bed • 🟡 Moderate Blue Light`, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' }
      return { text: `${currentHours}h before bed • 🔴 Suppresses Melatonin`, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30 font-bold' }
    }

    if (type === 'meal') {
      if (currentHours >= 3.0) return { text: `${currentHours}h before bed • 🟢 Optimal Fasting & Deep Sleep`, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' }
      if (currentHours >= 2.0) return { text: `${currentHours}h before bed • 🟡 Moderate Digestion`, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' }
      return { text: `${currentHours}h before bed • 🔴 Elevates Nightly Resting HR`, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30 font-bold' }
    }

    return null
  }, [value, currentHours, type])

  return (
    <div className="bg-black/40 p-2.5 rounded-lg border border-white/10 space-y-1.5 text-xs">
      <div className="flex items-center justify-between gap-1">
        <label className="font-bold text-white flex items-center gap-1.5 truncate">
          <span>{icon}</span>
          <span className="truncate">{title}</span>
        </label>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setInputMode('time')
              if (!value.startsWith('time:')) onChange(`time:${exactTimeVal}`)
            }}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
              inputMode === 'time' 
                ? theme === 'rose' ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' : 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Exact Time
          </button>
          <button
            type="button"
            onClick={() => {
              setInputMode('hours')
              if (value.startsWith('time:')) {
                const hrs = calculateHoursBeforeBedFromTime(value.replace('time:', ''), idealBedtime)
                onChange(hrs.toFixed(1))
              }
            }}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
              inputMode === 'hours' 
                ? theme === 'rose' ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' : 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Hrs Before Bed
          </button>
        </div>
      </div>

      {inputMode === 'hours' ? (
        <select
          value={value.startsWith('time:') ? 'exact_time' : value}
          onChange={(e) => {
            if (e.target.value === 'exact_time') {
              setInputMode('time')
              onChange(`time:${exactTimeVal}`)
            } else {
              onChange(e.target.value)
            }
          }}
          className={`w-full bg-black/80 border border-white/20 rounded-lg p-2 pr-7 text-white text-xs focus:outline-none ${theme === 'rose' ? 'focus:border-rose-400' : 'focus:border-indigo-400'} cursor-pointer font-medium`}
        >
          <option value="skip">-- Skip / Not Tracked --</option>
          <option value="none">
            {type === 'caffeine' ? 'None Today / Cut off >12h before bed' : type === 'screen' ? 'Screen-Free Evening (>3h before bed)' : 'Fasted Evening (>4h before bed)'}
          </option>
          
          {type === 'caffeine' && (
            <>
              <option value="12.0">12.0+ hrs before bed (Optimal)</option>
              <option value="10.0">10.0 hrs before bed (Huberman threshold)</option>
              <option value="8.0">8.0 hrs before bed</option>
              <option value="6.0">6.0 hrs before bed</option>
              <option value="5.0">5.0 hrs before bed</option>
              <option value="4.0">4.0 hrs before bed (Late)</option>
              <option value="3.0">3.0 hrs before bed (High Risk)</option>
              <option value="2.0">2.0 hrs before bed (High Risk)</option>
              <option value="1.0">1.0 hr before bed (Severe)</option>
              <option value="0.5">&lt; 30 mins / In Bed</option>
            </>
          )}

          {type === 'screen' && (
            <>
              <option value="4.0">4.0+ hrs before bed (Optimal)</option>
              <option value="3.0">3.0 hrs before bed</option>
              <option value="2.5">2.5 hrs before bed</option>
              <option value="2.0">2.0 hrs before bed (Optimal)</option>
              <option value="1.5">1.5 hrs before bed</option>
              <option value="1.0">1.0 hr before bed (Moderate)</option>
              <option value="0.5">0.5 hr before bed (Blunts Melatonin)</option>
              <option value="0.0">In Bed / Right Before Sleep (High Risk)</option>
            </>
          )}

          {type === 'meal' && (
            <>
              <option value="4.5">4.5+ hrs before bed (Optimal Fast)</option>
              <option value="4.0">4.0 hrs before bed</option>
              <option value="3.5">3.5 hrs before bed</option>
              <option value="3.0">3.0 hrs before bed (Optimal)</option>
              <option value="2.5">2.5 hrs before bed</option>
              <option value="2.0">2.0 hrs before bed (Moderate)</option>
              <option value="1.5">1.5 hrs before bed (Elevates Sleeping HR)</option>
              <option value="1.0">1.0 hr before bed (High Risk)</option>
              <option value="0.5">&lt; 30 mins / Late Night Snack</option>
            </>
          )}
          <option value="exact_time">⚙️ Enter Custom Exact Time...</option>
        </select>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={exactTimeVal}
            onChange={(e) => {
              setExactTimeVal(e.target.value)
              onChange(`time:${e.target.value}`)
            }}
            className={`flex-1 bg-black/80 border border-white/20 rounded-lg p-2 text-white text-xs font-mono focus:outline-none ${theme === 'rose' ? 'focus:border-rose-400' : 'focus:border-indigo-400'}`}
          />
          <button
            type="button"
            onClick={() => {
              onChange('skip')
            }}
            className={`text-[10px] px-2 py-1.5 rounded border transition-colors ${
              value === 'skip'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'text-gray-400 hover:text-white bg-white/5 border-white/10'
            }`}
          >
            {value === 'skip' ? 'Skipped' : 'Skip'}
          </button>
        </div>
      )}

      {riskBadge && (
        <div className="flex justify-between items-center text-[10px] pt-0.5">
          <span className={`px-2 py-0.5 rounded-md border font-mono ${riskBadge.color}`}>
            {riskBadge.text}
          </span>
        </div>
      )}
    </div>
  )
}

export default function DailyWellbeingCheckin({ 
  onSave, 
  initialData,
  profile,
  allOutcomes,
  date,
  isCurrentDay,
  isCollapsedByDefault = false,
  recentTasks,
  section = 'all'
}: { 
  onSave: (
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
  ) => void
  initialData: WellbeingType | null
  profile: UserProfile | null
  allOutcomes: OutcomeDimension[]
  date: Date
  isCurrentDay: boolean
  isCollapsedByDefault?: boolean
  recentTasks?: any[]
  section?: 'all' | 'morning_anytime' | 'nightly'
}) {
  const [mood, setMood] = useState(5)
  const [energy, setEnergy] = useState(5)
  const [stress, setStress] = useState(5)
  const [subjectiveSleep, setSubjectiveSleep] = useState(5)
  const [sleepScore, setSleepScore] = useState<string>('')

  // Sleep Timing & Actual Duration (Initialized from profile ideal bedtime/waketime with 15m adjusters)
  const defaultBedtime = (initialData as any)?.actual_bedtime || (initialData as any)?.custom_outcomes_jsonb?._actual_bedtime || profile?.ideal_bedtime || '22:30'
  const defaultWaketime = (initialData as any)?.actual_wake_time || (initialData as any)?.custom_outcomes_jsonb?._actual_wake_time || profile?.ideal_wake_time || '06:30'

  const [actualBedtime, setActualBedtime] = useState<string>(defaultBedtime)
  const [actualWakeTime, setActualWakeTime] = useState<string>(defaultWaketime)
  const [actualSleepMinutes, setActualSleepMinutes] = useState<number>(() => {
    if ((initialData as any)?.actual_sleep_minutes != null) return (initialData as any).actual_sleep_minutes
    if ((initialData as any)?.custom_outcomes_jsonb?._actual_sleep_minutes != null) return (initialData as any).custom_outcomes_jsonb._actual_sleep_minutes
    return computeSleepMinutes(defaultBedtime, defaultWaketime)
  })
  const [sleepSource, setSleepSource] = useState<string>((initialData as any)?.sleep_source || (initialData as any)?.custom_outcomes_jsonb?._sleep_source || 'manual')

  const handleAdjustBedtime = (deltaMins: number) => {
    const newTime = formatMinutesToTime(parseTimeToMinutes(actualBedtime) + deltaMins)
    setActualBedtime(newTime)
    setActualSleepMinutes(computeSleepMinutes(newTime, actualWakeTime))
  }

  const handleAdjustWakeTime = (deltaMins: number) => {
    const newTime = formatMinutesToTime(parseTimeToMinutes(actualWakeTime) + deltaMins)
    setActualWakeTime(newTime)
    setActualSleepMinutes(computeSleepMinutes(actualBedtime, newTime))
  }

  const handleAdjustSleepDuration = (deltaMins: number) => {
    setActualSleepMinutes(prev => Math.max(0, prev + deltaMins))
  }

  const [lastFoodTime, setLastFoodTime] = useState<string>('19:00')
  const [notes, setNotes] = useState<string>('')
  const [eveningNotes, setEveningNotes] = useState<string>('')

  // Additional Functional Outcomes
  const [skinClarity, setSkinClarity] = useState(5)
  const [focusScore, setFocusScore] = useState(5)

  // Current State & Quick Modal State
  const [isCurrentStateExpanded, setIsCurrentStateExpanded] = useState(false)
  const [quickModalOutcome, setQuickModalOutcome] = useState<OutcomeLiveState | null>(null)
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false)

  // Negative Longevity Exposures State (Default: Exact Time for caffeine, screen, and meal)
  const [alcoholDrinks, setAlcoholDrinks] = useState<number | 'skip'>('skip')
  const [lateCaffeine, setLateCaffeine] = useState<string>('time:14:00')
  const [nicotineExposure, setNicotineExposure] = useState<string>('skip')
  const [cannabisExposure, setCannabisExposure] = useState<string>('skip')
  const [sittingDuration, setSittingDuration] = useState<string>('skip')
  const [lateMeal, setLateMeal] = useState<string>('time:19:30')
  const [blueLight, setBlueLight] = useState<string>('time:21:30')
  const [processedSugar, setProcessedSugar] = useState<string>('skip')

  // Section Collapse Toggles
  const [showSleepSection, setShowSleepSection] = useState(true)
  const [showExposuresSection, setShowExposuresSection] = useState(true)
  const [showMealSection, setShowMealSection] = useState(true)
  const [showCoreMetricsSection, setShowCoreMetricsSection] = useState(true)
  const [showOutcomesSection, setShowOutcomesSection] = useState(true)

  // Nightly Check-in Expandable Card state (After 6 PM or any past date)
  const [showNightlyCard, setShowNightlyCard] = useState(false)
  const [isNightlyEditing, setIsNightlyEditing] = useState(false)
  const [isNightlySaved, setIsNightlySaved] = useState(false)
  const [nightlySavedToast, setNightlySavedToast] = useState(false)

  // Daytime Anytime Check-in state (Between Morning & Nightly, 10 AM - 6 PM)
  const [showDaytimeCard, setShowDaytimeCard] = useState(false)
  const [daytimeMood, setDaytimeMood] = useState(5)
  const [daytimeEnergy, setDaytimeEnergy] = useState(5)
  const [daytimeStress, setDaytimeStress] = useState(5)
  const [daytimeFocus, setDaytimeFocus] = useState(5)
  const [daytimeSkin, setDaytimeSkin] = useState(5)
  const [daytimeCustomValues, setDaytimeCustomValues] = useState<Record<string, number>>({})
  const [daytimeTouchedOutcomes, setDaytimeTouchedOutcomes] = useState<Record<string, boolean>>({})
  const [daytimeSavedToast, setDaytimeSavedToast] = useState(false)
  const [localAnytimeLogs, setLocalAnytimeLogs] = useState<any[]>([])

  // Tracked Outcomes Modal state
  const [isOutcomesModalOpen, setIsOutcomesModalOpen] = useState(false)
  const [outcomesModalTitle, setOutcomesModalTitle] = useState("Customize Tracked Outcomes")
  const [outcomesModalMode, setOutcomesModalMode] = useState<'morning' | 'anytime' | 'nightly'>('morning')


  
  // Custom outcomes state
  const [customOutcomeValues, setCustomOutcomeValues] = useState<Record<string, number>>({})
  const [touchedOutcomes, setTouchedOutcomes] = useState<Record<string, boolean>>({})
  const [isSaved, setIsSaved] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isCollapsedAll, setIsCollapsedAll] = useState(isCollapsedByDefault)
  const [isMounted, setIsMounted] = useState(false)

  const effectiveUserId = profile?.local_user_id || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') || 'local_user' : 'local_user')
  const dStr = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')

  const handleApplyVoiceData = (parsed: ParsedVoiceCheckinData, target: 'morning' | 'anytime' | 'nightly') => {
    // 1. Outcomes calibration
    if (parsed.outcomes && parsed.outcomes.length > 0) {
      parsed.outcomes.forEach(o => {
        if (target === 'anytime') {
          if (o.outcome_id === 'mood') { setDaytimeMood(o.rating_0_10); setDaytimeTouchedOutcomes(p => ({ ...p, mood: true })) }
          else if (o.outcome_id === 'energy') { setDaytimeEnergy(o.rating_0_10); setDaytimeTouchedOutcomes(p => ({ ...p, energy: true })) }
          else if (o.outcome_id === 'stress_resilience') { setDaytimeStress(10 - o.rating_0_10); setDaytimeTouchedOutcomes(p => ({ ...p, stress: true })) }
          else if (o.outcome_id === 'cognitive_performance') { setDaytimeFocus(o.rating_0_10); setDaytimeTouchedOutcomes(p => ({ ...p, focus: true })) }
          else {
            setDaytimeCustomValues(prev => ({ ...prev, [o.outcome_id]: o.rating_0_10 }))
            setDaytimeTouchedOutcomes(p => ({ ...p, [o.outcome_id]: true }))
          }
          setShowDaytimeCard(true)
        } else {
          // Morning / Nightly
          if (o.outcome_id === 'mood') { setMood(o.rating_0_10); setTouchedOutcomes(p => ({ ...p, mood: true })) }
          else if (o.outcome_id === 'energy') { setEnergy(o.rating_0_10); setTouchedOutcomes(p => ({ ...p, energy: true })) }
          else if (o.outcome_id === 'stress_resilience') { setStress(10 - o.rating_0_10); setTouchedOutcomes(p => ({ ...p, stress: true })) }
          else if (o.outcome_id === 'sleep_quality') { setSubjectiveSleep(o.rating_0_10); setTouchedOutcomes(p => ({ ...p, sleep: true })) }
          else if (o.outcome_id === 'cognitive_performance') { setFocusScore(o.rating_0_10); setTouchedOutcomes(p => ({ ...p, focus: true })) }
          else {
            setCustomOutcomeValues(prev => ({ ...prev, [o.outcome_id]: o.rating_0_10 }))
            setTouchedOutcomes(p => ({ ...p, [o.outcome_id]: true }))
          }
        }
      })
    }

    // 2. Timings & Negative Exposures
    if (parsed.timings?.last_meal_time) {
      setLastFoodTime(parsed.timings.last_meal_time)
      setLateMeal(`time:${parsed.timings.last_meal_time}`)
    }
    if (parsed.timings?.last_caffeine_time) {
      setLateCaffeine(`time:${parsed.timings.last_caffeine_time}`)
    }
    if (parsed.timings?.last_screen_time) {
      setBlueLight(`time:${parsed.timings.last_screen_time}`)
    }
    if (parsed.timings?.alcohol_drinks !== undefined) {
      setAlcoholDrinks(parsed.timings.alcohol_drinks)
    }

    // 2.5 Freeform Notes from voice
    if (parsed.notes) {
      if (target === 'nightly') {
        setEveningNotes(prev => prev ? `${prev}\n${parsed.notes}` : parsed.notes!)
      } else {
        setNotes(prev => prev ? `${prev}\n${parsed.notes}` : parsed.notes!)
      }
    }

    // 2.7 Confounders from voice in nightly mode
    if (target === 'nightly' && parsed.confounders) {
      const c = parsed.confounders
      if (c.day_busyness_score !== undefined) setDayBusyness(c.day_busyness_score)
      if (c.busyness_tags && Array.isArray(c.busyness_tags)) setBusynessTags(c.busyness_tags)
      if (c.external_stress_score !== undefined) setExternalStress(c.external_stress_score)
      if (c.stressor_domain) setStressorDomain(c.stressor_domain)
      if (c.stressor_notes) setStressorNotes(c.stressor_notes)
      if (c.social_cohort) setSocialCohort(c.social_cohort)
      if (c.social_energy_delta !== undefined) setSocialEnergyDelta(c.social_energy_delta)
      if (c.productivity_score !== undefined) setProductivityScore(c.productivity_score)
      if (c.productivity_depth) setProductivityDepth(c.productivity_depth)
      if (c.goals_completed !== undefined) setGoalsCompleted(c.goals_completed)
      setIsConfoundersExpanded(true)
    }

    // 3. Open the target section so user sees the populated values
    if (target === 'morning') {
      setIsEditing(true)
      setIsCollapsedAll(false)
    } else if (target === 'nightly') {
      setShowNightlyCard(true)
    } else if (target === 'anytime') {
      setShowDaytimeCard(true)
    }
  }

  useEffect(() => {
    setIsMounted(true)
    if (isCollapsedByDefault !== undefined) {
      setIsCollapsedAll(isCollapsedByDefault)
    }
    if (date) {
      const dStr = format(date, 'yyyy-MM-dd')
      if (localStorage.getItem('levl_checkin_saved_' + dStr) === 'true') {
        setIsSaved(true)
      }
    }
  }, [date, isCollapsedByDefault])

  const [localProfile, setLocalProfile] = useState<UserProfile | null>(profile || null)

  useEffect(() => {
    if (profile) setLocalProfile(profile)
  }, [profile])

  // Bedtime-Aware Evening Check-in Threshold (~3 hours before user's ideal bedtime)
  const isNightly = useMemo(() => {
    if (!isCurrentDay) return false
    const now = new Date()
    const curHour = now.getHours()
    const curMinute = now.getMinutes()
    const curTotalMins = curHour * 60 + curMinute

    // Ideal bedtime from user profile (default to 22:00 / 10:00 PM)
    let bedHour = 22
    let bedMinute = 0
    if (localProfile?.ideal_bedtime && localProfile.ideal_bedtime.includes(':')) {
      const [h, m] = localProfile.ideal_bedtime.split(':').map(Number)
      if (!isNaN(h)) bedHour = h
      if (!isNaN(m)) bedMinute = m
    }

    const bedTotalMins = bedHour * 60 + bedMinute
    // 3 hours before bedtime threshold
    let thresholdMins = bedTotalMins - (3 * 60)
    if (thresholdMins < 0) thresholdMins += 24 * 60

    if (thresholdMins <= bedTotalMins) {
      // Normal evening schedule (e.g. bed at 22:00 -> threshold is 19:00 / 7:00 PM)
      // Active from 3h before bed until 4:00 AM next morning
      return curTotalMins >= thresholdMins || curHour < 4
    } else {
      // Midnight crossing schedule (e.g. bed at 01:00 AM -> threshold is 22:00 / 10:00 PM)
      return curTotalMins >= thresholdMins || curTotalMins <= (bedTotalMins + 120)
    }
  }, [isCurrentDay, localProfile?.ideal_bedtime])

  const isFutureDate = isFuture(date) && !isSameDay(date, new Date())
  const isPastDate = isPast(date) && !isSameDay(date, new Date())

  // On past dates, the entire evening has concluded, so the evening check-in is always available to log/edit
  const isNightlyAvailable = isPastDate || (isCurrentDay && isNightly)

  const phaseLabel = isCurrentDay 
    ? (isNightly ? 'Nightly Check-in' : 'Morning Check-in') 
    : (section === 'nightly' ? `Evening Check-in for ${date.toLocaleDateString()}` : `Check-in for ${date.toLocaleDateString()}`)
  
  // Custom user-created outcomes
  const [customOutcomesList, setCustomOutcomesList] = useState<OutcomeDimension[]>([])

  useEffect(() => {
    const loadCustom = () => {
      let custom: OutcomeDimension[] = []
      if (localProfile?.outcome_preference_scores?.custom_user_outcomes && Array.isArray(localProfile.outcome_preference_scores.custom_user_outcomes)) {
        custom = localProfile.outcome_preference_scores.custom_user_outcomes
      } else {
        custom = getStoredCustomOutcomes()
      }
      setCustomOutcomesList(custom)
    }

    loadCustom()

    const handleCustomUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setCustomOutcomesList(e.detail)
      } else {
        loadCustom()
      }
    }

    window.addEventListener('levl_custom_outcomes_updated', handleCustomUpdate)
    return () => window.removeEventListener('levl_custom_outcomes_updated', handleCustomUpdate)
  }, [localProfile])

  const combinedAllOutcomes = useMemo(() => {
    const map = new Map<string, OutcomeDimension>()
    allOutcomes.forEach(o => map.set(o.id, o))
    customOutcomesList.forEach(co => map.set(co.id, co))
    return Array.from(map.values())
  }, [allOutcomes, customOutcomesList])

  // Identify sleep-related outcomes from library
  const sleepOutcomes = useMemo(() => {
    return combinedAllOutcomes.filter(o => {
      const idLower = o.id.toLowerCase()
      const nameLower = o.name.toLowerCase()
      const catLower = (o.category || '').toLowerCase()
      return idLower.includes('sleep') || nameLower.includes('sleep') || catLower.includes('sleep')
    })
  }, [combinedAllOutcomes])

  // Listen for realtime profile updates dispatched across app (e.g. from CustomizeCheckinOutcomesModal)
  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e?.detail) {
        setLocalProfile(e.detail)
      }
    }
    window.addEventListener('levl_profile_updated', handleProfileUpdate)
    return () => window.removeEventListener('levl_profile_updated', handleProfileUpdate)
  }, [])
  
  // User Preferences for Morning Exposures & Mindfulness Display
  const alwaysExpandExposures = localProfile?.outcome_preference_scores?.['setting:morning_always_expand_exposures'] === 1
  const [showLastNightExposures, setShowLastNightExposures] = useState(false)

  const morningMindfulnessPref = (localProfile?.outcome_preference_scores?.['setting:morning_mindfulness_display'] as 'open' | 'collapsed' | 'hidden') || 'open'
  const [isMindfulnessExpanded, setIsMindfulnessExpanded] = useState(morningMindfulnessPref === 'open')

  useEffect(() => {
    if (alwaysExpandExposures) {
      setShowLastNightExposures(true)
    }
  }, [alwaysExpandExposures])

  useEffect(() => {
    setIsMindfulnessExpanded(morningMindfulnessPref === 'open')
  }, [morningMindfulnessPref])

  // User Preferences for Evening Mindfulness Display
  const eveningMindfulnessPref = (localProfile?.outcome_preference_scores?.['setting:evening_mindfulness_display'] as 'open' | 'collapsed' | 'hidden') || 'open'
  const [isEveningMindfulnessExpanded, setIsEveningMindfulnessExpanded] = useState(eveningMindfulnessPref === 'open')

  useEffect(() => {
    setIsEveningMindfulnessExpanded(eveningMindfulnessPref === 'open')
  }, [eveningMindfulnessPref])

  // User Preferences for External Confounders & Causation Suite
  const autoWeatherEnabled = localProfile?.outcome_preference_scores?.['setting:confounder_auto_weather'] !== 0
  const busynessDisplay = (localProfile?.outcome_preference_scores?.['setting:confounder_busyness_display'] as 'open' | 'collapsed' | 'hidden') || 'collapsed'
  const stressorsDisplay = (localProfile?.outcome_preference_scores?.['setting:confounder_stressors_display'] as 'open' | 'collapsed' | 'hidden') || 'collapsed'
  const socialDisplay = (localProfile?.outcome_preference_scores?.['setting:confounder_social_display'] as 'open' | 'collapsed' | 'hidden') || 'hidden'
  const productivityDisplay = (localProfile?.outcome_preference_scores?.['setting:confounder_productivity_display'] as 'open' | 'collapsed' | 'hidden') || 'hidden'

  const anyConfounderActive = autoWeatherEnabled || busynessDisplay !== 'hidden' || stressorsDisplay !== 'hidden' || socialDisplay !== 'hidden' || productivityDisplay !== 'hidden'

  // Confounders State
  const initialConfounders = initialData?.confounders || ((initialData as any)?.custom_outcomes_jsonb?.confounders as ExternalConfounderData) || null
  const [localWeather, setLocalWeather] = useState<LocalWeatherData | null>(() => {
    if (initialConfounders?.weather) {
      return {
        temp_f: initialConfounders.weather.temp_f,
        temp_c: initialConfounders.weather.temp_c ?? Math.round(((initialConfounders.weather.temp_f - 32) * 5) / 9),
        humidity: initialConfounders.weather.humidity,
        pressure_hpa: initialConfounders.weather.pressure_hpa,
        pressure_trend: initialConfounders.weather.pressure_trend,
        uv_index: 0,
        weather_code: 0,
        condition: initialConfounders.weather.condition,
        icon: initialConfounders.weather.icon,
        city: initialConfounders.weather.city,
        temp_max_f: initialConfounders.weather.temp_max_f,
        temp_min_f: initialConfounders.weather.temp_min_f,
        day_condition_summary: initialConfounders.weather.day_condition_summary,
        precipitation_sum: initialConfounders.weather.precipitation_sum,
        day_periods: initialConfounders.weather.day_periods,
        fetched_at: new Date().toISOString()
      }
    }
    return getCachedWeather()
  })
  const [isFetchingWeather, setIsFetchingWeather] = useState(false)

  const [dayBusyness, setDayBusyness] = useState<number>(() => initialConfounders?.day_busyness_score ?? 5)
  const [busynessTags, setBusynessTags] = useState<string[]>(() => initialConfounders?.busyness_tags ?? [])
  const [externalStress, setExternalStress] = useState<number>(() => initialConfounders?.external_stress_score ?? 0)
  const [stressorDomain, setStressorDomain] = useState<string>(() => initialConfounders?.stressor_domain ?? '')
  const [stressorNotes, setStressorNotes] = useState<string>(() => initialConfounders?.stressor_notes ?? '')
  const [socialCohort, setSocialCohort] = useState<string>(() => initialConfounders?.social_cohort ?? '')
  const selectedSocialCohorts = socialCohort
    ? socialCohort.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const handleToggleSocialCohort = (id: string) => {
    if (id === 'solo') {
      if (selectedSocialCohorts.includes('solo')) {
        setSocialCohort('')
      } else {
        setSocialCohort('solo')
      }
      return
    }

    const withoutSolo = selectedSocialCohorts.filter(c => c !== 'solo')
    let next: string[]
    if (withoutSolo.includes(id) || (id === 'friends' && withoutSolo.includes('loved_ones'))) {
      next = withoutSolo.filter(c => c !== id && c !== 'loved_ones')
    } else {
      next = [...withoutSolo, id]
    }
    setSocialCohort(next.join(','))
  }
  const [socialEnergyDelta, setSocialEnergyDelta] = useState<number>(() => initialConfounders?.social_energy_delta ?? 0)
  const [productivityScore, setProductivityScore] = useState<number>(() => initialConfounders?.productivity_score ?? 5)
  const [productivityDepth, setProductivityDepth] = useState<string>(() => initialConfounders?.productivity_depth ?? '')
  const [goalsCompleted, setGoalsCompleted] = useState<number>(() => initialConfounders?.goals_completed ?? 0)
  const [goalsTotal, setGoalsTotal] = useState<number>(() => initialConfounders?.goals_total ?? 3)
  const [goalNotes, setGoalNotes] = useState<string>(() => initialConfounders?.goal_notes ?? '')

  const shouldStartConfoundersOpen = busynessDisplay === 'open' || stressorsDisplay === 'open' || socialDisplay === 'open' || productivityDisplay === 'open'
  const [isConfoundersExpanded, setIsConfoundersExpanded] = useState(shouldStartConfoundersOpen)

  useEffect(() => {
    setIsConfoundersExpanded(shouldStartConfoundersOpen)
  }, [shouldStartConfoundersOpen])

  useEffect(() => {
    if (autoWeatherEnabled && !localWeather) {
      const loadWeather = async () => {
        setIsFetchingWeather(true)
        try {
          const data = await fetchCurrentWeather()
          if (data) setLocalWeather(data)
        } finally {
          setIsFetchingWeather(false)
        }
      }
      loadWeather()
    }
  }, [autoWeatherEnabled])

  const handleManualWeatherRefresh = async () => {
    setIsFetchingWeather(true)
    try {
      const data = await fetchCurrentWeather(true)
      if (data) setLocalWeather(data)
    } finally {
      setIsFetchingWeather(false)
    }
  }

  // Helper to determine if an outcome is tracked in morning vs nightly mode
  const isOutcomeTracked = (id: string, mode: 'morning' | 'nightly') => {
    if (mode === 'morning' && localProfile?.morning_checkin_dimensions && localProfile.morning_checkin_dimensions.length > 0) {
      return localProfile.morning_checkin_dimensions.includes(id)
    }
    if (mode === 'nightly' && localProfile?.evening_checkin_dimensions && localProfile.evening_checkin_dimensions.length > 0) {
      return localProfile.evening_checkin_dimensions.includes(id)
    }

    const prefs = localProfile?.outcome_preference_scores
    const key = `${mode}:${id}`
    const val = prefs ? prefs[key] : undefined
    if (val !== undefined) {
      return val >= 7
    }
    // Default recommended items if no explicit preference set yet
    if (mode === 'morning') {
      return ['mood', 'energy', 'stress', 'sleep_quality', 'subjective_sleep', 'waking_restedness'].includes(id)
    } else {
      return ['mood', 'energy', 'stress', 'focus', 'focus_score', 'mental_clarity', 'digestive_comfort'].includes(id)
    }
  }

  // Calculate dynamic non-sleep custom outcomes to track for Morning Check-in
  const morningOutcomesToTrack = useMemo(() => {
    return combinedAllOutcomes.filter(o => {
      const idLower = o.id.toLowerCase()
      const nameLower = o.name.toLowerCase()
      const catLower = (o.category || '').toLowerCase()

      // Exclude sleep outcomes handled in dedicated sleep section
      if (idLower.includes('sleep') || nameLower.includes('sleep') || catLower.includes('sleep')) return false

      // Exclude core metrics explicitly rendered in top section
      if (['mood', 'energy', 'stress', 'skin', 'skin_clarity', 'focus', 'focus_score'].includes(o.id)) return false

      return isOutcomeTracked(o.id, 'morning')
    })
  }, [localProfile, combinedAllOutcomes])

  // Calculate dynamic non-sleep custom outcomes to track for Nightly Check-in
  const nightlyOutcomesToTrack = useMemo(() => {
    return combinedAllOutcomes.filter(o => {
      const idLower = o.id.toLowerCase()
      const nameLower = o.name.toLowerCase()
      const catLower = (o.category || '').toLowerCase()

      // Exclude sleep outcomes handled in dedicated sleep section
      if (idLower.includes('sleep') || nameLower.includes('sleep') || catLower.includes('sleep')) return false

      // Exclude core metrics explicitly rendered in top section
      if (['mood', 'energy', 'stress', 'skin', 'skin_clarity', 'focus', 'focus_score'].includes(o.id)) return false

      return isOutcomeTracked(o.id, 'nightly')
    })
  }, [localProfile, combinedAllOutcomes])

  // Active Anytime Tracked Outcomes (matches CustomizeCheckinOutcomesModal selection)
  const activeAnytimeDimensions = useMemo(() => {
    // 1. Check explicit anytime_checkin_dimensions array from user profile
    if (localProfile?.anytime_checkin_dimensions && Array.isArray(localProfile.anytime_checkin_dimensions) && localProfile.anytime_checkin_dimensions.length > 0) {
      const fromDims = localProfile.anytime_checkin_dimensions
        .map(id => combinedAllOutcomes.find(o => o.id === id || o.id === `${id}_score`))
        .filter(Boolean) as OutcomeDimension[]
      if (fromDims.length > 0) return fromDims
    }

    const prefs = localProfile?.outcome_preference_scores || {}
    
    // 2. Check for explicit anytime: outcome preferences in outcome_preference_scores
    const fromPrefs = combinedAllOutcomes.filter(o => {
      const key = `anytime:${o.id}`
      const val = prefs[key]
      if (val !== undefined) return val >= 7
      return false
    })

    if (fromPrefs.length > 0) return fromPrefs

    // 3. Default 4: Mood, Energy, Stress, Focus
    const defaultIds = ['mood', 'energy', 'stress', 'focus']
    const matched = defaultIds.map(id => combinedAllOutcomes.find(o => o.id === id || o.id === `${id}_score`)).filter(Boolean) as OutcomeDimension[]
    
    const finalOutcomes: OutcomeDimension[] = [...matched]
    defaultIds.forEach(id => {
      if (!finalOutcomes.some(o => o.id === id)) {
        finalOutcomes.push({
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1),
          category: 'cognitive',
          directionality: id === 'stress' ? 'lower_is_better' : 'higher_is_better',
          is_default_wellbeing: true,
          is_contextual: false
        })
      }
    })
    return finalOutcomes
  }, [localProfile, combinedAllOutcomes])

  // Effective check-in data combining initialData with active in-memory user inputs
  const effectiveCheckinData = useMemo(() => {
    let customJSON: Record<string, any> = {}
    if (initialData) {
      if ((initialData as any).custom_outcomes_jsonb) {
        customJSON = { ...(initialData as any).custom_outcomes_jsonb }
      } else if ((initialData as any).notes) {
        try {
          const parsedNotes = JSON.parse((initialData as any).notes)
          customJSON = { ...(parsedNotes.custom_outcomes_jsonb || parsedNotes.custom_outcomes || {}) }
        } catch (e) {}
      }
    }

    // Merge active user state so live state updates immediately without waiting for server round-trip
    customJSON = {
      ...customJSON,
      ...customOutcomeValues,
      skin_clarity: skinClarity,
      focus_score: focusScore,
      focus: focusScore,
      skin: skinClarity
    }

    // Merge daytime anytime checkins so live state reflects them immediately
    const allAnytime = [
      ...(Array.isArray(customJSON._anytime_checkins) ? customJSON._anytime_checkins : []),
      ...localAnytimeLogs
    ]
    if (allAnytime.length > 0) {
      customJSON._anytime_checkins = allAnytime
      customJSON.latest_anytime_checkin = allAnytime[allAnytime.length - 1]
    }

    // Merge active daytime custom values
    Object.entries(daytimeCustomValues).forEach(([k, v]) => {
      customJSON[`daytime_${k}`] = v
    })
    if (daytimeTouchedOutcomes.mood) customJSON.daytime_mood = daytimeMood
    if (daytimeTouchedOutcomes.energy) customJSON.daytime_energy = daytimeEnergy
    if (daytimeTouchedOutcomes.stress) customJSON.daytime_stress = daytimeStress
    if (daytimeTouchedOutcomes.focus) customJSON.daytime_focus = daytimeFocus
    if (daytimeTouchedOutcomes.skin) customJSON.daytime_skin = daytimeSkin

    const dateStr = date ? format(date, 'yyyy-MM-dd') : ''
    const hasSavedMorning = isSaved || initialData?.mood_0_10 != null || initialData?.energy_0_10 != null
    const morningCreatedAt = (initialData as any)?.created_at || (customJSON._morning_logged_at) || (hasSavedMorning ? `${dateStr}T08:00:00.000Z` : undefined)

    return {
      id: initialData?.id || `checkin_${dateStr}`,
      local_user_id: initialData?.local_user_id || localProfile?.local_user_id || 'user',
      checkin_date: initialData?.checkin_date || dateStr,
      created_at: morningCreatedAt,
      updated_at: (initialData as any)?.updated_at || (hasSavedMorning ? new Date().toISOString() : undefined),
      notes: notes || initialData?.notes,
      sleep_score_0_100: initialData?.sleep_score_0_100,
      last_food_time: initialData?.last_food_time,
      mood_0_10: touchedOutcomes.mood || hasSavedMorning ? mood : (initialData?.mood_0_10 ?? null),
      energy_0_10: touchedOutcomes.energy || hasSavedMorning ? energy : (initialData?.energy_0_10 ?? null),
      stress_0_10: touchedOutcomes.stress || hasSavedMorning ? stress : (initialData?.stress_0_10 ?? null),
      subjective_sleep_0_10: touchedOutcomes.sleep || hasSavedMorning ? subjectiveSleep : (initialData?.subjective_sleep_0_10 ?? null),
      custom_outcomes_jsonb: {
        ...customJSON,
        notes: notes || customJSON.notes,
        freeform_notes: notes || customJSON.freeform_notes,
        _evening_notes: eveningNotes || customJSON._evening_notes,
        evening_notes: eveningNotes || customJSON.evening_notes
      },
    } as WellbeingType
  }, [initialData, mood, energy, stress, subjectiveSleep, skinClarity, focusScore, notes, eveningNotes, customOutcomeValues, touchedOutcomes, isSaved, date, localProfile, localAnytimeLogs, daytimeMood, daytimeEnergy, daytimeStress, daytimeFocus, daytimeSkin, daytimeCustomValues, daytimeTouchedOutcomes])

  // Real-time live outcome state map aggregating latest readings across all sources
  const liveStateMap = useMemo(() => {
    const map: Record<string, OutcomeLiveState> = {}
    activeAnytimeDimensions.forEach(dim => {
      map[dim.id] = getLatestOutcomeLiveState(dim.id, effectiveCheckinData, recentTasks, allOutcomes)
    })
    return map
  }, [activeAnytimeDimensions, effectiveCheckinData, recentTasks, allOutcomes])

  // Initialize custom outcome states
  useEffect(() => {
    const allTracked = [...morningOutcomesToTrack, ...nightlyOutcomesToTrack]
    if (allTracked.length > 0) {
      setCustomOutcomeValues(prev => {
        const next = { ...prev }
        allTracked.forEach(o => {
          if (next[o.id] === undefined) next[o.id] = 5
        })
        return next
      })
    }
  }, [morningOutcomesToTrack, nightlyOutcomesToTrack])

  // Helper to determine if an exposure is tracked
  const isExposureTracked = (id: string) => {
    const prefs = localProfile?.outcome_preference_scores
    if (!prefs) return true
    const val = prefs[`exposure:${id}`]
    if (val === undefined) return true
    return val >= 7
  }

  useEffect(() => {
    if (initialData) {
      setMood(initialData.mood_0_10 ?? 5)
      setEnergy(initialData.energy_0_10 ?? 5)
      setStress(initialData.stress_0_10 ?? 5)
      setSubjectiveSleep(initialData.subjective_sleep_0_10 ?? 5)
      setSleepScore(initialData.sleep_score_0_100 != null ? initialData.sleep_score_0_100.toString() : '')
      setLastFoodTime(initialData.last_food_time || '19:00')
      
      const customJSON = (initialData as any).custom_outcomes_jsonb || {}
      const hydratedBedtime = (initialData as any).actual_bedtime || customJSON._actual_bedtime || profile?.ideal_bedtime || '22:30'
      const hydratedWaketime = (initialData as any).actual_wake_time || customJSON._actual_wake_time || profile?.ideal_wake_time || '06:30'
      setActualBedtime(hydratedBedtime)
      setActualWakeTime(hydratedWaketime)
      setActualSleepMinutes((initialData as any).actual_sleep_minutes ?? customJSON._actual_sleep_minutes ?? computeSleepMinutes(hydratedBedtime, hydratedWaketime))
      setSleepSource((initialData as any).sleep_source || customJSON._sleep_source || 'manual')

      setSkinClarity(customJSON.skin_clarity ?? 5)
      setFocusScore(customJSON.focus_score ?? 5)
      setAlcoholDrinks(customJSON.alcohol_drinks !== undefined && customJSON.alcohol_drinks !== null ? customJSON.alcohol_drinks : 'skip')
      setLateCaffeine(customJSON.late_caffeine || 'time:14:00')
      setNicotineExposure(customJSON.nicotine_exposure || 'skip')
      setCannabisExposure(customJSON.cannabis_exposure || 'skip')
      setSittingDuration(customJSON.sitting_duration || 'skip')
      setLateMeal(customJSON.late_meal !== undefined && customJSON.late_meal !== null ? (typeof customJSON.late_meal === 'string' ? customJSON.late_meal : customJSON.late_meal ? 'time:19:30' : 'time:19:30') : 'time:19:30')
      setBlueLight(customJSON.blue_light || 'time:21:30')
      setProcessedSugar(customJSON.processed_sugar || 'skip')
      
      // Hydrate freeform notes
      let parsedNotesStr = ''
      let parsedEveNotesStr = ''
      if (initialData.notes) {
        try {
          const parsed = JSON.parse(initialData.notes)
          parsedNotesStr = parsed.freeform_notes || parsed.notes || parsed.plain_notes || ''
          parsedEveNotesStr = parsed.evening_notes || parsed._evening_notes || ''
        } catch (e) {
          parsedNotesStr = initialData.notes
        }
      }
      if (!parsedNotesStr && customJSON.notes) parsedNotesStr = customJSON.notes
      if (!parsedNotesStr && customJSON.freeform_notes) parsedNotesStr = customJSON.freeform_notes
      if (!parsedEveNotesStr && customJSON._evening_notes) parsedEveNotesStr = customJSON._evening_notes
      if (!parsedEveNotesStr && customJSON.evening_notes) parsedEveNotesStr = customJSON.evening_notes
      setNotes(parsedNotesStr)
      setEveningNotes(parsedEveNotesStr)
      
      // Restore all dynamic outcome slider values from customJSON
      const restoredCustom: Record<string, number> = {}
      Object.entries(customJSON).forEach(([key, val]) => {
        if (typeof val === 'number') {
          restoredCustom[key] = val
        }
      })
      if (Object.keys(restoredCustom).length > 0) {
        setCustomOutcomeValues(prev => ({ ...prev, ...restoredCustom }))
      }

      const touched: Record<string, boolean> = {}
      if (initialData.mood_0_10 != null) touched.mood = true
      if (initialData.energy_0_10 != null) touched.energy = true
      if (initialData.stress_0_10 != null) touched.stress = true
      if (initialData.subjective_sleep_0_10 != null) touched.sleep = true
      if (customJSON.skin_clarity != null) touched.skin = true
      if (customJSON.focus_score != null) touched.focus = true

      Object.entries(customJSON).forEach(([key, val]) => {
        if (typeof val === 'number') {
          touched[key] = true
        }
      })
      setTouchedOutcomes(touched)

      // Initialize Daytime Snapshot values from recency without affecting morning baseline
      const snapMood = getRecentOutcomeSnapshot('mood', initialData)
      const snapEnergy = getRecentOutcomeSnapshot('energy', initialData)
      const snapStress = getRecentOutcomeSnapshot('stress', initialData)
      const snapFocus = getRecentOutcomeSnapshot('focus', initialData)
      const snapSkin = getRecentOutcomeSnapshot('skin', initialData)

      setDaytimeMood(snapMood.value)
      setDaytimeEnergy(snapEnergy.value)
      setDaytimeStress(snapStress.value)
      setDaytimeFocus(snapFocus.value)
      setDaytimeSkin(snapSkin.value)

      const dStr = date ? format(date, 'yyyy-MM-dd') : ''
      const hasMorningData = Boolean(
        customJSON._morning_logged_at ||
        (initialData.mood_0_10 != null && initialData.energy_0_10 != null && initialData.subjective_sleep_0_10 != null) ||
        (typeof window !== 'undefined' && dStr && localStorage.getItem('levl_checkin_saved_' + dStr) === 'true')
      )
      setIsSaved(hasMorningData)

      const hasNightlyData = Boolean(
        customJSON._nightly_logged_at ||
        customJSON.evening_notes ||
        customJSON._evening_notes ||
        customJSON.confounders ||
        (initialData.last_food_time && initialData.last_food_time !== '19:00') ||
        (typeof window !== 'undefined' && dStr && localStorage.getItem('levl_nightly_saved_' + dStr) === 'true')
      )
      setIsNightlySaved(hasNightlyData)
    } else {
      setMood(5)
      setEnergy(5)
      setStress(5)
      setSubjectiveSleep(5)
      setSleepScore('')
      setLastFoodTime('19:00')
      setSkinClarity(5)
      setFocusScore(5)
      setAlcoholDrinks('skip')
      setLateCaffeine('time:14:00')
      setNicotineExposure('skip')
      setCannabisExposure('skip')
      setSittingDuration('skip')
      setLateMeal('time:19:30')
      setBlueLight('time:21:30')
      setProcessedSugar('skip')
      setNotes('')
      setEveningNotes('')
      const dStr = date ? format(date, 'yyyy-MM-dd') : ''
      const localMorningSaved = typeof window !== 'undefined' && dStr && localStorage.getItem('levl_checkin_saved_' + dStr) === 'true'
      setIsSaved(Boolean(localMorningSaved))

      const localNightlySaved = typeof window !== 'undefined' && dStr && localStorage.getItem('levl_nightly_saved_' + dStr) === 'true'
      setIsNightlySaved(Boolean(localNightlySaved))
      setIsEditing(false)
      setShowNightlyCard(false)
    }
  }, [initialData, date])

  const handleMorningSave = () => {
    const combinedCustomOutcomes: Record<string, any> = {
      ...customOutcomeValues,
      skin_clarity: skinClarity,
      focus_score: focusScore,
      _morning_logged_at: new Date().toISOString()
    }

    if (alcoholDrinks !== 'skip') combinedCustomOutcomes.alcohol_drinks = Number(alcoholDrinks)
    if (lateCaffeine !== 'skip') combinedCustomOutcomes.late_caffeine = lateCaffeine
    if (nicotineExposure !== 'skip') combinedCustomOutcomes.nicotine_exposure = nicotineExposure
    if (cannabisExposure !== 'skip') combinedCustomOutcomes.cannabis_exposure = cannabisExposure
    if (sittingDuration !== 'skip') combinedCustomOutcomes.sitting_duration = sittingDuration
    if (lateMeal !== 'skip') combinedCustomOutcomes.late_meal = lateMeal
    if (blueLight !== 'skip') combinedCustomOutcomes.blue_light = blueLight
    if (processedSugar !== 'skip') combinedCustomOutcomes.processed_sugar = processedSugar

    combinedCustomOutcomes._actual_bedtime = actualBedtime
    combinedCustomOutcomes._actual_wake_time = actualWakeTime
    combinedCustomOutcomes._actual_sleep_minutes = actualSleepMinutes
    combinedCustomOutcomes._sleep_source = sleepSource

    onSave(
      mood, 
      energy, 
      stress, 
      subjectiveSleep, 
      sleepScore === '' ? undefined : Number(sleepScore), 
      combinedCustomOutcomes, 
      isNightlySaved ? lastFoodTime : undefined,
      actualBedtime,
      actualWakeTime,
      actualSleepMinutes,
      sleepSource
    )
    setIsSaved(true)
    setIsEditing(false)
    if (typeof window !== 'undefined' && date) {
      const dStr = format(date, 'yyyy-MM-dd')
      safeLocalStorageSet('levl_checkin_saved_' + dStr, 'true')
    }
  }

  const handleNightlySave = () => {
    const confoundersPayload: ExternalConfounderData = {
      ...(localWeather ? {
        weather: {
          temp_f: localWeather.temp_f,
          temp_c: localWeather.temp_c,
          humidity: localWeather.humidity,
          pressure_hpa: localWeather.pressure_hpa,
          pressure_trend: localWeather.pressure_trend,
          condition: localWeather.condition,
          icon: localWeather.icon,
          city: localWeather.city,
          temp_max_f: localWeather.temp_max_f,
          temp_min_f: localWeather.temp_min_f,
          day_condition_summary: localWeather.day_condition_summary,
          precipitation_sum: localWeather.precipitation_sum,
          day_periods: localWeather.day_periods
        }
      } : {}),
      day_busyness_score: dayBusyness,
      busyness_tags: busynessTags,
      external_stress_score: externalStress,
      stressor_domain: stressorDomain || undefined,
      stressor_notes: stressorNotes || undefined,
      social_cohort: socialCohort || undefined,
      social_energy_delta: socialEnergyDelta,
      productivity_score: productivityScore,
      productivity_depth: productivityDepth || undefined,
      goals_completed: goalsCompleted,
      goals_total: goalsTotal,
      goal_notes: goalNotes || undefined
    }

    const combinedCustomOutcomes: Record<string, any> = {
      ...customOutcomeValues,
      skin_clarity: skinClarity,
      focus_score: focusScore,
      confounders: confoundersPayload,
      _nightly_logged_at: new Date().toISOString()
    }

    if (eveningNotes) {
      combinedCustomOutcomes.evening_notes = eveningNotes
      combinedCustomOutcomes._evening_notes = eveningNotes
    }

    if (alcoholDrinks !== 'skip') combinedCustomOutcomes.alcohol_drinks = Number(alcoholDrinks)
    if (lateCaffeine !== 'skip') combinedCustomOutcomes.late_caffeine = lateCaffeine
    if (nicotineExposure !== 'skip') combinedCustomOutcomes.nicotine_exposure = nicotineExposure
    if (cannabisExposure !== 'skip') combinedCustomOutcomes.cannabis_exposure = cannabisExposure
    if (sittingDuration !== 'skip') combinedCustomOutcomes.sitting_duration = sittingDuration
    if (lateMeal !== 'skip') combinedCustomOutcomes.late_meal = lateMeal
    if (blueLight !== 'skip') combinedCustomOutcomes.blue_light = blueLight
    if (processedSugar !== 'skip') combinedCustomOutcomes.processed_sugar = processedSugar

    onSave(
      mood, 
      energy, 
      stress, 
      subjectiveSleep, 
      sleepScore === '' ? undefined : Number(sleepScore), 
      combinedCustomOutcomes, 
      lastFoodTime,
      actualBedtime,
      actualWakeTime,
      actualSleepMinutes,
      sleepSource
    )
    setIsNightlySaved(true)
    setNightlySavedToast(true)
    setTimeout(() => setNightlySavedToast(false), 3500)
    if (typeof window !== 'undefined' && date) {
      const dStr = format(date, 'yyyy-MM-dd')
      safeLocalStorageSet('levl_nightly_saved_' + dStr, 'true')
    }
    setShowNightlyCard(false)
  }

  const handleDaytimeSave = () => {
    const existingCustom = (initialData as any)?.custom_outcomes_jsonb || {}
    const existingAnytimeLogs = Array.isArray(existingCustom._anytime_checkins) ? [...existingCustom._anytime_checkins] : []
    
    const nowIso = new Date().toISOString()
    const nowDisplay = format(new Date(), 'h:mm a')

    const newSnapshot: Record<string, any> = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `anytime_${Date.now()}`,
      timestamp: nowIso,
      time_display: nowDisplay,
    }

    // Save all active anytime dimensions that have been touched or adjusted
    activeAnytimeDimensions.forEach(dim => {
      if (daytimeTouchedOutcomes[dim.id]) {
        let val = 5
        if (dim.id === 'mood') val = daytimeMood
        else if (dim.id === 'energy') val = daytimeEnergy
        else if (dim.id === 'stress') val = daytimeStress
        else if (dim.id === 'focus' || dim.id === 'focus_score') val = daytimeFocus
        else val = daytimeCustomValues[dim.id] ?? 5

        newSnapshot[dim.id] = val
      }
    })

    // Fallbacks for core metrics
    if (daytimeTouchedOutcomes.mood && newSnapshot.mood === undefined) newSnapshot.mood = daytimeMood
    if (daytimeTouchedOutcomes.energy && newSnapshot.energy === undefined) newSnapshot.energy = daytimeEnergy
    if (daytimeTouchedOutcomes.stress && newSnapshot.stress === undefined) newSnapshot.stress = daytimeStress
    if (daytimeTouchedOutcomes.focus && newSnapshot.focus === undefined) newSnapshot.focus = daytimeFocus
    if (daytimeTouchedOutcomes.skin && newSnapshot.skin === undefined) newSnapshot.skin = daytimeSkin

    existingAnytimeLogs.push(newSnapshot)
    setLocalAnytimeLogs(prev => [...prev, newSnapshot])

    const combinedCustomOutcomes: Record<string, any> = {
      ...existingCustom,
      _anytime_checkins: existingAnytimeLogs,
      latest_anytime_checkin: newSnapshot
    }

    activeAnytimeDimensions.forEach(dim => {
      if (daytimeTouchedOutcomes[dim.id] && newSnapshot[dim.id] !== undefined) {
        combinedCustomOutcomes[`daytime_${dim.id}`] = newSnapshot[dim.id]
      }
    })

    if (daytimeTouchedOutcomes.skin) combinedCustomOutcomes.daytime_skin_clarity = daytimeSkin
    if (daytimeTouchedOutcomes.focus) combinedCustomOutcomes.daytime_focus_score = daytimeFocus
    if (daytimeTouchedOutcomes.mood) combinedCustomOutcomes.daytime_mood = daytimeMood
    if (daytimeTouchedOutcomes.energy) combinedCustomOutcomes.daytime_energy = daytimeEnergy
    if (daytimeTouchedOutcomes.stress) combinedCustomOutcomes.daytime_stress = daytimeStress

    // CRITICAL: Preserve morning check-in values 100% intact!
    // NEVER overwrite initialData.mood_0_10, energy_0_10, stress_0_10, subjective_sleep_0_10 with daytime values!
    onSave(
      initialData?.mood_0_10 ?? mood, 
      initialData?.energy_0_10 ?? energy, 
      initialData?.stress_0_10 ?? stress, 
      initialData?.subjective_sleep_0_10 ?? subjectiveSleep, 
      initialData?.sleep_score_0_100 ?? (sleepScore === '' ? undefined : Number(sleepScore)), 
      combinedCustomOutcomes, 
      lastFoodTime,
      actualBedtime,
      actualWakeTime,
      actualSleepMinutes,
      sleepSource
    )

    setDaytimeSavedToast(true)
    setTimeout(() => setDaytimeSavedToast(false), 3000)
    setShowDaytimeCard(false)
  }

  const handleQuickOutcomeSave = async (outcomeId: string, newValue: number) => {
    // 1. Immediately update daytime states so everything in memory reflects instantly
    if (outcomeId === 'mood') setDaytimeMood(newValue)
    if (outcomeId === 'energy') setDaytimeEnergy(newValue)
    if (outcomeId === 'stress') setDaytimeStress(newValue)
    if (outcomeId === 'focus' || outcomeId === 'focus_score') setDaytimeFocus(newValue)
    if (outcomeId === 'skin' || outcomeId === 'skin_clarity') setDaytimeSkin(newValue)
    setDaytimeCustomValues(prev => ({ ...prev, [outcomeId]: newValue }))
    setDaytimeTouchedOutcomes(prev => ({ ...prev, [outcomeId]: true }))

    const existingCustom = (initialData as any)?.custom_outcomes_jsonb || {}
    const existingAnytimeLogs = Array.isArray(existingCustom._anytime_checkins) ? [...existingCustom._anytime_checkins] : []
    
    const nowIso = new Date().toISOString()
    const nowDisplay = format(new Date(), 'h:mm a')

    const newSnapshot: Record<string, any> = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `anytime_${Date.now()}`,
      timestamp: nowIso,
      time_display: nowDisplay,
      [outcomeId]: newValue
    }

    existingAnytimeLogs.push(newSnapshot)
    setLocalAnytimeLogs(prev => [...prev, newSnapshot])

    const combinedCustomOutcomes: Record<string, any> = {
      ...existingCustom,
      _anytime_checkins: existingAnytimeLogs,
      latest_anytime_checkin: newSnapshot,
      [`daytime_${outcomeId}`]: newValue
    }

    onSave(
      initialData?.mood_0_10 ?? mood, 
      initialData?.energy_0_10 ?? energy, 
      initialData?.stress_0_10 ?? stress, 
      initialData?.subjective_sleep_0_10 ?? subjectiveSleep, 
      initialData?.sleep_score_0_100 ?? (sleepScore === '' ? undefined : Number(sleepScore)), 
      combinedCustomOutcomes, 
      lastFoodTime,
      actualBedtime,
      actualWakeTime,
      actualSleepMinutes,
      sleepSource
    )

    setDaytimeSavedToast(true)
    setTimeout(() => setDaytimeSavedToast(false), 3000)
  }

  if (isFutureDate) {
    return null // Do not show checkin for future dates
  }

  if (isPastDate && !isEditing) {
    const moodVal = initialData?.mood_0_10 ?? null
    const energyVal = initialData?.energy_0_10 ?? null
    const stressVal = initialData?.stress_0_10 ?? null
    const sleepVal = initialData?.subjective_sleep_0_10 ?? null

    const moodCfg = moodVal != null ? getOutcomeColorConfig(moodVal, 'higher_is_better') : null
    const energyCfg = energyVal != null ? getOutcomeColorConfig(energyVal, 'higher_is_better') : null
    const stressCfg = stressVal != null ? getOutcomeColorConfig(stressVal, 'lower_is_better') : null
    const sleepCfg = sleepVal != null ? getOutcomeColorConfig(sleepVal, 'higher_is_better') : null

    const customJSON = (initialData as any)?.custom_outcomes_jsonb || {}
    const sleepScoreVal = initialData?.sleep_score_0_100 ?? null
    const lastFoodVal = initialData?.last_food_time ?? null

    return (
      <div className="glass-card py-2.5 px-3 sm:px-4 rounded-xl mb-4 border border-levl-accent/20 bg-slate-950/60 shadow-xl space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider flex items-center gap-2 truncate">
            <div className={`w-2 h-2 rounded-full shrink-0 ${initialData ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-amber-400'}`} />
            <span className="truncate">Wellbeing Check-in ({date.toLocaleDateString()})</span>
          </h3>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-[11px] font-semibold text-emerald-300 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
          >
            ✏️ {isSaved ? 'Edit' : 'Log'}
          </button>
        </div>

        {initialData ? (
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-xs">
              {/* MOOD CARD */}
              <div 
                className={`py-1.5 px-1 sm:p-2 rounded-lg border text-center transition-all ${moodCfg ? moodCfg.borderColor : 'border-white/10'}`}
                style={{ backgroundColor: moodCfg ? `${moodCfg.accentHex}15` : 'rgba(0,0,0,0.3)' }}
              >
                <div className="flex items-center justify-center gap-1 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                  <span>Mood</span>
                  {moodCfg && (
                    <span className={`text-[8px] font-bold px-1 py-0.2 rounded hidden sm:inline ${moodCfg.badgeBg}`}>
                      {moodCfg.qualityLabel}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                  <span className={`font-mono font-black text-sm sm:text-base ${moodCfg ? moodCfg.textColor : 'text-white'}`}>
                    {moodVal != null ? moodVal : '—'}
                  </span>
                  <span className="text-gray-500 text-[10px] font-mono">/10</span>
                </div>
              </div>

              {/* ENERGY CARD */}
              <div 
                className={`py-1.5 px-1 sm:p-2 rounded-lg border text-center transition-all ${energyCfg ? energyCfg.borderColor : 'border-white/10'}`}
                style={{ backgroundColor: energyCfg ? `${energyCfg.accentHex}15` : 'rgba(0,0,0,0.3)' }}
              >
                <div className="flex items-center justify-center gap-1 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                  <span>Energy</span>
                  {energyCfg && (
                    <span className={`text-[8px] font-bold px-1 py-0.2 rounded hidden sm:inline ${energyCfg.badgeBg}`}>
                      {energyCfg.qualityLabel}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                  <span className={`font-mono font-black text-sm sm:text-base ${energyCfg ? energyCfg.textColor : 'text-white'}`}>
                    {energyVal != null ? energyVal : '—'}
                  </span>
                  <span className="text-gray-500 text-[10px] font-mono">/10</span>
                </div>
              </div>

              {/* STRESS CARD */}
              <div 
                className={`py-1.5 px-1 sm:p-2 rounded-lg border text-center transition-all ${stressCfg ? stressCfg.borderColor : 'border-white/10'}`}
                style={{ backgroundColor: stressCfg ? `${stressCfg.accentHex}15` : 'rgba(0,0,0,0.3)' }}
              >
                <div className="flex items-center justify-center gap-1 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                  <span>Stress</span>
                  {stressCfg && (
                    <span className={`text-[8px] font-bold px-1 py-0.2 rounded hidden sm:inline ${stressCfg.badgeBg}`}>
                      {stressCfg.qualityLabel}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                  <span className={`font-mono font-black text-sm sm:text-base ${stressCfg ? stressCfg.textColor : 'text-white'}`}>
                    {stressVal != null ? stressVal : '—'}
                  </span>
                  <span className="text-gray-500 text-[10px] font-mono">/10</span>
                </div>
              </div>

              {/* SLEEP CARD */}
              <div 
                className={`py-1.5 px-1 sm:p-2 rounded-lg border text-center transition-all ${sleepCfg ? sleepCfg.borderColor : 'border-white/10'}`}
                style={{ backgroundColor: sleepCfg ? `${sleepCfg.accentHex}15` : 'rgba(0,0,0,0.3)' }}
              >
                <div className="flex items-center justify-center gap-1 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                  <span>Sleep</span>
                  {sleepCfg && (
                    <span className={`text-[8px] font-bold px-1 py-0.2 rounded hidden sm:inline ${sleepCfg.badgeBg}`}>
                      {sleepCfg.qualityLabel}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                  <span className={`font-mono font-black text-sm sm:text-base ${sleepCfg ? sleepCfg.textColor : 'text-white'}`}>
                    {sleepVal != null ? sleepVal : '—'}
                  </span>
                  <span className="text-gray-500 text-[10px] font-mono">/10</span>
                </div>
              </div>
            </div>

            {/* Optional secondary metrics & exposures if present */}
            {(actualSleepMinutes > 0 || sleepScoreVal != null || lastFoodVal || customJSON.skin_clarity != null || customJSON.focus_score != null || customJSON.alcohol_drinks !== undefined || (customJSON.cannabis_exposure && customJSON.cannabis_exposure !== 'skip') || (customJSON.nicotine_exposure && customJSON.nicotine_exposure !== 'skip') || (customJSON.late_caffeine && customJSON.late_caffeine !== 'skip') || (customJSON.blue_light && customJSON.blue_light !== 'skip') || (customJSON.late_meal && customJSON.late_meal !== 'skip')) && (
              <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
                {actualSleepMinutes > 0 && (
                  <span className={`px-2.5 py-1 rounded-lg border font-mono font-semibold flex items-center gap-1.5 ${
                    actualSleepMinutes < 390 
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' 
                      : actualSleepMinutes < 450 
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' 
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  }`}>
                    🌙 Sleep: <strong className="text-white">{formatMinutesToDuration(actualSleepMinutes)}</strong>
                    <span className="text-[9px] opacity-75">({formatTimeTo12h(actualBedtime)} – {formatTimeTo12h(actualWakeTime)})</span>
                  </span>
                )}
                {sleepScoreVal != null && (
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono font-semibold flex items-center gap-1.5">
                    🌙 Wearable Score: <strong className="text-white">{sleepScoreVal}/100</strong>
                  </span>
                )}
                {lastFoodVal && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono font-semibold flex items-center gap-1.5">
                    🍽️ Last Food: <strong className="text-white">{lastFoodVal}</strong>
                  </span>
                )}
                {customJSON.skin_clarity != null && (
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono font-semibold flex items-center gap-1.5">
                    ✨ Skin: <strong className="text-white">{customJSON.skin_clarity}/10</strong>
                  </span>
                )}
                {customJSON.focus_score != null && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-semibold flex items-center gap-1.5">
                    ⚡ Focus: <strong className="text-white">{customJSON.focus_score}/10</strong>
                  </span>
                )}
                {customJSON.alcohol_drinks !== undefined && customJSON.alcohol_drinks !== 'skip' && (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono font-semibold flex items-center gap-1.5">
                    🍷 Alcohol: <strong className="text-white">{customJSON.alcohol_drinks} drinks</strong>
                  </span>
                )}
                {customJSON.cannabis_exposure && customJSON.cannabis_exposure !== 'skip' && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-semibold flex items-center gap-1.5">
                    🌿 Cannabis: <strong className="text-white">{customJSON.cannabis_exposure}</strong>
                  </span>
                )}
                {customJSON.nicotine_exposure && customJSON.nicotine_exposure !== 'skip' && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono font-semibold flex items-center gap-1.5">
                    🚬 Nicotine: <strong className="text-white">{customJSON.nicotine_exposure}</strong>
                  </span>
                )}
                {customJSON.late_caffeine && customJSON.late_caffeine !== 'skip' && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-semibold flex items-center gap-1.5">
                    ☕ Last Caffeine: <strong className="text-white">{customJSON.late_caffeine.startsWith('time:') ? customJSON.late_caffeine.replace('time:', '') : `${customJSON.late_caffeine}h before bed`}</strong>
                  </span>
                )}
                {customJSON.blue_light && customJSON.blue_light !== 'skip' && (
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono font-semibold flex items-center gap-1.5">
                    📱 Last Screen: <strong className="text-white">{customJSON.blue_light.startsWith('time:') ? customJSON.blue_light.replace('time:', '') : `${customJSON.blue_light}h before bed`}</strong>
                  </span>
                )}
                {customJSON.late_meal && customJSON.late_meal !== 'skip' && (
                  <span className="px-2.5 py-1 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 font-mono font-semibold flex items-center gap-1.5">
                    🍟 Last Meal: <strong className="text-white">{typeof customJSON.late_meal === 'string' && customJSON.late_meal.startsWith('time:') ? customJSON.late_meal.replace('time:', '') : `${customJSON.late_meal}h before bed`}</strong>
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">No check-in recorded yet for {date.toLocaleDateString()}. Tap &apos;Log Past Check-in&apos; above to fill it in retroactively.</p>
        )}
      </div>
    )
  }

  const phaseTitle = isCurrentDay ? 'Morning Check-in' : `Check-in for ${date.toLocaleDateString()}`

  const currentMoodCfg = getOutcomeColorConfig(mood, 'higher_is_better')
  const currentEnergyCfg = getOutcomeColorConfig(energy, 'higher_is_better')
  const currentStressCfg = getOutcomeColorConfig(stress, 'lower_is_better')
  const currentSleepCfg = getOutcomeColorConfig(subjectiveSleep, 'higher_is_better')

  if (section === 'nightly' && !isNightlyAvailable) {
    return null
  }

  return (
    <>
      {/* ⚡ CONNECTED CONTAINER: Top Row (Morning Check-in Status / Edit) + Current State 4-Box Grid */}
      {(section === 'all' || section === 'morning_anytime') && (
        (isSaved && !isEditing) || isCollapsedAll ? (
          <div className="glass-card mb-4 rounded-2xl border border-emerald-500/30 bg-slate-950/70 shadow-xl overflow-hidden animate-in fade-in">
            {/* SMALL CONNECTED ROW DIRECTLY ABOVE: Morning Check-in Status & Edit */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-black/40 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSaved ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className="font-bold text-white text-xs">
                  {isSaved ? '☀️ Morning Check-in: Complete' : '☀️ Morning Check-in: Pending'}
                </span>
                {isSaved && (
                  <span className="text-[10px] text-gray-400 font-mono hidden xs:inline">
                    (Mood: {mood}, Energy: {energy}, Stress: {stress})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCollapsedAll(false)
                    setIsEditing(true)
                  }}
                  className="text-[11px] font-semibold text-emerald-300 hover:text-white bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>{isSaved ? '✏ Edit Check-in' : 'Log Morning Check-in'}</span>
                </button>
              </div>
            </div>

            {/* Compact Evening Check-in Jump Cue when available */}
            {isNightlyAvailable && (
              <div 
                onClick={() => {
                  setShowNightlyCard(true)
                  const el = document.getElementById('evening-checkin-section')
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                }}
                className={`flex items-center justify-between px-3 sm:px-4 py-2.5 border-b text-xs cursor-pointer transition-all group shadow-sm select-none ${
                  isNightlySaved 
                    ? 'bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-950 border-emerald-500/20 hover:bg-emerald-950/60' 
                    : 'bg-gradient-to-r from-rose-950/70 via-purple-950/40 to-slate-950 border-rose-500/30 hover:bg-rose-950/90'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    {!isNightlySaved && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isNightlySaved ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
                  </span>
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Moon size={13} className={isNightlySaved ? "text-emerald-400" : "text-rose-400"} /> 
                    {isNightlySaved 
                      ? (isPastDate ? `Evening Check-in Logged (${format(date, 'MMM d')})` : "Evening Check-in Complete") 
                      : (isPastDate ? `Evening Check-in Pending (${format(date, 'MMM d')})` : "Evening Check-in Available")}
                  </span>
                  <span className="text-[10px] text-gray-400 hidden sm:inline font-medium">
                    {isNightlySaved 
                      ? "(Tap to review or edit your evening reflections)" 
                      : (isPastDate ? "(Log your day review, sleep factors & reflections)" : "(~3h before bedtime · Decompression & day review)")}
                  </span>
                </div>
                <span className={`text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                  isNightlySaved ? 'text-emerald-300 group-hover:text-white' : 'text-rose-300 group-hover:text-white'
                }`}>
                  <span>{isNightlySaved ? "Edit Evening Check-in" : "Log Evening Check-in"}</span>
                  <ArrowDown size={12} className={`group-hover:translate-y-0.5 transition-transform ${
                    isNightlySaved ? 'text-emerald-400 group-hover:text-white' : 'text-rose-400 group-hover:text-white'
                  }`} />
                </span>
              </div>
            )}

            {/* CURRENT STATE SECTION */}
          <div className="p-3 sm:p-4 space-y-2.5">
            {/* Top Header */}
            <div className="flex items-center justify-between gap-2">
              <div 
                className="flex items-center gap-2 min-w-0 cursor-pointer group"
                onClick={() => setIsCurrentStateExpanded(!isCurrentStateExpanded)}
                title="Click to toggle trend details"
              >
                <span className="text-white font-black text-xs sm:text-sm tracking-wide">
                  {isCurrentDay ? 'Current State' : 'Daily Wellbeing Snapshot'}
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono tracking-wider uppercase inline-flex items-center gap-1">
                  <Activity size={10} className="animate-pulse" /> Live
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setOutcomesModalTitle("Customize Tracked Outcomes")
                    setOutcomesModalMode("anytime")
                    setIsOutcomesModalOpen(true)
                  }}
                  className="text-[11px] font-semibold text-gray-300 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                  title="Edit which bio-signals are tracked in Current State"
                >
                  <Sliders size={12} /> <span className="hidden sm:inline">Tracked Outcomes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCurrentStateExpanded(!isCurrentStateExpanded)}
                  className="text-[11px] font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title={isCurrentStateExpanded ? "Collapse trend details" : "Expand trend details"}
                >
                  {isCurrentStateExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  <span className="hidden xs:inline">{isCurrentStateExpanded ? 'Less' : 'Trends'}</span>
                </button>
              </div>
            </div>
            
            {/* Outcome Boxes Grid: ALWAYS 4 WIDE (grid-cols-4) */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-xs">
              {activeAnytimeDimensions.map(outcome => {
                const liveState = liveStateMap[outcome.id] || getLatestOutcomeLiveState(outcome.id, initialData, recentTasks, allOutcomes)
                const val = liveState.currentValue ?? 5
                const colorCfg = getOutcomeColorConfig(val, liveState.directionality)
                const delta = liveState.delta

                return (
                  <div 
                    key={outcome.id}
                    onClick={() => {
                      setQuickModalOutcome(liveState)
                      setIsQuickModalOpen(true)
                    }}
                    className={`py-1.5 px-1.5 sm:py-2 sm:px-2 rounded-xl border text-center transition-all cursor-pointer group hover:scale-[1.02] active:scale-95 relative overflow-hidden flex flex-col items-center justify-center ${colorCfg.borderColor}`}
                    style={{ backgroundColor: `${colorCfg.accentHex}16` }}
                    title={`Click to adjust ${liveState.name}`}
                  >
                    {/* Outcome Name */}
                    <div className="w-full text-center">
                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-300 group-hover:text-white transition-colors truncate block leading-tight">
                        {liveState.name}
                      </span>
                    </div>

                    {/* Score Number with Colored Accent */}
                    <div className="mt-0.5 flex items-baseline justify-center gap-0.5 leading-none">
                      <span className={`font-mono font-black text-sm sm:text-lg ${colorCfg.textColor}`}>
                        {liveState.currentValue != null ? liveState.currentValue : '—'}
                      </span>
                      <span className="text-gray-500 text-[8px] sm:text-[9px] font-mono">/10</span>
                    </div>

                    {/* If expanded, show trend delta and source */}
                    {isCurrentStateExpanded && (
                      <div className="w-full pt-1 mt-1 border-t border-white/10 space-y-0.5 animate-in fade-in">
                        {delta !== 0 && liveState.morningBaseline != null ? (
                          <div className="flex items-center justify-center text-[8px] sm:text-[9px] font-mono font-bold">
                            <span className={`flex items-center gap-0.5 px-1 py-0.2 rounded border ${
                              (liveState.directionality === 'higher_is_better' ? delta > 0 : delta < 0)
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}>
                              {delta > 0 ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
                              {delta > 0 ? `+${delta}` : delta} vs AM
                            </span>
                          </div>
                        ) : (
                          <div className="text-[8px] sm:text-[9px] font-mono text-slate-400 truncate">
                            {liveState.morningBaseline != null ? `AM: ${liveState.morningBaseline}` : 'Unrecorded'}
                          </div>
                        )}
                        <div className="text-[8px] text-slate-400 truncate px-0.5" title={liveState.sourceLabel}>
                          {liveState.sourceLabel}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Expanded Section Footer with Shortcuts */}
            {isCurrentStateExpanded && (
              <div className="pt-2 mt-1 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 text-[11px] animate-in fade-in">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Sparkles size={12} className="text-purple-400" />
                  <span>Tap any box to adjust that single bio-signal in 1 tap.</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOutcomesModalTitle("Customize Tracked Outcomes")
                      setOutcomesModalMode("anytime")
                      setIsOutcomesModalOpen(true)
                    }}
                    className="text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders size={12} /> Customize Outcomes ({activeAnytimeDimensions.length})
                  </button>
                </div>
              </div>
            )}

          {/* Optional compact secondary chips if logged */}
          {(sleepScore || (isSaved && (skinClarity !== 5 || focusScore !== 5 || alcoholDrinks !== 'skip' || lateCaffeine !== 'skip' || lateMeal !== 'skip' || blueLight !== 'skip'))) && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[10px]">
              {sleepScore && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono font-semibold">
                  🌙 Sleep: <strong className="text-white">{sleepScore}/100</strong>
                </span>
              )}
              {isSaved && skinClarity !== 5 && (
                <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono font-semibold">
                  ✨ Skin: <strong className="text-white">{skinClarity}/10</strong>
                </span>
              )}
              {isSaved && focusScore !== 5 && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-semibold">
                  ⚡ Focus: <strong className="text-white">{focusScore}/10</strong>
                </span>
              )}
              {isSaved && alcoholDrinks !== 'skip' && (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono font-semibold">
                  🍷 {alcoholDrinks} drinks
                </span>
              )}
            </div>
          )}

          {/* ☀️ ANYTIME CHECK-IN (Between Morning & Nightly) */}
          {isCurrentDay && !isNightly && (() => {
            const customJSON = (initialData as any)?.custom_outcomes_jsonb || {}
            const anytimeLogs = Array.isArray(customJSON._anytime_checkins) ? customJSON._anytime_checkins : []

            return (
              <div className="pt-2.5 mt-2 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sun size={14} className="text-white shrink-0" />
                    <span className="text-white font-bold text-xs truncate">
                      Anytime Check-in
                    </span>
                    {anytimeLogs.length > 0 && (
                      <span className="text-[10px] font-medium text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full shrink-0">
                        {anytimeLogs.length} {anytimeLogs.length === 1 ? 'logged' : 'logged'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {daytimeSavedToast && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30 animate-in fade-in">
                        ✓ Snapshot Saved!
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setOutcomesModalTitle("Customize Anytime Tracked Outcomes")
                        setOutcomesModalMode("anytime")
                        setIsOutcomesModalOpen(true)
                      }}
                      className="text-[11px] font-semibold text-gray-300 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      title="Edit tracked outcomes"
                    >
                      <Sliders size={11} /> <span className="hidden sm:inline">Tracked Outcomes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDaytimeCard(!showDaytimeCard)}
                      className="text-[11px] font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      {showDaytimeCard ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      <span>{showDaytimeCard ? 'Close' : 'Log Snapshot'}</span>
                    </button>
                  </div>
                </div>

                {/* Anytime Voice Bar (Only visible when Anytime check-in is opened) */}
                {showDaytimeCard && (
                  <div className="pt-1 pb-1">
                    <UnifiedVoiceBar
                      mode="anytime"
                      localUserId={effectiveUserId}
                      dateStr={dStr}
                      placeholder="🎙️ Speak daytime state snapshot, notes, or hotkeys..."
                      onApplyParsedData={(data) => handleApplyVoiceData(data, 'anytime')}
                    />
                  </div>
                )}

                {showDaytimeCard && anytimeLogs.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 pb-1 border-b border-white/10">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock size={10} className="text-slate-400" />
                      <span>Today ({anytimeLogs.length}):</span>
                    </span>
                    {anytimeLogs.map((entry: any, idx: number) => (
                      <span key={entry.id || idx} className="text-[10px] bg-slate-900 border border-white/10 px-2 py-0.5 rounded-lg text-slate-300 font-mono flex items-center gap-1.5 shadow-sm">
                        <span className="text-slate-200 font-bold">{entry.time_display || 'Snapshot'}</span>
                        {entry.mood !== undefined && <span>Mood <strong className="text-white">{entry.mood}</strong></span>}
                        {entry.energy !== undefined && <span>Energy <strong className="text-white">{entry.energy}</strong></span>}
                        {entry.stress !== undefined && <span>Stress <strong className="text-white">{entry.stress}</strong></span>}
                        {entry.focus !== undefined && <span>Focus <strong className="text-white">{entry.focus}</strong></span>}
                      </span>
                    ))}
                  </div>
                )}

                {showDaytimeCard && (
                  <div className="space-y-3 pt-3 mt-2 border-t border-amber-500/20 animate-in fade-in">
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Sliders start at your last recorded value if logged within the past 2 hours. Tap any value pill to confirm without sliding:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeAnytimeDimensions.map(dim => {
                        const isTouched = Boolean(daytimeTouchedOutcomes[dim.id])
                        const snap = getRecentOutcomeSnapshot(dim.id, effectiveCheckinData)

                        let currentValue = 5
                        if (dim.id === 'mood') currentValue = daytimeMood
                        else if (dim.id === 'energy') currentValue = daytimeEnergy
                        else if (dim.id === 'stress') currentValue = daytimeStress
                        else if (dim.id === 'focus' || dim.id === 'focus_score') currentValue = daytimeFocus
                        else if (daytimeCustomValues[dim.id] !== undefined) currentValue = daytimeCustomValues[dim.id]
                        else if (snap.value !== undefined) currentValue = snap.value

                        const isLowerBetter = dim.directionality === 'lower_is_better'
                        const colorCfg = isTouched 
                          ? getOutcomeColorConfig(currentValue, isLowerBetter ? 'lower_is_better' : 'higher_is_better') 
                          : getNeutralOutcomeColorConfig()

                        const setValue = (val: number) => {
                          if (dim.id === 'mood') setDaytimeMood(val)
                          else if (dim.id === 'energy') setDaytimeEnergy(val)
                          else if (dim.id === 'stress') setDaytimeStress(val)
                          else if (dim.id === 'focus' || dim.id === 'focus_score') setDaytimeFocus(val)
                          else setDaytimeCustomValues(prev => ({ ...prev, [dim.id]: val }))
                          setDaytimeTouchedOutcomes(prev => ({ ...prev, [dim.id]: true }))
                        }

                        const toggleTouched = () => {
                          setDaytimeTouchedOutcomes(prev => ({ ...prev, [dim.id]: !prev[dim.id] }))
                        }

                        const lowLabel = isLowerBetter ? '0: Best (Calm/None)' : '0: Low / Poor'
                        const highLabel = isLowerBetter ? '10: Worst (Severe)' : '10: Peak / Great'

                        return (
                          <div 
                            key={dim.id}
                            className={`p-3 rounded-xl border space-y-2 transition-all ${isTouched ? colorCfg.borderColor : 'border-white/10'}`}
                            style={{ backgroundColor: isTouched ? `${colorCfg.accentHex}12` : 'rgba(0,0,0,0.4)' }}
                          >
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="text-white font-bold">{dim.name}</span>
                                {snap.isRecent && !isTouched && (
                                  <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono">
                                    Recent ({snap.timeAgoMinutes}m ago)
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={toggleTouched}
                                className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all group"
                                title="Click to confirm this value without sliding"
                              >
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${isTouched ? colorCfg.badgeBg : 'bg-white/5 border-white/15 text-slate-400 group-hover:border-white/30'}`}>
                                  {isTouched ? colorCfg.qualityLabel : 'Unconfirmed (Tap)'}
                                </span>
                                <span className={`font-mono font-bold text-xs ${isTouched ? colorCfg.textColor : 'text-slate-400'}`}>
                                  {currentValue}/10
                                </span>
                              </button>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="10" 
                              value={currentValue} 
                              onChange={(e) => setValue(parseInt(e.target.value))} 
                              onPointerDown={() => {
                                if (!isTouched) {
                                  setDaytimeTouchedOutcomes(prev => ({ ...prev, [dim.id]: true }))
                                }
                              }}
                              onClick={() => {
                                if (!isTouched) {
                                  setDaytimeTouchedOutcomes(prev => ({ ...prev, [dim.id]: true }))
                                }
                              }}
                              className="w-full cursor-pointer touch-manipulation" 
                              style={{ accentColor: colorCfg.accentHex }}
                              title={isTouched ? `${dim.name}: ${currentValue}/10 (Confirmed)` : 'Click dot to confirm 5/10, or drag to adjust'}
                            />
                            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                              <span className={isLowerBetter ? "text-emerald-400" : "text-red-400"}>{lowLabel}</span>
                              <span className={isLowerBetter ? "text-red-400" : "text-emerald-400"}>{highLabel}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowDaytimeCard(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDaytimeSave}
                        className="px-4 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <Sun size={13} />
                        <span>Save Daytime Snapshot</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
          </div>
        </div>
      ) : (
        <div className="glass-card p-4 rounded-xl mb-6 space-y-6 border border-levl-accent/20">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <h3 className="font-bold text-sm text-white uppercase tracking-wider">{phaseTitle}</h3>
        </div>
        
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => {
              setOutcomesModalTitle("Customize Morning Tracked Outcomes")
              setOutcomesModalMode("morning")
              setIsOutcomesModalOpen(true)
            }}
            className="text-xs font-bold text-gray-200 bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Sliders size={14} /> Edit Tracked Outcomes
          </button>

          {isCurrentDay && (
            <button
              type="button"
              onClick={() => {
                setShowSleepSection(true)
                setShowLastNightExposures(prev => !prev)
              }}
              className="text-xs font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-3.5 py-1.5 rounded-lg hover:bg-indigo-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Moon size={14} /> {showLastNightExposures ? "Hide Last Night's Exposures" : (isNightlySaved ? "Edit Last Night's Exposures" : "Log Last Night's Exposures")}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsedAll(true)}
            className="text-xs font-bold text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ml-auto"
          >
            <ChevronUp size={14} /> Collapse All
          </button>
        </div>
      </div>

      {/* Compact Evening Check-in Jump Cue when available & uncompleted */}
      {isNightlyAvailable && !isNightlySaved && (
        <div 
          onClick={() => {
            setShowNightlyCard(true)
            const el = document.getElementById('evening-checkin-section')
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }}
          className="mb-3 p-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-950/70 via-purple-950/40 to-slate-950 border border-rose-500/30 text-xs cursor-pointer hover:bg-rose-950/90 transition-all flex items-center justify-between group shadow-sm select-none"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="font-bold text-white text-xs flex items-center gap-1.5">
              <Moon size={13} className="text-rose-400" /> {isPastDate ? `Evening Check-in for ${format(date, 'MMM d')}` : "Evening Check-in Available"}
            </span>
            <span className="text-[10px] text-rose-300/80 hidden sm:inline font-medium">
              {isPastDate ? "(Log past day review & reflections)" : "(~3h before bedtime · Decompression & day review)"}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-rose-300 group-hover:text-white flex items-center gap-1 transition-colors">
            <span>{isPastDate ? "Log Evening Check-in" : "Jump to Evening Check-in"}</span>
            <ArrowDown size={12} className="group-hover:translate-y-0.5 transition-transform text-rose-400 group-hover:text-white" />
          </span>
        </div>
      )}

      {/* Morning Mindful Reflection & Somatic Presence Prompt */}
      {morningMindfulnessPref !== 'hidden' && (
        isMindfulnessExpanded ? (
          <div className="relative mb-3">
            {morningMindfulnessPref === 'collapsed' && (
              <button
                type="button"
                onClick={() => setIsMindfulnessExpanded(false)}
                className="absolute top-3.5 right-3.5 z-10 text-[10px] font-bold text-white/80 hover:text-white bg-black/40 hover:bg-black/60 border border-white/20 px-2.5 py-0.5 rounded-lg cursor-pointer transition-all shadow-sm"
              >
                Collapse ⌃
              </button>
            )}
            <MindfulReflectionPrompt mode="morning" date={date} />
          </div>
        ) : (
          <div 
            onClick={() => setIsMindfulnessExpanded(true)}
            className="mb-3 p-3.5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-950/60 cursor-pointer hover:border-amber-400/50 transition-all flex items-center justify-between shadow-md"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-inner">
                <Sunrise size={14} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Morning Mindfulness &amp; Presence</span>
                <span className="text-[10px] text-amber-300/80">Tap to expand morning somatic reflection prompt</span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
              Reflect <ChevronDown size={14} />
            </span>
          </div>
        )
      )}

      {/* Unified Voice Bar for Open Morning Form */}
      <UnifiedVoiceBar
        mode="morning"
        localUserId={effectiveUserId}
        dateStr={dStr}
        placeholder="🎙️ Speak check-in, waking energy, or last night..."
        onApplyParsedData={(data) => handleApplyVoiceData(data, 'morning')}
      />




      
      {/* Sleep & Recovery Observations (ALWAYS VISIBLE IN BOTH NIGHTLY & MORNING MODES) */}
      <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between text-indigo-300 font-bold text-xs uppercase tracking-wider border-b border-indigo-500/20 pb-2">
          <span className="flex items-center gap-2"><Moon size={15} /> Last Night's Sleep & Recovery Quality</span>
          <button
            type="button"
            onClick={() => setShowSleepSection(!showSleepSection)}
            className="text-[10px] font-bold text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 px-2 py-0.5 rounded cursor-pointer transition-all"
          >
            {showSleepSection ? 'Collapse / Skip Section' : 'Expand Section'}
          </button>
        </div>

        {showSleepSection ? (
          <div className="space-y-4">
            {/* Actual Bedtime, Wake Time & Auto-Calculated Duration with 15-min Adjusters */}
            <div className="bg-slate-900/80 border border-indigo-500/30 rounded-xl p-3.5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon size={14} className="text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Sleep Timing &amp; Duration
                  </span>
                </div>
                {sleepSource && sleepSource !== 'manual' && (
                  <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    ⌚ Synced from {sleepSource === 'apple_health' ? 'Apple Health' : sleepSource.toUpperCase()}
                  </span>
                )}
              </div>

              {/* 3 Interactive Parameter Columns: Bedtime, Wake Time, Actual Sleep */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Bedtime */}
                <div className="bg-black/50 border border-white/10 rounded-xl p-3 flex flex-col justify-between space-y-2">
                  <span className="text-xs text-slate-300 font-semibold">Actual Bedtime</span>
                  <div className="flex items-center justify-between my-1">
                    <button 
                      type="button" 
                      onClick={() => handleAdjustBedtime(-15)} 
                      className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-slate-200 border border-white/10 transition-colors cursor-pointer active:scale-95"
                      title="15 minutes earlier"
                    >
                      -15m
                    </button>
                    <span className="text-sm sm:text-base font-black text-indigo-300 font-mono tracking-tight">{formatTimeTo12h(actualBedtime)}</span>
                    <button 
                      type="button" 
                      onClick={() => handleAdjustBedtime(15)} 
                      className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-slate-200 border border-white/10 transition-colors cursor-pointer active:scale-95"
                      title="15 minutes later"
                    >
                      +15m
                    </button>
                  </div>
                  <input 
                    type="time" 
                    value={actualBedtime} 
                    onChange={(e) => {
                      setActualBedtime(e.target.value)
                      setActualSleepMinutes(computeSleepMinutes(e.target.value, actualWakeTime))
                    }} 
                    className="w-full bg-slate-950/70 border border-white/15 rounded-lg px-2 py-1 text-xs text-slate-200 text-center font-mono focus:outline-none focus:border-indigo-400 cursor-pointer" 
                  />
                </div>

                {/* Wake Time */}
                <div className="bg-black/50 border border-white/10 rounded-xl p-3 flex flex-col justify-between space-y-2">
                  <span className="text-xs text-slate-300 font-semibold">Actual Wake Time</span>
                  <div className="flex items-center justify-between my-1">
                    <button 
                      type="button" 
                      onClick={() => handleAdjustWakeTime(-15)} 
                      className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-slate-200 border border-white/10 transition-colors cursor-pointer active:scale-95"
                      title="15 minutes earlier"
                    >
                      -15m
                    </button>
                    <span className="text-sm sm:text-base font-black text-amber-300 font-mono tracking-tight">{formatTimeTo12h(actualWakeTime)}</span>
                    <button 
                      type="button" 
                      onClick={() => handleAdjustWakeTime(15)} 
                      className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-slate-200 border border-white/10 transition-colors cursor-pointer active:scale-95"
                      title="15 minutes later"
                    >
                      +15m
                    </button>
                  </div>
                  <input 
                    type="time" 
                    value={actualWakeTime} 
                    onChange={(e) => {
                      setActualWakeTime(e.target.value)
                      setActualSleepMinutes(computeSleepMinutes(actualBedtime, e.target.value))
                    }} 
                    className="w-full bg-slate-950/70 border border-white/15 rounded-lg px-2 py-1 text-xs text-slate-200 text-center font-mono focus:outline-none focus:border-amber-400 cursor-pointer" 
                  />
                </div>

                {/* Actual Sleep Duration */}
                <div className="bg-black/50 border border-white/10 rounded-xl p-3 flex flex-col justify-between space-y-2">
                  <span className="text-xs text-slate-300 font-semibold">Actual Sleep Duration</span>
                  <div className="flex items-center justify-between my-1">
                    <button 
                      type="button" 
                      onClick={() => handleAdjustSleepDuration(-15)} 
                      className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-slate-200 border border-white/10 transition-colors cursor-pointer active:scale-95"
                      title="Deduct 15m awakenings"
                    >
                      -15m
                    </button>
                    <span className={`text-sm sm:text-base font-black font-mono tracking-tight ${
                      actualSleepMinutes < 390 ? 'text-rose-400' : actualSleepMinutes < 450 ? 'text-amber-300' : 'text-emerald-400'
                    }`}>
                      {formatMinutesToDuration(actualSleepMinutes)}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => handleAdjustSleepDuration(15)} 
                      className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-slate-200 border border-white/10 transition-colors cursor-pointer active:scale-95"
                      title="Add 15m sleep"
                    >
                      +15m
                    </button>
                  </div>
                  <div className={`text-[11px] text-center font-mono font-bold py-1 px-2 rounded-md ${
                    actualSleepMinutes < 390 ? 'text-rose-400 bg-rose-950/40 border border-rose-500/20' : actualSleepMinutes < 450 ? 'text-amber-300 bg-amber-950/40 border border-amber-500/20' : 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/20'
                  }`}>
                    {actualSleepMinutes < 390 ? '⚠️ Sleep Deficit' : actualSleepMinutes < 450 ? '🟡 Moderate Sleep' : '🟢 Optimal Recovery'}
                  </div>
                </div>
              </div>
            </div>

            {/* Subjective Sleep Quality */}
            {(() => {
              const isTouched = touchedOutcomes['sleep']
              const colorCfg = isTouched ? getOutcomeColorConfig(subjectiveSleep, 'higher_is_better') : getNeutralOutcomeColorConfig()
              return (
                <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white font-bold">Overall Sleep Quality</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${colorCfg.badgeBg}`}>
                        {colorCfg.qualityLabel}
                      </span>
                      <span className={`font-mono font-bold text-xs ${colorCfg.textColor}`}>{subjectiveSleep}/10</span>
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    value={subjectiveSleep} 
                    onChange={(e) => {
                      setSubjectiveSleep(parseInt(e.target.value))
                      setTouchedOutcomes(prev => ({ ...prev, sleep: true }))
                    }} 
                    onPointerDown={() => {
                      if (!isTouched) {
                        setTouchedOutcomes(prev => ({ ...prev, sleep: true }))
                      }
                    }}
                    onClick={() => {
                      if (!isTouched) {
                        setTouchedOutcomes(prev => ({ ...prev, sleep: true }))
                      }
                    }}
                    className="w-full cursor-pointer touch-manipulation" 
                    style={{ accentColor: colorCfg.accentHex }}
                    title={isTouched ? `Sleep Quality: ${subjectiveSleep}/10 (Confirmed)` : 'Click dot to confirm 5/10, or drag to adjust'}
                  />
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                    <span className="text-red-400">0: Poor / Restless</span>
                    <span className="text-emerald-400">10: Deep / Restorative</span>
                  </div>
                </div>
              )
            })()}

            {/* Additional Sleep Outcomes (Sleep Latency, Night Waking, REM/Deep) */}
            {sleepOutcomes.filter(o => o.id !== 'sleep_quality' && o.id !== 'subjective_sleep').map(outcome => {
              const val = customOutcomeValues[outcome.id] ?? 5
              const isTouched = touchedOutcomes[outcome.id]
              const colorCfg = isTouched ? getOutcomeColorConfig(val, outcome.directionality) : getNeutralOutcomeColorConfig()
              const isLowerBetter = outcome.directionality === 'lower_is_better'

              return (
                <div key={outcome.id} className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white font-bold">{outcome.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${colorCfg.badgeBg}`}>
                        {colorCfg.qualityLabel}
                      </span>
                      <span className={`font-mono font-bold text-xs ${colorCfg.textColor}`}>{val}/10</span>
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    value={val} 
                    onChange={(e) => {
                      const newVal = parseInt(e.target.value)
                      setCustomOutcomeValues(prev => ({ ...prev, [outcome.id]: newVal }))
                      setTouchedOutcomes(prev => ({ ...prev, [outcome.id]: true }))
                    }} 
                    onPointerDown={() => {
                      if (!isTouched) {
                        setTouchedOutcomes(prev => ({ ...prev, [outcome.id]: true }))
                      }
                    }}
                    onClick={() => {
                      if (!isTouched) {
                        setTouchedOutcomes(prev => ({ ...prev, [outcome.id]: true }))
                      }
                    }}
                    className="w-full cursor-pointer touch-manipulation" 
                    style={{ accentColor: colorCfg.accentHex }}
                    title={isTouched ? `${outcome.name}: ${val}/10 (Confirmed)` : 'Click dot to confirm 5/10, or drag to adjust'}
                  />
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                    <span className={isLowerBetter ? 'text-emerald-400' : 'text-red-400'}>
                      0: {isLowerBetter ? 'Fast (<10m)' : 'Poor'}
                    </span>
                    <span className={isLowerBetter ? 'text-red-400' : 'text-emerald-400'}>
                      10: {isLowerBetter ? 'Delayed (>60m)' : 'Peak'}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Objective Sleep Score (0-100) */}
            <div className="space-y-1 bg-black/40 p-3.5 rounded-xl border border-white/10">
              <div className="flex justify-between text-xs items-center mb-1">
                <span className="text-white font-bold">Objective Sleep Score (0-100)</span> 
              </div>
              <input 
                type="number" 
                min="0" 
                max="100" 
                value={sleepScore} 
                onChange={(e) => setSleepScore(e.target.value)} 
                placeholder="e.g. 85 (from Oura, Apple Health, Whoop)" 
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-levl-accent font-mono" 
              />
            </div>

            {/* 🚫 Expandable Last Night's Exposures & Lifestyle Factors (Morning Check-in) */}
            {!isNightly && (
              <div className="pt-3 border-t border-indigo-500/20 space-y-3">
                <div 
                  onClick={() => setShowLastNightExposures(!showLastNightExposures)}
                  className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-indigo-500/40 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🚫</span>
                    <div>
                      <h5 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                        Last Night's Exposures &amp; Lifestyle Factors
                      </h5>
                      <p className="text-[10px] text-gray-400">Track alcohol, THC, late caffeine, screen time, and meals</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOutcomesModalTitle("Customize Tracked Exposures & Outcomes")
                        setOutcomesModalMode("morning")
                        setIsOutcomesModalOpen(true)
                      }}
                      className="text-[10px] font-bold text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 transition-colors"
                    >
                      <Sliders size={11} /> Edit Tracked Items
                    </button>
                    <span className="text-xs text-indigo-300 font-bold flex items-center gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
                      {showLastNightExposures ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </span>
                  </div>
                </div>

                {showLastNightExposures && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs pt-1 animate-in fade-in">
                    {/* Alcohol */}
                    {isExposureTracked('alcohol_drinks') && (
                      <div className="bg-black/40 p-2.5 rounded-lg border border-white/10 space-y-1">
                        <label className="font-bold text-white block">🍷 Alcohol Intake</label>
                        <select
                          value={alcoholDrinks}
                          onChange={(e) => setAlcoholDrinks(e.target.value === 'skip' ? 'skip' : Number(e.target.value))}
                          className="w-full bg-black/80 border border-white/20 rounded-lg p-2 pr-7 text-white text-xs focus:outline-none focus:border-indigo-400 cursor-pointer font-medium"
                        >
                          <option value="skip">-- Skip / Not Tracked --</option>
                          <option value={0}>0 Drinks (Zero)</option>
                          <option value={1}>1 Drink</option>
                          <option value={2}>2-3 Drinks</option>
                          <option value={4}>4+ Drinks (Heavy)</option>
                        </select>
                      </div>
                    )}

                    {/* Nicotine */}
                    {isExposureTracked('nicotine_exposure') && (
                      <div className="bg-black/40 p-2.5 rounded-lg border border-white/10 space-y-1">
                        <label className="font-bold text-white block">🚬 Nicotine &amp; Smoking</label>
                        <select
                          value={nicotineExposure}
                          onChange={(e) => setNicotineExposure(e.target.value)}
                          className="w-full bg-black/80 border border-white/20 rounded-lg p-2 pr-7 text-white text-xs focus:outline-none focus:border-indigo-400 cursor-pointer font-medium"
                        >
                          <option value="skip">-- Skip / Not Tracked --</option>
                          <option value="none">None</option>
                          <option value="cigarettes">Cigarettes / Tobacco</option>
                          <option value="vaping">Vaping / E-Cigarettes</option>
                          <option value="pouches">Pouches / Gum</option>
                        </select>
                      </div>
                    )}

                    {/* Cannabis & THC */}
                    {isExposureTracked('cannabis_exposure') && (
                      <div className="bg-black/40 p-2.5 rounded-lg border border-white/10 space-y-1">
                        <label className="font-bold text-white block flex items-center gap-1.5">
                          <span>🌿</span>
                          <span>Cannabis &amp; THC</span>
                        </label>
                        <select
                          value={cannabisExposure}
                          onChange={(e) => setCannabisExposure(e.target.value)}
                          className="w-full bg-black/80 border border-white/20 rounded-lg p-2 pr-7 text-white text-xs focus:outline-none focus:border-indigo-400 cursor-pointer font-medium"
                        >
                          <option value="skip">-- Skip / Not Tracked --</option>
                          <option value="none">None (Zero)</option>
                          <option value="inhaled">Inhaled / Smoked / Vaped</option>
                          <option value="edible_low">Micro-dose Edible / Tincture (&lt;5mg)</option>
                          <option value="edible_std">Standard Edible (5–10mg)</option>
                          <option value="edible_high">High Dose Edible (10mg+)</option>
                          <option value="cbd_only">CBD / Non-THC Only</option>
                        </select>
                      </div>
                    )}

                    {/* Prolonged Sitting */}
                    {isExposureTracked('sitting_duration') && (
                      <div className="bg-black/40 p-2.5 rounded-lg border border-white/10 space-y-1">
                        <label className="font-bold text-white block">🪑 Prolonged Sitting</label>
                        <select
                          value={sittingDuration}
                          onChange={(e) => setSittingDuration(e.target.value)}
                          className="w-full bg-black/80 border border-white/20 rounded-lg p-2 pr-7 text-white text-xs focus:outline-none focus:border-indigo-400 cursor-pointer font-medium"
                        >
                          <option value="skip">-- Skip / Not Tracked --</option>
                          <option value="under_4h">&lt;4 Hours (Active)</option>
                          <option value="4_7h">4-7 Hours (Desk)</option>
                          <option value="8_10h">8-10 Hours (Heavy)</option>
                          <option value="over_10h">10+ Hours (Sedentary)</option>
                        </select>
                      </div>
                    )}

                    {/* Ultra-processed Foods */}
                    {isExposureTracked('processed_sugar') && (
                      <div className="bg-black/40 p-2.5 rounded-lg border border-white/10 space-y-1">
                        <label className="font-bold text-white block">🍕 Ultra-Processed Foods</label>
                        <select
                          value={processedSugar}
                          onChange={(e) => setProcessedSugar(e.target.value)}
                          className="w-full bg-black/80 border border-white/20 rounded-lg p-2 pr-7 text-white text-xs focus:outline-none focus:border-indigo-400 cursor-pointer font-medium"
                        >
                          <option value="skip">-- Skip / Not Tracked --</option>
                          <option value="low">Low (Clean whole foods)</option>
                          <option value="moderate">Moderate (Occasional treats)</option>
                          <option value="high">High (Frequent sugars)</option>
                        </select>
                      </div>
                    )}

                    {/* Late Caffeine Timing */}
                    {isExposureTracked('late_caffeine') && (
                      <TimingExposureCard
                        title="Last Caffeine Timing"
                        icon="☕"
                        value={lateCaffeine}
                        onChange={setLateCaffeine}
                        type="caffeine"
                        idealBedtime={localProfile?.ideal_bedtime || '22:30'}
                        theme="indigo"
                      />
                    )}

                    {/* Late Blue Light Timing */}
                    {isExposureTracked('blue_light') && (
                      <TimingExposureCard
                        title="Last Screen / Blue Light"
                        icon="📱"
                        value={blueLight}
                        onChange={setBlueLight}
                        type="screen"
                        idealBedtime={localProfile?.ideal_bedtime || '22:30'}
                        theme="indigo"
                      />
                    )}

                    {/* Late Meal Timing */}
                    {isExposureTracked('late_meal') && (
                      <TimingExposureCard
                        title="Last Meal Timing"
                        icon="🍟"
                        value={lateMeal}
                        onChange={setLateMeal}
                        type="meal"
                        idealBedtime={localProfile?.ideal_bedtime || '22:30'}
                        theme="indigo"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-indigo-300/60 italic">Section collapsed / skipped. Tap 'Expand Section' to record last night's sleep ratings.</p>
        )}
      </div>

      {/* Time of Last Meal Selector (Nightly Check-in) */}
      {isNightly && (
        <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-white font-bold flex items-center gap-1.5">
              <span>🍽️</span> Time of Last Meal / Food
            </span>
            <div className="flex items-center gap-2">
              <span className="text-indigo-300 font-mono font-bold text-xs bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-500/40">
                {lastFoodTime}
              </span>
              <button
                type="button"
                onClick={() => setShowMealSection(!showMealSection)}
                className="text-[10px] font-bold text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 px-2 py-0.5 rounded cursor-pointer transition-all"
              >
                {showMealSection ? 'Collapse' : 'Expand'}
              </button>
            </div>
          </div>
          {showMealSection && (
            <>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Starts the clock on postprandial glucose clearing and calculates your true overnight fasted state.
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 pt-1">
                {['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'].map((tStr) => (
                  <button
                    key={tStr}
                    type="button"
                    onClick={() => setLastFoodTime(tStr)}
                    className={`py-1.5 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
                      lastFoodTime === tStr 
                        ? 'bg-levl-accent text-white border-levl-accent font-bold shadow-md shadow-levl-accent/20' 
                        : 'bg-black/30 text-gray-300 border-white/10 hover:border-white/30'
                    }`}
                  >
                    {tStr}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {(() => {
        const modeKey = isNightly ? 'nightly' : 'morning'
        const isMoodTracked = isOutcomeTracked('mood', modeKey)
        const isEnergyTracked = isOutcomeTracked('energy', modeKey)
        const isStressTracked = isOutcomeTracked('stress', modeKey)
        const isSkinTracked = isOutcomeTracked('skin_clarity', modeKey) || isOutcomeTracked('skin', modeKey)
        const isFocusTracked = isOutcomeTracked('focus', modeKey) || isOutcomeTracked('focus_score', modeKey)
        const hasCoreTracked = isMoodTracked || isEnergyTracked || isStressTracked || isSkinTracked || isFocusTracked

        if (!hasCoreTracked) return null

        return (
          <div className={!isNightly ? "border-t border-white/10 pt-4" : ""}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-xs text-levl-text-secondary uppercase tracking-wider">⚡ Core Metrics</h4>
              <button
                type="button"
                onClick={() => setShowCoreMetricsSection(!showCoreMetricsSection)}
                className="text-[10px] font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-0.5 rounded cursor-pointer transition-all"
              >
                {showCoreMetricsSection ? 'Collapse / Skip Section' : 'Expand Section'}
              </button>
            </div>

            {showCoreMetricsSection ? (
              <div className="space-y-4">
                {/* Mood Slider */}
                {isMoodTracked && (() => {
                  const isTouched = touchedOutcomes['mood']
                  const snap = getRecentOutcomeSnapshot('mood', initialData)
                  const colorCfg = isTouched ? getOutcomeColorConfig(mood, 'higher_is_better') : getNeutralOutcomeColorConfig()
                  return (
                    <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-bold">{isNightly ? 'Overall Mood Today' : 'Morning Mood (Current)'}</span>
                          {snap.isRecent && !isTouched && (
                            <span className="text-[8px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-mono">
                              Recent ({snap.timeAgoMinutes}m ago)
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setTouchedOutcomes(prev => ({ ...prev, mood: !prev.mood }))}
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all group"
                          title="Click to confirm this value without sliding"
                        >
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${isTouched ? colorCfg.badgeBg : 'bg-white/5 border-white/15 text-slate-400 group-hover:border-white/30'}`}>
                            {isTouched ? colorCfg.qualityLabel : 'Unconfirmed (Tap)'}
                          </span>
                          <span className={`font-mono font-bold text-xs ${isTouched ? colorCfg.textColor : 'text-slate-400'}`}>
                            {mood}/10
                          </span>
                        </button>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        value={mood} 
                        onChange={(e) => {
                          setMood(parseInt(e.target.value))
                          setTouchedOutcomes(prev => ({ ...prev, mood: true }))
                        }} 
                        onPointerDown={() => {
                          if (!isTouched) {
                            setTouchedOutcomes(prev => ({ ...prev, mood: true }))
                          }
                        }}
                        onClick={() => {
                          if (!isTouched) {
                            setTouchedOutcomes(prev => ({ ...prev, mood: true }))
                          }
                        }}
                        className="w-full cursor-pointer touch-manipulation" 
                        style={{ accentColor: colorCfg.accentHex }}
                        title={isTouched ? `Mood: ${mood}/10 (Confirmed)` : 'Click dot to confirm 5/10, or drag to adjust'}
                      />
                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                        <span className="text-red-400">0: Low / Down</span>
                        <span className="text-emerald-400">10: High / Great</span>
                      </div>
                    </div>
                  )
                })()}

                {/* Energy Slider */}
                {isEnergyTracked && (() => {
                  const isTouched = touchedOutcomes['energy']
                  const snap = getRecentOutcomeSnapshot('energy', initialData)
                  const colorCfg = isTouched ? getOutcomeColorConfig(energy, 'higher_is_better') : getNeutralOutcomeColorConfig()
                  return (
                    <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-bold">{isNightly ? 'Overall Daily Energy' : 'Morning Readiness & Energy (Current)'}</span>
                          {snap.isRecent && !isTouched && (
                            <span className="text-[8px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-mono">
                              Recent ({snap.timeAgoMinutes}m ago)
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setTouchedOutcomes(prev => ({ ...prev, energy: !prev.energy }))}
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all group"
                          title="Click to confirm this value without sliding"
                        >
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${isTouched ? colorCfg.badgeBg : 'bg-white/5 border-white/15 text-slate-400 group-hover:border-white/30'}`}>
                            {isTouched ? colorCfg.qualityLabel : 'Unconfirmed (Tap)'}
                          </span>
                          <span className={`font-mono font-bold text-xs ${isTouched ? colorCfg.textColor : 'text-slate-400'}`}>
                            {energy}/10
                          </span>
                        </button>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        value={energy} 
                        onChange={(e) => {
                          setEnergy(parseInt(e.target.value))
                          setTouchedOutcomes(prev => ({ ...prev, energy: true }))
                        }} 
                        onPointerDown={() => {
                          if (!isTouched) {
                            setTouchedOutcomes(prev => ({ ...prev, energy: true }))
                          }
                        }}
                        onClick={() => {
                          if (!isTouched) {
                            setTouchedOutcomes(prev => ({ ...prev, energy: true }))
                          }
                        }}
                        className="w-full cursor-pointer touch-manipulation" 
                        style={{ accentColor: colorCfg.accentHex }}
                        title={isTouched ? `Energy: ${energy}/10 (Confirmed)` : 'Click dot to confirm 5/10, or drag to adjust'}
                      />
                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                        <span className="text-red-400">0: Low / Lethargic</span>
                        <span className="text-emerald-400">10: Peak / Energized</span>
                      </div>
                    </div>
                  )
                })()}

                {/* Stress Slider (Lower is better!) */}
                {isStressTracked && (() => {
                  const isTouched = touchedOutcomes['stress']
                  const snap = getRecentOutcomeSnapshot('stress', initialData)
                  const colorCfg = isTouched ? getOutcomeColorConfig(stress, 'lower_is_better') : getNeutralOutcomeColorConfig()
                  return (
                    <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-bold">{isNightly ? 'Overall Stress Today' : 'Current Morning Stress'}</span>
                          {snap.isRecent && !isTouched && (
                            <span className="text-[8px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-mono">
                              Recent ({snap.timeAgoMinutes}m ago)
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setTouchedOutcomes(prev => ({ ...prev, stress: !prev.stress }))}
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all group"
                          title="Click to confirm this value without sliding"
                        >
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${isTouched ? colorCfg.badgeBg : 'bg-white/5 border-white/15 text-slate-400 group-hover:border-white/30'}`}>
                            {isTouched ? colorCfg.qualityLabel : 'Unconfirmed (Tap)'}
                          </span>
                          <span className={`font-mono font-bold text-xs ${isTouched ? colorCfg.textColor : 'text-slate-400'}`}>
                            {stress}/10
                          </span>
                        </button>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        value={stress} 
                        onChange={(e) => {
                          setStress(parseInt(e.target.value))
                          setTouchedOutcomes(prev => ({ ...prev, stress: true }))
                        }} 
                        onPointerDown={() => {
                          if (!isTouched) {
                            setTouchedOutcomes(prev => ({ ...prev, stress: true }))
                          }
                        }}
                        onClick={() => {
                          if (!isTouched) {
                            setTouchedOutcomes(prev => ({ ...prev, stress: true }))
                          }
                        }}
                        className="w-full cursor-pointer touch-manipulation" 
                        style={{ accentColor: colorCfg.accentHex }}
                        title={isTouched ? `Stress: ${stress}/10 (Confirmed)` : 'Click dot to confirm 5/10, or drag to adjust'}
                      />
                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                        <span className="text-emerald-400">0: Best (Calm / None)</span>
                        <span className="text-red-400">10: Worst (High / Severe)</span>
                      </div>
                    </div>
                  )
                })()}

                {/* Skin Clarity & Radiance Slider */}
                {isSkinTracked && (() => {
                  const isTouched = touchedOutcomes['skin']
                  const snap = getRecentOutcomeSnapshot('skin', initialData)
                  const colorCfg = isTouched ? getOutcomeColorConfig(skinClarity, 'higher_is_better') : getNeutralOutcomeColorConfig()
                  return (
                    <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-bold flex items-center gap-1">
                            ✨ Skin Clarity & Radiance
                          </span>
                          {snap.isRecent && !isTouched && (
                            <span className="text-[8px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-mono">
                              Recent ({snap.timeAgoMinutes}m ago)
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setTouchedOutcomes(prev => ({ ...prev, skin: !prev.skin }))}
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all group"
                          title="Click to confirm this value without sliding"
                        >
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${isTouched ? colorCfg.badgeBg : 'bg-white/5 border-white/15 text-slate-400 group-hover:border-white/30'}`}>
                            {isTouched ? colorCfg.qualityLabel : 'Unconfirmed (Tap)'}
                          </span>
                          <span className={`font-mono font-bold text-xs ${isTouched ? colorCfg.textColor : 'text-slate-400'}`}>
                            {skinClarity}/10
                          </span>
                        </button>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        value={skinClarity} 
                        onChange={(e) => {
                          setSkinClarity(parseInt(e.target.value))
                          setTouchedOutcomes(prev => ({ ...prev, skin: true }))
                        }} 
                        onPointerDown={() => {
                          if (!isTouched) {
                            setTouchedOutcomes(prev => ({ ...prev, skin: true }))
                          }
                        }}
                        onClick={() => {
                          if (!isTouched) {
                            setTouchedOutcomes(prev => ({ ...prev, skin: true }))
                          }
                        }}
                        className="w-full cursor-pointer touch-manipulation" 
                        style={{ accentColor: colorCfg.accentHex }}
                        title={isTouched ? `Skin Clarity: ${skinClarity}/10 (Confirmed)` : 'Click dot to confirm 5/10, or drag to adjust'}
                      />
                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                        <span className="text-red-400">0: Dull / Inflamed / Breakout</span>
                        <span className="text-emerald-400">10: Clear / Glowing</span>
                      </div>
                    </div>
                  )
                })()}

                {/* Mental Focus & Brain Fog Slider */}
                {isFocusTracked && (() => {
                  const isTouched = touchedOutcomes['focus']
                  const snap = getRecentOutcomeSnapshot('focus', initialData)
                  const colorCfg = isTouched ? getOutcomeColorConfig(focusScore, 'higher_is_better') : getNeutralOutcomeColorConfig()
                  return (
                    <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-bold flex items-center gap-1">
                            🧠 {isNightly ? 'Overall Focus & Mental Clarity Today' : 'Current Mental Focus & Clarity'}
                          </span>
                          {snap.isRecent && !isTouched && (
                            <span className="text-[8px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-mono">
                              Recent ({snap.timeAgoMinutes}m ago)
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setTouchedOutcomes(prev => ({ ...prev, focus: !prev.focus }))}
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all group"
                          title="Click to confirm this value without sliding"
                        >
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${isTouched ? colorCfg.badgeBg : 'bg-white/5 border-white/15 text-slate-400 group-hover:border-white/30'}`}>
                            {isTouched ? colorCfg.qualityLabel : 'Unconfirmed (Tap)'}
                          </span>
                          <span className={`font-mono font-bold text-xs ${isTouched ? colorCfg.textColor : 'text-slate-400'}`}>
                            {focusScore}/10
                          </span>
                        </button>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        value={focusScore} 
                        onChange={(e) => {
                          setFocusScore(parseInt(e.target.value))
                          setTouchedOutcomes(prev => ({ ...prev, focus: true }))
                        }} 
                        onPointerDown={() => {
                          if (!isTouched) {
                            setTouchedOutcomes(prev => ({ ...prev, focus: true }))
                          }
                        }}
                        onClick={() => {
                          if (!isTouched) {
                            setTouchedOutcomes(prev => ({ ...prev, focus: true }))
                          }
                        }}
                        className="w-full cursor-pointer touch-manipulation" 
                        style={{ accentColor: colorCfg.accentHex }}
                        title={isTouched ? `Mental Focus: ${focusScore}/10 (Confirmed)` : 'Click dot to confirm 5/10, or drag to adjust'}
                      />
                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                        <span className="text-red-400">0: Brain Fog / Distracted</span>
                        <span className="text-emerald-400">10: Deep Focus / Sharp</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 italic">Section collapsed / skipped.</p>
            )}
          </div>
        )
      })()}

      {morningOutcomesToTrack.length > 0 && (
        <div className="border-t border-white/10 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-xs text-levl-text-secondary uppercase tracking-wider flex items-center gap-2">
              🎯 Morning Priority Goals & Custom Outcomes <span className="bg-levl-accent/20 text-levl-accent px-1.5 py-0.5 rounded text-[9px]">Dynamic</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowOutcomesSection(!showOutcomesSection)}
              className="text-[10px] font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-0.5 rounded cursor-pointer transition-all"
            >
              {showOutcomesSection ? 'Collapse / Skip Section' : 'Expand Section'}
            </button>
          </div>

          {showOutcomesSection ? (
            <div className="space-y-4">
            {morningOutcomesToTrack.map(outcome => {
              const snap = getRecentOutcomeSnapshot(outcome.id, initialData)
              const val = customOutcomeValues[outcome.id] ?? (snap.isRecent ? snap.value : 5)
              const isTouched = touchedOutcomes[outcome.id]
              const colorCfg = isTouched ? getOutcomeColorConfig(val, outcome.directionality) : getNeutralOutcomeColorConfig()
              const isLowerBetter = outcome.directionality === 'lower_is_better'

              return (
                <div key={outcome.id} className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-bold">{isNightly ? `Overall ${outcome.name} Today` : `Morning ${outcome.name}`}</span>
                      {snap.isRecent && !isTouched && (
                        <span className="text-[8px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-mono">
                          Recent ({snap.timeAgoMinutes}m ago)
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setTouchedOutcomes(prev => ({ ...prev, [outcome.id]: !prev[outcome.id] }))}
                      className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all group"
                      title="Click to confirm this value without sliding"
                    >
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${isTouched ? colorCfg.badgeBg : 'bg-white/5 border-white/15 text-slate-400 group-hover:border-white/30'}`}>
                        {isTouched ? colorCfg.qualityLabel : 'Unconfirmed (Tap)'}
                      </span>
                      <span className={`font-mono font-bold text-xs ${isTouched ? colorCfg.textColor : 'text-slate-400'}`}>{val}/10</span>
                    </button>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    value={val} 
                    onChange={(e) => {
                      setCustomOutcomeValues(prev => ({...prev, [outcome.id]: parseInt(e.target.value)}))
                      setTouchedOutcomes(prev => ({...prev, [outcome.id]: true}))
                    }} 
                    onPointerDown={() => {
                      if (!isTouched) {
                        setTouchedOutcomes(prev => ({ ...prev, [outcome.id]: true }))
                      }
                    }}
                    onClick={() => {
                      if (!isTouched) {
                        setTouchedOutcomes(prev => ({ ...prev, [outcome.id]: true }))
                      }
                    }}
                    className="w-full cursor-pointer touch-manipulation" 
                    style={{ accentColor: colorCfg.accentHex }}
                    title={isTouched ? `${outcome.name}: ${val}/10 (Confirmed)` : 'Click dot to confirm 5/10, or drag to adjust'}
                  />
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
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
          ) : (
            <p className="text-[11px] text-gray-400 italic">Section collapsed / skipped. Tap 'Expand Section' to record priority custom outcome goals.</p>
          )}
        </div>
      )}

      {/* Morning Freeform Reflection & Notes Card */}
      <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-2 mt-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={13} className="text-amber-400" /> Morning Notes &amp; Reflections
          </label>
          {notes && (
            <span className="text-[10px] text-slate-400 font-mono">
              {notes.length} characters
            </span>
          )}
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Capture somatic sensations, intentions for today, how you slept, or thoughts before the day begins..."
          rows={3}
          className="w-full bg-slate-900/70 border border-amber-500/20 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-all resize-none shadow-inner"
        />
      </div>

      <button onClick={handleMorningSave} className="w-full bg-levl-accent text-white rounded-lg py-3 text-sm font-bold hover:bg-levl-accent/90 transition-colors mt-2 shadow-lg shadow-levl-accent/20 cursor-pointer">
        {isSaved ? `Edit Morning Check-in` : `Log Morning Check-in`}
      </button>
    </div>
  ))}

    {/* Dedicated Nightly Check-in Card (~3 hours before bedtime, or anytime on past dates) */}
    {(section === 'all' || section === 'nightly') && isNightlyAvailable && (
      <div id="evening-checkin-section" className="glass-card p-4 rounded-xl mb-6 space-y-4 border border-rose-500/30 bg-rose-950/20 scroll-mt-24 shadow-xl">
        <div 
          onClick={() => setShowNightlyCard(!showNightlyCard)}
          className="flex items-center justify-between flex-wrap gap-2 cursor-pointer hover:opacity-90 transition-all select-none p-1"
        >
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isNightlySaved ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
            <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
              <Moon size={15} className="text-rose-300" /> {isPastDate ? `Evening Check-in (${format(date, 'EEE, MMM d')})` : "Today's Nightly Check-in"}
            </h3>
            <span className="text-[10px] text-rose-300/80 font-semibold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              {showNightlyCard ? '▲ Collapse' : isNightlySaved ? '▼ Edit' : '▼ Log'}
            </span>
            {nightlySavedToast && (
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30 animate-in fade-in">
                ✓ Evening Check-in Saved!
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOutcomesModalTitle("Customize Nightly Tracked Outcomes")
                setOutcomesModalMode("nightly")
                setIsOutcomesModalOpen(true)
              }}
              className="text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 rounded-lg hover:bg-rose-500/30 transition-all cursor-pointer flex items-center gap-1"
            >
              <Sliders size={12} /> Edit Tracked Outcomes
            </button>
          </div>
        </div>

        {showNightlyCard ? (
          <div className="space-y-4 pt-2 border-t border-rose-500/20 animate-in fade-in">
            {/* Evening Mindful Reflection & Decompression Prompt */}
            {eveningMindfulnessPref !== 'hidden' && (
              isEveningMindfulnessExpanded ? (
                <div className="relative mb-3">
                  {eveningMindfulnessPref === 'collapsed' && (
                    <button
                      type="button"
                      onClick={() => setIsEveningMindfulnessExpanded(false)}
                      className="absolute top-3.5 right-3.5 z-10 text-[10px] font-bold text-white/80 hover:text-white bg-black/40 hover:bg-black/60 border border-white/20 px-2.5 py-0.5 rounded-lg cursor-pointer transition-all shadow-sm"
                    >
                      Collapse ⌃
                    </button>
                  )}
                  <MindfulReflectionPrompt mode="evening" date={date} />
                </div>
              ) : (
                <div 
                  onClick={() => setIsEveningMindfulnessExpanded(true)}
                  className="mb-3 p-3.5 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-purple-950/20 to-slate-950/60 cursor-pointer hover:border-rose-400/50 transition-all flex items-center justify-between shadow-md"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 shadow-inner">
                      <Moon size={14} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Evening Mindfulness &amp; Decompression</span>
                      <span className="text-[10px] text-rose-300/80">Tap to expand evening reflection and mental wind-down</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                    Reflect <ChevronDown size={14} />
                  </span>
                </div>
              )
            )}

            {/* Nightly Voice Bar */}
            <UnifiedVoiceBar
              mode="nightly"
              localUserId={effectiveUserId}
              dateStr={dStr}
              placeholder="🎙️ Speak evening reflection, meal cutoff, or caffeine/screen..."
              onApplyParsedData={(data) => handleApplyVoiceData(data, 'nightly')}
            />

            {/* ⚡ END-OF-DAY WELLBEING REFLECTION & TRACKED OUTCOMES (PRIMARY SCORING) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚡</span> End-of-Day Reflection &amp; Overall Wellbeing
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setOutcomesModalTitle("Customize Nightly Tracked Outcomes")
                    setOutcomesModalMode("nightly")
                    setIsOutcomesModalOpen(true)
                  }}
                  className="text-[10px] font-bold text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Sliders size={11} /> Edit Outcomes
                </button>
              </div>

              <div className="space-y-3">
                {/* Mood Today */}
                <div className="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">Overall Mood Today</span>
                    <button
                      type="button"
                      onClick={() => setTouchedOutcomes(prev => ({ ...prev, mood: !prev.mood }))}
                      className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all group"
                      title="Click to confirm this value without sliding"
                    >
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${touchedOutcomes['mood'] ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-white/5 border-white/15 text-slate-400 group-hover:border-white/30'}`}>
                        {touchedOutcomes['mood'] ? 'Confirmed' : 'Unconfirmed (Tap)'}
                      </span>
                      <span className={`font-mono font-bold text-xs ${touchedOutcomes['mood'] ? 'text-indigo-300' : 'text-slate-400'}`}>{mood}/10</span>
                    </button>
                  </div>
                  <input
                    type="range" min="0" max="10"
                    value={mood}
                    onChange={(e) => {
                      setMood(parseInt(e.target.value))
                      setTouchedOutcomes(prev => ({ ...prev, mood: true }))
                    }}
                    onPointerDown={() => {
                      if (!touchedOutcomes['mood']) {
                        setTouchedOutcomes(prev => ({ ...prev, mood: true }))
                      }
                    }}
                    onClick={() => {
                      if (!touchedOutcomes['mood']) {
                        setTouchedOutcomes(prev => ({ ...prev, mood: true }))
                      }
                    }}
                    className="w-full accent-indigo-400 cursor-pointer touch-manipulation"
                    title={touchedOutcomes['mood'] ? `Overall Mood: ${mood}/10 (Confirmed)` : 'Click dot to confirm 5/10, or drag to adjust'}
                  />
                  <div className="flex justify-between text-[9px] text-gray-400">
                    <span>0: Low / Down</span><span>10: High / Great</span>
                  </div>
                </div>

                {/* Energy Today */}
                <div className="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">Overall Energy Today</span>
                    <button
                      type="button"
                      onClick={() => setTouchedOutcomes(prev => ({ ...prev, energy: !prev.energy }))}
                      className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all group"
                      title="Click to confirm this value without sliding"
                    >
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${touchedOutcomes['energy'] ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-white/5 border-white/15 text-slate-400 group-hover:border-white/30'}`}>
                        {touchedOutcomes['energy'] ? 'Confirmed' : 'Unconfirmed (Tap)'}
                      </span>
                      <span className={`font-mono font-bold text-xs ${touchedOutcomes['energy'] ? 'text-indigo-300' : 'text-slate-400'}`}>{energy}/10</span>
                    </button>
                  </div>
                  <input
                    type="range" min="0" max="10"
                    value={energy}
                    onChange={(e) => {
                      setEnergy(parseInt(e.target.value))
                      setTouchedOutcomes(prev => ({ ...prev, energy: true }))
                    }}
                    onPointerDown={() => {
                      if (!touchedOutcomes['energy']) {
                        setTouchedOutcomes(prev => ({ ...prev, energy: true }))
                      }
                    }}
                    onClick={() => {
                      if (!touchedOutcomes['energy']) {
                        setTouchedOutcomes(prev => ({ ...prev, energy: true }))
                      }
                    }}
                    className="w-full accent-indigo-400 cursor-pointer touch-manipulation"
                    title={touchedOutcomes['energy'] ? `Overall Energy: ${energy}/10 (Confirmed)` : 'Click dot to confirm 5/10, or drag to adjust'}
                  />
                  <div className="flex justify-between text-[9px] text-gray-400">
                    <span>0: Lethargic</span><span>10: Peak Energy</span>
                  </div>
                </div>

                {/* Stress Today */}
                <div className="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">Overall Stress Today</span>
                    <button
                      type="button"
                      onClick={() => setTouchedOutcomes(prev => ({ ...prev, stress: !prev.stress }))}
                      className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all group"
                      title="Click to confirm this value without sliding"
                    >
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${touchedOutcomes['stress'] ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-white/5 border-white/15 text-slate-400 group-hover:border-white/30'}`}>
                        {touchedOutcomes['stress'] ? 'Confirmed' : 'Unconfirmed (Tap)'}
                      </span>
                      <span className={`font-mono font-bold text-xs ${touchedOutcomes['stress'] ? 'text-indigo-300' : 'text-slate-400'}`}>{stress}/10</span>
                    </button>
                  </div>
                  <input
                    type="range" min="0" max="10"
                    value={stress}
                    onChange={(e) => {
                      setStress(parseInt(e.target.value))
                      setTouchedOutcomes(prev => ({ ...prev, stress: true }))
                    }}
                    onPointerDown={() => {
                      if (!touchedOutcomes['stress']) {
                        setTouchedOutcomes(prev => ({ ...prev, stress: true }))
                      }
                    }}
                    onClick={() => {
                      if (!touchedOutcomes['stress']) {
                        setTouchedOutcomes(prev => ({ ...prev, stress: true }))
                      }
                    }}
                    className="w-full accent-indigo-400 cursor-pointer touch-manipulation"
                    title={touchedOutcomes['stress'] ? `Overall Stress: ${stress}/10 (Confirmed)` : 'Click dot to confirm 5/10, or drag to adjust'}
                  />
                  <div className="flex justify-between text-[9px] text-gray-400">
                    <span>0: Calm / None</span><span>10: Severe Stress</span>
                  </div>
                </div>

                {/* Nightly Tracked Functional Outcomes */}
                {nightlyOutcomesToTrack.map(outcome => {
                  const val = customOutcomeValues[outcome.id] ?? 5
                  const isTouched = touchedOutcomes[outcome.id]
                  const colorCfg = isTouched ? getOutcomeColorConfig(val, outcome.directionality) : getNeutralOutcomeColorConfig()
                  const isLowerBetter = outcome.directionality === 'lower_is_better'

                  return (
                    <div key={outcome.id} className="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-bold">Overall {outcome.name} Today</span>
                        <button
                          type="button"
                          onClick={() => setTouchedOutcomes(prev => ({ ...prev, [outcome.id]: !prev[outcome.id] }))}
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all group"
                          title="Click to confirm this value without sliding"
                        >
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${isTouched ? colorCfg.badgeBg : 'bg-white/5 border-white/15 text-slate-400 group-hover:border-white/30'}`}>
                            {isTouched ? colorCfg.qualityLabel : 'Unconfirmed (Tap)'}
                          </span>
                          <span className={`font-mono font-bold text-xs ${isTouched ? colorCfg.textColor : 'text-slate-400'}`}>{val}/10</span>
                        </button>
                      </div>
                      <input 
                        type="range" min="0" max="10" 
                        value={val} 
                        onChange={(e) => {
                          const newVal = parseInt(e.target.value)
                          setCustomOutcomeValues(prev => ({ ...prev, [outcome.id]: newVal }))
                          setTouchedOutcomes(prev => ({ ...prev, [outcome.id]: true }))
                        }} 
                        onPointerDown={() => {
                          if (!isTouched) {
                            setTouchedOutcomes(prev => ({ ...prev, [outcome.id]: true }))
                          }
                        }}
                        onClick={() => {
                          if (!isTouched) {
                            setTouchedOutcomes(prev => ({ ...prev, [outcome.id]: true }))
                          }
                        }}
                        className="w-full cursor-pointer touch-manipulation" 
                        style={{ accentColor: colorCfg.accentHex }}
                        title={isTouched ? `${outcome.name}: ${val}/10 (Confirmed)` : 'Click dot to confirm 5/10, or drag to adjust'}
                      />
                      <div className="flex justify-between text-[9px] text-gray-400 uppercase font-bold">
                        <span className={isLowerBetter ? 'text-emerald-400' : 'text-red-400'}>
                          0: {isLowerBetter ? 'Best' : 'Poor'}
                        </span>
                        <span className={isLowerBetter ? 'text-red-400' : 'text-emerald-400'}>
                          10: {isLowerBetter ? 'Worst' : 'Peak'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Negative Longevity Exposures Grid */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🚫</span> Negative Longevity Impacts &amp; Exposures Today
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setOutcomesModalTitle("Customize Nightly Tracked Exposures & Outcomes")
                    setOutcomesModalMode("nightly")
                    setIsOutcomesModalOpen(true)
                  }}
                  className="text-[10px] font-bold text-rose-300 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Sliders size={11} /> Edit Tracked Items
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {/* Alcohol */}
                {isExposureTracked('alcohol_drinks') && (
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/10 space-y-1">
                    <label className="font-bold text-white block">🍷 Alcohol Intake</label>
                    <select
                      value={alcoholDrinks}
                      onChange={(e) => setAlcoholDrinks(e.target.value === 'skip' ? 'skip' : Number(e.target.value))}
                      className="w-full bg-black/80 border border-white/20 rounded-lg p-2 pr-7 text-white text-xs focus:outline-none focus:border-rose-400 cursor-pointer font-medium"
                    >
                      <option value="skip">-- Skip / Not Tracked --</option>
                      <option value={0}>0 Drinks (Zero)</option>
                      <option value={1}>1 Drink</option>
                      <option value={2}>2-3 Drinks</option>
                      <option value={4}>4+ Drinks (Heavy)</option>
                    </select>
                  </div>
                )}

                {/* Nicotine */}
                {isExposureTracked('nicotine_exposure') && (
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/10 space-y-1">
                    <label className="font-bold text-white block">🚬 Nicotine &amp; Smoking</label>
                    <select
                      value={nicotineExposure}
                      onChange={(e) => setNicotineExposure(e.target.value)}
                      className="w-full bg-black/80 border border-white/20 rounded-lg p-2 pr-7 text-white text-xs focus:outline-none focus:border-rose-400 cursor-pointer font-medium"
                    >
                      <option value="skip">-- Skip / Not Tracked --</option>
                      <option value="none">None</option>
                      <option value="cigarettes">Cigarettes / Tobacco</option>
                      <option value="vaping">Vaping / E-Cigarettes</option>
                      <option value="pouches">Pouches / Gum</option>
                    </select>
                  </div>
                )}

                {/* Cannabis & THC */}
                {isExposureTracked('cannabis_exposure') && (
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/10 space-y-1">
                    <label className="font-bold text-white block flex items-center gap-1.5">
                      <span>🌿</span>
                      <span>Cannabis &amp; THC</span>
                    </label>
                    <select
                      value={cannabisExposure}
                      onChange={(e) => setCannabisExposure(e.target.value)}
                      className="w-full bg-black/80 border border-white/20 rounded-lg p-2 pr-7 text-white text-xs focus:outline-none focus:border-rose-400 cursor-pointer font-medium"
                    >
                      <option value="skip">-- Skip / Not Tracked --</option>
                      <option value="none">None (Zero)</option>
                      <option value="inhaled">Inhaled / Smoked / Vaped</option>
                      <option value="edible_low">Micro-dose Edible / Tincture (&lt;5mg)</option>
                      <option value="edible_std">Standard Edible (5–10mg)</option>
                      <option value="edible_high">High Dose Edible (10mg+)</option>
                      <option value="cbd_only">CBD / Non-THC Only</option>
                    </select>
                  </div>
                )}

                {/* Prolonged Sitting */}
                {isExposureTracked('sitting_duration') && (
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/10 space-y-1">
                    <label className="font-bold text-white block">🪑 Prolonged Sitting</label>
                    <select
                      value={sittingDuration}
                      onChange={(e) => setSittingDuration(e.target.value)}
                      className="w-full bg-black/80 border border-white/20 rounded-lg p-2 pr-7 text-white text-xs focus:outline-none focus:border-rose-400 cursor-pointer font-medium"
                    >
                      <option value="skip">-- Skip / Not Tracked --</option>
                      <option value="under_4h">&lt;4 Hours (Active)</option>
                      <option value="4_7h">4-7 Hours (Desk)</option>
                      <option value="8_10h">8-10 Hours (Heavy)</option>
                      <option value="over_10h">10+ Hours (Sedentary)</option>
                    </select>
                  </div>
                )}

                {/* Ultra-processed Foods */}
                {isExposureTracked('processed_sugar') && (
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/10 space-y-1">
                    <label className="font-bold text-white block">🍕 Ultra-Processed Foods</label>
                    <select
                      value={processedSugar}
                      onChange={(e) => setProcessedSugar(e.target.value)}
                      className="w-full bg-black/80 border border-white/20 rounded-lg p-2 pr-7 text-white text-xs focus:outline-none focus:border-rose-400 cursor-pointer font-medium"
                    >
                      <option value="skip">-- Skip / Not Tracked --</option>
                      <option value="low">Low (Clean whole foods)</option>
                      <option value="moderate">Moderate (Occasional treats)</option>
                      <option value="high">High (Frequent sugars)</option>
                    </select>
                  </div>
                )}

                {/* Late Caffeine Timing */}
                {isExposureTracked('late_caffeine') && (
                  <TimingExposureCard
                    title="Last Caffeine Timing"
                    icon="☕"
                    value={lateCaffeine}
                    onChange={setLateCaffeine}
                    type="caffeine"
                    idealBedtime={localProfile?.ideal_bedtime || '22:30'}
                    theme="rose"
                  />
                )}

                {/* Late Blue Light Timing */}
                {isExposureTracked('blue_light') && (
                  <TimingExposureCard
                    title="Last Screen / Blue Light"
                    icon="📱"
                    value={blueLight}
                    onChange={setBlueLight}
                    type="screen"
                    idealBedtime={localProfile?.ideal_bedtime || '22:30'}
                    theme="rose"
                  />
                )}

                {/* Late Meal Timing */}
                {isExposureTracked('late_meal') && (
                  <TimingExposureCard
                    title="Last Meal Timing"
                    icon="🍟"
                    value={lateMeal}
                    onChange={setLateMeal}
                    type="meal"
                    idealBedtime={localProfile?.ideal_bedtime || '22:30'}
                    theme="rose"
                  />
                )}
              </div>
            </div>

            {/* 🌍 DAY CONTEXT & EXTERNAL CONFOUNDERS (CAUSATION ACCURACY SUITE) */}
            {anyConfounderActive && (
              isConfoundersExpanded ? (
                <div className="bg-gradient-to-br from-sky-950/40 via-slate-900 to-slate-950 p-4 rounded-2xl border border-sky-500/30 space-y-4 shadow-xl relative animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-sky-500/20 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-300">
                        <CloudSun size={13} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          Day Context &amp; External Confounders
                        </h4>
                        <span className="text-[9px] text-sky-300/70 block">
                          Isolates external life variables to calculate true protocol causation
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOutcomesModalTitle("Customize Tracked Confounders & Outcomes")
                          setOutcomesModalMode("nightly")
                          setIsOutcomesModalOpen(true)
                        }}
                        className="text-[10px] font-bold text-sky-300/80 hover:text-sky-200 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 px-2 py-0.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Sliders size={11} /> Settings
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfoundersExpanded(false)}
                        className="text-[10px] font-bold text-white/80 hover:text-white bg-black/40 hover:bg-black/60 border border-white/20 px-2 py-0.5 rounded-lg cursor-pointer transition-all shadow-sm"
                      >
                        Collapse ⌃
                      </button>
                    </div>
                  </div>

                  {/* 1. Ambient Weather & Atmospheric Card with Day Progression */}
                  {autoWeatherEnabled && (
                    <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl p-1.5 bg-white/5 rounded-xl border border-white/10 shrink-0">
                            {localWeather?.icon || '⛅'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {localWeather?.day_condition_summary || (localWeather ? `${localWeather.temp_f}°F • ${localWeather.condition}` : 'Detecting Local Weather...')}
                              </span>
                              {localWeather?.city && (
                                <span className="text-[10px] text-sky-300/80 font-medium">({localWeather.city})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                              {localWeather?.temp_max_f != null && localWeather?.temp_min_f != null ? (
                                <span className="text-sky-300 font-mono font-semibold">
                                  High {localWeather.temp_max_f}°F • Low {localWeather.temp_min_f}°F
                                </span>
                              ) : (
                                <span>Current: <strong className="text-white font-mono">{localWeather?.temp_f ?? 70}°F</strong></span>
                              )}
                              <span>•</span>
                              <span>{localWeather?.precipitation_sum && localWeather.precipitation_sum > 0 ? `🌧️ ${localWeather.precipitation_sum}" Precip` : '☀️ Dry / No Rain'}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleManualWeatherRefresh}
                          disabled={isFetchingWeather}
                          title="Refresh local weather"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        >
                          <RefreshCw size={13} className={isFetchingWeather ? 'animate-spin text-sky-400' : ''} />
                        </button>
                      </div>

                      {/* Day Progression Across Morning / Afternoon / Evening */}
                      {localWeather?.day_periods && localWeather.day_periods.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                          {localWeather.day_periods.map((period) => (
                            <div key={period.label} className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                              <span className="text-[10px] text-gray-400 font-semibold block">{period.label}</span>
                              <div className="text-base my-0.5">{period.icon}</div>
                              <span className="text-xs font-mono font-bold text-white block">{period.temp_f}°F</span>
                              <span className="text-[9px] text-sky-300/80 truncate block">{period.condition}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Subtle Secondary Atmospheric Metrics */}
                      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <span>Humidity: <strong className="text-gray-300 font-mono">{localWeather?.humidity ?? 50}%</strong></span>
                          <span>•</span>
                          <span>Barometer: <strong className="text-gray-300 font-mono">{localWeather?.pressure_hpa ?? 1013} hPa</strong></span>
                        </div>
                        {localWeather?.pressure_trend && (
                          <span className={`text-[9px] font-mono ${localWeather.pressure_trend === 'falling' ? 'text-amber-400' : localWeather.pressure_trend === 'rising' ? 'text-emerald-400' : 'text-gray-400'}`}>
                            {localWeather.pressure_trend === 'falling' ? '📉 Pressure Falling' : localWeather.pressure_trend === 'rising' ? '📈 Pressure Rising' : '⚖️ Pressure Stable'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. Day Busyness & Tempo Slider */}
                  {busynessDisplay !== 'hidden' && (
                    <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white font-bold flex items-center gap-1.5">
                          <span>⚡</span> Day Tempo / Busyness
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/30">
                            {dayBusyness <= 2 ? 'Spacious / Open' : dayBusyness <= 5 ? 'Steady / Balanced' : dayBusyness <= 8 ? 'High-Paced / Packed' : 'Redline / Firefighting'}
                          </span>
                          <span className="font-mono font-bold text-xs text-amber-300">{dayBusyness}/10</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={dayBusyness}
                        onChange={(e) => setDayBusyness(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
                      />
                      {/* Friction Tags */}
                      <div className="pt-1 flex items-center gap-1.5 flex-wrap text-[10px]">
                        <span className="text-gray-400 text-[9px] font-semibold uppercase">Drivers:</span>
                        {['Back-to-Back Meetings', 'Traffic / Commute', 'Deadlines / Crunch', 'Admin & Chores', 'Caregiving / Family'].map(tag => {
                          const active = busynessTags.includes(tag)
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                setBusynessTags(prev => active ? prev.filter(t => t !== tag) : [...prev, tag])
                              }}
                              className={`px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                                active
                                  ? 'bg-amber-500/20 text-amber-200 border-amber-400 font-bold'
                                  : 'bg-white/5 text-gray-400 hover:text-white border-white/10'
                              }`}
                            >
                              {tag}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. External Stressors & Root Cause */}
                  {stressorsDisplay !== 'hidden' && (
                    <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white font-bold flex items-center gap-1.5">
                          <span>💼</span> External Stressors &amp; Triggers
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            externalStress === 0 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : externalStress <= 4 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}>
                            {externalStress === 0 ? 'Serene / None' : externalStress <= 4 ? 'Mild Friction' : externalStress <= 7 ? 'Notable Stress' : 'Acute Crisis'}
                          </span>
                          <span className="font-mono font-bold text-xs text-rose-300">{externalStress}/10</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={externalStress}
                        onChange={(e) => setExternalStress(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-400"
                      />
                      {externalStress > 0 && (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                            <span className="text-gray-400 text-[9px] font-semibold uppercase">Domain:</span>
                            {[
                              { id: 'work', label: '💼 Work' },
                              { id: 'relationship', label: '👥 Relationship' },
                              { id: 'financial', label: '💸 Financial' },
                              { id: 'health', label: '🏥 Health' },
                              { id: 'family_logistics', label: '🏡 Logistics' }
                            ].map(domain => {
                              const active = stressorDomain === domain.id
                              return (
                                <button
                                  key={domain.id}
                                  type="button"
                                  onClick={() => setStressorDomain(active ? '' : domain.id)}
                                  className={`px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                                    active
                                      ? 'bg-rose-500/20 text-rose-200 border-rose-400 font-bold'
                                      : 'bg-white/5 text-gray-400 hover:text-white border-white/10'
                                  }`}
                                >
                                  {domain.label}
                                </button>
                              )
                            })}
                          </div>
                          <input
                            type="text"
                            placeholder="Brief cause (e.g. surprise client audit, flat tire, argument with partner)..."
                            value={stressorNotes}
                            onChange={(e) => setStressorNotes(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl p-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-400"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. Social Connection & Dynamics (Partner vs Friends Distinction & Multi-Select) */}
                  {socialDisplay !== 'hidden' && (
                    <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white font-bold flex items-center gap-1.5">
                          <span>👥</span> Social Connection &amp; Relational Tone
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            socialEnergyDelta > 0 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : socialEnergyDelta < 0 ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-white/10 text-gray-300 border-white/20'
                          }`}>
                            {socialEnergyDelta > 0 ? `+${socialEnergyDelta} Rejuvenating` : socialEnergyDelta < 0 ? `${socialEnergyDelta} Draining` : 'Neutral'}
                          </span>
                        </div>
                      </div>
                      {/* Cohort Selector with Partner vs Friends distinction & multi-select */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {[
                          { id: 'partner', label: '💑 Partner / Spouse' },
                          { id: 'friends', label: '👥 Friends / Social' },
                          { id: 'family', label: '🏡 Family / Relatives' },
                          { id: 'professional', label: '💼 Colleagues / Work' },
                          { id: 'solo', label: '🧘 Solo / Solitary' },
                          { id: 'draining', label: '⚡ Draining / Obligatory' }
                        ].map(c => {
                          const active = selectedSocialCohorts.includes(c.id) || (c.id === 'friends' && selectedSocialCohorts.includes('loved_ones'))
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleToggleSocialCohort(c.id)}
                              className={`p-2 rounded-xl text-center text-[10px] font-bold border transition cursor-pointer ${
                                active
                                  ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-sm'
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                              }`}
                            >
                              {c.label}
                            </button>
                          )
                        })}
                      </div>
                      {/* Net Energy Slider */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                          <span>Draining (-5)</span>
                          <span>Neutral (0)</span>
                          <span>Recharging (+5)</span>
                        </div>
                        <input
                          type="range"
                          min="-5"
                          max="5"
                          value={socialEnergyDelta}
                          onChange={(e) => setSocialEnergyDelta(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* 5. Productivity & Goal Execution */}
                  {productivityDisplay !== 'hidden' && (
                    <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white font-bold flex items-center gap-1.5">
                          <span>🎯</span> Productivity &amp; Goal Execution
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-indigo-300">{productivityScore}/10</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={productivityScore}
                        onChange={(e) => setProductivityScore(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                      />
                      {/* Focus Depth Selector */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                        {[
                          { id: 'deep_flow', label: '🎯 Deep Flow' },
                          { id: 'shallow_admin', label: '📋 Shallow Admin' },
                          { id: 'distracted', label: '🌀 Distracted' },
                          { id: 'rest_day', label: '🛑 Rest Day' }
                        ].map(depth => {
                          const active = productivityDepth === depth.id
                          return (
                            <button
                              key={depth.id}
                              type="button"
                              onClick={() => setProductivityDepth(active ? '' : depth.id)}
                              className={`p-1.5 rounded-lg text-center text-[10px] font-bold border transition cursor-pointer ${
                                active
                                  ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200'
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                              }`}
                            >
                              {depth.label}
                            </button>
                          )
                        })}
                      </div>
                      {/* Rule of 3 Goal Counter */}
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-gray-300 font-medium">Daily Non-Negotiable Goals Accomplished:</span>
                        <div className="flex items-center gap-1.5">
                          {[0, 1, 2, 3].map(count => (
                            <button
                              key={count}
                              type="button"
                              onClick={() => setGoalsCompleted(count)}
                              className={`w-7 h-7 rounded-lg font-mono font-bold text-xs border transition cursor-pointer ${
                                goalsCompleted === count
                                  ? 'bg-indigo-600 text-white border-indigo-400'
                                  : 'bg-white/5 text-gray-400 hover:text-white border-white/10'
                              }`}
                            >
                              {count}
                            </button>
                          ))}
                          <span className="text-gray-500 font-mono text-xs">/ 3</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Collapsed Ambient Confounders Bar */
                <div 
                  onClick={() => setIsConfoundersExpanded(true)}
                  className="mb-3 p-3.5 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-indigo-950/20 to-slate-950/60 cursor-pointer hover:border-sky-400/50 transition-all shadow-md flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-300 shrink-0 shadow-inner">
                      <CloudSun size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white block">Day Context &amp; External Confounders</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
                          Causation Shield
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-300 mt-1 flex-wrap">
                        {localWeather && autoWeatherEnabled && (
                          <span className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                            <span>{localWeather.icon}</span>
                            <span className="font-semibold text-white">{localWeather.day_condition_summary || localWeather.condition}</span>
                            {localWeather.temp_max_f != null && localWeather.temp_min_f != null && (
                              <span className="text-sky-300 font-mono text-[9px]">
                                ({localWeather.temp_max_f}° / {localWeather.temp_min_f}°)
                              </span>
                            )}
                          </span>
                        )}
                        {busynessDisplay !== 'hidden' && (
                          <span className="bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                            ⚡ Busyness: <strong className="text-amber-300 font-mono">{dayBusyness}/10</strong>
                          </span>
                        )}
                        {stressorsDisplay !== 'hidden' && externalStress > 0 && (
                          <span className="bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                            💼 Stress: <strong className="text-rose-300 font-mono">{externalStress}/10</strong>
                            {stressorDomain && ` (${stressorDomain})`}
                          </span>
                        )}
                        {socialDisplay !== 'hidden' && socialCohort && (
                          <span className="bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                            👥 Social: <strong className={socialEnergyDelta >= 0 ? 'text-emerald-300 font-mono' : 'text-rose-300 font-mono'}>{socialEnergyDelta >= 0 ? `+${socialEnergyDelta}` : socialEnergyDelta}</strong>
                            <span className="text-gray-400 text-[9px] ml-1">
                              ({selectedSocialCohorts.map(c => {
                                if (c === 'partner') return 'Partner'
                                if (c === 'friends') return 'Friends'
                                if (c === 'family') return 'Family'
                                if (c === 'loved_ones') return 'Loved Ones'
                                if (c === 'professional') return 'Colleagues'
                                if (c === 'solo') return 'Solo'
                                if (c === 'draining') return 'Draining'
                                return c
                              }).join(', ')})
                            </span>
                          </span>
                        )}
                        {productivityDisplay !== 'hidden' && (
                          <span className="bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                            🎯 Goals: <strong className="text-purple-300 font-mono">{goalsCompleted}/{goalsTotal}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1 shrink-0 ml-2">
                    Log Factors <ChevronDown size={14} />
                  </span>
                </div>
              )
            )}

            {/* Time of Last Meal Selector */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <span>🍽️</span> Time of Last Meal / Food
                </span>
                <span className="text-indigo-300 font-mono font-bold text-xs bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-500/40">
                  {lastFoodTime}
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 pt-1">
                {['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'].map((tStr) => (
                  <button
                    key={tStr}
                    type="button"
                    onClick={() => setLastFoodTime(tStr)}
                    className={`py-1.5 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
                      lastFoodTime === tStr 
                        ? 'bg-levl-accent text-white border-levl-accent font-bold shadow-md shadow-levl-accent/20' 
                        : 'bg-black/30 text-gray-300 border-white/10 hover:border-white/30'
                    }`}
                  >
                    {tStr}
                  </button>
                ))}
              </div>

              {/* Custom Manual Time Input */}
              <div className="flex items-center justify-between gap-3 pt-2 text-xs">
                <span className="text-gray-400 font-medium">Or enter exact custom time:</span>
                <input
                  type="text"
                  placeholder="e.g. 22:45"
                  value={lastFoodTime}
                  onChange={(e) => setLastFoodTime(e.target.value)}
                  className="bg-black/80 border border-white/20 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:border-rose-400 focus:outline-none cursor-pointer w-28 text-center"
                />
              </div>
            </div>

            {/* Evening Freeform Reflection & Notes Card */}
            <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-rose-200 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={13} className="text-rose-400" /> Evening Notes &amp; Day Decompression
                </label>
                {eveningNotes && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {eveningNotes.length} characters
                  </span>
                )}
              </div>
              <textarea
                value={eveningNotes}
                onChange={(e) => setEveningNotes(e.target.value)}
                placeholder="Reflect on today's wins, stressors, cognitive clarity, nutrition, or observations before sleep..."
                rows={3}
                className="w-full bg-slate-900/70 border border-rose-500/20 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-400/50 transition-all resize-none shadow-inner"
              />
            </div>

            <button
              type="button"
              onClick={handleNightlySave}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white rounded-lg py-2.5 text-xs font-bold transition-all shadow-lg shadow-rose-600/20 cursor-pointer"
            >
              {isNightlySaved ? (isPastDate ? "Save Updated Evening Check-in" : "Edit Evening Check-in") : "Log Evening Check-in"}
            </button>
          </div>
        ) : null}
      </div>
    )}

      <CustomizeCheckinOutcomesModal
        isOpen={isOutcomesModalOpen}
        onClose={() => setIsOutcomesModalOpen(false)}
        title={outcomesModalTitle}
        mode={outcomesModalMode}
        allOutcomes={combinedAllOutcomes}
        userProfile={localProfile}
        onOutcomesUpdated={(updatedPreferences, updatedProfile) => {
          if (updatedProfile) {
            setLocalProfile(updatedProfile)
          } else if (updatedPreferences) {
            setLocalProfile(prev => prev ? {
              ...prev,
              outcome_preference_scores: updatedPreferences
            } : null)
          }
          if (updatedPreferences?.custom_user_outcomes && Array.isArray(updatedPreferences.custom_user_outcomes)) {
            setCustomOutcomesList(updatedPreferences.custom_user_outcomes)
          }
        }}
      />

      <QuickOutcomeUpdateModal
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
        outcomeState={quickModalOutcome}
        onSave={handleQuickOutcomeSave}
      />
    </>
  )
}
