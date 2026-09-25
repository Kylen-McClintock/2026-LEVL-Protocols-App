'use client'

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Search, ArrowRight, X, Sparkles } from 'lucide-react'
import {
  EmotionEntry,
  EmotionQuadrant,
  QUADRANT_CONFIGS,
  getEmotionsByQuadrant
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
  const [selectedQuadrant, setSelectedQuadrant] = useState<EmotionQuadrant>('high_energy_pleasant')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [focusedEmotion, setFocusedEmotion] = useState<EmotionEntry | null>(null)
  const [hoveredEmotionId, setHoveredEmotionId] = useState<string | null>(null)

  const cloudContainerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)

  // Load emotions for active quadrant
  const quadrantEmotions = useMemo(() => {
    return getEmotionsByQuadrant(selectedQuadrant)
  }, [selectedQuadrant])

  // Set default focused emotion whenever quadrant changes
  useEffect(() => {
    if (quadrantEmotions.length > 0) {
      setFocusedEmotion(quadrantEmotions[0])
    }
  }, [quadrantEmotions])

  // Center-weighted scroll detection for mobile fisheye lens
  const handleCloudScroll = useCallback(() => {
    if (!cloudContainerRef.current) return
    const container = cloudContainerRef.current
    const containerRect = container.getBoundingClientRect()
    const centerY = containerRect.top + containerRect.height / 2
    const centerX = containerRect.left + containerRect.width / 2

    const bubbles = container.querySelectorAll<HTMLElement>('[data-emotion-id]')
    let closestEmotion: EmotionEntry | null = null
    let minDistance = Infinity

    bubbles.forEach((el) => {
      const rect = el.getBoundingClientRect()
      const elCenterY = rect.top + rect.height / 2
      const elCenterX = rect.left + rect.width / 2
      const dist = Math.hypot(elCenterX - centerX, elCenterY - centerY)

      if (dist < minDistance) {
        minDistance = dist
        const id = el.getAttribute('data-emotion-id')
        const found = quadrantEmotions.find((e) => e.id === id)
        if (found) closestEmotion = found
      }
    })

    if (closestEmotion && (closestEmotion as EmotionEntry).id !== focusedEmotion?.id) {
      setFocusedEmotion(closestEmotion)
      triggerHaptic('selection')
    }
  }, [quadrantEmotions, focusedEmotion])

  if (!isOpen) return null

  const handleSelectQuadrant = (q: EmotionQuadrant) => {
    triggerHaptic('light')
    setSelectedQuadrant(q)
    setActiveStep('word_cloud')
  }

  const handleConfirm = () => {
    if (!focusedEmotion) return
    triggerHaptic('success')
    onConfirmFeeling(focusedEmotion)
    onClose()
  }

  const activeCfg = QUADRANT_CONFIGS[selectedQuadrant]

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-slate-950/98 dark:bg-slate-950/98 text-white backdrop-blur-2xl animate-in fade-in duration-200 overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TOP APP BAR */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <div
        className={`px-4 sm:px-6 py-3.5 flex items-center justify-between border-b ${
          isDaylight ? 'bg-white border-slate-200' : 'bg-slate-950/80 border-white/10'
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
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Close and enter sliders manually"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Center Title */}
        <span
          className={`text-xs font-mono font-bold uppercase tracking-wider ${
            isDaylight ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          {activeStep === 'quadrant_picker' ? 'Daily Feeling Check-in' : activeCfg.label}
        </span>

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
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
            <p className="text-xs text-slate-400">
              Select an emotional quadrant to explore specific feelings
            </p>
          </div>

          {/* 4 Overlapping Circular Lobes with Vivid Color Gradients */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 my-auto flex items-center justify-center">
            {/* Top-Left: High Energy Unpleasant (Red/Orange) */}
            <div
              onClick={() => handleSelectQuadrant('high_energy_unpleasant')}
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

            {/* Top-Right: High Energy Pleasant (Golden Yellow) */}
            <div
              onClick={() => handleSelectQuadrant('high_energy_pleasant')}
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

            {/* Bottom-Left: Low Energy Unpleasant (Muted Blue/Indigo) */}
            <div
              onClick={() => handleSelectQuadrant('low_energy_unpleasant')}
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

            {/* Bottom-Right: Low Energy Pleasant (Luminous Green/Mint) */}
            <div
              onClick={() => handleSelectQuadrant('low_energy_pleasant')}
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
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer underline underline-offset-4"
            >
              Skip to manual sliders (enter numbers directly)
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* STEP 2: INTERACTIVE FISHEYE WORD CLOUD */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {activeStep === 'word_cloud' && (
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Scrollable Bubble Field with Magnification */}
          <div
            ref={cloudContainerRef}
            onScroll={handleCloudScroll}
            className="flex-1 overflow-y-auto px-4 pt-12 pb-44 flex flex-wrap items-center justify-center gap-3.5 sm:gap-5 content-center select-none"
          >
            {quadrantEmotions.map((emotion, index) => {
              const isFocused = focusedEmotion?.id === emotion.id
              const isHovered = hoveredEmotionId === emotion.id

              // Smooth gradient variation across emotions in the quadrant
              let bubbleStyle = ''
              if (selectedQuadrant === 'high_energy_pleasant') {
                bubbleStyle =
                  index % 3 === 0
                    ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950'
                    : index % 3 === 1
                    ? 'bg-gradient-to-br from-yellow-300 to-amber-400 text-slate-950'
                    : 'bg-gradient-to-br from-yellow-400 to-lime-400 text-slate-950'
              } else if (selectedQuadrant === 'low_energy_pleasant') {
                bubbleStyle =
                  index % 3 === 0
                    ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-slate-950'
                    : index % 3 === 1
                    ? 'bg-gradient-to-br from-green-300 to-teal-400 text-slate-950'
                    : 'bg-gradient-to-br from-teal-400 to-emerald-400 text-slate-950'
              } else if (selectedQuadrant === 'low_energy_unpleasant') {
                bubbleStyle =
                  index % 3 === 0
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                    : index % 3 === 1
                    ? 'bg-gradient-to-br from-sky-400 to-blue-500 text-slate-950'
                    : 'bg-gradient-to-br from-indigo-400 to-sky-500 text-white'
              } else {
                bubbleStyle =
                  index % 3 === 0
                    ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white'
                    : index % 3 === 1
                    ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white'
                    : 'bg-gradient-to-br from-orange-500 to-rose-400 text-slate-950'
              }

              return (
                <div
                  key={emotion.id}
                  data-emotion-id={emotion.id}
                  onMouseEnter={() => {
                    setHoveredEmotionId(emotion.id)
                    setFocusedEmotion(emotion)
                    triggerHaptic('selection')
                  }}
                  onMouseLeave={() => setHoveredEmotionId(null)}
                  onClick={() => {
                    triggerHaptic('selection')
                    setFocusedEmotion(emotion)
                  }}
                  className={`rounded-full flex items-center justify-center p-3 text-center cursor-pointer transition-all duration-300 ease-out shadow-lg ${bubbleStyle} ${
                    isFocused || isHovered
                      ? 'w-28 h-28 sm:w-32 sm:h-32 scale-125 z-20 ring-4 ring-white/70 shadow-2xl font-black'
                      : 'w-20 h-20 sm:w-24 sm:h-24 scale-100 opacity-85 hover:opacity-100 font-bold'
                  }`}
                >
                  <span className="font-serif text-xs sm:text-sm tracking-tight leading-tight line-clamp-2 px-1">
                    {emotion.name}
                  </span>
                </div>
              )
            })}
          </div>

          {/* ─────────────────────────────────────────────────────────────────────── */}
          {/* FLOATING BOTTOM DEFINITION CARD */}
          {/* ─────────────────────────────────────────────────────────────────────── */}
          {focusedEmotion && (
            <div className="absolute bottom-5 left-4 right-4 max-w-md mx-auto z-30">
              <div
                className={`p-4 sm:p-5 rounded-3xl border shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-3 ${
                  isDaylight
                    ? 'bg-white/95 border-slate-300 text-slate-900 shadow-slate-400/30'
                    : 'bg-slate-900/95 border-white/20 text-white shadow-black/80'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-serif font-bold text-base sm:text-lg tracking-tight"
                      style={{ color: activeCfg.baseColorHex }}
                    >
                      {focusedEmotion.name}
                    </span>
                    <span className="text-[10px] font-mono opacity-70 px-2 py-0.5 rounded-full border border-current">
                      {activeCfg.filterLabel}
                    </span>
                  </div>

                  <p
                    className={`text-xs mt-1 leading-snug line-clamp-2 ${
                      isDaylight ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    {focusedEmotion.definition}
                  </p>
                </div>

                {/* White Circular Action Button */}
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="w-12 h-12 rounded-full bg-white text-black hover:bg-slate-200 active:scale-90 transition-all flex items-center justify-center shrink-0 shadow-xl cursor-pointer"
                  title="Confirm this feeling"
                >
                  <ArrowRight size={20} strokeWidth={2.5} />
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
                  className="text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
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
        initialQuadrant={activeStep === 'word_cloud' ? selectedQuadrant : null}
        onClose={() => setIsSearchOpen(false)}
        onSelectEmotion={(emotion) => {
          setSelectedQuadrant(emotion.quadrant)
          setFocusedEmotion(emotion)
          setActiveStep('word_cloud')
        }}
      />
    </div>
  )
}
