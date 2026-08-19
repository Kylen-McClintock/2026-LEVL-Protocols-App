import React from 'react'
import { Sun, CloudSun, Clock, Eye } from 'lucide-react'

export type SunlightCircadianExecutionDetails = {
  duration_min?: number | ''
  sky_condition?: 'direct_sun' | 'overcast' | 'cloudy' | string
  within_30m_waking?: boolean
  notes?: string
}

type Props = {
  value: SunlightCircadianExecutionDetails
  onChange: (val: SunlightCircadianExecutionDetails) => void
}

const SKY_CONDITIONS = [
  { id: 'direct_sun', label: '☀️ Direct Sun (~10,000+ Lux)' },
  { id: 'overcast', label: '⛅ Overcast / Partial (~5,000 Lux)' },
  { id: 'cloudy', label: '☁️ Heavy Clouds (~1,000 Lux)' },
]

export default function SunlightCircadianExecutionLog({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3 mt-3 p-3.5 bg-black/30 rounded-xl border border-yellow-500/20">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-yellow-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
          <Sun size={12} /> Sunlight & Circadian Photic Exposure Log
        </div>
        {value.duration_min && (
          <div className="text-[11px] font-mono text-yellow-300 font-extrabold bg-yellow-950/60 border border-yellow-500/40 px-2 py-0.5 rounded">
            {value.duration_min} min outdoors
          </div>
        )}
      </div>

      {/* Sky Condition / Lux Selector */}
      <div className="flex flex-wrap gap-1.5">
        {SKY_CONDITIONS.map((cond) => {
          const isSelected = value.sky_condition === cond.id
          return (
            <button
              key={cond.id}
              type="button"
              onClick={() => onChange({ ...value, sky_condition: cond.id })}
              className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors ${
                isSelected
                  ? 'bg-yellow-500/20 border-yellow-400 text-yellow-200 font-semibold'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {cond.label}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/10 flex-wrap">
        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Duration Outdoors (min)
          </label>
          <input
            type="number"
            min="1"
            placeholder="10"
            value={value.duration_min ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                duration_min: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-32 h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-yellow-400 font-mono"
          />
        </div>

        {/* Within 30m Waking Toggle */}
        <button
          type="button"
          onClick={() => onChange({ ...value, within_30m_waking: !value.within_30m_waking })}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
            value.within_30m_waking
              ? 'bg-yellow-500/25 border-yellow-400 text-yellow-200 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <Clock size={12} className={value.within_30m_waking ? 'text-yellow-400' : 'text-slate-500'} />
          <span>Completed Within 30m of Waking</span>
        </button>
      </div>
    </div>
  )
}
