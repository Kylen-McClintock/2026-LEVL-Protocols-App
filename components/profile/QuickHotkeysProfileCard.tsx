'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Sliders,
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
  Plus
} from 'lucide-react'
import { UserProfile, QuickHotkeyConfig } from '@/lib/types'
import { POPULAR_HOTKEY_LIBRARY, DEFAULT_STARTER_HOTKEYS } from '@/lib/quicklog/quickHotkeyLibrary'
import { getUserHotkeys, saveUserHotkeys, getCustomCreatedHotkeys } from '@/lib/storage/quickLogsStorage'
import ManageHotkeysModal from '../quicklog/ManageHotkeysModal'

interface QuickHotkeysProfileCardProps {
  profile: UserProfile
  onUpdated?: (updated: UserProfile) => void
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

export default function QuickHotkeysProfileCard({
  profile,
  onUpdated
}: QuickHotkeysProfileCardProps) {
  const [activeHotkeys, setActiveHotkeys] = useState<QuickHotkeyConfig[]>([])
  const [customHotkeys, setCustomHotkeys] = useState<QuickHotkeyConfig[]>([])
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const reloadData = async () => {
    if (profile?.local_user_id) {
      const [keys, custom] = await Promise.all([
        getUserHotkeys(profile.local_user_id),
        getCustomCreatedHotkeys(profile.local_user_id)
      ])
      setActiveHotkeys(keys)
      
      const activeCustom = keys.filter(
        h => h.is_custom || h.id.startsWith('custom_') || !POPULAR_HOTKEY_LIBRARY.some(p => p.id === h.id)
      )
      const map = new Map<string, QuickHotkeyConfig>()
      custom.forEach(h => map.set(h.id, h))
      activeCustom.forEach(h => map.set(h.id, h))
      setCustomHotkeys(Array.from(map.values()))
    }
  }

  useEffect(() => {
    reloadData()
  }, [profile])

  const activeIds = new Set(activeHotkeys.map(h => h.id))

  const handleToggle = async (preset: QuickHotkeyConfig) => {
    let next: QuickHotkeyConfig[]
    if (activeIds.has(preset.id)) {
      next = activeHotkeys.filter(h => h.id !== preset.id)
    } else {
      next = [...activeHotkeys, preset]
    }

    setActiveHotkeys(next)
    await saveUserHotkeys(profile.local_user_id, next)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2000)

    if (onUpdated) {
      onUpdated({ ...profile, enabled_hotkeys: next })
    }
  }

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">
              Daily Micro-Habits &amp; Quick Hotkeys
            </h3>
            <p className="text-xs text-slate-400">
              Select what you want to track daily on your Today &amp; Schedule dashboards.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsManageModalOpen(true)}
          className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 cursor-pointer"
        >
          <Sliders size={13} />
          <span>Advanced Studio</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-in fade-in">
          ✓ Hotkeys auto-populated to your dashboard!
        </div>
      )}

      {/* Custom Hotkeys (if user has created any) */}
      {customHotkeys.length > 0 && (
        <div className="space-y-2 p-3 rounded-xl bg-orange-950/20 border border-orange-500/30">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles size={12} className="text-orange-400" />
            <span>Your Custom Hotkeys</span>
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {customHotkeys.map(h => {
              const isSelected = activeIds.has(h.id)
              const IconComp = ICON_MAP[h.icon] || Activity
              const isNeg = h.is_negative || h.polarity === 'negative'
              const isNeut = h.is_neutral || h.polarity === 'neutral' || h.color_theme === 'cyan' || h.color_theme === 'blue' || h.color_theme === 'slate' || h.color_theme === 'sky'

              const cardBg = isSelected
                ? isNeg
                  ? 'bg-rose-950/40 border-rose-500/60 shadow-sm'
                  : isNeut
                  ? 'bg-sky-950/40 border-sky-500/60 shadow-sm'
                  : 'bg-emerald-950/40 border-emerald-500/60 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-70'

              const iconBg = isSelected
                ? isNeg
                  ? 'bg-rose-500/20 text-rose-300'
                  : isNeut
                  ? 'bg-sky-500/20 text-sky-300'
                  : 'bg-emerald-500/20 text-emerald-300'
                : 'bg-slate-900 text-slate-500'

              const checkBg = isSelected
                ? isNeg
                  ? 'bg-rose-500 border-rose-500 text-black'
                  : isNeut
                  ? 'bg-sky-400 border-sky-400 text-black'
                  : 'bg-emerald-500 border-emerald-500 text-black'
                : 'border-slate-700 bg-slate-900 text-transparent'

              return (
                <div
                  key={h.id}
                  onClick={() => handleToggle(h)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${cardBg}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${iconBg}`}
                    >
                      <IconComp size={13} />
                    </div>
                    <span className="text-xs font-bold text-white transition-colors truncate">
                      {h.name}
                    </span>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors shrink-0 ml-1.5 ${checkBg}`}
                  >
                    <Check size={10} strokeWidth={3} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Select Preset Matrix */}
      <div className="space-y-3">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
          Preset Library ({activeHotkeys.length} active)
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {POPULAR_HOTKEY_LIBRARY.map(h => {
            const isSelected = activeIds.has(h.id)
            const IconComp = ICON_MAP[h.icon] || Activity

            return (
              <div
                key={h.id}
                onClick={() => handleToggle(h)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                  isSelected
                    ? h.is_negative
                      ? 'bg-rose-950/30 border-rose-500/50 shadow-sm'
                      : 'bg-orange-950/30 border-orange-500/50 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                      isSelected
                        ? h.is_negative
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-orange-500/20 text-orange-300'
                        : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    <IconComp size={13} />
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors truncate">
                    {h.name}
                  </span>
                </div>

                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors shrink-0 ml-1.5 ${
                    isSelected
                      ? h.is_negative
                        ? 'bg-rose-500 border-rose-500 text-black'
                        : 'bg-orange-500 border-orange-500 text-black'
                      : 'border-slate-700 bg-slate-900 text-transparent'
                  }`}
                >
                  <Check size={10} strokeWidth={3} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {isManageModalOpen && (
        <ManageHotkeysModal
          localUserId={profile.local_user_id}
          activeHotkeys={activeHotkeys}
          onClose={() => setIsManageModalOpen(false)}
          onSaved={updated => {
            setActiveHotkeys(updated)
            if (onUpdated) {
              onUpdated({ ...profile, enabled_hotkeys: updated })
            }
          }}
        />
      )}
    </div>
  )
}
