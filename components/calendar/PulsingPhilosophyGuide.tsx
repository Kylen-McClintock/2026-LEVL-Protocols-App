'use client'

import React, { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp, Zap, Activity, ShieldCheck, Dumbbell, HeartPulse, BookOpen, ExternalLink, Compass } from 'lucide-react'

export default function PulsingPhilosophyGuide() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/30 overflow-hidden shadow-xl backdrop-blur-md">
      {/* Clickable Header Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-white/[0.03] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shadow-lg shadow-indigo-950/50 shrink-0">
            <Compass size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                The Science of Longevity Pulsing
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Core Biological Principle
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              Why optimal healthspan requires the cyclical rhythm of Growth (mTOR) and Recovery (AMPK).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 shrink-0">
          <span className="hidden sm:inline">{isOpen ? 'Hide Guide' : 'Learn Philosophy'}</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expandable Educational Body */}
      {isOpen && (
        <div className="p-4 sm:p-6 border-t border-white/10 space-y-6 animate-in fade-in duration-200 text-xs text-slate-300 leading-relaxed">
          {/* 1. The Longevity Paradox */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Sparkles size={15} className="text-amber-400" />
              <span>The Longevity Paradox: Neither Constant Growth Nor Constant Fasting Works</span>
            </h4>
            <p>
              In cellular biology, aging is governed by the oscillation between two opposing biological axes: 
              <strong className="text-purple-300"> Anabolic Growth (mTORC1)</strong> and 
              <strong className="text-emerald-300"> Autophagic Clearance (AMPK)</strong>.
            </p>
            <p>
              If you remain in perpetual <strong>Growth Mode</strong>, cellular waste accumulates, senescence accelerates, and cancer risk rises. 
              Conversely, if you remain in perpetual <strong>Clearance/Fasting Mode</strong>, you suffer sarcopenia, bone density loss, and hormonal collapse.
              <strong> The clinical gold standard is Biological Pulsing</strong>: triggering sharp, acute bursts of growth, cleanly bracketed by deep windows of restorative clearance.
            </p>
          </div>

          {/* 2. Side-by-Side Comparison of the Two Arms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* GROWTH MODE (mTOR) */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
              <div className="flex items-center gap-2 text-purple-300">
                <Dumbbell size={16} />
                <h5 className="font-extrabold text-xs uppercase tracking-wider text-purple-200">
                  🟣 Growth Mode (Anabolic / mTORC1 Axis)
                </h5>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-300">
                <li className="flex items-start gap-1.5">
                  <span className="text-purple-400 font-bold">•</span>
                  <span><strong>Primary Drivers</strong>: Mechanical load, resistance training, leucine, dietary protein, creatine, and cellular ATP turnover.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-purple-400 font-bold">•</span>
                  <span><strong>Benefits</strong>: Skeletal muscle hypertrophy, osteogenic remodeling, cognitive drive, hormonal robustness.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-purple-400 font-bold">•</span>
                  <span><strong>Ideal Window</strong>: Midday to afternoon (11:00 AM – 4:00 PM), when core body temperature and muscular torque peak.</span>
                </li>
              </ul>
            </div>

            {/* RECOVERY MODE (AMPK / VAGAL) */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2 text-emerald-300">
                <HeartPulse size={16} />
                <h5 className="font-extrabold text-xs uppercase tracking-wider text-emerald-200">
                  🟢 Recovery Mode (Catabolic / AMPK Axis)
                </h5>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-300">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Primary Drivers</strong>: Fasting (glycogen depletion), Zone 2 cardio, sauna heat shock proteins, cold plunge, deep slow-wave sleep.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Benefits</strong>: Macroautophagy, mitochondrial biogenesis (PGC-1α), peripheral vasodilation, vagal HRV recovery.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Ideal Window</strong>: Overnight to early morning (fasting + Zone 2/cold) and evening wind-down (sauna + breathwork).</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 3. The Chrono-Separation Solution */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
            <h5 className="font-extrabold text-xs uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-indigo-400" />
              <span>The Chrono-Separation Rule: Never Let Opposing Vectors Collide</span>
            </h5>
            <p className="text-[11px] text-slate-300">
              When Growth and Recovery are scheduled at the exact same hour, they blunt each other. For example, 
              <strong> cold water immersion within 4 hours post-workout blunts p70S6K and mTORC1</strong>, reducing muscle growth by up to 50% (Søberg &amp; Roberts, 2015).
            </p>
            <p className="text-[11px] text-slate-300">
              By chronologically separating them (e.g., Cold Plunge at 7:00 AM $\rightarrow$ Lift at 2:00 PM $\rightarrow$ Sauna at 7:30 PM), you unlock 
              <strong> 100% of the cold-induced mitochondrial/dopaminergic surge AND 100% of the hypertrophic adaptation</strong> with zero biological friction.
            </p>
          </div>

          {/* Scientific Citations Bar */}
          <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
            <span className="font-bold text-slate-300">Peer-Reviewed Foundations:</span>
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/26174983/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-300 flex items-center gap-1 text-slate-400 underline underline-offset-2"
            >
              <span>Roberts et al. (mTOR / Cold Blunting)</span>
              <ExternalLink size={10} />
            </a>
            <span>•</span>
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/31881139/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-300 flex items-center gap-1 text-slate-400 underline underline-offset-2"
            >
              <span>de Cabo &amp; Mattson (NEJM - Fasting Oscillations)</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
