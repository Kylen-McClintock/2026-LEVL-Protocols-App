import React from 'react'
import { Droplet, Zap, Shield } from 'lucide-react'

export type HydrationElectrolyteExecutionDetails = {
  water_oz?: number | ''
  sodium_mg?: number | ''
  potassium_mg?: number | ''
  magnesium_mg?: number | ''
  notes?: string
}

type Props = {
  value: HydrationElectrolyteExecutionDetails
  onChange: (val: HydrationElectrolyteExecutionDetails) => void
}

export default function HydrationElectrolyteExecutionLog({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3 mt-3 p-3.5 bg-black/30 rounded-xl border border-blue-500/20">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-blue-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
          <Droplet size={12} /> Hydration & Electrolyte Intake Log
        </div>
        {value.water_oz && (
          <div className="text-[11px] font-mono text-blue-300 font-extrabold bg-blue-950/60 border border-blue-500/40 px-2 py-0.5 rounded">
            {value.water_oz} oz total
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Water Volume (oz)
          </label>
          <input
            type="number"
            min="0"
            placeholder="32"
            value={value.water_oz ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                water_oz: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-sm text-white focus:outline-none focus:border-blue-400 font-mono"
          />
        </div>

        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Sodium (mg)
          </label>
          <input
            type="number"
            min="0"
            placeholder="1000"
            value={value.sodium_mg ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                sodium_mg: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-sm text-white focus:outline-none focus:border-blue-400 font-mono"
          />
        </div>

        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Potassium (mg)
          </label>
          <input
            type="number"
            min="0"
            placeholder="200"
            value={value.potassium_mg ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                potassium_mg: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-sm text-white focus:outline-none focus:border-blue-400 font-mono"
          />
        </div>

        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Magnesium (mg)
          </label>
          <input
            type="number"
            min="0"
            placeholder="100"
            value={value.magnesium_mg ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                magnesium_mg: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-sm text-white focus:outline-none focus:border-blue-400 font-mono"
          />
        </div>
      </div>
    </div>
  )
}
