/**
 * Biomarker Feedback & Calibration Engine
 * 
 * Closes the loop between daily habits (80/20 Dialed-In scores) and objective diagnostic health outcomes.
 * Compares real-world laboratory & imaging results against protocol dialed-in scores,
 * computing clinical effect-size projections and feedback narratives.
 */

import { BiomarkerMeasurementRecord } from '@/lib/aging-models/bioAgeTypes'
import { BIOMARKER_REGISTRY } from '@/lib/aging-models/biomarkerRegistry'
import { normalizeOutcomeKey } from './outcomeOptimizationEngine'

export interface BiomarkerFeedbackItem {
  biomarkerId: string
  name: string
  shortName: string
  system: string
  currentValue: number | null
  unit: string
  collectionDate: string | null
  clinicalTargetDisplay: string
  optimalMin: number
  optimalMax: number
  isOptimal: boolean
  status: 'optimal' | 'suboptimal' | 'elevated' | 'missing'
  statusLabel: string
  statusColor: {
    badgeBg: string
    badgeBorder: string
    badgeText: string
    dotColor: string
  }
  predictedShiftPercent: string
  predictedDirection: 'decrease' | 'increase' | 'maintain'
  projectedValue: number | null
  calibrationText: string
  biologicalMechanism: string
  studyCitation?: string
  studyUrl?: string
}

export interface OutcomeBiomarkerFeedback {
  outcomeKey: string
  outcomeName: string
  dialedInScore: number
  primaryBiomarker: BiomarkerFeedbackItem
  secondaryBiomarkers: BiomarkerFeedbackItem[]
  hasAnyLoggedBiomarkers: boolean
  overallSummaryText: string
}

export interface KeyBiomarkerPreset {
  biomarkerId: string
  name: string
  value: number
  unit: string
  target: string
  system: string
}

/**
 * Canonical mapping between 8 Longevity Vectors / Functional Outcomes and Biomarkers
 */
