'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  X, 
  Layers, 
  Check, 
  Plus, 
  Sparkles, 
  BookOpen, 
  Clock, 
  Activity, 
  ExternalLink, 
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Scale,
  ArrowRight,
  ArrowLeft,
  Info,
  Zap,
  Target,
  Pill,
  Sliders,
  Inbox
} from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { addProtocolToToday, addProtocolToBench, getProtocolsWithSteps } from '@/lib/data'
import { Protocol } from '@/lib/types'
import { useTemperatureUnit } from '@/lib/utils/useTemperatureUnit'

interface EnrollProtocolModalProps {
  isOpen: boolean
  onClose: () => void
  onProtocolEnrolled?: () => void
  dateStr: string
}

export default function EnrollProtocolModal({
  isOpen,
  onClose,
  onProtocolEnrolled,
  dateStr
}: EnrollProtocolModalProps) {
  const router = useRouter()
  const { formatText: formatTemp } = useTemperatureUnit()
  const [protocols, setProtocols] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Expanded accordion state (protocol IDs that are expanded)
  const [expandedProtocolIds, setExpandedProtocolIds] = useState<Set<string>>(new Set())
  
  // Comparison selection state
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [isComparing, setIsComparing] = useState(false)

  const [enrollingId, setEnrollingId] = useState<string | null>(null)
  const [savingBenchId, setSavingBenchId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [hmWeeks, setHmWeeks] = useState<number>(12)
  const [pplCadence, setPplCadence] = useState<'3_day' | 'rolling'>('3_day')

  const targetRaceDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + (hmWeeks * 7))
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }, [hmWeeks])

  useEffect(() => {
    if (!isOpen) {
      setExpandedProtocolIds(new Set())
      setCompareIds([])
      setIsComparing(false)
      setSuccessMessage(null)
      return
    }

    async function load() {
      setLoading(true)
      try {
        const data = await getProtocolsWithSteps()
        const masterList = data.filter(p => p.visibility === 'global_library' || p.source_label)
        setProtocols(masterList.length > 0 ? masterList : data)
      } catch (err) {
        console.error('Error fetching protocols for enrollment modal:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isOpen])

  const toggleExpand = (protocolId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setExpandedProtocolIds(prev => {
      const next = new Set(prev)
      if (next.has(protocolId)) {
        next.delete(protocolId)
      } else {
        next.add(protocolId)
      }
      return next
    })
  }

  const toggleCompare = (protocolId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setCompareIds(prev => {
      if (prev.includes(protocolId)) {
        return prev.filter(id => id !== protocolId)
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), protocolId]
      }
      return [...prev, protocolId]
    })
  }

  const handleEnrollToday = async (protocolId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEnrollingId(protocolId)
    try {
      const localUserId = getLocalUserId()
      await addProtocolToToday(localUserId, dateStr, protocolId)
      setSuccessMessage('Successfully enrolled protocol into Today timeline!')
      if (onProtocolEnrolled) onProtocolEnrolled()
      setTimeout(() => {
        setSuccessMessage(null)
        onClose()
      }, 1200)
    } catch (err) {
      console.error('Error enrolling protocol to today:', err)
    } finally {
      setEnrollingId(null)
    }
  }

  const handleAddToBench = async (protocolId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSavingBenchId(protocolId)
    try {
      const localUserId = getLocalUserId()
      await addProtocolToBench(localUserId, protocolId)
      setSuccessMessage('Successfully saved protocol to your Research Bench!')
      if (onProtocolEnrolled) onProtocolEnrolled()
      setTimeout(() => {
        setSuccessMessage(null)
      }, 1500)
    } catch (err) {
      console.error('Error adding protocol to bench:', err)
    } finally {
      setSavingBenchId(null)
    }
  }

  const comparedProtocols = useMemo(() => {
    return protocols.filter(p => compareIds.includes(p.id))
  }, [protocols, compareIds])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/90 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/70 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 text-purple-300 rounded-2xl border border-purple-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.25)] shrink-0">
              <Layers size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  {isComparing ? 'Compare Longevity Protocols' : 'Enroll Longevity Protocol'}
                </h2>
                <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-950/90 text-purple-300 border border-purple-800/60">
                  {protocols.length} Available
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                {isComparing 
                  ? 'Side-by-side breakdown of mechanisms, time commitments, and daily steps'
                  : `Select or compare evidence-based master protocols for ${dateStr}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isComparing && (
              <button 
                onClick={() => setIsComparing(false)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer border border-white/10"
              >
                <ArrowLeft size={16} /> Back to Catalog
              </button>
            )}
            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 px-6 py-3 text-xs sm:text-sm font-extrabold flex items-center gap-2 animate-in slide-in-from-top-2">
            <Check size={18} className="text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3 text-slate-400">
              <Sparkles size={34} className="animate-spin text-purple-400" />
              <p className="text-xs sm:text-sm uppercase tracking-wider font-extrabold text-slate-300">Loading Protocols & Modality Steps...</p>
            </div>
          ) : isComparing ? (
            /* =================== VIEW 1: PROTOCOL COMPARISON MATRIX =================== */
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comparedProtocols.map(protocol => {
                  const steps = protocol.steps || protocol.protocol_steps || []
                  
                  return (
                    <div 
                      key={protocol.id} 
                      className="rounded-3xl bg-slate-950/80 border border-slate-800 p-4 sm:p-5 space-y-4 flex flex-col justify-between shadow-xl"
                    >
                      <div className="space-y-3.5">
                        {/* Protocol Header */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/60">
                              {protocol.source_label || 'Master Protocol'}
                            </span>
                            <span className="text-xs sm:text-sm font-mono text-emerald-400 font-extrabold">
                              {steps.length} Steps
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-extrabold text-white">
                            {protocol.name}
                          </h3>
                          {protocol.goal && (
                            <p className="text-xs sm:text-sm text-purple-300 font-bold mt-1">
                              🎯 {protocol.goal}
                            </p>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {protocol.description}
                        </p>

                        {/* Modalities Step List */}
                        <div className="space-y-2 pt-2 border-t border-slate-800">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                            Included Modalities ({steps.length})
                          </span>
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {steps.map((step: any, idx: number) => {
                              const mod = step.modality
                              const modName = mod?.display_name || mod?.name || `Step ${idx + 1}`
                              const timing = step.timing_slot || mod?.default_timing_slot || 'anytime'
                              const dose = step.dose_or_exposure || mod?.dose_or_exposure

                              return (
                                <div 
                                  key={step.id || idx} 
                                  className="p-2.5 sm:p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 text-xs sm:text-sm space-y-1"
                                >
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span className="font-extrabold text-slate-100 truncate">
                                      {idx + 1}. {modName}
                                    </span>
                                    <span className="text-[10px] sm:text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                                      {timing.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                  {dose && (
                                    <div className="text-xs sm:text-sm text-emerald-400 font-mono font-bold">
                                      {formatTemp(dose)}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                        <button
                          onClick={(e) => handleEnrollToday(protocol.id, e)}
                          disabled={enrollingId === protocol.id}
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-950 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <Plus size={16} />
                          <span>{enrollingId === protocol.id ? 'Enrolling...' : 'Enroll in Today'}</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleAddToBench(protocol.id, e)}
                            disabled={savingBenchId === protocol.id}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white text-xs sm:text-sm font-bold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Inbox size={15} className="text-blue-400" />
                            <span>Save to Bench</span>
                          </button>

                          <button
                            onClick={() => {
                              onClose()
                              router.push(`/protocols/${protocol.id}`)
                            }}
                            className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-purple-950/50 text-purple-300 hover:text-purple-200 text-xs sm:text-sm font-bold border border-purple-500/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            title="Open Full Protocol Page"
                          >
                            <ExternalLink size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* =================== VIEW 2: PROTOCOL CATALOG WITH EXPANDABLE ACCORDIONS =================== */
            <div className="space-y-3.5">
              {protocols.map((protocol) => {
                const steps = protocol.steps || protocol.protocol_steps || []
                const isExpanded = expandedProtocolIds.has(protocol.id)
                const isCompared = compareIds.includes(protocol.id)

                return (
                  <div 
                    key={protocol.id}
                    className={`rounded-3xl border transition-all overflow-hidden ${
                      isExpanded 
                        ? 'border-purple-500/60 bg-slate-950/90 shadow-[0_0_25px_rgba(168,85,247,0.2)]' 
                        : 'border-slate-800/90 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    {/* Collapsed / Header Row */}
                    <div 
                      onClick={() => toggleExpand(protocol.id)}
                      className="p-4 sm:p-5 space-y-2 cursor-pointer select-none"
                    >
                      {/* Top Row: Badges on Left, Compare + Expand Arrow on Right */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/60">
                            {protocol.source_label || 'Master Protocol'}
                          </span>
                          <span className="text-xs sm:text-sm font-mono font-extrabold text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2.5 py-0.5 rounded-md">
                            {steps.length} {steps.length === 1 ? 'Step' : 'Steps'}
                          </span>
                          {protocol.difficulty_level && (
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold capitalize">
                              {protocol.difficulty_level}
                            </span>
                          )}
                        </div>

                        {/* Top-Right Control Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => toggleCompare(protocol.id, e)}
                            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-colors border cursor-pointer ${
                              isCompared 
                                ? 'bg-purple-600 text-white border-purple-400 shadow-md' 
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600'
                            }`}
                            title="Select to compare side-by-side with other protocols"
                          >
                            <Scale size={14} />
                            <span>{isCompared ? 'Comparing' : 'Compare'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => toggleExpand(protocol.id, e)}
                            className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Full-Width Title */}
                      <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight pt-0.5">
                        {protocol.name}
                      </h3>

                      {/* Full-Width Goal */}
                      {protocol.goal && (
                        <p className="text-xs sm:text-sm font-bold text-purple-300 flex items-center gap-1.5">
                          <Target size={15} className="text-purple-400 shrink-0" />
                          <span>{protocol.goal}</span>
                        </p>
                      )}

                      {/* Full-Width Description */}
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {protocol.description}
                      </p>
                    </div>

                    {/* EXPANDED PROTOCOL DETAILS & 1-LINE-PER-MODALITY ACCORDION */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 pt-0 border-t border-purple-500/20 bg-black/40 space-y-4 animate-in fade-in slide-in-from-top-1">
                        
                        {/* Interactive Goal Horizon Configuration (For Half Marathon) */}
                        {protocol.id === 'half_marathon_training_protocol' && (
                          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-3 mt-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                                <Target size={15} className="text-cyan-400" />
                                <span>1. Select Target Race / Goal Horizon</span>
                              </span>
                              <span className="text-[11px] font-bold text-slate-300 font-mono">
                                Race Day: {targetRaceDate}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { weeks: 8, label: '8 Weeks', sub: 'Accelerated Peak' },
                                { weeks: 12, label: '12 Weeks', sub: 'Standard Periodization' },
                                { weeks: 16, label: '16 Weeks', sub: 'Base Builder' }
                              ].map(opt => (
                                <button
                                  key={opt.weeks}
                                  type="button"
                                  onClick={() => setHmWeeks(opt.weeks)}
                                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                    hmWeeks === opt.weeks
                                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                                  }`}
                                >
                                  <span className="block font-black text-xs">{opt.label}</span>
                                  <span className="block text-[10px] text-slate-400">{opt.sub}</span>
                                </button>
                              ))}
                            </div>

                            <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between text-[11px] text-slate-300">
                              <span>🏃 Long Run Progression: Starts at {hmWeeks === 8 ? '7' : hmWeeks === 16 ? '4' : '5'} mi → Peaks at 12 mi (2-week taper)</span>
                              <span className="text-orange-400 font-bold">Auto-Adapts on Skip</span>
                            </div>
                          </div>
                        )}

                        {/* Interactive Weekly Split Cadence Configuration (For PPL) */}
                        {protocol.id === 'push_pull_legs_hypertrophy_protocol' && (
                          <div className="p-4 rounded-2xl bg-orange-950/40 border border-orange-500/30 space-y-3 mt-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase tracking-wider text-orange-300 flex items-center gap-1.5">
                                <Zap size={15} className="text-orange-400" />
                                <span>1. Select Weekly Split Cadence</span>
                              </span>
                              <span className="text-[11px] font-bold text-slate-300">
                                1 Rest Day Between Sessions
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: '3_day', label: '3-Day Split (Mon / Wed / Fri)', sub: 'Default / Most Popular' },
                                { id: 'rolling', label: 'Rolling 4-Day (P / P / L / Rest)', sub: 'Continuous Rotation' }
                              ].map(opt => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => setPplCadence(opt.id as any)}
                                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                    pplCadence === opt.id
                                      ? 'bg-orange-500/20 border-orange-400 text-orange-200 font-bold shadow-md shadow-orange-500/20 ring-1 ring-orange-400/50'
                                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                                  }`}
                                >
                                  <span className="block font-black text-xs">{opt.label}</span>
                                  <span className="block text-[10px] text-slate-400">{opt.sub}</span>
                                </button>
                              ))}
                            </div>

                            <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between text-[11px] text-slate-300">
                              <span>🏋️ Push (Chest/Delts) → Pull (Back/Biceps) → Legs (Quads/Hams)</span>
                              <span className="text-emerald-400 font-bold">Roll Forward Enabled</span>
                            </div>
                          </div>
                        )}

                        {/* 1 Line Per Modality Step List */}
                        <div className="space-y-2.5 pt-3">
                          <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-300 px-1">
                            <span>Protocol Step Sequence & Modalities ({steps.length})</span>
                            <span className="text-xs text-purple-300 normal-case font-medium">
                              Auto-populates to your daily schedule
                            </span>
                          </div>

                          {steps.length === 0 ? (
                            <p className="text-xs sm:text-sm text-slate-400 py-2 italic">No discrete modality steps defined.</p>
                          ) : (
                            <div className="space-y-2.5">
                              {steps.map((step: any, idx: number) => {
                                const mod = step.modality
                                const modName = mod?.display_name || mod?.name || `Step ${idx + 1}`
                                const category = mod?.category
                                const timing = step.timing_slot || mod?.default_timing_slot || 'anytime'
                                const dose = step.dose_or_exposure || mod?.dose_or_exposure || step.dose_text
                                const instructions = step.notes || step.administration_conditions || mod?.instructions

                                return (
                                  <div 
                                    key={step.id || idx}
                                    className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                  >
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="w-6 h-6 rounded-full bg-purple-950/80 border border-purple-700/60 text-purple-300 text-xs font-mono font-extrabold flex items-center justify-center shrink-0">
                                          {idx + 1}
                                        </span>
                                        <span className="text-sm sm:text-base font-extrabold text-white">
                                          {modName}
                                        </span>
                                        {category && (
                                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                                            {category}
                                          </span>
                                        )}
                                        <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                                          {timing.replace(/_/g, ' ')}
                                        </span>
                                      </div>

                                      {dose && (
                                        <div className="text-xs sm:text-sm text-emerald-400 font-mono pl-8 font-bold">
                                          Dose / Exposure: {formatTemp(dose)}
                                        </div>
                                      )}

                                      {instructions && (
                                        <p className="text-xs sm:text-sm text-slate-300 pl-8 line-clamp-2 leading-relaxed">
                                          {instructions}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* Footer Action Buttons for Expanded Protocol */}
                        <div className="pt-3.5 border-t border-slate-800/80 space-y-2.5">
                          {/* Top: Primary Enroll Button (Full Width on mobile, right-aligned on desktop) */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                onClose()
                                router.push(`/protocols/${protocol.id}`)
                              }}
                              className="text-xs sm:text-sm text-purple-300 hover:text-purple-200 font-extrabold flex items-center gap-1.5 hover:underline cursor-pointer py-1"
                            >
                              <ExternalLink size={16} />
                              <span>Open Deep-Dive Protocol Page ↗</span>
                            </button>

                            <div className="flex items-center gap-2.5 w-full sm:w-auto">
                              <button
                                type="button"
                                onClick={(e) => handleAddToBench(protocol.id, e)}
                                disabled={savingBenchId === protocol.id}
                                className="flex-1 sm:flex-initial px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-extrabold text-xs sm:text-sm border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                title="Save to Bench without adding to today's schedule"
                              >
                                <Inbox size={16} className="text-blue-400" />
                                <span>{savingBenchId === protocol.id ? 'Saving...' : 'Save to Bench'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleEnrollToday(protocol.id, e)}
                                disabled={enrollingId === protocol.id}
                                className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                              >
                                <Plus size={16} />
                                <span>{enrollingId === protocol.id ? 'Enrolling...' : 'Enroll for Today'}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer & Floating Comparison Bar */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-800 bg-slate-950/80 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-slate-300 font-medium flex items-center gap-2">
            <span>{protocols.length} Master Protocols</span>
            {compareIds.length > 0 && (
              <span className="text-purple-300 font-extrabold">
                • {compareIds.length} Selected for Comparison
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {compareIds.length >= 2 && !isComparing && (
              <button
                type="button"
                onClick={() => setIsComparing(true)}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 cursor-pointer animate-pulse"
              >
                <Scale size={16} />
                <span>Compare ({compareIds.length}) Protocols</span>
              </button>
            )}

            <button 
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white rounded-xl font-extrabold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
