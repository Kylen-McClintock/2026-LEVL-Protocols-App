'use client'

import React, { useState, useMemo } from 'react'
import {
  HallmarkCoverageReport,
  HallmarkCoverageItem,
  BenchmarkProfile,
  BENCHMARK_PROFILES,
  HallmarkTier
} from '@/lib/tracking/hallmarkCoverageEngine'
import {
  Sparkles,
  Info,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ChevronRight,
  Target,
  Dna,
  Zap,
  Activity,
  Sliders,
  Eye,
  CheckCircle2,
  FlaskConical,
  Filter,
  Check,
  ExternalLink
} from 'lucide-react'

interface HallmarksRadarChartProps {
  coverageReport: HallmarkCoverageReport
  onSelectHallmark?: (hallmarkId: string) => void
  selectedHallmarkId?: string | null
  evidenceFilter?: 'all' | 'grade_a'
  onEvidenceFilterChange?: (filter: 'all' | 'grade_a') => void
  simulatedCount?: number
  onApplySimulatedStack?: () => Promise<void>
  onClearSimulation?: () => void
  showBiomarkersPanel?: boolean
  onToggleBiomarkersPanel?: () => void
  biomarkerHighRiskCount?: number
}

export const HallmarksRadarChart: React.FC<HallmarksRadarChartProps> = ({
  coverageReport,
  onSelectHallmark,
  selectedHallmarkId,
  evidenceFilter = 'all',
  onEvidenceFilterChange,
  simulatedCount = 0,
  onApplySimulatedStack,
  onClearSimulation,
  showBiomarkersPanel = false,
  onToggleBiomarkersPanel,
  biomarkerHighRiskCount = 0
}) => {
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string>('blueprint_2026')
  const [showBenchmark, setShowBenchmark] = useState<boolean>(true)
  const [selectedTierFilter, setSelectedTierFilter] = useState<'all' | HallmarkTier>('all')
  const [hoveredHallmarkId, setHoveredHallmarkId] = useState<string | null>(null)
  const [isApplyingSim, setIsApplyingSim] = useState<boolean>(false)
  const [expandedSupportingIds, setExpandedSupportingIds] = useState<Set<string>>(new Set())

  const toggleSupportingExpand = (modId: string) => {
    setExpandedSupportingIds(prev => {
      const next = new Set(prev)
      if (next.has(modId)) next.delete(modId)
      else next.add(modId)
      return next
    })
  }

  const activeHallmarkId = hoveredHallmarkId || selectedHallmarkId
  const activeHallmarkItem = useMemo(() => {
    if (!activeHallmarkId) return null
    return coverageReport.hallmarkMap[activeHallmarkId] || null
  }, [activeHallmarkId, coverageReport])

  const selectedBenchmark = useMemo(() => {
    return BENCHMARK_PROFILES.find(b => b.id === selectedBenchmarkId) || BENCHMARK_PROFILES[0]
  }, [selectedBenchmarkId])

  const hasSimulationActive = (coverageReport.simulatedDelta || 0) > 0 || simulatedCount > 0

  // Ultra-responsive SVG geometric dimensions with generous label margins
  const viewBoxWidth = 740
  const viewBoxHeight = 480
  const centerX = viewBoxWidth / 2 // 370
  const centerY = viewBoxHeight / 2 // 240
  const radius = 135
  const items = coverageReport.hallmarkItems
  const numSpokes = items.length // 12

  // Compute angles for each of the 12 spokes
  const spokeData = useMemo(() => {
    return items.map((item, index) => {
      const angle = (index * (2 * Math.PI / numSpokes)) - (Math.PI / 2)
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)

      // Outer spoke point (100%)
      const xOuter = centerX + radius * cos
      const yOuter = centerY + radius * sin

      // Label point (radius + 28px)
      const xLabel = centerX + (radius + 28) * cos
      const yLabel = centerY + (radius + 28) * sin

      // Active user point
      const userRadiusRatio = Math.max(0.08, item.score / 100)
      const xUser = centerX + (radius * userRadiusRatio) * cos
      const yUser = centerY + (radius * userRadiusRatio) * sin

      // Simulated point
      const simScore = coverageReport.simulatedHallmarkMap?.[item.meta.id] ?? item.score
      const simRadiusRatio = Math.max(0.08, simScore / 100)
      const xSim = centerX + (radius * simRadiusRatio) * cos
      const ySim = centerY + (radius * simRadiusRatio) * sin

      // Benchmark point
      const benchmarkScore = selectedBenchmark.scores[item.meta.id] || 50
      const benchmarkRadiusRatio = Math.max(0.08, benchmarkScore / 100)
      const xBenchmark = centerX + (radius * benchmarkRadiusRatio) * cos
      const yBenchmark = centerY + (radius * benchmarkRadiusRatio) * sin

      return {
        item,
        index,
        angle,
        cos,
        sin,
        xOuter,
        yOuter,
        xLabel,
        yLabel,
        xUser,
        yUser,
        xSim,
        ySim,
        simScore,
        xBenchmark,
        yBenchmark,
        benchmarkScore
      }
    })
  }, [items, centerX, centerY, radius, numSpokes, selectedBenchmark, coverageReport.simulatedHallmarkMap])

  // Build SVG polygon strings
  const userPolygonPoints = useMemo(() => {
    return spokeData.map(s => `${s.xUser.toFixed(1)},${s.yUser.toFixed(1)}`).join(' ')
  }, [spokeData])

  const simulatedPolygonPoints = useMemo(() => {
    return spokeData.map(s => `${s.xSim.toFixed(1)},${s.ySim.toFixed(1)}`).join(' ')
  }, [spokeData])

  const benchmarkPolygonPoints = useMemo(() => {
    return spokeData.map(s => `${s.xBenchmark.toFixed(1)},${s.yBenchmark.toFixed(1)}`).join(' ')
  }, [spokeData])

  const gridRings = [0.25, 0.50, 0.75, 1.0]

  const handleApplySim = async () => {
    if (!onApplySimulatedStack) return
    setIsApplyingSim(true)
    try {
      await onApplySimulatedStack()
    } finally {
      setIsApplyingSim(false)
    }
  }

  return (
    <div className="w-full min-w-0 max-w-full rounded-3xl border border-purple-500/20 bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950 p-4 sm:p-6 lg:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-6">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Aggregate KPI Bar */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-extrabold uppercase tracking-wider bg-purple-500/20 border border-purple-500/40 text-purple-300">
              <Dna size={13} className="text-purple-400" />
              12 Hallmarks Framework
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              {coverageReport.coveredCount}/12 Protected
            </span>
            {coverageReport.gapCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                {coverageReport.gapCount} Cellular Gaps
              </span>
            )}
            {hasSimulationActive && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/50 animate-pulse">
                <FlaskConical size={11} /> +{coverageReport.simulatedDelta}% Simulated Gain ({simulatedCount} in sandbox)
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5 truncate">
            12 Hallmarks Bio-Coverage Radar
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Click any hallmark to inspect all active protecting modalities, exact cellular mechanisms, and comparison benchmarks.
          </p>
        </div>

        {/* Defense Index KPI Ring */}
        <div className="flex items-center gap-3 shrink-0 self-start lg:self-auto bg-slate-900/80 p-3 rounded-2xl border border-white/10 shadow-lg">
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-400 transition-all duration-1000 ease-out"
                strokeDasharray={`${coverageReport.overallCoverageScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-sm font-black text-white font-mono">
              {coverageReport.overallCoverageScore}%
            </span>
          </div>
          <div className="pr-1">
            <div className="text-[10px] font-mono uppercase text-slate-400 font-bold whitespace-nowrap">Cellular Defense Index</div>
            <div className="text-xs font-extrabold text-white whitespace-nowrap">
              {coverageReport.overallCoverageScore >= 75 ? 'Optimal Defense' :
               coverageReport.overallCoverageScore >= 50 ? 'Moderate Coverage' : 'Needs Optimization'}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Toolbars: Evidence Filter & Lab Biomarkers Toggle */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-slate-950/80 border border-white/10 text-xs w-full min-w-0">
        {/* Left: Evidence Quality Filter Toggle */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold px-1.5 flex items-center gap-1">
            <Filter size={11} /> Evidence Grade:
          </span>
          <button
            type="button"
            onClick={() => onEvidenceFilterChange && onEvidenceFilterChange('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              evidenceFilter === 'all'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            All Evidence Grades
          </button>
          <button
            type="button"
            onClick={() => onEvidenceFilterChange && onEvidenceFilterChange('grade_a')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
              evidenceFilter === 'grade_a'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <ShieldCheck size={12} className="text-emerald-300" />
            <span>🔬 Grade A (Human RCTs Only)</span>
          </button>
        </div>

        {/* Right: Biomarkers Drawer & Simulator Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {onToggleBiomarkersPanel && (
            <button
              type="button"
              onClick={onToggleBiomarkersPanel}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                showBiomarkersPanel
                  ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                  : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border-rose-500/30'
              }`}
            >
              <Activity size={12} className="text-rose-400" />
              <span>🩸 Lab Biomarkers {biomarkerHighRiskCount > 0 ? `(${biomarkerHighRiskCount} Flags)` : '(36 Labs)'}</span>
            </button>
          )}

          {hasSimulationActive && onApplySimulatedStack && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleApplySim}
                disabled={isApplyingSim}
                className="px-3 py-1.5 rounded-xl font-black bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-black text-xs transition-all cursor-pointer shadow-lg flex items-center gap-1"
              >
                {isApplyingSim ? <Activity size={12} className="animate-spin" /> : <Check size={12} />}
                <span>Apply Sandbox (+{coverageReport.simulatedDelta}%)</span>
              </button>

              {onClearSimulation && (
                <button
                  type="button"
                  onClick={onClearSimulation}
                  className="px-2 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-white/5 cursor-pointer"
                  title="Clear simulated sandbox stack"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 12 Hallmarks Clickable Quick Selector Chips with Smooth Horizontal Scroll */}
      <div className="relative z-10 w-full min-w-0 overflow-x-auto pb-1.5 scrollbar-thin pt-1">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 shrink-0 pr-1 flex items-center gap-1">
            <Eye size={12} /> Select Pathway:
          </span>
          {items.map(hItem => {
            const isSelected = activeHallmarkId === hItem.meta.id
            return (
              <button
                key={hItem.meta.id}
                type="button"
                onClick={() => onSelectHallmark && onSelectHallmark(hItem.meta.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md scale-105 ring-2 ring-purple-400/30'
                    : hItem.isCovered
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60'
                    : hItem.isModerate
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800/80 hover:bg-amber-900/60'
                    : 'bg-rose-950/60 text-rose-300 border-rose-800/80 hover:bg-rose-900/60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  hItem.isCovered ? 'bg-emerald-400' : hItem.isModerate ? 'bg-amber-400' : 'bg-rose-400'
                }`} />
                <span>{hItem.meta.shortName}</span>
                <span className="font-mono text-[10px] opacity-80">{hItem.score}%</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tier Filter & Comparison Routine Selector */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-1 w-full min-w-0">
        {/* Tier Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-white/10 overflow-x-auto scrollbar-hide text-xs">
          <button
            type="button"
            onClick={() => setSelectedTierFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedTierFilter === 'all'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All 12 Hallmarks
          </button>
          <button
            type="button"
            onClick={() => setSelectedTierFilter('primary')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              selectedTierFilter === 'primary'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
            Primary Damage ({coverageReport.tierScores.primary}%)
          </button>
          <button
            type="button"
            onClick={() => setSelectedTierFilter('antagonistic')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              selectedTierFilter === 'antagonistic'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            Antagonistic ({coverageReport.tierScores.antagonistic}%)
          </button>
          <button
            type="button"
            onClick={() => setSelectedTierFilter('integrative')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              selectedTierFilter === 'integrative'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            Integrative ({coverageReport.tierScores.integrative}%)
          </button>
        </div>

        {/* Comparison Routine Overlay Selector */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold cursor-pointer select-none whitespace-nowrap">
            <input
              type="checkbox"
              checked={showBenchmark}
              onChange={(e) => setShowBenchmark(e.target.checked)}
              style={{ accentColor: selectedBenchmark.colorHex }}
              className="rounded bg-slate-900 focus:ring-0 cursor-pointer"
            />
            <span>Comparison Routine:</span>
          </label>
          <select
            value={selectedBenchmarkId}
            onChange={(e) => setSelectedBenchmarkId(e.target.value)}
            disabled={!showBenchmark}
            aria-label="Select benchmark protocol overlay"
            style={{
              borderColor: `${selectedBenchmark.colorHex}60`,
              color: selectedBenchmark.colorHex,
              boxShadow: `0 0 10px ${selectedBenchmark.colorHex}20`
            }}
            className="text-xs font-bold bg-slate-900 border rounded-xl px-2.5 py-1 focus:outline-none cursor-pointer disabled:opacity-50 transition-all"
          >
            {BENCHMARK_PROFILES.map(b => (
              <option key={b.id} value={b.id} className="bg-slate-950 text-white font-medium">
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Radar Layout: Side-by-Side 2-Column Split on Desktop (lg:grid-cols-12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch pt-1 w-full min-w-0">
        {/* SVG Radar Geometric Canvas (lg:col-span-7) */}
        <div className="lg:col-span-7 flex items-center justify-center p-2 sm:p-3 bg-slate-950/80 rounded-2xl border border-white/5 shadow-inner w-full min-w-0 overflow-hidden min-h-[460px]">
          <svg
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            className="w-full max-w-[540px] h-auto select-none overflow-visible"
          >
            <defs>
              <linearGradient id="userRadarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="simulatedRadarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0.25" />
              </linearGradient>
              <linearGradient id="benchmarkRadarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={selectedBenchmark.colorHex} stopOpacity="0.25" />
                <stop offset="100%" stopColor={selectedBenchmark.colorHex} stopOpacity="0.05" />
              </linearGradient>
              <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* 1. Concentric Background Rings */}
            {gridRings.map((scale, ringIdx) => {
              const ringPoints = spokeData.map(s => {
                const x = centerX + (radius * scale) * s.cos
                const y = centerY + (radius * scale) * s.sin
                return `${x.toFixed(1)},${y.toFixed(1)}`
              }).join(' ')

              return (
                <g key={ringIdx}>
                  <polygon
                    points={ringPoints}
                    fill="none"
                    stroke={ringIdx === 3 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)'}
                    strokeWidth={ringIdx === 3 ? '1.5' : '1'}
                    strokeDasharray={ringIdx === 1 ? '3 3' : undefined}
                  />
                  <text
                    x={centerX + 6}
                    y={centerY - (radius * scale) + 12}
                    fill="rgba(255, 255, 255, 0.35)"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {Math.round(scale * 100)}%
                  </text>
                </g>
              )
            })}

            {/* 2. Spoke Axis Lines */}
            {spokeData.map(s => {
              const isDimmed = selectedTierFilter !== 'all' && s.item.meta.tier !== selectedTierFilter
              return (
                <line
                  key={s.item.meta.id}
                  x1={centerX}
                  y1={centerY}
                  x2={s.xOuter}
                  y2={s.yOuter}
                  stroke={isDimmed ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.12)'}
                  strokeWidth="1"
                />
              )
            })}

            {/* 3. Benchmark Overlay Polygon */}
            {showBenchmark && (
              <g className="transition-all duration-500">
                <polygon
                  points={benchmarkPolygonPoints}
                  fill="url(#benchmarkRadarGrad)"
                  stroke={selectedBenchmark.colorHex}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.85"
                />
                {spokeData.map(s => (
                  <circle
                    key={`bm-${s.item.meta.id}`}
                    cx={s.xBenchmark}
                    cy={s.yBenchmark}
                    r="2.5"
                    fill={selectedBenchmark.colorHex}
                    opacity="0.9"
                  />
                ))}
              </g>
            )}

            {/* 4. Simulated Stack Polygon */}
            {hasSimulationActive && (
              <g className="transition-all duration-700">
                <polygon
                  points={simulatedPolygonPoints}
                  fill="url(#simulatedRadarGrad)"
                  stroke="#06B6D4"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                  filter="url(#radarGlow)"
                  opacity="0.95"
                />
                {spokeData.map(s => (
                  <circle
                    key={`sim-pt-${s.item.meta.id}`}
                    cx={s.xSim}
                    cy={s.ySim}
                    r="4"
                    fill="#06B6D4"
                    stroke="#FFFFFF"
                    strokeWidth="1"
                  />
                ))}
              </g>
            )}

            {/* 5. Active User Routine Polygon */}
            <polygon
              points={userPolygonPoints}
              fill="url(#userRadarGrad)"
              stroke="#10B981"
              strokeWidth="2.5"
              filter="url(#radarGlow)"
              className="transition-all duration-700 ease-out"
            />

            {/* 6. Interactive Vertex Dots */}
            {spokeData.map(s => {
              const isSelected = activeHallmarkId === s.item.meta.id
              const isDimmed = selectedTierFilter !== 'all' && s.item.meta.tier !== selectedTierFilter
              const isGap = s.item.isGap

              return (
                <g
                  key={`user-pt-${s.item.meta.id}`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredHallmarkId(s.item.meta.id)}
                  onMouseLeave={() => setHoveredHallmarkId(null)}
                  onClick={() => onSelectHallmark && onSelectHallmark(s.item.meta.id)}
                >
                  <circle
                    cx={s.xUser}
                    cy={s.yUser}
                    r="14"
                    fill="transparent"
                  />

                  {isSelected && (
                    <circle
                      cx={s.xUser}
                      cy={s.yUser}
                      r="9"
                      fill="none"
                      stroke={isGap ? '#EF4444' : '#10B981'}
                      strokeWidth="2"
                      opacity="0.8"
                    />
                  )}

                  <circle
                    cx={s.xUser}
                    cy={s.yUser}
                    r={isSelected ? '5.5' : isGap ? '4.5' : '4'}
                    fill={isGap ? '#EF4444' : s.item.isCovered ? '#10B981' : '#F59E0B'}
                    stroke="#FFFFFF"
                    strokeWidth={isSelected ? '2' : '1'}
                    opacity={isDimmed ? '0.3' : '1'}
                  />
                </g>
              )
            })}

            {/* 7. Spoke Outer Labels with Safe Horizontal Anchoring */}
            {spokeData.map(s => {
              const isSelected = activeHallmarkId === s.item.meta.id
              const isDimmed = selectedTierFilter !== 'all' && s.item.meta.tier !== selectedTierFilter
              const isGap = s.item.isGap

              let textAnchor: 'middle' | 'start' | 'end' = 'middle'
              let labelOffsetX = 0
              if (s.cos > 0.2) {
                textAnchor = 'start'
                labelOffsetX = 4
              } else if (s.cos < -0.2) {
                textAnchor = 'end'
                labelOffsetX = -4
              }

              return (
                <g
                  key={`label-${s.item.meta.id}`}
                  className="cursor-pointer"
                  opacity={isDimmed ? 0.3 : 1}
                  onMouseEnter={() => setHoveredHallmarkId(s.item.meta.id)}
                  onMouseLeave={() => setHoveredHallmarkId(null)}
                  onClick={() => onSelectHallmark && onSelectHallmark(s.item.meta.id)}
                >
                  <text
                    x={s.xLabel + labelOffsetX}
                    y={s.yLabel - 1}
                    textAnchor={textAnchor}
                    fill={isSelected ? '#FFFFFF' : isGap ? '#FCA5A5' : '#CBD5E1'}
                    fontSize="10"
                    fontWeight={isSelected ? '800' : '600'}
                    className="select-none pointer-events-none"
                  >
                    {s.item.meta.shortName}
                  </text>
                  <text
                    x={s.xLabel + labelOffsetX}
                    y={s.yLabel + 11}
                    textAnchor={textAnchor}
                    fill={isGap ? '#EF4444' : s.item.isCovered ? '#34D399' : '#FBBF24'}
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    className="select-none pointer-events-none"
                  >
                    {s.item.score}%
                    {hasSimulationActive && s.simScore > s.item.score && (
                      <tspan fill="#06B6D4"> → {s.simScore}%</tspan>
                    )}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Spoke Detail Inspection Panel (lg:col-span-5) */}
        <div className="lg:col-span-5 w-full min-w-0 max-w-full flex flex-col justify-between">
          <div className="flex-1 overflow-y-auto max-h-[460px] pr-1 scrollbar-thin space-y-3.5 min-w-0">
            {activeHallmarkItem ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/95 border border-purple-500/30 shadow-xl space-y-4 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-300">
                        {activeHallmarkItem.meta.tierLabel}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        activeHallmarkItem.isCovered ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        activeHallmarkItem.isModerate ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {activeHallmarkItem.score}% Coverage
                      </span>
                      {hasSimulationActive && (coverageReport.simulatedHallmarkMap?.[activeHallmarkItem.meta.id] ?? 0) > activeHallmarkItem.score && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {coverageReport.simulatedHallmarkMap![activeHallmarkItem.meta.id]}% Simulated
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-white mt-1 break-words">
                      {activeHallmarkItem.meta.name}
                    </h3>
                  </div>

                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold shrink-0">
                    <Dna size={18} />
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed break-words">
                  {activeHallmarkItem.meta.description}
                </p>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 text-xs space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1">
                    <AlertTriangle size={12} className="text-rose-400 shrink-0" /> Biological Vulnerability if Neglected:
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed break-words">
                    {activeHallmarkItem.meta.biologicalConsequence}
                  </p>
                </div>

                {/* Benchmark Comparison Delta with Exact Protocols */}
                {showBenchmark && (
                  <div
                    className="p-3.5 rounded-xl border text-xs space-y-2 transition-all shadow-md"
                    style={{
                      backgroundColor: `${selectedBenchmark.colorHex}14`,
                      borderColor: `${selectedBenchmark.colorHex}50`
                    }}
                  >
                    <div className="flex items-center justify-between text-slate-300 flex-wrap gap-1">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Sparkles size={13} style={{ color: selectedBenchmark.colorHex }} className="shrink-0" />
                        Comparison Routine ({selectedBenchmark.creator}):
                      </span>
                      <span
                        className="font-mono font-black text-xs px-2.5 py-0.5 rounded-full border shadow-sm"
                        style={{
                          color: selectedBenchmark.colorHex,
                          backgroundColor: `${selectedBenchmark.colorHex}25`,
                          borderColor: `${selectedBenchmark.colorHex}60`
                        }}
                      >
                        {selectedBenchmark.scores[activeHallmarkItem.meta.id]}% Coverage
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-white/5 space-y-1">
                      <span
                        className="text-[10px] font-mono font-bold uppercase tracking-wider block"
                        style={{ color: selectedBenchmark.colorHex }}
                      >
                        Targeted Protocol:
                      </span>
                      <p className="text-[11px] text-slate-200 leading-relaxed font-sans break-words">
                        {selectedBenchmark.hallmarkProtocols?.[activeHallmarkItem.meta.id] || 'Multi-compound intervention targeting this cellular pathway.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Active Supporting Modalities in Stack with Detailed Cellular Mechanisms */}
                <div className="space-y-2 pt-1 border-t border-white/5">
                  <div className="text-[11px] font-bold text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      Active Protecting Modalities ({activeHallmarkItem.supportingModalities.length}):
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {activeHallmarkItem.score}% Coverage
                    </span>
                  </div>

                  {activeHallmarkItem.supportingModalities.length > 0 ? (
                    <div className="space-y-2.5">
                      {activeHallmarkItem.supportingModalities.map((supp, i) => {
                        const isLong = (supp.exactMechanism || '').length > 180
                        const isExp = expandedSupportingIds.has(supp.modality.id)

                        return (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-2 shadow-md min-w-0"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="space-y-0.5 min-w-0">
                                <span className="text-xs font-black text-white block break-words">
                                  {supp.modality.display_name || supp.modality.name}
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                    {supp.clinicalEvidenceGrade}
                                  </span>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300">
                                    {supp.effortLabel || 'Routine'}
                                  </span>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                    {supp.frequency || 'Daily'}
                                  </span>
                                </div>
                              </div>

                              <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0">
                                Score: {supp.evidenceScore}/5
                              </span>
                            </div>

                            {/* Exact Cellular Mechanism Box */}
                            <div
                              onClick={() => {
                                if (isLong) {
                                  toggleSupportingExpand(supp.modality.id)
                                }
                              }}
                              className={`p-2.5 rounded-lg bg-slate-950/80 border border-white/5 space-y-1 transition-all ${
                                isLong ? 'cursor-pointer hover:border-emerald-500/30' : ''
                              }`}
                              title={isLong ? (isExp ? 'Click to collapse' : 'Click to expand full mechanism') : undefined}
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                                <span className="flex items-center gap-1">
                                  <Dna size={11} className="shrink-0" /> Cellular Mechanism:
                                </span>
                                {isLong && (
                                  <span className="text-[10px] text-emerald-400 underline cursor-pointer normal-case font-sans">
                                    {isExp ? 'Show less ▴' : 'Expand ▾'}
                                  </span>
                                )}
                              </div>
                              <p className={`text-[11px] text-slate-300 leading-relaxed break-words ${isExp ? '' : 'line-clamp-6'}`}>
                                {supp.exactMechanism}
                              </p>
                            </div>

                            {/* PubMed Link */}
                            {supp.pubMedUrl && (
                              <div className="w-full overflow-hidden pt-0.5">
                                <a
                                  href={supp.pubMedUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-[10px] text-purple-400 hover:text-purple-300 hover:underline font-semibold max-w-full truncate"
                                >
                                  <ExternalLink size={10} className="shrink-0 text-purple-400" />
                                  <span className="truncate flex-1 min-w-0">
                                    {supp.pubMedTitle || 'Verified PubMed Citation'}
                                  </span>
                                  {supp.pmid && (
                                    <span className="text-slate-400 font-mono text-[9px] shrink-0">
                                      PMID: {supp.pmid}
                                    </span>
                                  )}
                                </a>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200">
                      ⚠️ <strong>Unprotected Pathway:</strong> No active modalities in your daily routine currently target this cellular hallmark.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-white/10 text-center space-y-2.5 flex flex-col items-center justify-center min-h-[380px]">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                  <Target size={24} />
                </div>
                <h4 className="text-sm font-extrabold text-white">Interactive Pathway Inspector</h4>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Click any of the 12 pathway chips above or touch any vertex on the radar chart to inspect all active protecting modalities, cellular mechanisms, and comparison scores.
                </p>
              </div>
            )}
          </div>

          {/* Quick Legend Bar */}
          <div className="mt-3 flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/60 border border-white/5 text-[11px] text-slate-400 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
              <span className="text-slate-200 font-bold">Your Routine</span>
            </div>

            {hasSimulationActive && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-cyan-400 shrink-0" />
                <span className="text-cyan-300 font-bold">Simulated Stack</span>
              </div>
            )}

            {showBenchmark && (
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3 h-0.5 border-t-2 border-dashed shrink-0"
                  style={{ borderColor: selectedBenchmark.colorHex }}
                />
                <span
                  className="font-bold transition-colors"
                  style={{ color: selectedBenchmark.colorHex }}
                >
                  Comparison Routine ({selectedBenchmark.creator})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
