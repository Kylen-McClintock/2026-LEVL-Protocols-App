'use client'

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Search, ArrowRight, X } from 'lucide-react'
import {
  EmotionEntry,
  EmotionQuadrant,
  QUADRANT_CONFIGS,
  CANONICAL_EMOTIONS,
  getEmotionColor,
  getEmotionTextColor
} from '@/lib/emotions/emotionDictionary'
import EmotionSearchOverlay from './EmotionSearchOverlay'
import { useTheme } from '@/lib/utils/useTheme'
import { triggerHaptic } from '@/lib/utils/haptics'

interface FeelingsMoodGridModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmFeeling: (emotion: EmotionEntry) => void
  onSkipToSliders: () => void
  initialFeelingId?: string | null
}

// Coordinate layout constants for the unified 2D pannable canvas
const BUBBLE_SIZE = 114 // diameter in px
const COL_PITCH = 126 // horizontal distance between columns
const ROW_PITCH = 110 // vertical distance between rows
const ROW_STAGGER = 60 // staggered offset for alternating rows
const QUAD_WIDTH = 6 * COL_PITCH + ROW_STAGGER // ~816px
const QUAD_HEIGHT = 6 * ROW_PITCH // ~660px
const AXIS_GAP = 32 // reduced gap between quadrants for tightly connected emotional landscape

// Canvas center offsets
const LEFT_QUAD_X = 140
const RIGHT_QUAD_X = LEFT_QUAD_X + QUAD_WIDTH + AXIS_GAP // ~988px
const TOP_QUAD_Y = 120
const BOTTOM_QUAD_Y = TOP_QUAD_Y + QUAD_HEIGHT + AXIS_GAP // ~812px
const TOTAL_CANVAS_WIDTH = RIGHT_QUAD_X + QUAD_WIDTH + 140 // ~1944px
const TOTAL_CANVAS_HEIGHT = BOTTOM_QUAD_Y + QUAD_HEIGHT + 180 // ~1652px
const AXIS_CENTER_X = LEFT_QUAD_X + QUAD_WIDTH + AXIS_GAP / 2 // central vertical axis line
const AXIS_CENTER_Y = TOP_QUAD_Y + QUAD_HEIGHT + AXIS_GAP / 2 // central horizontal axis line

interface PositionedEmotion {
  emotion: EmotionEntry
  x: number // absolute center x on canvas
  y: number // absolute center y on canvas
}

