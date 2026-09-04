'use client'

import React, { useState, useMemo } from 'react'
import { 
  Sparkles, 
  Sliders, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Target, 
  Layers,
  Clock,
  Filter,
  Info
} from 'lucide-react'
import { 
  DailyProtocolTask, 
  Modality, 
  OutcomeDimension, 
  UserProfile, 
  UserBenchItem, 
  DailyWellbeingCheckin 
} from '@/lib/types'
import { 
  getOutcomeOptimizationSummary, 
  OutcomeOptimizationState,
  AntagonisticClash 
} from '@/lib/outcomes/outcomeOptimizationEngine'
import ProtocolTaskCard, { DedupedTask } from '@/components/cards/ProtocolTaskCard'

interface OutcomeLensViewProps {
  tasks: DailyProtocolTask[]
  activeModalities: Modality[]
  outcomeDimensions: OutcomeDimension[]
  userProfile: UserProfile | null
  benchItems: UserBenchItem[]
  allOutcomes: OutcomeDimension[]
  wellbeingCheckin?: DailyWellbeingCheckin | null
  completionMode: 'outcome' | 'fast'
  onStatusChange: (id: string, status: string, reason?: string, completedAt?: string, executionMetrics?: any, executionDetails?: any) => void
  onTrackOutcomes?: (modality: Modality, sessionId: string, phase?: string) => void
  onSaveCustomOutcomes?: (modalityId: string, outcomeIds: string[]) => void
  onOutcomesSaved?: (taskId: string) => void
  onOpenRescheduleModal?: (task: DailyProtocolTask) => void
  outcomesRefreshKey?: number
  onInspectOutcome: (outcomeState: OutcomeOptimizationState) => void
  onAutoFixClash?: (clash: AntagonisticClash) => void
}

