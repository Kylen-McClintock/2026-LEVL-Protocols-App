'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  SlidersHorizontal,
  Sun,
  Moon,
  Sparkles,
  LayoutGrid,
  Grid2X2,
  Grid3X3,
  Rows3,
  Pill,
  CheckCircle2,
  ChevronDown,
  Zap,
  Bot,
  Lightbulb,
  MoonStar,
  Activity,
  CalendarDays,
  HeartPulse,
  Type,
  Eye,
  Check,
  Bookmark,
  Filter,
  Layers,
  ShieldCheck,
  Flame,
  Clock,
  Maximize2,
  Target
} from 'lucide-react'
import { useTheme } from '@/lib/utils/useTheme'
import {
  useTextScale,
  applyTextScale,
  TextScale,
  TEXT_SCALE_OPTIONS
} from '@/lib/utils/useTextScale'
import {
  getStoredDisplayMode,
  setStoredDisplayMode,
  getStoredBlocksLayoutMode,
  setStoredBlocksLayoutMode,
  getStoredBlocksShowDosing,
  setStoredBlocksShowDosing,
  getStoredBlocksCompletedPlacement,
  setStoredBlocksCompletedPlacement,
  getStoredVisualStyle,
  setStoredVisualStyle,
  getStoredLinkedModalities,
  setStoredLinkedModalities,
  BlocksLayoutMode,
  BlocksVisualStyle,
  BlocksCompletedPlacement
} from '@/components/blocks/blocksUtils'
import {
  useHomeWidgets,
  useCardBadges,
  useLayoutPreset,
  useTimeBlockHorizon,
  useNBAConfig,
  LayoutPreset,
  TimeBlockHorizonMode,
  NBAConfig,
  HomeWidgetsConfig,
  CardBadgesConfig
} from '@/lib/utils/layoutSettings'
import { DailyBandwidthMode } from '@/lib/adaptive/dailyBandwidthEngine'
import { triggerHaptic } from '@/lib/utils/haptics'
import { UserProfile } from '@/lib/types'

interface DashboardLayoutModalProps {
  isOpen: boolean
  onClose: () => void
  userProfile?: UserProfile
  currentDisplayMode?: 'classic' | 'blocks'
  onDisplayModeChange?: (mode: 'classic' | 'blocks') => void
  currentDate?: string
  isFocusMode?: boolean
  onToggleFocusMode?: () => void
}

