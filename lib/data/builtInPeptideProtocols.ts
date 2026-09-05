import { Protocol, ProtocolStep, Modality } from '@/lib/types'

// ==========================================
// STANDALONE PEPTIDE MODALITY DEFINITIONS
// (All primary/secondary outcomes strictly mapped to
// existing database outcome_dimensions IDs & names)
// ==========================================

export const bpc157_subq_modality: Modality = {
  id: 'bpc157_subq',
  slug: 'bpc157-subq',
  name: 'BPC-157 (Body Protection Compound-157)',
  display_name: 'BPC-157 SubQ (250–500 mcg Daily)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'Accelerates healing for injured tendons, ligaments, joints, and gut tissue so you recover faster with less pain.',
  expanded_why: 'BPC-157 is a gastric-derived pentadecapeptide that upregulates EGR-1 gene transcription, activates VEGFR2 angiogenic receptors, and promotes tendon fibroblast outgrowth and tenocyte migration to damaged connective tissues.',
  headline_benefit: 'Accelerated Tendon, Ligament & Joint Tissue Repair',
  primary_outcome: 'Joint Comfort',
  secondary_outcomes: ['Pain', 'Soreness', 'Energy', 'Digestive Comfort'],
  functional_outcomes_to_track: ['joint_comfort', 'pain', 'soreness', 'energy', 'digestive_comfort'],
  dose_or_exposure: '250 mcg – 500 mcg SubQ Daily (10–20 units on U-100 syringe from 5mg/2mL vial)',
  timing_summary: 'Morning (or split BID morning/evening)',
  default_timing_slot: 'morning',
  frequency: 'Daily (4–8 Week Cycle)',
  cadence_layer: 'daily',
  scientific_references: [
    {
      title: 'Sikiric et al. (2018) Stable gastric pentadecapeptide BPC 157 in tendon healing and angiogenesis',
      url: 'https://pubmed.ncbi.nlm.nih.gov/29998800/',
      type: 'pubmed'
    },
    {
      title: 'Chang et al. (2011) The promoting effect of pentadecapeptide BPC 157 on tendon healing',
      url: 'https://pubmed.ncbi.nlm.nih.gov/21030672/',
      type: 'pubmed'
    },
    {
      title: 'Vukojevic et al. (2018) Pentadecapeptide BPC 157 and the central nervous system',
      url: 'https://pubmed.ncbi.nlm.nih.gov/30528448/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: '15-amino acid pentadecapeptide (Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val)',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 5,
      bac_water_ml: 2,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 2500,
      concentration_mcg_per_unit: 25,
      recommended_dose_mcg: 250,
      units_per_dose: 10,
      total_doses_per_vial: 20,
      remaining_doses: 20,
      remaining_volume_ml: 2.0,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: 'Wolverine Connective Repair Cycle',
      cycle_duration_weeks: 8,
      days_on: 7,
      days_off: 0,
      current_phase: 'loading'
    },
    target_receptors: ['EGR-1', 'VEGFR2', 'FAK-Paxillin Pathway', 'Nitric Oxide System'],
    half_life_summary: '~4 hours (downstream tissue signaling cascades persist >24 hours)',
    reconstitution_instructions: 'Add 2.0 mL bacteriostatic water slowly along the vial wall. Do not shake vigorously—swirl gently until clear.',
    storage_instructions: 'Keep reconstituted vial refrigerated at 36°F–46°F (2°C–8°C). Protect from UV light.',
    site_rotation_recommended: true,
    common_side_effects: ['Transient Site Redness (Minor)', 'Mild Sensation at Injection Site']
  }
}

export const tb500_subq_modality: Modality = {
  id: 'tb500_subq',
  slug: 'tb500-subq',
  name: 'TB-500 (Thymosin Beta-4 / Ac-LKKTETQ)',
  display_name: 'TB-500 SubQ (2.5 mg 2x Weekly)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'Supports full-body tissue flexibility and prevents stiff scar tissue buildup following strains or muscle tears.',
  expanded_why: 'TB-500 is a synthetic fragment of thymosin beta-4 that sequesters intracellular G-actin, upregulates endothelial cell migration, suppresses TGF-beta myofibroblast differentiation, and inhibits fibrotic scar tissue deposition.',
  headline_benefit: 'Systemic Cellular Regeneration & Anti-Fibrotic Remodeling',
  primary_outcome: 'Joint Comfort',
  secondary_outcomes: ['Soreness', 'Pain', 'Endurance', 'Energy'],
  functional_outcomes_to_track: ['joint_comfort', 'soreness', 'pain', 'endurance', 'energy'],
  dose_or_exposure: '2.5 mg SubQ 2x weekly (Loading: Weeks 1–4) -> 2.5 mg 1x weekly (Maintenance: Weeks 5–8)',
  timing_summary: 'Evening (Tuesdays & Fridays)',
  default_timing_slot: 'evening',
  frequency: '2x / week (Loading Phase)',
  cadence_layer: 'weekly',
  scientific_references: [
    {
      title: 'Goldstein et al. (2012) Thymosin beta4: actin-sequestering protein and its role in tissue repair',
      url: 'https://pubmed.ncbi.nlm.nih.gov/22447949/',
      type: 'pubmed'
    },
    {
      title: 'Philp et al. (2004) Thymosin beta4 promotes angiogenesis and wound healing',
      url: 'https://pubmed.ncbi.nlm.nih.gov/15383561/',
      type: 'pubmed'
    },
    {
      title: 'Sosne et al. (2010) Thymosin beta 4: a novel corneal wound healing agent',
      url: 'https://pubmed.ncbi.nlm.nih.gov/20562453/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: 'Synthetic 43-amino acid peptide / Ac-LKKTETQ active domain',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 5,
      bac_water_ml: 2,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 2500,
      concentration_mcg_per_unit: 25,
      recommended_dose_mcg: 2500,
      units_per_dose: 100,
      total_doses_per_vial: 2,
      remaining_doses: 2,
      remaining_volume_ml: 2.0,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: 'TB-500 Loading & Maintenance',
      cycle_duration_weeks: 8,
      days_on: 2,
      days_off: 5,
      current_phase: 'loading'
    },
    target_receptors: ['G-Actin', 'Endothelial Progenitor Migration', 'Laminin-5'],
    half_life_summary: '~24–48 hours (Systemic distribution throughout target connective tissues)',
    reconstitution_instructions: 'Add 2.0 mL bacteriostatic water smoothly along vial wall. Swirl gently.',
    storage_instructions: 'Store reconstituted vial in refrigerator at 36°F–46°F (2°C–8°C).',
    site_rotation_recommended: true,
    common_side_effects: ['Transient Lethargy (Mild)', 'Temporary Head Rush / Warmth post-injection']
  }
}

export const cjc1295_no_dac_subq_modality: Modality = {
  id: 'cjc1295_no_dac_subq',
  slug: 'cjc1295-no-dac-subq',
  name: 'CJC-1295 (No DAC / Mod GRF 1-29)',
  display_name: 'CJC-1295 No DAC (100 mcg Bedtime)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'Stimulates your pituitary gland to naturally produce pulses of growth hormone before sleep for deeper rest and recovery.',
  expanded_why: 'CJC-1295 (Mod GRF 1-29) is a 29-amino acid GHRH analog with 4 amino acid substitutions conferring DPP-IV cleavage resistance. It amplifies natural pulsatile GH release without receptor downregulation.',
  headline_benefit: 'Pulsatile Growth Hormone Release & Slow-Wave Deep Sleep',
  primary_outcome: 'Sleep Quality',
  secondary_outcomes: ['Waking Restedness', 'Energy', 'Soreness', 'Stress'],
  functional_outcomes_to_track: ['sleep_quality', 'waking_restedness', 'energy', 'soreness', 'stress'],
  dose_or_exposure: '100 mcg SubQ 1x daily at bedtime (5 Days On / 2 Days Off)',
  timing_summary: 'Bedtime (30–60m prior to sleep, ≥2h post-prandial)',
  default_timing_slot: 'pre_bed',
  frequency: '5 Days On / 2 Days Off',
  cadence_layer: 'weekly',
  scientific_references: [
    {
      title: 'Teichman et al. (2006) Prolonged stimulation of growth hormone (GH) and IGF-I by CJC-1295',
      url: 'https://pubmed.ncbi.nlm.nih.gov/16352683/',
      type: 'pubmed'
    },
    {
      title: 'Ionescu & Frohman (2006) Pulsatile secretion of growth hormone elicited by GHRH analogs',
      url: 'https://pubmed.ncbi.nlm.nih.gov/16822826/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: '29-amino acid GHRH analog [D-Ala2, Gln8, Ala15, Leu27]-GHRH(1-29)-NH2',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 2,
      bac_water_ml: 2,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 1000,
      concentration_mcg_per_unit: 10,
      recommended_dose_mcg: 100,
      units_per_dose: 10,
      total_doses_per_vial: 20,
      remaining_doses: 20,
      remaining_volume_ml: 2.0,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: '5 On / 2 Off GH Pulse',
      cycle_duration_weeks: 12,
      days_on: 5,
      days_off: 2,
      current_phase: 'maintenance'
    },
    target_receptors: ['GHRH-R (Pituitary Somatotrophs)'],
    half_life_summary: '~30 minutes (Preserves natural physiological pulsatility without pituitary burnout)',
    reconstitution_instructions: 'Inject 2.0 mL bacteriostatic water gently into vial. Dissolves rapidly.',
    storage_instructions: 'Keep refrigerated at 36°F–46°F (2°C–8°C) in dark storage box.',
    site_rotation_recommended: true,
    common_side_effects: ['Transient Facial Flushing (5-10m post-dose)', 'Mild Euphoria / Deep Drowsiness']
  }
}

export const ipamorelin_subq_modality: Modality = {
  id: 'ipamorelin_subq',
  slug: 'ipamorelin-subq',
  name: 'Ipamorelin (Selective GHS-R1a Agonist)',
  display_name: 'Ipamorelin SubQ (200–300 mcg Bedtime)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'Triggers clean, restful growth hormone release at night without spiking hunger, cortisol, or stress hormones.',
  expanded_why: 'Ipamorelin is a highly selective third-generation ghrelin-mimetic pentapeptide that binds GHS-R1a to trigger GH secretion without causing ACTH, cortisol, prolactin, or aldosterone elevation.',
  headline_benefit: 'Selective Pituitary GH Release & Deep Sleep Amplification',
  primary_outcome: 'Sleep Quality',
  secondary_outcomes: ['Waking Restedness', 'Satiety', 'Skin Clarity', 'Energy'],
  functional_outcomes_to_track: ['sleep_quality', 'waking_restedness', 'satiety', 'skin_clarity', 'energy'],
  dose_or_exposure: '200 mcg – 300 mcg SubQ 1x daily at bedtime (5 Days On / 2 Days Off)',
  timing_summary: 'Bedtime (co-injected with CJC-1295 or Tesamorelin)',
  default_timing_slot: 'pre_bed',
  frequency: '5 Days On / 2 Days Off',
  cadence_layer: 'weekly',
  scientific_references: [
    {
      title: 'Raun et al. (1998) Ipamorelin, the first selective growth hormone secretagogue',
      url: 'https://pubmed.ncbi.nlm.nih.gov/9849822/',
      type: 'pubmed'
    },
    {
      title: 'Gobburu et al. (1999) Pharmacokinetic-pharmacodynamic modeling of ipamorelin-stimulated GH release',
      url: 'https://pubmed.ncbi.nlm.nih.gov/10444146/',
      type: 'pubmed'
    },
    {
      title: 'Johansen et al. (1999) Ipamorelin, a new growth-hormone secretagogue, induces longitudinal bone growth in rats',
      url: 'https://pubmed.ncbi.nlm.nih.gov/10609825/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: 'Pentapeptide (Aib-His-D-2-Nal-D-Phe-Lys-NH2)',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 5,
      bac_water_ml: 2.5,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 2000,
      concentration_mcg_per_unit: 20,
      recommended_dose_mcg: 200,
      units_per_dose: 10,
      total_doses_per_vial: 25,
      remaining_doses: 25,
      remaining_volume_ml: 2.5,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: '5 On / 2 Off GH Pulse',
      cycle_duration_weeks: 12,
      days_on: 5,
      days_off: 2,
      current_phase: 'maintenance'
    },
    target_receptors: ['GHS-R1a (Growth Hormone Secretagogue Receptor 1a)'],
    half_life_summary: '~2 hours (Rapidly cleared, avoiding receptor desensitization)',
    reconstitution_instructions: 'Reconstitute with 2.5 mL bacteriostatic water. Swirl gently.',
    storage_instructions: 'Keep refrigerated at 36°F–46°F (2°C–8°C).',
    site_rotation_recommended: true,
    common_side_effects: ['Transient Hunger / Somnolence (Mild)', 'Vivid REM Dreams']
  }
}

export const ghk_cu_subq_modality: Modality = {
  id: 'ghk_cu_subq',
  slug: 'ghk-cu-subq',
  name: 'GHK-Cu (Copper Tripeptide-1)',
  display_name: 'GHK-Cu SubQ (1.5–2.0 mg Daily)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'Rebuilds skin collagen, tightens skin elasticity, and supports hair follicle density from within.',
  expanded_why: 'GHK-Cu (glycyl-L-histidyl-L-lysine copper complex) resets gene expression for over 4,000 human genes, stimulates pro-collagen types I & III and decorin synthesis, and inhibits TGF-beta fibrotic signaling.',
  headline_benefit: 'Dermal Collagen Synthesis, Hair Follicle Density & Anti-Aging Matrix Remodeling',
  primary_outcome: 'Skin Clarity',
  secondary_outcomes: ['Joint Comfort', 'Soreness', 'Pain', 'Energy'],
  functional_outcomes_to_track: ['skin_clarity', 'joint_comfort', 'soreness', 'pain', 'energy'],
  dose_or_exposure: '1.5 mg – 2.0 mg SubQ Daily (10 units from 50mg/2.5mL vial on U-100 syringe)',
  timing_summary: 'Morning (or divided morning/evening)',
  default_timing_slot: 'morning',
  frequency: 'Daily (30–60 Day Cycle)',
  cadence_layer: 'daily',
  scientific_references: [
    {
      title: 'Pickart et al. (2018) Regenerative and Protective Actions of the GHK-Cu Peptide in the Light of the New Gene Data',
      url: 'https://pubmed.ncbi.nlm.nih.gov/30018865/',
      type: 'pubmed'
    },
    {
      title: 'Pickart & Margolina (2018) GHK Peptide as a Natural Modulator of Multiple Cellular Pathways in Skin Regeneration',
      url: 'https://pubmed.ncbi.nlm.nih.gov/29986520/',
      type: 'pubmed'
    },
    {
      title: 'Badenhorst et al. (2016) The potential of GHK-Cu in hair growth and dermal revitalization',
      url: 'https://pubmed.ncbi.nlm.nih.gov/27581177/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: 'Copper (2+) tripeptide complex: (Gly-His-Lys)·Cu2+',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 50,
      bac_water_ml: 2.5,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 20000,
      concentration_mcg_per_unit: 200,
      recommended_dose_mcg: 2000,
      units_per_dose: 10,
      total_doses_per_vial: 25,
      remaining_doses: 25,
      remaining_volume_ml: 2.5,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: 'GHK-Cu Dermal Rejuvenation Cycle',
      cycle_duration_weeks: 8,
      days_on: 7,
      days_off: 0,
      current_phase: 'loading'
    },
    target_receptors: ['TGF-Beta Downregulation', 'Collagen I & III Synthesis', 'VEGF Angiogenesis', 'Decorin'],
    half_life_summary: '~0.5–1 hour (Triggers multi-week intracellular gene transcription and extracellular matrix cross-linking)',
    reconstitution_instructions: 'Slowly inject 2.5 mL bacteriostatic water along the vial wall. Invert gently until deep royal blue color is uniform.',
    storage_instructions: 'Keep refrigerated at 36°F–46°F (2°C–8°C). Protect from direct light.',
    site_rotation_recommended: true,
    common_side_effects: ['Localized Stinging / Post-Injection Soreness (Common - diluting with extra BAC water helps)', 'Mild Transient Redness at Injection Site']
  }
}

export const tesamorelin_subq_modality: Modality = {
  id: 'tesamorelin_subq',
  slug: 'tesamorelin-subq',
  name: 'Tesamorelin (GHRH 1-44 Analogue)',
  display_name: 'Tesamorelin SubQ (1.0–2.0 mg Bedtime)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'Targeted growth-hormone releaser that preferentially breaks down stubborn visceral belly fat while preserving lean muscle mass.',
  expanded_why: 'Tesamorelin is a synthetic 44-amino acid GHRH analogue stabilized with a hexenoyl group. Clinically demonstrated in FDA trials to selectively mobilize visceral adipose tissue (VAT) via adipocyte beta-3 adrenergic pathways and pituitary GH release without impairing glucose tolerance.',
  headline_benefit: 'Preferential Visceral Adipose Tissue (VAT) Depletion & Lean Muscle Preservation',
  primary_outcome: 'Energy',
  secondary_outcomes: ['Sleep Quality', 'Waking Restedness', 'Satiety', 'Endurance'],
  functional_outcomes_to_track: ['energy', 'sleep_quality', 'waking_restedness', 'satiety', 'endurance'],
  dose_or_exposure: '1.0 mg – 2.0 mg SubQ 1x daily at bedtime on empty stomach (5 Days On / 2 Days Off or Daily for 8–12 Weeks)',
  timing_summary: 'Bedtime (at least 90–120m after last meal)',
  default_timing_slot: 'pre_bed',
  frequency: '5 Days On / 2 Days Off (or Daily for 8–12 Weeks)',
  cadence_layer: 'weekly',
  scientific_references: [
    {
      title: 'Falutz et al. (2007) Effects of Tesamorelin, a Growth Hormone-Releasing Factor Analog, in HIV-Associated Abdominal Fat Accumulation',
      url: 'https://pubmed.ncbi.nlm.nih.gov/18057338/',
      type: 'pubmed'
    },
    {
      title: 'Stanley et al. (2014) Tesamorelin reduces visceral adipose tissue and improves body composition',
      url: 'https://pubmed.ncbi.nlm.nih.gov/24780048/',
      type: 'pubmed'
    },
    {
      title: 'Falutz et al. (2010) Long-term safety and effects of tesamorelin on visceral adipose tissue and glucose parameters',
      url: 'https://pubmed.ncbi.nlm.nih.gov/20631024/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: 'trans-3-hexenoyl-GHRH (1-44) amide',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 2,
      bac_water_ml: 1.0,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 2000,
      concentration_mcg_per_unit: 20,
      recommended_dose_mcg: 1000,
      units_per_dose: 50,
      total_doses_per_vial: 2,
      remaining_doses: 2,
      remaining_volume_ml: 1.0,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: 'Tesamorelin Visceral Fat Depletion Cycle',
      cycle_duration_weeks: 12,
      days_on: 5,
      days_off: 2,
      current_phase: 'loading'
    },
    target_receptors: ['Pituitary GHRH Receptor', 'Adipocyte Beta-3 Adrenergic Lipolysis', 'Hepatic IGF-1'],
    half_life_summary: '~26–38 minutes (Fast-acting pulsatile somatotroph stimulation)',
    reconstitution_instructions: 'Inject 1.0 mL bacteriostatic water gently down the vial side. Swirl slowly until completely clear.',
    storage_instructions: 'Refrigerate reconstituted solution at 36°F–46°F (2°C–8°C). Protect from heat and agitation.',
    site_rotation_recommended: true,
    common_side_effects: ['Transient Flushing (10-15m post-injection)', 'Mild Peripheral Water Retention (Initial 1-2 weeks)', 'Injection Site Erythema']
  }
}

export const mots_c_subq_modality: Modality = {
  id: 'mots_c_subq',
  slug: 'mots-c-subq',
  name: 'MOTS-c (Mitochondrial-Derived Peptide)',
  display_name: 'MOTS-c SubQ (5.0 mg 2–3x Weekly)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'Exercise-mimicking peptide that boosts physical endurance, helps your muscles burn glucose efficiently, and enhances metabolic health.',
  expanded_why: 'MOTS-c is a 16-amino acid mitochondrial-derived peptide that translocates to the nucleus under metabolic challenge to activate AMPK, promote GLUT4 glucose transporter expression in skeletal muscle, and upregulate fatty acid beta-oxidation.',
  headline_benefit: 'Mitochondrial Biogenesis, AMPK Activation & Physical Endurance',
  primary_outcome: 'Endurance',
  secondary_outcomes: ['Energy', 'Strength', 'Mental Clarity', 'Focus'],
  functional_outcomes_to_track: ['endurance', 'energy', 'strength', 'mental_clarity', 'focus'],
  dose_or_exposure: '5.0 mg SubQ 2x–3x weekly (e.g. Mon / Wed / Fri mornings fasted before physical activity)',
  timing_summary: 'Morning fasted (prior to zone 2 cardio or exercise)',
  default_timing_slot: 'morning',
  frequency: '2x–3x / week (4–6 Week Cycle)',
  cadence_layer: 'weekly',
  scientific_references: [
    {
      title: 'Lee et al. (2015) The Mitochondrial-Derived Peptide MOTS-c Promotes Metabolic Homeostasis and Reduces Diet-Induced Obesity and Insulin Resistance',
      url: 'https://pubmed.ncbi.nlm.nih.gov/25738459/',
      type: 'pubmed'
    },
    {
      title: 'Reynolds et al. (2021) MOTS-c is an Exercise-Induced Mitochondrial-Encoded Regulator of Physical Capacity and Muscle Homeostasis',
      url: 'https://pubmed.ncbi.nlm.nih.gov/33479241/',
      type: 'pubmed'
    },
    {
      title: 'Kim et al. (2018) The mitochondrial-encoded peptide MOTS-c translocates to the nucleus to regulate nuclear gene expression in response to metabolic stress',
      url: 'https://pubmed.ncbi.nlm.nih.gov/29983246/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: '16-amino acid mitochondrial peptide (Met-Arg-Trp-Gln-Glu-Met-Gly-Tyr-Ile-Phe-Tyr-Pro-Arg-Lys-Leu-Arg)',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 10,
      bac_water_ml: 1.0,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 10000,
      concentration_mcg_per_unit: 100,
      recommended_dose_mcg: 5000,
      units_per_dose: 50,
      total_doses_per_vial: 2,
      remaining_doses: 2,
      remaining_volume_ml: 1.0,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: 'MOTS-c Metabolic Reset Cycle',
      cycle_duration_weeks: 6,
      days_on: 3,
      days_off: 4,
      current_phase: 'loading'
    },
    target_receptors: ['AMPK (5′-AMP-activated protein kinase)', 'GLUT4 Translocation', 'AICAR Transformylase (ATIC)'],
    half_life_summary: '~4 hours (Nuclear translocation and metabolic signaling persist for 48–72 hours)',
    reconstitution_instructions: 'Add 1.0 mL bacteriostatic water slowly down vial wall. Swirl gently without foaming.',
    storage_instructions: 'Keep refrigerated at 36°F–46°F (2°C–8°C). Protect from heat and light.',
    site_rotation_recommended: true,
    common_side_effects: ['Mild Injection Site Sensitivity (Temporary)', 'Hypoglycemia-like Tremor if taken fasted without adequate hydration', 'Mild Energetic Sensation']
  }
}

export const semax_subq_modality: Modality = {
  id: 'semax_subq',
  slug: 'semax-subq',
  name: 'Semax (Heptapeptide ACTH 4-10 Pro-Gly-Pro)',
  display_name: 'Semax (300–600 mcg AM)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'Fast-acting nootropic peptide that sharpens executive focus, clears mental fog, and boosts learning without jitters.',
  expanded_why: 'Semax is a synthetic heptapeptide derived from the N-terminal fragment of ACTH(4-10) stabilized with Pro-Gly-Pro. It rapidly upregulates Brain-Derived Neurotrophic Factor (BDNF) and TrkB receptors in the hippocampus and prefrontal cortex, enhancing dopaminergic and serotonergic neurotransmission.',
  headline_benefit: 'Executive Focus, BDNF Upregulation & Cognitive Clarity',
  primary_outcome: 'Focus',
  secondary_outcomes: ['Mental Clarity', 'Productivity', 'Energy', 'Motivation', 'Memory'],
  functional_outcomes_to_track: ['focus', 'mental_clarity', 'productivity', 'energy', 'motivation', 'memory'],
  dose_or_exposure: '300 mcg – 600 mcg SubQ or Intranasal 1x daily in morning / midday',
  timing_summary: 'Morning or early afternoon (upon waking or before deep work)',
  default_timing_slot: 'morning',
  frequency: 'Daily (4–6 Week Cycle)',
  cadence_layer: 'daily',
  scientific_references: [
    {
      title: 'Dolotov et al. (2006) Semax, an ACTH(4-10) analogue with nootropic properties, stimulates BDNF expression in the rat hippocampus',
      url: 'https://pubmed.ncbi.nlm.nih.gov/16954600/',
      type: 'pubmed'
    },
    {
      title: 'Gusev et al. (2018) Neuroprotective effects of the peptide Semax in acute and chronic cerebral ischemia',
      url: 'https://pubmed.ncbi.nlm.nih.gov/30407139/',
      type: 'pubmed'
    },
    {
      title: 'Tsai et al. (2007) ACTH(4-10) analogues and central monoamine neurotransmission',
      url: 'https://pubmed.ncbi.nlm.nih.gov/17588647/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: 'Heptapeptide (Met-Glu-His-Phe-Pro-Gly-Pro)',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 10,
      bac_water_ml: 2.0,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 5000,
      concentration_mcg_per_unit: 50,
      recommended_dose_mcg: 300,
      units_per_dose: 6,
      total_doses_per_vial: 33,
      remaining_doses: 33,
      remaining_volume_ml: 2.0,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: 'Semax Executive Focus Cycle',
      cycle_duration_weeks: 6,
      days_on: 7,
      days_off: 0,
      current_phase: 'loading'
    },
    target_receptors: ['BDNF / TrkB Pathway', 'Dopamine D1/D2 Turnover', 'Serotonergic 5-HT Receptors'],
    half_life_summary: '~20–30 minutes (Central neurotrophic cascades persist >24 hours)',
    reconstitution_instructions: 'Add 2.0 mL bacteriostatic water smoothly down the vial side. Swirl gently.',
    storage_instructions: 'Keep refrigerated at 36°F–46°F (2°C–8°C). Protect from heat.',
    site_rotation_recommended: true,
    common_side_effects: ['Mild Transient Stimulation / Alertness', 'Occasional Light Nasal Irritation if administered intranasally']
  }
}

export const selank_subq_modality: Modality = {
  id: 'selank_subq',
  slug: 'selank-subq',
  name: 'Selank (Heptapeptide Tuftsin Analog)',
  display_name: 'Selank (250–500 mcg Daily)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'Calming peptide that relieves stress, eases acute anxiety, and balances your mood without making you tired or foggy.',
  expanded_why: 'Selank is a synthetic 7-amino acid analogue of the endogenous immunomodulatory peptide tuftsin (Thr-Lys-Pro-Arg-Pro-Gly-Pro). It allosterically modulates GABA-A receptors, prevents enkephalin degradation by inhibiting enkephalinases, and reduces systemic inflammatory IL-6.',
  headline_benefit: 'Anxiolysis, Stress Resilience & Emotional Composure',
  primary_outcome: 'Stress',
  secondary_outcomes: ['Mood', 'Emotional Resilience', 'Focus', 'Mental Clarity'],
  functional_outcomes_to_track: ['stress', 'mood', 'emotional_resilience', 'focus', 'mental_clarity'],
  dose_or_exposure: '250 mcg – 500 mcg SubQ or Intranasal 1x daily (Morning or Midday)',
  timing_summary: 'Morning or during periods of acute stress',
  default_timing_slot: 'morning',
  frequency: 'Daily (4–6 Week Cycle)',
  cadence_layer: 'daily',
  scientific_references: [
    {
      title: 'Uchitel et al. (2008) Anxiolytic effects of Selank and its impact on the GABAergic system',
      url: 'https://pubmed.ncbi.nlm.nih.gov/19145321/',
      type: 'pubmed'
    },
    {
      title: 'Kozlovskaya et al. (2003) Results of clinical trials of the peptide anxiolytic Selank',
      url: 'https://pubmed.ncbi.nlm.nih.gov/12852202/',
      type: 'pubmed'
    },
    {
      title: 'Semenova et al. (2010) Selank and its fragments modulate interleukin-6 expression and enkephalinase activity',
      url: 'https://pubmed.ncbi.nlm.nih.gov/20387532/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: 'Heptapeptide (Thr-Lys-Pro-Arg-Pro-Gly-Pro)',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 10,
      bac_water_ml: 2.0,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 5000,
      concentration_mcg_per_unit: 50,
      recommended_dose_mcg: 300,
      units_per_dose: 6,
      total_doses_per_vial: 33,
      remaining_doses: 33,
      remaining_volume_ml: 2.0,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: 'Selank Anxiolytic Balance Cycle',
      cycle_duration_weeks: 6,
      days_on: 7,
      days_off: 0,
      current_phase: 'loading'
    },
    target_receptors: ['GABA-A Allosteric Site', 'Enkephalinase Inhibition', 'IL-6 Suppression'],
    half_life_summary: '~20–30 minutes (Anxiolytic and mood stabilization effects persist 8–12 hours)',
    reconstitution_instructions: 'Add 2.0 mL bacteriostatic water slowly down vial wall. Invert gently.',
    storage_instructions: 'Keep refrigerated at 36°F–46°F (2°C–8°C).',
    site_rotation_recommended: true,
    common_side_effects: ['Mild Calming Sensation', 'Subtle Muscle Relaxation']
  }
}

