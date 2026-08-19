'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, X, Volume2, VolumeX, Check, RotateCcw, Sparkles, Heart, Activity } from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { saveBatchOutcomeObservations } from '@/lib/data'
import { format } from 'date-fns'

interface CyclicSighingAppletProps {
  isOpen: boolean
  onClose: () => void
  modalityName?: string
  taskId?: string
  onComplete?: () => void
}

type BreathPhase = 'INHALE' | 'EXHALE'

// Phase durations in milliseconds (Balban et al., 2023)
const PHASE_DURATIONS: Record<BreathPhase, number> = {
  INHALE: 3500, // Deep nasal fill
  EXHALE: 5000  // Slow, extended oral release
}

const TARGET_SESSION_SECONDS = 300 // 5 Minutes (approx 35 cycles)

export default function CyclicSighingApplet({
  isOpen,
  onClose,
  modalityName = 'Cyclic Sighing (Physiological Sigh)',
  taskId,
  onComplete
}: CyclicSighingAppletProps) {
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [phase, setPhase] = useState<BreathPhase>('INHALE')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [completedCycles, setCompletedCycles] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [preStress, setPreStress] = useState<number>(7)
  const [postStress, setPostStress] = useState<number>(3)
  const [step, setStep] = useState<'PRE_CHECK' | 'SESSION' | 'POST_CHECK'>('PRE_CHECK')
  const [isSaving, setIsSaving] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const phaseStartTimeRef = useRef<number>(0)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const osc1Ref = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  // Web Audio Synthesizer Initialization (432Hz Binaural Ambient Drone)
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
      osc.frequency.setValueAtTime(432, ctx.currentTime)

      gain.gain.setValueAtTime(isMuted ? 0 : 0.08, ctx.currentTime)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()

      osc1Ref.current = osc
      gainNodeRef.current = gain
    } catch (err) {
      console.warn('Web Audio context blocked or not supported:', err)
    }
  }

  // Play subtle phase chime
  const playPhaseChime = (freq: number) => {
    if (isMuted || !audioCtxRef.current) return
    try {
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.8)
    } catch (err) {
      // Ignore audio glitches
    }
  }

  // Handle Audio Mute Toggle
  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev
      if (gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.setValueAtTime(next ? 0 : 0.08, audioCtxRef.current.currentTime)
      }
      return next
    })
  }

  // Start Session
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

  // Timer Tick (1s interval)
  useEffect(() => {
    if (!isActive || isPaused || step !== 'SESSION') return

    const interval = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1
        if (next >= TARGET_SESSION_SECONDS) {
          setIsActive(false)
          setStep('POST_CHECK')
          if (audioCtxRef.current) {
            audioCtxRef.current.suspend()
          }
          return TARGET_SESSION_SECONDS
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, isPaused, step])

  // Canvas Bioluminescent Orb Render Loop (60 FPS Hardware Accelerated)
  useEffect(() => {
    if (step !== 'SESSION') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let lastPhase: BreathPhase = 'INHALE'

    const render = (now: number) => {
      if (!phaseStartTimeRef.current) phaseStartTimeRef.current = now

      // Handle Resize for Crisp Retina Display
      const dpr = window.devicePixelRatio || 1
      const width = window.innerWidth
      const height = window.innerHeight
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)
      }

      // Crisp OLED Pure Black Background
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)

      const centerX = width / 2
      const centerY = height / 2
      const baseRadius = Math.min(width, height) * 0.18

      if (!isPaused) {
        const phaseElapsed = now - phaseStartTimeRef.current

        // 2-Phase Transition Logic (Inhale <-> Exhale)
        if (lastPhase === 'INHALE' && phaseElapsed >= PHASE_DURATIONS.INHALE) {
          lastPhase = 'EXHALE'
          setPhase('EXHALE')
          phaseStartTimeRef.current = now
          playPhaseChime(384) // Soft low chime for long exhale
        } else if (lastPhase === 'EXHALE' && phaseElapsed >= PHASE_DURATIONS.EXHALE) {
          lastPhase = 'INHALE'
          setPhase('INHALE')
          phaseStartTimeRef.current = now
          setCompletedCycles(c => c + 1)
          playPhaseChime(432) // Fundamental tone for primary inhale
        }
      }

      const currentPhaseElapsed = now - phaseStartTimeRef.current
      const currentPhaseDuration = PHASE_DURATIONS[lastPhase]
      const phaseProgress = Math.min(1, Math.max(0, currentPhaseElapsed / currentPhaseDuration))

      // Compute Dynamic Orb Scale & Colors
      let orbScale = 1
      let glowColor1 = 'rgba(99, 102, 241, ' // Indigo
      let glowColor2 = 'rgba(16, 185, 129, ' // Emerald

      if (lastPhase === 'INHALE') {
        // Smooth expansion from 1.0 to 2.0
        orbScale = 1 + phaseProgress * 1.0
        glowColor1 = 'rgba(56, 189, 248, ' // Cyan / Sky Blue
        glowColor2 = 'rgba(99, 102, 241, '
      } else {
        // Slow extended exhale contraction from 2.0 down to 1.0
        orbScale = 2.0 - phaseProgress * 1.0
        glowColor1 = 'rgba(139, 92, 246, ' // Purple / Violet Vagal Recovery
        glowColor2 = 'rgba(16, 185, 129, '
      }

      const currentRadius = baseRadius * orbScale

      // Draw Outer Bioluminescent Atmospheric Halo
      const haloGradient = ctx.createRadialGradient(
        centerX, centerY, currentRadius * 0.2,
        centerX, centerY, currentRadius * 2.2
      )
      haloGradient.addColorStop(0, glowColor1 + '0.4)')
      haloGradient.addColorStop(0.5, glowColor2 + '0.15)')
      haloGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.beginPath()
      ctx.arc(centerX, centerY, currentRadius * 2.2, 0, Math.PI * 2)
      ctx.fillStyle = haloGradient
      ctx.fill()

      // Draw Core Glassmorphic Orb
      const coreGradient = ctx.createRadialGradient(
        centerX - currentRadius * 0.3, centerY - currentRadius * 0.3, currentRadius * 0.1,
        centerX, centerY, currentRadius
      )
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
      coreGradient.addColorStop(0.4, glowColor1 + '0.8)')
      coreGradient.addColorStop(0.8, glowColor2 + '0.6)')
      coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)')

      ctx.beginPath()
      ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2)
      ctx.fillStyle = coreGradient
      ctx.shadowColor = glowColor1 + '0.8)'
      ctx.shadowBlur = 30
      ctx.fill()
      ctx.shadowBlur = 0

      // Draw Luminous Outer Ring
      ctx.beginPath()
      ctx.arc(centerX, centerY, currentRadius * 1.05, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.lineWidth = 2
      ctx.stroke()

      animFrameRef.current = requestAnimationFrame(render)
    }

    animFrameRef.current = requestAnimationFrame(render)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [step, isPaused])

  // Clean up Audio on Unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
      }
    }
  }, [])

  // Save Pre/Post Observations & Complete Session
  const handleFinishAndSave = async () => {
    setIsSaving(true)
    try {
      const localUserId = getLocalUserId()
      const dateStr = format(new Date(), 'yyyy-MM-dd')

      await saveBatchOutcomeObservations([
        {
          localUserId,
          outcomeId: 'stress_resilience',
          phase: 'pre',
          value: preStress,
          checkinDate: dateStr,
          taskId: taskId || 'cyclic_sighing_applet'
        },
        {
          localUserId,
          outcomeId: 'stress_resilience',
          phase: 'post',
          value: postStress,
          checkinDate: dateStr,
          taskId: taskId || 'cyclic_sighing_applet'
        }
      ])

      if (onComplete) onComplete()
      onClose()
    } catch (err) {
      console.error('Error saving applet observations:', err)
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

  const stressDelta = preStress - postStress

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-between font-sans overflow-hidden select-none animate-in fade-in duration-300">
      {/* Top Bar Header */}
      <div className="w-full max-w-4xl p-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Sparkles size={16} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider uppercase text-white">{modalityName}</h1>
            <p className="text-[10px] text-gray-400">Stanford Neuroscience Protocol (Balban et al., 2023)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {step === 'SESSION' && (
            <button
              onClick={toggleMute}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
              title={isMuted ? "Unmute Audio Synth" : "Mute Audio Synth"}
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

      {/* STEP 1: PRE-SESSION BIO-FEEDBACK CHECK-IN */}
      {step === 'PRE_CHECK' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md w-full text-center space-y-6 z-20 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <Activity size={32} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Pre-Session Check-in</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Rate your current <strong>Stress & Arousal level</strong> (1 = Completely Calm, 10 = Severe Stress/Anxiety).
            </p>
          </div>

          <div className="w-full space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-gray-400">Current Stress Level</span>
              <span className="text-2xl font-mono text-indigo-400">{preStress} / 10</span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              value={preStress}
              onChange={e => setPreStress(parseInt(e.target.value))}
              className="w-full h-2 bg-black/60 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />

            <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              <span>1: Deep Calm</span>
              <span>5: Moderate</span>
              <span>10: High Stress</span>
            </div>
          </div>

          <button
            onClick={handleStartSession}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play size={18} fill="currentColor" /> Begin 5-Min Session
          </button>
        </div>
      )}

      {/* STEP 2: FULL-SCREEN CANVAS & LIVE BREATHWORK EXPERIENCE */}
      {step === 'SESSION' && (
        <>
          {/* Hardware Accelerated Canvas Engine Background */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 cursor-pointer" onClick={() => setIsPaused(!isPaused)} />

          {/* Dynamic Floating Breath Guidance Text Overlay (Positioned BELOW graphic, auto-disappears after 30 seconds) */}
          <div className={`z-10 flex flex-col items-center text-center space-y-2 pointer-events-none mt-auto mb-4 transition-all duration-1000 ${
            elapsedSeconds >= 30 ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}>
            <div className="text-xs uppercase font-extrabold tracking-[0.2em] text-indigo-300/80 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full backdrop-blur-md">
              {phase === 'INHALE' ? '1. Deep Inhale (NOSE) + 2. Top-Up (NOSE)' : '3. Long Slow Exhale (MOUTH)'}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(99,102,241,0.6)]">
              {phase === 'INHALE' ? 'DOUBLE NOSE INHALE' : 'SLOW MOUTH EXHALE'}
            </h2>

            <p className="text-xs font-mono text-gray-300">
              Double Inhale through NOSE ➔ Long Exhale through MOUTH
            </p>
          </div>

          {/* Bottom Live Session Metrics Bar */}
          <div className="w-full max-w-xl p-6 flex items-center justify-between z-20 backdrop-blur-md bg-black/40 border border-white/10 rounded-2xl mb-8">
            <div className="text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Elapsed</span>
              <span className="text-xl font-mono font-bold text-white">{formatSeconds(elapsedSeconds)} / 5:00</span>
            </div>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.4)] cursor-pointer"
            >
              {isPaused ? <Play size={20} fill="currentColor" className="ml-0.5" /> : <Pause size={20} fill="currentColor" />}
            </button>

            <div className="text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Cycles</span>
              <span className="text-xl font-mono font-bold text-emerald-400">{completedCycles} / 35</span>
            </div>
          </div>
        </>
      )}

      {/* STEP 3: POST-SESSION BIO-FEEDBACK & RECOVERY METRICS */}
      {step === 'POST_CHECK' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md w-full text-center space-y-6 z-20 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <Check size={36} strokeWidth={3} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Session Complete!</h2>
            <p className="text-xs text-gray-400">Completed 5 minutes (~{completedCycles} cycles) of Cyclic Sighing.</p>
          </div>

          <div className="w-full space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-gray-400">Post-Session Stress Level</span>
              <span className="text-2xl font-mono text-emerald-400">{postStress} / 10</span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              value={postStress}
              onChange={e => setPostStress(parseInt(e.target.value))}
              className="w-full h-2 bg-black/60 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />

            <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs font-bold">
              <span className="text-gray-400">Immediate Stress Reduction:</span>
              <span className={`font-mono ${stressDelta > 0 ? 'text-emerald-400' : 'text-gray-300'}`}>
                {stressDelta > 0 ? `⚡ -${stressDelta} Points Reduced` : 'Baseline Maintained'}
              </span>
            </div>
          </div>

          <button
            onClick={handleFinishAndSave}
            disabled={isSaving}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? 'Saving Bio-Feedback...' : 'Save & Close Session'}
          </button>
        </div>
      )}
    </div>
  )
}
