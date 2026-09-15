'use client'

import React from 'react'
import { Thermometer, Flame, Snowflake, Check } from 'lucide-react'
import { useTemperatureUnit, TemperatureUnit } from '@/lib/utils/useTemperatureUnit'

export default function TemperatureUnitSettingsCard() {
  const { unit, setUnit } = useTemperatureUnit()

  const options: { id: TemperatureUnit; label: string; symbol: string; icon: React.ReactNode }[] = [
    {
      id: 'F',
      label: 'Fahrenheit',
      symbol: '°F',
      icon: <Flame size={14} className="text-amber-400" />
    },
    {
      id: 'C',
      label: 'Celsius',
      symbol: '°C',
      icon: <Snowflake size={14} className="text-cyan-400" />
    }
  ]

  return (
    <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-slate-700/80 shadow-lg bg-slate-900/60 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Title & Icon */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.2)] shrink-0">
          <Thermometer size={18} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
              Temperature Units
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              {unit === 'F' ? '°F' : '°C'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            Units for cold plunge, sauna &amp; thermal protocols
          </p>
        </div>
      </div>

      {/* Compact Segmented 2-Pill Selector */}
      <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-slate-800 shrink-0 self-start sm:self-center">
        {options.map((opt) => {
          const isSelected = unit === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setUnit(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md border border-cyan-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {opt.icon}
              <span>{opt.label} ({opt.symbol})</span>
              {isSelected && <Check size={12} className="stroke-[3] text-white" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
