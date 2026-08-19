export type BiologicalSystem = 
  | 'cardiovascular' 
  | 'brain' 
  | 'metabolic' 
  | 'immune' 
  | 'kidney' 
  | 'liver' 
  | 'lung' 
  | 'musculoskeletal'

export interface BiomarkerDefinition {
  id: string
  name: string
  canonical_aliases: string[]
  primary_unit: string
  supported_units: string[]
  system: BiologicalSystem
  secondary_systems?: BiologicalSystem[]
  standard_lab_range: {
    min: number
    max: number
    unit: string
    display: string
  }
  levl_optimal_zone: {
    min: number
    max: number
    unit: string
    display: string
    longevity_rationale: string
  }
  bioage_model_usage: {
    phenoage: boolean
    kdm: boolean
    hd: boolean
    calico?: boolean
  }
  description: string
  longevity_importance: string
  study_citation?: string
  study_url?: string
  conversion_to_canonical?: (val: number, fromUnit: string) => number
}

export interface BiomarkerMeasurementRecord {
  id?: string
  panel_id?: string
  user_id: string
  biomarker_id: string
  raw_name: string
  raw_value: number
  raw_unit: string
  normalized_value: number
  normalized_unit: string
  lab_reference_range?: string
  lab_flag?: 'normal' | 'high' | 'low' | 'critical'
  extraction_confidence?: number
  user_corrected?: boolean
  collection_date: string
  created_at?: string
}

export interface UserLabPanel {
  id: string
  user_id: string
  collection_date: string
  upload_date: string
  provider_name: string
  source_files: string[]
  bioage_outputs?: BioAgeResult
  measurements?: BiomarkerMeasurementRecord[]
  created_at?: string
}

export interface BioAgeResult {
  kdm_age: number | null
  pheno_age: number | null
  hd_score: number | null
  kdm_age_gap: number | null
  pheno_age_gap: number | null
  coverage_pct: number
  biomarkers_used: string[]
  missing_biomarkers: string[]
  provenance: {
    model_name: string
    bioage_commit: string
    calculated_at: string
    chronological_age: number
    sex: 'male' | 'female'
    required_demographics: string[]
    drivers?: {
      supporting: string[]
      optimization_opportunities: string[]
    }
  }
}

export interface SystemAgingStatus {
  system: BiologicalSystem
  display_name: string
  icon_name: string
  status_type: 'valid_age' | 'useful_data' | 'insufficient_data'
  calculated_age?: number
  age_gap?: number
  health_status_label?: string
  unlocked_biomarker_count: number
  total_system_biomarkers: number
  unlock_prompt?: string
  top_biomarkers: BiomarkerMeasurementRecord[]
}
