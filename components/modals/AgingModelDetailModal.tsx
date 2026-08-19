'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { X, BookOpen, Activity, Heart, ArrowRight, ExternalLink, ChevronDown, ChevronUp, TestTube } from 'lucide-react'
import { BIOMARKER_REGISTRY } from '@/lib/aging-models/biomarkerRegistry'
import { BiomarkerMeasurementRecord, BioAgeResult } from '@/lib/aging-models/bioAgeTypes'
import { PhysiologicalAgeResult } from '@/lib/aging-models/types'

export type ModelType = 'calico' | 'kdm' | 'phenoage' | 'hd'

interface AgingModelDetailModalProps {
  isOpen: boolean
  onClose: () => void
  modelType: ModelType
  calicoResult?: PhysiologicalAgeResult | null
  bioAgeResult?: BioAgeResult | null
  biomarkers: BiomarkerMeasurementRecord[]
  calicoMeasurements: any[]
  chronologicalAge?: number
}

export default function AgingModelDetailModal({
  isOpen,
  onClose,
  modelType,
  calicoResult,
  bioAgeResult,
  biomarkers,
  calicoMeasurements,
  chronologicalAge = 35
}: AgingModelDetailModalProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

  if (!isOpen) return null

  const bMap = new Map<string, BiomarkerMeasurementRecord>()
  biomarkers.forEach(b => bMap.set(b.biomarker_id, b))

  const cMap = new Map<string, number>()
  calicoMeasurements.forEach(m => cMap.set(m.measurement_type_id, m.normalized_value ?? m.value))

  const modelDetails = {
    calico: {
      title: 'LEVL Physiological Age',
      subtitle: 'Physical Performance & Functional Capacity',
      calculatedAge: calicoResult?.predicted_age ?? null,
      ageGap: calicoResult?.age_gap ?? null,
      humanOverview: 'Measures how your body performs physical tasks—such as leg strength, balance, reaction speed, flexibility, and lung power—without needing a blood draw. A younger physiological age means your nervous system, muscles, and lungs are operating with youthful vigor and resilience.',
      technicalMethodology: 'Built using Partial Least Squares (PLS) regression trained on over 500,000 UK Biobank participants. It evaluates accessible, non-invasive physical functional tests to accurately predict functional physiological reserve.',
      citation: 'Libert S, Chekholko A, Kenyon C. "A non-invasive biological age model derived from physical and physiological measurements." eLife, 2025.',
      contributors: [
        { id: 'chair_stand_30s', name: '30-Sec Chair Stand Count', category: 'Leg Strength & Power', significance: 'Primary Driver of Mobility', optimal: '≥ 25 reps' },
        { id: 'single_leg_stand', name: 'Single-Leg Balance Duration', category: 'Balance & Motor Stability', significance: 'Neuromotor Integrity', optimal: '≥ 45 sec' },
        { id: 'reaction_time_visual', name: 'Visual Reaction Time', category: 'Brain Speed', significance: 'Central Nervous Speed', optimal: '< 250 ms' },
        { id: 'sitting_rising_test', name: 'Sitting-Rising Test (SRT)', category: 'Flexibility & Musculoskeletal', significance: 'Full-Body Coordination', optimal: '10 / 10 pts' },
        { id: 'grip_strength', name: 'Handgrip Strength', category: 'Muscular Strength', significance: 'Overall Muscle Quality', optimal: '≥ 45 kg (M) / ≥ 30 kg (F)' },
        { id: 'fev1', name: 'Forced Expiratory Volume (FEV1)', category: 'Lung Reserve', significance: 'Pulmonary Vitality', optimal: '≥ 3.8 L' },
        { id: 'blood_pressure_systolic', name: 'Systolic Blood Pressure', category: 'Vascular Stiffness', significance: 'Arterial Elasticity', optimal: '< 115 mmHg' }
      ]
    },

    kdm: {
      title: 'KDM Biological Age',
      subtitle: 'Multi-Organ System Biological Age',
      calculatedAge: bioAgeResult?.kdm_age ?? null,
      ageGap: bioAgeResult?.kdm_age_gap ?? null,
      humanOverview: 'Evaluates your internal biological age across major organs (liver, kidneys, immune system, and metabolism) using routine blood tests. It compares your blood marker levels to healthy population standards to show whether your internal biology is aging faster or slower than your birth age.',
      technicalMethodology: 'Calculates a minimum-variance linear projection of biological age by analyzing biomarker Z-scores against population age parameters derived from NHANES reference data across multiple organ systems.',
      citation: 'Klemera P, Doubal S. Mech Ageing Dev, 2006; Kwon D et al. BioAge R Package, Bioinformatics, 2019.',
      contributors: [
        { id: 'albumin', name: 'Serum Albumin', category: 'Liver & Protein Synthesis', significance: 'Protective Hepatic Marker', optimal: '4.5 - 5.2 g/dL' },
        { id: 'creatinine', name: 'Serum Creatinine', category: 'Kidney Filtering Capacity', significance: 'Renal Clearance', optimal: '0.7 - 1.0 mg/dL' },
        { id: 'glucose', name: 'Fasting Serum Glucose', category: 'Metabolic & Blood Sugar', significance: 'Glycemic Regulation', optimal: '75 - 88 mg/dL' },
        { id: 'crp', name: 'C-Reactive Protein (hs-CRP)', category: 'Systemic Inflammation', significance: 'Primary Inflammation Driver', optimal: '< 0.5 mg/L' },
        { id: 'lymph_pct', name: 'Lymphocyte Percentage', category: 'Immune Balance', significance: 'Adaptive Immune Capacity', optimal: '25 - 35 %' },
        { id: 'mcv', name: 'Mean Corpuscular Volume (MCV)', category: 'Red Blood Cell Size', significance: 'Cellular Maturation', optimal: '85 - 92 fL' },
        { id: 'rdw', name: 'Red Cell Distribution Width (RDW)', category: 'Red Blood Cell Size Variation', significance: 'Vascular Wear Indicator', optimal: '< 12.5 %' },
        { id: 'alp', name: 'Alkaline Phosphatase (ALP)', category: 'Liver & Bone Health', significance: 'Biliary Clearance', optimal: '45 - 70 U/L' },
        { id: 'wbc', name: 'White Blood Cell Count (WBC)', category: 'Immune Activity', significance: 'Baseline Immune Signaling', optimal: '4.0 - 6.0 k/uL' }
      ]
    },

    phenoage: {
      title: 'Phenotypic Age (PhenoAge)',
      subtitle: '10-Year Healthspan & Mortality Hazard Score',
      calculatedAge: bioAgeResult?.pheno_age ?? null,
      ageGap: bioAgeResult?.pheno_age_gap ?? null,
      humanOverview: 'Calculates your overall phenotypic age based on 9 key blood chemistry markers. This score reflects your body’s true physiological healthspan and 10-year risk profile. Lower PhenoAge scores mean your blood chemistry strongly supports longevity and disease prevention.',
      technicalMethodology: 'Converts 9 clinical blood chemistry biomarkers plus chronological age into a Gompertz mortality hazard predictor, mapping your risk profile back to baseline population health curves.',
      citation: 'Levine ME et al. "An epigenetic biomarker of aging for lifespan and healthspan." Aging Cell, 2018.',
      contributors: [
        { id: 'crp', name: 'hs-CRP (Inflammation)', category: 'Vascular & Systemic Health', significance: 'Strong Inflammatory Factor', optimal: '< 0.5 mg/L' },
        { id: 'rdw', name: 'RDW (Red Cell Uniformity)', category: 'Cardiovascular Aging', significance: 'Strong Vascular Wear Factor', optimal: '< 12.5 %' },
        { id: 'glucose', name: 'Fasting Serum Glucose', category: 'Blood Sugar Control', significance: 'Glycation & Metabolic Stress', optimal: '75 - 88 mg/dL' },
        { id: 'creatinine', name: 'Serum Creatinine', category: 'Renal & Muscle Filter', significance: 'Kidney Filtering Health', optimal: '0.7 - 1.0 mg/dL' },
        { id: 'albumin', name: 'Serum Albumin', category: 'Liver & Protein Health', significance: 'Strong Protective Factor', optimal: '4.5 - 5.2 g/dL' },
        { id: 'lymph_pct', name: 'Lymphocyte Percentage', category: 'Immune Defense', significance: 'Protective Immune Factor', optimal: '25 - 35 %' },
        { id: 'wbc', name: 'White Blood Cell Count', category: 'Immune Stress', significance: 'Systemic Activation Factor', optimal: '4.0 - 6.0 k/uL' },
        { id: 'mcv', name: 'Mean Corpuscular Volume', category: 'Red Cell Volume', significance: 'Cell Health Factor', optimal: '85 - 92 fL' },
        { id: 'alp', name: 'Alkaline Phosphatase', category: 'Liver & Bone Turnover', significance: 'Biliary Flow Factor', optimal: '45 - 70 U/L' }
      ]
    },

    hd: {
      title: 'Homeostatic Dysregulation (HD)',
      subtitle: 'Biochemical Balance & System Resilience',
      calculatedAge: null,
      ageGap: null,
      humanOverview: 'Measures how balanced and stable your internal biochemistry is compared to a young, healthy baseline. A lower score means your organ systems are operating in tight, youthful equilibrium, while a higher score indicates your body is working harder under stress.',
      technicalMethodology: 'Measures total statistical deviation (Mahalanobis distance) of a person’s blood profile from a healthy young baseline reference population (ages 20–30 in NHANES data).',
      citation: 'Cohen AA et al. "Detection of physiological dysregulation in humans." Frontiers in Genetics, 2013.',
      contributors: [
        { id: 'crp', name: 'C-Reactive Protein (hs-CRP)', category: 'Inflammatory Equilibrium', significance: 'Core Variance Marker', optimal: '< 0.5 mg/L' },
        { id: 'glucose', name: 'Fasting Glucose', category: 'Glycemic Equilibrium', significance: 'Core Variance Marker', optimal: '75 - 88 mg/dL' },
        { id: 'apob', name: 'Apolipoprotein B (ApoB)', category: 'Cardiovascular Lipid Particle Balance', significance: 'Primary Lipid Marker', optimal: '< 70 mg/dL' },
        { id: 'triglycerides', name: 'Triglycerides', category: 'Energy Lipid Transport', significance: 'Metabolic Balance', optimal: '< 85 mg/dL' },
        { id: 'albumin', name: 'Serum Albumin', category: 'Liver Protein Equilibrium', significance: 'Hepatic Stability', optimal: '4.5 - 5.2 g/dL' },
        { id: 'creatinine', name: 'Serum Creatinine', category: 'Kidney Filter Equilibrium', significance: 'Renal Stability', optimal: '0.7 - 1.0 mg/dL' }
      ]
    }
  }

  const current = modelDetails[modelType]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Biological Model Breakdown
            </span>
            <h2 className="text-2xl font-black text-white mt-1">{current.title}</h2>
            <p className="text-xs text-gray-400 font-medium">{current.subtitle}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Calculated Result Overview Header */}
        {modelType !== 'hd' && (
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Calculated Biological Age</span>
              <div className="text-3xl font-black font-mono text-white mt-1">
                {current.calculatedAge !== null ? `${current.calculatedAge} yrs` : 'Data Pending'}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {modelType === 'calico' && (
                <Link
                  href="/physiological-age"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
                >
                  <Activity size={15} /> Measure Trait Tests Now <ArrowRight size={14} />
                </Link>
              )}

              {current.ageGap !== null && (
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  current.ageGap <= 0 
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}>
                  {Math.abs(current.ageGap)} years {current.ageGap <= 0 ? 'Younger' : 'Older'} than Chronological ({chronologicalAge} yrs)
                </span>
              )}
            </div>
          </div>
        )}

        {modelType === 'hd' && (
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">System Dysregulation Score</span>
              <div className="text-3xl font-black font-mono text-purple-300 mt-1">
                {bioAgeResult?.hd_score !== null ? bioAgeResult?.hd_score : '--'}
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold border bg-purple-500/10 text-purple-300 border-purple-500/30">
              Low Score = High Biochemical Equilibrium
            </span>
          </div>
        )}

        {/* 1. Primary Human Overview Section */}
        <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
          <h3 className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <Heart size={16} className="text-indigo-400" /> What This Means For You
          </h3>
          <p className="text-sm text-white font-medium leading-relaxed">{current.humanOverview}</p>
        </div>

        {/* 2. Secondary Technical Section (Collapsible) */}
        <div className="rounded-2xl bg-black/40 border border-white/5 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full p-4 flex items-center justify-between text-xs font-bold text-gray-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <BookOpen size={15} className="text-gray-400" /> Scientific Methodology & Literature Citation
            </span>
            {showTechnicalDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showTechnicalDetails && (
            <div className="p-4 pt-0 space-y-2 border-t border-white/5 text-xs text-gray-400 leading-relaxed animate-in fade-in">
              <p>{current.technicalMethodology}</p>
              <p className="text-[10px] text-gray-500 italic pt-1">Primary Citation: {current.citation}</p>
            </div>
          )}
        </div>

        {/* 3. How To Get Tested / Lab Panel Sources (Placed below Scientific Methodology) */}
        {modelType !== 'calico' && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
            <h3 className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <TestTube size={15} className="text-emerald-400" /> How To Get Tested (Required Lab Panels)
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              PhenoAge and KDM are calculated directly from routine blood chemistry tests: a <strong>Complete Blood Count (CBC w/ Differential)</strong>, <strong>Comprehensive Metabolic Panel (CMP)</strong>, and <strong>high-sensitivity CRP (hs-CRP)</strong>. You can get these through your primary care physician or order them online from reputable providers:
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-bold">
              <a
                href="https://www.questdiagnostics.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-all"
              >
                Quest Diagnostics <ExternalLink size={12} />
              </a>
              <a
                href="https://www.labcorp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-all"
              >
                Labcorp <ExternalLink size={12} />
              </a>
              <a
                href="https://www.functionhealth.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-all"
              >
                Function Health <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}

        {/* Key Contributors Breakdown Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={16} className="text-emerald-400" /> Key Contributors & Measured Values
            </h3>
            {modelType === 'calico' && (
              <Link
                href="/physiological-age"
                onClick={onClose}
                className="text-xs font-extrabold text-indigo-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                Go to Trait Test Hub <ArrowRight size={12} />
              </Link>
            )}
          </div>

          <div className="space-y-2">
            {current.contributors.map(c => {
              let measuredVal: string = 'Not Measured'
              let isOptimal = false

              if (modelType === 'calico') {
                if (cMap.has(c.id)) {
                  const val = cMap.get(c.id)!
                  measuredVal = `${val}`
                  isOptimal = true
                }
              } else {
                if (bMap.has(c.id)) {
                  const rec = bMap.get(c.id)!
                  const def = BIOMARKER_REGISTRY[c.id]
                  measuredVal = `${rec.normalized_value} ${rec.normalized_unit}`
                  if (def) {
                    isOptimal = rec.normalized_value >= def.levl_optimal_zone.min && rec.normalized_value <= def.levl_optimal_zone.max
                  }
                }
              }

              return (
                <div key={c.id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white">{c.name}</h4>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/10 text-gray-300">
                        {c.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium">
                      Role: <span className="text-gray-300">{c.significance}</span> · Target: {c.optimal}
                    </p>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <div>
                      <div className="font-mono font-bold text-white text-xs">{measuredVal}</div>
                      {measuredVal !== 'Not Measured' && (
                        <span className={`text-[9px] font-bold ${isOptimal ? 'text-emerald-300' : 'text-amber-300'}`}>
                          {isOptimal ? '✓ Optimal Zone' : '⚠ Optimization Needed'}
                        </span>
                      )}
                    </div>

                    {/* Direct App Link for Physical Trait Tests */}
                    {modelType === 'calico' && measuredVal === 'Not Measured' && (
                      <Link
                        href={`/physiological-age?test=${c.id}`}
                        onClick={onClose}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold flex items-center gap-1 transition-all"
                      >
                        Measure <ArrowRight size={10} />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
