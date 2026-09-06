import { Protocol, ProtocolStep } from '@/lib/types'
import { HUBERMAN_DOAC_MODALITIES } from './hubermanDoacModalities'
import { BUILT_IN_LONGEVITY_MODALITIES } from './builtInLongevityModalities'

const findModality = (id: string) => {
  const inDoac = HUBERMAN_DOAC_MODALITIES.find(m => m.id === id)
  if (inDoac) return inDoac
  const inLongevity = BUILT_IN_LONGEVITY_MODALITIES.find(m => m.id === id)
  if (inLongevity) return inLongevity
  return null
}

/**
 * Master Protocol: Andrew Huberman Diary of a CEO 10-Protocol Operating System
 * (From his book Protocols: An Operating Manual for the Human Body).
 */
export const HUBERMAN_DOAC_MASTER_PROTOCOL: Protocol & { steps: ProtocolStep[] } = {
  id: 'andrew_huberman_doac_operating_system',
  slug: 'huberman-doac',
  name: 'Andrew Huberman: Diary of a CEO 10-Protocol Operating System',
  protocol_type: 'expert_created',
  primary_goal: 'Circadian Optimization, Tenacity & Autonomous Performance',
  secondary_goals: [
    'SCN Circadian Entrainment',
    'Dopamine & aMCC Willpower',
    'Real-Time Autonomic Stress Control',
    'Postprandial Glycemic Disposal',
    'Deep Sleep & REM Architecture'
  ],
  target_population: 'Anyone seeking a science-grounded, zero-cost daily operating system to master morning alertness, focus, stress mitigation, and restorative sleep.',
  difficulty_level: 'Beginner to Intermediate',
  evidence_level: 'High (Clinical RCTs & Neurobiology Literature)',
  safety_level: 'High',
  description: 'The definitive 10-protocol daily operating system detailed by Stanford neuroscientist Dr. Andrew Huberman on The Diary of a CEO. Sequenced along the natural arc of the 24-hour day to maximize morning cortisol, sustain afternoon energy, and shield restorative nocturnal sleep.',
  steps: [
    {
      id: 'huberman_doac_step_1_hydrate',
      protocol_id: 'andrew_huberman_doac_operating_system',
      modality_id: 'baseline_hydration_electrolytes',
      ordering_index: 1,
      display_order: 1,
      timing_slot: 'waking',
      timing_anchor: 'upon-waking',
      frequency: 'Daily Upon Waking',
      required: true,
      dose_text: '16–32 oz clean water + optional electrolytes',
      duration: '5 mins',
      instructions: 'Immediately upon waking and emptying your bladder, drink 16 to 32 ounces of clean water. Adding electrolytes (sodium, potassium, magnesium) is optional but recommended if exercising early. This stimulates ascending vagal pathways to wake up the brain and supports a healthy morning cortisol curve.',
      notes: 'Protocol 1: Hydrate first thing to activate vagal afferents and boost the cortisol awakening response.',
      target_outcomes: ['Morning Alertness', 'Focus', 'Hydration'],
      modality: {
        id: 'baseline_hydration_electrolytes',
        slug: 'baseline-hydration-electrolytes',
        name: 'Morning Hydration & Mineral Electrolytes',
        display_name: 'Protocol 1: Morning Hydration (16–32 oz)',
        category: 'nutrition',
        modality_type: 'lifestyle',
        status: 'active',
        brief_description: '16–32 oz of clean water with optional mineral electrolytes consumed immediately upon waking to stimulate ascending vagal arousal and trigger the morning cortisol pulse.',
        headline_benefit: 'Reverses overnight cellular dehydration, activates renal-vagal alertness pathways, and jumpstarts metabolic energy.',
        primary_outcome: 'Morning Alertness & Energy',
        dose_or_exposure: '16–32 oz clean water + optional mineral salt / electrolytes',
        timing_summary: 'waking',
        frequency: 'Daily Upon Waking',
        scientific_references: [
          {
            title: 'Dehydration and Cognitive Performance in Adults (J Am Coll Nutr)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/22855911/',
            type: 'pubmed'
          }
        ]
      }
    },
    {
      id: 'huberman_doac_step_2_sunlight',
      protocol_id: 'andrew_huberman_doac_operating_system',
      modality_id: 'morning_sunlight_exposure',
      ordering_index: 2,
      display_order: 2,
      timing_slot: 'morning',
      timing_anchor: 'morning',
      frequency: 'Daily within 30–60m of waking',
      required: true,
      dose_text: '10–15 mins on clear days • 20–30 mins on overcast days (or 10,000-lux lamp)',
      duration: '10–20 mins',
      instructions: 'Go outside within 30 to 60 minutes of waking without sunglasses (corrective eyeglasses/contacts are fine). Face toward the sun without staring directly at it. Low solar angle light stimulates retinal melanopsin ipRGC cells, synchronizing your master SCN clock, driving morning cortisol higher, and setting a 14-hour timer for nighttime melatonin onset.',
      notes: 'Protocol 2: Sunlight or Bright Light. Do not view through windows or windshields; direct outdoor photon exposure is required.',
      target_outcomes: ['Circadian Rhythm', 'Sleep Latency', 'Daytime Mood'],
      modality: findModality('morning_sunlight_exposure') || {
        id: 'morning_sunlight_exposure',
        slug: 'morning-sunlight-exposure',
        name: 'Morning Sunlight Circadian Reset',
        display_name: 'Protocol 2: Morning Sunlight / 10k Lux Light',
        category: 'sleep',
        modality_type: 'circadian',
        status: 'active',
        brief_description: 'Direct outdoor sunlight exposure within 30–60 minutes of waking to entrain the SCN clock and boost cortisol.',
        headline_benefit: 'Activates retinal ipRGC melanopsin pathways, spikes cortisol awakening response, and starts nocturnal melatonin timer.',
        primary_outcome: 'Circadian Phase Setting & Nighttime Melatonin Peak',
        dose_or_exposure: '10–15 mins clear sun • 20–30 mins overcast',
        timing_summary: 'morning',
        frequency: 'Daily within 60 mins of waking'
      }
    },
    {
      id: 'huberman_doac_step_3_caffeine_delay',
      protocol_id: 'andrew_huberman_doac_operating_system',
      modality_id: 'delay_caffeine_90_120',
      ordering_index: 3,
      display_order: 3,
      timing_slot: 'morning',
      timing_anchor: 'morning',
      frequency: 'Daily',
      required: false,
      dose_text: 'Delay first caffeine consumption 90–120 minutes post-wake (200–400mg caffeine)',
      duration: '90–120 min window',
      instructions: 'Wait 90 to 120 minutes after waking before drinking your first coffee or caffeinated tea. This allows your natural cortisol awakening surge to clear out residual sleep-inducing adenosine naturally. Delaying caffeine prevents the dreaded 2:00 PM afternoon energy crash. Daily dose of 200–400mg caffeine is neuroprotective.',
      notes: 'Adenosine clearance window: Hydrate with water first; delay coffee until 90–120 minutes after waking.',
      target_outcomes: ['Sustained Afternoon Energy', 'Circadian Stability'],
      modality: findModality('delay_caffeine_90_120') || {
        id: 'delay_caffeine_90_120',
        slug: 'delay-caffeine-90-120',
        name: 'Delay Morning Caffeine (90–120m)',
        display_name: 'Circadian Caffeine Delay (90–120m Post-Wake)',
        category: 'nutrition',
        modality_type: 'lifestyle',
        status: 'active',
        brief_description: 'Delay coffee/caffeine by 90–120 minutes post-waking to clear adenosine and avoid the afternoon crash.',
        headline_benefit: 'Prevents the afternoon 2 PM crash and preserves morning cortisol amplitude.',
        primary_outcome: 'Circadian Energy Stability',
        dose_or_exposure: 'Delay 90–120 minutes post-waking',
        timing_summary: 'morning',
        frequency: 'Daily'
      }
    },
    {
      id: 'huberman_doac_step_4_exercise',
      protocol_id: 'andrew_huberman_doac_operating_system',
      modality_id: 'huberman_exercise_routine',
      ordering_index: 4,
      display_order: 4,
      timing_slot: 'morning',
      timing_anchor: 'morning',
      frequency: '6x / week (3 days lifting, 3 days cardio, 1 rest day)',
      required: true,
      dose_text: '45–60 mins within first 3–4 hours of day • Compound lifts or cardio split',
      duration: '45–60 mins',
      instructions: 'Exercise early in the first 3 to 4 hours of your day. Alternating split: 3 days compound resistance training (pull-ups, rows, dips, presses, squats/hinges; 2–3 work sets near failure) + 3 days cardio (1x 60m Zone 2, 1x 30m tempo, 1x HIIT AirDyne sprint intervals) + 1 rest day after legs. Exercising at the same time early entrains cortisol and anticipatory energy.',
      notes: 'Protocol 3: Exercise Early. Doing cardiovascular or resistance training early anchors your circadian biological clock.',
      target_outcomes: ['VO2 Max', 'Muscular Strength', 'Cortisol Entrainment'],
      modality: findModality('huberman_exercise_routine')!
    },
    {
      id: 'huberman_doac_step_5_cold',
      protocol_id: 'andrew_huberman_doac_operating_system',
      modality_id: 'cold_plunge',
      ordering_index: 5,
      display_order: 5,
      timing_slot: 'morning',
      timing_anchor: 'morning',
      frequency: '3–4x / week (11 mins weekly total) or daily cold shower',
      required: false,
      dose_text: '2–3 mins @ 50°F–55°F (10°C–13°C) or 60–180s cold shower',
      duration: '2–3 mins',
      temperature: '50°F–55°F / 10°C–13°C',
      instructions: 'Immerse to neck level in 50°F–55°F cold water for 2–3 minutes (or finish your morning shower with 60–180 seconds of full cold). Cold does NOT spike cortisol excessively, but triggers a massive, prolonged 250% surge in dopamine and norepinephrine. In the first 20–30 seconds, resist panic and practice calm nasal breathing to build top-down prefrontal inhibition and anterior midcingulate cortex (aMCC) willpower.',
      notes: 'Protocol 4: Deliberate Cold Exposure & Stress Tolerance. Trains the ability to keep your head calm when flooded with adrenaline.',
      target_outcomes: ['Dopamine Elevation', 'Mental Resilience', 'aMCC Tenacity'],
      modality: findModality('cold_plunge') || {
        id: 'cold_plunge',
        slug: 'cold-plunge',
        name: 'Deliberate Cold Plunge Immersion',
        display_name: 'Protocol 4: Deliberate Cold Exposure (50°F–55°F)',
        category: 'fitness',
        modality_type: 'thermal',
        status: 'active',
        brief_description: '2–3 minute cold immersion in 50°F–55°F water to surge dopamine and build top-down inhibition.',
        headline_benefit: 'Elevates sustained dopamine by 250%, increases brown fat thermogenesis, and trains top-down emotional calm under stress.',
        primary_outcome: 'Dopamine & Autonomic Resilience',
        dose_or_exposure: '2–3 mins per session • 11 mins weekly',
        temperature: '50°F–55°F / 10°C–13°C',
        timing_summary: 'morning',
        frequency: '3–4x per week'
      }
    },
    {
      id: 'huberman_doac_step_6_focus',
      protocol_id: 'andrew_huberman_doac_operating_system',
      modality_id: 'ultradian_focus_neuroplasticity',
      ordering_index: 6,
      display_order: 6,
      timing_slot: 'midday',
      timing_anchor: 'midday',
      frequency: 'Daily (1–2 bouts)',
      required: true,
      dose_text: '90–120 mins uninterrupted deep work • Phone in separate room',
      duration: '90–120 mins',
      instructions: 'Dedicate 90 to 120 minutes to challenging mental work. Place your smartphone in an entirely separate room to restore full cognitive capacity. Target an optimal ~15% error rate; the friction you feel is noradrenaline tagging synapses for neuroplasticity. Follow with 10–20 minutes of Non-Sleep Deep Rest (NSDR) or eyes-closed quiet to consolidate learning.',
      notes: 'Protocols 8 & 9: Focus and Neuroplasticity. Error and friction stimulate cerebellar-cortical plasticity.',
      target_outcomes: ['Executive Focus', 'Neuroplasticity', 'Deep Output'],
      modality: findModality('ultradian_focus_neuroplasticity')!
    },
    {
      id: 'huberman_doac_step_7_sigh',
      protocol_id: 'andrew_huberman_doac_operating_system',
      modality_id: 'cyclic_sighing',
      ordering_index: 7,
      display_order: 7,
      timing_slot: 'midday',
      timing_anchor: 'midday',
      frequency: 'Daily / As-Needed for Stress',
      required: true,
      dose_text: '1–3 repetitions in acute stress or 5 minutes continuous for HRV',
      duration: '1–5 mins',
      instructions: 'Take two consecutive sharp inhales through the nose (the second short inhale fully pops open collapsed pulmonary alveoli balloons), followed by a slow, extended, complete exhalation through the mouth until lungs are empty. Engages the parafacial nucleus and respiratory sinus arrhythmia via the descending vagus nerve to rapidly slow heart rate in real time.',
      notes: 'Protocol 5: The Physiological Sigh. The fastest evidence-based real-time tool to de-escalate autonomic panic and elevate HRV.',
      target_outcomes: ['Acute Stress Relief', 'HRV Increase', 'Autonomic Calm'],
      modality: findModality('cyclic_sighing') || {
        id: 'cyclic_sighing',
        slug: 'cyclic-sighing',
        name: 'Cyclic Sighing (Physiological Sigh)',
        display_name: 'Protocol 5: The Physiological Sigh',
        category: 'mind',
        modality_type: 'breathwork',
        status: 'active',
        brief_description: 'Two sharp nasal inhales followed by an extended oral exhale to rapidly down-regulate heart rate and stress.',
        headline_benefit: 'Rapidly resets the autonomic nervous system, lowers heart rate, and elevates HRV faster than meditation.',
        primary_outcome: 'Autonomic HRV & Acute Anxiety Reduction',
        dose_or_exposure: '2 inhales + 1 long exhale (1–5 mins)',
        timing_summary: 'anytime',
        frequency: 'Daily / As-Needed'
      }
    },
    {
      id: 'huberman_doac_step_8_glucose_walk',
      protocol_id: 'andrew_huberman_doac_operating_system',
      modality_id: 'post_meal_glucose_walk',
      ordering_index: 8,
      display_order: 8,
      timing_slot: 'post_meal',
      timing_anchor: 'post-meal',
      frequency: '1–3x daily (within 30m after meals)',
      required: true,
      dose_text: '5–15 mins brisk walking or 10 air squats every 45 mins',
      duration: '10–15 mins',
      instructions: 'Within 30 minutes of finishing lunch or dinner, take a 5 to 15 minute relaxed or brisk walk (or if stuck indoors, 10 air squats). Contractile activity in soleus and quadriceps muscles clears glucose from the bloodstream via insulin-independent GLUT4 translocation, flattening postprandial glucose spikes and preventing afternoon brain fog.',
      notes: 'Blood Sugar Management: 5–15 minutes of post-meal walking flattens glucose peaks and eliminates energy crashes.',
      target_outcomes: ['Glycemic Control', 'Post-Meal Energy', 'Metabolic Health'],
      modality: findModality('post_meal_glucose_walk') || {
        id: 'post_meal_glucose_walk',
        slug: 'post-meal-glucose-walk',
        name: 'Post-Meal Glucose Walk',
        display_name: 'Post-Meal Glucose Disposal Walk',
        category: 'fitness',
        modality_type: 'lifestyle',
        status: 'active',
        brief_description: '10–15 minute walk initiated within 30 minutes of meal completion to blunt blood glucose spikes.',
        headline_benefit: 'Blunts postprandial blood glucose spikes by ~30% via insulin-independent GLUT4 muscle translocation.',
        primary_outcome: 'Metabolic Health & Glycemic Control',
        dose_or_exposure: '10–15 minutes brisk walking',
        timing_summary: 'post-meal',
        frequency: 'Post-Meal (1–3x daily)'
      }
    },
    {
      id: 'huberman_doac_step_9_evening_light',
      protocol_id: 'andrew_huberman_doac_operating_system',
      modality_id: 'evening_light_netflix_inoculation',
      ordering_index: 9,
      display_order: 9,
      timing_slot: 'evening',
      timing_anchor: 'sunset',
      frequency: 'Daily (Late Afternoon / Sunset)',
      required: true,
      dose_text: '10–15 mins natural daylight viewing without sunglasses',
      duration: '10–15 mins',
      instructions: 'As the sun descends, step outside without sunglasses for 10–15 minutes of natural daylight exposure. Low-angle sunset wavelengths adjust retinal sensitivity, buffering your eyes against the melatonin-suppressive and cortisol-elevating effects of screens and indoor lighting later that evening.',
      notes: 'Protocol 6: Evening Light — The "Netflix Inoculation". Protects your nocturnal melatonin rhythm from digital devices.',
      target_outcomes: ['Melatonin Protection', 'Circadian Phase Buffer', 'Sleep Quality'],
      modality: findModality('evening_light_netflix_inoculation')!
    },
    {
      id: 'huberman_doac_step_10_growth',
      protocol_id: 'andrew_huberman_doac_operating_system',
      modality_id: 'daily_unconscious_space_growth',
      ordering_index: 10,
      display_order: 10,
      timing_slot: 'evening',
      timing_anchor: 'evening',
      frequency: 'Daily',
      required: false,
      dose_text: '15–20 mins non-striving mental space + daily role integrity',
      duration: '15–20 mins',
      instructions: 'James Hollis framework: Fulfill daily roles with discipline ("Shut Up, Suit Up, Show Up"). Then, once per day, deliberately step out of stimulus-response mode for 15–20 minutes. Sit quietly without a phone, draw, listen to music, or walk. Allow your subconscious mind to process emotions and core desires without attempting to solve problems.',
      notes: 'Protocol 10: Personal Development. Balancing external role fulfillment with daily non-striving internal space.',
      target_outcomes: ['Autonomous Motivation', 'Mental Clarity', 'Stress Resolution'],
      modality: findModality('daily_unconscious_space_growth')!
    },
    {
      id: 'huberman_doac_step_11_dark_cool_room',
      protocol_id: 'andrew_huberman_doac_operating_system',
      modality_id: 'dark_cool_sleep_environment',
      ordering_index: 11,
      display_order: 11,
      timing_slot: 'pre_bed',
      timing_anchor: 'pre-bed',
      frequency: 'Nightly',
      required: true,
      dose_text: '65°F–68°F (18°C) • 0 lux pitch darkness • No screens 30m pre-bed',
      duration: 'Nightly',
      temperature: '65°F–68°F / 18°C–20°C',
      instructions: 'Set your sleeping environment to 65°F–68°F (or use a cooling mattress). Eliminate 100% of light with blackout curtains or a contoured eye mask. Power down all screens 30 minutes before bed. Ambient cooling facilitates the 1°C core body temperature drop required for slow-wave deep sleep, while complete darkness prevents nocturnal cortisol spikes.',
      notes: 'Protocol 7: A Dark & Cool Sleep Environment. Eliminates nocturnal cortisol bumps and doubles delta deep sleep.',
      target_outcomes: ['Slow-Wave Deep Sleep', 'Resting HR Dip', 'Sleep Latency'],
      modality: findModality('dark_cool_sleep_environment')!
    },
    {
      id: 'huberman_doac_step_12_sleep_stack',
      protocol_id: 'andrew_huberman_doac_operating_system',
      modality_id: 'matthew_walker_sleep_triad',
      ordering_index: 12,
      display_order: 12,
      timing_slot: 'pre_bed',
      timing_anchor: 'pre-bed',
      frequency: 'Nightly 30–60m Before Bed',
      required: false,
      dose_text: '145–400mg Mag L-Threonate or Bisglycinate + 50mg Apigenin + 100–200mg L-Theanine',
      duration: 'Nightly oral stack',
      instructions: 'Take 145mg to 400mg Magnesium L-Threonate (or Magnesium Bisglycinate), 50mg Apigenin, and 100–200mg L-Theanine with 4oz water 30–60 minutes before lights out. L-Threonate crosses the blood-brain barrier to quiet cortical excitation; Apigenin acts as a natural GABA chloride-channel agonist; L-Theanine induces alpha-wave relaxation.',
      notes: 'Huberman Core Sleep Stack: Magnesium L-Threonate + Apigenin + L-Theanine 30–60 minutes pre-bed.',
      target_outcomes: ['Sleep Latency', 'GABA Activation', 'Deep Sleep Duration'],
      modality: findModality('matthew_walker_sleep_triad') || {
        id: 'matthew_walker_sleep_triad',
        slug: 'matthew-walker-sleep-triad',
        name: 'Huberman Sleep Stack (Magnesium + Apigenin + Theanine)',
        display_name: 'Core Sleep Stack (Mag L-Threonate + Apigenin + Theanine)',
        category: 'sleep',
        modality_type: 'supplement',
        status: 'active',
        brief_description: '145mg Mag L-Threonate + 50mg Apigenin + 100–200mg L-Theanine taken 30–60 minutes before sleep.',
        headline_benefit: 'Crosses the blood-brain barrier to enhance GABAergic neurotransmission and delta slow-wave sleep depth.',
        primary_outcome: 'Slow-Wave Sleep EEG Power & Sleep Latency',
        dose_or_exposure: '145mg Mag L-Threonate + 50mg Apigenin + 100–200mg L-Theanine',
        timing_summary: 'pre-bed',
        frequency: 'Nightly 30–60m Before Bed'
      }
    },
    {
      id: 'huberman_doac_step_13_sleep_rescue',
      protocol_id: 'andrew_huberman_doac_operating_system',
      modality_id: 'sleep_rescue_eye_movement',
      ordering_index: 13,
      display_order: 13,
      timing_slot: 'night',
      timing_anchor: 'night',
      frequency: 'As-Needed for Midnight Awakenings',
      required: false,
      dose_text: '10 slow exhales + closed-eye ocular sweeps (lateral, vertical, circular)',
      duration: '3–5 mins',
      instructions: 'If you wake up at 2:00 or 3:00 AM and cannot fall back asleep: keep the lights completely off. Complete 10 long, slow exhalations. Then, with eyes closed, move your eyes slowly left to right, up and down, counter-clockwise in a circle, clockwise, then converge downward toward your nostrils with a final long exhale. This shuts off cerebellar proprioceptive circuits and limb awareness, prompting immediate re-entry into deep sleep.',
      notes: 'Falling Back Asleep: The Eye Movement Trick. Disengages cerebellar proprioception in 3 minutes.',
      target_outcomes: ['Midnight Sleep Resumption', 'Mental Quieting'],
      modality: findModality('sleep_rescue_eye_movement')!
    }
  ]
}

