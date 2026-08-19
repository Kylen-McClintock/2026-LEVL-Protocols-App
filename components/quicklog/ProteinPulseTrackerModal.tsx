'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Plus,
  Flame,
  Clock,
  Sparkles,
  Info,
  Dumbbell,
  CheckCircle2,
  Trash2
} from 'lucide-react'
import { DailyQuickLogEntry, UserProfile } from '@/lib/types'
import { saveQuickLogEntry, deleteQuickLogEntry } from '@/lib/storage/quickLogsStorage'
import { format } from 'date-fns'

interface ProteinPulseTrackerModalProps {
  date: string
  localUserId: string
  userProfile?: UserProfile | null
  logs: DailyQuickLogEntry[]
  onClose: () => void
  onLogsChanged: () => void
}

const PROTEIN_PRESETS = [
  { label: 'Whey / Pea Protein Shake', amount: 30, leucine: '2.7g' },
  { label: 'Chicken Breast (6 oz)', amount: 45, leucine: '3.8g' },
  { label: 'Grass-Fed Ribeye / Steak', amount: 45, leucine: '4.0g' },
  { label: 'Wild Salmon (6 oz)', amount: 35, leucine: '3.0g' },
  { label: 'Blueprint Nut Pudding + Protein', amount: 35, leucine: '2.9g' },
  { label: '4 Whole Eggs + 3 Whites', amount: 28, leucine: '2.5g' }
]

