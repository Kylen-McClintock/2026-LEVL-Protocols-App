'use client'

import React from 'react'
import { ChevronRight, ChevronsRight, Check } from 'lucide-react'

export interface ModalitySequenceInfo {
  stepNumber: number
  totalSteps: number
  protocolName?: string
  isUpNext?: boolean
  isCompleted?: boolean
  transitionRestLabel?: string // e.g. "Wait 15m" or "Immediately After"
}

interface BlocksSequenceBadgeProps {
  sequence: ModalitySequenceInfo
}

export default function BlocksSequenceBadge({ sequence }: BlocksSequenceBadgeProps) {
  const { stepNumber, totalSteps, isUpNext, isCompleted, transitionRestLabel } = sequence

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {/* Numbered Stepper Badge with Chevron */}
      <div
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-all ${
          isCompleted
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            : isUpNext
            ? 'bg-purple-500/25 text-purple-200 border-purple-400 shadow-md shadow-purple-500/20 ring-1 ring-purple-400/50'
            : 'bg-white/5 text-slate-300 border-white/10'
        }`}
        title={`Step ${stepNumber} of ${totalSteps} in this protocol sequence`}
      >
        {isCompleted ? (
          <Check size={11} strokeWidth={3} className="text-emerald-400" />
        ) : isUpNext ? (
          <ChevronsRight size={12} className="text-purple-300 animate-pulse" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        )}
        <span>Step {stepNumber}/{totalSteps}</span>
        {isUpNext ? (
          <span className="ml-0.5 text-[9px] uppercase tracking-wider text-purple-300 font-sans font-black flex items-center gap-0.5">
            Up Next <ChevronRight size={10} strokeWidth={3} />
          </span>
        ) : (
          <ChevronRight size={10} className="text-slate-500" />
        )}
      </div>

      {/* Transition interval pill with Chevron */}
      {transitionRestLabel && (
        <span className="text-[9px] font-mono text-slate-300 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
          <span>{transitionRestLabel}</span>
          <ChevronRight size={10} className="text-purple-400" />
        </span>
      )}
    </div>
  )
}

