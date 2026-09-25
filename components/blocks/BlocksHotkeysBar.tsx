'use client'

import React, { useState, useEffect } from 'react'
import {
  Flame,
  Droplets,
  Coffee,
  Sun,
  Wind,
  Footprints,
  Snowflake,
  Zap,
  Activity,
  Plus,
  Sliders,
  Check
} from 'lucide-react'
import { QuickHotkeyConfig, DailyQuickLogEntry, UserProfile } from '@/lib/types'
import {
  getUserHotkeys,
  loadQuickLogsForDate,
  saveQuickLogEntry
} from '@/lib/storage/quickLogsStorage'
import QuickLogDetailModal from '@/components/quicklog/QuickLogDetailModal'
import ManageHotkeysModal from '@/components/quicklog/ManageHotkeysModal'
import { triggerHaptic } from '@/lib/utils/haptics'
import { getHotkeyVisualTheme } from '@/components/quicklog/QuickHotkeyGrid'
import { useTheme } from '@/lib/utils/useTheme'

interface BlocksHotkeysBarProps {
  date: string
  localUserId: string
  userProfile?: UserProfile | null
}

const ICON_MAP: Record<string, any> = {
  Flame,
  Droplets,
  Coffee,
  Sun,
  Wind,
  Footprints,
  Snowflake,
  Zap,
  Activity
}

