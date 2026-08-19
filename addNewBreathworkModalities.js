const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const modalities = [
  {
    id: 'box_breathing',
    slug: 'box-breathing',
    name: 'Box Breathing (Navy SEAL Tactical Focus)',
    display_name: 'Box Breathing',
    modality_type: 'breathwork',
    category: 'Nervous System & Focus',
    status: 'active',
    brief_description: 'A 4-4-4-4 equal square timing protocol (4s Inhale, 4s Hold, 4s Exhale, 4s Hold) used by Navy SEALs to neutralize sympathetic panic and induce sharp focus.',
    headline_benefit: 'Tactical Stress Neutralization & Sharp Pre-Task Focus',
    expanded_why: 'Developed by Mark Divine for Navy SEAL special operations, Box Breathing balances arterial oxygen and CO2 levels. The equal ratios prevent drowsiness while suppressing cortisol and adrenaline surges during high-pressure environments.',
    primary_outcome: 'Focus & Stress Resilience',
    secondary_outcomes: ['Cognitive Clarity', 'Panic Blunting', 'Heart Rate Normalization'],
    overall_longevity_benefit: 4,
    implementation_summary: 'Perform 4 minutes of 4-4-4-4 square breathing prior to high-stakes tasks or workouts.',
    instructions: '1. Inhale through nose for 4s. 2. Hold lungs full for 4s. 3. Exhale through mouth for 4s. 4. Hold lungs empty for 4s.',
    dose_or_exposure: '4 minutes daily (15 cycles)',
    timing_summary: 'Midday / Pre-Task',
    frequency: 'Daily',
    schedule_pattern: 'daily',
    difficulty: 'easy',
    cost_tier: 'free',
    effort_level: 'low',
    time_to_benefit: 'Immediate (< 4 minutes)',
    evidence_quality: 4,
    effect_size_estimate: 4,
    safety_level: 'low_risk',
    contraindications: [],
    functional_outcomes_to_track: ['focus', 'stress_resilience', 'mood'],
    functional_impacts: {
      focus: { score: 10, rationale: 'Navy SEAL protocol proven to restore prefrontal cortex executive control.' },
      stress_resilience: { score: 9, rationale: 'Equal ratios suppress sympathetic fight-or-flight surges.' },
      mood: { score: 8, rationale: 'Normalizes autonomic tone without inducing sedation.' }
    }
  },
  {
    id: 'cyclic_hyperventilation',
    slug: 'cyclic-hyperventilation',
    name: 'Cyclic Hyperventilation (Wim Hof Energy Spike)',
    display_name: 'Cyclic Hyperventilation',
    modality_type: 'breathwork',
    category: 'Nervous System & Energy',
    status: 'active',
    brief_description: 'A 3-round hyper-oxygenation protocol (30 rapid breaths, 60s retention hold, 15s recovery hold) proven by PNAS research to trigger adrenaline and blunt inflammation.',
    headline_benefit: 'Morning Energy Boost & Immune System Activation',
    expanded_why: 'Researched by Kox et al., PNAS (2014), voluntary hyperventilation triggers a controlled epinephrine/adrenaline spike that increases energy, enhances cellular oxygenation during retention, and suppresses pro-inflammatory cytokines (IL-6, TNF-alpha).',
    primary_outcome: 'Energy & Alertness',
    secondary_outcomes: ['Immune Support', 'CO2 Tolerance', 'Mental Toughness'],
    overall_longevity_benefit: 4,
    implementation_summary: 'Perform 3 complete rounds upon waking or prior to cold exposure.',
    instructions: '1. Perform 30 rapid deep inhales & unforced exhales. 2. Hold breath on final exhale for 60s. 3. Take a deep recovery inhale and hold for 15s. Repeat 3x.',
    dose_or_exposure: '10 minutes daily (3 rounds)',
    timing_summary: 'Morning / Upon Waking',
    frequency: 'Daily',
    schedule_pattern: 'daily',
    difficulty: 'moderate',
    cost_tier: 'free',
    effort_level: 'medium',
    time_to_benefit: 'Immediate (10 minutes)',
    evidence_quality: 5,
    effect_size_estimate: 5,
    safety_level: 'low_risk',
    contraindications: ['Epilepsy', 'Pregnancy', 'Severe hypertension'],
    functional_outcomes_to_track: ['energy', 'focus', 'immune_resilience'],
    functional_impacts: {
      energy: { score: 10, rationale: 'Proven by PNAS to stimulate sympathetic epinephrine surge.' },
      focus: { score: 9, rationale: 'Gamma-wave neural synchronization during retention hold.' },
      immune_resilience: { score: 8, rationale: 'Suppresses pro-inflammatory cytokines.' }
    }
  },
  {
    id: 'coherent_breathing',
    slug: 'coherent-breathing',
    name: 'Coherent 5.5s Breathing (Max HRV Resonance)',
    display_name: 'Coherent 5.5s Breathing',
    modality_type: 'breathwork',
    category: 'Nervous System & HRV',
    status: 'active',
    brief_description: 'A 5.5s Inhale / 5.5s Exhale protocol (5.45 breaths/min) matching the 0.1 Hz baroreflex frequency to maximize Heart Rate Variability (HRV).',
    headline_benefit: 'Maximum HRV Expansion & Baroreflex Synchronization',
    expanded_why: 'Published by Lehrer et al., breathing at 0.1 Hz (5.5s inhale / 5.5s exhale) creates mathematical resonance between heart rate, blood pressure, and respiratory sinus arrhythmia, maximizing Heart Rate Variability (HRV) and cardiovascular efficiency.',
    primary_outcome: 'HRV & Autonomic Balance',
    secondary_outcomes: ['Cardiovascular Health', 'Emotional Regulation', 'Stress Resilience'],
    overall_longevity_benefit: 5,
    implementation_summary: 'Breathe at 5.5s inhale / 5.5s exhale pace for 10 minutes daily.',
    instructions: '1. Inhale smoothly through nose for 5.5s. 2. Exhale smoothly through nose or mouth for 5.5s. Maintain fluid 0.1 Hz rhythm.',
    dose_or_exposure: '10 minutes daily (55 cycles)',
    timing_summary: 'Afternoon / Evening',
    frequency: 'Daily',
    schedule_pattern: 'daily',
    difficulty: 'easy',
    cost_tier: 'free',
    effort_level: 'low',
    time_to_benefit: '1-3 days',
    evidence_quality: 5,
    effect_size_estimate: 5,
    safety_level: 'low_risk',
    contraindications: [],
    functional_outcomes_to_track: ['hrv', 'stress_resilience', 'emotional_balance'],
    functional_impacts: {
      hrv: { score: 10, rationale: '0.1 Hz baroreflex frequency produces maximum HRV amplitude.' },
      stress_resilience: { score: 9, rationale: 'Entrains cardiovascular and respiratory sinus arrhythmia.' },
      emotional_balance: { score: 8, rationale: 'Fosters hemispheric and autonomic coherence.' }
    }
  }
];

async function run() {
  const { data, error } = await supabase.from('modalities').upsert(modalities);
  if (error) {
    console.error('Error upserting new breathwork modalities:', error);
  } else {
    console.log('Successfully upserted Box Breathing, Cyclic Hyperventilation, and Coherent 5.5s Breathing modalities into Supabase!');
  }
}

run();
