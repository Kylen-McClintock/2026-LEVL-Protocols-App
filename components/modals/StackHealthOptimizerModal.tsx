'use client'

import React, { useState, useMemo } from 'react'
import {
  X,
  ShieldAlert,
  Sparkles,
  Zap,
  ArrowRight,
  ExternalLink,
  Check,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Layers,
  ShieldCheck,
  Sun,
  Moon,
  Info,
  Scale,
  Activity
} from 'lucide-react'
import { DailyProtocolTask, Modality, UserProfile, DailyWellbeingCheckin } from '@/lib/types'
import {
  auditRoutineStackHealth,
  RoutineStackHealthReport
} from '@/lib/synergy/routineStackHealthEngine'
import { ProtocolVectorRadar } from '@/components/ui/ProtocolVectorRadar'
import ModalityIcon from '@/components/ui/ModalityIcon'
import { reconcileModalityScheduleAndFutureTasks } from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'

export interface StackHealthOptimizerModalProps {
  isOpen: boolean
  onClose: () => void
  activeTasks: DailyProtocolTask[]
  allModalities: Modality[]
  userProfile?: UserProfile | null
  wellbeingCheckin?: DailyWellbeingCheckin | null
  onOptimizationsApplied?: () => void
}

export const StackHealthOptimizerModal: React.FC<StackHealthOptimizerModalProps> = ({
  isOpen,
  onClose,
  activeTasks,
  allModalities,
  userProfile,
  wellbeingCheckin,
  onOptimizationsApplied
}) => {
  const [activeTab, setActiveTab] = useState<'conflicts' | 'synergies' | 'radar' | 'timeline' | 'pk'>('conflicts')
  const [selectedConflictFixes, setSelectedConflictFixes] = useState<Record<string, boolean>>({})
  const [selectedSynergyFixes, setSelectedSynergyFixes] = useState<Record<string, boolean>>({})
  const [isApplying, setIsApplying] = useState(false)
  const [appliedSuccess, setAppliedSuccess] = useState(false)

  // 1. Run live Stack Health Audit
  const auditReport: RoutineStackHealthReport = useMemo(() => {
    return auditRoutineStackHealth(activeTasks, allModalities, userProfile, wellbeingCheckin)
  }, [activeTasks, allModalities, userProfile, wellbeingCheckin])

  // 2. Initialize default fix selections (all checked on)
  React.useEffect(() => {
    if (auditReport) {
      const initConflicts: Record<string, boolean> = {}
      auditReport.conflicts.forEach(c => {
        initConflicts[c.id] = true
      })
      setSelectedConflictFixes(initConflicts)

      const initSynergies: Record<string, boolean> = {}
      auditReport.synergyUnlocks.forEach(s => {
        if (s.suggestedTimingShift) {
          initSynergies[s.id] = true
        }
      })
      setSelectedSynergyFixes(initSynergies)
    }
  }, [auditReport])

  // If initial tab is conflicts but there are none, default to synergies or radar
  React.useEffect(() => {
    if (auditReport && auditReport.conflicts.length === 0) {
      if (auditReport.synergyUnlocks.length > 0) {
        setActiveTab('synergies')
      } else {
        setActiveTab('radar')
      }
    }
  }, [auditReport?.conflicts.length, auditReport?.synergyUnlocks.length])

  if (!isOpen) return null

  const {
    overallScore,
    healthGrade,
    conflicts,
    synergyUnlocks,
    activeSynergies,
    timelineGroups,
    currentRadarFingerprint,
    optimizedRadarFingerprint,
    summaryMessage
  } = auditReport

  // Counts of selected fixes
  const selectedConflictCount = Object.values(selectedConflictFixes).filter(Boolean).length
  const selectedSynergyCount = Object.values(selectedSynergyFixes).filter(Boolean).length
  const totalFixesCount = selectedConflictCount + selectedSynergyCount

  const handleToggleConflictFix = (id: string) => {
    setSelectedConflictFixes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleToggleSynergyFix = (id: string) => {
    setSelectedSynergyFixes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // 3. 1-Click Auto-Resolve Execution across Database & Future Schedule
  const handleApplyAllOptimizations = async () => {
    if (isApplying || totalFixesCount === 0) return
    setIsApplying(true)

    try {
      const localUserId = getLocalUserId()

      // A. Apply Conflict Auto-Fixes
      for (const conflict of conflicts) {
        if (selectedConflictFixes[conflict.id]) {
          await reconcileModalityScheduleAndFutureTasks(localUserId, conflict.autoFix.modalityIdToShift, {
            customTiming: conflict.autoFix.targetTimingString
          })
        }
      }

      // B. Apply Synergy Unlock Timing Shifts
      for (const unlock of synergyUnlocks) {
        if (unlock.suggestedTimingShift && selectedSynergyFixes[unlock.id]) {
          await reconcileModalityScheduleAndFutureTasks(localUserId, unlock.modalityId, {
            customTiming: unlock.suggestedTimingShift.targetTimingString
          })
        }
      }

      setAppliedSuccess(true)
      setTimeout(() => {
        setIsApplying(false)
        if (onOptimizationsApplied) onOptimizationsApplied()
        onClose()
      }, 1200)
    } catch (err) {
      console.error('Error applying routine stack optimizations:', err)
      setIsApplying(false)
    }
  }

  // Theme color accents based on health grade
  const isOptimal = overallScore >= 90
  const isCritical = auditReport.criticalCount > 0
  const bannerGlow = isCritical
    ? 'from-rose-600 via-amber-600 to-purple-600'
    : isOptimal
    ? 'from-emerald-500 via-teal-500 to-cyan-400'
    : 'from-amber-500 via-purple-600 to-indigo-600'

  const scoreBadgeColor = isCritical
    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    : isOptimal
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-zinc-950/95 border border-zinc-800 rounded-3xl shadow-2xl shadow-purple-950/40 text-white overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Glow Header Accent Bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${bannerGlow}`} />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-start justify-between gap-3 shrink-0 bg-zinc-900/40">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${scoreBadgeColor}`}>
                Stack Health: {overallScore}/100 • {healthGrade}
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                {auditReport.activeModalityCount} Modalities Audited
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-extrabold text-white mt-1 flex items-center gap-2">
              <Scale size={20} className="text-purple-400 shrink-0" />
              <span>Routine Health & Conflict Optimizer</span>
            </h2>
            <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
              {summaryMessage}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Top Metric Bar */}
        <div className="px-4 py-2.5 bg-zinc-900/70 border-b border-zinc-800/80 shrink-0 grid grid-cols-3 gap-2 text-center sm:text-left">
          {/* Conflicts */}
          <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-center">
            <span className="text-[10px] text-zinc-400 block uppercase font-mono">Blunting Conflicts</span>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
              <ShieldAlert size={14} className={conflicts.length > 0 ? 'text-amber-400' : 'text-emerald-400'} />
              <span className={`text-xs sm:text-sm font-bold ${conflicts.length > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                {conflicts.length === 0 ? '0 Detected' : `${conflicts.length} Active`}
              </span>
            </div>
          </div>

          {/* Synergy Unlocks */}
          <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-center">
            <span className="text-[10px] text-zinc-400 block uppercase font-mono">Synergy Unlocks</span>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
              <Sparkles size={14} className="text-cyan-400" />
              <span className="text-xs sm:text-sm font-bold text-cyan-300">
                {synergyUnlocks.length} Available
              </span>
            </div>
          </div>

          {/* Active Synergies */}
          <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-center">
            <span className="text-[10px] text-zinc-400 block uppercase font-mono">Active Synergies</span>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-xs sm:text-sm font-bold text-emerald-300">
                {activeSynergies.length} Preserved
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 pt-2 border-b border-zinc-800 bg-zinc-900/30 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('conflicts')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'conflicts'
                ? 'border-amber-400 text-amber-300 bg-zinc-800/60'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldAlert size={14} />
            <span>Timing Conflicts</span>
            {conflicts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                {conflicts.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('synergies')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'synergies'
                ? 'border-cyan-400 text-cyan-300 bg-zinc-800/60'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles size={14} />
            <span>Synergy Unlocks</span>
            {synergyUnlocks.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-mono">
                {synergyUnlocks.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('radar')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'radar'
                ? 'border-purple-400 text-purple-300 bg-zinc-800/60'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers size={14} />
            <span>Overlaid Coverage Radar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-emerald-400 text-emerald-300 bg-zinc-800/60'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock size={14} />
            <span>24h Routine Flow</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pk')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'pk'
                ? 'border-indigo-400 text-indigo-300 bg-zinc-800/60'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity size={14} />
            <span>Pharmacokinetics (PK)</span>
            {auditReport.pkCurves.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">
                {auditReport.pkCurves.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* TAB 1: TIMING CONFLICTS */}
          {activeTab === 'conflicts' && (
            <div className="space-y-3">
              {conflicts.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 space-y-2">
                  <ShieldCheck size={36} className="mx-auto text-emerald-400" />
                  <h3 className="font-extrabold text-base text-white">Zero Biochemical Conflicts Detected!</h3>
                  <p className="text-xs text-zinc-300 max-w-md mx-auto">
                    Your scheduled modalities are physiologically spaced to preserve exercise hormesis, mitochondrial biogenesis, and sleep architecture.
                  </p>
                </div>
              ) : (
                conflicts.map(conflict => {
                  const isChecked = selectedConflictFixes[conflict.id] !== false
                  return (
                    <div
                      key={conflict.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        isChecked
                          ? 'bg-zinc-900/90 border-amber-500/50 shadow-lg shadow-amber-950/20'
                          : 'bg-zinc-900/40 border-zinc-800 opacity-75'
                      }`}
                    >
                      {/* Top Header with Conflict Type & Severity */}
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/80 mb-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-lg border ${
                            conflict.severity === 'critical'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}>
                            {conflict.severity === 'critical' ? '🔴 Critical Antagonism' : '🟡 Timing & Blunting Conflict'}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400 capitalize">
                            {conflict.conflictType.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Interactive Auto-Fix Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleConflictFix(conflict.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30 hover:bg-amber-400'
                              : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                          }`}
                        >
                          <Check size={14} className={isChecked ? 'text-black stroke-[3]' : 'opacity-0'} />
                          <span>{isChecked ? 'Auto-Fix Active' : 'Keep Conflict'}</span>
                        </button>
                      </div>

                      {/* 1. The Two Conflicting Modalities Display */}
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3 bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/90 mb-3.5">
                        {/* Modality A: The Trigger / Blunting Factor */}
                        <div className="p-3 rounded-lg bg-zinc-900/80 border border-amber-500/30 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                              Interfering Modality
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                              <Clock size={11} className="text-amber-400" />
                              {conflict.modalityAScheduledTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                              <ModalityIcon
                                modality={{
                                  id: conflict.modalityAId,
                                  name: conflict.modalityAName,
                                  category: conflict.modalityACategory,
                                  icon: conflict.modalityAIcon
                                }}
                                size={18}
                              />
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-extrabold text-sm text-white truncate">
                                {conflict.modalityAName}
                              </h5>
                              <span className="text-[11px] text-zinc-400 font-mono block truncate">
                                {conflict.modalityADose || conflict.modalityASlot}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Collision Center Connector */}
                        <div className="flex flex-col items-center justify-center px-1 py-0.5 text-center">
                          <div className="flex items-center gap-1 text-rose-400 font-mono font-black text-xs">
                            <Zap size={13} className="text-rose-400 fill-rose-400/20" />
                            <span>BLUNTS</span>
                            <ArrowRight size={13} className="text-rose-400" />
                          </div>
                          <span className="text-[10px] font-mono text-amber-300 font-bold mt-0.5">
                            {conflict.gapFormatted}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-500 mt-0.5">
                            Needs ≥{conflict.requiredSpacingFormatted}
                          </span>
                        </div>

                        {/* Modality B: The Target / Affected Adaptation */}
                        <div className="p-3 rounded-lg bg-zinc-900/80 border border-rose-500/30 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                              Target Adaptation At Risk
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                              <Clock size={11} className="text-rose-400" />
                              {conflict.modalityBScheduledTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                              <ModalityIcon
                                modality={{
                                  id: conflict.modalityBId,
                                  name: conflict.modalityBName,
                                  category: conflict.modalityBCategory,
                                  icon: conflict.modalityBIcon
                                }}
                                size={18}
                              />
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-extrabold text-sm text-white truncate">
                                {conflict.modalityBName}
                              </h5>
                              <span className="text-[11px] text-zinc-400 font-mono block truncate">
                                {conflict.modalityBDose || conflict.modalityBSlot}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. Specific Conflict Explanation & Biochemical Rationale */}
                      <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-amber-500/30 space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-amber-300">
                          <AlertCircle size={15} className="shrink-0 text-amber-400" />
                          <h4 className="font-bold text-xs sm:text-sm text-white">
                            {conflict.headline}
                          </h4>
                        </div>
                        
                        <p className="text-xs text-zinc-200 leading-relaxed pl-5">
                          {conflict.specificExplanation || conflict.rationale}
                        </p>

                        {/* Pathway & Loss Indicators */}
                        <div className="flex items-center gap-2 pl-5 pt-1 flex-wrap text-[11px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30">
                            Impact: {conflict.clinicalEffectDelta}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                            Pathway: {conflict.targetPathway}
                          </span>
                          {conflict.pubmedUrl && (
                            <a
                              href={conflict.pubmedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-purple-300 hover:text-purple-200 underline ml-auto"
                            >
                              <span>Evidence Paper</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* 3. Actionable Prescribed Fix Preview */}
                      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/30 via-zinc-900 to-zinc-950 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-amber-300 font-mono font-bold text-[11px]">
                            <Clock size={13} className="text-amber-400" />
                            <span>PRESCRIBED SCHEDULE FIX:</span>
                          </div>
                          <p className="text-zinc-200 font-medium text-xs">
                            {conflict.autoFix.plainEnglishFix || conflict.autoFix.description}
                          </p>
                        </div>
                        <div className="shrink-0 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-right">
                          <span className="text-[10px] text-zinc-400 block font-mono">Recommended Target</span>
                          <span className="text-amber-300 font-bold font-mono text-xs">{conflict.autoFix.targetTimingString}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* TAB 2: SYNERGY UNLOCKS */}
          {activeTab === 'synergies' && (
            <div className="space-y-4">
              {synergyUnlocks.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-2">
                      <Sparkles size={14} />
                      <span>Available Timing Unlocks ({synergyUnlocks.length})</span>
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Simple Timing Shifts for Maximum Bioavailability
                    </span>
                  </div>

                  {synergyUnlocks.map(unlock => {
                    const isChecked = selectedSynergyFixes[unlock.id] !== false
                    return (
                      <div
                        key={unlock.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isChecked
                            ? 'bg-cyan-950/20 border-cyan-500/40'
                            : 'bg-zinc-900/30 border-zinc-800 opacity-80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-white px-2.5 py-0.5 rounded-lg bg-zinc-800 border border-zinc-700">
                                {unlock.modalityName}
                              </span>
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                +30-50% Absorption
                              </span>
                            </div>
                            <h4 className="font-bold text-white text-sm pt-1">
                              {unlock.headline}
                            </h4>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              {unlock.rationale}
                            </p>
                            <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] font-mono">
                              <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                                {unlock.clinicalEffectDelta}
                              </span>
                              {unlock.pubmedUrl && (
                                <a
                                  href={unlock.pubmedUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline"
                                >
                                  <span>Evidence</span>
                                  <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          </div>

                          {unlock.suggestedTimingShift && (
                            <button
                              type="button"
                              onClick={() => handleToggleSynergyFix(unlock.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                isChecked
                                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                                  : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                              }`}
                            >
                              <Check size={14} className={isChecked ? 'text-black stroke-[3]' : 'opacity-0'} />
                              <span>{isChecked ? 'Shift Scheduled' : 'Keep Current'}</span>
                            </button>
                          )}
                        </div>

                        {unlock.suggestedTimingShift && (
                          <div className="mt-3 p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-cyan-400 shrink-0" />
                              <span className="text-zinc-400 font-mono">Optimized Timing:</span>
                              <span className="text-cyan-200 font-bold">{unlock.suggestedTimingShift.description}</span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-500">
                              ➔ {unlock.suggestedTimingShift.targetSlot}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Active Synergies Showcase */}
              {activeSynergies.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-2">
                      <ShieldCheck size={14} />
                      <span>Active Synergies in Your Stack ({activeSynergies.length})</span>
                    </h3>
                    <span className="text-[11px] text-emerald-400/80 font-mono">Working in Harmony</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {activeSynergies.map(syn => (
                      <div
                        key={syn.id}
                        className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-white">
                            {syn.modalityAName} + {syn.modalityBName}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                            {syn.clinicalEffectDelta}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-200/90 font-medium">
                          {syn.headline}
                        </p>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          {syn.rationale}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OVERLAID VECTOR RADAR */}
          {activeTab === 'radar' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3 text-center">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Longevity Vector Delivery: Current vs. Conflict-Free Optimized
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-lg mx-auto">
                    The purple outline represents your current effective routine (blunted by timing conflicts). The cyan envelope represents the exact same routine with conflicts resolved and synergies unlocked.
                  </p>
                </div>

                {/* Overlaid Vector Radar Chart */}
                <div className="flex justify-center py-2">
                  <ProtocolVectorRadar
                    protocols={[currentRadarFingerprint, optimizedRadarFingerprint]}
                    variant="full"
                    size={420}
                    showLegend={true}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-left pt-2">
                  <div className="p-3 rounded-xl bg-zinc-950 border border-purple-500/30">
                    <span className="text-[10px] font-mono text-purple-400 uppercase font-bold block">
                      Current Effective Stack
                    </span>
                    <span className="text-xs text-zinc-300 mt-1 block">
                      Blunted by {conflicts.length} timing conflict{conflicts.length === 1 ? '' : 's'}. Reduced VO2 max adaptation and muscle protein synthesis signaling.
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950 border border-cyan-500/40">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block">
                      Optimized Conflict-Free Envelope
                    </span>
                    <span className="text-xs text-cyan-200 mt-1 block">
                      +12% to +25% higher effective biological protection without adding any additional modalities or time commitment.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 24H ROUTINE FLOW */}
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Chronological Day Architecture
                </h3>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {timelineGroups.length} Active Timing Windows
                </span>
              </div>

              <div className="space-y-3">
                {timelineGroups.map(group => (
                  <div
                    key={group.slot}
                    className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-purple-400" />
                      <span className="text-xs font-bold text-white font-mono">{group.label}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        ({group.tasks.length} {group.tasks.length === 1 ? 'task' : 'tasks'})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.tasks.map(t => (
                        <div
                          key={t.taskId}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                            t.hasConflict
                              ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                              : t.hasSynergy
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="font-bold truncate block">{t.modalityName}</span>
                            {t.customDose && (
                              <span className="text-[10px] text-zinc-400 font-mono block">{t.customDose}</span>
                            )}
                            {t.conflictingWith && (
                              <span className="text-[10px] text-rose-300 font-mono block mt-0.5">
                                ⚠️ Clashes with {t.conflictingWith}
                              </span>
                            )}
                          </div>
                          {t.hasConflict && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0">
                              Conflict
                            </span>
                          )}
                          {t.hasSynergy && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                              Synergy
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PHARMACOKINETICS (PK) & BIOMETRIC PROOF */}
          {activeTab === 'pk' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Activity size={14} className="text-indigo-400" />
                    <span>24-Hour Pharmacokinetic Serum Decay Curves</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Mathematical serum concentration models illustrating compound clearance and receptor binding over time.
                  </p>
                </div>
              </div>

              {auditReport.pkCurves.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800 text-zinc-400 text-xs">
                  No active pharmacokinetic conflict compounds (caffeine, metformin, acute resistance training) detected in today's active schedule.
                </div>
              ) : (
                <div className="space-y-3">
                  {auditReport.pkCurves.map(curve => {
                    const svgW = 540
                    const svgH = 120
                    const startH = 6
                    const endH = 24
                    const rangeH = endH - startH

                    const getX = (h: number) => ((h - startH) / rangeH) * (svgW - 40) + 20
                    const getY = (conc: number) => svgH - 20 - (conc / 100) * (svgH - 40)

                    const pathPoints = curve.dataPoints.map(pt => `${getX(pt.hour).toFixed(1)},${getY(pt.concentrationPct).toFixed(1)}`).join(' ')
                    const fillPoints = `20,${svgH - 20} ${pathPoints} ${getX(24).toFixed(1)},${svgH - 20}`

                    return (
                      <div key={curve.id} className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            <span className="text-xs font-bold text-white block">{curve.headline}</span>
                            <span className="text-[11px] text-zinc-400 font-mono">{curve.compoundName} • Elimination Half-Life {curve.halfLifeHours}h</span>
                          </div>
                          {curve.conflictNote && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-950 border border-zinc-700 text-zinc-300">
                              {curve.conflictNote}
                            </span>
                          )}
                        </div>

                        {/* SVG Curve Canvas */}
                        <div className="w-full bg-zinc-950/80 rounded-xl p-2 border border-zinc-800/60 overflow-x-auto">
                          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-28 overflow-visible">
                            <line x1="20" y1={getY(0)} x2={svgW - 20} y2={getY(0)} stroke="#27272A" strokeWidth="1" />
                            <line x1="20" y1={getY(50)} x2={svgW - 20} y2={getY(50)} stroke="#27272A" strokeWidth="1" strokeDasharray="3,3" />
                            <line x1="20" y1={getY(100)} x2={svgW - 20} y2={getY(100)} stroke="#27272A" strokeWidth="1" strokeDasharray="3,3" />

                            {curve.criticalThresholdHour && (
                              <>
                                <line
                                  x1={getX(curve.criticalThresholdHour)}
                                  y1="10"
                                  x2={getX(curve.criticalThresholdHour)}
                                  y2={svgH - 20}
                                  stroke="#F43F5E"
                                  strokeWidth="1.5"
                                  strokeDasharray="4,4"
                                />
                                <text
                                  x={getX(curve.criticalThresholdHour) - 4}
                                  y="16"
                                  fill="#FDA4AF"
                                  fontSize="9"
                                  textAnchor="end"
                                  fontFamily="monospace"
                                >
                                  {curve.thresholdLabel || 'Bedtime'}
                                </text>
                              </>
                            )}

                            <polygon points={fillPoints} fill={curve.fillColor} />
                            <polyline points={pathPoints} fill="none" stroke={curve.strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                            {[6, 9, 12, 15, 18, 21, 24].map(h => (
                              <text key={h} x={getX(h)} y={svgH - 6} fill="#71717A" fontSize="9" textAnchor="middle" fontFamily="monospace">
                                {h === 12 ? '12 PM' : h === 24 ? '12 AM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
                              </text>
                            ))}
                          </svg>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Personal Check-in Evidence Card */}
              <div className="p-4 rounded-2xl bg-indigo-950/25 border border-indigo-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-400" />
                  <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wider font-mono">
                    Personalized Check-in &amp; Sleep Verification
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {auditReport.biometricProofNotes.map((note, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / 1-Click Action */}
        <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="text-xs text-zinc-400">
            {totalFixesCount > 0 ? (
              <span>
                <strong className="text-white">{totalFixesCount}</strong> timing tweak{totalFixesCount === 1 ? '' : 's'} selected to resolve blunting conflicts.
              </span>
            ) : (
              <span>No timing changes selected.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              disabled={isApplying || totalFixesCount === 0}
              onClick={handleApplyAllOptimizations}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                appliedSuccess
                  ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                  : totalFixesCount > 0
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-purple-600/30'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {isApplying ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Syncing Schedules...</span>
                </>
              ) : appliedSuccess ? (
                <>
                  <CheckCircle2 size={14} className="stroke-[3]" />
                  <span>Optimizations Applied!</span>
                </>
              ) : (
                <>
                  <Zap size={14} className="text-amber-300 fill-amber-300" />
                  <span>Apply {totalFixesCount} Timing Optimizations</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StackHealthOptimizerModal
