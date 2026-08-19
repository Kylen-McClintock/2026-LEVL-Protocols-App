'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Sun, Moon, Sunrise, Sunset, Coffee, Clock, Sparkles } from 'lucide-react'

export interface DiurnalTimeSlot {
  index: number
  id: string
  label: string
  timeRange: string
  icon: React.ReactNode
  activeBg: string
  inRangeBg: string
  textColor: string
  shadowColor: string
  handleBg: string
}

export const DIURNAL_SLOTS: DiurnalTimeSlot[] = [
  { 
    index: 0, 
    id: 'pre_wake', 
    label: 'Pre-Wake / Dawn', 
    timeRange: '5:00 - 7:00 AM', 
    icon: <Sunrise className="w-3.5 h-3.5" />, 
    activeBg: 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 border-indigo-200 text-white shadow-[0_0_16px_rgba(99,102,241,0.9)]',
    inRangeBg: 'bg-indigo-950/80 border-indigo-500/50 text-indigo-200',
    textColor: 'text-indigo-400',
    shadowColor: 'rgba(99,102,241,0.9)',
    handleBg: 'bg-indigo-500 border-indigo-200'
  },
  { 
    index: 1, 
    id: 'morning', 
    label: 'Wake & Morning', 
    timeRange: '7:00 - 11:00 AM', 
    icon: <Coffee className="w-3.5 h-3.5" />, 
    activeBg: 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400 border-amber-100 text-slate-950 shadow-[0_0_16px_rgba(245,158,11,0.9)]',
    inRangeBg: 'bg-amber-950/80 border-amber-500/50 text-amber-200',
    textColor: 'text-amber-400',
    shadowColor: 'rgba(245,158,11,0.9)',
    handleBg: 'bg-amber-400 border-amber-100'
  },
  { 
    index: 2, 
    id: 'midday', 
    label: 'Midday / Afternoon', 
    timeRange: '11:00 AM - 4:00 PM', 
    icon: <Sun className="w-3.5 h-3.5" />, 
    activeBg: 'bg-gradient-to-r from-yellow-300 via-emerald-400 to-teal-400 border-emerald-100 text-slate-950 shadow-[0_0_16px_rgba(52,211,153,0.9)]',
    inRangeBg: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200',
    textColor: 'text-emerald-400',
    shadowColor: 'rgba(52,211,153,0.9)',
    handleBg: 'bg-emerald-400 border-emerald-100'
  },
  { 
    index: 3, 
    id: 'evening', 
    label: 'Evening & Sunset', 
    timeRange: '4:00 - 9:00 PM', 
    icon: <Sunset className="w-3.5 h-3.5" />, 
    activeBg: 'bg-gradient-to-r from-orange-500 via-rose-500 to-purple-600 border-rose-200 text-white shadow-[0_0_16px_rgba(244,63,94,0.9)]',
    inRangeBg: 'bg-rose-950/80 border-rose-500/50 text-rose-200',
    textColor: 'text-rose-400',
    shadowColor: 'rgba(244,63,94,0.9)',
    handleBg: 'bg-rose-500 border-rose-200'
  },
  { 
    index: 4, 
    id: 'bedtime', 
    label: 'Bedtime & Overnight', 
    timeRange: '9:00 PM - 5:00 AM', 
    icon: <Moon className="w-3.5 h-3.5" />, 
    activeBg: 'bg-gradient-to-r from-blue-600 via-indigo-800 to-slate-900 border-blue-300 text-blue-100 shadow-[0_0_16px_rgba(96,165,250,0.9)]',
    inRangeBg: 'bg-blue-950/80 border-blue-500/50 text-blue-200',
    textColor: 'text-blue-400',
    shadowColor: 'rgba(96,165,250,0.9)',
    handleBg: 'bg-blue-500 border-blue-200'
  },
]

export interface SpecificTimingPreset {
  id: string
  label: string
  icon: string
  diurnalSlotRange: [number, number]
  badgeColor: string
}

