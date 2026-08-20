import { DailyProtocolTask, Modality, UserProfile, DailyWellbeingCheckin } from '@/lib/types'
import { BiomarkerMeasurementRecord } from '@/lib/aging-models/bioAgeTypes'
import { format, differenceInDays, addDays, isAfter, isBefore, isSameDay } from 'date-fns'
import { resolvePubMedCitation } from '@/lib/tracking/scientificCitations'

export interface PeptideCycleSummary {
  protocolId: string
  protocolName: string
  modalityId: string
  modalityName: string
  category: string
  startDate: string
  cycleLengthDays: number
  activeDaysCompleted: number
  progressPct: number
  currentPhase: 'baseline' | 'loading' | 'maintenance' | 'titration' | 'washout' | 'off_cycle'
  phaseLabel: string
  phaseColor: string
  washoutDaysRemaining: number
  isWashoutActive: boolean
  receptorResensitizationPct: number
  totalDosesScheduled: number
  totalDosesCompleted: number
  adherencePct: number
  reconstitutionDaysElapsed?: number
  reconstitutionFreshnessPct?: number
  vialDaysRemaining?: number
  halfLifeHours: number
  halfLifeLabel: string
  pkConfidence: 'High (Human Clinical Trials)' | 'Moderate (Translational / Animal PK)' | 'Estimated (Downstream Cascades)'
  regulatoryStatus: string
  evidenceLevel: string
  pubmedUrl?: string
  contraindications: string[]
  synergyNotes: string[]
  administrationTips: string[]
  dosageSpec: string
  timingSlot: string
}

export interface PKDataPoint {
  date: string
  dayLabel: string
  estimatedRelativeLevel: number // 0 - 100 relative index
  doseLoggedToday: boolean
  doseAmountText?: string
  confidenceLabel: string
}

export interface PeptideBiomarkerCorrelation {
  biomarkerId: string
  biomarkerName: string
  unit: string
  canonicalTarget: string // e.g. "IGF-1", "hs-CRP", "Fasting Glucose"
  clinicalRelevance: string
  preCycleBaseline: { value: number; date: string } | null
  intraCycleActive: { value: number; date: string } | null
  postCycle: { value: number; date: string } | null
  deltaPercent: number | null
  direction: 'improved' | 'elevated' | 'reduced' | 'neutral' | 'insufficient_data'
}

// Pharmacokinetic Half-Life Registry with verified elimination rate constants
export const PEPTIDE_PK_REGISTRY: Record<
  string,
  {
    halfLifeHours: number
    label: string
    confidence: 'High (Human Clinical Trials)' | 'Moderate (Translational / Animal PK)' | 'Estimated (Downstream Cascades)'
    regulatoryStatus: string
    cycleStandardDays: number
    washoutStandardDays: number
    relevantBiomarkerIds: { id: string; name: string; relevance: string }[]
    contraindications: string[]
    synergyNotes: string[]
    administrationTips: string[]
  }
