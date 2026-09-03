'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  Mic, MicOff, Square, Check, X, Sliders, Clock, Utensils, 
  Coffee, Smartphone, Droplets, Sun, Sparkles, Flame, Plus, Minus, ArrowRight
} from 'lucide-react'
import { triggerHaptic } from '@/lib/utils/haptics'
import { saveQuickLogEntry } from '@/lib/storage/quickLogsStorage'
import { DailyQuickLogEntry, ExternalConfounderData } from '@/lib/types'

export interface ParsedVoiceCheckinData {
  transcript: string
  outcomes?: Array<{ outcome_id: string; rating_0_10: number; notes?: string }>
  timings?: {
    last_meal_time?: string
    last_caffeine_time?: string
    last_screen_time?: string
    alcohol_drinks?: number
    sitting_duration?: string
    processed_sugar?: string
  }
  hotkeys?: {
    water_oz?: number
    sunlight_minutes?: number
    coffee_cups?: number
    meal_calories?: number
  }
  confounders?: ExternalConfounderData
  notes?: string
  completedTaskIds?: string[]
  completedModalityNames?: string[]
}

interface UnifiedVoiceBarProps {
  mode: 'morning' | 'anytime' | 'nightly' | 'global'
  localUserId: string
  dateStr: string
  onApplyParsedData?: (data: ParsedVoiceCheckinData) => void
  onCompleteDirectly?: (data: ParsedVoiceCheckinData) => Promise<void>
  placeholder?: string
  className?: string
  todayTasks?: any[]
  catalogModalities?: any[]
}

const OUTCOME_LABELS: Record<string, { label: string; icon: string; minDesc: string; maxDesc: string }> = {
  energy: { label: 'Energy Level', icon: '⚡', minDesc: 'Exhausted', maxDesc: 'Supercharged' },
  mood: { label: 'Overall Mood', icon: '☀️', minDesc: 'Low / Down', maxDesc: 'Euphoric' },
  stress_resilience: { label: 'Calmness / Resilience', icon: '🌊', minDesc: 'Overwhelmed', maxDesc: 'Deeply Calm' },
  sleep_quality: { label: 'Sleep Quality', icon: '🌙', minDesc: 'Restless', maxDesc: 'Deep & Restful' },
  recovery: { label: 'Physical Recovery', icon: '🛡️', minDesc: 'Depleted', maxDesc: 'Fully Restored' },
  cognitive_performance: { label: 'Focus / Clarity', icon: '🧠', minDesc: 'Brain Fog', maxDesc: 'Laser Focused' },
  muscle_soreness: { label: 'Muscle Soreness', icon: '🔥', minDesc: 'No Soreness', maxDesc: 'Intensely Sore' },
  digestive_comfort: { label: 'Digestive Comfort', icon: '🌿', minDesc: 'Bloated', maxDesc: 'Optimal' }
}

