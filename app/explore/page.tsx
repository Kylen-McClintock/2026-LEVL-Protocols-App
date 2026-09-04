'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { 
  getModalities, 
  getProtocolsWithSteps, 
  getOrCreateUserProfile, 
  addToBench, 
  addProtocolToBench, 
  createDailyTask, 
  addProtocolToToday,
  getBenchItems,
  getDailyProtocolTasks
} from '@/lib/data'
import { Modality, UserProfile, UserBenchItem } from '@/lib/types'
import { CategoryFiltersBar, MainCategory, SUB_CATEGORIES_MAP } from '@/components/ui/ViewSelectorHeader'
import { SolarDiurnalSlider } from '@/components/ui/SolarDiurnalSlider'
import { getMacroCategory, MACRO_CATEGORIES } from '@/lib/utils/categories'
import { sortModalitiesByNBA } from '@/lib/ranking/nextBestAction'
import { calculateModalityPopularityScore, calculateProtocolPopularityScore } from '@/lib/ranking/popularityScore'
import Link from 'next/link'
import { Compass, Filter, ChevronDown, ChevronUp, X, Search, SlidersHorizontal, History, Scale, Sparkles, Trash2, ArrowRight, Info, Flame, Sun, Bookmark, HelpCircle } from 'lucide-react'
import ExploreCard from '@/components/cards/ExploreCard'
import ProtocolCard, { PROTOCOL_SYNERGY_MAP } from '@/components/cards/ProtocolCard'
import ModalityCompareModal from '@/components/modals/ModalityCompareModal'
import ProtocolCompareModal from '@/components/modals/ProtocolCompareModal'
import AlgorithmTransparencyModal from '@/components/modals/AlgorithmTransparencyModal'
import StackFitInspectorModal from '@/components/modals/StackFitInspectorModal'
import CreateCustomModalityModal from '@/components/modals/CreateCustomModalityModal'
import { StackFitResult } from '@/lib/synergy/stackFitEngine'
import { semanticSearchModalities, SemanticSearchResult } from '@/app/actions/search'
import { calculateModalityRelevance, calculateProtocolRelevance } from '@/lib/search/semanticRelevance'
import { Protocol } from '@/lib/types'

