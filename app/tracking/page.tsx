'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import {
  getOrCreateUserProfile,
  getDailyProtocolTasks,
  getProtocolTasksHistory,
  getDailyWellbeingHistory,
  getModalities,
  addToBench,
  getUserModalityHabits
} from '@/lib/data'
import { calculateNextBestAction } from '@/lib/ranking/nextBestAction'
import { getEffortMetadata, getCostMetadata } from '@/lib/ranking/adaptiveRecommendationEngine'
import { UserProfile, Modality, DailyProtocolTask, UserModalityHabit, DailyWellbeingCheckin } from '@/lib/types'
import {
  Target,
  Activity,
  Zap,
  Brain,
  Moon,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Plus,
  Check,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  Flame,
  Award,
  Layers,
  BarChart3,
  ShieldCheck,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Maximize2,
  Minimize2,
  Dna,
  Info
} from 'lucide-react'
import ScheduleModalityModal from '@/components/modals/ScheduleModalityModal'
import SwapModalityModal from '@/components/modals/SwapModalityModal'
import FrictionBusterModal from '@/components/modals/FrictionBusterModal'
import { KpiExplanationModal, KpiModalType } from '@/components/modals/KpiExplanationModal'
import { HallmarksRadarChart } from '@/components/tracking/HallmarksRadarChart'
import { BioGapSolverSection } from '@/components/tracking/BioGapSolverSection'
import { HallmarkBiomarkersPanel } from '@/components/tracking/HallmarkBiomarkersPanel'
import { calculateHallmarkCoverage, identifyBioGaps } from '@/lib/tracking/hallmarkCoverageEngine'
import { evaluateComprehensiveBiomarkers } from '@/lib/tracking/hallmarkBiomarkerEngine'
import { addModalityOrProtocolToToday } from '@/lib/data'
import {
  calculateStackAdherence,
  ModalityAdherenceMetrics,
  OutcomeAdherenceSummary,
  HabitLifecycleStatus
} from '@/lib/tracking/adherenceEngine'
import {
  evaluateStackSynergies,
  ActiveSynergyPair,
  SynergyMultiplierEvaluation
} from '@/lib/tracking/synergyMultiplierEngine'
import { getOutcomeColor } from '@/lib/outcomes/outcomeColors'

type FilterTab = 'all' | 'priority' | 'leaks' | 'momentum'
type ViewSection = 'adherence_roi' | 'hallmarks_radar'

interface ExtendedOutcomeSummary extends OutcomeAdherenceSummary {
  hasSynergyBonus?: boolean
  activeSynergies?: ActiveSynergyPair[]
  modalities: (OutcomeAdherenceSummary['modalities'][number] & {
    synergies?: ActiveSynergyPair[]
    isSynergized?: boolean
  })[]
}

