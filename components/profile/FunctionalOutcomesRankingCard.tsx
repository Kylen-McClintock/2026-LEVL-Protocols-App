'use client'

import React, { useState, useEffect } from 'react'
import { UserProfile, OutcomeDimension } from '@/lib/types'
import { updateUserProfile } from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { 
  Activity, Check, X, Plus, ChevronDown, ChevronUp, Sparkles, 
  Zap, Moon, Brain, Shield, Heart, Eye, Gauge, Flame, Dumbbell 
} from 'lucide-react'

// Helper to assign vibrant icons and colors to known outcome dimensions
function getOutcomeVisual(id: string) {
  const norm = id.toLowerCase()
  if (norm.includes('sleep') || norm.includes('restedness')) {
    return { icon: <Moon size={16} className="text-indigo-400" />, color: 'text-indigo-400', barGradient: 'from-indigo-500 to-purple-500' }
  }
  if (norm.includes('energy') || norm.includes('alertness') || norm.includes('motivation')) {
    return { icon: <Zap size={16} className="text-amber-400" />, color: 'text-amber-400', barGradient: 'from-amber-500 to-orange-500' }
  }
  if (norm.includes('focus') || norm.includes('clarity') || norm.includes('memory') || norm.includes('brain_fog')) {
    return { icon: <Brain size={16} className="text-sky-400" />, color: 'text-sky-400', barGradient: 'from-sky-500 to-cyan-400' }
  }
  if (norm.includes('strength') || norm.includes('endurance')) {
    return { icon: <Dumbbell size={16} className="text-rose-400" />, color: 'text-rose-400', barGradient: 'from-rose-500 to-red-500' }
  }
  if (norm.includes('stress') || norm.includes('calmness') || norm.includes('resilience')) {
    return { icon: <Heart size={16} className="text-emerald-400" />, color: 'text-emerald-400', barGradient: 'from-emerald-500 to-teal-400' }
  }
  if (norm.includes('immune') || norm.includes('pain') || norm.includes('soreness') || norm.includes('joint')) {
    return { icon: <Shield size={16} className="text-purple-400" />, color: 'text-purple-400', barGradient: 'from-purple-500 to-indigo-500' }
  }
  return { icon: <Activity size={16} className="text-cyan-400" />, color: 'text-cyan-400', barGradient: 'from-cyan-500 to-blue-500' }
}

