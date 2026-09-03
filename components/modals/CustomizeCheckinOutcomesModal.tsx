'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { OutcomeDimension, UserProfile } from '@/lib/types'
import { X, Check, Sliders, Sparkles, Sun, Moon, Search, Star } from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { updateUserProfile } from '@/lib/data'

type CustomizeCheckinOutcomesModalProps = {
  isOpen: boolean
  onClose: () => void
  title?: string
  mode?: 'morning' | 'anytime' | 'nightly'
  allOutcomes: OutcomeDimension[]
  userProfile?: UserProfile | null
  onOutcomesUpdated?: (updatedPreferences?: Record<string, any>, updatedProfile?: UserProfile | null) => void
}

const RECOMMENDED_IDS = ['mood', 'energy', 'stress', 'sleep_quality', 'subjective_sleep', 'waking_restedness', 'sleep_latency', 'alertness', 'calmness', 'soreness', 'pain']
const RECOMMENDED_ANYTIME_IDS = ['mood', 'energy', 'stress', 'focus', 'mental_clarity', 'brain_fog', 'satiety', 'motivation', 'physical_fatigue', 'productivity', 'digestive_comfort', 'emotional_resilience']

export const CHECKIN_EXPOSURES_METADATA = [
  { id: 'alcohol_drinks', name: 'Alcohol Intake', icon: '🍷', description: 'Tracks standard drinks and sleep architecture impact' },
  { id: 'nicotine_exposure', name: 'Nicotine & Smoking', icon: '🚬', description: 'Combustible tobacco, vapes, and nicotine pouches' },
  { id: 'cannabis_exposure', name: 'Cannabis & THC', icon: '🌿', description: 'Inhaled flower/vape, edibles, and tinctures' },
  { id: 'late_caffeine', name: 'Last Caffeine Timing', icon: '☕', description: 'Exact time or hours before bed (10-12h clearance)' },
  { id: 'sitting_duration', name: 'Prolonged Sitting', icon: '🪑', description: 'Daily sedentary work & desk duration' },
  { id: 'blue_light', name: 'Last Screen / Blue Light', icon: '📱', description: 'Exact time or hours before bed (melatonin preservation)' },
  { id: 'processed_sugar', name: 'Ultra-Processed Foods', icon: '🍕', description: 'High-glycemic load and refined seed oil foods' },
  { id: 'late_meal', name: 'Last Meal Timing', icon: '🍟', description: 'Exact time or hours before bed (digestion & resting HR drop)' },
]

