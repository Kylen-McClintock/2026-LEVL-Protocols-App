-- 0017_complete_user_profiles_schema.sql
-- Migration: Add all missing top-level columns to user_profiles table

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS height_inches NUMERIC,
ADD COLUMN IF NOT EXISTS ideal_wake_time TEXT,
ADD COLUMN IF NOT EXISTS ideal_bedtime TEXT,
ADD COLUMN IF NOT EXISTS fitness_training_level TEXT,
ADD COLUMN IF NOT EXISTS resistance_training_days TEXT[],
ADD COLUMN IF NOT EXISTS primary_workout_window TEXT,
ADD COLUMN IF NOT EXISTS hardware_access TEXT[],
ADD COLUMN IF NOT EXISTS infradian_cycle_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_period_start_date TEXT,
ADD COLUMN IF NOT EXISTS average_cycle_length_days NUMERIC,
ADD COLUMN IF NOT EXISTS fasting_schedule TEXT,
ADD COLUMN IF NOT EXISTS eating_window_start TEXT,
ADD COLUMN IF NOT EXISTS eating_window_end TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS biological_sex TEXT,
ADD COLUMN IF NOT EXISTS weight_lbs NUMERIC,
ADD COLUMN IF NOT EXISTS body_fat_percentage NUMERIC,
ADD COLUMN IF NOT EXISTS baseline_sleep_quality_0_10 INTEGER,
ADD COLUMN IF NOT EXISTS dietary_pattern TEXT;
