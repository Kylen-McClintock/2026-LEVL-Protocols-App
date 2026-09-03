export type UserProfile = {
  id: string
  local_user_id: string
  display_name?: string
  primary_goals?: string[]
  outcome_preference_scores?: Record<string, any>
  health_conditions_text?: string
  medications_and_treatments_text?: string
  discipline_level_0_99?: number
  experimental_openness_0_99?: number
  weekly_time_budget_hours?: number
  weekly_spend_budget_usd?: number
  chronotype?: string
  risk_tolerance?: string
  longevity_personalization_coefficient: number
  age?: number
  biological_sex?: string
  height_inches?: number
  weight_lbs?: number
  body_fat_percentage?: number
  baseline_sleep_quality_0_10?: number
  dietary_pattern?: string
  ideal_bedtime?: string
  ideal_wake_time?: string
  fasting_schedule?: string
  eating_window_start?: string
  eating_window_end?: string
  hardware_access?: string[]
  primary_workout_window?: string
  resistance_training_days?: string[]
  fitness_training_level?: string
  enabled_hotkeys?: QuickHotkeyConfig[]
  morning_checkin_dimensions?: string[]
  evening_checkin_dimensions?: string[]
  anytime_checkin_dimensions?: string[]
  // Infradian & Menstrual Cycle Optimization
  infradian_cycle_enabled?: boolean
  last_period_start_date?: string // 'YYYY-MM-DD'
  average_cycle_length_days?: number // default 28
  created_at: string
  updated_at: string
}

export interface MedicalProfileData {
  medications: string[]
  conditions: string[]
  allergies?: string[]
  notes?: string
}

export interface SafeModalityAlternative {
  id: string
  name: string
  category?: string
  outcome: string
  rationale: string
}

export interface ContraindicationWarning {
  id: string
  level: 'critical' | 'caution' | 'advisory'
  triggerTerm: string
  userItem: string
  category?: 'medication' | 'condition'
  modalityId?: string
  modalityName: string
  headline: string
  clinicalRationale: string
  actionAdvice: string
  safeAlternative?: SafeModalityAlternative
}

export type PeriodFlowLevel = 'none' | 'spotting' | 'light' | 'medium' | 'heavy'
export type PeriodPainLevel = 0 | 1 | 2 | 3 // 0: None, 1: Mild, 2: Moderate, 3: Severe
export type InfradianPhase = 'menstrual' | 'follicular' | 'ovulatory' | 'early_luteal' | 'late_luteal'

export interface PeriodDailyLogEntry {
  id: string
  local_user_id: string
  date: string // 'YYYY-MM-DD'
  is_period_day: boolean
  is_period_start?: boolean
  flow_level: PeriodFlowLevel
  pain_level: PeriodPainLevel
  symptoms: string[] // e.g. ['cramps', 'headache', 'low_energy', 'bloating', 'energized']
  notes?: string
  created_at: string
  updated_at: string
}

export interface InfradianProtocolModification {
  id: string
  category: 'cold_plunge' | 'sauna' | 'fasting' | 'exercise' | 'nutrition_supplement'
  type: 'boost' | 'modify' | 'caution' | 'add'
  title: string
  reason: string
  suggestedModalityName?: string
  suggestedAction?: string
  badgeText: string
  colorTheme: 'emerald' | 'amber' | 'cyan' | 'rose' | 'purple'
}

export interface InfradianStatus {
  enabled: boolean
  currentPhase: InfradianPhase
  phaseName: string
  phaseDescription: string
  cycleDay: number
  cycleLength: number
  isPeriodActive: boolean
  isPeriodExpectedSoon: boolean // within 3 days of predicted start
  daysUntilNextPeriod: number
  todayLog?: PeriodDailyLogEntry
  hormonalProfile: {
    estrogen: 'low' | 'rising' | 'peak' | 'moderate' | 'dropping'
    progesterone: 'low' | 'rising' | 'peak' | 'dropping'
    basalBodyTempOffset: string
    hrvBaselineOffset: string
    insulinSensitivity: 'optimal' | 'high' | 'reduced'
  }
  protocolModifications: InfradianProtocolModification[]
}

export interface QuickHotkeyPreset {
  label: string
  amount: number
  notes?: string
}

