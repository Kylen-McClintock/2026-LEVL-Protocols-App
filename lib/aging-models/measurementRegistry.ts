import { MeasurementRegistryEntry } from './types'

export const MEASUREMENT_REGISTRY: Record<string, MeasurementRegistryEntry> = {
  // --- 1. Blood Pressure & Heart Rate (Cardiorespiratory Domain) ---
  bp_sys: {
    id: 'bp_sys',
    name: 'Systolic Blood Pressure',
    display_name: 'Systolic Blood Pressure (SBP)',
    domain: 'Cardiorespiratory',
    primary_unit: 'mmHg',
    supported_units: ['mmHg'],
    unit_conversion_to_primary: (val) => val,
    ukbb_field_id: '4080',
    protocol_instructions: [
      'Sit quietly for 5 minutes in a chair with back supported and feet flat on the floor.',
      'Rest your arm on a flat table so the cuff is at heart level.',
      'Refrain from talking, drinking caffeine, or exercising immediately before testing.',
      'Take two readings spaced 1 minute apart and record the average.'
    ],
    visual_guidance: {
      visual_type: 'svg_diagram',
      visual_description: 'Seated posture with arm resting at heart level and blood pressure cuff around upper arm.',
      icon_name: 'HeartPulse',
      accent_color: '#EF4444' // Red
    },
    is_calico_primary: true,
    is_supplemental_functional: false,
    calico_pls_weight_male: 0.28,
    calico_pls_weight_female: 0.26,
    ease_of_collection: 'requires_device',
    estimated_minutes: 2,
    required_equipment: 'Blood Pressure Monitor',
    expected_information_gain_rank: 1,
    evidence_summary: 'Systolic blood pressure increases linearly with arterial stiffening and vascular endothelial aging. Key predictor in Calico UK Biobank biological age model.',
    doi: '10.7554/eLife.92092.3'
  },
  bp_dia: {
    id: 'bp_dia',
    name: 'Diastolic Blood Pressure',
    display_name: 'Diastolic Blood Pressure (DBP)',
    domain: 'Cardiorespiratory',
    primary_unit: 'mmHg',
    supported_units: ['mmHg'],
    unit_conversion_to_primary: (val) => val,
    ukbb_field_id: '4079',
    protocol_instructions: [
      'Recorded simultaneously during your resting blood pressure cuff measurement.',
      'Ensures complete peripheral resistance and vascular compliance profiling.'
    ],
    visual_guidance: {
      visual_type: 'svg_diagram',
      visual_description: 'Resting pulse wave and diastolic vascular pressure measurement.',
      icon_name: 'Activity',
      accent_color: '#F87171'
    },
    is_calico_primary: true,
    is_supplemental_functional: false,
    calico_pls_weight_male: 0.18,
    calico_pls_weight_female: 0.17,
    ease_of_collection: 'requires_device',
    estimated_minutes: 2,
    required_equipment: 'Blood Pressure Monitor',
    expected_information_gain_rank: 2,
    evidence_summary: 'Diastolic pressure reflects baseline microvascular tone and peripheral resistance.',
    doi: '10.7554/eLife.92092.3'
  },
  resting_hr: {
    id: 'resting_hr',
    name: 'Resting Heart Rate',
    display_name: 'Resting Heart Rate (RHR)',
    domain: 'Cardiorespiratory',
    primary_unit: 'bpm',
    supported_units: ['bpm'],
    unit_conversion_to_primary: (val) => val,
    ukbb_field_id: '102',
    protocol_instructions: [
      'Measure upon waking in bed or after sitting quietly for 5 minutes.',
      'Alternatively import automatically from your wearable baseline (Oura, Apple Watch, Garmin).'
    ],
    visual_guidance: {
      visual_type: 'icon',
      visual_description: 'Pulse rhythm wave icon representing resting heart rate in beats per minute.',
      icon_name: 'Heart',
      accent_color: '#EC4899'
    },
    is_calico_primary: true,
    is_supplemental_functional: false,
    calico_pls_weight_male: 0.15,
    calico_pls_weight_female: 0.14,
    ease_of_collection: 'easy',
    estimated_minutes: 1,
    required_equipment: 'Wearable or Pulse Check',
    expected_information_gain_rank: 3,
    evidence_summary: 'Elevated resting heart rate correlates with increased sympathetic tone and cardiovascular mortality.',
    doi: '10.7554/eLife.92092.3'
  },

  // --- 2. Spirometry / Pulmonary Domain ---
  fev1: {
    id: 'fev1',
    name: 'Forced Expiratory Volume (1 sec)',
    display_name: 'FEV1 (Liters)',
    domain: 'Pulmonary',
    primary_unit: 'L',
    supported_units: ['L', 'mL'],
    unit_conversion_to_primary: (val, unit) => unit === 'mL' ? val / 1000 : val,
    ukbb_field_id: '3063',
    protocol_instructions: [
      'Stand up straight and inhale as deeply as possible.',
      'Form a tight seal around the spirometer mouthpiece.',
      'Blast out all air as hard and fast as possible for at least 6 seconds.',
      'Record the volume exhaled in the first second. Best of 3 trials.'
    ],
    visual_guidance: {
      visual_type: 'svg_diagram',
      visual_description: 'Full thoracic expansion blasting air into a digital spirometer mouthpiece.',
      icon_name: 'Wind',
      accent_color: '#3B82F6' // Blue
    },
    is_calico_primary: true,
    is_supplemental_functional: false,
    calico_pls_weight_male: -0.32, // Inverse: higher FEV1 = younger biological age
    calico_pls_weight_female: -0.34,
    ease_of_collection: 'requires_device',
    estimated_minutes: 3,
    required_equipment: 'Digital Spirometer',
    expected_information_gain_rank: 4,
    evidence_summary: 'FEV1 declines by ~20-30 mL/year after age 25. Primary predictor of pulmonary reserve and systemic vitality in UK Biobank.',
    doi: '10.7554/eLife.92092.3'
  },
  fvc: {
    id: 'fvc',
    name: 'Forced Vital Capacity',
    display_name: 'FVC (Liters)',
    domain: 'Pulmonary',
    primary_unit: 'L',
    supported_units: ['L', 'mL'],
    unit_conversion_to_primary: (val, unit) => unit === 'mL' ? val / 1000 : val,
    ukbb_field_id: '3062',
    protocol_instructions: [
      'Total volume of air forcefully exhaled from maximum lung inflation to complete exhalation.',
      'Conducted simultaneously with FEV1 trial.'
    ],
    visual_guidance: {
      visual_type: 'icon',
      visual_description: 'Lungs graphic representing maximal vital lung capacity.',
      icon_name: 'Lungs',
      accent_color: '#60A5FA'
    },
    is_calico_primary: true,
    is_supplemental_functional: false,
    calico_pls_weight_male: -0.25,
    calico_pls_weight_female: -0.27,
    ease_of_collection: 'requires_device',
    estimated_minutes: 3,
    required_equipment: 'Digital Spirometer',
    expected_information_gain_rank: 5,
    evidence_summary: 'FVC measures total pulmonary volume capacity, indexing respiratory compliance and diaphragm strength.',
    doi: '10.7554/eLife.92092.3'
  },

  // --- 3. Muscular Domain ---
  grip_strength: {
    id: 'grip_strength',
    name: 'Hand Grip Strength',
    display_name: 'Grip Strength (Max kg)',
    domain: 'Muscular',
    primary_unit: 'kg',
    supported_units: ['kg', 'lbs'],
    unit_conversion_to_primary: (val, unit) => unit === 'lbs' ? val * 0.45359237 : val,
    ukbb_field_id: '46', // UKBB 46 (left) & 47 (right)
    protocol_instructions: [
      'Stand upright with arm extended downwards along side of body, not resting against thigh.',
      'Hold the dynamometer handle comfortably adjusted to your hand size.',
      'Squeeze with maximal effort for 3 seconds while exhaling.',
      'Perform 3 trials on each hand with 30 seconds rest between trials. Record the overall maximum score.'
    ],
    visual_guidance: {
      visual_type: 'svg_diagram',
      visual_description: 'Standing posture holding hand dynamometer at side with maximum isometric grip contraction.',
      icon_name: 'Dumbbell',
      accent_color: '#F97316' // Orange
    },
    is_calico_primary: true,
    is_supplemental_functional: false,
    calico_pls_weight_male: -0.35, // Higher strength = younger
    calico_pls_weight_female: -0.33,
    ease_of_collection: 'requires_device',
    estimated_minutes: 2,
    required_equipment: 'Hand Dynamometer',
    expected_information_gain_rank: 6,
    evidence_summary: 'Grip strength is a validated proxy for total body muscle mass, neuromotor unit recruitment, and overall physical fragility.',
    doi: '10.7554/eLife.92092.3'
  },

  // --- 4. Cognitive & Processing Domain ---
  reaction_time: {
    id: 'reaction_time',
    name: 'Visual Reaction Time',
    display_name: 'Visual Reaction Time (ms)',
    domain: 'Cognitive',
    primary_unit: 'ms',
    supported_units: ['ms'],
    unit_conversion_to_primary: (val) => val,
    ukbb_field_id: '20023',
    protocol_instructions: [
      'Use LEVL\'s native visual stimulus test on a touchscreen or mouse.',
      'Tap or click immediately when the screen changes color from slate to bright green.',
      'Complete 5 trials. False starts (< 100ms) are discarded.',
      'Your median reaction time across valid trials is automatically calculated.'
    ],
    visual_guidance: {
      visual_type: 'animation_placeholder',
      visual_description: 'Interactive stimulus screen pulsing green upon trigger.',
      icon_name: 'Zap',
      accent_color: '#10B981' // Emerald
    },
    is_calico_primary: true,
    is_supplemental_functional: false,
    calico_pls_weight_male: 0.29, // Higher reaction time (slower) = older
    calico_pls_weight_female: 0.31,
    ease_of_collection: 'instant',
    estimated_minutes: 1,
    required_equipment: 'Phone / Computer (No device required)',
    expected_information_gain_rank: 7,
    evidence_summary: 'Processing speed and visual reaction time reflect central nervous system axonal conduction velocity and synaptic transmission speed.',
    doi: '10.7554/eLife.92092.3'
  },

  // --- 5. Body Composition & Anthropometrics ---
  bmi: {
    id: 'bmi',
    name: 'Body Mass Index',
    display_name: 'BMI (kg/m²)',
    domain: 'Metabolic',
    primary_unit: 'kg/m²',
    supported_units: ['kg/m²'],
    unit_conversion_to_primary: (val) => val,
    ukbb_field_id: '21001',
    protocol_instructions: [
      'Calculated from height and weight: weight (kg) / [height (m)]².',
      'Alternatively enter height and weight in LEVL settings.'
    ],
    visual_guidance: {
      visual_type: 'icon',
      visual_description: 'Scale icon representing body mass index.',
      icon_name: 'Scale',
      accent_color: '#8B5CF6' // Purple
    },
    is_calico_primary: true,
    is_supplemental_functional: false,
    calico_pls_weight_male: 0.22,
    calico_pls_weight_female: 0.24,
    ease_of_collection: 'easy',
    estimated_minutes: 1,
    required_equipment: 'Scale & Tape Measure',
    expected_information_gain_rank: 8,
    evidence_summary: 'Body composition indexes metabolic clearance, adiposity load, and systemic metabolic homeostasis.',
    doi: '10.7554/eLife.92092.3'
  },
  waist_circumference: {
    id: 'waist_circumference',
    name: 'Waist Circumference',
    display_name: 'Waist Circumference (cm)',
    domain: 'Metabolic',
    primary_unit: 'cm',
    supported_units: ['cm', 'inches'],
    unit_conversion_to_primary: (val, unit) => unit === 'inches' ? val * 2.54 : val,
    ukbb_field_id: '48',
    protocol_instructions: [
      'Wrap tape measure around torso at midpoint between lowest rib and top of hip bone (iliac crest).',
      'Measure after normal exhalation while standing upright.'
    ],
    visual_guidance: {
      visual_type: 'svg_diagram',
      visual_description: 'Flexible tape measure around navel level at natural exhalation.',
      icon_name: 'Ruler',
      accent_color: '#A855F7'
    },
    is_calico_primary: true,
    is_supplemental_functional: false,
    calico_pls_weight_male: 0.24,
    calico_pls_weight_female: 0.25,
    ease_of_collection: 'easy',
    estimated_minutes: 1,
    required_equipment: 'Flexible Measuring Tape',
    expected_information_gain_rank: 9,
    evidence_summary: 'Visceral fat accumulation drives systemic inflammation, insulin resistance, and cardiovascular risk.',
    doi: '10.7554/eLife.92092.3'
  },

  // --- 6. Supplemental Functional-Age Measurements ---
  vo2max: {
    id: 'vo2max',
    name: 'Cardiorespiratory Fitness (VO2max)',
    display_name: 'VO2max (mL/kg/min)',
    domain: 'Cardiorespiratory',
    primary_unit: 'mL/kg/min',
    supported_units: ['mL/kg/min'],
    unit_conversion_to_primary: (val) => val,
    protocol_instructions: [
      'Enter from your Apple Watch, Garmin, Oura, or lab cardiopulmonary exercise test (CPET).',
      'Reflects maximum volume of oxygen your body can utilize during incremental exercise.'
    ],
    visual_guidance: {
      visual_type: 'icon',
      visual_description: 'Flame/runner icon indicating maximal cardiorespiratory oxygen consumption.',
      icon_name: 'Flame',
      accent_color: '#EF4444'
    },
    is_calico_primary: false,
    is_supplemental_functional: true,
    calico_pls_weight_male: 0,
    calico_pls_weight_female: 0,
    ease_of_collection: 'easy',
    estimated_minutes: 1,
    required_equipment: 'Smartwatch or Lab Test',
    expected_information_gain_rank: 10,
    evidence_summary: 'VO2max is the single strongest predictor of all-cause mortality and cardiorespiratory healthspan in epidemiological literature (Mandsager et al., JAMA 2018).',
    doi: '10.1001/jamanetworkopen.2018.3605'
  },
  single_leg_balance: {
    id: 'single_leg_balance',
    name: 'Single-Leg Stance Balance',
    display_name: 'Single-Leg Stance (sec)',
    domain: 'Neuromotor',
    primary_unit: 'sec',
    supported_units: ['sec'],
    unit_conversion_to_primary: (val) => val,
    protocol_instructions: [
      'Stand barefoot near a wall or chair for safety.',
      'Lift one leg off the floor and balance on the standing leg.',
      'Timer stops when raised foot touches floor, standing foot shifts, or hands touch support.',
      'Perform with eyes open or closed. Record best attempt in seconds (max 60s).'
    ],
    visual_guidance: {
      visual_type: 'svg_diagram',
      visual_description: 'Barefoot individual balancing on single foot with arms crossed over chest.',
      icon_name: 'Footprints',
      accent_color: '#06B6D4' // Cyan
    },
    is_calico_primary: false,
    is_supplemental_functional: true,
    calico_pls_weight_male: 0,
    calico_pls_weight_female: 0,
    ease_of_collection: 'instant',
    estimated_minutes: 2,
    required_equipment: 'Stopwatch / Phone Timer',
    expected_information_gain_rank: 11,
    evidence_summary: 'Inability to complete 10-second single-leg stance in middle-aged adults is linked to 84% higher 10-year all-cause mortality (Araujo et al., BJSM 2022).',
    doi: '10.1136/bjsports-2021-104986'
  },
  chair_stand_30s: {
    id: 'chair_stand_30s',
    name: '30-Second Chair Stand Test',
    display_name: '30s Chair Stand (Reps)',
    domain: 'Muscular',
    primary_unit: 'reps',
    supported_units: ['reps'],
    unit_conversion_to_primary: (val) => val,
    protocol_instructions: [
      'Sit in middle of a standard armless chair (approx 17 inch height) with feet flat on floor.',
      'Cross arms over chest.',
      'On "Go", rise to a full standing position and sit back down as many times as possible in 30 seconds.',
      'Record total completed full stands.'
    ],
    visual_guidance: {
      visual_type: 'svg_diagram',
      visual_description: 'Seated to standing movement in armless chair with arms crossed.',
      icon_name: 'Armchair',
      accent_color: '#F59E0B' // Amber
    },
    is_calico_primary: false,
    is_supplemental_functional: true,
    calico_pls_weight_male: 0,
    calico_pls_weight_female: 0,
    ease_of_collection: 'instant',
    estimated_minutes: 1,
    required_equipment: 'Standard Chair & Timer',
    expected_information_gain_rank: 12,
    evidence_summary: 'Validates lower body power, leg extension endurance, and functional mobility (Rikli & Jones, 2013).',
    doi: '10.1123/japa.7.2.129'
  },
  sitting_rising_test: {
    id: 'sitting_rising_test',
    name: 'Sitting-Rising Test (SRT)',
    display_name: 'Sitting-Rising Test (0-10)',
    domain: 'Mobility',
    primary_unit: 'score',
    supported_units: ['score'],
    unit_conversion_to_primary: (val) => val,
    protocol_instructions: [
      'Stand barefoot on a non-slip floor in comfortable clothes.',
      'Without leaning on surrounding objects, lower yourself to sit on the floor cross-legged.',
      'Then stand back up without using hands, knees, forearms, or sides of legs for support.',
      'Start at 10 points. Deduct 1 point for each hand or knee used for support. Deduct 0.5 points for loss of balance.'
    ],
    visual_guidance: {
      visual_type: 'svg_diagram',
      visual_description: 'Floor to standing transition without hand or knee assistance.',
      icon_name: 'UserCheck',
      accent_color: '#10B981'
    },
    is_calico_primary: false,
    is_supplemental_functional: true,
    calico_pls_weight_male: 0,
    calico_pls_weight_female: 0,
    ease_of_collection: 'instant',
    estimated_minutes: 2,
    required_equipment: 'Clear Floor Area',
    expected_information_gain_rank: 13,
    evidence_summary: 'SRT score (0-10) predicts 6-year mortality in 51-80 year olds (Brito et al., EJPC 2014). High scores reflect musculoskeletal strength, balance, and flexibility.',
    doi: '10.1177/2047487312471759'
  },
  gait_speed: {
    id: 'gait_speed',
    name: 'Usual Gait Speed',
    display_name: 'Gait Speed (m/s)',
    domain: 'Mobility',
    primary_unit: 'm/s',
    supported_units: ['m/s'],
    unit_conversion_to_primary: (val) => val,
    protocol_instructions: [
      'Mark a 6-meter (20-foot) walkway on a flat surface.',
      'Walk at your normal, comfortable pace from start to finish.',
      'Time the middle 4 meters to exclude acceleration and deceleration.',
      'Divide 4 meters by time in seconds to calculate m/s.'
    ],
    visual_guidance: {
      visual_type: 'svg_diagram',
      visual_description: 'Normal walking pace measured across a 4-meter timed zone.',
      icon_name: 'Navigation',
      accent_color: '#14B8A6' // Teal
    },
    is_calico_primary: false,
    is_supplemental_functional: true,
    calico_pls_weight_male: 0,
    calico_pls_weight_female: 0,
    ease_of_collection: 'easy',
    estimated_minutes: 2,
    required_equipment: 'Tape Measure & Timer',
    expected_information_gain_rank: 14,
    evidence_summary: 'Gait speed is often termed the "6th vital sign", indexing multi-organ functional integrity and brain health (Studenski et al., JAMA 2011).',
    doi: '10.1001/jama.2010.1923'
  }
}

export const GET_ALL_REGISTRY_ENTRIES = (): MeasurementRegistryEntry[] => {
  return Object.values(MEASUREMENT_REGISTRY).sort((a, b) => a.expected_information_gain_rank - b.expected_information_gain_rank)
}

export const GET_REGISTRY_ENTRY = (id: string): MeasurementRegistryEntry | null => {
  return MEASUREMENT_REGISTRY[id] || null
}
