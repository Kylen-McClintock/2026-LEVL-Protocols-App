import React from 'react'
import { Moon, Eye, Glasses, Smartphone, Sunset, CheckCircle2, Shield } from 'lucide-react'

export type BlueLightDimmingExecutionDetails = {
  dimming_method?: 'amber_glasses' | 'screen_curfew' | 'ambient_amber' | 'software_filter' | string
  pre_bed_window_min?: number | ''
  lux_level?: 'virtual_darkness' | 'dim_ambient' | 'moderate' | string
  overhead_lights_off?: boolean
  screen_brightness_minimized?: boolean
  notes?: string
}

type Props = {
  value: BlueLightDimmingExecutionDetails
  onChange: (val: BlueLightDimmingExecutionDetails) => void
}

const DIMMING_METHODS = [
  { id: 'amber_glasses', label: '👓 Amber / Red Lenses (500nm+ Cutoff)', desc: 'High mDFD biological darkness' },
  { id: 'screen_curfew', label: '📵 Screen Curfew (Zero Digital Displays)', desc: 'Total digital sunset' },
  { id: 'ambient_amber', label: '🕯️ Amber Ambient / Low-Lux Bulbs', desc: 'No overhead white LEDs' },
  { id: 'software_filter', label: '📱 Night Shift / True Red OLED Filter', desc: 'Software screen attenuation' },
]

const LUX_LEVELS = [
  { id: 'virtual_darkness', label: '🌑 <10 Lux (Ideal DLMO)', desc: 'Maximum pineal melatonin onset' },
  { id: 'dim_ambient', label: '🕯️ 10–50 Lux (Warm / Dim)', desc: 'Low ipRGC photic stimulation' },
  { id: 'moderate', label: '💡 >50 Lux (Elevated Light)', desc: 'Suboptimal evening exposure' },
]

const PRE_BED_WINDOWS = [60, 90, 120, 180]

export default function BlueLightDimmingExecutionLog({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3 mt-3 p-3.5 bg-black/40 rounded-xl border border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.08)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-amber-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
          <Sunset size={13} className="text-amber-400" /> Melatonin Onset & Blue-Light Shielding Log
        </div>
        {value.pre_bed_window_min && (
          <div className="text-[11px] font-mono text-amber-300 font-extrabold bg-amber-950/60 border border-amber-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Moon size={11} /> {value.pre_bed_window_min} min pre-bed
          </div>
        )}
      </div>

      {/* Dimming / Shielding Method Selector */}
      <div>
        <label className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block mb-1.5">
          Primary Shielding / Dimming Method
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {DIMMING_METHODS.map((m) => {
            const isSelected = value.dimming_method === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onChange({ ...value, dimming_method: m.id })}
                className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold">{m.label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{m.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Pre-Bed Window Duration */}
      <div className="pt-2 border-t border-white/10">
        <label className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block mb-1.5">
          Pre-Bed Shielding Window (DLMO Timing)
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {PRE_BED_WINDOWS.map((mins) => {
            const isSelected = value.pre_bed_window_min === mins
            return (
              <button
                key={mins}
                type="button"
                onClick={() => onChange({ ...value, pre_bed_window_min: mins })}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {mins === 120 ? '120 min (2 hrs - Gold Standard)' : `${mins} min`}
              </button>
            )
          })}

          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[10px] text-gray-400 font-semibold">Custom:</span>
            <input
              type="number"
              min="10"
              max="300"
              placeholder="120"
              value={value.pre_bed_window_min ?? ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  pre_bed_window_min: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0,
                })
              }
              className="w-16 h-8 bg-black/60 border border-amber-500/40 rounded-lg px-2 text-xs text-white font-mono text-center focus:outline-none focus:border-amber-400"
            />
            <span className="text-[10px] text-gray-400">min</span>
          </div>
        </div>
      </div>

      {/* Environmental Verification Toggles & Lux Level */}
      <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Overhead Lights Extinguished */}
        <button
          type="button"
          onClick={() => onChange({ ...value, overhead_lights_off: !value.overhead_lights_off })}
          className={`p-2.5 rounded-xl border text-xs font-bold text-left flex items-start gap-2.5 transition-all cursor-pointer ${
            value.overhead_lights_off
              ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <CheckCircle2 size={15} className={value.overhead_lights_off ? 'text-amber-400 shrink-0 mt-0.5' : 'text-gray-600 shrink-0 mt-0.5'} />
          <div>
            <div>Overhead Lights Off / Dimmed</div>
            <div className="text-[10px] text-gray-400 font-normal mt-0.5">Protects inferior retinal ipRGCs from high-angle light</div>
          </div>
        </button>

        {/* Screen Brightness Minimized */}
        <button
          type="button"
          onClick={() => onChange({ ...value, screen_brightness_minimized: !value.screen_brightness_minimized })}
          className={`p-2.5 rounded-xl border text-xs font-bold text-left flex items-start gap-2.5 transition-all cursor-pointer ${
            value.screen_brightness_minimized
              ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <Smartphone size={15} className={value.screen_brightness_minimized ? 'text-amber-400 shrink-0 mt-0.5' : 'text-gray-600 shrink-0 mt-0.5'} />
          <div>
            <div>Screens Dimmed &lt;20% / Color Shift</div>
            <div className="text-[10px] text-gray-400 font-normal mt-0.5">True OLED black or high-cutoff red software tint</div>
          </div>
        </button>
      </div>

      {/* Ambient Lux Exposure Level */}
      <div className="pt-2 border-t border-white/10">
        <label className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block mb-1.5">
          Ambient Photic Environment (Lux)
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {LUX_LEVELS.map((lux) => {
            const isSelected = value.lux_level === lux.id
            return (
              <button
                key={lux.id}
                type="button"
                onClick={() => onChange({ ...value, lux_level: lux.id })}
                className={`p-1.5 rounded-lg text-center border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <div className="text-[11px] font-bold">{lux.label}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
