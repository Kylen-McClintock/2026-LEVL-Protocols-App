export type BiologicalDomain = 
  | 'Cardiorespiratory'
  | 'Pulmonary'
  | 'Muscular'
  | 'Neuromotor'
  | 'Cognitive'
  | 'Mobility'
  | 'Metabolic'
  | 'Inflammatory'
  | 'Renal'
  | 'Hepatic'
  | 'Hematologic'

export type MeasurementSourceType = 'manual' | 'levl_test' | 'wearable' | 'medical_device' | 'lab'

export type MeasurementLaterality = 'left' | 'right' | 'both' | 'none'

export interface BiologicalMeasurement {
  id: string
  user_id: string
  measurement_type_id: string
  value: number
  raw_unit: string
  normalized_value: number
  normalized_unit: string
  laterality?: MeasurementLaterality
  trial_number?: number
  total_trials?: number
  trial_values?: number[]
  source_type: MeasurementSourceType
  source_device?: string
  ukbb_field_id?: string
  quality_score?: number // 0.0 - 1.0
  measured_at: string
  created_at?: string
  notes?: string
}

export interface VisualGuidancePlaceholder {
  visual_type: 'svg_diagram' | 'animation_placeholder' | 'icon'
  visual_description: string
  icon_name: string
  accent_color: string
}

export interface MeasurementRegistryEntry {
  id: string
  name: string
  display_name: string
  domain: BiologicalDomain
  primary_unit: string
  supported_units: string[]
  unit_conversion_to_primary: (val: number, unit: string) => number
  ukbb_field_id?: string
  protocol_instructions: string[]
  visual_guidance?: VisualGuidancePlaceholder
  is_calico_primary: boolean
  is_supplemental_functional: boolean
  calico_pls_weight_male: number
  calico_pls_weight_female: number
  ease_of_collection: 'instant' | 'easy' | 'moderate' | 'requires_device' | 'lab_required'
  estimated_minutes: number
  required_equipment: string
  expected_information_gain_rank: number
  evidence_summary: string
  doi?: string
  notes?: string
}

export interface ModelProvenance {
  model_name: string
  model_version: string
  doi: string
  source: string
  calculated_at: string
  measurements_used: string[]
  coverage_pct: number
  validated_rmse: number
  preprocessing_version: string
}

export interface DomainScore {
  domain: BiologicalDomain
  score_0_100: number
  percentile: number
  age_equivalent_years?: number
  measurement_count: number
  status: 'optimal' | 'good' | 'fair' | 'needs_attention' | 'unmeasured'
  primary_measurement_name?: string
  latest_value_summary?: string
}

export interface NextBestMeasurementRecommendation {
  measurement_id: string
  name: string
  domain: BiologicalDomain
  expected_information_gain: number // 0.0 - 1.0
  information_impact_tier: 'Highest Impact' | 'High Expected Gain' | 'Moderate Value' | 'Refinement'
  estimated_minutes: number
  required_equipment: string
  reasoning: string
  action_type: 'test_now' | 'enter_value' | 'connect_device'
}

export interface PhysiologicalAgeResult {
  predicted_age: number | null
  chronological_age: number
  age_gap: number | null // predicted_age - chronological_age
  model_classification: 'calico-full' | 'calico-informed-subset' | 'domain-profile'
  model_version: string
  doi: string
  provenance: ModelProvenance
  measurement_coverage_pct: number // e.g. 0.625 = 62.5%
  represented_domains_count: number
  total_domains_count: number
  validated_rmse_years: number
  estimate_quality: 'High Confidence' | 'Moderate Confidence' | 'Provisional' | 'Insufficient Data'
  domain_scores: DomainScore[]
  recommendations: NextBestMeasurementRecommendation[]
  input_measurements_summary: {
    measurement_id: string
    name: string
    value_display: string
    measured_at: string
    domain: BiologicalDomain
  }[]
  warnings?: string[]
}