> = {
  bpc157_subq: {
    halfLifeHours: 4,
    label: '~4 hours (downstream angiogenic repair persists >24h)',
    confidence: 'Moderate (Translational / Animal PK)',
    regulatoryStatus: 'Compounded / Research Bioactive',
    cycleStandardDays: 56, // 8 weeks
    washoutStandardDays: 28, // 4 weeks
    relevantBiomarkerIds: [
      { id: 'hscrp', name: 'hs-CRP', relevance: 'Monitors systemic inflammation reduction and tissue repair' },
      { id: 'esr', name: 'ESR', relevance: 'Erythrocyte sedimentation rate inflammatory benchmark' },
      { id: 'ast', name: 'AST', relevance: 'Liver safety and metabolic clearance profile' },
      { id: 'alt', name: 'ALT', relevance: 'Liver hepatic transaminase monitoring' }
    ],
    contraindications: ['Active malignancy or unresolved neoplasms', 'Pregnancy or nursing'],
    synergyNotes: ['Synergizes with TB-500 for enhanced collagen matrix tensile recovery', 'Take morning on empty stomach'],
    administrationTips: ['SubQ injection in abdomen or near site of localized tissue discomfort', 'Keep refrigerated post-reconstitution']
  },
  tb500_subq: {
    halfLifeHours: 36,
    label: '~24–48 hours (systemic distribution to connective tissues)',
    confidence: 'Moderate (Translational / Animal PK)',
    regulatoryStatus: 'Compounded / Research Bioactive',
    cycleStandardDays: 56, // 8 weeks
    washoutStandardDays: 28, // 4 weeks
    relevantBiomarkerIds: [
      { id: 'hscrp', name: 'hs-CRP', relevance: 'Systemic vascular and soft-tissue inflammation' },
      { id: 'creatinine', name: 'Creatinine', relevance: 'Renal filtration baseline' }
    ],
    contraindications: ['Known active oncological history', 'Severe renal impairment'],
    synergyNotes: ['Pulsed 2x weekly (e.g. Day 1 and Day 4)', 'Synergistic with BPC-157 to prevent fibrotic scarring'],
    administrationTips: ['SubQ injection systemically anywhere with subcutaneous fat (e.g. abdomen/thigh)']
  },
  cjc1295_no_dac_subq: {
    halfLifeHours: 0.5,
    label: '~30 minutes (physiologic nocturnal GH pulse without burnout)',
    confidence: 'High (Human Clinical Trials)',
    regulatoryStatus: 'Compounded Peptide',
    cycleStandardDays: 56, // 8 weeks (5 on / 2 off)
    washoutStandardDays: 28, // 4 weeks
    relevantBiomarkerIds: [
      { id: 'igf1', name: 'IGF-1', relevance: 'Direct biomarker of somatotropic axis activity and GH pulsatility' },
      { id: 'glucose', name: 'Fasting Glucose', relevance: 'Monitors insulin sensitivity and glycation control' },
      { id: 'hba1c', name: 'HbA1c', relevance: '3-month average glycemic control' }
    ],
    contraindications: ['Active cancer / pituitary adenomas', 'Severe diabetic retinopathy'],
    synergyNotes: ['Must co-administer with Ipamorelin to trigger synergistic GHRH + Ghrelin receptor pulse', '5 on / 2 off weekly cadence'],
    administrationTips: ['Inject pre-bed at least 90 minutes after last meal (fasted state required)']
  },
  ipamorelin_subq: {
    halfLifeHours: 2,
    label: '~2 hours (rapidly cleared, selective GHS-R1a agonist)',
    confidence: 'High (Human Clinical Trials)',
    regulatoryStatus: 'Compounded Peptide',
    cycleStandardDays: 56,
    washoutStandardDays: 28,
    relevantBiomarkerIds: [
      { id: 'igf1', name: 'IGF-1', relevance: 'Primary marker of GH release and cellular regeneration' },
      { id: 'prolactin', name: 'Prolactin', relevance: 'Selectivity check (Ipamorelin avoids prolactin spikes)' },
      { id: 'cortisol', name: 'Cortisol', relevance: 'Stress hormone check (Ipamorelin avoids cortisol elevation)' }
    ],
    contraindications: ['Active neoplasia', 'Severe endocrine tumors'],
    synergyNotes: ['Combines with CJC-1295 for amplified pulsatile GH release', '5 days on / 2 days off prevents receptor tolerance'],
    administrationTips: ['Inject pre-bed fasted; avoid carbohydrate intake 60m post-dose']
  },
  ghk_cu_subq: {
    halfLifeHours: 1,
    label: '~0.5–1 hour (downstream copper-dependent gene transcription lasts weeks)',
    confidence: 'High (Human Clinical Trials)',
    regulatoryStatus: 'Cosmetic / Compounded Bioactive',
    cycleStandardDays: 30, // 30 days
    washoutStandardDays: 30, // 30 days
    relevantBiomarkerIds: [
      { id: 'copper_serum', name: 'Serum Copper', relevance: 'Monitors systemic copper balance during high-dose cycles' },
      { id: 'ceruloplasmin', name: 'Ceruloplasmin', relevance: 'Copper transport protein homeostasis' },
      { id: 'zinc_serum', name: 'Serum Zinc', relevance: 'Zinc/Copper ratio balance check' }
    ],
    contraindications: ['Wilson disease or copper metabolism disorders'],
    synergyNotes: ['Synergizes with Red Light Therapy (Photobiomodulation) for collagen matrix synthesis', 'Supplement 15-30mg Zinc during long cycles'],
    administrationTips: ['Morning administration; rotate injection sites if localized stinging occurs']
  },
  tesamorelin_subq: {
    halfLifeHours: 0.6,
    label: '~38 minutes (FDA approved GRF analogue)',
    confidence: 'High (Human Clinical Trials)',
    regulatoryStatus: 'FDA Approved (Egrifta) / Compounded',
    cycleStandardDays: 56,
    washoutStandardDays: 28,
    relevantBiomarkerIds: [
      { id: 'igf1', name: 'IGF-1', relevance: 'Monitors somatotropic endocrine elevation' },
      { id: 'glucose', name: 'Fasting Blood Glucose', relevance: 'Tracks glycemic response' },
      { id: 'lipids_triglycerides', name: 'Triglycerides', relevance: 'Tracks visceral adipose lipolysis' }
    ],
    contraindications: ['Pituitary adenoma or hypopituitarism', 'Active malignancy'],
    synergyNotes: ['Take fasted before bedtime for maximum visceral fat lipolysis', 'Combine with Ipamorelin or AOD-9604'],
    administrationTips: ['Inject SubQ in abdominal area 90+ mins after last meal']
  },
  mots_c_subq: {
    halfLifeHours: 4,
    label: '~4 hours (mitochondrial DNA-encoded peptide signaling persists 48-72h)',
    confidence: 'Moderate (Translational / Animal PK)',
    regulatoryStatus: 'Research Bioactive / Compounded',
    cycleStandardDays: 30,
    washoutStandardDays: 30,
    relevantBiomarkerIds: [
      { id: 'glucose', name: 'Fasting Glucose', relevance: 'Monitors AMPK activation and insulin sensitivity' },
      { id: 'hba1c', name: 'HbA1c', relevance: 'Long-term glycemic regulation' },
      { id: 'lactate', name: 'Blood Lactate', relevance: 'Mitochondrial metabolic efficiency' }
    ],
    contraindications: ['Severe hypoglycemia', 'Active malignancy'],
    synergyNotes: ['Pulsed 3x weekly (Mon/Wed/Fri) morning prior to Zone 2 cardio workout', 'Synergizes with 16:8 intermittent fasting'],
    administrationTips: ['Inject SubQ morning on empty stomach before exercise']
  },
  semax_subq: {
    halfLifeHours: 0.5,
    label: '~20–30 minutes (central neurotrophic BDNF cascades persist >24h)',
    confidence: 'High (Human Clinical Trials)',
    regulatoryStatus: 'Approved in Europe / Compounded Bioactive',
    cycleStandardDays: 30,
    washoutStandardDays: 14,
    relevantBiomarkerIds: [
      { id: 'bdnf', name: 'Serum BDNF', relevance: 'Brain-derived neurotrophic factor benchmark' }
    ],
    contraindications: ['Acute psychotic states', 'Severe anxiety disorders'],
    synergyNotes: ['5 days on / 2 days off during work week', 'Combine with morning sunlight and optic flow protocols'],
    administrationTips: ['Morning SubQ or intranasal administration; avoid taking late evening']
  },
  selank_subq: {
    halfLifeHours: 0.5,
    label: '~20–30 minutes (anxiolytic and GABAergic stabilization persists 8–12h)',
    confidence: 'High (Human Clinical Trials)',
    regulatoryStatus: 'Approved in Europe / Compounded Bioactive',
    cycleStandardDays: 30,
    washoutStandardDays: 14,
    relevantBiomarkerIds: [
      { id: 'cortisol', name: 'Salivary / Blood Cortisol', relevance: 'HPA axis stress reactivity monitoring' }
    ],
    contraindications: ['Severe clinical depression with sedation'],
    synergyNotes: ['Midday dose synergizes with Semax morning focus stack', 'Take during high-stress working hours'],
    administrationTips: ['SubQ or intranasal midday']
  },
  kpv_subq: {
    halfLifeHours: 3,
    label: '~2–4 hours (alpha-MSH derivative NF-kB suppression lasts >24h)',
    confidence: 'Moderate (Translational / Animal PK)',
    regulatoryStatus: 'Compounded Peptide',
    cycleStandardDays: 56,
    washoutStandardDays: 28,
    relevantBiomarkerIds: [
      { id: 'hscrp', name: 'hs-CRP', relevance: 'Systemic mucosal & intestinal inflammation' },
      { id: 'calprotectin', name: 'Fecal Calprotectin', relevance: 'Gut lining inflammation index' }
    ],
    contraindications: ['Pregnancy or nursing'],
    synergyNotes: ['Combines with BPC-157 for comprehensive gut-mucosal barrier restoration', 'Daily morning administration'],
    administrationTips: ['SubQ or oral (for localized GI tract delivery)']
  },
  epitalon_subq: {
    halfLifeHours: 0.5,
    label: '~30 minutes (circadian pineal telomerase gene cascades persist for months)',
    confidence: 'High (Human Clinical Trials)',
    regulatoryStatus: 'Compounded Bioactive',
    cycleStandardDays: 15, // 15-day short cycle
    washoutStandardDays: 90, // 3-6 months off
    relevantBiomarkerIds: [
      { id: 'melatonin', name: 'Melatonin / Sleep Architecture', relevance: 'Pineal gland circadian rhythm' },
      { id: 'phenoage', name: 'PhenoAge DNAm Clock', relevance: 'Epigenetic biological age rate of aging' }
    ],
    contraindications: ['Active oncological conditions'],
    synergyNotes: ['Short 10-20 day pulse 1-2 times per year', 'Administer pre-bed in dark environment'],
    administrationTips: ['SubQ injection pre-bed for 10–20 consecutive days, then 3–6 months washout']
  },
  ta1_subq: {
    halfLifeHours: 2,
    label: '~2 hours (thymic T-cell priming & CD4+/CD8+ modulation lasts >72h)',
    confidence: 'High (Human Clinical Trials)',
    regulatoryStatus: 'FDA Approved (Zadaxin) / Compounded',
    cycleStandardDays: 56,
    washoutStandardDays: 28,
    relevantBiomarkerIds: [
      { id: 'cd4_cd8', name: 'CD4/CD8 Ratio', relevance: 'T-lymphocyte immune balance' },
      { id: 'lymphocytes', name: 'Absolute Lymphocyte Count', relevance: 'Immune resilience baseline' }
    ],
    contraindications: ['Organ transplant recipients', 'Severe autoimmune flare without clinician oversight'],
    synergyNotes: ['Pulsed 2x weekly (Day 1 & Day 4)', 'Synergizes with KPV and BPC-157 for immune balance'],
    administrationTips: ['SubQ morning injection 2x weekly']
  },
  tirzepatide_subq: {
    halfLifeHours: 120, // 5 days
    label: '~5 days (120h; maintains steady-state with 1x weekly injection)',
    confidence: 'High (Human Clinical Trials)',
    regulatoryStatus: 'FDA Approved (Mounjaro/Zepbound) / Compounded',
    cycleStandardDays: 112, // 16 weeks
    washoutStandardDays: 28,
    relevantBiomarkerIds: [
      { id: 'glucose', name: 'Fasting Blood Glucose', relevance: 'Direct glycemic control metric' },
      { id: 'hba1c', name: 'HbA1c', relevance: 'Longitudinal 3-month glycemic marker' },
      { id: 'lipids_triglycerides', name: 'Triglycerides', relevance: 'Metabolic lipid clearing' },
      { id: 'hscrp', name: 'hs-CRP', relevance: 'Metabolic inflammation resolution' }
    ],
    contraindications: ['Personal/family history of MTC or MEN 2', 'History of pancreatitis'],
    synergyNotes: ['1x weekly on same day (e.g. Sunday)', 'Maintain high dietary protein (1.0g/lb) and resistance training to preserve lean mass'],
    administrationTips: ['SubQ in abdomen, thigh, or upper arm; rotate sites']
  },
  semaglutide_subq: {
    halfLifeHours: 168, // 7 days
    label: '~7 days (168h; maintains steady-state with 1x weekly injection)',
    confidence: 'High (Human Clinical Trials)',
    regulatoryStatus: 'FDA Approved (Ozempic/Wegovy) / Compounded',
    cycleStandardDays: 112,
    washoutStandardDays: 28,
    relevantBiomarkerIds: [
      { id: 'glucose', name: 'Fasting Blood Glucose', relevance: 'Direct glycemic metric' },
      { id: 'hba1c', name: 'HbA1c', relevance: '3-month average glucose index' },
      { id: 'apob', name: 'Apolipoprotein B', relevance: 'Atherogenic lipoprotein particle count' }
    ],
    contraindications: ['MTC / MEN 2 history', 'Pancreatitis history'],
    synergyNotes: ['1x weekly schedule with slow 4-week dose titration', 'Pair with strength training to prevent sarcopenia'],
    administrationTips: ['SubQ once weekly; stay well hydrated with electrolytes']
  },
  aod9604_subq: {
    halfLifeHours: 0.5,
    label: '~30 minutes (lipolytic fat mobilization cascades persist for hours)',
    confidence: 'High (Human Clinical Trials)',
    regulatoryStatus: 'Compounded Peptide',
    cycleStandardDays: 56,
    washoutStandardDays: 28,
    relevantBiomarkerIds: [
      { id: 'glucose', name: 'Fasting Blood Glucose', relevance: 'Confirms zero diabetogenic blood sugar impact' },
      { id: 'lipids_triglycerides', name: 'Triglycerides', relevance: 'Fat mobilization index' }
    ],
    contraindications: ['Active malignancy'],
    synergyNotes: ['Administer morning completely fasted prior to cardio or breakfast', 'Combine with Tesamorelin for maximum lipolysis'],
    administrationTips: ['Inject SubQ morning on empty stomach']
  },
  pt141_subq: {
    halfLifeHours: 2.7,
    label: '~2.7 hours (central melanocortin MC3R/MC4R activation lasts 6–12h)',
    confidence: 'High (Human Clinical Trials)',
    regulatoryStatus: 'FDA Approved (Vyleesi) / Compounded',
    cycleStandardDays: 56,
    washoutStandardDays: 14,
    relevantBiomarkerIds: [
      { id: 'blood_pressure', name: 'Blood Pressure', relevance: 'Monitors transient blood pressure elevation' }
    ],
    contraindications: ['Uncontrolled hypertension', 'Known cardiovascular disease'],
    synergyNotes: ['As-needed 2x weekly max', 'Inject 45–60 minutes prior to desired effect'],
    administrationTips: ['SubQ injection; limit to no more than 2 doses per week to prevent nausea']
  }
}

