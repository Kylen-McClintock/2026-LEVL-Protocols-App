import React, { useMemo } from 'react'
import {
  Activity,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  BookOpen,
  UserCheck
} from 'lucide-react'
import { DailyProtocolTask, DailyWellbeingCheckin } from '@/lib/types'
import { analyzePeptideProtocolEffectiveness } from '@/lib/peptides/peptideEffectivenessEngine'

interface Props {
  protocolId: string
  protocolName: string
  tasks: DailyProtocolTask[]
  checkins: DailyWellbeingCheckin[]
  compact?: boolean
}

export default function PeptideEffectivenessCard({
  protocolId,
  protocolName,
  tasks,
  checkins,
  compact = false
}: Props) {
  const report = useMemo(() => {
    return analyzePeptideProtocolEffectiveness(protocolId, protocolName, tasks, checkins)
  }, [protocolId, protocolName, tasks, checkins])

  const isCollectingBaseline = report.status === 'baseline_collection'

  return (
    <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-black border border-cyan-500/30 p-5 space-y-5 shadow-2xl backdrop-blur-xl">
      {/* Header with Adherence Badge */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Activity size={18} />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black uppercase text-white tracking-wider flex items-center gap-2 flex-wrap">
              <span>N-of-1 Protocol Effectiveness &amp; Biomarkers</span>
              <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider ${
                isCollectingBaseline
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {isCollectingBaseline ? 'Baseline Calibration' : `${report.currentPhase.toUpperCase()} PHASE`}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {isCollectingBaseline
                ? `${report.totalDaysLogged} of ${report.requiredDaysForSignal} doses logged to unlock personalized N-of-1 statistical signal`
                : `Longitudinal analysis across ${report.totalDaysLogged} logged doses (${report.adherencePercent}% protocol adherence)`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Adherence</span>
            <span className="text-sm font-black text-cyan-400 font-mono">
              {report.totalDaysLogged > 0 ? `${report.adherencePercent}%` : 'Not Started'}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar for Initial Calibration */}
      {isCollectingBaseline && (
        <div className="p-3.5 rounded-2xl bg-black/50 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Clock size={13} className="text-cyan-400" />
              <span>N-of-1 Calibration Progress</span>
            </span>
            <span className="text-cyan-400 font-mono font-bold">
              {report.totalDaysLogged} / {report.requiredDaysForSignal} Doses
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (report.totalDaysLogged / report.requiredDaysForSignal) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            As you log your daily doses and morning/evening check-ins, LEVL calculates your actual personal outcome trajectory against your pre-protocol baseline.
          </p>
        </div>
      )}

      {/* Primary Targeted Outcomes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 uppercase font-black tracking-wider flex items-center gap-1.5">
            <BookOpen size={13} className="text-cyan-400" />
            <span>Target Outcomes &amp; Published Literature Benchmarks</span>
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            PubMed Peer-Reviewed Trials
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {report.primaryOutcomes.map((metric) => {
            const hasUserData = metric.baselineAverage !== null && metric.activeCycleAverage !== null
            const isPositive = metric.direction === 'improved'

            return (
              <div
                key={metric.outcomeKey}
                className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white leading-tight">
                      {metric.label}
                    </span>
                  </div>

                  {/* Literature Benchmark Callout */}
                  {metric.literatureBenchmark && (
                    <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-cyan-200/90 leading-snug">
                      <strong className="text-cyan-400 font-bold block mb-0.5">Clinical Benchmark:</strong>
                      <span>{metric.literatureBenchmark}</span>
                    </div>
                  )}
                </div>

                {/* Personal User Result Block */}
                <div className="pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
                    <span>Personal N-of-1 Delta:</span>
                    <span className="font-mono text-slate-500">{metric.confidence}</span>
                  </div>

                  {hasUserData ? (
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-white font-mono">
                          {metric.activeCycleAverage}
                        </span>
                        <span className="text-xs text-slate-400">
                          (Base: {metric.baselineAverage})
                        </span>
                      </div>
                      <span className={`text-xs font-bold font-mono flex items-center gap-0.5 ${
                        isPositive ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        {metric.deltaPercent && metric.deltaPercent > 0 ? `+${metric.deltaPercent}%` : `${metric.deltaPercent}%`}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium py-1">
                      <Clock size={12} className="text-slate-500" />
                      <span>Awaiting Check-in Logs</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Side Effect / Symptom Summary if present */}
      {report.sideEffectSummary.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/25 space-y-2">
          <div className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle size={14} />
            <span>Reported Acute Symptoms</span>
          </div>
          <div className="space-y-1.5">
            {report.sideEffectSummary.map((se) => (
              <div key={se.symptom} className="flex items-center justify-between text-xs text-slate-300">
                <span>• {se.symptom}</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {se.totalOccurrences}x ({se.mostFrequentTiming} • Avg Severity {se.avgSeverity}/5)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Narrative */}
      <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-100/90 leading-relaxed">
        <p className="font-medium">{report.overallSummaryText}</p>
      </div>

      {/* Scientific Disclaimer */}
      <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-500 leading-relaxed">
        <Info size={13} className="shrink-0 mt-0.5 text-slate-400" />
        <span>{report.scientificCaution}</span>
      </div>
    </div>
  )
}
