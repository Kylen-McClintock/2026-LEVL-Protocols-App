'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import {
  Plus,
  Flame,
  Droplets,
  Coffee,
  Sun,
  Wind,
  Eye,
  EyeOff,
  Footprints,
  Snowflake,
  Wine,
  Cigarette,
  Cookie,
  Smartphone,
  Zap,
  Activity,
  Leaf,
  Sliders,
  Sparkles,
  ChevronRight,
  Calendar,
  Utensils
} from 'lucide-react'
import { QuickHotkeyConfig, DailyQuickLogEntry, UserProfile } from '@/lib/types'
import {
  getUserHotkeys,
  loadQuickLogsForDate,
  saveQuickLogEntry
} from '@/lib/storage/quickLogsStorage'
import QuickLogDetailModal from './QuickLogDetailModal'
import ManageHotkeysModal from './ManageHotkeysModal'
import ProteinPulseTrackerModal from './ProteinPulseTrackerModal'
import NutritionFastingModal from './NutritionFastingModal'

interface QuickHotkeyGridProps {
  date: string
  localUserId: string
  userProfile?: UserProfile | null
  className?: string
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
  Leaf,
  Utensils
}

export default function QuickHotkeyGrid({
  date,
  localUserId,
  userProfile,
  className = ''
}: QuickHotkeyGridProps) {
  const [hotkeys, setHotkeys] = useState<QuickHotkeyConfig[]>([])
  const [logs, setLogs] = useState<DailyQuickLogEntry[]>([])
  const [selectedHotkeyForDetail, setSelectedHotkeyForDetail] = useState<QuickHotkeyConfig | null>(null)
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [isProteinModalOpen, setIsProteinModalOpen] = useState(false)
  const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false)
  const [justTappedId, setJustTappedId] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('levl_hotkeys_tray_collapsed') === 'true'
    }
    return false
  })

  const currentDayOfWeek = useMemo(() => {
    try {
      const dateObj = new Date(date + 'T12:00:00')
      return format(dateObj, 'EEE') // 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
    } catch (e) {
      return 'Mon'
    }
  }, [date])

  const visibleHotkeys = useMemo(() => {
    return hotkeys.filter(h => {
      if (!h.days_of_week || h.days_of_week.length === 0) return true
      return h.days_of_week.includes(currentDayOfWeek)
    })
  }, [hotkeys, currentDayOfWeek])

  const reloadData = async () => {
    if (!localUserId) return
    const [fetchedHotkeys, fetchedLogs] = await Promise.all([
      getUserHotkeys(localUserId),
      loadQuickLogsForDate(localUserId, date)
    ])
    setHotkeys(fetchedHotkeys)
    setLogs(fetchedLogs)
  }

  useEffect(() => {
    reloadData()

    const handleUpdate = () => reloadData()
    const handleOpenNutrition = () => setIsNutritionModalOpen(true)

    window.addEventListener('levl_quicklog_updated', handleUpdate)
    window.addEventListener('levl_hotkeys_config_updated', handleUpdate)
    window.addEventListener('levl_nutrition_updated', handleUpdate)
    window.addEventListener('levl_open_nutrition_modal', handleOpenNutrition)

    return () => {
      window.removeEventListener('levl_quicklog_updated', handleUpdate)
      window.removeEventListener('levl_hotkeys_config_updated', handleUpdate)
      window.removeEventListener('levl_nutrition_updated', handleUpdate)
      window.removeEventListener('levl_open_nutrition_modal', handleOpenNutrition)
    }
  }, [date, localUserId])

  const handleQuickTapIncrement = async (e: React.MouseEvent, hotkey: QuickHotkeyConfig) => {
    e.stopPropagation()
    if (hotkey.id === 'nutrition_macros') {
      setIsNutritionModalOpen(true)
      return
    }

    setJustTappedId(hotkey.id)
    setTimeout(() => setJustTappedId(null), 400)

    const entry: DailyQuickLogEntry = {
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

    await saveQuickLogEntry(entry)
    reloadData()
  }

  const handleCardClick = (hotkey: QuickHotkeyConfig) => {
    if (hotkey.id === 'nutrition_macros' || hotkey.id === 'protein_pulse') {
      setIsNutritionModalOpen(true)
    } else {
      setSelectedHotkeyForDetail(hotkey)
    }
  }

  const toggleCollapse = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem('levl_hotkeys_tray_collapsed', next.toString())
    }
  }

  return (
    <div className={`space-y-2.5 my-3 ${className}`}>
      {/* Tray Header Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-levl-accent animate-pulse" />
          <span className="text-xs font-black text-white uppercase tracking-wider">
            Daily Quick-Log Hotkeys
          </span>
          {isCollapsed && (
            <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
              Hidden ({visibleHotkeys.length})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleCollapse}
            className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-all cursor-pointer bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-xl border border-white/5 active:scale-95"
            title={isCollapsed ? 'Show hotkeys tray' : 'Hide hotkeys tray'}
          >
            {isCollapsed ? (
              <>
                <Eye size={12} className="text-orange-400" />
                <span>Show All ({visibleHotkeys.length})</span>
              </>
            ) : (
              <>
                <EyeOff size={12} />
                <span>Hide All</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsManageModalOpen(true)}
            className="text-[11px] font-bold text-slate-400 hover:text-orange-300 flex items-center gap-1 transition-all cursor-pointer bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-xl border border-white/5 active:scale-95"
          >
            <Sliders size={12} />
            <span>Customize Tray</span>
          </button>
        </div>
      </div>

      {/* 3-Wide Grid Layout */}
      {!isCollapsed && (
        visibleHotkeys.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 animate-in fade-in duration-200">
            {visibleHotkeys.map(hotkey => {
              const IconComp = ICON_MAP[hotkey.icon] || Activity
              const hotkeyLogs = logs.filter(l => l.hotkey_id === hotkey.id)
              const totalVal = hotkeyLogs.reduce((acc, l) => acc + l.value, 0)
              const isGoalReached = hotkey.daily_goal && !hotkey.is_negative ? totalVal >= hotkey.daily_goal : false
              const isTapped = justTappedId === hotkey.id

          return (
            <div
              key={hotkey.id}
              className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden relative select-none shadow-md ${
                isTapped
                  ? 'ring-2 ring-orange-400 scale-[0.98] bg-slate-800'
                  : hotkey.is_negative
                  ? totalVal > 0
                    ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/70'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  : isGoalReached
                  ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/70'
                  : 'bg-slate-900/90 border-slate-800 hover:border-orange-500/40'
              }`}
            >
              {/* PRIMARY 1-CLICK LOGGING AREA (Biggest portion of the card) */}
              <button
                type="button"
                onClick={(e) => handleQuickTapIncrement(e, hotkey)}
                className="w-full text-left p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between cursor-pointer hover:bg-white/[0.03] active:bg-orange-500/10 active:scale-[0.98] transition-all group/btn focus:outline-none"
                title={`1-Click: Log +${hotkey.default_increment} ${hotkey.unit}`}
              >
                {/* Top Row: Icon + 1-Tap Indicator Badge */}
                <div className="flex items-start justify-between gap-1 w-full">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center border text-xs shrink-0 transition-colors ${
                      hotkey.is_negative
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                        : hotkey.id === 'nutrition_macros'
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : hotkey.id === 'protein_pulse'
                        ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                        : 'bg-slate-800 border-white/5 text-slate-300 group-hover/btn:text-white'
                    }`}
                  >
                    <IconComp size={15} />
                  </div>

                  <span
                    className={`px-1.5 sm:px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-mono font-black border transition-all flex items-center gap-0.5 shadow-sm ${
                      hotkey.is_negative
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 group-hover/btn:bg-rose-500 group-hover/btn:text-white'
                        : hotkey.id === 'nutrition_macros'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 group-hover/btn:bg-emerald-500 group-hover/btn:text-black'
                        : 'bg-orange-500/20 text-orange-300 border-orange-500/40 group-hover/btn:bg-orange-500 group-hover/btn:text-black'
                    }`}
                  >
                    <Plus size={11} strokeWidth={3} />
                    <span>{hotkey.default_increment}</span>
                  </span>
                </div>

                {/* Center Value Metric */}
                <div className="my-1 sm:my-2 w-full">
                  <div className="flex items-baseline gap-1">
                    <span className="text-base sm:text-2xl font-black text-white font-mono tracking-tight">
                      {totalVal}
                    </span>
                    <span className="text-[10px] sm:text-xs font-mono text-slate-400">
                      {hotkey.unit}
                    </span>
                  </div>

                  <div className="text-[11px] sm:text-xs font-bold text-slate-200 group-hover/btn:text-orange-300 transition-colors truncate leading-tight mt-0.5">
                    {hotkey.name}
                  </div>
                </div>

                {/* Micro 1-Tap Hint */}
                <div className="text-[9px] text-slate-500 group-hover/btn:text-orange-400 transition-colors font-semibold">
                  Tap to +{hotkey.default_increment} {hotkey.unit}
                </div>
              </button>

              {/* BOTTOM DETAILS & EDIT DEFAULT ACTION BAR */}
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  handleCardClick(hotkey)
                }}
                className="px-2.5 sm:px-3 py-1.5 bg-black/40 hover:bg-slate-800/80 border-t border-white/5 flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-slate-400 hover:text-white cursor-pointer transition-colors group/bot"
                title="Click for details, custom entries, or to change default amount"
              >
                <span className="truncate mr-1">
                  {hotkey.daily_goal && !hotkey.is_negative ? (
                    <span className={isGoalReached ? 'text-emerald-400 font-bold' : ''}>
                      {isGoalReached ? '✓ Done' : `Goal: ${hotkey.daily_goal}${hotkey.unit}`}
                    </span>
                  ) : (
                    <span>{hotkeyLogs.length} {hotkeyLogs.length === 1 ? 'entry' : 'entries'}</span>
                  )}
                </span>

                <span className="text-slate-500 group-hover/bot:text-orange-300 flex items-center gap-0.5 font-bold shrink-0">
                  <span>Details</span>
                  <ChevronRight size={11} />
                </span>
              </div>
            </div>
          )
        })}

        {/* 3-Wide Add Hotkey Card */}
        <div
          onClick={() => setIsManageModalOpen(true)}
          className="p-2.5 sm:p-3.5 rounded-2xl border border-dashed border-slate-800 hover:border-orange-500/50 bg-slate-950/40 hover:bg-orange-950/10 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-1 group shadow-sm min-h-[110px]"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/5 group-hover:bg-orange-500/20 text-slate-400 group-hover:text-orange-400 flex items-center justify-center transition-colors">
            <Plus size={16} />
          </div>
          <span className="text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors">
            + Add Hotkey
          </span>
          <span className="text-[9px] text-slate-600">Preset or Custom</span>
        </div>
      </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-bold">
            <Calendar size={14} className="text-orange-400" />
            <span>No Hotkeys Scheduled for {currentDayOfWeek}</span>
          </div>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            You have {hotkeys.length} hotkey{hotkeys.length !== 1 ? 's' : ''} configured, but none are active on {currentDayOfWeek}s.
          </p>
          <button
            type="button"
            onClick={() => setIsManageModalOpen(true)}
            className="text-xs font-bold text-orange-400 hover:text-orange-300 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Sliders size={12} />
            <span>Customize Hotkey Schedule</span>
          </button>
        </div>
      ))}

      {/* Modal: Quick Log Detail & Custom Presets */}
      {selectedHotkeyForDetail && (
        <QuickLogDetailModal
          hotkey={selectedHotkeyForDetail}
          date={date}
          localUserId={localUserId}
          logs={logs}
          onClose={() => setSelectedHotkeyForDetail(null)}
          onLogsChanged={reloadData}
        />
      )}

      {/* Modal: AI Nutrition & Circadian Fasting Engine */}
      {isNutritionModalOpen && (
        <NutritionFastingModal
          date={date}
          localUserId={localUserId}
          userProfile={userProfile}
          onClose={() => setIsNutritionModalOpen(false)}
          onLogsChanged={reloadData}
        />
      )}

      {/* Modal: Protein & Leucine Pulse Tracker */}
      {isProteinModalOpen && (
        <ProteinPulseTrackerModal
          date={date}
          localUserId={localUserId}
          userProfile={userProfile}
          logs={logs}
          onClose={() => setIsProteinModalOpen(false)}
          onLogsChanged={reloadData}
        />
      )}

      {/* Modal: Manage & Create Hotkeys */}
      {isManageModalOpen && (
        <ManageHotkeysModal
          localUserId={localUserId}
          activeHotkeys={hotkeys}
          onClose={() => setIsManageModalOpen(false)}
          onSaved={updated => {
            setHotkeys(updated)
            reloadData()
          }}
        />
      )}
    </div>
  )
}
