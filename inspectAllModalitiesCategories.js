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

async function inspect() {
  const { data: modalities, error } = await supabase.from('modalities').select('*');
  if (error) {
    console.error('Error fetching modalities:', error);
    return;
  }

  console.log(`Total Modalities in Database: ${modalities.length}\n`);

  const mainCategoryMatches = {
    fitness: [],
    nutrition: [],
    sleep: [],
    mind: [],
    other: []
  };

  const unmapped = [];

  modalities.forEach(mod => {
    const name = mod.name || mod.display_name || '';
    const cat = (mod.category || '').toLowerCase();
    const type = (mod.modality_type || '').toLowerCase();
    const desc = (mod.brief_description || '').toLowerCase();

    // Check Fitness
    const isFitness = cat.includes('fitness') || cat.includes('physical') || cat.includes('cardio') || cat.includes('strength') || cat.includes('workout') || cat.includes('exercise') || cat.includes('movement') || cat.includes('endurance') || cat.includes('hiit') || cat.includes('vo2') || cat.includes('aerobic') || cat.includes('resistance') || name.toLowerCase().includes('vo2') || name.toLowerCase().includes('hiit') || name.toLowerCase().includes('cpet') || name.toLowerCase().includes('sprint') || name.toLowerCase().includes('zone 2') || name.toLowerCase().includes('strength') || name.toLowerCase().includes('lifting') || name.toLowerCase().includes('walk');

    // Check Nutrition
    const isNutrition = cat.includes('nutrition') || cat.includes('supplement') || cat.includes('biochemistry') || cat.includes('fasting') || cat.includes('diet') || type.includes('supplement') || type.includes('fasting') || name.toLowerCase().includes('supplement') || name.toLowerCase().includes('fasting');

    // Check Sleep
    const isSleep = cat.includes('sleep') || cat.includes('circadian') || cat.includes('recovery') || cat.includes('photobiomodulation') || name.toLowerCase().includes('sleep') || name.toLowerCase().includes('sauna') || name.toLowerCase().includes('light');

    // Check Mind
    const isMind = cat.includes('mind') || cat.includes('mental') || cat.includes('nervous') || cat.includes('breath') || cat.includes('meditation') || cat.includes('cognitive') || name.toLowerCase().includes('breath') || name.toLowerCase().includes('meditat');

    // Check Other / Diagnostics
    const isOther = cat.includes('diagnostic') || cat.includes('tracking') || cat.includes('screening') || cat.includes('cellular') || cat.includes('longevity') || cat.includes('environmental') || cat.includes('skin');

    console.log(`[${mod.id}] "${name}" | Cat: "${mod.category}" | Type: "${mod.modality_type}"`);
    console.log(`  -> Flags: Fitness=${isFitness}, Nutrition=${isNutrition}, Sleep=${isSleep}, Mind=${isMind}, Other=${isOther}`);

    let assigned = false;
    if (isFitness) { mainCategoryMatches.fitness.push(name); assigned = true; }
    if (isNutrition) { mainCategoryMatches.nutrition.push(name); assigned = true; }
    if (isSleep) { mainCategoryMatches.sleep.push(name); assigned = true; }
    if (isMind) { mainCategoryMatches.mind.push(name); assigned = true; }
    if (isOther || !assigned) { mainCategoryMatches.other.push(name); }
  });

  console.log('\n--- Summary Counts ---');
  console.log(`Fitness: ${mainCategoryMatches.fitness.length}`);
  console.log(`Nutrition: ${mainCategoryMatches.nutrition.length}`);
  console.log(`Sleep: ${mainCategoryMatches.sleep.length}`);
  console.log(`Mind: ${mainCategoryMatches.mind.length}`);
  console.log(`Other: ${mainCategoryMatches.other.length}`);
}

inspect();
