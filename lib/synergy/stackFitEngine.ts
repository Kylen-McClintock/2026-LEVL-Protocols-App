import { Modality, UserProfile } from '@/lib/types'
import { classifyModalityOntology, ModalityBiochemicalProfile } from './synergyOntology'
import {
  COMPREHENSIVE_SYNERGY_RULES,
  COMPREHENSIVE_CONFLICT_RULES,
  BiochemicalSynergyRule,
  BiochemicalConflictRule
} from './comprehensiveInteractions'

export type InteractionSeverity = 'positive' | 'clean' | 'timing' | 'moderate' | 'critical'

export interface StackSynergyMatch {
  matchedModalityId: string
  matchedModalityName: string
  source: 'today' | 'bench'
  synergyType: 'bioavailability' | 'cofactor' | 'receptor' | 'cellular_pathway' | 'contrast_hormesis'
  headline: string
  rationale: string
  actionableTip?: string
  pubmedUrl?: string
}

export interface StackConflictMatch {
  matchedModalityId: string
  matchedModalityName: string
  source: 'today' | 'bench'
  conflictType: 'hypertrophy_blunting' | 'circadian_disruption' | 'absorption_competition' | 'methylation_depletion' | 'glycemic_shock' | 'antagonistic_receptors'
  severity: 'timing' | 'moderate' | 'critical'
  headline: string
  rationale: string
  mitigationRecommendation: string
  autoResolutionTiming?: {
    recommendedTimeSlot?: string
    spacingHours?: number
    description: string
  }
  pubmedUrl?: string
}

export interface StackFitResult {
  fitTier: 'optimal_synergy' | 'positive_synergy' | 'clean_addition' | 'timing_caution' | 'mechanism_conflict'
  overallFitScore: number // 0-100
  badge: {
    type: 'synergy' | 'caution' | 'conflict' | 'clean'
    title: string
    subtitle: string
    color: 'emerald' | 'amber' | 'red' | 'cyan' | 'purple'
  }
  synergies: StackSynergyMatch[]
  conflicts: StackConflictMatch[]
  todaySynergyCount: number
  benchSynergyCount: number
  hasTodayConflict: boolean
}

// Clean normalize helper
function norm(idOrName?: string): string {
  return (idOrName || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function safeExtractList(val: any): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.map(String)
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed.map(String)
      if (typeof parsed === 'string') return [parsed]
    } catch {
      return val.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
    }
  }
  return []
}

/**
 * Main Analysis Engine: Evaluates an exploring modality against the user's active Today stack & Bench
 * using both the Comprehensive Knowledge Base and the Modality Biochemical Ontology.
 */
