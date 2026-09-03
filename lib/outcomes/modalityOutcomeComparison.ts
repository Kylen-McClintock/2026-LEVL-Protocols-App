import { Modality, UserProfile } from '@/lib/types'

export interface OutcomeStudy {
  title: string
  url: string
  notes?: string
}

export interface OutcomeComparisonItem {
  id: string
  name: string
  category: string
  scoreA: number
  scoreB: number
  isTargetedA: boolean
  isTargetedB: boolean
  advantage: 'A' | 'B' | 'tie' | 'none'
  delta: number
  isUserPriority: boolean
  userPriorityScore?: number
  studiesA?: OutcomeStudy[]
  studiesB?: OutcomeStudy[]
}

export interface ModalityRelationship {
  type: 'synergy' | 'conflict' | 'redundancy' | 'complementary' | 'neutral'
  badgeLabel: string
  badgeColor: string
  headline: string
  rationale: string
  recommendation: 'stack' | 'swap' | 'caution' | 'either'
}

export interface ModalityComparisonReport {
  items: OutcomeComparisonItem[]
  relationship: ModalityRelationship
  verdict: string
  topAdvantagesA: string[]
  topAdvantagesB: string[]
}

// Canonical dictionary mapping synonyms, snake_case IDs, and human titles
export const CANONICAL_OUTCOMES: Record<string, { id: string; name: string; category: string }> = {
  // Sleep & Recovery
  'sleep_latency': { id: 'sleep_latency', name: 'Sleep Latency (Onset Speed)', category: 'Sleep & Recovery' },
  'sleep latency': { id: 'sleep_latency', name: 'Sleep Latency (Onset Speed)', category: 'Sleep & Recovery' },
  'sleep_quality': { id: 'sleep_quality', name: 'Deep Sleep Quality & Continuity', category: 'Sleep & Recovery' },
  'sleep quality': { id: 'sleep_quality', name: 'Deep Sleep Quality & Continuity', category: 'Sleep & Recovery' },
  'sleep': { id: 'sleep_quality', name: 'Deep Sleep Quality & Continuity', category: 'Sleep & Recovery' },
  'waking_restedness': { id: 'waking_restedness', name: 'Waking Restedness & Refreshment', category: 'Sleep & Recovery' },
  'waking restedness': { id: 'waking_restedness', name: 'Waking Restedness & Refreshment', category: 'Sleep & Recovery' },
  'recovery': { id: 'recovery', name: 'Systemic & Muscular Recovery', category: 'Sleep & Recovery' },
  'soreness': { id: 'soreness', name: 'Delayed Soreness (DOMS) Reduction', category: 'Sleep & Recovery' },

  // Cognition & Mental State
  'focus': { id: 'focus', name: 'Mental Focus & Sustained Attention', category: 'Cognition & Mind' },
  'brain_fog': { id: 'brain_fog', name: 'Brain Fog Clearance & Sharpness', category: 'Cognition & Mind' },
  'brain fog': { id: 'brain_fog', name: 'Brain Fog Clearance & Sharpness', category: 'Cognition & Mind' },
  'brain fog & mood': { id: 'brain_fog', name: 'Brain Fog Clearance & Sharpness', category: 'Cognition & Mind' },
  'mental_clarity': { id: 'brain_fog', name: 'Brain Fog Clearance & Sharpness', category: 'Cognition & Mind' },
  'mental clarity': { id: 'brain_fog', name: 'Brain Fog Clearance & Sharpness', category: 'Cognition & Mind' },
  'memory': { id: 'memory', name: 'Working Memory & Neuroplasticity', category: 'Cognition & Mind' },
  'alertness': { id: 'alertness', name: 'Cognitive Alertness & Vigilance', category: 'Cognition & Mind' },
  'calmness': { id: 'calmness', name: 'Nervous System Calmness & Ease', category: 'Cognition & Mind' },
  'stress': { id: 'stress', name: 'Stress & Cortisol Regulation', category: 'Cognition & Mind' },
  'stress_resilience': { id: 'stress', name: 'Stress & Cortisol Regulation', category: 'Cognition & Mind' },
  'anxiety': { id: 'calmness', name: 'Nervous System Calmness & Ease', category: 'Cognition & Mind' },
  'mood': { id: 'mood', name: 'Mood Elevation & Emotional State', category: 'Cognition & Mind' },
  'emotional_resilience': { id: 'emotional_resilience', name: 'Emotional Resilience & Stability', category: 'Cognition & Mind' },
  'emotional resilience': { id: 'emotional_resilience', name: 'Emotional Resilience & Stability', category: 'Cognition & Mind' },
  'motivation': { id: 'motivation', name: 'Dopaminergic Motivation & Drive', category: 'Cognition & Mind' },
  'productivity': { id: 'productivity', name: 'Executive Function & Productivity', category: 'Cognition & Mind' },
  'creativity': { id: 'creativity', name: 'Divergent Creativity & Flow', category: 'Cognition & Mind' },

  // Physical Performance & Vitality
  'energy': { id: 'energy', name: 'Physical Energy & Cellular ATP', category: 'Physical & Vitality' },
  'strength': { id: 'strength', name: 'Muscular Strength & Hypertrophy', category: 'Physical & Vitality' },
  'endurance': { id: 'endurance', name: 'Aerobic Capacity & Endurance (VO2 Max)', category: 'Physical & Vitality' },
  'joint_comfort': { id: 'joint_comfort', name: 'Joint Comfort & Cartilage Protection', category: 'Physical & Vitality' },
  'joint comfort': { id: 'joint_comfort', name: 'Joint Comfort & Cartilage Protection', category: 'Physical & Vitality' },
  'joint_pain': { id: 'joint_comfort', name: 'Joint Comfort & Cartilage Protection', category: 'Physical & Vitality' },
  'joint_health': { id: 'joint_comfort', name: 'Joint Comfort & Cartilage Protection', category: 'Physical & Vitality' },
  'pain': { id: 'pain', name: 'Analgesia & Pain Modulation', category: 'Physical & Vitality' },
  'bone_density': { id: 'bone_density', name: 'Bone Mineral Density & Skeletal Strength', category: 'Physical & Vitality' },

  // Systemic & Metabolic Health
  'digestive_comfort': { id: 'digestive_comfort', name: 'Gut Barrier & Digestive Comfort', category: 'Systemic & Metabolic' },
  'digestive comfort': { id: 'digestive_comfort', name: 'Gut Barrier & Digestive Comfort', category: 'Systemic & Metabolic' },
  'digestion': { id: 'digestive_comfort', name: 'Gut Barrier & Digestive Comfort', category: 'Systemic & Metabolic' },
  'digestive_health': { id: 'digestive_comfort', name: 'Gut Barrier & Digestive Comfort', category: 'Systemic & Metabolic' },
  'satiety': { id: 'satiety', name: 'Satiety & Appetite Regulation', category: 'Systemic & Metabolic' },
  'cravings': { id: 'satiety', name: 'Satiety & Appetite Regulation', category: 'Systemic & Metabolic' },
  'blood_sugar': { id: 'blood_sugar', name: 'Glycemic Control & Insulin Sensitivity', category: 'Systemic & Metabolic' },
  'blood_pressure': { id: 'blood_pressure', name: 'Endothelial & Blood Pressure Regulation', category: 'Systemic & Metabolic' },
  'immune_resilience': { id: 'immune_resilience', name: 'Immune Resilience & Defense', category: 'Systemic & Metabolic' },
  'immune resilience': { id: 'immune_resilience', name: 'Immune Resilience & Defense', category: 'Systemic & Metabolic' },
  'immunity': { id: 'immune_resilience', name: 'Immune Resilience & Defense', category: 'Systemic & Metabolic' },
  'skin_clarity': { id: 'skin_clarity', name: 'Skin Quality & Collagen Density', category: 'Systemic & Metabolic' },
  'skin clarity': { id: 'skin_clarity', name: 'Skin Quality & Collagen Density', category: 'Systemic & Metabolic' },
  'skin_quality': { id: 'skin_clarity', name: 'Skin Quality & Collagen Density', category: 'Systemic & Metabolic' },
  'libido': { id: 'libido', name: 'Hormonal Vitality & Libido', category: 'Systemic & Metabolic' },
  'social_connection': { id: 'social_connection', name: 'Social Connection & Oxytocin Tone', category: 'Systemic & Metabolic' },
  'social connection': { id: 'social_connection', name: 'Social Connection & Oxytocin Tone', category: 'Systemic & Metabolic' }
}

