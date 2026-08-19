'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  Send,
  Loader2,
  Check,
  Zap,
  Clock,
  Scale,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { UserProfile } from '@/lib/types'

interface ModalityAICoachBarProps {
  modalityName: string
  modalityDetails?: {
    name?: string
    category?: string
    headline_benefit?: string
    biological_mechanism?: string
    literature_min?: number
    literature_max?: number
    dose_unit?: string
    default_timing?: string
  }
  protocolName?: string
  currentDose?: string | number
  currentTiming?: string
  userProfile?: UserProfile | null
  activeStackNames?: string[]
  onApplyDose?: (dose: string) => void
  onApplyTiming?: (timing: string) => void
  onAppendNotes?: (notes: string) => void
}

export const ModalityAICoachBar: React.FC<ModalityAICoachBarProps> = ({
  modalityName,
  modalityDetails,
  protocolName,
  currentDose,
  currentTiming,
  userProfile,
  activeStackNames = [],
  onApplyDose,
  onApplyTiming,
  onAppendNotes
}) => {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<{
    advice: string
    suggestedDose?: string | null
    suggestedTiming?: string | null
    suggestedCadence?: string | null
    suggestedAdditions?: string[]
    suggestedRemovals?: string[]
    synergyHighlight?: string | null
  } | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [appliedDose, setAppliedDose] = useState(false)
  const [appliedTiming, setAppliedTiming] = useState(false)
  const [appliedNotes, setAppliedNotes] = useState(false)

  const quickPrompts = [
    { label: 'Circadian Timing', prompt: `What is the ideal circadian timing window for ${modalityName} given my active stack?` },
    { label: 'Stack Synergy', prompt: `Are there any synergistic combinations or timing clashes between ${modalityName} and my other protocols?` },
    { label: 'Personalized Dosing', prompt: `Based on my profile and clinical studies, what is the optimal dose range for ${modalityName}?` },
    { label: 'Empty Stomach / Food', prompt: `Should ${modalityName} be taken with dietary fats, fasting, or with food for maximum bioavailability?` }
  ]

  const handleAsk = async (questionText?: string) => {
    const textToSend = questionText || query
    if (!textToSend.trim() || isLoading) return

    setIsLoading(true)
    setIsExpanded(true)
    setAppliedDose(false)
    setAppliedTiming(false)
    setAppliedNotes(false)

    try {
      const res = await fetch('/api/protocol-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modalityName,
          modalityDetails,
          protocolName,
          currentDose,
          currentTiming,
          userProfile,
          activeModalities: activeStackNames,
          userQuestion: textToSend
        })
      })

      if (!res.ok) throw new Error('AI Coach response failed')
      const data = await res.json()
      setResponse(data)
      if (!questionText) setQuery('')
    } catch (err) {
      console.error('Modality AI Coach error:', err)
      setResponse({
        advice: 'Unable to consult the AI Longevity Coach right now. Please check your internet connection and try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full bg-gradient-to-br from-purple-950/40 via-slate-900/90 to-cyan-950/30 border border-purple-500/30 hover:border-purple-500/50 rounded-2xl p-4 shadow-xl transition-all space-y-3">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.25)]">
            <Sparkles size={13} className="text-purple-400" />
          </div>
          <span className="text-xs font-black text-white uppercase tracking-wider">
            AI Protocol &amp; Synergy Coach
          </span>
          <span className="text-[10px] bg-purple-950/80 border border-purple-800/60 text-purple-300 px-2 py-0.5 rounded-full font-mono font-bold hidden sm:inline-block">
            Personalized to Your Profile
          </span>
        </div>

        {response && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{isExpanded ? 'Collapse' : 'Show Answer'}</span>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>

      {/* Input Field with Search Icon & Submit */}
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
            placeholder={`Ask AI Coach about ${modalityName} dosing, timing, stack synergy, or fasting compatibility...`}
            className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition-all pr-10 shadow-inner"
          />
          {isLoading ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400">
              <Loader2 size={16} className="animate-spin" />
            </div>
          ) : (
            <button
              type="submit"
              disabled={!query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white transition-all cursor-pointer disabled:cursor-not-allowed"
              title="Ask AI Coach"
            >
              <Send size={13} />
            </button>
          )}
        </div>
      </form>

      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
          Quick Ask:
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
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-500/40 text-purple-300 hover:text-purple-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            ⚡ {qp.label}
          </button>
        ))}
      </div>

      {/* AI Coach Response Display */}
      {response && isExpanded && (
        <div className="pt-2 border-t border-purple-500/20 space-y-3 animate-in fade-in slide-in-from-top-2">
          {/* Advice Text */}
          <div className="bg-slate-950/85 border border-purple-500/30 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-2 shadow-inner">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Zap size={13} />
              <span>Evidence-Based Biological Assessment</span>
            </div>
            <div className="whitespace-pre-line text-slate-300 text-xs sm:text-sm">
              {response.advice}
            </div>

            {response.synergyHighlight && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-purple-950/40 border border-purple-800/50 text-[11px] text-purple-200 flex items-start gap-2">
                <Sparkles size={14} className="text-purple-400 shrink-0 mt-0.5" />
                <span><strong>Key Synergy Highlight:</strong> {response.synergyHighlight}</span>
              </div>
            )}
          </div>

          {/* Action Chips for Recommended Dosing / Timing */}
          {(response.suggestedDose || response.suggestedTiming || response.advice) && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                One-Click Actions:
              </span>

              {response.suggestedDose && onApplyDose && (
                <button
                  type="button"
                  onClick={() => {
                    if (response.suggestedDose) {
                      onApplyDose(response.suggestedDose)
                      setAppliedDose(true)
                    }
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                    appliedDose
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/40 text-teal-300 hover:text-white'
                  }`}
                >
                  {appliedDose ? <Check size={13} /> : <Scale size={13} />}
                  <span>{appliedDose ? 'Applied' : 'Apply Recommended Dose'}: {response.suggestedDose}</span>
                </button>
              )}

              {response.suggestedTiming && onApplyTiming && (
                <button
                  type="button"
                  onClick={() => {
                    if (response.suggestedTiming) {
                      onApplyTiming(response.suggestedTiming)
                      setAppliedTiming(true)
                    }
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                    appliedTiming
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:text-white'
                  }`}
                >
                  {appliedTiming ? <Check size={13} /> : <Clock size={13} />}
                  <span>{appliedTiming ? 'Applied' : 'Set Timing Window'}: {response.suggestedTiming}</span>
                </button>
              )}

              {onAppendNotes && (
                <button
                  type="button"
                  onClick={() => {
                    const snippet = `[AI Coach Synergy Note]: ${response.synergyHighlight || response.advice.slice(0, 140) + '...'}`
                    onAppendNotes(snippet)
                    setAppliedNotes(true)
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                    appliedNotes
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/40 text-purple-300 hover:text-white'
                  }`}
                >
                  {appliedNotes ? <Check size={13} /> : <Sparkles size={13} />}
                  <span>{appliedNotes ? 'Appended to Notes' : 'Append to Personal Notes'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ModalityAICoachBar
