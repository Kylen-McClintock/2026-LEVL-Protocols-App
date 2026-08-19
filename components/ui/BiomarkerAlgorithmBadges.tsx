'use client'

import React from 'react'
import { BiomarkerDefinition } from '@/lib/aging-models/bioAgeTypes'

interface BiomarkerAlgorithmBadgesProps {
  definition?: BiomarkerDefinition
  size?: 'sm' | 'md'
}

export default function BiomarkerAlgorithmBadges({ definition, size = 'sm' }: BiomarkerAlgorithmBadgesProps) {
  if (!definition) return null

  const usage = definition.bioage_model_usage || { phenoage: false, kdm: false, hd: false, calico: false }
  const isAlgoMarker = usage.phenoage || usage.kdm || usage.hd || usage.calico

  const badgeClass = size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {usage.phenoage && (
        <span 
          title="Included in Levine Phenotypic Age Model"
          className={`font-mono font-extrabold rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 ${badgeClass}`}
        >
          PhenoAge
        </span>
      )}

      {usage.kdm && (
        <span 
          title="Included in Klemera-Doubal Method (KDM) Biological Age Model"
          className={`font-mono font-extrabold rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 ${badgeClass}`}
        >
          KDM Age
        </span>
      )}

      {usage.hd && (
        <span 
          title="Included in Homeostatic Dysregulation (HD) Score Model"
          className={`font-mono font-extrabold rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 ${badgeClass}`}
        >
          HD Score
        </span>
      )}

      {usage.calico && (
        <span 
          title="Included in Calico Physiological Age Model"
          className={`font-mono font-extrabold rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 ${badgeClass}`}
        >
          Calico
        </span>
      )}

      {!isAlgoMarker && (
        <span 
          title="Specialty / Full Lab Panel Biomarker (Tracked outside longevity algorithms)"
          className={`font-mono font-extrabold rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 ${badgeClass}`}
        >
          Specialty Lab Marker
        </span>
      )}
    </div>
  )
}
