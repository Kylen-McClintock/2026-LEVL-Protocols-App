'use client'

import { useState, useEffect, useRef } from 'react'
import { UserProfile, OutcomeDimension } from '@/lib/types'
import { updateUserProfile } from '@/lib/data'
import { Activity, Target, Wallet, X, Plus, ChevronDown, ChevronUp } from 'lucide-react'

const AVAILABLE_GOALS = [
  'Lifespan Extension',
  'Healthspan',
  'Cognitive Performance',
  'Athletic Recovery',
  'Metabolic Health',
  'Aesthetic Anti-Aging'
]

type ProfileEditorProps = {
  profile: UserProfile
  outcomes: OutcomeDimension[]
}

export default function ProfileEditor({ profile, outcomes }: ProfileEditorProps) {
  const [goals, setGoals] = useState<string[]>(profile.primary_goals || [])
  const [preferences, setPreferences] = useState<Record<string, number>>(
    profile.outcome_preference_scores || {}
  )
  
  // Expandable Negative Factors Card State
  const [isNegSectionExpanded, setIsNegSectionExpanded] = useState(false)
  
  // Optional Constraints State
  const [enableBudget, setEnableBudget] = useState(profile.weekly_spend_budget_usd != null)
  const [budget, setBudget] = useState<number>(profile.weekly_spend_budget_usd || 50)
  
  const [enableTime, setEnableTime] = useState(profile.weekly_time_budget_hours != null)
  const [time, setTime] = useState<number>(profile.weekly_time_budget_hours || 5)

  const [enableComplexity, setEnableComplexity] = useState(profile.discipline_level_0_99 != null)
  const [complexity, setComplexity] = useState<number>(profile.discipline_level_0_99 || 50)

  const [enableEvidence, setEnableEvidence] = useState(profile.experimental_openness_0_99 != null)
  const [evidence, setEvidence] = useState<number>(profile.experimental_openness_0_99 || 50)

  const [enableSafety, setEnableSafety] = useState(profile.risk_tolerance != null)
  const [safetyIndex, setSafetyIndex] = useState<number>(
    profile.risk_tolerance === 'high_risk' ? 3 : profile.risk_tolerance === 'moderate_risk' ? 2 : 1
  )

  const [isSaving, setIsSaving] = useState(false)

  // Advanced Biomarker States
  const [age, setAge] = useState<string>(profile.age?.toString() || '')
  const [heightFeet, setHeightFeet] = useState<string>(
    profile.height_inches ? Math.floor(profile.height_inches / 12).toString() : ''
  )
  const [heightInches, setHeightInches] = useState<string>(
    profile.height_inches ? (profile.height_inches % 12).toString() : ''
  )
  const [weight, setWeight] = useState<string>(profile.weight_lbs?.toString() || '')
  const [bodyFat, setBodyFat] = useState<string>(profile.body_fat_percentage?.toString() || '')
  const [sleepQuality, setSleepQuality] = useState<number>(profile.baseline_sleep_quality_0_10 || 5)
  const [enableSleep, setEnableSleep] = useState(profile.baseline_sleep_quality_0_10 != null)

  const initialSex = profile.biological_sex || ''
  const isCustomSex = initialSex && !['Male', 'Female'].includes(initialSex)
  const [sexSelection, setSexSelection] = useState<string>(isCustomSex ? 'Other' : initialSex)
  const [customSex, setCustomSex] = useState<string>(isCustomSex ? initialSex : '')

  const initialDiet = profile.dietary_pattern || ''
  const standardDiets = ['Omnivore', 'Mediterranean', 'Vegetarian', 'Vegan', 'Keto', 'Carnivore', 'Paleo']
  const isCustomDiet = initialDiet && !standardDiets.includes(initialDiet)
  const [dietSelection, setDietSelection] = useState<string>(isCustomDiet ? 'Other' : initialDiet)
  const [customDiet, setCustomDiet] = useState<string>(isCustomDiet ? initialDiet : '')

  // Negative Longevity Baseline Exposures State (Default: 'skip')
  const [negAlcohol, setNegAlcohol] = useState<string>(preferences['neg_alcohol'] !== undefined ? String(preferences['neg_alcohol']) : 'skip')
  const [negNicotine, setNegNicotine] = useState<string>(preferences['neg_nicotine'] !== undefined ? String(preferences['neg_nicotine']) : 'skip')
  const [negSitting, setNegSitting] = useState<string>(preferences['neg_sitting'] !== undefined ? String(preferences['neg_sitting']) : 'skip')
  const [negCaffeine, setNegCaffeine] = useState<string>(preferences['neg_caffeine'] !== undefined ? String(preferences['neg_caffeine']) : 'skip')
  const [negScreens, setNegScreens] = useState<string>(preferences['neg_screens'] !== undefined ? String(preferences['neg_screens']) : 'skip')
  const [negLateMeal, setNegLateMeal] = useState<string>(preferences['neg_late_meal'] !== undefined ? String(preferences['neg_late_meal']) : 'skip')
  const [negSugar, setNegSugar] = useState<string>(preferences['neg_sugar'] !== undefined ? String(preferences['neg_sugar']) : 'skip')
  
  // Infradian Cycle States (Only relevant for Female < 52)
  const [enableInfradian, setEnableInfradian] = useState<boolean>(profile.infradian_cycle_enabled || false)
  const [lastPeriodStartDate, setLastPeriodStartDate] = useState<string>(profile.last_period_start_date || '')
  const [cycleLengthDays, setCycleLengthDays] = useState<number>(profile.average_cycle_length_days || 28)

  const hasMountedRef = useRef(false)
  const isSyncingFromPropsRef = useRef(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Sync state when profile prop changes externally (e.g. from onboarding or recalibration)
  useEffect(() => {
    isSyncingFromPropsRef.current = true
    if (profile.primary_goals) setGoals(profile.primary_goals)
    if (profile.outcome_preference_scores) setPreferences(profile.outcome_preference_scores)
    if (profile.age != null) setAge(profile.age.toString())
    if (profile.height_inches != null) {
      setHeightFeet(Math.floor(profile.height_inches / 12).toString())
      setHeightInches((profile.height_inches % 12).toString())
    }
    if (profile.weight_lbs != null) setWeight(profile.weight_lbs.toString())
    if (profile.body_fat_percentage != null) setBodyFat(profile.body_fat_percentage.toString())
    if (profile.biological_sex) {
      const isCustom = !['Male', 'Female'].includes(profile.biological_sex)
      setSexSelection(isCustom ? 'Other' : profile.biological_sex)
      setCustomSex(isCustom ? profile.biological_sex : '')
    }
    if (profile.dietary_pattern) {
      const isCustomD = !standardDiets.includes(profile.dietary_pattern)
      setDietSelection(isCustomD ? 'Other' : profile.dietary_pattern)
      setCustomDiet(isCustomD ? profile.dietary_pattern : '')
    }
    if (profile.infradian_cycle_enabled != null) setEnableInfradian(profile.infradian_cycle_enabled)
    if (profile.last_period_start_date) setLastPeriodStartDate(profile.last_period_start_date)
    if (profile.average_cycle_length_days) setCycleLengthDays(profile.average_cycle_length_days)
    
    setTimeout(() => {
      isSyncingFromPropsRef.current = false
      hasMountedRef.current = true
    }, 150)
  }, [profile])

  // Guaranteed Auto-save effect on any user state modification
  useEffect(() => {
    if (!hasMountedRef.current || isSyncingFromPropsRef.current) return

    const save = async () => {
      setIsSaving(true)
      
      const riskMapping = { 1: 'low_risk', 2: 'moderate_risk', 3: 'high_risk' }
      
      const finalSex = sexSelection === 'Other' ? customSex : sexSelection
      const finalDiet = dietSelection === 'Other' ? customDiet : dietSelection

      const isFemaleEligible = finalSex === 'Female' && (!age || parseInt(age) < 52)

      const updatedPref = {
        ...preferences,
        neg_alcohol: negAlcohol,
        neg_nicotine: negNicotine,
        neg_sitting: negSitting,
        neg_caffeine: negCaffeine,
        neg_screens: negScreens,
        neg_late_meal: negLateMeal,
        neg_sugar: negSugar
      }

      const totalHeightInches = (parseInt(heightFeet || '0', 10) * 12) + parseInt(heightInches || '0', 10)

      await updateUserProfile(profile.local_user_id, {
        primary_goals: goals,
        outcome_preference_scores: updatedPref,
        weekly_spend_budget_usd: enableBudget ? budget : null as any,
        weekly_time_budget_hours: enableTime ? time : null as any,
        discipline_level_0_99: enableComplexity ? complexity : null as any,
        experimental_openness_0_99: enableEvidence ? evidence : null as any,
        risk_tolerance: enableSafety ? riskMapping[safetyIndex as keyof typeof riskMapping] : null as any,
        age: age ? parseInt(age, 10) : null as any,
        height_inches: totalHeightInches > 0 ? totalHeightInches : null as any,
        weight_lbs: weight ? parseFloat(weight) : null as any,
        body_fat_percentage: bodyFat ? parseFloat(bodyFat) : null as any,
        baseline_sleep_quality_0_10: enableSleep ? sleepQuality : null as any,
        biological_sex: finalSex || null as any,
        dietary_pattern: finalDiet || null as any,
        infradian_cycle_enabled: isFemaleEligible ? enableInfradian : false,
        last_period_start_date: isFemaleEligible && enableInfradian && lastPeriodStartDate ? lastPeriodStartDate : null as any,
        average_cycle_length_days: isFemaleEligible && enableInfradian ? cycleLengthDays : null as any
      })
      setIsSaving(false)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2000)
    }
    
    const timeout = setTimeout(save, 400)
    return () => clearTimeout(timeout)
  }, [
    goals, preferences, 
    enableBudget, budget, 
    enableTime, time, 
    enableComplexity, complexity, 
    enableEvidence, evidence, 
    enableSafety, safetyIndex,
    age, heightFeet, heightInches, weight, bodyFat, sleepQuality, enableSleep,
    sexSelection, customSex, dietSelection, customDiet,
    enableInfradian, lastPeriodStartDate, cycleLengthDays,
    negAlcohol, negNicotine, negSitting, negCaffeine, negScreens, negLateMeal, negSugar,
    profile.local_user_id
  ])

  const toggleGoal = (goal: string) => {
    setGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    )
  }

  const updatePreference = (id: string, val: number) => {
    setPreferences(prev => ({ ...prev, [id]: val }))
  }

  const removePreference = (id: string) => {
    setPreferences(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const addPreference = (id: string) => {
    if (id && !preferences[id]) {
      setPreferences(prev => ({ ...prev, [id]: 7 })) // Default to 7/10
    }
  }

  const trackedOutcomeIds = Object.keys(preferences)
  const availableToAdd = outcomes.filter(o => !trackedOutcomeIds.includes(o.id))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center text-xs">
        <span className="text-levl-text-secondary">Your ranking profile drives the Explore tab recommendations.</span>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/5 text-[11px] font-mono shrink-0">
          {isSaving ? (
            <span className="text-levl-accent font-bold animate-pulse">Saving...</span>
          ) : savedSuccess ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              ✓ Auto-saved
            </span>
          ) : (
            <span className="text-slate-500 font-medium">Auto-saves on change</span>
          )}
        </div>
      </div>

      {/* Primary Goals */}
      <div className="glass-card p-4 rounded-xl space-y-3">
        <h3 className="font-bold flex items-center gap-2"><Target size={18} className="text-levl-accent" /> Primary Goals</h3>
        <p className="text-xs text-levl-text-secondary">Select the domains you care most about.</p>
        <div className="flex flex-wrap gap-2 pt-2">
          {AVAILABLE_GOALS.map(goal => {
            const active = goals.includes(goal)
            return (
              <button
                key={goal}
                onClick={() => toggleGoal(goal)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active ? 'bg-levl-accent text-white border-levl-accent' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                {goal}
              </button>
            )
          })}
        </div>
      </div>

      {/* Advanced Biomarkers */}
      <div className="glass-card p-4 rounded-xl space-y-4">
        <h3 className="font-bold flex items-center gap-2"><Activity size={18} className="text-levl-accent" /> Biomarkers & Lifestyle</h3>
        <p className="text-xs text-levl-text-secondary">All fields are optional but help the engine calibrate mg/kg dosing, BMI, and PhenoAge biological age.</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Chronological Age</label>
            <input 
              type="number" 
              value={age} 
              onChange={e => setAge(e.target.value)} 
              placeholder="" 
              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white placeholder:text-slate-700 focus:border-levl-accent outline-none" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Body Fat %</label>
            <input 
              type="number" 
              value={bodyFat} 
              onChange={e => setBodyFat(e.target.value)} 
              placeholder="" 
              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white placeholder:text-slate-700 focus:border-levl-accent outline-none" 
            />
          </div>
        </div>

        {/* Height & Weight Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-400">Height</label>
              {((parseInt(heightFeet || '0') * 12) + parseInt(heightInches || '0')) > 0 && (
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  ≈ {Math.round((((parseInt(heightFeet || '0') * 12) + parseInt(heightInches || '0')) * 2.54) * 10) / 10} cm
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 focus-within:border-levl-accent">
                <input
                  type="number"
                  value={heightFeet}
                  onChange={e => setHeightFeet(e.target.value)}
                  placeholder=""
                  min={3}
                  max={7}
                  className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-700"
                />
                <span className="text-xs text-slate-400 font-mono">ft</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 focus-within:border-levl-accent">
                <input
                  type="number"
                  value={heightInches}
                  onChange={e => setHeightInches(e.target.value)}
                  placeholder=""
                  min={0}
                  max={11}
                  className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-700"
                />
                <span className="text-xs text-slate-400 font-mono">in</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-400">Weight (lbs)</label>
              {parseFloat(weight) > 0 && (
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  ≈ {Math.round((parseFloat(weight) * 0.45359237) * 10) / 10} kg
                </span>
              )}
            </div>
            <input 
              type="number" 
              value={weight} 
              onChange={e => setWeight(e.target.value)} 
              placeholder="" 
              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white placeholder:text-slate-700 focus:border-levl-accent outline-none" 
            />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-white/5">
          <label className="block text-xs font-medium text-gray-400 mb-1">Biological Sex</label>
          <div className="flex gap-2">
            {['Male', 'Female', 'Other'].map(opt => (
              <button 
                key={opt} 
                onClick={() => setSexSelection(opt)} 
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${sexSelection === opt ? 'bg-levl-accent text-white border-levl-accent' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
              >
                {opt}
              </button>
            ))}
          </div>
          {sexSelection === 'Other' && (
            <input 
              type="text" 
              value={customSex} 
              onChange={e => setCustomSex(e.target.value)} 
              placeholder="Specify..." 
              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white mt-2 outline-none" 
            />
          )}
        </div>

        {/* Conditional Infradian & Menstrual Cycle Tracking Card (Only for Female < 52) */}
        {sexSelection === 'Female' && (!age || parseInt(age) < 52) && (
          <div className="space-y-3 pt-3 border-t border-rose-500/20 bg-rose-950/20 p-3.5 rounded-xl border border-rose-500/30 animate-in fade-in">
            <div className="flex justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">🌸</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Infradian &amp; Menstrual Cycle Protocol Sync</h4>
                  <p className="text-[10px] text-slate-300">
                    Syncs cold exposure, sauna heat, fasting, and HRV baselines to your monthly hormonal rhythm.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEnableInfradian(!enableInfradian)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  enableInfradian
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {enableInfradian ? 'Enabled' : 'Enable'}
              </button>
            </div>

            {enableInfradian && (
              <div className="space-y-3 pt-2 border-t border-white/5 text-xs animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-rose-300 font-bold mb-1">
                      Last Period Start Date (Day 1)
                    </label>
                    <input
                      type="date"
                      value={lastPeriodStartDate}
                      onChange={e => setLastPeriodStartDate(e.target.value)}
                      className="w-full bg-slate-900 border border-rose-500/40 rounded-lg p-1.5 text-xs text-white focus:border-rose-400 outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-rose-300 font-bold mb-1">
                      <span>Average Cycle Length</span>
                      <span>{cycleLengthDays} Days</span>
                    </div>
                    <input
                      type="range"
                      min="21"
                      max="38"
                      value={cycleLengthDays}
                      onChange={e => setCycleLengthDays(parseInt(e.target.value))}
                      className="w-full accent-rose-500 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400">
                  💡 <strong>Smart Contextual Hotkey:</strong> When your period window approaches (~Day 26–28), LEVL will automatically surface a quick 1-tap period logger on your Today dashboard.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2 pt-2 border-t border-white/5">
          <label className="block text-xs font-medium text-gray-400 mb-1">Dietary Pattern</label>
          <select value={dietSelection} onChange={e => setDietSelection(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-levl-accent outline-none appearance-none cursor-pointer">
            <option value="">None specified</option>
            {['Omnivore', 'Mediterranean', 'Vegetarian', 'Vegan', 'Keto', 'Carnivore', 'Paleo'].map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
            <option value="Other">Other</option>
          </select>
          {dietSelection === 'Other' && (
            <input type="text" value={customDiet} onChange={e => setCustomDiet(e.target.value)} placeholder="Specify..." className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white mt-2 outline-none" />
          )}
        </div>

        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-gray-400">Baseline Sleep Quality</label>
            <button onClick={() => setEnableSleep(!enableSleep)} className="text-xs text-levl-accent hover:underline cursor-pointer">
              {enableSleep ? 'Disable' : 'Enable'}
            </button>
          </div>
          {enableSleep && (
            <>
              <div className="flex justify-between text-xs text-levl-accent font-bold mt-2">
                <span>Terrible</span><span>{sleepQuality}/10</span><span>Excellent</span>
              </div>
              <input type="range" min="1" max="10" value={sleepQuality} onChange={e => setSleepQuality(parseInt(e.target.value))} className="w-full accent-levl-purple h-1.5 bg-levl-background rounded-lg appearance-none cursor-pointer" />
            </>
          )}
        </div>
      </div>

      {/* Constraints */}
      <div className="glass-card p-4 rounded-xl space-y-6">
        <div>
          <h3 className="font-bold flex items-center gap-2"><Wallet size={18} className="text-yellow-500" /> Optional Constraints</h3>
          <p className="text-xs text-levl-text-secondary mt-1">Enable sliders to penalize or filter modalities in your ranking.</p>
        </div>
        
        {/* Budget Slider */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={enableBudget} onChange={e => setEnableBudget(e.target.checked)} className="accent-levl-accent" />
            <span className="text-sm font-bold">Weekly Budget</span>
          </div>
          {enableBudget && (
            <div className="pl-6">
              <div className="flex justify-between text-xs mb-1">
                <span>Spend Tolerance</span>
                <span className="text-yellow-500 font-bold">${budget}/wk</span>
              </div>
              <input 
                type="range" min="0" max="500" step="10"
                value={budget} onChange={(e) => setBudget(parseInt(e.target.value))}
                className="w-full accent-yellow-500"
              />
            </div>
          )}
        </div>

        {/* Time Slider */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={enableTime} onChange={e => setEnableTime(e.target.checked)} className="accent-levl-accent" />
            <span className="text-sm font-bold">Time Commitment</span>
          </div>
          {enableTime && (
            <div className="pl-6">
              <div className="flex justify-between text-xs mb-1">
                <span>Max Time per Week</span>
                <span className="text-blue-400 font-bold">{time} hrs</span>
              </div>
              <input 
                type="range" min="1" max="20" step="1"
                value={time} onChange={(e) => setTime(parseInt(e.target.value))}
                className="w-full accent-blue-400"
              />
            </div>
          )}
        </div>

        {/* Complexity Slider */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={enableComplexity} onChange={e => setEnableComplexity(e.target.checked)} className="accent-levl-accent" />
            <span className="text-sm font-bold">Complexity / Effort Tolerance</span>
          </div>
          {enableComplexity && (
            <div className="pl-6">
              <div className="flex justify-between text-xs mb-1">
                <span>Tolerance Level</span>
                <span className="text-purple-400 font-bold">{complexity}%</span>
              </div>
              <div className="flex justify-between text-[10px] text-levl-text-secondary mb-1">
                <span>Simple & Easy</span>
                <span>Highly Complex</span>
              </div>
              <input 
                type="range" min="1" max="100"
                value={complexity} onChange={(e) => setComplexity(parseInt(e.target.value))}
                className="w-full accent-purple-400"
              />
            </div>
          )}
        </div>

        {/* Evidence Slider */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={enableEvidence} onChange={e => setEnableEvidence(e.target.checked)} className="accent-levl-accent" />
            <span className="text-sm font-bold">Evidence vs Emerging</span>
          </div>
          {enableEvidence && (
            <div className="pl-6">
              <div className="flex justify-between text-xs mb-1">
                <span>Openness to Emerging Science</span>
                <span className="text-levl-accent font-bold">{evidence}%</span>
              </div>
              <div className="flex justify-between text-[10px] text-levl-text-secondary mb-1">
                <span>Proven Clinical Only</span>
                <span>Bleeding Edge</span>
              </div>
              <input 
                type="range" min="1" max="100"
                value={evidence} onChange={(e) => setEvidence(parseInt(e.target.value))}
                className="w-full accent-levl-accent"
              />
            </div>
          )}
        </div>

        {/* Safety / Side Effects Slider */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={enableSafety} onChange={e => setEnableSafety(e.target.checked)} className="accent-levl-accent" />
            <span className="text-sm font-bold">Side Effect Tolerance</span>
          </div>
          {enableSafety && (
            <div className="pl-6">
              <div className="flex justify-between text-xs mb-1">
                <span>Tolerance for Side Effects</span>
                <span className="text-red-400 font-bold">
                  {safetyIndex === 1 ? 'Zero Risk' : safetyIndex === 2 ? 'Moderate Risk' : 'High Risk'}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-levl-text-secondary mb-1">
                <span>Completely Safe</span>
                <span>High Risk/Reward</span>
              </div>
              <input 
                type="range" min="1" max="3" step="1"
                value={safetyIndex} onChange={(e) => setSafetyIndex(parseInt(e.target.value))}
                className="w-full accent-red-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* Expandable Negative Longevity Baseline Exposures Card (Bottom of Profile) */}
      <div className="glass-card rounded-xl border border-rose-500/30 bg-rose-950/10 overflow-hidden shadow-lg transition-all duration-300">
        <button
          type="button"
          onClick={() => setIsNegSectionExpanded(!isNegSectionExpanded)}
          className="w-full p-4 flex items-center justify-between bg-rose-500/10 border-b border-rose-500/20 text-left cursor-pointer hover:bg-rose-500/15 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🚫</span>
            <div>
              <h3 className="font-bold text-sm text-rose-300">Baseline Negative Longevity Factors & Risks</h3>
              <p className="text-[11px] text-gray-400">Configure baseline alcohol, smoking, sitting, caffeine & screen risks</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-rose-300 font-bold shrink-0">
            <span>{isNegSectionExpanded ? 'Hide' : 'Configure'}</span>
            {isNegSectionExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {isNegSectionExpanded && (
          <div className="p-4 space-y-4 animate-in fade-in slide-in-from-top-2 text-xs">
            {/* Alcohol */}
            <div className="space-y-1 bg-black/40 p-3 rounded-lg border border-white/10">
              <label className="font-bold text-white block">🍷 Baseline Alcohol Intake</label>
              <select
                value={negAlcohol}
                onChange={(e) => setNegAlcohol(e.target.value)}
                className="w-full bg-black/60 border border-white/20 rounded p-2 text-white"
              >
                <option value="skip">-- Skip / Not Tracked --</option>
                <option value="none">None (Zero Alcohol)</option>
                <option value="occasional">Occasional (1-2 drinks/week)</option>
                <option value="moderate">Moderate (3-7 drinks/week)</option>
                <option value="heavy">Heavy (8+ drinks/week)</option>
              </select>
            </div>

            {/* Nicotine / Smoking */}
            <div className="space-y-1 bg-black/40 p-3 rounded-lg border border-white/10">
              <label className="font-bold text-white block">🚬 Nicotine & Smoking</label>
              <select
                value={negNicotine}
                onChange={(e) => setNegNicotine(e.target.value)}
                className="w-full bg-black/60 border border-white/20 rounded p-2 text-white"
              >
                <option value="skip">-- Skip / Not Tracked --</option>
                <option value="none">None</option>
                <option value="cigarettes">Cigarettes / Tobacco</option>
                <option value="vaping">Vaping / E-Cigarettes</option>
                <option value="pouches">Nicotine Pouches / Gum</option>
              </select>
            </div>

            {/* Sedentary Hours */}
            <div className="space-y-1 bg-black/40 p-3 rounded-lg border border-white/10">
              <label className="font-bold text-white block">🪑 Daily Sedentary / Sitting Time</label>
              <select
                value={negSitting}
                onChange={(e) => setNegSitting(e.target.value)}
                className="w-full bg-black/60 border border-white/20 rounded p-2 text-white"
              >
                <option value="skip">-- Skip / Not Tracked --</option>
                <option value="under_4h">&lt;4 Hours/day (Active)</option>
                <option value="4_7h">4-7 Hours/day (Desk work)</option>
                <option value="8_10h">8-10 Hours/day (Heavy sitting)</option>
                <option value="over_10h">10+ Hours/day (Prolonged sedentary)</option>
              </select>
            </div>

            {/* Late Caffeine */}
            <div className="space-y-1 bg-black/40 p-3 rounded-lg border border-white/10">
              <label className="font-bold text-white block">☕ Late Afternoon Caffeine</label>
              <select
                value={negCaffeine}
                onChange={(e) => setNegCaffeine(e.target.value)}
                className="w-full bg-black/60 border border-white/20 rounded p-2 text-white"
              >
                <option value="skip">-- Skip / Not Tracked --</option>
                <option value="never">Never (Cut off before 12 PM)</option>
                <option value="rarely">Rarely</option>
                <option value="frequent">2-3x / week after 2 PM</option>
                <option value="daily">Daily after 2-4 PM</option>
              </select>
            </div>

            {/* Late Blue Light */}
            <div className="space-y-1 bg-black/40 p-3 rounded-lg border border-white/10">
              <label className="font-bold text-white block">📱 Late Night Blue Light / Screens</label>
              <select
                value={negScreens}
                onChange={(e) => setNegScreens(e.target.value)}
                className="w-full bg-black/60 border border-white/20 rounded p-2 text-white"
              >
                <option value="skip">-- Skip / Not Tracked --</option>
                <option value="minimal">Minimal (Screen-free 1h before bed)</option>
                <option value="moderate">Moderate (TV / Night shift mode)</option>
                <option value="high">High (Phone / Screens in bed)</option>
              </select>
            </div>

            {/* Ultra-processed Foods */}
            <div className="space-y-1 bg-black/40 p-3 rounded-lg border border-white/10">
              <label className="font-bold text-white block">🍕 Ultra-Processed Foods & Refined Sugar</label>
              <select
                value={negSugar}
                onChange={(e) => setNegSugar(e.target.value)}
                className="w-full bg-black/60 border border-white/20 rounded p-2 text-white"
              >
                <option value="skip">-- Skip / Not Tracked --</option>
                <option value="low">Low (Clean whole foods diet)</option>
                <option value="moderate">Moderate (Occasional treats / processed foods)</option>
                <option value="high">High (Frequent refined sugars & ultra-processed meals)</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
