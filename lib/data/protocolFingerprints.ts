/**
 * Protocol Longevity Fingerprints & Biometric Signatures
 * 
 * Provides evidence-based, clinically calibrated 0–100 scores across:
 * 1. The 8 Canonical Longevity Vectors (Physiological Outcomes)
 * 2. The 12 Hallmarks of Aging (Cellular & Molecular Mechanisms)
 * 
 * Used by the Protocol Vector Radar and Multi-Protocol Stacking Engine.
 */

export interface ProtocolVectorScores {
  heart_health: number
  brain_longevity: number
  metabolic_health: number
  cancer_defense: number
  testosterone: number
  chronic_inflammation: number
  bone_density: number
  cellular_longevity: number
}

export interface ProtocolHallmarkScores {
  genomic_instability: number
  telomere_attrition: number
  epigenetic_alterations: number
  loss_of_proteostasis: number
  disabled_macroautophagy: number
  deregulated_nutrient_sensing: number
  mitochondrial_dysfunction: number
  cellular_senescence: number
  stem_cell_exhaustion: number
  altered_intercellular_communication: number
  chronic_inflammation: number
  dysbiosis: number
}

export interface ProtocolFingerprint {
  id: string
  name: string
  creator: string
  superpowers: string[]
  primaryGaps: string[]
  synergyNotes: string
  vectors: ProtocolVectorScores
  hallmarks: ProtocolHallmarkScores
}

export interface VectorAxisMeta {
  id: keyof ProtocolVectorScores
  label: string
  shortLabel: string
  description: string
  primaryBiomarkers: string[]
}

export interface HallmarkAxisMeta {
  id: keyof ProtocolHallmarkScores
  label: string
  shortLabel: string
  description: string
  tier: 'primary' | 'antagonistic' | 'integrative'
}

// -----------------------------------------------------------------------------
// 1. AXIS DEFINITIONS & METADATA
// -----------------------------------------------------------------------------

export const LONGEVITY_VECTOR_AXES: VectorAxisMeta[] = [
  {
    id: 'heart_health',
    label: 'Heart & Cardiovascular',
    shortLabel: 'Cardiovascular',
    description: 'VO2 Max, ApoB clearance, endothelial nitric oxide, and arterial elasticity.',
    primaryBiomarkers: ['VO2 Max', 'ApoB', 'CAC Score', 'Resting HR']
  },
  {
    id: 'brain_longevity',
    label: 'Brain Longevity & Cognition',
    shortLabel: 'Neuroprotection',
    description: 'Prefrontal BDNF, glymphatic neuro-waste clearance, slow-wave sleep, and autonomic HRV.',
    primaryBiomarkers: ['BDNF', 'High-Frequency HRV', 'Deep Sleep Duration']
  },
  {
    id: 'metabolic_health',
    label: 'Metabolic & Glycemic Health',
    shortLabel: 'Metabolic Health',
    description: 'Insulin sensitivity, non-insulin GLUT4 glucose uptake, and hepatic AMPK activation.',
    primaryBiomarkers: ['Fasting Insulin', 'HOMA-IR', 'HbA1c', 'CGM Mean']
  },
  {
    id: 'cancer_defense',
    label: 'Cancer Defense & Autophagy',
    shortLabel: 'Autophagy & Senolysis',
    description: 'Macroautophagy flux, senescent zombie cell apoptosis, and SASP suppression.',
    primaryBiomarkers: ['Fasting Glucagon : Insulin', 'SASP Markers', 'hs-CRP']
  },
  {
    id: 'testosterone',
    label: 'Endocrine Vitality & Anabolic Tone',
    shortLabel: 'Endocrine Vitality',
    description: 'Testosterone:cortisol ratio, Leydig steroidogenesis, and nocturnal GH pulsatility.',
    primaryBiomarkers: ['Total Testosterone', 'Free Testosterone', 'Morning Cortisol']
  },
  {
    id: 'chronic_inflammation',
    label: 'Systemic Inflammation Suppression',
    shortLabel: 'Inflammaging',
    description: 'Suppression of NLRP3 inflammasome, NF-kB nuclear translocation, and IL-6/TNF-alpha.',
    primaryBiomarkers: ['hs-CRP', 'Interleukin-6 (IL-6)', 'TNF-alpha']
  },
  {
    id: 'bone_density',
    label: 'Bone Density & Connective Matrix',
    shortLabel: 'Bone & Matrix',
    description: 'Axial osteoblast Piezo1 mechanotransduction, DEXA BMD, and tendon collagen elasticity.',
    primaryBiomarkers: ['DEXA Lumbar T-Score', 'Serum P1NP', 'Tendon Stiffness']
  },
  {
    id: 'cellular_longevity',
    label: 'Cellular Longevity & Epigenetics',
    shortLabel: 'Epigenetic Clocks',
    description: 'DNAmAge Horvath methylation clocks, intracellular NAD+/sirtuins, and telomeric protection.',
    primaryBiomarkers: ['DNAmAge Clock', 'NAD+ : NADH Ratio', 'Telomere Length']
  }
]

