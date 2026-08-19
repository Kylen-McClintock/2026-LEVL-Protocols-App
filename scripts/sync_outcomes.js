const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
  const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];
  const sb = createClient(url, key);

  // 1. Fetch existing dimensions
  const { data: dims } = await sb.from('outcome_dimensions').select('*');
  const existingNames = new Set(dims.map(d => d.name));

  // 2. Fetch all modalities and gather unique impacts
  const { data: mods } = await sb.from('modalities').select('functional_impacts');
  const allImpacts = new Set();
  mods.forEach(m => {
    if (m.functional_impacts) {
      Object.keys(m.functional_impacts).forEach(k => allImpacts.add(k));
    }
  });

  // 3. Find missing ones
  const missing = Array.from(allImpacts).filter(name => !existingNames.has(name));
  
  if (missing.length === 0) {
    console.log('No missing outcomes to insert.');
    return;
  }

  console.log('Inserting missing outcomes:', missing);

  // 4. Insert them
  const records = missing.map(name => ({
    id: name.toLowerCase().replace(/\s+/g, '_'),
    name: name,
    is_default_wellbeing: false,
    is_contextual: false
  }));

  const { error } = await sb.from('outcome_dimensions').insert(records);
  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Successfully inserted missing outcomes!');
  }
}

run();
