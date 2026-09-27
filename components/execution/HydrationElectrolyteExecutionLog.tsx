import React from 'react'
import { Droplet } from 'lucide-react'
import { useTheme } from '@/lib/utils/useTheme'

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
  const { isLight } = useTheme()

  return (
    <div className={`flex flex-col gap-3 mt-3 p-3.5 rounded-xl border ${
      isLight
        ? 'bg-[#F0F9FF] border-[#BAE6FD] shadow-xs'
        : 'bg-black/30 border-blue-500/20'
    }`}>
      <div className="flex items-center justify-between">
        <div className={`text-[10px] uppercase tracking-wider font-bold flex items-center gap-1.5 ${
          isLight ? 'text-sky-700' : 'text-blue-400'
        }`}>
          <Droplet size={12} /> Hydration &amp; Electrolyte Intake Log
        </div>
        {value.water_oz && (
          <div className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded border ${
            isLight
              ? 'text-sky-900 bg-sky-100 border-sky-300'
              : 'text-blue-300 bg-blue-950/60 border-blue-500/40'
          }`}>
            {value.water_oz} oz total
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <label className={`text-[9px] uppercase font-semibold ml-1 block mb-1 ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
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
            className={`w-full h-9 rounded-lg px-2.5 text-sm font-mono focus:outline-none ${
              isLight
                ? 'bg-white border border-[#E1E8E3] text-[#1e293b] focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 shadow-xs'
                : 'bg-white/5 border border-white/10 text-white focus:border-blue-400'
            }`}
          />
        </div>

        <div>
          <label className={`text-[9px] uppercase font-semibold ml-1 block mb-1 ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
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
            className={`w-full h-9 rounded-lg px-2.5 text-sm font-mono focus:outline-none ${
              isLight
                ? 'bg-white border border-[#E1E8E3] text-[#1e293b] focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 shadow-xs'
                : 'bg-white/5 border border-white/10 text-white focus:border-blue-400'
            }`}
          />
        </div>

        <div>
          <label className={`text-[9px] uppercase font-semibold ml-1 block mb-1 ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
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
            className={`w-full h-9 rounded-lg px-2.5 text-sm font-mono focus:outline-none ${
              isLight
                ? 'bg-white border border-[#E1E8E3] text-[#1e293b] focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 shadow-xs'
                : 'bg-white/5 border border-white/10 text-white focus:border-blue-400'
            }`}
          />
        </div>

        <div>
          <label className={`text-[9px] uppercase font-semibold ml-1 block mb-1 ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
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
            className={`w-full h-9 rounded-lg px-2.5 text-sm font-mono focus:outline-none ${
              isLight
                ? 'bg-white border border-[#E1E8E3] text-[#1e293b] focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 shadow-xs'
                : 'bg-white/5 border border-white/10 text-white focus:border-blue-400'
            }`}
          />
        </div>
      </div>
    </div>
  )
}
