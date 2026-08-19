const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// 1. Read env vars
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

function determineEffortLevel(mod) {
  const text = (
    (mod.name || '') + ' ' +
    (mod.display_name || '') + ' ' +
    (mod.category || '') + ' ' +
    (mod.brief_description || '') + ' ' +
    (mod.instructions || '') + ' ' +
    (mod.id || '')
  ).toLowerCase();

  // LEVEL 5: Intensive / Multi-Day / Clinical / Reconstitution
  if (
    text.includes('fasting-mimicking') ||
    text.includes('5-day') ||
    text.includes('prolonged fast') ||
    text.includes('water fast') ||
    text.includes('72-hour') ||
    text.includes('72h') ||
    text.includes('fisetin senolytic') ||
    text.includes('dasatinib') ||
    text.includes('senolytic blast') ||
    text.includes('peptide reconstitution') ||
    text.includes('subcutaneous') ||
    text.includes('injection') ||
    text.includes('bpc-157') ||
    text.includes('tb-500') ||
    text.includes('epithalon') ||
    text.includes('hbot') ||
    text.includes('hyperbaric') ||
    text.includes('phlebotomy') ||
    text.includes('blood donation') ||
    text.includes('rapamycin')
  ) {
    return 'level_5';
  }

  // LEVEL 4: High Hormesis & Prep (Intense physical discomfort, gym gear, ice/sauna setup)
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

  // LEVEL 3: Moderate Effort (15–45 min, dedicated time block, light equipment)
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
    text.includes('20:4') ||
    text.includes('omad') ||
    text.includes('sitting-rising')
  ) {
    return 'level_3';
  }

  // LEVEL 2: Low-Friction Routine (2–10 min, habit stacked onto meals/morning)
  if (
    text.includes('supplement') ||
    text.includes('pill') ||
    text.includes('capsule') ||
    text.includes('stack') ||
    text.includes('nmn') ||
    text.includes('resveratrol') ||
    text.includes('omega-3') ||
    text.includes('fish oil') ||
    text.includes('tmg') ||
    text.includes('magnesium') ||
    text.includes('apigenin') ||
    text.includes('glycine') ||
    text.includes('curcumin') ||
    text.includes('berberine') ||
    text.includes('vitamin d') ||
    text.includes('k2') ||
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

  // LEVEL 1: Frictionless Micro-Habits (0–2 min, zero prep, anywhere)
  return 'level_1';
}

async function run() {
  console.log('Fetching all modalities from remote Supabase...');
  const { data: modalities, error } = await supabase.from('modalities').select('*');

  if (error || !modalities) {
    console.error('Error fetching modalities:', error);
    process.exit(1);
  }

  console.log(`Found ${modalities.length} modalities.`);
  let countL1 = 0, countL2 = 0, countL3 = 0, countL4 = 0, countL5 = 0;
  const updates = [];
  const sqlStatements = [];

  modalities.forEach(mod => {
    const newEffort = determineEffortLevel(mod);
    if (newEffort === 'level_1') countL1++;
    if (newEffort === 'level_2') countL2++;
    if (newEffort === 'level_3') countL3++;
    if (newEffort === 'level_4') countL4++;
    if (newEffort === 'level_5') countL5++;

    updates.push({
      id: mod.id,
      name: mod.name || mod.display_name,
      old_effort: mod.effort_level,
      new_effort: newEffort
    });

    sqlStatements.push(`UPDATE modalities SET effort_level = '${newEffort}' WHERE id = '${mod.id}';`);
  });

  console.log('\n--- 1–5 Effort Re-Evaluation Distribution ---');
  console.log(`Level 1 (Frictionless Micro-Habits): ${countL1}`);
  console.log(`Level 2 (Low-Friction Routines):     ${countL2}`);
  console.log(`Level 3 (Moderate Time Blocks):     ${countL3}`);
  console.log(`Level 4 (High Hormesis & Prep):     ${countL4}`);
  console.log(`Level 5 (Intensive / Multi-Day):    ${countL5}`);
  console.log(`Total Evaluated:                    ${modalities.length}\n`);

  // Write SQL script for backup and remote execution
  fs.writeFileSync('scripts/update_modalities_effort_1to5.sql', sqlStatements.join('\n'));
  fs.writeFileSync('scripts/modalities_effort_audit_results.json', JSON.stringify(updates, null, 2));

  console.log('Writing updates to Supabase modalities table in batches...');
  for (let i = 0; i < updates.length; i += 20) {
    const batch = updates.slice(i, i + 20);
    for (const item of batch) {
      await supabase.from('modalities').update({ effort_level: item.new_effort }).eq('id', item.id);
    }
    console.log(`Updated batch ${Math.floor(i / 20) + 1} of ${Math.ceil(updates.length / 20)}`);
  }

  console.log('✓ Successfully re-evaluated and synchronized all modalities with the robust 1–5 Effort Matrix!');
}

run();
