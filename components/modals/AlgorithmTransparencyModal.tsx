'use client'

import React, { useState } from 'react'
import { X, Flame, Zap, Award, Sparkles, Search, ShieldCheck, TrendingUp, Users, CheckCircle2 } from 'lucide-react'

type AlgorithmTab = 'popularity' | 'nba' | 'evidence' | 'impact' | 'relevance'

interface AlgorithmTransparencyModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: AlgorithmTab
}

export default function AlgorithmTransparencyModal({
  isOpen,
  onClose,
  initialTab = 'popularity'
}: AlgorithmTransparencyModalProps) {
  const [activeTab, setActiveTab] = useState<AlgorithmTab>(initialTab)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />

      <div className="relative bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shadow-md">
              <Sparkles size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">Algorithm & Ranking Transparency</h2>
              <p className="text-xs text-slate-400">Open, verifiable formulas powering your explore recommendations</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Algorithm Tabs */}
        <div className="px-4 pt-3 pb-2 border-b border-slate-800/60 bg-slate-900/30 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('popularity')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'popularity'
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Flame size={13} className={activeTab === 'popularity' ? 'text-amber-400' : 'text-slate-500'} />
            <span>Popular & Proven</span>
          </button>

          <button
            onClick={() => setActiveTab('nba')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'nba'
                ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap size={13} className={activeTab === 'nba' ? 'text-purple-400' : 'text-slate-500'} />
            <span>Personalized (NBA)</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'evidence'
                ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Award size={13} className={activeTab === 'evidence' ? 'text-blue-400' : 'text-slate-500'} />
            <span>Scientific Evidence</span>
          </button>

          <button
            onClick={() => setActiveTab('impact')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'impact'
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp size={13} className={activeTab === 'impact' ? 'text-emerald-400' : 'text-slate-500'} />
            <span>Longevity Impact</span>
          </button>

          <button
            onClick={() => setActiveTab('relevance')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'relevance'
                ? 'bg-slate-700/60 border border-slate-600 text-slate-200 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Search size={13} className={activeTab === 'relevance' ? 'text-slate-300' : 'text-slate-500'} />
            <span>Direct Relevance</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm text-slate-300 leading-relaxed">
          
          {/* Tab 1: Cultural Popularity & Efficacy */}
          {activeTab === 'popularity' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-amber-400" />
                  <h3 className="font-extrabold text-white text-base">Cultural Popularity & Efficacy Index (CPEI)</h3>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Default ranking mode. Evaluates modalities by balancing <strong>hard biological efficacy</strong> with <strong>real-world consumer purchases and longevity discourse</strong>, ensuring fads without proven mechanisms cannot reach the top.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Formula Weight Breakdown (0–100 Score)</h4>
                
                {/* Weight 1: 45% Efficacy */}
                <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-400" /> 1. Proven Human Efficacy & Biomarker Shift
                    </span>
                    <span className="font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">45% Weight</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[45%]" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Weighted by human double-blind RCTs, multi-study meta-analyses, and documented biomarker shift magnitude (e.g. VO2 max, ApoB reduction, fasting glucose AUC, HRV, deep NREM sleep %).
                  </p>
                </div>

                {/* Weight 2: 35% Discourse */}
                <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-amber-400" /> 2. Market Purchases & Search Velocity
                    </span>
                    <span className="font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">35% Weight</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[35%]" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Reflects global search interest momentum and consumer adoption across supplements (Creatine, Magnesium, Omega-3s) and biohacking hardware (Sauna, Cold Plunge, Red Light).
                  </p>
                </div>

                {/* Weight 3: 20% Pioneer Consensus */}
                <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Users size={14} className="text-purple-400" /> 3. Bio-Optimizer Pioneer Consensus
                    </span>
                    <span className="font-mono font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/30">20% Weight</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full w-[20%]" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Prevalence across verified longevity pioneer stacks (Bryan Johnson Blueprint 2026, Peter Attia Centenarian Decathlon, Andrew Huberman Circadian Protocols, Rhonda Patrick, David Sinclair).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Next Best Action (NBA) */}
          {activeTab === 'nba' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-purple-400" />
                  <h3 className="font-extrabold text-white text-base">Next Best Action (NBA) Personalization</h3>
                </div>
                <p className="text-xs text-purple-200/90 leading-relaxed">
                  Tailored ranking engine configured to discover what your specific biological routine is missing right now.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 size={15} className="text-purple-400 shrink-0 mt-0.5" />
                  <div><strong>Profile Goals Matching:</strong> Prioritizes habits directly targeting your configured health objectives (Cardiovascular, Sleep, Cognitive, Metabolic).</div>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 size={15} className="text-purple-400 shrink-0 mt-0.5" />
                  <div><strong>Stack Gap Identification:</strong> Identifies unaddressed biological pathways (e.g. if you have 4 morning supplements but zero wind-down routines).</div>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 size={15} className="text-purple-400 shrink-0 mt-0.5" />
                  <div><strong>Diurnal Rhythm Synchronization:</strong> Suggests habits that fit your open time slots and optimal circadian window.</div>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 size={15} className="text-purple-400 shrink-0 mt-0.5" />
                  <div><strong>Friction & Cost Budget:</strong> Filters according to your preferred effort tier and equipment access.</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Scientific Evidence */}
          {activeTab === 'evidence' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-blue-950/30 border border-blue-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-blue-400" />
                  <h3 className="font-extrabold text-white text-base">Scientific Evidence Grading (1–5)</h3>
                </div>
                <p className="text-xs text-blue-200/90 leading-relaxed">
                  Strictly ranks modalities by the highest tier of human clinical evidence published in peer-reviewed biomedical literature.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                  <span className="font-bold text-white">Level 5 — Systematic Meta-Analysis / Multi-RCT</span>
                  <span className="text-emerald-400 font-mono font-bold">Gold Standard</span>
                </div>
                <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                  <span className="font-bold text-white">Level 4 — Controlled Human Clinical Trials (RCT)</span>
                  <span className="text-blue-400 font-mono font-bold">High Clinical Rigor</span>
                </div>
                <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                  <span className="font-bold text-white">Level 3 — Observational & Longitudinal Cohorts</span>
                  <span className="text-amber-400 font-mono font-bold">Moderate Evidence</span>
                </div>
                <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                  <span className="font-bold text-white">Level 1–2 — Emerging In Vivo / Mechanistic Models</span>
                  <span className="text-purple-400 font-mono font-bold">Emerging Science</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Longevity Impact */}
          {activeTab === 'impact' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-400" />
                  <h3 className="font-extrabold text-white text-base">Longevity Impact Score</h3>
                </div>
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  Ranks modalities strictly by their estimated net effect on all-cause mortality, cardiovascular resilience, and cellular longevity pathways (AMPK, mTOR inhibition, Autophagy, SIRT1).
                </p>
              </div>
            </div>
          )}

          {/* Tab 5: Direct Relevance */}
          {activeTab === 'relevance' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-slate-900/80 border border-slate-700 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <Search size={16} className="text-slate-300" />
                  <h3 className="font-extrabold text-white text-base">Direct Search & Semantic Relevance</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Evaluates exact keyword matches across name, category, mechanism of action, and pgvector semantic similarity against your active search prompt.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  )
}
