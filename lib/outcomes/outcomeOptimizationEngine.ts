import { Modality, DailyProtocolTask, OutcomeDimension, UserProfile } from '../types'

export interface AntagonisticClash {
  id: string
  title: string
  outcomeId: string
  severity: 'high' | 'moderate'
  modalityA: { id: string; name: string; timing?: string }
  modalityB: { id: string; name: string; timing?: string }
  biologicalMechanism: string
  recommendedFix: string
  canAutoFixSchedule?: boolean
}

export interface OutcomeTargetConfig {
  targetDialedIn: number // e.g. 80 (80/20 Pareto) or 95 (Power User)
  maxEffortAllowance: number // e.g. 35 (Minimalist) or 85 (Power User)
  importancePriority: 'primary' | 'secondary' | 'neutral'
}

export interface OutcomeOptimizationState {
  outcomeId: string
  outcomeName: string
  dialedInScore: number // 0-100
  percentileRank: number // e.g. 92nd percentile
  effortScore: number // 0-100
  status: 'green' | 'yellow' | 'red'
  statusLabel: string
  statusDescription: string
  badgeBg: string
  badgeBorder: string
  badgeText: string
  activeModalities: Modality[]
  contributingTaskCount: number
  targetConfig: OutcomeTargetConfig
  clashes: AntagonisticClash[]
  tierBreakdown: {
    foundational: { modality: Modality; weight: number }[]
    synergistic: { modality: Modality; weight: number }[]
    marginal: { modality: Modality; weight: number }[]
  }
}

// Foundational Tier-1 anchor modalities for key functional outcome dimensions
// These represent the steep 80% portion of the Pareto curve
const FOUNDATIONAL_PILLARS: Record<string, string[]> = {
  skin_clarity: [
    'mineral_sunscreen_spf50',
    'sunscreen',
    'micro_retinoid_tretinoin',
    'tretinoin',
    'retinol',
    'retinoid',
    'antioxidant_vitamin_c_ferulic',
    'vitamin_c',
    'ceramide_ectoin_barrier_cream'
  ],
  focus: [
    'l_theanine_caffeine',
    'caffeine',
    'morning_sunlight',
    'cyclic_sighing',
    'box_breathing',
    'modafinil',
    'alpha_gpc',
    'vyvanse',
    'adderall'
  ],
  mental_clarity: [
    'intermittent_fasting_16_8',
    'morning_sunlight',
    'electrolytes',
    'zone_2_cardio',
    'cyclic_sighing'
  ],
  sleep_quality: [
    'magnesium_l_threonate',
    'sleep_routine',
    'dark_cool_bedroom',
    'blue_light_blockers',
    'wind_down_routine',
    'apigenin',
    'glycine'
  ],
  sleep_latency: [
    'magnesium_l_threonate',
    'wind_down_routine',
    'yoga_nidra',
    'nsdr',
    'breathing_4_7_8',
    'blue_light_blockers'
  ],
  stress: [
    'cyclic_sighing',
    'physiological_sigh',
    'yoga_nidra',
    'nsdr',
    'box_breathing',
    'sauna',
    'cold_shower'
  ],
  emotional_resilience: [
    'cyclic_sighing',
    'yoga_nidra',
    'zone_2_cardio',
    'meditation',
    'cold_plunge'
  ],
  energy: [
    'morning_sunlight',
    'zone_2_cardio',
    'coq10_ubiquinol',
    'creatine_monohydrate',
    'nad_booster',
    'nmn'
  ],
  strength: [
    'ppl_push_day',
    'ppl_pull_day',
    'ppl_legs_day',
    'resistance_training',
    'creatine_monohydrate',
    'whey_protein'
  ],
  soreness: [
    'tart_cherry',
    'curcumin',
    'active_recovery_walk',
    'sauna',
    'foam_rolling'
  ],
  endurance: [
    'zone_2_cardio',
    'vo2_max_4x4_intervals',
    'sauna',
    'beetroot_juice'
  ],
  digestive_comfort: [
    'l_glutamine',
    'bone_broth',
    'probiotics',
    'psyllium_husk',
    'intermittent_fasting_16_8'
  ]
}

/**
 * Detects known biological antagonisms and timing clashes across active tasks & modalities
 */
