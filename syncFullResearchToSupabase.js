const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

const allModalities = JSON.parse(fs.readFileSync('all_modalities.json', 'utf8'));

const targetIds = [
  'sauna_exposure', 'hyperthermic_sauna', 'cold_plunge', 'cold_water_immersion', 
  'soberg_reheating_principle', 'contrast_hydrotherapy', 'far_infrared_sauna',
  'cyclic_sighing', 'physiological_cyclic_sighing', '478_relaxing_breathing', 
  'four_seven_eight_breathing', 'box_breathing', 'tactical_box_breathing', 
  'resonance_frequency_breathing', 'hypoxic_breath_retentions',
  'single_leg_balance', 'single_leg_stance', 'chair_stand_30s', '30s_chair_stand',
  'sitting_rising_test', 'gait_speed', 'usual_gait_speed', 'handgrip_strength', 
  'grip_strength', 'spirometry_fev1', 'pef', 'bp_sys', 'bp_dia', 'resting_bp'
];

async function sync() {
  console.log('Syncing rich multi-paragraph research data to Supabase...');
  for (const id of targetIds) {
    const mod = allModalities.find(m => m.id === id);
    if (mod) {
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
      if (error) console.error('Error syncing:', id, error.message);
      else console.log('Successfully synced to Supabase:', id, `(${mod.mechanism_of_action?.length || 0} chars)`);
    }
  }
}

sync();
