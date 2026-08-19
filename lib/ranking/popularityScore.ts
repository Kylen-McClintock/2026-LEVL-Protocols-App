import { Modality, Protocol } from '@/lib/types'

/**
 * Cultural Popularity & Efficacy Index (CPEI) Multi-Signal Model
 * 
 * Formula:
 * CPEI Score = (Proven Efficacy * 45%) + (Search & Purchase Discourse * 35%) + (Bio-Optimizer Consensus * 20%)
 */

// Baseline Market & Discourse scores (0-100) based on global search velocity, supplement purchase volume, and hardware penetration
const MODALITY_MARKET_DISCOURSE_MAP: Record<string, number> = {
  // Foundational Fitness & Photobiology
  'zone_2_cardio': 96,
  'vo2_max_intervals': 92,
  'resistance_training': 98,
  'morning_sunlight': 96,
  'morning_sunlight_photobiology': 96,

  // Supplements - High purchase & search staples
  'creatine_monohydrate': 99,
  'magnesium_l_threonate': 96,
  'magnesium_glycinate': 95,
  'magnesium_breakthrough': 94,
  'omega_3_fish_oil': 97,
  'vitamin_d3_k2': 97,
  'whey_protein_isolate': 96,
  'nmn_nicotinamide_mononucleotide': 93,
  'nr_nicotinamide_riboside': 88,
  'berberine_hcl': 92,
  'apple_cider_vinegar': 89,
  'fisetin': 80,
  'quercetin': 82,
  'resveratrol_trans': 86,
  'urolithin_a': 85,
  'glynac': 84,
  'ashwagandha_ksm66': 91,
  'l_theanine': 90,
  'apigenin': 83,
  'hyaluronic_acid': 82,
  'collagen_peptides': 94,
  'dhea': 78,
  'taurine': 89,
  'glycine': 87,

  // Environmental Hormesis & Hardware
  'hyperthermic_sauna': 94,
  'finnish_sauna': 94,
  'cold_water_immersion': 98,
  'cold_plunge': 98,
  'red_light_photobiomodulation': 91,
  'red_light_therapy': 91,
  'pemf_therapy': 82,
  'ewot_oxygen_therapy': 78,
  'hyperbaric_oxygen_therapy': 85,

  // Behavioral, Breathwork & Fasting
  'post_meal_walk': 90,
  'soleus_pushups': 88,
  'intermittent_fasting_16_8': 95,
  'cyclic_sighing': 91,
  'box_breathing': 89,
  '4_7_8_breathing': 90,
  'wim_hof_breathing': 93,
  'dark_cool_sleep_environment': 94,
  'caffeine_cutoff_10h': 92,
  'flossing_tongue_scraping': 85,
}

// Pioneer Stack Presence (how many premier bio-optimizer stacks feature this habit)
const PIONEER_STACK_PRESENCE_MAP: Record<string, number> = {
  // In 4+ major stacks (Blueprint, Attia, Huberman, Sinclair, Patrick)
  'zone_2_cardio': 100,
  'resistance_training': 100,
  'morning_sunlight': 100,
  'morning_sunlight_photobiology': 100,
  'creatine_monohydrate': 98,
  'magnesium_l_threonate': 98,
  'omega_3_fish_oil': 98,
  'vitamin_d3_k2': 98,
  'hyperthermic_sauna': 96,
  'cold_water_immersion': 95,
  'cold_plunge': 95,
  'post_meal_walk': 94,

  // In 2-3 stacks
  'nmn_nicotinamide_mononucleotide': 92,
  'berberine_hcl': 90,
  'resveratrol_trans': 88,
  'vo2_max_intervals': 95,
  'red_light_photobiomodulation': 88,
  'cyclic_sighing': 90,
  '4_7_8_breathing': 88,
  'caffeine_cutoff_10h': 92,
  'dark_cool_sleep_environment': 94,
  'fisetin': 85,
  'quercetin': 85,
  'taurine': 88,
  'glycine': 86,
  'urolithin_a': 84,
  'glynac': 84,
  'collagen_peptides': 88,
  'ashwagandha_ksm66': 85,
}

/**
 * Calculates the Cultural Popularity & Efficacy Index (CPEI) score (0–100) for a modality.
 */
export function calculateModalityPopularityScore(modality: Modality): number {
  const normId = (modality.id || '').toLowerCase().replace(/[^a-z0-9_]/g, '_')
  const normName = (modality.name || '').toLowerCase().replace(/[^a-z0-9_]/g, '_')

  // 1. Proven Efficacy (45% weight)
  // evidence_quality (1-5) -> 20-100 base
  const evidenceScore = Math.min(100, Math.max(20, ((modality.evidence_quality || 3) / 5) * 100))
  // overall_longevity_benefit (1-5 or 0-100)
  const benefitRaw = typeof modality.overall_longevity_benefit === 'number' 
    ? (modality.overall_longevity_benefit <= 5 ? modality.overall_longevity_benefit * 20 : modality.overall_longevity_benefit)
    : 70
  const efficacyScore = (evidenceScore * 0.6) + (benefitRaw * 0.4)

  // 2. Search & Purchase Discourse (35% weight)
  const matchedMarketScore = MODALITY_MARKET_DISCOURSE_MAP[normId] ||
    Object.entries(MODALITY_MARKET_DISCOURSE_MAP).find(([key]) => normId.includes(key) || normName.includes(key))?.[1] ||
    ((modality as any).popularity_placeholder ? Math.min(95, (modality as any).popularity_placeholder * 10) : 72)

  // 3. Bio-Optimizer Pioneer Consensus (20% weight)
  const matchedPioneerScore = PIONEER_STACK_PRESENCE_MAP[normId] ||
    Object.entries(PIONEER_STACK_PRESENCE_MAP).find(([key]) => normId.includes(key) || normName.includes(key))?.[1] ||
    (efficacyScore >= 90 ? 80 : 70)

  // Weighted Composite
  const totalScore = (efficacyScore * 0.45) + (matchedMarketScore * 0.35) + (matchedPioneerScore * 0.20)
  return Math.round(totalScore * 10) / 10
}

/**
 * Calculates popularity score for protocols based on author prominence, modality count, and aggregate efficacy.
 */
export function calculateProtocolPopularityScore(protocol: Protocol | any): number {
  const normId = (protocol.id || '').toLowerCase()
  
  if (normId.includes('bryan_johnson') || normId.includes('blueprint')) return 98.5
  if (normId.includes('peter_attia') || normId.includes('centenarian')) return 97.2
  if (normId.includes('huberman')) return 96.0
  if (normId.includes('matthew_walker')) return 94.5
  if (normId.includes('david_sinclair')) return 93.8
  if (normId.includes('gary_brecka')) return 91.5
  if (normId.includes('valter_longo')) return 90.2
  if (normId.includes('wim_hof')) return 89.5
  if (normId.includes('casey_means')) return 88.0
  if (normId.includes('dayspring')) return 87.5

  const stepCount = (protocol.steps || protocol.protocol_steps || []).length
  return Math.min(90, 75 + Math.min(15, stepCount * 2))
}
