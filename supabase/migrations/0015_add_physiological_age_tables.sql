-- Migration 0015: Add Biological Measurements and Physiological Age Scores tables

CREATE TABLE IF NOT EXISTS biological_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  measurement_type_id TEXT NOT NULL,
  value NUMERIC NOT NULL,
  raw_unit TEXT NOT NULL,
  normalized_value NUMERIC NOT NULL,
  normalized_unit TEXT NOT NULL,
  laterality TEXT DEFAULT 'none',
  trial_number INTEGER DEFAULT 1,
  total_trials INTEGER DEFAULT 1,
  trial_values JSONB DEFAULT '[]'::jsonb,
  source_type TEXT NOT NULL DEFAULT 'manual',
  source_device TEXT,
  ukbb_field_id TEXT,
  quality_score NUMERIC DEFAULT 1.0,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_biological_measurements_user_id ON biological_measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_biological_measurements_type ON biological_measurements(measurement_type_id);
CREATE INDEX IF NOT EXISTS idx_biological_measurements_measured_at ON biological_measurements(measured_at);

CREATE TABLE IF NOT EXISTS physiological_age_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  predicted_age NUMERIC,
  chronological_age INTEGER NOT NULL,
  age_gap NUMERIC,
  model_classification TEXT NOT NULL,
  model_version TEXT NOT NULL,
  doi TEXT NOT NULL,
  measurement_coverage_pct NUMERIC NOT NULL,
  represented_domains_count INTEGER NOT NULL,
  validated_rmse_years NUMERIC NOT NULL,
  estimate_quality TEXT NOT NULL,
  provenance JSONB NOT NULL,
  domain_scores JSONB NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_physiological_age_scores_user ON physiological_age_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_physiological_age_scores_calc_at ON physiological_age_scores(calculated_at);