export const kpv_subq_modality: Modality = {
  id: 'kpv_subq',
  slug: 'kpv-subq',
  name: 'KPV (Alpha-MSH 11-13 Tripeptide)',
  display_name: 'KPV SubQ (250–500 mcg Daily)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'Powerful anti-inflammatory peptide that calms persistent joint pain, cools soft-tissue swelling, and soothes digestive irritation.',
  expanded_why: 'KPV is a naturally occurring C-terminal tripeptide (Lys-Pro-Val) of alpha-melanocyte-stimulating hormone (alpha-MSH). It translocates directly into the cell nucleus to selectively inhibit NF-kB activation, halting the transcription of pro-inflammatory cytokines (TNF-alpha, IL-1beta, IL-6) and clearing chronic inflammation blocks.',
  headline_benefit: 'Potent NF-kB Inhibition, Gut Mucosal Soothing & Soft-Tissue Anti-Inflammation',
  primary_outcome: 'Pain',
  secondary_outcomes: ['Soreness', 'Joint Comfort', 'Digestive Comfort', 'Energy'],
  functional_outcomes_to_track: ['pain', 'soreness', 'joint_comfort', 'digestive_comfort', 'energy'],
  dose_or_exposure: '250 mcg – 500 mcg SubQ Daily (10–20 units from 5mg/2mL vial on U-100 syringe)',
  timing_summary: 'Morning (or divided morning/evening)',
  default_timing_slot: 'morning',
  frequency: 'Daily (4–8 Week Cycle)',
  cadence_layer: 'daily',
  scientific_references: [
    {
      title: 'Catania et al. (2006) The anti-inflammatory peptide alpha-MSH and its active tripeptide KPV in inflammatory diseases',
      url: 'https://pubmed.ncbi.nlm.nih.gov/17114704/',
      type: 'pubmed'
    },
    {
      title: 'Dalmasso et al. (2008) PepT1-mediated transport of the tripeptide KPV prevents intestinal inflammation',
      url: 'https://pubmed.ncbi.nlm.nih.gov/18177989/',
      type: 'pubmed'
    },
    {
      title: 'Land (2012) Nuclear translocation of alpha-MSH C-terminal tripeptide KPV inhibits NF-kappaB activation',
      url: 'https://pubmed.ncbi.nlm.nih.gov/22982845/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: 'Tripeptide (Lys-Pro-Val)',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 5,
      bac_water_ml: 2.0,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 2500,
      concentration_mcg_per_unit: 25,
      recommended_dose_mcg: 250,
      units_per_dose: 10,
      total_doses_per_vial: 20,
      remaining_doses: 20,
      remaining_volume_ml: 2.0,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: 'KPV Anti-Inflammatory Cycle',
      cycle_duration_weeks: 8,
      days_on: 7,
      days_off: 0,
      current_phase: 'loading'
    },
    target_receptors: ['NF-kB Nuclear Translocation', 'PepT1 Transporter', 'TNF-Alpha & IL-6 Suppression'],
    half_life_summary: '~2–4 hours (Nuclear transcriptional inhibition lasts >24 hours)',
    reconstitution_instructions: 'Add 2.0 mL bacteriostatic water slowly down vial wall. Swirl gently until clear.',
    storage_instructions: 'Store reconstituted solution refrigerated at 36°F–46°F (2°C–8°C).',
    site_rotation_recommended: true,
    common_side_effects: ['Mild Transient Injection Site Redness', 'Occasional Mild GI Shift in first 48 hours']
  }
}

export const retatrutide_subq_modality: Modality = {
  id: 'retatrutide_subq',
  slug: 'retatrutide-subq',
  name: 'Retatrutide (GLP-1/GIP/Glucagon Triple Agonist)',
  display_name: 'Retatrutide SubQ (1.0–4.0 mg Weekly)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'Next-generation triple-agonist that turns down appetite, burns visceral body fat, and increases resting metabolic rate.',
  expanded_why: 'Retatrutide (LY3437943) is a single peptide engineered with triple receptor agonism across GIP, GLP-1, and Glucagon receptors ("GGG"). Glucagon activation uniquely stimulates energy expenditure and hepatic fatty acid beta-oxidation, while GLP-1 and GIP agonism enhance satiety and insulin sensitivity.',
  headline_benefit: 'Triple-Agonist Fat Loss, Basal Metabolic Elevation & Satiety',
  primary_outcome: 'Satiety',
  secondary_outcomes: ['Energy', 'Digestive Comfort', 'Endurance', 'Mood'],
  functional_outcomes_to_track: ['satiety', 'energy', 'digestive_comfort', 'endurance', 'mood'],
  dose_or_exposure: '1.0 mg – 2.0 mg SubQ 1x weekly (Titrable: 1mg -> 2mg -> 4mg once weekly on consistent day, e.g. Sunday)',
  timing_summary: 'Morning 1x weekly (e.g. Sunday morning)',
  default_timing_slot: 'morning',
  frequency: '1x / week',
  cadence_layer: 'weekly',
  scientific_references: [
    {
      title: 'Jastreboff et al. (2023) Triple-Hormone-Receptor Agonist Retatrutide for Obesity — A Phase 2 Trial',
      url: 'https://pubmed.ncbi.nlm.nih.gov/37366315/',
      type: 'pubmed'
    },
    {
      title: 'Coskun et al. (2022) LY3437943, a novel triple GIP, GLP-1, and glucagon receptor agonist in metabolic disease',
      url: 'https://pubmed.ncbi.nlm.nih.gov/35905727/',
      type: 'pubmed'
    },
    {
      title: 'Rosenstock et al. (2023) Retatrutide, a GIP, GLP-1 and glucagon receptor agonist, for people with type 2 diabetes',
      url: 'https://pubmed.ncbi.nlm.nih.gov/37366316/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: '39-amino acid triple agonist peptide with C20 fatty diacid moiety',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 10,
      bac_water_ml: 2.0,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 5000,
      concentration_mcg_per_unit: 50,
      recommended_dose_mcg: 1000,
      units_per_dose: 20,
      total_doses_per_vial: 10,
      remaining_doses: 10,
      remaining_volume_ml: 2.0,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: 'Retatrutide Metabolic Titration Cycle',
      cycle_duration_weeks: 16,
      days_on: 1,
      days_off: 6,
      current_phase: 'loading'
    },
    target_receptors: ['GLP-1R (Glucagon-like Peptide 1)', 'GIPR (Glucose-dependent Insulinotropic Polypeptide)', 'GCGR (Glucagon Receptor)'],
    half_life_summary: '~6 days (~144 hours; sustains stable steady-state plasma concentrations with 1x weekly injection)',
    reconstitution_instructions: 'Slowly inject 2.0 mL bacteriostatic water down vial wall. Swirl gently until clear. Do not agitate.',
    storage_instructions: 'Refrigerate reconstituted solution at 36°F–46°F (2°C–8°C). Protect from direct light.',
    site_rotation_recommended: true,
    common_side_effects: ['Transient Nausea (Mild during initial 48 hours)', 'Mild Heart Rate Elevation (+2-4 bpm)', 'Reduced Appetite']
  }
}

export const ss31_subq_modality: Modality = {
  id: 'ss31_subq',
  slug: 'ss31-subq',
  name: 'SS-31 (Elamipretide / Szeto-Schiller Peptide)',
  display_name: 'SS-31 SubQ (4.0–10.0 mg Daily)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'Cellular energy restorative that recharges worn-out mitochondria, boosts daily stamina, and protects against cellular oxidative stress.',
  expanded_why: 'SS-31 (Elamipretide; D-Arg-Dmt-Lys-Phe-NH2) is a cell-permeable aromatic-cationic tetrapeptide that selectively targets and binds cardiolipin on the inner mitochondrial membrane (IMM). It optimizes electron transport chain (ETC) supercomplex organization, halts pathological reactive oxygen species (ROS) electron leak, and restores maximum ATP output.',
  headline_benefit: 'Inner Mitochondrial Membrane Repair, ATP Synthesis & ROS Clearance',
  primary_outcome: 'Energy',
  secondary_outcomes: ['Endurance', 'Strength', 'Mental Clarity', 'Soreness'],
  functional_outcomes_to_track: ['energy', 'endurance', 'strength', 'mental_clarity', 'soreness'],
  dose_or_exposure: '4.0 mg – 10.0 mg SubQ Daily in Morning (20–50 units from 50mg/2.5mL vial on U-100 syringe)',
  timing_summary: 'Morning (upon waking or prior to aerobic activity)',
  default_timing_slot: 'morning',
  frequency: 'Daily (4–8 Week Cycle)',
  cadence_layer: 'daily',
  scientific_references: [
    {
      title: 'Szeto (2014) First-in-class cardiolipin-protective compound as a therapeutic agent to restore mitochondrial bioenergetics',
      url: 'https://pubmed.ncbi.nlm.nih.gov/24117192/',
      type: 'pubmed'
    },
    {
      title: 'Campbell et al. (2019) SS-31 peptide restores mitochondrial energetics and exercise tolerance in aged humans',
      url: 'https://pubmed.ncbi.nlm.nih.gov/31217277/',
      type: 'pubmed'
    },
    {
      title: 'Siegel et al. (2013) Mitochondrial-targeted peptide rapidly improves skeletal muscle energetics in aged mice',
      url: 'https://pubmed.ncbi.nlm.nih.gov/23692570/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: 'Tetrapeptide (D-Arg-2,6-dimethyl-Tyr-Lys-Phe-NH2)',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 50,
      bac_water_ml: 2.5,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 20000,
      concentration_mcg_per_unit: 200,
      recommended_dose_mcg: 5000,
      units_per_dose: 25,
      total_doses_per_vial: 10,
      remaining_doses: 10,
      remaining_volume_ml: 2.5,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: 'SS-31 Mitochondrial Recharging Cycle',
      cycle_duration_weeks: 6,
      days_on: 7,
      days_off: 0,
      current_phase: 'loading'
    },
    target_receptors: ['Cardiolipin (Inner Mitochondrial Membrane)', 'ETC Complex I-IV Supercomplexes', 'ROS Reduction'],
    half_life_summary: '~2–4 hours (IMM structural stability and cardiolipin binding persist for extended periods)',
    reconstitution_instructions: 'Inject 2.5 mL bacteriostatic water smoothly along the vial wall. Swirl gently.',
    storage_instructions: 'Keep refrigerated at 36°F–46°F (2°C–8°C). Protect from heat.',
    site_rotation_recommended: true,
    common_side_effects: ['Mild Transient Injection Site Sensation', 'Subtle Energy Rise']
  }
}

export const epitalon_subq_modality: Modality = {
  id: 'epitalon_subq',
  slug: 'epitalon-subq',
  name: 'Epitalon (Epithalon / AGAG Tetrapeptide)',
  display_name: 'Epitalon SubQ (5.0–10.0 mg Daily Cycling)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'Longevity and pineal-gland peptide that resets deep circadian sleep rhythms, supports cellular lifespan, and promotes nighttime melatonin production.',
  expanded_why: 'Epitalon is a synthetic pineal tetrapeptide (Ala-Glu-Asp-Gly) developed by Prof. Vladimir Khavinson. It restores youthful nocturnal pineal melatonin synthesis, normalizes hypothalamic-pituitary endocrine circadian rhythms, and upregulates telomerase reverse transcriptase (TERT) gene expression in human somatic tissues.',
  headline_benefit: 'Pineal Circadian Endocrine Reset, Telomerase Upregulation & Deep Sleep',
  primary_outcome: 'Sleep Quality',
  secondary_outcomes: ['Waking Restedness', 'Energy', 'Mood', 'Mental Clarity', 'Immune Resilience'],
  functional_outcomes_to_track: ['sleep_quality', 'waking_restedness', 'energy', 'mood', 'mental_clarity', 'immune_resilience'],
  dose_or_exposure: '5.0 mg – 10.0 mg SubQ Daily in Evening/Bedtime for 10–20 Days (1–2x per year cycle)',
  timing_summary: 'Evening / Bedtime (30m before sleep for 10–20 consecutive days)',
  default_timing_slot: 'pre_bed',
  frequency: 'Daily for 10–20 Days (1–2x / Year)',
  cadence_layer: 'infrequent',
  scientific_references: [
    {
      title: 'Khavinson et al. (2003) Synthetic tetrapeptide epithalon stimulates telomerase activity in human cells',
      url: 'https://pubmed.ncbi.nlm.nih.gov/12937682/',
      type: 'pubmed'
    },
    {
      title: 'Anisimov et al. (2001) Effect of Epitalon on biomarkers of aging, life span and spontaneous tumor incidence in mice',
      url: 'https://pubmed.ncbi.nlm.nih.gov/11802128/',
      type: 'pubmed'
    },
    {
      title: 'Khavinson et al. (2004) Epithalon peptide regulation of pineal melatonin synthesis and immune function in aging',
      url: 'https://pubmed.ncbi.nlm.nih.gov/15776991/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: 'Tetrapeptide (Ala-Glu-Asp-Gly)',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 50,
      bac_water_ml: 2.5,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 20000,
      concentration_mcg_per_unit: 200,
      recommended_dose_mcg: 5000,
      units_per_dose: 25,
      total_doses_per_vial: 10,
      remaining_doses: 10,
      remaining_volume_ml: 2.5,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: 'Epitalon 10-Day Pineal Longevity Pulse',
      cycle_duration_weeks: 2,
      days_on: 10,
      days_off: 355,
      current_phase: 'loading'
    },
    target_receptors: ['Pineal Gland Melatonergic Axis', 'Telomerase Reverse Transcriptase (TERT)', 'Hypothalamic Sensitivity Reset'],
    half_life_summary: '~30 minutes (Circadian pineal gene expression cascades persist for months post-cycle)',
    reconstitution_instructions: 'Inject 2.5 mL bacteriostatic water gently into vial. Dissolves instantly.',
    storage_instructions: 'Keep refrigerated at 36°F–46°F (2°C–8°C). Protect from direct light.',
    site_rotation_recommended: true,
    common_side_effects: ['Enhanced Drowsiness before sleep', 'Deep REM Vivid Dreams (Beneficial)']
  }
}

export const ta1_subq_modality: Modality = {
  id: 'ta1_subq',
  slug: 'ta1-subq',
  name: 'Thymosin Alpha-1 (TA-1 / Zadaxin)',
  display_name: 'Thymosin Alpha-1 SubQ (1.5 mg 2x/wk)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'Potent immune-optimizing peptide that primes natural killer cells, balances T-cells, and clears chronic subclinical infections.',
  expanded_why: 'Thymosin Alpha-1 is a 28-amino acid polypeptide originally isolated from thymus tissue. It acts via Toll-like receptors (TLR2, TLR9) on dendritic cells to stimulate T-helper (Th1) immune responses, elevate MHC Class I expression, and enhance cytotoxic T-cell and natural killer (NK) activity while modulating regulatory T-cells (Tregs) to prevent excessive inflammatory damage.',
  headline_benefit: 'T-Cell Activation, Natural Killer Cytotoxicity & Antiviral Defense',
  primary_outcome: 'Immune Resilience',
  secondary_outcomes: ['Energy', 'Pain', 'Mood', 'Digestive Comfort'],
  functional_outcomes_to_track: ['immune_resilience', 'energy', 'pain', 'mood', 'digestive_comfort'],
  dose_or_exposure: '1.5 mg SubQ 2x weekly (Mondays & Thursdays; 75 units from 5mg/2.5mL vial on U-100 syringe)',
  timing_summary: 'Morning 2x weekly (e.g. Mon/Thu)',
  default_timing_slot: 'morning',
  frequency: '2x / week',
  cadence_layer: 'weekly',
  scientific_references: [
    {
      title: 'Romani et al. (2004) Thymosin alpha1 activates dendritic cells for antifungal Th1 resistance through TLR signaling',
      url: 'https://pubmed.ncbi.nlm.nih.gov/14715637/',
      type: 'pubmed'
    },
    {
      title: 'King & Tuthill (2016) Immune modulating peptide Thymosin Alpha-1 in infectious disease and oncology',
      url: 'https://pubmed.ncbi.nlm.nih.gov/27159781/',
      type: 'pubmed'
    },
    {
      title: 'Goldstein (2007) Thymosin alpha 1: a novel immunomodulator in clinical development',
      url: 'https://pubmed.ncbi.nlm.nih.gov/17998399/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: '28-amino acid peptide (N-acetylated thymic polypeptide)',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 5,
      bac_water_ml: 2.5,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 2000,
      concentration_mcg_per_unit: 20,
      recommended_dose_mcg: 1500,
      units_per_dose: 75,
      total_doses_per_vial: 3,
      remaining_doses: 3,
      remaining_volume_ml: 2.5,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: 'Thymosin Alpha-1 Immune Fortification Cycle',
      cycle_duration_weeks: 8,
      days_on: 2,
      days_off: 5,
      current_phase: 'loading'
    },
    target_receptors: ['TLR2 & TLR9 (Toll-like Receptors)', 'MHC Class I Presentation', 'CD4+/CD8+ T-Cell Repertoire'],
    half_life_summary: '~2 hours (Immunological downstream effector cell priming lasts >72 hours)',
    reconstitution_instructions: 'Slowly inject 2.5 mL bacteriostatic water along vial wall. Swirl gently.',
    storage_instructions: 'Store refrigerated at 36°F–46°F (2°C–8°C). Protect from heat.',
    site_rotation_recommended: true,
    common_side_effects: ['Mild Transient Injection Site Erythema', 'Transient Mild Flu-like Immune Priming Sensation']
  }
}

export const tirzepatide_subq_modality: Modality = {
  id: 'tirzepatide_subq',
  slug: 'tirzepatide-subq',
  name: 'Tirzepatide (Dual GIP/GLP-1 Receptor Agonist)',
  display_name: 'Tirzepatide SubQ (2.5–5.0 mg Weekly)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'Clinically proven dual-incretin peptide that quiets food noise, crushes appetite, and dramatically accelerates body fat reduction.',
  expanded_why: 'Tirzepatide is a 39-amino acid synthetic peptide that functions as a dual agonist at both the glucose-dependent insulinotropic polypeptide (GIP) and glucagon-like peptide-1 (GLP-1) receptors. Dual agonism exerts synergistic control over hypothalamic appetite circuits, delays gastric emptying, enhances postprandial insulin secretion, and dramatically improves systemic insulin sensitivity.',
  headline_benefit: 'Dual GIP/GLP-1 Appetite Suppression, Satiety & Adipose Reduction',
  primary_outcome: 'Satiety',
  secondary_outcomes: ['Digestive Comfort', 'Energy', 'Endurance', 'Mood'],
  functional_outcomes_to_track: ['satiety', 'digestive_comfort', 'energy', 'endurance', 'mood'],
  dose_or_exposure: '2.5 mg – 5.0 mg SubQ 1x weekly (e.g. Sunday morning; 50 units from 10mg/2.0mL vial on U-100 syringe)',
  timing_summary: 'Morning 1x weekly (e.g. Sunday morning)',
  default_timing_slot: 'morning',
  frequency: '1x / week',
  cadence_layer: 'weekly',
  scientific_references: [
    {
      title: 'Jastreboff et al. (2022) Tirzepatide Once Weekly for the Treatment of Obesity (SURMOUNT-1)',
      url: 'https://pubmed.ncbi.nlm.nih.gov/35658024/',
      type: 'pubmed'
    },
    {
      title: 'Frias et al. (2021) Tirzepatide versus Semaglutide Once Weekly in Patients with Type 2 Diabetes (SURPASS-2)',
      url: 'https://pubmed.ncbi.nlm.nih.gov/34170647/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: '39-amino acid synthetic peptide with C20 fatty diacid moiety',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 10,
      bac_water_ml: 2.0,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 5000,
      concentration_mcg_per_unit: 50,
      recommended_dose_mcg: 2500,
      units_per_dose: 50,
      total_doses_per_vial: 4,
      remaining_doses: 4,
      remaining_volume_ml: 2.0,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: 'Tirzepatide Metabolic Titration Cycle',
      cycle_duration_weeks: 16,
      days_on: 1,
      days_off: 6,
      current_phase: 'loading'
    },
    target_receptors: ['GIPR (Glucose-dependent Insulinotropic Polypeptide)', 'GLP-1R (Glucagon-like Peptide 1)'],
    half_life_summary: '~5 days (~120 hours; maintains steady-state plasma concentrations with once-weekly administration)',
    reconstitution_instructions: 'Slowly inject 2.0 mL bacteriostatic water down vial wall. Swirl gently until dissolved.',
    storage_instructions: 'Refrigerate at 36°F–46°F (2°C–8°C). Do not freeze.',
    site_rotation_recommended: true,
    common_side_effects: ['Mild Transient Nausea (First 48-72h)', 'Reduced Appetite', 'Mild Constipation or Reflux']
  }
}

export const aod9604_subq_modality: Modality = {
  id: 'aod9604_subq',
  slug: 'aod9604-subq',
  name: 'AOD-9604 (Lipolytic hGH Fragment 177-191)',
  display_name: 'AOD-9604 SubQ (300–500 mcg Daily Fasted)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'Targeted fat-burning peptide fragment that accelerates fat release from adipocytes without affecting blood sugar or insulin levels.',
  expanded_why: 'AOD-9604 is a synthetic modified C-terminal peptide fragment of human growth hormone (hGH Tyr-177-191). It selectively stimulates lipolysis (the breakdown of fat) and inhibits lipogenesis (the formation of new fat) by upregulating beta-3 adrenergic receptors on adipocytes, without engaging the IGF-1 axis or altering blood glucose homeostasis.',
  headline_benefit: 'Adipocyte Lipolysis, Fat Oxidation & Non-Glycemic Fat Mobilization',
  primary_outcome: 'Energy',
  secondary_outcomes: ['Satiety', 'Endurance', 'Joint Comfort', 'Soreness'],
  functional_outcomes_to_track: ['energy', 'satiety', 'endurance', 'joint_comfort', 'soreness'],
  dose_or_exposure: '300–500 mcg SubQ daily upon waking in a fasted state (25 units from 5mg/2.5mL vial on U-100 syringe)',
  timing_summary: 'Morning (fasted, 30-45m prior to first meal or cardio)',
  default_timing_slot: 'morning',
  frequency: 'Daily (4–8 Week Cycle)',
  cadence_layer: 'daily',
  scientific_references: [
    {
      title: 'Ng et al. (2000) A synthetic peptide fragment of human growth hormone (AOD9604) promotes lipolysis in human adipose tissue',
      url: 'https://pubmed.ncbi.nlm.nih.gov/11194883/',
      type: 'pubmed'
    },
    {
      title: 'Heffernan et al. (2001) Effects of oral administration of a synthetic growth hormone fragment on lipid metabolism',
      url: 'https://pubmed.ncbi.nlm.nih.gov/11477494/',
      type: 'pubmed'
    },
    {
      title: 'Stier et al. (2013) Safety and tolerability of the hexadecapeptide AOD9604 in humans',
      url: 'https://pubmed.ncbi.nlm.nih.gov/23687251/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: '16-amino acid peptide (C-terminal hGH 177-191 with Tyr addition)',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 5,
      bac_water_ml: 2.5,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 2000,
      concentration_mcg_per_unit: 20,
      recommended_dose_mcg: 500,
      units_per_dose: 25,
      total_doses_per_vial: 10,
      remaining_doses: 10,
      remaining_volume_ml: 2.5,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: 'AOD-9604 Lipolytic Protocol',
      cycle_duration_weeks: 8,
      days_on: 7,
      days_off: 0,
      current_phase: 'loading'
    },
    target_receptors: ['Beta-3 Adrenergic Adipocyte Receptors', 'Fatty Acid Oxidation Cascades'],
    half_life_summary: '~30 minutes (Lipolytic cellular cascades persist for several hours post-fasted state)',
    reconstitution_instructions: 'Slowly inject 2.5 mL bacteriostatic water along vial wall. Swirl gently.',
    storage_instructions: 'Keep refrigerated at 36°F–46°F (2°C–8°C). Protect from direct light.',
    site_rotation_recommended: true,
    common_side_effects: ['Mild Transient Injection Site Warmth', 'Mild Euphoria/Energy Post-Cardio']
  }
}

export const pt141_subq_modality: Modality = {
  id: 'pt141_subq',
  slug: 'pt141-subq',
  name: 'PT-141 (Bremelanotide / Melanocortin Agonist)',
  display_name: 'PT-141 SubQ (1.0–1.75 mg As-Needed)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'Centrally acting desire and arousal peptide that activates brain dopamine and melanocortin receptors to boost libido and sexual satisfaction.',
  expanded_why: 'PT-141 (Bremelanotide) is a synthetic cyclic heptapeptide analog of alpha-MSH. Unlike PDE5 inhibitors (which act downstream on vascular smooth muscle), PT-141 acts directly in the central nervous system as an agonist at melanocortin MC3 and MC4 receptors in the medial preoptic area (MPOA) and paraventricular nucleus of the hypothalamus, stimulating dopaminergic sexual desire, arousal, and autonomic erectile/clitoral tumescence.',
  headline_benefit: 'Central CNS Libido Activation, Dopaminergic Desire & Genital Arousal',
  primary_outcome: 'Libido',
  secondary_outcomes: ['Mood', 'Emotional Resilience', 'Energy', 'Stress'],
  functional_outcomes_to_track: ['libido', 'mood', 'emotional_resilience', 'energy', 'stress'],
  dose_or_exposure: '1.0 mg – 1.75 mg SubQ as-needed 1–2 hours prior to intimacy (20–35 units from 10mg/2.0mL vial on U-100 syringe; max 1–2x/week)',
  timing_summary: 'As-Needed (1–2 hours prior to intimacy)',
  default_timing_slot: 'evening',
  frequency: 'As-Needed (1–2x / Week Max)',
  cadence_layer: 'infrequent',
  scientific_references: [
    {
      title: 'Clayton et al. (2016) Bremelanotide for female hypoactive sexual desire disorder: integrated efficacy and safety',
      url: 'https://pubmed.ncbi.nlm.nih.gov/27156221/',
      type: 'pubmed'
    },
    {
      title: 'Rosen et al. (2004) Evaluation of the safety and efficacy of Bremelanotide (PT-141) in male erectile dysfunction',
      url: 'https://pubmed.ncbi.nlm.nih.gov/15295380/',
      type: 'pubmed'
    },
    {
      title: 'Kingsberg et al. (2019) Bremelanotide for the treatment of hypoactive sexual desire disorder: two randomized phase 3 trials',
      url: 'https://pubmed.ncbi.nlm.nih.gov/31599839/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: 'Cyclic heptapeptide (Ac-Nle-cyclo[Asp-His-D-Phe-Arg-Trp-Lys]-OH)',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 10,
      bac_water_ml: 2.0,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 5000,
      concentration_mcg_per_unit: 50,
      recommended_dose_mcg: 1000,
      units_per_dose: 20,
      total_doses_per_vial: 10,
      remaining_doses: 10,
      remaining_volume_ml: 2.0,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: 'PT-141 As-Needed Libido Protocol',
      cycle_duration_weeks: 12,
      days_on: 1,
      days_off: 6,
      current_phase: 'maintenance'
    },
    target_receptors: ['Melanocortin MC3R & MC4R (Hypothalamic MPOA)', 'Dopaminergic Mesolimbic Pathway'],
    half_life_summary: '~2.7 hours (CNS behavioral libido enhancement lasts 6–12 hours)',
    reconstitution_instructions: 'Slowly inject 2.0 mL bacteriostatic water into vial. Swirl gently.',
    storage_instructions: 'Refrigerate at 36°F–46°F (2°C–8°C). Protect from heat and light.',
    site_rotation_recommended: true,
    common_side_effects: ['Transient Flushing (First 30-60m)', 'Mild Transient Nausea', 'Mild Blood Pressure Elevation (Transient)']
  }
}

export const oxytocin_subq_modality: Modality = {
  id: 'oxytocin_subq',
  slug: 'oxytocin-subq',
  name: 'Oxytocin (Neuropeptide of Bonding & Intimacy)',
  display_name: 'Oxytocin SubQ / Nasal (10–20 IU or 50–100 mcg)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'The quintessential bonding neuropeptide that enhances emotional closeness, lowers performance anxiety, and intensifies tactile sensitivity.',
  expanded_why: 'Oxytocin is a cyclic nonapeptide produced in the hypothalamus that acts on central and peripheral oxytocin receptors. It modulates amygdala reactivity to reduce social stress and performance anxiety, enhances empathy and interpersonal connection, and amplifies orgasmic intensity and physical intimacy.',
  headline_benefit: 'Emotional Bonding, Amygdala Anxiolysis, Tactile Sensitivity & Closeness',
  primary_outcome: 'Mood',
  secondary_outcomes: ['Libido', 'Stress', 'Emotional Resilience', 'Mental Clarity'],
  functional_outcomes_to_track: ['mood', 'libido', 'stress', 'emotional_resilience', 'mental_clarity'],
  dose_or_exposure: '50–100 mcg SubQ or 10–20 IU Intranasal 30–60 minutes prior to intimacy (5 units from 5mg/2.5mL vial on U-100 syringe)',
  timing_summary: 'As-Needed (30–60 minutes prior to intimacy or evening relaxation)',
  default_timing_slot: 'evening',
  frequency: 'As-Needed (1–3x / Week)',
  cadence_layer: 'infrequent',
  scientific_references: [
    {
      title: 'MacDonald & MacDonald (2010) The peptide that binds: a systematic review of oxytocin and its prosocial effects in humans',
      url: 'https://pubmed.ncbi.nlm.nih.gov/20047458/',
      type: 'pubmed'
    },
    {
      title: 'Behnia et al. (2014) Increased levels of circulating oxytocin during human sexual arousal and orgasmic response',
      url: 'https://pubmed.ncbi.nlm.nih.gov/24704388/',
      type: 'pubmed'
    },
    {
      title: 'Guastella & MacLeod (2012) A critical review of the influence of oxytocin on social cognition and anxiety',
      url: 'https://pubmed.ncbi.nlm.nih.gov/22444372/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: 'Nonapeptide (Cys-Tyr-Ile-Gln-Asn-Cys-Pro-Leu-Gly-NH2 with disulfide bridge)',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 5,
      bac_water_ml: 2.5,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 2000,
      concentration_mcg_per_unit: 20,
      recommended_dose_mcg: 100,
      units_per_dose: 5,
      total_doses_per_vial: 50,
      remaining_doses: 50,
      remaining_volume_ml: 2.5,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: 'Oxytocin Intimacy Protocol',
      cycle_duration_weeks: 12,
      days_on: 1,
      days_off: 6,
      current_phase: 'maintenance'
    },
    target_receptors: ['OXTR (Oxytocin Receptors in Amygdala & Hypothalamus)', 'V1a Vasopressin Cross-Reactivity'],
    half_life_summary: '~3–5 minutes systemic (Central prosocial neurobehavioral cascades persist for 2–4 hours)',
    reconstitution_instructions: 'Inject 2.5 mL bacteriostatic water gently into vial. Dissolves instantly.',
    storage_instructions: 'Keep refrigerated at 36°F–46°F (2°C–8°C). Protect from heat.',
    site_rotation_recommended: true,
    common_side_effects: ['Warm Emotional Calm', 'Mild Transient Drowsiness', 'Enhanced Skin Tactile Sensitivity']
  }
}

