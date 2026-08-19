import { 
  BiologicalMeasurement, 
  NextBestMeasurementRecommendation, 
  BiologicalDomain 
} from './types'
import { MEASUREMENT_REGISTRY, GET_ALL_REGISTRY_ENTRIES } from './measurementRegistry'

/**
 * Calculates dynamic Expected Information Gain (EIG) recommendations for unmeasured traits.
 */
export function calculateNextBestMeasurements(
  latestMap: Map<string, BiologicalMeasurement>,
  sex: 'male' | 'female',
  measuredDomains: Set<BiologicalDomain>
): NextBestMeasurementRecommendation[] {
  const allEntries = GET_ALL_REGISTRY_ENTRIES()
  const unmeasuredEntries = allEntries.filter(e => !latestMap.has(e.id))

  const scored = unmeasuredEntries.map(entry => {
    // Base weight in Calico model or supplemental importance
    const weight = sex === 'female' 
      ? Math.abs(entry.calico_pls_weight_female) 
      : Math.abs(entry.calico_pls_weight_male)
    
    const baseScore = entry.is_calico_primary ? 0.4 + weight * 0.8 : 0.35

    // Cross-system unmeasured domain bonus multiplier (1.8x if domain has no measurements yet)
    const isDomainUnmeasured = !measuredDomains.has(entry.domain)
    const domainMultiplier = isDomainUnmeasured ? 1.8 : 1.0

    // Ease of collection multiplier (1.5x for instant zero-device tests like Reaction Time or Single-Leg Stance)
    const easeMultiplier = 
      entry.ease_of_collection === 'instant' ? 1.5 :
      entry.ease_of_collection === 'easy' ? 1.3 :
      entry.ease_of_collection === 'requires_device' ? 1.1 : 1.0

    const finalEig = Math.min(0.99, Math.round(baseScore * domainMultiplier * easeMultiplier * 100) / 100)

    let impactTier: NextBestMeasurementRecommendation['information_impact_tier'] = 'Moderate Value'
    if (finalEig >= 0.75) {
      impactTier = 'Highest Impact'
    } else if (finalEig >= 0.55) {
      impactTier = 'High Expected Gain'
    } else if (finalEig >= 0.40) {
      impactTier = 'Moderate Value'
    } else {
      impactTier = 'Refinement'
    }

    let actionType: NextBestMeasurementRecommendation['action_type'] = 'enter_value'
    if (entry.id === 'reaction_time' || entry.id === 'single_leg_balance' || entry.id === 'chair_stand_30s' || entry.id === 'sitting_rising_test') {
      actionType = 'test_now'
    } else if (entry.ease_of_collection === 'requires_device') {
      actionType = 'enter_value'
    }

    let reasoning = `Provides ${entry.domain.toLowerCase()} aging signal.`
    if (isDomainUnmeasured) {
      reasoning = `Unmeasured organ system (${entry.domain}). High cross-system information gain.`
    } else if (entry.is_calico_primary) {
      reasoning = `Primary Calico PLS model variable with high weight in UK Biobank.`
    }

    return {
      measurement_id: entry.id,
      name: entry.display_name,
      domain: entry.domain,
      expected_information_gain: finalEig,
      information_impact_tier: impactTier,
      estimated_minutes: entry.estimated_minutes,
      required_equipment: entry.required_equipment,
      reasoning,
      action_type: actionType
    }
  })

  // Sort descending by expected information gain
  return scored.sort((a, b) => b.expected_information_gain - a.expected_information_gain)
}
