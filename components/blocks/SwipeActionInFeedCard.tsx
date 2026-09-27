'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Check, X, Clock, SkipForward, Sliders, Sparkles, Archive, Trash2, ArrowRight, Zap, RefreshCw } from 'lucide-react'
import { DedupedTask, TimePickerWithAmPmToggle } from '@/components/cards/ProtocolTaskCard'
import { Modality, OutcomeDimension, UserProfile, UserBenchItem } from '@/lib/types'
import { getSimplifiedModalityName } from './blocksUtils'
import { useTheme } from '@/lib/utils/useTheme'
import { DosageDetailModal } from '@/components/modals/DosageDetailModal'
import { getOutcomeColorConfig, getNeutralOutcomeColorConfig } from '@/lib/utils/outcomeColors'
import { addToBench, eliminateModality } from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'

interface SwipeActionInFeedCardProps {
  actionType: 'complete' | 'skip_snooze'
  task: DedupedTask
  modality?: Modality | null
  benchItem?: UserBenchItem | null
  allOutcomes?: OutcomeDimension[]
  userProfile?: UserProfile | null
  onClose: () => void
  onComplete: (
    taskId: string,
    outcomes?: Record<string, number>,
    customDose?: string,
    completedAt?: string,
    notes?: string
  ) => void
  onSkip: (taskId: string, reason?: string) => void
  onSnooze: (taskId: string, snoozeSlotOrMinutes: string | number) => void
  onMoveToBench?: (modalityId: string) => void
  onEliminate?: (task: DedupedTask, reason?: string) => void
}

