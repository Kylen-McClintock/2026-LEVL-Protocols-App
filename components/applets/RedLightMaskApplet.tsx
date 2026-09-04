'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  Sun, 
  ShieldCheck, 
  Zap, 
  Camera, 
  Upload, 
  Eye, 
  Flame,
  Activity,
  Layers
} from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { saveBatchOutcomeObservations, updateTaskExecutionDetails } from '@/lib/data'
import { format } from 'date-fns'

interface RedLightMaskAppletProps {
  isOpen: boolean
  onClose: () => void
  modalityName?: string
  taskId?: string
  onComplete?: () => void
}

export default function RedLightMaskApplet({
  isOpen,
  onClose,
  modalityName = 'Red & Near-Infrared LED Face Mask (10 Mins)',
  taskId,
  onComplete
}: RedLightMaskAppletProps) {
  const [step, setStep] = useState<'PRE_CHECK' | 'SESSION' | 'POST_CHECK'>('PRE_CHECK')
  const [targetMinutes, setTargetMinutes] = useState<number>(10)
  const totalSeconds = targetMinutes * 60
  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalSeconds)
  const [isActive, setIsActive] = useState<boolean>(false)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)
  
  // Power & Photobiomodulation specs
  const irradianceMw = 40 // Average medical-grade LED mask: 40 mW/cm²
  const [bareSkinConfirmed, setBareSkinConfirmed] = useState<boolean>(true)
  const [eyeProtectionUsed, setEyeProtectionUsed] = useState<boolean>(true)
  
  // Post-session metrics
  const [skinWarmthComfort, setSkinWarmthComfort] = useState<number>(8) // 1-10
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const halfTimeBellFiredRef = useRef<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Sync timer if targetMinutes changes in setup
  useEffect(() => {
    if (step === 'PRE_CHECK') {
      setSecondsRemaining(targetMinutes * 60)
    }
  }, [targetMinutes, step])

  // Audio Engine
  const getAudioContext = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioCtx) return null
        audioCtxRef.current = new AudioCtx()
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume()
      }
      return audioCtxRef.current
    } catch (err) {
      return null
    }
  }

  const playChime = (freq = 528, duration = 2.5) => {
    if (!soundEnabled) return
    const ctx = getAudioContext()
    if (!ctx) return
    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + duration)
    } catch (_) {}
  }

  // Timer Tick Engine
  useEffect(() => {
    if (isActive && step === 'SESSION') {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          // Halfway notification bell (5 mins)
          if (prev === Math.floor(totalSeconds / 2) && !halfTimeBellFiredRef.current) {
            halfTimeBellFiredRef.current = true
            playChime(639, 2.0)
          }

          if (prev <= 1) {
            clearInterval(timerRef.current!)
            setIsActive(false)
            playChime(432, 4.0)
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
  }, [isActive, step, totalSeconds])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {})
    }
  }, [])

  const handleStartSession = () => {
    getAudioContext()
    setStep('SESSION')
    setIsActive(true)
    setSecondsRemaining(totalSeconds)
    halfTimeBellFiredRef.current = false
    playChime(528, 2.5)
  }

  const handleTogglePlay = () => {
    getAudioContext()
    if (secondsRemaining <= 0) {
      setSecondsRemaining(totalSeconds)
    }
    setIsActive(!isActive)
  }

  const handleReset = () => {
    setIsActive(false)
    setSecondsRemaining(totalSeconds)
    halfTimeBellFiredRef.current = false
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const elapsedSeconds = totalSeconds - secondsRemaining
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / (totalSeconds || 1)) * 100))
  // Fluence (J/cm²) = (mW/cm² * seconds) / 1000
  const deliveredJoules = Math.round(((irradianceMw * elapsedSeconds) / 1000) * 10) / 10

  const handleFinishAndSave = async () => {
    setIsSaving(true)
    try {
      const localUserId = getLocalUserId()
      const dateStr = format(new Date(), 'yyyy-MM-dd')

      // Save Outcome Observations
      await saveBatchOutcomeObservations([
        {
          localUserId,
          outcomeId: 'skin_clarity',
          phase: 'post',
          value: skinWarmthComfort,
          checkinDate: dateStr,
          taskId: taskId || 'red_light_mask_applet'
        }
      ])

      // Persist Task Execution Details
      if (taskId) {
        await updateTaskExecutionDetails(taskId, {
          duration: Math.round(elapsedSeconds / 60) || targetMinutes,
          completed_seconds: elapsedSeconds,
          delivered_fluence_j_cm2: deliveredJoules,
          bare_skin_used: bareSkinConfirmed,
          eye_protection_used: eyeProtectionUsed,
          post_comfort_score: skinWarmthComfort,
          has_baseline_photo: Boolean(photoPreview),
          notes: `Completed ${Math.round(elapsedSeconds / 60)}m Red Light Mask session delivering ${deliveredJoules} J/cm². Comfort: ${skinWarmthComfort}/10.`
        })
      }

      if (onComplete) onComplete()
      onClose()
    } catch (err) {
      console.error('Error saving red light session metrics:', err)
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
    <div className="fixed inset-0 z-[100] bg-[#090202] text-white flex flex-col items-center justify-between font-sans overflow-hidden select-none animate-in fade-in duration-300">
      {/* Ambient Red Glow Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-rose-600/10 blur-[130px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-red-600/15 blur-[90px] animate-pulse" />
      </div>

      {/* HEADER */}
      <header className="w-full max-w-4xl px-6 py-5 flex items-center justify-between z-20 border-b border-rose-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <Flame size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wider uppercase text-rose-100">{modalityName}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30">
                630nm + 830nm Photons
              </span>
            </div>
            <p className="text-[11px] text-rose-200/70">
              Photobiomodulation • Mitochondrial Cytochrome C Oxidase &amp; Fibroblast ATP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              getAudioContext()
              setSoundEnabled(!soundEnabled)
            }}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-white/5 text-slate-500 border-white/10'
            }`}
            title={soundEnabled ? 'Chimes Active' : 'Sound Muted'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* STEP 1: PRE-CHECK SETUP */}
      {step === 'PRE_CHECK' && (
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-4 max-w-lg w-full text-center space-y-6 z-20 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 text-white flex items-center justify-center mx-auto shadow-[0_0_35px_rgba(225,29,72,0.4)]">
            <Sun size={32} />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              Photobiomodulation Session
            </h2>
            <p className="text-xs sm:text-sm text-rose-200/80 max-w-md mx-auto leading-relaxed">
              Clinical 630nm red &amp; 830nm near-infrared light increases dermal procollagen density by 26% when delivered to bare, clean skin.
            </p>
          </div>

          {/* Duration Selector */}
          <div className="w-full space-y-2 text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300/80">
              Session Duration Target
            </span>
            <div className="grid grid-cols-2 gap-3">
              {[
                { mins: 10, label: '10 Mins (Clinical Sweet Spot)', badge: '⭐ Standard Dose', joules: '18–24 J/cm²' },
                { mins: 15, label: '15 Mins (Deep Sub-layer)', badge: '⚡ High Density', joules: '28–36 J/cm²' }
              ].map(d => (
                <button
                  key={d.mins}
                  type="button"
                  onClick={() => setTargetMinutes(d.mins)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    targetMinutes === d.mins
                      ? 'bg-rose-600/30 border-rose-400 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)] scale-[1.02]'
                      : 'bg-black/40 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-[9px] font-bold text-rose-300">{d.badge}</span>
                  <div className="text-lg font-black text-white mt-0.5">{d.mins} Minutes</div>
                  <div className="text-[10px] text-rose-200/60 mt-0.5">{d.joules} energy</div>
                </button>
              ))}
            </div>
          </div>

          {/* Bare Skin Pre-Session Checklist */}
          <div className="w-full bg-black/50 p-4 rounded-2xl border border-rose-900/30 space-y-2.5 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              <ShieldCheck size={13} /> Optical Efficiency Checklist
            </span>
            
            <button
              type="button"
              onClick={() => setBareSkinConfirmed(!bareSkinConfirmed)}
              className={`w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                bareSkinConfirmed ? 'bg-rose-600/20 border-rose-400/60 text-rose-200' : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <span>1. 100% Bare Skin (Cleansed &amp; Dry — Creams Disperse Photons)</span>
              <span>{bareSkinConfirmed ? '✓' : '○'}</span>
            </button>

            <button
              type="button"
              onClick={() => setEyeProtectionUsed(!eyeProtectionUsed)}
              className={`w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                eyeProtectionUsed ? 'bg-rose-600/20 border-rose-400/60 text-rose-200' : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <span>2. Eye Inserts Used / Eyes Gently Closed During Treatment</span>
              <span>{eyeProtectionUsed ? '✓' : '○'}</span>
            </button>
          </div>

          {/* Start Session Button */}
          <button
            type="button"
            onClick={handleStartSession}
            className="w-full py-4 bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(225,29,72,0.5)] flex items-center justify-center gap-2.5 transition-all cursor-pointer transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <Sparkles size={18} fill="currentColor" />
            <span>Begin LED Session ({targetMinutes} Mins)</span>
          </button>
        </main>
      )}

      {/* STEP 2: ACTIVE SESSION */}
      {step === 'SESSION' && (
        <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-xl text-center space-y-8 z-10">
          {/* Energy Fluence Live Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 backdrop-blur-md shadow-lg text-rose-300 animate-pulse">
            <Sun size={14} />
            <span className="text-xs font-black uppercase tracking-wider">
              {deliveredJoules} J/cm² Photons Delivered
            </span>
            <span className="text-[10px] font-mono text-rose-400">
              (40 mW/cm² Flux)
            </span>
          </div>

          {/* Giant Countdown Clock */}
          <div className="relative flex flex-col items-center justify-center my-2">
            <span className="font-mono text-6xl sm:text-7xl md:text-8xl font-black text-rose-100 tracking-tighter drop-shadow-[0_0_40px_rgba(244,63,94,0.4)]">
              {formatTimer(secondsRemaining)}
            </span>
            <div className="flex items-center gap-2 mt-2 text-xs text-rose-300/80">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="uppercase font-bold tracking-wider">
                {isActive ? 'Active Photobiomodulation' : 'Session Paused'}
              </span>
            </div>
          </div>

          {/* Circular Progress Bar */}
          <div className="w-full max-w-sm bg-rose-950/40 h-2.5 rounded-full overflow-hidden p-0.5 border border-rose-500/20">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 shadow-[0_0_15px_rgba(244,63,94,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Posture & Protocol Guidance */}
          <p className="text-xs text-rose-200/70 italic max-w-md">
            &ldquo;Keep eyes closed or relaxed. Next step: Apply 3–4 drops of GHK-Cu Copper Peptide immediately while dermal micro-circulation is elevated.&rdquo;
          </p>

          {/* Controller Buttons */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`px-8 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-xl cursor-pointer ${
                isActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 text-white hover:from-rose-500 hover:to-red-500 shadow-rose-900/50 scale-105'
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
                playChime(432, 3.5)
                setStep('POST_CHECK')
              }}
              className="px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white border border-white/20 font-bold text-xs transition-all cursor-pointer"
            >
              Finish Early
            </button>
          </div>
        </main>
      )}

      {/* STEP 3: POST-CHECK & OPTIONAL PHOTO */}
      {step === 'POST_CHECK' && (
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-4 max-w-lg w-full text-center space-y-5 z-20 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(244,63,94,0.4)]">
            <CheckCircle2 size={32} />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
              LED Session Complete
            </h2>
            <p className="text-xs text-rose-200/80">
              Delivered {deliveredJoules} J/cm² of ATP-stimulating light. Log comfort and proceed to GHK-Cu serum application.
            </p>
          </div>

          {/* Skin Warmth & Comfort Slider */}
          <div className="w-full bg-black/50 p-4 rounded-2xl border border-rose-900/30 space-y-2 text-left">
            <div className="flex justify-between items-center text-xs">
              <span className="text-rose-200 font-bold flex items-center gap-1.5">
                <Activity size={13} className="text-rose-400" /> Dermal Comfort &amp; Warmth
              </span>
              <span className="font-mono font-bold text-rose-300 text-sm">{skinWarmthComfort}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={skinWarmthComfort}
              onChange={e => setSkinWarmthComfort(parseInt(e.target.value))}
              className="w-full cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>1 = Irritated / Uncomfortable</span>
              <span>10 = Optimal Warm Glow</span>
            </div>
          </div>

          {/* Optional Baseline Photo Upload */}
          <div className="w-full bg-black/50 p-3.5 rounded-2xl border border-rose-900/30 space-y-2 text-left">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-rose-300">
              <span className="flex items-center gap-1.5">
                <Camera size={13} /> Optional: Weekly Skin Photo Baseline
              </span>
              <span className="text-slate-500 text-[9px] lowercase font-normal">optional</span>
            </div>

            {photoPreview ? (
              <div className="flex items-center gap-3 p-2 bg-rose-950/30 rounded-xl border border-rose-500/30">
                <img
                  src={photoPreview}
                  alt="Skin Baseline Preview"
                  className="w-14 h-14 rounded-lg object-cover border border-rose-400/40"
                />
                <div className="flex-1 text-xs">
                  <div className="text-rose-200 font-bold">Photo Attached ✓</div>
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="text-[10px] text-rose-400 hover:text-rose-300 underline mt-0.5 cursor-pointer"
                  >
                    Remove Photo
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-2.5 rounded-xl border border-dashed border-rose-500/30 hover:border-rose-400/60 bg-white/5 text-rose-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Upload size={14} />
                <span>Snap or Upload Weekly Photo</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Complete & Save Button */}
          <button
            type="button"
            disabled={isSaving}
            onClick={handleFinishAndSave}
            className="w-full py-4 bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {isSaving ? (
              <span>Saving Session...</span>
            ) : (
              <>
                <Check size={18} />
                <span>Save &amp; Complete Step ({deliveredJoules} J/cm²)</span>
              </>
            )}
          </button>
        </main>
      )}

      {/* FOOTER */}
      <footer className="w-full max-w-4xl px-6 py-4 flex items-center justify-between text-rose-300/60 text-[11px] z-20 border-t border-rose-950/40">
        <span>Clinical Photobiomodulation Spec: 630nm / 830nm</span>
        <span>Target Fluence: 15–30 J/cm²</span>
      </footer>
    </div>
  )
}
