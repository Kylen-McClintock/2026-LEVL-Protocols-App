'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  Zap,
  Activity,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Dna,
  Layers,
  TrendingUp,
  Sliders,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BarChart2,
  RefreshCw,
  Target,
  ArrowRight,
  Info,
  Scale,
  Plus,
  X,
  Calculator
} from 'lucide-react'
import {
  CycleIntelligenceReport,
  CycleQualityScores,
  ScoreCalculationDetail,
  CompoundRoleAttribution,
  StackSynergyDetail,
  StackRedundancyDetail,
  StackConflictDetail,
  TimingCoordinationSlot,
  MeasurabilityAudit,
  LearnedStackInsight
} from '@/lib/peptides/peptideCycleIntelligenceEngine'

interface Props {
  report: CycleIntelligenceReport
  onOpenScheduleModal?: (modalityId: string) => void
  onAddOutcomeSlider?: (outcomeKey: string, outcomeLabel: string) => void
}

type TabType = 'overview' | 'synergies' | 'timing' | 'measurability' | 'learning'

export default function CycleIntelligenceCard({
  report,
  onOpenScheduleModal,
  onAddOutcomeSlider
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedCalculation, setSelectedCalculation] = useState<ScoreCalculationDetail | null>(null)
  const [enablingOutcomes, setEnablingOutcomes] = useState<Set<string>>(new Set())

  const {
    scores,
    scoreCalculations,
    compoundRoles,
    synergies,
    redundancies,
    conflicts,
    timingSlots,
    measurability,
    learnedInsights,
    executiveAdvisories,
    nextCycleBlueprint
  } = report

  // Determine score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
    if (score >= 80) return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10'
    if (score >= 70) return 'text-amber-400 border-amber-500/40 bg-amber-500/10'
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10'
  }

  const getPillColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:border-emerald-400/60'
    if (score >= 80) return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:border-cyan-400/60'
    if (score >= 70) return 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:border-amber-400/60'
    return 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:border-rose-400/60'
  }

  const handle1ClickTrack = (outcomeKey: string, outcomeLabel: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEnablingOutcomes(prev => new Set(prev).add(outcomeKey))
    if (onAddOutcomeSlider) {
      onAddOutcomeSlider(outcomeKey, outcomeLabel)
    }
  }

  const openCalculation = (id: string, fallbackTab: TabType) => {
    const calc = scoreCalculations?.[id]
    if (calc) {
      setSelectedCalculation(calc)
    } else {
      setActiveTab(fallbackTab)
    }
  }

  return (
    <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-black border border-cyan-500/30 shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in transition-all">
      {/* 1. Header Banner & Executive Quality Strip */}
      <div className="p-4 sm:p-6 border-b border-white/10 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-950/50">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Cycle Intelligence &amp; Stack Optimization
                </h3>
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getScoreColor(
                    scores.overallScore
                  )}`}
                >
                  {scores.overallRatingLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-compound coordination, receptor synergy, active-window timing, and closed-loop N-of-1 learning.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Clickable Overall Score Dial */}
            <button
              onClick={() => openCalculation('overall', 'overview')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-white/10 shadow-inner hover:border-cyan-500/50 transition-all cursor-pointer group text-left"
              title="Click to view full calculation breakdown"
            >
              <div className="text-right">
                <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block group-hover:text-cyan-400 transition-colors">
                  Design Quality ℹ️
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {scores.overallTier}
                </span>
              </div>
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center font-mono font-black text-lg border ${getScoreColor(
                  scores.overallScore
                )}`}
              >
                {scores.overallScore}
              </div>
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/5"
              title={isExpanded ? 'Collapse Intelligence Layer' : 'Expand Intelligence Layer'}
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        {/* 5-Dimensional Metric Pills Strip (All Clickable for Calculation Explanations) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          <button
            onClick={() => openCalculation('goal_alignment', 'overview')}
            className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between transition-all cursor-pointer group text-left ${getPillColor(
              scores.goalAlignmentScore
            )}`}
            title="Click to view Goal Fit formula & contributing peptides"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] opacity-75 font-bold uppercase tracking-wider block">Goal Fit</span>
              <Info size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-300" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-black font-mono">{scores.goalAlignmentScore}%</span>
              <Target size={12} className="opacity-70" />
            </div>
          </button>

          <button
            onClick={() => openCalculation('synergy', 'synergies')}
            className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between transition-all cursor-pointer group text-left ${getPillColor(
              scores.synergyScore
            )}`}
            title="Click to view Synergy formula & active pairings"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] opacity-75 font-bold uppercase tracking-wider block">Synergy</span>
              <Info size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-300" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-black font-mono">{scores.synergyScore}%</span>
              <Zap size={12} className="opacity-70" />
            </div>
          </button>

          <button
            onClick={() => openCalculation('evidence', 'overview')}
            className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between transition-all cursor-pointer group text-left ${getPillColor(
              scores.evidenceScore
            )}`}
            title="Click to view Scientific Evidence methodology"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] opacity-75 font-bold uppercase tracking-wider block">Evidence</span>
              <Info size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-300" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-black font-mono">{scores.evidenceScore}%</span>
              <BookOpen size={12} className="opacity-70" />
            </div>
          </button>

          <button
            onClick={() => openCalculation('safety', 'timing')}
            className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between transition-all cursor-pointer group text-left ${getPillColor(
              scores.safetyScore
            )}`}
            title="Click to view Safety & Hygiene scoring rules"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] opacity-75 font-bold uppercase tracking-wider block">Safety / Hygiene</span>
              <Info size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-300" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-black font-mono">{scores.safetyScore}%</span>
              <ShieldCheck size={12} className="opacity-70" />
            </div>
          </button>

          <button
            onClick={() => openCalculation('measurability', 'measurability')}
            className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between transition-all cursor-pointer group text-left ${getPillColor(
              scores.measurabilityScore
            )}`}
            title="Click to view Outcome Measurability audit & calculation"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] opacity-75 font-bold uppercase tracking-wider block">Measurability</span>
              <Info size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-300" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-black font-mono">{scores.measurabilityScore}%</span>
              <Activity size={12} className="opacity-70" />
            </div>
          </button>

          <button
            onClick={() => openCalculation('complexity', 'timing')}
            className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:border-purple-400/60 text-xs flex flex-col justify-between transition-all cursor-pointer group text-left"
            title="Click to view Stack Complexity Index breakdown"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] opacity-75 font-bold uppercase tracking-wider block">Complexity</span>
              <Info size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-300" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-black font-mono">{scores.complexityLabel}</span>
              <Layers size={12} className="opacity-70" />
            </div>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
          {/* 2. Executive Advisories Quick Alerts with 1-Click Track Actions */}
          {executiveAdvisories.length > 0 && (
            <div className="space-y-2">
              {executiveAdvisories.map((adv, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border text-xs flex items-start justify-between gap-3 ${
                    adv.type === 'synergy'
                      ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-200'
                      : adv.type === 'timing'
                      ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                      : adv.type === 'measurability'
                      ? 'bg-purple-950/30 border-purple-500/30 text-purple-200'
                      : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {adv.type === 'synergy' && <Zap size={16} className="text-cyan-400 shrink-0 mt-0.5" />}
                    {adv.type === 'timing' && <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />}
                    {adv.type === 'measurability' && <Activity size={16} className="text-purple-400 shrink-0 mt-0.5" />}
                    {adv.type === 'optimization' && <Sliders size={16} className="text-emerald-400 shrink-0 mt-0.5" />}
                    <div>
                      <strong className="font-extrabold text-white block mb-0.5">{adv.title}</strong>
                      <p className="opacity-90 leading-relaxed">{adv.description}</p>
                    </div>
                  </div>

                  {adv.actionOutcomeKey ? (
                    <button
                      onClick={e => handle1ClickTrack(adv.actionOutcomeKey!, adv.actionOutcomeLabel || adv.actionOutcomeKey!, e)}
                      disabled={enablingOutcomes.has(adv.actionOutcomeKey!)}
                      className="shrink-0 px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-purple-900/40 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Plus size={13} />
                      <span>{enablingOutcomes.has(adv.actionOutcomeKey!) ? 'Enabled!' : adv.actionText}</span>
                    </button>
                  ) : adv.actionText ? (
                    <button
                      onClick={() => {
                        if (adv.type === 'synergy') setActiveTab('synergies')
                        else if (adv.type === 'timing') setActiveTab('timing')
                        else if (adv.type === 'measurability') setActiveTab('measurability')
                        else setActiveTab('overview')
                      }}
                      className="shrink-0 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-[10px] font-mono font-bold tracking-wider uppercase text-white transition-colors cursor-pointer"
                    >
                      {adv.actionText}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {/* 3. Compound Role & Contribution Attribution */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                <Dna size={14} className="text-cyan-400" />
                <span>Compound Contribution &amp; Mechanistic Roles ({compoundRoles.length})</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Role attribution across active stack</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {compoundRoles.map(role => (
                <div
                  key={role.modalityId}
                  className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 hover:border-cyan-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                          {role.modalityName}
                        </h4>
                        {role.isRedundant && (
                          <span className="px-2 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold border border-amber-500/30">
                            Overlapping Pathway
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {role.protocolName} • {role.timingSlot}
                      </span>
                    </div>

                    <a
                      href={role.pubmedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors"
                      title="View PubMed Study"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  {/* Primary Mechanistic Role */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 text-xs text-slate-200">
                    <span className="text-[9px] font-mono uppercase font-bold text-cyan-400 block mb-0.5">
                      Mechanistic Role:
                    </span>
                    <p className="text-[11px] leading-snug">{role.primaryRole}</p>
                  </div>

                  {/* Goal Alignment & Target Receptors */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5 flex-wrap gap-1">
                    <span className="flex items-center gap-1">
                      <Target size={11} className={role.statedGoalFit.aligned ? 'text-emerald-400' : 'text-amber-400'} />
                      <span className="truncate max-w-[180px]">{role.statedGoalFit.goalLabel}</span>
                    </span>
                    <span className="font-mono text-slate-500">
                      {role.evidenceLevel.split(' ')[0]} Evidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Progressive Disclosure Deep Dive Tabs */}
          <div className="pt-2 border-t border-white/10 space-y-4">
            {/* Tab Selector Toolbar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                <Layers size={13} />
                <span>Stack Architecture</span>
              </button>

              <button
                onClick={() => setActiveTab('synergies')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                  activeTab === 'synergies'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                <Zap size={13} />
                <span>Synergies &amp; Redundancies ({synergies.length + redundancies.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('timing')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                  activeTab === 'timing'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                <Clock size={13} />
                <span>Active Windows &amp; Timing</span>
              </button>

              <button
                onClick={() => setActiveTab('measurability')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                  activeTab === 'measurability'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                <Activity size={13} />
                <span>Measurability &amp; Labs ({measurability.activelyTrackedCount}/{measurability.totalTargetOutcomes})</span>
              </button>

              <button
                onClick={() => setActiveTab('learning')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                  activeTab === 'learning'
                    ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                <TrendingUp size={13} />
                <span>N-of-1 Learned Loop</span>
              </button>
            </div>

            {/* TAB CONTENT: 1. Overview & Next Blueprint */}
            {activeTab === 'overview' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <RefreshCw size={13} className="text-cyan-400" />
                    <span>Next Cycle Iterative Blueprint (Design → Execute → Learn → Improve)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Continuous Stack Evolution</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {nextCycleBlueprint.summaryRationale}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20 space-y-1">
                    <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase block">
                      Core Drivers to Keep:
                    </span>
                    {nextCycleBlueprint.suggestedKeepers.length > 0 ? (
                      nextCycleBlueprint.suggestedKeepers.map((k, i) => (
                        <p key={i} className="text-xs text-slate-200 flex items-center gap-1">
                          <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                          <span>{k}</span>
                        </p>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">All active peptides undergoing calibration</p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/20 space-y-1">
                    <span className="text-[9px] font-mono text-amber-400 font-bold uppercase block">
                      Washout / Simplification:
                    </span>
                    {nextCycleBlueprint.suggestedWashoutsOrDrops.length > 0 ? (
                      nextCycleBlueprint.suggestedWashoutsOrDrops.map((w, i) => (
                        <p key={i} className="text-xs text-slate-200 flex items-center gap-1">
                          <Clock size={11} className="text-amber-400 shrink-0" />
                          <span>{w}</span>
                        </p>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">No scheduled washouts due this week</p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/20 space-y-1">
                    <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase block">
                      Timing Adjustments:
                    </span>
                    {nextCycleBlueprint.suggestedTimingTweaks.length > 0 ? (
                      nextCycleBlueprint.suggestedTimingTweaks.map((t, i) => (
                        <p key={i} className="text-[11px] text-slate-300 leading-tight">
                          • {t}
                        </p>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">All dosing slots clinically synchronized</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. Synergies & Redundancies */}
            {activeTab === 'synergies' && (
              <div className="space-y-4">
                {/* Active Synergies */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={13} />
                    <span>Verified Receptor &amp; Biochemical Synergies ({synergies.length})</span>
                  </span>

                  {synergies.length > 0 ? (
                    <div className="space-y-2.5">
                      {synergies.map((syn, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 space-y-2"
                        >
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-extrabold text-white">
                                {syn.compoundA} + {syn.compoundB}
                              </span>
                              <span className="text-[9px] font-mono px-2 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                {syn.evidenceRating}
                              </span>
                            </div>
                            {syn.pubmedUrl && (
                              <a
                                href={syn.pubmedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                              >
                                <span>PubMed Study</span>
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>

                          <strong className="text-xs text-emerald-300 block">{syn.headline}</strong>
                          <p className="text-xs text-slate-300 leading-relaxed">{syn.mechanisticRationale}</p>
                          <div className="p-2 rounded-xl bg-black/40 text-[11px] text-slate-400 font-mono">
                            <strong className="text-slate-300">Actionable Administration:</strong> {syn.actionableTiming}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-black/30 border border-white/5 text-xs text-slate-400">
                      No multi-peptide synergistic pairs currently in active schedule.
                    </div>
                  )}
                </div>

                {/* Overlapping Redundancies */}
                {redundancies.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle size={13} />
                      <span>Receptor Overlap &amp; Redundancy Analysis ({redundancies.length})</span>
                    </span>

                    <div className="space-y-2.5">
                      {redundancies.map((red, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-xs font-extrabold text-amber-300">{red.headline}</strong>
                            <span className="text-[10px] font-mono text-amber-400">{red.targetPathway}</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{red.rationale}</p>
                          <div className="p-2.5 rounded-xl bg-black/40 text-xs text-amber-200 border border-amber-500/20">
                            <strong>Recommendation:</strong> {red.recommendation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: 3. Timing & Active Windows */}
            {activeTab === 'timing' && (
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={13} />
                    <span>24-Hour Active Window Dosing Coordination</span>
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {timingSlots.map(slot => (
                      <div
                        key={slot.slotKey}
                        className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                          slot.scheduledCompounds.length > 0
                            ? 'bg-slate-900/80 border-cyan-500/30'
                            : 'bg-black/30 border-white/5 opacity-70'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-extrabold text-white">{slot.slotLabel}</span>
                            <span className="text-[9px] font-mono px-2 py-0.2 rounded-md bg-white/10 text-slate-300">
                              {slot.scheduledCompounds.length} Compounds
                            </span>
                          </div>

                          <div className="space-y-1">
                            {slot.scheduledCompounds.length > 0 ? (
                              slot.scheduledCompounds.map((name, i) => (
                                <span
                                  key={i}
                                  className="inline-block mr-1.5 mb-1 px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30"
                                >
                                  {name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">No doses scheduled</span>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-snug border-t border-white/5 pt-2">
                          {slot.notes}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {conflicts.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-amber-300">
                      <AlertTriangle size={15} />
                      <strong className="text-xs font-bold">Timing / Metabolic Blunting Alerts:</strong>
                    </div>
                    {conflicts.map((c, i) => (
                      <div key={i} className="text-xs text-slate-300 space-y-1">
                        <p className="font-semibold text-amber-200">• {c.headline}</p>
                        <p className="text-slate-400 pl-3">{c.mitigation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: 4. Measurability & Biomarkers */}
            {activeTab === 'measurability' && (
              <div className="space-y-4">
                {/* Actively Tracked vs Blind Spots */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tracked Outcomes */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 size={13} />
                        <span>Actively Measured Outcomes ({measurability.trackedOutcomes.length})</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Synced Real-Time</span>
                    </div>

                    {measurability.trackedOutcomes.length > 0 ? (
                      <div className="space-y-2">
                        {measurability.trackedOutcomes.map(out => (
                          <div
                            key={out.key}
                            className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-white block">{out.label}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {out.associatedCompounds.join(', ')}
                              </span>
                            </div>

                            <div className="text-right font-mono">
                              <span className="text-xs font-bold text-cyan-400 block">
                                {out.activeAvg !== null ? `${out.activeAvg}/10` : 'Calibrating (Enabled)'}
                              </span>
                              {out.deltaPct !== null ? (
                                <span className="text-[10px] text-emerald-400 block">
                                  {out.deltaPct > 0 ? `+${out.deltaPct}%` : `${out.deltaPct}%`}
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-500 block">
                                  {out.observationCount} logs
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-xs text-slate-400 text-center">
                        No target outcomes currently enabled. Click &quot;+ Track Outcome&quot; on any blind spot below to activate tracking.
                      </div>
                    )}
                  </div>

                  {/* Blind Spots & 1-Click Track Actions */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle size={13} />
                        <span>Measurement Blind Spots ({measurability.blindSpots.length})</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">1-Click Activation</span>
                    </div>

                    {measurability.blindSpots.length > 0 ? (
                      <div className="space-y-2">
                        {measurability.blindSpots.map((blind, i) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <strong className="text-purple-300 font-bold block">
                                  Missing: {blind.missingOutcomeLabel}
                                </strong>
                                <span className="text-[10px] font-mono text-purple-400">{blind.modalityName}</span>
                              </div>

                              <button
                                onClick={e => handle1ClickTrack(blind.missingOutcomeKey, blind.missingOutcomeLabel, e)}
                                disabled={enablingOutcomes.has(blind.missingOutcomeKey)}
                                className="px-2.5 py-1 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-bold text-[11px] flex items-center gap-1 shadow-md transition-all cursor-pointer shrink-0 disabled:opacity-50"
                              >
                                <Plus size={12} />
                                <span>{enablingOutcomes.has(blind.missingOutcomeKey) ? 'Enabled!' : `+ Track ${blind.missingOutcomeLabel}`}</span>
                              </button>
                            </div>

                            <p className="text-[11px] text-slate-300">{blind.whyItMatters}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          <span>100% Tracking Coverage!</span>
                        </div>
                        <p className="text-[11px] text-emerald-200/80">
                          All active peptides have corresponding outcome tracking sliders enabled.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Biomarker Monitoring Panels */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={13} className="text-cyan-400" />
                    <span>Recommended Clinical Bloodwork Panels</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {measurability.biomarkerCoverage.map(bio => (
                      <div
                        key={bio.biomarkerId}
                        className="p-3 rounded-xl bg-slate-900/80 border border-white/5 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{bio.biomarkerName}</span>
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                              bio.status === 'measured'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {bio.status === 'measured' ? 'Logged' : 'Missing'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2">{bio.clinicalRationale}</p>
                        <div className="flex items-center justify-between font-mono text-[10px] text-slate-300 pt-1 border-t border-white/5">
                          <span>Base: {bio.baselineValue || 'N/A'}</span>
                          <span className="text-cyan-400">Active: {bio.activeValue || 'Pending'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 5. N-of-1 Learned Loop (Expected vs Observed) */}
            {activeTab === 'learning' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={13} />
                    <span>Closed-Loop N-of-1 Trajectory (Expected Literature vs. Observed User Results)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Personalized Effectiveness</span>
                </div>

                <div className="space-y-3">
                  {learnedInsights.map(insight => (
                    <div
                      key={insight.compoundId}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-fuchsia-500/30 space-y-3"
                    >
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="text-sm font-extrabold text-white">{insight.compoundName}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Target: {insight.primaryOutcome} • {insight.daysLogged} Doses Logged ({insight.adherencePct}% Adherence)
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                            insight.status === 'proven_value'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : insight.status === 'promising_trend'
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {insight.status.replace(/_/g, ' ').toUpperCase()} • {insight.personalConfidence}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* Expected Benefit */}
                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                          <span className="text-[9px] font-mono font-bold uppercase text-cyan-400 block">
                            Theoretical Rationale (Literature):
                          </span>
                          <p className="text-slate-300 text-[11px] leading-relaxed">{insight.expectedBenefit}</p>
                        </div>

                        {/* Observed Benefit */}
                        <div className="p-3 rounded-xl bg-black/40 border border-fuchsia-500/20 space-y-1">
                          <span className="text-[9px] font-mono font-bold uppercase text-fuchsia-400 block">
                            Personal Observed Result (N-of-1):
                          </span>
                          <p className="text-slate-200 text-[11px] leading-relaxed font-medium">
                            {insight.observedBenefit}
                          </p>
                        </div>
                      </div>

                      {/* Next Cycle Blueprint Action */}
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 text-xs text-slate-300 flex items-center justify-between flex-wrap gap-2">
                        <span className="font-mono text-[10px] text-slate-400">
                          <strong className="text-slate-200">Next Iteration Action:</strong> {insight.nextCycleRecommendation}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Score Calculation & Methodology Modal */}
      {selectedCalculation && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedCalculation(null)}
        >
          <div
            className="relative w-full max-w-xl bg-slate-950 border border-cyan-500/40 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Calculator size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {selectedCalculation.title}
                  </h3>
                  <span className="text-xs font-mono text-cyan-300">
                    Score: <strong>{selectedCalculation.score}</strong> • {selectedCalculation.ratingLabel}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCalculation(null)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Formula Block */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Mathematical Formula &amp; Weighting:</span>
              <div className="p-3 rounded-xl bg-slate-900 border border-white/10 font-mono text-xs text-cyan-300 overflow-x-auto">
                {selectedCalculation.mathematicalFormula}
              </div>
            </div>

            {/* Summary Explanation */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Scientific Rationale:</span>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedCalculation.summaryExplanation}</p>
            </div>

            {/* Contributing Stack Factors */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                Contributing Stack Factors ({selectedCalculation.contributingFactors.length}):
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {selectedCalculation.contributingFactors.map((fact, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs flex items-start justify-between gap-2"
                  >
                    <div>
                      <strong className="text-white block">{fact.label}</strong>
                      <span className="text-[11px] text-slate-400 leading-tight block">{fact.detail}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold shrink-0 ${
                        fact.impact === 'positive'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : fact.impact === 'negative'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {fact.impact.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Jump to Assessment Button */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                onClick={() => setSelectedCalculation(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Close
              </button>

              <button
                onClick={() => {
                  setActiveTab(selectedCalculation.targetTab)
                  setSelectedCalculation(null)
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>Jump to {selectedCalculation.title.replace('Score', '').replace('Index', '')} Section</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
