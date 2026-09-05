'use client'

import React, { useState, useMemo } from 'react'
import {
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
  Zap,
  ShieldAlert,
  Plus,
  RefreshCw,
  Clock,
  ArrowRight,
  TrendingUp,
  Layers,
  Scale,
  Info
} from 'lucide-react'
import {
  Modality,
  DailyProtocolTask,
  OutcomeDimension,
  UserProfile
} from '@/lib/types'
import {
  OutcomeOptimizationState,
  AntagonisticClash,
  calculateOutcomeDialedInScore,
  calculateOutcomeEffortScore,
  evaluateOutcomeStatus,
  resolveUserTargetConfig,
  detectAntagonisticClashes,
  FOUNDATIONAL_PILLARS,
  normalizeOutcomeKey,
  getNextBestActionForOutcome,
  getCandidateToBenchForOutcome,
  isModalityMatchingOutcome
} from '@/lib/outcomes/outcomeOptimizationEngine'
import { getOutcomeColor } from '@/lib/outcomes/outcomeColors'
import { LongevityAnalysisModal } from '@/components/modals/LongevityAnalysisModal'

interface Outcome8020SpotlightCardProps {
  selectedOutcomeIds: string[]
  allModalities: Modality[]
  todayTasks: DailyProtocolTask[]
  userProfile: UserProfile | null
  allOutcomes: OutcomeDimension[]
  onOpenTuneModal: (outcomeState: OutcomeOptimizationState) => void
  onAddModalityToToday?: (modalityId: string) => Promise<void>
  onBenchModality?: (modalityId: string) => Promise<void>
  onRemoveTaskFromToday?: (taskId: string) => Promise<void>
  onAutoFixClash?: (clash: AntagonisticClash) => Promise<void>
}

