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
import { QuickHotkeyConfig, DailyQuickLogEntry, UserProfile, DailyMealLogEntry } from '@/lib/types'
import {
  getUserHotkeys,
  loadQuickLogsForDate,
  saveQuickLogEntry
} from '@/lib/storage/quickLogsStorage'
import { loadDailyMealLogs } from '@/lib/storage/nutritionStorage'
import QuickLogDetailModal from './QuickLogDetailModal'
import ManageHotkeysModal from './ManageHotkeysModal'
import ProteinPulseTrackerModal from './ProteinPulseTrackerModal'
import NutritionFastingModal from './NutritionFastingModal'
import PeriodFlowLoggerModal from '@/components/modals/PeriodFlowLoggerModal'
import { calculateInfradianStatus } from '@/lib/tracking/infradianEngine'

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
  const [meals, setMeals] = useState<DailyMealLogEntry[]>([])
  const [selectedHotkeyForDetail, setSelectedHotkeyForDetail] = useState<QuickHotkeyConfig | null>(null)
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [isProteinModalOpen, setIsProteinModalOpen] = useState(false)
  const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false)
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false)
  const [justTappedId, setJustTappedId] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('levl_hotkeys_tray_collapsed') === 'true'
    }
    return false
  })

  const currentDayOfWeek = useMemo(() => {
    try {
      const cleanDate = (date || '').split('T')[0]
      const [y, m, d] = cleanDate.split('-').map(Number)
      if (y && m && d) {
        const dateObj = new Date(y, m - 1, d, 12, 0, 0)
        return format(dateObj, 'EEE') // 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
      }
      return format(new Date(), 'EEE')
    } catch (e) {
      return format(new Date(), 'EEE')
    }
  }, [date])

  const infradianStatus = useMemo(() => {
    return calculateInfradianStatus(userProfile, date)
  }, [userProfile, date])

  const visibleHotkeys = useMemo(() => {
    if (!hotkeys || hotkeys.length === 0) return []
    return hotkeys.filter(h => {
      if (!h.days_of_week || h.days_of_week.length === 0) return true
      const normalizedDays = h.days_of_week.map(d => d.slice(0, 3).toLowerCase())
      const curShort = currentDayOfWeek.slice(0, 3).toLowerCase()
      return normalizedDays.includes(curShort) || h.days_of_week.includes(currentDayOfWeek)
    })
  }, [hotkeys, currentDayOfWeek])

  const reloadData = async () => {
    if (!localUserId) return
    const [fetchedHotkeys, fetchedLogs, fetchedMeals] = await Promise.all([
      getUserHotkeys(localUserId),
      loadQuickLogsForDate(localUserId, date),
      loadDailyMealLogs(localUserId, date)
    ])
    setHotkeys(fetchedHotkeys)
    setLogs(fetchedLogs)
    setMeals(fetchedMeals || [])
  }

  useEffect(() => {
    reloadData()

    const handleUpdate = (e: any) => {
      // If the event carries an entry we already optimistically added, avoid redundant full refetch
      if (e && e.detail && e.detail.id) {
        setLogs(prev => {
          if (prev.some(l => l.id === e.detail.id)) return prev
          return [...prev, e.detail]
        })
      } else {
        reloadData()
      }
    }
    const handleHotkeysUpdated = (e: any) => {
      if (e && e.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setHotkeys(e.detail)
      } else {
        reloadData()
      }
    }
    const handleOpenNutrition = () => setIsNutritionModalOpen(true)

    window.addEventListener('levl_quicklog_updated', handleUpdate)
    window.addEventListener('levl_hotkeys_config_updated', handleHotkeysUpdated)
    window.addEventListener('levl_nutrition_updated', handleUpdate)
    window.addEventListener('levl_open_nutrition_modal', handleOpenNutrition)

    return () => {
      window.removeEventListener('levl_quicklog_updated', handleUpdate)
      window.removeEventListener('levl_hotkeys_config_updated', handleHotkeysUpdated)
      window.removeEventListener('levl_nutrition_updated', handleUpdate)
      window.removeEventListener('levl_open_nutrition_modal', handleOpenNutrition)
    }
  }, [date, localUserId])

  const handleQuickTapIncrement = (e: React.MouseEvent, hotkey: QuickHotkeyConfig) => {
    e.stopPropagation()
    if (hotkey.id === 'nutrition_macros') {
      setIsNutritionModalOpen(true)
      return
    }

    // 1. Instant 0ms Haptic Visual Pulse
    setJustTappedId(hotkey.id)
    setTimeout(() => setJustTappedId(null), 300)

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

    // 2. INSTANT 0ms OPTIMISTIC IN-MEMORY STATE UPDATE (Display updates immediately!)
    setLogs(prev => [...prev, entry])

    // 3. Fire-and-forget background persistence (non-blocking)
    saveQuickLogEntry(entry).catch(err => {
      console.error('Failed to persist quick log entry:', err)
    })
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
          <Sparkles size={15} className="text-levl-accent animate-pulse" />
          <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
            Daily Quick-Log Hotkeys
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleCollapse}
            className="text-xs sm:text-[12.5px] font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer bg-white/5 hover:bg-white/10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-white/10 active:scale-95 shadow-sm"
            title={isCollapsed ? 'Show hotkeys tray' : 'Hide hotkeys tray'}
          >
            {isCollapsed ? (
              <>
                <Eye size={13} className="text-orange-400" />
                <span>Show All ({visibleHotkeys.length})</span>
              </>
            ) : (
              <>
                <EyeOff size={13} />
                <span>Hide All</span>
              </>
            )}
          </button>

          {/* Contextual Infradian Period Hotkey */}
          {infradianStatus && infradianStatus.enabled && (
            <button
              type="button"
              onClick={() => setIsPeriodModalOpen(true)}
              className="text-xs sm:text-[12.5px] font-bold text-rose-300 hover:text-rose-200 flex items-center gap-1.5 transition-all cursor-pointer bg-rose-950/60 hover:bg-rose-950/90 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-rose-500/40 shadow-sm active:scale-95"
            >
              <span>🌸</span>
              <span>
                {infradianStatus.todayLog?.is_period_day
                  ? `Day ${infradianStatus.cycleDay}: ${infradianStatus.todayLog.flow_level} Flow`
                  : infradianStatus.isPeriodExpectedSoon
                  ? 'Period Expected (Log Start)'
                  : `Cycle Day ${infradianStatus.cycleDay}`}
              </span>
            </button>
          )}

          {!isCollapsed && (
            <button
              type="button"
              onClick={() => setIsManageModalOpen(true)}
              className="text-xs sm:text-[12.5px] font-bold text-slate-300 hover:text-orange-300 flex items-center gap-1.5 transition-all cursor-pointer bg-white/5 hover:bg-white/10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-white/10 active:scale-95 shadow-sm"
            >
              <Sliders size={13} />
              <span>Customize Tray</span>
            </button>
          )}
        </div>
      </div>

      {/* Responsive Grid Layout: 3-wide on mobile, 4 on tablet/small desktop, 5-6 on wide desktop */}
      {!isCollapsed && (
        visibleHotkeys.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-2.5 md:gap-3 animate-in fade-in duration-200">
            {visibleHotkeys.map(hotkey => {
              const IconComp = ICON_MAP[hotkey.icon] || Activity
              const hotkeyLogs = logs.filter(l => l.hotkey_id === hotkey.id)
              const mealCalories = meals.reduce((acc, m) => acc + (m.calories || 0), 0)
              const totalVal = hotkey.id === 'nutrition_macros' && mealCalories > 0
                ? mealCalories
                : hotkeyLogs.reduce((acc, l) => acc + l.value, 0)
              const isGoalReached = hotkey.daily_goal && !hotkey.is_negative ? totalVal >= hotkey.daily_goal : false
              const progressPct = hotkey.daily_goal && !hotkey.is_negative
                ? Math.min(100, Math.max(0, Math.round((totalVal / hotkey.daily_goal) * 100)))
                : totalVal > 0 ? 100 : 0
              const isNegative = hotkey.is_negative || hotkey.polarity === 'negative'
              const isNeutral = hotkey.is_neutral || hotkey.polarity === 'neutral' || hotkey.color_theme === 'cyan' || hotkey.color_theme === 'blue' || hotkey.color_theme === 'slate' || hotkey.color_theme === 'sky'
              const isTapped = justTappedId === hotkey.id

          return (
            <div
              key={hotkey.id}
              onClick={(e) => handleQuickTapIncrement(e, hotkey)}
              className={`h-[110px] sm:h-[116px] rounded-2xl border transition-all flex flex-col justify-between p-2.5 sm:p-3 overflow-hidden relative select-none shadow-md cursor-pointer hover:bg-white/[0.03] active:scale-[0.97] group/card ${
                isTapped
                  ? isNegative
                    ? 'ring-2 ring-rose-400 scale-[0.96] bg-slate-800'
                    : isNeutral
                    ? 'ring-2 ring-sky-400 scale-[0.96] bg-slate-800'
                    : 'ring-2 ring-orange-400 scale-[0.96] bg-slate-800'
                  : isNegative
                  ? totalVal > 0
                    ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/70'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  : isNeutral
                  ? totalVal > 0
                    ? 'bg-sky-950/20 border-sky-500/40 hover:border-sky-500/70'
                    : 'bg-slate-900/90 border-slate-800 hover:border-sky-500/40'
                  : isGoalReached
                  ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/70'
                  : 'bg-slate-900/90 border-slate-800 hover:border-orange-500/40'
              }`}
              title={`1-Click: Log +${hotkey.default_increment} ${hotkey.unit}`}
            >
              {/* Thin Vertical Gradient Bar filling up proportionately along left side */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800/40 z-10 pointer-events-none rounded-l-2xl overflow-hidden">
                <div
                  className={`absolute bottom-0 left-0 right-0 transition-all duration-300 rounded-bl-2xl ${
                    progressPct >= 100 ? 'rounded-tl-2xl' : ''
                  } ${
                    isNegative
                      ? 'bg-gradient-to-t from-rose-600 via-rose-500 to-red-400'
                      : isNeutral
                      ? 'bg-gradient-to-t from-sky-600 via-sky-500 to-cyan-400'
                      : hotkey.id === 'nutrition_macros'
                      ? 'bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400'
                      : hotkey.id === 'protein_pulse'
                      ? 'bg-gradient-to-t from-orange-600 via-orange-500 to-amber-400'
                      : 'bg-gradient-to-t from-orange-500 via-amber-400 to-emerald-400'
                  }`}
                  style={{ height: `${progressPct}%` }}
                />
              </div>

              {/* TOP ROW: Icon + Increment Badge */}
              <div className="flex items-center justify-between gap-1 w-full pl-0.5">
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl flex items-center justify-center border text-xs shrink-0 transition-colors ${
                    isNegative
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                      : isNeutral
                      ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                      : hotkey.id === 'nutrition_macros'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : hotkey.id === 'protein_pulse'
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                      : 'bg-slate-800 border-white/5 text-slate-300 group-hover/card:text-white'
                  }`}
                >
                  <IconComp size={13} className="sm:size-3.5" />
                </div>

                <span
                  className={`px-1.5 sm:px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-mono font-black border transition-all flex items-baseline gap-0.5 sm:gap-1 shadow-sm shrink-0 ${
                    isNegative
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 group-hover/card:bg-rose-500 group-hover/card:text-white'
                      : isNeutral
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 group-hover/card:bg-sky-400 group-hover/card:text-black'
                      : hotkey.id === 'nutrition_macros'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 group-hover/card:bg-emerald-500 group-hover/card:text-black'
                      : 'bg-orange-500/20 text-orange-300 border-orange-500/40 group-hover/card:bg-orange-500 group-hover/card:text-black'
                  }`}
                >
                  <Plus size={10} strokeWidth={3} className="shrink-0 self-center" />
                  <span className="font-black">{hotkey.default_increment}</span>
                  <span className="text-[9px] sm:text-[10px] font-bold opacity-90 uppercase tracking-tight ml-0.5">{hotkey.unit}</span>
                </span>
              </div>

              {/* FULL-WIDTH NAME ROW: Single line, crisp, high legibility, truncate without vertical collision */}
              <div
                className={`w-full pl-0.5 text-xs sm:text-[12.5px] font-bold text-slate-100 tracking-tight transition-colors truncate leading-tight ${
                  isNegative
                    ? 'group-hover/card:text-rose-300'
                    : isNeutral
                    ? 'group-hover/card:text-sky-300'
                    : 'group-hover/card:text-orange-300'
                }`}
                title={hotkey.name}
              >
                {hotkey.name}
              </div>

              {/* BOTTOM ROW: Numerator & Denominator Value Metric + Expand/Detail Chevron */}
              <div className="flex items-center justify-between gap-1 w-full pl-0.5">
                <div className="flex items-baseline gap-1 min-w-0">
                  <span className={`text-lg sm:text-xl font-black font-mono tracking-tight leading-none transition-colors ${
                    isGoalReached && !isNegative ? 'text-emerald-400' : 'text-white'
                  }`}>
                    {totalVal}
                  </span>
                  {hotkey.daily_goal && !isNegative ? (
                    <span className={`text-[11px] sm:text-xs font-bold font-mono transition-colors truncate ${
                      isGoalReached ? 'text-emerald-400 font-bold' : 'text-slate-300'
                    }`}>
                      /{hotkey.daily_goal} <span className="text-[9.5px] sm:text-[10.5px] font-medium text-slate-400">{hotkey.unit}</span>
                    </span>
                  ) : (
                    <span className="text-[10.5px] sm:text-xs font-bold font-mono text-slate-400 truncate">
                      {hotkey.unit}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCardClick(hotkey)
                  }}
                  className="shrink-0 p-0.5 sm:p-1 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/10 ml-auto"
                  title="Click for details & logs"
                >
                  <ChevronRight size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          )
        })}

        {/* Add Hotkey Card */}
        <div
          onClick={() => setIsManageModalOpen(true)}
          className="h-[110px] sm:h-[116px] rounded-2xl border border-dashed border-slate-800 hover:border-orange-500/50 bg-slate-950/40 hover:bg-orange-950/10 transition-all cursor-pointer flex flex-col items-center justify-center text-center p-2 sm:p-2.5 space-y-1 group shadow-sm select-none"
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-white/5 group-hover:bg-orange-500/20 text-slate-400 group-hover:text-orange-400 flex items-center justify-center transition-colors">
            <Plus size={14} strokeWidth={2.5} />
          </div>
          <span className="text-[11.5px] sm:text-xs font-bold text-slate-200 group-hover:text-white transition-colors leading-tight">
            + Add Hotkey
          </span>
          <span className="text-[9.5px] sm:text-[10px] text-slate-400 font-medium tracking-tight">Custom / Preset</span>
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
          }}
        />
      )}

      {/* Modal: Period & Flow Logger */}
      {isPeriodModalOpen && (
        <PeriodFlowLoggerModal
          isOpen={isPeriodModalOpen}
          onClose={() => setIsPeriodModalOpen(false)}
          localUserId={localUserId}
          userProfile={userProfile || null}
          targetDate={date}
          onSaved={() => {
            reloadData()
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('levl_period_log_updated'))
            }
          }}
        />
      )}
    </div>
  )
}