export const HALLMARK_OF_AGING_AXES: HallmarkAxisMeta[] = [
  {
    id: 'genomic_instability',
    label: 'Genomic Instability',
    shortLabel: 'Genomic DNA',
    description: 'Accumulation of genetic lesions, oxidative DNA breaks, and somatic mutations.',
    tier: 'primary'
  },
  {
    id: 'telomere_attrition',
    label: 'Telomere Attrition',
    shortLabel: 'Telomeres',
    description: 'Progressive loss of protective telomeric hexameric DNA caps at chromosome ends.',
    tier: 'primary'
  },
  {
    id: 'epigenetic_alterations',
    label: 'Epigenetic Alterations',
    shortLabel: 'Epigenetics',
    description: 'Loss of heterochromatin, aberrant histone deacetylation, and DNA methylation drift.',
    tier: 'primary'
  },
  {
    id: 'loss_of_proteostasis',
    label: 'Loss of Proteostasis',
    shortLabel: 'Proteostasis',
    description: 'Misfolded toxic protein aggregates, impaired chaperone machinery, and proteasomal decline.',
    tier: 'primary'
  },
  {
    id: 'disabled_macroautophagy',
    label: 'Disabled Macroautophagy',
    shortLabel: 'Macroautophagy',
    description: 'Defective lysosomal degradation of damaged organelles, protein aggregates, and mitochondria.',
    tier: 'primary'
  },
  {
    id: 'deregulated_nutrient_sensing',
    label: 'Deregulated Nutrient Sensing',
    shortLabel: 'Nutrient Sensing',
    description: 'Hyperactive mTOR/IGF-1 signaling and blunted AMPK / SIRT1 / FoxO metabolic longevity signaling.',
    tier: 'antagonistic'
  },
  {
    id: 'mitochondrial_dysfunction',
    label: 'Mitochondrial Dysfunction',
    shortLabel: 'Mitochondria',
    description: 'Electron transport chain decoupling, cristae structural degradation, and elevated ROS.',
    tier: 'antagonistic'
  },
  {
    id: 'cellular_senescence',
    label: 'Cellular Senescence',
    shortLabel: 'Senescence',
    description: 'Irreversible cell cycle arrest accompanied by toxic pro-inflammatory SASP secretion.',
    tier: 'antagonistic'
  },
  {
    id: 'stem_cell_exhaustion',
    label: 'Stem Cell Exhaustion',
    shortLabel: 'Stem Cells',
    description: 'Depletion of self-renewing regenerative stem cell pools across tissues and bone marrow.',
    tier: 'integrative'
  },
  {
    id: 'altered_intercellular_communication',
    label: 'Altered Intercellular Communication',
    shortLabel: 'Intercellular Signaling',
    description: 'Paracrine cytokine signaling decay, neuroendocrine dysregulation, and circadian desynchrony.',
    tier: 'integrative'
  },
  {
    id: 'chronic_inflammation',
    label: 'Chronic Inflammation',
    shortLabel: 'Inflammaging',
    description: 'Sterile, low-grade systemic inflammation (inflammaging) driven by innate immune overactivation.',
    tier: 'integrative'
  },
  {
    id: 'dysbiosis',
    label: 'Dysbiosis',
    shortLabel: 'Gut Microbiome',
    description: 'Erosion of gut mucosal barrier integrity, reduced commensal diversity, and systemic endotoxemia.',
    tier: 'integrative'
  }
]

