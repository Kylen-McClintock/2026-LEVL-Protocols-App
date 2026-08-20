'use client'

import React, { useState } from 'react'
import {
  BioGapRecommendation,
  HallmarkCoverageReport
} from '@/lib/tracking/hallmarkCoverageEngine'
import {
  Sparkles,
  Zap,
  Plus,
  Bookmark,
  Check,
  ShieldCheck,
  AlertTriangle,
  Flame,
  ArrowRight,
  Dna,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
  Sliders,
  FlaskConical
} from 'lucide-react'

interface BioGapSolverSectionProps {
  gaps: BioGapRecommendation[]
  coverageReport: HallmarkCoverageReport
  onAddToToday: (modalityId: string) => Promise<void>
  onAddToBench?: (modalityId: string) => Promise<void>
  simulatedModalityIds?: Set<string>
  onToggleSimulate?: (modalityId: string) => void
  selectedEffortFilter?: 'all' | 'level_1' | 'level_2' | 'level_3'
  onEffortFilterChange?: (filter: 'all' | 'level_1' | 'level_2' | 'level_3') => void
}

export const BioGapSolverSection: React.FC<BioGapSolverSectionProps> = ({
  gaps,
  coverageReport,
  onAddToToday,
  onAddToBench,
  simulatedModalityIds = new Set(),
  onToggleSimulate,
  selectedEffortFilter = 'all',
  onEffortFilterChange
}) => {
  const [addedModalityIds, setAddedModalityIds] = useState<Set<string>>(new Set())
  const [benchedModalityIds, setBenchedModalityIds] = useState<Set<string>>(new Set())
  const [loadingModalityId, setLoadingModalityId] = useState<string | null>(null)
  const [expandedMechanisms, setExpandedMechanisms] = useState<Set<string>>(new Set())

  const toggleMechanismExpand = (modId: string) => {
    setExpandedMechanisms(prev => {
      const next = new Set(prev)
      if (next.has(modId)) next.delete(modId)
      else next.add(modId)
      return next
    })
  }

  const handleAddToday = async (modalityId: string) => {
    setAddedModalityIds(prev => new Set(prev).add(modalityId))
    setLoadingModalityId(modalityId)
    try {
      await onAddToToday(modalityId)
    } catch (err) {
      console.error('Error adding modality to today:', err)
    } finally {
      setLoadingModalityId(null)
    }
  }

  const handleAddBench = async (modalityId: string) => {
    setBenchedModalityIds(prev => new Set(prev).add(modalityId))
    setLoadingModalityId(modalityId)
    try {
      if (onAddToBench) {
        await onAddToBench(modalityId)
      }
    } catch (err) {
      console.error('Error benching modality:', err)
    } finally {
      setLoadingModalityId(null)
    }
  }

  // If user has 0 gaps (all >= 50%)
  if (gaps.length === 0) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0">
            <ShieldCheck size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                Optimal Multi-System Longevity Shield
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                100% Defense
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
              All 12 Hallmarks of Aging Are Protected
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Your active routine provides comprehensive coverage across primary causes of damage, metabolic defenses, and tissue decline.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header & Effort Multi-Tier Filter Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <AlertTriangle size={13} className="text-amber-400" />
              Cellular Gap Analysis ({gaps.length} Gaps Detected)
            </span>
          </div>
          <h3 className="text-xl font-black text-white mt-0.5">
            Bridge Unprotected Biological Pathways
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Top evidence-graded interventions to close biological blind spots across Level 1, 2, and 3 effort tiers.
          </p>
        </div>

        {/* Effort Tier Filter Pills */}
        {onEffortFilterChange && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-white/10 rounded-xl flex-wrap">
            <span className="text-[10px] font-mono text-slate-400 px-2 uppercase font-bold flex items-center gap-1">
              <Sliders size={11} /> Effort Tier:
            </span>
            {[
              { id: 'all', label: 'All Tiers' },
              { id: 'level_1', label: 'Lvl 1 (Frictionless / $0)' },
              { id: 'level_2', label: 'Lvl 2 (Moderate / Habit)' },
              { id: 'level_3', label: 'Lvl 3 (Clinical & Equipment)' }
            ].map(tier => (
              <button
                key={tier.id}
                type="button"
                onClick={() => onEffortFilterChange(tier.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedEffortFilter === tier.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gaps.map(gap => {
          const isCritical = gap.severity === 'critical'

          return (
            <div
              key={gap.hallmark.id}
              className={`rounded-2xl border p-5 shadow-xl transition-all relative overflow-hidden backdrop-blur-md flex flex-col justify-between ${
                isCritical
                  ? 'border-rose-500/30 bg-gradient-to-b from-rose-950/30 via-slate-900/90 to-slate-950 hover:border-rose-500/50'
                  : 'border-amber-500/30 bg-gradient-to-b from-amber-950/20 via-slate-900/90 to-slate-950 hover:border-amber-500/50'
              }`}
            >
              {/* Top Details */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      {gap.hallmark.tierLabel}
                    </span>
                    <h4 className="text-base font-black text-white flex items-center gap-1.5 mt-0.5">
                      {gap.hallmark.name}
                    </h4>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isCritical
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}>
                    {gap.currentScore}% Covered
                  </span>
                </div>

                {/* Mini Coverage Bar */}
                <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isCritical ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.max(5, gap.currentScore)}%` }}
                  />
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {gap.hallmark.biologicalConsequence}
                </p>

                {/* Candidate Modalities to Fill Gap */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Recommended Additions:
                  </span>

                  <div className="space-y-2.5">
                    {gap.recommendedModalities.map(rec => {
                      const mod = rec.modality
                      const isAddedToday = addedModalityIds.has(mod.id)
                      const isBenched = benchedModalityIds.has(mod.id)
                      const isSimulated = simulatedModalityIds.has(mod.id)
                      const isLoading = loadingModalityId === mod.id
                      const isMechanismExpanded = expandedMechanisms.has(mod.id)
                      const isLongMechanism = (rec.exactMechanism || '').length > 220

                      return (
                        <div
                          key={mod.id}
                          className={`p-3.5 rounded-xl bg-slate-950/90 border transition-all space-y-2.5 shadow-md ${
                            isSimulated
                              ? 'border-cyan-500/60 bg-gradient-to-b from-cyan-950/30 to-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                              : 'border-white/10 hover:border-purple-500/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="space-y-1">
                              <span className="text-xs font-black text-white block">
                                {mod.display_name || mod.name}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  {rec.clinicalEvidenceGrade}
                                </span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300">
                                  {rec.effortLabel}
                                </span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                  {rec.costLabel}
                                </span>
                              </div>
                            </div>

                            <span className="text-[11px] font-mono font-black text-emerald-400">
                              Impact: {rec.longevityImpactScore.toFixed(1)}/10
                            </span>
                          </div>

                          {/* Modality-Specific Exact Biological Mechanism with click-to-expand */}
                          <div
                            onClick={() => {
                              if (isLongMechanism) {
                                toggleMechanismExpand(mod.id)
                              }
                            }}
                            className={`p-2.5 rounded-lg bg-slate-900/90 border border-white/5 space-y-1 transition-all ${
                              isLongMechanism
                                ? 'cursor-pointer hover:border-purple-500/40 hover:bg-slate-900'
                                : ''
                            }`}
                            title={
                              isLongMechanism
                                ? isMechanismExpanded
                                  ? 'Click anywhere to collapse'
                                  : 'Click anywhere to expand full text'
                                : undefined
                            }
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300">
                              <span className="flex items-center gap-1">
                                <Dna size={11} /> Cellular Mechanism:
                              </span>
                              {isLongMechanism && (
                                <span className="text-[10px] text-purple-400 hover:text-purple-200 underline cursor-pointer normal-case font-sans">
                                  {isMechanismExpanded ? 'Show less ▴' : 'Expand ▾'}
                                </span>
                              )}
                            </div>
                            <p className={`text-[11px] text-slate-300 leading-relaxed ${isMechanismExpanded ? '' : 'line-clamp-6'}`}>
                              {rec.exactMechanism}
                            </p>
                          </div>

                          {/* Direct PubMed / Clinical Citation Link */}
                          {rec.pubMedUrl && (
                            <div className="pt-0.5 w-full overflow-hidden">
                              <a
                                href={rec.pubMedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[10px] text-purple-400 hover:text-purple-300 hover:underline font-semibold max-w-full"
                              >
                                <ExternalLink size={10} className="shrink-0 text-purple-400" />
                                <span className="truncate flex-1 min-w-0">
                                  {rec.pubMedTitle || 'Verified PubMed Paper'}
                                </span>
                                {rec.pmid && (
                                  <span className="text-slate-400 font-mono text-[9px] shrink-0">
                                    PMID: {rec.pmid}
                                  </span>
                                )}
                              </a>
                            </div>
                          )}

                          {/* Sleek LEVL Aesthetic Action Buttons */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleAddToday(mod.id)}
                              disabled={isAddedToday || isLoading}
                              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
                                isAddedToday
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                              }`}
                            >
                              {isAddedToday ? <Check size={13} /> : <Plus size={13} />}
                              <span>{isAddedToday ? 'Enrolled' : 'Add to Today'}</span>
                            </button>

                            {onToggleSimulate && (
                              <button
                                type="button"
                                onClick={() => onToggleSimulate(mod.id)}
                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
                                  isSimulated
                                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-sm'
                                    : 'bg-cyan-950/50 hover:bg-cyan-900/70 text-cyan-300 border border-cyan-500/30'
                                }`}
                                title="Simulate adding to your stack to preview radar coverage gain"
                              >
                                <FlaskConical size={12} />
                                <span>{isSimulated ? 'Simulated ✓' : 'Simulate'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleAddBench(mod.id)}
                              disabled={isBenched || isLoading}
                              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
                                isBenched
                                  ? 'bg-slate-800 text-slate-300 border border-white/20'
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10'
                              }`}
                              title="Save to Bench for later"
                            >
                              {isBenched ? <Check size={12} /> : <Bookmark size={12} />}
                              <span>{isBenched ? 'Benched' : 'Bench'}</span>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
