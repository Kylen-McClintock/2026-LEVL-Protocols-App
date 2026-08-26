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
  RefreshCw,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { UserProfile } from '@/lib/types'

// Helper to format timing_slot strings "morning_supplement_stack" -> "Morning Supplement Stack"
const formatSlotName = (str: string) => {
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

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
  onApplyMultiDose?: (dosesPerDay: number, slot1?: string, slot2?: string, slot3?: string) => void
  onApplyCadence?: (
    mode: 'days_of_week' | 'rest_interval',
    days?: string[],
    restDays?: number,
    strategy?: 'roll_forward' | 'strict_fixed' | 'cascade_shift'
  ) => void
  onAppendNotes?: (notes: string) => void
}

interface AICoachResponse {
  advice: string
  suggestedDose?: string | null
  suggestedTiming?: string | null
  suggestedDosesPerDay?: number | null
  suggestedTimingSlots?: string[] | null
  suggestedScheduleMode?: 'days_of_week' | 'rest_interval' | null
  suggestedDays?: string[] | null
  suggestedRestIntervalDays?: number | null
  suggestedAdaptationStrategy?: 'roll_forward' | 'strict_fixed' | 'cascade_shift' | null
  suggestedNotes?: string | null
  suggestedAdditions?: string[]
  suggestedRemovals?: string[]
  synergyHighlight?: string | null
  scientificPushback?: boolean
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
  onApplyMultiDose,
  onApplyCadence,
  onAppendNotes
}) => {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<AICoachResponse | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [appliedDose, setAppliedDose] = useState(false)
  const [appliedTiming, setAppliedTiming] = useState(false)
  const [appliedMultiDose, setAppliedMultiDose] = useState(false)
  const [appliedCadence, setAppliedCadence] = useState(false)
  const [appliedNotes, setAppliedNotes] = useState(false)

  const quickPrompts = [
    { label: 'Circadian Timing', prompt: `What is the ideal circadian timing window for ${modalityName} given my active stack?` },
    { label: 'Split Doses (AM/PM)', prompt: `Can I split ${modalityName} into 2x daily or 3x daily doses across morning and evening?` },
    { label: 'Optimal Cadence & Rest', prompt: `What is the best weekly rest cadence and adaptation schedule for ${modalityName}?` },
    { label: 'Personalized Dosing', prompt: `Based on my biological profile and clinical literature, what target dose should I take for ${modalityName}?` },
    { label: 'Stack Synergy & Bioavailability', prompt: `Should ${modalityName} be taken with dietary fats, fasting, or with food for maximum bioavailability?` }
  ]

  const handleAsk = async (questionText?: string) => {
    const textToSend = questionText || query
    if (!textToSend.trim() || isLoading) return

    setIsLoading(true)
    setIsExpanded(true)
    setAppliedDose(false)
    setAppliedTiming(false)
    setAppliedMultiDose(false)
    setAppliedCadence(false)
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
            placeholder={`Ask AI Coach to adjust dosing, split morning/evening times, optimize rest days, or evaluate synergy...`}
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
          
          {/* Scientific Pushback Warning Banner (if user asked for contra-indicated or unscientific configuration) */}
          {response.scientificPushback && (
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-2.5 shadow-lg">
              <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="text-amber-300 block font-bold text-[11px] uppercase tracking-wide">
                  Scientific Safety &amp; Efficacy Advisory
                </strong>
                <p className="opacity-95 text-[11px] leading-relaxed">
                  The AI Coach detected a potential circadian clash, un-titrated dosing risk, or physiological contradiction. Evidence-aligned alternative adjustments are provided below.
                </p>
              </div>
            </div>
          )}

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

          {/* Action Chips for Recommended Dosing / Multi-Dose / Timing / Cadence */}
          {(response.suggestedDose || response.suggestedTiming || response.suggestedDosesPerDay || response.suggestedScheduleMode || response.suggestedNotes || response.synergyHighlight) && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                One-Click Actions:
              </span>

              {/* 1. Apply Dose */}
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
                  <span>{appliedDose ? 'Applied Dose' : 'Apply Dose'}: {response.suggestedDose}</span>
                </button>
              )}

              {/* 2. Split Multi-Dose Times of Day */}
              {response.suggestedDosesPerDay && response.suggestedDosesPerDay > 1 && onApplyMultiDose && (
                <button
                  type="button"
                  onClick={() => {
                    const slots = response.suggestedTimingSlots || []
                    onApplyMultiDose(response.suggestedDosesPerDay!, slots[0], slots[1], slots[2])
                    setAppliedMultiDose(true)
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                    appliedMultiDose
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/40 text-purple-300 hover:text-white'
                  }`}
                >
                  {appliedMultiDose ? <Check size={13} /> : <Zap size={13} />}
                  <span>
                    {appliedMultiDose ? 'Applied Split' : `Split into ${response.suggestedDosesPerDay}x Daily`}
                    {response.suggestedTimingSlots?.length ? ` (${response.suggestedTimingSlots.map(formatSlotName).join(' & ')})` : ''}
                  </span>
                </button>
              )}

              {/* 3. Set Single Circadian Timing Window */}
              {response.suggestedTiming && (!response.suggestedDosesPerDay || response.suggestedDosesPerDay === 1) && onApplyTiming && (
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
                  <span>{appliedTiming ? 'Applied Timing' : 'Set Timing'}: {formatSlotName(response.suggestedTiming)}</span>
                </button>
              )}

              {/* 4. Set Rest Cadence & Schedule */}
              {response.suggestedScheduleMode && onApplyCadence && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyCadence(
                      response.suggestedScheduleMode!,
                      response.suggestedDays || undefined,
                      response.suggestedRestIntervalDays ?? undefined,
                      response.suggestedAdaptationStrategy || undefined
                    )
                    setAppliedCadence(true)
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                    appliedCadence
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/40 text-blue-300 hover:text-white'
                  }`}
                >
                  {appliedCadence ? <Check size={13} /> : <RefreshCw size={13} />}
                  <span>
                    {appliedCadence ? 'Applied Schedule' : 'Set Schedule'}: {
                      response.suggestedScheduleMode === 'days_of_week' && response.suggestedDays?.length
                        ? `${response.suggestedDays.join(', ')}`
                        : response.suggestedRestIntervalDays !== null && response.suggestedRestIntervalDays !== undefined
                          ? `Every ${(response.suggestedRestIntervalDays || 0) + 1} Days (${response.suggestedRestIntervalDays}d rest)`
                          : 'Optimized Cadence'
                    }
                  </span>
                </button>
              )}

              {/* 5. Append to Notes */}
              {onAppendNotes && (
                <button
                  type="button"
                  onClick={() => {
                    const snippet = response.suggestedNotes || `[AI Synergy Note]: ${response.synergyHighlight || response.advice.slice(0, 140) + '...'}`
                    onAppendNotes(snippet)
                    setAppliedNotes(true)
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                    appliedNotes
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/40 text-indigo-300 hover:text-white'
                  }`}
                >
                  {appliedNotes ? <Check size={13} /> : <FileText size={13} />}
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
