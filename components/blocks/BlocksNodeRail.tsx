'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, X, Info } from 'lucide-react'
import { SequentialStepLink } from '@/lib/utils/modalityTimingRelationships'

interface BlocksNodeRailProps {
  link: SequentialStepLink
  isDaylight?: boolean
}

export default function BlocksNodeRail({ link, isDaylight = false }: BlocksNodeRailProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFullScience, setShowFullScience] = useState(false)

  return (
    <div className="w-full flex flex-col items-center my-0 select-none" onClick={(e) => e.stopPropagation()}>
      {/* Top vertical spine line with top node dot */}
      <div className="flex flex-col items-center">
        <div className={`w-1 h-1 rounded-full ${isDaylight ? 'bg-slate-400' : 'bg-zinc-500'}`} />
        <div className={`w-[1px] h-2 ${isDaylight ? 'bg-slate-300' : 'bg-zinc-700/70'}`} />
      </div>

      {/* Neutral Pill Badge (Clickable, No Emojis, Sleek Active State) */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs ${
          isExpanded
            ? isDaylight
              ? 'bg-purple-100 text-purple-900 border-purple-400 shadow-sm font-bold'
              : 'bg-purple-950/80 text-purple-200 border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.25)] font-bold'
            : isDaylight
            ? 'bg-slate-100/90 hover:bg-slate-200 text-slate-700 border-slate-300'
            : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700/70 hover:border-zinc-500'
        }`}
        title={`Click for sequence rationale between ${link.fromModalityName} and ${link.toModalityName}`}
      >
        <span>{link.pillText}</span>
        {isExpanded ? (
          <ChevronUp size={10} className={isDaylight ? 'text-purple-700' : 'text-purple-300'} />
        ) : (
          <ChevronDown size={10} className={isDaylight ? 'text-slate-400' : 'text-zinc-500'} />
        )}
      </button>

      {/* Bottom vertical spine line with bottom node dot */}
      <div className="flex flex-col items-center">
        <div className={`w-[1px] h-2 ${isDaylight ? 'bg-slate-300' : 'bg-zinc-700/70'}`} />
        <div className={`w-1 h-1 rounded-full ${isDaylight ? 'bg-slate-400' : 'bg-zinc-500'}`} />
      </div>

      {/* Inline Expanded Explanation Card (Opens directly between the two modalities) */}
      {isExpanded && (
        <div
          className={`w-full max-w-xl my-2 p-3.5 rounded-2xl border text-left animate-in fade-in zoom-in-95 duration-150 shadow-xl ${
            isDaylight
              ? 'bg-white border-slate-300 shadow-slate-200/60 text-slate-800'
              : 'bg-zinc-950/95 border-zinc-700/80 shadow-2xl backdrop-blur-xl text-zinc-200'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-bold tracking-tight">
              <Info size={13} className={isDaylight ? 'text-purple-600' : 'text-purple-400'} />
              <span>Protocol Sequence &amp; Timing</span>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                isDaylight ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-700' : 'hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <X size={13} />
            </button>
          </div>

          {/* Sequence Description */}
          <div className="pt-2.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold flex-wrap">
              <span className={`px-2 py-0.5 rounded-md border font-mono text-[11px] ${
                isDaylight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-zinc-900 border-zinc-700 text-zinc-300'
              }`}>
                {link.fromModalityName}
              </span>
              <span className={`font-mono text-[11px] ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>➔ {link.pillText} ➔</span>
              <span className={`px-2 py-0.5 rounded-md border font-mono text-[11px] ${
                isDaylight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-zinc-900 border-zinc-700 text-zinc-300'
              }`}>
                {link.toModalityName}
              </span>
            </div>

            <p className={`text-xs leading-relaxed font-normal ${isDaylight ? 'text-slate-700' : 'text-slate-300'}`}>
              {link.scientificRationale}
            </p>

            {/* Expandable Science & Mechanism */}
            {link.mechanism && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowFullScience(!showFullScience)}
                  className={`text-[11px] font-mono underline flex items-center gap-1 cursor-pointer transition-colors ${
                    isDaylight ? 'text-purple-700 hover:text-purple-900' : 'text-purple-400 hover:text-purple-300'
                  }`}
                >
                  <span>{showFullScience ? 'Hide biological mechanism' : 'View biological mechanism'}</span>
                  {showFullScience ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>

                {showFullScience && (
                  <div className={`mt-2 p-2.5 rounded-xl border text-[11px] leading-relaxed animate-in fade-in duration-150 ${
                    isDaylight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-black/50 border-zinc-800 text-zinc-300'
                  }`}>
                    <p className={`font-mono text-[10px] uppercase tracking-wider mb-1 font-bold ${
                      isDaylight ? 'text-purple-700' : 'text-purple-400'
                    }`}>
                      Cellular / Physiological Pathway
                    </p>
                    <p>{link.mechanism}</p>

                    {link.pubmedUrl && (
                      <div className={`mt-2 pt-1.5 border-t ${isDaylight ? 'border-slate-200' : 'border-white/10'}`}>
                        <a
                          href={link.pubmedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 text-[10px] font-mono hover:underline ${
                            isDaylight ? 'text-purple-700 hover:text-purple-900' : 'text-cyan-400 hover:text-cyan-300'
                          }`}
                        >
                          <span>Verified PubMed Literature</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
