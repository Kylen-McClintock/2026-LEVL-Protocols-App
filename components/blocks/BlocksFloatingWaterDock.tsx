'use client'

import React, { useState } from 'react'
import { Droplets, Plus, Check } from 'lucide-react'
import { QuickHotkeyConfig, DailyQuickLogEntry } from '@/lib/types'
import { triggerHaptic } from '@/lib/utils/haptics'
import { useTheme } from '@/lib/utils/useTheme'

interface BlocksFloatingWaterDockProps {
  waterHotkey?: QuickHotkeyConfig
  logs: DailyQuickLogEntry[]
  onQuickLog: (hotkey: QuickHotkeyConfig) => void
  onOpenDetails: (hotkey: QuickHotkeyConfig) => void
}

export default function BlocksFloatingWaterDock({
  waterHotkey,
  logs,
  onQuickLog,
  onOpenDetails
}: BlocksFloatingWaterDockProps) {
  const [isJustTapped, setIsJustTapped] = useState(false)
  const { theme } = useTheme()
  const isLight = theme === 'light'

  if (!waterHotkey) return null

  // Calculate total water ounces logged today
  const waterLogs = logs.filter((l) => l.hotkey_id === waterHotkey.id)
  const totalOz = waterLogs.reduce((acc, l) => acc + (l.value || 0), 0)
  const increment = waterHotkey.default_increment || waterHotkey.bottle_size_oz || 24

  const handleTap = (e: React.MouseEvent) => {
    e.stopPropagation()
    triggerHaptic('light')
    setIsJustTapped(true)
    setTimeout(() => setIsJustTapped(false), 800)
    onQuickLog(waterHotkey)
  }

  return (
    <div
      className={`fixed bottom-5 right-4 sm:right-8 z-40 flex items-center gap-2 p-1.5 pl-3 rounded-full backdrop-blur-2xl shadow-2xl transition-all cursor-pointer group active:scale-95 border ${
        isLight
          ? 'bg-white/90 hover:bg-white border-[#E1E8E3] shadow-slate-300/40 text-[#475569]'
          : 'bg-slate-950/85 hover:bg-slate-900 border-cyan-500/40 text-white'
      }`}
      onClick={() => onOpenDetails(waterHotkey)}
      title="Click to view hydration logs or edit water target"
    >
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
          isLight
            ? 'bg-[#EAF5FA] text-[#0EA5E9] border-[#0EA5E9]/30'
            : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
        }`}>
          <Droplets size={14} />
        </div>
        <div className="text-left pr-1">
          <div className={`text-xs font-bold font-mono flex items-center gap-1 ${
            isLight ? 'text-[#475569]' : 'text-white'
          }`}>
            <span>{totalOz}</span>
            <span className={`text-[10px] font-sans ${isLight ? 'text-[#0EA5E9]' : 'text-cyan-400'}`}>oz</span>
          </div>
          <div className={`text-[9px] font-semibold uppercase tracking-wider ${
            isLight ? 'text-[#64748B]' : 'text-slate-400'
          }`}>
            Hydration
          </div>
        </div>
      </div>

      {/* 1-Tap Quick Increment Button */}
      <button
        type="button"
        onClick={handleTap}
        className={`px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer ${
          isJustTapped
            ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
            : isLight
            ? 'bg-[#EAF5FA] hover:bg-[#E0EFF7] text-[#236F92] border border-[#236F92]/30 shadow-sm'
            : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
        }`}
      >
        {isJustTapped ? (
          <>
            <Check size={12} strokeWidth={3} />
            <span>Added!</span>
          </>
        ) : (
          <>
            <Plus size={12} />
            <span>+{increment} oz</span>
          </>
        )}
      </button>
    </div>
  )
}
