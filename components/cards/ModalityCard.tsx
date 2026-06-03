'use client'

import { useState } from 'react'
import { Modality, DailySession } from '@/lib/types'
import { Check, X, ChevronDown, ChevronUp, Activity, Info } from 'lucide-react'
import GeekMode from './GeekMode'

type ModalityCardProps = {
  session: DailySession
  onComplete: (id: string) => void
  onSkip: (id: string) => void
  onTrackOutcomes: (modality: Modality, sessionId: string) => void
}

export default function ModalityCard({ session, onComplete, onSkip, onTrackOutcomes }: ModalityCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showGeekMode, setShowGeekMode] = useState(false)
  const modality = session.modality

  if (!modality) return null

  const isCompleted = session.status === 'completed'
  const isSkipped = session.status === 'skipped'

  return (
    <div className={`glass-card rounded-xl overflow-hidden transition-all duration-300 ${isCompleted ? 'opacity-70 grayscale-[30%]' : ''} ${isSkipped ? 'opacity-50 grayscale' : ''}`}>
      
      {/* Compact View */}
      <div 
        className="p-4 cursor-pointer flex flex-col gap-3 relative"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold tracking-wider text-levl-accent uppercase">
                {session.relative_time_archetype?.replace('_', ' ') || 'Anytime'}
              </span>
              {modality.schedule_pattern && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-levl-text-secondary uppercase">
                  {modality.schedule_pattern}
                </span>
              )}
            </div>
            <h3 className="font-bold text-lg leading-tight">{modality.display_name || modality.name}</h3>
            <p className="text-sm text-levl-text-secondary mt-1">{modality.dose_or_exposure}</p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {!isCompleted && !isSkipped && (
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onSkip(session.id); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-black/40 border border-white/10 text-levl-text-secondary hover:text-white"
                >
                  <X size={14} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onComplete(session.id); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-levl-accent/20 border border-levl-accent text-levl-accent hover:bg-levl-accent hover:text-white"
                >
                  <Check size={14} />
                </button>
              </div>
            )}
            {isCompleted && <div className="text-levl-accent font-bold"><Check size={20} /></div>}
            {isSkipped && <div className="text-levl-text-secondary"><X size={20} /></div>}
          </div>
        </div>

        {/* Tracking Button Stub */}
        {!expanded && (
          <button 
            onClick={(e) => { e.stopPropagation(); onTrackOutcomes(modality, session.id); }}
            className="flex items-center gap-2 text-xs text-levl-purple hover:text-white transition-colors w-fit"
          >
            <Activity size={14} /> Track Outcomes
          </button>
        )}
      </div>

      {/* Expanded View */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4 animate-in fade-in slide-in-from-top-2">
          
          <p className="text-sm text-gray-300 leading-relaxed">
            {modality.brief_description}
          </p>

          <div className="bg-black/30 rounded-lg p-3 border border-white/5 space-y-2">
            <h4 className="text-xs font-semibold text-levl-text-secondary uppercase">Why this is ranked for you</h4>
            <p className="text-sm">Personal Longevity Impact: <span className="text-levl-accent font-bold">{modality.overall_longevity_benefit}</span></p>
            <p className="text-xs text-levl-text-secondary italic">High expected benefit aligning with your goals. Low friction.</p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onTrackOutcomes(modality, session.id); }}
              className="flex-1 bg-white/5 hover:bg-white/10 text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2"
            >
              <Activity size={16} /> Track Outcomes
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowGeekMode(!showGeekMode); }}
              className={`flex-1 border text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${showGeekMode ? 'bg-levl-purple text-white border-levl-purple' : 'bg-levl-purple/10 border-levl-purple/30 text-levl-purple hover:bg-levl-purple hover:text-white'}`}
            >
              <Info size={16} /> Geek Mode
            </button>
          </div>
          
          {showGeekMode && <GeekMode modality={modality} />}
        </div>
      )}
    </div>
  )
}