/**
 * Extracts and synthesizes comprehensive Peptide Cycle Summaries from tasks, user profile, and modalities
 */
export const NON_PEPTIDE_BLACKLIST = [
  'collagen', // Oral collagen peptides powder is a dietary supplement, not an injectable bioactive cycle
  'sauna',
  'hyperthermic',
  'cold_plunge',
  'cold_water',
  'ice_bath',
  'cryo',
  'cardio',
  'zone_2',
  'zone 2',
  'vo2_max',
  'vo2 max',
  'hiit',
  'resistance',
  'hypertrophy',
  'strength',
  'fasting',
  'intermittent_fasting',
  'autophagy',
  'sunlight',
  'optic_flow',
  'blue_light',
  'mouth_tape',
  'vitamin',
  'alpha_lipoic',
  'alpha-lipoic',
  'magnesium',
  'omega_3',
  'creatine',
  'coq10',
  'curcumin',
  'berberine',
  'resveratrol',
  'fisetin',
  'quercetin',
  'rapamycin',
  'spermidine',
  'urolithin',
  'ca_akg',
  'tm_betaine'
]

export const KNOWN_PEPTIDE_KEYS = [
  'bpc157',
  'bpc-157',
  'tb500',
  'tb-500',
  'cjc1295',
  'cjc-1295',
  'ipamorelin',
  'ghk_cu',
  'ghk-cu',
  'ghkcu',
  'tesamorelin',
  'mots_c',
  'mots-c',
  'motsc',
  'semax',
  'selank',
  'kpv',
  'epitalon',
  'epithalon',
  'ta1',
  'thymosin',
  'tirzepatide',
  'semaglutide',
  'glp-1',
  'glp1',
  'aod9604',
  'aod-9604',
  'pt141',
  'pt-141',
  'bremelanotide',
  'kisspeptin',
  'sermorelin',
  'igf1',
  'igf-1',
  'retatrutide',
  'cagrilintide',
  'dsip',
  'ara290',
  'ara-290',
  'ss31',
  'ss-31',
  'follistatin',
  'oxytocin'
]

