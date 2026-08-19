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

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditDetail() {
  const { data: modalities, error } = await supabase.from('modalities').select('*');
  if (error) {
    console.error('Error fetching modalities:', error);
    return;
  }

  const badUnits = [];
  const missingTiming = [];

  modalities.forEach(mod => {
    const name = mod.name || mod.display_name || mod.id;
    const cat = (mod.category || '').toLowerCase();
    const type = (mod.modality_type || '').toLowerCase();
    const unit = (mod.dosage_unit || '').toLowerCase();
    const timing = mod.timing_preference || mod.preferred_time || mod.optimal_timing || mod.timing_window || mod.timing || mod.cadence_layer;

    const isNonPillModality = cat.includes('fitness') || cat.includes('physical') || cat.includes('cardio') || cat.includes('strength') || cat.includes('breath') || cat.includes('mind') || cat.includes('sleep') || cat.includes('diagnostic') || cat.includes('tracking') || type.includes('exercise') || type.includes('physical') || type.includes('habit') || type.includes('breathwork') || type.includes('meditation') || type.includes('diagnostic_test') || name.toLowerCase().includes('handstand') || name.toLowerCase().includes('walk') || name.toLowerCase().includes('sauna') || name.toLowerCase().includes('plunge') || name.toLowerCase().includes('cold') || name.toLowerCase().includes('breathing') || name.toLowerCase().includes('scan') || name.toLowerCase().includes('cpet') || name.toLowerCase().includes('mri');

    if (isNonPillModality && (unit === 'mg' || unit === 'g' || unit === 'mcg' || unit === 'iu' || !unit)) {
      badUnits.push({
        id: mod.id,
        name,
        category: mod.category,
        type: mod.modality_type,
        current_unit: mod.dosage_unit,
        default_dosage: mod.default_dosage,
        literature_min: mod.literature_min,
        literature_max: mod.literature_max
      });
    }

    if (!timing || timing === 'null' || timing === 'undefined') {
      missingTiming.push({ id: mod.id, name, category: mod.category });
    }
  });

  console.log(`=== BAD DOSAGE UNITS (${badUnits.length}) ===`);
  badUnits.forEach(u => {
    console.log(`ID: "${u.id}" | Name: "${u.name}" | Current Unit: "${u.current_unit}" | Dose: ${u.default_dosage} (${u.literature_min}-${u.literature_max}) | Cat: "${u.category}"`);
  });

  console.log(`\n=== MISSING TIMING (${missingTiming.length}) ===`);
  missingTiming.forEach(t => {
    console.log(`ID: "${t.id}" | Name: "${t.name}" | Cat: "${t.category}"`);
  });
}

auditDetail();
