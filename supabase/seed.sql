-- seed.sql

-- OUTCOME DIMENSIONS
INSERT INTO outcome_dimensions (id, name, description, directionality, input_type, is_default_wellbeing, is_contextual) VALUES
('mood', 'Mood', 'Subjective emotional state', 'higher_is_better', 'slider', true, false),
('energy', 'Energy', 'Subjective physical and mental energy', 'higher_is_better', 'slider', true, false),
('stress', 'Stress', 'Subjective feeling of stress and tension', 'lower_is_better', 'slider', true, false),
('alertness', 'Alertness', 'Feeling awake and attentive', 'higher_is_better', 'slider', false, true),
('focus', 'Focus', 'Ability to concentrate on tasks', 'higher_is_better', 'slider', false, true),
('soreness', 'Soreness', 'Muscle soreness or stiffness', 'lower_is_better', 'slider', false, true),
('pain', 'Pain', 'Physical pain levels', 'lower_is_better', 'slider', false, true),
('strength', 'Strength', 'Physical strength and power output', 'higher_is_better', 'slider', false, true),
('creativity', 'Creativity', 'Creative thinking and problem-solving', 'higher_is_better', 'slider', false, true),
('satiety', 'Satiety', 'Feeling of fullness after eating', 'higher_is_better', 'slider', false, true),
('digestive_comfort', 'Digestive Comfort', 'Lack of bloating, gas, or GI distress', 'higher_is_better', 'slider', false, true),
('brain_fog', 'Brain Fog', 'Clouded thinking or mental sluggishness', 'lower_is_better', 'slider', false, true),
('motivation', 'Motivation', 'Drive to accomplish tasks', 'higher_is_better', 'slider', false, true),
('productivity', 'Productivity', 'Self-assessed output and efficiency', 'higher_is_better', 'slider', false, true),
('calmness', 'Calmness', 'Feeling relaxed and at ease', 'higher_is_better', 'slider', false, true),
('social_connection', 'Social Connection', 'Feeling connected to others', 'higher_is_better', 'slider', false, true),
('libido', 'Libido', 'Sexual drive or desire', 'higher_is_better', 'slider', false, true),
('skin_clarity', 'Skin Clarity', 'Absence of blemishes or inflammation', 'higher_is_better', 'slider', false, true),
('sleep_quality', 'Sleep Quality', 'Overall subjective quality of sleep', 'higher_is_better', 'slider', false, true),
('waking_restedness', 'Waking Restedness', 'Feeling refreshed upon waking', 'higher_is_better', 'slider', false, true),
('sleep_latency', 'Sleep Latency', 'Time taken to fall asleep', 'lower_is_better', 'slider', false, true),
('endurance', 'Endurance', 'Stamina during physical activity', 'higher_is_better', 'slider', false, true),
('joint_comfort', 'Joint Comfort', 'Absence of joint pain or stiffness', 'higher_is_better', 'slider', false, true),
('memory', 'Memory', 'Ability to recall information', 'higher_is_better', 'slider', false, true),
('emotional_resilience', 'Emotional Resilience', 'Ability to bounce back from setbacks', 'higher_is_better', 'slider', false, true),
('immune_resilience', 'Immune Resilience', 'Absence of illness symptoms', 'higher_is_better', 'slider', false, true)
ON CONFLICT (id) DO NOTHING;

