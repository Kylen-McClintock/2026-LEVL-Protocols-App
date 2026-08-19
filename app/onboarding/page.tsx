'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { updateUserProfile, createDailyTask, getOrCreateUserProfile } from '@/lib/data'
import { format } from 'date-fns'
import { 
  Sparkles, Check, ArrowRight, ShieldCheck, Zap, Moon, 
  Brain, Dna, Dumbbell, Flame, Droplets, Watch, Pill, CheckCircle2, RefreshCw, 
  Heart, Shield, Activity 
} from 'lucide-react'

interface ModalityOption {
  id: string
  name: string
  dose: string
  timing: string
  requiredHardware?: string
}

interface GoalArchetype {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  color: string
  borderColor: string
  bgGlow: string
  modalities: ModalityOption[]
}

interface FunctionalOutcomeOption {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  matchedGoals: string[]
}

const GOAL_ARCHETYPES: GoalArchetype[] = [
  {
    id: 'sleep',
    title: 'Deep Sleep & Recovery',
    subtitle: 'Optimize sleep latency, HRV, and deep/REM restorative cycles',
    icon: <Moon size={22} className="text-indigo-400" />,
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/40',
    bgGlow: 'bg-indigo-500/10',
    modalities: [
      { id: 'morning_sunlight', name: 'Morning Sunlight & Circadian Anchor', dose: '10–15 mins within 60m of waking', timing: 'waking' },
      { id: 'breathing_4_7_8', name: '4-7-8 Relaxing Wind-Down Breathwork', dose: '4 cycles (5 mins before bed)', timing: 'evening' },
      { id: 'magnesium_glycinate', name: 'Magnesium Bisglycinate (Sleep Quality)', dose: '400mg with water 60m pre-bed', timing: 'evening', requiredHardware: 'supplements' },
      { id: 'sauna_exposure', name: 'Evening Hyperthermic Sauna (Thermal Drop)', dose: '15–20 mins @ 174°F+ (90m pre-bed)', timing: 'evening', requiredHardware: 'sauna' }
    ]
  },
  {
    id: 'energy',
    title: 'Mitochondrial Energy & Alertness',
    subtitle: 'Crush afternoon brain fog and maximize cellular ATP generation',
    icon: <Zap size={22} className="text-amber-400" />,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgGlow: 'bg-amber-500/10',
    modalities: [
      { id: 'cyclic_sighing', name: 'Cyclic Sighing (Physiological Sigh)', dose: '5 mins (2 quick inhales, 1 long exhale)', timing: 'morning_routine' },
      { id: 'cold_water_immersion', name: 'Cold Plunge / Cold Water Immersion', dose: '2–3 mins @ 50°F–55°F (Søberg reheat)', timing: 'morning_routine', requiredHardware: 'cold_plunge' },
      { id: 'creatine_monohydrate', name: 'Creatine Monohydrate (Cellular ATP)', dose: '5g with water in morning', timing: 'morning_routine', requiredHardware: 'supplements' }
    ]
  },
  {
    id: 'longevity',
    title: 'Biological Age Reversal',
    subtitle: 'Trigger cellular autophagy, reduce epigenetic age, and boost DNA repair',
    icon: <Dna size={22} className="text-emerald-400" />,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    bgGlow: 'bg-emerald-500/10',
    modalities: [
      { id: 'intermittent_fasting_16_8', name: '16:8 Time-Restricted Feeding (TRF)', dose: '16h Fast / 8h Eating window', timing: 'afternoon' },
      { id: 'post_meal_glucose_walk', name: 'Post-Meal Glucose Walk', dose: '15–20 mins brisk walk after largest meal', timing: 'evening' },
      { id: 'extra-virgin-olive-oil', name: 'High-Polyphenol Extra Virgin Olive Oil', dose: '1–2 tbsp (>500mg/kg polyphenols)', timing: 'morning_routine', requiredHardware: 'supplements' }
    ]
  },
  {
    id: 'focus',
    title: 'Cognitive Clarity & Peak Flow',
    subtitle: 'Neurochemical optimization for laser focus and calm sustained drive',
    icon: <Brain size={22} className="text-sky-400" />,
    color: 'text-sky-400',
    borderColor: 'border-sky-500/40',
    bgGlow: 'bg-sky-500/10',
    modalities: [
      { id: 'box_breathing', name: 'Box Breathing (Navy SEAL Focus)', dose: '4 mins (4s in, 4s hold, 4s out, 4s hold)', timing: 'morning_routine' },
      { id: 'morning_sunlight', name: 'Optic Flow & Horizon Morning Light', dose: '10–15 mins expansive visual field', timing: 'waking' },
      { id: 'creatine_monohydrate', name: 'Creatine Monohydrate (Brain ATP)', dose: '5g with water in morning', timing: 'morning_routine', requiredHardware: 'supplements' }
    ]
  },
  {
    id: 'strength',
    title: 'Muscle, Hypertrophy & Metabolism',
    subtitle: 'Lean mass retention, progressive overload, and protein synthesis',
    icon: <Dumbbell size={22} className="text-rose-400" />,
    color: 'text-rose-400',
    borderColor: 'border-rose-500/40',
    bgGlow: 'bg-rose-500/10',
    modalities: [
      { id: 'ppl_push_day', name: 'Push / Resistance Hypertrophy Session', dose: '45–60 mins (RPE 7-9, 2-3 RIR)', timing: 'afternoon', requiredHardware: 'gym' },
      { id: 'creatine_monohydrate', name: 'Creatine Monohydrate (Strength & Recovery)', dose: '5g daily with water', timing: 'morning_routine', requiredHardware: 'supplements' },
      { id: 'post_meal_glucose_walk', name: 'Post-Meal Glycemic Walk', dose: '15 mins brisk walk post-nutrition', timing: 'evening' }
    ]
  }
]

