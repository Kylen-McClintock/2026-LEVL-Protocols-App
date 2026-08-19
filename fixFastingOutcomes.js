const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const fastingModalitiesWithUserOutcomes = [
  {
    id: 'intermittent_fasting_16_8',
    primary_outcome: 'Mental Clarity',
    secondary_outcomes: ['Focus', 'Satiety', 'Digestive Comfort'],
    functional_outcomes_to_track: ['mental_clarity', 'focus', 'satiety', 'digestive_comfort', 'energy', 'brain_fog']
  },
  {
    id: 'intermittent_fasting_18_6',
    primary_outcome: 'Mental Clarity',
    secondary_outcomes: ['Focus', 'Energy', 'Digestive Comfort'],
    functional_outcomes_to_track: ['mental_clarity', 'focus', 'energy', 'digestive_comfort', 'satiety', 'brain_fog']
  },
  {
    id: 'intermittent_fasting_20_4',
    primary_outcome: 'Mental Clarity',
    secondary_outcomes: ['Focus', 'Digestive Comfort', 'Brain Fog'],
    functional_outcomes_to_track: ['mental_clarity', 'focus', 'digestive_comfort', 'brain_fog', 'satiety', 'energy']
  },
  {
    id: 'omad_fasting',
    primary_outcome: 'Digestive Comfort',
    secondary_outcomes: ['Mental Clarity', 'Satiety', 'Energy'],
    functional_outcomes_to_track: ['digestive_comfort', 'mental_clarity', 'satiety', 'energy', 'focus']
  },
  {
    id: 'water_fast_24h',
    primary_outcome: 'Mental Clarity',
    secondary_outcomes: ['Digestive Comfort', 'Brain Fog', 'Energy'],
    functional_outcomes_to_track: ['mental_clarity', 'digestive_comfort', 'brain_fog', 'energy', 'satiety']
  },
  {
    id: 'monk_fast_36h',
    primary_outcome: 'Mental Clarity',
    secondary_outcomes: ['Digestive Comfort', 'Brain Fog'],
    functional_outcomes_to_track: ['mental_clarity', 'digestive_comfort', 'brain_fog', 'energy']
  },
  {
    id: 'extended_fast_48h',
    primary_outcome: 'Mental Clarity',
    secondary_outcomes: ['Digestive Comfort', 'Brain Fog'],
    functional_outcomes_to_track: ['mental_clarity', 'digestive_comfort', 'brain_fog']
  },
  {
    id: 'prolonged_autophagy_fast_72h',
    primary_outcome: 'Mental Clarity',
    secondary_outcomes: ['Digestive Comfort', 'Brain Fog'],
    functional_outcomes_to_track: ['mental_clarity', 'digestive_comfort', 'brain_fog']
  }
];

async function run() {
  console.log("1. Ensuring 'mental_clarity' exists in outcome_dimensions...");
  const { data: existingMc } = await supabase
    .from('outcome_dimensions')
    .select('id')
    .eq('id', 'mental_clarity')
    .single();

  if (!existingMc) {
    const { error: insErr } = await supabase
      .from('outcome_dimensions')
      .insert({
        id: 'mental_clarity',
        name: 'Mental Clarity',
        description: 'Clear, sharp thinking without mental fatigue or haze',
        directionality: 'higher_is_better',
        input_type: 'slider',
        is_default_wellbeing: false,
        is_contextual: true,
        relevant_modality_types: ['fasting', 'supplement', 'habit', 'diet']
      });

    if (insErr) {
      console.error("Error inserting mental_clarity:", insErr.message);
    } else {
      console.log("✓ Successfully added 'mental_clarity' dimension to database!");
    }
  } else {
    console.log("✓ 'mental_clarity' dimension already present in database.");
  }

  console.log("\n2. Updating Fasting Modalities with user-subjective outcome IDs in Supabase...");
  for (const item of fastingModalitiesWithUserOutcomes) {
    const { error } = await supabase
      .from('modalities')
      .update({
        primary_outcome: item.primary_outcome,
        secondary_outcomes: item.secondary_outcomes,
        functional_outcomes_to_track: item.functional_outcomes_to_track
      })
      .eq('id', item.id);

    if (error) {
      console.error(`Error updating ${item.id}:`, error.message);
    } else {
      console.log(`✓ Updated trackable outcomes for ${item.id}`);
    }
  }
  console.log("\nFasting outcome dimensions repair complete!");
}

run();
