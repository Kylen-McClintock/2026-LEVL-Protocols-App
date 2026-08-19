import { Modality, UserProfile } from '../types'

export function generateCoachInsight(modality: Modality, userProfile?: UserProfile | null): string {
  if (!modality) return "Recommended for exploration."
  
  const insights: string[] = []

  // Goal alignment
  if (userProfile?.primary_goals && userProfile.primary_goals.length > 0) {
    const modalityText = (modality.headline_benefit + ' ' + (modality.category || '')).toLowerCase()
    const matchedGoal = userProfile.primary_goals.find(goal => modalityText.includes(goal.toLowerCase()))
    if (matchedGoal) {
      insights.push(`Directly supports your focus on ${matchedGoal}.`)
    }
  }

  // Outcome preferences
  if (userProfile?.outcome_preference_scores && modality.primary_outcome) {
    const score = userProfile.outcome_preference_scores[modality.primary_outcome]
    if (score && score >= 7) {
      const formattedOutcome = modality.primary_outcome.replace('_', ' ')
      insights.push(`Strongly targets ${formattedOutcome}, which you prioritized.`)
    }
  }

  // Cost match
  if (userProfile?.weekly_spend_budget_usd != null && modality.cost_tier === 'free') {
    insights.push(`Completely free, aligning with your budget.`)
  }

  // Time / effort match
  if (userProfile?.discipline_level_0_99 != null && modality.effort_level === 'low') {
    insights.push(`Very low friction and easy to integrate.`)
  }

  // Fallbacks if no specific profile matches or we want to mix it up
  if (insights.length === 0) {
    if (modality.evidence_quality && modality.evidence_quality >= 4) {
      insights.push("Highly backed by clinical evidence.")
    } else if (modality.cost_tier === 'free' || modality.cost_tier === 'low') {
      insights.push(`A highly accessible ${modality.category?.toLowerCase() || 'practice'} with strong ROI.`)
    } else {
      const options = [
        "A powerful addition to your longevity stack.",
        "Excellent potential for systemic benefits.",
        "High expected benefit aligning with a proactive healthspan approach.",
        "Saved for targeted exploration and protocol building.",
        "A foundational habit for long-term resilience.",
        "Great potential for compounding health returns."
      ]
      // Deterministic pseudo-random based on id length or name so it doesn't change on every render
      const index = modality.name ? modality.name.length % options.length : 0
      insights.push(options[index])
    }
  }

  // If we have multiple insights, just take the most relevant one or two
  return insights.slice(0, 2).join(' ')
}
