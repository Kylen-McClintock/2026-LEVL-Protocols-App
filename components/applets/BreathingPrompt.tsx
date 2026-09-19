'use client'

import React, { useState, useEffect, useRef } from 'react'

export type BreathPromptWord = 'Inhale' | 'Hold' | 'Exhale' | string

export interface BreathingPromptProps {
  /** The primary breath prompt word (simplified to 'Inhale' | 'Hold' | 'Exhale') */
  word: BreathPromptWord
  /** Optional secondary context or subtle subtitle (kept minimal) */
  subtext?: string
  /** Accent glow color family */
  glowColor?: 'cyan' | 'purple' | 'emerald' | 'blue' | 'indigo' | 'amber' | string
  /** Duration in milliseconds of the fade out & fade in transition (default 240ms) */
  fadeDurationMs?: number
  /** Additional container styling */
  className?: string
  /** Additional text typography styling */
  textClassName?: string
}

const GLOW_MAP: Record<string, string> = {
  cyan: 'drop-shadow-[0_0_25px_rgba(6,182,212,0.85)] text-cyan-50',
  emerald: 'drop-shadow-[0_0_25px_rgba(16,185,129,0.85)] text-emerald-50',
  purple: 'drop-shadow-[0_0_25px_rgba(168,85,247,0.85)] text-purple-50',
  blue: 'drop-shadow-[0_0_25px_rgba(59,130,246,0.85)] text-blue-50',
  indigo: 'drop-shadow-[0_0_25px_rgba(99,102,241,0.85)] text-indigo-50',
  amber: 'drop-shadow-[0_0_25px_rgba(245,158,11,0.85)] text-amber-50'
}

/**
 * Standardized Breathwork Phase Prompt Component.
 * Used across all existing and future breathing applets.
 *
 * Features:
 * - Strictly simplified wording: "Inhale", "Hold", "Exhale"
 * - Stays visible throughout the entire breathwork session
 * - Smooth fade-out and fade-in transitions between phase shifts
 * - Zero layout shift or text jumping
 */
export default function BreathingPrompt({
  word,
  subtext,
  glowColor = 'cyan',
  fadeDurationMs = 240,
  className = '',
  textClassName = ''
}: BreathingPromptProps) {
  const [displayedWord, setDisplayedWord] = useState<string>(word)
  const [displayedSubtext, setDisplayedSubtext] = useState<string | undefined>(subtext)
  const [displayedGlow, setDisplayedGlow] = useState<string>(glowColor)
  const [isFading, setIsFading] = useState<boolean>(false)

  const fadeOutTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fadeInTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // If the word, subtext, and glow haven't changed, do nothing
    if (word === displayedWord && subtext === displayedSubtext && glowColor === displayedGlow) {
      return
    }

    // 1. Begin smooth Fade-Out
    setIsFading(true)

    if (fadeOutTimeoutRef.current) clearTimeout(fadeOutTimeoutRef.current)
    if (fadeInTimeoutRef.current) clearTimeout(fadeInTimeoutRef.current)

    // 2. Once faded out (at fadeDurationMs), switch displayed text and color
    fadeOutTimeoutRef.current = setTimeout(() => {
      setDisplayedWord(word)
      setDisplayedSubtext(subtext)
      setDisplayedGlow(glowColor)

      // 3. Trigger smooth Fade-In on next frame
      fadeInTimeoutRef.current = setTimeout(() => {
        setIsFading(false)
      }, 20)
    }, fadeDurationMs)

    return () => {
      if (fadeOutTimeoutRef.current) clearTimeout(fadeOutTimeoutRef.current)
      if (fadeInTimeoutRef.current) clearTimeout(fadeInTimeoutRef.current)
    }
  }, [word, subtext, glowColor, displayedWord, displayedSubtext, displayedGlow, fadeDurationMs])

  const glowClass = GLOW_MAP[displayedGlow] || GLOW_MAP.cyan

  return (
    <div
      className={`min-h-[72px] flex flex-col items-center justify-center text-center select-none ${className}`}
      aria-live="polite"
    >
      <div
        style={{
          transition: `opacity ${fadeDurationMs}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${fadeDurationMs}ms cubic-bezier(0.4, 0, 0.2, 1), filter ${fadeDurationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`
        }}
        className={`transform flex flex-col items-center ${
          isFading
            ? 'opacity-0 scale-95 blur-[2px]'
            : 'opacity-100 scale-100 blur-0'
        }`}
      >
        <h2
          className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.2em] uppercase ${glowClass} ${textClassName}`}
        >
          {displayedWord}
        </h2>

        {displayedSubtext && (
          <p className="mt-1 text-xs font-mono tracking-wider text-gray-300/80">
            {displayedSubtext}
          </p>
        )}
      </div>
    </div>
  )
}
