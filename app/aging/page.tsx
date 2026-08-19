'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Activity, Sparkles, Plus, Zap, HeartPulse, Brain, Shield, Flame, Wind, Dumbbell, Calendar, Upload, ChevronRight, Check, Target } from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { getOrCreateUserProfile } from '@/lib/data'
import { getBiologicalMeasurements } from '@/lib/data/physiologicalAgeData'
import { calculatePhysiologicalAge } from '@/lib/aging-models/calicoModel'
import { PhysiologicalAgeResult } from '@/lib/aging-models/types'
import { calculateBioAge } from '@/lib/aging-models/bioAgeModel'
import { getUserLabPanels, getLatestBiomarkerMeasurements, getAllBiomarkerMeasurements, calculateSystemAgingStatuses } from '@/lib/data/bloodworkData'
import { UserLabPanel, BiomarkerMeasurementRecord, BioAgeResult, SystemAgingStatus, BiologicalSystem } from '@/lib/aging-models/bioAgeTypes'
import { BIOMARKER_REGISTRY } from '@/lib/aging-models/biomarkerRegistry'
import LabUploadModal from '@/components/modals/LabUploadModal'
import BiomarkerDetailModal from '@/components/modals/BiomarkerDetailModal'
import AgingModelDetailModal, { ModelType } from '@/components/modals/AgingModelDetailModal'
import BiologicalSystemDetailModal from '@/components/modals/BiologicalSystemDetailModal'
import AllBiomarkersModal from '@/components/modals/AllBiomarkersModal'
import LabHistoryView from '@/components/aging/LabHistoryView'
import BiomarkerRangeVisual from '@/components/ui/BiomarkerRangeVisual'
import BiomarkerAlgorithmBadges from '@/components/ui/BiomarkerAlgorithmBadges'
import MinimalistAgingCoach from '@/components/aging/MinimalistAgingCoach'