export default function SwipeActionInFeedCard({
  actionType,
  task,
  modality,
  benchItem,
  allOutcomes = [],
  userProfile,
  onClose,
  onComplete,
  onSkip,
  onSnooze,
  onMoveToBench,
  onEliminate
}: SwipeActionInFeedCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)
  const isOutOfViewRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const { theme } = useTheme()
  const isDaylight = theme === 'light'

  // Completion Time: defaults to NOW on mount without needing to click in
  const getInitialTimeString = () => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }
  const [completedTime, setCompletedTime] = useState<string>(getInitialTimeString)

  // Outcome scores entered in-feed (0-10 standardized scale)
  const [outcomeRatings, setOutcomeRatings] = useState<Record<string, number>>({})
  const [touchedOutcomes, setTouchedOutcomes] = useState<Record<string, boolean>>({})
  const [outcomeNotes, setOutcomeNotes] = useState<string>('')

  // Robust Dose adjustment & DosageDetailModal popup
  const defaultDose = task.execution_details?.custom_dose || benchItem?.custom_dose || modality?.dose_or_exposure || ''
  const [doseInput, setDoseInput] = useState(defaultDose)
  const [isDosageModalOpen, setIsDosageModalOpen] = useState(false)

  const [skipReason, setSkipReason] = useState('Skipped for today')
  const [isActionLoading, setIsActionLoading] = useState(false)

  const handleMoveToBench = async () => {
    try {
      setIsActionLoading(true)
      const localUserId = getLocalUserId()
      const mId = modality?.id || task.modality_id || task.protocol_step?.modality_id
      if (!mId) return

      if (onMoveToBench) {
        onMoveToBench(mId)
      } else {
        await addToBench(localUserId, mId)
      }

      onSkip(task.id, `Moved to Bench (${skipReason})`)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('levl_schedule_updated'))
        window.dispatchEvent(new CustomEvent('levl_tasks_updated'))
      }
      onClose()
    } catch (err) {
      console.error('Error moving to bench:', err)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleEliminate = async () => {
    try {
      setIsActionLoading(true)
      const localUserId = getLocalUserId()
      const mId = modality?.id || task.modality_id || task.protocol_step?.modality_id
      if (!mId) return

      if (onEliminate) {
        onEliminate(task, skipReason)
      } else {
        await eliminateModality(localUserId, mId, `Eliminated from Schedule (${skipReason})`, task.id, [skipReason])
      }

      onSkip(task.id, `Eliminated from Schedule (${skipReason})`)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('levl_schedule_updated'))
        window.dispatchEvent(new CustomEvent('levl_tasks_updated'))
      }
      onClose()
    } catch (err) {
      console.error('Error eliminating modality:', err)
    } finally {
      setIsActionLoading(false)
    }
  }

  const simplifiedName = getSimplifiedModalityName(modality, task)

  // Extract relevant outcome dimensions using standardized multi-tier resolution
  const relevantOutcomes = useMemo(() => {
    let outcomeIds: string[] = []

    // 1. User custom outcomes if configured on bench
    if (benchItem?.custom_outcomes && Array.isArray(benchItem.custom_outcomes) && benchItem.custom_outcomes.length > 0) {
      outcomeIds = benchItem.custom_outcomes
    } else {
      // 2. Modality specific functional outcomes & impacts
      let functionalOutcomes = modality?.functional_outcomes_to_track || []
      if (typeof functionalOutcomes === 'string') {
        const cleaned = (functionalOutcomes as string).replace(/^{|}$/g, '')
        functionalOutcomes = cleaned ? cleaned.split(',') : []
      }
      const impactKeys = modality?.functional_impacts ? Object.keys(modality.functional_impacts) : []
      outcomeIds = [
        modality?.primary_outcome,
        ...(modality?.secondary_outcomes || []),
        ...functionalOutcomes,
        ...impactKeys
      ].filter(Boolean) as string[]
    }

    const normalizedKeys = outcomeIds.map((s) => s.toLowerCase().trim().replace(/\s+/g, '_'))
    let list = allOutcomes.filter((o) =>
      normalizedKeys.includes(o.id.toLowerCase()) ||
      normalizedKeys.includes(o.id.toLowerCase().replace(/_/g, ' ')) ||
      normalizedKeys.includes(o.name.toLowerCase()) ||
      normalizedKeys.includes(o.name.toLowerCase().replace(/\s+/g, '_'))
    )

    // Fallback to high-signal outcomes based on modality type
    if (list.length === 0) {
      const nameLower = (
        simplifiedName ||
        modality?.display_name ||
        modality?.name ||
        ''
      ).toLowerCase()
      const catLower = (modality?.category || '').toLowerCase()

      if (
        nameLower.includes('cold') ||
        nameLower.includes('sauna') ||
        nameLower.includes('thermal') ||
        catLower.includes('recovery')
      ) {
        list = allOutcomes.filter((o) => ['focus', 'energy', 'calmness', 'stress', 'soreness', 'mood'].includes(o.id))
      } else if (
        nameLower.includes('workout') ||
        nameLower.includes('lifting') ||
        nameLower.includes('push') ||
        nameLower.includes('pull') ||
        nameLower.includes('legs') ||
        catLower.includes('exercise')
      ) {
        list = allOutcomes.filter((o) => ['strength', 'energy', 'soreness', 'focus', 'mood'].includes(o.id))
      } else if (catLower.includes('sleep') || nameLower.includes('sleep') || nameLower.includes('bed')) {
        list = allOutcomes.filter((o) => ['sleep_quality', 'calmness', 'recovery', 'stress'].includes(o.id))
      } else {
        list = allOutcomes.filter((o) => ['energy', 'focus', 'calmness', 'mood'].includes(o.id))
      }
    }

    // Limit to top 3-4 outcomes for clean in-feed presentation
    return list.slice(0, 4)
  }, [modality, benchItem, allOutcomes, simplifiedName])

  // Commit completion with verified time, dose, outcomes, and notes
  const handleCommitComplete = () => {
    const finalDose = doseInput !== defaultDose ? doseInput : (doseInput || undefined)
    
    // Only pass outcomes the user touched or confirmed
    const finalOutcomes = Object.keys(touchedOutcomes).some((k) => touchedOutcomes[k])
      ? Object.keys(touchedOutcomes).reduce((acc, id) => {
          if (touchedOutcomes[id]) {
            acc[id] = outcomeRatings[id] ?? 5
          }
          return acc
        }, {} as Record<string, number>)
      : undefined

    // Synthesize completedAt ISO timestamp from completedTime (defaults to Now)
    let d = new Date()
    const baseDateStr = task.scheduled_date
    if (baseDateStr) {
      const [y, mon, day] = baseDateStr.split('-').map(Number)
      if (y && mon && day) {
        d = new Date(y, mon - 1, day)
      }
    }
    const [h, m] = completedTime.split(':')
    if (h !== undefined && m !== undefined) {
      d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0)
    }
    const completedAtIso = d.toISOString()

    onComplete(task.id, finalOutcomes, finalDose, completedAtIso, outcomeNotes.trim() || undefined)
  }

  // 1. Intersection Observer for Scroll-Away 5-Second Timer
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry.isIntersecting) {
          // Scrolled completely out of view -> Start 5s countdown
          isOutOfViewRef.current = true
          setSecondsRemaining(5)
        } else {
          // Scrolled back into view -> Cancel countdown immediately
          isOutOfViewRef.current = false
          setSecondsRemaining(null)
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // 2. Countdown handler when out of view
  useEffect(() => {
    if (secondsRemaining === null) return

    if (secondsRemaining <= 0) {
      // 5s elapsed while out of view -> auto-action
      if (actionType === 'complete') {
        handleCommitComplete()
      } else {
        onSkip(task.id, skipReason)
      }
      return
    }

    timerRef.current = setTimeout(() => {
      if (isOutOfViewRef.current) {
        setSecondsRemaining((prev) => (prev !== null ? prev - 1 : null))
      }
    }, 1000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [secondsRemaining, actionType, task.id, doseInput, defaultDose, outcomeRatings, touchedOutcomes, completedTime, outcomeNotes, skipReason])

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-2xl sm:rounded-3xl p-4 my-2 transition-all duration-300 border shadow-2xl relative animate-in fade-in zoom-in-95 ${
        isDaylight
          ? actionType === 'complete'
            ? 'bg-emerald-50/95 border-emerald-300 text-slate-800 shadow-emerald-900/10'
            : 'bg-amber-50/95 border-amber-300 text-slate-800 shadow-amber-900/10'
          : actionType === 'complete'
          ? 'bg-gradient-to-br from-emerald-950/95 via-slate-950/98 to-slate-900 border-emerald-500/40 shadow-emerald-950/40 text-white'
          : 'bg-gradient-to-br from-amber-950/95 via-slate-950/98 to-slate-900 border-amber-500/40 shadow-amber-950/40 text-white'
      }`}
    >
      {/* 5-Second Countdown Visual Progress Bar */}
      {secondsRemaining !== null && (
        <div className="w-full bg-black/20 dark:bg-white/10 rounded-full h-1.5 overflow-hidden mb-3">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              actionType === 'complete' ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, (secondsRemaining / 5) * 100))}%` }}
          />
        </div>
      )}

      {/* Top Header */}
      <div className={`flex items-center justify-between gap-2 border-b pb-2.5 mb-3 ${isDaylight ? 'border-slate-200' : 'border-white/10'}`}>
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              actionType === 'complete'
                ? isDaylight ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : isDaylight ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}
          >
            {actionType === 'complete' ? <Check size={14} strokeWidth={3} /> : <Clock size={14} strokeWidth={2.5} />}
          </div>
          <span className={`text-xs sm:text-sm font-bold truncate ${isDaylight ? 'text-slate-900' : 'text-white'}`}>
            {actionType === 'complete' ? `Complete ${simplifiedName}` : `Skip or Snooze ${simplifiedName}`}
          </span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          title="Cancel and close"
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isDaylight ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-600 hover:text-slate-900' : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white'
          }`}
        >
          <X size={14} />
        </button>
      </div>

      {/* COMPLETE VIEW */}
      {actionType === 'complete' && (
        <div className="space-y-3.5">
          {/* Dose Selector Button & Time Picker Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Robust Dose Button */}
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-[11px] font-bold uppercase tracking-wider shrink-0 ${isDaylight ? 'text-slate-600' : 'text-slate-400'}`}>
                Dose:
              </span>
              {modality ? (
                <button
                  type="button"
                  onClick={() => setIsDosageModalOpen(true)}
                  className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 group max-w-full truncate ${
                    isDaylight
                      ? 'bg-white hover:bg-slate-50 border-emerald-300 text-emerald-800 hover:border-emerald-500'
                      : 'bg-black/50 hover:bg-black/80 border-white/15 hover:border-emerald-400 text-emerald-300'
                  }`}
                  title="Click to customize dosage, presets (Blueprint, Attia, Huberman), or parameters"
                >
                  <Sliders size={13} className="text-emerald-400 group-hover:rotate-45 transition-transform shrink-0" />
                  <span className="truncate">{doseInput || 'Customize Dose'}</span>
                  <span className="text-[10px] text-emerald-400 font-sans underline font-semibold shrink-0 ml-0.5">
                    Edit
                  </span>
                </button>
              ) : (
                <input
                  type="text"
                  value={doseInput}
                  onChange={(e) => setDoseInput(e.target.value)}
                  placeholder="e.g. 5g or 20 mins"
                  className={`px-2.5 py-1 text-xs rounded-xl border outline-none font-mono ${
                    isDaylight
                      ? 'bg-white border-slate-300 text-slate-800'
                      : 'bg-black/40 border-white/10 text-white focus:border-emerald-500/50'
                  }`}
                />
              )}
            </div>

            {/* Time Picker Row (Defaults to Now without clicking in) */}
            <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  const now = new Date()
                  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
                  setCompletedTime(nowTime)
                }}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                title="Reset completion time to current time (NOW)"
              >
                <Clock size={14} />
                <span className="text-[11px] uppercase font-bold text-emerald-400 underline decoration-dotted">Now</span>
              </button>
              <span className={`text-[11px] font-bold ${isDaylight ? 'text-slate-700' : 'text-emerald-200'}`}>
                Completed:
              </span>
              <TimePickerWithAmPmToggle
                value={completedTime}
                onChange={(new24) => setCompletedTime(new24)}
              />
            </div>
          </div>

          {/* Standardized 0-10 Outcome Sliders */}
          {relevantOutcomes.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1">
                  <Sparkles size={11} />
                  <span>Outcomes Tracking (0–10 Scale)</span>
                </span>
                <span className={`text-[10px] ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Tap badge or slide to rate
                </span>
              </div>

              <div className="space-y-2">
                {relevantOutcomes.map((outcome) => {
                  const currentVal = outcomeRatings[outcome.id] ?? 5
                  const isTouched = Boolean(touchedOutcomes[outcome.id])
                  const isLowerBetter = outcome.directionality === 'lower_is_better'
                  const colorCfg = isTouched
                    ? getOutcomeColorConfig(currentVal, outcome.directionality)
                    : getNeutralOutcomeColorConfig()

                  return (
                    <div
                      key={outcome.id}
                      className={`p-2.5 rounded-xl border space-y-1.5 transition-all ${
                        isDaylight
                          ? 'bg-white/90 border-slate-200 shadow-sm'
                          : 'bg-black/40 border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`font-bold truncate ${isDaylight ? 'text-slate-900' : 'text-white'}`}>
                            {outcome.name}
                          </span>
                          {outcome.directionality && (
                            <span
                              className={`text-[8px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${
                                isLowerBetter
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                  : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                              }`}
                            >
                              {isLowerBetter ? 'Lower = Better' : 'Higher = Better'}
                            </span>
                          )}
                        </div>

                        {/* Tap-to-confirm pill button */}
                        <button
                          type="button"
                          onClick={() => {
                            const nextTouched = !touchedOutcomes[outcome.id]
                            setTouchedOutcomes((prev) => ({ ...prev, [outcome.id]: nextTouched }))
                            if (nextTouched && outcomeRatings[outcome.id] === undefined) {
                              setOutcomeRatings((prev) => ({ ...prev, [outcome.id]: currentVal }))
                            }
                          }}
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all group shrink-0"
                          title="Click to confirm this rating without sliding"
                        >
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                              isTouched
                                ? colorCfg.badgeBg
                                : isDaylight
                                ? 'bg-slate-100 border-slate-200 text-slate-500 group-hover:border-slate-300'
                                : 'bg-white/5 border-white/15 text-slate-400 group-hover:border-white/30'
                            }`}
                          >
                            {isTouched ? colorCfg.qualityLabel : 'Unconfirmed (Tap)'}
                          </span>
                          <span
                            className={`font-mono font-bold text-xs ${
                              isTouched ? colorCfg.textColor : isDaylight ? 'text-slate-600' : 'text-slate-400'
                            }`}
                          >
                            {currentVal}/10
                          </span>
                        </button>
                      </div>

                      {/* 0-10 Range Slider with Dynamic Accent Color */}
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={currentVal}
                        onChange={(e) => {
                          const num = parseInt(e.target.value, 10)
                          setOutcomeRatings((prev) => ({ ...prev, [outcome.id]: num }))
                          setTouchedOutcomes((prev) => ({ ...prev, [outcome.id]: true }))
                        }}
                        onPointerDown={() => {
                          if (!touchedOutcomes[outcome.id]) {
                            setTouchedOutcomes((prev) => ({ ...prev, [outcome.id]: true }))
                            if (outcomeRatings[outcome.id] === undefined) {
                              setOutcomeRatings((prev) => ({ ...prev, [outcome.id]: currentVal }))
                            }
                          }
                        }}
                        className="w-full cursor-pointer touch-manipulation h-1.5 rounded-lg appearance-none bg-slate-200 dark:bg-white/10"
                        style={{ accentColor: colorCfg.accentHex }}
                        title={isTouched ? `Rating: ${currentVal}/10 (Confirmed)` : 'Drag to rate or click badge to confirm'}
                      />

                      {/* Directionality Labels */}
                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        <span className={isLowerBetter ? 'text-emerald-400' : 'text-red-400'}>
                          0: {isLowerBetter ? 'Best (None)' : 'Poor (Low)'}
                        </span>
                        <span className={isLowerBetter ? 'text-red-400' : 'text-emerald-400'}>
                          10: {isLowerBetter ? 'Worst (Severe)' : 'Peak (Best)'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Optional Notes Input */}
              <div className="pt-1">
                <label className={`text-[10px] uppercase font-bold block mb-1 ${isDaylight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Optional Notes
                </label>
                <input
                  type="text"
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="e.g. Felt extra calm after session, 3 sets @ RPE 8"
                  className={`w-full border rounded-xl px-3 py-1.5 text-xs outline-none transition-colors ${
                    isDaylight
                      ? 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500'
                      : 'bg-black/50 border-white/15 text-white placeholder:text-slate-500 focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Bottom Confirmation Bar */}
          <div className={`flex items-center justify-between pt-3 border-t mt-2 ${isDaylight ? 'border-slate-200' : 'border-white/10'}`}>
            <div className="flex items-center gap-1.5 text-[11px] font-medium">
              {secondsRemaining !== null ? (
                <div className="flex items-center gap-1 text-emerald-500 font-bold animate-pulse">
                  <span>Auto-completing in {secondsRemaining}s...</span>
                  <span className={`text-[10px] font-normal ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
                    (scroll back to pause)
                  </span>
                </div>
              ) : (
                <div className={`flex items-center gap-1.5 ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span className="inline-block animate-bounce">↓</span>
                  <span>Scroll away to auto-complete in 5s</span>
                </div>
              )}
            </div>

            {/* Compact Confirmation Button */}
            <button
              onClick={handleCommitComplete}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Check size={14} strokeWidth={3} />
              <span>Confirm</span>
            </button>
          </div>
        </div>
      )}

      {/* Full Canonical Dosage & Scheduling Configuration Modal */}
      {isDosageModalOpen && modality && (
        <DosageDetailModal
          isOpen={true}
          onClose={() => setIsDosageModalOpen(false)}
          modality={modality}
          userProfile={userProfile}
          task={task}
          benchItem={benchItem}
          onSelectDose={(newDoseText) => {
            setDoseInput(newDoseText)
            setIsDosageModalOpen(false)
          }}
          onSavePersonalization={(customDose) => {
            setDoseInput(customDose)
            setIsDosageModalOpen(false)
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('levl_schedule_updated'))
              window.dispatchEvent(new CustomEvent('levl_tasks_updated'))
            }
          }}
        />
      )}

      {/* SKIP / SNOOZE VIEW */}
      {actionType === 'skip_snooze' && (
        <div className="space-y-3">
          {/* Quick Snooze Presets */}
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${isDaylight ? 'text-amber-700' : 'text-amber-400/80'}`}>
              Snooze / Reschedule
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                onClick={() => onSnooze(task.id, 30)}
                className={`px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 active:scale-95 ${
                  isDaylight
                    ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                }`}
              >
                <Clock size={12} className={isDaylight ? 'text-amber-600' : 'text-amber-400'} />
                <span>+30 min</span>
              </button>
              <button
                onClick={() => onSnooze(task.id, 60)}
                className={`px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 active:scale-95 ${
                  isDaylight
                    ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                }`}
              >
                <Clock size={12} className={isDaylight ? 'text-amber-600' : 'text-amber-400'} />
                <span>+1 hour</span>
              </button>
              <button
                onClick={() => onSnooze(task.id, 'evening')}
                className={`px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 active:scale-95 ${
                  isDaylight
                    ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                }`}
              >
                <span>Tonight</span>
              </button>
              <button
                onClick={() => onSnooze(task.id, 'tomorrow')}
                className={`px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 active:scale-95 ${
                  isDaylight
                    ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                }`}
              >
                <span>Tomorrow</span>
              </button>
            </div>
          </div>

          {/* Skip Action with Reason & Adaptive Sub-Actions */}
          <div className={`pt-2.5 border-t space-y-2.5 ${isDaylight ? 'border-slate-200' : 'border-white/10'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDaylight ? 'text-slate-600' : 'text-slate-400'}`}>
                Or Skip for Today
              </span>
              <span className={`text-[9px] font-medium ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
                Select reason to explore smart adjustments
              </span>
            </div>

            {/* Quick Reason Chips / Pills */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'Too busy', label: 'Too busy', icon: '⚡' },
                { id: 'Too frequent', label: 'Too frequent', icon: '🔄' },
                { id: 'Not helpful', label: 'Not helpful', icon: '📉' },
                { id: 'Not feeling well', label: 'Not feeling well', icon: '🤒' },
                { id: 'Travel / Schedule conflict', label: 'Travel / Conflict', icon: '✈️' },
                { id: 'Rest day substitution', label: 'Rest day', icon: '🏖️' },
                { id: 'Skipped for today', label: 'Just skip', icon: '⏭️' },
              ].map((reason) => {
                const isSelected = skipReason === reason.id
                return (
                  <button
                    key={reason.id}
                    type="button"
                    onClick={() => {
                      setSkipReason(reason.id)
                      // Pause auto-countdown if an adaptive reason is picked
                      if (['Too busy', 'Too frequent', 'Not helpful'].includes(reason.id)) {
                        setSecondsRemaining(null)
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                      isSelected
                        ? isDaylight
                          ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-sm'
                          : 'bg-white text-slate-900 border-white shadow-md'
                        : isDaylight
                        ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                    }`}
                  >
                    <span>{reason.icon}</span>
                    <span>{reason.label}</span>
                  </button>
                )
              })}
            </div>

            {/* ADAPTIVE ACTION TRAY FOR 'Too busy' */}
            {skipReason === 'Too busy' && (
              <div className={`p-3 rounded-2xl border space-y-2 animate-in fade-in slide-in-from-top-1 ${
                isDaylight
                  ? 'bg-[#FFFBEB] border-[#D97706]/30 text-[#475569]'
                  : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span className="text-amber-500">⚡</span>
                    <span className={isDaylight ? 'text-[#D97706]' : 'text-amber-300'}>Too busy today?</span>
                  </div>
                  <span className={`text-[10px] font-semibold ${isDaylight ? 'text-[#78350F]' : 'text-amber-200/70'}`}>
                    Choose an action:
                  </span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isDaylight ? 'text-[#526661]' : 'text-slate-300'}`}>
                  Short on time? Reduce the duration or dose, bench this modality for later, or eliminate it from your routine:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsDosageModalOpen(true)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
                      isDaylight
                        ? 'bg-[#ECFEFF] hover:bg-[#CFFAFE] text-[#0891B2] border-[#0891B2]/40'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40'
                    }`}
                  >
                    <Sliders size={13} className={isDaylight ? 'text-[#0891B2]' : 'text-cyan-400'} />
                    <span>Change Dosing</span>
                  </button>

                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={handleMoveToBench}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
                      isDaylight
                        ? 'bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] border-[#D97706]/40'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    <Archive size={13} className={isDaylight ? 'text-[#D97706]' : 'text-amber-400'} />
                    <span>Move to Bench</span>
                  </button>

                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={handleEliminate}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
                      isDaylight
                        ? 'bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#E11D48] border-[#E11D48]/40'
                        : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    <Trash2 size={13} className={isDaylight ? 'text-[#E11D48]' : 'text-rose-400'} />
                    <span>Eliminate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSkip(task.id, 'Too busy')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      isDaylight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-white/10 hover:bg-white/15 text-slate-300 border-white/20'
                    }`}
                  >
                    <SkipForward size={13} />
                    <span>Skip Today Only</span>
                  </button>
                </div>
              </div>
            )}

            {/* ADAPTIVE ACTION TRAY FOR 'Too frequent' */}
            {skipReason === 'Too frequent' && (
              <div className={`p-3 rounded-2xl border space-y-2 animate-in fade-in slide-in-from-top-1 ${
                isDaylight
                  ? 'bg-[#ECFEFF] border-[#0891B2]/30 text-[#475569]'
                  : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span className="text-cyan-500">🔄</span>
                    <span className={isDaylight ? 'text-[#0891B2]' : 'text-cyan-300'}>Too frequent?</span>
                  </div>
                  <span className={`text-[10px] font-semibold ${isDaylight ? 'text-[#155E75]' : 'text-cyan-200/70'}`}>
                    Choose an action:
                  </span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isDaylight ? 'text-[#526661]' : 'text-slate-300'}`}>
                  Cadence feels overwhelming? You can adjust the weekly frequency, rest day intervals, or dosage:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsDosageModalOpen(true)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
                      isDaylight
                        ? 'bg-white hover:bg-[#CFFAFE] text-[#0891B2] border-[#0891B2]/40'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40'
                    }`}
                  >
                    <Sliders size={13} className={isDaylight ? 'text-[#0891B2]' : 'text-cyan-400'} />
                    <span>Change Dosing / Frequency</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSkip(task.id, 'Too frequent')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      isDaylight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-white/10 hover:bg-white/15 text-slate-300 border-white/20'
                    }`}
                  >
                    <SkipForward size={13} />
                    <span>Skip Today Only</span>
                  </button>
                </div>
              </div>
            )}

            {/* ADAPTIVE ACTION TRAY FOR 'Not helpful' */}
            {skipReason === 'Not helpful' && (
              <div className={`p-3 rounded-2xl border space-y-2 animate-in fade-in slide-in-from-top-1 ${
                isDaylight
                  ? 'bg-[#FFF1F2] border-[#E11D48]/30 text-[#475569]'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span className="text-rose-500">📉</span>
                    <span className={isDaylight ? 'text-[#E11D48]' : 'text-rose-300'}>Not helpful?</span>
                  </div>
                  <span className={`text-[10px] font-semibold ${isDaylight ? 'text-[#9F1239]' : 'text-rose-200/70'}`}>
                    Choose an action:
                  </span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isDaylight ? 'text-[#526661]' : 'text-slate-300'}`}>
                  Not getting the expected clinical payoff? Recalibrate the dose/timing, move to bench while trying alternatives, or eliminate from your stack:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsDosageModalOpen(true)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
                      isDaylight
                        ? 'bg-[#ECFEFF] hover:bg-[#CFFAFE] text-[#0891B2] border-[#0891B2]/40'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40'
                    }`}
                  >
                    <Sliders size={13} className={isDaylight ? 'text-[#0891B2]' : 'text-cyan-400'} />
                    <span>Change Dosing</span>
                  </button>

                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={handleMoveToBench}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
                      isDaylight
                        ? 'bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] border-[#D97706]/40'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    <Archive size={13} className={isDaylight ? 'text-[#D97706]' : 'text-amber-400'} />
                    <span>Move to Bench</span>
                  </button>

                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={handleEliminate}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
                      isDaylight
                        ? 'bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#E11D48] border-[#E11D48]/40'
                        : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    <Trash2 size={13} className={isDaylight ? 'text-[#E11D48]' : 'text-rose-400'} />
                    <span>Eliminate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSkip(task.id, 'Not helpful')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      isDaylight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-white/10 hover:bg-white/15 text-slate-300 border-white/20'
                    }`}
                  >
                    <SkipForward size={13} />
                    <span>Skip Today Only</span>
                  </button>
                </div>
              </div>
            )}

            {/* Standard Dropdown & Skip Button for Non-Adaptive Reasons */}
            {!['Too busy', 'Too frequent', 'Not helpful'].includes(skipReason) && (
              <div className="flex items-center gap-2 pt-0.5">
                <select
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  className={`border rounded-lg px-2.5 py-1.5 text-xs outline-none flex-1 ${
                    isDaylight
                      ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
                      : 'bg-black/40 border-white/10 text-slate-200'
                  }`}
                >
                  <option value="Skipped for today">Skipped for today</option>
                  <option value="Too busy">Too busy</option>
                  <option value="Too frequent">Too frequent</option>
                  <option value="Not helpful">Not helpful</option>
                  <option value="Not feeling well">Not feeling well</option>
                  <option value="Travel / Schedule conflict">Travel / Schedule conflict</option>
                  <option value="Rest day substitution">Rest day substitution</option>
                </select>

                <button
                  type="button"
                  onClick={() => onSkip(task.id, skipReason)}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-xs transition-all active:scale-95 shrink-0 cursor-pointer"
                >
                  <SkipForward size={13} />
                  <span>Skip</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Countdown status */}
          <div className={`pt-2 flex items-center justify-between text-[11px] font-medium ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
            {secondsRemaining !== null ? (
              <div className="flex items-center gap-1 text-amber-500 font-bold animate-pulse">
                <span>Auto-skipping in {secondsRemaining}s...</span>
                <span className={`text-[10px] font-normal ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
                  (scroll back to pause)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="inline-block animate-bounce">↓</span>
                <span>Scroll away to auto-skip in 5s</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
