'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Bookmark,
  ArrowRight,
  Zap,
  Activity,
  Check
} from 'lucide-react'
import { UserProfile, DailyProtocolTask } from '@/lib/types'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'

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
  const [response, setResponse] = useState<{
    advice: string
    suggestedAdditions?: string[]
    suggestedRemovals?: string[]
    synergyHighlight?: string | null
  } | null>(null)
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({})

  const quickPrompts = [
    { label: "Optimize Today's Stack", prompt: "How should I sequence and time today's protocol modalities for maximum synergy and recovery?" },
    { label: 'Break Fast Meal', prompt: 'What is the optimal meal composition to break my fast today without spiking glucose?' },
    { label: 'Deep Sleep Optimization', prompt: 'What specific timing adjustments can I make today to maximize NREM deep sleep tonight?' },
    { label: 'Biomarker Priorities', prompt: 'Based on my health profile and goals, which biomarkers should I prioritize optimizing next?' }
  ]

  const handleAsk = async (questionText?: string) => {
    const textToSend = questionText || query
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
    <div className="w-full bg-gradient-to-r from-slate-900 via-purple-950/25 to-slate-900 border border-purple-500/35 hover:border-purple-500/50 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-3 relative overflow-hidden transition-all duration-300">
      {/* Background ambient flare */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Banner Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
            <Sparkles size={14} className="text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-white tracking-wide uppercase">
                AI Longevity Coach
              </span>
              <span className="text-[10px] bg-purple-950/80 border border-purple-800/60 text-purple-300 px-2 py-0.5 rounded-full font-mono font-bold">
                Context-Aware
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Ask about today&apos;s routine, biomarker optimization, fasting window, or stack synergies.
            </p>
          </div>
        </div>

        {/* View Full Coach Link */}
        <button
          type="button"
          onClick={() => router.push('/coach')}
          className="text-xs font-bold text-purple-300 hover:text-white bg-purple-950/50 hover:bg-purple-900/60 border border-purple-700/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
        >
          <span>Open Full Coach</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Full-Width Search Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleAsk()
        }}
        className="relative flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask your AI Longevity Coach about today's routine, biological age, fasting, or biomarkers..."
            className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 rounded-xl sm:rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition-all pr-12 shadow-inner"
          />
          {isLoading ? (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-400">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : (
            <button
              type="submit"
              disabled={!query.trim()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:hover:bg-purple-600 text-white transition-all cursor-pointer disabled:cursor-not-allowed shadow-md shadow-purple-900/30"
              title="Ask AI Longevity Coach"
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </form>

      {/* Quick Prompt Pills */}
      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden md:inline">
          Quick Questions:
        </span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setQuery(qp.prompt)
              handleAsk(qp.prompt)
            }}
            disabled={isLoading}
            className="text-[11px] font-medium px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-500/40 text-purple-300 hover:text-purple-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            ⚡ {qp.label}
          </button>
        ))}
      </div>

      {/* Inline AI Response Card */}
      {response && isExpanded && (
        <div className="pt-3 border-t border-purple-500/20 space-y-3 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-purple-400">
              <Zap size={13} /> Coach Biological Assessment
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close answer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="bg-slate-950/90 border border-purple-500/30 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3 shadow-inner">
            <div className="whitespace-pre-line text-slate-300 text-xs sm:text-sm">
              {response.advice}
            </div>

            {response.synergyHighlight && (
              <div className="p-3 rounded-xl bg-purple-950/50 border border-purple-700/50 text-xs text-purple-200 flex items-start gap-2">
                <Sparkles size={14} className="text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-purple-300">Actionable Synergy:</strong> {response.synergyHighlight}
                </div>
              </div>
            )}

            {/* Suggested Modalities to Add */}
            {response.suggestedAdditions && response.suggestedAdditions.length > 0 && onAddToToday && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
                          // Format slug or search
                          const slug = modalityName.toLowerCase().replace(/[^a-z0-9]+/g, '_')
                          await onAddToToday(slug)
                          setAddedItems(prev => ({ ...prev, [modalityName]: true }))
                        }}
                        disabled={isAdded}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/50 text-purple-200 hover:text-white'
                        }`}
                      >
                        {isAdded ? <Check size={13} /> : <Plus size={13} />}
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
