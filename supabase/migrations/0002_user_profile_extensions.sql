-- Migration: Add advanced biomarker and lifestyle tracking to user profiles

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS biological_sex TEXT,
ADD COLUMN IF NOT EXISTS weight_lbs NUMERIC,
ADD COLUMN IF NOT EXISTS body_fat_percentage NUMERIC,
ADD COLUMN IF NOT EXISTS baseline_sleep_quality_0_10 INTEGER,
ADD COLUMN IF NOT EXISTS dietary_pattern TEXT;