function getPriorityLabel(val: number) {
  if (val >= 9) return { label: 'Top Priority', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' }
  if (val >= 7) return { label: 'High Focus', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' }
  if (val >= 4) return { label: 'Moderate', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40' }
  return { label: 'Low Weight', bg: 'bg-slate-700/40 text-slate-400 border-slate-600/40' }
}

export default function FunctionalOutcomesRankingCard({
  profile,
  outcomes = [],
  onUpdated
}: {
  profile: UserProfile
  outcomes: OutcomeDimension[]
  onUpdated?: (updated: UserProfile) => void
}) {
  const [isOpen, setIsOpen] = useState(true)
  const [preferences, setPreferences] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selectedToAdd, setSelectedToAdd] = useState('')

  useEffect(() => {
    if (profile?.outcome_preference_scores) {
      // Filter out negative risk keys (which start with negative_ or neg_)
      const cleanPref: Record<string, number> = {}
      Object.entries(profile.outcome_preference_scores).forEach(([k, v]) => {
        if (!k.startsWith('negative_') && !k.startsWith('neg_') && typeof v === 'number') {
          cleanPref[k] = v
        }
      })
      setPreferences(cleanPref)
    }
  }, [profile])

  const handleUpdateScore = async (id: string, newScore: number) => {
    const updated = { ...preferences, [id]: newScore }
    setPreferences(updated)
    await persistPreferences(updated)
  }

  const handleRemove = async (id: string) => {
    const updated = { ...preferences }
    delete updated[id]
    setPreferences(updated)
    await persistPreferences(updated)
  }

  const handleAddOutcome = async (id: string) => {
    if (!id || preferences[id] !== undefined) return
    const updated = { ...preferences, [id]: 7 } // Default to 7/10
    setPreferences(updated)
    setSelectedToAdd('')
    await persistPreferences(updated)
  }

  const persistPreferences = async (newPref: Record<string, number>) => {
    setSaving(true)
    try {
      const localUserId = getLocalUserId()
      // Preserve existing negative risk factors in the same JSON column
      const existingScores = profile.outcome_preference_scores || {}
      const combined = { ...existingScores, ...newPref }
      
      // Remove any keys that were deleted from clean preferences
      Object.keys(existingScores).forEach(k => {
        if (!k.startsWith('negative_') && !k.startsWith('neg_') && newPref[k] === undefined) {
          delete combined[k]
        }
      })

      const res = await updateUserProfile(localUserId, {
        outcome_preference_scores: combined
      })

      if (res && onUpdated) {
        onUpdated(res)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (err) {
      console.error('Error saving outcome preferences:', err)
    } finally {
      setSaving(false)
    }
  }

  const trackedOutcomeIds = Object.keys(preferences)
  const availableOutcomes = outcomes.filter(o => !trackedOutcomeIds.includes(o.id))

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-purple-500/30 shadow-xl space-y-4 backdrop-blur-md">
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 shadow-sm">
            <Activity size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Functional Outcome Priorities &amp; Ranking
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                {trackedOutcomeIds.length} Tracked
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              Rank the importance (1–10) of each outcome for personalized protocol recommendations &amp; ROI analysis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saving && <span className="text-[10px] text-purple-400 animate-pulse font-mono font-bold">Saving...</span>}
          {saved && <span className="text-[10px] text-emerald-400 font-mono font-bold">✓ Saved</span>}
          <button type="button" className="text-slate-400 hover:text-white p-1">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="space-y-4 pt-3 border-t border-white/5 animate-in fade-in duration-200">
          {/* Active Outcome Sliders */}
          <div className="space-y-3">
            {trackedOutcomeIds.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-slate-400">
                You have no functional outcomes selected. Add outcomes below to calibrate your protocol engine.
              </div>
            ) : (
              trackedOutcomeIds.map((id) => {
                const outcomeObj = outcomes.find(o => o.id === id)
                const name = outcomeObj ? outcomeObj.name : id.replace(/_/g, ' ')
                const score = preferences[id] || 5
                const visual = getOutcomeVisual(id)
                const priority = getPriorityLabel(score)

                return (
                  <div 
                    key={id} 
                    className="p-3.5 rounded-2xl bg-black/50 border border-white/10 hover:border-white/20 transition-all space-y-2.5 shadow-sm group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          {visual.icon}
                        </div>
                        <span className="text-xs font-bold text-white truncate">
                          {name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${priority.bg}`}>
                          {priority.label} ({score}/10)
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemove(id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Remove outcome from tracking"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Gradient Progress & Slider */}
                    <div className="space-y-1.5 pt-0.5">
                      <div className="relative w-full flex items-center">
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={score}
                          onChange={(e) => handleUpdateScore(id, parseInt(e.target.value, 10))}
                          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase font-mono tracking-wider">
                        <span>1 (Low)</span>
                        <span>5 (Balanced)</span>
                        <span>10 (Crucial)</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Add More Outcomes Selector */}
          {availableOutcomes.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
              <div className="flex-1">
                <select
                  value={selectedToAdd}
                  onChange={(e) => setSelectedToAdd(e.target.value)}
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="">-- Add another outcome to rank --</option>
                  {availableOutcomes.map((o) => (
                    <option key={o.id} value={o.id}>
                      + {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                disabled={!selectedToAdd}
                onClick={() => handleAddOutcome(selectedToAdd)}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all shadow flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus size={14} />
                <span>Add</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
