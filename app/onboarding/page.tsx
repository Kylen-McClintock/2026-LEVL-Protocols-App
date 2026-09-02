'use client'

import React, { useState, useMemo, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { updateUserProfile, createDailyTask, getOrCreateUserProfile } from '@/lib/data'
import { saveUserHotkeys } from '@/lib/storage/quickLogsStorage'
import { POPULAR_HOTKEY_LIBRARY, DEFAULT_STARTER_HOTKEYS } from '@/lib/quicklog/quickHotkeyLibrary'
import { format } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Sparkles, Check, ArrowRight, ArrowLeft, ShieldCheck, Zap, Moon, 
  Brain, Dna, Dumbbell, Flame, Droplets, Watch, Pill, Activity, 
  Heart, Shield, Clock, Sun, Sunrise, Sunset, Utensils, Award, 
  RotateCcw, CheckCircle2, ChevronRight, Info, Eye, Camera, FileText,
  Sliders, Thermometer, Coffee, ShieldAlert, Edit3, X, HelpCircle, ArrowUpRight,
  Mail, AlertCircle
} from 'lucide-react'

export interface ModalityOption {
  id: string
  name: string
  dose: string
  timing: 'morning' | 'afternoon' | 'evening'
  requiredHardware?: string
  goalKey: string
  timeMins: number
  effortLevel: number // 1 (lowest friction) to 5 (highest)
  costTier: number // 1 (free), 2 ($), 3 ($$), 4 ($$$)
  evidenceTier: number // 1 (Gold RCT), 2 (Mechanistic), 3 (Emerging)
  sideEffectRisk: number // 1 (zero), 2 (moderate), 3 (high)
  isFoundational80_20?: boolean
  explainRationale: string
  targetPathways: string[]
  synergies: string[]
  pubmedEvidence?: string
}