export function getCanonicalPeptideKey(rawId: string, rawName: string): string {
  const s = (rawId + ' ' + rawName).toLowerCase()
  if (s.includes('bpc')) return 'bpc157_subq'
  if (s.includes('tb500') || s.includes('tb-500') || s.includes('thymosin beta')) return 'tb500_subq'
  if (s.includes('cjc')) return 'cjc1295_no_dac_subq'
  if (s.includes('ipam')) return 'ipamorelin_subq'
  if (s.includes('ghk')) return 'ghk_cu_subq'
  if (s.includes('tesam')) return 'tesamorelin_subq'
  if (s.includes('mots')) return 'mots_c_subq'
  if (s.includes('semax')) return 'semax_subq'
  if (s.includes('selank')) return 'selank_subq'
  if (s.includes('kpv')) return 'kpv_subq'
  if (s.includes('epitalon') || s.includes('epithalon')) return 'epitalon_subq'
  if (s.includes('ta1') || s.includes('thymosin alpha')) return 'ta1_subq'
  if (s.includes('tirz')) return 'tirzepatide_subq'
  if (s.includes('sema') || s.includes('glp-1') || s.includes('glp1')) return 'semaglutide_subq'
  if (s.includes('aod')) return 'aod9604_subq'
  if (s.includes('pt141') || s.includes('pt-141') || s.includes('bremelanotide')) return 'pt141_subq'
  if (s.includes('kisspeptin')) return 'kisspeptin_subq'
  if (s.includes('sermorelin')) return 'sermorelin_subq'
  if (s.includes('igf1') || s.includes('igf-1')) return 'igf1_lr3_subq'
  if (s.includes('oxytocin')) return 'oxytocin_subq'
  return rawId.toLowerCase()
}

