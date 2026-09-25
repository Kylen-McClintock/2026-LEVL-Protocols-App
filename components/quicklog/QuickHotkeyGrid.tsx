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
import { useHomeWidgets } from '@/lib/utils/layoutSettings'
import { useTheme } from '@/lib/utils/useTheme'

interface QuickHotkeyGridProps {
  date: string
  localUserId: string
  userProfile?: UserProfile | null
  className?: string
  defaultCollapsed?: boolean
  showInfradian?: boolean
}

export function getHotkeyPalette(hotkey: QuickHotkeyConfig, isDaylight: boolean) {
  const isNegative = hotkey.is_negative || hotkey.polarity === 'negative'
  const cat = (hotkey.category || '').toLowerCase()
  const theme = (hotkey.color_theme || '').toLowerCase()
  const id = (hotkey.id || '').toLowerCase()
  const name = (hotkey.name || '').toLowerCase()

  if (isNegative) {
    return {
      iconBg: isDaylight ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-rose-500/20 border-rose-500/35 text-rose-300',
      badge: isDaylight ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-600 hover:text-white' : 'bg-rose-500/20 text-rose-300 border-rose-500/40 group-hover/card:bg-rose-500 group-hover/card:text-white',
      progress: isDaylight ? 'bg-rose-500' : 'bg-gradient-to-t from-rose-600 via-rose-500 to-red-400'
    }
  }

  // 1. Hydration & Thermal & Cold -> Sky / Cyan
  if (
    cat === 'hydration' ||
    cat === 'thermal' ||
    theme === 'cyan' ||
    theme === 'sky' ||
    id.includes('water') ||
    id.includes('cold') ||
    id.includes('sauna') ||
    name.includes('water') ||
    name.includes('plunge') ||
    id.includes('collagen') ||
    name.includes('collagen')
  ) {
    return {
      iconBg: isDaylight ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-sky-500/20 border-sky-500/35 text-sky-300',
      badge: isDaylight ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-500 hover:text-white' : 'bg-sky-500/20 text-sky-300 border-sky-500/40 group-hover/card:bg-sky-400 group-hover/card:text-black',
      progress: isDaylight ? 'bg-sky-500' : 'bg-gradient-to-t from-sky-600 via-sky-500 to-cyan-400'
    }
  }

  // 2. Amber / Warm Gold / Orange -> Coffee, Creatine, Sunlight, Movement, Steps, Protein Pulse
  if (
    theme === 'amber' ||
    theme === 'orange' ||
    cat === 'fitness' ||
    cat === 'movement' ||
    id.includes('coffee') ||
    id.includes('caffeine') ||
    name.includes('coffee') ||
    name.includes('caffeine') ||
    id.includes('creatine') ||
    name.includes('creatine') ||
    id.includes('sunlight') ||
    id.includes('sun') ||
    name.includes('sunlight') ||
    id.includes('step') ||
    name.includes('step') ||
    id.includes('protein_pulse')
  ) {
    return {
      iconBg: isDaylight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-500/20 border-amber-500/35 text-amber-300',
      badge: isDaylight ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-500 hover:text-white' : 'bg-orange-500/20 text-orange-300 border-orange-500/40 group-hover/card:bg-orange-500 group-hover/card:text-black',
      progress: isDaylight ? 'bg-amber-500' : 'bg-gradient-to-t from-orange-500 via-amber-400 to-emerald-400'
    }
  }

  // 3. Circadian / Sleep -> Purple
  if (
    cat === 'circadian' ||
    cat === 'sleep' ||
    theme === 'purple' ||
    id.includes('sleep') ||
    name.includes('sleep')
  ) {
    return {
      iconBg: isDaylight ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-purple-500/20 border-purple-500/35 text-purple-300',
      badge: isDaylight ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-600 hover:text-white' : 'bg-purple-500/20 text-purple-300 border-purple-500/40 group-hover/card:bg-purple-500 group-hover/card:text-white',
      progress: isDaylight ? 'bg-purple-500' : 'bg-gradient-to-t from-purple-600 via-purple-500 to-indigo-400'
    }
  }

  // 4. Mind / Breathwork / Eye rest -> Indigo
  if (
    cat === 'mind' ||
    theme === 'blue' ||
    theme === 'indigo' ||
    id.includes('mind') ||
    id.includes('screen')
  ) {
    return {
      iconBg: isDaylight ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-indigo-500/20 border-indigo-500/35 text-indigo-300',
      badge: isDaylight ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 group-hover/card:bg-indigo-500 group-hover/card:text-white',
      progress: isDaylight ? 'bg-indigo-500' : 'bg-gradient-to-t from-indigo-600 via-indigo-500 to-sky-400'
    }
  }

  // 5. Default / Nutrition / Emerald -> Meals, EVOO, general
  return {
    iconBg: isDaylight ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-emerald-500/20 border-emerald-500/35 text-emerald-300',
    badge: isDaylight ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 group-hover/card:bg-emerald-500 group-hover/card:text-black',
    progress: isDaylight ? 'bg-emerald-500' : 'bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400'
  }
}

