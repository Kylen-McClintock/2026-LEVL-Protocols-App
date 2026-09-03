'use client'

import React from 'react'
import { 
  X, 
  Sparkles, 
  ExternalLink, 
  Clock, 
  Activity, 
  Thermometer, 
  Dumbbell, 
  HeartPulse, 
  Zap, 
  CheckCircle2, 
  BookOpen, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react'
import { ModalityMechanismDetail } from '@/lib/calendar/pulseOptimizationEngine'

interface ModalityMechanismModalProps {
  isOpen: boolean
  onClose: () => void
  detail: ModalityMechanismDetail | null
}

export default function ModalityMechanismModal({
  isOpen,
  onClose,
  detail
}: ModalityMechanismModalProps) {
  if (!isOpen || !detail) return null

  const isGrowth = detail.mode === 'growth'
  const isRecovery = detail.mode === 'recovery'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-gradient-to-r ${
          isGrowth 
            ? 'from-purple-950/60 via-slate-900 to-indigo-950/50' 
            : isRecovery 
            ? 'from-emerald-950/60 via-slate-900 to-teal-950/50' 
            : 'from-slate-900 via-slate-800 to-slate-900'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              isGrowth
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                : isRecovery
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            }`}>
              {isGrowth ? <Dumbbell size={22} /> : isRecovery ? <HeartPulse size={22} /> : <Activity size={22} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-tight">
                  {detail.name}
                </h2>
                <span className={`text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full border uppercase ${
                  isGrowth
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : isRecovery
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}>
                  {detail.modeLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {detail.headline}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Scroll Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Key Molecular Signaling Targets Chips */}
          {detail.keySignalingTargets && detail.keySignalingTargets.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                Primary Physiological Pathways:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {detail.keySignalingTargets.map((target, idx) => (
                  <span
                    key={idx}
                    className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                      isGrowth
                        ? 'bg-purple-950/40 text-purple-200 border-purple-500/30'
                        : isRecovery
                        ? 'bg-emerald-950/40 text-emerald-200 border-emerald-500/30'
                        : 'bg-white/5 text-slate-200 border-white/10'
                    }`}
                  >
                    <Zap size={10} className={isGrowth ? "text-purple-400" : "text-emerald-400"} />
                    <span>{target}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section 1: HOW & WHY IT WORKS (Molecular Mechanism) */}
          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className={isGrowth ? "text-purple-400" : "text-emerald-400"} />
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-white">
                How &amp; Why It Effects {isGrowth ? 'Growth' : isRecovery ? 'Recovery' : 'Biological Performance'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {detail.molecularMechanism}
            </p>
          </div>

          {/* Section 2: WHY THIS EXACT TIMING MATTERS (Circadian Alignment) */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-cyan-400" />
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-white">
                Circadian Rhythm &amp; Timing Rationale
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {detail.circadianTimingRationale}
            </p>
          </div>

          {/* Section 3: ROLE IN MODE ONSET & CONCLUSION (If applicable) */}
          {detail.kickoffOrEndingRole && (
            <div className={`p-4 rounded-2xl border space-y-2 ${
              isGrowth
                ? 'bg-purple-950/30 border-purple-500/40'
                : 'bg-emerald-950/30 border-emerald-500/40'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-sm">⚡</span>
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-white">
                  Role in Mode Kick-Off / Conclusion
                </h3>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {detail.kickoffOrEndingRole}
              </p>
            </div>
          )}

          {/* Section 4: MANDATORY DOSING & PROTOCOL PARAMETERS */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Verified Protocol Parameters:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
                  {detail.temperature && <Thermometer size={11} className="text-cyan-400" />}
                  <span>{detail.temperature ? 'Dose & Temperature' : 'Exact Dose / Exposure'}</span>
                </span>
                <span className="font-semibold text-white block">
                  {detail.temperature ? `${detail.temperature} • ${detail.exactDoseOrExposure}` : detail.exactDoseOrExposure}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                  Duration &amp; Frequency
                </span>
                <span className="font-semibold text-white block">
                  {detail.durationAndFrequency}
                </span>
              </div>
            </div>

            {detail.synergyNotes && (
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-300">
                <strong className="text-slate-200">Synergy &amp; Administration: </strong>
                <span>{detail.synergyNotes}</span>
              </div>
            )}
          </div>

          {/* Section 5: PEER-REVIEWED RESEARCH CITATION */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-slate-400 min-w-0">
              <BookOpen size={14} className="text-cyan-400 shrink-0" />
              <span className="truncate">{detail.citationText}</span>
            </div>

            {detail.pubMedUrl && (
              <a
                href={detail.pubMedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shrink-0"
              >
                <span>View PubMed (PMID: {detail.pmid})</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Close Insight
          </button>
        </div>
      </div>
    </div>
  )
}
