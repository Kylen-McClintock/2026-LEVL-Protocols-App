'use client'

import React, { useState, useEffect } from 'react'
import { Sunrise, Moon, RotateCcw, Sparkles, Wind, Quote } from 'lucide-react'
import { getMindfulnessPrompt } from '@/lib/data/mindfulnessPrompts'
import { triggerHaptic } from '@/lib/utils/haptics'
import { useTheme } from '@/lib/utils/useTheme'

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
  const { theme } = useTheme()
  const isDaylight = theme === 'light'
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
        background: isDaylight
          ? 'linear-gradient(to bottom, rgba(66, 136, 186, 0.16) 0%, rgba(142, 169, 203, 0.12) 22%, rgba(205, 194, 206, 0.10) 42%, rgba(237, 195, 136, 0.18) 64%, rgba(241, 166, 72, 0.24) 84%, rgba(203, 89, 50, 0.20) 100%), #ffffff'
          : 'linear-gradient(to bottom, rgba(66, 136, 186, 0.36) 0%, rgba(104, 151, 195, 0.28) 12%, rgba(142, 169, 203, 0.22) 24%, rgba(176, 182, 208, 0.18) 36%, rgba(205, 194, 206, 0.18) 48%, rgba(234, 206, 199, 0.22) 58%, rgba(237, 195, 136, 0.28) 70%, rgba(241, 166, 72, 0.36) 82%, rgba(240, 147, 46, 0.44) 92%, rgba(203, 89, 50, 0.52) 100%), #0b1120',
        borderColor: isDaylight ? 'rgba(241, 166, 72, 0.45)' : 'rgba(241, 166, 72, 0.35)',
        boxShadow: isDaylight
          ? '0 4px 20px rgba(241, 166, 72, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
          : '0 0 30px rgba(241, 166, 72, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
      } : {
        background: isDaylight
          ? 'linear-gradient(to bottom, rgba(43, 27, 85, 0.14) 0%, rgba(125, 47, 95, 0.12) 50%, rgba(221, 95, 66, 0.14) 100%), #ffffff'
          : 'linear-gradient(to bottom, rgba(15, 13, 50, 0.95) 0%, rgba(35, 20, 70, 0.88) 18%, rgba(65, 28, 88, 0.78) 38%, rgba(105, 38, 96, 0.65) 58%, rgba(155, 55, 90, 0.52) 78%, rgba(195, 75, 78, 0.42) 90%, rgba(221, 95, 66, 0.38) 100%)',
        borderColor: isDaylight ? 'rgba(244, 63, 94, 0.35)' : 'rgba(168, 62, 85, 0.35)',
        boxShadow: isDaylight
          ? '0 4px 20px rgba(244, 63, 94, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
          : '0 0 30px rgba(125, 47, 95, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
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
            className="w-7 h-7 rounded-xl flex items-center justify-center shadow-inner border"
            style={isMorning ? {
              background: isDaylight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.35)',
              borderColor: isDaylight ? 'rgba(241, 166, 72, 0.5)' : 'rgba(254, 240, 138, 0.4)',
              color: isDaylight ? '#D97706' : '#FEF08A'
            } : {
              background: isDaylight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.35)',
              borderColor: isDaylight ? 'rgba(244, 63, 94, 0.5)' : 'rgba(254, 205, 211, 0.4)',
              color: isDaylight ? '#E11D48' : '#FECDD3'
            }}
          >
            {isMorning ? <Sunrise size={15} /> : <Moon size={15} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-black uppercase tracking-wider ${
                isDaylight ? 'text-slate-900' : 'text-white drop-shadow-sm'
              }`}>
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
                  ? 'bg-amber-400 text-slate-950 border-amber-300 animate-pulse font-extrabold shadow-md'
                  : 'bg-rose-400 text-slate-950 border-rose-300 animate-pulse font-extrabold shadow-md'
                : isDaylight
                  ? 'bg-white/95 hover:bg-white text-slate-900 border-amber-300/80 shadow-sm font-bold'
                  : 'bg-white/10 hover:bg-white/20 border-white/25 text-white shadow-sm font-bold'
            }`}
            title="Take a 12-second mindful breath before checking in"
          >
            <Wind size={11} className={isBreathing ? 'text-slate-950' : isDaylight ? 'text-amber-700' : 'text-amber-300'} />
            <span className={isBreathing ? 'text-slate-950' : isDaylight ? 'text-slate-900 font-bold' : 'text-white font-bold'}>
              {isBreathing ? `${breathPhase} (${breathSeconds}s)` : 'Pause & Breathe'}
            </span>
          </button>

          {/* Cycle Next Prompt Button */}
          <button
            type="button"
            onClick={handleNextPrompt}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer active:scale-95 shadow-sm ${
              isDaylight
                ? 'bg-white/95 hover:bg-white text-slate-700 hover:text-slate-950 border-amber-300/80'
                : 'bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border-white/25'
            }`}
            title="Cycle to next reflection prompt"
          >
            <RotateCcw size={12} className="hover:rotate-180 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {/* Guided Breath Animation Overlay (When active) */}
      {isBreathing && (
        <div className={`my-2 p-2.5 rounded-xl backdrop-blur-md border flex items-center justify-between animate-in fade-in shadow-lg ${
          isDaylight ? 'bg-white/95 border-amber-300/80' : 'bg-black/50 border-white/15'
        }`}>
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
            <span className={`text-xs font-mono font-bold lowercase tracking-wider transition-all duration-700 ${
              isDaylight ? 'text-slate-800' : 'text-white'
            } ${breathSeconds <= 2 ? 'opacity-0 -translate-y-0.5' : 'opacity-100 translate-y-0'}`}>
              {breathPhase === 'inhale' ? 'inhale' : breathPhase === 'hold' ? 'hold' : 'exhale'}
            </span>
          </div>
          <span className="text-xs font-mono font-black text-amber-500">
            {breathSeconds}s
          </span>
        </div>
      )}

      {/* Reflection Prompt Text with Frosted Plate for Crisp Readability */}
      <div className={`relative pl-3.5 sm:pl-4 p-3 rounded-xl border ${
        isDaylight
          ? 'bg-white/95 border-slate-200 shadow-sm'
          : 'bg-black/45 border-white/15 shadow-inner'
      }`}>
        <div
          className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full shadow-sm"
          style={isMorning ? {
            background: 'linear-gradient(to bottom, #4288BA 0%, #8EA9CB 22%, #CDC2CE 42%, #EDC388 64%, #F1A648 84%, #CB5932 100%)'
          } : {
            background: 'linear-gradient(to bottom, #0F0D32 0%, #2B1B55 18%, #53235E 36%, #7D2F5F 55%, #A83E55 75%, #DD5F42 100%)'
          }}
        />
        <p className={`text-xs sm:text-[13px] leading-relaxed font-sans font-medium tracking-normal select-text ${
          isDaylight ? 'text-slate-800' : 'text-slate-100 drop-shadow-sm'
        }`}>
          {prompt}
        </p>
      </div>
    </div>
  )
}