export interface HotkeyThemeStyle {
  key: string
  colorHex: string
  borderClass: string
  borderHoverClass: string
  bgTintClass: string
  activeRingClass: string
  iconBgClass: string
  iconTextClass: string
  badgeBgClass: string
  badgeTextClass: string
  badgeBorderClass: string
  badgeHoverClass: string
  nameHoverClass: string
  progressGradientClass: string
  glowShadow: string
  fullGradientCss: string
  borderGradientCss?: string
}

export function getHotkeyVisualTheme(hotkey: QuickHotkeyConfig): HotkeyThemeStyle {
  const isNegative = hotkey.is_negative || hotkey.polarity === 'negative'
  if (isNegative) {
    return {
      key: 'vice',
      colorHex: '#F43F5E',
      borderClass: 'border-rose-500/40',
      borderHoverClass: 'hover:border-rose-500/70',
      bgTintClass: 'bg-rose-950/20',
      activeRingClass: 'ring-rose-400',
      iconBgClass: 'bg-rose-500/15 border-rose-500/30',
      iconTextClass: 'text-rose-300',
      badgeBgClass: 'bg-rose-500/20',
      badgeTextClass: 'text-rose-300',
      badgeBorderClass: 'border-rose-500/40',
      badgeHoverClass: 'group-hover/card:bg-rose-500 group-hover/card:text-white',
      nameHoverClass: 'group-hover/card:text-rose-300',
      progressGradientClass: 'bg-gradient-to-t from-rose-600 via-rose-500 to-red-400',
      glowShadow: 'shadow-[0_0_15px_rgba(244,63,94,0.35)]',
      fullGradientCss: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
      borderGradientCss: 'linear-gradient(135deg, #FB7185 0%, #E11D48 100%)'
    }
  }

  const cat = (hotkey.category || '').toLowerCase()
  const theme = (hotkey.color_theme || '').toLowerCase()
  const id = (hotkey.id || '').toLowerCase()
  const name = (hotkey.name || '').toLowerCase()

  // 1. Sleep & Circadian -> Deep Purple (#A855F7)
  if (
    cat === 'circadian' ||
    cat === 'sleep' ||
    theme === 'purple' ||
    id.includes('sleep') ||
    id.includes('sun') ||
    name.includes('sleep') ||
    name.includes('sunlight')
  ) {
    return {
      key: 'circadian',
      colorHex: '#A855F7',
      borderClass: 'border-purple-500/40',
      borderHoverClass: 'hover:border-purple-500/70',
      bgTintClass: 'bg-purple-950/20',
      activeRingClass: 'ring-purple-400',
      iconBgClass: 'bg-purple-500/15 border-purple-500/30',
      iconTextClass: 'text-purple-300',
      badgeBgClass: 'bg-purple-500/20',
      badgeTextClass: 'text-purple-300',
      badgeBorderClass: 'border-purple-500/40',
      badgeHoverClass: 'group-hover/card:bg-purple-500 group-hover/card:text-white',
      nameHoverClass: 'group-hover/card:text-purple-300',
      progressGradientClass: 'bg-gradient-to-t from-purple-600 via-purple-500 to-indigo-400',
      glowShadow: 'shadow-[0_0_15px_rgba(168,85,247,0.35)]',
      fullGradientCss: 'linear-gradient(135deg, #9333EA 0%, #7E22CE 100%)',
      borderGradientCss: 'linear-gradient(135deg, #C084FC 0%, #9333EA 100%)'
    }
  }

  // 2. Hydration / Thermal / Water / Ice / Cold -> Cyan / Sky (#06B6D4)
  if (
    cat === 'hydration' ||
    cat === 'thermal' ||
    theme === 'cyan' ||
    theme === 'sky' ||
    id.includes('water') ||
    id.includes('cold') ||
    id.includes('sauna') ||
    name.includes('water') ||
    name.includes('cold') ||
    name.includes('plunge') ||
    name.includes('sauna')
  ) {
    return {
      key: 'hydration',
      colorHex: '#06B6D4',
      borderClass: 'border-cyan-500/40',
      borderHoverClass: 'hover:border-cyan-500/70',
      bgTintClass: 'bg-cyan-950/20',
      activeRingClass: 'ring-cyan-400',
      iconBgClass: 'bg-cyan-500/15 border-cyan-500/30',
      iconTextClass: 'text-cyan-300',
      badgeBgClass: 'bg-cyan-500/20',
      badgeTextClass: 'text-cyan-300',
      badgeBorderClass: 'border-cyan-500/40',
      badgeHoverClass: 'group-hover/card:bg-cyan-500 group-hover/card:text-black',
      nameHoverClass: 'group-hover/card:text-cyan-300',
      progressGradientClass: 'bg-gradient-to-t from-sky-600 via-sky-500 to-cyan-400',
      glowShadow: 'shadow-[0_0_15px_rgba(6,182,212,0.35)]',
      fullGradientCss: 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)',
      borderGradientCss: 'linear-gradient(135deg, #22D3EE 0%, #0891B2 100%)'
    }
  }

  // 3. Movement / Fitness -> Amber / Orange (#F97316)
  if (
    cat === 'fitness' ||
    cat === 'movement' ||
    theme === 'orange' ||
    theme === 'amber' ||
    id.includes('step') ||
    name.includes('step') ||
    id.includes('stretch')
  ) {
    return {
      key: 'movement',
      colorHex: '#F97316',
      borderClass: 'border-orange-500/40',
      borderHoverClass: 'hover:border-orange-500/70',
      bgTintClass: 'bg-orange-950/20',
      activeRingClass: 'ring-orange-400',
      iconBgClass: 'bg-orange-500/15 border-orange-500/30',
      iconTextClass: 'text-orange-300',
      badgeBgClass: 'bg-orange-500/20',
      badgeTextClass: 'text-orange-300',
      badgeBorderClass: 'border-orange-500/40',
      badgeHoverClass: 'group-hover/card:bg-orange-500 group-hover/card:text-black',
      nameHoverClass: 'group-hover/card:text-orange-300',
      progressGradientClass: 'bg-gradient-to-t from-orange-500 via-amber-400 to-emerald-400',
      glowShadow: 'shadow-[0_0_15px_rgba(249,115,22,0.35)]',
      fullGradientCss: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
      borderGradientCss: 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)'
    }
  }

  // 4. Default / Nutrition / Supplements -> Vibrant Rich Emerald (#05DF72)
  return {
    key: 'nutrition',
    colorHex: '#05DF72',
    borderClass: 'border-emerald-500/40',
    borderHoverClass: 'hover:border-emerald-400',
    bgTintClass: 'bg-emerald-950/20',
    activeRingClass: 'ring-emerald-400',
    iconBgClass: 'bg-emerald-500/15 border-emerald-500/30',
    iconTextClass: 'text-emerald-300',
    badgeBgClass: 'bg-emerald-500/20',
    badgeTextClass: 'text-emerald-300',
    badgeBorderClass: 'border-emerald-500/40',
    badgeHoverClass: 'group-hover/card:bg-emerald-500 group-hover/card:text-black',
    nameHoverClass: 'group-hover/card:text-emerald-300',
    progressGradientClass: 'bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400',
    glowShadow: 'shadow-[0_0_15px_rgba(5,223,114,0.35)]',
    fullGradientCss: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    borderGradientCss: 'linear-gradient(135deg, #34D399 0%, #059669 100%)'
  }
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
  className = '',
  defaultCollapsed,
  showInfradian
}: QuickHotkeyGridProps) {
  const { theme } = useTheme()
  const isDaylight = theme === 'light'

  const { widgets: homeWidgets } = useHomeWidgets(userProfile)
  const isPeriodLayoutActive = showInfradian !== undefined ? showInfradian : homeWidgets.infradian

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
    if (defaultCollapsed !== undefined) return defaultCollapsed
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('levl_hotkeys_tray_collapsed')
      if (stored !== null) return stored === 'true'
    }
    return true
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

  const isFemaleEligible =
    userProfile?.biological_sex?.toLowerCase() === 'female' &&
    Boolean(userProfile?.age && userProfile.age < 52) &&
    Boolean(userProfile?.infradian_cycle_enabled)

  const showPeriodHotkey =
    Boolean(isPeriodLayoutActive) &&
    isFemaleEligible &&
    Boolean(infradianStatus && infradianStatus.enabled)

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
          <span className={`text-xs sm:text-sm font-black uppercase tracking-wider ${
            isDaylight ? 'text-[#1E293B]' : 'text-white'
          }`}>
            Daily Quick-Log Hotkeys
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleCollapse}
            className={`text-xs sm:text-[12.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border active:scale-95 shadow-sm ${
              isDaylight
                ? 'bg-white hover:bg-slate-50 text-[#475569] border-[#E1E8E3]'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10'
            }`}
            title={isCollapsed ? 'Show hotkeys tray' : 'Hide hotkeys tray'}
          >
            {isCollapsed ? (
              <>
                <Eye size={13} className="text-orange-500" />
                <span>Show All ({visibleHotkeys.length})</span>
              </>
            ) : (
              <>
                <EyeOff size={13} />
                <span>Hide All</span>
              </>
            )}
          </button>

          {/* Contextual Infradian Period Hotkey (Strictly for Female Users < 52 who opted in and enabled in layout) */}
          {showPeriodHotkey && infradianStatus && (
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
              className={`text-xs sm:text-[12.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border active:scale-95 shadow-sm ${
                isDaylight
                  ? 'bg-white hover:bg-slate-50 text-[#475569] hover:text-orange-600 border-[#E1E8E3]'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-orange-300 border-white/10'
              }`}
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
              const palette = getHotkeyPalette(hotkey, isDaylight)
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
              const isTapped = justTappedId === hotkey.id

              return (
                <div
                  key={hotkey.id}
                  onClick={(e) => handleQuickTapIncrement(e, hotkey)}
                  className={`h-[110px] sm:h-[116px] rounded-2xl border transition-all flex flex-col justify-between p-2.5 sm:p-3 overflow-hidden relative select-none shadow-sm cursor-pointer active:scale-[0.97] group/card ${
                    isTapped
                      ? isDaylight
                        ? 'ring-2 ring-emerald-400 scale-[0.96] bg-slate-50 border-slate-300'
                        : 'ring-2 ring-white/60 scale-[0.96] bg-slate-800 border-slate-700'
                      : isDaylight
                      ? 'bg-white border-[#E1E8E3] hover:border-[#8B5CF6]/40 hover:shadow-md'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-white/[0.03]'
                  }`}
                  title={`1-Click: Log +${hotkey.default_increment} ${hotkey.unit}`}
                >
                  {/* Thin Vertical Gradient Bar filling up proportionately along left side */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 ${
                    isDaylight ? 'bg-slate-200/80' : 'bg-slate-800/60'
                  } z-10 pointer-events-none rounded-l-2xl overflow-hidden`}>
                    <div
                      className={`absolute bottom-0 left-0 right-0 transition-all duration-300 rounded-bl-2xl ${
                        progressPct >= 100 ? 'rounded-tl-2xl' : ''
                      } ${palette.progress}`}
                      style={{ height: `${progressPct}%` }}
                    />
                  </div>

                  {/* TOP ROW: Icon + Increment Badge */}
                  <div className="flex items-center justify-between gap-1 w-full pl-0.5">
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl flex items-center justify-center border text-xs shrink-0 transition-colors ${palette.iconBg}`}
                    >
                      <IconComp size={13} className="sm:size-3.5" />
                    </div>

                    <span
                      className={`px-1.5 sm:px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-mono font-black border transition-all flex items-baseline gap-0.5 sm:gap-1 shadow-sm shrink-0 ${palette.badge}`}
                    >
                      <Plus size={10} strokeWidth={3} className="shrink-0 self-center" />
                      <span className="font-black">{hotkey.default_increment}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold opacity-90 uppercase tracking-tight ml-0.5">{hotkey.unit}</span>
                    </span>
                  </div>

                  {/* FULL-WIDTH NAME ROW: Single line, crisp, high legibility, truncate without vertical collision */}
                  <div
                    className={`w-full pl-0.5 text-xs sm:text-[12.5px] font-bold tracking-tight transition-colors truncate leading-tight ${
                      isDaylight ? 'text-[#334155]' : 'text-slate-100'
                    }`}
                    title={hotkey.name}
                  >
                    {hotkey.name}
                  </div>

                  {/* BOTTOM ROW: Numerator & Denominator Value Metric + Expand/Detail Chevron */}
                  <div className="flex items-center justify-between gap-1 w-full pl-0.5">
                    <div className="flex items-baseline gap-1 min-w-0">
                      <span className={`text-lg sm:text-xl font-black font-mono tracking-tight leading-none transition-colors ${
                        isGoalReached && !isNegative
                          ? 'text-emerald-500 font-bold'
                          : isDaylight
                          ? 'text-[#1E293B]'
                          : 'text-white'
                      }`}>
                        {totalVal}
                      </span>
                      {hotkey.daily_goal && !isNegative ? (
                        <span className={`text-[11px] sm:text-xs font-bold font-mono transition-colors truncate ${
                          isGoalReached
                            ? 'text-emerald-500 font-bold'
                            : isDaylight
                            ? 'text-[#64748B]'
                            : 'text-slate-300'
                        }`}>
                          /{hotkey.daily_goal} <span className={`text-[9.5px] sm:text-[10.5px] font-medium ${isDaylight ? 'text-[#94A3B8]' : 'text-slate-400'}`}>{hotkey.unit}</span>
                        </span>
                      ) : (
                        <span className={`text-[10.5px] sm:text-xs font-bold font-mono truncate ${isDaylight ? 'text-[#94A3B8]' : 'text-slate-400'}`}>
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
                      className={`shrink-0 p-0.5 sm:p-1 transition-colors cursor-pointer rounded-lg ml-auto ${
                        isDaylight
                          ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                          : 'text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
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
              className={`h-[110px] sm:h-[116px] rounded-2xl border border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center p-2 sm:p-2.5 space-y-1 group shadow-sm select-none ${
                isDaylight
                  ? 'border-slate-300 hover:border-orange-500/70 bg-white hover:bg-orange-50/50'
                  : 'border-slate-800 hover:border-orange-500/50 bg-slate-950/40 hover:bg-orange-950/10'
              }`}
            >
              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors ${
                isDaylight
                  ? 'bg-slate-100 group-hover:bg-orange-100 text-slate-500 group-hover:text-orange-600'
                  : 'bg-white/5 group-hover:bg-orange-500/20 text-slate-400 group-hover:text-orange-400'
              }`}>
                <Plus size={14} strokeWidth={2.5} />
              </div>
              <span className={`text-[11.5px] sm:text-xs font-bold transition-colors leading-tight ${
                isDaylight ? 'text-[#334155] group-hover:text-orange-600' : 'text-slate-200 group-hover:text-white'
              }`}>
                + Add Hotkey
              </span>
              <span className={`text-[9.5px] sm:text-[10px] font-medium tracking-tight ${
                isDaylight ? 'text-[#94A3B8]' : 'text-slate-400'
              }`}>Custom / Preset</span>
            </div>
          </div>
        ) : (
          <div className={`p-4 rounded-2xl border border-dashed text-center space-y-2 ${
            isDaylight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold">
              <Calendar size={14} className="text-orange-400" />
              <span>No Hotkeys Scheduled for {currentDayOfWeek}</span>
            </div>
            <p className={`text-[11px] max-w-sm mx-auto ${isDaylight ? 'text-slate-500' : 'text-slate-500'}`}>
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
        )
      )}

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
