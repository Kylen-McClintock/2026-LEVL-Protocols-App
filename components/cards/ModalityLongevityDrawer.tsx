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
import {
  LongevityVectorIcon,
  HallmarkOfAgingIcon,
  HallmarkOfAgingId,
  HALLMARKS_OF_AGING_METADATA
} from '@/components/icons'
import { useTheme } from '@/lib/utils/useTheme'

function resolveHallmarkId(name: string): HallmarkOfAgingId {
  const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
  if (norm in HALLMARKS_OF_AGING_METADATA) {
    return norm as HallmarkOfAgingId
  }
  if (norm.includes('autophagy')) return 'disabled_macroautophagy'
  if (norm.includes('telomere')) return 'telomere_attrition'
  if (norm.includes('mitochondri')) return 'mitochondrial_dysfunction'
  if (norm.includes('senescen')) return 'cellular_senescence'
  if (norm.includes('epigenetic')) return 'epigenetic_alterations'
  if (norm.includes('genomic') || norm.includes('dna_repair') || norm.includes('instability')) return 'genomic_instability'
  if (norm.includes('proteostasis')) return 'loss_of_proteostasis'
  if (norm.includes('nutrient')) return 'deregulated_nutrient_sensing'
  if (norm.includes('stem_cell')) return 'stem_cell_exhaustion'
  if (norm.includes('intercellular') || norm.includes('communication')) return 'altered_intercellular_communication'
  if (norm.includes('inflammation') || norm.includes('inflammaging')) return 'chronic_inflammation'
  if (norm.includes('dysbiosis') || norm.includes('microbiome')) return 'dysbiosis'
  return 'mitochondrial_dysfunction'
}

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
  const { isLight } = useTheme()
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
    <div className={`rounded-2xl border overflow-hidden shadow-sm transition-all duration-200 ${
      isLight ? 'bg-white border-[#E1E8E3]' : 'border-purple-500/30 bg-purple-950/20'
    } ${className}`}>
      {/* Clickable Header Trigger */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-3 sm:p-3.5 flex items-center justify-between gap-2.5 cursor-pointer select-none transition-colors ${
          isLight ? 'hover:bg-[#F0EDFB]/40' : 'hover:bg-purple-900/20'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
            isLight
              ? 'bg-[#F0EDFB] border-[#6954C8]/30 text-[#6954C8]'
              : 'bg-purple-500/20 border-purple-500/40 text-purple-300'
          }`}>
            {primaryVector ? (
              <LongevityVectorIcon vector={primaryVector.outcomeId} size={15} glow={false} />
            ) : (
              <Dna size={14} />
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold tracking-tight ${
                isLight ? 'text-[#475569]' : 'text-white'
              }`}>
                Clinical Longevity &amp; Biomarkers
              </span>

              {/* Archetype / Tier Badge */}
              {report.isDiagnostic ? (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 flex items-center gap-1 ${
                  isLight
                    ? 'bg-[#FFFBEB] border-[#D97706]/40 text-[#D97706]'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                }`}>
                  <Search size={10} />
                  <span>Diagnostic Surveillance</span>
                </span>
              ) : report.isSupportiveHabit || (report.primaryTier === 'neutral' && report.vectors.length === 0) ? (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 flex items-center gap-1 ${
                  isLight
                    ? 'bg-[#EFF3F0] border-[#E1E8E3] text-[#526661]'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}>
                  <ShieldCheck size={10} />
                  <span>Supportive Baseline</span>
                </span>
              ) : primaryVector ? (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                  primaryVector.tier === 'foundational'
                    ? isLight
                      ? 'bg-[#E6F3EB] border-[#2B725C]/40 text-[#2B725C]'
                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : primaryVector.tier === 'synergistic'
                    ? isLight
                      ? 'bg-[#ECFEFF] border-[#0891B2]/40 text-[#0891B2]'
                      : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                    : isLight
                    ? 'bg-[#EFF3F0] border-[#E1E8E3] text-[#526661]'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}>
                  {primaryVector.tier === 'foundational' ? 'Tier-1 Anchor' : primaryVector.tier === 'synergistic' ? 'Tier-2 Synergist' : 'Tier-3 Marginal'}
                </span>
              ) : null}

              {/* Primary Score */}
              {primaryVector && !report.isDiagnostic && (
                <span className={`text-[11px] font-mono font-bold hidden sm:inline ${
                  isLight ? 'text-[#6954C8]' : 'text-purple-300'
                }`}>
                  {primaryVector.score}/100 Impact
                </span>
              )}
            </div>

            <p className={`text-[11px] truncate mt-0.5 ${
              isLight ? 'text-[#526661]' : 'text-purple-200/70'
            }`}>
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
          <span className={`text-[11px] font-bold hidden min-[520px]:inline ${
            isLight ? 'text-[#6954C8]' : 'text-purple-300'
          }`}>
            {isExpanded ? 'Hide Evidence' : 'View Evidence'}
          </span>
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
            isLight ? 'bg-[#EFF3F0] text-[#6954C8]' : 'bg-white/5 text-purple-400'
          }`}>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </div>

      {/* Expanded Content Drawer */}
      {isExpanded && (
        <div className={`p-3.5 sm:p-4 border-t space-y-4 animate-in fade-in duration-200 text-xs ${
          isLight ? 'border-[#E1E8E3]' : 'border-purple-500/20'
        }`}>
          
          {/* Diagnostic Role Callout */}
          {report.isDiagnostic && (
            <div className={`p-3 rounded-xl border space-y-1.5 ${
              isLight ? 'bg-[#FFFBEB] border-[#D97706]/30' : 'bg-amber-950/30 border-amber-500/30'
            }`}>
              <div className="flex items-center gap-2">
                <Search size={14} className={isLight ? 'text-[#D97706]' : 'text-amber-400'} />
                <span className={`font-bold text-xs ${isLight ? 'text-[#475569]' : 'text-amber-200'}`}>
                  Diagnostic Biomarker Surveillance &amp; Feedback Anchor
                </span>
              </div>
              <p className={`text-[11px] leading-relaxed ${isLight ? 'text-[#526661]' : 'text-amber-200/80'}`}>
                This modality is an objective clinical surveillance tool. Diagnostics do not directly modulate biological tissue; rather, they quantify underlying pathology, establish baseline metrics, and guide personalized protocol titration.
              </p>
            </div>
          )}

          {/* Supportive Habit Callout */}
          {report.isSupportiveHabit && report.vectors.length === 0 && (
            <div className={`p-3 rounded-xl border space-y-1.5 ${
              isLight ? 'bg-[#EFF3F0] border-[#E1E8E3]' : 'bg-slate-900/50 border-white/10'
            }`}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className={isLight ? 'text-[#0891B2]' : 'text-cyan-400'} />
                <span className={`font-bold text-xs ${isLight ? 'text-[#475569]' : 'text-slate-200'}`}>
                  Foundational Lifestyle Baseline Practice
                </span>
              </div>
              <p className={`text-[11px] leading-relaxed ${isLight ? 'text-[#526661]' : 'text-slate-300/80'}`}>
                This habit is an essential component of overall hygiene, mental clarity, and physiological baseline stability. While not an isolated pharmaceutical or senolytic intervention, it prevents negative health insults.
              </p>
            </div>
          )}

          {/* 1. Clinical Longevity Vectors */}
          {report.vectors.length > 0 && (
            <div className="space-y-3">
              <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                isLight ? 'text-[#526661]' : 'text-purple-300'
              }`}>
                Targeted Biological Longevity Vectors ({report.vectors.length})
              </span>

            <div className="grid grid-cols-1 gap-2.5">
              {report.vectors.map((vec) => {
                const colorConfig = getOutcomeColor(vec.outcomeId)
                return (
                  <div 
                    key={vec.outcomeId}
                    className={`p-3 rounded-2xl border space-y-2.5 ${
                      isLight ? 'bg-[#EFF3F0] border-[#E1E8E3]' : 'bg-black/50 border-white/10'
                    }`}
                  >
                    {/* Vector Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="shrink-0">
                          <LongevityVectorIcon vector={vec.outcomeId} size={18} glow={!isLight} />
                        </div>
                        <span className={`font-bold text-xs sm:text-sm truncate ${
                          isLight ? 'text-[#475569]' : 'text-white'
                        }`}>
                          {vec.outcomeName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                          vec.tier === 'foundational'
                            ? isLight
                              ? 'bg-[#E6F3EB] border-[#2B725C]/40 text-[#2B725C]'
                              : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : vec.tier === 'synergistic'
                            ? isLight
                              ? 'bg-[#ECFEFF] border-[#0891B2]/40 text-[#0891B2]'
                              : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                            : isLight
                            ? 'bg-white border-[#E1E8E3] text-[#526661]'
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
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            isLight
                              ? 'bg-white hover:bg-[#EAEFEA] text-[#0891B2] border border-[#E1E8E3]'
                              : 'bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300'
                          }`}
                          title="View 80/20 Clinical Analysis & Scoring Calculus"
                        >
                          <Info size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Evidence Grade */}
                    <div className="space-y-1">
                      <div className={`w-full h-1.5 rounded-full overflow-hidden border ${
                        isLight ? 'bg-[#E1E8E3] border-transparent' : 'bg-slate-900 border-white/5'
                      }`}>
                        <div 
                          className={`h-full transition-all duration-500 ${
                            vec.score >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                            vec.score >= 50 ? 'bg-gradient-to-r from-cyan-500 to-blue-400' : 'bg-slate-600'
                          }`}
                          style={{ width: `${vec.score}%` }}
                        />
                      </div>
                      <div className={`flex items-center justify-between text-[10px] font-mono ${
                        isLight ? 'text-[#526661]' : 'text-slate-400'
                      }`}>
                        <span className={`font-semibold ${isLight ? 'text-[#2B725C]' : 'text-emerald-400'}`}>{vec.evidenceGrade}</span>
                        <span>{vec.tier.toUpperCase()} RETURN</span>
                      </div>
                    </div>

                    {/* Effect Size & Cellular Mechanism */}
                    <div className="space-y-1 text-[11px] leading-relaxed">
                      {vec.effectSize && (
                        <p className={isLight ? 'text-[#475569]' : 'text-slate-200'}>
                          <strong className={`font-semibold ${isLight ? 'text-[#2B725C]' : 'text-purple-300'}`}>Clinical Impact:</strong> {vec.effectSize}
                        </p>
                      )}
                      {vec.mechanism && (
                        <p className={isLight ? 'text-[#526661]' : 'text-slate-400'}>
                          <strong className={`font-semibold ${isLight ? 'text-[#475569]' : 'text-slate-300'}`}>Mechanism:</strong> {vec.mechanism}
                        </p>
                      )}
                    </div>

                    {/* Biomarker Anchors */}
                    {vec.biomarkers && vec.biomarkers.length > 0 && (
                      <div className={`pt-1.5 border-t flex items-center gap-1.5 flex-wrap ${
                        isLight ? 'border-[#E1E8E3]' : 'border-white/5'
                      }`}>
                        <span className={`text-[10px] font-mono font-bold uppercase ${
                          isLight ? 'text-[#6E7E78]' : 'text-slate-500'
                        }`}>Biomarkers:</span>
                        {vec.biomarkers.map((b, bIdx) => (
                          <span 
                            key={bIdx}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium border ${
                              isLight
                                ? 'bg-white border-[#E1E8E3] text-[#475569]'
                                : 'bg-white/5 border-white/10 text-slate-300'
                            }`}
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Verified PubMed RCT Study Citations */}
                    {vec.studies && vec.studies.length > 0 && (
                      <div className={`pt-2 border-t space-y-1.5 ${isLight ? 'border-[#E1E8E3]' : 'border-white/5'}`}>
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${
                          isLight ? 'text-[#526661]' : 'text-purple-300/80'
                        }`}>
                          Verified Human Literature:
                        </span>
                        <div className="space-y-1.5">
                          {vec.studies.map((study, sIdx) => (
                            <div 
                              key={sIdx}
                              className={`p-2 rounded-xl border flex items-start justify-between gap-2 transition-colors ${
                                isLight
                                  ? 'bg-white border-[#E1E8E3] hover:border-[#6954C8]/30'
                                  : 'bg-black/40 border-white/5 hover:border-purple-500/30'
                              }`}
                            >
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {study.pmid && (
                                    <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold border ${
                                      isLight
                                        ? 'bg-[#F0EDFB] text-[#6954C8] border-[#6954C8]/30'
                                        : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                    }`}>
                                      PMID: {study.pmid}
                                    </span>
                                  )}
                                  {study.type && (
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                                      isLight
                                        ? 'bg-[#ECFEFF] text-[#0891B2] border-[#0891B2]/30'
                                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                    }`}>
                                      {study.type}
                                    </span>
                                  )}
                                </div>
                                <p className={`text-[11px] font-medium leading-snug line-clamp-2 ${
                                  isLight ? 'text-[#475569]' : 'text-slate-200'
                                }`}>
                                  {study.title}
                                </p>
                              </div>

                              <a
                                href={study.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={`p-1 rounded-md transition-colors shrink-0 ${
                                  isLight
                                    ? 'text-[#526661] hover:text-[#475569] hover:bg-[#EFF3F0]'
                                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                                }`}
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
            <div className={`pt-2 border-t space-y-2 ${isLight ? 'border-[#E1E8E3]' : 'border-purple-500/20'}`}>
              <button
                type="button"
                onClick={() => setShowNeutralVectors(!showNeutralVectors)}
                className={`w-full flex items-center justify-between text-[10px] uppercase font-bold tracking-wider py-1 cursor-pointer select-none transition-colors ${
                  isLight ? 'text-[#526661] hover:text-[#475569]' : 'text-purple-300 hover:text-purple-200'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <ShieldAlert size={12} className={isLight ? 'text-[#526661]' : 'text-slate-400'} />
                  <span>Non-Targeted / Neutral Vectors ({report.neutralVectors.length})</span>
                </span>
                <span className={`text-[10px] font-mono lowercase font-normal flex items-center gap-1 ${
                  isLight ? 'text-[#6E7E78]' : 'text-slate-400'
                }`}>
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
                        className={`p-2.5 rounded-xl border space-y-1.5 ${
                          isLight ? 'bg-[#EFF3F0] border-[#E1E8E3]' : 'bg-black/40 border-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="shrink-0 opacity-70">
                              <LongevityVectorIcon vector={nv.outcomeId} size={15} glow={false} />
                            </div>
                            <span className={`text-[11px] font-semibold truncate ${
                              isLight ? 'text-[#475569]' : 'text-slate-300'
                            }`}>
                              {nv.outcomeName}
                            </span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-medium border shrink-0 ${
                            isLight
                              ? 'bg-white text-[#526661] border-[#E1E8E3]'
                              : 'bg-white/5 text-slate-400 border-white/10'
                          }`}>
                            Neutral
                          </span>
                        </div>
                        <p className={`text-[10px] leading-snug ${
                          isLight ? 'text-[#526661]' : 'text-slate-400/90'
                        }`}>
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
            <div className={`pt-2 border-t space-y-2 ${isLight ? 'border-[#E1E8E3]' : 'border-white/10'}`}>
              <span className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 ${
                isLight ? 'text-[#526661]' : 'text-purple-300'
              }`}>
                <Layers size={12} className={isLight ? 'text-[#6954C8]' : 'text-purple-400'} />
                <span>Rescued Hallmarks of Aging (López-Otín Framework)</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {report.hallmarks.map((h, hIdx) => {
                  const hId = resolveHallmarkId(h.name)
                  return (
                    <div 
                      key={hIdx}
                      className={`p-2.5 rounded-xl border space-y-1 ${
                        isLight
                          ? 'bg-[#F0EDFB]/60 border-[#6954C8]/30'
                          : 'bg-purple-950/40 border-purple-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="shrink-0">
                            <HallmarkOfAgingIcon hallmark={hId} size={20} glow={!isLight} />
                          </div>
                          <span className={`text-[11px] font-extrabold truncate ${
                            isLight ? 'text-[#475569]' : 'text-white'
                          }`}>
                            {h.name}
                          </span>
                        </div>
                        {h.pmid && (
                          <a
                            href={h.url || `https://pubmed.ncbi.nlm.nih.gov/${h.pmid}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`text-[9px] font-mono flex items-center gap-0.5 shrink-0 ${
                              isLight ? 'text-[#6954C8] hover:underline' : 'text-purple-300 hover:underline'
                            }`}
                          >
                            <span>PMID:{h.pmid}</span>
                            <ExternalLink size={9} />
                          </a>
                        )}
                      </div>
                      {h.mechanism && (
                        <p className={`text-[10px] leading-relaxed ${
                          isLight ? 'text-[#526661]' : 'text-slate-300/80'
                        }`}>
                          {h.mechanism}
                        </p>
                      )}
                    </div>
                  )
                })}
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
