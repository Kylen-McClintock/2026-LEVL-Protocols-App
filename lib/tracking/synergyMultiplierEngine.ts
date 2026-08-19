import { Modality } from '@/lib/types'
import { COMPREHENSIVE_SYNERGY_RULES, BiochemicalSynergyRule } from '@/lib/synergy/comprehensiveInteractions'

export interface ActiveSynergyPair {
  ruleId: string
  headline: string
  rationale: string
  actionableTip: string
  pubmedUrl: string
  primaryModalityId: string
  primaryModalityName: string
  targetModalityId: string
  targetModalityName: string
  multiplier: number // e.g. 1.15 (+15%)
}

export interface SynergyMultiplierEvaluation {
  activePairs: ActiveSynergyPair[]
  synergizedModalityIds: Set<string>
  synergiesByModalityId: Map<string, ActiveSynergyPair[]>
  totalBonusPoints: number
}

function norm(idOrName?: string): string {
  return (idOrName || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Detects all active synergistic pairs in the user's current stack
 * and calculates the biological synergy multiplier (+15% realized points).
 */
export function evaluateStackSynergies(activeModalities: Modality[]): SynergyMultiplierEvaluation {
  const activePairs: ActiveSynergyPair[] = []
  const synergizedModalityIds = new Set<string>()
  const synergiesByModalityId = new Map<string, ActiveSynergyPair[]>()

  const matchesPattern = (m: Modality, patterns: string[]) => {
    const mId = norm(m.id)
    const mName = norm(m.name || m.display_name)
    return patterns.some(p => mId.includes(p) || mName.includes(p) || p.includes(mId))
  }

  // Iterate over every active modality in stack
  activeModalities.forEach(primary => {
    COMPREHENSIVE_SYNERGY_RULES.forEach(rule => {
      // Check if primary matches rule triggers
      if (matchesPattern(primary, rule.triggers)) {
        // Find if any other active modality matches rule targets
        const target = activeModalities.find(
          other => other.id !== primary.id && matchesPattern(other, rule.targets)
        )

        if (target) {
          const pair: ActiveSynergyPair = {
            ruleId: rule.id,
            headline: rule.headline,
            rationale: rule.rationale,
            actionableTip: rule.actionableTip,
            pubmedUrl: rule.pubmedUrl,
            primaryModalityId: primary.id,
            primaryModalityName: primary.display_name || primary.name,
            targetModalityId: target.id,
            targetModalityName: target.display_name || target.name,
            multiplier: 1.15
          }

          // Avoid duplicate pairs in symmetric rules
          const alreadyExists = activePairs.some(
            p =>
              (p.primaryModalityId === primary.id && p.targetModalityId === target.id) ||
              (p.primaryModalityId === target.id && p.targetModalityId === primary.id)
          )

          if (!alreadyExists) {
            activePairs.push(pair)
          }

          synergizedModalityIds.add(primary.id)
          synergizedModalityIds.add(target.id)

          // Map for primary
          const primaryList = synergiesByModalityId.get(primary.id) || []
          primaryList.push(pair)
          synergiesByModalityId.set(primary.id, primaryList)

          // Map for target
          const targetList = synergiesByModalityId.get(target.id) || []
          targetList.push(pair)
          synergiesByModalityId.set(target.id, targetList)
        }
      }
    })
  })

  return {
    activePairs,
    synergizedModalityIds,
    synergiesByModalityId,
    totalBonusPoints: 0 // Will be computed in adherence context
  }
}
