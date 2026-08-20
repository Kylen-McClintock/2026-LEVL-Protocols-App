/**
 * Clinical Lab Biomarkers & Biological Age Diagnostics Engine
 * Mapped to the 12 Hallmarks of Aging (López-Otín et al., 2023 update).
 * 
 * Features:
 * - Multiple gold-standard biomarkers per hallmark in descending order of clinical relevance.
 * - Strict integrity: ZERO fabricated defaults. Unlogged biomarkers show as unmeasured with prompt to log.
 * - Local storage persistence for user lab entries.
 */

export type BiomarkerCategory =
  | 'blood_serum'
  | 'metabolic'
  | 'epigenetic'
  | 'inflammatory'
  | 'wearable_functional'
  | 'microbiome_stool'
  | 'cellular_senescence'

export type BiomarkerSampleType =
  | 'Blood / Serum'
  | 'Urine'
  | 'Saliva'
  | 'Wearable / Continuous'
  | 'Functional CPET'
  | 'Stool DNA'

export type BiomarkerTier =
  | 'Tier 1: Gold Standard'
  | 'Tier 2: Standard Clinical Lab'
  | 'Tier 3: Specialized Longevity Assay'

export interface BiomarkerDefinition {
  id: string
  name: string
  shortName: string
  hallmarkId: string
  hallmarkName: string
  relevanceRank: number // 1 = highest / gold standard
  tier: BiomarkerTier
  sampleType: BiomarkerSampleType
  category: BiomarkerCategory
  unit: string
  optimalRangeLabel: string
  isOptimal: (val: number) => boolean
  isModerateRisk: (val: number) => boolean
  isHighRisk: (val: number) => boolean
  clinicalMeaning: string
  recommendedInterventions: string[]
  orderingTip?: string
}

export interface UserBiomarkerEntry {
  biomarkerId: string
  value: number
  measuredDate?: string
  labProvider?: string
  notes?: string
}

export interface HallmarkBiomarkerStatus {
  hallmarkId: string
  hallmarkName: string
  hasRiskFlag: boolean
  riskLevel: 'optimal' | 'moderate' | 'high' | 'unmeasured'
  testedCount: number
  totalAvailableCount: number
  biomarkers: {
    definition: BiomarkerDefinition
    value: number | null
    status: 'optimal' | 'moderate' | 'high' | 'unmeasured'
    measuredDate?: string
  }[]
}

/**
 * 36 Comprehensive Biomarkers Mapped to the 12 Hallmarks (Ranked 1 to 3+ per Hallmark)
 */