export function detectAntagonisticClashes(
  activeModalities: Modality[],
  activeTasks: DailyProtocolTask[] = []
): AntagonisticClash[] {
  const clashes: AntagonisticClash[] = []
  const modIds = new Set(activeModalities.map(m => (m.id || '').toLowerCase()))
  const modSlugs = new Set(activeModalities.map(m => (m.slug || '').toLowerCase()))
  const hasMod = (key: string) => {
    const k = key.toLowerCase()
    return Array.from(modIds).some(id => id.includes(k)) || Array.from(modSlugs).some(s => s.includes(k))
  }

  // Helper to find task timing
  const getTaskTiming = (key: string): string => {
    const t = activeTasks.find(task => {
      const mId = (task.modality_id || task.loose_modality?.id || '').toLowerCase()
      return mId.includes(key.toLowerCase())
    })
    return t?.timing_slot || 'scheduled'
  }

  // 1. Cold Immersion vs Hypertrophy / Resistance Training
  const hasResistance = hasMod('resistance') || hasMod('strength') || hasMod('ppl_') || hasMod('hypertrophy')
  const hasCold = hasMod('cold_plunge') || hasMod('ice_bath') || hasMod('cold_immersion')
  if (hasResistance && hasCold) {
    const coldTiming = getTaskTiming('cold')
    const liftTiming = getTaskTiming('ppl') || getTaskTiming('resistance')
    
    // Clash if in the same afternoon or workout window
    const sameWindow = coldTiming === liftTiming || (coldTiming.includes('workout') || coldTiming.includes('afternoon'))
    if (sameWindow) {
      clashes.push({
        id: 'clash_cold_hypertrophy',
        title: 'Cold Immersion Blunting Hypertrophy Adaptation',
        outcomeId: 'strength',
        severity: 'high',
        modalityA: { id: 'cold_plunge', name: 'Cold Immersion / Plunge', timing: coldTiming },
        modalityB: { id: 'resistance_training', name: 'Resistance Training / PPL', timing: liftTiming },
        biologicalMechanism: 'Immediate cold exposure (<4 hours post-lifting) suppresses muscle protein synthesis, satellite cell activity, and mTOR phosphorylation, reducing long-term muscle gains.',
        recommendedFix: 'Shift Cold Plunge to early mornings before lifting, or onto rest / recovery days.',
        canAutoFixSchedule: true
      })
    }
  }

  // 2. High-Dose Antioxidants vs Exercise Adaptations
  const hasEndurance = hasMod('zone_2') || hasMod('vo2_max') || hasMod('endurance')
  const hasHighAntioxidant = hasMod('antioxidant_vitamin_c') || (hasMod('vitamin_c') && hasMod('ferulic'))
  if (hasEndurance && hasHighAntioxidant) {
    const cTiming = getTaskTiming('vitamin_c')
    const cardioTiming = getTaskTiming('zone_2') || getTaskTiming('vo2_max')
    if (cTiming === cardioTiming || (cTiming.includes('afternoon') && cardioTiming.includes('afternoon'))) {
      clashes.push({
        id: 'clash_antioxidant_endurance',
        title: 'High-Dose Antioxidants Neutralizing Hormetic Adaptation',
        outcomeId: 'endurance',
        severity: 'moderate',
        modalityA: { id: 'antioxidant_vitamin_c_ferulic', name: 'Antioxidant Vitamin C+E', timing: cTiming },
        modalityB: { id: 'zone_2_cardio', name: 'Cardio / Endurance', timing: cardioTiming },
        biologicalMechanism: 'Supra-physiological antioxidants taken immediately around aerobic exercise scavenge reactive oxygen species (ROS) that are necessary triggers for mitochondrial biogenesis.',
        recommendedFix: 'Take topical or oral antioxidants exclusively in the morning or >4 hours away from training.',
        canAutoFixSchedule: true
      })
    }
  }

  // 3. Late Stimulants vs Sleep Latency & Quality
  const hasStimulant = hasMod('caffeine') || hasMod('modafinil') || hasMod('pre_workout') || hasMod('vyvanse')
  if (hasStimulant) {
    const stimTiming = getTaskTiming('caffeine') || getTaskTiming('modafinil') || getTaskTiming('pre_workout')
    const isLate = stimTiming.includes('evening') || stimTiming.includes('late_afternoon') || stimTiming.includes('bed')
    if (isLate) {
      clashes.push({
        id: 'clash_stimulant_sleep',
        title: 'Late Central Nervous System Stimulant Impairing Sleep Architecture',
        outcomeId: 'sleep_quality',
        severity: 'high',
        modalityA: { id: 'caffeine_stimulant', name: 'Caffeine / Nootropic Stimulant', timing: stimTiming },
        modalityB: { id: 'sleep_routine', name: 'Sleep Architecture & Rest', timing: 'night' },
        biologicalMechanism: 'Adenosine receptor antagonism with an active half-life of 5–7 hours fragments stage-3 slow-wave deep sleep and elevates nocturnal resting heart rate.',
        recommendedFix: 'Establish a strict stimulant cut-off at least 9–10 hours prior to planned bedtime.',
        canAutoFixSchedule: true
      })
    }
  }

  // 4. Low-pH Exfoliants & GHK-Cu Copper Peptides Chemical Interference
  const hasAhaBha = hasMod('exfoliating') || hasMod('glycolic') || hasMod('salicylic') || hasMod('bha')
  const hasGhkCu = hasMod('ghk_cu') || hasMod('copper_peptide')
  if (hasAhaBha && hasGhkCu) {
    const acidTiming = getTaskTiming('exfoliat') || getTaskTiming('bha')
    const ghkTiming = getTaskTiming('ghk_cu')
    if (acidTiming === ghkTiming && acidTiming.includes('evening')) {
      clashes.push({
        id: 'clash_acid_ghk_cu',
        title: 'Low-pH Chemical Deactivation of Copper Tripeptide-1',
        outcomeId: 'skin_clarity',
        severity: 'high',
        modalityA: { id: 'exfoliating_acid', name: 'AHA / BHA Chemical Exfoliant', timing: acidTiming },
        modalityB: { id: 'topical_ghk_cu_serum', name: 'Topical GHK-Cu Copper Peptides', timing: ghkTiming },
        biologicalMechanism: 'Low-pH exfoliating tonics (pH < 4.0) break the copper chelation bond in GHK-Cu, oxidizing the active peptide and rendering both ingredients ineffective.',
        recommendedFix: 'Separate across our 4-day skin cycling matrix: Exfoliation on Night 1, GHK-Cu on Nights 3 & 4.',
        canAutoFixSchedule: true
      })
    }
  }

  return clashes
}

