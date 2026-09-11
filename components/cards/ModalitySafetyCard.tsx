'use client'

import React, { useState } from 'react'
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Lightbulb, 
  HeartHandshake,
  AlertOctagon,
  Info
} from 'lucide-react'
import { Modality, UserProfile } from '@/lib/types'
import { getModalitySafetyProfile } from '@/lib/safety/modalitySafetyKnowledgeBase'
import { detectContraindications } from '@/lib/safety/contraindicationEngine'

interface ModalitySafetyCardProps {
  modality?: Modality | null
  userProfile?: UserProfile | null
  defaultOpen?: boolean
  className?: string
}

export const ModalitySafetyCard: React.FC<ModalitySafetyCardProps> = ({
  modality,
  userProfile,
  defaultOpen = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  if (!modality) return null

  const safetyProfile = getModalitySafetyProfile(modality)
  const activeContraindications = detectContraindications(modality, userProfile)
  const hasUserContraindication = activeContraindications.length > 0

  return (
    <div className={`w-full bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden shadow-md my-2.5 transition-all ${className}`}>
      {/* Header Accordion Toggle - Collapsed by Default */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 sm:p-4 text-left bg-slate-900/70 hover:bg-slate-900 transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className={`p-1.5 rounded-xl border shrink-0 transition-transform group-hover:scale-105 ${
            hasUserContraindication
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
              : safetyProfile.riskLevel === 'moderate_risk'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
              : safetyProfile.riskLevel === 'high_risk'
              ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}>
            {hasUserContraindication ? (
              <AlertTriangle size={16} className="animate-pulse text-rose-400" />
            ) : safetyProfile.riskLevel === 'high_risk' ? (
              <AlertOctagon size={16} className="text-red-400" />
            ) : (
              <ShieldAlert size={16} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-extrabold text-white tracking-tight">
                Safety: Considerations and Risks
              </h4>
              <span className={`text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${safetyProfile.riskBadgeClass}`}>
                {safetyProfile.riskLevelLabel}
              </span>
              {hasUserContraindication && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  ⚠️ Profile Conflict Detected
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate mt-0.5">
              Precautions, contraindications &amp; mitigation protocols
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-slate-400 flex items-center gap-1 text-[11px] sm:text-xs font-bold">
            <span>{isOpen ? 'Hide Safety Specs' : 'View Safety Specs'}</span>
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </button>

      {/* Collapsible Content Body */}
      {isOpen && (
        <div className="p-4 sm:p-5 space-y-4 border-t border-slate-800/80 bg-slate-950/80 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* 1. Personalized User Medical Clearance Banner */}
          {userProfile && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
              hasUserContraindication
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
            }`}>
              {hasUserContraindication ? (
                <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <span className="font-extrabold text-white block">
                  {hasUserContraindication ? 'Personal Health Interaction Detected' : 'Personal Profile Cleared'}
                </span>
                {hasUserContraindication ? (
                  <div className="space-y-1 text-slate-300 leading-relaxed text-[11px]">
                    <p>
                      <strong className="text-rose-300">{activeContraindications[0].headline}: </strong>
                      {activeContraindications[0].clinicalRationale}
                    </p>
                    <p className="text-slate-400 font-mono text-[10px]">
                      Advice: {activeContraindications[0].actionAdvice}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Zero medical interactions detected against your active health conditions, medications, or cytochrome P450 profiles.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 2. Safety Summary & Population Scope */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-white/5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-extrabold text-[11px] uppercase tracking-wider">
              <Info size={13} className="text-cyan-400" />
              <span>Safety Summary &amp; Scope</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {safetyProfile.safetySummary}
            </p>
          </div>

          {/* 3. Important Considerations (Prominently Highlighted) */}
          {safetyProfile.importantConsiderations.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-[11px] uppercase tracking-wider">
                <AlertTriangle size={13} className="text-amber-400" />
                <span>Important Considerations:</span>
              </div>
              <div className="space-y-2">
                {safetyProfile.importantConsiderations.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-100/90 leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-2"></span>
                    <span className="flex-1">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Documented Clinical Contraindications */}
          {safetyProfile.documentedContraindications.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-rose-400 font-extrabold text-[11px] uppercase tracking-wider">
                <AlertOctagon size={13} className="text-rose-400" />
                <span>Documented Contraindications:</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                <p className="text-[11px] text-rose-200/80 font-medium">
                  Do not implement or consult your physician prior to initiation if you have:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {safetyProfile.documentedContraindications.map((contra, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-rose-200 text-xs">
                      <span className="text-rose-400 font-bold shrink-0">•</span>
                      <span>{contra}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. Common Adverse Effects & Mitigation Strategies */}
          {safetyProfile.commonSideEffects.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-slate-300 font-extrabold text-[11px] uppercase tracking-wider">
                <Lightbulb size={13} className="text-amber-300" />
                <span>Manageable Side Effects &amp; Actionable Mitigation:</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {safetyProfile.commonSideEffects.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-[11px] flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                        {item.effect}
                      </span>
                    </div>
                    <div className="pl-4 text-slate-300 text-[11px] leading-relaxed">
                      <strong className="text-emerald-400 font-semibold">Mitigation: </strong>
                      {item.mitigation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Clinical Disclaimer Note */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span>Clinical longevity data synthesized from verified peer-reviewed literature.</span>
            <span>Always consult your physician</span>
          </div>

        </div>
      )}
    </div>
  )
}
