'use client'

import React, { useState } from 'react'
import { UserProfile } from '@/lib/types'
import { updateUserProfile } from '@/lib/data'
import { Dumbbell, Activity, Clock, ShieldAlert, Sparkles, Check, CheckCircle2, ShieldCheck, Flame } from 'lucide-react'

interface PhysicalTrainingRecoveryCardProps {
  profile: UserProfile
  onUpdated?: (updated: UserProfile) => void
}

const WORKOUT_WINDOWS = [
  {
    id: 'morning',
    label: 'Morning (6:00 – 8:30 AM)',
    desc: 'Early fasted or pre-work training. Cortisol peak alignment.'
  },
  {
    id: 'midday',
    label: 'Midday (11:30 AM – 1:30 PM)',
    desc: 'Lunchtime break session. High body temperature & glycogen availability.'
  },
  {
    id: 'afternoon',
    label: 'Afternoon (4:30 – 7:00 PM)',
    desc: 'Peak muscular force, grip strength, and core body temperature window.'
  },
  {
    id: 'evening',
    label: 'Evening (7:00 – 9:00 PM)',
    desc: 'Late day training. Requires separation from sleep lights-out window.'
  }
]

const DAYS_OF_WEEK = [
  { id: 'Mon', label: 'Mon' },
  { id: 'Tue', label: 'Tue' },
  { id: 'Wed', label: 'Wed' },
  { id: 'Thu', label: 'Thu' },
  { id: 'Fri', label: 'Fri' },
  { id: 'Sat', label: 'Sat' },
  { id: 'Sun', label: 'Sun' }
]

const FITNESS_LEVELS = [
  {
    id: 'beginner',
    label: 'Beginner',
    desc: 'Establishing regular aerobic base & entry resistance routine (1–2x weekly).'
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    desc: 'Consistent structured lifting & Zone 2 cardio (3–4x weekly).'
  },
  {
    id: 'advanced',
    label: 'Advanced',
    desc: 'High-level progressive overload, Norwegian 4x4 VO2 Max, and structured splits.'
  },
  {
    id: 'elite',
    label: 'Elite Athlete',
    desc: 'Competitive endurance / strength athlete with heavy weekly training volumes.'
  }
]

export default function PhysicalTrainingRecoveryCard({ profile, onUpdated }: PhysicalTrainingRecoveryCardProps) {
  const prefs = profile.outcome_preference_scores || {}

  const [workoutWindow, setWorkoutWindow] = useState<string>(
    profile.primary_workout_window || prefs.primary_workout_window || 'afternoon'
  )
  const [resistanceDays, setResistanceDays] = useState<string[]>(
    profile.resistance_training_days || prefs.resistance_training_days || ['Mon', 'Wed', 'Fri']
  )
  const [fitnessLevel, setFitnessLevel] = useState<string>(
    profile.fitness_training_level || prefs.fitness_training_level || 'intermediate'
  )
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const toggleDay = (day: string) => {
    setResistanceDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day)
      } else {
        return [...prev, day]
      }
    })
  }

  // Calculate non-lifting rest/recovery days for cold plunge recommendations
  const allDayIds = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const recoveryDays = allDayIds.filter(d => !resistanceDays.includes(d))

  const handleSave = async () => {
    setIsSaving(true)
    const updatedPrefs = {
      ...profile.outcome_preference_scores,
      primary_workout_window: workoutWindow,
      resistance_training_days: resistanceDays,
      fitness_training_level: fitnessLevel
    }

    const updated = await updateUserProfile(profile.local_user_id, {
      primary_workout_window: workoutWindow,
      resistance_training_days: resistanceDays,
      fitness_training_level: fitnessLevel,
      outcome_preference_scores: updatedPrefs
    })

    setIsSaving(false)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
    if (updated && onUpdated) onUpdated(updated)
  }

  return (
    <div className="glass-card p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center shadow-md shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>Physical Training & Recovery Schedule</span>
            </h2>
            <p className="text-xs text-slate-400">
              Enforces the Cold Plunge Anti-Blunting rule and tailors exercise intensity
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-black font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
        >
          {savedSuccess ? <Check size={14} /> : <Dumbbell size={14} />}
          <span>{savedSuccess ? 'Saved!' : 'Save Schedule'}</span>
        </button>
      </div>

      {/* Primary Workout Window */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Clock size={14} className="text-orange-400" />
          <span>Primary Workout Window</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {WORKOUT_WINDOWS.map((w) => {
            const isSelected = workoutWindow === w.id
            return (
              <div
                key={w.id}
                onClick={() => setWorkoutWindow(w.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-orange-950/30 border-orange-500/50 text-white shadow-md'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSelected ? 'text-orange-300' : 'text-white'}`}>
                    {w.label}
                  </span>
                  {isSelected && <CheckCircle2 size={13} className="text-orange-400 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{w.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly Resistance Training Days */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Dumbbell size={14} className="text-orange-400" />
            <span>Weekly Resistance Training Days</span>
          </label>
          <span className="text-[10px] font-mono text-orange-300 font-bold">
            {resistanceDays.length} Days / Week
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((d) => {
            const isSelected = resistanceDays.includes(d.id)
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDay(d.id)}
                className={`flex-1 min-w-[42px] py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-orange-500 border-orange-400 text-black shadow-md'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                {d.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Fitness & Cardio Level */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Flame size={14} className="text-orange-400" />
          <span>Fitness & Cardio Training Level</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {FITNESS_LEVELS.map((lvl) => {
            const isSelected = fitnessLevel === lvl.id
            return (
              <div
                key={lvl.id}
                onClick={() => setFitnessLevel(lvl.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-orange-950/30 border-orange-500/50 text-white shadow-md'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSelected ? 'text-orange-300' : 'text-white'}`}>
                    {lvl.label}
                  </span>
                  {isSelected && <CheckCircle2 size={13} className="text-orange-400 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{lvl.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cold Plunge Anti-Blunting Automated Scheduling Rule Display */}
      <div className="p-4 bg-slate-950/80 border border-slate-800/90 rounded-xl space-y-2.5 text-xs">
        <div className="flex items-center justify-between font-bold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-1.5 text-blue-300">
            <ShieldCheck size={14} className="text-blue-400" />
            <span>Automated Cold Plunge Anti-Blunting Rule</span>
          </span>
          <span className="text-[10px] font-mono text-blue-400 font-bold">mTORC1 Protected</span>
        </div>

        <p className="text-slate-300 leading-relaxed">
          Cold exposure within 4 hours post-lifting blunts p70S6K and satellite cell muscle hypertrophy.
        </p>

        <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-lg space-y-1 text-slate-200">
          <div className="flex items-center justify-between">
            <span>
              <strong>Lifting Days ({resistanceDays.join(', ') || 'None'}):</strong>
            </span>
            <span className="text-blue-300 font-mono">Cold Plunge ≥ 4h Post-Workout</span>
          </div>
          <div className="flex items-center justify-between">
            <span>
              <strong>Recovery Days ({recoveryDays.join(', ') || 'None'}):</strong>
            </span>
            <span className="text-emerald-300 font-mono">Optimal Morning Cold Shock</span>
          </div>
        </div>
      </div>
    </div>
  )
}
