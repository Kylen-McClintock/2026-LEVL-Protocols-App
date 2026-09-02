'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modality, UserProfile, UserBenchItem } from '@/lib/types'
import { BookmarkPlus, Plus, Check, Info, Sparkles, Search, CalendarPlus, CheckCircle2, Bookmark, Scale, ArrowRightLeft, AlertTriangle, History, Ban, Flame, ShieldCheck, Layers, ChevronDown, ChevronUp } from 'lucide-react'
import GeekMode from './GeekMode'
import ScheduleModalityModal from '../modals/ScheduleModalityModal'
import { DosageBadgeButton } from '../ui/DosageBadgeButton'
import { evaluateStackFit, StackFitResult } from '@/lib/synergy/stackFitEngine'
import { getEffortMetadata, getCostMetadata } from '@/lib/ranking/adaptiveRecommendationEngine'
import OutcomePill from '@/components/outcomes/OutcomePill'

type ExploreCardProps = {
  modality: Modality
  userProfile?: UserProfile | null
  searchScore?: number
  popularityScore?: number
  activeStatus?: 'today' | 'bench' | null
  benchHistoryItem?: UserBenchItem | null
  similarActiveModality?: { modality: Modality, source: 'today' | 'bench' } | null
  todayModalities?: Modality[]
  benchModalities?: Modality[]
  stackFitResult?: StackFitResult
  onAddToBench: (modalityId: string) => Promise<void>
  onAddToToday: (modalityId: string) => Promise<void>
  onCompare?: (exploring: Modality, active: Modality, source: 'today' | 'bench') => void
  onPinForCompare?: (modality: Modality) => void
  onInspectStackFit?: (modality: Modality, stackFit: StackFitResult) => void
  isPinnedForCompare?: boolean
}

