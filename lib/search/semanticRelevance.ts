import { Modality, Protocol } from '../types'
import type { SemanticSearchResult } from '@/app/actions/search'

// Common conversational words and search noise to ignore
const STOP_WORDS = new Set([
  'how', 'do', 'i', 'can', 'what', 'is', 'the', 'to', 'for', 'a', 'an', 'in', 'on', 'of',
  'and', 'or', 'with', 'about', 'protocol', 'protocols', 'modality', 'modalities', 'best',
  'recommend', 'recommended', 'better', 'good', 'improve', 'improving', 'help', 'helps',
  'me', 'my', 'you', 'your', 'from', 'at', 'by', 'that', 'this', 'any', 'some', 'than',
  'much', 'more', 'most', 'way', 'ways', 'stack', 'routine'
])

// Keywords indicating explicit user intent for peptides or injectable pharmacology
export const PEPTIDE_QUERY_KEYWORDS = new Set([
  'peptide', 'peptides', 'subq', 'subcutaneous', 'inject', 'injectable', 'injection',
  'glp', 'glp1', 'glp-1', 'bpc', 'bpc157', 'bpc-157', 'tb500', 'tb-500',
  'cjc', 'cjc1295', 'cjc-1295', 'ipamorelin', 'semax', 'selank', 'epitalon', 'epithalon',
  'ghk', 'ghk-cu', 'tirzepatide', 'semaglutide', 'retatrutide', 'tesamorelin',
  'sermorelin', 'aod', 'aod9604', 'aod-9604', 'motsc', 'mots-c', 'ozempic',
  'mounjaro', 'wegovy', 'zepbound', 'kpv', 'ss31', 'ss-31', 'elamipretide', 'thymosin',
  'ta1', 'ta-1', 'pt141', 'pt-141', 'bremelanotide', 'kisspeptin'
])

export interface CompoundPhraseDef {
  phrases: string[]
  concepts: string[]
  excludeConcepts?: string[]
  primaryModalityIds?: string[]
  primaryModalityTerms?: string[]
  targetCategories?: string[]
}

