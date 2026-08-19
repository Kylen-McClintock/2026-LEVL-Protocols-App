const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Read env vars
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    envVars[key.trim()] = values.join('=').trim();
  }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function computeAccurateEffortLevel(mod) {
  const text = (
    (mod.name || '') + ' ' +
    (mod.display_name || '') + ' ' +
    (mod.category || '') + ' ' +
    (mod.brief_description || '') + ' ' +
    (mod.instructions || '') + ' ' +
    (mod.id || '')
  ).toLowerCase();

  // LEVEL 5: Intensive / Multi-Day / Clinical / Injections / Prolonged Fasting
  if (
    text.includes('fasting-mimicking') ||
    text.includes('5-day') ||
    text.includes('prolonged fast') ||
    text.includes('water fast') ||
    text.includes('48-hour') ||
    text.includes('48h') ||
    text.includes('72-hour') ||
    text.includes('72h') ||
    text.includes('73 hour') ||
    text.includes('73h') ||
    text.includes('fisetin senolytic') ||
    text.includes('dasatinib') ||
    text.includes('senolytic blast') ||
    text.includes('peptide reconstitution') ||
    text.includes('subcutaneous') ||
    text.includes('injection') ||
    text.includes('bpc-157') ||
    text.includes('tb-500') ||
    text.includes('epithalon') ||
    text.includes('mots-c') ||
    text.includes('hbot') ||
    text.includes('hyperbaric') ||
    text.includes('phlebotomy') ||
    text.includes('blood donation') ||
    text.includes('rapamycin')
  ) {
    return 'level_5';
  }

  // LEVEL 4: High Hormesis & Prep (Intense physical discomfort, gym gear, ice/sauna prep)
  if (
    text.includes('cold plunge') ||
    text.includes('ice bath') ||
    text.includes('cold water immersion') ||
    text.includes('heavy resistance') ||
    text.includes('weightlifting') ||
    text.includes('strength training') ||
    text.includes('hypertrophy') ||
    text.includes('vo2 max') ||
    text.includes('vo2max') ||
    text.includes('norwegian 4x4') ||
    text.includes('hiit') ||
    text.includes('cgm') ||
    text.includes('continuous glucose') ||
    text.includes('contrast therapy') ||
    text.includes('bfr training') ||
    text.includes('blood flow restriction')
  ) {
    return 'level_4';
  }

  // LEVEL 3: Moderate Effort (15–45 min, dedicated time block, light gear)
  if (
    text.includes('sauna') ||
    text.includes('hyperthermic') ||
    text.includes('zone 2') ||
    text.includes('steady-state cardio') ||
    text.includes('cycling') ||
    text.includes('jogging') ||
    text.includes('rucking') ||
    text.includes('red light') ||
    text.includes('photobiomodulation') ||
    text.includes('mobility') ||
    text.includes('foam roll') ||
    text.includes('stretching') ||
    text.includes('18:6') ||
    text.includes('20:4') ||
    text.includes('omad') ||
    text.includes('sitting-rising')
  ) {
    return 'level_3';
  }

  // LEVEL 2: Low-Friction Routine (2–10 min, habit stacked onto meals / bedtime routine)
  if (
    text.includes('stack') && !text.includes('creatine') ||
    text.includes('morning protocol box') ||
    text.includes('16:8') ||
    text.includes('plant diversity') ||
    text.includes('prebiotic fiber') ||
    text.includes('protein pulse') ||
    text.includes('box breath') ||
    text.includes('4-7-8') ||
    text.includes('physiological sigh') ||
    text.includes('nsdr') ||
    text.includes('meditation')
  ) {
    return 'level_2';
  }

  // LEVEL 1: Frictionless Micro-Habits & Single Pills (0–2 min, zero prep, anywhere)
  // Single pills/capsules/powders (K2, Sulforaphane, Glycine, Magnesium, Apigenin, Creatine, Taurine, Vitamin D3, TMG, etc.)
  return 'level_1';
}

