import { Modality, UserProfile, DailyProtocolTask } from '../types'

export type EffortLevel = 'level_1' | 'level_2' | 'level_3' | 'level_4' | 'level_5'

export interface EffortMetadata {
  level: number
  label: string
  shortLabel: string
  timeEstimate: string
  badgeColor: string
  description: string
  frictionFactors: string[]
}

export interface CostMetadata {
  score: number // 0 to 4
  label: string
  shortLabel: string
  dailyEstimate: string
  badgeColor: string
}

export interface SafetyMetadata {
  score: number // 1 to 5 (5 is safest)
  label: string
  badgeColor: string
}

export interface LongevityEvaluation {
  longevityImpactScore: number // 0 to 10
  actionRoiScore: number // 0 to 100
  effortMeta: EffortMetadata
  costMeta: CostMetadata
  safetyMeta: SafetyMetadata
  evidenceQualityScore: number // 1 to 5
  effectSizeScore: number // 1 to 5
}

export interface UserAdherenceEvaluation {
  status: 'thriving' | 'balanced' | 'struggling'
  completionRate: number // 0 to 100
  totalScheduled: number
  totalCompleted: number
  totalMissedOrSkipped: number
  highFrictionSkippedCount: number
  streakDays: number
  summaryHeadline: string
  summaryDetails: string
}

export interface NextBestActionRecommendation {
  type: 'next_best_action'
  modality: Modality
  title: string
  headlineReason: string
  detailedRationale: string
  longevityImpactScore: number
  roiScore: number
  effortMeta: EffortMetadata
  costMeta: CostMetadata
  actionType: 'add_to_today' | 'upgrade_cadence' | 'stack_synergy'
}

export interface EightyTwentySimplificationRecommendation {
  type: 'eighty_twenty_simplification'
  culpritModality: Modality
  title: string
  problemHeadline: string
  simplificationReason: string
  preservedCoreStack: string[]
  effortMeta: EffortMetadata
  actionType: 'bench_modality' | 'de_escalate_cadence'
}

/**
 * 1–5 Effort Matrix Normalization:
 * Level 1: Frictionless (0–2 min, zero prep, anywhere)
 * Level 2: Low-Friction Routine (2–10 min, habit stacking)
 * Level 3: Moderate Effort (15–45 min, dedicated time block, clothes/light gear)
 * Level 4: High Hormesis (Intense physical discomfort, gym gear, cold/sauna prep)
 * Level 5: Intensive / Multi-Day (Prolonged fast, peptide injection, clinical)
 */
