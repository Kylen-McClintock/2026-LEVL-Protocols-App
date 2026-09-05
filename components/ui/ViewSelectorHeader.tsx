'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { CalendarDays, ChevronDown, Check, Filter, LayoutGrid, Calendar, Columns, Rows, AlignJustify, Zap, Activity, HelpCircle, Bookmark, Target, X, Search, Sparkles } from 'lucide-react'
import { UserProfile, OutcomeDimension } from '@/lib/types'

export type CalendarViewMode = 'today' | 'pulse' | '3day' | 'week' | 'month'
export type LayoutOrientation = 'columns' | 'stack'
export type CompletionTrackingMode = 'outcome' | 'fast'
export type FilterLens = 'category' | 'outcomes'

export interface ViewSelectorHeaderProps {
  viewMode: CalendarViewMode
  onViewModeChange?: (mode: CalendarViewMode) => void
  dateTitle?: string
  selectedProtocolFilter?: string
  onProtocolFilterChange?: (protocolId: string) => void
  availableProtocols?: { id: string; name: string; colorHex?: string }[]
  selectedMainCategories?: MainCategory[]
  selectedSubCategories?: string[]
  onToggleMainCategory?: (cat: MainCategory) => void
  onToggleSubCategory?: (subId: string) => void
  layoutOrientation?: LayoutOrientation
  onToggleLayoutOrientation?: (orientation: LayoutOrientation) => void
  onEnrollClick?: () => void
  completionMode?: CompletionTrackingMode
  onCompletionModeChange?: (mode: CompletionTrackingMode) => void
  showCategoryFilters?: boolean
  filterLens?: FilterLens
  onToggleFilterLens?: (lens: FilterLens) => void
  selectedOutcomes?: string[]
  onToggleOutcome?: (outcomeName: string) => void
  onClearOutcomes?: () => void
  availableOutcomes?: (string | { id?: string; name: string } | OutcomeDimension)[]
  userProfile?: UserProfile | null
  allOutcomeDimensions?: OutcomeDimension[]
}

export const ViewSelectorHeader: React.FC<ViewSelectorHeaderProps> = ({
  viewMode,
  selectedProtocolFilter = 'all',
  onProtocolFilterChange,
  availableProtocols = [],
  selectedMainCategories = ['all'],
  selectedSubCategories = [],
  onToggleMainCategory = () => {},
  onToggleSubCategory = () => {},
  layoutOrientation = 'columns',
  onToggleLayoutOrientation,
  onEnrollClick,
  filterLens = 'category',
  onToggleFilterLens,
  selectedOutcomes = [],
  onToggleOutcome,
  onClearOutcomes,
  availableOutcomes = [],
  userProfile = null,
  allOutcomeDimensions = []
}) => {
  return (
    <CategoryFiltersBar
      selectedMainCategories={selectedMainCategories}
      selectedSubCategories={selectedSubCategories}
      onToggleMainCategory={onToggleMainCategory}
      onToggleSubCategory={onToggleSubCategory}
      viewMode={viewMode}
      layoutOrientation={layoutOrientation}
      onToggleLayoutOrientation={onToggleLayoutOrientation}
      filterLens={filterLens}
      onToggleFilterLens={onToggleFilterLens}
      selectedOutcomes={selectedOutcomes}
      onToggleOutcome={onToggleOutcome}
      onClearOutcomes={onClearOutcomes}
      availableOutcomes={availableOutcomes}
      userProfile={userProfile}
      allOutcomeDimensions={allOutcomeDimensions}
      selectedProtocolFilter={selectedProtocolFilter}
      onProtocolFilterChange={onProtocolFilterChange}
      availableProtocols={availableProtocols}
      onEnrollClick={onEnrollClick}
    />
  )
}

export type MainCategory = 'all' | 'supplements' | 'peptides' | 'fitness' | 'nutrition' | 'sleep' | 'mind' | 'other'

export interface SubCategoryItem {
  id: string
  label: string
}

export const MAIN_CATEGORIES: Array<{ id: MainCategory; label: string; icon: string }> = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'supplements', label: 'Supplements', icon: '💊' },
  { id: 'peptides', label: 'Peptides', icon: '💉' },
  { id: 'fitness', label: 'Fitness', icon: '🏋️' },
  { id: 'nutrition', label: 'Nutrition', icon: '🥗' },
  { id: 'sleep', label: 'Sleep', icon: '🌙' },
  { id: 'mind', label: 'Mind', icon: '🧠' },
  { id: 'other', label: 'Other', icon: '🎨' }
]