export default function ExplorePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [modalities, setModalities] = useState<Modality[]>([])
  const [protocols, setProtocols] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'modalities' | 'protocols'>('modalities')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const [todayModalityIds, setTodayModalityIds] = useState<Set<string>>(new Set())
  const [benchModalityIds, setBenchModalityIds] = useState<Set<string>>(new Set())
  const [todayProtocolIds, setTodayProtocolIds] = useState<Set<string>>(new Set())
  const [benchProtocolIds, setBenchProtocolIds] = useState<Set<string>>(new Set())
  const [activeModalitiesMap, setActiveModalitiesMap] = useState<Map<string, { modality: Modality, source: 'today' | 'bench' }>>(new Map())
  const [benchHistoryMap, setBenchHistoryMap] = useState<Map<string, UserBenchItem>>(new Map())
  const [filterBenchHistoryStatus, setFilterBenchHistoryStatus] = useState<'all' | 'tried_history' | 'benched' | 'eliminated'>('all')

  // Universal Comparison Dock State
  const [pinnedModalities, setPinnedModalities] = useState<Modality[]>([])
  const [pinnedProtocols, setPinnedProtocols] = useState<Protocol[]>([])

  const [compareModal, setCompareModal] = useState<{
    isOpen: boolean
    exploring: Modality | null
    active: Modality | null
    source: 'today' | 'bench'
  }>({
    isOpen: false,
    exploring: null,
    active: null,
    source: 'today'
  })

  const [protocolCompareModal, setProtocolCompareModal] = useState<{
    isOpen: boolean
    protocolA: Protocol | null
    protocolB: Protocol | null
  }>({
    isOpen: false,
    protocolA: null,
    protocolB: null
  })

  const [inspectStackFitModal, setInspectStackFitModal] = useState<{
    isOpen: boolean
    modality: Modality | null
    stackFit: StackFitResult | null
  }>({
    isOpen: false,
    modality: null,
    stackFit: null
  })

  const handlePinModality = (modality: Modality) => {
    setPinnedModalities(prev => {
      const exists = prev.some(m => m.id === modality.id)
      if (exists) {
        return prev.filter(m => m.id !== modality.id)
      }
      if (prev.length >= 2) {
        // Replace second
        return [prev[0], modality]
      }
      const updated = [...prev, modality]
      if (updated.length === 2) {
        setCompareModal({
          isOpen: true,
          exploring: updated[0],
          active: updated[1],
          source: todayModalityIds.has(updated[1].id) ? 'today' : 'bench'
        })
      }
      return updated
    })
  }

  const handlePinProtocol = (protocol: Protocol) => {
    setPinnedProtocols(prev => {
      const exists = prev.some(p => p.id === protocol.id)
      if (exists) {
        return prev.filter(p => p.id !== protocol.id)
      }
      if (prev.length >= 2) {
        return [prev[0], protocol]
      }
      const updated = [...prev, protocol]
      if (updated.length === 2) {
        setProtocolCompareModal({
          isOpen: true,
          protocolA: updated[0],
          protocolB: updated[1]
        })
      }
      return updated
    })
  }

  const [showFilters, setShowFilters] = useState(false)
  const [selectedMainCategories, setSelectedMainCategories] = useState<MainCategory[]>(['all'])
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([])
  const [diurnalRange, setDiurnalRange] = useState<[number, number]>([0, 4])
  const [selectedSpecificTimings, setSelectedSpecificTimings] = useState<string[]>([])
  const [filterCost, setFilterCost] = useState<string>('all')
  const [filterEffort, setFilterEffort] = useState<string>('all')
  const [filterEvidence, setFilterEvidence] = useState<string>('all')
  const [filterSafety, setFilterSafety] = useState<string>('all')

  const handleToggleSpecificTiming = (timingId: string) => {
    setSelectedSpecificTimings(prev => 
      prev.includes(timingId) ? prev.filter(id => id !== timingId) : [...prev, timingId]
    )
  }

  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>([])
  const [showAllOutcomes, setShowAllOutcomes] = useState(false)
  const [visibleCount, setVisibleCount] = useState(20)

  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SemanticSearchResult[]>([])
  const [searchSortMode, setSearchSortMode] = useState<'semantic' | 'hybrid'>('semantic')
  const [sortMode, setSortMode] = useState<'popularity' | 'nba' | 'evidence' | 'impact' | 'relevance'>('popularity')
  const [previousSortMode, setPreviousSortMode] = useState<'popularity' | 'nba' | 'evidence' | 'impact' | 'relevance' | null>(null)
  const [transparencyModal, setTransparencyModal] = useState<{
    isOpen: boolean
    tab: 'popularity' | 'nba' | 'evidence' | 'impact' | 'relevance'
  }>({
    isOpen: false,
    tab: 'popularity'
  })

  const observer = useRef<IntersectionObserver | null>(null)
  const lastElementRef = useCallback((node: any) => {
    if (loading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => prev + 20)
      }
    })
    if (node) observer.current.observe(node)
  }, [loading])

  const loadData = useCallback(async () => {
    const localUserId = getLocalUserId()
    const todayStr = new Date().toISOString().split('T')[0]

    const { getLatestBiomarkerMeasurements } = await import('@/lib/data/bloodworkData')

    const [fetchedProfile, allMods, allProtos, benchItems, todayTasks, userBiomarkers] = await Promise.all([
      getOrCreateUserProfile(localUserId),
      getModalities(true),
      getProtocolsWithSteps(),
      getBenchItems(localUserId),
      getDailyProtocolTasks(localUserId, todayStr),
      getLatestBiomarkerMeasurements(localUserId)
    ])

    const todayIds = new Set<string>()
    const benchIds = new Set<string>()
    const todayProtoIds = new Set<string>()
    const benchProtoIds = new Set<string>()
    const activeMap = new Map<string, { modality: Modality, source: 'today' | 'bench' }>()
    const bHistoryMap = new Map<string, UserBenchItem>()

    todayTasks.forEach(task => {
      const mId = task.modality_id || task.protocol_step?.modality_id
      if (mId) {
        todayIds.add(mId)
        const mod = allMods.find(m => m.id === mId)
        if (mod) activeMap.set(mId, { modality: mod, source: 'today' })
      }
      const pId = task.protocol_step?.protocol_id || (task as any).user_protocol_instance?.protocol_id
      if (pId) todayProtoIds.add(pId)
      if (task.protocol_step?.protocol?.name) todayProtoIds.add(task.protocol_step.protocol.name.toLowerCase())
    })

    benchItems.forEach(item => {
      if (item.protocol_id) {
        benchProtoIds.add(item.protocol_id)
      }
      if (item.modality_id) {
        bHistoryMap.set(item.modality_id, item)
        if (item.status === 'active' || item.status === 'benched') {
          benchIds.add(item.modality_id)
          if (!activeMap.has(item.modality_id)) {
            const mod = item.modality || allMods.find(m => m.id === item.modality_id)
            if (mod) activeMap.set(item.modality_id, { modality: mod, source: 'bench' })
          }
        }
      }
    })

    const biomarkerMap: Record<string, { raw_value: number; normalized_value: number; lab_flag?: string }> = {}
    userBiomarkers.forEach(b => {
      biomarkerMap[b.biomarker_id] = {
        raw_value: b.raw_value,
        normalized_value: b.normalized_value,
        lab_flag: b.lab_flag
      }
    })

    const ranked = sortModalitiesByNBA(allMods, fetchedProfile, { biomarkers: biomarkerMap })
    setProfile(fetchedProfile)
    setModalities(ranked)
    setProtocols(allProtos)
    setTodayModalityIds(todayIds)
    setBenchModalityIds(benchIds)
    setTodayProtocolIds(todayProtoIds)
    setBenchProtocolIds(benchProtoIds)
    setActiveModalitiesMap(activeMap)
    setBenchHistoryMap(bHistoryMap)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const MODALITY_FAMILIES = [
    // Thermal & Cold
    ['cold plunge', 'ice bath', 'cold shower', 'cryotherapy', 'cold exposure'],
    ['sauna', 'steam room', 'infrared sauna', 'heat exposure', 'thermal exposure'],
    
    // Mindfulness & Breathwork
    ['box breathing', 'wim hof', 'physiological sigh', '4-7-8', 'breathwork', 'holotropic', 'alternate nostril', 'anapanasati', 'coherent breathing', 'meditation', 'mindfulness'],
    
    // Strength & Resistance Training
    ['strength', 'resistance', 'weightlifting', 'hypertrophy', 'calisthenics', 'powerlifting', 'lifting', 'muscle building', 'kettlebell'],
    
    // Cardio & Endurance
    ['zone 2', 'aerobic base', 'incline walk', 'steady state cardio', 'endurance running', 'cycling', 'rowing'],
    ['vo2 max', 'sprint interval', 'hiit', 'zone 5', 'assault bike', 'tabata'],
    
    // Fasting & Nutrition
    ['fasting', 'time-restricted feeding', 'intermittent fast', 'water fast', 'autophagy fast', 'fasting window'],
    
    // Light & Photobiomodulation
    ['red light', 'photobiomodulation', 'pbm', 'light therapy', 'near infrared'],
    
    // Specific Supplement Families (Strict Ingredient/Mechanism Matching)
    ['creatine', 'creatine monohydrate'],
    ['magnesium', 'magnesium glycinate', 'magnesium l-threonate', 'magnesium citrate', 'magnesium malate'],
    ['omega-3', 'fish oil', 'dha', 'epa', 'krill oil'],
    ['vitamin d', 'vitamin d3', 'd3 + k2'],
    ['nmn', 'nr', 'nad+', 'nad booster', 'nicotinamide'],
    ['ashwagandha', 'rhodiola', 'holy basil', 'cortisol reducer'],
    ['l-theanine', 'caffeine + theanine'],
    ['coq10', 'ubiquinol']
  ]

  const getSimilarActiveModality = (mod: Modality) => {
    if (todayModalityIds.has(mod.id) || benchModalityIds.has(mod.id)) return null

    const modName = (mod.display_name || mod.name || '').toLowerCase()
    const modCat = (mod.category || '').toLowerCase()

    for (const active of Array.from(activeModalitiesMap.values())) {
      if (active.modality.id === mod.id) continue

      const actName = (active.modality.display_name || active.modality.name || '').toLowerCase()
      const actCat = (active.modality.category || '').toLowerCase()

      // 1. Explicit Modality Family Match (e.g. Resistance Training vs Strength Training, Cold Plunge vs Cold Shower)
      for (const family of MODALITY_FAMILIES) {
        const modInFamily = family.some(k => modName.includes(k) || modCat.includes(k))
        const actInFamily = family.some(k => actName.includes(k) || actCat.includes(k))
        if (modInFamily && actInFamily) {
          return active
        }
      }

      // 2. Strict Exact Specific Category Match (Excluding generic 'supplement', 'nutrition', 'other', 'general')
      const isGenericCategory = modCat.includes('supplement') || modCat.includes('nutrition') || modCat.includes('other') || modCat.includes('general')
      if (!isGenericCategory && modCat && actCat && modCat === actCat) {
        const modImpacts = mod.functional_impacts || {}
        const actImpacts = active.modality.functional_impacts || {}
        const sharedHighImpacts = Object.keys(modImpacts).filter(k => 
          (modImpacts[k]?.score || 0) >= 8 && (actImpacts[k]?.score || 0) >= 8
        )
        if (sharedHighImpacts.length >= 2) {
          return active
        }
      }
    }

    return null
  }

  // Search query updater: immediately switches to Direct Relevance when typing, and restores previous sort when cleared
  const handleUpdateSearchQuery = (query: string) => {
    setSearchQuery(query)
    if (query.trim().length > 0) {
      if (sortMode !== 'relevance' && !previousSortMode) {
        setPreviousSortMode(sortMode)
        setSortMode('relevance')
      }
    } else {
      setSearchResults([])
      if (previousSortMode) {
        setSortMode(previousSortMode)
        setPreviousSortMode(null)
      }
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    if (previousSortMode) {
      setSortMode(previousSortMode)
      setPreviousSortMode(null)
    }
  }

  // Auto-search when query changes (debounced)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true)
        try {
          const results = await semanticSearchModalities(searchQuery)
          if (results && results.length > 0) {
            setSearchResults(results)
          }
        } catch (e) {
          console.error(e)
        } finally {
          setIsSearching(false)
        }
      } else if (searchQuery.trim() === '') {
        setSearchResults([])
      }
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])


  const handleAddToBench = async (modalityId: string) => {
    const localUserId = getLocalUserId()
    await addToBench(localUserId, modalityId)
  }

  const handleAddToToday = async (modalityId: string) => {
    const localUserId = getLocalUserId()
    const dateStr = format(new Date(), 'yyyy-MM-dd')
    await createDailyTask(localUserId, dateStr, modalityId)
  }

  const handleAddProtocolToBench = async (protocolId: string) => {
    const localUserId = getLocalUserId()
    await addProtocolToBench(localUserId, protocolId)
    setBenchProtocolIds(prev => new Set([...Array.from(prev), protocolId]))
    const proto = protocols.find(p => p.id === protocolId)
    if (proto?.steps) {
      const stepModIds = proto.steps.map((s: any) => s.modality_id || s.modality?.id).filter(Boolean)
      setBenchModalityIds(prev => new Set([...Array.from(prev), ...stepModIds]))
    }
  }

  const handleAddProtocolToToday = async (protocolId: string) => {
    const localUserId = getLocalUserId()
    const dateStr = format(new Date(), 'yyyy-MM-dd')
    await addProtocolToToday(localUserId, dateStr, protocolId)
    setTodayProtocolIds(prev => new Set([...Array.from(prev), protocolId]))
    const proto = protocols.find(p => p.id === protocolId)
    if (proto?.steps) {
      const stepModIds = proto.steps.map((s: any) => s.modality_id || s.modality?.id).filter(Boolean)
      setTodayModalityIds(prev => new Set([...Array.from(prev), ...stepModIds]))
    }
  }

  const getProtocolActiveStatus = (protocol: Protocol | any): 'today' | 'bench' | null => {
    if (
      todayProtocolIds.has(protocol.id) || 
      todayProtocolIds.has(protocol.name?.toLowerCase()) ||
      (protocol.steps && protocol.steps.length > 0 && protocol.steps.some((s: any) => todayModalityIds.has(s.modality_id || s.modality?.id)))
    ) {
      return 'today'
    }
    if (
      benchProtocolIds.has(protocol.id) || 
      benchProtocolIds.has(protocol.name?.toLowerCase()) ||
      (protocol.steps && protocol.steps.length > 0 && protocol.steps.some((s: any) => benchModalityIds.has(s.modality_id || s.modality?.id)))
    ) {
      return 'bench'
    }
    return null
  }

  const handleToggleMainCategory = (cat: MainCategory) => {
    if (cat === 'all') {
      setSelectedMainCategories(['all'])
      setSelectedSubCategories([])
      return
    }

    setSelectedMainCategories(prev => {
      const current = prev.filter(c => c !== 'all')
      let updated: MainCategory[] = []
      if (current.includes(cat)) {
        updated = current.filter(c => c !== cat)
      } else {
        updated = [...current, cat]
      }

      if (updated.length === 0) {
        setSelectedSubCategories([])
        return ['all']
      }

      const newSubCategories: string[] = []
      updated.forEach(c => {
        const subs = SUB_CATEGORIES_MAP[c] || []
        subs.forEach(s => newSubCategories.push(s.id))
      })
      setSelectedSubCategories(newSubCategories)

      return updated
    })
  }

  const handleToggleSubCategory = (subId: string) => {
    setSelectedSubCategories(prev => {
      if (prev.includes(subId)) {
        return prev.filter(s => s !== subId)
      } else {
        return [...prev, subId]
      }
    })
  }

  const allOutcomesRaw = modalities.flatMap(m => m.functional_outcomes_to_track || [])
  const allAvailableOutcomes = Array.from(new Set(allOutcomesRaw)).filter(Boolean).sort()
  
  const preferredOutcomes = profile?.outcome_preference_scores ? Object.keys(profile.outcome_preference_scores).sort() : []
  const otherOutcomes = allAvailableOutcomes.filter(o => !preferredOutcomes.includes(o as string))
  
  const displayedOutcomes = showAllOutcomes ? [...preferredOutcomes, ...otherOutcomes] : preferredOutcomes

  const toggleOutcome = (outcome: string) => {
    setSelectedOutcomes(prev => 
      prev.includes(outcome) ? prev.filter(o => o !== outcome) : [...prev, outcome]
    )
  }

  // Precomputed semantic & lexical relevance map for modalities (runs O(N) on query change)
  const modalityRelevanceMap = useMemo(() => {
    const map = new Map<string, { isMatch: boolean; score: number }>()
    if (!searchQuery.trim()) return map
    modalities.forEach(mod => {
      map.set(mod.id, calculateModalityRelevance(mod, searchQuery, searchResults))
    })
    return map
  }, [modalities, searchQuery, searchResults])

  // Precomputed semantic & lexical relevance map for protocols (runs O(N) on query change)
  const protocolRelevanceMap = useMemo(() => {
    const map = new Map<string, { isMatch: boolean; score: number }>()
    if (!searchQuery.trim()) return map
    protocols.forEach(proto => {
      map.set(proto.id, calculateProtocolRelevance(proto, searchQuery))
    })
    return map
  }, [protocols, searchQuery])

  const filteredModalities = modalities.filter(mod => {
    if (filterBenchHistoryStatus === 'tried_history' && !benchHistoryMap.has(mod.id)) return false
    if (filterBenchHistoryStatus === 'benched') {
      const item = benchHistoryMap.get(mod.id)
      if (!item || (item.status !== 'benched' && item.status !== 'active')) return false
    }
    if (filterBenchHistoryStatus === 'eliminated') {
      const item = benchHistoryMap.get(mod.id)
      if (!item || item.status !== 'eliminated') return false
    }
    // Category Filtering with Multi-Select Main Categories & Sub-Categories
    const isAllMain = selectedMainCategories.includes('all') || selectedMainCategories.length === 0
    if (!isAllMain) {
      const modName = (mod.name || mod.display_name || '').toLowerCase()
      const modCategory = (mod.category || '').toLowerCase()
      const modType = (mod.modality_type || '').toLowerCase()
      const macroCategory = getMacroCategory(mod.category, mod.modality_type).toLowerCase()

      const matchesMain = selectedMainCategories.some(mc => {
        if (mc === 'peptides') {
          return macroCategory.includes('peptide') || modCategory.includes('peptide') || modType.includes('peptide') ||
            modName.includes('bpc') || modName.includes('tb-500') || modName.includes('tb500') || modName.includes('cjc') || modName.includes('ipamorelin') || modName.includes('semax') || modName.includes('selank') || modName.includes('epithalon') || modName.includes('epitalon') || modName.includes('ghk') || modName.includes('tirzepatide') || modName.includes('semaglutide') || modName.includes('retatrutide') || modName.includes('mots') || modName.includes('ss-31') || modName.includes('ss31') || modName.includes('elamipretide') || modName.includes('aod') || modName.includes('ta1') || modName.includes('ta-1') || modName.includes('thymosin') || modName.includes('pt141') || modName.includes('pt-141') || modName.includes('oxytocin') || modName.includes('bremelanotide') || modName.includes('sermorelin') || modName.includes('igf1') || modName.includes('igf-1') || modName.includes('lr3') || modName.includes('kisspeptin') || !!mod.peptide_metadata?.is_peptide
        }

        if (mc === 'fitness') {
          return macroCategory.includes('fitness') || macroCategory.includes('physical') || macroCategory.includes('movement') ||
            modCategory.includes('cardio') || modCategory.includes('strength') || modCategory.includes('workout') || modCategory.includes('exercise') || modCategory.includes('movement') || modCategory.includes('endurance') || modCategory.includes('hiit') || modCategory.includes('vo2') || modCategory.includes('aerobic') || modCategory.includes('resistance') || modCategory.includes('physical') || modCategory.includes('flexibility') || modCategory.includes('stretching') || modCategory.includes('recovery') ||
            modType.includes('exercise') || modType.includes('physical') ||
            modName.includes('vo2') || modName.includes('cpet') || modName.includes('hiit') || modName.includes('cardio') || modName.includes('sprint') || modName.includes('strength') || modName.includes('lifting') || modName.includes('workout') || modName.includes('exercise') || modName.includes('training') || modName.includes('running') || modName.includes('cycling') || modName.includes('walk') || modName.includes('rowing') || modName.includes('soleus') || modName.includes('handgrip') || modName.includes('calisthenics')
        }

        if (mc === 'nutrition') {
          return macroCategory.includes('nutrition') || macroCategory.includes('supplement') || macroCategory.includes('biochemistry') ||
            modCategory.includes('supplement') || modCategory.includes('fasting') || modCategory.includes('diet') || modCategory.includes('food') || modCategory.includes('nutraceutical') || modCategory.includes('biochemistry') || modCategory.includes('autophagy') ||
            modType.includes('supplement') || modType.includes('fasting') || modType.includes('nutrition') ||
            modName.includes('supplement') || modName.includes('fasting') || modName.includes('vitamin') || modName.includes('magnesium') || modName.includes('omega') || modName.includes('creatine') || modName.includes('protein') || modName.includes('diet') || modName.includes('berberine') || modName.includes('curcumin') || modName.includes('pudding')
        }

        if (mc === 'sleep') {
          return macroCategory.includes('sleep') || macroCategory.includes('circadian') || macroCategory.includes('recovery') ||
            modCategory.includes('sleep') || modCategory.includes('circadian') || modCategory.includes('light') || modCategory.includes('photobiomodulation') || modCategory.includes('wind_down') || modCategory.includes('evening') || modCategory.includes('night') ||
            modName.includes('sleep') || modName.includes('circadian') || modName.includes('light') || modName.includes('sauna') || modName.includes('mouth tap') || modName.includes('screen time') || modName.includes('caffeine') || modName.includes('bedtime')
        }

        if (mc === 'mind') {
          return macroCategory.includes('mind') || macroCategory.includes('nervous') || macroCategory.includes('mental') || macroCategory.includes('cognitive') ||
            modCategory.includes('mind') || modCategory.includes('mental') || modCategory.includes('nervous') || modCategory.includes('breath') || modCategory.includes('meditation') || modCategory.includes('cognitive') || modCategory.includes('vagal') || modCategory.includes('autonomic') || modCategory.includes('airway') || modCategory.includes('cranial') ||
            modType.includes('breathwork') || modType.includes('meditation') ||
            modName.includes('breath') || modName.includes('sigh') || modName.includes('meditat') || modName.includes('mindful') || modName.includes('focus') || modName.includes('optic flow') || modName.includes('nsdr') || modName.includes('yoga nidra') || modName.includes('wim hof')
        }

        if (mc === 'other') {
          return macroCategory.includes('other') || macroCategory.includes('tracking') || macroCategory.includes('diagnostic') || macroCategory.includes('cellular') || macroCategory.includes('longevity') ||
            modCategory.includes('diagnostic') || modCategory.includes('tracking') || modCategory.includes('screening') || modCategory.includes('biomarker') || modCategory.includes('lab') || modCategory.includes('genomic') || modCategory.includes('environmental') || modCategory.includes('skin') || modCategory.includes('hair') || modCategory.includes('cellular') || modCategory.includes('longevity') || modCategory.includes('pharmacotherapy') ||
            modType.includes('diagnostic_test') || modType.includes('prescription_supported') || modType.includes('hardware') ||
            modName.includes('mri') || modName.includes('dexa') || modName.includes('cac') || modName.includes('apob') || modName.includes('galleri') || modName.includes('grail') || modName.includes('dunedinpace') || modName.includes('abpm') || modName.includes('blood pressure') || modName.includes('oral') || modName.includes('pathogen') || modName.includes('metal') || modName.includes('rapamycin') || modName.includes('metformin')
        }

        return false
      })

      if (!matchesMain) return false

      if (selectedSubCategories.length > 0) {
        const matchesSub = selectedSubCategories.some(subId => {
          // 1. Injury & Joint Repair
          if (subId === 'injury_joint_repair' || subId === 'tissue_repair') {
            return modName.includes('bpc') || modName.includes('tb-500') || modName.includes('tb500') || modName.includes('kpv') || modName.includes('wolverine') || modName.includes('tissue') || modName.includes('repair') || modName.includes('joint') || modName.includes('tendon') || modName.includes('ligament') || modName.includes('cartilage') || modName.includes('collagen') || modCategory.includes('tissue') || modCategory.includes('repair') || modCategory.includes('thermal')
          }
          // 2. Fat Loss & Metabolism
          if (subId === 'fat_loss_metabolism' || subId === 'metabolic_glp1') {
            return modName.includes('tirzepatide') || modName.includes('semaglutide') || modName.includes('retatrutide') || modName.includes('glp') || modName.includes('aod') || modName.includes('mots') || modName.includes('tesamorelin') || modName.includes('lipolysis') || modName.includes('fat') || modName.includes('weight') || modName.includes('fasting') || modCategory.includes('fasting') || modCategory.includes('metabolic')
          }
          // 3. Muscle & Recovery
          if (subId === 'muscle_recovery' || subId === 'gh_secretagogues') {
            return modName.includes('cjc') || modName.includes('ipamorelin') || modName.includes('tesamorelin') || modName.includes('sermorelin') || modName.includes('igf') || modName.includes('ghrp') || modName.includes('growth hormone') || modName.includes('secretagogue') || modName.includes('muscle') || modName.includes('strength') || modName.includes('hypertrophy') || modName.includes('recovery') || modCategory.includes('strength')
          }
          // 4. Focus, Brain & Mood
          if (subId === 'focus_brain_mood' || subId === 'nootropics_brain') {
            return modName.includes('semax') || modName.includes('selank') || modName.includes('dihexa') || modName.includes('cerebrolysin') || modName.includes('p21') || modName.includes('focus') || modName.includes('brain') || modName.includes('mood') || modName.includes('optic flow') || modName.includes('sunlight') || modCategory.includes('mind') || modCategory.includes('cognitive')
          }
          // 5. Skin & Aesthetics
          if (subId === 'skin_aesthetics') {
            return modName.includes('ghk') || modName.includes('copper') || modName.includes('skin') || modName.includes('collagen') || modName.includes('hair') || modName.includes('dermatology') || modName.includes('red light') || modName.includes('photobiomodulation') || modCategory.includes('skin') || modCategory.includes('photobiomodulation')
          }
          // 6. Immunity & Gut Health
          if (subId === 'immunity_gut') {
            return modName.includes('ta1') || modName.includes('ta-1') || modName.includes('thymosin') || modName.includes('kpv') || modName.includes('bpc') || modName.includes('gut') || modName.includes('immune') || modName.includes('barrier') || modCategory.includes('immune') || modCategory.includes('gut')
          }
          // 7. Libido & Vitality
          if (subId === 'libido_vitality') {
            return modName.includes('pt141') || modName.includes('pt-141') || modName.includes('bremelanotide') || modName.includes('kisspeptin') || modName.includes('oxytocin') || modName.includes('libido') || modName.includes('sexual') || modCategory.includes('sexual') || modCategory.includes('vitality')
          }
          // 8. Cellular Longevity & Anti-Aging
          if (subId === 'cellular_longevity' || subId === 'longevity_biologics') {
            return modName.includes('epithalon') || modName.includes('epitalon') || modName.includes('ghk') || modName.includes('mots') || modName.includes('ss-31') || modName.includes('ss31') || modName.includes('foxo4') || modName.includes('thymalin') || modName.includes('rapamycin') || modName.includes('metformin') || modName.includes('longevity') || modName.includes('telomere') || modName.includes('mitochondria') || modCategory.includes('longevity') || modCategory.includes('cellular')
          }

          // Other fitness/nutrition/sleep/mind categories
          if (subId === 'cardio') return modCategory.includes('cardio') || modCategory.includes('endurance') || modCategory.includes('hiit') || modCategory.includes('vo2') || modCategory.includes('aerobic') || modName.includes('cardio') || modName.includes('vo2') || modName.includes('hiit') || modName.includes('cpet') || modName.includes('sprint') || modName.includes('run') || modName.includes('cycling') || modName.includes('walk')
          if (subId === 'strength') return modCategory.includes('strength') || modCategory.includes('resistance') || modCategory.includes('weight') || modCategory.includes('lifting') || modName.includes('strength') || modName.includes('lifting') || modName.includes('workout') || modName.includes('squat') || modName.includes('deadlift') || modName.includes('handgrip') || modName.includes('soleus')
          if (subId === 'flexibility') return modCategory.includes('flexibility') || modCategory.includes('stretch') || modCategory.includes('yoga') || modCategory.includes('mobility') || modName.includes('stretch') || modName.includes('flexibility') || modName.includes('yoga') || modName.includes('mobility')
          if (subId === 'thermal') return modCategory.includes('sauna') || modCategory.includes('cold') || modCategory.includes('heat') || modCategory.includes('thermal') || modCategory.includes('cryo') || modName.includes('sauna') || modName.includes('cold') || modName.includes('ice') || modName.includes('cryo')
          if (subId === 'supplements') return modCategory.includes('supplement') || modCategory.includes('stack') || modCategory.includes('vitamin') || modType.includes('supplement') || modName.includes('supplement') || modName.includes('vitamin') || modName.includes('magnesium') || modName.includes('omega') || modName.includes('creatine')
          if (subId === 'fasting') return modCategory.includes('fasting') || modCategory.includes('autophagy') || modType.includes('fasting') || modName.includes('fasting') || modName.includes('fast') || modName.includes('omad')
          if (subId === 'whole_foods') return modCategory.includes('diet') || modCategory.includes('food') || modCategory.includes('nutrition') || modName.includes('diet') || modName.includes('food') || modName.includes('pudding')
          if (subId === 'hygiene') return modCategory.includes('hygiene') || modCategory.includes('sleep') || modName.includes('sleep') || modName.includes('mouth tap') || modName.includes('screen')
          if (subId === 'circadian') return modCategory.includes('circadian') || modCategory.includes('light') || modName.includes('circadian') || modName.includes('light') || modName.includes('sunlight')
          if (subId === 'wind_down') return modCategory.includes('wind_down') || modCategory.includes('evening') || modName.includes('evening') || modName.includes('night') || modName.includes('bedtime')
          if (subId === 'nervous_system') return modCategory.includes('nervous') || modCategory.includes('vagus') || modName.includes('nervous') || modName.includes('vagus') || modName.includes('autonomic')
          if (subId === 'breathwork') return modCategory.includes('breath') || modCategory.includes('sigh') || modType.includes('breathwork') || modName.includes('breath') || modName.includes('sigh')
          if (subId === 'meditation') return modCategory.includes('meditation') || modCategory.includes('mindfulness') || modType.includes('meditation') || modName.includes('meditat') || modName.includes('mindful')
          if (subId === 'skin') return modCategory.includes('skin') || modCategory.includes('hair') || modCategory.includes('dermatology') || modName.includes('skin') || modName.includes('hair')
          if (subId === 'biomarkers') return modCategory.includes('diagnostic') || modCategory.includes('biomarker') || modCategory.includes('lab') || modCategory.includes('tracking') || modType.includes('diagnostic_test') || modName.includes('mri') || modName.includes('dexa') || modName.includes('cac') || modName.includes('apob') || modName.includes('vo2') || modName.includes('dunedinpace') || modName.includes('abpm') || modName.includes('scan') || modName.includes('test')
          if (subId === 'environmental') return modCategory.includes('environment') || modCategory.includes('toxin') || modCategory.includes('air') || modName.includes('toxin') || modName.includes('metal')
          return modCategory.includes(subId) || modName.includes(subId)
        })
        if (!matchesSub) return false
      }
    }

    // Diurnal Time-of-Day Range Filtering
    const [startSlot, endSlot] = diurnalRange
    if (startSlot !== 0 || endSlot !== 4) {
      const modName = (mod.name || mod.display_name || '').toLowerCase()
      const modTiming = ((mod as any).timing_preference || (mod as any).preferred_time || (mod as any).timing || (mod as any).optimal_timing || (mod as any).cadence_layer || mod.category || '').toLowerCase()

      const matchedSlots: number[] = []

      // Slot 0: Pre-Wake / Dawn
      if (modTiming.includes('pre_wake') || modTiming.includes('dawn') || modTiming.includes('early_morning') || modName.includes('morning sunlight') || modName.includes('delay caffeine')) {
        matchedSlots.push(0)
      }
      // Slot 1: Wake & Morning
      if (modTiming.includes('morning') || modTiming.includes('wake') || modTiming.includes('breakfast') || modTiming.includes('am') || modName.includes('morning') || modName.includes('creatine') || modName.includes('caffeine') || modName.includes('d3')) {
        matchedSlots.push(1)
      }
      // Slot 2: Midday / Afternoon
      if (modTiming.includes('midday') || modTiming.includes('afternoon') || modTiming.includes('lunch') || modTiming.includes('noon') || modTiming.includes('post_workout') || modTiming.includes('exercise') || modName.includes('soleus') || modName.includes('walk') || modName.includes('hiit') || modName.includes('cpet') || modName.includes('cardio') || modName.includes('strength')) {
        matchedSlots.push(2)
      }
      // Slot 3: Evening & Sunset
      if (modTiming.includes('evening') || modTiming.includes('sunset') || modTiming.includes('dinner') || modTiming.includes('pm') || modName.includes('evening') || modName.includes('sauna') || modName.includes('screen time')) {
        matchedSlots.push(3)
      }
      // Slot 4: Bedtime & Overnight
      if (modTiming.includes('bedtime') || modTiming.includes('night') || modTiming.includes('overnight') || modTiming.includes('sleep') || modTiming.includes('wind_down') || modName.includes('sleep') || modName.includes('magnesium') || modName.includes('mouth tap') || modName.includes('blue light')) {
        matchedSlots.push(4)
      }

      const isAnytimeOrDiagnostic = modTiming.includes('anytime') || modTiming.includes('flexible') || modTiming.includes('infrequent') || modTiming.includes('diagnostic') || modTiming.includes('tracking') || modTiming.includes('screening') || modName.includes('mri') || modName.includes('dexa') || modName.includes('cac') || modName.includes('apob') || modName.includes('rapamycin')

      if (!isAnytimeOrDiagnostic) {
        const slotsToTest = matchedSlots.length > 0 ? matchedSlots : [1, 2]
        const hasSlotMatch = slotsToTest.some(slot => slot >= startSlot && slot <= endSlot)
        if (!hasSlotMatch) return false
      }
    }

    // Specific Execution Timing Chips Filtering
    if (selectedSpecificTimings.length > 0) {
      const modName = (mod.name || mod.display_name || '').toLowerCase()
      const modSum = (mod.timing_summary || '').toLowerCase()
      const modInst = (mod.instructions || '').toLowerCase()
      const modProfileTiming = (((mod as any).relationships?.dosage_profile?.timing_preference) || '').toLowerCase()
      const modTiming = ((mod as any).timing_preference || (mod as any).preferred_time || mod.category || '').toLowerCase()

      const matchesAnySpecific = selectedSpecificTimings.some(timingId => {
        if (timingId === 'upon_waking') return modProfileTiming.includes('waking') || modTiming.includes('waking') || modSum.includes('waking') || modName.includes('sunlight') || modName.includes('delay caffeine')
        if (timingId === 'morning') return modProfileTiming.includes('morning') || modTiming.includes('morning') || modSum.includes('morning') || modSum.includes('breakfast')
        if (timingId === 'pre_meal') return modProfileTiming.includes('pre_meal') || modTiming.includes('pre_meal') || modSum.includes('pre-meal') || modInst.includes('pre-meal') || modName.includes('acetic acid') || modName.includes('berberine')
        if (timingId === 'post_meal') return modProfileTiming.includes('post_meal') || modTiming.includes('post_meal') || modSum.includes('post-meal') || modInst.includes('post-meal') || modName.includes('walk') || modName.includes('soleus')
        if (timingId === 'midday') return modProfileTiming.includes('midday') || modTiming.includes('midday') || modSum.includes('midday') || modSum.includes('afternoon')
        if (timingId === 'evening') return modProfileTiming.includes('evening') || modTiming.includes('evening') || modSum.includes('evening') || modSum.includes('sunset') || modName.includes('sauna')
        if (timingId === 'wind_down') return modProfileTiming.includes('wind_down') || modTiming.includes('wind_down') || modSum.includes('wind down') || modSum.includes('screen') || modName.includes('breathwork') || modName.includes('blue light')
        if (timingId === 'bedtime') return modProfileTiming.includes('bedtime') || modTiming.includes('bedtime') || modSum.includes('bedtime') || modSum.includes('overnight') || modName.includes('mouth tap') || modName.includes('sleep')
        if (timingId === 'fasting_window') return modProfileTiming.includes('fasting') || modTiming.includes('fasting') || modSum.includes('fasting') || modName.includes('fasting')
        if (timingId === 'infrequent') return modProfileTiming.includes('infrequent') || modTiming.includes('infrequent') || modSum.includes('infrequent') || modSum.includes('diagnostic') || modName.includes('mri') || modName.includes('dexa') || modName.includes('scan')

        return modProfileTiming.includes(timingId) || modTiming.includes(timingId) || modSum.includes(timingId)
      })

      if (!matchesAnySpecific) return false
    }

    if (filterCost !== 'all' && mod.cost_tier !== filterCost) return false
    if (filterEffort !== 'all' && mod.effort_level !== filterEffort) return false
    
    if (filterEvidence === 'high_evidence' && (mod.evidence_quality ?? 0) < 4) return false
    if (filterEvidence === 'emerging' && (mod.evidence_quality ?? 0) >= 4) return false
    
    if (filterSafety !== 'all' && mod.safety_level !== filterSafety) return false
    
    if (selectedOutcomes.length > 0) {
      const modOutcomes = mod.functional_outcomes_to_track || []
      const hasMatch = selectedOutcomes.some(o => modOutcomes.includes(o))
      if (!hasMatch) return false
    }
    
    if (searchQuery.trim().length > 0) {
      const rel = modalityRelevanceMap.get(mod.id)
      if (!rel || !rel.isMatch) return false
    }
    
    return true
  }).sort((a, b) => {
    const isSearchActive = searchQuery.trim().length > 0
    const relA = isSearchActive ? (modalityRelevanceMap.get(a.id)?.score || 0) : 0
    const relB = isSearchActive ? (modalityRelevanceMap.get(b.id)?.score || 0) : 0

    // Direct Relevance: strictly sorts by semantic and lexical match strength
    if (sortMode === 'relevance') {
      if (relB !== relA) return relB - relA
      return calculateModalityPopularityScore(b) - calculateModalityPopularityScore(a)
    }

    // When an active search query is present and the user selects a specific ranking criterion
    // (Popularity, NBA, Scientific Evidence, Longevity Benefit):
    // Group into Relevance Tiers so genuine strong matches (tier 2: score >= 300) rank ahead of secondary matches
    if (isSearchActive) {
      const tierA = relA >= 300 ? 2 : (relA >= 120 ? 1 : 0)
      const tierB = relB >= 300 ? 2 : (relB >= 120 ? 1 : 0)
      if (tierB !== tierA) return tierB - tierA
    }

    // 1. Most Popular & Proven: sorts by popularity score among the relevant matches
    if (sortMode === 'popularity') {
      const scoreA = calculateModalityPopularityScore(a)
      const scoreB = calculateModalityPopularityScore(b)
      if (scoreB !== scoreA) return scoreB - scoreA
      if (isSearchActive && relB !== relA) return relB - relA
      return 0
    }

    // 3. Recommended (Next Best Action)
    if (sortMode === 'nba') {
      const nbaDiff = (b.nba_result?.score || 0) - (a.nba_result?.score || 0)
      if (nbaDiff !== 0) return nbaDiff
    }
    
    // 4. Scientific Evidence
    if (sortMode === 'evidence') {
      const evDiff = (b.evidence_quality || 0) - (a.evidence_quality || 0)
      if (evDiff !== 0) return evDiff
    }
    
    // 5. Longevity Benefit
    if (sortMode === 'impact') {
      const impDiff = (b.overall_longevity_benefit || 0) - (a.overall_longevity_benefit || 0)
      if (impDiff !== 0) return impDiff
    }

    if (isSearchActive && relB !== relA) return relB - relA

    return calculateModalityPopularityScore(b) - calculateModalityPopularityScore(a)
  })



  const isProtocolCategoryMatch = (proto: any) => {
    const isAllMain = selectedMainCategories.includes('all') || selectedMainCategories.length === 0
    if (isAllMain && selectedSubCategories.length === 0) return true

    const pName = (proto.name || '').toLowerCase()
    const pDesc = (proto.description || '').toLowerCase()
    const pGoal = (proto.primary_goal || proto.goal || '').toLowerCase()
    const pVectors = Array.isArray(proto.target_vectors) ? proto.target_vectors.join(' ').toLowerCase() : ''
    const stepCats = (proto.steps || proto.protocol_steps || [])
      .map((s: any) => `${s.modality?.category || ''} ${s.modality?.modality_type || ''} ${s.modality?.display_name || s.modality?.name || ''}`)
      .join(' ')
      .toLowerCase()

    const fullText = `${pName} ${pDesc} ${pGoal} ${pVectors} ${stepCats}`

    if (!isAllMain) {
      const matchesMain = selectedMainCategories.some(mc => {
        if (mc === 'peptides') {
          return fullText.includes('peptide') || fullText.includes('bpc') || fullText.includes('tb-500') || fullText.includes('tb500') || fullText.includes('cjc') || fullText.includes('ipamorelin') || fullText.includes('ghk') || fullText.includes('tesamorelin') || fullText.includes('mots') || fullText.includes('semax') || fullText.includes('selank') || fullText.includes('kpv') || fullText.includes('klow') || fullText.includes('glow') || fullText.includes('wolverine') || fullText.includes('retatrutide') || fullText.includes('reta') || fullText.includes('ss-31') || fullText.includes('ss31') || fullText.includes('epitalon') || fullText.includes('epithalon') || fullText.includes('secretagogue') || fullText.includes('growth hormone') || fullText.includes('ta1') || fullText.includes('thymosin') || fullText.includes('aod') || fullText.includes('pt141') || fullText.includes('pt-141') || fullText.includes('oxytocin') || fullText.includes('intimacy') || fullText.includes('shred') || fullText.includes('sermorelin') || fullText.includes('igf') || fullText.includes('lr3') || fullText.includes('visceral') || fullText.includes('overhaul') || fullText.includes('kisspeptin') || fullText.includes('lipolysis') || fullText.includes('sexual health') || fullText.includes('immune balance') || fullText.includes('skin longevity')
        }
        if (mc === 'fitness') {
          return fullText.includes('fitness') || fullText.includes('training') || fullText.includes('exercise') || fullText.includes('cardio') || fullText.includes('strength') || fullText.includes('split') || fullText.includes('ppl') || fullText.includes('run') || fullText.includes('marathon') || fullText.includes('vo2') || fullText.includes('hiit') || fullText.includes('hypertrophy') || fullText.includes('push') || fullText.includes('pull') || fullText.includes('legs')
        }
        if (mc === 'nutrition') {
          return fullText.includes('nutrition') || fullText.includes('diet') || fullText.includes('fasting') || fullText.includes('fmd') || fullText.includes('supplement') || fullText.includes('stack') || fullText.includes('nmn') || fullText.includes('fisetin') || fullText.includes('autophagy') || fullText.includes('sinclair') || fullText.includes('longo')
        }
        if (mc === 'sleep') {
          return fullText.includes('sleep') || fullText.includes('circadian') || fullText.includes('light') || fullText.includes('night') || fullText.includes('recovery') || fullText.includes('wind_down') || fullText.includes('walker')
        }
        if (mc === 'mind') {
          return fullText.includes('mind') || fullText.includes('breath') || fullText.includes('meditat') || fullText.includes('hrv') || fullText.includes('vagal') || fullText.includes('hof') || fullText.includes('nervous')
        }
        if (mc === 'other') {
          return fullText.includes('diagnostic') || fullText.includes('screening') || fullText.includes('mri') || fullText.includes('longevity') || fullText.includes('blueprint') || fullText.includes('cellular') || fullText.includes('epigenetic') || fullText.includes('brecka') || fullText.includes('superhuman')
        }
        return false
      })
      if (!matchesMain) return false
    }

    if (selectedSubCategories.length > 0) {
      const matchesSub = selectedSubCategories.some(subId => {
        // 1. Injury & Joint Repair
        if (subId === 'injury_joint_repair' || subId === 'tissue_repair') {
          return fullText.includes('wolverine') || fullText.includes('repair') || fullText.includes('injury') || fullText.includes('joint') || fullText.includes('tendon') || fullText.includes('ligament') || fullText.includes('bpc') || fullText.includes('tb-500') || fullText.includes('tb500') || fullText.includes('kpv') || fullText.includes('thermal recovery') || fullText.includes('tissue')
        }
        // 2. Fat Loss & Metabolism
        if (subId === 'fat_loss_metabolism' || subId === 'metabolic_glp1') {
          return fullText.includes('lipolysis') || fullText.includes('fat loss') || fullText.includes('visceral') || fullText.includes('recomp') || fullText.includes('metabolic') || fullText.includes('aod') || fullText.includes('tirzepatide') || fullText.includes('retatrutide') || fullText.includes('semaglutide') || fullText.includes('mots') || fullText.includes('zone2') || fullText.includes('biogenesis') || fullText.includes('fasting')
        }
        // 3. Muscle & Recovery
        if (subId === 'muscle_recovery' || subId === 'gh_secretagogues') {
          return fullText.includes('muscle') || fullText.includes('growth hormone') || fullText.includes('hypertrophy') || fullText.includes('somatotropic') || fullText.includes('anabolic') || fullText.includes('cjc') || fullText.includes('ipamorelin') || fullText.includes('sermorelin') || fullText.includes('igf') || fullText.includes('sleep reset') || fullText.includes('strength')
        }
        // 4. Focus, Brain & Mood
        if (subId === 'focus_brain_mood' || subId === 'nootropics_brain') {
          return fullText.includes('semax') || fullText.includes('selank') || fullText.includes('cognitive') || fullText.includes('focus') || fullText.includes('brain') || fullText.includes('neuro') || fullText.includes('synaptic') || fullText.includes('flow') || fullText.includes('mind') || fullText.includes('mood')
        }
        // 5. Skin & Aesthetics
        if (subId === 'skin_aesthetics') {
          return fullText.includes('skin') || fullText.includes('glow') || fullText.includes('klow') || fullText.includes('photonic') || fullText.includes('collagen') || fullText.includes('dermal') || fullText.includes('aesthetics') || fullText.includes('ghk') || fullText.includes('epitalon skin') || fullText.includes('red light')
        }
        // 6. Immunity & Gut Health
        if (subId === 'immunity_gut') {
          return fullText.includes('immune') || fullText.includes('gut') || fullText.includes('ta1') || fullText.includes('thymosin') || fullText.includes('kpv') || fullText.includes('mucosal') || fullText.includes('barrier') || fullText.includes('leaky gut')
        }
        // 7. Libido & Vitality
        if (subId === 'libido_vitality') {
          return fullText.includes('sexual') || fullText.includes('libido') || fullText.includes('pt141') || fullText.includes('pt-141') || fullText.includes('kisspeptin') || fullText.includes('oxytocin') || fullText.includes('intimacy') || fullText.includes('vitality')
        }
        // 8. Cellular Longevity & Anti-Aging
        if (subId === 'cellular_longevity' || subId === 'longevity_biologics') {
          return fullText.includes('longevity') || fullText.includes('epigenetic') || fullText.includes('telomere') || fullText.includes('blueprint') || fullText.includes('sinclair') || fullText.includes('biologics') || fullText.includes('epitalon') || fullText.includes('ss-31') || fullText.includes('mots') || fullText.includes('senolytic') || fullText.includes('fmd') || fullText.includes('stem cell')
        }

        const cleanSub = subId.replace('_', ' ')
        return fullText.includes(cleanSub) || fullText.includes(subId)
      })
      if (!matchesSub) return false
    }

    return true
  }

  const filteredProtocols = protocols.filter(proto => {
    // Category match
    if (!isProtocolCategoryMatch(proto)) return false

    // Cost, Effort, Evidence, Safety filters
    if (filterCost !== 'all' && (proto.cost_tier && proto.cost_tier !== filterCost)) return false
    if (filterEffort !== 'all' && (proto.difficulty_level && proto.difficulty_level !== filterEffort)) return false
    if (filterEvidence === 'high_evidence' && proto.evidence_level && !['Level A', 'Meta-Analysis', 'High', 'RCT'].some(lvl => (proto.evidence_level || '').includes(lvl))) return false
    if (filterSafety !== 'all' && (proto.safety_level && proto.safety_level !== filterSafety)) return false

    // Search query: filter down to relevant protocol matches
    if (searchQuery.trim().length > 0) {
      const rel = protocolRelevanceMap.get(proto.id)
      if (!rel || !rel.isMatch) return false
    }

    return true
  }).sort((a, b) => {
    const isSearchActive = searchQuery.trim().length > 0
    const relA = isSearchActive ? (protocolRelevanceMap.get(a.id)?.score || 0) : 0
    const relB = isSearchActive ? (protocolRelevanceMap.get(b.id)?.score || 0) : 0

    // Direct Relevance: strictly sorts by semantic and lexical match strength
    if (sortMode === 'relevance') {
      if (relB !== relA) return relB - relA
      return calculateProtocolPopularityScore(b) - calculateProtocolPopularityScore(a)
    }

    // When an active search query is present and the user selects a specific ranking criterion:
    // Group into Relevance Tiers so genuine strong matches (tier 2: score >= 300) rank ahead of secondary matches
    if (isSearchActive) {
      const tierA = relA >= 300 ? 2 : (relA >= 120 ? 1 : 0)
      const tierB = relB >= 300 ? 2 : (relB >= 120 ? 1 : 0)
      if (tierB !== tierA) return tierB - tierA
    }

    // 1. Most Popular & Proven: sorts by popularity score among the relevant matches
    if (sortMode === 'popularity') {
      const scoreA = calculateProtocolPopularityScore(a)
      const scoreB = calculateProtocolPopularityScore(b)
      if (scoreB !== scoreA) return scoreB - scoreA
      if (isSearchActive && relB !== relA) return relB - relA
      return 0
    }

    if (isSearchActive && relB !== relA) return relB - relA

    return calculateProtocolPopularityScore(b) - calculateProtocolPopularityScore(a)
  })

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center animate-pulse text-levl-text-secondary">
        Loading global library...
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pt-6 sm:pt-8 pb-32">
      <header className="mb-6 space-y-4">
        {/* Quick Hub Navigation Cards: Today & Bench */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/today"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-slate-900/90 to-sky-950/40 border border-sky-500/20 hover:border-sky-400/50 transition-all shadow-md group backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform shrink-0">
                <Sun size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">Today</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 uppercase tracking-wider">Active Plan</span>
                </div>
                <p className="text-xs text-slate-400 truncate">Your daily protocol tasks &amp; check-in</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all mr-1 shrink-0" />
          </Link>

          <Link
            href="/bench"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-slate-900/90 to-purple-950/40 border border-purple-500/20 hover:border-purple-400/50 transition-all shadow-md group backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform shrink-0">
                <Bookmark size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">My Bench</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 uppercase tracking-wider">Saved</span>
                </div>
                <p className="text-xs text-slate-400 truncate">Saved &amp; inactive modalities to activate anytime</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all mr-1 shrink-0" />
          </Link>
        </div>

        <div className="space-y-2 pt-2">
          {/* Top Row: Title & Action Buttons */}
          <div className="flex justify-between items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Compass size={24} className="text-levl-accent" /> Explore
              </h1>
              <p className="text-levl-text-secondary text-xs sm:text-sm">Discover what works for you.</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/20 cursor-pointer active:scale-95"
              >
                <Sparkles size={13} />
                <span>+ Create Modality</span>
              </button>
              <Link
                href="/guide#explore"
                className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-600/50 text-purple-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                title="View Explore Catalog Guide"
              >
                <HelpCircle size={13} className="text-purple-400" /> Guide
              </Link>
            </div>
          </div>

          {/* Full-Width Sort & Count Status Row */}
          <div className="w-full flex items-center justify-between gap-2 text-xs text-levl-accent font-medium pt-0.5">
            <span className="flex items-center gap-1.5">
              {searchQuery.trim().length > 0 && sortMode === 'relevance' ? '🔤 Ranked by Direct Relevance to Search' :
               searchQuery.trim().length > 0 && sortMode === 'popularity' ? '🔥 Most Popular among Relevant Search Matches' :
               searchQuery.trim().length > 0 && sortMode === 'evidence' ? '⭐ Highest Evidence among Relevant Search Matches' :
               searchQuery.trim().length > 0 && sortMode === 'impact' ? '📈 Highest Impact among Relevant Search Matches' :
               searchQuery.trim().length > 0 && sortMode === 'nba' ? '★ Next Best Action among Relevant Search Matches' :
               sortMode === 'popularity' ? '🔥 Sorted by Cultural Popularity & Proven Efficacy' :
               sortMode === 'nba' ? '★ Sorted by Next Best Action' :
               sortMode === 'evidence' ? '⭐ Sorted by Scientific Evidence' :
               sortMode === 'impact' ? '📈 Sorted by Longevity Benefit' :
               '🔤 Sorted by Direct Relevance'}
            </span>
            <span className="text-slate-400 font-mono text-[11px] shrink-0">
              ({activeTab === 'modalities' ? `${filteredModalities.length} modalities` : `${filteredProtocols.length} protocols`})
            </span>
          </div>
        </div>

        <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
          <button 
            onClick={() => setActiveTab('modalities')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${activeTab === 'modalities' ? 'bg-levl-accent/20 text-levl-accent border border-levl-accent/30 shadow-sm shadow-levl-accent/10' : 'text-gray-400 hover:text-white'}`}
          >
            Modalities ({modalities.length})
          </button>
          <button 
            onClick={() => setActiveTab('protocols')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${activeTab === 'protocols' ? 'bg-levl-accent/20 text-levl-accent border border-levl-accent/30 shadow-sm shadow-levl-accent/10' : 'text-gray-400 hover:text-white'}`}
          >
            Protocols ({protocols.length})
          </button>
        </div>

        {/* Global Search Bar (Works for both Modalities and Protocols) */}
        <form 
          onSubmit={async (e) => {
            e.preventDefault()
            if (!searchQuery.trim()) {
              setSearchResults([])
              return
            }
            setIsSearching(true)
            try {
              const results = await semanticSearchModalities(searchQuery)
              if (results && results.length > 0) {
                setSearchResults(results)
              }
            } catch (err) {
              console.error(err)
            } finally {
              setIsSearching(false)
            }
          }}
          className="mt-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="search"
              value={searchQuery}
              onChange={(e) => handleUpdateSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'modalities'
                  ? "Semantic Search (e.g. 'how do I sleep better?')"
                  : "Search protocols (e.g. 'Bryan Johnson Blueprint', 'Push Pull Legs', 'Sleep', 'FMD')"
              }
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-levl-accent/50 focus:ring-1 focus:ring-levl-accent/50 transition-all"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-levl-accent/30 border-t-levl-accent rounded-full animate-spin" />
            )}
            {searchQuery && !isSearching && (
              <button 
                type="button" 
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </form>

        {/* Sort Bar */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[10px] text-gray-500 uppercase font-semibold mr-1 shrink-0">Sort:</span>
          
          <button 
            type="button"
            onClick={() => setSortMode('popularity')}
            className={`px-2.5 py-1 rounded-lg border text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${sortMode === 'popularity' ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm shadow-amber-500/10' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
          >
            <Flame size={12} className={sortMode === 'popularity' ? 'text-amber-400' : 'text-gray-400'} />
            Most Popular & Proven
          </button>

          <button 
            type="button"
            onClick={() => setSortMode('nba')}
            className={`px-2.5 py-1 rounded-lg border text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${sortMode === 'nba' ? 'bg-levl-accent/20 border-levl-accent text-levl-accent font-bold shadow-sm' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
          >
            ★ Recommended (NBA)
          </button>

          <button 
            type="button"
            onClick={() => setSortMode('evidence')}
            className={`px-2.5 py-1 rounded-lg border text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${sortMode === 'evidence' ? 'bg-levl-accent/20 border-levl-accent text-levl-accent font-bold shadow-sm' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
          >
            ⭐ Scientific Evidence
          </button>

          <button 
            type="button"
            onClick={() => setSortMode('impact')}
            className={`px-2.5 py-1 rounded-lg border text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${sortMode === 'impact' ? 'bg-levl-accent/20 border-levl-accent text-levl-accent font-bold shadow-sm' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
          >
            📈 Longevity Benefit
          </button>

          <button 
            type="button"
            onClick={() => setSortMode('relevance')}
            className={`px-2.5 py-1 rounded-lg border text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${sortMode === 'relevance' ? 'bg-levl-accent/20 border-levl-accent text-levl-accent font-bold shadow-sm' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
          >
            🔤 Direct Relevance
          </button>

          <button
            type="button"
            onClick={() => setTransparencyModal({ isOpen: true, tab: sortMode })}
            className="ml-auto px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer text-[11px]"
            title="Inspect Ranking Algorithm Weights & Transparency"
          >
            <Info size={13} className="text-purple-400" />
            <span className="hidden sm:inline font-medium">How rankings work</span>
          </button>
        </div>

        {/* Always Present Category Bar Underneath Sort Row */}
        <div className="mt-2 mb-1">
          <CategoryFiltersBar 
            selectedMainCategories={selectedMainCategories}
            selectedSubCategories={selectedSubCategories}
            onToggleMainCategory={handleToggleMainCategory}
            onToggleSubCategory={handleToggleSubCategory}
          />
        </div>

        {/* Prominent Expandable Button for Detailed Filters */}
        <button 
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer mt-2 shadow-sm ${
            showFilters || diurnalRange[0] !== 0 || diurnalRange[1] !== 4 || selectedSpecificTimings.length > 0 || filterBenchHistoryStatus !== 'all' || filterCost !== 'all' || filterEffort !== 'all' || filterEvidence !== 'all' || filterSafety !== 'all' || selectedOutcomes.length > 0
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 shadow-md shadow-emerald-950/40'
              : 'bg-slate-900/90 text-slate-200 border-slate-800 hover:border-slate-700 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span>Advanced Library Filters</span>
            {(diurnalRange[0] !== 0 || diurnalRange[1] !== 4 || selectedSpecificTimings.length > 0 || filterBenchHistoryStatus !== 'all' || filterCost !== 'all' || filterEffort !== 'all' || filterEvidence !== 'all' || filterSafety !== 'all' || selectedOutcomes.length > 0) && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500 text-black font-extrabold ml-1">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-[11px] font-medium hidden sm:inline">{showFilters ? 'Hide' : 'Time of Day, Outcomes, History, Cost & Safety'}</span>
            {showFilters ? <ChevronUp size={16} className="text-emerald-400" /> : <ChevronDown size={16} />}
          </div>
        </button>
      </header>

      {showFilters && (
        <div className="mb-6 p-4 bg-black/40 border border-white/5 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold uppercase text-levl-text-secondary">Detailed Library Filters</h3>
            {(diurnalRange[0] !== 0 || diurnalRange[1] !== 4 || selectedSpecificTimings.length > 0 || filterBenchHistoryStatus !== 'all' || filterCost !== 'all' || filterEffort !== 'all' || filterEvidence !== 'all' || filterSafety !== 'all' || selectedOutcomes.length > 0) && (
              <button 
                onClick={() => {
                  setSelectedMainCategories(['all'])
                  setSelectedSubCategories([])
                  setDiurnalRange([0, 4])
                  setSelectedSpecificTimings([])
                  setFilterCost('all')
                  setFilterEffort('all')
                  setFilterEvidence('all')
                  setFilterSafety('all')
                  setSelectedOutcomes([])
                  setFilterBenchHistoryStatus('all')
                }}
                className="text-xs text-red-400 flex items-center gap-1 hover:text-red-300 cursor-pointer"
              >
                <X size={12} /> Clear detailed filters
              </button>
            )}
          </div>

          <div className="space-y-2 pb-2 border-b border-white/10">
            <div className="flex justify-between items-end">
              <label className="text-xs text-gray-400">Functional Outcomes</label>
              {otherOutcomes.length > 0 && (
                <button 
                  onClick={() => setShowAllOutcomes(!showAllOutcomes)}
                  className="text-xs text-levl-accent hover:underline cursor-pointer"
                >
                  {showAllOutcomes ? 'Show Preferred Only' : `Show All (${allAvailableOutcomes.length})`}
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {displayedOutcomes.map(outcome => {
                const isSelected = selectedOutcomes.includes(outcome as string)
                const isPreferred = preferredOutcomes.includes(outcome as string)
                return (
                  <button
                    key={outcome as string}
                    onClick={() => toggleOutcome(outcome as string)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-levl-accent/20 border-levl-accent text-levl-accent'
                        : isPreferred
                        ? 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20'
                        : 'bg-black/20 border-white/5 text-gray-500 hover:border-white/10'
                    }`}
                  >
                    {isPreferred && !isSelected && '★ '}{outcome}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Cost Tier</label>
              <select 
                value={filterCost} 
                onChange={(e) => setFilterCost(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-white"
              >
                <option value="all">All Costs</option>
                <option value="free">Free</option>
                <option value="low">Low ($)</option>
                <option value="medium">Medium ($$)</option>
                <option value="high">High ($$$)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Effort Level</label>
              <select 
                value={filterEffort} 
                onChange={(e) => setFilterEffort(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-white"
              >
                <option value="all">All Effort Levels</option>
                <option value="low">Low Effort</option>
                <option value="medium">Medium Effort</option>
                <option value="high">High Effort</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Evidence Quality</label>
              <select 
                value={filterEvidence} 
                onChange={(e) => setFilterEvidence(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-white"
              >
                <option value="all">All Evidence</option>
                <option value="high_evidence">High Evidence Only (4★+)</option>
                <option value="emerging">Emerging / Mechanistic</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Safety Level</label>
              <select 
                value={filterSafety} 
                onChange={(e) => setFilterSafety(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-white"
              >
                <option value="all">All Safety Levels</option>
                <option value="high">High Safety (General Public)</option>
                <option value="medium">Moderate Safety</option>
                <option value="caution">Clinical Caution</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'modalities' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 items-start">
            {filteredModalities.length === 0 ? (
              <div className="col-span-full text-center p-8 bg-white/5 rounded-2xl text-gray-400 text-sm space-y-3">
                <p>No modalities found matching your search and filter criteria.</p>
                <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/20 cursor-pointer active:scale-95"
                  >
                    <Sparkles size={13} />
                    <span>+ Create Custom Modality</span>
                  </button>
                  {(searchQuery || selectedMainCategories.length > 1 || selectedMainCategories[0] !== 'all' || selectedSubCategories.length > 0 || showFilters) && (
                    <button
                      type="button"
                      onClick={() => {
                        handleClearSearch()
                        setSelectedMainCategories(['all'])
                        setSelectedSubCategories([])
                        setDiurnalRange([0, 4])
                        setSelectedSpecificTimings([])
                        setFilterCost('all')
                        setFilterEffort('all')
                        setFilterEvidence('all')
                        setFilterSafety('all')
                        setSelectedOutcomes([])
                        setFilterBenchHistoryStatus('all')
                      }}
                      className="px-3 py-1.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 font-bold text-xs hover:bg-orange-500/30 cursor-pointer"
                    >
                      Reset Search &amp; Filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              filteredModalities.slice(0, visibleCount).map((mod, index) => {
                const isLast = index === visibleCount - 1
                const relScore = modalityRelevanceMap.get(mod.id)?.score
                const searchScore = searchQuery 
                  ? (searchResults.find(r => r.id === mod.id)?.similarity || (relScore ? Math.min(0.99, Number((relScore / 1200).toFixed(2))) : undefined)) 
                  : undefined
                
                return (
                  <div key={mod.id} ref={isLast ? lastElementRef : null} className="min-w-0 w-full">
                    <ExploreCard 
                      modality={mod}
                      userProfile={profile}
                      searchScore={searchScore}
                      popularityScore={sortMode === 'popularity' ? calculateModalityPopularityScore(mod) : undefined}
                      todayModalities={modalities.filter(m => todayModalityIds.has(m.id))}
                      benchModalities={modalities.filter(m => benchModalityIds.has(m.id))}
                      activeStatus={
                        todayModalityIds.has(mod.id)
                          ? 'today'
                          : benchModalityIds.has(mod.id)
                          ? 'bench'
                          : null
                      }
                      benchHistoryItem={benchHistoryMap.get(mod.id)}
                      similarActiveModality={getSimilarActiveModality(mod)}
                      onAddToBench={handleAddToBench}
                      onAddToToday={handleAddToToday}
                      onCompare={(exploring, active, source) => {
                        setCompareModal({
                          isOpen: true,
                          exploring,
                          active,
                          source
                        })
                      }}
                      onPinForCompare={handlePinModality}
                      onInspectStackFit={(exploring, fit) => {
                        setInspectStackFitModal({
                          isOpen: true,
                          modality: exploring,
                          stackFit: fit
                        })
                      }}
                      isPinnedForCompare={pinnedModalities.some(m => m.id === mod.id)}
                    />
                  </div>
                )
              })
            )}
            
            {visibleCount < filteredModalities.length && (
              <div className="col-span-full py-4 text-center text-sm text-gray-500 animate-pulse">
                Loading more...
              </div>
            )}
          </div>
        </>
      ) : (
        /* Protocols 2-Wide Responsive Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 items-start animate-in fade-in slide-in-from-right-4">
          {filteredProtocols.length === 0 ? (
            <div className="col-span-full text-center p-8 bg-white/5 rounded-2xl text-gray-400 text-sm space-y-3">
              <p>No protocols found matching your search and filter criteria.</p>
              {(searchQuery || selectedMainCategories.length > 1 || selectedMainCategories[0] !== 'all' || selectedSubCategories.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    handleClearSearch()
                    setSelectedMainCategories(['all'])
                    setSelectedSubCategories([])
                    setFilterCost('all')
                    setFilterEffort('all')
                    setFilterEvidence('all')
                    setFilterSafety('all')
                  }}
                  className="px-3 py-1.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 font-bold text-xs hover:bg-orange-500/30 cursor-pointer"
                >
                  Reset Search &amp; Filters
                </button>
              )}
            </div>
          ) : (
            filteredProtocols.map(protocol => (
              <div key={protocol.id} className="min-w-0 w-full">
                <ProtocolCard 
                  protocol={protocol}
                  activeStatus={getProtocolActiveStatus(protocol)}
                  onAddToBench={handleAddProtocolToBench}
                  onAddToToday={handleAddProtocolToToday}
                  onCompare={handlePinProtocol}
                  isPinnedForCompare={pinnedProtocols.some(p => p.id === protocol.id)}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Floating Universal Compare Dock */}
      {(pinnedModalities.length > 0 || pinnedProtocols.length > 0) && (
        <div className="fixed bottom-20 sm:bottom-6 inset-x-3 sm:inset-x-auto sm:right-8 sm:left-auto z-40 sm:z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-slate-950/95 border border-purple-500/50 p-3 sm:p-4 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center gap-3 sm:gap-4 max-w-xl">
            <div className="flex items-center gap-2 flex-1 min-w-0 w-full sm:w-auto">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0">
                <Scale size={18} className="text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>Compare Tray</span>
                  <span className="text-[10px] bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full font-mono font-bold">
                    {pinnedModalities.length > 0 ? `${pinnedModalities.length}/2 Modalities` : `${pinnedProtocols.length}/2 Protocols`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {pinnedModalities.map(m => (
                    <span key={m.id} className="text-[11px] bg-slate-900 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-lg flex items-center gap-1 truncate max-w-[140px]">
                      <span className="truncate">{m.name}</span>
                      <button onClick={() => handlePinModality(m)} className="hover:text-red-400 cursor-pointer">×</button>
                    </span>
                  ))}
                  {pinnedProtocols.map(p => (
                    <span key={p.id} className="text-[11px] bg-slate-900 border border-slate-700 text-teal-300 px-2 py-0.5 rounded-lg flex items-center gap-1 truncate max-w-[140px]">
                      <span className="truncate">{p.name}</span>
                      <button onClick={() => handlePinProtocol(p)} className="hover:text-red-400 cursor-pointer">×</button>
                    </span>
                  ))}
                  {pinnedModalities.length === 1 && (
                    <span className="text-[10px] text-slate-500 italic">Select 1 more modality...</span>
                  )}
                  {pinnedProtocols.length === 1 && (
                    <span className="text-[10px] text-slate-500 italic">Select 1 more protocol...</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              {pinnedModalities.length === 2 && (
                <button
                  onClick={() => {
                    setCompareModal({
                      isOpen: true,
                      exploring: pinnedModalities[0],
                      active: pinnedModalities[1],
                      source: todayModalityIds.has(pinnedModalities[1].id) ? 'today' : 'bench'
                    })
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Scale size={14} />
                  <span>Compare Modalities</span>
                  <ArrowRight size={14} />
                </button>
              )}

              {pinnedProtocols.length === 2 && (
                <button
                  onClick={() => {
                    setProtocolCompareModal({
                      isOpen: true,
                      protocolA: pinnedProtocols[0],
                      protocolB: pinnedProtocols[1]
                    })
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Scale size={14} />
                  <span>Compare Protocols</span>
                  <ArrowRight size={14} />
                </button>
              )}

              <button
                onClick={() => {
                  setPinnedModalities([])
                  setPinnedProtocols([])
                }}
                className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1 shrink-0"
                title="Clear Compare Tray"
              >
                <X size={14} />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-side Modality Comparison Modal */}
      <ModalityCompareModal 
        isOpen={compareModal.isOpen}
        onClose={() => setCompareModal(prev => ({ ...prev, isOpen: false }))}
        exploringModality={compareModal.exploring}
        activeModality={compareModal.active}
        activeSource={compareModal.source}
        userProfile={profile}
        onSuccess={loadData}
      />

      {/* Side-by-side Protocol vs Protocol Comparison Modal */}
      <ProtocolCompareModal 
        isOpen={protocolCompareModal.isOpen}
        onClose={() => setProtocolCompareModal(prev => ({ ...prev, isOpen: false }))}
        protocolA={protocolCompareModal.protocolA}
        protocolB={protocolCompareModal.protocolB}
        onSuccess={loadData}
      />

      {/* Algorithm Transparency & Methodology Modal */}
      <AlgorithmTransparencyModal 
        isOpen={transparencyModal.isOpen}
        onClose={() => setTransparencyModal(prev => ({ ...prev, isOpen: false }))}
        initialTab={transparencyModal.tab}
      />

      {/* Biochemical Stack Fit Inspector Modal */}
      <StackFitInspectorModal 
        isOpen={inspectStackFitModal.isOpen}
        onClose={() => setInspectStackFitModal(prev => ({ ...prev, isOpen: false }))}
        exploringModality={inspectStackFitModal.modality}
        stackFit={inspectStackFitModal.stackFit}
        onSuccess={loadData}
      />

      {/* 1st-Class Custom Modality Creator Studio */}
      <CreateCustomModalityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => loadData()}
      />
    </div>
  )
}
