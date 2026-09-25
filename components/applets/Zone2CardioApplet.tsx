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
  Activity,
  HeartPulse,
  Flame,
  MessageSquare,
  Music,
  Bell,
  BellOff,
  Sliders,
  ChevronRight,
  TrendingDown,
  Info
} from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { saveBatchOutcomeObservations, updateTaskExecutionDetails } from '@/lib/data'
import { format } from 'date-fns'

interface Zone2CardioAppletProps {
  isOpen: boolean
  onClose: () => void
  modalityName?: string
  taskId?: string
  onComplete?: () => void
}

type AudioTrack = 'AEROBIC_PACER' | 'ZEN_FLUTE' | 'HANDPAN' | 'OFF'
type EquipmentType = 'treadmill_incline' | 'cycling' | 'rowing' | 'outdoor_jog' | 'stair_climb' | 'rucking'

interface DurationPreset {
  minutes: number
  label: string
  badge: string
  desc: string
}

const DURATION_PRESETS: DurationPreset[] = [
  { minutes: 30, label: '30 Mins', badge: 'Quick Base', desc: 'Minimum effective aerobic stimulus' },
  { minutes: 45, label: '45 Mins', badge: '⭐ Gold Standard', desc: 'Optimal San-Millán mitochondrial biogenesis' },
  { minutes: 60, label: '60 Mins', badge: 'Deep Endurance', desc: 'High FAT/CD36 fatty acid oxidation volume' },
  { minutes: 90, label: '90 Mins', badge: 'Long Weekend Base', desc: 'Glycogen depletion & mitochondrial cristae build' }
]

