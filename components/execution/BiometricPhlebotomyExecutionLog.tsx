import React from 'react'
import { Activity, Droplet, TestTube } from 'lucide-react'

export type BiometricPhlebotomyExecutionDetails = {
  volume_ml?: number | ''
  ferritin_ngml?: number | ''
  hemoglobin_gdl?: number | ''
  notes?: string
}

type Props = {
  value: BiometricPhlebotomyExecutionDetails
  onChange: (val: BiometricPhlebotomyExecutionDetails) => void
}

export default function BiometricPhlebotomyExecutionLog({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3 mt-3 p-3.5 bg-black/30 rounded-xl border border-rose-500/20">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-rose-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
          <TestTube size={12} /> Blood Donation & Therapeutic Phlebotomy Log
        </div>
        {value.volume_ml && (
          <div className="text-[11px] font-mono text-rose-300 font-extrabold bg-rose-950/60 border border-rose-500/40 px-2 py-0.5 rounded">
            {value.volume_ml} mL donated
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Volume Donated (mL)
          </label>
          <input
            type="number"
            min="100"
            max="1000"
            placeholder="500"
            value={value.volume_ml ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                volume_ml: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-sm text-white focus:outline-none focus:border-rose-400 font-mono"
          />
        </div>

        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Pre/Post Ferritin (ng/mL)
          </label>
          <input
            type="number"
            min="5"
            max="500"
            placeholder="45"
            value={value.ferritin_ngml ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                ferritin_ngml: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-sm text-white focus:outline-none focus:border-rose-400 font-mono"
          />
        </div>

        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Hemoglobin (g/dL)
          </label>
          <input
            type="number"
            min="5"
            max="25"
            placeholder="14.5"
            value={value.hemoglobin_gdl ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                hemoglobin_gdl: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-sm text-white focus:outline-none focus:border-rose-400 font-mono"
          />
        </div>
      </div>
    </div>
  )
}
