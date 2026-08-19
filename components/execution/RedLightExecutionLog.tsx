import React from 'react'
import { Sun, Shield, Activity, Target } from 'lucide-react'

export type RedLightExecutionDetails = {
  duration_min?: number | ''
  distance_inches?: number | ''
  target_area?: 'face' | 'thyroid' | 'full_body' | 'joint_muscle' | string
  wavelength_nir?: boolean
  notes?: string
}

type Props = {
  value: RedLightExecutionDetails
  onChange: (val: RedLightExecutionDetails) => void
}

const TARGET_AREAS = [
  { id: 'face', label: 'Face & Neck' },
  { id: 'thyroid', label: 'Thyroid / Chest' },
  { id: 'full_body', label: 'Full Body' },
  { id: 'joint_muscle', label: 'Joint / Muscle' },
]

export default function RedLightExecutionLog({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3 mt-3 p-3.5 bg-black/30 rounded-xl border border-red-500/20">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-red-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
          <Sun size={12} /> Photobiomodulation / Red Light Execution Log
        </div>
        {value.duration_min && (
          <div className="text-[11px] font-mono text-red-300 font-extrabold bg-red-950/60 border border-red-500/40 px-2 py-0.5 rounded">
            {value.duration_min} min session
          </div>
        )}
      </div>

      {/* Target Area Selector */}
      <div className="flex flex-wrap gap-1.5">
        {TARGET_AREAS.map((area) => {
          const isSelected = value.target_area === area.id
          return (
            <button
              key={area.id}
              type="button"
              onClick={() => onChange({ ...value, target_area: area.id })}
              className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors ${
                isSelected
                  ? 'bg-red-500/20 border-red-500 text-red-200 font-semibold'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {area.label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Duration (min)
          </label>
          <input
            type="number"
            min="1"
            placeholder="15"
            value={value.duration_min ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                duration_min: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-red-400 font-mono"
          />
        </div>

        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Distance (inches)
          </label>
          <input
            type="number"
            min="1"
            placeholder="6"
            value={value.distance_inches ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                distance_inches: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-red-400 font-mono"
          />
        </div>
      </div>
    </div>
  )
}