export const SUB_CATEGORIES_MAP: Record<MainCategory, SubCategoryItem[]> = {
  all: [],
  supplements: [
    { id: 'longevity_nad', label: 'Longevity & Cellular' },
    { id: 'nootropics', label: 'Cognitive & Nootropics' },
    { id: 'mitochondrial', label: 'Mitochondrial & Energy' },
    { id: 'vitamins_minerals', label: 'Vitamins & Minerals' }
  ],
  peptides: [
    { id: 'injury_joint_repair', label: '🩹 Injury & Joint Repair' },
    { id: 'fat_loss_metabolism', label: '🔥 Fat Loss & Metabolism' },
    { id: 'muscle_recovery', label: '💪 Muscle & Recovery' },
    { id: 'focus_brain_mood', label: '🧠 Focus, Brain & Mood' },
    { id: 'skin_aesthetics', label: '✨ Skin & Aesthetics' },
    { id: 'immunity_gut', label: '🛡️ Immunity & Gut Health' },
    { id: 'libido_vitality', label: '❤️‍🔥 Libido & Vitality' },
    { id: 'cellular_longevity', label: '🧬 Cellular Longevity' }
  ],
  fitness: [
    { id: 'cardio', label: 'Cardio' },
    { id: 'strength', label: 'Strength' },
    { id: 'flexibility', label: 'Flexibility & Stretching' },
    { id: 'thermal', label: 'Thermal & Recovery' }
  ],
  nutrition: [
    { id: 'fasting', label: 'Fasting' },
    { id: 'whole_foods', label: 'Whole Foods & Diet' },
    { id: 'hydration', label: 'Hydration & Electrolytes' }
  ],
  sleep: [
    { id: 'hygiene', label: 'Sleep Hygiene' },
    { id: 'circadian', label: 'Circadian & Light' },
    { id: 'wind_down', label: 'Wind Down' }
  ],
  mind: [
    { id: 'nervous_system', label: 'Nervous System' },
    { id: 'breathwork', label: 'Breathwork' },
    { id: 'meditation', label: 'Meditation' }
  ],
  other: [
    { id: 'skin', label: 'Skin & Hair' },
    { id: 'biomarkers', label: 'Diagnostics & Biomarkers' },
    { id: 'environmental', label: 'Environmental' }
  ]
}

