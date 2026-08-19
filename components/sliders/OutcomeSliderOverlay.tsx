'use client'

import { useState } from 'react'
import { OutcomeDimension } from '@/lib/types'
import { X } from 'lucide-react'
import { getOutcomeColorConfig, getNeutralOutcomeColorConfig } from '@/lib/utils/outcomeColors'
import { isPreLoggableOutcome, hasAnyPreLoggableOutcome, getOutcomePhaseType } from '@/lib/utils/outcomePhaseRules'

type OutcomeSliderOverlayProps = {
  outcomes: OutcomeDimension[]
  onSave: (values: Record<string, number>, phase: string) => void
  onClose: () => void
  defaultPhase?: 'pre' | 'post' | 'next_day'
}

export default function OutcomeSliderOverlay({ outcomes, onSave, onClose, defaultPhase = 'post' }: OutcomeSliderOverlayProps) {
  const [isSaving, setIsSaving] = useState(false)
  const hasPreLoggable = hasAnyPreLoggableOutcome(outcomes)
  const effectiveDefaultPhase = (!hasPreLoggable && defaultPhase === 'pre') ? 'post' : defaultPhase

  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    outcomes.forEach(o => init[o.id] = 5)
    return init
  })
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // We only toggle between before/after here. Next Day is handled separately via Follow Up cards.
  const [phase, setPhase] = useState<'pre' | 'post' | 'next_day'>(effectiveDefaultPhase)

  const visibleOutcomes = phase === 'pre' ? outcomes.filter(o => isPreLoggableOutcome(o.id)) : outcomes

  const handleChange = (id: string, val: number) => {
    setValues(prev => ({ ...prev, [id]: val }))
    setTouched(prev => ({ ...prev, [id]: true }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    const savedValues: Record<string, number> = {}
    Object.entries(values).forEach(([id, val]) => {
      if (touched[id]) {
        savedValues[id] = val
      }
    })
    await onSave(savedValues, phase)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-4 pb-safe animate-in fade-in">
      <div className="bg-levl-bg border border-levl-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative slide-in-from-bottom-10">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-levl-text-secondary hover:text-white"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-bold mb-4 text-white">
          {phase === 'pre' ? 'Log Baseline (Before Modality)' : 'How Do You Feel?'}
        </h3>

        {defaultPhase !== 'next_day' && hasPreLoggable && (
          <div className="flex bg-black/40 border border-white/10 rounded-lg p-1 mb-6 text-xs font-medium">
            <button 
              onClick={() => setPhase('pre')}
              className={`flex-1 py-1.5 rounded-md transition-colors ${phase === 'pre' ? 'bg-levl-accent text-white font-bold' : 'text-levl-text-secondary hover:text-white'}`}
            >
              Before Modality
            </button>
            <button 
              onClick={() => setPhase('post')}
              className={`flex-1 py-1.5 rounded-md transition-colors ${phase === 'post' ? 'bg-levl-accent text-white font-bold' : 'text-levl-text-secondary hover:text-white'}`}
            >
              After Modality
            </button>
          </div>
        )}

        <div className="space-y-6">
          {visibleOutcomes.map(outcome => {
            const val = values[outcome.id] ?? 5
            const isTouched = touched[outcome.id]
            const colorCfg = isTouched ? getOutcomeColorConfig(val, outcome.directionality) : getNeutralOutcomeColorConfig()
            const isLowerBetter = outcome.directionality === 'lower_is_better'

            return (
              <div key={outcome.id} className="space-y-2 bg-white/5 p-3.5 rounded-xl border border-white/5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white font-bold">{outcome.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorCfg.badgeBg}`}>
                      {colorCfg.qualityLabel}
                    </span>
                    <span className={`font-mono font-bold ${colorCfg.textColor}`}>{val}/10</span>
                  </div>
                </div>
                
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  value={val} 
                  onChange={(e) => handleChange(outcome.id, parseInt(e.target.value))} 
                  className="w-full cursor-pointer" 
                  style={{ accentColor: colorCfg.accentHex }}
                />
                
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className={isLowerBetter ? 'text-emerald-400' : 'text-red-400'}>
                    0: {isLowerBetter ? 'Best (None)' : 'Poor (Low)'}
                  </span>
                  <span className={isLowerBetter ? 'text-red-400' : 'text-emerald-400'}>
                    10: {isLowerBetter ? 'Worst (Severe)' : 'Peak (Best)'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-levl-accent hover:bg-levl-accent/90 text-white font-bold py-3.5 rounded-xl mt-8 disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-levl-accent/20"
        >
          {isSaving ? 'Saving Observations...' : 'Save Observations'}
        </button>
      </div>
    </div>
  )
}
