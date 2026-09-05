'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Target,
  Search,
  Check,
  X,
  ChevronDown
} from 'lucide-react'
import { UserProfile, OutcomeDimension } from '@/lib/types'
import {
  ALL_SCHEMA_CHECKIN_OUTCOMES,
  getOutcomeEmoji,
  SchemaCheckinOutcome
} from './ViewSelectorHeader'

export interface OutcomeFilterDropdownProps {
  selectedOutcomes: string[]
  onToggleOutcome: (outcomeName: string) => void
  onClearOutcomes: () => void
  availableOutcomes?: (string | { id?: string; name: string } | OutcomeDimension)[]
  userProfile?: UserProfile | null
  allOutcomeDimensions?: OutcomeDimension[]
  className?: string
  dropdownTitle?: string
  placeholderText?: string
}

export const OutcomeFilterDropdown: React.FC<OutcomeFilterDropdownProps> = ({
  selectedOutcomes = [],
  onToggleOutcome,
  onClearOutcomes,
  availableOutcomes = [],
  userProfile = null,
  allOutcomeDimensions = [],
  className = '',
  dropdownTitle = 'Filter by Functional Outcomes',
  placeholderText = 'Search trackable outcomes...'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (!target) return
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  // Master combined outcomes catalog with unique emojis for all dimensions
  const allKnownOutcomes = useMemo(() => {
    const map = new Map<string, SchemaCheckinOutcome>()

    // 1. Seed with all schema check-in dimensions
    ALL_SCHEMA_CHECKIN_OUTCOMES.forEach((item) => {
      map.set(item.id.toLowerCase(), { ...item })
    })

    // 2. Add dynamically supplied dimensions
    const dynamicSources: any[] = [
      ...(allOutcomeDimensions || []),
      ...(availableOutcomes || [])
    ]

    dynamicSources.forEach((item: any) => {
      if (!item) return
      let id = ''
      let name = ''
      let category = 'vitality'
      let description = ''

      if (typeof item === 'string') {
        name = item.trim()
        id = name.toLowerCase().replace(/[\s-]/g, '_')
      } else if (typeof item === 'object') {
        name = (item.name || item.id || '').trim()
        id = (item.id || name).toLowerCase().replace(/[\s-]/g, '_')
        if (item.category) category = item.category
        if (item.description) description = item.description
      }

      if (!name) return

      const normKey = (id.includes('libido') || name.toLowerCase().includes('libido')) ? 'libido' : id.toLowerCase()

      const existing = map.get(normKey) || map.get(id) || Array.from(map.values()).find((o) => o.name.toLowerCase() === name.toLowerCase())
      if (existing) {
        if (!existing.description && description) existing.description = description
      } else {
        map.set(normKey, {
          id: normKey,
          name,
          category,
          icon: getOutcomeEmoji(normKey, name),
          defaultRank: 50,
          description: description || `Trackable biomarker and functional performance outcome: ${name}.`
        })
      }
    })

    // 3. Add custom user-created outcomes from user profile
    if (userProfile?.outcome_preference_scores?.custom_user_outcomes && Array.isArray(userProfile.outcome_preference_scores.custom_user_outcomes)) {
      userProfile.outcome_preference_scores.custom_user_outcomes.forEach((c: any) => {
        if (!c?.name) return
        const cid = (c.id || c.name).toLowerCase().replace(/[\s-]/g, '_')
        const normKey = (cid.includes('libido') || c.name.toLowerCase().includes('libido')) ? 'libido' : cid
        if (!map.has(normKey) && !map.has(cid)) {
          map.set(normKey, {
            id: normKey,
            name: c.name,
            category: c.category || 'vitality',
            icon: getOutcomeEmoji(normKey, c.name),
            defaultRank: 1,
            description: c.description || 'User-created custom bio-signal tracking dimension.'
          })
        }
      })
    }

    return Array.from(map.values())
  }, [availableOutcomes, allOutcomeDimensions, userProfile])

  // Ranked strictly by user importance, tracked prominence in checkins, then predicted popularity
  const rankedOutcomesList = useMemo(() => {
    const prefs = (userProfile?.outcome_preference_scores || {}) as Record<string, any>
    const anytimeDims = (userProfile?.anytime_checkin_dimensions || []).map((d) => d.toLowerCase())
    const morningDims = (userProfile?.morning_checkin_dimensions || []).map((d) => d.toLowerCase())
    const eveningDims = (userProfile?.evening_checkin_dimensions || []).map((d) => d.toLowerCase())
    const targetOutcomes = (((userProfile as any)?.target_outcomes || []) as string[]).map((t) => t.toLowerCase())
    const primaryGoals = (userProfile?.primary_goals || []).map((g) => g.toLowerCase())

    return allKnownOutcomes.map((item) => {
      const idLower = item.id.toLowerCase()
      const nameLower = item.name.toLowerCase()

      let score = 0
      let userScore: number | undefined = undefined
      let isTrackedInCheckin = false
      let isTargetGoal = false
      let badge: string | undefined = undefined
      let badgeClass: string | undefined = undefined

      if (typeof prefs[item.id] === 'number') {
        const val = Number(prefs[item.id])
        userScore = val
        score += val * 100
      } else if (typeof prefs[idLower] === 'number') {
        const val = Number(prefs[idLower])
        userScore = val
        score += val * 100
      } else if (typeof prefs[nameLower] === 'number') {
        const val = Number(prefs[nameLower])
        userScore = val
        score += val * 100
      }

      const checkinKeys = [
        `anytime:${item.id}`, `anytime:${idLower}`, `anytime:${nameLower}`,
        `morning:${item.id}`, `morning:${idLower}`, `morning:${nameLower}`,
        `nightly:${item.id}`, `nightly:${idLower}`, `nightly:${nameLower}`
      ]
      for (const k of checkinKeys) {
        if (typeof prefs[k] === 'number') {
          score += prefs[k] * 15
          if (prefs[k] >= 7) isTrackedInCheckin = true
        }
      }

      if (
        anytimeDims.includes(idLower) || anytimeDims.includes(nameLower) ||
        morningDims.includes(idLower) || morningDims.includes(nameLower) ||
        eveningDims.includes(idLower) || eveningDims.includes(nameLower)
      ) {
        isTrackedInCheckin = true
        score += 250
      }

      if (
        targetOutcomes.some((t) => idLower.includes(t) || t.includes(idLower) || nameLower.includes(t) || t.includes(nameLower)) ||
        primaryGoals.some((g) => idLower.includes(g) || g.includes(idLower) || nameLower.includes(g) || g.includes(nameLower))
      ) {
        isTargetGoal = true
        score += 300
      }

      if (isTargetGoal) {
        badge = 'Target Goal'
        badgeClass = 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
      } else if (userScore !== undefined && userScore >= 8) {
        badge = `Top Priority (${userScore}/10)`
        badgeClass = 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
      } else if (isTrackedInCheckin) {
        badge = 'Tracked in Check-in'
        badgeClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
      } else if (userScore !== undefined && userScore >= 5) {
        badge = `Priority (${userScore}/10)`
        badgeClass = 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
      }

      const defaultRank = item.defaultRank ?? 50
      score += Math.max(0, 100 - defaultRank)

      return {
        ...item,
        rankScore: score,
        userScore,
        isTrackedInCheckin,
        isTargetGoal,
        badge,
        badgeClass
      }
    }).sort((a, b) => {
      if (b.rankScore !== a.rankScore) {
        return b.rankScore - a.rankScore
      }
      return a.name.localeCompare(b.name)
    })
  }, [allKnownOutcomes, userProfile])

  const filteredRankedOutcomes = useMemo(() => {
    if (!searchQuery.trim()) return rankedOutcomesList
    const q = searchQuery.toLowerCase().trim()
    return rankedOutcomesList.filter((o) =>
      o.name.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      (o.description && o.description.toLowerCase().includes(q)) ||
      (o.category && o.category.toLowerCase().includes(q))
    )
  }, [rankedOutcomesList, searchQuery])

  // Active outcomes label showing icons
  const activeOutcomeLabel = useMemo(() => {
    if (selectedOutcomes.length === 0) return '🎯 All Outcomes Active'
    return selectedOutcomes.map((name) => {
      const match = allKnownOutcomes.find((o) =>
        o.name.toLowerCase() === name.toLowerCase() ||
        o.id.toLowerCase() === name.toLowerCase()
      )
      const icon = match?.icon || getOutcomeEmoji(name, name)
      return `${icon} ${name}`
    }).join(', ')
  }, [selectedOutcomes, allKnownOutcomes])

  return (
    <div className={`flex flex-col gap-1.5 relative w-full ${className}`} ref={dropdownRef}>
      {/* Full-width Trigger Button listing outcomes */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border font-bold text-xs transition-all cursor-pointer shadow-sm ${
          selectedOutcomes.length > 0
            ? 'bg-purple-950/60 border-purple-500/60 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
            : isOpen
            ? 'bg-slate-800 border-slate-600 text-white'
            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          <Target className={`w-3.5 h-3.5 shrink-0 ${selectedOutcomes.length > 0 ? 'text-amber-400' : 'text-purple-400'}`} />
          <span className="text-left text-xs font-bold leading-snug break-words">
            {activeOutcomeLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {selectedOutcomes.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-[10px] font-mono font-bold">
              {selectedOutcomes.length}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-purple-400' : 'text-slate-400'}`} />
        </div>
      </button>

      {/* Full-Opacity Outcomes Dropdown Panel (2-wide outcome grid) */}
      {isOpen && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="w-full bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shadow-2xl space-y-3 z-30 animate-in fade-in slide-in-from-top-2"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-purple-400" /> {dropdownTitle}
            </span>
            {selectedOutcomes.length > 0 && (
              <button
                type="button"
                onClick={() => onClearOutcomes?.()}
                className="text-xs font-bold text-orange-400 hover:text-orange-300 underline cursor-pointer"
              >
                Clear All ({selectedOutcomes.length})
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholderText}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Scrollable list of ranked outcomes: 2-WIDE GRID sectioned by Longevity vs Wellbeing */}
          <div className="overflow-y-auto max-h-80 p-0.5 scrollbar-thin space-y-3">
            {(() => {
              const longevityOutcomes = filteredRankedOutcomes.filter((o) => o.category === 'longevity')
              const wellbeingOutcomes = filteredRankedOutcomes.filter((o) => o.category !== 'longevity')

              const renderButton = (item: typeof filteredRankedOutcomes[number]) => {
                const isChecked = selectedOutcomes.some((sel) =>
                  sel.toLowerCase().trim() === item.name.toLowerCase().trim() ||
                  sel.toLowerCase().trim() === item.id.toLowerCase().trim()
                )
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleOutcome?.(item.name)}
                    className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left flex items-start justify-between gap-1.5 border ${
                      isChecked
                        ? 'bg-purple-900/40 text-purple-100 border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                        : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-1.5 min-w-0 flex-1">
                      <span className="text-base shrink-0 leading-tight">{item.icon}</span>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-bold text-[11px] sm:text-xs leading-snug line-clamp-2">
                          {item.name}
                        </span>
                        {item.badge && (
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-1 py-0.2 rounded mt-0.5 w-fit ${item.badgeClass}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                      isChecked
                        ? 'bg-purple-600 border-purple-400 text-white'
                        : 'border-slate-700 bg-slate-950'
                    }`}>
                      {isChecked && <Check size={9} strokeWidth={3} />}
                    </div>
                  </button>
                )
              }

              if (filteredRankedOutcomes.length === 0) {
                return (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No matching outcomes found
                  </div>
                )
              }

              return (
                <>
                  {/* Section 1: Biological Longevity & Clinical Biomarkers */}
                  {longevityOutcomes.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 px-1 text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300">
                        <span>🧬 Biological Longevity &amp; Biomarkers</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                        {longevityOutcomes.map(renderButton)}
                      </div>
                    </div>
                  )}

                  {/* Section 2: Daily Wellbeing & Functional Performance */}
                  {wellbeingOutcomes.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-1 px-1 text-[10px] font-mono font-bold uppercase tracking-wider text-teal-300">
                        <span>⚡ Daily Wellbeing &amp; Performance</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                        {wellbeingOutcomes.map(renderButton)}
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Active outcome tags bar */}
      {selectedOutcomes.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5 pt-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 shrink-0">
            Filtered:
          </span>
          {selectedOutcomes.map((outcomeName) => (
            <span
              key={outcomeName}
              className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-purple-950/60 border border-purple-500/40 text-purple-200 flex items-center gap-1 shrink-0"
            >
              <span>{outcomeName}</span>
              <button
                type="button"
                onClick={() => onToggleOutcome?.(outcomeName)}
                className="hover:text-white text-purple-400 cursor-pointer ml-0.5"
                aria-label={`Remove ${outcomeName}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default OutcomeFilterDropdown