export default function ExploreCard({ 
  modality, 
  userProfile, 
  searchScore, 
  popularityScore,
  activeStatus,
  benchHistoryItem,
  similarActiveModality,
  todayModalities = [],
  benchModalities = [],
  stackFitResult,
  onAddToBench, 
  onAddToToday,
  onCompare,
  onPinForCompare,
  onInspectStackFit,
  isPinnedForCompare
}: ExploreCardProps) {
  const router = useRouter()
  const [addedToBench, setAddedToBench] = useState(false)
  const [addedToToday, setAddedToToday] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showGeekMode, setShowGeekMode] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [showBenchConfirm, setShowBenchConfirm] = useState(false)

  const stackFit = stackFitResult || (
    (todayModalities.length > 0 || benchModalities.length > 0)
      ? evaluateStackFit(modality, todayModalities, benchModalities, userProfile)
      : null
  )

  const isCurrentlyActiveInToday = activeStatus === 'today' || addedToToday
  const isCurrentlyOnBench = activeStatus === 'bench' || addedToBench

  // Detect conflict warnings from NBA analysis
  const conflictWarnings = (modality.nba_result?.reasons || []).filter(r => 
    r.toLowerCase().includes('exceeds') ||
    r.toLowerCase().includes('discipline') ||
    r.toLowerCase().includes('lacks') ||
    r.toLowerCase().includes('conflict') ||
    r.toLowerCase().includes('not recommended') ||
    r.toLowerCase().includes('unnecessary') ||
    r.toLowerCase().includes('contraindicat')
  )
  const hasConflict = conflictWarnings.length > 0

  const handleScheduleSuccess = (destination: 'today' | 'tomorrow' | 'bench') => {
    if (destination === 'bench') {
      setAddedToBench(true)
      onAddToBench(modality.id).catch(console.error)
    } else {
      setAddedToToday(true)
      onAddToToday(modality.id).catch(console.error)
    }
  }

  // Border and glow styling depending on active status or conflict
  const cardContainerStyle = isCurrentlyActiveInToday
    ? 'border-emerald-500/40 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
    : isCurrentlyOnBench
    ? 'border-cyan-500/40 bg-cyan-950/10 shadow-[0_0_15px_rgba(6,182,212,0.12)]'
    : hasConflict
    ? 'border-red-500/30 bg-red-950/10'
    : 'glass-card'

  return (
    <div className={`rounded-xl overflow-hidden transition-all duration-300 w-full min-w-0 ${cardContainerStyle}`}>
      <div 
        className="p-4 cursor-pointer flex flex-col gap-3 w-full min-w-0"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-full min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-lg text-white break-words">{modality.display_name || modality.name}</h3>
            
            {/* Active Today / Bench / Conflict / Eliminated History Status Badges */}
            {isCurrentlyActiveInToday && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/today?modality=${encodeURIComponent(modality.id)}`)
                }}
                className="flex items-center gap-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-colors cursor-pointer shrink-0"
              >
                <CheckCircle2 size={11} className="text-emerald-400" /> In Today&apos;s Plan
              </button>
            )}
            {isCurrentlyOnBench && !isCurrentlyActiveInToday && (
              <span className="flex items-center gap-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)] shrink-0">
                <Bookmark size={11} className="text-cyan-400" /> Saved on Bench
              </span>
            )}
            {benchHistoryItem?.status === 'eliminated' && !isCurrentlyActiveInToday && (
              <span className="flex items-center gap-1 bg-red-950/90 text-red-300 border border-red-500/60 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-[0_0_8px_rgba(239,68,68,0.3)] shrink-0">
                <Ban size={11} className="text-red-400" /> Previously Eliminated
              </span>
            )}
            {benchHistoryItem?.status === 'benched' && !isCurrentlyOnBench && !isCurrentlyActiveInToday && (
              <span className="flex items-center gap-1 bg-purple-950/90 text-purple-300 border border-purple-500/60 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">
                <History size={11} className="text-purple-400" /> Previously Benched
              </span>
            )}
            {hasConflict && !isCurrentlyActiveInToday && !isCurrentlyOnBench && !benchHistoryItem && (
              <span className="flex items-center gap-1 bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-[0_0_8px_rgba(239,68,68,0.3)] shrink-0">
                <AlertTriangle size={11} className="text-red-400" /> Profile Conflict
              </span>
            )}

            {modality.modality_type === 'prescription_supported' && (
              <span className="text-[9px] uppercase bg-red-900/40 text-red-300 px-2 py-0.5 rounded border border-red-900/50 whitespace-nowrap shrink-0">Prescription Rx</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <p className="text-[10px] font-bold text-levl-text-secondary uppercase tracking-wider shrink-0">{modality.category}</p>
            
            {modality.cadence_layer && (
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 text-gray-300 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0">
                {modality.cadence_layer.replace('_', ' ')}
              </div>
            )}
            
            {modality.minimum_cooldown_hours ? (
              <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0">
                {Math.round(modality.minimum_cooldown_hours / 24)}d Cooldown
              </div>
            ) : null}
            {searchScore ? (
              <div className="flex items-center gap-1 bg-levl-accent/20 border border-levl-accent/40 text-levl-accent px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0">
                <Search size={10} />
                {searchScore}% Search Match
              </div>
            ) : popularityScore !== undefined ? (
              <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[0_0_8px_rgba(245,158,11,0.15)] shrink-0">
                <Flame size={10} className="text-amber-400" />
                {popularityScore >= 95 ? 'Top 1% Proven' : popularityScore >= 90 ? 'Bio-Optimizer Staple' : `${popularityScore} Popularity`}
              </div>
            ) : modality.nba_result && (
              <div className="flex items-center gap-1 bg-levl-accent/10 border border-levl-accent/30 text-levl-accent px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0">
                <Sparkles size={10} />
                {modality.nba_result.matchPercentage}% Match
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DosageBadgeButton modality={modality} userProfile={userProfile} />
          </div>

          {/* Interactive Stack Synergy & Conflict Fit Badge */}
          {stackFit && !isCurrentlyActiveInToday && (
            <div 
              onClick={(e) => {
                e.stopPropagation()
                if (onInspectStackFit) onInspectStackFit(modality, stackFit)
              }}
              className={`mt-2 p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2.5 transition-all cursor-pointer hover:brightness-110 shadow-sm w-full min-w-0 ${
                stackFit.badge.type === 'synergy'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                  : stackFit.badge.type === 'conflict' || stackFit.badge.type === 'caution'
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                  : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-300'
              }`}
            >
              <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
                <div className="shrink-0 mt-0.5 sm:mt-0">
                  {stackFit.badge.type === 'synergy' ? (
                    <Sparkles size={14} className="text-emerald-400" />
                  ) : stackFit.badge.type === 'conflict' || stackFit.badge.type === 'caution' ? (
                    <AlertTriangle size={14} className="text-amber-400" />
                  ) : (
                    <ShieldCheck size={14} className="text-cyan-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap sm:flex-nowrap items-baseline sm:items-center gap-x-1.5 gap-y-0.5 leading-snug">
                    <span className="text-[11px] font-black uppercase tracking-wider shrink-0">{stackFit.badge.title}</span>
                    <span className="text-[10px] opacity-60 hidden sm:inline">•</span>
                    <span className="text-xs font-medium text-slate-200 break-words line-clamp-2 sm:line-clamp-1">{stackFit.badge.subtitle}</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] font-mono font-extrabold uppercase shrink-0 px-2 py-1 rounded-md bg-black/50 border border-white/10 flex items-center gap-1 text-slate-300 hover:text-white self-center">
                <span>Inspect</span>
                <span>→</span>
              </div>
            </div>
          )}
        </div>

        {/* Similar Active Modality Banner & Compare Trigger */}
        {similarActiveModality && !isCurrentlyActiveInToday && !isCurrentlyOnBench && (
          <div 
            onClick={(e) => {
              e.stopPropagation()
              if (onCompare) onCompare(modality, similarActiveModality.modality, similarActiveModality.source)
            }}
            className="flex items-center justify-between p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs hover:bg-amber-500/20 transition-colors cursor-pointer my-0.5"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Scale size={14} className="text-amber-400 shrink-0" />
              <span className="truncate">
                Similar to <strong className="text-white">{similarActiveModality.modality.display_name || similarActiveModality.modality.name}</strong> ({similarActiveModality.source === 'today' ? "in Today's plan" : "on Bench"})
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-200 border border-amber-500/40 px-2 py-1 rounded-lg shrink-0 flex items-center gap-1 ml-2">
              Compare <ArrowRightLeft size={10} />
            </span>
          </div>
        )}
        {/* Profile Conflict Warning Banner */}
        {hasConflict && (
          <div className="p-2.5 rounded-xl border border-red-500/30 bg-red-950/20 text-red-300 text-xs flex items-start gap-2 my-0.5">
            <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase text-[10px] tracking-wider block text-red-400">Health & Profile Conflict</span>
              <ul className="list-disc pl-3.5 mt-0.5 space-y-0.5 text-[11px] opacity-90">
                {conflictWarnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          </div>
        )}

        {/* Previously Tried & Elimination History Banner */}
        {benchHistoryItem && (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-950/20 text-slate-200 text-xs space-y-1.5 my-0.5">
            <div className="flex items-center justify-between">
              <span className="font-extrabold uppercase text-[10px] tracking-wider text-red-400 flex items-center gap-1.5">
                <History size={13} className="text-red-400" /> Previously Tried & Eliminated History
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {benchHistoryItem.status === 'eliminated' ? 'Eliminated' : 'Benched'}
              </span>
            </div>

            {benchHistoryItem.elimination_reasons && benchHistoryItem.elimination_reasons.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {benchHistoryItem.elimination_reasons.map((r, idx) => (
                  <span key={idx} className="bg-red-950/80 border border-red-800/80 text-red-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {r}
                  </span>
                ))}
              </div>
            )}

            {benchHistoryItem.personal_notes && (
              <p className="text-[11px] text-slate-300 font-sans italic bg-black/40 p-2 rounded-lg border border-slate-800/80 mt-1">
                "{benchHistoryItem.personal_notes}"
              </p>
            )}
          </div>
        )}
        
        <p className="text-sm text-gray-300">{modality.brief_description}</p>
        
        {modality.functional_impacts && Object.keys(modality.functional_impacts).some(k => modality.functional_impacts![k].score > 5) && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {Object.entries(modality.functional_impacts)
              .filter(([_, impact]) => impact.score > 5)
              .sort((a, b) => b[1].score - a[1].score)
              .map(([outcome, impact]) => (
                <OutcomePill
                  key={outcome}
                  outcome={outcome}
                  score={impact.score}
                  size="sm"
                />
              ))
            }
          </div>
        )}
        
        <div className="flex justify-between items-center mt-3 border-t border-white/5 pt-3">
          <span className="text-xs text-levl-text-secondary">
            Longevity Impact: <strong className="text-emerald-400 font-mono font-bold text-sm">{modality.overall_longevity_benefit || 8}/10</strong>
          </span>
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            {expanded ? 'Collapse' : 'Inspect details'} {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4 animate-in fade-in slide-in-from-top-2">
          {/* Core Scientific Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Evidence Quality</span>
              <span className="text-xs font-bold text-white font-mono">
                {modality.evidence_quality ? `${modality.evidence_quality}/5 (Clinical RCTs)` : 'Grade A (5/5)'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Effect Size</span>
              <span className="text-xs font-bold text-cyan-300 capitalize">
                {modality.effect_size_estimate || 'Medium'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Daily Cost</span>
              <span className="text-xs font-bold text-amber-300">
                {getCostMetadata(modality.cost_tier).label}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Effort &amp; Time</span>
              <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border ${getEffortMetadata(modality).badgeColor}`}>
                {getEffortMetadata(modality).shortLabel}
              </span>
            </div>
          </div>

          {/* Impacted Hallmarks of Aging */}
          {modality.hallmarks_of_aging_impact && modality.hallmarks_of_aging_impact.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-500/20 space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <Layers size={12} className="text-purple-400" /> Targeted Hallmarks of Aging:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(Array.isArray(modality.hallmarks_of_aging_impact) ? modality.hallmarks_of_aging_impact : [modality.hallmarks_of_aging_impact]).map((h: string, idx: number) => (
                  <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-800 text-purple-200">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}
          {modality.nba_result && modality.nba_result.reasons.length > 0 && (
            <div className="bg-levl-accent/5 rounded-lg p-3 border border-levl-accent/20 space-y-2">
              <h4 className="text-xs font-semibold text-levl-accent uppercase flex items-center gap-1">
                <Sparkles size={12} /> Why this is recommended for you
              </h4>
              <ul className="text-xs text-gray-300 space-y-1 pl-4 list-disc">
                {modality.nba_result.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {similarActiveModality && onCompare && (
            <button 
              onClick={(e) => {
                e.stopPropagation()
                onCompare(modality, similarActiveModality.modality, similarActiveModality.source)
              }}
              className="w-full border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500 hover:text-black text-sm font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors mb-2"
            >
              <Scale size={16} /> Compare Modalities
            </button>
          )}

          {/* Move Modality to Bench Button with Built-in Confirmation Box */}
          <div className="pt-2">
            {!showBenchConfirm ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowBenchConfirm(true)
                }}
                className="w-full py-2.5 px-4 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <BookmarkPlus size={15} />
                <span>Move Modality to Bench</span>
              </button>
            ) : (
              <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 shadow-lg">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                  <BookmarkPlus size={16} className="text-cyan-400" />
                  <span>Confirm: Move Modality to Bench?</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Moving this modality to your Bench saves it to your personal longevity workbench. It allows you to monitor N-of-1 outcome correlations and pull it into your Today schedule whenever ready, without cluttering your daily habits.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation()
                      setAddedToBench(true)
                      await onAddToBench(modality.id)
                      setShowBenchConfirm(false)
                    }}
                    disabled={isCurrentlyOnBench}
                    className="flex-1 py-2 px-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {addedToBench || isCurrentlyOnBench ? <Check size={14} /> : <BookmarkPlus size={14} />}
                    {addedToBench || isCurrentlyOnBench ? 'Saved on Bench!' : 'Confirm Move to Bench'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowBenchConfirm(false)
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-xs rounded-lg transition-all font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-4 pt-0 space-y-3">
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation()
              if (isCurrentlyActiveInToday) {
                router.push(`/today?modality=${encodeURIComponent(modality.id)}`)
              } else if (!isCurrentlyOnBench) {
                setIsScheduling(true)
              }
            }}
            disabled={isCurrentlyOnBench && !isCurrentlyActiveInToday}
            className={`flex-1 flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-sm ${
              isCurrentlyActiveInToday
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                : isCurrentlyOnBench 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cursor-default'
                : 'bg-levl-accent hover:bg-levl-accent/90 text-white shadow-levl-accent/20 cursor-pointer'
            }`}
          >
            {isCurrentlyActiveInToday ? (
              <span className="flex items-center justify-center gap-1.5 truncate">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                <span className="truncate">In Today&apos;s Plan</span>
              </span>
            ) : isCurrentlyOnBench ? (
              <span className="flex items-center justify-center gap-1.5 truncate">
                <Bookmark size={15} className="text-cyan-400 shrink-0" />
                <span className="truncate">Saved on Bench</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5 truncate">
                <CalendarPlus size={15} className="shrink-0" />
                <span className="truncate">Add to Today</span>
              </span>
            )}
          </button>

          {onPinForCompare && (
            <button 
              onClick={(e) => { e.stopPropagation(); onPinForCompare(modality); }}
              className={`h-9 px-3 rounded-xl text-xs sm:text-sm font-bold border flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                isPinnedForCompare 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
              }`}
              title="Pin modality to compare side-by-side"
            >
              <Scale size={14} />
              <span className="hidden sm:inline">{isPinnedForCompare ? 'Selected' : 'Compare'}</span>
            </button>
          )}

          <button 
            onClick={(e) => { e.stopPropagation(); setShowGeekMode(!showGeekMode); }}
            className={`h-9 px-3.5 rounded-xl text-xs sm:text-sm font-bold border flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              showGeekMode 
                ? 'bg-levl-purple text-white border-levl-purple shadow-md' 
                : 'bg-levl-purple/10 border-levl-purple/30 text-purple-300 hover:bg-levl-purple hover:text-white'
            }`}
          >
            <Info size={14} />
            <span>Geek Mode</span>
          </button>
        </div>

        {showGeekMode && <GeekMode modality={modality} />}
      </div>

      <ScheduleModalityModal 
        isOpen={isScheduling}
        onClose={() => setIsScheduling(false)}
        modality={modality}
        onSuccess={handleScheduleSuccess}
      />
    </div>
  )
}
