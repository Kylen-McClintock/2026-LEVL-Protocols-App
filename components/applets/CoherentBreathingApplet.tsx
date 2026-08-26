'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, X, Volume2, VolumeX, Check, Activity, Waves } from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { saveBatchOutcomeObservations } from '@/lib/data'
import { format } from 'date-fns'

interface CoherentBreathingAppletProps {
  isOpen: boolean
  onClose: () => void
  modalityName?: string
  taskId?: string
  onComplete?: () => void
}

type CoherentPhase = 'INHALE' | 'EXHALE'

const PHASE_DURATIONS: Record<CoherentPhase, number> = {
  INHALE: 5500, // 5.5 seconds inhale
  EXHALE: 5500  // 5.5 seconds exhale
}

const TARGET_SESSION_SECONDS = 600 // 10 Minutes (55 cycles)

export default function CoherentBreathingApplet({
  isOpen,
  onClose,
  modalityName = 'Coherent 5.5s Breathing (Max HRV)',
  taskId,
  onComplete
}: CoherentBreathingAppletProps) {
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [phase, setPhase] = useState<CoherentPhase>('INHALE')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [completedCycles, setCompletedCycles] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [preHrv, setPreHrv] = useState<number>(5)
  const [postHrv, setPostHrv] = useState<number>(9)
  const [step, setStep] = useState<'PRE_CHECK' | 'SESSION' | 'POST_CHECK'>('PRE_CHECK')
  const [isSaving, setIsSaving] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const phaseStartTimeRef = useRef<number>(0)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  // Web Audio Synthesizer (528 Hz Solfeggio + 0.1 Hz Baroreflex Acoustic Pulse)
  const initAudio = () => {
    try {
      if (audioCtxRef.current) return
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      audioCtxRef.current = ctx

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(528, ctx.currentTime) // Solfeggio frequency

      // 0.1 Hz LFO (11 seconds full cycle)
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.frequency.setValueAtTime(0.0909, ctx.currentTime) // 1 / 11s = 0.0909 Hz
      lfoGain.gain.setValueAtTime(0.05, ctx.currentTime)

      lfo.connect(gain.gain)
      osc.connect(gain)
      gain.gain.setValueAtTime(isMuted ? 0 : 0.08, ctx.currentTime)
      gain.connect(ctx.destination)

      osc.start()
      lfo.start()

      gainNodeRef.current = gain
    } catch (err) {
      console.warn('Web Audio context blocked or not supported:', err)
    }
  }

  const playPhaseChime = (freq: number) => {
    if (isMuted || !audioCtxRef.current) return
    try {
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 1.5)
    } catch (err) {}
  }

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev
      if (gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.setValueAtTime(next ? 0 : 0.08, audioCtxRef.current.currentTime)
      }
      return next
    })
  }

  const handleStartSession = () => {
    initAudio()
    setStep('SESSION')
    setIsActive(true)
    setIsPaused(false)
    setElapsedSeconds(0)
    setCompletedCycles(0)
    setPhase('INHALE')
    phaseStartTimeRef.current = performance.now()
  }

  // Timer Tick
  useEffect(() => {
    if (!isActive || isPaused || step !== 'SESSION') return

    const interval = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1
        if (next >= TARGET_SESSION_SECONDS) {
          setIsActive(false)
          setStep('POST_CHECK')
          if (audioCtxRef.current) audioCtxRef.current.suspend()
          return TARGET_SESSION_SECONDS
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, isPaused, step])

  // Canvas Harmonic Liquid Cymatic Ripple Engine (60 FPS)
  useEffect(() => {
    if (step !== 'SESSION') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let lastPhase: CoherentPhase = 'INHALE'

    const render = (now: number) => {
      if (!phaseStartTimeRef.current) phaseStartTimeRef.current = now

      const dpr = window.devicePixelRatio || 1
      const width = window.innerWidth
      const height = window.innerHeight
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)
      }

      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)

      const centerX = width / 2
      const centerY = height / 2
      const baseRadius = Math.min(width, height) * 0.22

      if (!isPaused) {
        const phaseElapsed = now - phaseStartTimeRef.current

        if (lastPhase === 'INHALE' && phaseElapsed >= PHASE_DURATIONS.INHALE) {
          lastPhase = 'EXHALE'
          setPhase('EXHALE')
          phaseStartTimeRef.current = now
          playPhaseChime(396) // Baroreflex release chime
        } else if (lastPhase === 'EXHALE' && phaseElapsed >= PHASE_DURATIONS.EXHALE) {
          lastPhase = 'INHALE'
          setPhase('INHALE')
          phaseStartTimeRef.current = now
          setCompletedCycles(c => c + 1)
          playPhaseChime(528) // Coherence fundamental chime
        }
      }

      const currentPhaseElapsed = now - phaseStartTimeRef.current
      const currentPhaseDuration = PHASE_DURATIONS[lastPhase]
      const phaseProgress = Math.min(1, Math.max(0, currentPhaseElapsed / currentPhaseDuration))

      let waveScale = 1
      if (lastPhase === 'INHALE') {
        waveScale = 1 + phaseProgress * 0.8
      } else {
        waveScale = 1.8 - phaseProgress * 0.8
      }

      // Draw Concentric Liquid Cymatic Rings (Baroreflex Resonance)
      const numRings = 7
      for (let r = 1; r <= numRings; r++) {
        const rRadius = baseRadius * waveScale * (r / numRings)
        const alpha = (1 - r / numRings) * 0.8

        const gradient = ctx.createRadialGradient(
          centerX, centerY, rRadius * 0.5,
          centerX, centerY, rRadius
        )
        gradient.addColorStop(0, `rgba(59, 130, 246, ${alpha})`)  // Electric Sapphire Blue
        gradient.addColorStop(0.7, `rgba(16, 185, 129, ${alpha * 0.8})`) // Emerald Green
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.beginPath()
        ctx.arc(centerX, centerY, rRadius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.shadowColor = 'rgba(59, 130, 246, 0.6)'
        ctx.shadowBlur = 15
        ctx.fill()
      }

      // Central Harmonic Resonance Orb
      ctx.beginPath()
      ctx.arc(centerX, centerY, baseRadius * 0.25 * waveScale, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.shadowColor = 'rgba(16, 185, 129, 0.95)'
      ctx.shadowBlur = 25
      ctx.fill()
      ctx.shadowBlur = 0

      animFrameRef.current = requestAnimationFrame(render)
    }

    animFrameRef.current = requestAnimationFrame(render)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [step, isPaused])

  // Clean up Audio
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) audioCtxRef.current.close()
    }
  }, [])

  const handleFinishAndSave = async () => {
    setIsSaving(true)
    try {
      const localUserId = getLocalUserId()
      const dateStr = format(new Date(), 'yyyy-MM-dd')

      await saveBatchOutcomeObservations([
        {
          localUserId,
          outcomeId: 'hrv',
          phase: 'pre',
          value: preHrv,
          checkinDate: dateStr,
          taskId: taskId || 'coherent_breathing_applet'
        },
        {
          localUserId,
          outcomeId: 'hrv',
          phase: 'post',
          value: postHrv,
          checkinDate: dateStr,
          taskId: taskId || 'coherent_breathing_applet'
        }
      ])

      if (onComplete) onComplete()
      onClose()
    } catch (err) {
      console.error('Error saving coherent breathing observations:', err)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  const formatSeconds = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const hrvDelta = postHrv - preHrv

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-between font-sans overflow-hidden select-none animate-in fade-in duration-300">
      {/* Header */}
      <div className="w-full max-w-4xl p-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Waves size={16} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider uppercase text-white">{modalityName}</h1>
            <p className="text-[10px] text-gray-400">0.1 Hz Baroreflex Coherence (5.5s Inhale • 5.5s Exhale)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {step === 'SESSION' && (
            <button
              onClick={toggleMute}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* STEP 1: PRE-SESSION CHECK-IN */}
      {step === 'PRE_CHECK' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md w-full text-center space-y-6 z-20 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <Activity size={32} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Autonomic Balance Check-in</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Rate your current <strong>Autonomic Balance & HRV Coherence</strong> (1 = Stressed/Dysregulated, 10 = Deep Coherence).
            </p>
          </div>

          <div className="w-full space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-gray-400">Pre-Session HRV Balance</span>
              <span className="text-2xl font-mono text-blue-400">{preHrv} / 10</span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              value={preHrv}
              onChange={e => setPreHrv(parseInt(e.target.value))}
              className="w-full h-2 bg-black/60 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />

            <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              <span>1: Low Coherence</span>
              <span>5: Moderate</span>
              <span>10: Peak Coherence</span>
            </div>
          </div>

          <button
            onClick={handleStartSession}
            className="w-full py-4 px-8 min-h-[52px] bg-gradient-to-r from-blue-600 via-emerald-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_25px_rgba(59,130,246,0.4)] flex items-center justify-center gap-3 cursor-pointer border border-blue-400/40 transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <Play size={18} fill="currentColor" className="shrink-0" />
            <span>Begin 10-Min Coherent Session</span>
          </button>
        </div>
      )}

      {/* STEP 2: FULL-SCREEN HARMONIC CYMATIC CANVAS */}
      {step === 'SESSION' && (
        <>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 cursor-pointer" onClick={() => setIsPaused(!isPaused)} />

          <div className={`z-10 flex flex-col items-center text-center space-y-2 pointer-events-none mt-auto mb-4 transition-all duration-1000 ${
            elapsedSeconds >= 30 ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}>
            <div className="text-xs uppercase font-extrabold tracking-[0.2em] text-blue-300/90 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full backdrop-blur-md">
              {phase === 'INHALE' ? '1. Smooth Inhale (NOSE - 5.5s)' : '2. Relaxed Exhale (NOSE or MOUTH - 5.5s)'}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(59,130,246,0.6)]">
              {phase === 'INHALE' ? 'SMOOTH NOSE INHALE' : 'RELAXED EXHALE'}
            </h2>

            <p className="text-xs font-mono text-gray-300">
              Inhale through NOSE ➔ Exhale through NOSE or MOUTH (0.1 Hz Baroreflex Coherence)
            </p>
          </div>

          <div className="w-full max-w-xl p-6 flex items-center justify-between z-20 backdrop-blur-md bg-black/40 border border-white/10 rounded-2xl mb-8">
            <div className="text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Elapsed</span>
              <span className="text-xl font-mono font-bold text-white">{formatSeconds(elapsedSeconds)} / 10:00</span>
            </div>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.4)] cursor-pointer"
            >
              {isPaused ? <Play size={20} fill="currentColor" className="ml-0.5" /> : <Pause size={20} fill="currentColor" />}
            </button>

            <div className="text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Cycles</span>
              <span className="text-xl font-mono font-bold text-blue-400">{completedCycles} / 55</span>
            </div>
          </div>
        </>
      )}

      {/* STEP 3: POST-SESSION RECOVERY CHECK-IN */}
      {step === 'POST_CHECK' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md w-full text-center space-y-6 z-20 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <Check size={36} strokeWidth={3} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Session Complete!</h2>
            <p className="text-xs text-gray-400">Completed 10 minutes of Coherent 5.5s Breathing.</p>
          </div>

          <div className="w-full space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-gray-400">Post-Session HRV Coherence</span>
              <span className="text-2xl font-mono text-emerald-400">{postHrv} / 10</span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              value={postHrv}
              onChange={e => setPostHrv(parseInt(e.target.value))}
              className="w-full h-2 bg-black/60 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />

            <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs font-bold">
              <span className="text-gray-400">HRV Coherence Gain:</span>
              <span className={`font-mono ${hrvDelta > 0 ? 'text-emerald-400' : 'text-gray-300'}`}>
                {hrvDelta > 0 ? `⚡ +${hrvDelta} Points Coherence` : 'Harmonic Resonance Baseline'}
              </span>
            </div>
          </div>

          <button
            onClick={handleFinishAndSave}
            disabled={isSaving}
            className="w-full py-4 px-8 min-h-[52px] bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {isSaving ? 'Saving Bio-Feedback...' : 'Save & Close'}
          </button>
        </div>
      )}
    </div>
  )
}
