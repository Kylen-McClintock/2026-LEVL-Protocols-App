'use client'

import React, { useState } from 'react'
import {
  X,
  Printer,
  Copy,
  Check,
  Dna,
  ShieldCheck,
  Activity,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  FileText,
  User,
  Scale
} from 'lucide-react'
import { PeptideCycleSummary, PeptideBiomarkerCorrelation } from '@/lib/peptides/peptideCycleEngine'
import { NOf1EffectivenessReport } from '@/lib/peptides/peptideEffectivenessEngine'
import { CycleIntelligenceReport } from '@/lib/peptides/peptideCycleIntelligenceEngine'
import { BodyCompositionRecord } from '@/lib/storage/physiqueStorage'
import { format } from 'date-fns'

interface ShareablePeptideReportModalProps {
  isOpen: boolean
  onClose: () => void
  cycles: PeptideCycleSummary[]
  effectivenessReports: NOf1EffectivenessReport[]
  biomarkersByCycle: Record<string, PeptideBiomarkerCorrelation[]>
  bodyRecords?: BodyCompositionRecord[]
  intelligenceReport?: CycleIntelligenceReport | null
  userName?: string
}

export default function ShareablePeptideReportModal({
  isOpen,
  onClose,
  cycles,
  effectivenessReports,
  biomarkersByCycle,
  bodyRecords = [],
  intelligenceReport,
  userName = 'Patient / Protocol Practitioner'
}: ShareablePeptideReportModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const reportDate = format(new Date(), 'MMMM d, yyyy')
  const latestBodyRecord = bodyRecords[0]

  const handlePrint = () => {
    window.print()
  }

  const handleCopySummary = () => {
    const lines = [
      `LEVL CLINICAL PROTOCOL SUMMARY — PEPTIDE CYCLES & BIOMARKERS`,
      `Generated: ${reportDate}`,
      `User / Patient: ${userName}`,
      ``,
      ...(intelligenceReport
        ? [
            `=== CYCLE INTELLIGENCE & STACK OPTIMIZATION ===`,
            `Overall Design Quality: ${intelligenceReport.scores.overallScore}/100 (${intelligenceReport.scores.overallRatingLabel})`,
            `Goal Alignment: ${intelligenceReport.scores.goalAlignmentScore}% | Synergy Score: ${intelligenceReport.scores.synergyScore}% | Evidence: ${intelligenceReport.scores.evidenceScore}% | Measurability: ${intelligenceReport.scores.measurabilityScore}%`,
            `Active Synergies: ${intelligenceReport.synergies.map(s => `${s.compoundA}+${s.compoundB}`).join(', ') || 'None'}`,
            `Complexity: ${intelligenceReport.scores.complexityLabel}`,
            ``
          ]
        : []),
      `=== ACTIVE PEPTIDE & BIOACTIVE PROTOCOLS ===`,
      ...cycles.map(
        c =>
          `• ${c.modalityName} (${c.dosageSpec}, ${c.timingSlot}) | Phase: ${c.phaseLabel} | Adherence: ${c.adherencePct}% | Half-Life: ${c.halfLifeLabel}`
      ),
      ``,
      `=== CORRELATED LAB BIOMARKERS ===`,
      ...Object.entries(biomarkersByCycle).flatMap(([modId, bioms]) =>
        bioms.map(
          b =>
            `• ${b.biomarkerName}: Pre-Cycle: ${b.preCycleBaseline ? `${b.preCycleBaseline.value} ${b.unit}` : 'N/A'} -> Intra-Cycle: ${b.intraCycleActive ? `${b.intraCycleActive.value} ${b.unit}` : 'N/A'} (${b.deltaPercent !== null ? `${b.deltaPercent > 0 ? '+' : ''}${b.deltaPercent}%` : 'Pending'})`
        )
      ),
      ``,
      `=== BODY COMPOSITION SNAPSHOT ===`,
      latestBodyRecord
        ? `Weight: ${latestBodyRecord.weight_lbs || 'N/A'} lbs | Skeletal Muscle: ${latestBodyRecord.skeletal_muscle_mass_pct || 'N/A'}% | Body Fat: ${latestBodyRecord.body_fat_pct || 'N/A'}%`
        : `No body composition records logged`,
      ``,
      `Verified with LEVL Clinical Protocol Engine (N-of-1 Evidence Framework)`
    ]

    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                Shareable Clinical Protocol Report
              </h2>
              <p className="text-[11px] text-slate-400">
                Formatted for Functional Medicine Clinicians &amp; Hormone Specialists
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 border border-white/10 transition-colors"
              title="Copy markdown text summary"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-xs font-bold text-cyan-300 flex items-center gap-1.5 border border-cyan-500/40 transition-colors"
            >
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Report Canvas */}
        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto print:p-0 print:m-0 print:bg-white print:text-black">
          {/* 1. Header & Patient Meta */}
          <div className="flex items-start justify-between border-b border-white/10 pb-6 flex-wrap gap-4 print:border-black">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-black">
                  LEVL CLINICAL SUMMARY
                </span>
                <span className="text-[10px] text-slate-400 font-mono">ID: LEVL-PEP-{Date.now().toString().slice(-6)}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white print:text-black">
                Peptide &amp; Bioactive Cycle Dossier
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 print:text-gray-600">
                Longitudinal Protocol Dosing, Adherence, Correlated Labs &amp; N-of-1 Outcomes
              </p>
            </div>

            <div className="text-right text-xs space-y-1 print:text-black">
              <div className="font-bold text-white print:text-black flex items-center justify-end gap-1.5">
                <User size={13} className="text-cyan-400" />
                <span>{userName}</span>
              </div>
              <div className="text-slate-400 print:text-gray-600 flex items-center justify-end gap-1.5">
                <Calendar size={13} />
                <span>Generated {reportDate}</span>
              </div>
            </div>
          </div>

          {/* Cycle Intelligence Executive Evaluation Banner */}
          {intelligenceReport && (
            <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 text-xs space-y-3 print:border-black print:text-black">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-cyan-400" />
                  <strong className="text-sm font-bold text-white print:text-black">
                    Stack Optimization &amp; Coordination Summary
                  </strong>
                </div>
                <span className="font-mono text-cyan-300 font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30">
                  Quality Score: {intelligenceReport.scores.overallScore}/100 ({intelligenceReport.scores.overallTier})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5 print:border-black">
                  <span className="text-slate-400 block text-[9px] uppercase">Goal Fit</span>
                  <span className="text-white font-bold print:text-black">{intelligenceReport.scores.goalAlignmentScore}%</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5 print:border-black">
                  <span className="text-slate-400 block text-[9px] uppercase">Synergies</span>
                  <span className="text-cyan-300 font-bold print:text-black">{intelligenceReport.synergies.length} Active</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5 print:border-black">
                  <span className="text-slate-400 block text-[9px] uppercase">Evidence</span>
                  <span className="text-emerald-300 font-bold print:text-black">{intelligenceReport.scores.evidenceScore}%</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5 print:border-black">
                  <span className="text-slate-400 block text-[9px] uppercase">Measurability</span>
                  <span className="text-purple-300 font-bold print:text-black">{intelligenceReport.scores.measurabilityScore}%</span>
                </div>
              </div>

              {intelligenceReport.synergies.length > 0 && (
                <div className="text-[11px] text-slate-300 print:text-gray-700">
                  <strong>Synergistic Pairing:</strong>{' '}
                  {intelligenceReport.synergies.map(s => `${s.compoundA} + ${s.compoundB} (${s.headline})`).join(' • ')}
                </div>
              )}
            </div>
          )}

          {/* 2. Active Protocols & Dosing Timetable */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 print:text-black">
              <Dna size={14} className="text-cyan-400" />
              <span>1. Active Protocol Stack &amp; Dosing Specifications</span>
            </h3>

            <div className="rounded-2xl border border-white/10 bg-slate-900/40 overflow-hidden divide-y divide-white/10 print:border-black print:divide-black">
              {cycles.map(cycle => (
                <div key={cycle.modalityId} className="p-4 flex items-start justify-between flex-wrap gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-white print:text-black">
                        {cycle.modalityName}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${cycle.phaseColor}`}>
                        {cycle.phaseLabel}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                        {cycle.regulatoryStatus}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 print:text-gray-700 space-y-0.5">
                      <p>
                        <strong>Dosage:</strong> {cycle.dosageSpec} ({cycle.timingSlot.replace('_', ' ')})
                      </p>
                      <p>
                        <strong>Half-Life:</strong> {cycle.halfLifeLabel} ({cycle.pkConfidence})
                      </p>
                      <p>
                        <strong>Cycle Timeline:</strong> Started {cycle.startDate} | {cycle.activeDaysCompleted} of {cycle.cycleLengthDays} Days Logged
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-1 shrink-0">
                    <div className="text-[11px] font-mono">
                      <span className="text-slate-400">Adherence: </span>
                      <span className="font-black text-cyan-400 print:text-black">{cycle.adherencePct}%</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {cycle.totalDosesCompleted} / {cycle.totalDosesScheduled} Doses Logged
                    </div>
                    {cycle.vialDaysRemaining !== undefined && (
                      <div className="text-[10px] text-amber-400 font-mono">
                        Vial Freshness: ~{cycle.vialDaysRemaining}d remaining
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Correlated Bloodwork & Biomarkers */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 print:text-black">
              <Activity size={14} className="text-emerald-400" />
              <span>2. Correlated Blood Biomarker Trajectories</span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/40 print:border-black">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/80 text-slate-400 text-[10px] font-mono uppercase tracking-wider print:border-black print:text-black">
                    <th className="p-3">Biomarker Target</th>
                    <th className="p-3">Clinical Relevance</th>
                    <th className="p-3">Pre-Cycle Baseline</th>
                    <th className="p-3">Active Intra-Cycle</th>
                    <th className="p-3 text-right">Delta (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 print:divide-black">
                  {Object.entries(biomarkersByCycle).flatMap(([modId, bioms]) =>
                    bioms.map(biom => (
                      <tr key={`${modId}-${biom.biomarkerId}`} className="hover:bg-white/5 print:text-black">
                        <td className="p-3 font-bold text-white print:text-black">
                          {biom.biomarkerName}
                        </td>
                        <td className="p-3 text-slate-400 print:text-gray-600 text-[11px]">
                          {biom.clinicalRelevance}
                        </td>
                        <td className="p-3 font-mono text-slate-300 print:text-black">
                          {biom.preCycleBaseline ? `${biom.preCycleBaseline.value} ${biom.unit}` : '—'}
                          {biom.preCycleBaseline && (
                            <span className="block text-[9px] text-slate-500">{biom.preCycleBaseline.date}</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-300 print:text-black">
                          {biom.intraCycleActive ? `${biom.intraCycleActive.value} ${biom.unit}` : '—'}
                          {biom.intraCycleActive && (
                            <span className="block text-[9px] text-slate-500">{biom.intraCycleActive.date}</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-right font-bold">
                          {biom.deltaPercent !== null ? (
                            <span
                              className={
                                biom.deltaPercent > 0
                                  ? 'text-cyan-400'
                                  : biom.deltaPercent < 0
                                  ? 'text-purple-400'
                                  : 'text-slate-400'
                              }
                            >
                              {biom.deltaPercent > 0 ? `+${biom.deltaPercent}%` : `${biom.deltaPercent}%`}
                            </span>
                          ) : (
                            <span className="text-slate-500">Awaiting Lab</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Body Composition Snapshot */}
          {latestBodyRecord && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 print:text-black">
                <Scale size={14} className="text-purple-400" />
                <span>3. Body Composition &amp; Morphometric Snapshot</span>
              </h3>

              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl border border-white/10 bg-slate-900/40 print:border-black">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Weight</span>
                  <span className="text-base font-black text-white font-mono print:text-black">
                    {latestBodyRecord.weight_lbs ? `${latestBodyRecord.weight_lbs} lbs` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Skeletal Muscle</span>
                  <span className="text-base font-black text-cyan-400 font-mono print:text-black">
                    {latestBodyRecord.skeletal_muscle_mass_pct ? `${latestBodyRecord.skeletal_muscle_mass_pct}%` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Body Fat</span>
                  <span className="text-base font-black text-purple-400 font-mono print:text-black">
                    {latestBodyRecord.body_fat_pct ? `${latestBodyRecord.body_fat_pct}%` : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 5. Clinical Safety, Contraindications & Sign-off */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2 print:border-black print:text-black">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[10px]">
              <AlertTriangle size={14} />
              <span>Clinical Safety &amp; Administration Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/90 print:text-gray-700">
              This report represents tracked patient adherence, pharmacokinetic estimations, and correlated laboratory measurements. It does not replace medical diagnosis. Dosages, titrations, and contraindication profiles should be supervised by a licensed physician.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