export function getEffortMetadata(modalityOrLevel: Modality | string | number | undefined): EffortMetadata {
  let rawStr = ''
  let numVal = 0

  if (typeof modalityOrLevel === 'number') {
    numVal = modalityOrLevel
  } else if (typeof modalityOrLevel === 'string') {
    rawStr = modalityOrLevel.toLowerCase().trim()
  } else if (modalityOrLevel && typeof modalityOrLevel === 'object') {
    rawStr = ((modalityOrLevel.effort_level || '') + ' ' + (modalityOrLevel.name || '') + ' ' + (modalityOrLevel.category || '')).toLowerCase().trim()
  }

  // Keyword heuristic resolution
  // LEVEL 5: Intensive / Multi-Day (Prolonged Fasting 48h/72h, 5-Day FMD, Peptides, Reconstitution)
  if (
    numVal === 5 ||
    rawStr.includes('level_5') ||
    rawStr.includes('5-day') ||
    rawStr.includes('fmd') ||
    rawStr.includes('prolonged fast') ||
    rawStr.includes('water fast') ||
    rawStr.includes('48-hour') ||
    rawStr.includes('48h') ||
    rawStr.includes('72-hour') ||
    rawStr.includes('72h') ||
    rawStr.includes('73h') ||
    rawStr.includes('fisetin senolytic') ||
    rawStr.includes('dasatinib') ||
    rawStr.includes('senolytic blast') ||
    rawStr.includes('peptide') ||
    rawStr.includes('injection') ||
    rawStr.includes('subcutaneous') ||
    rawStr.includes('phlebotomy') ||
    rawStr.includes('hbot')
  ) {
    return {
      level: 5,
      label: 'Level 5: Intensive / Clinical',
      shortLabel: 'Lvl 5 (Intensive)',
      timeEstimate: 'Multi-Day / Clinical',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      description: 'Maximum discipline required, multi-day restriction, reconstitution, or medical equipment.',
      frictionFactors: ['High Willpower Cost', 'Preparation Complexity', 'Clinical Protocol']
    }
  }

  // LEVEL 4: High Hormesis & Prep (Cold Plunge, Heavy Lifting, VO2 Max, CGM)
  if (
    numVal === 4 ||
    rawStr.includes('level_4') ||
    rawStr.includes('cold plunge') ||
    rawStr.includes('ice bath') ||
    rawStr.includes('resistance') ||
    rawStr.includes('weightlifting') ||
    rawStr.includes('strength') ||
    rawStr.includes('vo2 max') ||
    rawStr.includes('vo2max') ||
    rawStr.includes('norwegian') ||
    rawStr.includes('hiit') ||
    rawStr.includes('cgm') ||
    rawStr.includes('continuous glucose') ||
    rawStr.includes('very_high')
  ) {
    return {
      level: 4,
      label: 'Level 4: High Hormesis & Prep',
      shortLabel: 'Lvl 4 (High Hormesis)',
      timeEstimate: '20–60 min',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'Intense physical discomfort, gym equipment, or thermal setup required.',
      frictionFactors: ['High Discomfort', 'Location / Setup Dependent', 'Physical Fatigue']
    }
  }

  // LEVEL 3: Moderate Effort (15–45 min time blocks: Sauna, Zone 2, Red Light, 20:4 Fasting)
  if (
    numVal === 3 ||
    rawStr.includes('level_3') ||
    rawStr.includes('sauna') ||
    rawStr.includes('zone 2') ||
    rawStr.includes('cardio') ||
    rawStr.includes('endurance') ||
    rawStr.includes('red light') ||
    rawStr.includes('photobiomodulation') ||
    rawStr.includes('mobility') ||
    rawStr.includes('foam roll') ||
    rawStr.includes('18:6') ||
    rawStr.includes('20:4') ||
    rawStr.includes('omad')
  ) {
    return {
      level: 3,
      label: 'Level 3: Moderate Effort',
      shortLabel: 'Lvl 3 (Moderate)',
      timeEstimate: '15–45 min',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      description: 'Dedicated time block, changing into workout clothes, or standard home devices.',
      frictionFactors: ['Time Commitment (15-45m)', 'Scheduled Block']
    }
  }

  // LEVEL 2: Low-Friction Routine (2–10 min, habit stacked onto meals/morning box)
  if (
    numVal === 2 ||
    rawStr.includes('level_2') ||
    rawStr.includes('morning protocol box') ||
    rawStr.includes('16:8') ||
    rawStr.includes('plant diversity') ||
    rawStr.includes('prebiotic fiber') ||
    rawStr.includes('protein pulse') ||
    rawStr.includes('box breath') ||
    rawStr.includes('4-7-8') ||
    rawStr.includes('physiological sigh') ||
    rawStr.includes('nsdr') ||
    rawStr.includes('meditation')
  ) {
    return {
      level: 2,
      label: 'Level 2: Low-Friction Routine',
      shortLabel: 'Lvl 2 (Routine)',
      timeEstimate: '2–10 min',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      description: 'Easily stacked onto meals or morning/evening routines with minimal prep.',
      frictionFactors: ['Habit Stacking', 'Light Routine']
    }
  }

  // LEVEL 1: Frictionless Micro-Habits & Single Pills (0–2 min, zero prep, anywhere)
  // Single pills/capsules (K2, Sulforaphane, Glycine, Magnesium, Apigenin, Creatine, Taurine, Vitamin D3, TMG, etc.)
  return {
    level: 1,
    label: 'Level 1: Frictionless',
    shortLabel: 'Lvl 1 (Frictionless)',
    timeEstimate: '0–2 min',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Anywhere, single pill or quick habit, zero setup, negligible cognitive load, instant compliance.',
    frictionFactors: ['Zero Friction', 'No Gear Needed']
  }
}

