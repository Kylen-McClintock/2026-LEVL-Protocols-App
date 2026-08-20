'use client'

import React, { useState, useMemo } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Dna,
  Heart,
  Sliders,
  Sparkles,
  Info,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  X,
  Plus,
  Edit2,
  Check,
  Filter,
  Layers,
  FlaskConical,
  ArrowUpDown,
  LayoutGrid,
  ListTree
} from 'lucide-react'
import {
  COMPREHENSIVE_HALLMARK_BIOMARKERS,
  BiomarkerDefinition,
  evaluateComprehensiveBiomarkers,
  HallmarkBiomarkerStatus,
  HALLMARK_COLOR_CONFIGS,
  HallmarkColorConfig
} from '@/lib/tracking/hallmarkBiomarkerEngine'

type SortOption =
  | 'clinical_hierarchy'
  | 'risk_severity'
  | 'logged_first'
  | 'unlogged_first'
  | 'sample_type'
  | 'name_asc'

interface HallmarkBiomarkersPanelProps {
  userReadings: Record<string, number>
  onUpdateReading: (biomarkerId: string, value: number) => void
  onClose?: () => void
  onSelectHallmark?: (hallmarkId: string) => void
}

export function HallmarkBiomarkersPanel({
  userReadings,
  onUpdateReading,
  onClose,
  onSelectHallmark
}: HallmarkBiomarkersPanelProps) {
  const [expandedBiomarkerId, setExpandedBiomarkerId] = useState<string | null>(null)
  const [editingBiomarkerId, setEditingBiomarkerId] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'logged' | 'unlogged'>('all')
  const [selectedHallmarkFilter, setSelectedHallmarkFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('clinical_hierarchy')
  const [viewMode, setViewMode] = useState<'grouped' | 'grid'>('grouped')

  const evaluatedStatuses = useMemo(() => {
    return evaluateComprehensiveBiomarkers(userReadings)
  }, [userReadings])

  const totalBiomarkers = COMPREHENSIVE_HALLMARK_BIOMARKERS.length
  const loggedCount = useMemo(() => {
    return Object.keys(userReadings).filter(k => {
      const val = userReadings[k]
      return val !== undefined && val !== null && !isNaN(val)
    }).length
  }, [userReadings])
  const unloggedCount = totalBiomarkers - loggedCount

  const highRiskCount = evaluatedStatuses.filter(s => s.riskLevel === 'high').length
  const moderateRiskCount = evaluatedStatuses.filter(s => s.riskLevel === 'moderate').length
  const optimalCount = evaluatedStatuses.filter(s => s.riskLevel === 'optimal').length

  // Filtered & Sorted Biomarkers List
  const processedBiomarkers = useMemo(() => {
    // 1. Filter
    const filtered = COMPREHENSIVE_HALLMARK_BIOMARKERS.filter(bm => {
      if (selectedHallmarkFilter !== 'all' && bm.hallmarkId !== selectedHallmarkFilter) {
        return false
      }

      const hasVal = userReadings[bm.id] !== undefined && userReadings[bm.id] !== null && !isNaN(userReadings[bm.id])
      if (statusFilter === 'logged' && !hasVal) return false
      if (statusFilter === 'unlogged' && hasVal) return false

      return true
    })

    // 2. Sort
    return filtered.sort((a, b) => {
      const valA = userReadings[a.id]
      const hasValA = valA !== undefined && valA !== null && !isNaN(valA)
      const valB = userReadings[b.id]
      const hasValB = valB !== undefined && valB !== null && !isNaN(valB)

      if (sortBy === 'clinical_hierarchy') {
        if (a.hallmarkId !== b.hallmarkId) return a.hallmarkName.localeCompare(b.hallmarkName)
        return a.relevanceRank - b.relevanceRank
      }

      if (sortBy === 'risk_severity') {
        const getScore = (bm: BiomarkerDefinition, hasVal: boolean, val: number) => {
          if (!hasVal) return 2 // unlogged in the middle
          if (bm.isHighRisk(val)) return 4 // High risk first
          if (bm.isModerateRisk(val)) return 3 // Moderate risk next
          return 1 // Optimal last
        }
        const scoreA = getScore(a, hasValA, valA)
        const scoreB = getScore(b, hasValB, valB)
        if (scoreA !== scoreB) return scoreB - scoreA
        return a.relevanceRank - b.relevanceRank
      }

      if (sortBy === 'logged_first') {
        if (hasValA !== hasValB) return hasValA ? -1 : 1
        return a.relevanceRank - b.relevanceRank
      }

      if (sortBy === 'unlogged_first') {
        if (hasValA !== hasValB) return hasValA ? 1 : -1
        return a.relevanceRank - b.relevanceRank
      }

      if (sortBy === 'sample_type') {
        const sampleOrder: Record<string, number> = {
          'Wearable / Continuous': 1,
          'Functional CPET': 2,
          'Blood / Serum': 3,
          'Urine': 4,
          'Saliva': 5,
          'Stool DNA': 6
        }
        const orderA = sampleOrder[a.sampleType] || 99
        const orderB = sampleOrder[b.sampleType] || 99
        if (orderA !== orderB) return orderA - orderB
        return a.relevanceRank - b.relevanceRank
      }

      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name)
      }

      return 0
    })
  }, [selectedHallmarkFilter, statusFilter, sortBy, userReadings])

  // Grouped by Hallmark Map
  const groupedByHallmark = useMemo(() => {
    const map = new Map<string, { config: HallmarkColorConfig; status?: HallmarkBiomarkerStatus; items: BiomarkerDefinition[] }>()

    Object.keys(HALLMARK_COLOR_CONFIGS).forEach(hId => {
      const config = HALLMARK_COLOR_CONFIGS[hId]
      const status = evaluatedStatuses.find(s => s.hallmarkId === hId)
      const matchingItems = processedBiomarkers.filter(bm => bm.hallmarkId === hId)

      if (matchingItems.length > 0) {
        map.set(hId, {
          config,
          status,
          items: matchingItems
        })
      }
    })

    return map
  }, [processedBiomarkers, evaluatedStatuses])

  const handleStartEdit = (bm: BiomarkerDefinition) => {
    setEditingBiomarkerId(bm.id)
    const existing = userReadings[bm.id]
    setTempValue(existing !== undefined && existing !== null ? String(existing) : '')
  }

  const handleSaveEdit = (bmId: string) => {
    const num = parseFloat(tempValue)
    if (!isNaN(num)) {
      onUpdateReading(bmId, num)
    }
    setEditingBiomarkerId(null)
  }

  const renderBiomarkerCard = (bm: BiomarkerDefinition) => {
    const userVal = userReadings[bm.id]
    const isMeasured = userVal !== undefined && userVal !== null && !isNaN(userVal)
    const isOptimal = isMeasured && bm.isOptimal(userVal)
    const isModerate = isMeasured && bm.isModerateRisk(userVal)
    const isHighRisk = isMeasured && bm.isHighRisk(userVal)
    const isExpanded = expandedBiomarkerId === bm.id
    const isEditing = editingBiomarkerId === bm.id
    const hConfig = HALLMARK_COLOR_CONFIGS[bm.hallmarkId] || {
      colorHex: '#A855F7',
      textClass: 'text-purple-400',
      badgeClass: 'bg-purple-950/80 border-purple-500/50 text-purple-300'
    }

    return (
      <div
        key={bm.id}
        style={{
          borderLeftColor: hConfig.colorHex,
          borderLeftWidth: '4px'
        }}
        className={`rounded-2xl border p-4 sm:p-4.5 transition-all relative overflow-hidden backdrop-blur-md flex flex-col justify-between space-y-3 shadow-lg ${
          !isMeasured
            ? 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
            : isHighRisk
            ? 'border-rose-500/40 bg-gradient-to-b from-rose-950/25 to-slate-950 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
            : isModerate
            ? 'border-amber-500/40 bg-gradient-to-b from-amber-950/20 to-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
            : 'border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 to-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
        }`}
      >
        {/* Card Header & Value */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Specific Hallmark Color-Coded Badge */}
                <span
                  style={{
                    backgroundColor: `${hConfig.colorHex}18`,
                    borderColor: `${hConfig.colorHex}50`,
                    color: hConfig.colorHex
                  }}
                  className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border shadow-sm"
                >
                  {bm.hallmarkName}
                </span>

                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                  bm.relevanceRank === 1
                    ? 'bg-purple-950/80 text-purple-300 border-purple-700/80'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700'
                }`}>
                  {bm.tier}
                </span>

                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {bm.sampleType}
                </span>
              </div>

              <h4 className="text-sm font-black text-white mt-1.5 flex items-center gap-1.5 break-words">
                {bm.name}
              </h4>
            </div>

            {/* Value / Unlogged State Indicator */}
            <div className="text-right shrink-0">
              {isMeasured ? (
                <div>
                  <div className="text-lg font-black font-mono text-white flex items-center justify-end gap-1">
                    <span>{userVal}</span>
                    <span className="text-[11px] font-normal text-slate-400 font-sans">{bm.unit}</span>
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 border ${
                    isHighRisk
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : isModerate
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  }`}>
                    {isHighRisk ? 'At-Risk Outlier' : isModerate ? 'Sub-Optimal' : 'Optimal Tier'}
                  </span>
                </div>
              ) : (
                <div>
                  <div className="text-base font-black font-mono text-slate-500">
                    -- <span className="text-[10px] font-sans font-normal">{bm.unit}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-white/10 text-slate-400 inline-block mt-0.5">
                    Not Measured Yet
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Optimal Target & Inline Edit */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-white/5">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">Optimal Target: </span>
              <strong className="text-emerald-400 font-mono text-xs">{bm.optimalRangeLabel}</strong>
            </div>

            {!isEditing ? (
              <button
                type="button"
                onClick={() => handleStartEdit(bm)}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer hover:underline"
              >
                <Edit2 size={11} />
                <span>{isMeasured ? 'Edit Lab' : '+ Enter Lab Result'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 animate-in fade-in">
                <input
                  type="number"
                  step="any"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  placeholder="Value..."
                  className="w-20 px-2 py-0.5 rounded bg-slate-900 border border-cyan-500 text-white font-mono text-xs focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleSaveEdit(bm.id)}
                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1"
                >
                  <Check size={11} />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBiomarkerId(null)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Expandable Clinical Details */}
          {isExpanded && (
            <div className="space-y-2 pt-2 border-t border-white/5 text-xs animate-in fade-in">
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {bm.clinicalMeaning}
              </p>

              {bm.orderingTip && (
                <div className="p-2 rounded-lg bg-slate-950/80 border border-white/5 text-[10px] text-cyan-300 font-mono">
                  💡 <strong>How to Order:</strong> {bm.orderingTip}
                </div>
              )}

              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 block">
                  Recommended Protocol Interventions:
                </span>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {bm.recommendedInterventions.map((rec, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-200"
                    >
                      {rec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setExpandedBiomarkerId(isExpanded ? null : bm.id)}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer font-semibold"
          >
            <span>{isExpanded ? 'Hide Details' : 'Clinical Details & Protocols'}</span>
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {onSelectHallmark && (
            <button
              type="button"
              onClick={() => onSelectHallmark(bm.hallmarkId)}
              style={{ color: hConfig.colorHex }}
              className="text-[11px] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect Pathway</span>
              <Dna size={11} />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-rose-500/30 bg-slate-950/95 p-4 sm:p-7 shadow-2xl backdrop-blur-xl space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40">
              <Activity size={14} className="text-rose-400" />
              Clinical Lab Diagnostics &amp; Hallmarks Cross-Link
            </span>
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300">
              {loggedCount}/{totalBiomarkers} Labs Measured
            </span>
            {highRiskCount > 0 && (
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-800 text-rose-300">
                {highRiskCount} At-Risk Outliers
              </span>
            )}
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5">
            Objective Biomarkers Mapped to 12 Hallmarks
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
            Connect verified blood, metabolic, and epigenetic test results directly to the 12 Hallmarks. Each hallmark is color-coded for visual recognition. Sort by clinical hierarchy, risk severity, or specimen type to prioritize your testing roadmap.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Aggregate Health State & Data Coverage Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
              Optimal Ranges
            </span>
            <div className="text-lg font-black text-white font-mono">
              {optimalCount} Pathways Optimal
            </div>
          </div>
          <ShieldCheck size={24} className="text-emerald-400 shrink-0" />
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
              Sub-Optimal Warnings
            </span>
            <div className="text-lg font-black text-white font-mono">
              {moderateRiskCount} Pathways
            </div>
          </div>
          <AlertTriangle size={24} className="text-amber-400 shrink-0" />
        </div>

        <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
              Diagnostic Coverage
            </span>
            <div className="text-lg font-black text-white font-mono">
              {loggedCount} of {totalBiomarkers} Tests Logged
            </div>
          </div>
          <FlaskConical size={24} className="text-cyan-400 shrink-0" />
        </div>
      </div>

      {/* Interactive Toolbar: 3-Way Status Toggle, Sort Mechanism, Hallmark Filter & View Mode */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-white/10 text-xs">
        {/* Left: 3-Way Status Toggle */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold px-1 flex items-center gap-1">
            <Filter size={11} /> Filter:
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-950/60'
            }`}
          >
            All Diagnostic Tests ({totalBiomarkers})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('logged')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'logged'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-950/60'
            }`}
          >
            <CheckCircle2 size={12} className="text-emerald-300" />
            <span>✅ Logged Lab Data ({loggedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('unlogged')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'unlogged'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-950/60'
            }`}
          >
            <Plus size={12} className="text-cyan-300" />
            <span>🎯 Unmeasured ({unloggedCount})</span>
          </button>
        </div>

        {/* Right: Sort Mechanism, Hallmark Filter & View Layout Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sorting Mechanism Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
              <ArrowUpDown size={11} className="text-purple-400" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs font-bold bg-slate-950 border border-purple-500/40 text-purple-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-purple-400 cursor-pointer shadow-sm"
            >
              <option value="clinical_hierarchy">Clinical Hierarchy (Gold Standard → Specialized)</option>
              <option value="risk_severity">Risk Severity (High-Risk Outliers First)</option>
              <option value="logged_first">Measurement Status (Logged Labs First)</option>
              <option value="unlogged_first">Needs Testing (Unlogged Labs First)</option>
              <option value="sample_type">Specimen Type (Wearable → Blood → Stool)</option>
              <option value="name_asc">Alphabetical (A → Z)</option>
            </select>
          </div>

          {/* Hallmark Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedHallmarkFilter}
              onChange={(e) => setSelectedHallmarkFilter(e.target.value)}
              className="text-xs font-bold bg-slate-950 border border-white/10 text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="all">All 12 Hallmarks</option>
              {Object.keys(HALLMARK_COLOR_CONFIGS).map(hId => (
                <option key={hId} value={hId}>
                  {HALLMARK_COLOR_CONFIGS[hId].name}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle: Grouped Sections vs Unified Grid */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-950 border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              title="Group by Hallmark Section"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListTree size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Unified Grid"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Biomarkers Render Area */}
      {viewMode === 'grouped' ? (
        /* Grouped by Hallmark View: 12 Color-Coded Hallmark Sections */
        <div className="space-y-6">
          {Array.from(groupedByHallmark.entries()).map(([hId, group]) => {
            const { config, status, items } = group
            const measuredInGroup = items.filter(bm => userReadings[bm.id] !== undefined && userReadings[bm.id] !== null && !isNaN(userReadings[bm.id])).length

            return (
              <div
                key={hId}
                style={{ borderColor: `${config.colorHex}30` }}
                className="rounded-3xl border bg-slate-950/70 p-4 sm:p-5 shadow-xl space-y-4"
              >
                {/* Hallmark Section Header with Specific Distinct Color */}
                <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div
                      style={{
                        backgroundColor: `${config.colorHex}20`,
                        borderColor: `${config.colorHex}50`,
                        color: config.colorHex
                      }}
                      className="w-8 h-8 rounded-xl border flex items-center justify-center font-bold shrink-0 shadow-sm"
                    >
                      <Dna size={16} />
                    </div>

                    <div>
                      <h4
                        style={{ color: config.colorHex }}
                        className="text-base font-black tracking-tight"
                      >
                        {config.name}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        {measuredInGroup}/{items.length} Diagnostic Tests Logged
                      </span>
                    </div>
                  </div>

                  {/* Group Status Badge */}
                  <div className="flex items-center gap-1.5">
                    {status?.riskLevel === 'high' ? (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                        ⚠️ High Risk Outlier Detected
                      </span>
                    ) : status?.riskLevel === 'moderate' ? (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                        ⚠️ Sub-Optimal Range
                      </span>
                    ) : status?.riskLevel === 'optimal' ? (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                        ✓ Optimal Pathway
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-white/10">
                        Unmeasured Pathway
                      </span>
                    )}

                    {onSelectHallmark && (
                      <button
                        type="button"
                        onClick={() => onSelectHallmark(hId)}
                        style={{ color: config.colorHex }}
                        className="text-[11px] font-bold hover:underline flex items-center gap-1 pl-1 cursor-pointer"
                      >
                        <span>Inspect</span>
                        <Dna size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Cards for this Hallmark */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {items.map(bm => renderBiomarkerCard(bm))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Unified Grid View: Sorted Globally */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {processedBiomarkers.map(bm => renderBiomarkerCard(bm))}
        </div>
      )}
    </div>
  )
}
