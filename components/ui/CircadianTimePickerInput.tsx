'use client'

import React from 'react'

export interface CircadianTimePickerInputProps {
  value: string // 24h format "HH:mm" e.g. "06:30" or "22:30"
  onChange: (newValue: string) => void
  label?: string
  icon?: React.ReactNode
  helperText?: string
  accentColor?: 'amber' | 'indigo' | 'emerald' | 'rose' | 'orange' | 'sky'
  stepMinutes?: number // default 15
  className?: string
  disabled?: boolean
  compact?: boolean
}

/**
 * Formats a 24-hour time string ("19:30") to friendly 12-hour format ("7:30 PM")
 */
export function formatTimeTo12h(timeStr: string): string {
  if (!timeStr || !timeStr.includes(':')) return timeStr || '--:--'
  const [hStr, mStr] = timeStr.split(':')
  let h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (isNaN(h) || isNaN(m)) return timeStr
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`
}

/**
 * Adjusts time forwards or backwards by delta minutes (e.g. +15 or -15), wrapping cleanly around midnight
 */
export function adjustTimeMinutes(timeStr: string, deltaMins: number): string {
  if (!timeStr || !timeStr.includes(':')) return timeStr || '12:00'
  const [hStr, mStr] = timeStr.split(':')
  let h = parseInt(hStr, 10)
  let m = parseInt(mStr, 10)
  if (isNaN(h) || isNaN(m)) return timeStr
  let totalMins = ((h * 60 + m + deltaMins) % 1440 + 1440) % 1440
  const newH = Math.floor(totalMins / 60).toString().padStart(2, '0')
  const newM = (totalMins % 60).toString().padStart(2, '0')
  return `${newH}:${newM}`
}

/**
 * Resolves the default start time for last meal from user's adjusted circadian onboarding milestones or bedtime
 */
export function resolveCircadianLastMealTime(profile?: any): string {
  if (!profile) return '19:30'

  // 1. Check custom diurnal milestone override saved during onboarding or profile editing
  const customMilestones = (profile.preferences as any)?.outcome_scores?._diurnal_milestone_overrides
  if (customMilestones && customMilestones.meal_cutoff) {
    const raw = customMilestones.meal_cutoff.trim()
    if (/^\d{1,2}:\d{2}$/.test(raw)) {
      const [h, m] = raw.split(':')
      return `${h.padStart(2, '0')}:${m}`
    }
    const match = raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
    if (match) {
      let h = parseInt(match[1], 10)
      const m = match[2]
      const ampm = (match[3] || '').toUpperCase()
      if (ampm === 'PM' && h < 12) h += 12
      if (ampm === 'AM' && h === 12) h = 0
      return `${h.toString().padStart(2, '0')}:${m}`
    }
  }

  // 2. Check profile eating_window_end
  if (profile.eating_window_end && profile.eating_window_end.includes(':')) {
    const [h, m] = profile.eating_window_end.split(':')
    return `${h.padStart(2, '0')}:${m}`
  }

  // 3. Adjusted circadian standard: 3 hours before ideal bedtime
  const bed = profile.ideal_bedtime || (profile.preferences as any)?.ideal_bedtime || '22:30'
  const [bH, bM] = bed.split(':').map(Number)
  if (!isNaN(bH) && !isNaN(bM)) {
    const bedTotal = bH * 60 + bM
    const mealTotal = ((bedTotal - 180) % 1440 + 1440) % 1440
    const mH = Math.floor(mealTotal / 60).toString().padStart(2, '0')
    const mM = (mealTotal % 60).toString().padStart(2, '0')
    return `${mH}:${mM}`
  }

  return '19:30'
}

const COLOR_MAP = {
  amber: {
    text: 'text-amber-300',
    border: 'focus:border-amber-400 hover:border-amber-400/50',
    glow: 'shadow-amber-500/10'
  },
  indigo: {
    text: 'text-indigo-300',
    border: 'focus:border-indigo-400 hover:border-indigo-400/50',
    glow: 'shadow-indigo-500/10'
  },
  emerald: {
    text: 'text-emerald-300',
    border: 'focus:border-emerald-400 hover:border-emerald-400/50',
    glow: 'shadow-emerald-500/10'
  },
  rose: {
    text: 'text-rose-300',
    border: 'focus:border-rose-400 hover:border-rose-400/50',
    glow: 'shadow-rose-500/10'
  },
  orange: {
    text: 'text-orange-300',
    border: 'focus:border-orange-400 hover:border-orange-400/50',
    glow: 'shadow-orange-500/10'
  },
  sky: {
    text: 'text-sky-300',
    border: 'focus:border-sky-400 hover:border-sky-400/50',
    glow: 'shadow-sky-500/10'
  }
}

export default function CircadianTimePickerInput({
  value,
  onChange,
  label,
  icon,
  helperText,
  accentColor = 'amber',
  stepMinutes = 15,
  className = '',
  disabled = false,
  compact = false
}: CircadianTimePickerInputProps) {
  const theme = COLOR_MAP[accentColor] || COLOR_MAP.amber

  const handleAdjust = (delta: number) => {
    if (disabled) return
    const next = adjustTimeMinutes(value, delta)
    onChange(next)
  }

  return (
    <div className={`flex flex-col justify-between space-y-2 select-none ${className}`}>
      {/* Optional Header Label */}
      {label && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            {icon && <span className="shrink-0">{icon}</span>}
            <span>{label}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 font-semibold">
            {value}
          </span>
        </div>
      )}

      {/* Stepper + 12H Display Row (Matching Morning Check-in UX) */}
      <div className={`flex items-center justify-between ${compact ? 'my-0.5' : 'my-1'}`}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleAdjust(-stepMinutes)}
          className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-slate-200 border border-white/10 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          title={`${stepMinutes} minutes earlier`}
        >
          -{stepMinutes}m
        </button>

        <span className={`text-base sm:text-lg font-black font-mono tracking-tight transition-colors ${theme.text}`}>
          {formatTimeTo12h(value)}
        </span>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleAdjust(stepMinutes)}
          className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-slate-200 border border-white/10 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          title={`${stepMinutes} minutes later`}
        >
          +{stepMinutes}m
        </button>
      </div>

      {/* Native <input type="time"> (Triggers Android Material Clock / iOS Tumbler) */}
      <input
        type="time"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-slate-950/70 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 text-center font-mono focus:outline-none cursor-pointer transition-colors shadow-inner disabled:opacity-40 disabled:cursor-not-allowed ${theme.border}`}
        title="Tap to open full clock picker"
      />

      {/* Optional Helper Text */}
      {helperText && (
        <span className="text-[10px] text-slate-400 block leading-tight">
          {helperText}
        </span>
      )}
    </div>
  )
}