export default function TrackingPage() {
  const { localUserId: authUserId, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [outcomeDataList, setOutcomeDataList] = useState<ExtendedOutcomeSummary[]>([])
  const [wellbeingLogs, setWellbeingLogs] = useState<DailyWellbeingCheckin[]>([])
  const [loading, setLoading] = useState(true)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [activeModalityIds, setActiveModalityIds] = useState<Set<string>>(new Set())
  const [schedulingModality, setSchedulingModality] = useState<Modality | null>(null)
  const [swappingModality, setSwappingModality] = useState<{ mod: Modality; outcome: string } | null>(null)
  const [frictionBusterModality, setFrictionBusterModality] = useState<{ modality: Modality; adherence: number } | null>(null)
  const [habits, setHabits] = useState<UserModalityHabit[]>([])
  const [kpiModalType, setKpiModalType] = useState<KpiModalType>(null)

  // Analytics View mode & 12 Hallmark suite state
  const [activeViewSection, setActiveViewSection] = useState<ViewSection>('adherence_roi')
  const [selectedHallmarkId, setSelectedHallmarkId] = useState<string | null>(null)
  const [allModalitiesList, setAllModalitiesList] = useState<Modality[]>([])
  const [todaysTasksList, setTodaysTasksList] = useState<DailyProtocolTask[]>([])

  // 12 Hallmarks Interactive Controls: Evidence, Simulator, Effort Tier, Biomarkers
  const [evidenceFilter, setEvidenceFilter] = useState<'all' | 'grade_a'>('all')
  const [simulatedModalityIds, setSimulatedModalityIds] = useState<Set<string>>(new Set())
  const [selectedEffortFilter, setSelectedEffortFilter] = useState<'all' | 'level_1' | 'level_2' | 'level_3'>('all')
  const [showBiomarkersPanel, setShowBiomarkersPanel] = useState<boolean>(false)
  const [userBiomarkerReadings, setUserBiomarkerReadings] = useState<Record<string, number>>({})

  // UI state filters
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedOutcomes, setExpandedOutcomes] = useState<Set<string>>(new Set()) // Collapsed by default

  // Top KPI aggregate stats
  const [overallAdherencePct, setOverallAdherencePct] = useState(0)
  const [totalRealizedRoi, setTotalRealizedRoi] = useState(0)
  const [totalPotentialPoints, setTotalPotentialPoints] = useState(0)
  const [totalRealizedPoints, setTotalRealizedPoints] = useState(0)
  const [totalSynergyBonusPoints, setTotalSynergyBonusPoints] = useState(0)
  const [activeSynergyPairsList, setActiveSynergyPairsList] = useState<ActiveSynergyPair[]>([])

  const handleScheduleSuccess = (destination: 'today' | 'tomorrow' | 'bench') => {
    if (schedulingModality) {
      setAddedIds(prev => new Set(prev).add(schedulingModality.id))
    }
  }

  const toggleOutcomeExpand = (outcomeId: string) => {
    setExpandedOutcomes(prev => {
      const next = new Set(prev)
      if (next.has(outcomeId)) {
        next.delete(outcomeId)
      } else {
        next.add(outcomeId)
      }
      return next
    })
  }

  useEffect(() => {
    if (authLoading) return

    async function load() {
      window.dispatchEvent(new CustomEvent('levl_sync_start'))
      const localUserId = authUserId || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '') || getLocalUserId()
      const today = new Date().toISOString().split('T')[0]
      const thirtyDaysAgoDate = new Date()
      thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30)
      const thirtyDaysAgo = thirtyDaysAgoDate.toISOString().split('T')[0]

      const [fetchedProfile, userHabits, todaysTasks, history, allModalities, wellbeingHistory] = await Promise.all([
        getOrCreateUserProfile(localUserId),
        getUserModalityHabits(localUserId),
        getDailyProtocolTasks(localUserId, today),
        getProtocolTasksHistory(localUserId, thirtyDaysAgo, today),
        getModalities(),
        getDailyWellbeingHistory(localUserId, thirtyDaysAgo, today)
      ])

      setProfile(fetchedProfile)
      setHabits(userHabits)
      setWellbeingLogs(wellbeingHistory)
      setAllModalitiesList(allModalities)
      setTodaysTasksList(todaysTasks)

      const activeModalitiesMap = new Map<string, Modality>()
      todaysTasks.forEach(task => {
        const mod = task.protocol_step?.modality || task.loose_modality
        if (mod && mod.id) {
          activeModalitiesMap.set(mod.id, mod)
        }
      })

      setActiveModalityIds(new Set(activeModalitiesMap.keys()))

      // 1. Evaluate Biochemical Synergies & Multipliers across the active stack
      const activeModalitiesList = Array.from(activeModalitiesMap.values())
      const synergyEval = evaluateStackSynergies(activeModalitiesList)
      setActiveSynergyPairsList(synergyEval.activePairs)

      // 2. Calculate scientifically robust adherence metrics per active modality
      const adherenceMetricsMap = calculateStackAdherence(activeModalitiesMap, history, today)

      // Calculate aggregate overall stack adherence
      let totalCompletedAll = 0
      let totalScheduledAll = 0
      adherenceMetricsMap.forEach(m => {
        totalCompletedAll += m.completedCount
        totalScheduledAll += m.scheduledCount
      })
      const avgAdh = totalScheduledAll > 0 ? (totalCompletedAll / totalScheduledAll) * 100 : 0
      setOverallAdherencePct(Math.round(avgAdh))

      // 3. Build Outcome Group Summaries with +15% Synergy Multiplier
      const outcomesMap = new Map<string, ExtendedOutcomeSummary>()
      let accumulatedSynergyBonusPoints = 0

      activeModalitiesMap.forEach((modality, modId) => {
        if (!modality.functional_impacts) return
        const metric = adherenceMetricsMap.get(modId)
        if (!metric) return

        const isSynergized = synergyEval.synergizedModalityIds.has(modId)
        const modalitySynergies = synergyEval.synergiesByModalityId.get(modId) || []

        Object.entries(modality.functional_impacts).forEach(([outcomeNameRaw, impactData]) => {
          const outcomeId = outcomeNameRaw.toLowerCase().replace(/\s+/g, '_')
          const impactScore = (impactData as any).score || 0

          if (impactScore < 3) return // Ignore negligible impacts

          if (!outcomesMap.has(outcomeId)) {
            outcomesMap.set(outcomeId, {
              id: outcomeId,
              name: outcomeNameRaw,
              preferenceScore: fetchedProfile?.outcome_preference_scores?.[outcomeId] || 0,
              totalPotential: 0,
              totalRealized: 0,
              realizedPercent: 0,
              overallAdherencePercent: 0,
              modalities: [],
              hasSynergyBonus: false,
              activeSynergies: []
            })
          }

          const outcomeGroup = outcomesMap.get(outcomeId)!

          // Base Realized score contribution calculation (graceful for new habits)
          let baseRealized = metric.isNewHabit && metric.scheduledCount <= 2
            ? (metric.completedCount > 0 ? impactScore : impactScore * 0.75)
            : impactScore * (metric.adherencePercent / 100)

          // Award +15% Biological Synergy Multiplier if active co-factor present
          let finalRealized = baseRealized
          if (isSynergized && baseRealized > 0) {
            const bonus = baseRealized * 0.15
            finalRealized = baseRealized + bonus
            accumulatedSynergyBonusPoints += bonus
            outcomeGroup.hasSynergyBonus = true
            modalitySynergies.forEach(s => {
              if (!outcomeGroup.activeSynergies?.some(existing => existing.ruleId === s.ruleId)) {
                outcomeGroup.activeSynergies?.push(s)
              }
            })
          }

          outcomeGroup.modalities.push({
            modality,
            impactScore,
            adherencePercent: metric.adherencePercent,
            scheduledCount: metric.scheduledCount,
            completedCount: metric.completedCount,
            isNewHabit: metric.isNewHabit,
            insightStatus: metric.insightStatus,
            insightMsg: metric.insightMsg,
            dailyDots: metric.dailyDots,
            synergies: modalitySynergies,
            isSynergized
          })

          outcomeGroup.totalPotential += impactScore
          outcomeGroup.totalRealized += finalRealized
        })
      })

      setTotalSynergyBonusPoints(Math.round(accumulatedSynergyBonusPoints))

      // 4. Compute Realized ROI % and NBA per outcome
      let sumPotentialAll = 0
      let sumRealizedAll = 0

      Array.from(outcomesMap.values()).forEach(outcomeGroup => {
        let totalSched = 0
        let totalComp = 0
        outcomeGroup.modalities.forEach(m => {
          totalSched += m.scheduledCount
          totalComp += m.completedCount
        })

        outcomeGroup.overallAdherencePercent = totalSched > 0 ? (totalComp / totalSched) * 100 : 0
        outcomeGroup.realizedPercent = outcomeGroup.totalPotential > 0
          ? Math.min(100, Math.round((outcomeGroup.totalRealized / outcomeGroup.totalPotential) * 100))
          : 0

        sumPotentialAll += outcomeGroup.totalPotential
        sumRealizedAll += outcomeGroup.totalRealized

        // Calculate subjective correlation with check-in history if available
        if (wellbeingHistory.length >= 3) {
          const matchingScores = wellbeingHistory
            .map(w => {
              const checkinKey = outcomeGroup.id as keyof DailyWellbeingCheckin
              const val = (w as any)[checkinKey] || (w as any)[`${outcomeGroup.id}_score`]
              return typeof val === 'number' ? val : null
            })
            .filter((v): v is number => v !== null)

          if (matchingScores.length > 0) {
            const avg = (matchingScores.reduce((a, b) => a + b, 0) / matchingScores.length).toFixed(1)
            outcomeGroup.wellbeingCorrelationText = `Average Check-in Rating: ${avg}/10 across ${matchingScores.length} logged days`
          }
        }

        // Next Best Action visible for outcomes with >= 70% adherence
        if (outcomeGroup.overallAdherencePercent >= 70) {
          const candidates = allModalities.filter(m => {
            if (activeModalitiesMap.has(m.id)) return false
            const targetsOutcome = m.functional_impacts && Object.keys(m.functional_impacts).some(
              k => k.toLowerCase().replace(/\s+/g, '_') === outcomeGroup.id
            )
            return targetsOutcome
          })

          if (candidates.length > 0) {
            const scored = candidates.map(c => ({ ...c, nba_result: calculateNextBestAction(c, fetchedProfile) }))
            const sorted = scored.sort((a, b) => b.nba_result.score - a.nba_result.score)
            outcomeGroup.nextBestAction = sorted[0]
          }
        }
      })

      const totalRoi = sumPotentialAll > 0 ? Math.round((sumRealizedAll / sumPotentialAll) * 100) : 0
      setTotalRealizedRoi(totalRoi)
      setTotalPotentialPoints(Math.round(sumPotentialAll))
      setTotalRealizedPoints(Math.round(sumRealizedAll))

      // Sort outcomes by user preference score, then total potential
      const finalOutcomes = Array.from(outcomesMap.values()).sort((a, b) => {
        if (b.preferenceScore !== a.preferenceScore) {
          return b.preferenceScore - a.preferenceScore
        }
        return b.totalPotential - a.totalPotential
      })

      // Sort modalities within each outcome by impact score
      finalOutcomes.forEach(outcome => {
        outcome.modalities.sort((a, b) => b.impactScore - a.impactScore)
      })

      setOutcomeDataList(finalOutcomes)
      // Keep collapsed by default
      setExpandedOutcomes(new Set())
      setLoading(false)
      window.dispatchEvent(new CustomEvent('levl_sync_end'))
    }
    load()

    const handleAuthChange = () => {
      load()
    }
    window.addEventListener('levl_auth_user_changed', handleAuthChange)
    return () => {
      window.removeEventListener('levl_auth_user_changed', handleAuthChange)
    }
  }, [authLoading, authUserId])

  // Filtered outcomes list based on tabs & search
  const filteredOutcomes = useMemo(() => {
    return outcomeDataList.filter(outcome => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchOutcome = outcome.name.toLowerCase().includes(q)
        const matchModality = outcome.modalities.some(m =>
          (m.modality.name || m.modality.display_name || '').toLowerCase().includes(q)
        )
        if (!matchOutcome && !matchModality) return false
      }

      // Tab filter
      if (selectedFilter === 'priority') {
        return outcome.preferenceScore > 7
      }
      if (selectedFilter === 'leaks') {
        return outcome.modalities.some(m => m.insightStatus === 'leak' || m.insightStatus === 'sunk_cost')
      }
      if (selectedFilter === 'momentum') {
        return outcome.realizedPercent >= 70 || outcome.modalities.some(m => m.insightStatus === 'momentum')
      }
      return true
    })
  }, [outcomeDataList, selectedFilter, searchQuery])

  // Counts for filter pills
  const counts = useMemo(() => {
    const priority = outcomeDataList.filter(o => o.preferenceScore > 7).length
    const leaks = outcomeDataList.filter(o => o.modalities.some(m => m.insightStatus === 'leak' || m.insightStatus === 'sunk_cost')).length
    const momentum = outcomeDataList.filter(o => o.realizedPercent >= 70 || o.modalities.some(m => m.insightStatus === 'momentum')).length
    return { all: outcomeDataList.length, priority, leaks, momentum }
  }, [outcomeDataList])

  const areAllExpanded = filteredOutcomes.length > 0 && filteredOutcomes.every(o => expandedOutcomes.has(o.id))

  const handleToggleAll = () => {
    if (areAllExpanded) {
      setExpandedOutcomes(new Set())
    } else {
      setExpandedOutcomes(new Set(outcomeDataList.map(o => o.id)))
    }
  }

  // 12 Hallmarks of Aging Coverage Report & Bio-Gap Analysis with Simulator & Evidence Filter
  const hallmarkReport = useMemo(() => {
    return calculateHallmarkCoverage(todaysTasksList, allModalitiesList, profile, {
      evidenceFilter,
      simulatedModalityIds,
      effortFilter: selectedEffortFilter
    })
  }, [todaysTasksList, allModalitiesList, profile, evidenceFilter, simulatedModalityIds, selectedEffortFilter])

  // Load persistent user lab biomarkers on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('levl_user_biomarkers')
      if (saved) {
        setUserBiomarkerReadings(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Error loading biomarker readings from storage:', e)
    }
  }, [])

  const bioGaps = useMemo(() => {
    return identifyBioGaps(hallmarkReport, allModalitiesList, activeModalityIds, {
      effortFilter: selectedEffortFilter,
      evidenceFilter
    })
  }, [hallmarkReport, allModalitiesList, activeModalityIds, selectedEffortFilter, evidenceFilter])

  const biomarkerStatuses = useMemo(() => {
    return evaluateComprehensiveBiomarkers(userBiomarkerReadings)
  }, [userBiomarkerReadings])

  const biomarkerHighRiskCount = useMemo(() => {
    return biomarkerStatuses.filter(s => s.hasRiskFlag).length
  }, [biomarkerStatuses])

  const handleToggleSimulate = (modId: string) => {
    setSimulatedModalityIds(prev => {
      const next = new Set(prev)
      if (next.has(modId)) next.delete(modId)
      else next.add(modId)
      return next
    })
  }

  const handleApplySimulatedStack = async () => {
    const localUserId = getLocalUserId()
    const today = new Date().toISOString().split('T')[0]
    for (const modId of Array.from(simulatedModalityIds)) {
      await addModalityOrProtocolToToday(localUserId, today, modId)
    }
    setSimulatedModalityIds(new Set())
    const refreshedTasks = await getDailyProtocolTasks(localUserId, today)
    setTodaysTasksList(refreshedTasks)
  }

  const handleClearSimulation = () => {
    setSimulatedModalityIds(new Set())
  }

  const handleUpdateBiomarkerReading = (biomarkerId: string, value: number) => {
    setUserBiomarkerReadings(prev => {
      const next = {
        ...prev,
        [biomarkerId]: value
      }
      try {
        localStorage.setItem('levl_user_biomarkers', JSON.stringify(next))
      } catch (e) {
        console.error('Error saving biomarker readings to storage:', e)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center animate-pulse text-levl-text-secondary">
        Analyzing protocol execution ROI & multi-system leverage...
      </div>
    )
  }

  if (outcomeDataList.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto pt-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto shadow-lg">
          <Target size={32} />
        </div>
        <h1 className="text-2xl font-black text-white">No Active Protocol Habits Yet</h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
          Add modalities or protocols to your Today view to unlock real-time outcome tracking, 80/20 habit leverage insights, and realized ROI scores.
        </p>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl w-full min-w-0 mx-auto pt-4 sm:pt-8 pb-28 space-y-6 sm:space-y-8">
      {/* Insights Section Switcher */}
      <div className="flex p-1 bg-black/50 rounded-2xl border border-white/10 max-w-md shadow-lg">
        <Link
          href="/tracking"
          className="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-levl-accent/20 text-levl-accent border border-levl-accent/30 shadow-sm flex items-center justify-center gap-1.5 transition-all"
        >
          <Target size={14} /> Outcome ROI &amp; Habits
        </Link>
        <Link
          href="/aging"
          className="flex-1 py-2 text-center text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-white/5 flex items-center justify-center gap-1.5 transition-all"
        >
          <Activity size={14} /> Biological Age &amp; Models
        </Link>
      </div>

      {/* Analytics Hub Sub-Navigation: Outcomes ROI vs 12 Hallmarks Bio-Coverage */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-950/90 rounded-2xl border border-white/10 max-w-lg shadow-xl">
        <button
          type="button"
          onClick={() => setActiveViewSection('adherence_roi')}
          className={`flex-1 py-2.5 px-4 text-center text-xs sm:text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeViewSection === 'adherence_roi'
              ? 'bg-levl-accent text-black shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Target size={15} />
          <span>Outcome ROI &amp; Habits</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveViewSection('hallmarks_radar')}
          className={`flex-1 py-2.5 px-4 text-center text-xs sm:text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeViewSection === 'hallmarks_radar'
              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Dna size={15} className="text-purple-400" />
          <span>12 Hallmarks Radar</span>
        </button>
      </div>

      {activeViewSection === 'hallmarks_radar' ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Biomarkers Diagnostics Cross-Link Panel (if open) */}
          {showBiomarkersPanel && (
            <HallmarkBiomarkersPanel
              userReadings={userBiomarkerReadings}
              onUpdateReading={handleUpdateBiomarkerReading}
              onClose={() => setShowBiomarkersPanel(false)}
              onSelectHallmark={(hId) => setSelectedHallmarkId(hId)}
            />
          )}

          {/* 12 Hallmarks Geometric Radar Chart */}
          <HallmarksRadarChart
            coverageReport={hallmarkReport}
            onSelectHallmark={(hId) => setSelectedHallmarkId(hId)}
            selectedHallmarkId={selectedHallmarkId}
            evidenceFilter={evidenceFilter}
            onEvidenceFilterChange={(filter) => setEvidenceFilter(filter)}
            simulatedCount={simulatedModalityIds.size}
            onApplySimulatedStack={handleApplySimulatedStack}
            onClearSimulation={handleClearSimulation}
            showBiomarkersPanel={showBiomarkersPanel}
            onToggleBiomarkersPanel={() => setShowBiomarkersPanel(prev => !prev)}
            biomarkerHighRiskCount={biomarkerHighRiskCount}
          />

          {/* Multi-Tier Bio-Gap Solver Section */}
          <BioGapSolverSection
            gaps={bioGaps}
            coverageReport={hallmarkReport}
            onAddToToday={async (modId) => {
              const localUserId = getLocalUserId()
              const today = new Date().toISOString().split('T')[0]
              await addModalityOrProtocolToToday(localUserId, today, modId)
              const refreshedTasks = await getDailyProtocolTasks(localUserId, today)
              setTodaysTasksList(refreshedTasks)
            }}
            onAddToBench={async (modId) => {
              const localUserId = getLocalUserId()
              await addToBench(localUserId, modId)
            }}
            simulatedModalityIds={simulatedModalityIds}
            onToggleSimulate={handleToggleSimulate}
            selectedEffortFilter={selectedEffortFilter}
            onEffortFilterChange={(filter) => setSelectedEffortFilter(filter)}
          />
        </div>
      ) : (
        <>
          {/* Executive Header */}
          <header className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
                  <Target size={28} className="text-levl-accent" />
                  <span>Protocol Tracking &amp; Outcome ROI</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
                  Real-time 80/20 biological leverage engine. Analyzes active habit consistency, isolates high-friction execution leaks, and unlocks Next Best Action stack upgrades.
                </p>
              </div>
            </div>

        {/* Executive 4-Metric KPI Grid with Clickable Explanations & Harmonized Typography */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Stack Adherence */}
          <div
            onClick={() => setKpiModalType('adherence')}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900/95 shadow-xl flex items-center gap-3.5 backdrop-blur-md cursor-pointer transition-all hover:scale-[1.01] group select-none"
            title="Click for Stack Adherence explanation and breakdown"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <Zap size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                  Stack Adherence
                </span>
                <Info size={11} className="text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0 ml-1" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">{overallAdherencePct}%</span>
                <span className="text-[10px] text-emerald-400 font-bold font-sans">Rolling 14d</span>
              </div>
            </div>
          </div>

          {/* Card 2: Realized Impact */}
          <div
            onClick={() => setKpiModalType('realized_impact')}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-900/95 shadow-xl flex items-center gap-3.5 backdrop-blur-md cursor-pointer transition-all hover:scale-[1.01] group select-none"
            title="Click for Realized Impact calculation and breakdown"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <TrendingUp size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                  Realized Impact
                </span>
                <Info size={11} className="text-slate-500 group-hover:text-teal-400 transition-colors shrink-0 ml-1" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                <span className="text-xl sm:text-2xl font-black text-teal-300 font-mono">{totalRealizedRoi}%</span>
                <span className="text-[10px] text-slate-300 font-bold font-sans">({totalRealizedPoints}/{totalPotentialPoints} pts)</span>
              </div>
            </div>
          </div>

          {/* Card 3: Active Outcomes */}
          <div
            onClick={() => setKpiModalType('outcomes')}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-900/95 shadow-xl flex items-center gap-3.5 backdrop-blur-md cursor-pointer transition-all hover:scale-[1.01] group select-none"
            title="Click for Active Outcomes breakdown"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <Award size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                  Active Outcomes
                </span>
                <Info size={11} className="text-slate-500 group-hover:text-amber-400 transition-colors shrink-0 ml-1" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">{outcomeDataList.length}</span>
                <span className="text-[10px] text-amber-300 font-bold font-sans">({counts.priority} Priority)</span>
              </div>
            </div>
          </div>

          {/* Card 4: Biochemical Synergy */}
          <div
            onClick={() => setKpiModalType('synergy')}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900/95 shadow-xl flex items-center gap-3.5 backdrop-blur-md cursor-pointer transition-all hover:scale-[1.01] group select-none"
            title="Click for Biochemical Synergy Multipliers and paired modalities"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <Sparkles size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                  Biochemical Synergy
                </span>
                <Info size={11} className="text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0 ml-1" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">
                  {activeSynergyPairsList.length}
                </span>
                <span className="text-[10px] text-indigo-300 font-bold font-sans">
                  Active Pairs
                </span>
                {totalSynergyBonusPoints > 0 && (
                  <span className="text-[10px] text-emerald-400 font-bold font-sans">
                    +{totalSynergyBonusPoints} pts
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar, Search Engine & Expand All Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Pill Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                selectedFilter === 'all'
                  ? 'bg-levl-accent text-black font-extrabold border-levl-accent shadow-md'
                  : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Goals ({counts.all})
            </button>
            <button
              onClick={() => setSelectedFilter('priority')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                selectedFilter === 'priority'
                  ? 'bg-amber-500 text-black font-extrabold border-amber-400 shadow-md'
                  : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ★ Priority ({counts.priority})
            </button>
            <button
              onClick={() => setSelectedFilter('leaks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                selectedFilter === 'leaks'
                  ? 'bg-rose-500 text-white font-extrabold border-rose-400 shadow-md'
                  : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ⚠️ Leaks ({counts.leaks})
            </button>
            <button
              onClick={() => setSelectedFilter('momentum')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                selectedFilter === 'momentum'
                  ? 'bg-emerald-500 text-black font-extrabold border-emerald-400 shadow-md'
                  : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🔥 Momentum ({counts.momentum})
            </button>
          </div>

          {/* Search Input & Expand/Collapse All Action */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search goals or habits..."
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-levl-accent transition-colors"
              />
            </div>

            <button
              onClick={handleToggleAll}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
              title={areAllExpanded ? 'Collapse all goal breakdowns' : 'Expand all goal breakdowns'}
            >
              {areAllExpanded ? (
                <>
                  <Minimize2 size={13} className="text-levl-accent" />
                  <span className="hidden sm:inline">Collapse All</span>
                </>
              ) : (
                <>
                  <Maximize2 size={13} className="text-levl-accent" />
                  <span className="hidden sm:inline">Show All Breakdowns</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Outcome ROI Matrix: Multi-Screen Responsive 2-to-3 Wide Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5 sm:gap-6 items-start">
        {filteredOutcomes.map(outcome => {
          const MAX_SIZE = 100
          const normalizedPotential = Math.min(1, outcome.totalPotential / 30)
          const outerSize = Math.max(68, normalizedPotential * MAX_SIZE)

          const theme = getOutcomeColor(outcome.id || outcome.name)
          const isExpanded = expandedOutcomes.has(outcome.id)

          return (
            <div
              key={outcome.id}
              className={`glass-card p-5 sm:p-6 rounded-2xl border ${theme.border} bg-slate-900/70 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-3 flex flex-col justify-between transition-all hover:border-slate-700`}
              style={{ boxShadow: `0 4px 20px -2px ${theme.glow}` }}
            >
              {/* Clickable Outcome Header Overview Hub */}
              <div>
                <div
                  onClick={() => toggleOutcomeExpand(outcome.id)}
                  className="flex items-center gap-4 pb-3 border-b border-slate-800/80 cursor-pointer group hover:bg-slate-850/50 -m-2 p-2 rounded-xl transition-all select-none"
                >
                  {/* Radial Progress Bubble */}
                  <div
                    className="relative flex items-center justify-center rounded-full border-2 border-dashed shrink-0 group-hover:scale-105 transition-all"
                    style={{
                      width: outerSize,
                      height: outerSize,
                      borderColor: theme.hex + '60',
                      backgroundColor: theme.hex + '10'
                    }}
                  >
                    <div
                      className={`absolute rounded-full bg-gradient-to-br ${theme.gradient} transition-all duration-700 ease-out`}
                      style={{
                        width: Math.max(16, outerSize * (Math.max(15, outcome.realizedPercent) / 100)),
                        height: Math.max(16, outerSize * (Math.max(15, outcome.realizedPercent) / 100)),
                        boxShadow: `0 0 16px ${theme.glow}`
                      }}
                    />

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center drop-shadow-md z-10">
                      <span className="text-xs font-black text-white font-mono">{Math.round(outcome.totalRealized)}</span>
                      <span className="text-[8px] uppercase tracking-widest text-white/80 border-t border-white/30 pt-0.5 mt-0.5 font-mono">
                        / {Math.round(outcome.totalPotential)} pts
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <h2 className="text-base sm:text-lg font-black text-white capitalize truncate group-hover:text-levl-accent transition-colors">
                          {outcome.name}
                        </h2>
                        {outcome.preferenceScore > 7 && (
                          <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
                            ★ Priority
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-white shrink-0 font-medium">
                        <span className="text-[11px] hidden sm:inline">{isExpanded ? 'Hide' : 'Details'}</span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-md font-mono border ${theme.bg} ${theme.border} ${theme.text}`}>
                        ROI: {outcome.realizedPercent}% Realized
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {outcome.modalities.length} Active {outcome.modalities.length === 1 ? 'Habit' : 'Habits'}
                      </span>
                      {outcome.hasSynergyBonus && (
                        <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                          <Sparkles size={11} className="text-emerald-400" />
                          <span>+15% Synergy</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subjective Wellbeing Correlation Bar if available */}
                {outcome.wellbeingCorrelationText && (
                  <div className="mt-2.5 p-2 bg-slate-950/70 border border-slate-800/80 rounded-lg flex items-center gap-2 text-[11px] text-slate-300">
                    <HeartPulse size={13} className="text-rose-400 shrink-0" />
                    <span>{outcome.wellbeingCorrelationText}</span>
                  </div>
                )}
              </div>

              {/* Modalities List (Collapsed by default, expands on click) */}
              {isExpanded && (
                <div className="space-y-2.5 pt-1 animate-in fade-in duration-200">
                  {outcome.modalities.map((modData, i) => {
                    const isNew = modData.isNewHabit
                    const isMomentum = modData.insightStatus === 'momentum'
                    const isLeak = modData.insightStatus === 'leak'
                    const isSunkCost = modData.insightStatus === 'sunk_cost'

                    return (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-2.5"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                              {modData.modality.display_name || modData.modality.name}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-semibold mt-0.5">
                              <span>Impact: {modData.impactScore}/10</span>
                              <span>•</span>
                              <span>Effort: {modData.modality.effort_level?.replace('_', ' ') || 'low'}</span>
                            </div>
                          </div>

                          {/* Adherence Badge & 7-Day Mini Timeline */}
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                                isNew
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                  : isMomentum
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : isLeak
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : isSunkCost
                                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {isNew ? '🌱 New' : `${Math.round(modData.adherencePercent)}% Adh`}
                            </span>

                            {/* 7-Day Mini Completion Dots */}
                            <div className="flex items-center gap-1 mt-0.5" title="Last 7 Days Execution">
                              {modData.dailyDots.map((dot, dIdx) => (
                                <div
                                  key={dIdx}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    dot.status === 'completed'
                                      ? 'bg-emerald-400'
                                      : dot.status === 'partial'
                                      ? 'bg-amber-400'
                                      : dot.status === 'skipped'
                                      ? 'bg-rose-500'
                                      : dot.status === 'pending'
                                      ? 'bg-slate-500 animate-pulse'
                                      : 'bg-slate-800'
                                  }`}
                                  title={`${dot.dayLabel}: ${dot.status}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Biochemical Synergy Co-Factor Callout */}
                        {modData.isSynergized && modData.synergies && modData.synergies.length > 0 && (
                          <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                              <Sparkles size={13} className="text-emerald-400 shrink-0" />
                              <span className="text-[11px]">
                                🧬 Synergy Active: {modData.synergies[0].headline}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono font-extrabold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
                              +15% Pts
                            </span>
                          </div>
                        )}

                        {/* 80/20 Insight Banner */}
                        <div
                          className={`p-2.5 rounded-lg text-xs flex flex-col gap-2 border ${
                            isNew
                              ? 'bg-cyan-950/20 text-cyan-300 border-cyan-500/20'
                              : isMomentum
                              ? 'bg-emerald-950/20 text-emerald-300 border-emerald-500/20'
                              : isLeak
                              ? 'bg-amber-950/20 text-amber-300 border-amber-500/20'
                              : isSunkCost
                              ? 'bg-red-950/20 text-red-300 border-red-500/20'
                              : 'bg-slate-900/40 text-slate-300 border-slate-800'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {isNew && <Clock size={13} className="shrink-0 mt-0.5 text-cyan-400" />}
                            {isMomentum && <TrendingUp size={13} className="shrink-0 mt-0.5 text-emerald-400" />}
                            {isLeak && <AlertTriangle size={13} className="shrink-0 mt-0.5 text-amber-400" />}
                            {isSunkCost && <Activity size={13} className="shrink-0 mt-0.5 text-red-400" />}
                            <p className="text-[11px] leading-relaxed">{modData.insightMsg}</p>
                          </div>

                          {(isLeak || isSunkCost) && (
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              {/* 1-Click Friction Buster Auto-Shift Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setFrictionBusterModality({
                                    modality: modData.modality,
                                    adherence: Math.round(modData.adherencePercent)
                                  })
                                }}
                                className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer border border-amber-500/30 shadow-sm"
                              >
                                <Zap size={11} className="text-amber-400" />
                                <span>⚡ Auto-Shift Schedule</span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSwappingModality({ mod: modData.modality, outcome: outcome.id })
                                }}
                                className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <RefreshCw size={11} />
                                <span>Find Alternative</span>
                              </button>
                              {isSunkCost && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    const localUserId = getLocalUserId()
                                    await addToBench(localUserId, modData.modality.id)
                                    window.location.reload()
                                  }}
                                  className="px-2.5 py-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] font-bold transition-colors cursor-pointer"
                                >
                                  Move to Bench
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Level Up: Next Best Action Banner */}
                  {outcome.nextBestAction && outcome.overallAdherencePercent >= 70 && (
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-levl-accent/10 to-teal-500/5 border border-levl-accent/30 space-y-2.5 shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-levl-accent font-bold text-xs uppercase tracking-wider">
                          <Sparkles size={14} />
                          <span>Level Up: Stack Next Best Action</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-snug">
                        Your {outcome.name} adherence is {Math.round(outcome.overallAdherencePercent)}%! Ready to stack this synergistic accelerator?
                      </p>

                      <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg flex items-center justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-bold text-xs text-white truncate">
                              {outcome.nextBestAction.display_name || outcome.nextBestAction.name}
                            </h5>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getEffortMetadata(outcome.nextBestAction).badgeColor}`}>
                              {getEffortMetadata(outcome.nextBestAction).shortLabel}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                              Cost: {getCostMetadata(outcome.nextBestAction.cost_tier).shortLabel}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1">
                            {outcome.nextBestAction.brief_description}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!addedIds.has(outcome.nextBestAction!.id)) {
                              setSchedulingModality(outcome.nextBestAction!)
                            }
                          }}
                          disabled={addedIds.has(outcome.nextBestAction!.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 flex items-center gap-1 ${
                            addedIds.has(outcome.nextBestAction!.id)
                              ? 'bg-levl-accent text-black font-extrabold'
                              : 'bg-gradient-to-r from-levl-accent to-teal-500 text-black font-extrabold hover:brightness-110 cursor-pointer shadow-md'
                          }`}
                        >
                          {addedIds.has(outcome.nextBestAction!.id) ? (
                            <>
                              <Check size={13} />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus size={13} />
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Habit Automaticity Tracker Hub (Positioned Below Outcome Matrix) */}
      {habits.length > 0 && selectedFilter !== 'leaks' && !searchQuery && (
        <div className="glass-card rounded-2xl p-5 sm:p-6 border border-indigo-500/30 bg-indigo-950/20 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="text-indigo-400" size={18} />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Neuroscience Habit Automaticity Tracker
              </h2>
            </div>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
              {habits.filter(h => h.is_automated).length} Graduated Habits
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            🧠 Neuroscience of Habit Formation (<em>Lally et al., 2010</em>): Achieving 100% automaticity requires an average ~66-day streak (21 days for micro-habits, 90 days for complex protocols). Graduated habits run in your background biological algorithms and keep your Today routine clean.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {habits.map(h => {
              const pct = h.is_automated ? 100 : Math.min(100, Math.round((h.streak_days / h.target_streak_days) * 100))
              return (
                <div key={h.id} className="bg-black/50 p-3.5 rounded-xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white truncate max-w-[150px]">{h.modality?.name || 'Habit Protocol'}</h3>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      h.is_automated 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    }`}>
                      {h.is_automated ? '🌿 Automatic' : `${h.streak_days}/${h.target_streak_days}d (${pct}%)`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500" 
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-400 pt-0.5">
                    <span>Target: {h.target_streak_days} Days</span>
                    <button
                      onClick={async () => {
                        const localUserId = getLocalUserId()
                        const { toggleHabitGraduation } = await import('@/lib/data')
                        const updated = await toggleHabitGraduation(localUserId, h.modality_id, 'manual')
                        setHabits(updated)
                      }}
                      className="text-levl-accent hover:underline cursor-pointer"
                    >
                      {h.is_automated ? 'Move to Active' : 'Graduate ↗'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      </>
      )}

      {/* Schedule Modality Modal */}
      <ScheduleModalityModal
        isOpen={!!schedulingModality}
        onClose={() => setSchedulingModality(null)}
        modality={schedulingModality}
        onSuccess={handleScheduleSuccess}
      />

      {/* Swap Modality Modal */}
      {swappingModality && (
        <SwapModalityModal
          isOpen={true}
          onClose={() => setSwappingModality(null)}
          failingModality={swappingModality.mod}
          targetOutcome={swappingModality.outcome}
          activeModalityIds={activeModalityIds}
          onSwapComplete={() => {
            setSwappingModality(null)
            window.location.reload()
          }}
        />
      )}

      {/* 1-Click Friction Buster Modal */}
      {frictionBusterModality && (
        <FrictionBusterModal
          isOpen={true}
          onClose={() => setFrictionBusterModality(null)}
          modality={frictionBusterModality.modality}
          adherencePercent={frictionBusterModality.adherence}
          userProfile={profile}
          onShiftApplied={() => {
            setFrictionBusterModality(null)
            window.location.reload()
          }}
        />
      )}

      {/* KPI Deep-Dive & Explanation Modal */}
      <KpiExplanationModal
        isOpen={!!kpiModalType}
        onClose={() => setKpiModalType(null)}
        modalType={kpiModalType}
        overallAdherencePct={overallAdherencePct}
        totalRealizedRoi={totalRealizedRoi}
        totalRealizedPoints={totalRealizedPoints}
        totalPotentialPoints={totalPotentialPoints}
        outcomeCount={outcomeDataList.length}
        priorityOutcomeCount={counts.priority}
        activeSynergyPairs={activeSynergyPairsList}
        totalSynergyBonusPoints={totalSynergyBonusPoints}
        onSelectFilter={(filter) => setSelectedFilter(filter)}
      />
    </div>
  )
}
