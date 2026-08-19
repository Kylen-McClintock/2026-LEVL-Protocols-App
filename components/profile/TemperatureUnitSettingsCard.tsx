'use client'

import React from 'react'
import { Thermometer, Flame, Snowflake, Check, Eye } from 'lucide-react'
import { useTemperatureUnit, TemperatureUnit } from '@/lib/utils/useTemperatureUnit'

export default function TemperatureUnitSettingsCard() {
  const { unit, setUnit, formatText } = useTemperatureUnit()

  const options: { id: TemperatureUnit; label: string; symbol: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'F',
      label: 'Fahrenheit',
      symbol: '°F',
      icon: <Flame size={14} className="text-amber-400" />,
      desc: 'Standard US format (50°F Cold Plunge / 174°F Sauna)'
    },
    {
      id: 'C',
      label: 'Celsius',
      symbol: '°C',
      icon: <Snowflake size={14} className="text-cyan-400" />,
      desc: 'Metric & International format (10°C Cold Plunge / 80°C Sauna)'
    }
  ]

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-700/80 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            <Thermometer size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white tracking-tight">Temperature Units</h3>
            <p className="text-xs text-slate-400">Preferred units for cold plunge, sauna & sleep protocols</p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
          {unit === 'F' ? '°F (Fahrenheit)' : '°C (Celsius)'}
        </span>
      </div>

      {/* 2-Option Segmented Selector */}
      <div className="grid grid-cols-2 gap-2 bg-black/60 p-1.5 rounded-2xl border border-slate-800">
        {options.map((opt) => {
          const isSelected = unit === opt.id

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setUnit(opt.id)}
              className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer select-none ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950 border border-cyan-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {opt.icon}
                <span className="font-extrabold text-sm">{opt.label} ({opt.symbol})</span>
                {isSelected && <Check size={14} className="stroke-[3] text-white" />}
              </div>
            </button>
          )
        })}
      </div>

      {/* Description */}
      <p className="text-xs text-slate-400 px-1">
        {unit === 'F' 
          ? 'Temperatures will be displayed in Fahrenheit (°F) across all active protocols, cards, and logs.' 
          : 'Temperatures will be automatically converted to Celsius (°C) across all active protocols, cards, and logs.'}
      </p>

      {/* Live Interactive Protocol Preview */}
      <div className="pt-2 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <Eye size={13} className="text-cyan-400" /> Protocol Dose Preview
          </span>
          <span className="text-[11px] text-slate-500 normal-case font-normal">
            Converts in real-time
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Cold Plunge Card Preview */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold">
              <Snowflake size={12} /> Cold Water Immersion
            </div>
            <div className="text-xs font-mono font-extrabold text-emerald-400">
              {formatText('3 minutes @ 50°F–55°F')}
            </div>
          </div>

          {/* Sauna Card Preview */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold">
              <Flame size={12} /> Finnish Sauna
            </div>
            <div className="text-xs font-mono font-extrabold text-emerald-400">
              {formatText('20 minutes @ 174°F+')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
