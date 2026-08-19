-- SQL Script to completely delete Test Protocol from remote Supabase database
-- Run this in your Supabase Dashboard -> SQL Editor

BEGIN;

-- 1. Remove daily protocol tasks linked to test protocol steps
DELETE FROM daily_protocol_tasks 
WHERE protocol_step_id IN (
  SELECT id FROM protocol_steps 
  WHERE protocol_id = 'test-protocol-123' OR protocol_id ILIKE '%test-protocol%'
);

-- 2. Remove user bench items linked to test protocol
DELETE FROM user_bench_items 
WHERE protocol_id = 'test-protocol-123' OR protocol_id ILIKE '%test-protocol%';

-- 3. Remove user protocol instances linked to test protocol
DELETE FROM user_protocol_instances 
WHERE protocol_id = 'test-protocol-123' OR protocol_id ILIKE '%test-protocol%';

-- 4. Remove protocol steps
DELETE FROM protocol_steps 
WHERE protocol_id = 'test-protocol-123' OR protocol_id ILIKE '%test-protocol%';

-- 5. Delete the protocol itself
DELETE FROM protocols 
WHERE id = 'test-protocol-123' 
   OR id ILIKE '%test-protocol%' 
   OR name ILIKE '%Test Protocol%';

COMMIT;
