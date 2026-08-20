import { Modality, DailyProtocolTask, UserProfile } from '../types'
import { getEffortMetadata, getCostMetadata } from '@/lib/ranking/adaptiveRecommendationEngine'
import {
  MODALITY_HALLMARK_PROFILES,
  getModalityHallmarkEvidence,
  HallmarkTargetingEvidence
} from './hallmarkKnowledgeBase'
import { resolvePubMedCitation } from './scientificCitations'

export type HallmarkTier = 'primary' | 'antagonistic' | 'integrative'

export interface HallmarkMeta {
  id: string
  name: string
  shortName: string
  tier: HallmarkTier
  tierLabel: string
  description: string
  biologicalConsequence: string
  colorHex: string
  accentColor: string
}

export interface HallmarkCoverageItem {
  meta: HallmarkMeta
  score: number // 0 to 100
  supportingModalities: {
    modality: Modality
    evidenceScore: number
    effortLevel: number
    effortLabel: string
    frequency: string
    exactMechanism: string
    clinicalEvidenceGrade: string
    pubMedTitle?: string
    pubMedUrl?: string
    pmid?: string
  }[]
  isCovered: boolean // score >= 60
  isModerate: boolean // 30 <= score < 60
  isGap: boolean // score < 30
}

export interface BioGapRecommendation {
  hallmark: HallmarkMeta
  currentScore: number
  severity: 'critical' | 'moderate'
  recommendedModalities: {
    modality: Modality
    clinicalEvidenceGrade: string
    evidenceLevel: number
    longevityImpactScore: number
    effortLabel: string
    effortLevel: number
    timeEstimate: string
    costLabel: string
    exactMechanism: string
    pubMedTitle?: string
    pubMedUrl?: string
    pmid?: string
  }[]
}

export interface CoverageCalculationOptions {
  evidenceFilter?: 'all' | 'grade_a' // 'grade_a' filters for evidence_quality >= 5 / Grade A RCTs
  simulatedModalityIds?: Set<string>
  effortFilter?: 'all' | 'level_1' | 'level_2' | 'level_3'
}

export interface HallmarkCoverageReport {
  overallCoverageScore: number // 0 to 100
  coveredCount: number // out of 12
  gapCount: number
  hallmarkItems: HallmarkCoverageItem[]
  hallmarkMap: Record<string, HallmarkCoverageItem>
  tierScores: {
    primary: number
    antagonistic: number
    integrative: number
  }
  simulatedCoverageScore?: number
  simulatedDelta?: number
  simulatedHallmarkMap?: Record<string, number>
  evidenceFilterApplied?: 'all' | 'grade_a'
}

export interface BenchmarkProfile {
  id: string
  name: string
  creator: string
  colorHex: string
  scores: Record<string, number>
  hallmarkProtocols: Record<string, string>
  description: string
}

export const BENCHMARK_PROFILES: BenchmarkProfile[] = [
  {
    id: 'blueprint_2026',
    name: 'Bryan Johnson Blueprint (2026)',
    creator: 'Bryan Johnson',
    colorHex: '#A855F7', // Neon Purple
    description: 'Comprehensive speed of aging reduction protocol with multi-system coverage.',
    scores: {
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
    },
    hallmarkProtocols: {
      genomic_instability: 'Sulforaphane (Broccoli Sprout extract), GlyNAC (Glycine + NAC), NMN + TMG, Astaxanthin (12mg), Lycopene.',
      telomere_attrition: 'Epitalon peptide bi-annual cycles, Norwegian 4x4 HIIT (TRF2 telomerase activation), High-Dose EPA/DHA Omega-3 (>8% Index), Astragaloside IV (TA-65).',
      epigenetic_alterations: 'NMN + TMG methyl donors, Daily 60m structured exercise routine, Caloric Restriction with Optimal Nutrition (CRON).',
      loss_of_proteostasis: 'Theracurmin / Longvida bioavailable curcumin, Spermidine, Far-infrared & Finnish sauna thermal stress sessions.',
      disabled_macroautophagy: '16:8 Time-Restricted Eating, Urolithin A (1,000mg Mitopure mitophagy), Spermidine polyamine intake, Caloric restriction.',
      deregulated_nutrient_sensing: 'Acarbose (200mg with high-GI meals), Metformin / Berberine, 2,250 kcal calorie-controlled diet, Continuous Glucose Monitoring (CGM).',
      mitochondrial_dysfunction: 'Zone 2 Cardio, CoQ10 Ubiquinol (200mg), PQQ (20mg), MOTS-c mitochondrial peptide cycles, Full-body Red Light Therapy (660nm/850nm).',
      cellular_senescence: 'Fisetin high-dose senolytic pulses (20mg/kg), Dasatinib + Quercetin (D+Q), Pure Apigenin (50mg CD38 inhibitor).',
      stem_cell_exhaustion: 'GHK-Cu copper peptide therapy, Progressive resistance lifting, Hyperbaric Oxygen Therapy (HBOT 2.0 ATA).',
      altered_intercellular_communication: '10,000 lux morning light exposure, 100% blue-blocking glasses 2h pre-bed, Continuous HRV vagal tracking, 100% sleep consistency (8.5 hrs).',
      chronic_inflammation: 'High-Dose EPA/DHA Omega-3 (2,400mg), Bioavailable Curcuminoids, Whole-body Cryotherapy / Cold water immersion.',
      dysbiosis: '30g+ Prebiotic dietary fiber, 2 tbsp High-Polyphenol EVOO (>500mg/kg polyphenols), Fermented foods (kimchi, sauerkraut) & live probiotics.'
    }
  },
  {
    id: 'attia_decathlon',
    name: 'Peter Attia Centenarian Decathlon',
    creator: 'Dr. Peter Attia',
    colorHex: '#3B82F6', // Blue
    description: 'Cardiorespiratory fitness, muscular strength, and metabolic longevity.',
    scores: {
      genomic_instability: 65,
      telomere_attrition: 60,
      epigenetic_alterations: 82,
      loss_of_proteostasis: 75,
      disabled_macroautophagy: 70,
      deregulated_nutrient_sensing: 92,
      mitochondrial_dysfunction: 98,
      cellular_senescence: 70,
      stem_cell_exhaustion: 85,
      altered_intercellular_communication: 80,
      chronic_inflammation: 88,
      dysbiosis: 70
    },
    hallmarkProtocols: {
      genomic_instability: 'High-dose antioxidant cofactors, ApoB and cardiovascular risk factor elimination to prevent endothelial DNA stress.',
      telomere_attrition: 'Norwegian 4x4 HIIT intervals, High-dose EPA/DHA Omega-3 (Vascepa 4g/day) maintaining leukocyte telomere length.',
      epigenetic_alterations: 'Heavy multi-joint resistance training, Zone 2 aerobic base volume, Sleep architecture stabilization.',
      loss_of_proteostasis: 'Finnish Sauna (80°C+ / 176°F+ for 20m 4x/week for Heat Shock Protein 70 upregulation).',
      disabled_macroautophagy: 'Intermittent fasting cycles, SGLT2 inhibitors / Metformin, High-intensity exercise autophagic flux.',
      deregulated_nutrient_sensing: 'Continuous Glucose Monitoring (CGM), Zone 2 lactate disposal, SGLT2 inhibitors, Insulin sensitivity optimization.',
      mitochondrial_dysfunction: '4x/week 45–60 min Zone 2 Cardio (lactate 1.5–2.0 mmol/L) for maximum mitochondrial biogenesis and fat oxidation.',
      cellular_senescence: 'Periodic rapamycin mTOR inhibition, Exercise-induced SASP clearance.',
      stem_cell_exhaustion: 'Heavy progressive barbell lifting (squats, deadlifts, overhead press, farmer carries, rucking).',
      altered_intercellular_communication: 'Strict circadian sleep hygiene, Magnesium L-threonate, Parasympathetic down-regulation breathwork.',
      chronic_inflammation: 'Prescription EPA Omega-3 (Vascepa 4g/day), Intensive ApoB lowering (<40 mg/dL), Visceral adiposity minimization.',
      dysbiosis: 'High-fiber Mediterranean-style nutrition, Lean protein pulses (1g/lb body weight).'
    }
  },
  {
    id: 'longo_fmd',
    name: 'Valter Longo Senolytic & FMD',
    creator: 'Dr. Valter Longo',
    colorHex: '#10B981', // Emerald
    description: 'Cellular purging, senolytic clearance, and post-fast stem cell rejuvenation.',
    scores: {
      genomic_instability: 70,
      telomere_attrition: 65,
      epigenetic_alterations: 78,
      loss_of_proteostasis: 92,
      disabled_macroautophagy: 100,
      deregulated_nutrient_sensing: 95,
      mitochondrial_dysfunction: 80,
      cellular_senescence: 96,
      stem_cell_exhaustion: 94,
      altered_intercellular_communication: 75,
      chronic_inflammation: 90,
      dysbiosis: 82
    },
    hallmarkProtocols: {
      genomic_instability: 'Low-protein fasting diet reducing oxidative stress and reactive nitrogen species.',
      telomere_attrition: 'Caloric restriction mimetics and post-fast stem cell rejuvenation.',
      epigenetic_alterations: 'Periodic cycles of fasting-induced chromatin reprogramming and Sirtuin deacetylation.',
      loss_of_proteostasis: 'Deep cellular cleaning through macroautophagy, clearing amyloid and protein aggregates.',
      disabled_macroautophagy: '5-Day Fasting-Mimicking Diet (ProLon FMD) 3–4x/year, 12-hour circadian fasting window.',
      deregulated_nutrient_sensing: 'Strict low-protein (<0.35g/lb), plant-based pescatarian diet suppressing IGF-1, PKA, and mTOR.',
      mitochondrial_dysfunction: 'Mitophagy induction during fasting, followed by de novo mitochondrial biogenesis during refeeding.',
      cellular_senescence: 'Selective apoptosis of senescent cells during prolonged nutrient deprivation.',
      stem_cell_exhaustion: 'Post-FMD refeeding phase activates PKA-dependent self-renewal of hematopoietic and neural stem cells.',
      altered_intercellular_communication: 'Circadian-aligned 12h eating window, Natural whole-food nutrient signaling.',
      chronic_inflammation: 'Profound reduction in systemic CRP, TNF-alpha, and IL-6 after each 5-day FMD cycle.',
      dysbiosis: 'High intake of complex prebiotic legumes, vegetables, and polyphenol-dense olive oil and nuts.'
    }
  },
  {
    id: 'blue_zones_centenarian',
    name: 'Blue Zones Centenarian Archetype',
    creator: 'Okinawa / Ikaria Cohort',
    colorHex: '#F59E0B', // Amber
    description: 'Epidemiological longevity: plant-slanted nutrition, natural daily movement, social ikigai, and caloric moderation.',
    scores: {
      genomic_instability: 75,
      telomere_attrition: 70,
      epigenetic_alterations: 80,
      loss_of_proteostasis: 72,
      disabled_macroautophagy: 78,
      deregulated_nutrient_sensing: 88,
      mitochondrial_dysfunction: 82,
      cellular_senescence: 68,
      stem_cell_exhaustion: 74,
      altered_intercellular_communication: 95,
      chronic_inflammation: 92,
      dysbiosis: 96
    },
    hallmarkProtocols: {
      genomic_instability: 'High-polyphenol herbal infusions (mountain tea, rosemary, sage), purple sweet potatoes (anthocyanins).',
      telomere_attrition: 'Lifelong moderate sun exposure, stress-buffered communal living, natural olive oil and omega-3 consumption.',
      epigenetic_alterations: 'Daily moderate gardening and walking maintaining epigenetic youthfulness and metabolic homeostasis.',
      loss_of_proteostasis: 'Daily intake of raw honey, wild herbs, and extra virgin olive oil stimulating proteasomal activity.',
      disabled_macroautophagy: 'Hara Hachi Bu principle (stop eating when 80% full) providing mild chronic caloric restriction and basal autophagic flux.',
      deregulated_nutrient_sensing: 'Legume-dense, high-fiber, low-glycemic Mediterranean and Okinawan diets preventing insulin spikes.',
      mitochondrial_dysfunction: 'Natural non-exercise physical activity (NEPA) across steep terrain (Ikaria / Sardinia) maintaining mitochondrial volume.',
      cellular_senescence: 'High dietary quercetin and fisetin from wild greens, capers, onions, and seasonal berries.',
      stem_cell_exhaustion: 'Lifelong active physical baseline and absence of chronic metabolic endotoxemia.',
      altered_intercellular_communication: 'Strong community social fabric (Moai), midday rest (siesta), daily downshifting reducing cortisol.',
      chronic_inflammation: 'Unprocessed whole food matrix, wild mountain greens, extra virgin olive oil (>600mg/kg polyphenols).',
      dysbiosis: '35+ unique plant varieties weekly, sourdough fermentation, wild edible weeds promoting high Akkermansia diversity.'
    }
  },
  {
    id: 'nia_itp_lifespan',
    name: 'NIA-ITP Lifespan Extension Stack',
    creator: 'National Institute on Aging (ITP)',
    colorHex: '#EC4899', // Pink / Magenta
    description: 'Replicated mammalian lifespan extension pharmacology: Rapamycin, Acarbose, 17a-Estradiol, Canagliflozin, and GlyNAC.',
    scores: {
      genomic_instability: 82,
      telomere_attrition: 68,
      epigenetic_alterations: 86,
      loss_of_proteostasis: 90,
      disabled_macroautophagy: 96,
      deregulated_nutrient_sensing: 100,
      mitochondrial_dysfunction: 88,
      cellular_senescence: 85,
      stem_cell_exhaustion: 88,
      altered_intercellular_communication: 82,
      chronic_inflammation: 94,
      dysbiosis: 84
    },
    hallmarkProtocols: {
      genomic_instability: 'GlyNAC (Glycine + NAC) restoration of intracellular glutathione and genomic protection.',
      telomere_attrition: 'Rapamycin attenuation of senescence-induced telomere uncapping and DNA damage response.',
      epigenetic_alterations: 'Metabolic remodeling through SGLT2 inhibition and AMPK activation resetting epigenetic drift.',
      loss_of_proteostasis: 'mTOR inhibition via pulsed Rapamycin enhancing chaperone-mediated autophagy and protein aggregate clearance.',
      disabled_macroautophagy: 'Rapamycin (weekly pulse) directly relieving mTORC1 inhibition on ULK1 to activate whole-body macroautophagy.',
      deregulated_nutrient_sensing: 'Acarbose (intestinal alpha-glucosidase inhibition) + Canagliflozin (SGLT2 inhibition) flattening glucose peaks.',
      mitochondrial_dysfunction: '17-alpha estradiol (non-feminizing estrogen receptor agonist) enhancing mitochondrial respiration.',
      cellular_senescence: 'Intermittent mTOR suppression reducing senescence-associated secretory phenotype (SASP).',
      stem_cell_exhaustion: 'Rapamycin restoration of hematopoietic and epidermal stem cell quiescence and functional self-renewal.',
      altered_intercellular_communication: 'Systemic reduction in inflammatory cytokine cascades and preservation of endocrine signaling.',
      chronic_inflammation: 'Profound reduction in chronic NF-kB signaling and sterile vascular inflammation.',
      dysbiosis: 'Acarbose-driven fermentation of unabsorbed starches into short-chain fatty acids (SCFAs) in the distal colon.'
    }
  },
  {
    id: 'aha_lifes_essential_8',
    name: "AHA Life's Essential 8 (Clinical Standard)",
    creator: 'American Heart Association',
    colorHex: '#06B6D4', // Cyan
    description: 'Cardiovascular and metabolic clinical standard: blood pressure, lipids, glucose, BMI, physical activity, and sleep.',
    scores: {
      genomic_instability: 60,
      telomere_attrition: 55,
      epigenetic_alterations: 74,
      loss_of_proteostasis: 65,
      disabled_macroautophagy: 62,
      deregulated_nutrient_sensing: 90,
      mitochondrial_dysfunction: 85,
      cellular_senescence: 62,
      stem_cell_exhaustion: 65,
      altered_intercellular_communication: 88,
      chronic_inflammation: 90,
      dysbiosis: 75
    },
    hallmarkProtocols: {
      genomic_instability: 'Complete avoidance of tobacco, vaping, and secondhand smoke exposure eliminating exogenous carcinogens.',
      telomere_attrition: '150 min/week moderate-to-vigorous physical activity attenuating leukocyte telomere shortening.',
      epigenetic_alterations: 'Weight management (BMI 18.5–24.9) and regular physical activity slowing epigenetic clocks.',
      loss_of_proteostasis: 'DASH/Mediterranean dietary pattern supporting microvascular perfusion and renal proteostasis.',
      disabled_macroautophagy: 'Regular aerobic exercise stimulating basal muscular and hepatic autophagic flux.',
      deregulated_nutrient_sensing: 'Strict fasting plasma glucose (<100 mg/dL) and HbA1c (<5.7%) without pharmacotherapy.',
      mitochondrial_dysfunction: '150–300 min/week aerobic conditioning maintaining cardiac and skeletal muscle mitochondrial capacity.',
      cellular_senescence: 'Prevention of obesity-induced adipose tissue senescence and ectopic lipid accumulation.',
      stem_cell_exhaustion: 'Regular physical activity promoting circulating endothelial progenitor cell (EPC) mobilization.',
      altered_intercellular_communication: '7–9 hours nightly sleep duration, Blood pressure <120/80 mmHg preserving baroreflex and endothelial signaling.',
      chronic_inflammation: 'Non-HDL cholesterol <130 mg/dL and healthy dietary pattern suppressing vascular inflammatory markers.',
      dysbiosis: 'High intake of fruits, vegetables, whole grains, and legumes supporting gut microbiota diversity.'
    }
  },
  {
    id: 'huberman_neuro_circadian',
    name: 'Andrew Huberman Circadian & Vagal Protocol',
    creator: 'Dr. Andrew Huberman (Stanford)',
    colorHex: '#8B5CF6', // Violet
    description: 'Photoperiod alignment, cyclic sighing respiration, deliberate thermal shifts, and neuroendocrine optimization.',
    scores: {
      genomic_instability: 62,
      telomere_attrition: 58,
      epigenetic_alterations: 76,
      loss_of_proteostasis: 80,
      disabled_macroautophagy: 68,
      deregulated_nutrient_sensing: 78,
      mitochondrial_dysfunction: 90,
      cellular_senescence: 65,
      stem_cell_exhaustion: 72,
      altered_intercellular_communication: 98,
      chronic_inflammation: 85,
      dysbiosis: 70
    },
    hallmarkProtocols: {
      genomic_instability: 'Deliberate cold immersion and exercise-induced antioxidant enzyme upregulation (superoxide dismutase).',
      telomere_attrition: 'High-intensity interval training (HIIT) and stress-buffering vagal practices.',
      epigenetic_alterations: 'Daily morning sunlight exposure within 30-60m of waking establishing robust circadian gene expression.',
      loss_of_proteostasis: 'Deliberate heat exposure (Sauna 80°C–100°C for 20m 2–3x/wk) for Heat Shock Protein (HSP) induction.',
      disabled_macroautophagy: '12–16 hour overnight fasting window, Exercise-induced muscular autophagy.',
      deregulated_nutrient_sensing: 'Delaying caffeine 90–120 minutes post-waking to optimize adenosine clearance and insulin dynamics.',
      mitochondrial_dysfunction: 'Deliberate cold plunge (11 min total/week @ 50°F) triggering brown adipose tissue (BAT) and UCP1 thermogenesis.',
      cellular_senescence: 'Hormetic thermal stress and aerobic endurance exercise.',
      stem_cell_exhaustion: 'Zone 2 cardio base + Heavy compound lifting stimulating neural and muscular progenitor recruitment.',
      altered_intercellular_communication: 'Cyclic sighing (5 min/day), Morning sunlight (100k lux), 100% blue light blocking 2h before sleep, NSDR.',
      chronic_inflammation: 'Cold plunge immersion reducing pro-inflammatory cytokines, High-dose Omega-3 (EPA >1,000mg/day).',
      dysbiosis: 'Low ultra-processed food intake, Consistent diurnal feeding rhythms.'
    }
  },
  {
    id: 'sedentary_western_control',
    name: 'Sedentary Western Lifestyle (Control Baseline)',
    creator: 'Standard Lifestyle Control',
    colorHex: '#EF4444', // Red
    description: 'Unoptimized baseline: ultra-processed diet, high glycemic spikes, <4,000 steps/day, chronic stress, zero thermal exposure.',
    scores: {
      genomic_instability: 18,
      telomere_attrition: 15,
      epigenetic_alterations: 12,
      loss_of_proteostasis: 20,
      disabled_macroautophagy: 10,
      deregulated_nutrient_sensing: 15,
      mitochondrial_dysfunction: 18,
      cellular_senescence: 10,
      stem_cell_exhaustion: 12,
      altered_intercellular_communication: 14,
      chronic_inflammation: 10,
      dysbiosis: 15
    },
    hallmarkProtocols: {
      genomic_instability: 'High oxidative stress from ultra-processed seed oils, chronic micro-inflammation, and zero deliberate antioxidant support.',
      telomere_attrition: 'Accelerated leukocyte telomere shortening driven by chronic psychological stress, sleep deprivation, and physical inactivity.',
      epigenetic_alterations: 'Rapid epigenetic biological clock acceleration (+1.2 yrs/yr pace of aging on DunedinPACE).',
      loss_of_proteostasis: 'Accumulation of advanced glycation end-products (AGEs) and misfolded protein aggregates from zero heat shock induction.',
      disabled_macroautophagy: 'Continuous 16-hour eating window with constant nutrient surplus completely suppressing cellular macroautophagy.',
      deregulated_nutrient_sensing: 'Chronic postprandial hyperinsulinemia, elevated HOMA-IR (>2.5), and peripheral insulin resistance.',
      mitochondrial_dysfunction: 'Progressive loss of skeletal muscle mitochondrial volume density, low VO2 max (<35 mL/kg/min), and impaired fat oxidation.',
      cellular_senescence: 'Premature accumulation of p16INK4a senescent cells in visceral adipose tissue generating continuous SASP cytokine release.',
      stem_cell_exhaustion: 'Stem cell niche exhaustion and blunted endothelial progenitor cell (EPC) repair due to physical inactivity.',
      altered_intercellular_communication: 'Circadian misalignment from evening screen exposure, suppressed nocturnal melatonin, and blunted HRV vagal tone.',
      chronic_inflammation: 'Systemic low-grade sterile inflammaging (hs-CRP >2.5 mg/L) driving vascular endothelial dysfunction.',
      dysbiosis: 'Depleted microbiome diversity (<15 plant species/wk), impaired gut mucosal barrier (zonulin >45 ng/mL), and systemic endotoxemia.'
    }
  }
]

