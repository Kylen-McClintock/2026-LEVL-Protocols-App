'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { DailyProtocolTask, Modality } from '@/lib/types'
import { X, Calendar, FastForward, ArrowRightLeft, Clock, SkipForward, Sparkles, Check, Archive, Trash2, Sliders } from 'lucide-react'
import { DosageDetailModal } from '@/components/modals/DosageDetailModal'

export type RescheduleActionType = 
  | 'slide_forward'        // Push session to next day (slides entire sequence)
  | 'swap_rest_day'        // Swap session with a designated rest/recovery day
  | 'snooze_later_today'   // Move task to a later timing slot today (evening/pre-bed)
  | 'skip_session'         // Mark session skipped (stay on calendar schedule)
  | 'not_needed_today'     // Mark session skipped without breaking streaks (conditional/situational)
  | 'custom_date'          // Pick a custom future date on calendar
  | 'move_to_bench'        // Move modality to bench (deactivate from routine)
  | 'eliminate_entirely'   // Permanently eliminate modality from stack
  | 'change_dosing'        // Adjust dosing / schedule

interface SmartRescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  task: DailyProtocolTask | null
  modality: Modality | null
  isPastMissedTask?: boolean
  onExecuteReschedule: (
    action: RescheduleActionType, 
    customDateStr?: string, 
    newTimingSlot?: string
  ) => void
}

interface TimeSlotOption {
  slot: string
  label: string
  timeRange: string
  icon: string
  order: number
}

const ALL_TODAY_SLOTS: TimeSlotOption[] = [
  { slot: 'morning', label: 'Morning Stack', timeRange: '7:30 AM – 10:30 AM', icon: '☀️', order: 1 },
  { slot: 'midday', label: 'Midday / Lunch', timeRange: '11:30 AM – 1:30 PM', icon: '🌤️', order: 2 },
  { slot: 'afternoon', label: 'Afternoon / Workout', timeRange: '2:00 PM – 5:00 PM', icon: '⛅', order: 3 },
  { slot: 'evening', label: 'Evening Stack', timeRange: '5:30 PM – 7:30 PM', icon: '🌆', order: 4 },
  { slot: 'wind_down', label: 'Wind Down', timeRange: '8:00 PM – 9:30 PM', icon: '🕯️', order: 5 },
  { slot: 'pre_bed', label: 'Pre-Bed / Night', timeRange: '9:30 PM – 11:00 PM', icon: '🌙', order: 6 }
]

