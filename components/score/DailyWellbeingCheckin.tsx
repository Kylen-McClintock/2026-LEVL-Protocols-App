'use client'

import { useState, useEffect, useMemo } from 'react'
import { DailyWellbeingCheckin as WellbeingType, UserProfile, OutcomeDimension } from '@/lib/types'
import { isFuture, isPast, isSameDay, format } from 'date-fns'
import { getOutcomeColorConfig, getNeutralOutcomeColorConfig } from '@/lib/utils/outcomeColors'
import { Moon, Sliders, ChevronUp, ChevronDown, Leaf, Clock, Utensils, Coffee, Smartphone } from 'lucide-react'
import CustomizeCheckinOutcomesModal from '@/components/modals/CustomizeCheckinOutcomesModal'

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
  const [inputMode, setInputMode] = useState<'hours' | 'time'>(value.startsWith('time:') ? 'time' : 'hours')
  const [exactTimeVal, setExactTimeVal] = useState(
    value.startsWith('time:') 
      ? value.replace('time:', '') 
      : (type === 'meal' ? '19:30' : type === 'caffeine' ? '14:00' : '21:30')
  )

  useEffect(() => {
    if (value.startsWith('time:')) {
      setInputMode('time')
      setExactTimeVal(value.replace('time:', ''))
    } else {
      setInputMode('hours')
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
              setInputMode('hours')
              onChange('skip')
            }}
            className="text-[10px] text-gray-400 hover:text-white px-2 py-1.5 bg-white/5 rounded border border-white/10"
          >
            Clear
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
  isCollapsedByDefault = false
}: { 
  onSave: (mood: number, energy: number, stress: number, sleep?: number, sleepScore?: number, customOutcomes?: Record<string, any>, lastFoodTime?: string) => void
  initialData: WellbeingType | null
  profile: UserProfile | null
  allOutcomes: OutcomeDimension[]
  date: Date
  isCurrentDay: boolean
  isCollapsedByDefault?: boolean
}) {
  const [mood, setMood] = useState(5)
  const [energy, setEnergy] = useState(5)
  const [stress, setStress] = useState(5)
  const [subjectiveSleep, setSubjectiveSleep] = useState(5)
  const [sleepScore, setSleepScore] = useState<string>('')
  const [lastFoodTime, setLastFoodTime] = useState<string>('19:00')

  // Additional Functional Outcomes
  const [skinClarity, setSkinClarity] = useState(5)
  const [focusScore, setFocusScore] = useState(5)

  // Negative Longevity Exposures State (Default: 'skip' for all)
  const [alcoholDrinks, setAlcoholDrinks] = useState<number | 'skip'>('skip')
  const [lateCaffeine, setLateCaffeine] = useState<string>('skip')
  const [nicotineExposure, setNicotineExposure] = useState<string>('skip')
  const [cannabisExposure, setCannabisExposure] = useState<string>('skip')
  const [sittingDuration, setSittingDuration] = useState<string>('skip')
  const [lateMeal, setLateMeal] = useState<string>('skip')
  const [blueLight, setBlueLight] = useState<string>('skip')
  const [processedSugar, setProcessedSugar] = useState<string>('skip')

  // Section Collapse Toggles
  const [showSleepSection, setShowSleepSection] = useState(true)
  const [showExposuresSection, setShowExposuresSection] = useState(true)
  const [showMealSection, setShowMealSection] = useState(true)
  const [showCoreMetricsSection, setShowCoreMetricsSection] = useState(true)
  const [showOutcomesSection, setShowOutcomesSection] = useState(true)

  // Nightly Check-in Expandable Card state (After 6 PM)
  const [showNightlyCard, setShowNightlyCard] = useState(false)
  const [isNightlyEditing, setIsNightlyEditing] = useState(false)
  const [isNightlySaved, setIsNightlySaved] = useState(false)

  // Tracked Outcomes Modal state
  const [isOutcomesModalOpen, setIsOutcomesModalOpen] = useState(false)
  const [outcomesModalTitle, setOutcomesModalTitle] = useState("Customize Tracked Outcomes")
  const [outcomesModalMode, setOutcomesModalMode] = useState<'morning' | 'nightly'>('morning')

  // Collapsible for retroactive last night's checkin in morning mode
  const [showLastNightRetro, setShowLastNightRetro] = useState(false)
  
  // Custom outcomes state
  const [customOutcomeValues, setCustomOutcomeValues] = useState<Record<string, number>>({})
  const [touchedOutcomes, setTouchedOutcomes] = useState<Record<string, boolean>>({})
  const [isSaved, setIsSaved] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isCollapsedAll, setIsCollapsedAll] = useState(isCollapsedByDefault)
  const [isMounted, setIsMounted] = useState(false)

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

  // Time-aware variables
  const currentHour = new Date().getHours()
  const isNightly = currentHour >= 18 // 6 PM or later
  const phaseLabel = isCurrentDay ? (isNightly ? 'Nightly Check-in' : 'Morning Check-in') : `Check-in for ${date.toLocaleDateString()}`
  
  const isFutureDate = isFuture(date) && !isSameDay(date, new Date())
  const isPastDate = isPast(date) && !isSameDay(date, new Date())
  
  // Identify sleep-related outcomes from library
  const sleepOutcomes = useMemo(() => {
    return allOutcomes.filter(o => {
      const idLower = o.id.toLowerCase()
      const nameLower = o.name.toLowerCase()
      const catLower = (o.category || '').toLowerCase()
      return idLower.includes('sleep') || nameLower.includes('sleep') || catLower.includes('sleep')
    })
  }, [allOutcomes])

  const [localProfile, setLocalProfile] = useState<UserProfile | null>(profile || null)

  useEffect(() => {
    if (profile) setLocalProfile(profile)
  }, [profile])

  // Helper to determine if an outcome is tracked in morning vs nightly mode
  const isOutcomeTracked = (id: string, mode: 'morning' | 'nightly') => {
    const prefs = localProfile?.outcome_preference_scores
    const key = `${mode}:${id}`
    const val = prefs ? (prefs[key] ?? prefs[id]) : undefined
    if (val === undefined) {
      // Default recommended items if no explicit preference set yet
      if (mode === 'morning') {
        return ['mood', 'energy', 'stress', 'sleep_quality', 'subjective_sleep', 'waking_restedness'].includes(id)
      } else {
        return ['mood', 'energy', 'stress', 'focus', 'focus_score', 'mental_clarity', 'digestive_comfort'].includes(id)
      }
    }
    return val >= 7
  }

  // Calculate dynamic non-sleep custom outcomes to track for Morning Check-in
  const morningOutcomesToTrack = useMemo(() => {
    return allOutcomes.filter(o => {
      const idLower = o.id.toLowerCase()
      const nameLower = o.name.toLowerCase()
      const catLower = (o.category || '').toLowerCase()

      // Exclude sleep outcomes handled in dedicated sleep section
      if (idLower.includes('sleep') || nameLower.includes('sleep') || catLower.includes('sleep')) return false

      // Exclude core metrics explicitly rendered in top section
      if (['mood', 'energy', 'stress', 'skin', 'skin_clarity', 'focus', 'focus_score'].includes(o.id)) return false

      return isOutcomeTracked(o.id, 'morning')
    })
  }, [localProfile, allOutcomes])

  // Calculate dynamic non-sleep custom outcomes to track for Nightly Check-in
  const nightlyOutcomesToTrack = useMemo(() => {
    return allOutcomes.filter(o => {
      const idLower = o.id.toLowerCase()
      const nameLower = o.name.toLowerCase()
      const catLower = (o.category || '').toLowerCase()

      // Exclude sleep outcomes handled in dedicated sleep section
      if (idLower.includes('sleep') || nameLower.includes('sleep') || catLower.includes('sleep')) return false

      // Exclude core metrics explicitly rendered in top section
      if (['mood', 'energy', 'stress', 'skin', 'skin_clarity', 'focus', 'focus_score'].includes(o.id)) return false

      return isOutcomeTracked(o.id, 'nightly')
    })
  }, [localProfile, allOutcomes])

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
      setSkinClarity(customJSON.skin_clarity ?? 5)
      setFocusScore(customJSON.focus_score ?? 5)
      setAlcoholDrinks(customJSON.alcohol_drinks !== undefined && customJSON.alcohol_drinks !== null ? customJSON.alcohol_drinks : 'skip')
      setLateCaffeine(customJSON.late_caffeine || 'skip')
      setNicotineExposure(customJSON.nicotine_exposure || 'skip')
      setCannabisExposure(customJSON.cannabis_exposure || 'skip')
      setSittingDuration(customJSON.sitting_duration || 'skip')
      setLateMeal(customJSON.late_meal !== undefined && customJSON.late_meal !== null ? (typeof customJSON.late_meal === 'string' ? customJSON.late_meal : customJSON.late_meal ? '1.5' : '4.0') : 'skip')
      setBlueLight(customJSON.blue_light || 'skip')
      setProcessedSugar(customJSON.processed_sugar || 'skip')
      
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

      const hasMorningData = initialData.mood_0_10 != null || initialData.energy_0_10 != null || initialData.subjective_sleep_0_10 != null
      const savedBool = Boolean(hasMorningData)
      setIsSaved(savedBool)
      if (typeof window !== 'undefined' && date) {
        const dStr = format(date, 'yyyy-MM-dd')
        localStorage.setItem('levl_checkin_saved_' + dStr, savedBool ? 'true' : 'false')
      }

      const hasNightlyData = initialData.last_food_time != null ||
        customJSON.alcohol_drinks !== undefined ||
        customJSON.late_caffeine ||
        customJSON.nicotine_exposure ||
        customJSON.cannabis_exposure ||
        customJSON.sitting_duration ||
        customJSON.late_meal !== undefined ||
        customJSON.blue_light ||
        customJSON.processed_sugar
      
      setIsNightlySaved(Boolean(hasNightlyData))
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
      setLateCaffeine('skip')
      setNicotineExposure('skip')
      setCannabisExposure('skip')
      setSittingDuration('skip')
      setLateMeal('skip')
      setBlueLight('skip')
      setProcessedSugar('skip')
      const dStr = date ? format(date, 'yyyy-MM-dd') : ''
      const localSaved = typeof window !== 'undefined' && dStr && localStorage.getItem('levl_checkin_saved_' + dStr) === 'true'
      if (!localSaved) {
        setIsSaved(false)
      }
      setIsEditing(false)
      setIsNightlySaved(false)
    }
  }, [initialData, date])

  const handleMorningSave = () => {
    const combinedCustomOutcomes: Record<string, any> = {
      ...customOutcomeValues,
      skin_clarity: skinClarity,
      focus_score: focusScore
    }

    if (alcoholDrinks !== 'skip') combinedCustomOutcomes.alcohol_drinks = Number(alcoholDrinks)
    if (lateCaffeine !== 'skip') combinedCustomOutcomes.late_caffeine = lateCaffeine
    if (nicotineExposure !== 'skip') combinedCustomOutcomes.nicotine_exposure = nicotineExposure
    if (cannabisExposure !== 'skip') combinedCustomOutcomes.cannabis_exposure = cannabisExposure
    if (sittingDuration !== 'skip') combinedCustomOutcomes.sitting_duration = sittingDuration
    if (lateMeal !== 'skip') combinedCustomOutcomes.late_meal = lateMeal
    if (blueLight !== 'skip') combinedCustomOutcomes.blue_light = blueLight
    if (processedSugar !== 'skip') combinedCustomOutcomes.processed_sugar = processedSugar

    onSave(mood, energy, stress, subjectiveSleep, sleepScore === '' ? undefined : Number(sleepScore), combinedCustomOutcomes, lastFoodTime)
    setIsSaved(true)
    setIsEditing(false)
    if (typeof window !== 'undefined' && date) {
      const dStr = format(date, 'yyyy-MM-dd')
      localStorage.setItem('levl_checkin_saved_' + dStr, 'true')
    }
  }

  const handleNightlySave = () => {
    const combinedCustomOutcomes: Record<string, any> = {
      ...customOutcomeValues,
      skin_clarity: skinClarity,
      focus_score: focusScore
    }

    if (alcoholDrinks !== 'skip') combinedCustomOutcomes.alcohol_drinks = Number(alcoholDrinks)
    if (lateCaffeine !== 'skip') combinedCustomOutcomes.late_caffeine = lateCaffeine
    if (nicotineExposure !== 'skip') combinedCustomOutcomes.nicotine_exposure = nicotineExposure
    if (cannabisExposure !== 'skip') combinedCustomOutcomes.cannabis_exposure = cannabisExposure
    if (sittingDuration !== 'skip') combinedCustomOutcomes.sitting_duration = sittingDuration
    if (lateMeal !== 'skip') combinedCustomOutcomes.late_meal = lateMeal
    if (blueLight !== 'skip') combinedCustomOutcomes.blue_light = blueLight
    if (processedSugar !== 'skip') combinedCustomOutcomes.processed_sugar = processedSugar

    onSave(mood, energy, stress, subjectiveSleep, sleepScore === '' ? undefined : Number(sleepScore), combinedCustomOutcomes, lastFoodTime)
    setIsNightlySaved(true)
    setShowNightlyCard(false)
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
            ✏️ {initialData ? 'Edit' : 'Log'}
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
            {(sleepScoreVal != null || lastFoodVal || customJSON.skin_clarity != null || customJSON.focus_score != null || customJSON.alcohol_drinks !== undefined || (customJSON.cannabis_exposure && customJSON.cannabis_exposure !== 'skip') || (customJSON.nicotine_exposure && customJSON.nicotine_exposure !== 'skip') || (customJSON.late_caffeine && customJSON.late_caffeine !== 'skip') || (customJSON.blue_light && customJSON.blue_light !== 'skip') || (customJSON.late_meal && customJSON.late_meal !== 'skip')) && (
              <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
                {sleepScoreVal != null && (
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono font-semibold flex items-center gap-1.5">
                    🌙 Wearable Sleep: <strong className="text-white">{sleepScoreVal}/100</strong>
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

  return (
    <>
      {/* 🌅 MORNING CHECK-IN CARD */}
      {(isSaved && !isEditing) || isCollapsedAll ? (
        <div className="glass-card py-2.5 px-3 sm:px-4 rounded-xl mb-4 border border-emerald-500/30 bg-emerald-950/20 animate-in fade-in space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-2 h-2 rounded-full shrink-0 ${isSaved ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-white font-bold text-xs sm:text-sm truncate">
                {isSaved ? 'Morning Check-in Complete' : 'Morning Check-in (Collapsed)'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setOutcomesModalTitle("Customize Morning Tracked Outcomes")
                  setOutcomesModalMode("morning")
                  setIsOutcomesModalOpen(true)
                }}
                className="text-[11px] font-semibold text-gray-300 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                title="Edit tracked outcomes"
              >
                <Sliders size={12} /> <span className="hidden sm:inline">Tracked Outcomes</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCollapsedAll(false)
                  setIsEditing(true)
                }}
                className="text-[11px] font-semibold text-emerald-300 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronDown size={12} /> {isSaved ? 'Edit' : 'Expand'}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-xs">
            <div 
              className={`py-1.5 px-1 sm:p-2 rounded-lg border text-center transition-all ${currentMoodCfg.borderColor}`}
              style={{ backgroundColor: `${currentMoodCfg.accentHex}15` }}
            >
              <div className="flex items-center justify-center gap-1 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                <span>Mood</span>
                <span className={`text-[8px] font-bold px-1 py-0.2 rounded hidden sm:inline ${currentMoodCfg.badgeBg}`}>{currentMoodCfg.qualityLabel}</span>
              </div>
              <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                <span className={`font-mono font-black text-sm sm:text-base ${currentMoodCfg.textColor}`}>{mood}</span>
                <span className="text-gray-500 text-[10px] font-mono">/10</span>
              </div>
            </div>

            <div 
              className={`py-1.5 px-1 sm:p-2 rounded-lg border text-center transition-all ${currentEnergyCfg.borderColor}`}
              style={{ backgroundColor: `${currentEnergyCfg.accentHex}15` }}
            >
              <div className="flex items-center justify-center gap-1 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                <span>Energy</span>
                <span className={`text-[8px] font-bold px-1 py-0.2 rounded hidden sm:inline ${currentEnergyCfg.badgeBg}`}>{currentEnergyCfg.qualityLabel}</span>
              </div>
              <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                <span className={`font-mono font-black text-sm sm:text-base ${currentEnergyCfg.textColor}`}>{energy}</span>
                <span className="text-gray-500 text-[10px] font-mono">/10</span>
              </div>
            </div>

            <div 
              className={`py-1.5 px-1 sm:p-2 rounded-lg border text-center transition-all ${currentStressCfg.borderColor}`}
              style={{ backgroundColor: `${currentStressCfg.accentHex}15` }}
            >
              <div className="flex items-center justify-center gap-1 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                <span>Stress</span>
                <span className={`text-[8px] font-bold px-1 py-0.2 rounded hidden sm:inline ${currentStressCfg.badgeBg}`}>{currentStressCfg.qualityLabel}</span>
              </div>
              <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                <span className={`font-mono font-black text-sm sm:text-base ${currentStressCfg.textColor}`}>{stress}</span>
                <span className="text-gray-500 text-[10px] font-mono">/10</span>
              </div>
            </div>

            <div 
              className={`py-1.5 px-1 sm:p-2 rounded-lg border text-center transition-all ${currentSleepCfg.borderColor}`}
              style={{ backgroundColor: `${currentSleepCfg.accentHex}15` }}
            >
              <div className="flex items-center justify-center gap-1 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                <span>Sleep</span>
                <span className={`text-[8px] font-bold px-1 py-0.2 rounded hidden sm:inline ${currentSleepCfg.badgeBg}`}>{currentSleepCfg.qualityLabel}</span>
              </div>
              <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                <span className={`font-mono font-black text-sm sm:text-base ${currentSleepCfg.textColor}`}>{subjectiveSleep}</span>
                <span className="text-gray-500 text-[10px] font-mono">/10</span>
              </div>
            </div>
          </div>

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
              onClick={() => setShowLastNightRetro(!showLastNightRetro)}
              className="text-xs font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-3.5 py-1.5 rounded-lg hover:bg-indigo-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Moon size={14} /> {showLastNightRetro ? 'Hide Last Night Log' : "Log Last Night's Exposures & Sleep"}
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

      {/* Retroactive Last Night's Exposures & Sleep Box (Morning Mode Expandable) */}
      {(!isNightly && showLastNightRetro) && (
        <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-xl p-4 space-y-4 animate-in fade-in">
          <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-indigo-500/30 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Moon size={14} /> Retroactive Last Night's Exposures & Sleep Log</span>
            <button 
              type="button" 
              onClick={() => setShowLastNightRetro(false)} 
              className="text-[10px] text-gray-400 hover:text-white underline cursor-pointer"
            >
              Collapse
            </button>
          </div>

          {/* Retroactive Sleep Inputs */}
          <div className="bg-black/30 p-3 rounded-lg border border-white/10 space-y-3">
            <h5 className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">Last Night's Sleep Quality</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-gray-300 block mb-1">Subjective Sleep Rating (0-10)</label>
                <input 
                  type="range" min="0" max="10" 
                  value={subjectiveSleep} 
                  onChange={(e) => setSubjectiveSleep(parseInt(e.target.value))} 
                  className="w-full accent-indigo-400 cursor-pointer" 
                />
                <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                  <span>Poor</span><span>{subjectiveSleep}/10</span><span>Restorative</span>
                </div>
              </div>

              <div>
                <label className="text-gray-300 block mb-1">Objective Sleep Score (0-100)</label>
                <input 
                  type="number" min="0" max="100" 
                  value={sleepScore} 
                  onChange={(e) => setSleepScore(e.target.value)} 
                  placeholder="e.g. 85 (Oura/Apple/Whoop)" 
                  className="w-full bg-black/60 border border-white/20 rounded p-1.5 text-white font-mono text-xs" 
                />
              </div>
            </div>
          </div>

          {/* Retroactive Negative Exposures Grid */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h5 className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1">
                <span>🚫</span> Last Night's Negative Exposures &amp; Lifestyle Factors
              </h5>
              <button
                type="button"
                onClick={() => {
                  setOutcomesModalTitle("Customize Tracked Exposures & Outcomes")
                  setOutcomesModalMode("morning")
                  setIsOutcomesModalOpen(true)
                }}
                className="text-[10px] font-bold text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer"
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
                  <label className="font-bold text-white block">🚬 Nicotine & Smoking</label>
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
          </div>
        </div>
      )}


      
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
                    className="w-full cursor-pointer" 
                    style={{ accentColor: colorCfg.accentHex }}
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
                    className="w-full cursor-pointer" 
                    style={{ accentColor: colorCfg.accentHex }}
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
                  const colorCfg = isTouched ? getOutcomeColorConfig(mood, 'higher_is_better') : getNeutralOutcomeColorConfig()
                  return (
                    <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white font-bold">{isNightly ? 'Overall Mood Today' : 'Morning Mood (Current)'}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${colorCfg.badgeBg}`}>
                            {colorCfg.qualityLabel}
                          </span>
                          <span className={`font-mono font-bold text-xs ${colorCfg.textColor}`}>{mood}/10</span>
                        </div>
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
                        className="w-full cursor-pointer" 
                        style={{ accentColor: colorCfg.accentHex }}
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
                  const colorCfg = isTouched ? getOutcomeColorConfig(energy, 'higher_is_better') : getNeutralOutcomeColorConfig()
                  return (
                    <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white font-bold">{isNightly ? 'Overall Daily Energy' : 'Morning Readiness & Energy (Current)'}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${colorCfg.badgeBg}`}>
                            {colorCfg.qualityLabel}
                          </span>
                          <span className={`font-mono font-bold text-xs ${colorCfg.textColor}`}>{energy}/10</span>
                        </div>
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
                        className="w-full cursor-pointer" 
                        style={{ accentColor: colorCfg.accentHex }}
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
                  const colorCfg = isTouched ? getOutcomeColorConfig(stress, 'lower_is_better') : getNeutralOutcomeColorConfig()
                  return (
                    <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white font-bold">{isNightly ? 'Overall Stress Today' : 'Current Morning Stress'}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${colorCfg.badgeBg}`}>
                            {colorCfg.qualityLabel}
                          </span>
                          <span className={`font-mono font-bold text-xs ${colorCfg.textColor}`}>{stress}/10</span>
                        </div>
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
                        className="w-full cursor-pointer" 
                        style={{ accentColor: colorCfg.accentHex }}
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
                  const colorCfg = isTouched ? getOutcomeColorConfig(skinClarity, 'higher_is_better') : getNeutralOutcomeColorConfig()
                  return (
                    <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white font-bold flex items-center gap-1">
                          ✨ Skin Clarity & Radiance
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${colorCfg.badgeBg}`}>
                            {colorCfg.qualityLabel}
                          </span>
                          <span className={`font-mono font-bold text-xs ${colorCfg.textColor}`}>{skinClarity}/10</span>
                        </div>
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
                        className="w-full cursor-pointer" 
                        style={{ accentColor: colorCfg.accentHex }}
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
                  const colorCfg = isTouched ? getOutcomeColorConfig(focusScore, 'higher_is_better') : getNeutralOutcomeColorConfig()
                  return (
                    <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white font-bold flex items-center gap-1">
                          🧠 {isNightly ? 'Overall Focus & Mental Clarity Today' : 'Current Mental Focus & Clarity'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${colorCfg.badgeBg}`}>
                            {colorCfg.qualityLabel}
                          </span>
                          <span className={`font-mono font-bold text-xs ${colorCfg.textColor}`}>{focusScore}/10</span>
                        </div>
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
                        className="w-full cursor-pointer" 
                        style={{ accentColor: colorCfg.accentHex }}
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
              const val = customOutcomeValues[outcome.id] ?? 5
              const isTouched = touchedOutcomes[outcome.id]
              const colorCfg = isTouched ? getOutcomeColorConfig(val, outcome.directionality) : getNeutralOutcomeColorConfig()
              const isLowerBetter = outcome.directionality === 'lower_is_better'

              return (
                <div key={outcome.id} className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white font-bold">{isNightly ? `Overall ${outcome.name} Today` : `Morning ${outcome.name}`}</span>
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
                      setCustomOutcomeValues(prev => ({...prev, [outcome.id]: parseInt(e.target.value)}))
                      setTouchedOutcomes(prev => ({...prev, [outcome.id]: true}))
                    }} 
                    className="w-full cursor-pointer" 
                    style={{ accentColor: colorCfg.accentHex }}
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

      <button onClick={handleMorningSave} className="w-full bg-levl-accent text-white rounded-lg py-3 text-sm font-bold hover:bg-levl-accent/90 transition-colors mt-2 shadow-lg shadow-levl-accent/20 cursor-pointer">
        {isSaved ? `Update Morning Check-in Ratings` : `Log Morning Check-in`}
      </button>
    </div>
  )}

    {/* Dedicated Nightly Check-in Card (ONLY VISIBLE AFTER 6:00 PM) */}
    {isNightly && isCurrentDay && (
      <div className="glass-card p-4 rounded-xl mb-6 space-y-4 border border-rose-500/30 bg-rose-950/20">
        <div 
          onClick={() => setShowNightlyCard(!showNightlyCard)}
          className="flex items-center justify-between flex-wrap gap-2 cursor-pointer hover:opacity-90 transition-all select-none p-1"
        >
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isNightlySaved ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
            <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
              <Moon size={15} className="text-rose-300" /> Today's Nightly Check-in
            </h3>
            <span className="text-[10px] text-rose-300/80 font-semibold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              {showNightlyCard ? '▲ Collapse' : isNightlySaved ? '▼ Edit' : '▼ Expand'}
            </span>
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
            {/* Negative Longevity Exposures Grid */}
            <div className="space-y-3">
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

            {/* End-of-Day Wellbeing Reflection */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span> End-of-Day Reflection & Overall Wellbeing
              </h4>
              <div className="space-y-3">
                {/* Mood Today */}
                <div className="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">Overall Mood Today</span>
                    <span className="font-mono font-bold text-xs text-indigo-300">{mood}/10</span>
                  </div>
                  <input
                    type="range" min="0" max="10"
                    value={mood}
                    onChange={(e) => setMood(parseInt(e.target.value))}
                    className="w-full accent-indigo-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-gray-400">
                    <span>0: Low / Down</span><span>10: High / Great</span>
                  </div>
                </div>

                {/* Energy Today */}
                <div className="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">Overall Energy Today</span>
                    <span className="font-mono font-bold text-xs text-indigo-300">{energy}/10</span>
                  </div>
                  <input
                    type="range" min="0" max="10"
                    value={energy}
                    onChange={(e) => setEnergy(parseInt(e.target.value))}
                    className="w-full accent-indigo-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-gray-400">
                    <span>0: Lethargic</span><span>10: Peak Energy</span>
                  </div>
                </div>

                {/* Stress Today */}
                <div className="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">Overall Stress Today</span>
                    <span className="font-mono font-bold text-xs text-indigo-300">{stress}/10</span>
                  </div>
                  <input
                    type="range" min="0" max="10"
                    value={stress}
                    onChange={(e) => setStress(parseInt(e.target.value))}
                    className="w-full accent-indigo-400 cursor-pointer"
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
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${colorCfg.badgeBg}`}>
                            {colorCfg.qualityLabel}
                          </span>
                          <span className={`font-mono font-bold text-xs ${colorCfg.textColor}`}>{val}/10</span>
                        </div>
                      </div>
                      <input 
                        type="range" min="0" max="10" 
                        value={val} 
                        onChange={(e) => {
                          const newVal = parseInt(e.target.value)
                          setCustomOutcomeValues(prev => ({ ...prev, [outcome.id]: newVal }))
                          setTouchedOutcomes(prev => ({ ...prev, [outcome.id]: true }))
                        }} 
                        className="w-full cursor-pointer" 
                        style={{ accentColor: colorCfg.accentHex }}
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

            <button
              type="button"
              onClick={handleNightlySave}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white rounded-lg py-2.5 text-xs font-bold transition-all shadow-lg shadow-rose-600/20 cursor-pointer"
            >
              {isNightlySaved ? "Update Nightly Check-in" : "Log Today's Nightly Check-in"}
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
        allOutcomes={allOutcomes}
        userProfile={localProfile}
        onOutcomesUpdated={(updatedPreferences) => {
          if (updatedPreferences) {
            setLocalProfile(prev => prev ? {
              ...prev,
              outcome_preference_scores: updatedPreferences
            } : null)
          }
        }}
      />
    </>
  )
}
