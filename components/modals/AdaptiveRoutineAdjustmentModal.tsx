'use client'

import React, { useState, useEffect } from 'react'
import { X, Check, Shield, Zap, Sparkles, Activity, Clock, Info, CheckCircle2, ArrowRight } from 'lucide-react'
import { DailyProtocolTask } from '@/lib/types'
import { BandwidthEvaluation, RoutineAdjustmentItem, DailyBandwidthMode } from '@/lib/adaptive/dailyBandwidthEngine'
import { updateDailyTaskStatus, createDailyTask, updateTaskExecutionDetails } from '@/lib/data'
import { safeLocalStorageSet } from '@/lib/utils/storage'

interface AdaptiveRoutineAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  evaluation: BandwidthEvaluation
  todayTasks: DailyProtocolTask[]
  dateStr: string
  localUserId: string
  onApplied: (appliedCount: number, mode: DailyBandwidthMode) => void
}

export default function AdaptiveRoutineAdjustmentModal({
  isOpen,
  onClose,
  evaluation,
  todayTasks,
  dateStr,
  localUserId,
  onApplied
}: AdaptiveRoutineAdjustmentModalProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({})
  const [isApplying, setIsApplying] = useState(false)

  // Initialize all items as checked by default whenever modal opens or evaluation changes
  useEffect(() => {
    if (evaluation?.adjustments) {
      const initialMap: Record<string, boolean> = {}
      evaluation.adjustments.forEach(item => {
        initialMap[item.id] = true // Default: ALL CHECKED!
      })
      setSelectedItems(initialMap)
    }
  }, [evaluation])

  if (!isOpen || !evaluation) return null

  const selectedCount = Object.values(selectedItems).filter(Boolean).length
  const isSurvival = evaluation.suggestedMode === 'survival_80_20'
  const isSurge = evaluation.suggestedMode === 'peak_surge'

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const handleSelectAll = (checkAll: boolean) => {
    const updated: Record<string, boolean> = {}
    evaluation.adjustments.forEach(item => {
      updated[item.id] = checkAll
    })
    setSelectedItems(updated)
  }

  const handleApplyChanges = async () => {
    setIsApplying(true)
    let appliedCount = 0

    try {
      for (const item of evaluation.adjustments) {
        const isChecked = selectedItems[item.id]

        if (item.type === 'cut' && item.affectedTaskId) {
          if (isChecked) {
            await updateDailyTaskStatus(
              item.affectedTaskId,
              'skipped',
              '80/20 Survival: Deferred to protect autonomic recovery'
            )
            appliedCount++
          } else {
            // User unchecked: restore to pending if it was previously skipped by 80/20
            const existing = todayTasks.find(t => t.id === item.affectedTaskId)
            if (existing && existing.status === 'skipped' && existing.status_reason?.includes('80/20')) {
              await updateDailyTaskStatus(item.affectedTaskId, 'pending', undefined)
              appliedCount++
            }
          }
        } else if (item.type === 'downgrade' && item.affectedTaskId) {
          if (isChecked) {
            await updateTaskExecutionDetails(item.affectedTaskId, {
              swap_name: item.swapModalityName,
              swap_dose: item.swapDoseText,
              is_downgraded: true,
              downgrade_reason: '80/20 Minimum Effective Dose'
            })
            appliedCount++
          } else {
            // User unchecked: restore original parameters
            const existing = todayTasks.find(t => t.id === item.affectedTaskId)
            if (existing?.execution_details?.is_downgraded) {
              await updateTaskExecutionDetails(item.affectedTaskId, {
                swap_name: undefined,
                swap_dose: undefined,
                is_downgraded: false,
                downgrade_reason: undefined
              })
              appliedCount++
            }
          }
        } else if ((item.type === 'add_restorative' || item.type === 'add_surge') && item.swapModalityId) {
          if (isChecked) {
            const alreadyExists = todayTasks.some(t => t.modality_id === item.swapModalityId)
            if (!alreadyExists) {
              await createDailyTask(localUserId, dateStr, item.swapModalityId)
              appliedCount++
            }
          }
        }
      }

      // Activate Adherence Shield for today if in survival mode
      if (isSurvival) {
        safeLocalStorageSet(`levl_8020_protected_${dateStr}`, 'true')
        safeLocalStorageSet(`levl_bandwidth_mode_${dateStr}`, 'survival_80_20')
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('levl_adherence_shield_activated', { detail: { date: dateStr } }))
        }
      } else if (isSurge) {
        safeLocalStorageSet(`levl_bandwidth_mode_${dateStr}`, 'peak_surge')
      }

      onApplied(appliedCount, evaluation.suggestedMode)
      onClose()
    } catch (err) {
      console.error('Error applying routine adjustments:', err)
    } finally {
      setIsApplying(false)
    }
  }

  const handleRevertToStandard = async () => {
    setIsApplying(true)
    try {
      for (const item of evaluation.adjustments) {
        if (item.affectedTaskId) {
          const existing = todayTasks.find(t => t.id === item.affectedTaskId)
          if (existing && existing.status === 'skipped' && existing.status_reason?.includes('80/20')) {
            await updateDailyTaskStatus(item.affectedTaskId, 'pending', undefined)
          }
          if (existing?.execution_details?.is_downgraded) {
            await updateTaskExecutionDetails(item.affectedTaskId, {
              swap_name: undefined,
              swap_dose: undefined,
              is_downgraded: false,
              downgrade_reason: undefined
            })
          }
        }
      }

      safeLocalStorageSet(`levl_8020_protected_${dateStr}`, 'false')
      safeLocalStorageSet(`levl_bandwidth_mode_${dateStr}`, 'standard')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('levl_adherence_shield_deactivated', { detail: { date: dateStr } }))
      }

      onApplied(0, 'standard')
      onClose()
    } catch (err) {
      console.error('Error reverting to standard routine:', err)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Ambient Gradient Glow */}
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
          isSurvival ? 'bg-amber-500/10' : isSurge ? 'bg-cyan-500/10' : 'bg-emerald-500/10'
        }`} />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
              isSurvival
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : isSurge
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            }`}>
              {isSurvival ? <Shield className="w-6 h-6" /> : isSurge ? <Zap className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {evaluation.headline}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-1">
                {evaluation.rationale}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selection Sub-Header */}
        <div className="flex items-center justify-between pt-3 pb-2 text-xs text-slate-400 shrink-0">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300 flex items-center gap-1.5">
            Suggested Adjustments
            <span className="text-cyan-400 font-mono font-bold">({selectedCount}/{evaluation.adjustments.length} selected)</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectAll(true)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Select All
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleSelectAll(false)}
              className="text-[11px] text-slate-400 hover:text-slate-300 transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Granular Adjustment Items Scrollable Area */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1 py-1 my-1">
          {evaluation.adjustments.map((item) => {
            const isChecked = !!selectedItems[item.id]

            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  isChecked
                    ? 'bg-slate-800/80 border-cyan-500/50 shadow-sm shadow-cyan-500/5'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-90'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 truncate">
                        {item.impact}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="pt-1 flex items-start gap-1.5 text-[11px] text-slate-400">
                      <Info className="w-3.5 h-3.5 text-cyan-400/80 shrink-0 mt-0.5" />
                      <span className="italic">{item.scientificRationale}</span>
                    </div>
                  </div>

                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                      isChecked
                        ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                        : 'border-slate-700 bg-slate-900/60'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Adherence Shield & Action Footer */}
        <div className="pt-3 border-t border-slate-800/80 space-y-3 shrink-0">
          {isSurvival && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-200">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>100% Adherence Shield:</strong> Completing your chosen 80/20 routine fulfills today&apos;s goal and guarantees full streak preservation.
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRevertToStandard}
              disabled={isApplying}
              className="w-1/3 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors text-center cursor-pointer"
              title="Reset all adjustments and return to standard scheduled routine"
            >
              Revert to Standard
            </button>

            <button
              type="button"
              onClick={handleApplyChanges}
              disabled={isApplying || selectedCount === 0}
              className={`w-2/3 py-2.5 px-4 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
                isSurvival
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500'
              }`}
            >
              {isApplying ? (
                'Applying Changes...'
              ) : (
                <>
                  Apply {selectedCount} Selected Adjustment{selectedCount !== 1 ? 's' : ''}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