export interface QuickHotkeyConfig {
  id: string
  name: string
  icon: string
  category: 'nutrition' | 'hydration' | 'circadian' | 'mind' | 'movement' | 'vice' | 'recovery' | 'custom'
  unit: string
  default_increment: number
  daily_goal?: number
  is_negative?: boolean
  is_neutral?: boolean
  polarity?: 'positive' | 'neutral' | 'negative'
  color_theme: 'emerald' | 'cyan' | 'amber' | 'indigo' | 'rose' | 'purple' | 'blue' | 'orange' | 'slate' | 'sky'
  bottle_size_oz?: number
  presets?: QuickHotkeyPreset[]
  days_of_week?: string[] // e.g. ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  is_custom?: boolean
}

export interface DailyQuickLogEntry {
  id: string
  local_user_id: string
  date: string // 'yyyy-MM-dd'
  hotkey_id: string
  hotkey_name: string
  value: number
  unit: string
  logged_at: string // ISO timestamp
  notes?: string
  rating?: number // 1-10
  is_negative?: boolean
  metadata?: Record<string, any>
}

export type OutcomeDimension = {
  id: string
  name: string
  description?: string
  directionality?: 'higher_is_better' | 'lower_is_better' | 'range_bound' | 'context_dependent'
  input_type?: string
  is_default_wellbeing: boolean
  is_contextual: boolean
  category?: string
  relevant_modality_types?: string[]
  goal_keys?: string[]
  is_custom?: boolean
  created_at?: string
}

export type EfficacyStat = {
  fact: string
  source?: string
  source_url?: string
  relevance_score: number
  accuracy_score: number
  interesting_score: number
  impact_score: number
  related_outcomes: string[]
}

export type Modality = {
  id: string
  slug: string
  name: string
  modality_type?: string
  category?: string
  status: string
  local_user_id?: string
  visibility?: string
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
  default_timing_slot?: string
  frequency?: string
  duration?: string
  temperature?: string
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
  functional_impacts?: {
    [outcome: string]: {
      score: number
      studies?: {
        title: string
        url: string
        notes?: string
      }[]
    }
  }
  efficacy_stats?: EfficacyStat[]
  hallmarks_of_aging_impact?: any
  mechanism_of_action?: string
  diagram_url?: string
  image_url?: string
  hemodynamic_table?: string
  is_macro_pulse?: boolean
  cadence_interval_days?: number
  biological_vectors?: {
    vector: string
    intensity: number
    duration_hours: number
    peak_delay_hours: number
  }[]
  synergy_notes?: any
  antagonism_notes?: any
  scientific_references?: {
    title: string
    url: string
    type?: string
    pmid?: string
  }[]
  peptide_metadata?: PeptideModalityMetadata
  cadence_layer?: 'intra_day' | 'daily' | 'weekly' | 'monthly' | 'multi_month' | 'infrequent'
  logging_type?: 'cardio' | 'strength' | 'sport' | 'mindfulness' | 'nutrition' | 'boolean' | 'numeric' | 'thermal' | 'breathwork' | 'supplement' | 'fasting' | 'peptide'
  minimum_cooldown_hours?: number
  readiness_requirement?: Record<string, any>
  onset_profile?: string
  half_life_profile?: string
  ideal_cohort?: string
  contraindicating_cohort?: string
  relationships?: any
  media_assets?: any
  review_status?: string
  source_url?: string
  version?: string
  nba_result?: {
    score: number
    matchPercentage: number
    reasons: string[]
  }
}

export type Protocol = {
  id: string
  name: string
  slug?: string
  description?: string
  protocol_type?: 'levl_core' | 'source_imported' | 'user_custom' | 'ai_drafted' | 'expert_created' | 'brand_protocol' | 'study_derived'
  primary_goal?: string
  secondary_goals?: string[]
  target_population?: string
  difficulty_level?: string
  evidence_level?: string
  safety_level?: string
  source_id?: string
  author_id?: string
  author_name?: string
  source_label?: string
  rationale?: string
  local_user_id?: string
  visibility?: string
  review_status?: string
  status?: string
  version?: string
  goal?: string
  popularity_placeholder?: number
  protocol_steps?: any[]
  steps?: ProtocolStep[]
  target_vectors?: string[]
}

export type ProtocolStep = {
  id: string
  protocol_id: string
  modality_id: string
  variation_id?: string
  relative_time_archetype?: string
  frequency?: string
  required?: boolean
  ordering_index?: number
  display_order?: number
  notes?: string
  context_message?: string
  timing_slot?: string
  stack_group?: string
  timing_anchor?: string
  relative_offset_minutes?: number
  timing_precision?: string
  frequency_rule?: string
  day_rule?: string
  administration_conditions?: any
  dose_amount?: number
  dose_unit?: string
  dose_text?: string
  reason_included?: string
  target_outcomes?: string[]
  mechanism_tags?: string[]
  source_ids?: string[]
  safety_notes?: string
  status?: string
  duration?: string
  instructions?: string
  optionality?: 'required' | 'optional' | 'as_needed' | 'situational' | 'experimental'
  modality?: Modality // expanded relation
  protocol?: Protocol // relation to parent protocol
}

