const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const modality = {
    id: 'breathing_4_7_8',
    slug: 'breathing-4-7-8',
    name: '4-7-8 Relaxing Breathwork',
    display_name: '4-7-8 Breathwork',
    modality_type: 'breathwork',
    category: 'Nervous System & Sleep',
    status: 'active',
    brief_description: 'A 4-7-8 timing protocol (4s Inhale, 7s Hold, 8s Exhale) designed to lower heart rate and initiate rapid sleep transition.',
    headline_benefit: 'Rapid Sleep Initiation & Parasympathetic Reset',
    expanded_why: 'Popularized by Dr. Andrew Weil and backed by autonomic sleep research, 4-7-8 breathing uses a 7-second hold to increase CO2 vascular relaxation and an extended 8-second exhale to trigger vagal deceleration of the heart rate, reducing sleep latency.',
    primary_outcome: 'Sleep Latency & Transition',
    secondary_outcomes: ['Anxiety Reduction', 'Stress Resilience', 'Deep Relaxation'],
    overall_longevity_benefit: 4,
    implementation_summary: 'Perform 4-8 cycles before bed or during acute anxiety.',
    instructions: '1. Inhale through nose for 4s. 2. Hold breath for 7s. 3. Exhale completely through mouth for 8s making a whoosh sound.',
    dose_or_exposure: '4-8 cycles (~3-5 minutes)',
    timing_summary: 'Evening / Before Bed',
    frequency: 'Daily',
    schedule_pattern: 'daily',
    difficulty: 'easy',
    cost_tier: 'free',
    effort_level: 'low',
    time_to_benefit: 'Immediate (< 5 minutes)',
    evidence_quality: 4,
    effect_size_estimate: 4,
    safety_level: 'low_risk',
    contraindications: [],
    functional_outcomes_to_track: ['sleep_latency', 'stress_resilience', 'anxiety'],
    functional_impacts: {
      sleep_latency: { score: 10, rationale: 'Vagal deceleration rapidly induces pre-sleep parasympathetic dominance.' },
      stress_resilience: { score: 9, rationale: 'Extended exhale lowers heart rate and blunts sympathetic spikes.' },
      anxiety: { score: 8, rationale: 'Hyper-capnic hold relaxes vascular smooth muscle.' }
    }
  };

  const { data, error } = await supabase.from('modalities').upsert([modality]);
  if (error) {
    console.error('Error upserting breathing_4_7_8 modality:', error);
  } else {
    console.log('Successfully upserted 4-7-8 Relaxing Breathwork modality into Supabase!');
  }
}

run();
