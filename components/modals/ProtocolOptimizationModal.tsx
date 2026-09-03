'use client'

import React, { useState } from 'react'
import { 
  X, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Dumbbell, 
  HeartPulse,
  Check,
  ShieldAlert,
  Flame,
  Info
} from 'lucide-react'
import { 
  ProtocolOptimizationFinding, 
  applyTimingOptimization 
} from '@/lib/calendar/pulseOptimizationEngine'
import { addSingleModalityToToday } from '@/lib/data'

interface ProtocolOptimizationModalProps {
  isOpen: boolean
  onClose: () => void
  findings: ProtocolOptimizationFinding[]
  growthPercentage: number
  recoveryPercentage: number
  localUserId: string
  dateStr: string
  onOptimizationApplied?: () => void
}

export default function ProtocolOptimizationModal({
  isOpen,
  onClose,
  findings,
  growthPercentage,
  recoveryPercentage,
  localUserId,
  dateStr,
  onOptimizationApplied
}: ProtocolOptimizationModalProps) {
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [appliedIds, setAppliedIds] = useState<Record<string, boolean>>({})
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleApply = async (finding: ProtocolOptimizationFinding) => {
    setApplyingId(finding.id)
    try {
      if (finding.actionType === 'shift_timing' && finding.targetTaskId && finding.targetTimeOrSlot) {
        await applyTimingOptimization(finding.targetTaskId, finding.targetTimeOrSlot)
      } else if (finding.actionType === 'add_modality' && finding.targetModalityId && localUserId) {
        await addSingleModalityToToday(localUserId, dateStr, finding.targetModalityId)
      }

      setAppliedIds(prev => ({ ...prev, [finding.id]: true }))
      setFeedbackMessage(`Successfully applied: ${finding.title}`)
      setTimeout(() => setFeedbackMessage(null), 4000)

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('levl_protocol_updated'))
        window.dispatchEvent(new CustomEvent('levl_tasks_updated'))
      }

      if (onOptimizationApplied) {
        onOptimizationApplied()
      }
    } catch (err) {
      console.error('Error applying optimization:', err)
    } finally {
      setApplyingId(null)
    }
  }

  const pendingRecommendations = findings.filter(f => f.status === 'recommended' && !appliedIds[f.id])
  const optimizedItems = findings.filter(f => f.status === 'already_optimized' || appliedIds[f.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-gradient-to-r from-purple-950/40 via-slate-900 to-emerald-950/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Sparkles size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-tight">
                Daily Pulse Protocol Optimization
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Chronobiological audit: maximize anabolic growth without compromising nocturnal recovery
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Current Daily Pulse Balance Strip */}
          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono font-extrabold">
              <span className="text-purple-400 flex items-center gap-1.5">
                <Dumbbell size={14} />
                <span>Growth Mode: {growthPercentage}%</span>
              </span>
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span>Recovery Mode: {recoveryPercentage}%</span>
                <HeartPulse size={14} />
              </span>
            </div>

            <div className="relative h-3 rounded-full bg-slate-950 p-0.5 border border-white/15 overflow-hidden flex">
              <div
                style={{ width: `${growthPercentage}%` }}
                className="h-full rounded-l-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500"
              />
              <div
                style={{ width: `${recoveryPercentage}%` }}
                className="h-full rounded-r-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-500"
              />
            </div>
          </div>

          {/* Real-time Feedback Banner */}
          {feedbackMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {/* Pending High-Impact Recommendations */}
          {pendingRecommendations.length > 0 && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-400" />
                  <span>Actionable Protocol Optimizations ({pendingRecommendations.length})</span>
                </span>
                <span className="text-[10px] font-mono uppercase font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                  High Impact
                </span>
              </div>

              {pendingRecommendations.map(finding => {
                const isApplying = applyingId === finding.id

                return (
                  <div
                    key={finding.id}
                    className="p-4 rounded-2xl bg-black/60 border border-amber-500/35 space-y-3 shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs sm:text-sm font-extrabold text-white block">
                          {finding.title}
                        </span>
                        <p className="text-xs text-amber-300/90 font-medium mt-0.5">
                          {finding.problemSummary}
                        </p>
                      </div>

                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10 shrink-0">
                        {finding.category.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Biological Rationale */}
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-300 space-y-1.5">
                      <p className="leading-relaxed">
                        <strong className="text-slate-200">Mechanism: </strong>
                        {finding.biologicalRationale}
                      </p>
                      <div className="text-[11px] font-mono text-emerald-300 font-bold pt-1 border-t border-white/5 flex items-center gap-1.5">
                        <TrendingUp size={13} className="text-emerald-400" />
                        <span>Expected Impact: {finding.pulseBalanceImpact}</span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-1 flex items-center justify-between gap-3 flex-wrap">
                      <a
                        href={finding.pubMedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink size={11} />
                        <span>Evidence: {finding.citation}</span>
                      </a>

                      <button
                        type="button"
                        disabled={isApplying}
                        onClick={() => handleApply(finding)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Zap size={13} className={isApplying ? "animate-spin" : ""} />
                        <span>{isApplying ? 'Applying...' : finding.actionLabel}</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Already Optimized Protocol Levers */}
          {optimizedItems.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Harmonized &amp; Guarded Levers ({optimizedItems.length})</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {optimizedItems.map(item => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1 text-xs"
                  >
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                      <Check size={13} className="stroke-[3] text-emerald-400" />
                      <span className="truncate">{item.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {item.biologicalRationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            {pendingRecommendations.length === 0 
              ? '✓ All High-Impact Levers Fully Optimized' 
              : `${pendingRecommendations.length} Optimization(s) Available`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Close Assessment
          </button>
        </div>
      </div>
    </div>
  )
}
