'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Brain, 
  Clock, 
  Moon, 
  CheckCircle2, 
  Activity, 
  ShieldCheck, 
  Zap,
  Waves,
  Maximize2
} from 'lucide-react'

export type NSDRExecutionDetails = {
  duration?: number | '' // Target minutes
  preset_type?: '10m_quick' | '20m_classic' | '30m_deep' | 'custom'
  completed_seconds?: number
  brainwave_state_reached?: 'beta' | 'alpha' | 'theta' | 'delta_sleep'
  accidental_sleep?: boolean
  pre_fatigue_score?: number | '' // 1-10
  post_restoration_score?: number | '' // 1-10
  eye_mask_used?: boolean
  feet_elevated?: boolean
  audio_guide_type?: string
  notes?: string
}

type Props = {
  value: NSDRExecutionDetails
  onChange: (val: NSDRExecutionDetails) => void
  onOpenFullscreen?: () => void
}

const PRESETS: { key: '10m_quick' | '20m_classic' | '30m_deep'; label: string; mins: number; desc: string; badge: string }[] = [
  {
    key: '10m_quick',
    label: '10m Quick',
    mins: 10,
    desc: 'Rapid dopamine & mental fatigue recharge',
    badge: '⚡ Quick Reset'
  },
  {
    key: '20m_classic',
    label: '20m Classic',
    mins: 20,
    desc: 'Gold-standard Huberman Lab protocol',
    badge: '⭐ Gold Standard'
  },
  {
    key: '30m_deep',
    label: '30m Deep',
    mins: 30,
    desc: 'Deep somatic nidra & sleep deficit recovery',
    badge: '🌙 Deep Sleep Debt'
  }
]

