'use client'

import React, { useState, useEffect } from 'react'
import { Sunrise, Moon, RotateCcw, Sparkles, Wind, Quote } from 'lucide-react'
import { getMindfulnessPrompt } from '@/lib/data/mindfulnessPrompts'
import { triggerHaptic } from '@/lib/utils/haptics'

interface MindfulReflectionPromptProps {
  mode: 'morning' | 'evening'
  date?: Date
  className?: string
}

export default function MindfulReflectionPrompt({
  mode,
  date = new Date(),
  className = ''
}: MindfulReflectionPromptProps) {
  const [cycleOffset, setCycleOffset] = useState(0)
  const [isBreathing, setIsBreathing] = useState(false)
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')
  const [breathSeconds, setBreathSeconds] = useState(4)

  const { prompt, index, total } = getMindfulnessPrompt(mode, date, cycleOffset)

  const isMorning = mode === 'morning'

  // Calming guided breath timer
  useEffect(() => {
    if (!isBreathing) return

    const phases: Array<'inhale' | 'hold' | 'exhale'> = ['inhale', 'hold', 'exhale']
    let currentPhaseIdx = 0
    setBreathPhase('inhale')
    setBreathSeconds(4)

    const interval = setInterval(() => {
      setBreathSeconds(prev => {
        if (prev <= 1) {
          currentPhaseIdx = (currentPhaseIdx + 1) % phases.length
          setBreathPhase(phases[currentPhaseIdx])
          triggerHaptic('selection')
          return 4
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isBreathing])

  const handleNextPrompt = (e: React.MouseEvent) => {
    e.stopPropagation()
    triggerHaptic('light')
    setCycleOffset(prev => prev + 1)
  }

  const toggleBreathing = (e: React.MouseEvent) => {
    e.stopPropagation()
    triggerHaptic('medium')
    setIsBreathing(prev => !prev)
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 p-4 sm:p-5 ${
        isMorning
          ? 'bg-gradient-to-br from-amber-950/30 via-slate-950/70 to-slate-950/90 border-amber-500/25 shadow-[0_0_25px_rgba(245,158,11,0.12)]'
          : 'bg-gradient-to-br from-rose-950/30 via-purple-950/20 to-slate-950/90 border-rose-500/25 shadow-[0_0_25px_rgba(244,63,94,0.12)]'
      } ${className}`}
    >
      {/* Subtle Background Glow Accent */}
      <div
        className={`absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isMorning ? 'bg-amber-400' : 'bg-rose-400'
        }`}
      />

      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shadow-inner ${
              isMorning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            {isMorning ? <Sunrise size={15} /> : <Moon size={15} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-black uppercase tracking-wider ${
                  isMorning ? 'text-amber-300' : 'text-rose-300'
                }`}
              >
                {isMorning ? 'Morning Mindfulness & Presence' : 'Evening Decompression & Reflection'}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                {index}/{total}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Take a Breath Button */}
          <button
            type="button"
            onClick={toggleBreathing}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              isBreathing
                ? isMorning
                  ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                  : 'bg-rose-500 text-white border-rose-400 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
            }`}
            title="Take a 12-second mindful breath before checking in"
          >
            <Wind size={11} />
            <span>{isBreathing ? `${breathPhase.toUpperCase()} (${breathSeconds}s)` : 'Pause & Breathe'}</span>
          </button>

          {/* Cycle Next Prompt Button */}
          <button
            type="button"
            onClick={handleNextPrompt}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer active:scale-95"
            title="Cycle to next reflection prompt"
          >
            <RotateCcw size={12} className="hover:rotate-180 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {/* Guided Breath Animation Overlay (When active) */}
      {isBreathing && (
        <div className="my-2 p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full transition-all duration-1000 ${
                breathPhase === 'inhale'
                  ? 'scale-150 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                  : breathPhase === 'hold'
                  ? 'scale-125 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                  : 'scale-75 bg-indigo-400 opacity-60'
              }`}
            />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              {breathPhase === 'inhale' ? 'Inhale slowly through nose' : breathPhase === 'hold' ? 'Hold softly and notice' : 'Slow smooth exhale'}
            </span>
          </div>
          <span className="text-xs font-mono font-black text-amber-300">
            {breathSeconds}s
          </span>
        </div>
      )}

      {/* Reflection Prompt Text */}
      <div className="relative pl-3 sm:pl-3.5 border-l-2 border-gradient">
        <div
          className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-full ${
            isMorning ? 'bg-gradient-to-b from-amber-400 to-amber-600' : 'bg-gradient-to-b from-rose-400 to-purple-500'
          }`}
        />
        <p
          className={`text-xs sm:text-[13px] leading-relaxed font-sans sm:font-sans font-medium tracking-normal text-slate-200 select-text ${
            isMorning ? 'text-amber-100/95' : 'text-rose-100/95'
          }`}
        >
          {prompt}
        </p>
      </div>
    </div>
  )
}
