'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Heart,
  Calendar,
  AlertTriangle,
  Check,
  Droplets,
  Sparkles,
  Zap,
  Activity,
  Flame,
  Clock,
  Pill
} from 'lucide-react'
import {
  UserProfile,
  PeriodDailyLogEntry,
  PeriodFlowLevel,
  PeriodPainLevel,
  BirthControlDailyStatus,
  InfradianStatus
} from '@/lib/types'
import {
  savePeriodDailyLog,
  getPeriodDailyLogForDate,
  calculateInfradianStatus
} from '@/lib/tracking/infradianEngine'
import { updateUserProfile } from '@/lib/data'
import { format } from 'date-fns'

interface PeriodFlowLoggerModalProps {
  isOpen: boolean
  onClose: () => void
  localUserId: string
  userProfile: UserProfile | null
  targetDate?: string // 'YYYY-MM-DD'
  onSaved?: (updatedStatus: InfradianStatus | null) => void
}

const SYMPTOM_OPTIONS = [
  { id: 'cramps', label: 'Uterine Cramps', icon: '⚡' },
  { id: 'headache', label: 'Headache / Migraine', icon: '🤕' },
  { id: 'low_energy', label: 'Low Energy / Fatigue', icon: '🔋' },
  { id: 'bloating', label: 'Bloating / Fluid Retention', icon: '💧' },
  { id: 'back_ache', label: 'Lower Back Tension', icon: '🦴' },
  { id: 'energized', label: 'Energized / Feeling Great', icon: '✨' }
]