/**
 * Identifies cellular bio-gaps (< 50% coverage) and surfaces high-evidence modalities with exact biological mechanisms and verified PubMed citations
 */
export function identifyBioGaps(
  coverageReport: HallmarkCoverageReport,
  allModalities: Modality[],
  activeModalityIds: Set<string> = new Set(),
  options?: {
    effortFilter?: 'all' | 'level_1' | 'level_2' | 'level_3'
    evidenceFilter?: 'all' | 'grade_a'
  }
): BioGapRecommendation[] {
  // Import the knowledge base lookup
  const { MODALITY_HALLMARK_PROFILES } = require('./hallmarkKnowledgeBase')

  const effortFilter = options?.effortFilter || 'all'
  const evidenceFilter = options?.evidenceFilter || 'all'

  // Find hallmarks with score < 50
  const gapHallmarks = coverageReport.hallmarkItems
    .filter(item => item.score < 50)
    .sort((a, b) => a.score - b.score)

  if (gapHallmarks.length === 0) return []

  const allModMap = new Map<string, Modality>()
  allModalities.forEach(m => {
    if (m.id) allModMap.set(m.id, m)
  })

  return gapHallmarks.map(gapItem => {
    const hMeta = gapItem.meta
    const hKey = hMeta.id

    const evaluatedCandidates: BioGapRecommendation['recommendedModalities'] = []
    const seenModalityIds = new Set<string>()

    // 1. First, search verified curated profiles in hallmarkKnowledgeBase
    Object.values(MODALITY_HALLMARK_PROFILES as Record<string, any>).forEach((prof: any) => {
      if (activeModalityIds.has(prof.modalityId)) return
      const evidence = prof.hallmarkImpacts.find((hi: any) => hi.hallmarkId === hKey)
      if (evidence) {
        let mod = allModMap.get(prof.modalityId)
        if (!mod) {
          const fallbackEffort = getEffortMetadata(prof.modalityId + ' ' + prof.display_name)
          mod = {
            id: prof.modalityId,
            name: prof.display_name,
            display_name: prof.display_name,
            evidence_quality: evidence.evidenceLevel,
            overall_longevity_benefit: Math.round(evidence.longevityImpactScore),
            effort_level: fallbackEffort.level === 1 ? 'level_1' : fallbackEffort.level === 2 ? 'level_2' : fallbackEffort.level === 3 ? 'level_3' : fallbackEffort.level === 4 ? 'level_4' : 'level_5',
            cost_tier: 'low'
          } as any
        }
        seenModalityIds.add(prof.modalityId)

        const effort = getEffortMetadata(mod!)
        const cost = getCostMetadata(mod!.cost_tier)

        // Apply Effort Filter
        if (effortFilter === 'level_1' && effort.level !== 1) return
        if (effortFilter === 'level_2' && effort.level !== 2) return
        if (effortFilter === 'level_3' && effort.level < 3) return

        // Apply Evidence Filter
        if (evidenceFilter === 'grade_a' && evidence.evidenceLevel < 5) return

        evaluatedCandidates.push({
          modality: mod!,
          clinicalEvidenceGrade: evidence.clinicalEvidenceGrade,
          evidenceLevel: evidence.evidenceLevel,
          longevityImpactScore: evidence.longevityImpactScore,
          effortLabel: effort.shortLabel,
          effortLevel: effort.level,
          timeEstimate: effort.timeEstimate,
          costLabel: cost.shortLabel,
          exactMechanism: evidence.mechanismSummary,
          pubMedTitle: evidence.pubMedTitle,
          pubMedUrl: evidence.pubMedUrl,
          pmid: evidence.pmid
        })
      }
    })

    // 2. Second, inspect remaining modalities with verified database tagging
    allModalities.forEach(m => {
      if (activeModalityIds.has(m.id) || seenModalityIds.has(m.id)) return
      const rawHallmarks: string[] = (m as any).hallmarks_of_aging_impact || []
      const hasHallmark = rawHallmarks.some(rawH => normalizeHallmarkKey(rawH) === hKey)

      if (hasHallmark) {
        seenModalityIds.add(m.id)
        const effort = getEffortMetadata(m)
        const cost = getCostMetadata(m.cost_tier)
        const evidenceLevel = typeof m.evidence_quality === 'number' ? m.evidence_quality : 4
        const longevityImpactScore = typeof m.overall_longevity_benefit === 'number' ? m.overall_longevity_benefit : 8.0

        // Apply Effort Filter
        if (effortFilter === 'level_1' && effort.level !== 1) return
        if (effortFilter === 'level_2' && effort.level !== 2) return
        if (effortFilter === 'level_3' && effort.level < 3) return

        // Apply Evidence Filter
        if (evidenceFilter === 'grade_a' && evidenceLevel < 5) return

        const citation = resolvePubMedCitation(m.id, m.display_name || m.name, hKey)
        const exactMechanism =
          (m as any).mechanism_of_action ||
          m.brief_description ||
          m.headline_benefit ||
          `Clinically proven intervention targeting ${hMeta.name}.`

        evaluatedCandidates.push({
          modality: m,
          clinicalEvidenceGrade: citation.clinicalEvidenceGrade,
          evidenceLevel,
          longevityImpactScore,
          effortLabel: effort.shortLabel,
          effortLevel: effort.level,
          timeEstimate: effort.timeEstimate,
          costLabel: cost.shortLabel,
          exactMechanism,
          pubMedTitle: citation.pubMedTitle,
          pubMedUrl: citation.pubMedUrl,
          pmid: citation.pmid
        })
      }
    })

    // Sort by:
    // 1. Lowest effort level (Level 1/2 friction first)
    // 2. Highest evidence level (Level 5 Human RCTs first)
    // 3. Highest Longevity Impact Score
    evaluatedCandidates.sort((a, b) => {
      if (a.effortLevel !== b.effortLevel) return a.effortLevel - b.effortLevel
      if (a.evidenceLevel !== b.evidenceLevel) return b.evidenceLevel - a.evidenceLevel
      return b.longevityImpactScore - a.longevityImpactScore
    })

    return {
      hallmark: hMeta,
      currentScore: gapItem.score,
      severity: gapItem.score < 25 ? 'critical' : 'moderate',
      recommendedModalities: evaluatedCandidates.slice(0, 4)
    }
  })
}

export const CANONICAL_HALLMARKS: HallmarkMeta[] = [
  // 1. PRIMARY HALLMARKS (Causes of Cellular Damage)
  {
    id: 'genomic_instability',
    name: 'Genomic Instability',
    shortName: 'Genomic Instability',
    tier: 'primary',
    tierLabel: 'Primary Damage',
    description: 'Accumulation of DNA lesions, somatic mutations, and chromosomal aneuploidy over time.',
    biologicalConsequence: 'Compromised cell survival, oncogenic transformations, and cellular functional decline.',
    colorHex: '#3B82F6', // Blue
    accentColor: 'text-blue-400'
  },
  {
    id: 'telomere_attrition',
    name: 'Telomere Attrition',
    shortName: 'Telomere Attrition',
    tier: 'primary',
    tierLabel: 'Primary Damage',
    description: 'Progressive shortening of protective chromosomal terminal caps with each replication cycle.',
    biologicalConsequence: 'Premature replicative exhaustion, Hayflick limit triggering, and permanent senescence.',
    colorHex: '#8B5CF6', // Purple
    accentColor: 'text-purple-400'
  },
  {
    id: 'epigenetic_alterations',
    name: 'Epigenetic Alterations',
    shortName: 'Epigenetic Drift',
    tier: 'primary',
    tierLabel: 'Primary Damage',
    description: 'Loss of chromatin structure, aberrant DNA methylation drift, and post-translational histone modifications.',
    biologicalConsequence: 'Transcriptional noise, aberrant gene reactivation, and loss of cellular identity.',
    colorHex: '#EC4899', // Pink
    accentColor: 'text-pink-400'
  },
  {
    id: 'loss_of_proteostasis',
    name: 'Loss of Proteostasis',
    shortName: 'Proteostasis',
    tier: 'primary',
    tierLabel: 'Primary Damage',
    description: 'Failure of protein folding chaperones, ubiquitin-proteasome degradation, and heat shock response.',
    biologicalConsequence: 'Toxic misfolded protein aggregation (amyloid plaques, tau tangles), and lysosomal overload.',
    colorHex: '#F59E0B', // Amber
    accentColor: 'text-amber-400'
  },
  {
    id: 'disabled_macroautophagy',
    name: 'Disabled Macroautophagy',
    shortName: 'Macroautophagy',
    tier: 'primary',
    tierLabel: 'Primary Damage',
    description: 'Decline in the lysosomal clearance of dysfunctional cellular organelles (mitophagy) and protein aggregates.',
    biologicalConsequence: 'Cellular clutter, buildup of damaged mitochondria, and impaired cellular recycling.',
    colorHex: '#10B981', // Emerald
    accentColor: 'text-emerald-400'
  },

  // 2. ANTAGONISTIC HALLMARKS (Hormetic Responses to Damage)
  {
    id: 'deregulated_nutrient_sensing',
    name: 'Deregulated Nutrient Sensing',
    shortName: 'Nutrient Sensing',
    tier: 'antagonistic',
    tierLabel: 'Antagonistic Response',
    description: 'Chronically elevated mTOR/IGF-1 signaling paired with blunted AMPK and Sirtuin metabolic defenses.',
    biologicalConsequence: 'Insulin resistance, metabolic inflexibility, ectopic lipid accumulation, and accelerated aging.',
    colorHex: '#06B6D4', // Cyan
    accentColor: 'text-cyan-400'
  },
  {
    id: 'mitochondrial_dysfunction',
    name: 'Mitochondrial Dysfunction',
    shortName: 'Mitochondria',
    tier: 'antagonistic',
    tierLabel: 'Antagonistic Response',
    description: 'Loss of respiratory chain efficiency, electron leakage, reduced ATP synthesis, and mt-DNA damage.',
    biologicalConsequence: 'Elevated reactive oxygen species (ROS), intracellular energy crises, and bioenergetic collapse.',
    colorHex: '#EAB308', // Yellow
    accentColor: 'text-yellow-400'
  },
  {
    id: 'cellular_senescence',
    name: 'Cellular Senescence',
    shortName: 'Senescence (Zombies)',
    tier: 'antagonistic',
    tierLabel: 'Antagonistic Response',
    description: 'Irreversible cell cycle arrest combined with a hyper-inflammatory Senescence-Associated Secretory Phenotype (SASP).',
    biologicalConsequence: 'SASP paracrine secretion poisoning neighboring healthy tissues and degrading extracellular matrix.',
    colorHex: '#EF4444', // Red
    accentColor: 'text-red-400'
  },

  // 3. INTEGRATIVE HALLMARKS (Phenotypic & Functional Decline)
  {
    id: 'stem_cell_exhaustion',
    name: 'Stem Cell Exhaustion',
    shortName: 'Stem Cells',
    tier: 'integrative',
    tierLabel: 'Integrative Decline',
    description: 'Depletion and functional senescence of resident progenitor and stem cell pools across organs.',
    biologicalConsequence: 'Impaired tissue regeneration, delayed wound healing, muscle atrophy, and immune frailty.',
    colorHex: '#6366F1', // Indigo
    accentColor: 'text-indigo-400'
  },
  {
    id: 'altered_intercellular_communication',
    name: 'Altered Intercellular Communication',
    shortName: 'Intercellular Signaling',
    tier: 'integrative',
    tierLabel: 'Integrative Decline',
    description: 'Deregulated neuroendocrine and autonomic signaling, compromised circadian rhythmicity, and matrix stiffness.',
    biologicalConsequence: 'Desynchronized biological clocks, blunted vagal nerve tone, and hormonal dysregulation.',
    colorHex: '#14B8A6', // Teal
    accentColor: 'text-teal-400'
  },
  {
    id: 'chronic_inflammation',
    name: 'Chronic Inflammation',
    shortName: 'Inflammaging',
    tier: 'integrative',
    tierLabel: 'Integrative Decline',
    description: 'Sterile, low-grade systemic chronic inflammation driven by NF-kB, NLRP3 inflammasome, and SASP.',
    biologicalConsequence: 'Endothelial dysfunction, arterial plaque buildup, microglial neuroinflammation, and tissue fibrosis.',
    colorHex: '#F97316', // Orange
    accentColor: 'text-orange-400'
  },
  {
    id: 'dysbiosis',
    name: 'Dysbiosis',
    shortName: 'Gut Microbiome',
    tier: 'integrative',
    tierLabel: 'Integrative Decline',
    description: 'Loss of gut microbiome diversity, depletion of short-chain fatty acid (SCFA) producers, and mucosal barrier breakdown.',
    biologicalConsequence: 'Endotoxemia, leaky gut, systemic immune stimulation, and compromised gut-brain axis.',
    colorHex: '#84CC16', // Lime
    accentColor: 'text-lime-400'
  }
]