export default function CustomizeCheckinOutcomesModal({
  isOpen,
  onClose,
  title = "Edit Tracked Outcomes",
  mode = 'morning',
  allOutcomes,
  userProfile,
  onOutcomesUpdated
}: CustomizeCheckinOutcomesModalProps) {
  const [activeTab, setActiveTab] = useState<'morning' | 'anytime' | 'nightly'>(mode)
  const [preferences, setPreferences] = useState<Record<string, any>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (mode) setActiveTab(mode)
  }, [mode, isOpen])

  useEffect(() => {
    if (userProfile?.outcome_preference_scores && Object.keys(userProfile.outcome_preference_scores).length > 0) {
      setPreferences({ ...userProfile.outcome_preference_scores })
    } else {
      const init: Record<string, number> = {}
      allOutcomes.forEach(o => {
        if (o.is_default_wellbeing || RECOMMENDED_IDS.includes(o.id)) {
          init[`morning:${o.id}`] = 10
          init[`nightly:${o.id}`] = 10
        }
        if (RECOMMENDED_ANYTIME_IDS.includes(o.id) || ['mood', 'energy', 'stress', 'focus'].includes(o.id)) {
          init[`anytime:${o.id}`] = 10
        }
      })
      CHECKIN_EXPOSURES_METADATA.forEach(e => {
        init[`exposure:${e.id}`] = 10
      })
      setPreferences(init)
    }
  }, [userProfile, allOutcomes, isOpen])

  const getKey = (id: string, tab: 'morning' | 'anytime' | 'nightly') => `${tab}:${id}`

  const isTracked = (id: string, tab: 'morning' | 'anytime' | 'nightly') => {
    const key = getKey(id, tab)
    const val = preferences[key]
    if (val !== undefined) {
      return val >= 7
    }
    // Tab-specific default fallbacks
    if (tab === 'anytime') {
      if (userProfile?.anytime_checkin_dimensions && userProfile.anytime_checkin_dimensions.length > 0) {
        return userProfile.anytime_checkin_dimensions.includes(id)
      }
      return ['mood', 'energy', 'stress', 'focus'].includes(id)
    }
    if (tab === 'morning') {
      if (userProfile?.morning_checkin_dimensions && userProfile.morning_checkin_dimensions.length > 0) {
        return userProfile.morning_checkin_dimensions.includes(id)
      }
      return ['mood', 'energy', 'stress', 'sleep_quality', 'subjective_sleep'].includes(id)
    }
    if (tab === 'nightly') {
      if (userProfile?.evening_checkin_dimensions && userProfile.evening_checkin_dimensions.length > 0) {
        return userProfile.evening_checkin_dimensions.includes(id)
      }
      return ['mood', 'energy', 'stress', 'sleep_quality', 'subjective_sleep', 'digestive_comfort'].includes(id)
    }
    return false
  }

  const toggleOutcomeTracked = (id: string) => {
    const key = getKey(id, activeTab)
    const currentlyTracked = isTracked(id, activeTab)
    const newScore = currentlyTracked ? 0 : 9
    setPreferences(prev => ({ ...prev, [key]: newScore }))
  }

  const isExposureTracked = (id: string) => {
    const key = `exposure:${id}`
    const val = preferences[key]
    if (val === undefined) return true
    return val >= 7
  }

  const toggleExposureTracked = (id: string) => {
    const key = `exposure:${id}`
    setPreferences(prev => {
      const currentlyTracked = isExposureTracked(id)
      return { ...prev, [key]: currentlyTracked ? 0 : 9 }
    })
  }

  // Split into Recommended and Additional
  const recommendedOutcomes = useMemo(() => {
    if (activeTab === 'anytime') {
      return allOutcomes.filter(o => o.is_default_wellbeing || RECOMMENDED_ANYTIME_IDS.includes(o.id))
    }
    return allOutcomes.filter(o => o.is_default_wellbeing || RECOMMENDED_IDS.includes(o.id))
  }, [allOutcomes, activeTab])

  const additionalOutcomes = useMemo(() => {
    if (activeTab === 'anytime') {
      return allOutcomes.filter(o => !o.is_default_wellbeing && !RECOMMENDED_ANYTIME_IDS.includes(o.id))
    }
    return allOutcomes.filter(o => !o.is_default_wellbeing && !RECOMMENDED_IDS.includes(o.id))
  }, [allOutcomes, activeTab])

  // Count active outcomes per tab
  const morningActiveCount = useMemo(() => {
    return allOutcomes.filter(o => isTracked(o.id, 'morning')).length
  }, [allOutcomes, preferences])

  const anytimeActiveCount = useMemo(() => {
    return allOutcomes.filter(o => isTracked(o.id, 'anytime')).length
  }, [allOutcomes, preferences])

  const nightlyActiveCount = useMemo(() => {
    return allOutcomes.filter(o => isTracked(o.id, 'nightly')).length
  }, [allOutcomes, preferences])

  // Filtered Additional Outcomes - STABLE DISPLAY ORDER (do not dynamically sort by isTracked)
  const filteredAdditionalOutcomes = useMemo(() => {
    return additionalOutcomes.filter(o => {
      const matchesSearch = 
        !searchQuery || 
        o.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (o.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = selectedCategory === 'all' || o.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [additionalOutcomes, searchQuery, selectedCategory])

  const filteredRecommendedOutcomes = useMemo(() => {
    return recommendedOutcomes.filter(o => {
      return !searchQuery || 
        o.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (o.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [recommendedOutcomes, searchQuery])

  const categories = useMemo(() => {
    const cats = new Set<string>()
    allOutcomes.forEach(o => {
      if (o.category) cats.add(o.category)
    })
    return Array.from(cats).sort()
  }, [allOutcomes])

  if (!isOpen) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const localId = getLocalUserId()
      const anytimeIds = allOutcomes.filter(o => isTracked(o.id, 'anytime')).map(o => o.id)
      const morningIds = allOutcomes.filter(o => isTracked(o.id, 'morning')).map(o => o.id)
      const nightlyIds = allOutcomes.filter(o => isTracked(o.id, 'nightly')).map(o => o.id)

      const updated = await updateUserProfile(localId, { 
        outcome_preference_scores: preferences,
        anytime_checkin_dimensions: anytimeIds,
        morning_checkin_dimensions: morningIds,
        evening_checkin_dimensions: nightlyIds
      })
      if (onOutcomesUpdated) {
        onOutcomesUpdated(preferences, updated)
      }
      onClose()
    } catch (err) {
      console.error('Error saving tracked outcomes:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 pb-28 sm:pb-6 animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-xl rounded-3xl p-4 sm:p-6 shadow-2xl relative space-y-4 max-h-[82vh] sm:max-h-[88vh] flex flex-col my-auto">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-white p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors z-10 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="pr-8 shrink-0 border-b border-indigo-500/20 pb-3">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sliders size={15} /> Check-in Outcome Preferences
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
            {activeTab === 'anytime' 
              ? 'Customize Current State Bio-Signals' 
              : activeTab === 'morning' 
                ? 'Customize Morning Check-in Outcomes' 
                : 'Customize Nightly Check-in Outcomes'}
          </h2>
          <p className="text-[11px] text-gray-400 mt-1">
            {activeTab === 'anytime'
              ? 'Choose which bio-signals are tracked in your Current State 4-box live dashboard.'
              : activeTab === 'morning'
                ? 'Choose which baseline bio-signals are recorded during your Morning Check-in.'
                : 'Choose which bio-signals and nocturnal exposures are reviewed during your Nightly Check-in.'}
          </p>
        </div>

        {/* Morning / Anytime / Nightly Mode Tabs */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('morning')}
            className={`py-2 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'morning'
                ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/50 text-amber-200 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sun size={13} className={activeTab === 'morning' ? 'text-amber-400' : 'text-slate-500'} />
            <span className="truncate">Morning</span>
            <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {morningActiveCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('anytime')}
            className={`py-2 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'anytime'
                ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-400/50 text-purple-200 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles size={13} className={activeTab === 'anytime' ? 'text-purple-400' : 'text-slate-500'} />
            <span className="truncate">Anytime</span>
            <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {anytimeActiveCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('nightly')}
            className={`py-2 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'nightly'
                ? 'bg-gradient-to-r from-rose-500/20 to-purple-500/20 border border-rose-400/50 text-rose-200 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Moon size={13} className={activeTab === 'nightly' ? 'text-rose-400' : 'text-slate-500'} />
            <span className="truncate">Nightly</span>
            <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {nightlyActiveCount}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative shrink-0">
          <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'morning' ? 'Morning' : activeTab === 'anytime' ? 'Anytime' : 'Nightly'} bio-signals (e.g. Mood, Energy, Stress, Focus)...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
          />
        </div>

        {/* Scrollable Outcome List */}
        <div className="overflow-y-auto space-y-4 flex-1 pr-1 custom-scrollbar">

          {/* ⭐ RECOMMENDED BASELINE BIO-SIGNALS SECTION */}
          {filteredRecommendedOutcomes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-300 border-b border-amber-500/20 pb-1">
                <Star size={13} className="text-amber-400 fill-amber-400" />
                <span>Recommended Baseline Bio-Signals</span>
              </div>

              <div className="space-y-2">
                {filteredRecommendedOutcomes.map(outcome => {
                  const active = isTracked(outcome.id, activeTab)

                  return (
                    <div 
                      key={outcome.id}
                      onClick={() => toggleOutcomeTracked(outcome.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        active 
                          ? activeTab === 'morning'
                            ? 'bg-amber-950/40 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                            : activeTab === 'anytime'
                              ? 'bg-indigo-950/40 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                              : 'bg-rose-950/40 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-xl border ${
                          active 
                            ? activeTab === 'morning'
                              ? 'bg-amber-500 text-white border-amber-400' 
                              : activeTab === 'anytime'
                                ? 'bg-indigo-500 text-white border-indigo-400'
                                : 'bg-rose-500 text-white border-rose-400'
                            : 'bg-black/50 text-gray-500 border-white/10'
                        }`}>
                          {active ? <Check size={14} strokeWidth={3} /> : <div className="w-3.5 h-3.5" />}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-xs">{outcome.name}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Recommended
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {outcome.description || 'Core daily subjective bio-signal tracking'}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        active 
                          ? activeTab === 'morning'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                            : activeTab === 'anytime'
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-white/5 text-gray-500 border-white/10'
                      }`}>
                        {active ? 'Tracked' : 'Hidden'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 🌅 MORNING EXPERIENCE & DISPLAY PREFERENCES (ONLY FOR MORNING TAB) */}
          {activeTab === 'morning' && (
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-slate-900/60 p-3.5 rounded-2xl border border-amber-500/30 space-y-3 shadow-inner">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider border-b border-amber-500/20 pb-2">
                <Sun size={14} className="text-amber-400" /> Morning Experience &amp; Display Preferences
              </div>

              {/* Morning Mindfulness Display Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>🌅</span> Morning Mindfulness &amp; Presence
                </label>
                <p className="text-[10px] text-gray-400">
                  Choose how the morning reflection &amp; somatic presence prompt appears:
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { id: 'open', label: 'Open by Default', desc: 'Full reflection card visible' },
                    { id: 'collapsed', label: 'Collapsed by Default', desc: 'Expandable sunrise bar' },
                    { id: 'hidden', label: 'Don\'t Show', desc: 'Hidden from check-in' }
                  ].map(opt => {
                    const isSelected = (preferences['setting:morning_mindfulness_display'] || 'open') === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPreferences(prev => ({ ...prev, 'setting:morning_mindfulness_display': opt.id }))}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm'
                            : 'bg-black/40 border-white/10 hover:border-white/20 text-gray-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-[11px] text-white flex items-center justify-between">
                          <span>{opt.label}</span>
                          {isSelected && <Check size={12} className="text-amber-400" />}
                        </div>
                        <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">{opt.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Keep Last Night's Exposures Expanded Toggle */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>🚫</span> Keep Last Night's Exposures Expanded
                  </label>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Keep the exposures section (THC, caffeine timing, etc.) expanded under sleep tracking at all times.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreferences(prev => ({
                    ...prev,
                    'setting:morning_always_expand_exposures': prev['setting:morning_always_expand_exposures'] === 1 ? 0 : 1
                  }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    preferences['setting:morning_always_expand_exposures'] === 1 ? 'bg-amber-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    preferences['setting:morning_always_expand_exposures'] === 1 ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          )}

          {/* 🚫 LIFESTYLE & NEGATIVE EXPOSURES TO TRACK (NIGHTLY & MORNING CHECK-INS) */}
          {(activeTab === 'nightly' || activeTab === 'morning') && (
            <div className="space-y-2">
              <div className={`flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider border-b pb-1 ${
                activeTab === 'morning' ? 'text-amber-300 border-amber-500/20' : 'text-rose-300 border-rose-500/20'
              }`}>
                <span className="flex items-center gap-1.5">
                  <span>🚫</span>
                  <span>{activeTab === 'morning' ? "Last Night's Exposures to Track" : "Check-in Exposures & Lifestyle Factors"}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({CHECKIN_EXPOSURES_METADATA.filter(e => isExposureTracked(e.id)).length} Active)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CHECKIN_EXPOSURES_METADATA.map(exp => {
                  const active = isExposureTracked(exp.id)

                  return (
                    <div
                      key={exp.id}
                      onClick={() => toggleExposureTracked(exp.id)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        active
                          ? activeTab === 'morning'
                            ? 'bg-amber-950/30 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                            : 'bg-rose-950/30 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className={`p-1.5 rounded-xl border shrink-0 ${
                          active
                            ? activeTab === 'morning' ? 'bg-amber-500 text-black border-amber-400' : 'bg-rose-500 text-white border-rose-400'
                            : 'bg-black/50 text-gray-500 border-white/10'
                        }`}>
                          {active ? <Check size={12} strokeWidth={3} /> : <div className="w-3 h-3" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">{exp.icon}</span>
                            <span className="font-bold text-white text-xs truncate">{exp.name}</span>
                          </div>
                          <p className="text-[9px] text-gray-400 truncate">{exp.description}</p>
                        </div>
                      </div>

                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ml-1 ${
                        active
                          ? activeTab === 'morning'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-white/5 text-gray-500 border-white/10'
                      }`}>
                        {active ? 'Tracked' : 'Hidden'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ⚡ ADDITIONAL BIO-SIGNALS & GOALS SECTION */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-indigo-300 border-b border-indigo-500/20 pb-1">
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-indigo-400" />
                <span>Additional Bio-Signals & Goals</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                ({filteredAdditionalOutcomes.length} Available)
              </span>
            </div>

            {filteredAdditionalOutcomes.length > 0 ? (
              <div className="space-y-2">
                {filteredAdditionalOutcomes.map(outcome => {
                  const active = isTracked(outcome.id, activeTab)

                  return (
                    <div 
                      key={outcome.id}
                      onClick={() => toggleOutcomeTracked(outcome.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        active 
                          ? activeTab === 'morning'
                            ? 'bg-amber-950/30 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]' 
                            : activeTab === 'anytime'
                              ? 'bg-indigo-950/30 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                              : 'bg-rose-950/30 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-xl border ${
                          active 
                            ? activeTab === 'morning'
                              ? 'bg-amber-500 text-white border-amber-400' 
                              : activeTab === 'anytime'
                                ? 'bg-indigo-500 text-white border-indigo-400'
                                : 'bg-rose-500 text-white border-rose-400'
                            : 'bg-black/50 text-gray-500 border-white/10'
                        }`}>
                          {active ? <Check size={14} strokeWidth={3} /> : <div className="w-3.5 h-3.5" />}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-xs">{outcome.name}</span>
                            {outcome.category && (
                              <span className="text-[9px] text-slate-400 font-mono">({outcome.category})</span>
                            )}
                          </div>
                          {outcome.description && (
                            <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{outcome.description}</p>
                          )}
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        active 
                          ? activeTab === 'morning'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                            : activeTab === 'anytime'
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-white/5 text-gray-500 border-white/10'
                      }`}>
                        {active ? 'Tracked' : 'Hidden'}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-center text-xs text-slate-500 py-4 italic">
                No matching additional bio-signals found for "{searchQuery}".
              </p>
            )}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center gap-3 pt-3 border-t border-white/10 shrink-0 sticky bottom-0 bg-slate-900/95 backdrop-blur-md pb-1 z-10">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Saving Preferences...' : `Save ${activeTab === 'morning' ? 'Morning' : activeTab === 'anytime' ? 'Anytime' : 'Nightly'} Outcomes`}
          </button>
        </div>
      </div>
    </div>
  )
}