export function isPeptideModality(task: DailyProtocolTask): boolean {
  const m = task.loose_modality || task.protocol_step?.modality
  const mId = (task.modality_id || m?.id || '').toLowerCase()
  const cat = (m?.category || '').toLowerCase()
  const name = (m?.name || '').toLowerCase()

  // 1. Blacklist check (strictly exclude oral supplements, cardio, fasting, thermal, etc.)
  if (NON_PEPTIDE_BLACKLIST.some(bl => mId.includes(bl) || name.includes(bl))) {
    return false
  }

  // 2. Direct Category check
  if (cat === 'peptide' || cat === 'peptides' || cat.includes('peptide')) {
    return true
  }

  // 3. Known Peptide Keys check
  if (KNOWN_PEPTIDE_KEYS.some(k => mId.includes(k) || name.includes(k))) {
    return true
  }

  return false
}

/**
 * Extracts and synthesizes comprehensive Peptide Cycle Summaries from tasks, user profile, and modalities
 */
export function extractPeptideCycles(
  tasks: DailyProtocolTask[],
  weekDays: Date[],
  userProfile?: UserProfile | null
): PeptideCycleSummary[] {
  // Strictly filter tasks to only true peptides
  const peptideTasks = tasks.filter(isPeptideModality)

  // Group by canonical modality key to prevent multiple duplicate cards for the same peptide
  const modalityMap = new Map<string, DailyProtocolTask[]>()
  peptideTasks.forEach(task => {
    const m = task.loose_modality || task.protocol_step?.modality
    const rawId = task.modality_id || m?.id || task.id
    const rawName = m?.name || task.protocol_step?.modality?.name || ''
    const canonKey = getCanonicalPeptideKey(rawId, rawName)

    if (!modalityMap.has(canonKey)) modalityMap.set(canonKey, [])
    modalityMap.get(canonKey)!.push(task)
  })

  const cycles: PeptideCycleSummary[] = []
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const today = new Date()

  modalityMap.forEach((mTasks, mId) => {
    const firstTask = mTasks[0]
    const m = firstTask.loose_modality || firstTask.protocol_step?.modality
    const modName = m?.name || firstTask.protocol_step?.modality?.name || 'Peptide Compound'
    const protocolId = firstTask.user_protocol_instance_id || firstTask.protocol_step?.protocol_id || 'peptide_protocol'
    const protocolName = firstTask.protocol_step?.protocol?.name || 'Peptide Bioactive Stack'

    // Match PK Registry
    const matchedPkKey = Object.keys(PEPTIDE_PK_REGISTRY).find(k => mId.includes(k.replace('_subq', '')))
    const pkConfig = matchedPkKey ? PEPTIDE_PK_REGISTRY[matchedPkKey] : null

    // Determine Start Date and Cycle Dates
    const sortedDates = mTasks.map(t => t.scheduled_date).filter(Boolean).sort()
    const earliestDateStr = sortedDates[0] || todayStr
    const earliestDate = new Date(earliestDateStr + 'T00:00:00')
    const cycleLengthDays = pkConfig?.cycleStandardDays || 56
    const daysSinceStart = Math.max(0, differenceInDays(today, earliestDate))
    const activeDaysCompleted = Math.min(cycleLengthDays, daysSinceStart)
    const progressPct = Math.round((activeDaysCompleted / cycleLengthDays) * 100)

    // Completed doses
    const completedDoses = mTasks.filter(t => t.status === 'completed').length
    const totalScheduled = mTasks.length
    const adherencePct = totalScheduled > 0 ? Math.round((completedDoses / totalScheduled) * 100) : 100

    // Washout calculation
    const washoutStandard = pkConfig?.washoutStandardDays || 28
    const isWashoutActive = daysSinceStart >= cycleLengthDays
    const washoutDaysElapsed = isWashoutActive ? daysSinceStart - cycleLengthDays : 0
    const washoutDaysRemaining = isWashoutActive ? Math.max(0, washoutStandard - washoutDaysElapsed) : washoutStandard
    const receptorResensitizationPct = isWashoutActive
      ? Math.min(100, Math.round((washoutDaysElapsed / washoutStandard) * 100))
      : 100

    // Phase identification
    let currentPhase: PeptideCycleSummary['currentPhase'] = 'maintenance'
    let phaseLabel = 'Active Maintenance'
    let phaseColor = 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'

    if (daysSinceStart < 7) {
      currentPhase = 'loading'
      phaseLabel = 'Week 1 Loading'
      phaseColor = 'text-purple-400 border-purple-500/30 bg-purple-500/10'
    } else if (isWashoutActive && washoutDaysRemaining > 0) {
      currentPhase = 'washout'
      phaseLabel = `Washout (${washoutDaysRemaining}d remaining)`
      phaseColor = 'text-amber-400 border-amber-500/30 bg-amber-500/10'
    } else if (isWashoutActive && washoutDaysRemaining === 0) {
      currentPhase = 'off_cycle'
      phaseLabel = 'Receptors Resensitized (Ready for Next Cycle)'
      phaseColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    }

    // Reconstitution Freshness
    const reconstitutionDaysElapsed = daysSinceStart % 30
    const vialDaysRemaining = Math.max(0, 28 - reconstitutionDaysElapsed)
    const reconstitutionFreshnessPct = Math.round((vialDaysRemaining / 28) * 100)

    cycles.push({
      protocolId,
      protocolName,
      modalityId: mId,
      modalityName: modName,
      category: (m as any)?.category_name || m?.category || 'Peptides & Bioactives',
      startDate: earliestDateStr,
      cycleLengthDays,
      activeDaysCompleted,
      progressPct,
      currentPhase,
      phaseLabel,
      phaseColor,
      washoutDaysRemaining,
      isWashoutActive,
      receptorResensitizationPct,
      totalDosesScheduled: totalScheduled,
      totalDosesCompleted: completedDoses,
      adherencePct,
      reconstitutionDaysElapsed,
      reconstitutionFreshnessPct,
      vialDaysRemaining,
      halfLifeHours: pkConfig?.halfLifeHours || 4,
      halfLifeLabel: pkConfig?.label || '~4 hours',
      pkConfidence: pkConfig?.confidence || 'Moderate (Translational / Animal PK)',
      regulatoryStatus: pkConfig?.regulatoryStatus || 'Compounded Bioactive',
      evidenceLevel: (m as any)?.evidence_level || 'Moderate',
      pubmedUrl: (m as any)?.pubmed_url && (m as any).pubmed_url !== 'https://pubmed.ncbi.nlm.nih.gov/'
        ? (m as any).pubmed_url
        : resolvePubMedCitation(firstTask.modality_id, m?.display_name || m?.name || firstTask.protocol_step?.modality?.name || firstTask.loose_modality?.name).pubMedUrl,
      contraindications: pkConfig?.contraindications || ['Consult functional physician prior to initiation'],
      synergyNotes: pkConfig?.synergyNotes || ['Maintain consistent daily timing for optimal circadian alignment'],
      administrationTips: pkConfig?.administrationTips || ['Store reconstituted solution in refrigerated compartment (2°C–8°C)'],
      dosageSpec: firstTask.execution_details?.dosage || 'Standard clinical protocol dose',
      timingSlot: firstTask.timing_slot || 'morning'
    })
  })

  return cycles
}

