'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { OutcomeDimension, UserProfile } from '@/lib/types'
import { X, Check, Sliders, Sparkles, Sun, Moon, Search, Star, Plus, Trash2 } from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { updateUserProfile, getStoredCustomOutcomes, saveStoredCustomOutcomes } from '@/lib/data'

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

  // Custom user-created outcomes state
  const [customOutcomes, setCustomOutcomes] = useState<OutcomeDimension[]>([])
  const [isCreatingCustom, setIsCreatingCustom] = useState(false)
  const [newOutcomeName, setNewOutcomeName] = useState('')
  const [newOutcomeDesc, setNewOutcomeDesc] = useState('')
  const [newOutcomeCategory, setNewOutcomeCategory] = useState('physical')
  const [newOutcomeDirectionality, setNewOutcomeDirectionality] = useState<'higher_is_better' | 'lower_is_better'>('higher_is_better')
  const [trackInMorning, setTrackInMorning] = useState(true)
  const [trackInAnytime, setTrackInAnytime] = useState(false)
  const [trackInNightly, setTrackInNightly] = useState(false)

  useEffect(() => {
    if (mode) setActiveTab(mode)
  }, [mode, isOpen])

  // Load custom outcomes from userProfile or localStorage
  useEffect(() => {
    let custom: OutcomeDimension[] = []
    if (userProfile?.outcome_preference_scores?.custom_user_outcomes && Array.isArray(userProfile.outcome_preference_scores.custom_user_outcomes)) {
      custom = userProfile.outcome_preference_scores.custom_user_outcomes
    } else {
      custom = getStoredCustomOutcomes()
    }
    setCustomOutcomes(custom)
  }, [userProfile, isOpen])

  // Merge provided allOutcomes with customOutcomes
  const allCombinedOutcomes = useMemo(() => {
    const map = new Map<string, OutcomeDimension>()
    allOutcomes.forEach(o => map.set(o.id, o))
    customOutcomes.forEach(co => map.set(co.id, co))
    return Array.from(map.values())
  }, [allOutcomes, customOutcomes])

  useEffect(() => {
    if (userProfile?.outcome_preference_scores && Object.keys(userProfile.outcome_preference_scores).length > 0) {
      setPreferences({ ...userProfile.outcome_preference_scores })
    } else {
      const init: Record<string, number> = {}
      allCombinedOutcomes.forEach(o => {
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
  }, [userProfile, allCombinedOutcomes, isOpen])

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

  // Create custom outcome handler
  const handleSaveNewCustomOutcome = () => {
    if (!newOutcomeName.trim()) return

    const slug = newOutcomeName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20)
    const newId = `custom_${slug}_${Date.now().toString().slice(-4)}`

    const newDim: OutcomeDimension = {
      id: newId,
      name: newOutcomeName.trim(),
      description: newOutcomeDesc.trim() || `User-created custom bio-signal tracking ${newOutcomeName.trim()}`,
      category: newOutcomeCategory,
      directionality: newOutcomeDirectionality,
      is_default_wellbeing: false,
      is_contextual: true,
      is_custom: true,
      created_at: new Date().toISOString()
    }

    const updatedCustom = [...customOutcomes, newDim]
    setCustomOutcomes(updatedCustom)
    saveStoredCustomOutcomes(updatedCustom)

    setPreferences(prev => ({
      ...prev,
      [`morning:${newId}`]: trackInMorning ? 10 : 0,
      [`anytime:${newId}`]: trackInAnytime ? 10 : 0,
      [`nightly:${newId}`]: trackInNightly ? 10 : 0,
      custom_user_outcomes: updatedCustom
    }))

    setIsCreatingCustom(false)
    setNewOutcomeName('')
    setNewOutcomeDesc('')
  }

  const handleDeleteCustomOutcome = (id: string) => {
    const updatedCustom = customOutcomes.filter(c => c.id !== id)
    setCustomOutcomes(updatedCustom)
    saveStoredCustomOutcomes(updatedCustom)
    setPreferences(prev => {
      const copy = { ...prev }
      delete copy[`morning:${id}`]
      delete copy[`anytime:${id}`]
      delete copy[`nightly:${id}`]
      copy.custom_user_outcomes = updatedCustom
      return copy
    })
  }

  // Filtered Custom Outcomes
  const filteredCustomOutcomes = useMemo(() => {
    return customOutcomes.filter(o => {
      const matchesSearch = 
        !searchQuery || 
        o.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (o.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = selectedCategory === 'all' || o.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [customOutcomes, searchQuery, selectedCategory])

  // Split into Recommended and Additional (excluding custom outcomes which have their own section)
  const recommendedOutcomes = useMemo(() => {
    if (activeTab === 'anytime') {
      return allCombinedOutcomes.filter(o => !o.is_custom && (o.is_default_wellbeing || RECOMMENDED_ANYTIME_IDS.includes(o.id)))
    }
    return allCombinedOutcomes.filter(o => !o.is_custom && (o.is_default_wellbeing || RECOMMENDED_IDS.includes(o.id)))
  }, [allCombinedOutcomes, activeTab])

  const additionalOutcomes = useMemo(() => {
    if (activeTab === 'anytime') {
      return allCombinedOutcomes.filter(o => !o.is_custom && !o.is_default_wellbeing && !RECOMMENDED_ANYTIME_IDS.includes(o.id))
    }
    return allCombinedOutcomes.filter(o => !o.is_custom && !o.is_default_wellbeing && !RECOMMENDED_IDS.includes(o.id))
  }, [allCombinedOutcomes, activeTab])

  // Count active outcomes per tab
  const morningActiveCount = useMemo(() => {
    return allCombinedOutcomes.filter(o => isTracked(o.id, 'morning')).length
  }, [allCombinedOutcomes, preferences])

  const anytimeActiveCount = useMemo(() => {
    return allCombinedOutcomes.filter(o => isTracked(o.id, 'anytime')).length
  }, [allCombinedOutcomes, preferences])

  const nightlyActiveCount = useMemo(() => {
    return allCombinedOutcomes.filter(o => isTracked(o.id, 'nightly')).length
  }, [allCombinedOutcomes, preferences])

  // Filtered Additional Outcomes - STABLE DISPLAY ORDER
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
    allCombinedOutcomes.forEach(o => {
      if (o.category) cats.add(o.category)
    })
    return Array.from(cats).sort()
  }, [allCombinedOutcomes])

  if (!isOpen) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const localId = getLocalUserId()
      const anytimeIds = allCombinedOutcomes.filter(o => isTracked(o.id, 'anytime')).map(o => o.id)
      const morningIds = allCombinedOutcomes.filter(o => isTracked(o.id, 'morning')).map(o => o.id)
      const nightlyIds = allCombinedOutcomes.filter(o => isTracked(o.id, 'nightly')).map(o => o.id)

      const updatedPrefs = {
        ...preferences,
        custom_user_outcomes: customOutcomes
      }

      const updated = await updateUserProfile(localId, { 
        outcome_preference_scores: updatedPrefs,
        anytime_checkin_dimensions: anytimeIds,
        morning_checkin_dimensions: morningIds,
        evening_checkin_dimensions: nightlyIds
      })
      saveStoredCustomOutcomes(customOutcomes)
      if (onOutcomesUpdated) {
        onOutcomesUpdated(updatedPrefs, updated)
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
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Sliders className="text-indigo-400 w-5 h-5" />
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
          </div>
          <p className="text-xs text-slate-400">
            Select which bio-signals and subjective outcomes to actively log for each phase of your daily protocol.
          </p>
        </div>

        {/* Phase Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-black/40 p-1 rounded-2xl border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('morning')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'morning'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sun size={14} className={activeTab === 'morning' ? 'text-amber-400' : 'text-gray-400'} />
            <span>Morning</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeTab === 'morning' ? 'bg-amber-500 text-black' : 'bg-white/10 text-gray-400'
            }`}>
              {morningActiveCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('anytime')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'anytime'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles size={14} className={activeTab === 'anytime' ? 'text-indigo-400' : 'text-gray-400'} />
            <span>Anytime</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeTab === 'anytime' ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-400'
            }`}>
              {anytimeActiveCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('nightly')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'nightly'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Moon size={14} className={activeTab === 'nightly' ? 'text-rose-400' : 'text-gray-400'} />
            <span>Nightly</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeTab === 'nightly' ? 'bg-rose-500 text-white' : 'bg-white/10 text-gray-400'
            }`}>
              {nightlyActiveCount}
            </span>
          </button>
        </div>

        {/* Search Bar & Create Custom Outcome Action */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'morning' ? 'Morning' : activeTab === 'anytime' ? 'Anytime' : 'Nightly'} bio-signals...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setIsCreatingCustom(!isCreatingCustom)
              setTrackInMorning(activeTab === 'morning')
              setTrackInAnytime(activeTab === 'anytime')
              setTrackInNightly(activeTab === 'nightly')
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shrink-0 ${
              isCreatingCustom
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30'
            }`}
          >
            <Plus size={14} />
            <span className="hidden sm:inline">{isCreatingCustom ? 'Close Creator' : 'Create Custom Outcome'}</span>
            <span className="sm:hidden">{isCreatingCustom ? 'Close' : 'Create'}</span>
          </button>
        </div>

        {/* 🌟 CREATE CUSTOM BIO-SIGNAL FORM */}
        {isCreatingCustom && (
          <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 p-4 rounded-2xl border border-indigo-500/40 space-y-3.5 shadow-xl animate-in fade-in shrink-0">
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                <Sparkles size={14} className="text-indigo-400" /> Create Custom Bio-Signal to Track
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingCustom(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Outcome Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-white block">
                  Outcome Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Caffeine Craving, Knee Pain, Flow State"
                  value={newOutcomeName}
                  onChange={(e) => setNewOutcomeName(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-white block">Category</label>
                <select
                  value={newOutcomeCategory}
                  onChange={(e) => setNewOutcomeCategory(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-400 cursor-pointer"
                >
                  <option value="physical">Physical &amp; Musculoskeletal</option>
                  <option value="cognitive">Cognitive &amp; Focus</option>
                  <option value="mood">Mood &amp; Emotional State</option>
                  <option value="recovery">Recovery &amp; Sleep</option>
                  <option value="digestion">Digestion &amp; Gut</option>
                  <option value="energy">Energy &amp; Vitality</option>
                  <option value="longevity">Longevity &amp; Cellular</option>
                </select>
              </div>
            </div>

            {/* Description (Optional) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-300 block">Description (Optional)</label>
              <input
                type="text"
                placeholder="Brief description of what you're tracking (e.g. Afternoon craving intensity 0-10)"
                value={newOutcomeDesc}
                onChange={(e) => setNewOutcomeDesc(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-xl p-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400"
              />
            </div>

            {/* Directionality & Placements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Directionality */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white block">Scale Scoring Goal</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewOutcomeDirectionality('higher_is_better')}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      newOutcomeDirectionality === 'higher_is_better'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm'
                        : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="text-[11px] font-bold flex items-center justify-between">
                      <span>📈 Higher is Better</span>
                      {newOutcomeDirectionality === 'higher_is_better' && <Check size={12} className="text-emerald-400" />}
                    </div>
                    <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">Focus, energy, calmness (10 = peak)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewOutcomeDirectionality('lower_is_better')}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      newOutcomeDirectionality === 'lower_is_better'
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-sm'
                        : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="text-[11px] font-bold flex items-center justify-between">
                      <span>📉 Lower is Better</span>
                      {newOutcomeDirectionality === 'lower_is_better' && <Check size={12} className="text-rose-400" />}
                    </div>
                    <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">Pain, stress, craving (0 = best)</p>
                  </button>
                </div>
              </div>

              {/* Check-in Placements */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white block">Track In Check-ins</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTrackInMorning(!trackInMorning)}
                    className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                      trackInMorning
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                        : 'bg-black/40 border-white/10 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <div className="text-[11px] font-bold flex items-center justify-center gap-1">
                      <Sun size={11} className={trackInMorning ? 'text-amber-400' : 'text-gray-500'} />
                      <span>Morning</span>
                    </div>
                    <span className="text-[9px] text-gray-400 mt-0.5 block">{trackInMorning ? 'Enabled' : 'Off'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTrackInAnytime(!trackInAnytime)}
                    className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                      trackInAnytime
                        ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-sm'
                        : 'bg-black/40 border-white/10 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <div className="text-[11px] font-bold flex items-center justify-center gap-1">
                      <Sparkles size={11} className={trackInAnytime ? 'text-indigo-400' : 'text-gray-500'} />
                      <span>Anytime</span>
                    </div>
                    <span className="text-[9px] text-gray-400 mt-0.5 block">{trackInAnytime ? 'Enabled' : 'Off'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTrackInNightly(!trackInNightly)}
                    className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                      trackInNightly
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-sm'
                        : 'bg-black/40 border-white/10 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <div className="text-[11px] font-bold flex items-center justify-center gap-1">
                      <Moon size={11} className={trackInNightly ? 'text-rose-400' : 'text-gray-500'} />
                      <span>Nightly</span>
                    </div>
                    <span className="text-[9px] text-gray-400 mt-0.5 block">{trackInNightly ? 'Enabled' : 'Off'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsCreatingCustom(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newOutcomeName.trim()}
                onClick={handleSaveNewCustomOutcome}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={13} strokeWidth={2.5} /> Save &amp; Track Outcome
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Outcome List */}
        <div className="overflow-y-auto space-y-4 flex-1 pr-1 custom-scrollbar">

          {/* ✨ USER-CREATED CUSTOM BIO-SIGNALS & OUTCOMES */}
          {filteredCustomOutcomes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-purple-300 border-b border-purple-500/20 pb-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-purple-400 fill-purple-400/30" />
                  <span>Your Custom Bio-Signals &amp; Outcomes</span>
                </div>
                <span className="text-[10px] text-purple-300/70 font-normal">
                  ({filteredCustomOutcomes.length} Created)
                </span>
              </div>

              <div className="space-y-2">
                {filteredCustomOutcomes.map(outcome => {
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
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`p-2 rounded-xl border shrink-0 ${
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

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-xs truncate">{outcome.name}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                              ✨ Custom
                            </span>
                            <span className="text-[8px] font-semibold px-1.5 py-0.2 rounded bg-white/5 text-gray-400 border border-white/10 uppercase shrink-0">
                              {outcome.category}
                            </span>
                            <span className="text-[8px] font-semibold px-1.5 py-0.2 rounded bg-white/5 text-gray-400 border border-white/10 shrink-0">
                              {outcome.directionality === 'lower_is_better' ? '📉 Lower is better' : '📈 Higher is better'}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                            {outcome.description || 'Custom bio-signal'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCustomOutcome(outcome.id)
                          }}
                          title="Delete custom outcome"
                          className="text-gray-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`p-2 rounded-xl border shrink-0 ${
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

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs truncate">{outcome.name}</span>
                            <span className="text-[8px] font-semibold px-1.5 py-0.2 rounded bg-white/5 text-gray-400 border border-white/10 uppercase shrink-0">
                              {outcome.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                            {outcome.description}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
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

          {/* ☀️ MORNING EXPERIENCE & DISPLAY PREFERENCES (ONLY FOR MORNING TAB) */}
          {activeTab === 'morning' && (
            <div className="bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-slate-900/60 p-3.5 rounded-2xl border border-amber-500/30 space-y-3 shadow-inner">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider border-b border-amber-500/20 pb-2">
                <Sun size={14} className="text-amber-400" /> Morning Experience &amp; Display Preferences
              </div>

              {/* Morning Mindfulness Display Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>🧘‍♂️</span> Morning Mindfulness &amp; Presence
                </label>
                <p className="text-[10px] text-gray-400">
                  Choose how the morning presence prompt appears upon opening your check-in:
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { id: 'open', label: 'Open by Default', desc: 'Full reflection card visible' },
                    { id: 'collapsed', label: 'Collapsed by Default', desc: 'Expandable banner' },
                    { id: 'hidden', label: 'Don\'t Show', desc: 'Hidden from morning check-in' }
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
              <div className="flex items-center justify-between pt-2 border-t border-amber-500/10">
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-bold text-white block">Always Keep Exposures Expanded</span>
                  <span className="text-[10px] text-gray-400 block">
                    Automatically expand the "Last Night's Exposures" section under sleep tracking instead of starting collapsed.
                  </span>
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

          {/* 🌙 EVENING EXPERIENCE & DISPLAY PREFERENCES (ONLY FOR NIGHTLY TAB) */}
          {activeTab === 'nightly' && (
            <div className="bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900/60 p-3.5 rounded-2xl border border-rose-500/30 space-y-3 shadow-inner">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider border-b border-rose-500/20 pb-2">
                <Moon size={14} className="text-rose-400" /> Evening Experience &amp; Display Preferences
              </div>

              {/* Evening Mindfulness Display Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>🌙</span> Evening Mindfulness &amp; Decompression
                </label>
                <p className="text-[10px] text-gray-400">
                  Choose how the evening somatic decompression &amp; wind-down prompt appears:
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { id: 'open', label: 'Open by Default', desc: 'Full reflection card visible' },
                    { id: 'collapsed', label: 'Collapsed by Default', desc: 'Expandable dusk bar' },
                    { id: 'hidden', label: 'Don\'t Show', desc: 'Hidden from evening check-in' }
                  ].map(opt => {
                    const isSelected = (preferences['setting:evening_mindfulness_display'] || 'open') === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPreferences(prev => ({ ...prev, 'setting:evening_mindfulness_display': opt.id }))}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500/20 border-rose-400 text-rose-200 shadow-sm'
                            : 'bg-black/40 border-white/10 hover:border-white/20 text-gray-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-[11px] text-white flex items-center justify-between">
                          <span>{opt.label}</span>
                          {isSelected && <Check size={12} className="text-rose-400" />}
                        </div>
                        <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">{opt.desc}</p>
                      </button>
                    )
                  })}
                </div>
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
                            ? activeTab === 'morning'
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                              : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            : 'bg-black/50 border-white/10 text-gray-400'
                        }`}>
                          <span className="text-sm">{exp.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-white text-xs block truncate">{exp.name}</span>
                          <span className="text-[9px] text-gray-400 block truncate">{exp.description}</span>
                        </div>
                      </div>

                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                        active
                          ? activeTab === 'morning'
                            ? 'bg-amber-500 border-amber-400 text-black'
                            : 'bg-rose-500 border-rose-400 text-white'
                          : 'border-white/20 bg-black/40'
                      }`}>
                        {active && <Check size={10} strokeWidth={3} />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 📋 ADDITIONAL BIO-SIGNALS SECTION */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-white/10 pb-1">
              <span>Additional Bio-Signals &amp; Clinical Outcomes</span>
              <span className="text-[10px] text-slate-500 font-normal">
                ({filteredAdditionalOutcomes.length} Available)
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[10px]">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-bold uppercase shrink-0 transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
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
                            ? 'bg-amber-950/40 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                            : activeTab === 'anytime'
                              ? 'bg-indigo-950/40 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                              : 'bg-rose-950/40 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`p-2 rounded-xl border shrink-0 ${
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

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs truncate">{outcome.name}</span>
                            <span className="text-[8px] font-semibold px-1.5 py-0.2 rounded bg-white/5 text-gray-400 border border-white/10 uppercase shrink-0">
                              {outcome.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                            {outcome.description}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
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
