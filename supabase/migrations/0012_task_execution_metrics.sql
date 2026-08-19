-- 0012_task_execution_metrics.sql

ALTER TABLE daily_protocol_tasks
ADD COLUMN completed_at TIMESTAMPTZ,
ADD COLUMN execution_metrics JSONB;
