'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Plus,
  Check,
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
  Sparkles,
  Sliders,
  Trash2
} from 'lucide-react'
import { QuickHotkeyConfig } from '@/lib/types'
import { POPULAR_HOTKEY_LIBRARY } from '@/lib/quicklog/quickHotkeyLibrary'
import {
  saveUserHotkeys,
  getCustomCreatedHotkeys,
  saveCustomCreatedHotkey,
  deleteCustomCreatedHotkey
} from '@/lib/storage/quickLogsStorage'

interface ManageHotkeysModalProps {
  localUserId: string
  activeHotkeys: QuickHotkeyConfig[]
  onClose: () => void
  onSaved: (updatedHotkeys: QuickHotkeyConfig[]) => void
}

const AVAILABLE_ICONS = [
  { key: 'Flame', label: 'Flame', icon: Flame },
  { key: 'Droplets', label: 'Water', icon: Droplets },
  { key: 'Coffee', label: 'Coffee', icon: Coffee },
  { key: 'Sun', label: 'Sun', icon: Sun },
  { key: 'Wind', label: 'Breath', icon: Wind },
  { key: 'Eye', label: 'Eye Rest', icon: Eye },
  { key: 'Footprints', label: 'Movement', icon: Footprints },
  { key: 'Snowflake', label: 'Cold Shock', icon: Snowflake },
  { key: 'Zap', label: 'Energy / Creatine', icon: Zap },
  { key: 'Activity', label: 'Biometrics', icon: Activity },
  { key: 'Wine', label: 'Alcohol', icon: Wine },
  { key: 'Cigarette', label: 'Nicotine', icon: Cigarette },
  { key: 'Leaf', label: 'Cannabis / THC', icon: Leaf },
  { key: 'Cookie', label: 'Sugar Snack', icon: Cookie },
  { key: 'Smartphone', label: 'Screen Time', icon: Smartphone }
]

