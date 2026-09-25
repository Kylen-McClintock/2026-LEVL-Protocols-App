'use client'

import React, { useState, useRef } from 'react'
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
  Wine,
  Cigarette,
  Leaf,
  Cookie,
  Smartphone,
  Sparkles,
  Utensils,
  Sliders,
  Check,
  GripHorizontal
} from 'lucide-react'
import { QuickHotkeyConfig, DailyQuickLogEntry } from '@/lib/types'
import { triggerHaptic } from '@/lib/utils/haptics'
import { BlocksVisualStyle, BlockSizing, BlocksLayoutMode, getGridClassesForSizing } from './blocksUtils'
import { getHotkeyVisualTheme } from '@/components/quicklog/QuickHotkeyGrid'
import ModalityIcon from '@/components/ui/ModalityIcon'
import { useBlocksDrag } from './BlocksDragContext'
import { useTheme } from '@/lib/utils/useTheme'

interface HotkeySquareTileProps {
  hotkey: QuickHotkeyConfig
  logs: DailyQuickLogEntry[]
  visualStyle: BlocksVisualStyle
  currentSlotKey?: string
  isEditMode?: boolean
  isIgnited?: boolean
  sizing?: BlockSizing
  layoutMode?: BlocksLayoutMode
  onQuickLog: (hotkey: QuickHotkeyConfig) => void
  onOpenDetails: (hotkey: QuickHotkeyConfig) => void
  onMoveHotkey?: (hotkeyId: string, targetSlotKey: string) => void
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
  Activity,
  Wine,
  Cigarette,
  Leaf,
  Cookie,
  Smartphone,
  Sparkles,
  Utensils
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: 'rgba(5, 223, 114, 0.18)', text: '#05DF72', border: 'rgba(5, 223, 114, 0.85)' },
  cyan: { bg: 'rgba(6, 182, 212, 0.18)', text: '#22D3EE', border: 'rgba(6, 182, 212, 0.85)' },
  amber: { bg: 'rgba(245, 158, 11, 0.18)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.85)' },
  indigo: { bg: 'rgba(99, 102, 241, 0.18)', text: '#818CF8', border: 'rgba(99, 102, 241, 0.85)' },
  rose: { bg: 'rgba(239, 68, 68, 0.18)', text: '#F87171', border: 'rgba(239, 68, 68, 0.85)' },
  purple: { bg: 'rgba(168, 85, 247, 0.18)', text: '#C084FC', border: 'rgba(168, 85, 247, 0.85)' },
  blue: { bg: 'rgba(59, 130, 246, 0.18)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.85)' },
  orange: { bg: 'rgba(239, 68, 68, 0.18)', text: '#F87171', border: 'rgba(239, 68, 68, 0.85)' },
  slate: { bg: 'rgba(148, 163, 184, 0.18)', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.85)' },
  sky: { bg: 'rgba(14, 165, 233, 0.18)', text: '#38BDF8', border: 'rgba(14, 165, 233, 0.85)' }
}

