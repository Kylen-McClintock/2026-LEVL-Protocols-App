'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { updateUserProfile, createDailyTask, getOrCreateUserProfile } from '@/lib/data'
import { format } from 'date-fns'
import { 
  Sparkles, Check, ArrowRight, ShieldCheck, Zap, Moon, 
  Brain, Dna, Dumbbell, Clock, Flame, Droplets, Watch, Pill, CheckCircle2 
} from 'lucide-react'

interface GoalArchetype {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  color: string
  borderColor: string
  bgGlow: string
  modalities: {
    name: string
    dose: string
    timing: string
    defaultChecked: boolean
  }[]
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
      { name: 'Morning Sunlight & Circadian Anchor', dose: '10–15 mins within 60m of waking', timing: 'waking', defaultChecked: true },
      { name: '4-7-8 Relaxing Wind-Down Breathwork', dose: '4 cycles (5 mins before bed)', timing: 'evening', defaultChecked: true },
      { name: 'Magnesium Glycinate + L-Theanine', dose: '400mg Magnesium + 200mg Theanine', timing: 'evening', defaultChecked: true }
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
      { name: 'Cold Plunge / Cold Shower', dose: '2–3 mins @ 50°F–55°F (Søberg reheat)', timing: 'morning_routine', defaultChecked: true },
      { name: 'Cyclic Sighing (Physiological Sigh)', dose: '5 mins (2 quick inhales, 1 long exhale)', timing: 'morning_routine', defaultChecked: true },
      { name: 'Delayed Caffeine Protocol', dose: 'Wait 90–120m post-waking to clear adenosine', timing: 'morning_routine', defaultChecked: true }
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
      { name: '16:8 Time-Restricted Feeding (TRF)', dose: '16h Fast / 8h Eating window', timing: 'afternoon', defaultChecked: true },
      { name: 'Post-Meal Glucose Walk', dose: '15–20 mins brisk walk after largest meal', timing: 'evening', defaultChecked: true },
      { name: 'High-Polyphenol Extra Virgin Olive Oil', dose: '1–2 tbsp (EVOO >500mg/kg polyphenols)', timing: 'morning_routine', defaultChecked: true }
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
      { name: 'Box Breathing (Navy SEAL Focus)', dose: '4 mins (4s in, 4s hold, 4s out, 4s hold)', timing: 'morning_routine', defaultChecked: true },
      { name: 'Creatine Monohydrate (Brain ATP)', dose: '5g with water in morning', timing: 'morning_routine', defaultChecked: true },
      { name: 'Optic Flow & Horizon Viewing', dose: '5 mins expansive visual panorama', timing: 'afternoon', defaultChecked: true }
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
      { name: 'Push / Pull / Legs Resistance Session', dose: '45–60 mins (RPE 7-9, 2-3 RIR)', timing: 'afternoon', defaultChecked: true },
      { name: 'Protein Distribution (Leucine Threshold)', dose: '30–40g high-quality protein per meal', timing: 'afternoon', defaultChecked: true },
      { name: 'Electrolyte & Hydration Priming', dose: '500ml water + 500mg Sodium/Potassium', timing: 'waking', defaultChecked: true }
    ]
  }
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
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1 State
  const [displayName, setDisplayName] = useState('')
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['longevity', 'energy'])

  // Step 2 State (Recommended Modalities selection)
  const [selectedModalities, setSelectedModalities] = useState<Record<string, boolean>>({})

  // Step 3 State (Equipment)
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(['wearable', 'supplements'])

  // Initialize selected modalities when goals change
  const handleToggleGoal = (goalId: string) => {
    setSelectedGoals(prev => {
      const next = prev.includes(goalId) 
        ? prev.filter(g => g !== goalId) 
        : [...prev, goalId]
      return next.length === 0 ? [goalId] : next
    })
  }

  // Get all modalities recommended from selected goals
  const recommendedModalities = React.useMemo(() => {
    const map = new Map<string, { name: string; dose: string; timing: string; goalTitle: string }>()
    selectedGoals.forEach(gId => {
      const archetype = GOAL_ARCHETYPES.find(a => a.id === gId)
      if (archetype) {
        archetype.modalities.forEach(m => {
          if (!map.has(m.name)) {
            map.set(m.name, { ...m, goalTitle: archetype.title })
          }
        })
      }
    })
    return Array.from(map.values())
  }, [selectedGoals])

  // Toggle modality checkbox in Step 2
  const toggleModality = (modalityName: string) => {
    setSelectedModalities(prev => ({
      ...prev,
      [modalityName]: prev[modalityName] === undefined ? false : !prev[modalityName]
    }))
  }

  const isModalityChecked = (modalityName: string) => {
    return selectedModalities[modalityName] !== false
  }

  // Equipment toggle
  const toggleEquipment = (id: string) => {
    setSelectedEquipment(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  // Complete and Launch Today Screen
  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      const localUserId = getLocalUserId()
      const todayStr = format(new Date(), 'yyyy-MM-dd')

      // 1. Ensure user profile exists and update with preferences
      await getOrCreateUserProfile(localUserId)
      await updateUserProfile(localUserId, {
        display_name: displayName.trim() || 'Protocol Optimizer',
        primary_goals: selectedGoals,
        hardware_access: selectedEquipment,
        outcome_preference_scores: {
          energy: 7,
          sleep_quality: 7,
          recovery: 7,
          focus: 7
        }
      })

      // 2. Pre-populate user's Today timeline with their selected starter modalities
      const activeModalities = recommendedModalities.filter(m => isModalityChecked(m.name))

      for (const mod of activeModalities) {
        try {
          await createDailyTask(localUserId, todayStr, mod.name, mod.dose)
        } catch (taskErr) {
          console.warn('Task creation note for modality:', mod.name, taskErr)
        }
      }

      // 3. Launch directly into Today
      router.push('/today')
    } catch (err) {
      console.error('Error completing onboarding:', err)
      router.push('/today')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Ambient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/15 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-xl space-y-6">
        {/* Progress Bar & Header */}
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
            <Sparkles size={12} className="text-emerald-400" />
            <span>Step {step} of 3 • Quick Personalization</span>
          </div>

          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Focus Archetype & Name */}
        {step === 1 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-purple-500/30 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                What is your primary focus?
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Choose 1–3 goals to calibrate your personalized starter protocol.
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

            {/* Goal Archetype Cards */}
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
              <span>Build My Recommended Stack</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: Recommended Protocols & Starter Stack */}
        {step === 2 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-purple-500/30 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  Precision Match
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Your Starter Protocol Stack
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                We curated evidence-based modalities based on your focus. Toggle any item you wish to include in your daily routine:
              </p>
            </div>

            {/* Modalities Checklist */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {recommendedModalities.map((mod) => {
                const checked = isModalityChecked(mod.name)
                return (
                  <div
                    key={mod.name}
                    onClick={() => toggleModality(mod.name)}
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
                <span>Continue to Hardware</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Available Hardware / Tools */}
        {step === 3 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-purple-500/30 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Available Equipment &amp; Tools
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Tap the tools you have access to so LEVL tailors your daily routines accordingly:
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

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <span>Ready to launch! Your daily protocol stack will be live and ready to track immediately.</span>
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
                onClick={handleComplete}
                disabled={isSubmitting}
                className="w-2/3 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Generating Stack...</span>
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
