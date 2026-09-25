'use client'

import React, { useState, useEffect, useRef } from 'react'

export type BreathPromptWord = 'inhale' | 'hold' | 'exhale' | 'Inhale' | 'Hold' | 'Exhale' | string

export interface BreathingPromptProps {
  /** The primary breath prompt word (strictly simplified to 'inhale' | 'hold' | 'exhale') */
  word: BreathPromptWord
  /** Optional secondary context or subtle subtitle */
  subtext?: string
  /** Accent glow color family */
  glowColor?: 'cyan' | 'purple' | 'emerald' | 'blue' | 'indigo' | 'amber' | string
  /** Duration in milliseconds of the fade in transition (default 450ms) */
  fadeInDurationMs?: number
  /** Backwards-compatible alias for fade transition duration */
  fadeDurationMs?: number
  /** Duration in milliseconds text stays fully visible before fading out (default 1600ms) */
  visibleDurationMs?: number
  /** Duration in milliseconds of the gentle calming fade out (default 850ms) */
  fadeOutDurationMs?: number
  /** Whether to auto-fade out if time permits (default true) */
  autoFadeOut?: boolean
  /** Additional container styling */
  className?: string
  /** Additional text typography styling */
  textClassName?: string
}

const GLOW_MAP: Record<string, string> = {
  cyan: 'drop-shadow-[0_0_25px_rgba(6,182,212,0.70)] text-cyan-50',
  emerald: 'drop-shadow-[0_0_25px_rgba(16,185,129,0.70)] text-emerald-50',
  purple: 'drop-shadow-[0_0_25px_rgba(168,85,247,0.70)] text-purple-50',
  blue: 'drop-shadow-[0_0_25px_rgba(59,130,246,0.70)] text-blue-50',
  indigo: 'drop-shadow-[0_0_25px_rgba(99,102,241,0.70)] text-indigo-50',
  amber: 'drop-shadow-[0_0_25px_rgba(245,158,11,0.70)] text-amber-50'
}

/**
 * Normalizes any breathwork phase strictly to: 'inhale', 'hold', or 'exhale'
 */
export function simplifyBreathWord(rawWord: string): string {
  const lower = (rawWord || '').toLowerCase().trim()
  if (lower.includes('inhale') || lower.includes('fill') || lower.includes('breathe in')) {
    return 'inhale'
  }
  if (lower.includes('hold') || lower.includes('retain') || lower.includes('pause')) {
    return 'hold'
  }
  if (lower.includes('exhale') || lower.includes('release') || lower.includes('empty')) {
    return 'exhale'
  }
  return lower || 'inhale'
}

/**
 * Standardized Calming Breathwork Phase Prompt Component.
 * Used across all breathing applets throughout the LEVL application.
 *
 * Core Principles:
 * 1. Simple, calming text: strictly "inhale, hold, exhale" (lowercase, elegant wide tracking)
 * 2. Dissolve / Fade-Out: If time permits before the next phase, the text fades out
 *    into peaceful negative space to avoid visual fixation and induce deep autonomic calm.
 * 3. Reactive Wakeup: When the next phase triggers, the prompt dissolves in seamlessly.
 */
export default function BreathingPrompt({
  word,
  subtext,
  glowColor = 'cyan',
  fadeInDurationMs = 450,
  fadeDurationMs,
  visibleDurationMs = 1600,
  fadeOutDurationMs = 850,
  autoFadeOut = true,
  className = '',
  textClassName = ''
}: BreathingPromptProps) {
  const effectiveFadeIn = fadeDurationMs || fadeInDurationMs
  const simpleWord = simplifyBreathWord(word)
  const [displayedWord, setDisplayedWord] = useState<string>(simpleWord)
  const [displayedSubtext, setDisplayedSubtext] = useState<string | undefined>(subtext)
  const [displayedGlow, setDisplayedGlow] = useState<string>(glowColor)
  const [isVisible, setIsVisible] = useState<boolean>(true)

  const fadeOutTimerRef = useRef<NodeJS.Timeout | null>(null)
  const switchTimerRef = useRef<NodeJS.Timeout | null>(null)
  const currentSimpleWordRef = useRef<string>(simpleWord)
  const isVisibleRef = useRef<boolean>(true)

  useEffect(() => {
    // If the simplified word hasn't changed, just update glow / subtext
    if (simpleWord === currentSimpleWordRef.current) {
      setDisplayedGlow(glowColor)
      setDisplayedSubtext(subtext)
      return
    }

    currentSimpleWordRef.current = simpleWord

    // Clear any pending timers
    if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current)
    if (switchTimerRef.current) clearTimeout(switchTimerRef.current)

    // If currently visible, do a fast crossfade to the new word
    if (isVisibleRef.current) {
      setIsVisible(false)
      isVisibleRef.current = false
      switchTimerRef.current = setTimeout(() => {
        setDisplayedWord(simpleWord)
        setDisplayedSubtext(subtext)
        setDisplayedGlow(glowColor)
        setIsVisible(true)
        isVisibleRef.current = true

        if (autoFadeOut) {
          fadeOutTimerRef.current = setTimeout(() => {
            setIsVisible(false)
            isVisibleRef.current = false
          }, visibleDurationMs)
        }
      }, 180)
    } else {
      // Already faded out: instantly swap text while hidden and fade in smoothly
      setDisplayedWord(simpleWord)
      setDisplayedSubtext(subtext)
      setDisplayedGlow(glowColor)
      switchTimerRef.current = setTimeout(() => {
        setIsVisible(true)
        isVisibleRef.current = true

        if (autoFadeOut) {
          fadeOutTimerRef.current = setTimeout(() => {
            setIsVisible(false)
            isVisibleRef.current = false
          }, visibleDurationMs)
        }
      }, 30)
    }

    return () => {
      if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current)
      if (switchTimerRef.current) clearTimeout(switchTimerRef.current)
    }
  }, [simpleWord, subtext, glowColor, visibleDurationMs, autoFadeOut])

  // Initial trigger for fade out on mount
  useEffect(() => {
    if (autoFadeOut) {
      fadeOutTimerRef.current = setTimeout(() => {
        setIsVisible(false)
        isVisibleRef.current = false
      }, visibleDurationMs)
    }
    return () => {
      if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current)
    }
  }, [])

  const glowClass = GLOW_MAP[displayedGlow] || GLOW_MAP.cyan
  const activeDuration = isVisible ? effectiveFadeIn : fadeOutDurationMs

  return (
    <div
      className={`min-h-[72px] flex flex-col items-center justify-center text-center select-none keep-white pointer-events-none ${className}`}
      aria-live="polite"
    >
      <div
        style={{
          transition: `opacity ${activeDuration}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${activeDuration}ms cubic-bezier(0.4, 0, 0.2, 1), filter ${activeDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
        }}
        className={`transform flex flex-col items-center will-change-transform ${
          isVisible
            ? 'opacity-100 scale-100 blur-0'
            : 'opacity-0 scale-95 blur-[2px]'
        }`}
      >
        <h2
          className={`text-3xl sm:text-4xl md:text-5xl font-light tracking-[0.25em] lowercase ${glowClass} ${textClassName}`}
        >
          {displayedWord}
        </h2>

        {displayedSubtext && (
          <p className="mt-1 text-xs font-mono tracking-wider text-gray-300/60 lowercase">
            {displayedSubtext}
          </p>
        )}
      </div>
    </div>
  )
}
