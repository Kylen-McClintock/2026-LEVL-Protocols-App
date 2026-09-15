'use client'

import React from 'react'
import { Type, Check, Sparkles, Eye, Smartphone, RotateCcw, Maximize2, Minimize2, Pin, ArrowUpRight } from 'lucide-react'
import { useTextScale, TextScale, TEXT_SCALE_OPTIONS, FONT_SIZE_MAP } from '@/lib/utils/useTextScale'
import { useLandscapeFontPreference, LandscapeTextPreference } from '@/lib/utils/useLandscapeFontPreference'

export default function FontSizeSettingsCard() {
  const { scale, setScale, options: textScaleOptions } = useTextScale()
  const { preference: landscapePref, setPreference: setLandscapePref } = useLandscapeFontPreference()

  const landscapeOptions: {
    id: LandscapeTextPreference
    label: string
    sublabel: string
    badge: string
    icon: React.ReactNode
    desc: string
  }[] = [
    {
      id: 'auto_enlarge',
      label: '+20% Auto-Enlarge',
      sublabel: '(Recommended)',
      badge: 'Glanceable',
      icon: <Maximize2 size={14} className="text-purple-400" />,
      desc: 'Automatically enlarges primary reading text by ~20% when rotated horizontally for comfortable desk or stand viewing.'
    },
    {
      id: 'standard',
      label: 'Standard 100%',
      sublabel: '(Fixed Density)',
      badge: 'Compact',
      icon: <Minimize2 size={14} className="text-slate-400" />,
      desc: 'Maintains standard portrait text scale across all elements and views when holding the phone horizontally.'
    }
  ]

  const activeScaleObj = textScaleOptions.find(o => o.id === scale) || textScaleOptions[1]

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-700/80 shadow-xl space-y-6 bg-slate-900/70 backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.2)] shrink-0">
            <Type size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold text-base text-white tracking-tight">Display &amp; Font Size</h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Configure reading scale for vertical and horizontal landscape modes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60">
            Portrait: {activeScaleObj.percentage}
          </span>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
            Landscape: {landscapePref === 'auto_enlarge' ? '+20%' : '100%'}
          </span>
        </div>
      </div>

      {/* SECTION 1: Vertical / Portrait Mode Font Size */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone size={15} className="text-purple-400" />
            <span className="text-xs font-black text-white uppercase tracking-wider">
              Vertical / Portrait Mode Text Size
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Active: {activeScaleObj.label} ({activeScaleObj.percentage})
          </span>
        </div>

        {/* 4-Option Segmented Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/60 p-1.5 rounded-2xl border border-slate-800">
          {textScaleOptions.map((opt) => {
            const isSelected = scale === opt.id

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setScale(opt.id)}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950 border border-purple-400/30 font-extrabold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span>{opt.label}</span>
                  {isSelected && <Check size={12} className="stroke-[3] text-white" />}
                </div>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-purple-200' : 'text-slate-500'}`}>
                  {opt.percentage}
                </span>
              </button>
            )
          })}
        </div>

        <p className="text-xs text-slate-300 flex items-center gap-1.5 px-1">
          <Sparkles size={13} className="text-purple-400 shrink-0" />
          <span>{activeScaleObj.description}</span>
        </p>

        {/* Live Interactive Preview Box (ONLY FOR VERTICAL MODE) */}
        <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-inner">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5 text-purple-300">
              <Eye size={13} className="text-purple-400" /> Live Vertical Preview ({activeScaleObj.percentage})
            </span>
            <span className="text-[10px] font-mono text-slate-500 normal-case">
              Base: {FONT_SIZE_MAP[scale] || '16px'}
            </span>
          </div>

          <div 
            className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/60 space-y-2 transition-all duration-200"
            style={{ fontSize: FONT_SIZE_MAP[scale] || '16px' }}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[0.72em] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/60 font-mono">
                  HUBERMAN PROTOCOL
                </span>
                <span className="text-[0.72em] font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded-md">
                  3 Steps
                </span>
              </div>
              <span className="text-[0.72em] font-mono font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                07:00 AM
              </span>
            </div>

            <div>
              <h4 className="text-[1.05em] font-extrabold text-white leading-tight">
                Cold Water Immersion
              </h4>
              <div className="text-[0.85em] font-mono font-bold text-emerald-400 mt-0.5">
                Dose: 3 minutes @ 50°F–55°F / 10°C–13°C
              </div>
            </div>

            <p className="text-[0.8em] text-slate-300 leading-relaxed">
              Deliberate cold exposure triggers a sustained 2.5× release of dopamine and norepinephrine, elevating focus, alertness, and mitochondrial resilience.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Landscape Mode Font Size (NO PREVIEW) */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw size={15} className="text-indigo-400" />
            <span className="text-xs font-black text-white uppercase tracking-wider">
              Landscape Mode Text Size
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {landscapePref === 'auto_enlarge' ? '+20% Auto-Enlarge' : 'Standard 100%'}
          </span>
        </div>

        {/* 2-Option Segmented Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-black/60 p-1.5 rounded-2xl border border-slate-800">
          {landscapeOptions.map((opt) => {
            const isSelected = landscapePref === opt.id

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLandscapePref(opt.id)}
                className={`py-3 px-3.5 rounded-xl text-xs font-bold transition-all flex flex-col items-start gap-1 cursor-pointer select-none text-left ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-950 border border-indigo-400/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    {opt.icon}
                    <span className="font-extrabold text-sm text-white">{opt.label}</span>
                    <span className={`text-[11px] font-normal ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {opt.sublabel}
                    </span>
                  </div>
                  {isSelected && <Check size={14} className="stroke-[3] text-white shrink-0" />}
                </div>
                <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-black/30 text-indigo-200' : 'bg-white/5 text-slate-500'
                }`}>
                  {opt.badge}
                </span>
              </button>
            )
          })}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 px-1 leading-relaxed">
          {landscapePref === 'auto_enlarge'
            ? 'Primary reading text automatically scales up by ~20% in horizontal mode for effortless glanceability.'
            : 'Standard 100% text scale is maintained across all views in horizontal landscape mode.'}
        </p>

        {/* Selective Scaling Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
          <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 space-y-1">
            <div className="flex items-center gap-1.5 text-purple-300 font-bold text-[11px]">
              <ArrowUpRight size={13} className="text-purple-400 shrink-0" />
              <span>Scales up (+20% in Landscape)</span>
            </div>
            <p className="text-[10.5px] text-slate-400 leading-normal">
              Task titles, protocol instructions, AI coach messages &amp; descriptions.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold text-[11px]">
              <Pin size={12} className="text-slate-400 shrink-0" />
              <span>Stays pinned (Compact)</span>
            </div>
            <p className="text-[10.5px] text-slate-400 leading-normal">
              Calendar grid cells, circadian tags, inline pill badges &amp; timeline timestamps.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
