'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { updateUserProfile } from '@/lib/data'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [displayName, setDisplayName] = useState('')
  const [goals, setGoals] = useState<string[]>([])
  const [energyScore, setEnergyScore] = useState(5)
  const [sleepScore, setSleepScore] = useState(5)

  // Negative longevity factors state
  const [negativeAlcohol, setNegativeAlcohol] = useState('skip')
  const [negativeNicotine, setNegativeNicotine] = useState('skip')
  const [negativeSitting, setNegativeSitting] = useState('skip')
  const [negativeCaffeine, setNegativeCaffeine] = useState('skip')

  const goalOptions = [
    'Live longer', 'Improve sleep', 'Improve energy', 
    'Improve focus', 'Gain muscle', 'Lose fat', 
    'Improve recovery', 'Reduce stress'
  ]

  const toggleGoal = (goal: string) => {
    setGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    )
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      const localUserId = getLocalUserId()
      const { getOrCreateUserProfile } = await import('@/lib/data')
      await getOrCreateUserProfile(localUserId)
      
      await updateUserProfile(localUserId, {
        display_name: displayName,
        primary_goals: goals,
        outcome_preference_scores: {
          'energy': energyScore,
          'sleep_quality': sleepScore,
          'negative_alcohol': negativeAlcohol === 'none' ? 0 : (negativeAlcohol === 'occasional' ? 3 : (negativeAlcohol === 'moderate' ? 6 : 9)),
          'negative_nicotine': negativeNicotine === 'none' ? 0 : 7,
          'negative_sitting': negativeSitting === 'under_4h' ? 1 : (negativeSitting === '4_7h' ? 4 : (negativeSitting === '8_10h' ? 8 : 10)),
          'negative_caffeine': negativeCaffeine === 'never' ? 0 : (negativeCaffeine === 'rarely' ? 3 : 8)
        }
      })
      
      router.push('/today')
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen p-6 max-w-md mx-auto justify-center">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Welcome to LEVL</h1>
        <p className="text-levl-text-secondary">Let's personalize your longevity protocol.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl space-y-6">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-lg font-semibold">What should we call you?</h2>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-black/50 border border-levl-border rounded-lg p-3 text-white focus:outline-none focus:border-levl-accent"
            />
            <button 
              onClick={() => setStep(2)}
              disabled={!displayName.trim()}
              className="w-full bg-levl-accent text-white font-medium py-3 rounded-lg disabled:opacity-50 mt-4"
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-lg font-semibold">What are your primary goals?</h2>
            <div className="grid grid-cols-2 gap-2">
              {goalOptions.map(goal => (
                <button
                  key={goal}
                  onClick={() => toggleGoal(goal)}
                  className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                    goals.includes(goal) 
                      ? 'bg-levl-accent/20 border-levl-accent text-levl-accent' 
                      : 'bg-black/30 border-levl-border text-levl-text-secondary'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
            <div className="flex space-x-2 mt-4">
              <button 
                onClick={() => setStep(1)}
                className="w-1/3 bg-transparent border border-levl-border text-white font-medium py-3 rounded-lg"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(3)}
                disabled={goals.length === 0}
                className="w-2/3 bg-levl-accent text-white font-medium py-3 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-lg font-semibold">Rate your current baseline</h2>
            
            <div className="space-y-2">
              <label className="text-sm text-levl-text-secondary flex justify-between">
                <span>Energy Levels</span>
                <span className="text-white font-bold">{energyScore}/10</span>
              </label>
              <input 
                type="range" min="0" max="10" 
                value={energyScore} onChange={(e) => setEnergyScore(parseInt(e.target.value))}
                className="w-full accent-levl-accent cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-levl-text-secondary flex justify-between">
                <span>Sleep Quality</span>
                <span className="text-white font-bold">{sleepScore}/10</span>
              </label>
              <input 
                type="range" min="0" max="10" 
                value={sleepScore} onChange={(e) => setSleepScore(parseInt(e.target.value))}
                className="w-full accent-levl-accent cursor-pointer"
              />
            </div>

            <div className="flex space-x-2 mt-8">
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 bg-transparent border border-levl-border text-white font-medium py-3 rounded-lg cursor-pointer"
              >
                Back
              </button>
              <button 
                type="button"
                onClick={() => setStep(4)}
                className="w-2/3 bg-levl-accent text-white font-medium py-3 rounded-lg cursor-pointer flex justify-center"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Negative Longevity Factors</h2>
              <p className="text-xs text-levl-text-secondary">Optional: Help us track baseline risks & counter-protocols.</p>
            </div>

            <div className="space-y-4 text-xs max-h-[340px] overflow-y-auto pr-1">
              {/* Alcohol */}
              <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-white/10">
                <label className="font-bold text-white block">🍷 Alcohol Consumption</label>
                <select
                  value={negativeAlcohol}
                  onChange={(e) => setNegativeAlcohol(e.target.value)}
                  className="w-full bg-black/60 border border-white/20 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-levl-accent"
                >
                  <option value="skip">-- Skip / Not Tracked --</option>
                  <option value="none">None (Teetotaler / Zero Alcohol)</option>
                  <option value="occasional">Occasional (1-2 drinks/week)</option>
                  <option value="moderate">Moderate (3-7 drinks/week)</option>
                  <option value="frequent">Heavy / Frequent (8+ drinks/week)</option>
                </select>
              </div>

              {/* Nicotine / Tobacco */}
              <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-white/10">
                <label className="font-bold text-white block">🚬 Nicotine & Tobacco</label>
                <select
                  value={negativeNicotine}
                  onChange={(e) => setNegativeNicotine(e.target.value)}
                  className="w-full bg-black/60 border border-white/20 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-levl-accent"
                >
                  <option value="skip">-- Skip / Not Tracked --</option>
                  <option value="none">None</option>
                  <option value="cigarettes">Cigarettes / Tobacco Smoking</option>
                  <option value="vaping">Vaping / E-Cigarettes</option>
                  <option value="pouches">Nicotine Pouches / Gum</option>
                </select>
              </div>

              {/* Prolonged Sitting */}
              <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-white/10">
                <label className="font-bold text-white block">🪑 Daily Sedentary / Sitting Hours</label>
                <select
                  value={negativeSitting}
                  onChange={(e) => setNegativeSitting(e.target.value)}
                  className="w-full bg-black/60 border border-white/20 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-levl-accent"
                >
                  <option value="skip">-- Skip / Not Tracked --</option>
                  <option value="under_4h">Under 4 hours/day (Active)</option>
                  <option value="4_7h">4 to 7 hours/day (Moderate desk time)</option>
                  <option value="8_10h">8 to 10 hours/day (Heavy sedentary)</option>
                  <option value="over_10h">10+ hours/day (Prolonged sitting)</option>
                </select>
              </div>

              {/* Late Caffeine */}
              <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-white/10">
                <label className="font-bold text-white block">☕ Late Afternoon Caffeine</label>
                <select
                  value={negativeCaffeine}
                  onChange={(e) => setNegativeCaffeine(e.target.value)}
                  className="w-full bg-black/60 border border-white/20 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-levl-accent"
                >
                  <option value="skip">-- Skip / Not Tracked --</option>
                  <option value="never">Never (Cut off before 12 PM / None)</option>
                  <option value="rarely">Rarely (Occasional late coffee)</option>
                  <option value="frequent">2-3x / week after 2 PM</option>
                  <option value="daily">Daily after 2-4 PM</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-2 mt-6">
              <button 
                type="button"
                onClick={() => setStep(3)}
                className="w-1/3 bg-transparent border border-levl-border text-white font-medium py-3 rounded-lg cursor-pointer"
              >
                Back
              </button>
              <button 
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting}
                className="w-2/3 bg-levl-accent text-white font-medium py-3 rounded-lg disabled:opacity-50 flex justify-center cursor-pointer shadow-lg shadow-levl-accent/20"
              >
                {isSubmitting ? 'Saving...' : 'Finish Onboarding'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
