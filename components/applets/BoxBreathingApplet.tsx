'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, X, Volume2, VolumeX, Check, Sparkles, Shield, Zap } from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { saveBatchOutcomeObservations } from '@/lib/data'
import { format } from 'date-fns'

interface BoxBreathingAppletProps {
  isOpen: boolean
  onClose: () => void
  modalityName?: string
  taskId?: string
  onComplete?: () => void
}

type BoxPhase = 'INHALE' | 'HOLD_FULL' | 'EXHALE' | 'HOLD_EMPTY'

const PHASE_DURATIONS: Record<BoxPhase, number> = {
  INHALE: 4000,
  HOLD_FULL: 4000,
  EXHALE: 4000,
  HOLD_EMPTY: 4000
}

const TARGET_SESSION_SECONDS = 240 // 4 Minutes (15 cycles)

export default function BoxBreathingApplet({
  isOpen,
  onClose,
  modalityName = 'Box Breathing (Navy SEAL Focus)',
  taskId,
  onComplete
}: BoxBreathingAppletProps) {
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [phase, setPhase] = useState<BoxPhase>('INHALE')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [completedCycles, setCompletedCycles] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [preFocus, setPreFocus] = useState<number>(5)
  const [postFocus, setPostFocus] = useState<number>(9)
  const [step, setStep] = useState<'PRE_CHECK' | 'SESSION' | 'POST_CHECK'>('PRE_CHECK')
  const [isSaving, setIsSaving] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const phaseStartTimeRef = useRef<number>(0)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  // Web Audio Synthesizer Initialization (14 Hz Beta-Wave Entrainment + 432 Hz Grounding Tone)
  const initAudio = () => {
    try {
      if (audioCtxRef.current) return
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      audioCtxRef.current = ctx

      // Carrier 432 Hz
      const oscL = ctx.createOscillator()
      const oscR = ctx.createOscillator()
      const merger = ctx.createChannelMerger(2)
      const gain = ctx.createGain()

      oscL.type = 'sine'
      oscR.type = 'sine'
      oscL.frequency.setValueAtTime(432, ctx.currentTime)
      oscR.frequency.setValueAtTime(446, ctx.currentTime) // 14 Hz Beta Difference

      gain.gain.setValueAtTime(isMuted ? 0 : 0.08, ctx.currentTime)

      oscL.connect(merger, 0, 0)
      oscR.connect(merger, 0, 1)
      merger.connect(gain)
      gain.connect(ctx.destination)

      oscL.start()
      oscR.start()

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
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.6)
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

  // Canvas 3D Quantum Tesseract Engine (60 FPS)
  useEffect(() => {
    if (step !== 'SESSION') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let lastPhase: BoxPhase = 'INHALE'

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
      const baseRadius = Math.min(width, height) * 0.18

      if (!isPaused) {
        const phaseElapsed = now - phaseStartTimeRef.current

        if (lastPhase === 'INHALE' && phaseElapsed >= PHASE_DURATIONS.INHALE) {
          lastPhase = 'HOLD_FULL'
          setPhase('HOLD_FULL')
          phaseStartTimeRef.current = now
          playPhaseChime(588)
        } else if (lastPhase === 'HOLD_FULL' && phaseElapsed >= PHASE_DURATIONS.HOLD_FULL) {
          lastPhase = 'EXHALE'
          setPhase('EXHALE')
          phaseStartTimeRef.current = now
          playPhaseChime(440)
        } else if (lastPhase === 'EXHALE' && phaseElapsed >= PHASE_DURATIONS.EXHALE) {
          lastPhase = 'HOLD_EMPTY'
          setPhase('HOLD_EMPTY')
          phaseStartTimeRef.current = now
          playPhaseChime(352)
        } else if (lastPhase === 'HOLD_EMPTY' && phaseElapsed >= PHASE_DURATIONS.HOLD_EMPTY) {
          lastPhase = 'INHALE'
          setPhase('INHALE')
          phaseStartTimeRef.current = now
          setCompletedCycles(c => c + 1)
          playPhaseChime(528)
        }
      }

      const currentPhaseElapsed = now - phaseStartTimeRef.current
      const currentPhaseDuration = PHASE_DURATIONS[lastPhase]
      const phaseProgress = Math.min(1, Math.max(0, currentPhaseElapsed / currentPhaseDuration))

      // Compute Tesseract Scale & Rotation
      let tesseractScale = 1
      let laserGlow = 'rgba(56, 189, 248, ' // Cyan

      if (lastPhase === 'INHALE') {
        tesseractScale = 1 + phaseProgress * 0.8
        laserGlow = 'rgba(56, 189, 248, ' // Cyan Inhale
      } else if (lastPhase === 'HOLD_FULL') {
        tesseractScale = 1.8 + Math.sin(phaseProgress * Math.PI * 4) * 0.04
        laserGlow = 'rgba(251, 191, 36, ' // Golden Laser Lock
      } else if (lastPhase === 'EXHALE') {
        tesseractScale = 1.8 - phaseProgress * 0.8
        laserGlow = 'rgba(168, 85, 247, ' // Purple Exhale
      } else {
        tesseractScale = 1.0 + Math.sin(phaseProgress * Math.PI * 2) * 0.02
        laserGlow = 'rgba(16, 185, 129, ' // Emerald Stillness
      }

      const angle = (now * 0.0006) % (Math.PI * 2)

      // Draw 3D Tesseract Projections (Hyper-Cube Projection)
      const drawCube = (size: number, rot: number, color: string, lineWidth: number) => {
        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(rot)

        const vertices = [
          [-size, -size], [size, -size], [size, size], [-size, size]
        ]

        ctx.strokeStyle = color + '0.9)'
        ctx.shadowColor = color + '0.8)'
        ctx.shadowBlur = 20
        ctx.lineWidth = lineWidth

        ctx.beginPath()
        vertices.forEach(([x, y], idx) => {
          if (idx === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.closePath()
        ctx.stroke()

        // Draw Quantum Nodes
        vertices.forEach(([x, y]) => {
          ctx.beginPath()
          ctx.arc(x, y, 4, 0, Math.PI * 2)
          ctx.fillStyle = '#ffffff'
          ctx.fill()
        })

        ctx.restore()
      }

      // Outer Tesseract Frame
      drawCube(baseRadius * tesseractScale, angle, laserGlow, 2.5)

      // Inner Tesseract Core Frame
      drawCube(baseRadius * tesseractScale * 0.5, -angle * 1.5, laserGlow, 1.5)

      // Connect 4D Hyper-edges
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.strokeStyle = laserGlow + '0.4)'
      ctx.lineWidth = 1
      const outerR = baseRadius * tesseractScale
      const innerR = baseRadius * tesseractScale * 0.5

      for (let i = 0; i < 4; i++) {
        const a1 = angle + (i * Math.PI / 2)
        const a2 = -angle * 1.5 + (i * Math.PI / 2)
        const x1 = Math.cos(a1) * outerR
        const y1 = Math.sin(a1) * outerR
        const x2 = Math.cos(a2) * innerR
        const y2 = Math.sin(a2) * innerR

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
      ctx.restore()

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
          outcomeId: 'focus',
          phase: 'pre',
          value: preFocus,
          checkinDate: dateStr,
          taskId: taskId || 'box_breathing_applet'
        },
        {
          localUserId,
          outcomeId: 'focus',
          phase: 'post',
          value: postFocus,
          checkinDate: dateStr,
          taskId: taskId || 'box_breathing_applet'
        }
      ])

      if (onComplete) onComplete()
      onClose()
    } catch (err) {
      console.error('Error saving box breathing observations:', err)
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

  const focusDelta = postFocus - preFocus

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-between font-sans overflow-hidden select-none animate-in fade-in duration-300">
      {/* Header */}
      <div className="w-full max-w-4xl p-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Shield size={16} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider uppercase text-white">{modalityName}</h1>
            <p className="text-[10px] text-gray-400">Navy SEAL Tactical Focus (4s Inhale • 4s Hold • 4s Exhale • 4s Hold)</p>
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
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <Zap size={32} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Tactical Focus Check-in</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Rate your current <strong>Cognitive Focus & Mental Clarity</strong> (1 = Distracted/Foggy, 10 = Sharp/Laser Focus).
            </p>
          </div>

          <div className="w-full space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-gray-400">Pre-Task Focus Level</span>
              <span className="text-2xl font-mono text-cyan-400">{preFocus} / 10</span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              value={preFocus}
              onChange={e => setPreFocus(parseInt(e.target.value))}
              className="w-full h-2 bg-black/60 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />

            <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              <span>1: Foggy</span>
              <span>5: Moderate</span>
              <span>10: Laser Sharp</span>
            </div>
          </div>

          <button
            onClick={handleStartSession}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer border border-cyan-400/30"
          >
            <Play size={18} fill="currentColor" /> Begin 4-Min Box Session
          </button>
        </div>
      )}

      {/* STEP 2: FULL-SCREEN QUANTUM TESSERACT CANVAS */}
      {step === 'SESSION' && (
        <>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 cursor-pointer" onClick={() => setIsPaused(!isPaused)} />

          <div className={`z-10 flex flex-col items-center text-center space-y-2 pointer-events-none mt-auto mb-4 transition-all duration-1000 ${
            elapsedSeconds >= 30 ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}>
            <div className="text-xs uppercase font-extrabold tracking-[0.2em] text-cyan-300/90 bg-cyan-500/10 border border-cyan-500/20 px-4 py-1.5 rounded-full backdrop-blur-md">
              {phase === 'INHALE' && '1. Inhale Deeply (NOSE - 4s)'}
              {phase === 'HOLD_FULL' && '2. Hold Full (LUNGS FULL - 4s)'}
              {phase === 'EXHALE' && '3. Smooth Exhale (MOUTH or NOSE - 4s)'}
              {phase === 'HOLD_EMPTY' && '4. Hold Empty (LUNGS EMPTY - 4s)'}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(6,182,212,0.6)]">
              {phase === 'INHALE' && 'NOSE INHALE'}
              {phase === 'HOLD_FULL' && 'LUNGS FULL HOLD'}
              {phase === 'EXHALE' && 'EXHALE RELEASE'}
              {phase === 'HOLD_EMPTY' && 'LUNGS EMPTY HOLD'}
            </h2>

            <p className="text-xs font-mono text-gray-300">
              {phase === 'INHALE' ? 'Inhale through NOSE ➔ Exhale through MOUTH or NOSE' : 'Tactical Panic Suppression'}
            </p>
          </div>

          <div className="w-full max-w-xl p-6 flex items-center justify-between z-20 backdrop-blur-md bg-black/40 border border-white/10 rounded-2xl mb-8">
            <div className="text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Elapsed</span>
              <span className="text-xl font-mono font-bold text-white">{formatSeconds(elapsedSeconds)} / 4:00</span>
            </div>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.4)] cursor-pointer"
            >
              {isPaused ? <Play size={20} fill="currentColor" className="ml-0.5" /> : <Pause size={20} fill="currentColor" />}
            </button>

            <div className="text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Cycles</span>
              <span className="text-xl font-mono font-bold text-cyan-400">{completedCycles} / 15</span>
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
            <p className="text-xs text-gray-400">Completed 4 minutes of Box Breathing Tactical Focus.</p>
          </div>

          <div className="w-full space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-gray-400">Post-Task Focus Level</span>
              <span className="text-2xl font-mono text-emerald-400">{postFocus} / 10</span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              value={postFocus}
              onChange={e => setPostFocus(parseInt(e.target.value))}
              className="w-full h-2 bg-black/60 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />

            <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs font-bold">
              <span className="text-gray-400">Focus Gain:</span>
              <span className={`font-mono ${focusDelta > 0 ? 'text-emerald-400' : 'text-gray-300'}`}>
                {focusDelta > 0 ? `⚡ +${focusDelta} Points Sharp Focus` : 'Calm Baseline'}
              </span>
            </div>
          </div>

          <button
            onClick={handleFinishAndSave}
            disabled={isSaving}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? 'Saving Bio-Feedback...' : 'Save & Execute Task'}
          </button>
        </div>
      )}
    </div>
  )
}
