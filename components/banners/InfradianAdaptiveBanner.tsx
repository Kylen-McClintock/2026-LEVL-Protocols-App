'use client'

import React, { useState } from 'react'
import {
  Heart,
  Droplets,
  Zap,
  Sparkles,
  ShieldAlert,
  Plus,
  Edit2,
  ChevronDown,
  ChevronUp,
  Activity,
  Flame,
  CheckCircle2,
  Moon,
  Sun,
  Thermometer,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react'
import { InfradianStatus, InfradianProtocolModification, UserProfile } from '@/lib/types'
import PeriodFlowLoggerModal from '@/components/modals/PeriodFlowLoggerModal'

interface InfradianAdaptiveBannerProps {
  status: InfradianStatus | null
  localUserId: string
  userProfile: UserProfile | null
  targetDate?: string
  onAddModalityToToday?: (modalityName: string) => void
  onStatusUpdated?: (newStatus: InfradianStatus | null) => void
}

export function InfradianAdaptiveBanner({
  status,
  localUserId,
  userProfile,
  targetDate,
  onAddModalityToToday,
  onStatusUpdated
}: InfradianAdaptiveBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  if (!status || !status.enabled) return null

  const isMenstrual = status.currentPhase === 'menstrual'
  const isFollicular = status.currentPhase === 'follicular'
  const isOvulatory = status.currentPhase === 'ovulatory'
  const isLuteal = status.currentPhase === 'early_luteal' || status.currentPhase === 'late_luteal'

  const themeBorder = isMenstrual
    ? 'border-rose-500/40'
    : isFollicular
    ? 'border-cyan-500/40'
    : isOvulatory
    ? 'border-emerald-500/40'
    : 'border-purple-500/40'

  const themeBg = isMenstrual
    ? 'from-rose-950/30 via-slate-950/80 to-slate-950'
    : isFollicular
    ? 'from-cyan-950/30 via-slate-950/80 to-slate-950'
    : isOvulatory
    ? 'from-emerald-950/30 via-slate-950/80 to-slate-950'
    : 'from-purple-950/30 via-slate-950/80 to-slate-950'

  const phaseBadgeColor = isMenstrual
    ? 'bg-rose-950/80 text-rose-300 border-rose-800'
    : isFollicular
    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
    : isOvulatory
    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
    : 'bg-purple-950/80 text-purple-300 border-purple-800'

  return (
    <>
      <div className={`rounded-3xl border ${themeBorder} bg-gradient-to-br ${themeBg} p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-3.5 transition-all text-white`}>
        {/* Banner Top Row */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-slate-900 border-white/10 text-slate-300 flex items-center gap-1.5">
                <span>🌙</span> Infradian Cycle Optimization
              </span>

              <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${phaseBadgeColor}`}>
                {status.phaseName} · Day {status.cycleDay} of {status.cycleLength}
              </span>

              {status.isPeriodExpectedSoon && !status.isPeriodActive && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                  Period Expected Soon (~{status.daysUntilNextPeriod}d)
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              {status.phaseDescription}
            </p>
          </div>

          {/* Quick Action Button: Log / Edit Period Flow */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 size={12} />
              <span>{status.todayLog?.is_period_day ? 'Edit Period Flow' : '+ Log Period / Flow'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label="Toggle details"
              className="p-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Collapsible Details & Protocol Modifications */}
        {isExpanded && (
          <div className="space-y-3 pt-1 border-t border-white/10 text-xs animate-in fade-in">
            {/* Hormonal & Biomarker Baseline Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5 space-y-0.5">
                <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Estrogen Level</span>
                <span className="font-bold text-slate-200 capitalize font-mono">{status.hormonalProfile.estrogen}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5 space-y-0.5">
                <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Progesterone Level</span>
                <span className="font-bold text-slate-200 capitalize font-mono">{status.hormonalProfile.progesterone}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5 space-y-0.5">
                <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Basal Core Temp</span>
                <span className="font-bold text-emerald-400 font-mono">{status.hormonalProfile.basalBodyTempOffset}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5 space-y-0.5">
                <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">HRV Expected Baseline</span>
                <span className="font-bold text-purple-300 font-mono">{status.hormonalProfile.hrvBaselineOffset}</span>
              </div>
            </div>

            {/* Today's Logged Flow / Pain Note */}
            {status.todayLog?.is_period_day && (
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <Droplets size={13} /> Flow: <strong className="capitalize">{status.todayLog.flow_level}</strong>
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Zap size={13} /> Pain Level: <strong>{status.todayLog.pain_level}/3</strong>
                  </span>
                  {status.todayLog.symptoms?.length > 0 && (
                    <>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-300 text-[11px]">
                        Symptoms: {status.todayLog.symptoms.join(', ')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Intelligent Protocol Additions / Modifications Section */}
            {status.protocolModifications.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Sparkles size={12} className="text-purple-400" />
                  Intelligent Protocol Modifications for Today:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {status.protocolModifications.map((mod) => (
                    <div
                      key={mod.id}
                      className={`p-3 rounded-2xl border flex flex-col justify-between space-y-2 shadow-sm ${
                        mod.type === 'caution'
                          ? 'bg-rose-950/40 border-rose-500/40'
                          : mod.type === 'boost'
                          ? 'bg-cyan-950/40 border-cyan-500/40'
                          : mod.type === 'add'
                          ? 'bg-purple-950/40 border-purple-500/40'
                          : 'bg-amber-950/40 border-amber-500/40'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <h5 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                            {mod.type === 'caution' ? (
                              <AlertTriangle size={13} className="text-rose-400 shrink-0" />
                            ) : mod.type === 'boost' ? (
                              <Zap size={13} className="text-cyan-400 shrink-0" />
                            ) : mod.type === 'add' ? (
                              <Plus size={13} className="text-purple-400 shrink-0" />
                            ) : (
                              <Activity size={13} className="text-amber-400 shrink-0" />
                            )}
                            {mod.title}
                          </h5>

                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900/80 border border-white/10 text-slate-300">
                            {mod.badgeText}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {mod.reason}
                        </p>
                      </div>

                      {/* 1-Click Add Action if applicable */}
                      {mod.type === 'add' && mod.suggestedModalityName && onAddModalityToToday && (
                        <div className="pt-1 flex items-center justify-between border-t border-white/5 text-[11px]">
                          <span className="text-purple-300 font-mono text-[10px]">
                            {mod.suggestedAction}
                          </span>
                          <button
                            type="button"
                            onClick={() => onAddModalityToToday(mod.suggestedModalityName!)}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={11} />
                            <span>Add to Today</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logger Modal */}
      <PeriodFlowLoggerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        localUserId={localUserId}
        userProfile={userProfile}
        targetDate={targetDate}
        onSaved={onStatusUpdated}
      />
    </>
  )
}