/**
 * Calculates the 0-100 Dialed-In Score and Percentile Rank for a given outcome dimension
 */
export function calculateOutcomeDialedInScore(
  outcomeId: string,
  activeModalities: Modality[],
  allClashes: AntagonisticClash[] = []
): { score: number; percentile: number; foundationalCount: number; boosterCount: number; marginalCount: number } {
  const normOutcomeId = outcomeId.toLowerCase().trim()
  const relevantMods = activeModalities.filter(m => {
    const prim = (m.primary_outcome || '').toLowerCase().replace(/\s+/g, '_')
    const secs = (m.secondary_outcomes || []).map(s => s.toLowerCase().replace(/\s+/g, '_'))
    const funcs = (m.functional_outcomes_to_track || []).map(f => f.toLowerCase().replace(/\s+/g, '_'))
    return prim === normOutcomeId || secs.includes(normOutcomeId) || funcs.includes(normOutcomeId)
  })

  if (relevantMods.length === 0) {
    return { score: 15, percentile: 20, foundationalCount: 0, boosterCount: 0, marginalCount: 0 }
  }

  const foundationalKeys = FOUNDATIONAL_PILLARS[normOutcomeId] || []
  let foundationalCount = 0
  let boosterCount = 0
  let marginalCount = 0

  let rawPoints = 0

  relevantMods.forEach((m) => {
    const mId = (m.id || '').toLowerCase()
    const isFoundational = foundationalKeys.some(k => mId.includes(k))

    if (isFoundational) {
      foundationalCount++
      // The first foundational habits give massive gains (30-45 pts each)
      if (foundationalCount === 1) rawPoints += 45
      else if (foundationalCount === 2) rawPoints += 25
      else rawPoints += 10
    } else {
      // Synergistic or marginal modalities
      if (rawPoints < 80) {
        boosterCount++
        rawPoints += 12
      } else {
        marginalCount++
        // Logarithmic diminishing returns past 80
        const roomLeft = 100 - rawPoints
        rawPoints += Math.max(1.5, roomLeft * 0.18)
      }
    }
  })

  // Antagonistic clash deductions
  const relevantClashes = allClashes.filter(c => c.outcomeId.toLowerCase() === normOutcomeId)
  relevantClashes.forEach(c => {
    rawPoints -= c.severity === 'high' ? 22 : 12
  })

  const finalScore = Math.max(10, Math.min(99, Math.round(rawPoints)))
  
  // Percentile mapping (relative to biohacking / health optimization population)
  let percentile = 50
  if (finalScore >= 95) percentile = 98
  else if (finalScore >= 90) percentile = 93
  else if (finalScore >= 80) percentile = 82
  else if (finalScore >= 70) percentile = 68
  else if (finalScore >= 50) percentile = 45
  else percentile = Math.round(finalScore * 0.7)

  return {
    score: finalScore,
    percentile,
    foundationalCount,
    boosterCount,
    marginalCount
  }
}

