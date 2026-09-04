'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Send,
  Loader2,
  X,
  Plus,
  ArrowRight,
  Zap,
  Check,
  Sliders,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react'
import { UserProfile, DailyProtocolTask } from '@/lib/types'
import ModalityInitiationCard from './ModalityInitiationCard'

export const LONGEVITY_COACH_PROMPTS = [
  "How should I sequence today's protocol stack for maximum absorption?",
  "What is the optimal meal composition to break my fast today?",
  "What timing adjustments will maximize my deep sleep tonight?",
  "Which biomarkers should I prioritize on my next blood test?",
  "When is the optimal time for cold plunge vs sauna today?",
  "Are there any absorption conflicts in my morning supplement stack?",
  "How can I improve my HRV and recovery based on recent check-ins?",
  "What is the optimal weekly Zone 2 cardio volume for my profile?",
  "How do I safely titrate Fisetin and Quercetin senolytic dosing?",
  "What foods will help me hit my 30+ weekly plant diversity goal?",
  "How can I lower my biological age score and PhenoAge gap?",
  "What is my latest caffeine cutoff time for optimal sleep architecture?",
  "How does Glycine + NAC (GlyNAC) support cellular glutathione pools?",
  "When should I take Creatine and electrolytes around workouts?",
  "What protocol is most effective for lowering elevated ApoB?",
  "How do I adapt Bryan Johnson's Blueprint stack to my daily routine?",
  "What should I do today if my morning energy or mood is low?",
  "How do I optimize post-meal walking to blunt glucose spikes?",
  "What is the optimal morning sunlight viewing window to set circadian rhythm?",
  "How can I safely combine NAD+ boosters with Sirtuin activators?"
]

export interface CoachMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  suggestedAdditions?: string[]
  suggestedRemovals?: string[]
  synergyHighlight?: string | null
  suggestedDose?: string | null
  suggestedTiming?: string | null
  suggestedDays?: string[] | null
  suggestedScheduleMode?: 'days_of_week' | 'rest_interval' | null
  suggestedRestIntervalDays?: number | null
  suggestedModalityDraft?: any
  timestamp: number
}

interface LongevityCoachInputBarProps {
  userProfile?: UserProfile | null
  todayTasks?: DailyProtocolTask[]
  onAddToToday?: (nameOrId: string) => Promise<any>
  onOpenModalityStudio?: (name: string, aiSuggestions?: any) => void
  currentTipHeadline?: string
  onScrollToModality?: (nameOrId: string) => void
}