export type UserProtocolInstance = {
  id: string
  user_id: string
  protocol_id: string
  protocol_version?: string
  personalization_status?: string
  active?: boolean
  status?: 'active' | 'paused' | 'benched' | 'draft' | 'completed' | 'archived'
  start_date?: string
  end_date?: string
  created_at?: string
  updated_at?: string
  protocol?: Protocol // relation
}

export type DailyProtocolTask = {
  id: string
  user_protocol_instance_id?: string
  protocol_step_id?: string
  modality_id?: string
  user_id: string
  scheduled_date: string
  scheduled_time?: string
  timing_slot?: string
  custom_timing?: string
  custom_dose?: string
  status: 'pending' | 'completed' | 'skipped' | 'snoozed' | 'missed' | 'partial' | 'not_today' | 'contraindicated'
  status_reason?: string
  adherence_value?: number
  user_notes?: string
  completed_at?: string
  execution_metrics?: any
  execution_details?: any // Phase 5: JSON metadata (e.g. {"type": "Push", "rpe": 8})
  rescheduled_from_date?: string // Phase 5
  created_at?: string
  updated_at?: string
  protocol_step?: ProtocolStep
  loose_modality?: Modality
  lineages?: { protocol_id?: string; protocol_name: string; protocol_type?: string; color_hex?: string; step_number?: number }[]
}

export type UserModalityOverride = {
  id: string
  user_id: string
  modality_id: string
  modality_variant_id?: string
  override_type?: string
  patch_jsonb?: any
  source?: string
  status: string
  confidence?: number
  created_at?: string
  updated_at?: string
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
  notes?: string
  custom_dose?: string
  custom_timing?: string
  elimination_reasons?: string[]
  protocolTags?: { protocol_name: string; color_hex?: string }[]
  added_at: string
}

export interface ExternalConfounderData {
  weather?: {
    temp_f: number
    temp_c?: number
    humidity: number
    pressure_hpa: number
    pressure_trend?: 'rising' | 'falling' | 'stable'
    condition: string
    icon: string
    city?: string
  }
  day_busyness_score?: number // 0 - 10
  busyness_tags?: string[] // e.g. ['meetings', 'commute', 'deadlines', 'admin']
  external_stress_score?: number // 0 - 10
  stressor_domain?: string // 'work' | 'relationship' | 'financial' | 'health' | 'family_logistics' | 'other'
  stressor_notes?: string
  social_cohort?: string // 'solo' | 'loved_ones' | 'professional' | 'draining'
  social_energy_delta?: number // -5 to +5 (net recharge vs drainage)
  productivity_score?: number // 0 - 10
  productivity_depth?: string // 'deep_flow' | 'shallow_admin' | 'distracted' | 'rest_day'
  goals_completed?: number
  goals_total?: number
  goal_notes?: string
}