/**
 * Calculates the 0-100 Effort, Time, and Financial Friction Score
 */
export function calculateOutcomeEffortScore(
  outcomeId: string,
  activeModalities: Modality[]
): number {
  const normOutcomeId = outcomeId.toLowerCase().trim()
  const relevantMods = activeModalities.filter(m => {
    const prim = (m.primary_outcome || '').toLowerCase().replace(/\s+/g, '_')
    const secs = (m.secondary_outcomes || []).map(s => s.toLowerCase().replace(/\s+/g, '_'))
    const funcs = (m.functional_outcomes_to_track || []).map(f => f.toLowerCase().replace(/\s+/g, '_'))
    return prim === normOutcomeId || secs.includes(normOutcomeId) || funcs.includes(normOutcomeId)
  })

  if (relevantMods.length === 0) return 0

  let effortPoints = 0

  relevantMods.forEach(m => {
    const mType = (m.modality_type || m.category || '').toLowerCase()
    const desc = ((m.dose_or_exposure || '') + ' ' + (m.timing_summary || '')).toLowerCase()

    // Base friction by modality type
    if (mType.includes('resistance') || mType.includes('exercise') || mType.includes('fitness')) {
      effortPoints += 24 // high time burden (45-60m)
    } else if (mType.includes('device') || mType.includes('mask') || mType.includes('sauna') || mType.includes('cold')) {
      effortPoints += 16 // 10-20m physical setup
    } else if (mType.includes('peptide') || mType.includes('inject')) {
      effortPoints += 14 // reconstitution, hygiene, sterile needles
    } else if (mType.includes('skincare') || mType.includes('topical') || mType.includes('cream')) {
      effortPoints += 8 // application & drying wait
    } else if (mType.includes('breath') || mType.includes('meditation') || mType.includes('nidra')) {
      effortPoints += 10 // 5-15m mental stillness
    } else {
      effortPoints += 5 // standard oral supplement
    }

    // Additional friction if multi-dose or specific duration mentioned
    if (desc.includes('30 min') || desc.includes('45 min') || desc.includes('hour')) {
      effortPoints += 8
    } else if (desc.includes('10 min') || desc.includes('15 min')) {
      effortPoints += 4
    }
  })

  return Math.min(100, Math.round(effortPoints))
}

/**
 * Evaluates Status (Green, Yellow, Red) based on the user's declared target box:
 * - 🟢 Green: Within user target zone (dialed-in goal met, effort within budget, zero clashes)
 * - 🟡 Yellow: Falling just a little short of target (-5 to -18 pts), OR non-destructive deep stacking past diminishing returns
 * - 🔴 Red: Significant under-coverage (>18 pts short on priority goal), OR active antagonistic biological clash
 */
