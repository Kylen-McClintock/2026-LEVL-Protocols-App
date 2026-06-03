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
      // Profile row is auto-created in getOrCreateUserProfile on Today view if missing,
      // but let's upsert it here to be safe. We'll use the updateUserProfile.
      // Wait, we need to make sure the row exists first or do an upsert.
      // Since it's an MVP, let's just push to /today and let /today create it, then we update it.
      // Actually, we can fetch it first to ensure creation, then update.
      const { getOrCreateUserProfile } = await import('@/lib/data')
      await getOrCreateUserProfile(localUserId)
      
      await updateUserProfile(localUserId, {
        display_name: displayName,
        primary_goals: goals,
        outcome_preference_scores: {
          'energy': energyScore,
          'sleep_quality': sleepScore
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
                <span className="text-white">{energyScore}/10</span>
              </label>
              <input 
                type="range" min="0" max="10" 
                value={energyScore} onChange={(e) => setEnergyScore(parseInt(e.target.value))}
                className="w-full accent-levl-accent"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-levl-text-secondary flex justify-between">
                <span>Sleep Quality</span>
                <span className="text-white">{sleepScore}/10</span>
              </label>
              <input 
                type="range" min="0" max="10" 
                value={sleepScore} onChange={(e) => setSleepScore(parseInt(e.target.value))}
                className="w-full accent-levl-accent"
              />
            </div>

            <div className="flex space-x-2 mt-8">
              <button 
                onClick={() => setStep(2)}
                className="w-1/3 bg-transparent border border-levl-border text-white font-medium py-3 rounded-lg"
              >
                Back
              </button>
              <button 
                onClick={handleComplete}
                disabled={isSubmitting}
                className="w-2/3 bg-levl-accent text-white font-medium py-3 rounded-lg disabled:opacity-50 flex justify-center"
              >
                {isSubmitting ? 'Saving...' : 'Finish'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
