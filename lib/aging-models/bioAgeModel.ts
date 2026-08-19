import { BiologicalMeasurement } from './types'
import { BiomarkerMeasurementRecord, BioAgeResult } from './bioAgeTypes'
import { BIOMARKER_REGISTRY } from './biomarkerRegistry'

export const BIOAGE_METADATA = {
  model_name: 'BioAge-R-MultiModel',
  bioage_commit: 'dayoonkwon/BioAge@master',
  doi: '10.1093/bioinformatics/btz001',
  source: 'BioAge R Package (Kwon, Belsky, Levine, Klemera-Doubal, Cohen)'
}

// NHANES III Baseline Reference Coefficients for PhenoAge & KDM Models
interface BiomarkerCoeffs {
  mean: number
  sd: number
  kdm_q: number
  kdm_k: number
  kdm_s2: number
}

// NHANES Reference Table for Males/Females
const NHANES_PARAMS: Record<string, BiomarkerCoeffs> = {
  albumin: { mean: 4.52, sd: 0.32, kdm_q: 4.85, kdm_k: -0.0075, kdm_s2: 0.082 },
  creatinine: { mean: 88.4, sd: 18.5, kdm_q: 72.1, kdm_k: 0.38, kdm_s2: 240.0 }, // umol/L
  glucose: { mean: 5.25, sd: 0.95, kdm_q: 4.65, kdm_k: 0.018, kdm_s2: 0.85 }, // mmol/L
  crp: { mean: 1.45, sd: 1.85, kdm_q: 0.35, kdm_k: 0.024, kdm_s2: 2.1 }, // mg/L
  lymph_pct: { mean: 31.2, sd: 7.5, kdm_q: 36.5, kdm_k: -0.12, kdm_s2: 48.0 },
  mcv: { mean: 89.5, sd: 4.8, kdm_q: 86.2, kdm_k: 0.075, kdm_s2: 21.0 },
  rdw: { mean: 12.8, sd: 1.1, kdm_q: 12.1, kdm_k: 0.016, kdm_s2: 1.05 },
  alp: { mean: 72.5, sd: 22.0, kdm_q: 58.0, kdm_k: 0.34, kdm_s2: 420.0 },
  wbc: { mean: 6.85, sd: 1.8, kdm_q: 6.2, kdm_k: 0.015, kdm_s2: 3.1 }
}

const KDM_S_AGE_2 = 144.0 // Age variance parameter in reference population

/**
 * Executes KDM Biological Age, PhenoAge, and Homeostatic Dysregulation (HD).
 */
