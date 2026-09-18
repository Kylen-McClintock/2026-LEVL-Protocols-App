import { Modality, DailyProtocolTask } from '@/lib/types'

/**
 * High-precision formulation, route-of-administration, and pharmacological logic.
 * Prevents naive keyword collisions (e.g. flagging a topical Vitamin C skin serum as blunting muscle hypertrophy).
 */

const TOPICAL_CATEGORY_KEYWORDS = [
  'skincare',
  'dermatology',
  'skin',
  'cosmetic',
  'cosmetics',
  'beauty',
  'topical',
  'personal care'
]

const TOPICAL_FORMULATION_KEYWORDS = [
  'serum',
  'serums',
  'cream',
  'creams',
  'lotion',
  'lotions',
  'topical',
  'sunscreen',
  'spf',
  'cleanser',
  'moisturizer',
  'moisturizers',
  'eye cream',
  'eye serum',
  'facial',
  'skin',
  'skincare',
  'ointment',
  'gel',
  'balm',
  'retinol',
  'tretinoin',
  'c e ferulic',
  'ferulic',
  'hyaluronic acid',
  'face oil',
  'exfoliant',
  'peel',
  'toner',
  'epidermal',
  'dermal',
  'shampoo',
  'conditioner',
  'body wash',
  'face wash',
  'face mask',
  'sheet mask'
]

const DECAF_KEYWORDS = [
  'decaf',
  'decaffeinated',
  'caffeine-free',
  'caffeine free',
  'non-caffeinated',
  'herbal tea',
  'chamomile',
  'peppermint',
  'rooibos',
  'hibiscus'
]

const PURE_DIAGNOSTIC_OR_SURVEILLANCE_KEYWORDS = [
  'oura',
  'whoop',
  'apple watch',
  'wearable',
  'tracker',
  'monitor',
  'cgm',
  'dexcom',
  'sensor',
  'scale',
  'scan',
  'mri',
  'cpet',
  'dexa',
  'test kit',
  'blood panel',
  'blood test',
  'lab test'
]

/**
 * Determines whether a modality is a topical skincare or cosmetic application.
 * Topical agents exert localized epidermal/dermal action and have negligible systemic
 * absorption. They DO NOT interact with intramuscular ROS, PGC-1alpha, mTORC1, or gut transporters.
 */
export function isTopicalOrSkincareModality(
  modality?: Modality | null,
  task?: DailyProtocolTask | null
): boolean {
  if (!modality && !task) return false

  const cat = (modality?.category || '').toLowerCase()
  const modType = (modality?.modality_type || '').toLowerCase()
  const logType = ((modality as any)?.logging_type || '').toLowerCase()

  // 1. Explicit categories or types
  if (TOPICAL_CATEGORY_KEYWORDS.some(k => cat.includes(k) || modType.includes(k) || logType.includes(k))) {
    return true
  }

  // 2. Name, title, instructions, and custom dose inspection
  const combinedText = [
    modality?.name || '',
    modality?.display_name || '',
    modality?.slug || '',
    modality?.brief_description || '',
    modality?.instructions || '',
    modality?.dose_or_exposure || '',
    task?.protocol_step?.instructions || '',
    (task?.protocol_step as any)?.title || '',
    task?.custom_dose || ''
  ].join(' ').toLowerCase()

  return TOPICAL_FORMULATION_KEYWORDS.some(kw => {
    // Match whole words or standard phrases
    const regex = new RegExp(`\\b${kw}\\b`, 'i')
    return regex.test(combinedText)
  })
}

/**
 * Checks if a coffee/tea/beverage modality is decaffeinated or herbal.
 */
export function isDecafOrNonCaffeinatedModality(
  modality?: Modality | null,
  task?: DailyProtocolTask | null
): boolean {
  if (!modality && !task) return false

  const combinedText = [
    modality?.name || '',
    modality?.display_name || '',
    modality?.slug || '',
    modality?.brief_description || '',
    task?.protocol_step?.instructions || '',
    (task?.protocol_step as any)?.title || '',
    task?.custom_dose || ''
  ].join(' ').toLowerCase()

  return DECAF_KEYWORDS.some(kw => combinedText.includes(kw))
}