export function getOutcomeEmoji(id: string, name: string): string {
  const norm = `${id} ${name}`.toLowerCase()
  if (norm.includes('skin') || norm.includes('wrinkle') || norm.includes('collagen') || norm.includes('complexion')) return '✨'
  if (norm.includes('deep sleep') || norm.includes('slow wave') || norm.includes('sws')) return '🌌'
  if (norm.includes('latency') || norm.includes('fall asleep') || norm.includes('onset')) return '⏱️'
  if (norm.includes('wake') || norm.includes('restedness') || norm.includes('morning')) return '🌅'
  if (norm.includes('sleep') || norm.includes('rem') || norm.includes('somno')) return '🌙'
  if (norm.includes('energy') || norm.includes('atp') || norm.includes('mitochon') || norm.includes('vitality')) return '⚡'
  if (norm.includes('brain fog')) return '💡'
  if (norm.includes('mental clarity') || norm.includes('clarity') || norm.includes('lucidity')) return '🔮'
  if (norm.includes('focus') || norm.includes('cognit') || norm.includes('memory') || norm.includes('attention')) return '🧠'
  if (norm.includes('autonomic') || norm.includes('hrv') || norm.includes('vagal') || norm.includes('vagus')) return '🫀'
  if (norm.includes('calm') || norm.includes('anxiety') || norm.includes('relax') || norm.includes('tranquil')) return '🧘'
  if (norm.includes('stress') || norm.includes('cortisol')) return '❤️'
  if (norm.includes('mood') || norm.includes('depress') || norm.includes('valence') || norm.includes('cheer')) return '😊'
  if (norm.includes('resilience') || norm.includes('emotional') || norm.includes('grit')) return '🪨'
  if (norm.includes('dna') || norm.includes('longev') || norm.includes('telomer') || norm.includes('senesc') || norm.includes('lifespan')) return '🧬'
  if (norm.includes('metabol') || norm.includes('fat') || norm.includes('weight') || norm.includes('burn') || norm.includes('ketosis')) return '🔥'
  if (norm.includes('glucose') || norm.includes('insulin') || norm.includes('glycem') || norm.includes('hba1c')) return '📉'
  if (norm.includes('satiety') || norm.includes('appetite') || norm.includes('leptin') || norm.includes('ghrelin') || norm.includes('hunger')) return '⚖️'
  if (norm.includes('gut') || norm.includes('digest') || norm.includes('microbio') || norm.includes('bloat') || norm.includes('motility')) return '🥗'
  if (norm.includes('joint') || norm.includes('cartilage') || norm.includes('tendon') || norm.includes('synovial')) return '🩹'
  if (norm.includes('hypertrophy') || norm.includes('muscle') || norm.includes('myofibril') || norm.includes('anabolic')) return '💪'
  if (norm.includes('strength') || norm.includes('power') || norm.includes('force') || norm.includes('lift')) return '🏋️'
  if (norm.includes('endurance') || norm.includes('stamina') || norm.includes('vo2') || norm.includes('aerobic') || norm.includes('cardio')) return '🏃'
  if (norm.includes('immune') || norm.includes('infect') || norm.includes('pathogen') || norm.includes('defense')) return '🛡️'
  if (norm.includes('libido') || norm.includes('testoster') || norm.includes('hormon') || norm.includes('sexual') || norm.includes('androgen')) return '❤️‍🔥'
  if (norm.includes('sore') || norm.includes('doms') || norm.includes('cold') || norm.includes('ice') || norm.includes('plunge')) return '🧊'
  if (norm.includes('fatigue') || norm.includes('exhaust') || norm.includes('burnout') || norm.includes('drain')) return '🔋'
  if (norm.includes('productiv') || norm.includes('deep work') || norm.includes('output') || norm.includes('task')) return '📊'
  if (norm.includes('motivat') || norm.includes('dopamin') || norm.includes('drive') || norm.includes('reward')) return '🚀'
  if (norm.includes('pain') || norm.includes('ache') || norm.includes('inflamm') || norm.includes('crp')) return '🩺'
  if (norm.includes('autophagy') || norm.includes('fasting') || norm.includes('clearance')) return '🔄'
  if (norm.includes('detox') || norm.includes('liver') || norm.includes('kidney') || norm.includes('hepatic')) return '🍃'
  if (norm.includes('bone') || norm.includes('osteo') || norm.includes('calcium') || norm.includes('density')) return '🦴'
  if (norm.includes('hair') || norm.includes('follicle') || norm.includes('alopecia')) return '💇'
  if (norm.includes('eye') || norm.includes('vision') || norm.includes('ocular')) return '👁️'
  if (norm.includes('ear') || norm.includes('hearing') || norm.includes('tinnitus')) return '👂'
  if (norm.includes('vascular') || norm.includes('blood flow') || norm.includes('arterial') || norm.includes('circulation')) return '🩸'
  return '🎯'
}

export interface SchemaCheckinOutcome {
  id: string
  name: string
  category: string
  icon: string
  defaultRank: number // 1 is highest predicted popularity
  description: string
}