-- MODALITIES
INSERT INTO modalities (id, slug, name, display_name, modality_type, category, brief_description, headline_benefit, schedule_pattern, overall_longevity_benefit) VALUES
('morning_light', 'morning-light', 'Morning Light Exposure', 'Morning Sunlight', 'light_exposure', 'circadian', 'Viewing sunlight outdoors shortly after waking to set the circadian clock.', 'Aligns circadian rhythm and improves sleep onset.', 'daily', 8.5),
('glycine_sleep', 'glycine-sleep', 'Glycine Before Bed', 'Glycine', 'supplement', 'sleep', 'Taking 3 grams of glycine before bed to lower core body temperature and improve sleep quality.', 'Deepens sleep and reduces sleep latency.', 'daily', 6.0),
('creatine', 'creatine', 'Creatine', 'Creatine Monohydrate', 'supplement', 'performance', 'Taking 5 grams of creatine daily for cognitive and muscular energy.', 'Increases strength, power, and cognitive endurance.', 'daily', 7.5),
('sauna', 'sauna', 'Sauna', 'Sauna Protocol', 'heat_exposure', 'recovery', 'Exposure to high heat (e.g. 175F+) for 15-20 minutes to induce heat shock proteins.', 'Supports cardiovascular health and stress resilience.', 'recurring', 8.0),
('cold_exposure', 'cold-exposure', 'Cold Exposure', 'Cold Plunge', 'cold_exposure', 'recovery', 'Submerging in cold water (e.g. 50F) for 3-5 minutes.', 'Increases alertness and resilience, reduces acute inflammation.', 'recurring', 7.0),
('zone2_cardio', 'zone2-cardio', 'Zone 2 Cardio', 'Zone 2 Training', 'exercise', 'performance', 'Steady-state aerobic exercise at a conversational pace for 45+ minutes.', 'Builds mitochondrial base and cardiovascular endurance.', 'recurring', 9.5),
('resistance_training', 'resistance-training', 'Resistance Training', 'Strength Training', 'exercise', 'performance', 'Lifting weights or using resistance to build muscle and bone density.', 'Increases muscle mass, metabolic health, and bone density.', 'recurring', 9.5),
('post_meal_walk', 'post-meal-walk', 'Post-Meal Walk', '10-Min Post-Meal Walk', 'behavioral_protocol', 'metabolism', 'Walking for 10-15 minutes after a large meal to blunt glucose spikes.', 'Improves glucose clearance and metabolic health.', 'daily', 7.5),
('protein_first', 'protein-first', 'Protein-First Meal', 'Protein-First Breakfast', 'nutrition', 'metabolism', 'Consuming 30g+ of protein in the first meal of the day.', 'Supports muscle protein synthesis and satiety.', 'daily', 8.0),
('blue_light_reduction', 'blue-light-reduction', 'Blue-Light Reduction', 'Evening Blue Light Block', 'environmental_intervention', 'sleep', 'Avoiding screens or using blue-blocking glasses 2 hours before bed.', 'Preserves natural melatonin production.', 'daily', 7.5),
('nsdr', 'nsdr', 'NSDR / Yoga Nidra', 'NSDR', 'meditation', 'recovery', 'Non-Sleep Deep Rest protocol to shift the autonomic nervous system into parasympathetic mode.', 'Accelerates recovery and reduces acute stress.', 'as_needed', 7.0)
ON CONFLICT (id) DO NOTHING;

-- PROTOCOLS
INSERT INTO protocols (id, name, goal, description, visibility) VALUES
('morning_circadian', 'Morning Circadian Activation Protocol', 'Align circadian rhythm for better energy and sleep.', 'A foundational routine to signal to your body that the day has begun, optimizing cortisol and setting up evening melatonin release.', 'global_library'),
('deep_sleep_foundation', 'Deep Sleep Foundation Protocol', 'Maximize deep sleep and recovery.', 'Pre-bed routines and supplements aimed at lowering core body temperature and calming the nervous system.', 'global_library'),
('metabolic_health_starter', 'Metabolic Health Starter Protocol', 'Improve glucose control and metabolic flexibility.', 'Simple nutritional and behavioral interventions to flatten glucose curves.', 'global_library'),
('recovery_day', 'Recovery Day Protocol', 'Accelerate recovery between intense training days.', 'Active and passive recovery modalities to reduce inflammation and restore autonomic balance.', 'global_library'),
('foundational_longevity_stack', 'Foundational Longevity Stack', 'Cover the absolute basics for healthspan.', 'The highest-leverage behaviors for long-term health and vitality.', 'global_library')
ON CONFLICT (id) DO NOTHING;

-- PROTOCOL STEPS
-- Morning Circadian Activation
INSERT INTO protocol_steps (protocol_id, modality_id, relative_time_archetype, frequency, required, ordering_index) VALUES
('morning_circadian', 'morning_light', 'waking', 'daily', true, 1),
('morning_circadian', 'protein_first', 'morning', 'daily', false, 2)
ON CONFLICT DO NOTHING;

-- Deep Sleep Foundation
INSERT INTO protocol_steps (protocol_id, modality_id, relative_time_archetype, frequency, required, ordering_index) VALUES
('deep_sleep_foundation', 'blue_light_reduction', 'evening', 'daily', true, 1),
('deep_sleep_foundation', 'glycine_sleep', 'pre_bed', 'daily', false, 2)
ON CONFLICT DO NOTHING;

-- Foundational Longevity Stack
INSERT INTO protocol_steps (protocol_id, modality_id, relative_time_archetype, frequency, required, ordering_index) VALUES
('foundational_longevity_stack', 'morning_light', 'waking', 'daily', true, 1),
('foundational_longevity_stack', 'resistance_training', 'midday', '3x/week', true, 2),
('foundational_longevity_stack', 'zone2_cardio', 'afternoon', '2-3x/week', true, 3),
('foundational_longevity_stack', 'blue_light_reduction', 'evening', 'daily', true, 4)
ON CONFLICT DO NOTHING;
