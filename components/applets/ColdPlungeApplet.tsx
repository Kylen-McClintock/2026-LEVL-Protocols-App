'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Check,
  CheckCircle2,
  Sparkles,
  Snowflake,
  Thermometer,
  Flame,
  Activity,
  ShieldCheck,
  Waves,
  Music,
  Bell,
  BellOff,
  Wind,
  Info,
  Sliders,
  ChevronRight
} from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { saveBatchOutcomeObservations, updateTaskExecutionDetails } from '@/lib/data'
import { format } from 'date-fns'

interface ColdPlungeAppletProps {
  isOpen: boolean
  onClose: () => void
  modalityName?: string
  taskId?: string
  onComplete?: () => void
}

type SoundTrack = 'ZEN_FLUTE' | 'HANDPAN' | 'GLACIAL_DRONE' | 'OFF'

interface TempPreset {
  f: number
  c: number
  label: string
  intensity: 'Hormetic Standard' | 'Advanced Cold' | 'Near Freezing'
}

const TEMP_PRESETS: TempPreset[] = [
  { f: 55, c: 13, label: '55°F (13°C)', intensity: 'Hormetic Standard' },
  { f: 50, c: 10, label: '50°F (10°C)', intensity: 'Hormetic Standard' },
  { f: 45, c: 7, label: '45°F (7°C)', intensity: 'Advanced Cold' },
  { f: 40, c: 4, label: '40°F (4.5°C)', intensity: 'Advanced Cold' },
  { f: 36, c: 2, label: '36°F (2°C)', intensity: 'Near Freezing' }
]

const DURATION_PRESETS = [
  { seconds: 60, label: '1:00', badge: 'Shock Gate', desc: 'Acute habituation baseline' },
  { seconds: 120, label: '2:00', badge: 'Standard', desc: 'Optimal norepinephrine spike' },
  { seconds: 180, label: '3:00', badge: '⭐ Søberg Optimal', desc: 'Full brown-fat activation window' },
  { seconds: 300, label: '5:00', badge: 'Advanced', desc: 'High cold-adapted resilience' }
]

