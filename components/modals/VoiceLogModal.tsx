'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  X, Mic, MicOff, Square, Sparkles, CheckCircle2, Volume2, 
  VolumeX, AlertCircle, Play, RotateCcw, ArrowRight, ShieldCheck, Flame 
} from 'lucide-react'
import { updateDailyTaskStatus, getDailyProtocolTasks } from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'

interface VoiceLogModalProps {
  isOpen: boolean
  onClose: () => void
  onLoggedSuccess?: () => void
}

type PersonaType = 'coach' | 'friend' | 'scientist' | 'trainer' | 'minimalist'

const PERSONAS: { id: PersonaType; label: string; icon: string; desc: string }[] = [
  { id: 'coach', label: 'The Coach', icon: '⚡', desc: 'Direct, metric-driven, performance & recovery focused' },
  { id: 'friend', label: 'The Friend', icon: '🤝', desc: 'Warm, supportive, casual peer tone' },
  { id: 'scientist', label: 'The Scientist', icon: '🔬', desc: 'Biochemical mechanisms & data hypothesis testing' },
  { id: 'trainer', label: 'The Trainer', icon: '🏋️', desc: 'High-energy, athletic intensity & recovery' },
  { id: 'minimalist', label: 'The Minimalist', icon: '⚡', desc: 'Ultra-concise single sentence confirmation' }
]

