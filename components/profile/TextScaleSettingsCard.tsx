'use client'

import React from 'react'
import { Type, Sparkles, Check, ZoomIn, Eye } from 'lucide-react'
import { useTextScale, TextScale, TEXT_SCALE_OPTIONS } from '@/lib/utils/useTextScale'

export default function TextScaleSettingsCard() {
  const { scale, setScale, options } = useTextScale()

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-700/80 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.2)]">
            <Type size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white tracking-tight">Display & Text Scaling</h3>
            <p className="text-xs text-slate-400">Customize global font size for mobile and desktop</p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60">
          {options.find(o => o.id === scale)?.percentage || '100%'}
        </span>
      </div>

      {/* 4-Option Segmented Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/60 p-1.5 rounded-2xl border border-slate-800">
        {options.map((opt) => {
          const isSelected = scale === opt.id

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setScale(opt.id)}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950 border border-purple-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-1">
                <span>{opt.label}</span>
                {isSelected && <Check size={12} className="stroke-[3]" />}
              </div>
              <span className={`text-[10px] font-mono ${isSelected ? 'text-purple-200' : 'text-slate-500'}`}>
                {opt.percentage}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected Option Description */}
      <div className="text-xs text-slate-300 flex items-center gap-1.5 px-1">
        <Sparkles size={14} className="text-purple-400 shrink-0" />
        <span>{options.find(o => o.id === scale)?.description}</span>
      </div>

      {/* Live Interactive Preview Box */}
      <div className="pt-2 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <Eye size={13} className="text-emerald-400" /> Live Preview
          </span>
          <span className="text-[11px] text-slate-500 normal-case font-normal">
            Updates across all pages & cards
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 shadow-inner">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/60">
                HUBERMAN LAB
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded-md">
                3 Steps
              </span>
            </div>
            <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              MORNING
            </span>
          </div>

          <div>
            <h4 className="text-base font-extrabold text-white">Cold Water Immersion</h4>
            <div className="text-xs sm:text-sm font-mono font-bold text-emerald-400 mt-0.5">
              Dose: 3 minutes @ 50°F–55°F
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Deliberate cold exposure triggers a sustained release of dopamine and norepinephrine, elevating mood and metabolic rate.
          </p>
        </div>
      </div>
    </div>
  )
}
