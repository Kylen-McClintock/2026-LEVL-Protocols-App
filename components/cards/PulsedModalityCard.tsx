'use client'

import React, { useState } from 'react'
import { Modality, UserProfile } from '@/lib/types'
import { 
  CalendarDays, Check, Plus, ChevronDown, ChevronUp, ExternalLink, 
  FileText, SlidersHorizontal, Info 
} from 'lucide-react'
import { logPulsedExecution } from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import GeekMode from '@/components/cards/GeekMode'
import { resolvePubMedCitation } from '@/lib/tracking/scientificCitations'

export interface PulsedItemContext {
  modality: Modality
  next_date: string
  last_date: string | null
  days_until: number
  is_due_today: boolean
  interval_days: number
}

export interface PulsedModalityCardProps {
  item: PulsedItemContext
  dateStr: string
  userProfile?: UserProfile | null
  onPulseLogged?: () => void
}

export const PulsedModalityCard: React.FC<PulsedModalityCardProps> = ({
  item,
  dateStr,
  userProfile,
  onPulseLogged
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showGeekMode, setShowGeekMode] = useState(false)
  const [isLogging, setIsLogging] = useState(false)

  const mod = item.modality
  const lastDateObj = item.last_date ? new Date(item.last_date + 'T00:00:00') : null
  
  // Dynamic completion evaluation
  const isCompletedToday = Boolean(
    item.last_date === dateStr || 
    (item.last_date && item.last_date <= dateStr && item.days_until > 0 && Math.round((new Date(dateStr + 'T00:00:00').getTime() - new Date(item.last_date + 'T00:00:00').getTime()) / 86400000) === 0)
  )

  const isDueToday = item.is_due_today && !isCompletedToday

  // Format human-readable cadence
  let cadenceLabel = `${item.interval_days}-Day Pulse`
  if (item.interval_days === 7) cadenceLabel = 'Weekly Pulse'
  else if (item.interval_days === 30) cadenceLabel = 'Monthly Pulse'
  else if (item.interval_days === 90) cadenceLabel = 'Quarterly Pulse'

  const handleLogPulse = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLogging) return

    setIsLogging(true)
    try {
      const localUserId = getLocalUserId()
      await logPulsedExecution(localUserId, dateStr, mod.id)
      if (onPulseLogged) onPulseLogged()
    } catch (err) {
      console.error('Error logging pulsed modality:', err)
    } finally {
      setIsLogging(false)
    }
  }

  const citation = resolvePubMedCitation(mod.id, mod.name)
  const pubmedUrl = (mod.efficacy_stats?.find((e: any) => e.source_url)?.source_url && mod.efficacy_stats?.find((e: any) => e.source_url)?.source_url !== 'https://pubmed.ncbi.nlm.nih.gov/')
    ? mod.efficacy_stats?.find((e: any) => e.source_url)?.source_url
    : (mod as any).relationships?.dosage_profile?.sourceUrl && (mod as any).relationships?.dosage_profile?.sourceUrl !== 'https://pubmed.ncbi.nlm.nih.gov/'
    ? (mod as any).relationships?.dosage_profile?.sourceUrl
    : citation.pubMedUrl

  const descriptionText = mod.brief_description || mod.instructions || (mod as any).relationships?.dosage_profile?.recommended_notes || 'Pulsed cadence longevity protocol'

  return (
    <div 
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        isDueToday
          ? 'bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-slate-950 border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
          : isCompletedToday
          ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
          : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* 2-Row Spacious Header Layout */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 cursor-pointer space-y-3 select-none"
      >
        {/* ROW 1: FULL-WIDTH TITLE */}
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className={`p-2 rounded-xl border shrink-0 ${
              isDueToday
                ? 'bg-purple-950 text-amber-300 border-purple-500/60 shadow-md animate-pulse'
                : isCompletedToday
                ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50'
                : 'bg-slate-950 text-purple-400 border-slate-800'
            }`}>
              <CalendarDays size={18} />
            </div>

            <h3 className="text-base font-extrabold text-white group-hover:text-purple-300 transition-colors tracking-wide leading-tight truncate">
              {mod.name || mod.display_name}
            </h3>
          </div>

          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition shrink-0 cursor-pointer"
          >
            {isExpanded ? <ChevronUp size={18} className="text-purple-400" /> : <ChevronDown size={18} />}
          </button>
        </div>

        {/* ROW 2: BADGES + STATUS & ACTION BUTTON */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
          {/* Left Badges & Target Dose */}
          <div className="flex items-center gap-2 flex-wrap text-xs flex-1 min-w-0">
            <span className="text-[10px] uppercase tracking-wider font-bold text-teal-300 bg-teal-950/90 border border-teal-800/80 px-2.5 py-0.5 rounded-md">
              {mod.category || 'Pulsed Protocol'}
            </span>
            <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950/90 border border-purple-800/80 px-2.5 py-0.5 rounded-md">
              {cadenceLabel}
            </span>
            {(mod.dose_or_exposure || descriptionText) && (
              <span className="text-xs text-slate-300 font-medium truncate max-w-full">
                • {mod.dose_or_exposure || descriptionText}
              </span>
            )}
          </div>

          {/* Right Status & Action */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <div className="text-left sm:text-right text-xs">
              <div className="text-slate-400 text-[11px]">
                <span className="text-slate-500 mr-1">Last:</span>
                {item.last_date ? (item.last_date === dateStr ? 'Today' : `${Math.round((new Date(dateStr + 'T00:00:00').getTime() - lastDateObj!.getTime()) / 86400000)} days ago`) : 'Never'}
              </div>
              <div className={`font-bold text-xs ${isDueToday ? 'text-amber-300 animate-pulse' : isCompletedToday ? 'text-emerald-400' : 'text-teal-400'}`}>
                <span className="text-slate-500 mr-1 font-normal text-[11px]">Next:</span>
                {isCompletedToday ? `In ${item.interval_days} days` : isDueToday ? 'DUE TODAY' : `In ${item.days_until} days`}
              </div>
            </div>

            {isCompletedToday ? (
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5 shadow-sm"
              >
                <Check size={14} strokeWidth={3} /> Logged Today
              </button>
            ) : (
              <button
                type="button"
                disabled={isLogging}
                onClick={handleLogPulse}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-md ${
                  isDueToday 
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/20' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Plus size={14} strokeWidth={2.5} /> {isDueToday ? 'Log Pulse Today' : 'Log Pulse'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Details Drawer */}
      {isExpanded && (
        <div className="p-4 bg-black/50 border-t border-purple-500/20 space-y-4 animate-in fade-in slide-in-from-top-2">
          {/* Target Dosage & Exposure Details */}
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-start gap-2.5">
            <SlidersHorizontal className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-purple-300">
                Prescribed Target Dose & Cadence
              </div>
              <div className="text-xs text-slate-200 font-semibold mt-0.5">
                {mod.dose_or_exposure || 'Standard clinical pulse dose'}
              </div>
              {descriptionText && (
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {descriptionText}
                </p>
              )}
            </div>
          </div>

          {/* PubMed Scientific Rationale */}
          {mod.evidence_summary && (
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-teal-300">
                  Scientific Rationale & Longevity Impact
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {mod.evidence_summary}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons & Geek Mode Toggle Row */}
          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            {pubmedUrl && (
              <a
                href={pubmedUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-950/50 border border-teal-800/60 hover:bg-teal-950 transition"
              >
                <ExternalLink size={13} /> PubMed Verified Research
              </a>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowGeekMode(!showGeekMode)
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
                showGeekMode 
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md' 
                  : 'bg-purple-950/60 border-purple-800/60 text-purple-300 hover:bg-purple-950'
              }`}
            >
              <Info size={13} /> {showGeekMode ? 'Hide Geek Mode' : 'Geek Mode'}
            </button>
          </div>

          {/* Geek Mode Full Breakdown Component */}
          {showGeekMode && (
            <div className="pt-2 border-t border-purple-500/20">
              <GeekMode modality={mod} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
