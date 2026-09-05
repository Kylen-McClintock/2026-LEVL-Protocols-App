'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Protocol, ProtocolStep } from '@/lib/types'
import {
  X,
  Scale,
  Check,
  Sparkles,
  Layers,
  Clock,
  ShieldCheck,
  User,
  Plus,
  Dna,
  Zap,
  Activity,
  AlertTriangle,
  BookmarkPlus,
  ArrowRight,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Calendar
} from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { addProtocolToToday, addProtocolToBench } from '@/lib/data'
import {
  calculateStackedProtocolsCoverage,
  findTopComplementaryProtocols,
  RadarMode,
  StackedProtocolsAnalysis,
  ComplementaryProtocolRecommendation
} from '@/lib/synergy/protocolStackEngine'
import { ProtocolVectorRadar } from '@/components/ui/ProtocolVectorRadar'
import { getProtocolFingerprint } from '@/lib/data/protocolFingerprints'

export type ProtocolCompareModalProps = {
  isOpen: boolean
  onClose: () => void
  protocolA?: Protocol | null
  protocolB?: Protocol | null
  protocols?: Protocol[] // Multi-protocol array if launched with 2+ protocols
  allProtocols?: Protocol[] // Full protocol library for complementary finder and adding
  activeTodayProtocols?: Protocol[] // User's active protocols in Today
  onSuccess?: () => void
}

