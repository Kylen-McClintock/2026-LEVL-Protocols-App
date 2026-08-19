import React from 'react'
import { Moon, Thermometer, Clock, ShieldCheck } from 'lucide-react'

export type SleepHygieneExecutionDetails = {
  room_temp_f?: number | ''
  sleep_latency_min?: number | ''
  blackout_darkness_score?: number | ''
  mouth_tape_used?: boolean
  notes?: string
}

type Props = {
  value: SleepHygieneExecutionDetails
  onChange: (val: SleepHygieneExecutionDetails) => void
}

export default function SleepHygieneExecutionLog({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3 mt-3 p-3.5 bg-black/30 rounded-xl border border-indigo-500/20">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
          <Moon size={12} /> Sleep Environment & Hygiene Log
        </div>
        {value.room_temp_f && (
          <div className="text-[11px] font-mono text-indigo-300 font-extrabold bg-indigo-950/60 border border-indigo-500/40 px-2 py-0.5 rounded flex items-center gap-1">
            <Thermometer size={10} /> {value.room_temp_f}°F
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Room Temp (°F)
          </label>
          <input
            type="number"
            min="55"
            max="80"
            placeholder="65"
            value={value.room_temp_f ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                room_temp_f: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-sm text-white focus:outline-none focus:border-indigo-400 font-mono"
          />
        </div>

        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Sleep Latency (min)
          </label>
          <input
            type="number"
            min="1"
            placeholder="15"
            value={value.sleep_latency_min ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                sleep_latency_min: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-sm text-white focus:outline-none focus:border-indigo-400 font-mono"
          />
        </div>

        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Darkness Score (1-10)
          </label>
          <input
            type="number"
            min="1"
            max="10"
            placeholder="10"
            value={value.blackout_darkness_score ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                blackout_darkness_score: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-sm text-white focus:outline-none focus:border-indigo-400 font-mono"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-white/10">
        <button
          type="button"
          onClick={() => onChange({ ...value, mouth_tape_used: !value.mouth_tape_used })}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
            value.mouth_tape_used
              ? 'bg-indigo-500/25 border-indigo-400 text-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck size={12} className={value.mouth_tape_used ? 'text-indigo-400' : 'text-slate-500'} />
          <span>Sleep Mouth Tape Applied</span>
        </button>
      </div>
    </div>
  )
}
