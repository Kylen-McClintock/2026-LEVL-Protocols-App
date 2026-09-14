'use client'

import React from 'react'
import { Type, Check, Sparkles, Eye, Maximize2, Minimize2, Pin, ArrowUpRight } from 'lucide-react'
import { useLandscapeFontPreference, LandscapeTextPreference } from '@/lib/utils/useLandscapeFontPreference'

export default function LandscapeTextSizeSettingsCard() {
  const { preference, setPreference } = useLandscapeFontPreference()

  const options: { 
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
      badge: 'Optimal Glanceability',
      icon: <Maximize2 size={15} className="text-purple-400" />,
      desc: 'Automatically enlarges primary reading text by ~20% when rotated horizontally for comfortable desk or stand viewing, while keeping calendar grids, pill badges, and timestamps compact.'
    },
    {
      id: 'standard',
      label: 'Standard 100%',
      sublabel: '(Fixed Density)',
      badge: 'Compact',
      icon: <Minimize2 size={15} className="text-slate-400" />,
      desc: 'Maintains standard portrait text scale across all elements and views when holding the phone horizontally.'
    }
  ]

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-700/80 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.2)] shrink-0">
            <Type size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold text-base text-white tracking-tight">Landscape Reading Size</h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Text scaling behavior when viewing LEVL in rotated horizontal mode
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60 shrink-0 self-start sm:self-center">
          {preference === 'auto_enlarge' ? '+20% Auto-Enlarge' : 'Standard 100%'}
        </span>
      </div>

      {/* 2-Option Segmented Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-black/60 p-1.5 rounded-2xl border border-slate-800">
        {options.map((opt) => {
          const isSelected = preference === opt.id

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPreference(opt.id)}
              className={`py-3 px-3.5 rounded-xl text-xs font-bold transition-all flex flex-col items-start gap-1 cursor-pointer select-none text-left ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950 border border-purple-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  {opt.icon}
                  <span className="font-extrabold text-sm text-white">{opt.label}</span>
                  <span className={`text-[11px] font-normal ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                    {opt.sublabel}
                  </span>
                </div>
                {isSelected && <Check size={14} className="stroke-[3] text-white shrink-0" />}
              </div>
              <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded ${
                isSelected ? 'bg-black/30 text-purple-200' : 'bg-white/5 text-slate-500'
              }`}>
                {opt.badge}
              </span>
            </button>
          )
        })}
      </div>

      {/* Description */}
      <p className="text-xs text-slate-400 px-1 leading-relaxed">
        {preference === 'auto_enlarge'
          ? 'Primary reading text (task titles, protocol instructions, coach chat messages, and notes) will automatically scale up by ~20% in horizontal mode for effortless glanceability.'
          : 'Standard text scale will be maintained across all views in horizontal landscape mode.'}
      </p>

      {/* Selective Scaling Architecture Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
        <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 space-y-1">
          <div className="flex items-center gap-1.5 text-purple-300 font-bold">
            <ArrowUpRight size={13} className="text-purple-400" />
            <span>Scales up (+20% in Landscape)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            Task titles, protocol instructions, AI coach messages &amp; descriptions.
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold">
            <Pin size={12} className="text-slate-400" />
            <span>Stays pinned (Compact)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            Calendar grid cells, circadian tags, inline pill badges &amp; timeline timestamps.
          </p>
        </div>
      </div>

      {/* Live Interactive Protocol Preview */}
      <div className="pt-2 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <Eye size={13} className="text-purple-400" /> Live Protocol Card Preview
          </span>
          <span className="text-[11px] text-slate-500 normal-case font-normal">
            Landscape Simulation
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2 shadow-inner">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-md">
                07:00 AM • Morning Anchor
              </span>
              <span className="text-[9px] font-mono text-slate-500 bg-black/40 px-1.5 py-0.2 rounded border border-white/5">
                Pinned Compact
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                3 min @ 50°F–55°F
              </span>
              <span className="text-[9px] font-mono text-emerald-500 bg-emerald-950/30 px-1.5 py-0.2 rounded border border-emerald-900/40">
                Pinned Compact
              </span>
            </div>
          </div>

          <div className="pt-1">
            <div className="flex items-baseline gap-2">
              <h4 className={`font-extrabold text-white transition-all ${
                preference === 'auto_enlarge' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
              }`}>
                Cold Water Immersion
              </h4>
              <span className="text-[9px] font-mono text-purple-300 bg-purple-950/60 px-1.5 py-0.2 rounded border border-purple-800/60">
                {preference === 'auto_enlarge' ? 'Scales +20%' : 'Standard 100%'}
              </span>
            </div>
            <p className={`text-slate-300 leading-relaxed mt-1 transition-all ${
              preference === 'auto_enlarge' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
            }`}>
              Deliberate cold exposure triggers a sustained release of dopamine and norepinephrine, elevating mood and metabolic rate.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