export default function BlocksHotkeysBar({ date, localUserId, userProfile }: BlocksHotkeysBarProps) {
  const [hotkeys, setHotkeys] = useState<QuickHotkeyConfig[]>([])
  const [logs, setLogs] = useState<DailyQuickLogEntry[]>([])
  const [selectedHotkey, setSelectedHotkey] = useState<QuickHotkeyConfig | null>(null)
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [justTappedId, setJustTappedId] = useState<string | null>(null)

  const reloadData = async () => {
    if (!localUserId) return
    const userKeys = await getUserHotkeys(localUserId)
    setHotkeys(userKeys)
    const dailyLogs = await loadQuickLogsForDate(localUserId, date)
    setLogs(dailyLogs)
  }

  useEffect(() => {
    reloadData()
  }, [date, localUserId])

  const handleQuickLog = async (hotkey: QuickHotkeyConfig) => {
    triggerHaptic('light')
    setJustTappedId(hotkey.id)
    setTimeout(() => setJustTappedId(null), 800)

    const newEntry: DailyQuickLogEntry = {
      id: `qlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      local_user_id: localUserId,
      date,
      hotkey_id: hotkey.id,
      hotkey_name: hotkey.name,
      value: hotkey.default_increment,
      unit: hotkey.unit,
      logged_at: new Date().toISOString(),
      is_negative: hotkey.is_negative
    }

    setLogs((prev) => [...prev, newEntry])
    saveQuickLogEntry(newEntry).catch(console.error)
  }

  const { theme } = useTheme()
  const isDaylight = theme === 'light'

  if (hotkeys.length === 0) return null

  return (
    <>
      <div className={`w-full my-3 p-3 rounded-3xl ${
        isDaylight
          ? 'bg-white border border-[#E1E8E3] shadow-sm'
          : 'bg-slate-950/60 border border-white/10 backdrop-blur-xl'
      }`}>
        <div className="flex items-center justify-between px-1 mb-2">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${
            isDaylight ? 'text-[#64748B]' : 'text-slate-400'
          }`}>Quick Hotkeys</span>
          <button
            onClick={() => setIsManageModalOpen(true)}
            className={`text-[10px] ${
              isDaylight ? 'text-[#8B5CF6] hover:text-[#7C3AED]' : 'text-purple-400 hover:text-purple-300'
            } font-bold flex items-center gap-1 cursor-pointer`}
          >
            <Sliders size={11} /> Edit
          </button>
        </div>

        {/* Horizontal scroll of rounded hotkey blocks */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {hotkeys.map((hotkey) => {
            const Icon = ICON_MAP[hotkey.icon] || Zap
            const isJustTapped = justTappedId === hotkey.id
            const hotkeyLogs = logs.filter((l) => l.hotkey_id === hotkey.id)
            const totalVal = hotkeyLogs.reduce((acc, l) => acc + l.value, 0)
            const progressPct = hotkey.daily_goal && !hotkey.is_negative
              ? Math.min(100, Math.max(0, Math.round((totalVal / hotkey.daily_goal) * 100)))
              : totalVal > 0 ? 100 : 0
            const hTheme = getHotkeyVisualTheme(hotkey)

            return (
              <button
                key={hotkey.id}
                onClick={() => handleQuickLog(hotkey)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setSelectedHotkey(hotkey)
                }}
                className={`flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-2xl transition-all active:scale-95 shrink-0 cursor-pointer relative overflow-hidden group select-none shadow-md ${
                  isDaylight
                    ? 'bg-white border border-[#E1E8E3] shadow-xs hover:border-[#8B5CF6]/40'
                    : 'border border-white/20'
                } ${
                  isJustTapped
                    ? 'ring-2 ring-white/60 scale-[0.96]'
                    : isDaylight
                    ? ''
                    : hTheme.glowShadow
                }`}
                style={{
                  background: isDaylight ? '#FFFFFF' : hTheme.fullGradientCss
                }}
                title={`1-Click: Log +${hotkey.default_increment} ${hotkey.unit}`}
              >
                {/* Thin Vertical Completion Line along left side */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  isDaylight ? 'bg-slate-200/80' : 'bg-black/25'
                } backdrop-blur-sm z-10 pointer-events-none rounded-l-2xl overflow-hidden`}>
                  <div
                    className={`absolute bottom-0 left-0 right-0 transition-all duration-300 rounded-bl-2xl ${
                      isDaylight ? 'bg-emerald-500' : 'bg-white/95'
                    }`}
                    style={{ height: `${progressPct}%` }}
                  />
                </div>

                <div
                  className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs shrink-0 shadow-inner ${
                    isDaylight
                      ? 'bg-[#EFF3F0] border border-[#E1E8E3]'
                      : 'bg-black/25 backdrop-blur-md border border-white/25 text-white'
                  }`}
                  style={isDaylight ? { color: hTheme.colorHex } : undefined}
                >
                  <Icon size={13} className={isDaylight ? '' : 'text-white drop-shadow-sm'} />
                </div>

                <div className="text-left min-w-0 pr-1">
                  <div className={`text-xs font-black leading-tight truncate ${
                    isDaylight ? 'text-[#475569]' : 'text-white drop-shadow-sm'
                  }`}>
                    {hotkey.name}
                  </div>
                  <div className={`text-[10px] font-mono flex items-center gap-1 font-bold ${
                    isDaylight ? 'text-[#64748B]' : 'text-white/80'
                  }`}>
                    <span className={isDaylight ? 'text-[#475569] font-black' : 'text-white font-black'}>{totalVal}</span>
                    {hotkey.daily_goal && <span>/{hotkey.daily_goal}</span>}
                    <span className={`text-[9px] ${isDaylight ? 'text-[#94A3B8]' : 'text-white/70'}`}>{hotkey.unit}</span>
                  </div>
                </div>

                {/* +Increment Badge */}
                <span
                  className={`px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-black transition-all flex items-baseline gap-0.5 shadow-sm shrink-0 ml-auto group-hover:scale-105 active:scale-95 ${
                    isDaylight
                      ? 'bg-[#EFF3F0] border border-[#E1E8E3] text-[#475569]'
                      : 'border border-white/25 bg-black/30 text-white backdrop-blur-md'
                  }`}
                >
                  <Plus size={9} strokeWidth={3} className="shrink-0 self-center" />
                  <span>{hotkey.default_increment}</span>
                  <span className="text-[8px] uppercase tracking-tight ml-0.2">{hotkey.unit}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {selectedHotkey && (
        <QuickLogDetailModal
          hotkey={selectedHotkey}
          logs={logs}
          date={date}
          localUserId={localUserId}
          onClose={() => setSelectedHotkey(null)}
          onLogsChanged={reloadData}
        />
      )}

      {isManageModalOpen && (
        <ManageHotkeysModal
          localUserId={localUserId}
          activeHotkeys={hotkeys}
          onClose={() => setIsManageModalOpen(false)}
          onSaved={(updated) => {
            setHotkeys(updated)
            reloadData()
          }}
        />
      )}
    </>
  )
}
