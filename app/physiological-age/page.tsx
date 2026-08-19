'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Activity, 
  Zap, 
  ShieldCheck, 
  ChevronRight, 
  Plus, 
  Info, 
  Calendar, 
  Award, 
  ArrowUpRight, 
  Sparkles, 
  FileText,
  Lock,
  RefreshCw,
  Heart,
  Wind,
  Dumbbell,
  Footprints,
  Brain,
  HelpCircle
} from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { getOrCreateUserProfile } from '@/lib/data'
import { getBiologicalMeasurements, saveBiologicalMeasurement } from '@/lib/data/physiologicalAgeData'
import { calculatePhysiologicalAge } from '@/lib/aging-models/calicoModel'
import { PhysiologicalAgeResult, BiologicalMeasurement } from '@/lib/aging-models/types'
import AddMeasurementModal from '@/components/modals/AddMeasurementModal'
import SilhouetteVisual from '@/components/ui/SilhouetteVisual'

export default function PhysiologicalAgePage() {
  const [userId, setUserId] = useState<string>('')
  const [profile, setProfile] = useState<any>(null)
  const [measurements, setMeasurements] = useState<BiologicalMeasurement[]>([])
  const [ageResult, setAgeResult] = useState<PhysiologicalAgeResult | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [targetMeasurementId, setTargetMeasurementId] = useState<string | undefined>(undefined)
  
  // Details drawer toggle
  const [showProvenanceDrawer, setShowProvenanceDrawer] = useState<boolean>(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const localId = getLocalUserId()
      setUserId(localId)

      const [userProf, bioMeas] = await Promise.all([
        getOrCreateUserProfile(localId),
        getBiologicalMeasurements(localId)
      ])

      setProfile(userProf)
      setMeasurements(bioMeas)

      const chronoAge = userProf?.age || 34
      const sex = (userProf?.biological_sex?.toLowerCase() === 'female' ? 'female' : 'male') as 'male' | 'female'

      const result = calculatePhysiologicalAge(chronoAge, sex, bioMeas)
      setAgeResult(result)
    } catch (err) {
      console.error('Error loading physiological age data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    const handleUpdate = () => {
      loadData()
    }
    window.addEventListener('levl_measurements_updated', handleUpdate)
    return () => {
      window.removeEventListener('levl_measurements_updated', handleUpdate)
    }
  }, [])

  const openAddModal = (measurementId?: string) => {
    setTargetMeasurementId(measurementId)
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-levl-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Computing Calico Physiological Age Model...</p>
      </div>
    )
  }

  const chronoAge = profile?.age || 34
  const predictedAge = ageResult?.predicted_age
  const ageGap = ageResult?.age_gap
  const coveragePct = ageResult ? Math.round(ageResult.measurement_coverage_pct * 100) : 0

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 max-w-5xl mx-auto space-y-8 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">
            <Sparkles size={14} /> LEVL Pace of Aging Engine
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Physiological Age</h1>
          <p className="text-xs text-gray-400 max-w-xl mt-1">
            Multisystem biological age derived from Calico Life Sciences' UK Biobank Partial Least Squares (PLS) aging model.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/guide#bloodwork"
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-purple-300 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
            title="View Bloodwork & BioAge Guide"
          >
            <HelpCircle size={14} className="text-purple-400" />
            <span>Guide</span>
          </Link>
          <button
            onClick={() => openAddModal()}
            className="px-5 py-2.5 rounded-xl bg-levl-accent hover:bg-levl-accent/90 text-white font-bold text-xs shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Record Measurement
          </button>
        </div>
      </div>

      {/* Hero Result Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden space-y-6 shadow-2xl">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Main Physiological Age Number */}
          <div className="space-y-1 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">Calculated Physiological Age</span>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                ageResult?.model_classification === 'calico-full'
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                  : ageResult?.model_classification === 'calico-informed-subset'
                  ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                  : 'bg-amber-500/20 border-amber-500/30 text-amber-300'
              }`}>
                {ageResult?.model_classification === 'calico-full' ? 'Calico Full Model' : ageResult?.model_classification === 'calico-informed-subset' ? 'Calico-Informed Subset' : 'Domain Profile Tier'}
              </span>
            </div>

            <div className="flex items-baseline gap-4">
              <span className="text-5xl sm:text-6xl font-black tracking-tight text-white">
                {predictedAge !== null ? `${predictedAge}` : '—'}
                <span className="text-2xl sm:text-3xl font-semibold text-gray-400 ml-1.5">years</span>
              </span>

              {ageGap !== null && ageGap !== undefined && (
                <div className={`px-3 py-1.5 rounded-xl border text-sm font-extrabold flex items-center gap-1 ${
                  ageGap <= 0
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-500/20 border-red-500/40 text-red-300'
                }`}>
                  <span>ΔAge: {ageGap > 0 ? `+${ageGap}` : ageGap} yrs</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-400 pt-2">
              <span>Chronological age: <strong className="text-white">{chronoAge}</strong></span>
              <span>Model error: <strong className="text-gray-200">±{ageResult?.validated_rmse_years || 4.2} years</strong> (RMSE)</span>
            </div>
          </div>

          {/* Model Coverage Indicator */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-300">Estimate Quality:</span>
              <span className="font-extrabold text-indigo-300">{ageResult?.estimate_quality}</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>Measurement Coverage</span>
                <span className="font-mono font-bold text-white">{coveragePct}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.max(5, coveragePct)}%` }}
                />
              </div>
            </div>

            <p className="text-[10px] text-gray-400 leading-tight">
              Coverage reflects multi-system trait availability. Empirical model error is displayed separately.
            </p>
          </div>
        </div>

        {/* Safety & Science Banner Disclaimer */}
        <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-2.5 text-xs text-indigo-200">
          <Info size={16} className="mt-0.5 shrink-0 text-indigo-400" />
          <div>
            <strong>Scientific & Safety Context:</strong> Physiological Age compares your measured traits against population aging patterns in the Calico Life Sciences UK Biobank cohort. This tracks functional trajectory and is not a diagnostic tool or lifespan prediction.
          </div>
        </div>
      </div>

      {/* Prominently Featured: Instant Zero-Equipment Physical Tests */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="text-emerald-400" size={20} /> Prominent Zero-Equipment Tests
            </h2>
            <p className="text-xs text-gray-400">High-value, accessible physical tests you can conduct right now without special equipment.</p>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            Instant Test Deck
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'reaction_time', name: 'Visual Reaction Time', desc: 'Neural processing speed & axon conduction', time: '1 min', tag: 'Native Test' },
            { id: 'single_leg_balance', name: 'Single-Leg Stance', desc: 'Proprioception & neuromotor fall risk', time: '2 min', tag: 'Stopwatch' },
            { id: 'chair_stand_30s', name: '30s Chair Stand', desc: 'Lower-body muscle power & extension', time: '1 min', tag: 'Chair & Timer' },
            { id: 'sitting_rising_test', name: 'Sitting-Rising Test', desc: 'Integrated musculoskeletal flexibility', time: '2 min', tag: 'Clear Floor' }
          ].map(test => (
            <div 
              key={test.id}
              onClick={() => openAddModal(test.id)}
              className="glass-card p-5 rounded-2xl border border-white/10 hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-3 group shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{test.time}</span>
                <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                  {test.tag}
                </span>
              </div>

              {/* Animated Motion Silhouette Visual Preview */}
              <div className="w-full h-28 rounded-xl overflow-hidden border border-white/5 group-hover:border-emerald-500/30 transition-colors">
                <SilhouetteVisual measurementId={test.id} variant="compact" className="w-full h-full" />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">{test.name}</h3>
                <p className="text-[11px] text-gray-400 leading-snug">{test.desc}</p>
              </div>

              <div className="pt-2 text-xs text-emerald-400 font-bold flex items-center justify-between border-t border-white/5">
                <span>Start Test</span>
                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* "Improve Your Estimate" Dynamic Recommendations System */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="text-amber-400" size={20} /> Improve Your Estimate
            </h2>
            <p className="text-xs text-gray-400">Ranked by Expected Information Gain ($EIG$) across unmeasured biological organ systems.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ageResult?.recommendations.slice(0, 4).map((rec) => (
            <div 
              key={rec.measurement_id}
              className="glass-card p-5 rounded-2xl border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    {rec.information_impact_tier}
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">
                    ~{rec.estimated_minutes} min · {rec.required_equipment}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">{rec.name}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{rec.reasoning}</p>
              </div>

              <button
                onClick={() => openAddModal(rec.measurement_id)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/40 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5"
              >
                {rec.action_type === 'test_now' ? '⚡ Test Now (Native Applet)' : '✏️ Enter Value'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Organ System Domain Visualization */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="text-levl-accent" size={20} /> Biological Domain Breakdown
            </h2>
            <p className="text-xs text-gray-400">Functional age equivalents and percentiles across distinct physiological systems.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ageResult?.domain_scores.map((ds) => (
            <div key={ds.domain} className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{ds.domain}</span>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  ds.status === 'optimal' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' :
                  ds.status === 'good' ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' :
                  ds.status === 'fair' ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' :
                  ds.status === 'needs_attention' ? 'bg-red-500/20 border-red-500/30 text-red-300' :
                  'bg-white/5 border-white/10 text-gray-500'
                }`}>
                  {ds.status}
                </span>
              </div>

              {ds.measurement_count > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-white">{ds.score_0_100}<span className="text-xs text-gray-400 font-normal">/100</span></span>
                    {ds.age_equivalent_years && (
                      <span className="text-xs font-semibold text-gray-300">Equiv: {ds.age_equivalent_years} yrs</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    Latest: <strong className="text-gray-200">{ds.latest_value_summary}</strong> ({ds.primary_measurement_name})
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic py-2">
                  No measurements recorded yet in this domain.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Model Provenance & Reproducibility Footer */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
            <FileText size={16} className="text-indigo-400" /> Model Provenance & Reproducibility Audit Log
          </div>
          <button 
            onClick={() => setShowProvenanceDrawer(!showProvenanceDrawer)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            {showProvenanceDrawer ? 'Hide Details' : 'Inspect Audit Log'}
          </button>
        </div>

        {showProvenanceDrawer && (
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3 text-xs font-mono text-gray-300 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>Algorithm: <strong>{ageResult?.provenance.model_name}</strong></div>
              <div>Model Version: <strong>{ageResult?.provenance.model_version}</strong></div>
              <div>Paper DOI: <a href={`https://doi.org/${ageResult?.provenance.doi}`} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">{ageResult?.provenance.doi}</a></div>
              <div>Timestamp: <strong>{ageResult?.provenance.calculated_at}</strong></div>
              <div>Inputs Count: <strong>{ageResult?.provenance.measurements_used.length} traits</strong></div>
              <div>Validated RMSE: <strong>±{ageResult?.provenance.validated_rmse} yrs</strong></div>
            </div>
            <div className="pt-2 border-t border-white/10 text-[11px] text-gray-400 font-sans">
              Primary Scientific Reference: Libert S, Chekholko A, Kenyon C. "A mathematical model that predicts human biological age from physiological traits identifies environmental and genetic factors that influence aging." <em>eLife</em>, 2025.
            </div>
          </div>
        )}
      </div>

      {/* Add/Record Measurement Modal */}
      <AddMeasurementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        initialMeasurementId={targetMeasurementId}
        onSaved={loadData}
      />
    </div>
  )
}