// Multi-word compound health intents that override single-word lexical confusion
export const COMPOUND_PHRASE_MAPPINGS: CompoundPhraseDef[] = [
  // 1a. Sprints, Anaerobic Sprints, HIIT, High-Intensity Sprints
  {
    phrases: [
      'sprint', 'sprints', 'sprint training', 'anaerobic sprints', 'all out sprint',
      'rhonda sprint', 'shear stress', 'vascular shear stress', 'maximal sprint', 'sprint interval'
    ],
    concepts: ['sprint', 'sprints', 'hiit', 'vo2', 'zone_5', 'intervals', 'anaerobic', 'speed', 'vascular'],
    excludeConcepts: ['peptides', 'glp1', 'weight_lifting'],
    primaryModalityIds: ['rhonda_hiit_sprints', 'vo2_max_hiit_training', 'vo2_max_4x4_hiit', 'vilpa_micro_bursts'],
    primaryModalityTerms: ['sprint', 'shear stress', 'hiit', 'vo2 max', 'micro-burst'],
    targetCategories: ['Exercise & Performance', 'Cardiovascular Fitness', 'Longevity & Cellular Health']
  },

  // 1b. Running, Jogging, Half Marathon, Aerobic Base Run
  {
    phrases: [
      'running', 'runner', 'jogging', 'jog', 'half marathon', 'long run', 'aerobic run',
      'base run', 'treadmill run', 'road run'
    ],
    concepts: ['running', 'cardio', 'jogging', 'aerobic', 'endurance', 'zone_2', 'half_marathon', 'stamina'],
    excludeConcepts: ['peptides', 'glp1', 'weight_lifting'],
    primaryModalityIds: ['running', 'hm_zone2_run', 'hm_progressive_longrun', 'zone_2_cardio', 'hm_threshold_intervals'],
    primaryModalityTerms: ['running', 'base run', 'long run', 'zone 2', 'marathon', 'stride'],
    targetCategories: ['Exercise & Performance', 'Cardiovascular Fitness']
  },

  // 1c. General Cardio, Aerobic, Endurance, VO2 Max, Zone 2
  {
    phrases: [
      'cardio', 'cardiovascular', 'aerobic', 'aerobic exercise', 'endurance',
      'hiit', 'interval training', 'intervals', 'vo2 max', 'vo2max', 'zone 2',
      'zone 2 cardio', 'zone 5', 'norwegian 4x4', 'cpet', 'steady state cardio',
      'treadmill', 'cycling', 'rowing', 'vilpa'
    ],
    concepts: [
      'cardio', 'heart', 'aerobic', 'endurance', 'running', 'sprint', 'sprints',
      'hiit', 'vo2', 'intervals', 'zone_2', 'zone_5', 'cycling', 'rowing',
      'mitochondria', 'norwegian', 'vilpa', 'stamina', 'vascular'
    ],
    excludeConcepts: ['peptides', 'glp1'],
    primaryModalityIds: [
      'zone_2_cardio', 'running', 'vo2_max_hiit_training', 'vo2_max_4x4_hiit',
      'rhonda_hiit_sprints', 'vilpa_micro_bursts', 'hm_zone2_run',
      'hm_threshold_intervals', 'hm_progressive_longrun', 'vo2-max-cpet-assessment'
    ],
    primaryModalityTerms: [
      'cardio', 'zone 2', 'running', 'sprint', 'sprints', 'hiit', 'vo2',
      'aerobic', 'endurance', 'intervals', '4x4', 'vilpa'
    ]
  },

  // 2. Strength, Resistance, Hypertrophy, Weights, Lifting
  {
    phrases: [
      'weight lifting', 'weightlifting', 'lifting weights', 'weight training',
      'strength training', 'lift weights', 'free weights', 'barbell', 'dumbbell',
      'hypertrophy training', 'lifting', 'weights', 'resistance training', 'resistance workout',
      'bench press', 'squat', 'deadlift', 'muscle building', 'strength', 'hypertrophy', 'muscle'
    ],
    concepts: [
      'resistance', 'lifting', 'strength', 'muscle', 'hypertrophy', 'weights',
      'creatine', 'workout', 'training', 'anabolic', 'progressive_overload',
      'calisthenics', 'bodyweight', 'protein', 'power_output'
    ],
    excludeConcepts: ['weight_loss', 'fat_loss', 'lipolysis', 'glp1', 'tirzepatide', 'semaglutide', 'fasting'],
    primaryModalityIds: ['resistance_training', 'heavy_resistance_training', 'creatine_monohydrate', 'calisthenics', 'bfr_training'],
    primaryModalityTerms: ['resistance training', 'creatine', 'calisthenics', 'hypertrophy', 'strength', 'lifting', 'bfr']
  },

  // 3. Fat Loss, Weight Loss, Body Recomposition
  {
    phrases: [
      'fat loss', 'weight loss', 'lose weight', 'burn fat', 'cut fat',
      'body recomposition', 'shed fat', 'caloric deficit', 'slimming', 'lean out'
    ],
    concepts: [
      'fat_loss', 'lipolysis', 'caloric_restriction', 'fasting', 'metabolic_rate',
      'body_composition', 'visceral_fat'
    ],
    excludeConcepts: ['weight_lifting', 'lifting', 'resistance'],
    primaryModalityIds: ['time_restricted_eating_18_6', 'fmd_5_day', 'zone_2_cardio', 'post_meal_glucose_walk'],
    primaryModalityTerms: ['fasting', 'time-restricted', 'caloric', 'zone 2', 'glucose walk']
  },

  // 4. Cold, Ice Bath, Plunge, Cryotherapy
  {
    phrases: [
      'cold', 'cold plunge', 'ice bath', 'cold therapy', 'cold shower',
      'cold water immersion', 'cryotherapy', 'soberg', 'shivering', 'brown fat',
      'thermogenesis', 'deliberate cold'
    ],
    concepts: ['cold', 'plunge', 'ice_bath', 'cryo', 'soberg', 'thermogenesis', 'brown_fat', 'shivering'],
    primaryModalityIds: ['cold_plunge', 'cold_shower', 'contrast_therapy'],
    primaryModalityTerms: ['cold plunge', 'cold shower', 'ice bath', 'cryotherapy', 'thermogenesis']
  },

  // 5. Sauna, Heat Therapy, Hyperthermia, Heat Shock
  {
    phrases: [
      'sauna', 'infrared sauna', 'heat therapy', 'finnish sauna', 'hot bath',
      'hyperthermia', 'heat shock', 'sweating', 'thermal therapy', 'steam room'
    ],
    concepts: ['sauna', 'heat', 'hyperthermia', 'heat_shock', 'sweat', 'thermal', 'finnish', 'infrared'],
    primaryModalityIds: ['sauna', 'infrared_sauna', 'hot_bath'],
    primaryModalityTerms: ['sauna', 'infrared', 'hot bath', 'thermal', 'hyperthermia']
  },

  // 6. Sleep, Insomnia, Circadian, Bedtime
  {
    phrases: [
      'sleep', 'sleeping', 'insomnia', 'deep sleep', 'rem sleep', 'sleep quality',
      'fall asleep', 'stay asleep', 'sleep architecture', 'insomnia relief', 'sleep better',
      'bedtime', 'circadian', 'waking up tired', 'sleep hygiene', 'restful sleep'
    ],
    concepts: [
      'sleep', 'circadian', 'melatonin', 'rest', 'deep_sleep', 'wind_down',
      'magnesium', 'darkness', 'blue_light', 'mouth_tape', 'somnolence', 'night', 'walker'
    ],
    primaryModalityIds: [
      'matthew_walker_sleep_triad', 'magnesium_threonate', 'apigenin',
      'sleep_architecture', 'blue_light_blockers', 'mouth_taping', 'morning_sunlight'
    ],
    primaryModalityTerms: ['sleep', 'magnesium', 'apigenin', 'circadian', 'sunlight', 'mouth tap', 'blue light', 'wind down']
  },

  // 7. Breathwork, Calming, Vagus Nerve, Stress, Anxiety, Meditation
  {
    phrases: [
      'breathwork', 'breathing', 'box breathing', 'physiological sigh', 'cyclic sighing',
      'wim hof', '4 7 8', '4-7-8', 'nsdr', 'non sleep deep rest', 'vagus nerve',
      'vagal', 'stress', 'anxiety', 'nervous system', 'calm', 'parasympathetic',
      'panic', 'burnout', 'meditation', 'mindfulness'
    ],
    concepts: [
      'breathwork', 'box_breathing', 'physiological_sigh', 'nsdr', 'vagus',
      'vagal', 'stress', 'anxiety', 'calm', 'nervous_system', 'parasympathetic',
      'meditation', 'mindfulness', 'hrv'
    ],
    primaryModalityIds: [
      'box_breathing', 'cyclic_sighing', '4_7_8_breathing', 'nsdr',
      'mindfulness_meditation', 'ashwagandha', 'l_theanine'
    ],
    primaryModalityTerms: ['breathing', 'sigh', 'nsdr', 'meditation', 'mindful', 'ashwagandha', 'theanine']
  },

  // 8. Joint Health, Tendons, Ligaments, Cartilage, Mobility, Stretching
  {
    phrases: [
      'joint', 'joints', 'joint health', 'joint pain', 'tendon', 'tendons',
      'tendonitis', 'ligament', 'ligaments', 'cartilage', 'connective tissue',
      'mobility', 'stretching', 'flexibility', 'foam rolling', 'stiff joints',
      'patellar', 'knee pain', 'achilles', 'spine'
    ],
    concepts: [
      'joint', 'collagen', 'tendon', 'ligament', 'cartilage', 'mobility',
      'tissue_repair', 'stretching', 'flexibility', 'fascia', 'connective_tissue'
    ],
    excludeConcepts: ['glp1', 'weight_loss'],
    primaryModalityIds: [
      'collagen_peptides', 'tibialis_raises', 'slant_board_squats',
      'nordic_hamstring_curls', 'poliquin_step_ups', 'thoracic_spine_extension',
      'mobility_stretching'
    ],
    primaryModalityTerms: [
      'joint', 'collagen', 'tibialis', 'slant board', 'nordic', 'poliquin',
      'thoracic', 'mobility', 'stretching'
    ]
  },

  // 9. Metabolic Health, Glucose, Blood Sugar, Insulin
  {
    phrases: [
      'glucose', 'blood sugar', 'insulin', 'insulin resistance', 'cgm',
      'continuous glucose', 'metabolic', 'metabolism', 'a1c', 'glycemic',
      'carb spikes', 'post meal glucose'
    ],
    concepts: [
      'glucose', 'insulin', 'cgm', 'metabolic', 'berberine', 'acarbose',
      'post_meal_walk', 'apple_cider_vinegar', 'soleus_pushups', 'glycemic'
    ],
    primaryModalityIds: [
      'cgm', 'post_meal_glucose_walk', 'apple_cider_vinegar', 'acarbose',
      'berberine', 'soleus_pushups'
    ],
    primaryModalityTerms: ['cgm', 'glucose', 'insulin', 'apple cider vinegar', 'acarbose', 'walk', 'soleus']
  },

  // 10. Autophagy, Fasting, Cellular Cleanup, Senolytics
  {
    phrases: [
      'fasting', 'intermittent fasting', 'autophagy', 'time restricted eating',
      'time restricted feeding', 'fmd', 'fasting mimicking', '16 8', '18 6',
      'water fast', 'cellular cleanup', 'senolytic', 'senolytics'
    ],
    concepts: ['fasting', 'autophagy', 'fmd', 'time_restricted', 'longevity', 'senolytic', 'fisetin', 'spermidine'],
    primaryModalityIds: [
      'time_restricted_eating_18_6', 'fmd_5_day', 'fisetin', 'spermidine'
    ],
    primaryModalityTerms: ['fasting', 'time-restricted', 'fmd', 'fisetin', 'spermidine', 'autophagy']
  },

  // 11. Cognitive, Focus, Memory, Nootropics, Brain
  {
    phrases: [
      'focus', 'brain', 'cognition', 'cognitive', 'memory', 'mental clarity',
      'alertness', 'nootropic', 'nootropics', 'adhd', 'concentration', 'brain fog'
    ],
    concepts: [
      'focus', 'brain', 'nootropic', 'memory', 'cognitive', 'cognition',
      'dopamine', 'neuro', 'lion_s_mane', 'attention', 'bdnf', 'l_theanine', 'choline'
    ],
    primaryModalityIds: [
      'lions_mane_mushroom', 'l_theanine', 'caffeine_delay', 'alpha_gpc'
    ],
    primaryModalityTerms: ['lion\'s mane', 'theanine', 'caffeine', 'focus', 'brain', 'nootropic']
  },

  // 12. Energy, Mitochondria, Cellular ATP, Fatigue
  {
    phrases: [
      'energy', 'fatigue', 'tired', 'exhaustion', 'low energy', 'mitochondria',
      'mitochondrial', 'atp', 'cellular energy', 'nad', 'nmn', 'vitality'
    ],
    concepts: [
      'energy', 'mitochondria', 'atp', 'nad', 'nmn', 'alertness',
      'vitality', 'caffeine', 'nr', 'fatigue', 'coq10'
    ],
    primaryModalityIds: [
      'nmn_tmg', 'creatine_monohydrate', 'coq10', 'zone_2_cardio', 'morning_sunlight'
    ],
    primaryModalityTerms: ['nmn', 'creatine', 'coq10', 'energy', 'mitochondria', 'sunlight']
  },

  // 13. Gut Health, Microbiome, Digestion
  {
    phrases: [
      'gut', 'gut health', 'microbiome', 'digestion', 'digestive', 'bloating',
      'ibs', 'leaky gut', 'probiotic', 'prebiotic', 'gut flora', 'fermented foods'
    ],
    concepts: [
      'gut', 'microbiome', 'fiber', 'probiotic', 'prebiotic', 'gut_barrier',
      'digestive', 'digestion', 'fermented', 'glutamine'
    ],
    primaryModalityIds: [
      'oral_microbiome', 'probiotics', 'prebiotic_fiber', 'glutamine'
    ],
    primaryModalityTerms: ['microbiome', 'gut', 'probiotic', 'fiber', 'fermented']
  },

  // 14. Cardiovascular Screening & Biomarkers
  {
    phrases: [
      'blood pressure', 'hypertension', 'apob', 'lipids', 'cholesterol',
      'cac', 'calcium score', 'mri', 'cancer screen', 'galleri', 'biomarkers',
      'screening', 'arterial stiffness', 'cardiovascular health'
    ],
    concepts: [
      'apob', 'cac', 'blood_pressure', 'mri', 'galleri', 'biomarker',
      'screening', 'cardiovascular', 'arterial', 'lipids'
    ],
    primaryModalityIds: [
      'ambulatory_blood_pressure', 'apob_lipid_panel', 'cac_ct_scan',
      'full_body_mri_prenuvo', 'grail_galleri_cancer_screen'
    ],
    primaryModalityTerms: ['blood pressure', 'apob', 'cac', 'mri', 'galleri', 'lipid']
  },

  // 15. Longevity, Anti-Aging, Epigenetics, Biomarkers of Aging
  {
    phrases: [
      'longevity', 'anti aging', 'anti-aging', 'aging', 'epigenetic',
      'biological age', 'blueprint', 'bryan johnson', 'hallmarks of aging',
      'healthspan', 'lifespan', 'telomeres', 'senescence'
    ],
    concepts: [
      'longevity', 'blueprint', 'sinclair', 'rapamycin', 'metformin',
      'senolytic', 'fisetin', 'spermidine', 'epigenetic', 'hallmark', 'anti_aging'
    ],
    primaryModalityIds: [
      'fisetin', 'nmn_tmg', 'zone_2_cardio', 'resistance_training',
      'matthew_walker_sleep_triad', 'sauna', 'cold_plunge'
    ],
    primaryModalityTerms: ['longevity', 'fisetin', 'nmn', 'zone 2', 'resistance training', 'sleep']
  }
]