export const OutcomeLensView: React.FC<OutcomeLensViewProps> = ({
  tasks,
  activeModalities,
  outcomeDimensions,
  userProfile,
  benchItems,
  allOutcomes,
  wellbeingCheckin,
  completionMode,
  onStatusChange,
  onTrackOutcomes,
  onSaveCustomOutcomes,
  onOutcomesSaved,
  onOpenRescheduleModal,
  outcomesRefreshKey,
  onInspectOutcome,
  onAutoFixClash
}) => {
  const [selectedOutcomeFilter, setSelectedOutcomeFilter] = useState<string>('all')
  const [expandedOutcomes, setExpandedOutcomes] = useState<Record<string, boolean>>({})
  const [showEmptyDimensions, setShowEmptyDimensions] = useState(false)

  // Calculate optimization summaries for all official outcome dimensions
  const outcomeSummaries: OutcomeOptimizationState[] = useMemo(() => {
    if (!outcomeDimensions || outcomeDimensions.length === 0) return []
    return getOutcomeOptimizationSummary(activeModalities, tasks, outcomeDimensions, userProfile)
  }, [activeModalities, tasks, outcomeDimensions, userProfile])

  // Map tasks to their relevant outcome dimensions
  const tasksByOutcome = useMemo(() => {
    const map = new Map<string, DailyProtocolTask[]>()

    // Initialize map
    outcomeDimensions.forEach(dim => {
      map.set(dim.id.toLowerCase().trim(), [])
    })

    tasks.forEach(task => {
      const mId = task.modality_id || task.protocol_step?.modality_id || (task as any).loose_modality?.id || ''
      const mod = activeModalities.find(m => m.id === mId) || (task as any).loose_modality || task.protocol_step?.modality
      const benchItem = benchItems.find(b => b.modality_id === mId)

      const matchedOutcomes = new Set<string>()

      if (mod) {
        if (mod.primary_outcome) matchedOutcomes.add(mod.primary_outcome.toLowerCase().replace(/\s+/g, '_').trim())
        if (Array.isArray(mod.secondary_outcomes)) {
          (mod.secondary_outcomes as string[]).forEach((s: string) => matchedOutcomes.add(String(s).toLowerCase().replace(/\s+/g, '_').trim()))
        }
        if (Array.isArray(mod.functional_outcomes_to_track)) {
          (mod.functional_outcomes_to_track as string[]).forEach((f: string) => matchedOutcomes.add(String(f).toLowerCase().replace(/\s+/g, '_').trim()))
        }
      }

      if (benchItem && Array.isArray((benchItem as any).custom_outcomes)) {
        ((benchItem as any).custom_outcomes as string[]).forEach((co: string) => matchedOutcomes.add(String(co).toLowerCase().replace(/\s+/g, '_').trim()))
      }

      matchedOutcomes.forEach(outKey => {
        // Direct match or partial match
        for (const dim of outcomeDimensions) {
          const dimNorm = dim.id.toLowerCase().trim()
          if (outKey === dimNorm || outKey.includes(dimNorm) || dimNorm.includes(outKey)) {
            const list = map.get(dimNorm) || []
            if (!list.some(t => t.id === task.id)) {
              list.push(task)
            }
            map.set(dimNorm, list)
          }
        }
      })
    })

    return map
  }, [tasks, activeModalities, benchItems, outcomeDimensions])

  // Filtered summaries to display
  const displayedSummaries = useMemo(() => {
    return outcomeSummaries.filter(summary => {
      const normId = summary.outcomeId.toLowerCase().trim()
      const associatedTasks = tasksByOutcome.get(normId) || []
      const hasContent = associatedTasks.length > 0 || summary.activeModalities.length > 0

      if (selectedOutcomeFilter !== 'all' && normId !== selectedOutcomeFilter.toLowerCase().trim()) {
        return false
      }

      if (!showEmptyDimensions && !hasContent) {
        return false
      }

      return true
    })
  }, [outcomeSummaries, tasksByOutcome, selectedOutcomeFilter, showEmptyDimensions])

  // Stats
  const targetGreenCount = outcomeSummaries.filter(s => s.status === 'green').length
  const targetYellowCount = outcomeSummaries.filter(s => s.status === 'yellow').length
  const targetRedCount = outcomeSummaries.filter(s => s.status === 'red').length
  const totalClashes = outcomeSummaries.reduce((sum, s) => sum + s.clashes.length, 0)

  const toggleOutcomeExpansion = (outcomeId: string) => {
    setExpandedOutcomes(prev => ({
      ...prev,
      [outcomeId]: prev[outcomeId] !== undefined ? !prev[outcomeId] : false // default is expanded
    }))
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Overview & Stats Card */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-indigo-950/40 border border-purple-500/20 rounded-3xl p-4 sm:p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300">
                <Target size={16} />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Outcome Vectors Lens
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold">
                80/20 Optimization
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Evaluating your active daily protocols against targeted biological outcomes. Green indicates you are in your custom target zone (80/20 or power stack) with zero biological clashes.
            </p>
          </div>

          {/* Quick Target Distribution Badges */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{targetGreenCount} Target Met</span>
            </div>
            {targetYellowCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>{targetYellowCount} Calibrate</span>
              </div>
            )}
            {targetRedCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>{targetRedCount} Gaps</span>
              </div>
            )}
          </div>
        </div>

        {/* Global Clash Warning if any */}
        {totalClashes > 0 && (
          <div className="mt-4 p-3 bg-rose-950/70 border border-rose-500/40 rounded-2xl flex items-start gap-3 text-rose-200 text-xs">
            <ShieldAlert size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-rose-300 block">
                {totalClashes} Antagonistic Biological {totalClashes === 1 ? 'Clash' : 'Clashes'} Detected
              </span>
              <span>
                Certain active modalities in your schedule counteract each other’s pathways. Check the red warning banners below for optimal timing separation.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Outcome Dimension Filter Chips */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <div className="flex items-center gap-1.5 flex-nowrap">
          <button
            type="button"
            onClick={() => setSelectedOutcomeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedOutcomeFilter === 'all'
                ? 'bg-purple-600 text-white shadow-md border border-purple-400/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Outcomes ({displayedSummaries.length})
          </button>

          {outcomeSummaries
            .filter(s => (tasksByOutcome.get(s.outcomeId.toLowerCase().trim()) || []).length > 0)
            .map(summary => {
              const isSelected = selectedOutcomeFilter.toLowerCase() === summary.outcomeId.toLowerCase()
              const taskCount = (tasksByOutcome.get(summary.outcomeId.toLowerCase().trim()) || []).length

              return (
                <button
                  key={summary.outcomeId}
                  type="button"
                  onClick={() => setSelectedOutcomeFilter(isSelected ? 'all' : summary.outcomeId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-md border border-purple-400/40'
                      : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    summary.status === 'green' ? 'bg-emerald-400' : summary.status === 'yellow' ? 'bg-amber-400' : 'bg-rose-400'
                  }`} />
                  <span>{summary.outcomeName}</span>
                  <span className="text-[10px] opacity-70 font-mono">({taskCount})</span>
                </button>
              )
            })}
        </div>

        <button
          type="button"
          onClick={() => setShowEmptyDimensions(!showEmptyDimensions)}
          className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors shrink-0 px-2 py-1 font-medium cursor-pointer"
        >
          {showEmptyDimensions ? 'Hide Inactive' : 'Show All Dimensions'}
        </button>
      </div>

      {/* 3. Outcome Vectors List */}
      <div className="space-y-6">
        {displayedSummaries.length === 0 ? (
          <div className="text-center p-8 bg-slate-950/60 border border-white/10 rounded-2xl text-gray-400 text-sm space-y-2">
            <p className="font-bold text-white">No active modalities for this outcome.</p>
            <p className="text-xs text-slate-400">Add modalities targeting this dimension from the Explore page or tap another filter.</p>
          </div>
        ) : (
          displayedSummaries.map(summary => {
            const normId = summary.outcomeId.toLowerCase().trim()
            const tasksInOutcome = tasksByOutcome.get(normId) || []
            const isExpanded = expandedOutcomes[summary.outcomeId] !== false // default true

            return (
              <div 
                key={summary.outcomeId}
                className="rounded-3xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-xl transition-all duration-300 hover:border-slate-700/80"
              >
                {/* Outcome Dimension Header Bar */}
                <div className="p-4 sm:p-5 bg-slate-900/60 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Outcome Identity */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 shrink-0 mt-0.5">
                      <Sparkles size={18} className="text-purple-400" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                          {summary.outcomeName}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold font-mono ${summary.badgeBg} ${summary.badgeBorder} ${summary.badgeText}`}>
                          {summary.statusLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate max-w-md">
                        {summary.statusDescription}
                      </p>
                    </div>
                  </div>

                  {/* Right: Scores & Tuning CTA */}
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0 flex-wrap justify-between md:justify-end">
                    {/* Dialed-In Score */}
                    <div className="text-right">
                      <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                        Dialed-In Score
                      </div>
                      <div className="flex items-baseline gap-1 justify-end">
                        <span className={`text-xl font-black font-mono ${
                          summary.dialedInScore >= summary.targetConfig.targetDialedIn 
                            ? 'text-emerald-400' 
                            : summary.dialedInScore >= summary.targetConfig.targetDialedIn - 15 
                            ? 'text-amber-400' 
                            : 'text-rose-400'
                        }`}>
                          {summary.dialedInScore}
                        </span>
                        <span className="text-xs font-mono text-slate-500">/ 100</span>
                        <span className="text-[10px] text-slate-400 font-medium ml-1">
                          ({summary.percentileRank}th %ile)
                        </span>
                      </div>
                    </div>

                    {/* Effort Score */}
                    <div className="text-right border-l border-white/10 pl-3 sm:pl-4">
                      <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1 justify-end">
                        <Zap size={10} className="text-amber-400" />
                        <span>Effort & Cost</span>
                      </div>
                      <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-xl font-black font-mono text-amber-300">
                          {summary.effortScore}
                        </span>
                        <span className="text-xs font-mono text-slate-500">/ 100</span>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 border-l border-white/10 pl-3 sm:pl-4">
                      <button
                        type="button"
                        onClick={() => onInspectOutcome(summary)}
                        className="px-3 py-1.5 bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title="Tune Target Ambition & Effort Allowance"
                      >
                        <Sliders size={13} className="text-purple-300" />
                        <span>Tune</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleOutcomeExpansion(summary.outcomeId)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all cursor-pointer"
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Clashes Alert Banner for this Outcome */}
                {summary.clashes.length > 0 && (
                  <div className="p-4 bg-rose-950/30 border-b border-rose-500/20 space-y-3">
                    {summary.clashes.map(clash => (
                      <div 
                        key={clash.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-rose-950/60 border border-rose-500/40 rounded-2xl text-xs text-rose-200"
                      >
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-rose-300 block">{clash.title}</span>
                            <p className="text-rose-200/90 leading-relaxed">{clash.biologicalMechanism}</p>
                            <span className="text-rose-300/80 text-[11px] block mt-1">
                              <strong>Recommended Fix:</strong> {clash.recommendedFix}
                            </span>
                          </div>
                        </div>

                        {clash.canAutoFixSchedule && onAutoFixClash && (
                          <button
                            type="button"
                            onClick={() => onAutoFixClash(clash)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shrink-0 self-start sm:self-center transition-all cursor-pointer shadow-sm active:scale-95"
                          >
                            Auto-Fix Schedule
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Expanded Tasks & Modality Coverage Body */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Active Today Tasks */}
                    {tasksInOutcome.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-white/10 pb-2">
                          <span className="flex items-center gap-1.5">
                            <Clock size={13} className="text-purple-400" />
                            <span>Today&apos;s Modalities Contributing to {summary.outcomeName} ({tasksInOutcome.length})</span>
                          </span>
                        </div>

                        <div className={completionMode === 'fast' ? "space-y-1.5" : "space-y-3"}>
                          {tasksInOutcome.map(task => {
                            const mId = task.modality_id || task.protocol_step?.modality_id || ''
                            const benchItem = benchItems.find(b => b.modality_id === mId)
                            return (
                              <ProtocolTaskCard 
                                key={task.id} 
                                task={task} 
                                onStatusChange={onStatusChange} 
                                onTrackOutcomes={onTrackOutcomes}
                                initialBenchItem={benchItem}
                                recentTasks={tasks}
                                allOutcomes={allOutcomes}
                                userProfile={userProfile}
                                wellbeingCheckin={wellbeingCheckin}
                                onSaveCustomOutcomes={onSaveCustomOutcomes}
                                onOutcomesSaved={onOutcomesSaved}
                                onOpenRescheduleModal={onOpenRescheduleModal}
                                outcomesRefreshKey={outcomesRefreshKey}
                                completionMode={completionMode}
                                isIgnited={true}
                              />
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-black/40 border border-dashed border-white/10 rounded-2xl text-center text-xs text-slate-400">
                        <span>No specific modality for this outcome is scheduled for today.</span>
                      </div>
                    )}

                    {/* Tier Breakdown Badges */}
                    <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Layers size={12} /> Modality Hierarchy:
                      </span>
                      {summary.tierBreakdown.foundational.map(item => (
                        <span key={item.modality.id} className="px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium">
                          ★ {item.modality.name} (Pillar)
                        </span>
                      ))}
                      {summary.tierBreakdown.synergistic.map(item => (
                        <span key={item.modality.id} className="px-2 py-0.5 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-300 text-[11px] font-medium">
                          ✦ {item.modality.name} (Synergy)
                        </span>
                      ))}
                      {summary.tierBreakdown.marginal.map(item => (
                        <span key={item.modality.id} className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-[11px] font-medium">
                          + {item.modality.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
