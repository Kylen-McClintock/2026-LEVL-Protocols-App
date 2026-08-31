'use client'

import React, { useState } from 'react'
import { UserProfile } from '@/lib/types'
import { updateUserProfile } from '@/lib/data'
import { Utensils, Zap, Sparkles, Check, Clock, Droplets, CheckCircle2, ShieldCheck } from 'lucide-react'

interface FastingFeedingCardProps {
  profile: UserProfile
  onUpdated?: (updated: UserProfile) => void
}

const FASTING_SCHEDULES = [
  {
    id: '16:8',
    label: '16:8 Intermittent Fasting',
    desc: '16h daily fast, 8h eating window. Optimal balance of cellular autophagy and metabolic flexibility.',
    defaultStart: '12:00',
    defaultEnd: '20:00'
  },
  {
    id: '18:6',
    label: '18:6 Deep Autophagy Fast',
    desc: '18h daily fast, 6h eating window. Deeper glycogen depletion and elevated ketone production.',
    defaultStart: '13:00',
    defaultEnd: '19:00'
  },
  {
    id: '20:4',
    label: '20:4 Warrior Diet',
    desc: '20h daily fast, 4h condensed window. Maximizes daytime sympathetic alertness.',
    defaultStart: '16:00',
    defaultEnd: '20:00'
  },
  {
    id: 'omad',
    label: 'OMAD (One Meal A Day)',
    desc: '23h fast with a single nutrient-dense 1-hour feast.',
    defaultStart: '18:00',
    defaultEnd: '19:00'
  },
  {
    id: 'circadian',
    label: 'Circadian Early-TRF (eTRF)',
    desc: 'Early eating window (8:00 AM – 4:00 PM) aligned with highest insulin sensitivity.',
    defaultStart: '08:00',
    defaultEnd: '16:00'
  },
  {
    id: 'none',
    label: 'Standard Meals / Non-Fasting',
    desc: 'Regular 3-meal cadence without deliberate prolonged fasting windows.',
    defaultStart: '07:30',
    defaultEnd: '19:30'
  }
]

export default function FastingFeedingCard({ profile, onUpdated }: FastingFeedingCardProps) {
  const prefs = profile.outcome_preference_scores || {}

  const [schedule, setSchedule] = useState<string>(
    profile.fasting_schedule || prefs.fasting_schedule || '16:8'
  )
  const [windowStart, setWindowStart] = useState<string>(
    profile.eating_window_start || prefs.eating_window_start || '12:00'
  )
  const [windowEnd, setWindowEnd] = useState<string>(
    profile.eating_window_end || prefs.eating_window_end || '20:00'
  )
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const autoSave = async (updates: Partial<UserProfile>) => {
    setIsSaving(true)
    const updatedPrefs = {
      ...profile.outcome_preference_scores,
      fasting_schedule: updates.fasting_schedule || schedule,
      eating_window_start: updates.eating_window_start || windowStart,
      eating_window_end: updates.eating_window_end || windowEnd
    }

    const updated = await updateUserProfile(profile.local_user_id, {
      ...updates,
      outcome_preference_scores: updatedPrefs
    })

    setIsSaving(false)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2000)
    if (updated && onUpdated) onUpdated(updated)
  }

  const handleSelectSchedule = (schedId: string) => {
    setSchedule(schedId)
    const matched = FASTING_SCHEDULES.find(s => s.id === schedId)
    const start = matched ? matched.defaultStart : windowStart
    const end = matched ? matched.defaultEnd : windowEnd
    if (matched) {
      setWindowStart(start)
      setWindowEnd(end)
    }
    autoSave({
      fasting_schedule: schedId,
      eating_window_start: start,
      eating_window_end: end
    })
  }

  return (
    <div className="glass-card p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-5">
      {/* Header */}
      <div className="space-y-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center shadow-md shrink-0 mt-0.5">
            <Utensils size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>Fasting &amp; Eating Window Schedule</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Sorts your supplements into Fasted vs. Fed (Lipid Carrier) protocols
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-mono">
              {isSaving ? (
                <span className="text-teal-400 font-bold animate-pulse">Saving...</span>
              ) : savedSuccess ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check size={12} /> Auto-saved
                </span>
              ) : (
                <span className="text-slate-500 font-medium">Auto-saves on change</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fasting Schedule Archetypes */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-300 block">
          Select Fasting Cadence
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {FASTING_SCHEDULES.map((s) => {
            const isSelected = schedule === s.id
            return (
              <div
                key={s.id}
                onClick={() => handleSelectSchedule(s.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-teal-950/30 border-teal-500/50 text-white shadow-md'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? 'text-teal-300' : 'text-white'}`}>
                      {s.label}
                    </span>
                    {isSelected && <CheckCircle2 size={13} className="text-teal-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{s.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Eating Window Start & End */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Clock size={14} className="text-teal-400" />
            <span>Eating Window Start (First Bite)</span>
          </label>
          <input
            type="time"
            value={windowStart}
            onChange={(e) => {
              const val = e.target.value
              setWindowStart(val)
              autoSave({ eating_window_start: val })
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-teal-500"
          />
          <p className="text-[11px] text-slate-500">Marks the opening of your nutrient absorption phase</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Clock size={14} className="text-emerald-400" />
            <span>Eating Window End (Last Bite)</span>
          </label>
          <input
            type="time"
            value={windowEnd}
            onChange={(e) => {
              const val = e.target.value
              setWindowEnd(val)
              autoSave({ eating_window_end: val })
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
          />
          <p className="text-[11px] text-slate-500">Marks the start of cellular fasting &amp; autophagy</p>
        </div>
      </div>

      {/* Supplement Sorting Breakdown */}
      <div className="p-4 bg-slate-950/80 border border-slate-800/90 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-1.5">
            <Zap size={13} className="text-teal-400" />
            <span>Automated Protocol Dosing Windows</span>
          </span>
          <span className="text-[10px] font-mono text-teal-400 font-bold">
            {schedule === 'none' ? 'All-Day Fed' : `${windowStart} – ${windowEnd} Fed`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-lg bg-teal-950/20 border border-teal-500/30 space-y-1.5">
            <div className="font-bold text-teal-300 flex items-center gap-1.5">
              <Droplets size={13} />
              <span>Fasted Phase (Morning)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              NMN, NAD+, Electrolytes, Green Tea, L-Tyrosine, Autophagy stimulants.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 space-y-1.5">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <ShieldCheck size={13} />
              <span>Fed Phase (With Meal / Lipids)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Fat-Soluble Vitamins (D3, K2, CoQ10, Vit E), Senolytics (Fisetin, Curcumin), Digestives.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
