'use client'

import React, { useState } from 'react'
import {
  X,
  Plus,
  Trash2,
  Clock,
  Flame,
  Droplets,
  Coffee,
  Sun,
  Wind,
  Eye,
  Footprints,
  Snowflake,
  Wine,
  Cigarette,
  Cookie,
  Smartphone,
  Zap,
  Activity,
  Leaf,
  Check
} from 'lucide-react'
import { QuickHotkeyConfig, DailyQuickLogEntry } from '@/lib/types'
import { saveQuickLogEntry, deleteQuickLogEntry } from '@/lib/storage/quickLogsStorage'
import { format } from 'date-fns'

interface QuickLogDetailModalProps {
  hotkey: QuickHotkeyConfig
  date: string
  localUserId: string
  logs: DailyQuickLogEntry[]
  onClose: () => void
  onLogsChanged: () => void
  onHotkeyUpdated?: (updatedHotkey: QuickHotkeyConfig) => void
}

const ICON_MAP: Record<string, any> = {
  Flame,
  Droplets,
  Coffee,
  Sun,
  Wind,
  Eye,
  Footprints,
  Snowflake,
  Wine,
  Cigarette,
  Cookie,
  Smartphone,
  Zap,
  Activity,
  Leaf
}

export default function QuickLogDetailModal({
  hotkey,
  date,
  localUserId,
  logs,
  onClose,
  onLogsChanged,
  onHotkeyUpdated
}: QuickLogDetailModalProps) {
  const [customAmount, setCustomAmount] = useState<string>(hotkey.default_increment.toString())
  const [defaultIncrementInput, setDefaultIncrementInput] = useState<string>(hotkey.default_increment.toString())
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(
    hotkey.days_of_week && hotkey.days_of_week.length > 0
      ? hotkey.days_of_week
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  )
  const [isUpdatingDefault, setIsUpdatingDefault] = useState(false)
  const [defaultSavedSuccess, setDefaultSavedSuccess] = useState(false)
  const [notes, setNotes] = useState<string>('')
  const [rating, setRating] = useState<number | undefined>(undefined)
  const [timeStr, setTimeStr] = useState<string>(format(new Date(), 'HH:mm'))
  const [selectedBottleSize, setSelectedBottleSize] = useState<number>(hotkey.bottle_size_oz || 24)
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveDefaultIncrement = async () => {
    const val = parseFloat(defaultIncrementInput)
    if (!val || val <= 0) return
    setIsUpdatingDefault(true)

    const { getUserHotkeys, saveUserHotkeys, saveCustomCreatedHotkey } = await import('@/lib/storage/quickLogsStorage')
    const allHotkeys = await getUserHotkeys(localUserId)
    const updated = allHotkeys.map(h =>
      h.id === hotkey.id ? { ...h, default_increment: val, days_of_week: daysOfWeek } : h
    )
    await saveUserHotkeys(localUserId, updated)

    const currentUpdated: QuickHotkeyConfig = {
      ...hotkey,
      default_increment: val,
      days_of_week: daysOfWeek
    }

    if (hotkey.is_custom || hotkey.id.startsWith('custom_')) {
      await saveCustomCreatedHotkey(localUserId, currentUpdated)
    }

    if (onHotkeyUpdated) onHotkeyUpdated(currentUpdated)

    setIsUpdatingDefault(false)
    setDefaultSavedSuccess(true)
    setTimeout(() => setDefaultSavedSuccess(false), 2500)
    onLogsChanged()
  }

  const IconComp = ICON_MAP[hotkey.icon] || Activity
  const hotkeyLogs = logs.filter(l => l.hotkey_id === hotkey.id)
  const totalLogged = hotkeyLogs.reduce((acc, l) => acc + l.value, 0)

  const handleLog = async (val: number, customNote?: string) => {
    if (val <= 0 && !hotkey.is_negative) return
    setIsSaving(true)

    const [hours, minutes] = timeStr.split(':')
    const logDate = new Date(`${date}T12:00:00`)
    if (hours && minutes) {
      logDate.setHours(parseInt(hours, 10), parseInt(minutes, 10))
    }

    const entry: DailyQuickLogEntry = {
      id: `qlog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      local_user_id: localUserId,
      date,
      hotkey_id: hotkey.id,
      hotkey_name: hotkey.name,
      value: val,
      unit: hotkey.unit,
      logged_at: logDate.toISOString(),
      notes: customNote !== undefined ? customNote : (notes.trim() || undefined),
      rating: rating,
      is_negative: hotkey.is_negative
    }

    await saveQuickLogEntry(entry)
    setIsSaving(false)
    setNotes('')
    onLogsChanged()
  }

  const handleDelete = async (entryId: string) => {
    await deleteQuickLogEntry(entryId, date)
    onLogsChanged()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-inner ${
                hotkey.is_negative
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  : 'bg-orange-500/15 border-orange-500/30 text-orange-400'
              }`}
            >
              <IconComp size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white leading-tight">{hotkey.name}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Today:</span>
                <span className="font-mono font-bold text-white">
                  {totalLogged} {hotkey.unit}
                </span>
                {hotkey.daily_goal && (
                  <span className="text-[10px] text-slate-500">/ {hotkey.daily_goal} {hotkey.unit} goal</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Fast Presets Grid (if available) */}
        {hotkey.presets && hotkey.presets.length > 0 && (
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              ⚡ 1-Tap Presets
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {hotkey.presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLog(p.amount, p.notes || p.label)}
                  disabled={isSaving}
                  className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-orange-500/50 hover:bg-orange-950/20 text-left transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">
                      {p.label}
                    </div>
                    {p.notes && <div className="text-[10px] text-slate-500">{p.notes}</div>}
                  </div>
                  <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                    +{p.amount}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. Custom Amount Entry */}
        <div className="space-y-3 p-4 rounded-2xl bg-black/40 border border-white/5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Custom Amount &amp; Context
          </label>

          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="number"
                step="any"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                placeholder="Amount..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-base font-bold text-white font-mono focus:outline-none"
              />
              <span className="absolute right-3 top-3 text-xs font-mono text-slate-500">
                {hotkey.unit}
              </span>
            </div>

            <div className="w-28 relative">
              <input
                type="time"
                value={timeStr}
                onChange={e => setTimeStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-2.5 py-2.5 text-xs font-bold text-white font-mono focus:outline-none text-center"
              />
            </div>

            <button
              onClick={() => handleLog(parseFloat(customAmount) || hotkey.default_increment)}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Plus size={16} />
              <span>Log</span>
            </button>
          </div>

          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional context / meal description / trigger..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
          />
        </div>

        {/* 3. 1-Click Default Increment Setting */}
        {/* 3. 1-Click Default Increment & Display Schedule */}
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
                value={defaultIncrementInput}
                onChange={e => setDefaultIncrementInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none"
              />
              <span className="absolute right-3 top-2 text-[10px] font-mono text-slate-500">
                {hotkey.unit} per tap
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
                        ? hotkey.is_negative
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-orange-500 text-black shadow-sm font-black'
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

        {/* 3. Today's Feedings / Logs History */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Today's Entries ({hotkeyLogs.length})
            </span>
          </div>

          {hotkeyLogs.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-600 italic">
              No entries logged for today yet. Tap a preset or log above.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {hotkeyLogs.map(l => (
                <div
                  key={l.id}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">
                        +{l.value} {l.unit}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                        <Clock size={10} />
                        {format(new Date(l.logged_at), 'h:mm a')}
                      </span>
                    </div>
                    {l.notes && <div className="text-[11px] text-slate-400">{l.notes}</div>}
                  </div>

                  <button
                    onClick={() => handleDelete(l.id)}
                    className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete log"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
