'use client'

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { 
  X, 
  Sparkles, 
  ShieldAlert, 
  Sliders, 
  Layers, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  TrendingUp,
  Info,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { 
  OutcomeOptimizationState, 
  OutcomeTargetConfig,
  evaluateOutcomeStatus
} from '@/lib/outcomes/outcomeOptimizationEngine'
import { UserProfile, DailyProtocolTask } from '@/lib/types'
import { LongevityAnalysisModal } from '@/components/modals/LongevityAnalysisModal'

interface OutcomeOptimizationModalProps {
  isOpen: boolean
  onClose: () => void
  outcomeState: OutcomeOptimizationState | null
  userProfile: UserProfile | null
  todayTasks?: DailyProtocolTask[]
  onUpdateTarget?: (outcomeId: string, newTarget: number, newEffort: number) => void
  onAutoFixClash?: (clashId: string) => void
}

export const OutcomeOptimizationModal: React.FC<OutcomeOptimizationModalProps> = ({
  isOpen,
  onClose,
  outcomeState,
  userProfile,
  todayTasks = [],
  onUpdateTarget,
  onAutoFixClash
}) => {
  if (!isOpen || !outcomeState) return null

  // Local interactive target slider states
  const [localTargetDialedIn, setLocalTargetDialedIn] = useState<number>(outcomeState.targetConfig.targetDialedIn)
  const [localMaxEffort, setLocalMaxEffort] = useState<number>(outcomeState.targetConfig.maxEffortAllowance)
  const [isSavingTarget, setIsSavingTarget] = useState(false)
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false)

  // Live dynamic evaluation as user adjusts sliders
  const liveTargetConfig: OutcomeTargetConfig = {
    targetDialedIn: localTargetDialedIn,
    maxEffortAllowance: localMaxEffort,
    importancePriority: outcomeState.targetConfig.importancePriority
  }

  const liveEvaluation = evaluateOutcomeStatus(
    outcomeState.dialedInScore,
    outcomeState.effortScore,
    liveTargetConfig,
    outcomeState.clashes
  )

  const handleSaveTarget = () => {
    setIsSavingTarget(true)
    if (onUpdateTarget) {
      onUpdateTarget(outcomeState.outcomeId, localTargetDialedIn, localMaxEffort)
    }
    setTimeout(() => {
      setIsSavingTarget(false)
    }, 400)
  }

  return createPortal(
    <div 
      className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div 
        className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4 shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-purple-400" />
                Functional Outcome Optimization
              </span>
              <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold font-mono ${liveEvaluation.badgeBg} ${liveEvaluation.badgeBorder} ${liveEvaluation.badgeText}`}>
                {liveEvaluation.label}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
              {outcomeState.outcomeName}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              type="button"
              onClick={() => setIsAnalysisModalOpen(true)}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              title="View Clinical Analysis & Scoring Calculus"
            >
              <Info size={18} />
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-5 overflow-y-auto pr-1 flex-1 py-1">
          
          {/* Dual Score Metric Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Dialed-In Score */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Dialed-In Score</span>
                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-bold">
                  {outcomeState.percentileRank}th %ile
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {outcomeState.dialedInScore}
                </span>
                <span className="text-xs text-slate-500 font-mono font-bold">/ 100</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    outcomeState.dialedInScore >= 90 ? 'bg-gradient-to-r from-purple-500 to-indigo-400' :
                    outcomeState.dialedInScore >= 75 ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                  style={{ width: `${outcomeState.dialedInScore}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {outcomeState.dialedInScore >= 90 ? 'Elite Power-User Coverage' : outcomeState.dialedInScore >= 75 ? 'Optimal 80/20 Foundation' : 'Baseline / Core Habit'}
              </p>
            </div>

            {/* Effort & Friction Score */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Effort &amp; Cost</span>
                <span className="text-[10px] font-mono text-slate-400">
                  Daily Friction
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-teal-300 tracking-tight">
                  {outcomeState.effortScore}
                </span>
                <span className="text-xs text-slate-500 font-mono font-bold">/ 100</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-400 transition-all duration-500"
                  style={{ width: `${outcomeState.effortScore}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {outcomeState.effortScore > 65 ? 'High Time/Cost Routine' : outcomeState.effortScore > 35 ? 'Moderate Maintenance' : 'Low Friction Lifestyle'}
              </p>
            </div>
          </div>

          {/* Biological Antagonistic Clashes Callout (if active) */}
          {outcomeState.clashes.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 space-y-3">
              <div className="flex items-center gap-2 text-rose-300 font-black text-xs uppercase tracking-wider">
                <ShieldAlert size={16} className="animate-pulse" />
                <span>Biological Antagonistic Clash Detected</span>
              </div>
              {outcomeState.clashes.map(clash => (
                <div key={clash.id} className="space-y-2 text-xs">
                  <h4 className="font-extrabold text-white text-sm">
                    {clash.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-rose-200">
                    <span className="bg-rose-900/60 px-2 py-0.5 rounded border border-rose-500/40">{clash.modalityA.name}</span>
                    <span>⚡ clashes with</span>
                    <span className="bg-rose-900/60 px-2 py-0.5 rounded border border-rose-500/40">{clash.modalityB.name}</span>
                  </div>
                  <p className="text-rose-200/90 leading-relaxed text-[11px]">
                    <strong>Mechanism:</strong> {clash.biologicalMechanism}
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-rose-500/30 text-[11px] text-slate-300 flex items-start justify-between gap-3">
                    <div>
                      <strong className="text-teal-300 block mb-0.5">Clinical Remedy:</strong>
                      <span>{clash.recommendedFix}</span>
                    </div>
                    {clash.canAutoFixSchedule && onAutoFixClash && (
                      <button
                        type="button"
                        onClick={() => onAutoFixClash(clash.id)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[10px] shrink-0 cursor-pointer active:scale-95 transition-all flex items-center gap-1 shadow-sm"
                      >
                        <RefreshCw size={11} /> Auto-Fix Schedule
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* The 80/20 Sigmoidal Curve Visualizer */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={14} className="text-teal-400" />
                <span>The 80/20 Pareto Diminishing Returns Curve</span>
              </span>
              <span className="text-[11px] font-mono text-purple-300">
                You are at {outcomeState.dialedInScore}%
              </span>
            </div>

            {/* Stepped Sigmoidal Progress Rail */}
            <div className="space-y-1.5">
              <div className="relative h-6 bg-slate-950 rounded-xl border border-white/5 flex items-center p-1 overflow-hidden">
                {/* 0-80% Foundation Zone */}
                <div className="w-[80%] h-full bg-emerald-950/40 border-r border-emerald-500/40 relative flex items-center justify-start pl-2">
                  <span className="text-[9px] font-mono font-bold text-emerald-400/70 uppercase">
                    Foundation (80%)
                  </span>
                </div>
                {/* 80-92% Optimization Zone */}
                <div className="w-[12%] h-full bg-blue-950/40 border-r border-blue-500/40 relative flex items-center justify-center">
                  <span className="text-[8px] font-mono font-bold text-blue-400/70 uppercase">
                    Boost
                  </span>
                </div>
                {/* 92-100% Power User Zone */}
                <div className="w-[8%] h-full bg-purple-950/40 relative flex items-center justify-center">
                  <span className="text-[8px] font-mono font-bold text-purple-400/70 uppercase">
                    Elite
                  </span>
                </div>

                {/* User Current Marker */}
                <div 
                  className="absolute top-0 bottom-0 w-2.5 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full shadow-[0_0_12px_rgba(45,212,191,0.8)] -translate-x-1/2 transition-all duration-300"
                  style={{ left: `${Math.min(98, Math.max(2, outcomeState.dialedInScore))}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
                <span>0% Baseline</span>
                <span>80% Sweet Spot</span>
                <span>92% Deep Stack</span>
                <span>100% Maximum</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {outcomeState.dialedInScore >= 90
                ? 'You are in the Elite Power-User tier. You have multi-layered biological coverage spanning cellular transcription, structural protection, and targeted co-factors.'
                : outcomeState.dialedInScore >= 75
                ? 'You have captured the critical 80/20 plateau. Foundational pillars are actively scheduled with high biological leverage and minimal friction.'
                : 'You have room to capture substantial gains with 1 foundational pillar before entering diminishing returns.'}
            </p>
          </div>

          {/* Interactive User Target Calibration (Sliders) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-purple-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Calibrate Your Target Zone
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Defines what turns 🟢 Green for you
              </span>
            </div>

            {/* Slider 1: Target Ambition */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Desired Dialed-In Goal</span>
                <span className="font-mono font-bold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded">
                  {localTargetDialedIn} / 100 ({localTargetDialedIn >= 92 ? 'Elite Power User' : localTargetDialedIn >= 80 ? '80/20 Sweet Spot' : 'Essential Core'})
                </span>
              </div>
              <input
                type="range"
                min={60}
                max={98}
                step={1}
                value={localTargetDialedIn}
                onChange={(e) => setLocalTargetDialedIn(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Slider 2: Max Effort Allowance */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Maximum Effort &amp; Cost Allowance</span>
                <span className="font-mono font-bold text-teal-300 bg-teal-950/60 border border-teal-500/30 px-2 py-0.5 rounded">
                  &lt; {localMaxEffort} / 100 ({localMaxEffort > 70 ? 'High Budget / Time' : localMaxEffort > 40 ? 'Moderate Effort' : 'Minimalist'})
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={95}
                step={5}
                value={localMaxEffort}
                onChange={(e) => setLocalMaxEffort(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>

            {/* Save Target Preference Button */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-slate-400">
                Current Status with this setting:{' '}
                <strong className={liveEvaluation.badgeText}>{liveEvaluation.label}</strong>
              </div>
              <button
                type="button"
                onClick={handleSaveTarget}
                disabled={isSavingTarget}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSavingTarget ? 'Saved!' : 'Save Target Settings'}
              </button>
            </div>
          </div>

          {/* Active Modalities Hierarchy Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Layers size={14} className="text-purple-400" />
              <span>Active Modality Hierarchy ({outcomeState.activeModalities.length})</span>
            </h3>

            <div className="space-y-2">
              {outcomeState.tierBreakdown.foundational.map(({ modality }) => (
                <div key={modality.id} className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="font-extrabold text-white truncate">{modality.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md shrink-0 font-bold">
                    Foundational Core (+35–45 pts)
                  </span>
                </div>
              ))}

              {outcomeState.tierBreakdown.synergistic.map(({ modality }) => (
                <div key={modality.id} className="p-3 rounded-xl bg-slate-900/90 border border-blue-500/30 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                    <span className="font-bold text-white truncate">{modality.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-blue-300 bg-blue-950/60 border border-blue-500/30 px-2 py-0.5 rounded-md shrink-0 font-bold">
                    Synergy Booster (+12 pts)
                  </span>
                </div>
              ))}

              {outcomeState.tierBreakdown.marginal.map(({ modality }) => (
                <div key={modality.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                    <span className="text-slate-300 font-medium truncate">{modality.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-950/40 border border-purple-500/20 px-2 py-0.5 rounded-md shrink-0">
                    Power Addition (+2–5 pts)
                  </span>
                </div>
              ))}

              {outcomeState.activeModalities.length === 0 && (
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-500 text-center">
                  No active modalities currently targeting this outcome dimension.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer"
          >
            Close
          </button>
          <div className="text-[11px] text-slate-400 font-mono">
            LEVL Functional Optimization Protocol
          </div>
        </div>
      </div>

      {isAnalysisModalOpen && (
        <LongevityAnalysisModal
          isOpen={isAnalysisModalOpen}
          onClose={() => setIsAnalysisModalOpen(false)}
          outcomeId={outcomeState.outcomeId}
          outcomeName={outcomeState.outcomeName}
          currentDialedInScore={outcomeState.dialedInScore}
          activeModalities={outcomeState.activeModalities}
          todayTasks={todayTasks}
        />
      )}
    </div>,
    document.body
  )
}

export default OutcomeOptimizationModal
