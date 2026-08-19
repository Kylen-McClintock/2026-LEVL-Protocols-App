'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
  X, 
  GitBranch, 
  Plus, 
  Edit3, 
  MinusCircle, 
  CheckCircle2, 
  Share2, 
  Sparkles, 
  Layers, 
  Check, 
  Info
} from 'lucide-react'
import { Protocol, Modality } from '@/lib/types'
import { DedupedTask } from '@/components/cards/ProtocolTaskCard'

interface ProtocolVarianceModalProps {
  isOpen: boolean
  onClose: () => void
  protocolName: string
  protocolInfo?: Protocol | null
  groupTasks: DedupedTask[]
}

// Master reference blueprints for default protocols to detect variances
const ORIGINAL_BLUEPRINTS: Record<string, {
  author: string
  steps: { name: string; dose?: string }[]
}> = {
  'The Huberman Morning Routine': {
    author: 'Huberman Lab',
    steps: [
      { name: 'Morning Sunlight', dose: '10-30 min' },
      { name: 'Cold Water Immersion', dose: '1-3 min' },
      { name: 'Intermittent Fasting (16:8)', dose: '16 hours' }
    ]
  },
  'Deep Sleep Architecture Stack': {
    author: 'Curated Longevity Science',
    steps: [
      { name: 'Magnesium Glycinate', dose: '300-400 mg' },
      { name: 'Glycine', dose: '3 grams' },
      { name: 'Wind Down Routine', dose: '30-40 min' }
    ]
  },
  'Metabolic Reset': {
    author: 'Curated Longevity Science',
    steps: [
      { name: 'Resistance Training', dose: '45-60 min' },
      { name: 'Acarbose / Berberine', dose: '100mg / 500mg' },
      { name: 'Continuous Glucose Monitor (CGM)', dose: '24/7' }
    ]
  }
}

export default function ProtocolVarianceModal({
  isOpen,
  onClose,
  protocolName,
  protocolInfo,
  groupTasks
}: ProtocolVarianceModalProps) {
  const [mounted, setMounted] = useState(false)
  const [userEvolutionNotes, setUserEvolutionNotes] = useState('')
  const [isShared, setIsShared] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

  const blueprint = ORIGINAL_BLUEPRINTS[protocolName] || {
    author: protocolInfo?.source_id || 'Global Library',
    steps: []
  }

  // Active modalities in user's routine for this protocol
  const activeModalities = groupTasks.map(t => {
    const m = t.protocol_step?.modality || t.loose_modality
    const customDose = t.execution_details?.custom_dose || t.protocol_step?.dose_text || m?.dose_or_exposure || ''
    return {
      name: m?.name || 'Modality',
      dose: customDose,
      id: m?.id || ''
    }
  })

  // Compare active modalities against original blueprint
  const originalStepNames = blueprint.steps.map(s => s.name.toLowerCase())
  
  const addedSteps = activeModalities.filter(am => 
    !originalStepNames.some(orig => am.name.toLowerCase().includes(orig) || orig.includes(am.name.toLowerCase()))
  )

  const matchedSteps = activeModalities.filter(am => 
    originalStepNames.some(orig => am.name.toLowerCase().includes(orig) || orig.includes(am.name.toLowerCase()))
  )

  const omittedSteps = blueprint.steps.filter(orig => 
    !activeModalities.some(am => am.name.toLowerCase().includes(orig.name.toLowerCase()) || orig.name.toLowerCase().includes(am.name.toLowerCase()))
  )

  const handleShareProtocol = () => {
    setIsShared(true)
    setTimeout(() => {
      setIsShared(false)
    }, 4000)
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-levl-surface border border-indigo-500/40 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-[0_0_50px_rgba(99,102,241,0.2)] max-h-[90vh] overflow-y-auto relative my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
            <GitBranch size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Evolved Community Protocol</h3>
            <p className="text-xs text-gray-400">
              Personalized divergence from original {blueprint.author} blueprint
            </p>
          </div>
        </div>

        {/* Blueprint Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Base Blueprint */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Original {blueprint.author}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                {blueprint.steps.length} Steps
              </span>
            </div>
            <div className="space-y-2">
              {blueprint.steps.map((step, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                  <span className="text-gray-300 font-medium">{step.name}</span>
                  {step.dose && <span className="text-[10px] text-gray-500 font-mono">{step.dose}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* User's Active Personalized Protocol */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={12} /> Your Active Protocol
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">
                {activeModalities.length} Active Steps
              </span>
            </div>
            <div className="space-y-2">
              {activeModalities.map((mod, idx) => {
                const isCustomAddition = addedSteps.some(as => as.name === mod.name)
                return (
                  <div 
                    key={idx} 
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      isCustomAddition 
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                        : 'bg-white/5 border-white/5 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {isCustomAddition && <Plus size={12} className="text-emerald-400 shrink-0" />}
                      <span className="font-medium">{mod.name}</span>
                    </div>
                    {mod.dose && (
                      <span className={`text-[10px] font-mono ${isCustomAddition ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {mod.dose}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Delta Summary Badges */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
            Protocol Divergence Matrix
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {addedSteps.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <Plus size={13} />
                <span>Added {addedSteps.length} Modalities ({addedSteps.map(a => a.name).join(', ')})</span>
              </div>
            )}

            {omittedSteps.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
                <MinusCircle size={13} />
                <span>Omitted {omittedSteps.length} Blueprint Steps ({omittedSteps.map(o => o.name).join(', ')})</span>
              </div>
            )}

            {addedSteps.length === 0 && omittedSteps.length === 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold">
                <CheckCircle2 size={13} />
                <span>100% Aligned with Original {blueprint.author} Protocol</span>
              </div>
            )}
          </div>
        </div>

        {/* Evolution Notes Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Edit3 size={14} className="text-indigo-400" /> Personal Evolution Rationale & Notes
          </label>
          <textarea
            value={userEvolutionNotes}
            onChange={(e) => setUserEvolutionNotes(e.target.value)}
            placeholder="e.g. Added Zone 2 cardio post-light exposure to double morning lipid oxidation; increased cold plunge to 3 minutes for higher epinephrine release."
            rows={3}
            className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/10">
          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            <Info size={13} className="text-indigo-400" /> Sharing evolved protocols helps the community discover optimal variants!
          </p>

          <button
            onClick={handleShareProtocol}
            className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-900/40 flex items-center gap-2 cursor-pointer shrink-0"
          >
            {isShared ? <Check size={16} /> : <Share2 size={16} />}
            {isShared ? 'Evolved Protocol Published! 🚀' : 'Share Evolved Protocol'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  )
}