/**
 * Identifies passive monitoring, diagnostic tools, environmental adjustments, or behavioral cutoffs
 * that do not introduce an active pharmacological or physiological stressor.
 */
export function isPassiveOrDiagnosticModality(
  modality?: Modality | null,
  task?: DailyProtocolTask | null
): boolean {
  if (!modality && !task) return false

  const cat = (modality?.category || '').toLowerCase()
  if (cat.includes('diagnostic') || cat.includes('tracking') || cat.includes('biomarker')) {
    return true
  }

  const combinedText = [
    modality?.name || '',
    modality?.display_name || '',
    modality?.slug || '',
    modality?.brief_description || '',
    (task?.protocol_step as any)?.title || ''
  ].join(' ').toLowerCase()

  return PURE_DIAGNOSTIC_OR_SURVEILLANCE_KEYWORDS.some(kw => combinedText.includes(kw))
}

/**
 * Evaluates whether two modalities constitute a biologically valid conflict,
 * filtering out false-positive keyword collisions based on route of administration,
 * formulation, and physiological plausibility.
 */
export function isBiologicallyPlausibleConflict(
  ruleId: string,
  ruleType: string,
  triggerModality: Modality,
  targetModality: Modality,
  triggerTask?: DailyProtocolTask,
  targetTask?: DailyProtocolTask
): boolean {
  // 1. Passive / Diagnostic / Sleep hygiene habits never clash biochemically
  if (
    isPassiveOrDiagnosticModality(triggerModality, triggerTask) ||
    isPassiveOrDiagnosticModality(targetModality, targetTask)
  ) {
    return false
  }

  // 2. Hypertrophy Blunting & Exercise ROS Scavenging (e.g. vitc_vs_workout_ros)
  // High-dose oral antioxidants (Vitamin C >1g, Vit E) blunt muscular ROS signaling.
  // Topical facial serums, creams, and lotions have ZERO systemic effect on skeletal muscle.
  if (
    ruleType === 'hypertrophy_blunting' ||
    ruleType === 'ros_blunting' ||
    ruleId === 'vitc_vs_workout_ros'
  ) {
    if (
      isTopicalOrSkincareModality(triggerModality, triggerTask) ||
      isTopicalOrSkincareModality(targetModality, targetTask)
    ) {
      return false // Skin serums do NOT blunt muscle hypertrophy!
    }
  }

  // 3. Mitochondrial Complex I Blunting (Metformin / Berberine vs. Cardio)
  // Applies strictly to systemic ingestion.
  if (
    ruleType === 'mitochondrial_blunting' ||
    ruleId === 'metformin_vs_zone2' ||
    ruleId === 'berberine_vs_zone2'
  ) {
    if (
      isTopicalOrSkincareModality(triggerModality, triggerTask) ||
      isTopicalOrSkincareModality(targetModality, targetTask)
    ) {
      return false
    }
  }

  // 4. Circadian & Adenosine Disruption (Caffeine vs. Sleep)
  // Under-eye caffeine serums (e.g. The Ordinary Caffeine 5%) or decaf coffees do NOT cause central adenosine receptor blockade.
  if (
    ruleType === 'circadian_disruption' &&
    (ruleId === 'late_caffeine_sleep' || ruleId.includes('caffeine'))
  ) {
    if (
      isTopicalOrSkincareModality(triggerModality, triggerTask) ||
      isDecafOrNonCaffeinatedModality(triggerModality, triggerTask)
    ) {
      return false // Eye creams and decaf do not disrupt central sleep architecture
    }
  }

  // 5. Intestinal Absorption Competition (DMT-1: Iron vs. Calcium/Zinc)
  // Intestinal mucosal transporter competition requires oral gut co-ingestion.
  if (
    ruleType === 'absorption_competition' ||
    ruleId === 'iron_calcium_zinc_competition' ||
    ruleId === 'zinc_without_copper'
  ) {
    if (
      isTopicalOrSkincareModality(triggerModality, triggerTask) ||
      isTopicalOrSkincareModality(targetModality, targetTask)
    ) {
      return false // Topical zinc sunscreen or magnesium lotion does not compete for gut DMT-1
    }
  }

  return true
}
