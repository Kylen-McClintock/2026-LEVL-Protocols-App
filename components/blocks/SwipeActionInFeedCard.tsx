'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Check, X, Clock, SkipForward } from 'lucide-react'
import { DedupedTask } from '@/components/cards/ProtocolTaskCard'
import { Modality, OutcomeDimension, UserProfile, UserBenchItem } from '@/lib/types'
import { getSimplifiedModalityName } from './blocksUtils'
import { useTheme } from '@/lib/utils/useTheme'

interface SwipeActionInFeedCardProps {
  actionType: 'complete' | 'skip_snooze'
  task: DedupedTask
  modality?: Modality | null
  benchItem?: UserBenchItem | null
  allOutcomes?: OutcomeDimension[]
  userProfile?: UserProfile | null
  onClose: () => void
  onComplete: (taskId: string, outcomes?: Record<string, number>, customDose?: string) => void
  onSkip: (taskId: string, reason?: string) => void
  onSnooze: (taskId: string, snoozeSlotOrMinutes: string | number) => void
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
  onSnooze
}: SwipeActionInFeedCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)
  const isOutOfViewRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const { theme } = useTheme()
  const isDaylight = theme === 'light'

  // Outcome scores entered in-feed
  const [outcomeRatings, setOutcomeRatings] = useState<Record<string, number>>({})
  // Optional dose adjustment
  const defaultDose = task.execution_details?.custom_dose || benchItem?.custom_dose || modality?.dose_or_exposure || ''
  const [doseInput, setDoseInput] = useState(defaultDose)
  const [skipReason, setSkipReason] = useState('Skipped for today')

  const simplifiedName = getSimplifiedModalityName(modality, task)

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
        const finalDose = doseInput !== defaultDose ? doseInput : undefined
        const finalOutcomes = Object.keys(outcomeRatings).length > 0 ? outcomeRatings : undefined
        onComplete(task.id, finalOutcomes, finalDose)
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
  }, [secondsRemaining, actionType, task.id, doseInput, defaultDose, outcomeRatings, skipReason, onComplete, onSkip])

  // Extract relevant outcome dimensions for this modality
  const outcomeKeys: string[] = modality?.functional_outcomes_to_track || Object.keys(modality?.functional_impacts || {})
  const relevantOutcomes = outcomeKeys
    .slice(0, 3)
    .map((name: string) => allOutcomes.find((o) => o.name.toLowerCase() === name.toLowerCase()) || { id: name, name, icon: '✨' })

  const handleOutcomeClick = (name: string, score: number) => {
    setOutcomeRatings((prev) => ({
      ...prev,
      [name]: prev[name] === score ? 0 : score
    }))
  }

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
        <div className="space-y-3">
          {/* Optional Dose Field */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0">Dose/Duration:</span>
            <input
              type="text"
              value={doseInput}
              onChange={(e) => setDoseInput(e.target.value)}
              placeholder="e.g. 5g or 20 mins"
              className="px-2.5 py-1 text-xs rounded-lg bg-black/40 border border-white/10 text-white focus:border-emerald-500/50 outline-none w-full max-w-[180px]"
            />
          </div>

          {/* Quick Outcome Ratings */}
          {relevantOutcomes.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">
                Quick Outcomes (Optional)
              </span>
              <div className="flex flex-wrap gap-2">
                {relevantOutcomes.map((outcome: any) => {
                  const currentScore = outcomeRatings[outcome.name] || 0
                  return (
                    <div
                      key={outcome.id || outcome.name}
                      className="flex items-center gap-1 bg-black/30 border border-white/10 rounded-xl px-2 py-1"
                    >
                      <span className="text-xs text-slate-300 font-medium truncate max-w-[90px]">{outcome.name}</span>
                      <div className="flex items-center gap-0.5 ml-1">
                        {[1, 2, 3].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleOutcomeClick(outcome.name, star)}
                            className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold transition-all ${
                              currentScore >= star
                                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                          >
                            +{star}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
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

            {/* Compact Confirmation Button at bottom right */}
            <button
              onClick={() => {
                const finalDose = doseInput !== defaultDose ? doseInput : undefined
                const finalOutcomes = Object.keys(outcomeRatings).length > 0 ? outcomeRatings : undefined
                onComplete(task.id, finalOutcomes, finalDose)
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Check size={14} strokeWidth={3} />
              <span>Confirm</span>
            </button>
          </div>
        </div>
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

          {/* Skip Action with Reason */}
          <div className={`pt-2.5 border-t ${isDaylight ? 'border-slate-200' : 'border-white/10'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${isDaylight ? 'text-slate-600' : 'text-slate-400'}`}>
              Or Skip for Today
            </span>
            <div className="flex items-center gap-2">
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
                <option value="Not feeling well">Not feeling well</option>
                <option value="Travel / Schedule conflict">Travel / Schedule conflict</option>
                <option value="Rest day substitution">Rest day substitution</option>
              </select>

              <button
                onClick={() => onSkip(task.id, skipReason)}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-xs transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <SkipForward size={13} />
                <span>Skip</span>
              </button>
            </div>
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