const FUNCTIONAL_OUTCOMES: FunctionalOutcomeOption[] = [
  { id: 'energy', name: 'Sustained Daily Energy', description: 'Eliminate afternoon brain fog & maximize cellular ATP generation', icon: <Zap size={18} className="text-amber-400" />, color: 'border-amber-500/30 bg-amber-500/10', matchedGoals: ['energy', 'longevity'] },
  { id: 'sleep_quality', name: 'Deep Sleep Quality & Latency', description: 'Maximize restorative deep/REM sleep architecture & recovery', icon: <Moon size={18} className="text-indigo-400" />, color: 'border-indigo-500/30 bg-indigo-500/10', matchedGoals: ['sleep'] },
  { id: 'focus', name: 'Mental Focus & Flow State', description: 'Laser cognitive clarity, drive & sustained attention span', icon: <Brain size={18} className="text-sky-400" />, color: 'border-sky-500/30 bg-sky-500/10', matchedGoals: ['focus'] },
  { id: 'stress', name: 'Stress & Autonomic Regulation', description: 'High vagal tone, parasympathetic recovery & emotional calm', icon: <Heart size={18} className="text-emerald-400" />, color: 'border-emerald-500/30 bg-emerald-500/10', matchedGoals: ['sleep', 'focus'] },
  { id: 'soreness', name: 'Physical Recovery & Soreness', description: 'Muscular repair, joint comfort & fast systemic recovery', icon: <Shield size={18} className="text-purple-400" />, color: 'border-purple-500/30 bg-purple-500/10', matchedGoals: ['strength', 'energy'] },
  { id: 'strength', name: 'Strength & Muscular Power', description: 'Progressive overload retention & lean tissue synthesis', icon: <Dumbbell size={18} className="text-rose-400" />, color: 'border-rose-500/30 bg-rose-500/10', matchedGoals: ['strength'] },
  { id: 'waking_restedness', name: 'Morning Waking Restedness', description: 'Wake up fully refreshed with optimal circadian cortisol timing', icon: <Sparkles size={18} className="text-cyan-400" />, color: 'border-cyan-500/30 bg-cyan-500/10', matchedGoals: ['sleep', 'energy'] },
  { id: 'brain_fog', name: 'Brain Fog Reduction', description: 'Crisp neural processing speed & cerebral metabolic clearance', icon: <Activity size={18} className="text-teal-400" />, color: 'border-teal-500/30 bg-teal-500/10', matchedGoals: ['focus', 'energy', 'longevity'] },
  { id: 'digestive_comfort', name: 'Metabolic & Gut Comfort', description: 'Stable post-meal glycemic response, satiety & digestion', icon: <Flame size={18} className="text-orange-400" />, color: 'border-orange-500/30 bg-orange-500/10', matchedGoals: ['longevity'] }
]