export const VECTOR_BIOMARKER_MAP: Record<string, {
  primaryId: string
  secondaryIds: string[]
  expectedShiftRange: { min: number; max: number } // e.g. 14 to 18 percent
  direction: 'decrease' | 'increase'
  mechanism: string
}> = {
  heart_health: {
    primaryId: 'apob',
    secondaryIds: ['vo2_max', 'ldl', 'lpa'],
    expectedShiftRange: { min: 14, max: 18 },
    direction: 'decrease',
    mechanism: 'Endothelial nitric oxide upregulation, aerobic lipid oxidation, and reduced hepatic VLDL particle secretion.'
  },
  metabolic_health: {
    primaryId: 'fasting_insulin',
    secondaryIds: ['glucose', 'hba1c', 'triglycerides'],
    expectedShiftRange: { min: 20, max: 30 },
    direction: 'decrease',
    mechanism: 'Non-insulin dependent GLUT4 skeletal translocation, hepatic AMPK activation, and visceral fat mobilization.'
  },
  chronic_inflammation: {
    primaryId: 'crp',
    secondaryIds: ['wbc', 'rdw', 'ferritin'],
    expectedShiftRange: { min: 25, max: 40 },
    direction: 'decrease',
    mechanism: 'NLRP3 inflammasome suppression, specialized pro-resolving lipid mediator (SPM) synthesis, and NF-κB blockade.'
  },
  testosterone: {
    primaryId: 'testosterone',
    secondaryIds: ['free_testosterone', 'shbg', 'dhea_s'],
    expectedShiftRange: { min: 15, max: 25 },
    direction: 'increase',
    mechanism: 'Leydig cell mitochondrial StAR stimulation, nocturnal LH pulsatility preservation, and cortisol-to-testosterone ratio suppression.'
  },
  bone_density: {
    primaryId: 'dexa_t_score',
    secondaryIds: ['vitamin_d', 'alp'],
    expectedShiftRange: { min: 1.5, max: 3.0 },
    direction: 'increase',
    mechanism: 'Piezo1 axial mechanotransduction osteoblast activation, Osteocalcin Vitamin K2 carboxylation, and RANKL suppression.'
  },
  cellular_longevity: {
    primaryId: 'dnam_age',
    secondaryIds: ['albumin', 'lymph_pct'],
    expectedShiftRange: { min: 8, max: 14 },
    direction: 'decrease',
    mechanism: 'Epigenetic DNA methylation drift attenuation, senolytic SASP clearance, and intracellular NAD+/SIRT1 repair maintenance.'
  },
  brain_longevity: {
    primaryId: 'homocysteine',
    secondaryIds: ['vo2_max', 'dhea_s'],
    expectedShiftRange: { min: 15, max: 25 },
    direction: 'decrease',
    mechanism: '1-carbon methylation efficiency, cerebral microvascular preservation, and slow-wave glymphatic waste clearance.'
  },
  cancer_defense: {
    primaryId: 'fasting_insulin',
    secondaryIds: ['crp', 'lymph_pct'],
    expectedShiftRange: { min: 20, max: 35 },
    direction: 'decrease',
    mechanism: 'Macroautophagic lysosomal turnover (LC3-II/p62), attenuation of hyperinsulinemic mitogenic growth, and NK cytotoxic surveillance.'
  },

  // Functional Outcomes aliases
  endurance: {
    primaryId: 'vo2_max',
    secondaryIds: ['apob', 'rdw'],
    expectedShiftRange: { min: 10, max: 16 },
    direction: 'increase',
    mechanism: 'Mitochondrial volume density expansion in Type I muscle fibers and left ventricular stroke volume expansion.'
  },
  strength: {
    primaryId: 'testosterone',
    secondaryIds: ['free_testosterone', 'dexa_t_score'],
    expectedShiftRange: { min: 15, max: 25 },
    direction: 'increase',
    mechanism: 'Myofibrillar protein synthesis, androgen receptor sensitivity, and neuromuscular motor unit recruitment.'
  },
  energy: {
    primaryId: 'fasting_insulin',
    secondaryIds: ['homocysteine', 'ferritin'],
    expectedShiftRange: { min: 18, max: 28 },
    direction: 'decrease',
    mechanism: 'Mitochondrial substrate flexibility between glucose and fatty acids, eliminating postprandial reactive hypoglycemia.'
  },
  deep_sleep: {
    primaryId: 'crp',
    secondaryIds: ['homocysteine', 'dhea_s'],
    expectedShiftRange: { min: 20, max: 35 },
    direction: 'decrease',
    mechanism: 'Systemic cytokine blunting enabling sustained parasympathetic delta-wave sleep architecture.'
  },
  sleep_quality: {
    primaryId: 'crp',
    secondaryIds: ['homocysteine', 'dhea_s'],
    expectedShiftRange: { min: 20, max: 35 },
    direction: 'decrease',
    mechanism: 'Autonomic tone stabilization and nocturnal microvascular recovery.'
  }
}

/**
 * 8 Canonical Key Biomarkers for the Lab Entry Drawer
 */
export const KEY_BIOMARKER_IDS = [
  'apob',
  'vo2_max',
  'fasting_insulin',
  'crp',
  'testosterone',
  'free_testosterone',
  'dexa_t_score',
  'dnam_age'
] as const

/**
 * Sample Baseline measurements for interactive demo calibration
 */
export const SAMPLE_DIAGNOSTIC_BASELINE: Record<string, { value: number; unit: string; raw_name: string }> = {
  apob: { value: 78, unit: 'mg/dL', raw_name: 'Apolipoprotein B (ApoB)' },
  vo2_max: { value: 41.5, unit: 'mL/kg/min', raw_name: 'VO2 Max' },
  fasting_insulin: { value: 7.8, unit: 'uIU/mL', raw_name: 'Fasting Insulin' },
  crp: { value: 1.6, unit: 'mg/L', raw_name: 'High-Sensitivity CRP (hs-CRP)' },
  testosterone: { value: 490, unit: 'ng/dL', raw_name: 'Total Testosterone' },
  free_testosterone: { value: 14.2, unit: 'pg/mL', raw_name: 'Free Testosterone' },
  dexa_t_score: { value: -0.8, unit: 'T-Score', raw_name: 'DEXA Femoral T-Score' },
  dnam_age: { value: 0.96, unit: 'years/year', raw_name: 'DunedinPACE Biological Aging Pace' },
  homocysteine: { value: 10.4, unit: 'umol/L', raw_name: 'Serum Homocysteine' },
  vitamin_d: { value: 38, unit: 'ng/mL', raw_name: '25-Hydroxy Vitamin D' }
}