export default function UnifiedVoiceBar({
  mode,
  localUserId,
  dateStr,
  onApplyParsedData,
  onCompleteDirectly,
  placeholder,
  className = '',
  todayTasks = [],
  catalogModalities = []
}: UnifiedVoiceBarProps) {
  const [viewState, setViewState] = useState<'idle' | 'recording' | 'processing' | 'review'>('idle')
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [audioLevel, setAudioLevel] = useState<number[]>([10, 20, 15, 30, 25, 10, 18, 22])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Parsed Review State for User Calibration
  const [reviewData, setReviewData] = useState<ParsedVoiceCheckinData | null>(null)
  const [editableOutcomes, setEditableOutcomes] = useState<Record<string, number>>({})
  const [editableTimings, setEditableTimings] = useState<{
    last_meal_time?: string
    last_caffeine_time?: string
    last_screen_time?: string
    alcohol_drinks?: number
  }>({})
  const [editableHotkeys, setEditableHotkeys] = useState<{
    water_oz?: number
    sunlight_minutes?: number
    coffee_cups?: number
    meal_calories?: number
  }>({})
  const [editableNotes, setEditableNotes] = useState<string>('')
  const [isApplying, setIsApplying] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Timer Effect
  useEffect(() => {
    if (viewState === 'recording') {
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1)
      }, 1000)
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      setRecordingSeconds(0)
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [viewState])

  const themeColors = {
    morning: {
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
      bg: 'bg-emerald-950/20 hover:bg-emerald-950/30',
      glow: 'shadow-emerald-500/10',
      accentText: 'text-emerald-300',
      btn: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    anytime: {
      border: 'border-indigo-500/30 hover:border-indigo-500/60',
      bg: 'bg-indigo-950/20 hover:bg-indigo-950/30',
      glow: 'shadow-indigo-500/10',
      accentText: 'text-indigo-300',
      btn: 'bg-indigo-600 hover:bg-indigo-500 text-white',
      badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    },
    nightly: {
      border: 'border-rose-500/30 hover:border-rose-500/60',
      bg: 'bg-rose-950/20 hover:bg-rose-950/30',
      glow: 'shadow-rose-500/10',
      accentText: 'text-rose-300',
      btn: 'bg-rose-600 hover:bg-rose-500 text-white',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    },
    global: {
      border: 'border-purple-500/40 hover:border-purple-500/70',
      bg: 'bg-purple-950/20 hover:bg-purple-950/30',
      glow: 'shadow-purple-500/15',
      accentText: 'text-purple-300',
      btn: 'bg-purple-600 hover:bg-purple-500 text-white',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    }
  }[mode]

  const defaultPlaceholder = {
    morning: '🎙️ Speak morning check-in, waking energy, or last night...',
    anytime: '🎙️ Speak daytime state snapshot, notes, or hotkey additions...',
    nightly: '🎙️ Speak evening reflection, meal cutoff, or caffeine/screen timing...',
    global: '🎙️ Speak protocol completions, timings, doses, or symptoms...'
  }[mode]

  const startRecording = async () => {
    setErrorMsg(null)
    triggerHaptic('medium')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 32
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const updateWave = () => {
        analyser.getByteFrequencyData(dataArray)
        const levels = Array.from(dataArray.slice(0, 8)).map(val => Math.max(6, (val / 255) * 32))
        setAudioLevel(levels)
        animFrameRef.current = requestAnimationFrame(updateWave)
      }
      updateWave()

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '')

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      recorder.onstop = async () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        if (audioContextRef.current) audioContextRef.current.close().catch(() => {})
        stream.getTracks().forEach(t => t.stop())

        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (audioBlob.size > 0) {
          processAudio(audioBlob)
        }
      }

      recorder.start(250)
      setViewState('recording')
    } catch (err: any) {
      console.error('Microphone error:', err)
      setErrorMsg('Microphone access denied. Please check browser permissions.')
      setViewState('idle')
    }
  }

  const stopRecording = () => {
    triggerHaptic('light')
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setViewState('processing')
  }

  const cancelRecording = () => {
    triggerHaptic('light')
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    audioChunksRef.current = []
    setViewState('idle')
  }

  const processAudio = async (blob: Blob) => {
    setViewState('processing')
    setErrorMsg(null)

    try {
      const formData = new FormData()
      formData.append('file', blob, 'checkin_voice.webm')
      formData.append('persona', 'coach')

      if (todayTasks.length > 0) {
        const compactTasks = todayTasks.map(t => ({
          id: t.id,
          name: t.loose_modality?.name || t.protocol_step?.modality?.name || t.protocol_step?.name || t.name || 'Modality',
          dose: t.execution_details?.custom_dose || t.loose_modality?.dose_or_exposure || '',
          timing_slot: t.timing_slot || 'anytime',
          completed: t.status === 'completed'
        }))
        formData.append('todayTasks', JSON.stringify(compactTasks))
      }

      const response = await fetch('/api/voice/log', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.error || `Server error (${response.status})`)
      }

      const res = await response.json()
      if (res.data) {
        const parsed = res.data

        const initialOutcomes: Record<string, number> = {}
        if (parsed.outcomes_observed && Array.isArray(parsed.outcomes_observed)) {
          parsed.outcomes_observed.forEach((o: any) => {
            initialOutcomes[o.outcome_id] = o.rating_0_10
          })
        }

        const initialTimings = {
          last_meal_time: parsed.checkin_timings?.last_meal_time,
          last_caffeine_time: parsed.checkin_timings?.last_caffeine_time,
          last_screen_time: parsed.checkin_timings?.last_screen_time,
          alcohol_drinks: parsed.checkin_timings?.alcohol_drinks
        }

        const initialHotkeys = {
          water_oz: parsed.hotkey_actions?.water_oz,
          sunlight_minutes: parsed.hotkey_actions?.sunlight_minutes,
          coffee_cups: parsed.hotkey_actions?.coffee_cups,
          meal_calories: parsed.hotkey_actions?.meal_calories
        }

        const structuredPayload: ParsedVoiceCheckinData = {
          transcript: parsed.transcript || '',
          outcomes: parsed.outcomes_observed,
          timings: parsed.checkin_timings,
          hotkeys: parsed.hotkey_actions,
          notes: parsed.checkin_notes || parsed.deviations_and_symptoms || '',
          confounders: parsed.confounders,
          completedTaskIds: parsed.completed_task_ids,
          completedModalityNames: parsed.completed_modality_names
        }

        setReviewData(structuredPayload)
        setEditableOutcomes(initialOutcomes)
        setEditableTimings(initialTimings)
        setEditableHotkeys(initialHotkeys)
        setEditableNotes(parsed.checkin_notes || parsed.deviations_and_symptoms || '')
        setViewState('review')
        triggerHaptic('success')
      } else {
        throw new Error('No structured data returned from voice engine.')
      }
    } catch (err: any) {
      console.error('Error processing check-in audio:', err)
      setErrorMsg(err.message || 'Failed to analyze speech. Please try again.')
      setViewState('idle')
    }
  }

  const handleApply = async () => {
    setIsApplying(true)
    triggerHaptic('medium')

    try {
      // 1. If hotkeys were logged, automatically persist to QuickLogs
      if (editableHotkeys.water_oz) {
        await saveQuickLogEntry({
          id: `quicklog_${Date.now()}_water`,
          local_user_id: localUserId,
          hotkey_id: 'water',
          hotkey_name: 'Water Intake',
          date: dateStr,
          logged_at: new Date().toISOString(),
          value: editableHotkeys.water_oz,
          unit: 'oz',
          notes: 'Voice logged'
        })
      }
      if (editableHotkeys.sunlight_minutes) {
        await saveQuickLogEntry({
          id: `quicklog_${Date.now()}_sun`,
          local_user_id: localUserId,
          hotkey_id: 'sunlight',
          hotkey_name: 'Morning Sunlight',
          date: dateStr,
          logged_at: new Date().toISOString(),
          value: editableHotkeys.sunlight_minutes,
          unit: 'min',
          notes: 'Voice logged'
        })
      }
      if (editableHotkeys.coffee_cups) {
        await saveQuickLogEntry({
          id: `quicklog_${Date.now()}_coffee`,
          local_user_id: localUserId,
          hotkey_id: 'coffee',
          hotkey_name: 'Coffee',
          date: dateStr,
          logged_at: new Date().toISOString(),
          value: editableHotkeys.coffee_cups,
          unit: 'cups',
          notes: 'Voice logged'
        })
      }

      // 2. Prepare standardized calibrated payload
      const finalPayload: ParsedVoiceCheckinData = {
        transcript: reviewData?.transcript || '',
        outcomes: Object.entries(editableOutcomes).map(([outcome_id, rating_0_10]) => ({
          outcome_id,
          rating_0_10
        })),
        timings: editableTimings,
        hotkeys: editableHotkeys,
        notes: editableNotes,
        completedTaskIds: reviewData?.completedTaskIds,
        completedModalityNames: reviewData?.completedModalityNames
      }

      // 3. Delegate to caller callback or direct completion handler
      if (onApplyParsedData) {
        onApplyParsedData(finalPayload)
      }
      if (onCompleteDirectly) {
        await onCompleteDirectly(finalPayload)
      }

      setViewState('idle')
      setReviewData(null)
      triggerHaptic('success')
    } catch (err: any) {
      console.error('Error applying voice check-in data:', err)
      setErrorMsg('Failed to apply data. Please try again.')
    } finally {
      setIsApplying(false)
    }
  }

  // Format seconds mm:ss
  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className={`w-full transition-all select-none ${className}`}>
      {/* 1. IDLE STATE: Slim, Single-Row Unobtrusive Record Bar */}
      {viewState === 'idle' && (
        <div
          onClick={startRecording}
          role="button"
          tabIndex={0}
          className={`flex items-center justify-between px-3.5 py-2 rounded-xl border ${themeColors.border} ${themeColors.bg} backdrop-blur-sm cursor-pointer shadow-sm hover:shadow-md transition-all group`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-6 h-6 rounded-lg ${themeColors.badge} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
              <Mic size={13} className={themeColors.accentText} />
            </div>
            <span className="text-xs text-slate-300 group-hover:text-white transition-colors truncate font-medium">
              {placeholder || defaultPlaceholder}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 bg-black/40 px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
              <Sparkles size={10} className={themeColors.accentText} /> Voice AI
            </span>
          </div>
        </div>
      )}

      {/* 2. RECORDING STATE: Live Frequency Waveform & Action Controls */}
      {viewState === 'recording' && (
        <div className={`p-3 rounded-xl border ${themeColors.border} bg-slate-950/95 backdrop-blur-md shadow-xl flex items-center justify-between flex-wrap gap-3 animate-in fade-in zoom-in-95 duration-150`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            </div>

            {/* Audio Waveform Spectrum */}
            <div className="flex items-center gap-1 h-7">
              {audioLevel.map((lvl, idx) => (
                <div
                  key={idx}
                  className="w-1 rounded-full bg-gradient-to-t from-red-500 via-amber-400 to-emerald-400 transition-all duration-75"
                  style={{ height: `${lvl}px` }}
                />
              ))}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-red-400">REC</span>
                <span className="text-xs font-mono text-white font-bold">{formatSecs(recordingSeconds)}</span>
              </div>
              <span className="text-[10px] text-slate-400 truncate">Listening... Speak metrics or timings</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg ${themeColors.btn} flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 transition-all`}
            >
              <Check size={14} /> Done
            </button>
          </div>
        </div>
      )}

      {/* 3. PROCESSING STATE: Pulse & Translation Feedback */}
      {viewState === 'processing' && (
        <div className={`p-3 rounded-xl border ${themeColors.border} bg-slate-950/90 backdrop-blur-md flex items-center justify-between gap-3 animate-pulse`}>
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} className={`${themeColors.accentText} animate-spin`} />
            <span className="text-xs font-semibold text-slate-200">
              Translating speech into calibrated metrics & timings...
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
            GEMINI 2.5
          </span>
        </div>
      )}

      {/* 4. REVIEW & PRE-SUBMISSION EDITING STATE: Formal UI Controls */}
      {viewState === 'review' && reviewData && (
        <div className="p-4 rounded-xl border border-white/20 bg-slate-950/95 backdrop-blur-xl shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Review Header & Transcription */}
          <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Sparkles size={13} /> Calibrated Voice Intake
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  Review & Calibrate
                </span>
              </div>
              <p className="text-xs text-slate-300 italic mt-1 bg-black/40 p-2 rounded-lg border border-white/5 font-sans">
                "{reviewData.transcript}"
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setViewState('idle')
                setReviewData(null)
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* A. Formal Outcome Sliders */}
          {Object.keys(editableOutcomes).length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={13} className="text-emerald-400" /> Parsed Outcomes (Adjust Sliders If Needed)
              </label>
              <div className="space-y-2.5">
                {Object.entries(editableOutcomes).map(([outcomeId, val]) => {
                  const meta = OUTCOME_LABELS[outcomeId] || { label: outcomeId, icon: '📊', minDesc: 'Low', maxDesc: 'High' }
                  return (
                    <div key={outcomeId} className="bg-white/5 p-2.5 rounded-xl border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{meta.icon}</span> {meta.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                            {val} / 10
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...editableOutcomes }
                              delete updated[outcomeId]
                              setEditableOutcomes(updated)
                            }}
                            className="text-gray-500 hover:text-red-400 p-0.5 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={val}
                        onChange={(e) => {
                          setEditableOutcomes(prev => ({
                            ...prev,
                            [outcomeId]: Number(e.target.value)
                          }))
                        }}
                        className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                        <span>0: {meta.minDesc}</span>
                        <span>10: {meta.maxDesc}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* B. Exact Timings (Meal, Caffeine, Screen) */}
          {(editableTimings.last_meal_time || editableTimings.last_caffeine_time || editableTimings.last_screen_time || editableTimings.alcohol_drinks !== undefined) && (
            <div className="space-y-2.5 pt-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={13} className="text-rose-400" /> Circadian & Exposure Timings
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {editableTimings.last_meal_time && (
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <Utensils size={12} className="text-amber-400" /> Last Meal Time
                    </label>
                    <input
                      type="time"
                      value={editableTimings.last_meal_time}
                      onChange={(e) => setEditableTimings(prev => ({ ...prev, last_meal_time: e.target.value }))}
                      className="w-full bg-black/80 border border-white/20 rounded-lg p-1.5 text-white font-mono text-xs focus:border-rose-400 focus:outline-none"
                    />
                  </div>
                )}

                {editableTimings.last_caffeine_time && (
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <Coffee size={12} className="text-amber-400" /> Last Caffeine Cutoff
                    </label>
                    <input
                      type="time"
                      value={editableTimings.last_caffeine_time}
                      onChange={(e) => setEditableTimings(prev => ({ ...prev, last_caffeine_time: e.target.value }))}
                      className="w-full bg-black/80 border border-white/20 rounded-lg p-1.5 text-white font-mono text-xs focus:border-rose-400 focus:outline-none"
                    />
                  </div>
                )}

                {editableTimings.last_screen_time && (
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <Smartphone size={12} className="text-indigo-400" /> Last Screen Cutoff
                    </label>
                    <input
                      type="time"
                      value={editableTimings.last_screen_time}
                      onChange={(e) => setEditableTimings(prev => ({ ...prev, last_screen_time: e.target.value }))}
                      className="w-full bg-black/80 border border-white/20 rounded-lg p-1.5 text-white font-mono text-xs focus:border-rose-400 focus:outline-none"
                    />
                  </div>
                )}

                {editableTimings.alcohol_drinks !== undefined && (
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">🍷 Alcohol Drinks</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditableTimings(prev => ({ ...prev, alcohol_drinks: Math.max(0, (prev.alcohol_drinks || 0) - 1) }))}
                        className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-mono text-xs font-bold text-white px-2">
                        {editableTimings.alcohol_drinks} drinks
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditableTimings(prev => ({ ...prev, alcohol_drinks: (prev.alcohol_drinks || 0) + 1 }))}
                        className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* C. Quick-Log Hotkey Increments */}
          {(editableHotkeys.water_oz || editableHotkeys.sunlight_minutes || editableHotkeys.coffee_cups || editableHotkeys.meal_calories) && (
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Flame size={13} className="text-sky-400" /> Hotkey Additions
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {editableHotkeys.water_oz !== undefined && (
                  <div className="bg-sky-950/30 border border-sky-500/30 p-2 rounded-xl flex flex-col items-center">
                    <span className="text-[10px] text-sky-300 font-bold flex items-center gap-1">
                      <Droplets size={11} /> Water
                    </span>
                    <span className="text-sm font-mono font-bold text-white my-1">
                      +{editableHotkeys.water_oz} oz
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditableHotkeys(prev => ({ ...prev, water_oz: Math.max(0, (prev.water_oz || 0) - 8) }))}
                        className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded hover:bg-white/20 text-white"
                      >
                        -8
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditableHotkeys(prev => ({ ...prev, water_oz: (prev.water_oz || 0) + 8 }))}
                        className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded hover:bg-white/20 text-white"
                      >
                        +8
                      </button>
                    </div>
                  </div>
                )}

                {editableHotkeys.sunlight_minutes !== undefined && (
                  <div className="bg-amber-950/30 border border-amber-500/30 p-2 rounded-xl flex flex-col items-center">
                    <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                      <Sun size={11} /> Sunlight
                    </span>
                    <span className="text-sm font-mono font-bold text-white my-1">
                      +{editableHotkeys.sunlight_minutes} min
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditableHotkeys(prev => ({ ...prev, sunlight_minutes: Math.max(0, (prev.sunlight_minutes || 0) - 5) }))}
                        className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded hover:bg-white/20 text-white"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditableHotkeys(prev => ({ ...prev, sunlight_minutes: (prev.sunlight_minutes || 0) + 5 }))}
                        className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded hover:bg-white/20 text-white"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                )}

                {editableHotkeys.coffee_cups !== undefined && (
                  <div className="bg-amber-950/30 border border-amber-600/30 p-2 rounded-xl flex flex-col items-center">
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                      <Coffee size={11} /> Coffee
                    </span>
                    <span className="text-sm font-mono font-bold text-white my-1">
                      +{editableHotkeys.coffee_cups} cups
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditableHotkeys(prev => ({ ...prev, coffee_cups: Math.max(0, (prev.coffee_cups || 0) - 1) }))}
                        className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded hover:bg-white/20 text-white"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditableHotkeys(prev => ({ ...prev, coffee_cups: (prev.coffee_cups || 0) + 1 }))}
                        className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded hover:bg-white/20 text-white"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                )}

                {editableHotkeys.meal_calories !== undefined && (
                  <div className="bg-emerald-950/30 border border-emerald-500/30 p-2 rounded-xl flex flex-col items-center">
                    <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                      <Utensils size={11} /> Calories
                    </span>
                    <span className="text-sm font-mono font-bold text-white my-1">
                      +{editableHotkeys.meal_calories} kcal
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditableHotkeys(prev => ({ ...prev, meal_calories: Math.max(0, (prev.meal_calories || 0) - 50) }))}
                        className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded hover:bg-white/20 text-white"
                      >
                        -50
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditableHotkeys(prev => ({ ...prev, meal_calories: (prev.meal_calories || 0) + 50 }))}
                        className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded hover:bg-white/20 text-white"
                      >
                        +50
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* D. Modalities Recognized as Completed */}
          {reviewData.completedModalityNames && reviewData.completedModalityNames.length > 0 && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-2.5 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Check size={11} /> Modalities To Mark Completed:
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {reviewData.completedModalityNames.map((name, idx) => (
                  <span key={idx} className="text-xs text-white bg-emerald-500/30 px-2 py-0.5 rounded-lg border border-emerald-500/40 font-medium">
                    ✓ {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* E. Qualitative Notes Textarea */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Check-in Notes / Nuance</label>
            <textarea
              rows={2}
              value={editableNotes}
              onChange={(e) => setEditableNotes(e.target.value)}
              placeholder="Add qualitative observations or symptoms..."
              className="w-full bg-black/60 border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 font-sans resize-none"
            />
          </div>

          {/* Actions: Apply vs Discard */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              disabled={isApplying}
              onClick={() => {
                setViewState('idle')
                setReviewData(null)
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={isApplying}
              onClick={handleApply}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${themeColors.btn} flex items-center gap-1.5 shadow-lg cursor-pointer active:scale-95 transition-all`}
            >
              <Check size={14} /> {isApplying ? 'Applying...' : 'Apply & Populate Form'}
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="text-[11px] text-rose-400 bg-rose-950/30 border border-rose-500/30 px-3 py-1.5 rounded-lg mt-1 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