/**
 * Normalizes Cost Tier
 */
export function getCostMetadata(costTier: string | undefined): CostMetadata {
  const c = (costTier || '').toLowerCase().trim()

  if (c.includes('premium') || c.includes('expensive') || c.includes('$$$$') || c.includes('10+') || c.includes('peptide') || c.includes('hbot')) {
    return {
      score: 4,
      label: 'Premium ($10+/day)',
      shortLabel: 'Premium ($$$$)',
      dailyEstimate: '$10+ / day',
      badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-800'
    }
  }

  if (c.includes('high') || c.includes('$$$') || c.includes('3-10') || c.includes('urolithin') || c.includes('mitopure') || c.includes('cgm') || c.includes('ca-akg')) {
    return {
      score: 3,
      label: 'High ($3–$10/day)',
      shortLabel: 'High ($$$)',
      dailyEstimate: '$3–$10 / day',
      badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-800'
    }
  }

  if (c.includes('moderate') || c.includes('medium') || c.includes('$$') || c.includes('1-3') || c.includes('nmn') || c.includes('resveratrol') || c.includes('spermidine') || c.includes('sulforaphane')) {
    return {
      score: 2,
      label: 'Moderate ($1–$3/day)',
      shortLabel: 'Moderate ($$)',
      dailyEstimate: '$1–$3 / day',
      badgeColor: 'bg-slate-800 text-slate-200 border-slate-700'
    }
  }

  if (c.includes('low') || c.includes('$') || c.includes('<1')) {
    return {
      score: 1,
      label: 'Low (<$1/day)',
      shortLabel: 'Low ($)',
      dailyEstimate: '< $1 / day',
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
    }
  }

  return {
    score: 0,
    label: 'Free ($0)',
    shortLabel: 'Free ($0)',
    dailyEstimate: '$0 / day',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  }
}

/**
 * Normalizes Safety Level
 */
export function getSafetyMetadata(safetyLevel: string | undefined): SafetyMetadata {
  const s = (safetyLevel || '').toLowerCase().trim()

  if (s.includes('medical') || s.includes('prescription') || s.includes('supervision')) {
    return {
      score: 1,
      label: 'Medical Supervision / Rx',
      badgeColor: 'bg-rose-950 text-rose-300 border-rose-700'
    }
  }

  if (s.includes('high_risk') || s.includes('intense')) {
    return {
      score: 2,
      label: 'High Risk / Severe Hormesis',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-700'
    }
  }

  if (s.includes('moderate') || s.includes('caution')) {
    return {
      score: 3,
      label: 'Moderate Safety (Healthy Adults)',
      badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800'
    }
  }

  if (s.includes('low_risk')) {
    return {
      score: 4,
      label: 'Low Risk',
      badgeColor: 'bg-teal-950 text-teal-300 border-teal-800'
    }
  }

  return {
    score: 5,
    label: 'Extremely Safe / Foundational',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800'
  }
}

/**
 * Evaluates Comprehensive Multi-Dimensional Longevity Impact & Action ROI
 */