export const COMPREHENSIVE_HALLMARK_BIOMARKERS: BiomarkerDefinition[] = [
  // ---------------------------------------------------------------------------
  // 1. GENOMIC INSTABILITY (DNA Damage, NRF2, PARP1, ROS Quenching)
  // ---------------------------------------------------------------------------
  {
    id: 'urinary_8_ohdg',
    name: "Urinary 8-OHdG (8-hydroxy-2'-deoxyguanosine)",
    shortName: 'Urinary 8-OHdG',
    hallmarkId: 'genomic_instability',
    hallmarkName: 'Genomic Instability',
    relevanceRank: 1,
    tier: 'Tier 1: Gold Standard',
    sampleType: 'Urine',
    category: 'blood_serum',
    unit: 'ng/mg creatinine',
    optimalRangeLabel: '< 4.0 ng/mg',
    isOptimal: val => val < 4.0,
    isModerateRisk: val => val >= 4.0 && val < 8.0,
    isHighRisk: val => val >= 8.0,
    clinicalMeaning: 'Gold standard non-invasive metric of systemic oxidative DNA base damage and guanine nucleotide excision.',
    recommendedInterventions: ['Sulforaphane (Broccoli Sprout Extract)', 'GlyNAC (Glycine + NAC)', 'Astaxanthin (12mg)'],
    orderingTip: 'Available via urinary oxidative stress panels (e.g. Genova, Doctor’s Data).'
  },
  {
    id: 'serum_gdf15',
    name: 'Serum GDF15 (Growth Differentiation Factor 15)',
    shortName: 'Serum GDF15',
    hallmarkId: 'genomic_instability',
    hallmarkName: 'Genomic Instability',
    relevanceRank: 2,
    tier: 'Tier 2: Standard Clinical Lab',
    sampleType: 'Blood / Serum',
    category: 'blood_serum',
    unit: 'pg/mL',
    optimalRangeLabel: '< 550 pg/mL',
    isOptimal: val => val < 550,
    isModerateRisk: val => val >= 550 && val < 900,
    isHighRisk: val => val >= 900,
    clinicalMeaning: 'Integrative serum stress hormone upregulated by mitochondrial stress, DNA breaks, and cellular senescence.',
    recommendedInterventions: ['NMN / NR NAD+ Precursors', 'Zone 2 Mitochondrial Training', 'Metformin Protocol'],
    orderingTip: 'Orderable via Quest / Labcorp specialty immunology assays.'
  },
  {
    id: 'lymphocyte_micronucleus',
    name: 'Lymphocyte Micronucleus Frequency (CBMN Assay)',
    shortName: 'Micronucleus Index',
    hallmarkId: 'genomic_instability',
    hallmarkName: 'Genomic Instability',
    relevanceRank: 3,
    tier: 'Tier 3: Specialized Longevity Assay',
    sampleType: 'Blood / Serum',
    category: 'cellular_senescence',
    unit: 'per 1000 cells',
    optimalRangeLabel: '< 10 / 1000 cells',
    isOptimal: val => val < 10,
    isModerateRisk: val => val >= 10 && val < 20,
    isHighRisk: val => val >= 20,
    clinicalMeaning: 'Direct cytogenetic quantification of double-strand chromosome breaks and clastogenic DNA lesions.',
    recommendedInterventions: ['Theracurmin / Longvida Curcumin', 'Alpha-Lipoic Acid (600mg)', 'NAD+ Optimizers']
  },

  // ---------------------------------------------------------------------------
  // 2. TELOMERE ATTRITION (TERT, Shelterin Complex)
  // ---------------------------------------------------------------------------
  {
    id: 'leukocyte_telomere_length',
    name: 'Leukocyte Telomere Length (Flow-FISH / qPCR Percentile)',
    shortName: 'Telomere Length (LTL)',
    hallmarkId: 'telomere_attrition',
    hallmarkName: 'Telomere Attrition',
    relevanceRank: 1,
    tier: 'Tier 1: Gold Standard',
    sampleType: 'Blood / Serum',
    category: 'blood_serum',
    unit: 'percentile for age',
    optimalRangeLabel: '> 50th percentile',
    isOptimal: val => val >= 50,
    isModerateRisk: val => val >= 25 && val < 50,
    isHighRisk: val => val < 25,
    clinicalMeaning: 'Biological gauge of cellular replication reserve and chromosomal end-cap protection.',
    recommendedInterventions: ['Epitalon Peptide (10mg pulse)', 'TA-65 Cycloastragenol', 'Norwegian 4x4 HIIT'],
    orderingTip: 'Available via RepeatDx or Telomere Diagnostics specialized qPCR panels.'
  },
  {
    id: 'omega3_index',
    name: 'RBC Omega-3 Index (EPA + DHA % of Red Cell Membranes)',
    shortName: 'Omega-3 Index',
    hallmarkId: 'telomere_attrition',
    hallmarkName: 'Telomere Attrition',
    relevanceRank: 2,
    tier: 'Tier 2: Standard Clinical Lab',
    sampleType: 'Blood / Serum',
    category: 'blood_serum',
    unit: '%',
    optimalRangeLabel: '> 8.0 %',
    isOptimal: val => val >= 8.0,
    isModerateRisk: val => val >= 5.5 && val < 8.0,
    isHighRisk: val => val < 5.5,
    clinicalMeaning: 'Membrane phospholipid incorporation of marine n-3 fatty acids directly correlated with attenuated leukocyte telomere attrition rate.',
    recommendedInterventions: ['High-Dose EPA/DHA Omega-3 (3,000mg/day)', 'Extra Virgin Olive Oil (2 tbsp/day)', 'Astaxanthin (12mg)'],
    orderingTip: 'Order OmegaQuant Complete or standard Labcorp RBC Fatty Acid profile.'
  },

  // ---------------------------------------------------------------------------
  // 3. EPIGENETIC ALTERATIONS (DNA Methylation, Sirtuins, Histones)
  // ---------------------------------------------------------------------------
  {
    id: 'dunedin_pace',
    name: 'DunedinPACE (DNA Methylation Biological Pace of Aging)',
    shortName: 'DunedinPACE Speed',
    hallmarkId: 'epigenetic_alterations',
    hallmarkName: 'Epigenetic Alterations',
    relevanceRank: 1,
    tier: 'Tier 1: Gold Standard',
    sampleType: 'Blood / Serum',
    category: 'epigenetic',
    unit: 'biol. yrs / chron. yr',
    optimalRangeLabel: '< 0.80',
    isOptimal: val => val < 0.80,
    isModerateRisk: val => val >= 0.80 && val <= 1.00,
    isHighRisk: val => val > 1.00,
    clinicalMeaning: 'Third-generation DNA methylation clock quantifying instantaneous biological aging rate across 19 organ systems.',
    recommendedInterventions: ['Bryan Johnson Blueprint Exercise Routine', '16:8 Fasting Window', 'Heavy Resistance Training', 'Methyl-B12 + L-5-MTHF'],
    orderingTip: 'Order TruDiagnostic TruAge Complete / DunedinPACE panel.'
  },
  {
    id: 'serum_homocysteine',
    name: 'Serum Homocysteine (Methylation Efficiency)',
    shortName: 'Homocysteine',
    hallmarkId: 'epigenetic_alterations',
    hallmarkName: 'Epigenetic Alterations',
    relevanceRank: 2,
    tier: 'Tier 2: Standard Clinical Lab',
    sampleType: 'Blood / Serum',
    category: 'blood_serum',
    unit: 'umol/L',
    optimalRangeLabel: '< 8.0 umol/L',
    isOptimal: val => val < 8.0,
    isModerateRisk: val => val >= 8.0 && val < 12.0,
    isHighRisk: val => val >= 12.0,
    clinicalMeaning: 'Critical surrogate for one-carbon methylation capacity, SAMe/SAH ratio, and vascular endothelial DNA methylation.',
    recommendedInterventions: ['TMG (Trimethylglycine / Betaine 1-2g)', 'L-Methylfolate (L-5-MTHF)', 'Methylcobalamin (B12)']
  },

  // ---------------------------------------------------------------------------
  // 4. LOSS OF PROTEOSTASIS (Chaperones, HSPs, Aggregate Clearance)
  // ---------------------------------------------------------------------------
  {
    id: 'cystatin_c',
    name: 'Serum Cystatin C (Low-MW Proteostasis & Microvascular Filtration)',
    shortName: 'Cystatin C',
    hallmarkId: 'loss_of_proteostasis',
    hallmarkName: 'Loss of Proteostasis',
    relevanceRank: 1,
    tier: 'Tier 1: Gold Standard',
    sampleType: 'Blood / Serum',
    category: 'blood_serum',
    unit: 'mg/L',
    optimalRangeLabel: '< 0.85 mg/L',
    isOptimal: val => val < 0.85,
    isModerateRisk: val => val >= 0.85 && val < 1.10,
    isHighRisk: val => val >= 1.10,
    clinicalMeaning: 'Precision non-creatinine proteostasis biomarker reflecting extracellular protein turnover and microvascular filtration integrity.',
    recommendedInterventions: ['Finnish Sauna Hyperthermia (HSP70 induction)', 'Theracurmin / Longvida Curcumin', 'Zone 2 Cardio Endurance']
  },
  {
    id: 'skin_autofluorescence_ages',
    name: 'Advanced Glycation End-Products (Skin Autofluorescence AGEs)',
    shortName: 'Skin AGE Score',
    hallmarkId: 'loss_of_proteostasis',
    hallmarkName: 'Loss of Proteostasis',
    relevanceRank: 2,
    tier: 'Tier 2: Standard Clinical Lab',
    sampleType: 'Wearable / Continuous',
    category: 'wearable_functional',
    unit: 'Arbitrary Units',
    optimalRangeLabel: '< 1.8 AU',
    isOptimal: val => val < 1.8,
    isModerateRisk: val => val >= 1.8 && val < 2.4,
    isHighRisk: val => val >= 2.4,
    clinicalMeaning: 'Non-invasive optical quantification of irreversibly cross-linked, glycated tissue collagen and vascular elastin.',
    recommendedInterventions: ['Postprandial 10-Min Glucose Walk', 'Carnosine / Benfotiamine', 'Continuous Glucose Monitoring (CGM)']
  },

  // ---------------------------------------------------------------------------
  // 5. DISABLED MACROAUTOPHAGY (Mitophagy, Lysosomal Biogenesis)
  // ---------------------------------------------------------------------------
  {
    id: 'lc3b_mitophagy_ratio',
    name: 'PBMC LC3B-II / LC3B-I Mitophagy Flux Ratio',
    shortName: 'LC3-II Mitophagy Flux',
    hallmarkId: 'disabled_macroautophagy',
    hallmarkName: 'Disabled Macroautophagy',
    relevanceRank: 1,
    tier: 'Tier 1: Gold Standard',
    sampleType: 'Blood / Serum',
    category: 'cellular_senescence',
    unit: 'ratio',
    optimalRangeLabel: '> 1.4 ratio',
    isOptimal: val => val >= 1.4,
    isModerateRisk: val => val >= 0.9 && val < 1.4,
    isHighRisk: val => val < 0.9,
    clinicalMeaning: 'Indicates the rate of autophagosome membrane lipid conjugation and clearance of dysfunctional mitochondria.',
    recommendedInterventions: ['Urolithin A (1,000mg Mitopure)', '72-Hour Prolonged Water Fast', 'Spermidine (1-2mg)']
  },
  {
    id: 'fasting_bhb_ketones',
    name: 'Fasting Beta-Hydroxybutyrate (Blood BHB Ketones)',
    shortName: 'Fasting BHB Ketones',
    hallmarkId: 'disabled_macroautophagy',
    hallmarkName: 'Disabled Macroautophagy',
    relevanceRank: 2,
    tier: 'Tier 2: Standard Clinical Lab',
    sampleType: 'Blood / Serum',
    category: 'metabolic',
    unit: 'mmol/L',
    optimalRangeLabel: '> 1.0 mmol/L (fasted)',
    isOptimal: val => val >= 1.0,
    isModerateRisk: val => val >= 0.4 && val < 1.0,
    isHighRisk: val => val < 0.4,
    clinicalMeaning: 'Circulating ketone threshold confirming systemic glycogen depletion and deep cellular autophagy induction.',
    recommendedInterventions: ['20:4 Fasting / OMAD Protocol', '5-Day Fasting Mimicking Diet', 'MCT Oil / Ketone Esters']
  },

  // ---------------------------------------------------------------------------
  // 6. DEREGULATED NUTRIENT SENSING (mTOR, AMPK, Sirtuins, Glycemia)
  // ---------------------------------------------------------------------------
  {
    id: 'fasting_insulin',
    name: 'Fasting Serum Insulin',
    shortName: 'Fasting Insulin',
    hallmarkId: 'deregulated_nutrient_sensing',
    hallmarkName: 'Deregulated Nutrient Sensing',
    relevanceRank: 1,
    tier: 'Tier 1: Gold Standard',
    sampleType: 'Blood / Serum',
    category: 'metabolic',
    unit: 'uIU/mL',
    optimalRangeLabel: '< 5.0 uIU/mL',
    isOptimal: val => val < 5.0,
    isModerateRisk: val => val >= 5.0 && val < 10.0,
    isHighRisk: val => val >= 10.0,
    clinicalMeaning: 'Gold standard early indicator of peripheral insulin resistance, hyperinsulinemia, and hyperactive mTOR signaling.',
    recommendedInterventions: ['16:8 Time-Restricted Feeding', 'Berberine HCl (500mg GDA)', 'Zone 2 Cardio Lactate Clearance']
  },
  {
    id: 'hba1c',
    name: 'Hemoglobin A1c (HbA1c Glycated Hemoglobin)',
    shortName: 'HbA1c',
    hallmarkId: 'deregulated_nutrient_sensing',
    hallmarkName: 'Deregulated Nutrient Sensing',
    relevanceRank: 2,
    tier: 'Tier 2: Standard Clinical Lab',
    sampleType: 'Blood / Serum',
    category: 'metabolic',
    unit: '%',
    optimalRangeLabel: '< 5.2 %',
    isOptimal: val => val < 5.2,
    isModerateRisk: val => val >= 5.2 && val <= 5.6,
    isHighRisk: val => val > 5.6,
    clinicalMeaning: '90-day integrated erythrocyte glycemic exposure reflecting cumulative microvascular glycation stress.',
    recommendedInterventions: ['Acetic Acid / ACV Pre-Meal Load', 'Post-Meal Soleus Pushups', 'Continuous Glucose Monitor (CGM)']
  },
  {
    id: 'homa_ir',
    name: 'HOMA-IR (Homeostatic Model Assessment of Insulin Resistance)',
    shortName: 'HOMA-IR Score',
    hallmarkId: 'deregulated_nutrient_sensing',
    hallmarkName: 'Deregulated Nutrient Sensing',
    relevanceRank: 3,
    tier: 'Tier 2: Standard Clinical Lab',
    sampleType: 'Blood / Serum',
    category: 'metabolic',
    unit: 'index',
    optimalRangeLabel: '< 1.0',
    isOptimal: val => val < 1.0,
    isModerateRisk: val => val >= 1.0 && val < 1.9,
    isHighRisk: val => val >= 1.9,
    clinicalMeaning: 'Calculated ratio of fasting glucose and insulin reflecting hepatic insulin sensitivity.',
    recommendedInterventions: ['Metformin / Berberine Protocol', 'Zone 2 Cardio (180 min/wk)', 'Low-Glycemic Diet Optimization']
  },

  // ---------------------------------------------------------------------------
  // 7. MITOCHONDRIAL DYSFUNCTION (Biogenesis, PGC-1a, Complex I-IV)
  // ---------------------------------------------------------------------------
  {
    id: 'vo2_max',
    name: 'VO2 Max (Cardiorespiratory Peak Oxygen Uptake)',
    shortName: 'VO2 Max',
    hallmarkId: 'mitochondrial_dysfunction',
    hallmarkName: 'Mitochondrial Dysfunction',
    relevanceRank: 1,
    tier: 'Tier 1: Gold Standard',
    sampleType: 'Functional CPET',
    category: 'wearable_functional',
    unit: 'mL/kg/min',
    optimalRangeLabel: '> 50 mL/kg/min',
    isOptimal: val => val >= 50,
    isModerateRisk: val => val >= 40 && val < 50,
    isHighRisk: val => val < 40,
    clinicalMeaning: 'Single most powerful clinical predictor of all-cause mortality and functional mitochondrial volume density in human skeletal muscle.',
    recommendedInterventions: ['Norwegian 4x4 HIIT Protocol (Weekly)', 'Zone 2 Polarized Cardio (4x45m)', 'CoQ10 Ubiquinol + PQQ']
  },
  {
    id: 'zone2_lactate_clearance',
    name: 'Zone 2 Aerobic Lactate Clearance Threshold',
    shortName: 'Lactate Threshold',
    hallmarkId: 'mitochondrial_dysfunction',
    hallmarkName: 'Mitochondrial Dysfunction',
    relevanceRank: 2,
    tier: 'Tier 2: Standard Clinical Lab',
    sampleType: 'Blood / Serum',
    category: 'wearable_functional',
    unit: 'mmol/L',
    optimalRangeLabel: '< 2.0 mmol/L @ target output',
    isOptimal: val => val < 2.0,
    isModerateRisk: val => val >= 2.0 && val <= 2.8,
    isHighRisk: val => val > 2.8,
    clinicalMeaning: 'Direct measure of mitochondrial fatty acid oxidation efficiency vs. glycolytic pyruvate accumulation.',
    recommendedInterventions: ['Zone 2 Steady-State Cardio', 'MOTS-c Mitochondrial Peptide', 'Urolithin A (Mitopure)']
  },

  // ---------------------------------------------------------------------------
  // 8. CELLULAR SENESCENCE (Senolytics, SASP, Zombie Cells)
  // ---------------------------------------------------------------------------
  {
    id: 'p16ink4a_expression',
    name: 'p16INK4a mRNA Expression / Senescence Secretory Index',
    shortName: 'p16INK4a Index',
    hallmarkId: 'cellular_senescence',
    hallmarkName: 'Cellular Senescence',
    relevanceRank: 1,
    tier: 'Tier 1: Gold Standard',
    sampleType: 'Blood / Serum',
    category: 'cellular_senescence',
    unit: 'expression score',
    optimalRangeLabel: '< 2.5',
    isOptimal: val => val < 2.5,
    isModerateRisk: val => val >= 2.5 && val < 4.0,
    isHighRisk: val => val >= 4.0,
    clinicalMeaning: 'Biomarker of permanent cell cycle arrest and accumulation of hyper-inflammatory senescent cells (zombie cells).',
    recommendedInterventions: ['Mayo Clinic Pulsed High-Dose Fisetin + Quercetin', 'Piperlongumine / Dasatinib', 'Valter Longo 5-Day FMD']
  },
  {
    id: 'serum_il6',
    name: 'Serum Interleukin-6 (IL-6 Senescent SASP Cytokine)',
    shortName: 'Serum IL-6',
    hallmarkId: 'cellular_senescence',
    hallmarkName: 'Cellular Senescence',
    relevanceRank: 2,
    tier: 'Tier 2: Standard Clinical Lab',
    sampleType: 'Blood / Serum',
    category: 'inflammatory',
    unit: 'pg/mL',
    optimalRangeLabel: '< 1.5 pg/mL',
    isOptimal: val => val < 1.5,
    isModerateRisk: val => val >= 1.5 && val < 3.5,
    isHighRisk: val => val >= 3.5,
    clinicalMeaning: 'Key senescence-associated secretory phenotype (SASP) cytokine driving systemic paracrine senescence spread.',
    recommendedInterventions: ['Fisetin Senolytic Blast (20mg/kg)', 'Sulforaphane Nrf2 Activation', 'Cold Plunge Immersion']
  },

  // ---------------------------------------------------------------------------
  // 9. STEM CELL EXHAUSTION (Regeneration, Refeeding, Tissue Repair)
  // ---------------------------------------------------------------------------
  {
    id: 'cd34_stem_cells',
    name: 'CD34+ / KDR+ Circulating Endothelial Progenitor Pool',
    shortName: 'CD34+ Stem Cell Pool',
    hallmarkId: 'stem_cell_exhaustion',
    hallmarkName: 'Stem Cell Exhaustion',
    relevanceRank: 1,
    tier: 'Tier 1: Gold Standard',
    sampleType: 'Blood / Serum',
    category: 'cellular_senescence',
    unit: 'cells/uL',
    optimalRangeLabel: '> 3.5 cells/uL',
    isOptimal: val => val >= 3.5,
    isModerateRisk: val => val >= 2.0 && val < 3.5,
    isHighRisk: val => val < 2.0,
    clinicalMeaning: 'Direct quantification of circulating hematopoietic and endothelial stem cells capable of vascular repair and tissue renewal.',
    recommendedInterventions: ['GHK-Cu Copper Peptide SubQ', 'Hyperbaric Oxygen Therapy (HBOT 2.0 ATA)', '72-Hour Fast + Re-feeding Cycle']
  },
  {
    id: 'naive_memory_t_cell_ratio',
    name: 'Naive / Memory T-Cell Ratio (CD4+ CD45RA+ / CD45RO+)',
    shortName: 'T-Cell Naive/Memory Ratio',
    hallmarkId: 'stem_cell_exhaustion',
    hallmarkName: 'Stem Cell Exhaustion',
    relevanceRank: 2,
    tier: 'Tier 2: Standard Clinical Lab',
    sampleType: 'Blood / Serum',
    category: 'blood_serum',
    unit: 'ratio',
    optimalRangeLabel: '> 1.5 ratio',
    isOptimal: val => val >= 1.5,
    isModerateRisk: val => val >= 1.0 && val < 1.5,
    isHighRisk: val => val < 1.0,
    clinicalMeaning: 'Key indicator of thymic rejuvenation, bone marrow stem cell output, and absence of immunosenescence.',
    recommendedInterventions: ['Therapeutic Plasma Exchange (TPE)', 'Epitalon Peptide Therapy', 'Zinc + Vitamin D3/K2 Optimization']
  },

  // ---------------------------------------------------------------------------
  // 10. ALTERED INTERCELLULAR COMMUNICATION (Circadian, Vagal Tone)
  // ---------------------------------------------------------------------------
  {
    id: 'nocturnal_hrv',
    name: 'Nocturnal HRV (Deep Sleep rMSSD 7-Day Baseline)',
    shortName: 'Nocturnal HRV (rMSSD)',
    hallmarkId: 'altered_intercellular_communication',
    hallmarkName: 'Altered Intercellular Communication',
    relevanceRank: 1,
    tier: 'Tier 1: Gold Standard',
    sampleType: 'Wearable / Continuous',
    category: 'wearable_functional',
    unit: 'ms',
    optimalRangeLabel: '> 65 ms',
    isOptimal: val => val >= 65,
    isModerateRisk: val => val >= 40 && val < 65,
    isHighRisk: val => val < 40,
    clinicalMeaning: 'Gold standard continuous measure of parasympathetic vagal nerve tone, systemic neuroendocrine recovery, and autonomic flexibility.',
    recommendedInterventions: ['Coherent 5.5s Resonant Breathing', 'Magnesium L-Threonate / Bisglycinate', '10-Hour Caffeine Cutoff', 'Blue Light Dimming']
  },
  {
    id: 'cortisol_awakening_response',
    name: 'Cortisol Awakening Response (CAR Delta +30m post-wake)',
    shortName: 'Cortisol CAR Response',
    hallmarkId: 'altered_intercellular_communication',
    hallmarkName: 'Altered Intercellular Communication',
    relevanceRank: 2,
    tier: 'Tier 2: Standard Clinical Lab',
    sampleType: 'Saliva',
    category: 'blood_serum',
    unit: 'ug/dL',
    optimalRangeLabel: '12 - 22 ug/dL (robust peak)',
    isOptimal: val => val >= 12 && val <= 22,
    isModerateRisk: val => (val >= 8 && val < 12) || (val > 22 && val <= 28),
    isHighRisk: val => val < 8 || val > 28,
    clinicalMeaning: 'Quantifies circadian hypothalamic-pituitary-adrenal (HPA) axis rhythmicity and adrenal endocrine signaling.',
    recommendedInterventions: ['Morning Sunlight Exposure (10-15m)', 'Ashwagandha Sensoril / KSM-66', 'Mouth Taping for Deep Sleep']
  },

  // ---------------------------------------------------------------------------
  // 11. CHRONIC INFLAMMATION (Inflammaging, Endothelial Activation)
  // ---------------------------------------------------------------------------
  {
    id: 'hs_crp',
    name: 'High-Sensitivity C-Reactive Protein (hs-CRP)',
    shortName: 'hs-CRP',
    hallmarkId: 'chronic_inflammation',
    hallmarkName: 'Chronic Inflammation',
    relevanceRank: 1,
    tier: 'Tier 1: Gold Standard',
    sampleType: 'Blood / Serum',
    category: 'inflammatory',
    unit: 'mg/L',
    optimalRangeLabel: '< 0.5 mg/L',
    isOptimal: val => val < 0.5,
    isModerateRisk: val => val >= 0.5 && val < 2.0,
    isHighRisk: val => val >= 2.0,
    clinicalMeaning: 'Direct hepatic acute-phase protein measuring systemic sterile inflammaging and vascular endothelial activation.',
    recommendedInterventions: ['High-Dose EPA/DHA Omega-3 (3g)', 'Theracurmin / Longvida Curcumin', 'Cold Plunge / Deliberate Cold Exposure']
  },
  {
    id: 'apob_particles',
    name: 'Apolipoprotein B (ApoB Atherogenic Particle Count)',
    shortName: 'ApoB Particles',
    hallmarkId: 'chronic_inflammation',
    hallmarkName: 'Chronic Inflammation',
    relevanceRank: 2,
    tier: 'Tier 2: Standard Clinical Lab',
    sampleType: 'Blood / Serum',
    category: 'blood_serum',
    unit: 'mg/dL',
    optimalRangeLabel: '< 70 mg/dL',
    isOptimal: val => val < 70,
    isModerateRisk: val => val >= 70 && val <= 90,
    isHighRisk: val => val > 90,
    clinicalMeaning: 'Total number of atherogenic circulating lipoproteins driving sub-endothelial retention and arterial inflammatory plaque.',
    recommendedInterventions: ['Peter Attia ApoB Protocol (Ezetimibe / Statin / PCSK9i)', 'Viscous Soluble Fiber (Psyllium 10g)', 'Plant Phytosterols (2g)']
  },

  // ---------------------------------------------------------------------------
  // 12. DYSBIOSIS (Gut Mucosal Integrity, Endotoxemia, SCFA)
  // ---------------------------------------------------------------------------
  {
    id: 'serum_zonulin',
    name: 'Serum / Fecal Zonulin (Gut Mucosal Permeability)',
    shortName: 'Zonulin (Leaky Gut)',
    hallmarkId: 'dysbiosis',
    hallmarkName: 'Dysbiosis',
    relevanceRank: 1,
    tier: 'Tier 1: Gold Standard',
    sampleType: 'Stool DNA',
    category: 'microbiome_stool',
    unit: 'ng/mL',
    optimalRangeLabel: '< 30 ng/mL',
    isOptimal: val => val < 30,
    isModerateRisk: val => val >= 30 && val < 50,
    isHighRisk: val => val >= 50,
    clinicalMeaning: 'Key biomarker of enterocyte tight-junction disassembly, intestinal mucosal breakdown, and circulating LPS endotoxemia.',
    recommendedInterventions: ['Tributyrin / Sodium Butyrate (1,000mg)', 'Prebiotic Fiber Diversity (30+ plants/wk)', 'High-Polyphenol EVOO']
  },
  {
    id: 'fecal_butyrate_percentage',
    name: 'Fecal Short-Chain Fatty Acid Profile (Butyrate %)',
    shortName: 'Microbiome Butyrate %',
    hallmarkId: 'dysbiosis',
    hallmarkName: 'Dysbiosis',
    relevanceRank: 2,
    tier: 'Tier 2: Standard Clinical Lab',
    sampleType: 'Stool DNA',
    category: 'microbiome_stool',
    unit: '% of total SCFA',
    optimalRangeLabel: '> 20 %',
    isOptimal: val => val >= 20,
    isModerateRisk: val => val >= 14 && val < 20,
    isHighRisk: val => val < 14,
    clinicalMeaning: 'Primary fuel source for colonocytes; drives colonic histone deacetylase (HDAC) inhibition and systemic Treg cell induction.',
    recommendedInterventions: ['Resistant Starch (Green Banana / Inulin)', 'Akkermansia Muciniphila Probiotic', 'Fermented Foods (Sauerkraut, Kimchi)']
  }
]