/**
 * Top Individual Focused Sub-Protocols
 * Allows starting out directly with specific core pillars mentioned on DOAC.
 */
export const HUBERMAN_SUB_PROTOCOLS: (Protocol & { steps: ProtocolStep[] })[] = [
  {
    id: 'huberman_morning_circadian',
    slug: 'huberman-morning-circadian',
    name: 'Huberman Morning Circadian & Alertness Stack',
    protocol_type: 'expert_created',
    primary_goal: 'Circadian Phase Setting & Morning Alertness',
    secondary_goals: ['Cortisol Awakening Peak', 'Adenosine Clearance', 'All-Day Energy'],
    target_population: 'Anyone struggling with morning grogginess, brain fog, or afternoon energy crashes.',
    difficulty_level: 'Beginner',
    evidence_level: 'High (Clinical Trials)',
    safety_level: 'High',
    description: 'The foundation of all Huberman protocols: 16–32 oz morning hydration + 10–30 mins outdoor sunlight within 60 mins of waking + 90–120 min caffeine delay.',
    steps: [
      HUBERMAN_DOAC_MASTER_PROTOCOL.steps[0], // Hydrate
      HUBERMAN_DOAC_MASTER_PROTOCOL.steps[1], // Sunlight
      HUBERMAN_DOAC_MASTER_PROTOCOL.steps[2]  // Caffeine Delay
    ]
  },
  {
    id: 'huberman_stress_reset',
    slug: 'huberman-stress-reset',
    name: 'Huberman Real-Time Stress Reset',
    protocol_type: 'expert_created',
    primary_goal: 'Real-Time Autonomic Regulation & HRV Elevation',
    secondary_goals: ['Parafacial Nucleus Activation', 'Respiratory Sinus Arrhythmia', 'Acute Panic De-escalation'],
    target_population: 'Individuals under high psychological or physical stress seeking immediate on-demand calm.',
    difficulty_level: 'Beginner',
    evidence_level: 'High (Stanford / Cell Reports Medicine RCT)',
    safety_level: 'High',
    description: 'The Stanford-proven physiological sigh protocol: two sharp nasal inhales followed by slow, extended oral exhale to instantly slow heart rate in real time.',
    steps: [
      HUBERMAN_DOAC_MASTER_PROTOCOL.steps[6] // Physiological Sigh
    ]
  },
  {
    id: 'huberman_cold_tenacity',
    slug: 'huberman-cold-tenacity',
    name: 'Huberman Cold Exposure & Willpower Inoculation',
    protocol_type: 'expert_created',
    primary_goal: 'Dopamine Elevation & aMCC Tenacity',
    secondary_goals: ['Prefrontal Top-Down Inhibition', 'Brown Fat Thermogenesis', 'Willpower Neuroplasticity'],
    target_population: 'Individuals building mental toughness, breaking procrastination, or boosting baseline dopamine.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Clinical RCTs)',
    safety_level: 'High',
    description: '2–3 mins in 50°F–55°F cold water (or cold shower) to surge sustained dopamine (+250%) and enlarge the anterior midcingulate cortex (aMCC).',
    steps: [
      HUBERMAN_DOAC_MASTER_PROTOCOL.steps[4] // Cold Exposure
    ]
  },
  {
    id: 'huberman_metabolic_walk',
    slug: 'huberman-metabolic-walk',
    name: 'Huberman Post-Meal Glycemic Control',
    protocol_type: 'expert_created',
    primary_goal: 'Blunting Postprandial Glucose Spikes',
    secondary_goals: ['Insulin-Independent GLUT4 Translocation', 'Afternoon Fatigue Prevention', 'Metabolic Health'],
    target_population: 'Anyone experiencing post-meal lethargy, blood sugar crashes, or metabolic resistance.',
    difficulty_level: 'Beginner',
    evidence_level: 'High (Diabetologia Clinical Trials)',
    safety_level: 'High',
    description: '5–15 minute brisk ambulation within 30 minutes after meals to activate skeletal muscle GLUT4 glucose uptake without pancreatic insulin spikes.',
    steps: [
      HUBERMAN_DOAC_MASTER_PROTOCOL.steps[7] // Post-Meal Walk
    ]
  },
  {
    id: 'huberman_focus_neuroplasticity',
    slug: 'huberman-focus-neuroplasticity',
    name: 'Huberman 90-Min Focus & Neuroplasticity Bout',
    protocol_type: 'expert_created',
    primary_goal: 'Prefrontal Focus & Error-Driven Synaptic Plasticity',
    secondary_goals: ['Tenacity Building', 'Smartphone Cognitive Drain Removal', 'NSDR Synaptic Consolidation'],
    target_population: 'Knowledge workers, students, and creators needing deep mental output and rapid skill acquisition.',
    difficulty_level: 'Intermediate',
    evidence_level: 'High (Neuron / Cognitive Science)',
    safety_level: 'High',
    description: 'A 90–120 minute ultradian deep work bout with phone in another room, embracing an optimal ~15% error rate, followed by 10m NSDR.',
    steps: [
      HUBERMAN_DOAC_MASTER_PROTOCOL.steps[5] // 90-Min Focus Bout
    ]
  },
  {
    id: 'huberman_sleep_rescue',
    slug: 'huberman-sleep-rescue',
    name: 'Huberman Sleep Environment & Midnight Rescue',
    protocol_type: 'expert_created',
    primary_goal: 'Delta Slow-Wave Deep Sleep & 2 AM Wake Rescue',
    secondary_goals: ['Cerebellar Proprioceptive Quieting', 'Ambient Cooling (65°F–68°F)', 'Cortisol Suppression'],
    target_population: 'Anyone suffering from nighttime awakenings, high sleep latency, or non-restorative sleep.',
    difficulty_level: 'Beginner',
    evidence_level: 'High (Sleep Medicine Reviews)',
    safety_level: 'High',
    description: 'Pitch dark, 65°F–68°F sleep environment + evening light Netflix inoculation + closed-eye ocular sweeps to fall back asleep fast.',
    steps: [
      HUBERMAN_DOAC_MASTER_PROTOCOL.steps[8],  // Evening Light Inoculation
      HUBERMAN_DOAC_MASTER_PROTOCOL.steps[10], // Dark & Cool Bedroom
      HUBERMAN_DOAC_MASTER_PROTOCOL.steps[11], // Sleep Stack
      HUBERMAN_DOAC_MASTER_PROTOCOL.steps[12]  // Eye Movement Trick
    ]
  }
]

export const ALL_HUBERMAN_DOAC_PROTOCOLS = [
  HUBERMAN_DOAC_MASTER_PROTOCOL,
  ...HUBERMAN_SUB_PROTOCOLS
]