export default function Zone2CardioApplet({
  isOpen,
  onClose,
  modalityName = 'Zone 2 Steady-State Aerobic Base',
  taskId,
  onComplete
}: Zone2CardioAppletProps) {
  // Navigation Flow: PRE_CHECK -> SESSION -> POST_CHECK
  const [step, setStep] = useState<'PRE_CHECK' | 'SESSION' | 'POST_CHECK'>('PRE_CHECK')

  // Protocol Duration & Parameters
  const [targetMinutes, setTargetMinutes] = useState<number>(45)
  const totalSeconds = targetMinutes * 60
  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalSeconds)
  const [isActive, setIsActive] = useState<boolean>(false)

  // Equipment & Target Heart Rate
  const [equipment, setEquipment] = useState<EquipmentType>('cycling')
  const [userAge, setUserAge] = useState<number>(35)

  // Audio Engine State
  const [audioTrack, setAudioTrack] = useState<AudioTrack>('OFF') // Default off for podcasts/music
  const [chimesEnabled, setChimesEnabled] = useState<boolean>(true) // Optional pleasant check-in chimes
  const [audioVolume, setAudioVolume] = useState<number>(0.5)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [showAudioSettings, setShowAudioSettings] = useState<boolean>(false)

  // Interactive Talk-Test State
  const [talkTestStatus, setTalkTestStatus] = useState<'optimal' | 'too_hard' | 'too_easy'>('optimal')
  const [showTalkTestPrompt, setShowTalkTestPrompt] = useState<boolean>(false)
  const [talkTestHistory, setTalkTestHistory] = useState<string[]>([])

  // Post-Session Observables
  const [avgHeartRate, setAvgHeartRate] = useState<number>(138)
  const [aerobicEaseScore, setAerobicEaseScore] = useState<number>(9) // 1-10
  const [mentalClarity, setMentalClarity] = useState<number>(9) // 1-10
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Refs
  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const chimeGainRef = useRef<GainNode | null>(null)
  const pacerGainRef = useRef<GainNode | null>(null)
  const pacerTimerRef = useRef<NodeJS.Timeout | null>(null)
  const musicAudioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const lastTalkTestMinuteRef = useRef<number>(0)

  // Calculated Heart Rate Targets (Maffetone Formula: 180 - age, bracket: (180 - age - 10) to (180 - age))
  const maffetoneCeiling = 180 - userAge
  const maffetoneFloor = maffetoneCeiling - 10

  // 65–75% Max HR range (Tanaka: 208 - 0.7 * age)
  const hrMax = Math.round(208 - 0.7 * userAge)
  const zone2Low = Math.round(hrMax * 0.65)
  const zone2High = Math.round(hrMax * 0.75)

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

        const masterGain = ctx.createGain()
        masterGain.gain.setValueAtTime(isMuted ? 0 : 1, ctx.currentTime)
        masterGain.connect(ctx.destination)
        masterGainRef.current = masterGain

        const cGain = ctx.createGain()
        cGain.gain.setValueAtTime(0.6, ctx.currentTime)
        cGain.connect(masterGain)
        chimeGainRef.current = cGain

        const pGain = ctx.createGain()
        pGain.gain.setValueAtTime(audioVolume * 0.3, ctx.currentTime)
        pGain.connect(masterGain)
        pacerGainRef.current = pGain
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

  // Soft Singing Bowl Chime (Single gentle strike for talk-test reminders)
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

  // Steady Aerobic Cadence Pacer (110 BPM gentle rhythm)
  const playPacerBeat = () => {
    if (audioTrack !== 'AEROBIC_PACER' || isMuted) return
    const ctx = unlockAudioContext()
    if (!ctx || !pacerGainRef.current) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(320, now)
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.05)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(audioVolume * 0.35, now + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09)

      osc.connect(gain)
      gain.connect(pacerGainRef.current)

      osc.start(now)
      osc.stop(now + 0.1)
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
    if (isMuted) return

    try {
      const audio = new Audio(src)
      audio.loop = true
      audio.volume = isMuted ? 0 : audioVolume
      audio.play().catch(err => {
        console.debug('Autoplay restricted:', err)
      })
      musicAudioRef.current = audio
    } catch (_) {}
  }

  useEffect(() => {
    if (step === 'SESSION' && isActive) {
      if (audioTrack === 'ZEN_FLUTE') {
        startRecordedMusic('/audio/bamboo-flute-zen.mp3')
      } else if (audioTrack === 'HANDPAN') {
        startRecordedMusic('/audio/handpan-meditation.mp3')
      } else {
        stopRecordedMusic()
      }
    } else {
      stopRecordedMusic()
    }

    return () => stopRecordedMusic()
  }, [step, isActive, audioTrack])

  // Aerobic Pacer Beat Timer (110 BPM = 545ms)
  useEffect(() => {
    if (isActive && step === 'SESSION' && audioTrack === 'AEROBIC_PACER' && !isMuted) {
      pacerTimerRef.current = setInterval(() => {
        playPacerBeat()
      }, 545)
    }

    return () => {
      if (pacerTimerRef.current) clearInterval(pacerTimerRef.current)
    }
  }, [isActive, step, audioTrack, isMuted, audioVolume])

  // Timer Countdown Engine & Periodic Talk-Test Prompts
  useEffect(() => {
    if (isActive && step === 'SESSION') {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          const elapsedMins = Math.floor((totalSeconds - prev + 1) / 60)

          // Trigger Talk-Test Prompt every 12 minutes (at 12m, 24m, 36m)
          if (elapsedMins > 0 && elapsedMins % 12 === 0 && elapsedMins !== lastTalkTestMinuteRef.current) {
            lastTalkTestMinuteRef.current = elapsedMins
            setShowTalkTestPrompt(true)
            playPleasantChime(528, 3.0)
          }

          if (prev <= 1) {
            playPleasantChime(528, 4.5) // Gentle finish bell
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
          outcomeId: 'cardiovascular_resilience',
          phase: 'post',
          value: mentalClarity,
          checkinDate: dateStr,
          taskId: taskId || 'zone2_cardio_session'
        },
        {
          localUserId,
          outcomeId: 'physical_energy',
          phase: 'post',
          value: aerobicEaseScore,
          checkinDate: dateStr,
          taskId: taskId || 'zone2_cardio_session'
        }
      ])

      // Persist Task Execution Details
      if (taskId) {
        await updateTaskExecutionDetails(taskId, {
          duration: Math.round(elapsedSeconds / 60) || targetMinutes,
          completed_seconds: elapsedSeconds,
          target_minutes: targetMinutes,
          equipment_used: equipment,
          avg_heart_rate_bpm: avgHeartRate,
          maffetone_bracket: `${maffetoneFloor}–${maffetoneCeiling} BPM`,
          zone2_hr_bracket: `${zone2Low}–${zone2High} BPM`,
          talk_test_status: talkTestStatus,
          talk_test_checks_completed: talkTestHistory.length,
          aerobic_ease_score: aerobicEaseScore,
          mental_clarity_score: mentalClarity,
          notes: `Completed ${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s Zone 2 Aerobic Base on ${equipment}. Avg HR: ${avgHeartRate} BPM (Maffetone: ${maffetoneFloor}–${maffetoneCeiling} BPM). Talk-test: ${talkTestStatus}.`
        })
      }

      if (onComplete) onComplete()
      onClose()
    } catch (err) {
      console.error('Error saving Zone 2 cardio session:', err)
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
    <div className="fixed inset-0 z-[100] bg-[#030a14] text-white flex flex-col items-center justify-between font-sans overflow-hidden select-none animate-in fade-in duration-300 keep-white">
      {/* Ambient Cobalt & Cyan Radial Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-cyan-600/10 blur-[140px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-blue-600/15 blur-[100px] animate-pulse" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-teal-600/10 blur-[130px]" />
      </div>

      {/* HEADER */}
      <header className="w-full max-w-4xl px-6 py-5 flex items-center justify-between z-20 border-b border-cyan-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(56,189,248,0.3)]">
            <Activity size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wider uppercase text-cyan-100">{modalityName}</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                {zone2Low}–{zone2High} BPM (65–75%)
              </span>
            </div>
            <p className="text-[11px] text-cyan-400/70 font-medium">
              San-Millán Protocol • Type I Slow-Twitch Cristae • Pure Fat Oxidation (FAT/CD36)
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
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
            title="Audio & Pacer Controls"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span className="hidden sm:inline">
              {audioTrack === 'OFF' ? 'Silent / Podcast' : audioTrack === 'AEROBIC_PACER' ? 'Cadence Pacer' : 'Music'}
            </span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={() => {
              if (isActive) {
                if (confirm('End Zone 2 session early?')) {
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
        <div className="w-full max-w-xl mx-4 my-2 p-4 bg-[#051426]/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] z-30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Music size={14} /> Aerobic Audio &amp; Talk-Test Alerts
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
            <label className="text-[11px] font-semibold text-cyan-200">Soundtrack</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAudioTrack('AEROBIC_PACER')
                  setIsMuted(false)
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  audioTrack === 'AEROBIC_PACER' && !isMuted
                    ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold">⏱️ Aerobic Pacer</div>
                <div className="text-[10px] text-cyan-300/70">110 BPM Metronome</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAudioTrack('ZEN_FLUTE')
                  setIsMuted(false)
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  audioTrack === 'ZEN_FLUTE' && !isMuted
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
                  setAudioTrack('HANDPAN')
                  setIsMuted(false)
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  audioTrack === 'HANDPAN' && !isMuted
                    ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold">🥁 Handpan</div>
                <div className="text-[10px] text-cyan-300/70">Harmonic Steel</div>
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
                <div className="text-xs font-bold">🔇 Podcast / Calls</div>
                <div className="text-[10px] text-slate-400">Silent Timer</div>
              </button>
            </div>
          </div>

          {/* Talk-Test Chimes */}
          <div className="pt-2 border-t border-cyan-900/40 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-cyan-100 flex items-center gap-1.5">
                {chimesEnabled ? <Bell size={13} className="text-cyan-400" /> : <BellOff size={13} className="text-slate-400" />}
                Periodic Talk-Test Chimes
              </div>
              <div className="text-[10px] text-slate-400">
                Single gentle singing bowl chime every 12 mins prompting conversational pace check.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setChimesEnabled(prev => !prev)
                if (!chimesEnabled) {
                  playPleasantChime(528, 2.5)
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
        </div>
      )}

      {/* ================= STEP 1: PRE-CARDIO CONFIGURATION ================= */}
      {step === 'PRE_CHECK' && (
        <main className="w-full max-w-xl flex-1 px-6 py-4 flex flex-col justify-center items-center gap-5 z-10 overflow-y-auto">
          {/* Target Duration Selector */}
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-cyan-300">
              <span className="flex items-center gap-1.5">
                <Activity size={14} /> Session Target Duration
              </span>
              <span className="text-[10px] text-cyan-400/80 font-normal">Attia target: 180–240 mins/wk</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DURATION_PRESETS.map(preset => (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => setTargetMinutes(preset.minutes)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    targetMinutes === preset.minutes
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

          {/* Equipment / Modality Selector */}
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-cyan-300">
              <span className="flex items-center gap-1.5">
                <Activity size={14} /> Aerobic Modality
              </span>
              <span className="text-[10px] text-cyan-400/80 font-normal">Smooth steady-state cadence</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'cycling', label: '🚴 Stationary Bike', desc: 'Lowest joint impact' },
                { key: 'treadmill_incline', label: '👟 Incline Walk', desc: '12% incline @ 3.0 mph' },
                { key: 'outdoor_jog', label: '🏃 Outdoor Jog', desc: 'Strict conversational base' },
                { key: 'rowing', label: '🚣 Rowing Erg', desc: 'Full-body oxidative load' },
                { key: 'stair_climb', label: '🪜 Stair Climber', desc: 'Glute & calf capillary bed' },
                { key: 'rucking', label: '🎒 Weighted Ruck', desc: '20–30lb pack walk' }
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setEquipment(item.key as any)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    equipment === item.key
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="text-xs font-bold">{item.label}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Heart Rate & Maffetone Calculator Card */}
          <div className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <HeartPulse size={14} /> Zone 2 Heart Rate Targets
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Age:</span>
                <input
                  type="number"
                  min="18"
                  max="95"
                  value={userAge}
                  onChange={e => setUserAge(parseInt(e.target.value) || 35)}
                  className="w-12 px-2 py-0.5 bg-black/50 border border-white/20 rounded text-center text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  🎯 65–75% HRmax Bracket
                </div>
                <div className="text-lg font-black text-white font-mono mt-0.5">
                  {zone2Low}–{zone2High} BPM
                </div>
                <div className="text-[9px] text-slate-400">Tanaka formula calibration</div>
              </div>

              <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                  🛡️ Maffetone Ceiling (180 - age)
                </div>
                <div className="text-lg font-black text-white font-mono mt-0.5">
                  {maffetoneFloor}–{maffetoneCeiling} BPM
                </div>
                <div className="text-[9px] text-slate-400">Ceiling prevents Zone 3 creep</div>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <button
            type="button"
            onClick={() => {
              unlockAudioContext()
              setIsActive(true)
              setStep('SESSION')
              lastTalkTestMinuteRef.current = 0
            }}
            className="w-full py-4.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-[0_0_35px_rgba(56,189,248,0.45)] flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98"
          >
            <Play size={20} className="fill-white" />
            <span>Start Zone 2 Base ({targetMinutes}m)</span>
          </button>
        </main>
      )}

      {/* ================= STEP 2: IMMERSIVE FULL-SCREEN SESSION ================= */}
      {step === 'SESSION' && (
        <main className="w-full max-w-xl flex-1 px-6 py-6 flex flex-col justify-between items-center z-10">
          {/* Interactive Talk-Test Banner */}
          {showTalkTestPrompt ? (
            <div className="w-full p-4 rounded-2xl border border-cyan-400 bg-cyan-950/60 backdrop-blur-xl text-center space-y-2 animate-in zoom-in-95 duration-200 shadow-[0_0_30px_rgba(56,189,248,0.3)]">
              <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-200">
                <MessageSquare size={14} className="text-cyan-300 animate-bounce" />
                Conversational Talk-Test Check-In
              </div>
              <p className="text-xs text-slate-200 font-medium">
                Can you speak a full sentence comfortably without gasping, but cannot easily sing?
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setTalkTestStatus('optimal')
                    setTalkTestHistory(prev => [...prev, 'optimal'])
                    setShowTalkTestPrompt(false)
                  }}
                  className="p-2 bg-emerald-500/25 border border-emerald-400 rounded-xl text-xs font-bold text-white hover:bg-emerald-500/40 cursor-pointer"
                >
                  Yes, Perfect ✓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTalkTestStatus('too_hard')
                    setTalkTestHistory(prev => [...prev, 'too_hard'])
                    setShowTalkTestPrompt(false)
                  }}
                  className="p-2 bg-red-500/25 border border-red-400 rounded-xl text-xs font-bold text-white hover:bg-red-500/40 cursor-pointer"
                >
                  Gasping (Zone 3) ⚠️
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTalkTestStatus('too_easy')
                    setTalkTestHistory(prev => [...prev, 'too_easy'])
                    setShowTalkTestPrompt(false)
                  }}
                  className="p-2 bg-blue-500/25 border border-blue-400 rounded-xl text-xs font-bold text-white hover:bg-blue-500/40 cursor-pointer"
                >
                  Too Easy (Zone 1)
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full p-3.5 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 backdrop-blur-md text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                  Steady Aerobic Base • Type I Cristae Biogenesis
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200">
                  Lactate ≤ 2.0 mmol/L
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Maintain nasal breathing or conversational pace. If heart rate creeps above {maffetoneCeiling} BPM, ease output by 5%.
              </p>
            </div>
          )}

          {/* Central Timer & Circular Halo */}
          <div className="relative my-auto flex flex-col items-center justify-center">
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
                  {progressPercent}% Complete • {Math.floor(elapsedSeconds / 60)}m Elapsed
                </span>
                <span className="text-[11px] font-mono text-slate-300 mt-0.5">
                  Target: {zone2Low}–{zone2High} BPM (Ceiling: {maffetoneCeiling} BPM)
                </span>
              </div>
            </div>

            {/* Quick Talk-Test Prompt Button */}
            <button
              type="button"
              onClick={() => setShowTalkTestPrompt(true)}
              className="mt-4 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <MessageSquare size={13} className="text-cyan-400" />
              <span>Perform Talk-Test Check-In</span>
            </button>
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
                <span>Finish &amp; Log Base</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ================= STEP 3: POST-SESSION BIO-DELTA LOGGING ================= */}
      {step === 'POST_CHECK' && (
        <main className="w-full max-w-xl flex-1 px-6 py-4 flex flex-col justify-center items-center gap-4.5 z-10 overflow-y-auto">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 mb-1 shadow-[0_0_25px_rgba(56,189,248,0.4)]">
              <Sparkles size={24} />
            </div>
            <h2 className="text-xl font-black text-white">Zone 2 Aerobic Base Completed</h2>
            <p className="text-xs text-cyan-400 font-medium">
              Logged {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s of pure mitochondrial fat oxidation
            </p>
          </div>

          {/* Mitochondrial Education Card */}
          <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-blue-950/40 border border-cyan-500/30 text-left space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-200 flex items-center gap-1.5">
                <Flame size={14} className="text-amber-400" />
                Mitochondrial PGC-1α Biogenesis
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                Type I Myocytes
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              By maintaining blood lactate below 2.0 mmol/L, you forced your muscle fibers to rely on mitochondrial beta-oxidation of fatty acids, expanding internal cristae volume and upregulating cellular clearance capacity.
            </p>
          </div>

          {/* Vitals & Observables Logging */}
          <div className="w-full space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10 text-left">
            {/* Average Heart Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <HeartPulse size={14} className="text-red-400" /> Average Heart Rate (BPM)
                </span>
                <span className="text-cyan-300 font-mono">{avgHeartRate} BPM</span>
              </div>
              <input
                type="range"
                min="100"
                max="170"
                value={avgHeartRate}
                onChange={e => setAvgHeartRate(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>100 BPM</span>
                <span>Target: {zone2Low}–{zone2High} BPM</span>
                <span>170 BPM</span>
              </div>
            </div>

            {/* Aerobic Ease & Zone 2 Adherence */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                <span>Conversational Adherence (No Zone 3 Creep)</span>
                <span className="text-cyan-300 font-mono">{aerobicEaseScore}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={aerobicEaseScore}
                onChange={e => setAerobicEaseScore(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Crept into Zone 3</span>
                <span>Strict Pure Zone 2</span>
              </div>
            </div>

            {/* Post-Cardio Mental Clarity */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                <span>Post-Workout Mental Clarity &amp; Vigor</span>
                <span className="text-cyan-300 font-mono">{mentalClarity}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={mentalClarity}
                onChange={e => setMentalClarity(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Brain Fog</span>
                <span>Sharp Oxidative Energy</span>
              </div>
            </div>
          </div>

          {/* Finish & Save Button */}
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
                <span>Save Zone 2 &amp; Complete Step</span>
              </>
            )}
          </button>
        </main>
      )}

      {/* FOOTER */}
      <footer className="w-full max-w-4xl px-6 py-4 flex items-center justify-between text-cyan-400/60 text-[11px] z-20 border-t border-cyan-950/40">
        <span>San-Millán &amp; Brooks (Sports Med 2018) • Peter Attia Protocol</span>
        <span>Goal: 180–240 Mins Weekly Volume</span>
      </footer>
    </div>
  )
}
