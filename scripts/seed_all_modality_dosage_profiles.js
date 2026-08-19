const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) envVars[key.trim()] = values.join('=').trim();
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Master Dictionary of Dose Profiles for Modalities
const DOSAGE_PROFILES = {
  // --- Nervous System, Sleep & Adaptogens ---
  'ashwagandha': {
    unit: 'mg',
    starter_dose: 300,
    personalized_target_dose: 600,
    blueprint_dose: 600,
    literature_range: { min: 300, max: 1000, outlier_upper: 1200 },
    starter_notes: '300mg daily of standardized root extract (KSM-66 / Sensoril) to assess cortisol lowering and tolerance.',
    recommended_notes: '300-600mg daily shown in RCTs to reduce serum cortisol by up to 27% and improve sleep architecture.',
    blueprint_notes: '600mg daily of KSM-66 Ashwagandha taken in evening.'
  },
  'apigenin': {
    unit: 'mg',
    starter_dose: 25,
    personalized_target_dose: 50,
    blueprint_dose: 50,
    literature_range: { min: 25, max: 100, outlier_upper: 200 },
    starter_notes: '25mg taken 30-60 minutes pre-bed for mild GABAergic relaxation.',
    recommended_notes: '50mg pre-bed as part of Huberman & Walker sleep protocols to activate GABA-A receptors.',
    blueprint_notes: '50mg Apigenin in night sleep stack.'
  },
  'magnesium_l_threonate': {
    unit: 'mg',
    starter_dose: 1000,
    personalized_target_dose: 1450,
    blueprint_dose: 2000,
    literature_range: { min: 1000, max: 2000, outlier_upper: 3000 },
    starter_notes: '1,000mg Magtein (providing ~70mg elemental Mg) to test gut tolerance.',
    recommended_notes: '1,450mg Magtein (144mg elemental Mg) crosses the blood-brain barrier to enhance synaptic density.',
    blueprint_notes: '2,000mg Magnesium L-Threonate taken 1 hour before sleep.'
  },
  'l_theanine': {
    unit: 'mg',
    starter_dose: 100,
    personalized_target_dose: 200,
    blueprint_dose: 200,
    literature_range: { min: 100, max: 400, outlier_upper: 800 },
    starter_notes: '100mg to promote alpha-wave brain relaxation without sedation.',
    recommended_notes: '200mg taken 30-60 minutes before bed or paired 1:1 with morning caffeine.',
    blueprint_notes: '200mg L-Theanine in evening protocol.'
  },
  'glycine': {
    unit: 'g',
    starter_dose: 2,
    personalized_target_dose: 3,
    blueprint_dose: 3,
    literature_range: { min: 2, max: 5, outlier_upper: 10 },
    starter_notes: '2g pre-bed to promote peripheral vasodilation and lower core body temperature.',
    recommended_notes: '3g pre-bed proven in human clinical trials to improve sleep quality and reduce daytime fatigue.',
    blueprint_notes: '3g Glycine dissolved in evening water.'
  },
  'melatonin_microdose': {
    unit: 'mcg',
    starter_dose: 300,
    personalized_target_dose: 300,
    blueprint_dose: 300,
    literature_range: { min: 100, max: 1000, outlier_upper: 5000 },
    starter_notes: '300mcg (0.3mg) physiological microdose mimicking natural pineal secretion.',
    recommended_notes: '300mcg avoids receptor desensitization while effectively advancing circadian phase alignment.',
    blueprint_notes: '300mcg extended-release Melatonin 2 hours before target sleep time.'
  },
  'breathing_4_7_8': {
    unit: 'mins',
    starter_dose: 3,
    personalized_target_dose: 5,
    blueprint_dose: 5,
    literature_range: { min: 2, max: 10, outlier_upper: 20 },
    starter_notes: '4 cycles (~3 minutes) of 4s inhale, 7s hold, 8s exhale to activate vagal parasympathetic tone.',
    recommended_notes: '5 minutes twice daily to measurably lower blood pressure and heart rate variability (HRV).',
    blueprint_notes: '5 minutes post-work transition breathwork.'
  },
  'cyclic_sighing': {
    unit: 'mins',
    starter_dose: 3,
    personalized_target_dose: 5,
    blueprint_dose: 5,
    literature_range: { min: 3, max: 10, outlier_upper: 20 },
    starter_notes: '3 minutes of double-inhalation followed by extended exhale (Huberman Lab protocol).',
    recommended_notes: '5 minutes daily protocol demonstrated superior mood and respiratory rate improvements vs mindfulness.',
    blueprint_notes: '5 minutes daily stress-mitigation protocol.'
  },

  // --- NAD+ & Cellular Energy ---
  'nmn': {
    unit: 'mg',
    starter_dose: 250,
    personalized_target_dose: 500,
    blueprint_dose: 1000,
    literature_range: { min: 250, max: 1000, outlier_upper: 2000 },
    starter_notes: '250mg morning sublingual or oral NMN to assess metabolic response.',
    recommended_notes: '500mg daily shown in RCTs to double blood NAD+ levels and improve aerobic capacity.',
    blueprint_notes: '1,000mg NMN taken first thing in morning.'
  },
  'nr': {
    unit: 'mg',
    starter_dose: 300,
    personalized_target_dose: 600,
    blueprint_dose: 1000,
    literature_range: { min: 300, max: 1000, outlier_upper: 2000 },
    starter_notes: '300mg Nicotinamide Riboside (Niagen) taken morning with breakfast.',
    recommended_notes: '600mg daily safely elevates tissue NAD+ pools by 40-90% in clinical human studies.',
    blueprint_notes: '1,000mg NR daily.'
  },
  'creatine_monohydrate': {
    unit: 'g',
    starter_dose: 3,
    personalized_target_dose: 5,
    blueprint_dose: 5,
    literature_range: { min: 3, max: 10, outlier_upper: 20 },
    starter_notes: '3g daily maintenance dose without aggressive loading phase to minimize initial fluid retention.',
    recommended_notes: '5g daily optimizes muscle phosphocreatine stores, brain bioenergetics, and cognitive resilience.',
    blueprint_notes: '5g Creatine Monohydrate mixed in morning Longevity Drink.'
  },
  'coq10': {
    unit: 'mg',
    starter_dose: 100,
    personalized_target_dose: 200,
    blueprint_dose: 200,
    literature_range: { min: 100, max: 400, outlier_upper: 600 },
    starter_notes: '100mg Ubiquinol taken with fat-containing meal for mitochondrial electron transport support.',
    recommended_notes: '200mg Ubiquinol supports endothelial elasticity and cellular ATP production.',
    blueprint_notes: '200mg Ubiquinol daily.'
  },

  // --- Metabolic & Longevity Pharmacotherapy / Senolytics ---
  'berberine': {
    unit: 'mg',
    starter_dose: 500,
    personalized_target_dose: 1000,
    blueprint_dose: 1500,
    literature_range: { min: 500, max: 1500, outlier_upper: 2000 },
    starter_notes: '500mg taken before largest carbohydrate meal to test GI tolerance.',
    recommended_notes: '1,000mg split (500mg twice daily) activates AMPK to reduce HbA1c and fasting blood glucose.',
    blueprint_notes: '1,500mg Berberine HCl split across 3 meals.'
  },
  'metformin_daily': {
    unit: 'mg',
    starter_dose: 500,
    personalized_target_dose: 1000,
    blueprint_dose: 1000,
    literature_range: { min: 500, max: 2000, outlier_upper: 2500 },
    starter_notes: '500mg extended-release (XR) taken with dinner under physician guidance.',
    recommended_notes: '1,000mg XR daily evaluated in TAME trial for insulin sensitization and hepatic gluconeogenesis inhibition.',
    blueprint_notes: '1,000mg Metformin XR daily.'
  },
  'rapamycin_weekly': {
    unit: 'mg',
    starter_dose: 2,
    personalized_target_dose: 5,
    blueprint_dose: 6,
    literature_range: { min: 2, max: 8, outlier_upper: 10 },
    starter_notes: '2mg once weekly under medical supervision to evaluate immunosuppressive safety profile.',
    recommended_notes: '5mg once weekly inhibits mTORC1 transiently without causing persistent mTORC2 suppression.',
    blueprint_notes: '6mg once weekly Sirolimus (Rapamycin) with grapefruit juice.'
  },
  'fisetin': {
    unit: 'mg',
    starter_dose: 500,
    personalized_target_dose: 1400,
    blueprint_dose: 2000,
    literature_range: { min: 500, max: 2000, outlier_upper: 3000 },
    starter_notes: '500mg taken with dietary fat on 2 consecutive days per month.',
    recommended_notes: '20mg/kg (~1,400mg) Mayo Clinic pulsed senolytic protocol to clear senescent cell burden.',
    blueprint_notes: '2,000mg Fisetin pulsed 2 consecutive days per month.'
  },
  'resveratrol_pterostilbene': {
    unit: 'mg',
    starter_dose: 250,
    personalized_target_dose: 500,
    blueprint_dose: 500,
    literature_range: { min: 100, max: 1000, outlier_upper: 2000 },
    starter_notes: '250mg Trans-Resveratrol or 100mg Pterostilbene taken with healthy fats.',
    recommended_notes: '500mg Trans-Resveratrol activates SIRT1 deacetylase pathways.',
    blueprint_notes: '500mg Trans-Resveratrol daily.'
  },

  // --- Physical Exercise & Fitness ---
  'zone_2_cardio': {
    unit: 'mins',
    starter_dose: 30,
    personalized_target_dose: 45,
    blueprint_dose: 60,
    literature_range: { min: 30, max: 90, outlier_upper: 120 },
    starter_notes: '30 minutes 3x per week at nasal-breathing pace (60-70% Max HR).',
    recommended_notes: '45-60 minutes 3-4x per week (150-180 mins total) optimizes mitochondrial density and lactate clearance.',
    blueprint_notes: '60 minutes Zone 2 cardio 4x per week.'
  },
  'vo2_max_hiit_training': {
    unit: 'mins',
    starter_dose: 15,
    personalized_target_dose: 30,
    blueprint_dose: 30,
    literature_range: { min: 15, max: 45, outlier_upper: 60 },
    starter_notes: '4x 2-minute hard efforts at >90% Max HR with 2-minute recovery (15 mins total).',
    recommended_notes: 'Norwegian 4x4 protocol (4x 4-min efforts @ 90-95% HRmax with 3-min active rest) 1-2x per week.',
    blueprint_notes: '30 minutes 4x4 HIIT training once weekly.'
  },
  'running': {
    unit: 'mins',
    starter_dose: 20,
    personalized_target_dose: 35,
    blueprint_dose: 45,
    literature_range: { min: 20, max: 60, outlier_upper: 90 },
    starter_notes: '20 minutes easy conversational run to build musculoskeletal tendon stiffness.',
    recommended_notes: '35-45 minutes structured aerobic run 3x weekly.',
    blueprint_notes: '45 minutes aerobic run.'
  },
  'bfr_training': {
    unit: 'mins',
    starter_dose: 15,
    personalized_target_dose: 20,
    blueprint_dose: 25,
    literature_range: { min: 10, max: 30, outlier_upper: 40 },
    starter_notes: '15 minutes using 40-50% arterial occlusion pressure on limbs with 20-30% 1RM light weights.',
    recommended_notes: '20 minutes 30-15-15-15 rep scheme induces systemic growth hormone surge without joint strain.',
    blueprint_notes: '20 minutes BFR occlusion training.'
  },
  'hyperbaric_oxygen_therapy_hbot': {
    unit: 'mins',
    starter_dose: 60,
    personalized_target_dose: 90,
    blueprint_dose: 90,
    literature_range: { min: 60, max: 90, outlier_upper: 120 },
    starter_notes: '60 minutes at 1.5-2.0 ATA in 100% oxygen chamber.',
    recommended_notes: '90 minutes (with 5-min air breaks) protocol evaluated in Shai Efrati telomere extension trials.',
    blueprint_notes: '90 minutes HBOT session.'
  },

  // --- Thermal & Environmental ---
  'sauna_exposure': {
    unit: 'mins',
    starter_dose: 15,
    personalized_target_dose: 20,
    blueprint_dose: 20,
    literature_range: { min: 15, max: 30, outlier_upper: 45 },
    starter_notes: '15 minutes at 160°F-175°F (70°C-80°C) to induce Heat Shock Proteins (HSP70).',
    recommended_notes: '20 minutes at 174°F+ (80°C+) 4-7x per week shown in Kuopio Study to lower all-cause mortality by 40%.',
    blueprint_notes: '20 minutes Finnish sauna at 180°F.'
  },
  'cold_plunge': {
    unit: 'mins',
    starter_dose: 2,
    personalized_target_dose: 3,
    blueprint_dose: 3,
    literature_range: { min: 1, max: 5, outlier_upper: 10 },
    starter_notes: '2 minutes at 50°F-55°F (10°C-13°C) to activate norepinephrine release.',
    recommended_notes: '11 minutes total weekly exposure (split across 3-4 sessions of 3 mins) to stimulate brown adipose thermogenesis.',
    blueprint_notes: '3 minutes cold immersion at 48°F.'
  },
  'red_light_photobiomodulation_therapy': {
    unit: 'mins',
    starter_dose: 10,
    personalized_target_dose: 15,
    blueprint_dose: 20,
    literature_range: { min: 10, max: 20, outlier_upper: 30 },
    starter_notes: '10 minutes at 660nm red / 850nm near-infrared wavelengths (10-20cm distance).',
    recommended_notes: '15-20 minutes daily stimulates cytochrome c oxidase in mitochondrial membrane.',
    blueprint_notes: '20 minutes full-body LED panel exposure.'
  },

  // --- Nutrition & Organ Health ---
  'epa_dha_omega3': {
    unit: 'g',
    starter_dose: 1,
    personalized_target_dose: 2,
    blueprint_dose: 3,
    literature_range: { min: 1, max: 4, outlier_upper: 6 },
    starter_notes: '1g combined EPA/DHA to support vascular endothelial function.',
    recommended_notes: '2-3g combined EPA/DHA raises Omega-3 Index >8% to reduce cardiovascular and inflammatory mortality.',
    blueprint_notes: '3g high-potency molecularly distilled EPA/DHA.'
  },
  'vitamin_d3_k2': {
    unit: 'IU',
    starter_dose: 2000,
    personalized_target_dose: 5000,
    blueprint_dose: 5000,
    literature_range: { min: 1000, max: 5000, outlier_upper: 10000 },
    starter_notes: '2,000 IU D3 + 90mcg K2-MK7 daily with breakfast fat.',
    recommended_notes: '5,000 IU D3 + 100mcg K2-MK7 maintains optimal serum 25(OH)D levels between 50-70 ng/mL.',
    blueprint_notes: '5,000 IU Vitamin D3 + 100mcg K2.'
  }
};

