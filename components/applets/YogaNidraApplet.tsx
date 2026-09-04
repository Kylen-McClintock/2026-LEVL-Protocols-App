'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  X, 
  Moon, 
  Sparkles, 
  Waves, 
  Brain, 
  Check, 
  CheckCircle2, 
  Activity, 
  ShieldCheck, 
  Zap,
  Sliders,
  Bell
} from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { saveBatchOutcomeObservations, updateTaskExecutionDetails } from '@/lib/data'
import { format } from 'date-fns'

interface YogaNidraAppletProps {
  isOpen: boolean
  onClose: () => void
  modalityName?: string
  taskId?: string
  onComplete?: () => void
}

type SoundscapeMode = 'BINAURAL_THETA' | 'OCEAN_DRONE' | 'CHIMES_ONLY'

interface DurationPreset {
  key: '10m_quick' | '20m_classic' | '30m_deep'
  label: string
  mins: number
  badge: string
  desc: string
}

const PRESETS: DurationPreset[] = [
  {
    key: '10m_quick',
    label: '10m Quick',
    mins: 10,
    badge: '⚡ Rapid Reset',
    desc: 'Acute dopamine & central fatigue rescue'
  },
  {
    key: '20m_classic',
    label: '20m Classic',
    mins: 20,
    badge: '⭐ Gold Standard',
    desc: 'Stanford Huberman NSDR neuroplasticity protocol'
  },
  {
    key: '30m_deep',
    label: '30m Deep',
    mins: 30,
    badge: '🌙 Deep Sleep Debt',
    desc: 'Somatic nidra recovery for severe sleep loss'
  }
]