/**
 * Normalizes any outcome string to a canonical ID and human name
 */
export function normalizeOutcomeKey(rawKey: string): { id: string; name: string; category: string } {
  const clean = rawKey.trim().toLowerCase().replace(/[_\s]+/g, ' ')
  const cleanSnake = rawKey.trim().toLowerCase().replace(/[_\s]+/g, '_')

  if (CANONICAL_OUTCOMES[clean]) return CANONICAL_OUTCOMES[clean]
  if (CANONICAL_OUTCOMES[cleanSnake]) return CANONICAL_OUTCOMES[cleanSnake]

  // Fallback: format to clean title
  const formattedName = rawKey
    .replace(/[_\s]+/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')

  return {
    id: cleanSnake,
    name: formattedName,
    category: 'Functional Longevity'
  }
}

/**
 * Resolves a modality's score and studies for a given canonical outcome.
 * Uses exact functional_impacts if available; otherwise falls back to primary_outcome,
 * secondary_outcomes, functional_outcomes_to_track, and category mechanisms.
 */
export function resolveModalityOutcomeScore(
  modality: Modality,
  canonicalId: string
): { score: number; isTargeted: boolean; studies?: OutcomeStudy[] } {
  // 1. Direct match in functional_impacts
  if (modality.functional_impacts) {
    for (const [key, val] of Object.entries(modality.functional_impacts)) {
      const norm = normalizeOutcomeKey(key)
      if (norm.id === canonicalId) {
        return {
          score: val.score,
          isTargeted: val.score >= 4,
          studies: val.studies
        }
      }
    }
  }

  // 2. Derive score from primary_outcome / secondary_outcomes / functional_outcomes_to_track
  const primaryClean = (modality.primary_outcome || '').toLowerCase()
  const normPrimary = normalizeOutcomeKey(primaryClean)
  if (normPrimary.id === canonicalId || primaryClean.includes(canonicalId.replace(/_/g, ' '))) {
    return {
      score: 8,
      isTargeted: true,
      studies: modality.scientific_references?.map(r => ({ title: r.title, url: r.url }))
    }
  }

  // Secondary outcomes check
  const secondaryList = (modality.secondary_outcomes || []).map(s => s.toLowerCase())
  if (secondaryList.some(s => s.includes(canonicalId) || canonicalId.includes(s.replace(/\s+/g, '_')))) {
    return { score: 7, isTargeted: true }
  }

  // functional_outcomes_to_track check
  const trackList = (modality.functional_outcomes_to_track || []).map(t => normalizeOutcomeKey(t).id)
  if (trackList.includes(canonicalId)) {
    return { score: 7, isTargeted: true }
  }

  // Category & mechanism fallbacks for the 69 modalities without pre-seeded impacts
  const category = (modality.category || '').toLowerCase()
  const name = (modality.name || '').toLowerCase()
  const desc = ((modality.brief_description || '') + ' ' + (modality.mechanism_of_action || '')).toLowerCase()

  if (canonicalId === 'strength' && (category === 'fitness' || name.includes('squat') || name.includes('curl') || name.includes('lift') || name.includes('bfr'))) {
    return { score: 8, isTargeted: true }
  }
  if (canonicalId === 'joint_comfort' && (name.includes('knees') || name.includes('tibialis') || name.includes('squat') || desc.includes('joint') || desc.includes('cartilage'))) {
    return { score: 7, isTargeted: true }
  }
  if (canonicalId === 'sleep_latency' && (name.includes('sleep') || name.includes('wind down') || name.includes('4-7-8') || desc.includes('sleep onset') || desc.includes('latency'))) {
    return { score: 8, isTargeted: true }
  }
  if (canonicalId === 'calmness' && (category === 'mindfulness' || name.includes('breathing') || name.includes('meditation') || desc.includes('parasympathetic') || desc.includes('vagal'))) {
    return { score: 8, isTargeted: true }
  }
  if (canonicalId === 'blood_sugar' && (name.includes('glucose') || name.includes('cgm') || name.includes('fasting') || desc.includes('glycemic') || desc.includes('insulin'))) {
    return { score: 8, isTargeted: true }
  }
  if (canonicalId === 'energy' && (desc.includes('mitochondri') || desc.includes('atp') || desc.includes('energy'))) {
    return { score: 6, isTargeted: true }
  }

  // Truly unimpacted domain
  return { score: 0, isTargeted: false }
}

/**
 * Detects synergistic or conflicting interactions between two modalities
 */
export function evaluateModalityRelationship(modA: Modality, modB: Modality): ModalityRelationship {
  const idA = modA.id.toLowerCase()
  const idB = modB.id.toLowerCase()
  const nameA = (modA.display_name || modA.name).toLowerCase()
  const nameB = (modB.display_name || modB.name).toLowerCase()

  // 1. Check explicit conflict / contraindication
  const avoidListA = [
    ...(Array.isArray(modA.antagonism_notes?.avoidCombiningWith) ? modA.antagonism_notes.avoidCombiningWith : []),
    ...(Array.isArray(modA.contraindications) ? modA.contraindications : [])
  ].map(s => s.toLowerCase())

  const avoidListB = [
    ...(Array.isArray(modB.antagonism_notes?.avoidCombiningWith) ? modB.antagonism_notes.avoidCombiningWith : []),
    ...(Array.isArray(modB.contraindications) ? modB.contraindications : [])
  ].map(s => s.toLowerCase())

  const hasConflictA = avoidListA.some(item => idB.includes(item) || nameB.includes(item) || item.includes(idB) || item.includes(nameB))
  const hasConflictB = avoidListB.some(item => idA.includes(item) || nameA.includes(item) || item.includes(idA) || item.includes(nameA))

  // Hardcoded physiological timing conflicts
  const isColdA = idA.includes('cold') || nameA.includes('cold') || nameA.includes('ice bath')
  const isColdB = idB.includes('cold') || nameB.includes('cold') || nameB.includes('ice bath')
  const isHypertrophyA = idA.includes('hypertrophy') || idA.includes('resistance') || idA.includes('strength') || nameA.includes('bfr')
  const isHypertrophyB = idB.includes('hypertrophy') || idB.includes('resistance') || idB.includes('strength') || nameB.includes('bfr')

  if ((isColdA && isHypertrophyB) || (isColdB && isHypertrophyA)) {
    return {
      type: 'conflict',
      badgeLabel: 'Timing Blunting Caution',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      headline: 'Acute Cold Blunts Resistance Training Adaptations',
      rationale: 'Cold water immersion immediately after resistance training attenuates acute mTOR signaling, muscle protein synthesis, and long-term hypertrophy. Separate cold immersion by at least 4–6 hours post-lifting.',
      recommendation: 'caution'
    }
  }

  if (hasConflictA || hasConflictB) {
    const conflictNote = modA.antagonism_notes?.rationale || modB.antagonism_notes?.rationale || 'Documented pharmacological antagonism or competitive pathway interference.'
    return {
      type: 'conflict',
      badgeLabel: 'Interaction Caution',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      headline: 'Known Mechanistic Conflict or Antagonism',
      rationale: conflictNote,
      recommendation: 'caution'
    }
  }

  // 2. Check explicit synergy
  const pairsA = Array.isArray(modA.synergy_notes?.pairsWellWith) ? modA.synergy_notes.pairsWellWith.map((s: string) => s.toLowerCase()) : []
  const pairsB = Array.isArray(modB.synergy_notes?.pairsWellWith) ? modB.synergy_notes.pairsWellWith.map((s: string) => s.toLowerCase()) : []
  const hasSynergyA = pairsA.some((item: string) => idB.includes(item) || nameB.includes(item) || item.includes(idB) || item.includes(nameB))
  const hasSynergyB = pairsB.some((item: string) => idA.includes(item) || nameA.includes(item) || item.includes(idA) || item.includes(nameA))

  // Hardcoded physiological high-synergy pairs
  const isSleepA = idA.includes('apigenin') || idA.includes('magnesium') || idA.includes('theanine') || idA.includes('glycine') || idA.includes('walker')
  const isSleepB = idB.includes('apigenin') || idB.includes('magnesium') || idB.includes('theanine') || idB.includes('glycine') || idB.includes('walker')
  const isSaunaA = idA.includes('sauna') || nameA.includes('sauna')
  const isSaunaB = idB.includes('sauna') || nameB.includes('sauna')
  const isNADA = idA.includes('nmn') || idA.includes('nad') || idA.includes('nr')
  const isNADB = idB.includes('tmg') || idB.includes('resveratrol') || idB.includes('apigenin')
  const isD3K2 = (idA.includes('vitamin_d') && idB.includes('k2')) || (idB.includes('vitamin_d') && idA.includes('k2'))

  if (hasSynergyA || hasSynergyB || (isSleepA && isSleepB && idA !== idB) || (isSaunaA && isColdB) || (isSaunaB && isColdA) || (isNADA && isNADB) || isD3K2) {
    const synRationale = modA.synergy_notes?.rationale || modB.synergy_notes?.rationale || 
      (isSaunaA && isColdB || isSaunaB && isColdA ? 'Contrast therapy stimulates vascular perfusion, heat shock proteins, and rapid noradrenaline release.' : 
      isSleepA && isSleepB ? 'Multi-target GABAergic and NMDA modulation accelerates sleep latency and extends slow-wave deep sleep.' : 
      isD3K2 ? 'Vitamin D3 accelerates calcium absorption while K2 directs calcium into bone matrix and prevents arterial calcification.' :
      'These modalities hit complementary pathways that multiply functional efficacy.')

    return {
      type: 'synergy',
      badgeLabel: 'High Synergy Stack',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      headline: 'Synergistic Biological Pairing',
      rationale: synRationale,
      recommendation: 'stack'
    }
  }

  // 3. Check redundancy (exact same category and same primary mechanism)
  if (modA.category === modB.category && modA.primary_outcome === modB.primary_outcome && modA.category) {
    return {
      type: 'redundancy',
      badgeLabel: 'Mechanistic Overlap',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      headline: 'Parallel Biological Pathways',
      rationale: `Both ${nameA} and ${nameB} primarily target ${modA.primary_outcome || 'the same outcome'}. Stacking both may yield diminishing returns; prioritize the one with higher evidence or lower friction.`,
      recommendation: 'swap'
    }
  }

  // 4. Complementary & distinct
  return {
    type: 'complementary',
    badgeLabel: 'Complementary Vectors',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    headline: 'Distinct Physiological Targets',
    rationale: `${nameA} and ${nameB} address different physiological domains without pathway cross-talk, making them safe to use in tandem.`,
    recommendation: 'either'
  }
}

/**
 * Main Comparison Engine: compiles side-by-side outcome matrices,
 * sorts by user priority goals, computes advantage deltas, and synthesizes verdict.
 */
export function compareModalitiesOutcomes(
  modA: Modality,
  modB: Modality,
  userProfile?: UserProfile | null
): ModalityComparisonReport {
  // Collect all unique outcome keys
  const rawKeySet = new Set<string>([
    ...(modA.functional_outcomes_to_track || []),
    ...(modB.functional_outcomes_to_track || []),
    ...Object.keys(modA.functional_impacts || {}),
    ...Object.keys(modB.functional_impacts || {}),
    modA.primary_outcome || '',
    modB.primary_outcome || ''
  ])

  // Map to canonical outcomes
  const canonicalMap = new Map<string, { id: string; name: string; category: string }>()
  rawKeySet.forEach(raw => {
    if (!raw || raw.trim().length === 0) return
    const norm = normalizeOutcomeKey(raw)
    if (!canonicalMap.has(norm.id)) {
      canonicalMap.set(norm.id, norm)
    }
  })

  // User preference mapping
  const userPrefs = userProfile?.outcome_preference_scores || {}
  const userGoals = (userProfile?.primary_goals || []).map(g => g.toLowerCase())

  // Build comparison items
  const items: OutcomeComparisonItem[] = []
  canonicalMap.forEach(norm => {
    const resA = resolveModalityOutcomeScore(modA, norm.id)
    const resB = resolveModalityOutcomeScore(modB, norm.id)

    // Skip outcome if neither modality impacts it
    if (!resA.isTargeted && !resB.isTargeted) return

    const diff = resA.score - resB.score
    let advantage: 'A' | 'B' | 'tie' | 'none' = 'tie'
    if (diff > 1) advantage = 'A'
    else if (diff < -1) advantage = 'B'
    else if (resA.isTargeted !== resB.isTargeted) advantage = resA.isTargeted ? 'A' : 'B'

    const userPrefScore = typeof userPrefs[norm.id] === 'number' ? userPrefs[norm.id] : 0
    const matchesGoal = userGoals.some(g => g.includes(norm.id.replace(/_/g, ' ')) || norm.name.toLowerCase().includes(g))
    const isUserPriority = userPrefScore >= 7 || matchesGoal

    items.push({
      id: norm.id,
      name: norm.name,
      category: norm.category,
      scoreA: resA.score,
      scoreB: resB.score,
      isTargetedA: resA.isTargeted,
      isTargetedB: resB.isTargeted,
      advantage,
      delta: Math.abs(diff),
      isUserPriority,
      userPriorityScore: userPrefScore,
      studiesA: resA.studies,
      studiesB: resB.studies
    })
  })

  // Sort items: User priorities first, then by largest advantage delta
  items.sort((a, b) => {
    if (a.isUserPriority && !b.isUserPriority) return -1
    if (!a.isUserPriority && b.isUserPriority) return 1
    if ((b.userPriorityScore || 0) !== (a.userPriorityScore || 0)) {
      return (b.userPriorityScore || 0) - (a.userPriorityScore || 0)
    }
    return b.delta - a.delta
  })

  // Evaluate overall relationship
  const relationship = evaluateModalityRelationship(modA, modB)

  // Identify top advantages
  const advantagesA = items
    .filter(i => i.advantage === 'A')
    .map(i => `${i.name} (${i.scoreA}/10 vs ${i.scoreB > 0 ? `${i.scoreB}/10` : 'None'})`)

  const advantagesB = items
    .filter(i => i.advantage === 'B')
    .map(i => `${i.name} (${i.scoreB}/10 vs ${i.scoreA > 0 ? `${i.scoreA}/10` : 'None'})`)

  const expName = modA.display_name || modA.name
  const actName = modB.display_name || modB.name

  // Synthesize executive trade-off verdict
  let verdict = ''
  if (relationship.type === 'synergy') {
    verdict = `High Synergy Stack: ${expName} and ${actName} target complementary biological pathways. Instead of choosing between them, stacking both delivers synergistic benefits across ${items.slice(0, 2).map(i => i.name).join(' and ')}.`
  } else if (relationship.type === 'conflict') {
    verdict = `Caution Required: ${relationship.headline}. ${relationship.rationale}`
  } else if (relationship.type === 'redundancy') {
    const winner = (modA.evidence_quality || 0) >= (modB.evidence_quality || 0) ? expName : actName
    verdict = `Overlapping Mechanisms: Both primarily target ${modA.primary_outcome || 'the same outcome'}. Choose ${winner} for higher clinical effect size and protocol simplicity.`
  } else {
    const aLead = advantagesA[0] || `${expName}'s core protocol`
    const bLead = advantagesB[0] || `${actName}'s core protocol`
    verdict = `Trade-off Verdict: Choose ${expName} if your focus is ${aLead}. Choose ${actName} if your priority is ${bLead}.`
  }

  return {
    items,
    relationship,
    verdict,
    topAdvantagesA: advantagesA,
    topAdvantagesB: advantagesB
  }
}
