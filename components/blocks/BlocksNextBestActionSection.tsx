'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Sparkles,
  Zap,
  Check,
  Plus,
  Bookmark,
  ChevronDown,
  ChevronUp,
  X,
  Scale,
  Flame,
  Info,
  Layers,
  CalendarPlus,
  ExternalLink
} from 'lucide-react'
import { Modality, UserProfile, UserBenchItem } from '@/lib/types'
import { DedupedTask } from '@/components/cards/ProtocolTaskCard'
import ModalityIcon from '@/components/ui/ModalityIcon'
import ScheduleModalityModal from '@/components/modals/ScheduleModalityModal'
import ExploreCard from '@/components/cards/ExploreCard'
import {
  evaluateUserAdherenceState,
  generateNextBestActionRecommendation,
  generateEightyTwentySimplificationRecommendation,
  getEffortMetadata,
  getCostMetadata
} from '@/lib/ranking/adaptiveRecommendationEngine'
import { BlocksVisualStyle } from './blocksUtils'
import { triggerHaptic } from '@/lib/utils/haptics'
import { useTheme } from '@/lib/utils/useTheme'

interface BlocksNextBestActionSectionProps {
  tasks: DedupedTask[]
  allModalities?: Modality[]
  userProfile?: UserProfile | null
  benchItems?: UserBenchItem[]
  streakDays?: number
  visualStyle: BlocksVisualStyle
  date: string
  onAddToToday?: (modalityId: string) => Promise<void>
  onMoveToBench?: (modalityId: string) => void | Promise<void>
}

const STORAGE_KEY_NBA_EXPANDED = 'levl_blocks_nba_expanded'
const STORAGE_KEY_NBA_DISMISSED_PREFIX = 'levl_blocks_nba_dismissed_'

