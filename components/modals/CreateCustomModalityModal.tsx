'use client'

import React, { useState } from 'react'
import { X, Sparkles, Plus, Clock, Pill, BookOpen, Bookmark, Calendar, Check, ArrowRight } from 'lucide-react'
import { createCustomModality, addModalityOrProtocolToToday, addToBench } from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'

interface CreateCustomModalityModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: (modality: any) => void
}

const CATEGORIES = [
  'Supplements',
  'Peptides',
  'Thermal',
  'Fitness',
  'Sleep',
  'Nootropics',
  'Diagnostics',
  'Nutrition',
  'Mindfulness',
  'Light Therapy',
  'Other'
]

const TIMING_SLOTS = [
  { value: 'waking', label: 'Waking (First 30 mins)' },
  { value: 'morning_routine', label: 'Morning Routine' },
  { value: 'morning_supplement_stack', label: 'Morning Supplement Stack' },
  { value: 'midday', label: 'Midday / Lunch' },
  { value: 'afternoon', label: 'Afternoon / Workout' },
  { value: 'post_meal', label: 'Post Meal' },
  { value: 'evening_supplement_stack', label: 'Evening Supplement Stack' },
  { value: 'wind_down', label: 'Evening Wind-Down' },
  { value: 'bedtime', label: 'Bedtime (30m before sleep)' },
  { value: 'anytime', label: 'Anytime' }
]

export default function CreateCustomModalityModal({
  isOpen,
  onClose,
  onCreated
}: CreateCustomModalityModalProps) {
  const { localUserId: authUserId } = useAuth()
  const localUserId = authUserId || getLocalUserId()

  const [name, setName] = useState('')
  const [category, setCategory] = useState('Supplements')
  const [dose, setDose] = useState('')
  const [timingSlot, setTimingSlot] = useState('anytime')
  const [instructions, setInstructions] = useState('')
  const [headlineBenefit, setHeadlineBenefit] = useState('')

  const [scheduleToToday, setScheduleToToday] = useState(true)
  const [saveToBench, setSaveToBench] = useState(true)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Please enter a modality name.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const createdMod = await createCustomModality(localUserId, {
        name: name.trim(),
        category,
        dose_or_exposure: dose.trim() || undefined,
        default_timing_slot: timingSlot,
        brief_description: headlineBenefit.trim() || instructions.trim() || 'Custom user-created protocol modality'
      })

      if (!createdMod) {
        throw new Error('Failed to create modality')
      }

      // 1. If user checked "Add to Today"
      if (scheduleToToday) {
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        await addModalityOrProtocolToToday(localUserId, todayStr, createdMod.id)
      }

      // 2. If user checked "Add to Bench"
      if (saveToBench) {
        await addToBench(localUserId, createdMod.id)
      }

      // Dispatch catalog update event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('levl_modality_created', { detail: createdMod }))
        window.dispatchEvent(new CustomEvent('levl_bench_updated'))
      }

      setSuccessMsg('Modality created and added successfully!')
      if (onCreated) onCreated(createdMod)

      setTimeout(() => {
        setIsSubmitting(false)
        setSuccessMsg('')
        onClose()
      }, 600)
    } catch (err: any) {
      console.error('Error creating custom modality:', err)
      setErrorMsg(err.message || 'An error occurred while creating your modality.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Create Custom Modality</h2>
              <p className="text-xs text-slate-400">Add any supplement, exercise, or bio-routine to your catalog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
              <Check size={16} />
              {successMsg}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Modality Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tongkat Ali 400mg, Zone 2 Ruck Walk, Red Light (660nm)"
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Category & Timing Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-all cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Default Timing Slot
              </label>
              <select
                value={timingSlot}
                onChange={(e) => setTimingSlot(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-all cursor-pointer"
              >
                {TIMING_SLOTS.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dose / Exposure */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Default Dose or Exposure Spec
            </label>
            <div className="relative">
              <input
                type="text"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="e.g. 400mg with morning meal, 20 mins @ 174°F, 500ml water"
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all"
              />
              <Pill size={15} className="absolute left-3 top-3 text-slate-500" />
            </div>
          </div>

          {/* Primary Benefit / Headline */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Headline Benefit / Purpose
            </label>
            <input
              type="text"
              value={headlineBenefit}
              onChange={(e) => setHeadlineBenefit(e.target.value)}
              placeholder="e.g. Optimizes free testosterone and sustained daytime energy"
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Instructions / Protocol Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Instructions & Synergy Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Cycle 5 days on / 2 days off. Take with dietary fat for optimal bioavailability."
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Quick Routing Checkboxes */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 cursor-pointer hover:bg-slate-950/80 transition-all">
              <input
                type="checkbox"
                checked={scheduleToToday}
                onChange={(e) => setScheduleToToday(e.target.checked)}
                className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-slate-900 border-slate-700"
              />
              <div className="flex-1">
                <div className="text-xs font-medium text-white flex items-center gap-1.5">
                  <Calendar size={13} className="text-sky-400" />
                  Add to Today's Execution Schedule
                </div>
                <div className="text-[10px] text-slate-400">Instantly creates a task on your Today dashboard</div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 cursor-pointer hover:bg-slate-950/80 transition-all">
              <input
                type="checkbox"
                checked={saveToBench}
                onChange={(e) => setSaveToBench(e.target.checked)}
                className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-slate-900 border-slate-700"
              />
              <div className="flex-1">
                <div className="text-xs font-medium text-white flex items-center gap-1.5">
                  <Bookmark size={13} className="text-amber-400" />
                  Save to Protocol Bench
                </div>
                <div className="text-[10px] text-slate-400">Pins this modality to your active bench for quick access</div>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
            >
              {isSubmitting ? (
                <>Saving...</>
              ) : (
                <>
                  <Plus size={14} />
                  Create Modality
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
