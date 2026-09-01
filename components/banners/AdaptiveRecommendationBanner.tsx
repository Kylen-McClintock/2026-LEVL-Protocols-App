'use client'

import React, { useState, useMemo } from 'react'
import {
  Sparkles,
  Zap,
  Check,
  Plus,
  Bookmark,
  ArrowRight,
  X,
  Scale,
  ShieldCheck,
  TrendingUp,
  Activity,
  Flame,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  Microscope,
  ExternalLink,
  BookOpen
} from 'lucide-react'
import { Modality, UserProfile, DailyProtocolTask } from '@/lib/types'
import {
  evaluateUserAdherenceState,
  generateNextBestActionRecommendation,
  generateEightyTwentySimplificationRecommendation,
  getEffortMetadata,
  getCostMetadata
} from '@/lib/ranking/adaptiveRecommendationEngine'

interface AdaptiveRecommendationBannerProps {
  tasks: DailyProtocolTask[]
  allModalities: Modality[]
  userProfile?: UserProfile | null
  streakDays?: number
  benchItems?: any[]
  onAddToToday: (modalityId: string) => Promise<void>
  onMoveToBench?: (modalityId: string) => Promise<void>
}

export const AdaptiveRecommendationBanner: React.FC<AdaptiveRecommendationBannerProps> = ({
  tasks,
  allModalities,
  userProfile,
  streakDays = 0,
  benchItems = [],
  onAddToToday,
  onMoveToBench
}) => {
  const [isDismissed, setIsDismissed] = useState(false)
  const [isActionDone, setIsActionDone] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const [benchedIds, setBenchedIds] = useState<string[]>([])
  const [benchedNamesMap, setBenchedNamesMap] = useState<Record<string, string>>({})
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showOtherCandidates, setShowOtherCandidates] = useState(false)
  const [processingModalityId, setProcessingModalityId] = useState<string | null>(null)

  // 0. Extract set of all known benched/eliminated modality IDs
  const benchedModalityIds = useMemo(() => {
    const ids = new Set<string>(benchedIds)
    if (benchItems && Array.isArray(benchItems)) {
      benchItems.forEach((b: any) => {
        if (b.modality_id && (b.status === 'benched' || b.status === 'eliminated' || b.status === 'inactive')) {
          ids.add(b.modality_id)
        }
      })
    }
    return ids
  }, [benchedIds, benchItems])

  // 1. Evaluate real-time adherence state
  const adherenceEval = useMemo(() => {
    return evaluateUserAdherenceState(tasks, streakDays, benchedModalityIds)
  }, [tasks, streakDays, benchedModalityIds])

  // 2. Identify active modality IDs
  const activeModalityIds = useMemo(() => {
    const ids = new Set<string>()
    tasks.forEach(t => {
      const mId = t.modality_id || t.protocol_step?.modality_id
      if (mId) ids.add(mId)
    })
    return ids
  }, [tasks])

  // 3. Dynamically generate either Next Best Action (Progression) OR 80/20 Simplification (De-escalation)
  const recommendation = useMemo(() => {
    if (adherenceEval.status === 'struggling') {
      const deescalationRec = generateEightyTwentySimplificationRecommendation(tasks, allModalities, benchedModalityIds)
      if (deescalationRec) return deescalationRec
    }
    // Default to Next Best Action if balanced, thriving, or building baseline consistency
    return generateNextBestActionRecommendation(allModalities, activeModalityIds, userProfile)
  }, [adherenceEval.status, tasks, allModalities, activeModalityIds, userProfile, benchedModalityIds])

  if (isDismissed || !recommendation || tasks.length === 0) return null

  // ---------------------------------------------------------------------------
  // RENDER: 80/20 SIMPLIFICATION (De-escalate Friction When Struggling)
  // ---------------------------------------------------------------------------
  if (recommendation.type === 'eighty_twenty_simplification') {
    const culprit = recommendation.culpritModality
    const effort = recommendation.effortMeta
    const culpritName = culprit.display_name || culprit.name

    const handleBenchModality = async (modalityId: string, name: string) => {
      setProcessingModalityId(modalityId)
      setIsProcessing(true)
      // Instant optimistic collapse & confirmation
      setBenchedIds(prev => Array.from(new Set([...prev, modalityId])))
      setBenchedNamesMap(prev => ({ ...prev, [modalityId]: name }))
      setIsCollapsed(true)

      try {
        if (onMoveToBench) {
          await onMoveToBench(modalityId)
        }
      } catch (err) {
        console.error('Error benching modality:', err)
      } finally {
        setIsProcessing(false)
        setProcessingModalityId(null)
      }
    }

    const benchedNamesList = benchedIds.map(id => benchedNamesMap[id] || 'Modality').filter(Boolean)

    // Collapsed State once benched
    if (isCollapsed && benchedIds.length > 0) {
      return (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 p-3 sm:p-4 shadow-xl backdrop-blur-md animate-in fade-in">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <Check size={14} />
              </div>
              <div>
                <span className="text-xs font-extrabold text-emerald-300">Stack Reset Active: </span>
                <span className="text-xs text-slate-300">
                  Moved <strong className="text-white">{benchedNamesList.join(', ')}</strong> to Bench (14 Days)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer"
              >
                <span>Expand Details</span>
                <ChevronDown size={14} />
              </button>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Dismiss banner"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )
    }

    const isCulpritBenched = benchedIds.includes(culprit.id)

    return (
      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-4 sm:p-5 shadow-xl relative overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-top-2">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Scale size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                  80/20 Protocol Simplification
                </span>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                  Friction Reduction
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                {recommendation.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {benchedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer"
                title="Collapse banner"
              >
                <span>Collapse</span>
                <ChevronUp size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              title="Dismiss suggestion"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-300 mt-2.5 leading-relaxed relative z-10">
          {recommendation.simplificationReason}
        </p>

        {/* Preserved Core 80/20 Anchors */}
        <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1.5 relative z-10 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-400" /> Preserved 80/20 Core Anchors (Low Friction, High ROI):
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {recommendation.preservedCoreStack.map((name, i) => (
              <span key={i} className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                ✓ {name}
              </span>
            ))}
          </div>
        </div>

        {/* Primary Action Row */}
        <div className="mt-3.5 flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/5 relative z-10">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${effort.badgeColor}`}>
              Friction: {effort.shortLabel}
            </span>
            <span className="text-[10px] text-slate-400">
              Est: {effort.timeEstimate}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleBenchModality(culprit.id, culpritName)}
            disabled={isCulpritBenched || isProcessing}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
              isCulpritBenched
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-amber-600 hover:bg-amber-500 text-black font-extrabold shadow-amber-900/30 active:scale-95'
            }`}
          >
            {isCulpritBenched ? <Check size={13} /> : <Bookmark size={13} />}
            <span>{isCulpritBenched ? 'Moved to Bench • Stack Reset' : `Bench ${culpritName} (14 Days)`}</span>
          </button>
        </div>

        {/* Expandable Secondary Candidates */}
        {recommendation.otherCandidates && recommendation.otherCandidates.length > 0 && (
          <div className="mt-3.5 pt-2 border-t border-white/10 relative z-10">
            <button
              type="button"
              onClick={() => setShowOtherCandidates(!showOtherCandidates)}
              className="w-full flex items-center justify-between text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer py-1"
            >
              <span className="flex items-center gap-1.5">
                <Layers size={14} />
                Other Options to Simplify Stack ({recommendation.otherCandidates.length})
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400 font-normal">
                <span>{showOtherCandidates ? 'Hide Options' : 'Expand Options'}</span>
                {showOtherCandidates ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </button>

            {showOtherCandidates && (
              <div className="mt-2.5 space-y-2.5 animate-in fade-in slide-in-from-top-1">
                {recommendation.otherCandidates.map((cand, idx) => {
                  const candMod = cand.modality
                  const candName = candMod.display_name || candMod.name
                  const isCandBenched = benchedIds.includes(candMod.id)

                  return (
                    <div key={candMod.id || idx} className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-white">
                            {candName}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${cand.effortMeta.badgeColor}`}>
                            {cand.effortMeta.shortLabel}
                          </span>
                          {cand.missedCount > 0 && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                              {cand.missedCount} Missed
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleBenchModality(candMod.id, candName)}
                          disabled={isCandBenched || (isProcessing && processingModalityId === candMod.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isCandBenched
                              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                              : 'bg-amber-600 hover:bg-amber-500 text-black font-extrabold shadow-sm active:scale-95'
                          }`}
                        >
                          {isCandBenched ? <Check size={12} /> : <Bookmark size={12} />}
                          <span>{isCandBenched ? 'Moved to Bench' : `Bench ${candName} (14 Days)`}</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        <span className="font-semibold text-amber-300/90">Reasoning: </span>
                        {cand.reasoning}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }


  // ---------------------------------------------------------------------------
  // RENDER: NEXT BEST ACTION (Progression Addition When Thriving)
  // ---------------------------------------------------------------------------
  const targetMod = recommendation.modality
  const effort = recommendation.effortMeta
  const cost = recommendation.costMeta

  const [isNbaExpanded, setIsNbaExpanded] = useState(false)
  const [isNbaBenched, setIsNbaBenched] = useState(false)

  const handleAddModality = async () => {
    setIsProcessing(true)
    try {
      await onAddToToday(targetMod.id)
      setIsActionDone(true)
    } catch (err) {
      console.error('Error adding next best action:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBenchNba = async () => {
    if (!onMoveToBench) return
    setIsProcessing(true)
    try {
      await onMoveToBench(targetMod.id)
      setIsNbaBenched(true)
    } catch (err) {
      console.error('Error benching next best action:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-950 p-4 sm:p-5 shadow-2xl relative overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-top-2 space-y-4">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold shadow-[0_0_14px_rgba(168,85,247,0.3)] shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300">
                Next Best Action (Stack Progression)
              </span>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-700/80">
                Longevity Score: {recommendation.longevityImpactScore}/10
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
              {recommendation.title}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          title="Dismiss suggestion"
        >
          <X size={14} />
        </button>
      </div>

      {/* Recommendation Rationale Summary */}
      <p className="text-xs text-slate-300 leading-relaxed relative z-10">
        {recommendation.detailedRationale}
      </p>

      {/* Metadata Badges & Learn More Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/5 relative z-10">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${effort.badgeColor}`}>
            {effort.shortLabel}
          </span>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
            Cost: {cost.shortLabel}
          </span>
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-purple-950/80 border border-purple-800 text-purple-300">
            ROI Score: {recommendation.roiScore}%
          </span>
          {targetMod.category && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-400 capitalize">
              {targetMod.category.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Expand / Collapse In-Place Button */}
        <button
          type="button"
          onClick={() => setIsNbaExpanded(!isNbaExpanded)}
          className="text-[11px] font-bold text-purple-300 hover:text-white px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ml-auto sm:ml-0"
        >
          <Info size={13} className="text-purple-400" />
          <span>{isNbaExpanded ? 'Hide Protocol Specs' : 'Learn More & Protocol Specs'}</span>
          {isNbaExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* EXPANDED INLINE CLINICAL & PROTOCOL SPECIFICATIONS */}
      {isNbaExpanded && (
        <div className="p-4 bg-slate-950/90 border border-purple-500/30 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 relative z-10 shadow-inner">
          {/* Scientific Mechanism & Clinical Rationale */}
          {(targetMod.expanded_why || targetMod.brief_description || targetMod.mechanism_of_action || targetMod.headline_benefit || targetMod.implementation_summary) && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <Microscope size={13} className="text-purple-400" /> Scientific Mechanism &amp; Evidence
              </span>
              <p className="text-xs text-slate-300 leading-relaxed pl-5">
                {targetMod.expanded_why || targetMod.brief_description || targetMod.mechanism_of_action || targetMod.headline_benefit || targetMod.implementation_summary}
              </p>
            </div>
          )}

          {/* Clinical Protocol Specifications 4-Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Prescribed Dose */}
            <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                💊 Prescribed Protocol Dose
              </span>
              <span className="text-xs font-bold text-emerald-300 font-mono">
                {targetMod.dose_or_exposure || 'Standard Clinically Validated Dose'}
              </span>
            </div>

            {/* Optimal Circadian Window */}
            <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                ⏰ Circadian Timing Window
              </span>
              <span className="text-xs font-bold text-cyan-300 font-mono">
                {targetMod.timing_summary || targetMod.default_timing_slot || 'Target Timing Window'}
              </span>
            </div>

            {/* Recommended Cadence */}
            <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                📅 Frequency &amp; Cadence
              </span>
              <span className="text-xs font-bold text-purple-300 font-mono">
                {targetMod.frequency || 'Daily Protocol'}
              </span>
            </div>

            {/* Administration Route */}
            <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                🧬 Modality Type &amp; Category
              </span>
              <span className="text-xs font-bold text-amber-300 font-mono capitalize">
                {targetMod.category?.replace(/_/g, ' ') || targetMod.modality_type || 'Biological Optimization'}
              </span>
            </div>
          </div>

          {/* Primary Outcome & Secondary Impacts */}
          {(targetMod.primary_outcome || (targetMod.secondary_outcomes && targetMod.secondary_outcomes.length > 0)) && (
            <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center text-xs">
              {targetMod.primary_outcome && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-400 font-semibold text-[11px]">Primary Target:</span>
                  <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full font-bold text-[10px] uppercase tracking-wider">
                    {targetMod.primary_outcome.replace(/_/g, ' ')}
                  </span>
                </div>
              )}

              {targetMod.secondary_outcomes && targetMod.secondary_outcomes.length > 0 && (
                <div className="flex items-center gap-1.5 text-slate-300 text-[11px] flex-wrap">
                  <span className="text-purple-300 font-semibold">Secondary Outcomes:</span>
                  {targetMod.secondary_outcomes.slice(0, 3).map((out, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-800/80 text-slate-300 border border-slate-700 rounded-md text-[10px]">
                      {out.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Research Paper Link */}
          {targetMod.scientific_references && targetMod.scientific_references.length > 0 && targetMod.scientific_references[0].url && (
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Clinical Validation:</span>
              <a
                href={targetMod.scientific_references[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 flex items-center gap-1 font-bold text-[11px]"
              >
                <span>{targetMod.scientific_references[0].title || 'Read PubMed Research Paper'}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10 relative z-10 flex-wrap">
        {onMoveToBench && (
          <button
            type="button"
            onClick={handleBenchNba}
            disabled={isNbaBenched || isActionDone || isProcessing}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              isNbaBenched
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-300 hover:text-white'
            }`}
          >
            {isNbaBenched ? <Check size={13} /> : <Bookmark size={13} />}
            <span>{isNbaBenched ? 'Saved to Bench (14 Days)' : 'Save to Bench'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleAddModality}
          disabled={isActionDone || isProcessing}
          className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] ${
            isActionDone
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
              : 'bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white shadow-purple-900/40'
          }`}
        >
          {isActionDone ? <Check size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
          <span>{isActionDone ? 'Enrolled in Today' : `Add ${targetMod.display_name || targetMod.name} to Today`}</span>
        </button>
      </div>
    </div>
  )
}
