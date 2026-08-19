'use client'

import React, { useState } from 'react'
import { UserProfile } from '@/lib/types'
import { updateUserProfile } from '@/lib/data'
import { Moon, Sun, Clock, Coffee, Eye, Sparkles, Check, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react'

interface CircadianAnchorsCardProps {
  profile: UserProfile
  onUpdated?: (updated: UserProfile) => void
}

const CHRONOTYPES = [
  {
    id: 'lion',
    label: 'Lion / Early Lark',
    emoji: '🦁',
    desc: 'Wakes easily early (5:00–6:00 AM). Peak focus early morning; early bedtime (9:00–10:00 PM).'
  },
  {
    id: 'bear',
    label: 'Bear / Intermediate',
    emoji: '🐻',
    desc: 'Aligned with solar cycle (7:00 AM wake). Peak productivity 10:00 AM–2:00 PM; bedtime ~11:00 PM.'
  },
  {
    id: 'wolf',
    label: 'Wolf / Night Owl',
    emoji: '🐺',
    desc: 'Natural late riser (8:00–9:00 AM). Peak creative drive 5:00–10:00 PM; bedtime ~12:00–1:00 AM.'
  },
  {
    id: 'dolphin',
    label: 'Dolphin / Light Sleeper',
    emoji: '🐬',
    desc: 'Fragmented or light sleep patterns. Requires strict circadian light hygiene and consistent anchors.'
  }
]

export default function CircadianAnchorsCard({ profile, onUpdated }: CircadianAnchorsCardProps) {
  const prefs = profile.outcome_preference_scores || {}

  const [wakeTime, setWakeTime] = useState<string>(
    profile.ideal_wake_time || prefs.ideal_wake_time || '06:30'
  )
  const [bedTime, setBedTime] = useState<string>(
    profile.ideal_bedtime || prefs.ideal_bedtime || '22:30'
  )
  const [chronotype, setChronotype] = useState<string>(
    profile.chronotype || prefs.chronotype || 'bear'
  )
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Calculate dynamic circadian milestones from wake & bed times
  const calculateMilestones = () => {
    const [wakeH, wakeM] = wakeTime.split(':').map(Number)
    const [bedH, bedM] = bedTime.split(':').map(Number)

    const formatTime = (h: number, m: number) => {
      let normH = (h + 24) % 24
      const ampm = normH >= 12 ? 'PM' : 'AM'
      let dispH = normH % 12
      if (dispH === 0) dispH = 12
      const dispM = m < 10 ? `0${m}` : m
      return `${dispH}:${dispM} ${ampm}`
    }

    // 1. Morning Light: Wake to Wake + 60m
    const morningLightEndH = wakeH + 1
    const morningLightStr = `${formatTime(wakeH, wakeM)} – ${formatTime(morningLightEndH, wakeM)}`

    // 2. Adenosine Delay (90m post wake)
    const adenosineH = wakeH + Math.floor((wakeM + 90) / 60)
    const adenosineM = (wakeM + 90) % 60
    const adenosineStr = formatTime(adenosineH, adenosineM)

    // 3. Caffeine Cutoff (10h before bed)
    const caffCutoffH = bedH - 10
    const caffCutoffStr = formatTime(caffCutoffH, bedM)

    // 4. Last Meal / Metabolic Cutoff (3h before bed)
    const mealCutoffH = bedH - 3
    const mealCutoffStr = formatTime(mealCutoffH, bedM)

    // 5. Blue Light / Screen Reduction (2h before bed)
    const blueLightH = bedH - 2
    const blueLightStr = formatTime(blueLightH, bedM)

    return {
      morningLightStr,
      adenosineStr,
      caffCutoffStr,
      mealCutoffStr,
      blueLightStr
    }
  }

  const milestones = calculateMilestones()

  const handleSave = async () => {
    setIsSaving(true)
    const updatedPrefs = {
      ...profile.outcome_preference_scores,
      ideal_wake_time: wakeTime,
      ideal_bedtime: bedTime,
      chronotype
    }

    const updated = await updateUserProfile(profile.local_user_id, {
      ideal_wake_time: wakeTime,
      ideal_bedtime: bedTime,
      chronotype,
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
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-md shrink-0">
            <Sun size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>Circadian & Chronobiology Anchors</span>
            </h2>
            <p className="text-xs text-slate-400">
              Drives your personalized daily Diurnal rhythm, sunlight, and caffeine cutoffs
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
        >
          {savedSuccess ? <Check size={14} /> : <Clock size={14} />}
          <span>{savedSuccess ? 'Saved!' : 'Save Anchors'}</span>
        </button>
      </div>

      {/* Target Bed & Wake Times */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Sun size={14} className="text-amber-400" />
            <span>Target Wake Time</span>
          </label>
          <input
            type="time"
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
          />
          <p className="text-[11px] text-slate-500">Anchors your morning sunlight and cortisol peak</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Moon size={14} className="text-indigo-400" />
            <span>Target Sleep / Lights Out</span>
          </label>
          <input
            type="time"
            value={bedTime}
            onChange={(e) => setBedTime(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
          />
          <p className="text-[11px] text-slate-500">Anchors your caffeine and metabolic fasting cutoffs</p>
        </div>
      </div>

      {/* Chronotype Selection */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-300 block">
          Biological Chronotype
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {CHRONOTYPES.map((ct) => {
            const isSelected = chronotype === ct.id
            return (
              <div
                key={ct.id}
                onClick={() => setChronotype(ct.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                  isSelected
                    ? 'bg-amber-950/30 border-amber-500/50 text-white shadow-md'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-xl shrink-0 mt-0.5">{ct.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                      {ct.label}
                    </span>
                    {isSelected && <CheckCircle2 size={13} className="text-amber-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{ct.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Auto-Calculated Circadian Milestones Engine Display */}
      <div className="p-4 bg-slate-950/80 border border-slate-800/90 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-400" />
            <span>Auto-Calculated Diurnal Timeline</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">Live Circadian Waveform</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Sun size={13} className="text-amber-400" /> Morning Sunlight
            </span>
            <span className="font-mono font-bold text-amber-300">{milestones.morningLightStr}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Coffee size={13} className="text-orange-400" /> 90m Coffee Delay
            </span>
            <span className="font-mono font-bold text-orange-300">{milestones.adenosineStr}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-1.5">
              <ShieldAlert size={13} className="text-red-400" /> 10h Caffeine Cutoff
            </span>
            <span className="font-mono font-bold text-red-300">{milestones.caffCutoffStr}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Flame size={13} className="text-yellow-400" /> Last Meal Cutoff (3h)
            </span>
            <span className="font-mono font-bold text-yellow-300">{milestones.mealCutoffStr}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 flex items-center justify-between sm:col-span-2">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Eye size={13} className="text-indigo-400" /> Blue Light Reduction (2h)
            </span>
            <span className="font-mono font-bold text-indigo-300">{milestones.blueLightStr}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