// Curated Longevity & Bio-Optimization Semantic Concept Synonyms
// Note: Peptides are deliberately quarantined to avoid polluting core lifestyle/nutrition pillars
const CONCEPT_SYNONYMS: Record<string, string[]> = {
  cardio: ['running', 'sprint', 'sprints', 'hiit', 'vo2', 'aerobic', 'endurance', 'zone_2', 'zone_5', 'intervals', 'cycling', 'rowing', 'heart', 'vilpa'],
  running: ['cardio', 'jogging', 'aerobic', 'endurance', 'zone_2', 'half_marathon', 'treadmill', 'vo2', 'stamina', 'sprint'],
  runner: ['running', 'cardio', 'jogging', 'aerobic', 'endurance', 'zone_2'],
  jogging: ['running', 'cardio', 'aerobic', 'zone_2', 'endurance'],
  sprint: ['sprints', 'hiit', 'vo2', 'zone_5', 'intervals', 'cardio', 'anaerobic', 'speed', 'norwegian'],
  sprints: ['sprint', 'hiit', 'vo2', 'zone_5', 'intervals', 'cardio', 'anaerobic', 'speed'],
  hiit: ['sprint', 'sprints', 'vo2', 'zone_5', 'intervals', 'cardio', 'norwegian', 'anaerobic'],
  aerobic: ['cardio', 'endurance', 'zone_2', 'running', 'cycling', 'rowing', 'vo2', 'mitochondria'],
  endurance: ['aerobic', 'cardio', 'zone_2', 'running', 'cycling', 'stamina', 'vo2'],
  vo2: ['vo2_max', 'cpet', 'hiit', 'zone_5', 'sprint', 'cardio', 'aerobic', 'intervals'],
  intervals: ['hiit', 'sprint', 'sprints', 'vo2', 'cardio', 'norwegian', 'zone_5'],
  cycling: ['cardio', 'aerobic', 'endurance', 'zone_2', 'vo2'],
  rowing: ['cardio', 'aerobic', 'endurance', 'zone_2', 'vo2'],
  sleep: [
    'circadian', 'melatonin', 'insomnia', 'rest', 'rem', 'deep_sleep', 'wind_down',
    'darkness', 'blue_light', 'bedtime', 'mouth_tape', 'night', 'somnolence', 'sleep_quality',
    'sleep_architecture', 'walker', 'magnesium'
  ],
  insomnia: ['sleep', 'circadian', 'melatonin', 'rest', 'wind_down', 'bedtime', 'night', 'magnesium'],
  circadian: ['sleep', 'morning_sunlight', 'melatonin', 'blue_light', 'darkness', 'bedtime'],
  cold: ['plunge', 'ice_bath', 'cryo', 'cryotherapy', 'cold_shower', 'soberg', 'shivering', 'brown_fat', 'thermogenesis'],
  plunge: ['cold', 'ice_bath', 'cryo', 'cryotherapy', 'soberg', 'thermogenesis', 'brown_fat'],
  heat: ['sauna', 'hyperthermia', 'heat_shock', 'sweat', 'infrared', 'finnish', 'thermal'],
  sauna: ['heat', 'hyperthermia', 'heat_shock', 'sweating', 'infrared', 'finnish', 'thermal'],
  breathwork: ['box_breathing', 'physiological_sigh', 'nsdr', 'vagus', 'calm', 'stress', 'anxiety', 'parasympathetic'],
  breathing: ['breathwork', 'box_breathing', 'physiological_sigh', 'nsdr', 'vagus', 'calm'],
  meditation: ['mindfulness', 'nsdr', 'breathwork', 'calm', 'focus', 'stress', 'vagus'],
  energy: ['mitochondria', 'atp', 'nad', 'nmn', 'alertness', 'vitality', 'caffeine', 'adenosine', 'nr', 'fatigue', 'coq10'],
  fatigue: ['energy', 'mitochondria', 'nad', 'nmn', 'vitality', 'alertness', 'sleep'],
  mitochondria: ['energy', 'atp', 'nad', 'nmn', 'zone_2', 'coq10', 'vitality'],
  focus: ['nootropic', 'memory', 'cognitive', 'cognition', 'dopamine', 'neuro', 'mental', 'lion_s_mane', 'attention'],
  brain: ['cognitive', 'cognition', 'nootropic', 'neuro', 'neurogenesis', 'memory', 'focus', 'bdnf', 'lion_s_mane'],
  cognition: ['focus', 'brain', 'nootropic', 'memory', 'neuro', 'bdnf'],
  muscle: ['resistance', 'lifting', 'hypertrophy', 'strength', 'creatine', 'protein', 'anabolic', 'workout', 'weights', 'calisthenics', 'progressive_overload'],
  strength: ['muscle', 'resistance', 'lifting', 'hypertrophy', 'creatine', 'protein', 'workout', 'weights', 'progressive_overload', 'calisthenics'],
  hypertrophy: ['muscle', 'strength', 'resistance', 'lifting', 'protein', 'creatine', 'anabolic', 'weights', 'workout', 'progressive_overload'],
  lifting: ['weight_lifting', 'resistance_training', 'strength', 'muscle', 'hypertrophy', 'creatine', 'weights', 'workout', 'barbell', 'dumbbell'],
  weights: ['lifting', 'weight_lifting', 'resistance_training', 'strength', 'muscle', 'hypertrophy', 'creatine', 'workout', 'dumbbells', 'barbell'],
  workout: ['exercise', 'training', 'resistance', 'lifting', 'strength', 'cardio', 'fitness', 'weights', 'hypertrophy'],
  exercise: ['workout', 'training', 'resistance', 'lifting', 'strength', 'cardio', 'fitness', 'zone_2', 'hiit'],
  resistance: ['lifting', 'weights', 'strength', 'hypertrophy', 'muscle', 'creatine', 'progressive_overload', 'calisthenics', 'workout'],
  creatine: ['creatine_monohydrate', 'resistance', 'strength', 'muscle', 'hypertrophy', 'power_output', 'atp', 'lifting', 'workout'],
  calisthenics: ['bodyweight', 'resistance', 'strength', 'muscle', 'movement'],
  bodyweight: ['calisthenics', 'resistance', 'strength', 'muscle', 'movement'],
  joint: ['collagen', 'tendon', 'ligament', 'cartilage', 'inflammation', 'tissue_repair', 'mobility', 'hyaluronic'],
  joints: ['joint', 'collagen', 'tendon', 'ligament', 'cartilage', 'mobility', 'tissue_repair'],
  tendon: ['joint', 'ligament', 'cartilage', 'collagen', 'mobility', 'tissue_repair'],
  tendons: ['joint', 'tendon', 'ligament', 'collagen', 'mobility', 'tissue_repair'],
  ligament: ['joint', 'tendon', 'cartilage', 'collagen', 'tissue_repair'],
  ligaments: ['joint', 'ligament', 'tendon', 'collagen', 'tissue_repair'],
  cartilage: ['joint', 'tendon', 'ligament', 'collagen', 'tissue_repair', 'glucosamine'],
  collagen: ['joint', 'tendon', 'cartilage', 'tissue_repair', 'skin', 'ligament'],
  mobility: ['stretching', 'flexibility', 'joint', 'fascia', 'range_of_motion', 'movement'],
  stretching: ['mobility', 'flexibility', 'joint', 'fascia', 'recovery', 'range_of_motion'],
  flexibility: ['mobility', 'stretching', 'joint', 'range_of_motion'],
  glucose: ['blood_sugar', 'insulin', 'cgm', 'metabolic', 'berberine', 'acarbose', 'post_meal_walk'],
  insulin: ['glucose', 'blood_sugar', 'cgm', 'metabolic', 'insulin_resistance'],
  cgm: ['glucose', 'blood_sugar', 'insulin', 'continuous_glucose', 'metabolic'],
  fat_loss: ['lipolysis', 'visceral_fat', 'caloric_restriction', 'fasting', 'metabolic_rate', 'body_composition'],
  weight_loss: ['fat_loss', 'lipolysis', 'caloric_restriction', 'fasting', 'metabolic_rate', 'body_composition'],
  fasting: ['autophagy', 'fmd', 'intermittent_fasting', 'time_restricted', 'longevity', 'sinclair', 'longo'],
  autophagy: ['fasting', 'time_restricted', 'fmd', 'senolytic', 'fisetin', 'spermidine', 'longevity'],
  heart: ['vo2', 'cardiovascular', 'aerobic', 'zone_2', 'zone_5', 'endurance', 'cpet', 'nitric_oxide', 'blood_pressure'],
  injury: ['recovery', 'rehabilitation', 'joint', 'tissue_repair', 'collagen', 'tendon', 'healing'],
  repair: ['tissue_repair', 'healing', 'recovery', 'collagen', 'regeneration'],
  stress: ['cortisol', 'hrv', 'vagus', 'vagal', 'breathwork', 'physiological_sigh', 'nsdr', 'nervous_system', 'calm', 'anxiety'],
  anxiety: ['stress', 'cortisol', 'hrv', 'vagus', 'breathwork', 'calm', 'nervous_system', 'l_theanine'],
  gut: ['microbiome', 'fiber', 'probiotic', 'prebiotic', 'gut_barrier', 'digestive', 'digestion', 'fermented'],
  microbiome: ['gut', 'probiotic', 'prebiotic', 'fiber', 'fermented', 'oral_microbiome'],
  longevity: ['blueprint', 'sinclair', 'rapamycin', 'metformin', 'senolytic', 'fisetin', 'spermidine', 'epigenetic', 'hallmark'],
  aging: ['longevity', 'anti_aging', 'senolytic', 'fisetin', 'epigenetic', 'hallmark', 'sinclair', 'blueprint'],
  // Dedicated peptide concepts — only triggered when explicit peptide query keywords are present
  peptides: [
    'peptide', 'bpc_157', 'tb_500', 'cjc_1295', 'ipamorelin', 'semax', 'selank',
    'epitalon', 'ghk_cu', 'retatrutide', 'tirzepatide', 'tesamorelin', 'sermorelin',
    'aod_9604', 'subcutaneous', 'injectable'
  ],
  glp1: ['semaglutide', 'tirzepatide', 'retatrutide', 'appetite', 'incretin', 'weight_loss', 'satiety', 'ozempic', 'mounjaro'],
  bpc: ['bpc_157', 'tb_500', 'wolverine_stack', 'tissue_healing']
}