export default function FeelingsMoodGridModal({
  isOpen,
  onClose,
  onConfirmFeeling,
  onSkipToSliders,
  initialFeelingId
}: FeelingsMoodGridModalProps) {
  const { theme } = useTheme()
  const isDaylight = theme === 'light'

  const [activeStep, setActiveStep] = useState<'quadrant_picker' | 'word_cloud'>('quadrant_picker')
  const [activeCenterQuadrant, setActiveCenterQuadrant] = useState<EmotionQuadrant>('high_energy_pleasant')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [focusedEmotion, setFocusedEmotion] = useState<EmotionEntry | null>(null)
  const [hoveredEmotionId, setHoveredEmotionId] = useState<string | null>(null)

  const cloudContainerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0
  })
  const hasInitializedScrollRef = useRef(false)

  // Map all 144 emotions to their absolute (x, y) coordinates on the continuous 2D canvas
  const positionedEmotions = useMemo<PositionedEmotion[]>(() => {
    return CANONICAL_EMOTIONS.map((emotion) => {
      let quadBaseX = RIGHT_QUAD_X
      let quadBaseY = TOP_QUAD_Y

      if (emotion.quadrant === 'high_energy_unpleasant') {
        quadBaseX = LEFT_QUAD_X
        quadBaseY = TOP_QUAD_Y
      } else if (emotion.quadrant === 'low_energy_unpleasant') {
        quadBaseX = LEFT_QUAD_X
        quadBaseY = BOTTOM_QUAD_Y
      } else if (emotion.quadrant === 'low_energy_pleasant') {
        quadBaseX = RIGHT_QUAD_X
        quadBaseY = BOTTOM_QUAD_Y
      }

      const row = emotion.matrixRow ?? 0
      const col = emotion.matrixCol ?? 0
      const stagger = row % 2 === 1 ? ROW_STAGGER : 0
      const x = quadBaseX + col * COL_PITCH + stagger + BUBBLE_SIZE / 2
      const y = quadBaseY + row * ROW_PITCH + BUBBLE_SIZE / 2

      return { emotion, x, y }
    })
  }, [])

  // Center canvas on a specific coordinate
  const centerCanvasOn = useCallback((targetX: number, targetY: number, smooth: boolean = false) => {
    if (!cloudContainerRef.current) return
    const container = cloudContainerRef.current
    const clientW = container.clientWidth
    const clientH = container.clientHeight
    const scrollLeft = Math.max(0, targetX - clientW / 2)
    const scrollTop = Math.max(0, targetY - clientH / 2)

    if (smooth) {
      container.scrollTo({ left: scrollLeft, top: scrollTop, behavior: 'smooth' })
    } else {
      container.scrollLeft = scrollLeft
      container.scrollTop = scrollTop
    }
  }, [])

  // Center canvas on a specific quadrant
  const centerOnQuadrant = useCallback((q: EmotionQuadrant, smooth: boolean = false) => {
    let qCenterX = RIGHT_QUAD_X + QUAD_WIDTH / 2
    let qCenterY = TOP_QUAD_Y + QUAD_HEIGHT / 2

    if (q === 'high_energy_unpleasant') {
      qCenterX = LEFT_QUAD_X + QUAD_WIDTH / 2
      qCenterY = TOP_QUAD_Y + QUAD_HEIGHT / 2
    } else if (q === 'low_energy_unpleasant') {
      qCenterX = LEFT_QUAD_X + QUAD_WIDTH / 2
      qCenterY = BOTTOM_QUAD_Y + QUAD_HEIGHT / 2
    } else if (q === 'low_energy_pleasant') {
      qCenterX = RIGHT_QUAD_X + QUAD_WIDTH / 2
      qCenterY = BOTTOM_QUAD_Y + QUAD_HEIGHT / 2
    }

    centerCanvasOn(qCenterX, qCenterY, smooth)
    setActiveCenterQuadrant(q)
  }, [centerCanvasOn])

  // Center proximity detection during panning
  const handleScroll = useCallback(() => {
    if (!cloudContainerRef.current) return
    const container = cloudContainerRef.current
    const viewportCenterX = container.scrollLeft + container.clientWidth / 2
    const viewportCenterY = container.scrollTop + container.clientHeight / 2

    // Update active quadrant title based on viewport center
    const isRight = viewportCenterX > AXIS_CENTER_X
    const isBottom = viewportCenterY > AXIS_CENTER_Y

    let currentQ: EmotionQuadrant = 'high_energy_pleasant'
    if (!isRight && !isBottom) currentQ = 'high_energy_unpleasant'
    else if (!isRight && isBottom) currentQ = 'low_energy_unpleasant'
    else if (isRight && isBottom) currentQ = 'low_energy_pleasant'
    else currentQ = 'high_energy_pleasant'

    if (currentQ !== activeCenterQuadrant) {
      setActiveCenterQuadrant(currentQ)
    }

    // Find the emotion closest to the center
    let closestItem: PositionedEmotion | null = null
    let minDistance = Infinity

    for (const item of positionedEmotions) {
      const dist = Math.hypot(item.x - viewportCenterX, item.y - viewportCenterY)
      if (dist < minDistance) {
        minDistance = dist
        closestItem = item
      }
    }

    if (closestItem && minDistance < 180 && closestItem.emotion.id !== focusedEmotion?.id) {
      setFocusedEmotion(closestItem.emotion)
      triggerHaptic('selection')
    }
  }, [positionedEmotions, focusedEmotion, activeCenterQuadrant])

  // Initial scroll when entering word cloud
  useEffect(() => {
    if (activeStep === 'word_cloud' && !hasInitializedScrollRef.current) {
      hasInitializedScrollRef.current = true
      requestAnimationFrame(() => {
        centerOnQuadrant(activeCenterQuadrant, false)
        // Set initial focused emotion for that quadrant
        const firstInQuad = positionedEmotions.find(p => p.emotion.quadrant === activeCenterQuadrant)
        if (firstInQuad) {
          setFocusedEmotion(firstInQuad.emotion)
        }
      })
    }
  }, [activeStep, activeCenterQuadrant, centerOnQuadrant, positionedEmotions])

  // Reset scroll initialization ref when returning to quadrant picker
  useEffect(() => {
    if (activeStep === 'quadrant_picker') {
      hasInitializedScrollRef.current = false
    }
  }, [activeStep])

  // Desktop drag-to-pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!cloudContainerRef.current) return
    isDraggingRef.current = true
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: cloudContainerRef.current.scrollLeft,
      scrollTop: cloudContainerRef.current.scrollTop
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !cloudContainerRef.current) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    cloudContainerRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx
    cloudContainerRef.current.scrollTop = dragStartRef.current.scrollTop - dy
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
  }

  if (!isOpen) return null

  const handleSelectQuadrantLobe = (q: EmotionQuadrant) => {
    triggerHaptic('light')
    setActiveCenterQuadrant(q)
    setActiveStep('word_cloud')
  }

  const handleConfirm = () => {
    if (!focusedEmotion) return
    triggerHaptic('success')
    onConfirmFeeling(focusedEmotion)
    onClose()
  }

  const activeCfg = QUADRANT_CONFIGS[activeCenterQuadrant]

  return (
    <div
      className={`fixed inset-0 z-[110] flex flex-col transition-colors duration-200 animate-in fade-in select-none ${
        isDaylight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#090D16] text-white'
      }`}
    >
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TOP APP BAR */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <div
        className={`px-4 sm:px-6 py-3.5 flex items-center justify-between border-b shrink-0 z-30 transition-colors ${
          isDaylight
            ? 'bg-white/95 border-slate-200/90 text-slate-900 shadow-sm'
            : 'bg-[#090D16]/95 border-white/10 text-white backdrop-blur-md'
        }`}
      >
        <div className="flex items-center gap-2">
          {activeStep === 'word_cloud' ? (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light')
                setActiveStep('quadrant_picker')
              }}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                isDaylight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <ArrowLeft size={18} />
              <span>All Zones</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light')
                onSkipToSliders()
                onClose()
              }}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isDaylight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Close and enter sliders manually"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Center Title - Updates dynamically as user pans across quadrants */}
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full transition-colors"
            style={{ backgroundColor: activeCfg.baseColorHex }}
          />
          <span
            className={`text-xs font-mono font-bold uppercase tracking-wider ${
              isDaylight ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            {activeStep === 'quadrant_picker' ? 'Daily Feeling Check-in' : activeCfg.label}
          </span>
        </div>

        {/* Right Search & Close Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light')
              setIsSearchOpen(true)
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isDaylight
                ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Search all feelings"
          >
            <Search size={19} />
          </button>

          {activeStep === 'word_cloud' && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light')
                onSkipToSliders()
                onClose()
              }}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isDaylight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Close and enter sliders manually"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* STEP 1: 4-LOBE QUADRANT ENTRANCE */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {activeStep === 'quadrant_picker' && (
        <div className="flex-1 flex flex-col items-center justify-between p-4 sm:p-8 max-w-lg mx-auto w-full">
          <div className="text-center pt-4 sm:pt-8 space-y-1.5">
            <h2
              className={`text-xl sm:text-2xl font-serif font-bold tracking-tight ${
                isDaylight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Tap the zone that best describes how you feel right now
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select an emotional quadrant or pan freely across the feelings map
            </p>
          </div>

          {/* 4 Overlapping Circular Lobes */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 my-auto flex items-center justify-center">
            {/* Top-Left: High Energy Unpleasant (Red) */}
            <div
              onClick={() => handleSelectQuadrantLobe('high_energy_unpleasant')}
              className="absolute -top-1 -left-1 w-40 h-40 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-red-500 via-rose-500 to-orange-500 text-white shadow-xl shadow-red-950/40 p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-transform hover:scale-105 active:scale-95 group border border-white/20 select-none"
            >
              <span className="font-serif font-bold text-sm sm:text-base leading-tight group-hover:scale-105 transition-transform">
                High Energy
              </span>
              <span className="font-serif font-bold text-sm sm:text-base leading-tight group-hover:scale-105 transition-transform">
                Unpleasant
              </span>
              <span className="text-[10px] opacity-80 mt-1 font-mono">↑ Energy • ↓ Mood</span>
            </div>

            {/* Top-Right: High Energy Pleasant (Yellow) */}
            <div
              onClick={() => handleSelectQuadrantLobe('high_energy_pleasant')}
              className="absolute -top-1 -right-1 w-40 h-40 sm:w-44 sm:h-44 rounded-full bg-gradient-to-bl from-amber-400 via-yellow-400 to-yellow-500 text-slate-950 shadow-xl shadow-amber-950/40 p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-transform hover:scale-105 active:scale-95 group border border-white/20 select-none"
            >
              <span className="font-serif font-bold text-sm sm:text-base leading-tight group-hover:scale-105 transition-transform">
                High Energy
              </span>
              <span className="font-serif font-bold text-sm sm:text-base leading-tight group-hover:scale-105 transition-transform">
                Pleasant
              </span>
              <span className="text-[10px] opacity-80 mt-1 font-mono">↑ Energy • ↑ Mood</span>
            </div>

            {/* Bottom-Left: Low Energy Unpleasant (Blue) */}
            <div
              onClick={() => handleSelectQuadrantLobe('low_energy_unpleasant')}
              className="absolute -bottom-1 -left-1 w-40 h-40 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-indigo-500 via-blue-500 to-sky-400 text-white shadow-xl shadow-blue-950/40 p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-transform hover:scale-105 active:scale-95 group border border-white/20 select-none"
            >
              <span className="font-serif font-bold text-sm sm:text-base leading-tight group-hover:scale-105 transition-transform">
                Low Energy
              </span>
              <span className="font-serif font-bold text-sm sm:text-base leading-tight group-hover:scale-105 transition-transform">
                Unpleasant
              </span>
              <span className="text-[10px] opacity-80 mt-1 font-mono">↓ Energy • ↓ Mood</span>
            </div>

            {/* Bottom-Right: Low Energy Pleasant (Green) */}
            <div
              onClick={() => handleSelectQuadrantLobe('low_energy_pleasant')}
              className="absolute -bottom-1 -right-1 w-40 h-40 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tl from-teal-400 via-emerald-400 to-green-500 text-slate-950 shadow-xl shadow-emerald-950/40 p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-transform hover:scale-105 active:scale-95 group border border-white/20 select-none"
            >
              <span className="font-serif font-bold text-sm sm:text-base leading-tight group-hover:scale-105 transition-transform">
                Low Energy
              </span>
              <span className="font-serif font-bold text-sm sm:text-base leading-tight group-hover:scale-105 transition-transform">
                Pleasant
              </span>
              <span className="text-[10px] opacity-80 mt-1 font-mono">↓ Energy • ↑ Mood</span>
            </div>
          </div>

          {/* Bottom Direct Sliders Option */}
          <div className="pb-4 text-center">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light')
                onSkipToSliders()
                onClose()
              }}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer underline underline-offset-4"
            >
              Skip to manual sliders (enter numbers directly)
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* STEP 2: UNIFIED 2D PANNABLE FEELINGS MAP */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {activeStep === 'word_cloud' && (
        <div className="flex-1 relative overflow-hidden flex flex-col">
          {/* Continuous Pannable Scroll Container */}
          <div
            ref={cloudContainerRef}
            onScroll={handleScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`flex-1 overflow-auto cursor-grab active:cursor-grabbing overscroll-contain transition-colors ${
              isDaylight ? 'bg-[#F8FAFC]' : 'bg-[#090D16]'
            }`}
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {/* Massive 2D Canvas where all 144 bubbles are laid out */}
            <div
              className="relative"
              style={{
                width: TOTAL_CANVAS_WIDTH,
                height: TOTAL_CANVAS_HEIGHT
              }}
            >
              {/* Central Axis Dividers & Explicit Axis Labels */}
              {/* Vertical Axis (Energy Arousal) */}
              <div
                className={`absolute top-0 bottom-0 pointer-events-none transition-colors ${
                  isDaylight ? 'border-r-2 border-slate-300' : 'border-r-2 border-white/20'
                }`}
                style={{ left: AXIS_CENTER_X }}
              />

              {/* Horizontal Axis (Mood Valence) */}
              <div
                className={`absolute left-0 right-0 pointer-events-none transition-colors ${
                  isDaylight ? 'border-b-2 border-slate-300' : 'border-b-2 border-white/20'
                }`}
                style={{ top: AXIS_CENTER_Y }}
              />

              {/* Axis Labels: Top Vertical Marker (High Energy) */}
              <div
                className={`absolute -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border shadow-md pointer-events-none select-none z-10 transition-colors ${
                  isDaylight
                    ? 'bg-white/95 text-amber-900 border-amber-300/80 shadow-amber-950/10'
                    : 'bg-slate-900/95 text-amber-300 border-amber-500/40 shadow-black'
                }`}
                style={{ left: AXIS_CENTER_X, top: Math.max(16, TOP_QUAD_Y - 56) }}
              >
                <span className="text-amber-500 font-black">▲</span>
                <span>HIGH ENERGY</span>
              </div>

              {/* Axis Labels: Center-Top Vertical Marker */}
              <div
                className={`absolute -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase border shadow-sm pointer-events-none select-none z-10 transition-colors ${
                  isDaylight
                    ? 'bg-white/90 text-amber-800 border-amber-200 shadow-sm'
                    : 'bg-slate-900/90 text-amber-300 border-amber-500/30'
                }`}
                style={{ left: AXIS_CENTER_X, top: AXIS_CENTER_Y - 80 }}
              >
                <span>▲</span>
                <span>HIGH ENERGY</span>
              </div>

              {/* Axis Labels: Center-Bottom Vertical Marker */}
              <div
                className={`absolute -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase border shadow-sm pointer-events-none select-none z-10 transition-colors ${
                  isDaylight
                    ? 'bg-white/90 text-blue-800 border-blue-200 shadow-sm'
                    : 'bg-slate-900/90 text-blue-300 border-blue-500/30'
                }`}
                style={{ left: AXIS_CENTER_X, top: AXIS_CENTER_Y + 56 }}
              >
                <span>▼</span>
                <span>LOW ENERGY</span>
              </div>

              {/* Axis Labels: Bottom Vertical Marker (Low Energy) */}
              <div
                className={`absolute -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border shadow-md pointer-events-none select-none z-10 transition-colors ${
                  isDaylight
                    ? 'bg-white/95 text-blue-900 border-blue-300/80 shadow-blue-950/10'
                    : 'bg-slate-900/95 text-blue-300 border-blue-500/40 shadow-black'
                }`}
                style={{ left: AXIS_CENTER_X, top: BOTTOM_QUAD_Y + QUAD_HEIGHT + 32 }}
              >
                <span className="text-blue-500 font-black">▼</span>
                <span>LOW ENERGY</span>
              </div>

              {/* Axis Labels: Left Horizontal Marker (Unpleasant Mood) */}
              <div
                className={`absolute -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border shadow-md pointer-events-none select-none z-10 transition-colors ${
                  isDaylight
                    ? 'bg-white/95 text-rose-900 border-rose-300/80 shadow-rose-950/10'
                    : 'bg-slate-900/95 text-rose-300 border-rose-500/40 shadow-black'
                }`}
                style={{ left: 24, top: AXIS_CENTER_Y }}
              >
                <span className="text-rose-500 font-black">◄</span>
                <span>UNPLEASANT MOOD</span>
              </div>

              {/* Axis Labels: Center-Left Horizontal Marker */}
              <div
                className={`absolute -translate-y-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase border shadow-sm pointer-events-none select-none z-10 transition-colors ${
                  isDaylight
                    ? 'bg-white/90 text-rose-800 border-rose-200 shadow-sm'
                    : 'bg-slate-900/90 text-rose-300 border-rose-500/30'
                }`}
                style={{ left: AXIS_CENTER_X - 180, top: AXIS_CENTER_Y }}
              >
                <span>◄</span>
                <span>UNPLEASANT MOOD</span>
              </div>

              {/* Axis Labels: Center-Right Horizontal Marker */}
              <div
                className={`absolute -translate-y-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase border shadow-sm pointer-events-none select-none z-10 transition-colors ${
                  isDaylight
                    ? 'bg-white/90 text-emerald-800 border-emerald-200 shadow-sm'
                    : 'bg-slate-900/90 text-emerald-300 border-emerald-500/30'
                }`}
                style={{ left: AXIS_CENTER_X + 52, top: AXIS_CENTER_Y }}
              >
                <span>PLEASANT MOOD</span>
                <span>►</span>
              </div>

              {/* Axis Labels: Right Horizontal Marker (Pleasant Mood) */}
              <div
                className={`absolute -translate-y-1/2 -translate-x-full flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border shadow-md pointer-events-none select-none z-10 transition-colors ${
                  isDaylight
                    ? 'bg-white/95 text-emerald-900 border-emerald-300/80 shadow-emerald-950/10'
                    : 'bg-slate-900/95 text-emerald-300 border-emerald-500/40 shadow-black'
                }`}
                style={{ left: TOTAL_CANVAS_WIDTH - 24, top: AXIS_CENTER_Y }}
              >
                <span>PLEASANT MOOD</span>
                <span className="text-emerald-500 font-black">►</span>
              </div>

              {/* Center Origin Crosshair Anchor */}
              <div
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold border shadow-md pointer-events-none select-none z-10 transition-colors ${
                  isDaylight
                    ? 'bg-white text-slate-700 border-slate-300 shadow-slate-200'
                    : 'bg-slate-900 text-slate-300 border-white/20 shadow-black'
                }`}
                style={{ left: AXIS_CENTER_X, top: AXIS_CENTER_Y }}
                title="Origin: Neutral Balance"
              >
                +
              </div>

              {/* Render all 144 emotion bubbles across the 4 quadrants */}
              {positionedEmotions.map(({ emotion, x, y }) => {
                const isFocused = focusedEmotion?.id === emotion.id
                const isHovered = hoveredEmotionId === emotion.id
                const solidBgColor = getEmotionColor(emotion)
                const textColor = getEmotionTextColor(emotion)

                // Render multi-word emotions cleanly (e.g. "Burned out", "At ease")
                const words = emotion.name.split(' ')
                const isMultiWord = words.length > 1
                const nameLength = emotion.name.length

                // Font size scaling to guarantee zero truncation
                let fontClass = 'text-sm font-serif font-bold'
                if (isMultiWord) {
                  fontClass = 'text-xs font-serif font-bold'
                } else if (nameLength >= 11) {
                  fontClass = 'text-[11px] font-serif font-bold tracking-tight'
                } else if (nameLength >= 8) {
                  fontClass = 'text-xs font-serif font-bold'
                }

                return (
                  <div
                    key={emotion.id}
                    onClick={() => {
                      triggerHaptic('selection')
                      setFocusedEmotion(emotion)
                      centerCanvasOn(x, y, true)
                    }}
                    onMouseEnter={() => setHoveredEmotionId(emotion.id)}
                    onMouseLeave={() => setHoveredEmotionId(null)}
                    style={{
                      left: x - BUBBLE_SIZE / 2,
                      top: y - BUBBLE_SIZE / 2,
                      width: BUBBLE_SIZE,
                      height: BUBBLE_SIZE,
                      backgroundColor: solidBgColor,
                      color: textColor
                    }}
                    className={`absolute rounded-full flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-transform duration-300 ease-out select-none shadow-md ${
                      isFocused || isHovered
                        ? 'scale-125 z-20 ring-4 ring-white shadow-2xl font-black'
                        : 'scale-100 opacity-95 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    {isMultiWord ? (
                      <span className={`${fontClass} leading-tight block px-1`}>
                        {words[0]}
                        <br />
                        {words.slice(1).join(' ')}
                      </span>
                    ) : (
                      <span className={`${fontClass} leading-tight block px-1 whitespace-nowrap`}>
                        {emotion.name}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Floating Axis Orientation HUD for Viewport */}
          <div
            className={`absolute top-14 left-4 z-20 px-3 py-1.5 rounded-full border backdrop-blur-md shadow-lg pointer-events-none select-none flex items-center gap-2.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-opacity duration-300 ${
              isDaylight
                ? 'bg-white/90 text-slate-700 border-slate-300/80 shadow-slate-200/60'
                : 'bg-slate-950/90 text-slate-300 border-white/15 shadow-black/80'
            }`}
          >
            <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
              <span className="text-[9px]">▲</span>
              <span>Energy</span>
              <span className="text-[9px]">▼</span>
            </div>
            <div className="h-3 w-px bg-current opacity-30" />
            <div className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400">
              <span className="text-[9px]">◄</span>
              <span>Mood</span>
              <span className="text-[9px]">►</span>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────── */}
          {/* FLOATING BOTTOM DEFINITION CARD */}
          {/* ─────────────────────────────────────────────────────────────────────── */}
          {focusedEmotion && (
            <div className="absolute bottom-5 left-4 right-4 max-w-md mx-auto z-30 pointer-events-auto">
              <div
                className={`p-4 sm:p-5 rounded-3xl border shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-3 transition-colors ${
                  isDaylight
                    ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-400/30'
                    : 'bg-[#0f172a]/95 border-white/20 text-white shadow-black/80'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-serif font-bold text-base sm:text-lg tracking-tight"
                      style={{ color: QUADRANT_CONFIGS[focusedEmotion.quadrant].baseColorHex }}
                    >
                      {focusedEmotion.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        isDaylight
                          ? 'border-slate-300 text-slate-600 bg-slate-100'
                          : 'border-white/20 text-slate-300 bg-white/5'
                      }`}
                    >
                      {QUADRANT_CONFIGS[focusedEmotion.quadrant].filterLabel}
                    </span>
                  </div>

                  <p
                    className={`text-xs mt-1 leading-snug line-clamp-2 ${
                      isDaylight ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    {focusedEmotion.definition}
                  </p>

                  {/* Comprehensive Calibrated Biometric Ratings */}
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
                    <span
                      className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        isDaylight
                          ? 'border-amber-300 text-amber-900 bg-amber-50'
                          : 'border-amber-500/40 text-amber-300 bg-amber-500/15'
                      }`}
                    >
                      ⚡ Energy {focusedEmotion.energyRating.toFixed(1)}
                    </span>
                    <span
                      className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        isDaylight
                          ? 'border-emerald-300 text-emerald-900 bg-emerald-50'
                          : 'border-emerald-500/40 text-emerald-300 bg-emerald-500/15'
                      }`}
                    >
                      😊 Mood {focusedEmotion.moodRating.toFixed(1)}
                    </span>
                    <span
                      className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        isDaylight
                          ? 'border-rose-300 text-rose-900 bg-rose-50'
                          : 'border-rose-500/40 text-rose-300 bg-rose-500/15'
                      }`}
                    >
                      🔥 Stress {focusedEmotion.stressRating.toFixed(1)}
                    </span>

                    {/* Bandwidth Mode Badge: Survival Cuts vs Peak Additions */}
                    {focusedEmotion.suggestedBandwidthMode === 'survival_80_20' && (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                          isDaylight
                            ? 'border-red-300 text-red-800 bg-red-100/90'
                            : 'border-red-500/40 text-red-300 bg-red-500/20'
                        }`}
                      >
                        🛡️ Survival Cuts
                      </span>
                    )}
                    {focusedEmotion.suggestedBandwidthMode === 'peak_surge' && (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                          isDaylight
                            ? 'border-emerald-300 text-emerald-800 bg-emerald-100/90'
                            : 'border-emerald-500/40 text-emerald-300 bg-emerald-500/20'
                        }`}
                      >
                        ⚡ Peak Additions
                      </span>
                    )}
                  </div>
                </div>

                {/* High-Contrast Circular Action Button */}
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="mood-confirm-btn w-12 h-12 rounded-full transition-all flex items-center justify-center shrink-0 shadow-xl cursor-pointer active:scale-90"
                  style={
                    isDaylight
                      ? { backgroundColor: '#0f172a', color: '#ffffff' }
                      : { backgroundColor: '#ffffff', color: '#0f172a' }
                  }
                  title="Confirm this feeling"
                >
                  <ArrowRight size={20} strokeWidth={2.5} style={{ color: isDaylight ? '#ffffff' : '#0f172a' }} />
                </button>
              </div>

              {/* Skip to sliders text */}
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light')
                    onSkipToSliders()
                    onClose()
                  }}
                  className={`text-[11px] transition-colors cursor-pointer ${
                    isDaylight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Or enter numbers manually on sliders
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* FULL-SCREEN SEARCH OVERLAY */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <EmotionSearchOverlay
        isOpen={isSearchOpen}
        initialQuadrant={activeCenterQuadrant}
        onClose={() => setIsSearchOpen(false)}
        onSelectEmotion={(emotion) => {
          setActiveCenterQuadrant(emotion.quadrant)
          setFocusedEmotion(emotion)
          setActiveStep('word_cloud')
          // Smoothly center on the selected emotion
          const found = positionedEmotions.find(p => p.emotion.id === emotion.id)
          if (found) {
            requestAnimationFrame(() => {
              centerCanvasOn(found.x, found.y, true)
            })
          }
        }}
      />
    </div>
  )
}