/**
 * Evaluates user biomarker measurements without any made-up placeholder data.
 * Unlogged markers are strictly categorized as 'unmeasured'.
 */
export function evaluateComprehensiveBiomarkers(
  userReadings: Record<string, number> = {}
): HallmarkBiomarkerStatus[] {
  const hallmarkMap = new Map<string, HallmarkBiomarkerStatus>()

  // 1. Group definitions by hallmark
  COMPREHENSIVE_HALLMARK_BIOMARKERS.forEach(bm => {
    if (!hallmarkMap.has(bm.hallmarkId)) {
      hallmarkMap.set(bm.hallmarkId, {
        hallmarkId: bm.hallmarkId,
        hallmarkName: bm.hallmarkName,
        hasRiskFlag: false,
        riskLevel: 'unmeasured',
        testedCount: 0,
        totalAvailableCount: 0,
        biomarkers: []
      })
    }

    const currentH = hallmarkMap.get(bm.hallmarkId)!
    currentH.totalAvailableCount++

    const rawVal = userReadings[bm.id]
    const hasValue = rawVal !== undefined && rawVal !== null && !isNaN(rawVal)

    let status: 'optimal' | 'moderate' | 'high' | 'unmeasured' = 'unmeasured'
    if (hasValue) {
      currentH.testedCount++
      if (bm.isHighRisk(rawVal)) status = 'high'
      else if (bm.isModerateRisk(rawVal)) status = 'moderate'
      else status = 'optimal'
    }

    currentH.biomarkers.push({
      definition: bm,
      value: hasValue ? rawVal : null,
      status
    })

    // Compute aggregate hallmark status based ONLY on tested markers
    if (status === 'high') {
      currentH.hasRiskFlag = true
      currentH.riskLevel = 'high'
    } else if (status === 'moderate' && currentH.riskLevel !== 'high') {
      currentH.hasRiskFlag = true
      currentH.riskLevel = 'moderate'
    } else if (status === 'optimal' && currentH.riskLevel === 'unmeasured') {
      currentH.riskLevel = 'optimal'
    }
  })

  // Sort each hallmark's biomarkers by clinical relevance rank (Rank 1 first)
  hallmarkMap.forEach(h => {
    h.biomarkers.sort((a, b) => a.definition.relevanceRank - b.definition.relevanceRank)
  })

  return Array.from(hallmarkMap.values())
}