export default function YogaNidraApplet({
  isOpen,
  onClose,
  modalityName = 'Non-Sleep Deep Rest (NSDR) / Yoga Nidra',
  taskId,
  onComplete
}: YogaNidraAppletProps) {
  // Session Step Flow: PRE_CHECK -> SESSION -> POST_CHECK
  const [step, setStep] = useState<'PRE_CHECK' | 'SESSION' | 'POST_CHECK'>('PRE_CHECK')
  
  // Protocol Duration & State
  const [targetMinutes, setTargetMinutes] = useState<number>(20)
  const totalSeconds = targetMinutes * 60
  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalSeconds)
  const [isActive, setIsActive] = useState<boolean>(false)
  const [isCompletedAlert, setIsCompletedAlert] = useState<boolean>(false)

  // Audio Configuration
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)
  const [volume, setVolume] = useState<number>(0.6) // 0 to 1
  const [soundscapeMode, setSoundscapeMode] = useState<SoundscapeMode>('BINAURAL_THETA')
  const [showAudioSettings, setShowAudioSettings] = useState<boolean>(false)

  // Somatic & Autonomic Observables
  const [preFatigue, setPreFatigue] = useState<number>(6) // 1-10
  const [postRestoration, setPostRestoration] = useState<number>(9) // 1-10
  const [eyeMaskUsed, setEyeMaskUsed] = useState<boolean>(true)
  const [feetElevated, setFeetElevated] = useState<boolean>(true)
  const [consciousTwilight, setConsciousTwilight] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Refs for Audio & Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const binauralGainRef = useRef<GainNode | null>(null)
  const droneGainRef = useRef<GainNode | null>(null)
  const oceanGainRef = useRef<GainNode | null>(null)
  const activeNodesRef = useRef<{ stop: () => void }[]>([])
  const lastStageIndexRef = useRef<number>(0)

  // Sync seconds when targetMinutes changes before session start
  useEffect(() => {
    if (step === 'PRE_CHECK' && !isActive) {
      setSecondsRemaining(targetMinutes * 60)
    }
  }, [targetMinutes, step, isActive])

  // --- WEB AUDIO SYNTHESIZER ENGINE ---
  const unlockAudioContext = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioCtx) return null
        const ctx = new AudioCtx()
        audioCtxRef.current = ctx

        // Master Gain Node
        const masterGain = ctx.createGain()
        masterGain.gain.setValueAtTime(soundEnabled ? volume * 0.35 : 0, ctx.currentTime)
        masterGain.connect(ctx.destination)
        masterGainRef.current = masterGain

        // Sub-bus gains
        const bGain = ctx.createGain()
        bGain.gain.setValueAtTime(1.0, ctx.currentTime)
        bGain.connect(masterGain)
        binauralGainRef.current = bGain

        const dGain = ctx.createGain()
        dGain.gain.setValueAtTime(0.8, ctx.currentTime)
        dGain.connect(masterGain)
        droneGainRef.current = dGain

        const oGain = ctx.createGain()
        oGain.gain.setValueAtTime(0.6, ctx.currentTime)
        oGain.connect(masterGain)
        oceanGainRef.current = oGain
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume()
      }

      return audioCtxRef.current
    } catch (err) {
      console.warn('AudioContext initialization error:', err)
      return null
    }
  }

  // Play Tibetan Singing Bowl Chime
  const playSingingBowlChime = (baseFreq = 432, duration = 4.2) => {
    if (!soundEnabled) return
    const ctx = unlockAudioContext()
    if (!ctx || !masterGainRef.current) return

    try {
      const now = ctx.currentTime
      const chimeGain = ctx.createGain()
      chimeGain.gain.setValueAtTime(0.0001, now)
      chimeGain.gain.linearRampToValueAtTime(0.35 * volume, now + 0.08)
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
      chimeGain.connect(masterGainRef.current)

      // Fundamental + Rich Meditation Harmonics
      const freqs = [baseFreq, baseFreq * 2, baseFreq * 2.76, baseFreq * 4.05]
      const weights = [0.6, 0.25, 0.1, 0.05]

      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator()
        const nodeGain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(f, now)
        nodeGain.gain.setValueAtTime(weights[idx], now)

        osc.connect(nodeGain)
        nodeGain.connect(chimeGain)

        osc.start(now)
        osc.stop(now + duration)
      })
    } catch (err) {
      console.debug('Chime playback error:', err)
    }
  }

  // Stop all running continuous synthesizers
  const stopAmbientAudio = () => {
    activeNodesRef.current.forEach(node => {
      try {
        node.stop()
      } catch (_) {}
    })
    activeNodesRef.current = []
  }

  // Start continuous entrainment soundscape
  const startAmbientAudio = () => {
    stopAmbientAudio()
    if (!soundEnabled) return
    const ctx = unlockAudioContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const runningNodes: { stop: () => void }[] = []

      // 1. STEREO BINAURAL THETA ENTRAINMENT (432 Hz Left + 437.5 Hz Right = 5.5 Hz Theta)
      if (soundscapeMode === 'BINAURAL_THETA' && binauralGainRef.current) {
        const merger = ctx.createChannelMerger(2)
        const oscL = ctx.createOscillator()
        const oscR = ctx.createOscillator()

        oscL.type = 'sine'
        oscR.type = 'sine'
        oscL.frequency.setValueAtTime(432, now) // Grounding carrier Left
        oscR.frequency.setValueAtTime(437.5, now) // 5.5 Hz Theta Beat Right

        oscL.connect(merger, 0, 0)
        oscR.connect(merger, 0, 1)
        merger.connect(binauralGainRef.current)

        oscL.start(now)
        oscR.start(now)

        runningNodes.push({
          stop: () => {
            try { oscL.stop(); oscR.stop(); } catch (_) {}
          }
        })
      }

      // 2. WARM TIBETAN OM DRONE (108 Hz + 216 Hz warm sub-harmonics with slow LFO)
      if ((soundscapeMode === 'BINAURAL_THETA' || soundscapeMode === 'OCEAN_DRONE') && droneGainRef.current) {
        const droneOsc1 = ctx.createOscillator()
        const droneOsc2 = ctx.createOscillator()
        const droneFilter = ctx.createBiquadFilter()

        droneOsc1.type = 'triangle'
        droneOsc1.frequency.setValueAtTime(108, now) // Sacred 108Hz Root

        droneOsc2.type = 'sine'
        droneOsc2.frequency.setValueAtTime(216, now) // Octave warm body

        droneFilter.type = 'lowpass'
        droneFilter.frequency.setValueAtTime(280, now)

        // Subtle slow breath LFO modulation on the drone filter
        const lfo = ctx.createOscillator()
        const lfoGain = ctx.createGain()
        lfo.type = 'sine'
        lfo.frequency.setValueAtTime(0.08, now) // ~12s breath cycle
        lfoGain.gain.setValueAtTime(90, now)
        lfo.connect(droneFilter.frequency)
        lfo.start(now)

        droneOsc1.connect(droneFilter)
        droneOsc2.connect(droneFilter)
        droneFilter.connect(droneGainRef.current)

        droneOsc1.start(now)
        droneOsc2.start(now)

        runningNodes.push({
          stop: () => {
            try { droneOsc1.stop(); droneOsc2.stop(); lfo.stop(); } catch (_) {}
          }
        })
      }

      // 3. RESTORATIVE PINK NOISE OCEAN WASH
      if ((soundscapeMode === 'BINAURAL_THETA' || soundscapeMode === 'OCEAN_DRONE') && oceanGainRef.current) {
        // Generate 4s looping pink noise buffer
        const bufferSize = ctx.sampleRate * 4
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const output = buffer.getChannelData(0)
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1
          b0 = 0.99886 * b0 + white * 0.0555179
          b1 = 0.99332 * b1 + white * 0.0750759
          b2 = 0.96900 * b2 + white * 0.1538520
          b3 = 0.86650 * b3 + white * 0.3104856
          b4 = 0.55000 * b4 + white * 0.5329522
          b5 = -0.7616 * b5 - white * 0.0168980
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04
          b6 = white * 0.115926
        }

        const noiseNode = ctx.createBufferSource()
        noiseNode.buffer = buffer
        noiseNode.loop = true

        const oceanFilter = ctx.createBiquadFilter()
        oceanFilter.type = 'lowpass'
        oceanFilter.frequency.setValueAtTime(450, now)

        const oceanSwellGain = ctx.createGain()
        oceanSwellGain.gain.setValueAtTime(0.04, now)

        // Swell LFO (simulates gentle ocean waves)
        const swellLfo = ctx.createOscillator()
        const swellLfoGain = ctx.createGain()
        swellLfo.type = 'sine'
        swellLfo.frequency.setValueAtTime(0.06, now) // ~16s wave period
        swellLfoGain.gain.setValueAtTime(0.03, now)
        swellLfo.connect(oceanSwellGain.gain)
        swellLfo.start(now)

        noiseNode.connect(oceanFilter)
        oceanFilter.connect(oceanSwellGain)
        oceanSwellGain.connect(oceanGainRef.current)

        noiseNode.start(now)

        runningNodes.push({
          stop: () => {
            try { noiseNode.stop(); swellLfo.stop(); } catch (_) {}
          }
        })
      }

      activeNodesRef.current = runningNodes
    } catch (err) {
      console.warn('Error starting ambient soundscape:', err)
    }
  }

  // Update volume / mute on changes
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      const targetGain = soundEnabled ? volume * 0.35 : 0
      masterGainRef.current.gain.setTargetAtTime(targetGain, audioCtxRef.current.currentTime, 0.05)
    }
  }, [soundEnabled, volume])

  // Restart soundscape if soundscapeMode changes while active
  useEffect(() => {
    if (isActive && step === 'SESSION') {
      startAmbientAudio()
    }
  }, [soundscapeMode])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAmbientAudio()
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {})
      }
    }
  }, [])

  // --- STAGE CALCULATION ---
  const elapsedSeconds = totalSeconds - secondsRemaining
  const elapsedMinutes = elapsedSeconds / 60

  const STAGES = [
    {
      name: 'Diaphragmatic Settling',
      wave: 'Beta → Alpha',
      hz: '14–18 Hz',
      chimeFreq: 432,
      desc: 'Nasal inhales, deep somatic exhalations, and autonomic nervous system deceleration.',
      colorHex: '#F59E0B',
      colorBadge: 'bg-amber-500/20 border-amber-500/40 text-amber-300'
    },
    {
      name: 'Peripheral Body Scan',
      wave: 'Alpha Somatic',
      hz: '8–12 Hz',
      chimeFreq: 528,
      desc: 'Systematic bodily rotation of awareness from extremities to heart center.',
      colorHex: '#06B6D4',
      colorBadge: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
    },
    {
      name: 'Theta Hypnagogic Twilight',
      wave: 'Theta Rest',
      hz: '4–7 Hz',
      chimeFreq: 639,
      desc: 'Borderland of conscious awareness; neural synaptic pruning and cellular rejuvenation.',
      colorHex: '#A855F7',
      colorBadge: 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
    },
    {
      name: 'Gentle Re-Emergence',
      wave: 'Restored Alertness',
      hz: '10–14 Hz',
      chimeFreq: 852,
      desc: 'Grounding awakening with refreshed prefrontal ATP and replenished striatal dopamine.',
      colorHex: '#10B981',
      colorBadge: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
    }
  ]

  const currentStageIndex = (() => {
    if (elapsedMinutes < 2.5) return 0
    if (elapsedMinutes < (targetMinutes * 0.45)) return 1
    if (targetMinutes - elapsedMinutes <= 2.5) return 3
    return 2
  })()

  const currentStage = STAGES[currentStageIndex]

  // Play chime on stage shift
  useEffect(() => {
    if (isActive && step === 'SESSION') {
      if (lastStageIndexRef.current !== currentStageIndex) {
        lastStageIndexRef.current = currentStageIndex
        playSingingBowlChime(currentStage.chimeFreq, 5.0)
      }
    }
  }, [currentStageIndex, isActive, step])

  // --- TIMER ENGINE ---
  useEffect(() => {
    if (isActive && step === 'SESSION') {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            setIsActive(false)
            setIsCompletedAlert(true)
            stopAmbientAudio()
            playSingingBowlChime(432, 6.0)
            setStep('POST_CHECK')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, step])

  // Start Session Handler
  const handleStartSession = () => {
    unlockAudioContext()
    setStep('SESSION')
    setIsActive(true)
    setSecondsRemaining(totalSeconds)
    setIsCompletedAlert(false)
    lastStageIndexRef.current = 0
    playSingingBowlChime(432, 4.5)
    startAmbientAudio()
  }

  // Toggle Pause / Resume
  const handleTogglePlay = () => {
    unlockAudioContext()
    if (secondsRemaining <= 0) {
      setSecondsRemaining(totalSeconds)
      setIsCompletedAlert(false)
    }
    const nextActive = !isActive
    setIsActive(nextActive)
    if (nextActive) {
      startAmbientAudio()
    } else {
      stopAmbientAudio()
    }
  }

  // Reset Session
  const handleReset = () => {
    setIsActive(false)
    stopAmbientAudio()
    setSecondsRemaining(totalSeconds)
    setIsCompletedAlert(false)
  }

  // --- 60 FPS BIOLUMINESCENT CANVAS VISUALIZER ---
  useEffect(() => {
    if (step !== 'SESSION') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let startTime = performance.now()

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000
      const dpr = window.devicePixelRatio || 1
      const width = window.innerWidth
      const height = window.innerHeight

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)
      }

      // Deep space background
      ctx.fillStyle = '#030712'
      ctx.fillRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2
      const baseRadius = Math.min(width, height) * 0.22

      // Stage-specific pulsating ambient glow
      const breathPhase = Math.sin(elapsed * 0.4) // ~15s breath cycle
      const pulseScale = 1 + breathPhase * 0.08
      const glowGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, baseRadius * 1.8 * pulseScale)
      
      const glowHex = currentStage.colorHex
      glowGrad.addColorStop(0, glowHex + '33')
      glowGrad.addColorStop(0.5, glowHex + '11')
      glowGrad.addColorStop(1, 'rgba(3, 7, 18, 0)')

      ctx.fillStyle = glowGrad
      ctx.beginPath()
      ctx.arc(cx, cy, baseRadius * 1.8 * pulseScale, 0, Math.PI * 2)
      ctx.fill()

      // Concentric Harmonic Waves
      for (let ring = 1; ring <= 4; ring++) {
        const ringRadius = baseRadius * (0.45 + ring * 0.25) * (1 + Math.sin(elapsed * 0.5 + ring) * 0.04)
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2)
        ctx.strokeStyle = glowHex + (ring === 2 ? '44' : '22')
        ctx.lineWidth = ring === 2 ? 2 : 1
        ctx.stroke()
        ctx.restore()
      }

      // Rotating Sacred Geometry Mandala Nodes
      const nodeCount = 12
      const rotAngle = elapsed * 0.05
      for (let i = 0; i < nodeCount; i++) {
        const angle = rotAngle + (i * Math.PI * 2) / nodeCount
        const nx = cx + Math.cos(angle) * (baseRadius * 0.95 * pulseScale)
        const ny = cy + Math.sin(angle) * (baseRadius * 0.95 * pulseScale)

        ctx.beginPath()
        ctx.arc(nx, ny, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = glowHex
        ctx.shadowBlur = 12
        ctx.fill()
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    animFrameRef.current = requestAnimationFrame(render)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [step, currentStage.colorHex])

  // --- SAVE AND COMPLETE PROTOCOL ---
  const handleFinishAndSave = async () => {
    setIsSaving(true)
    try {
      const localUserId = getLocalUserId()
      const dateStr = format(new Date(), 'yyyy-MM-dd')
      const completedSecs = totalSeconds - secondsRemaining

      // 1. Save Outcome Observations (Energy & Stress Resilience)
      await saveBatchOutcomeObservations([
        {
          localUserId,
          outcomeId: 'energy',
          phase: 'pre',
          value: 10 - preFatigue, // Inverted so 10 = max energy
          checkinDate: dateStr,
          taskId: taskId || 'nsdr_applet'
        },
        {
          localUserId,
          outcomeId: 'energy',
          phase: 'post',
          value: postRestoration,
          checkinDate: dateStr,
          taskId: taskId || 'nsdr_applet'
        },
        {
          localUserId,
          outcomeId: 'stress_resilience',
          phase: 'post',
          value: postRestoration,
          checkinDate: dateStr,
          taskId: taskId || 'nsdr_applet'
        }
      ])

      // 2. Persist Task Execution Details
      if (taskId) {
        await updateTaskExecutionDetails(taskId, {
          duration: targetMinutes,
          completed_seconds: completedSecs,
          brainwave_state_reached: targetMinutes >= 20 ? 'theta' : 'alpha',
          accidental_sleep: !consciousTwilight,
          eye_mask_used: eyeMaskUsed,
          feet_elevated: feetElevated,
          pre_fatigue_score: preFatigue,
          post_restoration_score: postRestoration,
          notes: `Completed ${Math.round(completedSecs / 60)}m NSDR session. Restoration: ${postRestoration}/10.`
        })
      }

      if (onComplete) onComplete()
      onClose()
    } catch (err) {
      console.error('Error saving NSDR session metrics:', err)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const restorationDelta = postRestoration - (10 - preFatigue)

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col items-center justify-between font-sans overflow-hidden select-none animate-in fade-in duration-300">
      {/* Visualizer Canvas (Background in Session) */}
      {step === 'SESSION' && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />
      )}

      {/* TOP BAR */}
      <header className="w-full max-w-5xl px-6 py-5 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <Moon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wider uppercase text-white">{modalityName}</h1>
              <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Huberman Protocol
              </span>
            </div>
            <p className="text-[11px] text-indigo-200/70">
              Conscious Autonomic Rest • 432Hz &amp; 5.5Hz Theta Soundscape
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Audio Soundscape Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowAudioSettings(!showAudioSettings)}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showAudioSettings 
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                : 'bg-white/10 hover:bg-white/15 text-slate-300 border-white/20'
            }`}
            title="Audio Soundscape Controls"
          >
            <Sliders size={15} />
            <span className="hidden sm:inline">Audio Engine</span>
          </button>

          {/* Quick Sound Mute Toggle */}
          <button
            type="button"
            onClick={() => {
              unlockAudioContext()
              setSoundEnabled(!soundEnabled)
            }}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30'
                : 'bg-white/5 text-slate-500 border-white/10 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Close Modal */}
          <button
            type="button"
            onClick={() => {
              stopAmbientAudio()
              onClose()
            }}
            className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
            title="Exit Fullscreen"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* AUDIO ENGINE POP-OVER OVERLAY */}
      {showAudioSettings && (
        <div className="absolute top-20 right-6 z-30 w-80 p-4 bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-indigo-500/40 shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Waves size={14} /> Entrainment Audio Controls
            </span>
            <button
              type="button"
              onClick={() => playSingingBowlChime(528, 3.5)}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-200 flex items-center gap-1 bg-indigo-500/20 px-2 py-1 rounded-md border border-indigo-500/30"
            >
              <Bell size={11} /> Test Chime
            </button>
          </div>

          {/* Soundscape Mode Selector */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400">Audio Mode</span>
            <div className="grid grid-cols-1 gap-1.5">
              {[
                { key: 'BINAURAL_THETA', title: 'Theta 5.5Hz Entrainment', sub: '432Hz Carrier + Om Drone + Wave Wash' },
                { key: 'OCEAN_DRONE', title: 'Ocean Sanctuary & Drone', sub: 'Sub-harmonic resonance without beat' },
                { key: 'CHIMES_ONLY', title: 'Singing Bowls Only', sub: 'Pure silence with transition bells' }
              ].map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setSoundscapeMode(m.key as SoundscapeMode)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    soundscapeMode === m.key
                      ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-[0_0_10px_rgba(99,102,241,0.25)]'
                      : 'bg-black/30 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold">{m.title}</div>
                  <div className="text-[9px] text-slate-400">{m.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Volume Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Master Volume</span>
              <span className="font-mono font-bold text-indigo-300">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={e => {
                const val = parseFloat(e.target.value)
                setVolume(val)
                if (val > 0 && !soundEnabled) setSoundEnabled(true)
              }}
              className="w-full cursor-pointer accent-indigo-400"
            />
          </div>
        </div>
      )}

      {/* STEP 1: PRE-SESSION SETUP & CHECK-IN */}
      {step === 'PRE_CHECK' && (
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-4 max-w-xl w-full text-center space-y-5 z-20 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto shadow-[0_0_35px_rgba(99,102,241,0.4)]">
            <Brain size={32} />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              Autonomic Deep Reset
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Dr. Andrew Huberman&apos;s Non-Sleep Deep Rest protocol brings your brainwaves to Theta (4–7 Hz) to accelerate synaptic plasticity, clear adenylate fatigue, and restore prefrontal dopamine.
            </p>
          </div>

          {/* Target Duration Selector */}
          <div className="w-full space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select Session Duration
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {PRESETS.map(p => {
                const isSelected = targetMinutes === p.mins
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setTargetMinutes(p.mins)}
                    className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-b from-indigo-600/40 to-purple-600/30 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-[1.02]'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                    }`}
                  >
                    <span className="text-[9px] font-bold text-indigo-300">{p.badge}</span>
                    <span className="text-lg font-black text-white mt-0.5">{p.mins} Mins</span>
                    <span className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">{p.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Somatic Context Toggles */}
          <div className="w-full bg-slate-900/60 p-3.5 rounded-2xl border border-white/10 space-y-2 text-left">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-indigo-400" /> Optimal Protocol Posture
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEyeMaskUsed(!eyeMaskUsed)}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  eyeMaskUsed ? 'bg-indigo-600/25 border-indigo-400/50 text-indigo-200' : 'bg-black/30 border-white/10 text-slate-400'
                }`}
              >
                <span>Eye Mask / Darkness</span>
                <span>{eyeMaskUsed ? '✓' : '○'}</span>
              </button>

              <button
                type="button"
                onClick={() => setFeetElevated(!feetElevated)}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  feetElevated ? 'bg-indigo-600/25 border-indigo-400/50 text-indigo-200' : 'bg-black/30 border-white/10 text-slate-400'
                }`}
              >
                <span>Feet / Knees Elevated</span>
                <span>{feetElevated ? '✓' : '○'}</span>
              </button>
            </div>
          </div>

          {/* Pre-Session Fatigue Rating Slider */}
          <div className="w-full bg-slate-900/60 p-4 rounded-2xl border border-white/10 space-y-2 text-left">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <Activity size={13} className="text-amber-400" /> Pre-Session Mental Fatigue
              </span>
              <span className="font-mono font-bold text-amber-300 text-sm">{preFatigue}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={preFatigue}
              onChange={e => setPreFatigue(parseInt(e.target.value))}
              className="w-full cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>1 = Fresh &amp; Lucid</span>
              <span>10 = Severe Brain Fog</span>
            </div>
          </div>

          {/* Launch Session Button */}
          <button
            type="button"
            onClick={handleStartSession}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.5)] flex items-center justify-center gap-2.5 transition-all cursor-pointer transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <Sparkles size={18} fill="currentColor" />
            <span>Begin Fullscreen Session ({targetMinutes} Mins)</span>
          </button>
        </main>
      )}

      {/* STEP 2: ACTIVE IMMERSIVE SESSION */}
      {step === 'SESSION' && (
        <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-2xl text-center space-y-6 z-10">
          {/* Current Brainwave Stage Badge */}
          <div className="space-y-1.5 animate-in fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-md transition-all duration-700 shadow-lg"
                 style={{ 
                   borderColor: currentStage.colorHex + '77', 
                   backgroundColor: currentStage.colorHex + '22',
                   color: currentStage.colorHex
                 }}>
              <Waves size={14} className="animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider">{currentStage.name}</span>
              <span className="text-[10px] font-mono opacity-80">({currentStage.wave} • {currentStage.hz})</span>
            </div>
            <p className="text-xs text-slate-300/80 italic max-w-md mx-auto">
              &ldquo;{currentStage.desc}&rdquo;
            </p>
          </div>

          {/* Giant Countdown Clock */}
          <div className="relative flex flex-col items-center justify-center my-2">
            <span className="font-mono text-6xl sm:text-7xl md:text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_40px_rgba(255,255,255,0.25)]">
              {formatTimer(secondsRemaining)}
            </span>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full animate-ping"
                    style={{ backgroundColor: currentStage.colorHex }} />
              <span className="uppercase font-semibold tracking-wider">
                {isActive ? 'Deep Rest Active' : 'Session Paused'}
              </span>
            </div>
          </div>

          {/* Stage Timeline Dots */}
          <div className="w-full max-w-md space-y-2">
            <div className="grid grid-cols-4 gap-1.5">
              {STAGES.map((s, idx) => {
                const isPassed = idx < currentStageIndex
                const isCurrent = idx === currentStageIndex
                return (
                  <div
                    key={s.name}
                    className={`h-2 rounded-full transition-all duration-700 ${
                      isCurrent
                        ? 'bg-white shadow-[0_0_12px_#ffffff]'
                        : isPassed
                        ? 'bg-indigo-400/80'
                        : 'bg-white/10'
                    }`}
                  />
                )
              })}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Settling</span>
              <span>Body Scan</span>
              <span>Theta Twilight</span>
              <span>Emergence</span>
            </div>
          </div>

          {/* Session Playback Controls */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`px-8 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-xl cursor-pointer ${
                isActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-indigo-900/50 scale-105'
              }`}
            >
              {isActive ? (
                <>
                  <Pause size={18} /> Pause
                </>
              ) : (
                <>
                  <Play size={18} /> Resume
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white border border-white/20 transition-all cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw size={18} />
            </button>

            <button
              type="button"
              onClick={() => {
                stopAmbientAudio()
                playSingingBowlChime(432, 5.0)
                setStep('POST_CHECK')
              }}
              className="px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white border border-white/20 font-bold text-xs transition-all cursor-pointer"
            >
              Finish Early
            </button>
          </div>
        </main>
      )}

      {/* STEP 3: POST-SESSION RECOVERY CHECK-IN */}
      {step === 'POST_CHECK' && (
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-4 max-w-xl w-full text-center space-y-5 z-20 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <CheckCircle2 size={32} />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
              Session Complete
            </h2>
            <p className="text-xs text-slate-300">
              Autonomic down-regulation completed. Log your subjective restoration to track dopamine replenishment over time.
            </p>
          </div>

          {/* Restoration Slider */}
          <div className="w-full bg-slate-900/60 p-4 rounded-2xl border border-white/10 space-y-2 text-left">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <Zap size={13} className="text-emerald-400" /> Post-Session Restoration
              </span>
              <span className="font-mono font-bold text-emerald-300 text-sm">{postRestoration}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={postRestoration}
              onChange={e => setPostRestoration(parseInt(e.target.value))}
              className="w-full cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>1 = Minimal Relief</span>
              <span>10 = Deeply Recharged (+Dopamine)</span>
            </div>
          </div>

          {/* Sleep State Option */}
          <div className="w-full bg-slate-900/60 p-3.5 rounded-2xl border border-white/10 space-y-2 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Conscious Depth Verification
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConsciousTwilight(true)}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                  consciousTwilight
                    ? 'bg-emerald-600/25 border-emerald-400 text-emerald-200'
                    : 'bg-black/30 border-white/10 text-slate-400'
                }`}
              >
                ✨ Conscious Twilight (Ideal)
              </button>
              <button
                type="button"
                onClick={() => setConsciousTwilight(false)}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                  !consciousTwilight
                    ? 'bg-amber-600/25 border-amber-400 text-amber-200'
                    : 'bg-black/30 border-white/10 text-slate-400'
                }`}
              >
                💤 Accidental Deep Sleep
              </button>
            </div>
          </div>

          {/* Net Alertness Boost Delta */}
          <div className="w-full p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center justify-between text-xs text-indigo-200">
            <span className="flex items-center gap-1.5 font-bold">
              <Sparkles size={14} className="text-indigo-400" /> Net Autonomic Alertness Boost:
            </span>
            <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {restorationDelta >= 0 ? `+${restorationDelta}` : restorationDelta} Pts
            </span>
          </div>

          {/* Complete & Save Button */}
          <button
            type="button"
            disabled={isSaving}
            onClick={handleFinishAndSave}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {isSaving ? (
              <span>Saving Recovery Metrics...</span>
            ) : (
              <>
                <Check size={18} />
                <span>Save Metrics &amp; Complete Task</span>
              </>
            )}
          </button>
        </main>
      )}

      {/* FOOTER */}
      <footer className="w-full max-w-5xl px-6 py-4 flex items-center justify-between text-slate-400 text-[11px] z-20 border-t border-white/5">
        <span>Stanford School of Medicine Protocol</span>
        <span>Sound: 432 Hz Carrier • 5.5 Hz Theta • Tibetan Om Drone</span>
      </footer>
    </div>
  )
}
