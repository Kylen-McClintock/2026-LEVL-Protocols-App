-- 0006_rich_task_states.sql
-- Description: Expanding status columns to support rich states for the Protocol Engine.

-- 1. daily_protocol_tasks
-- Existing status was typically simple strings, but we'll alter or drop/recreate constraints if any exist. 
-- Assuming they are just TEXT fields, we don't strictly need to alter the schema type if it's already TEXT,
-- but we should ensure the database handles them. Since they are TEXT without ENUM constraints,
-- the application layer will enforce the new values:
-- 'pending', 'completed', 'skipped', 'snoozed', 'missed', 'partial', 'not_today', 'contraindicated'

-- We can add a column for skip reasons on daily_protocol_tasks
ALTER TABLE daily_protocol_tasks
  ADD COLUMN IF NOT EXISTS status_reason TEXT;

-- 2. user_protocol_instances
-- Change active boolean to status string.
ALTER TABLE user_protocol_instances
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Optional: If we want to drop the old active boolean:
-- ALTER TABLE user_protocol_instances DROP COLUMN IF EXISTS active;
-- But to avoid breaking existing data, we can keep it or migrate data first.
UPDATE user_protocol_instances SET status = 'active' WHERE active = true AND status IS NULL;
UPDATE user_protocol_instances SET status = 'paused' WHERE active = false AND status IS NULL;

-- 3. protocol_steps
-- optionality is already a TEXT field, so we just use the new values in TypeScript:
-- 'required', 'optional', 'as_needed', 'situational', 'experimental'

-- 4. Re-create view or add indexes if necessary (placeholder for now)