/**
 * Computes 7-day Pharmacokinetic (PK) estimated relative concentration curves
 * based on actual dose logging timestamps and peptide elimination kinetics:
 * C(t) = C_0 * e^(-k_e * t)
 */
export function computeWeeklyPKCurves(
  tasks: DailyProtocolTask[],
  weekDays: Date[],
  cycle: PeptideCycleSummary
): PKDataPoint[] {
  const halfLifeHours = cycle.halfLifeHours || 4
  const ke = Math.LN2 / halfLifeHours // Elimination rate constant per hour

  return weekDays.map((dayDate, dayIdx) => {
    const dayStr = format(dayDate, 'yyyy-MM-dd')
    const dayLabel = format(dayDate, 'EEE')
    
    // Find task on this date matching canonical peptide key
    const dayTasks = tasks.filter(t => {
      if (t.scheduled_date !== dayStr) return false
      const m = t.loose_modality || t.protocol_step?.modality
      const rawId = t.modality_id || m?.id || t.id
      const rawName = m?.name || t.protocol_step?.modality?.name || ''
      return getCanonicalPeptideKey(rawId, rawName) === cycle.modalityId
    })
    const isCompleted = dayTasks.some(t => t.status === 'completed')
    const isScheduled = dayTasks.length > 0

    // Compute relative concentration index (0-100)
    // Dosing on day gives a peak spike of 100, decaying with exponential half life
    let relativeLevel = 0
    if (isCompleted || isScheduled) {
      relativeLevel = isCompleted ? 95 : 80
    } else {
      // Check prior day doses
      for (let lookback = 1; lookback <= 7; lookback++) {
        const priorDate = addDays(dayDate, -lookback)
        const priorStr = format(priorDate, 'yyyy-MM-dd')
        const priorTasks = tasks.filter(t => {
          if (t.scheduled_date !== priorStr) return false
          const m = t.loose_modality || t.protocol_step?.modality
          const rawId = t.modality_id || m?.id || t.id
          const rawName = m?.name || t.protocol_step?.modality?.name || ''
          return getCanonicalPeptideKey(rawId, rawName) === cycle.modalityId
        })
        if (priorTasks.some(t => t.status === 'completed' || t.status === 'pending')) {
          const hoursElapsed = lookback * 24
          const decayed = 90 * Math.exp(-ke * hoursElapsed)
          relativeLevel = Math.max(relativeLevel, Math.round(decayed))
        }
      }
    }

    return {
      date: dayStr,
      dayLabel,
      estimatedRelativeLevel: Math.min(100, Math.max(5, relativeLevel)),
      doseLoggedToday: isCompleted,
      doseAmountText: dayTasks[0]?.execution_details?.dosage || undefined,
      confidenceLabel: cycle.pkConfidence
    }
  })
}

