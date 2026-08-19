'use client'

import React, { useState } from 'react'
import { Syringe, Info, Sparkles, AlertCircle } from 'lucide-react'

interface Props {
  unitsToDraw: number
  targetDoseMcg: number
  vialSizeMg?: number
  bacWaterMl?: number
  concentrationMcgPerMl?: number
  needleGauge?: string
  needleLength?: string
  className?: string
}

export default function VisualSyringeDrawingGuide({
  unitsToDraw,
  targetDoseMcg,
  vialSizeMg = 5,
  bacWaterMl = 2,
  concentrationMcgPerMl = 2500,
  needleGauge = '31G',
  needleLength = '5/16" (8mm)',
  className = ''
}: Props) {
  // Syringe Capacity: 30-Unit (0.3ml), 50-Unit (0.5ml), or 100-Unit (1.0ml)
  const defaultCapacity = unitsToDraw <= 30 ? 30 : unitsToDraw <= 50 ? 50 : 100
  const [syringeCapacity, setSyringeCapacity] = useState<30 | 50 | 100>(defaultCapacity)

  const safeUnits = Math.max(0, Math.min(syringeCapacity, unitsToDraw))
  const fillPct = (safeUnits / syringeCapacity) * 100
  const mlDose = Number((safeUnits * 0.01).toFixed(3))

  // Generate tick marks based on syringe capacity
  const step = syringeCapacity === 30 ? 2 : syringeCapacity === 50 ? 5 : 10
  const ticks = []
  for (let i = 0; i <= syringeCapacity; i += step) {
    ticks.push(i)
  }

  return (
    <div className={`p-3.5 rounded-2xl bg-slate-950/90 border border-cyan-500/30 backdrop-blur-md space-y-3 ${className}`}>
      {/* Header with Specs & Syringe Type Pills */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
            <Syringe size={13} />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-wider">
              Visual Insulin Syringe Drawing Guide
            </h4>
            <span className="text-[9.5px] text-slate-400 font-mono">
              {needleGauge} • {needleLength} Ultra-Fine SubQ • U-100 Standard
            </span>
          </div>
        </div>

        {/* Capacity Selector Tabs */}
        <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/5">
          {([30, 50, 100] as const).map(cap => (
            <button
              key={cap}
              type="button"
              onClick={() => setSyringeCapacity(cap)}
              className={`px-2 py-0.5 rounded-lg text-[9.5px] font-mono font-bold transition-all cursor-pointer ${
                syringeCapacity === cap
                  ? 'bg-cyan-500 text-black shadow-sm font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cap}U ({cap === 30 ? '0.3mL' : cap === 50 ? '0.5mL' : '1.0mL'})
            </button>
          ))}
        </div>
      </div>

      {/* Target Callout Banner */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/40">
        <div>
          <span className="text-[9px] font-bold text-cyan-300 uppercase tracking-widest block">
            Target Plunger Line:
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-cyan-400 font-mono">
              {unitsToDraw} {unitsToDraw === 1 ? 'Unit' : 'Units'}
            </span>
            <span className="text-xs font-bold text-slate-300 font-mono">
              ({mlDose.toFixed(2)} mL)
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
            Dose Injected:
          </span>
          <span className="text-sm font-black text-emerald-400 font-mono">
            {targetDoseMcg.toLocaleString()} mcg
          </span>
          <span className="text-[9px] text-slate-400 block font-mono">
            @{concentrationMcgPerMl.toLocaleString()} mcg/mL
          </span>
        </div>
      </div>

      {/* Realistic Visual Syringe Rendering */}
      <div className="relative py-2 px-1 select-none">
        {/* Syringe Assembly Wrapper */}
        <div className="relative flex items-center h-16 w-full">
          {/* Needle & Hub (Left) */}
          <div className="flex items-center shrink-0">
            {/* Needle Tip Line */}
            <div className="w-6 h-[2px] bg-gradient-to-r from-slate-400 to-slate-200 shadow-sm" />
            {/* Orange SubQ Needle Hub */}
            <div className="w-3.5 h-6 bg-gradient-to-b from-amber-500 to-orange-600 rounded-l-sm border-r border-black/40 flex items-center justify-center">
              <div className="w-1 h-3 bg-amber-300/60 rounded-full" />
            </div>
            {/* Syringe Neck Connector */}
            <div className="w-2.5 h-4 bg-slate-700 rounded-l-xs border-r border-slate-600" />
          </div>

          {/* Syringe Main Barrel (Glass Cylinder) */}
          <div className="relative flex-1 h-10 bg-slate-900/80 border-2 border-slate-700/80 rounded-r-md overflow-hidden backdrop-blur-md shadow-inner flex items-center">
            {/* Background Liquid Shader Gradient */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-600/60 via-cyan-500/80 to-emerald-400/90 transition-all duration-500 border-r-2 border-emerald-300 shadow-[0_0_15px_rgba(6,182,212,0.6)]"
              style={{ width: `${Math.min(100, fillPct)}%` }}
            >
              {/* Subtle fluid reflection */}
              <div className="w-full h-1 bg-white/40 absolute top-1 left-0 rounded-full" />
            </div>

            {/* Black Rubber Stopper (Plunger Head) */}
            <div
              className="absolute top-0 bottom-0 w-3 bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 border-y border-r border-slate-700 z-10 transition-all duration-500 flex flex-col justify-between py-1 items-center"
              style={{ left: `calc(${Math.min(100, fillPct)}% - 1.5px)` }}
            >
              <div className="w-1.5 h-0.5 bg-slate-600 rounded-full" />
              <div className="w-1.5 h-0.5 bg-slate-600 rounded-full" />
            </div>

            {/* Syringe Tick Marks & Measurement Numbers */}
            <div className="absolute inset-0 flex justify-between items-stretch pointer-events-none px-1">
              {ticks.map((tick, idx) => {
                const tickPct = (tick / syringeCapacity) * 100
                const isTarget = Math.abs(tick - unitsToDraw) < 0.1
                const isMajor = tick % (syringeCapacity === 30 ? 10 : syringeCapacity === 50 ? 10 : 20) === 0

                return (
                  <div
                    key={tick}
                    className="absolute top-0 bottom-0 flex flex-col justify-between items-center"
                    style={{ left: `${tickPct}%` }}
                  >
                    {/* Top Tick Mark */}
                    <div
                      className={`w-[1.5px] ${
                        isTarget
                          ? 'h-3.5 bg-cyan-300 shadow-sm shadow-cyan-400'
                          : isMajor
                          ? 'h-3 bg-white/80'
                          : 'h-1.5 bg-slate-500'
                      }`}
                    />

                    {/* Numeric Value Label */}
                    <span
                      className={`text-[8.5px] font-mono leading-none ${
                        isTarget
                          ? 'text-cyan-300 font-black scale-110 drop-shadow'
                          : isMajor
                          ? 'text-slate-300 font-bold'
                          : 'text-slate-500'
                      }`}
                    >
                      {tick}
                    </span>

                    {/* Bottom Tick Mark */}
                    <div
                      className={`w-[1.5px] ${
                        isTarget
                          ? 'h-3.5 bg-cyan-300 shadow-sm shadow-cyan-400'
                          : isMajor
                          ? 'h-3 bg-white/80'
                          : 'h-1.5 bg-slate-500'
                      }`}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Plunger Shaft & Thumb Rest (Right) */}
          <div className="flex items-center shrink-0">
            {/* Plastic Plunger Rod */}
            <div className="w-8 h-3.5 bg-gradient-to-b from-slate-300 via-white to-slate-400 border-y border-slate-500 shadow-sm flex items-center justify-center">
              <div className="w-full h-0.5 bg-slate-500/40" />
            </div>
            {/* Plunger Thumb Flange */}
            <div className="w-2.5 h-8 bg-gradient-to-b from-slate-200 via-slate-400 to-slate-200 rounded-r-sm border border-slate-600 shadow-md" />
          </div>
        </div>

        {/* Target Indicator Floating Pill */}
        <div
          className="absolute -bottom-2 flex flex-col items-center transition-all duration-500 pointer-events-none"
          style={{ left: `calc(44px + (100% - 84px) * ${Math.min(1, safeUnits / syringeCapacity)} - 32px)` }}
        >
          <div className="w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-cyan-400" />
          <span className="px-1.5 py-0.2 rounded bg-cyan-500 text-black font-black text-[8px] font-mono uppercase tracking-tight shadow-md">
            ▲ {unitsToDraw}U Line
          </span>
        </div>
      </div>

      {/* Safety Notice Footer */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9.5px] text-slate-400 font-mono">
        <span className="flex items-center gap-1 text-cyan-300">
          <Sparkles size={10} />
          <span>No math required: Align black stopper with {unitsToDraw} mark</span>
        </span>
        <span className="text-slate-500">
          100 Units = 1.0 mL
        </span>
      </div>
    </div>
  )
}
