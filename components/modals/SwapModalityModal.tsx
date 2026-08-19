'use client'

import { useState, useEffect } from 'react'
import { Modality, UserProfile } from '@/lib/types'
import { X, RefreshCw, AlertTriangle, Activity, ArrowRight, BookmarkPlus, Trash2, CheckCircle2 } from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { getModalities, getOrCreateUserProfile, removeFromBench, createDailyTask, removeModalityEntirely, saveModalityOverride, addToBench } from '@/lib/data'
import { getSwapAlternatives } from '@/lib/ranking/nextBestAction'
import ExploreCard from '../cards/ExploreCard'

type SwapModalityModalProps = {
  isOpen: boolean
  onClose: () => void
  failingModality: Modality | null
  targetOutcome: string
  activeModalityIds: Set<string>
  onSwapComplete: () => void
}

export default function SwapModalityModal({ isOpen, onClose, failingModality, targetOutcome, activeModalityIds, onSwapComplete }: SwapModalityModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [alternatives, setAlternatives] = useState<Modality[]>([])
  const [loading, setLoading] = useState(true)

  const [step, setStep] = useState<'recommendation' | 'disposition' | 'capture_reason'>('recommendation')
  const [dispositionChoice, setDispositionChoice] = useState<'keep' | 'bench' | 'remove' | null>(null)
  const [reasonText, setReasonText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen || !failingModality) return

    async function load() {
      setLoading(true)
      const localUserId = getLocalUserId()
      const [fetchedProfile, allModalities] = await Promise.all([
        getOrCreateUserProfile(localUserId),
        getModalities()
      ])
      
      setProfile(fetchedProfile)

      const results = getSwapAlternatives(
        failingModality!,
        targetOutcome,
        allModalities,
        activeModalityIds,
        fetchedProfile,
        true // enforce lower effort
      )
      
      setAlternatives(results)
      setLoading(false)
    }
    load()
  }, [isOpen, failingModality, targetOutcome, activeModalityIds])

  if (!isOpen || !failingModality) return null

  const handleRecommendationAdded = () => {
    setStep('disposition')
  }

  const handleDispositionChoice = async (choice: 'keep' | 'bench' | 'remove') => {
    const localUserId = getLocalUserId()
    setDispositionChoice(choice)

    if (choice === 'keep') {
      // They decided to do both. We are done.
      onSwapComplete()
      onClose()
    } else {
      // Need to capture reason for bench/remove
      setStep('capture_reason')
    }
  }

  const handleFinalSubmit = async () => {
    if (!dispositionChoice) return
    setIsSubmitting(true)
    const localUserId = getLocalUserId()

    try {
      if (dispositionChoice === 'remove') {
        await removeModalityEntirely(localUserId, failingModality.id)
        if (reasonText.trim()) {
          await saveModalityOverride(localUserId, failingModality.id, 'eliminated', { reason: reasonText }, 100)
        }
      } else if (dispositionChoice === 'bench') {
        // Remove from future schedule, add to bench
        await removeModalityEntirely(localUserId, failingModality.id)
        await addToBench(localUserId, failingModality.id)
        if (reasonText.trim()) {
          await saveModalityOverride(localUserId, failingModality.id, 'benched', { reason: reasonText }, 100)
        }
      }

      onSwapComplete()
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  const topAlternative = alternatives.length > 0 ? alternatives[0] : null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[#111111] border border-levl-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-levl-border flex justify-between items-center bg-levl-surface">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <RefreshCw className="text-levl-accent" size={20} />
            Friction Swap Engine
          </h2>
          <button onClick={onClose} className="text-levl-text-secondary hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {step === 'recommendation' && (
            <>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <h3 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-2">
                  <Activity size={16} /> Failing Habit: {failingModality.display_name || failingModality.name}
                </h3>
                <p className="text-xs text-red-200/80">
                  Your adherence for this modality is low, likely due to its <strong>{failingModality.effort_level?.replace('_', ' ') || 'high'}</strong> effort level. It is a sunk cost for your {targetOutcome} goals. Let's swap it for something more realistic.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white mb-3">#1 Recommended Alternative</h3>
                {loading ? (
                  <div className="animate-pulse bg-white/5 h-40 rounded-xl border border-white/10" />
                ) : topAlternative ? (
                  <div className="relative">
                    <ExploreCard 
                      modality={topAlternative}
                      userProfile={profile}
                      onAddToBench={async (id) => {
                        handleRecommendationAdded()
                      }}
                      onAddToToday={async (id) => {
                        handleRecommendationAdded()
                      }}
                    />
                    <div className="absolute -top-3 -right-3 bg-levl-accent text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-lg border border-white/20">
                      Lower Effort
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-sm text-gray-400">No lower-effort alternatives found for {targetOutcome}.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {step === 'disposition' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="text-center space-y-2">
                <div className="h-12 w-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Alternative Scheduled!</h3>
                <p className="text-sm text-levl-text-secondary">What would you like to do with <strong>{failingModality.display_name || failingModality.name}</strong>?</p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => handleDispositionChoice('keep')}
                  className="w-full flex items-center p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-left"
                >
                  <Activity className="text-gray-400 mr-4 shrink-0" size={20} />
                  <div>
                    <div className="font-bold text-white text-sm">Keep Existing Modality</div>
                    <div className="text-xs text-gray-400">Keep it on my active protocol (I'll do both)</div>
                  </div>
                </button>

                <button 
                  onClick={() => handleDispositionChoice('bench')}
                  className="w-full flex items-center p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-left"
                >
                  <BookmarkPlus className="text-blue-400 mr-4 shrink-0" size={20} />
                  <div>
                    <div className="font-bold text-white text-sm">Move to Bench</div>
                    <div className="text-xs text-gray-400">Save it for later when I have more bandwidth</div>
                  </div>
                </button>

                <button 
                  onClick={() => handleDispositionChoice('remove')}
                  className="w-full flex items-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors text-left"
                >
                  <Trash2 className="text-red-400 mr-4 shrink-0" size={20} />
                  <div>
                    <div className="font-bold text-red-300 text-sm">Remove Entirely</div>
                    <div className="text-xs text-red-200/70">Delete it completely from my schedule</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 'capture_reason' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity size={20} className="text-levl-accent" /> Why did you skip?
                </h3>
                <p className="text-sm text-levl-text-secondary leading-relaxed">
                  Briefly tell us why <strong>{failingModality.display_name || failingModality.name}</strong> didn't work for you. We use this feedback to better understand your preferences and continuously improve your personalized recommendations.
                </p>
              </div>

              <textarea 
                value={reasonText}
                onChange={e => setReasonText(e.target.value)}
                placeholder="e.g. Tasted awful, took too long, upset my stomach..."
                className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-levl-accent/50 resize-none"
              />

              <button 
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="w-full py-3 bg-levl-accent text-white rounded-xl font-bold hover:bg-levl-accent/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Complete Swap'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
