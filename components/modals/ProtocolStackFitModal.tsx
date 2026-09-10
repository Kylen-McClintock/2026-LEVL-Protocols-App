'use client'

import React, { useState, useMemo } from 'react'
import {
  ProtocolStackFitAuditResult,
  UpgradeOpportunityItem,
  StackConflictAlert,
  SynergisticAdditionItem,
  AlreadyCoveredItem
} from '@/lib/synergy/protocolStackFitAuditor'
import { TailoredProtocolAdoptionPlan } from '@/lib/data'
import {
  X,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Check,
  ExternalLink,
  Flame,
  Activity,
  Layers
} from 'lucide-react'

interface ProtocolStackFitModalProps {
  isOpen: boolean
  onClose: () => void
  protocol: any
  auditResult: ProtocolStackFitAuditResult | null
  onAdoptTailoredStack: (plan: TailoredProtocolAdoptionPlan) => Promise<void>
}

export const ProtocolStackFitModal: React.FC<ProtocolStackFitModalProps> = ({
  isOpen,
  onClose,
  protocol,
  auditResult,
  onAdoptTailoredStack
}) => {
  // 1. Interactive upgrade states: upgrade.id -> boolean (true = apply upgrade, false = keep current)
  const [upgradeSelections, setUpgradeSelections] = useState<Record<string, boolean>>({})

  // 2. Interactive addition selections: modality.id -> boolean
  const [additionSelections, setAdditionSelections] = useState<Record<string, boolean>>({})

  // 3. Interactive conflict auto-shift selections: conflict.id -> boolean (true = use conflict-free slot)
  const [conflictAutoShift, setConflictAutoShift] = useState<Record<string, boolean>>({})

  // 4. UI collapse states
  const [showCovered, setShowCovered] = useState(false)
  const [isAdopting, setIsAdopting] = useState(false)

  // Initialize selections once auditResult loads
  React.useEffect(() => {
    if (auditResult) {
      const initUpgrades: Record<string, boolean> = {}
      auditResult.upgrades.forEach(u => {
        initUpgrades[u.id] = u.defaultAction === 'upgrade'
      })
      setUpgradeSelections(initUpgrades)

      const initAdditions: Record<string, boolean> = {}
      auditResult.synergisticAdditions.forEach(a => {
        initAdditions[a.modality.id] = a.checkedByDefault
      })
      setAdditionSelections(initAdditions)

      const initConflicts: Record<string, boolean> = {}
      auditResult.conflicts.forEach(c => {
        initConflicts[c.id] = true
      })
      setConflictAutoShift(initConflicts)
    }
  }, [auditResult])

  if (!isOpen || !auditResult || !protocol) return null

  const { upgrades, conflicts, synergisticAdditions, alreadyCovered, netDelta } = auditResult

  // Calculate live dynamic counts
  const activeUpgradesCount = upgrades.filter(u => upgradeSelections[u.id] !== false).length
  const activeAdditionsCount = synergisticAdditions.filter(a => additionSelections[a.modality.id] !== false).length
  const totalAdoptedItemsCount = activeUpgradesCount + activeAdditionsCount

  const liveAddedMinutes = synergisticAdditions
    .filter(a => additionSelections[a.modality.id] !== false)
    .reduce((sum, a) => sum + (a.durationMinutes || 10), 0)

  const handleToggleUpgrade = (upgradeId: string, shouldUpgrade: boolean) => {
    setUpgradeSelections(prev => ({
      ...prev,
      [upgradeId]: shouldUpgrade
    }))
  }

  const handleToggleAddition = (modalityId: string) => {
    setAdditionSelections(prev => ({
      ...prev,
      [modalityId]: prev[modalityId] === false ? true : false
    }))
  }

  const handleToggleConflictAutoShift = (conflictId: string) => {
    setConflictAutoShift(prev => ({
      ...prev,
      [conflictId]: prev[conflictId] === false ? true : false
    }))
  }

  const handleConfirmAdoption = async () => {
    if (isAdopting) return
    setIsAdopting(true)

    try {
      // 1. Build upgrades to apply
      const upgradesToApply = upgrades
        .filter(u => upgradeSelections[u.id] !== false)
        .map(u => ({
          oldModalityId: u.currentModalityId,
          newModalityId: u.upgradedModality.id,
          timingSlot: u.recommendedTimingSlot
        }))

      // 2. Build additions to schedule
      const additionsToSchedule = synergisticAdditions
        .filter(a => additionSelections[a.modality.id] !== false)
        .map(a => {
          let slot = a.timingSlot
          if (a.hasConflictWarning && a.conflictResolutionSlot) {
            // Check if conflict auto-shift is enabled
            const conflictMatch = conflicts.find(c => c.incomingModalityId === a.modality.id)
            if (!conflictMatch || conflictAutoShift[conflictMatch.id] !== false) {
              slot = a.conflictResolutionSlot
            }
          }
          return {
            modalityId: a.modality.id,
            timingSlot: slot
          }
        })

      const modalitiesToKeep = upgrades
        .filter(u => upgradeSelections[u.id] === false)
        .map(u => u.currentModalityId)

      const plan: TailoredProtocolAdoptionPlan = {
        protocolId: protocol.id,
        protocolName: protocol.name || protocol.display_name,
        upgradesToApply,
        additionsToSchedule,
        modalitiesToKeep
      }

      await onAdoptTailoredStack(plan)
    } catch (err) {
      console.error('Error adopting tailored stack:', err)
      setIsAdopting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl bg-zinc-950/95 border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-950/40 text-white overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Glow Header Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-start justify-between gap-3 shrink-0 bg-zinc-900/40">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Tailored Stack Audit
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                {auditResult.totalProtocolSteps} Protocol Steps Audited
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-1 flex items-center gap-2">
              <span>Stack Fit:</span>
              <span className="text-purple-300 truncate">{protocol.name || 'Protocol Operating System'}</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Comparative biological audit against your active routine. Habit duplicates eliminated.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Hero Biological Net Delta Bar */}
        <div className="px-4 py-3 bg-gradient-to-r from-purple-950/40 via-zinc-900/60 to-indigo-950/40 border-b border-zinc-800/80 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center sm:text-left">
            {/* Projected Longevity Gain */}
            <div className="p-2 rounded-xl bg-zinc-900/70 border border-purple-500/20">
              <span className="text-[10px] text-zinc-400 block uppercase font-mono">Projected Impact</span>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                <Sparkles size={14} className="text-purple-400 shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-purple-300 truncate">
                  +{netDelta.topGainPoints} pts {netDelta.topGainingVector.split(' ')[0]}
                </span>
              </div>
            </div>

            {/* Added Daily Time */}
            <div className="p-2 rounded-xl bg-zinc-900/70 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block uppercase font-mono">Daily Commitment</span>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                <Clock size={14} className="text-cyan-400 shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-white">
                  +{liveAddedMinutes} min / day
                </span>
              </div>
            </div>

            {/* Summary Breakdown */}
            <div className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-center">
              <span className="text-[10px] text-zinc-400 block uppercase font-mono">Stack Synergy</span>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px] text-zinc-300 font-mono mt-0.5">
                <span className="text-emerald-400 font-bold">{alreadyCovered.length} Covered</span>
                <span>•</span>
                <span className="text-purple-300 font-bold">{activeUpgradesCount} Upgrades</span>
                <span>•</span>
                <span className="text-cyan-300 font-bold">{activeAdditionsCount} New</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Audit Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* SECTION 1: Clinical Evidence Upgrades */}
          {upgrades.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-purple-500/20 text-purple-300 flex items-center justify-center">
                    <Zap size={13} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Evidence Upgrades ({upgrades.length})
                  </h3>
                </div>
                <span className="text-[11px] text-purple-300/80 font-mono">
                  Clinically Superior Alternatives
                </span>
              </div>

              <div className="space-y-3">
                {upgrades.map(u => {
                  const isUpgrading = upgradeSelections[u.id] !== false
                  return (
                    <div
                      key={u.id}
                      className={`p-3 sm:p-3.5 rounded-xl border transition-all ${
                        isUpgrading
                          ? 'bg-purple-950/20 border-purple-500/40 shadow-sm'
                          : 'bg-zinc-900/30 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {/* Cluster & Comparison Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300">
                              {u.clusterName}
                            </span>
                            <span className="text-[11px] font-mono text-zinc-400">
                              Current: <span className="line-through text-zinc-500">{u.currentModalityName}</span> ({u.currentGrade})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <ArrowRight size={14} className="text-purple-400 shrink-0" />
                            <span className="text-sm font-bold text-white">
                              {u.upgradedModality.display_name || u.upgradedModality.name}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                              {u.upgradedGrade}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Upgrade / Keep Toggle */}
                        <div className="flex items-center bg-zinc-900 border border-zinc-700/80 rounded-lg p-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleUpgrade(u.id, true)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                              isUpgrading
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            Upgrade
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleUpgrade(u.id, false)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                              !isUpgrading
                                ? 'bg-zinc-700 text-white shadow-sm'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            Keep Current
                          </button>
                        </div>
                      </div>

                      {/* Clinical Delta Narrative */}
                      <p className="text-xs text-purple-200/80 mt-2 leading-relaxed bg-purple-950/30 p-2.5 rounded-lg border border-purple-500/20">
                        <span className="font-semibold text-purple-300">Why Upgrade: </span>
                        {u.clinicalDelta}
                      </p>

                      {/* Conflict Alert if applicable */}
                      {u.conflictWarning && (
                        <div className="mt-2 flex items-start gap-2 text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/30 p-2 rounded-lg">
                          <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">Timing Auto-Shifted: </span>
                            Scheduled in {u.recommendedTimingSlot} to avoid blunting your {u.conflictWarning.conflictingModalityName}.
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: Biological Timing & Mechanism Conflicts */}
          {conflicts.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    <ShieldAlert size={13} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Interaction Safeguards ({conflicts.length})
                  </h3>
                </div>
                <span className="text-[11px] text-amber-300/80 font-mono">
                  Physiological Spacing
                </span>
              </div>

              <div className="space-y-2.5">
                {conflicts.map(c => {
                  const isAutoShifted = conflictAutoShift[c.id] !== false
                  return (
                    <div
                      key={c.id}
                      className="p-3 sm:p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/15 text-xs text-amber-200/90 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs sm:text-sm">
                          <AlertTriangle size={14} className="shrink-0" />
                          <span>{c.headline}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase shrink-0">
                          {c.severity}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        {c.rationale}
                      </p>

                      <div className="pt-1 flex items-center justify-between gap-2 border-t border-amber-500/20 flex-wrap">
                        <div className="text-[11px] text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 size={13} className="shrink-0" />
                          <span>{c.autoResolutionDescription}</span>
                        </div>

                        <label className="flex items-center gap-1.5 text-[11px] text-zinc-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isAutoShifted}
                            onChange={() => handleToggleConflictAutoShift(c.id)}
                            className="rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-0"
                          />
                          <span>Auto-shift timing</span>
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* SECTION 3: High-Synergy Protocol Additions */}
          {synergisticAdditions.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                    <Sparkles size={13} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Protocol Additions ({synergisticAdditions.length})
                  </h3>
                </div>
                <span className="text-[11px] text-cyan-300/80 font-mono">
                  Zero Habit Overlap
                </span>
              </div>

              <div className="space-y-2">
                {synergisticAdditions.map(a => {
                  const isChecked = additionSelections[a.modality.id] !== false
                  return (
                    <div
                      key={a.modality.id}
                      onClick={() => handleToggleAddition(a.modality.id)}
                      className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-3 ${
                        isChecked
                          ? 'bg-zinc-900/60 border-zinc-700 hover:border-purple-500/40'
                          : 'bg-zinc-950/40 border-zinc-800/80 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleAddition(a.modality.id)}
                        onClick={e => e.stopPropagation()}
                        className="mt-0.5 rounded border-zinc-700 bg-zinc-800 text-purple-600 focus:ring-0 shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-white truncate">
                            {a.modality.display_name || a.modality.name}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
                              {a.timingSlot}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">
                              ~{a.durationMinutes}m
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
                          {a.headlineBenefit}
                        </p>

                        {/* Positive Synergy Highlight */}
                        {a.synergyWithStack && (
                          <div className="mt-1.5 text-[10px] text-emerald-300 font-mono flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <Sparkles size={11} className="shrink-0" />
                            <span>Synergy with your {a.synergyWithStack.existingModalityName}: {a.synergyWithStack.headline}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* SECTION 4: Already Covered Habits (Collapsible Reassurance) */}
          {alreadyCovered.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCovered(!showCovered)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                    <Check size={13} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                      Already Active in Routine ({alreadyCovered.length})
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      Zero duplicate tasks will be scheduled for these habits.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-zinc-400 text-xs font-mono">
                  <span>{showCovered ? 'Hide' : 'View'}</span>
                  {showCovered ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {showCovered && (
                <div className="p-3 pt-0 border-t border-zinc-800/60 space-y-2 mt-2">
                  {alreadyCovered.map((c, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-semibold text-zinc-200">{c.userModalityName}</span>
                          <span className="text-[10px] text-zinc-400 block">{c.comparisonNote}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0">
                        Preserved
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-3 shrink-0">
          <div className="text-left">
            <span className="text-xs font-bold text-white block">
              {totalAdoptedItemsCount} Total Items to Schedule
            </span>
            <span className="text-[11px] text-zinc-400">
              +{liveAddedMinutes} min/day commitment
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isAdopting}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmAdoption}
              disabled={isAdopting || totalAdoptedItemsCount === 0}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-lg shadow-purple-900/40 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isAdopting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Scheduling Stack...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Adopt Tailored Stack ({totalAdoptedItemsCount})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProtocolStackFitModal
