-- ============================================================================
-- LEVL PROTOCOLS SQL MIGRATION & SEED: PPL Split & Half Marathon Protocols
-- ============================================================================

-- 1. Insert Push / Pull / Legs Hypertrophy Split Protocol
INSERT INTO protocols (
  id,
  name,
  protocol_type,
  primary_goal,
  secondary_goals,
  target_population,
  difficulty_level,
  evidence_level,
  safety_level,
  description,
  status,
  version
) VALUES (
  'push_pull_legs_hypertrophy_protocol',
  'Push / Pull / Legs (PPL) Science-Based Hypertrophy Split',
  'expert_created',
  'Hypertrophy & Muscular Longevity',
  ARRAY['Sarcopenia Prevention', 'Mechanical Tension', 'Bone Mineral Density', 'mTOR Optimization'],
  'Lifters and longevity seekers aiming for optimal muscular hypertrophy, strength, and structural resilience.',
  'Intermediate',
  'High (Meta-Analyses)',
  'High',
  'Evidence-based 3-4 day rotational hypertrophy split optimized for maximum mechanical tension, myofibrillar protein synthesis, and mTOR recovery spacing.',
  'active',
  '2026.1'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  primary_goal = EXCLUDED.primary_goal;

-- 2. Insert 12-Week Adaptive Half Marathon Training Protocol
INSERT INTO protocols (
  id,
  name,
  protocol_type,
  primary_goal,
  secondary_goals,
  target_population,
  difficulty_level,
  evidence_level,
  safety_level,
  description,
  status,
  version
) VALUES (
  'half_marathon_training_protocol',
  '12-Week Adaptive Half Marathon Training Protocol',
  'expert_created',
  'Cardiovascular Endurance & Half Marathon Peak',
  ARRAY['VO2 Max Optimization', 'Lactate Threshold Expansion', 'Aerobic Base Volume', 'Injury Prevention'],
  'Runners training for a 13.1 mile half marathon with real-world adaptive weekly scheduling.',
  'Intermediate',
  'High (Clinical Exercise Physiology)',
  'High',
  'Periodized 12-week aerobic progression featuring Zone 2 base runs, lactate threshold intervals, injury-prevention stability, and progressive Sunday long runs leading up to target race day.',
  'active',
  '2026.1'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  primary_goal = EXCLUDED.primary_goal;