/**
 * Correlates user lab biomarker measurements with the active peptide cycle dates
 * to calculate Pre-Cycle Baseline, Active Intra-Cycle, and Post-Cycle trajectories.
 */
export function correlatePeptideBiomarkers(
  cycle: PeptideCycleSummary,
  biomarkerRecords: BiomarkerMeasurementRecord[]
): PeptideBiomarkerCorrelation[] {
  const matchedPkKey = Object.keys(PEPTIDE_PK_REGISTRY).find(k => cycle.modalityId.includes(k.replace('_subq', '')))
  const pkConfig = matchedPkKey ? PEPTIDE_PK_REGISTRY[matchedPkKey] : null
  const targetBiomarkers = pkConfig?.relevantBiomarkerIds || [
    { id: 'igf1', name: 'IGF-1', relevance: 'Somatotropic growth factor index' },
    { id: 'hscrp', name: 'hs-CRP', relevance: 'Systemic inflammation resolution' },
    { id: 'glucose', name: 'Fasting Glucose', relevance: 'Glycemic and metabolic control' }
  ]

  const cycleStartDate = new Date(cycle.startDate + 'T00:00:00')
  const cycleEndDate = addDays(cycleStartDate, cycle.cycleLengthDays)

  return targetBiomarkers.map(target => {
    const matchingRecords = biomarkerRecords.filter(r => {
      const bId = (r.biomarker_id || '').toLowerCase()
      const rawName = (r.raw_name || '').toLowerCase()
      return bId.includes(target.id) || rawName.includes(target.name.toLowerCase())
    })

    // Sort ascending by test date
    matchingRecords.sort((a, b) => {
      const dateA = a.collection_date || (a as any).test_date || ''
      const dateB = b.collection_date || (b as any).test_date || ''
      return new Date(dateA).getTime() - new Date(dateB).getTime()
    })

    // 1. Pre-Cycle Baseline (strictly before cycle start)
    const preList = matchingRecords.filter(r => {
      const dStr = r.collection_date || (r as any).test_date || ''
      return dStr && new Date(dStr + 'T00:00:00') < cycleStartDate
    })
    const preRecord = preList.length > 0 ? preList[preList.length - 1] : null

    // 2. Intra-Cycle Active (on or after cycle start, up to cycle end date)
    const intraList = matchingRecords.filter(r => {
      const dStr = r.collection_date || (r as any).test_date || ''
      if (!dStr) return false
      const d = new Date(dStr + 'T00:00:00')
      return d >= cycleStartDate && d <= cycleEndDate
    })
    const intraRecord = intraList.length > 0 ? intraList[intraList.length - 1] : null

    // 3. Post-Cycle
    const postList = matchingRecords.filter(r => {
      const dStr = r.collection_date || (r as any).test_date || ''
      return dStr && new Date(dStr) > cycleEndDate
    })
    const postRecord = postList[0]

    let deltaPercent: number | null = null
    let direction: PeptideBiomarkerCorrelation['direction'] = 'insufficient_data'

    const preVal = preRecord ? (preRecord.normalized_value ?? preRecord.raw_value ?? 0) : 0
    const intraVal = intraRecord ? (intraRecord.normalized_value ?? intraRecord.raw_value ?? 0) : 0
    const postVal = postRecord ? (postRecord.normalized_value ?? postRecord.raw_value ?? 0) : 0

    if (preRecord && intraRecord && preVal > 0) {
      deltaPercent = Math.round(((intraVal - preVal) / preVal) * 100)
      if (Math.abs(deltaPercent) < 3) direction = 'neutral'
      else if (deltaPercent > 0) direction = 'elevated'
      else direction = 'reduced'
    }

    const unit = matchingRecords[0]?.normalized_unit || matchingRecords[0]?.raw_unit || 'ng/mL'

    return {
      biomarkerId: target.id,
      biomarkerName: target.name,
      unit,
      canonicalTarget: target.name,
      clinicalRelevance: target.relevance,
      preCycleBaseline: preRecord ? { value: preVal, date: preRecord.collection_date || (preRecord as any).test_date || '' } : null,
      intraCycleActive: intraRecord ? { value: intraVal, date: intraRecord.collection_date || (intraRecord as any).test_date || '' } : null,
      postCycle: postRecord ? { value: postVal, date: postRecord.collection_date || (postRecord as any).test_date || '' } : null,
      deltaPercent,
      direction
    }
  })
}
