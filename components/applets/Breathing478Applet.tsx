'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, X, Volume2, VolumeX, Check, Sparkles, Moon, Activity } from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { saveBatchOutcomeObservations } from '@/lib/data'
import { format } from 'date-fns'

interface Breathing478AppletProps {
  isOpen: boolean
  onClose: () => void
  modalityName?: string
  taskId?: string
  onComplete?: () => void
}

type BreathPhase = 'INHALE' | 'HOLD' | 'EXHALE'

// 4-7-8 Protocol Phase Durations in milliseconds
const PHASE_DURATIONS: Record<BreathPhase, number> = {
  INHALE: 4000, // 4 seconds nasal inhale
  HOLD: 7000,   // 7 seconds vascular relaxation hold
  EXHALE: 8000  // 8 seconds extended vagal exhale
}

const TARGET_SESSION_SECONDS = 300 // 5 Minutes (approx 16 cycles)

export default function Breathing478Applet({
  isOpen,
  onClose,
  modalityName = '4-7-8 Relaxing Breathwork',
  taskId,
  onComplete
}: Breathing478AppletProps) {
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [phase, setPhase] = useState<BreathPhase>('INHALE')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [completedCycles, setCompletedCycles] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [preAnxiety, setPreAnxiety] = useState<number>(7)
  const [postAnxiety, setPostAnxiety] = useState<number>(3)
  const [step, setStep] = useState<'PRE_CHECK' | 'SESSION' | 'POST_CHECK'>('PRE_CHECK')
  const [isSaving, setIsSaving] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const phaseStartTimeRef = useRef<number>(0)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const osc1Ref = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  // Web Audio Synthesizer Initialization (432Hz Ambient Delta Drone)
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

  // Play Tibetan bowl chime for phase shifts
  const playPhaseChime = (freq: number) => {
    if (isMuted || !audioCtxRef.current) return
    try {
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 1.2)
    } catch (err) {
      // Ignore audio glitches
    }
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

  // Canvas Psychedelic Sacred Lotus Render Loop (60 FPS)
  useEffect(() => {
    if (step !== 'SESSION') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let lastPhase: BreathPhase = 'INHALE'

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

      // Crisp OLED Pure Black Background
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)

      const centerX = width / 2
      const centerY = height / 2
      const maxRadius = Math.min(width, height) * 0.22

      if (!isPaused) {
        const phaseElapsed = now - phaseStartTimeRef.current

        // 3-Phase 4-7-8 Transition Logic
        if (lastPhase === 'INHALE' && phaseElapsed >= PHASE_DURATIONS.INHALE) {
          lastPhase = 'HOLD'
          setPhase('HOLD')
          phaseStartTimeRef.current = now
          playPhaseChime(528) // Transformation frequency
        } else if (lastPhase === 'HOLD' && phaseElapsed >= PHASE_DURATIONS.HOLD) {
          lastPhase = 'EXHALE'
          setPhase('EXHALE')
          phaseStartTimeRef.current = now
          playPhaseChime(396) // Deep release tone
        } else if (lastPhase === 'EXHALE' && phaseElapsed >= PHASE_DURATIONS.EXHALE) {
          lastPhase = 'INHALE'
          setPhase('INHALE')
          phaseStartTimeRef.current = now
          setCompletedCycles(c => c + 1)
          playPhaseChime(432) // Fundamental tone
        }
      }

      const currentPhaseElapsed = now - phaseStartTimeRef.current
      const currentPhaseDuration = PHASE_DURATIONS[lastPhase]
      const phaseProgress = Math.min(1, Math.max(0, currentPhaseElapsed / currentPhaseDuration))

      // Compute Bloom Growth & Shimmer
      let bloomProgress = 0
      if (lastPhase === 'INHALE') {
        bloomProgress = phaseProgress // 0 -> 1 (Blooming open)
      } else if (lastPhase === 'HOLD') {
        bloomProgress = 1 + Math.sin(phaseProgress * Math.PI * 4) * 0.04 // Shimmering full bloom
      } else {
        bloomProgress = 1 - phaseProgress // 1 -> 0 (Closing into seed)
      }

      const rotationAngle = (now * 0.0003) % (Math.PI * 2)

      // Draw Psychedelic Sacred Geometry Lotus Petals
      const drawLotusLayer = (
        petals: number,
        layerRadius: number,
        color1: string,
        color2: string,
        rotationOffset: number
      ) => {
        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(rotationOffset)

        for (let i = 0; i < petals; i++) {
          const angle = (i * 2 * Math.PI) / petals
          ctx.save()
          ctx.rotate(angle)

          const pLength = layerRadius * (0.4 + bloomProgress * 0.8)
          const pWidth = pLength * 0.45

          const gradient = ctx.createRadialGradient(0, 0, 0, 0, -pLength, pLength)
          gradient.addColorStop(0, color1)
          gradient.addColorStop(0.7, color2)
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.bezierCurveTo(-pWidth, -pLength * 0.4, -pWidth * 0.8, -pLength, 0, -pLength)
          ctx.bezierCurveTo(pWidth * 0.8, -pLength, pWidth, -pLength * 0.4, 0, 0)
          ctx.fillStyle = gradient
          ctx.shadowColor = color1
          ctx.shadowBlur = 15
          ctx.fill()
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
          ctx.lineWidth = 1
          ctx.stroke()

          ctx.restore()
        }

        ctx.restore()
      }

      // Layer 1: Outer Electric Violet / Purple (12 Petals)
      drawLotusLayer(
        12,
        maxRadius * 1.25,
        'rgba(147, 51, 234, 0.92)', // Vivid Electric Purple
        'rgba(88, 28, 135, 0.70)',  // Deep Midnight Violet
        rotationAngle
      )

      // Layer 2: Middle Vivid Emerald Green (8 Petals - Pure High-Contrast Green)
      drawLotusLayer(
        8,
        maxRadius * 0.88,
        'rgba(16, 185, 129, 0.95)', // Vivid Emerald Green
        'rgba(4, 120, 87, 0.70)',   // Deep Forest Green
        -rotationAngle * 1.5
      )

      // Layer 3: Inner Sapphire / Cobalt Blue (6 Petals - Pure Royal Blue Center)
      drawLotusLayer(
        6,
        maxRadius * 0.52,
        'rgba(37, 99, 235, 0.98)',  // Electric Sapphire Blue
        'rgba(29, 78, 216, 0.75)',  // Deep Cobalt Blue
        rotationAngle * 2
      )

      // Central Luminous Core Orb
      ctx.beginPath()
      ctx.arc(centerX, centerY, maxRadius * 0.15 * (0.8 + bloomProgress * 0.4), 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.shadowColor = 'rgba(59, 130, 246, 0.95)'
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
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
      }
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
          outcomeId: 'sleep_latency',
          phase: 'pre',
          value: preAnxiety,
          checkinDate: dateStr,
          taskId: taskId || 'breathing_4_7_8_applet'
        },
        {
          localUserId,
          outcomeId: 'sleep_latency',
          phase: 'post',
          value: postAnxiety,
          checkinDate: dateStr,
          taskId: taskId || 'breathing_4_7_8_applet'
        }
      ])

      if (onComplete) onComplete()
      onClose()
    } catch (err) {
      console.error('Error saving 4-7-8 applet observations:', err)
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

  const anxietyDelta = preAnxiety - postAnxiety

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-between font-sans overflow-hidden select-none animate-in fade-in duration-300">
      {/* Header */}
      <div className="w-full max-w-4xl p-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
            <Moon size={16} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider uppercase text-white">{modalityName}</h1>
            <p className="text-[10px] text-gray-400">Sleep Initiation Protocol (4s Inhale • 7s Hold • 8s Exhale)</p>
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
          <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(147,51,234,0.3)]">
            <Moon size={32} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Pre-Sleep Check-in</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Rate your current <strong>Pre-Sleep Anxiety & Racing Thoughts</strong> (1 = Completely Calm, 10 = Severe Racing Thoughts).
            </p>
          </div>

          <div className="w-full space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-gray-400">Pre-Sleep Mind Activity</span>
              <span className="text-2xl font-mono text-purple-400">{preAnxiety} / 10</span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              value={preAnxiety}
              onChange={e => setPreAnxiety(parseInt(e.target.value))}
              className="w-full h-2 bg-black/60 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />

            <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              <span>1: Peaceful</span>
              <span>5: Moderate</span>
              <span>10: Racing Mind</span>
            </div>
          </div>

          <button
            onClick={handleStartSession}
            className="w-full py-4 px-8 min-h-[52px] bg-gradient-to-r from-purple-700 via-blue-600 to-emerald-600 hover:from-purple-600 hover:to-emerald-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_25px_rgba(124,58,237,0.4)] flex items-center justify-center gap-3 cursor-pointer border border-purple-400/40 transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <Play size={18} fill="currentColor" className="shrink-0" />
            <span>Begin 4-7-8 Session</span>
          </button>
        </div>
      )}

      {/* STEP 2: FULL-SCREEN PSYCHEDELIC LOTUS CANVAS */}
      {step === 'SESSION' && (
        <>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 cursor-pointer" onClick={() => setIsPaused(!isPaused)} />

          {/* Dynamic Guidance Overlay Below Graphic (Auto-fades after 30s) */}
          <div className={`z-10 flex flex-col items-center text-center space-y-2 pointer-events-none mt-auto mb-4 transition-all duration-1000 ${
            elapsedSeconds >= 30 ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}>
            <div className="text-xs uppercase font-extrabold tracking-[0.2em] text-emerald-300/90 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full backdrop-blur-md">
              {phase === 'INHALE' && '1. Quiet Inhale (NOSE ONLY - 4s)'}
              {phase === 'HOLD' && '2. Vascular Hold (HOLD BREATH - 7s)'}
              {phase === 'EXHALE' && '3. Complete Exhale (MOUTH WHOOSH - 8s)'}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(16,185,129,0.6)]">
              {phase === 'INHALE' && 'QUIET NOSE INHALE'}
              {phase === 'HOLD' && 'VASCULAR HOLD'}
              {phase === 'EXHALE' && 'MOUTH WHOOSH EXHALE'}
            </h2>

            <p className="text-xs font-mono text-gray-300">
              Inhale through NOSE ➔ Exhale completely through MOUTH (Vagal Heart Rate Deceleration)
            </p>
          </div>

          {/* Metrics Footer */}
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
              <span className="text-xl font-mono font-bold text-pink-400">{completedCycles} / 16</span>
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
            <p className="text-xs text-gray-400">Completed 5 minutes of 4-7-8 Relaxing Breathwork.</p>
          </div>

          <div className="w-full space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-gray-400">Post-Session Mind Activity</span>
              <span className="text-2xl font-mono text-emerald-400">{postAnxiety} / 10</span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              value={postAnxiety}
              onChange={e => setPostAnxiety(parseInt(e.target.value))}
              className="w-full h-2 bg-black/60 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />

            <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs font-bold">
              <span className="text-gray-400">Pre-Sleep Calm Shift:</span>
              <span className={`font-mono ${anxietyDelta > 0 ? 'text-emerald-400' : 'text-gray-300'}`}>
                {anxietyDelta > 0 ? `⚡ -${anxietyDelta} Points Calmer` : 'Peaceful Baseline'}
              </span>
            </div>
          </div>

          <button
            onClick={handleFinishAndSave}
            disabled={isSaving}
            className="w-full py-4 px-8 min-h-[52px] bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {isSaving ? 'Saving Bio-Feedback...' : 'Save & Prepare for Sleep'}
          </button>
        </div>
      )}
    </div>
  )
}