/**
 * Normalizes hallmark strings from the modalities database
 */
export function normalizeHallmarkKey(rawStr: string): string | null {
  const clean = (rawStr || '').toLowerCase().trim()
  if (clean.includes('mitochon')) return 'mitochondrial_dysfunction'
  if (clean.includes('senescen')) return 'cellular_senescence'
  if (clean.includes('epigenet')) return 'epigenetic_alterations'
  if (clean.includes('proteosta')) return 'loss_of_proteostasis'
  if (clean.includes('nutrient') || clean.includes('sensing') || clean.includes('mtor') || clean.includes('insulin')) return 'deregulated_nutrient_sensing'
  if (clean.includes('inflam')) return 'chronic_inflammation'
  if (clean.includes('autophag')) return 'disabled_macroautophagy'
  if (clean.includes('genom') || clean.includes('dna')) return 'genomic_instability'
  if (clean.includes('telomer')) return 'telomere_attrition'
  if (clean.includes('stem')) return 'stem_cell_exhaustion'
  if (clean.includes('dysbio') || clean.includes('microbiome') || clean.includes('gut')) return 'dysbiosis'
  if (clean.includes('intercellular') || clean.includes('communicat') || clean.includes('circadian') || clean.includes('vagal')) return 'altered_intercellular_communication'
  return null
}

