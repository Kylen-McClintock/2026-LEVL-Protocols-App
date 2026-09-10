'use client'

import React, { useState } from 'react'
import {
  LongevityVectorIcon,
  LongevityVectorId,
  LONGEVITY_VECTOR_METADATA,
  LongevityVectorBadge,
  HallmarkOfAgingIcon,
  HallmarkOfAgingId,
  HALLMARKS_OF_AGING_METADATA,
  HallmarkOfAgingBadge,
  FunctionalOutcomeIcon,
  FunctionalOutcomeId,
  FUNCTIONAL_OUTCOMES_METADATA,
  FunctionalOutcomeBadge,
  FunctionalOutcomeCategory
} from '@/components/icons'
import { Sparkles, Layers, Check, Copy, Tag, Eye } from 'lucide-react'

export default function LongevityVectorsAndHallmarksShowcase() {
  const [activeTab, setActiveTab] = useState<'vectors' | 'hallmarks' | 'outcomes'>('outcomes')
  const [iconSize, setIconSize] = useState<number>(32)
  const [isGlowEnabled, setIsGlowEnabled] = useState<boolean>(true)
  const [showLabels, setShowLabels] = useState<boolean>(true)
  const [selectedVector, setSelectedVector] = useState<LongevityVectorId>('heart_health')
  const [selectedHallmark, setSelectedHallmark] = useState<HallmarkOfAgingId>('mitochondrial_dysfunction')
  const [selectedOutcome, setSelectedOutcome] = useState<FunctionalOutcomeId>('focus')
  const [selectedCategory, setSelectedCategory] = useState<FunctionalOutcomeCategory | 'all'>('all')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const vectorKeys = Object.keys(LONGEVITY_VECTOR_METADATA) as LongevityVectorId[]
  const hallmarkKeys = Object.keys(HALLMARKS_OF_AGING_METADATA) as HallmarkOfAgingId[]
  const outcomeKeys = Object.keys(FUNCTIONAL_OUTCOMES_METADATA) as FunctionalOutcomeId[]

  const filteredOutcomeKeys = selectedCategory === 'all'
    ? outcomeKeys
    : outcomeKeys.filter((k) => FUNCTIONAL_OUTCOMES_METADATA[k].category === selectedCategory)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(label)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getActiveCodeSnippet = () => {
    if (activeTab === 'vectors') {
      return showLabels
        ? `<LongevityVectorBadge vector="${selectedVector}" size={${iconSize}} showLabel={true} />`
        : `<LongevityVectorIcon vector="${selectedVector}" size={${iconSize}} glow={${isGlowEnabled}} />`
    }
    if (activeTab === 'hallmarks') {
      return showLabels
        ? `<HallmarkOfAgingBadge hallmark="${selectedHallmark}" size={${iconSize}} showLabel={true} />`
        : `<HallmarkOfAgingIcon hallmark="${selectedHallmark}" size={${iconSize}} glow={${isGlowEnabled}} />`
    }
    return showLabels
      ? `<FunctionalOutcomeBadge outcome="${selectedOutcome}" size={${iconSize}} showLabel={true} />`
      : `<FunctionalOutcomeIcon outcome="${selectedOutcome}" size={${iconSize}} glow={${isGlowEnabled}} />`
  }

  return (
    <div className="w-full bg-[#0B0F19] text-white p-4 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800 relative z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Sparkles size={12} />
            <span>Clinical Biomarker & Outcome Framework</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {activeTab === 'vectors'
              ? 'The 8 Canonical Longevity Vectors'
              : activeTab === 'hallmarks'
              ? 'The 12 Hallmarks of Aging'
              : 'The 25 Canonical Functional Outcomes'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ultra-detailed, vector-scaled biomedical clinical icons. Can be used 100% standalone (icon-only) or with optional text labels.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('outcomes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'outcomes'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              25 Outcomes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vectors')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'vectors'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              8 Vectors
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hallmarks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'hallmarks'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              12 Hallmarks
            </button>
          </div>

          {/* Standalone vs Text Toggle */}
          <button
            type="button"
            onClick={() => setShowLabels(!showLabels)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              showLabels
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle between standalone icon mode and icon + text label mode"
          >
            <Eye size={13} />
            <span>{showLabels ? 'Labels: Visible' : 'Standalone: Icons Only'}</span>
          </button>

          {/* Size Selector */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl items-center text-xs font-mono">
            {[20, 28, 36, 48].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setIconSize(sz)}
                className={`px-2 py-1 rounded-lg transition-all ${
                  iconSize === sz ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sz}px
              </button>
            ))}
          </div>

          {/* Glow Toggle */}
          <button
            type="button"
            onClick={() => setIsGlowEnabled(!isGlowEnabled)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              isGlowEnabled
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            Glow: {isGlowEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Outcomes Category Filters */}
      {activeTab === 'outcomes' && (
        <div className="flex items-center gap-1.5 py-4 border-b border-slate-800/80 overflow-x-auto relative z-10 scrollbar-none">
          <span className="text-xs text-slate-500 font-mono mr-2 flex items-center gap-1">
            <Tag size={12} /> Category:
          </span>
          {(['all', 'cognitive', 'sleep', 'vitality', 'physical', 'recovery', 'metabolic'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
              }`}
            >
              {cat === 'all' ? `All (25)` : `${cat} (${outcomeKeys.filter(k => FUNCTIONAL_OUTCOMES_METADATA[k].category === cat).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Grid: 25 Canonical Functional Outcomes */}
      {activeTab === 'outcomes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 pt-6 relative z-10">
          {filteredOutcomeKeys.map((oKey) => {
            const meta = FUNCTIONAL_OUTCOMES_METADATA[oKey]
            const isSelected = selectedOutcome === oKey

            return (
              <div
                key={oKey}
                onClick={() => setSelectedOutcome(oKey)}
                className={`group p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900/90 border-slate-500 ring-2 shadow-2xl scale-[1.02]'
                    : 'bg-slate-950/60 hover:bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                }`}
                style={{
                  boxShadow: isSelected ? `0 0 22px ${meta.bgGlow}` : undefined,
                  borderColor: isSelected ? meta.colorHex : undefined
                }}
              >
                {/* Header: Icon + Category Tag */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div
                    className="rounded-xl flex items-center justify-center p-2 border transition-transform group-hover:scale-110 shrink-0"
                    style={{
                      background: `radial-gradient(circle, ${meta.bgGlow} 0%, rgba(11, 15, 25, 0.4) 100%)`,
                      borderColor: `${meta.colorHex}40`
                    }}
                  >
                    <FunctionalOutcomeIcon
                      outcome={oKey}
                      size={iconSize}
                      glow={isGlowEnabled}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-800 text-slate-400">
                    {meta.category}
                  </span>
                </div>

                {/* Outcome Title & Pill */}
                <div className="flex-1 flex flex-col justify-between">
                  {showLabels ? (
                    <div>
                      <h3
                        className="text-xs sm:text-sm font-bold leading-snug transition-colors"
                        style={{ color: isSelected ? meta.colorHex : '#F8FAFC' }}
                      >
                        {meta.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {meta.description}
                      </p>
                    </div>
                  ) : (
                    <div className="py-2 flex flex-col items-center text-center">
                      <FunctionalOutcomeBadge
                        outcome={oKey}
                        size={20}
                        showLabel={false}
                        glow={isGlowEnabled}
                      />
                      <span className="text-[10px] text-slate-400 font-mono mt-1.5">
                        {meta.shortLabel}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Pill */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                  <span className="truncate">{meta.shortLabel}</span>
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: meta.colorHex }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Grid: 8 Canonical Longevity Vectors */}
      {activeTab === 'vectors' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 relative z-10">
          {vectorKeys.map((vKey) => {
            const meta = LONGEVITY_VECTOR_METADATA[vKey]
            const isSelected = selectedVector === vKey

            return (
              <div
                key={vKey}
                onClick={() => setSelectedVector(vKey)}
                className={`group p-4 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900/90 border-slate-600 ring-2 shadow-2xl scale-[1.02]'
                    : 'bg-slate-950/60 hover:bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                }`}
                style={{
                  boxShadow: isSelected ? `0 0 25px ${meta.bgGlow}` : undefined,
                  borderColor: isSelected ? meta.colorHex : undefined
                }}
              >
                {/* Top Row: Detailed Vector Icon + Vector Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center p-2 border transition-transform group-hover:scale-110 shrink-0"
                    style={{
                      background: `radial-gradient(circle, ${meta.bgGlow} 0%, rgba(11, 15, 25, 0.4) 100%)`,
                      borderColor: `${meta.colorHex}40`
                    }}
                  >
                    <LongevityVectorIcon
                      vector={vKey}
                      size={iconSize}
                      glow={isGlowEnabled}
                    />
                  </div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-500">
                    VECTOR #{meta.vectorNumber}
                  </span>
                </div>

                {/* Vector Content */}
                <div>
                  {showLabels ? (
                    <>
                      <h3
                        className="text-sm sm:text-base font-bold leading-snug transition-colors"
                        style={{ color: isSelected ? meta.colorHex : '#F8FAFC' }}
                      >
                        {meta.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {meta.description}
                      </p>
                    </>
                  ) : (
                    <div className="py-2 flex items-center justify-center">
                      <LongevityVectorBadge vector={vKey} size={22} showLabel={false} glow={isGlowEnabled} />
                    </div>
                  )}
                </div>

                {/* Biomarkers Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                  <span className="truncate">Key: {meta.keyBiomarkers.slice(0, 2).join(', ')}</span>
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: meta.colorHex }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Grid: 12 Hallmarks of Aging */}
      {activeTab === 'hallmarks' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 relative z-10">
          {hallmarkKeys.map((hKey) => {
            const meta = HALLMARKS_OF_AGING_METADATA[hKey]
            const isSelected = selectedHallmark === hKey

            return (
              <div
                key={hKey}
                onClick={() => setSelectedHallmark(hKey)}
                className={`group p-4 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900/90 border-slate-600 ring-2 shadow-2xl scale-[1.02]'
                    : 'bg-slate-950/60 hover:bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                }`}
                style={{
                  boxShadow: isSelected ? `0 0 25px ${meta.bgGlow}` : undefined,
                  borderColor: isSelected ? meta.colorHex : undefined
                }}
              >
                {/* Top Row: Hallmark Icon + Tier Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center p-2 border transition-transform group-hover:scale-110 shrink-0"
                    style={{
                      background: `radial-gradient(circle, ${meta.bgGlow} 0%, rgba(11, 15, 25, 0.4) 100%)`,
                      borderColor: `${meta.colorHex}40`
                    }}
                  >
                    <HallmarkOfAgingIcon
                      hallmark={hKey}
                      size={iconSize}
                      glow={isGlowEnabled}
                    />
                  </div>
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    meta.tier === 'primary'
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                      : meta.tier === 'antagonistic'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                  }`}>
                    {meta.tier}
                  </span>
                </div>

                {/* Hallmark Title */}
                <div>
                  {showLabels ? (
                    <>
                      <h3
                        className="text-sm sm:text-base font-bold leading-snug"
                        style={{ color: isSelected ? meta.colorHex : '#F8FAFC' }}
                      >
                        {meta.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {meta.description}
                      </p>
                    </>
                  ) : (
                    <div className="py-2 flex items-center justify-center">
                      <HallmarkOfAgingBadge hallmark={hKey} size={22} showLabel={false} glow={isGlowEnabled} />
                    </div>
                  )}
                </div>

                {/* Hallmark Number Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                  <span>HALLMARK #{meta.number}</span>
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: meta.colorHex }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Code Snippet Quick Export Bar */}
      <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="text-slate-400 flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <Layers size={14} className="text-emerald-400 shrink-0" />
          <span className="font-mono text-slate-300">
            {showLabels ? 'Badge with Label:' : 'Standalone Icon (No Text):'} <code className="text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{getActiveCodeSnippet()}</code>
          </span>
        </div>
        <button
          type="button"
          onClick={() => copyToClipboard(getActiveCodeSnippet(), 'import-code')}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 active:scale-95"
        >
          {copiedCode === 'import-code' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          <span>{copiedCode === 'import-code' ? 'Copied to Clipboard!' : 'Copy JSX'}</span>
        </button>
      </div>
    </div>
  )
}