export function evaluateModalityLongevity(
  modality: Modality,
  userProfile?: UserProfile | null
): LongevityEvaluation {
  const effortMeta = getEffortMetadata(modality)
  const costMeta = getCostMetadata(modality.cost_tier)
  const safetyMeta = getSafetyMetadata(modality.safety_level)

  const evidenceQualityScore = typeof modality.evidence_quality === 'number'
    ? Math.max(1, Math.min(5, modality.evidence_quality))
    : 4

  const effectSizeScore = typeof (modality as any).effect_size === 'number'
    ? Math.max(1, Math.min(5, (modality as any).effect_size))
    : 4

  const baseBenefit = typeof modality.overall_longevity_benefit === 'number'
    ? Math.max(1, Math.min(10, modality.overall_longevity_benefit))
    : 8

  // Multi-Dimensional Longevity Impact (0 to 10 scale)
  const longevityImpactScore = Math.round(
    ((baseBenefit * 0.35) +
      (evidenceQualityScore * 2 * 0.30) +
      (effectSizeScore * 2 * 0.20) +
      (safetyMeta.score * 2 * 0.15)) * 10
  ) / 10

  // Action ROI Score = Impact / (Effort * Cost Multiplier)
  const costPenalty = 1 + (costMeta.score * 0.12)
  const effortWeight = Math.max(1, effortMeta.level)
  const rawRoi = (longevityImpactScore * 10) / (effortWeight * costPenalty)
  const actionRoiScore = Math.round(Math.min(99, Math.max(15, rawRoi * 4.5)))

  return {
    longevityImpactScore,
    actionRoiScore,
    effortMeta,
    costMeta,
    safetyMeta,
    evidenceQualityScore,
    effectSizeScore
  }
}

/**
 * Dynamically Evaluates User Adherence State over rolling window (Default: 14 days)
 */
export function evaluateUserAdherenceState(
  historyTasks: DailyProtocolTask[] = [],
  streakDays: number = 0
): UserAdherenceEvaluation {
  if (!historyTasks || historyTasks.length === 0) {
    return {
      status: 'balanced',
      completionRate: 100,
      totalScheduled: 0,
      totalCompleted: 0,
      totalMissedOrSkipped: 0,
      highFrictionSkippedCount: 0,
      streakDays,
      summaryHeadline: 'Building Your Protocol Routine',
      summaryDetails: 'Log your daily tasks to unlock adaptive Next Best Action and 80/20 recommendations.'
    }
  }

  const totalScheduled = historyTasks.length
  const completedTasks = historyTasks.filter(t => t.status === 'completed')
  const totalCompleted = completedTasks.length
  const missedTasks = historyTasks.filter(t => t.status === 'skipped' || t.status === 'missed' || (t.status === 'pending' && t.scheduled_date < new Date().toISOString().split('T')[0]))
  const totalMissedOrSkipped = missedTasks.length

  const completionRate = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 100

  // Count missed high-friction (Effort Level 4 or 5) tasks
  const highFrictionSkippedCount = missedTasks.filter(t => {
    const m = (t as any).modality || t.protocol_step?.modality || (t as any).loose_modality
    const effort = getEffortMetadata(m)
    return effort.level >= 4
  }).length

  if (completionRate >= 75 || streakDays >= 10) {
    return {
      status: 'thriving',
      completionRate,
      totalScheduled,
      totalCompleted,
      totalMissedOrSkipped,
      highFrictionSkippedCount,
      streakDays,
      summaryHeadline: '🔥 High Momentum & Flow State',
      summaryDetails: `You are crushing consistency with ${completionRate}% compliance over your recent protocol timeline.`
    }
  }

  if (completionRate < 60 || highFrictionSkippedCount >= 3) {
    return {
      status: 'struggling',
      completionRate,
      totalScheduled,
      totalCompleted,
      totalMissedOrSkipped,
      highFrictionSkippedCount,
      streakDays,
      summaryHeadline: '🧘 Protocol Friction Detected (80/20 Reset Available)',
      summaryDetails: `High-effort friction points are causing missed days (${completionRate}% compliance). Simplifying your stack will restore 100% adherence.`
    }
  }

  return {
    status: 'balanced',
    completionRate,
    totalScheduled,
    totalCompleted,
    totalMissedOrSkipped,
    highFrictionSkippedCount,
    streakDays,
    summaryHeadline: '⚖️ Steady Protocol Baseline',
    summaryDetails: `Maintaining a solid ${completionRate}% baseline routine.`
  }
}

/**
 * Generates Next Best Action (Progression Addition) when User is Thriving
 */