export function calculateBioAge(
  chronologicalAge: number,
  sex: 'male' | 'female' = 'male',
  measurements: BiomarkerMeasurementRecord[]
): BioAgeResult {
  const safeAge = Math.max(18, Math.min(100, chronologicalAge || 35))

  // Map latest normalized values
  const map = new Map<string, number>()
  measurements.forEach(m => {
    map.set(m.biomarker_id, m.normalized_value)
  })

  const phenoRequired = ['albumin', 'creatinine', 'glucose', 'crp', 'lymph_pct', 'mcv', 'rdw', 'alp', 'wbc']
  const availablePheno = phenoRequired.filter(id => map.has(id))
  const missingPheno = phenoRequired.filter(id => !map.has(id))
  const coveragePct = availablePheno.length / phenoRequired.length

  let phenoAge: number | null = null
  let phenoAgeGap: number | null = null

  // --- 1. PhenoAge Calculation (Levine et al. 2018) ---
  if (availablePheno.length === phenoRequired.length) {
    const alb = map.get('albumin')! // g/dL
    const creatUmol = map.get('creatinine')! * 88.4 // mg/dL -> umol/L
    const glucMmol = map.get('glucose')! * 0.0555 // mg/dL -> mmol/L
    const crpMgL = Math.max(0.01, map.get('crp')!) // mg/L
    const lymph = map.get('lymph_pct')! // %
    const mcv = map.get('mcv')! // fL
    const rdw = map.get('rdw')! // %
    const alp = map.get('alp')! // U/L
    const wbc = map.get('wbc')! // 10^9/L

    const lnCRP = Math.log(crpMgL)
    const lnCreat = Math.log(creatUmol)
    const lnGluc = Math.log(glucMmol)
    const lnAlp = Math.log(alp)
    const lnWbc = Math.log(wbc)

    // Gompertz Mortality Hazard linear predictor (xb - Levine et al. 2018)
    const xb = -0.0336 * (alb * 10) +
      0.0095 * creatUmol +
      0.1953 * glucMmol +
      0.0954 * lnCRP -
      0.0120 * lymph +
      0.0268 * mcv +
      0.3306 * rdw +
      0.00188 * alp +
      0.0554 * wbc

    // Baseline population mean xb for average reference cohort (~6.29)
    const refXb = 6.29
    phenoAge = safeAge + (xb - refXb) / 0.0336
    phenoAge = Math.round(Math.max(18, phenoAge) * 10) / 10
    phenoAgeGap = Math.round((phenoAge - safeAge) * 10) / 10
  }

  // --- 2. KDM Biological Age (Klemera-Doubal Method) ---
  let kdmAge: number | null = null
  let kdmAgeGap: number | null = null

  if (availablePheno.length >= 4) {
    let numSum = 0
    let denSum = 0

    availablePheno.forEach(id => {
      const val = map.get(id)!
      const params = NHANES_PARAMS[id]
      if (params) {
        // Standardize unit to NHANES baseline
        let stdVal = val
        if (id === 'creatinine') stdVal = val * 88.4
        if (id === 'glucose') stdVal = val * 0.0555

        const yi = (stdVal - params.kdm_q) / params.kdm_k
        const wi = (params.kdm_k * params.kdm_k) / params.kdm_s2
        numSum += yi * wi
        denSum += wi
      }
    })

    numSum += safeAge / KDM_S_AGE_2
    denSum += 1 / KDM_S_AGE_2

    if (denSum > 0) {
      kdmAge = Math.round((numSum / denSum) * 10) / 10
      kdmAgeGap = Math.round((kdmAge - safeAge) * 10) / 10
    }
  }

  // --- 3. Homeostatic Dysregulation (HD - Mahalanobis Distance) ---
  let hdScore: number | null = null
  if (availablePheno.length >= 3) {
    let sumZ2 = 0
    availablePheno.forEach(id => {
      const val = map.get(id)!
      const params = NHANES_PARAMS[id]
      if (params) {
        let stdVal = val
        if (id === 'creatinine') stdVal = val * 88.4
        if (id === 'glucose') stdVal = val * 0.0555

        const z = (stdVal - params.mean) / params.sd
        sumZ2 += z * z
      }
    })
    hdScore = Math.round(Math.sqrt(sumZ2 / availablePheno.length) * 100) / 100
  }

  // Determine Drivers
  const supporting: string[] = []
  const opportunities: string[] = []

  measurements.forEach(m => {
    const def = BIOMARKER_REGISTRY[m.biomarker_id]
    if (def) {
      if (m.normalized_value >= def.levl_optimal_zone.min && m.normalized_value <= def.levl_optimal_zone.max) {
        supporting.push(def.name)
      } else {
        opportunities.push(def.name)
      }
    }
  })

  return {
    kdm_age: kdmAge,
    pheno_age: phenoAge,
    hd_score: hdScore,
    kdm_age_gap: kdmAgeGap,
    pheno_age_gap: phenoAgeGap,
    coverage_pct: coveragePct,
    biomarkers_used: availablePheno,
    missing_biomarkers: missingPheno,
    provenance: {
      model_name: BIOAGE_METADATA.model_name,
      bioage_commit: BIOAGE_METADATA.bioage_commit,
      calculated_at: new Date().toISOString(),
      chronological_age: safeAge,
      sex,
      required_demographics: ['chronological_age', 'sex'],
      drivers: {
        supporting,
        optimization_opportunities: opportunities
      }
    }
  }
}