async function seedAllDosageProfiles() {
  console.log('Seeding dosage profiles across all database modalities...');

  // Fetch all modalities
  const { data: modalities, error } = await supabase.from('modalities').select('id, name, dose_or_exposure, relationships');
  if (error) {
    console.error('Error fetching modalities:', error);
    process.exit(1);
  }

  let updatedCount = 0;

  for (const mod of modalities) {
    const existingRel = mod.relationships || {};
    let profile = DOSAGE_PROFILES[mod.id];

    // If no explicit profile defined in master dictionary, auto-parse from dose_or_exposure text!
    if (!profile) {
      const doseStr = mod.dose_or_exposure || '';
      const numbers = (doseStr.match(/\d+([.,]\d+)?/g) || []).map(n => parseFloat(n.replace(',', '.')));
      
      let unit = 'mg';
      if (/mcg/i.test(doseStr)) unit = 'mcg';
      else if (/iu/i.test(doseStr)) unit = 'IU';
      else if (/ml/i.test(doseStr)) unit = 'mL';
      else if (/tbsp|tablespoon/i.test(doseStr)) unit = 'tbsp';
      else if (/\bg\b/i.test(doseStr) && !/mg/i.test(doseStr)) unit = 'g';
      else if (/min|minute/i.test(doseStr)) unit = 'mins';
      else if (/hr|hour/i.test(doseStr)) unit = 'hours';
      else if (/session|cycle|round/i.test(doseStr)) unit = 'sessions';

      if (numbers.length >= 2) {
        const minVal = Math.min(numbers[0], numbers[1]);
        const maxVal = Math.max(numbers[0], numbers[1]);
        const midVal = Math.round((minVal + maxVal) / 2);
        profile = {
          unit,
          starter_dose: minVal,
          personalized_target_dose: midVal,
          blueprint_dose: maxVal,
          literature_range: { min: minVal, max: maxVal, outlier_upper: Math.round(maxVal * 1.5) },
          starter_notes: `Conservative starter dose of ${minVal} ${unit} to check individual tolerance.`,
          recommended_notes: `Standard evidence-backed dose of ${midVal} ${unit} based on clinical literature.`,
          blueprint_notes: `Upper literature boundary dose of ${maxVal} ${unit}.`
        };
      } else if (numbers.length === 1) {
        const val = numbers[0];
        const minVal = Math.round(val * 0.5);
        const maxVal = Math.round(val * 1.5);
        profile = {
          unit,
          starter_dose: minVal,
          personalized_target_dose: val,
          blueprint_dose: val,
          literature_range: { min: minVal > 0 ? minVal : 1, max: maxVal, outlier_upper: Math.round(val * 2) },
          starter_notes: `Starter dosage of ${minVal} ${unit} to evaluate personal tolerance.`,
          recommended_notes: `Personalized target dose of ${val} ${unit} for optimal effect.`,
          blueprint_notes: `Standard protocol dose of ${val} ${unit}.`
        };
      } else {
        // Fallback for non-numeric exposures
        profile = {
          unit: 'exposure',
          starter_dose: 1,
          personalized_target_dose: 1,
          blueprint_dose: 1,
          literature_range: { min: 1, max: 1, outlier_upper: 2 },
          starter_notes: 'Starter exposure guideline.',
          recommended_notes: 'Standard personalized reference guideline.',
          blueprint_notes: 'Standard protocol reference guideline.'
        };
      }
    }

    const newRelationships = {
      ...existingRel,
      dosage_profile: profile
    };

    const { error: updateError } = await supabase
      .from('modalities')
      .update({ relationships: newRelationships })
      .eq('id', mod.id);

    if (updateError) {
      console.error(`❌ Error updating ${mod.id}:`, updateError.message);
    } else {
      updatedCount++;
      console.log(`✅ Updated dosage profile for: ${mod.id} (${profile.starter_dose} - ${profile.blueprint_dose} ${profile.unit})`);
    }
  }

  console.log(`\n🎉 Successfully updated dosage profiles for ALL ${updatedCount} modalities!`);
}

seedAllDosageProfiles();