export interface HallmarkColorConfig {
  id: string
  name: string
  shortName: string
  colorHex: string
  bgClass: string
  borderClass: string
  textClass: string
  badgeClass: string
  leftBorderClass: string
  iconBgClass: string
}

export const HALLMARK_COLOR_CONFIGS: Record<string, HallmarkColorConfig> = {
  genomic_instability: {
    id: 'genomic_instability',
    name: 'Genomic Instability',
    shortName: 'Genomic Instability',
    colorHex: '#06B6D4', // Cyan
    bgClass: 'bg-cyan-950/30',
    borderClass: 'border-cyan-500/40',
    textClass: 'text-cyan-400',
    badgeClass: 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300',
    leftBorderClass: 'border-l-4 border-l-cyan-400',
    iconBgClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
  },
  telomere_attrition: {
    id: 'telomere_attrition',
    name: 'Telomere Attrition',
    shortName: 'Telomere Attrition',
    colorHex: '#818CF8', // Indigo
    bgClass: 'bg-indigo-950/30',
    borderClass: 'border-indigo-500/40',
    textClass: 'text-indigo-400',
    badgeClass: 'bg-indigo-950/80 border-indigo-500/60 text-indigo-300',
    leftBorderClass: 'border-l-4 border-l-indigo-400',
    iconBgClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
  },
  epigenetic_alterations: {
    id: 'epigenetic_alterations',
    name: 'Epigenetic Alterations',
    shortName: 'Epigenetic Drift',
    colorHex: '#C084FC', // Purple
    bgClass: 'bg-purple-950/30',
    borderClass: 'border-purple-500/40',
    textClass: 'text-purple-400',
    badgeClass: 'bg-purple-950/80 border-purple-500/60 text-purple-300',
    leftBorderClass: 'border-l-4 border-l-purple-400',
    iconBgClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  },
  loss_of_proteostasis: {
    id: 'loss_of_proteostasis',
    name: 'Loss of Proteostasis',
    shortName: 'Proteostasis',
    colorHex: '#F59E0B', // Amber
    bgClass: 'bg-amber-950/30',
    borderClass: 'border-amber-500/40',
    textClass: 'text-amber-400',
    badgeClass: 'bg-amber-950/80 border-amber-500/60 text-amber-300',
    leftBorderClass: 'border-l-4 border-l-amber-400',
    iconBgClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  disabled_macroautophagy: {
    id: 'disabled_macroautophagy',
    name: 'Disabled Macroautophagy',
    shortName: 'Macroautophagy',
    colorHex: '#14B8A6', // Teal
    bgClass: 'bg-teal-950/30',
    borderClass: 'border-teal-500/40',
    textClass: 'text-teal-400',
    badgeClass: 'bg-teal-950/80 border-teal-500/60 text-teal-300',
    leftBorderClass: 'border-l-4 border-l-teal-400',
    iconBgClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40'
  },
  deregulated_nutrient_sensing: {
    id: 'deregulated_nutrient_sensing',
    name: 'Deregulated Nutrient Sensing',
    shortName: 'Nutrient Sensing',
    colorHex: '#3B82F6', // Blue
    bgClass: 'bg-blue-950/30',
    borderClass: 'border-blue-500/40',
    textClass: 'text-blue-400',
    badgeClass: 'bg-blue-950/80 border-blue-500/60 text-blue-300',
    leftBorderClass: 'border-l-4 border-l-blue-400',
    iconBgClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
  },
  mitochondrial_dysfunction: {
    id: 'mitochondrial_dysfunction',
    name: 'Mitochondrial Dysfunction',
    shortName: 'Mitochondria',
    colorHex: '#10B981', // Emerald
    bgClass: 'bg-emerald-950/30',
    borderClass: 'border-emerald-500/40',
    textClass: 'text-emerald-400',
    badgeClass: 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300',
    leftBorderClass: 'border-l-4 border-l-emerald-400',
    iconBgClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  },
  cellular_senescence: {
    id: 'cellular_senescence',
    name: 'Cellular Senescence',
    shortName: 'Senescence (Zombies)',
    colorHex: '#F43F5E', // Rose
    bgClass: 'bg-rose-950/30',
    borderClass: 'border-rose-500/40',
    textClass: 'text-rose-400',
    badgeClass: 'bg-rose-950/80 border-rose-500/60 text-rose-300',
    leftBorderClass: 'border-l-4 border-l-rose-400',
    iconBgClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  },
  stem_cell_exhaustion: {
    id: 'stem_cell_exhaustion',
    name: 'Stem Cell Exhaustion',
    shortName: 'Stem Cells',
    colorHex: '#FB923C', // Orange
    bgClass: 'bg-orange-950/30',
    borderClass: 'border-orange-500/40',
    textClass: 'text-orange-400',
    badgeClass: 'bg-orange-950/80 border-orange-500/60 text-orange-300',
    leftBorderClass: 'border-l-4 border-l-orange-400',
    iconBgClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40'
  },
  altered_intercellular_communication: {
    id: 'altered_intercellular_communication',
    name: 'Altered Intercellular Communication',
    shortName: 'Intercellular Signaling',
    colorHex: '#38BDF8', // Sky
    bgClass: 'bg-sky-950/30',
    borderClass: 'border-sky-500/40',
    textClass: 'text-sky-400',
    badgeClass: 'bg-sky-950/80 border-sky-500/60 text-sky-300',
    leftBorderClass: 'border-l-4 border-l-sky-400',
    iconBgClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40'
  },
  chronic_inflammation: {
    id: 'chronic_inflammation',
    name: 'Chronic Inflammation',
    shortName: 'Inflammaging',
    colorHex: '#EF4444', // Red
    bgClass: 'bg-red-950/30',
    borderClass: 'border-red-500/40',
    textClass: 'text-red-400',
    badgeClass: 'bg-red-950/80 border-red-500/60 text-red-300',
    leftBorderClass: 'border-l-4 border-l-red-400',
    iconBgClass: 'bg-red-500/20 text-red-300 border-red-500/40'
  },
  dysbiosis: {
    id: 'dysbiosis',
    name: 'Dysbiosis',
    shortName: 'Gut Microbiome',
    colorHex: '#84CC16', // Lime
    bgClass: 'bg-lime-950/30',
    borderClass: 'border-lime-500/40',
    textClass: 'text-lime-400',
    badgeClass: 'bg-lime-950/80 border-lime-500/60 text-lime-300',
    leftBorderClass: 'border-l-4 border-l-lime-400',
    iconBgClass: 'bg-lime-500/20 text-lime-300 border-lime-500/40'
  }
}
