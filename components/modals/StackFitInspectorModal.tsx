'use client'

import React, { useState } from 'react'
import { Modality } from '@/lib/types'
import { StackFitResult, StackSynergyMatch, StackConflictMatch } from '@/lib/synergy/stackFitEngine'
import { X, Sparkles, AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck, Clock, ExternalLink, CalendarPlus, BookmarkPlus, Zap } from 'lucide-react'
import { createDailyTask, addToBench } from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'

interface StackFitInspectorModalProps {
  isOpen: boolean
  onClose: () => void
  exploringModality: Modality | null
  stackFit: StackFitResult | null
  onSuccess?: () => void
}

export default function StackFitInspectorModal({
  isOpen,
  onClose,
  exploringModality,
  stackFit,
  onSuccess
}: StackFitInspectorModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [resolvedTimingNotes, setResolvedTimingNotes] = useState<string | null>(null)

  if (!isOpen || !exploringModality || !stackFit) return null

  const expName = exploringModality.display_name || exploringModality.name

  const handleAddWithAutoResolution = async (destination: 'today' | 'bench', customNote?: string) => {
    setIsProcessing(true)
    const localUserId = getLocalUserId()
    const todayStr = new Date().toISOString().split('T')[0]

    try {
      if (destination === 'today') {
        await createDailyTask(localUserId, todayStr, exploringModality.id)
      } else {
        await addToBench(localUserId, exploringModality.id)
      }

      if (customNote) {
        setResolvedTimingNotes(customNote)
      }

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      console.error('Failed to add modality:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  // Header Color Theme
  const isSynergy = stackFit.badge.type === 'synergy'
  const isConflict = stackFit.badge.type === 'conflict' || stackFit.badge.type === 'caution'

  const scoreBadgeBg = isSynergy 
    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
    : isConflict 
    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
    : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />

      <div className="relative bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shadow-md">
              <Sparkles size={20} className="text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white leading-tight">Biochemical Stack Fit Analysis</h2>
                <span className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full border ${scoreBadgeBg}`}>
                  {stackFit.overallFitScore}/100 Fit
                </span>
              </div>
              <p className="text-xs text-slate-400">Evaluating compatibility with your active Today & Bench habits</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">

          {/* Interactive Stack Visual Interaction Web */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Stack Interaction Map</span>
              <span className="text-[10px] font-mono text-slate-500">Real-Time Biological Interplay</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 p-3 bg-slate-950/70 border border-slate-800/60 rounded-xl">
              {/* Exploring Modality Pill */}
              <div className="px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-500/50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shrink-0">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span>{expName} (Exploring)</span>
              </div>

              <div className="text-slate-600 font-bold hidden sm:block">⟷</div>
              <div className="text-slate-600 font-bold sm:hidden">↕</div>

              {/* Connected Active Stack Modalities */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {stackFit.synergies.map((s, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-emerald-400" />
                    <span>{s.matchedModalityName}</span>
                    <span className="text-[9px] opacity-75">({s.source})</span>
                  </span>
                ))}
                {stackFit.conflicts.map((c, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-amber-950/50 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-1">
                    <AlertTriangle size={11} className="text-amber-400" />
                    <span>{c.matchedModalityName}</span>
                    <span className="text-[9px] opacity-75">({c.source})</span>
                  </span>
                ))}
                {stackFit.synergies.length === 0 && stackFit.conflicts.length === 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium">
                    ✓ Clean Biological Profile (No Direct Antagonisms)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Synergies Section */}
          {stackFit.synergies.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Sparkles size={14} />
                <span>Verified Biochemical Synergies ({stackFit.synergies.length})</span>
              </div>

              <div className="space-y-3">
                {stackFit.synergies.map((synergy, idx) => (
                  <div key={idx} className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            {synergy.synergyType.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-bold text-slate-300">
                            with <strong className="text-white">{synergy.matchedModalityName}</strong>
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1.5">{synergy.headline}</h4>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{synergy.rationale}</p>

                    {synergy.actionableTip && (
                      <div className="p-2.5 bg-emerald-900/30 border border-emerald-500/20 rounded-xl flex items-start gap-2 text-xs text-emerald-200">
                        <Zap size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Synergy Protocol:</strong> {synergy.actionableTip}
                        </div>
                      </div>
                    )}

                    {synergy.pubmedUrl && (
                      <div className="pt-1 flex justify-end">
                        <a
                          href={synergy.pubmedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <span>View Verified PubMed Paper</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conflicts & Timing Warnings Section */}
          {stackFit.conflicts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <AlertTriangle size={14} />
                <span>Timing & Interaction Warnings ({stackFit.conflicts.length})</span>
              </div>

              <div className="space-y-3">
                {stackFit.conflicts.map((conflict, idx) => (
                  <div key={idx} className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {conflict.severity === 'critical' ? 'Direct Antagonism' : 'Timing Separation Required'}
                          </span>
                          <span className="text-xs font-bold text-slate-300">
                            with <strong className="text-white">{conflict.matchedModalityName}</strong>
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1.5">{conflict.headline}</h4>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{conflict.rationale}</p>

                    <div className="p-3 bg-amber-900/30 border border-amber-500/20 rounded-xl space-y-2 text-xs text-amber-200">
                      <div className="flex items-start gap-2">
                        <Clock size={14} className="text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Recommended Mitigation:</strong> {conflict.mitigationRecommendation}
                        </div>
                      </div>

                      {/* 1-Click Auto-Resolve Timing Button */}
                      {conflict.autoResolutionTiming && (
                        <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-2">
                          <span className="text-[11px] text-amber-300/80">
                            {conflict.autoResolutionTiming.description}
                          </span>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleAddWithAutoResolution('today', conflict.autoResolutionTiming?.description)}
                            className="w-full sm:w-auto px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer shrink-0"
                          >
                            <Clock size={13} />
                            <span>Auto-Resolve & Add</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {conflict.pubmedUrl && (
                      <div className="pt-1 flex justify-end">
                        <a
                          href={conflict.pubmedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <span>Read Clinical Study</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clean Fit Summary when No Synergies/Conflicts */}
          {stackFit.synergies.length === 0 && stackFit.conflicts.length === 0 && (
            <div className="p-5 bg-cyan-950/20 border border-cyan-500/30 rounded-2xl space-y-2 text-center">
              <ShieldCheck size={28} className="text-cyan-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Clean Biochemical Compatibility</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                This modality does not compete for cellular transporters, enzyme cofactors, or circadian receptors with any of your active Today habits or Bench items.
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-900/60 shrink-0 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => handleAddWithAutoResolution('bench')}
            disabled={isProcessing}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
          >
            <BookmarkPlus size={15} />
            <span>Save to Bench</span>
          </button>

          <button
            onClick={() => handleAddWithAutoResolution('today')}
            disabled={isProcessing}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer disabled:opacity-50"
          >
            <CalendarPlus size={15} />
            <span>Add to Today Stack</span>
          </button>
        </div>

      </div>
    </div>
  )
}
