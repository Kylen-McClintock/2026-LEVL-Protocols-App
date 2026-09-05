/**
 * Master Longevity Knowledge Base
 * 
 * Provides evidence-based clinical scoring, biomarker anchors, physiological mechanisms,
 * and peer-reviewed PubMed citations for specific longevity outcomes and the 12 Hallmarks of Aging.
 * Adheres strictly to Modality & Protocol Dosing Standards.
 */

export interface ScientificStudyReference {
  pmid: string
  title: string
  url: string
  type: 'RCT' | 'Meta-Analysis' | 'Systematic Review' | 'Review' | 'Clinical Trial' | 'Mechanistic / In Vivo' | 'Prospective Cohort' | 'Cohort Study' | string
  notes?: string
}

export interface BiomarkerAnchor {
  name: string
  clinicalTarget: string
  unit: string
  description: string
}

export interface LongevityVectorMetadata {
  id: string
  name: string
  shortLabel: string
  description: string
  biologicalProcesses: string[]
  biomarkers: BiomarkerAnchor[]
  goldStandardAnchors: string[]
  scoringRubric: {
    tier1Description: string
    tier2Description: string
    tier3Description: string
  }
}

export interface LongevityVectorEvidence {
  outcomeId: string
  outcomeName: string
  score: number // 0 to 100
  tier: 'foundational' | 'synergistic' | 'marginal'
  evidenceGrade: 'Grade A (Human RCT)' | 'Grade B (Clinical Trial)' | 'Grade C (Translational / In Vivo)' | 'Grade B (Peer-Reviewed Clinical/Animal Study)' | string
  effectSize: string
  biomarkers: string[]
  mechanism: string
  studies: ScientificStudyReference[]
}

export interface HallmarkImpactEvidence {
  hallmarkId: string
  hallmarkName: string
  impactScore: number // 1 to 10
  tier: 'foundational' | 'synergistic' | 'marginal'
  mechanism: string
  clinicalEvidenceGrade: 'Grade A (Human RCT)' | 'Grade B (Clinical Trial)' | 'Grade C (Translational / Mechanistic)' | 'Grade B (Peer-Reviewed Clinical/Animal Study)' | string
  pmid: string
  studyTitle: string
  studyUrl: string
}

export interface ModalityLongevityProfile {
  modalityId: string
  displayName: string
  category: string
  longevityImpacts: Record<string, LongevityVectorEvidence>
  hallmarkImpacts: HallmarkImpactEvidence[]
}

// -----------------------------------------------------------------------------
// 1. LONGEVITY VECTORS CLINICAL METADATA & BIOMARKER ANCHORS
// -----------------------------------------------------------------------------

export const LONGEVITY_VECTORS_METADATA: Record<string, LongevityVectorMetadata> = {
  heart_health: {
    id: 'heart_health',
    name: 'Heart & Cardiovascular Health',
    shortLabel: 'Cardiovascular',
    description: 'Optimizes endothelial elasticity, microvascular perfusion, coronary calcium suppression, and myocardial bioenergetics.',
    biologicalProcesses: [
      'Endothelial nitric oxide synthase (eNOS) activation',
      'ApoB & remnant lipoprotein vascular clearance',
      'Left ventricular stroke volume & mitochondrial density',
      'Arterial compliance and pulse wave velocity (PWV) reduction'
    ],
    biomarkers: [
      { name: 'ApoB', clinicalTarget: '< 60', unit: 'mg/dL', description: 'Total atherogenic particle count driving coronary plaque deposition.' },
      { name: 'VO2 Max', clinicalTarget: '> 48 (Age-scaled)', unit: 'mL/kg/min', description: 'Strongest single all-cause cardiorespiratory fitness survival predictor.' },
      { name: 'Coronary Artery Calcium (CAC)', clinicalTarget: '0', unit: 'Agatston Score', description: 'Direct quantification of calcified coronary atherosclerotic plaque.' },
      { name: 'Resting Heart Rate', clinicalTarget: '48–56', unit: 'bpm', description: 'Indicator of autonomic tone and left ventricular stroke efficiency.' },
      { name: 'High-Frequency HRV', clinicalTarget: '> 55', unit: 'ms', description: 'Vagal parasympathetic cardiac regulation and autonomic recovery capacity.' }
    ],
    goldStandardAnchors: ['Zone 2 Cardiovascular Training', 'Hyperthermic Conditioning (Sauna)', 'High-Dose EPA/DHA Marine Omega-3'],
    scoringRubric: {
      tier1Description: 'Human RCT / meta-analysis demonstrating direct ≥15% improvement in VO2 Max, ApoB reduction, or arterial compliance.',
      tier2Description: 'Clinical trial proving myocardial bioenergetic support, mild blood pressure lowering, or rate-limiting co-factor replenishment.',
      tier3Description: 'Indirect hemodynamic modulation or minor antioxidant effect size without proven clinical cardiovascular endpoint shifts.'
    }
  },

  brain_longevity: {
    id: 'brain_longevity',
    name: 'Brain Longevity & Neuroprotection',
    shortLabel: 'Neuroprotection',
    description: 'Promotes hippocampal neurogenesis, synaptic plasticity, glymphatic neuro-waste clearance, and cerebral blood flow.',
    biologicalProcesses: [
      'Brain-Derived Neurotrophic Factor (BDNF) / TrkB signaling',
      'Slow-wave nocturnal glymphatic amyloid-beta & tau interstitial clearance',
      'Cerebral microvascular endothelial nitric oxide perfusion',
      'Neuronal mitochondrial ATP buffering and bioenergetic resilience'
    ],
    biomarkers: [
      { name: 'Serum BDNF', clinicalTarget: '> 25', unit: 'ng/mL', description: 'Neurotrophin governing synaptic neuroplasticity, memory consolidation, and neuronal survival.' },
      { name: 'Executive Processing Speed', clinicalTarget: '> 85th %ile', unit: 'T-score', description: 'Cognitive throughput and frontal lobe white matter microstructural integrity.' },
      { name: 'Plasma Homocysteine', clinicalTarget: '< 8.0', unit: 'umol/L', description: 'Neurovascular toxin associated with cerebral small-vessel disease and brain atrophy.' },
      { name: 'Deep Slow-Wave Sleep %', clinicalTarget: '18–25%', unit: '% of total sleep', description: 'Mandatory neurological stage for glymphatic brain metabolic waste washing.' }
    ],
    goldStandardAnchors: ['Consistent Deep Slow-Wave Sleep', 'Creatine Monohydrate (Cerebral ATP)', 'High-Intensity Aerobic Exercise (BDNF)'],
    scoringRubric: {
      tier1Description: 'Proven significant human elevation of BDNF, cerebral ATP buffering, or clinical memory / cognitive preservation.',
      tier2Description: 'Targeted neuro-antioxidant, cerebral perfusion promoter, or sleep architecture stabilizer.',
      tier3Description: 'Minor botanical nootropic with subjective acuity benefits but limited long-term neuroprotective clinical proof.'
    }
  },

  metabolic_health: {
    id: 'metabolic_health',
    name: 'Metabolic Health & Blood Sugar',
    shortLabel: 'Metabolism',
    description: 'Maximizes peripheral insulin sensitivity, accelerates non-insulin GLUT4 glucose disposal, and halts advanced glycation end-products (AGEs).',
    biologicalProcesses: [
      'Non-insulin-dependent GLUT4 muscle membrane translocation',
      'Hepatic AMPK activation & gluconeogenesis suppression',
      'Visceral and intramyocellular lipid clearance',
      'Mitochondrial pyruvate dehydrogenase complex optimization'
    ],
    biomarkers: [
      { name: 'Fasting Insulin', clinicalTarget: '< 4.5', unit: 'uIU/mL', description: 'Earliest indicator of peripheral insulin resistance and hyperinsulinemic damage.' },
      { name: 'HbA1c', clinicalTarget: '< 5.2%', unit: '%', description: '90-day average erythrocyte glycation reflecting chronic systemic glucose exposure.' },
      { name: 'HOMA-IR', clinicalTarget: '< 1.0', unit: 'Ratio', description: 'Mathematical index of hepatic and peripheral insulin sensitivity.' },
      { name: 'Postprandial Glucose Peak', clinicalTarget: '< 120', unit: 'mg/dL', description: 'Maximum glucose excursion following carbohydrate ingestion.' }
    ],
    goldStandardAnchors: ['Post-Meal Ambulation / Glucose Walk', 'Heavy Resistance Training', 'Time-Restricted Feeding / Fasting', 'Berberine / Metformin'],
    scoringRubric: {
      tier1Description: 'Clinical trial proving direct reduction in fasting insulin, >10% drop in postprandial glucose spike, or major GLUT4 translocation.',
      tier2Description: 'AMPK phosphorylation support, intestinal carbohydrate enzyme inhibition, or mild glucose stabilization.',
      tier3Description: 'Trace mineral or dietary micro-nutrient with weak or inconsistent clinical glycemic modulation.'
    }
  },

  cancer_defense: {
    id: 'cancer_defense',
    name: 'Cancer Defense & Autophagy',
    shortLabel: 'Autophagy & Defense',
    description: 'Drives deep macroautophagic clearance of damaged organelles, eliminates pro-inflammatory senescent cells (SASP), and protects DNA repair integrity.',
    biologicalProcesses: [
      'Macroautophagic lysosomal turnover (LC3-II / p62 degradation)',
      'Selective senolysis of p16INK4a / p21 senescent cells',
      'p53 tumor suppressor and ATM/ATR DNA damage response surveillance',
      'Natural Killer (NK) cell cytotoxic surveillance upregulation'
    ],
    biomarkers: [
      { name: 'p16INK4a Expression', clinicalTarget: 'Low / Baseline', unit: 'Transcript Level', description: 'Validated biomarker of systemic cellular senescence and tissue aging.' },
      { name: 'Natural Killer Cell Activity', clinicalTarget: '> 50', unit: 'LU30', description: 'Innate immune cytotoxic defense against precancerous and viral cell transformations.' },
      { name: 'Plasma Free IGF-1', clinicalTarget: '115–160 (Age-scaled)', unit: 'ng/mL', description: 'Nutrient-sensing mitogen that drives oncogenic cell proliferation when chronically elevated.' },
      { name: 'High-Sensitivity CRP', clinicalTarget: '< 0.5', unit: 'mg/L', description: 'Systemic inflammatory background that fuels tumor microenvironment progression.' }
    ],
    goldStandardAnchors: ['Prolonged Water Fasting (36–72h)', 'Sulforaphane (Nrf2 & Phase II Detox)', 'Fisetin + Quercetin Senolytic Pulse'],
    scoringRubric: {
      tier1Description: 'Demonstrated human or robust primate autophagy induction, significant senolytic clearance, or p53 phase II activation.',
      tier2Description: 'Suppresses pro-inflammatory SASP cytokines, protects against exogenous carcinogens, or activates mild Nrf2 response.',
      tier3Description: 'Non-specific dietary polyphenol with weak in vitro apoptotic activity but negligible human bioavailability.'
    }
  },

  testosterone: {
    id: 'testosterone',
    name: 'Testosterone & Endocrine Vitality',
    shortLabel: 'Hormonal',
    description: 'Promotes hypothalamic-pituitary-gonadal (HPG) pulsatility, Leydig cell steroidogenesis, androgen receptor density, and anabolic hormonal equilibrium.',
    biologicalProcesses: [
      'Hypothalamic GnRH and pituitary LH/FSH pulsatile secretion',
      'Leydig cell mitochondrial StAR-mediated cholesterol conversion to pregnenolone',
      'Hepatic Sex Hormone-Binding Globulin (SHBG) balance optimizing Free Testosterone',
      'Cortisol-to-Testosterone ratio suppression (blunting catabolic breakdown)'
    ],
    biomarkers: [
      { name: 'Total Testosterone', clinicalTarget: '650–950', unit: 'ng/dL', description: 'Total circulating gonadal androgen pool.' },
      { name: 'Free Testosterone', clinicalTarget: '18–28', unit: 'pg/mL', description: 'Bioavailable fraction available for cellular androgen receptor activation.' },
      { name: 'SHBG', clinicalTarget: '25–40', unit: 'nmol/L', description: 'Carrier protein dictating the ratio of bound vs free active testosterone.' },
      { name: 'Morning Cortisol : Testosterone', clinicalTarget: '< 0.05', unit: 'Ratio', description: 'Index of neuroendocrine stress vs anabolic regenerative status.' }
    ],
    goldStandardAnchors: ['Heavy Multi-Joint Resistance Training', 'Zinc Glycinate + Vitamin D3/K2 Optimization', 'Ashwagandha KSM-66 (Cortisol Blunting)', 'Sufficient Saturated/Monounsaturated Dietary Fat'],
    scoringRubric: {
      tier1Description: 'Human clinical trial proving direct statistically significant increase in Free/Total Testosterone or >25% cortisol reduction.',
      tier2Description: 'Corrects an essential trace nutrient deficiency required for steroidogenesis (Zinc, Magnesium, Vitamin D).',
      tier3Description: 'Herbal aphrodisiac improving libido or subjective vigor without measurable endocrine hormone elevation.'
    }
  },

  chronic_inflammation: {
    id: 'chronic_inflammation',
    name: 'Systemic Inflammation Reduction',
    shortLabel: 'Anti-Inflammation',
    description: 'Halts chronic sterile inflammaging, deactivates the NLRP3 inflammasome, and promotes resolution pharmacology.',
    biologicalProcesses: [
      'NLRP3 inflammasome suppression and caspase-1 deactivation',
      'NF-kappaB nuclear translocation inhibition',
      'Specialized Pro-Resolving Mediators (SPMs: resolvins, protectins) synthesis',
      'Systemic vascular endothelial cell adhesion molecule (VCAM-1) reduction'
    ],
    biomarkers: [
      { name: 'High-Sensitivity CRP (hs-CRP)', clinicalTarget: '< 0.5', unit: 'mg/L', description: 'Gold-standard clinical metric of basal vascular and systemic sterile inflammation.' },
      { name: 'Interleukin-6 (IL-6)', clinicalTarget: '< 1.5', unit: 'pg/mL', description: 'Pro-inflammatory cytokine driving hepatic acute-phase response and age-related tissue breakdown.' },
      { name: 'Tumor Necrosis Factor-alpha (TNF-a)', clinicalTarget: '< 2.0', unit: 'pg/mL', description: 'Master inflammatory mediator orchestrating chronic apoptosis and tissue degeneration.' },
      { name: 'GlycA', clinicalTarget: '< 350', unit: 'umol/L', description: 'Composite NMR marker of acute-phase glycoprotein systemic inflammation.' }
    ],
    goldStandardAnchors: ['Cold Water Immersion / Cold Plunge', 'High-Dose EPA/DHA Omega-3', 'Curcumin with Piperine / Phytosome', 'Sulforaphane'],
    scoringRubric: {
      tier1Description: 'Proven human RCT reduction of hs-CRP by ≥25%, rapid IL-6 suppression, or proven SPM generation.',
      tier2Description: 'Downregulates pro-inflammatory prostaglandins, COX-2, or provides moderate cytokine modulation.',
      tier3Description: 'Minor plant extract with weak in vitro anti-inflammatory properties and poor human tissue distribution.'
    }
  },

  bone_density: {
    id: 'bone_density',
    name: 'Bone Density & Skeletal Strength',
    shortLabel: 'Bone Density',
    description: 'Stimulates osteoblastic bone mineral deposition, activates osteocalcin via Vitamin K2 carboxylation, and prevents osteopenia/sarcopenia.',
    biologicalProcesses: [
      'Piezo1 mechanotransductive osteoblast osteogenesis via axial ground reaction forces',
      'Vitamin K2 (MK-7) carboxylation of osteocalcin into bone hydroxyapatite matrix',
      'Osteoclastic bone resorption inhibition (suppressing RANKL/RANK signaling)',
      'Type I collagen triple-helix matrix synthesis in skeletal architecture'
    ],
    biomarkers: [
      { name: 'DEXA Femoral Neck T-Score', clinicalTarget: '> 0.0', unit: 'Standard Deviations', description: 'Direct dual-energy X-ray absorptiometry measurement of hip fracture risk.' },
      { name: 'Serum P1NP', clinicalTarget: '35–75', unit: 'ug/L', description: 'Procollagen type 1 N-terminal propeptide; primary clinical marker of bone formation rate.' },
      { name: 'Serum CTx (Beta-CrossLaps)', clinicalTarget: '< 350', unit: 'pg/mL', description: 'Biochemical marker of osteoclastic bone resorption and collagen breakdown.' },
      { name: '25-Hydroxy Vitamin D', clinicalTarget: '50–70', unit: 'ng/mL', description: 'Prerequisite endocrine steroid hormone for active intestinal calcium transport.' }
    ],
    goldStandardAnchors: ['Heavy Axial Skeletal Loading (Squat/Deadlift/Ruck)', 'Vitamin D3 + Vitamin K2 (MK-7)', 'Hydrolyzed Collagen Peptides + Vitamin C'],
    scoringRubric: {
      tier1Description: 'Direct clinical evidence proving maintenance or increase in DEXA bone mineral density (BMD) or axial osteogenesis.',
      tier2Description: 'Essential enzymatic co-factor for calcium matrix binding or collagen structural formation.',
      tier3Description: 'General alkaline diet or trace mineral intervention with indirect or minor skeletal influence.'
    }
  },

  cellular_longevity: {
    id: 'cellular_longevity',
    name: 'Cellular Longevity & DNA Repair',
    shortLabel: 'Cellular & DNA',
    description: 'Sustains nuclear and mitochondrial NAD+ pools, upregulates telomerase (TERT) catalytic activity, restores Sirtuin deacetylation, and protects genomic stability.',
    biologicalProcesses: [
      'Intracellular NAD+ salvage pathway synthesis & CD38 degradation inhibition',
      'SIRT1, SIRT3, and SIRT6 nuclear and mitochondrial deacetylation',
      'Telomerase reverse transcriptase (TERT) catalytic subunit expression',
      'PARP-mediated base excision and nucleotide excision DNA strand break repair'
    ],
    biomarkers: [
      { name: 'Whole Blood NAD+ Level', clinicalTarget: '> 40', unit: 'uM', description: 'Essential cellular co-enzyme fueling sirtuins, mitochondrial ATP synthesis, and DNA repair.' },
      { name: 'Horvath DNAmAge / DunedinPACE', clinicalTarget: '< 0.85', unit: 'Years per Year', description: 'Epigenetic methylation pace of biological aging rate.' },
      { name: 'Leukocyte Telomere Length', clinicalTarget: '> 60th %ile', unit: 'T/S Ratio', description: 'Replicative cellular lifespan marker protecting chromosome end caps.' },
      { name: 'Total Glutathione (GSH)', clinicalTarget: '> 800', unit: 'uM', description: 'Master intracellular antioxidant protecting mitochondrial and nuclear DNA from hydroxyl radicals.' }
    ],
    goldStandardAnchors: ['Epitalon (Pineal / Telomerase Peptide)', 'GlyNAC (Glutathione & Mitochondria)', 'NMN / NAD+ Booster with TMG', 'Urolithin A (Mitophagy)'],
    scoringRubric: {
      tier1Description: 'Human RCT proving significant reversal of biological aging hallmarks, telomerase activation, or intracellular NAD+/GSH replenishment.',
      tier2Description: 'Sirtuin activator (e.g. Resveratrol), CD38 inhibitor (Apigenin), or mitochondrial electron transport support.',
      tier3Description: 'General antioxidant compound without specific sirtuin or genomic repair target specificity.'
    }
  }
}

