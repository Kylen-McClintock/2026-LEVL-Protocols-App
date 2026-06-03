import { Modality, UserProfile } from '../types'

/**
 * Calculates the Next Best Action score for a modality based on user profile and heuristic friction penalties.
 */
export function calculateNextBestActionScore(modality: Modality, userProfile: UserProfile | null): number {
  if (!modality) return 0;
  
  const coef = userProfile?.longevity_personalization_coefficient || 1.0;
  
  // Base Benefit
  const baseBenefit = modality.overall_longevity_benefit || 5.0;
  const personalLongevityImpact = baseBenefit * coef;

  // Simple heuristic bonuses based on user profile goals
  let goalAlignmentBonus = 0;
  if (userProfile?.primary_goals && modality.headline_benefit) {
    const modalityText = (modality.headline_benefit + ' ' + (modality.category || '')).toLowerCase();
    userProfile.primary_goals.forEach(goal => {
      if (modalityText.includes(goal.toLowerCase())) {
        goalAlignmentBonus += 1.5;
      }
    });
  }

  // Functional outcome preferences bonus
  let outcomePreferenceBonus = 0;
  if (userProfile?.outcome_preference_scores && modality.primary_outcome) {
    const score = userProfile.outcome_preference_scores[modality.primary_outcome];
    if (score) {
      outcomePreferenceBonus += (score / 10) * 2; // up to +2 bonus
    }
  }

  // Friction penalties
  let costPenalty = 0;
  if (modality.cost_tier === 'premium') costPenalty = 2;
  else if (modality.cost_tier === 'high') costPenalty = 1.5;
  else if (modality.cost_tier === 'medium') costPenalty = 0.5;

  let effortPenalty = 0;
  if (modality.effort_level === 'very_high') effortPenalty = 2;
  else if (modality.effort_level === 'high') effortPenalty = 1.5;
  else if (modality.effort_level === 'medium') effortPenalty = 0.5;

  let sideEffectRiskPenalty = 0;
  if (modality.safety_level === 'high_risk') sideEffectRiskPenalty = 3;
  else if (modality.safety_level === 'moderate_risk') sideEffectRiskPenalty = 1;

  const score = personalLongevityImpact + goalAlignmentBonus + outcomePreferenceBonus - costPenalty - effortPenalty - sideEffectRiskPenalty;

  return Math.max(0, parseFloat(score.toFixed(2)));
}

export function sortModalitiesByNBA(modalities: Modality[], userProfile: UserProfile | null): Modality[] {
  return [...modalities].sort((a, b) => calculateNextBestActionScore(b, userProfile) - calculateNextBestActionScore(a, userProfile));
}
