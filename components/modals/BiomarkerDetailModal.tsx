'use client'

import React, { useState, useEffect } from 'react'
import { X, Check, Activity, ShieldCheck, Zap, Plus, ArrowRight, BookOpen } from 'lucide-react'
import { BIOMARKER_REGISTRY } from '@/lib/aging-models/biomarkerRegistry'
import { BiomarkerMeasurementRecord } from '@/lib/aging-models/bioAgeTypes'
import { getModalities, getBenchItems, addToBench } from '@/lib/data'
import BiomarkerRangeVisual from '@/components/ui/BiomarkerRangeVisual'

interface BiomarkerDetailModalProps {
  isOpen: boolean
  onClose: () => void
  biomarkerId: string
  userId: string
  measurements: BiomarkerMeasurementRecord[]
  onProtocolUpdated?: () => void
}

export default function BiomarkerDetailModal({
  isOpen,
  onClose,
  biomarkerId,
  userId,
  measurements,
  onProtocolUpdated
}: BiomarkerDetailModalProps) {
  const [benchItems, setBenchItems] = useState<any[]>([])
  const [allModalities, setAllModalities] = useState<any[]>([])
  const [addingModalityId, setAddingModalityId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && userId) {
      getBenchItems(userId).then(items => setBenchItems(items))
      getModalities().then(m => setAllModalities(m))
    }
  }, [isOpen, userId])

  if (!isOpen) return null

  const def = BIOMARKER_REGISTRY[biomarkerId]
  const history = measurements.filter(m => m.biomarker_id === biomarkerId)
  const latest = history[0]

  if (!def || !latest) return null

  const isOptimal = latest.normalized_value >= def.levl_optimal_zone.min && latest.normalized_value <= def.levl_optimal_zone.max

  // Find relevant existing LEVL modalities matching this biomarker's system
  const relevantModalities = allModalities.filter(m => {
    const sys = def.system
    return m.category?.toLowerCase().includes(sys) || 
      m.name?.toLowerCase().includes(def.id) ||
      m.description?.toLowerCase().includes(def.id)
  }).slice(0, 4)

  const activeModalityIds = benchItems.map(b => b.modality_id)

  const handleAddModality = async (modalityId: string) => {
    setAddingModalityId(modalityId)
    try {
      await addToBench(userId, modalityId)
      const updatedBench = await getBenchItems(userId)
      setBenchItems(updatedBench)
      if (onProtocolUpdated) onProtocolUpdated()
    } catch (err) {
      console.error('Error adding modality to bench:', err)
    } finally {
      setAddingModalityId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {def.system} Biological System
              </span>
              {def.bioage_model_usage.phenoage && (
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  PhenoAge Biomarker
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{def.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Visual Range Spectrum Component */}
        <BiomarkerRangeVisual
          value={latest.normalized_value}
          unit={latest.normalized_unit}
          standardMin={def.standard_lab_range.min}
          standardMax={def.standard_lab_range.max}
          optimalMin={def.levl_optimal_zone.min}
          optimalMax={def.levl_optimal_zone.max}
          biomarkerName={def.name}
          studyCitation={def.study_citation}
          studyUrl={def.study_url}
          showLabels={true}
        />

        {/* Range Comparison Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400">Standard Lab Reference Range</span>
            <div className="text-base font-bold font-mono text-gray-200">{def.standard_lab_range.display}</div>
            <p className="text-[10px] text-gray-500">Broad population diagnostic reference limits.</p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
            <span className="text-[10px] uppercase font-bold text-indigo-300">LEVL Longevity Optimization Zone</span>
            <div className="text-base font-bold font-mono text-white">{def.levl_optimal_zone.display}</div>
            <p className="text-[10px] text-indigo-200 leading-snug">{def.levl_optimal_zone.longevity_rationale}</p>
          </div>
        </div>

        {/* Longevity Importance Explanation */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={16} className="text-indigo-400" /> Why This Biomarker Matters for Longevity:
          </h4>
          <p className="text-xs text-gray-300 leading-relaxed">{def.longevity_importance}</p>
        </div>

        {/* LEVL Active Protocol & Modality Recommendations Integration */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="text-amber-400" size={16} /> Targeted LEVL Modalities & Active Protocol:
          </h4>

          <div className="space-y-2">
            {relevantModalities.map(m => {
              const isAlreadyActive = activeModalityIds.includes(m.id)
              return (
                <div key={m.id} className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-bold text-white">{m.name}</h5>
                      {isAlreadyActive && (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Check size={10} /> Currently in Active Protocol
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-1">{m.description}</p>
                  </div>

                  {!isAlreadyActive && (
                    <button
                      type="button"
                      disabled={addingModalityId === m.id}
                      onClick={() => handleAddModality(m.id)}
                      className="px-3 py-1.5 rounded-lg bg-levl-accent hover:bg-levl-accent/90 text-white font-bold text-xs shadow transition-all flex items-center gap-1 shrink-0"
                    >
                      <Plus size={14} /> Add to Active Protocol
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
