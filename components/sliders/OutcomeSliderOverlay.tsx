'use client'

import { useState } from 'react'
import { OutcomeDimension, Modality } from '@/lib/types'
import { X, Clock } from 'lucide-react'
import { getOutcomeColorConfig, getNeutralOutcomeColorConfig } from '@/lib/utils/outcomeColors'
import { isPreLoggableOutcome, hasAnyPreLoggableOutcome, getOutcomePhaseType } from '@/lib/utils/outcomePhaseRules'
import { getPeakOnsetGuidance } from '@/lib/utils/peakOnsetGuidance'

type OutcomeSliderOverlayProps = {
  outcomes: OutcomeDimension[]
  modality?: Modality | null
  onSave: (values: Record<string, number>, phase: string) => void
  onClose: () => void
  defaultPhase?: 'pre' | 'post' | 'next_day'
}

export default function OutcomeSliderOverlay({ outcomes, modality, onSave, onClose, defaultPhase = 'post' }: OutcomeSliderOverlayProps) {
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

        {/* Peak Onset & Optimal Recording Time Banner */}
        {(() => {
          const guidance = getPeakOnsetGuidance(modality)
          return (
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-2.5 text-xs text-slate-300 backdrop-blur-sm mb-4">
              <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Clock size={13} />
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-white">Best time to record:</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30">
                    {guidance.bestTimeToLog}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {guidance.subtitle}
                </p>
              </div>
            </div>
          )
        })()}

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
                  <button
                    type="button"
                    onClick={() => setTouched(prev => ({ ...prev, [outcome.id]: !prev[outcome.id] }))}
                    className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all group"
                    title="Click to confirm this value without sliding"
                  >
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${isTouched ? colorCfg.badgeBg : 'bg-white/5 border-white/15 text-slate-400 group-hover:border-white/30'}`}>
                      {isTouched ? colorCfg.qualityLabel : 'Unconfirmed (Tap)'}
                    </span>
                    <span className={`font-mono font-bold ${isTouched ? colorCfg.textColor : 'text-slate-400'}`}>{val}/10</span>
                  </button>
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
