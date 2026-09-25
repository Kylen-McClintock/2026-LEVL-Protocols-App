'use client'

import React, { useState } from 'react'
import { Zap, Sparkles, ExternalLink, X } from 'lucide-react'

export interface ModalitySynergyInfo {
  partnerId: string
  partnerName: string
  synergyType: 'bioavailability' | 'contrast_hormesis' | 'cofactor' | 'cellular_pathway' | 'absorption' | 'receptor'
  multiplierBadge?: string
  headline: string
  mechanism: string
  pubmedUrl?: string
}

interface BlocksSynergyConnectorProps {
  synergy: ModalitySynergyInfo
  onHighlightPartner?: (partnerId: string | null) => void
}

export default function BlocksSynergyConnector({
  synergy,
  onHighlightPartner
}: BlocksSynergyConnectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const isAbsorption = synergy.synergyType === 'bioavailability' || synergy.synergyType === 'absorption'
  const isContrast = synergy.synergyType === 'contrast_hormesis'

  const themeClasses = isAbsorption
    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
    : isContrast
    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/25'
    : 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25'

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      {/* Synergy Chip */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => onHighlightPartner?.(synergy.partnerId)}
        onMouseLeave={() => onHighlightPartner?.(null)}
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer select-none active:scale-95 ${themeClasses}`}
        title={`Synergistic with ${synergy.partnerName} • Click for clinical mechanism`}
      >
        <Sparkles size={10} className="animate-pulse" />
        <span className="truncate max-w-[140px] sm:max-w-[200px]">
          {synergy.multiplierBadge || `Synergy: ${synergy.partnerName}`}
        </span>
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          className="absolute z-50 bottom-full left-0 mb-2 w-72 sm:w-80 p-3 rounded-2xl bg-slate-950/95 border border-emerald-500/40 shadow-2xl backdrop-blur-xl text-left animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300">
              <Zap size={13} className="text-emerald-400" />
              <span>Biochemical Synergy</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded-lg hover:bg-white/10"
            >
              <X size={13} />
            </button>
          </div>

          <div className="pt-2 space-y-1.5">
            <div className="text-xs font-bold text-white flex items-center gap-1">
              <span>Paired with:</span>
              <span className="text-emerald-400 underline">{synergy.partnerName}</span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
              {synergy.mechanism}
            </p>

            {synergy.pubmedUrl && (
              <div className="pt-1">
                <a
                  href={synergy.pubmedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 hover:text-emerald-300 hover:underline"
                >
                  <span>Verified Clinical Evidence</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