export const SPECIFIC_TIMING_PRESETS: SpecificTimingPreset[] = [
  { id: 'upon_waking', label: 'Upon Waking', icon: '🌅', diurnalSlotRange: [0, 1], badgeColor: 'border-indigo-500/50 text-indigo-300 bg-indigo-950/60' },
  { id: 'morning', label: 'Morning / Breakfast', icon: '🍳', diurnalSlotRange: [1, 1], badgeColor: 'border-amber-500/50 text-amber-300 bg-amber-950/60' },
  { id: 'pre_meal', label: 'Pre-Meal', icon: '🥗', diurnalSlotRange: [1, 3], badgeColor: 'border-yellow-500/50 text-yellow-300 bg-yellow-950/60' },
  { id: 'post_meal', label: 'Post-Meal', icon: '🍽️', diurnalSlotRange: [1, 3], badgeColor: 'border-emerald-500/50 text-emerald-300 bg-emerald-950/60' },
  { id: 'midday', label: 'Midday / Afternoon', icon: '☀️', diurnalSlotRange: [2, 2], badgeColor: 'border-teal-500/50 text-teal-300 bg-teal-950/60' },
  { id: 'evening', label: 'Evening / Sunset', icon: '🌇', diurnalSlotRange: [3, 3], badgeColor: 'border-rose-500/50 text-rose-300 bg-rose-950/60' },
  { id: 'wind_down', label: 'Wind Down', icon: '🌙', diurnalSlotRange: [3, 4], badgeColor: 'border-purple-500/50 text-purple-300 bg-purple-950/60' },
  { id: 'bedtime', label: 'Bedtime / Overnight', icon: '💤', diurnalSlotRange: [4, 4], badgeColor: 'border-blue-500/50 text-blue-300 bg-blue-950/60' },
  { id: 'fasting_window', label: 'Fasting Window', icon: '⚡', diurnalSlotRange: [0, 2], badgeColor: 'border-amber-400/50 text-amber-200 bg-slate-900/90' },
  { id: 'infrequent', label: 'Infrequent / Diagnostic', icon: '🔬', diurnalSlotRange: [0, 4], badgeColor: 'border-slate-700 text-slate-300 bg-slate-900/90' },
]

export interface SolarDiurnalSliderProps {
  range: [number, number] // [startSlotIndex, endSlotIndex]
  onChange: (range: [number, number]) => void
  selectedSpecificTimings?: string[]
  onToggleSpecificTiming?: (timingId: string) => void
}

