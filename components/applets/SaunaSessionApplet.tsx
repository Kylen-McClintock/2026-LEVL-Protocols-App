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
  Flame,
  Thermometer,
  Activity,
  HeartPulse,
  Droplets,
  Music,
  Bell,
  BellOff,
  Sliders,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { saveBatchOutcomeObservations, updateTaskExecutionDetails } from '@/lib/data'
import { format } from 'date-fns'

interface SaunaSessionAppletProps {
  isOpen: boolean
  onClose: () => void
  modalityName?: string
  taskId?: string
  onComplete?: () => void
}

type SaunaType = 'TRADITIONAL' | 'INFRARED' | 'STEAM'
type AudioTrack = 'ZEN_FLUTE' | 'HANDPAN' | 'WARM_DRONE' | 'OFF'

interface SaunaTypeOption {
  type: SaunaType
  label: string
  tempDisplay: string
  defaultMinutes: number
  badge: string
  desc: string
}

const SAUNA_TYPES: SaunaTypeOption[] = [
  {
    type: 'TRADITIONAL',
    label: 'Traditional Finnish',
    tempDisplay: '174°F–195°F (80°C–90°C)',
    defaultMinutes: 20,
    badge: '⭐ Gold Standard',
    desc: 'Convective dry heat for HSP70 & 40–50% CVD mortality reduction'
  },
  {
    type: 'INFRARED',
    label: 'Far-Infrared Radiant',
    tempDisplay: '135°F–150°F (57°C–65°C)',
    defaultMinutes: 30,
    badge: 'Deep Tissue',
    desc: 'Photobiomodulation wavelength for cellular recovery & heavy metals'
  },
  {
    type: 'STEAM',
    label: 'Steam / Barrel',
    tempDisplay: '110°F–120°F (43°C–49°C)',
    defaultMinutes: 15,
    badge: 'High Humidity',
    desc: 'Respiratory mucosal hydration & lymphatic vasodilation'
  }
]

const DURATION_PRESETS = [
  { minutes: 15, label: '15 Mins', badge: 'HSP-70 Baseline', desc: 'Minimum thermal hormetic dose' },
  { minutes: 20, label: '20 Mins', badge: '⭐ Optimal Finnish', desc: 'Cardiovascular exercise mimetic' },
  { minutes: 25, label: '25 Mins', badge: 'Deep Conditioning', desc: 'Maximum growth hormone release' },
  { minutes: 30, label: '30 Mins', badge: 'Infrared Target', desc: 'Full-spectrum radiant thermal session' }
]

