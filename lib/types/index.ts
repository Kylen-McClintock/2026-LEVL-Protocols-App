export type UserProfile = {
  id: string
  local_user_id: string
  display_name?: string
  primary_goals?: string[]
  outcome_preference_scores?: Record<string, number>
  health_conditions_text?: string
  medications_and_treatments_text?: string
  discipline_level_0_99?: number
  experimental_openness_0_99?: number
  weekly_time_budget_hours?: number
  weekly_spend_budget_usd?: number
  chronotype?: string
  risk_tolerance?: string
  longevity_personalization_coefficient: number
  created_at: string
  updated_at: string
}

export type OutcomeDimension = {
  id: string
  name: string
  description?: string
  directionality?: 'higher_is_better' | 'lower_is_better' | 'range_bound' | 'context_dependent'
  input_type?: string
  is_default_wellbeing: boolean
  is_contextual: boolean
  relevant_modality_types?: string[]
  goal_keys?: string[]
}

export type Modality = {
  id: string
  slug: string
  name: string
  modality_type?: string
  category?: string
  status: string
  display_name?: string
  brief_description?: string
  expanded_why?: string
  headline_benefit?: string
  primary_outcome?: string
  secondary_outcomes?: string[]
  overall_longevity_benefit?: number
  implementation_summary?: string
  instructions?: string
  dose_or_exposure?: string
  timing_summary?: string
  frequency?: string
  schedule_pattern?: string
  difficulty?: string
  cost_tier?: string
  effort_level?: string
  time_to_benefit?: string
  evidence_quality?: number
  effect_size_estimate?: string
  evidence_summary?: string
  safety_level?: string
  safety_summary?: string
  contraindications?: string[]
  functional_outcomes_to_track?: string[]
  hallmarks_of_aging_impact?: any
  mechanism_of_action?: string
  onset_profile?: string
  half_life_profile?: string
  ideal_cohort?: string
  contraindicating_cohort?: string
  relationships?: any
  media_assets?: any
  review_status?: string
  version?: string
}

export type Protocol = {
  id: string
  name: string
  goal?: string
  description?: string
  visibility?: string
}

export type DailySession = {
  id: string
  local_user_id: string
  session_date: string
  modality_id: string
  modality?: Modality
  variation_id?: string
  protocol_id?: string
  protocol_step_id?: string
  relative_time_archetype?: string
  status: 'planned' | 'completed' | 'skipped'
  completed_at?: string
  skipped_at?: string
  notes?: string
}

export type UserBenchItem = {
  id: string
  local_user_id: string
  modality_id: string
  modality?: Modality
  variation_id?: string
  protocol_id?: string
  source?: string
  pinned: boolean
  status: string
  personal_notes?: string
  added_at: string
}

export type DailyWellbeingCheckin = {
  id: string
  local_user_id: string
  checkin_date: string
  mood_0_10?: number
  energy_0_10?: number
  stress_0_10?: number
  notes?: string
}
