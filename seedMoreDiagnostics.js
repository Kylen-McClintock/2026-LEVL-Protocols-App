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

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const newDiagnosticModalities = [
  {
    id: 'oral-microbiome-pathogen-screen',
    slug: 'oral-microbiome-pathogen-screen',
    name: 'Oral Microbiome & Periodontal Pathogen Screen',
    category: 'Diagnostics & Tracking',
    cadence_layer: 'infrequent',
    brief_description: 'Salivary DNA PCR assay detecting 11 high-risk periodontal pathogens (including P. gingivalis) linked to systemic arterial inflammation and neurodegeneration.',
    expanded_why: 'Periodontal pathogens translocate into vascular circulation, triggering endothelial damage, carotid plaque instability, and crossing the blood-brain barrier.',
    instructions: 'Do not brush teeth, use dental floss, or use mouthwash for 30 minutes prior to saline oral rinse collection.',
    evidence_quality: 5,
    effect_size_estimate: 'High (Systemic Pathogen Risk Mitigation)',
    safety_level: 'safe',
    cost_tier: 'moderate',
    effort_level: 'low',
    mechanism_of_action: 'Quantitative PCR quantifies high-risk bacterial DNA shedding (P. gingivalis, T. forsythia, T. denticola) that secretes gingipain proteases, degrading vascular tight junctions.'
  },
  {
    id: 'abpm-24h-blood-pressure-monitor',
    slug: 'abpm-24h-blood-pressure-monitor',
    name: '24-Hour Ambulatory Blood Pressure Monitor',
    category: 'Diagnostics & Tracking',
    cadence_layer: 'infrequent',
    brief_description: 'Gold-standard 24-hour continuous blood pressure monitoring evaluating nocturnal dipping status, 24h mean arterial pressure, and morning surge.',
    expanded_why: 'Unmasks nocturnal non-dipping hypertension (a major silent driver of microvascular brain disease, stroke, and renal micro-angiopathy) invisible to clinic cuff readings.',
    instructions: 'Wear automated oscillometric arm cuff continuously for 24 hours. Keep arm stationary during inflation cycles. Log sleep and wake times.',
    evidence_quality: 5,
    effect_size_estimate: 'Massive (Stroke & Microvascular Risk Prevention)',
    safety_level: 'safe',
    cost_tier: 'low',
    effort_level: 'moderate',
    mechanism_of_action: 'Takes automated blood pressure readings every 15-30 minutes across 24 hours to quantify nocturnal dipping (target 10-20% MAP drop during sleep).'
  },
  {
    id: 'heavy-metals-environmental-toxin-panel',
    slug: 'heavy-metals-environmental-toxin-panel',
    name: 'Heavy Metals & Environmental Toxin Panel',
    category: 'Diagnostics & Tracking',
    cadence_layer: 'infrequent',
    brief_description: 'ICP-MS blood and urine assay quantifying heavy metal burdens (lead, mercury, cadmium, arsenic) and persistent environmental toxins.',
    expanded_why: 'Accumulated heavy metals impair mitochondrial oxidative phosphorylation, generate reactive oxygen species (ROS), and accelerate arterial calcification.',
    instructions: 'Avoid seafood consumption (tuna, swordfish, shellfish) for 48 hours prior to blood and urine collection. Collect first morning void.',
    evidence_quality: 5,
    effect_size_estimate: 'High (Mitochondrial & Renal Toxicity Prevention)',
    safety_level: 'safe',
    cost_tier: 'moderate',
    effort_level: 'low',
    mechanism_of_action: 'Inductively coupled plasma mass spectrometry (ICP-MS) measures systemic elemental toxicity with parts-per-trillion sensitivity to guide chelation and avoidance.'
  }
];

async function seed() {
  console.log('Seeding 3 additional selected proactive diagnostic modalities...');
  const { data, error } = await supabase.from('modalities').upsert(newDiagnosticModalities);
  if (error) {
    console.error('Error seeding modalities:', error);
  } else {
    console.log('Successfully seeded Oral Microbiome, 24h ABPM, and Heavy Metals Panel into Supabase!');
  }
}

seed();
