'use client'

import React, { useState, useMemo } from 'react'
import { Modality } from '@/lib/types'
import {
  getAllModalityLongevityImpacts,
  CompleteModalityLongevityReport,
  LongevityVectorEvidence
} from '@/lib/data/longevityKnowledgeBase'
import { getOutcomeColor } from '@/lib/outcomes/outcomeColors'
import {
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
  Info,
  ShieldCheck,
  Award,
  BookOpen,
  Dna,
  Search,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react'
import { LongevityAnalysisModal } from '../modals/LongevityAnalysisModal'

interface ModalityLongevityDrawerProps {
  modality: Modality
  defaultExpanded?: boolean
  className?: string
}

export const ModalityLongevityDrawer: React.FC<ModalityLongevityDrawerProps> = ({
  modality,
  defaultExpanded = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [activeAnalysisOutcome, setActiveAnalysisOutcome] = useState<string | null>(null)

  const report: CompleteModalityLongevityReport = useMemo(() => {
    return getAllModalityLongevityImpacts(modality)
  }, [modality])

  // If there are no active vectors, default the neutral section to open so user sees evaluations immediately
  const [showNeutralVectors, setShowNeutralVectors] = useState(
    report ? report.vectors.length === 0 : false
  )

  if (!report) {
    return null
  }

  const primaryVector = report.primaryVector

  return (
    <div className={`rounded-xl border border-purple-500/30 bg-purple-950/20 overflow-hidden shadow-sm transition-all duration-200 ${className}`}>
      {/* Clickable Header Trigger */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 sm:p-3.5 flex items-center justify-between gap-2.5 cursor-pointer select-none hover:bg-purple-900/20 transition-colors"
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0">
            <Dna size={14} />
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white tracking-tight">
                Clinical Longevity &amp; Biomarkers
              </span>

              {/* Archetype / Tier Badge */}
              {report.isDiagnostic ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 bg-amber-500/20 border-amber-500/40 text-amber-300 flex items-center gap-1">
                  <Search size={10} />
                  <span>Diagnostic Surveillance</span>
                </span>
              ) : report.isSupportiveHabit || (report.primaryTier === 'neutral' && report.vectors.length === 0) ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 bg-slate-800 border-slate-700 text-slate-300 flex items-center gap-1">
                  <ShieldCheck size={10} />
                  <span>Supportive Baseline</span>
                </span>
              ) : primaryVector ? (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                  primaryVector.tier === 'foundational'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : primaryVector.tier === 'synergistic'
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}>
                  {primaryVector.tier === 'foundational' ? 'Tier-1 Anchor' : primaryVector.tier === 'synergistic' ? 'Tier-2 Synergist' : 'Tier-3 Marginal'}
                </span>
              ) : null}

              {/* Primary Score */}
              {primaryVector && !report.isDiagnostic && (
                <span className="text-[11px] font-mono font-bold text-purple-300 hidden sm:inline">
                  {primaryVector.score}/100 Impact
                </span>
              )}
            </div>

            <p className="text-[11px] text-purple-200/70 truncate mt-0.5">
              {report.isDiagnostic ? (
                'Diagnostic Biomarker Surveillance • Neutral Intervention'
              ) : report.isSupportiveHabit || report.vectors.length === 0 ? (
                'General Wellness & Lifestyle Practice • Neutral Longevity Intervention'
              ) : (
                <>
                  {report.vectors.length} Active Vector{report.vectors.length === 1 ? '' : 's'}
                  {report.neutralVectors.length > 0 && ` • ${report.neutralVectors.length} Neutral Vector${report.neutralVectors.length === 1 ? '' : 's'}`}
                  {report.hallmarks.length > 0 && ` • ${report.hallmarks.length} Hallmark${report.hallmarks.length === 1 ? '' : 's'}`}
                  {report.totalStudyCount > 0 && ` • ${report.totalStudyCount} Human Studies`}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-purple-300 hidden min-[520px]:inline">
            {isExpanded ? 'Hide Evidence' : 'View Evidence'}
          </span>
          <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-purple-400">
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </div>

      {/* Expanded Content Drawer */}
      {isExpanded && (
        <div className="p-3.5 sm:p-4 border-t border-purple-500/20 space-y-4 animate-in fade-in duration-200 text-xs">
          
          {/* Diagnostic Role Callout */}
          {report.isDiagnostic && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-1.5">
              <div className="flex items-center gap-2">
                <Search size={14} className="text-amber-400 shrink-0" />
                <span className="font-bold text-amber-200 text-xs">
                  Diagnostic Biomarker Surveillance &amp; Feedback Anchor
                </span>
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                This modality is an objective clinical surveillance tool. Diagnostics do not directly modulate biological tissue; rather, they quantify underlying pathology, establish baseline metrics, and guide personalized protocol titration.
              </p>
            </div>
          )}

          {/* Supportive Habit Callout */}
          {report.isSupportiveHabit && report.vectors.length === 0 && (
            <div className="p-3 rounded-xl bg-slate-900/50 border border-white/10 space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-cyan-400 shrink-0" />
                <span className="font-bold text-slate-200 text-xs">
                  Foundational Lifestyle Baseline Practice
                </span>
              </div>
              <p className="text-[11px] text-slate-300/80 leading-relaxed">
                This habit is an essential component of overall hygiene, mental clarity, and physiological baseline stability. While not an isolated pharmaceutical or senolytic intervention, it prevents negative health insults.
              </p>
            </div>
          )}

          {/* 1. Clinical Longevity Vectors */}
          {report.vectors.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] text-purple-300 uppercase font-bold tracking-wider block">
                Targeted Biological Longevity Vectors ({report.vectors.length})
              </span>

            <div className="grid grid-cols-1 gap-2.5">
              {report.vectors.map((vec) => {
                const colorConfig = getOutcomeColor(vec.outcomeId)
                return (
                  <div 
                    key={vec.outcomeId}
                    className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-2.5"
                  >
                    {/* Vector Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: colorConfig.hex }}
                        />
                        <span className="font-bold text-white text-xs sm:text-sm truncate">
                          {vec.outcomeName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                          vec.tier === 'foundational'
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : vec.tier === 'synergistic'
                            ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}>
                          {vec.score}/100
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveAnalysisOutcome(vec.outcomeId)
                          }}
                          className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                          title="View 80/20 Clinical Analysis & Scoring Calculus"
                        >
                          <Info size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Evidence Grade */}
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            vec.score >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                            vec.score >= 50 ? 'bg-gradient-to-r from-cyan-500 to-blue-400' : 'bg-slate-600'
                          }`}
                          style={{ width: `${vec.score}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="text-emerald-400 font-semibold">{vec.evidenceGrade}</span>
                        <span>{vec.tier.toUpperCase()} RETURN</span>
                      </div>
                    </div>

                    {/* Effect Size & Cellular Mechanism */}
                    <div className="space-y-1 text-[11px] leading-relaxed">
                      {vec.effectSize && (
                        <p className="text-slate-200">
                          <strong className="text-purple-300 font-semibold">Clinical Impact:</strong> {vec.effectSize}
                        </p>
                      )}
                      {vec.mechanism && (
                        <p className="text-slate-400">
                          <strong className="text-slate-300 font-semibold">Mechanism:</strong> {vec.mechanism}
                        </p>
                      )}
                    </div>

                    {/* Biomarker Anchors */}
                    {vec.biomarkers && vec.biomarkers.length > 0 && (
                      <div className="pt-1.5 border-t border-white/5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">Biomarkers:</span>
                        {vec.biomarkers.map((b, bIdx) => (
                          <span 
                            key={bIdx}
                            className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono font-medium text-slate-300"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Verified PubMed RCT Study Citations */}
                    {vec.studies && vec.studies.length > 0 && (
                      <div className="pt-2 border-t border-white/5 space-y-1.5">
                        <span className="text-[10px] text-purple-300/80 font-mono font-bold uppercase tracking-wider block">
                          Verified Human Literature:
                        </span>
                        <div className="space-y-1.5">
                          {vec.studies.map((study, sIdx) => (
                            <div 
                              key={sIdx}
                              className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-start justify-between gap-2 hover:border-purple-500/30 transition-colors"
                            >
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {study.pmid && (
                                    <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono text-[9px] font-bold border border-purple-500/30">
                                      PMID: {study.pmid}
                                    </span>
                                  )}
                                  {study.type && (
                                    <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold border border-cyan-500/30">
                                      {study.type}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-200 font-medium leading-snug line-clamp-2">
                                  {study.title}
                                </p>
                              </div>

                              <a
                                href={study.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                                title="Open PubMed Study"
                              >
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          )}

          {/* 2. Non-Targeted / Neutral Longevity Vectors */}
          {report.neutralVectors && report.neutralVectors.length > 0 && (
            <div className="pt-2 border-t border-purple-500/20 space-y-2">
              <button
                type="button"
                onClick={() => setShowNeutralVectors(!showNeutralVectors)}
                className="w-full flex items-center justify-between text-[10px] text-purple-300 uppercase font-bold tracking-wider hover:text-purple-200 transition-colors py-1 cursor-pointer select-none"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldAlert size={12} className="text-slate-400" />
                  <span>Non-Targeted / Neutral Vectors ({report.neutralVectors.length})</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 lowercase font-normal flex items-center gap-1">
                  {showNeutralVectors ? 'collapse' : 'view neutral reasons'}
                  {showNeutralVectors ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </span>
              </button>

              {showNeutralVectors && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-in fade-in duration-150">
                  {report.neutralVectors.map((nv) => {
                    const colorConfig = getOutcomeColor(nv.outcomeId)
                    return (
                      <div 
                        key={nv.outcomeId}
                        className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span 
                              className="w-2 h-2 rounded-full shrink-0 opacity-60"
                              style={{ backgroundColor: colorConfig.hex }}
                            />
                            <span className="text-[11px] font-semibold text-slate-300 truncate">
                              {nv.outcomeName}
                            </span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-white/5 text-slate-400 border border-white/10 shrink-0">
                            Neutral
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400/90 leading-snug">
                          {nv.reason}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. Rescued Hallmarks of Aging */}
          {report.hallmarks && report.hallmarks.length > 0 && (
            <div className="pt-2 border-t border-white/10 space-y-2">
              <span className="text-[10px] text-purple-300 uppercase font-bold tracking-wider flex items-center gap-1.5">
                <Layers size={12} className="text-purple-400" />
                <span>Rescued Hallmarks of Aging (López-Otín Framework)</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {report.hallmarks.map((h, hIdx) => (
                  <div 
                    key={hIdx}
                    className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[11px] font-extrabold text-white">
                        {h.name}
                      </span>
                      {h.pmid && (
                        <a
                          href={h.url || `https://pubmed.ncbi.nlm.nih.gov/${h.pmid}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[9px] font-mono text-purple-300 hover:underline flex items-center gap-0.5"
                        >
                          <span>PMID:{h.pmid}</span>
                          <ExternalLink size={9} />
                        </a>
                      )}
                    </div>
                    {h.mechanism && (
                      <p className="text-[10px] text-slate-300/80 leading-relaxed">
                        {h.mechanism}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Methodology Note */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>LEVL Biogerontological Evidence Framework</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setActiveAnalysisOutcome(primaryVector?.outcomeId || 'cellular_longevity')
              }}
              className="text-cyan-400 hover:text-cyan-300 underline font-bold cursor-pointer"
            >
              How are these scored?
            </button>
          </div>
        </div>
      )}

      {/* Embedded Longevity Analysis Modal Trigger */}
      {activeAnalysisOutcome && (
        <LongevityAnalysisModal
          isOpen={!!activeAnalysisOutcome}
          onClose={() => setActiveAnalysisOutcome(null)}
          outcomeId={activeAnalysisOutcome}
          currentDialedInScore={report.vectors.find(v => v.outcomeId === activeAnalysisOutcome)?.score}
          activeModalities={[modality]}
        />
      )}
    </div>
  )
}

export default ModalityLongevityDrawer