export const SolarDiurnalSlider: React.FC<SolarDiurnalSliderProps> = ({
  range,
  onChange,
  selectedSpecificTimings = [],
  onToggleSpecificTiming
}) => {
  const [startIdx, endIdx] = range
  const [activeThumb, setActiveThumb] = useState<'start' | 'end' | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  const isAllDay = startIdx === 0 && endIdx === 4
  const isSinglePoint = startIdx === endIdx

  const handlePointerDown = (thumb: 'start' | 'end') => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setActiveThumb(thumb)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!activeThumb || !trackRef.current) return

    const rect = trackRef.current.getBoundingClientRect()
    const relativeX = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const ratio = relativeX / rect.width
    const nearestSlot = Math.round(ratio * (DIURNAL_SLOTS.length - 1))

    if (activeThumb === 'start') {
      const newStart = Math.min(nearestSlot, endIdx)
      if (newStart !== startIdx) onChange([newStart, endIdx])
    } else if (activeThumb === 'end') {
      const newEnd = Math.max(nearestSlot, startIdx)
      if (newEnd !== endIdx) onChange([startIdx, newEnd])
    }
  }, [activeThumb, startIdx, endIdx, onChange])

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeThumb) {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      setActiveThumb(null)
    }
  }

  const handleNodeClick = (index: number) => {
    if (isSinglePoint && startIdx === index) {
      onChange([0, 4])
      return
    }

    if (index < startIdx) {
      onChange([index, endIdx])
    } else if (index > endIdx) {
      onChange([startIdx, index])
    } else {
      onChange([index, index])
    }
  }

  // Calculate Sun Position for Parabolic Arc (x % -> y arc height)
  const midPointRatio = ((startIdx + endIdx) / 2) / (DIURNAL_SLOTS.length - 1)
  const sunArcY = Math.round(-4 * Math.pow(midPointRatio - 0.5, 2) * 26 + 26)

  // Dynamic Background Sky Gradient based on midPointRatio
  const skyGradient = isAllDay
    ? 'from-slate-950 via-indigo-950/80 to-slate-950 border-slate-800/80'
    : midPointRatio <= 0.25
    ? 'from-slate-950 via-indigo-950 to-purple-950 border-purple-800/50'
    : midPointRatio <= 0.5
    ? 'from-indigo-950 via-amber-950/60 to-yellow-950/80 border-amber-500/40'
    : midPointRatio <= 0.75
    ? 'from-purple-950 via-rose-950/70 to-amber-950/80 border-rose-500/40'
    : 'from-slate-950 via-indigo-950 to-slate-900 border-indigo-800/50'

  const activeLabelText = isAllDay
    ? 'All Day (5:00 AM - 5:00 AM)'
    : isSinglePoint
    ? `${DIURNAL_SLOTS[startIdx].label} (${DIURNAL_SLOTS[startIdx].timeRange})`
    : `${DIURNAL_SLOTS[startIdx].label} ➔ ${DIURNAL_SLOTS[endIdx].label}`

  const startSlot = DIURNAL_SLOTS[startIdx]
  const endSlot = DIURNAL_SLOTS[endIdx]

  return (
    <div className={`w-full bg-gradient-to-r ${skyGradient} p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-500 my-2`}>
      {/* Header Label */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 ${startSlot.textColor}`}>
            {midPointRatio > 0.8 || (isAllDay) ? <Sparkles className="w-4 h-4 text-purple-300" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </div>
          <div>
            <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Diurnal Time Window</span>
              {(!isAllDay || selectedSpecificTimings.length > 0) && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-900 text-amber-300 border border-amber-500/40 font-mono">
                  Filtered
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1">
              <Clock className={`w-3 h-3 ${startSlot.textColor}`} />
              <span>{activeLabelText}</span>
            </div>
          </div>
        </div>

        {(!isAllDay || selectedSpecificTimings.length > 0) && (
          <button
            type="button"
            onClick={() => {
              onChange([0, 4])
              if (onToggleSpecificTiming) {
                selectedSpecificTimings.forEach(t => onToggleSpecificTiming(t))
              }
            }}
            className="text-[11px] font-bold text-amber-400/80 hover:text-amber-300 hover:underline px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 transition cursor-pointer"
          >
            Reset All Day
          </button>
        )}
      </div>

      {/* Sun Arc Path Visualizer */}
      <div className="relative h-9 w-full overflow-hidden mb-1 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
          <path
            d="M 5 28 Q 50 2 95 28"
            fill="none"
            stroke="rgba(245, 158, 11, 0.25)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        </svg>

        {/* Animated Sun Icon along Parabolic Arc */}
        <div
          className="absolute transition-all duration-300 ease-out transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{
            left: `${(midPointRatio * 90) + 5}%`,
            top: `${28 - sunArcY}px`
          }}
        >
          <div className="p-1 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 shadow-[0_0_15px_rgba(245,158,11,0.8)] text-slate-950 animate-pulse">
            {midPointRatio > 0.8 ? <Moon className="w-4 h-4 fill-indigo-2 text-indigo-100" /> : <Sun className="w-4 h-4 fill-amber-100 text-slate-950" />}
          </div>
        </div>
      </div>

      {/* Slider Track & Node Anchors */}
      <div
        ref={trackRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative h-6 w-full flex items-center cursor-pointer select-none px-2"
      >
        {/* Base Track */}
        <div className="absolute left-2 right-2 h-2 rounded-full bg-slate-900/90 border border-slate-800 overflow-hidden">
          {/* Active Range Highlight */}
          <div
            className="absolute top-0 bottom-0 bg-gradient-to-r from-indigo-500 via-amber-500 to-rose-500 shadow-[0_0_12px_rgba(245,158,11,0.5)] transition-all duration-150"
            style={{
              left: `${(startIdx / (DIURNAL_SLOTS.length - 1)) * 100}%`,
              right: `${100 - (endIdx / (DIURNAL_SLOTS.length - 1)) * 100}%`
            }}
          />
        </div>

        {/* 5 Anchor Nodes with Time-of-Day Matched Color Themes */}
        <div className="relative w-full flex justify-between items-center z-10">
          {DIURNAL_SLOTS.map((slot) => {
            const inRange = slot.index >= startIdx && slot.index <= endIdx
            const isBound = slot.index === startIdx || slot.index === endIdx

            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => handleNodeClick(slot.index)}
                className={`relative group flex items-center justify-center w-7 h-7 rounded-full border transition-all duration-200 cursor-pointer ${
                  isBound
                    ? `${slot.activeBg} scale-115 font-bold z-20`
                    : inRange
                    ? `${slot.inRangeBg} scale-100`
                    : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'
                }`}
                title={`${slot.label} (${slot.timeRange})`}
              >
                <span className="scale-90">{slot.icon}</span>

                {/* Tooltip Label underneath */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-[10px] text-slate-200 px-2 py-0.5 rounded border border-slate-700 whitespace-nowrap z-30 pointer-events-none shadow-lg">
                  {slot.label}
                </div>
              </button>
            )
          })}
        </div>

        {/* Dual Thumbs Drag Handles Color-Coded to Anchor Times */}
        <div
          onPointerDown={handlePointerDown('start')}
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full ${startSlot.handleBg} shadow-lg cursor-grab active:cursor-grabbing z-20 hover:scale-125 transition-transform`}
          style={{
            left: `calc(${(startIdx / (DIURNAL_SLOTS.length - 1)) * 100}% - 10px)`
          }}
        />

        {startIdx !== endIdx && (
          <div
            onPointerDown={handlePointerDown('end')}
            className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full ${endSlot.handleBg} shadow-lg cursor-grab active:cursor-grabbing z-20 hover:scale-125 transition-transform`}
            style={{
              left: `calc(${(endIdx / (DIURNAL_SLOTS.length - 1)) * 100}% - 10px)`
            }}
          />
        )}
      </div>

      {/* Footer Anchors Labels Row with Time-of-Day Matching Colors */}
      <div className="flex justify-between items-center text-[10px] mt-3 px-1 font-semibold">
        <span className={startIdx === 0 ? 'text-indigo-300 font-bold' : 'text-slate-400'}>🌅 Dawn (5a)</span>
        <span className={startIdx <= 1 && endIdx >= 1 ? 'text-amber-300 font-bold' : 'text-slate-400'}>☕ Morning</span>
        <span className={startIdx <= 2 && endIdx >= 2 ? 'text-emerald-300 font-bold' : 'text-slate-400'}>☀️ Midday</span>
        <span className={startIdx <= 3 && endIdx >= 3 ? 'text-rose-300 font-bold' : 'text-slate-400'}>🌇 Sunset</span>
        <span className={endIdx === 4 ? 'text-blue-300 font-bold' : 'text-slate-400'}>🌙 Bedtime (9p+)</span>
      </div>

      {/* Specific Schema Execution Timing Chips Row */}
      <div className="mt-3.5 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <span>🎯 Specific Execution Timings</span>
          </span>
          {selectedSpecificTimings.length > 0 && (
            <span className="text-[10px] text-amber-300 font-bold">
              {selectedSpecificTimings.length} Active
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SPECIFIC_TIMING_PRESETS.map((preset) => {
            const isSelected = selectedSpecificTimings.includes(preset.id)
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  if (onToggleSpecificTiming) {
                    onToggleSpecificTiming(preset.id)
                  }
                  if (!isSelected) {
                    onChange(preset.diurnalSlotRange)
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)] scale-105'
                    : `hover:border-slate-600 hover:text-white ${preset.badgeColor}`
                }`}
              >
                <span>{preset.icon}</span>
                <span>{preset.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
