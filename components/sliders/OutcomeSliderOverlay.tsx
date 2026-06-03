'use client'

import { useState } from 'react'
import { OutcomeDimension } from '@/lib/types'
import { X } from 'lucide-react'

type OutcomeSliderOverlayProps = {
  outcomes: OutcomeDimension[]
  onSave: (values: Record<string, number>) => void
  onClose: () => void
}

export default function OutcomeSliderOverlay({ outcomes, onSave, onClose }: OutcomeSliderOverlayProps) {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    outcomes.forEach(o => init[o.id] = 5)
    return init
  })

  const handleChange = (id: string, val: number) => {
    setValues(prev => ({ ...prev, [id]: val }))
  }

  const handleSave = () => {
    onSave(values)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 pb-safe animate-in fade-in">
      <div className="bg-levl-bg border border-levl-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative slide-in-from-bottom-10">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-levl-text-secondary hover:text-white"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-bold mb-6">Track Outcomes</h3>

        <div className="space-y-6">
          {outcomes.map(outcome => (
            <div key={outcome.id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white">{outcome.name}</span>
                <span className="text-levl-accent font-medium">{values[outcome.id]}/10</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="10" 
                value={values[outcome.id]} 
                onChange={(e) => handleChange(outcome.id, parseInt(e.target.value))} 
                className="w-full accent-levl-accent" 
              />
              <div className="flex justify-between text-[10px] text-levl-text-secondary">
                <span>{outcome.directionality === 'lower_is_better' ? 'Good' : 'Poor'}</span>
                <span>{outcome.directionality === 'lower_is_better' ? 'Poor' : 'Good'}</span>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-levl-accent text-white font-medium py-3 rounded-lg mt-8"
        >
          Save Observations
        </button>
      </div>
    </div>
  )
}