export default function HotkeySquareTile({
  hotkey,
  logs,
  visualStyle,
  currentSlotKey,
  isEditMode = false,
  isIgnited = true,
  sizing,
  layoutMode = 'dynamic',
  onQuickLog,
  onOpenDetails,
  onMoveHotkey
}: HotkeySquareTileProps) {
  const { theme } = useTheme()
  const isDaylight = theme === 'light' || visualStyle === 'light-glass'
  const { colSpanClass, heightClass } = getGridClassesForSizing(sizing || { width: '1/3', height: '1x' }, layoutMode)
  const [isJustTapped, setIsJustTapped] = useState(false)

  const Icon = ICON_MAP[hotkey.icon] || Zap
  const hotkeyLogs = logs.filter((l) => l.hotkey_id === hotkey.id)
  const totalVal = hotkeyLogs.reduce((acc, l) => acc + l.value, 0)
  const count = hotkeyLogs.length
  const isGoalReached = hotkey.daily_goal && !hotkey.is_negative ? totalVal >= hotkey.daily_goal : false
  const progressPct = hotkey.daily_goal && !hotkey.is_negative
    ? Math.min(100, Math.max(0, Math.round((totalVal / hotkey.daily_goal) * 100)))
    : totalVal > 0 ? 100 : 0
  const hTheme = getHotkeyVisualTheme(hotkey)

  // Tap handler: Quick log with instant haptic and micro-bounce
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    triggerHaptic('light')
    setIsJustTapped(true)
    setTimeout(() => setIsJustTapped(false), 700)
    onQuickLog(hotkey)
  }

  let dragCtx: any = null
  try {
    dragCtx = useBlocksDrag()
  } catch {
    dragCtx = null
  }

  const dragItem = React.useMemo(() => ({
    id: hotkey.id,
    type: 'hotkey' as const,
    title: hotkey.name,
    sourceSlotKey: currentSlotKey
  }), [hotkey.id, hotkey.name, currentSlotKey])

  const dragHandlers = React.useMemo(() => {
    if (!dragCtx || isEditMode) return null
    return dragCtx.bindDraggable(dragItem, {
      onClick: () => {
        triggerHaptic('light')
        setIsJustTapped(true)
        setTimeout(() => setIsJustTapped(false), 700)
        onQuickLog(hotkey)
      }
    })
  }, [dragCtx, isEditMode, dragItem, onQuickLog, hotkey])

  const isCurrentDragged = dragCtx?.activeDrag?.id === hotkey.id
  const isReorderTarget = Boolean(
    dragCtx?.activeDrag &&
    dragCtx.hoveredSlotKey === currentSlotKey &&
    dragCtx.hoveredTaskId === hotkey.id &&
    dragCtx.activeDrag.id !== hotkey.id
  )

  const isOneWide = layoutMode === '1-wide'

  return (
    <div
      data-task-id={hotkey.id}
      draggable={false}
      onMouseDown={dragHandlers?.onMouseDown}
      onTouchStart={dragHandlers?.onTouchStart}
      onTouchMove={dragHandlers?.onTouchMove}
      onTouchEnd={dragHandlers?.onTouchEnd}
      onTouchCancel={dragHandlers?.onTouchCancel}
      onClick={handleClick}
      onContextMenu={(e) => {
        e.preventDefault()
        onOpenDetails(hotkey)
      }}
      className={`${colSpanClass} ${heightClass} rounded-2xl sm:rounded-3xl ${
        isOneWide ? 'px-3 sm:px-4 py-2 flex flex-row items-center justify-between' : 'p-3 sm:p-3.5 flex flex-col justify-between'
      } transition-all duration-500 select-none cursor-pointer relative group overflow-hidden shadow-lg ${
        isCurrentDragged ? 'opacity-30 scale-95 pointer-events-none' : 'hover:scale-[1.02] active:scale-95 hover:shadow-xl'
      } ${
        isReorderTarget ? 'ring-2 ring-purple-400 border-purple-400 shadow-xl shadow-purple-500/30 scale-[1.02]' : ''
      } ${
        isJustTapped
          ? 'ring-4 ring-white/60 shadow-2xl'
          : isDaylight
          ? 'shadow-xs hover:shadow-sm'
          : hTheme.glowShadow
      }`}
      style={{
        background: isJustTapped
          ? undefined
          : isDaylight
          ? '#FFFFFF'
          : visualStyle === 'full-gradient'
          ? hTheme.fullGradientCss
          : `linear-gradient(rgba(10, 14, 23, 0.95), rgba(10, 14, 23, 0.95)) padding-box, ${hTheme.borderGradientCss || hTheme.fullGradientCss} border-box`,
        border: isDaylight
          ? '1px solid #E1E8E3'
          : visualStyle === 'dark-outline'
          ? '2.5px solid transparent'
          : '1px solid rgba(255, 255, 255, 0.25)',
        boxShadow: isJustTapped
          ? '0 8px 24px rgba(16, 185, 129, 0.35)'
          : isDaylight
          ? '0 2px 6px rgb(23 42 40 / 4%)'
          : isIgnited
          ? visualStyle === 'dark-outline'
            ? `0 0 16px ${hTheme.colorHex}B3, 0 4px 30px ${hTheme.colorHex}73, 0 12px 52px ${hTheme.colorHex}40`
            : `0 6px 20px ${hTheme.colorHex}40`
          : undefined
      }}
    >
      {/* Subtle Glassmorphic Sheen Overlay for dark mode only */}
      {!isDaylight && (
        <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none rounded-2xl sm:rounded-3xl" />
      )}

      {/* Progress Bar: Horizontal along the top in 1-wide, or vertical on left in square modes */}
      {isOneWide ? (
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${isDaylight ? 'bg-slate-200/80' : 'bg-black/25'} backdrop-blur-sm z-20 pointer-events-none rounded-t-2xl sm:rounded-t-3xl overflow-hidden`}>
          <div
            className={`h-full transition-all duration-500 ${
              isGoalReached ? 'bg-emerald-500' : isDaylight ? 'bg-slate-500' : 'bg-white/95'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      ) : (
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isDaylight ? 'bg-slate-200/80' : 'bg-black/25'} backdrop-blur-sm z-10 pointer-events-none rounded-l-2xl sm:rounded-l-3xl overflow-hidden`}>
          <div
            className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${
              isGoalReached ? 'bg-emerald-500' : isDaylight ? 'bg-slate-500' : 'bg-white/95'
            }`}
            style={{ height: `${progressPct}%` }}
          />
        </div>
      )}

      {isOneWide ? (
        /* 1-Wide Horizontal Layout (Matching ModalityBlockTile Height) */
        <div className="flex-1 flex flex-row items-center justify-between gap-3 min-w-0 w-full relative z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isDaylight ? '' : 'bg-white/5 border border-white/10'
              }`}
              style={isDaylight ? { backgroundColor: `${hTheme.colorHex}1A`, color: hTheme.colorHex } : undefined}
            >
              {isJustTapped ? (
                <Check size={20} strokeWidth={3} className={isDaylight ? 'text-[#10B981]' : 'text-emerald-300'} />
              ) : (
                <ModalityIcon
                  category={hotkey.category}
                  modalityName={hotkey.name}
                  customIcon={hotkey.icon}
                  size={22}
                  glow={!isDaylight && isIgnited}
                  isIgnited={isIgnited}
                  customColor={isDaylight ? hTheme.colorHex : visualStyle === 'full-gradient' ? '#FFFFFF' : undefined}
                />
              )}
            </div>

            <div className="flex flex-col text-left min-w-0 flex-1">
              <div className={`font-black tracking-tight leading-tight truncate text-sm sm:text-base ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>
                {hotkey.name}
              </div>
              <div className={`text-[10px] sm:text-[11px] font-mono font-medium truncate ${isDaylight ? 'text-[#64748B]' : 'text-white/80'}`}>
                {totalVal > 0 ? (
                  <span className={isGoalReached ? "text-emerald-500 font-bold" : isDaylight ? "text-[#475569] font-bold" : "text-white font-bold"}>
                    {totalVal}{hotkey.daily_goal ? `/${hotkey.daily_goal}` : ''} {hotkey.unit}
                  </span>
                ) : (
                  <span className={isDaylight ? "text-[#94A3B8]" : "text-white/60"}>
                    0{hotkey.daily_goal ? `/${hotkey.daily_goal}` : ''} {hotkey.unit}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2 py-0.5 rounded-lg ${
              isDaylight
                ? 'bg-[#EFF3F0] border border-[#E1E8E3] text-[#475569]'
                : 'bg-black/30 backdrop-blur-md border border-white/25 text-white'
            } font-mono font-black text-[11px] shadow-sm flex items-center gap-0.5`}>
              <span>+{hotkey.default_increment}</span>
              <span className="text-[9px] uppercase opacity-90">{hotkey.unit}</span>
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpenDetails(hotkey)
              }}
              className={`w-6 h-6 rounded-md ${
                isDaylight
                  ? 'bg-[#EFF3F0] hover:bg-[#E1E8E3] border border-[#E1E8E3] text-[#64748B] hover:text-[#475569]'
                  : 'bg-black/25 hover:bg-black/50 border border-white/20 text-white/80 hover:text-white backdrop-blur-sm'
              } flex items-center justify-center transition-all cursor-pointer`}
              title="Click to edit hotkey amount or placement"
            >
              <Sliders size={12} />
            </button>
          </div>
        </div>
      ) : (
        /* Square Mode (2-Wide, 3-Wide): Large Centered Icon in the Middle */
        <div className="w-full h-full flex flex-col items-center justify-center my-auto text-center px-1 sm:px-2 relative z-10">
          {/* Top Floating Controls Bar */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-20 pointer-events-none">
            <span className={`pointer-events-auto px-1.5 py-0.5 rounded-lg ${
              isDaylight
                ? 'bg-[#EFF3F0] border border-[#E1E8E3] text-[#475569]'
                : 'bg-black/30 backdrop-blur-md border border-white/25 text-white'
            } font-mono font-black text-[10px] sm:text-[11px] shadow-sm flex items-center gap-0.5`}>
              <span>+{hotkey.default_increment}</span>
              <span className="text-[8.5px] uppercase opacity-90">{hotkey.unit}</span>
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpenDetails(hotkey)
              }}
              className={`pointer-events-auto w-5 h-5 rounded-md ${
                isDaylight
                  ? 'bg-[#EFF3F0] hover:bg-[#E1E8E3] border border-[#E1E8E3] text-[#64748B] hover:text-[#475569]'
                  : 'bg-black/25 hover:bg-black/50 border border-white/20 text-white/80 hover:text-white backdrop-blur-sm'
              } flex items-center justify-center transition-all cursor-pointer`}
              title="Click to edit hotkey amount or placement"
            >
              <Sliders size={11} />
            </button>
          </div>

          {/* Large Centered Modality Icon with Ambient Glow */}
          <div className="relative flex items-center justify-center mb-1.5 sm:mb-2">
            {isJustTapped ? (
              <div className={`w-11 h-11 rounded-2xl ${
                isDaylight
                  ? 'bg-[#D1FAE5] border border-[#10B981] text-[#10B981]'
                  : 'bg-emerald-500/30 border border-emerald-400 text-emerald-200'
              } flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-in zoom-in-90 duration-300`}>
                <Check size={24} strokeWidth={3} />
              </div>
            ) : (
              <ModalityIcon
                category={hotkey.category}
                modalityName={hotkey.name}
                customIcon={hotkey.icon}
                size={layoutMode === '3-wide' ? 32 : 42}
                glow={!isDaylight && isIgnited}
                isIgnited={isIgnited}
                customColor={isDaylight ? hTheme.colorHex : visualStyle === 'full-gradient' ? '#FFFFFF' : undefined}
              />
            )}
          </div>

          <div className={`text-xs sm:text-[13px] font-black leading-tight text-center break-words line-clamp-2 ${
            isDaylight ? 'text-[#475569]' : 'text-white drop-shadow-sm'
          }`}>
            {hotkey.name}
          </div>

          <div className={`text-[10px] sm:text-[11px] font-mono font-bold mt-1 text-center truncate ${
            isDaylight ? 'text-[#64748B]' : 'text-white/90'
          }`}>
            {totalVal > 0 ? (
              <span className={isGoalReached ? "text-emerald-500 font-bold" : isDaylight ? "text-[#475569] font-bold" : "text-white font-bold"}>
                {totalVal}{hotkey.daily_goal ? `/${hotkey.daily_goal}` : ''} {hotkey.unit}
              </span>
            ) : (
              <span className={isDaylight ? "text-[#94A3B8]" : "text-white/70"}>
                0{hotkey.daily_goal ? `/${hotkey.daily_goal}` : ''} {hotkey.unit}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
