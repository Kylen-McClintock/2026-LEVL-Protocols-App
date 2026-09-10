'use client'

import React, { useState } from 'react'
import { DailyProtocolTask } from '@/lib/types'
import { PreFlightSpacingNudge } from '@/lib/synergy/preFlightSpacingNudge'
import { AlertTriangle, ShieldAlert, Clock, ExternalLink, X, ArrowRight, Check } from 'lucide-react'

interface PreFlightSpacingNudgeBannerProps {
  nudge: PreFlightSpacingNudge
  task: DailyProtocolTask
  onApplyDelay?: (targetTimeStr?: string, targetSlot?: string) => Promise<void>
  onOpenReschedule?: (task: DailyProtocolTask) => void
  onDismiss?: () => void
}

export default function PreFlightSpacingNudgeBanner({
  nudge,
  task,
  onApplyDelay,
  onOpenReschedule,
  onDismiss
}: PreFlightSpacingNudgeBannerProps) {
  const [isApplying, setIsApplying] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const isCritical = nudge.severity === 'critical'

  const handleDelayClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onApplyDelay || isApplying) return

    setIsApplying(true)
    try {
      await onApplyDelay(nudge.safeTargetTimeStr, nudge.safeTargetTimingSlot)
      setIsDone(true)
    } catch (err) {
      console.error('Failed to auto-apply timing delay:', err)
    } finally {
      setIsApplying(false)
    }
  }

  const handleRescheduleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onOpenReschedule) {
      onOpenReschedule(task)
    }
  }

  const handleDismissClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDismiss) {
      onDismiss()
    }
  }

  if (isDone) {
    return (
      <div 
        className="mt-2.5 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-2 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">Schedule updated safely to avoid biochemical blunting.</span>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`mt-2.5 rounded-xl p-3 sm:p-3.5 border text-xs shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-1 ${
        isCritical 
          ? 'bg-gradient-to-r from-rose-950/60 via-slate-900/90 to-rose-950/60 border-rose-500/40 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.15)]' 
          : 'bg-gradient-to-r from-amber-950/60 via-slate-900/90 to-amber-950/60 border-amber-500/40 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.12)]'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header Line */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {isCritical ? (
            <div className="relative shrink-0">
              <span className="absolute -inset-1 rounded-full bg-rose-500/30 animate-ping opacity-75" />
              <ShieldAlert className="w-4 h-4 text-rose-400 relative" />
            </div>
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          )}

          <h4 className="font-extrabold text-xs sm:text-sm tracking-tight truncate">
            {nudge.title}
          </h4>

          <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
            isCritical 
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          }`}>
            {isCritical ? 'High Impact' : 'Spacing Alert'}
          </span>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={handleDismissClick}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors shrink-0"
            title="Dismiss warning and proceed anyway"
            aria-label="Dismiss warning"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Rationale Body */}
      <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed mb-2.5">
        {nudge.message}
      </p>

      {/* Citation Link & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
        <a
          href={nudge.pubmedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-white underline underline-offset-2 transition-colors font-mono"
        >
          <span>{nudge.citation}</span>
          <ExternalLink size={10} className="shrink-0" />
        </a>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenReschedule && (
            <button
              type="button"
              onClick={handleRescheduleClick}
              className="text-[10px] font-medium text-slate-400 hover:text-white underline transition-colors px-1"
            >
              Custom timing...
            </button>
          )}

          {nudge.canAutoDelay && nudge.actionLabel && onApplyDelay && (
            <button
              type="button"
              onClick={handleDelayClick}
              disabled={isApplying}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer ${
                isCritical
                  ? 'bg-rose-500/25 hover:bg-rose-500/35 border-rose-500/50 text-rose-200'
                  : 'bg-amber-500/25 hover:bg-amber-500/35 border-amber-500/50 text-amber-200'
              }`}
            >
              <Clock size={12} className={isApplying ? 'animate-spin' : ''} />
              <span>{isApplying ? 'Updating...' : nudge.actionLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