export function evaluateOutcomeStatus(
  dialedInScore: number,
  effortScore: number,
  targetConfig: OutcomeTargetConfig,
  clashes: AntagonisticClash[] = []
): {
  status: 'green' | 'yellow' | 'red'
  label: string
  description: string
  badgeBg: string
  badgeBorder: string
  badgeText: string
} {
  // Immediate RED on any active antagonistic clash
  if (clashes.length > 0) {
    const clash = clashes[0]
    return {
      status: 'red',
      label: 'Antagonistic Clash Detected',
      description: clash.title,
      badgeBg: 'bg-rose-950/80',
      badgeBorder: 'border-rose-500/50',
      badgeText: 'text-rose-300'
    }
  }

  const scoreDeficit = targetConfig.targetDialedIn - dialedInScore
  const effortOverage = effortScore - targetConfig.maxEffortAllowance

  // 1. Check severe deficit (RED)
  if (scoreDeficit > 18) {
    return {
      status: 'red',
      label: 'Significant Under-Coverage',
      description: `Falling ${scoreDeficit} pts below your ambition target (${targetConfig.targetDialedIn}). Foundational pillars missing.`,
      badgeBg: 'bg-rose-950/80',
      badgeBorder: 'border-rose-500/50',
      badgeText: 'text-rose-300'
    }
  }

  // 2. Check mild deficit (YELLOW) - "falling just a little short of goal"
  if (scoreDeficit > 0 && scoreDeficit <= 18) {
    return {
      status: 'yellow',
      label: 'Slight Gap to Target',
      description: `Just ${scoreDeficit} pts shy of your goal (${targetConfig.targetDialedIn}). 1 additional booster reaches your target.`,
      badgeBg: 'bg-amber-950/80',
      badgeBorder: 'border-amber-500/50',
      badgeText: 'text-amber-300'
    }
  }

  // 3. Check non-destructive over-coverage or high effort (YELLOW)
  if (effortOverage > 15 && dialedInScore >= targetConfig.targetDialedIn) {
    return {
      status: 'yellow',
      label: 'Deep Power Stack • High Effort',
      description: `Dialed-in goal surpassed (${dialedInScore}/100), but effort (${effortScore}) exceeds baseline budget. Non-destructive.`,
      badgeBg: 'bg-amber-950/80',
      badgeBorder: 'border-amber-500/50',
      badgeText: 'text-amber-300'
    }
  }

  // 4. In Target Zone (GREEN)
  return {
    status: 'green',
    label: dialedInScore >= 90 ? 'Elite Coverage • In Target Zone' : 'Optimal 80/20 • Target Met',
    description: `Perfect calibration. Dialed-in score (${dialedInScore}/100) satisfies ambition within your effort budget (${effortScore}/100).`,
    badgeBg: 'bg-emerald-950/80',
    badgeBorder: 'border-emerald-500/50',
    badgeText: 'text-emerald-300'
  }
}

/**
 * Resolves personal target configuration from UserProfile or defaults to smart 80/20 standards
 */
export function resolveUserTargetConfig(
  outcomeId: string,
  userProfile: UserProfile | null
): OutcomeTargetConfig {
  const normId = outcomeId.toLowerCase().trim()
  const primaryGoals = (userProfile?.primary_goals || []).map(g => g.toLowerCase().replace(/\s+/g, '_'))
  const isPrimary = primaryGoals.some(g => g.includes(normId) || normId.includes(g))

  // Allow custom targets stored in profile outcome_preference_scores if available
  const customTarget = userProfile?.outcome_preference_scores?.[`target_${normId}`]
  const customEffort = userProfile?.outcome_preference_scores?.[`effort_${normId}`]

  if (customTarget && customEffort) {
    return {
      targetDialedIn: customTarget,
      maxEffortAllowance: customEffort,
      importancePriority: isPrimary ? 'primary' : 'secondary'
    }
  }

  // Smart defaults based on discipline & goals
  const discipline = userProfile?.discipline_level_0_99 ?? 75
  const isPowerUser = discipline >= 85

  if (isPowerUser) {
    return {
      targetDialedIn: isPrimary ? 95 : 88,
      maxEffortAllowance: isPrimary ? 85 : 70,
      importancePriority: isPrimary ? 'primary' : 'secondary'
    }
  }

  // Standard 80/20 Pareto default
  return {
    targetDialedIn: isPrimary ? 85 : 75,
    maxEffortAllowance: isPrimary ? 45 : 35,
    importancePriority: isPrimary ? 'primary' : 'secondary'
  }
}

/**
 * Aggregates full optimization state across all relevant outcome dimensions
 */
