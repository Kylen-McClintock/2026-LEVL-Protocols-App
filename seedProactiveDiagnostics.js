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

const diagnosticModalities = [
  {
    id: 'grail-cancer-screen',
    slug: 'grail-cancer-screen',
    name: 'GRAIL Galleri Multi-Cancer Screen',
    category: 'Diagnostics & Tracking',
    cadence_layer: 'infrequent',
    brief_description: 'Annual targeted cell-free DNA (cfDNA) blood test detecting tumor methylation signals across 50+ cancer types before symptoms appear.',
    expanded_why: 'Detects tumor-derived cell-free DNA (cfDNA) shedding in blood across 50+ cancer types via targeted methylation sequencing.',
    instructions: 'Hydration protocol: Drink 16-24 oz water 1 hour prior for easy phlebotomy draw. No fasting required. Requisition form required.',
    evidence_quality: 5,
    effect_size_estimate: 'High (50+ Cancers Detected)',
    safety_level: 'safe',
    cost_tier: 'high',
    effort_level: 'low',
    mechanism_of_action: 'Detects tumor-derived cell-free DNA (cfDNA) shedding in blood across 50+ cancer types via targeted methylation sequencing with >88% origin accuracy.'
  },
  {
    id: 'cac-calcium-scan',
    slug: 'cac-calcium-scan',
    name: 'Coronary Artery Calcium (CAC) CT Scan',
    category: 'Diagnostics & Tracking',
    cadence_layer: 'infrequent',
    brief_description: 'Low-dose non-contrast cardiac CT scan measuring calcified arterial plaque volume in coronary arteries (Agatston scoring).',
    expanded_why: 'Low-dose non-contrast cardiac CT quantifies calcified coronary artery plaque. Produces an Agatston score, offering the single strongest independent predictor of future MACE.',
    instructions: 'Pre-test protocol: Zero caffeine or stimulants 4 hours prior (keeps HR low for motion-artifact-free CT cardiac imaging). No IV contrast dye required.',
    evidence_quality: 5,
    effect_size_estimate: 'Massive (Single Strongest MACE Predictor)',
    safety_level: 'safe',
    cost_tier: 'low',
    effort_level: 'low',
    mechanism_of_action: 'Low-dose non-contrast cardiac CT quantifies calcified coronary artery plaque to produce an Agatston score.'
  },
  {
    id: 'dexa-body-composition-scan',
    slug: 'dexa-body-composition-scan',
    name: 'DEXA Whole-Body Composition Scan',
    category: 'Diagnostics & Tracking',
    cadence_layer: 'infrequent',
    brief_description: 'Dual-energy X-ray absorptiometry scan providing gold-standard measurement of bone mineral density, lean muscle mass, and visceral adipose tissue (VAT).',
    expanded_why: 'Dual-energy X-ray absorptiometry measures bone mineral density, subcutaneous fat, android/gynoid fat distribution, and visceral adipose tissue (VAT) volume.',
    instructions: 'Pre-test protocol: Avoid calcium supplements 24h prior; fast 3-4h prior for consistent visceral fat (VAT) reads; empty bladder immediately before scan.',
    evidence_quality: 5,
    effect_size_estimate: 'High Precision Body Fat & Bone Density',
    safety_level: 'safe',
    cost_tier: 'moderate',
    effort_level: 'low',
    mechanism_of_action: 'Dual-energy X-ray absorptiometry measures precise X-ray attenuation across dual photon energies.'
  },
  {
    id: 'apob-lipid-panel',
    slug: 'apob-lipid-panel',
    name: 'ApoB & Advanced Lipid Panel',
    category: 'Diagnostics & Tracking',
    cadence_layer: 'infrequent',
    brief_description: 'Comprehensive blood biomarker panel measuring Apolipoprotein B particle count, Lipoprotein(a), and vascular inflammation markers.',
    expanded_why: 'Measures total atherogenic particle concentration (Apolipoprotein B) rather than cholesterol mass content.',
    instructions: 'Pre-test protocol: 10-12h fasting requirement (water only) + avoid intense workouts 24h before draw (prevents acute muscle enzyme/creatine kinase artifacts).',
    evidence_quality: 5,
    effect_size_estimate: 'Causal Atherosclerosis Risk Quantification',
    safety_level: 'safe',
    cost_tier: 'moderate',
    effort_level: 'low',
    mechanism_of_action: 'Measures total atherogenic particle concentration (Apolipoprotein B) and Lipoprotein(a).'
  }
];

async function seed() {
  console.log('Seeding 4 complete proactive diagnostic modalities...');
  const { data, error } = await supabase.from('modalities').upsert(diagnosticModalities);
  if (error) {
    console.error('Error seeding modalities:', error);
  } else {
    console.log('Successfully seeded 4 diagnostic modalities into Supabase!');
  }
}

seed();
