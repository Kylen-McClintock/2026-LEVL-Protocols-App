import React from 'react'
import { Utensils, Zap, Flame, Scale } from 'lucide-react'

export type NutritionMacroExecutionDetails = {
  meal1_protein_g?: number | ''
  meal2_protein_g?: number | ''
  meal3_protein_g?: number | ''
  meal4_protein_g?: number | ''
  total_protein_g?: number | ''
  leucine_threshold_met?: boolean
  notes?: string
}

type Props = {
  value: NutritionMacroExecutionDetails
  onChange: (val: NutritionMacroExecutionDetails) => void
}

export default function NutritionMacroExecutionLog({ value, onChange }: Props) {
  const meal1 = typeof value.meal1_protein_g === 'number' ? value.meal1_protein_g : 0
  const meal2 = typeof value.meal2_protein_g === 'number' ? value.meal2_protein_g : 0
  const meal3 = typeof value.meal3_protein_g === 'number' ? value.meal3_protein_g : 0
  const meal4 = typeof value.meal4_protein_g === 'number' ? value.meal4_protein_g : 0
  const calculatedTotal = meal1 + meal2 + meal3 + meal4

  return (
    <div className="flex flex-col gap-3 mt-3 p-3.5 bg-black/30 rounded-xl border border-amber-500/20">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-amber-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
          <Utensils size={12} /> Precision Protein & Macro Distribution Log
        </div>
        {calculatedTotal > 0 && (
          <div className="text-[11px] font-mono text-amber-300 font-extrabold bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
            Total Protein: {calculatedTotal}g
          </div>
        )}
      </div>

      {/* Meal Bolus Protein Inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Meal 1 (g)
          </label>
          <input
            type="number"
            min="0"
            placeholder="40"
            value={value.meal1_protein_g ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                meal1_protein_g: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>

        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Meal 2 (g)
          </label>
          <input
            type="number"
            min="0"
            placeholder="40"
            value={value.meal2_protein_g ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                meal2_protein_g: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>

        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Meal 3 (g)
          </label>
          <input
            type="number"
            min="0"
            placeholder="40"
            value={value.meal3_protein_g ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                meal3_protein_g: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>

        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Meal 4 (g)
          </label>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={value.meal4_protein_g ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                meal4_protein_g: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/10 flex-wrap">
        {/* Leucine Threshold Toggle */}
        <button
          type="button"
          onClick={() => onChange({ ...value, leucine_threshold_met: !value.leucine_threshold_met })}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
            value.leucine_threshold_met
              ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <Zap size={12} className={value.leucine_threshold_met ? 'text-amber-400' : 'text-slate-500'} />
          <span>≥3g Leucine Threshold per Bolus Met</span>
        </button>

        {/* Custom Target Total Protein */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Target (g):</span>
          <input
            type="number"
            placeholder="160"
            value={value.total_protein_g ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                total_protein_g: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-20 h-8 bg-white/5 border border-white/10 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>
      </div>
    </div>
  )
}
