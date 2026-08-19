const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (fs.existsSync('.env.local')) {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  envText.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) {
      const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
      if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
      if (key.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = val;
    }
  });
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MODALITY_UPDATES = [
  // --- Movement & Physical Exercises ---
  {
    id: 'handstand',
    dosage_unit: 'seconds',
    default_dosage: 60,
    literature_min: 15,
    literature_max: 180,
    timing_preference: 'midday',
    preferred_time: 'Midday / Afternoon (12:00 PM - 3:00 PM)'
  },
  {
    id: '3115a2bc-af3f-427f-bffa-473cb9173ab1', // Postprandial 10-Minute Walk
    dosage_unit: 'mins',
    default_dosage: 10,
    literature_min: 5,
    literature_max: 20,
    timing_preference: 'post_meal',
    preferred_time: 'Post-Meal (Within 30m after eating)'
  },
  {
    id: 'means_soleus_pushups_postmeal_walk',
    dosage_unit: 'mins',
    default_dosage: 15,
    literature_min: 10,
    literature_max: 30,
    timing_preference: 'post_meal',
    preferred_time: 'Post-Meal (Within 30m after eating)'
  },
  {
    id: 'd546b638-20cc-4134-b79d-ff6d530c6761', // Seated Soleus Push-Ups
    dosage_unit: 'mins',
    default_dosage: 15,
    literature_min: 10,
    literature_max: 45,
    timing_preference: 'midday',
    preferred_time: 'Midday / Desk Micro-Movement'
  },
  {
    id: 'attia_centenarian_strength',
    dosage_unit: 'mins',
    default_dosage: 45,
    literature_min: 30,
    literature_max: 60,
    timing_preference: 'morning',
    preferred_time: 'Morning (8:00 AM - 11:00 AM)'
  },
  {
    id: 'dayspring_isometric_handgrip_protocol',
    dosage_unit: 'mins',
    default_dosage: 10,
    literature_min: 8,
    literature_max: 15,
    timing_preference: 'afternoon',
    preferred_time: 'Afternoon (2:00 PM - 5:00 PM)'
  },
  {
    id: 'rhonda_hiit_sprints',
    dosage_unit: 'mins',
    default_dosage: 20,
    literature_min: 12,
    literature_max: 30,
    timing_preference: 'midday',
    preferred_time: 'Midday (11:00 AM - 2:00 PM)'
  },
  {
    id: 'running',
    dosage_unit: 'mins',
    default_dosage: 30,
    literature_min: 15,
    literature_max: 60,
    timing_preference: 'morning',
    preferred_time: 'Morning (7:00 AM - 9:00 AM)'
  },
  {
    id: 'wim_hof_horse_stance_thermogenesis',
    dosage_unit: 'mins',
    default_dosage: 3,
    literature_min: 2,
    literature_max: 5,
    timing_preference: 'morning',
    preferred_time: 'Immediately Post-Cold Plunge'
  },

  // --- Thermal & Cold ---
  {
    id: 'sauna_exposure',
    dosage_unit: 'mins',
    default_dosage: 20,
    literature_min: 15,
    literature_max: 30,
    timing_preference: 'evening',
    preferred_time: 'Evening / Sunset (5:00 PM - 8:00 PM)'
  },
  {
    id: 'cold_water_immersion',
    dosage_unit: 'mins',
    default_dosage: 3,
    literature_min: 2,
    literature_max: 5,
    timing_preference: 'upon_waking',
    preferred_time: 'Upon Waking / Early Morning (6:30 AM - 8:30 AM)'
  },
  {
    id: 'wim_hof_cold_shock_immersion',
    dosage_unit: 'mins',
    default_dosage: 3,
    literature_min: 2,
    literature_max: 5,
    timing_preference: 'upon_waking',
    preferred_time: 'Upon Waking / Early Morning (6:30 AM - 8:30 AM)'
  },

  // --- Breathwork & Mind ---
  {
    id: 'box_breathing',
    dosage_unit: 'mins',
    default_dosage: 5,
    literature_min: 3,
    literature_max: 10,
    timing_preference: 'midday',
    preferred_time: 'Midday Focus / Pre-Task'
  },
  {
    id: 'breathing_4_7_8',
    dosage_unit: 'mins',
    default_dosage: 5,
    literature_min: 3,
    literature_max: 10,
    timing_preference: 'wind_down',
    preferred_time: 'Wind Down (8:30 PM - 10:00 PM)'
  },
  {
    id: 'cyclic_sighing',
    dosage_unit: 'mins',
    default_dosage: 5,
    literature_min: 3,
    literature_max: 10,
    timing_preference: 'midday',
    preferred_time: 'Midday Stress Reset'
  },
  {
    id: 'coherent_breathing',
    dosage_unit: 'mins',
    default_dosage: 10,
    literature_min: 5,
    literature_max: 20,
    timing_preference: 'evening',
    preferred_time: 'Evening HRV Recovery'
  },
  {
    id: 'cyclic_hyperventilation',
    dosage_unit: 'mins',
    default_dosage: 10,
    literature_min: 5,
    literature_max: 15,
    timing_preference: 'upon_waking',
    preferred_time: 'Upon Waking / Morning'
  },
  {
    id: 'wim_hof_cyclic_retention_breathwork',
    dosage_unit: 'mins',
    default_dosage: 15,
    literature_min: 10,
    literature_max: 20,
    timing_preference: 'upon_waking',
    preferred_time: 'Upon Waking / Morning'
  },
  {
    id: 'optic_flow',
    dosage_unit: 'mins',
    default_dosage: 10,
    literature_min: 5,
    literature_max: 20,
    timing_preference: 'upon_waking',
    preferred_time: 'Upon Waking Morning Walk'
  },

  // --- Sleep & Circadian Hygiene ---
  {
    id: 'dark-cool-sleep-environment',
    dosage_unit: 'hours',
    default_dosage: 8,
    literature_min: 7,
    literature_max: 9,
    timing_preference: 'bedtime',
    preferred_time: 'Bedtime (10:00 PM - 6:00 AM)'
  },
  {
    id: 'walker_65f_thermal_drop',
    dosage_unit: 'hours',
    default_dosage: 8,
    literature_min: 7,
    literature_max: 9,
    timing_preference: 'bedtime',
    preferred_time: 'Bedtime (10:00 PM - 6:00 AM)'
  },
  {
    id: 'mouth_taping',
    dosage_unit: 'hours',
    default_dosage: 8,
    literature_min: 7,
    literature_max: 9,
    timing_preference: 'bedtime',
    preferred_time: 'Bedtime / Overnight'
  },
  {
    id: 'blue_light_blocking',
    dosage_unit: 'hours',
    default_dosage: 2,
    literature_min: 1,
    literature_max: 3,
    timing_preference: 'wind_down',
    preferred_time: 'Wind Down (8:00 PM - 10:00 PM)'
  },
  {
    id: 'evening-screen-time-reduction',
    dosage_unit: 'hours',
    default_dosage: 2,
    literature_min: 1,
    literature_max: 3,
    timing_preference: 'wind_down',
    preferred_time: 'Wind Down (8:00 PM - 10:00 PM)'
  },
  {
    id: 'walker_melatonin_dimming',
    dosage_unit: 'hours',
    default_dosage: 2,
    literature_min: 1,
    literature_max: 3,
    timing_preference: 'wind_down',
    preferred_time: 'Wind Down (8:00 PM - 10:00 PM)'
  },
  {
    id: 'walker_caffeine_cutoff',
    dosage_unit: 'hours',
    default_dosage: 10,
    literature_min: 10,
    literature_max: 12,
    timing_preference: 'midday',
    preferred_time: 'Midday Cutoff (By 12:00 PM)'
  },
  {
    id: 'walker_metabolic_alcohol_cutoff',
    dosage_unit: 'hours',
    default_dosage: 3,
    literature_min: 3,
    literature_max: 4,
    timing_preference: 'evening',
    preferred_time: 'Evening Cutoff (3h prior to sleep)'
  },
  {
    id: 'delay_caffeine',
    dosage_unit: 'mins',
    default_dosage: 90,
    literature_min: 90,
    literature_max: 120,
    timing_preference: 'upon_waking',
    preferred_time: 'Upon Waking (Delay 90-120 mins)'
  },

  // --- Fasting & Nutrition ---
  {
    id: 'intermittent_fasting_16_8',
    dosage_unit: 'hours',
    default_dosage: 16,
    literature_min: 14,
    literature_max: 18,
    timing_preference: 'midday',
    preferred_time: 'Fasting Window (8:00 PM - 12:00 PM)'
  },
  {
    id: 'omad_fasting',
    dosage_unit: 'hours',
    default_dosage: 23,
    literature_min: 22,
    literature_max: 24,
    timing_preference: 'evening',
    preferred_time: 'Fasting Window (23 Hours)'
  },
  {
    id: 'intermittent_fasting_20_4',
    dosage_unit: 'hours',
    default_dosage: 20,
    literature_min: 18,
    literature_max: 21,
    timing_preference: 'midday',
    preferred_time: 'Fasting Window (20 Hours)'
  },
  {
    id: 'longo_5day_fasting_mimicking_diet',
    dosage_unit: 'days',
    default_dosage: 5,
    literature_min: 5,
    literature_max: 5,
    timing_preference: 'infrequent',
    preferred_time: 'Monthly 5-Day Protocol'
  },
  {
    id: 'longo_post_fmd_stem_cell_refeed',
    dosage_unit: 'days',
    default_dosage: 2,
    literature_min: 1,
    literature_max: 3,
    timing_preference: 'infrequent',
    preferred_time: 'Post-FMD Refeed Days'
  },
  {
    id: 'means_macro_sequencing',
    dosage_unit: 'meals',
    default_dosage: 1,
    literature_min: 1,
    literature_max: 3,
    timing_preference: 'post_meal',
    preferred_time: 'All Main Meals'
  },
  {
    id: 'blueprint_nut_pudding',
    dosage_unit: 'servings',
    default_dosage: 1,
    literature_min: 1,
    literature_max: 1,
    timing_preference: 'morning',
    preferred_time: 'First Meal / Breakfast'
  },
  {
    id: 'means_acetic_acid_premeal',
    dosage_unit: 'tbsp',
    default_dosage: 1,
    literature_min: 1,
    literature_max: 2,
    timing_preference: 'pre_meal',
    preferred_time: 'Pre-Meal (15m before highest carb meal)'
  },

  // --- Hardware & Diagnostics ---
  {
    id: 'red_light_photobiomodulation_therapy',
    dosage_unit: 'mins',
    default_dosage: 10,
    literature_min: 5,
    literature_max: 15,
    timing_preference: 'upon_waking',
    preferred_time: 'Upon Waking / Morning'
  },
  {
    id: 'blueprint_red_light_therapy',
    dosage_unit: 'mins',
    default_dosage: 12,
    literature_min: 8,
    literature_max: 15,
    timing_preference: 'upon_waking',
    preferred_time: 'Upon Waking / Morning'
  },
  {
    id: 'brecka_pemf_grounding',
    dosage_unit: 'mins',
    default_dosage: 20,
    literature_min: 10,
    literature_max: 30,
    timing_preference: 'upon_waking',
    preferred_time: 'Upon Waking / Morning'
  },
  {
    id: 'brecka_ewot_exercise_oxygen',
    dosage_unit: 'mins',
    default_dosage: 15,
    literature_min: 10,
    literature_max: 20,
    timing_preference: 'midday',
    preferred_time: 'Midday Workout'
  },
  {
    id: 'dexa_scan',
    dosage_unit: 'sessions',
    default_dosage: 1,
    literature_min: 1,
    literature_max: 1,
    timing_preference: 'infrequent',
    preferred_time: 'Bi-Annual Milestone'
  },

  // --- Supplements & Nutraceuticals (Fixing Missing Timings) ---
  {
    id: 'walker_sleep_triad_supplement',
    timing_preference: 'wind_down',
    preferred_time: 'Wind Down (30-60 mins before bed)'
  },
  {
    id: 'sinclair_nmn_tmg',
    timing_preference: 'upon_waking',
    preferred_time: 'Upon Waking (Empty Stomach)'
  },
  {
    id: 'sinclair_trans_resveratrol',
    timing_preference: 'morning',
    preferred_time: 'Morning (With Dietary Fat/Yogurt)'
  },
  {
    id: 'sinclair_metformin_berberine',
    timing_preference: 'post_meal',
    preferred_time: 'With Largest Carbohydrate Meal'
  },
  {
    id: 'longo_fisetin_quercetin_senolytic_pulse',
    timing_preference: 'infrequent',
    preferred_time: 'Monthly 2-Day Senolytic Pulse'
  },
  {
    id: 'dayspring_inorganic_nitrate_citrulline',
    timing_preference: 'pre_meal',
    preferred_time: '30m Pre-Workout / Pre-Meal'
  },
  {
    id: 'dayspring_viscous_fiber_phytosterols',
    timing_preference: 'pre_meal',
    preferred_time: '15m Pre-Meal with 12oz Water'
  },
  {
    id: 'brecka_mthfr_methylation_support',
    timing_preference: 'morning',
    preferred_time: 'Morning with Meal'
  },
  {
    id: 'means_berberine_gda',
    timing_preference: 'pre_meal',
    preferred_time: '15m Pre-High Carb Meal'
  },
  {
    id: 'myo_inositol',
    dosage_unit: 'g',
    default_dosage: 2,
    literature_min: 1,
    literature_max: 4,
    timing_preference: 'wind_down',
    preferred_time: 'Wind Down / 1h Before Bed'
  },
  {
    id: 'ashwagandha_ksm66',
    dosage_unit: 'mg',
    default_dosage: 600,
    literature_min: 300,
    literature_max: 600,
    timing_preference: 'wind_down',
    preferred_time: 'Evening / Wind Down'
  },
  {
    id: 'nad_iv_therapy',
    dosage_unit: 'mg',
    default_dosage: 500,
    literature_min: 250,
    literature_max: 1000,
    timing_preference: 'infrequent',
    preferred_time: 'Monthly Clinic Appointment'
  }
];

async function updateModalities() {
  console.log(`Updating ${MODALITY_UPDATES.length} modalities in Supabase...`);

  for (const update of MODALITY_UPDATES) {
    const { id, ...fields } = update;
    const { error } = await supabase
      .from('modalities')
      .update(fields)
      .eq('id', id);

    if (error) {
      console.error(`Error updating modality ${id}:`, error);
    } else {
      console.log(`Updated [${id}] -> Unit: "${fields.dosage_unit || 'SAME'}" | Timing: "${fields.timing_preference}" ("${fields.preferred_time}")`);
    }
  }

  console.log('\nAll modality dosages and timings successfully updated!');
}

updateModalities();
