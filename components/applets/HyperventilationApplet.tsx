'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, X, Volume2, VolumeX, Check, Flame, Zap } from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { saveBatchOutcomeObservations } from '@/lib/data'
import { format } from 'date-fns'

interface HyperventilationAppletProps {
  isOpen: boolean
  onClose: () => void
  modalityName?: string
  taskId?: string
  onComplete?: () => void
}

type HyperPhase = 'RAPID_BREATHS' | 'RETENTION_HOLD' | 'RECOVERY_HOLD'

const TOTAL_ROUNDS = 3
const RAPID_BREATH_COUNT = 30
const RETENTION_HOLD_SECONDS = 60
const RECOVERY_HOLD_SECONDS = 15

export default function HyperventilationApplet({
  isOpen,
  onClose,
  modalityName = 'Cyclic Hyperventilation (Wim Hof Energy)',
  taskId,
  onComplete
}: HyperventilationAppletProps) {
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [phase, setPhase] = useState<HyperPhase>('RAPID_BREATHS')
  const [currentRound, setCurrentRound] = useState(1)
  const [breathCount, setBreathCount] = useState(1)
  const [holdTimer, setHoldTimer] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [preEnergy, setPreEnergy] = useState<number>(4)
  const [postEnergy, setPostEnergy] = useState<number>(9)
  const [step, setStep] = useState<'PRE_CHECK' | 'SESSION' | 'POST_CHECK'>('PRE_CHECK')
  const [isSaving, setIsSaving] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  // Web Audio Synthesizer (40 Hz Gamma Pulse for Cognitive Epinephrine Activation)
  const initAudio = () => {
    try {
      if (audioCtxRef.current) return
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      audioCtxRef.current = ctx

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(130, ctx.currentTime) // Rich low tone

      // 40 Hz Tremolo LFO
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.frequency.setValueAtTime(40, ctx.currentTime)
      lfoGain.gain.setValueAtTime(0.04, ctx.currentTime)

      lfo.connect(gain.gain)
      osc.connect(gain)
      gain.gain.setValueAtTime(isMuted ? 0 : 0.06, ctx.currentTime)
      gain.connect(ctx.destination)

      osc.start()
      lfo.start()

      gainNodeRef.current = gain
    } catch (err) {
      console.warn('Web Audio context blocked or not supported:', err)
    }
  }

  const playShockwaveChime = (freq: number) => {
    if (isMuted || !audioCtxRef.current) return
    try {
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
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
        gainNodeRef.current.gain.setValueAtTime(next ? 0 : 0.06, audioCtxRef.current.currentTime)
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
    setCurrentRound(1)
    setBreathCount(1)
    setPhase('RAPID_BREATHS')
  }

  // Rapid Breaths & Hold Protocol Loop
  useEffect(() => {
    if (!isActive || isPaused || step !== 'SESSION') return

    let interval: NodeJS.Timeout

    if (phase === 'RAPID_BREATHS') {
      interval = setInterval(() => {
        setBreathCount(prev => {
          if (prev >= RAPID_BREATH_COUNT) {
            setPhase('RETENTION_HOLD')
            setHoldTimer(RETENTION_HOLD_SECONDS)
            playShockwaveChime(320) // Deep retention tone
            return 1
          }
          playShockwaveChime(440 + prev * 5)
          return prev + 1
        })
        setElapsedSeconds(e => e + 1)
      }, 1200) // 1.2s per breath cycle
    } else if (phase === 'RETENTION_HOLD') {
      interval = setInterval(() => {
        setHoldTimer(prev => {
          if (prev <= 1) {
            setPhase('RECOVERY_HOLD')
            setHoldTimer(RECOVERY_HOLD_SECONDS)
            playShockwaveChime(640) // Supernova recovery blast tone
            return RECOVERY_HOLD_SECONDS
          }
          return prev - 1
        })
        setElapsedSeconds(e => e + 1)
      }, 1000)
    } else if (phase === 'RECOVERY_HOLD') {
      interval = setInterval(() => {
        setHoldTimer(prev => {
          if (prev <= 1) {
            if (currentRound >= TOTAL_ROUNDS) {
              setIsActive(false)
              setStep('POST_CHECK')
              if (audioCtxRef.current) audioCtxRef.current.suspend()
              return 0
            }
            setCurrentRound(r => r + 1)
            setPhase('RAPID_BREATHS')
            setBreathCount(1)
            playShockwaveChime(432)
            return 0
          }
          return prev - 1
        })
        setElapsedSeconds(e => e + 1)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isActive, isPaused, step, phase, currentRound])

  // Canvas Plasma Supernova Stellar Engine (60 FPS)
  useEffect(() => {
    if (step !== 'SESSION') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const particles: { x: number; y: number; vx: number; vy: number; radius: number; color: string }[] = []
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 3 + 1,
        color: Math.random() > 0.5 ? 'rgba(251, 146, 60, ' : 'rgba(234, 179, 8, '
      })
    }

    const render = (now: number) => {
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
      const baseRadius = Math.min(width, height) * 0.2

      let starRadius = baseRadius
      let coreColor1 = 'rgba(251, 146, 60, ' // Fiery Amber Gold
      let coreColor2 = 'rgba(239, 68, 68, '  // Plasma Red

      if (phase === 'RAPID_BREATHS') {
        const pulse = Math.sin((now * 0.008)) * 0.25 + 1.0
        starRadius = baseRadius * pulse
        coreColor1 = 'rgba(251, 146, 60, '
        coreColor2 = 'rgba(245, 158, 11, '
      } else if (phase === 'RETENTION_HOLD') {
        const contract = Math.sin((now * 0.002)) * 0.05 + 0.6
        starRadius = baseRadius * contract
        coreColor1 = 'rgba(147, 51, 234, ' // Violet Neutron Core
        coreColor2 = 'rgba(59, 130, 246, '
      } else {
        // Supernova Expansion
        starRadius = baseRadius * 1.8 + Math.sin((now * 0.005)) * 0.1
        coreColor1 = 'rgba(236, 72, 153, ' // Supernova Pink/Gold
        coreColor2 = 'rgba(251, 191, 36, '
      }

      // Draw Orbiting Plasma Particles
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color + '0.7)'
        ctx.shadowColor = p.color + '0.9)'
        ctx.shadowBlur = 10
        ctx.fill()
      })

      // Draw Stellar Plasma Corona
      const coronaGradient = ctx.createRadialGradient(
        centerX, centerY, starRadius * 0.2,
        centerX, centerY, starRadius * 2.5
      )
      coronaGradient.addColorStop(0, coreColor1 + '0.9)')
      coronaGradient.addColorStop(0.5, coreColor2 + '0.35)')
      coronaGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.beginPath()
      ctx.arc(centerX, centerY, starRadius * 2.5, 0, Math.PI * 2)
      ctx.fillStyle = coronaGradient
      ctx.fill()

      // Draw Core Stellar Fusion Star
      const coreGradient = ctx.createRadialGradient(
        centerX - starRadius * 0.3, centerY - starRadius * 0.3, starRadius * 0.1,
        centerX, centerY, starRadius
      )
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.98)')
      coreGradient.addColorStop(0.5, coreColor1 + '0.85)')
      coreGradient.addColorStop(1, coreColor2 + '0.9)')

      ctx.beginPath()
      ctx.arc(centerX, centerY, starRadius, 0, Math.PI * 2)
      ctx.fillStyle = coreGradient
      ctx.shadowColor = coreColor1 + '0.95)'
      ctx.shadowBlur = 30
      ctx.fill()
      ctx.shadowBlur = 0

      animFrameRef.current = requestAnimationFrame(render)
    }

    animFrameRef.current = requestAnimationFrame(render)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [step, phase])

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
          outcomeId: 'energy',
          phase: 'pre',
          value: preEnergy,
          checkinDate: dateStr,
          taskId: taskId || 'cyclic_hyperventilation_applet'
        },
        {
          localUserId,
          outcomeId: 'energy',
          phase: 'post',
          value: postEnergy,
          checkinDate: dateStr,
          taskId: taskId || 'cyclic_hyperventilation_applet'
        }
      ])

      if (onComplete) onComplete()
      onClose()
    } catch (err) {
      console.error('Error saving hyperventilation observations:', err)
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

  const energyDelta = postEnergy - preEnergy

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-between font-sans overflow-hidden select-none animate-in fade-in duration-300">
      {/* Header */}
      <div className="w-full max-w-4xl p-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Flame size={16} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider uppercase text-white">{modalityName}</h1>
            <p className="text-[10px] text-gray-400">Wim Hof Epinephrine Reset (3 Rounds • 30 Breaths • 60s Hold)</p>
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
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,158,11,0.3)]">
            <Zap size={32} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Morning Energy Check-in</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Rate your current <strong>Physical & Mental Energy Level</strong> (1 = Exhausted, 10 = High Adrenaline Peak).
            </p>
          </div>

          <div className="w-full space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-gray-400">Pre-Session Energy Level</span>
              <span className="text-2xl font-mono text-amber-400">{preEnergy} / 10</span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              value={preEnergy}
              onChange={e => setPreEnergy(parseInt(e.target.value))}
              className="w-full h-2 bg-black/60 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />

            <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              <span>1: Low Energy</span>
              <span>5: Moderate</span>
              <span>10: High Energy</span>
            </div>
          </div>

          <button
            onClick={handleStartSession}
            className="w-full py-4 px-8 min-h-[52px] bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center justify-center gap-3 cursor-pointer border border-amber-400/40 transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <Play size={18} fill="currentColor" className="shrink-0" />
            <span>Begin Energy Session</span>
          </button>
        </div>
      )}

      {/* STEP 2: FULL-SCREEN PLASMA SUPERNOVA CANVAS */}
      {step === 'SESSION' && (
        <>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 cursor-pointer" onClick={() => setIsPaused(!isPaused)} />

          <div className={`z-10 flex flex-col items-center text-center space-y-2 pointer-events-none mt-auto mb-4 transition-all duration-1000 ${
            elapsedSeconds >= 30 ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}>
            <div className="text-xs uppercase font-extrabold tracking-[0.2em] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full backdrop-blur-md">
              Round {currentRound} of {TOTAL_ROUNDS} • {
                phase === 'RAPID_BREATHS' ? `Breath ${breathCount} / 30 (Inhale Nose or Mouth ➔ Exhale Mouth)` :
                phase === 'RETENTION_HOLD' ? `Exhale Hold (${holdTimer}s - Lungs Empty)` :
                `Recovery Hold (${holdTimer}s - Deep Nose Inhale)`
              }
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(245,158,11,0.6)]">
              {phase === 'RAPID_BREATHS' && 'RAPID INHALE & RELEASE'}
              {phase === 'RETENTION_HOLD' && 'EXHALE RETENTION HOLD'}
              {phase === 'RECOVERY_HOLD' && 'RECOVERY INHALE HOLD'}
            </h2>

            <p className="text-xs font-mono text-gray-300">
              {phase === 'RAPID_BREATHS' ? 'Inhale Nose or Mouth ➔ Unforced Exhale Mouth' : 'Controlled Epinephrine Reset'}
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
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Round</span>
              <span className="text-xl font-mono font-bold text-amber-400">{currentRound} / {TOTAL_ROUNDS}</span>
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
            <p className="text-xs text-gray-400">Completed 3 rounds of Cyclic Hyperventilation.</p>
          </div>

          <div className="w-full space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-gray-400">Post-Session Energy Level</span>
              <span className="text-2xl font-mono text-emerald-400">{postEnergy} / 10</span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              value={postEnergy}
              onChange={e => setPostEnergy(parseInt(e.target.value))}
              className="w-full h-2 bg-black/60 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />

            <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs font-bold">
              <span className="text-gray-400">Energy Boost:</span>
              <span className={`font-mono ${energyDelta > 0 ? 'text-emerald-400' : 'text-gray-300'}`}>
                {energyDelta > 0 ? `⚡ +${energyDelta} Points Surge` : 'Energized Baseline'}
              </span>
            </div>
          </div>

          <button
            onClick={handleFinishAndSave}
            disabled={isSaving}
            className="w-full py-4 px-8 min-h-[52px] bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {isSaving ? 'Saving Bio-Feedback...' : 'Save & Start Day'}
          </button>
        </div>
      )}
    </div>
  )
}