export default function ProtocolCompareModal({
  isOpen,
  onClose,
  protocolA,
  protocolB,
  protocols: initialProtocols,
  allProtocols = [],
  activeTodayProtocols = [],
  onSuccess
}: ProtocolCompareModalProps) {
  const [activeTab, setActiveTab] = useState<'radar' | 'schedule' | 'matrix'>('radar')
  const [radarMode, setRadarMode] = useState<RadarMode>('vectors')
  const [stackedProtocols, setStackedProtocols] = useState<Protocol[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [actionDone, setActionDone] = useState<string | null>(null)
  const [showAddDropdown, setShowAddDropdown] = useState(false)
  const [hoveredAxisId, setHoveredAxisId] = useState<string | null>(null)

  // Synchronize incoming protocol props when modal opens
  useEffect(() => {
    if (initialProtocols && initialProtocols.length > 0) {
      setStackedProtocols(initialProtocols)
    } else {
      const pair = [protocolA, protocolB].filter(Boolean) as Protocol[]
      if (pair.length > 0) {
        setStackedProtocols(pair)
      }
    }
  }, [initialProtocols, protocolA, protocolB, isOpen])

  // Run the multi-protocol stacking calculus whenever stackedProtocols or radarMode changes
  const stackAnalysis: StackedProtocolsAnalysis = useMemo(() => {
    return calculateStackedProtocolsCoverage(stackedProtocols, radarMode)
  }, [stackedProtocols, radarMode])

  // Find complementary protocols from remaining library
  const complementaryRecommendations: ComplementaryProtocolRecommendation[] = useMemo(() => {
    return findTopComplementaryProtocols(stackedProtocols, allProtocols, radarMode, 3)
  }, [stackedProtocols, allProtocols, radarMode])

  // Fallback library options for manually adding protocols
  const availableToAdd = useMemo(() => {
    const currentIds = new Set(stackedProtocols.map(p => p.id))
    return allProtocols.filter(p => !currentIds.has(p.id))
  }, [stackedProtocols, allProtocols])

  if (!isOpen || stackedProtocols.length === 0) return null

  const handleAddProtocol = (proto: Protocol) => {
    setStackedProtocols(prev => [...prev, proto])
    setShowAddDropdown(false)
  }

  const handleRemoveProtocol = (protoId: string) => {
    if (stackedProtocols.length <= 1) return
    setStackedProtocols(prev => prev.filter(p => p.id !== protoId))
  }

  const handleLoadActiveStack = () => {
    if (activeTodayProtocols.length > 0) {
      setStackedProtocols(activeTodayProtocols)
    }
  }

  const handleEnrollAll = async () => {
    setIsProcessing(true)
    const localUserId = getLocalUserId()
    const todayStr = new Date().toISOString().split('T')[0]
    
    for (const proto of stackedProtocols) {
      await addProtocolToToday(localUserId, todayStr, proto.id)
    }
    
    setIsProcessing(false)
    setActionDone(`Enrolled in ${stackedProtocols.length} Stacked Protocols!`)
    if (onSuccess) onSuccess()
    setTimeout(() => {
      onClose()
      setActionDone(null)
    }, 1200)
  }

  const handleBenchAll = async () => {
    setIsProcessing(true)
    const localUserId = getLocalUserId()
    
    for (const proto of stackedProtocols) {
      await addProtocolToBench(localUserId, proto.id)
    }
    
    setIsProcessing(false)
    setActionDone(`Saved ${stackedProtocols.length} Protocols to Bench!`)
    if (onSuccess) onSuccess()
    setTimeout(() => {
      onClose()
      setActionDone(null)
    }, 1200)
  }

  // Modality overlap calculation for methodology matrix
  const protoA = stackedProtocols[0]
  const protoB = stackedProtocols[1] || stackedProtocols[0]
  const stepsA: any[] = protoA?.steps || protoA?.protocol_steps || []
  const stepsB: any[] = protoB?.steps || protoB?.protocol_steps || []

  const modNamesA = new Set(stepsA.map(s => s.notes || s.modality_id || s.stack_group || s.timing_slot).filter(Boolean))
  const modNamesB = new Set(stepsB.map(s => s.notes || s.modality_id || s.stack_group || s.timing_slot).filter(Boolean))

  const overlappingNames = Array.from(modNamesA).filter(name => modNamesB.has(name))
  const uniqueNamesA = Array.from(modNamesA).filter(name => !modNamesB.has(name))
  const uniqueNamesB = Array.from(modNamesB).filter(name => !modNamesA.has(name))

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity" onClick={onClose} />

      <div className="relative bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-emerald-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shadow-lg">
              <Layers size={20} className="text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                  Protocol Longevity Fingerprints & Stacking Studio
                </h2>
                <span className="text-[10px] uppercase font-mono font-bold bg-purple-500/20 border border-purple-500/40 text-purple-300 px-2 py-0.5 rounded-full">
                  {stackedProtocols.length} {stackedProtocols.length === 1 ? 'Protocol' : 'Stacked'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-protocol biometric vector analysis, hallmark synergy, and clash harmonization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {activeTodayProtocols.length > 0 && (
              <button
                onClick={handleLoadActiveStack}
                className="text-[11px] font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Load your active protocols from Today"
              >
                <Calendar size={13} className="text-cyan-400" />
                <span>My Active Stack</span>
              </button>
            )}

            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PROTOCOL SELECTOR BAR (CHIPS + ADD DROPDOWN) */}
        <div className="px-4 py-3 bg-slate-900/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1 mr-1">
              Active Stack:
            </span>

            {stackedProtocols.map((proto, idx) => (
              <div
                key={proto.id}
                className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-2.5 py-1 rounded-xl text-xs font-extrabold text-white shadow-sm"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: idx === 0 ? '#A855F7' : idx === 1 ? '#06B6D4' : idx === 2 ? '#F59E0B' : '#EC4899' }} />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">{proto.name}</span>
                {stackedProtocols.length > 1 && (
                  <button
                    onClick={() => handleRemoveProtocol(proto.id)}
                    className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition-colors ml-1 cursor-pointer"
                    title="Remove protocol from stack"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}

            {/* Add Protocol Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowAddDropdown(!showAddDropdown)}
                disabled={availableToAdd.length === 0}
                className="flex items-center gap-1.5 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/40 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
              >
                <Plus size={13} /> Add Protocol to Stack
              </button>

              {/* Add Protocol Dropdown */}
              {showAddDropdown && availableToAdd.length > 0 && (
                <div className="absolute top-full mt-2 left-0 z-30 w-72 max-h-64 overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl p-1.5 shadow-2xl space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase">
                    Select Protocol to Stack:
                  </div>
                  {availableToAdd.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleAddProtocol(p)}
                      className="w-full text-left px-2.5 py-2 hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-200 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <span className="truncate flex-1">{p.name}</span>
                      <Plus size={14} className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* VIEW CONTROLLER TABS */}
          <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('radar')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'radar'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity size={13} /> Stack Radar
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'schedule'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock size={13} /> Schedule & Clashes
              {stackAnalysis.clashes.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'matrix'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scale size={13} /> Matrix Diff
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* Feedback banner */}
          {actionDone && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 animate-in fade-in">
              <Check size={16} /> {actionDone}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 1: STACK RADAR & BIOMETRIC GAP-FILL STUDIO */}
          {/* ================================================================= */}
          {activeTab === 'radar' && (
            <div className="space-y-6">
              
              {/* Radar Mode Switcher Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <div>
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-400" />
                    Biometric Fingerprint & Stacked Coverage Envelope
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Hover on vertices to inspect exact scores and individual protocol contributions
                  </p>
                </div>

                {/* THE 8 VECTORS ⇄ 12 HALLMARKS OF AGING TOGGLE */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 shrink-0">
                  <button
                    onClick={() => setRadarMode('vectors')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      radarMode === 'vectors'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Dna size={14} className={radarMode === 'vectors' ? 'text-white' : 'text-purple-400'} />
                    <span>8 Longevity Vectors</span>
                  </button>
                  <button
                    onClick={() => setRadarMode('hallmarks')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      radarMode === 'hallmarks'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Activity size={14} className={radarMode === 'hallmarks' ? 'text-white' : 'text-emerald-400'} />
                    <span>12 Hallmarks of Aging</span>
                  </button>
                </div>
              </div>

              {/* Central Grid: Radar Chart + Stacked Scorecard */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                
                {/* Left: The Single Unified SVG Radar */}
                <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-900/40 border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-inner">
                  <ProtocolVectorRadar
                    protocols={stackAnalysis.protocols}
                    stackedScores={stackAnalysis.stackedScores}
                    mode={radarMode}
                    variant="full"
                    highlightAxisId={hoveredAxisId}
                    onHoverAxis={setHoveredAxisId}
                    showLegend={true}
                  />
                </div>

                {/* Right: Gap-Fill Scorecard & Systemic Expansion */}
                <div className="lg:col-span-5 flex flex-col space-y-4">
                  
                  {/* Systemic Coverage Stats Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                        Total Systemic Coverage
                      </span>
                      <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                        {stackAnalysis.totalCoveragePct}% Systemic Score
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-black text-white font-mono">
                        {stackAnalysis.totalCoveragePct}%
                      </div>
                      {stackAnalysis.coverageExpansionPct > 0 && (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                          <Plus size={12} /> {stackAnalysis.coverageExpansionPct}% expansion over single protocol
                        </span>
                      )}
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-purple-500 h-full transition-all duration-500"
                        style={{ width: `${stackAnalysis.singleBestCoveragePct}%` }}
                        title={`Baseline Primary: ${stackAnalysis.singleBestCoveragePct}%`}
                      />
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full transition-all duration-500"
                        style={{ width: `${stackAnalysis.coverageExpansionPct}%` }}
                        title={`Stacked Expansion: +${stackAnalysis.coverageExpansionPct}%`}
                      />
                    </div>
                  </div>

                  {/* Biometric Gap Fills List */}
                  <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Zap size={14} className="text-amber-400" />
                        Biometric Blindspots Filled
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {stackAnalysis.gapFills.length} Axes Lifted
                      </span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {stackAnalysis.gapFills.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-2">
                          Add a complementary protocol to see how blindspots get filled.
                        </p>
                      ) : (
                        stackAnalysis.gapFills.map(gf => (
                          <div
                            key={gf.axisId}
                            onMouseEnter={() => setHoveredAxisId(gf.axisId)}
                            onMouseLeave={() => setHoveredAxisId(null)}
                            className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-amber-500/40 transition-all flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-200 truncate">{gf.label}</div>
                              <div className="text-[10px] text-slate-400 truncate">
                                Filled by <span className="text-purple-300 font-medium">{gf.contributingProtocolName}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] font-mono text-slate-400 line-through">
                                {gf.singleBestScore}
                              </span>
                              <ArrowRight size={11} className="text-emerald-400" />
                              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                                {gf.stackedScore} (+{gf.delta})
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* COMPLEMENTARY PROTOCOL FINDER STRIP */}
              {complementaryRecommendations.length > 0 && (
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-950/30 via-slate-900 to-indigo-950/30 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-purple-400" />
                      <h3 className="text-xs sm:text-sm font-extrabold text-white">
                        Recommended Complementary Protocols for Your Stack
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300">
                      Based on current biometric valleys
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {complementaryRecommendations.map(rec => (
                      <div
                        key={rec.protocol.id}
                        className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                              +{rec.gapGainPoints} Gap Points
                            </span>
                            {rec.clashesWithStackCount === 0 && (
                              <span className="text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                                <ShieldCheck size={12} /> 0 Clashes
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-white line-clamp-1">{rec.protocol.name}</h4>
                          <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
                            {rec.topFilledGaps.map((gap, i) => (
                              <div key={i} className="text-purple-300 font-medium truncate">• {gap}</div>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddProtocol(rec.protocol)}
                          className="w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <Plus size={13} /> Add to Stack
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: COMBINED SCHEDULE & CLASH HARMONIZATION */}
          {/* ================================================================= */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              
              {/* Clash Status Banner */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                stackAnalysis.clashes.length === 0
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
              }`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  stackAnalysis.clashes.length === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {stackAnalysis.clashes.length === 0 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                </div>

                <div className="space-y-1">
                  <div className="font-extrabold text-sm text-white">
                    {stackAnalysis.clashes.length === 0
                      ? 'Zero Antagonistic Timing Clashes Verified'
                      : `${stackAnalysis.clashes.length} Biological Interaction Harmonized via Automated Scheduling`}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {stackAnalysis.clashes.length === 0
                      ? 'All modalities across your stacked protocols occupy compatible circadian windows with positive physiological synergy.'
                      : 'Our chronobiological engine has shifted conflicting steps across the day to prevent cellular interference (e.g. separating acute cold water immersion from hypertrophic resistance signaling).'}
                  </p>
                </div>
              </div>

              {/* Harmonized Timeline Blocks */}
              <div className="space-y-4">
                {stackAnalysis.scheduleBlocks.map(block => (
                  <div key={block.blockId} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                      <Clock size={15} className="text-purple-400" />
                      <h4 className="text-xs font-black text-white uppercase tracking-wide">
                        {block.blockTitle} ({block.items.length})
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {block.items.map(item => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border text-xs flex flex-col justify-between space-y-1.5 ${
                            item.isClashShifted
                              ? 'bg-amber-950/20 border-amber-500/30'
                              : 'bg-slate-950/80 border-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-white leading-snug">{item.modalityName}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                              {item.timingSlot}
                            </span>
                          </div>

                          <div className="text-[11px] text-purple-300 font-medium truncate">
                            From {item.protocolName}
                          </div>

                          {/* Clash Resolution Note */}
                          {item.clashResolutionNote && (
                            <div className="text-[10px] text-amber-300 bg-amber-950/60 border border-amber-500/30 p-1.5 rounded-lg flex items-start gap-1.5 mt-1">
                              <Zap size={12} className="shrink-0 text-amber-400 mt-0.5" />
                              <span><strong>Retimed:</strong> {item.clashResolutionNote}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: METHODOLOGY MATRIX DIFF (PRESERVING EXISTING FUNCTIONALITY) */}
          {/* ================================================================= */}
          {activeTab === 'matrix' && (
            <div className="space-y-6">
              
              {/* Protocol Cards Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Protocol A */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-purple-500/30 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase font-mono font-extrabold text-purple-300 bg-purple-500/20 border border-purple-500/40 px-2.5 py-0.5 rounded-full">
                        Protocol 1
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-medium truncate">
                        <User size={12} className="text-slate-500" /> {protoA?.source_label || (protoA as any)?.authors || 'Scientific Protocol'}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-white text-base sm:text-lg mt-2 leading-snug">{protoA?.name}</h3>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-3 leading-relaxed">{protoA?.description}</p>
                  </div>
                </div>

                {/* Protocol B */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-teal-500/30 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase font-mono font-extrabold text-teal-300 bg-teal-500/20 border border-teal-500/40 px-2.5 py-0.5 rounded-full">
                        Protocol 2
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-medium truncate">
                        <User size={12} className="text-slate-500" /> {protoB?.source_label || (protoB as any)?.authors || 'Scientific Protocol'}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-white text-base sm:text-lg mt-2 leading-snug">{protoB?.name}</h3>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-3 leading-relaxed">{protoB?.description}</p>
                  </div>
                </div>
              </div>

              {/* Comparison Matrix Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/40 text-xs">
                <div className="grid grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)_minmax(0,1fr)] gap-4 bg-slate-900/80 font-bold text-slate-400 p-3.5 border-b border-slate-800 uppercase tracking-wider text-[11px] items-center">
                  <div>Attribute</div>
                  <div className="text-purple-300 font-extrabold truncate min-w-0">{protoA?.name}</div>
                  <div className="text-teal-300 font-extrabold truncate min-w-0">{protoB?.name}</div>
                </div>

                {/* Total Steps */}
                <div className="grid grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)_minmax(0,1fr)] gap-4 p-3.5 border-b border-slate-800/60 text-slate-200 items-center">
                  <div className="font-semibold text-slate-400">Modalities</div>
                  <div className="font-mono font-bold text-purple-400 min-w-0 break-words">{stepsA.length} Modalities</div>
                  <div className="font-mono font-bold text-teal-400 min-w-0 break-words">{stepsB.length} Modalities</div>
                </div>

                {/* Focus */}
                <div className="grid grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)_minmax(0,1fr)] gap-4 p-3.5 border-b border-slate-800/60 text-slate-200 items-center">
                  <div className="font-semibold text-slate-400">Focus</div>
                  <div className="font-medium text-slate-200 min-w-0 break-words">{protoA?.primary_goal || protoA?.goal || 'Comprehensive Longevity'}</div>
                  <div className="font-medium text-slate-200 min-w-0 break-words">{protoB?.primary_goal || protoB?.goal || 'Comprehensive Longevity'}</div>
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
                      Unique to {protoA?.name} ({uniqueNamesA.length})
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
                      Unique to {protoB?.name} ({uniqueNamesB.length})
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
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/80 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="font-mono font-bold text-white">{stackedProtocols.length} Protocols</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">{stackAnalysis.totalCoveragePct}% Systemic Coverage</span>
            <span>•</span>
            <span className={stackAnalysis.clashes.length === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {stackAnalysis.clashes.length === 0 ? '0 Clashes' : `${stackAnalysis.clashes.length} Harmonized`}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleBenchAll}
              disabled={isProcessing}
              className="flex-1 sm:flex-initial py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <BookmarkPlus size={14} />
              <span>Save Stack to Bench</span>
            </button>

            <button
              onClick={handleEnrollAll}
              disabled={isProcessing}
              className="flex-1 sm:flex-initial py-2.5 px-5 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:opacity-95 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              <span>Enroll in Stacked Protocols</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