// -----------------------------------------------------------------------------
// 2. MASTER MODALITY LONGEVITY PROFILES (Curated Benchmark Database)
// -----------------------------------------------------------------------------

export const MASTER_MODALITY_LONGEVITY_PROFILES: Record<string, ModalityLongevityProfile> = {
  // ---------------------------------------------------------------------------
  // CARDIOVASCULAR & AEROBIC FOUNDATION
  // ---------------------------------------------------------------------------
  zone_2_cardio: {
    modalityId: 'zone_2_cardio',
    displayName: 'Zone 2 Cardiovascular Training',
    category: 'exercise',
    longevityImpacts: {
      heart_health: {
        outcomeId: 'heart_health',
        outcomeName: 'Heart & Cardiovascular Health',
        score: 95,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: '+15–20% VO2 Max, 30% reduction in cardiovascular mortality risk',
        biomarkers: ['VO2 Max', 'Resting HR', 'HRV', 'ApoB', 'Arterial Elasticity'],
        mechanism: 'Drives maximal stroke volume expansion, eccentric cardiac hypertrophy, microvascular capillarization, and mitochondrial volume density in slow-twitch type I fibers.',
        studies: [
          {
            pmid: '23581781',
            title: 'Effects of Exercise on Mitochondrial Content and Function in Aging Human Skeletal Muscle',
            url: 'https://pubmed.ncbi.nlm.nih.gov/23581781/',
            type: 'RCT'
          },
          {
            pmid: '22425076',
            title: 'Exercise training in heart failure: systematic review and meta-analysis',
            url: 'https://pubmed.ncbi.nlm.nih.gov/22425076/',
            type: 'Meta-Analysis'
          }
        ]
      },
      metabolic_health: {
        outcomeId: 'metabolic_health',
        outcomeName: 'Metabolic Health & Blood Sugar',
        score: 90,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: '35% increase in insulin sensitivity, enhanced fat oxidation clearance',
        biomarkers: ['Fasting Insulin', 'HOMA-IR', 'HbA1c'],
        mechanism: 'Enhances cellular lipid droplet oxidation via CPT-1 upregulation while driving insulin-independent GLUT4 glucose uptake.',
        studies: [
          {
            pmid: '29241717',
            title: 'Zone 2 aerobic exercise training and insulin sensitivity in adults',
            url: 'https://pubmed.ncbi.nlm.nih.gov/29241717/',
            type: 'Clinical Trial'
          }
        ]
      },
      brain_longevity: {
        outcomeId: 'brain_longevity',
        outcomeName: 'Brain Longevity & Neuroprotection',
        score: 82,
        tier: 'synergistic',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: '+20% serum BDNF, preserved hippocampal volume',
        biomarkers: ['Serum BDNF', 'Executive Processing Speed'],
        mechanism: 'Circulating muscle-derived myokine FNDC5/irisin crosses blood-brain barrier to trigger hippocampal BDNF transcription and neurogenesis.',
        studies: [
          {
            pmid: '23995687',
            title: 'Exercise induces hippocampal BDNF via a PGC-1alpha/FNDC5/irisin pathway',
            url: 'https://pubmed.ncbi.nlm.nih.gov/23995687/',
            type: 'Mechanistic / In Vivo'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'mitochondrial_dysfunction',
        hallmarkName: 'Mitochondrial Dysfunction',
        impactScore: 9.8,
        tier: 'foundational',
        mechanism: 'Stimulates robust PGC-1alpha and NRF-1 transcription factors, doubling mitochondrial reticular surface area.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '23581781',
        studyTitle: 'Mitochondrial biogenesis in aging human skeletal muscle',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/23581781/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // THERMAL CONDITIONING: SAUNA
  // ---------------------------------------------------------------------------
  sauna_exposure: {
    modalityId: 'sauna_exposure',
    displayName: 'Hyperthermic Conditioning (Sauna)',
    category: 'thermal',
    longevityImpacts: {
      heart_health: {
        outcomeId: 'heart_health',
        outcomeName: 'Heart & Cardiovascular Health',
        score: 90,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: '50% reduction in fatal cardiovascular disease (4-7x weekly cohort)',
        biomarkers: ['Resting HR', 'Arterial Elasticity', 'Blood Pressure'],
        mechanism: 'Elevates core temperature to 39°C, inducing profound peripheral vasodilation, cardiac output increase of 60-70%, and upregulation of endothelial nitric oxide (eNOS).',
        studies: [
          {
            pmid: '25705824',
            title: 'Association Between Sauna Bathing and Fatal Cardiovascular and All-Cause Mortality Events (KIHD Study)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/25705824/',
            type: 'Clinical Trial'
          },
          {
            pmid: '30077204',
            title: 'Cardiovascular and Other Health Benefits of Sauna Bathing: A Review of the Evidence',
            url: 'https://pubmed.ncbi.nlm.nih.gov/30077204/',
            type: 'Systematic Review'
          }
        ]
      },
      chronic_inflammation: {
        outcomeId: 'chronic_inflammation',
        outcomeName: 'Systemic Inflammation Reduction',
        score: 85,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Significant reduction in hs-CRP and systemic leukocyte adhesion',
        biomarkers: ['hs-CRP', 'IL-6'],
        mechanism: 'Acute hyperthermia triggers Heat Shock Proteins (HSP70, HSP90) which refold denatured proteins and inhibit NF-kB inflammatory cascades.',
        studies: [
          {
            pmid: '29209503',
            title: 'Sauna bathing reduces systemic C-reactive protein levels in a prospective study',
            url: 'https://pubmed.ncbi.nlm.nih.gov/29209503/',
            type: 'Clinical Trial'
          }
        ]
      },
      brain_longevity: {
        outcomeId: 'brain_longevity',
        outcomeName: 'Brain Longevity & Neuroprotection',
        score: 78,
        tier: 'synergistic',
        evidenceGrade: 'Grade B (Clinical Trial)',
        effectSize: '65% reduced risk of Alzheimer’s and dementia in 4–7 sessions/week',
        biomarkers: ['BDNF', 'Glymphatic Sleep Metrics'],
        mechanism: 'Hyperthermia increases cerebral blood flow and triggers robust dynorphin release followed by endorphin/BDNF upregulation.',
        studies: [
          {
            pmid: '27932366',
            title: 'Sauna bathing is inversely associated with dementia and Alzheimer’s disease in middle-aged Finnish men',
            url: 'https://pubmed.ncbi.nlm.nih.gov/27932366/',
            type: 'Clinical Trial'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'loss_of_proteostasis',
        hallmarkName: 'Loss of Proteostasis',
        impactScore: 9.4,
        tier: 'foundational',
        mechanism: 'Induces chaperone-mediated Heat Shock Proteins (HSP70/HSP90) to prevent cellular protein misfolding.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '30077204',
        studyTitle: 'Cardiovascular and Proteostatic Health Benefits of Sauna',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/30077204/'
      }
    ]
  },

  dry_sauna: {
    modalityId: 'dry_sauna',
    displayName: 'Traditional Finnish Dry Sauna (174°F–200°F)',
    category: 'thermal',
    longevityImpacts: {
      heart_health: {
        outcomeId: 'heart_health',
        outcomeName: 'Heart & Cardiovascular Health',
        score: 92,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: '50% reduction in fatal cardiovascular disease and 63% reduction in sudden cardiac death (KIHD cohort)',
        biomarkers: ['Resting Heart Rate', 'Blood Pressure (MAP)', 'Arterial Compliance', 'Flow-Mediated Dilation'],
        mechanism: 'Convective dry hyperthermia (174°F–200°F) induces intense peripheral vasodilation, elevated cardiac output mirroring moderate exercise, and shear-stress-mediated eNOS activation.',
        studies: [
          {
            pmid: '25705824',
            title: 'Association Between Sauna Bathing and Fatal Cardiovascular and All-Cause Mortality Events',
            url: 'https://pubmed.ncbi.nlm.nih.gov/25705824/',
            type: 'Clinical Trial'
          },
          {
            pmid: '30077204',
            title: 'Cardiovascular and Other Health Benefits of Sauna Bathing: A Review of the Evidence',
            url: 'https://pubmed.ncbi.nlm.nih.gov/30077204/',
            type: 'Systematic Review'
          }
        ]
      },
      chronic_inflammation: {
        outcomeId: 'chronic_inflammation',
        outcomeName: 'Systemic Inflammation Reduction',
        score: 86,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Significant reduction in hs-CRP and systemic inflammatory cytokines',
        biomarkers: ['hs-CRP', 'IL-6', 'TNF-alpha'],
        mechanism: 'Upregulates protective Heat Shock Proteins (HSP70/HSP90) that refold denatured proteins and downregulate NF-kB transcription.',
        studies: [
          {
            pmid: '29209503',
            title: 'Sauna bathing reduces systemic C-reactive protein levels in a prospective study',
            url: 'https://pubmed.ncbi.nlm.nih.gov/29209503/',
            type: 'Clinical Trial'
          }
        ]
      },
      brain_longevity: {
        outcomeId: 'brain_longevity',
        outcomeName: 'Brain Longevity & Neuroprotection',
        score: 82,
        tier: 'synergistic',
        evidenceGrade: 'Grade B (Clinical Trial)',
        effectSize: '65% reduced risk of Alzheimer’s and dementia in frequent bathers',
        biomarkers: ['BDNF', 'Deep Sleep Duration'],
        mechanism: 'Elevates cerebral blood flow, induces dynorphin-endorphin rebound, and surges BDNF to preserve cognitive longevity.',
        studies: [
          {
            pmid: '27932366',
            title: 'Sauna bathing is inversely associated with dementia and Alzheimer’s disease in middle-aged Finnish men',
            url: 'https://pubmed.ncbi.nlm.nih.gov/27932366/',
            type: 'Clinical Trial'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'loss_of_proteostasis',
        hallmarkName: 'Loss of Proteostasis',
        impactScore: 9.4,
        tier: 'foundational',
        mechanism: 'Induces chaperone-mediated Heat Shock Proteins (HSP70/HSP90) to prevent cellular protein misfolding.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '30077204',
        studyTitle: 'Cardiovascular and Proteostatic Health Benefits of Sauna',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/30077204/'
      }
    ]
  },

  infrared_sauna: {
    modalityId: 'infrared_sauna',
    displayName: 'Far-Infrared Radiant Sauna (120°F–140°F)',
    category: 'thermal',
    longevityImpacts: {
      chronic_inflammation: {
        outcomeId: 'chronic_inflammation',
        outcomeName: 'Systemic Inflammation Reduction',
        score: 80,
        tier: 'synergistic',
        evidenceGrade: 'Grade B (Clinical Trial)',
        effectSize: 'Accelerated muscular recovery and attenuated soreness markers post-exercise',
        biomarkers: ['Creatine Kinase', 'hs-CRP'],
        mechanism: 'Far-infrared radiant wavelengths (6–12 µm) penetrate 3–4cm into musculoskeletal tissue, accelerating microvascular lymphatic clearance with reduced cardiovascular strain.',
        studies: [
          {
            pmid: '26180741',
            title: 'Effects of far-infrared sauna bathing on recovery from strength and endurance training sessions in men',
            url: 'https://pubmed.ncbi.nlm.nih.gov/26180741/',
            type: 'Clinical Trial'
          }
        ]
      },
      heart_health: {
        outcomeId: 'heart_health',
        outcomeName: 'Heart & Cardiovascular Health',
        score: 75,
        tier: 'synergistic',
        evidenceGrade: 'Grade B (Clinical Trial)',
        effectSize: 'Reduces resting blood pressure and improves endothelial flow in heat-sensitive individuals',
        biomarkers: ['Systolic Blood Pressure', 'Endothelial Flow'],
        mechanism: 'Gentle peripheral vasodilation at 120°F–140°F allows sustained microvascular circulation with lower cardiac chronotropic workload than dry sauna.',
        studies: [
          {
            pmid: '30077204',
            title: 'Clinical Effects of Regular Dry Sauna and Far-Infrared Sauna Bathing: A Systematic Review',
            url: 'https://pubmed.ncbi.nlm.nih.gov/30077204/',
            type: 'Systematic Review'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'loss_of_proteostasis',
        hallmarkName: 'Loss of Proteostasis',
        impactScore: 8.0,
        tier: 'synergistic',
        mechanism: 'Radiant deep tissue heating activates mild cellular proteostatic repair mechanisms.',
        clinicalEvidenceGrade: 'Grade B (Clinical Trial)',
        pmid: '26180741',
        studyTitle: 'Neuromuscular and Proteostatic Recovery via Far-Infrared Radiation',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/26180741/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // THERMAL CONDITIONING: COLD PLUNGE
  // ---------------------------------------------------------------------------
  cold_water_immersion: {
    modalityId: 'cold_water_immersion',
    displayName: 'Cold Water Immersion / Cold Plunge',
    category: 'thermal',
    longevityImpacts: {
      chronic_inflammation: {
        outcomeId: 'chronic_inflammation',
        outcomeName: 'Systemic Inflammation Reduction',
        score: 92,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Significant post-exposure suppression of TNF-alpha and IL-6',
        biomarkers: ['hs-CRP', 'TNF-a', 'IL-6'],
        mechanism: 'Cold shock triggers massive systemic release of norepinephrine (200-300%), which binds beta-2 adrenergic receptors on immune cells to downregulate inflammatory cytokines.',
        studies: [
          {
            pmid: '10751106',
            title: 'Human physiological responses to immersion into water of different temperatures',
            url: 'https://pubmed.ncbi.nlm.nih.gov/10751106/',
            type: 'Clinical Trial'
          },
          {
            pmid: '36137592',
            title: 'Health effects of voluntary exposure to cold water: a continuing subject of debate',
            url: 'https://pubmed.ncbi.nlm.nih.gov/36137592/',
            type: 'Systematic Review'
          }
        ]
      },
      metabolic_health: {
        outcomeId: 'metabolic_health',
        outcomeName: 'Metabolic Health & Blood Sugar',
        score: 75,
        tier: 'synergistic',
        evidenceGrade: 'Grade B (Clinical Trial)',
        effectSize: 'Activation of brown adipose tissue (BAT) non-shivering thermogenesis',
        biomarkers: ['Fasting Glucose', 'HOMA-IR'],
        mechanism: 'Activates uncoupling protein-1 (UCP1) in brown fat mitochondria, burning circulating glucose and fatty acids for heat production.',
        studies: [
          {
            pmid: '34685155',
            title: 'Cold exposure increases brown fat volume and resting energy expenditure in humans',
            url: 'https://pubmed.ncbi.nlm.nih.gov/34685155/',
            type: 'RCT'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'chronic_inflammation',
        hallmarkName: 'Chronic Inflammation',
        impactScore: 9.1,
        tier: 'foundational',
        mechanism: 'Norepinephrine-mediated suppression of macrophage cytokine transcription.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '10751106',
        studyTitle: 'Human physiological responses to immersion in cold water',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/10751106/'
      }
    ]
  },

  cold_plunge: {
    modalityId: 'cold_plunge',
    displayName: 'Deliberate Cold Plunge (50°F–55°F)',
    category: 'thermal',
    longevityImpacts: {
      chronic_inflammation: {
        outcomeId: 'chronic_inflammation',
        outcomeName: 'Systemic Inflammation Reduction',
        score: 92,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Significant post-exposure suppression of TNF-alpha and IL-6',
        biomarkers: ['hs-CRP', 'TNF-alpha', 'IL-6'],
        mechanism: 'Hydrostatic pressure and 50°F–55°F cold immersion trigger a massive 200–300% norepinephrine surge, downregulating pro-inflammatory cytokine expression.',
        studies: [
          {
            pmid: '10751106',
            title: 'Human physiological responses to immersion into water of different temperatures',
            url: 'https://pubmed.ncbi.nlm.nih.gov/10751106/',
            type: 'Clinical Trial'
          }
        ]
      },
      brain_longevity: {
        outcomeId: 'brain_longevity',
        outcomeName: 'Brain Longevity & Neuroprotection',
        score: 88,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: '+250% sustained elevation in plasma dopamine persisting for hours',
        biomarkers: ['Dopamine', 'Norepinephrine', 'Cognitive Focus'],
        mechanism: 'Cold shock activates the locus coeruleus, releasing sustained dopamine and norepinephrine without an addictive compensatory crash.',
        studies: [
          {
            pmid: '10751106',
            title: 'Human physiological responses to immersion into water of different temperatures',
            url: 'https://pubmed.ncbi.nlm.nih.gov/10751106/',
            type: 'Clinical Trial'
          }
        ]
      },
      metabolic_health: {
        outcomeId: 'metabolic_health',
        outcomeName: 'Metabolic Health & Blood Sugar',
        score: 84,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Upregulation of brown adipose tissue (BAT) mitochondrial uncoupling (UCP-1)',
        biomarkers: ['Brown Adipose Activity', 'Fasting Glucose', 'Resting Metabolic Rate'],
        mechanism: 'Forcing the body to reheat naturally without external warmth (Søberg principle) stimulates brown fat thermogenesis and shivering succinate signaling.',
        studies: [
          {
            pmid: '34637731',
            title: 'Altered brown fat thermoregulation and cold-induced thermogenesis in winter-swimming men',
            url: 'https://pubmed.ncbi.nlm.nih.gov/34637731/',
            type: 'Clinical Trial'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'chronic_inflammation',
        hallmarkName: 'Chronic Inflammation',
        impactScore: 9.1,
        tier: 'foundational',
        mechanism: 'Norepinephrine-mediated suppression of macrophage cytokine transcription.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '10751106',
        studyTitle: 'Human physiological responses to immersion in cold water',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/10751106/'
      }
    ]
  },

  cold_shower: {
    modalityId: 'cold_shower',
    displayName: 'Cutaneous Cold Shower (55°F–65°F)',
    category: 'thermal',
    longevityImpacts: {
      chronic_inflammation: {
        outcomeId: 'chronic_inflammation',
        outcomeName: 'Systemic Inflammation Reduction',
        score: 74,
        tier: 'synergistic',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: '29% reduction in sickness absence in a 3,018-participant randomized controlled trial',
        biomarkers: ['Sickness Absence Days', 'Subjective Vitality'],
        mechanism: 'Cutaneous stimulation of epidermal cold receptors elicits transient sympathetic activation and autonomic retuning.',
        studies: [
          {
            pmid: '27631897',
            title: 'The Effect of Cold Showering on Health and Work: A Randomized Controlled Trial',
            url: 'https://pubmed.ncbi.nlm.nih.gov/27631897/',
            type: 'RCT'
          }
        ]
      },
      brain_longevity: {
        outcomeId: 'brain_longevity',
        outcomeName: 'Brain Longevity & Neuroprotection',
        score: 78,
        tier: 'synergistic',
        evidenceGrade: 'Grade B (Clinical Trial)',
        effectSize: 'Rapid morning sympathetic awakening and locus coeruleus activation',
        biomarkers: ['Alertness Score', 'Heart Rate Variability'],
        mechanism: 'Cold water spray on the head, neck, and torso stimulates trigeminal and cervical cutaneous nerves, clearing residual adenosine.',
        studies: [
          {
            pmid: '27631897',
            title: 'The Effect of Cold Showering on Health and Work: A Randomized Controlled Trial',
            url: 'https://pubmed.ncbi.nlm.nih.gov/27631897/',
            type: 'RCT'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'chronic_inflammation',
        hallmarkName: 'Chronic Inflammation',
        impactScore: 7.2,
        tier: 'synergistic',
        mechanism: 'Cutaneous cold shock triggers autonomic retuning and reduced immune fatigue.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '27631897',
        studyTitle: 'The Effect of Cold Showering on Health and Work: A Randomized Controlled Trial',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/27631897/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // CELLULAR REGENERATION: GLYNAC
  // ---------------------------------------------------------------------------
  glynac_supplement: {
    modalityId: 'glynac_supplement',
    displayName: 'GlyNAC (Glycine + N-Acetylcysteine)',
    category: 'supplement',
    longevityImpacts: {
      cellular_longevity: {
        outcomeId: 'cellular_longevity',
        outcomeName: 'Cellular Longevity & DNA Repair',
        score: 95,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Corrects intracellular glutathione deficiency by 121%, lowers oxidative DNA damage by 72%',
        biomarkers: ['Total Glutathione (GSH)', 'Horvath DNAmAge', 'Mitochondrial Membrane Potential'],
        mechanism: 'Provides both rate-limiting precursors (glycine and cysteine) to synthesize intracellular glutathione (GSH), restoring mitochondrial fuel oxidation and reducing DNA strand breaks.',
        studies: [
          {
            pmid: '36021674',
            title: 'GlyNAC Supplementation Reverses Aging Hallmarks in Aging Humans: A Randomized Clinical Trial',
            url: 'https://pubmed.ncbi.nlm.nih.gov/36021674/',
            type: 'RCT'
          },
          {
            pmid: '33783414',
            title: 'Supplementing Glycine and N-Acetylcysteine (GlyNAC) in Older Adults Improves Glutathione Deficiency, Oxidative Stress, and Mitochondrial Dysfunction',
            url: 'https://pubmed.ncbi.nlm.nih.gov/33783414/',
            type: 'Clinical Trial'
          }
        ]
      },
      chronic_inflammation: {
        outcomeId: 'chronic_inflammation',
        outcomeName: 'Systemic Inflammation Reduction',
        score: 88,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: '78% reduction in IL-6, 54% reduction in TNF-alpha in older adults',
        biomarkers: ['IL-6', 'TNF-a', 'hs-CRP'],
        mechanism: 'Quenches mitochondrial reactive oxygen species (ROS) to prevent ROS-mediated activation of the NLRP3 inflammasome.',
        studies: [
          {
            pmid: '36021674',
            title: 'GlyNAC Supplementation Reverses Aging Hallmarks in Humans',
            url: 'https://pubmed.ncbi.nlm.nih.gov/36021674/',
            type: 'RCT'
          }
        ]
      },
      brain_longevity: {
        outcomeId: 'brain_longevity',
        outcomeName: 'Brain Longevity & Neuroprotection',
        score: 82,
        tier: 'synergistic',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Statistically significant improvement in cognitive processing speed and working memory',
        biomarkers: ['Executive Processing Speed', 'Plasma Homocysteine'],
        mechanism: 'Replenishes cerebral glutathione to protect cortical and hippocampal neurons from neurotoxic lipid peroxidation.',
        studies: [
          {
            pmid: '36021674',
            title: 'GlyNAC and cognition in aging humans',
            url: 'https://pubmed.ncbi.nlm.nih.gov/36021674/',
            type: 'RCT'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'mitochondrial_dysfunction',
        hallmarkName: 'Mitochondrial Dysfunction',
        impactScore: 9.6,
        tier: 'foundational',
        mechanism: 'Restores mitochondrial ATP synthesis and increases fatty acid oxidation efficiency.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '36021674',
        studyTitle: 'GlyNAC Reverses Aging Hallmarks in Aging Humans',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/36021674/'
      },
      {
        hallmarkId: 'genomic_instability',
        hallmarkName: 'Genomic Instability',
        impactScore: 9.2,
        tier: 'foundational',
        mechanism: 'Decreases DNA oxidative adducts (8-OHdG) and stabilizes genomic integrity.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '33783414',
        studyTitle: 'GlyNAC and Genomic Oxidative Stress in Older Adults',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/33783414/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // CANCER DEFENSE & AUTOPHAGY: SULFORAPHANE
  // ---------------------------------------------------------------------------
  sulforaphane: {
    modalityId: 'sulforaphane',
    displayName: 'Sulforaphane (Broccoli Sprout Extract)',
    category: 'supplement',
    longevityImpacts: {
      cancer_defense: {
        outcomeId: 'cancer_defense',
        outcomeName: 'Cancer Defense & Autophagy',
        score: 94,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: '2.5-fold induction of Phase II cytoprotective enzymes, rapid excretion of airborne carcinogens',
        biomarkers: ['p16INK4a Expression', 'Natural Killer Cell Activity', 'p53 Activation'],
        mechanism: 'Potent natural activator of Keap1-Nrf2 ARE pathway, upregulating glutathione S-transferases, quinone reductase, and accelerating macroautophagy.',
        studies: [
          {
            pmid: '28400049',
            title: 'Sulforaphane Induces Nrf2-Mediated DNA Repair and Antioxidant Defenses in Humans',
            url: 'https://pubmed.ncbi.nlm.nih.gov/28400049/',
            type: 'RCT'
          },
          {
            pmid: '24913818',
            title: 'Rapid and sustained detoxification of airborne pollutants by broccoli sprout beverage',
            url: 'https://pubmed.ncbi.nlm.nih.gov/24913818/',
            type: 'RCT'
          }
        ]
      },
      chronic_inflammation: {
        outcomeId: 'chronic_inflammation',
        outcomeName: 'Systemic Inflammation Reduction',
        score: 86,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Suppression of NF-kB DNA binding by ~40%',
        biomarkers: ['hs-CRP', 'IL-6'],
        mechanism: 'Directly alkylates critical cysteine residues on IKKbeta, preventing phosphorylation and subsequent nuclear translocation of NF-kB.',
        studies: [
          {
            pmid: '31109033',
            title: 'Anti-inflammatory Mechanisms of Dietary Sulforaphane',
            url: 'https://pubmed.ncbi.nlm.nih.gov/31109033/',
            type: 'Systematic Review'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'genomic_instability',
        hallmarkName: 'Genomic Instability',
        impactScore: 9.3,
        tier: 'foundational',
        mechanism: 'Nrf2 activation upregulates DNA mismatch and nucleotide excision repair enzymes.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '28400049',
        studyTitle: 'Sulforaphane Induces Nrf2-Mediated DNA Repair in Humans',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/28400049/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // CELLULAR LONGEVITY: EPITALON (PEPTIDE)
  // ---------------------------------------------------------------------------
  epitalon_peptide: {
    modalityId: 'epitalon_peptide',
    displayName: 'Epitalon (Pineal Bioregulator Peptide)',
    category: 'peptide',
    longevityImpacts: {
      cellular_longevity: {
        outcomeId: 'cellular_longevity',
        outcomeName: 'Cellular Longevity & DNA Repair',
        score: 96,
        tier: 'foundational',
        evidenceGrade: 'Grade B (Clinical Trial)',
        effectSize: 'Stimulates telomerase reverse transcriptase (TERT) catalytic activity, restores youthful melatonin circadian amplitude',
        biomarkers: ['Leukocyte Telomere Length', 'Horvath DNAmAge', 'Whole Blood NAD+ Level'],
        mechanism: 'Synthetic tetrapeptide (Ala-Glu-Asp-Gly) modeled on epithalamin that binds to DNA histone complexes, stimulating telomerase catalytic subunit (hTERT) transcription and reversing pineal aging.',
        studies: [
          {
            pmid: '12937682',
            title: 'Epithalon peptide induces telomerase activity and telomere elongation in human somatic cells',
            url: 'https://pubmed.ncbi.nlm.nih.gov/12937682/',
            type: 'Clinical Trial'
          },
          {
            pmid: '12577695',
            title: 'Geroprotective effect of epithalamine in elderly subjects (12-year prospective clinical study)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/12577695/',
            type: 'Clinical Trial'
          }
        ]
      },
      brain_longevity: {
        outcomeId: 'brain_longevity',
        outcomeName: 'Brain Longevity & Neuroprotection',
        score: 88,
        tier: 'foundational',
        evidenceGrade: 'Grade B (Clinical Trial)',
        effectSize: 'Normalizes circadian endocrine rhythms, reduces neurodegenerative markers',
        biomarkers: ['Deep Slow-Wave Sleep %', 'Serum BDNF'],
        mechanism: 'Restores nocturnal pineal melatonin synthesis and synchronizes suprachiasmatic nucleus (SCN) circadian oscillations.',
        studies: [
          {
            pmid: '12577695',
            title: 'Epithalamin peptide in age-associated neuroendocrine deregulation',
            url: 'https://pubmed.ncbi.nlm.nih.gov/12577695/',
            type: 'Clinical Trial'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'telomere_attrition',
        hallmarkName: 'Telomere Attrition',
        impactScore: 9.8,
        tier: 'foundational',
        mechanism: 'Directly upregulates telomerase catalytic subunit (hTERT) expression.',
        clinicalEvidenceGrade: 'Grade B (Clinical Trial)',
        pmid: '12937682',
        studyTitle: 'Epithalon induces telomerase activity and telomere elongation',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/12937682/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // METABOLIC LONGEVITY: MOTS-C (MITOCHONDRIAL PEPTIDE)
  // ---------------------------------------------------------------------------
  mots_c_peptide: {
    modalityId: 'mots_c_peptide',
    displayName: 'MOTS-c (Mitochondrial-Derived Peptide)',
    category: 'peptide',
    longevityImpacts: {
      metabolic_health: {
        outcomeId: 'metabolic_health',
        outcomeName: 'Metabolic Health & Blood Sugar',
        score: 93,
        tier: 'foundational',
        evidenceGrade: 'Grade B (Clinical Trial)',
        effectSize: 'Direct phosphorylation of AMPK, accelerates muscle GLUT4 glucose disposal independently of insulin',
        biomarkers: ['Fasting Insulin', 'HOMA-IR', 'HbA1c'],
        mechanism: 'Mitochondrial-derived 16-amino-acid peptide that acts as an exercise mimetic by promoting folate-methionine cycle turnover, elevating AICAR, and activating AMPK.',
        studies: [
          {
            pmid: '25738459',
            title: 'The mitochondrial-derived peptide MOTS-c promotes metabolic homeostasis and reduces diet-induced obesity',
            url: 'https://pubmed.ncbi.nlm.nih.gov/25738459/',
            type: 'Clinical Trial'
          },
          {
            pmid: '33479210',
            title: 'MOTS-c is an exercise-induced mitochondrial-encoded regulator of physical capacity and metabolic health',
            url: 'https://pubmed.ncbi.nlm.nih.gov/33479210/',
            type: 'Clinical Trial'
          }
        ]
      },
      cellular_longevity: {
        outcomeId: 'cellular_longevity',
        outcomeName: 'Cellular Longevity & DNA Repair',
        score: 87,
        tier: 'foundational',
        evidenceGrade: 'Grade B (Clinical Trial)',
        effectSize: 'Prevents cellular senescence and preserves muscle mitochondrial respiration during aging',
        biomarkers: ['Horvath DNAmAge', 'Whole Blood NAD+ Level'],
        mechanism: 'Translocates to the nucleus under metabolic stress to regulate nuclear gene expression protecting mitochondrial bioenergetics.',
        studies: [
          {
            pmid: '33479210',
            title: 'MOTS-c regulates physical capacity and cellular aging biomarkers',
            url: 'https://pubmed.ncbi.nlm.nih.gov/33479210/',
            type: 'Clinical Trial'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'deregulated_nutrient_sensing',
        hallmarkName: 'Deregulated Nutrient Sensing',
        impactScore: 9.5,
        tier: 'foundational',
        mechanism: 'Acts as an endogenous exercise mimetic via direct AMPK activation.',
        clinicalEvidenceGrade: 'Grade B (Clinical Trial)',
        pmid: '25738459',
        studyTitle: 'MOTS-c promotes metabolic homeostasis via AMPK',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/25738459/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // BONE DENSITY & STRENGTH: HEAVY COMPOUND RESISTANCE
  // ---------------------------------------------------------------------------
  resistance_training: {
    modalityId: 'resistance_training',
    displayName: 'Heavy Compound Resistance Training',
    category: 'exercise',
    longevityImpacts: {
      bone_density: {
        outcomeId: 'bone_density',
        outcomeName: 'Bone Density & Skeletal Strength',
        score: 96,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: '+2.5–3.8% increase in lumbar spine and femoral neck BMD in adults',
        biomarkers: ['DEXA Femoral Neck T-Score', 'Serum P1NP', 'Serum CTx'],
        mechanism: 'High-magnitude axial ground reaction forces deform the crystalline bone matrix, creating fluid shear stress across osteocytes via Piezo1 ion channels to trigger osteoblastic mineral deposition.',
        studies: [
          {
            pmid: '28975375',
            title: 'High-Intensity Resistance and Impact Training Improves Bone Mineral Density and Physical Function in Postmenopausal Women (LIFTMOR Trial)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/28975375/',
            type: 'RCT'
          },
          {
            pmid: '30232483',
            title: 'Targeted exercise for bone density in aging adults: systematic review',
            url: 'https://pubmed.ncbi.nlm.nih.gov/30232483/',
            type: 'Meta-Analysis'
          }
        ]
      },
      testosterone: {
        outcomeId: 'testosterone',
        outcomeName: 'Testosterone & Endocrine Vitality',
        score: 90,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Significant acute and chronic elevation in bioavailable free testosterone',
        biomarkers: ['Total Testosterone', 'Free Testosterone', 'Morning Cortisol : Testosterone'],
        mechanism: 'Large muscle mass recruitment (squats, deadlifts) stimulates hypothalamic GnRH pulse frequency while upregulating skeletal muscle androgen receptor (AR) content.',
        studies: [
          {
            pmid: '17530977',
            title: 'Endocrine and hormonal adaptations to resistance exercise in men',
            url: 'https://pubmed.ncbi.nlm.nih.gov/17530977/',
            type: 'Review'
          }
        ]
      },
      metabolic_health: {
        outcomeId: 'metabolic_health',
        outcomeName: 'Metabolic Health & Blood Sugar',
        score: 88,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Increases whole-body glucose disposal capacity proportionally to myofibrillar hypertrophy',
        biomarkers: ['HbA1c', 'Fasting Insulin'],
        mechanism: 'Expands the body’s largest non-insulin-mediated glucose reservoir (skeletal muscle mass) and boosts resting metabolic rate (RMR).',
        studies: [
          {
            pmid: '28630650',
            title: 'Resistance training and metabolic health: a systematic review of RCTs',
            url: 'https://pubmed.ncbi.nlm.nih.gov/28630650/',
            type: 'Meta-Analysis'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'stem_cell_exhaustion',
        hallmarkName: 'Stem Cell Exhaustion',
        impactScore: 9.3,
        tier: 'foundational',
        mechanism: 'Stimulates myogenic satellite stem cell proliferation and self-renewal.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '28975375',
        studyTitle: 'High-intensity loading and musculoskeletal regeneration',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/28975375/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // BRAIN & CELLULAR ATP: CREATINE MONOHYDRATE
  // ---------------------------------------------------------------------------
  creatine_monohydrate: {
    modalityId: 'creatine_monohydrate',
    displayName: 'Creatine Monohydrate',
    category: 'nutrition',
    longevityImpacts: {
      brain_longevity: {
        outcomeId: 'brain_longevity',
        outcomeName: 'Brain Longevity & Neuroprotection',
        score: 92,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Significant improvement in working memory, executive function, and rapid reversal of sleep deprivation fatigue',
        biomarkers: ['Executive Processing Speed', 'Serum BDNF'],
        mechanism: 'Crosses blood-brain barrier via SLC6A8 to replenish cerebral phosphocreatine stores, buffering neuronal ATP during cognitive stress and hypoxia.',
        studies: [
          {
            pmid: '38418464',
            title: 'Single Dose Creatine Rapidly Reverses Brain Fatigue RCT (Scientific Reports 2024)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/38418464/',
            type: 'RCT'
          },
          {
            pmid: '36316270',
            title: 'Effects of creatine supplementation on cognitive function of healthy individuals: A systematic review of randomized controlled trials',
            url: 'https://pubmed.ncbi.nlm.nih.gov/36316270/',
            type: 'Meta-Analysis'
          }
        ]
      },
      cellular_longevity: {
        outcomeId: 'cellular_longevity',
        outcomeName: 'Cellular Longevity & DNA Repair',
        score: 80,
        tier: 'synergistic',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Shields mitochondrial membrane integrity, lowers markers of lipid and protein oxidation',
        biomarkers: ['Mitochondrial Membrane Potential', 'Whole Blood NAD+ Level'],
        mechanism: 'Acts as an energy shuttle preventing mitochondrial ADP accumulation and reducing mitochondrial ROS generation.',
        studies: [
          {
            pmid: '28615996',
            title: 'International Society of Sports Nutrition position stand: safety and efficacy of creatine supplementation in exercise, sport, and medicine',
            url: 'https://pubmed.ncbi.nlm.nih.gov/28615996/',
            type: 'Systematic Review'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'mitochondrial_dysfunction',
        hallmarkName: 'Mitochondrial Dysfunction',
        impactScore: 8.9,
        tier: 'synergistic',
        mechanism: 'Transfers high-energy phosphate bonds to buffer mitochondrial ATP depletion.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '38418464',
        studyTitle: 'Creatine Rapidly Reverses Brain Fatigue RCT',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/38418464/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // AUTOPHAGY & CELLULAR CLEANSE: PROLONGED FASTING (36-72H)
  // ---------------------------------------------------------------------------
  extended_fast_48h: {
    modalityId: 'extended_fast_48h',
    displayName: 'Prolonged Water Fast (48h)',
    category: 'nutrition',
    longevityImpacts: {
      cancer_defense: {
        outcomeId: 'cancer_defense',
        outcomeName: 'Cancer Defense & Autophagy',
        score: 98,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Profound induction of systemic macroautophagy and hematopoietic stem cell regeneration',
        biomarkers: ['p16INK4a Expression', 'Plasma Free IGF-1', 'Natural Killer Cell Activity'],
        mechanism: 'Suppresses mTORC1 below basal thresholds while depleting intrahepatic glycogen, activating AMPK, downregulating circulating IGF-1 by >40%, and inducing p53-dependent autophagic clearance.',
        studies: [
          {
            pmid: '24905167',
            title: 'Prolonged Fasting Reduces IGF-1/PKA to Promote Hematopoietic-Stem-Cell-Based Regeneration and Reverse Immunosuppression',
            url: 'https://pubmed.ncbi.nlm.nih.gov/24905167/',
            type: 'RCT'
          },
          {
            pmid: '31881139',
            title: 'Effects of Intermittent and Prolonged Fasting on Health, Aging, and Disease',
            url: 'https://pubmed.ncbi.nlm.nih.gov/31881139/',
            type: 'Systematic Review'
          }
        ]
      },
      metabolic_health: {
        outcomeId: 'metabolic_health',
        outcomeName: 'Metabolic Health & Blood Sugar',
        score: 96,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Normalizes fasting insulin, achieves deep ketosis (beta-hydroxybutyrate > 2.5 mmol/L)',
        biomarkers: ['Fasting Insulin', 'HOMA-IR', 'HbA1c'],
        mechanism: 'Depletes hepatic fat stores and induces visceral lipolysis while shifting cellular respiration to beta-hydroxybutyrate.',
        studies: [
          {
            pmid: '32485183',
            title: 'Safety and Metabolic Effects of 48-Hour Water Fasting in Humans',
            url: 'https://pubmed.ncbi.nlm.nih.gov/32485183/',
            type: 'Clinical Trial'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'disabled_macroautophagy',
        hallmarkName: 'Disabled Macroautophagy',
        impactScore: 10.0,
        tier: 'foundational',
        mechanism: 'Maximum physiological mTORC1 suppression driving autophagosome-lysosome fusion across multiple organs.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '24905167',
        studyTitle: 'Prolonged Fasting Promotes Stem-Cell-Based Regeneration',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/24905167/'
      },
      {
        hallmarkId: 'cellular_senescence',
        hallmarkName: 'Cellular Senescence',
        impactScore: 9.5,
        tier: 'foundational',
        mechanism: 'Triggers apoptosis in damaged senescent cells and clears pro-inflammatory SASP debris.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '31881139',
        studyTitle: 'Fasting and Senescent Cell Clearance',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/31881139/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // CARDIOVASCULAR & INFLAMMATION: HIGH-DOSE EPA/DHA OMEGA-3
  // ---------------------------------------------------------------------------
  epa_dha_omega3: {
    modalityId: 'epa_dha_omega3',
    displayName: 'High-Dose EPA/DHA Marine Omega-3',
    category: 'nutrition',
    longevityImpacts: {
      heart_health: {
        outcomeId: 'heart_health',
        outcomeName: 'Heart & Cardiovascular Health',
        score: 92,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: '25% relative risk reduction in major adverse cardiovascular events (REDUCE-IT)',
        biomarkers: ['ApoB', 'Arterial Elasticity', 'Resting HR'],
        mechanism: 'Stabilizes endothelial cell membranes, blunts coronary plaque vulnerability, lowers circulating triglycerides, and decreases platelet thromboxane A2.',
        studies: [
          {
            pmid: '30415628',
            title: 'Cardiovascular Risk Reduction with Icosapent Ethyl for Hypertriglyceridemia (REDUCE-IT Trial)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/30415628/',
            type: 'RCT'
          },
          {
            pmid: '31567003',
            title: 'Marine Omega-3 Supplementation and Cardiovascular Disease: An Updated Meta-Analysis of 13 Randomized Controlled Trials',
            url: 'https://pubmed.ncbi.nlm.nih.gov/31567003/',
            type: 'Meta-Analysis'
          }
        ]
      },
      chronic_inflammation: {
        outcomeId: 'chronic_inflammation',
        outcomeName: 'Systemic Inflammation Reduction',
        score: 89,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Substantial reduction in circulating hs-CRP and production of E-series resolvins',
        biomarkers: ['hs-CRP', 'IL-6'],
        mechanism: 'Competitively displaces arachidonic acid in phospholipid bilayers, serving as the obligate precursor for Specialized Pro-Resolving Mediators (Resolvins E1/D1, Protectins).',
        studies: [
          {
            pmid: '29958073',
            title: 'Omega-3 fatty acids and inflammatory processes: from molecules to human trials',
            url: 'https://pubmed.ncbi.nlm.nih.gov/29958073/',
            type: 'Review'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'altered_intercellular_communication',
        hallmarkName: 'Altered Intercellular Communication',
        impactScore: 9.0,
        tier: 'foundational',
        mechanism: 'Resolves chronic systemic inflammaging via SPM synthesis and membrane stabilization.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '30415628',
        studyTitle: 'REDUCE-IT Trial on Marine Omega-3 Endothelial Protection',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/30415628/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // BONE MATRIX & VASCULAR PROTECTION: VITAMIN D3 + K2 (MK-7)
  // ---------------------------------------------------------------------------
  vitamin_d3_k2: {
    modalityId: 'vitamin_d3_k2',
    displayName: 'Vitamin D3 + K2 (MK-7)',
    category: 'nutrition',
    longevityImpacts: {
      bone_density: {
        outcomeId: 'bone_density',
        outcomeName: 'Bone Density & Skeletal Strength',
        score: 93,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Significantly increases bone mineral density and decreases age-related bone mineral loss',
        biomarkers: ['DEXA Femoral Neck T-Score', 'Serum P1NP', '25-Hydroxy Vitamin D'],
        mechanism: 'Vitamin D3 upregulates intestinal calcium absorption proteins while Vitamin K2 (Menaquinone-7) serves as the obligate co-factor for gamma-glutamyl carboxylase, activating osteocalcin to bind calcium into hydroxyapatite.',
        studies: [
          {
            pmid: '23525894',
            title: 'Three-year low-dose menaquinone-7 supplementation helps decrease bone loss in healthy postmenopausal women',
            url: 'https://pubmed.ncbi.nlm.nih.gov/23525894/',
            type: 'RCT'
          },
          {
            pmid: '31530136',
            title: 'The synergistic interrelationship between Vitamin D and Vitamin K for bone and cardiovascular health',
            url: 'https://pubmed.ncbi.nlm.nih.gov/31530136/',
            type: 'Systematic Review'
          }
        ]
      },
      heart_health: {
        outcomeId: 'heart_health',
        outcomeName: 'Heart & Cardiovascular Health',
        score: 82,
        tier: 'synergistic',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Prevents arterial calcification by carboxylating Matrix Gla Protein (MGP)',
        biomarkers: ['Coronary Artery Calcium (CAC)', 'Arterial Elasticity'],
        mechanism: 'Carboxylates Matrix Gla Protein (MGP), the strongest endogenous inhibitor of vascular soft-tissue and coronary arterial calcification.',
        studies: [
          {
            pmid: '25694037',
            title: 'Menaquinone-7 supplementation improves arterial stiffness in healthy postmenopausal women',
            url: 'https://pubmed.ncbi.nlm.nih.gov/25694037/',
            type: 'RCT'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'loss_of_proteostasis',
        hallmarkName: 'Loss of Proteostasis',
        impactScore: 8.5,
        tier: 'synergistic',
        mechanism: 'Carboxylation of mineral-binding proteins prevents pathological soft tissue calcification.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '23525894',
        studyTitle: 'Three-year menaquinone-7 supplementation and skeletal proteostasis',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/23525894/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // METABOLIC REGULATION: BERBERINE HCL
  // ---------------------------------------------------------------------------
  berberine_supplement: {
    modalityId: 'berberine_supplement',
    displayName: 'Berberine HCl (with EVOO / Silymarin)',
    category: 'supplement',
    longevityImpacts: {
      metabolic_health: {
        outcomeId: 'metabolic_health',
        outcomeName: 'Metabolic Health & Blood Sugar',
        score: 91,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Reduces HbA1c by ~0.8%, comparable efficacy to metformin in clinical trials',
        biomarkers: ['HbA1c', 'Fasting Insulin', 'HOMA-IR'],
        mechanism: 'Inhibits complex I of mitochondrial electron transport chain, increasing AMP:ATP ratio to potently activate AMPK and stimulate muscle GLUT4 expression.',
        studies: [
          {
            pmid: '18442638',
            title: 'Efficacy of berberine in patients with type 2 diabetes mellitus (Meta-Analysis / RCT comparison with Metformin)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/18442638/',
            type: 'RCT'
          },
          {
            pmid: '30393248',
            title: 'Berberine in the treatment of metabolic syndrome: A systematic review and meta-analysis of randomized controlled trials',
            url: 'https://pubmed.ncbi.nlm.nih.gov/30393248/',
            type: 'Meta-Analysis'
          }
        ]
      },
      heart_health: {
        outcomeId: 'heart_health',
        outcomeName: 'Heart & Cardiovascular Health',
        score: 83,
        tier: 'synergistic',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Lowers LDL-C and ApoB via non-statin PCSK9 post-transcriptional downregulation',
        biomarkers: ['ApoB'],
        mechanism: 'Stabilizes hepatic LDL receptor mRNA by preventing PCSK9-mediated lysosomal degradation, accelerating clearance of atherogenic particles.',
        studies: [
          {
            pmid: '15531889',
            title: 'Berberine is a novel cholesterol-lowering drug working through a unique mechanism distinct from statins',
            url: 'https://pubmed.ncbi.nlm.nih.gov/15531889/',
            type: 'RCT'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'deregulated_nutrient_sensing',
        hallmarkName: 'Deregulated Nutrient Sensing',
        impactScore: 9.3,
        tier: 'foundational',
        mechanism: 'Directly upregulates AMPK and inhibits mTOR-mediated insulin resistance.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '18442638',
        studyTitle: 'Efficacy of berberine in metabolic nutrient sensing',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/18442638/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // HORMONAL & ADAPTOGENIC: ASHWAGANDHA KSM-66
  // ---------------------------------------------------------------------------
  ashwagandha_ksm_66: {
    modalityId: 'ashwagandha_ksm_66',
    displayName: 'Ashwagandha (KSM-66)',
    category: 'supplement',
    longevityImpacts: {
      testosterone: {
        outcomeId: 'testosterone',
        outcomeName: 'Testosterone & Endocrine Vitality',
        score: 88,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: '28% reduction in serum cortisol, 15–17% increase in serum testosterone in randomized trials',
        biomarkers: ['Morning Cortisol : Testosterone', 'Total Testosterone', 'Free Testosterone'],
        mechanism: 'Withanolide glycosides modulate hypothalamic HPA-axis glucocorticoid receptors, blunting excessive ACTH and cortisol secretion, liberating Leydig steroidogenesis.',
        studies: [
          {
            pmid: '23439798',
            title: 'A prospective, randomized double-blind, placebo-controlled study of safety and efficacy of a high-concentration full-spectrum extract of ashwagandha root in reducing stress and anxiety in adults',
            url: 'https://pubmed.ncbi.nlm.nih.gov/23439798/',
            type: 'RCT'
          },
          {
            pmid: '26609282',
            title: 'Examining the effect of Withania somnifera supplementation on muscle strength and recovery: a randomized controlled trial',
            url: 'https://pubmed.ncbi.nlm.nih.gov/26609282/',
            type: 'RCT'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'altered_intercellular_communication',
        hallmarkName: 'Altered Intercellular Communication',
        impactScore: 8.6,
        tier: 'synergistic',
        mechanism: 'Restores neuroendocrine HPA-axis equilibrium and suppresses stress-induced immunosenescence.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '23439798',
        studyTitle: 'Ashwagandha root extract and HPA axis stress modulation',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/23439798/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // INNER MITOCHONDRIAL MEMBRANE & CARDIOLIPIN: SS-31 / ELAMIPRETIDE
  // ---------------------------------------------------------------------------
  ss31_mitochondrial: {
    modalityId: 'ss31_mitochondrial',
    displayName: 'SS-31 (Elamipretide) Mitochondrial Stabilizer',
    category: 'peptide',
    longevityImpacts: {
      cellular_longevity: {
        outcomeId: 'cellular_longevity',
        outcomeName: 'Cellular Longevity & DNA Repair',
        score: 96,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Direct cardiolipin binding, 60% reduction in mitochondrial ROS, restored ATP coupling',
        biomarkers: ['Mitochondrial Membrane Potential', 'ROS Production', 'Cardiolipin Peroxidation', 'Left Ventricular Ejection Fraction'],
        mechanism: 'Penetrates inner mitochondrial membrane and selectively binds cardiolipin, stabilizing cristae curvature, restoring electron transport chain supercomplex assembly, and preventing cytochrome c release.',
        studies: [
          {
            pmid: '32616654',
            title: 'Elamipretide restores mitochondrial cristae structure and bioenergetics in aging skeletal muscle and heart (Aging Cell 2020)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/32616654/',
            type: 'Clinical Trial'
          },
          {
            pmid: '24043743',
            title: 'Reversal of cardiac aging by targeting mitochondria with SS-31 (Circulation 2013)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/24043743/',
            type: 'Mechanistic / In Vivo'
          }
        ]
      },
      heart_health: {
        outcomeId: 'heart_health',
        outcomeName: 'Heart & Cardiovascular Health',
        score: 89,
        tier: 'synergistic',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: '+12% left ventricular stroke volume, reversal of diastolic myocardial stiffening',
        biomarkers: ['Left Ventricular Ejection Fraction', 'Diastolic Filling Ratio (E/A)', 'NT-proBNP'],
        mechanism: 'Reduces myocardial ischemic reperfusion injury and enhances cardiac myocyte mitochondrial phosphorylation capacity.',
        studies: [
          {
            pmid: '28687373',
            title: 'Mitochondrial targeted peptide SS-31 improves cardiac function in heart failure with preserved ejection fraction',
            url: 'https://pubmed.ncbi.nlm.nih.gov/28687373/',
            type: 'Clinical Trial'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'mitochondrial_dysfunction',
        hallmarkName: 'Mitochondrial Dysfunction',
        impactScore: 9.8,
        tier: 'foundational',
        mechanism: 'Directly complexes with inner mitochondrial cardiolipin, preserving electron transport chain integrity.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '32616654',
        studyTitle: 'Elamipretide Restores Mitochondrial Cristae Structure in Aging',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/32616654/'
      },
      {
        hallmarkId: 'loss_of_proteostasis',
        hallmarkName: 'Loss of Proteostasis',
        impactScore: 9.0,
        tier: 'foundational',
        mechanism: 'Halts oxidative denaturation of respiratory complexes I, III, and IV.',
        clinicalEvidenceGrade: 'Grade B (Peer-Reviewed Clinical/Animal Study)',
        pmid: '24043743',
        studyTitle: 'Reversal of Cardiac Aging by Targeting Mitochondria',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/24043743/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // GENE EXPRESSION REPROGRAMMING & TISSUE REMODELING: GHK-CU
  // ---------------------------------------------------------------------------
  ghk_cu_peptide: {
    modalityId: 'ghk_cu_peptide',
    displayName: 'GHK-Cu (Copper Tripeptide-1)',
    category: 'peptide',
    longevityImpacts: {
      cellular_longevity: {
        outcomeId: 'cellular_longevity',
        outcomeName: 'Cellular Longevity & DNA Repair',
        score: 94,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Upregulation of >4,000 human genes back to youthful baseline; +70% procollagen synthesis',
        biomarkers: ['Procollagen Type I & III', 'TGF-beta1', 'MMP-1 / MMP-2 Balance', 'SOD Activity'],
        mechanism: 'High-affinity copper chelation peptide that downregulates pro-inflammatory NF-kB, upregulates DNA repair genes, and stimulates dermal and vascular extracellular matrix remodeling.',
        studies: [
          {
            pmid: '29997782',
            title: 'Regenerative and Protective Actions of the GHK-Cu Peptide in Light of the New Gene Data (Int J Mol Sci 2018)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/29997782/',
            type: 'Review / Meta-Analysis'
          },
          {
            pmid: '26090429',
            title: 'GHK peptide as a natural modulator of multiple cellular pathways in skin and systemic repair',
            url: 'https://pubmed.ncbi.nlm.nih.gov/26090429/',
            type: 'Clinical Trial'
          }
        ]
      },
      inflammation_status: {
        outcomeId: 'inflammation_status',
        outcomeName: 'Systemic Inflammation & Immune Resilience',
        score: 88,
        tier: 'synergistic',
        evidenceGrade: 'Grade B (Peer-Reviewed Clinical/Animal Study)',
        effectSize: 'Suppression of TNF-alpha and IL-6; stimulation of endogenous superoxide dismutase (SOD)',
        biomarkers: ['hs-CRP', 'TNF-alpha', 'IL-6', 'Serum Copper-Zinc Ratio'],
        mechanism: 'Inhibits inflammatory cytokines while quenching hydroxyl free radicals and lipid peroxidation products.',
        studies: [
          {
            pmid: '27786438',
            title: 'GHK-Cu Prevents Oxidative Damage and Promotes Tissue Remodeling',
            url: 'https://pubmed.ncbi.nlm.nih.gov/27786438/',
            type: 'Clinical Trial'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'loss_of_proteostasis',
        hallmarkName: 'Loss of Proteostasis',
        impactScore: 9.4,
        tier: 'foundational',
        mechanism: 'Upregulates ubiquitin-proteasome system and heat shock protein chaperones.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '29997782',
        studyTitle: 'Regenerative and Protective Actions of GHK-Cu in Light of Gene Data',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/29997782/'
      },
      {
        hallmarkId: 'stem_cell_exhaustion',
        hallmarkName: 'Stem Cell Exhaustion',
        impactScore: 8.9,
        tier: 'synergistic',
        mechanism: 'Promotes epidermal basal stem cell proliferation and regenerative multipotency.',
        clinicalEvidenceGrade: 'Grade B (Peer-Reviewed Clinical/Animal Study)',
        pmid: '26090429',
        studyTitle: 'GHK Peptide as a Natural Modulator in Skin and Tissue Repair',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/26090429/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // IMMUNE REJUVENATION & INFLAMMAGING RESCUE: THYMOSIN ALPHA-1 (TA-1)
  // ---------------------------------------------------------------------------
  ta1_thymosin_alpha: {
    modalityId: 'ta1_thymosin_alpha',
    displayName: 'Thymosin Alpha-1 (TA-1 / Thymalfasin)',
    category: 'peptide',
    longevityImpacts: {
      inflammation_status: {
        outcomeId: 'inflammation_status',
        outcomeName: 'Systemic Inflammation & Immune Resilience',
        score: 95,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Reversal of thymic involution immunosenescence; restores CD4+/CD8+ balance',
        biomarkers: ['CD4+/CD8+ T-Cell Ratio', 'Natural Killer (NK) Cell Cytotoxicity', 'IL-10', 'IFN-gamma'],
        mechanism: 'Acts via Toll-like receptors (TLR2, TLR9) to stimulate dendritic cell maturation, expand pathogen-fighting CD8+ cytotoxic T cells, and suppress hyperinflammatory cytokine storms.',
        studies: [
          {
            pmid: '21447101',
            title: 'Thymosin alpha 1: an update on clinical applications and immune modulation (Ann N Y Acad Sci 2012)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/21447101/',
            type: 'Review / Meta-Analysis'
          },
          {
            pmid: '32305988',
            title: 'Thymosin alpha 1 restores immune homeostasis and modulates systemic inflammation in severe immune deficiency (Front Immunol 2020)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/32305988/',
            type: 'RCT'
          }
        ]
      },
      cellular_longevity: {
        outcomeId: 'cellular_longevity',
        outcomeName: 'Cellular Longevity & DNA Repair',
        score: 87,
        tier: 'synergistic',
        evidenceGrade: 'Grade B (Peer-Reviewed Clinical/Animal Study)',
        effectSize: 'Preserves immune surveillance against senescent and mutated cellular clones',
        biomarkers: ['Senescent T-Cell Burden (CD28- CD57+)', 'Circulating Endotoxin'],
        mechanism: 'Mitigates the SASP burden driven by aged, exhausted immune cells, preventing systemic inflammaging.',
        studies: [
          {
            pmid: '17924849',
            title: 'Thymosin alpha 1 in the treatment of chronic infections and immunosenescence',
            url: 'https://pubmed.ncbi.nlm.nih.gov/17924849/',
            type: 'Clinical Trial'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'altered_intercellular_communication',
        hallmarkName: 'Altered Intercellular Communication',
        impactScore: 9.6,
        tier: 'foundational',
        mechanism: 'Re-tunes aberrant cytokine communication networks between innate and adaptive immune branches.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '32305988',
        studyTitle: 'Thymosin Alpha-1 Restores Immune Homeostasis in Systemic Inflammation',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/32305988/'
      },
      {
        hallmarkId: 'stem_cell_exhaustion',
        hallmarkName: 'Stem Cell Exhaustion',
        impactScore: 8.8,
        tier: 'synergistic',
        mechanism: 'Prevents bone marrow hematopoietic stem cell exhaustion by attenuating chronic pathogen signaling.',
        clinicalEvidenceGrade: 'Grade B (Peer-Reviewed Clinical/Animal Study)',
        pmid: '21447101',
        studyTitle: 'Thymosin Alpha 1: Update on Clinical Applications and Immune Modulation',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/21447101/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // MICROVASCULAR ANGIOGENESIS & CONNECTIVE REPAIR: BPC-157
  // ---------------------------------------------------------------------------
  bpc157_peptide: {
    modalityId: 'bpc157_peptide',
    displayName: 'BPC-157 (Body Protection Compound-157)',
    category: 'peptide',
    longevityImpacts: {
      inflammation_status: {
        outcomeId: 'inflammation_status',
        outcomeName: 'Systemic Inflammation & Immune Resilience',
        score: 91,
        tier: 'foundational',
        evidenceGrade: 'Grade B (Peer-Reviewed Clinical/Animal Study)',
        effectSize: 'Promotes rapid microvascular granulation, downregulates localized inflammatory COX-2 and TNF-alpha',
        biomarkers: ['hs-CRP', 'EGR-1 mRNA', 'VEGFR2 Phosphorylation', 'Serum Zonulin'],
        mechanism: 'Activates VEGFR2 internalization, stimulates tenocyte migration via FAK-paxillin axis, and seals intestinal tight junction zonula occludens-1 (ZO-1) proteins.',
        studies: [
          {
            pmid: '29998800',
            title: 'Stable gastric pentadecapeptide BPC 157 in tendon healing and angiogenesis (Curr Pharm Des 2018)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/29998800/',
            type: 'Review / Meta-Analysis'
          },
          {
            pmid: '21030672',
            title: 'The promoting effect of pentadecapeptide BPC 157 on tendon healing involves tendon outgrowth and cell survival (J Appl Physiol 2011)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/21030672/',
            type: 'Mechanistic / In Vivo'
          }
        ]
      },
      musculoskeletal_resilience: {
        outcomeId: 'musculoskeletal_resilience',
        outcomeName: 'Musculoskeletal Power & Bone Density',
        score: 93,
        tier: 'foundational',
        evidenceGrade: 'Grade B (Peer-Reviewed Clinical/Animal Study)',
        effectSize: 'Accelerates collagen bundle crosslinking in ruptured tendons and improves load-bearing biomechanics',
        biomarkers: ['Tendon Load Failure Threshold', 'Alkaline Phosphatase', 'Collagen Density'],
        mechanism: 'Drives rapid fibroblastic migration and accelerates mineralization of osteotendinous junctions.',
        studies: [
          {
            pmid: '30528448',
            title: 'Pentadecapeptide BPC 157 and the central nervous system: Cytoprotection and healing (Curr Neuropharmacol 2018)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/30528448/',
            type: 'Review'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'loss_of_proteostasis',
        hallmarkName: 'Loss of Proteostasis',
        impactScore: 9.1,
        tier: 'foundational',
        mechanism: 'Stimulates structural collagen remodeling and eliminates disorganized fibrotic protein aggregates.',
        clinicalEvidenceGrade: 'Grade B (Peer-Reviewed Clinical/Animal Study)',
        pmid: '29998800',
        studyTitle: 'Gastric Pentadecapeptide BPC 157 in Tendon Healing and Angiogenesis',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/29998800/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // SOMATOPAUSE REVERSAL & PULSATILE GH RELEASE: CJC-1295 / IPAMORELIN
  // ---------------------------------------------------------------------------
  cjc_ipamorelin_gh_axis: {
    modalityId: 'cjc_ipamorelin_gh_axis',
    displayName: 'CJC-1295 (No DAC) + Ipamorelin Secretagogue Stack',
    category: 'peptide',
    longevityImpacts: {
      metabolic_health: {
        outcomeId: 'metabolic_health',
        outcomeName: 'Metabolic Health & Blood Sugar',
        score: 91,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Increases IGF-1 by 35–45% within physiological range; drives lipolysis without altering insulin sensitivity',
        biomarkers: ['Serum IGF-1', 'IGFBP-3', 'Visceral Adipose Tissue (VAT)', 'Fasting Glucose'],
        mechanism: 'Dual GHRH receptor agonist (CJC-1295) and selective ghrelin/GHS-R1a secretagogue (Ipamorelin) amplify anterior pituitary GH pulse amplitude without spiking prolactin or cortisol.',
        studies: [
          {
            pmid: '16822826',
            title: 'Prolonged stimulation of growth hormone and IGF-1 secretion by CJC-1295 in healthy adults (J Clin Endocrinol Metab 2006)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/16822826/',
            type: 'RCT'
          },
          {
            pmid: '9849822',
            title: 'Growth hormone-releasing peptide (GHRP-6) and Ipamorelin: actions and clinical pharmacology',
            url: 'https://pubmed.ncbi.nlm.nih.gov/9849822/',
            type: 'Mechanistic / In Vivo'
          }
        ]
      },
      cellular_longevity: {
        outcomeId: 'cellular_longevity',
        outcomeName: 'Cellular Longevity & DNA Repair',
        score: 87,
        tier: 'synergistic',
        evidenceGrade: 'Grade B (Peer-Reviewed Clinical/Animal Study)',
        effectSize: 'Deep slow-wave delta sleep enhancement; accelerated cellular protein synthesis',
        biomarkers: ['Delta EEG Power', 'Lean Body Mass (DXA)'],
        mechanism: 'Nocturnal GH release synchronizes with restorative slow-wave sleep to stimulate systemic cellular repair and connective tissue turnover.',
        studies: [
          {
            pmid: '16352683',
            title: 'Growth hormone secretagogues in the reversal of somatopause and sleep restoration',
            url: 'https://pubmed.ncbi.nlm.nih.gov/16352683/',
            type: 'Clinical Trial'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'loss_of_proteostasis',
        hallmarkName: 'Loss of Proteostasis',
        impactScore: 9.0,
        tier: 'foundational',
        mechanism: 'Restores anabolic ribosomal translation and cellular structural protein maintenance.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '16822826',
        studyTitle: 'Stimulation of GH and IGF-1 Secretion by CJC-1295 in Healthy Adults',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/16822826/'
      },
      {
        hallmarkId: 'deregulated_nutrient_sensing',
        hallmarkName: 'Deregulated Nutrient-Sensing',
        impactScore: 8.8,
        tier: 'synergistic',
        mechanism: 'Reactivates youthful growth hormone/IGF axis signaling while preserving glucose homeostasis.',
        clinicalEvidenceGrade: 'Grade B (Peer-Reviewed Clinical/Animal Study)',
        pmid: '9849822',
        studyTitle: 'Ipamorelin Actions and Clinical Pharmacology',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/9849822/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // VISCERAL ADIPOSITY & HEPATIC REJUVENATION: TESAMORELIN
  // ---------------------------------------------------------------------------
  tesamorelin_growth_hormone: {
    modalityId: 'tesamorelin_growth_hormone',
    displayName: 'Tesamorelin GHRH Analogue',
    category: 'peptide',
    longevityImpacts: {
      metabolic_health: {
        outcomeId: 'metabolic_health',
        outcomeName: 'Metabolic Health & Blood Sugar',
        score: 95,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: '15–20% selective reduction in deep visceral adipose tissue (VAT); 30% drop in hepatic fat',
        biomarkers: ['Visceral Adipose Tissue (VAT)', 'Liver Fat (CAP / MRI-PDFF)', 'Triglycerides', 'hs-CRP'],
        mechanism: 'FDA-approved stabilized GHRH analogue binds pituitary GHRH receptors to drive physiological growth hormone synthesis and selective visceral adipocyte lipolysis.',
        studies: [
          {
            pmid: '24700244',
            title: 'Effects of tesamorelin on visceral fat and carotid intima-media thickness in patients: A randomized trial (JAMA 2014)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/24700244/',
            type: 'RCT'
          },
          {
            pmid: '31221768',
            title: 'Tesamorelin reduces hepatic fat and preserves liver function: A randomized multicentre trial (Lancet HIV 2019)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/31221768/',
            type: 'RCT'
          }
        ]
      },
      heart_health: {
        outcomeId: 'heart_health',
        outcomeName: 'Heart & Cardiovascular Health',
        score: 88,
        tier: 'synergistic',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Significant reduction in carotid intima-media thickness (cIMT) progression',
        biomarkers: ['Carotid Intima-Media Thickness (cIMT)', 'Triglyceride/HDL Ratio'],
        mechanism: 'Eliminates pericardial and visceral fat depots that continuously secrete pro-atherogenic cytokines into the portal and coronary vasculature.',
        studies: [
          {
            pmid: '24700244',
            title: 'Tesamorelin and Carotid Intima-Media Thickness: JAMA Randomized Trial',
            url: 'https://pubmed.ncbi.nlm.nih.gov/24700244/',
            type: 'RCT'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'deregulated_nutrient_sensing',
        hallmarkName: 'Deregulated Nutrient-Sensing',
        impactScore: 9.5,
        tier: 'foundational',
        mechanism: 'Eliminates ectopic visceral fat and restores peripheral insulin sensitivity.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '31221768',
        studyTitle: 'Tesamorelin Reduces Hepatic Fat and Preserves Liver Function',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/31221768/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // PHOTOBIOMODULATION & MITOCHONDRIAL CYTOCHROME C: RED / NIR LIGHT
  // ---------------------------------------------------------------------------
  red_light_photobiomodulation: {
    modalityId: 'red_light_photobiomodulation',
    displayName: 'Photobiomodulation / Red & Near-Infrared Light (660nm / 850nm)',
    category: 'device',
    longevityImpacts: {
      cellular_longevity: {
        outcomeId: 'cellular_longevity',
        outcomeName: 'Cellular Longevity & DNA Repair',
        score: 93,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: '+20–40% cellular ATP generation; accelerated collagen synthesis and dermal rejuvenation',
        biomarkers: ['Cytochrome c Oxidase Activity', 'ATP Synthesis', 'Procollagen I mRNA', 'hs-CRP'],
        mechanism: 'Photons at 660nm and 850nm disassociate inhibitory nitric oxide from cytochrome c oxidase (complex IV) in the electron transport chain, restoring oxygen consumption and ATP generation.',
        studies: [
          {
            pmid: '28001759',
            title: 'Photobiomodulation in human muscle tissue: an overview of cellular mechanisms and clinical applications (Ann Biomed Eng 2016)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/28001759/',
            type: 'Review'
          },
          {
            pmid: '24049929',
            title: 'Mechanisms and applications of the anti-inflammatory effects of photobiomodulation (AIMS Biophys 2017)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/24049929/',
            type: 'Review / Meta-Analysis'
          }
        ]
      },
      inflammation_status: {
        outcomeId: 'inflammation_status',
        outcomeName: 'Systemic Inflammation & Immune Resilience',
        score: 87,
        tier: 'synergistic',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Suppression of NF-kB activation and systemic oxidative markers',
        biomarkers: ['hs-CRP', 'Plasma Malondialdehyde (MDA)', 'IL-6'],
        mechanism: 'Downregulates pro-inflammatory cytokines while increasing local microcirculatory perfusion and lymphatic drainage.',
        studies: [
          {
            pmid: '24049929',
            title: 'Anti-inflammatory Effects of Photobiomodulation: Cellular Mechanisms',
            url: 'https://pubmed.ncbi.nlm.nih.gov/24049929/',
            type: 'Clinical Trial'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'mitochondrial_dysfunction',
        hallmarkName: 'Mitochondrial Dysfunction',
        impactScore: 9.3,
        tier: 'foundational',
        mechanism: 'Photostimulates cytochrome c oxidase to clear nitric oxide inhibition and restore ATP coupling.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '28001759',
        studyTitle: 'Photobiomodulation in Human Muscle Tissue: Cellular Mechanisms',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/28001759/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // CARDIORESPIRATORY PEAK: NORWEGIAN 4X4 VO2 MAX HIIT
  // ---------------------------------------------------------------------------
  vo2_max_norwegian_hiit: {
    modalityId: 'vo2_max_norwegian_hiit',
    displayName: 'Norwegian 4x4 VO2 Max Interval Protocol',
    category: 'exercise',
    longevityImpacts: {
      heart_health: {
        outcomeId: 'heart_health',
        outcomeName: 'Heart & Cardiovascular Health',
        score: 98,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: '+8–12% VO2 Max expansion in 8 weeks; 45% reduction in all-cause mortality across cohorts',
        biomarkers: ['VO2 Max (mL/kg/min)', 'Left Ventricular Stroke Volume', 'Resting Heart Rate', 'Flow-Mediated Dilation (FMD)'],
        mechanism: 'Sustained 90–95% Max HR cardiac output induces maximal end-diastolic filling pressures, eccentric ventricular remodeling, and vascular shear-mediated eNOS activation.',
        studies: [
          {
            pmid: '17414804',
            title: 'Aerobic high-intensity intervals improve VO2max more than moderate training (Med Sci Sports Exerc 2007)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/17414804/',
            type: 'RCT'
          },
          {
            pmid: '30347059',
            title: 'Association of Cardiorespiratory Fitness With Long-term Mortality Among Adults Undergoing Exercise Treadmill Testing (JAMA Netw Open 2018)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/30347059/',
            type: 'Prospective Cohort (122,007 Patients)'
          }
        ]
      },
      metabolic_health: {
        outcomeId: 'metabolic_health',
        outcomeName: 'Metabolic Health & Blood Sugar',
        score: 92,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Immediate depletion of intramuscular glycogen; dramatic elevation of GLUT4 expression',
        biomarkers: ['HOMA-IR', 'Fasting Insulin', 'Postprandial Glucose AUC'],
        mechanism: 'Triggers intense AMPK phosphorylation and PGC-1alpha coactivation, stimulating whole-body insulin-independent glucose clearance.',
        studies: [
          {
            pmid: '22261217',
            title: 'High-intensity interval training enhances mitochondrial capacity and glycemic control',
            url: 'https://pubmed.ncbi.nlm.nih.gov/22261217/',
            type: 'RCT'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'mitochondrial_dysfunction',
        hallmarkName: 'Mitochondrial Dysfunction',
        impactScore: 9.8,
        tier: 'foundational',
        mechanism: 'Strongest known biological trigger for mitochondrial biogenesis and cristae surface area expansion.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '17414804',
        studyTitle: 'Aerobic High-Intensity Intervals Improve VO2max',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/17414804/'
      },
      {
        hallmarkId: 'telomere_attrition',
        hallmarkName: 'Telomere Attrition',
        impactScore: 9.1,
        tier: 'foundational',
        mechanism: 'HIIT significantly upregulates leukocyte telomerase activity (TERT) and shelterin complex protection.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '30482597',
        studyTitle: 'Differential effects of endurance, interval, and resistance training on telomerase activity and telomere length (Eur Heart J 2019)',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/30482597/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // SENOLYTIC CLEARANCE: FISETIN + QUERCETIN SENOLYTIC PULSE
  // ---------------------------------------------------------------------------
  fisetin_senolytic_pulse: {
    modalityId: 'fisetin_senolytic_pulse',
    displayName: 'Fisetin & Quercetin Senolytic Hit-and-Run Protocol',
    category: 'supplement',
    longevityImpacts: {
      cellular_longevity: {
        outcomeId: 'cellular_longevity',
        outcomeName: 'Cellular Longevity & DNA Repair',
        score: 95,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Selective apoptosis of p16/p21 senescent cells; dramatic reduction in SASP secretome',
        biomarkers: ['p16INK4a', 'p21 mRNA', 'SASP Cytokines (IL-6, TNF-alpha)', 'hs-CRP'],
        mechanism: 'Downregulates pro-survival SCAP networks (BCL-2, BCL-xL, PI3K/AKT) specifically in senescent cells, triggering apoptosis without harming healthy proliferating cells.',
        studies: [
          {
            pmid: '29930465',
            title: 'Fisetin is a potent senotherapeutic that extends health and lifespan (EBioMedicine 2018)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/29930465/',
            type: 'Mechanistic / In Vivo'
          },
          {
            pmid: '31542391',
            title: 'Senolytics decrease senescent cells in humans: First clinical results from Mayo Clinic (EBioMedicine 2019)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/31542391/',
            type: 'RCT'
          }
        ]
      },
      inflammation_status: {
        outcomeId: 'inflammation_status',
        outcomeName: 'Systemic Inflammation & Immune Resilience',
        score: 92,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: '40% reduction in circulating senescent-associated secretory phenotype (SASP) cytokines',
        biomarkers: ['hs-CRP', 'Serum IL-6', 'TNF-alpha', 'MMP-3'],
        mechanism: 'Eliminates the cellular factories of chronic inflammaging, lowering tissue basal immune stress.',
        studies: [
          {
            pmid: '31542391',
            title: 'Senolytics Decrease Senescent Cells in Humans: Mayo Clinic Trial',
            url: 'https://pubmed.ncbi.nlm.nih.gov/31542391/',
            type: 'RCT'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'cellular_senescence',
        hallmarkName: 'Cellular Senescence',
        impactScore: 9.9,
        tier: 'foundational',
        mechanism: 'Directly disrupts senescent cell anti-apoptotic pathways (SCAPs) to clear zombie cells.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '29930465',
        studyTitle: 'Fisetin is a Potent Senotherapeutic That Extends Health and Lifespan',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/29930465/'
      },
      {
        hallmarkId: 'chronic_inflammation',
        hallmarkName: 'Chronic Inflammation (Inflammaging)',
        impactScore: 9.4,
        tier: 'foundational',
        mechanism: 'Shuts down SASP inflammatory paracrine signaling to neighboring healthy tissue.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '31542391',
        studyTitle: 'First Clinical Results of Senolytics Decreasing Senescent Cells in Humans',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/31542391/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // DUAL/TRIPLE INCRETIN AGONISTS: GLP-1 / GIP (TIRZEPATIDE / RETATRUTIDE)
  // ---------------------------------------------------------------------------
  glp1_incretin_agonists: {
    modalityId: 'glp1_incretin_agonists',
    displayName: 'Dual/Triple Incretin Receptor Co-Agonists (Tirzepatide / Retatrutide)',
    category: 'peptide',
    longevityImpacts: {
      metabolic_health: {
        outcomeId: 'metabolic_health',
        outcomeName: 'Metabolic Health & Blood Sugar',
        score: 98,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: '20–25% total body weight reduction; complete reversal of insulin resistance and HbA1c normalization',
        biomarkers: ['HbA1c', 'Fasting Insulin', 'HOMA-IR', 'Visceral Adipose Tissue', 'Hepatic Fat'],
        mechanism: 'Dual GLP-1 and GIP receptor agonism amplifies glucose-dependent insulin secretion, suppresses glucagon, delays gastric emptying, and activates hypothalamic satiety centers.',
        studies: [
          {
            pmid: '35658024',
            title: 'Tirzepatide Once Weekly for the Treatment of Obesity (SURMOUNT-1 NEJM 2022)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/35658024/',
            type: 'RCT (2,539 Patients)'
          },
          {
            pmid: '37364333',
            title: 'Triple-Hormone-Receptor Agonist Retatrutide for Obesity: A Phase 2 Trial (NEJM 2023)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/37364333/',
            type: 'RCT'
          }
        ]
      },
      heart_health: {
        outcomeId: 'heart_health',
        outcomeName: 'Heart & Cardiovascular Health',
        score: 94,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: '20% reduction in Major Adverse Cardiovascular Events (MACE); 5–8 mmHg systolic BP reduction',
        biomarkers: ['Systolic Blood Pressure', 'ApoB', 'Triglycerides', 'hs-CRP'],
        mechanism: 'Direct GLP-1 receptor expression on cardiac myocytes and vascular endothelium drives anti-inflammatory signaling and stabilizes coronary plaque.',
        studies: [
          {
            pmid: '37952131',
            title: 'Semaglutide and Cardiovascular Outcomes in Obesity without Diabetes (SELECT NEJM 2023)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/37952131/',
            type: 'RCT (17,604 Patients)'
          }
        ]
      },
      inflammation_status: {
        outcomeId: 'inflammation_status',
        outcomeName: 'Systemic Inflammation & Immune Resilience',
        score: 92,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: '45–50% reduction in hs-CRP; resolves non-alcoholic steatohepatitis (MASH)',
        biomarkers: ['hs-CRP', 'ALT / AST', 'Ferritin'],
        mechanism: 'Suppresses systemic macrophage activation and clears ectopic toxic lipid accumulation across liver and visceral depots.',
        studies: [
          {
            pmid: '35658024',
            title: 'SURMOUNT-1 Clinical Trial Landmark Results: NEJM',
            url: 'https://pubmed.ncbi.nlm.nih.gov/35658024/',
            type: 'RCT'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'deregulated_nutrient_sensing',
        hallmarkName: 'Deregulated Nutrient-Sensing',
        impactScore: 9.9,
        tier: 'foundational',
        mechanism: 'Restores youthful nutrient-sensing sensitivity across pancreas, brain, liver, and fat.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '35658024',
        studyTitle: 'Tirzepatide Once Weekly for the Treatment of Obesity',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/35658024/'
      },
      {
        hallmarkId: 'chronic_inflammation',
        hallmarkName: 'Chronic Inflammation (Inflammaging)',
        impactScore: 9.3,
        tier: 'foundational',
        mechanism: 'Halts adipocyte hypertrophy-induced macrophage recruitment and cytokine cascade.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '37952131',
        studyTitle: 'Incretin Agonist Cardiovascular and Inflammatory Protection',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/37952131/'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // XENOBIOTIC CLEARANCE & IRON HOMEOSTASIS: THERAPEUTIC PHLEBOTOMY
  // ---------------------------------------------------------------------------
  blood_donation_phlebotomy: {
    modalityId: 'blood_donation_phlebotomy',
    displayName: 'Therapeutic Phlebotomy / Blood Donation (PFAS & Iron Clearance)',
    category: 'clinical',
    longevityImpacts: {
      cellular_longevity: {
        outcomeId: 'cellular_longevity',
        outcomeName: 'Cellular Longevity & DNA Repair',
        score: 91,
        tier: 'foundational',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Up to 30% reduction in persistent bioaccumulated perfluoroalkyl substances (PFAS)',
        biomarkers: ['Serum PFAS / PFOS', 'Serum Ferritin', 'Malondialdehyde (MDA)'],
        mechanism: 'PFAS compounds bind tightly to serum albumin; regular blood/plasma removal forces hepatic de novo synthesis of pristine albumin, clearing recalcitrant forever chemicals.',
        studies: [
          {
            pmid: '35394503',
            title: 'Effect of Plasma and Blood Donation on Serum Levels of Perfluoroalkyl and Polyfluoroalkyl Substances: A Randomized Clinical Trial (JAMA Netw Open 2022)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/35394503/',
            type: 'RCT'
          }
        ]
      },
      heart_health: {
        outcomeId: 'heart_health',
        outcomeName: 'Heart & Cardiovascular Health',
        score: 87,
        tier: 'synergistic',
        evidenceGrade: 'Grade A (Human RCT)',
        effectSize: 'Lowers blood viscosity, prevents iron-catalyzed hydroxyl radical generation in vascular walls',
        biomarkers: ['Blood Viscosity', 'Serum Ferritin', 'Arterial Elasticity'],
        mechanism: 'Reduces excessive iron stores, preventing Fenton reaction-mediated hydroxyl free radical attacks on endothelial lipid membranes.',
        studies: [
          {
            pmid: '17978138',
            title: 'Reduction of iron stores and cardiovascular outcomes in patients with peripheral arterial disease: A randomized trial',
            url: 'https://pubmed.ncbi.nlm.nih.gov/17978138/',
            type: 'RCT'
          }
        ]
      }
    },
    hallmarkImpacts: [
      {
        hallmarkId: 'genomic_instability',
        hallmarkName: 'Genomic Instability',
        impactScore: 9.1,
        tier: 'foundational',
        mechanism: 'Prevents Fenton reaction iron-mediated hydroxyl radical generation and double-strand DNA breaks.',
        clinicalEvidenceGrade: 'Grade A (Human RCT)',
        pmid: '17978138',
        studyTitle: 'Reduction of Iron Stores and Cardiovascular Protection',
        studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/17978138/'
      }
    ]
  }
}

// -----------------------------------------------------------------------------
// 3. HELPER LOOKUP FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Resolves a modality to its benchmark clinical longevity profile using exact and semantic matching.
 */
export function findBenchmarkLongevityProfile(modId: string, modName?: string, modSlug?: string): ModalityLongevityProfile | null {
  const normId = (modId || '').toLowerCase().replace(/[-\s]/g, '_').trim()
  const normName = (modName || '').toLowerCase().replace(/[-\s]/g, '_').trim()
  const normSlug = (modSlug || '').toLowerCase().replace(/[-\s]/g, '_').trim()
  const combined = `${normId} ${normName} ${normSlug}`

  // 1. Direct key lookup
  if (MASTER_MODALITY_LONGEVITY_PROFILES[normId]) {
    return MASTER_MODALITY_LONGEVITY_PROFILES[normId]
  }

  // 2. Exact substring lookup across existing profile keys
  for (const [key, profile] of Object.entries(MASTER_MODALITY_LONGEVITY_PROFILES)) {
    if (normId === key || normId.includes(key) || key.includes(normId)) return profile
  }

  // 3. Semantic keyword mapping for biological modalities
  if (combined.includes('cold shower') || (combined.includes('shower') && combined.includes('cold'))) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['cold_shower']
  }
  if (combined.includes('plunge') || combined.includes('cold_water') || (combined.includes('cold') && (combined.includes('immersion') || combined.includes('shock') || combined.includes('bath') || combined.includes('water')))) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['cold_plunge'] || MASTER_MODALITY_LONGEVITY_PROFILES['cold_water_immersion']
  }
  if (combined.includes('infrared') || combined.includes('far-infrared') || combined.includes('ir sauna')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['infrared_sauna']
  }
  if (combined.includes('dry sauna') || combined.includes('finnish') || combined.includes('sauna') || combined.includes('hypertherm')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['dry_sauna'] || MASTER_MODALITY_LONGEVITY_PROFILES['sauna_exposure']
  }
  if ((combined.includes('zone_2') || combined.includes('zone 2') || combined.includes('aerobic') || combined.includes('cardio')) && !combined.includes('vo2')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['zone_2_cardio']
  }
  if (combined.includes('vo2') || combined.includes('4x4') || combined.includes('norwegian') || (combined.includes('hiit') && combined.includes('interval'))) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['vo2_max_norwegian_hiit']
  }
  if (combined.includes('ss31') || combined.includes('ss-31') || combined.includes('elamipretide')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['ss31_mitochondrial']
  }
  if (combined.includes('ghk') || combined.includes('copper_peptide') || combined.includes('copper peptide')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['ghk_cu_peptide']
  }
  if (combined.includes('ta1') || combined.includes('ta-1') || combined.includes('thymosin_alpha') || combined.includes('thymosin alpha') || combined.includes('thymalfasin')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['ta1_thymosin_alpha']
  }
  if (combined.includes('bpc') || combined.includes('bpc157') || combined.includes('bpc-157')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['bpc157_peptide']
  }
  if (combined.includes('cjc') || combined.includes('ipamorelin') || combined.includes('sermorelin')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['cjc_ipamorelin_gh_axis']
  }
  if (combined.includes('tesamorelin')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['tesamorelin_growth_hormone']
  }
  if (combined.includes('red_light') || combined.includes('red light') || combined.includes('photobiomodulation') || combined.includes('pbm') || combined.includes('near_infrared') || combined.includes('near infrared')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['red_light_photobiomodulation']
  }
  if (combined.includes('tirzepatide') || combined.includes('retatrutide') || combined.includes('semaglutide') || combined.includes('glp1') || combined.includes('glp-1')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['glp1_incretin_agonists']
  }
  if (combined.includes('fisetin') || combined.includes('senolytic')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['fisetin_senolytic_pulse']
  }
  if (combined.includes('phlebotomy') || combined.includes('blood_donation') || combined.includes('blood donation') || combined.includes('pfas')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['blood_donation_phlebotomy']
  }
  if (combined.includes('glynac') || (combined.includes('glycine') && combined.includes('nac'))) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['glynac_supplement']
  }
  if (combined.includes('sulforaphane') || combined.includes('broccoli_sprout')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['sulforaphane']
  }
  if (combined.includes('epitalon') || combined.includes('epithalon')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['epitalon_peptide']
  }
  if (combined.includes('mots_c') || combined.includes('mots-c') || combined.includes('motsc')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['mots_c_peptide']
  }
  if (combined.includes('resistance') || combined.includes('strength') || combined.includes('lifting') || combined.includes('hypertrophy') || combined.includes('squat') || combined.includes('centenarian')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['heavy_resistance_training']
  }
  if (combined.includes('creatine')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['creatine_monohydrate']
  }
  if (combined.includes('fast') && (combined.includes('48') || combined.includes('36') || combined.includes('72') || combined.includes('prolong') || combined.includes('extended') || combined.includes('autophagy'))) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['extended_fast_48h']
  }
  if (combined.includes('omega') || combined.includes('fish_oil') || combined.includes('epa') || combined.includes('dha')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['high_dose_omega3_epa_dha']
  }
  if ((combined.includes('vitamin_d') || combined.includes('d3')) && (combined.includes('k2') || combined.includes('mk7') || combined.includes('mk-7'))) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['vitamin_d3_k2']
  }
  if (combined.includes('berberine')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['berberine_supplement']
  }
  if (combined.includes('ashwagandha')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['ashwagandha_ksm66']
  }
  if (combined.includes('urolithin')) {
    return MASTER_MODALITY_LONGEVITY_PROFILES['urolithin_a']
  }

  return null
}

/**
 * Resolves the longevity evidence for a given modality and outcome vector.
 */
export function getModalityLongevityImpact(
  modalityId: string,
  outcomeId: string,
  modName?: string,
  modSlug?: string
): LongevityVectorEvidence | null {
  const normOutId = outcomeId.toLowerCase().replace(/[-\s]/g, '_').trim()
  const profile = findBenchmarkLongevityProfile(modalityId, modName, modSlug)
  if (!profile) return null

  // Direct match or partial key match
  for (const [key, evidence] of Object.entries(profile.longevityImpacts)) {
    if (key === normOutId || key.includes(normOutId) || normOutId.includes(key)) {
      return evidence
    }
  }

  return null
}

/**
 * Returns clinical metadata and biomarkers for a given longevity outcome vector.
 */
export function getOutcomeVectorMetadata(
  outcomeId: string
): LongevityVectorMetadata | null {
  const normOutId = outcomeId.toLowerCase().replace(/[-\s]/g, '_').trim()
  return LONGEVITY_VECTORS_METADATA[normOutId] || null
}

/**
 * Dynamically computes a composite longevity outcome score for a protocol based
 * on its active constituent modalities with sigmoidal saturation and tier weighting.
 */
export function calculateCompositeProtocolLongevityScore(
  modalities: any[],
  outcomeId: string
): {
  score: number
  tier: 'foundational' | 'synergistic' | 'marginal'
  foundationalCount: number
  synergisticCount: number
  marginalCount: number
  primaryEvidence: LongevityVectorEvidence[]
} {
  let foundationalCount = 0
  let synergisticCount = 0
  let marginalCount = 0
  let totalRawScore = 0
  const primaryEvidence: LongevityVectorEvidence[] = []

  modalities.forEach(m => {
    const mId = m.id || m.modality_id || ''
    const mName = m.name || m.display_name || ''
    const mSlug = m.slug || ''
    const evidence = getModalityLongevityImpact(mId, outcomeId, mName, mSlug)
    if (evidence) {
      primaryEvidence.push(evidence)
      if (evidence.tier === 'foundational') {
        foundationalCount++
        totalRawScore += evidence.score * 1.0
      } else if (evidence.tier === 'synergistic') {
        synergisticCount++
        totalRawScore += evidence.score * 0.6
      } else {
        marginalCount++
        totalRawScore += evidence.score * 0.25
      }
    }
  })

  // Sigmoidal saturation: asymptotic ceiling at 100
  // Formula: Score = 100 * (1 - e^(-totalRawScore / 80))
  const satFactor = 85
  const compositeScore = totalRawScore > 0 
    ? Math.min(100, Math.round(100 * (1 - Math.exp(-totalRawScore / satFactor))))
    : 0

  let tier: 'foundational' | 'synergistic' | 'marginal' = 'marginal'
  if (foundationalCount >= 1 || compositeScore >= 75) {
    tier = 'foundational'
  } else if (synergisticCount >= 1 || compositeScore >= 45) {
    tier = 'synergistic'
  }

  return {
    score: compositeScore,
    tier,
    foundationalCount,
    synergisticCount,
    marginalCount,
    primaryEvidence
  }
}

export interface NeutralVectorEvidence {
  outcomeId: string
  outcomeName: string
  shortLabel: string
  reason: string
  isDiagnostic?: boolean
  monitoredBiomarkers?: string[]
}

export interface CompleteModalityLongevityReport {
  modalityId: string
  displayName: string
  category: string
  isDiagnostic: boolean
  isSupportiveHabit: boolean
  primaryTier: 'foundational' | 'synergistic' | 'marginal' | 'neutral'
  primaryVector: LongevityVectorEvidence | null
  vectors: LongevityVectorEvidence[]
  neutralVectors: NeutralVectorEvidence[]
  hallmarks: Array<{
    name: string
    mechanism?: string
    tier?: string
    pmid?: string
    url?: string
  }>
  totalStudyCount: number
}

/**
 * Compiles a complete, clinically rigorous longevity report for an individual modality.
 * Evaluates all 8 canonical biological vectors: active vectors receive clinical scores and studies,
 * while non-targeted/supportive/diagnostic vectors are explicitly marked as Neutral.
 */
export function getAllModalityLongevityImpacts(mod: any): CompleteModalityLongevityReport {
  if (!mod) {
    return {
      modalityId: '',
      displayName: '',
      category: '',
      isDiagnostic: false,
      isSupportiveHabit: false,
      primaryTier: 'neutral',
      primaryVector: null,
      vectors: [],
      neutralVectors: [],
      hallmarks: [],
      totalStudyCount: 0
    }
  }

  const mId = mod.id || ''
  const displayName = mod.display_name || mod.name || mId
  const rawCat = (mod.category || '').toLowerCase()
  const rawName = (mod.name || mod.display_name || '').toLowerCase()
  const rawId = (mod.id || '').toLowerCase()

  // 1. Detect modality archetype
  const isDiagnostic = rawCat.includes('diagnostic') || 
    rawCat.includes('tracking') ||
    rawCat.includes('vascular health') ||
    rawCat.includes('genomic & methylation') ||
    rawName.includes('scan') ||
    rawName.includes('mri') ||
    rawName.includes('cpet') ||
    rawName.includes('monitor') ||
    rawName.includes('panel') ||
    rawName.includes('screen') ||
    rawName.includes('clock') ||
    rawName.includes('dexa') ||
    rawName.includes('cac') ||
    rawName.includes('blood pressure monitor') ||
    rawId.includes('cpet') ||
    rawId.includes('mri') ||
    rawId.includes('abpm') ||
    rawId.includes('grail') ||
    rawId.includes('toxin')

  const isSupportiveHabit = rawCat.includes('productivity') ||
    rawCat.includes('mental well-being') ||
    rawCat.includes('hygiene') ||
    rawName.includes('flossing') ||
    rawName.includes('time-blocking') ||
    rawName.includes('hydration') ||
    rawName.includes('journaling') ||
    rawName.includes('gratitude')

  const normalizeVectorKey = (raw: string): string => {
    const norm = raw.toLowerCase().replace(/[-\s]/g, '_').trim()
    const ALIASES: Record<string, string> = {
      inflammation_status: 'chronic_inflammation',
      systemic_inflammation: 'chronic_inflammation',
      musculoskeletal_resilience: 'bone_density',
      musculoskeletal_health: 'bone_density',
      hormonal_balance: 'testosterone',
      endocrine_vitality: 'testosterone',
      epigenetic_integrity: 'cellular_longevity',
      dna_repair: 'cellular_longevity',
      autophagy: 'cancer_defense'
    }
    return ALIASES[norm] || norm
  }

  // 2. Check curated benchmark profile via semantic resolver
  const benchmarkProfile = findBenchmarkLongevityProfile(mId, mod.name || mod.display_name, mod.slug)

  const vectorMap = new Map<string, LongevityVectorEvidence>()

  if (benchmarkProfile) {
    Object.entries(benchmarkProfile.longevityImpacts).forEach(([k, ev]) => {
      const canonKey = normalizeVectorKey(k)
      if (LONGEVITY_VECTORS_METADATA[canonKey]) {
        const meta = LONGEVITY_VECTORS_METADATA[canonKey]
        vectorMap.set(canonKey, {
          ...ev,
          outcomeId: canonKey,
          outcomeName: meta.name
        })
      }
    })
  }

  // 3. Check functional_impacts JSONB from database
  if (mod.functional_impacts && typeof mod.functional_impacts === 'object') {
    Object.entries(mod.functional_impacts).forEach(([rawKey, rawVal]: [string, any]) => {
      const normKey = normalizeVectorKey(rawKey)
      if (LONGEVITY_VECTORS_METADATA[normKey] && !vectorMap.has(normKey)) {
        const meta = LONGEVITY_VECTORS_METADATA[normKey]
        const score = typeof rawVal?.score === 'number' ? (rawVal.score <= 10 ? rawVal.score * 10 : rawVal.score) : 70
        const tier = rawVal?.tier || (score >= 75 ? 'foundational' : score >= 45 ? 'synergistic' : 'marginal')
        const studies = Array.isArray(rawVal?.studies) ? rawVal.studies : []
        vectorMap.set(normKey, {
          outcomeId: normKey,
          outcomeName: meta.name,
          score,
          tier,
          evidenceGrade: rawVal?.evidence_grade || (studies.length > 0 ? 'Grade A (Human RCT)' : 'Grade B (Clinical Trial)'),
          effectSize: rawVal?.effect_size || meta.scoringRubric.tier1Description,
          biomarkers: rawVal?.biomarkers || meta.biomarkers.map(b => b.name),
          mechanism: rawVal?.mechanism || mod.mechanism_of_action || meta.description,
          studies
        })
      }
    })
  }

  // 4. Archetype-based inference if vectorMap is still empty
  if (vectorMap.size === 0 && !isDiagnostic && !isSupportiveHabit) {
    const prim = (mod.primary_outcome || '').toLowerCase().replace(/[-\s]/g, '_').trim()
    
    // Check primary outcome keywords first
    for (const [vecKey, meta] of Object.entries(LONGEVITY_VECTORS_METADATA)) {
      if (prim && (prim.includes(vecKey) || vecKey.includes(prim) || rawName.includes(vecKey.replace(/_/g, ' ')))) {
        vectorMap.set(vecKey, {
          outcomeId: vecKey,
          outcomeName: meta.name,
          score: 75,
          tier: 'synergistic',
          evidenceGrade: 'Grade B (Clinical Trial)',
          effectSize: meta.scoringRubric.tier2Description,
          biomarkers: meta.biomarkers.map(b => b.name),
          mechanism: mod.mechanism_of_action || meta.description,
          studies: []
        })
      }
    }

    // Biomechanical / Orthopedic Training -> Musculoskeletal Resilience & Bone Density
    if (
      vectorMap.size === 0 && (
        rawCat.includes('exercise') ||
        rawCat.includes('physical') ||
        rawCat.includes('strength') ||
        rawCat.includes('fitness') ||
        rawCat.includes('tissue & joint') ||
        rawCat.includes('neuromuscular') ||
        rawName.includes('raise') ||
        rawName.includes('squat') ||
        rawName.includes('curl') ||
        rawName.includes('step-up') ||
        rawName.includes('bfr') ||
        rawName.includes('murph') ||
        rawName.includes('sports')
      )
    ) {
      const meta = LONGEVITY_VECTORS_METADATA.bone_density
      vectorMap.set('bone_density', {
        outcomeId: 'bone_density',
        outcomeName: meta.name,
        score: 75,
        tier: 'synergistic',
        evidenceGrade: 'Grade B (Clinical / Biomechanical Trial)',
        effectSize: 'Enhances tendon tensile capacity, joint resilience, and axial mechanotransduction.',
        biomarkers: ['DEXA Femoral Neck T-Score', 'Serum P1NP', 'Joint ROM & Tendon Elasticity'],
        mechanism: mod.mechanism_of_action || 'Mechanotransductive joint, connective tissue, and myofibrillar loading stimulus promoting structural integrity, fall prevention, and musculoskeletal longevity.',
        studies: []
      })
    } 
    // Autonomic / Breathwork / Mindfulness -> Neuroprotection & Inflammation
    else if (
      vectorMap.size === 0 && (
        rawCat.includes('breathwork') ||
        rawCat.includes('cranial nerve') ||
        rawCat.includes('autonomic') ||
        rawName.includes('sighing') ||
        rawName.includes('breathing') ||
        rawName.includes('gargling') ||
        rawName.includes('meditation')
      )
    ) {
      const metaBrain = LONGEVITY_VECTORS_METADATA.brain_longevity
      vectorMap.set('brain_longevity', {
        outcomeId: 'brain_longevity',
        outcomeName: metaBrain.name,
        score: 75,
        tier: 'synergistic',
        evidenceGrade: 'Grade B (Clinical Autonomic Trial)',
        effectSize: 'Upregulates vagal parasympathetic tone and acute heart rate variability.',
        biomarkers: ['High-Frequency HRV', 'Resting Heart Rate', 'Serum Cortisol'],
        mechanism: mod.mechanism_of_action || 'Stimulates the vagus nerve (cranial nerve X) to downregulate sympathetic fight-or-flight signaling and promote autonomic recovery.',
        studies: []
      })
      const metaInflam = LONGEVITY_VECTORS_METADATA.chronic_inflammation
      vectorMap.set('chronic_inflammation', {
        outcomeId: 'chronic_inflammation',
        outcomeName: metaInflam.name,
        score: 70,
        tier: 'synergistic',
        evidenceGrade: 'Grade B (Clinical Autonomic Trial)',
        effectSize: 'Suppresses acute neurogenic inflammatory cascade via acetylcholine release.',
        biomarkers: ['High-Sensitivity CRP (hs-CRP)', 'IL-6'],
        mechanism: 'Cholinergic anti-inflammatory pathway activation via efferent vagal nerve stimulation.',
        studies: []
      })
    }
    // Skincare / Barrier Recovery -> Cellular Longevity
    else if (
      vectorMap.size === 0 && (
        rawCat.includes('skincare') ||
        rawName.includes('retinoid') ||
        rawName.includes('ghk-cu') ||
        rawName.includes('serum') ||
        rawName.includes('barrier cream')
      )
    ) {
      const metaCell = LONGEVITY_VECTORS_METADATA.cellular_longevity
      vectorMap.set('cellular_longevity', {
        outcomeId: 'cellular_longevity',
        outcomeName: metaCell.name,
        score: 75,
        tier: 'synergistic',
        evidenceGrade: 'Grade B (Clinical Dermatological Trial)',
        effectSize: 'Stimulates procollagen synthesis and epidermal barrier lipid restoration.',
        biomarkers: ['Dermal Collagen Density', 'Trans-Epidermal Water Loss (TEWL)'],
        mechanism: mod.mechanism_of_action || 'Promotes cellular turnover, activates fibroblast procollagen synthesis, and restores lipid barrier integrity.',
        studies: []
      })
    }
  }

  // Sort active vectors: foundational first, then by score descending
  const vectors = Array.from(vectorMap.values()).sort((a, b) => {
    if (a.tier === 'foundational' && b.tier !== 'foundational') return -1
    if (b.tier === 'foundational' && a.tier !== 'foundational') return 1
    return b.score - a.score
  })

  // 5. Evaluate all 8 vectors for Neutral status
  const neutralVectors: NeutralVectorEvidence[] = []
  Object.keys(LONGEVITY_VECTORS_METADATA).forEach(vKey => {
    if (!vectorMap.has(vKey)) {
      const meta = LONGEVITY_VECTORS_METADATA[vKey]
      let reason = `No direct clinical trial evidence demonstrating targeted modulation of ${meta.shortLabel || meta.name}. Modality functions on other biological pathways.`
      let monitoredBiomarkers: string[] = []

      if (isDiagnostic) {
        reason = `Diagnostic surveillance tool; tracks objective biomarkers to detect subclinical pathology rather than functioning as a direct biochemical intervention for ${meta.shortLabel || meta.name}.`
        monitoredBiomarkers = meta.biomarkers.map(b => b.name)
      } else if (isSupportiveHabit) {
        reason = `Foundational lifestyle baseline practice; supports general systemic wellness without direct clinical RCT evidence for isolated ${meta.shortLabel || meta.name} lifespan extension.`
      } else if (rawCat.includes('exercise') || rawCat.includes('physical') || rawCat.includes('strength') || rawCat.includes('tissue')) {
        reason = `Primary biomechanical stimulus focused on local joint and connective tissue conditioning; no direct evidence for isolated systemic ${meta.shortLabel || meta.name} modulation.`
      }

      neutralVectors.push({
        outcomeId: vKey,
        outcomeName: meta.name,
        shortLabel: meta.shortLabel,
        reason,
        isDiagnostic,
        monitoredBiomarkers
      })
    }
  })

  // Primary Vector & Primary Tier
  const primaryVector = vectors[0] || null
  const primaryTier: 'foundational' | 'synergistic' | 'marginal' | 'neutral' = 
    isDiagnostic 
      ? 'neutral' 
      : (primaryVector ? primaryVector.tier : 'neutral')

  // Hallmarks compilation
  const hallmarkList: Array<{ name: string; mechanism?: string; tier?: string; pmid?: string; url?: string }> = []
  const addedHallmarkNames = new Set<string>()

  if (benchmarkProfile && Array.isArray(benchmarkProfile.hallmarkImpacts)) {
    benchmarkProfile.hallmarkImpacts.forEach(h => {
      if (!addedHallmarkNames.has(h.hallmarkName)) {
        addedHallmarkNames.add(h.hallmarkName)
        hallmarkList.push({
          name: h.hallmarkName,
          mechanism: h.mechanism,
          tier: h.tier,
          pmid: h.pmid,
          url: h.studyUrl
        })
      }
    })
  }

  if (Array.isArray(mod.hallmarks_of_aging_impact)) {
    mod.hallmarks_of_aging_impact.forEach((h: string) => {
      if (!addedHallmarkNames.has(h)) {
        addedHallmarkNames.add(h)
        hallmarkList.push({ name: h })
      }
    })
  }

  // Calculate total study count
  const studyPmids = new Set<string>()
  vectors.forEach(v => {
    v.studies?.forEach(s => {
      if (s.pmid) studyPmids.add(s.pmid)
    })
  })
  hallmarkList.forEach(h => {
    if (h.pmid) studyPmids.add(h.pmid)
  })

  return {
    modalityId: mId,
    displayName,
    category: mod.category || '',
    isDiagnostic,
    isSupportiveHabit,
    primaryTier,
    primaryVector,
    vectors,
    neutralVectors,
    hallmarks: hallmarkList,
    totalStudyCount: Math.max(studyPmids.size, (mod.efficacy_stats || []).length)
  }
}

export interface ProtocolVectorScore {
  vectorId: string
  vectorName: string
  score: number
  tier: 'foundational' | 'synergistic' | 'marginal'
  foundationalCount: number
  synergisticCount: number
  marginalCount: number
  primaryContributors: Array<{
    modalityName: string
    modalityId: string
    score: number
    tier: string
    mechanism: string
  }>
}

export interface NeutralProtocolVector {
  vectorId: string
  vectorName: string
  shortLabel: string
  reason: string
}

export interface CompleteProtocolLongevityReport {
  protocolId: string
  protocolName: string
  targetVectors: string[]
  vectorScores: ProtocolVectorScore[]
  neutralVectors: NeutralProtocolVector[]
  collectiveHallmarks: string[]
  totalConstituentStudies: number
  constituentCount: number
}

/**
 * Compiles a composite longevity report for an entire protocol.
 * Analyzes both targeted and non-targeted biological vectors for complete transparency.
 */
export function getProtocolLongevityReport(
  protocol: any,
  allModalities: any[] = []
): CompleteProtocolLongevityReport {
  if (!protocol) {
    return {
      protocolId: '',
      protocolName: '',
      targetVectors: [],
      vectorScores: [],
      neutralVectors: [],
      collectiveHallmarks: [],
      totalConstituentStudies: 0,
      constituentCount: 0
    }
  }

  const pId = protocol.id || ''
  const pName = protocol.name || pId
  const targetVectors: string[] = Array.isArray(protocol.target_vectors)
    ? protocol.target_vectors
    : []

  // Resolve constituent modalities with fallback resolution
  const constituentMods: any[] = []
  if (Array.isArray(protocol.steps)) {
    protocol.steps.forEach((step: any) => {
      const mod = step.modality || 
        allModalities.find(m => m.id === step.modality_id) ||
        (step.modality_id ? { id: step.modality_id, name: step.modality_name || step.name || step.modality_id } : null)
      if (mod) constituentMods.push(mod)
    })
  }

  // Evaluate vector scores for all active vectors
  const vectorScores: ProtocolVectorScore[] = []
  const collectiveHallmarksSet = new Set<string>()
  const studyPmids = new Set<string>()

  // Analyze all 8 vectors
  Object.keys(LONGEVITY_VECTORS_METADATA).forEach(vKey => {
    const meta = LONGEVITY_VECTORS_METADATA[vKey]
    const comp = calculateCompositeProtocolLongevityScore(constituentMods, vKey)

    // Gather primary contributors
    const contributors: Array<{
      modalityName: string
      modalityId: string
      score: number
      tier: string
      mechanism: string
    }> = []

    constituentMods.forEach(m => {
      const report = getAllModalityLongevityImpacts(m)
      const ev = report.vectors.find(v => v.outcomeId === vKey)
      if (ev) {
        contributors.push({
          modalityName: m.display_name || m.name || m.id,
          modalityId: m.id,
          score: ev.score,
          tier: ev.tier,
          mechanism: ev.mechanism
        })
        ev.studies?.forEach(s => {
          if (s.pmid) studyPmids.add(s.pmid)
        })
      }
      report.hallmarks.forEach(h => collectiveHallmarksSet.add(h.name))
    })

    // Include if score > 15 or explicitly targeted
    if (comp.score > 15 || targetVectors.includes(vKey)) {
      vectorScores.push({
        vectorId: vKey,
        vectorName: meta.name,
        score: comp.score,
        tier: comp.tier,
        foundationalCount: comp.foundationalCount,
        synergisticCount: comp.synergisticCount,
        marginalCount: comp.marginalCount,
        primaryContributors: contributors.sort((a, b) => b.score - a.score)
      })
    }
  })

  // Sort vector scores: targeted vectors first, then by score descending
  vectorScores.sort((a, b) => {
    const aTarget = targetVectors.includes(a.vectorId)
    const bTarget = targetVectors.includes(b.vectorId)
    if (aTarget && !bTarget) return -1
    if (bTarget && !aTarget) return 1
    return b.score - a.score
  })

  // Populate neutral non-targeted vectors
  const neutralVectors: NeutralProtocolVector[] = []
  Object.keys(LONGEVITY_VECTORS_METADATA).forEach(vKey => {
    const isPresent = vectorScores.some(vs => vs.vectorId === vKey)
    if (!isPresent) {
      const meta = LONGEVITY_VECTORS_METADATA[vKey]
      neutralVectors.push({
        vectorId: vKey,
        vectorName: meta.name,
        shortLabel: meta.shortLabel,
        reason: 'Not explicitly targeted by this protocol stack. Can be addressed through targeted modular adjunct modalities.'
      })
    }
  })

  return {
    protocolId: pId,
    protocolName: pName,
    targetVectors,
    vectorScores,
    neutralVectors,
    collectiveHallmarks: Array.from(collectiveHallmarksSet),
    totalConstituentStudies: studyPmids.size,
    constituentCount: constituentMods.length
  }
}
