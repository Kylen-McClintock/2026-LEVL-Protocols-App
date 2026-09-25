-- Fix Centenarian Decathlon & Modality Timing Discrepancies
-- 1. Peter Attia's Centenarian Strength & Stability (attia_centenarian_strength)
UPDATE modalities
SET 
  timing_summary = 'Afternoon (3:00 PM - 6:00 PM)',
  default_timing_slot = 'afternoon',
  instructions = 'Step 1: Preparation — Prepare for Peter Attia''s Centenarian Strength & Stability. Recommended timing: Afternoon (3:00 PM - 6:00 PM) with adequate pre-workout nutrition.
Step 2: Protocol Execution — Targeted functional strength & stability training focused on Deadhangs, Farmer Carries, Eccentric Step-Downs, and Hip Hinging to prevent frailty. Target dose/exposure: 45 minutes.
Step 3: Completion — Log baseline observation shifts post-execution.',
  dosage_profile = jsonb_set(
    coalesce(dosage_profile, '{}'::jsonb),
    '{timing_preference}',
    '"afternoon"'
  )
WHERE id = 'attia_centenarian_strength' OR id = 'peter_attia_centenarian_strength';

-- 2. Align Attia Centenarian Protocol steps in protocol_steps
UPDATE protocol_steps
SET timing_slot = 'afternoon'
WHERE protocol_id = 'peter_attia_centenarian_decathlon_protocol'
  AND modality_id IN ('attia_centenarian_strength', 'peter_attia_centenarian_strength', 'resistance_training');

-- 3. Align Cold Water Immersion in Dr. Mark Hyman Protocol
UPDATE protocol_steps
SET timing_slot = 'morning'
WHERE protocol_id = 'dr_mark_hyman_young_forever_protocol'
  AND modality_id = 'cold_water_immersion';

-- 4. Align Cocoa Flavanols to Morning/Midday (contains theobromine/caffeine)
UPDATE modalities
SET 
  timing_summary = 'Morning or midday with meal'
WHERE id = 'cocoa-flavanols';

-- 5. Align Zinc to Morning or Evening with food (prevents nausea)
UPDATE modalities
SET 
  timing_summary = 'Morning or evening with food'
WHERE id IN ('zinc', 'zinc_picolinate');

-- 6. Align Ginger Root & Lycopene
UPDATE modalities
SET timing_summary = 'Morning or midday with food'
WHERE id = 'ginger-root';

UPDATE modalities
SET timing_summary = 'Morning or midday with healthy fats'
WHERE id = 'lycopene';
