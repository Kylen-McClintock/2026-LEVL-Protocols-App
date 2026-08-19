const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];
const sb = createClient(url, key);

async function run() {
  const premiumKeywords = [
    'plasmapheresis',
    'hyperbaric',
    'stem cell',
    'exosome',
    'follistatin',
    'mots-c',
    'prenuvo',
    'mri',
    'dexa',
    'vo2 max testing',
    'nad+ iv',
    'peptide',
    'cryotherapy'
  ];

  let totalUpdated = 0;

  for (const keyword of premiumKeywords) {
    const { data: matches } = await sb
      .from('modalities')
      .select('id, name, cost_tier')
      .ilike('name', `%${keyword}%`);
    
    if (matches && matches.length > 0) {
      for (const match of matches) {
        if (match.cost_tier !== 'premium' && match.cost_tier !== 'high') {
          console.log(`Updating ${match.name} to 'premium' (was ${match.cost_tier})`);
          await sb.from('modalities').update({ cost_tier: 'premium' }).eq('id', match.id);
          totalUpdated++;
        }
      }
    }
  }

  // Also catch by slug just in case
  const specificIds = [
    'hyperbaric_oxygen_therapy_hbot',
    'plasmapheresis_therapeutic_plasma_exchange',
    'prenuvo_scan',
    'full_body_mri'
  ];

  for (const id of specificIds) {
    const { data: match } = await sb.from('modalities').select('id, name, cost_tier').eq('id', id).single();
    if (match && match.cost_tier !== 'premium' && match.cost_tier !== 'high') {
       console.log(`Updating specific ID ${match.name} to 'premium' (was ${match.cost_tier})`);
       await sb.from('modalities').update({ cost_tier: 'premium' }).eq('id', match.id);
       totalUpdated++;
    }
  }

  console.log(`Finished. Updated ${totalUpdated} modalities.`);
}

run();