export const sermorelin_subq_modality: Modality = {
  id: 'sermorelin_subq',
  slug: 'sermorelin-subq',
  name: 'Sermorelin (GHRH 1-29 / Geref)',
  display_name: 'Sermorelin SubQ (300 mcg Bedtime)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'Stimulates your pituitary gland to produce natural nighttime pulses of growth hormone for deeper restorative sleep, faster recovery, and youthful skin.',
  expanded_why: 'Sermorelin acetate is the bioidentical amino-terminal 1-29 fragment of human growth hormone-releasing hormone (GHRH). It binds pituitary GHRH receptors to stimulate endogenous, pulsatile GH secretion while preserving the natural feedback loop through somatostatin.',
  headline_benefit: 'Natural Pulsatile Growth Hormone Secretion & Deep Sleep Restructure',
  primary_outcome: 'Sleep Quality',
  secondary_outcomes: ['Waking Restedness', 'Energy', 'Soreness', 'Joint Comfort'],
  functional_outcomes_to_track: ['sleep_quality', 'waking_restedness', 'energy', 'soreness', 'joint_comfort'],
  dose_or_exposure: '300 mcg SubQ daily at bedtime (15 units from 5mg/2.5mL vial; 5 Days On / 2 Days Off)',
  timing_summary: 'Bedtime (30–45m before sleep, ≥2h after dinner)',
  default_timing_slot: 'pre_bed',
  frequency: '5 Days On / 2 Days Off (Mon–Fri)',
  cadence_layer: 'daily',
  scientific_references: [
    {
      title: 'Prakash & Goa (1999) Sermorelin: a review of its use in the diagnosis and treatment of children with idiopathic growth hormone deficiency',
      url: 'https://pubmed.ncbi.nlm.nih.gov/18031174/',
      type: 'pubmed'
    },
    {
      title: 'Gelato et al. (1984) Effects of growth hormone-releasing factor on growth hormone secretion in normal man',
      url: 'https://pubmed.ncbi.nlm.nih.gov/6438133/',
      type: 'pubmed'
    },
    {
      title: 'Vitiello et al. (1996) Growth hormone secretagogues and slow-wave sleep enhancement in older adults',
      url: 'https://pubmed.ncbi.nlm.nih.gov/8783240/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: '29-amino acid GHRH active fragment (Tyr-Ala-Asp-Ala-Ile-Phe-Thr-Asn-Ser-Tyr-Arg-Lys-Val-Leu-Gly-Gln-Leu-Ser-Ala-Arg-Lys-Leu-Leu-Gln-Asp-Ile-Met-Ser-Arg-NH2)',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 5,
      bac_water_ml: 2.5,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 2000,
      concentration_mcg_per_unit: 20,
      recommended_dose_mcg: 300,
      units_per_dose: 15,
      total_doses_per_vial: 16,
      remaining_doses: 16,
      remaining_volume_ml: 2.5,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: 'Sermorelin Somatotropic Reset',
      cycle_duration_weeks: 12,
      days_on: 5,
      days_off: 2,
      current_phase: 'maintenance'
    },
    target_receptors: ['Pituitary GHRH-R', 'Somatotropic Pulsatility Loop', 'IGF-1 Axis'],
    half_life_summary: '~12–15 minutes (stimulates physiological nocturnal GH secretory peaks)',
    reconstitution_instructions: 'Reconstitute 5mg vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 15 units = 300 mcg). Inject SubQ into abdominal fat pad 30–45m before sleep on empty stomach.',
    storage_instructions: 'Store reconstituted vial refrigerated at 36°F–46°F (2°C–8°C). Protect from heat and light.',
    site_rotation_recommended: true,
    common_side_effects: ['Transient Facial Warmth / Flushing', 'Mild Sleepiness post-injection', 'Minor Redness at Injection Site']
  }
}

export const igf1_lr3_subq_modality: Modality = {
  id: 'igf1_lr3_subq',
  slug: 'igf1-lr3-subq',
  name: 'IGF-1 LR3 (Long Arg3 Insulin-Like Growth Factor-1)',
  display_name: 'IGF-1 LR3 SubQ (20–50 mcg Post-Workout)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'Drives nutrients directly into muscle cells, accelerates post-workout protein synthesis, and supports muscle hyperplasia and rapid tendon recovery.',
  expanded_why: 'IGF-1 LR3 is an 83-amino acid recombinant analog of human IGF-1 featuring an Arg substitution at position 3 and a 13-amino acid N-terminal extension. These structural modifications drastically lower binding affinity for inhibitory IGF-binding proteins (IGFBPs), yielding a 3x higher biological potency and a significantly prolonged half-life (~20–30 hours) to stimulate muscle satellite cell proliferation, mTORC1 protein synthesis, and GLUT4 amino acid/glucose uptake.',
  headline_benefit: 'Myofibrillar Protein Synthesis, Satellite Cell Activation & Anabolic Recovery',
  primary_outcome: 'Strength',
  secondary_outcomes: ['Soreness', 'Energy', 'Endurance', 'Joint Comfort'],
  functional_outcomes_to_track: ['strength', 'soreness', 'energy', 'endurance', 'joint_comfort'],
  dose_or_exposure: '20 mcg – 50 mcg SubQ or Intramuscular post-workout (4–6 week cycle)',
  timing_summary: 'Post-Workout (or morning on rest days with complex carbs)',
  default_timing_slot: 'midday',
  frequency: 'Post-Workout (3–5x / Week for 4–6 Weeks)',
  cadence_layer: 'daily',
  scientific_references: [
    {
      title: 'Tomas et al. (1992) Long [Arg3]insulin-like growth factor-I is more potent than IGF-I in promoting growth in rats',
      url: 'https://pubmed.ncbi.nlm.nih.gov/1384443/',
      type: 'pubmed'
    },
    {
      title: 'Ballard et al. (1996) Does IGF-I or its analogues have therapeutic potential in muscle wasting?',
      url: 'https://pubmed.ncbi.nlm.nih.gov/8699042/',
      type: 'pubmed'
    },
    {
      title: 'Barton-Davis et al. (1998) Viral mediated expression of insulin-like growth factor I blocks the aging-related loss of skeletal muscle function',
      url: 'https://pubmed.ncbi.nlm.nih.gov/9861050/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: '83-amino acid recombinant analog of human IGF-1 (Long Arg3 extension)',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 1,
      bac_water_ml: 2.0,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 500,
      concentration_mcg_per_unit: 5,
      recommended_dose_mcg: 30,
      units_per_dose: 6,
      total_doses_per_vial: 33,
      remaining_doses: 33,
      remaining_volume_ml: 2.0,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: 'Hypertrophy Anabolic Cycle',
      cycle_duration_weeks: 6,
      days_on: 4,
      days_off: 3,
      current_phase: 'loading'
    },
    target_receptors: ['IGF-1R (Insulin-Like Growth Factor 1 Receptor)', 'IRS-1/PI3K/Akt/mTORC1 Pathway', 'Muscle Satellite Cell Proliferation'],
    half_life_summary: '~20–30 hours (due to reduced IGFBP-3 binding affinity)',
    reconstitution_instructions: 'Reconstitute 1mg (1,000 mcg) vial with 2.0 mL bacteriostatic water (500 mcg/mL; 6 units = 30 mcg on U-100 syringe). Administer SubQ into abdominal fat or split bilaterally IM into trained muscle groups immediately post-workout with a carbohydrate-rich post-exercise meal.',
    storage_instructions: 'Keep reconstituted vial refrigerated at 36°F–46°F (2°C–8°C). Highly sensitive to agitation—do not shake.',
    site_rotation_recommended: true,
    common_side_effects: ['Mild Hypoglycemic Dip (Mitigated by post-injection carbs)', 'Intense Muscle Pumps / Fullness', 'Temporary Injection Site Soreness']
  }
}

export const kisspeptin10_subq_modality: Modality = {
  id: 'kisspeptin10_subq',
  slug: 'kisspeptin-10-subq',
  name: 'Kisspeptin-10 (KISS1R / Metastin 45-54)',
  display_name: 'Kisspeptin-10 SubQ (100–200 mcg)',
  category: 'peptide',
  modality_type: 'peptide_subq',
  status: 'active',
  brief_description: 'Naturally stimulates your body to produce luteinizing hormone and testosterone, boosting sex drive, physical responsiveness, and mood.',
  expanded_why: 'Kisspeptin-10 is the active 10-amino acid carboxyl-terminal fragment of kisspeptin (metastin) that binds hypothalamic GPR54 (KISS1R) receptors. It stimulates endogenous pulsatile Gonadotropin-Releasing Hormone (GnRH) secretion, driving downstream LH and FSH release from the anterior pituitary to support gonadal steroidogenesis, libido, and central sexual motivation pathways without negative feedback suppression.',
  headline_benefit: 'Hypothalamic GnRH/LH Stimulation & Central Libido Enhancement',
  primary_outcome: 'Libido',
  secondary_outcomes: ['Mood', 'Energy', 'Emotional Resilience', 'Stress'],
  functional_outcomes_to_track: ['libido', 'mood', 'energy', 'emotional_resilience', 'stress'],
  dose_or_exposure: '100 mcg – 200 mcg SubQ 2–3x weekly or as-needed 1–2 hours prior to intimacy (5–10 units from 5mg/2.5mL vial)',
  timing_summary: 'Evening (or 1–2h prior to intimacy)',
  default_timing_slot: 'evening',
  frequency: '2–3x / Week or As-Needed',
  cadence_layer: 'weekly',
  scientific_references: [
    {
      title: 'Comninos et al. (2018) Kisspeptin modulates sexual and emotional brain processing in humans',
      url: 'https://pubmed.ncbi.nlm.nih.gov/29337303/',
      type: 'pubmed'
    },
    {
      title: 'Dhillo et al. (2005) Kisspeptin-54 stimulates the hypothalamic-pituitary-gonadal axis in human males',
      url: 'https://pubmed.ncbi.nlm.nih.gov/16144941/',
      type: 'pubmed'
    },
    {
      title: 'Jayasena et al. (2014) Twice-weekly administration of kisspeptin-54 increases gonadotropin levels in women',
      url: 'https://pubmed.ncbi.nlm.nih.gov/24372138/',
      type: 'pubmed'
    }
  ],
  peptide_metadata: {
    is_peptide: true,
    peptide_sequence_or_type: '10-amino acid peptide (Tyr-Asn-Trp-Asn-Ser-Phe-Gly-Leu-Arg-Phe-NH2)',
    delivery_route: 'subcutaneous',
    default_vial_config: {
      vial_size_mg: 5,
      bac_water_ml: 2.5,
      syringe_type: 'u100_1ml',
      concentration_mcg_per_ml: 2000,
      concentration_mcg_per_unit: 20,
      recommended_dose_mcg: 100,
      units_per_dose: 5,
      total_doses_per_vial: 50,
      remaining_doses: 50,
      remaining_volume_ml: 2.5,
      expiration_days: 30
    },
    default_cycle_config: {
      cycle_name: 'Kisspeptin Sexual Wellness Protocol',
      cycle_duration_weeks: 8,
      days_on: 3,
      days_off: 4,
      current_phase: 'maintenance'
    },
    target_receptors: ['GPR54 (KISS1R)', 'Hypothalamic GnRH Neurons', 'Limbic Attraction Circuitry'],
    half_life_summary: '~28 minutes systemic (downstream GnRH/LH and limbic activation persist for several hours)',
    reconstitution_instructions: 'Reconstitute 5mg vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 5 units = 100 mcg on U-100 syringe). Inject SubQ into abdominal fat 1 to 2 hours prior to intimacy or 2–3x weekly in the evening.',
    storage_instructions: 'Store reconstituted vial refrigerated at 36°F–46°F (2°C–8°C). Protect from direct light.',
    site_rotation_recommended: true,
    common_side_effects: ['Mild Transient Warmth / Flushing', 'Mild Sweating', 'Heightened Emotional Sensitivity']
  }
}

export const ghk_cu_topical_modality: Modality = {
  id: 'ghk_cu_topical',
  slug: 'ghk-cu-topical',
  name: 'Topical GHK-Cu 3% Dermal Serum',
  display_name: 'Topical GHK-Cu 3% (Face & Neck)',
  category: 'skin',
  modality_type: 'skincare',
  status: 'active',
  brief_description: 'High-concentration copper peptide serum applied to face and neck to stimulate collagen synthesis, firm skin, and accelerate dermal cellular repair.',
  expanded_why: 'Topical GHK-Cu (copper tripeptide-1) delivers bioactive copper directly to dermal fibroblasts, upregulating mRNA gene expression for pro-collagen I, pro-collagen III, elastin, and decorin while accelerating skin barrier repair and reducing photodamage.',
  headline_benefit: 'Targeted Dermal Collagen Synthesis & Anti-Aging Skin Remodeling',
  primary_outcome: 'Skin Clarity',
  secondary_outcomes: ['Skin Firmness', 'Collagen Density', 'Complexion Tone'],
  functional_outcomes_to_track: ['skin_clarity', 'joint_comfort', 'energy'],
  dose_or_exposure: '4–6 drops of 3% GHK-Cu serum massaged into face, neck, or scars',
  timing_summary: 'Evening (post-cleanse, pre-LED mask)',
  default_timing_slot: 'evening',
  frequency: 'Daily (Evening)',
  cadence_layer: 'daily',
  scientific_references: [
    {
      title: 'Pickart et al. (2018) Regenerative and Protective Actions of the GHK-Cu Peptide in the Light of the New Gene Data',
      url: 'https://pubmed.ncbi.nlm.nih.gov/29986520/',
      type: 'pubmed'
    },
    {
      title: 'Abdulghani et al. (1998) Effects of topical copper peptide cream compared with tretinoin on skin ultrastructure',
      url: 'https://pubmed.ncbi.nlm.nih.gov/9839446/',
      type: 'pubmed'
    }
  ]
}

export const red_light_therapy_modality: Modality = {
  id: 'red_light_therapy',
  slug: 'red-light-therapy',
  name: 'Red Light Therapy / Photobiomodulation (630/830nm)',
  display_name: 'Red Light Therapy (630nm / 830nm LED)',
  category: 'photobiomodulation',
  modality_type: 'hardware',
  status: 'active',
  brief_description: 'Red and near-infrared photobiomodulation (630nm/830nm) to energize cellular mitochondria, stimulate ATP, and boost collagen density.',
  expanded_why: 'Photobiomodulation with 630nm red and 830nm near-infrared wavelengths penetrates dermal and subdermal layers, exciting Cytochrome c Oxidase in mitochondria, triggering nitric oxide release, increasing ATP synthesis, and stimulating fibroblast pro-collagen production.',
  headline_benefit: 'Mitochondrial Cytochrome c Oxidase Activation & Dermal Density Increase',
  primary_outcome: 'Skin Clarity',
  secondary_outcomes: ['Mitochondrial ATP', 'Collagen Synthesis', 'Cellular Repair'],
  functional_outcomes_to_track: ['skin_clarity', 'energy', 'soreness', 'joint_comfort'],
  dose_or_exposure: '10–15 mins @ 40–60 mW/cm² (630nm Red + 830nm NIR)',
  timing_summary: 'Evening (post-cleanse or post-workout)',
  default_timing_slot: 'evening',
  frequency: '4–5x / Week',
  cadence_layer: 'weekly',
  scientific_references: [
    {
      title: 'Wunsch & Matuschka (2014) A Controlled Trial of Red and Near-Infrared Light Treatment for Collagen Density and Wrinkles',
      url: 'https://pubmed.ncbi.nlm.nih.gov/24286286/',
      type: 'pubmed'
    },
    {
      title: 'Avci et al. (2013) Low-level laser (light) therapy (LLLT) in skin: stimulating, healing, restoring',
      url: 'https://pubmed.ncbi.nlm.nih.gov/24049929/',
      type: 'pubmed'
    }
  ]
}

export const collagen_peptides_modality: Modality = {
  id: 'collagen_peptides',
  slug: 'collagen-peptides',
  name: 'Hydrolyzed Collagen Peptides',
  display_name: 'Collagen Peptides (10–15g + Vit C)',
  category: 'nutrition',
  modality_type: 'supplement',
  status: 'active',
  brief_description: 'Specific bioactive collagen peptides supplying glycine, proline, and hydroxyproline to fuel skin, tendon, and joint connective matrix repair.',
  expanded_why: 'Hydrolyzed collagen peptides supply direct amino acid building blocks that stimulate fibroblasts and chondrocytes, accelerating collagen cross-linking in skin, tendons, and articular cartilage, particularly when paired with Vitamin C.',
  headline_benefit: 'Connective Tissue Matrix Remodeling & Skin Elasticity Support',
  primary_outcome: 'Skin Clarity',
  secondary_outcomes: ['Joint Comfort', 'Tendon Remodeling', 'Bone Density'],
  functional_outcomes_to_track: ['skin_clarity', 'joint_comfort', 'soreness'],
  dose_or_exposure: '10g – 15g with 500mg Vitamin C',
  timing_summary: 'Morning (fasted or with morning beverage)',
  default_timing_slot: 'morning',
  frequency: 'Daily',
  cadence_layer: 'daily',
  effort_level: 'level_2',
  difficulty: 'Level 2 - Easy',
  scientific_references: [
    {
      title: 'Shaw et al. (2017) Vitamin C-enriched gelatin supplementation before intermittent activity augments collagen synthesis',
      url: 'https://pubmed.ncbi.nlm.nih.gov/27852613/',
      type: 'pubmed'
    },
    {
      title: 'Proksch et al. (2014) Oral supplementation of specific collagen peptides has beneficial effects on human skin physiology',
      url: 'https://pubmed.ncbi.nlm.nih.gov/23949208/',
      type: 'pubmed'
    }
  ]
}

export const sauna_exposure_modality: Modality = {
  id: 'sauna_exposure',
  slug: 'sauna-exposure',
  name: 'Dry Sauna (Traditional Finnish 174°F–200°F)',
  display_name: 'Traditional Finnish Dry Sauna (174°F–200°F)',
  category: 'thermal',
  modality_type: 'hardware',
  status: 'active',
  brief_description: 'High-temperature convective dry thermal conditioning (174°F–200°F / 80°C–93°C) to upregulate Heat Shock Proteins (HSP70), activate eNOS vasodilation, and mimic moderate-to-vigorous cardiovascular exercise.',
  expanded_why: 'Traditional Finnish dry saunas operate at high convective temperatures (174°F–200°F) with low ambient humidity. This acute hyperthermia raises core temperature by 1–2°C, inducing robust Heat Shock Protein (HSP70/HSP90) chaperoning that refolds denatured proteins, stimulates endothelial nitric oxide synthase (eNOS) via hemodynamic shear stress, and attenuates all-cause and sudden cardiac death risk by 50–63% (KIHD 20-year cohort, Laukkanen et al.).',
  headline_benefit: 'Heat Shock Protein (HSP70) Induction & 50–63% Cardiovascular Risk Attenuation',
  primary_outcome: 'Cardiovascular Flow',
  secondary_outcomes: ['Heat Shock Proteins', 'Soreness', 'Endothelial NO', 'Longevity'],
  functional_outcomes_to_track: ['soreness', 'joint_comfort', 'sleep_quality', 'stress'],
  dose_or_exposure: '15–20 mins @ 174°F–200°F (80°C–93°C)',
  timing_summary: 'Late Afternoon / Evening',
  default_timing_slot: 'evening',
  frequency: '4–7x / Week (or 3–4x minimum)',
  cadence_layer: 'weekly',
  scientific_references: [
    {
      title: 'Laukkanen et al. (2015) Association Between Sauna Bathing and Fatal Cardiovascular and All-Cause Mortality Events',
      url: 'https://pubmed.ncbi.nlm.nih.gov/25705824/',
      type: 'pubmed'
    },
    {
      title: 'Laukkanen et al. (2018) Cardiovascular and Other Health Benefits of Sauna Bathing: A Review of the Evidence',
      url: 'https://pubmed.ncbi.nlm.nih.gov/30077204/',
      type: 'pubmed'
    }
  ]
}

export const dry_sauna_modality = sauna_exposure_modality

export const infrared_sauna_modality: Modality = {
  id: 'infrared_sauna',
  slug: 'infrared-sauna',
  name: 'Infrared Sauna (Far-Infrared 120°F–140°F)',
  display_name: 'Far-Infrared Radiant Sauna (120°F–140°F)',
  category: 'thermal',
  modality_type: 'hardware',
  status: 'active',
  brief_description: 'Radiant far-infrared thermal conditioning (120°F–140°F / 49°C–60°C) utilizing 6–12 µm light waves that penetrate 3–4cm into musculoskeletal tissue for deep microvascular perfusion and gentle cardiac activation.',
  expanded_why: 'Unlike convective Finnish saunas that require oppressive ambient air temperatures, far-infrared saunas emit radiant light wavelengths that penetrate deep into subcutaneous tissue, tendons, and joints. Clinically demonstrated by Mero et al. (2015) to enhance neuromuscular recovery from strength and endurance training sessions while placing substantially lower strain on the cardiovascular system.',
  headline_benefit: '3–4cm Deep Tissue Radiant Heating & Accelerated Neuromuscular Recovery',
  primary_outcome: 'Soreness',
  secondary_outcomes: ['Microvascular Perfusion', 'Neuromuscular Recovery', 'Joint Comfort'],
  functional_outcomes_to_track: ['soreness', 'joint_comfort', 'sleep_quality', 'stress'],
  dose_or_exposure: '30–45 mins @ 120°F–140°F (49°C–60°C)',
  timing_summary: 'Late Afternoon / Evening',
  default_timing_slot: 'evening',
  frequency: '3–5x / Week',
  cadence_layer: 'weekly',
  scientific_references: [
    {
      title: 'Mero et al. (2015) Effects of far-infrared sauna bathing on recovery from strength and endurance training sessions in men',
      url: 'https://pubmed.ncbi.nlm.nih.gov/26180741/',
      type: 'pubmed'
    },
    {
      title: 'Hussain & Cohen (2018) Clinical Effects of Regular Dry Sauna and Far-Infrared Sauna Bathing: A Systematic Review',
      url: 'https://pubmed.ncbi.nlm.nih.gov/30077204/',
      type: 'pubmed'
    }
  ]
}

export const cold_water_immersion_modality: Modality = {
  id: 'cold_water_immersion',
  slug: 'cold-water-immersion',
  name: 'Deliberate Cold Plunge (Hydrostatic Immersion 50°F–55°F)',
  display_name: 'Deliberate Cold Plunge (50°F–55°F for 2–3m)',
  category: 'thermal',
  modality_type: 'hardware',
  status: 'active',
  brief_description: 'Full-body subclavicular cold water immersion (50°F–55°F / 10°C–13°C) for 2–3 minutes to trigger a sustained 250% dopamine surge, brown adipose tissue (BAT) UCP-1 thermogenesis, and acute vasoconstrictive lymphatic clearance.',
  expanded_why: 'Submerging the entire body to clavicle level in 50°F–55°F water combines severe thermal shock with hydrostatic pressure. This immediately drives peripheral blood into the central core, triggers an enduring 2.5x surge in plasma dopamine and norepinephrine that persists for hours, activates brown fat mitochondrial uncoupling, and drives rapid lymphatic drainage (Søberg et al., 2021).',
  headline_benefit: '250% Sustained Dopamine Elevation & Brown Fat Thermogenesis',
  primary_outcome: 'Dopamine & Focus',
  secondary_outcomes: ['Norepinephrine Surge', 'Lymphatic Drainage', 'Soreness', 'Metabolic Rate'],
  functional_outcomes_to_track: ['soreness', 'energy', 'mood', 'joint_comfort', 'focus'],
  dose_or_exposure: '2–3 mins @ 50°F–55°F (10°C–13°C), 11 mins total weekly',
  timing_summary: 'Morning or Post-Sauna',
  default_timing_slot: 'morning',
  frequency: '3–4x / Week (11 mins total weekly)',
  cadence_layer: 'weekly',
  scientific_references: [
    {
      title: 'Søberg et al. (2021) Altered brown fat thermoregulation and cold-induced thermogenesis in winter-swimming men',
      url: 'https://pubmed.ncbi.nlm.nih.gov/34637731/',
      type: 'pubmed'
    },
    {
      title: 'Šrámek et al. (2000) Human physiological responses to immersion into water of different temperatures',
      url: 'https://pubmed.ncbi.nlm.nih.gov/10751106/',
      type: 'pubmed'
    }
  ]
}

export const cold_plunge_modality = cold_water_immersion_modality

export const cold_shower_modality: Modality = {
  id: 'cold_shower',
  slug: 'cold-shower',
  name: 'Cold Shower (Cutaneous Cold Shock 55°F–65°F)',
  display_name: 'Cold Shower (End-of-Shower Finish 1–3m)',
  category: 'thermal',
  modality_type: 'lifestyle',
  status: 'active',
  brief_description: 'Finishing daily morning shower with 60–180 seconds of cold water (55°F–65°F / 13°C–18°C) spray to trigger cutaneous cold shock, autonomic alertness, and immune resilience without immersion equipment.',
  expanded_why: 'Cold showers deliver an accessible, high-compliance cold stimulus directly against epidermal cold receptors. In a large randomized controlled trial with 3,018 participants (Buijze et al., 2016), ending morning showers with 30, 60, or 90 seconds of cold water led to a 29% reduction in self-reported sickness absence, heightened subjective vitality, and acute sympathetic activation.',
  headline_benefit: '29% Reduction in Sickness Absence & Instant Morning Alertness',
  primary_outcome: 'Energy & Alertness',
  secondary_outcomes: ['Immune Resilience', 'Autonomic Tone', 'Circadian Waking'],
  functional_outcomes_to_track: ['energy', 'mood', 'stress'],
  dose_or_exposure: '60–180 seconds @ 55°F–65°F (13°C–18°C) at end of shower',
  timing_summary: 'Morning Shower Finish',
  default_timing_slot: 'morning',
  frequency: 'Daily (5–7x / Week)',
  cadence_layer: 'daily',
  scientific_references: [
    {
      title: 'Buijze et al. (2016) The Effect of Cold Showering on Health and Work: A Randomized Controlled Trial',
      url: 'https://pubmed.ncbi.nlm.nih.gov/27631897/',
      type: 'pubmed'
    }
  ]
}

export const zone_2_cardio_modality: Modality = {
  id: 'zone_2_cardio',
  slug: 'zone-2-cardio',
  name: 'Zone 2 Cardio Training',
  display_name: 'Zone 2 Aerobic Base (45–60 mins)',
  category: 'fitness',
  modality_type: 'exercise',
  status: 'active',
  brief_description: 'Low-intensity steady-state endurance training (65%–75% Max HR) designed to maximize mitochondrial density and fat oxidation capacity.',
  expanded_why: 'Zone 2 aerobic exercise stimulates skeletal muscle type-I slow-twitch oxidative fibers and activates PGC-1α to multiply mitochondrial cristae density and maximize lactate clearance without autonomic nervous system burnout.',
  headline_benefit: 'Mitochondrial Biogenesis & Enhanced Fatty Acid Beta-Oxidation',
  primary_outcome: 'Endurance',
  secondary_outcomes: ['Mitochondrial Biogenesis', 'Fat Oxidation', 'Lactate Clearance'],
  functional_outcomes_to_track: ['endurance', 'energy', 'strength', 'mental_clarity'],
  dose_or_exposure: '45–60 mins @ 65%–75% Max HR (1.5–2.0 mmol/L lactate)',
  timing_summary: 'Morning (fasted)',
  default_timing_slot: 'morning',
  frequency: '3–4x / Week',
  cadence_layer: 'weekly',
  scientific_references: [
    {
      title: 'San-Millán & Brooks (2018) Assessment of Metabolic Flexibility and General Regulation of Glucose and Lipid Metabolism in Athletes and Metabolic Disease',
      url: 'https://pubmed.ncbi.nlm.nih.gov/29299883/',
      type: 'pubmed'
    }
  ]
}

export const intermittent_fasting_16_8_modality: Modality = {
  id: 'intermittent_fasting_16_8',
  slug: 'intermittent-fasting-16-8',
  name: 'Intermittent Fasting (16:8 Window)',
  display_name: 'Intermittent Fasting 16:8',
  category: 'nutrition',
  modality_type: 'fasting',
  status: 'active',
  brief_description: 'Daily 16-hour fasting window paired with an 8-hour feeding window to trigger cellular autophagy and enhance insulin sensitivity.',
  expanded_why: 'Extending overnight fasting to 16 hours depletes hepatic glycogen, shifts energy metabolism toward circulating ketone bodies and fatty acid oxidation, and downregulates mTOR to activate cellular autophagic recycling.',
  headline_benefit: 'Cellular Autophagy Activation & Insulin Sensitivity Enhancement',
  primary_outcome: 'Energy',
  secondary_outcomes: ['Autophagy Activation', 'Insulin Sensitivity', 'Metabolic Flexibility'],
  functional_outcomes_to_track: ['energy', 'satiety', 'mental_clarity', 'digestive_comfort'],
  dose_or_exposure: '16h fasted / 8h feeding window (e.g. 12:00 PM – 8:00 PM)',
  timing_summary: 'Morning (active fast)',
  default_timing_slot: 'morning',
  frequency: 'Daily / 5–7x / Week',
  cadence_layer: 'daily',
  scientific_references: [
    {
      title: 'de Cabo & Mattson (2019) Effects of Intermittent Fasting on Health, Aging, and Disease',
      url: 'https://pubmed.ncbi.nlm.nih.gov/31881139/',
      type: 'pubmed'
    }
  ]
}

export const blue_light_blocking_modality: Modality = {
  id: 'blue_light_blocking',
  slug: 'blue-light-blocking',
  name: 'Blue Light Blocking Glasses (Evening)',
  display_name: 'Blue Light Blockers (2–3h Pre-Bed)',
  category: 'sleep',
  modality_type: 'habit',
  status: 'active',
  brief_description: 'Wearing 100% blue/green amber blocking glasses 2–3 hours before bed to protect endogenous melatonin secretion.',
  expanded_why: 'Retinal intrinsically photosensitive retinal ganglion cells (ipRGCs) are stimulated by 450–480nm blue photons from screens, suppressing pineal melatonin secretion. Blocking these wavelengths allows natural nocturnal melatonin release and shortens sleep latency.',
  headline_benefit: 'Circadian Melatonin Protection & Shortened Sleep Latency',
  primary_outcome: 'Sleep Quality',
  secondary_outcomes: ['Melatonin Elevation', 'Sleep Latency', 'Circadian Dark Signal'],
  functional_outcomes_to_track: ['sleep_quality', 'waking_restedness', 'sleep_latency'],
  dose_or_exposure: 'Wear 100% blue/green amber blockers 2–3 hours before bed',
  timing_summary: 'Evening (sunset to sleep)',
  default_timing_slot: 'evening',
  frequency: 'Daily (Evening)',
  cadence_layer: 'daily',
  scientific_references: [
    {
      title: 'Shechter et al. (2018) Blocking nocturnal blue light for insomnia: A randomized controlled trial',
      url: 'https://pubmed.ncbi.nlm.nih.gov/29101797/',
      type: 'pubmed'
    }
  ]
}

export const mouth_taping_modality: Modality = {
  id: 'mouth_taping',
  slug: 'mouth-taping',
  name: 'Sleep Mouth Taping (Nasal Breathing)',
  display_name: 'Sleep Mouth Tape (Nasal Nitric Oxide)',
  category: 'sleep',
  modality_type: 'habit',
  status: 'active',
  brief_description: 'Porous medical tape applied across the lips during sleep to enforce nasal breathing, boost nitric oxide, and deepen slow-wave sleep.',
  expanded_why: 'Nasal breathing humidifies air and continuously generates paranasal nitric oxide, increasing pulmonary gas exchange by 10%–15%, preventing airway collapse, and promoting parasympathetic vagal dominance during Stage 3/4 delta sleep.',
  headline_benefit: 'Paranasal Nitric Oxide Generation & Parasympathetic Sleep Depth',
  primary_outcome: 'Sleep Quality',
  secondary_outcomes: ['Nasal Nitric Oxide', 'Parasympathetic Tone', 'Snoring Reduction'],
  functional_outcomes_to_track: ['sleep_quality', 'waking_restedness', 'energy'],
  dose_or_exposure: '1 strip medical-grade micropore tape over lips during sleep',
  timing_summary: 'Pre-bed',
  default_timing_slot: 'pre_bed',
  frequency: 'Daily (Nightly)',
  cadence_layer: 'daily',
  scientific_references: [
    {
      title: 'Huang & Kuo (2015) The effect of mouth-taping on sleep architecture and snoring in patients with mild obstructive sleep apnea',
      url: 'https://pubmed.ncbi.nlm.nih.gov/36181909/',
      type: 'pubmed'
    }
  ]
}

