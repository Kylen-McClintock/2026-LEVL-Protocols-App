'use client'

import { useState } from 'react'
import { Protocol, ProtocolStep } from '@/lib/types'
import { X, Scale, Check, ArrowRightLeft, Sparkles, BookOpen, Layers, Clock, ShieldCheck, User } from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { addProtocolToToday, addProtocolToBench } from '@/lib/data'

type ProtocolCompareModalProps = {
  isOpen: boolean
  onClose: () => void
  protocolA: Protocol | null
  protocolB: Protocol | null
  onSuccess?: () => void
}

export default function ProtocolCompareModal({
  isOpen,
  onClose,
  protocolA,
  protocolB,
  onSuccess
}: ProtocolCompareModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [actionDone, setActionDone] = useState<string | null>(null)

  if (!isOpen || !protocolA || !protocolB) return null

  const stepsA: any[] = protocolA.steps || protocolA.protocol_steps || []
  const stepsB: any[] = protocolB.steps || protocolB.protocol_steps || []

  // Extract modality IDs / notes / names
  const modNamesA = new Set(stepsA.map(s => s.notes || s.modality_id || s.stack_group || s.timing_slot).filter(Boolean))
  const modNamesB = new Set(stepsB.map(s => s.notes || s.modality_id || s.stack_group || s.timing_slot).filter(Boolean))

  const overlappingNames = Array.from(modNamesA).filter(name => modNamesB.has(name))
  const uniqueNamesA = Array.from(modNamesA).filter(name => !modNamesB.has(name))
  const uniqueNamesB = Array.from(modNamesB).filter(name => !modNamesA.has(name))

  const handleEnroll = async (protocolId: string, name: string) => {
    setIsProcessing(true)
    const localUserId = getLocalUserId()
    const todayStr = new Date().toISOString().split('T')[0]
    await addProtocolToToday(localUserId, todayStr, protocolId)
    setIsProcessing(false)
    setActionDone(`Enrolled in ${name}!`)
    if (onSuccess) onSuccess()
    setTimeout(() => {
      onClose()
      setActionDone(null)
    }, 1200)
  }

  const handleBench = async (protocolId: string, name: string) => {
    setIsProcessing(true)
    const localUserId = getLocalUserId()
    await addProtocolToBench(localUserId, protocolId)
    setIsProcessing(false)
    setActionDone(`Saved ${name} to Bench!`)
    if (onSuccess) onSuccess()
    setTimeout(() => {
      onClose()
      setActionDone(null)
    }, 1200)
  }

  const authorA = protocolA.source_label || (protocolA as any).authors || 'Scientific Protocol'
  const authorB = protocolB.source_label || (protocolB as any).authors || 'Scientific Protocol'
  const categoryA = protocolA.primary_goal || protocolA.goal || 'Comprehensive Longevity'
  const categoryB = protocolB.primary_goal || protocolB.goal || 'Comprehensive Longevity'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />

      <div className="relative bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shadow-md">
              <Scale size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">Protocol vs. Protocol Comparison</h2>
              <p className="text-xs text-slate-400">Evaluate methodology, modalities, and commitments side-by-side</p>
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

          {/* Side-by-Side Hero Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Protocol A */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-purple-500/30 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-mono font-extrabold text-purple-300 bg-purple-500/20 border border-purple-500/40 px-2.5 py-0.5 rounded-full">
                    Protocol A
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium truncate">
                    <User size={12} className="text-slate-500" /> {authorA}
                  </span>
                </div>
                <h3 className="font-extrabold text-white text-base sm:text-lg mt-2 leading-snug">{protocolA.name}</h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-3 leading-relaxed">{protocolA.description}</p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleEnroll(protocolA.id, protocolA.name)}
                  disabled={isProcessing}
                  className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  Enroll in Protocol A
                </button>
                <button
                  onClick={() => handleBench(protocolA.id, protocolA.name)}
                  disabled={isProcessing}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Save to Bench
                </button>
              </div>
            </div>

            {/* Protocol B */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-teal-500/30 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-mono font-extrabold text-teal-300 bg-teal-500/20 border border-teal-500/40 px-2.5 py-0.5 rounded-full">
                    Protocol B
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium truncate">
                    <User size={12} className="text-slate-500" /> {authorB}
                  </span>
                </div>
                <h3 className="font-extrabold text-white text-base sm:text-lg mt-2 leading-snug">{protocolB.name}</h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-3 leading-relaxed">{protocolB.description}</p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleEnroll(protocolB.id, protocolB.name)}
                  disabled={isProcessing}
                  className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  Enroll in Protocol B
                </button>
                <button
                  onClick={() => handleBench(protocolB.id, protocolB.name)}
                  disabled={isProcessing}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Save to Bench
                </button>
              </div>
            </div>

          </div>

          {/* Feedback banner */}
          {actionDone && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 animate-in fade-in">
              <Check size={16} /> {actionDone}
            </div>
          )}

          {/* Comparison Matrix Table */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/40 text-xs">
            <div className="grid grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)_minmax(0,1fr)] gap-4 bg-slate-900/80 font-bold text-slate-400 p-3.5 border-b border-slate-800 uppercase tracking-wider text-[11px] items-center">
              <div>Attribute</div>
              <div className="text-purple-300 font-extrabold truncate min-w-0">{protocolA.name}</div>
              <div className="text-teal-300 font-extrabold truncate min-w-0">{protocolB.name}</div>
            </div>

            {/* Total Steps */}
            <div className="grid grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)_minmax(0,1fr)] gap-4 p-3.5 border-b border-slate-800/60 text-slate-200 items-center">
              <div className="font-semibold text-slate-400">Modalities</div>
              <div className="font-mono font-bold text-purple-400 min-w-0 break-words">{stepsA.length} Modalities</div>
              <div className="font-mono font-bold text-teal-400 min-w-0 break-words">{stepsB.length} Modalities</div>
            </div>

            {/* Target Biological Focus */}
            <div className="grid grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)_minmax(0,1fr)] gap-4 p-3.5 border-b border-slate-800/60 text-slate-200 items-center">
              <div className="font-semibold text-slate-400">Focus</div>
              <div className="font-medium text-slate-200 min-w-0 break-words">{categoryA}</div>
              <div className="font-medium text-slate-200 min-w-0 break-words">{categoryB}</div>
            </div>

            {/* Author / Origin */}
            <div className="grid grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)_minmax(0,1fr)] gap-4 p-3.5 border-b border-slate-800/60 text-slate-200 items-center">
              <div className="font-semibold text-slate-400">Creator</div>
              <div className="text-slate-300 min-w-0 break-words">{authorA}</div>
              <div className="text-slate-300 min-w-0 break-words">{authorB}</div>
            </div>
          </div>

          {/* Modality Overlap Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers size={14} className="text-purple-400" /> Modality Overlap & Uniqueness
            </h4>

            {/* Overlapping Modalities */}
            {overlappingNames.length > 0 && (
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check size={14} /> Shared in Both Protocols ({overlappingNames.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {overlappingNames.map((name, i) => (
                    <span key={i} className="text-[11px] font-medium bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 px-2.5 py-0.5 rounded-lg">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Unique to A vs B */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-900/60 border border-purple-500/20 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-purple-300">
                  Unique to {protocolA.name} ({uniqueNamesA.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {uniqueNamesA.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">No unique modalities</span>
                  ) : (
                    uniqueNamesA.map((name, i) => (
                      <span key={i} className="text-[11px] font-medium bg-purple-950/60 border border-purple-800/60 text-purple-300 px-2 py-0.5 rounded-lg">
                        {name}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/60 border border-teal-500/20 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-teal-300">
                  Unique to {protocolB.name} ({uniqueNamesB.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {uniqueNamesB.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">No unique modalities</span>
                  ) : (
                    uniqueNamesB.map((name, i) => (
                      <span key={i} className="text-[11px] font-medium bg-teal-950/60 border border-teal-800/60 text-teal-300 px-2 py-0.5 rounded-lg">
                        {name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Close Comparison
          </button>
        </div>

      </div>
    </div>
  )
}