export default function BlocksNextBestActionSection({
  tasks,
  allModalities = [],
  userProfile,
  benchItems = [],
  streakDays = 0,
  visualStyle,
  date,
  onAddToToday,
  onMoveToBench
}: BlocksNextBestActionSectionProps) {
  const { theme } = useTheme()
  const isDaylight = theme === 'light'

  // Persisted expand/collapse state (Default: false to match minimal blocks ergonomics)
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      const val = localStorage.getItem(STORAGE_KEY_NBA_EXPANDED)
      return val === 'true'
    } catch {
      return false
    }
  })

  // Session dismiss state
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      const val = sessionStorage.getItem(`${STORAGE_KEY_NBA_DISMISSED_PREFIX}${date}`)
      return val === 'true'
    } catch {
      return false
    }
  })

  const [isActionDone, setIsActionDone] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isNbaBenched, setIsNbaBenched] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<'added' | 'bench' | null>(null)
  const [showFullSpecs, setShowFullSpecs] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [showOtherCandidates, setShowOtherCandidates] = useState(false)

  const toggleExpanded = () => {
    triggerHaptic('light')
    const nextVal = !isExpanded
    setIsExpanded(nextVal)
    try {
      localStorage.setItem(STORAGE_KEY_NBA_EXPANDED, String(nextVal))
    } catch {}
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    triggerHaptic('light')
    setIsDismissed(true)
    try {
      sessionStorage.setItem(`${STORAGE_KEY_NBA_DISMISSED_PREFIX}${date}`, 'true')
    } catch {}
  }

  // 1. Extract set of known benched modality IDs
  const benchedModalityIds = useMemo(() => {
    const ids = new Set<string>()
    if (benchItems && Array.isArray(benchItems)) {
      benchItems.forEach((b: any) => {
        if (b.modality_id && (b.status === 'benched' || b.status === 'eliminated' || b.status === 'inactive')) {
          ids.add(b.modality_id)
        }
      })
    }
    return ids
  }, [benchItems])

  // 2. Identify active modality IDs from today's tasks
  const activeModalityIds = useMemo(() => {
    const ids = new Set<string>()
    tasks.forEach((t) => {
      const mId = t.modality_id || t.protocol_step?.modality_id || t.loose_modality?.id
      if (mId) ids.add(mId)
    })
    return ids
  }, [tasks])

  // 3. Evaluate real-time adherence state
  const adherenceEval = useMemo(() => {
    return evaluateUserAdherenceState(tasks as any, streakDays, benchedModalityIds)
  }, [tasks, streakDays, benchedModalityIds])

  // 4. Dynamically generate either Next Best Action or 80/20 Simplification
  const recommendation = useMemo(() => {
    if (allModalities.length === 0) return null

    if (adherenceEval.status === 'struggling') {
      const deescalationRec = generateEightyTwentySimplificationRecommendation(
        tasks as any,
        allModalities,
        benchedModalityIds
      )
      if (deescalationRec) return deescalationRec
    }

    return generateNextBestActionRecommendation(allModalities, activeModalityIds, userProfile)
  }, [adherenceEval.status, tasks, allModalities, activeModalityIds, userProfile, benchedModalityIds])

  // If dismissed, completed, no tasks, or no recommendation, do not render
  if (isDismissed || !recommendation || tasks.length === 0) {
    return null
  }

  const isSimplification = recommendation.type === 'eighty_twenty_simplification'
  const targetMod = isSimplification ? recommendation.culpritModality : recommendation.modality
  const effort = isSimplification ? recommendation.effortMeta : recommendation.effortMeta
  const cost = !isSimplification ? recommendation.costMeta : getCostMetadata((targetMod as any).cost_tier || targetMod.name)

  // Disappear if the target is already in today's active tasks or benched
  if (isActionDone || isNbaBenched || (!isSimplification && activeModalityIds.has(targetMod.id))) {
    return null
  }

  const handleAddModality = async (modalityId?: string, e?: React.MouseEvent) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
    const targetId = (typeof modalityId === 'string' && modalityId) ? modalityId : targetMod.id
    if (!onAddToToday || isProcessing) return
    triggerHaptic('success')
    setIsProcessing(true)
    setActionSuccess('added')
    try {
      await onAddToToday(targetId)
      await new Promise((r) => setTimeout(r, 600))
      setIsActionDone(true)
    } catch (err) {
      console.error('Error adding next best action to today:', err)
      setActionSuccess(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBenchModality = async (modalityId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!onMoveToBench || isProcessing) return
    triggerHaptic('selection')
    setIsProcessing(true)
    setActionSuccess('bench')
    try {
      await onMoveToBench(modalityId)
      await new Promise((r) => setTimeout(r, 600))
      setIsNbaBenched(true)
    } catch (err) {
      console.error('Error benching modality from recommendation:', err)
      setActionSuccess(null)
    } finally {
      setIsProcessing(false)
    }
  }

  // ---------------------------------------------------------------------------
  // RENDER: Collapsed State (Tactile 1-line Bar)
  // ---------------------------------------------------------------------------
  if (!isExpanded) {
    return (
      <div
        id="blocks-next-best-action-bar"
        onClick={toggleExpanded}
        className={`w-full h-14 sm:h-16 px-4 sm:px-5 rounded-2xl sm:rounded-3xl border flex items-center justify-between transition-all duration-300 cursor-pointer shadow-md select-none group active:scale-[0.99] ${
          isDaylight
            ? isSimplification
              ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/70 text-amber-950 shadow-sm'
              : 'bg-white border-[#E1E8E3] hover:bg-slate-50 text-[#475569] shadow-sm'
            : isSimplification
            ? visualStyle === 'dark-outline'
              ? 'bg-slate-950/95 border-[2.5px] border-amber-500/50 hover:border-amber-400/80 shadow-xl shadow-amber-950/30 text-white'
              : 'bg-gradient-to-r from-amber-950/90 via-slate-950/95 to-orange-950/90 border border-amber-400/50 hover:border-amber-300/70 text-white'
            : visualStyle === 'dark-outline'
            ? 'bg-slate-950/95 border-[2.5px] border-purple-500/50 hover:border-purple-400/80 shadow-xl shadow-purple-950/30 text-white'
            : 'bg-gradient-to-r from-purple-950/90 via-slate-950/95 to-indigo-950/90 border border-purple-400/50 hover:border-purple-300/70 text-white'
        }`}
      >
        {/* Left: Glowing Icon + Title & Recommendation Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isDaylight
                ? isSimplification
                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                  : 'bg-purple-50 text-purple-700 border border-purple-200'
                : isSimplification
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                : 'bg-purple-500/20 border border-purple-500/50 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.35)]'
            }`}
          >
            {isSimplification ? (
              <Scale size={16} strokeWidth={2.5} />
            ) : (
              <Sparkles size={16} strokeWidth={2.5} />
            )}
          </div>

          <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
            <span
              className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${
                isDaylight
                  ? isSimplification
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-purple-100 text-purple-800 border-purple-300'
                  : isSimplification
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                  : 'bg-purple-950/80 text-purple-300 border-purple-500/40'
              }`}
            >
              {isSimplification ? '80/20 Simplification' : 'Next Best Action'}
            </span>

            <span
              className={`font-extrabold text-xs sm:text-sm tracking-tight truncate transition-colors ${
                isDaylight
                  ? 'text-slate-900 group-hover:text-purple-700'
                  : 'text-white group-hover:text-purple-300'
              }`}
            >
              {targetMod.display_name || targetMod.name}
            </span>

            {!isSimplification && (
              <span className="text-[10px] text-emerald-500 dark:text-emerald-300 font-mono hidden md:inline">
                (+{recommendation.longevityImpactScore}/10 Longevity)
              </span>
            )}
          </div>
        </div>

        {/* Right: Quick Action Button + Chevron Toggle */}
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {!isSimplification && onAddToToday && (
            <button
              type="button"
              onClick={(e) => handleAddModality(targetMod.id, e)}
              disabled={isProcessing || actionSuccess !== null}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 ${
                actionSuccess === 'added'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                  : isDaylight
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/30'
              }`}
              title="Add this intervention directly to Today"
            >
              {actionSuccess === 'added' ? (
                <Check size={13} strokeWidth={3} />
              ) : (
                <Plus size={13} strokeWidth={3} />
              )}
              <span className="hidden sm:inline">
                {actionSuccess === 'added' ? 'Added' : 'Add to Today'}
              </span>
            </button>
          )}

          {isSimplification && onMoveToBench && (
            <button
              type="button"
              onClick={(e) => handleBenchModality(targetMod.id, e)}
              disabled={isProcessing || actionSuccess !== null}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 ${
                actionSuccess === 'bench'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                  : 'bg-amber-600 hover:bg-amber-500 text-black font-extrabold shadow-amber-900/30'
              }`}
              title="Bench this high-friction modality for 14 days"
            >
              {actionSuccess === 'bench' ? <Check size={13} /> : <Bookmark size={13} />}
              <span className="hidden sm:inline">
                {actionSuccess === 'bench' ? 'Benched' : 'Bench 14d'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleExpanded}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isDaylight
                ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Expand Next Best Action details"
          >
            <ChevronDown size={17} />
          </button>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // RENDER: Expanded State (Full Interactive Clinical Block)
  // ---------------------------------------------------------------------------
  return (
    <div
      id="blocks-next-best-action-expanded"
      className={`w-full rounded-2xl sm:rounded-3xl border p-4 sm:p-5 transition-all duration-300 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 relative overflow-hidden ${
        isDaylight
          ? isSimplification
            ? 'bg-amber-50/80 border-amber-200/90 text-amber-950'
            : 'bg-white border-[#E1E8E3] text-slate-900'
          : isSimplification
          ? visualStyle === 'dark-outline'
            ? 'bg-slate-950/95 border-[2.5px] border-amber-500/60 shadow-2xl shadow-amber-950/30 text-white'
            : 'bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950 border border-amber-400/50 text-white'
          : visualStyle === 'dark-outline'
          ? 'bg-slate-950/95 border-[2.5px] border-purple-500/60 shadow-2xl shadow-purple-950/30 text-white'
          : 'bg-gradient-to-br from-purple-950/70 via-slate-900 to-slate-950 border border-purple-400/50 text-white'
      }`}
    >
      {/* Background ambient blur for visual depth */}
      {!isDaylight && (
        <div
          className={`absolute -top-12 -right-12 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-40 ${
            isSimplification ? 'bg-amber-500/20' : 'bg-purple-500/20'
          }`}
        />
      )}

      {/* Header Bar */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
              isDaylight
                ? isSimplification
                  ? 'bg-amber-100 text-amber-700 border border-amber-300 shadow-sm'
                  : 'bg-purple-100 text-purple-700 border border-purple-200 shadow-sm'
                : isSimplification
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.3)]'
                : 'bg-purple-500/20 border border-purple-500/50 text-purple-400 shadow-[0_0_14px_rgba(168,85,247,0.3)]'
            }`}
          >
            <ModalityIcon modality={targetMod} size={22} glow={false} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${
                  isDaylight
                    ? isSimplification
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-purple-100 text-purple-800 border-purple-300'
                    : isSimplification
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                    : 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                }`}
              >
                {isSimplification ? '80/20 Simplification' : 'Next Best Action (Stack Progression)'}
              </span>

              {!isSimplification && (
                <span className="text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-700/80 shrink-0">
                  Longevity Score: {recommendation.longevityImpactScore}/10
                </span>
              )}
            </div>

            <h3
              className={`text-sm sm:text-base font-extrabold mt-1 truncate ${
                isDaylight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {isSimplification ? recommendation.title : recommendation.title}
            </h3>
          </div>
        </div>

        {/* Header Controls: Collapse & Dismiss */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={toggleExpanded}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isDaylight
                ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Collapse view"
          >
            <ChevronUp size={18} />
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isDaylight
                ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Dismiss recommendation for today"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Rationale Body */}
      <p
        className={`text-xs sm:text-sm leading-relaxed relative z-10 ${
          isDaylight ? 'text-slate-600' : 'text-slate-300'
        }`}
      >
        {isSimplification
          ? recommendation.simplificationReason
          : recommendation.detailedRationale}
      </p>

      {/* Metadata Badges & Specs Row */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/10 relative z-10">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${effort.badgeColor}`}>
            Friction: {effort.shortLabel}
          </span>
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
              isDaylight
                ? 'bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            Cost: {cost.shortLabel}
          </span>
          {!isSimplification && (
            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md border ${
                isDaylight
                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                  : 'bg-purple-950/80 border-purple-800 text-purple-300'
              }`}
            >
              ROI: {recommendation.roiScore}%
            </span>
          )}
          {targetMod.category && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border capitalize ${
                isDaylight
                  ? 'bg-slate-50 border-slate-200 text-slate-600'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              {targetMod.category.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Toggle Full Specs Button */}
        <button
          type="button"
          onClick={() => setShowFullSpecs(!showFullSpecs)}
          className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            isDaylight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-300 hover:text-white'
          }`}
        >
          <Info size={13} />
          <span>{showFullSpecs ? 'Hide Specs' : 'View Clinical Specs'}</span>
          {showFullSpecs ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Expandable Inline Specs (ExploreCard) */}
      {showFullSpecs && (
        <div
          className={`p-3 rounded-2xl border animate-in fade-in slide-in-from-top-2 relative z-10 ${
            isDaylight
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-950/90 border-purple-500/30'
          }`}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-purple-400">
              <Sparkles size={13} /> Full Modality Profile &amp; Protocol Dosing
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              Citations, GeekMode &amp; Longevity Impact
            </span>
          </div>

          <ExploreCard
            modality={targetMod}
            userProfile={userProfile}
            activeStatus={isActionDone ? 'today' : isNbaBenched ? 'bench' : null}
            todayModalities={allModalities.filter((m) => activeModalityIds.has(m.id))}
            benchModalities={allModalities.filter((m) => benchedModalityIds.has(m.id))}
            onAddToToday={handleAddModality}
            onAddToBench={async (mId) => {
              await handleBenchModality(mId)
            }}
          />
        </div>
      )}

      {/* Expandable Secondary Candidates for 80/20 Simplification */}
      {isSimplification && recommendation.otherCandidates && recommendation.otherCandidates.length > 0 && (
        <div className="pt-2 border-t border-white/10 relative z-10">
          <button
            type="button"
            onClick={() => setShowOtherCandidates(!showOtherCandidates)}
            className="w-full flex items-center justify-between text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors cursor-pointer py-1"
          >
            <span className="flex items-center gap-1.5">
              <Layers size={14} />
              Other Modalities to Simplify Stack ({recommendation.otherCandidates.length})
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-normal">
              <span>{showOtherCandidates ? 'Hide' : 'Expand'}</span>
              {showOtherCandidates ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>

          {showOtherCandidates && (
            <div className="mt-2 space-y-2">
              {recommendation.otherCandidates.map((cand) => (
                <div
                  key={cand.modality.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                    isDaylight
                      ? 'bg-white border-amber-200'
                      : 'bg-slate-900/80 border-amber-500/20'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold truncate block">
                      {cand.modality.display_name || cand.modality.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {cand.reasoning}
                    </span>
                  </div>
                  {onMoveToBench && (
                    <button
                      type="button"
                      onClick={(e) => handleBenchModality(cand.modality.id, e)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 transition-all shrink-0 cursor-pointer"
                    >
                      Bench 14d
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10 relative z-10 flex-wrap w-full">
        {onMoveToBench && (
          <button
            type="button"
            onClick={(e) => handleBenchModality(targetMod.id, e)}
            disabled={isNbaBenched || isActionDone || isProcessing}
            className={`w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
              actionSuccess === 'bench' || isNbaBenched
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : isDaylight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-300 hover:text-white'
            }`}
          >
            {actionSuccess === 'bench' || isNbaBenched ? (
              <Check size={14} className="stroke-[3]" />
            ) : (
              <Bookmark size={14} />
            )}
            <span>
              {actionSuccess === 'bench' || isNbaBenched
                ? 'Saved to Bench'
                : isSimplification
                ? 'Bench for 14 Days'
                : 'Save to Bench'}
            </span>
          </button>
        )}

        {!isSimplification && (
          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className={`w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
              isDaylight
                ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
                : 'bg-purple-950/40 hover:bg-purple-900/50 border-purple-500/30 text-purple-300 hover:text-white'
            }`}
          >
            <CalendarPlus size={14} />
            <span>Customize Cadence</span>
          </button>
        )}

        {!isSimplification && onAddToToday && (
          <button
            type="button"
            onClick={(e) => handleAddModality(targetMod.id, e)}
            disabled={isActionDone || isProcessing || actionSuccess !== null}
            className={`w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] ${
              actionSuccess === 'added' || isActionDone
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : isDaylight
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/30'
                : 'bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white shadow-purple-900/40'
            }`}
          >
            {actionSuccess === 'added' || isActionDone ? (
              <Check size={15} strokeWidth={2.5} />
            ) : (
              <Plus size={15} strokeWidth={2.5} />
            )}
            <span className="break-words">
              {actionSuccess === 'added' || isActionDone
                ? 'Added to Today'
                : `Add ${targetMod.display_name || targetMod.name} to Today`}
            </span>
          </button>
        )}
      </div>

      {/* Schedule Modality Modal for Custom Days / Timings */}
      <ScheduleModalityModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        modality={targetMod}
        onSuccess={async (destination) => {
          setIsScheduleModalOpen(false)
          if (destination === 'bench') {
            await handleBenchModality(targetMod.id)
          } else if (onAddToToday) {
            await handleAddModality()
          }
        }}
      />
    </div>
  )
}
