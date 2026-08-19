'use client'

import { useState } from 'react'
import { Modality } from '@/lib/types'
import { X, Scale, Check, ArrowRightLeft, Sparkles, AlertCircle, Bookmark, Calendar } from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { createDailyTask, addToBench, removeModalityEntirely } from '@/lib/data'

type ModalityCompareModalProps = {
  isOpen: boolean
  onClose: () => void
  exploringModality: Modality | null
  activeModality: Modality | null
  activeSource: 'today' | 'bench' | 'scheduled'
  onSuccess?: () => void
}

export default function ModalityCompareModal({
  isOpen,
  onClose,
  exploringModality,
  activeModality,
  activeSource,
  onSuccess
}: ModalityCompareModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [expandMoA, setExpandMoA] = useState(false)

  if (!isOpen || !exploringModality || !activeModality) return null

  const expName = exploringModality.display_name || exploringModality.name
  const actName = activeModality.display_name || activeModality.name

  // Outcome comparison calculations
  const allOutcomes = Array.from(new Set([
    ...(exploringModality.functional_outcomes_to_track || []),
    ...(activeModality.functional_outcomes_to_track || []),
    ...Object.keys(exploringModality.functional_impacts || {}),
    ...Object.keys(activeModality.functional_impacts || {})
  ])).filter(Boolean)

  const handleSwap = async () => {
    setIsProcessing(true)
    const localUserId = getLocalUserId()
    const todayStr = new Date().toISOString().split('T')[0]

    // 1. Remove active modality from Today or Bench
    await removeModalityEntirely(localUserId, activeModality.id)

    // 2. Add exploring modality to same destination
    if (activeSource === 'today') {
      await createDailyTask(localUserId, todayStr, exploringModality.id)
    } else {
      await addToBench(localUserId, exploringModality.id)
    }

    setIsProcessing(false)
    if (onSuccess) onSuccess()
    onClose()
  }

  const handleAddBoth = async (dest: 'today' | 'bench') => {
    setIsProcessing(true)
    const localUserId = getLocalUserId()
    const todayStr = new Date().toISOString().split('T')[0]

    if (dest === 'today') {
      await createDailyTask(localUserId, todayStr, exploringModality.id)
    } else {
      await addToBench(localUserId, exploringModality.id)
    }

    setIsProcessing(false)
    if (onSuccess) onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />

      <div className="relative bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-md">
              <Scale size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">Side-by-Side Modality Comparison</h2>
              <p className="text-xs text-slate-400">Evaluate biological mechanisms, dosages, and functional outcomes</p>
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
          
          {/* Top Banner Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exploring Card */}
            <div className="p-4 bg-purple-950/30 border border-purple-500/40 rounded-2xl flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] uppercase font-mono font-extrabold text-purple-300 bg-purple-500/20 border border-purple-500/40 px-2.5 py-0.5 rounded-full">
                  Modality A (Exploring)
                </span>
                <h3 className="font-extrabold text-white text-base sm:text-lg mt-2 leading-snug">{expName}</h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-3 leading-relaxed">{exploringModality.brief_description}</p>
              </div>
            </div>

            {/* Active Card */}
            <div className="p-4 bg-teal-950/30 border border-teal-500/40 rounded-2xl flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] uppercase font-mono font-extrabold text-teal-300 bg-teal-500/20 border border-teal-500/40 px-2.5 py-0.5 rounded-full">
                  Modality B ({activeSource === 'today' ? 'Active in Today' : 'On Your Bench'})
                </span>
                <h3 className="font-extrabold text-white text-base sm:text-lg mt-2 leading-snug">{actName}</h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-3 leading-relaxed">{activeModality.brief_description}</p>
              </div>
            </div>
          </div>

          {/* Comparison Matrix Table */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/40 text-xs">
            <div className="grid grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)_minmax(0,1fr)] gap-4 bg-slate-900/80 font-bold text-slate-400 p-3.5 border-b border-slate-800 uppercase tracking-wider text-[11px] items-center">
              <div>Attribute</div>
              <div className="text-purple-300 font-extrabold truncate min-w-0">{expName}</div>
              <div className="text-teal-300 font-extrabold truncate min-w-0">{actName}</div>
            </div>

            {/* Category */}
            <div className="grid grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)_minmax(0,1fr)] gap-4 p-3.5 border-b border-slate-800/60 text-slate-200 items-center">
              <div className="font-semibold text-slate-400">Category</div>
              <div className="capitalize font-medium min-w-0 break-words">{exploringModality.category}</div>
              <div className="capitalize font-medium min-w-0 break-words">{activeModality.category}</div>
            </div>

            {/* Dose / Exposure */}
            <div className="grid grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)_minmax(0,1fr)] gap-4 p-3.5 border-b border-slate-800/60 text-slate-200 items-start">
              <div className="font-semibold text-slate-400">Dose / Exposure</div>
              <div className="font-mono text-purple-300 font-bold leading-relaxed min-w-0 break-words">{exploringModality.dose_or_exposure || 'Standard'}</div>
              <div className="font-mono text-teal-300 font-bold leading-relaxed min-w-0 break-words">{activeModality.dose_or_exposure || 'Standard'}</div>
            </div>

            {/* Timing */}
            <div className="grid grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)_minmax(0,1fr)] gap-4 p-3.5 border-b border-slate-800/60 text-slate-200 items-center">
              <div className="font-semibold text-slate-400">Timing</div>
              <div className="min-w-0 break-words">{exploringModality.timing_summary || 'Flexible'}</div>
              <div className="min-w-0 break-words">{activeModality.timing_summary || 'Flexible'}</div>
            </div>

            {/* Effort & Cost */}
            <div className="grid grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)_minmax(0,1fr)] gap-4 p-3.5 border-b border-slate-800/60 text-slate-200 items-center">
              <div className="font-semibold text-slate-400">Effort / Cost</div>
              <div className="capitalize min-w-0 break-words">{exploringModality.effort_level || 'Medium'} • {exploringModality.cost_tier || 'Free'}</div>
              <div className="capitalize min-w-0 break-words">{activeModality.effort_level || 'Medium'} • {activeModality.cost_tier || 'Free'}</div>
            </div>

            {/* Longevity Benefit */}
            <div className="grid grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)_minmax(0,1fr)] gap-4 p-3.5 border-b border-slate-800/60 text-slate-200 items-center">
              <div className="font-semibold text-slate-400">Longevity Benefit</div>
              <div className="font-bold text-purple-300 capitalize min-w-0 break-words">{exploringModality.overall_longevity_benefit || 'High'}</div>
              <div className="font-bold text-teal-300 capitalize min-w-0 break-words">{activeModality.overall_longevity_benefit || 'High'}</div>
            </div>

            {/* Evidence Quality */}
            <div className="grid grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)_minmax(0,1fr)] gap-4 p-3.5 border-b border-slate-800/60 text-slate-200 items-center">
              <div className="font-semibold text-slate-400">Evidence Level</div>
              <div className="font-semibold min-w-0 break-words">{exploringModality.evidence_quality ? `${exploringModality.evidence_quality}/5 (Proven)` : 'High'}</div>
              <div className="font-semibold min-w-0 break-words">{activeModality.evidence_quality ? `${activeModality.evidence_quality}/5 (Proven)` : 'High'}</div>
            </div>

            {/* Mechanism of Action */}
            {(exploringModality.mechanism_of_action || activeModality.mechanism_of_action) && (
              <div className="grid grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)_minmax(0,1fr)] gap-4 p-3.5 text-slate-300 items-start">
                <div>
                  <div className="font-semibold text-slate-400">Mechanism of Action</div>
                  {((exploringModality.mechanism_of_action && exploringModality.mechanism_of_action.length > 180) || 
                    (activeModality.mechanism_of_action && activeModality.mechanism_of_action.length > 180)) && (
                    <button
                      type="button"
                      onClick={() => setExpandMoA(!expandMoA)}
                      className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors mt-1.5 cursor-pointer block"
                    >
                      {expandMoA ? 'Show less ⌃' : 'Read more ⌄'}
                    </button>
                  )}
                </div>
                <div className="min-w-0">
                  <div className={`text-[11px] leading-relaxed text-slate-300 whitespace-pre-line break-words [overflow-wrap:anywhere] ${expandMoA ? '' : 'line-clamp-4'}`}>
                    {exploringModality.mechanism_of_action || 'N/A'}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className={`text-[11px] leading-relaxed text-slate-300 whitespace-pre-line break-words [overflow-wrap:anywhere] ${expandMoA ? '' : 'line-clamp-4'}`}>
                    {activeModality.mechanism_of_action || 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Functional Outcome Scores Comparison */}
          {allOutcomes.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" /> Functional Outcome Impact Comparison
              </h4>
              <div className="space-y-2.5 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                {allOutcomes.slice(0, 5).map(outcome => {
                  const scoreExp = exploringModality.functional_impacts?.[outcome]?.score || 5
                  const scoreAct = activeModality.functional_impacts?.[outcome]?.score || 5
                  return (
                    <div key={outcome} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-200">
                        <span className="capitalize">{outcome}</span>
                        <span className="font-mono text-xs">
                          <strong className="text-purple-300">{scoreExp}/10</strong> vs <strong className="text-teal-300">{scoreAct}/10</strong>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full flex overflow-hidden border border-slate-800">
                        <div className="bg-purple-500 h-full transition-all" style={{ width: `${(scoreExp / 10) * 50}%` }} />
                        <div className="w-1 bg-slate-900 h-full shrink-0" />
                        <div className="bg-teal-400 h-full transition-all" style={{ width: `${(scoreAct / 10) * 50}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-900/60 shrink-0 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleSwap}
              disabled={isProcessing}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg cursor-pointer"
            >
              <ArrowRightLeft size={16} />
              Swap ({actName} → {expName})
            </button>
            <button
              onClick={() => handleAddBoth('today')}
              disabled={isProcessing}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Check size={16} />
              Keep Both in Today
            </button>
            <button
              onClick={() => handleAddBoth('bench')}
              disabled={isProcessing}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Bookmark size={15} />
              Add to Bench
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