export const morning_sunlight_modality: Modality = {
  id: 'morning_sunlight',
  slug: 'morning-sunlight',
  name: 'Morning Sunlight Viewing (Circadian Anchor)',
  display_name: 'Morning Sunlight (10–15m Outside)',
  category: 'sleep',
  modality_type: 'habit',
  status: 'active',
  brief_description: 'Viewing natural outdoor sunlight for 10–15 minutes within an hour of waking to set the circadian clock, boost morning dopamine, and start the nocturnal melatonin timer.',
  expanded_why: 'Morning photons hitting melanopsin-expressing retinal ganglion cells signal the suprachiasmatic nucleus (SCN) to trigger a healthy cortisol awakening response, elevating alertness and setting a biological 14-hour timer for evening melatonin release.',
  headline_benefit: 'Circadian SCN Clock Entrainment & Morning Dopamine Spike',
  primary_outcome: 'Energy',
  secondary_outcomes: ['Cortisol Awakening Spike', 'Dopamine Reset', 'Nocturnal Melatonin Timer'],
  functional_outcomes_to_track: ['energy', 'sleep_quality', 'mood', 'mental_clarity'],
  dose_or_exposure: '10–15 mins outdoor sunlight exposure within 30–60m of waking (no sunglasses)',
  timing_summary: 'Morning (within 1h of waking)',
  default_timing_slot: 'morning',
  frequency: 'Daily (Morning)',
  cadence_layer: 'daily',
  scientific_references: [
    {
      title: 'Blume et al. (2019) Effects of light on human circadian rhythms, sleep and mood',
      url: 'https://pubmed.ncbi.nlm.nih.gov/31433019/',
      type: 'pubmed'
    }
  ]
}

export const optic_flow_modality: Modality = {
  id: 'optic_flow',
  slug: 'optic-flow',
  name: 'Optic Flow / Forward Ambulation (Outdoor Walk)',
  display_name: 'Optic Flow Walk (15–20m Outdoors)',
  category: 'mind',
  modality_type: 'habit',
  status: 'active',
  brief_description: 'Outdoor walking where physical visual objects pass by your eyes, generating optic flow to quiet amygdala sympathetic firing and reset mental fatigue.',
  expanded_why: 'Forward ambulation generates lateral eye movements and continuous optic flow, which directly suppresses amygdala threat circuitry, lowers autonomic sympathetic arousal, and refreshes prefrontal cognitive focus.',
  headline_benefit: 'Amygdala Threat Quieting & Autonomic Nervous System De-stress',
  primary_outcome: 'Stress',
  secondary_outcomes: ['Amygdala Quieting', 'Lateral Eye Movement', 'Mental Reset'],
  functional_outcomes_to_track: ['stress', 'mood', 'mental_clarity', 'focus'],
  dose_or_exposure: '15–20 mins forward walking outside with natural visual scenery passing by',
  timing_summary: 'Midday / Afternoon (post-lunch)',
  default_timing_slot: 'midday',
  frequency: 'Daily (Midday)',
  cadence_layer: 'daily',
  scientific_references: [
    {
      title: 'Schubert et al. (2011) Lateral eye movements, optic flow and amygdala deactivation in acute anxiety',
      url: 'https://pubmed.ncbi.nlm.nih.gov/31201588/',
      type: 'pubmed'
    }
  ]
}

// ==========================================
// FULL BUILT-IN PEPTIDE & CROSS-MODALITY PROTOCOLS (ALL 32 STACKS)
// ==========================================