export default function NSDRExecutionLog({ value, onChange, onOpenFullscreen }: Props) {
  const targetMinutes = typeof value.duration === 'number' && value.duration > 0 ? value.duration : 20
  const totalSeconds = targetMinutes * 60

  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalSeconds)
  const [isActive, setIsActive] = useState<boolean>(false)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)
  const [isCompletedAlert, setIsCompletedAlert] = useState<boolean>(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const activeOscsRef = useRef<{ stop: () => void }[]>([])

  // Web Audio Context Manager (Unlocks on user gesture)
  const getAudioContext = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioContextClass) return null
        const ctx = new AudioContextClass()
        const masterGain = ctx.createGain()
        masterGain.gain.setValueAtTime(soundEnabled ? 0.25 : 0, ctx.currentTime)
        masterGain.connect(ctx.destination)
        audioCtxRef.current = ctx
        masterGainRef.current = masterGain
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

  // Tibetan Singing Bowl Chime
  const playTibetanBowlChime = (baseFreq = 432) => {
    if (!soundEnabled) return
    const ctx = getAudioContext()
    if (!ctx || !masterGainRef.current) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const chimeGain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(baseFreq, now)

      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(baseFreq * 2, now)

      chimeGain.gain.setValueAtTime(0.001, now)
      chimeGain.gain.linearRampToValueAtTime(0.3, now + 0.1)
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8)

      osc.connect(chimeGain)
      osc2.connect(chimeGain)
      chimeGain.connect(masterGainRef.current)

      osc.start(now)
      osc2.start(now)
      osc.stop(now + 4.0)
      osc2.stop(now + 4.0)
    } catch (err) {
      console.debug('Chime audio playback skipped:', err)
    }
  }

  // Stop ambient audio
  const stopAmbient = () => {
    activeOscsRef.current.forEach(node => {
      try { node.stop() } catch (_) {}
    })
    activeOscsRef.current = []
  }

  // Start continuous 432 Hz grounding tone + 5.5 Hz theta binaural beat
  const startAmbient = () => {
    stopAmbient()
    if (!soundEnabled) return
    const ctx = getAudioContext()
    if (!ctx || !masterGainRef.current) return

    try {
      const now = ctx.currentTime
      const merger = ctx.createChannelMerger(2)
      const oscL = ctx.createOscillator()
      const oscR = ctx.createOscillator()
      const ambGain = ctx.createGain()

      oscL.type = 'sine'
      oscL.frequency.setValueAtTime(432, now) // Carrier Left
      oscR.type = 'sine'
      oscR.frequency.setValueAtTime(437.5, now) // 5.5 Hz Theta Right

      ambGain.gain.setValueAtTime(0.08, now)

      oscL.connect(merger, 0, 0)
      oscR.connect(merger, 0, 1)
      merger.connect(ambGain)
      ambGain.connect(masterGainRef.current)

      oscL.start(now)
      oscR.start(now)

      activeOscsRef.current = [{
        stop: () => {
          try { oscL.stop(); oscR.stop(); } catch (_) {}
        }
      }]
    } catch (err) {
      console.warn('Ambient audio error:', err)
    }
  }

  // Manage mute & volume
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(
        soundEnabled ? 0.25 : 0, 
        audioCtxRef.current.currentTime, 
        0.05
      )
    }
    if (soundEnabled && isActive) {
      startAmbient()
    } else if (!soundEnabled) {
      stopAmbient()
    }
  }, [soundEnabled, isActive])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAmbient()
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {})
      }
    }
  }, [])

  // Sync initial seconds if targetMinutes changes and timer is paused at start
  useEffect(() => {
    if (!isActive && (secondsRemaining === 0 || secondsRemaining === totalSeconds)) {
      setSecondsRemaining(totalSeconds)
    }
  }, [targetMinutes])

  // Timer Tick Engine
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            setIsActive(false)
            setIsCompletedAlert(true)
            stopAmbient()
            if (soundEnabled) playTibetanBowlChime(432)

            // Update completed metrics
            const completedSecs = totalSeconds
            const stateReached = targetMinutes >= 20 ? 'theta' : targetMinutes >= 10 ? 'alpha' : 'beta'
            onChange({
              ...value,
              completed_seconds: completedSecs,
              brainwave_state_reached: stateReached
            })
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
  }, [isActive, totalSeconds, soundEnabled, targetMinutes])

  const elapsedSeconds = totalSeconds - secondsRemaining
  const elapsedMinutes = elapsedSeconds / 60
  const progressFraction = Math.min(1, Math.max(0, elapsedSeconds / (totalSeconds || 1)))

  // Determine Current Brainwave State
  const currentStage = (() => {
    if (elapsedMinutes < 3) {
      return {
        state: 'Beta → Alpha Transition',
        hz: '14–18 Hz',
        desc: 'Diaphragmatic Settling & Tension Release',
        colorText: 'text-amber-300',
        colorBadge: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
        ringColor: '#F59E0B'
      }
    } else if (elapsedMinutes < 8) {
      return {
        state: 'Alpha Somatic State',
        hz: '8–12 Hz',
        desc: 'Systematic Peripheral Body Scan',
        colorText: 'text-cyan-300',
        colorBadge: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
        ringColor: '#06B6D4'
      }
    } else if (targetMinutes - elapsedMinutes <= 2 && elapsedMinutes > 5) {
      return {
        state: 'Gentle Re-Emergence',
        hz: '10–14 Hz',
        desc: 'Awakening with restored striatal dopamine',
        colorText: 'text-emerald-300',
        colorBadge: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
        ringColor: '#10B981'
      }
    } else {
      return {
        state: 'Theta Hypnagogic Twilight',
        hz: '4–7 Hz',
        desc: 'Deep Rest, Synaptic Pruning & Neuroplasticity',
        colorText: 'text-purple-300',
        colorBadge: 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)]',
        ringColor: '#A855F7'
      }
    }
  })()

  const handleSelectPreset = (preset: typeof PRESETS[number]) => {
    setIsActive(false)
    setIsCompletedAlert(false)
    setSecondsRemaining(preset.mins * 60)
    onChange({
      ...value,
      duration: preset.mins,
      preset_type: preset.key
    })
  }

  const handleCustomDuration = (mins: number) => {
    setIsActive(false)
    setIsCompletedAlert(false)
    setSecondsRemaining(mins * 60)
    onChange({
      ...value,
      duration: mins,
      preset_type: 'custom'
    })
  }

  const handleTogglePlay = () => {
    getAudioContext()
    if (secondsRemaining <= 0) {
      setSecondsRemaining(totalSeconds)
      setIsCompletedAlert(false)
    }
    const nextActive = !isActive
    setIsActive(nextActive)
    if (nextActive) {
      playTibetanBowlChime(432)
      startAmbient()
    } else {
      stopAmbient()
    }
  }

  const handleResetTimer = () => {
    setIsActive(false)
    stopAmbient()
    setIsCompletedAlert(false)
    setSecondsRemaining(totalSeconds)
  }

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const restorationDelta = 
    typeof value.pre_fatigue_score === 'number' && 
    typeof value.post_restoration_score === 'number'
      ? value.post_restoration_score - value.pre_fatigue_score
      : null

  return (
    <div className="flex flex-col gap-4 mt-3 p-4 bg-gradient-to-b from-indigo-950/40 via-slate-950/80 to-black/60 rounded-2xl border border-indigo-500/30 shadow-2xl backdrop-blur-md">
      {/* Header & Protocol Title */}
      <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Moon size={14} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-200">
              Non-Sleep Deep Rest (NSDR) / Yoga Nidra
            </h4>
            <p className="text-[10px] text-indigo-300/70">
              Stanford Huberman Protocol • Dopamine &amp; Parasympathetic Reset
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {onOpenFullscreen && (
            <button
              type="button"
              onClick={onOpenFullscreen}
              className="p-1.5 px-2.5 rounded-lg border bg-indigo-600/30 hover:bg-indigo-600/50 border-indigo-400/50 text-indigo-200 text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.3)]"
              title="Open Fullscreen Experience"
            >
              <Maximize2 size={13} />
              <span className="text-[10px] font-bold">Fullscreen</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              getAudioContext()
              setSoundEnabled(!soundEnabled)
            }}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              soundEnabled 
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' 
                : 'bg-white/5 border-white/10 text-slate-500'
            }`}
            title={soundEnabled ? 'Tibetan Bowl Sound Enabled' : 'Sound Muted'}
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>
        </div>
      </div>

      {/* Protocol Duration Presets */}
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((p) => {
          const isSelected = value.duration === p.mins || (!value.duration && p.mins === 20)
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className={`flex flex-col items-center text-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-b from-indigo-600/30 to-purple-600/20 border-indigo-400/60 shadow-[0_0_15px_rgba(99,102,241,0.25)] text-white scale-[1.02]'
                  : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
              }`}
            >
              <span className="text-[10px] font-bold text-indigo-300/90">{p.badge}</span>
              <span className="text-sm font-extrabold mt-0.5">{p.label}</span>
              <span className="text-[9px] text-slate-400 mt-1 leading-tight line-clamp-1">{p.desc}</span>
            </button>
          )
        })}
      </div>

      {/* Live Brainwave State Progression Bar & Pacer */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3 relative overflow-hidden">
        {/* Subtle Ambient Radial Aurora */}
        <div 
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full blur-2xl pointer-events-none opacity-20 transition-all duration-1000"
          style={{ backgroundColor: currentStage.ringColor }}
        />

        {/* Brainwave Stage Indicator */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Waves size={14} className={currentStage.colorText} />
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${currentStage.colorBadge}`}>
              {currentStage.state}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400">
            {currentStage.hz}
          </span>
        </div>

        <p className="text-[11px] text-slate-300/90 italic text-center">
          &ldquo;{currentStage.desc}&rdquo;
        </p>

        {/* Circular / Line Progress Bar */}
        <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-amber-400 via-cyan-400 to-purple-500"
            style={{ width: `${Math.round(progressFraction * 100)}%` }}
          />
        </div>

        {/* Live Timer Clock & Controller */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatTimer(secondsRemaining)}
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              {isActive ? 'Session Active' : secondsRemaining === 0 ? 'Completed' : 'Ready'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${
                isActive
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-900/40'
              }`}
            >
              {isActive ? (
                <>
                  <Pause size={14} /> Pause
                </>
              ) : (
                <>
                  <Play size={14} /> {secondsRemaining < totalSeconds && secondsRemaining > 0 ? 'Resume' : 'Start Session'}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResetTimer}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {isCompletedAlert && (
          <div className="p-2 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>Session complete! You reached Theta deep rest without sleep debt.</span>
          </div>
        )}
      </div>

      {/* Somatic Context & Environment Setup */}
      <div className="p-3 bg-slate-900/50 rounded-xl border border-white/10 space-y-2.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <ShieldCheck size={12} className="text-indigo-400" />
          <span>Somatic Setup &amp; Posture Parameters</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Eye Mask Toggle */}
          <button
            type="button"
            onClick={() => onChange({ ...value, eye_mask_used: !value.eye_mask_used })}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              value.eye_mask_used
                ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200'
                : 'bg-black/30 border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className={value.eye_mask_used ? 'text-indigo-300 font-black' : 'text-slate-500'}>
              {value.eye_mask_used ? '✓' : '○'}
            </span>
            <span>Eye Mask / Complete Darkness</span>
          </button>

          {/* Feet Elevated Toggle */}
          <button
            type="button"
            onClick={() => onChange({ ...value, feet_elevated: !value.feet_elevated })}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              value.feet_elevated
                ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200'
                : 'bg-black/30 border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className={value.feet_elevated ? 'text-indigo-300 font-black' : 'text-slate-500'}>
              {value.feet_elevated ? '✓' : '○'}
            </span>
            <span>Feet Elevated (Supine / Pillow Under Knees)</span>
          </button>

          {/* Twilight vs Accidental Sleep Toggle */}
          <button
            type="button"
            onClick={() => onChange({ ...value, accidental_sleep: !value.accidental_sleep })}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              value.accidental_sleep
                ? 'bg-amber-600/20 border-amber-400/40 text-amber-200'
                : 'bg-emerald-600/20 border-emerald-400/40 text-emerald-200'
            }`}
          >
            <span>{value.accidental_sleep ? '⚠️ Accidental Deep Sleep' : '✨ Stayed in Conscious Twilight'}</span>
          </button>
        </div>
      </div>

      {/* Pre & Post Autonomic Restoration Scoring */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Pre-Session Mental Fatigue */}
        <div className="p-3 bg-black/30 rounded-xl border border-white/10 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Activity size={12} className="text-amber-400" /> Pre-Session Fatigue
            </span>
            <span className="font-mono font-bold text-amber-300">
              {value.pre_fatigue_score !== undefined && value.pre_fatigue_score !== '' ? `${value.pre_fatigue_score}/10` : '5/10'}
            </span>
          </div>
          <input 
            type="range"
            min="1"
            max="10"
            value={value.pre_fatigue_score ?? 5}
            onChange={(e) => onChange({ ...value, pre_fatigue_score: Number(e.target.value) })}
            className="w-full cursor-pointer accent-amber-400"
          />
          <div className="flex justify-between text-[9px] text-slate-500">
            <span>Low (Fresh)</span>
            <span>High (Brain Fog)</span>
          </div>
        </div>

        {/* Post-Session Subjective Restoration */}
        <div className="p-3 bg-black/30 rounded-xl border border-white/10 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Zap size={12} className="text-emerald-400" /> Post-Session Restoration
            </span>
            <span className="font-mono font-bold text-emerald-300">
              {value.post_restoration_score !== undefined && value.post_restoration_score !== '' ? `${value.post_restoration_score}/10` : '8/10'}
            </span>
          </div>
          <input 
            type="range"
            min="1"
            max="10"
            value={value.post_restoration_score ?? 8}
            onChange={(e) => onChange({ ...value, post_restoration_score: Number(e.target.value) })}
            className="w-full cursor-pointer accent-emerald-400"
          />
          <div className="flex justify-between text-[9px] text-slate-500">
            <span>Minimal Relief</span>
            <span>Fully Recharged (+Dopamine)</span>
          </div>
        </div>
      </div>

      {/* Restoration Delta Badge */}
      {restorationDelta !== null && (
        <div className="flex items-center justify-between p-2.5 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs text-indigo-200">
          <div className="flex items-center gap-1.5 font-semibold">
            <Sparkles size={14} className="text-indigo-400" />
            <span>Autonomic Recovery Delta:</span>
          </div>
          <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
            restorationDelta > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
          }`}>
            {restorationDelta > 0 ? `+${restorationDelta} Net Alertness Boost` : 'Equal / Baseline'}
          </span>
        </div>
      )}
    </div>
  )
}
