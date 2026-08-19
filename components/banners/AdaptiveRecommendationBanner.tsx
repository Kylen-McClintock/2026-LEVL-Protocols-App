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
  Layers
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
  onAddToToday: (modalityId: string) => Promise<void>
  onMoveToBench?: (modalityId: string) => Promise<void>
}

export const AdaptiveRecommendationBanner: React.FC<AdaptiveRecommendationBannerProps> = ({
  tasks,
  allModalities,
  userProfile,
  streakDays = 0,
  onAddToToday,
  onMoveToBench
}) => {
  const [isDismissed, setIsDismissed] = useState(false)
  const [isActionDone, setIsActionDone] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // 1. Evaluate real-time adherence state
  const adherenceEval = useMemo(() => {
    return evaluateUserAdherenceState(tasks, streakDays)
  }, [tasks, streakDays])

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
      return generateEightyTwentySimplificationRecommendation(tasks, allModalities)
    }
    // Default to Next Best Action if balanced or thriving
    return generateNextBestActionRecommendation(allModalities, activeModalityIds, userProfile)
  }, [adherenceEval.status, tasks, allModalities, activeModalityIds, userProfile])

  if (isDismissed || !recommendation || tasks.length === 0) return null

  // ---------------------------------------------------------------------------
  // RENDER: 80/20 SIMPLIFICATION (De-escalate Friction When Struggling)
  // ---------------------------------------------------------------------------
  if (recommendation.type === 'eighty_twenty_simplification') {
    const culprit = recommendation.culpritModality
    const effort = recommendation.effortMeta

    const handleBenchCulprit = async () => {
      setIsProcessing(true)
      try {
        if (onMoveToBench) {
          await onMoveToBench(culprit.id)
        }
        setIsActionDone(true)
      } catch (err) {
        console.error('Error benching culprit modality:', err)
      } finally {
        setIsProcessing(false)
      }
    }

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

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Dismiss suggestion"
          >
            <X size={14} />
          </button>
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

        {/* Action Button */}
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
            onClick={handleBenchCulprit}
            disabled={isActionDone || isProcessing}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
              isActionDone
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-amber-600 hover:bg-amber-500 text-black font-extrabold shadow-amber-900/30 active:scale-95'
            }`}
          >
            {isActionDone ? <Check size={13} /> : <Bookmark size={13} />}
            <span>{isActionDone ? 'Moved to Bench • Stack Reset' : `Bench ${culprit.display_name || culprit.name} (14 Days)`}</span>
          </button>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // RENDER: NEXT BEST ACTION (Progression Addition When Thriving)
  // ---------------------------------------------------------------------------
  const targetMod = recommendation.modality
  const effort = recommendation.effortMeta
  const cost = recommendation.costMeta

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

  return (
    <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/50 via-slate-900 to-slate-950 p-4 sm:p-5 shadow-xl relative overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-top-2">
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold shadow-[0_0_12px_rgba(168,85,247,0.2)]">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300">
                Next Best Action (Stack Progression)
              </span>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                Longevity Score: {recommendation.longevityImpactScore}/10
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              {recommendation.title}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          title="Dismiss suggestion"
        >
          <X size={14} />
        </button>
      </div>

      <p className="text-xs text-slate-300 mt-2.5 leading-relaxed relative z-10">
        {recommendation.detailedRationale}
      </p>

      {/* Metadata & Multi-Dimensional Badges */}
      <div className="mt-3.5 flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/5 relative z-10">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${effort.badgeColor}`}>
            {effort.shortLabel}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
            Cost: {cost.shortLabel}
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-800 text-purple-300">
            ROI Score: {recommendation.roiScore}%
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddModality}
          disabled={isActionDone || isProcessing}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
            isActionDone
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/40 active:scale-95'
          }`}
        >
          {isActionDone ? <Check size={13} /> : <Plus size={13} />}
          <span>{isActionDone ? 'Enrolled in Today' : `Add ${targetMod.display_name || targetMod.name} to Today`}</span>
        </button>
      </div>
    </div>
  )
}
