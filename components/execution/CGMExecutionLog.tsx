import React from 'react'
import { Activity, Footprints, Flame } from 'lucide-react'

export type CGMExecutionDetails = {
  fasting_glucose_mgdl?: number | ''
  post_meal_peak_mgdl?: number | ''
  clearance_time_min?: number | ''
  walk_duration_min?: number | ''
  notes?: string
}

type Props = {
  value: CGMExecutionDetails
  onChange: (val: CGMExecutionDetails) => void
}

export default function CGMExecutionLog({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3 mt-3 p-3.5 bg-black/30 rounded-xl border border-teal-500/20">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-teal-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
          <Activity size={12} /> CGM & Postprandial Glucose Clearance Log
        </div>
        {value.post_meal_peak_mgdl && (
          <div className="text-[11px] font-mono text-teal-300 font-extrabold bg-teal-950/60 border border-teal-500/40 px-2 py-0.5 rounded">
            Peak: {value.post_meal_peak_mgdl} mg/dL
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Fasting Glucose (mg/dL)
          </label>
          <input
            type="number"
            min="40"
            max="250"
            placeholder="85"
            value={value.fasting_glucose_mgdl ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                fasting_glucose_mgdl: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-sm text-white focus:outline-none focus:border-teal-400 font-mono"
          />
        </div>

        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Post-Meal Peak (mg/dL)
          </label>
          <input
            type="number"
            min="40"
            max="300"
            placeholder="115"
            value={value.post_meal_peak_mgdl ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                post_meal_peak_mgdl: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-sm text-white focus:outline-none focus:border-teal-400 font-mono"
          />
        </div>

        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Clearance Time (min)
          </label>
          <input
            type="number"
            min="5"
            placeholder="45"
            value={value.clearance_time_min ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                clearance_time_min: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-sm text-white focus:outline-none focus:border-teal-400 font-mono"
          />
        </div>

        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
            <Footprints size={10} className="text-teal-400" /> Walk Duration (min)
          </label>
          <input
            type="number"
            min="1"
            placeholder="15"
            value={value.walk_duration_min ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                walk_duration_min: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-sm text-white focus:outline-none focus:border-teal-400 font-mono"
          />
        </div>
      </div>
    </div>
  )
}
