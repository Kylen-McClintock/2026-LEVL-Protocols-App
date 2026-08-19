'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Send,
  Loader2,
  X,
  Plus,
  ArrowRight,
  Zap,
  Check
} from 'lucide-react'
import { UserProfile, DailyProtocolTask } from '@/lib/types'

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

interface LongevityCoachInputBarProps {
  userProfile?: UserProfile | null
  todayTasks?: DailyProtocolTask[]
  onAddToToday?: (modalityId: string) => Promise<void>
  currentTipHeadline?: string
}

export const LongevityCoachInputBar: React.FC<LongevityCoachInputBarProps> = ({
  userProfile,
  todayTasks = [],
  onAddToToday,
  currentTipHeadline
}) => {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState<number>(0)
  const [response, setResponse] = useState<{
    advice: string
    suggestedAdditions?: string[]
    suggestedRemovals?: string[]
    synergyHighlight?: string | null
  } | null>(null)
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({})

  // On initial mount / reload, pick a random prompt from the 20 curated examples and rotate every 8 seconds
  useEffect(() => {
    const initialRandom = Math.floor(Math.random() * LONGEVITY_COACH_PROMPTS.length)
    setPlaceholderIndex(initialRandom)

    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % LONGEVITY_COACH_PROMPTS.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  const currentPlaceholder = LONGEVITY_COACH_PROMPTS[placeholderIndex]

  const handleAsk = async (questionText?: string) => {
    const textToSend = questionText || query || currentPlaceholder
    if (!textToSend.trim() || isLoading) return

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
          userQuestion: currentTipHeadline 
            ? `Context: Today's Longevity Tip is "${currentTipHeadline}". Question: ${textToSend}`
            : textToSend
        })
      })

      if (!res.ok) throw new Error('AI Coach request failed')
      const data = await res.json()
      setResponse(data)
      if (!questionText) setQuery('')
    } catch (err) {
      console.error('Longevity Coach error:', err)
      setResponse({
        advice: 'Unable to connect to the AI Longevity Coach right now. Please try again in a few moments.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-1.5">
      {/* Small Header Text Above Input */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-purple-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
            AI Longevity Coach
          </span>
        </div>
        <button
          type="button"
          onClick={() => router.push('/coach')}
          className="text-[11px] font-medium text-slate-400 hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>Open Coach</span>
          <ArrowRight size={11} />
        </button>
      </div>

      {/* Single-Line Full-Width Input Row */}
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

      {/* Inline AI Response Card (Appears when asked) */}
      {response && isExpanded && (
        <div className="pt-2 space-y-2 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-purple-400 text-[10px]">
              <Zap size={12} /> Coach Assessment
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close answer"
            >
              <X size={13} />
            </button>
          </div>

          <div className="bg-slate-950/95 border border-purple-500/30 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3 shadow-xl backdrop-blur-md">
            <div className="whitespace-pre-line text-slate-300 text-xs sm:text-sm leading-relaxed">
              {response.advice}
            </div>

            {response.synergyHighlight && (
              <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-700/50 text-xs text-purple-200 flex items-start gap-2">
                <Sparkles size={13} className="text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-purple-300">Actionable Synergy:</strong> {response.synergyHighlight}
                </div>
              </div>
            )}

            {/* Detected Direct Navigation Action Links */}
            {(response.advice.includes('/physiological-age') || response.advice.includes('/tracking') || response.advice.includes('/schedule') || response.advice.includes('/explore') || response.advice.includes('/bench') || response.advice.includes('/settings')) && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Navigation:
                </span>
                {(response.advice.includes('/physiological-age') || response.advice.includes('/tracking')) && (
                  <button
                    type="button"
                    onClick={() => router.push('/physiological-age')}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-600/50 text-purple-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <span>🩸 Open Bloodwork &amp; BioAge</span>
                    <ArrowRight size={11} />
                  </button>
                )}
                {response.advice.includes('/schedule') && (
                  <button
                    type="button"
                    onClick={() => router.push('/schedule')}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-600/50 text-cyan-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <span>⏱️ Open Fasting &amp; Schedule Hub</span>
                    <ArrowRight size={11} />
                  </button>
                )}
                {response.advice.includes('/explore') && (
                  <button
                    type="button"
                    onClick={() => router.push('/explore')}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-teal-950/60 hover:bg-teal-900/80 border border-teal-600/50 text-teal-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <span>🔍 Open Explore Catalog</span>
                    <ArrowRight size={11} />
                  </button>
                )}
                {response.advice.includes('/bench') && (
                  <button
                    type="button"
                    onClick={() => router.push('/bench')}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/50 text-amber-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <span>🏋️ Open Bench Backlog</span>
                    <ArrowRight size={11} />
                  </button>
                )}
                {response.advice.includes('/settings') && (
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

            {/* Suggested Modalities to Add */}
            {response.suggestedAdditions && response.suggestedAdditions.length > 0 && onAddToToday && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Suggested Modality Additions:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {response.suggestedAdditions.map((modalityName, idx) => {
                    const isAdded = addedItems[modalityName]
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={async () => {
                          await onAddToToday(modalityName)
                          setAddedItems(prev => ({ ...prev, [modalityName]: true }))
                        }}
                        disabled={isAdded}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/50 text-purple-200 hover:text-white'
                        }`}
                      >
                        {isAdded ? <Check size={12} /> : <Plus size={12} />}
                        <span>{isAdded ? 'Added to Today' : `Add ${modalityName} to Today`}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LongevityCoachInputBar
