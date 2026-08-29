'use client'

import React, { useState, useMemo, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { updateUserProfile, createDailyTask, getOrCreateUserProfile } from '@/lib/data'
import { saveUserHotkeys } from '@/lib/storage/quickLogsStorage'
import { POPULAR_HOTKEY_LIBRARY, DEFAULT_STARTER_HOTKEYS } from '@/lib/quicklog/quickHotkeyLibrary'
import { format } from 'date-fns'
import { 
  Sparkles, Check, ArrowRight, ArrowLeft, ShieldCheck, Zap, Moon, 
  Brain, Dna, Dumbbell, Flame, Droplets, Watch, Pill, Activity, 
  Heart, Shield, Clock, Sun, Sunrise, Sunset, Utensils, Award, 
  RotateCcw, CheckCircle2, ChevronRight, Info, Eye, Camera, FileText,
  Sliders, Thermometer
} from 'lucide-react'

interface ModalityOption {
  id: string
  name: string
  dose: string
  timing: string
  requiredHardware?: string
  goalKey: string
}

const STARTER_CATALOG: ModalityOption[] = [
  { id: 'morning_sunlight', name: 'Morning Optic Sunlight & Photons', dose: '10–15 mins outdoors within 60m of waking', timing: 'morning', goalKey: 'energy' },
  { id: 'water_electrolytes', name: 'Baseline Hydration + Electrolytes', dose: '16–20 oz pure water + trace minerals', timing: 'morning', goalKey: 'energy' },
  { id: 'cold_shower_or_plunge', name: 'Deliberate Cold Exposure', dose: '2–3 mins (50°F–55°F / 10°C–13°C)', timing: 'morning', requiredHardware: 'cold_plunge', goalKey: 'recovery' },
  { id: 'creatine_monohydrate', name: 'Creatine Monohydrate', dose: '5g with morning hydration', timing: 'morning', requiredHardware: 'supplements', goalKey: 'strength' },
  { id: 'omega3_epa_dha', name: 'High-Concentration Omega-3 EPA/DHA', dose: '2,000mg with breakfast/EVOO', timing: 'morning', requiredHardware: 'supplements', goalKey: 'longevity' },
  { id: 'zone2_cardio_30m', name: 'Zone 2 Mitochondrial Endurance', dose: '30–45 mins (Nasally breathing, HR 60-70% max)', timing: 'afternoon', goalKey: 'longevity' },
  { id: 'sauna_session', name: 'Heat Shock Sauna Session', dose: '20 mins at 174°F+ (80°C+)', timing: 'afternoon', requiredHardware: 'sauna', goalKey: 'longevity' },
  { id: 'ppl_push_day', name: 'Resistance Hypertrophy Session', dose: '45–60 mins (RPE 7-9, 2-3 RIR)', timing: 'afternoon', requiredHardware: 'gym', goalKey: 'strength' },
  { id: 'post_meal_glucose_walk', name: 'Post-Meal Glycemic Walk', dose: '15–20 mins brisk walk post-nutrition', timing: 'evening', goalKey: 'longevity' },
  { id: 'breathing_4_7_8', name: '4-7-8 Relaxing Wind-Down Breathwork', dose: '4 cycles (5 mins before bed)', timing: 'evening', goalKey: 'sleep' },
  { id: 'magnesium_glycinate', name: 'Magnesium Bisglycinate (Sleep Depth)', dose: '400mg with water 60m pre-bed', timing: 'evening', requiredHardware: 'supplements', goalKey: 'sleep' },
  { id: 'melatonin_onset_dimming', name: '2-Hour Blue-Light Shielding', dose: 'Circadian dimming & amber glasses 120m pre-bed', timing: 'evening', goalKey: 'sleep' }
]

// Database Parity: Grouped into biological tracking time horizons
const MORNING_CORE_OUTCOMES = [
  { id: 'sleep_quality', name: 'Sleep Quality', description: 'Restorative deep sleep architecture and subjective restfulness', icon: <Moon size={16} className="text-indigo-400" /> },
  { id: 'sleep_latency', name: 'Sleep Latency', description: 'Time it took to fall asleep after lights out', icon: <Clock size={16} className="text-cyan-400" /> },
  { id: 'waking_restedness', name: 'Waking Restedness', description: 'Feeling refreshed and alert upon waking with natural cortisol timing', icon: <Sunrise size={16} className="text-emerald-400" /> },
  { id: 'mood', name: 'Morning Mood', description: 'Baseline emotional state and optimism upon waking (moment-in-time check)', icon: <Sparkles size={16} className="text-yellow-400" /> },
  { id: 'energy', name: 'Morning Readiness & Energy', description: 'Starting physical and mental energy upon waking (moment-in-time check)', icon: <Zap size={16} className="text-amber-400" /> }
]

const EVENING_CORE_OUTCOMES = [
  { id: 'energy', name: 'Overall Daily Energy', description: 'Cumulative physical stamina and freedom from afternoon crashes across the whole day', icon: <Zap size={16} className="text-amber-400" /> },
  { id: 'focus', name: 'Full-Day Focus & Mental Clarity', description: 'Deep attention span, productivity, clear thinking, and flow state throughout the day', icon: <Brain size={16} className="text-sky-400" /> },
  { id: 'stress', name: 'Daily Stress & Autonomic Tone', description: 'Stress resilience, parasympathetic calm, and evening nervous system recovery', icon: <Heart size={16} className="text-emerald-400" /> },
  { id: 'mood', name: 'Overall Daily Well-Being', description: 'Cumulative feeling of satisfaction, mood stability, and motivation across the day', icon: <Sparkles size={16} className="text-yellow-400" /> },
  { id: 'digestive_comfort', name: 'Digestive & Metabolic Comfort', description: 'Gut comfort, lack of post-meal bloating, and clean energy uptake across meals', icon: <Flame size={16} className="text-orange-400" /> }
]

const PROTOCOL_TRIGGERED_OUTCOMES = [
  { id: 'soreness', name: 'Muscular Soreness & Recovery', description: 'Muscular or joint recovery and low inflammation (prompted post-training)', icon: <Shield size={16} className="text-purple-400" /> },
  { id: 'strength', name: 'Strength & Power Output', description: 'Physical work capacity and strength output (prompted post-training)', icon: <Dumbbell size={16} className="text-rose-400" /> }
]

// Positive Daily Micro-Habits (Defaults pre-selected)
const POSITIVE_HABITS_OPTIONS = [
  { id: 'water_intake', name: 'Hydration & Water Goal', icon: '💧', desc: 'Daily ounces with hydration progress', hotkeyId: 'water_intake' },
  { id: 'coffee_caffeine', name: 'Coffee & Caffeine Tracking', icon: '☕', desc: 'Cups & mg with circadian cutoff timing', hotkeyId: 'coffee_caffeine' },
  { id: 'outside_sunlight', name: 'Daylight & Sunlight Exposure', icon: '☀️', desc: 'Circadian optic flow & retinal photons', hotkeyId: 'outside_sunlight' },
  { id: 'mindful_break', name: 'Mindful Breathwork Break', icon: '🧘', desc: 'Cyclic sighing / box breathing resets', hotkeyId: 'mindful_break' },
  { id: 'daily_steps', name: 'Daily Steps & Walking', icon: '🚶', desc: 'Zone 1 base movement & post-meal walks', hotkeyId: 'daily_steps' }
]

// Negative Lifestyle Exposures to Monitor (Optional)
const NEGATIVE_EXPOSURES_OPTIONS = [
  { id: 'alcohol_drinks', name: 'Alcohol Intake', icon: '🍷', desc: 'Standard drinks and REM sleep suppression', hotkeyId: 'alcohol_drink' },
  { id: 'nicotine_exposure', name: 'Nicotine & Vaping', icon: '🚬', desc: 'Combustibles, vapes, and pouches', hotkeyId: 'nicotine_log' },
  { id: 'cannabis_exposure', name: 'Cannabis & THC', icon: '🌿', desc: 'Flower, edibles, and tinctures', hotkeyId: 'cannabis_log' },
  { id: 'late_caffeine', name: 'Late Caffeine Cutoff', icon: '☕', desc: 'Tracks consumption within 8-10h of bed', hotkeyId: 'coffee_caffeine' },
  { id: 'blue_light', name: 'Late Screen / Blue Light', icon: '📱', desc: 'Screen exposure in final 2 hours pre-bed', hotkeyId: 'late_screen_log' },
  { id: 'processed_sugar', name: 'Ultra-Processed Foods', icon: '🍕', desc: 'High-glycemic and refined seed oil foods', hotkeyId: 'junk_food_log' },
  { id: 'sitting_duration', name: 'Prolonged Sitting', icon: '🪑', desc: 'Sedentary desk & sitting duration', hotkeyId: 'sedentary_stretch' }
]

const PRIMARY_GOAL_OPTIONS = [
  { id: 'longevity', title: 'Biological Age Reversal', subtitle: 'Trigger cellular autophagy, reduce epigenetic age, and boost DNA repair', icon: <Dna size={20} className="text-emerald-400" />, color: 'emerald' },
  { id: 'sleep', title: 'Deep Sleep & Recovery', subtitle: 'Optimize sleep latency, HRV, and deep/REM restorative cycles', icon: <Moon size={20} className="text-indigo-400" />, color: 'indigo' },
  { id: 'energy', title: 'Mitochondrial Energy & Alertness', subtitle: 'Crush afternoon brain fog and maximize cellular ATP generation', icon: <Zap size={20} className="text-amber-400" />, color: 'amber' },
  { id: 'focus', title: 'Cognitive Performance & Flow', subtitle: 'Neurochemical optimization for laser focus and sustained drive', icon: <Brain size={20} className="text-sky-400" />, color: 'sky' },
  { id: 'strength', title: 'Muscle Hypertrophy & Metabolism', subtitle: 'Lean mass retention, progressive overload, and glucose disposal', icon: <Dumbbell size={20} className="text-rose-400" />, color: 'rose' },
  { id: 'recovery', title: 'Athletic Recovery & Soreness', subtitle: 'Rapid tissue repair, joint mobility, and low systemic inflammation', icon: <Shield size={20} className="text-purple-400" />, color: 'purple' }
]

const HARDWARE_OPTIONS = [
  { id: 'cold_plunge', label: 'Cold Plunge / Tub', icon: <Droplets size={16} className="text-cyan-400" />, desc: 'Dedicated cold tub or ice bath access' },
  { id: 'sauna', label: 'Sauna / Infrared', icon: <Flame size={16} className="text-amber-400" />, desc: 'Traditional dry sauna or infrared room' },
  { id: 'gym', label: 'Weights / Gym Access', icon: <Dumbbell size={16} className="text-rose-400" />, desc: 'Barbells, dumbbells, cables or machines' },
  { id: 'wearable', label: 'Biometric Wearable', icon: <Watch size={16} className="text-purple-400" />, desc: 'Oura Ring, Apple Watch, Whoop, or Garmin' },
  { id: 'supplements', label: 'Daily Supplements', icon: <Pill size={16} className="text-emerald-400" />, desc: 'Nutraceuticals, vitamins, and amino acids' },
  { id: 'cgm', label: 'Continuous Glucose Monitor (CGM)', icon: <Activity size={16} className="text-teal-400" />, desc: 'Dexcom, Freestyle Libre, or Levels sensor' }
]

const DIET_OPTIONS = [
  { id: 'Omnivore', label: 'Omnivore' },
  { id: 'Mediterranean', label: 'Mediterranean' },
  { id: 'Intermittent Fasting', label: 'Intermittent Fasting' },
  { id: 'Keto', label: 'Ketogenic / Low-Carb' },
  { id: 'Vegetarian', label: 'Vegetarian' },
  { id: 'Vegan', label: 'Plant-Based / Vegan' },
  { id: 'Carnivore', label: 'Carnivore' },
  { id: 'Paleo', label: 'Paleo' }
]

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isRecalibrateMode = searchParams?.get('mode') === 'recalibrate'

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Step 1: Biological Profile & Demographics
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState<string>('')
  const [biologicalSex, setBiologicalSex] = useState<'Male' | 'Female' | 'Other'>('Male')
  const [heightFeet, setHeightFeet] = useState<string>('')
  const [heightInches, setHeightInches] = useState<string>('')
  const [weightLbs, setWeightLbs] = useState<string>('')
  const [dietaryPattern, setDietaryPattern] = useState<string>('Omnivore')

  // Step 2: Circadian Rhythm & Sleep Anchors
  const [idealWakeTime, setIdealWakeTime] = useState<string>('06:30')
  const [idealBedtime, setIdealBedtime] = useState<string>('22:30')
  const [chronotype, setChronotype] = useState<string>('Intermediate')

  // Step 3: Physical Training & Hardware Access
  const [fitnessLevel, setFitnessLevel] = useState<string>('Intermediate')
  const [trainingDays, setTrainingDays] = useState<string[]>(['Mon', 'Wed', 'Fri'])
  const [workoutWindow, setWorkoutWindow] = useState<string>('afternoon')
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(['wearable', 'supplements', 'gym'])

  // Step 4: Primary Goals & Functional Outcomes
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['longevity', 'energy', 'sleep'])
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>([
    'energy', 'sleep_quality', 'focus', 'soreness', 'waking_restedness', 'stress', 'mood', 'digestive_comfort'
  ])
  const [selectedPositiveHabits, setSelectedPositiveHabits] = useState<string[]>([
    'water_intake', 'coffee_caffeine', 'outside_sunlight'
  ])
  const [selectedNegativeExposures, setSelectedNegativeExposures] = useState<string[]>([])

  // Step 5: Starter Stack Selection
  const [selectedModalities, setSelectedModalities] = useState<Record<string, boolean>>({})

  const hasHydratedRef = React.useRef(false)

  // Hydrate existing answers if in recalibrate mode or if profile exists
  useEffect(() => {
    async function hydrate() {
      try {
        const localUserId = getLocalUserId()
        const profile = await getOrCreateUserProfile(localUserId)
        if (profile) {
          if (profile.display_name && profile.display_name !== 'Protocol Optimizer') setDisplayName(profile.display_name)
          if (profile.age) setAge(String(profile.age))
          if (profile.biological_sex) setBiologicalSex(profile.biological_sex as any)
          if (profile.height_inches) {
            setHeightFeet(String(Math.floor(profile.height_inches / 12)))
            setHeightInches(String(profile.height_inches % 12))
          }
          if (profile.weight_lbs) setWeightLbs(String(profile.weight_lbs))
          if (profile.dietary_pattern) setDietaryPattern(profile.dietary_pattern)
          if (profile.ideal_wake_time) setIdealWakeTime(profile.ideal_wake_time)
          if (profile.ideal_bedtime) setIdealBedtime(profile.ideal_bedtime)
          if (profile.chronotype) setChronotype(profile.chronotype)
          if (profile.fitness_training_level) setFitnessLevel(profile.fitness_training_level)
          if (profile.resistance_training_days && profile.resistance_training_days.length > 0) {
            setTrainingDays(profile.resistance_training_days)
          }
          if (profile.primary_workout_window) setWorkoutWindow(profile.primary_workout_window)
          if (profile.hardware_access && profile.hardware_access.length > 0) {
            setSelectedEquipment(profile.hardware_access)
          }
          if (profile.primary_goals && profile.primary_goals.length > 0) {
            setSelectedGoals(profile.primary_goals)
          }
          if (profile.outcome_preference_scores && Object.keys(profile.outcome_preference_scores).length > 0) {
            const allKeys = Object.keys(profile.outcome_preference_scores)
            const regularOutcomes = allKeys.filter(k => !k.startsWith('habit:') && !k.startsWith('exposure:'))
            const habits = allKeys.filter(k => k.startsWith('habit:')).map(k => k.replace('habit:', ''))
            const exposures = allKeys.filter(k => k.startsWith('exposure:')).map(k => k.replace('exposure:', ''))

            if (regularOutcomes.length > 0) setSelectedOutcomes(regularOutcomes)
            if (habits.length > 0) setSelectedPositiveHabits(habits)
            if (exposures.length > 0) setSelectedNegativeExposures(exposures)
          }
        }
      } catch (err) {
        console.error('Error hydrating profile for calibration:', err)
      } finally {
        setIsLoadingProfile(false)
        setTimeout(() => {
          hasHydratedRef.current = true
        }, 150)
      }
    }
    hydrate()
  }, [])

  // Continuously auto-save all onboarding selections so data is NEVER lost navigating between pages
  useEffect(() => {
    if (isLoadingProfile || !hasHydratedRef.current) return

    const saveProgress = async () => {
      try {
        const localUserId = getLocalUserId()
        if (!localUserId) return

        const totalHeightInches = (parseInt(heightFeet || '0', 10) * 12) + parseInt(heightInches || '0', 10)
        const outcomeScores: Record<string, number> = {}
        selectedOutcomes.forEach(id => {
          outcomeScores[id] = 7
        })
        selectedPositiveHabits.forEach(id => {
          outcomeScores[`habit:${id}`] = 10
        })
        selectedNegativeExposures.forEach(id => {
          outcomeScores[`exposure:${id}`] = 10
        })

        await updateUserProfile(localUserId, {
          display_name: displayName.trim() || undefined,
          age: age ? parseInt(age, 10) : undefined,
          biological_sex: biologicalSex,
          height_inches: totalHeightInches > 0 ? totalHeightInches : undefined,
          weight_lbs: weightLbs ? parseFloat(weightLbs) : undefined,
          dietary_pattern: dietaryPattern,
          ideal_wake_time: idealWakeTime,
          ideal_bedtime: idealBedtime,
          chronotype: chronotype,
          fitness_training_level: fitnessLevel,
          resistance_training_days: trainingDays,
          primary_workout_window: workoutWindow,
          hardware_access: selectedEquipment,
          primary_goals: selectedGoals,
          outcome_preference_scores: outcomeScores
        })
      } catch (e) {
        console.warn('Auto-save onboarding progress notice:', e)
      }
    }

    const timer = setTimeout(saveProgress, 400)
    return () => clearTimeout(timer)
  }, [
    displayName, age, biologicalSex, heightFeet, heightInches, weightLbs, dietaryPattern,
    idealWakeTime, idealBedtime, chronotype,
    fitnessLevel, trainingDays, workoutWindow, selectedEquipment,
    selectedGoals, selectedOutcomes, selectedPositiveHabits, selectedNegativeExposures,
    isLoadingProfile
  ])

  // Calculate recommended starter stack based on Step 3 equipment and Step 4 goals
  const recommendedModalities = useMemo(() => {
    return STARTER_CATALOG.filter(mod => {
      // Check goal alignment
      const matchesGoal = selectedGoals.includes(mod.goalKey)
      // Check hardware access requirement
      const hasHardware = !mod.requiredHardware || selectedEquipment.includes(mod.requiredHardware)
      return matchesGoal && hasHardware
    })
  }, [selectedGoals, selectedEquipment])

  const toggleDay = (day: string) => {
    setTrainingDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const toggleEquipment = (id: string) => {
    setSelectedEquipment(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev => {
      const next = prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
      return next.length === 0 ? [id] : next
    })
  }

  const toggleOutcome = (id: string) => {
    setSelectedOutcomes(prev => {
      const next = prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
      return next.length === 0 ? [id] : next
    })
  }

  const togglePositiveHabit = (id: string) => {
    setSelectedPositiveHabits(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleNegativeExposure = (id: string) => {
    setSelectedNegativeExposures(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleModalityCheck = (id: string) => {
    setSelectedModalities(prev => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id]
    }))
  }

  const isModalityChecked = (id: string) => {
    return selectedModalities[id] !== false
  }

  const handleComplete = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const localUserId = getLocalUserId()
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const nameToSave = displayName.trim() || 'Protocol Optimizer'

      // Map outcome preference scores (default 7/10 priority for checked outcomes)
      const outcomeScores: Record<string, number> = {}
      selectedOutcomes.forEach(id => {
        outcomeScores[id] = 7
      })
      selectedPositiveHabits.forEach(id => {
        outcomeScores[`habit:${id}`] = 10
      })
      selectedNegativeExposures.forEach(id => {
        outcomeScores[`exposure:${id}`] = 10
      })

      const totalHeightInches = (parseInt(heightFeet || '0', 10) * 12) + parseInt(heightInches || '0', 10)

      // 1. Ensure profile exists and persist all biological parameters
      await getOrCreateUserProfile(localUserId)
      await updateUserProfile(localUserId, {
        display_name: nameToSave,
        age: age ? parseInt(age, 10) : undefined,
        biological_sex: biologicalSex,
        height_inches: totalHeightInches > 0 ? totalHeightInches : undefined,
        weight_lbs: weightLbs ? parseFloat(weightLbs) : undefined,
        dietary_pattern: dietaryPattern,
        ideal_wake_time: idealWakeTime,
        ideal_bedtime: idealBedtime,
        chronotype: chronotype,
        fitness_training_level: fitnessLevel,
        resistance_training_days: trainingDays,
        primary_workout_window: workoutWindow,
        hardware_access: selectedEquipment,
        primary_goals: selectedGoals,
        outcome_preference_scores: outcomeScores
      })

      // 2. Initialize personalized starter hotkeys list based on habit & exposure choices
      try {
        const activeHotkeyIds = new Set<string>()
        // Always include nutrition_macros
        activeHotkeyIds.add('nutrition_macros')

        selectedPositiveHabits.forEach(hId => {
          const opt = POSITIVE_HABITS_OPTIONS.find(o => o.id === hId)
          if (opt?.hotkeyId) activeHotkeyIds.add(opt.hotkeyId)
        })

        selectedNegativeExposures.forEach(eId => {
          const opt = NEGATIVE_EXPOSURES_OPTIONS.find(o => o.id === eId)
          if (opt?.hotkeyId) activeHotkeyIds.add(opt.hotkeyId)
        })

        const starterHotkeys = POPULAR_HOTKEY_LIBRARY.filter(h => activeHotkeyIds.has(h.id))
        if (starterHotkeys.length > 0) {
          await saveUserHotkeys(localUserId, starterHotkeys)
        }
      } catch (hotkeyErr) {
        console.warn('Notice initializing user starter hotkeys:', hotkeyErr)
      }

      // 3. Schedule checked starter tasks for today
      const activeMods = recommendedModalities.filter(m => isModalityChecked(m.id))
      for (const mod of activeMods) {
        try {
          await createDailyTask(localUserId, todayStr, mod.id)
        } catch (taskErr) {
          console.warn('Error scheduling task for:', mod.id, taskErr)
        }
      }

      // 4. Mark onboarding completed in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('levl_onboarding_completed', 'true')
      }

      // 5. Return to destination
      if (isRecalibrateMode) {
        window.location.href = '/settings'
      } else {
        window.location.href = '/today'
      }
    } catch (err) {
      console.error('Error completing onboarding/calibration:', err)
      if (typeof window !== 'undefined') {
        localStorage.setItem('levl_onboarding_completed', 'true')
      }
      window.location.href = isRecalibrateMode ? '/settings' : '/today'
    }
  }

  // Weight kg conversion
  const weightKg = useMemo(() => {
    const num = parseFloat(weightLbs)
    return isNaN(num) ? 0 : Math.round((num * 0.45359237) * 10) / 10
  }, [weightLbs])

  // Height cm conversion
  const totalInches = useMemo(() => {
    return (parseInt(heightFeet || '0', 10) * 12) + parseInt(heightInches || '0', 10)
  }, [heightFeet, heightInches])

  const heightCm = useMemo(() => {
    return totalInches > 0 ? Math.round((totalInches * 2.54) * 10) / 10 : 0
  }, [totalInches])

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/15 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-xl space-y-6">
        {/* Recalibrate Mode Header Exit Link */}
        {isRecalibrateMode && (
          <div className="flex items-center justify-between bg-slate-900/80 border border-purple-500/30 px-4 py-2.5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-purple-400" />
              <span className="text-xs font-bold text-white">Guided Protocol Calibration</span>
            </div>
            <Link 
              href="/settings" 
              className="text-xs text-purple-300 hover:text-white transition-colors flex items-center gap-1 font-bold"
            >
              <span>Exit to Settings</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* Step Progress Indicator Header */}
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
            <Sparkles size={12} className="text-emerald-400" />
            <span>
              {step === 1 ? 'Step 1 of 5: Biometrics & Demographics' 
                : step === 2 ? 'Step 2 of 5: Circadian Sleep Anchors' 
                : step === 3 ? 'Step 3 of 5: Training & Equipment' 
                : step === 4 ? 'Step 4 of 5: Goals & Outcomes' 
                : 'Step 5 of 5: Calibrated Starter Stack'}
            </span>
          </div>

          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* STEP 1: BIOLOGICAL PROFILE & DEMOGRAPHICS */}
        {/* ---------------------------------------------------- */}
        {step === 1 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 backdrop-blur-md">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                <Dna className="text-emerald-400" size={24} />
                <span>Biological Profile &amp; Demographics</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Baseline physiological data to calibrate dosing, biomarkers, and aging models.
              </p>
            </div>

            {/* Context Explainer Box */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3 text-xs text-emerald-200/90 leading-relaxed">
              <Info size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">How LEVL Uses This:</span>
                Your age and biological sex calibrate personalized biomarker intervals and biological age reversal algorithms (PhenoAge/Calico). Your height and weight scale precise mg/kg dosing across supplements, peptides, and fasting windows.
              </div>
            </div>

            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Your Name or Handle
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder=""
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Age & Sex Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Chronological Age
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder=""
                    min={18}
                    max={120}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Biological Sex
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Male', 'Female', 'Other'] as const).map(sex => (
                      <button
                        key={sex}
                        type="button"
                        onClick={() => setBiologicalSex(sex)}
                        className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          biologicalSex === sex
                            ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sex}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Height & Weight Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Height */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Height
                    </label>
                    {heightCm > 0 && (
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        ≈ {heightCm} cm
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 focus-within:border-emerald-500">
                      <input
                        type="number"
                        value={heightFeet}
                        onChange={(e) => setHeightFeet(e.target.value)}
                        placeholder=""
                        min={3}
                        max={7}
                        className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-700"
                      />
                      <span className="text-xs text-slate-400 font-mono">ft</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 focus-within:border-emerald-500">
                      <input
                        type="number"
                        value={heightInches}
                        onChange={(e) => setHeightInches(e.target.value)}
                        placeholder=""
                        min={0}
                        max={11}
                        className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-700"
                      />
                      <span className="text-xs text-slate-400 font-mono">in</span>
                    </div>
                  </div>
                </div>

                {/* Weight */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Body Weight (lbs)
                    </label>
                    {weightKg > 0 && (
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        ≈ {weightKg} kg (dosing)
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={weightLbs}
                    onChange={(e) => setWeightLbs(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Dietary Baseline */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Baseline Dietary Pattern
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DIET_OPTIONS.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDietaryPattern(d.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        dietaryPattern === d.id
                          ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <span>Continue to Circadian Anchors</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 2: CIRCADIAN RHYTHM & SLEEP ANCHORS */}
        {/* ---------------------------------------------------- */}
        {step === 2 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 backdrop-blur-md">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                <Sun className="text-amber-400" size={24} />
                <span>Circadian Rhythm &amp; Sleep Anchors</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Synchronize your daily protocol timeline to your body's master internal clock.
              </p>
            </div>

            {/* Context Explainer Box */}
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200/90 leading-relaxed">
              <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">How LEVL Uses This:</span>
                LEVL aligns every daily protocol with your circadian biology—such as delaying caffeine intake 90–120m post-waking to clear adenosine, scheduling post-meal glucose walks, and triggering blue-light shielding 2 hours before bed.
              </div>
            </div>

            <div className="space-y-5">
              {/* 1. Chronotype Selector (First) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  1. Select Your Circadian Chronotype
                </label>
                <div className="space-y-2">
                  {[
                    { 
                      id: 'Early Bird', 
                      title: 'Early Bird / Lark (Lion)', 
                      desc: 'Naturally wake early with peak cognitive energy in the morning; calibrated bedtime 9:30 PM, wake 5:30 AM', 
                      icon: <Sunrise size={18} className="text-amber-400" />,
                      wake: '05:30',
                      bed: '21:30'
                    },
                    { 
                      id: 'Intermediate', 
                      title: 'Intermediate / Neutral (Bear)', 
                      desc: 'Balanced solar rhythm; calibrated bedtime 10:30 PM, wake 6:30 AM', 
                      icon: <Sun size={18} className="text-yellow-400" />,
                      wake: '06:30',
                      bed: '22:30'
                    },
                    { 
                      id: 'Night Owl', 
                      title: 'Night Owl / Wolf', 
                      desc: 'Peak focus late afternoon & evening; calibrated bedtime 12:00 AM midnight, wake 8:00 AM', 
                      icon: <Moon size={18} className="text-indigo-400" />,
                      wake: '08:00',
                      bed: '00:00'
                    }
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setChronotype(c.id)
                        setIdealWakeTime(c.wake)
                        setIdealBedtime(c.bed)
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        chronotype === c.id
                          ? 'bg-indigo-500/20 border-indigo-400 text-white shadow-md shadow-indigo-500/10'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">{c.icon}</div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold block">{c.title}</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">{c.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Wake & Bedtime Grid (Second - for fine-tuning) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  2. Dial in Your Exact Target Times
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <Sunrise size={16} />
                        <span>Target Wake Time</span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400 font-semibold">{idealWakeTime}</span>
                    </div>
                    <input
                      type="time"
                      value={idealWakeTime}
                      onChange={(e) => setIdealWakeTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-[10px] text-slate-400 block">
                      Anchors morning light, hydration &amp; cortisol peak
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                        <Moon size={16} />
                        <span>Target Bedtime</span>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-400 font-semibold">{idealBedtime}</span>
                    </div>
                    <input
                      type="time"
                      value={idealBedtime}
                      onChange={(e) => setIdealBedtime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-indigo-400"
                    />
                    <span className="text-[10px] text-slate-400 block">
                      Triggers wind-down, thermal drop &amp; melatonin buffer
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-500 hover:from-amber-400 hover:to-indigo-400 text-slate-950 font-extrabold text-sm shadow-xl flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <span>Continue to Training &amp; Hardware</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 3: PHYSICAL TRAINING & HARDWARE ACCESS */}
        {/* ---------------------------------------------------- */}
        {step === 3 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 backdrop-blur-md">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                <Dumbbell className="text-rose-400" size={24} />
                <span>Physical Training &amp; Hardware Access</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Define your training frequency and available equipment to filter relevant protocols.
              </p>
            </div>

            {/* Context Explainer Box */}
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-200/90 leading-relaxed">
              <Info size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">How LEVL Uses This:</span>
                Ensures your daily timeline only suggests actionable protocols matching gear you actually own. It automatically coordinates pre/post-workout supplementation and active recovery around your designated training days.
              </div>
            </div>

            <div className="space-y-4">
              {/* Fitness Level */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Training Experience
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Beginner', 'Intermediate', 'Advanced', 'Athlete'].map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFitnessLevel(lvl)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        fitnessLevel === lvl
                          ? 'bg-rose-500/20 border-rose-400 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Workout Days per Week */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Active Workout Days
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`py-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        trainingDays.includes(day)
                          ? 'bg-rose-500/20 border-rose-400 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Workout Window */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Primary Workout Window
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'morning', label: 'Morning (6-9 AM)' },
                    { id: 'midday', label: 'Midday (11-1 PM)' },
                    { id: 'afternoon', label: 'Afternoon (3-6 PM)' },
                    { id: 'evening', label: 'Evening (6-9 PM)' }
                  ].map(w => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setWorkoutWindow(w.id)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        workoutWindow === w.id
                          ? 'bg-rose-500/20 border-rose-400 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hardware & Equipment Access */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Available Gear &amp; Equipment
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {HARDWARE_OPTIONS.map(h => {
                    const isSelected = selectedEquipment.includes(h.id)
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => toggleEquipment(h.id)}
                        className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500/15 border-rose-400 text-white shadow-md'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">{h.icon}</div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold block text-white">{h.label}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{h.desc}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                          isSelected ? 'bg-rose-500 border-rose-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                        }`}>
                          {isSelected && <Check size={12} className="stroke-[3]" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-400 hover:to-purple-400 text-slate-950 font-extrabold text-sm shadow-xl flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <span>Continue to Goals &amp; Outcomes</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 4: PRIMARY GOALS & FUNCTIONAL OUTCOMES */}
        {/* ---------------------------------------------------- */}
        {step === 4 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 backdrop-blur-md">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                <Sparkles className="text-purple-400" size={24} />
                <span>Primary Targets &amp; Functional Outcomes</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Select your core longevity priorities and the daily subjective outcomes you care most about.
              </p>
            </div>

            {/* Context Explainer Box */}
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-3 text-xs text-purple-200/90 leading-relaxed">
              <Info size={16} className="text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">How LEVL Uses This:</span>
                Your selected targets train the AI Protocol Coach to highlight the highest-impact protocols. Your prioritized outcomes power your Daily Check-in feedback loop and fuel the Correlation Engine to prove what actually moves the needle.
              </div>
            </div>

            <div className="space-y-5">
              {/* Primary Longevity Goals */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Core Longevity Targets (Pick 1-3)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PRIMARY_GOAL_OPTIONS.map(g => {
                    const isSelected = selectedGoals.includes(g.id)
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGoal(g.id)}
                        className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-500/20 border-purple-400 text-white shadow-md'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">{g.icon}</div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold block text-white">{g.title}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 line-clamp-2">{g.subtitle}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                          isSelected ? 'bg-purple-500 border-purple-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                        }`}>
                          {isSelected && <Check size={12} className="stroke-[3]" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Categorized Functional Outcomes */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-0.5">
                    Prioritized Daily Outcomes (Database Parity)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Grouped by when LEVL asks for your log. Evening ratings reflect your cumulative overall feeling across the entire day.
                  </p>
                </div>

                {/* 1. MORNING CORE CHECK-IN */}
                <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-2xl border border-indigo-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sunrise size={14} className="text-indigo-400" />
                      <span>🌅 Morning Check-in (Waking State &amp; Sleep Depth)</span>
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">Fast 10s Log</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MORNING_CORE_OUTCOMES.map(o => {
                      const isSelected = selectedOutcomes.includes(o.id)
                      return (
                        <button
                          key={`morning_${o.id}`}
                          type="button"
                          onClick={() => toggleOutcome(o.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-500/15 border-indigo-400/80 text-white shadow-sm'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">{o.icon}</div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold block text-white">{o.name}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{o.description}</span>
                          </div>
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                            isSelected ? 'bg-indigo-500 border-indigo-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                          }`}>
                            {isSelected && <Check size={10} className="stroke-[3]" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 2. EVENING CORE CHECK-IN (Full-Day Reflection) */}
                <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-2xl border border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sunset size={14} className="text-amber-400" />
                      <span>🌙 Evening Check-in (Full-Day Cumulative Reflection)</span>
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">Nightly Review</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {EVENING_CORE_OUTCOMES.map(o => {
                      const isSelected = selectedOutcomes.includes(o.id)
                      return (
                        <button
                          key={`evening_${o.id}`}
                          type="button"
                          onClick={() => toggleOutcome(o.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-400/80 text-white shadow-sm'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">{o.icon}</div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold block text-white">{o.name}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{o.description}</span>
                          </div>
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                            isSelected ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                          }`}>
                            {isSelected && <Check size={10} className="stroke-[3]" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 3. PROTOCOL-TRIGGERED (Inline / Post-Execution) */}
                <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-2xl border border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap size={14} className="text-purple-400" />
                      <span>⚡ Protocol-Triggered (Logged Post-Activity)</span>
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">Contextual Logs</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PROTOCOL_TRIGGERED_OUTCOMES.map(o => {
                      const isSelected = selectedOutcomes.includes(o.id)
                      return (
                        <button
                          key={`triggered_${o.id}`}
                          type="button"
                          onClick={() => toggleOutcome(o.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-500/15 border-purple-400/80 text-white shadow-sm'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">{o.icon}</div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold block text-white">{o.name}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{o.description}</span>
                          </div>
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                            isSelected ? 'bg-purple-500 border-purple-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                          }`}>
                            {isSelected && <Check size={10} className="stroke-[3]" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* 4. DAILY MICRO-HABITS & LIFESTYLE EXPOSURES (OPTIONAL) */}
              <div className="space-y-4 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-0.5 flex items-center gap-2">
                      <Sparkles size={14} className="text-orange-400" />
                      <span>Daily Micro-Habits &amp; Lifestyle Factors</span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full lowercase">
                        optional
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Choose positive habits and negative lifestyle factors ready for 1-tap logging. Fully customizable anytime.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* POSITIVE HABITS (Defaults Pre-selected) */}
                  <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-2xl border border-emerald-500/20">
                    <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
                      <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span>✨</span>
                        <span>Positive Habits (Pre-Selected)</span>
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400/80 font-bold">{selectedPositiveHabits.length} selected</span>
                    </div>
                    <div className="space-y-1.5">
                      {POSITIVE_HABITS_OPTIONS.map(h => {
                        const isSelected = selectedPositiveHabits.includes(h.id)
                        return (
                          <button
                            key={`pos_${h.id}`}
                            type="button"
                            onClick={() => togglePositiveHabit(h.id)}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-500/15 border-emerald-400/80 text-white shadow-sm'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-sm shrink-0">{h.icon}</span>
                              <div className="min-w-0">
                                <span className="text-xs font-bold block text-white truncate">{h.name}</span>
                                <span className="text-[10px] text-slate-400 block truncate">{h.desc}</span>
                              </div>
                            </div>
                            <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                              isSelected ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                            }`}>
                              {isSelected && <Check size={10} className="stroke-[3]" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* NEGATIVE EXPOSURES (Optional) */}
                  <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-2xl border border-rose-500/20">
                    <div className="flex items-center justify-between border-b border-rose-500/10 pb-2">
                      <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span>🚫</span>
                        <span>Negative Exposures (Optional)</span>
                      </span>
                      <span className="text-[9px] font-mono text-rose-400/80 font-bold">{selectedNegativeExposures.length} selected</span>
                    </div>
                    <div className="space-y-1.5">
                      {NEGATIVE_EXPOSURES_OPTIONS.map(e => {
                        const isSelected = selectedNegativeExposures.includes(e.id)
                        return (
                          <button
                            key={`neg_${e.id}`}
                            type="button"
                            onClick={() => toggleNegativeExposure(e.id)}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-rose-500/15 border-rose-400/80 text-white shadow-sm'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-sm shrink-0">{e.icon}</span>
                              <div className="min-w-0">
                                <span className="text-xs font-bold block text-white truncate">{e.name}</span>
                                <span className="text-[10px] text-slate-400 block truncate">{e.desc}</span>
                              </div>
                            </div>
                            <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                              isSelected ? 'bg-rose-500 border-rose-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                            }`}>
                              {isSelected && <Check size={10} className="stroke-[3]" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-emerald-400 hover:from-purple-400 hover:to-emerald-300 text-slate-950 font-extrabold text-sm shadow-xl flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <span>Review Calibrated Starter Stack</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 5: TAILORED STARTER STACK & SETTINGS DISCOVERY */}
        {/* ---------------------------------------------------- */}
        {step === 5 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 backdrop-blur-md">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                <Zap className="text-emerald-400" size={24} />
                <span>Your Calibrated Starter Stack</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Clinically validated starter protocols calibrated to your exact biometrics, equipment, and targets.
              </p>
            </div>

            {/* Context Explainer Box */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3 text-xs text-emerald-200/90 leading-relaxed">
              <Info size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">How LEVL Uses This:</span>
                These protocols will be scheduled directly onto your Today timeline with clinically validated starter doses, circadian timing blocks, and single-tap precision logs.
              </div>
            </div>

            {/* Starter Modalities List */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {recommendedModalities.map(mod => {
                const checked = isModalityChecked(mod.id)
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => toggleModalityCheck(mod.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                      checked
                        ? 'bg-slate-950/90 border-emerald-500/50 shadow-md'
                        : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${
                      checked ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                    }`}>
                      {checked && <Check size={12} className="stroke-[3]" />}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white block truncate">
                          {mod.name}
                        </span>
                        <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono shrink-0">
                          {mod.timing.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-400/90 font-mono">
                        {mod.dose}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* ADVANCED PERSONALIZATION PREVIEW (Non-blocking Discovery Card) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/30 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-400" />
                  <span>Available Anytime in Settings (Optional Superpowers)</span>
                </span>
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                  Profile Hub
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                When you're ready to take personalization deeper, you can unlock advanced tools anytime in your Profile &amp; Settings:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2 text-slate-300">
                  <FileText size={14} className="text-emerald-400 shrink-0" />
                  <span className="truncate">Upload Bloodwork</span>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2 text-slate-300">
                  <Activity size={14} className="text-purple-400 shrink-0" />
                  <span className="truncate">PhenoAge Clocks</span>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2 text-slate-300">
                  <Camera size={14} className="text-sky-400 shrink-0" />
                  <span className="truncate">AI Label Scanner</span>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2 text-slate-300">
                  <Pill size={14} className="text-amber-400 shrink-0" />
                  <span className="truncate">Peptide Cycles</span>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2 text-slate-300">
                  <Clock size={14} className="text-rose-400 shrink-0" />
                  <span className="truncate">Fasting Timers</span>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2 text-slate-300">
                  <Thermometer size={14} className="text-cyan-400 shrink-0" />
                  <span className="truncate">°F / °C Units</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
              >
                <CheckCircle2 size={18} />
                <span>
                  {isSubmitting 
                    ? 'Calibrating & Launching...' 
                    : isRecalibrateMode 
                      ? 'Save & Update Protocol Stack' 
                      : 'Complete & Launch Today View'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm font-bold animate-pulse">
        Loading Calibration Wizard...
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
