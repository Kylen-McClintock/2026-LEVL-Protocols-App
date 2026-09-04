'use client'

import { useState } from 'react'
import { DailySession, Modality, UserProfile } from '@/lib/types'
import { Info, Check, X, Activity, ChevronDown, ChevronUp } from 'lucide-react'
import GeekMode from './GeekMode'
import { generateCoachInsight } from '@/lib/ranking/insights'
import { DosageBadgeButton } from '../ui/DosageBadgeButton'
import OutcomePill from '@/components/outcomes/OutcomePill'
import ModalityIcon from '../ui/ModalityIcon'
import MedicalDisclaimerBanner from '../ui/MedicalDisclaimerBanner'

type ModalityCardProps = {
  session: DailySession
  userProfile?: UserProfile | null
  onComplete: (id: string) => void
  onSkip: (id: string) => void
  onTrackOutcomes: (modality: Modality, sessionId: string) => void
}

export default function ModalityCard({ session, userProfile, onComplete, onSkip, onTrackOutcomes }: ModalityCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showGeekMode, setShowGeekMode] = useState(false)
  const modality = session.modality

  if (!modality) return null

  const cat = (modality.category || '').toLowerCase()
  const name = (modality.name || modality.display_name || '').toLowerCase()
  const isPeptideOrRiskyModality =
    cat.includes('peptide') ||
    cat.includes('hormone') ||
    cat.includes('injectable') ||
    cat.includes('pharmaceutical') ||
    cat.includes('senolytic') ||
    cat.includes('secretagogue') ||
    name.includes('bpc') ||
    name.includes('tb-500') ||
    name.includes('tb500') ||
    name.includes('mots-c') ||
    name.includes('cjc') ||
    name.includes('ipamorelin') ||
    name.includes('epithalon') ||
    name.includes('ghk-cu') ||
    name.includes('semaglutide') ||
    name.includes('tirzepatide') ||
    name.includes('rapamycin') ||
    name.includes('metformin') ||
    name.includes('fisetin') ||
    name.includes('retatrutide') ||
    name.includes('kpv') ||
    name.includes('thymosin') ||
    name.includes('tesamorelin') ||
    name.includes('sermorelin') ||
    name.includes('aod-9604') ||
    name.includes('subq') ||
    name.includes('sauna') ||
    name.includes('cold plunge') ||
    name.includes('ice bath')

  const isCompleted = session.status === 'completed'
  const isSkipped = session.status === 'skipped'

  return (
    <div className="glass-card rounded-xl overflow-hidden transition-all duration-300 border border-white/5 hover:border-white/10">
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
            <div className="flex items-start gap-2.5 min-w-0">
              <ModalityIcon modality={modality} size={20} className="shrink-0 mt-0.5" />
              <h3 className="font-bold text-lg leading-tight flex-1 min-w-0">
                {modality.display_name || modality.name}
              </h3>
            </div>
            
            {/* Dosing Details */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <DosageBadgeButton
                modality={modality}
                userProfile={userProfile}
                protocolContext={(session as any)?.protocol_id ? { protocolName: 'Enrolled Protocol' } : null}
              />
              {modality.frequency && (
                <span className="text-[10px] bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded flex items-center">
                  <span className="opacity-60 mr-1">Freq:</span> {modality.frequency}
                </span>
              )}
              {modality.timing_summary && (
                <span className="text-[10px] bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded flex items-center">
                  <span className="opacity-60 mr-1">Time:</span> {modality.timing_summary}
                </span>
              )}
            </div>
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
      </div>

      {/* Expanded View */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4 animate-in fade-in slide-in-from-top-2">
          <p className="text-sm text-gray-300 leading-relaxed">
            {modality.brief_description}
          </p>

          {modality.functional_impacts && Object.keys(modality.functional_impacts).some(k => modality.functional_impacts![k].score > 5) && (
            <div className="flex flex-wrap gap-1.5 pt-1 pb-1">
              {Object.entries(modality.functional_impacts)
                .filter(([_, impact]) => impact.score > 5)
                .sort((a, b) => b[1].score - a[1].score)
                .map(([outcome, impact]) => (
                  <OutcomePill
                    key={outcome}
                    outcome={outcome}
                    score={impact.score}
                    size="sm"
                  />
                ))
              }
            </div>
          )}

          <div className="bg-black/30 rounded-lg p-3 border border-white/5 space-y-2">
            <h4 className="text-xs font-semibold text-levl-text-secondary uppercase">Why this is ranked for you</h4>
            {modality.overall_longevity_benefit && (
              <p className="text-sm">Personal Longevity Impact: <span className="text-levl-accent font-bold">{modality.overall_longevity_benefit}</span></p>
            )}
            <p className="text-xs text-levl-text-secondary italic">{generateCoachInsight(modality, userProfile)}</p>
          </div>

          {/* Medical Disclaimer Banner for Peptides and Risky Modalities */}
          {isPeptideOrRiskyModality && (
            <MedicalDisclaimerBanner
              modalityCategory={modality.category}
              modalityName={modality.display_name || modality.name}
            />
          )}

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
