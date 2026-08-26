'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Zap, Play, RotateCcw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'

interface ReactionTimeAppletProps {
  onComplete?: (medianMs: number, trialValues: number[]) => void
  onCancel?: () => void
}

type TestState = 'idle' | 'waiting' | 'ready' | 'early' | 'complete'

export default function ReactionTimeApplet({ onComplete, onCancel }: ReactionTimeAppletProps) {
  const [testState, setTestState] = useState<TestState>('idle')
  const [trials, setTrials] = useState<number[]>([])
  const [currentTrialMs, setCurrentTrialMs] = useState<number | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<string>('')
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)

  const TOTAL_TRIALS = 5

  const startNextTrial = () => {
    setTestState('waiting')
    setFeedbackMsg('Wait for the green flash...')
    
    // Random delay between 1500ms and 4500ms
    const randomDelay = Math.floor(Math.random() * 3000) + 1500

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      setTestState('ready')
      startTimeRef.current = performance.now()
      setFeedbackMsg('TAP NOW!')
    }, randomDelay)
  }

  const handleContainerClick = () => {
    if (testState === 'idle') {
      setTrials([])
      startNextTrial()
    } else if (testState === 'waiting') {
      // Early tap false start
      if (timerRef.current) clearTimeout(timerRef.current)
      setTestState('early')
      setFeedbackMsg('Too early! Wait for the screen to turn green.')
    } else if (testState === 'ready' && startTimeRef.current !== null) {
      const elapsedMs = Math.round(performance.now() - startTimeRef.current)
      
      if (elapsedMs < 100) {
        setTestState('early')
        setFeedbackMsg('Anticipation tap (< 100ms). Try again.')
        return
      }

      setCurrentTrialMs(elapsedMs)
      const updatedTrials = [...trials, elapsedMs]
      setTrials(updatedTrials)

      if (updatedTrials.length >= TOTAL_TRIALS) {
        setTestState('complete')
        const sorted = [...updatedTrials].sort((a, b) => a - b)
        const median = sorted[Math.floor(sorted.length / 2)]
        if (onComplete) onComplete(median, updatedTrials)
      } else {
        setTestState('idle')
        setFeedbackMsg(`Trial ${updatedTrials.length}/${TOTAL_TRIALS} done: ${elapsedMs} ms. Tap to start trial ${updatedTrials.length + 1}.`)
      }
    } else if (testState === 'early') {
      setTestState('idle')
      setFeedbackMsg('Tap screen to retry trial.')
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const sortedTrials = [...trials].sort((a, b) => a - b)
  const medianMs = sortedTrials.length > 0 ? sortedTrials[Math.floor(sortedTrials.length / 2)] : 0
  const meanMs = trials.length > 0 ? Math.round(trials.reduce((a, b) => a + b, 0) / trials.length) : 0

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Test Interactive Canvas */}
      <div 
        onClick={handleContainerClick}
        className={`w-full min-h-[320px] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer select-none transition-all duration-300 relative overflow-hidden shadow-2xl border ${
          testState === 'waiting'
            ? 'bg-slate-900 border-red-500/30 text-red-200'
            : testState === 'ready'
            ? 'bg-emerald-500 border-emerald-400 text-black animate-pulse'
            : testState === 'early'
            ? 'bg-amber-950/80 border-amber-500/50 text-amber-200'
            : testState === 'complete'
            ? 'bg-gradient-to-br from-indigo-950/90 to-purple-950/90 border-indigo-500/40 text-white'
            : 'bg-black/60 border-white/10 text-white hover:border-levl-accent/50'
        }`}
      >
        {/* Glow effect */}
        {testState === 'ready' && (
          <div className="absolute inset-0 bg-emerald-400/20 blur-xl animate-ping pointer-events-none" />
        )}

        {testState === 'idle' && (
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Zap size={32} />
            </div>
            <h3 className="text-xl font-bold">Visual Reaction Time Test</h3>
            <p className="text-sm text-gray-300 max-w-xs mx-auto">
              {trials.length === 0 
                ? 'Tap anywhere to begin. When screen turns green, tap as fast as possible.'
                : feedbackMsg}
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-wider">
              <Play size={14} fill="currentColor" /> {trials.length === 0 ? 'Start Test (5 Trials)' : `Next Trial (${trials.length + 1}/${TOTAL_TRIALS})`}
            </div>
          </div>
        )}

        {testState === 'waiting' && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400 animate-pulse">
              <div className="w-4 h-4 rounded-full bg-red-500" />
            </div>
            <p className="text-lg font-bold text-red-300">Wait for green...</p>
            <p className="text-xs text-red-400/70">Do not tap yet!</p>
          </div>
        )}

        {testState === 'ready' && (
          <div className="space-y-2">
            <h2 className="text-4xl font-extrabold tracking-widest text-black uppercase">TAP NOW!</h2>
          </div>
        )}

        {testState === 'early' && (
          <div className="space-y-3">
            <AlertCircle size={40} className="mx-auto text-amber-400" />
            <p className="text-base font-bold text-amber-300">{feedbackMsg}</p>
            <p className="text-xs text-amber-400/70">Tap screen to restart trial</p>
          </div>
        )}

        {testState === 'complete' && (
          <div className="space-y-4">
            <CheckCircle2 size={48} className="mx-auto text-emerald-400" />
            <div className="space-y-1">
              <h3 className="text-2xl font-black">Test Complete!</h3>
              <p className="text-xs text-gray-300">5 Valid Trials Recorded</p>
            </div>
            <div className="flex items-center justify-center gap-6 pt-2">
              <div className="text-center">
                <span className="text-3xl font-extrabold text-emerald-400">{medianMs} ms</span>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Median Latency</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <span className="text-xl font-bold text-indigo-300">{meanMs} ms</span>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Mean Latency</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trial breakdown bar */}
      {trials.length > 0 && (
        <div className="glass-card p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Trial Progress ({trials.length}/{TOTAL_TRIALS})</span>
            {testState === 'complete' && (
              <button 
                onClick={() => {
                  setTrials([])
                  setTestState('idle')
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
              >
                <RotateCcw size={12} /> Retake Test
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4].map(idx => {
              const val = trials[idx]
              return (
                <div 
                  key={idx}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    val !== undefined 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold' 
                      : 'bg-white/5 border-white/5 text-gray-600 text-[10px]'
                  }`}
                >
                  {val !== undefined ? `${val}ms` : `Trial ${idx + 1}`}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