export default function VoiceLogModal({
  isOpen,
  onClose,
  onLoggedSuccess
}: VoiceLogModalProps) {
  const { localUserId: authUserId } = useAuth()
  const localUserId = authUserId || getLocalUserId()

  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioLevel, setAudioLevel] = useState<number[]>([10, 20, 15, 30, 25, 10, 18, 22])

  // Spoken voice response configuration (Unchecked by default)
  const [enableSpokenResponse, setEnableSpokenResponse] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('coach')

  // Result state
  const [resultData, setResultData] = useState<{
    transcript: string
    completed_task_ids: string[]
    completed_modality_names: string[]
    ad_hoc_items?: { name: string; dose?: string }[]
    deviations_and_symptoms?: string
    ai_response_text: string
  } | null>(null)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [todayTasks, setTodayTasks] = useState<any[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Fetch today's tasks on open for context
  useEffect(() => {
    if (isOpen) {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      getDailyProtocolTasks(localUserId, todayStr).then(tasks => {
        if (tasks) setTodayTasks(tasks)
      })
      setResultData(null)
      setErrorMsg(null)
    } else {
      stopRecording()
    }
  }, [isOpen, localUserId])

  // Timer counter
  useEffect(() => {
    if (isRecording) {
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
  }, [isRecording])

  const startRecording = async () => {
    setErrorMsg(null)
    setResultData(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Setup audio analyzer for live waveform
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 32
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const updateWave = () => {
        analyser.getByteFrequencyData(dataArray)
        const levels = Array.from(dataArray.slice(0, 8)).map(val => Math.max(8, (val / 255) * 45))
        setAudioLevel(levels)
        animFrameRef.current = requestAnimationFrame(updateWave)
      }
      updateWave()

      // MediaRecorder with best supported mimeType
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '')

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {})
        }
        stream.getTracks().forEach(t => t.stop())

        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (audioBlob.size > 0) {
          processAudioLog(audioBlob)
        }
      }

      recorder.start(250) // collect chunks
      setIsRecording(true)
    } catch (err: any) {
      console.error('Microphone access error:', err)
      setErrorMsg('Microphone access denied or unavailable. Please enable microphone permissions in your browser settings.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }

  const processAudioLog = async (blob: Blob) => {
    setIsProcessing(true)
    setErrorMsg(null)

    try {
      const formData = new FormData()
      formData.append('file', blob, 'voicelog.webm')
      formData.append('todayTasks', JSON.stringify(todayTasks))
      formData.append('persona', selectedPersona)

      const response = await fetch('/api/voice/log', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.error || `Server responded with ${response.status}`)
      }

      const res = await response.json()
      if (res.data) {
        setResultData(res.data)

        // Automatically mark matched tasks as completed in DB
        if (res.data.completed_task_ids && res.data.completed_task_ids.length > 0) {
          const notesText = res.data.deviations_and_symptoms || undefined
          for (const taskId of res.data.completed_task_ids) {
            await updateDailyTaskStatus(
              taskId,
              'completed',
              undefined,
              undefined,
              new Date().toISOString(),
              undefined,
              { notes: notesText }
            )
          }

          // Trigger real-time stats broadcast to top header and Today view
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('levl_bench_updated'))
            window.dispatchEvent(new CustomEvent('levl_protocol_schedule_updated', { detail: { updated: true } }))
          }
          if (onLoggedSuccess) onLoggedSuccess()
        }

        // If spoken audio feedback is enabled, speak response using Web Speech Synthesis
        if (enableSpokenResponse && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const textToSpeak = res.data.ai_response_text
          if (textToSpeak) {
            window.speechSynthesis.cancel() // clear any prior
            const utterance = new SpeechSynthesisUtterance(textToSpeak)
            utterance.rate = selectedPersona === 'trainer' ? 1.15 : (selectedPersona === 'minimalist' ? 1.1 : 1.05)
            utterance.pitch = selectedPersona === 'friend' ? 1.05 : 1.0
            window.speechSynthesis.speak(utterance)
          }
        }
      }
    } catch (err: any) {
      console.error('Error processing voice log:', err)
      setErrorMsg(err.message || 'Failed to analyze voice log. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Mic size={17} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-1.5">
                Voice Protocol Log
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-mono font-bold">
                  ✦ GEMINI AI
                </span>
              </h2>
              <p className="text-xs text-slate-400">Speak naturally to log doses, durations, and symptoms</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Interactive Recording Area */}
          {!resultData ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              
              {/* Pulsing Audio Waveform Indicator */}
              <div className="h-16 flex items-center justify-center gap-1.5">
                {isRecording ? (
                  audioLevel.map((lvl, idx) => (
                    <div
                      key={idx}
                      className="w-2 rounded-full bg-gradient-to-t from-purple-500 to-sky-400 transition-all duration-75"
                      style={{ height: `${lvl}px` }}
                    />
                  ))
                ) : (
                  <div className="flex items-center gap-1 text-slate-500 text-xs">
                    {[12, 18, 10, 24, 16, 10, 14, 20].map((h, idx) => (
                      <div key={idx} className="w-1.5 rounded-full bg-slate-800" style={{ height: `${h}px` }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Central Mic Record Button */}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white transition-all shadow-xl cursor-pointer ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 scale-105 shadow-red-500/30 animate-pulse'
                    : 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 hover:scale-105 shadow-purple-500/25'
                }`}
              >
                {isRecording ? (
                  <Square size={28} className="fill-white" />
                ) : (
                  <Mic size={32} />
                )}
              </button>

              {/* Status & Timer */}
              <div className="text-center">
                {isRecording ? (
                  <div className="space-y-1">
                    <span className="text-sm font-mono font-bold text-red-400 flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                      Recording {formatTimer(recordingSeconds)}
                    </span>
                    <p className="text-xs text-slate-400">Tap to stop and analyze</p>
                  </div>
                ) : isProcessing ? (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-sky-400 flex items-center justify-center gap-1.5">
                      <Sparkles size={16} className="animate-spin" />
                      Gemini Multimodal Ingesting...
                    </span>
                    <p className="text-xs text-slate-400">Transcribing & matching Today's tasks</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-white">
                      Tap to Speak Protocol Check-In
                    </span>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      "I just took my DeepCell and magnesium, did 15m in the sauna but got out early because I felt lightheaded."
                    </p>
                  </div>
                )}
              </div>

              {/* Spoken Voice Response Checkbox & Persona Selector */}
              <div className="w-full pt-4 border-t border-slate-800/80 space-y-3">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-950 transition-all">
                  <input
                    type="checkbox"
                    checked={enableSpokenResponse}
                    onChange={(e) => setEnableSpokenResponse(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-500 focus:ring-purple-500 bg-slate-900 border-slate-700"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      {enableSpokenResponse ? <Volume2 size={14} className="text-purple-400" /> : <VolumeX size={14} className="text-slate-500" />}
                      Enable Spoken AI Voice Response
                      <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      LEVL will speak its biological feedback aloud via browser neural audio
                    </div>
                  </div>
                </label>

                {/* 5 Persona Selector (Visible only when audio response is enabled) */}
                {enableSpokenResponse && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/25 space-y-2 animate-in fade-in duration-200">
                    <div className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider">
                      Select AI Companion Persona:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {PERSONAS.map(p => (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => setSelectedPersona(p.id)}
                          className={`p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                            selectedPersona === p.id
                              ? 'bg-purple-500/20 border-purple-500/60 text-white font-semibold shadow-sm'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span>{p.icon}</span>
                            <span className="truncate">{p.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* Parsed Result Display */
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Transcript Card */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Recognized Transcript:
                </div>
                <p className="text-xs text-slate-200 italic leading-relaxed">
                  "{resultData.transcript}"
                </p>
              </div>

              {/* Completed Tasks Box */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 size={15} />
                  <span>Tasks Automatically Completed on Today:</span>
                </div>
                {resultData.completed_modality_names.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {resultData.completed_modality_names.map((name, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 text-xs font-medium border border-emerald-500/30"
                      >
                        ✓ {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No scheduled Today tasks matched.</p>
                )}

                {/* Ad-hoc Items */}
                {resultData.ad_hoc_items && resultData.ad_hoc_items.length > 0 && (
                  <div className="pt-2 border-t border-emerald-500/20 text-xs text-slate-300 space-y-1">
                    <span className="text-[11px] text-slate-400 font-mono">Additional Unscheduled Items:</span>
                    {resultData.ad_hoc_items.map((item, idx) => (
                      <div key={idx} className="text-xs text-emerald-300">
                        • {item.name} {item.dose && `(${item.dose})`}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Deviations & Symptoms */}
              {resultData.deviations_and_symptoms && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  <span className="font-bold block mb-0.5 text-amber-300">Notes & Symptoms Logged:</span>
                  {resultData.deviations_and_symptoms}
                </div>
              )}

              {/* AI Persona Response Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-sky-500/10 border border-purple-500/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} />
                    LEVL Companion ({PERSONAS.find(p => p.id === selectedPersona)?.label}):
                  </div>
                  {enableSpokenResponse && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                      🔊 Spoken
                    </span>
                  )}
                </div>
                <p className="text-xs text-white leading-relaxed">
                  {resultData.ai_response_text}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResultData(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={14} />
                  Log Another
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  )
}
