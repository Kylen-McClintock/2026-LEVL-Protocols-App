'use client'

import React, { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Info,
  Sparkles,
  Layers,
  Scale,
  Activity,
  FileText,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Flame,
  Award
} from 'lucide-react'
import {
  LONGEVITY_VECTORS_METADATA,
  MASTER_MODALITY_LONGEVITY_PROFILES,
  getOutcomeVectorMetadata,
  getModalityLongevityImpact,
  LongevityVectorMetadata,
  LongevityVectorEvidence,
  ScientificStudyReference
} from '@/lib/data/longevityKnowledgeBase'
import { getOutcomeColor } from '@/lib/outcomes/outcomeColors'
import { Modality, DailyProtocolTask } from '@/lib/types'

type ModalTab = 'methodology' | 'biomarkers' | 'active_stack' | 'evidence'

interface LongevityAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  outcomeId: string
  outcomeName?: string
  currentDialedInScore?: number
  activeModalities?: Modality[]
  todayTasks?: DailyProtocolTask[]
}

export const LongevityAnalysisModal: React.FC<LongevityAnalysisModalProps> = ({
  isOpen,
  onClose,
  outcomeId,
  outcomeName,
  currentDialedInScore,
  activeModalities = [],
  todayTasks = []
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('methodology')

  const normOutcomeId = useMemo(() => {
    return outcomeId.toLowerCase().replace(/[-\s]/g, '_').trim()
  }, [outcomeId])

  const vectorMetadata: LongevityVectorMetadata | null = useMemo(() => {
    return getOutcomeVectorMetadata(normOutcomeId)
  }, [normOutcomeId])

  const colorConfig = useMemo(() => {
    return getOutcomeColor(normOutcomeId)
  }, [normOutcomeId])

  // Filter user's active modalities that contribute to this outcome
  const activeContributingModalities = useMemo(() => {
    const list: {
      modality: Modality
      evidence: LongevityVectorEvidence | null
      isFoundational: boolean
    }[] = []

    activeModalities.forEach(m => {
      const evidence = getModalityLongevityImpact(m.id, normOutcomeId)
      // Also check loose matching if not in static master
      const primMatch = (m.primary_outcome || '').toLowerCase().replace(/[-\s]/g, '_').includes(normOutcomeId)
      const secMatch = (m.secondary_outcomes || []).some(s => s.toLowerCase().replace(/[-\s]/g, '_').includes(normOutcomeId))

      if (evidence || primMatch || secMatch) {
        list.push({
          modality: m,
          evidence,
          isFoundational: evidence?.tier === 'foundational' || primMatch
        })
      }
    })

    // Sort: foundational first, then by score descending
    return list.sort((a, b) => {
      const scoreA = a.evidence?.score || (a.isFoundational ? 75 : 40)
      const scoreB = b.evidence?.score || (b.isFoundational ? 75 : 40)
      return scoreB - scoreA
    })
  }, [activeModalities, normOutcomeId])

  // Collect all peer-reviewed studies across master knowledge base and active modalities
  const allStudies: ScientificStudyReference[] = useMemo(() => {
    const map = new Map<string, ScientificStudyReference>()

    // Check all master modalities for this outcome
    Object.values(MASTER_MODALITY_LONGEVITY_PROFILES).forEach(profile => {
      const evidence = profile.longevityImpacts[normOutcomeId]
      if (evidence && Array.isArray(evidence.studies)) {
        evidence.studies.forEach(s => {
          if (!map.has(s.pmid)) {
            map.set(s.pmid, s)
          }
        })
      }
    })

    return Array.from(map.values())
  }, [normOutcomeId])

  if (!isOpen) return null

  const displayName = outcomeName || vectorMetadata?.name || outcomeId.replace(/_/g, ' ')

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl sm:max-w-3xl bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col justify-between space-y-4">
        
        {/* Ambient background glow */}
        <div 
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: colorConfig.hex }}
        />

        {/* Modal Header */}
        <div className="relative flex items-start justify-between gap-3 border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border"
              style={{
                backgroundColor: `${colorConfig.hex}15`,
                borderColor: `${colorConfig.hex}30`,
                color: colorConfig.hex
              }}
            >
              <Info size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                  {displayName}
                </h2>
                {currentDialedInScore !== undefined && (
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {currentDialedInScore}% Dialed-In
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
                Clinical Evidence &amp; 80/20 Scoring Calculus
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close Analysis"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-black/60 rounded-xl border border-white/5 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('methodology')}
            className={`flex-1 min-w-[120px] py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'methodology'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale size={13} className="text-amber-400" />
            <span>Scoring Calculus</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('biomarkers')}
            className={`flex-1 min-w-[110px] py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'biomarkers'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity size={13} className="text-cyan-400" />
            <span>Biomarkers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('active_stack')}
            className={`flex-1 min-w-[110px] py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'active_stack'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={13} className="text-emerald-400" />
            <span>Active Stack ({activeContributingModalities.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`flex-1 min-w-[110px] py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'evidence'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText size={13} className="text-purple-400" />
            <span>Literature ({allStudies.length})</span>
          </button>
        </div>

        {/* Tab Body Content (Scrollable) */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4 text-slate-300 text-xs sm:text-sm">

          {/* TAB 1: METHODOLOGY & SCORING CALCULUS */}
          {activeTab === 'methodology' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Formula Card */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-md space-y-2.5">
                <div className="flex items-center gap-2 text-white font-extrabold text-xs sm:text-sm">
                  <Sparkles size={16} className="text-amber-400" />
                  <span>The 80/20 Clinical Scoring Algorithm</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Every modality score in LEVL is calculated from an objective biogerontological formula rather than subjective ratings:
                </p>
                <div className="p-3 bg-black/70 rounded-xl border border-white/10 font-mono text-center text-xs text-amber-300 font-bold tracking-tight overflow-x-auto">
                  Score = Foundational Weight (Tier 1/2/3) × Clinical Evidence Multiplier × Dosing Factor
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Total outcome coverage applies a non-linear <strong className="text-white">sigmoidal saturation curve</strong>: the first 1–2 foundational modalities account for 80% of clinical benefit, while excessive stacking yields diminishing marginal returns.
                </p>
              </div>

              {/* 3-Tier Rubric Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  The 3 Evidence Tiers
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-white text-xs">Tier 1: Foundational Anchor (65–100 pts)</span>
                        <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">Essential 80%</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                        Primary physiological driver backed by human double-blind RCTs or meta-analyses showing direct ≥15% clinical shifts in primary hard endpoints. Reaching a Dialed-In state requires at least one Tier 1 anchor.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-white text-xs">Tier 2: Targeted Synergist (30–64 pts)</span>
                        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full font-bold">Boost Multiplier</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                        Replenishes rate-limiting co-factors, protects enzymatic substrates, or multiplies the efficacy of Tier 1 foundations (e.g. CoQ10 with cardio, Vitamin K2 with D3).
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-300 text-xs">Tier 3: Marginal Modulator (5–29 pts)</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Diminishing Yield</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                        Subtle downstream or animal-model modulation. Good candidates for the Friction Buster to bench when daily effort exceeds budget.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidence Multiplier breakdown */}
              <div className="p-3 bg-slate-900/40 rounded-xl border border-white/5 space-y-1.5 text-[11px] text-slate-400">
                <span className="font-bold text-slate-300 block">Clinical Evidence Multipliers:</span>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-emerald-400">Grade A (Human RCTs / Meta-Analyses): <strong>1.0x</strong></span>
                  <span className="text-cyan-400">Grade B (Clinical Trials / In Vivo): <strong>0.8x</strong></span>
                  <span className="text-amber-400">Grade C (Translational / In Vitro): <strong>0.5x</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLINICAL BIOMARKERS */}
          {activeTab === 'biomarkers' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="text-xs text-slate-300 leading-relaxed mb-2">
                This outcome is anchored to <strong className="text-white">objective clinical biomarkers</strong>. In LEVL, protocols are calibrated to move these verifiable blood and physiological metrics:
              </div>

              {vectorMetadata && vectorMetadata.biomarkers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {vectorMetadata.biomarkers.map((b, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-extrabold text-white text-xs">{b.name}</span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-300">
                            Target: {b.clinicalTarget} {b.unit}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
                          {b.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/30 rounded-2xl border border-white/5">
                  Tracking clinical functional metrics and subjective recovery indices.
                </div>
              )}

              {vectorMetadata?.biologicalProcesses && (
                <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-1.5 mt-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">
                    Target Biological Signaling Pathways:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                    {vectorMetadata.biologicalProcesses.map((proc, idx) => (
                      <li key={idx}><span className="text-slate-300">{proc}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACTIVE PROTOCOL STACK ANALYSIS */}
          {activeTab === 'active_stack' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="text-xs text-slate-300 leading-relaxed mb-2">
                The breakdown of your active modalities contributing to <strong className="text-white">{displayName}</strong> today:
              </div>

              {activeContributingModalities.length > 0 ? (
                <div className="space-y-2.5">
                  {activeContributingModalities.map(({ modality, evidence, isFoundational }) => {
                    const score = evidence?.score || (isFoundational ? 85 : 45)
                    const tierLabel = evidence?.tier === 'foundational' || isFoundational 
                      ? 'Tier 1 Foundational' 
                      : evidence?.tier === 'synergistic' 
                        ? 'Tier 2 Synergist' 
                        : 'Tier 3 Modulator'

                    return (
                      <div 
                        key={modality.id}
                        className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-xs sm:text-sm">
                              {modality.display_name || modality.name}
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              isFoundational || evidence?.tier === 'foundational'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : evidence?.tier === 'synergistic'
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {tierLabel}
                            </span>
                          </div>

                          <span className="text-xs font-mono font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            +{score} pts
                          </span>
                        </div>

                        {evidence?.mechanism && (
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            <strong className="text-slate-400">Mechanism:</strong> {evidence.mechanism}
                          </p>
                        )}

                        {evidence?.effectSize && (
                          <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-800/30">
                            <TrendingUp size={12} className="shrink-0" />
                            <span><strong>Clinical Effect:</strong> {evidence.effectSize}</span>
                          </div>
                        )}

                        {evidence?.studies && evidence.studies.length > 0 && (
                          <div className="pt-1 flex items-center gap-2 flex-wrap">
                            {evidence.studies.map(study => (
                              <a
                                key={study.pmid}
                                href={study.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-300 hover:text-purple-200 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 px-2 py-0.5 rounded-md transition-colors"
                              >
                                <span>PMID {study.pmid} ({study.type})</span>
                                <ExternalLink size={9} />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center space-y-2 bg-slate-900/40 rounded-2xl border border-white/5">
                  <AlertCircle size={24} className="mx-auto text-amber-400" />
                  <p className="text-xs text-slate-300 font-bold">No active modalities scheduled for this outcome today.</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Add a foundational anchor (e.g., {vectorMetadata?.goldStandardAnchors?.join(', ') || 'Zone 2 cardio or sauna'}) to build your 80/20 baseline.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PEER-REVIEWED SCIENTIFIC LITERATURE */}
          {activeTab === 'evidence' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="text-xs text-slate-300 leading-relaxed mb-2">
                Published randomized controlled trials and peer-reviewed human literature supporting <strong className="text-white">{displayName}</strong>:
              </div>

              {allStudies.length > 0 ? (
                <div className="space-y-2">
                  {allStudies.map((study, idx) => (
                    <a
                      key={study.pmid || idx}
                      href={study.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60">
                              PMID: {study.pmid}
                            </span>
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                              {study.type}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2">
                            {study.title}
                          </p>
                        </div>
                        <ExternalLink size={14} className="text-slate-500 group-hover:text-purple-400 shrink-0 mt-1" />
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/30 rounded-2xl border border-white/5">
                  Scientific papers indexed directly within active modality profiles.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="text-[11px] text-slate-500">LEVL Biogerontological Evidence Framework</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors shadow-sm"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modalContent, document.body)
}