export default function SaunaSessionApplet({
  isOpen,
  onClose,
  modalityName = 'Traditional Finnish Dry Sauna',
  taskId,
  onComplete
}: SaunaSessionAppletProps) {
  // Navigation Flow: PRE_CHECK -> SESSION -> POST_CHECK
  const [step, setStep] = useState<'PRE_CHECK' | 'SESSION' | 'POST_CHECK'>('PRE_CHECK')

  // Sauna Configuration
  const [saunaType, setSaunaType] = useState<SaunaType>('TRADITIONAL')
  const [targetMinutes, setTargetMinutes] = useState<number>(20)
  const totalSeconds = targetMinutes * 60
  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalSeconds)
  const [isActive, setIsActive] = useState<boolean>(false)
  const [preHydrated, setPreHydrated] = useState<boolean>(true) // 16oz electrolytes check
  const [roundNumber, setRoundNumber] = useState<number>(1)
  const [isMultiRound, setIsMultiRound] = useState<boolean>(false)

  // Audio Engine
  const [audioTrack, setAudioTrack] = useState<AudioTrack>('ZEN_FLUTE')
  const [chimesEnabled, setChimesEnabled] = useState<boolean>(true) // Optional pleasant milestone chimes
  const [musicVolume, setMusicVolume] = useState<number>(0.5)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [showAudioSettings, setShowAudioSettings] = useState<boolean>(false)

  // Post-Session Observables & Metrics
  const [peakHeartRate, setPeakHeartRate] = useState<number>(130)
  const [sweatVolume, setSweatVolume] = useState<'light' | 'moderate' | 'profuse'>('moderate')
  const [thermalRelaxation, setThermalRelaxation] = useState<number>(9) // 1-10
  const [vascularRelief, setVascularRelief] = useState<number>(9) // 1-10
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Milestone triggers tracking (single strike, never repeating alarm)
  const sweatOnsetChimeRef = useRef<boolean>(false)
  const hsp70ChimeRef = useRef<boolean>(false)
  const finishChimeRef = useRef<boolean>(false)

  // Refs for Audio & Timers
  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const chimeGainRef = useRef<GainNode | null>(null)
  const droneGainRef = useRef<GainNode | null>(null)
  const droneNodesRef = useRef<{ stop: () => void }[]>([])
  const musicAudioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Selected Sauna Type Details
  const currentSaunaConfig = useMemo(
    () => SAUNA_TYPES.find(s => s.type === saunaType) || SAUNA_TYPES[0],
    [saunaType]
  )

  // Sync timer when targetMinutes or saunaType changes in setup
  useEffect(() => {
    if (step === 'PRE_CHECK' && !isActive) {
      setSecondsRemaining(targetMinutes * 60)
    }
  }, [targetMinutes, step, isActive])

  // --- WEB AUDIO ENGINE ---
  const unlockAudioContext = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioCtx) return null
        const ctx = new AudioCtx()
        audioCtxRef.current = ctx

        // Master Gain Node
        const masterGain = ctx.createGain()
        masterGain.gain.setValueAtTime(isMuted ? 0 : 1, ctx.currentTime)
        masterGain.connect(ctx.destination)
        masterGainRef.current = masterGain

        // Dedicated Chime Gain
        const cGain = ctx.createGain()
        cGain.gain.setValueAtTime(0.6, ctx.currentTime)
        cGain.connect(masterGain)
        chimeGainRef.current = cGain

        // Dedicated Drone Gain
        const dGain = ctx.createGain()
        dGain.gain.setValueAtTime(musicVolume * 0.4, ctx.currentTime)
        dGain.connect(masterGain)
        droneGainRef.current = dGain
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume()
      }

      return audioCtxRef.current
    } catch (err) {
      console.warn('AudioContext init error:', err)
      return null
    }
  }

  // Soft Singing Bowl Chime (Single strike with exponential decay)
  const playPleasantChime = (baseFreq = 432, duration = 3.8) => {
    if (!chimesEnabled || isMuted) return
    const ctx = unlockAudioContext()
    if (!ctx || !chimeGainRef.current) return

    try {
      const now = ctx.currentTime
      const strikeGain = ctx.createGain()
      strikeGain.gain.setValueAtTime(0.0001, now)
      strikeGain.gain.linearRampToValueAtTime(0.35, now + 0.05)
      strikeGain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
      strikeGain.connect(chimeGainRef.current)

      // Harmonics for a soothing Tibetan singing bowl
      const harmonicFreqs = [baseFreq, baseFreq * 2, baseFreq * 2.76, baseFreq * 4.05]
      const harmonicWeights = [0.65, 0.22, 0.09, 0.04]

      harmonicFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const nodeGain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now)
        nodeGain.gain.setValueAtTime(harmonicWeights[idx], now)

        osc.connect(nodeGain)
        nodeGain.connect(strikeGain)

        osc.start(now)
        osc.stop(now + duration)
      })
    } catch (_) {}
  }

  // Synthesize Warm Tibetan Om Drone (108 Hz + 216 Hz with slow breath modulation)
  const stopSyntheticDrone = () => {
    droneNodesRef.current.forEach(node => {
      try {
        node.stop()
      } catch (_) {}
    })
    droneNodesRef.current = []
  }

  const startSyntheticDrone = () => {
    stopSyntheticDrone()
    if (isMuted) return
    const ctx = unlockAudioContext()
    if (!ctx || !droneGainRef.current) return

    try {
      const now = ctx.currentTime
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const filter = ctx.createBiquadFilter()

      osc1.type = 'triangle'
      osc1.frequency.setValueAtTime(108, now) // 108 Hz Grounding Root
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(216, now) // 216 Hz Warm Harmonic

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(260, now)

      // Slow thermal breath LFO (~16s cycle)
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.type = 'sine'
      lfo.frequency.setValueAtTime(0.06, now)
      lfoGain.gain.setValueAtTime(75, now)
      lfo.connect(filter.frequency)
      lfo.start(now)

      osc1.connect(filter)
      osc2.connect(filter)
      filter.connect(droneGainRef.current)

      osc1.start(now)
      osc2.start(now)

      droneNodesRef.current.push({
        stop: () => {
          try {
            osc1.stop()
            osc2.stop()
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
    if (isMuted) return

    try {
      const audio = new Audio(src)
      audio.loop = true
      audio.volume = isMuted ? 0 : musicVolume
      audio.play().catch(err => {
        console.debug('Autoplay restricted or user gesture needed:', err)
      })
      musicAudioRef.current = audio
    } catch (err) {
      console.warn('Error starting music track:', err)
    }
  }

  // Soundtrack switcher
  useEffect(() => {
    if (step === 'SESSION' && isActive) {
      if (audioTrack === 'ZEN_FLUTE') {
        startRecordedMusic('/audio/bamboo-flute-zen.mp3')
      } else if (audioTrack === 'HANDPAN') {
        startRecordedMusic('/audio/handpan-meditation.mp3')
      } else if (audioTrack === 'WARM_DRONE') {
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
  }, [step, isActive, audioTrack])

  // Sync volume updates
  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = isMuted ? 0 : musicVolume
    }
    if (droneGainRef.current && audioCtxRef.current) {
      droneGainRef.current.gain.setValueAtTime(
        isMuted ? 0 : musicVolume * 0.4,
        audioCtxRef.current.currentTime
      )
    }
  }, [musicVolume, isMuted])

  // Timer Tick Engine
  useEffect(() => {
    if (isActive && step === 'SESSION') {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          const elapsed = totalSeconds - prev + 1

          // 1. Sweat Onset Milestone (~7 Mins / 420s)
          if (elapsed === 420 && !sweatOnsetChimeRef.current) {
            sweatOnsetChimeRef.current = true
            playPleasantChime(432, 3.5)
          }

          // 2. Heat Shock Protein 70 Gate (~14 Mins / 840s)
          if (elapsed === 840 && !hsp70ChimeRef.current && totalSeconds >= 900) {
            hsp70ChimeRef.current = true
            playPleasantChime(528, 4.0)
          }

          // 3. Final Completion
          if (prev <= 1) {
            if (!finishChimeRef.current) {
              finishChimeRef.current = true
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
  }, [isActive, step, totalSeconds, chimesEnabled, isMuted])

  // Progress Calculations
  const elapsedSeconds = totalSeconds - secondsRemaining
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100))

  // Thermal Stage & Cardiovascular Physiological Phase
  const currentStage = useMemo(() => {
    if (elapsedSeconds < 420) {
      return {
        stageNum: 1,
        title: 'Stage 1: Peripheral Vasodilation & Nitric Oxide',
        badge: '🪵 Thermal Adaptation',
        sub: 'Cutaneous blood vessels dilate, shunting blood to the skin. eNOS triggers nitric oxide production, reducing total vascular resistance.',
        color: 'text-amber-400',
        borderColor: 'border-amber-500/40',
        bg: 'bg-amber-500/10'
      }
    } else if (elapsedSeconds < 840) {
      return {
        stageNum: 2,
        title: 'Stage 2: Cardiovascular Exercise Mimetic',
        badge: '❤️ 120–140 BPM Heart Rate',
        sub: 'Cardiac output increases by 60–70% (up to 9–10 L/min). Heart rate climbs to moderate aerobic levels, improving stroke volume and arterial compliance.',
        color: 'text-orange-400',
        borderColor: 'border-orange-500/40',
        bg: 'bg-orange-500/10'
      }
    } else {
      return {
        stageNum: 3,
        title: 'Stage 3: Heat Shock Protein (HSP-70) Gate',
        badge: '🔥 Cytoprotective Autophagy',
        sub: 'Core temperature inflection threshold reached (~101.3°F / 38.5°C). HSP-70 chaperones repair damaged proteins and inhibit systemic inflammation.',
        color: 'text-red-400',
        borderColor: 'border-red-500/40',
        bg: 'bg-red-500/10'
      }
    }
  }, [elapsedSeconds])

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
          outcomeId: 'cardiovascular_stress_relief',
          phase: 'post',
          value: vascularRelief,
          checkinDate: dateStr,
          taskId: taskId || 'sauna_session'
        },
        {
          localUserId,
          outcomeId: 'thermal_relaxation',
          phase: 'post',
          value: thermalRelaxation,
          checkinDate: dateStr,
          taskId: taskId || 'sauna_session'
        }
      ])

      // Persist Task Execution Details
      if (taskId) {
        await updateTaskExecutionDetails(taskId, {
          duration: Math.round(elapsedSeconds / 60) || targetMinutes,
          completed_seconds: elapsedSeconds,
          target_minutes: targetMinutes,
          sauna_type: saunaType,
          temperature_display: currentSaunaConfig.tempDisplay,
          peak_heart_rate_bpm: peakHeartRate,
          sweat_volume: sweatVolume,
          vascular_relief_score: vascularRelief,
          thermal_relaxation_score: thermalRelaxation,
          hsp70_threshold_reached: elapsedSeconds >= 840,
          pre_hydrated: preHydrated,
          notes: `Completed ${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s ${currentSaunaConfig.label} session at ${currentSaunaConfig.tempDisplay}. Peak HR: ${peakHeartRate} BPM. Sweat: ${sweatVolume}.`
        })
      }

      if (onComplete) onComplete()
      onClose()
    } catch (err) {
      console.error('Error saving sauna session:', err)
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
    <div className="fixed inset-0 z-[100] bg-[#0c0502] text-white flex flex-col items-center justify-between font-sans overflow-hidden select-none animate-in fade-in duration-300 keep-white">
      {/* Ambient Ember & Radiant Heat Glow Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-amber-600/10 blur-[140px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-red-600/15 blur-[100px] animate-pulse" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-orange-600/10 blur-[130px]" />
      </div>

      {/* HEADER */}
      <header className="w-full max-w-4xl px-6 py-5 flex items-center justify-between z-20 border-b border-amber-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.3)]">
            <Flame size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wider uppercase text-amber-100">{modalityName}</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                {currentSaunaConfig.tempDisplay}
              </span>
            </div>
            <p className="text-[11px] text-amber-400/70 font-medium">
              KIHD Cohort (JAMA 2015) • HSP-70 Chaperone Induction • Growth Hormone Surge
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Audio Quick Settings */}
          <button
            type="button"
            onClick={() => setShowAudioSettings(prev => !prev)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              showAudioSettings
                ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
            title="Music & Chimes"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span className="hidden sm:inline">
              {audioTrack === 'OFF' ? 'Silent' : audioTrack === 'ZEN_FLUTE' ? 'Zen Flute' : audioTrack === 'HANDPAN' ? 'Handpan' : 'Warm Om'}
            </span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={() => {
              if (isActive) {
                if (confirm('Exit sauna session early?')) {
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
        <div className="w-full max-w-xl mx-4 my-2 p-4 bg-[#140804]/95 backdrop-blur-xl border border-amber-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
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

          {/* Soundtrack Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-amber-200">Meditative Music</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAudioTrack('ZEN_FLUTE')
                  setIsMuted(false)
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  audioTrack === 'ZEN_FLUTE' && !isMuted
                    ? 'bg-amber-500/25 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold">🎋 Zen Flute</div>
                <div className="text-[10px] text-amber-300/70">Japanese Bamboo</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAudioTrack('HANDPAN')
                  setIsMuted(false)
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  audioTrack === 'HANDPAN' && !isMuted
                    ? 'bg-amber-500/25 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold">🥁 Handpan</div>
                <div className="text-[10px] text-amber-300/70">Harmonic Steel</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAudioTrack('WARM_DRONE')
                  setIsMuted(false)
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  audioTrack === 'WARM_DRONE' && !isMuted
                    ? 'bg-amber-500/25 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold">🔥 Warm Om</div>
                <div className="text-[10px] text-amber-300/70">108Hz Drone</div>
              </button>

              <button
                type="button"
                onClick={() => setAudioTrack('OFF')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  audioTrack === 'OFF'
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
          <div className="pt-2 border-t border-amber-900/40 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-amber-100 flex items-center gap-1.5">
                {chimesEnabled ? <Bell size={13} className="text-amber-400" /> : <BellOff size={13} className="text-slate-400" />}
                Pleasant Milestone Chimes
              </div>
              <div className="text-[10px] text-slate-400">
                Single gentle singing bowl bell at 7m sweat onset, 14m HSP-70 gate &amp; completion (never loops or alarms).
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
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50'
                  : 'bg-white/5 text-slate-400 border border-white/10'
              }`}
            >
              {chimesEnabled ? 'Enabled ✓' : 'Muted'}
            </button>
          </div>

          {/* Volume Slider */}
          <div className="pt-1 flex items-center gap-3">
            <Volume2 size={14} className="text-amber-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : musicVolume}
              onChange={e => {
                setIsMuted(false)
                setMusicVolume(parseFloat(e.target.value))
              }}
              className="flex-1 accent-amber-400 h-1.5 bg-amber-950 rounded-lg cursor-pointer"
            />
            <span className="text-[11px] font-mono text-amber-300 w-8 text-right">
              {isMuted ? '0%' : `${Math.round(musicVolume * 100)}%`}
            </span>
          </div>
        </div>
      )}

      {/* ================= STEP 1: PRE-SAUNA SETUP ================= */}
      {step === 'PRE_CHECK' && (
        <main className="w-full max-w-xl flex-1 px-6 py-4 flex flex-col justify-center items-center gap-5 z-10 overflow-y-auto">
          {/* Sauna Type Selector */}
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-amber-300">
              <span className="flex items-center gap-1.5">
                <Thermometer size={14} /> Sauna Modality Type
              </span>
              <span className="text-[10px] text-amber-400/80 font-normal">Select heat source</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {SAUNA_TYPES.map(opt => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => {
                    setSaunaType(opt.type)
                    setTargetMinutes(opt.defaultMinutes)
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    saunaType === opt.type
                      ? 'bg-amber-500/25 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-[1.02]'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="text-xs font-black">{opt.label}</div>
                  <div className="text-[10px] font-bold text-amber-300 mt-0.5">{opt.tempDisplay}</div>
                  <div className="text-[9px] text-slate-400 mt-1 line-clamp-1">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Target Duration Selector */}
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-amber-300">
              <span className="flex items-center gap-1.5">
                <Activity size={14} /> Heat Exposure Duration
              </span>
              <span className="text-[10px] text-amber-400/80 font-normal">HSP-70 Gate: ≥15 mins</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DURATION_PRESETS.map(preset => (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => setTargetMinutes(preset.minutes)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    targetMinutes === preset.minutes
                      ? 'bg-amber-500/25 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-[1.02]'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="text-lg font-black">{preset.label}</div>
                  <div className="text-[10px] font-bold text-amber-300">{preset.badge}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Hydration & Electrolyte Safety Checkbox */}
          <div className="w-full p-3.5 bg-amber-950/30 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                <Droplets size={16} />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-amber-200">Pre-Session Hydration (16oz + Electrolytes)</div>
                <div className="text-[10px] text-slate-400">Protects renal function and sustains blood volume under thermal strain.</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPreHydrated(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                preHydrated
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50'
                  : 'bg-white/5 text-slate-400 border border-white/10'
              }`}
            >
              {preHydrated ? 'Hydrated ✓' : 'Confirm'}
            </button>
          </div>

          {/* Enter Sauna Button */}
          <button
            type="button"
            onClick={() => {
              unlockAudioContext()
              setIsActive(true)
              setStep('SESSION')
              sweatOnsetChimeRef.current = false
              hsp70ChimeRef.current = false
              finishChimeRef.current = false
            }}
            className="w-full py-4.5 bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-[0_0_35px_rgba(245,158,11,0.45)] flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98"
          >
            <Play size={20} className="fill-white" />
            <span>Enter Sauna ({targetMinutes}m)</span>
          </button>
        </main>
      )}

      {/* ================= STEP 2: IMMERSIVE FULL-SCREEN SAUNA ================= */}
      {step === 'SESSION' && (
        <main className="w-full max-w-xl flex-1 px-6 py-6 flex flex-col justify-between items-center z-10">
          {/* Stage Badge & Educational Insight */}
          <div
            className={`w-full p-4 rounded-2xl border ${currentStage.borderColor} ${currentStage.bg} backdrop-blur-md text-center space-y-1 transition-all duration-500 animate-in fade-in`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className={`text-xs font-black uppercase tracking-wider ${currentStage.color}`}>
                {currentStage.title}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white">
                {currentStage.badge}
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium max-w-md mx-auto">
              {currentStage.sub}
            </p>
          </div>

          {/* Central Timer & Radiant Ember Ring */}
          <div className="relative my-auto flex flex-col items-center justify-center">
            {/* Circular Progress Ring */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-amber-950/60"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-amber-400 transition-all duration-1000 ease-linear shadow-[0_0_20px_rgba(245,158,11,0.6)]"
                  strokeWidth="5"
                  strokeDasharray={276.46}
                  strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Central Time Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-6xl sm:text-7xl font-black tracking-tight text-white font-mono drop-shadow-[0_0_25px_rgba(245,158,11,0.4)]">
                  {formatTimer(secondsRemaining)}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 mt-1">
                  {progressPercent}% Elapsed
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  {currentSaunaConfig.label} • {currentSaunaConfig.tempDisplay}
                </span>
              </div>
            </div>

            {/* Heat Shock Protein (HSP-70) Gate Indicator */}
            <div className="mt-4 flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  elapsedSeconds >= 840
                    ? 'bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                    : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span className="text-xs font-semibold text-slate-300">
                {elapsedSeconds >= 840
                  ? 'HSP-70 Cytoprotective Gate Cleared ✓'
                  : `HSP-70 Gate: ${Math.max(0, Math.floor((840 - elapsedSeconds) / 60))}m remaining`}
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
                className="flex-1 py-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 rounded-2xl text-amber-100 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
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
                <span>Exit &amp; Log Sauna</span>
              </button>
            </div>

            {/* Quick Audio Status & Mute */}
            <div className="flex items-center justify-between px-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Music size={12} className="text-amber-400" />
                <span>Music: {audioTrack === 'OFF' ? 'Muted' : audioTrack === 'ZEN_FLUTE' ? 'Zen Bamboo Flute' : audioTrack === 'HANDPAN' ? 'Handpan' : 'Warm Om Drone'}</span>
              </span>

              <button
                type="button"
                onClick={() => setIsMuted(prev => !prev)}
                className="text-amber-300 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
              >
                {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                <span>{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ================= STEP 3: POST-SAUNA BIO-DELTA LOGGING ================= */}
      {step === 'POST_CHECK' && (
        <main className="w-full max-w-xl flex-1 px-6 py-4 flex flex-col justify-center items-center gap-4.5 z-10 overflow-y-auto">
          {/* Celebration Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 mb-1 shadow-[0_0_25px_rgba(245,158,11,0.4)]">
              <Sparkles size={24} />
            </div>
            <h2 className="text-xl font-black text-white">Sauna Conditioning Completed</h2>
            <p className="text-xs text-amber-400 font-medium">
              Logged {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s {currentSaunaConfig.label} session
            </p>
          </div>

          {/* Contrast Therapy Tip Card */}
          <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 to-blue-950/30 border border-amber-500/30 text-left space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-200 flex items-center gap-1.5">
                <Thermometer size={14} className="text-cyan-400" />
                Contrast Therapy Protocol
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                Synergy
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              If pairing with a cold plunge, allow 2–3 minutes of ambient cooldown before stepping into the cold. Rehydrate with 20oz of water and sodium/potassium/magnesium electrolytes.
            </p>
          </div>

          {/* Bio-Delta Logging */}
          <div className="w-full space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10 text-left">
            {/* Peak Heart Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <HeartPulse size={14} className="text-red-400" /> Estimated Peak Heart Rate
                </span>
                <span className="text-amber-300 font-mono">{peakHeartRate} BPM</span>
              </div>
              <input
                type="range"
                min="80"
                max="170"
                step="5"
                value={peakHeartRate}
                onChange={e => setPeakHeartRate(parseInt(e.target.value))}
                className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>80 BPM (Resting)</span>
                <span>120–140 BPM (Aerobic Equivalent)</span>
                <span>160+ BPM</span>
              </div>
            </div>

            {/* Sweat Volume Selector */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Sweat Volume</span>
                <span className="text-[10px] text-amber-300 font-normal">Fluid loss indicator</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'light', label: 'Light', desc: 'Mild glistening' },
                  { key: 'moderate', label: 'Moderate', desc: 'Steady bead flow' },
                  { key: 'profuse', label: 'Profuse', desc: 'Heavy dripping (~1L)' }
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSweatVolume(item.key as any)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      sweatVolume === item.key
                        ? 'bg-amber-500/25 border-amber-400 text-white font-bold'
                        : 'bg-black/30 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs">{item.label}</div>
                    <div className="text-[9px] text-slate-400">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Deep Vascular Relaxation Rating */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                <span>Vascular Relaxation &amp; Stress Relief</span>
                <span className="text-amber-300 font-mono">{vascularRelief}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={vascularRelief}
                onChange={e => setVascularRelief(parseInt(e.target.value))}
                className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Tense / Strained</span>
                <span>Deep Vascular Decompression</span>
              </div>
            </div>
          </div>

          {/* Finish & Save Button */}
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAndComplete}
            className="w-full py-4.5 bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {isSaving ? (
              <span>Saving Session...</span>
            ) : (
              <>
                <Check size={18} />
                <span>Save Sauna &amp; Complete Step</span>
              </>
            )}
          </button>
        </main>
      )}

      {/* FOOTER */}
      <footer className="w-full max-w-4xl px-6 py-4 flex items-center justify-between text-amber-400/60 text-[11px] z-20 border-t border-amber-950/40">
        <span>Kuopio Ischemic Heart Disease Study (JAMA Intern Med)</span>
        <span>Goal: 4–7 Sessions Weekly (40–50% CVD Reduction)</span>
      </footer>
    </div>
  )
}
