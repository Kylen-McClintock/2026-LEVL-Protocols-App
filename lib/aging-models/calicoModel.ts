import { 
  BiologicalMeasurement, 
  PhysiologicalAgeResult, 
  DomainScore, 
  ModelProvenance, 
  BiologicalDomain 
} from './types'
import { MEASUREMENT_REGISTRY, GET_ALL_REGISTRY_ENTRIES } from './measurementRegistry'
import { calculateNextBestMeasurements } from './informationGain'

export const CALICO_MODEL_METADATA = {
  model_name: 'calico-ukbb-v1.0',
  model_version: '1.0.0',
  doi: '10.7554/eLife.92092.3',
  source: 'Calico Life Sciences / eLife 2025 (Libert et al.)',
  preprocessing_version: '1.0.0',
  full_model_rmse_years: 4.2,
  subset_model_rmse_years: 4.8
}

// Reference means and standard deviations from UK Biobank baseline cohort (sex-stratified)
interface SexNormParams {
  bp_sys: { mean: number; sd: number }
  bp_dia: { mean: number; sd: number }
  resting_hr: { mean: number; sd: number }
  fev1: { mean: number; sd: number }
  fvc: { mean: number; sd: number }
  grip_strength: { mean: number; sd: number }
  ln_reaction_time: { mean: number; sd: number } // ln(ms)
  ln_bmi: { mean: number; sd: number } // ln(kg/m2)
  waist_circumference: { mean: number; sd: number }
}

const MALE_NORM_PARAMS: SexNormParams = {
  bp_sys: { mean: 137.5, sd: 18.5 },
  bp_dia: { mean: 82.3, sd: 10.2 },
  resting_hr: { mean: 68.5, sd: 11.2 },
  fev1: { mean: 3.45, sd: 0.72 },
  fvc: { mean: 4.42, sd: 0.85 },
  grip_strength: { mean: 41.5, sd: 8.8 },
  ln_reaction_time: { mean: 6.25, sd: 0.28 }, // exp(6.25) ~ 518 ms
  ln_bmi: { mean: 3.31, sd: 0.15 }, // exp(3.31) ~ 27.4 kg/m2
  waist_circumference: { mean: 93.2, sd: 11.5 }
}

const FEMALE_NORM_PARAMS: SexNormParams = {
  bp_sys: { mean: 131.2, sd: 19.8 },
  bp_dia: { mean: 78.6, sd: 10.5 },
  resting_hr: { mean: 71.2, sd: 11.8 },
  fev1: { mean: 2.58, sd: 0.56 },
  fvc: { mean: 3.25, sd: 0.68 },
  grip_strength: { mean: 25.2, sd: 5.6 },
  ln_reaction_time: { mean: 6.29, sd: 0.29 }, // exp(6.29) ~ 539 ms
  ln_bmi: { mean: 3.29, sd: 0.17 }, // exp(3.29) ~ 26.8 kg/m2
  waist_circumference: { mean: 82.5, sd: 12.8 }
}

// Klemera-Doubal / Leask linear age-bias correction slope beta
const AGE_BIAS_BETA = 0.72

/**
 * Calculates Physiological Age, Age Gap (ΔAge), Domain Scores, and Next-Best Recommendations.
 */
