'use client'

import React, { useState } from 'react'
import { X, Search, Filter, TestTube, Sparkles, SlidersHorizontal, BookOpen } from 'lucide-react'
import { BiomarkerMeasurementRecord } from '@/lib/aging-models/bioAgeTypes'
import { BIOMARKER_REGISTRY } from '@/lib/aging-models/biomarkerRegistry'
import BiomarkerRangeVisual from '@/components/ui/BiomarkerRangeVisual'
import BiomarkerAlgorithmBadges from '@/components/ui/BiomarkerAlgorithmBadges'

interface AllBiomarkersModalProps {
  isOpen: boolean
  onClose: () => void
  biomarkers: BiomarkerMeasurementRecord[]
}

export default function AllBiomarkersModal({
  isOpen,
  onClose,
  biomarkers
}: AllBiomarkersModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'algo' | 'specialty'>('all')

  if (!isOpen) return null

  // Deduplicate measurements by biomarker_id to show latest, but preserve raw values
  const latestBiomarkersMap = new Map<string, BiomarkerMeasurementRecord>()
  biomarkers.forEach(b => {
    if (!latestBiomarkersMap.has(b.biomarker_id)) {
      latestBiomarkersMap.set(b.biomarker_id, b)
    }
  })

  const uniqueBiomarkers = Array.from(latestBiomarkersMap.values())

  // Filter based on search query and filter type
  const filteredBiomarkers = uniqueBiomarkers.filter(b => {
    const def = BIOMARKER_REGISTRY[b.biomarker_id]
    const name = def?.name || b.raw_name || b.biomarker_id
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || b.raw_name.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    const usage = def?.bioage_model_usage || { phenoage: false, kdm: false, hd: false, calico: false }
    const isAlgo = usage.phenoage || usage.kdm || usage.hd || usage.calico

    if (filterType === 'algo') return isAlgo
    if (filterType === 'specialty') return !isAlgo
    return true
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <TestTube className="text-indigo-400" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Full Lab Profile
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">All Extracted & Uploaded Biomarkers ({uniqueBiomarkers.length})</h2>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Algorithm Usage Legend & Explanation */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" /> Longevity Algorithm & Specialty Biomarker Indicators
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Every biomarker displays color-coded badges indicating its inclusion in Levine Phenotypic Age (<span className="text-purple-300 font-mono font-bold">PhenoAge</span>), Klemera-Doubal Method (<span className="text-indigo-300 font-mono font-bold">KDM Age</span>), Homeostatic Dysregulation (<span className="text-cyan-300 font-mono font-bold">HD Score</span>), or Calico (<span className="text-emerald-300 font-mono font-bold">Calico</span>). Biomarkers like <strong className="text-white">Testosterone</strong>, <strong className="text-white">Vitamin D3</strong>, <strong className="text-white">Fasting Insulin</strong>, and <strong className="text-white">Homocysteine</strong> are marked as <span className="text-amber-300 font-mono font-bold">Specialty Lab Markers</span>.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by biomarker name (e.g. Testosterone, ApoB, Vitamin D)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 text-xs shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterType === 'all' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              All ({uniqueBiomarkers.length})
            </button>
            <button
              onClick={() => setFilterType('algo')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterType === 'algo' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Algorithm Markers
            </button>
            <button
              onClick={() => setFilterType('specialty')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterType === 'specialty' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Specialty Markers
            </button>
          </div>
        </div>

        {/* Biomarkers Spectrum List */}
        <div className="space-y-3">
          {filteredBiomarkers.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white/5 border border-white/5 text-center text-xs text-gray-400">
              No biomarkers match your search query or filter selection.
            </div>
          ) : (
            filteredBiomarkers.map(b => {
              const def = BIOMARKER_REGISTRY[b.biomarker_id]
              const name = def?.name || b.raw_name || b.biomarker_id
              const stdMin = def?.standard_lab_range.min ?? 0
              const stdMax = def?.standard_lab_range.max ?? 100
              const optMin = def?.levl_optimal_zone.min ?? stdMin
              const optMax = def?.levl_optimal_zone.max ?? stdMax

              return (
                <BiomarkerRangeVisual
                  key={b.id || b.biomarker_id}
                  value={b.normalized_value}
                  unit={b.normalized_unit || def?.primary_unit || ''}
                  standardMin={stdMin}
                  standardMax={stdMax}
                  optimalMin={optMin}
                  optimalMax={optMax}
                  biomarkerName={name}
                  biomarkerId={b.biomarker_id}
                  studyCitation={def?.study_citation}
                  studyUrl={def?.study_url}
                  showLabels={true}
                />
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