export function getOutcomeOptimizationSummary(
  activeModalities: Modality[],
  activeTasks: DailyProtocolTask[],
  outcomeDimensions: OutcomeDimension[],
  userProfile: UserProfile | null
): OutcomeOptimizationState[] {
  const allClashes = detectAntagonisticClashes(activeModalities, activeTasks)

  return outcomeDimensions.map(dim => {
    const targetConfig = resolveUserTargetConfig(dim.id, userProfile)
    const dialedIn = calculateOutcomeDialedInScore(dim.id, activeModalities, allClashes)
    const effortScore = calculateOutcomeEffortScore(dim.id, activeModalities)
    const clashesForDim = allClashes.filter(c => c.outcomeId.toLowerCase() === dim.id.toLowerCase())
    const statusEval = evaluateOutcomeStatus(dialedIn.score, effortScore, targetConfig, clashesForDim)

    const normId = dim.id.toLowerCase().trim()
    const relevantMods = activeModalities.filter(m => {
      const prim = (m.primary_outcome || '').toLowerCase().replace(/\s+/g, '_')
      const secs = (m.secondary_outcomes || []).map(s => s.toLowerCase().replace(/\s+/g, '_'))
      const funcs = (m.functional_outcomes_to_track || []).map(f => f.toLowerCase().replace(/\s+/g, '_'))
      return prim === normId || secs.includes(normId) || funcs.includes(normId)
    })

    const taskCount = activeTasks.filter(t => {
      const mId = t.modality_id || t.loose_modality?.id
      return relevantMods.some(m => m.id === mId)
    }).length

    const foundationalKeys = FOUNDATIONAL_PILLARS[normId] || []
    const foundational: { modality: Modality; weight: number }[] = []
    const synergistic: { modality: Modality; weight: number }[] = []
    const marginal: { modality: Modality; weight: number }[] = []

    relevantMods.forEach(m => {
      const isFoundational = foundationalKeys.some(k => (m.id || '').toLowerCase().includes(k))
      if (isFoundational) foundational.push({ modality: m, weight: 35 })
      else if (foundational.length + synergistic.length < 3) synergistic.push({ modality: m, weight: 15 })
      else marginal.push({ modality: m, weight: 5 })
    })

    return {
      outcomeId: dim.id,
      outcomeName: dim.name,
      dialedInScore: dialedIn.score,
      percentileRank: dialedIn.percentile,
      effortScore,
      status: statusEval.status,
      statusLabel: statusEval.label,
      statusDescription: statusEval.description,
      badgeBg: statusEval.badgeBg,
      badgeBorder: statusEval.badgeBorder,
      badgeText: statusEval.badgeText,
      activeModalities: relevantMods,
      contributingTaskCount: taskCount,
      targetConfig,
      clashes: clashesForDim,
      tierBreakdown: {
        foundational,
        synergistic,
        marginal
      }
    }
  })
}

/**
 * Calculates the projected marginal impact of adding a modality to the user's current stack
 */
export function calculateModalityMarginalImpact(
  modality: Modality,
  currentDialedInScore: number,
  currentEffortScore: number
): {
  projectedDialedIn: number
  deltaDialedIn: number
  projectedEffort: number
  deltaEffort: number
} {
  const room = 100 - currentDialedInScore
  // Diminishing returns scaling: big jump if under 70, smaller jump if 90+
  let deltaDialedIn = Math.round(room * (currentDialedInScore < 70 ? 0.35 : currentDialedInScore < 85 ? 0.22 : 0.12))
  deltaDialedIn = Math.max(3, Math.min(25, deltaDialedIn))

  const mType = (modality.modality_type || modality.category || '').toLowerCase()
  let deltaEffort = 6
  if (mType.includes('resistance') || mType.includes('fitness')) deltaEffort = 22
  else if (mType.includes('device') || mType.includes('mask') || mType.includes('cold') || mType.includes('sauna')) deltaEffort = 15
  else if (mType.includes('peptide')) deltaEffort = 12
  else if (mType.includes('skincare')) deltaEffort = 8

  return {
    projectedDialedIn: Math.min(99, currentDialedInScore + deltaDialedIn),
    deltaDialedIn,
    projectedEffort: Math.min(100, currentEffortScore + deltaEffort),
    deltaEffort
  }
}
