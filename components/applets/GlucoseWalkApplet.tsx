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
  Footprints,
  TrendingDown,
  Activity,
  Utensils,
  Music,
  Bell,
  BellOff,
  Sliders,
  ChevronRight,
  Flame,
  HeartPulse,
  Clock
} from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { saveBatchOutcomeObservations, updateTaskExecutionDetails } from '@/lib/data'
import { format } from 'date-fns'

interface GlucoseWalkAppletProps {
  isOpen: boolean
  onClose: () => void
  modalityName?: string
  taskId?: string
  onComplete?: () => void
}

type AudioSoundtrack = 'ZEN_FLUTE' | 'HANDPAN' | 'METRONOME_ONLY' | 'SILENT'
type MealType = 'lunch' | 'dinner' | 'breakfast' | 'high_carb_feast' | 'snack'

interface DurationPreset {
  minutes: number
  label: string
  badge: string
  bluntEstimate: string
  desc: string
}

const DURATION_PRESETS: DurationPreset[] = [
  { minutes: 10, label: '10 Mins', badge: '⚡ Quick Digest', bluntEstimate: '~22% Spike Reduction', desc: 'Minimum effective dose for acute glucose clearance' },
  { minutes: 15, label: '15 Mins', badge: '⭐ Gold Standard', bluntEstimate: '~34% Spike Reduction', desc: 'Stanford & Diabetologia 2016 optimal protocol' },
  { minutes: 20, label: '20 Mins', badge: '🔥 Deep Clearance', bluntEstimate: '~42% Spike Reduction', desc: 'Ideal after high glycemic or heavy carb meals' }
]

const CADENCE_PRESETS = [
  { bpm: 100, label: '100 BPM', name: 'Casual Stroll', desc: 'Gentle post-meal stroll' },
  { bpm: 108, label: '108 BPM', name: '⭐ Optimal Brisk', desc: 'Ideal GLUT4 muscle contraction' },
  { bpm: 115, label: '115 BPM', name: 'Power Stride', desc: 'Elevated aerobic glucose disposal' }
]