export const STARTER_CATALOG: ModalityOption[] = [
  { 
    id: 'morning_sunlight', 
    name: 'Morning Optic Sunlight & Photons', 
    dose: '10–15 mins outdoors within 60m of waking', 
    timing: 'morning', 
    goalKey: 'energy',
    timeMins: 15,
    effortLevel: 1,
    costTier: 1,
    evidenceTier: 1,
    sideEffectRisk: 1,
    isFoundational80_20: true,
    explainRationale: 'Direct photons onto retinal ganglion cells (ipRGCs) reset the central hypothalamic suprachiasmatic nucleus (SCN), triggering a healthy cortisol awakening spike and locking in the 14-hour melatonin synthesis timer for deep restorative sleep.',
    targetPathways: ['SCN Circadian Entrainment', 'Cortisol Awakening Response (CAR)', 'Pineal Melatonin Priming'],
    synergies: ['Pairs synergistically with Hydration & Electrolytes to clear morning grogginess.', 'Reinforces 90m Coffee Delay by letting natural cortisol rise first.'],
    pubmedEvidence: 'PMID: 31105940 (Huberman et al. / SCN Photobiology)'
  },
  { 
    id: 'water_electrolytes', 
    name: 'Baseline Hydration + Electrolytes', 
    dose: '16–20 oz pure water + trace minerals', 
    timing: 'morning', 
    goalKey: 'energy',
    timeMins: 2,
    effortLevel: 1,
    costTier: 1,
    evidenceTier: 1,
    sideEffectRisk: 1,
    isFoundational80_20: true,
    explainRationale: 'Restores overnight respiratory water loss, expands blood plasma volume for cerebral perfusion, and re-establishes neuromuscular membrane potential without caloric load.',
    targetPathways: ['Cellular Osmoregulation', 'Blood Plasma Volume', 'Renal Sodium-Potassium ATPase'],
    synergies: ['Hydrates muscle cells before morning movement.', 'Optimizes cellular uptake of morning micronutrients.'],
    pubmedEvidence: 'PMID: 30999554 (Hydration and Cognitive Performance)'
  },
  { 
    id: 'breathing_4_7_8', 
    name: '4-7-8 Relaxing Wind-Down Breathwork', 
    dose: '4 cycles (5 mins before bed)', 
    timing: 'evening', 
    goalKey: 'sleep',
    timeMins: 5,
    effortLevel: 1,
    costTier: 1,
    evidenceTier: 1,
    sideEffectRisk: 1,
    isFoundational80_20: true,
    explainRationale: 'Prolonged exhalations engage pulmonary stretch receptors that stimulate the vagus nerve, rapidly downshifting sympathetic tone, slowing heart rate, and promoting alpha-to-theta brainwave transition.',
    targetPathways: ['Vagal Parasympathetic Tone', 'Heart Rate Variability (HRV)', 'Sympathetic Down-Regulation'],
    synergies: ['Magnifies deep sleep induction when paired with 2-Hour Blue-Light Shielding.', 'Combines with Magnesium Bisglycinate to lower sleep onset latency.'],
    pubmedEvidence: 'PMID: 29559958 (Slow deep breathing and autonomic balance)'
  },
  { 
    id: 'melatonin_onset_dimming', 
    name: '2-Hour Blue-Light Shielding', 
    dose: 'Circadian dimming & amber glasses 120m pre-bed', 
    timing: 'evening', 
    goalKey: 'sleep',
    timeMins: 5,
    effortLevel: 2,
    costTier: 1,
    evidenceTier: 1,
    sideEffectRisk: 1,
    isFoundational80_20: true,
    explainRationale: 'Shielding short-wavelength 460–480nm light prevents artificial suppression of pineal melatonin secretion, allowing natural core body temperature cooling and restorative delta slow-wave sleep.',
    targetPathways: ['Pineal Melatonin Synthesis', 'Core Body Temperature Drop', 'Delta Slow-Wave Sleep Duration'],
    synergies: ['Amplifies natural wind-down breathwork efficacy.', 'Protects deep sleep latency after cognitive work.'],
    pubmedEvidence: 'PMID: 25535358 (Blue light and sleep architecture)'
  },
  { 
    id: 'post_meal_glucose_walk', 
    name: 'Post-Meal Glycemic Walk', 
    dose: '15–20 mins brisk walk post-nutrition', 
    timing: 'evening', 
    goalKey: 'longevity',
    timeMins: 15,
    effortLevel: 2,
    costTier: 1,
    evidenceTier: 1,
    sideEffectRisk: 1,
    explainRationale: 'Contraction of large lower-body skeletal muscle beds triggers insulin-independent GLUT4 glucose transporter translocation, blunting postprandial glycemic spikes and reducing systemic glycation (HbA1c).',
    targetPathways: ['GLUT4 Translocation', 'Postprandial Glycemic Disposal', 'Insulin Sensitivity'],
    synergies: ['Prevents evening blood sugar instability that causes nocturnal sleep arousals.', 'Assists digestive motility.'],
    pubmedEvidence: 'PMID: 35147980 (Postprandial walking and glycemic control)'
  },
  { 
    id: 'creatine_monohydrate', 
    name: 'Creatine Monohydrate', 
    dose: '5g with morning hydration', 
    timing: 'morning', 
    requiredHardware: 'supplements', 
    goalKey: 'strength',
    timeMins: 2,
    effortLevel: 2,
    costTier: 2,
    evidenceTier: 1,
    sideEffectRisk: 1,
    explainRationale: 'Supersaturates intramuscular and cerebral phosphocreatine reserves, accelerating rapid ATP regeneration during resistance training and enhancing prefrontal executive memory under mental strain.',
    targetPathways: ['Phosphocreatine ATP Shuttling', 'mTORC1 Myogenesis', 'Cerebral Bioenergetics'],
    synergies: ['Pairs with morning hydration for optimal cellular uptake.', 'Powers explosive performance in Resistance Hypertrophy sessions.'],
    pubmedEvidence: 'PMID: 33578876 (Creatine supplementation in health and exercise)'
  },
  { 
    id: 'magnesium_glycinate', 
    name: 'Magnesium Bisglycinate (Sleep Depth)', 
    dose: '400mg with water 60m pre-bed', 
    timing: 'evening', 
    requiredHardware: 'supplements', 
    goalKey: 'sleep',
    timeMins: 2,
    effortLevel: 2,
    costTier: 2,
    evidenceTier: 1,
    sideEffectRisk: 1,
    explainRationale: 'Acts as an inhibitory cofactor for GABA-A receptors while blocking excitotoxic NMDA receptor activity. The bound glycine ligand readily crosses the blood-brain barrier to trigger peripheral vasodilation for somatic cooling.',
    targetPathways: ['GABA-A Neurotransmission', 'NMDA Receptor Antagonism', 'Somatic Thermoregulation'],
    synergies: ['Reinforces 4-7-8 Breathwork relaxation.', 'Prevents nocturnal muscle cramps and twitching.'],
    pubmedEvidence: 'PMID: 23853635 (Magnesium supplementation and subjective sleep)'
  },
  { 
    id: 'omega3_epa_dha', 
    name: 'High-Concentration Omega-3 EPA/DHA', 
    dose: '2,000mg with breakfast/EVOO', 
    timing: 'morning', 
    requiredHardware: 'supplements', 
    goalKey: 'longevity',
    timeMins: 2,
    effortLevel: 2,
    costTier: 2,
    evidenceTier: 1,
    sideEffectRisk: 1,
    explainRationale: 'Incorporates long-chain polyunsaturated fatty acids directly into cellular phospholipid bilayers, boosting membrane fluidity, resolving systemic inflammation via resolvins/protectins, and lowering triglycerides.',
    targetPathways: ['Phospholipid Fluidity', 'Specialized Pro-Resolving Mediators (SPMs)', 'Cardiovascular Endothelial Function'],
    synergies: ['Taken with healthy fats (EVOO) for maximal lipophilic bioavailability.'],
    pubmedEvidence: 'PMID: 31089851 (Omega-3 fatty acids in health and aging)'
  },
  { 
    id: 'zone2_cardio_30m', 
    name: 'Zone 2 Mitochondrial Endurance', 
    dose: '30–45 mins (Nasally breathing, HR 60-70% max)', 
    timing: 'afternoon', 
    goalKey: 'longevity',
    timeMins: 35,
    effortLevel: 3,
    costTier: 1,
    evidenceTier: 1,
    sideEffectRisk: 1,
    explainRationale: 'Stimulates maximal mitochondrial lipid oxidation without excessive blood lactate accumulation. Activates PGC-1α transcription to drive mitochondrial biogenesis and cardiorespiratory VO2 max longevity.',
    targetPathways: ['PGC-1α Mitochondrial Biogenesis', 'Fatty Acid Beta-Oxidation', 'Lactate Clearance Efficiency'],
    synergies: ['Pairs with Heat Shock Sauna to compound cardiovascular adaptations.', 'Boosts baseline insulin sensitivity.'],
    pubmedEvidence: 'PMID: 32300067 (Zone 2 training and mitochondrial function)'
  },
  { 
    id: 'ppl_push_day', 
    name: 'Resistance Hypertrophy Session', 
    dose: '45–60 mins (RPE 7-9, 2-3 RIR)', 
    timing: 'afternoon', 
    requiredHardware: 'gym', 
    goalKey: 'strength',
    timeMins: 50,
    effortLevel: 4,
    costTier: 2,
    evidenceTier: 1,
    sideEffectRisk: 2,
    explainRationale: 'Mechanical tension activates mechanosensors, driving muscle protein synthesis via mTORC1 and stimulating skeletal myokine release for whole-body metabolic resilience and bone density preservation.',
    targetPathways: ['mTORC1 Protein Synthesis', 'Myokine Secretion (IL-6 / Irisin)', 'Bone Mineral Density'],
    synergies: ['Fueled by Creatine Monohydrate saturation.', 'Assisted by post-training hydration and evening sleep depth.'],
    pubmedEvidence: 'PMID: 28834797 (Resistance training for health and longevity)'
  },
  { 
    id: 'sauna_session', 
    name: 'Heat Shock Sauna Session', 
    dose: '20 mins at 174°F+ (80°C+)', 
    timing: 'afternoon', 
    requiredHardware: 'sauna', 
    goalKey: 'longevity',
    timeMins: 25,
    effortLevel: 4,
    costTier: 3,
    evidenceTier: 1,
    sideEffectRisk: 2,
    explainRationale: 'Whole-body thermal stress induces Heat Shock Protein 70 (HSP70) expression to refold misfolded proteins and clear aggregates, while upregulating endothelial nitric oxide synthase (eNOS) for cardiovascular elasticity.',
    targetPathways: ['HSP70 Molecular Chaperone Induction', 'Endothelial eNOS Vasodilation', 'Autophagy & Protein Quality Control'],
    synergies: ['Compounds cardiovascular adaptations when performed post-workout or post-Zone 2.', 'Hydrate with electrolytes before and after.'],
    pubmedEvidence: 'PMID: 25705824 (Sauna bathing and cardiovascular mortality reduction)'
  },
  { 
    id: 'cold_shower_or_plunge', 
    name: 'Deliberate Cold Exposure', 
    dose: '2–3 mins (50°F–55°F / 10°C–13°C)', 
    timing: 'morning', 
    requiredHardware: 'cold_plunge', 
    goalKey: 'recovery',
    timeMins: 5,
    effortLevel: 4,
    costTier: 3,
    evidenceTier: 1,
    sideEffectRisk: 2,
    explainRationale: 'Sudden cutaneous thermal shock triggers a massive locus coeruleus norepinephrine release (+250%) and prolonged dopamine elevation (+250%), while stimulating brown adipose tissue (BAT) thermogenesis and mitochondrial uncoupling (UCP1).',
    targetPathways: ['Norepinephrine & Dopamine Surge', 'BAT Thermogenesis & UCP1', 'Hormetic Resilience'],
    synergies: ['Execute Søberg Principle: end on cold and let the body warm itself naturally.', 'Best utilized in the morning window.'],
    pubmedEvidence: 'PMID: 34697334 (Søberg et al. / Cold exposure and metabolism)'
  }
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
  const stepParam = searchParams?.get('step')

  const { user, signInWithGoogle, signInWithMagicLink, loading: authLoading } = useAuth()

  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4 | 5>(() => {
    if (isRecalibrateMode || stepParam === '1') return 1
    return 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Step 0: Auth State
  const [authEmail, setAuthEmail] = useState('')
  const [authSent, setAuthSent] = useState(false)
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Automatically advance to Step 1 if user is logged in
  useEffect(() => {
    if (user && step === 0) {
      setStep(1)
    }
  }, [user, step])

  const handleGoogleSignIn = async () => {
    setAuthSubmitting(true)
    setAuthError(null)
    const { error } = await signInWithGoogle('/onboarding?step=1')
    if (error) {
      setAuthError(error.message || 'Failed to initiate Google sign in.')
      setAuthSubmitting(false)
    }
  }

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authEmail.trim() || !authEmail.includes('@')) {
      setAuthError('Please enter a valid email address.')
      return
    }
    setAuthSubmitting(true)
    setAuthError(null)
    const { error } = await signInWithMagicLink(authEmail.trim(), '/onboarding?step=1')
    setAuthSubmitting(false)
    if (error) {
      setAuthError(error.message || 'Failed to send login link. Please try again.')
    } else {
      setAuthSent(true)
    }
  }

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
  const [customMilestones, setCustomMilestones] = useState<Record<string, string>>({})
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null)

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

  // Optional Constraint & Protocol Calibration Sliders
  const [dailyTimeBudget, setDailyTimeBudget] = useState<number>(45) // 15 to 120 mins
  const [complexityEffort, setComplexityEffort] = useState<number>(3) // 1 (low friction 80/20) to 5 (intensive)
  const [monthlyBudget, setMonthlyBudget] = useState<number>(2) // 1 ($0 free) to 4 (unconstrained)
  const [opennessToEmergingScience, setOpennessToEmergingScience] = useState<number>(2) // 1 (RCTs) to 3 (frontier)
  const [sideEffectTolerance, setSideEffectTolerance] = useState<number>(2) // 1 (zero risk) to 3 (hormetic)

  // Step 5: Starter Stack Selection & 3-Way Calibration Mode
  const [coverageMode, setCoverageMode] = useState<'simplify' | 'calibrated' | 'coverage'>('calibrated')
  const [selectedModalities, setSelectedModalities] = useState<Record<string, boolean>>({})
  const [explainingModality, setExplainingModality] = useState<ModalityOption | null>(null)

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
          if (profile.outcome_preference_scores?._diurnal_milestone_overrides) {
            setCustomMilestones(profile.outcome_preference_scores._diurnal_milestone_overrides)
          }
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
            const regularOutcomes = allKeys.filter(k => !k.startsWith('habit:') && !k.startsWith('exposure:') && !k.startsWith('_'))
            const habits = allKeys.filter(k => k.startsWith('habit:')).map(k => k.replace('habit:', ''))
            const exposures = allKeys.filter(k => k.startsWith('exposure:')).map(k => k.replace('exposure:', ''))

            if (regularOutcomes.length > 0) setSelectedOutcomes(regularOutcomes)
            if (habits.length > 0) setSelectedPositiveHabits(habits)
            if (exposures.length > 0) setSelectedNegativeExposures(exposures)

            const constraints = profile.outcome_preference_scores._calibration_constraints
            if (constraints) {
              if (constraints.dailyTimeBudget) setDailyTimeBudget(constraints.dailyTimeBudget)
              if (constraints.complexityEffort) setComplexityEffort(constraints.complexityEffort)
              if (constraints.monthlyBudget) setMonthlyBudget(constraints.monthlyBudget)
              if (constraints.opennessToEmergingScience) setOpennessToEmergingScience(constraints.opennessToEmergingScience)
              if (constraints.sideEffectTolerance) setSideEffectTolerance(constraints.sideEffectTolerance)
              if (constraints.coverageMode) setCoverageMode(constraints.coverageMode)
            }
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
        const outcomeScores: Record<string, any> = {}
        selectedOutcomes.forEach(id => {
          outcomeScores[id] = 7
        })
        if (Object.keys(customMilestones).length > 0) {
          outcomeScores._diurnal_milestone_overrides = customMilestones
        }
        outcomeScores._calibration_constraints = {
          dailyTimeBudget,
          complexityEffort,
          monthlyBudget,
          opennessToEmergingScience,
          sideEffectTolerance,
          coverageMode
        }

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
    idealWakeTime, idealBedtime, chronotype, customMilestones,
    fitnessLevel, trainingDays, workoutWindow, selectedEquipment,
    selectedGoals, selectedOutcomes, selectedPositiveHabits, selectedNegativeExposures,
    dailyTimeBudget, complexityEffort, monthlyBudget, opennessToEmergingScience, sideEffectTolerance, coverageMode,
    isLoadingProfile
  ])

  // Helper to calculate dynamic diurnal milestone times from idealWakeTime and idealBedtime
  const calculatedDiurnalMilestones = useMemo(() => {
    const [wakeH, wakeM] = (idealWakeTime || '06:30').split(':').map(Number)
    const [bedH, bedM] = (idealBedtime || '22:30').split(':').map(Number)

    const format12 = (h: number, m: number) => {
      let normH = ((h % 24) + 24) % 24
      const ampm = normH >= 12 ? 'PM' : 'AM'
      let dispH = normH % 12
      if (dispH === 0) dispH = 12
      const dispM = m < 10 ? `0${m}` : m
      return `${dispH}:${dispM} ${ampm}`
    }

    const to24 = (h: number, m: number) => {
      let normH = ((h % 24) + 24) % 24
      const dispM = m < 10 ? `0${m}` : m
      return `${normH < 10 ? '0' : ''}${normH}:${dispM}`
    }

    // 1. Morning Sunlight (Wake to Wake + 60m)
    const sunStart = to24(wakeH, wakeM)
    const sunEnd = to24(wakeH + 1, wakeM)
    const sunFormatted = `${format12(wakeH, wakeM)} – ${format12(wakeH + 1, wakeM)}`

    // 2. Adenosine Delay (90m post-wake)
    const adTotal = (wakeH * 60 + wakeM + 90) % 1440
    const adH = Math.floor(adTotal / 60)
    const adM = adTotal % 60
    const adTime = to24(adH, adM)
    const adFormatted = format12(adH, adM)

    // 3. Peak Cognitive Window (Wake + 2.5h to Wake + 5.5h)
    const cog1Total = (wakeH * 60 + wakeM + 150) % 1440
    const cog1H = Math.floor(cog1Total / 60)
    const cog1M = cog1Total % 60
    const cog2Total = (wakeH * 60 + wakeM + 330) % 1440
    const cog2H = Math.floor(cog2Total / 60)
    const cog2M = cog2Total % 60
    const cogStart = to24(cog1H, cog1M)
    const cogEnd = to24(cog2H, cog2M)
    const cogFormatted = `${format12(cog1H, cog1M)} – ${format12(cog2H, cog2M)}`

    // 4. Caffeine Cutoff (10h before bed)
    const caffTotal = ((bedH * 60 + bedM - 600) % 1440 + 1440) % 1440
    const caffH = Math.floor(caffTotal / 60)
    const caffM = caffTotal % 60
    const caffTime = to24(caffH, caffM)
    const caffFormatted = format12(caffH, caffM)

    // 5. Last Meal / Fasting Cutoff (3h before bed)
    const mealTotal = ((bedH * 60 + bedM - 180) % 1440 + 1440) % 1440
    const mealH = Math.floor(mealTotal / 60)
    const mealM = mealTotal % 60
    const mealTime = to24(mealH, mealM)
    const mealFormatted = format12(mealH, mealM)

    // 6. Blue Light Reduction (2h before bed)
    const blueTotal = ((bedH * 60 + bedM - 120) % 1440 + 1440) % 1440
    const blueH = Math.floor(blueTotal / 60)
    const blueM = blueTotal % 60
    const blueTime = to24(blueH, blueM)
    const blueFormatted = format12(blueH, blueM)

    return [
      {
        id: 'morning_sunlight',
        isRange: true,
        title: 'Morning Sunlight Window',
        desc: 'Resets master SCN biological clock & triggers natural cortisol spike',
        autoFormatted: sunFormatted,
        defaultStart: sunStart,
        defaultEnd: sunEnd,
        icon: <Sun size={16} className="text-amber-400" />
      },
      {
        id: 'adenosine_delay',
        isRange: false,
        title: '90m Coffee & Caffeine Delay',
        desc: 'Clears adenosine buildup to prevent afternoon energy crash',
        autoFormatted: adFormatted,
        defaultTime: adTime,
        icon: <Coffee size={16} className="text-orange-400" />
      },
      {
        id: 'cognitive_peak',
        isRange: true,
        title: 'Peak Cognitive & Focus Window',
        desc: 'Optimal prefrontal cortex neurotransmitter availability for deep work',
        autoFormatted: cogFormatted,
        defaultStart: cogStart,
        defaultEnd: cogEnd,
        icon: <Zap size={16} className="text-yellow-400" />
      },
      {
        id: 'caffeine_cutoff',
        isRange: false,
        title: '10h Caffeine Cutoff',
        desc: 'Clears caffeine half-life to protect restorative slow-wave deep sleep',
        autoFormatted: caffFormatted,
        defaultTime: caffTime,
        icon: <ShieldAlert size={16} className="text-rose-400" />
      },
      {
        id: 'meal_cutoff',
        isRange: false,
        title: 'Last Meal / Fasting Cutoff (3h prior)',
        desc: 'Enables nighttime core body temperature drop and digestive rest',
        autoFormatted: mealFormatted,
        defaultTime: mealTime,
        icon: <Flame size={16} className="text-amber-400" />
      },
      {
        id: 'blue_light_cutoff',
        isRange: false,
        title: 'Blue Light Reduction & Wind-Down (2h prior)',
        desc: 'Preserves pineal melatonin secretion and primes sleep architecture',
        autoFormatted: blueFormatted,
        defaultTime: blueTime,
        icon: <Eye size={16} className="text-indigo-400" />
      }
    ]
  }, [idealWakeTime, idealBedtime])

  // Multi-tier Recommendation Engine based on constraints, equipment, and primary goals
  const {
    calibratedModalities,
    displayedModalities,
    simplifyCutCandidates,
    nextBestActions,
    targetCount
  } = useMemo(() => {
    // 1. Filter out modalities where required hardware or budget is strictly missing
    const available = STARTER_CATALOG.filter(mod => {
      const hasHardware = !mod.requiredHardware || selectedEquipment.includes(mod.requiredHardware)
      const budgetOk = monthlyBudget >= mod.costTier || mod.costTier === 1
      return hasHardware && budgetOk
    })

    // 2. Score each modality based on goal matches, foundational status, time & effort match
    const scored = available.map(mod => {
      let score = 0
      // Goal alignment
      if (selectedGoals.includes(mod.goalKey)) score += 14
      // Foundational 80/20 status bonus
      if (mod.isFoundational80_20) score += 10
      // Time efficiency bonus (if user has small time budget, short modalities get big bonus)
      if (dailyTimeBudget <= 30 && mod.timeMins <= 15) score += 8
      if (dailyTimeBudget > 60 && mod.timeMins >= 20) score += 4
      // Effort alignment
      const effortDiff = Math.abs(mod.effortLevel - complexityEffort)
      score += Math.max(0, 6 - effortDiff * 2)
      // Openness to emerging science
      if (opennessToEmergingScience >= mod.evidenceTier) score += 3
      // Side effect tolerance
      if (sideEffectTolerance >= mod.sideEffectRisk) score += 3

      return { mod, score }
    })

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score)
    const sorted = scored.map(s => s.mod)

    // 3. Determine calibrated target count based on dailyTimeBudget and complexityEffort
    let target = 5
    if (dailyTimeBudget <= 30 || complexityEffort <= 2) {
      target = 4 // 3–4 for minimalist
    } else if (dailyTimeBudget <= 60 || complexityEffort <= 3) {
      target = 6 // 5–7 for balanced
    } else {
      target = 8 // 8–10 for comprehensive
    }
    const finalTarget = Math.min(sorted.length, Math.max(3, target))

    // 4. Calibrated Stack vs Next Best Actions
    const calibrated = sorted.slice(0, finalTarget)
    const nextBest = sorted.slice(finalTarget, finalTarget + 4)

    // 5. In calibrated stack, find candidates to simplify/cut (non-foundational or highest effort/time)
    const cutCandidates = [...calibrated]
      .filter(m => !m.isFoundational80_20 || calibrated.length > 4)
      .sort((a, b) => (b.effortLevel + b.timeMins / 10) - (a.effortLevel + a.timeMins / 10))
      .slice(0, 3)

    // 6. Active Displayed List based on coverageMode
    let displayed: ModalityOption[] = []
    if (coverageMode === 'coverage') {
      displayed = [...calibrated, ...nextBest]
    } else {
      displayed = calibrated
    }

    return {
      calibratedModalities: calibrated,
      displayedModalities: displayed,
      simplifyCutCandidates: cutCandidates,
      nextBestActions: nextBest,
      targetCount: finalTarget
    }
  }, [
    selectedEquipment, monthlyBudget, selectedGoals, dailyTimeBudget, 
    complexityEffort, opennessToEmergingScience, sideEffectTolerance, coverageMode
  ])

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
    setSelectedModalities(prev => {
      const currentlyChecked = isModalityChecked(id)
      return {
        ...prev,
        [id]: !currentlyChecked
      }
    })
  }

  const isModalityChecked = (id: string) => {
    if (selectedModalities[id] !== undefined) {
      return selectedModalities[id]
    }
    // Default checked if part of calibrated stack
    return calibratedModalities.some(m => m.id === id)
  }

  const handleComplete = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const localUserId = getLocalUserId()
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const nameToSave = displayName.trim() || 'Protocol Optimizer'

      // Map outcome preference scores (default 7/10 priority for checked outcomes)
      const outcomeScores: Record<string, any> = {}
      selectedOutcomes.forEach(id => {
        outcomeScores[id] = 7
      })
      if (Object.keys(customMilestones).length > 0) {
        outcomeScores._diurnal_milestone_overrides = customMilestones
      }
      outcomeScores._calibration_constraints = {
        dailyTimeBudget,
        complexityEffort,
        monthlyBudget,
        opennessToEmergingScience,
        sideEffectTolerance,
        coverageMode
      }

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
      const activeMods = displayedModalities.filter(m => isModalityChecked(m.id))
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
        {step > 0 && (
          <div className="space-y-3 text-center animate-in fade-in duration-300">
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
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 0: WELCOME & AUTH SIGN-IN */}
        {/* ---------------------------------------------------- */}
        {step === 0 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/95 border border-purple-500/30 shadow-2xl space-y-6 text-white text-center animate-in fade-in duration-300 backdrop-blur-md relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-3 relative z-10">
              <img 
                src="/logo.png" 
                alt="LEVL Protocols" 
                className="h-9 w-auto object-contain mx-auto"
              />

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] font-extrabold uppercase tracking-wider">
                <Sparkles size={12} className="text-purple-400" />
                <span>Precision Longevity Protocol</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                Outpace Aging
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                Outpace Aging with a personalized longevity protocol calibrated to your goals, availability, and biomarkers.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2 animate-in fade-in relative z-10">
                <AlertCircle size={15} className="shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            {authSent ? (
              <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-3 relative z-10 animate-in fade-in">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 mx-auto">
                  <Check size={20} />
                </div>
                <h3 className="text-base font-bold text-white">Check Your Inbox</h3>
                <p className="text-xs text-slate-300">
                  We sent a secure 1-click sign-in link to <span className="font-semibold text-white">{authEmail}</span>.
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors cursor-pointer"
                  >
                    Continue to Protocol Setup →
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthSent(false); setAuthEmail(''); }}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Use a different email
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-1 relative z-10">
                {/* 1-Tap Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={authSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-lg cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 text-slate-500 text-xs py-1">
                  <div className="h-px bg-white/10 flex-1" />
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">or continue with email</span>
                  <div className="h-px bg-white/10 flex-1" />
                </div>

                {/* Email Magic Link Form */}
                <form onSubmit={handleSendMagicLink} className="space-y-3">
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      disabled={authSubmitting}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-purple-500/60 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={authSubmitting || !authEmail.trim()}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-500/20 cursor-pointer disabled:opacity-40"
                  >
                    <span>Send Magic Link</span>
                    <ArrowRight size={14} />
                  </button>
                </form>

                {/* Discreet "Preview as guest" bypass */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1 group py-1"
                  >
                    <span>Preview protocol builder as guest</span>
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform text-slate-500 group-hover:text-white" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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

            <div className="pt-2 flex items-center justify-between gap-3">
              {!user && !isRecalibrateMode ? (
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Sign In</span>
                </button>
              ) : <div />}

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

              {/* 3. Auto-Calculated Diurnal Timeline (Third - under Bed/Wake times) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-3.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-amber-400" />
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      3. Auto-Calculated Diurnal Timeline
                    </label>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                    Live Circadian Waveform
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Dynamically calculated from your wake (<span className="text-amber-300 font-mono font-bold">{idealWakeTime}</span>) and sleep (<span className="text-indigo-300 font-mono font-bold">{idealBedtime}</span>) anchors. Tap edit on any milestone to manually customize.
                </p>

                <div className="space-y-2.5 pt-1">
                  {calculatedDiurnalMilestones.map((m) => {
                    const isCustom = !!customMilestones[m.id]
                    const isEditing = editingMilestoneId === m.id
                    const displayTime = isCustom ? customMilestones[m.id] : m.autoFormatted

                    return (
                      <div
                        key={m.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-2.5 ${
                          isCustom
                            ? 'bg-purple-950/20 border-purple-500/40 shadow-sm'
                            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        {/* 1. Header: Icon + Full-Width Title + Action Buttons */}
                        <div className="flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-sm">
                              {m.icon}
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-white leading-tight">
                              {m.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomMilestones(prev => {
                                    const next = { ...prev }
                                    delete next[m.id]
                                    return next
                                  })
                                }}
                                title="Reset to auto-calculated time"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              >
                                <RotateCcw size={12} />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setEditingMilestoneId(isEditing ? null : m.id)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                isEditing
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                              }`}
                              title="Edit milestone time"
                            >
                              <Edit3 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* 2. Dedicated Time & Mode Row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                            <Clock size={12} className="text-amber-400" />
                            {displayTime}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md font-mono border ${
                            isCustom 
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' 
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {isCustom ? 'Custom' : 'Auto'}
                          </span>
                        </div>

                        {/* 3. Full-Width Body Description */}
                        <p className="text-[11px] text-slate-300/90 leading-relaxed pl-0.5">
                          {m.desc}
                        </p>

                        {/* Inline Time Editor */}
                        {isEditing && (
                          <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center gap-2 animate-in fade-in">
                            <label className="text-[10px] text-slate-400 uppercase font-mono font-bold shrink-0">
                              Custom Time:
                            </label>
                            <input
                              type="text"
                              value={customMilestones[m.id] || m.autoFormatted}
                              onChange={(e) => {
                                const val = e.target.value
                                setCustomMilestones(prev => ({
                                  ...prev,
                                  [m.id]: val
                                }))
                              }}
                              placeholder={m.autoFormatted}
                              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                            />
                            <button
                              type="button"
                              onClick={() => setEditingMilestoneId(null)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold cursor-pointer"
                            >
                              Done
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
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

              {/* 5. PROTOCOL CONSTRAINTS & CALIBRATION SLIDERS */}
              <div className="space-y-4 pt-3 border-t border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-0.5 flex items-center gap-2">
                    <Sliders size={14} className="text-emerald-400" />
                    <span>Protocol Constraints &amp; Calibration</span>
                    <span className="text-[10px] font-bold text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full lowercase">
                      smart engine
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Calibrate your available time, effort tolerance, and budget. These constraints directly shape the size and intensity of your recommended starter protocol.
                  </p>
                </div>

                <div className="space-y-4 bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-emerald-500/20 shadow-inner">
                  {/* 1. Daily Time Budget */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Clock size={13} className="text-amber-400" />
                        <span>Daily Available Time Commitment</span>
                      </label>
                      <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20 text-xs">
                        {dailyTimeBudget} mins/day {dailyTimeBudget <= 30 ? '• 3–4 modalities' : dailyTimeBudget <= 60 ? '• 5–7 modalities' : '• 8–10 modalities'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="120"
                      step="15"
                      value={dailyTimeBudget}
                      onChange={(e) => setDailyTimeBudget(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>15m (Express / Minimalist)</span>
                      <span>45m (Standard)</span>
                      <span>90m+ (Deep Protocol)</span>
                    </div>
                  </div>

                  {/* 2. Complexity & Friction Tolerance */}
                  <div className="space-y-2 pt-3 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Zap size={13} className="text-purple-400" />
                        <span>Complexity &amp; Effort Tolerance</span>
                      </label>
                      <span className="font-mono font-bold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-lg border border-purple-500/20 text-xs">
                        {complexityEffort === 1 ? 'Level 1 (Zero-Friction 80/20)' :
                         complexityEffort === 2 ? 'Level 2 (Low Friction Micro-Habits)' :
                         complexityEffort === 3 ? 'Level 3 (Balanced Active Routine)' :
                         complexityEffort === 4 ? 'Level 4 (High Discipline Protocol)' :
                         'Level 5 (Maximum Comprehensive Stack)'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={complexityEffort}
                      onChange={(e) => setComplexityEffort(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Passive / Effortless</span>
                      <span>Moderate Balance</span>
                      <span>Intensive Daily Stacks</span>
                    </div>
                  </div>

                  {/* 3. Monthly Protocol Budget */}
                  <div className="space-y-2 pt-3 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Award size={13} className="text-emerald-400" />
                        <span>Monthly Protocol Budget</span>
                      </label>
                      <span className="font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 text-xs">
                        {monthlyBudget === 1 ? '$0 (Free / Zero-Equipment)' :
                         monthlyBudget === 2 ? 'Modest ($50–$150/mo)' :
                         monthlyBudget === 3 ? 'High ($200–$500/mo)' :
                         'Unconstrained / Premium'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="1"
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>$0 Free Habits</span>
                      <span>Targeted Supplements</span>
                      <span>Full Biohacker Stack</span>
                    </div>
                  </div>

                  {/* 4. Openness to Emerging Science */}
                  <div className="space-y-2 pt-3 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Dna size={13} className="text-sky-400" />
                        <span>Openness to Emerging Science</span>
                      </label>
                      <span className="font-mono font-bold text-sky-300 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20 text-xs">
                        {opennessToEmergingScience === 1 ? 'Conservative (Peer-Reviewed RCTs Only)' :
                         opennessToEmergingScience === 2 ? 'Balanced (Strong Human & Mechanistic Data)' :
                         'Cutting-Edge (Emerging Epigenetics & Trials)'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="1"
                      value={opennessToEmergingScience}
                      onChange={(e) => setOpennessToEmergingScience(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Gold Standard RCTs</span>
                      <span>Balanced</span>
                      <span>Cutting-Edge Frontier</span>
                    </div>
                  </div>

                  {/* 5. Side Effect & Intervention Stressor Tolerance */}
                  <div className="space-y-2 pt-3 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-200 flex items-center gap-1.5">
                        <ShieldAlert size={13} className="text-rose-400" />
                        <span>Side Effect &amp; Intensity Tolerance</span>
                      </label>
                      <span className="font-mono font-bold text-rose-300 bg-rose-500/10 px-2.5 py-0.5 rounded-lg border border-rose-500/20 text-xs">
                        {sideEffectTolerance === 1 ? 'Zero Risk / Non-Invasive' :
                         sideEffectTolerance === 2 ? 'Moderate (Hormetic Cold/Heat Stress)' :
                         'High (Intensive Metabolic & Physical Stressors)'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="1"
                      value={sideEffectTolerance}
                      onChange={(e) => setSideEffectTolerance(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Gentle / Safe</span>
                      <span>Moderate Hormesis</span>
                      <span>Aggressive Interventions</span>
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
        {/* STEP 5: TAILORED STARTER STACK & 3-WAY CALIBRATION */}
        {/* ---------------------------------------------------- */}
        {step === 5 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 backdrop-blur-md">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                <Zap className="text-emerald-400" size={24} />
                <span>Your Calibrated Starter Stack</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Clinically validated starter protocols calibrated to your exact time budget ({dailyTimeBudget}m), effort level, and primary targets.
              </p>
            </div>

            {/* 3-Way Calibration Segmented Control */}
            <div className="space-y-2.5">
              <div className="p-1 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setCoverageMode('simplify')}
                  className={`flex-1 py-2.5 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    coverageMode === 'simplify'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>⚡ Simplify</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCoverageMode('calibrated')}
                  className={`flex-1 py-2.5 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    coverageMode === 'calibrated'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🎯 Just Right</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCoverageMode('coverage')}
                  className={`flex-1 py-2.5 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    coverageMode === 'coverage'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🚀 More Coverage</span>
                </button>
              </div>

              {/* Dynamic Mode Explainer Banner */}
              {coverageMode === 'simplify' && (
                <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200/90 leading-relaxed animate-in fade-in">
                  <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">80/20 Simplification Mode:</span>
                    Highlighted below are the easiest modalities to prune if you want to start with zero friction. You can simplify or layer on modalities at any time as consistency builds.
                  </div>
                </div>
              )}

              {coverageMode === 'calibrated' && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3 text-xs text-emerald-200/90 leading-relaxed animate-in fade-in">
                  <Info size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-300 block mb-0.5">Calibrated Preset:</span>
                    Personalized sweet spot balancing your available time ({dailyTimeBudget}m/day), hardware access, and top longevity targets.
                  </div>
                </div>
              )}

              {coverageMode === 'coverage' && (
                <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3 text-xs text-indigo-200/90 leading-relaxed animate-in fade-in">
                  <Zap size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-indigo-300 block mb-0.5">Next Best Actions:</span>
                    Highlighted below are high-synergy complementary protocols ranked in order of next best action to maximize your biomarker and target pathway coverage. Select any to add to your stack.
                  </div>
                </div>
              )}
            </div>

            {/* Unconstrained Full-Height Starter Modalities List */}
            <div className="space-y-3 pt-1">
              {displayedModalities.map((mod, idx) => {
                const checked = isModalityChecked(mod.id)
                const isNextBestAction = nextBestActions.some(n => n.id === mod.id)
                const nextBestIndex = nextBestActions.findIndex(n => n.id === mod.id)
                const isCutCandidate = simplifyCutCandidates.some(c => c.id === mod.id)
                const cutIndex = simplifyCutCandidates.findIndex(c => c.id === mod.id)

                return (
                  <div
                    key={mod.id}
                    className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                      checked
                        ? isNextBestAction
                          ? 'bg-purple-950/30 border-purple-500/50 shadow-md'
                          : 'bg-slate-950/90 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
                    }`}
                  >
                    {/* Top Row: Checkbox, Name, Timing Pill, and Explain Button */}
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => toggleModalityCheck(mod.id)}
                        className="flex items-start gap-3 min-w-0 flex-1 text-left cursor-pointer group"
                      >
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 transition-colors ${
                          checked 
                            ? isNextBestAction ? 'bg-purple-500 border-purple-400 text-white' : 'bg-emerald-500 border-emerald-400 text-slate-950' 
                            : 'border-slate-700 bg-slate-900 group-hover:border-slate-500'
                        }`}>
                          {checked && <Check size={12} className="stroke-[3]" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="text-xs sm:text-sm font-bold text-white block leading-snug group-hover:text-emerald-300 transition-colors">
                            {mod.name}
                          </span>
                          <p className="text-xs text-emerald-400/90 font-mono mt-0.5">
                            {mod.dose}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                          {mod.timing.replace('_', ' ')}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExplainingModality(mod)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Explain protocol rationale and synergies"
                        >
                          <HelpCircle size={12} className="text-emerald-400" />
                          <span>Explain</span>
                        </button>
                      </div>
                    </div>

                    {/* Contextual Status / Recommendation Badges */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {coverageMode === 'simplify' && (
                          isCutCandidate ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                              <span>#{cutIndex + 1} Recommended to Cut</span>
                              <span className="opacity-75">({mod.timeMins}m • Level {mod.effortLevel} effort)</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              ⚡ 80/20 Foundational Anchor
                            </span>
                          )
                        )}

                        {coverageMode === 'coverage' && (
                          isNextBestAction ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                              <span>🚀 #{nextBestIndex + 1} Next Best Action</span>
                              <span className="opacity-75">({mod.timeMins}m)</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md font-mono bg-slate-800 text-slate-400 border border-slate-700">
                              🎯 Calibrated Base Stack
                            </span>
                          )
                        )}

                        {coverageMode === 'calibrated' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            {mod.isFoundational80_20 ? '⚡ Foundational 80/20' : '🎯 Primary Goal Match'}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {mod.timeMins} mins • Effort {mod.effortLevel}/5
                      </span>
                    </div>
                  </div>
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

        {/* ---------------------------------------------------- */}
        {/* EXPLAIN RECOMMENDATION BREAKDOWN MODAL */}
        {/* ---------------------------------------------------- */}
        {explainingModality && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">
                      {explainingModality.name}
                    </h3>
                    <span className="text-xs text-emerald-400 font-mono">
                      {explainingModality.dose}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExplainingModality(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300 max-h-[60vh] overflow-y-auto pr-1">
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-400" />
                    Biological Rationale &amp; Goal Alignment
                  </span>
                  <p className="leading-relaxed text-slate-300">
                    {explainingModality.explainRationale}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Dna size={12} className="text-purple-400" />
                    Target Pathways &amp; Mechanisms
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {explainingModality.targetPathways?.map(pw => (
                      <span key={pw} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300">
                        {pw}
                      </span>
                    ))}
                  </div>
                </div>

                {explainingModality.synergies && explainingModality.synergies.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Heart size={12} className="text-emerald-400" />
                      Stack Synergies
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                      {explainingModality.synergies.map((syn, idx) => (
                        <li key={idx}>{syn}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {explainingModality.pubmedEvidence && (
                  <div className="p-2.5 rounded-xl bg-slate-950/50 border border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Clinical Reference:</span>
                    <span className="text-slate-300 font-bold">{explainingModality.pubmedEvidence}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setExplainingModality(null)}
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Close Breakdown
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
