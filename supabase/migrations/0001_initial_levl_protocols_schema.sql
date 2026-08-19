-- 0001_initial_levl_protocols_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. user_profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  local_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  primary_goals TEXT[],
  outcome_preference_scores JSONB,
  health_conditions_text TEXT,
  medications_and_treatments_text TEXT,
  discipline_level_0_99 INTEGER,
  experimental_openness_0_99 INTEGER,
  weekly_time_budget_hours NUMERIC,
  weekly_spend_budget_usd NUMERIC,
  chronotype TEXT,
  risk_tolerance TEXT,
  longevity_personalization_coefficient NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. outcome_dimensions
CREATE TABLE outcome_dimensions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  directionality TEXT,
  input_type TEXT,
  is_default_wellbeing BOOLEAN DEFAULT FALSE,
  is_contextual BOOLEAN DEFAULT TRUE,
  relevant_modality_types TEXT[],
  goal_keys TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. modalities
CREATE TABLE modalities (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  modality_type TEXT,
  category TEXT,
  status TEXT DEFAULT 'active',
  display_name TEXT,
  brief_description TEXT,
  expanded_why TEXT,
  headline_benefit TEXT,
  primary_outcome TEXT,
  secondary_outcomes TEXT[],
  overall_longevity_benefit NUMERIC,
  implementation_summary TEXT,
  instructions TEXT,
  dose_or_exposure TEXT,
  timing_summary TEXT,
  frequency TEXT,
  schedule_pattern TEXT,
  difficulty TEXT,
  cost_tier TEXT,
  effort_level TEXT,
  time_to_benefit TEXT,
  evidence_quality INTEGER,
  effect_size_estimate TEXT,
  evidence_summary TEXT,
  safety_level TEXT,
  safety_summary TEXT,
  contraindications TEXT[],
  functional_outcomes_to_track TEXT[],
  hallmarks_of_aging_impact JSONB,
  mechanism_of_action TEXT,
  onset_profile TEXT,
  half_life_profile TEXT,
  ideal_cohort TEXT,
  contraindicating_cohort TEXT,
  relationships JSONB,
  media_assets JSONB,
  review_status TEXT,
  version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. modality_variations
CREATE TABLE modality_variations (
  id TEXT PRIMARY KEY,
  base_modality_id TEXT REFERENCES modalities(id),
  variation_name TEXT,
  source_label TEXT,
  implementation_differences TEXT,
  dose_or_exposure TEXT,
  timing TEXT,
  frequency TEXT,
  duration TEXT,
  schedule_pattern TEXT,
  cycle_pattern TEXT,
  context_of_use TEXT,
  evidence_inheritance TEXT,
  safety_differences TEXT,
  tracking_differences TEXT,
  status TEXT DEFAULT 'draft',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. protocols
CREATE TABLE protocols (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  goal TEXT,
  description TEXT,
  visibility TEXT DEFAULT 'global_library',
  source_label TEXT,
  popularity_placeholder INTEGER DEFAULT 0,
  review_status TEXT,
  creator_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. protocol_steps
CREATE TABLE protocol_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_id TEXT REFERENCES protocols(id),
  modality_id TEXT REFERENCES modalities(id),
  variation_id TEXT REFERENCES modality_variations(id),
  relative_time_archetype TEXT,
  frequency TEXT,
  required BOOLEAN DEFAULT TRUE,
  ordering_index INTEGER,
  notes TEXT
);

-- 7. user_bench_items
CREATE TABLE user_bench_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  local_user_id TEXT NOT NULL,
  modality_id TEXT REFERENCES modalities(id),
  variation_id TEXT REFERENCES modality_variations(id),
  protocol_id TEXT REFERENCES protocols(id),
  source TEXT,
  pinned BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'benched',
  personal_notes TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. daily_sessions
CREATE TABLE daily_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  local_user_id TEXT NOT NULL,
  session_date DATE NOT NULL,
  modality_id TEXT REFERENCES modalities(id),
  variation_id TEXT REFERENCES modality_variations(id),
  protocol_id TEXT REFERENCES protocols(id),
  protocol_step_id UUID REFERENCES protocol_steps(id),
  relative_time_archetype TEXT,
  status TEXT DEFAULT 'planned',
  completed_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. outcome_observations
CREATE TABLE outcome_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  local_user_id TEXT NOT NULL,
  session_id UUID REFERENCES daily_sessions(id),
  outcome_id TEXT REFERENCES outcome_dimensions(id),
  phase TEXT,
  value_0_10 NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  source_type TEXT DEFAULT 'manual',
  notes TEXT
);

-- 10. daily_wellbeing_checkins
CREATE TABLE daily_wellbeing_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  local_user_id TEXT NOT NULL,
  checkin_date DATE NOT NULL,
  mood_0_10 NUMERIC,
  energy_0_10 NUMERIC,
  stress_0_10 NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(local_user_id, checkin_date)
);

-- 11. modality_relationships
CREATE TABLE modality_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modality_id TEXT REFERENCES modalities(id),
  related_modality_id TEXT REFERENCES modalities(id),
  relationship_type TEXT,
  notes TEXT,
  confidence NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. modality_claims
CREATE TABLE modality_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modality_id TEXT REFERENCES modalities(id),
  variation_id TEXT REFERENCES modality_variations(id),
  claim_text TEXT,
  claim_type TEXT,
  target_outcome TEXT,
  evidence_quality INTEGER,
  effect_size_estimate TEXT,
  confidence NUMERIC,
  review_status TEXT DEFAULT 'ai_drafted',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. modality_sources
CREATE TABLE modality_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modality_id TEXT REFERENCES modalities(id),
  claim_id UUID REFERENCES modality_claims(id),
  source_type TEXT,
  title TEXT,
  author TEXT,
  url TEXT,
  published_at DATE,
  citation TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
