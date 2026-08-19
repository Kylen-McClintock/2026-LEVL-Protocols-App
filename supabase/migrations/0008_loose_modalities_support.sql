-- Migration: 0008_loose_modalities_support.sql
-- Description: Adds modality_id to daily_protocol_tasks to support loose modalities that aren't part of a protocol instance.

ALTER TABLE daily_protocol_tasks
  ADD COLUMN IF NOT EXISTS modality_id TEXT REFERENCES modalities(id) ON DELETE CASCADE;
