'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  X, Mic, Square, Sparkles, CheckCircle2, Volume2, 
  VolumeX, AlertCircle, RotateCcw, ArrowRight, ShieldCheck, Flame, 
  Activity, Star, Plus, Minus, Check, HelpCircle, FileText, Sliders, Clock, Utensils, Coffee, Smartphone, Droplets, Sun 
} from 'lucide-react'
import { 
  updateDailyTaskStatus, 
  getDailyProtocolTasks, 
  getModalities, 
  logAdHocSession, 
  saveOutcomeObservation,
  updateTaskExecutionDetails
} from '@/lib/data'
import { saveQuickLogEntry } from '@/lib/storage/quickLogsStorage'
import { triggerHaptic } from '@/lib/utils/haptics'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'

interface VoiceLogModalProps {
  isOpen: boolean
  onClose: () => void
  onLoggedSuccess?: () => void
}

type PersonaType = 'coach' | 'friend' | 'scientist' | 'trainer' | 'minimalist'

interface PendingConfirmation {
  id: string
  recognized_term: string
  suggested_modality_id?: string
  suggested_modality_name: string
  suggested_dose?: string
  confirmed?: boolean
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  completedNames?: string[]
  adHocNames?: string[]
  pendingConfirmations?: PendingConfirmation[]
  outcomes?: { outcome_id: string; rating_0_10: number; notes?: string }[]
  taskNotes?: { modality_name: string; note: string }[]
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

  // Pre-Submission Review & Calibration State
  const [pendingReview, setPendingReview] = useState<any | null>(null)
  const [reviewOutcomes, setReviewOutcomes] = useState<Record<string, number>>({})
  const [reviewTimings, setReviewTimings] = useState<any>({})
  const [reviewHotkeys, setReviewHotkeys] = useState<any>({})
  const [reviewTaskIds, setReviewTaskIds] = useState<Set<string>>(new Set())
  const [reviewNotes, setReviewNotes] = useState<string>('')
  const [isCommitting, setIsCommitting] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const chatScrollRef = useRef<HTMLDivElement | null>(null)

  // Fetch today's tasks and modality catalog on open
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

      // Compact payload to prevent HTTP 413 Payload Too Large
      const compactTodayTasks = todayTasks.map(t => ({
        id: t.id,
        name: t.loose_modality?.name || t.protocol_step?.modality?.name || t.protocol_step?.name || t.modality?.name || t.name || t.title || 'Modality',
        dose: t.execution_details?.custom_dose || t.loose_modality?.dose_or_exposure || t.protocol_step?.modality?.dose_or_exposure || '',
        timing_slot: t.timing_slot || 'anytime',
        completed: t.status === 'completed'
      }))

      const compactCatalog = catalogModalities.slice(0, 100).map((m: any) => ({
        id: m.id,
        name: m.name
      }))

      const formData = new FormData()
      formData.append('file', blob, 'voicelog.webm')
      formData.append('todayTasks', JSON.stringify(compactTodayTasks))
      formData.append('catalogModalities', JSON.stringify(compactCatalog))
      formData.append('history', JSON.stringify(conversationHistory))
      formData.append('persona', selectedPersona)

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
        const data = res.data

