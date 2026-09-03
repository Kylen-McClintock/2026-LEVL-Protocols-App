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
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 p-4 sm:p-5 ${className}`}
      style={isMorning ? {
        background: 'linear-gradient(to bottom, #295b82 0%, #3a6d96 14%, #547fa6 28%, #798fb1 42%, #a39bb7 56%, #c89c9e 70%, #e2956f 84%, #cb5932 100%)',
        borderColor: 'rgba(251, 191, 36, 0.45)',
        boxShadow: '0 8px 32px rgba(203, 89, 50, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      } : {
        background: 'linear-gradient(to bottom, #0f0d32 0%, #1a1343 14%, #2e1850 28%, #4b1e5e 44%, #6e2664 60%, #962f5e 74%, #ba4353 86%, #dd5f42 100%)',
        borderColor: 'rgba(244, 63, 94, 0.45)',
        boxShadow: '0 8px 32px rgba(221, 95, 66, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
      }}
    >
      {/* Ambient Glow Accents */}
      {isMorning ? (
        <>
          <div
            className="absolute -top-16 -left-16 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-40"
            style={{ background: '#4288BA' }}
          />
          <div
            className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-35"
            style={{ background: '#CB5932' }}
          />
        </>
      ) : (
        <>
          <div
            className="absolute -top-16 -left-16 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-40"
            style={{ background: '#2B1B55' }}
          />
          <div
            className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-35"
            style={{ background: '#DD5F42' }}
          />
        </>
      )}

      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center shadow-inner border"
            style={isMorning ? {
              background: 'rgba(0, 0, 0, 0.35)',
              borderColor: 'rgba(254, 240, 138, 0.4)',
              color: '#FEF08A'
            } : {
              background: 'rgba(0, 0, 0, 0.35)',
              borderColor: 'rgba(254, 205, 211, 0.4)',
              color: '#FECDD3'
            }}
          >
            {isMorning ? <Sunrise size={15} /> : <Moon size={15} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-white drop-shadow-sm">
                {isMorning ? 'Morning Mindfulness & Presence' : 'Evening Decompression & Reflection'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Take a Breath Button */}
          <button
            type="button"
            onClick={toggleBreathing}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-sm ${
              isBreathing
                ? isMorning
                  ? 'bg-amber-400 text-slate-950 border-white animate-pulse font-extrabold'
                  : 'bg-rose-400 text-slate-950 border-white animate-pulse font-extrabold'
                : 'bg-black/35 hover:bg-black/50 border-white/20 text-white hover:text-white'
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
            className="p-1.5 rounded-lg text-white/80 hover:text-white bg-black/35 hover:bg-black/50 border border-white/20 transition-colors cursor-pointer active:scale-95 shadow-sm"
            title="Cycle to next reflection prompt"
          >
            <RotateCcw size={12} className="hover:rotate-180 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {/* Guided Breath Animation Overlay (When active) */}
      {isBreathing && (
        <div className="my-2 p-2.5 rounded-xl bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-between animate-in fade-in shadow-lg">
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

      {/* Reflection Prompt Text with Frosted Dark Plate for Crisp Readability */}
      <div className="relative pl-3.5 sm:pl-4 p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-inner">
        <div
          className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
          style={isMorning ? {
            background: 'linear-gradient(to bottom, #4288BA 0%, #8EA9CB 22%, #CDC2CE 42%, #EDC388 64%, #F1A648 84%, #CB5932 100%)'
          } : {
            background: 'linear-gradient(to bottom, #0F0D32 0%, #2B1B55 18%, #53235E 36%, #7D2F5F 55%, #A83E55 75%, #DD5F42 100%)'
          }}
        />
        <p className="text-xs sm:text-[13px] leading-relaxed font-sans font-medium tracking-normal text-white drop-shadow-sm select-text">
          {prompt}
        </p>
      </div>
    </div>
  )
}
