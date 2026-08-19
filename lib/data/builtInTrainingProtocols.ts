import { Protocol, ProtocolStep } from '@/lib/types'

export const BUILT_IN_TRAINING_PROTOCOLS: (Protocol & { steps: ProtocolStep[] })[] = [
  {
    id: 'push_pull_legs_hypertrophy_protocol',
    name: 'Push / Pull / Legs (PPL) Science-Based Hypertrophy Split',
    protocol_type: 'expert_created',
    primary_goal: 'Hypertrophy & Muscular Longevity',
    secondary_goals: ['Sarcopenia Prevention', 'Mechanical Tension', 'Bone Mineral Density', 'mTOR Optimization'],
    target_population: 'Lifters and longevity seekers aiming for optimal muscular hypertrophy, strength, and structural resilience.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Meta-Analyses)',
    safety_level: 'High',
    description: 'Evidence-based rotational hypertrophy split (Push, Pull, and Legs programmed 1–2x per week each) optimized for maximum mechanical tension, myofibrillar protein synthesis, and mTOR recovery spacing.',
    steps: [
      {
        id: 'ppl_step_push',
        protocol_id: 'push_pull_legs_hypertrophy_protocol',
        modality_id: 'ppl_push_day',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'afternoon',
        timing_anchor: 'afternoon',
        frequency: '1-2x / week',
        required: true,
        dose_text: '3-4 sets x 6-12 reps @ RPE 8-9 (1-2 RIR). Rest 2-3 mins on compound presses, 60-90s on isolations.',
        duration: '50-65 mins',
        instructions: 'Warm up rotator cuffs with band pull-aparts. Flat Barbell Bench Press (3x6-8), Incline Dumbbell Press (3x8-10), Standing Overhead Barbell Press (3x8-10), Cable Lateral Raises (4x12-15), Cable Tricep Pushdowns (3x10-12). Maintain 2-3s controlled eccentric. Avoid cold plunge for >4h post-workout to protect hypertrophy signaling.',
        notes: 'Targeting anterior deltoids, clavicular/sternal pectorals, and lateral/medial triceps heads.',
        target_outcomes: ['Physical Energy', 'Upper Body Strength', 'Sarcopenia Prevention'],
        modality: {
          id: 'ppl_push_day',
          slug: 'ppl-push-day',
          name: 'Push Day: Chest, Shoulders & Triceps',
          display_name: 'PPL: Push Day (Chest / Delts / Triceps)',
          category: 'strength',
          modality_type: 'resistance_training',
          status: 'active',
          brief_description: 'Anterior chain hypertrophy targeting pectorals, anterior/lateral deltoids, and triceps with progressive overload.',
          expanded_why: 'Mechanical tension is the primary driver of myofibrillar hypertrophy. Compound horizontal and vertical pressing movements maximize motor unit recruitment across prime movers.',
          headline_benefit: 'Maximal Upper Body Pushing Power & Chest/Delt Hypertrophy',
          primary_outcome: 'Physical Energy',
          dose_or_exposure: '3-4 sets x 6-12 reps @ RPE 8-9 (2-3 min rest)',
          timing_summary: 'Afternoon (4:00 PM - 7:00 PM)',
          default_timing_slot: 'afternoon',
          frequency: '1-2x / week',
          scientific_references: [
            {
              title: 'Schoenfeld et al. (2019) Resistance Training Volume & Muscle Hypertrophy',
              url: 'https://pubmed.ncbi.nlm.nih.gov/30153194/',
              type: 'pubmed'
            },
            {
              title: 'Roberts et al. (2015) Post-exercise cold water immersion blunts muscle hypertrophy',
              url: 'https://pubmed.ncbi.nlm.nih.gov/26174323/',
              type: 'pubmed'
            }
          ]
        }
      },
      {
        id: 'ppl_step_pull',
        protocol_id: 'push_pull_legs_hypertrophy_protocol',
        modality_id: 'ppl_pull_day',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'afternoon',
        timing_anchor: 'afternoon',
        frequency: '1-2x / week',
        required: true,
        dose_text: '3-4 sets x 6-12 reps @ RPE 8-9. Rest 2-3 mins on compound pulls, 60-90s on biceps.',
        duration: '50-65 mins',
        instructions: 'Chest-Supported T-Bar or Barbell Rows (3x6-8), Neutral-Grip Lat Pulldowns (3x8-10), Single-Arm Dumbbell Rows (3x10-12), Incline Dumbbell Bicep Curls (3x10-12), Rope Face Pulls (4x15-20). Initiate movements by depressing and retracting scapulae.',
        notes: 'Targeting latissimus dorsi, rhomboids, rear delts, and biceps brachii.',
        target_outcomes: ['Posture Resilience', 'Back Thickness', 'Grip Strength'],
        modality: {
          id: 'ppl_pull_day',
          slug: 'ppl-pull-day',
          name: 'Pull Day: Back, Rear Delts & Biceps',
          display_name: 'PPL: Pull Day (Lats / Traps / Biceps)',
          category: 'strength',
          modality_type: 'resistance_training',
          status: 'active',
          brief_description: 'Posterior chain upper body session focused on back thickness, vertical pulling power, and scapular health.',
          expanded_why: 'Balanced pulling volume counteracts sedentary thoracic kyphosis, strengthens rotator cuff stability via face pulls, and stimulates upper body pulling strength.',
          headline_benefit: 'V-Taper Development, Thoracic Health & Scapular Stability',
          primary_outcome: 'Posture Resilience',
          dose_or_exposure: '3-4 sets x 6-12 reps @ RPE 8-9 (2-3 min rest)',
          timing_summary: 'Afternoon (4:00 PM - 7:00 PM)',
          default_timing_slot: 'afternoon',
          frequency: '1-2x / week',
          scientific_references: [
            {
              title: 'Krzysztofik et al. (2019) Maximizing Muscle Hypertrophy: A Systematic Review of Advanced Techniques',
              url: 'https://pubmed.ncbi.nlm.nih.gov/31804791/',
              type: 'pubmed'
            }
          ]
        }
      },
      {
        id: 'ppl_step_legs',
        protocol_id: 'push_pull_legs_hypertrophy_protocol',
        modality_id: 'ppl_leg_day',
        ordering_index: 3,
        display_order: 3,
        timing_slot: 'afternoon',
        timing_anchor: 'afternoon',
        frequency: '1-2x / week',
        required: true,
        dose_text: '3-4 sets x 6-12 reps @ RPE 8-8.5. Rest 2-3 mins on squats/RDLs.',
        duration: '55-70 mins',
        instructions: 'Barbell Back Squats or Hack Squats (3x6-8), Romanian Deadlifts (3x8-10), Bulgarian Split Squats (3x10-12/leg), Seated Leg Extensions (3x12-15), Lying Leg Curls (3x12-15), Standing Calf Raises (4x15). Ensure deep hip hinge without lumbar rounding on RDLs.',
        notes: 'Targeting quadriceps, hamstrings, gluteus maximus, and gastrocnemius/soleus.',
        target_outcomes: ['Lower Body Power', 'Bone Mineral Density', 'Metabolic Health'],
        modality: {
          id: 'ppl_leg_day',
          slug: 'ppl-leg-day',
          name: 'Leg Day: Quads, Hamstrings & Calves',
          display_name: 'PPL: Leg Day (Quads / Glutes / Hamstrings)',
          category: 'strength',
          modality_type: 'resistance_training',
          status: 'active',
          brief_description: 'Comprehensive lower body training for quad hypertrophy, posterior chain recruitment, and unilateral knee stability.',
          expanded_why: 'Lower body muscle mass correlates strongly with reduced all-cause mortality, enhanced glucose disposal via GLUT4 translocation, and longevity mobility.',
          headline_benefit: 'Explosive Lower Body Drive, Knee Resilience & Bone Density',
          primary_outcome: 'Lower Body Power',
          dose_or_exposure: '3-4 sets x 6-12 reps @ RPE 8-8.5 (2-3 min rest)',
          timing_summary: 'Afternoon (4:00 PM - 7:00 PM)',
          default_timing_slot: 'afternoon',
          frequency: '1-2x / week',
          scientific_references: [
            {
              title: 'Vigotsky et al. (2018) Biomechanical Factors in Lower Body Hypertrophy and Squat Mechanics',
              url: 'https://pubmed.ncbi.nlm.nih.gov/29543636/',
              type: 'pubmed'
            }
          ]
        }
      },
      {
        id: 'ppl_step_recovery',
        protocol_id: 'push_pull_legs_hypertrophy_protocol',
        modality_id: 'ppl_recovery_day',
        ordering_index: 4,
        display_order: 4,
        timing_slot: 'midday',
        timing_anchor: 'midday',
        frequency: '1-2x / week',
        required: false,
        dose_text: '20-30 mins Zone 1 walking / mobility + optional thermal contrast (sauna / cold plunge)',
        duration: '30 mins',
        instructions: 'Active recovery day. Perform 20 mins of light movement or walk to promote lymphatic flow, plus 10 mins hip and thoracic mobility. Thermal modalities (sauna 174°F+ or cold plunge) are optimal on this day as they will not blunt muscle growth.',
        notes: 'Full active recovery and central nervous system deload.',
        target_outcomes: ['Calmness & Recovery', 'Deep Sleep Quality'],
        modality: {
          id: 'ppl_recovery_day',
          slug: 'ppl-recovery-day',
          name: 'Active Recovery & Growth Day',
          display_name: 'PPL: Active Recovery & Deload Day',
          category: 'recovery',
          modality_type: 'active_recovery',
          status: 'active',
          brief_description: 'Active rest, myofascial release, and parasympathetic recovery to facilitate muscle protein remodeling between lifting cycles.',
          expanded_why: 'Muscle growth occurs during recovery when protein synthesis exceeds protein breakdown. Light active recovery enhances metabolite clearance without accumulating central fatigue.',
          headline_benefit: 'Accelerated Tissue Repair & Parasympathetic Autonomic Restoration',
          primary_outcome: 'Calmness & Recovery',
          dose_or_exposure: '20-30 mins Zone 1 walking + mobility drills',
          timing_summary: 'Midday or Evening',
          default_timing_slot: 'midday',
          frequency: '1-2x / week',
          scientific_references: [
            {
              title: 'Lamberts et al. (2010) Recovery kinetics and autonomic balance in athletic conditioning',
              url: 'https://pubmed.ncbi.nlm.nih.gov/20840567/',
              type: 'pubmed'
            }
          ]
        }
      }
    ]
  },
  {
    id: 'half_marathon_training_protocol',
    name: '12-Week Adaptive Half Marathon Training Protocol',
    protocol_type: 'expert_created',
    primary_goal: 'Cardiovascular Endurance & Half Marathon Peak',
    secondary_goals: ['VO2 Max Optimization', 'Lactate Threshold Expansion', 'Aerobic Base Volume', 'Injury Prevention'],
    target_population: 'Runners training for a 13.1 mile half marathon with real-world adaptive weekly scheduling.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Clinical Exercise Physiology)',
    safety_level: 'High',
    description: 'Periodized 12-week aerobic progression featuring Zone 2 base runs, lactate threshold intervals, injury-prevention stability, and progressive Sunday long runs leading up to target race day.',
    steps: [
      {
        id: 'hm_step_zone2',
        protocol_id: 'half_marathon_training_protocol',
        modality_id: 'hm_zone2_run',
        ordering_index: 1,
        display_order: 1,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: '1-2x / week (Tuesdays)',
        required: true,
        dose_text: '30–50 mins continuous aerobic running @ 65–75% Max HR (Lactate <2.0 mmol/L, conversational nasal pace).',
        duration: '35-50 mins',
        instructions: 'Maintain strict conversational pace. Heart rate should stay within Zone 2. If HR creeps into Zone 3 on hills, reduce speed immediately to protect mitochondrial biogenesis adaptations.',
        notes: 'Midweek aerobic foundation builder.',
        target_outcomes: ['Cardiorespiratory Fitness', 'Overall Energy'],
        modality: {
          id: 'hm_zone2_run',
          slug: 'hm-zone2-run',
          name: 'Half Marathon: Zone 2 Aerobic Base Run',
          display_name: 'HM: Zone 2 Aerobic Base Run (30-50m)',
          category: 'cardio',
          modality_type: 'endurance_running',
          status: 'active',
          brief_description: 'Pure Zone 2 aerobic base builder to enhance mitochondrial density and fat oxidation efficiency.',
          expanded_why: 'Zone 2 running stimulates mitochondrial biogenesis in Type I slow-twitch fibers and enhances capillary bed density without autonomic burnout.',
          headline_benefit: 'Expanded Aerobic Engine & High-Efficiency Fat Oxidation',
          primary_outcome: 'Cardiorespiratory Fitness',
          dose_or_exposure: '35–50 mins @ 65–75% Max HR (Zone 2)',
          timing_summary: 'Morning (6:30 AM - 9:00 AM)',
          default_timing_slot: 'morning',
          frequency: '1-2x / week',
          scientific_references: [
            {
              title: 'Seiler et al. (2010) What is Best Practice for Training Intensity Distribution in Endurance Athletes?',
              url: 'https://pubmed.ncbi.nlm.nih.gov/20861519/',
              type: 'pubmed'
            }
          ]
        }
      },
      {
        id: 'hm_step_intervals',
        protocol_id: 'half_marathon_training_protocol',
        modality_id: 'hm_threshold_intervals',
        ordering_index: 2,
        display_order: 2,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: '1x / week (Thursdays)',
        required: true,
        dose_text: 'Warmup 1 mile. 8 x 400m @ 5K pace (90s recovery) OR 3 x 1 mile @ Half Marathon tempo pace (2 min rest). Cool down 1 mile.',
        duration: '45-55 mins',
        instructions: 'Quality speed & threshold session. Maintain even split pacing across all repeats. Focus on upright posture, midfoot strike, and rapid cadence (170-180 spm).',
        notes: 'Lactate clearance velocity and running economy.',
        target_outcomes: ['Cardiorespiratory Fitness', 'VO2 Max'],
        modality: {
          id: 'hm_threshold_intervals',
          slug: 'hm-threshold-intervals',
          name: 'Half Marathon: Lactate Threshold & Speed Intervals',
          display_name: 'HM: Lactate Threshold & Speed Repeats',
          category: 'cardio',
          modality_type: 'endurance_running',
          status: 'active',
          brief_description: 'Threshold and VO2 max intervals designed to elevate fractional utilization and lactate clearance capacity.',
          expanded_why: 'Threshold intervals push lactate clearance enzymes (MCT1/MCT4) to adapt, allowing faster race pace without exponential fatigue accumulation.',
          headline_benefit: 'Faster Sustainable Race Pace & Elevated VO2 Max',
          primary_outcome: 'Cardiorespiratory Fitness',
          dose_or_exposure: '8x400m intervals or 3x1mi tempo repeats',
          timing_summary: 'Morning (6:30 AM - 9:00 AM)',
          default_timing_slot: 'morning',
          frequency: '1x / week',
          scientific_references: [
            {
              title: 'Billat et al. (2001) Interval Training for Performance: A Scientific and Empirical Practice',
              url: 'https://pubmed.ncbi.nlm.nih.gov/11219501/',
              type: 'pubmed'
            }
          ]
        }
      },
      {
        id: 'hm_step_stability',
        protocol_id: 'half_marathon_training_protocol',
        modality_id: 'hm_runner_stability',
        ordering_index: 3,
        display_order: 3,
        timing_slot: 'afternoon',
        timing_anchor: 'afternoon',
        frequency: '2x / week (Wednesdays & Fridays)',
        required: false,
        dose_text: '3 sets: Single-Leg RDLs (10/leg), Tibialis Raises (20 reps), Calf Raises (15 reps), Side Planks (45s/side), Glute Bridges (15 reps).',
        duration: '25-35 mins',
        instructions: 'Runner-specific injury prevention routine. Focus on ankle tendon stiffness, glute medius activation, and core anti-rotation stability.',
        notes: 'Prevents shin splints, runner’s knee, and Achilles tendinopathy.',
        target_outcomes: ['Joint Stability', 'Lower Body Power'],
        modality: {
          id: 'hm_runner_stability',
          slug: 'hm-runner-stability',
          name: 'Half Marathon: Single-Leg Stability & Prehab',
          display_name: 'HM: Runner Stability & Joint Prehab',
          category: 'strength',
          modality_type: 'injury_prevention',
          status: 'active',
          brief_description: 'Unilateral strength, calf tendon elasticity, and pelvic stability prehab to bulletproof joints against high mileage.',
          expanded_why: 'Strength training improves running economy by 3-5% and reduces running-related overuse injuries by strengthening kinetic chain load absorption.',
          headline_benefit: 'Injury Immunity, Running Economy & Knee/Ankle Resilience',
          primary_outcome: 'Joint Stability',
          dose_or_exposure: '3 sets x unilateral stability circuit (25 mins)',
          timing_summary: 'Afternoon or Post-Run',
          default_timing_slot: 'afternoon',
          frequency: '2x / week',
          scientific_references: [
            {
              title: 'Blagrove et al. (2018) Effects of Strength Training on the Physiological Determinants of Running Performance',
              url: 'https://pubmed.ncbi.nlm.nih.gov/29082257/',
              type: 'pubmed'
            }
          ]
        }
      },
      {
        id: 'hm_step_longrun',
        protocol_id: 'half_marathon_training_protocol',
        modality_id: 'hm_progressive_longrun',
        ordering_index: 4,
        display_order: 4,
        timing_slot: 'morning',
        timing_anchor: 'morning',
        frequency: '1x / week (Sundays)',
        required: true,
        dose_text: 'Progressive weekly long run: W1-3 (5-7 mi), W4-7 (8-10 mi), W8-10 (10-12 mi peak), W11-12 (8 mi taper → 13.1 mi Race Day). Pace: 60-90s slower than target race pace.',
        duration: '60-120 mins',
        instructions: 'The cornerstone half marathon workout. Build mileage weekly. On runs over 8 miles, practice intra-run electrolyte and carbohydrate gel fueling (30-60g carbs/hr). If postponed, Monday shifts to long run and Tuesday converts to active recovery.',
        notes: 'Endurance peak and musculoskeletal durability.',
        target_outcomes: ['Cardiorespiratory Fitness', 'Overall Endurance'],
        modality: {
          id: 'hm_progressive_longrun',
          slug: 'hm-progressive-longrun',
          name: 'Half Marathon: Progressive Weekend Long Run',
          display_name: 'HM: Progressive Long Run (5-12 Miles)',
          category: 'cardio',
          modality_type: 'endurance_running',
          status: 'active',
          brief_description: 'The weekly cornerstone run that progressively builds glycogen storage capacity, capillary beds, and mental resilience.',
          expanded_why: 'Long duration aerobic exposure depletes glycogen, prompting muscle fibers to upregulate GLUT4 receptors and mitochondrial enzyme density.',
          headline_benefit: 'Peak 13.1-Mile Endurance, Glycogen Capacity & Race Readiness',
          primary_outcome: 'Cardiorespiratory Fitness',
          dose_or_exposure: '5 to 12 miles progressive weekly volume',
          timing_summary: 'Sunday Morning (7:00 AM - 10:00 AM)',
          default_timing_slot: 'morning',
          frequency: '1x / week',
          scientific_references: [
            {
              title: 'Hawley et al. (2014) Maximizing Cellular Adaptation to Endurance Training',
              url: 'https://pubmed.ncbi.nlm.nih.gov/24791914/',
              type: 'pubmed'
            },
            {
              title: 'Burke et al. (2011) Carbohydrates for Training and Competition',
              url: 'https://pubmed.ncbi.nlm.nih.gov/21660838/',
              type: 'pubmed'
            }
          ]
        }
      }
    ]
  }
]