export default function GlucoseWalkApplet({
  isOpen,
  onClose,
  modalityName = 'Post-Meal Glucose Disposal Walk',
  taskId,
  onComplete
}: GlucoseWalkAppletProps) {
  // Navigation Flow
  const [step, setStep] = useState<'PRE_CHECK' | 'SESSION' | 'POST_CHECK'>('PRE_CHECK')

  // Protocol Duration & Parameters
  const [targetMinutes, setTargetMinutes] = useState<number>(15)
  const totalSeconds = targetMinutes * 60
  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalSeconds)
  const [isActive, setIsActive] = useState<boolean>(false)

  // Meal & Cadence Details
  const [mealType, setMealType] = useState<MealType>('dinner')
  const [minsSinceMeal, setMinsSinceMeal] = useState<number>(15) // 0-60 mins
  const [cadenceBpm, setCadenceBpm] = useState<number>(108) // 108 BPM default
  const [metronomeAudioEnabled, setMetronomeAudioEnabled] = useState<boolean>(false)

  // Audio Engine State
  const [soundtrack, setSoundtrack] = useState<AudioSoundtrack>('ZEN_FLUTE')
  const [chimesEnabled, setChimesEnabled] = useState<boolean>(true) // Optional pleasant milestone chimes
  const [musicVolume, setMusicVolume] = useState<number>(0.5)
  const [metronomeVolume, setMetronomeVolume] = useState<number>(0.35)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [showAudioSettings, setShowAudioSettings] = useState<boolean>(false)

  // Post-Session Observables
  const [satietyComfort, setSatietyComfort] = useState<number>(9) // 1-10
  const [avoidedCrash, setAvoidedCrash] = useState<number>(9) // 1-10
  const [cgmReading, setCgmReading] = useState<string>('')
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Visual Cadence Beat Pulse
  const [beatPulse, setBeatPulse] = useState<boolean>(false)

  // Milestone triggers tracking (single strike, never repeating alarm)
  const stage5mFiredRef = useRef<boolean>(false)
  const stage10mFiredRef = useRef<boolean>(false)
  const finishChimeFiredRef = useRef<boolean>(false)

  // Audio Context & Nodes Refs
  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const chimeGainRef = useRef<GainNode | null>(null)
  const metronomeGainRef = useRef<GainNode | null>(null)
  const musicAudioRef = useRef<HTMLAudioElement | null>(null)
  const metronomeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Sync timer when targetMinutes changes in setup
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

        // Dedicated Metronome Gain
        const mGain = ctx.createGain()
        mGain.gain.setValueAtTime(metronomeVolume, ctx.currentTime)
        mGain.connect(masterGain)
        metronomeGainRef.current = mGain
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

  // Soft Singing Bowl Chime (Single resonant strike, never looping or loud alarm)
  const playPleasantChime = (baseFreq = 480, duration = 3.5) => {
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

      // Harmonics for a calming Tibetan singing bowl
      const harmonicFreqs = [baseFreq, baseFreq * 2.02, baseFreq * 2.76, baseFreq * 4.04]
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

  // Soft Wooden Metronome Click
  const playMetronomeTick = () => {
    if (!metronomeAudioEnabled || isMuted) return
    const ctx = unlockAudioContext()
    if (!ctx || !metronomeGainRef.current) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, now) // 880 Hz crisp woodblock tone
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.03)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(metronomeVolume * 0.4, now + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04)

      osc.connect(gain)
      gain.connect(metronomeGainRef.current)

      osc.start(now)
      osc.stop(now + 0.05)
    } catch (_) {}
  }

  // Background Music Controller (Zen Flute & Handpan)
  const stopRecordedMusic = () => {
    if (musicAudioRef.current) {
      musicAudioRef.current.pause()
      musicAudioRef.current.currentTime = 0
    }
  }

  const startRecordedMusic = (src: string) => {
    stopRecordedMusic()
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
      if (soundtrack === 'ZEN_FLUTE') {
        startRecordedMusic('/audio/bamboo-flute-zen.mp3')
      } else if (soundtrack === 'HANDPAN') {
        startRecordedMusic('/audio/handpan-meditation.mp3')
      } else {
        stopRecordedMusic()
      }
    } else {
      stopRecordedMusic()
    }

    return () => stopRecordedMusic()
  }, [step, isActive, soundtrack])

  // Sync volume updates
  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = isMuted ? 0 : musicVolume
    }
    if (metronomeGainRef.current && audioCtxRef.current) {
      metronomeGainRef.current.gain.setValueAtTime(
        isMuted ? 0 : metronomeVolume,
        audioCtxRef.current.currentTime
      )
    }
  }, [musicVolume, metronomeVolume, isMuted])

  // Cadence Pacer & Metronome Loop (BPM-synchronized)
  useEffect(() => {
    if (isActive && step === 'SESSION') {
      const beatIntervalMs = (60 / cadenceBpm) * 1000
      metronomeTimerRef.current = setInterval(() => {
        setBeatPulse(prev => !prev)
        playMetronomeTick()
      }, beatIntervalMs)
    }

    return () => {
      if (metronomeTimerRef.current) clearInterval(metronomeTimerRef.current)
    }
  }, [isActive, step, cadenceBpm, metronomeAudioEnabled, isMuted, metronomeVolume])

  // Timer Countdown Engine
  useEffect(() => {
    if (isActive && step === 'SESSION') {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          const elapsed = totalSeconds - prev + 1

          // 1. Stage 1 Milestone (5 Mins: Gastric Emptying → GLUT4 Uptake transition)
          if (elapsed === 300 && !stage5mFiredRef.current) {
            stage5mFiredRef.current = true
            playPleasantChime(528, 3.5) // Reassuring harmonic
          }

          // 2. Stage 2 Milestone (10 Mins: Peak GLUT4 Clearance)
          if (elapsed === 600 && !stage10mFiredRef.current) {
            stage10mFiredRef.current = true
            playPleasantChime(432, 3.5)
          }

          // 3. Final Completion
          if (prev <= 1) {
            if (!finishChimeFiredRef.current) {
              finishChimeFiredRef.current = true
              playPleasantChime(528, 4.2) // Single graceful bell
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
  const estimatedSteps = Math.round((elapsedSeconds * cadenceBpm) / 60)
  const estimatedSpikeBluntPct = Math.min(
    38,
    Math.round((elapsedSeconds / 900) * 34) // 15 mins = ~34%
  )

  // Current Metabolic Stage
  const currentStage = useMemo(() => {
    if (elapsedSeconds < 300) {
      return {
        stageNum: 1,
        title: 'Stage 1: Gastric Transit & Splanchnic Flow',
        badge: '🚶 Initial Ambulation',
        sub: 'Gentle continuous movement initiates peristalsis and recruits the soleus muscle pump without diverting gut blood flow.',
        color: 'text-amber-400',
        borderColor: 'border-amber-500/40',
        bg: 'bg-amber-500/10'
      }
    } else if (elapsedSeconds < 600) {
      return {
        stageNum: 2,
        title: 'Stage 2: Insulin-Independent GLUT4 Translocation',
        badge: '⚡ Peak Muscle Disposal',
        sub: 'Muscle contraction activates AMPK, translocating GLUT4 glucose transporters directly into cell membranes without requiring pancreatic insulin spikes.',
        color: 'text-emerald-400',
        borderColor: 'border-emerald-500/40',
        bg: 'bg-emerald-500/10'
      }
    } else {
      return {
        stageNum: 3,
        title: 'Stage 3: Postprandial Glycemic Stabilization',
        badge: '🛡️ Spike Blunting Complete',
        sub: 'Excursion peak blunted. Sustained glycemic equilibrium preserves endothelial function and prevents reactive hypoglycemia fatigue.',
        color: 'text-teal-300',
        borderColor: 'border-teal-500/40',
        bg: 'bg-teal-500/10'
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
          outcomeId: 'post_meal_digestion_comfort',
          phase: 'post',
          value: satietyComfort,
          checkinDate: dateStr,
          taskId: taskId || 'post_meal_walk_session'
        },
        {
          localUserId,
          outcomeId: 'avoided_glucose_crash',
          phase: 'post',
          value: avoidedCrash,
          checkinDate: dateStr,
          taskId: taskId || 'post_meal_walk_session'
        }
      ])

      // Persist Task Execution Details
      if (taskId) {
        await updateTaskExecutionDetails(taskId, {
          duration: Math.round(elapsedSeconds / 60) || targetMinutes,
          completed_seconds: elapsedSeconds,
          target_minutes: targetMinutes,
          meal_type: mealType,
          minutes_since_meal: minsSinceMeal,
          target_cadence_bpm: cadenceBpm,
          estimated_steps: estimatedSteps,
          estimated_spike_reduction_pct: estimatedSpikeBluntPct,
          satiety_comfort_score: satietyComfort,
          avoided_crash_score: avoidedCrash,
          cgm_glucose_mg_dl: cgmReading ? parseFloat(cgmReading) : null,
          notes: `Completed ${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s Post-Meal Glucose Walk after ${mealType} (~${estimatedSteps} steps at ${cadenceBpm} BPM). Estimated ~${estimatedSpikeBluntPct}% glucose spike blunting.`
        })
      }

      if (onComplete) onComplete()
      onClose()
    } catch (err) {
      console.error('Error saving glucose walk session:', err)
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
    <div className="fixed inset-0 z-[100] bg-[#05110B] text-white flex flex-col items-center justify-between font-sans overflow-hidden select-none animate-in fade-in duration-300 keep-white">
      {/* Ambient Emerald & Warm Amber Glow Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-emerald-600/10 blur-[140px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-amber-500/15 blur-[110px] animate-pulse" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-teal-600/10 blur-[130px]" />
      </div>

      {/* HEADER */}
      <header className="w-full max-w-4xl px-6 py-5 flex items-center justify-between z-20 border-b border-emerald-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
            <Footprints size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wider uppercase text-emerald-100">{modalityName}</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {cadenceBpm} BPM Pacer
              </span>
            </div>
            <p className="text-[11px] text-emerald-400/70 font-medium">
              GLUT4 Translocation • Diabetologia Protocol • ~30–35% Postprandial Blunting
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Audio & Metronome Controls Toggle */}
          <button
            type="button"
            onClick={() => setShowAudioSettings(prev => !prev)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              showAudioSettings
                ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
            title="Music, Metronome & Chimes"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span className="hidden sm:inline">
              {soundtrack === 'SILENT' ? 'Silent' : soundtrack === 'ZEN_FLUTE' ? 'Zen Flute' : soundtrack === 'HANDPAN' ? 'Handpan' : 'Metronome'}
            </span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={() => {
              if (isActive) {
                if (confirm('End glucose walk session early?')) {
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

      {/* FLOATING AUDIO & METRONOME CONTROLS OVERLAY */}
      {showAudioSettings && (
        <div className="w-full max-w-xl mx-4 my-2 p-4 bg-[#071910]/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <Sliders size={14} /> Walk Soundtrack &amp; Metronome Audio
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
            <label className="text-[11px] font-semibold text-emerald-200">Soundtrack</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSoundtrack('ZEN_FLUTE')
                  setIsMuted(false)
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  soundtrack === 'ZEN_FLUTE' && !isMuted
                    ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold">🎋 Zen Flute</div>
                <div className="text-[10px] text-emerald-300/70">Japanese Bamboo</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSoundtrack('HANDPAN')
                  setIsMuted(false)
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  soundtrack === 'HANDPAN' && !isMuted
                    ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold">🥁 Handpan</div>
                <div className="text-[10px] text-emerald-300/70">Harmonic Steel</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSoundtrack('METRONOME_ONLY')
                  setMetronomeAudioEnabled(true)
                  setIsMuted(false)
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  soundtrack === 'METRONOME_ONLY' && !isMuted
                    ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold">⏱️ Metronome</div>
                <div className="text-[10px] text-emerald-300/70">Step Pacer Only</div>
              </button>

              <button
                type="button"
                onClick={() => setSoundtrack('SILENT')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  soundtrack === 'SILENT'
                    ? 'bg-slate-700/40 border-slate-500 text-white'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold">🔇 Podcast / Call</div>
                <div className="text-[10px] text-slate-400">Silent Timer</div>
              </button>
            </div>
          </div>

          {/* Audible Metronome Click Toggle */}
          <div className="pt-2 border-t border-emerald-900/40 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-100 flex items-center gap-1.5">
                <Clock size={13} className="text-emerald-400" />
                Audible Step Metronome ({cadenceBpm} BPM)
              </div>
              <div className="text-[10px] text-slate-400">
                Gentle woodblock click on each stride to maintain 100–115 BPM rhythm.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                unlockAudioContext()
                setMetronomeAudioEnabled(prev => !prev)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                metronomeAudioEnabled
                  ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50'
                  : 'bg-white/5 text-slate-400 border border-white/10'
              }`}
            >
              {metronomeAudioEnabled ? 'Metronome ON' : 'Muted'}
            </button>
          </div>

          {/* Pleasant Stage Chimes (OPTIONAL & NON-PERSISTENT per user request) */}
          <div className="pt-2 border-t border-emerald-900/40 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-100 flex items-center gap-1.5">
                {chimesEnabled ? <Bell size={13} className="text-emerald-400" /> : <BellOff size={13} className="text-slate-400" />}
                Pleasant Stage Chimes
              </div>
              <div className="text-[10px] text-slate-400">
                Single gentle singing bowl bell at 5m &amp; 10m metabolic stages (never loops or alarms).
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
                  ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50'
                  : 'bg-white/5 text-slate-400 border border-white/10'
              }`}
            >
              {chimesEnabled ? 'Enabled ✓' : 'Muted'}
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 1: PRE-WALK CONFIGURATION ================= */}
      {step === 'PRE_CHECK' && (
        <main className="w-full max-w-xl flex-1 px-6 py-4 flex flex-col justify-center items-center gap-5 z-10 overflow-y-auto">
          {/* Target Duration Selector */}
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-emerald-300">
              <span className="flex items-center gap-1.5">
                <Activity size={14} /> Walk Duration
              </span>
              <span className="text-[10px] text-emerald-400/80 font-normal">Optimal: 15 Mins</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {DURATION_PRESETS.map(preset => (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => setTargetMinutes(preset.minutes)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    targetMinutes === preset.minutes
                      ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.25)] scale-[1.02]'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="text-lg font-black">{preset.label}</div>
                  <div className="text-[10px] font-bold text-emerald-300">{preset.badge}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Meal Details & Timing */}
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-emerald-300">
              <span className="flex items-center gap-1.5">
                <Utensils size={14} /> Meal Context
              </span>
              <span className="text-[10px] text-emerald-400/80 font-normal">Start within 30m of eating</span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[
                { key: 'breakfast', label: 'Breakfast' },
                { key: 'lunch', label: 'Lunch' },
                { key: 'dinner', label: 'Dinner' },
                { key: 'high_carb_feast', label: 'Carb Feast' },
                { key: 'snack', label: 'Snack' }
              ].map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMealType(m.key as MealType)}
                  className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer text-xs ${
                    mealType === m.key
                      ? 'bg-emerald-600/30 border-emerald-400 text-white font-bold'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Cadence / BPM Selector */}
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-emerald-300">
              <span className="flex items-center gap-1.5">
                <Footprints size={14} /> Walking Cadence Pacer
              </span>
              <span className="text-[10px] text-emerald-400/80 font-normal">Zone 1 Aerobic Pace</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {CADENCE_PRESETS.map(cadence => (
                <button
                  key={cadence.bpm}
                  type="button"
                  onClick={() => setCadenceBpm(cadence.bpm)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    cadenceBpm === cadence.bpm
                      ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="text-sm font-black text-emerald-200">{cadence.label}</div>
                  <div className="text-[10px] font-bold text-slate-200">{cadence.name}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{cadence.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Biological Mechanism Card */}
          <div className="w-full p-3.5 bg-gradient-to-r from-emerald-950/30 to-amber-950/20 border border-emerald-500/20 rounded-2xl text-left space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <TrendingDown size={14} /> The GLUT4 Translocation Mechanism
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              When soleus and quadriceps muscles rhythmically contract, intramuscular AMPK is activated. This mobilizes GLUT-4 receptors to cell surfaces, soaking up bloodstream glucose <em>without triggering insulin secretion</em>.
            </p>
          </div>

          {/* Start Walk Button */}
          <button
            type="button"
            onClick={() => {
              unlockAudioContext()
              setIsActive(true)
              setStep('SESSION')
              stage5mFiredRef.current = false
              stage10mFiredRef.current = false
              finishChimeFiredRef.current = false
            }}
            className="w-full py-4.5 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-[0_0_35px_rgba(16,185,129,0.45)] flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98"
          >
            <Play size={20} className="fill-white" />
            <span>Start Glucose Disposal Walk ({targetMinutes}m)</span>
          </button>
        </main>
      )}

      {/* ================= STEP 2: IMMERSIVE FULL-SCREEN SESSION ================= */}
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

          {/* Central Metronome Pulse & Timer */}
          <div className="relative my-auto flex flex-col items-center justify-center">
            {/* Visual Cadence Pulse Ring */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
              {/* Pulsing ambient halo matching cadence */}
              <div
                className={`absolute inset-4 rounded-full transition-all duration-300 pointer-events-none ${
                  beatPulse
                    ? 'bg-emerald-500/15 scale-105 shadow-[0_0_50px_rgba(16,185,129,0.4)]'
                    : 'bg-transparent scale-95'
                }`}
              />

              {/* Progress Ring */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-emerald-950/60"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-emerald-400 transition-all duration-1000 ease-linear shadow-[0_0_20px_rgba(16,185,129,0.6)]"
                  strokeWidth="5"
                  strokeDasharray={276.46}
                  strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Central Time Display & Step Tracker */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-6xl sm:text-7xl font-black tracking-tight text-white font-mono drop-shadow-[0_0_25px_rgba(16,185,129,0.4)]">
                  {formatTimer(secondsRemaining)}
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300 mt-1">
                  <Footprints size={14} />
                  <span>~{estimatedSteps.toLocaleString()} Steps Taken</span>
                </div>
                <span className="text-[11px] text-amber-300/80 mt-0.5 font-semibold">
                  ~{estimatedSpikeBluntPct}% Estimated Spike Blunted
                </span>
              </div>
            </div>

            {/* Rhythm Pacer Dot */}
            <div className="mt-4 flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full transition-transform duration-150 ${
                  beatPulse ? 'scale-125 bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.9)]' : 'scale-90 bg-emerald-700/60'
                }`}
              />
              <span className="text-xs font-semibold text-slate-300">
                Pacing: {cadenceBpm} Steps/Min Rhythm
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
                className="flex-1 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 rounded-2xl text-emerald-100 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
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
                <span>Finish &amp; Log Walk</span>
              </button>
            </div>

            {/* Quick Soundtrack / Metronome Status */}
            <div className="flex items-center justify-between px-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Music size={12} className="text-emerald-400" />
                <span>
                  Audio: {soundtrack === 'SILENT' ? 'Podcast / Silent' : soundtrack === 'ZEN_FLUTE' ? 'Zen Bamboo Flute' : soundtrack === 'HANDPAN' ? 'Handpan' : 'Metronome Only'}
                </span>
              </span>

              <button
                type="button"
                onClick={() => setIsMuted(prev => !prev)}
                className="text-emerald-300 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
              >
                {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                <span>{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ================= STEP 3: POST-WALK GLYCEMIC OUTCOMES ================= */}
      {step === 'POST_CHECK' && (
        <main className="w-full max-w-xl flex-1 px-6 py-4 flex flex-col justify-center items-center gap-4.5 z-10 overflow-y-auto">
          {/* Celebration Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 mb-1 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
              <Sparkles size={24} />
            </div>
            <h2 className="text-xl font-black text-white">Glucose Disposal Walk Completed</h2>
            <p className="text-xs text-emerald-400 font-medium">
              Logged {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s • ~{estimatedSteps.toLocaleString()} Steps • ~{estimatedSpikeBluntPct}% Glycemic Spike Blunted
            </p>
          </div>

          {/* Post-Prandial Summary Stats */}
          <div className="w-full grid grid-cols-3 gap-2.5">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center">
              <div className="text-lg font-black text-emerald-200">
                {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
              </div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Duration</div>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center">
              <div className="text-lg font-black text-teal-200">~{estimatedSteps.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Steps</div>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center">
              <div className="text-lg font-black text-amber-300">~{estimatedSpikeBluntPct}%</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Spike Blunted</div>
            </div>
          </div>

          {/* Quick Bio-Delta Logging */}
          <div className="w-full space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10 text-left">
            {/* Satiety & Gastric Lightness Rating */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                <span>Post-Meal Lightness &amp; Digestion</span>
                <span className="text-emerald-300 font-mono">{satietyComfort}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={satietyComfort}
                onChange={e => setSatietyComfort(parseInt(e.target.value))}
                className="w-full accent-emerald-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Heavy / Bloated</span>
                <span>Light &amp; Energized</span>
              </div>
            </div>

            {/* Avoided Crash / Energy Stability */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                <span>Energy Stability (Avoided Food Coma)</span>
                <span className="text-emerald-300 font-mono">{avoidedCrash}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={avoidedCrash}
                onChange={e => setAvoidedCrash(parseInt(e.target.value))}
                className="w-full accent-emerald-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Drowsy Crash</span>
                <span>Sustained Sharpness</span>
              </div>
            </div>

            {/* Optional CGM Reading Input */}
            <div className="pt-2 border-t border-white/5 space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Optional: CGM Blood Glucose Reading</span>
                <span className="text-[10px] text-slate-500 font-normal">mg/dL</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 108"
                value={cgmReading}
                onChange={e => setCgmReading(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Finish & Save Button */}
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAndComplete}
            className="w-full py-4.5 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {isSaving ? (
              <span>Saving Session...</span>
            ) : (
              <>
                <Check size={18} />
                <span>Save Walk &amp; Complete Step</span>
              </>
            )}
          </button>
        </main>
      )}

      {/* FOOTER */}
      <footer className="w-full max-w-4xl px-6 py-4 flex items-center justify-between text-emerald-400/60 text-[11px] z-20 border-t border-emerald-950/40">
        <span>Diabetologia (Reynolds et al., 2016) • PMID 27747394</span>
        <span>Insulin-Independent GLUT4 Disposal</span>
      </footer>
    </div>
  )
}