        // 1. Add User speech message
        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          text: data.transcript,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, userMsg])

        // 2. Set up Pre-Submission Review & Calibration
        const initialOutcomes: Record<string, number> = {}
        if (data.outcomes_observed && Array.isArray(data.outcomes_observed)) {
          data.outcomes_observed.forEach((o: any) => {
            initialOutcomes[o.outcome_id] = o.rating_0_10
          })
        }
        setReviewOutcomes(initialOutcomes)
        setReviewTimings(data.checkin_timings || {})
        setReviewHotkeys(data.hotkey_actions || {})
        setReviewTaskIds(new Set(data.completed_task_ids || []))
        setReviewNotes(data.checkin_notes || data.deviations_and_symptoms || '')
        setPendingReview(data)
        triggerHaptic('success')
      }
    } catch (err: any) {
      console.error('Error processing voice log:', err)
      setErrorMsg(err.message || 'Failed to analyze voice log. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle 1-Tap Confirmation of Fuzzy Matched Modality
  const handleConfirmAndLogAll = async () => {
    if (!pendingReview) return
    setIsCommitting(true)
    triggerHaptic('medium')

    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd')

      // 1. Complete selected tasks
      for (const taskId of Array.from(reviewTaskIds)) {
        const matchedNoteObj = pendingReview.task_notes?.find((tn: any) => tn.task_id === taskId)
        const specificNote = matchedNoteObj?.note || reviewNotes || undefined
        await updateDailyTaskStatus(
          taskId,
          'completed',
          undefined,
          undefined,
          new Date().toISOString(),
          undefined,
          { notes: specificNote }
        )
      }

      // 2. Log ad-hoc sessions if any
      const loggedAdHocNames: string[] = []
      if (pendingReview.ad_hoc_items && pendingReview.ad_hoc_items.length > 0) {
        for (const adHoc of pendingReview.ad_hoc_items) {
          const matchedMod = catalogModalities.find(m => 
            m.name.toLowerCase().includes(adHoc.name.toLowerCase()) || 
            adHoc.name.toLowerCase().includes(m.name.toLowerCase())
          )
          if (matchedMod) {
            const noteText = adHoc.note || reviewNotes || undefined
            await logAdHocSession(
              localUserId, 
              matchedMod.id, 
              new Date().toISOString(), 
              { custom_dose: adHoc.dose, user_notes: noteText }
            )
            loggedAdHocNames.push(`${matchedMod.name} ${adHoc.dose ? `(${adHoc.dose})` : ''}`)
          }
        }
      }

      // 3. Save calibrated outcomes
      for (const [outcomeId, val] of Object.entries(reviewOutcomes)) {
        await saveOutcomeObservation(
          localUserId,
          outcomeId,
          'post',
          val,
          todayStr,
          undefined,
          undefined,
          reviewNotes || undefined
        )
      }

      // 4. Save Hotkeys to QuickLogs
      if (reviewHotkeys.water_oz) {
        await saveQuickLogEntry({
          id: `quicklog_${Date.now()}_water`,
          local_user_id: localUserId,
          hotkey_id: 'water',
          hotkey_name: 'Water Intake',
          date: todayStr,
          logged_at: new Date().toISOString(),
          value: reviewHotkeys.water_oz,
          unit: 'oz',
          notes: 'Voice logged'
        })
      }
      if (reviewHotkeys.sunlight_minutes) {
        await saveQuickLogEntry({
          id: `quicklog_${Date.now()}_sun`,
          local_user_id: localUserId,
          hotkey_id: 'sunlight',
          hotkey_name: 'Morning Sunlight',
          date: todayStr,
          logged_at: new Date().toISOString(),
          value: reviewHotkeys.sunlight_minutes,
          unit: 'min',
          notes: 'Voice logged'
        })
      }
      if (reviewHotkeys.coffee_cups) {
        await saveQuickLogEntry({
          id: `quicklog_${Date.now()}_coffee`,
          local_user_id: localUserId,
          hotkey_id: 'coffee',
          hotkey_name: 'Coffee',
          date: todayStr,
          logged_at: new Date().toISOString(),
          value: reviewHotkeys.coffee_cups,
          unit: 'cups',
          notes: 'Voice logged'
        })
      }

      // 5. Trigger Real-Time App-Wide Stats Updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('levl_bench_updated'))
        window.dispatchEvent(new CustomEvent('levl_protocol_schedule_updated', { detail: { updated: true } }))
        window.dispatchEvent(new CustomEvent('levl_quicklog_updated'))
      }
      if (onLoggedSuccess) onLoggedSuccess()

      // 6. Format Pending Confirmations if fuzzy matches exist
      const pendingItems: PendingConfirmation[] = (pendingReview.pending_confirmations || []).map((p: any, idx: number) => ({
        id: `pend-${Date.now()}-${idx}`,
        recognized_term: p.recognized_term,
        suggested_modality_id: p.suggested_modality_id,
        suggested_modality_name: p.suggested_modality_name,
        suggested_dose: p.suggested_dose,
        confirmed: false
      }))

      // 7. Add Assistant Response message to chat
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: pendingReview.ai_response_text,
        completedNames: pendingReview.completed_modality_names,
        adHocNames: loggedAdHocNames.length > 0 ? loggedAdHocNames : undefined,
        pendingConfirmations: pendingItems.length > 0 ? pendingItems : undefined,
        outcomes: Object.entries(reviewOutcomes).map(([outcome_id, rating_0_10]) => ({ outcome_id, rating_0_10 })),
        taskNotes: pendingReview.task_notes,
        deviations: reviewNotes || pendingReview.deviations_and_symptoms,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setMessages(prev => [...prev, assistantMsg])

      // 8. Spoken response synthesis if enabled
      if (enableSpokenResponse && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const textToSpeak = pendingReview.ai_response_text
        if (textToSpeak) {
          window.speechSynthesis.cancel()
          const utterance = new SpeechSynthesisUtterance(textToSpeak)
          utterance.rate = selectedPersona === 'trainer' ? 1.15 : (selectedPersona === 'minimalist' ? 1.1 : 1.05)
          utterance.pitch = selectedPersona === 'friend' ? 1.05 : 1.0
          window.speechSynthesis.speak(utterance)
        }
      }

      setPendingReview(null)
      triggerHaptic('success')
    } catch (err: any) {
      console.error('Error committing voice log:', err)
      setErrorMsg(err.message || 'Failed to commit log.')
    } finally {
      setIsCommitting(false)
    }
  }

  const handleConfirmPending = async (msgId: string, pendingId: string, item: PendingConfirmation) => {
    try {
      // Find matching modality ID or scheduled task ID
      const candidateId = item.suggested_modality_id || catalogModalities.find(m => 
        m.name.toLowerCase().includes(item.suggested_modality_name.toLowerCase())
      )?.id

      const scheduledTask = todayTasks.find(t => {
        const name = t.loose_modality?.name || t.protocol_step?.modality?.name || t.protocol_step?.name
        return name && name.toLowerCase().includes(item.suggested_modality_name.toLowerCase())
      })

      if (scheduledTask) {
        await updateDailyTaskStatus(
          scheduledTask.id, 
          'completed', 
          undefined, 
          undefined, 
          new Date().toISOString(), 
          undefined, 
          { custom_dose: item.suggested_dose }
        )
      } else if (candidateId) {
        await logAdHocSession(
          localUserId, 
          candidateId, 
          new Date().toISOString(), 
          { custom_dose: item.suggested_dose }
        )
      }

      // Update message state
      setMessages(prev => prev.map(m => {
        if (m.id === msgId && m.pendingConfirmations) {
          return {
            ...m,
            completedNames: [...(m.completedNames || []), item.suggested_modality_name],
            pendingConfirmations: m.pendingConfirmations.map(p => p.id === pendingId ? { ...p, confirmed: true } : p)
          }
        }
        return m
      }))

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('levl_bench_updated'))
        window.dispatchEvent(new CustomEvent('levl_protocol_schedule_updated', { detail: { updated: true } }))
      }
      if (onLoggedSuccess) onLoggedSuccess()
    } catch (e) {
      console.error('Error confirming suggested modality:', e)
    }
  }

  const handleDismissPending = (msgId: string, pendingId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.pendingConfirmations) {
        return {
          ...m,
          pendingConfirmations: m.pendingConfirmations.filter(p => p.id !== pendingId)
        }
      }
      return m
    }))
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
              <p className="text-xs text-slate-400">Speak naturally to check off tasks, log doses & track feelings</p>
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

          {/* Persona Switcher Dropdown */}
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
                <h3 className="text-sm font-semibold text-white">Natural Speech Protocol Logging</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Speak normally without robotic numbers. The AI calibrates your energy, mood, soreness, and protocol notes automatically.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 text-left max-w-xs space-y-1">
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider block">Natural Language Examples:</span>
                <p>• "Took my DeepCell with coffee and feel fantastic today."</p>
                <p>• "Did 20 mins in the sauna, but felt tired this morning."</p>
                <p>• "Legs are pretty sore from squats, took 5g of creatine."</p>
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
                  <div className="space-y-2 pt-1">
                    
                    {/* High-Confidence Completed Tasks */}
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

                    {/* Pending Fuzzy Match Confirmation Cards */}
                    {msg.pendingConfirmations && msg.pendingConfirmations.length > 0 && (
                      <div className="space-y-1.5 p-2 rounded-xl bg-purple-500/10 border border-purple-500/25">
                        <div className="text-[10px] font-mono text-purple-300 font-semibold flex items-center gap-1">
                          <HelpCircle size={11} />
                          Did you mean to log this?
                        </div>
                        {msg.pendingConfirmations.map((p) => (
                          <div key={p.id} className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-900/80 border border-purple-500/20 text-xs">
                            <div>
                              <span className="text-white font-medium">{p.suggested_modality_name}</span>
                              {p.suggested_dose && <span className="text-slate-400 ml-1">({p.suggested_dose})</span>}
                              <span className="text-[10px] text-purple-400 block">"{p.recognized_term}"</span>
                            </div>
                            {p.confirmed ? (
                              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                <Check size={12} strokeWidth={3} /> Confirmed
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleConfirmPending(msg.id, p.id, p)}
                                  className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30 transition-colors cursor-pointer"
                                >
                                  ✓ Confirm
                                </button>
                                <button
                                  onClick={() => handleDismissPending(msg.id, p.id)}
                                  className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] transition-colors cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Outcome Observations */}
                    {msg.outcomes && msg.outcomes.length > 0 && (
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-[10px] font-mono text-amber-400 font-bold mr-1">Calibrated:</span>
                        {msg.outcomes.map((o, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[11px] font-medium border border-amber-500/30 flex items-center gap-1" title={o.notes}>
                            <Star size={10} className="fill-amber-400" />
                            {o.outcome_id.replace('_', ' ')}: {o.rating_0_10}/10
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Modality Specific Notes */}
                    {msg.taskNotes && msg.taskNotes.length > 0 && (
                      <div className="space-y-1">
                        {msg.taskNotes.map((tn, idx) => (
                          <div key={idx} className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-200 flex items-start gap-1.5">
                            <FileText size={12} className="shrink-0 mt-0.5 text-sky-400" />
                            <span>
                              <strong className="text-sky-300">{tn.modality_name} Note:</strong> {tn.note}
                            </span>
                          </div>
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
                <span>Gemini analyzing voice & translating metrics...</span>
              </div>
            </div>
          )}

          {/* PRE-SUBMISSION INTERACTIVE REVIEW CARD */}
          {pendingReview && (
            <div className="p-4 rounded-2xl bg-slate-950/95 border border-purple-500/40 shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles size={13} className="text-purple-400" /> Review &amp; Calibrate Spoken Intake
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  Editable Before Save
                </span>
              </div>

              {/* 1. Outcomes on Sliders */}
              {Object.keys(reviewOutcomes).length > 0 && (
                <div className="space-y-2.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Sliders size={12} className="text-emerald-400" /> Calibrate Outcome Ratings:
                  </label>
                  <div className="space-y-2">
                    {Object.entries(reviewOutcomes).map(([outcomeId, score]) => (
                      <div key={outcomeId} className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200 capitalize">
                            {outcomeId.replace('_', ' ')}
                          </span>
                          <span className="font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 text-[11px]">
                            {score} / 10
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="1"
                          value={score}
                          onChange={(e) => {
                            const val = Number(e.target.value)
                            setReviewOutcomes(prev => ({ ...prev, [outcomeId]: val }))
                          }}
                          className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Circadian Timings */}
              {(reviewTimings.last_meal_time || reviewTimings.last_caffeine_time || reviewTimings.last_screen_time || reviewTimings.alcohol_drinks !== undefined) && (
                <div className="space-y-2 pt-1 border-t border-slate-800">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Clock size={12} className="text-rose-400" /> Timings &amp; Exposures:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {reviewTimings.last_meal_time && (
                      <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-300 flex items-center gap-1">
                          <Utensils size={12} className="text-amber-400" /> Last Meal:
                        </span>
                        <input
                          type="time"
                          value={reviewTimings.last_meal_time}
                          onChange={(e) => setReviewTimings((prev: any) => ({ ...prev, last_meal_time: e.target.value }))}
                          className="bg-black/80 border border-white/20 rounded px-2 py-1 text-white font-mono text-xs w-24 text-center"
                        />
                      </div>
                    )}
                    {reviewTimings.last_caffeine_time && (
                      <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-300 flex items-center gap-1">
                          <Coffee size={12} className="text-amber-400" /> Last Caffeine:
                        </span>
                        <input
                          type="time"
                          value={reviewTimings.last_caffeine_time}
                          onChange={(e) => setReviewTimings((prev: any) => ({ ...prev, last_caffeine_time: e.target.value }))}
                          className="bg-black/80 border border-white/20 rounded px-2 py-1 text-white font-mono text-xs w-24 text-center"
                        />
                      </div>
                    )}
                    {reviewTimings.last_screen_time && (
                      <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-300 flex items-center gap-1">
                          <Smartphone size={12} className="text-indigo-400" /> Last Screen:
                        </span>
                        <input
                          type="time"
                          value={reviewTimings.last_screen_time}
                          onChange={(e) => setReviewTimings((prev: any) => ({ ...prev, last_screen_time: e.target.value }))}
                          className="bg-black/80 border border-white/20 rounded px-2 py-1 text-white font-mono text-xs w-24 text-center"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Hotkeys Increments */}
              {(reviewHotkeys.water_oz || reviewHotkeys.sunlight_minutes || reviewHotkeys.coffee_cups || reviewHotkeys.meal_calories) && (
                <div className="space-y-1.5 pt-1 border-t border-slate-800">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Flame size={12} className="text-sky-400" /> Hotkey Additions:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {reviewHotkeys.water_oz !== undefined && (
                      <div className="bg-sky-950/30 border border-sky-500/30 p-2 rounded-xl flex flex-col items-center">
                        <span className="text-[10px] text-sky-300 font-bold">💧 Water</span>
                        <span className="text-xs font-mono font-bold text-white my-0.5">+{reviewHotkeys.water_oz} oz</span>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setReviewHotkeys((p: any) => ({ ...p, water_oz: Math.max(0, (p.water_oz || 0) - 8) }))} className="text-[9px] px-1 bg-white/10 rounded">-8</button>
                          <button type="button" onClick={() => setReviewHotkeys((p: any) => ({ ...p, water_oz: (p.water_oz || 0) + 8 }))} className="text-[9px] px-1 bg-white/10 rounded">+8</button>
                        </div>
                      </div>
                    )}
                    {reviewHotkeys.sunlight_minutes !== undefined && (
                      <div className="bg-amber-950/30 border border-amber-500/30 p-2 rounded-xl flex flex-col items-center">
                        <span className="text-[10px] text-amber-300 font-bold">☀️ Sun</span>
                        <span className="text-xs font-mono font-bold text-white my-0.5">+{reviewHotkeys.sunlight_minutes}m</span>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setReviewHotkeys((p: any) => ({ ...p, sunlight_minutes: Math.max(0, (p.sunlight_minutes || 0) - 5) }))} className="text-[9px] px-1 bg-white/10 rounded">-5</button>
                          <button type="button" onClick={() => setReviewHotkeys((p: any) => ({ ...p, sunlight_minutes: (p.sunlight_minutes || 0) + 5 }))} className="text-[9px] px-1 bg-white/10 rounded">+5</button>
                        </div>
                      </div>
                    )}
                    {reviewHotkeys.coffee_cups !== undefined && (
                      <div className="bg-amber-950/30 border border-amber-600/30 p-2 rounded-xl flex flex-col items-center">
                        <span className="text-[10px] text-amber-400 font-bold">☕ Coffee</span>
                        <span className="text-xs font-mono font-bold text-white my-0.5">+{reviewHotkeys.coffee_cups} cups</span>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setReviewHotkeys((p: any) => ({ ...p, coffee_cups: Math.max(0, (p.coffee_cups || 0) - 1) }))} className="text-[9px] px-1 bg-white/10 rounded">-1</button>
                          <button type="button" onClick={() => setReviewHotkeys((p: any) => ({ ...p, coffee_cups: (p.coffee_cups || 0) + 1 }))} className="text-[9px] px-1 bg-white/10 rounded">+1</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Scheduled Tasks Recognized */}
              {pendingReview.completed_modality_names && pendingReview.completed_modality_names.length > 0 && (
                <div className="bg-slate-900/90 border border-emerald-500/30 p-2.5 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    ✓ Tasks to Check Off:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {pendingReview.completed_modality_names.map((name: string, idx: number) => (
                      <span key={idx} className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Check size={11} /> {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isCommitting}
                  onClick={() => setPendingReview(null)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="button"
                  disabled={isCommitting}
                  onClick={handleConfirmAndLogAll}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 hover:from-purple-500 hover:to-sky-400 text-white flex items-center gap-1.5 shadow-lg shadow-purple-500/20 cursor-pointer active:scale-95 transition-all"
                >
                  <Check size={14} /> {isCommitting ? 'Logging...' : 'Confirm & Log All'}
                </button>
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
