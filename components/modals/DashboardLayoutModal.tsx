'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  SlidersHorizontal,
  Sun,
  Moon,
  Sparkles,
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
  Check
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
  BlocksLayoutMode,
  BlocksVisualStyle,
  BlocksCompletedPlacement
} from '@/components/blocks/blocksUtils'
import {
  useHomeWidgets,
  useFocusRules,
  HomeWidgetsConfig,
  FocusRulesConfig
} from '@/lib/utils/layoutSettings'
import { triggerHaptic } from '@/lib/utils/haptics'
import { UserProfile } from '@/lib/types'

interface DashboardLayoutModalProps {
  isOpen: boolean
  onClose: () => void
  userProfile?: UserProfile
  currentDisplayMode?: 'classic' | 'blocks'
  onDisplayModeChange?: (mode: 'classic' | 'blocks') => void
}

export default function DashboardLayoutModal({
  isOpen,
  onClose,
  userProfile,
  currentDisplayMode,
  onDisplayModeChange
}: DashboardLayoutModalProps) {
  const [mounted, setMounted] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { scale, setScale } = useTextScale()

  const [displayMode, setDisplayModeState] = useState<'classic' | 'blocks'>(() => {
    return currentDisplayMode || getStoredDisplayMode()
  })

  const [blockDensity, setBlockDensity] = useState<BlocksLayoutMode>(() => getStoredBlocksLayoutMode())
  const [showDosing, setShowDosingState] = useState<boolean>(() => getStoredBlocksShowDosing())
  const [completedPlacement, setCompletedPlacementState] = useState<BlocksCompletedPlacement>(() =>
    getStoredBlocksCompletedPlacement()
  )
  const [visualStyle, setVisualStyleState] = useState<BlocksVisualStyle>(() => getStoredVisualStyle())

  // Home Page Widgets & Focus Mode Rules
  const { widgets, toggleWidget } = useHomeWidgets(userProfile)
  const { rules, toggleRule } = useFocusRules(userProfile)

  // Configure Focus accordion collapsed by default as requested!
  const [isFocusSectionOpen, setIsFocusSectionOpen] = useState<boolean>(false)

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
          {/* 1. Theme & Core Display Mode */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Appearance &amp; Display
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Theme Toggle Pill */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection')
                  toggleTheme()
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-bold text-xs border transition-all cursor-pointer active:scale-95 shadow-sm ${
                  isLight
                    ? 'bg-amber-100/80 border-amber-300 text-amber-900 hover:bg-amber-100'
                    : 'bg-slate-900 hover:bg-slate-850 border-purple-500/30 text-purple-200'
                }`}
              >
                {isLight ? (
                  <>
                    <Sun size={15} className="text-amber-600 fill-amber-400/40" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon size={15} className="text-purple-300 fill-purple-400/30" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              {/* View Switcher: Blocks vs Classic */}
              <div
                className={`p-1 rounded-2xl border flex items-center gap-1 ${
                  isLight ? 'bg-slate-200/80 border-slate-300' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggleDisplayMode('classic')}
                  className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    displayMode === 'classic'
                      ? 'bg-purple-600 text-white shadow-md'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Classic
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleDisplayMode('blocks')}
                  className={`flex-1 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    displayMode === 'blocks'
                      ? 'bg-purple-600 text-white shadow-md'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles size={11} className={displayMode === 'blocks' ? 'text-amber-300' : ''} />
                  <span>Blocks</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Block Grid Density & Badges (Visible when in Blocks Mode) */}
          {displayMode === 'blocks' && (
            <div
              className={`p-3.5 rounded-2xl border space-y-3 ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Grid2X2 size={13} />
                  <span>Block Density</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Card Layout</span>
              </div>

              {/* 1-Wide, 2-Wide, 3-Wide Pills */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectBlockDensity('2-wide')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                    blockDensity === '2-wide' || blockDensity === 'uniform'
                      ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <Grid2X2 size={14} />
                  <span>2-Wide</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectBlockDensity('3-wide')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                    blockDensity === '3-wide'
                      ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <Grid3X3 size={14} />
                  <span>3-Wide</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectBlockDensity('1-wide')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                    blockDensity === '1-wide'
                      ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <Rows3 size={14} />
                  <span>1-Wide</span>
                </button>
              </div>

              {/* Secondary Block Options: Dosing Badges & Inline Completed */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={handleToggleDosing}
                  className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    showDosing
                      ? isLight
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : isLight
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-slate-800/50 text-slate-400 border-slate-700/50'
                  }`}
                >
                  <Pill size={12} className={showDosing ? 'text-emerald-400' : 'text-slate-400'} />
                  <span>Dose Badges: {showDosing ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleCompletedPlacement}
                  className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    completedPlacement === 'inline'
                      ? isLight
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                        : 'bg-indigo-950/70 text-indigo-300 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                      : isLight
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-slate-800/50 text-slate-400 border-slate-700/50'
                  }`}
                >
                  <CheckCircle2 size={12} className={completedPlacement === 'inline' ? 'text-indigo-400' : 'text-slate-400'} />
                  <span>Inline Done: {completedPlacement === 'inline' ? 'ON' : 'OFF'}</span>
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

              {/* Infradian Protocol Tracker */}
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
            </div>
          </div>

          {/* 5. Focus Mode Rules (COLLAPSED BY DEFAULT AS REQUESTED) */}
          <div
            className={`rounded-2xl border transition-all ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800/80'
            }`}
          >
            {/* Header Accordion Button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection')
                setIsFocusSectionOpen(!isFocusSectionOpen)
              }}
              className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <Zap size={14} />
                </div>
                <div>
                  <div className="text-xs font-bold flex items-center gap-2">
                    <span>Configure Focus Mode</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      Custom Rules
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Choose what stays visible when Focus Mode is activated
                  </p>
                </div>
              </div>

              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform duration-200 ${
                  isFocusSectionOpen ? 'rotate-180 text-emerald-400' : ''
                }`}
              />
            </button>

            {/* Collapsible Content */}
            {isFocusSectionOpen && (
              <div className="px-3.5 pb-3.5 pt-1 space-y-2 border-t border-slate-800/50 animate-in fade-in duration-150">
                {/* Rule: Hide completed tasks */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 cursor-pointer">
                  <div className="pr-2">
                    <div className="text-xs font-bold text-slate-200">Hide Completed Tasks</div>
                    <div className="text-[10px] text-slate-400">
                      Keep only pending, actionable modalities in view
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={rules.hideCompleted}
                    onChange={() => {
                      triggerHaptic('selection')
                      toggleRule('hideCompleted')
                    }}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500"
                  />
                </label>

                {/* Rule: Keep Quick-Log Hotkeys */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 cursor-pointer">
                  <div className="pr-2">
                    <div className="text-xs font-bold text-slate-200">Keep Quick Hotkeys Visible</div>
                    <div className="text-[10px] text-slate-400">
                      Allow fast water &amp; supplement logging during focus
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={rules.keepHotkeys}
                    onChange={() => {
                      triggerHaptic('selection')
                      toggleRule('keepHotkeys')
                    }}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500"
                  />
                </label>

                {/* Rule: Keep AI Protocol Coach */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 cursor-pointer">
                  <div className="pr-2">
                    <div className="text-xs font-bold text-slate-200">Keep AI Protocol Coach Visible</div>
                    <div className="text-[10px] text-slate-400">
                      Keep coach prompt input accessible for quick questions
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={rules.keepAICoach}
                    onChange={() => {
                      triggerHaptic('selection')
                      toggleRule('keepAICoach')
                    }}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500"
                  />
                </label>

                {/* Rule: Keep Sleep Triage */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 cursor-pointer">
                  <div className="pr-2">
                    <div className="text-xs font-bold text-slate-200">Keep Sleep Recovery Visible</div>
                    <div className="text-[10px] text-slate-400">
                      Display sleep triage guidance even in focus mode
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={rules.keepSleepTriage}
                    onChange={() => {
                      triggerHaptic('selection')
                      toggleRule('keepSleepTriage')
                    }}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500"
                  />
                </label>

                {/* Rule: Keep Longevity Tip */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 cursor-pointer">
                  <div className="pr-2">
                    <div className="text-xs font-bold text-slate-200">Keep Longevity Tip Visible</div>
                    <div className="text-[10px] text-slate-400">
                      Show daily spotlight advice during focus mode
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={rules.keepTip}
                    onChange={() => {
                      triggerHaptic('selection')
                      toggleRule('keepTip')
                    }}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500"
                  />
                </label>
              </div>
            )}
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
