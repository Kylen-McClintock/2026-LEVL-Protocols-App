'use client'

import React from 'react'
import { Check, AlertCircle, AlertTriangle, ExternalLink, BookOpen } from 'lucide-react'
import BiomarkerAlgorithmBadges from './BiomarkerAlgorithmBadges'
import { BIOMARKER_REGISTRY } from '@/lib/aging-models/biomarkerRegistry'

interface BiomarkerRangeVisualProps {
  value: number
  unit: string
  standardMin: number
  standardMax: number
  optimalMin: number
  optimalMax: number
  biomarkerName?: string
  biomarkerId?: string
  studyCitation?: string
  studyUrl?: string
  showLabels?: boolean
}

export default function BiomarkerRangeVisual({
  value,
  unit,
  standardMin,
  standardMax,
  optimalMin,
  optimalMax,
  biomarkerName,
  biomarkerId,
  studyCitation,
  studyUrl,
  showLabels = true
}: BiomarkerRangeVisualProps) {
  // Find definition by name or id if available
  const registryDef = biomarkerId ? BIOMARKER_REGISTRY[biomarkerId] : (biomarkerName ? Object.values(BIOMARKER_REGISTRY).find(b => b.name.toLowerCase() === biomarkerName.toLowerCase()) : undefined)
  // Round number cleanly to max 2 decimal places to prevent float artifacts
  const formatNum = (val: number): string => {
    if (isNaN(val)) return '0'
    const rounded = Math.round(val * 100) / 100
    return rounded.toString()
  }

  // Determine scale boundaries with clean 25% buffers
  const rawMin = Math.min(standardMin * 0.7, optimalMin * 0.7, value * 0.8)
  const rawMax = Math.max(standardMax * 1.3, optimalMax * 1.3, value * 1.2, rawMin + 1)
  
  const minVal = Math.round(rawMin * 100) / 100
  const maxVal = Math.round(rawMax * 100) / 100
  const rangeSpan = maxVal - minVal || 1

  const getPct = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val))
    return Math.round(((clamped - minVal) / rangeSpan) * 100)
  }

  const valPct = getPct(value)
  const stdMinPct = getPct(standardMin)
  const stdMaxPct = getPct(standardMax)
  const optMinPct = getPct(optimalMin)
  const optMaxPct = getPct(optimalMax)

  const isOptimal = value >= optimalMin && value <= optimalMax
  const isNormalLab = value >= standardMin && value <= standardMax

  let statusText = 'Optimal Longevity Zone'
  let statusBadgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  let pinStyle = 'bg-emerald-400 border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.8)]'

  if (!isOptimal) {
    if (isNormalLab) {
      statusText = 'Opportunity to Optimize'
      statusBadgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      pinStyle = 'bg-amber-400 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
    } else {
      statusText = value < standardMin ? 'Below Standard Lab Range' : 'Above Standard Lab Range'
      statusBadgeStyle = 'bg-red-500/20 text-red-300 border-red-500/40'
      pinStyle = 'bg-red-400 border-red-300 shadow-[0_0_12px_rgba(248,113,113,0.8)]'
    }
  }

  return (
    <div className="w-full space-y-3 p-4 rounded-2xl bg-black/60 border border-white/10">
      {/* Header Info */}
      {showLabels && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {biomarkerName && <span className="font-bold text-white text-sm">{biomarkerName}</span>}
            <span className="font-mono text-gray-200 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10">
              {formatNum(value)} <span className="text-gray-400 font-normal">{unit}</span>
            </span>
            {registryDef && <BiomarkerAlgorithmBadges definition={registryDef} size="sm" />}
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border flex items-center gap-1 ${statusBadgeStyle}`}>
            {isOptimal ? <Check size={12} /> : isNormalLab ? <AlertTriangle size={12} /> : <AlertCircle size={12} />}
            {statusText}
          </span>
        </div>
      )}

      {/* Spectrum Bar Track */}
      <div className="relative pt-7 pb-3">
        {/* Value Pin Marker */}
        <div 
          className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center transition-all duration-500 z-30"
          style={{ left: `${valPct}%` }}
        >
          <span className="text-[10px] font-mono font-black text-white px-1.5 py-0.5 rounded bg-black/90 border border-white/30 shadow-lg">
            {formatNum(value)}
          </span>
          <div className={`w-3.5 h-3.5 rounded-full border-2 ${pinStyle} mt-0.5 animate-pulse`} />
        </div>

        {/* Outer Scale Track */}
        <div className="w-full h-4 rounded-full bg-white/5 border border-white/10 relative overflow-hidden flex items-center">
          {/* Standard Lab Range Box (Visually Clear Gray Container) */}
          <div 
            className="absolute top-0 bottom-0 bg-white/15 border-x border-white/40 z-10"
            style={{ left: `${stdMinPct}%`, width: `${stdMaxPct - stdMinPct}%` }}
          />

          {/* LEVL Optimal Longevity Target (Glowing Emerald Green Segment) */}
          <div 
            className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-500/70 via-emerald-400/90 to-emerald-500/70 border-x-2 border-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.6)] z-20"
            style={{ left: `${optMinPct}%`, width: `${optMaxPct - optMinPct}%` }}
          />
        </div>

        {/* Clean Numerical Scale Labels */}
        <div className="relative w-full text-[9px] font-mono text-gray-400 pt-2 flex justify-between">
          <span>{formatNum(minVal)}</span>

          <span 
            className="absolute transform -translate-x-1/2 text-emerald-300 font-bold tracking-tight bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 text-[10px]"
            style={{ left: `${(optMinPct + optMaxPct) / 2}%` }}
          >
            Longevity Target ({formatNum(optimalMin)} – {formatNum(optimalMax)})
          </span>

          <span>{formatNum(maxVal)}</span>
        </div>
      </div>

      {/* Legend & Scientific Reference Study Link */}
      <div className="pt-2 border-t border-white/10 space-y-2 text-[11px]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Standard Lab Range Label */}
          <div className="flex items-center gap-1.5 text-gray-300">
            <div className="w-2.5 h-2.5 rounded bg-white/20 border border-white/40" />
            <span>Standard Lab Range: <strong className="text-white font-mono">{formatNum(standardMin)} – {formatNum(standardMax)} {unit}</strong></span>
          </div>

          {/* LEVL Longevity Target Label */}
          <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
            <div className="w-2.5 h-2.5 rounded bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <span>LEVL Optimal Target: <strong className="text-emerald-200 font-mono">{formatNum(optimalMin)} – {formatNum(optimalMax)} {unit}</strong></span>
          </div>
        </div>

        {/* Scientific Study Citation Link */}
        {studyCitation && (
          <div className="pt-1 flex items-center justify-between text-[10px] text-gray-400 bg-white/5 p-2 rounded-xl border border-white/5">
            <div className="flex items-center gap-1.5">
              <BookOpen size={12} className="text-indigo-400" />
              <span>Longevity Science: <strong className="text-gray-300">{studyCitation}</strong></span>
            </div>
            {studyUrl && (
              <a
                href={studyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-300 hover:text-white font-bold flex items-center gap-1 hover:underline ml-2"
              >
                PubMed Paper <ExternalLink size={10} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