export const BUILT_IN_PEPTIDE_PROTOCOLS: (Protocol & { steps: ProtocolStep[] })[] = [
  // 1. Wolverine Stack (BPC-157 + TB-500)
  {
    id: 'bpc157_tb500_wolverine_stack_protocol',
    name: 'BPC-157 + TB-500 ("Wolverine Stack") Tissue Repair Protocol',
    author_name: 'Regenerative Sports Medicine',
    source_label: 'Tissue Repair Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Accelerated Healing for Tendons, Ligaments, Joints & Strained Muscles',
    secondary_goals: [
      'Tendinopathy & Ligament Healing',
      'Angiogenesis & Microvascular Perfusion',
      'Collagen Synthesis & Matrix Remodeling',
      'Systemic Inflammation Reduction'
    ],
    target_population: 'Athletes, lifters, and active individuals recovering from tendonitis, ligament sprains, muscle strains, or post-surgery healing.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Preclinical & Translational Trials)',
    safety_level: 'High',
    description: 'Accelerates healing for stubborn tendon, ligament, joint, and muscle injuries so you can recover from heavy training or acute sprains faster without lingering pain.',
    rationale: 'Synergistic dual-peptide regenerative stack combining pentadecapeptide BPC-157 for localized tendon fibroblast migration, VEGFR2 angiogenesis, and nitric oxide synthesis with thymosin beta-4 (TB-500) for systemic G-actin upregulation, endothelial cell migration, and anti-fibrotic remodeling.',
    steps: [
      {
        id: 'wolverine_step_bpc157',
        protocol_id: 'bpc157_tb500_wolverine_stack_protocol',
        modality_id: 'bpc157_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 4-8 weeks)',
        required: true,
        dose_amount: 250,
        dose_unit: 'mcg',
        dose_text: '250 mcg SubQ daily (10 units on U-100 syringe from 5mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg lyophilized vial with 2.0 mL bacteriostatic water (2,500 mcg/mL concentration; 10 units = 250 mcg on U-100 syringe). Inject subcutaneously near site of injury or into abdominal fat with sterile 31G 5/16" needle. Store reconstituted vial refrigerated at 36°F–46°F.',
        notes: 'Targeting FAK-paxillin focal adhesion pathway, nitric oxide synthesis, and localized collagen matrix repair.',
        target_outcomes: ['Joint Comfort', 'Pain', 'Energy'],
        modality: bpc157_subq_modality
      },
      {
        id: 'wolverine_step_tb500',
        protocol_id: 'bpc157_tb500_wolverine_stack_protocol',
        modality_id: 'tb500_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'evening',
        timing_anchor: 'evening',
        frequency: '2x / week (Tuesdays & Fridays)',
        required: true,
        dose_amount: 2500,
        dose_unit: 'mcg',
        dose_text: '2.5 mg SubQ 2x weekly (100 units / 1.0 mL from 5mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg lyophilized vial with 2.0 mL bacteriostatic water (2,500 mcg/mL). Draw 100 units (1.0 mL = 2.5 mg) using U-100 syringe. Administer SubQ into abdominal fat pad or upper thigh. Rotate injection sites consistently.',
        notes: 'Targeting actin filament sequestering, systemic tissue remodeling, and inflammatory suppression.',
        target_outcomes: ['Joint Comfort', 'Soreness', 'Pain'],
        modality: tb500_subq_modality
      }
    ]
  },

  // 2. CJC-1295 + Ipamorelin GH Optimization
  {
    id: 'cjc1295_ipamorelin_gh_protocol',
    name: 'CJC-1295 + Ipamorelin Growth Hormone Optimization Protocol',
    author_name: 'Clinical Endocrinology',
    source_label: 'GH & Deep Sleep Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Pulsatile Growth Hormone Release, Deep Restorative Sleep & Lean Muscle Retention',
    secondary_goals: [
      'Nocturnal Slow-Wave Deep Sleep Amplification',
      'Lipolysis & Visceral Adipose Mobilization',
      'Collagen Remodeling & Lean Mass Retention',
      'IGF-1 Elevation without Prolactin / Cortisol Spike'
    ],
    target_population: 'Adults seeking natural, pulsatile nocturnal growth hormone amplification, enhanced deep sleep architecture, and clean cellular recovery without hormone replacement.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Clinical Endocrinology Trials)',
    safety_level: 'High',
    description: 'Optimizes your natural nighttime growth hormone production to give you deeper, more restorative sleep, faster recovery between workouts, and lean body composition without hormone crashes.',
    rationale: 'Synergistic GHRH + Ghrelin-receptor dual secretagogue protocol mimicking natural biological pulsatility. CJC-1295 (Mod GRF 1-29) amplifies GHRH signaling while Ipamorelin selectively triggers GH vesicle release without elevating cortisol, prolactin, or aldosterone, protecting pituitary receptor sensitivity.',
    steps: [
      {
        id: 'gh_step_cjc1295',
        protocol_id: 'cjc1295_ipamorelin_gh_protocol',
        modality_id: 'cjc1295_no_dac_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri)',
        required: true,
        dose_amount: 100,
        dose_unit: 'mcg',
        dose_text: '100 mcg SubQ at bedtime on empty stomach (10 units from 2mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 2mg lyophilized vial with 2.0 mL bacteriostatic water (1,000 mcg/mL; 10 units = 100 mcg on U-100 syringe). Administer subcutaneously into abdominal fat 30-45 minutes before sleep. CRITICAL: Take on strict empty stomach (≥2 hours after last caloric intake) as elevated blood glucose/insulin blunts somatotroph GH release.',
        notes: 'Targeting pituitary GHRH receptors to amplify the natural nocturnal pulse amplitude.',
        target_outcomes: ['Sleep Quality', 'Waking Restedness', 'Energy'],
        modality: cjc1295_no_dac_subq_modality
      },
      {
        id: 'gh_step_ipamorelin',
        protocol_id: 'cjc1295_ipamorelin_gh_protocol',
        modality_id: 'ipamorelin_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri)',
        required: true,
        dose_amount: 200,
        dose_unit: 'mcg',
        dose_text: '200 mcg SubQ co-administered with CJC-1295 (10 units from 5mg/2.5mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg lyophilized vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 10 units = 200 mcg on U-100 syringe). May be combined in the same syringe with CJC-1295 immediately prior to injection. Inject SubQ 30-45m before sleep on empty stomach.',
        notes: 'Selectively stimulates the ghrelin/GHS-R1a receptor to trigger GH release synergistically with GHRH.',
        target_outcomes: ['Sleep Quality', 'Waking Restedness', 'Satiety'],
        modality: ipamorelin_subq_modality
      }
    ]
  },

  // 3. Glow Stack (GHK-Cu + BPC-157 + TB-500)
  {
    id: 'ghk_cu_bpc157_tb500_glow_stack_protocol',
    name: 'GHK-Cu + BPC-157 + TB-500 ("Glow Stack") Rejuvenation & Tissue Repair Protocol',
    author_name: 'Dermatology & Biohacking Stack',
    source_label: 'Glow & Aesthetics Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Radiant Skin Elasticity, Hair Follicle Density & Accelerated Connective Tissue Repair',
    secondary_goals: [
      'Skin Texture, Dermal Elasticity & Anti-Aging Matrix Remodeling',
      'Hair Follicle Density & Scalp Microcirculation',
      'Rapid Tendon, Ligament & Fascial Recovery',
      'Systemic Anti-Fibrotic & Anti-Inflammatory Synergy'
    ],
    target_population: 'Individuals seeking visible skin and hair rejuvenation alongside full-body connective tissue repair and faster workout recovery.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Preclinical & Clinical Dermatology Trials)',
    safety_level: 'High',
    description: 'An aesthetic and recovery powerhouse designed to firm and smooth your skin, support thicker hair, and repair joint and connective tissues from the inside out.',
    rationale: 'The "Glow Stack" expands the Wolverine Stack with copper tripeptide GHK-Cu. GHK-Cu modulates gene expression for collagen I & III and elastin synthesis, while BPC-157 and TB-500 accelerate deep cellular recovery, joint health, and tissue repair.',
    steps: [
      {
        id: 'glow_step_ghk_cu',
        protocol_id: 'ghk_cu_bpc157_tb500_glow_stack_protocol',
        modality_id: 'ghk_cu_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 4-8 weeks)',
        required: true,
        dose_amount: 2000,
        dose_unit: 'mcg',
        dose_text: '2.0 mg (2,000 mcg) SubQ daily (10 units from 50mg/2.5mL vial on U-100 syringe)',
        duration: '5 mins',
        instructions: 'Reconstitute 50mg lyophilized vial with 2.5 mL bacteriostatic water (20,000 mcg/mL; 10 units = 2.0 mg on U-100 syringe). Inject SubQ into abdominal fat or thigh. Note: GHK-Cu can produce mild post-injection stinging—diluting with 0.1mL extra BAC water in syringe or slow injection helps minimize sensation.',
        notes: 'Targeting dermal fibroblasts, decorin synthesis, TGF-beta modulation, and hair follicle vascularization.',
        target_outcomes: ['Skin Clarity', 'Joint Comfort', 'Energy'],
        modality: ghk_cu_subq_modality
      },
      {
        id: 'glow_step_bpc157',
        protocol_id: 'ghk_cu_bpc157_tb500_glow_stack_protocol',
        modality_id: 'bpc157_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 4-8 weeks)',
        required: true,
        dose_amount: 250,
        dose_unit: 'mcg',
        dose_text: '250 mcg SubQ daily (10 units on U-100 syringe from 5mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg lyophilized vial with 2.0 mL bacteriostatic water (2,500 mcg/mL; 10 units = 250 mcg on U-100 syringe). Inject SubQ into abdominal fat or near site of connective tissue strain. Synergizes with GHK-Cu to accelerate microvascular angiogenesis and fibroblast tenocyte proliferation.',
        notes: 'Supports localized extracellular matrix healing and mucosal integrity.',
        target_outcomes: ['Joint Comfort', 'Pain', 'Soreness'],
        modality: bpc157_subq_modality
      },
      {
        id: 'glow_step_tb500',
        protocol_id: 'ghk_cu_bpc157_tb500_glow_stack_protocol',
        modality_id: 'tb500_subq',
        ordering_index: 3,
        display_order: 3,
        timing_slot: 'evening',
        timing_anchor: 'evening',
        frequency: '2x / week (Tuesdays & Fridays)',
        required: true,
        dose_amount: 2500,
        dose_unit: 'mcg',
        dose_text: '2.5 mg SubQ 2x weekly (100 units / 1.0 mL from 5mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg lyophilized vial with 2.0 mL bacteriostatic water (2,500 mcg/mL; 100 units = 2.5 mg on U-100 syringe). Administer SubQ into abdominal fat or outer thigh on Tuesdays & Fridays. Promotes systemic G-actin sequestering and anti-fibrotic remodeling.',
        notes: 'Suppresses scar tissue formation and supports soft-tissue elasticity.',
        target_outcomes: ['Joint Comfort', 'Soreness', 'Endurance'],
        modality: tb500_subq_modality
      }
    ]
  },

  // 4. Tesamorelin + Ipamorelin Visceral Fat & Body Comp
  {
    id: 'tesamorelin_ipamorelin_body_comp_protocol',
    name: 'Tesamorelin + Ipamorelin Visceral Fat Reduction & Body Recomposition Protocol',
    author_name: 'Metabolic & Body Recomposition Stack',
    source_label: 'Visceral Fat Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Preferential Visceral Belly Fat Reduction, Lean Muscle Tone & Nighttime Deep Sleep',
    secondary_goals: [
      'Preferential Visceral & Deep Abdominal Fat Mobilization',
      'Lean Muscle Mass Preservation & Nitrogen Retention',
      'Nocturnal Slow-Wave Deep Sleep Amplification',
      'IGF-1 Biomarker Elevation without Glucose Dysregulation'
    ],
    target_population: 'Individuals seeking targeted reduction of stubborn visceral/abdominal fat, improved body composition (DEXA), deeper slow-wave sleep, and enhanced nighttime recovery.',
    difficulty_level: 'Advanced',
    evidence_level: 'High (FDA Clinical Trials for Tesamorelin + Secretagogue Cohorts)',
    safety_level: 'High',
    description: 'A targeted body-recomposition stack designed to help reduce stubborn visceral belly fat, support lean muscle tone, and deepen your slow-wave sleep.',
    rationale: 'Premier body recomposition stack. Tesamorelin is a stabilized GHRH analogue clinically validated for preferential visceral fat reduction. Co-administration with selective ghrelin-agonist Ipamorelin maximizes pulsatile nocturnal GH amplitude while preserving glucose tolerance and insulin sensitivity.',
    steps: [
      {
        id: 'body_comp_step_tesamorelin',
        protocol_id: 'tesamorelin_ipamorelin_body_comp_protocol',
        modality_id: 'tesamorelin_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri)',
        required: true,
        dose_amount: 1000,
        dose_unit: 'mcg',
        dose_text: '1.0 mg (1,000 mcg) SubQ at bedtime on empty stomach (50 units from 2mg/1mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 2mg lyophilized vial with 1.0 mL bacteriostatic water (2,000 mcg/mL; 50 units = 1.0 mg on U-100 syringe). Inject SubQ into abdominal fat 30-45 minutes before bedtime on a strict empty stomach (≥2 hours after last caloric intake). Important context: Tesamorelin itself is FDA-approved (Egrifta) for visceral abdominal fat reduction in HIV lipodystrophy; combination with ipamorelin is an off-label wellness stack.',
        notes: 'Targeting adipocyte beta-3 adrenergic lipolysis and pituitary somatotroph GHRH receptors.',
        target_outcomes: ['Energy', 'Sleep Quality', 'Satiety'],
        modality: tesamorelin_subq_modality
      },
      {
        id: 'body_comp_step_ipamorelin',
        protocol_id: 'tesamorelin_ipamorelin_body_comp_protocol',
        modality_id: 'ipamorelin_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri)',
        required: true,
        dose_amount: 200,
        dose_unit: 'mcg',
        dose_text: '200 mcg SubQ co-administered with Tesamorelin (10 units from 5mg/2.5mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg lyophilized vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 10 units = 200 mcg on U-100 syringe). May be combined in the same syringe with Tesamorelin immediately prior to injection. Take at bedtime on empty stomach.',
        notes: 'Selectively stimulates GHS-R1a to amplify the peak GH pulse synergistically with Tesamorelin without spiking cortisol or prolactin.',
        target_outcomes: ['Sleep Quality', 'Waking Restedness', 'Satiety'],
        modality: ipamorelin_subq_modality
      }
    ]
  },

  // 5. CJC-1295 + Ipamorelin + MOTS-c Longevity & Metabolic Protocol
  {
    id: 'cjc1295_ipamorelin_motsc_longevity_protocol',
    name: 'CJC-1295 + Ipamorelin + MOTS-c Longevity & Mitochondrial Metabolic Protocol',
    author_name: 'Cellular Longevity & Metabolism',
    source_label: 'Longevity Metabolic Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Mitochondrial Energy Output, Insulin Sensitivity & Nocturnal Cellular Rejuvenation',
    secondary_goals: [
      'Systemic Mitochondrial Metabolic Flexibility & Fatty Acid Oxidation',
      'AMPK Activation & Skeletal Muscle GLUT4 Translocation',
      'Pulsatile Nocturnal Growth Hormone Release & Slow-Wave Deep Sleep',
      'Exercise Endurance, VO2 Max & Cellular Anti-Aging Signaling'
    ],
    target_population: 'Longevity-focused individuals, biohackers, and athletes seeking complete metabolic optimization, mitochondrial rejuvenation, improved insulin sensitivity, and restorative sleep architecture.',
    difficulty_level: 'Advanced',
    evidence_level: 'High (Endocrinology & Cell Metabolism Literature)',
    safety_level: 'High',
    description: 'A complete cellular and metabolic reset that elevates daily physical energy, improves insulin sensitivity, and optimizes nighttime repair and longevity pathways.',
    rationale: 'Cutting-edge longevity and metabolic protocol combining the somatotropic synergy of CJC-1295 + Ipamorelin with the mitochondrial exercise-mimetic peptide MOTS-c. Directly stimulates AMPK, improves insulin sensitivity, enhances cellular lipolysis, and amplifies nighttime tissue repair.',
    steps: [
      {
        id: 'longevity_step_cjc1295',
        protocol_id: 'cjc1295_ipamorelin_motsc_longevity_protocol',
        modality_id: 'cjc1295_no_dac_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri)',
        required: true,
        dose_amount: 100,
        dose_unit: 'mcg',
        dose_text: '100 mcg SubQ at bedtime on empty stomach (10 units from 2mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 2mg lyophilized vial with 2.0 mL bacteriostatic water (1,000 mcg/mL; 10 units = 100 mcg on U-100 syringe). Inject SubQ 30-45 minutes before sleep on an empty stomach (≥2 hours post-meal).',
        notes: 'Amplifies pulsatile GHRH signaling to promote slow-wave sleep and cellular repair.',
        target_outcomes: ['Sleep Quality', 'Waking Restedness', 'Energy'],
        modality: cjc1295_no_dac_subq_modality
      },
      {
        id: 'longevity_step_ipamorelin',
        protocol_id: 'cjc1295_ipamorelin_motsc_longevity_protocol',
        modality_id: 'ipamorelin_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri)',
        required: true,
        dose_amount: 200,
        dose_unit: 'mcg',
        dose_text: '200 mcg SubQ co-administered with CJC-1295 (10 units from 5mg/2.5mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg lyophilized vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 10 units = 200 mcg on U-100 syringe). Inject SubQ at bedtime on empty stomach alongside CJC-1295.',
        notes: 'Selective GHS-R1a stimulation for nocturnal GH pulsatility and deep sleep.',
        target_outcomes: ['Sleep Quality', 'Waking Restedness', 'Satiety'],
        modality: ipamorelin_subq_modality
      },
      {
        id: 'longevity_step_motsc',
        protocol_id: 'cjc1295_ipamorelin_motsc_longevity_protocol',
        modality_id: 'mots_c_subq',
        ordering_index: 3,
        display_order: 3,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: '3x / week (Monday, Wednesday, Friday)',
        required: true,
        dose_amount: 5000,
        dose_unit: 'mcg',
        dose_text: '5.0 mg SubQ 3x weekly (50 units from 10mg/1mL vial on U-100 syringe)',
        duration: '5 mins',
        instructions: 'Reconstitute 10mg lyophilized vial with 1.0 mL bacteriostatic water (10,000 mcg/mL; 50 units = 5.0 mg on U-100 syringe). Administer SubQ into abdominal fat or deltoid on Monday, Wednesday, and Friday mornings in a fasted state prior to morning exercise or zone 2 cardio for maximum AMPK activation. 4–6 week cycle.',
        notes: 'Triggers nuclear translocation to activate AMPK, enhance skeletal muscle GLUT4 glucose uptake, and stimulate mitochondrial biogenesis.',
        target_outcomes: ['Endurance', 'Energy', 'Mental Clarity'],
        modality: mots_c_subq_modality
      }
    ]
  },

  // 6. Semax + Selank (Cognition & Stress Resilience)
  {
    id: 'semax_selank_cognition_protocol',
    name: 'Semax + Selank Nootropic Focus & Stress Resilience Protocol',
    author_name: 'Neuroscience & Peak Performance',
    source_label: 'Cognition & Focus Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Laser Executive Focus, Mental Clarity & Composed Stress Deload',
    secondary_goals: [
      'Brain-Derived Neurotrophic Factor (BDNF) Upregulation',
      'Working Memory, Processing Speed & Mental Stamina',
      'Anxiolysis & Cortisol Buffering without Sedation',
      'Neuroprotective Monoaminergic Neurotransmitter Balance'
    ],
    target_population: 'Knowledge workers, entrepreneurs, and high-performance individuals seeking intense cognitive focus, sharp memory, and anxiety relief under high-pressure workloads.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Clinical Neurology & Neurobiology Studies)',
    safety_level: 'High',
    description: 'A premier cognitive-enhancement stack designed to give you laser-sharp focus and sustained mental clarity throughout the workday, while eliminating background anxiety and mental fatigue without crashes or jitters.',
    rationale: 'Synergistic dual-neurotrophic mechanism. Semax upregulates Brain-Derived Neurotrophic Factor (BDNF) and TrkB receptor expression in the hippocampus and prefrontal cortex, enhancing neuroplasticity, memory formation, and dopaminergic neurotransmission. Selank provides complementary anxiolysis by allosterically modulating GABA-A receptors, slowing enkephalin degradation, and suppressing neuroinflammatory cytokine IL-6 to preserve calm executive function under high cognitive load.',
    steps: [
      {
        id: 'cognition_step_semax',
        protocol_id: 'semax_selank_cognition_protocol',
        modality_id: 'semax_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 4-6 weeks)',
        required: true,
        dose_amount: 300,
        dose_unit: 'mcg',
        dose_text: '300–600 mcg SubQ or Nasal daily in morning (6 units from 10mg/2mL vial on U-100 syringe)',
        duration: '5 mins',
        instructions: 'Reconstitute 10mg lyophilized vial with 2.0 mL bacteriostatic water (5,000 mcg/mL concentration; 6 units = 300 mcg on U-100 syringe). Administer SubQ into abdominal fat or intranasally with metered spray device upon waking or 30m prior to demanding cognitive work.',
        notes: 'Upregulates central BDNF and TrkB, enhancing dopaminergic signaling and prefrontal executive function.',
        target_outcomes: ['Focus', 'Mental Clarity', 'Energy'],
        modality: semax_subq_modality
      },
      {
        id: 'cognition_step_selank',
        protocol_id: 'semax_selank_cognition_protocol',
        modality_id: 'selank_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 4-6 weeks)',
        required: true,
        dose_amount: 300,
        dose_unit: 'mcg',
        dose_text: '300–500 mcg SubQ or Nasal daily in morning / midday (6 units from 10mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 10mg lyophilized vial with 2.0 mL bacteriostatic water (5,000 mcg/mL; 6 units = 300 mcg on U-100 syringe). Administer SubQ or intranasally alongside Semax in the morning, or during midday peak stress periods for composed mental tranquility.',
        notes: 'Allosterically modulates GABA-A and protects endogenous enkephalins to dissolve anxiety without sedation.',
        target_outcomes: ['Stress', 'Mood', 'Mental Clarity'],
        modality: selank_subq_modality
      }
    ]
  },

  // 7. Wolverine Plus (BPC-157 + TB-500 + KPV)
  {
    id: 'bpc157_tb500_kpv_recovery_protocol',
    name: 'BPC-157 + TB-500 + KPV ("Wolverine Plus") Deep Recovery & Anti-Inflammatory Protocol',
    author_name: 'Advanced Regenerative Medicine',
    source_label: 'Deep Anti-Inflammatory Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Aggressive Tendon & Joint Repair with Targeted Cellular Anti-Inflammation',
    secondary_goals: [
      'Nuclear NF-kB Transcription Suppression & Pro-Inflammatory Cytokine Clearance',
      'Accelerated Tendon-to-Bone Healing & Tenocyte Migration',
      'Systemic Soft-Tissue Anti-Fibrotic Remodeling',
      'Gut Mucosal Barrier Regeneration & Localized Joint Pain Deload'
    ],
    target_population: 'Individuals with stubborn, chronic joint inflammation, tendinopathies that have plateaued, post-surgical inflammation, or concurrent gut irritation requiring powerful cytokine suppression alongside structural tissue repair.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Preclinical & Clinical Immunology Trials)',
    safety_level: 'High',
    description: 'An intensified upgrade to the classic Wolverine Stack, adding KPV to aggressively cool persistent localized inflammation and chronic pain so your joints, tendons, and muscles can heal and rebuild at maximum speed.',
    rationale: 'Multi-pathway regenerative triad. BPC-157 stimulates localized EGR-1, VEGFR2, and FAK-paxillin focal adhesion pathways to guide tenocyte migration to damaged connective tissue. TB-500 sequesters G-actin to promote cell motility and prevent fibrotic scar tissue formation. KPV translocates to the nucleus to selectively inhibit NF-kB activation, shutting down pro-inflammatory cytokines (TNF-alpha, IL-1beta, IL-6) and clearing the inflammatory blockades that typically stall chronic tendon and fascial repair.',
    steps: [
      {
        id: 'wolverine_plus_step_bpc157',
        protocol_id: 'bpc157_tb500_kpv_recovery_protocol',
        modality_id: 'bpc157_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 4-8 weeks)',
        required: true,
        dose_amount: 250,
        dose_unit: 'mcg',
        dose_text: '250–500 mcg SubQ daily (10 units on U-100 syringe from 5mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg lyophilized vial with 2.0 mL bacteriostatic water (2,500 mcg/mL; 10 units = 250 mcg). Inject SubQ into abdominal fat or near site of connective tissue strain. Synergizes with KPV to accelerate tissue healing while shutting down inflammatory flares.',
        notes: 'Directly upregulates tenocyte proliferation and microvascular blood flow.',
        target_outcomes: ['Joint Comfort', 'Pain', 'Energy'],
        modality: bpc157_subq_modality
      },
      {
        id: 'wolverine_plus_step_tb500',
        protocol_id: 'bpc157_tb500_kpv_recovery_protocol',
        modality_id: 'tb500_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'evening',
        timing_anchor: 'evening',
        frequency: '2x / week (Tuesdays & Fridays)',
        required: true,
        dose_amount: 2500,
        dose_unit: 'mcg',
        dose_text: '2.5 mg SubQ 2x weekly (100 units / 1.0 mL from 5mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg lyophilized vial with 2.0 mL bacteriostatic water (2,500 mcg/mL; 100 units = 2.5 mg). Administer SubQ into abdominal fat on Tuesdays & Fridays. Promotes systemic cellular migration and suppresses scar tissue fibrosis.',
        notes: 'Maintains tissue elasticity and speeds up muscular repair.',
        target_outcomes: ['Joint Comfort', 'Soreness', 'Pain'],
        modality: tb500_subq_modality
      },
      {
        id: 'wolverine_plus_step_kpv',
        protocol_id: 'bpc157_tb500_kpv_recovery_protocol',
        modality_id: 'kpv_subq',
        ordering_index: 3,
        display_order: 3,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 4-8 weeks)',
        required: true,
        dose_amount: 250,
        dose_unit: 'mcg',
        dose_text: '250–500 mcg SubQ daily (10 units from 5mg/2mL vial on U-100 syringe)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg lyophilized vial with 2.0 mL bacteriostatic water (2,500 mcg/mL; 10 units = 250 mcg). Inject SubQ into abdominal fat in the morning. KPV actively blocks NF-kB nuclear translocation, eliminating the inflammatory cytokine cascade that prevents joint and gut tissues from closing.',
        notes: 'Targeting NF-kB nuclear translocation, TNF-alpha suppression, and mucosal anti-inflammation.',
        target_outcomes: ['Pain', 'Joint Comfort', 'Digestive Comfort'],
        modality: kpv_subq_modality
      }
    ]
  },

  // 8. KLOW Stack (GHK-Cu + BPC-157 + TB-500 + KPV)
  {
    id: 'ghk_cu_bpc157_tb500_kpv_klow_stack_protocol',
    name: 'GHK-Cu + BPC-157 + TB-500 + KPV ("KLOW Stack") Complete Rejuvenation & Inflammation Protocol',
    author_name: '2026 Biohacking & Longevity Stack',
    source_label: 'KLOW Rejuvenation Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Full-Body Collagen Rejuvenation, Hair Follicle Density, Deep Tissue Healing & Systemic Anti-Inflammation',
    secondary_goals: [
      'Dermal Collagen Types I & III Remodeling & Deep Skin Radiance',
      'Hair Follicle Density & Scalp Microvascular Angiogenesis',
      'Potent NF-kB Inhibition & Joint Cytokine Clearance via KPV',
      'Accelerated Tendon, Ligament & Fascial Structural Repair'
    ],
    target_population: 'Biohackers and longevity enthusiasts seeking the pinnacle all-in-one stack for visible aesthetic radiance (skin, hair) paired with full-body joint repair and aggressive systemic inflammation defense.',
    difficulty_level: 'Advanced',
    evidence_level: 'High (Dermatology, Sports Medicine & Cellular Biology Trials)',
    safety_level: 'High',
    description: 'The ultimate all-in-one rejuvenation and repair protocol. Combines radiant skin and hair revitalisation with powerful full-body joint healing and deep inflammation control so you look and feel fully restored.',
    rationale: 'Four-tier extracellular matrix and anti-inflammatory architecture. GHK-Cu modulates thousands of genes to stimulate collagen I & III, decorin, and hair follicle microvascularization. BPC-157 accelerates tenocyte and endothelial cell proliferation for tendon/ligament repair. TB-500 maintains actin cytoskeletal flexibility and prevents scar tissue. KPV powerfully inhibits NF-kB nuclear translocation, resolving systemic tissue inflammation and mucosal irritation to create the ideal biological environment for total-body renewal.',
    steps: [
      {
        id: 'klow_step_ghk_cu',
        protocol_id: 'ghk_cu_bpc157_tb500_kpv_klow_stack_protocol',
        modality_id: 'ghk_cu_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 4-8 weeks)',
        required: true,
        dose_amount: 2000,
        dose_unit: 'mcg',
        dose_text: '2.0 mg (2,000 mcg) SubQ daily (10 units from 50mg/2.5mL vial on U-100 syringe)',
        duration: '5 mins',
        instructions: 'Reconstitute 50mg lyophilized vial with 2.5 mL bacteriostatic water (20,000 mcg/mL; 10 units = 2.0 mg on U-100 syringe). Inject SubQ into abdominal fat or outer thigh in the morning. (Diluting with 0.1mL extra BAC water in syringe helps minimize post-injection sensation).',
        notes: 'Targeting dermal fibroblasts, decorin synthesis, TGF-beta modulation, and hair follicle vascularization.',
        target_outcomes: ['Skin Clarity', 'Joint Comfort', 'Energy'],
        modality: ghk_cu_subq_modality
      },
      {
        id: 'klow_step_bpc157',
        protocol_id: 'ghk_cu_bpc157_tb500_kpv_klow_stack_protocol',
        modality_id: 'bpc157_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 4-8 weeks)',
        required: true,
        dose_amount: 250,
        dose_unit: 'mcg',
        dose_text: '250 mcg SubQ daily (10 units on U-100 syringe from 5mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg lyophilized vial with 2.0 mL bacteriostatic water (2,500 mcg/mL; 10 units = 250 mcg). Inject SubQ into abdominal fat in the morning alongside GHK-Cu and KPV.',
        notes: 'Accelerates tendon tenocyte migration, angiogenesis, and collagen matrix repair.',
        target_outcomes: ['Joint Comfort', 'Pain', 'Soreness'],
        modality: bpc157_subq_modality
      },
      {
        id: 'klow_step_tb500',
        protocol_id: 'ghk_cu_bpc157_tb500_kpv_klow_stack_protocol',
        modality_id: 'tb500_subq',
        ordering_index: 3,
        display_order: 3,
        timing_slot: 'evening',
        timing_anchor: 'evening',
        frequency: '2x / week (Tuesdays & Fridays)',
        required: true,
        dose_amount: 2500,
        dose_unit: 'mcg',
        dose_text: '2.5 mg SubQ 2x weekly (100 units / 1.0 mL from 5mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg lyophilized vial with 2.0 mL bacteriostatic water (2,500 mcg/mL; 100 units = 2.5 mg). Administer SubQ on Tuesdays & Fridays in the evening. Supports systemic tissue flexibility and prevents fibrotic scar tissue.',
        notes: 'Upregulates G-actin sequestering and systemic tissue remodeling.',
        target_outcomes: ['Joint Comfort', 'Soreness', 'Endurance'],
        modality: tb500_subq_modality
      },
      {
        id: 'klow_step_kpv',
        protocol_id: 'ghk_cu_bpc157_tb500_kpv_klow_stack_protocol',
        modality_id: 'kpv_subq',
        ordering_index: 4,
        display_order: 4,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 4-8 weeks)',
        required: true,
        dose_amount: 250,
        dose_unit: 'mcg',
        dose_text: '250–500 mcg SubQ daily (10 units from 5mg/2mL vial on U-100 syringe)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg lyophilized vial with 2.0 mL bacteriostatic water (2,500 mcg/mL; 10 units = 250 mcg). Inject SubQ in the morning. KPV actively blocks NF-kB nuclear translocation, eliminating the inflammatory cytokine cascade that prevents joint and gut tissues from closing.',
        notes: 'Provides targeted NF-kB inhibition and shuts down pro-inflammatory cytokines.',
        target_outcomes: ['Pain', 'Joint Comfort', 'Digestive Comfort'],
        modality: kpv_subq_modality
      }
    ]
  },

  // 9. Retatrutide + Tesamorelin (Aggressive Fat Loss & Visceral Recomposition)
  {
    id: 'retatrutide_tesamorelin_body_recomp_protocol',
    name: 'Retatrutide + Tesamorelin Aggressive Fat Loss & Visceral Recomposition Protocol',
    author_name: 'Advanced Metabolic & Body Recomposition Stack',
    source_label: 'Metabolic Fat Loss Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Aggressive Total Body Fat Loss, Targeted Visceral Adipose (VAT) Depletion & Lean Muscle Preservation',
    secondary_goals: [
      'Triple G Agonism (GLP-1 / GIP / Glucagon) for Heightened Basal Energy Expenditure',
      'Preferential Deep Abdominal & Epicardial Visceral Fat Lipolysis',
      'Satiety Upregulation & Glycemic Stability',
      'Nocturnal Pulsatile GH Amplitude & Lean Tissue Nitrogen Retention'
    ],
    target_population: 'Individuals seeking rapid, aggressive body recomposition, total-body fat loss, preferential visceral fat reduction, and lean muscle retention through combined GLP-1/GIP/Glucagon and GHRH pathways.',
    difficulty_level: 'Advanced',
    evidence_level: 'High (NEJM Phase 2 Trials for Retatrutide + FDA Clinical Trials for Tesamorelin)',
    safety_level: 'High',
    description: 'An aggressive 2026 body-recomposition stack combining next-generation triple-agonist Retatrutide to power down appetite and increase metabolic burn, paired with Tesamorelin to specifically melt stubborn visceral belly fat while preserving lean muscle mass.',
    rationale: 'Complementary metabolic and somatotropic synergy. Retatrutide (LY3437943) engages GLP-1, GIP, and glucagon receptors simultaneously, suppressing hunger while uniquely increasing hepatic beta-oxidation and resting metabolic rate. Tesamorelin adds localized visceral lipolysis by activating adipocyte beta-3 adrenergic pathways and pituitary GHRH receptors, stimulating pulsatile growth hormone to prevent lean muscle catabolism during rapid caloric deficits.',
    steps: [
      {
        id: 'recomp_step_retatrutide',
        protocol_id: 'retatrutide_tesamorelin_body_recomp_protocol',
        modality_id: 'retatrutide_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: '1x / week (Sundays)',
        required: true,
        dose_amount: 1000,
        dose_unit: 'mcg',
        dose_text: '1.0 mg (1,000 mcg) SubQ 1x weekly (20 units from 10mg/2mL vial on U-100 syringe)',
        duration: '5 mins',
        instructions: 'Reconstitute 10mg lyophilized vial with 2.0 mL bacteriostatic water (5,000 mcg/mL; 20 units = 1.0 mg on U-100 syringe). Inject SubQ into abdominal fat once weekly on a consistent day (e.g. Sunday morning). Titrate upward slowly every 4 weeks as clinically indicated.',
        notes: 'Targeting triple GLP-1/GIP/Glucagon receptors for appetite suppression, glucose stabilization, and basal metabolic acceleration.',
        target_outcomes: ['Satiety', 'Energy', 'Digestive Comfort'],
        modality: retatrutide_subq_modality
      },
      {
        id: 'recomp_step_tesamorelin',
        protocol_id: 'retatrutide_tesamorelin_body_recomp_protocol',
        modality_id: 'tesamorelin_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri)',
        required: true,
        dose_amount: 1000,
        dose_unit: 'mcg',
        dose_text: '1.0 mg (1,000 mcg) SubQ at bedtime on empty stomach (50 units from 2mg/1mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 2mg lyophilized vial with 1.0 mL bacteriostatic water (2,000 mcg/mL; 50 units = 1.0 mg on U-100 syringe). Inject SubQ at bedtime 30-45m before sleep on an empty stomach. Works synergistically with Retatrutide by selectively mobilizing deep visceral fat depots.',
        notes: 'Selectively stimulates GHRH receptors to mobilize visceral adipose tissue and protect lean muscle mass.',
        target_outcomes: ['Energy', 'Sleep Quality', 'Waking Restedness'],
        modality: tesamorelin_subq_modality
      }
    ]
  },

  // 10. MOTS-c + SS-31 (Mitochondrial Power Stack)
  {
    id: 'motsc_ss31_mitochondrial_stack_protocol',
    name: 'MOTS-c + SS-31 ("Mitochondrial Power Stack") Cellular Energy & Longevity Protocol',
    author_name: 'Mitochondrial & Cellular Longevity Medicine',
    source_label: 'Mitochondrial Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Inner Mitochondrial Membrane (IMM) Cristae Optimization, AMPK Activation & VO2 Max Performance',
    secondary_goals: [
      'Cardiolipin Binding & Electron Transport Chain (ETC) Supercomplex Stabilization',
      'Mitochondrial Biogenesis & Skeletal Muscle GLUT4 Glucose Translocation',
      'Reduction of Pathological ROS Electron Leak & Cellular Oxidative Stress',
      'Aerobic Exercise Work Capacity, Zone 2 Power & Lactate Clearance'
    ],
    target_population: 'Athletes, biohackers, and longevity enthusiasts seeking to resolve cellular energy fatigue, enhance VO2 max and aerobic endurance, protect mitochondrial membranes, and optimize metabolic flexibility.',
    difficulty_level: 'Advanced',
    evidence_level: 'High (Preclinical & Clinical Mitochondrial Energetics Literature)',
    safety_level: 'High',
    description: 'The canonical mitochondrial rejuvenation duo designed to recharge worn-out cellular batteries. SS-31 repairs the inner mitochondrial membranes to stop energy leaks, while MOTS-c signals your cells to build new mitochondria and burn energy cleanly for all-day stamina.',
    rationale: 'Dual-tier mitochondrial structural and metabolic signaling cascade. SS-31 selectively binds cardiolipin on the inner mitochondrial membrane to optimize electron flow through Complex I-IV, eliminate ROS electron leakage, and restore maximal ATP synthesis. Simultaneously, MOTS-c acts as a nuclear-translocating metabolic messenger that activates AMPK, upregulates skeletal muscle GLUT4 glucose uptake, and stimulates systemic mitochondrial biogenesis and fatty acid beta-oxidation.',
    steps: [
      {
        id: 'mitochondrial_step_ss31',
        protocol_id: 'motsc_ss31_mitochondrial_stack_protocol',
        modality_id: 'ss31_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 4-6 weeks)',
        required: true,
        dose_amount: 5000,
        dose_unit: 'mcg',
        dose_text: '5.0 mg SubQ daily in morning (25 units from 50mg/2.5mL vial on U-100 syringe)',
        duration: '5 mins',
        instructions: 'Reconstitute 50mg lyophilized vial with 2.5 mL bacteriostatic water (20,000 mcg/mL; 25 units = 5.0 mg on U-100 syringe). Inject SubQ into abdominal fat upon waking. SS-31 directly binds cardiolipin on the inner mitochondrial membrane to restore electron transport cristae efficiency.',
        notes: 'Cardiolipin targeting, ETC supercomplex stabilization, and ROS electron leak reduction.',
        target_outcomes: ['Energy', 'Strength', 'Mental Clarity'],
        modality: ss31_subq_modality
      },
      {
        id: 'mitochondrial_step_motsc',
        protocol_id: 'motsc_ss31_mitochondrial_stack_protocol',
        modality_id: 'mots_c_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: '3x / week (Monday, Wednesday, Friday)',
        required: true,
        dose_amount: 5000,
        dose_unit: 'mcg',
        dose_text: '5.0 mg SubQ 3x weekly (50 units from 10mg/1mL vial on U-100 syringe)',
        duration: '5 mins',
        instructions: 'Reconstitute 10mg lyophilized vial with 1.0 mL bacteriostatic water (10,000 mcg/mL; 50 units = 5.0 mg on U-100 syringe). Administer SubQ into abdominal fat or deltoid on Mon/Wed/Fri mornings in a fasted state prior to exercise or zone 2 cardio.',
        notes: 'AMPK activation, GLUT4 glucose uptake stimulation, and mitochondrial biogenesis.',
        target_outcomes: ['Endurance', 'Energy', 'Soreness'],
        modality: mots_c_subq_modality
      }
    ]
  },

  // 11. Epitalon + MOTS-c (Longevity & Circadian Metabolic Stack)
  {
    id: 'epitalon_motsc_longevity_protocol',
    name: 'Epitalon + MOTS-c Cellular Longevity & Metabolic Anti-Aging Protocol',
    author_name: 'Integrative Longevity & Pineal Geroprotection',
    source_label: 'Longevity & Circadian Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Pineal Circadian Endocrine Reset, Telomerase Upregulation & Mitochondrial Metabolic Flexibility',
    secondary_goals: [
      'Pineal Melatonin Secretion Restoration & Circadian Architecture Alignment',
      'Mitochondrial ATP Biogenesis & Metabolic Insulin Sensitivity via AMPK',
      'Telomerase Reverse Transcriptase (TERT) Upregulation in Somatic Cells',
      'Biological Age Deload & Systemic Neuroendocrine Homeostasis'
    ],
    target_population: 'Longevity-focused adults seeking to optimize cellular healthspan, reset deep circadian sleep cycles, upregulate telomerase activity, and maintain youthful metabolic flexibility.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Clinical Gerontology & Endocrinology Literature)',
    safety_level: 'High',
    description: 'A premier 2026 anti-aging protocol that pairs pineal-derived Epitalon to reset your circadian clock, deepen nighttime melatonin production, and support cellular health, with MOTS-c to optimize metabolic energy and daily exercise endurance.',
    rationale: 'Dual-axis circadian and metabolic geroprotective protocol. Epitalon (Ala-Glu-Asp-Gly) acts on the epithalamus-pineal axis to upregulate endogenous melatonin synthesis, restore youthful nocturnal neuroendocrine rhythms, and stimulate telomerase (TERT) activity. MOTS-c provides complementary metabolic longevity by activating AMPK, improving skeletal muscle glucose disposal, and stimulating mitochondrial biogenesis, together combating two primary hallmarks of aging (mitochondrial dysfunction and cellular senescence).',
    steps: [
      {
        id: 'longevity_pulse_step_epitalon',
        protocol_id: 'epitalon_motsc_longevity_protocol',
        modality_id: 'epitalon_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: 'Daily for 10–20 Days (1–2x / Year)',
        required: true,
        dose_amount: 5000,
        dose_unit: 'mcg',
        dose_text: '5.0 mg SubQ daily at bedtime for 10–20 days (25 units from 50mg/2.5mL vial on U-100 syringe)',
        duration: '5 mins',
        instructions: 'Reconstitute 50mg lyophilized vial with 2.5 mL bacteriostatic water (20,000 mcg/mL; 25 units = 5.0 mg on U-100 syringe). Inject SubQ into abdominal fat 30m before sleep every night for 10 to 20 consecutive days. Repeat this short pulse cycle once or twice annually.',
        notes: 'Upregulates pineal melatonin production and stimulates telomerase (TERT) reverse transcriptase.',
        target_outcomes: ['Sleep Quality', 'Waking Restedness', 'Immune Resilience'],
        modality: epitalon_subq_modality
      },
      {
        id: 'longevity_pulse_step_motsc',
        protocol_id: 'epitalon_motsc_longevity_protocol',
        modality_id: 'mots_c_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: '3x / week (Monday, Wednesday, Friday)',
        required: true,
        dose_amount: 5000,
        dose_unit: 'mcg',
        dose_text: '5.0 mg SubQ 3x weekly (50 units from 10mg/1mL vial on U-100 syringe)',
        duration: '5 mins',
        instructions: 'Reconstitute 10mg lyophilized vial with 1.0 mL bacteriostatic water (10,000 mcg/mL; 50 units = 5.0 mg). Administer SubQ on Monday, Wednesday, and Friday mornings in a fasted state for 4–6 weeks.',
        notes: 'Stimulates AMPK activation, skeletal muscle GLUT4 glucose uptake, and mitochondrial biogenesis.',
        target_outcomes: ['Endurance', 'Energy', 'Mental Clarity'],
        modality: mots_c_subq_modality
      }
    ]
  },

  // 12. BPC-157 + KPV ("The Gut Barrier Stack")
  {
    id: 'bpc157_kpv_gut_repair_protocol',
    name: 'BPC-157 + KPV ("The Gut Barrier Stack") Mucosal Healing Protocol',
    author_name: 'Gastrointestinal & Mucosal Medicine',
    source_label: 'Gut Barrier Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Intestinal Mucosal Healing, Tight Junction Integrity & Gastrointestinal Anti-Inflammation',
    secondary_goals: [
      'Enterocyte PepT1-Mediated NF-kB Inhibition',
      'VEGFR2-Driven Mucosal Microvascular Healing',
      'Ulcer, Gastritis & Leaky Gut Tight Junction Repair',
      'Systemic & Localized GI Anti-Inflammatory Cooling'
    ],
    target_population: 'Individuals with gut dysbiosis, leaky gut syndrome, inflammatory bowel irritation, gastritis, food sensitivities, or post-NSAID mucosal damage seeking rapid digestive restoration.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Preclinical & Clinical Gastroenterology Literature)',
    safety_level: 'High',
    description: 'The premier gut-healing peptide pairing designed to soothe stomach inflammation, repair leaky intestinal tight junctions, and restore calm digestive comfort without GI distress.',
    rationale: 'Dual-mechanism mucosal barrier restoration. BPC-157 stimulates mucosal angiogenesis via VEGFR2, stabilizes the gut endothelial barrier, and accelerates ulcer and epithelial healing through the FAK-paxillin pathway. KPV utilizes the enterocyte PepT1 transporter to access intestinal epithelial cells, where it directly inhibits NF-kB nuclear translocation, halting the release of pro-inflammatory cytokines (IL-1beta, TNF-alpha, IL-6) and calming chronic gut inflammation.',
    steps: [
      {
        id: 'gut_step_bpc157',
        protocol_id: 'bpc157_kpv_gut_repair_protocol',
        modality_id: 'bpc157_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 4-8 weeks)',
        required: true,
        dose_amount: 250,
        dose_unit: 'mcg',
        dose_text: '250–500 mcg SubQ or Oral daily (10 units on U-100 syringe from 5mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.0 mL bacteriostatic water (2,500 mcg/mL; 10 units = 250 mcg). Inject SubQ into abdominal fat or take orally on an empty stomach in the morning. Stimulates nitric oxide synthesis and accelerates mucosal tight-junction healing.',
        notes: 'Targeting VEGFR2 angiogenesis and gastrointestinal mucosal restoration.',
        target_outcomes: ['Digestive Comfort', 'Pain', 'Energy'],
        modality: bpc157_subq_modality
      },
      {
        id: 'gut_step_kpv',
        protocol_id: 'bpc157_kpv_gut_repair_protocol',
        modality_id: 'kpv_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 4-8 weeks)',
        required: true,
        dose_amount: 250,
        dose_unit: 'mcg',
        dose_text: '250–500 mcg SubQ or Oral daily (10 units from 5mg/2mL vial on U-100 syringe)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.0 mL bacteriostatic water (2,500 mcg/mL; 10 units = 250 mcg). Administer SubQ or orally in the morning. KPV actively suppresses NF-kB nuclear translocation in intestinal epithelial cells, clearing chronic inflammatory blockades.',
        notes: 'PepT1 transporter mediated NF-kB suppression and pro-inflammatory cytokine clearance.',
        target_outcomes: ['Digestive Comfort', 'Immune Resilience', 'Soreness'],
        modality: kpv_subq_modality
      }
    ]
  },

  // 13. BPC-157 + TB-500 + Thymosin Alpha-1 ("Immuno-Wolverine Stack")
  {
    id: 'bpc157_tb500_ta1_immuno_wolverine_protocol',
    name: 'BPC-157 + TB-500 + Thymosin Alpha-1 ("Immuno-Wolverine Stack") Deep Recovery & Immune Protocol',
    author_name: 'Regenerative & Immunological Medicine',
    source_label: 'Immuno-Wolverine Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Connective Tissue Repair, Systemic Anti-Inflammation & T-Cell Immune Optimization',
    secondary_goals: [
      'Thymic T-Cell & Natural Killer (NK) Cytotoxic Priming via TLR2/TLR9',
      'Tendon, Ligament & Muscle Microvascular Revascularization',
      'G-Actin Sequestering & Anti-Fibrotic Remodeling',
      'Systemic Fatigue & Subclinical Pathogen Clearance'
    ],
    target_population: 'Athletes, hard-training individuals, and patients recovering from injuries who also experience sluggish immune recovery, lingering viral fatigue, or systemic inflammatory stagnation.',
    difficulty_level: 'Advanced',
    evidence_level: 'High (Preclinical & Clinical Immunology Trials)',
    safety_level: 'High',
    description: 'An advanced expansion of the Wolverine Stack that combines aggressive joint and tendon repair with powerful immune defense, helping your body rebuild tissue while clearing persistent viral or inflammatory fatigue.',
    rationale: 'Tripartite tissue repair and immunomodulatory architecture. BPC-157 guides tenocyte focal adhesions and microvascular remodeling; TB-500 upregulates actin sequestering to prevent scar tissue and accelerate myofascial repair. Thymosin Alpha-1 (TA-1) acts through TLR2 and TLR9 on dendritic cells to stimulate cytotoxic T-cell and natural killer (NK) activity, balancing Th1/Th2 responses and preventing subclinical immune dysfunction from stalling physical recovery.',
    steps: [
      {
        id: 'immuno_step_bpc157',
        protocol_id: 'bpc157_tb500_ta1_immuno_wolverine_protocol',
        modality_id: 'bpc157_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 4-8 weeks)',
        required: true,
        dose_amount: 250,
        dose_unit: 'mcg',
        dose_text: '250–500 mcg SubQ daily (10 units on U-100 syringe from 5mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.0 mL bacteriostatic water (2,500 mcg/mL; 10 units = 250 mcg). Inject SubQ near injury or into abdominal fat daily in the morning.',
        notes: 'Targeting FAK-paxillin focal adhesions and endothelial cell proliferation.',
        target_outcomes: ['Joint Comfort', 'Pain', 'Energy'],
        modality: bpc157_subq_modality
      },
      {
        id: 'immuno_step_tb500',
        protocol_id: 'bpc157_tb500_ta1_immuno_wolverine_protocol',
        modality_id: 'tb500_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'evening',
        timing_anchor: 'evening',
        frequency: '2x / week (Tuesdays & Fridays)',
        required: true,
        dose_amount: 2500,
        dose_unit: 'mcg',
        dose_text: '2.5 mg SubQ 2x weekly (100 units / 1.0 mL from 5mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.0 mL bacteriostatic water (2,500 mcg/mL; 100 units = 2.5 mg). Administer SubQ on Tuesday and Friday evenings.',
        notes: 'G-actin sequestering, anti-fibrotic remodeling, and tissue elasticity.',
        target_outcomes: ['Joint Comfort', 'Soreness', 'Endurance'],
        modality: tb500_subq_modality
      },
      {
        id: 'immuno_step_ta1',
        protocol_id: 'bpc157_tb500_ta1_immuno_wolverine_protocol',
        modality_id: 'ta1_subq',
        ordering_index: 3,
        display_order: 3,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: '2x / week (Mondays & Thursdays)',
        required: true,
        dose_amount: 1500,
        dose_unit: 'mcg',
        dose_text: '1.5 mg SubQ 2x weekly (75 units from 5mg/2.5mL vial on U-100 syringe)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 75 units = 1.5 mg on U-100 syringe). Inject SubQ on Monday and Thursday mornings. Upregulates T-helper and natural killer cell activity.',
        notes: 'TLR2/TLR9 dendritic cell priming and cytotoxic T-cell optimization.',
        target_outcomes: ['Immune Resilience', 'Energy', 'Mood'],
        modality: ta1_subq_modality
      }
    ]
  },

  // 14. Tirzepatide + CJC-1295 + Ipamorelin + AOD-9604 ("Ultimate Metabolic Shred Stack")
  {
    id: 'tirzepatide_cjc_ipam_aod_shred_protocol',
    name: 'Tirzepatide + CJC-1295 + Ipamorelin + AOD-9604 ("Ultimate Metabolic Shred Stack") Body Recomposition Protocol',
    author_name: 'Advanced Metabolic & Aesthetic Endocrinology',
    source_label: 'Metabolic Shred Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Total Body Fat Loss, Visceral Adipose Depletion, Appetite Suppression & Lean Muscle Nitrogen Retention',
    secondary_goals: [
      'Dual GIP/GLP-1 Incretin Receptor Agonism for Deep Appetite Suppression',
      'Adipocyte Beta-3 Adrenergic Lipolysis via AOD-9604',
      'Nocturnal Pulsatile Growth Hormone Amplification via CJC/Ipamorelin',
      'Preservation of Lean Muscle Mass & Restorative Delta Sleep During Deficit'
    ],
    target_population: 'Individuals pursuing comprehensive body transformation, rapid fat loss, appetite mastery, and lean muscle tone preservation without metabolic slowdown.',
    difficulty_level: 'Advanced',
    evidence_level: 'High (NEJM Phase 3 SURMOUNT-1 Trials + GH Secretagogue Clinical Literature)',
    safety_level: 'High',
    description: 'The ultimate all-in-one metabolic transformation stack. Pairs dual GLP-1/GIP incretin power to eliminate cravings, AOD-9604 to burn stubborn fat stores, and CJC/Ipamorelin to maintain lean muscle and restorative deep sleep while cutting.',
    rationale: 'Four-pillar metabolic recomposition matrix. Tirzepatide provides potent dual GIP/GLP-1 appetite suppression and insulin sensitivity; AOD-9604 selectively triggers adipocyte beta-3 adrenergic lipolysis and inhibits lipogenesis without glycemic disruption. CJC-1295 (Mod GRF 1-29) and Ipamorelin synergistically amplify nocturnal pulsatile growth hormone, preserving skeletal muscle protein synthesis and nitrogen retention during aggressive caloric deficits.',
    steps: [
      {
        id: 'shred_step_tirzepatide',
        protocol_id: 'tirzepatide_cjc_ipam_aod_shred_protocol',
        modality_id: 'tirzepatide_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: '1x / week (Sundays)',
        required: true,
        dose_amount: 2500,
        dose_unit: 'mcg',
        dose_text: '2.5 mg SubQ 1x weekly (50 units from 10mg/2.0mL vial on U-100 syringe)',
        duration: '5 mins',
        instructions: 'Reconstitute 10mg vial with 2.0 mL bacteriostatic water (5,000 mcg/mL; 50 units = 2.5 mg). Inject SubQ into abdominal fat once weekly on a consistent day (e.g. Sunday morning). Titrate upward slowly every 4 weeks as indicated.',
        notes: 'Dual GIP/GLP-1 receptor agonism for potent appetite suppression and glycemic control.',
        target_outcomes: ['Satiety', 'Energy', 'Digestive Comfort'],
        modality: tirzepatide_subq_modality
      },
      {
        id: 'shred_step_aod9604',
        protocol_id: 'tirzepatide_cjc_ipam_aod_shred_protocol',
        modality_id: 'aod9604_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 8 weeks)',
        required: true,
        dose_amount: 500,
        dose_unit: 'mcg',
        dose_text: '300–500 mcg SubQ daily morning fasted (25 units from 5mg/2.5mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 25 units = 500 mcg). Inject SubQ into abdominal fat upon waking in a fasted state, 30m prior to cardio or first meal.',
        notes: 'Adipocyte beta-3 adrenergic lipolysis and fat mobilization.',
        target_outcomes: ['Energy', 'Endurance', 'Satiety'],
        modality: aod9604_subq_modality
      },
      {
        id: 'shred_step_cjc1295',
        protocol_id: 'tirzepatide_cjc_ipam_aod_shred_protocol',
        modality_id: 'cjc1295_no_dac_subq',
        ordering_index: 3,
        display_order: 3,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri)',
        required: true,
        dose_amount: 100,
        dose_unit: 'mcg',
        dose_text: '100 mcg SubQ at bedtime on empty stomach (10 units from 2mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 2mg vial with 2.0 mL bacteriostatic water (1,000 mcg/mL; 10 units = 100 mcg). Inject SubQ 30-45m before sleep on an empty stomach. Amplifies GHRH pulse amplitude.',
        notes: 'Pituitary GHRH receptor stimulation for nocturnal GH pulse.',
        target_outcomes: ['Sleep Quality', 'Waking Restedness', 'Energy'],
        modality: cjc1295_no_dac_subq_modality
      },
      {
        id: 'shred_step_ipamorelin',
        protocol_id: 'tirzepatide_cjc_ipam_aod_shred_protocol',
        modality_id: 'ipamorelin_subq',
        ordering_index: 4,
        display_order: 4,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri)',
        required: true,
        dose_amount: 200,
        dose_unit: 'mcg',
        dose_text: '200 mcg SubQ co-administered with CJC-1295 (10 units from 5mg/2.5mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 10 units = 200 mcg). Co-administer SubQ with CJC-1295 at bedtime. Prevents cortisol elevation and protects pituitary sensitivity.',
        notes: 'Selective GHS-R1a ghrelin receptor agonism.',
        target_outcomes: ['Sleep Quality', 'Soreness', 'Energy'],
        modality: ipamorelin_subq_modality
      }
    ]
  },

  // 15. CJC-1295 + Ipamorelin + BPC-157 + TB-500 ("Super Wolverine Stack")
  {
    id: 'cjc_ipam_bpc_tb500_super_wolverine_protocol',
    name: 'CJC-1295 + Ipamorelin + BPC-157 + TB-500 ("Super Wolverine Stack") Peak Performance & Total Repair Protocol',
    author_name: 'Elite Athletic Performance & Sports Medicine',
    source_label: 'Super Wolverine Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Full-Body Musculoskeletal Regeneration, Pulsatile GH Upregulation & Rapid Athletic Deload',
    secondary_goals: [
      'Dual GHRH + Ghrelin-Receptor Secretagogue Pulsatile Somatotropic Axis',
      'EGR-1/VEGFR2 Microvascular Tenocyte Tendon & Ligament Healing',
      'Systemic G-Actin Cytoskeletal Motility & Anti-Fibrotic Remodeling',
      'Deep Delta Sleep Restoration, IGF-1 Synthesis & Anabolic Nitrogen Retention'
    ],
    target_population: 'Elite athletes, competitive lifters, and individuals recovering from multi-tissue trauma or intense training cycles who require maximum recovery speed and systemic tissue rebuilding.',
    difficulty_level: 'Advanced',
    evidence_level: 'High (Endocrinology & Regenerative Sports Medicine Literature)',
    safety_level: 'High',
    description: 'The legendary "everything stack" for serious athletes and lifters. Combines full Wolverine tissue and tendon repair with nighttime growth hormone optimization so you wake up fully rebuilt and ready to train at peak intensity.',
    rationale: 'Comprehensive somatotropic and tissue-repair synergy. BPC-157 and TB-500 accelerate localized extracellular matrix synthesis, tenocyte migration, and systemic G-actin cell motility to heal acute and chronic structural injuries. CJC-1295 and Ipamorelin stimulate nocturnal pituitary growth hormone and systemic IGF-1 synthesis, providing the systemic anabolic substrate for rapid myofibrillar protein synthesis, collagen cross-linking, and deep slow-wave delta sleep recovery.',
    steps: [
      {
        id: 'super_wolverine_step_bpc157',
        protocol_id: 'cjc_ipam_bpc_tb500_super_wolverine_protocol',
        modality_id: 'bpc157_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 6-8 weeks)',
        required: true,
        dose_amount: 250,
        dose_unit: 'mcg',
        dose_text: '250–500 mcg SubQ daily (10 units on U-100 syringe from 5mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.0 mL bacteriostatic water (2,500 mcg/mL; 10 units = 250 mcg). Inject SubQ near site of strain or into abdominal fat daily in the morning.',
        notes: 'VEGFR2 angiogenesis, nitric oxide synthesis, and localized collagen matrix repair.',
        target_outcomes: ['Joint Comfort', 'Pain', 'Energy'],
        modality: bpc157_subq_modality
      },
      {
        id: 'super_wolverine_step_tb500',
        protocol_id: 'cjc_ipam_bpc_tb500_super_wolverine_protocol',
        modality_id: 'tb500_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'evening',
        timing_anchor: 'evening',
        frequency: '2x / week (Tuesdays & Fridays)',
        required: true,
        dose_amount: 2500,
        dose_unit: 'mcg',
        dose_text: '2.5 mg SubQ 2x weekly (100 units / 1.0 mL from 5mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.0 mL bacteriostatic water (2,500 mcg/mL; 100 units = 2.5 mg). Administer SubQ on Tuesdays and Fridays in the evening.',
        notes: 'G-actin sequestering, anti-fibrotic remodeling, and systemic tissue flexibility.',
        target_outcomes: ['Joint Comfort', 'Soreness', 'Endurance'],
        modality: tb500_subq_modality
      },
      {
        id: 'super_wolverine_step_cjc1295',
        protocol_id: 'cjc_ipam_bpc_tb500_super_wolverine_protocol',
        modality_id: 'cjc1295_no_dac_subq',
        ordering_index: 3,
        display_order: 3,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri)',
        required: true,
        dose_amount: 100,
        dose_unit: 'mcg',
        dose_text: '100 mcg SubQ at bedtime on empty stomach (10 units from 2mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 2mg vial with 2.0 mL bacteriostatic water (1,000 mcg/mL; 10 units = 100 mcg). Inject SubQ 30-45m before sleep on an empty stomach.',
        notes: 'Amplifies nocturnal pituitary growth hormone pulse amplitude.',
        target_outcomes: ['Sleep Quality', 'Waking Restedness', 'Energy'],
        modality: cjc1295_no_dac_subq_modality
      },
      {
        id: 'super_wolverine_step_ipamorelin',
        protocol_id: 'cjc_ipam_bpc_tb500_super_wolverine_protocol',
        modality_id: 'ipamorelin_subq',
        ordering_index: 4,
        display_order: 4,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri)',
        required: true,
        dose_amount: 200,
        dose_unit: 'mcg',
        dose_text: '200 mcg SubQ co-administered with CJC-1295 (10 units from 5mg/2.5mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 10 units = 200 mcg). Co-administer SubQ with CJC-1295 at bedtime on empty stomach.',
        notes: 'Selective GHS-R1a agonist triggering pulsatile GH release without elevating cortisol or prolactin.',
        target_outcomes: ['Sleep Quality', 'Soreness', 'Joint Comfort'],
        modality: ipamorelin_subq_modality
      }
    ]
  },

  // 16. PT-141 + Oxytocin ("The Intimacy & Passion Stack")
  {
    id: 'pt141_oxytocin_intimacy_protocol',
    name: 'PT-141 + Oxytocin ("The Intimacy & Passion Stack") Sexual Wellness & Arousal Protocol',
    author_name: 'Sexual Medicine & Neuro-Endocrinology',
    source_label: 'Intimacy & Passion Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Central Melanocortin Libido Elevation, Romantic Bonding, Stress Deload & Orgasmic Intensity',
    secondary_goals: [
      'Hypothalamic MPOA Melanocortin MC3/MC4 Receptor Activation',
      'Mesolimbic Dopaminergic Desire & Autonomic Genital Arousal',
      'Amygdala Stress Anxiolysis & Interpersonal Emotional Closeness via OXTR',
      'Enhanced Tactile Sensitivity & Sexual Satisfaction in Both Partners'
    ],
    target_population: 'Men and women seeking to rekindle natural sexual desire, overcome situational performance anxiety, enhance physical sensation, and deepen emotional intimacy.',
    difficulty_level: 'Beginner',
    evidence_level: 'High (FDA Clinical Trial Data for Bremelanotide + Neuropsychiatry Literature)',
    safety_level: 'High',
    description: 'A premier sexual-wellness and intimacy protocol designed to awaken natural physical desire in both men and women, deepen emotional bonding, and reduce bedroom performance anxiety.',
    rationale: 'Central neurochemical and emotional bonding synergy. PT-141 (Bremelanotide) crosses the blood-brain barrier to activate hypothalamic MC3 and MC4 melanocortin receptors in the medial preoptic area (MPOA), stimulating dopaminergic sexual desire, physical arousal, and autonomic genital vascular engorgement. Oxytocin provides complementary limbic anxiolysis, attenuating amygdala stress reactivity and promoting profound emotional connection, physical intimacy, and orgasmic satisfaction.',
    steps: [
      {
        id: 'intimacy_step_pt141',
        protocol_id: 'pt141_oxytocin_intimacy_protocol',
        modality_id: 'pt141_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'evening',
        timing_anchor: 'evening',
        frequency: 'As-Needed (1–2x / Week Max)',
        required: true,
        dose_amount: 1000,
        dose_unit: 'mcg',
        dose_text: '1.0 mg – 1.75 mg SubQ as-needed 1–2 hours prior to intimacy (20 units from 10mg/2mL vial on U-100 syringe)',
        duration: '5 mins',
        instructions: 'Reconstitute 10mg vial with 2.0 mL bacteriostatic water (5,000 mcg/mL; 20 units = 1.0 mg on U-100 syringe). Inject SubQ into abdominal fat 1 to 2 hours prior to anticipated intimacy. Limit use to 1–2 times per week to prevent melanocortin receptor desensitization.',
        notes: 'Central MPOA MC3/MC4 receptor activation for dopaminergic sexual arousal.',
        target_outcomes: ['Libido', 'Mood', 'Energy'],
        modality: pt141_subq_modality
      },
      {
        id: 'intimacy_step_oxytocin',
        protocol_id: 'pt141_oxytocin_intimacy_protocol',
        modality_id: 'oxytocin_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'evening',
        timing_anchor: 'evening',
        frequency: 'As-Needed (1–3x / Week)',
        required: true,
        dose_amount: 100,
        dose_unit: 'mcg',
        dose_text: '50–100 mcg SubQ or 10–20 IU Intranasal 30–60 minutes prior to intimacy (5 units from 5mg/2.5mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 5 units = 100 mcg / 50 IU). Administer SubQ or via intranasal spray 30 to 60 minutes before intimacy to enhance emotional closeness and tactile sensitivity.',
        notes: 'Amygdala anxiolysis, prosocial empathy, and physical bonding enhancement.',
        target_outcomes: ['Mood', 'Stress', 'Emotional Resilience'],
        modality: oxytocin_subq_modality
      }
    ]
  },

  // 17. Sermorelin + Ipamorelin ("The Natural GH Reset Stack")
  {
    id: 'sermorelin_ipamorelin_gh_protocol',
    name: 'Sermorelin + Ipamorelin ("The Natural GH Reset Stack") Clean Somatotropic & Sleep Protocol',
    author_name: 'Clinical Endocrinology & Anti-Aging Medicine',
    source_label: 'Natural GH Reset Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Natural Nocturnal GH Pulse Restoration, Slow-Wave Deep Sleep & Systemic Cellular Rejuvenation',
    secondary_goals: [
      'Bioidentical Pituitary GHRH Receptor Stimulation via Sermorelin (GRF 1-29)',
      'Selective GHS-R1a Ghrelin-Receptor Activation without Cortisol or Prolactin Elevation',
      'Deep Delta Sleep Expansion, Morning Waking Restedness & Collagen Synthesis',
      'Preservation of Pituitary Somatostatin Negative Feedback Safety Loop'
    ],
    target_population: 'Individuals seeking clean, natural growth hormone elevation and restorative deep sleep without the receptor desensitization risks of synthetic HGH, or those preferring Sermorelin over CJC-1295.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Clinical Endocrinology Trials)',
    safety_level: 'High',
    description: 'A gentle, clean alternative to CJC-1295 that prompts your pituitary gland to release its own natural pulses of growth hormone before sleep. Delivers deeper restorative rest, faster recovery from exercise, and youthful vitality while respecting your body\'s built-in hormonal balance.',
    rationale: 'Physiological dual-secretagogue somatotropic synergy. Sermorelin (native GHRH 1-29 fragment) stimulates pituitary GHRH receptors to increase growth hormone synthesis, regulated under natural somatostatin negative feedback. Ipamorelin selectively activates the ghrelin receptor (GHS-R1a) on pituitary somatotrophs, triggering the release of pre-formed GH vesicles. Together, they produce a robust, natural nocturnal GH pulse that amplifies IGF-1, extends Stage 3/4 slow-wave delta sleep, and accelerates systemic tissue repair without elevating cortisol, prolactin, or aldosterone.',
    steps: [
      {
        id: 'sermorelin_step_sermorelin',
        protocol_id: 'sermorelin_ipamorelin_gh_protocol',
        modality_id: 'sermorelin_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri)',
        required: true,
        dose_amount: 300,
        dose_unit: 'mcg',
        dose_text: '300 mcg SubQ at bedtime on empty stomach (15 units from 5mg/2.5mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 15 units = 300 mcg on U-100 syringe). Inject SubQ 30–45m before sleep on an empty stomach (≥2 hours after dinner).',
        notes: 'Bioidentical GHRH-R stimulation for physiological GH pulse amplification.',
        target_outcomes: ['Sleep Quality', 'Waking Restedness', 'Energy'],
        modality: sermorelin_subq_modality
      },
      {
        id: 'sermorelin_step_ipamorelin',
        protocol_id: 'sermorelin_ipamorelin_gh_protocol',
        modality_id: 'ipamorelin_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri)',
        required: true,
        dose_amount: 200,
        dose_unit: 'mcg',
        dose_text: '200 mcg SubQ co-administered with Sermorelin at bedtime (10 units from 5mg/2.5mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 10 units = 200 mcg). May combine in the same syringe with Sermorelin immediately before bedtime injection.',
        notes: 'Selective GHS-R1a ghrelin receptor agonism for clean GH vesicle release.',
        target_outcomes: ['Sleep Quality', 'Soreness', 'Joint Comfort'],
        modality: ipamorelin_subq_modality
      }
    ]
  },

  // 18. CJC-1295 + Ipamorelin + IGF-1 LR3 ("The Hypertrophy & Anabolic Recomp Stack")
  {
    id: 'cjc_ipam_igf1_lr3_anabolic_protocol',
    name: 'CJC-1295 + Ipamorelin + IGF-1 LR3 ("The Hypertrophy & Anabolic Recomp Stack") Muscle Growth & Performance Protocol',
    author_name: 'Elite Body Recomposition & Hypertrophy Sciences',
    source_label: 'Hypertrophy & Anabolic Recomp Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Skeletal Muscle Hypertrophy, Satellite Cell Proliferation, Anabolic Nitrogen Retention & Rapid Deload',
    secondary_goals: [
      'Direct IGF-1R Receptor Stimulation for mTORC1 Myofibrillar Protein Synthesis',
      'Muscle Satellite Cell Activation, Hyperplasia & Amino Acid/Glucose Uptake',
      'Synergistic Nocturnal Pituitary GH Secretagogue Pulsatility via CJC/Ipamorelin',
      'Joint, Tendon & Connective Matrix Cross-Linking during Heavy Resistance Training'
    ],
    target_population: 'Competitive bodybuilders, strength athletes, and advanced lifters seeking maximal lean muscle accretion, accelerated recovery between heavy lifting sessions, and enhanced muscle fullness.',
    difficulty_level: 'Advanced',
    evidence_level: 'High (Translational Myology & Sports Medicine Literature)',
    safety_level: 'High',
    description: 'The premier muscle-building and body-recomposition stack. Directly activates muscle growth pathways and satellite cells with IGF-1 LR3 after workouts, while nightly CJC/Ipamorelin stimulates natural growth hormone pulses to repair joints and lock in lean muscle gains while you sleep.',
    rationale: 'Dual-tier intracellular and endocrine anabolic cascade. IGF-1 LR3 provides sustained direct agonism of muscle IGF-1 receptors with reduced binding to inhibitory IGFBPs, triggering IRS-1/PI3K/Akt/mTORC1 phosphorylation, accelerating satellite cell division (hyperplasia), and driving GLUT4 amino acid and glucose shuttling directly into depleted muscle fibers post-workout. Complementarily, nightly CJC-1295 (Mod GRF 1-29) + Ipamorelin provide natural pulsatile pituitary GH release to stimulate systemic collagen synthesis, protect tendon integrity under heavy loads, and maximize nocturnal nitrogen retention.',
    steps: [
      {
        id: 'anabolic_step_igf1_lr3',
        protocol_id: 'cjc_ipam_igf1_lr3_anabolic_protocol',
        modality_id: 'igf1_lr3_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'midday',
        timing_anchor: 'midday',
        frequency: 'Post-Workout (3–5x / Week for 4–6 Weeks)',
        required: true,
        dose_amount: 30,
        dose_unit: 'mcg',
        dose_text: '20–50 mcg SubQ or bilateral IM post-workout (4–10 units from 1mg/2mL vial on U-100 syringe)',
        duration: '5 mins',
        instructions: 'Reconstitute 1mg (1,000 mcg) vial with 2.0 mL bacteriostatic water (500 mcg/mL; 6 units = 30 mcg). Inject SubQ into abdominal fat or split bilaterally into trained target muscle groups immediately post-workout alongside a carbohydrate/protein meal.',
        notes: 'Direct IGF-1R receptor agonism, satellite cell hyperplasia, and mTORC1 protein synthesis.',
        target_outcomes: ['Strength', 'Soreness', 'Energy'],
        modality: igf1_lr3_subq_modality
      },
      {
        id: 'anabolic_step_cjc1295',
        protocol_id: 'cjc_ipam_igf1_lr3_anabolic_protocol',
        modality_id: 'cjc1295_no_dac_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri)',
        required: true,
        dose_amount: 100,
        dose_unit: 'mcg',
        dose_text: '100 mcg SubQ at bedtime on empty stomach (10 units from 2mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 2mg vial with 2.0 mL bacteriostatic water (1,000 mcg/mL; 10 units = 100 mcg). Inject SubQ 30–45m before sleep on empty stomach.',
        notes: 'Pituitary GHRH receptor stimulation amplifying nocturnal GH wave amplitude.',
        target_outcomes: ['Sleep Quality', 'Waking Restedness', 'Energy'],
        modality: cjc1295_no_dac_subq_modality
      },
      {
        id: 'anabolic_step_ipamorelin',
        protocol_id: 'cjc_ipam_igf1_lr3_anabolic_protocol',
        modality_id: 'ipamorelin_subq',
        ordering_index: 3,
        display_order: 3,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri)',
        required: true,
        dose_amount: 200,
        dose_unit: 'mcg',
        dose_text: '200 mcg SubQ co-administered with CJC-1295 at bedtime (10 units from 5mg/2.5mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 10 units = 200 mcg). Co-administer with CJC-1295 at bedtime on empty stomach.',
        notes: 'Selective GHS-R1a stimulation for nocturnal GH pulsatility and collagen maintenance.',
        target_outcomes: ['Sleep Quality', 'Soreness', 'Joint Comfort'],
        modality: ipamorelin_subq_modality
      }
    ]
  },

  // 19. Tesamorelin + MOTS-c ("Mitochondrial Visceral Shred Stack")
  {
    id: 'tesamorelin_motsc_visceral_recomp_protocol',
    name: 'Tesamorelin + MOTS-c ("Mitochondrial Visceral Shred Stack") Visceral Fat & Bioenergetic Protocol',
    author_name: 'Cardiometabolic & Mitochondrial Longevity Medicine',
    source_label: 'Mitochondrial Visceral Shred Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Targeted Deep Visceral Fat Reduction, AMPK Bioenergetic Upregulation & Exercise Capacity',
    secondary_goals: [
      'Selective Hepatic & Omental Visceral Adipose Lipolysis via Tesamorelin (GHRH 1-44)',
      'Mitochondrial-Derived Peptide AMPK Activation & Muscle GLUT4 Translocation',
      'Cardiovascular Risk Biomarker Optimization (Reduction in Triglycerides & ApoB)',
      'Skeletal Muscle Metabolic Flexibility, Zone-2 Efficiency & Stamina'
    ],
    target_population: 'Individuals struggling with stubborn abdominal/visceral fat, metabolic sluggishness, or insulin resistance who want to simultaneously improve athletic stamina and cardiovascular health.',
    difficulty_level: 'Advanced',
    evidence_level: 'High (FDA Approved Clinical Trials & Cell Metabolism Data)',
    safety_level: 'High',
    description: 'A cutting-edge metabolic protocol that specifically melts deep, stubborn visceral belly fat while supercharging your cellular energy engines. Tesamorelin targets dangerous organ fat, while MOTS-c acts as an "exercise in a bottle" to boost workout endurance and metabolic flexibility.',
    rationale: 'Integrated neuroendocrine and mitochondrial metabolic synergy. Tesamorelin (trans-3-hexenoyl GHRH 1-44) is the most potent clinically proven peptide for reducing deep visceral adipose tissue (~18% preferential reduction in FDA trials) by upregulating pulsatile GH and stimulating adipocyte beta-adrenergic lipolysis without glycemic impairment. MOTS-c complements this centrally by acting as a mitochondrial-encoded nuclear messenger that directly activates 5\'-AMP-activated protein kinase (AMPK), promotes GLUT4 glucose uptake in skeletal muscle, upregulates carnitine palmitoyltransferase-1 (CPT-1) fatty acid oxidation, and increases physical exercise capacity.',
    steps: [
      {
        id: 'visceral_step_tesamorelin',
        protocol_id: 'tesamorelin_motsc_visceral_recomp_protocol',
        modality_id: 'tesamorelin_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri for 8-12 Weeks)',
        required: true,
        dose_amount: 1000,
        dose_unit: 'mcg',
        dose_text: '1.0 mg – 2.0 mg SubQ at bedtime on empty stomach (50–100 units from 2mg/1mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 2mg vial with 1.0 mL bacteriostatic water (2,000 mcg/mL; 50 units = 1.0 mg on U-100 syringe). Inject SubQ into abdominal fat 30–45m before sleep on empty stomach (≥2 hours post-meal).',
        notes: 'Targeted visceral adipose tissue reduction and nocturnal somatotropic pulse stimulation.',
        target_outcomes: ['Energy', 'Satiety', 'Sleep Quality'],
        modality: tesamorelin_subq_modality
      },
      {
        id: 'visceral_step_motsc',
        protocol_id: 'tesamorelin_motsc_visceral_recomp_protocol',
        modality_id: 'mots_c_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: '2–3x / Week (Mon/Wed/Fri for 4-8 Weeks)',
        required: true,
        dose_amount: 5000,
        dose_unit: 'mcg',
        dose_text: '5.0 mg SubQ 2–3x weekly in the morning prior to fasted cardio (50 units from 10mg/1mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 10mg vial with 1.0 mL bacteriostatic water (10,000 mcg/mL; 50 units = 5.0 mg on U-100 syringe). Inject SubQ into abdominal fat pad or thigh on Monday, Wednesday, and Friday mornings prior to exercise.',
        notes: 'AMPK activation, skeletal muscle GLUT4 translocation, and enhanced fatty acid beta-oxidation.',
        target_outcomes: ['Endurance', 'Strength', 'Energy'],
        modality: mots_c_subq_modality
      }
    ]
  },

  // 20. AOD-9604 + CJC-1295 + Ipamorelin ("The Lean Shred & GH Preserving Stack")
  {
    id: 'aod9604_cjc_ipam_fatloss_protocol',
    name: 'AOD-9604 + CJC-1295 + Ipamorelin ("The Lean Shred & GH Preserving Stack") Targeted Lipolysis Protocol',
    author_name: 'Body Recomposition & Endocrine Wellness',
    source_label: 'Lean Shred & GH Preserving Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Targeted Adipocyte Lipolysis, Lean Tissue Sparing & Restorative Sleep during Caloric Deficits',
    secondary_goals: [
      'Adipocyte Beta-3 Adrenergic Receptor Lipolysis via AOD-9604 (C-Terminal hGH Fragment 177-191)',
      'Inhibition of Adipogenesis & Lipid Accumulation without Blood Glucose Fluctuations',
      'Nocturnal Pulsatile Pituitary GH Secretion via CJC-1295 (Mod GRF 1-29) + Ipamorelin',
      'Preservation of Skeletal Muscle Mass, Nitrogen Balance & Deep Slow-Wave Sleep'
    ],
    target_population: 'Individuals cutting calories or preparing for competition who want to accelerate stubborn fat loss without muscle wasting, fatigue, or sleep disruption, and without using GLP-1 medications.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Metabolism & GH Secretagogue Literature)',
    safety_level: 'High',
    description: 'The classic non-GLP-1 fat loss stack. AOD-9604 tells your fat cells to release stored energy in the morning without affecting blood sugar or appetite, while nighttime CJC/Ipamorelin protects your hard-earned muscle and delivers deep, restorative sleep.',
    rationale: 'Complementary morning lipolytic and nighttime somatotropic regulation. AOD-9604 (tyrosine-substituted C-terminal fragment 177-191 of hGH) binds adipocyte beta-3 adrenergic receptors, upregulating hormone-sensitive lipase (HSL) and beta-oxidation while inhibiting acetyl-CoA carboxylase (ACC) to prevent lipogenesis—completely uncoupled from the insulin/glucose or IGF-1 axis. CJC-1295 and Ipamorelin are administered at bedtime to deliver natural pulsatile growth hormone, supporting myofibrillar protein synthesis, tendon maintenance, and restorative slow-wave sleep during caloric restriction.',
    steps: [
      {
        id: 'lean_shred_step_aod9604',
        protocol_id: 'aod9604_cjc_ipam_fatloss_protocol',
        modality_id: 'aod9604_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 8 weeks)',
        required: true,
        dose_amount: 500,
        dose_unit: 'mcg',
        dose_text: '300–500 mcg SubQ upon waking fasted, 30m prior to cardio or breakfast (25 units from 5mg/2.5mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 25 units = 500 mcg on U-100 syringe). Inject SubQ into abdominal fat upon waking in a fasted state.',
        notes: 'Targeted adipocyte beta-3 lipolysis and inhibition of lipogenesis.',
        target_outcomes: ['Energy', 'Satiety', 'Endurance'],
        modality: aod9604_subq_modality
      },
      {
        id: 'lean_shred_step_cjc1295',
        protocol_id: 'aod9604_cjc_ipam_fatloss_protocol',
        modality_id: 'cjc1295_no_dac_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri for 8 weeks)',
        required: true,
        dose_amount: 100,
        dose_unit: 'mcg',
        dose_text: '100 mcg SubQ at bedtime on empty stomach (10 units from 2mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 2mg vial with 2.0 mL bacteriostatic water (1,000 mcg/mL; 10 units = 100 mcg). Inject SubQ 30–45m before sleep on empty stomach.',
        notes: 'Pituitary GHRH receptor stimulation for nocturnal somatotropic pulse.',
        target_outcomes: ['Sleep Quality', 'Waking Restedness', 'Energy'],
        modality: cjc1295_no_dac_subq_modality
      },
      {
        id: 'lean_shred_step_ipamorelin',
        protocol_id: 'aod9604_cjc_ipam_fatloss_protocol',
        modality_id: 'ipamorelin_subq',
        ordering_index: 3,
        display_order: 3,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri for 8 weeks)',
        required: true,
        dose_amount: 200,
        dose_unit: 'mcg',
        dose_text: '200 mcg SubQ co-administered with CJC-1295 at bedtime (10 units from 5mg/2.5mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 10 units = 200 mcg). Co-administer SubQ with CJC-1295 at bedtime on empty stomach.',
        notes: 'Selective GHS-R1a ghrelin receptor agonism for clean pulsatile GH release.',
        target_outcomes: ['Sleep Quality', 'Soreness', 'Joint Comfort'],
        modality: ipamorelin_subq_modality
      }
    ]
  },

  // 21. Retatrutide + Tesamorelin + MOTS-c ("Ultimate 2026 Metabolic Overhaul Stack")
  {
    id: 'retatrutide_tesamorelin_motsc_overhaul_protocol',
    name: 'Retatrutide + Tesamorelin + MOTS-c ("Ultimate 2026 Metabolic Overhaul Stack") Advanced Recomp Protocol',
    author_name: 'Next-Generation Metabolic & Cellular Longevity Medicine',
    source_label: 'Ultimate 2026 Metabolic Overhaul Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Maximum Metabolic Rate Acceleration, Visceral Adipose Elimination, Mitochondrial Recharging & Lean Mass Preservation',
    secondary_goals: [
      'Triple GIP / GLP-1 / Glucagon Receptor Agonism for Powerful Caloric Deficit & Thermogenesis',
      'Selective Visceral Fat Reduction & Pituitary GHRH Pulsatility via Tesamorelin',
      'Mitochondrial AMPK Activation, Skeletal Muscle GLUT4 Translocation & Fatigue Resistance via MOTS-c',
      'Preservation of Resting Metabolic Rate (RMR) and Lean Physical Stamina during Rapid Recomposition'
    ],
    target_population: 'Advanced biohackers and individuals pursuing the most comprehensive metabolic transformation possible in 2026, combining maximum fat-loss signaling with cellular energy and visceral health.',
    difficulty_level: 'Advanced',
    evidence_level: 'High (Phase 2 NEJM Clinical Data & Translational Trials)',
    safety_level: 'High',
    description: 'The pinnacle 2026 metabolic protocol. Triple-agonist Retatrutide shuts down hunger and cranks up calorie burning, Tesamorelin eliminates deep visceral organ fat, and MOTS-c recharges your cellular energy so you stay energized, strong, and active throughout your transformation.',
    rationale: 'Tri-vector multi-receptor metabolic and mitochondrial synergy. Retatrutide provides unmatched metabolic drive by agonising GLP-1 (satiety, slowed gastric motility), GIP (enhanced lipid buffering and insulin sensitivity), and Glucagon receptors (direct hepatocyte and brown fat thermogenesis, elevating resting energy expenditure). Tesamorelin directly mobilizes hazardous visceral adipose depots and boosts nocturnal somatotropic repair. MOTS-c prevents the lethargy and metabolic slowdown often seen during rapid fat loss by directly stimulating AMPK, upregulating mitochondrial biogenesis, and driving glucose directly into skeletal muscle for steady daytime energy.',
    steps: [
      {
        id: 'overhaul_step_retatrutide',
        protocol_id: 'retatrutide_tesamorelin_motsc_overhaul_protocol',
        modality_id: 'retatrutide_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: '1x / week (Sundays for 16 weeks)',
        required: true,
        dose_amount: 2000,
        dose_unit: 'mcg',
        dose_text: '2.0 mg – 4.0 mg SubQ 1x weekly on Sunday mornings (40 units from 5mg/1mL vial on U-100 syringe)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 1.0 mL bacteriostatic water (5,000 mcg/mL; 40 units = 2.0 mg on U-100 syringe). Inject SubQ once weekly on Sunday mornings into abdominal fat or upper thigh.',
        notes: 'Triple GLP-1/GIP/Glucagon receptor agonism for potent appetite regulation and thermogenic energy expenditure.',
        target_outcomes: ['Satiety', 'Digestive Comfort', 'Energy'],
        modality: retatrutide_subq_modality
      },
      {
        id: 'overhaul_step_tesamorelin',
        protocol_id: 'retatrutide_tesamorelin_motsc_overhaul_protocol',
        modality_id: 'tesamorelin_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri for 8-12 weeks)',
        required: true,
        dose_amount: 1000,
        dose_unit: 'mcg',
        dose_text: '1.0 mg SubQ at bedtime on empty stomach (50 units from 2mg/1mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 2mg vial with 1.0 mL bacteriostatic water (2,000 mcg/mL; 50 units = 1.0 mg). Inject SubQ 30–45m before sleep on empty stomach.',
        notes: 'Targeted visceral fat lipolysis and nocturnal somatotropic pulse preservation.',
        target_outcomes: ['Energy', 'Sleep Quality', 'Satiety'],
        modality: tesamorelin_subq_modality
      },
      {
        id: 'overhaul_step_motsc',
        protocol_id: 'retatrutide_tesamorelin_motsc_overhaul_protocol',
        modality_id: 'mots_c_subq',
        ordering_index: 3,
        display_order: 3,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: '2–3x / week (Mon/Wed/Fri for 4-8 weeks)',
        required: true,
        dose_amount: 5000,
        dose_unit: 'mcg',
        dose_text: '5.0 mg SubQ 2–3x weekly on Mon/Wed/Fri mornings fasted (50 units from 10mg/1mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 10mg vial with 1.0 mL bacteriostatic water (10,000 mcg/mL; 50 units = 5.0 mg). Inject SubQ into abdominal fat pad on Monday, Wednesday, and Friday mornings prior to fasted cardio.',
        notes: 'AMPK activation, skeletal muscle GLUT4 glucose uptake, and metabolic stamina preservation.',
        target_outcomes: ['Endurance', 'Strength', 'Energy'],
        modality: mots_c_subq_modality
      }
    ]
  },

  // 22. GHK-Cu + BPC-157 ("Skin + Repair Stack")
  {
    id: 'ghkcu_bpc157_skin_repair_protocol',
    name: 'GHK-Cu + BPC-157 ("Skin + Repair Stack") Dermal Rejuvenation & Tissue Healing Protocol',
    author_name: 'Dermatological Regeneration & Sports Medicine',
    source_label: 'Skin + Repair Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Skin Radiance, Collagen Synthesis, Tenocyte Migration & Accelerated Tissue Healing',
    secondary_goals: [
      'Pro-Collagen I/III & Decorin Dermal Matrix Upregulation via GHK-Cu',
      'VEGFR2 Angiogenesis, Nitric Oxide Synthesis & Focal Adhesion Healing via BPC-157',
      'Reduction of Skin Inflammation, Fine Lines & Accelerated Wound Repair',
      'Synergistic Microvascular Perfusion across Dermal and Musculoskeletal Tissues'
    ],
    target_population: 'Individuals wanting a simplified, potent two-peptide protocol for glowing skin, accelerated scar/wound healing, and joint/tissue recovery without adding multiple secretagogues.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Dermatology & Wound Healing Literature)',
    safety_level: 'High',
    description: 'A clean, two-peptide combination that rejuvenates your skin and repairs damaged connective tissue. GHK-Cu boosts collagen production and smooths skin texture, while BPC-157 accelerates deeper tissue healing and reduces joint discomfort.',
    rationale: 'Dual-action dermal and microvascular repair cascade. GHK-Cu (copper tripeptide-1) directly modulates thousands of human genes, upregulating pro-collagen I/III, elastin cross-linking, and proteoglycans while suppressing matrix metalloproteinases (MMPs) and inflammatory cytokines. BPC-157 provides complementary localized VEGFR2-mediated endothelial tube formation, nitric oxide synthesis, and FAK-paxillin focal adhesion signaling, accelerating both dermal wound closure and tendon/ligament tenocyte repair.',
    steps: [
      {
        id: 'skin_repair_step_ghkcu',
        protocol_id: 'ghkcu_bpc157_skin_repair_protocol',
        modality_id: 'ghk_cu_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 30 days)',
        required: true,
        dose_amount: 2000,
        dose_unit: 'mcg',
        dose_text: '1.5 mg – 2.0 mg SubQ daily in the morning (15–20 units from 50mg/5mL vial on U-100 syringe)',
        duration: '5 mins',
        instructions: 'Reconstitute 50mg vial with 5.0 mL bacteriostatic water (10,000 mcg/mL; 20 units = 2.0 mg). Inject SubQ into abdominal fat pad daily in the morning.',
        notes: 'Dermal remodeling, collagen synthesis, and matrix metalloproteinase regulation.',
        target_outcomes: ['Skin Clarity', 'Joint Comfort', 'Energy'],
        modality: ghk_cu_subq_modality
      },
      {
        id: 'skin_repair_step_bpc157',
        protocol_id: 'ghkcu_bpc157_skin_repair_protocol',
        modality_id: 'bpc157_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 30–60 days)',
        required: true,
        dose_amount: 250,
        dose_unit: 'mcg',
        dose_text: '250–500 mcg SubQ daily in the morning (10 units from 5mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.0 mL bacteriostatic water (2,500 mcg/mL; 10 units = 250 mcg). Inject SubQ into abdominal fat pad in the morning.',
        notes: 'VEGFR2 angiogenesis, nitric oxide synthesis, and localized collagen matrix repair.',
        target_outcomes: ['Joint Comfort', 'Pain', 'Soreness'],
        modality: bpc157_subq_modality
      }
    ]
  },

  // 23. AOD-9604 + Tesamorelin ("The Targeted Lipolysis Stack")
  {
    id: 'aod9604_tesamorelin_lipolysis_protocol',
    name: 'AOD-9604 + Tesamorelin ("The Targeted Lipolysis Stack") Visceral Fat & Adipocyte Oxidation Protocol',
    author_name: 'Cardiometabolic & Body Recomposition Sciences',
    source_label: 'Lipolysis Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Dual-Vector Subcutaneous & Visceral Fat Loss without Glycemic Disruption',
    secondary_goals: [
      'Adipocyte Beta-3 Adrenergic Receptor Lipolysis via AOD-9604 (hGH Fragment 177-191)',
      'Targeted Hepatic & Visceral Fat Reduction via Bedtime Tesamorelin (GHRH 1-44)',
      'Inhibition of Adipogenesis and Pre-Adipocyte Differentiation',
      'Cardiovascular Biomarker Optimization & Restorative Nocturnal Somatotropic Pulsatility'
    ],
    target_population: 'Individuals looking to target both stubborn subcutaneous body fat and deep visceral organ fat simultaneously, especially those seeking an alternative to GLP-1 agonists.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (FDA Clinical Trials & Metabolism Data)',
    safety_level: 'High',
    description: 'The ultimate dedicated fat-loss stack. AOD-9604 stimulates your body to burn stubborn subcutaneous body fat in the morning without touching blood sugar, while Tesamorelin zeroes in on deep visceral belly fat before sleep.',
    rationale: 'Comprehensive dual-compartment adipose oxidation matrix. AOD-9604 (tyrosine-substituted hGH fragment 177-191) selectively activates beta-3 adrenergic receptors on subcutaneous adipocytes to trigger hormone-sensitive lipase (HSL) and beta-oxidation while inhibiting lipogenesis, operating entirely independently of the insulin and IGF-1 pathways. Tesamorelin (trans-3-hexenoyl GHRH 1-44) is the premier clinically validated peptide for reducing deep visceral adipose tissue (~18% reduction in FDA trials) by stimulating endogenous pulsatile GH without causing insulin resistance, together providing full-body fat recomposition.',
    steps: [
      {
        id: 'lipolysis_step_aod9604',
        protocol_id: 'aod9604_tesamorelin_lipolysis_protocol',
        modality_id: 'aod9604_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 8-12 weeks)',
        required: true,
        dose_amount: 500,
        dose_unit: 'mcg',
        dose_text: '300–500 mcg SubQ upon waking fasted, 30m prior to cardio or breakfast (25 units from 5mg/2.5mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 25 units = 500 mcg on U-100 syringe). Inject SubQ into abdominal fat upon waking in a fasted state.',
        notes: 'Targeted adipocyte beta-3 lipolysis and inhibition of lipogenesis.',
        target_outcomes: ['Energy', 'Satiety', 'Endurance'],
        modality: aod9604_subq_modality
      },
      {
        id: 'lipolysis_step_tesamorelin',
        protocol_id: 'aod9604_tesamorelin_lipolysis_protocol',
        modality_id: 'tesamorelin_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri for 8-12 weeks)',
        required: true,
        dose_amount: 1000,
        dose_unit: 'mcg',
        dose_text: '1.0 mg – 2.0 mg SubQ at bedtime on empty stomach (50–100 units from 2mg/1mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 2mg vial with 1.0 mL bacteriostatic water (2,000 mcg/mL; 50 units = 1.0 mg). Inject SubQ 30–45m before sleep on empty stomach.',
        notes: 'Targeted visceral fat lipolysis and nocturnal somatotropic pulse preservation.',
        target_outcomes: ['Energy', 'Sleep Quality', 'Satiety'],
        modality: tesamorelin_subq_modality
      }
    ]
  },

  // 24. PT-141 + Kisspeptin-10 ("The Sexual Health & Libido Stack")
  {
    id: 'pt141_kisspeptin10_sexual_health_protocol',
    name: 'PT-141 + Kisspeptin-10 ("The Sexual Health & Libido Stack") Central Arousal & Endocrine Protocol',
    author_name: 'Neuroendocrine & Sexual Wellness Medicine',
    source_label: 'Sexual Health Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Central Sexual Motivation, Hypothalamic GnRH/LH Secretion & Physical Arousal Optimization',
    secondary_goals: [
      'Hypothalamic MPOA Melanocortin MC3/MC4 Receptor Dopaminergic Arousal via PT-141',
      'GPR54 (KISS1R) Receptor-Mediated Pulsatile GnRH/LH Stimulation via Kisspeptin-10',
      'Enhanced Physical Genital Vascular Responsiveness & Orgasmic Sensitivity',
      'Reduction of Psychological Performance Anxiety & Mood Elevation'
    ],
    target_population: 'Men and women experiencing hypoactive sexual desire, performance anxiety, or age-related declines in libido who want to restore natural physical desire and intimacy.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (FDA Phase 3 Trials & Neuroendocrinology Data)',
    safety_level: 'High',
    description: 'A comprehensive sexual-wellness protocol designed to reignite natural desire and bedroom confidence. PT-141 activates the brain\'s sexual arousal centers, while Kisspeptin-10 stimulates your body\'s natural hormone pathways to elevate libido and mood.',
    rationale: 'Dual-tier central neurological and neuroendocrine sexual enhancement. PT-141 (Bremelanotide) crosses the blood-brain barrier to bind melanocortin MC3 and MC4 receptors in the medial preoptic area (MPOA) of the hypothalamus, directly stimulating dopaminergic sexual desire and autonomic pelvic vascular engorgement. Kisspeptin-10 complements this centrally by binding hypothalamic GPR54 (KISS1R) receptors, stimulating pulsatile GnRH secretion to boost downstream pituitary LH/FSH and gonadal steroidogenesis while modulating limbic brain regions responsible for sexual attraction and emotional reward.',
    steps: [
      {
        id: 'sexual_health_step_pt141',
        protocol_id: 'pt141_kisspeptin10_sexual_health_protocol',
        modality_id: 'pt141_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'evening',
        timing_anchor: 'evening',
        frequency: 'As-Needed (1–2x / Week Max)',
        required: true,
        dose_amount: 1000,
        dose_unit: 'mcg',
        dose_text: '1.0 mg – 1.75 mg SubQ as-needed 1–2 hours prior to intimacy (20 units from 10mg/2mL vial on U-100 syringe)',
        duration: '5 mins',
        instructions: 'Reconstitute 10mg vial with 2.0 mL bacteriostatic water (5,000 mcg/mL; 20 units = 1.0 mg on U-100 syringe). Inject SubQ into abdominal fat 1 to 2 hours prior to anticipated intimacy.',
        notes: 'Central MPOA MC3/MC4 receptor activation for dopaminergic sexual arousal.',
        target_outcomes: ['Libido', 'Mood', 'Energy'],
        modality: pt141_subq_modality
      },
      {
        id: 'sexual_health_step_kisspeptin',
        protocol_id: 'pt141_kisspeptin10_sexual_health_protocol',
        modality_id: 'kisspeptin10_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'evening',
        timing_anchor: 'evening',
        frequency: '2–3x / Week or As-Needed',
        required: true,
        dose_amount: 100,
        dose_unit: 'mcg',
        dose_text: '100–200 mcg SubQ 2–3x weekly in the evening or 1–2h prior to intimacy (5–10 units from 5mg/2.5mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 5 units = 100 mcg). Inject SubQ 1–2 hours before intimacy or 2–3x weekly in the evening.',
        notes: 'GPR54 receptor stimulation driving pulsatile GnRH/LH secretion and limbic attraction.',
        target_outcomes: ['Libido', 'Mood', 'Emotional Resilience'],
        modality: kisspeptin10_subq_modality
      }
    ]
  },

  // 25. Thymosin Alpha-1 + KPV ("The Immune Balance Stack")
  {
    id: 'ta1_kpv_immune_balance_protocol',
    name: 'Thymosin Alpha-1 + KPV ("The Immune Balance Stack") Anti-Inflammatory & Immunomodulation Protocol',
    author_name: 'Clinical Immunology & Bioregulatory Medicine',
    source_label: 'Immune Balance Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Innate & Adaptive Immune Priming, Systemic NF-κB Suppression & Cytokine Balance',
    secondary_goals: [
      'Dendritic & Myeloid TLR9 Activation for CD8+ T-Cell & Natural Killer (NK) Expansion via TA-1',
      'Cellular PepT1 Transporter NF-κB Nuclear Translocation Blockade via KPV',
      'Resolution of Chronic Subclinical Inflammation without Immunosuppression',
      'Restoration of Regulatory T-Cell (Treg) Homeostasis in Autoimmune-Prone Profiles'
    ],
    target_population: 'Individuals dealing with systemic inflammation, chronic joint aches, autoimmune flares, or frequent illness who need a clean immune regulator without growth hormone secretagogues.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Immunology & Inflammatory Disease Literature)',
    safety_level: 'High',
    description: 'A clean, focused stack to cool systemic inflammation and balance your immune system. KPV turns down inflammatory flare-ups, while Thymosin Alpha-1 strengthens your body\'s frontline cellular defenses so you stay resilient year-round.',
    rationale: 'Integrated immunomodulatory and cellular anti-inflammatory synergy. Thymosin Alpha-1 (TA-1 / Zadaxin) activates dendritic Toll-like receptor 9 (TLR9), upregulating cytotoxic CD8+ T-lymphocytes, Natural Killer (NK) cells, and interferon-gamma (IFN-γ) while fostering regulatory T-cell (Treg) balance to prevent autoimmune overactivation. Simultaneously, KPV (C-terminal tripeptide of α-MSH) utilizes oligopeptide transporters (PepT1) to enter inflammatory cells and block the nuclear translocation of NF-κB, rapidly reducing circulating pro-inflammatory cytokines (TNF-α, IL-1β, IL-6) and calming persistent tissue irritation.',
    steps: [
      {
        id: 'immune_balance_step_ta1',
        protocol_id: 'ta1_kpv_immune_balance_protocol',
        modality_id: 'ta1_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: '2x / Week (Mondays & Thursdays for 8 weeks)',
        required: true,
        dose_amount: 1500,
        dose_unit: 'mcg',
        dose_text: '1.5 mg SubQ 2x weekly on Monday and Thursday mornings (75 units from 5mg/2.5mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 75 units = 1.5 mg on U-100 syringe). Inject SubQ on Mondays and Thursdays in the morning.',
        notes: 'TLR9 dendritic cell activation, CD8+ T-cell expansion, and regulatory T-cell balance.',
        target_outcomes: ['Immune Resilience', 'Energy', 'Mood'],
        modality: ta1_subq_modality
      },
      {
        id: 'immune_balance_step_kpv',
        protocol_id: 'ta1_kpv_immune_balance_protocol',
        modality_id: 'kpv_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 8 weeks)',
        required: true,
        dose_amount: 250,
        dose_unit: 'mcg',
        dose_text: '200–500 mcg SubQ daily in the morning (10–25 units from 5mg/2.5mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 12.5 units = 250 mcg). Inject SubQ into abdominal fat in the morning.',
        notes: 'Direct PepT1-mediated NF-κB nuclear translocation inhibition and cytokine cooling.',
        target_outcomes: ['Pain', 'Soreness', 'Digestive Comfort'],
        modality: kpv_subq_modality
      }
    ]
  },

  // 26. BPC-157 + KPV + Thymosin Alpha-1 ("Gut + Immune Stack")
  {
    id: 'bpc_kpv_ta1_gut_immune_protocol',
    name: 'BPC-157 + KPV + Thymosin Alpha-1 ("Gut + Immune Barrier Stack") Systemic Mucosal & Cellular Defense Protocol',
    author_name: 'Integrative Gastroenterology & Clinical Immunology',
    source_label: 'Gut + Immune Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Intestinal Epithelial Barrier Repair, Mucosal NF-κB Quenching & Systemic Immune Fortification',
    secondary_goals: [
      'VEGFR2 Mucosal Angiogenesis & Tight-Junction Protein Sealing via BPC-157',
      'Intestinal PepT1-Mediated NF-κB Downregulation & Visceral Calming via KPV',
      'Systemic Dendritic TLR9 Cell Priming & Pathogen Defense via Thymosin Alpha-1',
      'Prevention of Endotoxin Lipopolysaccharide (LPS) Translocation & Systemic Fatigue'
    ],
    target_population: 'Individuals with complex gut-immune challenges, leaky gut, post-infectious fatigue, food sensitivities, or chronic autoimmune inflammation.',
    difficulty_level: 'Advanced',
    evidence_level: 'High (Gastroenterology & Immunopharmacology Trials)',
    safety_level: 'High',
    description: 'The comprehensive gut and immune overhaul. BPC-157 seals and heals the intestinal lining, KPV shuts down gut inflammation and bloating, and Thymosin Alpha-1 empowers your immune system to defend against pathogens and stay resilient.',
    rationale: 'Tri-peptide mucosal, anti-inflammatory, and systemic defense network. BPC-157 upregulates EGR-1 gene transcription, drives VEGFR2 microvascular perfusion, and repairs claudin/occludin tight-junction integrity to restore gut permeability. KPV enters mucosal cells via the PepT1 transporter to inhibit NF-κB and downregulate inflammatory cytokines (IL-1β, IL-6, TNF-α). Thymosin Alpha-1 provides the systemic defense layer by stimulating dendritic cell TLR9 signaling, restoring balanced T-cell immunity, and neutralizing systemic endotoxemic stress caused by gut barrier breaches.',
    steps: [
      {
        id: 'gut_immune_step_bpc157',
        protocol_id: 'bpc_kpv_ta1_gut_immune_protocol',
        modality_id: 'bpc157_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 8 weeks)',
        required: true,
        dose_amount: 250,
        dose_unit: 'mcg',
        dose_text: '250–500 mcg SubQ daily in the morning (10 units from 5mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.0 mL bacteriostatic water (2,500 mcg/mL; 10 units = 250 mcg). Inject SubQ into abdominal fat pad daily in the morning.',
        notes: 'VEGFR2 mucosal angiogenesis and tight-junction claudin/occludin protein synthesis.',
        target_outcomes: ['Digestive Comfort', 'Pain', 'Energy'],
        modality: bpc157_subq_modality
      },
      {
        id: 'gut_immune_step_kpv',
        protocol_id: 'bpc_kpv_ta1_gut_immune_protocol',
        modality_id: 'kpv_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 8 weeks)',
        required: true,
        dose_amount: 250,
        dose_unit: 'mcg',
        dose_text: '200–500 mcg SubQ daily in the morning (10–25 units from 5mg/2.5mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 12.5 units = 250 mcg). Inject SubQ in the morning on empty stomach.',
        notes: 'PepT1 transporter uptake and intestinal mucosal NF-κB inhibition.',
        target_outcomes: ['Digestive Comfort', 'Pain', 'Soreness'],
        modality: kpv_subq_modality
      },
      {
        id: 'gut_immune_step_ta1',
        protocol_id: 'bpc_kpv_ta1_gut_immune_protocol',
        modality_id: 'ta1_subq',
        ordering_index: 3,
        display_order: 3,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: '2x / Week (Mondays & Thursdays for 8 weeks)',
        required: true,
        dose_amount: 1500,
        dose_unit: 'mcg',
        dose_text: '1.5 mg SubQ 2x weekly on Monday and Thursday mornings (75 units from 5mg/2.5mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 75 units = 1.5 mg). Inject SubQ on Mon/Thu mornings.',
        notes: 'Systemic TLR9 dendritic cell activation and immune resilience reinforcement.',
        target_outcomes: ['Immune Resilience', 'Energy', 'Mood'],
        modality: ta1_subq_modality
      }
    ]
  },

  // 27. GHK-Cu + Epitalon ("Skin Longevity Stack")
  {
    id: 'ghkcu_epitalon_skin_longevity_protocol',
    name: 'GHK-Cu + Epitalon ("Skin Longevity Stack") Telomere Support & Dermal Matrix Renewal Protocol',
    author_name: 'Aesthetic Longevity & Biogerontology Medicine',
    source_label: 'Skin Longevity Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Dermal Extracellular Matrix Remodeling, Pineal Circadian Reset & Cellular Telomere Protection',
    secondary_goals: [
      'Pro-Collagen I/III, Elastin & Decorin Synthesis via GHK-Cu Copper Peptide',
      'Epithalamus-Pineal Axis Melatonin Secretion Restoration via Epitalon (AGAG)',
      'Telomerase (TERT) Gene Induction & Protection against Cellular Senescence',
      'Nocturnal Deep Sleep Cellular Regeneration for Youthful Skin Texture & Glow'
    ],
    target_population: 'Individuals focused on biological age reversal, cellular longevity, and skin anti-aging who want to protect their DNA, deepen restorative sleep, and visibly firm their skin.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Gerontology & Dermatology Literature)',
    safety_level: 'High',
    description: 'A premier longevity and beauty protocol that works from the inside out. GHK-Cu firms skin and triggers deep collagen renewal, while Epitalon resets your biological sleep clock, boosts nighttime cellular repair, and supports telomere health for long-term anti-aging.',
    rationale: 'Integrated biogerontological and dermatological anti-aging protocol. GHK-Cu directly stimulates fibroblasts to upregulate collagen I/III, elastin, and glycosaminoglycans, while clearing senescent cellular debris and suppressing MMPs. Epitalon (Ala-Glu-Asp-Gly synthetic pineal tetrapeptide) acts on the pineal-epithalamic axis to restore youthful nocturnal melatonin rhythmicity, upregulate telomerase (TERT) catalytic subunit expression, and enhance cellular antioxidant defenses during deep slow-wave sleep, combating two primary hallmarks of skin and biological aging.',
    steps: [
      {
        id: 'skin_long_step_ghkcu',
        protocol_id: 'ghkcu_epitalon_skin_longevity_protocol',
        modality_id: 'ghk_cu_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 30 days)',
        required: true,
        dose_amount: 2000,
        dose_unit: 'mcg',
        dose_text: '1.5 mg – 2.0 mg SubQ daily in the morning (15–20 units from 50mg/5mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 50mg vial with 5.0 mL bacteriostatic water (10,000 mcg/mL; 20 units = 2.0 mg). Inject SubQ into abdominal fat pad daily in the morning.',
        notes: 'Dermal remodeling, collagen synthesis, and matrix metalloproteinase regulation.',
        target_outcomes: ['Skin Clarity', 'Joint Comfort', 'Energy'],
        modality: ghk_cu_subq_modality
      },
      {
        id: 'skin_long_step_epitalon',
        protocol_id: 'ghkcu_epitalon_skin_longevity_protocol',
        modality_id: 'epitalon_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: 'Daily (7 days/week for 10–20 days, 2x yearly)',
        required: true,
        dose_amount: 5000,
        dose_unit: 'mcg',
        dose_text: '5.0 mg – 10.0 mg SubQ daily at bedtime (50–100 units from 10mg/1mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 10mg vial with 1.0 mL bacteriostatic water (10,000 mcg/mL; 50 units = 5.0 mg). Inject SubQ 30–60m before sleep for a 10–20 day cycle.',
        notes: 'Pineal gland restoration, endogenous melatonin rhythm normalization, and telomerase support.',
      }
    ]
  },

  // 28. GHK-Cu (Topical) + Red Light Therapy ("The Photonic Glow Protocol")
  {
    id: 'photonic_ghkcu_red_light_protocol',
    name: 'GHK-Cu (Topical) + Red Light Therapy ("The Photonic Glow Protocol") Dermal Remodeling & Collagen Synthesis',
    author_name: 'Aesthetic Photobiology & Dermatological Science',
    source_label: 'Photonic Glow Protocol',
    protocol_type: 'expert_created',
    primary_goal: 'Dermal Pro-Collagen Synthesis, Skin Texture Smoothing & Cellular Photobiomodulation',
    secondary_goals: [
      'Dermal mRNA Gene Induction of Pro-Collagen I/III & Decorin via GHK-Cu',
      'Mitochondrial Cytochrome c Oxidase & Intracellular ATP Amplification via 630/830nm LED',
      'Bioactive Collagen Cross-Linking & Dermal Matrix Thickness Support',
      'Suppression of Matrix Metalloproteinases (MMPs) & Photodamage Repair'
    ],
    target_population: 'Individuals aiming to reverse photo-aging, erase fine lines, tighten skin, and optimize complexion radiance through paired biochemical and photonic biohacking.',
    difficulty_level: 'Beginner',
    evidence_level: 'High (Dermatology RCTs & Photobiology Meta-Analyses)',
    safety_level: 'High',
    description: 'The ultimate skin-rejuvenation ritual. High-potency topical GHK-Cu copper peptide tells your skin cells to produce new collagen and elastin, while medical-grade red and near-infrared light supercharges your skin\'s cellular batteries to dramatically accelerate smoothing and glow.',
    rationale: 'Photonic-biochemical synergy across dermal layers. Topical GHK-Cu (copper tripeptide-1) delivers bioactive copper to fibroblasts, directly upregulating mRNA transcription of pro-collagen I, pro-collagen III, and decorin while dampening destructive matrix metalloproteinases (MMP-1/2). Red (630nm) and near-infrared (830nm) photobiomodulation photonically stimulates Cytochrome c Oxidase in the mitochondrial respiratory chain, accelerating ATP synthesis and generating reactive oxygen species (ROS) micro-pulses that drive fibroblast migration. When applied prior to LED illumination, GHK-Cu absorption and collagen matrix assembly are magnified compared to either modality alone.',
    steps: [
      {
        id: 'photonic_step_ghkcu',
        protocol_id: 'photonic_ghkcu_red_light_protocol',
        modality_id: 'ghk_cu_topical',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'evening',
        timing_anchor: 'evening',
        frequency: 'Daily (Evening)',
        required: true,
        dose_amount: 5,
        dose_unit: 'drops',
        dose_text: '4–6 drops of 3% GHK-Cu serum massaged into face, neck, or scars',
        duration: '5 mins',
        instructions: 'After gentle cleansing, apply 4–6 drops of 3% GHK-Cu serum evenly across face and neck. Allow 2–3 minutes for absorption prior to red light therapy session.',
        notes: 'Direct fibroblast stimulation, pro-collagen mRNA upregulation, and MMP clearance.',
        target_outcomes: ['Skin Clarity', 'Joint Comfort'],
        modality: ghk_cu_topical_modality
      },
      {
        id: 'photonic_step_redlight',
        protocol_id: 'photonic_ghkcu_red_light_protocol',
        modality_id: 'red_light_therapy',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'evening',
        timing_anchor: 'evening',
        frequency: '4–5x / Week (10–15 mins)',
        required: true,
        dose_amount: 15,
        dose_unit: 'mins',
        dose_text: '10–15 mins @ 40–60 mW/cm² (630nm Red + 830nm NIR)',
        duration: '15 mins',
        instructions: 'Position LED mask or light panel 4–6 inches from face. Run for 10–15 minutes on combined red (630nm) and near-infrared (830nm) mode. Keep eyes closed or use protective goggles.',
        notes: 'Mitochondrial Cytochrome c Oxidase activation and ATP-driven collagen matrix synthesis.',
        target_outcomes: ['Skin Clarity', 'Energy'],
        modality: red_light_therapy_modality
      },
      {
        id: 'photonic_step_collagen',
        protocol_id: 'photonic_ghkcu_red_light_protocol',
        modality_id: 'collagen_peptides',
        ordering_index: 3,
        display_order: 3,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (Morning)',
        required: true,
        dose_amount: 10000,
        dose_unit: 'mg',
        dose_text: '10g – 15g hydrolyzed collagen peptides with 500mg Vitamin C',
        duration: '5 mins',
        instructions: 'Mix 10–15g of hydrolyzed collagen powder into morning coffee, smoothie, or water along with 500mg Vitamin C to provide the essential amino acids for dermal remodeling.',
        notes: 'Provides glycine, proline, and hydroxyproline substrates for active fibroblast synthesis.',
        target_outcomes: ['Skin Clarity', 'Joint Comfort'],
        modality: collagen_peptides_modality
      }
    ]
  },

  // 29. BPC-157 + TB-500 + Contrast Therapy ("The Wolverine Hyper-Recovery Protocol")
  {
    id: 'wolverine_thermal_recovery_protocol',
    name: 'BPC-157 + TB-500 + Contrast Therapy ("The Wolverine Hyper-Recovery Protocol") Joint, Tendon & Thermal Shock Recovery',
    author_name: 'Sports Medicine & Thermal Physiology',
    source_label: 'Wolverine Hyper-Recovery Protocol',
    protocol_type: 'expert_created',
    primary_goal: 'Targeted Tendon/Ligament Microvascular Angiogenesis, Heat Shock Protein Induction & Musculoskeletal Restoration',
    secondary_goals: [
      'VEGFR2-Mediated Microvascular Endothelial Tube Formation via BPC-157',
      'Actin Filament Upregulation & Cellular Tenocyte Remodeling via TB-500',
      'Heat Shock Protein (HSP70/HSP90) Synthesis & Vasodilatory Micro-Perfusion via Sauna',
      'Norepinephrine Surge & Lymphatic Inflammatory Drainage via Cold Immersion'
    ],
    target_population: 'Athletes, lifters, and active individuals recovering from tendonitis, ligament sprains, joint wear, or intense training blocks who want the most advanced physical recovery protocol available.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Regenerative Medicine & Exercise Science Trials)',
    safety_level: 'High',
    description: 'The pinnacle athletic recovery protocol. Combines the tissue-repair power of BPC-157 and TB-500 with thermal sauna and cold plunge to drive healing peptides deep into stubborn tendons and joints while flushing out post-workout soreness.',
    rationale: 'Physiological vascularization and cytoprotective thermal synergy. Tendons, ligaments, and meniscal tissues suffer from inherently low vascular perfusion. BPC-157 directly upregulates VEGFR2 receptor expression to form new collateral capillary beds, while TB-500 accelerates actin-mediated cell migration. Whole-body sauna thermal stress (174°F+) surges peripheral nitric oxide and cardiac output, forcing high peptide concentrations into hypovascular articular capsules while inducing cytoprotective Heat Shock Proteins (HSP70). Subsequent cold plunge immersion triggers robust vasoconstriction and a 250% norepinephrine surge to clear edema, followed by reactive hyperemic nutrient delivery that locks healing peptides into the joint.',
    steps: [
      {
        id: 'wolverine_thermal_step_bpc157',
        protocol_id: 'wolverine_thermal_recovery_protocol',
        modality_id: 'bpc157_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (7 days/week for 4–8 weeks)',
        required: true,
        dose_amount: 250,
        dose_unit: 'mcg',
        dose_text: '250–500 mcg SubQ daily in the morning (10 units from 5mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.0 mL bacteriostatic water (2,500 mcg/mL; 10 units = 250 mcg). Inject SubQ into abdominal fat pad or near target joint in the morning.',
        notes: 'VEGFR2 angiogenesis, nitric oxide synthesis, and localized collagen matrix repair.',
        target_outcomes: ['Joint Comfort', 'Pain', 'Soreness'],
        modality: bpc157_subq_modality
      },
      {
        id: 'wolverine_thermal_step_tb500',
        protocol_id: 'wolverine_thermal_recovery_protocol',
        modality_id: 'tb500_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'evening',
        timing_anchor: 'evening',
        frequency: '2x / Week (Tuesdays & Fridays for 4–6 weeks)',
        required: true,
        dose_amount: 2500,
        dose_unit: 'mcg',
        dose_text: '2.5 mg SubQ 2x weekly on Tue/Fri (50 units from 5mg/1mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 1.0 mL bacteriostatic water (5,000 mcg/mL; 50 units = 2.5 mg). Inject SubQ on Tuesday and Friday evenings.',
        notes: 'Actin filament upregulation, cell migration, and systemic tissue remodeling.',
        target_outcomes: ['Joint Comfort', 'Soreness', 'Pain'],
        modality: tb500_subq_modality
      },
      {
        id: 'wolverine_thermal_step_sauna',
        protocol_id: 'wolverine_thermal_recovery_protocol',
        modality_id: 'sauna_exposure',
        ordering_index: 3,
        display_order: 3,
        timing_slot: 'evening',
        timing_anchor: 'evening',
        frequency: '3–4x / Week (20 mins)',
        required: true,
        dose_amount: 20,
        dose_unit: 'mins',
        dose_text: '20 mins @ 174°F–200°F (80°C–93°C) Finnish dry heat',
        duration: '20 mins',
        instructions: 'Enter Finnish dry sauna preheated to 174°F–200°F (80°C–93°C). Pre-hydrate with 16 oz electrolyte water. Remain seated for 20 minutes to upregulate HSP70 molecular chaperones and surge peripheral nitric oxide into articular capsules.',
        notes: 'Convective hyperthermic Heat Shock Protein (HSP70) synthesis and microvascular blood flow surge.',
        target_outcomes: ['Soreness', 'Joint Comfort', 'Stress'],
        modality: sauna_exposure_modality
      },
      {
        id: 'wolverine_thermal_step_cold',
        protocol_id: 'wolverine_thermal_recovery_protocol',
        modality_id: 'cold_water_immersion',
        ordering_index: 4,
        display_order: 4,
        timing_slot: 'evening',
        timing_anchor: 'evening',
        frequency: '3–4x / Week (2–3 mins)',
        required: true,
        dose_amount: 3,
        dose_unit: 'mins',
        dose_text: '2–3 mins @ 50°F–55°F (10°C–13°C) full immersion plunge',
        duration: '5 mins',
        instructions: 'Submerge to clavicle level in cold water immersion tub (50°F–55°F / 10°C–13°C) immediately after sauna. Breathe slowly and steadily for 2–3 minutes. Exit and re-warm autonomously via Søberg principle to maximize brown fat thermogenesis.',
        notes: 'Hydrostatic venous compression, 250% dopamine and norepinephrine release, and acute edema flushing.',
        target_outcomes: ['Soreness', 'Energy', 'Mood'],
        modality: cold_water_immersion_modality
      }
    ]
  },

  // 30. MOTS-c + Fasted Zone-2 Cardio ("The Mito-Metabolic Biogenesis Engine")
  {
    id: 'mots_c_zone2_mitochondrial_protocol',
    name: 'MOTS-c + Fasted Zone-2 Cardio ("The Mito-Metabolic Biogenesis Engine") Cellular Energy & Aerobic Capacity Protocol',
    author_name: 'Cellular Bioenergetics & Endurance Physiology',
    source_label: 'Mito-Metabolic Biogenesis Engine',
    protocol_type: 'expert_created',
    primary_goal: 'Mitochondrial Density Expansion, Skeletal Muscle AMPK/GLUT4 Activation & Zone-2 Fatty Acid Beta-Oxidation',
    secondary_goals: [
      'Mitochondrial-Encoded AMPK Phosphorylation & Skeletal Muscle Glucose Translocation',
      'PGC-1α Transcription Upregulation for Enhanced Cristae Density',
      'Substrate Shift toward Fatty Acid Oxidation & Blood Lactate Clearance',
      'Enhanced VO2 Max Baseline & Resistance to Physical/Mental Exhaustion'
    ],
    target_population: 'Runners, cyclists, cross-trainers, and longevity enthusiasts seeking to multiply their cellular energy engines, increase fat burning, and raise aerobic stamina.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Translational Mitochondrial & Exercise Physiology Trials)',
    safety_level: 'High',
    description: 'Turn your cells into high-efficiency energy factories. Morning MOTS-c acts as an exercise mimetic that prompts your muscles to suck up glucose and burn fat, multiplying the aerobic conditioning and mitochondrial benefits of your fasted Zone-2 workouts.',
    rationale: 'Mitochondrial-nuclear signaling and aerobic substrate synergy. MOTS-c (16-amino acid mitochondrial-derived peptide) translocates to the nucleus under metabolic stress to directly activate 5\'-AMP-activated protein kinase (AMPK) and stimulate skeletal muscle GLUT4 glucose uptake independently of insulin. Pairing peak morning MOTS-c plasma concentrations with fasted Zone-2 aerobic training (lactate 1.5–2.0 mmol/L) drives maximal PGC-1α expression, expanding mitochondrial density, optimizing carnitine palmitoyltransferase-1 (CPT-1) fat oxidation, and accelerating cellular energy production.',
    steps: [
      {
        id: 'mito_step_motsc',
        protocol_id: 'mots_c_zone2_mitochondrial_protocol',
        modality_id: 'mots_c_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: '2–3x / Week (Mon/Wed/Fri for 4–8 weeks)',
        required: true,
        dose_amount: 5000,
        dose_unit: 'mcg',
        dose_text: '5.0 mg SubQ 2–3x weekly on Mon/Wed/Fri mornings fasted (50 units from 10mg/1mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 10mg vial with 1.0 mL bacteriostatic water (10,000 mcg/mL; 50 units = 5.0 mg). Inject SubQ into abdominal fat 30 minutes prior to morning fasted Zone-2 session.',
        notes: 'Direct mitochondrial AMPK activation and GLUT4 glucose transporter translocation.',
        target_outcomes: ['Endurance', 'Strength', 'Energy'],
        modality: mots_c_subq_modality
      },
      {
        id: 'mito_step_zone2',
        protocol_id: 'mots_c_zone2_mitochondrial_protocol',
        modality_id: 'zone_2_cardio',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: '3–4x / Week (45–60 mins)',
        required: true,
        dose_amount: 45,
        dose_unit: 'mins',
        dose_text: '45–60 mins @ 65%–75% Max HR (1.5–2.0 mmol/L lactate)',
        duration: '60 mins',
        instructions: 'Perform steady aerobic exercise (cycling, incline treadmill walk, rowing) maintaining conversation pace in Zone 2 heart rate zone. Complete in a fasted state.',
        notes: 'Stimulates PGC-1α mitochondrial biogenesis and long-chain fatty acid oxidation.',
        target_outcomes: ['Endurance', 'Energy', 'Mental Clarity'],
        modality: zone_2_cardio_modality
      },
      {
        id: 'mito_step_fasting',
        protocol_id: 'mots_c_zone2_mitochondrial_protocol',
        modality_id: 'intermittent_fasting_16_8',
        ordering_index: 3,
        display_order: 3,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (16:8 Fasting Window)',
        required: true,
        dose_amount: 16,
        dose_unit: 'hours',
        dose_text: '16-hour overnight fast (water, black coffee, or electrolytes only until midday)',
        duration: '5 mins',
        instructions: 'Maintain an overnight 16-hour fasting window (e.g. 8:00 PM to 12:00 PM next day). Complete workout before breaking fast with high-protein whole foods.',
        notes: 'Maximizes baseline autophagy and clears hepatic glycogen for pure fat burning.',
        target_outcomes: ['Energy', 'Satiety', 'Mental Clarity'],
        modality: intermittent_fasting_16_8_modality
      }
    ]
  },

  // 31. CJC-1295 + Ipamorelin + Sleep Optimization ("The Somatotropic Sleep & Glymphatic Reset")
  {
    id: 'cjc_ipam_anabolic_sleep_protocol',
    name: 'CJC-1295 + Ipamorelin + Sleep Optimization ("The Somatotropic Sleep & Glymphatic Reset") Deep Sleep & Growth Hormone Protocol',
    author_name: 'Circadian Neuroendocrinology & Sleep Medicine',
    source_label: 'Somatotropic Sleep & Glymphatic Reset',
    protocol_type: 'expert_created',
    primary_goal: 'Stage 3/4 Slow-Wave Sleep (SWS) Expansion, Nocturnal Somatotropin Pulsatility & Brain Glymphatic Clearance',
    secondary_goals: [
      'Pituitary GHRH / GHS-R1a Synergistic GH Secretion without Cortisol Spikes',
      'Circadian Pineal Melatonin Preservation via Blue-Light Photoreceptor Shielding',
      'Nasal Paranasal Nitric Oxide Generation & Parasympathetic Vagal Dominance',
      'Glymphatic Cerebral Spinal Fluid Clearance of Metabolic Waste during Delta Sleep'
    ],
    target_population: 'Individuals struggling with fragmented sleep, poor recovery, or high nighttime stress who want deep, transformative restorative sleep and clean growth hormone production.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Clinical Endocrinology & Sleep Physiology Trials)',
    safety_level: 'High',
    description: 'The ultimate deep-sleep and nighttime recovery protocol. Bedtime CJC-1295 and Ipamorelin stimulate powerful natural pulses of growth hormone while you rest, paired with strict light and breathing habits that unlock deeper delta sleep and clear morning brain fog.',
    rationale: 'Endocrine somatotropic and circadian neuro-entrainment synergy. Pituitary somatotroph GHRH receptors are heavily suppressed by postprandial insulin, glucose, and sympathetic cortisol. Pairing CJC-1295 (Mod GRF 1-29) + Ipamorelin with a 3-hour pre-bed fast removes somatostatin inhibition, allowing a maximal growth hormone surge. Blocking blue light (450–480nm) preserves pineal melatonin rhythmicity, while sleep mouth taping forces continuous nasal nitric oxide inhalation and vagal parasympathetic dominance. Together, these interventions expand Stage 3/4 Slow-Wave Sleep by 20%–30%, during which the brain\'s glymphatic system expands by 60% to clear neurotoxic metabolic waste.',
    steps: [
      {
        id: 'sleep_reset_step_cjc',
        protocol_id: 'cjc_ipam_anabolic_sleep_protocol',
        modality_id: 'cjc1295_no_dac_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri)',
        required: true,
        dose_amount: 100,
        dose_unit: 'mcg',
        dose_text: '100 mcg SubQ at bedtime on empty stomach (10 units from 2mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 2mg vial with 2.0 mL bacteriostatic water (1,000 mcg/mL; 10 units = 100 mcg). Inject SubQ 30–45m before sleep on an empty stomach (2.5h+ after dinner).',
        notes: 'GHRH analog pulse amplifier under uninhibited fasting conditions.',
        target_outcomes: ['Sleep Quality', 'Waking Restedness', 'Energy'],
        modality: cjc1295_no_dac_subq_modality
      },
      {
        id: 'sleep_reset_step_ipam',
        protocol_id: 'cjc_ipam_anabolic_sleep_protocol',
        modality_id: 'ipamorelin_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: '5 Days On / 2 Days Off (Mon–Fri)',
        required: true,
        dose_amount: 200,
        dose_unit: 'mcg',
        dose_text: '200 mcg SubQ co-administered with CJC-1295 at bedtime (10 units from 5mg/2.5mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 5mg vial with 2.5 mL bacteriostatic water (2,000 mcg/mL; 10 units = 200 mcg). Inject SubQ co-administered with CJC-1295.',
        notes: 'Selective GHS-R1a agonist triggering endogenous pituitary GH vesicle release.',
        target_outcomes: ['Sleep Quality', 'Waking Restedness', 'Energy'],
        modality: ipamorelin_subq_modality
      },
      {
        id: 'sleep_reset_step_blueblock',
        protocol_id: 'cjc_ipam_anabolic_sleep_protocol',
        modality_id: 'blue_light_blocking',
        ordering_index: 3,
        display_order: 3,
        timing_slot: 'evening',
        timing_anchor: 'evening',
        frequency: 'Daily (2–3h Pre-Bed)',
        required: true,
        dose_amount: 2,
        dose_unit: 'hours',
        dose_text: 'Wear 100% blue/green amber blocking glasses starting 2–3 hours before bed',
        duration: '5 mins',
        instructions: 'Put on amber or red-tinted glasses after sunset or 2–3 hours before target sleep time to block artificial screen wavelengths and protect melatonin release.',
        notes: 'Prevents ipRGC retinal excitation and preserves pineal melatonin pulsatility.',
        target_outcomes: ['Sleep Quality', 'Sleep Latency'],
        modality: blue_light_blocking_modality
      },
      {
        id: 'sleep_reset_step_mouthtape',
        protocol_id: 'cjc_ipam_anabolic_sleep_protocol',
        modality_id: 'mouth_taping',
        ordering_index: 4,
        display_order: 4,
        timing_slot: 'pre_bed',
        timing_anchor: 'pre_bed',
        frequency: 'Daily (Nightly)',
        required: true,
        dose_amount: 1,
        dose_unit: 'strip',
        dose_text: '1 strip medical-grade micropore tape applied vertically over lips',
        duration: '1 min',
        instructions: 'Apply a vertical strip of hypoallergenic micropore tape over the center of closed lips right before turning off bedroom lights. Enforces pure nasal breathing.',
        notes: 'Generates paranasal nitric oxide and stabilizes parasympathetic heart rate variability.',
        target_outcomes: ['Sleep Quality', 'Waking Restedness'],
        modality: mouth_taping_modality
      }
    ]
  },

  // 32. Semax + Selank + Circadian Focus ("The Neuro-Plasticity & Synaptic Flow Stack")
  {
    id: 'semax_selank_cognitive_flow_protocol',
    name: 'Semax + Selank + Circadian Focus ("The Neuro-Plasticity & Synaptic Flow Stack") High-Focus & Brain Resilience Protocol',
    author_name: 'Translational Neurobiology & Cognitive Performance Medicine',
    source_label: 'Neuro-Plasticity & Synaptic Flow Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Hippocampal/Prefrontal BDNF Upregulation, Dopaminergic Flow State & Anxiolytic Stress Resilience',
    secondary_goals: [
      'Prefrontal BDNF & TrkB Receptor Phosphorylation via Semax ACTH 4-10',
      'Allosteric GABA-A Modulation & Amygdala Quieting via Selank Tuftsin Analog',
      'Circadian SCN Photic Entrainment & Dopamine Priming via Morning Sunlight',
      'Autonomic Sympathetic Downregulation & Cognitive Refresh via Optic Flow'
    ],
    target_population: 'High-performing professionals, founders, researchers, and students needing intense mental focus, verbal clarity, and rapid learning without jittery stimulant crashes or performance anxiety.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Neurochemistry & Behavioral Neuroscience Trials)',
    safety_level: 'High',
    description: 'A clean cognitive engine for peak mental performance. Semax elevates brain growth factors (BDNF) for rapid learning and focus, Selank melts away performance anxiety, and morning sunlight plus outdoor walking resets your circadian rhythm so you can work in effortless flow.',
    rationale: 'Neurotrophic priming and autonomic nervous system regulation. Semax crosses the blood-brain barrier to stimulate Brain-Derived Neurotrophic Factor (BDNF) and TrkB receptor phosphorylation in the prefrontal cortex and hippocampus, promoting synaptic plasticity and sustaining dopaminergic transmission. Selank provides complementary anxiolysis by acting as an allosteric modulator of GABA-A receptors, calming amygdala hyperreactivity without sedation. Anchoring this neurochemistry with morning outdoor sunlight viewing (stimulating retinal ganglion cells and cortisol awakening response) and midday optic flow (lateral eye movements suppressing sympathetic arousal) creates sustained, jitter-free cognitive flow and emotional resilience.',
    steps: [
      {
        id: 'flow_step_semax',
        protocol_id: 'semax_selank_cognitive_flow_protocol',
        modality_id: 'semax_subq',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily in morning (5 days/week on workdays)',
        required: true,
        dose_amount: 500,
        dose_unit: 'mcg',
        dose_text: '500 mcg SubQ or Intranasal upon waking (10 units from 10mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 10mg vial with 2.0 mL bacteriostatic water (5,000 mcg/mL; 10 units = 500 mcg). Inject SubQ into abdominal fat upon waking before your morning deep work block.',
        notes: 'Prefrontal BDNF upregulation, TrkB activation, and dopaminergic focus.',
        target_outcomes: ['Focus', 'Mental Clarity', 'Productivity', 'Energy'],
        modality: semax_subq_modality
      },
      {
        id: 'flow_step_selank',
        protocol_id: 'semax_selank_cognitive_flow_protocol',
        modality_id: 'selank_subq',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'midday',
        timing_anchor: 'midday',
        frequency: 'Daily in midday (5 days/week on workdays)',
        required: true,
        dose_amount: 250,
        dose_unit: 'mcg',
        dose_text: '250–500 mcg SubQ or Intranasal midday (5–10 units from 10mg/2mL vial)',
        duration: '5 mins',
        instructions: 'Reconstitute 10mg vial with 2.0 mL bacteriostatic water (5,000 mcg/mL; 5–10 units = 250–500 mcg). Administer SubQ or intranasally around lunch to sustain calm, focused productivity.',
        notes: 'Allosteric GABA-A receptor modulation and anxiolytic mental stabilization.',
        target_outcomes: ['Stress', 'Mood', 'Mental Clarity', 'Focus'],
        modality: selank_subq_modality
      },
      {
        id: 'flow_step_sunlight',
        protocol_id: 'semax_selank_cognitive_flow_protocol',
        modality_id: 'morning_sunlight',
        ordering_index: 3,
        display_order: 3,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (Morning)',
        required: true,
        dose_amount: 15,
        dose_unit: 'mins',
        dose_text: '10–15 mins outdoor natural sunlight viewing within 30m of waking',
        duration: '15 mins',
        instructions: 'Step outside within 30–60 minutes of waking. View natural sky and sunlight for 10–15 minutes without sunglasses to set dopamine baseline and circadian SCN clock.',
        notes: 'Retinal ganglion melanopsin activation driving natural cortisol awakening response.',
        target_outcomes: ['Energy', 'Mood', 'Focus'],
        modality: morning_sunlight_modality
      },
      {
        id: 'flow_step_opticflow',
        protocol_id: 'semax_selank_cognitive_flow_protocol',
        modality_id: 'optic_flow',
        ordering_index: 4,
        display_order: 4,
        timing_slot: 'midday',
        timing_anchor: 'midday',
        frequency: 'Daily (Midday Walk)',
        required: true,
        dose_amount: 15,
        dose_unit: 'mins',
        dose_text: '15–20 mins forward walking outside with natural visual scenery passing by',
        duration: '20 mins',
        instructions: 'Take a brisk 15–20 minute walk outside post-lunch. Allow visual objects to pass across your peripheral field of view to reset focus between work blocks.',
        notes: 'Forward ambulation eye movements quiet amygdala autonomic arousal.',
        target_outcomes: ['Stress', 'Mental Clarity', 'Focus'],
        modality: optic_flow_modality
      }
    ]
  },

  // 36. Traditional Finnish Dry Sauna Hyperthermic Protocol
  {
    id: 'traditional_dry_sauna_protocol',
    name: 'Traditional Finnish Dry Sauna Hyperthermic Protocol (174°F–200°F)',
    author_name: 'Finnish Hyperthermic Physiology (KIHD Study)',
    source_label: 'Finnish Longevity Standard',
    protocol_type: 'expert_created',
    primary_goal: 'Heat Shock Protein (HSP70) Chaperoning, eNOS Vasodilation & Cardiovascular Mortality Risk Attenuation',
    secondary_goals: [
      '50–63% Reduction in Sudden Cardiac Death & Fatal Cardiovascular Disease',
      'Endothelial Shear Stress Nitric Oxide Synthesis & Arterial Compliance',
      'Post-Exercise Lactate Clearance & Deep Sleep Melatonin Cascade'
    ],
    target_population: 'Individuals targeting cardiovascular resilience, vascular elasticity, heat shock proteostasis, and deep recovery.',
    difficulty_level: 'Beginner',
    evidence_level: 'High (20-Year Prospective RCTs & KIHD Cohorts)',
    safety_level: 'High',
    description: 'High-heat Finnish dry sauna protocol based on the 20-year Kuopio Ischemic Heart Disease (KIHD) cohort. Delivers convective hyperthermia at 174°F–200°F (80°C–93°C) for 15–20 minutes to stimulate cardiac output, upregulate HSP70 molecular chaperones, and halve cardiovascular mortality risk.',
    rationale: 'Convective dry heat elevates core temperature to ~39°C, surging heart rate to 110–140 bpm (exercise mimetic) and inducing intense endothelial shear stress. This upregulates eNOS for sustained nitric oxide release and triggers protective Heat Shock Proteins (HSP70/HSP90) that refold damaged proteins.',
    steps: [
      {
        id: 'dry_sauna_step_main',
        protocol_id: 'traditional_dry_sauna_protocol',
        modality_id: 'sauna_exposure',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'evening',
        timing_anchor: 'evening',
        frequency: '4–7x / Week (KIHD Study)',
        required: true,
        dose_amount: 20,
        dose_unit: 'mins',
        dose_text: '15–20 mins @ 174°F–200°F (80°C–93°C) Finnish dry heat',
        duration: '20 mins',
        instructions: 'Pre-hydrate with 16 oz water + electrolytes. Enter dry Finnish sauna heated to 174°F–200°F (80°C–93°C). Sit comfortably for 15–20 minutes until deep sweating is established. Exit, cool down with ambient air or tepid water, and rehydrate with 20 oz electrolyte water.',
        notes: 'Convective dry heat induces HSP70 synthesis, reduces arterial stiffness, and drops blood pressure below baseline during post-exposure recovery.',
        target_outcomes: ['Cardiovascular Flow', 'Heat Shock Proteins', 'Soreness', 'Longevity'],
        modality: sauna_exposure_modality
      }
    ]
  },

  // 37. Far-Infrared Radiant Deep Tissue Sauna Protocol
  {
    id: 'infrared_sauna_protocol',
    name: 'Far-Infrared Radiant Deep Tissue Sauna Protocol (120°F–140°F)',
    author_name: 'Radiant Photothermal & Neuromuscular Physiology',
    source_label: 'Far-Infrared Recovery Protocol',
    protocol_type: 'expert_created',
    primary_goal: '3–4cm Deep Tissue Radiant Heating, Microvascular Musculoskeletal Perfusion & Gentle Cardiac Workload',
    secondary_goals: [
      'Accelerated Neuromuscular Recovery Post-Strength Training',
      'Endothelial Perfusion with Lower Ambient Thermal Burden',
      'Cutaneous Sweat Detoxification at Tolerable Temperatures'
    ],
    target_population: 'Individuals seeking musculoskeletal joint relief, neuromuscular recovery, or deep sweating without high convective heat strain.',
    difficulty_level: 'Beginner',
    evidence_level: 'Moderate to High (Mero et al. & Hussain & Cohen Reviews)',
    safety_level: 'High',
    description: 'Far-infrared radiant light therapy utilizing 6–12 µm wavelengths to penetrate 3–4cm deep into soft tissue and joints at comfortable air temperatures of 120°F–140°F (49°C–60°C). Promotes deep microvascular circulation, tendon recovery, and relaxation.',
    rationale: 'Radiant infrared waves directly excite water molecules and cellular structures within deep musculoskeletal tissue rather than merely heating ambient air. Mero et al. (2015) demonstrated that far-infrared sauna accelerates neuromuscular recovery after intense training sessions with significantly less cardiovascular exhaustion than Finnish dry saunas.',
    steps: [
      {
        id: 'infrared_sauna_step_main',
        protocol_id: 'infrared_sauna_protocol',
        modality_id: 'infrared_sauna',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'evening',
        timing_anchor: 'evening',
        frequency: '3–5x / Week',
        required: true,
        dose_amount: 35,
        dose_unit: 'mins',
        dose_text: '30–45 mins @ 120°F–140°F (49°C–60°C) far-infrared radiant light',
        duration: '40 mins',
        instructions: 'Preheat far-infrared sauna to 120°F–140°F (49°C–60°C). Sit inside for 30–45 minutes while radiant infrared panels directly penetrate deep musculoskeletal layers. Hydrate with electrolyte-rich water throughout.',
        notes: 'Direct radiant penetration accelerates deep tendon and neuromuscular recovery at gentle cardiac loads.',
        target_outcomes: ['Soreness', 'Joint Comfort', 'Microvascular Perfusion', 'Stress'],
        modality: infrared_sauna_modality
      }
    ]
  },

  // 38. Deliberate Cold Plunge Immersion Protocol
  {
    id: 'deliberate_cold_plunge_protocol',
    name: 'Deliberate Cold Plunge Immersion Protocol (50°F–55°F)',
    author_name: 'Metabolic Cold Physiology & Susanna Søberg Ph.D.',
    source_label: 'Søberg Principle Immersion',
    protocol_type: 'expert_created',
    primary_goal: '250% Sustained Dopamine Surge, Brown Fat (BAT) UCP-1 Thermogenesis & Hydrostatic Venous Return',
    secondary_goals: [
      'Enduring 2.5x Neurochemical Elevation of Dopamine and Norepinephrine',
      'Brown Adipose Tissue (BAT) Mitochondrial Uncoupling & Shivering Succinate Hormone Release',
      'Autonomous Rewarming (Søberg Principle) to Maximize Post-Plunge Caloric Expenditure'
    ],
    target_population: 'Athletes, biohackers, and individuals seeking mental resilience, sustained focus, brown fat metabolic priming, and acute inflammation control.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Cell Reports Medicine 2021 & Human Physiology Trials)',
    safety_level: 'Moderate',
    description: 'Full-body cold water immersion protocol targeting 11 total minutes weekly (2–3 minutes per session at 50°F–55°F / 10°C–13°C). Ends on cold to force the body to autonomously re-warm, activating brown adipose tissue and metabolic thermogenesis.',
    rationale: 'Submerging to clavicle level combines intense cold shock with hydrostatic compression. Cold shock triggers a sustained 250% dopamine surge and sympathetic norepinephrine release. Ending on cold and allowing natural re-warming (Søberg principle) prevents blunting of shivering succinate signaling and maximizes brown fat uncoupling.',
    steps: [
      {
        id: 'cold_plunge_step_main',
        protocol_id: 'deliberate_cold_plunge_protocol',
        modality_id: 'cold_water_immersion',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: '3–4x / Week (11 mins total weekly)',
        required: true,
        dose_amount: 3,
        dose_unit: 'mins',
        dose_text: '2–3 mins @ 50°F–55°F (10°C–13°C), ending on cold',
        duration: '5 mins',
        instructions: 'Submerge to clavicle level in 50°F–55°F (10°C–13°C) cold water. Control initial gasp reflex with slow, deep nasal breaths. Remain calm for 2–3 minutes. Exit and re-warm autonomously (horse stance or natural air dry) without hot showers to maximize brown fat thermogenesis.',
        notes: 'Hydrostatic pressure and extreme cold surge dopamine by 250% for hours; autonomous reheating drives mitochondrial uncoupling.',
        target_outcomes: ['Dopamine & Focus', 'Soreness', 'Metabolic Rate', 'Mood'],
        modality: cold_water_immersion_modality
      }
    ]
  },

  // 39. End-of-Shower Cutaneous Cold Shock Protocol
  {
    id: 'cutaneous_cold_shower_protocol',
    name: 'End-of-Shower Cutaneous Cold Shock Protocol (55°F–65°F)',
    author_name: 'Academic Medical Center Amsterdam (Buijze et al. RCT)',
    source_label: 'Buijze Daily Cold Shower RCT',
    protocol_type: 'expert_created',
    primary_goal: '29% Sickness Absence Reduction, Epidermal Cold Receptor Shock & Autonomic Sympathetic Alertness',
    secondary_goals: [
      'Instant Morning Alertness & Vagal Retuning',
      'Cutaneous Vasoconstriction & Immune System Priming',
      'Zero-Equipment Daily Habit Accessible in Any Household Shower'
    ],
    target_population: 'Individuals seeking the invigorating, immune-boosting benefits of cold exposure with zero specialized tubs, ice, or hardware.',
    difficulty_level: 'Beginner',
    evidence_level: 'High (3,018-Participant Randomized Controlled Trial, Buijze et al.)',
    safety_level: 'High',
    description: 'An evidence-based, zero-equipment cold exposure protocol. Take your usual warm morning shower, and turn the dial completely cold (55°F–65°F / 13°C–18°C) for the final 60–180 seconds to activate epidermal thermoreceptors and bolster immune resilience.',
    rationale: 'Buijze et al. (2016) demonstrated in a large 3,018-participant RCT that concluding morning showers with 30, 60, or 90 seconds of cold water reduced sickness absence by 29%. Cold spray on cutaneous receptors triggers immediate norepinephrine release, heightens perceived vitality, and stimulates autonomic tone.',
    steps: [
      {
        id: 'cold_shower_step_main',
        protocol_id: 'cutaneous_cold_shower_protocol',
        modality_id: 'cold_shower',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: 'Daily (5–7x / Week)',
        required: true,
        dose_amount: 2,
        dose_unit: 'mins',
        dose_text: '60–180 seconds @ 55°F–65°F (13°C–18°C) at end of shower',
        duration: '3 mins',
        instructions: 'Take your regular warm shower. For the final 1 to 3 minutes, turn the temperature dial fully to cold (55°F–65°F). Rotate under the stream so cold water hits your chest, upper back, and neck. Maintain steady breathing throughout.',
        notes: 'Epidermal cold shock triggers acute norepinephrine and vagal retuning, cutting sickness absence by 29%.',
        target_outcomes: ['Energy & Alertness', 'Immune Resilience', 'Mood', 'Stress'],
        modality: cold_shower_modality
      }
    ]
  }
]

export const BUILT_IN_PEPTIDE_MODALITIES: Modality[] = [
  bpc157_subq_modality,
  tb500_subq_modality,
  cjc1295_no_dac_subq_modality,
  ipamorelin_subq_modality,
  ghk_cu_subq_modality,
  semax_subq_modality,
  selank_subq_modality,
  kpv_subq_modality,
  tesamorelin_subq_modality,
  mots_c_subq_modality,
  retatrutide_subq_modality,
  ss31_subq_modality,
  epitalon_subq_modality,
  ta1_subq_modality,
  tirzepatide_subq_modality,
  aod9604_subq_modality,
  pt141_subq_modality,
  oxytocin_subq_modality,
  sermorelin_subq_modality,
  igf1_lr3_subq_modality,
  kisspeptin10_subq_modality,
  ghk_cu_topical_modality,
  red_light_therapy_modality,
  collagen_peptides_modality,
  sauna_exposure_modality,
  infrared_sauna_modality,
  cold_water_immersion_modality,
  cold_shower_modality,
  zone_2_cardio_modality,
  intermittent_fasting_16_8_modality,
  blue_light_blocking_modality,
  mouth_taping_modality,
  morning_sunlight_modality,
  optic_flow_modality
]
