'use client'

import React, { useState } from 'react'
import { LongevityTip } from '@/lib/data/longevityTips'
import { ScoredLongevityTip } from '@/lib/ranking/tipPersonalization'
import { Modality, UserProfile } from '@/lib/types'
import ExploreCard from '@/components/cards/ExploreCard'
import { getModalities, addToBench } from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { 
  Sparkles, 
  ExternalLink, 
  Plus, 
  Check, 
  X, 
  RotateCw, 
  BookOpen, 
  ShieldCheck, 
  Activity,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react'

interface DailyLongevityTipBannerProps {
  scoredTips: ScoredLongevityTip[]
  allModalities?: Modality[]
  userProfile?: UserProfile | null
  onAddToToday: (modalityId: string) => Promise<void>
  onAddToBench?: (modalityId: string) => Promise<void>
  onDismiss: (tipId: string) => void
  isCollapsedByDefault?: boolean
}

export const DailyLongevityTipBanner: React.FC<DailyLongevityTipBannerProps> = ({
  scoredTips,
  allModalities,
  userProfile,
  onAddToToday,
  onAddToBench,
  onDismiss,
  isCollapsedByDefault = false
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [isAdding, setIsAdding] = useState<boolean>(false)
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false)
  const [modalitiesList, setModalitiesList] = useState<Modality[]>(allModalities || [])
  const [showFullModalityCard, setShowFullModalityCard] = useState<boolean>(false)
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (isCollapsedByDefault) return false
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return false
    }
    return true
  })

  // Synchronize or fetch modalities list
  React.useEffect(() => {
    if (allModalities && allModalities.length > 0) {
      setModalitiesList(allModalities)
    } else {
      getModalities(true).then(mods => {
        if (mods && mods.length > 0) setModalitiesList(mods)
      }).catch(console.error)
    }
  }, [allModalities])

  // Detect mobile & sync state if isCollapsedByDefault changes
  React.useEffect(() => {
    if (isCollapsedByDefault) {
      setIsExpanded(false)
      return
    }
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsExpanded(false)
    }
  }, [isCollapsedByDefault])

  if (!scoredTips || scoredTips.length === 0) return null

  const currentScored = scoredTips[currentIndex % scoredTips.length]
  const tip = currentScored.tip

  // Resolve matching Modality object
  const resolvedModality = React.useMemo(() => {
    if (!tip.modality_id || modalitiesList.length === 0) return null
    const rawId = tip.modality_id.trim().toLowerCase()
    const slug = rawId.replace(/[^a-z0-9]+/g, '_')
    const words = rawId.replace(/_/g, ' ')

    return modalitiesList.find(m => 
      m.id.toLowerCase() === rawId ||
      m.id.toLowerCase() === slug ||
      (m.slug && m.slug.toLowerCase() === slug) ||
      m.name.toLowerCase() === words ||
      m.name.toLowerCase() === rawId ||
      (m.display_name && m.display_name.toLowerCase() === words) ||
      m.name.toLowerCase().includes(words) ||
      words.includes(m.name.toLowerCase())
    ) || null
  }, [tip.modality_id, modalitiesList])

  const handleNextTip = () => {
    setAddedSuccess(false)
    setShowFullModalityCard(false)
    setCurrentIndex(prev => (prev + 1) % scoredTips.length)
  }

  const handleAdd = async () => {
    if (!tip.modality_id) return
    setIsAdding(true)
    await onAddToToday(tip.modality_id)
    setIsAdding(false)
    setAddedSuccess(true)
  }

  if (!isExpanded) {
    return (
      <div className="bg-slate-950/70 border border-purple-500/30 hover:border-purple-500/50 rounded-2xl p-3 sm:p-3.5 shadow-lg transition-all backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-3 text-left cursor-pointer flex-1 min-w-0"
          >
            <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              <Sparkles size={14} className="text-purple-400" />
            </div>
            <div className="flex flex-col min-w-0 gap-0.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] sm:text-xs font-black text-white uppercase tracking-wider">
                  Daily Longevity Tip
                </span>
                <span className="text-[10px] bg-slate-950 border border-slate-800 text-teal-300 px-2 py-0.5 rounded-full font-mono font-bold shrink-0">
                  {tip.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate leading-snug pr-2">
                {tip.headline}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="text-xs font-bold text-purple-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-700/50 rounded-full transition-all cursor-pointer shrink-0 shadow-sm"
          >
            <span>Show Tip</span>
            <ChevronDown size={14} className="text-purple-300" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/60 border border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden animate-in fade-in slide-in-from-top-4">
      {/* Background ambient glow */}
      <div className="absolute -top-20 -right-20 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-purple-500/20 border border-purple-500/40 text-purple-300 font-extrabold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <Sparkles size={13} className="text-purple-400" /> Daily Longevity Tip
          </span>

          <span className="bg-slate-950/80 border border-slate-800 text-teal-300 font-bold text-[11px] px-2.5 py-0.5 rounded-full font-mono">
            {tip.category}
          </span>

          {currentScored.relevanceReason && (
            <span className="text-[11px] text-amber-300 font-medium bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              ✨ {currentScored.relevanceReason}
            </span>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleNextTip}
            className="text-xs font-bold text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
            title="Next tip"
          >
            <RotateCw size={13} />
            <span className="hidden sm:inline">Next Tip</span>
          </button>

          <button
            onClick={() => setIsExpanded(false)}
            className="text-xs font-bold text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
            title="Collapse tip"
          >
            <ChevronUp size={14} />
            <span className="hidden sm:inline">Collapse</span>
          </button>

          <button
            onClick={() => onDismiss(tip.id)}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Dismiss tip for today"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Headline & Main Tip Body */}
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug tracking-tight">
          {tip.headline}
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
          {tip.tip_text}
        </p>
      </div>

      {/* Biological Mechanism Card */}
      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
        <strong className="text-purple-300 font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
          <Activity size={13} className="text-purple-400" /> Biological Mechanism:
        </strong>
        <p className="text-slate-300 font-sans leading-relaxed">
          {tip.mechanism}
        </p>
      </div>

      {/* Footer Action Row: PubMed Link & Add to Stack */}
      <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
        <div className="flex items-center gap-3 text-xs flex-wrap">
          {/* PubMed Citation Link */}
          <a
            href={tip.citation_url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-950/90 border border-slate-800 hover:border-purple-500/50 text-purple-300 hover:text-purple-200 px-3 py-1.5 rounded-xl font-mono text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <BookOpen size={13} className="text-purple-400" />
            <span>PMID: {tip.pmid} ({tip.citation_label})</span>
            <ExternalLink size={12} />
          </a>

          {tip.author_attribution && (
            <span className="text-[11px] text-slate-400 font-medium">
              Protocol: <span className="text-slate-300 font-semibold">{tip.author_attribution}</span>
            </span>
          )}

          {/* Inline Full Modality Details Toggle */}
          {resolvedModality && (
            <button
              type="button"
              onClick={() => setShowFullModalityCard(!showFullModalityCard)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                showFullModalityCard
                  ? 'bg-purple-900/80 border-purple-400 text-white shadow-md'
                  : 'bg-slate-950/90 hover:bg-slate-800 border-purple-500/40 text-purple-300 hover:text-white'
              }`}
              title="Inspect full dosage, timing, mechanism, outcomes & GeekMode clinical evidence"
            >
              <Info size={13} className="text-purple-400" />
              <span>{showFullModalityCard ? 'Hide Full Modality Details' : 'View Full Modality Details'}</span>
              {showFullModalityCard ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>

        {/* Add to Today's Stack Button */}
        {tip.modality_id && (
          <div className="shrink-0 ml-auto">
            {currentScored.isInTodayStack || addedSuccess ? (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <Check size={14} className="stroke-[3]" /> In Today&apos;s Stack
              </span>
            ) : (
              <button
                onClick={handleAdd}
                disabled={isAdding}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-purple-900/40 flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Plus size={15} />
                <span>{isAdding ? 'Adding...' : 'Add to Today'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Inline Expanded Full Modality Card */}
      {showFullModalityCard && resolvedModality && (
        <div className="pt-3 border-t border-purple-500/20 space-y-2 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between flex-wrap gap-2 px-1">
            <span className="text-[11px] uppercase font-bold tracking-wider text-purple-300 flex items-center gap-1.5">
              <Sparkles size={12} className="text-purple-400" /> Full Modality Profile & Clinical Protocols
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Review dosing, timing, mechanisms & GeekMode before adding
            </span>
          </div>
          <div className="bg-slate-950/60 rounded-2xl border border-white/10 p-2 sm:p-3 shadow-inner">
            <ExploreCard
              modality={resolvedModality}
              userProfile={userProfile}
              activeStatus={currentScored.isInTodayStack || addedSuccess ? 'today' : null}
              onAddToToday={async (mId) => {
                await handleAdd()
              }}
              onAddToBench={async (mId) => {
                if (onAddToBench) {
                  await onAddToBench(mId)
                } else {
                  const localUserId = userProfile?.local_user_id || getLocalUserId()
                  await addToBench(localUserId, mId)
                }
              }}
            />
          </div>
        </div>
      )}

    </div>
  )
}
