'use client'

import React, { useState } from 'react'
import {
  X,
  Microscope,
  TrendingUp,
  Coins,
  Gauge,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  Target,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react'
import { Modality } from '@/lib/types'
import { modalityReferences } from '@/lib/data/references'
import { getEffortMetadata, getCostMetadata } from '@/lib/ranking/adaptiveRecommendationEngine'
import { getEvidenceQualityDetail, EvidenceQualityDetail } from '@/lib/utils/evidenceQuality'
import { getSafeEfficacyStats } from '@/lib/utils/efficacyStats'
import { useTheme } from '@/lib/utils/useTheme'

export type GeekMetricType = 'evidence' | 'effect_size' | 'cost' | 'effort'

interface GeekMetricExplanationModalProps {
  isOpen: boolean
  onClose: () => void
  initialMetric?: GeekMetricType
  modality: Modality
}

export default function GeekMetricExplanationModal({
  isOpen,
  onClose,
  initialMetric = 'evidence',
  modality
}: GeekMetricExplanationModalProps) {
  const { isLight } = useTheme()
  const [activeMetric, setActiveMetric] = useState<GeekMetricType>(initialMetric)

  // Sync state if initialMetric changes while open
  React.useEffect(() => {
    if (initialMetric) {
      setActiveMetric(initialMetric)
    }
  }, [initialMetric])

  if (!isOpen) return null

  const refs = modality.scientific_references && modality.scientific_references.length > 0
    ? modality.scientific_references
    : modalityReferences[modality.id] || []

  const evidenceDetail: EvidenceQualityDetail = getEvidenceQualityDetail(modality.evidence_quality, refs.length)
  const effortMeta = getEffortMetadata(modality)
  const costMeta = getCostMetadata(modality.cost_tier)
  const safeStats = getSafeEfficacyStats(modality)

  // Extract any biomarker tags from functional impacts or modality outcomes
  const biomarkerList: string[] = []
  if (modality.functional_impacts && typeof modality.functional_impacts === 'object') {
    Object.values(modality.functional_impacts).forEach((impact: any) => {
      if (Array.isArray(impact?.biomarkers)) {
        impact.biomarkers.forEach((bm: string) => {
          if (!biomarkerList.includes(bm)) biomarkerList.push(bm)
        })
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`relative z-10 w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col ${
        isLight
          ? 'bg-white border-[#E1E8E3] text-[#475569]'
          : 'bg-slate-950 border-slate-800 text-white'
      }`}>
        {/* Background glow accents based on active metric */}
        {activeMetric === 'evidence' && (
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        )}
        {activeMetric === 'effect_size' && (
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        )}
        {activeMetric === 'cost' && (
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        )}
        {activeMetric === 'effort' && (
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        )}

        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-start justify-between gap-3 shrink-0 ${
          isLight ? 'border-[#E1E8E3] bg-[#F8FAF9]' : 'border-white/10 bg-slate-900/60'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                isLight ? 'text-[#6954C8]' : 'text-purple-400'
              }`}>
                Geek Mode • Scientific Transparency
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                isLight ? 'bg-[#E1E8E3] text-[#526661]' : 'bg-white/10 text-slate-300'
              }`}>
                {modality.display_name || modality.name}
              </span>
            </div>
            <h2 className={`text-lg sm:text-xl font-black mt-1 ${isLight ? 'text-[#1E293B]' : 'text-white'}`}>
              {activeMetric === 'evidence' && 'Evidence Quality & Clinical Rubric'}
              {activeMetric === 'effect_size' && 'Effect Size & Biomarker Magnitude'}
              {activeMetric === 'cost' && 'Daily Cost & Financial Tiering'}
              {activeMetric === 'effort' && 'Effort, Friction & Discipline Level'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors ${
              isLight
                ? 'bg-white border-[#E1E8E3] text-[#526661] hover:bg-[#EFF3F0]'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Metric Selector Tabs */}
        <div className={`flex border-b p-1.5 gap-1 shrink-0 overflow-x-auto ${
          isLight ? 'border-[#E1E8E3] bg-[#EFF3F0]/60' : 'border-white/10 bg-slate-900/40'
        }`}>
          <button
            type="button"
            onClick={() => setActiveMetric('evidence')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMetric === 'evidence'
                ? isLight
                  ? 'bg-white text-[#6954C8] shadow-sm border border-[#6954C8]/30'
                  : 'bg-purple-950/80 text-purple-200 shadow-md border border-purple-500/50'
                : isLight
                ? 'text-[#526661] hover:text-[#1E293B] hover:bg-white/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Microscope size={14} className={activeMetric === 'evidence' ? (isLight ? 'text-[#6954C8]' : 'text-purple-400') : ''} />
            <span>Evidence</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
              isLight ? 'bg-[#F0EDFB] text-[#6954C8]' : 'bg-purple-500/20 text-purple-300'
            }`}>
              {evidenceDetail.compactScore}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMetric('effect_size')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMetric === 'effect_size'
                ? isLight
                  ? 'bg-white text-[#0891B2] shadow-sm border border-[#0891B2]/30'
                  : 'bg-cyan-950/80 text-cyan-200 shadow-md border border-cyan-500/50'
                : isLight
                ? 'text-[#526661] hover:text-[#1E293B] hover:bg-white/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp size={14} className={activeMetric === 'effect_size' ? (isLight ? 'text-[#0891B2]' : 'text-cyan-400') : ''} />
            <span>Effect Size</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded capitalize ${
              isLight ? 'bg-[#ECFEFF] text-[#0891B2]' : 'bg-cyan-500/20 text-cyan-300'
            }`}>
              {modality.effect_size_estimate || 'Medium'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMetric('cost')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMetric === 'cost'
                ? isLight
                  ? 'bg-white text-[#2B725C] shadow-sm border border-[#2B725C]/30'
                  : 'bg-emerald-950/80 text-emerald-200 shadow-md border border-emerald-500/50'
                : isLight
                ? 'text-[#526661] hover:text-[#1E293B] hover:bg-white/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Coins size={14} className={activeMetric === 'cost' ? (isLight ? 'text-[#2B725C]' : 'text-emerald-400') : ''} />
            <span>Daily Cost</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
              isLight ? 'bg-[#E6F3EB] text-[#2B725C]' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {costMeta.shortLabel}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMetric('effort')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMetric === 'effort'
                ? isLight
                  ? 'bg-white text-[#D97706] shadow-sm border border-[#D97706]/30'
                  : 'bg-amber-950/80 text-amber-200 shadow-md border border-amber-500/50'
                : isLight
                ? 'text-[#526661] hover:text-[#1E293B] hover:bg-white/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Gauge size={14} className={activeMetric === 'effort' ? (isLight ? 'text-[#D97706]' : 'text-amber-400') : ''} />
            <span>Effort &amp; Time</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${effortMeta.badgeColor}`}>
              Lvl {effortMeta.level}
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm leading-relaxed">
          {/* ========================================================
              TAB 1: EVIDENCE QUALITY
             ======================================================== */}
          {activeMetric === 'evidence' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Hero Score Breakdown Box */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                isLight ? 'bg-[#F0EDFB]/60 border-[#6954C8]/30' : 'bg-purple-950/30 border-purple-500/30'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                      isLight ? 'text-[#6954C8]' : 'text-purple-300'
                    }`}>
                      Clinical Evidence Score
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl sm:text-4xl font-black font-mono ${
                        isLight ? 'text-[#1E293B]' : 'text-white'
                      }`}>
                        {evidenceDetail.score}
                      </span>
                      <span className={`text-base font-bold ${isLight ? 'text-[#6E7E78]' : 'text-slate-400'}`}>
                        / 100
                      </span>
                      <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                        isLight ? evidenceDetail.badgeColorLight : evidenceDetail.badgeColorDark
                      }`}>
                        {evidenceDetail.grade}
                      </span>
                    </div>
                  </div>

                  <div className={`sm:text-right text-xs ${isLight ? 'text-[#526661]' : 'text-slate-300'}`}>
                    <div className="font-bold flex items-center sm:justify-end gap-1.5">
                      <ShieldCheck size={14} className={isLight ? 'text-[#6954C8]' : 'text-purple-400'} />
                      <span>{evidenceDetail.tier}</span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isLight ? 'text-[#6E7E78]' : 'text-slate-400'}`}>
                      {refs.length} verified scientific citations linked
                    </p>
                  </div>
                </div>

                <p className={`text-xs mt-3 pt-3 border-t leading-relaxed ${
                  isLight ? 'border-[#6954C8]/20 text-[#475569]' : 'border-purple-500/20 text-purple-100/90'
                }`}>
                  {evidenceDetail.description}
                </p>
              </div>

              {/* What does the score mean? (Direct User Clarity) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Info size={15} className={isLight ? 'text-[#6954C8]' : 'text-purple-400'} />
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${
                    isLight ? 'text-[#1E293B]' : 'text-white'
                  }`}>
                    How LEVL Scores Evidence (0–100 Rubric)
                  </h3>
                </div>
                <p className={`text-xs ${isLight ? 'text-[#526661]' : 'text-slate-300'}`}>
                  Evidence scores in LEVL range from <strong>0 to 100</strong>. They reflect the rigor of published human clinical trials, biomarker measurement accuracy, and peer-reviewed consensus:
                </p>

                {/* Rubric Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className={`p-3 rounded-xl border ${
                    evidenceDetail.score >= 85
                      ? isLight ? 'bg-[#F0EDFB] border-[#6954C8] ring-1 ring-[#6954C8]' : 'bg-purple-900/30 border-purple-400 ring-1 ring-purple-400'
                      : isLight ? 'bg-[#EFF3F0] border-[#E1E8E3]' : 'bg-white/5 border-white/5'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">Grade A (85–100)</span>
                      {evidenceDetail.score >= 85 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">Current</span>
                      )}
                    </div>
                    <p className={`text-[11px] leading-snug ${isLight ? 'text-[#526661]' : 'text-slate-300'}`}>
                      Double-blind randomized controlled human trials (RCTs), prospective biomarker endpoints, and meta-analytic replication.
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${
                    evidenceDetail.score >= 70 && evidenceDetail.score < 85
                      ? isLight ? 'bg-[#EFF6FF] border-[#2563EB] ring-1 ring-[#2563EB]' : 'bg-blue-900/30 border-blue-400 ring-1 ring-blue-400'
                      : isLight ? 'bg-[#EFF3F0] border-[#E1E8E3]' : 'bg-white/5 border-white/5'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">Grade B (70–84)</span>
                      {evidenceDetail.score >= 70 && evidenceDetail.score < 85 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold">Current</span>
                      )}
                    </div>
                    <p className={`text-[11px] leading-snug ${isLight ? 'text-[#526661]' : 'text-slate-300'}`}>
                      Controlled clinical cohort trials, translational human studies, or validated physiological responses.
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${
                    evidenceDetail.score >= 50 && evidenceDetail.score < 70
                      ? isLight ? 'bg-[#ECFEFF] border-[#0891B2] ring-1 ring-[#0891B2]' : 'bg-cyan-900/30 border-cyan-400 ring-1 ring-cyan-400'
                      : isLight ? 'bg-[#EFF3F0] border-[#E1E8E3]' : 'bg-white/5 border-white/5'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">Grade C (50–69)</span>
                      {evidenceDetail.score >= 50 && evidenceDetail.score < 70 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">Current</span>
                      )}
                    </div>
                    <p className={`text-[11px] leading-snug ${isLight ? 'text-[#526661]' : 'text-slate-300'}`}>
                      Large-scale prospective observational cohort data (NHANES, UK Biobank), or established cellular mechanism pathways.
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${
                    evidenceDetail.score < 50
                      ? isLight ? 'bg-[#FFFBEB] border-[#D97706] ring-1 ring-[#D97706]' : 'bg-amber-900/30 border-amber-400 ring-1 ring-amber-400'
                      : isLight ? 'bg-[#EFF3F0] border-[#E1E8E3]' : 'bg-white/5 border-white/5'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">Grade D (&lt;50)</span>
                      {evidenceDetail.score < 50 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">Current</span>
                      )}
                    </div>
                    <p className={`text-[11px] leading-snug ${isLight ? 'text-[#526661]' : 'text-slate-300'}`}>
                      Emerging preclinical science, animal longevity models (rodents, C. elegans), or early pilot trials awaiting validation.
                    </p>
                  </div>
                </div>
              </div>

              {/* What Clinical Literature Supports This Modality */}
              {refs.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className={isLight ? 'text-[#6954C8]' : 'text-purple-400'} />
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${
                        isLight ? 'text-[#1E293B]' : 'text-white'
                      }`}>
                        Primary Literature &amp; PubMed Citations ({refs.length})
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {refs.slice(0, 4).map((ref: any, idx: number) => (
                      <a
                        key={idx}
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block p-2.5 rounded-xl border transition-colors group ${
                          isLight
                            ? 'bg-[#EFF3F0] hover:bg-[#EAEFEA] border-[#E1E8E3]'
                            : 'bg-white/5 hover:bg-white/10 border-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold leading-snug flex-1 ${
                            isLight ? 'text-[#1E293B] group-hover:text-[#6954C8]' : 'text-slate-200 group-hover:text-purple-300'
                          }`}>
                            {ref.title}
                          </p>
                          <ExternalLink size={12} className="opacity-40 group-hover:opacity-100 shrink-0 mt-0.5" />
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          {ref.type && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                              isLight ? 'bg-[#E1E8E3] text-[#526661]' : 'bg-white/10 text-slate-300'
                            }`}>
                              {ref.type}
                            </span>
                          )}
                          {ref.pmid && (
                            <span className={`text-[9px] font-mono ${isLight ? 'text-[#6E7E78]' : 'text-slate-400'}`}>
                              PMID: {ref.pmid}
                            </span>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Modality Evidence Summary if present */}
              {modality.evidence_summary && (
                <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  isLight ? 'bg-[#EFF3F0] border-[#E1E8E3] text-[#475569]' : 'bg-slate-900/60 border-white/5 text-slate-300'
                }`}>
                  <span className={`text-[10px] uppercase font-bold tracking-wider block mb-1 ${
                    isLight ? 'text-[#6954C8]' : 'text-purple-300'
                  }`}>
                    Clinical Consensus Summary
                  </span>
                  <p className="whitespace-pre-line">{modality.evidence_summary}</p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 2: EFFECT SIZE
             ======================================================== */}
          {activeMetric === 'effect_size' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Hero Effect Size Box */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                isLight ? 'bg-[#ECFEFF]/60 border-[#0891B2]/30' : 'bg-cyan-950/30 border-cyan-500/30'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                      isLight ? 'text-[#0891B2]' : 'text-cyan-300'
                    }`}>
                      Estimated Effect Magnitude
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl sm:text-3xl font-black capitalize ${
                        isLight ? 'text-[#1E293B]' : 'text-white'
                      }`}>
                        {modality.effect_size_estimate || 'Medium Impact'}
                      </span>
                    </div>
                  </div>

                  <div className={`sm:text-right text-xs ${isLight ? 'text-[#526661]' : 'text-slate-300'}`}>
                    <div className="font-bold flex items-center sm:justify-end gap-1.5">
                      <Target size={14} className={isLight ? 'text-[#0891B2]' : 'text-cyan-400'} />
                      <span>{modality.primary_outcome || 'Clinical Optimization'}</span>
                    </div>
                    {modality.time_to_benefit && (
                      <p className={`text-[11px] mt-0.5 ${isLight ? 'text-[#6E7E78]' : 'text-slate-400'}`}>
                        Onset: {modality.time_to_benefit}
                      </p>
                    )}
                  </div>
                </div>

                <p className={`text-xs mt-3 pt-3 border-t leading-relaxed ${
                  isLight ? 'border-[#0891B2]/20 text-[#475569]' : 'border-cyan-500/20 text-cyan-100/90'
                }`}>
                  Clinical Effect Size measures the statistical and physiological magnitude of shift (Cohen&apos;s <em>d</em> or percentage delta) produced in targeted biomarkers relative to control.
                </p>
              </div>

              {/* Effect Size Clinical Scale */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Info size={15} className={isLight ? 'text-[#0891B2]' : 'text-cyan-400'} />
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${
                    isLight ? 'text-[#1E293B]' : 'text-white'
                  }`}>
                    Clinical Effect Size Benchmark Rubric
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className={`p-3 rounded-xl border ${
                    (modality.effect_size_estimate || '').toLowerCase().includes('large') || (modality.effect_size_estimate || '').toLowerCase().includes('high')
                      ? isLight ? 'bg-[#ECFEFF] border-[#0891B2] ring-1 ring-[#0891B2]' : 'bg-cyan-900/30 border-cyan-400 ring-1 ring-cyan-400'
                      : isLight ? 'bg-[#EFF3F0] border-[#E1E8E3]' : 'bg-white/5 border-white/5'
                  }`}>
                    <div className="font-bold text-xs mb-1">Large (Cohen&apos;s d &gt; 0.8)</div>
                    <p className={`text-[11px] leading-snug ${isLight ? 'text-[#526661]' : 'text-slate-300'}`}>
                      &gt;20% biomarker shift vs control. Anchor interventions that rapidly alter systemic physiology (e.g. VO2 max, Rapamycin, Fasting).
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${
                    !(modality.effect_size_estimate || '').toLowerCase().includes('large') && !(modality.effect_size_estimate || '').toLowerCase().includes('small')
                      ? isLight ? 'bg-[#ECFEFF] border-[#0891B2] ring-1 ring-[#0891B2]' : 'bg-cyan-900/30 border-cyan-400 ring-1 ring-cyan-400'
                      : isLight ? 'bg-[#EFF3F0] border-[#E1E8E3]' : 'bg-white/5 border-white/5'
                  }`}>
                    <div className="font-bold text-xs mb-1">Medium (Cohen&apos;s d 0.4–0.8)</div>
                    <p className={`text-[11px] leading-snug ${isLight ? 'text-[#526661]' : 'text-slate-300'}`}>
                      10–20% biomarker modulation. Predictable clinical improvements in target endpoints (e.g. Creatine, Sauna HSP70, Sleep consistency).
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${
                    (modality.effect_size_estimate || '').toLowerCase().includes('small')
                      ? isLight ? 'bg-[#ECFEFF] border-[#0891B2] ring-1 ring-[#0891B2]' : 'bg-cyan-900/30 border-cyan-400 ring-1 ring-cyan-400'
                      : isLight ? 'bg-[#EFF3F0] border-[#E1E8E3]' : 'bg-white/5 border-white/5'
                  }`}>
                    <div className="font-bold text-xs mb-1">Small (Cohen&apos;s d 0.2–0.4)</div>
                    <p className={`text-[11px] leading-snug ${isLight ? 'text-[#526661]' : 'text-slate-300'}`}>
                      5–10% cumulative shift. Foundational lifestyle baselines and micro-nutrients that protect against subclinical decay.
                    </p>
                  </div>
                </div>
              </div>

              {/* Target Biomarkers */}
              {biomarkerList.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Target size={14} className={isLight ? 'text-[#0891B2]' : 'text-cyan-400'} />
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${
                      isLight ? 'text-[#1E293B]' : 'text-white'
                    }`}>
                      Targeted Clinical Biomarkers ({biomarkerList.length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {biomarkerList.map((bm, i) => (
                      <span
                        key={i}
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl border ${
                          isLight
                            ? 'bg-[#ECFEFF] border-[#0891B2]/30 text-[#0891B2]'
                            : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-200'
                        }`}
                      >
                        {bm}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Efficacy Stats if available */}
              {safeStats.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className={isLight ? 'text-[#D97706]' : 'text-amber-400'} />
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${
                      isLight ? 'text-[#1E293B]' : 'text-white'
                    }`}>
                      Quantified Clinical Findings
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {safeStats.map((stat, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border ${
                          isLight ? 'bg-[#FFFBEB] border-[#D97706]/30' : 'bg-amber-950/20 border-amber-500/30'
                        }`}
                      >
                        <p className={`text-xs italic leading-relaxed ${isLight ? 'text-[#475569]' : 'text-slate-200'}`}>
                          &ldquo;{stat.fact}&rdquo;
                        </p>
                        {stat.source && (
                          <p className={`text-[10px] mt-1 text-right font-medium ${isLight ? 'text-[#526661]' : 'text-slate-400'}`}>
                            — {stat.source}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 3: DAILY COST
             ======================================================== */}
          {activeMetric === 'cost' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Hero Cost Box */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                isLight ? 'bg-[#E6F3EB]/60 border-[#2B725C]/30' : 'bg-emerald-950/30 border-emerald-500/30'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                      isLight ? 'text-[#2B725C]' : 'text-emerald-300'
                    }`}>
                      Daily Protocol Cost
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl sm:text-3xl font-black ${
                        isLight ? 'text-[#1E293B]' : 'text-white'
                      }`}>
                        {costMeta.dailyEstimate}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${costMeta.badgeColor}`}>
                        {costMeta.shortLabel}
                      </span>
                    </div>
                  </div>

                  <div className={`sm:text-right text-xs ${isLight ? 'text-[#526661]' : 'text-slate-300'}`}>
                    <div className="font-bold flex items-center sm:justify-end gap-1.5">
                      <Coins size={14} className={isLight ? 'text-[#2B725C]' : 'text-emerald-400'} />
                      <span>Tier {costMeta.score} of 4</span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isLight ? 'text-[#6E7E78]' : 'text-slate-400'}`}>
                      {costMeta.score === 0 ? 'Zero ongoing consumable cost' : 'Estimated recurring cost'}
                    </p>
                  </div>
                </div>

                <p className={`text-xs mt-3 pt-3 border-t leading-relaxed ${
                  isLight ? 'border-[#2B725C]/20 text-[#475569]' : 'border-emerald-500/20 text-emerald-100/90'
                }`}>
                  Daily cost estimates the ongoing financial expenditure required for sustained adherence, distinguishing free natural physiology from basic pantry staples, specialized molecules, and clinical therapies.
                </p>
              </div>

              {/* 5-Tier Financial Scale */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Info size={15} className={isLight ? 'text-[#2B725C]' : 'text-emerald-400'} />
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${
                    isLight ? 'text-[#1E293B]' : 'text-white'
                  }`}>
                    LEVL 5-Tier Protocol Cost Scale
                  </h3>
                </div>

                <div className="space-y-2 pt-1">
                  {[
                    { score: 0, label: 'Free ($0 / day)', desc: 'Zero equipment or consumable cost (e.g. morning sunlight, fasting, box breathing, sleep timing, cold showers).' },
                    { score: 1, label: 'Low (< $1 / day)', desc: 'Foundational micronutrients & staples (e.g. Vitamin D3/K2, Glycine, Magnesium, Creatine, Table salt).' },
                    { score: 2, label: 'Moderate ($1–$3 / day)', desc: 'Specialized daily longevity compounds or standard gym access (e.g. NMN, Sulforaphane, Spermidine, EVOO).' },
                    { score: 3, label: 'High ($3–$10 / day)', desc: 'Patented molecules, sensors, or hardware (e.g. Continuous Glucose Monitors, Urolithin A / Mitopure, Ca-AKG).' },
                    { score: 4, label: 'Premium ($10+ / day)', desc: 'Clinical therapies, subcutaneous peptides, HBOT chambers, or advanced clinical biomarker panels.' }
                  ].map((tier) => (
                    <div
                      key={tier.score}
                      className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                        costMeta.score === tier.score
                          ? isLight ? 'bg-[#E6F3EB] border-[#2B725C] ring-1 ring-[#2B725C]' : 'bg-emerald-950/60 border-emerald-400 ring-1 ring-emerald-400'
                          : isLight ? 'bg-[#EFF3F0] border-[#E1E8E3]' : 'bg-white/5 border-white/5'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-xs">{tier.label}</span>
                          {costMeta.score === tier.score && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">This Modality</span>
                          )}
                        </div>
                        <p className={`text-[11px] leading-snug ${isLight ? 'text-[#526661]' : 'text-slate-300'}`}>
                          {tier.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: EFFORT & TIME
             ======================================================== */}
          {activeMetric === 'effort' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Hero Effort Box */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                isLight ? 'bg-[#FFFBEB]/60 border-[#D97706]/30' : 'bg-amber-950/30 border-amber-500/30'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                      isLight ? 'text-[#D97706]' : 'text-amber-300'
                    }`}>
                      Execution Discipline &amp; Friction
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl sm:text-3xl font-black ${
                        isLight ? 'text-[#1E293B]' : 'text-white'
                      }`}>
                        Level {effortMeta.level}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${effortMeta.badgeColor}`}>
                        {effortMeta.label}
                      </span>
                    </div>
                  </div>

                  <div className={`sm:text-right text-xs ${isLight ? 'text-[#526661]' : 'text-slate-300'}`}>
                    <div className="font-bold flex items-center sm:justify-end gap-1.5">
                      <Clock size={14} className={isLight ? 'text-[#D97706]' : 'text-amber-400'} />
                      <span>Time: {effortMeta.timeEstimate}</span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isLight ? 'text-[#6E7E78]' : 'text-slate-400'}`}>
                      Frequency: {modality.frequency || 'Daily'}
                    </p>
                  </div>
                </div>

                <p className={`text-xs mt-3 pt-3 border-t leading-relaxed ${
                  isLight ? 'border-[#D97706]/20 text-[#475569]' : 'border-amber-500/20 text-amber-100/90'
                }`}>
                  {effortMeta.description}
                </p>
              </div>

              {/* Friction Factors */}
              {effortMeta.frictionFactors && effortMeta.frictionFactors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className={isLight ? 'text-[#D97706]' : 'text-amber-400'} />
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${
                      isLight ? 'text-[#1E293B]' : 'text-white'
                    }`}>
                      Key Friction &amp; Adherence Drivers
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {effortMeta.frictionFactors.map((ff, i) => (
                      <span
                        key={i}
                        className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
                          isLight
                            ? 'bg-[#FFFBEB] border-[#D97706]/30 text-[#D97706]'
                            : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                        }`}
                      >
                        {ff}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 5-Tier Discipline Scale */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Info size={15} className={isLight ? 'text-[#D97706]' : 'text-amber-400'} />
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${
                    isLight ? 'text-[#1E293B]' : 'text-white'
                  }`}>
                    LEVL 5-Tier Friction &amp; Effort Rubric
                  </h3>
                </div>

                <div className="space-y-2 pt-1">
                  {[
                    { level: 1, label: 'Level 1: Frictionless (0–2 min)', desc: 'Single pill or quick habit, zero setup, negligible cognitive load, instant compliance anywhere.' },
                    { level: 2, label: 'Level 2: Routine (2–10 min)', desc: 'Easily stacked onto meals or morning/evening routines with light preparation.' },
                    { level: 3, label: 'Level 3: Moderate Effort (15–45 min)', desc: 'Dedicated time block, changing into workout clothes, or standard home devices.' },
                    { level: 4, label: 'Level 4: High Hormesis (20–60 min)', desc: 'Intense physical discomfort, gym gear, thermal extreme (cold plunge/sauna), or continuous prep.' },
                    { level: 5, label: 'Level 5: Intensive / Clinical', desc: 'Maximum discipline required, multi-day restriction (72h fasts), peptide reconstitution, or clinical equipment.' }
                  ].map((tier) => (
                    <div
                      key={tier.level}
                      className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                        effortMeta.level === tier.level
                          ? isLight ? 'bg-[#FFFBEB] border-[#D97706] ring-1 ring-[#D97706]' : 'bg-amber-950/60 border-amber-400 ring-1 ring-amber-400'
                          : isLight ? 'bg-[#EFF3F0] border-[#E1E8E3]' : 'bg-white/5 border-white/5'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-xs">{tier.label}</span>
                          {effortMeta.level === tier.level && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">This Modality</span>
                          )}
                        </div>
                        <p className={`text-[11px] leading-snug ${isLight ? 'text-[#526661]' : 'text-slate-300'}`}>
                          {tier.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 shrink-0 ${
          isLight ? 'border-[#E1E8E3] bg-[#F8FAF9]' : 'border-white/10 bg-slate-900/60'
        }`}>
          <div className="text-[11px] opacity-60">
            Click any metric tab above to explore full clinical details
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isLight
                ? 'bg-[#1E293B] text-white hover:bg-black'
                : 'bg-white text-slate-900 hover:bg-slate-200'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