export const LongevityCoachInputBar: React.FC<LongevityCoachInputBarProps> = ({
  userProfile,
  todayTasks = [],
  onAddToToday,
  onOpenModalityStudio,
  currentTipHeadline,
  onScrollToModality
}) => {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState<number>(0)
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({})
  const [isAddingModality, setIsAddingModality] = useState<Record<string, boolean>>({})
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const threadContainerRef = useRef<HTMLDivElement | null>(null)

  // Load thread from sessionStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('levl_today_coach_thread')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed)
            setIsExpanded(true)
          }
        }
      } catch (e) {}
    }
  }, [])

  // Persist thread updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (messages.length > 0) {
          sessionStorage.setItem('levl_today_coach_thread', JSON.stringify(messages))
        } else {
          sessionStorage.removeItem('levl_today_coach_thread')
        }
      } catch (e) {}
    }
  }, [messages])

  // On initial mount / reload, pick a random prompt from the 20 curated examples and rotate every 8 seconds
  useEffect(() => {
    const initialRandom = Math.floor(Math.random() * LONGEVITY_COACH_PROMPTS.length)
    setPlaceholderIndex(initialRandom)

    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % LONGEVITY_COACH_PROMPTS.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  // Auto-scroll to bottom of conversation thread when new message arrives
  useEffect(() => {
    if (isExpanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading, isExpanded])

  const currentPlaceholder = LONGEVITY_COACH_PROMPTS[placeholderIndex]

  const handleJumpToModality = (name: string) => {
    if (onScrollToModality) {
      onScrollToModality(name)
      return
    }

    if (typeof window === 'undefined') return
    const clean = name.toLowerCase().trim()
    const target = document.querySelector(`[data-modality-name*="${clean}"], [data-modality-id="${clean}"], [id*="${clean}"]`) as HTMLElement | null
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      target.classList.add('ring-4', 'ring-purple-500', 'shadow-[0_0_40px_rgba(168,85,247,0.9)]', 'scale-[1.02]', 'transition-all', 'duration-500')
      setTimeout(() => {
        target.classList.remove('ring-4', 'ring-purple-500', 'shadow-[0_0_40px_rgba(168,85,247,0.9)]', 'scale-[1.02]')
      }, 3500)
    }
  }

  const handleAddAndJump = async (modalityName: string) => {
    if (!onAddToToday) return
    setIsAddingModality(prev => ({ ...prev, [modalityName]: true }))

    try {
      await onAddToToday(modalityName)
      setAddedItems(prev => ({ ...prev, [modalityName]: true }))

      // Smoothly jump directly to the newly rendered task card in Today feed
      setTimeout(() => {
        handleJumpToModality(modalityName)
      }, 150)
    } catch (err) {
      console.error('Error adding modality to today:', err)
    } finally {
      setIsAddingModality(prev => ({ ...prev, [modalityName]: false }))
    }
  }

  const handleAsk = async (questionText?: string) => {
    const textToSend = questionText || query || currentPlaceholder
    if (!textToSend.trim() || isLoading) return

    const userMsg: CoachMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: Date.now()
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setQuery('')
    setIsLoading(true)
    setIsExpanded(true)

    const activeModalityNames = todayTasks.map(t => {
      const m = (t as any).modality || t.protocol_step?.modality || (t as any).loose_modality
      return m?.name || 'Protocol Task'
    })

    try {
      const res = await fetch('/api/protocol-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocolName: "Today's Active Longevity Stack",
          activeModalities: activeModalityNames,
          userProfile: userProfile || null,
          userQuestion: currentTipHeadline && updatedMessages.length === 1
            ? `Context: Today's Longevity Tip is "${currentTipHeadline}". Question: ${textToSend}`
            : textToSend,
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
        })
      })

      if (!res.ok) throw new Error('AI Coach request failed')
      const data = await res.json()

      const coachMsg: CoachMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: data.advice || 'Protocol stack analyzed.',
        suggestedAdditions: data.suggestedAdditions || [],
        suggestedRemovals: data.suggestedRemovals || [],
        synergyHighlight: data.synergyHighlight || null,
        suggestedDose: data.suggestedDose || null,
        suggestedTiming: data.suggestedTiming || null,
        suggestedDays: data.suggestedDays || null,
        suggestedScheduleMode: data.suggestedScheduleMode || null,
        suggestedRestIntervalDays: data.suggestedRestIntervalDays || null,
        suggestedModalityDraft: data.suggestedModalityDraft || null,
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, coachMsg])
    } catch (err) {
      console.error('Longevity Coach error:', err)
      const errorMsg: CoachMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: 'Unable to connect to the AI Longevity Coach right now. Please check your connection and try again.',
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearThread = () => {
    setMessages([])
    setIsExpanded(false)
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('levl_today_coach_thread')
      } catch (e) {}
    }
  }

  return (
    <div className="w-full space-y-2">
      {/* Header Text Above Input */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-purple-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
            AI Longevity Coach
          </span>
          {messages.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/30 text-purple-200 font-medium">
              {messages.length} messages
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearThread}
              className="text-[11px] font-medium text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
              title="Start a new conversation thread"
            >
              <RotateCcw size={10} />
              <span>New Thread</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push('/coach')}
            className="text-[11px] font-medium text-slate-400 hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Open Coach Hub</span>
            <ArrowRight size={11} />
          </button>
        </div>
      </div>

      {/* Primary Input Bar (When thread is not expanded or empty) */}
      {(!isExpanded || messages.length === 0) && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAsk()
          }}
          className="relative flex items-center w-full"
        >
          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Ask: "${currentPlaceholder}"`}
              className="w-full bg-slate-900/90 hover:bg-slate-900 border border-purple-500/30 hover:border-purple-500/50 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition-all pr-11 shadow-lg backdrop-blur-md"
            />
            {isLoading ? (
              <div className="absolute right-3.5 text-purple-400">
                <Loader2 size={16} className="animate-spin" />
              </div>
            ) : (
              <button
                type="submit"
                className="absolute right-2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer shadow-md shadow-purple-900/30 active:scale-95"
                title="Ask AI Longevity Coach"
              >
                <Send size={13} />
              </button>
            )}
          </div>
        </form>
      )}

      {/* Collapsed Thread Banner (if user minimized an active thread) */}
      {!isExpanded && messages.length > 0 && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-purple-500/40 shadow-md">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 text-xs text-purple-200 hover:text-white transition-colors cursor-pointer font-medium"
          >
            <MessageSquare size={13} className="text-purple-400" />
            <span>Active conversation thread ({messages.length} messages) • Click to resume</span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>
          <button
            type="button"
            onClick={handleClearThread}
            className="text-[10px] text-slate-400 hover:text-rose-400 px-2 py-1 rounded bg-slate-800/80 cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Interactive Multi-Turn Conversation Thread Container */}
      {isExpanded && messages.length > 0 && (
        <div className="pt-1 space-y-2 animate-in fade-in slide-in-from-top-2">
          {/* Thread Header Controls */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-purple-400 text-[10px]">
              <Zap size={12} /> Longevity Coaching Thread
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearThread}
                className="text-[10px] text-slate-400 hover:text-rose-300 transition-colors cursor-pointer flex items-center gap-1"
                title="Clear and start new conversation"
              >
                <RotateCcw size={10} />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                title="Minimize thread"
              >
                <ChevronUp size={13} />
                <span>Minimize</span>
              </button>
            </div>
          </div>

          {/* Conversation Messages Box */}
          <div 
            ref={threadContainerRef}
            className="bg-slate-950/95 border border-purple-500/30 rounded-2xl p-3 sm:p-4 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3 shadow-xl backdrop-blur-md max-h-[520px] overflow-y-auto"
          >
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user'

              if (isUser) {
                return (
                  <div key={msg.id || index} className="flex justify-end pt-1">
                    <div className="max-w-[90%] sm:max-w-[80%] rounded-2xl rounded-tr-xs bg-purple-950/80 border border-purple-500/40 px-3.5 py-2 text-xs sm:text-sm text-purple-100 shadow-md">
                      <div className="font-semibold text-[10px] text-purple-300 uppercase tracking-wider mb-0.5">
                        You
                      </div>
                      <div className="whitespace-pre-line leading-relaxed">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )
              }

              // Coach Message Bubble
              return (
                <div key={msg.id || index} className="flex flex-col gap-2 pt-1 border-t border-slate-900/80 first:border-0 first:pt-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                    <Sparkles size={11} />
                    <span>Longevity Coach</span>
                  </div>

                  <div className="whitespace-pre-line text-slate-300 text-xs sm:text-sm leading-relaxed pl-1">
                    {msg.content}
                  </div>

                  {msg.synergyHighlight && (
                    <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-700/50 text-xs text-purple-200 flex items-start gap-2 shadow-inner">
                      <Sparkles size={13} className="text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-purple-300">Actionable Synergy:</strong> {msg.synergyHighlight}
                      </div>
                    </div>
                  )}

                  {/* Detected Direct Navigation Action Links */}
                  {(msg.content.includes('/physiological-age') || msg.content.includes('/tracking') || msg.content.includes('/schedule') || msg.content.includes('/explore') || msg.content.includes('/bench') || msg.content.includes('/settings')) && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Quick Navigation:
                      </span>
                      {(msg.content.includes('/physiological-age') || msg.content.includes('/tracking')) && (
                        <button
                          type="button"
                          onClick={() => router.push('/physiological-age')}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-600/50 text-purple-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <span>🩸 Open Bloodwork &amp; BioAge</span>
                          <ArrowRight size={11} />
                        </button>
                      )}
                      {msg.content.includes('/schedule') && (
                        <button
                          type="button"
                          onClick={() => router.push('/schedule')}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-600/50 text-cyan-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <span>⏱️ Open Fasting &amp; Schedule Hub</span>
                          <ArrowRight size={11} />
                        </button>
                      )}
                      {msg.content.includes('/explore') && (
                        <button
                          type="button"
                          onClick={() => router.push('/explore')}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-teal-950/60 hover:bg-teal-900/80 border border-teal-600/50 text-teal-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <span>🔍 Open Explore Catalog</span>
                          <ArrowRight size={11} />
                        </button>
                      )}
                      {msg.content.includes('/bench') && (
                        <button
                          type="button"
                          onClick={() => router.push('/bench')}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/50 text-amber-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <span>🏋️ Open Bench Backlog</span>
                          <ArrowRight size={11} />
                        </button>
                      )}
                      {msg.content.includes('/settings') && (
                        <button
                          type="button"
                          onClick={() => router.push('/settings')}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <span>⚙️ Open Settings &amp; Profile</span>
                          <ArrowRight size={11} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Suggested Modality Draft Initiation Card */}
                  {msg.suggestedModalityDraft && (
                    <div className="pt-2">
                      <ModalityInitiationCard
                        modality={msg.suggestedModalityDraft}
                        initialData={{
                          name: msg.suggestedModalityDraft.name,
                          category: msg.suggestedModalityDraft.category,
                          headlineBenefit: msg.suggestedModalityDraft.headline_benefit,
                          briefDescription: msg.suggestedModalityDraft.brief_description,
                          instructions: msg.suggestedModalityDraft.instructions,
                          doseAmount: msg.suggestedModalityDraft.dose_amount,
                          doseUnit: msg.suggestedModalityDraft.dose_unit,
                          doseOptions: msg.suggestedModalityDraft.dose_options,
                          timingSlot: msg.suggestedModalityDraft.timing_slot,
                          cadenceMode: msg.suggestedModalityDraft.cadence_mode,
                          selectedDays: msg.suggestedModalityDraft.selected_days,
                          restIntervalDays: msg.suggestedModalityDraft.rest_interval_days,
                          scheduleToToday: true,
                          saveToBench: true
                        }}
                        onInitiateSuccess={(mod) => {
                          if (mod?.name) {
                            setAddedItems(prev => ({ ...prev, [mod.name]: true }))
                          }
                        }}
                        onOpenStudio={(data) => {
                          if (onOpenModalityStudio) {
                            onOpenModalityStudio(data.name || '', {
                              suggestedDose: data.doseAmount,
                              suggestedTiming: data.timingSlot
                            })
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Suggested Modalities to Add to Today Feed */}
                  {msg.suggestedAdditions && msg.suggestedAdditions.length > 0 && onAddToToday && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Suggested Modality Additions:
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {msg.suggestedAdditions.map((modalityName, idx) => {
                          const isAdded = addedItems[modalityName]
                          const isAdding = isAddingModality[modalityName]

                          return (
                            <div key={idx} className="inline-flex items-center rounded-xl bg-slate-900 border border-purple-500/40 p-0.5 shadow-sm">
                              {/* Add to Today / Added to Today Clickable Trigger */}
                              <button
                                type="button"
                                onClick={async () => {
                                  if (isAdded) {
                                    // Clicking "Added to Today" smoothly scrolls directly to the card in feed
                                    handleJumpToModality(modalityName)
                                  } else {
                                    await handleAddAndJump(modalityName)
                                  }
                                }}
                                disabled={isAdding}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                                  isAdded
                                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                                    : 'hover:bg-purple-600/30 text-purple-200 hover:text-white'
                                }`}
                                title={isAdded ? `Jump to ${modalityName} in your Today feed` : `Add ${modalityName} to your routine`}
                              >
                                {isAdding ? (
                                  <>
                                    <Loader2 size={12} className="animate-spin text-purple-300" />
                                    <span>Adding...</span>
                                  </>
                                ) : isAdded ? (
                                  <>
                                    <Check size={12} className="text-emerald-400" />
                                    <span>Added to Today • Jump to Card</span>
                                    <span className="text-emerald-300">🎯</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus size={12} />
                                    <span>Add {modalityName} to Today</span>
                                  </>
                                )}
                              </button>

                              {/* Dial In Dosage & Cadence Modal Trigger */}
                              {onOpenModalityStudio && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onOpenModalityStudio(modalityName, {
                                      suggestedDose: msg.suggestedDose,
                                      suggestedTiming: msg.suggestedTiming,
                                      suggestedDays: msg.suggestedDays,
                                      suggestedScheduleMode: msg.suggestedScheduleMode,
                                      suggestedRestIntervalDays: msg.suggestedRestIntervalDays
                                    })
                                  }}
                                  className="p-1.5 px-2 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-800 transition-colors border-l border-slate-800 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                                  title="Dial In Dosage & Cadence"
                                >
                                  <Sliders size={12} className="text-purple-400" />
                                  <span className="hidden sm:inline">Dial In</span>
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* In-Flight Analysis Spinner */}
            {isLoading && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-300 animate-pulse">
                <Sparkles size={14} className="animate-spin text-purple-400 shrink-0" />
                <span>AI Longevity Coach is analyzing your protocol stack and circadian timing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Follow-up Question Prompts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 px-1 scrollbar-none">
            <span className="text-[10px] font-semibold text-slate-500 shrink-0">Follow-up:</span>
            {[
              "What is the healthiest cadence?",
              "What should I eat before & after?",
              "Can I combine this with sauna?",
              "How will this impact my deep sleep?"
            ].map((promptText, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => handleAsk(promptText)}
                disabled={isLoading}
                className="text-[10px] font-medium px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-purple-500/20 hover:border-purple-500/40 text-purple-300 hover:text-white transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Follow-up Question Input Row inside expanded thread */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAsk()
            }}
            className="relative flex items-center w-full"
          >
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a follow-up question..."
                className="w-full bg-slate-900/90 hover:bg-slate-900 border border-purple-500/30 hover:border-purple-500/50 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition-all pr-11 shadow-lg backdrop-blur-md"
              />
              {isLoading ? (
                <div className="absolute right-3.5 text-purple-400">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              ) : (
                <button
                  type="submit"
                  className="absolute right-2 p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer shadow-md shadow-purple-900/30 active:scale-95"
                  title="Send follow-up"
                >
                  <Send size={13} />
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default LongevityCoachInputBar
