'use client'

import React, { useState, useMemo } from 'react'
import {
  getProtocolLongevityReport,
  CompleteProtocolLongevityReport
} from '@/lib/data/longevityKnowledgeBase'
import { getOutcomeColor } from '@/lib/outcomes/outcomeColors'
import {
  Dna,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Info,
  ExternalLink,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react'
import { LongevityAnalysisModal } from '../modals/LongevityAnalysisModal'

interface ProtocolLongevityDrawerProps {
  protocol: any
  allModalities?: any[]
  defaultExpanded?: boolean
  className?: string
}

export const ProtocolLongevityDrawer: React.FC<ProtocolLongevityDrawerProps> = ({
  protocol,
  allModalities = [],
  defaultExpanded = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [showNeutralVectors, setShowNeutralVectors] = useState(false)
  const [activeAnalysisOutcome, setActiveAnalysisOutcome] = useState<string | null>(null)

  const report: CompleteProtocolLongevityReport = useMemo(() => {
    return getProtocolLongevityReport(protocol, allModalities)
  }, [protocol, allModalities])

  if (!report) {
    return null
  }

  const primaryScore = report.vectorScores[0]

  return (
    <div className={`rounded-xl border border-purple-500/30 bg-purple-950/20 overflow-hidden shadow-sm transition-all duration-200 ${className}`}>
      {/* Clickable Header Trigger */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 sm:p-3.5 flex items-center justify-between gap-2.5 cursor-pointer select-none hover:bg-purple-900/20 transition-colors"
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0">
            <Dna size={14} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white tracking-tight">
                Protocol Longevity Evidence
              </span>

              {primaryScore && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shrink-0">
                  {primaryScore.vectorName.split('&')[0].trim()}: {primaryScore.score}% Dialed-In
                </span>
              )}
            </div>

            <p className="text-[11px] text-purple-200/70 truncate mt-0.5">
              {report.vectorScores.length} Targeted Vector{report.vectorScores.length === 1 ? '' : 's'}
              {report.neutralVectors.length > 0 && ` • ${report.neutralVectors.length} Neutral Vector${report.neutralVectors.length === 1 ? '' : 's'}`}
              {report.collectiveHallmarks.length > 0 && ` • ${report.collectiveHallmarks.length} Hallmark${report.collectiveHallmarks.length === 1 ? '' : 's'}`}
              {report.totalConstituentStudies > 0 && ` • ${report.totalConstituentStudies} Supporting Studies`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-purple-300 hidden min-[520px]:inline">
            {isExpanded ? 'Hide Breakdown' : 'Longevity Breakdown'}
          </span>
          <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-purple-400">
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </div>

      {/* Expanded Content Drawer */}
      {isExpanded && (
        <div className="p-3.5 sm:p-4 border-t border-purple-500/20 space-y-4 animate-in fade-in duration-200 text-xs">
          
          {/* 1. Protocol Vector Scores */}
          <div className="space-y-3">
            <span className="text-[10px] text-purple-300 uppercase font-bold tracking-wider block">
              Composite Biological Vector Coverage
            </span>

            <div className="grid grid-cols-1 gap-2.5">
              {report.vectorScores.map((vec) => {
                const colorConfig = getOutcomeColor(vec.vectorId)
                const isTarget = report.targetVectors.includes(vec.vectorId)

                return (
                  <div
                    key={vec.vectorId}
                    className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-2.5"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: colorConfig.hex }}
                        />
                        <span className="font-bold text-white text-xs sm:text-sm truncate">
                          {vec.vectorName}
                        </span>
                        {isTarget && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-500/20 border border-purple-500/40 text-purple-300">
                            Primary Focus
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                          vec.score >= 75
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : vec.score >= 45
                            ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}>
                          {vec.score}% Dialed-In
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveAnalysisOutcome(vec.vectorId)
                          }}
                          className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                          title="View 80/20 Clinical Analysis & Scoring Calculus"
                        >
                          <Info size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            vec.score >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                            vec.score >= 50 ? 'bg-gradient-to-r from-cyan-500 to-blue-400' : 'bg-slate-600'
                          }`}
                          style={{ width: `${vec.score}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>{vec.foundationalCount} Foundational • {vec.synergisticCount} Synergistic</span>
                        <span className="text-purple-300 capitalize">{vec.tier} Coverage</span>
                      </div>
                    </div>

                    {/* Constituent Modalities Driving This Vector */}
                    {vec.primaryContributors.length > 0 && (
                      <div className="pt-2 border-t border-white/5 space-y-1.5">
                        <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">
                          Constituent Modality Drivers:
                        </span>
                        <div className="space-y-1">
                          {vec.primaryContributors.map((c, cIdx) => (
                            <div 
                              key={cIdx}
                              className="p-1.5 sm:p-2 rounded-lg bg-white/5 border border-white/5 flex items-start justify-between gap-2"
                            >
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <span className="font-bold text-white text-[11px] block">
                                  {c.modalityName}
                                </span>
                                <p className="text-[10px] text-slate-300/80 line-clamp-1">
                                  {c.mechanism}
                                </p>
                              </div>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/50 border border-white/10 text-emerald-400 shrink-0">
                                {c.score}/100
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 2. Non-Targeted / Neutral Protocol Vectors */}
          {report.neutralVectors && report.neutralVectors.length > 0 && (
            <div className="pt-2 border-t border-purple-500/20 space-y-2">
              <button
                type="button"
                onClick={() => setShowNeutralVectors(!showNeutralVectors)}
                className="w-full flex items-center justify-between text-[10px] text-purple-300 uppercase font-bold tracking-wider hover:text-purple-200 transition-colors py-1 cursor-pointer select-none"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldAlert size={12} className="text-slate-400" />
                  <span>Non-Targeted / Neutral Vectors ({report.neutralVectors.length})</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 lowercase font-normal flex items-center gap-1">
                  {showNeutralVectors ? 'collapse' : 'view unaddressed vectors'}
                  {showNeutralVectors ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </span>
              </button>

              {showNeutralVectors && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-in fade-in duration-150">
                  {report.neutralVectors.map((nv) => {
                    const colorConfig = getOutcomeColor(nv.vectorId)
                    return (
                      <div 
                        key={nv.vectorId}
                        className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span 
                              className="w-2 h-2 rounded-full shrink-0 opacity-60"
                              style={{ backgroundColor: colorConfig.hex }}
                            />
                            <span className="text-[11px] font-semibold text-slate-300 truncate">
                              {nv.vectorName}
                            </span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-white/5 text-slate-400 border border-white/10 shrink-0">
                            Unaddressed
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400/90 leading-snug">
                          {nv.reason}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. Rescued Hallmarks of Aging */}
          {report.collectiveHallmarks.length > 0 && (
            <div className="pt-2 border-t border-white/10 space-y-2">
              <span className="text-[10px] text-purple-300 uppercase font-bold tracking-wider flex items-center gap-1.5">
                <Layers size={12} className="text-purple-400" />
                <span>Protocol Rescued Hallmarks ({report.collectiveHallmarks.length} of 12)</span>
              </span>

              <div className="flex items-center gap-1.5 flex-wrap">
                {report.collectiveHallmarks.map((h, hIdx) => (
                  <span 
                    key={hIdx}
                    className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-200 text-[10px] font-semibold"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer Methodology Note */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>LEVL Biogerontological Evidence Framework</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setActiveAnalysisOutcome(primaryScore?.vectorId || 'cellular_longevity')
              }}
              className="text-cyan-400 hover:text-cyan-300 underline font-bold cursor-pointer"
            >
              Scoring Calculus
            </button>
          </div>
        </div>
      )}

      {/* Embedded Longevity Analysis Modal Trigger */}
      {activeAnalysisOutcome && (
        <LongevityAnalysisModal
          isOpen={!!activeAnalysisOutcome}
          onClose={() => setActiveAnalysisOutcome(null)}
          outcomeId={activeAnalysisOutcome}
          currentDialedInScore={report.vectorScores.find(v => v.vectorId === activeAnalysisOutcome)?.score}
          activeModalities={allModalities}
        />
      )}
    </div>
  )
}

export default ProtocolLongevityDrawer
