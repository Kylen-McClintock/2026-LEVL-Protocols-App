const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const protocols = [
  {
    id: 'huberman_morning_routine',
    name: 'The Huberman Morning Routine',
    goal: 'Circadian Anchoring & Alertness',
    description: 'A science-backed sequence to rapidly increase alertness, set the circadian clock, and maximize daily focus through environmental stressors and light timing.',
    visibility: 'global_library',
    source_label: 'Huberman Lab',
    popularity_placeholder: 1000000,
    review_status: 'verified'
  },
  {
    id: 'deep_sleep_stack',
    name: 'Deep Sleep Architecture Stack',
    goal: 'Sleep Quality',
    description: 'A targeted stack leveraging the synergistic relaxation effects of glycine, magnesium, and behavioral winding down to improve deep sleep duration.',
    visibility: 'global_library',
    source_label: 'Curated',
    popularity_placeholder: 500000,
    review_status: 'verified'
  },
  {
    id: 'metabolic_reset',
    name: 'Metabolic Reset',
    goal: 'Metabolic Flexibility & Glucose Control',
    description: 'Combines pharmaceutical glucose-blunting with mechanical muscle stimulation for maximal glycemic control and insulin sensitivity.',
    visibility: 'global_library',
    source_label: 'Curated',
    popularity_placeholder: 250000,
    review_status: 'verified'
  }
];

const protocolSteps = [
  // Huberman
  {
    protocol_id: 'huberman_morning_routine',
    modality_id: 'morning_sunlight',
    relative_time_archetype: 'morning',
    ordering_index: 1,
    notes: 'Within 30 mins of waking'
  },
  {
    protocol_id: 'huberman_morning_routine',
    modality_id: 'cold_water_immersion',
    relative_time_archetype: 'morning',
    ordering_index: 2,
    notes: 'Wait at least 1 hour if you lifted weights recently'
  },
  {
    protocol_id: 'huberman_morning_routine',
    modality_id: 'intermittent_fasting_16_8',
    relative_time_archetype: 'anytime',
    ordering_index: 3,
    notes: 'Delay first meal until noon'
  },

  // Deep Sleep
  {
    protocol_id: 'deep_sleep_stack',
    modality_id: 'magnesium_glycinate',
    relative_time_archetype: 'evening',
    ordering_index: 1,
    notes: 'Take 30-60 minutes before bed'
  },

  // Metabolic Reset
  {
    protocol_id: 'metabolic_reset',
    modality_id: 'resistance_training',
    relative_time_archetype: 'anytime',
    ordering_index: 1,
    notes: 'Prioritize multi-joint compound movements'
  },
  {
    protocol_id: 'metabolic_reset',
    modality_id: 'acarbose',
    relative_time_archetype: 'anytime',
    ordering_index: 2,
    notes: 'Take with first bite of carbohydrate-dense meals'
  },
  {
    protocol_id: 'metabolic_reset',
    modality_id: 'continuous_glucose_monitor',
    relative_time_archetype: 'anytime',
    ordering_index: 3,
    notes: 'Use to verify the flattened glucose curve'
  }
];

async function run() {
  const { error: pErr } = await supabase.from('protocols').upsert(protocols);
  if (pErr) {
    console.error("Error inserting protocols:", pErr);
    process.exit(1);
  }
  console.log("Successfully inserted protocols.");

  // For steps, we shouldn't upsert directly without an ID unless we handle it well, but we can just insert since we truncate or use clean DBs. Actually, let's delete existing steps for these protocols first so we don't duplicate on re-runs.
  await supabase.from('protocol_steps').delete().in('protocol_id', protocols.map(p => p.id));
  
  const { error: sErr } = await supabase.from('protocol_steps').insert(protocolSteps);
  if (sErr) {
    console.error("Error inserting protocol steps:", sErr);
    process.exit(1);
  }
  console.log("Successfully inserted protocol steps.");
}

run();