export const SmartRescheduleModal: React.FC<SmartRescheduleModalProps> = ({
  isOpen,
  onClose,
  task,
  modality,
  isPastMissedTask = false,
  onExecuteReschedule
}) => {
  const [selectedSkipReason, setSelectedSkipReason] = useState<string | null>(null)
  const [isDosageModalOpen, setIsDosageModalOpen] = useState(false)
  const modName = modality?.name || ''
  const isPulsed = (modality as any)?.is_pulsed || 
                  ['weekly', 'biweekly', 'monthly', 'quarterly', 'pulsed', 'cyclical', 'infrequent'].includes((modality?.cadence_layer || '').toLowerCase()) ||
                  Boolean(modality?.frequency?.toLowerCase().includes('weekly') || modality?.frequency?.toLowerCase().includes('monthly'))
  
  const category = (modality?.category || '').toLowerCase()
  const isDailySupplement = category.includes('supplement') || category.includes('nutrition') || modality?.cadence_layer === 'daily'

  // Determine current slot and future slots for today
  const currentSlot = (task?.timing_slot || 'morning').toLowerCase()
  const currentSlotOrder = useMemo(() => {
    if (currentSlot.includes('waking') || currentSlot.includes('morning')) return 1
    if (currentSlot.includes('midday') || currentSlot.includes('first_meal')) return 2
    if (currentSlot.includes('afternoon') || currentSlot.includes('workout')) return 3
    if (currentSlot.includes('evening') || currentSlot.includes('dinner')) return 4
    if (currentSlot.includes('wind_down')) return 5
    if (currentSlot.includes('bed') || currentSlot.includes('pre_bed') || currentSlot.includes('night')) return 6
    return 1
  }, [currentSlot])

  // Future slots still remaining today
  const futureSlots = useMemo(() => {
    const remaining = ALL_TODAY_SLOTS.filter(s => s.order > currentSlotOrder)
    if (remaining.length > 0) return remaining
    // Fallback if current task was already in pre-bed or late
    return ALL_TODAY_SLOTS.filter(s => s.order >= 4)
  }, [currentSlotOrder])

  // Derive recommended slot based on modality biology
  const recommendedSlot = useMemo(() => {
    if (!modality) return 'evening'
    const searchStr = `${modality.name} ${modality.category || ''} ${modality.timing_summary || ''} ${(modality as any).default_timing || ''}`.toLowerCase()
    if (searchStr.includes('sleep') || searchStr.includes('melatonin') || searchStr.includes('magnesium') || searchStr.includes('bed') || searchStr.includes('night')) {
      const match = futureSlots.find(s => s.slot === 'pre_bed' || s.slot === 'wind_down')
      if (match) return match.slot
    }
    if (searchStr.includes('dinner') || searchStr.includes('evening') || searchStr.includes('fat') || searchStr.includes('lipid')) {
      const match = futureSlots.find(s => s.slot === 'evening')
      if (match) return match.slot
    }
    if (searchStr.includes('workout') || searchStr.includes('cardio') || searchStr.includes('sauna') || searchStr.includes('heat') || searchStr.includes('plunge')) {
      const match = futureSlots.find(s => s.slot === 'afternoon' || s.slot === 'evening')
      if (match) return match.slot
    }
    if (searchStr.includes('midday') || searchStr.includes('lunch') || searchStr.includes('first_meal')) {
      const match = futureSlots.find(s => s.slot === 'midday')
      if (match) return match.slot
    }
    return futureSlots[0]?.slot || 'evening'
  }, [modality, futureSlots])

  const [selectedSlot, setSelectedSlot] = useState<string>(recommendedSlot)
  const [selectedCustomDate, setSelectedCustomDate] = useState<string>('')

  // Sync selectedSlot if recommendedSlot updates
  useEffect(() => {
    if (recommendedSlot) {
      setSelectedSlot(recommendedSlot)
    }
  }, [recommendedSlot])

  if (!isOpen || !task || !modality) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/80 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                isPastMissedTask
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                  : 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
              }`}>
                {isPastMissedTask ? 'Missed Session Reschedule' : 'Smart Action & Reschedule'}
              </span>
              <span className="text-xs text-slate-400">• {modality.category || 'Protocol Task'}</span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">{modName}</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isPastMissedTask 
                ? `You have a past uncompleted session for ${modName}. Select how to handle your schedule:`
                : `What would you like to do with this scheduled ${modName} session?`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Options Body */}
        <div className="p-5 overflow-y-auto min-h-0 flex-1 space-y-4 text-slate-200 pb-16 overscroll-contain">
          
          {/* Option 1: Snooze to Future Time Slot Today */}
          <div className="p-4 rounded-2xl border border-teal-500/40 bg-gradient-to-br from-teal-950/30 via-slate-900/90 to-slate-950 space-y-3 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-950/80 border border-teal-700/60 flex items-center justify-center text-teal-400 shrink-0 shadow-inner">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Snooze 'Til Later Today</span>
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                    Today
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Move this task to an upcoming circadian window today:
                </p>
              </div>
            </div>

            {/* Time Slot Picker Pills */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {futureSlots.map(slotObj => {
                const isSelected = selectedSlot === slotObj.slot
                const isRecommended = recommendedSlot === slotObj.slot
                return (
                  <button
                    key={slotObj.slot}
                    type="button"
                    onClick={() => setSelectedSlot(slotObj.slot)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-500/20 border-teal-400 text-white font-bold shadow-md ring-1 ring-teal-400/40'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm shrink-0">{slotObj.icon}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">{slotObj.label}</span>
                        <span className="text-[9px] text-slate-400 block truncate">{slotObj.timeRange}</span>
                      </div>
                    </div>
                    {isRecommended && (
                      <span className="text-[8px] bg-purple-500/30 text-purple-200 border border-purple-500/40 px-1 py-0.5 rounded font-mono shrink-0 ml-1">
                        ★ Ideal
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Confirm Snooze Button */}
            <button
              type="button"
              onClick={() => onExecuteReschedule('snooze_later_today', undefined, selectedSlot)}
              className="w-full py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-[0.98] text-slate-950 text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2 ring-1 ring-teal-300/40"
            >
              <Clock size={15} className="text-slate-950 shrink-0" />
              <span className="truncate">
                Confirm Snooze to {ALL_TODAY_SLOTS.find(s => s.slot === selectedSlot)?.label || selectedSlot}
              </span>
            </button>
          </div>

          {/* Option 2: Push to Tomorrow (Slide Split Forward) - Highlighted for Pulsed / Workouts */}
          {isPulsed && (
            <button
              type="button"
              onClick={() => onExecuteReschedule('slide_forward')}
              className="w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all bg-purple-950/40 border-purple-500/60 hover:border-purple-400 hover:bg-purple-950/60 active:scale-[0.98] cursor-pointer group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-900/80 border border-purple-600/80 flex items-center justify-center text-purple-300 shrink-0 group-hover:scale-105 transition-transform">
                <FastForward className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Push to Tomorrow</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded font-bold">Slide Split</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Shift this session to tomorrow, sliding all subsequent split days forward by 1 day to preserve workout sequence.
                </p>
              </div>
            </button>
          )}

          {/* Option 3: Swap with Future Rest Day - Ideal for Workouts / Fasting */}
          {isPulsed && (
            <button
              type="button"
              onClick={() => onExecuteReschedule('swap_rest_day')}
              className="w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all bg-slate-950/60 border-slate-800 hover:border-amber-500/80 hover:bg-slate-800/60 active:scale-[0.98] cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Swap with Future Rest Day</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Exchange this session with a scheduled rest/recovery day later this week without shifting the rest of your calendar.
                </p>
              </div>
            </button>
          )}

          {/* Option 4: Skip Completely with Adaptive Reasons */}
          <div className={`w-full p-4 rounded-2xl border space-y-3 ${
            isDailySupplement && !isPulsed
              ? 'bg-slate-800/90 border-slate-700'
              : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                <SkipForward className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Skip Completely</span>
                  {isDailySupplement && !isPulsed && (
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-medium">Default Daily Action</span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Mark this session as skipped for this cycle. Why are you skipping?
                </p>
              </div>
            </div>

            {/* Quick Reason Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { id: 'Not needed today', label: 'Not needed today', icon: '☀️' },
                { id: 'Too busy', label: 'Too busy', icon: '⚡' },
                { id: 'Too frequent', label: 'Too frequent', icon: '🔄' },
                { id: 'Not helpful', label: 'Not helpful', icon: '📉' },
                { id: 'Not feeling well', label: 'Not feeling well', icon: '🤒' },
                { id: 'Travel / Schedule conflict', label: 'Travel / Conflict', icon: '✈️' },
                { id: 'Rest day substitution', label: 'Rest day', icon: '🏖️' },
              ].map((reason) => {
                const isSelected = selectedSkipReason === reason.id
                return (
                  <button
                    key={reason.id}
                    type="button"
                    onClick={() => setSelectedSkipReason(isSelected ? null : reason.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-md font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 dark:border-white/10'
                    }`}
                  >
                    <span>{reason.icon}</span>
                    <span>{reason.label}</span>
                  </button>
                )
              })}
            </div>

            {/* ADAPTIVE ACTION TRAY FOR 'Not needed today' */}
            {selectedSkipReason === 'Not needed today' && (
              <div className="p-3 rounded-xl border bg-emerald-950/30 border-emerald-500/40 text-emerald-200 space-y-2 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    ☀️ Situational / Not Needed Today
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                    Streak Protected
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Staying indoors, resting, or conditional protocol? Mark this session as not needed today without penalizing your adherence score or breaking routine streaks.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onExecuteReschedule('not_needed_today')}
                    className="px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Check size={13} strokeWidth={3} className="text-slate-950" />
                    <span>Confirm: Not Needed Today</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDosageModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Sliders size={13} className="text-slate-400" />
                    <span>Adjust Cadence / Schedule</span>
                  </button>
                </div>
              </div>
            )}

            {/* ADAPTIVE ACTION TRAY FOR 'Too busy' */}
            {selectedSkipReason === 'Too busy' && (
              <div className="p-3 rounded-xl border bg-amber-950/30 border-amber-500/40 text-amber-200 space-y-2 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    ⚡ Too busy today?
                  </span>
                  <span className="text-[10px] text-amber-200/70 font-semibold">Choose an action:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Short on time? Reduce the duration or dose, bench this modality for later, or eliminate it from your routine:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsDosageModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40 active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Sliders size={13} className="text-cyan-400" />
                    <span>Change Dosing</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onExecuteReschedule('move_to_bench')}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Archive size={13} className="text-amber-400" />
                    <span>Move to Bench</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onExecuteReschedule('eliminate_entirely')}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40 active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Trash2 size={13} className="text-rose-400" />
                    <span>Eliminate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onExecuteReschedule('skip_session')}
                    className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all bg-white/10 hover:bg-white/15 text-slate-300 border-white/20 active:scale-95 cursor-pointer"
                  >
                    <SkipForward size={13} />
                    <span>Skip Session Only</span>
                  </button>
                </div>
              </div>
            )}

            {/* ADAPTIVE ACTION TRAY FOR 'Too frequent' */}
            {selectedSkipReason === 'Too frequent' && (
              <div className="p-3 rounded-xl border bg-cyan-950/30 border-cyan-500/40 text-cyan-200 space-y-2 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    🔄 Too frequent?
                  </span>
                  <span className="text-[10px] text-cyan-200/70 font-semibold">Choose an action:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Cadence feels overwhelming? Adjust weekly frequency or session intervals:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsDosageModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40 active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Sliders size={13} className="text-cyan-400" />
                    <span>Change Dosing / Frequency</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onExecuteReschedule('skip_session')}
                    className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all bg-white/10 hover:bg-white/15 text-slate-300 border-white/20 active:scale-95 cursor-pointer"
                  >
                    <SkipForward size={13} />
                    <span>Skip Session Only</span>
                  </button>
                </div>
              </div>
            )}

            {/* ADAPTIVE ACTION TRAY FOR 'Not helpful' */}
            {selectedSkipReason === 'Not helpful' && (
              <div className="p-3 rounded-xl border bg-rose-950/30 border-rose-500/40 text-rose-200 space-y-2 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    📉 Not helpful?
                  </span>
                  <span className="text-[10px] text-rose-200/70 font-semibold">Choose an action:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Not getting the expected clinical payoff? Recalibrate the dose/timing, move to bench while trying alternatives, or eliminate from your stack:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsDosageModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40 active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Sliders size={13} className="text-cyan-400" />
                    <span>Change Dosing</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onExecuteReschedule('move_to_bench')}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Archive size={13} className="text-amber-400" />
                    <span>Move to Bench</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onExecuteReschedule('eliminate_entirely')}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40 active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Trash2 size={13} className="text-rose-400" />
                    <span>Eliminate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onExecuteReschedule('skip_session')}
                    className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all bg-white/10 hover:bg-white/15 text-slate-300 border-white/20 active:scale-95 cursor-pointer"
                  >
                    <SkipForward size={13} />
                    <span>Skip Session Only</span>
                  </button>
                </div>
              </div>
            )}

            {/* Standard Skip Button if no adaptive reason selected */}
            {!['Not needed today', 'Too busy', 'Too frequent', 'Not helpful'].includes(selectedSkipReason || '') && (
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => onExecuteReschedule('skip_session')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white keep-white font-bold text-xs rounded-xl border border-slate-700/80 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  <SkipForward size={13} className="text-white" />
                  <span className="text-white">Confirm Skip</span>
                </button>
              </div>
            )}
          </div>

          {/* Option 5: Custom Date Picker */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Reschedule to Custom Date</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedCustomDate}
                onChange={(e) => setSelectedCustomDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl text-xs text-white p-2.5 flex-1 focus:outline-none focus:border-cyan-500"
              />
              <button
                disabled={!selectedCustomDate}
                onClick={() => onExecuteReschedule('custom_date', selectedCustomDate)}
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white keep-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              >
                Set Date
              </button>
            </div>
          </div>

          {/* Section Divider: Stack Management Options */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2.5 flex items-center gap-2">
              <span>Stack Management</span>
              <div className="flex-1 h-[1px] bg-slate-800" />
            </div>
            
            <div className="space-y-2.5">
              {/* Option 6: Move to Bench */}
              <button
                type="button"
                onClick={() => onExecuteReschedule('move_to_bench')}
                className="w-full p-3.5 rounded-2xl border text-left flex items-start gap-3.5 transition-all bg-amber-950/20 border-amber-800/40 hover:border-amber-500/80 hover:bg-amber-950/40 active:scale-[0.98] cursor-pointer group shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-700/60 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Archive className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="text-xs font-bold text-amber-200 flex items-center gap-2">
                    <span>Move to Bench</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-semibold">Deactivate</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Pause this modality and store it on your Bench. You can reactivate it anytime.
                  </p>
                </div>
              </button>

              {/* Option 7: Eliminate from Schedule */}
              <button
                type="button"
                onClick={() => onExecuteReschedule('eliminate_entirely')}
                className="w-full p-3.5 rounded-2xl border text-left flex items-start gap-3.5 transition-all bg-rose-950/20 border-rose-900/40 hover:border-rose-500/80 hover:bg-rose-950/40 active:scale-[0.98] cursor-pointer group shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="text-xs font-bold text-rose-300 flex items-center gap-2">
                    <span>Eliminate from Schedule</span>
                    <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded font-semibold">Kept in Library</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Removes this modality and future sessions from your daily schedule. It will remain saved and accessible in your Protocol Library at any time.
                  </p>
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200/90 hover:bg-slate-300 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Full Canonical Dosage & Scheduling Configuration Modal */}
      {isDosageModalOpen && modality && (
        <DosageDetailModal
          isOpen={true}
          onClose={() => setIsDosageModalOpen(false)}
          modality={modality}
          task={task}
          onSelectDose={() => {
            setIsDosageModalOpen(false)
            onClose()
          }}
          onSavePersonalization={() => {
            setIsDosageModalOpen(false)
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('levl_schedule_updated'))
              window.dispatchEvent(new CustomEvent('levl_tasks_updated'))
            }
            onClose()
          }}
        />
      )}
    </div>
  )
}

export default SmartRescheduleModal
