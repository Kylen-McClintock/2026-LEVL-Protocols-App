'use client'

import { useState, useEffect } from 'react'
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

  // Auto-save logic
  useEffect(() => {
    const save = async () => {
      setIsSaving(true)
      
      const riskMapping = { 1: 'low_risk', 2: 'moderate_risk', 3: 'high_risk' }
      
      const finalSex = sexSelection === 'Other' ? customSex : sexSelection
      const finalDiet = dietSelection === 'Other' ? customDiet : dietSelection

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

      await updateUserProfile(profile.local_user_id, {
        primary_goals: goals,
        outcome_preference_scores: updatedPref,
        weekly_spend_budget_usd: enableBudget ? budget : null as any,
        weekly_time_budget_hours: enableTime ? time : null as any,
        discipline_level_0_99: enableComplexity ? complexity : null as any,
        experimental_openness_0_99: enableEvidence ? evidence : null as any,
        risk_tolerance: enableSafety ? riskMapping[safetyIndex as keyof typeof riskMapping] : null as any,
        age: age ? parseInt(age) : null as any,
        weight_lbs: weight ? parseFloat(weight) : null as any,
        body_fat_percentage: bodyFat ? parseFloat(bodyFat) : null as any,
        baseline_sleep_quality_0_10: enableSleep ? sleepQuality : null as any,
        biological_sex: finalSex || null as any,
        dietary_pattern: finalDiet || null as any
      })
      setTimeout(() => setIsSaving(false), 500)
    }
    
    const timeout = setTimeout(save, 800)
    return () => clearTimeout(timeout)
  }, [
    goals, preferences, 
    enableBudget, budget, 
    enableTime, time, 
    enableComplexity, complexity, 
    enableEvidence, evidence, 
    enableSafety, safetyIndex,
    age, weight, bodyFat, sleepQuality, enableSleep,
    sexSelection, customSex, dietSelection, customDiet,
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
      setPreferences(prev => ({ ...prev, [id]: 5 })) // Default to 5/10
    }
  }

  const trackedOutcomeIds = Object.keys(preferences)
  const availableToAdd = outcomes.filter(o => !trackedOutcomeIds.includes(o.id))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center text-xs">
        <span className="text-levl-text-secondary">Your ranking profile drives the Explore tab recommendations.</span>
        <span className={`transition-opacity ${isSaving ? 'opacity-100 text-levl-accent' : 'opacity-0'} font-bold`}>Saving...</span>
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
        <p className="text-xs text-levl-text-secondary">All fields are optional but help the engine make personalized recommendations.</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Age</label>
            <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 35" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-levl-accent outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Body Fat %</label>
            <input type="number" value={bodyFat} onChange={e => setBodyFat(e.target.value)} placeholder="e.g. 15" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-levl-accent outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Weight (lbs)</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 170" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-levl-accent outline-none" />
        </div>

        <div className="space-y-2 pt-2 border-t border-white/5">
          <label className="block text-xs font-medium text-gray-400 mb-1">Biological Sex</label>
          <div className="flex gap-2">
            {['Male', 'Female', 'Other'].map(opt => (
              <button key={opt} onClick={() => setSexSelection(opt)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${sexSelection === opt ? 'bg-levl-accent text-white border-levl-accent' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                {opt}
              </button>
            ))}
          </div>
          {sexSelection === 'Other' && (
            <input type="text" value={customSex} onChange={e => setCustomSex(e.target.value)} placeholder="Specify..." className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white mt-2 outline-none" />
          )}
        </div>

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

      {/* Outcome Preferences */}
      <div className="glass-card p-4 rounded-xl space-y-4">
        <h3 className="font-bold flex items-center gap-2"><Activity size={18} className="text-levl-purple" /> Outcome Preferences</h3>
        <p className="text-xs text-levl-text-secondary">Rate how important tracking these specific outcomes are to you (1-10).</p>
        
        <div className="space-y-4 pt-2">
          {trackedOutcomeIds.map(id => {
            const outcome = outcomes.find(o => o.id === id)
            const label = outcome ? outcome.name : id.replace('_', ' ')
            const val = preferences[id] || 5
            return (
              <div key={id} className="group">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="flex items-center gap-2">
                    {label}
                    <button 
                      onClick={() => removePreference(id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                      title="Remove from tracking"
                    >
                      <X size={12} />
                    </button>
                  </span>
                  <span className="text-levl-accent font-bold">{val}/10</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={val}
                  onChange={(e) => updatePreference(id, parseInt(e.target.value))}
                  className="w-full accent-levl-purple h-1.5 bg-levl-background rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )
          })}

          {trackedOutcomeIds.length === 0 && (
            <p className="text-xs text-levl-text-secondary italic">You aren't tracking any specific outcomes yet.</p>
          )}
        </div>

        {availableToAdd.length > 0 && (
          <div className="pt-2 border-t border-white/5 mt-4">
            <label className="block text-xs font-medium text-levl-text-secondary mb-1">Add Outcome to Track</label>
            <select 
              className="w-full bg-levl-background border border-levl-border rounded-lg p-2 text-sm text-white focus:border-levl-accent outline-none appearance-none cursor-pointer"
              onChange={(e) => {
                if (e.target.value) {
                  addPreference(e.target.value)
                  e.target.value = '' // reset select
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>-- Select an outcome --</option>
              {availableToAdd.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        )}
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