/**
 * Evaluates an individual biomarker measurement against its LEVL optimal zone and computes calibrated prediction
 */
export function evaluateBiomarkerCalibration(
  biomarkerId: string,
  measurement: BiomarkerMeasurementRecord | undefined,
  dialedInScore: number = 85,
  outcomeName: string = 'Longevity'
): BiomarkerFeedbackItem {
  const def = BIOMARKER_REGISTRY[biomarkerId]
  const val = measurement?.normalized_value ?? measurement?.raw_value ?? null
  const unit = measurement?.normalized_unit || def?.primary_unit || ''
  const date = measurement?.collection_date || null

  const optMin = def?.levl_optimal_zone.min ?? 0
  const optMax = def?.levl_optimal_zone.max ?? 100
  const optDisplay = def?.levl_optimal_zone.display || `< ${optMax} ${unit}`

  // Determine status
  let isOptimal = false
  let status: 'optimal' | 'suboptimal' | 'elevated' | 'missing' = 'missing'
  let statusLabel = 'Not Logged'
  let statusColor = {
    badgeBg: 'bg-slate-900/60',
    badgeBorder: 'border-slate-800',
    badgeText: 'text-slate-400',
    dotColor: 'bg-slate-500'
  }

  if (val !== null) {
    // Special directional evaluations based on biomarker nature
    if (biomarkerId === 'vo2_max' || biomarkerId === 'dexa_t_score' || biomarkerId === 'testosterone' || biomarkerId === 'free_testosterone') {
      // Higher is better
      if (val >= optMin) {
        isOptimal = true
        status = 'optimal'
        statusLabel = 'Optimal'
        statusColor = {
          badgeBg: 'bg-emerald-950/60',
          badgeBorder: 'border-emerald-500/40',
          badgeText: 'text-emerald-300',
          dotColor: 'bg-emerald-400'
        }
      } else {
        isOptimal = false
        status = 'suboptimal'
        statusLabel = 'Suboptimal'
        statusColor = {
          badgeBg: 'bg-amber-950/60',
          badgeBorder: 'border-amber-500/40',
          badgeText: 'text-amber-300',
          dotColor: 'bg-amber-400'
        }
      }
    } else {
      // Lower is better (ApoB, Fasting Insulin, hs-CRP, Homocysteine, DunedinPACE)
      if (val <= optMax) {
        isOptimal = true
        status = 'optimal'
        statusLabel = 'Optimal'
        statusColor = {
          badgeBg: 'bg-emerald-950/60',
          badgeBorder: 'border-emerald-500/40',
          badgeText: 'text-emerald-300',
          dotColor: 'bg-emerald-400'
        }
      } else {
        isOptimal = false
        status = 'elevated'
        statusLabel = 'Elevated'
        statusColor = {
          badgeBg: 'bg-rose-950/60',
          badgeBorder: 'border-rose-500/40',
          badgeText: 'text-rose-300',
          dotColor: 'bg-rose-400'
        }
      }
    }
  }

  // Effect size & Calibration Text Calculus
  let shiftRange = { min: 14, max: 18 }
  let direction: 'decrease' | 'increase' | 'maintain' = 'decrease'
  let projectedVal: number | null = null
  let calText = ''

  if (biomarkerId === 'apob') {
    shiftRange = { min: 14, max: 18 }
    direction = 'decrease'
    if (val !== null) {
      if (isOptimal) {
        calText = `Your ApoB is ${val} mg/dL (Optimal Zone). Sustaining ${dialedInScore}% Dialed-In on ${outcomeName} maintains your vascular protective baseline.`
      } else {
        const avgShift = (shiftRange.min + shiftRange.max) / 2 / 100
        projectedVal = Math.round(val * (1 - avgShift))
        calText = `Your ApoB is ${val} mg/dL. Reaching ${dialedInScore}% Dialed-In on ${outcomeName} predicts a ${shiftRange.min}–${shiftRange.max}% reduction (est. ~${projectedVal} mg/dL) toward your ${optDisplay} target.`
      }
    } else {
      calText = `No recent ApoB logged. Enter your lab result to calibrate ${outcomeName} 80/20 predictions against real clinical bloodwork.`
    }
  } else if (biomarkerId === 'vo2_max') {
    shiftRange = { min: 10, max: 16 }
    direction = 'increase'
    if (val !== null) {
      if (isOptimal) {
        calText = `Your VO₂ Max is ${val} mL/kg/min (Top Tier). Sustaining ${dialedInScore}% Dialed-In maintains peak cardiorespiratory longevity reserve.`
      } else {
        const avgShift = (shiftRange.min + shiftRange.max) / 2 / 100
        projectedVal = Number((val * (1 + avgShift)).toFixed(1))
        calText = `Your VO₂ Max is ${val} mL/kg/min. Reaching ${dialedInScore}% Dialed-In predicts a +${shiftRange.min}–${shiftRange.max}% increase (est. ~${projectedVal} mL/kg/min) toward your ${optDisplay} target.`
      }
    } else {
      calText = `No recent VO₂ Max recorded. Enter your CPET or wearable estimate to calibrate cardiorespiratory survival predictions.`
    }
  } else if (biomarkerId === 'fasting_insulin') {
    shiftRange = { min: 20, max: 30 }
    direction = 'decrease'
    if (val !== null) {
      if (isOptimal) {
        calText = `Your Fasting Insulin is ${val} uIU/mL (Optimal Zone). Sustaining ${dialedInScore}% Dialed-In preserves high non-insulin GLUT4 clearance.`
      } else {
        const avgShift = (shiftRange.min + shiftRange.max) / 2 / 100
        projectedVal = Number((val * (1 - avgShift)).toFixed(1))
        calText = `Your Fasting Insulin is ${val} uIU/mL. Reaching ${dialedInScore}% Dialed-In predicts a ${shiftRange.min}–${shiftRange.max}% reduction (est. ~${projectedVal} uIU/mL) toward your ${optDisplay} target.`
      }
    } else {
      calText = `No recent Fasting Insulin logged. Enter your lab result to calibrate metabolic sensitivity and glucose disposal.`
    }
  } else if (biomarkerId === 'crp') {
    shiftRange = { min: 25, max: 40 }
    direction = 'decrease'
    if (val !== null) {
      if (isOptimal) {
        calText = `Your hs-CRP is ${val} mg/L (Optimal Zone). Sustaining ${dialedInScore}% Dialed-In suppresses basal sterile vascular inflammaging.`
      } else {
        const avgShift = (shiftRange.min + shiftRange.max) / 2 / 100
        projectedVal = Number((val * (1 - avgShift)).toFixed(2))
        calText = `Your hs-CRP is ${val} mg/L. Reaching ${dialedInScore}% Dialed-In predicts a ${shiftRange.min}–${shiftRange.max}% reduction (est. ~${projectedVal} mg/L) toward your ${optDisplay} target.`
      }
    } else {
      calText = `No recent hs-CRP logged. Enter your lab result to calibrate systemic sterile inflammation and NLRP3 suppression.`
    }
  } else if (biomarkerId === 'testosterone') {
    shiftRange = { min: 15, max: 25 }
    direction = 'increase'
    if (val !== null) {
      if (isOptimal) {
        calText = `Your Total Testosterone is ${val} ng/dL (Optimal Zone). Sustaining ${dialedInScore}% Dialed-In maintains peak anabolic endocrine signaling.`
      } else {
        const avgShift = (shiftRange.min + shiftRange.max) / 2 / 100
        projectedVal = Math.round(val * (1 + avgShift))
        calText = `Your Total Testosterone is ${val} ng/dL. Reaching ${dialedInScore}% Dialed-In predicts a +${shiftRange.min}–${shiftRange.max}% optimization (est. ~${projectedVal} ng/dL) toward your ${optDisplay} target.`
      }
    } else {
      calText = `No recent Testosterone logged. Enter your hormone panel to calibrate endocrine vitality and free androgen signaling.`
    }
  } else if (biomarkerId === 'free_testosterone') {
    shiftRange = { min: 18, max: 28 }
    direction = 'increase'
    if (val !== null) {
      if (isOptimal) {
        calText = `Your Free Testosterone is ${val} pg/mL (Optimal Zone). Sustaining ${dialedInScore}% Dialed-In ensures unhindered androgen receptor activation.`
      } else {
        const avgShift = (shiftRange.min + shiftRange.max) / 2 / 100
        projectedVal = Number((val * (1 + avgShift)).toFixed(1))
        calText = `Your Free Testosterone is ${val} pg/mL. Reaching ${dialedInScore}% Dialed-In predicts a +${shiftRange.min}–${shiftRange.max}% increase (est. ~${projectedVal} pg/mL) toward your ${optDisplay} target.`
      }
    } else {
      calText = `No recent Free Testosterone logged. Enter your lab value to track bioavailable androgen signaling.`
    }
  } else if (biomarkerId === 'dexa_t_score') {
    shiftRange = { min: 1.5, max: 3.0 }
    direction = 'increase'
    if (val !== null) {
      if (isOptimal) {
        calText = `Your DEXA T-Score is ${val >= 0 ? '+' : ''}${val} (Robust Bone Density). Sustaining ${dialedInScore}% Dialed-In preserves skeletal mineral durability.`
      } else {
        projectedVal = Number((val + 0.3).toFixed(1))
        calText = `Your DEXA T-Score is ${val}. Reaching ${dialedInScore}% Dialed-In with axial loading & D3/K2 halts trabecular loss (est. shift to ${projectedVal >= 0 ? '+' : ''}${projectedVal}) toward your ${optDisplay} target.`
      }
    } else {
      calText = `No recent DEXA scan logged. Enter your femoral neck or lumbar T-score to calibrate fracture resistance.`
    }
  } else if (biomarkerId === 'dnam_age') {
    shiftRange = { min: 8, max: 14 }
    direction = 'decrease'
    if (val !== null) {
      if (isOptimal) {
        calText = `Your DunedinPACE is ${val} years/year (Decelerated Aging Pace). Sustaining ${dialedInScore}% Dialed-In protects multi-organ functional integrity.`
      } else {
        projectedVal = Number((val - 0.08).toFixed(2))
        calText = `Your DunedinPACE is ${val} years/year. Reaching ${dialedInScore}% Dialed-In predicts a slowing of your biological aging rate (est. ~${projectedVal} years/year) toward your ${optDisplay} target.`
      }
    } else {
      calText = `No DunedinPACE logged. Enter your epigenetic pace of aging to calibrate molecular longevity velocity.`
    }
  } else if (biomarkerId === 'homocysteine') {
    shiftRange = { min: 15, max: 25 }
    direction = 'decrease'
    if (val !== null) {
      if (isOptimal) {
        calText = `Your Homocysteine is ${val} umol/L (Optimal Zone). Sustaining ${dialedInScore}% Dialed-In protects cerebral microvasculature.`
      } else {
        const avgShift = (shiftRange.min + shiftRange.max) / 2 / 100
        projectedVal = Number((val * (1 - avgShift)).toFixed(1))
        calText = `Your Homocysteine is ${val} umol/L. Reaching ${dialedInScore}% Dialed-In predicts a ${shiftRange.min}–${shiftRange.max}% reduction (est. ~${projectedVal} umol/L) toward your ${optDisplay} target.`
      }
    } else {
      calText = `No Homocysteine logged. Enter your lab value to calibrate neurovascular protection and methylation efficiency.`
    }
  } else {
    // Generic fallback
    calText = val !== null
      ? `Your ${def?.name || biomarkerId} is ${val} ${unit}. Reaching ${dialedInScore}% Dialed-In supports physiological homeostasis toward your ${optDisplay} target.`
      : `No recent ${def?.name || biomarkerId} logged. Enter your lab result to close the loop with daily habits.`
  }

  const canonicalShortMap: Record<string, string> = {
    apob: 'ApoB',
    vo2_max: 'VO₂ Max',
    fasting_insulin: 'Insulin',
    crp: 'hs-CRP',
    testosterone: 'Total T',
    free_testosterone: 'Free T',
    dexa_t_score: 'DEXA',
    dnam_age: 'DunedinPACE',
    homocysteine: 'Homocysteine',
    vitamin_d: 'Vit D',
    glucose: 'Glucose',
    hba1c: 'HbA1c',
    triglycerides: 'Trigs',
    ldl: 'LDL',
    lpa: 'Lp(a)'
  }

  return {
    biomarkerId,
    name: def?.name || biomarkerId,
    shortName: canonicalShortMap[biomarkerId] || def?.name.split('(')[0].trim() || biomarkerId,
    system: def?.system || 'cardiovascular',
    currentValue: val,
    unit,
    collectionDate: date,
    clinicalTargetDisplay: optDisplay,
    optimalMin: optMin,
    optimalMax: optMax,
    isOptimal,
    status,
    statusLabel,
    statusColor,
    predictedShiftPercent: `${shiftRange.min}–${shiftRange.max}%`,
    predictedDirection: direction,
    projectedValue: projectedVal,
    calibrationText: calText,
    biologicalMechanism: def?.longevity_importance || 'Key biological health marker.',
    studyCitation: def?.study_citation,
    studyUrl: def?.study_url
  }
}