/**
 * Extracts cleaned search tokens, compound phrase intents, and expanded semantic concepts from a user query string.
 */
export function extractSearchTokens(rawQuery: string): {
  tokens: string[]
  expandedConcepts: Set<string>
  matchedCompound?: CompoundPhraseDef
  hasExplicitPeptideQuery: boolean
} {
  const clean = rawQuery
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .trim()

  const rawTokens = clean.split(/\s+/).filter(Boolean)
  const meaningfulTokens = rawTokens.filter(t => !STOP_WORDS.has(t) && t.length > 1)
  const tokens = meaningfulTokens.length > 0 ? meaningfulTokens : rawTokens.filter(t => t.length > 1)

  const hasExplicitPeptideQuery = tokens.some(t => PEPTIDE_QUERY_KEYWORDS.has(t)) ||
    Array.from(PEPTIDE_QUERY_KEYWORDS).some(kw => clean.includes(kw))

  const expandedConcepts = new Set<string>()
  const excludedConcepts = new Set<string>()

  // 1. Check multi-word compound phrases first
  let matchedCompound: CompoundPhraseDef | undefined
  for (const compound of COMPOUND_PHRASE_MAPPINGS) {
    const matched = compound.phrases.some(phrase => {
      if (clean === phrase || clean.includes(phrase)) return true
      const pWords = phrase.split(' ')
      return pWords.length > 1 && pWords.every(pw => tokens.includes(pw))
    })

    if (matched) {
      matchedCompound = compound
      compound.concepts.forEach(c => expandedConcepts.add(c))
      compound.excludeConcepts?.forEach(c => excludedConcepts.add(c))
      break
    }
  }

  // 2. Token-level concept expansion (Safe exact & inflection matching, NO substring containment bugs)
  tokens.forEach(tok => {
    expandedConcepts.add(tok)

    Object.entries(CONCEPT_SYNONYMS).forEach(([key, synonyms]) => {
      if (excludedConcepts.has(key)) return

      // Don't expand into peptide concepts unless user explicitly asked for peptides
      if ((key === 'peptides' || key === 'glp1' || key === 'bpc') && !hasExplicitPeptideQuery) {
        return
      }

      const isExact = key === tok
      const isPlural = key === tok + 's' || tok === key + 's'
      const isIng = tok.endsWith('ing') && (key === tok.slice(0, -3) || key === tok.slice(0, -3) + 'e')
      const isLift = (tok === 'lift' || tok === 'lifting' || tok === 'lifted') && (key === 'lifting' || key === 'weights' || key === 'muscle' || key === 'resistance')
      const isWeight = (tok === 'weight' || tok === 'weights') && (key === 'weights' || key === 'lifting' || key === 'resistance')

      if (isExact || isPlural || isIng || isLift || isWeight) {
        expandedConcepts.add(key)
        synonyms.forEach(syn => {
          if (!excludedConcepts.has(syn)) {
            expandedConcepts.add(syn)
          }
        })
      }
    })
  })

  // Purge any excluded concepts from the final set
  excludedConcepts.forEach(c => expandedConcepts.delete(c))

  return { tokens, expandedConcepts, matchedCompound, hasExplicitPeptideQuery }
}

