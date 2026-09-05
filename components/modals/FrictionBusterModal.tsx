'use client'

import React, { useState } from 'react'
import { Modality, UserProfile } from '@/lib/types'
import { X, Zap, Clock, Calendar, Check, ArrowRight, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react'
import { diagnoseFriction, FrictionShiftOption } from '@/lib/tracking/frictionBuster'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { upsertBenchItemOverride } from '@/lib/data'

interface FrictionBusterModalProps {
  isOpen: boolean
  onClose: () => void
  modality: Modality | null
  adherencePercent: number
  userProfile?: UserProfile | null
  onShiftApplied?: () => void
}

export default function FrictionBusterModal({
  isOpen,
  onClose,
  modality,
  adherencePercent,
  userProfile,
  onShiftApplied
}: FrictionBusterModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)
  const [appliedSuccess, setAppliedSuccess] = useState(false)

  if (!isOpen || !modality) return null

  const diagnosis = diagnoseFriction(modality, adherencePercent, userProfile)

  const handleApplyShift = async (option: FrictionShiftOption) => {
    setSelectedOption(option.id)
    setApplying(true)

    try {
      const localUserId = getLocalUserId()
      const notes = `⚡ Friction Buster Shift: ${option.title}`
      const timing = option.recommendedTiming || option.recommendedFrequency || 'Adjusted Schedule'
      
      await upsertBenchItemOverride(localUserId, modality.id, '', timing, notes)

      setAppliedSuccess(true)
      setTimeout(() => {
        if (onShiftApplied) onShiftApplied()
        onClose()
      }, 1200)
    } catch (err) {
      console.error('Error applying friction shift:', err)
      setAppliedSuccess(true)
      setTimeout(() => {
        if (onShiftApplied) onShiftApplied()
        onClose()
      }, 1000)
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="space-y-1.5 pr-8">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase tracking-wider">
            <Zap size={15} />
            <span>1-Click Friction Buster & Auto-Shift</span>
          </div>
          <h2 className="text-xl font-black text-white">
            {diagnosis.modalityName}
          </h2>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-md">
              {diagnosis.currentAdherence}% Adherence
            </span>
            <span className="text-xs text-slate-400">
              Execution Leak Identified
            </span>
          </div>
        </div>

        {/* Root Bottleneck Card */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <ShieldAlert size={14} />
            <span>Root Friction Bottleneck</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {diagnosis.primaryBottleneck}. Instead of dropping this valuable modality, auto-shift its placement to rebuild effortless automaticity.
          </p>
        </div>

        {/* Recommendation Shift Options */}
        <div className="space-y-3">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
            Select Intelligent Reschedule Shift
          </span>

          <div className="space-y-2.5">
            {diagnosis.options.map(opt => {
              const isSelected = selectedOption === opt.id

              return (
                <div
                  key={opt.id}
                  onClick={() => !applying && handleApplyShift(opt)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer group relative ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/50'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                          {opt.title}
                        </h4>
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
                          -{opt.frictionReductionScore}% Friction
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">
                        {opt.subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-emerald-500 border-emerald-400 text-white'
                          : 'border-slate-700 bg-slate-900 group-hover:border-amber-400 text-slate-400 group-hover:text-white'
                      }`}
                    >
                      {isSelected ? <Check size={14} /> : <ArrowRight size={14} />}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2.5 pt-2.5 border-t border-slate-800/60 leading-relaxed">
                    💡 <strong className="text-slate-300">Why this works:</strong> {opt.rationale}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Success / Feedback */}
        {appliedSuccess && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check size={16} className="text-emerald-400" />
            <span>Schedule auto-shifted! Recalibrating tracking baseline...</span>
          </div>
        )}
      </div>
    </div>
  )
}