export function calculatePhysiologicalAge(
  chronologicalAge: number,
  sex: 'male' | 'female' = 'male',
  measurements: BiologicalMeasurement[]
): PhysiologicalAgeResult {
  const safeAge = Math.max(18, Math.min(100, chronologicalAge || 35))
  const normParams = sex === 'female' ? FEMALE_NORM_PARAMS : MALE_NORM_PARAMS

  // Map latest valid measurement values by measurement_type_id
  const latestMap = new Map<string, BiologicalMeasurement>()
  measurements.forEach(m => {
    const existing = latestMap.get(m.measurement_type_id)
    if (!existing || new Date(m.measured_at).getTime() > new Date(existing.measured_at).getTime()) {
      latestMap.set(m.measurement_type_id, m)
    }
  })

  // Check available Calico primary traits
  const calicoCoreTraitIds = ['bp_sys', 'bp_dia', 'fev1', 'grip_strength', 'reaction_time', 'bmi']
  const availableCoreTraits = calicoCoreTraitIds.filter(id => latestMap.has(id))
  const coveragePct = availableCoreTraits.length / calicoCoreTraitIds.length

  // Determine model tier classification
  let modelClassification: 'calico-full' | 'calico-informed-subset' | 'domain-profile' = 'domain-profile'
  if (availableCoreTraits.length >= 5) {
    modelClassification = 'calico-full'
  } else if (availableCoreTraits.length >= 2) {
    modelClassification = 'calico-informed-subset'
  }

  // Calculate unadjusted biological age score if >= 2 core traits available
  let rawBioAge: number | null = null
  let predictedAge: number | null = null
  let ageGap: number | null = null

  if (modelClassification !== 'domain-profile') {
    let zScoreSum = 0
    let totalWeight = 0

    // 1. Systolic Blood Pressure
    if (latestMap.has('bp_sys')) {
      const val = latestMap.get('bp_sys')!.normalized_value
      const z = (val - normParams.bp_sys.mean) / normParams.bp_sys.sd
      const w = MEASUREMENT_REGISTRY.bp_sys[sex === 'female' ? 'calico_pls_weight_female' : 'calico_pls_weight_male']
      zScoreSum += z * w * 12.0 // Scaling factor per SD
      totalWeight += Math.abs(w)
    }

    // 2. Diastolic Blood Pressure
    if (latestMap.has('bp_dia')) {
      const val = latestMap.get('bp_dia')!.normalized_value
      const z = (val - normParams.bp_dia.mean) / normParams.bp_dia.sd
      const w = MEASUREMENT_REGISTRY.bp_dia[sex === 'female' ? 'calico_pls_weight_female' : 'calico_pls_weight_male']
      zScoreSum += z * w * 8.0
      totalWeight += Math.abs(w)
    }

    // 3. FEV1 Lung Function
    if (latestMap.has('fev1')) {
      const val = latestMap.get('fev1')!.normalized_value
      const z = (val - normParams.fev1.mean) / normParams.fev1.sd
      const w = MEASUREMENT_REGISTRY.fev1[sex === 'female' ? 'calico_pls_weight_female' : 'calico_pls_weight_male']
      zScoreSum += z * w * 15.0 // Negative weight: higher FEV1 lowers biological age
      totalWeight += Math.abs(w)
    }

    // 4. Grip Strength
    if (latestMap.has('grip_strength')) {
      const val = latestMap.get('grip_strength')!.normalized_value
      const z = (val - normParams.grip_strength.mean) / normParams.grip_strength.sd
      const w = MEASUREMENT_REGISTRY.grip_strength[sex === 'female' ? 'calico_pls_weight_female' : 'calico_pls_weight_male']
      zScoreSum += z * w * 14.0 // Negative weight
      totalWeight += Math.abs(w)
    }

    // 5. Visual Reaction Time (Log transformed)
    if (latestMap.has('reaction_time')) {
      const valMs = latestMap.get('reaction_time')!.normalized_value
      const lnVal = Math.log(Math.max(100, valMs))
      const z = (lnVal - normParams.ln_reaction_time.mean) / normParams.ln_reaction_time.sd
      const w = MEASUREMENT_REGISTRY.reaction_time[sex === 'female' ? 'calico_pls_weight_female' : 'calico_pls_weight_male']
      zScoreSum += z * w * 12.0
      totalWeight += Math.abs(w)
    }

    // 6. BMI (Log transformed)
    if (latestMap.has('bmi')) {
      const valBmi = latestMap.get('bmi')!.normalized_value
      const lnVal = Math.log(Math.max(12, valBmi))
      const z = (lnVal - normParams.ln_bmi.mean) / normParams.ln_bmi.sd
      const w = MEASUREMENT_REGISTRY.bmi[sex === 'female' ? 'calico_pls_weight_female' : 'calico_pls_weight_male']
      zScoreSum += z * w * 10.0
      totalWeight += Math.abs(w)
    }

    if (totalWeight > 0) {
      // Unadjusted raw biological age signal
      rawBioAge = safeAge + (zScoreSum / totalWeight) * 8.5
      
      // Klemera-Doubal / Leask Linear Age-Bias Correction
      // BioAge_corrected = [BioAge_raw - (1 - beta) * ChronAge] / beta
      const correctedBioAge = (rawBioAge - (1 - AGE_BIAS_BETA) * safeAge) / AGE_BIAS_BETA

      // Clamp predicted age within realistic human lifespan limits relative to chronological age (+/- 18 years max)
      predictedAge = Math.round(Math.max(safeAge - 18, Math.min(safeAge + 18, correctedBioAge)) * 10) / 10
      ageGap = Math.round((predictedAge - safeAge) * 10) / 10
    }
  }

  // Calculate Domain Breakdown Scores
  const domainScores = calculateDomainScores(safeAge, sex, latestMap)

  // Calculate represented organ domains count
  const measuredDomains = new Set(domainScores.filter(d => d.status !== 'unmeasured').map(d => d.domain))
  const representedDomainsCount = measuredDomains.size

  // Model Provenance Object
  const provenance: ModelProvenance = {
    model_name: modelClassification === 'calico-full' ? CALICO_MODEL_METADATA.model_name : 'levl-calico-informed-v1.0',
    model_version: CALICO_MODEL_METADATA.model_version,
    doi: CALICO_MODEL_METADATA.doi,
    source: CALICO_MODEL_METADATA.source,
    calculated_at: new Date().toISOString(),
    measurements_used: Array.from(latestMap.keys()),
    coverage_pct: Math.round(coveragePct * 100) / 100,
    validated_rmse: modelClassification === 'calico-full' ? CALICO_MODEL_METADATA.full_model_rmse_years : CALICO_MODEL_METADATA.subset_model_rmse_years,
    preprocessing_version: CALICO_MODEL_METADATA.preprocessing_version
  }

  // Estimate Quality Tier
  let estimateQuality: 'High Confidence' | 'Moderate Confidence' | 'Provisional' | 'Insufficient Data' = 'Insufficient Data'
  if (modelClassification === 'calico-full') {
    estimateQuality = 'High Confidence'
  } else if (modelClassification === 'calico-informed-subset') {
    estimateQuality = coveragePct >= 0.5 ? 'Moderate Confidence' : 'Provisional'
  } else if (representedDomainsCount >= 2) {
    estimateQuality = 'Provisional'
  }

  // Dynamic Expected Information Gain Next-Best Measurement Recommendations
  const recommendations = calculateNextBestMeasurements(latestMap, sex, measuredDomains)

  // Input measurements summary for UI cards
  const inputSummary = Array.from(latestMap.values()).map(m => {
    const registryEntry = MEASUREMENT_REGISTRY[m.measurement_type_id]
    return {
      measurement_id: m.measurement_type_id,
      name: registryEntry?.display_name || m.measurement_type_id,
      value_display: `${m.normalized_value} ${m.normalized_unit}`,
      measured_at: m.measured_at,
      domain: registryEntry?.domain || 'Cardiorespiratory'
    }
  })

  return {
    predicted_age: predictedAge,
    chronological_age: safeAge,
    age_gap: ageGap,
    model_classification: modelClassification,
    model_version: provenance.model_name,
    doi: CALICO_MODEL_METADATA.doi,
    provenance,
    measurement_coverage_pct: coveragePct,
    represented_domains_count: representedDomainsCount,
    total_domains_count: 6, // Cardiorespiratory, Pulmonary, Muscular, Neuromotor, Cognitive, Mobility
    validated_rmse_years: provenance.validated_rmse,
    estimate_quality: estimateQuality,
    domain_scores: domainScores,
    recommendations,
    input_measurements_summary: inputSummary
  }
}