/**
 * Returns complete biomarker feedback loop context for a given outcome dimension
 */
export function getBiomarkerFeedbackForOutcome(
  outcomeKeyOrName: string,
  dialedInScore: number = 85,
  measurements: BiomarkerMeasurementRecord[] = []
): OutcomeBiomarkerFeedback {
  const normKey = normalizeOutcomeKey(outcomeKeyOrName)
  const mapping = VECTOR_BIOMARKER_MAP[normKey] || VECTOR_BIOMARKER_MAP.heart_health

  // Index user measurements by biomarker_id
  const userMap = new Map<string, BiomarkerMeasurementRecord>()
  measurements.forEach(m => {
    if (!userMap.has(m.biomarker_id)) {
      userMap.set(m.biomarker_id, m)
    }
  })

  // Format Outcome Display Name
  const outcomeDisplayName = normKey
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  const primaryItem = evaluateBiomarkerCalibration(
    mapping.primaryId,
    userMap.get(mapping.primaryId),
    dialedInScore,
    outcomeDisplayName
  )

  const secondaryItems = mapping.secondaryIds.map(secId =>
    evaluateBiomarkerCalibration(
      secId,
      userMap.get(secId),
      dialedInScore,
      outcomeDisplayName
    )
  )

  const hasAnyLogged = primaryItem.currentValue !== null || secondaryItems.some(s => s.currentValue !== null)

  const overallSummaryText = primaryItem.currentValue !== null
    ? primaryItem.calibrationText
    : `Sync your actual diagnostic bloodwork to calibrate your ${dialedInScore}% Dialed-In score against real biological shifts.`

  return {
    outcomeKey: normKey,
    outcomeName: outcomeDisplayName,
    dialedInScore,
    primaryBiomarker: primaryItem,
    secondaryBiomarkers: secondaryItems,
    hasAnyLoggedBiomarkers: hasAnyLogged,
    overallSummaryText
  }
}

/**
 * Returns status overview of all 8 key canonical biomarkers
 */
export function getAllKeyBiomarkersStatus(
  measurements: BiomarkerMeasurementRecord[] = []
): BiomarkerFeedbackItem[] {
  const userMap = new Map<string, BiomarkerMeasurementRecord>()
  measurements.forEach(m => {
    if (!userMap.has(m.biomarker_id)) {
      userMap.set(m.biomarker_id, m)
    }
  })

  return KEY_BIOMARKER_IDS.map(id =>
    evaluateBiomarkerCalibration(id, userMap.get(id), 85, 'Protocol')
  )
}