export function generateNextBestActionRecommendation(
  allModalities: Modality[],
  activeModalityIds: Set<string>,
  userProfile?: UserProfile | null
): NextBestActionRecommendation | null {
  // Find candidate modalities not currently in Today
  const candidates = allModalities.filter(m => !activeModalityIds.has(m.id))
  if (candidates.length === 0) return null

  // Score candidates based on multi-dimensional ROI, effort, and goal alignment
  const evaluated = candidates.map(m => {
    const evaluation = evaluateModalityLongevity(m, userProfile)
    return {
      modality: m,
      evaluation
    }
  })

  // Sort by highest action ROI (highest impact with lowest friction)
  evaluated.sort((a, b) => b.evaluation.actionRoiScore - a.evaluation.actionRoiScore)
  const topCandidate = evaluated[0]
  if (!topCandidate) return null

  const m = topCandidate.modality
  const evalData = topCandidate.evaluation

  return {
    type: 'next_best_action',
    modality: m,
    title: `Next Best Action: Add ${m.display_name || m.name}`,
    headlineReason: `High-ROI Synergy: ${evalData.effortMeta.shortLabel} • Longevity Score: ${evalData.longevityImpactScore}/10`,
    detailedRationale: m.headline_benefit || 'Proven clinical intervention that compounds your foundational longevity stack without adding excessive friction.',
    longevityImpactScore: evalData.longevityImpactScore,
    roiScore: evalData.actionRoiScore,
    effortMeta: evalData.effortMeta,
    costMeta: evalData.costMeta,
    actionType: 'add_to_today'
  }
}

/**
 * Generates 80/20 Simplification (De-escalation / Benching) when User is Struggling
 */
export function generateEightyTwentySimplificationRecommendation(
  activeTasks: DailyProtocolTask[],
  allModalities: Modality[]
): EightyTwentySimplificationRecommendation | null {
  if (!activeTasks || activeTasks.length === 0) return null

  // Map active modalities and find the highest friction item with missed sessions
  const activeModsMap = new Map<string, { modality: Modality; missedCount: number; effortLevel: number }>()

  activeTasks.forEach(t => {
    const m = (t as any).modality || t.protocol_step?.modality || (t as any).loose_modality
    if (!m || !m.id) return

    const effort = getEffortMetadata(m)
    const isMissed = t.status === 'skipped' || t.status === 'missed'

    if (!activeModsMap.has(m.id)) {
      activeModsMap.set(m.id, { modality: m, missedCount: isMissed ? 1 : 0, effortLevel: effort.level })
    } else if (isMissed) {
      activeModsMap.get(m.id)!.missedCount += 1
    }
  })

  // Find culprits: Highest effort (Level 4 or 5) with missed count > 0, or highest effort overall
  const culprits = Array.from(activeModsMap.values()).sort((a, b) => {
    if (b.missedCount !== a.missedCount) return b.missedCount - a.missedCount
    return b.effortLevel - a.effortLevel
  })

  const topCulprit = culprits[0]
  if (!topCulprit || topCulprit.effortLevel < 3) return null

  const culpritMod = topCulprit.modality
  const effortMeta = getEffortMetadata(culpritMod)

  // Identify preserved low-friction 80/20 core anchors
  const preservedCore = Array.from(activeModsMap.values())
    .filter(item => item.modality.id !== culpritMod.id && item.effortLevel <= 2)
    .map(item => item.modality.display_name || item.modality.name)
    .slice(0, 3)

  return {
    type: 'eighty_twenty_simplification',
    culpritModality: culpritMod,
    title: `80/20 Stack Reset: Bench ${culpritMod.display_name || culpritMod.name}`,
    problemHeadline: `High-Friction Barrier: ${effortMeta.label} (${topCulprit.missedCount} Misses)`,
    simplificationReason: `You've experienced friction completing ${culpritMod.display_name || culpritMod.name}. Moving it to your Bench for 14 days eliminates 80% of daily resistance while preserving your core foundation.`,
    preservedCoreStack: preservedCore.length > 0 ? preservedCore : ['Morning Sunlight', 'Morning Stack', 'Hydration Target'],
    effortMeta,
    actionType: 'bench_modality'
  }
}