export const Outcome8020SpotlightCard: React.FC<Outcome8020SpotlightCardProps> = ({
  selectedOutcomeIds,
  allModalities,
  todayTasks,
  userProfile,
  allOutcomes,
  onOpenTuneModal,
  onAddModalityToToday,
  onBenchModality,
  onRemoveTaskFromToday,
  onAutoFixClash
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false)

  // Primary outcome being spotlighted (first selected outcome)
  const primaryOutcomeNameOrId = selectedOutcomeIds[0] || 'focus'
  const normKey = normalizeOutcomeKey(primaryOutcomeNameOrId)

  // Find matching outcome dimension metadata
  const outcomeDim = useMemo(() => {
    return allOutcomes.find(o => 
      normalizeOutcomeKey(o.id) === normKey || 
      normalizeOutcomeKey(o.name) === normKey
    ) || {
      id: normKey,
      name: primaryOutcomeNameOrId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    } as OutcomeDimension
  }, [allOutcomes, normKey, primaryOutcomeNameOrId])

  // Compute active modalities contributing to this outcome from today's tasks
  const activeModalitiesToday = useMemo(() => {
    const modsMap = new Map<string, Modality>()
    todayTasks.forEach(task => {
      const mod = task.loose_modality || task.protocol_step?.modality || allModalities.find(m => m.id === task.modality_id)
      if (mod && isModalityMatchingOutcome(mod, normKey)) {
        modsMap.set(mod.id, mod)
      }
    })
    return Array.from(modsMap.values())
  }, [todayTasks, allModalities, normKey])

  // Evaluate full optimization state for this outcome
  const outcomeState: OutcomeOptimizationState = useMemo(() => {
    const targetConfig = resolveUserTargetConfig(normKey, userProfile)
    const allClashes = detectAntagonisticClashes(activeModalitiesToday, todayTasks)
    const clashesForOutcome = allClashes.filter(c => normalizeOutcomeKey(c.outcomeId) === normKey)
    const dialedIn = calculateOutcomeDialedInScore(normKey, activeModalitiesToday, clashesForOutcome)
    const effortScore = calculateOutcomeEffortScore(normKey, activeModalitiesToday)
    const statusEval = evaluateOutcomeStatus(dialedIn.score, effortScore, targetConfig, clashesForOutcome)

    const foundationalKeys = FOUNDATIONAL_PILLARS[normKey] || []
    const foundational: { modality: Modality; weight: number }[] = []
    const synergistic: { modality: Modality; weight: number }[] = []
    const marginal: { modality: Modality; weight: number }[] = []

    activeModalitiesToday.forEach(m => {
      const isFoundational = foundationalKeys.some(k => (m.id || '').toLowerCase().includes(k) || (m.slug || '').toLowerCase().includes(k))
      if (isFoundational) foundational.push({ modality: m, weight: 35 })
      else if (foundational.length + synergistic.length < 3) synergistic.push({ modality: m, weight: 15 })
      else marginal.push({ modality: m, weight: 5 })
    })

    return {
      outcomeId: outcomeDim.id,
      outcomeName: outcomeDim.name,
      dialedInScore: dialedIn.score,
      percentileRank: dialedIn.percentile,
      effortScore,
      status: statusEval.status,
      statusLabel: statusEval.label,
      statusDescription: statusEval.description,
      badgeBg: statusEval.badgeBg,
      badgeBorder: statusEval.badgeBorder,
      badgeText: statusEval.badgeText,
      activeModalities: activeModalitiesToday,
      contributingTaskCount: activeModalitiesToday.length,
      targetConfig,
      clashes: clashesForOutcome,
      tierBreakdown: {
        foundational,
        synergistic,
        marginal
      }
    }
  }, [normKey, userProfile, activeModalitiesToday, todayTasks, outcomeDim])

  // Compute Next Best Action (if short of dialed-in goal)
  const isShortOfGoal = outcomeState.dialedInScore < outcomeState.targetConfig.targetDialedIn
  const nextBestAction = useMemo(() => {
    if (!isShortOfGoal) return null
    return getNextBestActionForOutcome(normKey, activeModalitiesToday, allModalities)
  }, [isShortOfGoal, normKey, activeModalitiesToday, allModalities])

  // Compute Candidate to Bench / Remove (if effort is higher than budget)
  const isEffortOverBudget = outcomeState.effortScore > outcomeState.targetConfig.maxEffortAllowance
  const benchCandidate = useMemo(() => {
    if (!isEffortOverBudget) return null
    return getCandidateToBenchForOutcome(outcomeState)
  }, [isEffortOverBudget, outcomeState])

  const colorTheme = getOutcomeColor(outcomeDim.name || normKey)

  const handleAddNextAction = async () => {
    if (!nextBestAction || !onAddModalityToToday) return
    setIsActionLoading(true)
    try {
      await onAddModalityToToday(nextBestAction.modalityId)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleBenchCandidate = async () => {
    if (!benchCandidate || !onBenchModality) return
    setIsActionLoading(true)
    try {
      await onBenchModality(benchCandidate.modalityId)
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <div className="w-full mb-3 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl overflow-hidden transition-all duration-200">
      {/* 1. Ultra-Minimalist Collapsed Bar (~38px) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
      >
        {/* Left: Outcome Identity & Live Status */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="p-1 rounded-lg bg-white/5 border border-white/10 text-xs shrink-0">
            {colorTheme.hex ? (
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: colorTheme.hex }} />
            ) : (
              <Sparkles size={11} className="text-purple-400" />
            )}
          </span>

          <span className="font-extrabold text-xs sm:text-sm text-white tracking-tight truncate">
            {outcomeDim.name}
          </span>

          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold shrink-0 ${outcomeState.badgeBg} ${outcomeState.badgeBorder} ${outcomeState.badgeText}`}>
            {outcomeState.dialedInScore}% Dialed-In
          </span>

          <span className="hidden sm:inline text-[10px] font-mono text-slate-400 shrink-0">
            Effort: <span className={isEffortOverBudget ? "text-amber-400 font-bold" : "text-slate-300"}>{outcomeState.effortScore}/100</span>
          </span>
        </div>

        {/* Center / Right: Minimalist Context Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isShortOfGoal && nextBestAction && (
            <span className="hidden min-[480px]:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold font-mono">
              <Zap size={10} className="text-cyan-400" />
              <span>+1 Next Action</span>
            </span>
          )}

          {isEffortOverBudget && benchCandidate && (
            <span className="hidden min-[540px]:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 text-[10px] font-bold font-mono">
              <Scale size={10} className="text-amber-400" />
              <span>1 to Bench</span>
            </span>
          )}

          {outcomeState.clashes.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/70 border border-rose-500/40 text-rose-300 text-[10px] font-bold font-mono animate-pulse">
              <ShieldAlert size={10} className="text-rose-400" />
              <span>Clash</span>
            </span>
          )}

          {/* Clinical Analysis (i) Explainer Trigger */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsAnalysisModalOpen(true)
            }}
            className="p-1 sm:px-1.5 sm:py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-400 hover:text-cyan-300 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-sm"
            title="View 80/20 Clinical Analysis & Evidence Calculus"
          >
            <Info size={12} />
            <span className="hidden min-[600px]:inline text-[10px]">Analysis</span>
          </button>

          {/* Quick Tune Action */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenTuneModal(outcomeState)
            }}
            className="p-1 sm:px-2 sm:py-1 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
            title="Tune Ambition Target & 80/20 Curve"
          >
            <Sliders size={11} />
            <span className="hidden sm:inline">Tune</span>
          </button>

          {/* Expand/Collapse Chevron */}
          <button
            type="button"
            className="p-1 text-slate-400 hover:text-white transition-colors"
            aria-label={isExpanded ? 'Collapse 80/20 summary' : 'Expand 80/20 summary'}
          >
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* 2. Expanded Detail Panel */}
      {isExpanded && (
        <div className="p-3.5 sm:p-4 border-t border-slate-800/80 bg-slate-900/50 space-y-3.5 animate-in fade-in duration-200">
          {/* Header Summary & Curve Mini-Rail */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={12} className="text-purple-400" />
                80/20 Sigmoidal Curve Position
              </span>
              <span className="text-[11px] font-mono text-purple-300 font-bold">
                Goal Target: {outcomeState.targetConfig.targetDialedIn}/100
              </span>
            </div>

            {/* Stepped Mini Rail */}
            <div className="relative h-4 bg-slate-950 rounded-lg border border-white/5 flex items-center p-0.5 overflow-hidden">
              <div className="w-[80%] h-full bg-emerald-950/40 border-r border-emerald-500/30 flex items-center pl-1.5">
                <span className="text-[8px] font-mono font-bold text-emerald-400/60 uppercase">Foundation (80%)</span>
              </div>
              <div className="w-[12%] h-full bg-blue-950/40 border-r border-blue-500/30 flex items-center justify-center">
                <span className="text-[7px] font-mono font-bold text-blue-400/60 uppercase">Boost</span>
              </div>
              <div className="w-[8%] h-full bg-purple-950/40 flex items-center justify-center">
                <span className="text-[7px] font-mono font-bold text-purple-400/60 uppercase">Elite</span>
              </div>
              <div 
                className="absolute top-0 bottom-0 w-2 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.9)] -translate-x-1/2 transition-all duration-300"
                style={{ left: `${Math.min(98, Math.max(2, outcomeState.dialedInScore))}%` }}
              />
            </div>
          </div>

          {/* Biological Antagonistic Clashes (if any) */}
          {outcomeState.clashes.length > 0 && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl space-y-2 text-xs text-rose-200">
              <div className="flex items-center gap-1.5 text-rose-300 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert size={14} className="animate-pulse" />
                <span>Biological Antagonistic Timing Conflict</span>
              </div>
              {outcomeState.clashes.map(clash => (
                <div key={clash.id} className="space-y-1.5 pt-1">
                  <span className="font-bold text-white block text-[11px]">{clash.title}</span>
                  <p className="text-[11px] text-rose-200/90 leading-relaxed">{clash.biologicalMechanism}</p>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] text-rose-300 font-mono">
                      Fix: {clash.recommendedFix}
                    </span>
                    {clash.canAutoFixSchedule && onAutoFixClash && (
                      <button
                        type="button"
                        onClick={() => onAutoFixClash(clash)}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[10px] shrink-0 cursor-pointer shadow-sm active:scale-95 transition-all"
                      >
                        Auto-Fix Timing
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Card A: Next Best Action (if short of goal) */}
          {isShortOfGoal && nextBestAction && (
            <div className="p-3 bg-gradient-to-r from-cyan-950/40 to-slate-900/60 border border-cyan-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                  <Zap size={13} className="text-cyan-400" />
                  <span>Next Best Action to Hit 80/20 Sweet Spot</span>
                </div>
                <span className="text-[10px] font-mono font-extrabold text-cyan-300 bg-cyan-500/20 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                  +{nextBestAction.expectedPointsBoost} pts
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                {nextBestAction.rationale}
              </p>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-mono text-slate-400">
                  {nextBestAction.frictionDescription}
                </span>

                {onAddModalityToToday && (
                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={handleAddNextAction}
                    className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-extrabold text-[11px] rounded-lg shadow-sm flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus size={12} />
                    <span>Add {nextBestAction.modalityName}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Card B: Friction Buster / Bench Candidate (if effort is over budget) */}
          {isEffortOverBudget && benchCandidate && (
            <div className="p-3 bg-gradient-to-r from-amber-950/40 to-slate-900/60 border border-amber-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                  <Scale size={13} className="text-amber-400" />
                  <span>High Daily Friction: Safe to Bench</span>
                </div>
                <span className="text-[10px] font-mono font-extrabold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  Save {benchCandidate.effortPointsSaved} effort pts
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                {benchCandidate.rationale}
              </p>

              <div className="flex items-center justify-end gap-2 pt-1">
                {onBenchModality && (
                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={handleBenchCandidate}
                    className="px-3 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 font-bold text-[10px] rounded-lg shadow-sm flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                  >
                    <span>Bench for 14 Days</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active Foundational Anchors Breakdown */}
          {outcomeState.tierBreakdown.foundational.length > 0 && (
            <div className="pt-1 flex items-center flex-wrap gap-1.5 text-[10px]">
              <span className="font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Layers size={11} /> 80/20 Core Anchors Active:
              </span>
              {outcomeState.tierBreakdown.foundational.map(item => (
                <span 
                  key={item.modality.id} 
                  className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-medium"
                >
                  ★ {item.modality.name}
                </span>
              ))}
            </div>
          )}

          {/* Footer Action: Open Full Curve Modal */}
          <div className="pt-1.5 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500">
              Status: {outcomeState.statusLabel}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAnalysisModalOpen(true)}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                title="View Clinical Analysis & Scoring Calculus"
              >
                <Info size={12} />
                <span>Clinical Analysis</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenTuneModal(outcomeState)}
                className="text-xs font-bold text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Full 80/20 Pareto Curve &amp; Sliders</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Clinical Analysis & Evidence Explainer Modal */}
      {isAnalysisModalOpen && (
        <LongevityAnalysisModal
          isOpen={isAnalysisModalOpen}
          onClose={() => setIsAnalysisModalOpen(false)}
          outcomeId={normKey}
          outcomeName={outcomeDim.name}
          currentDialedInScore={outcomeState.dialedInScore}
          activeModalities={activeModalitiesToday.length > 0 ? activeModalitiesToday : allModalities}
          todayTasks={todayTasks}
        />
      )}
    </div>
  )
}