export default function DashboardLayoutModal({
  isOpen,
  onClose,
  userProfile,
  currentDisplayMode,
  onDisplayModeChange,
  currentDate,
  isFocusMode = false,
  onToggleFocusMode
}: DashboardLayoutModalProps) {
  const [mounted, setMounted] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { scale, setScale } = useTextScale()

  const [displayMode, setDisplayModeState] = useState<'classic' | 'blocks'>(() => {
    return currentDisplayMode || getStoredDisplayMode()
  })

  const [blockDensity, setBlockDensity] = useState<BlocksLayoutMode>(() => getStoredBlocksLayoutMode())
  const [linkedModalities, setLinkedModalitiesState] = useState<boolean>(() => getStoredLinkedModalities())
  const [showDosing, setShowDosingState] = useState<boolean>(() => getStoredBlocksShowDosing())
  const [completedPlacement, setCompletedPlacementState] = useState<BlocksCompletedPlacement>(() =>
    getStoredBlocksCompletedPlacement()
  )
  const [visualStyle, setVisualStyleState] = useState<BlocksVisualStyle>(() => getStoredVisualStyle())

  // Home Page Widgets & Universal Card Badges
  const { widgets, toggleWidget } = useHomeWidgets(userProfile)
  const { badges, toggleBadge } = useCardBadges(userProfile)

  // Information Density Presets, Time Block Horizon & NBA Config
  const { preset, selectPreset } = useLayoutPreset(userProfile)
  const { horizon, updateHorizon } = useTimeBlockHorizon(isFocusMode, userProfile)
  const { nbaConfig, updateNBAConfig, toggleNBAEnabled } = useNBAConfig(userProfile)

  // Modality Capacity (Allostatic Load / Bandwidth Mode)
  const activeDateStr = currentDate || new Date().toISOString().slice(0, 10)
  const [bandwidthMode, setBandwidthMode] = useState<DailyBandwidthMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`levl_bandwidth_mode_${activeDateStr}`) as DailyBandwidthMode
      if (saved === 'survival_80_20' || saved === 'peak_surge') return saved
      if (localStorage.getItem(`levl_8020_protected_${activeDateStr}`) === 'true') return 'survival_80_20'
    }
    return 'standard'
  })

  useEffect(() => {
    const handleBandwidthChange = (e: any) => {
      if (e.detail?.date === activeDateStr || !e.detail?.date) {
        const mode = e.detail?.mode || (localStorage.getItem(`levl_bandwidth_mode_${activeDateStr}`) as DailyBandwidthMode) || 'standard'
        setBandwidthMode(mode)
      }
    }
    window.addEventListener('levl_bandwidth_mode_changed', handleBandwidthChange)
    return () => window.removeEventListener('levl_bandwidth_mode_changed', handleBandwidthChange)
  }, [activeDateStr])

  const handleSelectBandwidthMode = (mode: DailyBandwidthMode) => {
    triggerHaptic('selection')
    setBandwidthMode(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`levl_bandwidth_mode_${activeDateStr}`, mode)
      if (mode === 'survival_80_20') {
        localStorage.setItem(`levl_8020_protected_${activeDateStr}`, 'true')
        window.dispatchEvent(new CustomEvent('levl_adherence_shield_activated', { detail: { date: activeDateStr } }))
      } else {
        localStorage.setItem(`levl_8020_protected_${activeDateStr}`, 'false')
        window.dispatchEvent(new CustomEvent('levl_adherence_shield_deactivated', { detail: { date: activeDateStr } }))
      }
      window.dispatchEvent(new CustomEvent('levl_bandwidth_mode_changed', { detail: { date: activeDateStr, mode } }))
    }
  }

  const handleSelectPreset = (p: LayoutPreset) => {
    triggerHaptic('selection')
    selectPreset(p)
    if (p === 'focus') {
      if (!isFocusMode && onToggleFocusMode) {
        onToggleFocusMode()
      }
    } else {
      if (isFocusMode && onToggleFocusMode) {
        onToggleFocusMode()
      }
    }
  }

  // Infradian & Period Cycle tracking option strictly shows for females under 52
  const isFemaleEligible =
    userProfile?.biological_sex?.toLowerCase() === 'female' &&
    Boolean(userProfile?.age && userProfile.age < 52)


  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (currentDisplayMode) {
      setDisplayModeState(currentDisplayMode)
    }
  }, [currentDisplayMode])

  useEffect(() => {
    if (isOpen) {
      // Re-hydrate local values on modal open
      setDisplayModeState(currentDisplayMode || getStoredDisplayMode())
      setBlockDensity(getStoredBlocksLayoutMode())
      setLinkedModalitiesState(getStoredLinkedModalities())
      setShowDosingState(getStoredBlocksShowDosing())
      setCompletedPlacementState(getStoredBlocksCompletedPlacement())
      setVisualStyleState(getStoredVisualStyle())
    }
  }, [isOpen, currentDisplayMode])

  if (!isOpen || !mounted) return null

  const handleToggleDisplayMode = (mode: 'classic' | 'blocks') => {
    triggerHaptic('selection')
    setDisplayModeState(mode)
    setStoredDisplayMode(mode)
    onDisplayModeChange?.(mode)
  }

  const handleSelectBlockDensity = (mode: BlocksLayoutMode) => {
    triggerHaptic('selection')
    setBlockDensity(mode)
    setStoredBlocksLayoutMode(mode)
  }

  const handleToggleLinkedModalities = () => {
    triggerHaptic('selection')
    const next = !linkedModalities
    setLinkedModalitiesState(next)
    setStoredLinkedModalities(next)
  }

  const handleToggleDosing = () => {
    triggerHaptic('selection')
    const next = !showDosing
    setShowDosingState(next)
    setStoredBlocksShowDosing(next)
  }

  const handleToggleCompletedPlacement = () => {
    triggerHaptic('selection')
    const next: BlocksCompletedPlacement = completedPlacement === 'inline' ? 'section' : 'inline'
    setCompletedPlacementState(next)
    setStoredBlocksCompletedPlacement(next)
  }

  const handleSelectVisualStyle = (style: BlocksVisualStyle) => {
    triggerHaptic('selection')
    setVisualStyleState(style)
    setStoredVisualStyle(style)
    if (style === 'light-glass') {
      if (theme !== 'light') toggleTheme()
    } else if (style === 'dark-outline' || style === 'full-gradient') {
      if (theme !== 'dark') toggleTheme()
    }
  }

  const handleSelectScale = (newScale: TextScale) => {
    triggerHaptic('selection')
    setScale(newScale)
    applyTextScale(newScale)
  }

  const isLight = theme === 'light'

  const modalContent = (
    <div className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Main Drawer / Modal Card */}
      <div
        className={`relative w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col rounded-t-[28px] sm:rounded-3xl border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-900 shadow-slate-900/20'
            : 'bg-slate-950/95 border-slate-800 text-slate-100 shadow-[0_25px_70px_rgba(0,0,0,0.9)]'
        }`}
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-slate-600/40" />
        </div>

        {/* Modal Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
            isLight ? 'bg-white/80 border-slate-200' : 'bg-slate-900/80 border-slate-800/80'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <SlidersHorizontal size={17} />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Dashboard &amp; Layout</h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Theme, view density, text size &amp; widgets
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-all cursor-pointer border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/80'
            }`}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* 1. Information Density & Layout Presets */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Target size={13} />
                <span>Information Density Presets</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Layout Profile</span>
            </div>

            {/* 3-Stop Preset Switcher */}
            <div
              className={`p-1.5 rounded-2xl border flex items-center gap-1.5 ${
                isLight ? 'bg-slate-200/80 border-slate-300' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => handleSelectPreset('focus')}
                className={`flex-1 py-2 px-1 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  preset === 'focus'
                    ? 'bg-purple-600 text-white shadow-md'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap size={13} className={preset === 'focus' ? 'text-amber-300 fill-amber-300' : ''} />
                <span>Focus Mode</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('daily')}
                className={`flex-1 py-2 px-1 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  preset === 'daily'
                    ? 'bg-purple-600 text-white shadow-md'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sun size={13} className={preset === 'daily' ? 'text-amber-300' : ''} />
                <span>Daily Mode</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('biohacker')}
                className={`flex-1 py-2 px-1 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  preset === 'biohacker'
                    ? 'bg-purple-600 text-white shadow-md'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles size={13} className={preset === 'biohacker' ? 'text-cyan-300' : ''} />
                <span>Biohacker Mode</span>
              </button>
            </div>

            {/* Dynamic 1-line explanation */}
            <div
              className={`p-2.5 rounded-xl border text-[11px] leading-relaxed transition-all ${
                preset === 'focus'
                  ? isLight
                    ? 'bg-amber-50 border-amber-300/80 text-amber-950'
                    : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  : preset === 'daily'
                  ? isLight
                    ? 'bg-purple-50 border-purple-200 text-purple-950'
                    : 'bg-purple-950/30 border-purple-500/40 text-purple-200'
                  : isLight
                  ? 'bg-cyan-50 border-cyan-300/80 text-cyan-950'
                  : 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
              }`}
            >
              <p>
                <span className="font-bold">
                  {preset === 'focus' ? 'Focus Mode: ' : preset === 'daily' ? 'Daily Mode: ' : 'Biohacker Mode: '}
                </span>
                {preset === 'focus'
                  ? 'Customizing layout appearance and information density for Focus mode: single active time block, essential telemetry & zero clutter.'
                  : preset === 'daily'
                  ? 'Customizing layout appearance and information density for Daily mode: balanced circadian rhythm, standard badges & daily widgets.'
                  : 'Customizing layout appearance and information density for Biohacker mode: maximum data density, full clinical telemetry & all widgets.'}
              </p>
            </div>
          </div>

          {/* 2. Modality Capacity & Strain (Allostatic Load) */}
          <div
            className={`p-3.5 rounded-2xl border space-y-3 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Activity size={13} />
                  <span>Modality Capacity (Allostatic Load)</span>
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Protocol strain level calibrated by morning check-in &amp; manual toggle
                </p>
              </div>
            </div>

            {/* 3-Stop Toggle: Survival | Daily | Peak */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectBandwidthMode('survival_80_20')}
                className={`py-2 px-1.5 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                  bandwidthMode === 'survival_80_20'
                    ? 'bg-amber-600 border-amber-400 text-white shadow-md'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <ShieldCheck size={14} className={bandwidthMode === 'survival_80_20' ? 'text-amber-200' : 'text-amber-500'} />
                <span>Survival Mode</span>
                <span className={`text-[9px] font-mono ${bandwidthMode === 'survival_80_20' ? 'text-amber-100' : 'text-slate-400'}`}>80/20 Cuts</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectBandwidthMode('standard')}
                className={`py-2 px-1.5 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                  bandwidthMode === 'standard'
                    ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <Activity size={14} className={bandwidthMode === 'standard' ? 'text-purple-200' : 'text-purple-400'} />
                <span>Daily Mode</span>
                <span className={`text-[9px] font-mono ${bandwidthMode === 'standard' ? 'text-purple-100' : 'text-slate-400'}`}>Standard Stack</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectBandwidthMode('peak_surge')}
                className={`py-2 px-1.5 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                  bandwidthMode === 'peak_surge'
                    ? 'bg-rose-600 border-rose-400 text-white shadow-md'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <Flame size={14} className={bandwidthMode === 'peak_surge' ? 'text-rose-200' : 'text-rose-500'} />
                <span>Peak Mode</span>
                <span className={`text-[9px] font-mono ${bandwidthMode === 'peak_surge' ? 'text-rose-100' : 'text-slate-400'}`}>Adaptation Surge</span>
              </button>
            </div>

            {/* Capacity Mode Explanation */}
            <div
              className={`p-2.5 rounded-xl border text-[11px] leading-relaxed transition-all ${
                bandwidthMode === 'survival_80_20'
                  ? isLight
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  : bandwidthMode === 'peak_surge'
                  ? isLight
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  : isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-slate-800/40 border-slate-700 text-slate-300'
              }`}
            >
              <p>
                {bandwidthMode === 'survival_80_20' && (
                  <span><strong>Survival Mode (80/20):</strong> Compresses daily stack to minimum effective dose. High-strain resistance training and cold plunges are paused while essential anchors remain protected.</span>
                )}
                {bandwidthMode === 'standard' && (
                  <span><strong>Daily Mode:</strong> Baseline standard scheduled protocol stack calibrated for sustainable longevity.</span>
                )}
                {bandwidthMode === 'peak_surge' && (
                  <span><strong>Peak Mode:</strong> Maximum adaptation surge enabled for high-readiness days. High-capacity training and progressive overload modalities unlocked.</span>
                )}
              </p>
            </div>
          </div>

          {/* 3. Circadian Time Block Horizon */}
          <div
            className={`p-3.5 rounded-2xl border space-y-3 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Clock size={13} />
                  <span>Circadian Time Block Horizon</span>
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Controls which time blocks stay open vs collapsed across the day
                </p>
              </div>
            </div>

            {/* 3-Stop Switcher: Current Only | Collapse Past | Fully Open */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection')
                  updateHorizon('current_only')
                }}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                  horizon === 'current_only'
                    ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <Clock size={14} />
                <span>Current Only</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection')
                  updateHorizon('collapse_past')
                }}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                  horizon === 'collapse_past'
                    ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <Rows3 size={14} />
                <span>Collapse Past</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection')
                  updateHorizon('fully_open')
                }}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                  horizon === 'fully_open'
                    ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <Maximize2 size={14} />
                <span>Fully Open</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-400">
              {horizon === 'current_only' && 'Only your currently active time block is expanded; past and upcoming blocks are collapsed.'}
              {horizon === 'collapse_past' && 'Default: past blocks are grouped in the catch-up drawer, while current and future blocks remain open.'}
              {horizon === 'fully_open' && 'All 24-hour time blocks remain fully expanded simultaneously with all modalities visible.'}
            </p>
          </div>

          {/* 4. Theme & Core Display Mode */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Appearance &amp; Display
              </span>
            </div>

            {/* Theme Toggle Switch Row */}
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    isLight
                      ? 'bg-amber-100 text-amber-600 shadow-sm'
                      : 'bg-purple-950/70 border border-purple-500/30 text-purple-300'
                  }`}
                >
                  {isLight ? <Sun size={16} className="fill-amber-400/40" /> : <Moon size={16} className="fill-purple-400/30" />}
                </div>
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>{isLight ? 'Light Mode' : 'Dark Mode'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {isLight ? 'Crisp daylight contrast' : 'OLED low-glare dark aesthetic'}
                  </p>
                </div>
              </div>

              {/* Interactive iOS-style Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={!isLight}
                aria-label="Toggle dark/light theme"
                onClick={() => {
                  triggerHaptic('selection')
                  toggleTheme()
                }}
                className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer relative flex items-center shadow-inner ${
                  isLight ? 'bg-slate-300 hover:bg-slate-400/80' : 'bg-purple-600 hover:bg-purple-500 shadow-[0_0_12px_rgba(147,51,234,0.4)]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 flex items-center justify-center ${
                    isLight ? 'translate-x-0 text-amber-500' : 'translate-x-5 text-purple-600'
                  }`}
                >
                  {isLight ? <Sun size={11} /> : <Moon size={11} />}
                </span>
              </button>
            </div>

            {/* View Switcher: Blocks vs Classic */}
            <div
              className={`p-1.5 rounded-2xl border flex items-center gap-1.5 ${
                isLight ? 'bg-slate-200/80 border-slate-300' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => handleToggleDisplayMode('classic')}
                className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  displayMode === 'classic'
                    ? 'bg-purple-600 text-white shadow-md'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Classic Mode
              </button>
              <button
                type="button"
                onClick={() => handleToggleDisplayMode('blocks')}
                className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  displayMode === 'blocks'
                    ? 'bg-purple-600 text-white shadow-md'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles size={12} className={displayMode === 'blocks' ? 'text-amber-300' : ''} />
                <span>Blocks Mode</span>
              </button>
            </div>
          </div>

          {/* 2. Block Grid Density & Aesthetic (Visible in Blocks Mode) */}
          {displayMode === 'blocks' && (
            <div
              className={`p-3.5 rounded-2xl border space-y-3 ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Grid2X2 size={13} />
                  <span>Block Grid Density</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Card Width</span>
              </div>

              {/* Dynamic, 2-Wide, 3-Wide, Streamline Pills */}
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectBlockDensity('dynamic')}
                  className={`py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                    blockDensity === 'dynamic'
                      ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <LayoutGrid size={14} />
                  <span className="whitespace-nowrap">Dynamic</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectBlockDensity('2-wide')}
                  className={`py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                    blockDensity === '2-wide' || blockDensity === 'uniform'
                      ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <Grid2X2 size={14} />
                  <span className="whitespace-nowrap">2-Wide</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectBlockDensity('3-wide')}
                  className={`py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                    blockDensity === '3-wide'
                      ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <Grid3X3 size={14} />
                  <span className="whitespace-nowrap">3-Wide</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectBlockDensity('streamline')}
                  className={`py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                    blockDensity === 'streamline' || blockDensity === '1-wide'
                      ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <Zap size={14} />
                  <span className="whitespace-nowrap">Streamline</span>
                </button>
              </div>

              {/* Linked Modalities Mode Toggle */}
              <div className="pt-2 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={handleToggleLinkedModalities}
                  className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                    linkedModalities
                      ? isLight
                        ? 'bg-purple-50 border-purple-300 text-purple-950'
                        : 'bg-purple-950/40 border-purple-500/50 text-purple-200'
                      : isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-500'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      linkedModalities ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700/40 text-slate-500'
                    }`}>
                      <Layers size={13} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold">Linked Modalities &amp; Node Rails</div>
                      <div className="text-[10px] text-slate-400 truncate">Connect sequential &amp; during modalities with interactive nodes</div>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                      linkedModalities
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {linkedModalities ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              {/* Visual Style Selector */}
              <div className="pt-1 border-t border-slate-800/40">
                <div className="flex items-center justify-between pb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Block Card Aesthetic
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {(['full-gradient', 'dark-outline', 'light-glass'] as BlocksVisualStyle[]).map((styleOpt) => {
                    const label = styleOpt === 'full-gradient' ? 'Gradient' : styleOpt === 'dark-outline' ? 'Dark Neon' : 'Glass'
                    const active = visualStyle === styleOpt
                    return (
                      <button
                        key={styleOpt}
                        type="button"
                        onClick={() => handleSelectVisualStyle(styleOpt)}
                        className={`py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                          active
                            ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                            : isLight
                            ? 'bg-slate-100 border-slate-200 text-slate-600'
                            : 'bg-slate-800/50 border-slate-700 text-slate-400'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. Card Details & Badges (Visible for Both Classic & Blocks) */}
          <div
            className={`p-3.5 rounded-2xl border space-y-3 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Bookmark size={13} />
                  <span>Card Details &amp; Badges</span>
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Visible badges across Classic &amp; Blocks view
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              {/* 1. Target Dose Badges */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection')
                  toggleBadge('showDosing')
                }}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  badges.showDosing
                    ? isLight
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                    : isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-500'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      badges.showDosing
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700/40 text-slate-500'
                    }`}
                  >
                    <Pill size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Dose &amp; Parameters</div>
                    <div className="text-[10px] text-slate-400 truncate">Target dosage, temperature, duration &amp; reps</div>
                  </div>
                </div>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                    badges.showDosing
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {badges.showDosing ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* 2. Completed Modalities Inline */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection')
                  toggleBadge('showCompletedInline')
                }}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  badges.showCompletedInline
                    ? isLight
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-950'
                      : 'bg-indigo-950/50 border-indigo-500/50 text-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.15)]'
                    : isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-500'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      badges.showCompletedInline
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'bg-slate-700/40 text-slate-500'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Completed Inline</div>
                    <div className="text-[10px] text-slate-400 truncate">Keep completed tasks in scheduled time blocks</div>
                  </div>
                </div>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                    badges.showCompletedInline
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {badges.showCompletedInline ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* 3. Protocol Lineage Attribution */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection')
                  toggleBadge('showProtocol')
                }}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  badges.showProtocol
                    ? isLight
                      ? 'bg-purple-50 border-purple-300 text-purple-950'
                      : 'bg-purple-950/50 border-purple-500/50 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                    : isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-500'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      badges.showProtocol
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-slate-700/40 text-slate-500'
                    }`}
                  >
                    <Bookmark size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Protocol Attribution</div>
                    <div className="text-[10px] text-slate-400 truncate">Show parent protocol badge (e.g. Blueprint, Attia)</div>
                  </div>
                </div>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                    badges.showProtocol
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {badges.showProtocol ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* 4. Synergies & Nutrient Pairings */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection')
                  toggleBadge('showSynergies')
                }}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  badges.showSynergies
                    ? isLight
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-amber-950/50 border-amber-500/50 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                    : isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-500'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      badges.showSynergies
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-700/40 text-slate-500'
                    }`}
                  >
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Synergies &amp; Pairings</div>
                    <div className="text-[10px] text-slate-400 truncate">Biochemical pairings, cofactors &amp; meal timing</div>
                  </div>
                </div>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                    badges.showSynergies
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {badges.showSynergies ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* 5. Modality Category Tags */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection')
                  toggleBadge('showCategory')
                }}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  badges.showCategory
                    ? isLight
                      ? 'bg-cyan-50 border-cyan-300 text-cyan-950'
                      : 'bg-cyan-950/50 border-cyan-500/50 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                    : isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-500'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      badges.showCategory
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-slate-700/40 text-slate-500'
                    }`}
                  >
                    <Activity size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Category Tags</div>
                    <div className="text-[10px] text-slate-400 truncate">Modality tags (Supplements, Thermal, Cardio)</div>
                  </div>
                </div>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                    badges.showCategory
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {badges.showCategory ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>

          {/* 3. Typography Scale (Direct Without Preview Box) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Type size={13} />
                <span>Text Size</span>
              </span>
              <span className="text-[10px] text-purple-400 font-mono font-bold">
                {TEXT_SCALE_OPTIONS.find((o) => o.id === scale)?.percentage || '100%'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {TEXT_SCALE_OPTIONS.map((opt) => {
                const isSelected = scale === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectScale(opt.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                      isSelected
                        ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                        : isLight
                        ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                        : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div>{opt.label}</div>
                    <div className={`text-[10px] font-mono ${isSelected ? 'text-purple-200' : 'text-slate-500'}`}>
                      {opt.percentage}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 4. Home Page Additions (Super Slick Glow Pills) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Home Page Additions
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tap to light up and enable views on your dashboard
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* AI Protocol Coach */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection')
                  toggleWidget('aiCoach')
                }}
                className={`p-2.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer active:scale-98 ${
                  widgets.aiCoach
                    ? 'bg-purple-950/70 border-purple-500/70 text-purple-100 shadow-[0_0_14px_rgba(168,85,247,0.35)]'
                    : isLight
                    ? 'bg-slate-100/90 border-slate-200 text-slate-500'
                    : 'bg-slate-900/50 border-slate-800/80 text-slate-400 opacity-60 hover:opacity-80'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    widgets.aiCoach
                      ? 'bg-purple-500/30 text-purple-300 shadow-inner'
                      : 'bg-slate-800/60 text-slate-500'
                  }`}
                >
                  <Bot size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>AI Protocol Coach</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                        widgets.aiCoach
                          ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {widgets.aiCoach ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">Smart protocol assistant &amp; queries</p>
                </div>
              </button>

              {/* Longevity Daily Tip */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection')
                  toggleWidget('longevityTip')
                }}
                className={`p-2.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer active:scale-98 ${
                  widgets.longevityTip
                    ? 'bg-amber-950/70 border-amber-500/70 text-amber-100 shadow-[0_0_14px_rgba(245,158,11,0.35)]'
                    : isLight
                    ? 'bg-slate-100/90 border-slate-200 text-slate-500'
                    : 'bg-slate-900/50 border-slate-800/80 text-slate-400 opacity-60 hover:opacity-80'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    widgets.longevityTip
                      ? 'bg-amber-500/30 text-amber-300 shadow-inner'
                      : 'bg-slate-800/60 text-slate-500'
                  }`}
                >
                  <Lightbulb size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Longevity Tip</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                        widgets.longevityTip
                          ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {widgets.longevityTip ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">Daily high-yield biohack spotlight</p>
                </div>
              </button>

              {/* Quick-Log Hotkeys */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection')
                  toggleWidget('quickHotkeys')
                }}
                className={`p-2.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer active:scale-98 ${
                  widgets.quickHotkeys
                    ? 'bg-emerald-950/70 border-emerald-500/70 text-emerald-100 shadow-[0_0_14px_rgba(16,185,129,0.35)]'
                    : isLight
                    ? 'bg-slate-100/90 border-slate-200 text-slate-500'
                    : 'bg-slate-900/50 border-slate-800/80 text-slate-400 opacity-60 hover:opacity-80'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    widgets.quickHotkeys
                      ? 'bg-emerald-500/30 text-emerald-300 shadow-inner'
                      : 'bg-slate-800/60 text-slate-500'
                  }`}
                >
                  <Zap size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Quick-Log Hotkeys</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                        widgets.quickHotkeys
                          ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {widgets.quickHotkeys ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">One-tap water &amp; supplement dock</p>
                </div>
              </button>

              {/* Sleep Triage & Circadian */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection')
                  toggleWidget('sleepTriage')
                }}
                className={`p-2.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer active:scale-98 ${
                  widgets.sleepTriage
                    ? 'bg-indigo-950/70 border-indigo-500/70 text-indigo-100 shadow-[0_0_14px_rgba(99,102,241,0.35)]'
                    : isLight
                    ? 'bg-slate-100/90 border-slate-200 text-slate-500'
                    : 'bg-slate-900/50 border-slate-800/80 text-slate-400 opacity-60 hover:opacity-80'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    widgets.sleepTriage
                      ? 'bg-indigo-500/30 text-indigo-300 shadow-inner'
                      : 'bg-slate-800/60 text-slate-500'
                  }`}
                >
                  <MoonStar size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Sleep &amp; Circadian</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                        widgets.sleepTriage
                          ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {widgets.sleepTriage ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">Adaptive sleep debt &amp; windows</p>
                </div>
              </button>

              {/* Infradian Protocol Tracker (Strictly for Female Users < 52) */}
              {isFemaleEligible && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection')
                    toggleWidget('infradian')
                  }}
                  className={`p-2.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer active:scale-98 ${
                    widgets.infradian
                      ? 'bg-rose-950/70 border-rose-500/70 text-rose-100 shadow-[0_0_14px_rgba(244,63,94,0.35)]'
                      : isLight
                      ? 'bg-slate-100/90 border-slate-200 text-slate-500'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-400 opacity-60 hover:opacity-80'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      widgets.infradian
                        ? 'bg-rose-500/30 text-rose-300 shadow-inner'
                        : 'bg-slate-800/60 text-slate-500'
                    }`}
                  >
                    <CalendarDays size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>Infradian Cycle</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                          widgets.infradian
                            ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {widgets.infradian ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">Hormonal cycle protocol phasing</p>
                  </div>
                </button>
              )}

              {/* Daily Wellbeing Check-in */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection')
                  toggleWidget('wellbeing')
                }}
                className={`p-2.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer active:scale-98 ${
                  widgets.wellbeing
                    ? 'bg-teal-950/70 border-teal-500/70 text-teal-100 shadow-[0_0_14px_rgba(20,184,166,0.35)]'
                    : isLight
                    ? 'bg-slate-100/90 border-slate-200 text-slate-500'
                    : 'bg-slate-900/50 border-slate-800/80 text-slate-400 opacity-60 hover:opacity-80'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    widgets.wellbeing
                      ? 'bg-teal-500/30 text-teal-300 shadow-inner'
                      : 'bg-slate-800/60 text-slate-500'
                  }`}
                >
                  <HeartPulse size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Wellbeing Check-in</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                        widgets.wellbeing
                          ? 'bg-teal-500/30 text-teal-200 border border-teal-400/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {widgets.wellbeing ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">Morning &amp; daytime readiness log</p>
                </div>
              </button>

              {/* Category & Outcome Filters */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection')
                  toggleWidget('categoryFilters')
                }}
                className={`p-2.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer active:scale-98 ${
                  widgets.categoryFilters
                    ? 'bg-cyan-950/70 border-cyan-500/70 text-cyan-100 shadow-[0_0_14px_rgba(6,182,212,0.35)]'
                    : isLight
                    ? 'bg-slate-100/90 border-slate-200 text-slate-500'
                    : 'bg-slate-900/50 border-slate-800/80 text-slate-400 opacity-60 hover:opacity-80'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    widgets.categoryFilters
                      ? 'bg-cyan-500/30 text-cyan-300 shadow-inner'
                      : 'bg-slate-800/60 text-slate-500'
                  }`}
                >
                  <Filter size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Category Filters</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                        widgets.categoryFilters
                          ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {widgets.categoryFilters ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">Top category &amp; outcome filter bar</p>
                </div>
              </button>
            </div>

            {/* Next Best Action (NBA) Settings */}
            <div
              className={`p-3.5 rounded-2xl border space-y-3 transition-all ${
                nbaConfig.enabled
                  ? isLight
                    ? 'bg-purple-50/50 border-purple-200 shadow-sm'
                    : 'bg-purple-950/20 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                  : isLight
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-slate-900/40 border-slate-800/80'
              }`}
            >
              {/* Header with iOS Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 pr-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      nbaConfig.enabled
                        ? 'bg-purple-500/30 text-purple-300 shadow-inner border border-purple-400/40'
                        : 'bg-slate-800/60 text-slate-500 border border-slate-700/50'
                    }`}
                  >
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-2">
                      <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>Next Best Action (NBA)</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold uppercase ${
                          nbaConfig.enabled
                            ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {nbaConfig.enabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Adaptive 80/20 recommendations docked at the bottom of your feed
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={nbaConfig.enabled}
                  aria-label="Toggle Next Best Action"
                  onClick={() => {
                    triggerHaptic('selection')
                    toggleNBAEnabled()
                  }}
                  className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer relative flex items-center shadow-inner shrink-0 ${
                    nbaConfig.enabled
                      ? 'bg-purple-600 hover:bg-purple-500 shadow-[0_0_12px_rgba(147,51,234,0.4)]'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 flex items-center justify-center ${
                      nbaConfig.enabled ? 'translate-x-5 text-purple-600' : 'translate-x-0 text-slate-400'
                    }`}
                  >
                    {nbaConfig.enabled ? <Check size={11} strokeWidth={3} /> : <X size={11} />}
                  </span>
                </button>
              </div>

              {/* 4-Stop Appearance Frequency Slider (Visible strictly when ON) */}
              {nbaConfig.enabled && (
                <div
                  className={`pt-2.5 border-t space-y-2 animate-in fade-in duration-200 ${
                    isLight ? 'border-purple-200/60' : 'border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Appearance Threshold
                    </span>
                    <span className="text-[10px] text-purple-400 font-mono font-bold">
                      {nbaConfig.threshold === 0 ? 'Always Visible' : `At ≥${nbaConfig.threshold}% Complete`}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {([
                      { val: 0, label: 'Always' },
                      { val: 50, label: '50% Done' },
                      { val: 75, label: '75% Done' },
                      { val: 100, label: '100% Done' }
                    ] as const).map(stop => {
                      const isSelected = nbaConfig.threshold === stop.val
                      return (
                        <button
                          key={stop.val}
                          type="button"
                          onClick={() => {
                            triggerHaptic('selection')
                            updateNBAConfig({ threshold: stop.val })
                          }}
                          className={`py-2 px-1 rounded-xl text-center font-bold text-[11px] transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                              : isLight
                              ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                              : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          <div>{stop.label}</div>
                        </button>
                      )
                    })}
                  </div>

                  <p className="text-[10px] text-slate-400">
                    {nbaConfig.threshold === 0 && 'Docked NBA recommendation banner is always visible at the bottom of your feed.'}
                    {nbaConfig.threshold === 50 && 'NBA banner unlocks once you have completed 50% of today’s protocol stack.'}
                    {nbaConfig.threshold === 75 && 'Default: NBA banner unlocks once you have completed 75% of your scheduled protocol.'}
                    {nbaConfig.threshold === 100 && 'NBA banner only appears as a congratulatory wrap-up once all tasks are completed.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`p-4 border-t flex items-center justify-end shrink-0 ${
            isLight ? 'bg-white/80 border-slate-200' : 'bg-slate-900/80 border-slate-800/80'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer shadow-md hover:shadow-purple-500/25 active:scale-95 text-center"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
