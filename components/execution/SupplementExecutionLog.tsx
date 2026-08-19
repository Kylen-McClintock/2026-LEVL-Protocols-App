import React from 'react'
import { Pill, Coffee, Droplets, CheckCircle } from 'lucide-react'

export type SupplementExecutionDetails = {
  custom_dose?: string
  timing_context?: 'fasted' | 'with_meal' | 'before_bed' | 'post_workout' | string
  water_oz?: number | ''
  stack_notes?: string
}

type Props = {
  value: SupplementExecutionDetails
  onChange: (val: SupplementExecutionDetails) => void
}

const TIMING_CONTEXTS = [
  { id: 'fasted', label: 'Fasted (Empty Stomach)' },
  { id: 'with_meal', label: 'With Meal / Fat Source' },
  { id: 'before_bed', label: '30-60m Before Sleep' },
  { id: 'post_workout', label: 'Post-Workout' },
]

export default function SupplementExecutionLog({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3 mt-3 p-3 bg-black/20 rounded-lg border border-white/5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-levl-text-secondary uppercase tracking-wider font-bold">
          Precision Supplement & Stack Log
        </div>
        {value.timing_context && (
          <div className="text-[10px] text-levl-accent font-bold capitalize">
            {value.timing_context.replace('_', ' ')}
          </div>
        )}
      </div>

      {/* Timing Context Pills */}
      <div className="flex flex-wrap gap-1.5">
        {TIMING_CONTEXTS.map((ctx) => {
          const isSelected = value.timing_context === ctx.id
          return (
            <button
              key={ctx.id}
              type="button"
              onClick={() => onChange({ ...value, timing_context: ctx.id })}
              className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors ${
                isSelected
                  ? 'bg-levl-accent/20 border-levl-accent text-white font-semibold'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {ctx.label}
            </button>
          )
        })}
      </div>

      <div className="w-full h-px bg-white/10 my-1" />

      {/* Dose & Water Input */}
      <div className="flex flex-wrap items-center gap-2 w-full">
        <div className="flex-[2] min-w-[120px]">
          <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
            <Pill size={10} className="text-levl-accent" /> Logged Dosage
          </label>
          <input
            type="text"
            placeholder="e.g. 1 scoop (19.325g) or 1000mg"
            value={value.custom_dose || ''}
            onChange={(e) => onChange({ ...value, custom_dose: e.target.value })}
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
          />
        </div>

        <div className="flex-1 min-w-[90px]">
          <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
            <Droplets size={10} className="text-blue-400" /> Water (oz)
          </label>
          <input
            type="number"
            min="0"
            placeholder="12"
            value={value.water_oz ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                water_oz: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0),
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
          />
        </div>
      </div>
    </div>
  )
}
