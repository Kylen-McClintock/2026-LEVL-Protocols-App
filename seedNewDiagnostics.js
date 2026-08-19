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
    id: 'full-body-mri-scan',
    slug: 'full-body-mri-scan',
    name: 'Full-Body MRI Screening (Prenuvo/Ezra)',
    category: 'Diagnostics & Tracking',
    cadence_layer: 'infrequent',
    brief_description: 'Annual non-invasive full-body MRI audit detecting asymptomatic solid tumors, organ lesions, spinal disc degeneration, and fatty liver volume.',
    expanded_why: 'Non-contrast full-body MRI provides high-contrast soft-tissue resolution across brain, neck, chest, abdomen, pelvis, and spine without ionizing radiation exposure.',
    instructions: '4-hour fast from food prior to scan. Remove all metal jewelry, body piercings, and wearable devices. Wear comfortable, metal-free athletic clothing.',
    evidence_quality: 5,
    effect_size_estimate: 'High (Early Tumor & Lesion Detection)',
    safety_level: 'safe',
    cost_tier: 'high',
    effort_level: 'low',
    mechanism_of_action: 'Utilizes multi-planar diffusion-weighted imaging (DWI) and T1/T2 anatomical sequences to detect silent solid lesions, vascular aneurysms, and liver steatosis early.'
  },
  {
    id: 'vo2-max-cpet-assessment',
    slug: 'vo2-max-cpet-assessment',
    name: 'VO₂ Max & Metabolic Gas Exchange Test',
    category: 'Diagnostics & Tracking',
    cadence_layer: 'infrequent',
    brief_description: 'Gold-standard cardiopulmonary exercise test (CPET) measuring maximal oxygen consumption (VO₂ max), Zone 2 ventilatory threshold, and metabolic efficiency.',
    expanded_why: 'Cardiorespiratory fitness (VO₂ max) is the single strongest independent predictor of all-cause mortality, outperforming traditional risk factors like smoking and hypertension.',
    instructions: 'Avoid strenuous workouts 24 hours prior. No heavy meals or caffeine 3 hours prior to test. Wear athletic shoes and gym clothes.',
    evidence_quality: 5,
    effect_size_estimate: 'Massive (~500% Mortality Risk Reduction)',
    safety_level: 'safe',
    cost_tier: 'moderate',
    effort_level: 'high',
    mechanism_of_action: 'Measures O₂ consumption and CO₂ production during incremental ramp exercise to quantify maximal mitochondrial oxygen uptake and metabolic crossover points.'
  },
  {
    id: 'dunedinpace-epigenetic-clock',
    slug: 'dunedinpace-epigenetic-clock',
    name: 'DunedinPACE Epigenetic Aging Rate Clock',
    category: 'Diagnostics & Tracking',
    cadence_layer: 'infrequent',
    brief_description: '3rd-generation DNA methylation clock quantifying your current rate of biological aging (pace of aging, e.g., 0.75 biological years per calendar year).',
    expanded_why: 'DunedinPACE analyzes DNA methylation at 173 specific CpG sites across white blood cells to measure organ system degradation speed in real time.',
    instructions: 'No fasting required prior to capillary blood spot or phlebotomy draw. Ensure sample collection tube is filled to designated line.',
    evidence_quality: 5,
    effect_size_estimate: 'High (Real-time Pace of Aging Precision)',
    safety_level: 'safe',
    cost_tier: 'moderate',
    effort_level: 'low',
    mechanism_of_action: 'Quantifies systemic physiological decline across 19 organ system biomarkers tracked over 4 decades, providing the most responsive biomarker of pace of aging available.'
  }
];

async function seed() {
  console.log('Seeding 3 new proactive diagnostic modalities into Supabase...');
  const { data, error } = await supabase.from('modalities').upsert(newDiagnosticModalities);
  if (error) {
    console.error('Error seeding modalities:', error);
  } else {
    console.log('Successfully seeded Full-Body MRI, VO2 Max, and DunedinPACE into Supabase!');
  }
}

seed();
