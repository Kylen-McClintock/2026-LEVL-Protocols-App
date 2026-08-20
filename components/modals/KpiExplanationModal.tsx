'use client'

import React from 'react'
import {
  X,
  Zap,
  TrendingUp,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Dna,
  Layers,
  ChevronRight
} from 'lucide-react'
import { ActiveSynergyPair } from '@/lib/tracking/synergyMultiplierEngine'

export type KpiModalType = 'adherence' | 'realized_impact' | 'outcomes' | 'synergy' | null

interface KpiExplanationModalProps {
  isOpen: boolean
  onClose: () => void
  modalType: KpiModalType
  overallAdherencePct: number
  totalRealizedRoi: number
  totalRealizedPoints: number
  totalPotentialPoints: number
  outcomeCount: number
  priorityOutcomeCount: number
  activeSynergyPairs: ActiveSynergyPair[]
  totalSynergyBonusPoints: number
  onSelectFilter?: (filter: 'all' | 'priority' | 'leaks' | 'momentum') => void
}

export const KpiExplanationModal: React.FC<KpiExplanationModalProps> = ({
  isOpen,
  onClose,
  modalType,
  overallAdherencePct,
  totalRealizedRoi,
  totalRealizedPoints,
  totalPotentialPoints,
  outcomeCount,
  priorityOutcomeCount,
  activeSynergyPairs,
  totalSynergyBonusPoints,
  onSelectFilter
}) => {
  if (!isOpen || !modalType) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col justify-between space-y-5">
        {/* Background glow */}
        {modalType === 'adherence' && (
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        )}
        {modalType === 'realized_impact' && (
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        )}
        {modalType === 'outcomes' && (
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        )}
        {modalType === 'synergy' && (
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        )}

        {/* Modal Header */}
        <div className="relative z-10 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-lg shrink-0 ${
                modalType === 'adherence'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                  : modalType === 'realized_impact'
                  ? 'bg-teal-500/20 border border-teal-500/40 text-teal-400'
                  : modalType === 'outcomes'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                  : 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-400'
              }`}
            >
              {modalType === 'adherence' && <Zap size={24} />}
              {modalType === 'realized_impact' && <TrendingUp size={24} />}
              {modalType === 'outcomes' && <Award size={24} />}
              {modalType === 'synergy' && <Sparkles size={24} />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Metric Deep Dive &amp; Methodology
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-0.5">
                {modalType === 'adherence' && 'Stack Adherence (Rolling 14-Day)'}
                {modalType === 'realized_impact' && 'Realized Longevity Impact & Biological ROI'}
                {modalType === 'outcomes' && 'Active Health & Longevity Outcomes'}
                {modalType === 'synergy' && 'Biochemical & Physiological Synergy'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close explanation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="relative z-10 overflow-y-auto pr-1 space-y-4 max-h-[58vh] scrollbar-thin text-xs sm:text-sm">
          {/* =================================================== */}
          {/* 1. STACK ADHERENCE */}
          {/* =================================================== */}
          {modalType === 'adherence' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Current Adherence</span>
                  <div className="text-2xl font-black text-white font-mono mt-0.5">{overallAdherencePct}%</div>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {overallAdherencePct >= 80 ? 'Optimal (Epigenetic Adaptation)' :
                   overallAdherencePct >= 50 ? 'Moderate Consistency' : 'High Friction / Execution Leaks'}
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  How This Is Calculated
                </h4>
                <p className="text-slate-300 leading-relaxed text-xs">
                  Stack Adherence measures the execution frequency of your scheduled protocol tasks over a rolling 14-day window. Each completed session increments your adherence quotient, weighted by protocol frequency (Daily, 3x/wk, Weekly).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <ShieldCheck size={14} />
                  <span>The 80% Biological Adaptation Threshold:</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  In biogerontology and sports science, systemic adaptations (such as mitochondrial biogenesis, vascular remodeling, and autophagy induction) require consistent minimum stimulus density. An adherence rate above 80% ensures cumulative physiological gains without receptor downregulation.
                </p>
              </div>

              {onSelectFilter && (
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectFilter('leaks')
                      onClose()
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/30 text-rose-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle size={13} />
                    <span>View Execution Leaks (&lt;50% Adherence)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectFilter('momentum')
                      onClose()
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Flame size={13} />
                    <span>View High Momentum Habits</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* =================================================== */}
          {/* 2. REALIZED IMPACT */}
          {/* =================================================== */}
          {modalType === 'realized_impact' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-teal-400 uppercase font-bold">Realized Longevity ROI</span>
                  <div className="text-2xl font-black text-teal-300 font-mono mt-0.5">
                    {totalRealizedRoi}%
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Harvested Points</span>
                  <div className="text-base font-black text-white font-mono mt-0.5">
                    {totalRealizedPoints} / {totalPotentialPoints} pts
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  The Biological ROI Formula
                </h4>
                <p className="text-slate-300 leading-relaxed text-xs">
                  Realized Impact represents the actual biological dividends you capture from your stack versus the theoretical ceiling of 100% execution:
                </p>
                <div className="p-3 rounded-xl bg-slate-900 border border-teal-500/20 font-mono text-xs text-teal-300">
                  Realized Points = (Modality Impact Weight × Adherence Rate) + Biochemical Synergy Multipliers
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400">
                  <TrendingUp size={14} />
                  <span>Unlocking Maximum Potential:</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Adding high-tier modalities without consistent execution dilutes your realized ROI. Eliminating execution friction on your existing stack yields 3x higher biological return than adding new complex protocols.
                </p>
              </div>
            </div>
          )}

          {/* =================================================== */}
          {/* 3. ACTIVE OUTCOMES */}
          {/* =================================================== */}
          {modalType === 'outcomes' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Total Targeted Outcomes</span>
                  <div className="text-2xl font-black text-white font-mono mt-0.5">
                    {outcomeCount} Outcomes
                  </div>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-amber-950 text-amber-300 border border-amber-800">
                  {priorityOutcomeCount} High Priority Goals
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Multi-System Outcome Mapping
                </h4>
                <p className="text-slate-300 leading-relaxed text-xs">
                  Your active routine is categorized into evidence-based physiological and longevity targets (e.g. Deep Sleep Architecture, Cardiovascular &amp; VO2 Max, Cellular Defense &amp; Autophagy, Metabolic Flexibility).
                </p>
                <p className="text-slate-300 leading-relaxed text-xs">
                  Priority outcomes reflect goals you have highlighted as your primary health focus or where your baseline biomarker diagnostics indicate an optimization opportunity.
                </p>
              </div>

              {onSelectFilter && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectFilter('priority')
                    onClose()
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/30 text-amber-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Award size={13} />
                  <span>Filter by Priority Outcomes ({priorityOutcomeCount})</span>
                </button>
              )}
            </div>
          )}

          {/* =================================================== */}
          {/* 4. BIOCHEMICAL SYNERGY */}
          {/* =================================================== */}
          {modalType === 'synergy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold">Active Biochemical Synergies</span>
                  <div className="text-2xl font-black text-indigo-300 font-mono mt-0.5">
                    {activeSynergyPairs.length} Active Pairs
                  </div>
                </div>
                {totalSynergyBonusPoints > 0 && (
                  <span className="text-xs font-bold px-3 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800">
                    +{totalSynergyBonusPoints} Bonus Impact Points
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Why Modality Synergy Multipliers Matter
                </h4>
                <p className="text-slate-300 leading-relaxed text-xs">
                  Biochemical synergy occurs when two or more interventions compound each other’s biological efficacy—such as lipid-carrier enhanced absorption, thermal vascular contrast, or metabolic pathway priming. Each verified active synergy unlocks a +15% multiplier to your realized ROI.
                </p>
              </div>

              {/* Active Synergy Pairs List */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Active Verified Synergy Pairs in Your Stack:
                </span>

                {activeSynergyPairs.length > 0 ? (
                  <div className="space-y-2.5">
                    {activeSynergyPairs.map((pair, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-2 shadow-md"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-xs font-black text-white">
                            <span className="text-indigo-300">{pair.primaryModalityName}</span>
                            <span className="text-slate-500">+</span>
                            <span className="text-emerald-300">{pair.targetModalityName}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                            +{Math.round((pair.multiplier - 1) * 100)}% Multiplier
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-indigo-200">
                          {pair.headline}
                        </p>

                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {pair.rationale}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5 flex-wrap gap-2">
                          <span className="text-emerald-400 font-semibold">
                            💡 Tip: {pair.actionableTip}
                          </span>
                          {pair.pubmedUrl && (
                            <a
                              href={pair.pubmedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 underline font-semibold"
                            >
                              <ExternalLink size={10} />
                              <span>PubMed Paper</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900 border border-white/5 text-center text-xs text-slate-400 space-y-1">
                    <p>No active biochemical synergies detected yet.</p>
                    <p className="text-[11px] text-slate-400">
                      Pairing complementary modalities (e.g. EVOO with fat-soluble senolytics, or Sauna with Cold Plunge) unlocks automatic synergy bonuses.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="relative z-10 pt-3 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