const EQUIPMENT_OPTIONS = [
  { id: 'cold_plunge', label: 'Cold Plunge / Tub', icon: <Droplets size={16} className="text-cyan-400" /> },
  { id: 'sauna', label: 'Sauna / Infrared', icon: <Flame size={16} className="text-amber-400" /> },
  { id: 'gym', label: 'Weights / Gym Access', icon: <Dumbbell size={16} className="text-rose-400" /> },
  { id: 'wearable', label: 'Wearable (Oura / Apple)', icon: <Watch size={16} className="text-purple-400" /> },
  { id: 'supplements', label: 'Daily Supplements', icon: <Pill size={16} className="text-emerald-400" /> }
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1: Goals & Name
  const [displayName, setDisplayName] = useState('')
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['longevity', 'energy'])

  // Step 2: Functional Outcomes to Track
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>(['energy', 'sleep_quality', 'focus'])

  // Step 3: Equipment / Hardware
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(['wearable', 'supplements'])

  // Step 4: Starter Stack Modalities
  const [selectedModalities, setSelectedModalities] = useState<Record<string, boolean>>({})

  // Toggle Goal in Step 1
  const handleToggleGoal = (goalId: string) => {
    setSelectedGoals(prev => {
      const next = prev.includes(goalId) 
        ? prev.filter(g => g !== goalId) 
        : [...prev, goalId]
      const finalGoals = next.length === 0 ? [goalId] : next

      // Auto-update default functional outcomes matching these goals
      const autoOutcomes = new Set<string>()
      finalGoals.forEach(g => {
        FUNCTIONAL_OUTCOMES.forEach(o => {
          if (o.matchedGoals.includes(g)) autoOutcomes.add(o.id)
        })
      })
      if (autoOutcomes.size > 0) {
        setSelectedOutcomes(Array.from(autoOutcomes))
      }

      return finalGoals
    })
  }

  // Toggle Functional Outcome in Step 2
  const toggleOutcome = (outcomeId: string) => {
    setSelectedOutcomes(prev => {
      const next = prev.includes(outcomeId)
        ? prev.filter(id => id !== outcomeId)
        : [...prev, outcomeId]
      return next.length === 0 ? [outcomeId] : next
    })
  }

  // Toggle Equipment in Step 3
  const toggleEquipment = (id: string) => {
    setSelectedEquipment(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  // Filter recommended modalities based on goals AND selected equipment
  const recommendedModalities = useMemo(() => {
    const map = new Map<string, ModalityOption & { goalTitle: string }>()
    
    selectedGoals.forEach(gId => {
      const archetype = GOAL_ARCHETYPES.find(a => a.id === gId)
      if (archetype) {
        archetype.modalities.forEach(m => {
          if (m.requiredHardware && !selectedEquipment.includes(m.requiredHardware)) {
            return
          }
          if (!map.has(m.id)) {
            map.set(m.id, { ...m, goalTitle: archetype.title })
          }
        })
      }
    })

    return Array.from(map.values())
  }, [selectedGoals, selectedEquipment])

  // Toggle Modality Check in Step 4
  const toggleModality = (modalityId: string) => {
    setSelectedModalities(prev => ({
      ...prev,
      [modalityId]: prev[modalityId] === undefined ? false : !prev[modalityId]
    }))
  }

  const isModalityChecked = (modalityId: string) => {
    return selectedModalities[modalityId] !== false
  }

  // Complete Onboarding and Launch Today
  const handleComplete = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const localUserId = getLocalUserId()
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const nameToSave = displayName.trim() || 'Protocol Optimizer'

      // Initialize outcome preference scores for all selected functional outcomes
      const outcomeScores: Record<string, number> = {}
      selectedOutcomes.forEach(id => {
        outcomeScores[id] = 7 // Default balanced high priority
      })

      // 1. Ensure profile exists and save preferences
      await getOrCreateUserProfile(localUserId)
      await updateUserProfile(localUserId, {
        display_name: nameToSave,
        primary_goals: selectedGoals,
        hardware_access: selectedEquipment,
        outcome_preference_scores: outcomeScores
      })

      // 2. Insert recommended starter tasks
      const activeMods = recommendedModalities.filter(m => isModalityChecked(m.id))
      for (const mod of activeMods) {
        try {
          await createDailyTask(localUserId, todayStr, mod.id)
        } catch (taskErr) {
          console.warn('Error scheduling task for:', mod.id, taskErr)
        }
      }

      // 3. Smooth navigation to Today view
      window.location.href = '/today'
    } catch (err) {
      console.error('Error completing onboarding:', err)
      window.location.href = '/today'
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/15 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-xl space-y-6">
        {/* Step Indicator */}
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
            <Sparkles size={12} className="text-emerald-400" />
            <span>
              {step === 1 ? 'Step 1 of 4: Primary Targets' 
                : step === 2 ? 'Step 2 of 4: Functional Outcomes' 
                : step === 3 ? 'Step 3 of 4: Equipment & Tools' 
                : 'Step 4 of 4: Starter Stack'}
            </span>
          </div>

          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Name & Goals */}
        {step === 1 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-purple-500/30 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                What is your primary focus?
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Select 1–3 targets to customize your precision protocol stack.
              </p>
            </div>

            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Your First Name / Handle
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>

            {/* Goal Archetypes */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Select Your Optimization Targets
              </label>
              
              <div className="grid grid-cols-1 gap-2.5">
                {GOAL_ARCHETYPES.map((goal) => {
                  const isSelected = selectedGoals.includes(goal.id)
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => handleToggleGoal(goal.id)}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected 
                          ? `${goal.borderColor} ${goal.bgGlow} shadow-lg ring-1 ring-white/10` 
                          : 'border-white/5 bg-black/40 hover:bg-white/5 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isSelected ? goal.borderColor : 'border-white/10 bg-black/50'}`}>
                          {goal.icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {goal.title}
                          </h3>
                          <p className="text-[11px] text-slate-400 truncate max-w-[280px] sm:max-w-md mt-0.5">
                            {goal.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                        isSelected ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-white/20 bg-transparent'
                      }`}>
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Next: Select Outcomes to Track</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: Functional Outcomes to Track (Clean Multi-Select, No Sliders!) */}
        {step === 2 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-purple-500/30 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                  Biomarker Telemetry
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Which outcomes do you want tracked?
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Tap to toggle the physiological dimensions you want measured across your habits. (You can fine-tune 1–10 importance rankings in your profile later).
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {FUNCTIONAL_OUTCOMES.map((outcome) => {
                const isSelected = selectedOutcomes.includes(outcome.id)
                return (
                  <button
                    key={outcome.id}
                    type="button"
                    onClick={() => toggleOutcome(outcome.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected 
                        ? 'border-purple-500/50 bg-slate-950/80 shadow-md ring-1 ring-purple-500/30' 
                        : 'border-white/5 bg-black/40 hover:bg-white/5 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSelected ? 'bg-purple-500/10 border-purple-500/30' : 'bg-black/50 border-white/10'
                      }`}>
                        {outcome.icon}
                      </div>
                      <div className="min-w-0">
                        <span className={`text-xs font-bold block ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {outcome.name}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[280px] sm:max-w-sm mt-0.5">
                          {outcome.description}
                        </span>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                      isSelected ? 'bg-purple-500 border-purple-400 text-white' : 'border-white/20 bg-transparent'
                    }`}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-2/3 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Next: Equipment &amp; Tools</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Equipment / Hardware */}
        {step === 3 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-purple-500/30 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                  Hardware Filter
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                What equipment do you have?
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                We will only recommend protocols that match your physical setup:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {EQUIPMENT_OPTIONS.map((item) => {
                const isSelected = selectedEquipment.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleEquipment(item.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected 
                        ? 'border-purple-500/50 bg-purple-500/10 shadow-md ring-1 ring-purple-500/30' 
                        : 'border-white/5 bg-black/40 hover:bg-white/5 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {item.label}
                      </span>
                    </div>

                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                      isSelected ? 'bg-purple-500 border-purple-400 text-white' : 'border-white/20 bg-transparent'
                    }`}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="w-2/3 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Curate My Protocol Stack</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Curated Starter Protocols Stack */}
        {step === 4 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-purple-500/30 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  Hardware &amp; Goal Calibrated
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Your Starter Protocol Stack
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Evidence-based habits tailored to your goals and equipment. Toggle any you want in today&apos;s routine:
              </p>
            </div>

            {/* Modalities Checklist */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {recommendedModalities.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 text-center">
                  No modalities matched your specific filter. Go back to adjust goals or equipment.
                </div>
              ) : (
                recommendedModalities.map((mod) => {
                  const checked = isModalityChecked(mod.id)
                  return (
                    <div
                      key={mod.id}
                      onClick={() => toggleModality(mod.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        checked 
                          ? 'bg-slate-950/80 border-emerald-500/40 shadow-sm' 
                          : 'bg-black/40 border-white/5 opacity-60'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white">
                            {mod.name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
                            {mod.timing}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-300/90 font-medium">
                          🎯 {mod.dose}
                        </p>
                      </div>

                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center border shrink-0 mt-0.5 transition-colors ${
                        checked ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-white/20 bg-transparent'
                      }`}>
                        {checked && <Check size={13} strokeWidth={3} />}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <span>Ready to launch! These will appear on your Today timeline immediately.</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-1/3 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting}
                className="w-2/3 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Launching Stack...</span>
                  </div>
                ) : (
                  <>
                    <span>Launch My Stack 🚀</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Security & Privacy Footer */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>Private, encrypted biometric engine. Customize anytime in settings.</span>
        </div>
      </div>
    </div>
  )
}