/**
 * Computes semantic & lexical relevance score for a modality.
 * Returns { isMatch: boolean, score: number }.
 */
export function calculateModalityRelevance(
  mod: Modality,
  rawQuery: string,
  searchResults: SemanticSearchResult[] = []
): { isMatch: boolean; score: number } {
  const q = rawQuery.trim().toLowerCase()
  if (!q) {
    return { isMatch: true, score: 0 }
  }

  const { tokens, expandedConcepts, matchedCompound, hasExplicitPeptideQuery } = extractSearchTokens(q)
  if (tokens.length === 0) {
    return { isMatch: true, score: 0 }
  }

  const name = (mod.display_name || mod.name || '').toLowerCase()
  const modId = (mod.id || '').toLowerCase()
  const type = (mod.modality_type || '').toLowerCase()
  const cat = (mod.category || '').toLowerCase()
  const desc = (mod.brief_description || '').toLowerCase()
  const headline = (mod.headline_benefit || '').toLowerCase()
  const why = (mod.expanded_why || '').toLowerCase()
  const primary = (mod.primary_outcome || '').toLowerCase()
  const secondary = Array.isArray(mod.secondary_outcomes) ? mod.secondary_outcomes.join(' ').toLowerCase() : ''
  const mechanism = (mod.mechanism_of_action || '').toLowerCase()

  // Identify whether this modality is a peptide or injectable pharmacology
  const isPeptide = 
    cat.includes('peptide') ||
    type.includes('peptide') ||
    (mod as any).logging_type === 'peptide' ||
    Boolean(mod.peptide_metadata) ||
    name.includes('peptide') ||
    name.includes('subq') ||
    name.includes('bpc-157') ||
    name.includes('bpc 157') ||
    name.includes('cjc-1295') ||
    name.includes('cjc 1295') ||
    name.includes('ipamorelin') ||
    name.includes('tirzepatide') ||
    name.includes('semaglutide') ||
    name.includes('retatrutide') ||
    name.includes('semax') ||
    name.includes('selank') ||
    name.includes('epitalon') ||
    name.includes('ghk-cu') ||
    name.includes('aod-9604') ||
    name.includes('tesamorelin')

  // PEPTIDE GUARDRAIL FOR GENERAL NON-PEPTIDE QUERIES:
  // If the query has NO peptide intent (e.g. "weight lifting", "sleep", "focus", "cold plunge"),
  // peptides must NEVER match based on description buzzwords or concept expansion.
  if (isPeptide && !hasExplicitPeptideQuery) {
    const directNameTokenMatch = tokens.some(t => t.length >= 4 && name.includes(t))
    if (!directNameTokenMatch) {
      return { isMatch: false, score: 0 }
    }
  }

  let score = 0

  // 1. Direct whole-query match bonuses
  if (name === q) score += 2000
  else if (name.startsWith(q)) score += 1000
  else if (name.includes(q)) score += 600

  if (headline.includes(q)) score += 350
  if (primary.includes(q) || secondary.includes(q)) score += 300
  if (desc.includes(q)) score += 200

  // 2. Multi-word Compound Phrase Primary Domain Bonuses
  // Guarantees foundational modalities rank highest for their core domain
  if (matchedCompound) {
    if (matchedCompound.primaryModalityIds?.includes(modId)) {
      if (modId === 'resistance_training' || modId === 'heavy_resistance_training') {
        score += 1600
      } else if (modId === 'creatine_monohydrate') {
        score += 1300
      } else {
        score += 1400
      }
    } else if (matchedCompound.primaryModalityTerms?.some(term => name.includes(term) || headline.includes(term) || primary.includes(term))) {
      score += 750
    }
    if (matchedCompound.targetCategories?.some(tc => cat.includes(tc.toLowerCase()) || type.includes(tc.toLowerCase()))) {
      score += 150
    }
  }

  // 3. Token-level matching across fields
  let matchedTokensCount = 0
  tokens.forEach(tok => {
    let tokenMatched = false

    if (name.includes(tok)) {
      score += 600
      tokenMatched = true
    }
    if (headline.includes(tok)) {
      score += 200
      tokenMatched = true
    }
    if (primary.includes(tok) || secondary.includes(tok)) {
      score += 150
      tokenMatched = true
    }
    if (cat.includes(tok) || type.includes(tok)) {
      score += 120
      tokenMatched = true
    }
    if (desc.includes(tok) || why.includes(tok) || mechanism.includes(tok)) {
      score += 80
      tokenMatched = true
    }

    if (tokenMatched) matchedTokensCount++
  })

  // 4. Concept expansion & synonym matches
  expandedConcepts.forEach(concept => {
    const cleanConcept = concept.replace(/_/g, ' ')
    if (name.includes(cleanConcept)) score += 180
    else if (headline.includes(cleanConcept) || primary.includes(cleanConcept)) score += 120
    else if (desc.includes(cleanConcept) || why.includes(cleanConcept) || cat.includes(cleanConcept)) score += 60
  })

  // 5. Remote semantic search RPC match bonus (only for meaningful similarity >= 0.45)
  // Disabled for peptides on non-peptide queries to prevent false vector associations
  if (!isPeptide || hasExplicitPeptideQuery) {
    const semMatch = searchResults.find(r => r.id === mod.id)
    if (semMatch && semMatch.similarity >= 0.45) {
      score += Math.round(semMatch.similarity * 500)
    }
  }

  // 6. Peptide priority damping on general queries
  // When a peptide matches via a secondary name token on a non-peptide query,
  // dampen its score so foundational lifestyle & nutrition modalities remain first.
  if (isPeptide && !hasExplicitPeptideQuery) {
    score = Math.max(0, Math.round(score * 0.35) - 250)
  }

  // 7. Determine if modality qualifies as a genuine search match
  const hasStrongTokenMatch = tokens.length === 1 
    ? (matchedTokensCount === 1 && score >= 120) 
    : (matchedTokensCount >= Math.ceil(tokens.length * 0.5) && score >= 120)

  const semMatch = searchResults.find(r => r.id === mod.id)
  const isMatch = (!isPeptide && semMatch && semMatch.similarity >= 0.45) || hasStrongTokenMatch || score >= 150

  return { isMatch, score }
}

