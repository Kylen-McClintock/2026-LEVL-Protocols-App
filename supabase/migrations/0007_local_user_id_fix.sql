-- 0007_local_user_id_fix.sql
-- Description: The MVP uses a string `local_user_id` instead of Supabase Auth `user_id`.
-- This migration ensures the Protocol Engine tables support the MVP auth model.

ALTER TABLE user_protocol_instances
  ADD COLUMN IF NOT EXISTS local_user_id TEXT;

ALTER TABLE daily_protocol_tasks
  ADD COLUMN IF NOT EXISTS local_user_id TEXT;

-- We can drop the foreign keys to auth.users if they cause issues, but for now just making them nullable is fine.
ALTER TABLE user_protocol_instances ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE daily_protocol_tasks ALTER COLUMN user_id DROP NOT NULL;