export const DEFAULT_ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function ManageHotkeysModal({
  localUserId,
  activeHotkeys,
  onClose,
  onSaved
}: ManageHotkeysModalProps) {
  const [selectedHotkeys, setSelectedHotkeys] = useState<QuickHotkeyConfig[]>(activeHotkeys)
  const [knownCustomHotkeys, setKnownCustomHotkeys] = useState<QuickHotkeyConfig[]>([])
  const [tab, setTab] = useState<'library' | 'custom'>('library')

  // Custom hotkey form states
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState<QuickHotkeyConfig['category']>('custom')
  const [customUnit, setCustomUnit] = useState('count')
  const [customIncrement, setCustomIncrement] = useState('1')
  const [customGoal, setCustomGoal] = useState('')
  const [customIcon, setCustomIcon] = useState('Activity')
  const [customIsNegative, setCustomIsNegative] = useState(false)

  useEffect(() => {
    const loadCustom = async () => {
      const stored = await getCustomCreatedHotkeys(localUserId)
      const activeCustom = activeHotkeys.filter(
        h => h.is_custom || h.id.startsWith('custom_') || !POPULAR_HOTKEY_LIBRARY.some(p => p.id === h.id)
      )

      const map = new Map<string, QuickHotkeyConfig>()
      stored.forEach(h => map.set(h.id, h))
      activeCustom.forEach(h => map.set(h.id, h))

      setKnownCustomHotkeys(Array.from(map.values()))
    }
    loadCustom()
  }, [localUserId, activeHotkeys])

  const activeIds = new Set(selectedHotkeys.map(h => h.id))

  const toggleHotkey = (hotkey: QuickHotkeyConfig) => {
    if (activeIds.has(hotkey.id)) {
      setSelectedHotkeys(prev => prev.filter(h => h.id !== hotkey.id))
    } else {
      const withDays = {
        ...hotkey,
        days_of_week: hotkey.days_of_week && hotkey.days_of_week.length > 0 ? hotkey.days_of_week : [...DEFAULT_ALL_DAYS]
      }
      setSelectedHotkeys(prev => [...prev, withDays])
    }
  }

  const handleDeleteCustomHotkey = async (e: React.MouseEvent, hotkeyId: string) => {
    e.stopPropagation()
    await deleteCustomCreatedHotkey(localUserId, hotkeyId)
    setKnownCustomHotkeys(prev => prev.filter(h => h.id !== hotkeyId))
    setSelectedHotkeys(prev => prev.filter(h => h.id !== hotkeyId))
  }

  const handleSaveCustomHotkey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customName.trim()) return

    const newHotkey: QuickHotkeyConfig = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: customName.trim(),
      icon: customIcon,
      category: customCategory,
      unit: customUnit.trim() || 'count',
      default_increment: parseFloat(customIncrement) || 1,
      daily_goal: customGoal ? parseFloat(customGoal) : undefined,
      is_negative: customIsNegative,
      color_theme: customIsNegative ? 'rose' : 'orange',
      days_of_week: [...DEFAULT_ALL_DAYS],
      is_custom: true
    }

    await saveCustomCreatedHotkey(localUserId, newHotkey)
    setKnownCustomHotkeys(prev => [...prev.filter(h => h.id !== newHotkey.id), newHotkey])
    setSelectedHotkeys(prev => [...prev.filter(h => h.id !== newHotkey.id), newHotkey])

    // Reset form
    setCustomName('')
    setCustomGoal('')
    setCustomIncrement('1')
    setTab('library')
  }

  const handleSaveAll = async () => {
    for (const h of selectedHotkeys) {
      if (h.is_custom || h.id.startsWith('custom_') || !POPULAR_HOTKEY_LIBRARY.some(p => p.id === h.id)) {
        await saveCustomCreatedHotkey(localUserId, h)
      }
    }
    await saveUserHotkeys(localUserId, selectedHotkeys)
    onSaved(selectedHotkeys)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between"
        onClick={e => e.stopPropagation()}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sliders size={18} className="text-orange-400" />
                Customize Daily Quick Hotkeys
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Select from popular presets or build custom metrics.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 p-1 bg-black/40 border border-white/5 rounded-xl text-xs font-bold">
            <button
              onClick={() => setTab('library')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                tab === 'library'
                  ? 'bg-orange-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Preset Library ({selectedHotkeys.length} selected)
            </button>
            <button
              onClick={() => setTab('custom')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                tab === 'custom'
                  ? 'bg-orange-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              + Create Custom Hotkey
            </button>
          </div>

          {/* TAB 1: Preset Library Grid */}
          {tab === 'library' && (
            <div className="space-y-4">
              {/* 🛠️ User's Custom Hotkeys Section (Clean 2-Column Grid) */}
              {knownCustomHotkeys.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-orange-400" />
                    <span>Your Custom Hotkeys ({knownCustomHotkeys.filter(h => activeIds.has(h.id)).length} selected)</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {knownCustomHotkeys.map(h => {
                      const isSelected = activeIds.has(h.id)
                      const IconC = AVAILABLE_ICONS.find(i => i.key === h.icon)?.icon || Activity

                      return (
                        <div
                          key={h.id}
                          onClick={() => toggleHotkey(h)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                            isSelected
                              ? 'bg-orange-950/30 border-orange-500/50 shadow-sm'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs shrink-0 ${
                                isSelected
                                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                                  : 'bg-slate-900 text-slate-400 border-slate-800'
                              }`}
                            >
                              <IconC size={14} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white leading-tight truncate flex items-center gap-1">
                                <span>{h.name}</span>
                                <span className="text-[8px] px-1 py-0.2 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 font-mono">
                                  Custom
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono truncate">
                                Default: +{h.default_increment} {h.unit}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={e => handleDeleteCustomHotkey(e, h.id)}
                              title="Delete custom hotkey"
                              className="p-1 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>

                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                                isSelected
                                  ? 'bg-orange-500 border-orange-500 text-black'
                                  : 'border-slate-700 bg-slate-900 text-transparent'
                              }`}
                            >
                              <Check size={12} strokeWidth={3} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 🌟 Positive Habits */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                  🌟 High-Performance &amp; Recovery Habits
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {POPULAR_HOTKEY_LIBRARY.filter(h => !h.is_negative).map(h => {
                    const isSelected = activeIds.has(h.id)
                    const IconC = AVAILABLE_ICONS.find(i => i.key === h.icon)?.icon || Activity

                    return (
                      <div
                        key={h.id}
                        onClick={() => toggleHotkey(h)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                          isSelected
                            ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs shrink-0 ${
                              isSelected
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            <IconC size={14} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white leading-tight truncate">{h.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">
                              Default: +{h.default_increment} {h.unit}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ml-2 ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-500 text-black'
                              : 'border-slate-700 bg-slate-900 text-transparent'
                          }`}
                        >
                          <Check size={12} strokeWidth={3} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 🍷 Negative Habits / Vices */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-400 block">
                  🍷 Vices &amp; Harm-Reduction Monitoring
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {POPULAR_HOTKEY_LIBRARY.filter(h => h.is_negative).map(h => {
                    const isSelected = activeIds.has(h.id)
                    const IconC = AVAILABLE_ICONS.find(i => i.key === h.icon)?.icon || Activity

                    return (
                      <div
                        key={h.id}
                        onClick={() => toggleHotkey(h)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                          isSelected
                            ? 'bg-rose-950/30 border-rose-500/50 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs shrink-0 ${
                              isSelected
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            <IconC size={14} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white leading-tight truncate">{h.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">
                              Log increment: +{h.default_increment} {h.unit}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ml-2 ${
                            isSelected
                              ? 'bg-rose-500 border-rose-500 text-black'
                              : 'border-slate-700 bg-slate-900 text-transparent'
                          }`}
                        >
                          <Check size={12} strokeWidth={3} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Custom Hotkey Creator Form */}
          {tab === 'custom' && (
            <form onSubmit={handleSaveCustomHotkey} className="space-y-3.5 p-4 rounded-2xl bg-black/40 border border-white/5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Hotkey Name
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="e.g. 500mg Sodium, Creative Pomodoro, Tart Cherry..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Unit
                  </label>
                  <input
                    type="text"
                    required
                    value={customUnit}
                    onChange={e => setCustomUnit(e.target.value)}
                    placeholder="e.g. g, oz, min, count, mg"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    1-Tap Increment
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={customIncrement}
                    onChange={e => setCustomIncrement(e.target.value)}
                    placeholder="e.g. 1, 5, 20"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Daily Goal (Optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={customGoal}
                    onChange={e => setCustomGoal(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Habit Type
                  </label>
                  <select
                    value={customIsNegative ? 'vice' : 'positive'}
                    onChange={e => setCustomIsNegative(e.target.value === 'vice')}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                  >
                    <option value="positive">🌟 Positive / Performance</option>
                    <option value="vice">🍷 Vice / Harm Reduction</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Select Icon
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {AVAILABLE_ICONS.map(i => {
                    const IconComponent = i.icon
                    const isSelected = customIcon === i.key

                    return (
                      <button
                        key={i.key}
                        type="button"
                        onClick={() => setCustomIcon(i.key)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500/20 border-orange-500 text-orange-300 shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title={i.label}
                      >
                        <IconComponent size={16} />
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs transition-all shadow-md cursor-pointer mt-2"
              >
                + Add Custom Hotkey to Library
              </button>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs transition-all shadow-lg cursor-pointer flex items-center gap-1.5"
          >
            <Check size={16} />
            <span>Save &amp; Update Hotkeys ({selectedHotkeys.length})</span>
          </button>
        </div>
      </div>
    </div>
  )
}