/**
 * Calculates real-time 12 Hallmarks Bio-Coverage based on active protocol tasks
 */
export function calculateHallmarkCoverage(
  tasks: DailyProtocolTask[],
  allModalities: Modality[],
  userProfile?: UserProfile | null,
  options?: CoverageCalculationOptions
): HallmarkCoverageReport {
  const evidenceFilter = options?.evidenceFilter || 'all'
  const simulatedIds = options?.simulatedModalityIds || new Set<string>()

  // 1. Build map of active modality IDs from scheduled/completed tasks
  const activeModMap = new Map<string, { count: number; modality: Modality }>()
  const simulatedModMap = new Map<string, { count: number; modality: Modality }>()
  const allModMap = new Map<string, Modality>()
  allModalities.forEach(m => {
    if (m.id) allModMap.set(m.id, m)
  })

  tasks.forEach(t => {
    // Skip benched/eliminated tasks
    if (t.status === 'skipped' && t.status_reason === 'Moved to Bench') return
    if (t.status === 'contraindicated') return

    const mId = t.modality_id || t.protocol_step?.modality_id
    const mod = (t as any).modality || t.protocol_step?.modality || (mId ? allModMap.get(mId) : null)
    if (mod && mod.id) {
      // If evidence filter is 'grade_a', filter by evidence_quality >= 5
      const evQuality = typeof mod.evidence_quality === 'number' ? mod.evidence_quality : 4
      if (evidenceFilter === 'grade_a' && evQuality < 5) return

      if (!activeModMap.has(mod.id)) {
        activeModMap.set(mod.id, { count: 1, modality: mod })
      } else {
        activeModMap.get(mod.id)!.count += 1
      }
    }
  })

  // Add simulated modalities if provided
  simulatedIds.forEach(sId => {
    const mod = allModMap.get(sId)
    if (mod) {
      const evQuality = typeof mod.evidence_quality === 'number' ? mod.evidence_quality : 4
      if (evidenceFilter === 'grade_a' && evQuality < 5) return
      simulatedModMap.set(mod.id, { count: 1, modality: mod })
    }
  })

  // 2. Initialize tracking map for 12 hallmarks
  const hallmarkMap: Record<string, HallmarkCoverageItem> = {}
  const simulatedScoresRaw: Record<string, number> = {}

  CANONICAL_HALLMARKS.forEach(meta => {
    hallmarkMap[meta.id] = {
      meta,
      score: 0,
      supportingModalities: [],
      isCovered: false,
      isModerate: false,
      isGap: true
    }
    simulatedScoresRaw[meta.id] = 0
  })

  // 3. Populate scores from active modalities
  activeModMap.forEach(({ count, modality }) => {
    const rawHallmarks: string[] = (modality as any).hallmarks_of_aging_impact || []
    const evidence = typeof modality.evidence_quality === 'number' ? modality.evidence_quality : 4
    const benefit = typeof modality.overall_longevity_benefit === 'number' ? modality.overall_longevity_benefit : 7
    const effort = getEffortMetadata(modality)

    // Base impact per modality = (Evidence Quality * 4.5) + (Benefit * 1.5)
    const baseImpact = Math.min(35, (evidence * 4.5) + (benefit * 1.5))

    rawHallmarks.forEach(rawH => {
      const hKey = normalizeHallmarkKey(rawH)
      if (hKey && hallmarkMap[hKey]) {
        const item = hallmarkMap[hKey]
        const kbEvidence = getModalityHallmarkEvidence(modality.id, hKey)
        const citation = resolvePubMedCitation(modality.id, modality.display_name || modality.name, hKey)

        const exactMechanism =
          kbEvidence?.mechanismSummary ||
          (modality as any).mechanism_of_action ||
          modality.brief_description ||
          modality.headline_benefit ||
          `Clinically proven intervention targeting ${item.meta.name}.`

        item.supportingModalities.push({
          modality,
          evidenceScore: evidence,
          effortLevel: effort.level,
          effortLabel: effort.shortLabel,
          frequency: modality.frequency || 'Daily',
          exactMechanism,
          clinicalEvidenceGrade: kbEvidence?.clinicalEvidenceGrade || citation.clinicalEvidenceGrade,
          pubMedTitle: kbEvidence?.pubMedTitle || citation.pubMedTitle,
          pubMedUrl: kbEvidence?.pubMedUrl || citation.pubMedUrl,
          pmid: kbEvidence?.pmid || citation.pmid
        })
        item.score += baseImpact
        simulatedScoresRaw[hKey] += baseImpact
      }
    })
  })

  // 3b. Populate additional scores from simulated modalities
  simulatedModMap.forEach(({ modality }) => {
    const rawHallmarks: string[] = (modality as any).hallmarks_of_aging_impact || []
    const evidence = typeof modality.evidence_quality === 'number' ? modality.evidence_quality : 4
    const benefit = typeof modality.overall_longevity_benefit === 'number' ? modality.overall_longevity_benefit : 7
    const baseImpact = Math.min(35, (evidence * 4.5) + (benefit * 1.5))

    rawHallmarks.forEach(rawH => {
      const hKey = normalizeHallmarkKey(rawH)
      if (hKey && simulatedScoresRaw[hKey] !== undefined) {
        simulatedScoresRaw[hKey] += baseImpact
      }
    })
  })

  // 4. Cap and normalize scores (0 to 100)
  let totalScoreSum = 0
  let totalSimulatedScoreSum = 0
  let coveredCount = 0
  let gapCount = 0

  let primarySum = 0, primaryCount = 0
  let antagonisticSum = 0, antagonisticCount = 0
  let integrativeSum = 0, integrativeCount = 0

  const simulatedHallmarkMap: Record<string, number> = {}

  const hallmarkItems: HallmarkCoverageItem[] = CANONICAL_HALLMARKS.map(meta => {
    const item = hallmarkMap[meta.id]
    // Diminishing returns formula for multiple modalities
    const rawScore = item.score
    const normalizedScore = Math.min(100, Math.round(100 * (1 - Math.exp(-rawScore / 45))))
    item.score = normalizedScore
    item.isCovered = normalizedScore >= 60
    item.isModerate = normalizedScore >= 30 && normalizedScore < 60
    item.isGap = normalizedScore < 30

    // Simulated score normalization
    const simRaw = simulatedScoresRaw[meta.id] || 0
    const simNormalized = Math.min(100, Math.round(100 * (1 - Math.exp(-simRaw / 45))))
    simulatedHallmarkMap[meta.id] = simNormalized
    totalSimulatedScoreSum += simNormalized

    if (item.isCovered) coveredCount++
    if (item.isGap) gapCount++

    totalScoreSum += normalizedScore

    if (meta.tier === 'primary') {
      primarySum += normalizedScore
      primaryCount++
    } else if (meta.tier === 'antagonistic') {
      antagonisticSum += normalizedScore
      antagonisticCount++
    } else {
      integrativeSum += normalizedScore
      integrativeCount++
    }

    return item
  })

  const overallCoverageScore = Math.round(totalScoreSum / 12)
  const simulatedCoverageScore = Math.round(totalSimulatedScoreSum / 12)
  const simulatedDelta = Math.max(0, simulatedCoverageScore - overallCoverageScore)

  const tierScores = {
    primary: primaryCount > 0 ? Math.round(primarySum / primaryCount) : 0,
    antagonistic: antagonisticCount > 0 ? Math.round(antagonisticSum / antagonisticCount) : 0,
    integrative: integrativeCount > 0 ? Math.round(integrativeSum / integrativeCount) : 0
  }

  return {
    overallCoverageScore,
    coveredCount,
    gapCount,
    hallmarkItems,
    hallmarkMap,
    tierScores,
    simulatedCoverageScore,
    simulatedDelta,
    simulatedHallmarkMap,
    evidenceFilterApplied: evidenceFilter
  }
}
