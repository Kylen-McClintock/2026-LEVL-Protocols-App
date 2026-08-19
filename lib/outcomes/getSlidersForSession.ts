import { Modality, OutcomeDimension, UserProfile } from '../types'

/**
 * Returns the relevant sliders for a given modality session.
 */
export function getSlidersForSession(
  modality: Modality, 
  allOutcomes: OutcomeDimension[],
  userProfile?: UserProfile | null
) {
  // 1. Find the explicitly mapped outcomes from the modality
  let functionalOutcomes = modality.functional_outcomes_to_track || [];
  if (typeof functionalOutcomes === 'string') {
    const cleaned = (functionalOutcomes as string).replace(/^{|}$/g, '');
    functionalOutcomes = cleaned ? cleaned.split(',') : [];
  }

  const mappedOutcomeIds = [
    modality.primary_outcome, 
    ...(modality.secondary_outcomes || []),
    ...functionalOutcomes
  ].filter(Boolean) as string[];

  // Convert to unique set
  const uniqueMappedIds = Array.from(new Set(mappedOutcomeIds));

  // Get full outcome objects
  const relevantOutcomes = allOutcomes.filter(o => uniqueMappedIds.includes(o.id));

  // Sort by user preference if available
  if (userProfile?.outcome_preference_scores) {
    const prefs = userProfile.outcome_preference_scores;
    relevantOutcomes.sort((a, b) => {
      const scoreA = prefs[a.id] || 0;
      const scoreB = prefs[b.id] || 0;
      return scoreB - scoreA;
    });
  }

  // Split into primary (max 3) and geek mode (the rest)
  const primary = relevantOutcomes.slice(0, 3);
  const geekModeExtra = relevantOutcomes.slice(3);

  return {
    primary,
    geekModeExtra
  };
}
