const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

const mods = JSON.parse(fs.readFileSync('all_modalities.json', 'utf8'));

async function syncAll() {
  console.log('Syncing all updated modalities to Supabase Cloud DB...');
  let count = 0;
  for (const mod of mods) {
    if (mod.mechanism_of_action && mod.mechanism_of_action.length > 50) {
      const payload = {
        id: mod.id,
        slug: mod.slug || mod.id,
        name: mod.name,
        display_name: mod.display_name || mod.name,
        category: mod.category,
        brief_description: mod.brief_description,
        dose_or_exposure: mod.dose_or_exposure,
        timing_summary: mod.timing_summary,
        instructions: mod.instructions,
        evidence_summary: mod.evidence_summary || mod.mechanism_of_action,
        mechanism_of_action: mod.mechanism_of_action
      };
      const { error } = await supabase.from('modalities').upsert(payload, { onConflict: 'id' });
      if (error) console.error('Error syncing:', mod.id, error.message);
      else {
        count++;
        console.log(`Synced to Supabase: "${mod.id}" (${mod.mechanism_of_action.length} chars)`);
      }
    }
  }
  console.log(`Successfully synced ${count} rich modality records to Supabase!`);
}

syncAll();