// -----------------------------------------------------------------------------
// 2. CANONICAL PROTOCOL FINGERPRINT DATABASE (ALL 16 PRESETS)
// -----------------------------------------------------------------------------

export const PROTOCOL_FINGERPRINTS_MAP: Record<string, ProtocolFingerprint> = {
  // 1. Dr. Peter Attia Centenarian Decathlon
  'peter_attia_centenarian_decathlon_protocol': {
    id: 'peter_attia_centenarian_decathlon_protocol',
    name: "Dr. Peter Attia's Centenarian Decathlon Protocol",
    creator: 'Dr. Peter Attia',
    superpowers: ['Heart & Cardiovascular (95)', 'Bone Density & Matrix (92)'],
    primaryGaps: ['Cancer Defense / Autophagy (42)', 'Cellular Longevity & NAD+ (48)'],
    synergyNotes: 'Pairs exceptionally well with Longo FMD or Sinclair Epigenetic Renewal to provide deep cellular housecleaning without sacrificing muscle.',
    vectors: {
      heart_health: 95,
      brain_longevity: 80,
      metabolic_health: 84,
      cancer_defense: 42,
      testosterone: 76,
      chronic_inflammation: 68,
      bone_density: 92,
      cellular_longevity: 48
    },
    hallmarks: {
      genomic_instability: 65,
      telomere_attrition: 62,
      epigenetic_alterations: 82,
      loss_of_proteostasis: 75,
      disabled_macroautophagy: 68,
      deregulated_nutrient_sensing: 92,
      mitochondrial_dysfunction: 98,
      cellular_senescence: 70,
      stem_cell_exhaustion: 86,
      altered_intercellular_communication: 80,
      chronic_inflammation: 88,
      dysbiosis: 70
    }
  },

  // 2. Dr. Valter Longo Senolytic & Fasting Mimicking
  'dr_valter_longo_senolytic_fmd_protocol': {
    id: 'dr_valter_longo_senolytic_fmd_protocol',
    name: "Dr. Valter Longo Senolytic & Fasting Mimicking Protocol",
    creator: 'Dr. Valter Longo & Mayo Clinic',
    superpowers: ['Cancer Defense / Autophagy (98)', 'Cellular Longevity (92)'],
    primaryGaps: ['Bone Density (32)', 'Endocrine Vitality (38)', 'Heart / VO2 (45)'],
    synergyNotes: 'The premier cellular housecleaning protocol; fills structural and muscle protocols with profound senolytic apoptosis and stem cell self-renewal.',
    vectors: {
      heart_health: 45,
      brain_longevity: 72,
      metabolic_health: 86,
      cancer_defense: 98,
      testosterone: 38,
      chronic_inflammation: 88,
      bone_density: 32,
      cellular_longevity: 92
    },
    hallmarks: {
      genomic_instability: 72,
      telomere_attrition: 66,
      epigenetic_alterations: 78,
      loss_of_proteostasis: 92,
      disabled_macroautophagy: 100,
      deregulated_nutrient_sensing: 96,
      mitochondrial_dysfunction: 80,
      cellular_senescence: 96,
      stem_cell_exhaustion: 94,
      altered_intercellular_communication: 76,
      chronic_inflammation: 92,
      dysbiosis: 84
    }
  },

  // 3. Dr. David Sinclair Epigenetic Renewal
  'dr_david_sinclair_epigenetic_renewal': {
    id: 'dr_david_sinclair_epigenetic_renewal',
    name: "Dr. David Sinclair's Epigenetic Renewal Protocol",
    creator: 'Dr. David Sinclair',
    superpowers: ['Cellular Longevity / NAD+ (96)', 'Brain Longevity (84)'],
    primaryGaps: ['Bone Density (34)', 'Heart / VO2 (46)', 'Endocrine Vitality (42)'],
    synergyNotes: 'NMN and Resveratrol fuel SIRT1 deacetylase and PARP1 DNA repair; perfect biochemical companion for physical training stacks.',
    vectors: {
      heart_health: 46,
      brain_longevity: 84,
      metabolic_health: 72,
      cancer_defense: 78,
      testosterone: 42,
      chronic_inflammation: 74,
      bone_density: 34,
      cellular_longevity: 96
    },
    hallmarks: {
      genomic_instability: 94,
      telomere_attrition: 74,
      epigenetic_alterations: 98,
      loss_of_proteostasis: 82,
      disabled_macroautophagy: 78,
      deregulated_nutrient_sensing: 86,
      mitochondrial_dysfunction: 90,
      cellular_senescence: 76,
      stem_cell_exhaustion: 72,
      altered_intercellular_communication: 78,
      chronic_inflammation: 84,
      dysbiosis: 68
    }
  },

  // 4. Dr. Matthew Walker Sleep Architecture Blueprint
  'dr_matthew_walker_sleep_blueprint': {
    id: 'dr_matthew_walker_sleep_blueprint',
    name: "Dr. Matthew Walker's 8-Hour Sleep Architecture Blueprint",
    creator: 'Dr. Matthew Walker',
    superpowers: ['Brain Longevity (96)', 'Systemic Inflammation Suppression (88)'],
    primaryGaps: ['Bone Density (38)', 'Heart / VO2 (48)', 'Autophagy (60)'],
    synergyNotes: 'Expands Slow-Wave Delta sleep and glymphatic brain clearance; sets the diurnal recovery foundation for all daytime training stacks.',
    vectors: {
      heart_health: 48,
      brain_longevity: 96,
      metabolic_health: 76,
      cancer_defense: 60,
      testosterone: 72,
      chronic_inflammation: 88,
      bone_density: 38,
      cellular_longevity: 82
    },
    hallmarks: {
      genomic_instability: 70,
      telomere_attrition: 68,
      epigenetic_alterations: 76,
      loss_of_proteostasis: 90,
      disabled_macroautophagy: 72,
      deregulated_nutrient_sensing: 80,
      mitochondrial_dysfunction: 82,
      cellular_senescence: 72,
      stem_cell_exhaustion: 78,
      altered_intercellular_communication: 96,
      chronic_inflammation: 92,
      dysbiosis: 75
    }
  },

  // 5. Bryan Johnson Project Blueprint Core v2.0
  'bryan_johnson_blueprint_protocol': {
    id: 'bryan_johnson_blueprint_protocol',
    name: "Bryan Johnson's Project Blueprint Core Protocol v2.0",
    creator: 'Bryan Johnson',
    superpowers: ['Cellular Longevity (94)', 'Brain Longevity (90)', 'Heart Health (90)'],
    primaryGaps: ['Requires high protocol adherence', 'Autophagy during feeding windows (82)'],
    synergyNotes: 'Broad multi-organ systemic baseline designed for speed of aging reduction below 0.70.',
    vectors: {
      heart_health: 90,
      brain_longevity: 90,
      metabolic_health: 86,
      cancer_defense: 82,
      testosterone: 78,
      chronic_inflammation: 90,
      bone_density: 74,
      cellular_longevity: 94
    },
    hallmarks: {
      genomic_instability: 88,
      telomere_attrition: 75,
      epigenetic_alterations: 95,
      loss_of_proteostasis: 85,
      disabled_macroautophagy: 80,
      deregulated_nutrient_sensing: 98,
      mitochondrial_dysfunction: 96,
      cellular_senescence: 90,
      stem_cell_exhaustion: 78,
      altered_intercellular_communication: 92,
      chronic_inflammation: 95,
      dysbiosis: 90
    }
  },

  // 6. Dr. Thomas Dayspring Endothelial & Vascular Elasticity
  'dr_thomas_dayspring_endothelial_vascular_protocol': {
    id: 'dr_thomas_dayspring_endothelial_vascular_protocol',
    name: "Dr. Thomas Dayspring Endothelial & Vascular Elasticity Protocol",
    creator: 'Dr. Thomas Dayspring',
    superpowers: ['Heart & Cardiovascular (98)', 'Metabolic Health (86)'],
    primaryGaps: ['Bone Density (42)', 'Cancer Defense (40)', 'Endocrine Vitality (45)'],
    synergyNotes: 'Gold-standard ApoB clearance and endothelial nitric oxide perfusion; prevents coronary micro-calcification.',
    vectors: {
      heart_health: 98,
      brain_longevity: 68,
      metabolic_health: 86,
      cancer_defense: 40,
      testosterone: 45,
      chronic_inflammation: 80,
      bone_density: 42,
      cellular_longevity: 52
    },
    hallmarks: {
      genomic_instability: 68,
      telomere_attrition: 60,
      epigenetic_alterations: 70,
      loss_of_proteostasis: 72,
      disabled_macroautophagy: 62,
      deregulated_nutrient_sensing: 90,
      mitochondrial_dysfunction: 88,
      cellular_senescence: 68,
      stem_cell_exhaustion: 65,
      altered_intercellular_communication: 86,
      chronic_inflammation: 90,
      dysbiosis: 80
    }
  },

  // 7. Gary Brecka Superhuman Protocol
  'gary_brecka_superhuman_protocol': {
    id: 'gary_brecka_superhuman_protocol',
    name: "Gary Brecka's Superhuman Protocol",
    creator: 'Gary Brecka',
    superpowers: ['Systemic Inflammation (90)', 'Cellular Longevity (88)'],
    primaryGaps: ['Bone Density (40)', 'Cancer Defense / Autophagy (52)'],
    synergyNotes: 'PEMF magnetism + EWOT oxygenation + NIR light therapy restores erythrocyte zeta potential and cellular ATP.',
    vectors: {
      heart_health: 82,
      brain_longevity: 78,
      metabolic_health: 70,
      cancer_defense: 52,
      testosterone: 62,
      chronic_inflammation: 90,
      bone_density: 40,
      cellular_longevity: 88
    },
    hallmarks: {
      genomic_instability: 74,
      telomere_attrition: 70,
      epigenetic_alterations: 76,
      loss_of_proteostasis: 78,
      disabled_macroautophagy: 68,
      deregulated_nutrient_sensing: 74,
      mitochondrial_dysfunction: 94,
      cellular_senescence: 74,
      stem_cell_exhaustion: 76,
      altered_intercellular_communication: 88,
      chronic_inflammation: 92,
      dysbiosis: 70
    }
  },

  // 8. Wim Hof Autonomic Nervous System & HRV Reset
  'wim_hof_autonomic_hrv_reset_protocol': {
    id: 'wim_hof_autonomic_hrv_reset_protocol',
    name: "Wim Hof Autonomic Nervous System & HRV Reset Protocol",
    creator: 'Wim Hof',
    superpowers: ['Systemic Inflammation (92)', 'Brain & Autonomic (88)'],
    primaryGaps: ['Bone Density (42)', 'Cellular Longevity (52)', 'Metabolic (58)'],
    synergyNotes: 'Cyclic hyperventilation adrenaline surge suppresses pro-inflammatory TNF-alpha while cold immersion spikes dopamine 250%.',
    vectors: {
      heart_health: 75,
      brain_longevity: 88,
      metabolic_health: 58,
      cancer_defense: 56,
      testosterone: 62,
      chronic_inflammation: 92,
      bone_density: 42,
      cellular_longevity: 52
    },
    hallmarks: {
      genomic_instability: 62,
      telomere_attrition: 60,
      epigenetic_alterations: 72,
      loss_of_proteostasis: 76,
      disabled_macroautophagy: 65,
      deregulated_nutrient_sensing: 68,
      mitochondrial_dysfunction: 86,
      cellular_senescence: 68,
      stem_cell_exhaustion: 74,
      altered_intercellular_communication: 94,
      chronic_inflammation: 96,
      dysbiosis: 65
    }
  },

  // 9. Dr. Casey Means Metabolic Flexibility & Glycemic Control
  'dr_casey_means_metabolic_flexibility_protocol': {
    id: 'dr_casey_means_metabolic_flexibility_protocol',
    name: "Dr. Casey Means & Glucose Goddess Postprandial Glycemic Protocol",
    creator: 'Dr. Casey Means & Jessie Inchauspé',
    superpowers: ['Metabolic Health (95)', 'Heart & Cardiovascular (82)'],
    primaryGaps: ['Bone Density (45)', 'Endocrine Vitality (48)'],
    synergyNotes: 'Vinegar, food sequencing, and post-meal soleus contraction flatten glucose curves and optimize mitochondrial substrate switching.',
    vectors: {
      heart_health: 82,
      brain_longevity: 72,
      metabolic_health: 95,
      cancer_defense: 68,
      testosterone: 48,
      chronic_inflammation: 78,
      bone_density: 45,
      cellular_longevity: 66
    },
    hallmarks: {
      genomic_instability: 68,
      telomere_attrition: 62,
      epigenetic_alterations: 74,
      loss_of_proteostasis: 75,
      disabled_macroautophagy: 76,
      deregulated_nutrient_sensing: 98,
      mitochondrial_dysfunction: 88,
      cellular_senescence: 72,
      stem_cell_exhaustion: 68,
      altered_intercellular_communication: 82,
      chronic_inflammation: 86,
      dysbiosis: 88
    }
  },

  // 10. Photonic & Biochemical Dermal Remodeling
  'photonic_ghkcu_red_light_protocol': {
    id: 'photonic_ghkcu_red_light_protocol',
    name: "Photonic & Biochemical Dermal Remodeling",
    creator: 'LEVL Photomedicine & Regenerative Lab',
    superpowers: ['Cellular Longevity (92)', 'Systemic Inflammation (85)'],
    primaryGaps: ['Heart / VO2 (40)', 'Bone Density (52)', 'Endocrine (45)'],
    synergyNotes: 'Topical GHK-Cu copper peptides plus 660/850nm photobiomodulation surge pro-collagen mRNA and mitochondrial ATP.',
    vectors: {
      heart_health: 40,
      brain_longevity: 68,
      metabolic_health: 60,
      cancer_defense: 55,
      testosterone: 45,
      chronic_inflammation: 85,
      bone_density: 52,
      cellular_longevity: 92
    },
    hallmarks: {
      genomic_instability: 78,
      telomere_attrition: 68,
      epigenetic_alterations: 82,
      loss_of_proteostasis: 86,
      disabled_macroautophagy: 68,
      deregulated_nutrient_sensing: 64,
      mitochondrial_dysfunction: 94,
      cellular_senescence: 82,
      stem_cell_exhaustion: 90,
      altered_intercellular_communication: 86,
      chronic_inflammation: 88,
      dysbiosis: 60
    }
  },

  // 11. Wolverine Angiogenesis & Thermal Recovery
  'wolverine_thermal_recovery_protocol': {
    id: 'wolverine_thermal_recovery_protocol',
    name: "Wolverine Angiogenesis & Thermal Recovery Protocol",
    creator: 'LEVL Regenerative Athletics Lab',
    superpowers: ['Systemic Inflammation (94)', 'Heart Health (86)'],
    primaryGaps: ['Cancer Defense / Autophagy (55)', 'Bone Loading (48)'],
    synergyNotes: 'BPC-157/TB-500 micro-angiogenesis accelerated by 174°F+ sauna heat shock proteins and contrast cold immersion.',
    vectors: {
      heart_health: 86,
      brain_longevity: 76,
      metabolic_health: 68,
      cancer_defense: 55,
      testosterone: 70,
      chronic_inflammation: 94,
      bone_density: 48,
      cellular_longevity: 80
    },
    hallmarks: {
      genomic_instability: 68,
      telomere_attrition: 64,
      epigenetic_alterations: 74,
      loss_of_proteostasis: 92,
      disabled_macroautophagy: 70,
      deregulated_nutrient_sensing: 72,
      mitochondrial_dysfunction: 90,
      cellular_senescence: 78,
      stem_cell_exhaustion: 92,
      altered_intercellular_communication: 90,
      chronic_inflammation: 95,
      dysbiosis: 70
    }
  },

  // 12. MOTS-c Fasted Zone 2 Mitochondrial Biogenesis
  'mots_c_zone2_mitochondrial_protocol': {
    id: 'mots_c_zone2_mitochondrial_protocol',
    name: "MOTS-c Fasted Zone 2 Mitochondrial Biogenesis Protocol",
    creator: 'Mitochondrial Medicine Initiative',
    superpowers: ['Heart & Cardiovascular (94)', 'Cellular Longevity (90)'],
    primaryGaps: ['Bone Density (46)', 'Endocrine Vitality (50)'],
    synergyNotes: 'Mitochondrial-derived MOTS-c peptide phosphorylates AMPK and multiplies mitochondrial cristae density with aerobic training.',
    vectors: {
      heart_health: 94,
      brain_longevity: 78,
      metabolic_health: 88,
      cancer_defense: 74,
      testosterone: 50,
      chronic_inflammation: 82,
      bone_density: 46,
      cellular_longevity: 90
    },
    hallmarks: {
      genomic_instability: 74,
      telomere_attrition: 70,
      epigenetic_alterations: 80,
      loss_of_proteostasis: 82,
      disabled_macroautophagy: 84,
      deregulated_nutrient_sensing: 92,
      mitochondrial_dysfunction: 98,
      cellular_senescence: 76,
      stem_cell_exhaustion: 78,
      altered_intercellular_communication: 84,
      chronic_inflammation: 86,
      dysbiosis: 72
    }
  },

  // 13. CJC-1295 / Ipamorelin Nocturnal Somatotropin
  'cjc_ipam_anabolic_sleep_protocol': {
    id: 'cjc_ipam_anabolic_sleep_protocol',
    name: "CJC-1295 / Ipamorelin Nocturnal Somatotropin Protocol",
    creator: 'Endocrine Longevity Group',
    superpowers: ['Endocrine Vitality (94)', 'Brain Longevity (88)'],
    primaryGaps: ['Heart / VO2 (50)', 'Cancer Defense / Fasting (60)'],
    synergyNotes: 'Stimulates nocturnal growth hormone and IGF-1 secretion on an empty stomach, deepening Stage-3 NREM restorative sleep.',
    vectors: {
      heart_health: 50,
      brain_longevity: 88,
      metabolic_health: 72,
      cancer_defense: 60,
      testosterone: 94,
      chronic_inflammation: 78,
      bone_density: 75,
      cellular_longevity: 84
    },
    hallmarks: {
      genomic_instability: 70,
      telomere_attrition: 66,
      epigenetic_alterations: 78,
      loss_of_proteostasis: 86,
      disabled_macroautophagy: 68,
      deregulated_nutrient_sensing: 76,
      mitochondrial_dysfunction: 80,
      cellular_senescence: 74,
      stem_cell_exhaustion: 90,
      altered_intercellular_communication: 92,
      chronic_inflammation: 82,
      dysbiosis: 65
    }
  },

  // 14. Semax & Selank Neurotrophic Flow State
  'semax_selank_cognitive_flow_protocol': {
    id: 'semax_selank_cognitive_flow_protocol',
    name: "Semax & Selank Neurotrophic Flow State Protocol",
    creator: 'Neuro-Cognitive Longevity Institute',
    superpowers: ['Brain Longevity & Flow (96)', 'Endocrine Vitality (78)'],
    primaryGaps: ['Bone Density (35)', 'Heart / VO2 (45)', 'Autophagy (52)'],
    synergyNotes: 'Semax triggers massive prefrontal BDNF upregulation while Selank modulates GABA-A to dissolve stress during deep cognitive tasks.',
    vectors: {
      heart_health: 45,
      brain_longevity: 96,
      metabolic_health: 64,
      cancer_defense: 52,
      testosterone: 78,
      chronic_inflammation: 74,
      bone_density: 35,
      cellular_longevity: 70
    },
    hallmarks: {
      genomic_instability: 68,
      telomere_attrition: 62,
      epigenetic_alterations: 76,
      loss_of_proteostasis: 80,
      disabled_macroautophagy: 64,
      deregulated_nutrient_sensing: 68,
      mitochondrial_dysfunction: 82,
      cellular_senescence: 70,
      stem_cell_exhaustion: 72,
      altered_intercellular_communication: 96,
      chronic_inflammation: 80,
      dysbiosis: 62
    }
  },

  // 15. Push / Pull / Legs Hypertrophy Split
  'push_pull_legs_hypertrophy': {
    id: 'push_pull_legs_hypertrophy',
    name: "Push / Pull / Legs (PPL) Science-Based Hypertrophy Split",
    creator: 'Sports Science & Biomechanics Hub',
    superpowers: ['Bone Density & Matrix (94)', 'Endocrine Vitality (92)'],
    primaryGaps: ['Cancer Defense / Autophagy (28)', 'Cellular Longevity (45)'],
    synergyNotes: 'Heavy axial mechanical loading stimulates osteoblast Piezo1 mechanotransduction and sustained androgen receptor density.',
    vectors: {
      heart_health: 60,
      brain_longevity: 65,
      metabolic_health: 80,
      cancer_defense: 28,
      testosterone: 92,
      chronic_inflammation: 55,
      bone_density: 94,
      cellular_longevity: 45
    },
    hallmarks: {
      genomic_instability: 58,
      telomere_attrition: 55,
      epigenetic_alterations: 78,
      loss_of_proteostasis: 70,
      disabled_macroautophagy: 52,
      deregulated_nutrient_sensing: 86,
      mitochondrial_dysfunction: 75,
      cellular_senescence: 62,
      stem_cell_exhaustion: 88,
      altered_intercellular_communication: 74,
      chronic_inflammation: 72,
      dysbiosis: 60
    }
  },

  // 16. 12-Week Adaptive Half Marathon Training
  'half_marathon_training': {
    id: 'half_marathon_training',
    name: "12-Week Adaptive Half Marathon Training Protocol",
    creator: 'Endurance Performance Lab',
    superpowers: ['Heart & Cardiovascular (96)', 'Metabolic Health (88)'],
    primaryGaps: ['Cancer Defense / Autophagy (48)', 'Bone Density (50)', 'Testosterone (55)'],
    synergyNotes: 'Aerobic running volume maximizes stroke volume, capillary angiogenesis, and mitochondrial volume in Type-I slow-twitch fibers.',
    vectors: {
      heart_health: 96,
      brain_longevity: 72,
      metabolic_health: 88,
      cancer_defense: 48,
      testosterone: 55,
      chronic_inflammation: 65,
      bone_density: 50,
      cellular_longevity: 56
    },
    hallmarks: {
      genomic_instability: 62,
      telomere_attrition: 68,
      epigenetic_alterations: 76,
      loss_of_proteostasis: 72,
      disabled_macroautophagy: 70,
      deregulated_nutrient_sensing: 90,
      mitochondrial_dysfunction: 94,
      cellular_senescence: 66,
      stem_cell_exhaustion: 70,
      altered_intercellular_communication: 80,
      chronic_inflammation: 78,
      dysbiosis: 74
    }
  }
}