function computeAccurateCostTier(mod) {
  const text = (
    (mod.name || '') + ' ' +
    (mod.display_name || '') + ' ' +
    (mod.category || '') + ' ' +
    (mod.id || '')
  ).toLowerCase();

  // PREMIUM ($10+/day or major clinical procedures / injectables)
  if (
    text.includes('peptides') ||
    text.includes('bpc-157') ||
    text.includes('tb-500') ||
    text.includes('epithalon') ||
    text.includes('mots-c') ||
    text.includes('hbot') ||
    text.includes('hyperbaric') ||
    text.includes('plasmapheresis') ||
    text.includes('stem cell') ||
    text.includes('cryotherapy chamber')
  ) {
    return 'premium';
  }

  // HIGH ($3–$10/day)
  if (
    text.includes('urolithin a') ||
    text.includes('mitopure') ||
    text.includes('cgm') ||
    text.includes('continuous glucose') ||
    text.includes('nad+ injection') ||
    text.includes('ca-akg') ||
    text.includes('calcium alpha-ketoglutarate') ||
    text.includes('rapamycin') ||
    text.includes('dasatinib')
  ) {
    return 'high';
  }

  // MODERATE ($1–$3/day)
  if (
    text.includes('nmn') ||
    text.includes('nicotinamide mononucleotide') ||
    text.includes('nr') ||
    text.includes('nicotinamide riboside') ||
    text.includes('resveratrol') ||
    text.includes('spermidine') ||
    text.includes('sulforaphane') ||
    text.includes('broc精英') ||
    text.includes('curcumin') ||
    text.includes('berberine') ||
    text.includes('quercetin') ||
    text.includes('fisetin') ||
    text.includes('apigenin') ||
    text.includes('coq10') ||
    text.includes('ubiquinol') ||
    text.includes('ashwagandha') ||
    text.includes('hyaluronic acid') ||
    text.includes('collagen peptides') ||
    text.includes('red light')
  ) {
    return 'moderate';
  }

  // FREE ($0/day) - Natural behaviors, habits, sunlight, water, breath, fasting
  if (
    text.includes('sunlight') ||
    text.includes('morning light') ||
    text.includes('hydration') ||
    text.includes('water') && !text.includes('creatine') ||
    text.includes('fasting') ||
    text.includes('fast') ||
    text.includes('walk') ||
    text.includes('breath') ||
    text.includes('sigh') ||
    text.includes('sleep environment') ||
    text.includes('dark & cool') ||
    text.includes('blue light') ||
    text.includes('stretching') ||
    text.includes('mobility') ||
    text.includes('cold shower')
  ) {
    return 'free';
  }

  // LOW (<$1/day) - Default bulk vitamins, minerals, creatine, taurine, electrolytes
  return 'low';
}