export const ALL_SCHEMA_CHECKIN_OUTCOMES: SchemaCheckinOutcome[] = [
  // 1. Biological Longevity & Clinical Biomarkers
  { id: 'heart_health', name: 'Heart & Cardiovascular Health', category: 'longevity', icon: '🫀', defaultRank: 1, description: 'Cardiovascular resilience, arterial elasticity, blood pressure & ApoB lipid control.' },
  { id: 'brain_longevity', name: 'Brain Longevity & Neuroprotection', category: 'longevity', icon: '🧠', defaultRank: 2, description: 'Long-term cognitive preservation, amyloid clearance, neuroprotection & dementia defense.' },
  { id: 'cancer_defense', name: 'Cancer Defense & Autophagy', category: 'longevity', icon: '🛡️', defaultRank: 3, description: 'Autophagy stimulation, senescent cell clearance, DNA repair & oncogenic defense.' },
  { id: 'metabolic_health', name: 'Metabolic Health & Blood Sugar', category: 'longevity', icon: '🔥', defaultRank: 4, description: 'Insulin sensitivity, stable glucose, metabolic flexibility & visceral fat reduction.' },
  { id: 'testosterone', name: 'Testosterone & Hormone Balance', category: 'longevity', icon: '⚡', defaultRank: 5, description: 'Free testosterone, androgen receptor sensitivity, DHEA & endocrine vitality.' },
  { id: 'chronic_inflammation', name: 'Chronic Inflammation Defense', category: 'longevity', icon: '❄️', defaultRank: 6, description: 'Lowering hs-CRP, cytokine balance, joint relief & blunting systemic inflammaging.' },
  { id: 'bone_density', name: 'Bone Density & Skeletal Strength', category: 'longevity', icon: '🦴', defaultRank: 7, description: 'Cortical bone mineral density, osteoclast balance & structural skeletal resilience.' },
  { id: 'cellular_longevity', name: 'Cellular Longevity & DNA Repair', category: 'longevity', icon: '🧬', defaultRank: 8, description: 'Telomere protection, senescent cell clearance & NAD+ mitochondrial repair.' },

  // 2. Daily Wellbeing & Functional Performance
  { id: 'focus', name: 'Cognitive Focus & Clarity', category: 'cognitive', icon: '🧠', defaultRank: 10, description: 'Laser focus, working memory retention, mental sharpness & flow state.' },
  { id: 'sleep_quality', name: 'Sleep Quality', category: 'sleep', icon: '🌙', defaultRank: 11, description: 'Deep & REM sleep architecture, restorative overnight recovery & fewer awakenings.' },
  { id: 'deep_sleep', name: 'Deep Sleep', category: 'sleep', icon: '🌌', defaultRank: 12, description: 'Stage 3 slow-wave physical cellular repair & glymphatic brain clearance.' },
  { id: 'energy', name: 'Energy & Mitochondria', category: 'vitality', icon: '⚡', defaultRank: 13, description: 'Sustained daytime vitality, cellular ATP production & eliminating energy crashes.' },
  { id: 'skin_clarity', name: 'Skin Clarity & Health', category: 'vitality', icon: '✨', defaultRank: 14, description: 'Dermal barrier integrity, collagen density, elasticity & cellular turnover.' },
  { id: 'libido', name: 'Libido & Sexual Vitality', category: 'vitality', icon: '❤️‍🔥', defaultRank: 15, description: 'Sexual desire, arousal, reproductive health & endocrine vitality signaling.' },
  { id: 'stress', name: 'Stress & Autonomic Balance', category: 'recovery', icon: '❤️', defaultRank: 16, description: 'High parasympathetic vagal tone, rapid autonomic recovery & lower cortisol.' },
  { id: 'mood', name: 'Mood & Emotional Resilience', category: 'cognitive', icon: '😊', defaultRank: 17, description: 'Positive neurochemical valence, emotional equilibrium & psychological well-being.' },
  { id: 'joint_comfort', name: 'Joint Comfort & Mobility', category: 'recovery', icon: '🩹', defaultRank: 18, description: 'Cartilage mobility, synovial lubrication, connective tissue repair & joint ease.' },
  { id: 'muscle_hypertrophy', name: 'Muscle Hypertrophy & Growth', category: 'physical', icon: '💪', defaultRank: 19, description: 'Muscle protein synthesis, myofibrillar growth & lean mass retention.' },
  { id: 'strength', name: 'Strength & Power', category: 'physical', icon: '🏋️', defaultRank: 20, description: 'Peak neuromuscular force output, power capacity & training output.' },
  { id: 'athletic_endurance', name: 'Athletic & Aerobic Endurance', category: 'physical', icon: '🏃', defaultRank: 21, description: 'Cardiorespiratory stamina, VO2 max, aerobic efficiency & delayed lactate fatigue.' },
  { id: 'digestive_comfort', name: 'Digestive Comfort & Gut Health', category: 'vitality', icon: '🥗', defaultRank: 22, description: 'Smooth gut motility, microbiome balance, intestinal barrier & reduced bloating.' },
  { id: 'waking_restedness', name: 'Waking Restedness', category: 'sleep', icon: '🌅', defaultRank: 23, description: 'Waking alert and refreshed with optimal morning circadian cortisol response.' },
  { id: 'calmness', name: 'Calmness & Anxiety Relief', category: 'cognitive', icon: '🧘', defaultRank: 24, description: 'Central nervous system relaxation, lower trait anxiety & inner tranquility.' },
  { id: 'immune_resilience', name: 'Immune Resilience', category: 'recovery', icon: '🛡️', defaultRank: 25, description: 'Innate and adaptive immune defense & reduced susceptibility to infections.' },
  { id: 'brain_fog', name: 'Brain Fog Reduction', category: 'cognitive', icon: '💡', defaultRank: 26, description: 'Fast neural processing speed, crisp mental acuity & cerebral metabolic clearance.' },
  { id: 'satiety', name: 'Satiety & Appetite Control', category: 'metabolic', icon: '⚖️', defaultRank: 27, description: 'Optimal leptin/ghrelin signaling, prolonged fullness & craving mitigation.' },
  { id: 'soreness', name: 'Soreness (DOMS) Recovery', category: 'recovery', icon: '🧊', defaultRank: 28, description: 'Delayed onset muscle soreness (DOMS) reduction & accelerated muscular recovery.' },
  { id: 'sleep_latency', name: 'Sleep Latency (Falling Asleep)', category: 'sleep', icon: '⏱️', defaultRank: 29, description: 'Speed of falling asleep peacefully without tossing and turning.' },
  { id: 'emotional_resilience', name: 'Emotional Resilience', category: 'cognitive', icon: '🪨', defaultRank: 30, description: 'Stress adaptability, heart rate variability (HRV) rebound & emotional control.' },
  { id: 'motivation', name: 'Motivation & Drive', category: 'cognitive', icon: '🚀', defaultRank: 31, description: 'Dopamine-driven initiative, reward anticipation & productivity readiness.' },
  { id: 'physical_fatigue', name: 'Physical Fatigue Reduction', category: 'vitality', icon: '🔋', defaultRank: 32, description: 'Mitigating systemic exhaustion, muscular burnout & heavy-limb sensations.' },
  { id: 'productivity', name: 'Productivity & Deep Work', category: 'cognitive', icon: '📊', defaultRank: 33, description: 'High-leverage work output, cognitive stamina & deep work efficiency.' },
  { id: 'pain', name: 'Musculoskeletal Pain Relief', category: 'recovery', icon: '🩺', defaultRank: 34, description: 'Systemic inflammatory relief, joint comfort & musculoskeletal ease.' }
]

