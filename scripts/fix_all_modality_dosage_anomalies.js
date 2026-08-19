const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) envVars[key.trim()] = values.join('=').trim();
});

const supabase = createClient(envVars['NEXT_PUBLIC_SUPABASE_URL'], envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

// Corrected Dosage Profile Map for all flagged items
const CORRECTED_PROFILES = {
  'ginger-root': {
    unit: 'mg',
    starter_dose: 1000,
    personalized_target_dose: 1500,
    blueprint_dose: 2200,
    literature_range: { min: 1000, max: 2200, outlier_upper: 3000 },
    starter_notes: '1,000 mg daily of standardized ginger root extract.',
    recommended_notes: '1,500 mg daily split across meals for gastrointestinal motility and anti-inflammatory benefit.',
    blueprint_notes: '2,200 mg daily in Blueprint 2026 stack.'
  },
  'glucosamine-sulfate': {
    unit: 'mg',
    starter_dose: 1000,
    personalized_target_dose: 1500,
    blueprint_dose: 1500,
    literature_range: { min: 1000, max: 1500, outlier_upper: 2000 },
    starter_notes: '1,000 mg daily for joint cartilage maintenance.',
    recommended_notes: '1,500 mg daily of Glucosamine Sulfate 2KCl proven in clinical trials to protect joint space.',
    blueprint_notes: '1,500 mg daily in Blueprint 2026 stack.'
  },
  'vitamin-k1': {
    unit: 'mcg',
    starter_dose: 1000,
    personalized_target_dose: 1200,
    blueprint_dose: 1500,
    literature_range: { min: 1000, max: 1500, outlier_upper: 2000 },
    starter_notes: '1,000 mcg Phylloquinone daily.',
    recommended_notes: '1,200 mcg daily for hepatic clotting factor synthesis and vascular protection.',
    blueprint_notes: '1,500 mcg daily in Blueprint 2026 stack.'
  },
  'l-lysine': {
    unit: 'mg',
    starter_dose: 1000,
    personalized_target_dose: 1500,
    blueprint_dose: 2000,
    literature_range: { min: 1000, max: 2000, outlier_upper: 3000 },
    starter_notes: '1,000 mg daily essential amino acid intake.',
    recommended_notes: '1,500 mg daily for collagen cross-linking and viral immune defense.',
    blueprint_notes: '2,000 mg daily in Blueprint 2026 stack.'
  },
  'curcumin': {
    unit: 'mg',
    starter_dose: 500,
    personalized_target_dose: 1000,
    blueprint_dose: 1000,
    literature_range: { min: 500, max: 1500, outlier_upper: 2000 },
    starter_notes: '500 mg bio-enhanced turmeric extract with piperine/phytosome.',
    recommended_notes: '1,000 mg daily (500mg twice daily) for systemic NF-kB inflammatory inhibition.',
    blueprint_notes: '1,000 mg daily in Blueprint 2026 stack.'
  },
  'cocoa-flavanols': {
    unit: 'mg',
    starter_dose: 500,
    personalized_target_dose: 750,
    blueprint_dose: 1000,
    literature_range: { min: 500, max: 1000, outlier_upper: 1500 },
    starter_notes: '500 mg standardized cocoa flavanols (COSMOS trial protocol).',
    recommended_notes: '750 mg daily for endothelial nitric oxide synthesis and flow-mediated dilation.',
    blueprint_notes: '1,000 mg daily high-flavanol cocoa extract.'
  },
  'vitamin-c': {
    unit: 'mg',
    starter_dose: 500,
    personalized_target_dose: 750,
    blueprint_dose: 1000,
    literature_range: { min: 500, max: 1000, outlier_upper: 2000 },
    starter_notes: '500 mg daily ascorbic acid / liposomal Vitamin C.',
    recommended_notes: '750 mg daily for immune leukocyte support and collagen synthesis.',
    blueprint_notes: '1,000 mg daily in Blueprint 2026 stack.'
  },
  'collagen_peptides': {
    unit: 'g',
    starter_dose: 10,
    personalized_target_dose: 15,
    blueprint_dose: 20,
    literature_range: { min: 10, max: 20, outlier_upper: 30 },
    starter_notes: '10g hydrolyzed collagen peptides daily in warm liquid or smoothie.',
    recommended_notes: '15g daily stimulates dermal extracellular matrix density and tendon micro-repair.',
    blueprint_notes: '20g hydrolyzed collagen peptides daily.'
  },
  'l_citrulline': {
    unit: 'g',
    starter_dose: 3,
    personalized_target_dose: 6,
    blueprint_dose: 6,
    literature_range: { min: 3, max: 8, outlier_upper: 10 },
    starter_notes: '3g L-Citrulline or 6g Citrulline Malate 45 mins pre-exercise.',
    recommended_notes: '6g pure L-Citrulline maximizes plasma arginine levels and vascular nitric oxide dilation.',
    blueprint_notes: '6g L-Citrulline daily.'
  },
  'time-blocking': {
    unit: 'mins',
    starter_dose: 45,
    personalized_target_dose: 60,
    blueprint_dose: 90,
    literature_range: { min: 45, max: 90, outlier_upper: 120 },
    starter_notes: '45-minute distraction-free focus block.',
    recommended_notes: '60 minutes uninterrupted time blocking for deep cognitive work.',
    blueprint_notes: '90-minute deep work time block.'
  },
  'means_berberine_gda': {
    unit: 'mg',
    starter_dose: 150,
    personalized_target_dose: 300,
    blueprint_dose: 500,
    literature_range: { min: 150, max: 500, outlier_upper: 1000 },
    starter_notes: '150mg Dihydroberberine 15 mins pre-carbohydrate meal.',
    recommended_notes: '300-500mg Berberine HCl for postprandial glucose disposal.',
    blueprint_notes: '500mg Berberine HCl pre-meal.'
  },
  'dayspring_viscous_fiber_phytosterols': {
    unit: 'g',
    starter_dose: 5,
    personalized_target_dose: 10,
    blueprint_dose: 10,
    literature_range: { min: 5, max: 15, outlier_upper: 20 },
    starter_notes: '5g Psyllium husk + 1g plant phytosterols with main meals.',
    recommended_notes: '10g soluble viscous fiber + 2g phytosterols to bind intestinal bile acids and lower ApoB.',
    blueprint_notes: '10g viscous fiber + 2g phytosterols.'
  },
  '6f188626-3382-4cb1-ab77-5af3ba44bd49': {
    unit: 'secs',
    starter_dose: 30,
    personalized_target_dose: 45,
    blueprint_dose: 60,
    literature_range: { min: 30, max: 60, outlier_upper: 90 },
    starter_notes: '30 seconds deep water pharyngeal gargling.',
    recommended_notes: '45 seconds deep gargling to stimulate glossopharyngeal and vagal efferent motor tone.',
    blueprint_notes: '60 seconds deep gargling.'
  },
  'attia_protein_distribution': {
    unit: 'g/kg',
    starter_dose: 1.6,
    personalized_target_dose: 2.0,
    blueprint_dose: 2.2,
    literature_range: { min: 1.6, max: 2.2, outlier_upper: 3.0 },
    starter_notes: '1.6g/kg daily total protein intake (~30g per meal).',
    recommended_notes: '2.0g/kg total daily protein with at least 3g leucine per meal to trigger muscle protein synthesis.',
    blueprint_notes: '2.2g/kg high-leucine protein distribution.'
  },
  'rhonda_omega3_phospholipids': {
    unit: 'mg',
    starter_dose: 2000,
    personalized_target_dose: 3000,
    blueprint_dose: 4000,
    literature_range: { min: 2000, max: 4000, outlier_upper: 6000 },
    starter_notes: '2,000mg phospholipid EPA/DHA daily.',
    recommended_notes: '3,000-4,000mg high-dose phospholipid EPA/DHA for brain erythrocyte membrane uptake.',
    blueprint_notes: '4,000mg phospholipid EPA/DHA daily.'
  },
  'longo_fisetin_quercetin_senolytic_pulse': {
    unit: 'mg',
    starter_dose: 1000,
    personalized_target_dose: 1400,
    blueprint_dose: 2000,
    literature_range: { min: 1000, max: 2000, outlier_upper: 3000 },
    starter_notes: '1,000mg Fisetin + 500mg Quercetin taken on 2 consecutive days per month with EVOO.',
    recommended_notes: '20mg/kg (~1,400mg) Fisetin + 1,000mg Quercetin Mayo Clinic senolytic pulse protocol.',
    blueprint_notes: '2,000mg Fisetin + 1,000mg Quercetin pulse.'
  },
  'dexa_scan': {
    unit: 'scans',
    starter_dose: 1,
    personalized_target_dose: 1,
    blueprint_dose: 1,
    literature_range: { min: 1, max: 2, outlier_upper: 4 },
    starter_notes: '1 DEXA scan per year.',
    recommended_notes: '1 DEXA scan every 6-12 months for bone mineral density and visceral fat tracking.',
    blueprint_notes: '1 DEXA scan every 6 months.'
  },
  'whole_body_mri': {
    unit: 'scans',
    starter_dose: 1,
    personalized_target_dose: 1,
    blueprint_dose: 1,
    literature_range: { min: 1, max: 1, outlier_upper: 2 },
    starter_notes: '1 Whole-Body MRI scan per year.',
    recommended_notes: '1 Whole-Body MRI scan annually for early oncological and visceral screening.',
    blueprint_notes: '1 Whole-Body MRI scan annually.'
  },
  'plasmapheresis_therapeutic_plasma_exchange': {
    unit: 'exchanges',
    starter_dose: 1,
    personalized_target_dose: 1,
    blueprint_dose: 1,
    literature_range: { min: 1, max: 3, outlier_upper: 6 },
    starter_notes: '1 Therapeutic Plasma Exchange session.',
    recommended_notes: '1 TPE session per quarter under physician supervision for circulating pro-inflammatory protein removal.',
    blueprint_notes: '1 TPE session quarterly.'
  }
};

async function fixAnomalies() {
  console.log('Fixing dosage profile anomalies in Supabase...');

  for (const [id, profile] of Object.entries(CORRECTED_PROFILES)) {
    const { data: mod } = await supabase.from('modalities').select('relationships').eq('id', id).single();
    const existingRel = mod?.relationships || {};

    const updatedRel = {
      ...existingRel,
      dosage_profile: profile
    };

    const { error } = await supabase
      .from('modalities')
      .update({ relationships: updatedRel })
      .eq('id', id);

    if (error) {
      console.error(`❌ Failed to update ${id}:`, error.message);
    } else {
      console.log(`✅ Fixed ${id} -> ${profile.starter_dose} to ${profile.blueprint_dose} ${profile.unit}`);
    }
  }

  console.log('🎉 All dosage anomalies fixed in cloud Supabase database!');
}

fixAnomalies();
