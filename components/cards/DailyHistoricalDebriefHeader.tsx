'use client'

import React, { useState } from 'react'
import { 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Brain, 
  ChevronDown, 
  ChevronUp, 
  Moon, 
  Sun, 
  Flame, 
  Pill, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  Info,
  ShieldCheck
} from 'lucide-react'
import { DailyEfficacySummary, extractCircadianOutcomeProgression } from '@/lib/data/historicalAnalysis'
import { DailyProtocolTask } from '@/lib/types'
import { getOutcomeColorConfig } from '@/lib/utils/outcomeColors'
import { useTemperatureUnit } from '@/lib/utils/useTemperatureUnit'

interface DailyHistoricalDebriefHeaderProps {
  summary: DailyEfficacySummary
  tasks: DailyProtocolTask[]
  selectedIsolatedOutcome: string | null
  onSelectIsolatedOutcome: (outcomeId: string | null) => void
}

export function DailyHistoricalDebriefHeader({
  summary,
  tasks,
  selectedIsolatedOutcome,
  onSelectIsolatedOutcome
}: DailyHistoricalDebriefHeaderProps) {
  const [showSleepFactors, setShowSleepFactors] = useState(false)
  const { formatText: formatTemp } = useTemperatureUnit()

  const circadianProgression = selectedIsolatedOutcome 
    ? extractCircadianOutcomeProgression(tasks, selectedIsolatedOutcome)
    : []

  const availableOutcomePills = [
    { id: null, label: '🌐 All Outcomes' },
    ...summary.netOutcomeShifts.map(s => ({
      id: s.outcomeId,
      label: s.outcomeName
    }))
  ]

  // If no outcome shifts exist yet, provide standard dimensions
  const finalPills = availableOutcomePills.length > 1 ? availableOutcomePills : [
    { id: null, label: '🌐 All Outcomes' },
    { id: 'focus', label: '🧠 Focus' },
    { id: 'energy', label: '⚡ Energy' },
    { id: 'stress', label: '🧘 Stress' },
    { id: 'sleep_quality', label: '💤 Sleep Quality' }
  ]

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-[0_0_40px_rgba(99,102,241,0.15)] space-y-4 mb-6">
      
      {/* Top Banner: Date Tag & Daily Efficacy Snapshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
              <Clock size={12} /> Historical Daily Debrief
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {summary.dateStr}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Daily Protocol Efficacy & Adherence</span>
          </h2>
        </div>

        {/* Adherence & Sleep Quick Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Adherence Percentage Pill */}
          <div className="bg-emerald-950/60 border border-emerald-500/40 px-3.5 py-2 rounded-xl flex items-center gap-2.5 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center justify-center font-mono font-black text-xs">
              {summary.adherencePercentage}%
            </div>
            <div className="text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block leading-none">
                Stack Adherence
              </span>
              <span className="text-xs font-mono font-bold text-white leading-tight">
                {summary.completedTasks} / {summary.totalTasks} Completed
              </span>
            </div>
          </div>

          {/* Sleep Quality Metric Card */}
          {summary.sleepQualityScore !== undefined && (
            <button
              type="button"
              onClick={() => setShowSleepFactors(!showSleepFactors)}
              className="bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 px-3.5 py-2 rounded-xl flex items-center gap-2.5 text-left transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-400 text-indigo-300 flex items-center justify-center font-mono font-black text-xs">
                {summary.sleepQualityScore}
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 block leading-none flex items-center gap-1">
                  <Moon size={11} /> Sleep Quality
                </span>
                <span className="text-xs text-slate-300 flex items-center gap-1 leading-tight font-medium">
                  Factors {showSleepFactors ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Primary Net Outcome Shifts Row */}
      {summary.netOutcomeShifts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-purple-300">
            <span className="flex items-center gap-1.5">
              <Activity size={13} /> Net Biological Shifts on this Day
            </span>
            <span className="text-slate-400 font-normal">
              ({summary.netOutcomeShifts.length} Tracked Dimensions)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {summary.netOutcomeShifts.slice(0, 4).map(shift => {
              const preCfg = shift.preValue !== undefined ? getOutcomeColorConfig(shift.preValue, shift.directionality) : null
              const postCfg = shift.postValue !== undefined ? getOutcomeColorConfig(shift.postValue, shift.directionality) : null
              const isPositive = shift.avgDelta > 0

              return (
                <div 
                  key={shift.outcomeId}
                  onClick={() => onSelectIsolatedOutcome(selectedIsolatedOutcome === shift.outcomeId ? null : shift.outcomeId)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    selectedIsolatedOutcome === shift.outcomeId
                      ? 'bg-purple-950/60 border-purple-400 ring-2 ring-purple-400/40 shadow-lg'
                      : 'bg-black/50 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-white truncate">{shift.outcomeName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${isPositive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'}`}>
                      {isPositive ? `+${shift.avgDelta}` : shift.avgDelta}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 pt-0.5 border-t border-white/5">
                    <span className="text-slate-400">Baseline ➔ Post:</span>
                    <div className="flex items-center gap-1 font-bold">
                      {shift.preValue !== undefined ? (
                        <span className={`px-1.5 rounded ${preCfg?.badgeBg} ${preCfg?.textColor}`}>
                          {shift.preValue}
                        </span>
                      ) : <span>--</span>}
                      <span className="text-slate-500">➔</span>
                      {shift.postValue !== undefined ? (
                        <span className={`px-1.5 rounded ${postCfg?.badgeBg} ${postCfg?.textColor}`}>
                          {shift.postValue}
                        </span>
                      ) : <span>--</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* AI Daily Efficacy & Biometric Debrief Synthesis */}
      {summary.aiDailyInsight && (
        <div className="bg-gradient-to-br from-indigo-950/70 via-purple-950/40 to-slate-950 border border-indigo-500/40 rounded-2xl p-4 sm:p-5 shadow-[0_0_30px_rgba(99,102,241,0.2)] space-y-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 flex-wrap border-b border-indigo-500/20 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.5)] shrink-0">
                <Brain size={15} className="stroke-[2.5]" />
              </div>
              <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                AI Biometric & Efficacy Debrief
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {summary.aiDailyInsight.synergyTags.map((tag, idx) => (
                <span key={idx} className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm sm:text-base font-black text-indigo-200 tracking-tight flex items-center gap-2">
              {summary.aiDailyInsight.headline}
            </h3>
            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium space-y-2">
              {summary.aiDailyInsight.narrative.split('\n\n').map((para, pIdx) => (
                <p key={pIdx}>{para}</p>
              ))}
            </div>
          </div>

          <div className="p-3 bg-black/60 border border-purple-500/30 rounded-xl flex items-start gap-2.5 shadow-sm">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <p className="text-xs text-purple-200 font-semibold leading-relaxed">
              {summary.aiDailyInsight.keyBioInsight}
            </p>
          </div>
        </div>
      )}

      {/* Outcome Isolator Bar */}
      <div className="pt-2 border-t border-white/10 space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
            <Filter size={13} /> Outcome Isolator Lens:
          </span>
          {selectedIsolatedOutcome && (
            <button
              type="button"
              onClick={() => onSelectIsolatedOutcome(null)}
              className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
            >
              Reset to All Modalities
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {finalPills.map(pill => {
            const isSelected = selectedIsolatedOutcome === pill.id
            return (
              <button
                key={pill.id || 'all'}
                type="button"
                onClick={() => onSelectIsolatedOutcome(pill.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.35)] scale-105'
                    : 'bg-black/40 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{pill.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Circadian Outcome Progression (Visible when an outcome is isolated) */}
      {selectedIsolatedOutcome && (
        <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-purple-200">
            <span className="flex items-center gap-1.5">
              <TrendingUp size={14} className="text-purple-400" />
              <span>Circadian Progression for {finalPills.find(p => p.id === selectedIsolatedOutcome)?.label || selectedIsolatedOutcome}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {circadianProgression.length} Intervention Steps Logged
            </span>
          </div>

          {circadianProgression.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {circadianProgression.map((step, idx) => (
                <div key={idx} className="bg-black/60 border border-white/10 p-2.5 rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-white truncate">{step.modalityName}</span>
                    <span className="font-mono text-indigo-300 bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-500/30">
                      {step.timeStr}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono font-extrabold pt-1">
                    <span className="text-slate-400 text-[10px]">Response:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-300">{step.preValue}</span>
                      <span className="text-slate-500">➔</span>
                      <span className="text-emerald-300">{step.postValue}</span>
                      {step.delta !== undefined && (
                        <span className={`ml-1 text-[11px] ${step.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          ({step.delta >= 0 ? `+${step.delta}` : step.delta})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              No direct pre/post ratings recorded for this specific outcome on this date. Showing all contributing protocol tasks below.
            </p>
          )}
        </div>
      )}

      {/* Sleep Quality Factor Breakdown Drawer */}
      {showSleepFactors && summary.sleepFactors.length > 0 && (
        <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-indigo-300">
            <span className="flex items-center gap-1.5">
              <Moon size={14} className="text-indigo-400" />
              <span>Contributing Sleep Hygiene & Protocol Drivers</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Morning Sleep Score: {summary.sleepQualityScore}/10
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {summary.sleepFactors.map((factor, idx) => (
              <div key={idx} className="bg-black/60 border border-white/10 p-3 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-white text-xs">{factor.factorName}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    factor.status === 'optimal'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {factor.loggedValue}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {factor.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
