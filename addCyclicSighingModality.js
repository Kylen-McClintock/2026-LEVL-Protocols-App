const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const modality = {
    id: 'cyclic_sighing',
    slug: 'cyclic-sighing',
    name: 'Cyclic Sighing (Physiological Sigh)',
    display_name: 'Cyclic Sighing',
    modality_type: 'breathwork',
    category: 'Nervous System & Breathwork',
    status: 'active',
    brief_description: 'A 5-minute Stanford neuroscience breathwork protocol (double inhale through nose, long slow oral exhale) proven to rapidly lower sympathetic arousal.',
    headline_benefit: 'Rapid Vagal Activation & Instant Stress Reduction',
    expanded_why: 'Researched at Stanford Medicine (Balban, Huberman, Spiegel et al., 2023), 5 minutes of daily Cyclic Sighing significantly outperforms mindfulness meditation and box breathing in elevating mood, reducing respiratory rate, and lowering physiological arousal.',
    primary_outcome: 'Stress Resilience & Vagal Tone',
    secondary_outcomes: ['Mood Elevation', 'Focus & Mental Clarity', 'Parasympathetic Activation'],
    overall_longevity_benefit: 4,
    implementation_summary: 'Perform 5 minutes of double nasal inhales followed by a long, slow oral exhale.',
    instructions: '1. Inhale deeply through nose. 2. Take a second sharp top-off inhale through nose. 3. Slowly exhale through open mouth.',
    dose_or_exposure: '5 minutes daily (~35 cycles)',
    timing_summary: 'Anytime or during acute stress',
    frequency: 'Daily',
    schedule_pattern: 'daily',
    difficulty: 'easy',
    cost_tier: 'free',
    effort_level: 'low',
    time_to_benefit: 'Immediate (5 minutes)',
    evidence_quality: 5,
    effect_size_estimate: 5,
    safety_level: 'low_risk',
    contraindications: [],
    functional_outcomes_to_track: ['stress_resilience', 'mood', 'focus'],
    functional_impacts: {
      stress_resilience: { score: 10, rationale: 'Proven by Stanford (2023) to rapidly lower autonomic arousal.' },
      mood: { score: 8, rationale: 'Significantly elevates positive affect over 5 minutes.' },
      focus: { score: 7, rationale: 'Resets neural focus via parasympathetic dominance.' }
    }
  };

  const { data, error } = await supabase.from('modalities').upsert([modality]);
  if (error) {
    console.error('Error upserting cyclic_sighing modality:', error);
  } else {
    console.log('Successfully upserted Cyclic Sighing (Physiological Sigh) modality into Supabase!');
  }
}

run();