export function evaluateStackFit(
  exploringModality: Modality,
  todayModalities: Modality[] = [],
  benchModalities: Modality[] = [],
  userProfile?: UserProfile | null
): StackFitResult {
  const normExploringId = norm(exploringModality.id)
  const normExploringName = norm(exploringModality.name || exploringModality.display_name)
  const exploringOntology = classifyModalityOntology(exploringModality)

  const synergies: StackSynergyMatch[] = []
  const conflicts: StackConflictMatch[] = []

  // Match tester helper
  const matchesPattern = (m: Modality, patterns: string[]) => {
    const mId = norm(m.id)
    const mName = norm(m.name || m.display_name)
    return patterns.some(p => mId.includes(p) || mName.includes(p) || p.includes(mId))
  }

  // Evaluator for an individual stack modality
  const evaluatePair = (other: Modality, source: 'today' | 'bench') => {
    if (other.id === exploringModality.id) return

    const otherOntology = classifyModalityOntology(other)
    const otherName = other.display_name || other.name

    // 1. Direct Knowledge Base Synergy Matching
    for (const rule of COMPREHENSIVE_SYNERGY_RULES) {
      const isExploringTrigger = rule.triggers.some(t => normExploringId.includes(t) || normExploringName.includes(t))
      const isOtherTarget = matchesPattern(other, rule.targets)

      const isReverseTrigger = rule.triggers.some(t => matchesPattern(other, [t]))
      const isReverseTarget = rule.targets.some(t => normExploringId.includes(t) || normExploringName.includes(t))

      if ((isExploringTrigger && isOtherTarget) || (isReverseTrigger && isReverseTarget)) {
        if (!synergies.some(s => s.matchedModalityId === other.id && s.headline === rule.headline)) {
          synergies.push({
            matchedModalityId: other.id,
            matchedModalityName: otherName,
            source,
            synergyType: rule.type,
            headline: rule.headline,
            rationale: rule.rationale,
            actionableTip: rule.actionableTip,
            pubmedUrl: rule.pubmedUrl
          })
        }
      }
    }

    // 2. Direct Knowledge Base Conflict Matching
    for (const rule of COMPREHENSIVE_CONFLICT_RULES) {
      const isExploringTrigger = rule.triggers.some(t => normExploringId.includes(t) || normExploringName.includes(t))
      const isOtherTarget = matchesPattern(other, rule.targets)

      const isReverseTrigger = rule.triggers.some(t => matchesPattern(other, [t]))
      const isReverseTarget = rule.targets.some(t => normExploringId.includes(t) || normExploringName.includes(t))

      if ((isExploringTrigger && isOtherTarget) || (isReverseTrigger && isReverseTarget)) {
        if (!conflicts.some(c => c.matchedModalityId === other.id && c.headline === rule.headline)) {
          conflicts.push({
            matchedModalityId: other.id,
            matchedModalityName: otherName,
            source,
            conflictType: rule.type,
            severity: rule.severity,
            headline: rule.headline,
            rationale: rule.rationale,
            mitigationRecommendation: rule.mitigationRecommendation,
            autoResolutionTiming: rule.autoResolutionTiming,
            pubmedUrl: rule.pubmedUrl
          })
        }
      }
    }

    // 3. Biochemical Ontology-Level Synergies (Generalized Fallback & Extension)
    // Fat-Soluble Nutrient + Lipid Carrier (EVOO, Omega-3)
    if (
      exploringOntology.isFatSolubleLipophilic && 
      (other.id.includes('olive_oil') || other.id.includes('evoo') || other.id.includes('omega3') || other.name.toLowerCase().includes('oil'))
    ) {
      if (!synergies.some(s => s.matchedModalityId === other.id && s.synergyType === 'bioavailability')) {
        synergies.push({
          matchedModalityId: other.id,
          matchedModalityName: otherName,
          source,
          synergyType: 'bioavailability',
          headline: 'Lipid-Soluble Carrier Micelle Formation',
          rationale: `${exploringModality.display_name || exploringModality.name} is a lipophilic compound that requires dietary lipids for intestinal micelle formation and lymphatic absorption.`,
          actionableTip: `Take with ${otherName} for maximum bioavailability.`,
          pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/30279143/'
        })
      }
    }

    // Thermal Contrast Hormesis (Heat + Cold)
    if (
      (exploringOntology.isHeatHormesis && otherOntology.isColdHormesis) ||
      (exploringOntology.isColdHormesis && otherOntology.isHeatHormesis)
    ) {
      if (!synergies.some(s => s.matchedModalityId === other.id && s.synergyType === 'contrast_hormesis')) {
        synergies.push({
          matchedModalityId: other.id,
          matchedModalityName: otherName,
          source,
          synergyType: 'contrast_hormesis',
          headline: 'Vascular Contrast Pumping & Dual HSP70/RBM3 Induction',
          rationale: 'Alternating thermal extremes induces both Heat Shock Proteins (HSP70) and Cold Shock Proteins (RBM3) while triggering robust vascular constriction/dilation.',
          actionableTip: 'Follow the Søberg Principle: End on cold for alertness, or end on heat for evening sleep preparation.',
          pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/25705824/'
        })
      }
    }

    // 4. Biochemical Ontology-Level Antagonisms
    // Cold Plunge vs mTOR Hypertrophy
    if (
      (exploringOntology.isColdHormesis && otherOntology.isMtorStimulator) ||
      (exploringOntology.isMtorStimulator && otherOntology.isColdHormesis)
    ) {
      if (!conflicts.some(c => c.matchedModalityId === other.id && c.conflictType === 'hypertrophy_blunting')) {
        conflicts.push({
          matchedModalityId: other.id,
          matchedModalityName: otherName,
          source,
          conflictType: 'hypertrophy_blunting',
          severity: 'timing',
          headline: 'Cold Exposure Blunts Muscle Hypertrophy Signaling',
          rationale: 'Cold water immersion within 4 hours post-lifting constricts localized microvasculature and blunts p70S6K and satellite cell muscle adaptation.',
          mitigationRecommendation: 'Separate cold water immersion by at least 4 hours after resistance training.',
          autoResolutionTiming: {
            spacingHours: 4,
            description: 'Auto-schedule Cold Plunge 4+ hours after resistance training'
          },
          pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/31513336/'
        })
      }
    }

    // High-Dose Antioxidants vs Workout Hormesis
    if (
      (exploringOntology.isHighDoseAntioxidant && otherOntology.isMtorStimulator) ||
      (exploringOntology.isMtorStimulator && otherOntology.isHighDoseAntioxidant)
    ) {
      if (!conflicts.some(c => c.matchedModalityId === other.id && c.conflictType === 'hypertrophy_blunting')) {
        conflicts.push({
          matchedModalityId: other.id,
          matchedModalityName: otherName,
          source,
          conflictType: 'hypertrophy_blunting',
          severity: 'timing',
          headline: 'Antioxidants Scavenge Training ROS Adaptation Signals',
          rationale: 'High-dose Vitamin C or E immediately post-workout blunts physiological ROS signaling needed for mitochondrial biogenesis (PGC-1α).',
          mitigationRecommendation: 'Separate high-dose antioxidants by at least 2–3 hours from workout sessions.',
          autoResolutionTiming: {
            spacingHours: 3,
            description: 'Separate antioxidants 3 hours from exercise'
          },
          pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/24458514/'
        })
      }
    }

    // Check Database-Seeded Synergy & Antagonism Notes on Modality Records
    if (other.synergy_notes) {
      let synObj: any = other.synergy_notes
      if (typeof synObj === 'string') {
        try { synObj = JSON.parse(synObj) } catch { synObj = { rationale: synObj } }
      }
      const pairs = safeExtractList(synObj?.pairsWellWith)
      const rationale = synObj?.rationale || (typeof synObj === 'string' ? synObj : '')
      if (pairs.some((p: string) => normExploringName.includes(norm(p)) || normExploringId.includes(norm(p)))) {
        if (!synergies.some(s => s.matchedModalityId === other.id)) {
          synergies.push({
            matchedModalityId: other.id,
            matchedModalityName: otherName,
            source,
            synergyType: 'cellular_pathway',
            headline: 'Biochemical Synergy Pathway',
            rationale: rationale || `Documented biological synergy with ${otherName}.`,
            actionableTip: `Co-administer or sequence with ${otherName} for maximum efficacy.`
          })
        }
      }
    }

    if (other.antagonism_notes) {
      let antObj: any = other.antagonism_notes
      if (typeof antObj === 'string') {
        try { antObj = JSON.parse(antObj) } catch { antObj = { rationale: antObj } }
      }
      const avoid = safeExtractList(antObj?.avoidCombiningWith)
      const rationale = antObj?.rationale || (typeof antObj === 'string' ? antObj : '')
      if (avoid.some((a: string) => normExploringName.includes(norm(a)) || normExploringId.includes(norm(a)))) {
        if (!conflicts.some(c => c.matchedModalityId === other.id)) {
          conflicts.push({
            matchedModalityId: other.id,
            matchedModalityName: otherName,
            source,
            conflictType: 'antagonistic_receptors',
            severity: 'moderate',
            headline: 'Biochemical Antagonism',
            rationale: rationale || `Interferes with or blunts the mechanism of ${otherName}.`,
            mitigationRecommendation: `Separate or avoid combining with ${otherName}.`
          })
        }
      }
    }
  }

  // 1. Process Today's Active Modalities (Primary Priority)
  for (const active of todayModalities) {
    evaluatePair(active, 'today')
  }

  // 2. Process Bench Modalities (Secondary Priority)
  for (const bench of benchModalities) {
    if (todayModalities.some(t => t.id === bench.id)) continue
    evaluatePair(bench, 'bench')
  }

  // Count Synergies by Source
  const todaySynergyCount = synergies.filter(s => s.source === 'today').length
  const benchSynergyCount = synergies.filter(s => s.source === 'bench').length
  const hasTodayConflict = conflicts.some(c => c.source === 'today')
  const hasCriticalConflict = conflicts.some(c => c.severity === 'critical')

  // Calculate Overall Fit Score & Tier
  let fitTier: StackFitResult['fitTier'] = 'clean_addition'
  let overallFitScore = 78
  let badge: StackFitResult['badge'] = {
    type: 'clean',
    title: 'Clean Stack Fit',
    subtitle: 'Zero known biochemical antagonisms',
    color: 'cyan'
  }

  if (hasCriticalConflict) {
    fitTier = 'mechanism_conflict'
    overallFitScore = 25
    badge = {
      type: 'conflict',
      title: 'Mechanism Conflict',
      subtitle: conflicts[0]?.headline || 'Direct biochemical antagonism',
      color: 'red'
    }
  } else if (hasTodayConflict) {
    fitTier = 'timing_caution'
    overallFitScore = 55
    badge = {
      type: 'caution',
      title: 'Timing Conflict',
      subtitle: conflicts[0]?.headline || 'Requires 4h separation',
      color: 'amber'
    }
  } else if (todaySynergyCount >= 2) {
    fitTier = 'optimal_synergy'
    overallFitScore = 98
    const partnerNames = synergies.slice(0, 2).map(s => s.matchedModalityName).join(' & ')
    badge = {
      type: 'synergy',
      title: `+${todaySynergyCount} Stack Synergies`,
      subtitle: `Pairs with your ${partnerNames}`,
      color: 'emerald'
    }
  } else if (todaySynergyCount === 1) {
    fitTier = 'positive_synergy'
    overallFitScore = 91
    badge = {
      type: 'synergy',
      title: '+1 Stack Synergy',
      subtitle: `Pairs with your ${synergies[0].matchedModalityName}`,
      color: 'emerald'
    }
  } else if (benchSynergyCount >= 1) {
    fitTier = 'positive_synergy'
    overallFitScore = 84
    badge = {
      type: 'synergy',
      title: `+${benchSynergyCount} Bench Synergy`,
      subtitle: `Pairs with bench item ${synergies[0].matchedModalityName}`,
      color: 'purple'
    }
  }

  return {
    fitTier,
    overallFitScore,
    badge,
    synergies,
    conflicts,
    todaySynergyCount,
    benchSynergyCount,
    hasTodayConflict
  }
}