export default function AgingPage() {
  const [userId, setUserId] = useState<string>('')
  const [profile, setProfile] = useState<any>(null)
  
  // Calico State
  const [calicoMeasurements, setCalicoMeasurements] = useState<any[]>([])
  const [calicoResult, setCalicoResult] = useState<PhysiologicalAgeResult | null>(null)

  // Bloodwork State
  const [labPanels, setLabPanels] = useState<UserLabPanel[]>([])
  const [biomarkers, setBiomarkers] = useState<BiomarkerMeasurementRecord[]>([])
  const [allBiomarkers, setAllBiomarkers] = useState<BiomarkerMeasurementRecord[]>([])
  const [systemStatuses, setSystemStatuses] = useState<SystemAgingStatus[]>([])

  // Modal Controls
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isAllBiomarkersModalOpen, setIsAllBiomarkersModalOpen] = useState(false)
  const [selectedBiomarkerId, setSelectedBiomarkerId] = useState<string | null>(null)
  const [selectedModelType, setSelectedModelType] = useState<ModelType | null>(null)
  const [selectedSystemKey, setSelectedSystemKey] = useState<BiologicalSystem | null>(null)
  const [activeViewTab, setActiveViewTab] = useState<'overview' | 'labs' | 'history'>('overview')

  const loadData = async () => {
    const id = getLocalUserId()
    setUserId(id)
    const p = await getOrCreateUserProfile(id)
    setProfile(p)

    // Load Calico
    const calicoData = await getBiologicalMeasurements(id)
    setCalicoMeasurements(calicoData)
    if (p) {
      const chronoAge = (p as any).chronological_age || p.age || 35
      const res = calculatePhysiologicalAge(chronoAge, (p as any).sex || 'male', calicoData)
      setCalicoResult(res)
    }

    // Load Bloodwork
    const panels = await getUserLabPanels(id)
    setLabPanels(panels)
    const [bRecords, allBRecords] = await Promise.all([
      getLatestBiomarkerMeasurements(id),
      getAllBiomarkerMeasurements(id)
    ])
    setBiomarkers(bRecords)
    setAllBiomarkers(allBRecords)

    const chronoAge = (p as any)?.chronological_age || p?.age || 35
    const sex = (p as any)?.sex || 'male'
    const computedBioAge = bRecords.length > 0 ? calculateBioAge(chronoAge, sex, bRecords) : (panels[0]?.bioage_outputs || null)
    const sysStatuses = calculateSystemAgingStatuses(bRecords, computedBioAge)
    setSystemStatuses(sysStatuses)
  }

  useEffect(() => {
    loadData()
  }, [])

  const chronoAge = (profile as any)?.chronological_age || profile?.age || 35
  const sex = (profile as any)?.sex || 'male'
  const latestBioAge: BioAgeResult | null = biomarkers.length > 0 ? calculateBioAge(chronoAge, sex, biomarkers) : (labPanels[0]?.bioage_outputs || null)

  const getSystemIcon = (iconName: string) => {
    switch (iconName) {
      case 'HeartPulse': return <HeartPulse className="text-red-400" size={20} />
      case 'Brain': return <Brain className="text-indigo-400" size={20} />
      case 'Zap': return <Zap className="text-amber-400" size={20} />
      case 'Shield': return <Shield className="text-emerald-400" size={20} />
      case 'Flame': return <Flame className="text-orange-400" size={20} />
      case 'Wind': return <Wind className="text-blue-400" size={20} />
      case 'Dumbbell': return <Dumbbell className="text-purple-400" size={20} />
      default: return <Activity className="text-levl-accent" size={20} />
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-8 max-w-7xl mx-auto space-y-8 pb-24">
      {/* Insights Section Switcher */}
      <div className="flex p-1 bg-black/50 rounded-2xl border border-white/10 max-w-md shadow-lg">
        <Link
          href="/tracking"
          className="flex-1 py-2 text-center text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-white/5 flex items-center justify-center gap-1.5 transition-all"
        >
          <Target size={14} /> Outcome ROI &amp; Habits
        </Link>
        <Link
          href="/aging"
          className="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-levl-accent/20 text-levl-accent border border-levl-accent/30 shadow-sm flex items-center justify-center gap-1.5 transition-all"
        >
          <Activity size={14} /> Biological Age &amp; Models
        </Link>
      </div>

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-levl-accent/20 text-indigo-300 border border-levl-accent/30">
              Biological Systems Engine
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-1 tracking-tight">YOUR AGING</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
            Multi-system biological age metrics, bloodwork AI parsing, and LEVL protocol longevity optimizations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAllBiomarkersModalOpen(true)}
            className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-xs shadow-lg transition-all flex items-center gap-2"
          >
            <Activity size={16} className="text-indigo-400" /> View All Biomarkers ({allBiomarkers.length})
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg transition-all flex items-center gap-2"
          >
            <Upload size={16} /> Upload Bloodwork Labs
          </button>
        </div>
      </div>

      {/* Established Aging Models Summary Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Established Biological Aging Models</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Calico Physiological Age */}
          <div 
            onClick={() => setSelectedModelType('calico')}
            className="glass-card p-5 rounded-3xl border border-white/10 hover:border-indigo-500/50 cursor-pointer transition-all space-y-2 relative overflow-hidden group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider group-hover:text-white transition-colors">Physiological Age</span>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Calico eLife 2025
              </span>
            </div>
            <div className="text-4xl font-black font-mono text-white">
              {calicoResult?.predicted_age ? calicoResult.predicted_age : '--'}
            </div>
            <p className="text-[11px] text-gray-400">
              {calicoResult?.age_gap !== null && calicoResult?.age_gap !== undefined
                ? `${Math.abs(calicoResult.age_gap)} years ${calicoResult.age_gap <= 0 ? 'younger' : 'older'}`
                : 'Physical trait PLS model'}
            </p>
          </div>

          {/* 2. KDM Biological Age */}
          <div 
            onClick={() => setSelectedModelType('kdm')}
            className="glass-card p-5 rounded-3xl border border-white/10 hover:border-emerald-500/50 cursor-pointer transition-all space-y-2 relative overflow-hidden group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider group-hover:text-white transition-colors">KDM Biological Age</span>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Klemera-Doubal
              </span>
            </div>
            <div className="text-4xl font-black font-mono text-emerald-300">
              {latestBioAge?.kdm_age ? latestBioAge.kdm_age : '--'}
            </div>
            <p className="text-[11px] text-gray-400">
              {latestBioAge?.kdm_age_gap !== null && latestBioAge?.kdm_age_gap !== undefined
                ? `${Math.abs(latestBioAge.kdm_age_gap)} years ${latestBioAge.kdm_age_gap <= 0 ? 'younger' : 'older'}`
                : 'Upload bloodwork to unlock'}
            </p>
          </div>

          {/* 3. Phenotypic Age */}
          <div 
            onClick={() => setSelectedModelType('phenoage')}
            className="glass-card p-5 rounded-3xl border border-white/10 hover:border-amber-500/50 cursor-pointer transition-all space-y-2 relative overflow-hidden group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider group-hover:text-white transition-colors">Phenotypic Age</span>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Levine PhenoAge
              </span>
            </div>
            <div className="text-4xl font-black font-mono text-amber-300">
              {latestBioAge?.pheno_age ? latestBioAge.pheno_age : '--'}
            </div>
            <p className="text-[11px] text-gray-400">
              {latestBioAge?.pheno_age_gap !== null && latestBioAge?.pheno_age_gap !== undefined
                ? `${Math.abs(latestBioAge.pheno_age_gap)} years ${latestBioAge.pheno_age_gap <= 0 ? 'younger' : 'older'}`
                : 'Mortality hazard 9-biomarker model'}
            </p>
          </div>

          {/* 4. Homeostatic Dysregulation */}
          <div 
            onClick={() => setSelectedModelType('hd')}
            className="glass-card p-5 rounded-3xl border border-white/10 hover:border-purple-500/50 cursor-pointer transition-all space-y-2 relative overflow-hidden group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider group-hover:text-white transition-colors">Dysregulation (HD)</span>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Mahalanobis HD
              </span>
            </div>
            <div className="text-4xl font-black font-mono text-purple-300">
              {latestBioAge?.hd_score ? latestBioAge.hd_score : '--'}
            </div>
            <p className="text-[11px] text-gray-400">Deviation from healthy reference centroid</p>
          </div>
        </div>
      </div>

      {/* Minimalist AI Longevity Coach for Biological Aging */}
      <MinimalistAgingCoach
        profile={profile}
        panels={labPanels}
        biomarkers={biomarkers}
        calicoMeasurements={calicoMeasurements}
        systemStatuses={systemStatuses}
        latestBioAge={latestBioAge}
      />

      {/* Top 3-5 Optimization Opportunities */}
      {biomarkers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="text-amber-400" size={20} /> Top Longevity Optimization Opportunities
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {biomarkers
              .filter(m => {
                const def = BIOMARKER_REGISTRY[m.biomarker_id]
                if (!def) return false
                return m.normalized_value < def.levl_optimal_zone.min || m.normalized_value > def.levl_optimal_zone.max
              })
              .slice(0, 3)
              .map(m => {
                const def = BIOMARKER_REGISTRY[m.biomarker_id]
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedBiomarkerId(m.biomarker_id)}
                    className="glass-card p-5 rounded-2xl border border-amber-500/30 hover:border-amber-500/60 transition-all cursor-pointer space-y-3 group shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {def?.system} System
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {m.normalized_value} {m.normalized_unit}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">{def?.name}</h3>
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{def?.longevity_importance}</p>
                    </div>

                    <div className="pt-2 text-xs font-bold text-amber-400 flex items-center justify-between border-t border-white/5">
                      <span>View Optimization Protocol</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-white/10 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveViewTab('overview')}
          className={`pb-3 border-b-2 transition-colors ${activeViewTab === 'overview' ? 'border-levl-accent text-white' : 'border-transparent text-gray-400'}`}
        >
          YOUR SYSTEMS
        </button>
        <button
          onClick={() => setActiveViewTab('labs')}
          className={`pb-3 border-b-2 transition-colors ${activeViewTab === 'labs' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-gray-400'}`}
        >
          ALL BIOMARKERS ({biomarkers.length})
        </button>
        <button
          onClick={() => setActiveViewTab('history')}
          className={`pb-3 border-b-2 transition-colors ${activeViewTab === 'history' ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-gray-400'}`}
        >
          LAB PANELS & TIMELINE ({labPanels.length})
        </button>
      </div>

      {/* Tab Content 1: YOUR SYSTEMS Grid */}
      {activeViewTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemStatuses.map(sys => (
              <div
                key={sys.system}
                onClick={() => setSelectedSystemKey(sys.system)}
                className="glass-card p-5 rounded-3xl border border-white/10 hover:border-indigo-500/50 cursor-pointer transition-all space-y-4 shadow-lg flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-2xl bg-black/40 border border-white/10">
                      {getSystemIcon(sys.icon_name)}
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">
                      {sys.unlocked_biomarker_count} / {sys.total_system_biomarkers} data points
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{sys.display_name}</h3>
                    
                    {sys.status_type === 'valid_age' && (
                      <div className="mt-2">
                        <div className="text-2xl font-black font-mono text-emerald-300">{sys.calculated_age} yrs</div>
                        <span className="text-[10px] text-gray-400">{Math.abs(sys.age_gap || 0)} years younger</span>
                      </div>
                    )}

                    {sys.status_type === 'useful_data' && (
                      <div className="mt-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          sys.health_status_label === 'Optimal Longevity Zone'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        }`}>
                          {sys.health_status_label}
                        </span>
                      </div>
                    )}

                    {sys.status_type === 'insufficient_data' && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-400 italic">{sys.unlock_prompt}</p>
                      </div>
                    )}
                  </div>
                </div>

                {sys.top_biomarkers.length > 0 && (
                  <div className="space-y-1.5 pt-3 border-t border-white/5">
                    {sys.top_biomarkers.slice(0, 2).map(b => (
                      <div 
                        key={b.id} 
                        onClick={() => setSelectedBiomarkerId(b.biomarker_id)}
                        className="flex items-center justify-between text-xs text-gray-300 hover:text-white cursor-pointer"
                      >
                        <span className="truncate">{b.raw_name}</span>
                        <strong className="font-mono text-white">{b.normalized_value} {b.normalized_unit}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 2: ALL BIOMARKERS List */}
      {activeViewTab === 'labs' && (
        <div className="space-y-4">
          {biomarkers.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center text-xs text-gray-400">
              No blood biomarkers uploaded yet. Click <strong>Upload Bloodwork Labs</strong> to add your labs.
            </div>
          ) : (
            biomarkers.map(m => {
              const def = BIOMARKER_REGISTRY[m.biomarker_id]
              if (!def) return null

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedBiomarkerId(m.biomarker_id)}
                  className="glass-card p-5 rounded-3xl border border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{def.name}</h4>
                      {def.bioage_model_usage.phenoage && (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          BioAge
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Tested {m.collection_date}</span>
                  </div>

                  <BiomarkerRangeVisual
                    value={m.normalized_value}
                    unit={m.normalized_unit}
                    standardMin={def.standard_lab_range.min}
                    standardMax={def.standard_lab_range.max}
                    optimalMin={def.levl_optimal_zone.min}
                    optimalMax={def.levl_optimal_zone.max}
                    studyCitation={def.study_citation}
                    studyUrl={def.study_url}
                    showLabels={false}
                  />
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Tab Content 3: LAB PANELS TIMELINE */}
      {activeViewTab === 'history' && (
        <LabHistoryView
          panels={labPanels}
          measurements={allBiomarkers}
          onSelectBiomarker={(id) => setSelectedBiomarkerId(id)}
          onRefreshData={loadData}
        />
      )}

      {/* Modals */}
      <LabUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        userId={userId}
        userProfile={{ chronological_age: (profile as any)?.chronological_age || profile?.age || 35, sex: profile?.sex }}
        onSaved={loadData}
      />

      {selectedBiomarkerId && (
        <BiomarkerDetailModal
          isOpen={!!selectedBiomarkerId}
          onClose={() => setSelectedBiomarkerId(null)}
          biomarkerId={selectedBiomarkerId}
          userId={userId}
          measurements={biomarkers}
          onProtocolUpdated={loadData}
        />
      )}

      {selectedModelType && (
        <AgingModelDetailModal
          isOpen={!!selectedModelType}
          onClose={() => setSelectedModelType(null)}
          modelType={selectedModelType}
          calicoResult={calicoResult}
          bioAgeResult={latestBioAge}
          biomarkers={biomarkers}
          calicoMeasurements={calicoMeasurements}
          chronologicalAge={(profile as any)?.chronological_age || profile?.age || 35}
        />
      )}

      {selectedSystemKey && (
        <BiologicalSystemDetailModal
          isOpen={!!selectedSystemKey}
          onClose={() => setSelectedSystemKey(null)}
          systemKey={selectedSystemKey}
          systemStatus={systemStatuses.find(s => s.system === selectedSystemKey)}
          userId={userId}
          biomarkers={biomarkers}
          calicoMeasurements={calicoMeasurements}
          onProtocolUpdated={loadData}
        />
      )}

      <AllBiomarkersModal
        isOpen={isAllBiomarkersModalOpen}
        onClose={() => setIsAllBiomarkersModalOpen(false)}
        biomarkers={allBiomarkers.length > 0 ? allBiomarkers : biomarkers}
      />
    </main>
  )
}