export default function PeriodFlowLoggerModal({
  isOpen,
  onClose,
  localUserId,
  userProfile,
  targetDate = format(new Date(), 'yyyy-MM-dd'),
  onSaved
}: PeriodFlowLoggerModalProps) {
  const [flow, setFlow] = useState<PeriodFlowLevel>('medium')
  const [pain, setPain] = useState<PeriodPainLevel>(1)
  const [isPeriodStart, setIsPeriodStart] = useState<boolean>(false)
  const [birthControlStatus, setBirthControlStatus] = useState<BirthControlDailyStatus>('none')
  const [isBirthControlTrackingEnabled, setIsBirthControlTrackingEnabled] = useState<boolean>(() => {
    return Boolean(userProfile?.birth_control_enabled)
  })
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [notes, setNotes] = useState<string>('')
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Load existing log for targetDate if present
  useEffect(() => {
    if (!isOpen) return
    const existing = getPeriodDailyLogForDate(localUserId, targetDate)
    if (existing) {
      setFlow(existing.flow_level)
      setPain(existing.pain_level)
      setIsPeriodStart(Boolean(existing.is_period_start))
      setSelectedSymptoms(existing.symptoms || [])
      setNotes(existing.notes || '')
      setBirthControlStatus(existing.birth_control_status || 'none')
      if (existing.birth_control_status && existing.birth_control_status !== 'none') {
        setIsBirthControlTrackingEnabled(true)
      } else {
        setIsBirthControlTrackingEnabled(Boolean(userProfile?.birth_control_enabled))
      }
    } else {
      // Defaults
      setFlow('medium')
      setPain(1)
      setIsPeriodStart(false)
      setSelectedSymptoms([])
      setNotes('')
      setBirthControlStatus('none')
      setIsBirthControlTrackingEnabled(Boolean(userProfile?.birth_control_enabled))
    }
  }, [isOpen, localUserId, targetDate, userProfile?.birth_control_enabled])

  if (!isOpen) return null

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    setIsSaving(true)

    const isPeriodDay = flow !== 'none'
    const newEntry: PeriodDailyLogEntry = {
      id: `period_${localUserId}_${targetDate}`,
      local_user_id: localUserId,
      date: targetDate,
      is_period_day: isPeriodDay,
      is_period_start: isPeriodStart,
      flow_level: flow,
      pain_level: pain,
      birth_control_status: isBirthControlTrackingEnabled ? birthControlStatus : undefined,
      symptoms: selectedSymptoms,
      notes: notes.trim() || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const updatedLogs = savePeriodDailyLog(localUserId, newEntry)

    // If user flagged this as period start date, update user profile
    let updatedProfile = userProfile
    const profileUpdates: Partial<UserProfile> = {}
    if (isPeriodStart) {
      profileUpdates.last_period_start_date = targetDate
    }
    if (isBirthControlTrackingEnabled && !userProfile?.birth_control_enabled) {
      profileUpdates.birth_control_enabled = true
    }

    if (Object.keys(profileUpdates).length > 0 && userProfile) {
      await updateUserProfile(localUserId, profileUpdates)
      if (updatedProfile) {
        updatedProfile = {
          ...updatedProfile,
          ...profileUpdates
        }
      }
    }

    const calculated = calculateInfradianStatus(updatedProfile, targetDate, updatedLogs)
    if (onSaved) {
      onSaved(calculated)
    }

    setIsSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-slate-950 border border-rose-500/40 p-5 sm:p-7 shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-sm">
                🌸
              </span>
              <h3 className="text-lg font-black text-white">Log Period &amp; Cycle Metrics</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Date: <strong className="text-slate-200">{targetDate}</strong> · Adapts daily cold, sauna, fasting, and mineral protocols.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Period Start Date Flag */}
        <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-rose-200 flex items-center gap-1.5">
              <Calendar size={13} className="text-rose-400" />
              Did your period start today (Day 1)?
            </span>
            <p className="text-[10px] text-slate-400">
              Resets your cycle clock to Day 1 and auto-calibrates future phase predictions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsPeriodStart(!isPeriodStart)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isPeriodStart
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 border border-white/10 hover:text-white'
            }`}
          >
            {isPeriodStart ? <Check size={13} /> : null}
            <span>{isPeriodStart ? 'Yes, Started Today' : 'No / Mid-Cycle'}</span>
          </button>
        </div>

        {/* 2. Flow Intensity */}
        <div className="space-y-2">
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Droplets size={13} className="text-rose-400" />
            1. Period Flow Intensity
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'none', label: 'None / Ended', desc: 'No flow' },
              { id: 'spotting', label: 'Spotting', desc: 'Minimal' },
              { id: 'light', label: 'Light', desc: 'Mild flow' },
              { id: 'medium', label: 'Medium', desc: 'Standard' },
              { id: 'heavy', label: 'Heavy', desc: 'Iron defense' }
            ].map(item => {
              const active = flow === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFlow(item.id as PeriodFlowLevel)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-0.5 ${
                    active
                      ? 'bg-rose-950/80 border-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                      : 'bg-slate-900/70 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-bold block">{item.label}</span>
                  <span className="text-[9px] text-slate-400 block">{item.desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. Birth Control / Daily Pill (Option A) */}
        <div className="space-y-2.5 p-3.5 rounded-2xl bg-teal-950/20 border border-teal-500/30 transition-all">
          <div className="flex items-center justify-between gap-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
              <Pill size={14} className="text-teal-400" />
              2. Birth Control / Contraceptive Pill
            </label>

            {!isBirthControlTrackingEnabled ? (
              <button
                type="button"
                onClick={() => {
                  setIsBirthControlTrackingEnabled(true)
                  if (birthControlStatus === 'none') {
                    setBirthControlStatus('active')
                  }
                }}
                className="text-[11px] font-bold text-teal-400 hover:text-teal-300 bg-teal-500/10 border border-teal-500/30 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
              >
                <span>+ Track Daily Pill</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsBirthControlTrackingEnabled(false)
                  setBirthControlStatus('none')
                }}
                className="text-[10px] text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
                title="Hide birth control row if not on oral contraception"
              >
                Hide
              </button>
            )}
          </div>

          {isBirthControlTrackingEnabled ? (
            <div className="space-y-2.5 pt-1 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    id: 'active',
                    label: 'Active Pill',
                    desc: 'Hormone dose taken',
                    colorActive: 'bg-teal-950/90 border-teal-500 text-teal-200 shadow-[0_0_15px_rgba(20,184,166,0.35)] ring-1 ring-teal-500/40'
                  },
                  {
                    id: 'placebo',
                    label: 'Placebo Pill',
                    desc: 'Sugar / inert week',
                    colorActive: 'bg-indigo-950/90 border-indigo-500 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.35)] ring-1 ring-indigo-500/40'
                  },
                  {
                    id: 'missed',
                    label: 'Missed Pill',
                    desc: 'Delayed or skipped',
                    colorActive: 'bg-amber-950/90 border-amber-500 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.35)] ring-1 ring-amber-500/40'
                  },
                  {
                    id: 'none',
                    label: 'None Today',
                    desc: 'No pill taken',
                    colorActive: 'bg-slate-800 border-slate-600 text-slate-300 ring-1 ring-slate-500/40'
                  }
                ].map(item => {
                  const active = birthControlStatus === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setBirthControlStatus(item.id as BirthControlDailyStatus)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-0.5 ${
                        active
                          ? item.colorActive
                          : 'bg-slate-900/70 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs font-bold block">{item.label}</span>
                      <span className="text-[9px] text-slate-400 block">{item.desc}</span>
                    </button>
                  )
                })}
              </div>

              {birthControlStatus === 'missed' && (
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200 flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                  <span>
                    <strong>Missed Pill Notice:</strong> A drop in synthetic hormones can cause breakthrough spotting or cramping within 24–48h. Follow your pack guidelines (e.g. take when remembered, consider backup barrier protection).
                  </span>
                </div>
              )}

              {birthControlStatus === 'placebo' && (
                <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200 flex items-center gap-2 animate-in fade-in">
                  <Droplets size={15} className="text-indigo-400 shrink-0" />
                  <span>
                    <strong>Placebo Interval (Withdrawal Bleed):</strong> Flow during placebo days is an exogenous withdrawal bleed rather than biological ovulation. Prioritize iron defense, magnesium, and hydration.
                  </span>
                </div>
              )}

              {birthControlStatus === 'active' && (
                <div className="p-2 rounded-xl bg-teal-950/40 border border-teal-500/20 text-[11px] text-teal-300 flex items-center gap-1.5 animate-in fade-in">
                  <Check size={13} className="text-teal-400 shrink-0 stroke-[3]" />
                  <span>Daily active hormone pill logged. Steady synthetic state active.</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-slate-400">
              Taking an oral contraceptive or pill? Tap <strong className="text-teal-300">&ldquo;+ Track Daily Pill&rdquo;</strong> to record active vs placebo days and correlate breakthrough spotting.
            </p>
          )}
        </div>

        {/* 3. Cramping & Pain Severity */}
        <div className="space-y-2">
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Zap size={13} className="text-amber-400" />
            3. Cramping &amp; Pain Level (Dysmenorrhea)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { level: 0, label: '0 None', desc: 'No pain', color: 'border-emerald-500/40' },
              { level: 1, label: '1 Mild', desc: 'Aware of tension', color: 'border-cyan-500/40' },
              { level: 2, label: '2 Moderate', desc: 'Distracting cramps', color: 'border-amber-500/40' },
              { level: 3, label: '3 Severe', desc: 'Heavy spasms', color: 'border-rose-500/40' }
            ].map(item => {
              const active = pain === item.level
              return (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => setPain(item.level as PeriodPainLevel)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-0.5 ${
                    active
                      ? 'bg-gradient-to-b from-purple-950 to-slate-950 border-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                      : 'bg-slate-900/70 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold block">{item.label}</span>
                  <span className="text-[9px] text-slate-400 block">{item.desc}</span>
                </button>
              )
            })}
          </div>

          {pain >= 2 && (
            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200 flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400 shrink-0" />
              <span>
                <strong>Smart Adaptation:</strong> LEVL will pause aggressive cold plunge and recommend <strong>Magnesium Glycinate + Localized Heat</strong> for today.
              </span>
            </div>
          )}
        </div>

        {/* 4. Secondary Symptoms */}
        <div className="space-y-2">
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            4. Secondary Symptoms (Optional 1-Tap)
          </label>
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_OPTIONS.map(sym => {
              const active = selectedSymptoms.includes(sym.id)
              return (
                <button
                  key={sym.id}
                  type="button"
                  onClick={() => toggleSymptom(sym.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-purple-900/80 border-purple-500 text-white shadow-sm'
                      : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{sym.icon}</span>
                  <span>{sym.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
          >
            <Check size={14} />
            <span>{isSaving ? 'Saving...' : 'Save & Adapt Protocols'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