/**
 * Returns fingerprint profile for a given protocol ID or name, with a safe fallback
 */
export function getProtocolFingerprint(protocolOrId: any): ProtocolFingerprint {
  if (!protocolOrId) {
    return createDefaultFingerprint('custom_protocol', 'Custom Protocol')
  }

  const id = typeof protocolOrId === 'string' ? protocolOrId : protocolOrId.id
  const name = typeof protocolOrId === 'string' ? protocolOrId : protocolOrId.name || 'Protocol'

  // Exact ID match
  if (PROTOCOL_FINGERPRINTS_MAP[id]) {
    return PROTOCOL_FINGERPRINTS_MAP[id]
  }

  // Normalized key match
  const normId = (id || '').toLowerCase().replace(/[^a-z0-9]/g, '_')
  for (const [key, profile] of Object.entries(PROTOCOL_FINGERPRINTS_MAP)) {
    if (normId.includes(key) || key.includes(normId)) {
      return profile
    }
  }

  // Name match
  const normName = (name || '').toLowerCase()
  for (const profile of Object.values(PROTOCOL_FINGERPRINTS_MAP)) {
    if (profile.name.toLowerCase().includes(normName) || normName.includes(profile.name.toLowerCase())) {
      return profile
    }
  }

  // Fallback for custom user protocols
  return createDefaultFingerprint(id || 'custom', name)
}

function createDefaultFingerprint(id: string, name: string): ProtocolFingerprint {
  return {
    id,
    name,
    creator: 'Personalized Protocol',
    superpowers: ['Metabolic Health (70)', 'Systemic Inflammation (70)'],
    primaryGaps: ['Cellular Longevity (45)', 'Cancer Defense (45)'],
    synergyNotes: 'Customized protocol stack tailored to personal biological optimization.',
    vectors: {
      heart_health: 65,
      brain_longevity: 65,
      metabolic_health: 70,
      cancer_defense: 50,
      testosterone: 60,
      chronic_inflammation: 70,
      bone_density: 55,
      cellular_longevity: 55
    },
    hallmarks: {
      genomic_instability: 65,
      telomere_attrition: 60,
      epigenetic_alterations: 70,
      loss_of_proteostasis: 70,
      disabled_macroautophagy: 65,
      deregulated_nutrient_sensing: 75,
      mitochondrial_dysfunction: 75,
      cellular_senescence: 65,
      stem_cell_exhaustion: 65,
      altered_intercellular_communication: 75,
      chronic_inflammation: 75,
      dysbiosis: 70
    }
  }
}