export default function ProteinPulseTrackerModal({
  date,
  localUserId,
  userProfile,
  logs,
  onClose,
  onLogsChanged
}: ProteinPulseTrackerModalProps) {
  const [customGrams, setCustomGrams] = useState<string>('35')
  const [mealNotes, setMealNotes] = useState<string>('')
  const [timeStr, setTimeStr] = useState<string>(format(new Date(), 'HH:mm'))
  const [isSaving, setIsSaving] = useState(false)

  const [defaultIncrementGrams, setDefaultIncrementGrams] = useState<string>('35')
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
  const [isUpdatingDefault, setIsUpdatingDefault] = useState(false)
  const [defaultSavedSuccess, setDefaultSavedSuccess] = useState(false)

  useEffect(() => {
    async function loadConfig() {
      if (localUserId) {
        const { getUserHotkeys } = await import('@/lib/storage/quickLogsStorage')
        const all = await getUserHotkeys(localUserId)
        const prot = all.find(h => h.id === 'protein_pulse')
        if (prot) {
          setDefaultIncrementGrams(prot.default_increment.toString())
          if (prot.days_of_week && prot.days_of_week.length > 0) {
            setDaysOfWeek(prot.days_of_week)
          }
        }
      }
    }
    loadConfig()
  }, [localUserId])

  const handleSaveDefaultIncrement = async () => {
    const val = parseFloat(defaultIncrementGrams)
    if (!val || val <= 0) return
    setIsUpdatingDefault(true)

    const { getUserHotkeys, saveUserHotkeys } = await import('@/lib/storage/quickLogsStorage')
    const allHotkeys = await getUserHotkeys(localUserId)
    const updated = allHotkeys.map(h =>
      h.id === 'protein_pulse' ? { ...h, default_increment: val, days_of_week: daysOfWeek } : h
    )
    await saveUserHotkeys(localUserId, updated)

    setIsUpdatingDefault(false)
    setDefaultSavedSuccess(true)
    setTimeout(() => setDefaultSavedSuccess(false), 2500)
    onLogsChanged()
  }

  const proteinLogs = logs.filter(l => l.hotkey_id === 'protein_pulse')
  const totalProteinGrams = proteinLogs.reduce((acc, l) => acc + l.value, 0)

  // Target protein calculated from bodyweight (1.8g - 2.2g per kg, or ~0.8g-1.0g per lb)
  const targetProteinGrams = userProfile?.weight_lbs
    ? Math.round(userProfile.weight_lbs * 0.9)
    : 160

  const leucinePulsesCount = proteinLogs.filter(l => l.value >= 30).length
  const progressPct = Math.min(Math.round((totalProteinGrams / targetProteinGrams) * 100), 100)

  const handleLogMeal = async (grams: number, notesText?: string) => {
    if (grams <= 0) return
    setIsSaving(true)

    const [hours, minutes] = timeStr.split(':')
    const logDate = new Date(`${date}T12:00:00`)
    if (hours && minutes) {
      logDate.setHours(parseInt(hours, 10), parseInt(minutes, 10))
    }

    const entry: DailyQuickLogEntry = {
      id: `qlog_protein_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      local_user_id: localUserId,
      date,
      hotkey_id: 'protein_pulse',
      hotkey_name: 'Protein Pulse',
      value: grams,
      unit: 'g',
      logged_at: logDate.toISOString(),
      notes: notesText || mealNotes.trim() || undefined,
      metadata: {
        estimated_leucine_g: Math.round((grams * 0.085) * 10) / 10,
        meets_leucine_threshold: grams >= 30
      }
    }

    await saveQuickLogEntry(entry)
    setIsSaving(false)
    setMealNotes('')
    onLogsChanged()
  }

  const handleDelete = async (id: string) => {
    await deleteQuickLogEntry(id, date)
    onLogsChanged()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shadow-md">
              <Flame size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-white leading-tight">
                Daily Protein &amp; Leucine Pulse Architecture
              </h3>
              <p className="text-xs text-slate-400">
                Optimizing mTORC1 muscle protein synthesis &amp; spacing.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress & Leucine Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Daily Intake
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white font-mono">{totalProteinGrams}g</span>
              <span className="text-xs text-slate-500 font-mono">/ {targetProteinGrams}g</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Leucine Pulses (≥2.5g)
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-orange-400 font-mono">{leucinePulsesCount}</span>
              <span className="text-xs text-slate-500 font-mono">/ 3–4 target</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {leucinePulsesCount >= 3 ? '✅ Optimal MPS triggered' : 'Pending 35g+ pulse'}
            </div>
          </div>
        </div>

        {/* 1-Tap Meal Presets */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            🥩 High-Leucine Food Presets
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PROTEIN_PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleLogMeal(p.amount, p.label)}
                disabled={isSaving}
                className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-orange-500/50 hover:bg-orange-950/20 text-left transition-all flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">
                    {p.label}
                  </div>
                  <div className="text-[10px] text-orange-400/80 font-mono">
                    ~{p.leucine} Leucine
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/10">
                  +{p.amount}g
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Entry Form */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Custom Protein Entry
          </label>

          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="number"
                value={customGrams}
                onChange={e => setCustomGrams(e.target.value)}
                placeholder="Grams..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2 text-sm font-bold text-white font-mono focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-500">
                grams
              </span>
            </div>

            <div className="w-28 relative">
              <input
                type="time"
                value={timeStr}
                onChange={e => setTimeStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-2.5 py-2 text-xs font-bold text-white font-mono focus:outline-none text-center"
              />
            </div>

            <button
              onClick={() => handleLogMeal(parseFloat(customGrams) || 35)}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Plus size={16} />
              <span>Log Meal</span>
            </button>
          </div>

          <input
            type="text"
            value={mealNotes}
            onChange={e => setMealNotes(e.target.value)}
            placeholder="Meal description (e.g. Post-lift shake + blueberries)..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
          />
        </div>

        {/* 1-Click Button Default Amount & Display Schedule */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <span>⚡ 1-Click Button Default Amount:</span>
            </span>
            {defaultSavedSuccess && (
              <span className="text-[10px] text-emerald-400 font-bold animate-in fade-in">
                ✓ Preferences Saved!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="number"
                step="any"
                value={defaultIncrementGrams}
                onChange={e => setDefaultIncrementGrams(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none"
              />
              <span className="absolute right-3 top-2 text-[10px] font-mono text-slate-500">
                g protein per tap
              </span>
            </div>

            <button
              type="button"
              onClick={handleSaveDefaultIncrement}
              disabled={isUpdatingDefault}
              className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs transition-colors cursor-pointer shrink-0"
            >
              Save Preferences
            </button>
          </div>

          {/* Days of week schedule */}
          <div className="pt-2 border-t border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1">
                <span>🗓️ Active Display Days ({daysOfWeek.length}/7):</span>
              </span>
              <button
                type="button"
                onClick={() => setDaysOfWeek(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])}
                className="text-[9px] text-orange-400 hover:underline cursor-pointer"
              >
                Reset to Everyday
              </button>
            </div>

            <div className="flex items-center gap-1">
              {[
                { key: 'Mon', label: 'M', full: 'Mon' },
                { key: 'Tue', label: 'T', full: 'Tue' },
                { key: 'Wed', label: 'W', full: 'Wed' },
                { key: 'Thu', label: 'T', full: 'Thu' },
                { key: 'Fri', label: 'F', full: 'Fri' },
                { key: 'Sat', label: 'S', full: 'Sat' },
                { key: 'Sun', label: 'S', full: 'Sun' }
              ].map(day => {
                const isActive = daysOfWeek.includes(day.key)
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => {
                      let next: string[]
                      if (daysOfWeek.includes(day.key)) {
                        next = daysOfWeek.filter(d => d !== day.key)
                        if (next.length === 0) next = [day.key]
                      } else {
                        next = [...daysOfWeek, day.key]
                      }
                      setDaysOfWeek(next)
                    }}
                    title={day.full}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      isActive
                        ? 'bg-orange-500 text-black shadow-sm font-black'
                        : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    {day.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Timeline of Today's Protein Feedings */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Today's Feeding Timeline ({proteinLogs.length} meals)
          </span>

          {proteinLogs.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-600 italic">
              No protein pulses logged today. Tap a preset above to log your first feeding.
            </div>
          ) : (
            <div className="space-y-2">
              {proteinLogs.map((l, i) => {
                const isLeucineTrigger = l.value >= 30

                return (
                  <div
                    key={l.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                          isLeucineTrigger
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        P{i + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-white text-sm">
                            +{l.value}g Protein
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                              isLeucineTrigger
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {isLeucineTrigger ? '✓ Leucine Trigger (≥2.5g)' : '< 2.5g Leucine'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock size={10} />
                            {format(new Date(l.logged_at), 'h:mm a')}
                          </span>
                          {l.notes && <span>• {l.notes}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(l.id)}
                      className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete log"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