function computeAccurateHallmarks(mod) {
  const text = (
    (mod.name || '') + ' ' +
    (mod.display_name || '') + ' ' +
    (mod.category || '') + ' ' +
    (mod.mechanism_of_action || '') + ' ' +
    (mod.brief_description || '') + ' ' +
    (mod.id || '')
  ).toLowerCase();

  const hallmarks = new Set();

  // 1. Mitochondrial Dysfunction
  if (
    text.includes('mitochondri') ||
    text.includes('urolithin') ||
    text.includes('mitopure') ||
    text.includes('nmn') ||
    text.includes('nad') ||
    text.includes('coq10') ||
    text.includes('pqq') ||
    text.includes('zone 2') ||
    text.includes('cardio') ||
    text.includes('cold plunge') ||
    text.includes('sauna') ||
    text.includes('mots-c') ||
    text.includes('creatine')
  ) {
    hallmarks.add('Mitochondrial Dysfunction');
  }

  // 2. Cellular Senescence
  if (
    text.includes('senolyt') ||
    text.includes('senescen') ||
    text.includes('fisetin') ||
    text.includes('quercetin') ||
    text.includes('dasatinib') ||
    text.includes('sasp') ||
    text.includes('apigenin') ||
    text.includes('curcumin')
  ) {
    hallmarks.add('Cellular Senescence');
  }

  // 3. Epigenetic Alterations
  if (
    text.includes('epigenet') ||
    text.includes('sirtuin') ||
    text.includes('sirt1') ||
    text.includes('resveratrol') ||
    text.includes('tmg') ||
    text.includes('methyl') ||
    text.includes('nmn') ||
    text.includes('exercise') ||
    text.includes('fasting')
  ) {
    hallmarks.add('Epigenetic Alterations');
  }

  // 4. Loss of Proteostasis
  if (
    text.includes('proteostas') ||
    text.includes('heat shock') ||
    text.includes('hsp70') ||
    text.includes('sauna') ||
    text.includes('autophagy') ||
    text.includes('protein fold') ||
    text.includes('spermidine') ||
    text.includes('trehalose')
  ) {
    hallmarks.add('Loss of Proteostasis');
  }

  // 5. Deregulated Nutrient Sensing
  if (
    text.includes('nutrient sens') ||
    text.includes('mtor') ||
    text.includes('ampk') ||
    text.includes('insulin') ||
    text.includes('glucose') ||
    text.includes('berberine') ||
    text.includes('metformin') ||
    text.includes('fasting') ||
    text.includes('16:8') ||
    text.includes('cgm')
  ) {
    hallmarks.add('Deregulated Nutrient Sensing');
  }

  // 6. Chronic Inflammation
  if (
    text.includes('inflamm') ||
    text.includes('omega-3') ||
    text.includes('epa') ||
    text.includes('dha') ||
    text.includes('curcumin') ||
    text.includes('cold plunge') ||
    text.includes('glycine') ||
    text.includes('apigenin') ||
    text.includes('sulforaphane') ||
    text.includes('nf-kb') ||
    text.includes('crp')
  ) {
    hallmarks.add('Chronic Inflammation');
  }

  // 7. Disabled Macroautophagy
  if (
    text.includes('autophagy') ||
    text.includes('fasting') ||
    text.includes('72h') ||
    text.includes('48h') ||
    text.includes('fmd') ||
    text.includes('spermidine') ||
    text.includes('urolithin')
  ) {
    hallmarks.add('Disabled Macroautophagy');
  }

  // 8. Genomic Instability
  if (
    text.includes('dna repair') ||
    text.includes('parp') ||
    text.includes('genomic') ||
    text.includes('sulforaphane') ||
    text.includes('nrf2') ||
    text.includes('melatonin') ||
    text.includes('nmn')
  ) {
    hallmarks.add('Genomic Instability');
  }

  // 9. Telomere Attrition
  if (
    text.includes('telomer') ||
    text.includes('epithalon') ||
    text.includes('epitalon') ||
    text.includes('ta-65') ||
    text.includes('astragalus') ||
    text.includes('endurance')
  ) {
    hallmarks.add('Telomere Attrition');
  }

  // 10. Stem Cell Exhaustion
  if (
    text.includes('stem cell') ||
    text.includes('refeeding') ||
    text.includes('bpc-157') ||
    text.includes('resistance training') ||
    text.includes('hypertrophy')
  ) {
    hallmarks.add('Stem Cell Exhaustion');
  }

  // 11. Dysbiosis
  if (
    text.includes('microbiome') ||
    text.includes('gut') ||
    text.includes('plant diversity') ||
    text.includes('fiber') ||
    text.includes('probiotic') ||
    text.includes('polyphenol') ||
    text.includes('dysbiosis')
  ) {
    hallmarks.add('Dysbiosis');
  }

  // 12. Altered Intercellular Communication
  if (
    text.includes('intercellular') ||
    text.includes('circadian') ||
    text.includes('sunlight') ||
    text.includes('sleep') ||
    text.includes('peptides') ||
    text.includes('hormone')
  ) {
    hallmarks.add('Altered Intercellular Communication');
  }

  if (hallmarks.size === 0) {
    hallmarks.add('Altered Intercellular Communication');
    hallmarks.add('Mitochondrial Dysfunction');
  }

  return Array.from(hallmarks).slice(0, 3);
}

async function main() {
  console.log('Auditing all modalities in Supabase...');
  const { data: modalities, error } = await supabase.from('modalities').select('*');

  if (error || !modalities) {
    console.error('Error fetching modalities:', error);
    process.exit(1);
  }

  console.log(`Auditing ${modalities.length} modalities...`);
  const updates = [];
  const sqlStatements = [];

  modalities.forEach(mod => {
    const accurateEffort = computeAccurateEffortLevel(mod);
    const accurateCost = computeAccurateCostTier(mod);
    const accurateHallmarks = computeAccurateHallmarks(mod);

    updates.push({
      id: mod.id,
      name: mod.name || mod.display_name,
      effort: accurateEffort,
      cost: accurateCost,
      hallmarks: accurateHallmarks
    });

    sqlStatements.push(`UPDATE modalities SET effort_level = '${accurateEffort}', cost_tier = '${accurateCost}', hallmarks_of_aging_impact = '${JSON.stringify(accurateHallmarks)}'::jsonb WHERE id = '${mod.id}';`);
  });

  // Write SQL script backup
  fs.writeFileSync('scripts/audit_and_fix_modalities_costs_efforts_hallmarks.sql', sqlStatements.join('\n'));

  // Update in batches of 20
  for (let i = 0; i < updates.length; i += 20) {
    const batch = updates.slice(i, i + 20);
    for (const item of batch) {
      await supabase.from('modalities').update({
        effort_level: item.effort,
        cost_tier: item.cost,
        hallmarks_of_aging_impact: item.hallmarks
      }).eq('id', item.id);
    }
    console.log(`Updated batch ${Math.floor(i / 20) + 1} of ${Math.ceil(updates.length / 20)}`);
  }

  console.log('✓ Successfully audited and updated all modalities with accurate Effort Levels, Cost Tiers, and Hallmarks of Aging!');
}

main();
