-- 0002_user_modality_overrides.sql

-- 1. user_modality_overrides
CREATE TABLE user_modality_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  modality_id TEXT REFERENCES modalities(id) ON DELETE CASCADE,
  modality_variant_id TEXT REFERENCES modality_variations(id) ON DELETE SET NULL,
  override_type TEXT, -- dose, timing, contraindication, preference, side_effect
  patch_jsonb JSONB,
  source TEXT, -- user_reported, wearable_inferred, ai_suggested
  status TEXT DEFAULT 'active', -- active, draft, deprecated
  confidence NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_modality_overrides ENABLE ROW LEVEL SECURITY;

-- Add indexes for performance
CREATE INDEX idx_user_modality_overrides_user_id ON user_modality_overrides(user_id);
CREATE INDEX idx_user_modality_overrides_modality_id ON user_modality_overrides(modality_id);
