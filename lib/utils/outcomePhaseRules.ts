/**
 * Outcome Phase Rules
 * Categorizes outcome dimensions by whether they support pre-session baseline logging:
 *
 * Category A: Intra-Session Performance & Sleep Quality (Evaluated post-session or upon waking)
 * - strength, endurance, sleep_quality, sleep_latency, waking_restedness
 *
 * Category B: Longitudinal / Point-in-Time Single Ratings (Does not shift rapidly in a 20-min session)
 * - skin_clarity, immune_resilience, memory
 *
 * Category C: Acute Reactive Bio-Signals (Supports Pre -> Post shift comparison)
 * - stress, calmness, alertness, energy, mental_clarity, brain_fog, focus, mood, soreness, pain,
 *   joint_comfort, digestive_comfort, satiety, motivation, emotional_resilience, productivity, libido
 */

export const NON_PRE_LOGGABLE_OUTCOMES = new Set<string>([
  // Category A: Intra-Session Performance & Morning Sleep
  'strength',
  'endurance',
  'sleep_quality',
  'sleep_latency',
  'waking_restedness',

  // Category B: Longitudinal / Point-in-Time
  'skin_clarity',
  'immune_resilience',
  'memory'
])

export function isPreLoggableOutcome(outcomeId: string): boolean {
  if (!outcomeId) return false
  return !NON_PRE_LOGGABLE_OUTCOMES.has(outcomeId.toLowerCase().trim())
}

export function hasAnyPreLoggableOutcome(outcomeIdsOrObjects: (string | { id: string })[]): boolean {
  if (!outcomeIdsOrObjects || outcomeIdsOrObjects.length === 0) return false
  return outcomeIdsOrObjects.some(item => {
    const id = typeof item === 'string' ? item : item.id
    return isPreLoggableOutcome(id)
  })
}

export function getOutcomePhaseType(outcomeId: string): 'intra_session' | 'longitudinal' | 'acute_reactive' {
  const id = outcomeId.toLowerCase().trim()
  if (['strength', 'endurance', 'sleep_quality', 'sleep_latency', 'waking_restedness'].includes(id)) {
    return 'intra_session'
  }
  if (['skin_clarity', 'immune_resilience', 'memory'].includes(id)) {
    return 'longitudinal'
  }
  return 'acute_reactive'
}
