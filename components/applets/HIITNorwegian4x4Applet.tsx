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
  HeartPulse,
  Activity,
  Zap,
  Music,
  Bell,
  BellOff,
  Sliders,
  ChevronRight,
  TrendingUp,
  FastForward
} from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { saveBatchOutcomeObservations, updateTaskExecutionDetails } from '@/lib/data'
import { format } from 'date-fns'

interface HIITNorwegian4x4AppletProps {
  isOpen: boolean
  onClose: () => void
  modalityName?: string
  taskId?: string
  onComplete?: () => void
}

type AudioTrack = 'WORKOUT_PULSE' | 'ZEN_FLUTE' | 'HANDPAN' | 'OFF'
type EquipmentType = 'treadmill' | 'airbike' | 'rower' | 'stairmaster' | 'outdoor_running'

interface IntervalBlock {
  type: 'WORK' | 'RECOVERY'
  round: number
  durationSeconds: number
  targetHrPct: string
  rpeTarget: string
  instructions: string
}

const INTERVAL_SEQUENCE: IntervalBlock[] = [
  { type: 'WORK', round: 1, durationSeconds: 240, targetHrPct: '90–95% HRmax', rpeTarget: 'RPE 8.5–9.5', instructions: 'High intensity drive. Heavy breathing, unable to speak full sentences. Peak stroke volume stimulation.' },
  { type: 'RECOVERY', round: 1, durationSeconds: 180, targetHrPct: '60–70% HRmax', rpeTarget: 'RPE 4–5', instructions: 'Active recovery. Keep moving at light aerobic pace to circulate blood and clear lactate via the Cori cycle.' },
  { type: 'WORK', round: 2, durationSeconds: 240, targetHrPct: '90–95% HRmax', rpeTarget: 'RPE 8.5–9.5', instructions: 'Sustain target output. Left ventricular cardiac muscle stretches eccentrically to maximum end-diastolic volume.' },
  { type: 'RECOVERY', round: 2, durationSeconds: 180, targetHrPct: '60–70% HRmax', rpeTarget: 'RPE 4–5', instructions: 'Breathe deeply through the nose if possible. Maintain light cadence, prepare for Round 3.' },
  { type: 'WORK', round: 3, durationSeconds: 240, targetHrPct: '90–95% HRmax', rpeTarget: 'RPE 8.5–9.5', instructions: 'Mental grit interval. Push past acute fatigue. Maximal oxygen uptake (VO2 max) threshold sustained.' },
  { type: 'RECOVERY', round: 3, durationSeconds: 180, targetHrPct: '60–70% HRmax', rpeTarget: 'RPE 4–5', instructions: 'Active flush. Sip water, keep legs moving to prevent blood pooling in lower extremities.' },
  { type: 'WORK', round: 4, durationSeconds: 240, targetHrPct: '90–95% HRmax', rpeTarget: 'RPE 9.0–10', instructions: 'Final work bout! Empty the tank. This final 4 minutes locks in the cardiorespiratory fitness adaptations.' },
  { type: 'RECOVERY', round: 4, durationSeconds: 180, targetHrPct: '60–70% HRmax', rpeTarget: 'RPE 3–4', instructions: 'Cool-down flush. Transition to relaxed movement. Prepare for post-exercise 1-minute HR recovery test.' }
]