export const CategoryFiltersBar: React.FC<{
  selectedMainCategories: MainCategory[]
  selectedSubCategories: string[]
  onToggleMainCategory: (cat: MainCategory) => void
  onToggleSubCategory: (subId: string) => void
  viewMode?: CalendarViewMode
  layoutOrientation?: LayoutOrientation
  onToggleLayoutOrientation?: (orientation: LayoutOrientation) => void
  className?: string
  // Master Category vs Outcomes filter toggle props:
  filterLens?: FilterLens
  onToggleFilterLens?: (lens: FilterLens) => void
  selectedOutcomes?: string[]
  onToggleOutcome?: (outcomeName: string) => void
  onClearOutcomes?: () => void
  availableOutcomes?: (string | { id?: string; name: string } | OutcomeDimension)[]
  userProfile?: UserProfile | null
  allOutcomeDimensions?: OutcomeDimension[]
  // Protocol Filter & Guide props:
  selectedProtocolFilter?: string
  onProtocolFilterChange?: (protocolId: string) => void
  availableProtocols?: { id: string; name: string; colorHex?: string }[]
  onEnrollClick?: () => void
}> = ({
  selectedMainCategories,
  selectedSubCategories,
  onToggleMainCategory,
  onToggleSubCategory,
  viewMode,
  layoutOrientation,
  onToggleLayoutOrientation,
  className = '',
  filterLens = 'category',
  onToggleFilterLens,
  selectedOutcomes = [],
  onToggleOutcome,
  onClearOutcomes,
  availableOutcomes = [],
  userProfile = null,
  allOutcomeDimensions = [],
  selectedProtocolFilter = 'all',
  onProtocolFilterChange,
  availableProtocols = [],
  onEnrollClick
}) => {
  const [internalLens, setInternalLens] = useState<FilterLens>(filterLens)
  const currentLens = onToggleFilterLens ? filterLens : internalLens

  const handleLensChange = (newLens: FilterLens) => {
    if (onToggleFilterLens) {
      onToggleFilterLens(newLens)
    } else {
      setInternalLens(newLens)
    }
  }

  // Full-opacity dropdown state for Category and Outcomes
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const [isOutcomeDropdownOpen, setIsOutcomeDropdownOpen] = useState(false)
  const [outcomeSearchQuery, setOutcomeSearchQuery] = useState('')

  const categoryDropdownRef = useRef<HTMLDivElement>(null)
  const outcomeDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (!target) return
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(target)) {
        setIsCategoryDropdownOpen(false)
      }
      if (outcomeDropdownRef.current && !outcomeDropdownRef.current.contains(target)) {
        setIsOutcomeDropdownOpen(false)
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
  const allKnownOutcomes = React.useMemo(() => {
    const map = new Map<string, SchemaCheckinOutcome>()

    // 1. Seed with all schema check-in dimensions
    ALL_SCHEMA_CHECKIN_OUTCOMES.forEach(item => {
      map.set(item.id.toLowerCase(), { ...item })
    })

    // 2. Add dynamically supplied dimensions from Supabase or caller
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

      // Canonical key normalization to merge synonyms (e.g. libido vs libido_vitality)
      const normKey = (id.includes('libido') || name.toLowerCase().includes('libido')) ? 'libido' : id.toLowerCase()

      const existing = map.get(normKey) || map.get(id) || Array.from(map.values()).find(o => o.name.toLowerCase() === name.toLowerCase())
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
            defaultRank: 1, // Custom user outcomes rank very high
            description: c.description || 'User-created custom bio-signal tracking dimension.'
          })
        }
      })
    }

    return Array.from(map.values())
  }, [availableOutcomes, allOutcomeDimensions, userProfile])

  // Ranked strictly by user importance, tracked prominence in checkins, then predicted popularity
  const rankedOutcomesList = React.useMemo(() => {
    const prefs = (userProfile?.outcome_preference_scores || {}) as Record<string, any>
    const anytimeDims = (userProfile?.anytime_checkin_dimensions || []).map(d => d.toLowerCase())
    const morningDims = (userProfile?.morning_checkin_dimensions || []).map(d => d.toLowerCase())
    const eveningDims = (userProfile?.evening_checkin_dimensions || []).map(d => d.toLowerCase())
    const targetOutcomes = (((userProfile as any)?.target_outcomes || []) as string[]).map(t => t.toLowerCase())
    const primaryGoals = (userProfile?.primary_goals || []).map(g => g.toLowerCase())

    return allKnownOutcomes.map(item => {
      const idLower = item.id.toLowerCase()
      const nameLower = item.name.toLowerCase()

      let score = 0
      let userScore: number | undefined = undefined
      let isTrackedInCheckin = false
      let isTargetGoal = false
      let badge: string | undefined = undefined
      let badgeClass: string | undefined = undefined

      // 1. Direct user importance preference score (0-10) in outcome_preference_scores
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

      // Check anytime:, morning:, nightly: checkin keys
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

      // 2. Prominence in user's tracked checkin dimensions
      if (anytimeDims.includes(idLower) || anytimeDims.includes(nameLower) ||
          morningDims.includes(idLower) || morningDims.includes(nameLower) ||
          eveningDims.includes(idLower) || eveningDims.includes(nameLower)) {
        isTrackedInCheckin = true
        score += 250
      }

      // 3. User target outcomes and primary goals
      if (targetOutcomes.some(t => idLower.includes(t) || t.includes(idLower) || nameLower.includes(t) || t.includes(nameLower)) ||
          primaryGoals.some(g => idLower.includes(g) || g.includes(idLower) || nameLower.includes(g) || g.includes(nameLower))) {
        isTargetGoal = true
        score += 300
      }

      // Assign badges for visual feedback
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

      // 4. Fallback: Predicted popularity
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

  const filteredRankedOutcomes = React.useMemo(() => {
    if (!outcomeSearchQuery.trim()) return rankedOutcomesList
    const q = outcomeSearchQuery.toLowerCase().trim()
    return rankedOutcomesList.filter(o => 
      o.name.toLowerCase().includes(q) || 
      o.id.toLowerCase().includes(q) || 
      (o.description && o.description.toLowerCase().includes(q)) ||
      (o.category && o.category.toLowerCase().includes(q))
    )
  }, [rankedOutcomesList, outcomeSearchQuery])

  const isAllActive = selectedMainCategories.includes('all') || selectedMainCategories.length === 0
  const isCategoryFiltered = !isAllActive

  // If multiple categories are selected, list them with icons instead of just saying the number
  const activeCategoryLabel = React.useMemo(() => {
    if (isAllActive) return '✨ All Categories'
    const nonAll = selectedMainCategories.filter(c => c !== 'all')
    if (nonAll.length === 0) return '✨ All Categories'
    return nonAll.map(catId => {
      const match = MAIN_CATEGORIES.find(c => c.id === catId)
      return match ? `${match.icon} ${match.label}` : catId
    }).join(', ')
  }, [isAllActive, selectedMainCategories])

  // If multiple outcomes are selected, list them with emojis instead of just saying the number
  const activeOutcomeLabel = React.useMemo(() => {
    if (selectedOutcomes.length === 0) return '🎯 All Outcomes Active'
    return selectedOutcomes.map(name => {
      const match = allKnownOutcomes.find(o => 
        o.name.toLowerCase() === name.toLowerCase() || 
        o.id.toLowerCase() === name.toLowerCase()
      )
      const icon = match?.icon || getOutcomeEmoji(name, name)
      return `${icon} ${name}`
    }).join(', ')
  }, [selectedOutcomes, allKnownOutcomes])

  const activeSubItems = React.useMemo(() => {
    if (isAllActive) return []
    const items: SubCategoryItem[] = []
    selectedMainCategories.forEach(cat => {
      if (cat !== 'all') {
        const subs = SUB_CATEGORIES_MAP[cat] || []
        items.push(...subs)
      }
    })
    return items
  }, [selectedMainCategories, isAllActive])

  return (
    <div className={`flex flex-col gap-1.5 bg-slate-950/90 p-2 sm:p-2.5 rounded-2xl border border-slate-800/80 mb-3 shadow-xl backdrop-blur-md relative z-30 ${className}`}>
      {/* Master Toggle Header: Filter by: [ Category | Outcomes ] (Full row width on mobile) */}
      <div className="w-full flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-[11px] sm:text-xs font-black text-slate-400 uppercase tracking-wider shrink-0">
            Filter by:
          </span>
          <div className="flex-1 grid grid-cols-2 bg-black/60 p-0.5 rounded-xl border border-white/10 gap-0.5 text-xs shadow-inner max-w-xs">
            <button
              type="button"
              onClick={() => {
                handleLensChange('category')
                setIsOutcomeDropdownOpen(false)
              }}
              className={`w-full py-1.5 rounded-lg font-bold text-xs tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                currentLens === 'category'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🏷️</span>
              <span>Category</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleLensChange('outcomes')
                setIsCategoryDropdownOpen(false)
              }}
              className={`w-full py-1.5 rounded-lg font-bold text-xs tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                currentLens === 'outcomes'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🎯</span>
              <span>Outcomes</span>
              {selectedOutcomes.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-purple-400/30 text-purple-200 text-[10px] flex items-center justify-center font-mono font-bold ml-1">
                  {selectedOutcomes.length}
                </span>
              )}
            </button>
          </div>

          {/* Guide Icon with buffer space next to toggle */}
          <Link
            href="/guide#today"
            className="ml-3 sm:ml-4 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 text-slate-400 hover:text-purple-300 transition-colors cursor-pointer shadow-sm shrink-0 flex items-center justify-center"
            title="View Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
          </Link>
        </div>

        {/* Right Controls: Multi-day orientation toggle (columns vs stack) */}
        {viewMode && viewMode !== 'today' && onToggleLayoutOrientation && layoutOrientation && (
          <div className="hidden sm:flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 shrink-0 ml-auto">
            <button
              onClick={() => onToggleLayoutOrientation('columns')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                layoutOrientation === 'columns'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Side-by-Side Columns View"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Side-by-Side</span>
            </button>
            <button
              onClick={() => onToggleLayoutOrientation('stack')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                layoutOrientation === 'stack'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vertical Stacked View"
            >
              <AlignJustify className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Stack</span>
            </button>
          </div>
        )}
      </div>

      {/* LENS 1: CATEGORY FILTERING (DIRECTLY underneath toggle) */}
      {currentLens === 'category' && (
        <div className="flex flex-col gap-1.5 relative w-full pt-0.5" ref={categoryDropdownRef}>
          {/* Full-width Trigger Button listing categories */}
          <button
            type="button"
            onClick={() => {
              setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
              setIsOutcomeDropdownOpen(false)
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border font-bold text-xs transition-all cursor-pointer shadow-sm ${
              isCategoryFiltered
                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : isCategoryDropdownOpen
                ? 'bg-slate-800 border-slate-600 text-white'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
              <Filter className={`w-3.5 h-3.5 shrink-0 ${isCategoryFiltered ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="text-left text-xs font-bold leading-snug break-words">
                {activeCategoryLabel}
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180 text-emerald-400' : 'text-slate-400'}`} />
          </button>

          {/* Full-Opacity Category Dropdown Panel */}
          {isCategoryDropdownOpen && (
            <div 
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="w-full bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shadow-2xl space-y-3 z-30 animate-in fade-in slide-in-from-top-2"
            >
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-emerald-400" /> Filter by Category
                </span>
                {isCategoryFiltered && (
                  <button
                    type="button"
                    onClick={() => onToggleMainCategory('all')}
                    className="text-xs font-bold text-orange-400 hover:text-orange-300 underline cursor-pointer"
                  >
                    Reset to All
                  </button>
                )}
              </div>

              {/* 3-Col Categories Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MAIN_CATEGORIES.map(cat => {
                  const isActive = cat.id === 'all' ? isAllActive : selectedMainCategories?.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => onToggleMainCategory(cat.id)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all border cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)] scale-[1.02]'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="text-base leading-none">{cat.icon}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Subcategories if any */}
              {activeSubItems.length > 0 && onToggleSubCategory && (
                <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                    Subcategories:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeSubItems.map(sub => {
                      const isSubActive = selectedSubCategories?.includes(sub.id)
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => onToggleSubCategory(sub.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isSubActive
                              ? 'bg-teal-500/20 text-teal-200 border-teal-500/50 shadow-sm'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {sub.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active filter summary chips if filtered */}
          {isCategoryFiltered && (
            <div className="flex items-center flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 shrink-0">
                Active:
              </span>
              {selectedMainCategories.filter(c => c !== 'all').map(catId => {
                const match = MAIN_CATEGORIES.find(c => c.id === catId)
                return (
                  <span
                    key={catId}
                    className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex items-center gap-1 shrink-0"
                  >
                    <span>{match ? `${match.icon} ${match.label}` : catId}</span>
                    <button
                      type="button"
                      onClick={() => onToggleMainCategory(catId)}
                      className="hover:text-white text-emerald-400 cursor-pointer ml-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                )
              })}
              {selectedSubCategories.map(subId => {
                const subMatch = activeSubItems.find(s => s.id === subId)
                return (
                  <span
                    key={subId}
                    className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-teal-950/60 border border-teal-500/40 text-teal-200 flex items-center gap-1 shrink-0"
                  >
                    <span>{subMatch?.label || subId}</span>
                    <button
                      type="button"
                      onClick={() => onToggleSubCategory(subId)}
                      className="hover:text-white text-teal-400 cursor-pointer ml-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* LENS 2: OUTCOMES FILTERING (DIRECTLY underneath toggle) */}
      {currentLens === 'outcomes' && (
        <div className="flex flex-col gap-1.5 relative w-full pt-0.5" ref={outcomeDropdownRef}>
          {/* Full-width Trigger Button listing outcomes */}
          <button
            type="button"
            onClick={() => {
              setIsOutcomeDropdownOpen(!isOutcomeDropdownOpen)
              setIsCategoryDropdownOpen(false)
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border font-bold text-xs transition-all cursor-pointer shadow-sm ${
              selectedOutcomes.length > 0
                ? 'bg-purple-950/60 border-purple-500/60 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                : isOutcomeDropdownOpen
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
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOutcomeDropdownOpen ? 'rotate-180 text-purple-400' : 'text-slate-400'}`} />
            </div>
          </button>

          {/* Full-Opacity Outcomes Dropdown Panel (2-wide outcome grid) */}
          {isOutcomeDropdownOpen && (
            <div 
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="w-full bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shadow-2xl space-y-3 z-30 animate-in fade-in slide-in-from-top-2"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-purple-400" /> Filter by Functional Outcomes
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
                  value={outcomeSearchQuery}
                  onChange={(e) => setOutcomeSearchQuery(e.target.value)}
                  placeholder="Search trackable outcomes..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                />
                {outcomeSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setOutcomeSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Scrollable list of ranked outcomes: 2-WIDE GRID sectioned by Longevity vs Wellbeing */}
              <div className="overflow-y-auto max-h-80 p-0.5 scrollbar-thin space-y-3">
                {(() => {
                  const longevityOutcomes = filteredRankedOutcomes.filter(o => o.category === 'longevity')
                  const wellbeingOutcomes = filteredRankedOutcomes.filter(o => o.category !== 'longevity')

                  const renderButton = (item: typeof filteredRankedOutcomes[number]) => {
                    const isChecked = selectedOutcomes.some(sel => 
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
              {selectedOutcomes.map(outcomeName => (
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
      )}
    </div>
  )
}