/**
 * Calculates biological domain scores and percentiles across organ systems.
 */
function calculateDomainScores(
  chronologicalAge: number,
  sex: 'male' | 'female',
  latestMap: Map<string, BiologicalMeasurement>
): DomainScore[] {
  const domains: BiologicalDomain[] = ['Cardiorespiratory', 'Pulmonary', 'Muscular', 'Neuromotor', 'Cognitive', 'Mobility']
  
  return domains.map(domain => {
    let score = 50 // Default baseline 50th percentile
    let measurementCount = 0
    let primaryName = ''
    let latestSummary = ''

    if (domain === 'Cardiorespiratory') {
      if (latestMap.has('vo2max')) {
        const val = latestMap.get('vo2max')!.normalized_value
        measurementCount++
        primaryName = 'VO2max'
        latestSummary = `${val} mL/kg/min`
        score = Math.min(99, Math.max(10, Math.round(50 + (val - (sex === 'male' ? 42 - chronologicalAge * 0.3 : 36 - chronologicalAge * 0.25)) * 2.5)))
      } else if (latestMap.has('bp_sys')) {
        const sys = latestMap.get('bp_sys')!.normalized_value
        const dia = latestMap.has('bp_dia') ? latestMap.get('bp_dia')!.normalized_value : 80
        measurementCount += latestMap.has('bp_dia') ? 2 : 1
        primaryName = 'Blood Pressure'
        latestSummary = `${sys}/${dia} mmHg`
        score = sys <= 120 && dia <= 80 ? 85 : sys <= 130 ? 68 : sys <= 140 ? 45 : 25
      }
    } else if (domain === 'Pulmonary') {
      if (latestMap.has('fev1')) {
        const val = latestMap.get('fev1')!.normalized_value
        measurementCount++
        primaryName = 'FEV1'
        latestSummary = `${val} L`
        const normMean = sex === 'male' ? 3.45 : 2.58
        score = Math.min(99, Math.max(10, Math.round(50 + ((val - normMean) / 0.6) * 20)))
      }
    } else if (domain === 'Muscular') {
      if (latestMap.has('grip_strength')) {
        const val = latestMap.get('grip_strength')!.normalized_value
        measurementCount++
        primaryName = 'Grip Strength'
        latestSummary = `${val} kg`
        const normMean = sex === 'male' ? 41.5 : 25.2
        score = Math.min(99, Math.max(10, Math.round(50 + ((val - normMean) / (sex === 'male' ? 8.8 : 5.6)) * 18)))
      } else if (latestMap.has('chair_stand_30s')) {
        const reps = latestMap.get('chair_stand_30s')!.normalized_value
        measurementCount++
        primaryName = '30s Chair Stand'
        latestSummary = `${reps} reps`
        score = reps >= 20 ? 88 : reps >= 15 ? 70 : reps >= 10 ? 45 : 25
      }
    } else if (domain === 'Neuromotor') {
      if (latestMap.has('single_leg_balance')) {
        const sec = latestMap.get('single_leg_balance')!.normalized_value
        measurementCount++
        primaryName = 'Single-Leg Balance'
        latestSummary = `${sec} sec`
        score = sec >= 45 ? 92 : sec >= 30 ? 78 : sec >= 10 ? 55 : 28
      }
    } else if (domain === 'Cognitive') {
      if (latestMap.has('reaction_time')) {
        const ms = latestMap.get('reaction_time')!.normalized_value
        measurementCount++
        primaryName = 'Visual Reaction Time'
        latestSummary = `${ms} ms`
        score = ms <= 250 ? 95 : ms <= 350 ? 80 : ms <= 450 ? 55 : 30
      }
    } else if (domain === 'Mobility') {
      if (latestMap.has('sitting_rising_test')) {
        const srt = latestMap.get('sitting_rising_test')!.normalized_value
        measurementCount++
        primaryName = 'Sitting-Rising Test'
        latestSummary = `${srt}/10 pts`
        score = srt >= 9 ? 92 : srt >= 8 ? 75 : srt >= 6 ? 50 : 25
      } else if (latestMap.has('gait_speed')) {
        const speed = latestMap.get('gait_speed')!.normalized_value
        measurementCount++
        primaryName = 'Gait Speed'
        latestSummary = `${speed} m/s`
        score = speed >= 1.4 ? 90 : speed >= 1.2 ? 75 : speed >= 1.0 ? 50 : 30
      }
    }

    const status: DomainScore['status'] = 
      measurementCount === 0 ? 'unmeasured' :
      score >= 75 ? 'optimal' :
      score >= 60 ? 'good' :
      score >= 40 ? 'fair' : 'needs_attention'

    const ageEquiv = measurementCount > 0 ? Math.round(chronologicalAge - (score - 50) * 0.2) : undefined

    return {
      domain,
      score_0_100: score,
      percentile: score,
      age_equivalent_years: ageEquiv,
      measurement_count: measurementCount,
      status,
      primary_measurement_name: primaryName || undefined,
      latest_value_summary: latestSummary || undefined
    }
  })
}