export default function ColdPlungeApplet({
  isOpen,
  onClose,
  modalityName = 'Deliberate Cold Plunge Immersion',
  taskId,
  onComplete
}: ColdPlungeAppletProps) {
  // Navigation Flow
  const [step, setStep] = useState<'PRE_CHECK' | 'SESSION' | 'POST_CHECK'>('PRE_CHECK')

  // Plunge Parameters
  const [targetSeconds, setTargetSeconds] = useState<number>(180) // 3 mins default
  const [secondsRemaining, setSecondsRemaining] = useState<number>(180)
  const [isActive, setIsActive] = useState<boolean>(false)
  const [selectedTemp, setSelectedTemp] = useState<TempPreset>(TEMP_PRESETS[1]) // 50°F / 10°C
  const [submersionDepth, setSubmersionDepth] = useState<'waist' | 'chest' | 'neck'>('chest')
  const [preBreathworkDone, setPreBreathworkDone] = useState<boolean>(true)

  // Audio Controls
  const [soundTrack, setSoundTrack] = useState<SoundTrack>('ZEN_FLUTE')
  const [chimesEnabled, setChimesEnabled] = useState<boolean>(true) // Optional pleasant chimes
  const [musicVolume, setMusicVolume] = useState<number>(0.5) // 0 to 1
  const [chimeVolume, setChimeVolume] = useState<number>(0.6) // 0 to 1
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false)
  const [showAudioSettings, setShowAudioSettings] = useState<boolean>(false)

  // Post-Session Observables & Metrics
  const [dopamineBoost, setDopamineBoost] = useState<number>(9) // 1-10
  const [shiveringStatus, setShiveringStatus] = useState<'none' | 'mild' | 'strong'>('mild')
  const [thermalComfort, setThermalComfort] = useState<number>(8) // 1-10
  const [sobergCompliant, setSobergCompliant] = useState<boolean>(true) // No hot shower / sauna
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Pre-entry breath coach mini-state
  const [isPreBreathActive, setIsPreBreathActive] = useState<boolean>(false)
  const [breathPhase, setBreathPhase] = useState<'INHALE' | 'EXHALE'>('INHALE')
  const [breathTimer, setBreathTimer] = useState<number>(4)

  // Milestone triggers tracking (ensuring single pleasant trigger, NEVER repeating alarm)
  const shockGateFiredRef = useRef<boolean>(false)
  const halfWayFiredRef = useRef<boolean>(false)
  const completionChimeFiredRef = useRef<boolean>(false)

  // Refs for Audio & Timer
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const chimeGainRef = useRef<GainNode | null>(null)
  const droneGainRef = useRef<GainNode | null>(null)
  const droneNodesRef = useRef<{ stop: () => void }[]>([])
  const musicAudioRef = useRef<HTMLAudioElement | null>(null)

  // Sync timer when target changes in setup
  useEffect(() => {
    if (step === 'PRE_CHECK' && !isActive) {
      setSecondsRemaining(targetSeconds)
    }
  }, [targetSeconds, step, isActive])

  // --- AUDIO SYNTHESIS & PLAYBACK ENGINE ---
  const unlockAudioContext = () => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioCtx) return null
        const ctx = new AudioCtx()
        audioContextRef.current = ctx

        // Master Gain
        const masterGain = ctx.createGain()
        masterGain.gain.setValueAtTime(isAudioMuted ? 0 : 1, ctx.currentTime)
        masterGain.connect(ctx.destination)
        masterGainRef.current = masterGain

        // Dedicated Chime Gain
        const cGain = ctx.createGain()
        cGain.gain.setValueAtTime(chimeVolume, ctx.currentTime)
        cGain.connect(masterGain)
        chimeGainRef.current = cGain

        // Dedicated Synthesized Drone Gain
        const dGain = ctx.createGain()
        dGain.gain.setValueAtTime(musicVolume * 0.45, ctx.currentTime)
        dGain.connect(masterGain)
        droneGainRef.current = dGain
      }

      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume()
      }

      return audioContextRef.current
    } catch (err) {
      console.warn('AudioContext init error:', err)
      return null
    }
  }

  // Pleasant Resonant Tibetan Singing Bowl Chime (Single strike with exponential decay)
  const playPleasantChime = (baseFreq = 432, duration = 3.8) => {
    if (!chimesEnabled || isAudioMuted) return
    const ctx = unlockAudioContext()
    if (!ctx || !chimeGainRef.current) return

    try {
      const now = ctx.currentTime
      const singleStrikeGain = ctx.createGain()
      singleStrikeGain.gain.setValueAtTime(0.0001, now)
      singleStrikeGain.gain.linearRampToValueAtTime(chimeVolume * 0.4, now + 0.04)
      singleStrikeGain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
      singleStrikeGain.connect(chimeGainRef.current)

      // Harmonics for a soothing singing bowl
      const harmonicFreqs = [baseFreq, baseFreq * 2, baseFreq * 2.76, baseFreq * 4.05]
      const harmonicWeights = [0.65, 0.22, 0.09, 0.04]

      harmonicFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const nodeGain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now)
        nodeGain.gain.setValueAtTime(harmonicWeights[idx], now)

        osc.connect(nodeGain)
        nodeGain.connect(singleStrikeGain)

        osc.start(now)
        osc.stop(now + duration)
      })
    } catch (_) {}
  }

  // Stop synthetic drone nodes
  const stopSyntheticDrone = () => {
    droneNodesRef.current.forEach(node => {
      try {
        node.stop()
      } catch (_) {}
    })
    droneNodesRef.current = []
  }

  // Synthesized 432Hz Glacial Theta Drone with gentle ocean lowpass sweep
  const startSyntheticDrone = () => {
    stopSyntheticDrone()
    if (isAudioMuted) return
    const ctx = unlockAudioContext()
    if (!ctx || !droneGainRef.current) return

    try {
      const now = ctx.currentTime
      const droneOsc1 = ctx.createOscillator()
      const droneOsc2 = ctx.createOscillator()
      const filter = ctx.createBiquadFilter()

      droneOsc1.type = 'sine'
      droneOsc1.frequency.setValueAtTime(216, now) // 216 Hz warm sub-base
      droneOsc2.type = 'triangle'
      droneOsc2.frequency.setValueAtTime(432, now) // 432 Hz healing carrier

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(320, now)

      // Gentle LFO filter modulation mimicking slow glacial waves (~14s cycle)
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.type = 'sine'
      lfo.frequency.setValueAtTime(0.07, now)
      lfoGain.gain.setValueAtTime(110, now)
      lfo.connect(filter.frequency)
      lfo.start(now)

      droneOsc1.connect(filter)
      droneOsc2.connect(filter)
      filter.connect(droneGainRef.current)

      droneOsc1.start(now)
      droneOsc2.start(now)

      droneNodesRef.current.push({
        stop: () => {
          try {
            droneOsc1.stop()
            droneOsc2.stop()
            lfo.stop()
          } catch (_) {}
        }
      })
    } catch (_) {}
  }

  // Manage recorded music tracks (Zen Flute & Handpan)
  const stopRecordedMusic = () => {
    if (musicAudioRef.current) {
      musicAudioRef.current.pause()
      musicAudioRef.current.currentTime = 0
    }
  }

  const startRecordedMusic = (src: string) => {
    stopRecordedMusic()
    stopSyntheticDrone()
    if (isAudioMuted) return

    try {
      const audio = new Audio(src)
      audio.loop = true
      audio.volume = isAudioMuted ? 0 : musicVolume
      audio.play().catch(err => {
        console.debug('Autoplay restricted or user gesture needed:', err)
      })
      musicAudioRef.current = audio
    } catch (err) {
      console.warn('Error playing audio track:', err)
    }
  }

  // Sync music track selection
  useEffect(() => {
    if (step === 'SESSION' && isActive) {
      if (soundTrack === 'ZEN_FLUTE') {
        startRecordedMusic('/audio/bamboo-flute-zen.mp3')
      } else if (soundTrack === 'HANDPAN') {
        startRecordedMusic('/audio/handpan-meditation.mp3')
      } else if (soundTrack === 'GLACIAL_DRONE') {
        stopRecordedMusic()
        startSyntheticDrone()
      } else {
        stopRecordedMusic()
        stopSyntheticDrone()
      }
    } else {
      stopRecordedMusic()
      stopSyntheticDrone()
    }

    return () => {
      stopRecordedMusic()
      stopSyntheticDrone()
    }
  }, [step, isActive, soundTrack])

  // Sync volume changes
  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = isAudioMuted ? 0 : musicVolume
    }
    if (droneGainRef.current && audioContextRef.current) {
      droneGainRef.current.gain.setValueAtTime(
        isAudioMuted ? 0 : musicVolume * 0.45,
        audioContextRef.current.currentTime
      )
    }
    if (chimeGainRef.current && audioContextRef.current) {
      chimeGainRef.current.gain.setValueAtTime(
        isAudioMuted ? 0 : chimeVolume,
        audioContextRef.current.currentTime
      )
    }
  }, [musicVolume, chimeVolume, isAudioMuted])

  // Pre-Entry Breathwork Animation Pacer (4s Inhale / 6s Exhale)
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPreBreathActive) {
      interval = setInterval(() => {
        setBreathTimer(prev => {
          if (prev <= 1) {
            setBreathPhase(curr => (curr === 'INHALE' ? 'EXHALE' : 'INHALE'))
            return breathPhase === 'INHALE' ? 6 : 4
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPreBreathActive, breathPhase])

  // Timer Tick Engine
  useEffect(() => {
    if (isActive && step === 'SESSION') {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          const elapsed = targetSeconds - prev + 1

          // 1. Cold Shock Gate Milestone (60s mark reached)
          if (elapsed === 60 && !shockGateFiredRef.current) {
            shockGateFiredRef.current = true
            playPleasantChime(528, 4.0) // 528 Hz reassuring tone
          }

          // 2. Halfway Milestone
          const halfWaySeconds = Math.floor(targetSeconds / 2)
          if (prev === halfWaySeconds && !halfWayFiredRef.current && halfWaySeconds > 60) {
            halfWayFiredRef.current = true
            playPleasantChime(432, 3.5)
          }

          // 3. Final Completion
          if (prev <= 1) {
            if (!completionChimeFiredRef.current) {
              completionChimeFiredRef.current = true
              playPleasantChime(528, 4.5) // Gentle single bell chime, NOT an alarm!
            }
            setIsActive(false)
            setStep('POST_CHECK')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, step, targetSeconds, chimesEnabled, isAudioMuted])

  // Calculated Progress & Phase
  const elapsedSeconds = targetSeconds - secondsRemaining
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100))

  // Cold Immersion Phase Determination
  const currentPhase = useMemo(() => {
    if (elapsedSeconds < 60) {
      return {
        name: 'Phase 1: Cold Shock Response',
        badge: '⚡ Acute Shock Reflex',
        sub: 'Lengthen your exhale through the nose. Do not hyperventilate. The gasp reflex subsides in 45–60s.',
        color: 'text-amber-300',
        borderColor: 'border-amber-500/40',
        bg: 'bg-amber-500/10'
      }
    } else if (secondsRemaining > 30) {
      return {
        name: 'Phase 2: Hormetic Habituation',
        badge: '❄️ Vagal Nerve Engaged',
        sub: 'Cold shock gate cleared. Heart rate stabilizing. Sustained 250%+ norepinephrine and dopamine surge active.',
        color: 'text-cyan-300',
        borderColor: 'border-cyan-500/40',
        bg: 'bg-cyan-500/10'
      }
    } else {
      return {
        name: 'Phase 3: Brown Fat Activation',
        badge: '🔥 Thermogenic Finish',
        sub: 'Final stretch. Prepare to exit without external heat to trigger endogenous mitochondrial uncoupling (UCP1).',
        color: 'text-emerald-300',
        borderColor: 'border-emerald-500/40',
        bg: 'bg-emerald-500/10'
      }
    }
  }, [elapsedSeconds, secondsRemaining])

  // Save Session & Persist to Supabase
  const handleSaveAndComplete = async () => {
    setIsSaving(true)
    try {
      const dateStr = format(new Date(), 'yyyy-MM-dd')
      const localUserId = getLocalUserId()

      // Save Outcome Observations to Supabase
      await saveBatchOutcomeObservations([
        {
          localUserId,
          outcomeId: 'acute_dopamine_boost',
          phase: 'post',
          value: dopamineBoost,
          checkinDate: dateStr,
          taskId: taskId || 'cold_plunge_session'
        },
        {
          localUserId,
          outcomeId: 'thermal_recovery_comfort',
          phase: 'post',
          value: thermalComfort,
          checkinDate: dateStr,
          taskId: taskId || 'cold_plunge_session'
        }
      ])

      // Persist Task Execution Details
      if (taskId) {
        await updateTaskExecutionDetails(taskId, {
          duration: Math.round(elapsedSeconds / 60) || 1,
          completed_seconds: elapsedSeconds,
          target_seconds: targetSeconds,
          water_temp_f: selectedTemp.f,
          water_temp_c: selectedTemp.c,
          submersion_depth: submersionDepth,
          shivering_status: shiveringStatus,
          soberg_principle_adhered: sobergCompliant,
          dopamine_clarity_score: dopamineBoost,
          thermal_comfort_score: thermalComfort,
          audio_track_used: soundTrack,
          notes: `Completed ${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s Deliberate Cold Plunge at ${selectedTemp.label}. Shivering: ${shiveringStatus}. Clarity: ${dopamineBoost}/10.`
        })
      }

      if (onComplete) onComplete()
      onClose()
    } catch (err) {
      console.error('Error saving cold plunge session:', err)
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

  return (
    <div className="fixed inset-0 z-[100] bg-[#030914] text-white flex flex-col items-center justify-between font-sans overflow-hidden select-none animate-in fade-in duration-300 keep-white">
      {/* Ambient Glacial Ripple Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-cyan-600/10 blur-[140px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-blue-600/15 blur-[100px] animate-pulse" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-teal-500/10 blur-[120px]" />
      </div>

      {/* HEADER */}
      <header className="w-full max-w-4xl px-6 py-5 flex items-center justify-between z-20 border-b border-cyan-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(56,189,248,0.3)]">
            <Snowflake size={20} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wider uppercase text-cyan-100">{modalityName}</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                {selectedTemp.label}
              </span>
            </div>
            <p className="text-[11px] text-cyan-400/60 font-medium">
              Søberg Protocol • 11 Mins Weekly Threshold • Norepinephrine +250%
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Audio Quick Settings Button */}
          <button
            type="button"
            onClick={() => setShowAudioSettings(prev => !prev)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              showAudioSettings
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
            title="Audio & Music Settings"
          >
            {isAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span className="hidden sm:inline">
              {soundTrack === 'OFF' ? 'Silent' : soundTrack === 'ZEN_FLUTE' ? 'Zen Flute' : soundTrack === 'HANDPAN' ? 'Handpan' : 'Glacial'}
            </span>
          </button>

          {/* Close / Exit Button */}
          <button
            type="button"
            onClick={() => {
              if (isActive) {
                if (confirm('End cold plunge session early?')) {
                  setIsActive(false)
                  setStep('POST_CHECK')
                }
              } else {
                onClose()
              }
            }}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* FLOATING AUDIO SETTINGS OVERLAY */}
      {showAudioSettings && (
        <div className="w-full max-w-xl mx-4 my-2 p-4 bg-[#051329]/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Music size={14} /> Ambient Soundscape &amp; Chime Controls
            </span>
            <button
              type="button"
              onClick={() => setShowAudioSettings(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              Done
            </button>
          </div>

          {/* Soundscape Track Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-cyan-200">Meditative Music</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSoundTrack('ZEN_FLUTE')
                  setIsAudioMuted(false)
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  soundTrack === 'ZEN_FLUTE' && !isAudioMuted
                    ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold">🎋 Zen Flute</div>
                <div className="text-[10px] text-cyan-300/70">Japanese Bamboo</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSoundTrack('HANDPAN')
                  setIsAudioMuted(false)
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  soundTrack === 'HANDPAN' && !isAudioMuted
                    ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold">🥁 Handpan</div>
                <div className="text-[10px] text-cyan-300/70">Harmonic Steel</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSoundTrack('GLACIAL_DRONE')
                  setIsAudioMuted(false)
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  soundTrack === 'GLACIAL_DRONE' && !isAudioMuted
                    ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold">🌊 Glacial Theta</div>
                <div className="text-[10px] text-cyan-300/70">432Hz Drone</div>
              </button>

              <button
                type="button"
                onClick={() => setSoundTrack('OFF')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  soundTrack === 'OFF'
                    ? 'bg-slate-700/40 border-slate-500 text-white'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold">🔇 Off</div>
                <div className="text-[10px] text-slate-400">Silent Focus</div>
              </button>
            </div>
          </div>

          {/* Pleasant Milestone Chimes (OPTIONAL & NON-PERSISTENT per user request) */}
          <div className="pt-2 border-t border-cyan-900/40 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-cyan-100 flex items-center gap-1.5">
                {chimesEnabled ? <Bell size={13} className="text-cyan-400" /> : <BellOff size={13} className="text-slate-400" />}
                Pleasant Milestone Chimes
              </div>
              <div className="text-[10px] text-slate-400">
                Single gentle singing bowl bell at 60s shock gate &amp; completion (never loops or alarms).
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setChimesEnabled(prev => !prev)
                if (!chimesEnabled) {
                  playPleasantChime(528, 2.5) // Preview gentle chime
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                chimesEnabled
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50'
                  : 'bg-white/5 text-slate-400 border border-white/10'
              }`}
            >
              {chimesEnabled ? 'Enabled ✓' : 'Muted'}
            </button>
          </div>

          {/* Volume Slider */}
          <div className="pt-1 flex items-center gap-3">
            <Volume2 size={14} className="text-cyan-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isAudioMuted ? 0 : musicVolume}
              onChange={e => {
                setIsAudioMuted(false)
                setMusicVolume(parseFloat(e.target.value))
              }}
              className="flex-1 accent-cyan-400 h-1.5 bg-cyan-950 rounded-lg cursor-pointer"
            />
            <span className="text-[11px] font-mono text-cyan-300 w-8 text-right">
              {isAudioMuted ? '0%' : `${Math.round(musicVolume * 100)}%`}
            </span>
          </div>
        </div>
      )}

      {/* ================= STEP 1: PRE-ENTRY CONFIGURATION ================= */}
      {step === 'PRE_CHECK' && (
        <main className="w-full max-w-xl flex-1 px-6 py-4 flex flex-col justify-center items-center gap-5 z-10 overflow-y-auto">
          {/* Target Duration Selector */}
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-cyan-300">
              <span className="flex items-center gap-1.5">
                <Activity size={14} /> Target Submersion Duration
              </span>
              <span className="text-[10px] text-cyan-400/80 font-normal">Søberg target: 2–3 mins</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DURATION_PRESETS.map(preset => (
                <button
                  key={preset.seconds}
                  type="button"
                  onClick={() => setTargetSeconds(preset.seconds)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    targetSeconds === preset.seconds
                      ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_20px_rgba(56,189,248,0.25)] scale-[1.02]'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="text-lg font-black">{preset.label}</div>
                  <div className="text-[10px] font-bold text-cyan-300">{preset.badge}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Water Temperature Selector */}
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-cyan-300">
              <span className="flex items-center gap-1.5">
                <Thermometer size={14} /> Water Temperature
              </span>
              <span className="text-[10px] text-cyan-400/80 font-normal">Hormetic target: 50°F–55°F</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {TEMP_PRESETS.map(preset => (
                <button
                  key={preset.f}
                  type="button"
                  onClick={() => setSelectedTemp(preset)}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    selectedTemp.f === preset.f
                      ? 'bg-blue-600/30 border-cyan-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.25)] scale-[1.02]'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="text-sm font-black">{preset.f}°F</div>
                  <div className="text-[10px] text-cyan-300/80">{preset.c}°C</div>
                </button>
              ))}
            </div>
          </div>

          {/* Submersion Depth */}
          <div className="w-full space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Waves size={14} /> Target Submersion Depth
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'waist', label: 'Waist / Legs', desc: 'Gentle tolerance acclimation' },
                { key: 'chest', label: 'Chest Submersion', desc: 'Recommended standard' },
                { key: 'neck', label: 'Up to Clavicle / Neck', desc: 'Maximum vagal nerve stimulation' }
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSubmersionDepth(opt.key as any)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    submersionDepth === opt.key
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Pre-Immersion Breath Coach Accordion */}
          <div className="w-full p-3.5 bg-cyan-950/30 border border-cyan-500/20 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind size={15} className="text-cyan-400" />
                <span className="text-xs font-bold text-cyan-200">Pre-Entry Calming Breathwork</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreBreathActive(prev => !prev)}
                className="text-[11px] font-bold text-cyan-300 hover:text-white cursor-pointer"
              >
                {isPreBreathActive ? 'Hide Breath Coach' : 'Start 30s Primer'}
              </button>
            </div>

            {isPreBreathActive ? (
              <div className="flex flex-col items-center py-2 space-y-2 animate-in fade-in duration-200">
                <div className="text-[10px] text-cyan-300/80 uppercase tracking-widest font-bold">
                  {breathPhase === 'INHALE' ? 'Inhale through nose' : 'Slow extended exhale through mouth'}
                </div>
                <div
                  className={`w-16 h-16 rounded-full border-2 border-cyan-400/80 flex items-center justify-center font-black text-xl transition-all duration-1000 ${
                    breathPhase === 'INHALE'
                      ? 'scale-125 bg-cyan-500/30 shadow-[0_0_25px_rgba(56,189,248,0.5)]'
                      : 'scale-90 bg-cyan-950/60'
                  }`}
                >
                  {breathTimer}
                </div>
                <p className="text-[10px] text-slate-400 text-center max-w-sm">
                  3 slow extended exhales drop your heart rate by 8–12 BPM before touching cold water, dramatically blunting the gasp reflex.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                3 slow physiological sighs prior to stepping in will down-regulate sympathetic adrenaline.
              </p>
            )}
          </div>

          {/* Start Plunge Button */}
          <button
            type="button"
            onClick={() => {
              unlockAudioContext()
              setIsActive(true)
              setStep('SESSION')
              shockGateFiredRef.current = false
              halfWayFiredRef.current = false
              completionChimeFiredRef.current = false
            }}
            className="w-full py-4.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-[0_0_35px_rgba(56,189,248,0.45)] flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98"
          >
            <Play size={20} className="fill-white" />
            <span>Enter Cold Plunge ({formatTimer(targetSeconds)})</span>
          </button>
        </main>
      )}

      {/* ================= STEP 2: IMMERSIVE FULL-SCREEN SESSION ================= */}
      {step === 'SESSION' && (
        <main className="w-full max-w-xl flex-1 px-6 py-6 flex flex-col justify-between items-center z-10">
          {/* Phase Badge & Clinical Guidance */}
          <div
            className={`w-full p-4 rounded-2xl border ${currentPhase.borderColor} ${currentPhase.bg} backdrop-blur-md text-center space-y-1 transition-all duration-500 animate-in fade-in`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className={`text-xs font-black uppercase tracking-wider ${currentPhase.color}`}>
                {currentPhase.name}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white">
                {currentPhase.badge}
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium max-w-md mx-auto">
              {currentPhase.sub}
            </p>
          </div>

          {/* Central Timer & Ripple Ring */}
          <div className="relative my-auto flex flex-col items-center justify-center">
            {/* Circular Progress Ring */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-cyan-950/60"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-cyan-400 transition-all duration-1000 ease-linear shadow-[0_0_20px_rgba(56,189,248,0.6)]"
                  strokeWidth="5"
                  strokeDasharray={276.46}
                  strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Central Time Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-6xl sm:text-7xl font-black tracking-tight text-white font-mono drop-shadow-[0_0_25px_rgba(56,189,248,0.4)]">
                  {formatTimer(secondsRemaining)}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 mt-1">
                  {progressPercent}% Complete
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Water: {selectedTemp.label}
                </span>
              </div>
            </div>

            {/* Cold Shock Gate 60s Indicator */}
            <div className="mt-4 flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  elapsedSeconds >= 60 ? 'bg-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]' : 'bg-amber-400 animate-ping'
                }`}
              />
              <span className="text-xs font-semibold text-slate-300">
                {elapsedSeconds >= 60
                  ? '60s Cold Shock Habituation Passed ✓'
                  : `Shock Gate: ${60 - elapsedSeconds}s remaining`}
              </span>
            </div>
          </div>

          {/* Action Control Bar */}
          <div className="w-full space-y-3">
            <div className="flex items-center justify-center gap-3">
              {/* Play / Pause Toggle */}
              <button
                type="button"
                onClick={() => setIsActive(prev => !prev)}
                className="flex-1 py-4 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 rounded-2xl text-cyan-100 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                {isActive ? (
                  <>
                    <Pause size={18} />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    <span>Resume</span>
                  </>
                )}
              </button>

              {/* End & Exit Early */}
              <button
                type="button"
                onClick={() => {
                  setIsActive(false)
                  setStep('POST_CHECK')
                }}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-300 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <CheckCircle2 size={18} />
                <span>Exit &amp; Log Plunge</span>
              </button>
            </div>

            {/* In-Session Quick Audio Toggle */}
            <div className="flex items-center justify-between px-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Music size={12} className="text-cyan-400" />
                <span>Music: {soundTrack === 'OFF' ? 'Muted' : soundTrack === 'ZEN_FLUTE' ? 'Zen Bamboo Flute' : soundTrack === 'HANDPAN' ? 'Handpan' : 'Glacial Theta'}</span>
              </span>

              <button
                type="button"
                onClick={() => setIsAudioMuted(prev => !prev)}
                className="text-cyan-300 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
              >
                {isAudioMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                <span>{isAudioMuted ? 'Unmute' : 'Mute'}</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ================= STEP 3: SØBERG PRINCIPLE & BIO-DELTA LOGGING ================= */}
      {step === 'POST_CHECK' && (
        <main className="w-full max-w-xl flex-1 px-6 py-4 flex flex-col justify-center items-center gap-4.5 z-10 overflow-y-auto">
          {/* Completion Celebration Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 mb-1 shadow-[0_0_25px_rgba(56,189,248,0.4)]">
              <Sparkles size={24} />
            </div>
            <h2 className="text-xl font-black text-white">Cold Plunge Immersion Complete</h2>
            <p className="text-xs text-cyan-400 font-medium">
              Completed {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s at {selectedTemp.label}
            </p>
          </div>

          {/* Søberg Principle Re-Warm Education Card */}
          <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-blue-950/40 border border-cyan-500/30 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-200 flex items-center gap-1.5">
                <Flame size={14} className="text-amber-400" />
                The Søberg Principle (Thermogenesis)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                Essential
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Do NOT immediately take a hot shower or use a sauna.</strong> Allowing your body to re-warm endogenously forces Brown Adipose Tissue (BAT) to combust stored energy, producing sustained metabolic heat and upregulating mitochondrial uncoupling (UCP1).
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] text-cyan-300/80 font-medium">
              <span>💡 Tip:</span>
              <span>Embrace the shiver for 5–10 minutes. Stand in horse stance to generate internal core warmth.</span>
            </div>
          </div>

          {/* Post-Plunge Observables */}
          <div className="w-full space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10 text-left">
            {/* Shivering Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Involuntary Shivering Observed?</span>
                <span className="text-[10px] text-cyan-300 font-normal">Søberg Brown Fat marker</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'none', label: 'None', desc: 'No visible shivering' },
                  { key: 'mild', label: 'Mild Shiver', desc: 'Light core tremor' },
                  { key: 'strong', label: 'Robust Shiver', desc: 'Max thermogenic burn' }
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setShiveringStatus(item.key as any)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      shiveringStatus === item.key
                        ? 'bg-cyan-500/25 border-cyan-400 text-white font-bold'
                        : 'bg-black/30 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs">{item.label}</div>
                    <div className="text-[9px] text-slate-400">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Acute Dopamine / Focus Rating */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                <span>Dopamine &amp; Mental Alertness</span>
                <span className="text-cyan-300 font-mono">{dopamineBoost}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={dopamineBoost}
                onChange={e => setDopamineBoost(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Drowsy / Sluggish</span>
                <span>Electric Clarity (+250%)</span>
              </div>
            </div>

            {/* Thermal Comfort / Recovery Rating */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                <span>Post-Plunge Resilient Comfort</span>
                <span className="text-cyan-300 font-mono">{thermalComfort}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={thermalComfort}
                onChange={e => setThermalComfort(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Painful / Numb</span>
                <span>Warm Core Invigoration</span>
              </div>
            </div>
          </div>

          {/* Finish & Save Session Button */}
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAndComplete}
            className="w-full py-4.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(56,189,248,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {isSaving ? (
              <span>Saving Session...</span>
            ) : (
              <>
                <Check size={18} />
                <span>Save Cold Plunge &amp; Complete Step</span>
              </>
            )}
          </button>
        </main>
      )}

      {/* FOOTER */}
      <footer className="w-full max-w-4xl px-6 py-4 flex items-center justify-between text-cyan-400/60 text-[11px] z-20 border-t border-cyan-950/40">
        <span>Cell Reports Medicine (Søberg et al., 2021)</span>
        <span>Target: 11 Mins / Week Total Immersion</span>
      </footer>
    </div>
  )
}
