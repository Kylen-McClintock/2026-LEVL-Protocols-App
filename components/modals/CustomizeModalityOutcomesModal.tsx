'use client'

import { useState, useMemo } from 'react'
import { Modality, OutcomeDimension, UserProfile } from '@/lib/types'
import { X, Check, Sliders, Star } from 'lucide-react'

type CustomizeModalityOutcomesModalProps = {
  isOpen: boolean
  onClose: () => void
  modality?: Modality | null
  allOutcomes: OutcomeDimension[]
  currentOutcomeIds: string[]
  userProfile?: UserProfile | null
  onSaveOutcomes: (modalityId: string, selectedOutcomeIds: string[]) => void
}

export default function CustomizeModalityOutcomesModal({
  isOpen,
  onClose,
  modality,
  allOutcomes,
  currentOutcomeIds,
  userProfile,
  onSaveOutcomes
}: CustomizeModalityOutcomesModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(currentOutcomeIds)

  // Identify user-defined priority goals from profile
  const userPriorityMap = useMemo(() => {
    const map = new Map<string, { isPriority: boolean; label: string; score: number }>()
    if (!userProfile) return map

    const prefs = userProfile.outcome_preference_scores || {}
    const goals = (userProfile.primary_goals || []).map(g => g.toLowerCase())

    allOutcomes.forEach(o => {
      const nameLower = o.name.toLowerCase()
      const score = prefs[o.id] ?? prefs[nameLower] ?? 0
      const matchesGoal = goals.some(g => nameLower.includes(g) || g.includes(nameLower))

      if (score >= 8 || matchesGoal) {
        map.set(o.id, {
          isPriority: true,
          label: score >= 9 ? '⭐ Top User Focus' : '⭐ User Goal',
          score: Math.max(score, matchesGoal ? 8 : 0)
        })
      }
    })
    return map
  }, [allOutcomes, userProfile])

  // STABLE DISPLAY ORDER:
  // Sort list by user priorities, then alphabetical.
  // DO NOT sort by selectedIds in real time so clicking an item toggles its state in place without the UI jumping.
  const sortedOutcomes = useMemo(() => {
    return [...allOutcomes].sort((a, b) => {
      const aP = userPriorityMap.get(a.id)?.score || 0
      const bP = userPriorityMap.get(b.id)?.score || 0
      if (aP !== bP) return bP - aP

      return a.name.localeCompare(b.name)
    })
  }, [allOutcomes, userPriorityMap])

  if (!isOpen) return null

  const toggleOutcome = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleSave = () => {
    onSaveOutcomes(modality?.id || 'protocol_group', selectedIds)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-levl-bg border border-levl-border w-full max-w-xl rounded-2xl p-4 sm:p-6 shadow-2xl relative space-y-4 max-h-[85vh] flex flex-col my-auto">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-levl-text-secondary hover:text-white p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors z-10"
        >
          <X size={18} />
        </button>

        <div className="pr-8 shrink-0">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sliders size={15} /> Customize Tracked Outcomes
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
            {modality?.display_name || modality?.name || 'Protocol Stack Outcomes'}
          </h2>
          <p className="text-[11px] text-gray-400 mt-1">
            Toggle bio-signals to track for this modality. Items with a <span className="text-emerald-400 font-bold">green checkmark</span> are active.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2 no-scrollbar min-h-0">
          <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">
            <span>Outcome Library</span>
            <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
              {selectedIds.length} active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {sortedOutcomes.map(outcome => {
              const isSelected = selectedIds.includes(outcome.id)
              const isLowerBetter = outcome.directionality === 'lower_is_better'
              const userPriority = userPriorityMap.get(outcome.id)

              return (
                <button
                  key={outcome.id}
                  type="button"
                  onClick={() => toggleOutcome(outcome.id)}
                  className={`p-2.5 sm:p-3.5 rounded-xl border text-left transition-all flex items-start justify-between gap-1.5 relative ${
                    isSelected 
                      ? 'bg-emerald-950/30 border-emerald-500/60 text-white shadow-sm shadow-emerald-500/20' 
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-bold text-xs text-white leading-tight block truncate">{outcome.name}</span>
                      {userPriority && (
                        <span className="text-[8px] sm:text-[9px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                          <Star size={8} fill="currentColor" /> Goal
                        </span>
                      )}
                    </div>

                    <span className="text-[9px] sm:text-[10px] opacity-70 block leading-tight">
                      Scale: 0-10 ({isLowerBetter ? '0 = Best' : '10 = Best'})
                    </span>
                  </div>

                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                    isSelected 
                      ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                      : 'border-white/20 bg-black/30 text-transparent'
                  }`}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-white/10 flex items-center gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-900/30"
          >
            Save Tracked Outcomes
          </button>
        </div>
      </div>
    </div>
  )
}