export default function HIITNorwegian4x4Applet({
  isOpen,
  onClose,
  modalityName = 'VO2 Max 4x4 Aerobic HIIT Intervals',
  taskId,
  onComplete
}: HIITNorwegian4x4AppletProps) {
  // Navigation Flow: PRE_CHECK -> SESSION -> POST_CHECK
  const [step, setStep] = useState<'PRE_CHECK' | 'SESSION' | 'POST_CHECK'>('PRE_CHECK')

  // Equipment & Cardiac Parameters
  const [equipment, setEquipment] = useState<EquipmentType>('treadmill')
  const [userAge, setUserAge] = useState<number>(35)

  // Interval State Engine
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number>(0)
  const currentBlock = INTERVAL_SEQUENCE[currentBlockIndex] || INTERVAL_SEQUENCE[0]
  const [blockSecondsRemaining, setBlockSecondsRemaining] = useState<number>(currentBlock.durationSeconds)
  const [isActive, setIsActive] = useState<boolean>(false)
  const [totalWorkoutElapsedSeconds, setTotalWorkoutElapsedSeconds] = useState<number>(0)

  // Audio Engine
  const [audioTrack, setAudioTrack] = useState<AudioTrack>('OFF') // Default off for users listening to gym music/headphones
  const [chimesEnabled, setChimesEnabled] = useState<boolean>(true) // Coaching cues
  const [audioVolume, setAudioVolume] = useState<number>(0.5)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [showAudioSettings, setShowAudioSettings] = useState<boolean>(false)

  // Post-Workout Observables & HR Recovery Test
  const [peakHeartRate, setPeakHeartRate] = useState<number>(172)
  const [hrRecovery60s, setHrRecovery60s] = useState<number>(142)
  const [rpeScore, setRpeScore] = useState<number>(9) // 1-10
  const [vigorScore, setVigorScore] = useState<number>(9) // 1-10
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const chimeGainRef = useRef<GainNode | null>(null)
  const pulseGainRef = useRef<GainNode | null>(null)
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const musicAudioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Calculated Heart Rate Targets (Tanaka Formula: HRmax = 208 - 0.7 * age)
  const hrMax = Math.round(208 - 0.7 * userAge)
  const targetWorkLow = Math.round(hrMax * 0.9)
  const targetWorkHigh = Math.round(hrMax * 0.95)
  const targetRecLow = Math.round(hrMax * 0.6)
  const targetRecHigh = Math.round(hrMax * 0.7)

  // Web Audio Context
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
        cGain.gain.setValueAtTime(0.7, ctx.currentTime)
        cGain.connect(masterGain)
        chimeGainRef.current = cGain

        const pGain = ctx.createGain()
        pGain.gain.setValueAtTime(audioVolume * 0.35, ctx.currentTime)
        pGain.connect(masterGain)
        pulseGainRef.current = pGain
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

  // Coaching Transition Chimes
  const playWorkIntervalStartChime = () => {
    if (!chimesEnabled || isMuted) return
    const ctx = unlockAudioContext()
    if (!ctx || !chimeGainRef.current) return

    try {
      const now = ctx.currentTime
      // Ascending tri-tone (528Hz -> 660Hz -> 880Hz) to signal high-intensity work
      ;[528, 660, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const startTime = now + idx * 0.15

        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, startTime)

        gain.gain.setValueAtTime(0.001, startTime)
        gain.gain.linearRampToValueAtTime(0.35, startTime + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6)

        osc.connect(gain)
        gain.connect(chimeGainRef.current!)

        osc.start(startTime)
        osc.stop(startTime + 0.65)
      })
    } catch (_) {}
  }

  const playRecoveryIntervalStartChime = () => {
    if (!chimesEnabled || isMuted) return
    const ctx = unlockAudioContext()
    if (!ctx || !chimeGainRef.current) return

    try {
      const now = ctx.currentTime
      // Descending soothing bi-tone (880Hz -> 432Hz) to signal active recovery
      ;[880, 432].forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const startTime = now + idx * 0.2

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, startTime)

        gain.gain.setValueAtTime(0.001, startTime)
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2)

        osc.connect(gain)
        gain.connect(chimeGainRef.current!)

        osc.start(startTime)
        osc.stop(startTime + 1.3)
      })
    } catch (_) {}
  }

  // Driving 130 BPM Workout Pulse (Web Audio Synthesized)
  const playPulseBeat = () => {
    if (audioTrack !== 'WORKOUT_PULSE' || isMuted) return
    const ctx = unlockAudioContext()
    if (!ctx || !pulseGainRef.current) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(140, now)
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.06)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(audioVolume * 0.4, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)

      osc.connect(gain)
      gain.connect(pulseGainRef.current)

      osc.start(now)
      osc.stop(now + 0.13)
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

  // Workout Pulse BPM Loop (130 BPM = 461ms per beat)
  useEffect(() => {
    if (isActive && step === 'SESSION' && audioTrack === 'WORKOUT_PULSE' && !isMuted) {
      pulseTimerRef.current = setInterval(() => {
        playPulseBeat()
      }, 461)
    }

    return () => {
      if (pulseTimerRef.current) clearInterval(pulseTimerRef.current)
    }
  }, [isActive, step, audioTrack, isMuted, audioVolume])

  // Interval Advance Helper
  const advanceToNextInterval = () => {
    if (currentBlockIndex < INTERVAL_SEQUENCE.length - 1) {
      const nextIndex = currentBlockIndex + 1
      const nextBlock = INTERVAL_SEQUENCE[nextIndex]
      setCurrentBlockIndex(nextIndex)
      setBlockSecondsRemaining(nextBlock.durationSeconds)

      if (nextBlock.type === 'WORK') {
        playWorkIntervalStartChime()
      } else {
        playRecoveryIntervalStartChime()
      }
    } else {
      // Completed all 4 rounds!
      setIsActive(false)
      setStep('POST_CHECK')
    }
  }

  // Main Interval Countdown Engine
  useEffect(() => {
    if (isActive && step === 'SESSION') {
      timerRef.current = setInterval(() => {
        setTotalWorkoutElapsedSeconds(prev => prev + 1)
        setBlockSecondsRemaining(prev => {
          if (prev <= 1) {
            advanceToNextInterval()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, step, currentBlockIndex])

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
          value: vigorScore,
          checkinDate: dateStr,
          taskId: taskId || 'hiit_4x4_session'
        },
        {
          localUserId,
          outcomeId: 'physical_energy',
          phase: 'post',
          value: vigorScore,
          checkinDate: dateStr,
          taskId: taskId || 'hiit_4x4_session'
        }
      ])

      const hrrDrop = Math.max(0, peakHeartRate - hrRecovery60s)
      const roundsCompleted = Math.min(4, Math.floor((currentBlockIndex + 1) / 2) || 1)

      // Persist Task Execution Details
      if (taskId) {
        await updateTaskExecutionDetails(taskId, {
          duration: Math.round(totalWorkoutElapsedSeconds / 60) || 28,
          completed_seconds: totalWorkoutElapsedSeconds,
          rounds_completed: roundsCompleted,
          equipment_used: equipment,
          peak_heart_rate_bpm: peakHeartRate,
          hr_recovery_60s_bpm: hrRecovery60s,
          hr_recovery_drop: hrrDrop,
          rpe_score: rpeScore,
          vigor_score: vigorScore,
          target_work_bracket: `${targetWorkLow}–${targetWorkHigh} BPM`,
          target_recovery_bracket: `${targetRecLow}–${targetRecHigh} BPM`,
          notes: `Completed ${roundsCompleted}/4 rounds Norwegian 4x4 HIIT on ${equipment}. Peak HR: ${peakHeartRate} BPM. 1m HRR Drop: -${hrrDrop} BPM. RPE: ${rpeScore}/10.`
        })
      }

      if (onComplete) onComplete()
      onClose()
    } catch (err) {
      console.error('Error saving HIIT 4x4 session:', err)
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

  const isWork = currentBlock.type === 'WORK'
  const blockProgressPct = Math.round(
    ((currentBlock.durationSeconds - blockSecondsRemaining) / currentBlock.durationSeconds) * 100
  )

  return (
    <div
      className={`fixed inset-0 z-[100] text-white flex flex-col items-center justify-between font-sans overflow-hidden select-none animate-in fade-in duration-300 keep-white transition-colors duration-700 ${
        isWork ? 'bg-[#0e0304]' : 'bg-[#030d09]'
      }`}
    >
      {/* Ambient Pulsing Glow Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[140px] transition-colors duration-1000 ${
            isWork ? 'bg-red-600/15' : 'bg-emerald-600/15'
          }`}
        />
        <div
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[100px] animate-pulse transition-colors duration-1000 ${
            isWork ? 'bg-orange-600/20' : 'bg-teal-500/20'
          }`}
        />
      </div>

      {/* HEADER */}
      <header className="w-full max-w-4xl px-6 py-5 flex items-center justify-between z-20 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all ${
              isWork
                ? 'bg-red-500/20 border-red-400/40 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.35)]'
                : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.35)]'
            }`}
          >
            <Zap size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wider uppercase text-white">{modalityName}</h1>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isWork
                    ? 'bg-red-500/20 text-red-300 border-red-400/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                }`}
              >
                Round {currentBlock.round} of 4 • {isWork ? 'WORK (90–95%)' : 'RECOVERY (60–70%)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Helgerud Protocol • Target: {isWork ? `${targetWorkLow}–${targetWorkHigh} BPM` : `${targetRecLow}–${targetRecHigh} BPM`}
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
                ? 'bg-white/20 border-white/40 text-white'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
            title="Audio Cues & Music"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span className="hidden sm:inline">
              {audioTrack === 'OFF' ? 'Silent / Gym' : audioTrack === 'WORKOUT_PULSE' ? '130 BPM Pulse' : 'Music'}
            </span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={() => {
              if (isActive) {
                if (confirm('Exit HIIT session early?')) {
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
        <div className="w-full max-w-xl mx-4 my-2 p-4 bg-black/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] z-30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Music size={14} /> Workout Audio &amp; Interval Chimes
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
            <label className="text-[11px] font-semibold text-slate-300">Soundtrack</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAudioTrack('WORKOUT_PULSE')
                  setIsMuted(false)
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  audioTrack === 'WORKOUT_PULSE' && !isMuted
                    ? 'bg-red-500/25 border-red-400 text-white'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold">⚡ 130 BPM Pulse</div>
                <div className="text-[10px] text-slate-400">Cardio Rhythm</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAudioTrack('ZEN_FLUTE')
                  setIsMuted(false)
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  audioTrack === 'ZEN_FLUTE' && !isMuted
                    ? 'bg-red-500/25 border-red-400 text-white'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold">🎋 Zen Flute</div>
                <div className="text-[10px] text-slate-400">Japanese Bamboo</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAudioTrack('HANDPAN')
                  setIsMuted(false)
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  audioTrack === 'HANDPAN' && !isMuted
                    ? 'bg-red-500/25 border-red-400 text-white'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold">🥁 Handpan</div>
                <div className="text-[10px] text-slate-400">Harmonic Steel</div>
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
                <div className="text-xs font-bold">🔇 Gym / Spotify</div>
                <div className="text-[10px] text-slate-400">External Audio</div>
              </button>
            </div>
          </div>

          {/* Coaching Chimes (Transition Cues) */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                {chimesEnabled ? <Bell size={13} className="text-red-400" /> : <BellOff size={13} className="text-slate-400" />}
                Interval Transition Chimes
              </div>
              <div className="text-[10px] text-slate-400">
                Ascending bell at Work start, descending gentle bowl at Recovery start.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setChimesEnabled(prev => !prev)
                if (!chimesEnabled) {
                  playWorkIntervalStartChime()
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                chimesEnabled
                  ? 'bg-red-500/30 text-red-200 border border-red-400/50'
                  : 'bg-white/5 text-slate-400 border border-white/10'
              }`}
            >
              {chimesEnabled ? 'Enabled ✓' : 'Muted'}
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 1: PRE-WORKOUT CONFIGURATION ================= */}
      {step === 'PRE_CHECK' && (
        <main className="w-full max-w-xl flex-1 px-6 py-4 flex flex-col justify-center items-center gap-5 z-10 overflow-y-auto">
          {/* Equipment Selector */}
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-red-300">
              <span className="flex items-center gap-1.5">
                <Activity size={14} /> Training Modality / Equipment
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Choose your machine</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { key: 'treadmill', label: 'Treadmill Incline', desc: 'Running / 10–15% incline' },
                { key: 'airbike', label: 'Assault / AirBike', desc: 'Full-body metabolic power' },
                { key: 'rower', label: 'Rowing Machine', desc: 'High posterior chain load' },
                { key: 'stairmaster', label: 'StairMaster', desc: 'Steep continuous climbing' },
                { key: 'outdoor_running', label: 'Outdoor Sprints', desc: 'Track or hill repeats' }
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setEquipment(item.key as any)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    equipment === item.key
                      ? 'bg-red-500/25 border-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] scale-[1.02]'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="text-xs font-black">{item.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* User Age & Target Heart Rate Calculator */}
          <div className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-red-300 flex items-center gap-1.5">
                <HeartPulse size={14} /> Calculated Target Heart Rate Brackets
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
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-red-300">
                  🔥 Work (90–95% HRmax)
                </div>
                <div className="text-lg font-black text-white font-mono mt-0.5">
                  {targetWorkLow}–{targetWorkHigh} BPM
                </div>
                <div className="text-[9px] text-red-200/80">RPE 8.5–9.5 / Heavy gasp</div>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  🌱 Recovery (60–70% HRmax)
                </div>
                <div className="text-lg font-black text-white font-mono mt-0.5">
                  {targetRecLow}–{targetRecHigh} BPM
                </div>
                <div className="text-[9px] text-emerald-200/80">RPE 4–5 / Aerobic spin</div>
              </div>
            </div>
          </div>

          {/* Protocol Structure Overview */}
          <div className="w-full flex items-center justify-between px-3 py-2 bg-black/40 rounded-xl border border-white/5 text-xs text-slate-400">
            <span>4 Rounds x (4:00 Work + 3:00 Active Recovery)</span>
            <span className="font-bold text-slate-200">28 Mins Total</span>
          </div>

          {/* Start Button */}
          <button
            type="button"
            onClick={() => {
              unlockAudioContext()
              setIsActive(true)
              setStep('SESSION')
              setCurrentBlockIndex(0)
              setBlockSecondsRemaining(INTERVAL_SEQUENCE[0].durationSeconds)
              playWorkIntervalStartChime()
            }}
            className="w-full py-4.5 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-[0_0_35px_rgba(239,68,68,0.45)] flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98"
          >
            <Play size={20} className="fill-white" />
            <span>Start Norwegian 4x4 Workout</span>
          </button>
        </main>
      )}

      {/* ================= STEP 2: IMMERSIVE FULL-SCREEN INTERVAL COACH ================= */}
      {step === 'SESSION' && (
        <main className="w-full max-w-xl flex-1 px-6 py-6 flex flex-col justify-between items-center z-10">
          {/* Top Workout Timeline Bar */}
          <div className="w-full space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold text-slate-300">
              <span>Overall Progress: Round {currentBlock.round} of 4</span>
              <span className="font-mono text-slate-400">Total: {formatTimer(totalWorkoutElapsedSeconds)}</span>
            </div>

            {/* 8-Segment Interval Progress Strip */}
            <div className="grid grid-cols-8 gap-1 w-full h-2 rounded-full overflow-hidden bg-white/10 p-0.5">
              {INTERVAL_SEQUENCE.map((blk, idx) => {
                const isPast = idx < currentBlockIndex
                const isCurrent = idx === currentBlockIndex
                const isWorkBlock = blk.type === 'WORK'

                return (
                  <div
                    key={idx}
                    className={`h-full rounded-sm transition-all duration-300 ${
                      isPast
                        ? isWorkBlock ? 'bg-red-500' : 'bg-emerald-500'
                        : isCurrent
                        ? isWorkBlock ? 'bg-red-400 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.9)]' : 'bg-emerald-400 animate-pulse'
                        : 'bg-white/10'
                    }`}
                  />
                )
              })}
            </div>
          </div>

          {/* Active Interval State Card */}
          <div
            className={`w-full p-4 rounded-2xl border backdrop-blur-md text-center space-y-1 transition-all duration-500 ${
              isWork
                ? 'border-red-500/40 bg-red-950/20 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                : 'border-emerald-500/40 bg-emerald-950/20 text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider">
                {isWork ? '🔥 WORK INTERVAL' : '🌱 ACTIVE RECOVERY'}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isWork ? 'bg-red-500/30 text-red-200' : 'bg-emerald-500/30 text-emerald-200'
                }`}
              >
                {currentBlock.targetHrPct}
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium max-w-md mx-auto">
              {currentBlock.instructions}
            </p>
          </div>

          {/* Central Interval Countdown Ring */}
          <div className="relative my-auto flex flex-col items-center justify-center">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className={isWork ? 'stroke-red-950/60' : 'stroke-emerald-950/60'}
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className={`transition-all duration-1000 ease-linear ${
                    isWork
                      ? 'stroke-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)]'
                      : 'stroke-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.7)]'
                  }`}
                  strokeWidth="5"
                  strokeDasharray={276.46}
                  strokeDashoffset={276.46 - (276.46 * blockProgressPct) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Time Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-6xl sm:text-7xl font-black tracking-tight text-white font-mono drop-shadow-[0_0_25px_rgba(239,68,68,0.3)]">
                  {formatTimer(blockSecondsRemaining)}
                </span>
                <span
                  className={`text-xs font-bold uppercase tracking-wider mt-1 ${
                    isWork ? 'text-red-300' : 'text-emerald-300'
                  }`}
                >
                  {isWork ? 'Hold 90–95% HR' : 'Active Aerobic Spin'}
                </span>
                <span className="text-[11px] font-mono text-slate-300 mt-0.5">
                  Target: {isWork ? `${targetWorkLow}–${targetWorkHigh} BPM` : `${targetRecLow}–${targetRecHigh} BPM`}
                </span>
              </div>
            </div>
          </div>

          {/* Action Control Bar */}
          <div className="w-full space-y-3">
            <div className="flex items-center justify-center gap-2.5">
              {/* Play / Pause Toggle */}
              <button
                type="button"
                onClick={() => setIsActive(prev => !prev)}
                className="flex-1 py-4 bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
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

              {/* Skip to Next Interval */}
              <button
                type="button"
                onClick={advanceToNextInterval}
                className="py-4 px-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-300 hover:text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                title="Skip to next interval"
              >
                <FastForward size={16} />
                <span className="hidden sm:inline">Next</span>
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
                <span>Finish &amp; Log</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ================= STEP 3: POST-WORKOUT HR RECOVERY & BIO-DELTA LOGGING ================= */}
      {step === 'POST_CHECK' && (
        <main className="w-full max-w-xl flex-1 px-6 py-4 flex flex-col justify-center items-center gap-4.5 z-10 overflow-y-auto">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-500/20 border border-red-400/40 text-red-300 mb-1 shadow-[0_0_25px_rgba(239,68,68,0.4)]">
              <Sparkles size={24} />
            </div>
            <h2 className="text-xl font-black text-white">Norwegian 4x4 Protocol Complete</h2>
            <p className="text-xs text-red-400 font-medium">
              Completed {Math.floor(totalWorkoutElapsedSeconds / 60)}m of high-intensity aerobic interval training
            </p>
          </div>

          {/* 1-Minute Heart Rate Recovery (HRR) Calculator Card */}
          <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-red-950/40 to-slate-900 border border-red-500/30 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-red-200 flex items-center gap-1.5">
                <HeartPulse size={14} className="text-red-400" />
                1-Minute Heart Rate Recovery (HRR) Test
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
                Vagal Tone Marker
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Measure how quickly your heart rate drops in the first 60 seconds post-workout. A drop of <strong>&gt;18–25 BPM</strong> indicates robust parasympathetic reactivation and exceptional cardiovascular resilience (Cole et al., <em>NEJM</em>).
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Peak HR Reached (BPM)</label>
                <input
                  type="number"
                  value={peakHeartRate}
                  onChange={e => setPeakHeartRate(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/20 text-white font-mono text-center font-bold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">HR at 60s Rest (BPM)</label>
                <input
                  type="number"
                  value={hrRecovery60s}
                  onChange={e => setHrRecovery60s(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/20 text-white font-mono text-center font-bold text-sm"
                />
              </div>
            </div>

            {/* Calculated Drop Badge */}
            <div className="pt-1 flex items-center justify-between text-xs bg-black/30 p-2.5 rounded-xl border border-white/5">
              <span className="text-slate-300 font-medium">1-Minute Vagal HRR Drop:</span>
              <span className="font-mono font-black text-emerald-400 text-sm">
                -{Math.max(0, peakHeartRate - hrRecovery60s)} BPM
                {peakHeartRate - hrRecovery60s >= 20 ? ' (Elite Recovery ✓)' : ''}
              </span>
            </div>
          </div>

          {/* RPE & Vigor Sliders */}
          <div className="w-full space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10 text-left">
            {/* RPE (Rate of Perceived Exertion) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                <span>Rating of Perceived Exertion (RPE)</span>
                <span className="text-red-400 font-mono">{rpeScore}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={rpeScore}
                onChange={e => setRpeScore(parseInt(e.target.value))}
                className="w-full accent-red-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Moderate</span>
                <span>Target: 8.5–9.5</span>
                <span>Maximum Failure</span>
              </div>
            </div>

            {/* Post-Workout Energy & Vigor */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                <span>Post-Workout Cardiorespiratory Vigor</span>
                <span className="text-red-400 font-mono">{vigorScore}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={vigorScore}
                onChange={e => setVigorScore(parseInt(e.target.value))}
                className="w-full accent-red-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Exhausted / Depleted</span>
                <span>High VO2 Max Surge</span>
              </div>
            </div>
          </div>

          {/* Finish & Save Button */}
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAndComplete}
            className="w-full py-4.5 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {isSaving ? (
              <span>Saving Session...</span>
            ) : (
              <>
                <Check size={18} />
                <span>Save 4x4 Intervals &amp; Complete Step</span>
              </>
            )}
          </button>
        </main>
      )}

      {/* FOOTER */}
      <footer className="w-full max-w-4xl px-6 py-4 flex items-center justify-between text-red-400/60 text-[11px] z-20 border-t border-white/10">
        <span>Helgerud et al. (Med Sci Sports Exerc 2007) • PMID 17414804</span>
        <span>Stroke Volume Remodeling &amp; VO2 Max</span>
      </footer>
    </div>
  )
}