/**
 * Computes semantic & lexical relevance score for a protocol.
 * Returns { isMatch: boolean, score: number }.
 */
export function calculateProtocolRelevance(
  proto: any,
  rawQuery: string
): { isMatch: boolean; score: number } {
  const q = rawQuery.trim().toLowerCase()
  if (!q) {
    return { isMatch: true, score: 0 }
  }

  const { tokens, expandedConcepts, matchedCompound, hasExplicitPeptideQuery } = extractSearchTokens(q)
  if (tokens.length === 0) {
    return { isMatch: true, score: 0 }
  }

  const name = (proto.name || '').toLowerCase()
  const desc = (proto.description || '').toLowerCase()
  const primaryGoal = (proto.primary_goal || proto.goal || '').toLowerCase()
  const source = (proto.source_label || proto.author_id || '').toLowerCase()
  const vectors = Array.isArray(proto.target_vectors) ? proto.target_vectors.join(' ').toLowerCase() : ''
  const steps = (proto.steps || proto.protocol_steps || [])
    .map((s: any) => `${s.modality?.display_name || s.modality?.name || ''} ${s.notes || ''}`)
    .join(' ')
    .toLowerCase()

  const fullText = `${name} ${desc} ${primaryGoal} ${source} ${vectors} ${steps}`

  // Check if protocol is primarily peptide-focused
  const isPeptideProtocol =
    fullText.includes('peptide') ||
    fullText.includes('bpc-157') ||
    fullText.includes('cjc-1295') ||
    fullText.includes('ipamorelin') ||
    fullText.includes('tirzepatide') ||
    fullText.includes('semaglutide') ||
    fullText.includes('retatrutide') ||
    fullText.includes('wolverine') ||
    fullText.includes('secretagogue')

  if (isPeptideProtocol && !hasExplicitPeptideQuery) {
    const directNameTokenMatch = tokens.some(t => t.length >= 4 && name.includes(t))
    if (!directNameTokenMatch) {
      return { isMatch: false, score: 0 }
    }
  }

  let score = 0

  // 1. Direct whole-query match
  if (name === q) score += 2000
  else if (name.startsWith(q)) score += 1000
  else if (name.includes(q)) score += 600

  if (primaryGoal.includes(q)) score += 350
  if (source.includes(q)) score += 300
  if (steps.includes(q)) score += 250
  if (desc.includes(q)) score += 150

  // 2. Compound phrase primary domain bonus for protocols
  if (matchedCompound) {
    if (matchedCompound.primaryModalityTerms?.some(term => name.includes(term) || primaryGoal.includes(term) || steps.includes(term))) {
      score += 800
    }
  }

  // 3. Token-level matching
  let matchedTokensCount = 0
  tokens.forEach(tok => {
    let tokenMatched = false

    if (name.includes(tok)) {
      score += 400
      tokenMatched = true
    }
    if (primaryGoal.includes(tok) || vectors.includes(tok)) {
      score += 200
      tokenMatched = true
    }
    if (source.includes(tok)) {
      score += 150
      tokenMatched = true
    }
    if (steps.includes(tok)) {
      score += 120
      tokenMatched = true
    }
    if (desc.includes(tok)) {
      score += 80
      tokenMatched = true
    }

    if (tokenMatched) matchedTokensCount++
  })

  // 4. Concept expansion & synonym matches
  expandedConcepts.forEach(concept => {
    const cleanConcept = concept.replace(/_/g, ' ')
    if (name.includes(cleanConcept)) score += 180
    else if (primaryGoal.includes(cleanConcept) || vectors.includes(cleanConcept)) score += 120
    else if (steps.includes(cleanConcept) || desc.includes(cleanConcept)) score += 60
  })

  if (isPeptideProtocol && !hasExplicitPeptideQuery) {
    score = Math.max(0, Math.round(score * 0.35) - 200)
  }

  // Determine if protocol qualifies as a genuine search match
  const hasStrongTokenMatch = tokens.length === 1 
    ? (matchedTokensCount === 1 && score >= 120) 
    : (matchedTokensCount >= Math.ceil(tokens.length * 0.5) && score >= 120)

  const isMatch = hasStrongTokenMatch || score >= 150

  return { isMatch, score }
}

