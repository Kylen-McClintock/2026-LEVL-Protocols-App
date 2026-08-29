'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  X, Mic, Square, Sparkles, CheckCircle2, Volume2, 
  VolumeX, AlertCircle, RotateCcw, ArrowRight, ShieldCheck, Flame, 
  Activity, Star, Plus, Check 
} from 'lucide-react'
import { 
  updateDailyTaskStatus, 
  getDailyProtocolTasks, 
  getModalities, 
  logAdHocSession, 
  saveOutcomeObservation 
} from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'

interface VoiceLogModalProps {
  isOpen: boolean
  onClose: () => void
  onLoggedSuccess?: () => void
}

type PersonaType = 'coach' | 'friend' | 'scientist' | 'trainer' | 'minimalist'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  completedNames?: string[]
  adHocNames?: string[]
  outcomes?: { outcome_id: string; rating_0_10: number; notes?: string }[]
  deviations?: string
  timestamp: string
}

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

  // Multi-turn conversation messages
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const [todayTasks, setTodayTasks] = useState<any[]>([])
  const [catalogModalities, setCatalogModalities] = useState<any[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const chatScrollRef = useRef<HTMLDivElement | null>(null)

  // Fetch today's tasks and full modality catalog on open
  useEffect(() => {
    if (isOpen) {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      Promise.all([
        getDailyProtocolTasks(localUserId, todayStr),
        getModalities()
      ]).then(([tasks, mods]) => {
        if (tasks) setTodayTasks(tasks)
        if (mods) setCatalogModalities(mods)
      })
      setMessages([])
      setErrorMsg(null)
    } else {
      stopRecording()
    }
  }, [isOpen, localUserId])

  // Auto-scroll chat thread to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages, isProcessing])

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

      recorder.start(250)
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
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const conversationHistory = messages.map(m => ({ role: m.role, text: m.text }))

      const formData = new FormData()
      formData.append('file', blob, 'voicelog.webm')
      formData.append('todayTasks', JSON.stringify(todayTasks))
      formData.append('catalogModalities', JSON.stringify(catalogModalities))
      formData.append('history', JSON.stringify(conversationHistory))
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
        const data = res.data

        // 1. Add User speech message
        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          text: data.transcript,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        // 2. Perform Database Task Completions
        if (data.completed_task_ids && data.completed_task_ids.length > 0) {
          const notesText = data.deviations_and_symptoms || undefined
          for (const taskId of data.completed_task_ids) {
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
        }

        // 3. Log Ad-Hoc Sessions if user completed un-scheduled items
        const loggedAdHocNames: string[] = []
        if (data.ad_hoc_items && data.ad_hoc_items.length > 0) {
          for (const adHoc of data.ad_hoc_items) {
            const matchedMod = catalogModalities.find(m => 
              m.name.toLowerCase().includes(adHoc.name.toLowerCase()) || 
              adHoc.name.toLowerCase().includes(m.name.toLowerCase())
            )
            if (matchedMod) {
              await logAdHocSession(
                localUserId, 
                matchedMod.id, 
                new Date().toISOString(), 
                { custom_dose: adHoc.dose, user_notes: data.deviations_and_symptoms }
              )
              loggedAdHocNames.push(`${matchedMod.name} ${adHoc.dose ? `(${adHoc.dose})` : ''}`)
            }
          }
        }

        // 4. Save Outcome Observations (Energy, Soreness, Sleep, Mood)
        if (data.outcomes_observed && data.outcomes_observed.length > 0) {
          for (const outcome of data.outcomes_observed) {
            await saveOutcomeObservation(
              localUserId,
              outcome.outcome_id,
              'post',
              outcome.rating_0_10,
              todayStr,
              undefined,
              undefined,
              outcome.notes || data.deviations_and_symptoms
            )
          }
        }

        // 5. Trigger Real-Time App-Wide Stats Updates
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('levl_bench_updated'))
          window.dispatchEvent(new CustomEvent('levl_protocol_schedule_updated', { detail: { updated: true } }))
        }
        if (onLoggedSuccess) onLoggedSuccess()

        // 6. Add Assistant Response message
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: data.ai_response_text,
          completedNames: data.completed_modality_names,
          adHocNames: loggedAdHocNames.length > 0 ? loggedAdHocNames : undefined,
          outcomes: data.outcomes_observed,
          deviations: data.deviations_and_symptoms,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        setMessages(prev => [...prev, userMsg, assistantMsg])

        // 7. Spoken voice synthesis if enabled
        if (enableSpokenResponse && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const textToSpeak = data.ai_response_text
          if (textToSpeak) {
            window.speechSynthesis.cancel()
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
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[88vh] max-h-[750px] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Mic size={17} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-1.5">
                Voice Protocol Companion
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-mono font-bold">
                  ✦ GEMINI
                </span>
              </h2>
              <p className="text-xs text-slate-400">Speak naturally to check off tasks, log doses & track outcomes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Persona & Voice Response Bar */}
        <div className="px-5 py-2.5 bg-slate-950/90 border-b border-slate-800/70 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableSpokenResponse}
                onChange={(e) => setEnableSpokenResponse(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-purple-500 focus:ring-purple-500 bg-slate-900 border-slate-700"
              />
              <span className="font-medium flex items-center gap-1">
                {enableSpokenResponse ? <Volume2 size={13} className="text-purple-400" /> : <VolumeX size={13} className="text-slate-500" />}
                Voice Audio Feedback
              </span>
            </label>
          </div>

          {/* Persona Switcher Dropdown / Pills */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500 hidden sm:inline">Persona:</span>
            <select
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value as PersonaType)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-purple-300 font-medium outline-none cursor-pointer"
            >
              {PERSONAS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable Conversation Thread */}
        <div ref={chatScrollRef} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Empty State / Prompt Suggestions */}
          {messages.length === 0 && !isProcessing && (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-3 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Start a Protocol Voice Log</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Hold or tap the mic below to log your doses, sessions, subjective energy ratings, or workout notes.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 text-left max-w-xs space-y-1">
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider block">Example Phrases:</span>
                <p>• "Took my DeepCell and magnesium, energy is an 8 out of 10 today."</p>
                <p>• "Did 15 mins in the sauna but got out early because I felt lightheaded."</p>
                <p>• "Legs are feeling pretty sore from yesterday's workout, maybe 6/10."</p>
              </div>
            </div>
          )}

          {/* Render Multi-Turn Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              {/* User Bubble */}
              {msg.role === 'user' ? (
                <div className="max-w-[85%] p-3.5 rounded-2xl rounded-br-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs shadow-md space-y-1">
                  <p className="leading-relaxed">"{msg.text}"</p>
                  <span className="text-[10px] text-purple-200/80 block text-right font-mono">{msg.timestamp}</span>
                </div>
              ) : (
                /* Assistant AI Response Card */
                <div className="max-w-[92%] p-4 rounded-2xl rounded-bl-sm bg-slate-950 border border-purple-500/30 text-white text-xs shadow-lg space-y-2.5 animate-in fade-in duration-200">
                  
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                    <span className="font-semibold text-purple-300 flex items-center gap-1.5 text-[11px]">
                      <Sparkles size={13} />
                      LEVL Companion ({PERSONAS.find(p => p.id === selectedPersona)?.label})
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
                  </div>

                  {/* AI Response Text */}
                  <p className="text-xs text-slate-100 leading-relaxed">
                    {msg.text}
                  </p>

                  {/* Badges / Database Changes */}
                  <div className="space-y-1.5 pt-1">
                    {/* Completed Tasks */}
                    {msg.completedNames && msg.completedNames.length > 0 && (
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold mr-1">Completed:</span>
                        {msg.completedNames.map((cName, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-medium border border-emerald-500/30 flex items-center gap-1">
                            <Check size={10} strokeWidth={3} />
                            {cName}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Ad-Hoc Items */}
                    {msg.adHocNames && msg.adHocNames.length > 0 && (
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-[10px] font-mono text-sky-400 font-bold mr-1">Ad-Hoc:</span>
                        {msg.adHocNames.map((aName, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-[11px] font-medium border border-sky-500/30 flex items-center gap-1">
                            <Plus size={10} strokeWidth={3} />
                            {aName}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Outcome Observations */}
                    {msg.outcomes && msg.outcomes.length > 0 && (
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-[10px] font-mono text-amber-400 font-bold mr-1">Tracked:</span>
                        {msg.outcomes.map((o, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[11px] font-medium border border-amber-500/30 flex items-center gap-1">
                            <Star size={10} className="fill-amber-400" />
                            {o.outcome_id.replace('_', ' ')}: {o.rating_0_10}/10
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Deviations & Symptoms */}
                    {msg.deviations && (
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
                        <span className="font-bold text-amber-300">Observation: </span>
                        {msg.deviations}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          ))}

          {/* Processing Loading Bubble */}
          {isProcessing && (
            <div className="flex items-start">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-purple-500/30 text-xs text-sky-400 flex items-center gap-2 shadow-md">
                <Sparkles size={15} className="animate-spin text-purple-400" />
                <span>Gemini analyzing voice & updating protocols...</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Voice Controller */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/95 shrink-0 flex items-center justify-between gap-3">
          
          {/* Live Waveform or Status Info */}
          <div className="flex-1 flex items-center gap-2">
            {isRecording ? (
              <div className="flex items-center gap-1">
                {audioLevel.map((lvl, idx) => (
                  <div
                    key={idx}
                    className="w-1.5 rounded-full bg-gradient-to-t from-purple-500 to-sky-400 transition-all duration-75"
                    style={{ height: `${lvl * 0.7}px` }}
                  />
                ))}
                <span className="text-xs font-mono font-bold text-red-400 ml-2 animate-pulse">
                  {formatTimer(recordingSeconds)}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400 truncate">
                {messages.length > 0 ? "Tap mic to reply to companion..." : "Tap mic and speak your protocol..."}
              </span>
            )}
          </div>

          {/* Record Trigger Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`h-12 px-5 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-xs transition-all shadow-lg cursor-pointer ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30 animate-pulse'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 hover:from-purple-500 hover:to-sky-400 shadow-purple-500/25'
              }`}
            >
              {isRecording ? (
                <>
                  <Square size={16} className="fill-white" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Mic size={18} />
                  <span>{messages.length > 0 ? "Reply by Voice" : "Hold / Tap to Speak"}</span>
                </>
              )}
            </button>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={onClose}
                className="h-12 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
              >
                Done
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}
