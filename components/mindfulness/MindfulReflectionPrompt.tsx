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
        background: 'linear-gradient(to bottom, rgba(66, 136, 186, 0.36) 0%, rgba(104, 151, 195, 0.28) 12%, rgba(142, 169, 203, 0.22) 24%, rgba(176, 182, 208, 0.18) 36%, rgba(205, 194, 206, 0.18) 48%, rgba(234, 206, 199, 0.22) 58%, rgba(237, 195, 136, 0.28) 70%, rgba(241, 166, 72, 0.36) 82%, rgba(240, 147, 46, 0.44) 92%, rgba(203, 89, 50, 0.52) 100%), #0b1120',
        borderColor: 'rgba(241, 166, 72, 0.35)',
        boxShadow: '0 0 30px rgba(241, 166, 72, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
      } : {
        background: 'linear-gradient(to bottom, rgba(15, 13, 50, 0.95) 0%, rgba(35, 20, 70, 0.88) 18%, rgba(65, 28, 88, 0.78) 38%, rgba(105, 38, 96, 0.65) 58%, rgba(155, 55, 90, 0.52) 78%, rgba(195, 75, 78, 0.42) 90%, rgba(221, 95, 66, 0.38) 100%)',
        borderColor: 'rgba(168, 62, 85, 0.35)',
        boxShadow: '0 0 30px rgba(125, 47, 95, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
      }}
    >
      {/* Ambient Glow Accents */}
      {isMorning ? (
        <>
          <div
            className="absolute -top-16 -left-16 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-25"
            style={{ background: '#4288BA' }}
          />
          <div
            className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-25"
            style={{ background: '#CB5932' }}
          />
        </>
      ) : (
        <>
          <div
            className="absolute -top-16 -left-16 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-30"
            style={{ background: '#2B1B55' }}
          />
          <div
            className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-25"
            style={{ background: '#DD5F42' }}
          />
        </>
      )}

      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center shadow-inner"
            style={isMorning ? {
              background: 'linear-gradient(to bottom, rgba(66, 136, 186, 0.45) 0%, rgba(241, 166, 72, 0.45) 100%)',
              borderColor: 'rgba(241, 166, 72, 0.4)',
              color: '#FDE68A'
            } : {
              background: 'linear-gradient(to bottom, rgba(43, 27, 85, 0.7) 0%, rgba(125, 47, 95, 0.6) 100%)',
              borderColor: 'rgba(168, 62, 85, 0.4)',
              color: '#FECDD3'
            }}
          >
            {isMorning ? <Sunrise size={15} /> : <Moon size={15} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-black uppercase tracking-wider ${
                  isMorning ? 'text-amber-200' : 'text-rose-200'
                }`}
              >
                {isMorning ? 'Morning Mindfulness & Presence' : 'Evening Decompression & Reflection'}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
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
                  ? 'bg-gradient-to-r from-sky-500 to-amber-500 text-slate-950 border-amber-300 animate-pulse'
                  : 'bg-gradient-to-r from-rose-500 to-amber-500 text-white border-rose-400 animate-pulse'
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
      <div className="relative pl-3.5 sm:pl-4">
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
          style={isMorning ? {
            background: 'linear-gradient(to bottom, #4288BA 0%, #8EA9CB 22%, #CDC2CE 42%, #EDC388 64%, #F1A648 84%, #CB5932 100%)'
          } : {
            background: 'linear-gradient(to bottom, #0F0D32 0%, #2B1B55 18%, #53235E 36%, #7D2F5F 55%, #A83E55 75%, #DD5F42 100%)'
          }}
        />
        <p
          className={`text-xs sm:text-[13px] leading-relaxed font-sans font-medium tracking-normal select-text ${
            isMorning ? 'text-amber-50/95' : 'text-slate-100/95'
          }`}
        >
          {prompt}
        </p>
      </div>
    </div>
  )
}
