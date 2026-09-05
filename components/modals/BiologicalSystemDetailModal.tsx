'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { X, Activity, HeartPulse, Brain, Zap, Shield, Flame, Wind, Dumbbell, BookOpen, Sparkles } from 'lucide-react'
import { BIOMARKER_REGISTRY } from '@/lib/aging-models/biomarkerRegistry'
import { BiologicalSystem, BiomarkerMeasurementRecord, SystemAgingStatus } from '@/lib/aging-models/bioAgeTypes'
import { Modality, UserProfile } from '@/lib/types'
import BiomarkerRangeVisual from '@/components/ui/BiomarkerRangeVisual'
import ExploreCard from '@/components/cards/ExploreCard'
import { getModalities, getBenchItems, addToBench, createDailyTask, getDailyProtocolTasks, getOrCreateUserProfile } from '@/lib/data'

interface BiologicalSystemDetailModalProps {
  isOpen: boolean
  onClose: () => void
  systemKey: BiologicalSystem | null
  systemStatus?: SystemAgingStatus | null
  userId: string
  biomarkers: BiomarkerMeasurementRecord[]
  calicoMeasurements: any[]
  onProtocolUpdated?: () => void
}

export default function BiologicalSystemDetailModal({
  isOpen,
  onClose,
  systemKey,
  systemStatus,
  userId,
  biomarkers,
  calicoMeasurements,
  onProtocolUpdated
}: BiologicalSystemDetailModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [benchItems, setBenchItems] = useState<any[]>([])
  const [todayTasks, setTodayTasks] = useState<any[]>([])
  const [allModalities, setAllModalities] = useState<Modality[]>([])

  const loadModalityState = async () => {
    if (!userId) return
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const [p, bench, today, mods] = await Promise.all([
      getOrCreateUserProfile(userId),
      getBenchItems(userId),
      getDailyProtocolTasks(userId, todayStr),
      getModalities()
    ])
    setProfile(p)
    setBenchItems(bench)
    setTodayTasks(today)
    setAllModalities(mods)
  }

  useEffect(() => {
    if (isOpen && userId) {
      loadModalityState()
    }
  }, [isOpen, userId])

  if (!isOpen || !systemKey) return null

  const systemMetadata: Record<BiologicalSystem, {
    title: string
    icon: React.ReactNode
    calculationExplanation: string
    categoryKeywords: string[]
  }> = {
    cardiovascular: {
      title: 'Heart & Cardiovascular System',
      icon: <HeartPulse className="text-red-400" size={24} />,
      calculationExplanation: 'Calculated from atherogenic ApoB lipid particles, Triglyceride-to-HDL ratios, resting Systolic/Diastolic blood pressure, and systemic hs-CRP inflammation. It measures vascular wall elasticity and arterial plaque vulnerability.',
      categoryKeywords: ['cardiovascular', 'aerobic', 'sauna', 'heart', 'vascular', 'lipid']
    },

    brain: {
      title: 'Brain & Neuromotor System',
      icon: <Brain className="text-indigo-400" size={24} />,
      calculationExplanation: 'Calculated from visual choice reaction time (ms), single-leg balance duration (sec), and central nervous system processing speed. It evaluates motor unit recruitment speed, vestibular stability, and cognitive processing reserve.',
      categoryKeywords: ['brain', 'cognitive', 'sleep', 'neuromotor', 'focus', 'mind']
    },

    metabolic: {
      title: 'Metabolic Health System',
      icon: <Zap className="text-amber-400" size={24} />,
      calculationExplanation: 'Calculated from fasting serum glucose, HbA1c, triglycerides, and lipid transport efficiency. It measures insulin sensitivity, mitochondrial substrate switching, and cellular energy production.',
      categoryKeywords: ['metabolic', 'nutrition', 'fasting', 'glucose', 'biochemistry']
    },

    immune: {
      title: 'Immune & Inflammatory System',
      icon: <Shield className="text-emerald-400" size={24} />,
      calculationExplanation: 'Calculated from high-sensitivity C-Reactive Protein (hs-CRP), total White Blood Cell count (WBC), Lymphocyte percentage, and Red Cell Distribution Width (RDW). It evaluates systemic inflammation and immunosenescence.',
      categoryKeywords: ['immune', 'recovery', 'cold', 'inflammation', 'light']
    },

    kidney: {
      title: 'Kidney & Renal Health System',
      icon: <Activity className="text-teal-400" size={24} />,
      calculationExplanation: 'Calculated from Serum Creatinine, Estimated Glomerular Filtration Rate (eGFR), Blood Urea Nitrogen (BUN), and urine filtration markers. It measures microvascular renal filtration efficiency and muscular metabolite clearance.',
      categoryKeywords: ['hydration', 'kidney', 'renal', 'biochemistry']
    },

    liver: {
      title: 'Liver & Protein Synthesis System',
      icon: <Flame className="text-orange-400" size={24} />,
      calculationExplanation: 'Calculated from Serum Albumin, Alkaline Phosphatase (ALP), ALT, AST, and total protein markers. It measures hepatic parenchymal cell health, protein synthesis, and biliary detoxification clearance.',
      categoryKeywords: ['liver', 'nutrition', 'detox', 'biochemistry']
    },

    lung: {
      title: 'Lung & Pulmonary System',
      icon: <Wind className="text-blue-400" size={24} />,
      calculationExplanation: 'Calculated from Forced Expiratory Volume (FEV1), Forced Vital Capacity (FVC), and respiratory rate dynamics. It evaluates pulmonary compliance, chest wall mobility, and alveolar gas exchange capacity.',
      categoryKeywords: ['breathwork', 'respiratory', 'lung', 'cardiovascular']
    },

    musculoskeletal: {
      title: 'Musculoskeletal & Functional Mobility System',
      icon: <Dumbbell className="text-purple-400" size={24} />,
      calculationExplanation: 'Calculated from 30-second Chair Stand reps, Handgrip Strength (kg), Sitting-Rising Test (SRT 10-pt score), and Bone/Muscle biomarkers (ALP, Creatinine). It measures myofibrillar strength and joint mobility.',
      categoryKeywords: ['strength', 'mobility', 'musculoskeletal', 'movement', 'physical']
    }
  }

  const meta = systemMetadata[systemKey]
  const isOptimal = systemStatus?.health_status_label === 'Optimal Longevity Zone' || systemStatus?.status_type === 'valid_age'

  // Filter biomarkers belonging to this system
  const systemBiomarkers = biomarkers.filter(b => {
    const def = BIOMARKER_REGISTRY[b.biomarker_id]
    return def && (def.system === systemKey || def.secondary_systems?.includes(systemKey))
  })

  // Filter actual database modalities matching keywords
  const matchedModalities = allModalities.filter(m => {
    const cat = (m.category || '').toLowerCase()
    const name = (m.name || '').toLowerCase()
    const desc = (m.brief_description || (m as any).description || '').toLowerCase()
    return meta.categoryKeywords.some(kw => cat.includes(kw) || name.includes(kw) || desc.includes(kw))
  }).slice(0, 4)

  // Sets for fast active status checking
  const activeBenchModalityIds = new Set(benchItems.map(b => b.modality_id).filter(Boolean))
  const activeTodayModalityIds = new Set(todayTasks.map(t => t.modality_id).filter(Boolean))

  const handleAddToBench = async (modalityId: string) => {
    try {
      await addToBench(userId, modalityId)
      await loadModalityState()
      if (onProtocolUpdated) onProtocolUpdated()
    } catch (err) {
      console.error('Error adding to bench:', err)
    }
  }

  const handleAddToToday = async (modalityId: string) => {
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      // Correct parameter signature: createDailyTask(localUserId, date, modalityId)
      await createDailyTask(userId, todayStr, modalityId)
      await loadModalityState()
      if (onProtocolUpdated) onProtocolUpdated()
    } catch (err) {
      console.error('Error adding to today:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">{meta.icon}</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Biological System Detail
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{meta.title}</h2>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* System Status Banner */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Biological System Status</span>
            <div className="text-2xl font-extrabold text-white mt-0.5">
              {isOptimal ? 'Optimal Longevity Equilibrium' : 'Optimization Opportunity Identified'}
            </div>
          </div>

          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
            isOptimal 
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
          }`}>
            {isOptimal ? '✓ Optimal Zone' : '⚠ Opportunity to Optimize'}
          </span>
        </div>

        {/* How This System Is Calculated Section */}
        <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
          <h3 className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={16} className="text-indigo-400" /> How This System Health Is Calculated
          </h3>
          <p className="text-xs text-gray-200 leading-relaxed">{meta.calculationExplanation}</p>
        </div>

        {/* System Measured Data Points Visual Spectrum Bars */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={16} className="text-emerald-400" /> Measured System Biomarkers ({systemBiomarkers.length})
          </h3>

          {systemBiomarkers.length === 0 ? (
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center text-xs text-gray-400">
              No lab biomarkers currently uploaded for this organ system. Upload bloodwork to populate spectrum bars.
            </div>
          ) : (
            <div className="space-y-3">
              {systemBiomarkers.map(b => {
                const def = BIOMARKER_REGISTRY[b.biomarker_id]
                if (!def) return null
                return (
                  <BiomarkerRangeVisual
                    key={b.id}
                    value={b.normalized_value}
                    unit={b.normalized_unit}
                    standardMin={def.standard_lab_range.min}
                    standardMax={def.standard_lab_range.max}
                    optimalMin={def.levl_optimal_zone.min}
                    optimalMax={def.levl_optimal_zone.max}
                    biomarkerName={def.name}
                    studyCitation={def.study_citation}
                    studyUrl={def.study_url}
                    showLabels={true}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Recommended Actual Database LEVL Modalities (Using Standard LEVL ExploreCard) */}
        <div className="space-y-4 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={16} className="text-amber-400" /> Recommended LEVL Modalities ({matchedModalities.length})
            </h3>
            <span className="text-[10px] text-gray-400 font-medium">Standard LEVL Modality Cards</span>
          </div>

          <div className="space-y-4">
            {matchedModalities.map(mod => {
              const inToday = activeTodayModalityIds.has(mod.id)
              const onBench = activeBenchModalityIds.has(mod.id)
              const activeStatus = inToday ? 'today' : onBench ? 'bench' : null

              return (
                <ExploreCard
                  key={mod.id}
                  modality={mod}
                  userProfile={profile}
                  activeStatus={activeStatus}
                  onAddToBench={handleAddToBench}
                  onAddToToday={handleAddToToday}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
