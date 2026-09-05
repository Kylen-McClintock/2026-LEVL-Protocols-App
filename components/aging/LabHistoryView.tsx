'use client'

import React, { useState } from 'react'
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Activity, 
  ArrowRight,
  LineChart,
  Info,
  X,
  FileText,
  ChevronRight,
  Search,
  Edit2,
  Trash2,
  Check,
  AlertCircle
} from 'lucide-react'
import { UserLabPanel, BiomarkerMeasurementRecord } from '@/lib/aging-models/bioAgeTypes'
import { BIOMARKER_REGISTRY, resolveCanonicalBiomarkerId } from '@/lib/aging-models/biomarkerRegistry'
import BiomarkerRangeVisual from '@/components/ui/BiomarkerRangeVisual'
import BiomarkerAlgorithmBadges from '@/components/ui/BiomarkerAlgorithmBadges'
import { updateBiomarkerMeasurement, deleteBiomarkerMeasurement } from '@/lib/data/bloodworkData'

interface LabHistoryViewProps {
  panels: UserLabPanel[]
  measurements: BiomarkerMeasurementRecord[]
  onSelectBiomarker: (biomarkerId: string) => void
  onRefreshData?: () => void
}

/**
 * Visual SVG Sparkline Trendline Curve Component
 */
function BiomarkerTrendLine({ points, isFavorable }: { points: Array<{ date: string; val: number }>; isFavorable: boolean }) {
  if (points.length < 2) return null
  const vals = points.map(p => p.val)
  const minVal = Math.min(...vals)
  const maxVal = Math.max(...vals)
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal

  const width = 140
  const height = 36
  const padding = 6

  const coords = points.map((p, idx) => {
    const x = padding + (idx / (points.length - 1)) * (width - 2 * padding)
    const y = height - padding - ((p.val - minVal) / range) * (height - 2 * padding)
    return { x, y, val: p.val, date: p.date }
  })

  const pathD = coords.reduce((acc, pt, idx) => (
    idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`
  ), '')

  const strokeColor = isFavorable ? '#34d399' : '#fbbf24'

  return (
    <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
      <svg width={width} height={height} className="overflow-visible">
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill={strokeColor} className="stroke-black stroke-2" />
        ))}
      </svg>
      <div className="text-[10px] font-mono text-gray-400 leading-tight">
        <div>{points[0].val}</div>
        <div className="text-white font-bold">{points[points.length - 1].val}</div>
      </div>
    </div>
  )
}

export default function LabHistoryView({
  panels,
  measurements,
  onSelectBiomarker,
  onRefreshData
}: LabHistoryViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'improving' | 'concerning' | 'review'>('all')
  const [selectedPanelModal, setSelectedPanelModal] = useState<UserLabPanel | null>(null)
  const [panelSearchQuery, setPanelSearchQuery] = useState('')

  // Editing state for an individual biomarker inside modal
  const [editingMeasurement, setEditingMeasurement] = useState<BiomarkerMeasurementRecord | null>(null)
  const [editVal, setEditVal] = useState<string>('')
  const [editUnit, setEditUnit] = useState<string>('')
  const [editName, setEditName] = useState<string>('')

  // React-based inline deletion confirmation state (replacing native browser confirm())
  const [deletingKey, setDeletingKey] = useState<string | null>(null)

  if (panels.length === 0) {
    return (
      <div className="glass-card p-10 rounded-3xl border border-white/10 text-center space-y-4">
        <div className="p-4 rounded-full bg-white/5 border border-white/10 w-16 h-16 mx-auto flex items-center justify-center">
          <Activity size={32} className="text-indigo-400" />
        </div>
        <h3 className="text-lg font-bold text-white">No Bloodwork Panels Found</h3>
        <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
          Upload your lab PDFs or screenshot reports to view longitudinal biomarker trend graphs, biological age trajectories, and automated AI clinical trend analysis.
        </p>
      </div>
    )
  }

  // Sort panels chronologically (newest first for display)
  const sortedPanelsNewestFirst = [...panels].sort((a, b) => new Date(b.collection_date).getTime() - new Date(a.collection_date).getTime())

  // Group measurements by resolved canonical biomarker_id across all panels
  const biomarkerTrajectoriesMap = new Map<string, Array<{ date: string; val: number; panelId: string; rawName?: string; unit?: string; flag?: string; confidence?: number; record: BiomarkerMeasurementRecord }>>()

  measurements.forEach(m => {
    const resolvedId = m.biomarker_id && BIOMARKER_REGISTRY[m.biomarker_id]
      ? m.biomarker_id
      : (resolveCanonicalBiomarkerId(m.raw_name) || m.biomarker_id || m.raw_name.toLowerCase().replace(/[^a-z0-9]/g, '_'))

    if (!biomarkerTrajectoriesMap.has(resolvedId)) {
      biomarkerTrajectoriesMap.set(resolvedId, [])
    }
    const existingList = biomarkerTrajectoriesMap.get(resolvedId)!
    const exists = existingList.some(p => p.panelId === m.panel_id || p.date === m.collection_date)
    if (!exists) {
      existingList.push({
        date: m.collection_date || '2026-01-01',
        val: Number(m.normalized_value),
        panelId: m.panel_id || 'unknown',
        rawName: m.raw_name,
        unit: m.normalized_unit,
        flag: m.lab_flag,
        confidence: m.extraction_confidence,
        record: m
      })
    }
  })

  // Sort data points within each biomarker trajectory chronologically
  biomarkerTrajectoriesMap.forEach(points => {
    points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  })

  // Longitudinal Trend Analysis & Inconsistency Flagging logic
  const favorableTrends: Array<{
    id: string
    name: string
    unit: string
    firstVal: number
    latestVal: number
    changePct: number
    rationale: string
    points: Array<{ date: string; val: number }>
  }> = []

  const concerningTrends: Array<{
    id: string
    name: string
    unit: string
    firstVal: number
    latestVal: number
    changePct: number
    rationale: string
    points: Array<{ date: string; val: number }>
  }> = []

  const reviewFlaggedTrends: Array<{
    id: string
    name: string
    unit: string
    latestVal: number
    reason: string
    points: Array<{ date: string; val: number }>
  }> = []

  const stableOrSingleTrends: Array<{
    id: string
    name: string
    unit: string
    latestVal: number
    points: Array<{ date: string; val: number }>
  }> = []

  biomarkerTrajectoriesMap.forEach((points, biomarkerId) => {
    const def = BIOMARKER_REGISTRY[biomarkerId]
    const name = def?.name || points[0].rawName || biomarkerId
    const unit = def?.primary_unit || points[0].unit || ''

    const firstVal = points[0].val
    const latestVal = points[points.length - 1].val
    const optMin = def?.levl_optimal_zone.min ?? 0
    const optMax = def?.levl_optimal_zone.max ?? 100

    const diff = latestVal - firstVal
    const changePct = firstVal !== 0 ? Math.abs((diff / firstVal) * 100) : 0

    // Outlier / Inconsistency Check
    const hasLowConfidence = points.some(p => (p.confidence ?? 1.0) < 0.8)
    const hasLabFlag = points.some(p => p.flag === 'high' || p.flag === 'low' || p.flag === 'critical')
    const hasHugeShift = points.length >= 2 && changePct > 45 // > 45% shift between draws

    if (hasLowConfidence || hasLabFlag || hasHugeShift) {
      reviewFlaggedTrends.push({
        id: biomarkerId,
        name,
        unit,
        latestVal,
        reason: hasHugeShift 
          ? `Significant shift (${changePct.toFixed(0)}% delta) between draws.`
          : hasLabFlag 
          ? `Lab reported out-of-range flag (${points[points.length - 1].flag || 'abnormal'}).` 
          : `Extraction confidence requires manual verification.`,
        points
      })
    }

    const isLowerBetter = ['crp', 'apob', 'hba1c', 'triglycerides', 'glucose', 'ldl', 'rdw', 'wbc', 'alt', 'ast', 'homocysteine', 'lpa', 'fasting_insulin'].includes(biomarkerId)
    const inOptimalZone = def ? (latestVal >= optMin && latestVal <= optMax) : true

    if (points.length >= 2) {
      if (isLowerBetter) {
        if (diff < 0 || inOptimalZone) {
          favorableTrends.push({
            id: biomarkerId,
            name,
            unit,
            firstVal,
            latestVal,
            changePct,
            rationale: inOptimalZone 
              ? `Maintained inside LEVL Optimal Target Zone (${optMin} - ${optMax} ${unit}).` 
              : `Decreased by ${Math.abs(diff).toFixed(1)} ${unit} towards optimal zone.`,
            points
          })
        } else {
          concerningTrends.push({
            id: biomarkerId,
            name,
            unit,
            firstVal,
            latestVal,
            changePct,
            rationale: `Increased by +${diff.toFixed(1)} ${unit} above baseline level.`,
            points
          })
        }
      } else {
        if (diff >= 0 || inOptimalZone) {
          favorableTrends.push({
            id: biomarkerId,
            name,
            unit,
            firstVal,
            latestVal,
            changePct,
            rationale: inOptimalZone 
              ? `Maintained inside LEVL Optimal Target Zone (${optMin} - ${optMax} ${unit}).` 
              : `Increased by +${diff.toFixed(1)} ${unit} towards optimal reserve.`,
            points
          })
        } else {
          concerningTrends.push({
            id: biomarkerId,
            name,
            unit,
            firstVal,
            latestVal,
            changePct,
            rationale: `Declined by ${Math.abs(diff).toFixed(1)} ${unit} below baseline level.`,
            points
          })
        }
      }
    } else {
      stableOrSingleTrends.push({
        id: biomarkerId,
        name,
        unit,
        latestVal,
        points
      })
    }
  })

  // Get measurements for selected panel modal
  const modalPanelMeasurements = selectedPanelModal 
    ? (selectedPanelModal.measurements && selectedPanelModal.measurements.length > 0 
        ? selectedPanelModal.measurements 
        : measurements.filter(m => m.panel_id === selectedPanelModal.id))
    : []

  const filteredModalMeasurements = modalPanelMeasurements.filter(m => {
    const def = BIOMARKER_REGISTRY[m.biomarker_id] || (resolveCanonicalBiomarkerId(m.raw_name) ? BIOMARKER_REGISTRY[resolveCanonicalBiomarkerId(m.raw_name)!] : undefined)
    const name = def?.name || m.raw_name
    return name.toLowerCase().includes(panelSearchQuery.toLowerCase()) || m.raw_name.toLowerCase().includes(panelSearchQuery.toLowerCase())
  })

  const handleStartEdit = (m: BiomarkerMeasurementRecord) => {
    setEditingMeasurement(m)
    setEditVal((m.normalized_value ?? m.raw_value ?? '').toString())
    setEditUnit(m.normalized_unit || '')
    setEditName(m.raw_name || '')
  }

  const handleSaveEdit = async () => {
    if (!editingMeasurement || !selectedPanelModal) return
    const userId = selectedPanelModal.user_id || 'demo_user'
    const newNum = parseFloat(editVal)
    if (isNaN(newNum)) return

    const canonicalId = resolveCanonicalBiomarkerId(editName) || editingMeasurement.biomarker_id

    const target = {
      id: editingMeasurement.id,
      biomarker_id: editingMeasurement.biomarker_id,
      panel_id: editingMeasurement.panel_id || selectedPanelModal.id,
      raw_name: editingMeasurement.raw_name
    }

    const updates = {
      raw_name: editName,
      raw_value: newNum,
      normalized_value: newNum,
      normalized_unit: editUnit,
      biomarker_id: canonicalId,
      user_corrected: true
    }

    await updateBiomarkerMeasurement(userId, target, updates)

    // Update local modal state immediately
    if (selectedPanelModal.measurements) {
      setSelectedPanelModal({
        ...selectedPanelModal,
        measurements: selectedPanelModal.measurements.map(m => 
          (m.id === editingMeasurement.id || (m.biomarker_id === editingMeasurement.biomarker_id && m.panel_id === selectedPanelModal.id))
            ? { ...m, ...updates }
            : m
        )
      })
    }

    setEditingMeasurement(null)
    if (onRefreshData) onRefreshData()
  }

  const executeDeleteMeasurement = async (m: BiomarkerMeasurementRecord) => {
    if (!selectedPanelModal) return
    const userId = selectedPanelModal.user_id || 'demo_user'
    
    const target = {
      id: m.id,
      biomarker_id: m.biomarker_id,
      panel_id: m.panel_id || selectedPanelModal.id,
      raw_name: m.raw_name
    }

    await deleteBiomarkerMeasurement(userId, target)

    // Update local modal state immediately
    if (selectedPanelModal.measurements) {
      setSelectedPanelModal({
        ...selectedPanelModal,
        measurements: selectedPanelModal.measurements.filter(item => 
          !(item.id === m.id || (item.biomarker_id === m.biomarker_id && item.panel_id === selectedPanelModal.id) || (item.raw_name === m.raw_name && item.panel_id === selectedPanelModal.id))
        )
      })
    }

    setDeletingKey(null)
    if (onRefreshData) onRefreshData()
  }

  return (
    <div className="space-y-8">
      {/* 1. Lab Draw Timeline Cards (Clickable for full panel breakdown) */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar size={18} className="text-indigo-400" /> Lab Draw Timeline ({panels.length} Uploaded Panels)
          </h3>
          <span className="text-[10px] font-mono text-gray-400">Click any draw to view all extracted biomarkers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedPanelsNewestFirst.map((p, idx) => {
            const panelMeasCount = p.measurements?.length || measurements.filter(m => m.panel_id === p.id).length

            return (
              <div 
                key={p.id} 
                onClick={() => setSelectedPanelModal(p)}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 hover:border-indigo-500/50 cursor-pointer transition-all group shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{p.provider_name || 'Quest Diagnostics'}</h4>
                      {idx === 0 && (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Latest Draw
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">Collected on {p.collection_date}</p>
                  </div>

                  <div className="flex items-center gap-1 text-right">
                    <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {panelMeasCount} Biomarkers
                    </span>
                    <ChevronRight size={16} className="text-gray-500 group-hover:text-white transition-colors" />
                  </div>
                </div>

                {p.bioage_outputs && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 font-mono text-center">
                    {p.bioage_outputs.pheno_age && (
                      <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-[9px] text-gray-400 uppercase">PhenoAge</span>
                        <div className="text-xs font-bold text-emerald-300">{p.bioage_outputs.pheno_age} yrs</div>
                      </div>
                    )}
                    {p.bioage_outputs.kdm_age && (
                      <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-[9px] text-gray-400 uppercase">KDM Age</span>
                        <div className="text-xs font-bold text-indigo-300">{p.bioage_outputs.kdm_age} yrs</div>
                      </div>
                    )}
                    {p.bioage_outputs.hd_score !== undefined && (
                      <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-[9px] text-gray-400 uppercase">HD Score</span>
                        <div className="text-xs font-bold text-cyan-300">{p.bioage_outputs.hd_score}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 2. Automated Longitudinal Trend Analysis (Favorable vs Concerning vs All Trends) */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AI Clinical Trajectory Engine
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              <Sparkles size={20} className="text-amber-400" /> Longitudinal Biomarker Trajectory Analysis
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedCategory === 'all' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              All Trends ({favorableTrends.length + concerningTrends.length + stableOrSingleTrends.length})
            </button>
            <button
              onClick={() => setSelectedCategory('improving')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                selectedCategory === 'improving' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              <CheckCircle2 size={12} /> Favorable ({favorableTrends.length})
            </button>
            <button
              onClick={() => setSelectedCategory('concerning')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                selectedCategory === 'concerning' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              <AlertTriangle size={12} /> Concerning ({concerningTrends.length})
            </button>
            {reviewFlaggedTrends.length > 0 && (
              <button
                onClick={() => setSelectedCategory('review')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  selectedCategory === 'review' ? 'bg-rose-500 text-white' : 'text-rose-400 hover:text-rose-300'
                }`}
              >
                <ShieldAlert size={12} /> Flagged Review ({reviewFlaggedTrends.length})
              </button>
            )}
          </div>
        </div>

        {/* Flagged Biomarkers Needing Manual Review */}
        {(selectedCategory === 'all' || selectedCategory === 'review') && reviewFlaggedTrends.length > 0 && (
          <div className="space-y-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <ShieldAlert size={16} /> Biomarkers Flagged For Manual Verification ({reviewFlaggedTrends.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reviewFlaggedTrends.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => onSelectBiomarker(item.id)}
                  className="p-3.5 rounded-xl bg-black/50 border border-amber-500/40 hover:border-amber-400 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-white">{item.name}</h5>
                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                      ⚠️ Verify Value
                    </span>
                  </div>
                  <div className="text-xs font-mono text-white font-bold">
                    Latest: {item.latestVal} {item.unit}
                  </div>
                  <p className="text-[11px] text-amber-200 leading-relaxed">
                    {item.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Favorable / Improving Trends Section */}
        {(selectedCategory === 'all' || selectedCategory === 'improving') && favorableTrends.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={16} /> Favorable & Optimizing Biomarker Trends ({favorableTrends.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {favorableTrends.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => onSelectBiomarker(item.id)}
                  className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-bold text-white">{item.name}</h5>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <TrendingDown size={12} /> Favorable Trend
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xs text-gray-300 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-[10px]">Baseline:</span>
                        <span>{item.firstVal} {item.unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-[10px]">Current:</span>
                        <strong className="text-emerald-300">{item.latestVal} {item.unit}</strong>
                      </div>
                    </div>

                    <BiomarkerTrendLine points={item.points} isFavorable={true} />
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed border-t border-white/5 pt-2">
                    {item.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Concerning / Optimization Opportunities Section */}
        {(selectedCategory === 'all' || selectedCategory === 'concerning') && concerningTrends.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <AlertTriangle size={16} /> Concerning Trends & Optimization Opportunities ({concerningTrends.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {concerningTrends.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => onSelectBiomarker(item.id)}
                  className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-bold text-white">{item.name}</h5>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <TrendingUp size={12} /> Concerning Trend
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xs text-gray-300 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-[10px]">Baseline:</span>
                        <span>{item.firstVal} {item.unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-[10px]">Current:</span>
                        <strong className="text-amber-300">{item.latestVal} {item.unit}</strong>
                      </div>
                    </div>

                    <BiomarkerTrendLine points={item.points} isFavorable={false} />
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed border-t border-white/5 pt-2">
                    {item.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Baseline & Specialty Biomarkers (Visible when 'all' is selected) */}
        {(selectedCategory === 'all') && stableOrSingleTrends.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <LineChart size={16} /> Tracked Lab Biomarkers ({stableOrSingleTrends.length})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stableOrSingleTrends.map(item => {
                const canonicalId = resolveCanonicalBiomarkerId(item.name) || item.id
                const def = BIOMARKER_REGISTRY[canonicalId] || BIOMARKER_REGISTRY[item.id]

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectBiomarker(canonicalId)}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/40 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-white">{item.name}</h5>
                      <span className="text-[9px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {item.points.length > 1 ? `${item.points.length} draws` : '1 draw'}
                      </span>
                    </div>

                    <div className="text-sm font-mono font-extrabold text-white">
                      {item.latestVal} <span className="text-xs font-normal text-gray-400">{item.unit}</span>
                    </div>

                    {def ? (
                      <BiomarkerAlgorithmBadges definition={def} size="sm" />
                    ) : (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Specialty Lab Marker
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Panel Specific Detail Modal (Showing all extracted biomarkers with RELIABLE REACT DELETE CONTROLS) */}
      {selectedPanelModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <FileText className="text-indigo-400" size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Lab Draw Report Details
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {selectedPanelModal.provider_name || 'Lab Panel'} · {selectedPanelModal.collection_date}
                  </h2>
                </div>
              </div>

              <button onClick={() => setSelectedPanelModal(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Panel Summary Info */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
              <div>
                <span className="text-gray-400 block">Total Biomarkers Extracted</span>
                <strong className="text-base text-white">{modalPanelMeasurements.length} Biomarkers</strong>
              </div>

              {selectedPanelModal.bioage_outputs?.pheno_age && (
                <div>
                  <span className="text-gray-400 block">PhenoAge Output</span>
                  <strong className="text-base text-emerald-300">{selectedPanelModal.bioage_outputs.pheno_age} yrs</strong>
                </div>
              )}

              {selectedPanelModal.bioage_outputs?.kdm_age && (
                <div>
                  <span className="text-gray-400 block">KDM Biological Age</span>
                  <strong className="text-base text-indigo-300">{selectedPanelModal.bioage_outputs.kdm_age} yrs</strong>
                </div>
              )}
            </div>

            {/* Search Filter for Panel Biomarkers */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search biomarkers in this report (e.g. HDL Cholesterol, ApoB, Vitamin D)..."
                value={panelSearchQuery}
                onChange={(e) => setPanelSearchQuery(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            {/* List of all extracted biomarkers in this panel */}
            <div className="space-y-4">
              {filteredModalMeasurements.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">
                  No biomarkers match your search query in this lab report.
                </div>
              ) : (
                filteredModalMeasurements.map(m => {
                  const itemKey = m.id || `${m.biomarker_id}_${m.raw_name}_${m.collection_date}`
                  const canonicalId = m.biomarker_id || resolveCanonicalBiomarkerId(m.raw_name) || 'unknown'
                  const def = BIOMARKER_REGISTRY[canonicalId]
                  const name = def?.name || m.raw_name || canonicalId
                  const stdMin = def?.standard_lab_range.min ?? 0
                  const stdMax = def?.standard_lab_range.max ?? 100
                  const optMin = def?.levl_optimal_zone.min ?? stdMin
                  const optMax = def?.levl_optimal_zone.max ?? stdMax

                  const isBeingEdited = editingMeasurement?.id === m.id || (editingMeasurement?.raw_name === m.raw_name && editingMeasurement?.panel_id === m.panel_id)
                  const isConfirmingDelete = deletingKey === itemKey

                  return (
                    <div 
                      key={itemKey} 
                      className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3 relative group"
                    >
                      {/* Top Action Toolbar (No browser popup dialogs) */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-gray-400 uppercase">Extracted Marker</span>
                          {m.user_corrected && (
                            <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                              User Corrected
                            </span>
                          )}
                        </div>

                        {/* Inline 2-Step Delete & Edit Action Controls */}
                        <div className="flex items-center gap-2">
                          {isConfirmingDelete ? (
                            <div className="flex items-center gap-1.5 animate-in fade-in">
                              <span className="text-[11px] font-bold text-rose-300 mr-1">Confirm Delete?</span>
                              <button
                                onClick={() => executeDeleteMeasurement(m)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-extrabold transition-all shadow-lg text-[11px]"
                              >
                                Delete Now
                              </button>
                              <button
                                onClick={() => setDeletingKey(null)}
                                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 font-bold transition-all text-[11px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEdit(m)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/30 transition-all font-bold flex items-center gap-1 text-[11px]"
                              >
                                <Edit2 size={12} /> Edit Value
                              </button>
                              <button
                                onClick={() => setDeletingKey(itemKey)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 transition-all font-bold flex items-center gap-1 text-[11px]"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Direct Inline Edit Form */}
                      {isBeingEdited ? (
                        <div className="p-4 rounded-xl bg-indigo-500/15 border border-indigo-500/40 space-y-3 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                              Correcting: {m.raw_name}
                            </h4>
                            <button onClick={() => setEditingMeasurement(null)} className="text-gray-400 hover:text-white">
                              <X size={14} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div>
                              <label className="text-[10px] text-gray-400 font-mono block mb-1">Name</label>
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full bg-black border border-white/20 rounded-xl px-3 py-1.5 text-white"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-gray-400 font-mono block mb-1">Numeric Value</label>
                              <input
                                type="number"
                                step="any"
                                value={editVal}
                                onChange={(e) => setEditVal(e.target.value)}
                                className="w-full bg-black border border-white/20 rounded-xl px-3 py-1.5 text-white font-mono font-bold"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-gray-400 font-mono block mb-1">Unit</label>
                              <input
                                type="text"
                                value={editUnit}
                                onChange={(e) => setEditUnit(e.target.value)}
                                className="w-full bg-black border border-white/20 rounded-xl px-3 py-1.5 text-white font-mono"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              onClick={() => setEditingMeasurement(null)}
                              className="px-3 py-1 rounded-lg bg-white/10 text-xs text-gray-300 hover:text-white font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              className="px-4 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg flex items-center gap-1"
                            >
                              <Check size={14} /> Save Value
                            </button>
                          </div>
                        </div>
                      ) : (
                        <BiomarkerRangeVisual
                          value={m.normalized_value ?? m.raw_value}
                          unit={m.normalized_unit || def?.primary_unit || ''}
                          standardMin={stdMin}
                          standardMax={stdMax}
                          optimalMin={optMin}
                          optimalMax={optMax}
                          biomarkerName={name}
                          biomarkerId={canonicalId}
                          studyCitation={def?.study_citation}
                          studyUrl={def?.study_url}
                          showLabels={true}
                        />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Mandatory Educational Tool & Medical Disclaimer */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
          <Info size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
            Educational Tool & Medical Disclaimer
          </h4>
          <p className="text-xs text-gray-300 leading-relaxed">
            LEVL Protocols and its biological age algorithms (including PhenoAge, Klemera-Doubal Method, Homeostatic Dysregulation, and Calico physiological models) are strictly educational analytical tools designed for personal healthspan tracking and longevity research. This platform is not a medical device and is not intended to diagnose, treat, cure, or prevent any medical condition or disease. Always consult with a licensed healthcare provider before making any medical decisions or modifying your medication, supplement, or exercise protocols.
          </p>
        </div>
      </div>
    </div>
  )
}
