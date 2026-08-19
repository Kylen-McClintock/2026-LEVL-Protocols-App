-- Migration: 0003_protocol_engine.sql
-- Description: Overhauls the protocols schema based on the ChatGPT Protocol Engine architecture.

-- 1. Alter Protocols table
ALTER TABLE protocols 
  ADD COLUMN IF NOT EXISTS protocol_type TEXT,
  ADD COLUMN IF NOT EXISTS primary_goal TEXT,
  ADD COLUMN IF NOT EXISTS secondary_goals TEXT[],
  ADD COLUMN IF NOT EXISTS difficulty_level TEXT,
  ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id);

-- 2. Create Modality Variants Table (if not exists, as required by steps)
-- Note: The original schema already has a `modality_variations` table with TEXT keys,
-- but if we want to ensure we align with the ChatGPT naming:
CREATE TABLE IF NOT EXISTS modality_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modality_id TEXT REFERENCES modalities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dose_amount NUMERIC,
  dose_unit TEXT,
  dose_text TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Overhaul Protocol Steps
-- We recreate or alter protocol_steps.
ALTER TABLE protocol_steps
  ADD COLUMN IF NOT EXISTS timing_slot TEXT,
  ADD COLUMN IF NOT EXISTS stack_group TEXT,
  ADD COLUMN IF NOT EXISTS timing_anchor TEXT,
  ADD COLUMN IF NOT EXISTS relative_offset_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS timing_precision TEXT,
  ADD COLUMN IF NOT EXISTS frequency_rule TEXT,
  ADD COLUMN IF NOT EXISTS day_rule TEXT,
  ADD COLUMN IF NOT EXISTS administration_conditions JSONB,
  ADD COLUMN IF NOT EXISTS dose_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS dose_unit TEXT,
  ADD COLUMN IF NOT EXISTS dose_text TEXT,
  ADD COLUMN IF NOT EXISTS reason_included TEXT,
  ADD COLUMN IF NOT EXISTS target_outcomes TEXT[],
  ADD COLUMN IF NOT EXISTS mechanism_tags TEXT[],
  ADD COLUMN IF NOT EXISTS source_ids TEXT[],
  ADD COLUMN IF NOT EXISTS safety_notes TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- 4. Create User Protocol Instances
CREATE TABLE IF NOT EXISTS user_protocol_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol_id TEXT REFERENCES protocols(id) ON DELETE CASCADE,
  protocol_version TEXT,
  personalization_status TEXT DEFAULT 'standard',
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Daily Protocol Tasks
CREATE TABLE IF NOT EXISTS daily_protocol_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_protocol_instance_id UUID REFERENCES user_protocol_instances(id) ON DELETE CASCADE,
  protocol_step_id UUID REFERENCES protocol_steps(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  timing_slot TEXT,
  status TEXT DEFAULT 'pending', -- pending, completed, skipped, snoozed
  adherence_value NUMERIC,
  user_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: We are creating these tables locally. Ensure RLS policies are applied later if exposed directly to clients via Supabase JS.
