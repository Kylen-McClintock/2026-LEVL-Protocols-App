'use client'

import React, { useState } from 'react'
import { DailyProtocolTask, Modality } from '@/lib/types'
import { X, Calendar, FastForward, ArrowRightLeft, Clock, SkipForward, AlertCircle, Sparkles, ShieldAlert } from 'lucide-react'

export type RescheduleActionType = 
  | 'slide_forward'        // Push session to next day (slides entire sequence)
  | 'swap_rest_day'        // Swap session with a designated rest/recovery day
  | 'snooze_later_today'   // Move task to a later timing slot today (evening/pre-bed)
  | 'skip_session'         // Mark session skipped (stay on calendar schedule)
  | 'custom_date'          // Pick a custom future date on calendar

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

export const SmartRescheduleModal: React.FC<SmartRescheduleModalProps> = ({
  isOpen,
  onClose,
  task,
  modality,
  isPastMissedTask = false,
  onExecuteReschedule
}) => {
  if (!isOpen || !task || !modality) return null

  const [selectedCustomDate, setSelectedCustomDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string>('evening_supplement_stack')

  const modName = modality.name
  const isPulsed = (modality as any).is_pulsed || 
                  ['weekly', 'biweekly', 'monthly', 'quarterly', 'pulsed', 'cyclical', 'infrequent'].includes((modality.cadence_layer || '').toLowerCase()) ||
                  Boolean(modality.frequency?.toLowerCase().includes('weekly') || modality.frequency?.toLowerCase().includes('monthly'))
  
  const category = (modality.category || '').toLowerCase()
  const isDailySupplement = category.includes('supplement') || category.includes('nutrition') || modality.cadence_layer === 'daily'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/70">
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
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Options Body */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 text-slate-200">
          
          {/* Option 1: Snooze 'Til Later (This Evening) */}
          <button
            onClick={() => onExecuteReschedule('snooze_later_today', undefined, selectedSlot)}
            className="w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all bg-slate-950/60 border-slate-800 hover:border-teal-500/80 hover:bg-slate-800/60 group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-950/80 border border-teal-800/60 flex items-center justify-center text-teal-400 shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Snooze 'Til Later</span>
                <span className="text-[10px] bg-teal-950/80 text-teal-300 border border-teal-800/60 px-2 py-0.5 rounded font-mono">This Evening</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">Move this task to tonight's evening or pre-bed timing stack.</p>
            </div>
          </button>

          {/* Option 2: Push to Tomorrow (Slide Split Forward) - Highlighted for Pulsed / Workouts */}
          {isPulsed && (
            <button
              onClick={() => onExecuteReschedule('slide_forward')}
              className="w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all bg-purple-950/40 border-purple-500/60 hover:border-purple-400 hover:bg-purple-950/60 group shadow-sm"
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
              onClick={() => onExecuteReschedule('swap_rest_day')}
              className="w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all bg-slate-950/60 border-slate-800 hover:border-amber-500/80 hover:bg-slate-800/60 group"
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

          {/* Option 4: Skip Completely (Default for Daily Supplements / Habits) */}
          <button
            onClick={() => onExecuteReschedule('skip_session')}
            className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
              isDailySupplement && !isPulsed
                ? 'bg-slate-800/90 border-slate-700 hover:border-slate-500'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            } group`}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 group-hover:scale-105 transition-transform">
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
                Mark this session as skipped for this cycle. Your schedule continues normally without making up this session.
              </p>
            </div>
          </button>

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
                className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
              >
                Set Date
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
