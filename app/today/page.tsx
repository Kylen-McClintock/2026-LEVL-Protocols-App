'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { getOrCreateUserProfile, getDailySessions, createDailySession, completeDailySession, skipDailySession, saveDailyWellbeingCheckin, getOutcomeDimensions } from '@/lib/data'
import { DailySession, Modality, OutcomeDimension } from '@/lib/types'
import ModalityCard from '@/components/cards/ModalityCard'
import DailyWellbeingCheckin from '@/components/score/DailyWellbeingCheckin'
import OutcomeSliderOverlay from '@/components/sliders/OutcomeSliderOverlay'
import { getSlidersForSession } from '@/lib/outcomes/getSlidersForSession'

export default function TodayPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<DailySession[]>([])
  const [allOutcomes, setAllOutcomes] = useState<OutcomeDimension[]>([])
  const [loading, setLoading] = useState(true)
  
  // Slider state
  const [activeModality, setActiveModality] = useState<Modality | null>(null)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [relevantOutcomes, setRelevantOutcomes] = useState<OutcomeDimension[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const localUserId = getLocalUserId()
        const profile = await getOrCreateUserProfile(localUserId)
        if (!profile || !profile.display_name) {
          router.push('/onboarding')
          return
        }

        const dateStr = new Date().toISOString().split('T')[0]
        let currentSessions = await getDailySessions(localUserId, dateStr)

        if (currentSessions.length === 0) {
          // Generate a default stack for MVP demo
          await createDailySession(localUserId, dateStr, 'morning_light', 'waking')
          await createDailySession(localUserId, dateStr, 'protein_first', 'morning')
          await createDailySession(localUserId, dateStr, 'resistance_training', 'midday')
          await createDailySession(localUserId, dateStr, 'blue_light_reduction', 'evening')
          
          currentSessions = await getDailySessions(localUserId, dateStr)
        }

        setSessions(currentSessions)

        const outcomes = await getOutcomeDimensions()
        setAllOutcomes(outcomes)

      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [router])

  const handleComplete = async (id: string) => {
    await completeDailySession(id)
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'completed' } : s))
  }

  const handleSkip = async (id: string) => {
    await skipDailySession(id)
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'skipped' } : s))
  }

  const handleWellbeingSave = async (mood: number, energy: number, stress: number) => {
    const localUserId = getLocalUserId()
    const dateStr = new Date().toISOString().split('T')[0]
    await saveDailyWellbeingCheckin(localUserId, dateStr, mood, energy, stress)
  }

  const openTracker = (modality: Modality, sessionId: string) => {
    const { primary } = getSlidersForSession(modality, allOutcomes)
    // If no mapped outcomes, maybe fallback to some generic ones or just don't show.
    // For MVP, we'll just show the mapped ones.
    setRelevantOutcomes(primary.length > 0 ? primary : allOutcomes.slice(0, 2))
    setActiveModality(modality)
    setActiveSessionId(sessionId)
  }

  const closeTracker = () => {
    setActiveModality(null)
    setActiveSessionId(null)
  }

  const saveTrackerObservations = async (values: Record<string, number>) => {
    console.log('Saving observations for session', activeSessionId, values)
    // Here we would call saveOutcomeObservation for each value
    closeTracker()
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center animate-pulse text-levl-text-secondary">Loading your stack...</div>
  }

  return (
    <div className="p-4 max-w-md mx-auto pt-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Today</h1>
        <p className="text-levl-text-secondary text-sm">Your longevity stack.</p>
      </header>

      <DailyWellbeingCheckin onSave={handleWellbeingSave} />

      <div className="space-y-4">
        {sessions.map(session => (
          <ModalityCard 
            key={session.id} 
            session={session} 
            onComplete={handleComplete} 
            onSkip={handleSkip} 
            onTrackOutcomes={openTracker}
          />
        ))}
      </div>

      {activeModality && (
        <OutcomeSliderOverlay 
          outcomes={relevantOutcomes} 
          onSave={saveTrackerObservations} 
          onClose={closeTracker} 
        />
      )}
    </div>
  )
}