export type DailyWellbeingCheckin = {
  id: string
  local_user_id: string
  checkin_date: string
  mood_0_10?: number
  energy_0_10?: number
  stress_0_10?: number
  subjective_sleep_0_10?: number
  sleep_score_0_100?: number
  actual_bedtime?: string
  actual_wake_time?: string
  actual_sleep_minutes?: number
  sleep_source?: 'manual' | 'apple_health' | 'oura' | 'whoop' | 'garmin'
  sleep_efficiency_pct?: number
  last_food_time?: string
  notes?: string
  confounders?: ExternalConfounderData
  custom_outcomes_jsonb?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export type UserModalityHabit = {
  id: string
  local_user_id: string
  modality_id: string
  modality?: Modality
  streak_days: number
  target_streak_days: number
  automaticity_score: number
  is_automated: boolean
  graduated_at?: string
  graduation_type?: 'earned' | 'manual'
  created_at?: string
  updated_at?: string
}

// ----------------------------------------------------
// PEPTIDES AS FIRST-CLASS MODALITY TYPES & PROTOCOLS
// ----------------------------------------------------

export type InjectionSite =
  | 'abdomen_upper_left'
  | 'abdomen_upper_right'
  | 'abdomen_lower_left'
  | 'abdomen_lower_right'
  | 'outer_thigh_left'
  | 'outer_thigh_right'
  | 'deltoid_left'
  | 'deltoid_right'
  | 'glute_left'
  | 'glute_right'
  | 'localized_injury_site'

export interface PeptideVialConfig {
  vial_id?: string
  vial_size_mg: number // e.g. 5 (for 5mg vial) or 10
  bac_water_ml: number // e.g. 2 (for 2mL BAC water) or 2.5
  syringe_type?: 'u100_1ml' | 'u100_0_5ml' | 'u100_0_3ml' | 'u40'
  concentration_mcg_per_ml?: number // calculated: (vial_size_mg * 1000) / bac_water_ml
  concentration_mcg_per_unit?: number // calculated: concentration_mcg_per_ml / 100 on U-100
  recommended_dose_mcg?: number // e.g. 250 or 2500
  units_per_dose?: number // calculated units to draw on syringe (e.g. 10 units)
  total_doses_per_vial?: number // e.g. 20
  remaining_doses?: number // e.g. 18
  remaining_volume_ml?: number // e.g. 1.8 mL
  reconstitution_date?: string // e.g. '2026-08-10'
  expiration_days?: number // default 30 days
  brand_or_vendor?: string
  lot_number?: string
}

export interface PeptideCycleConfig {
  cycle_name?: string // e.g. "8-Week Wolverine Connective Repair"
  cycle_duration_weeks?: number // e.g. 8
  current_week?: number // e.g. 3
  current_phase?: 'loading' | 'maintenance' | 'titration' | 'washout'
  days_on?: number // e.g. 5 (for 5 days on / 2 days off)
  days_off?: number // e.g. 2
  washout_duration_weeks?: number // e.g. 4
  start_date?: string
  end_date?: string
}

export interface PeptideSideEffectLog {
  id?: string
  timestamp: string
  symptom: string // e.g. 'Transient Flushing', 'Site Irritation', 'Lethargy', 'Headache', 'Increased Hunger'
  severity: 1 | 2 | 3 | 4 | 5
  notes?: string
}

export interface PeptideDoseLog {
  dose_amount_mcg: number
  syringe_units_injected: number
  injection_site?: InjectionSite
  vial_id?: string
  sensation_notes?: string
  side_effects?: PeptideSideEffectLog[]
  reconstitution_ratio_used?: string // e.g. "5mg/2mL"
}

export interface PeptideModalityMetadata {
  is_peptide: boolean
  peptide_sequence_or_type?: string // e.g. '15-amino acid pentadecapeptide'
  delivery_route: 'subcutaneous' | 'intramuscular' | 'nasal' | 'oral' | 'transdermal'
  default_vial_config?: PeptideVialConfig
  default_cycle_config?: PeptideCycleConfig
  target_receptors?: string[] // e.g. ['GHS-R1a', 'CD34', 'Actin', 'NO System']
  half_life_summary?: string // e.g. '~4 hours' or '30 mins'
  reconstitution_instructions?: string
  storage_instructions?: string // e.g. 'Refrigerate at 36°F–46°F after reconstitution. Protect from direct light.'
  site_rotation_recommended?: boolean
  common_side_effects?: string[]
}

// ----------------------------------------------------
// NUTRITION & CIRCADIAN FASTING TYPES
// ----------------------------------------------------

export interface DailyMealLogEntry {
  id: string
  local_user_id: string
  date: string // YYYY-MM-DD
  timestamp: string // ISO string
  meal_name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  veggie_servings: number // Standard 1 cup raw / 0.5 cup cooked servings
  fruit_servings: number // Standard 1 medium fruit / 0.5 cup berries servings
  plant_diversity_count?: number // Distinct plant ingredients
  ingredients?: string[]
  image_url?: string // Optional base64 or thumbnail URL only if user clicks "Keep Photo"
  notes?: string
}

export interface UserNutritionTargets {
  daily_calories: number
  protein_g: number
  carbs_g: number
  fiber_g: number // Prebiotic fiber target, e.g. 40g
  fat_g: number
  veggie_servings: number
  fruit_servings: number
  target_fasting_hours: number // Default 16
  eating_window_start_target?: string // e.g. "12:00"
  eating_window_end_target?: string // e.g. "20:00"
}

export interface MealScanResult {
  meal_name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  veggie_servings: number
  fruit_servings: number
  plant_diversity_count: number
  ingredients: string[]
  confidence_score?: number
  summary?: string
}

export interface CircadianFastingState {
  first_meal_time: string | null // ISO timestamp or HH:mm
  last_meal_time: string | null // ISO timestamp or HH:mm
  eating_window_hours: number // e.g. 7.5
  current_fast_hours: number // Elapsed hours since last meal
  is_currently_fasting: boolean
  target_fast_hours: number // e.g. 16
}


