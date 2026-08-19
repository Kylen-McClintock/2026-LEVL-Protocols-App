-- 0011_add_sleep_to_checkins.sql

ALTER TABLE daily_wellbeing_checkins
ADD COLUMN subjective_sleep_0_10 NUMERIC,
ADD COLUMN sleep_score_0_100 NUMERIC;
